// ============================================================
// HRM SYSTEM — Configurable Multi-Tier Approval Workflows Engine
// Supports 1-Tier, 2-Tier, and 3-Tier dynamic sign-off gates
// for Leaves, Expense Claims, and Exit Settlements.
// ============================================================

const WorkflowEngine = {
  // Default workflow configurations
  defaultChains: {
    leaves: {
      module: 'leaves',
      name: 'Leave Allocation & Vacation Approvals',
      tierCount: 2, // 1, 2, or 3
      tiers: [
        {
          tier: 1,
          role: 'dept_manager',
          roleName: 'Department Manager',
          label: 'Managerial Endorsement',
          actionRequired: 'endorse',
          statusPass: 'manager_approved',
          description: 'Departmental operational coverage check'
        },
        {
          tier: 2,
          role: 'hr_manager',
          roleName: 'HR Director / Superadmin',
          label: 'Corporate HR Authorization',
          actionRequired: 'approve',
          statusPass: 'approved',
          description: 'Quota deduction and policy compliance'
        },
        {
          tier: 3,
          role: 'superadmin',
          roleName: 'Executive Directorate',
          label: 'Executive Exception Signoff',
          actionRequired: 'approve',
          statusPass: 'approved',
          description: 'Extended leaves (> 5 days) signoff',
          thresholdField: 'days',
          thresholdValue: 5
        }
      ]
    },
    expenses: {
      module: 'expenses',
      name: 'Travel & Operational Expense Claims',
      tierCount: 2,
      tiers: [
        {
          tier: 1,
          role: 'dept_manager',
          roleName: 'Department Manager',
          label: 'Line Manager Verification',
          actionRequired: 'endorse',
          statusPass: 'pending_finance',
          description: 'Expense validity & business necessity review'
        },
        {
          tier: 2,
          role: 'hr_manager',
          roleName: 'Finance / HR Operations',
          label: 'Financial Audit & Authorization',
          actionRequired: 'authorize',
          statusPass: 'approved',
          description: 'Receipt audit & reimbursement clearance'
        },
        {
          tier: 3,
          role: 'superadmin',
          roleName: 'Chief Financial Officer / Superadmin',
          label: 'Executive Capital Sanction',
          actionRequired: 'sanction',
          statusPass: 'approved',
          description: 'High-value claims (> PKR 50,000)',
          thresholdField: 'amount',
          thresholdValue: 50000
        }
      ]
    },
    settlement: {
      module: 'settlement',
      name: 'Employee Exit & Final Settlement (F&F)',
      tierCount: 3,
      tiers: [
        {
          tier: 1,
          role: 'dept_manager',
          roleName: 'Department Manager',
          label: 'Handover & Knowledge Transfer Clearance',
          actionRequired: 'clear',
          statusPass: 'dept_cleared',
          description: 'Work handover and asset return verification'
        },
        {
          tier: 2,
          role: 'hr_manager',
          roleName: 'HR Compliance Officer',
          label: 'HR Policy & Notice Clearance',
          actionRequired: 'clear',
          statusPass: 'hr_cleared',
          description: 'Leave encashment, gratuity & policy audit'
        },
        {
          tier: 3,
          role: 'superadmin',
          roleName: 'Finance Director / Superadmin',
          label: 'Final Disbursal Authorization',
          actionRequired: 'disburse',
          statusPass: 'settled',
          description: 'Voucher payment and full & final sign-off'
        }
      ]
    }
  },

  getChain(module) {
    const customChains = (typeof DB !== 'undefined' ? DB.get('workflow_chains') : null) || {};
    return customChains[module] || this.defaultChains[module] || null;
  },

  saveChain(module, chainData) {
    if (typeof DB === 'undefined') return;
    const customChains = DB.get('workflow_chains') || {};
    customChains[module] = chainData;
    DB.set('workflow_chains', customChains);
    DB.log('UPDATE', 'Workflows', `Updated multi-tier approval chain for module: ${module}`, typeof Auth !== 'undefined' ? Auth.user?.id : 1);
  },

  // Determines next required gate and updates state
  advanceApproval(item, module, currentUser) {
    const chain = this.getChain(module);
    if (!chain) return { isFinalTier: true, updates: { status: 'approved' } };

    const maxTiers = chain.tierCount || 2;
    const currentTierIndex = (item.tierLevel || 1) - 1;
    const currentTier = chain.tiers[currentTierIndex] || chain.tiers[0];

    // Check if item reaches final tier for this configuration
    const isLastConfiguredTier = (item.tierLevel || 1) >= maxTiers;

    // Check threshold escalation if configured
    const nextTier = chain.tiers[currentTierIndex + 1];
    let needsEscalation = false;
    if (nextTier && nextTier.thresholdField && item[nextTier.thresholdField] >= (nextTier.thresholdValue || 0)) {
      needsEscalation = true;
    }

    if (isLastConfiguredTier && !needsEscalation) {
      return {
        isFinalTier: true,
        nextTierNum: maxTiers,
        updates: {
          status: 'approved',
          tierLevel: maxTiers,
          finalApprovedAt: new Date().toISOString(),
          finalApprovedBy: currentUser?.username || 'Executive',
          comments: `Final corporate approval granted by ${currentUser?.username || 'System'}`
        }
      };
    } else {
      const nextTierNum = (item.tierLevel || 1) + 1;
      return {
        isFinalTier: false,
        nextTierNum: nextTierNum,
        updates: {
          status: currentTier.statusPass || 'manager_approved',
          tierLevel: nextTierNum,
          lastEndorsedAt: new Date().toISOString(),
          lastEndorsedBy: currentUser?.username || 'Manager',
          comments: `Tier ${item.tierLevel || 1} endorsement granted by ${currentUser?.username || 'Approver'}. Forwarded to Tier ${nextTierNum}.`
        }
      };
    }
  },

  // Render visual progress stepper HTML for tables and cards
  renderStepperHTML(item, module) {
    const chain = this.getChain(module);
    if (!chain) return '';

    const maxTiers = chain.tierCount || 2;
    const currentTier = item.tierLevel || 1;
    const isApproved = item.status === 'approved' || item.status === 'settled';
    const isRejected = item.status === 'rejected';

    let steps = [];
    for (let i = 1; i <= maxTiers; i++) {
      const tierDef = chain.tiers[i - 1];
      const isDone = isApproved || currentTier > i;
      const isCurrent = !isApproved && !isRejected && currentTier === i;

      let color = '#94a3b8'; // text-3 / gray
      let icon = 'fa-circle';
      if (isDone) {
        color = '#10b981'; // success
        icon = 'fa-circle-check';
      } else if (isCurrent) {
        color = '#2563eb'; // primary / blue
        icon = 'fa-spinner fa-spin';
      }

      steps.push(`
        <span class="workflow-tier-pill" style="display:inline-flex;align-items:center;gap:3px;font-size:10.5px;color:${color};font-weight:700" title="Tier ${i}: ${tierDef?.label || 'Gate'}">
          <i class="fa ${icon}" style="font-size:9px"></i> T${i}
        </span>
      `);
    }

    return `
      <div class="workflow-stepper-wrap" style="display:inline-flex;align-items:center;gap:5px;background:var(--surface);padding:2px 7px;border-radius:12px;border:1px solid var(--border)">
        ${steps.join('<span style="font-size:8px;color:var(--text-3);opacity:0.6">›</span>')}
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.WorkflowEngine = WorkflowEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkflowEngine;
}
