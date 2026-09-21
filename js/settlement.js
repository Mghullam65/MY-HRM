// ============================================================
// HRM SYSTEM — Exit & Full and Final (F&F) Settlement Engine
// Implements Statutory Gratuity (30/26), Leave Encashment,
// Multi-Gate Clearances, and Complete Admin CRUD Access Control
// ============================================================

const Settlement = {
  currentTab: 'register', // 'register' | 'clearance' | 'analytics'
  searchTerm: '',
  filterStatus: 'all',
  filterDept: 'all',

  isAdmin() {
    return typeof Auth !== 'undefined' && (Auth.role === 'superadmin' || Auth.role === 'hr_manager');
  },

  isDeptManager() {
    return typeof Auth !== 'undefined' && Auth.role === 'dept_manager';
  },

  render(targetContainer) {
    let content = targetContainer;
    if (!content) {
      if (document.getElementById('emp-content') && (window.location.hash.includes('employees') || (typeof Employees !== 'undefined' && Employees.currentView === 'settlement'))) {
        content = document.getElementById('emp-content');
      } else {
        content = document.getElementById('page-content');
      }
    }
    if (!content) return;

    const isAdmin = this.isAdmin();
    const isDeptMgr = this.isDeptManager();
    const myEmpId = Auth.employee?.id;

    let settlements = DB.get('settlements') || [];

    // Role-based data scoping
    if (!isAdmin && !isDeptMgr) {
      // Regular employee: can only view own settlement
      settlements = settlements.filter(s => s.employeeId === myEmpId);
    } else if (isDeptMgr) {
      // Dept manager: view team settlements
      const teamIds = Auth.getTeamEmployeeIds ? Auth.getTeamEmployeeIds(myEmpId) : [myEmpId];
      settlements = settlements.filter(s => teamIds.includes(s.employeeId));
    }

    // Analytics Metrics
    const totalCount = settlements.length;
    const pendingClearance = settlements.filter(s => s.settlementStatus === 'under_clearance' || s.settlementStatus === 'draft').length;
    const totalGratuityDisbursed = settlements.reduce((sum, s) => sum + (s.earnings?.gratuityAmount || 0), 0);
    const totalNetDisbursed = settlements.filter(s => s.settlementStatus === 'approved' || s.settlementStatus === 'disbursed' || s.paymentDetails?.status === 'paid')
      .reduce((sum, s) => sum + (s.netSettlementAmount || 0), 0);

    content.innerHTML = `
      <div class="animate-fade-in" style="padding-bottom:30px">
        <!-- Module Header & Controls -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:20px">
          <div>
            <h2 style="font-size:22px;font-weight:800;display:flex;align-items:center;gap:10px;margin:0">
              <i class="fa fa-file-invoice-dollar" style="color:var(--primary)"></i>
              Exit & Full and Final (F&F) Settlements
            </h2>
            <p style="color:var(--text-2);font-size:13px;margin:4px 0 0">
              Automated Pakistan Statutory Gratuity Engine (30/26 rule), Leave Encashment, Multi-Gate Clearances & Final Settlement Vouchers.
            </p>
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="Settlement.exportCSV()" title="Export Settlements Register as CSV">
              <i class="fa fa-download"></i> Export CSV
            </button>
            ${isAdmin ? `
              <button class="btn btn-primary btn-sm" onclick="Settlement.openAddModal()" style="font-weight:700">
                <i class="fa fa-plus"></i> + New Settlement
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:14px;margin-bottom:24px">
          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--primary)">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-users-slash"></i>
            </div>
            <div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase">Total Settlements</div>
              <div style="font-size:20px;font-weight:800;color:var(--text)">${totalCount} Records</div>
            </div>
          </div>

          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--warning)">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(245,158,11,0.12);color:var(--warning);display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-hourglass-half"></i>
            </div>
            <div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase">Pending Clearance</div>
              <div style="font-size:20px;font-weight:800;color:var(--warning)">${pendingClearance} Exits</div>
            </div>
          </div>

          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--accent)">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(139,92,246,0.12);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-scale-balanced"></i>
            </div>
            <div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase">Total Gratuity Valued</div>
              <div style="font-size:20px;font-weight:800;color:var(--text)">PKR ${totalGratuityDisbursed.toLocaleString('en-PK')}</div>
            </div>
          </div>

          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--success)">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(16,185,129,0.12);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-money-bill-transfer"></i>
            </div>
            <div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase">Net Payable Approved</div>
              <div style="font-size:20px;font-weight:800;color:var(--success)">PKR ${totalNetDisbursed.toLocaleString('en-PK')}</div>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="card" style="padding:14px 18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:260px">
            <div style="position:relative;flex:1;max-width:320px">
              <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:12px"></i>
              <input type="text" class="input input-sm" placeholder="Search employee, voucher ID..."
                value="${this.searchTerm}" oninput="Settlement.handleSearch(this.value)"
                style="padding-left:30px;width:100%">
            </div>

            <select class="input input-sm" style="width:160px" onchange="Settlement.handleStatusFilter(this.value)">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="draft" ${this.filterStatus === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="under_clearance" ${this.filterStatus === 'under_clearance' ? 'selected' : ''}>Under Clearance</option>
              <option value="approved" ${this.filterStatus === 'approved' ? 'selected' : ''}>Approved</option>
              <option value="disbursed" ${this.filterStatus === 'disbursed' ? 'selected' : ''}>Disbursed / Paid</option>
            </select>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11.5px;font-weight:700;color:var(--text-3)">STATUTORY FORMULA:</span>
            <span class="badge" style="background:rgba(99,102,241,0.1);color:var(--primary);font-family:monospace;font-size:11px;padding:3px 8px">
              Gratuity = (Basic × Tenure_Years × 30) / 26
            </span>
          </div>
        </div>

        <!-- Settlements Register Table -->
        <div class="card" style="padding:0;overflow:hidden">
          <div class="table-container" style="margin:0">
            <table class="table" style="width:100%;margin:0;font-size:12.5px">
              <thead>
                <tr style="background:var(--surface-2);border-bottom:1px solid var(--border)">
                  <th style="padding:12px 16px">Voucher ID</th>
                  <th style="padding:12px 16px">Employee</th>
                  <th style="padding:12px 16px">Exit Date & Type</th>
                  <th style="padding:12px 16px;text-align:center">Tenure (Years)</th>
                  <th style="padding:12px 16px;text-align:right">Gratuity (PKR)</th>
                  <th style="padding:12px 16px;text-align:right">Net Payable</th>
                  <th style="padding:12px 16px;text-align:center">Clearance Gates</th>
                  <th style="padding:12px 16px;text-align:center">Status</th>
                  <th style="padding:12px 16px;text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody id="settlement-tbody">
                ${this.renderTableRows(settlements)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderTableRows(settlements) {
    const term = (this.searchTerm || '').toLowerCase();
    const status = this.filterStatus;
    const isAdmin = this.isAdmin();

    const filtered = settlements.filter(s => {
      const matchText = (s.id || '').toLowerCase().includes(term) ||
                        (s.employeeName || '').toLowerCase().includes(term) ||
                        (s.employeeCode || '').toLowerCase().includes(term) ||
                        (s.department || '').toLowerCase().includes(term);
      const matchStatus = status === 'all' || s.settlementStatus === status;
      return matchText && matchStatus;
    });

    if (filtered.length === 0) {
      return `
        <tr>
          <td colspan="9" style="text-align:center;padding:36px 16px;color:var(--text-3)">
            <i class="fa fa-folder-open" style="font-size:32px;opacity:0.4;display:block;margin-bottom:8px"></i>
            No exit settlement records found matching current criteria.
          </td>
        </tr>
      `;
    }

    return filtered.map(s => {
      const gates = s.clearanceGates || {};
      const hrCleared = gates.hr?.status === 'approved';
      const itCleared = gates.it?.status === 'approved';
      const finCleared = gates.finance?.status === 'approved';
      const admCleared = gates.admin?.status === 'approved';
      const clearedCount = [hrCleared, itCleared, finCleared, admCleared].filter(Boolean).length;

      let statusBadge = '<span class="badge badge-secondary">Draft</span>';
      if (s.settlementStatus === 'under_clearance') {
        statusBadge = `<span class="badge badge-warning"><i class="fa fa-spinner fa-spin"></i> Clearance (${clearedCount}/4)</span>`;
      } else if (s.settlementStatus === 'approved') {
        statusBadge = '<span class="badge badge-success"><i class="fa fa-check-circle"></i> Approved</span>';
      } else if (s.settlementStatus === 'disbursed' || s.paymentDetails?.status === 'paid') {
        statusBadge = '<span class="badge badge-primary"><i class="fa fa-receipt"></i> Paid / Disbursed</span>';
      }

      return `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="padding:12px 16px;font-family:monospace;font-weight:700;color:var(--primary)">
            ${s.id}
          </td>
          <td style="padding:12px 16px">
            <div style="font-weight:700;color:var(--text)">${s.employeeName}</div>
            <div style="font-size:11px;color:var(--text-3)">${s.employeeCode} • ${s.department || 'General'}</div>
          </td>
          <td style="padding:12px 16px">
            <div><i class="fa fa-calendar-day" style="color:var(--text-3);margin-right:4px"></i> ${s.exitDate || '—'}</div>
            <div style="font-size:11px;color:var(--text-2);text-transform:capitalize">Type: ${s.exitType || 'Resignation'}</div>
          </td>
          <td style="padding:12px 16px;text-align:center">
            <span class="badge" style="background:var(--surface-2);font-weight:700;font-size:12px">
              ${s.tenure?.roundedTenureYears || 0} yrs
            </span>
            <div style="font-size:10px;color:var(--text-3);margin-top:2px">(${s.tenure?.fullYears || 0}y ${s.tenure?.remMonths || 0}m)</div>
          </td>
          <td style="padding:12px 16px;text-align:right;font-weight:700;font-family:monospace">
            PKR ${(s.earnings?.gratuityAmount || 0).toLocaleString('en-PK')}
          </td>
          <td style="padding:12px 16px;text-align:right;font-weight:800;font-family:monospace;color:var(--success)">
            PKR ${(s.netSettlementAmount || 0).toLocaleString('en-PK')}
          </td>
          <td style="padding:12px 16px;text-align:center">
            <div style="display:inline-flex;gap:4px" title="HR: ${hrCleared?'Approved':'Pending'} | IT: ${itCleared?'Approved':'Pending'} | Finance: ${finCleared?'Approved':'Pending'} | Admin: ${admCleared?'Approved':'Pending'}">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${hrCleared?'var(--success)':'var(--border)'}"></span>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${itCleared?'var(--success)':'var(--border)'}"></span>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${finCleared?'var(--success)':'var(--border)'}"></span>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${admCleared?'var(--success)':'var(--border)'}"></span>
            </div>
            <div style="font-size:10px;color:var(--text-3)">${clearedCount}/4 Cleared</div>
          </td>
          <td style="padding:12px 16px;text-align:center">
            ${statusBadge}
          </td>
          <td style="padding:12px 16px;text-align:right">
            <div style="display:flex;justify-content:flex-end;gap:6px">
              <button class="btn btn-ghost btn-xs" onclick="Settlement.viewVoucher('${s.id}')" title="View & Print Official Settlement Voucher">
                <i class="fa fa-print"></i>
              </button>
              ${isAdmin ? `
                <button class="btn btn-ghost btn-xs" onclick="Settlement.openClearanceModal('${s.id}')" title="Manage Clearance Gates">
                  <i class="fa fa-tasks"></i>
                </button>
                <button class="btn btn-ghost btn-xs" onclick="Settlement.openEditModal('${s.id}')" title="Edit Settlement Details (Admin Only)">
                  <i class="fa fa-pen"></i>
                </button>
                <button class="btn btn-ghost btn-xs text-danger" onclick="Settlement.confirmDelete('${s.id}')" title="Delete Settlement (Admin Only)">
                  <i class="fa fa-trash"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  handleSearch(val) {
    this.searchTerm = val;
    const tbody = document.getElementById('settlement-tbody') || document.querySelector('tbody');
    if (tbody) {
      const settlements = DB.get('settlements') || [];
      tbody.innerHTML = this.renderTableRows(settlements);
    }
  },

  handleStatusFilter(val) {
    this.filterStatus = val;
    const tbody = document.getElementById('settlement-tbody') || document.querySelector('tbody');
    if (tbody) {
      const settlements = DB.get('settlements') || [];
      tbody.innerHTML = this.renderTableRows(settlements);
    }
  },

  // ────────────────────────────────────────────────────────────
  // STATUTORY CALCULATION ENGINE (§12 / Labor Laws)
  // ────────────────────────────────────────────────────────────
  calculate(employeeId, exitDateStr, customInputs = {}) {
    const emp = DB.get('employees').find(e => e.id === Number(employeeId));
    if (!emp) throw new Error('Employee record not found.');

    const joinDate = new Date(emp.joinDate || emp.joiningDate || '2024-01-01');
    const exitDate = new Date(exitDateStr || new Date().toISOString().split('T')[0]);

    // Calculate tenure
    let totalMonths = (exitDate.getFullYear() - joinDate.getFullYear()) * 12 + (exitDate.getMonth() - joinDate.getMonth());
    if (exitDate.getDate() < joinDate.getDate()) totalMonths--;
    totalMonths = Math.max(0, totalMonths);

    const fullYears = Math.floor(totalMonths / 12);
    const remMonths = totalMonths % 12;

    // Statutory Rounding: >= 6 months in final year rounds up to 1 full year
    let roundedTenureYears = fullYears;
    if (remMonths >= 6) roundedTenureYears += 1;

    const lastBasicSalary = Number(customInputs.lastBasicSalary !== undefined ? customInputs.lastBasicSalary : (emp.salary || 50000));

    // 1. Statutory Gratuity: (Basic × Tenure × 30) / 26 (Applicable if tenure >= 1 year)
    const gratuityEligible = roundedTenureYears >= 1;
    let gratuityAmount = 0;
    if (customInputs.gratuityOverride && customInputs.gratuityOverrideAmount !== undefined) {
      gratuityAmount = Number(customInputs.gratuityOverrideAmount);
    } else if (gratuityEligible) {
      gratuityAmount = Math.round((lastBasicSalary * roundedTenureYears * 30) / 26);
    }

    // 2. Prorated Exit Month Salary
    const exitDay = exitDate.getDate();
    const daysInExitMonth = new Date(exitDate.getFullYear(), exitDate.getMonth() + 1, 0).getDate();
    const workedDays = customInputs.workedDays !== undefined ? Number(customInputs.workedDays) : exitDay;
    const proratedSalary = Math.round((lastBasicSalary / daysInExitMonth) * workedDays);

    // 3. Leave Encashment: (Basic / 30) × Unused Leaves
    const leaveBalances = (DB.get('leave_balances') || []).find(b => b.employeeId === Number(employeeId));
    const unusedLeaves = customInputs.unusedLeaves !== undefined ? Number(customInputs.unusedLeaves) : (leaveBalances?.annual || leaveBalances?.earned || 8);
    const leaveEncashmentDailyRate = Math.round(lastBasicSalary / 30);
    const leaveEncashmentAmount = Math.round(leaveEncashmentDailyRate * unusedLeaves);

    // 4. Provident Fund Refund
    const pfBalanceRefund = Number(customInputs.pfBalanceRefund !== undefined ? customInputs.pfBalanceRefund : (emp.initial_pf || 0));

    // 5. Other Additions
    const otherAdditions = Number(customInputs.otherAdditions || 0);
    const otherAdditionsRemarks = customInputs.otherAdditionsRemarks || '';

    // Total Gross Earnings
    const grossPayable = proratedSalary + gratuityAmount + leaveEncashmentAmount + pfBalanceRefund + otherAdditions;

    // 6. Deductions: Outstanding Loans
    const allLoans = DB.get('loans') || [];
    const empLoans = allLoans.filter(l => l.employeeId === Number(employeeId) && l.status === 'active');
    const autoLoanTotal = empLoans.reduce((sum, l) => sum + (l.remainingBalance || l.amount || 0), 0);
    const outstandingLoans = customInputs.outstandingLoans !== undefined ? Number(customInputs.outstandingLoans) : autoLoanTotal;

    // 7. Deductions: Asset Recovery (Damaged or unreturned equipment)
    const assetRecoveryDeductions = Number(customInputs.assetRecoveryDeductions || 0);

    // 8. Notice Shortfall
    const noticeRequired = Number(customInputs.noticePeriodRequiredDays || 30);
    const noticeServed = Number(customInputs.noticePeriodServedDays !== undefined ? customInputs.noticePeriodServedDays : noticeRequired);
    const noticeShortfallDays = Math.max(0, noticeRequired - noticeServed);
    const noticeShortfallDeduction = Math.round((lastBasicSalary / 30) * noticeShortfallDays);

    // 9. Statutory Taxes & EOBI
    const exitTaxWithholding = Number(customInputs.exitTaxWithholding !== undefined ? customInputs.exitTaxWithholding : 0);
    const exitEOBI = Number(customInputs.exitEOBI !== undefined ? customInputs.exitEOBI : (emp.eoib_employee || 1300));
    const otherDeductions = Number(customInputs.otherDeductions || 0);
    const otherDeductionsRemarks = customInputs.otherDeductionsRemarks || '';

    const totalDeductions = outstandingLoans + assetRecoveryDeductions + noticeShortfallDeduction + exitTaxWithholding + exitEOBI + otherDeductions;
    const netSettlementAmount = Math.max(0, grossPayable - totalDeductions);

    const amountInWords = this.numberToWordsPKR(netSettlementAmount);

    return {
      employeeId: Number(employeeId),
      employeeName: emp.fullName,
      employeeCode: emp.code || `EMP-${String(emp.id).padStart(3, '0')}`,
      department: DB.find('departments', emp.departmentId)?.name || 'Operations',
      designation: DB.find('designations', emp.designationId)?.name || 'Staff',
      joinDate: emp.joinDate || emp.joiningDate || '2024-01-01',
      exitDate: exitDateStr,
      tenure: {
        totalMonths,
        fullYears,
        remMonths,
        roundedTenureYears
      },
      earnings: {
        lastBasicSalary,
        exitMonthWorkedDays: workedDays,
        exitMonthCalendarDays: daysInExitMonth,
        proratedSalary,
        gratuityEligible,
        gratuityTenureYears: roundedTenureYears,
        gratuityAmount,
        gratuityOverride: !!customInputs.gratuityOverride,
        unusedLeaves,
        leaveEncashmentDailyRate,
        leaveEncashmentAmount,
        pfBalanceRefund,
        otherAdditions,
        otherAdditionsRemarks,
        grossPayable
      },
      deductions: {
        outstandingLoans,
        assetRecoveryDeductions,
        noticeShortfallDays,
        noticeShortfallDeduction,
        exitTaxWithholding,
        exitEOBI,
        otherDeductions,
        otherDeductionsRemarks,
        totalDeductions
      },
      netSettlementAmount,
      amountInWords
    };
  },

  numberToWordsPKR(num) {
    if (typeof TaxEngine !== 'undefined' && TaxEngine.numberToWords) {
      return TaxEngine.numberToWords(num);
    }
    const n = Math.round(num);
    if (n === 0) return 'Zero Pakistani Rupees Only';
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    function inWords(val) {
      if (val === 0) return '';
      if (val < 20) return a[val] + ' ';
      if (val < 100) return b[Math.floor(val / 10)] + (val % 10 ? ' ' + a[val % 10] : '') + ' ';
      if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred ' + inWords(val % 100);
      if (val < 100000) return inWords(Math.floor(val / 1000)) + 'Thousand ' + inWords(val % 1000);
      if (val < 10000000) return inWords(Math.floor(val / 100000)) + 'Lakh ' + inWords(val % 100000);
      return inWords(Math.floor(val / 10000000)) + 'Crore ' + inWords(val % 10000000);
    }
    return inWords(n).trim() + ' Pakistani Rupees Only';
  },

  // ────────────────────────────────────────────────────────────
  // ADMIN ACTIONS: ADD SETTLEMENT MODAL
  // ────────────────────────────────────────────────────────────
  openAddModal() {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Creating settlements requires Administrator rights.', 'error');
      return;
    }

    const employees = (DB.get('employees') || []).filter(e => e.status === 'active' || e.status === 'notice_period');
    const todayStr = new Date().toISOString().split('T')[0];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'settlement-add-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width:840px;width:95%;max-height:90vh;overflow-y:auto">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px">
            <i class="fa fa-file-invoice-dollar" style="color:var(--primary)"></i>
            Initiate New Full & Final (F&F) Settlement
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('settlement-add-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:20px">
          <!-- Step 1: Employee Selection & Exit Parameters -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Select Exiting Employee *</label>
              <select class="input" id="fnf-add-emp" onchange="Settlement.onAddEmpChange(this.value)">
                <option value="">-- Choose Employee --</option>
                ${employees.map(e => `<option value="${e.id}">${e.fullName} (${e.code || 'EMP-'+e.id}) - ${e.department || 'Staff'}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Exit Date (Last Working Day) *</label>
              <input type="date" class="input" id="fnf-add-exit-date" value="${todayStr}" onchange="Settlement.recalcAddPreview()">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:18px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Exit Type</label>
              <select class="input" id="fnf-add-exit-type">
                <option value="resignation">Resignation</option>
                <option value="termination">Termination</option>
                <option value="retirement">Retirement</option>
                <option value="contract_end">Contract Expiration</option>
                <option value="layoff">Redundancy / Layoff</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Notice Period Required (Days)</label>
              <input type="number" class="input" id="fnf-add-notice-req" value="30" min="0" oninput="Settlement.recalcAddPreview()">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Notice Period Served (Days)</label>
              <input type="number" class="input" id="fnf-add-notice-served" value="30" min="0" oninput="Settlement.recalcAddPreview()">
            </div>
          </div>

          <!-- Live Dynamic Preview Container -->
          <div id="fnf-add-preview-box" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:18px">
            <div style="text-align:center;color:var(--text-3);padding:20px 0">
              <i class="fa fa-arrow-pointer" style="font-size:24px;margin-bottom:8px;display:block"></i>
              Select an employee above to preview live statutory gratuity and net settlement calculations.
            </div>
          </div>

          <div style="margin-bottom:16px">
            <label class="form-label" style="font-weight:700;font-size:12px">Administrative Remarks / Settlement Notes</label>
            <textarea class="input" id="fnf-add-notes" rows="2" placeholder="Enter any HR or finance remarks regarding this exit settlement..."></textarea>
          </div>
        </div>

        <div class="modal-footer" style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center;background:var(--surface)">
          <div style="font-size:11.5px;color:var(--text-3)">
            <i class="fa fa-shield-halved" style="color:var(--primary)"></i> Admin Authorization Verified
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('settlement-add-modal').remove()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="Settlement.saveNewSettlement()" style="font-weight:700">
              <i class="fa fa-check"></i> Generate & Save Settlement
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  onAddEmpChange(empId) {
    if (!empId) {
      document.getElementById('fnf-add-preview-box').innerHTML = `
        <div style="text-align:center;color:var(--text-3);padding:20px 0">
          Select an employee above to preview live statutory gratuity and net settlement calculations.
        </div>
      `;
      return;
    }
    this.recalcAddPreview();
  },

  recalcAddPreview() {
    const empId = document.getElementById('fnf-add-emp')?.value;
    const exitDateStr = document.getElementById('fnf-add-exit-date')?.value;
    const noticeReq = Number(document.getElementById('fnf-add-notice-req')?.value || 30);
    const noticeServed = Number(document.getElementById('fnf-add-notice-served')?.value || 30);

    if (!empId || !exitDateStr) return;

    try {
      const calc = this.calculate(empId, exitDateStr, {
        noticePeriodRequiredDays: noticeReq,
        noticePeriodServedDays: noticeServed
      });

      document.getElementById('fnf-add-preview-box').innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:8px">
          <div>
            <span style="font-weight:800;font-size:14px;color:var(--text)">${calc.employeeName}</span>
            <span style="font-size:12px;color:var(--text-2);margin-left:8px">Joined: ${calc.joinDate} • Last Day: ${calc.exitDate}</span>
          </div>
          <span class="badge badge-primary" style="font-weight:700">
            Tenure: ${calc.tenure.fullYears}y ${calc.tenure.remMonths}m (Rounded: ${calc.tenure.roundedTenureYears} yrs)
          </span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <!-- Earnings Section -->
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--success);text-transform:uppercase;margin-bottom:8px">
              <i class="fa fa-plus-circle"></i> Earnings & Credits
            </div>
            <div style="font-size:12px;line-height:1.8">
              <div style="display:flex;justify-content:space-between">
                <span>Last Basic Salary:</span>
                <strong style="font-family:monospace">PKR ${calc.earnings.lastBasicSalary.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span>Exit Month Prorated (${calc.earnings.exitMonthWorkedDays}/${calc.earnings.exitMonthCalendarDays}d):</span>
                <strong style="font-family:monospace">PKR ${calc.earnings.proratedSalary.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span>Statutory Gratuity (${calc.tenure.roundedTenureYears}y × 30/26):</span>
                <strong style="font-family:monospace;color:var(--accent)">PKR ${calc.earnings.gratuityAmount.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span>Leave Encashment (${calc.earnings.unusedLeaves} days):</span>
                <strong style="font-family:monospace">PKR ${calc.earnings.leaveEncashmentAmount.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span>PF Accumulated Balance:</span>
                <strong style="font-family:monospace">PKR ${calc.earnings.pfBalanceRefund.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;border-top:1px dashed var(--border);margin-top:4px;padding-top:4px">
                <span style="font-weight:700">Total Gross Credits:</span>
                <strong style="font-family:monospace;color:var(--success)">PKR ${calc.earnings.grossPayable.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <!-- Deductions Section -->
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--danger);text-transform:uppercase;margin-bottom:8px">
              <i class="fa fa-minus-circle"></i> Recoveries & Deductions
            </div>
            <div style="font-size:12px;line-height:1.8">
              <div style="display:flex;justify-content:space-between">
                <span>Outstanding Company Loans:</span>
                <strong style="font-family:monospace">PKR ${calc.deductions.outstandingLoans.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span>Notice Shortfall (${calc.deductions.noticeShortfallDays} days):</span>
                <strong style="font-family:monospace">PKR ${calc.deductions.noticeShortfallDeduction.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span>Exit EOBI & Statutory Dues:</span>
                <strong style="font-family:monospace">PKR ${calc.deductions.exitEOBI.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;border-top:1px dashed var(--border);margin-top:4px;padding-top:4px">
                <span style="font-weight:700">Total Deductions:</span>
                <strong style="font-family:monospace;color:var(--danger)">PKR ${calc.deductions.totalDeductions.toLocaleString()}</strong>
              </div>
            </div>

            <!-- Net Payable Banner -->
            <div style="margin-top:14px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--success);text-transform:uppercase">Net Payable Amount</div>
                <div style="font-size:18px;font-weight:800;color:var(--success);font-family:monospace">PKR ${calc.netSettlementAmount.toLocaleString()}</div>
              </div>
              <span class="badge badge-success"><i class="fa fa-check"></i> Ready</span>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  },

  saveNewSettlement() {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Only Administrators can create settlement records.', 'error');
      return;
    }

    const empId = document.getElementById('fnf-add-emp')?.value;
    const exitDateStr = document.getElementById('fnf-add-exit-date')?.value;
    const exitType = document.getElementById('fnf-add-exit-type')?.value;
    const noticeReq = Number(document.getElementById('fnf-add-notice-req')?.value || 30);
    const noticeServed = Number(document.getElementById('fnf-add-notice-served')?.value || 30);
    const notes = document.getElementById('fnf-add-notes')?.value || '';

    if (!empId) {
      Toast.show('Please select an employee.', 'warning');
      return;
    }
    if (!exitDateStr) {
      Toast.show('Please enter exit date.', 'warning');
      return;
    }

    const calc = this.calculate(empId, exitDateStr, {
      noticePeriodRequiredDays: noticeReq,
      noticePeriodServedDays: noticeServed
    });

    const newId = 'FNF-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);

    const record = {
      id: newId,
      employeeId: Number(empId),
      employeeName: calc.employeeName,
      employeeCode: calc.employeeCode,
      department: calc.department,
      designation: calc.designation,
      joinDate: calc.joinDate,
      resignationDate: new Date().toISOString().split('T')[0],
      exitDate: exitDateStr,
      exitType,
      noticePeriodRequiredDays: noticeReq,
      noticePeriodServedDays: noticeServed,
      noticeShortfallDays: calc.deductions.noticeShortfallDays,
      tenure: calc.tenure,
      earnings: calc.earnings,
      deductions: calc.deductions,
      netSettlementAmount: calc.netSettlementAmount,
      amountInWords: calc.amountInWords,
      clearanceGates: {
        hr: { status: 'approved', approvedBy: Auth.employee?.fullName || 'HR Admin', approvedAt: new Date().toISOString().split('T')[0], remarks: 'Settlement initiated' },
        it: { status: 'pending', approvedBy: null, approvedAt: null, remarks: 'Awaiting hardware return & access revocation' },
        finance: { status: 'pending', approvedBy: null, approvedAt: null, remarks: 'Awaiting loan reconciliation' },
        admin: { status: 'pending', approvedBy: null, approvedAt: null, remarks: 'Awaiting keys & badge return' }
      },
      settlementStatus: 'under_clearance',
      paymentDetails: {
        mode: 'bank_transfer',
        bankName: 'Designated Corporate Bank',
        accountNumber: 'Auto-Disburse',
        disbursementDate: null,
        transactionRef: '',
        status: 'pending'
      },
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: Auth.employee?.fullName || 'Admin'
    };

    const settlements = DB.get('settlements') || [];
    settlements.unshift(record);
    DB.set('settlements', settlements);

    document.getElementById('settlement-add-modal')?.remove();
    Toast.show(`Settlement ${newId} created successfully!`, 'success');
    this.render();
  },

  // ────────────────────────────────────────────────────────────
  // ADMIN ACTIONS: EDIT SETTLEMENT MODAL
  // ────────────────────────────────────────────────────────────
  openEditModal(settlementId) {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Editing settlements requires Administrator rights.', 'error');
      return;
    }

    const settlements = DB.get('settlements') || [];
    const s = settlements.find(x => x.id === settlementId);
    if (!s) {
      Toast.show('Settlement record not found.', 'error');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'settlement-edit-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width:860px;width:95%;max-height:90vh;overflow-y:auto">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px">
            <i class="fa fa-pen-to-square" style="color:var(--primary)"></i>
            Edit Full & Final Settlement — ${s.id}
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('settlement-edit-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:20px">
          <!-- Banner -->
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:16px">
            <div>
              <span style="font-weight:800;font-size:14px">${s.employeeName}</span>
              <span style="color:var(--text-3);font-size:12px;margin-left:8px">${s.employeeCode} • Joined: ${s.joinDate} • Exit: ${s.exitDate}</span>
            </div>
            <span class="badge badge-primary">Tenure: ${s.tenure?.roundedTenureYears || 0} years</span>
          </div>

          <!-- Adjustable Financial Components -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px">
            <!-- Left Column: Earnings Adjustments -->
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px">
              <h4 style="margin:0 0 10px;color:var(--success);font-size:13px;display:flex;align-items:center;gap:6px">
                <i class="fa fa-plus-circle"></i> Earnings Adjustments
              </h4>

              <div style="margin-bottom:10px">
                <label class="form-label" style="font-size:11.5px">Last Basic Salary (PKR)</label>
                <input type="number" class="input input-sm" id="fnf-edit-basic" value="${s.earnings?.lastBasicSalary || 0}" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>

              <div style="margin-bottom:10px">
                <label class="form-label" style="font-size:11.5px">Exit Month Worked Days</label>
                <input type="number" class="input input-sm" id="fnf-edit-worked-days" value="${s.earnings?.exitMonthWorkedDays || 30}" min="0" max="31" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>

              <div style="margin-bottom:10px">
                <label class="form-label" style="font-size:11.5px">Unused Leave Days for Encashment</label>
                <input type="number" class="input input-sm" id="fnf-edit-unused-leaves" value="${s.earnings?.unusedLeaves || 0}" min="0" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>

              <div style="margin-bottom:10px">
                <label class="form-label" style="font-size:11.5px;display:flex;justify-content:space-between">
                  <span>Gratuity Override (PKR)</span>
                  <label style="font-size:11px;cursor:pointer">
                    <input type="checkbox" id="fnf-edit-gratuity-override" ${s.earnings?.gratuityOverride ? 'checked' : ''} onchange="Settlement.recalcEditLive('${s.id}')"> Custom Override
                  </label>
                </label>
                <input type="number" class="input input-sm" id="fnf-edit-gratuity-amt" value="${s.earnings?.gratuityAmount || 0}" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>

              <div>
                <label class="form-label" style="font-size:11.5px">Other Additions / Ex-Gratia (PKR)</label>
                <input type="number" class="input input-sm" id="fnf-edit-other-add" value="${s.earnings?.otherAdditions || 0}" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>
            </div>

            <!-- Right Column: Deductions Adjustments -->
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px">
              <h4 style="margin:0 0 10px;color:var(--danger);font-size:13px;display:flex;align-items:center;gap:6px">
                <i class="fa fa-minus-circle"></i> Deductions Adjustments
              </h4>

              <div style="margin-bottom:10px">
                <label class="form-label" style="font-size:11.5px">Outstanding Loans Recovery (PKR)</label>
                <input type="number" class="input input-sm" id="fnf-edit-loans" value="${s.deductions?.outstandingLoans || 0}" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>

              <div style="margin-bottom:10px">
                <label class="form-label" style="font-size:11.5px">Asset Recovery / Damage Deduction (PKR)</label>
                <input type="number" class="input input-sm" id="fnf-edit-asset-recovery" value="${s.deductions?.assetRecoveryDeductions || 0}" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>

              <div style="margin-bottom:10px">
                <label class="form-label" style="font-size:11.5px">Notice Shortfall Deduction (PKR)</label>
                <input type="number" class="input input-sm" id="fnf-edit-notice-ded" value="${s.deductions?.noticeShortfallDeduction || 0}" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>

              <div style="margin-bottom:10px">
                <label class="form-label" style="font-size:11.5px">Exit Tax Withholding (PKR)</label>
                <input type="number" class="input input-sm" id="fnf-edit-tax" value="${s.deductions?.exitTaxWithholding || 0}" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>

              <div>
                <label class="form-label" style="font-size:11.5px">Other Deductions (PKR)</label>
                <input type="number" class="input input-sm" id="fnf-edit-other-ded" value="${s.deductions?.otherDeductions || 0}" oninput="Settlement.recalcEditLive('${s.id}')">
              </div>
            </div>
          </div>

          <!-- Status & Payment Controls -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:11.5px">Settlement Status</label>
              <select class="input input-sm" id="fnf-edit-status">
                <option value="draft" ${s.settlementStatus === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="under_clearance" ${s.settlementStatus === 'under_clearance' ? 'selected' : ''}>Under Clearance</option>
                <option value="approved" ${s.settlementStatus === 'approved' ? 'selected' : ''}>Approved</option>
                <option value="disbursed" ${s.settlementStatus === 'disbursed' ? 'selected' : ''}>Disbursed / Paid</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:11.5px">Payment Status</label>
              <select class="input input-sm" id="fnf-edit-pay-status">
                <option value="pending" ${s.paymentDetails?.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="paid" ${s.paymentDetails?.status === 'paid' ? 'selected' : ''}>Disbursed / Paid</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:11.5px">Bank / Cheque Ref #</label>
              <input type="text" class="input input-sm" id="fnf-edit-pay-ref" value="${s.paymentDetails?.transactionRef || ''}" placeholder="e.g. FT-2026-99214">
            </div>
          </div>

          <!-- Live Computed Total Banner -->
          <div id="fnf-edit-live-banner" style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-3)">REVISED NET PAYABLE</div>
              <div style="font-size:20px;font-weight:800;color:var(--success);font-family:monospace" id="fnf-edit-net-display">
                PKR ${(s.netSettlementAmount || 0).toLocaleString('en-PK')}
              </div>
            </div>
            <button class="btn btn-secondary btn-xs" onclick="Settlement.recalcEditLive('${s.id}')">
              <i class="fa fa-rotate"></i> Recalculate Totals
            </button>
          </div>
        </div>

        <div class="modal-footer" style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center;background:var(--surface)">
          <button class="btn btn-ghost btn-sm text-danger" onclick="Settlement.confirmDelete('${s.id}'); document.getElementById('settlement-edit-modal').remove();">
            <i class="fa fa-trash"></i> Delete Settlement
          </button>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('settlement-edit-modal').remove()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="Settlement.saveEditedSettlement('${s.id}')" style="font-weight:700">
              <i class="fa fa-save"></i> Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  recalcEditLive(settlementId) {
    const basic = Number(document.getElementById('fnf-edit-basic')?.value || 0);
    const workedDays = Number(document.getElementById('fnf-edit-worked-days')?.value || 30);
    const unusedLeaves = Number(document.getElementById('fnf-edit-unused-leaves')?.value || 0);
    const isOverride = document.getElementById('fnf-edit-gratuity-override')?.checked;
    const gratuityInput = document.getElementById('fnf-edit-gratuity-amt');
    const otherAdd = Number(document.getElementById('fnf-edit-other-add')?.value || 0);

    const loans = Number(document.getElementById('fnf-edit-loans')?.value || 0);
    const assetRecovery = Number(document.getElementById('fnf-edit-asset-recovery')?.value || 0);
    const noticeDed = Number(document.getElementById('fnf-edit-notice-ded')?.value || 0);
    const tax = Number(document.getElementById('fnf-edit-tax')?.value || 0);
    const otherDed = Number(document.getElementById('fnf-edit-other-ded')?.value || 0);

    const s = (DB.get('settlements') || []).find(x => x.id === settlementId);
    const tenureYears = s?.tenure?.roundedTenureYears || 0;

    let gratuityAmt = Number(gratuityInput?.value || 0);
    if (!isOverride && tenureYears >= 1) {
      gratuityAmt = Math.round((basic * tenureYears * 30) / 26);
      if (gratuityInput) gratuityInput.value = gratuityAmt;
    }

    const prorated = Math.round((basic / 30) * workedDays);
    const leaveEncash = Math.round((basic / 30) * unusedLeaves);
    const gross = prorated + gratuityAmt + leaveEncash + (s?.earnings?.pfBalanceRefund || 0) + otherAdd;
    const deductions = loans + assetRecovery + noticeDed + tax + (s?.deductions?.exitEOBI || 1300) + otherDed;
    const net = Math.max(0, gross - deductions);

    const netDisplay = document.getElementById('fnf-edit-net-display');
    if (netDisplay) {
      netDisplay.textContent = `PKR ${net.toLocaleString('en-PK')}`;
    }
  },

  saveEditedSettlement(settlementId) {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Only Administrators can modify settlement records.', 'error');
      return;
    }

    const settlements = DB.get('settlements') || [];
    const s = settlements.find(x => x.id === settlementId);
    if (!s) return;

    const basic = Number(document.getElementById('fnf-edit-basic')?.value || 0);
    const workedDays = Number(document.getElementById('fnf-edit-worked-days')?.value || 30);
    const unusedLeaves = Number(document.getElementById('fnf-edit-unused-leaves')?.value || 0);
    const isOverride = document.getElementById('fnf-edit-gratuity-override')?.checked;
    const gratuityAmt = Number(document.getElementById('fnf-edit-gratuity-amt')?.value || 0);
    const otherAdd = Number(document.getElementById('fnf-edit-other-add')?.value || 0);

    const loans = Number(document.getElementById('fnf-edit-loans')?.value || 0);
    const assetRecovery = Number(document.getElementById('fnf-edit-asset-recovery')?.value || 0);
    const noticeDed = Number(document.getElementById('fnf-edit-notice-ded')?.value || 0);
    const tax = Number(document.getElementById('fnf-edit-tax')?.value || 0);
    const otherDed = Number(document.getElementById('fnf-edit-other-ded')?.value || 0);

    const status = document.getElementById('fnf-edit-status')?.value || s.settlementStatus;
    const payStatus = document.getElementById('fnf-edit-pay-status')?.value || 'pending';
    const payRef = document.getElementById('fnf-edit-pay-ref')?.value || '';

    const prorated = Math.round((basic / 30) * workedDays);
    const leaveEncash = Math.round((basic / 30) * unusedLeaves);
    const gross = prorated + gratuityAmt + leaveEncash + (s.earnings?.pfBalanceRefund || 0) + otherAdd;
    const deductions = loans + assetRecovery + noticeDed + tax + (s.deductions?.exitEOBI || 1300) + otherDed;
    const net = Math.max(0, gross - deductions);

    // Update settlement
    s.earnings = {
      ...s.earnings,
      lastBasicSalary: basic,
      exitMonthWorkedDays: workedDays,
      proratedSalary: prorated,
      gratuityAmount: gratuityAmt,
      gratuityOverride: isOverride,
      unusedLeaves,
      leaveEncashmentAmount: leaveEncash,
      otherAdditions: otherAdd,
      grossPayable: gross
    };

    s.deductions = {
      ...s.deductions,
      outstandingLoans: loans,
      assetRecoveryDeductions: assetRecovery,
      noticeShortfallDeduction: noticeDed,
      exitTaxWithholding: tax,
      otherDeductions: otherDed,
      totalDeductions: deductions
    };

    s.netSettlementAmount = net;
    s.amountInWords = this.numberToWordsPKR(net);
    s.settlementStatus = status;
    s.paymentDetails = {
      ...s.paymentDetails,
      status: payStatus,
      transactionRef: payRef,
      disbursementDate: payStatus === 'paid' ? (s.paymentDetails?.disbursementDate || new Date().toISOString().split('T')[0]) : null
    };
    s.updatedAt = new Date().toISOString();

    DB.set('settlements', settlements);
    document.getElementById('settlement-edit-modal')?.remove();
    Toast.show(`Settlement ${s.id} updated successfully!`, 'success');
    this.render();
  },

  // ────────────────────────────────────────────────────────────
  // ADMIN ACTIONS: DELETE SETTLEMENT MODAL
  // ────────────────────────────────────────────────────────────
  confirmDelete(settlementId) {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Deleting settlements requires Administrator rights.', 'error');
      return;
    }

    const settlements = DB.get('settlements') || [];
    const s = settlements.find(x => x.id === settlementId);
    if (!s) return;

    if (!confirm(`⚠️ PERMANENT DELETION WARNING:\n\nAre you sure you want to delete Settlement Voucher ${s.id} for "${s.employeeName}"?\n\nThis will permanently remove the record from all registers.`)) {
      return;
    }

    const remaining = settlements.filter(x => x.id !== settlementId);
    DB.set('settlements', remaining);
    Toast.show(`Settlement ${s.id} has been permanently deleted.`, 'info');
    this.render();
  },

  // ────────────────────────────────────────────────────────────
  // CLEARANCE GATES MODAL (HR, IT, Finance, Admin)
  // ────────────────────────────────────────────────────────────
  openClearanceModal(settlementId) {
    const settlements = DB.get('settlements') || [];
    const s = settlements.find(x => x.id === settlementId);
    if (!s) return;

    const gates = s.clearanceGates || {};
    const isAdmin = this.isAdmin();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'settlement-gates-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width:720px;width:95%">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px">
            <i class="fa fa-tasks" style="color:var(--primary)"></i>
            Multi-Department Clearance Gates — ${s.id}
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('settlement-gates-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:20px">
          <p style="font-size:12.5px;color:var(--text-2);margin-top:0">
            Sign off each gate to release final payroll disbursement for <strong>${s.employeeName}</strong>.
          </p>

          <div style="display:grid;grid-template-columns:1fr;gap:12px">
            <!-- HR Gate -->
            ${this.renderGateRow(s.id, 'hr', 'Human Resources Directorate', 'fa-user-tie', gates.hr, 'Exit interview, NDA, resignation letter verification')}
            <!-- IT Gate -->
            ${this.renderGateRow(s.id, 'it', 'Information Technology', 'fa-laptop-code', gates.it, 'Laptop/accessories inspection, cloud & email accounts deactivation')}
            <!-- Finance Gate -->
            ${this.renderGateRow(s.id, 'finance', 'Finance & Accounts', 'fa-coins', gates.finance, 'Outstanding loan recovery, credit card revocation, tax reconciliations')}
            <!-- Admin Gate -->
            ${this.renderGateRow(s.id, 'admin', 'Administration & Facilities', 'fa-building-shield', gates.admin, 'Building access RFID card, parking permit & cabinet keys')}
          </div>
        </div>

        <div class="modal-footer" style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center;background:var(--surface)">
          <span style="font-size:11.5px;color:var(--text-3)">All 4 gates must be approved prior to voucher disbursement.</span>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('settlement-gates-modal').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  renderGateRow(settlementId, gateKey, title, icon, gateData = {}, desc = '') {
    const isApproved = gateData?.status === 'approved';
    const isAdmin = this.isAdmin();

    return `
      <div style="background:var(--surface);border:1px solid ${isApproved ? 'rgba(16,185,129,0.3)' : 'var(--border)'};border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:8px;background:${isApproved ? 'rgba(16,185,129,0.1)' : 'var(--surface-2)'};color:${isApproved ? 'var(--success)' : 'var(--text-3)'};display:flex;align-items:center;justify-content:center;font-size:16px">
            <i class="fa ${icon}"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--text)">${title}</div>
            <div style="font-size:11px;color:var(--text-3)">${desc}</div>
            ${isApproved ? `<div style="font-size:10.5px;color:var(--success);margin-top:2px"><i class="fa fa-check"></i> Approved by ${gateData.approvedBy} on ${gateData.approvedAt}</div>` : ''}
          </div>
        </div>

        <div>
          ${isAdmin ? `
            <button class="btn btn-xs ${isApproved ? 'btn-secondary' : 'btn-primary'}" onclick="Settlement.toggleGate('${settlementId}', '${gateKey}')">
              ${isApproved ? '<i class="fa fa-undo"></i> Revoke' : '<i class="fa fa-check"></i> Approve Gate'}
            </button>
          ` : `
            <span class="badge ${isApproved ? 'badge-success' : 'badge-warning'}">${isApproved ? 'Cleared' : 'Pending'}</span>
          `}
        </div>
      </div>
    `;
  },

  toggleGate(settlementId, gateKey) {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Administrator rights required to sign off gates.', 'error');
      return;
    }

    const settlements = DB.get('settlements') || [];
    const s = settlements.find(x => x.id === settlementId);
    if (!s) return;

    if (!s.clearanceGates) s.clearanceGates = {};
    if (!s.clearanceGates[gateKey]) s.clearanceGates[gateKey] = { status: 'pending' };

    const currentStatus = s.clearanceGates[gateKey].status;
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';

    s.clearanceGates[gateKey] = {
      status: newStatus,
      approvedBy: newStatus === 'approved' ? (Auth.employee?.fullName || 'HR Administrator') : null,
      approvedAt: newStatus === 'approved' ? new Date().toISOString().split('T')[0] : null,
      remarks: newStatus === 'approved' ? 'Cleared by Admin' : 'Revoked'
    };

    // Check if all 4 gates are cleared
    const gates = s.clearanceGates;
    const allCleared = gates.hr?.status === 'approved' &&
                       gates.it?.status === 'approved' &&
                       gates.finance?.status === 'approved' &&
                       gates.admin?.status === 'approved';

    if (allCleared && s.settlementStatus === 'under_clearance') {
      s.settlementStatus = 'approved';
      Toast.show(`All 4 clearance gates cleared! Settlement ${s.id} is now Approved.`, 'success');
    } else if (!allCleared && s.settlementStatus === 'approved') {
      s.settlementStatus = 'under_clearance';
    }

    s.updatedAt = new Date().toISOString();
    DB.set('settlements', settlements);

    document.getElementById('settlement-gates-modal')?.remove();
    this.openClearanceModal(settlementId);
    this.render();
  },

  // ────────────────────────────────────────────────────────────
  // PRINTABLE OFFICIAL FULL & FINAL SETTLEMENT VOUCHER
  // ────────────────────────────────────────────────────────────
  viewVoucher(settlementId) {
    const settlements = DB.get('settlements') || [];
    const s = settlements.find(x => x.id === settlementId);
    if (!s) return;

    const settings = DB.getObj('settings') || {};
    const companyName = settings.companyName || 'HRM Pro Enterprise Solutions (Pvt) Ltd';
    const companyAddress = settings.companyAddress || 'Corporate Tower, Main Boulevard, Islamabad, Pakistan';
    const companyNtn = settings.ntnNumber || 'NTN: 8849201-4';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'settlement-voucher-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width:880px;width:95%;max-height:92vh;overflow-y:auto;background:#ffffff;color:#111827">
        <!-- Screen Toolbar (hidden during print) -->
        <div class="no-print" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid #e5e7eb;background:#f9fafb">
          <div style="font-weight:700;font-size:13px;color:#374151">
            <i class="fa fa-file-invoice-dollar" style="color:var(--primary);margin-right:6px"></i>
            Settlement Voucher Preview — ${s.id}
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" onclick="window.print()">
              <i class="fa fa-print"></i> Print Voucher (A4)
            </button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('settlement-voucher-modal').remove()">
              Close
            </button>
          </div>
        </div>

        <!-- Printable Document Body -->
        <div id="voucher-printable-area" style="padding:32px 40px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111827">
          <!-- Corporate Letterhead Header -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e3a8a;padding-bottom:14px;margin-bottom:20px">
            <div>
              <h1 style="font-size:22px;font-weight:900;color:#1e3a8a;margin:0;letter-spacing:-0.5px">${companyName}</h1>
              <div style="font-size:11.5px;color:#4b5563;margin-top:3px">${companyAddress}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:2px">${companyNtn} • Corporate HR Directorate</div>
            </div>
            <div style="text-align:right">
              <div style="display:inline-block;padding:4px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;font-size:11.5px;font-weight:800;color:#1e40af;margin-bottom:4px">
                FINAL CLEARANCE VOUCHER
              </div>
              <div style="font-family:monospace;font-weight:700;font-size:13px;color:#111827">Ref: ${s.id}</div>
              <div style="font-size:11px;color:#6b7280">Issue Date: ${new Date().toLocaleDateString('en-PK', { year:'numeric', month:'long', day:'numeric' })}</div>
            </div>
          </div>

          <!-- Employee Profile Box -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:12px">
            <div>
              <span style="color:#64748b;display:block;font-size:10.5px;text-transform:uppercase;font-weight:700">Employee Name</span>
              <strong style="font-size:13.5px;color:#0f172a">${s.employeeName}</strong>
              <div style="color:#475569;font-size:11px">${s.employeeCode}</div>
            </div>
            <div>
              <span style="color:#64748b;display:block;font-size:10.5px;text-transform:uppercase;font-weight:700">Designation & Department</span>
              <strong style="color:#0f172a">${s.designation || 'Engineer'}</strong>
              <div style="color:#475569;font-size:11px">${s.department || 'Operations'}</div>
            </div>
            <div>
              <span style="color:#64748b;display:block;font-size:10.5px;text-transform:uppercase;font-weight:700">Service Period</span>
              <strong style="color:#0f172a">${s.joinDate} to ${s.exitDate}</strong>
              <div style="color:#2563eb;font-weight:700;font-size:11px">Tenure: ${s.tenure?.roundedTenureYears || 0} Years (${s.tenure?.fullYears}y ${s.tenure?.remMonths}m)</div>
            </div>
          </div>

          <!-- Statement of Account (Dual Column: Credits vs Debits) -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
            <!-- Credits / Earnings -->
            <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
              <div style="background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:8px 14px;font-size:12px;font-weight:800;color:#166534;text-transform:uppercase">
                PART A: EARNINGS & ACCRUED BENEFITS
              </div>
              <table style="width:100%;font-size:12px;border-collapse:collapse">
                <tbody>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">Last Basic Salary</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.earnings?.lastBasicSalary || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">Prorated Exit Salary (${s.earnings?.exitMonthWorkedDays || 0} days)</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.earnings?.proratedSalary || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">
                      Statutory Gratuity (${s.tenure?.roundedTenureYears}y × 30/26)
                      <div style="font-size:10px;color:#16a34a">Standing Orders Ord. 1968</div>
                    </td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700;color:#15803d">PKR ${(s.earnings?.gratuityAmount || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">Leave Encashment (${s.earnings?.unusedLeaves || 0} unutilized AL)</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.earnings?.leaveEncashmentAmount || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">Provident Fund Balance Payout</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.earnings?.pfBalanceRefund || 0).toLocaleString()}</td>
                  </tr>
                  ${(s.earnings?.otherAdditions || 0) > 0 ? `
                    <tr style="border-bottom:1px solid #f1f5f9">
                      <td style="padding:8px 12px;color:#475569">Ex-Gratia / Other Allowances</td>
                      <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.earnings.otherAdditions).toLocaleString()}</td>
                    </tr>
                  ` : ''}
                  <tr style="background:#f8fafc;font-weight:800">
                    <td style="padding:10px 12px;color:#0f172a">TOTAL CREDITS (A)</td>
                    <td style="padding:10px 12px;text-align:right;font-family:monospace;color:#15803d">PKR ${(s.earnings?.grossPayable || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Debits / Deductions -->
            <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
              <div style="background:#fef2f2;border-bottom:1px solid #fecaca;padding:8px 14px;font-size:12px;font-weight:800;color:#991b1b;text-transform:uppercase">
                PART B: DEDUCTIONS & RECOVERIES
              </div>
              <table style="width:100%;font-size:12px;border-collapse:collapse">
                <tbody>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">Outstanding Company Loans</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.deductions?.outstandingLoans || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">Company Asset Recovery / Damage</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.deductions?.assetRecoveryDeductions || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">Notice Shortfall Deduction (${s.deductions?.noticeShortfallDays || 0}d)</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.deductions?.noticeShortfallDeduction || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">Statutory Tax Withholding (FBR)</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.deductions?.exitTaxWithholding || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:8px 12px;color:#475569">EOBI Contribution</td>
                    <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.deductions?.exitEOBI || 1300).toLocaleString()}</td>
                  </tr>
                  ${(s.deductions?.otherDeductions || 0) > 0 ? `
                    <tr style="border-bottom:1px solid #f1f5f9">
                      <td style="padding:8px 12px;color:#475569">Other Deductions / Overpayments</td>
                      <td style="padding:8px 12px;text-align:right;font-family:monospace;font-weight:700">PKR ${(s.deductions.otherDeductions).toLocaleString()}</td>
                    </tr>
                  ` : ''}
                  <tr style="background:#f8fafc;font-weight:800">
                    <td style="padding:10px 12px;color:#0f172a">TOTAL DEBITS (B)</td>
                    <td style="padding:10px 12px;text-align:right;font-family:monospace;color:#dc2626">PKR ${(s.deductions?.totalDeductions || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Net Settlement Payable Highlight Box -->
          <div style="background:#f8fafc;border:2px solid #2563eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-size:11.5px;color:#64748b;font-weight:800;text-transform:uppercase">NET SETTLEMENT PAYABLE (A - B)</span>
              <div style="font-size:24px;font-weight:900;color:#1e40af;font-family:monospace;margin-top:2px">
                PKR ${(s.netSettlementAmount || 0).toLocaleString('en-PK')}
              </div>
              <div style="font-size:11.5px;color:#334155;font-style:italic;margin-top:3px">
                Amount in words: <strong>${s.amountInWords || 'Zero Rupees Only'}</strong>
              </div>
            </div>
            <div style="text-align:right;font-size:11px;color:#475569">
              <div>Payment Mode: <strong>${s.paymentDetails?.mode || 'Direct Bank Transfer'}</strong></div>
              <div>Account: <strong>${s.paymentDetails?.accountNumber || 'Primary Corporate Bank'}</strong></div>
              <div style="color:#16a34a;font-weight:700;margin-top:2px">Status: ${s.paymentDetails?.status === 'paid' ? 'PAID / DISBURSED' : 'AUTHORIZED FOR DISBURSEMENT'}</div>
            </div>
          </div>

          <!-- Clearance Checklist Verification Status -->
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:32px;font-size:11px">
            <div style="font-weight:800;color:#334155;text-transform:uppercase;margin-bottom:6px">Departmental Clearance Verification</div>
            <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px">
              <div>✔ HR Clearance: <strong>${s.clearanceGates?.hr?.status === 'approved' ? 'CLEARED' : 'PENDING'}</strong></div>
              <div>✔ IT & Security: <strong>${s.clearanceGates?.it?.status === 'approved' ? 'CLEARED' : 'PENDING'}</strong></div>
              <div>✔ Finance & Accounts: <strong>${s.clearanceGates?.finance?.status === 'approved' ? 'CLEARED' : 'PENDING'}</strong></div>
              <div>✔ Admin & Facilities: <strong>${s.clearanceGates?.admin?.status === 'approved' ? 'CLEARED' : 'PENDING'}</strong></div>
            </div>
          </div>

          <!-- Formal Signoff Signature Blocks -->
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-top:40px;text-align:center;font-size:11px;color:#475569">
            <div>
              <div style="height:44px;border-bottom:1px solid #cbd5e1;margin-bottom:6px"></div>
              <strong style="color:#0f172a;display:block">${s.employeeName}</strong>
              <span>Exiting Employee</span>
            </div>
            <div>
              <div style="height:44px;border-bottom:1px solid #cbd5e1;margin-bottom:6px"></div>
              <strong style="color:#0f172a;display:block">Sara Malik</strong>
              <span>Head of Human Resources</span>
            </div>
            <div>
              <div style="height:44px;border-bottom:1px solid #cbd5e1;margin-bottom:6px"></div>
              <strong style="color:#0f172a;display:block">Bilal Ahmed</strong>
              <span>Finance Director</span>
            </div>
            <div>
              <div style="height:44px;border-bottom:1px solid #cbd5e1;margin-bottom:6px"></div>
              <strong style="color:#0f172a;display:block">Ahmed Khan</strong>
              <span>Chief Executive Officer</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // ────────────────────────────────────────────────────────────
  // CSV EXPORT
  // ────────────────────────────────────────────────────────────
  exportCSV() {
    const settlements = DB.get('settlements') || [];
    if (settlements.length === 0) {
      Toast.show('No settlements available to export.', 'warning');
      return;
    }

    const headers = [
      'Voucher ID', 'Employee Code', 'Employee Name', 'Department', 'Join Date', 'Exit Date', 'Exit Type',
      'Tenure (Years)', 'Last Basic (PKR)', 'Prorated Salary (PKR)', 'Gratuity Amount (PKR)',
      'Leave Encashment (PKR)', 'PF Payout (PKR)', 'Gross Earnings (PKR)',
      'Loan Recovery (PKR)', 'Asset Recovery (PKR)', 'Notice Shortfall (PKR)', 'Tax Withholding (PKR)', 'Total Deductions (PKR)',
      'Net Payable (PKR)', 'Clearance Status', 'Payment Status'
    ];

    const rows = settlements.map(s => [
      s.id,
      `"${s.employeeCode || ''}"`,
      `"${s.employeeName || ''}"`,
      `"${s.department || ''}"`,
      s.joinDate || '',
      s.exitDate || '',
      s.exitType || '',
      s.tenure?.roundedTenureYears || 0,
      s.earnings?.lastBasicSalary || 0,
      s.earnings?.proratedSalary || 0,
      s.earnings?.gratuityAmount || 0,
      s.earnings?.leaveEncashmentAmount || 0,
      s.earnings?.pfBalanceRefund || 0,
      s.earnings?.grossPayable || 0,
      s.deductions?.outstandingLoans || 0,
      s.deductions?.assetRecoveryDeductions || 0,
      s.deductions?.noticeShortfallDeduction || 0,
      s.deductions?.exitTaxWithholding || 0,
      s.deductions?.totalDeductions || 0,
      s.netSettlementAmount || 0,
      `"${s.settlementStatus || ''}"`,
      `"${s.paymentDetails?.status || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csvContent, `settlements_register_${new Date().toISOString().slice(0,10)}.csv`);
    Toast.show(`Exported ${settlements.length} settlement records as CSV!`, 'success');
  }
};

window.Settlement = Settlement;
