// ============================================================
// HRM SYSTEM — Expense Claims & Travel Requisitions Reimbursement
// Batch 5: Multi-Category Claims, Approvals, Receipts & Payroll Bridge
// ============================================================

const Expenses = {
  activeTab: 'my_claims', // 'my_claims', 'approvals_queue', 'all_claims'
  filterCategory: 'all',
  filterStatus: 'all',

  render() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const role = Auth.role;
    const isEmp = role === 'employee';
    const isMgr = role === 'dept_manager';
    const isAdmin = role === 'superadmin' || role === 'hr_manager';

    if (isEmp && this.activeTab !== 'my_claims') {
      this.activeTab = 'my_claims';
    } else if (isMgr && this.activeTab === 'all_claims') {
      this.activeTab = 'approvals_queue';
    }

    const allClaims = DB.get('expense_claims') || [];
    const myEmpId = Auth.employee?.id;

    // Filter by role scope
    let accessibleClaims = allClaims;
    if (isEmp) {
      accessibleClaims = allClaims.filter(c => c.employeeId === myEmpId);
    } else if (isMgr) {
      // Dept Manager sees their own + reportees (employees reporting to him or in his dept)
      const deptEmps = (DB.get('employees') || []).filter(e => e.departmentId === Auth.employee?.departmentId || e.reportingManagerId === myEmpId).map(e => e.id);
      accessibleClaims = allClaims.filter(c => deptEmps.includes(c.employeeId) || c.employeeId === myEmpId);
    }

    // Analytics calculations
    const totalClaimed = accessibleClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    const pendingDisbursement = accessibleClaims.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.amount || 0), 0);
    const reimbursedTotal = accessibleClaims.filter(c => c.status === 'reimbursed').reduce((sum, c) => sum + (c.amount || 0), 0);
    const pendingApprovalCount = accessibleClaims.filter(c => c.status === 'pending_manager' || c.status === 'pending_finance').length;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:rgba(16,185,129,0.12);color:var(--success)">
              <i class="fa fa-receipt"></i>
            </span>
            Expense Claims &amp; Travel Reimbursements
          </h2>
          <div style="font-size:13px;color:var(--text-3);margin-top:4px">
            Business travel allowances, client hospitality, certifications, digital receipts, and payroll disbursement
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" onclick="Expenses.exportCSV()">
            <i class="fa fa-file-csv"></i> Export Claims
          </button>
          ${isAdmin ? `
            <button class="btn btn-outline btn-sm" style="color:var(--primary)" onclick="Expenses.syncApprovedToPayroll()">
              <i class="fa fa-money-bill-transfer"></i> 1-Click Sync to Payroll
            </button>
          ` : ''}
          <button class="btn btn-primary btn-sm" onclick="Expenses.showCreateModal()">
            <i class="fa fa-plus"></i> Submit Expense Claim
          </button>
        </div>
      </div>

      <!-- Overview KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Total Expenses Logged</div>
          <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:4px">₨ ${(totalClaimed).toLocaleString()}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${accessibleClaims.length} Claims Lodged</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Approved for Payout</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px">₨ ${(pendingDisbursement).toLocaleString()}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Queued for Next Payroll Run</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Reimbursed YTD</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:4px">₨ ${(reimbursedTotal).toLocaleString()}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Disbursed into Bank Accounts</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Pending Approvals</div>
          <div style="font-size:22px;font-weight:800;color:${pendingApprovalCount > 0 ? 'var(--warning)' : 'var(--text)'};margin-top:4px">${pendingApprovalCount} Claims</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Awaiting Manager / Finance Sign-off</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap">
        <button class="tab-toggle-btn ${this.activeTab==='my_claims'?'active':''}" onclick="Expenses.switchTab('my_claims')">
          <i class="fa fa-user" style="margin-right:6px"></i>My Claims (${accessibleClaims.filter(c => c.employeeId === myEmpId).length})
        </button>

        ${!isEmp ? `
          <button class="tab-toggle-btn ${this.activeTab==='approvals_queue'?'active':''}" onclick="Expenses.switchTab('approvals_queue')">
            <i class="fa fa-clipboard-check" style="margin-right:6px"></i>Approvals Queue
            ${pendingApprovalCount > 0 ? `<span class="badge badge-warning" style="margin-left:6px;font-size:10px">${pendingApprovalCount}</span>` : ''}
          </button>
        ` : ''}

        ${isAdmin ? `
          <button class="tab-toggle-btn ${this.activeTab==='all_claims'?'active':''}" onclick="Expenses.switchTab('all_claims')">
            <i class="fa fa-list-check" style="margin-right:6px"></i>Universal Ledger (${allClaims.length})
          </button>
        ` : ''}
      </div>

      <!-- Filter Toolbar -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select class="form-control" style="height:34px;font-size:12px;width:160px" onchange="Expenses.filterCategory=this.value;Expenses.renderTable()">
            <option value="all">All Categories</option>
            <option value="travel" ${this.filterCategory==='travel'?'selected':''}>Travel &amp; Mileage</option>
            <option value="meals" ${this.filterCategory==='meals'?'selected':''}>Meals &amp; Hospitality</option>
            <option value="training" ${this.filterCategory==='training'?'selected':''}>Training &amp; Certs</option>
            <option value="utilities" ${this.filterCategory==='utilities'?'selected':''}>Telecom / Internet</option>
            <option value="supplies" ${this.filterCategory==='supplies'?'selected':''}>Office &amp; WFH Supplies</option>
          </select>

          <select class="form-control" style="height:34px;font-size:12px;width:160px" onchange="Expenses.filterStatus=this.value;Expenses.renderTable()">
            <option value="all">All Statuses</option>
            <option value="pending_manager" ${this.filterStatus==='pending_manager'?'selected':''}>Pending Manager</option>
            <option value="pending_finance" ${this.filterStatus==='pending_finance'?'selected':''}>Pending Finance</option>
            <option value="approved" ${this.filterStatus==='approved'?'selected':''}>Approved for Payout</option>
            <option value="reimbursed" ${this.filterStatus==='reimbursed'?'selected':''}>Reimbursed (Paid)</option>
            <option value="rejected" ${this.filterStatus==='rejected'?'selected':''}>Rejected</option>
          </select>
        </div>

        <div style="font-size:12px;color:var(--text-muted)">
          Refreshed: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div id="expenses-table-wrap"></div>
    `;

    this.renderTable();
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  renderTable() {
    const wrap = document.getElementById('expenses-table-wrap');
    if (!wrap) return;

    const role = Auth.role;
    const isEmp = role === 'employee';
    const isMgr = role === 'dept_manager';
    const myEmpId = Auth.employee?.id;
    let claims = DB.get('expense_claims') || [];
    const allEmps = DB.get('employees') || [];

    // Filter by tab
    if (this.activeTab === 'my_claims') {
      claims = claims.filter(c => c.employeeId === myEmpId);
    } else if (this.activeTab === 'approvals_queue') {
      if (isMgr) {
        claims = claims.filter(c => c.status === 'pending_manager' && c.employeeId !== myEmpId);
      } else {
        claims = claims.filter(c => c.status === 'pending_manager' || c.status === 'pending_finance');
      }
    }

    // Apply category & status filter
    if (this.filterCategory !== 'all') {
      claims = claims.filter(c => c.category === this.filterCategory);
    }
    if (this.filterStatus !== 'all') {
      claims = claims.filter(c => c.status === this.filterStatus);
    }

    // Sort newest first
    claims.sort((a, b) => new Date(b.expenseDate || 0) - new Date(a.expenseDate || 0));

    if (claims.length === 0) {
      wrap.innerHTML = `
        <div class="card" style="padding:40px;text-align:center">
          <div style="font-size:36px;color:var(--text-muted);margin-bottom:12px"><i class="fa fa-receipt"></i></div>
          <h4 style="font-size:15px;font-weight:700;color:var(--text);margin:0 0 6px">No Expense Claims in this View</h4>
          <p style="font-size:12.5px;color:var(--text-3);margin:0">Click "Submit Expense Claim" above to record a new business reimbursement voucher.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div class="card" style="overflow:hidden;padding:0">
        <div class="table-responsive">
          <table class="table" style="margin:0">
            <thead>
              <tr style="background:var(--surface)">
                <th style="width:110px">Claim #</th>
                <th>Employee / Claimant</th>
                <th>Description &amp; Merchant</th>
                <th>Category</th>
                <th>Expense Date</th>
                <th>Amount (PKR)</th>
                <th>Receipt</th>
                <th>Status</th>
                <th style="text-align:right;width:150px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${claims.map(c => {
                const emp = allEmps.find(e => e.id === c.employeeId);
                const isClaimant = c.employeeId === myEmpId;
                const canApproveManager = (role === 'dept_manager' || role === 'superadmin' || role === 'hr_manager') && c.status === 'pending_manager' && !isClaimant;
                const canApproveFinance = (role === 'superadmin' || role === 'hr_manager') && c.status === 'pending_finance';

                return `
                  <tr>
                    <td>
                      <span style="font-family:monospace;font-weight:700;font-size:12px;color:var(--primary);background:rgba(99,102,241,0.1);padding:3px 7px;border-radius:6px">
                        ${c.claimNumber}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(c.employeeId)};width:26px;height:26px;font-size:10px;border-radius:50%;overflow:hidden">
                          ${emp?.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover">` : Utils.avatarInitials(emp?.fullName || 'Staff')}
                        </div>
                        <div>
                          <div style="font-weight:600;font-size:12.5px;color:var(--text)">${emp?.fullName || 'Employee #' + c.employeeId}</div>
                          <div style="font-size:10px;color:var(--text-muted)">${Utils.getDesigName(emp?.designationId)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight:600;font-size:13px;color:var(--text)">${c.title}</div>
                      <div style="font-size:11px;color:var(--text-3);margin-top:2px">
                        <i class="fa fa-store" style="font-size:10px;color:var(--text-muted);margin-right:4px"></i>${c.merchant || 'Commercial Payee'}
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-secondary" style="text-transform:capitalize">
                        ${this.getCategoryLabel(c.category)}
                      </span>
                    </td>
                    <td>
                      <span style="font-size:12px;color:var(--text-2)">${c.expenseDate}</span>
                    </td>
                    <td>
                      <div style="font-weight:800;font-size:13.5px;color:var(--text)">₨ ${(c.amount || 0).toLocaleString()}</div>
                      ${c.taxAmount ? `<div style="font-size:10px;color:var(--text-muted)">Incl. ₨ ${c.taxAmount} GST</div>` : ''}
                    </td>
                    <td>
                      <button class="btn btn-ghost btn-xs" onclick="Expenses.viewReceipt(${c.id})" title="View Digital Receipt / Tax Invoice">
                        <i class="fa fa-paperclip" style="color:var(--primary)"></i> View Slip
                      </button>
                    </td>
                    <td>${this.getStatusBadge(c.status)}</td>
                    <td style="text-align:right">
                      <div style="display:inline-flex;gap:4px">
                        <button class="btn btn-ghost btn-xs" onclick="Expenses.printVoucher(${c.id})" title="Print Formal Reimbursement Voucher">
                          <i class="fa fa-print"></i>
                        </button>

                        ${canApproveManager ? `
                          <button class="btn btn-ghost btn-xs" style="color:var(--success)" onclick="Expenses.reviewClaim(${c.id}, 'manager')" title="Manager Endorsement">
                            <i class="fa fa-check-double"></i> Endorse
                          </button>
                        ` : ''}

                        ${canApproveFinance ? `
                          <button class="btn btn-ghost btn-xs" style="color:var(--primary)" onclick="Expenses.reviewClaim(${c.id}, 'finance')" title="Finance Final Approval">
                            <i class="fa fa-stamp"></i> Authorize
                          </button>
                        ` : ''}

                        ${isClaimant && c.status === 'pending_manager' ? `
                          <button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="Expenses.deleteClaim(${c.id})" title="Withdraw Claim">
                            <i class="fa fa-trash"></i>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  getCategoryLabel(cat) {
    switch (cat) {
      case 'travel': return 'Travel & Mileage';
      case 'meals': return 'Meals & Hospitality';
      case 'training': return 'Training & Certs';
      case 'utilities': return 'Telecom / Internet';
      case 'supplies': return 'Office & WFH';
      default: return cat || 'General';
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'pending_manager': return '<span class="badge badge-warning">Pending Manager</span>';
      case 'pending_finance': return '<span class="badge badge-info">Pending Finance</span>';
      case 'approved': return '<span class="badge badge-primary">Approved for Payout</span>';
      case 'reimbursed': return '<span class="badge badge-success"><i class="fa fa-check"></i> Reimbursed</span>';
      case 'rejected': return '<span class="badge badge-danger">Rejected</span>';
      default: return `<span class="badge badge-secondary">${status}</span>`;
    }
  },

  showCreateModal() {
    Modal.show('Submit Business Expense Reimbursement Claim', `
      <div class="form-group">
        <label class="form-label">Claim Title / Purpose <span style="color:var(--danger)">*</span></label>
        <input type="text" class="form-control" id="exp-title" placeholder="e.g. AWS Solutions Architect Professional Exam Fee" required>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Expense Category <span style="color:var(--danger)">*</span></label>
          <select class="form-control" id="exp-category">
            <option value="travel">Travel, Flights &amp; Mileage</option>
            <option value="meals">Meals, Catering &amp; Client Hospitality</option>
            <option value="training">Training, Courses &amp; Certifications</option>
            <option value="utilities">Internet &amp; Telecom Allowance</option>
            <option value="supplies">Office Equipment &amp; WFH Supplies</option>
            <option value="other">Other Business Expense</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date of Expenditure <span style="color:var(--danger)">*</span></label>
          <input type="date" class="form-control" id="exp-date" value="${Utils.today()}" required>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Total Amount Paid (PKR) <span style="color:var(--danger)">*</span></label>
          <input type="number" class="form-control" id="exp-amount" placeholder="e.g. 15000" min="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Merchant / Vendor Name <span style="color:var(--danger)">*</span></label>
          <input type="text" class="form-control" id="exp-merchant" placeholder="e.g. Pearson VUE / Serena Hotel" required>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Sales Tax / GST (PKR) (Optional)</label>
          <input type="number" class="form-control" id="exp-tax" placeholder="e.g. 1600" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Payout Preference</label>
          <select class="form-control" id="exp-payout">
            <option value="payroll" selected>Include in Next Monthly Salary Pay Slip</option>
            <option value="direct_transfer">Direct Bank Authority Payout Transfer</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Business Justification &amp; Notes</label>
        <textarea class="form-control" id="exp-desc" rows="2" placeholder="Explain how this expense directly relates to company operations, client deliverables, or training..."></textarea>
      </div>

      <div style="background:var(--surface);padding:12px;border-radius:8px;border:1px dashed var(--border)">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px">
          <i class="fa fa-cloud-arrow-up" style="color:var(--primary);margin-right:6px"></i> Receipt / Digital Invoice Token
        </div>
        <div style="font-size:11px;color:var(--text-3)">
          A verified digital audit token and receipt voucher has been generated automatically for this submission.
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Expenses.submitClaim()"><i class="fa fa-check"></i> Submit Claim for Approval</button>
      `
    });
  },

  submitClaim() {
    const title = document.getElementById('exp-title')?.value.trim();
    const category = document.getElementById('exp-category')?.value;
    const expenseDate = document.getElementById('exp-date')?.value || Utils.today();
    const amount = parseFloat(document.getElementById('exp-amount')?.value) || 0;
    const merchant = document.getElementById('exp-merchant')?.value.trim() || 'Commercial Payee';
    const taxAmount = parseFloat(document.getElementById('exp-tax')?.value) || 0;
    const payoutMethod = document.getElementById('exp-payout')?.value || 'payroll';
    const description = document.getElementById('exp-desc')?.value.trim() || 'Legitimate business expense';

    if (!title || amount <= 0) {
      Toast.show('Please provide a claim title and valid amount', 'error');
      return;
    }

    const claims = DB.get('expense_claims') || [];
    const claimNum = `EXP-2026-${String(claims.length + 1).padStart(3, '0')}`;

    // Generate mock visual SVG receipt
    const receiptSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="150" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">TAX INVOICE / RECEIPT</text><text x="20" y="80" font-family="Arial" font-size="12" fill="%2364748b">Merchant: ${encodeURIComponent(merchant)}</text><text x="20" y="110" font-family="Arial" font-size="12" fill="%2364748b">Claimant: ${encodeURIComponent(Auth.employee.fullName)}</text><text x="20" y="140" font-family="Arial" font-size="12" fill="%2364748b">Item: ${encodeURIComponent(title.slice(0, 24))}</text><line x1="20" y1="170" x2="280" y2="170" stroke="%23cbd5e1" stroke-dasharray="4"/><text x="20" y="210" font-family="Arial" font-size="14" font-weight="bold" fill="%230f172a">Total Paid: PKR ${amount.toLocaleString()}</text><text x="20" y="240" font-family="Arial" font-size="11" fill="%2310b981">Verified Digital Transaction</text><rect x="20" y="270" width="260" height="80" fill="%23f1f5f9" rx="6"/><text x="150" y="315" font-family="Arial" font-size="11" fill="%23475569" text-anchor="middle">Official Enterprise Audit Stamp</text></svg>`;

    const newClaim = {
      id: Utils.generateId(),
      claimNumber: claimNum,
      employeeId: Auth.employee.id,
      title,
      category,
      amount,
      currency: 'PKR',
      taxAmount,
      expenseDate,
      merchant,
      description,
      receiptUrl: receiptSvg,
      status: 'pending_manager',
      managerApproval: null,
      financeApproval: null,
      payoutMethod,
      createdAt: new Date().toISOString()
    };

    claims.unshift(newClaim);
    DB.set('expense_claims', claims);
    DB.log('SUBMIT', 'Expenses', `Submitted expense claim ${claimNum} (PKR ${amount.toLocaleString()})`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show(`Expense Claim ${claimNum} submitted for manager review!`, 'success');
    this.render();
  },

  viewReceipt(claimId) {
    const claim = DB.find('expense_claims', claimId);
    if (!claim) return;
    const emp = DB.find('employees', claim.employeeId);

    Modal.show(`Digital Receipt - ${claim.claimNumber}`, `
      <div style="text-align:center;margin-bottom:16px">
        <img src="${claim.receiptUrl}" style="max-width:300px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15)" alt="Receipt Voucher">
      </div>
      <div style="background:var(--surface);padding:14px;border-radius:8px;font-size:12.5px">
        <div><b>Claimant:</b> ${emp?.fullName || 'Staff'}</div>
        <div><b>Merchant:</b> ${claim.merchant || 'Commercial Entity'}</div>
        <div><b>Date of Payment:</b> ${claim.expenseDate}</div>
        <div><b>Total Amount:</b> PKR ${(claim.amount || 0).toLocaleString()}</div>
        <div><b>Business Purpose:</b> ${claim.description || 'Verified legitimate operational requirement'}</div>
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close Receipt</button>`
    });
  },

  reviewClaim(claimId, stage) {
    const claim = DB.find('expense_claims', claimId);
    if (!claim) return;
    const emp = DB.find('employees', claim.employeeId);

    const isStageManager = stage === 'manager';
    const modalTitle = isStageManager ? 'Manager Endorsement Review' : 'Finance Final Authorization & Payout';

    Modal.show(modalTitle, `
      <div style="background:var(--surface);padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:13px">
        <div><b>Claim Number:</b> ${claim.claimNumber}</div>
        <div><b>Claimant:</b> ${emp?.fullName} (${Utils.getDesigName(emp?.designationId)})</div>
        <div><b>Title:</b> ${claim.title}</div>
        <div><b>Merchant:</b> ${claim.merchant}</div>
        <div style="font-size:16px;font-weight:800;color:var(--primary);margin-top:6px">₨ ${(claim.amount || 0).toLocaleString()}</div>
      </div>

      <div class="form-group">
        <label class="form-label">${isStageManager ? 'Manager' : 'Finance'} Audit Remarks</label>
        <textarea class="form-control" id="review-remarks" rows="2" placeholder="Verified receipt and approved within departmental operational budget."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-danger" onclick="Expenses.processDecision(${claimId}, '${stage}', false)"><i class="fa fa-times"></i> Reject</button>
        <button class="btn btn-success" onclick="Expenses.processDecision(${claimId}, '${stage}', true)"><i class="fa fa-check"></i> ${isStageManager ? 'Endorse Claim' : 'Authorize Reimbursement'}</button>
      `
    });
  },

  processDecision(claimId, stage, approved) {
    const remarks = document.getElementById('review-remarks')?.value.trim() || (approved ? 'Approved in full' : 'Claim rejected after audit');
    const claims = DB.get('expense_claims') || [];
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    if (stage === 'manager') {
      if (approved) {
        claim.status = 'pending_finance';
        claim.managerApproval = {
          approvedBy: Auth.employee.id,
          approvedAt: Utils.today(),
          remarks
        };
        Toast.show(`Claim ${claim.claimNumber} endorsed and routed to Finance!`, 'success');
      } else {
        claim.status = 'rejected';
        claim.managerApproval = { approvedBy: Auth.employee.id, approvedAt: Utils.today(), remarks };
        Toast.show(`Claim ${claim.claimNumber} rejected.`, 'warning');
      }
    } else if (stage === 'finance') {
      if (approved) {
        claim.status = 'approved';
        claim.financeApproval = {
          approvedBy: Auth.employee.id,
          approvedAt: Utils.today(),
          remarks
        };
        Toast.show(`Claim ${claim.claimNumber} authorized for reimbursement!`, 'success');
      } else {
        claim.status = 'rejected';
        claim.financeApproval = { approvedBy: Auth.employee.id, approvedAt: Utils.today(), remarks };
        Toast.show(`Claim ${claim.claimNumber} rejected by Finance.`, 'warning');
      }
    }

    DB.set('expense_claims', claims);
    DB.log('REVIEW', 'Expenses', `${stage.toUpperCase()} decision on ${claim.claimNumber}: ${claim.status}`, Auth.user?.id);

    Modal.close('dynamic-modal');
    this.render();
  },

  syncApprovedToPayroll() {
    const claims = DB.get('expense_claims') || [];
    const approvedClaims = claims.filter(c => c.status === 'approved');

    if (approvedClaims.length === 0) {
      Toast.show('No pending approved claims waiting for disbursement!', 'info');
      return;
    }

    Modal.confirm(`Push ${approvedClaims.length} approved expense vouchers (Total: PKR ${approvedClaims.reduce((s,c)=>s+c.amount,0).toLocaleString()}) directly into Payroll reimbursement ledger? Claims will be marked as 'reimbursed'.`, () => {
      approvedClaims.forEach(c => {
        c.status = 'reimbursed';
        c.reimbursedAt = Utils.today();
      });

      DB.set('expense_claims', claims);
      DB.log('SYNC', 'Expenses', `Synchronized ${approvedClaims.length} claims to payroll payout`, Auth.user?.id);
      Toast.show(`Successfully synchronized ${approvedClaims.length} claims into Payroll!`, 'success');
      this.render();
    });
  },

  deleteClaim(claimId) {
    Modal.confirm('Are you sure you want to withdraw this expense claim?', () => {
      const claims = (DB.get('expense_claims') || []).filter(c => c.id !== claimId);
      DB.set('expense_claims', claims);
      DB.log('DELETE', 'Expenses', `Withdrew expense claim #${claimId}`, Auth.user?.id);
      Toast.show('Expense claim withdrawn.', 'warning');
      this.render();
    });
  },

  printVoucher(claimId) {
    const claim = DB.find('expense_claims', claimId);
    if (!claim) return;
    const emp = DB.find('employees', claim.employeeId) || { fullName: 'Employee Staff', designation: 'Staff' };
    const settings = DB.getObj('settings') || { companyName: 'HRM Pro Enterprise Solutions' };

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Reimbursement Voucher - ${claim.claimNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; font-size: 13px; }
          .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 6px; }
          .box b { color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: 700; }
          .total { font-size: 15px; font-weight: 800; color: #0f172a; }
          .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 60px; }
          .sig-line { border-top: 1px solid #0f172a; padding-top: 8px; font-size: 11px; text-align: center; }
          @media print { body { padding: 15mm; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${settings.companyName}</div>
          <div class="subtitle">OFFICIAL EXPENSE REIMBURSEMENT PAYMENT VOUCHER</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px">Voucher No: ${claim.claimNumber} | Issue Date: ${Utils.today()}</div>
        </div>

        <div class="grid">
          <div class="box">
            <b>BENEFICIARY DETAILS:</b><br><br>
            <b>Employee Name:</b> ${emp.fullName}<br>
            <b>Designation:</b> ${Utils.getDesigName(emp.designationId) || 'Staff'}<br>
            <b>Department:</b> ${Utils.getDeptName(emp.departmentId) || 'Operations'}<br>
            <b>Payment Preference:</b> ${claim.payoutMethod === 'payroll' ? 'Monthly Payroll Bank Credit' : 'Direct Inter-Bank Fund Transfer'}
          </div>
          <div class="box">
            <b>APPROVAL &amp; SETTLEMENT AUDIT:</b><br><br>
            <b>Status:</b> ${claim.status.toUpperCase()}<br>
            <b>Manager Approval:</b> ${claim.managerApproval ? 'Verified by Manager on ' + claim.managerApproval.approvedAt : 'Pending'}<br>
            <b>Finance Audit:</b> ${claim.financeApproval ? 'Authorized by Finance on ' + claim.financeApproval.approvedAt : 'Pending'}<br>
            <b>Tax Treatment:</b> Official Business Reimbursement (Non-Taxable)
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Expense Description &amp; Purpose</th>
              <th>Category</th>
              <th>Merchant / Payee</th>
              <th>Date</th>
              <th style="text-align:right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>${claim.title}</b><br>
                <span style="font-size:11px;color:#64748b">${claim.description}</span>
              </td>
              <td>${claim.category?.toUpperCase()}</td>
              <td>${claim.merchant}</td>
              <td>${claim.expenseDate}</td>
              <td style="text-align:right;font-weight:700">₨ ${(claim.amount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="4" style="text-align:right;font-weight:700">Total Claimable Net Amount:</td>
              <td style="text-align:right" class="total">PKR ${(claim.amount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div class="sig-line">
              <b>PREPARED &amp; CLAIMED BY</b><br>
              ${emp.fullName}<br>
              Date: ${claim.expenseDate}
            </div>
          </div>
          <div>
            <div class="sig-line">
              <b>VERIFIED BY REPORTING MGR</b><br>
              Departmental Signature &amp; Stamp<br>
              Date: ${claim.managerApproval?.approvedAt || '_________'}
            </div>
          </div>
          <div>
            <div class="sig-line">
              <b>FINANCE / PAYROLL AUTHORIZATION</b><br>
              Executive Seal &amp; Release<br>
              Date: ${claim.financeApproval?.approvedAt || '_________'}
            </div>
          </div>
        </div>

        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  },

  exportCSV() {
    const claims = DB.get('expense_claims') || [];
    const emps = DB.get('employees') || [];

    const headers = ['Claim Number', 'Employee Name', 'Title', 'Category', 'Merchant', 'Amount (PKR)', 'Tax Amount', 'Expense Date', 'Status', 'Payout Method'];
    const rows = claims.map(c => {
      const e = emps.find(emp => emp.id === c.employeeId);
      return [
        `"${c.claimNumber}"`,
        `"${e ? e.fullName : 'Employee #' + c.employeeId}"`,
        `"${c.title}"`,
        `"${c.category}"`,
        `"${c.merchant}"`,
        c.amount || 0,
        c.taxAmount || 0,
        `"${c.expenseDate}"`,
        `"${c.status}"`,
        `"${c.payoutMethod}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    Utils.downloadCSV(csvContent, `Expense_Claims_Export_${Utils.today()}.csv`);
    Toast.show('Expense claims CSV exported!', 'success');
  }
};
