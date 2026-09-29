// ============================================================
// HRM SYSTEM — Configurable Multi-Tier Approval Workflow Engine
// Supports 1-Tier, 2-Tier, and 3-Tier Chains for Leaves, Expenses, and Settlements
// ============================================================

var WorkflowEngine = (typeof window !== 'undefined' && window.WorkflowEngine) || {
  DEFAULT_CHAINS: {
    leaves: {
      module: 'leaves',
      name: 'Leave Approval Workflow',
      tierCount: 2,
      tiers: [
        { tier: 1, role: 'dept_manager', roleName: 'Department Manager', label: 'Direct Supervisor Endorsement', requiresComments: false },
        { tier: 2, role: 'hr_manager', roleName: 'HR Manager', label: 'HR Compliance & Quota Deduction', requiresComments: false },
        { tier: 3, role: 'superadmin', roleName: 'Corporate Director', label: 'Executive Sign-Off (Leaves > 5 Days)', thresholdField: 'days', thresholdValue: 5, enabled: false }
      ]
    },
    expenses: {
      module: 'expenses',
      name: 'Expense Claim & Travel Reimbursement Workflow',
      tierCount: 2,
      tiers: [
        { tier: 1, role: 'dept_manager', roleName: 'Department Manager', label: 'Receipt & Business Purpose Verification', requiresComments: false },
        { tier: 2, role: 'hr_manager', roleName: 'HR / Finance Accountant', label: 'Accounting Audit & Payroll Queue', requiresComments: false },
        { tier: 3, role: 'superadmin', roleName: 'Finance Director', label: 'Director Authorization (Claims > PKR 50,000)', thresholdField: 'amount', thresholdValue: 50000, enabled: false }
      ]
    },
    settlement: {
      module: 'settlement',
      name: 'Full & Final (F&F) Exit Settlement Workflow',
      tierCount: 3,
      tiers: [
        { tier: 1, role: 'dept_manager', roleName: 'Department Manager', label: 'Department Handover & Assets Clearance', requiresComments: true },
        { tier: 2, role: 'hr_manager', roleName: 'HR Manager', label: 'Pakistan Gratuity & Leave Encashment Audit', requiresComments: true },
        { tier: 3, role: 'superadmin', roleName: 'Director / Executive', label: 'Final Disbursal Voucher Release', requiresComments: true }
      ]
    }
  },

  getChains() {
    let chains = DB.get('workflow_chains');
    if (!chains || !chains.length) {
      chains = Object.values(this.DEFAULT_CHAINS);
      DB.set('workflow_chains', chains);
    }
    return chains;
  },

  getChain(module) {
    const chains = this.getChains();
    const found = chains.find(c => c.module === module);
    return found || this.DEFAULT_CHAINS[module] || { module, tierCount: 1, tiers: [{ tier: 1, role: 'hr_manager', label: 'Direct Approval' }] };
  },

  saveChain(module, chainData) {
    let chains = this.getChains();
    const idx = chains.findIndex(c => c.module === module);
    if (idx >= 0) {
      chains[idx] = { ...chains[idx], ...chainData, updatedAt: new Date().toISOString() };
    } else {
      chains.push({ ...chainData, module, updatedAt: new Date().toISOString() });
    }
    DB.set('workflow_chains', chains);
    DB.log('UPDATE', 'Workflows', `Updated multi-tier approval chain for ${module} (${chainData.tierCount}-Tier)`, Auth.user?.id);
    if (typeof Toast !== 'undefined') {
      Toast.show(`Approval workflow for ${module.toUpperCase()} successfully saved!`, 'success');
    }
  },

  // Evaluate active tiers for a specific request item (handles threshold escalation)
  getActiveTiers(item, module) {
    const chain = this.getChain(module);
    let activeTiers = chain.tiers.slice(0, chain.tierCount);
    
    // Check if Tier 3 threshold condition is triggered
    const tier3 = chain.tiers[2];
    if (tier3 && (tier3.enabled || chain.tierCount === 3)) {
      if (!activeTiers.some(t => t.tier === 3)) {
        if (tier3.thresholdField && tier3.thresholdValue) {
          const val = Number(item[tier3.thresholdField] || 0);
          if (val >= Number(tier3.thresholdValue)) {
            activeTiers.push(tier3);
          }
        } else {
          activeTiers.push(tier3);
        }
      }
    }
    return activeTiers;
  },

  // Returns current stage details
  getStageInfo(item, module) {
    const activeTiers = this.getActiveTiers(item, module);
    const totalTiers = activeTiers.length;
    const currentTierNum = Number(item.currentWorkflowTier || 1);

    if (item.status === 'rejected' || item.status === 'cancelled') {
      return {
        state: 'rejected',
        statusText: 'Rejected',
        currentTierNum,
        totalTiers,
        isCompleted: false,
        activeTiers
      };
    }

    if (item.status === 'approved' || item.status === 'disbursed' || item.status === 'reimbursed') {
      return {
        state: 'approved',
        statusText: 'Approved (All Tiers Complete)',
        currentTierNum: totalTiers,
        totalTiers,
        isCompleted: true,
        activeTiers
      };
    }

    // Pending stage
    const currentTier = activeTiers.find(t => t.tier === currentTierNum) || activeTiers[0];
    return {
      state: 'pending',
      statusText: `Pending Tier ${currentTierNum}: ${currentTier.roleName || currentTier.label}`,
      currentTierNum,
      currentTier,
      totalTiers,
      isCompleted: false,
      activeTiers
    };
  },

  canUserApprove(item, module, user = Auth.user) {
    if (!user) return false;
    if (item.status === 'approved' || item.status === 'rejected' || item.status === 'cancelled') return false;

    // Super Admin has universal override
    if (user.role === 'superadmin' || user.role === 'Super Admin') return true;

    const stageInfo = this.getStageInfo(item, module);
    if (stageInfo.isCompleted || stageInfo.state === 'rejected') return false;

    const reqRole = stageInfo.currentTier?.role;
    if (user.role === reqRole) return true;

    // HR Manager can act on behalf of HR tier
    if (user.role === 'hr_manager' && reqRole === 'hr_manager') return true;

    return false;
  },

  // Advance to next tier or finalize approval
  advanceApproval(item, module, user = Auth.user, comments = '') {
    const activeTiers = this.getActiveTiers(item, module);
    const totalTiers = activeTiers.length;
    const currentTierNum = Number(item.currentWorkflowTier || 1);
    const currentTier = activeTiers.find(t => t.tier === currentTierNum) || activeTiers[0];

    const auditHistory = item.workflowHistory || [];
    auditHistory.push({
      tier: currentTierNum,
      tierName: currentTier.roleName || currentTier.label,
      action: 'approved',
      actorId: user?.id,
      actorName: user?.fullName || user?.username,
      actorRole: user?.role,
      comments: comments || `Approved by ${user?.fullName || user?.username}`,
      timestamp: new Date().toISOString()
    });

    const isFinalTier = currentTierNum >= totalTiers;
    const nextTierNum = currentTierNum + 1;

    const updates = {
      workflowHistory: auditHistory,
      currentWorkflowTier: isFinalTier ? totalTiers : nextTierNum,
      updatedAt: new Date().toISOString()
    };

    if (isFinalTier) {
      updates.status = 'approved';
      updates.approvedOn = Utils.today ? Utils.today() : new Date().toISOString().split('T')[0];
      updates.approvedBy = user?.id;
    } else {
      updates.status = `tier_${currentTierNum}_approved`;
      updates.pendingRole = activeTiers.find(t => t.tier === nextTierNum)?.role || 'hr_manager';
    }

    // Trigger External Notification & Webhooks
    try {
      if (typeof Notifications !== 'undefined' && Notifications.dispatch) {
        Notifications.dispatch({
          event: isFinalTier ? `${module}.approved_final` : `${module}.tier_approved`,
          title: isFinalTier ? `${module.toUpperCase()} Fully Approved` : `Tier ${currentTierNum} Endorsed (${module})`,
          body: isFinalTier 
            ? `Request #${item.id} has received final corporate authorization.` 
            : `Request #${item.id} endorsed by ${user?.fullName || user?.username}. Advanced to Tier ${nextTierNum}.`,
          module: module,
          itemId: item.id,
          recipientRole: isFinalTier ? 'employee' : updates.pendingRole
        });
      }
    } catch(e) {
      console.warn('[WorkflowEngine] Notification dispatch notice:', e);
    }

    return {
      isFinalTier,
      nextTierNum,
      updates
    };
  },

  // Reject at current tier
  rejectWorkflow(item, module, user = Auth.user, reason = '') {
    const stageInfo = this.getStageInfo(item, module);
    const auditHistory = item.workflowHistory || [];
    
    auditHistory.push({
      tier: stageInfo.currentTierNum,
      tierName: stageInfo.currentTier?.roleName || 'Current Tier',
      action: 'rejected',
      actorId: user?.id,
      actorName: user?.fullName || user?.username,
      actorRole: user?.role,
      comments: reason || 'Request declined by approver.',
      timestamp: new Date().toISOString()
    });

    const updates = {
      status: 'rejected',
      rejectedBy: user?.id,
      rejectionReason: reason || 'Declined',
      workflowHistory: auditHistory,
      updatedAt: new Date().toISOString()
    };

    try {
      if (typeof Notifications !== 'undefined' && Notifications.dispatch) {
        Notifications.dispatch({
          event: `${module}.rejected`,
          title: `${module.toUpperCase()} Request Rejected`,
          body: `Request #${item.id} was rejected by ${user?.fullName || user?.username}: ${reason}`,
          module: module,
          itemId: item.id,
          recipientId: item.employeeId
        });
      }
    } catch(e) {}

    return updates;
  },

  // Render visual modern stepper for tables or modals
  renderStepperHTML(item, module) {
    const stage = this.getStageInfo(item, module);
    const activeTiers = stage.activeTiers;

    return `
      <div class="workflow-stepper-wrap" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700">
        ${activeTiers.map((t, idx) => {
          const isPassed = (item.status === 'approved' || item.status === 'disbursed' || item.status === 'reimbursed') || 
                           (Number(item.currentWorkflowTier || 1) > t.tier);
          const isCurrent = !isPassed && (item.status !== 'rejected') && (Number(item.currentWorkflowTier || 1) === t.tier);
          const isRejected = (item.status === 'rejected') && (Number(item.currentWorkflowTier || 1) === t.tier);

          const bg = isPassed ? 'rgba(16,185,129,0.15)' : (isRejected ? 'rgba(239,68,68,0.15)' : (isCurrent ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.1)'));
          const color = isPassed ? 'var(--success)' : (isRejected ? 'var(--danger)' : (isCurrent ? 'var(--warning)' : 'var(--text-3)'));
          const icon = isPassed ? 'fa-check' : (isRejected ? 'fa-xmark' : (isCurrent ? 'fa-clock' : 'fa-circle'));

          return `
            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:12px;background:${bg};color:${color};border:1px solid ${color}44" title="${t.label} (${t.roleName})">
              <i class="fa ${icon}" style="font-size:9.5px"></i>
              <span>T${t.tier}: ${t.role === 'dept_manager' ? 'Dept Mgr' : (t.role === 'hr_manager' ? 'HR' : 'Executive')}</span>
            </span>
            ${idx < activeTiers.length - 1 ? `<i class="fa fa-chevron-right" style="font-size:8px;color:var(--text-muted)"></i>` : ''}
          `;
        }).join('')}
      </div>
    `;
  }
};

window.WorkflowEngine = WorkflowEngine;
