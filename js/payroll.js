// ============================================================
// HRM SYSTEM — Payroll Module
// ============================================================

const Payroll = {
  currentView: 'salary',
  currentMonth: Utils.thisMonth(),

  render() {
    this.ensurePFData();
    const content = document.getElementById('page-content');
    const isHrOrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
    const isEmp = !isHrOrAdmin; // Managers, employees, and onboarding only see their personal finances

    // Auto-scope personal users to slips if on an admin view
    if (isEmp && (this.currentView === 'salary' || this.currentView === 'allowances' || this.currentView === 'deductions' || this.currentView === 'bank_advice' || this.currentView === 'statutory' || this.currentView === 'structures')) {
      this.currentView = 'slips';
    }

    const salaries = DB.get('salary');
    const loans = DB.get('loans');
    const companyPF = this.getCompanyPFSummary();
    const empPF = isEmp ? this.getEmployeePFSummary(Auth.employee?.id) : null;
    const empSalary = isEmp ? salaries.find(s => s.employeeId === Auth.employee?.id && s.month === this.currentMonth) : null;

    const stats = isEmp ? [
      { label:'Base Salary', val: Utils.formatCurrency(Auth.employee?.salary || 0), icon:'fa-wallet', color:'var(--primary)' },
      { label:'Net Pay (' + this.currentMonth + ')', val: empSalary ? Utils.formatCurrency(empSalary.netSalary) : 'Pending', icon:'fa-money-bill-wave', color:'var(--success)' },
      { label:'My Accumulated PF', val: Utils.formatCurrency(empPF?.totalBalance || 0), icon:'fa-piggy-bank', color:'var(--accent)' },
      { label:'Active Loans', val: loans.filter(l=>l.employeeId===Auth.employee?.id && l.status==='active').length, icon:'fa-hand-holding-dollar', color:'var(--warning)', suffix:' loan(s)' },
    ] : [
      { label:'Total Payroll (' + this.currentMonth + ')', val: Utils.formatCurrency(salaries.filter(s => s.month === this.currentMonth && s.status === 'processed').reduce((a,s) => a+s.netSalary, 0)), icon:'fa-money-bill-wave', color:'var(--success)' },
      { label:'Pending Salaries', val: salaries.filter(s => s.month === this.currentMonth && s.status === 'pending').length, icon:'fa-clock', color:'var(--warning)', suffix:' emps' },
      { label:'PF Fund Pool', val: Utils.formatCurrency(companyPF.totalPool), icon:'fa-piggy-bank', color:'var(--primary)', suffix:` (${companyPF.activeMembers} emps)` },
      { label:'Active Loans', val: loans.filter(l=>l.status==='active').length, icon:'fa-hand-holding-dollar', color:'var(--info)' },
    ];

    const tabs = isEmp ? [
      { id:'slips', label:'My Payslips', icon:'fa-file-invoice-dollar' },
      { id:'pf', label:'My Provident Fund', icon:'fa-piggy-bank' },
      { id:'tax', label:'Tax & Slabs', icon:'fa-scale-balanced' },
      { id:'loans', label:'My Loans', icon:'fa-hand-holding-dollar' },
    ] : [
      { id:'salary', label:'Salary Processing', icon:'fa-money-check' },
      { id:'tax', label:'FBR Tax Engine', icon:'fa-scale-balanced' },
      { id:'bank_advice', label:'Bank Advice', icon:'fa-building-columns' },
      { id:'statutory', label:'Statutory Ledgers', icon:'fa-landmark-dome' },
      { id:'allowances', label:'Allowances', icon:'fa-circle-plus' },
      { id:'deductions', label:'Deductions', icon:'fa-circle-minus' },
      { id:'structures', label:'Salary Structures', icon:'fa-layer-group' },
      { id:'loans', label:'Loans', icon:'fa-hand-holding-dollar' },
      { id:'slips', label:'Payslips', icon:'fa-file-invoice-dollar' },
      { id:'pf', label:'Provident Fund', icon:'fa-piggy-bank' },
    ];

    content.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          ${stats.map(s => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px">
              <div style="width:48px;height:48px;border-radius:12px;background:${s.color}22;display:flex;align-items:center;justify-content:center;font-size:20px;color:${s.color}">
                <i class="fa ${s.icon}"></i>
              </div>
              <div>
                <div style="font-size:20px;font-weight:800;color:${s.color}">${s.val}${s.suffix||''}</div>
                <div style="font-size:12px;color:var(--text-3)">${s.label}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap">
          ${tabs.map(t => `
            <button class="tab-toggle-btn ${this.currentView===t.id?'active':''}" onclick="Payroll.switchView('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
            </button>
          `).join('')}
        </div>

        <style>
          .tab-toggle-btn { padding:8px 14px;border:none;background:transparent;color:var(--text-3);font-size:12.5px;font-weight:500;border-radius:7px;cursor:pointer;transition:all .2s; }
          .tab-toggle-btn.active { background:var(--primary);color:white; }
          .tab-toggle-btn:hover:not(.active) { background:var(--surface-2);color:var(--text); }
        </style>

        <div id="payroll-content"></div>
      </div>
    `;
    this.renderView();
  },

  switchView(view) {
    const isHrOrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
    const adminOnlyViews = ['salary', 'allowances', 'deductions', 'bank_advice', 'statutory', 'structures'];
    if (!isHrOrAdmin && adminOnlyViews.includes(view)) {
      Toast.show('Access Denied: Company salary registers and processing are restricted to HR & Admin.', 'error');
      view = 'slips';
    }
    this.currentView = view;
    document.querySelectorAll('[onclick*="Payroll.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\w+)'/);
      if (m) b.classList.toggle('active', m[1] === view);
    });
    this.renderView();
  },

  switchTab(tab) {
    this.switchView(tab);
  },

  renderView() {
    const container = document.getElementById('payroll-content');
    if (!container) return;
    switch(this.currentView) {
      case 'salary':      this.renderSalary(container); break;
      case 'tax':         this.renderTaxEngine(container); break;
      case 'bank_advice': this.renderBankAdvice(container); break;
      case 'statutory':   this.renderStatutoryLedgers(container); break;
      case 'allowances':  this.renderAllowances(container); break;
      case 'deductions':  this.renderDeductions(container); break;
      case 'structures':  this.renderSalaryStructures(container); break;
      case 'loans':       this.renderLoans(container); break;
      case 'slips':       this.renderSlips(container); break;
      case 'pf':          this.renderProvidentFund(container); break;
    }
  },

  renderSalary(container) {
    const salaries = DB.get('salary').filter(s => s.month === this.currentMonth);
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const allMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
    const monthLabel = new Date(this.currentMonth + '-01').toLocaleDateString('en', { month: 'long', year: 'numeric' });

    // Governance Pre-Payroll Discrepancy Check
    const problems = typeof Administration !== 'undefined' && Administration.getAttendanceLeaveProblems
      ? Administration.getAttendanceLeaveProblems(this.currentMonth)
      : [];
    const unresolved = problems.filter(p => !p.isResolved);
    const isBlocked = unresolved.length > 0;

    container.innerHTML = `
      <!-- Discrepancy Payroll Governance Blocker Banner -->
      ${isBlocked ? `
        <div style="background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(245,158,11,0.08));border:1.5px solid rgba(239,68,68,0.35);border-radius:12px;padding:16px 20px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:44px;height:44px;border-radius:12px;background:#ef444422;display:flex;align-items:center;justify-content:center;color:var(--danger);font-size:20px;flex-shrink:0">
              <i class="fa fa-lock"></i>
            </div>
            <div>
              <div style="font-weight:800;color:var(--danger);font-size:14.5px;display:flex;align-items:center;gap:8px">
                <span>PAYROLL FINALIZATION BLOCKED FOR ${monthLabel.toUpperCase()}</span>
                <span class="badge badge-danger">${unresolved.length} UNRESOLVED ISSUES</span>
              </div>
              <div style="font-size:12.5px;color:var(--text-2);margin-top:3px">
                Company audit policy strictly prohibits processing payroll while attendance discrepancies, unexcused late arrivals (>11:00 AM), or unapproved leaves exist.
              </div>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="App.navigate('administration'); setTimeout(() => Administration.switchSection('discrepancies'), 100);">
            <i class="fa fa-triangle-exclamation"></i> Resolve in Audit Center (${unresolved.length})
          </button>
        </div>
      ` : `
        <div style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(99,102,241,0.06));border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:10px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--text)">
            <i class="fa fa-circle-check" style="color:var(--success);font-size:16px"></i>
            <span><strong>Audit Verified:</strong> All attendance and leave records for <strong>${monthLabel}</strong> are cleared. Payroll is unlocked with automatic leave deductions.</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('administration'); setTimeout(() => Administration.switchSection('discrepancies'), 100);"><i class="fa fa-list-check"></i> Audit Center</button>
        </div>
      `}

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <select class="filter-select" onchange="Payroll.currentMonth=this.value;Payroll.renderView()" style="width:190px">
          ${allMonths.map(m => `<option value="${m}" ${m===this.currentMonth?'selected':''}>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>`).join('')}
        </select>
        ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `
          <button class="btn btn-warning btn-sm" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;font-weight:700;box-shadow:0 2px 6px rgba(245,158,11,0.3)" onclick="Payroll.syncAttendanceToPayroll('${this.currentMonth}')" title="Scan attendance logs to auto-calculate LOP deductions, late check-in penalties, overtime bonuses, and compute genuine FBR tax">
            <i class="fa fa-bolt"></i> 1-Click Sync Attendance & Deductions
          </button>
          <button class="btn ${isBlocked ? 'btn-danger' : 'btn-primary'} btn-sm" onclick="Payroll.processAll()">
            <i class="fa ${isBlocked ? 'fa-lock' : 'fa-cogs'}"></i> ${isBlocked ? `Process All (Blocked - ${unresolved.length} Issues)` : 'Process All for Month'}
          </button>
          <button class="btn btn-secondary btn-sm" onclick="Payroll.showGenerateSlipModal(null, Payroll.currentMonth)"><i class="fa fa-plus"></i> New Salary Slip</button>
          <button class="btn btn-ghost btn-sm" onclick="Payroll.exportPayroll()"><i class="fa fa-file-export"></i> Export WPS</button>
        ` : ''}
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr>
              <th>Employee</th>
              <th>Basic Salary</th>
              <th>Allowances</th>
              <th>Deductions</th>
              <th>Overtime</th>
              <th>Bonus</th>
              <th>Tax</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              ${emps.map(emp => {
                const rec = salaries.find(s => s.employeeId === emp.id);
                if (!rec) return `
                  <tr>
                    <td><div style="display:flex;align-items:center;gap:10px">
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                      <div><div style="font-weight:600;font-size:13px">${emp.fullName}</div><div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div></div>
                    </div></td>
                    <td>${Utils.formatCurrency(emp.salary)}</td>
                    <td colspan="6" style="color:var(--text-muted);font-size:12px">Salary not yet processed for this month</td>
                    <td><span class="badge badge-secondary">Not Processed</span></td>
                    <td>
                      ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `
                        <button class="btn btn-primary btn-sm" onclick="Payroll.showGenerateSlipModal(${emp.id},'${this.currentMonth}')"><i class="fa fa-cogs"></i> Generate</button>
                      ` : '—'}
                    </td>
                  </tr>`;
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                    <div><div style="font-weight:600;font-size:13px">${emp.fullName}</div><div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div></div>
                  </div></td>
                  <td>${Utils.formatCurrency(rec.basic)}</td>
                  <td style="color:var(--success)">${Utils.formatCurrency(rec.allowances)}</td>
                  <td style="color:var(--danger)">${Utils.formatCurrency(rec.deductions)}</td>
                  <td style="color:var(--info)">${Utils.formatCurrency(rec.overtime)}</td>
                  <td style="color:var(--warning)">${Utils.formatCurrency(rec.bonus)}</td>
                  <td style="color:var(--danger)">${Utils.formatCurrency(rec.tax)}</td>
                  <td style="font-weight:700;color:var(--success)">${Utils.formatCurrency(rec.netSalary)}</td>
                  <td>${Utils.statusBadge(rec.status)}</td>
                  <td>
                    <div class="tbl-actions">
                      <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.viewSlip(${emp.id},'${this.currentMonth}')" title="View Slip"><i class="fa fa-eye"></i></button>
                      <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.printSlip(${emp.id},'${this.currentMonth}')" title="Print"><i class="fa fa-print"></i></button>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAllowances(container) {
    const allowances = DB.get('allowances');
    container.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `<button class="btn btn-primary btn-sm" onclick="Payroll.showAddAllowance()"><i class="fa fa-plus"></i> Add Allowance</button>` : ''}
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Allowance Name</th><th>Code</th><th>Type</th><th>Value</th><th>Taxable</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${allowances.map(a => `<tr>
                <td style="font-weight:600">${a.name}</td>
                <td><span class="chip">${a.code}</span></td>
                <td>${a.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                <td style="font-weight:700;color:var(--success)">${a.type === 'percentage' ? a.value + '%' : Utils.formatCurrency(a.value)}</td>
                <td>${a.taxable ? '<span class="badge badge-danger">Taxable</span>' : '<span class="badge badge-success">Non-Taxable</span>'}</td>
                <td>${Utils.statusBadge(a.status)}</td>
                <td>
                  <div class="tbl-actions">
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.editAllowance(${a.id})"><i class="fa fa-pen"></i></button>
                    <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Payroll.deleteAllowance(${a.id})"><i class="fa fa-trash"></i></button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showAddAllowance() {
    Modal.show('Add Allowance', `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Allowance Name</label><input class="form-control" id="al-name" placeholder="e.g. House Rent Allowance"></div>
        <div class="form-group"><label class="form-label required">Code</label><input class="form-control" id="al-code" placeholder="e.g. HRA" maxlength="10"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="al-type" onchange="Payroll._toggleAllowanceType()">
            <option value="percentage">Percentage of Basic</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label required">Value</label>
          <div style="position:relative">
            <input class="form-control" id="al-value" type="number" placeholder="0" min="0">
            <span id="al-type-suffix" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px">%</span>
          </div>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Taxable?</label>
        <select class="form-control" id="al-taxable"><option value="false">Non-Taxable</option><option value="true">Taxable</option></select>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Payroll.saveAllowance()"><i class="fa fa-save"></i> Save</button>`
    });
  },
  _toggleAllowanceType() {
    const type = document.getElementById('al-type').value;
    const suf = document.getElementById('al-type-suffix');
    if (suf) suf.textContent = type === 'percentage' ? '%' : 'PKR';
  },
  saveAllowance() {
    const name = document.getElementById('al-name').value.trim();
    const code = document.getElementById('al-code').value.trim();
    const value = parseFloat(document.getElementById('al-value').value) || 0;
    if (!name || !code) { Toast.show('Name and code required', 'error'); return; }
    DB.add('allowances', {
      id: DB.nextId('allowances'), name, code: code.toUpperCase(),
      type: document.getElementById('al-type').value,
      value, taxable: document.getElementById('al-taxable').value === 'true',
      status: 'active'
    });
    DB.log('ADD', 'Payroll', `Allowance ${name} added`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Allowance added!', 'success');
    this.renderView();
  },
  editAllowance(id) {
    const a = DB.find('allowances', id);
    if (!a) return;
    Modal.show(`Edit Allowance — ${a.name}`, `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Name</label><input class="form-control" id="al-ename" value="${a.name}"></div>
        <div class="form-group"><label class="form-label required">Code</label><input class="form-control" id="al-ecode" value="${a.code}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="al-etype">
            <option value="percentage" ${a.type==='percentage'?'selected':''}>Percentage of Basic</option>
            <option value="fixed" ${a.type==='fixed'?'selected':''}>Fixed Amount</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Value</label><input class="form-control" id="al-evalue" type="number" value="${a.value}"></div>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Payroll.updateAllowance(${id})">Update</button>`
    });
  },
  updateAllowance(id) {
    DB.update('allowances', id, {
      name: document.getElementById('al-ename').value.trim(),
      code: document.getElementById('al-ecode').value.trim().toUpperCase(),
      type: document.getElementById('al-etype').value,
      value: parseFloat(document.getElementById('al-evalue').value) || 0,
    });
    Modal.close('dynamic-modal');
    Toast.show('Allowance updated!', 'success');
    this.renderView();
  },
  deleteAllowance(id) {
    const a = DB.find('allowances', id);
    Modal.confirm('Delete Allowance', `Delete <strong>${a?.name}</strong>?`, () => {
      DB.delete('allowances', id);
      Toast.show('Allowance deleted!', 'warning');
      this.renderView();
    });
  },


  renderDeductions(container) {
    const deductions = DB.get('deductions');
    container.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `<button class="btn btn-primary btn-sm" onclick="Payroll.showAddDeduction()"><i class="fa fa-plus"></i> Add Deduction</button>` : ''}
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Deduction Name</th><th>Code</th><th>Type</th><th>Value</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${deductions.map(d => `<tr>
                <td style="font-weight:600">${d.name}</td>
                <td><span class="chip">${d.code}</span></td>
                <td>${d.type.charAt(0).toUpperCase()+d.type.slice(1)}</td>
                <td style="font-weight:700;color:var(--danger)">${d.type === 'percentage' ? d.value + '%' : d.type === 'calculated' ? 'Auto' : Utils.formatCurrency(d.value)}</td>
                <td>${Utils.statusBadge(d.status)}</td>
                <td>
                  <div class="tbl-actions">
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.editDeduction(${d.id})"><i class="fa fa-pen"></i></button>
                    <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Payroll.deleteDeduction(${d.id})"><i class="fa fa-trash"></i></button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showAddDeduction() {
    Modal.show('Add Deduction', `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Deduction Name</label><input class="form-control" id="ded-name" placeholder="e.g. Provident Fund"></div>
        <div class="form-group"><label class="form-label required">Code</label><input class="form-control" id="ded-code" placeholder="e.g. PF" maxlength="10"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="ded-type">
            <option value="percentage">Percentage of Basic</option>
            <option value="fixed">Fixed Amount</option>
            <option value="calculated">Auto-Calculated</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Value</label><input class="form-control" id="ded-value" type="number" placeholder="0" min="0"></div>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Payroll.saveDeduction()"><i class="fa fa-save"></i> Save</button>`
    });
  },
  saveDeduction() {
    const name = document.getElementById('ded-name').value.trim();
    const code = document.getElementById('ded-code').value.trim();
    if (!name || !code) { Toast.show('Name and code required', 'error'); return; }
    DB.add('deductions', {
      id: DB.nextId('deductions'), name, code: code.toUpperCase(),
      type: document.getElementById('ded-type').value,
      value: parseFloat(document.getElementById('ded-value').value) || 0,
      status: 'active'
    });
    DB.log('ADD', 'Payroll', `Deduction ${name} added`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Deduction added!', 'success');
    this.renderView();
  },
  editDeduction(id) {
    const d = DB.find('deductions', id);
    if (!d) return;
    Modal.show(`Edit Deduction — ${d.name}`, `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Name</label><input class="form-control" id="ded-ename" value="${d.name}"></div>
        <div class="form-group"><label class="form-label required">Code</label><input class="form-control" id="ded-ecode" value="${d.code}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="ded-etype">
            <option value="percentage" ${d.type==='percentage'?'selected':''}>Percentage</option>
            <option value="fixed" ${d.type==='fixed'?'selected':''}>Fixed</option>
            <option value="calculated" ${d.type==='calculated'?'selected':''}>Auto</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Value</label><input class="form-control" id="ded-evalue" type="number" value="${d.value}"></div>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Payroll.updateDeduction(${id})">Update</button>`
    });
  },
  updateDeduction(id) {
    DB.update('deductions', id, {
      name: document.getElementById('ded-ename').value.trim(),
      code: document.getElementById('ded-ecode').value.trim().toUpperCase(),
      type: document.getElementById('ded-etype').value,
      value: parseFloat(document.getElementById('ded-evalue').value) || 0,
    });
    Modal.close('dynamic-modal');
    Toast.show('Deduction updated!', 'success');
    this.renderView();
  },
  deleteDeduction(id) {
    const d = DB.find('deductions', id);
    Modal.confirm('Delete Deduction', `Delete <strong>${d?.name}</strong>?`, () => {
      DB.delete('deductions', id);
      Toast.show('Deduction deleted!', 'warning');
      this.renderView();
    });
  },


  loanFilterStatus: 'all',
  loanFilterType: 'all',

  renderLoans(container) {
    const isHrOrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
    let allLoans = DB.get('loans') || [];
    let displayLoans = isHrOrAdmin ? allLoans : allLoans.filter(l => l.employeeId === Auth.employee?.id);

    if (this.loanFilterStatus && this.loanFilterStatus !== 'all') {
      displayLoans = displayLoans.filter(l => l.status === this.loanFilterStatus);
    }
    if (this.loanFilterType && this.loanFilterType !== 'all') {
      displayLoans = displayLoans.filter(l => (l.loanType || 'standard') === this.loanFilterType);
    }

    const activeLoans = displayLoans.filter(l => l.status === 'active');
    const pendingLoans = displayLoans.filter(l => l.status === 'pending_approval');
    const totalActiveAmount = activeLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalMonthlyDeduction = activeLoans.reduce((sum, l) => sum + (l.monthlyDeduction || 0), 0);
    const pfLoansCount = activeLoans.filter(l => l.loanType === 'pf_loan').length;

    // For personal view: calculate PF borrowing capacity
    const empPFSummary = !isHrOrAdmin ? this.getEmployeePFSummary(Auth.employee?.id) : null;
    const maxPFLoanEligible = empPFSummary ? Math.round(empPFSummary.totalBalance * 0.80) : 0;

    container.innerHTML = `
      <!-- KPI Overview Cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">${isHrOrAdmin ? 'Active Company Loans' : 'My Active Loans'}</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:6px">${activeLoans.length} active</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${Utils.formatCurrency(totalActiveAmount)} principal</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Monthly Salary Deductions</div>
          <div style="font-size:22px;font-weight:800;color:var(--danger);margin-top:6px">${Utils.formatCurrency(totalMonthlyDeduction)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Auto-recovered per month</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">${isHrOrAdmin ? 'Loans Against PF' : 'PF Loan Eligible Limit'}</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:6px">${isHrOrAdmin ? pfLoansCount + ' PF loans' : Utils.formatCurrency(maxPFLoanEligible)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${isHrOrAdmin ? 'Secured by PF Trust equity' : '80% of your PF balance'}</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">${isHrOrAdmin ? 'Pending Approval' : 'Application Status'}</div>
          <div style="font-size:22px;font-weight:800;color:var(--warning);margin-top:6px">${pendingLoans.length} pending</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${isHrOrAdmin ? 'Awaiting HR authorization' : (pendingLoans.length > 0 ? 'Under review by HR' : 'All clear')}</div>
        </div>
      </div>

      <!-- Action & Filter Bar -->
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select class="filter-select" onchange="Payroll.loanFilterStatus=this.value;Payroll.renderLoans(document.getElementById('payroll-content'))" style="width:160px">
            <option value="all" ${this.loanFilterStatus==='all'?'selected':''}>All Statuses</option>
            <option value="active" ${this.loanFilterStatus==='active'?'selected':''}>Active</option>
            <option value="pending_approval" ${this.loanFilterStatus==='pending_approval'?'selected':''}>Pending Approval</option>
            <option value="completed" ${this.loanFilterStatus==='completed'?'selected':''}>Completed / Paid</option>
            <option value="rejected" ${this.loanFilterStatus==='rejected'?'selected':''}>Rejected</option>
          </select>
          <select class="filter-select" onchange="Payroll.loanFilterType=this.value;Payroll.renderLoans(document.getElementById('payroll-content'))" style="width:190px">
            <option value="all" ${this.loanFilterType==='all'?'selected':''}>All Loan Types</option>
            <option value="standard" ${this.loanFilterType==='standard'?'selected':''}>Standard Loan</option>
            <option value="pf_loan" ${this.loanFilterType==='pf_loan'?'selected':''}>Loan Against PF</option>
            <option value="advance" ${this.loanFilterType==='advance'?'selected':''}>Salary Advance</option>
          </select>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${isHrOrAdmin ? `
            <button class="btn btn-secondary btn-sm" onclick="Payroll.exportLoansCSV()"><i class="fa fa-file-csv"></i> Export Loans (CSV)</button>
            <button class="btn btn-primary btn-sm" onclick="Payroll.showAddLoan(false)"><i class="fa fa-plus"></i> Grant New Loan</button>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="Payroll.showAddLoan(true)"><i class="fa fa-paper-plane"></i> Apply for Loan / PF Loan</button>
          `}
        </div>
      </div>

      <!-- Loans Master Table -->
      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Loan Type</th>
                <th>Principal Amount</th>
                <th>Monthly Deduction</th>
                <th>Installments Progress</th>
                <th>Outstanding Balance</th>
                <th>Start Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${displayLoans.length === 0 ? `
                <tr><td colspan="9" style="text-align:center;padding:36px;color:var(--text-muted)">No loan records found matching the current filters.</td></tr>
              ` : displayLoans.map(l => {
                const emp = DB.find('employees', l.employeeId);
                const isPFLoan = l.loanType === 'pf_loan';
                const isAdvance = l.loanType === 'advance';
                const paidCount = l.installments - (l.remaining || 0);
                const outstanding = (l.remaining || 0) * (l.monthlyDeduction || 0);
                const progressPct = Math.round((paidCount / l.installments) * 100);

                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(l.employeeId)}">${Utils.avatarInitials(emp?.fullName || 'E')}</div>
                        <div>
                          <div style="font-weight:700;font-size:13px">${emp?.fullName || Utils.getEmpName(l.employeeId)}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp?.empNo || '—'} &bull; ${Utils.getDeptName(emp?.departmentId)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      ${isPFLoan ? `
                        <span class="badge badge-primary" style="display:inline-flex;align-items:center;gap:4px">
                          <i class="fa fa-piggy-bank"></i> Loan Against PF
                        </span>
                      ` : isAdvance ? `
                        <span class="badge badge-warning" style="display:inline-flex;align-items:center;gap:4px">
                          <i class="fa fa-money-bill-transfer"></i> Salary Advance
                        </span>
                      ` : `
                        <span class="badge badge-secondary" style="display:inline-flex;align-items:center;gap:4px">
                          <i class="fa fa-hand-holding-dollar"></i> Personal Loan
                        </span>
                      `}
                      <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">${l.purpose}</div>
                    </td>
                    <td style="font-weight:700">${Utils.formatCurrency(l.amount)}</td>
                    <td style="color:var(--danger);font-weight:700">${Utils.formatCurrency(l.monthlyDeduction)}</td>
                    <td>
                      <div style="font-size:12px;font-weight:600;margin-bottom:3px">${paidCount} of ${l.installments} paid (${progressPct}%)</div>
                      <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;width:110px">
                        <div style="height:100%;background:${l.status==='completed'?'var(--success)':'var(--primary)'};width:${progressPct}%"></div>
                      </div>
                    </td>
                    <td style="font-weight:800;color:${outstanding > 0 ? 'var(--warning)' : 'var(--success)'}">
                      ${outstanding > 0 ? Utils.formatCurrency(outstanding) : '<span style="color:var(--success)"><i class="fa fa-check-circle"></i> Nil</span>'}
                    </td>
                    <td>${Utils.formatDate(l.startDate)}</td>
                    <td>
                      ${l.status === 'pending_approval' ? '<span class="badge badge-warning"><i class="fa fa-clock"></i> Pending Approval</span>' :
                        l.status === 'completed' ? '<span class="badge badge-success"><i class="fa fa-check-double"></i> Fully Paid</span>' :
                        l.status === 'rejected' ? '<span class="badge badge-danger"><i class="fa fa-times-circle"></i> Rejected</span>' :
                        '<span class="badge badge-primary"><i class="fa fa-spinner fa-spin-pulse"></i> Active</span>'}
                    </td>
                    <td>
                      <div style="display:flex;gap:5px;align-items:center">
                        ${l.status === 'pending_approval' && isHrOrAdmin ? `
                          <button class="btn btn-success btn-xs" onclick="Payroll.approveLoan(${l.id})" title="Authorize Loan"><i class="fa fa-check"></i> Approve</button>
                          <button class="btn btn-danger btn-xs" onclick="Payroll.rejectLoan(${l.id})" title="Reject Request"><i class="fa fa-times"></i> Reject</button>
                        ` : ''}
                        <button class="btn btn-ghost btn-xs" onclick="Payroll.showLoanRepaymentModal(${l.id})" title="View Repayment Ledger & Installments">
                          <i class="fa fa-receipt"></i> Ledger
                        </button>
                        ${l.status === 'active' && l.remaining > 0 ? `
                          <button class="btn btn-secondary btn-xs" onclick="Payroll.showPayInstallmentModal(${l.id})" title="Pay / Return Installment Outside Salary">
                            <i class="fa fa-credit-card"></i> Pay
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

  showAddLoan(isSelfApply = false) {
    const isHrOrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role) && !isSelfApply;
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const myEmp = Auth.employee || emps[0];
    const targetEmpId = isHrOrAdmin ? (emps[0]?.id || 1) : myEmp.id;
    const pfSummary = this.getEmployeePFSummary(targetEmpId);
    const maxPFLoan = Math.round((pfSummary?.totalBalance || 0) * 0.80);

    Modal.show(!isHrOrAdmin ? 'Apply for Personal or PF Loan' : 'Grant New Employee Loan', `
      <div class="form-group">
        <label class="form-label required">Employee</label>
        ${!isHrOrAdmin ? `
          <input type="hidden" id="ln-emp" value="${myEmp.id}">
          <input class="form-control" value="${myEmp.fullName} (${myEmp.empNo}) — ${Utils.getDeptName(myEmp.departmentId)}" disabled style="background:var(--surface)">
        ` : `
          <select class="form-control" id="ln-emp" onchange="Payroll._onLoanEmpChange(this.value)">
            ${emps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}
          </select>
        `}
      </div>

      <div class="form-group">
        <label class="form-label required">Loan Type</label>
        <select class="form-control" id="ln-type" onchange="Payroll._onLoanTypeChange(this.value)">
          <option value="standard">Standard Personal Loan</option>
          <option value="pf_loan">Loan Against Provident Fund (PF Collateral)</option>
          <option value="advance">Salary Advance</option>
        </select>
      </div>

      <!-- Dynamic PF Collateral Box -->
      <div id="ln-pf-info" style="display:none;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:12px 14px;margin-bottom:14px">
        <div style="font-weight:700;font-size:12.5px;color:var(--primary);display:flex;align-items:center;gap:6px">
          <i class="fa fa-piggy-bank"></i> Provident Fund Collateral Coverage
        </div>
        <div style="font-size:12px;color:var(--text-2);margin-top:4px">
          Accumulated PF Balance: <strong id="ln-pf-bal">${Utils.formatCurrency(pfSummary?.totalBalance || 0)}</strong><br>
          Max Eligible PF Loan (80% of fund): <strong id="ln-pf-max" style="color:var(--success)">${Utils.formatCurrency(maxPFLoan)}</strong>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Loan Amount (PKR)</label>
          <input class="form-control" id="ln-amount" type="number" placeholder="50000" min="1000" oninput="Payroll._updateLoanPreview()">
        </div>
        <div class="form-group">
          <label class="form-label required">Repayment Tenure (Months / Installments)</label>
          <input class="form-control" id="ln-inst" type="number" placeholder="12" min="1" max="60" value="12" oninput="Payroll._updateLoanPreview()">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Purpose / Reason</label>
          <input class="form-control" id="ln-purpose" placeholder="Medical, Home Renovation, Education, etc.">
        </div>
        <div class="form-group">
          <label class="form-label required">Deduction Start Month</label>
          <input class="form-control" id="ln-start" type="date" value="${Utils.today()}">
        </div>
      </div>

      <div id="ln-monthly-preview" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:8px;display:none">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase">Estimated Monthly Salary Deduction</div>
            <div id="ln-monthly-val" style="font-size:20px;font-weight:800;color:var(--danger)">—</div>
          </div>
          <div style="text-align:right">
            <span class="badge badge-info" style="font-size:11px">Auto-Deducted from Monthly Payslip</span>
          </div>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Payroll.saveLoan(${!isHrOrAdmin})">
          <i class="fa fa-save"></i> ${!isHrOrAdmin ? 'Submit Loan Application' : 'Create & Activate Loan'}
        </button>
      `
    });
  },

  _onLoanTypeChange(type) {
    const pfBox = document.getElementById('ln-pf-info');
    if (pfBox) {
      pfBox.style.display = type === 'pf_loan' ? 'block' : 'none';
    }
  },

  _onLoanEmpChange(empId) {
    const summary = this.getEmployeePFSummary(Number(empId));
    const balEl = document.getElementById('ln-pf-bal');
    const maxEl = document.getElementById('ln-pf-max');
    if (balEl && maxEl) {
      balEl.textContent = Utils.formatCurrency(summary.totalBalance);
      maxEl.textContent = Utils.formatCurrency(Math.round(summary.totalBalance * 0.80));
    }
  },

  _updateLoanPreview() {
    const amount = parseFloat(document.getElementById('ln-amount')?.value) || 0;
    const inst = parseInt(document.getElementById('ln-inst')?.value) || 0;
    const preview = document.getElementById('ln-monthly-preview');
    const val = document.getElementById('ln-monthly-val');
    if (amount > 0 && inst > 0) {
      preview.style.display = 'block';
      val.textContent = Utils.formatCurrency(Math.ceil(amount / inst));
    } else {
      preview.style.display = 'none';
    }
  },

  saveLoan(isSelfApply = false) {
    const isHrOrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role) && !isSelfApply;
    const empId = parseInt(document.getElementById('ln-emp')?.value);
    const loanType = document.getElementById('ln-type')?.value || 'standard';
    const amount = parseFloat(document.getElementById('ln-amount')?.value) || 0;
    const installments = parseInt(document.getElementById('ln-inst')?.value) || 1;
    const purpose = document.getElementById('ln-purpose')?.value.trim();
    const startDate = document.getElementById('ln-start')?.value;

    if (!amount || !purpose || !startDate) {
      Toast.show('Please fill all required fields', 'error');
      return;
    }

    if (loanType === 'pf_loan') {
      const pfSummary = this.getEmployeePFSummary(empId);
      if (amount > (pfSummary?.totalBalance || 0)) {
        Toast.show(`PF Loan cannot exceed total accumulated Provident Fund balance of ${Utils.formatCurrency(pfSummary.totalBalance)}!`, 'error');
        return;
      }
    }

    const monthly = Math.ceil(amount / installments);
    const newLoan = {
      id: DB.nextId('loans'),
      employeeId: empId,
      loanType,
      amount,
      purpose,
      installments,
      remaining: installments,
      monthlyDeduction: monthly,
      startDate,
      status: isHrOrAdmin ? 'active' : 'pending_approval',
      approvedBy: isHrOrAdmin ? Auth.user?.id : null,
      approvedAt: isHrOrAdmin ? new Date().toISOString() : null,
      repayments: []
    };

    DB.add('loans', newLoan);
    DB.log('ADD', 'Payroll', `${loanType === 'pf_loan' ? 'PF Loan' : 'Loan'} PKR ${amount.toLocaleString()} for ${Utils.getEmpName(empId)} (${newLoan.status})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    if (isHrOrAdmin) {
      Toast.show('Loan created & activated!', 'success', `${installments} installments of ${Utils.formatCurrency(monthly)} auto-deducted from salary.`);
    } else {
      Toast.show('Loan application submitted!', 'success', 'Your request has been forwarded to HR & Admin for approval.');
    }
    this.renderView();
  },

  approveLoan(id) {
    const loan = DB.find('loans', id);
    if (!loan) return;
    Modal.confirm('Authorize Loan Application', `Approve loan of <strong>${Utils.formatCurrency(loan.amount)}</strong> for <strong>${Utils.getEmpName(loan.employeeId)}</strong>? Monthly salary deduction of ${Utils.formatCurrency(loan.monthlyDeduction)} will be activated.`, () => {
      loan.status = 'active';
      loan.approvedBy = Auth.user?.id;
      loan.approvedAt = new Date().toISOString();
      DB.update('loans', id, loan);
      DB.log('APPROVE', 'Payroll', `Approved loan PKR ${loan.amount} for ${Utils.getEmpName(loan.employeeId)}`, Auth.user?.id);
      Toast.show('Loan Approved!', 'success', 'Active starting from next salary payroll run.');
      this.renderView();
    });
  },

  rejectLoan(id) {
    const loan = DB.find('loans', id);
    if (!loan) return;
    Modal.confirm('Reject Loan Application', `Reject loan request for <strong>${Utils.getEmpName(loan.employeeId)}</strong>?`, () => {
      loan.status = 'rejected';
      DB.update('loans', id, loan);
      DB.log('REJECT', 'Payroll', `Rejected loan request for ${Utils.getEmpName(loan.employeeId)}`, Auth.user?.id);
      Toast.show('Loan request rejected', 'info');
      this.renderView();
    });
  },

  showLoanRepaymentModal(id) {
    const loan = DB.find('loans', id);
    if (!loan) return;
    const emp = DB.find('employees', loan.employeeId);
    const paidInstallments = loan.installments - (loan.remaining || 0);
    const outstanding = (loan.remaining || 0) * loan.monthlyDeduction;

    Modal.show(`Loan Ledger & Repayment Schedule — ${emp?.fullName || 'Employee'}`, `
      <div style="background:var(--surface);border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-3);font-weight:700">Loan Type</div>
            <div style="font-size:15px;font-weight:800;color:var(--text);margin-top:2px">
              ${loan.loanType === 'pf_loan' ? '<i class="fa fa-piggy-bank" style="color:var(--primary);margin-right:6px"></i>Loan Against Provident Fund (PF Collateral)' : (loan.loanType === 'advance' ? '<i class="fa fa-money-bill-transfer" style="margin-right:6px"></i>Salary Advance' : '<i class="fa fa-hand-holding-dollar" style="margin-right:6px"></i>Standard Personal Loan')}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-3);font-weight:700">Status</div>
            <div>${Utils.statusBadge(loan.status)}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px;border-top:1px solid var(--border);padding-top:12px">
          <div><span style="font-size:11px;color:var(--text-3)">Principal:</span><div style="font-weight:700">${Utils.formatCurrency(loan.amount)}</div></div>
          <div><span style="font-size:11px;color:var(--text-3)">Monthly Deduction:</span><div style="font-weight:700;color:var(--danger)">${Utils.formatCurrency(loan.monthlyDeduction)}</div></div>
          <div><span style="font-size:11px;color:var(--text-3)">Installments Paid:</span><div style="font-weight:700">${paidCount} of ${loan.installments}</div></div>
          <div><span style="font-size:11px;color:var(--text-3)">Outstanding:</span><div style="font-weight:800;color:var(--warning)">${Utils.formatCurrency(outstanding)}</div></div>
        </div>
      </div>

      <div style="font-weight:700;font-size:13px;margin-bottom:8px">Repayment Transaction History (Salary Deductions & Returns)</div>
      <div class="table-wrapper" style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
        <table>
          <thead>
            <tr><th>Date / Month</th><th>Repayment Channel</th><th>Amount Paid</th><th>Remaining After</th></tr>
          </thead>
          <tbody>
            ${(!loan.repayments || loan.repayments.length === 0) ? `
              <tr><td colspan="4" style="text-align:center;padding:18px;color:var(--text-muted)">No installments returned yet. Monthly deductions will automatically appear once salary slips are processed.</td></tr>
            ` : loan.repayments.map((r, idx) => `
              <tr>
                <td><strong>${r.month || Utils.formatDate(r.paidOn)}</strong></td>
                <td><span class="badge ${r.method==='salary_deduction'?'badge-primary':'badge-success'}">${r.method==='salary_deduction'?'Salary Auto-Deduction':'Direct Return / Deposit'}</span></td>
                <td style="color:var(--success);font-weight:700">${Utils.formatCurrency(r.amount)}</td>
                <td>${Math.max(0, loan.installments - (idx + 1))} installments left</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        ${loan.status === 'active' && loan.remaining > 0 ? `
          <button class="btn btn-success" onclick="Payroll.showPayInstallmentModal(${loan.id})"><i class="fa fa-circle-check"></i> Pay / Return Installment Now</button>
        ` : ''}
      `
    });
  },

  showPayInstallmentModal(id) {
    const loan = DB.find('loans', id);
    if (!loan || loan.remaining <= 0) return;
    const emp = DB.find('employees', loan.employeeId);

    Modal.show(`Pay / Return Loan Installment — ${emp?.fullName}`, `
      <div style="margin-bottom:12px;font-size:13px;color:var(--text-2)">
        Record a direct loan installment repayment for <strong>${emp?.fullName}</strong> outside regular monthly salary deduction (e.g. employee returned cash or bank transfer early).
      </div>
      <div class="form-group">
        <label class="form-label required">Repayment Option</label>
        <select class="form-control" id="pay-ln-type" onchange="document.getElementById('pay-ln-amt').value = this.value === 'single' ? ${loan.monthlyDeduction} : ${loan.remaining * loan.monthlyDeduction}">
          <option value="single">Single Monthly Installment (${Utils.formatCurrency(loan.monthlyDeduction)})</option>
          <option value="full">Full Outstanding Balance (${Utils.formatCurrency(loan.remaining * loan.monthlyDeduction)})</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Repayment Amount (PKR)</label>
        <input type="number" class="form-control" id="pay-ln-amt" value="${loan.monthlyDeduction}">
      </div>
      <div class="form-group">
        <label class="form-label required">Payment Method</label>
        <select class="form-control" id="pay-ln-method">
          <option value="direct_deposit">Direct Bank Transfer / Deposit</option>
          <option value="cash_return">Cash Payment to Accounts</option>
          <option value="salary_adjustment">Early Salary Adjustment</option>
        </select>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Payroll.submitLoanRepayment(${loan.id})"><i class="fa fa-save"></i> Confirm Repayment</button>
      `
    });
  },

  submitLoanRepayment(id) {
    const loan = DB.find('loans', id);
    if (!loan) return;
    const payType = document.getElementById('pay-ln-type')?.value;
    const amt = parseFloat(document.getElementById('pay-ln-amt')?.value) || loan.monthlyDeduction;
    const method = document.getElementById('pay-ln-method')?.value || 'direct_deposit';

    loan.repayments = loan.repayments || [];
    loan.repayments.push({
      month: Utils.thisMonth(),
      amount: amt,
      paidOn: Utils.today(),
      method: method,
      notes: `Direct installment payment (${method})`
    });

    if (payType === 'full' || amt >= (loan.remaining * loan.monthlyDeduction)) {
      loan.remaining = 0;
      loan.status = 'completed';
    } else {
      const installmentsCovered = Math.max(1, Math.round(amt / loan.monthlyDeduction));
      loan.remaining = Math.max(0, loan.remaining - installmentsCovered);
      if (loan.remaining === 0) loan.status = 'completed';
    }

    DB.update('loans', id, loan);
    DB.log('PROCESS', 'Payroll', `Manual loan repayment PKR ${amt} recorded for ${Utils.getEmpName(loan.employeeId)}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Repayment recorded successfully!', 'success', `${loan.remaining} installments remaining`);
    this.renderView();
  },

  exportLoansCSV() {
    const loans = DB.get('loans') || [];
    const headers = ['Loan ID', 'Employee ID', 'Employee Name', 'Department', 'Loan Type', 'Principal Amount', 'Monthly Deduction', 'Installments Total', 'Remaining Installments', 'Start Date', 'Status'];
    const rows = loans.map(l => {
      const emp = DB.find('employees', l.employeeId);
      return [
        l.id,
        l.employeeId,
        emp?.fullName || '',
        Utils.getDeptName(emp?.departmentId),
        l.loanType || 'standard',
        l.amount,
        l.monthlyDeduction,
        l.installments,
        l.remaining,
        l.startDate,
        l.status
      ];
    });
    Utils.exportToCSV([headers, ...rows], `Loans_Report_${Utils.today()}.csv`);
  },


  renderSlips(container) {
    const canManage = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    let emps = DB.get('employees').filter(e => e.status === 'active');
    if (!canManage) {
      emps = emps.filter(e => e.id === Auth.employee?.id);
    }
    const salaries = DB.get('salary');
    const depts = DB.get('departments');
    const allMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <select class="filter-select" onchange="Payroll.currentMonth=this.value;Payroll.renderView()" style="width:190px">
            ${allMonths.map(m => `<option value="${m}" ${m===this.currentMonth?'selected':''}>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>`).join('')}
          </select>
          ${canManage ? `
            <select class="filter-select" id="slip-dept-filter" onchange="Payroll.filterSlips(this.value)" style="width:180px">
              <option value="">All Departments</option>
              ${depts.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}
            </select>
          ` : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${canManage ? `
            <button class="btn btn-ghost btn-sm" onclick="Payroll.printAllSlips()"><i class="fa fa-print"></i> Print All (PDF)</button>
            <button class="btn btn-secondary btn-sm" onclick="Payroll.exportSlipsCSV()"><i class="fa fa-file-csv"></i> Export Payslips (CSV)</button>
            <button class="btn btn-secondary btn-sm" onclick="Payroll.processAll()"><i class="fa fa-cogs"></i> Process All for Month</button>
            <button class="btn btn-primary btn-sm" onclick="Payroll.showGenerateSlipModal(null, Payroll.currentMonth)"><i class="fa fa-plus"></i> Generate Payslip</button>
          ` : `
            <div style="background:var(--surface);border:1px solid var(--border);padding:6px 12px;border-radius:8px;font-size:11.5px;color:var(--text-3);display:flex;align-items:center;gap:6px">
              <i class="fa fa-shield-halved" style="color:var(--primary)"></i> View-Only Self-Service &bull; Official Payslips Issued by HR &amp; Finance
            </div>
          `}
        </div>
      </div>
      <div class="grid-3" id="slips-grid">
        ${emps.map(emp => {
          const rec = salaries.find(s => s.employeeId === emp.id && s.month === this.currentMonth);
          return `
            <div class="card slip-card" data-dept="${emp.departmentId}" style="text-align:center;border-top:3px solid ${rec ? 'var(--success)' : 'var(--border)'}">
              <div class="avatar avatar-lg" style="background:${Utils.avatarColor(emp.id)};margin:0 auto 12px">${Utils.avatarInitials(emp.fullName)}</div>
              <div style="font-weight:700;font-size:15px">${emp.fullName}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px">${Utils.getDesigName(emp.designationId)} • ${emp.empNo}</div>
              <div style="margin:12px 0;font-size:22px;font-weight:800;color:${rec?'var(--success)':'var(--text-muted)'}">${rec ? Utils.formatCurrency(rec.netSalary) : '—'}</div>
              ${rec ? Utils.statusBadge(rec.status) : '<span class="badge badge-secondary">Not Generated</span>'}
              <div style="margin-top:14px;display:flex;gap:6px">
                ${rec ? `
                  ${canManage ? `
                    <button class="btn btn-primary btn-sm" style="flex:1" onclick="Payroll.viewSlip(${emp.id},'${this.currentMonth}')"><i class="fa fa-eye"></i> View Slip</button>
                    <button class="btn btn-ghost btn-sm" onclick="Payroll.printSlip(${emp.id},'${this.currentMonth}')" title="Print / PDF"><i class="fa fa-print"></i></button>
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.showGenerateSlipModal(${emp.id},'${this.currentMonth}')" title="Edit Slip"><i class="fa fa-pen"></i></button>
                  ` : `
                    <button class="btn btn-primary btn-sm w-full" onclick="Payroll.viewSlip(${emp.id},'${this.currentMonth}')"><i class="fa fa-eye"></i> View Slip</button>
                  `}
                ` : `
                  ${canManage ? `
                    <button class="btn btn-primary btn-sm w-full" onclick="Payroll.showGenerateSlipModal(${emp.id},'${this.currentMonth}')"><i class="fa fa-cogs"></i> Generate Payslip</button>
                  ` : `
                    <button class="btn btn-ghost btn-sm w-full" disabled style="opacity:0.6">Not Generated</button>
                  `}
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  filterSlips(deptId) {
    document.querySelectorAll('.slip-card').forEach(card => {
      if (!deptId || card.getAttribute('data-dept') === String(deptId)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  },

  viewSlip(empId, month) {
    const isHrOrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
    if (!isHrOrAdmin && Number(empId) !== Auth.employee?.id) {
      Toast.show('403 Forbidden: Financial and salary details are strictly confidential between HR/Admin and the employee.', 'error');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    const rec = DB.get('salary').find(s => s.employeeId === Number(empId) && s.month === month);
    if (!emp || !rec) { Toast.show('Salary record not found', 'error'); return; }
    const monthLabel = new Date(month+'-01').toLocaleDateString('en',{month:'long',year:'numeric'});
    const pfSettings = this.getPFSettings();
    const pfSummary = this.getEmployeePFSummary(emp.id);

    const pfEmployee = rec.pfEmployee !== undefined ? rec.pfEmployee : Math.round(rec.basic * (pfSettings.employeeRate / 100));
    const pfEmployer = rec.pfEmployer !== undefined ? rec.pfEmployer : Math.round(rec.basic * (pfSettings.employerRate / 100));
    const loanDeduction = rec.loanDeduction || 0;
    const unpaidDeduction = rec.unpaidLeaveDeduction || 0;
    const otherDeductions = Math.max(0, (rec.deductions || 0) - pfEmployee - unpaidDeduction - loanDeduction);

    Modal.show(`Payslip — ${emp.fullName} — ${monthLabel}`, `
      <div style="background:white;color:#1a1a1a;border-radius:12px;overflow:hidden">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,hsl(221,83%,25%),hsl(262,83%,30%));color:white;padding:22px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:22px;font-weight:800">HRM Pro</div>
            <div style="font-size:12px;opacity:0.85">Human Resource Management & Payroll</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:700">PAYSLIP</div>
            <div style="font-size:12px;opacity:0.85">${monthLabel}</div>
          </div>
        </div>

        <!-- Employee Info -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;padding:18px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
          <div>
            <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px">EMPLOYEE DETAILS</div>
            <div style="font-size:16px;font-weight:700;color:#0f172a">${emp.fullName}</div>
            <div style="font-size:13px;color:#475569">${Utils.getDesigName(emp.designationId)}</div>
            <div style="font-size:12px;color:#64748b">${Utils.getDeptName(emp.departmentId)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px">PAYMENT INFORMATION</div>
            <div style="font-size:13px;color:#334155"><strong>Emp #:</strong> ${emp.empNo}</div>
            <div style="font-size:13px;color:#334155"><strong>Joining Date:</strong> ${Utils.formatDate(emp.joiningDate)}</div>
            <div style="font-size:13px;color:#334155"><strong>Bank:</strong> ${emp.bankName || 'HBL'} | ${emp.accountNo || '—'}</div>
          </div>
        </div>

        <!-- Earnings & Deductions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e2e8f0">
          <div style="background:white;padding:18px 20px">
            <div style="font-size:12px;font-weight:700;color:#10b981;text-transform:uppercase;margin-bottom:10px;letter-spacing:0.8px">Earnings</div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Basic Salary</span><strong>PKR ${rec.basic.toLocaleString()}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Allowances</span><span style="color:#10b981">PKR ${rec.allowances.toLocaleString()}</span></div>
            ${rec.overtime ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Overtime</span><span style="color:#10b981">PKR ${rec.overtime.toLocaleString()}</span></div>` : ''}
            ${rec.bonus ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Bonus / Incentive</span><span style="color:#10b981">PKR ${rec.bonus.toLocaleString()}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700"><span>Gross Earnings</span><span style="color:#10b981">PKR ${(rec.basic + rec.allowances + (rec.overtime||0) + (rec.bonus||0)).toLocaleString()}</span></div>
          </div>

          <div style="background:white;padding:18px 20px">
            <div style="font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;margin-bottom:10px;letter-spacing:0.8px">Deductions</div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Provident Fund (Employee ${pfSettings.employeeRate}%)</span><span style="color:#ef4444;font-weight:600">PKR ${pfEmployee.toLocaleString()}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Income Tax (FBR)</span><span style="color:#ef4444">PKR ${rec.tax.toLocaleString()}</span></div>
            ${loanDeduction > 0 ? `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9">
                <span style="color:#d97706;font-weight:600"><i class="fa fa-hand-holding-dollar" style="margin-right:4px"></i>Loan / PF Loan Recovery</span>
                <span style="color:#d97706;font-weight:700">PKR ${loanDeduction.toLocaleString()}</span>
              </div>
            ` : ''}
            ${unpaidDeduction > 0 ? `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9">
                <span style="color:#dc2626;font-weight:600">Unpaid Leave / Loss of Pay (${rec.unpaidLeaveDays || 1}d)</span>
                <span style="color:#dc2626;font-weight:700">PKR ${unpaidDeduction.toLocaleString()}</span>
              </div>
            ` : ''}
            ${otherDeductions > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Other Deductions (EOBI / SESSI)</span><span style="color:#ef4444">PKR ${otherDeductions.toLocaleString()}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700"><span>Total Deductions</span><span style="color:#ef4444">PKR ${(rec.deductions + rec.tax).toLocaleString()}</span></div>
          </div>
        </div>

        <!-- Provident Fund & Retirement Benefits Strip -->
        <div style="background:#f0fdf4;border-top:1px solid #bbf7d0;border-bottom:1px solid #bbf7d0;padding:12px 20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase">Employer PF Contribution (Matching ${pfSettings.employerRate}%)</div>
            <div style="font-size:15px;font-weight:800;color:#15803d;margin-top:2px">PKR ${pfEmployer.toLocaleString()} <span style="font-size:11px;font-weight:normal;color:#166534">(Credited directly to PF Trust)</span></div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase">Accumulated PF Balance To Date</div>
            <div style="font-size:15px;font-weight:800;color:#15803d;margin-top:2px">PKR ${pfSummary.totalBalance.toLocaleString()}</div>
          </div>
        </div>

        <!-- Net Pay -->
        <div style="background:linear-gradient(135deg,#1e3a5f,#2d1b69);padding:18px 24px;display:flex;justify-content:space-between;align-items:center">
          <span style="color:rgba(255,255,255,0.8);font-size:14px;font-weight:600">NET SALARY PAYABLE</span>
          <span style="color:white;font-size:26px;font-weight:800">PKR ${rec.netSalary.toLocaleString()}</span>
        </div>

        <div style="padding:12px 24px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center">
          Computer-generated payslip • Status: ${rec.status.toUpperCase()} • Generated on ${Utils.formatDate(rec.paidOn || Utils.today())}
        </div>
      </div>
    `, {
      size: 'modal-lg',
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        ${(['superadmin', 'hr_manager'].includes(Auth.role) || Number(emp.id) === Auth.employee?.id) ? `
          <button class="btn btn-secondary" onclick="Payroll.exportSingleSlipCSV(${emp.id}, '${month}')"><i class="fa fa-file-csv"></i> Download CSV</button>
          <button class="btn btn-secondary" onclick="Toast.show('Payslip emailed to ${emp.email}', 'success', 'Notification sent')"><i class="fa fa-envelope"></i> Email Slip</button>
          <button class="btn btn-primary" onclick="Payroll.printSlip(${emp.id}, '${month}')"><i class="fa fa-print"></i> Print / Save as PDF</button>
        ` : `
          <div style="font-size:11.5px;color:var(--text-3);display:inline-flex;align-items:center;gap:6px;margin-right:auto">
            <i class="fa fa-shield-halved" style="color:var(--primary)"></i> View-Only Access &bull; Official signed/stamped payslips are provided by HR Administration.
          </div>
        `}
      `
    });
  },

  showGenerateSlipModal(empId, month = this.currentMonth) {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const selectedEmp = empId ? DB.find('employees', Number(empId)) : emps[0];
    if (!selectedEmp) {
      Toast.show('No active employees found', 'error');
      return;
    }
    const targetMonth = month || this.currentMonth;
    const existingRec = DB.get('salary').find(s => s.employeeId === selectedEmp.id && s.month === targetMonth);
    const pfSettings = this.getPFSettings();

    const basic = existingRec ? existingRec.basic : (selectedEmp.salary || 50000);
    const allowances = existingRec ? existingRec.allowances : Math.round(basic * 0.45);
    const dailyWage = Math.round(basic / 30);

    // Auto-detect active loans (Standard, Advance, or PF Loan)
    const allLoans = DB.get('loans') || [];
    const activeEmpLoans = allLoans.filter(l => l.employeeId === selectedEmp.id && l.status === 'active' && (l.remaining || 0) > 0);
    const autoLoanDeduction = activeEmpLoans.reduce((sum, l) => sum + (l.monthlyDeduction || 0), 0);
    const loanDeduction = existingRec?.loanDeduction !== undefined ? existingRec.loanDeduction : autoLoanDeduction;

    // Auto-detect unpaid leave deductions for this employee & targetMonth
    const allLeaves = DB.get('leave_requests') || [];
    const salaryLeaves = allLeaves.filter(l => 
      l.employeeId === selectedEmp.id && 
      l.salaryDeduction === true && 
      l.status === 'approved' && 
      ((l.from && l.from.slice(0,7) === targetMonth) || (l.to && l.to.slice(0,7) === targetMonth))
    );
    const autoUnpaidDays = salaryLeaves.reduce((sum, l) => sum + (l.deductionDays || l.days || 1), 0);
    const autoUnpaidDeduction = salaryLeaves.reduce((sum, l) => sum + (l.deductionAmount || (dailyWage * (l.days || 1))), 0);
    const unpaidLeaveDeduction = existingRec?.unpaidLeaveDeduction !== undefined ? existingRec.unpaidLeaveDeduction : autoUnpaidDeduction;
    const unpaidLeaveDays = existingRec?.unpaidLeaveDays !== undefined ? existingRec.unpaidLeaveDays : autoUnpaidDays;

    const pfEmployee = existingRec?.pfEmployee !== undefined ? existingRec.pfEmployee : Math.round(basic * (pfSettings.employeeRate / 100));
    const pfEmployer = existingRec?.pfEmployer !== undefined ? existingRec.pfEmployer : Math.round(basic * (pfSettings.employerRate / 100));
    const deductions = existingRec ? Math.max(0, (existingRec.deductions || 0) - pfEmployee - (existingRec.unpaidLeaveDeduction || 0) - (existingRec.loanDeduction || 0)) : 2000;
    const overtime = existingRec ? (existingRec.overtime || 0) : 0;
    const bonus = existingRec ? (existingRec.bonus || 0) : 0;
    const autoTax = DB.calculateFBRTax(basic + allowances).monthlyTax;
    const tax = existingRec ? existingRec.tax : autoTax;
    const net = Math.max(0, basic + allowances + overtime + bonus - (deductions + pfEmployee + unpaidLeaveDeduction + loanDeduction) - tax);

    const allMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

    Modal.show(`${existingRec ? 'Edit' : 'Generate'} Salary Slip — ${selectedEmp.fullName}`, `
      <div style="background:var(--surface);padding:12px 16px;border-radius:10px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="avatar avatar-md" style="background:${Utils.avatarColor(selectedEmp.id)}">${Utils.avatarInitials(selectedEmp.fullName)}</div>
          <div>
            <div style="font-weight:700;font-size:14px">${selectedEmp.fullName} (${selectedEmp.empNo})</div>
            <div style="font-size:12px;color:var(--text-3)">${Utils.getDesigName(selectedEmp.designationId)} • ${Utils.getDeptName(selectedEmp.departmentId)}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-muted)">Base Salary</div>
          <div style="font-weight:700;color:var(--primary)">${Utils.formatCurrency(selectedEmp.salary)}</div>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Employee</label>
          <select class="form-control" id="slp-emp" onchange="Payroll.onGenerateSlipEmpChange(this.value, document.getElementById('slp-month').value)">
            ${emps.map(e => `<option value="${e.id}" ${e.id === selectedEmp.id ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Salary Month</label>
          <select class="form-control" id="slp-month" onchange="Payroll.onGenerateSlipEmpChange(document.getElementById('slp-emp').value, this.value)">
            ${allMonths.map(m => `<option value="${m}" ${m === targetMonth ? 'selected' : ''}>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Basic Salary (PKR)</label>
          <input type="number" class="form-control" id="slp-basic" value="${basic}" oninput="Payroll.calcSlipNet()">
        </div>
        <div class="form-group">
          <label class="form-label">Total Allowances (PKR)</label>
          <input type="number" class="form-control" id="slp-allowances" value="${allowances}" oninput="Payroll.calcSlipNet()">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Provident Fund — Employee Share (${pfSettings.employeeRate}%)</label>
          <input type="number" class="form-control" id="slp-pf-emp" value="${pfEmployee}" oninput="Payroll.calcSlipNet()">
          <span style="font-size:11px;color:var(--text-3)">Deducted from net pay into PF trust</span>
        </div>
        <div class="form-group">
          <label class="form-label">Employer PF Match (${pfSettings.employerRate}%)</label>
          <input type="number" class="form-control" id="slp-pf-empr" value="${pfEmployer}">
          <span style="font-size:11px;color:var(--text-3)">Company matching contribution</span>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Loan &amp; PF Installment Recovery (PKR)</label>
          <input type="number" class="form-control" id="slp-loan-ded" value="${loanDeduction}" oninput="Payroll.calcSlipNet()">
          <span style="font-size:11px;color:${loanDeduction > 0 ? 'var(--warning)' : 'var(--text-3)'}">
            ${activeEmpLoans.length > 0 ? `${activeEmpLoans.length} active loan(s): ${activeEmpLoans.map(l => (l.loanType==='pf_loan'?'PF Loan':'Loan')+` (PKR ${l.monthlyDeduction.toLocaleString()})`).join(', ')}` : 'No active loans for this employee'}
          </span>
        </div>
        <div class="form-group">
          <label class="form-label">Unpaid Leave / Loss of Pay (PKR)</label>
          <input type="number" class="form-control" id="slp-unpaid-ded" value="${unpaidLeaveDeduction}" oninput="Payroll.calcSlipNet()">
          <span style="font-size:11px;color:${unpaidLeaveDeduction > 0 ? 'var(--danger)' : 'var(--text-3)'}">
            ${unpaidLeaveDays > 0 ? `Auto-detected: ${unpaidLeaveDays} day(s) approved unpaid leave` : 'Deducted for unpaid leaves/absences'}
          </span>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Other Deductions (EOBI / SESSI / Incidental)</label>
          <input type="number" class="form-control" id="slp-deductions" value="${deductions}" oninput="Payroll.calcSlipNet()">
        </div>
        <div class="form-group">
          <label class="form-label">Income Tax (2026–27 Slab Schedule)</label>
          <input type="number" class="form-control" id="slp-tax" value="${tax}" oninput="Payroll.calcSlipNet()">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Overtime Pay (PKR)</label>
          <input type="number" class="form-control" id="slp-ot" value="${overtime}" oninput="Payroll.calcSlipNet()">
        </div>
        <div class="form-group">
          <label class="form-label">Bonus / Incentive (PKR)</label>
          <input type="number" class="form-control" id="slp-bonus" value="${bonus}" oninput="Payroll.calcSlipNet()">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Payment Status</label>
          <select class="form-control" id="slp-status">
            <option value="processed" ${existingRec?.status === 'processed' || !existingRec ? 'selected' : ''}>Processed (Paid &amp; Ledger Settled)</option>
            <option value="pending" ${existingRec?.status === 'pending' ? 'selected' : ''}>Pending Approval</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Payment Method / Notes</label>
          <input class="form-control" id="slp-notes" placeholder="e.g. Bank Transfer (HBL)" value="${existingRec?.notes || (selectedEmp.bankName ? selectedEmp.bankName + ' Transfer' : 'Direct Deposit')}">
        </div>
      </div>

      <!-- Live Calculation Card -->
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin-top:10px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:12px;color:var(--text-3)">Calculated Net Take-Home Salary</div>
          <div style="font-size:11px;color:var(--text-muted)">Basic + Allowances + OT + Bonus - (PF + Loan Recovery + LOP + Other) - Tax</div>
        </div>
        <div style="font-size:24px;font-weight:800;color:var(--success)" id="slp-net-display">
          ${Utils.formatCurrency(net)}
        </div>
      </div>
    `, {
      size: 'modal-lg',
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Payroll.saveAndGenerateSlip()"><i class="fa fa-file-invoice-dollar"></i> Generate &amp; View Payslip</button>
      `
    });
  },

  onGenerateSlipEmpChange(empId, month) {
    Payroll.showGenerateSlipModal(parseInt(empId), month);
  },

  calcSlipNet() {
    const basic = parseFloat(document.getElementById('slp-basic')?.value) || 0;
    const allowances = parseFloat(document.getElementById('slp-allowances')?.value) || 0;
    const pfEmp = parseFloat(document.getElementById('slp-pf-emp')?.value) || 0;
    const loanDed = parseFloat(document.getElementById('slp-loan-ded')?.value) || 0;
    const unpaidDeduct = parseFloat(document.getElementById('slp-unpaid-ded')?.value) || 0;
    const other = parseFloat(document.getElementById('slp-deductions')?.value) || 0;
    const tax = parseFloat(document.getElementById('slp-tax')?.value) || 0;
    const ot = parseFloat(document.getElementById('slp-ot')?.value) || 0;
    const bonus = parseFloat(document.getElementById('slp-bonus')?.value) || 0;

    const totalDeductions = other + pfEmp + unpaidDeduct + loanDed;
    const net = Math.max(0, basic + allowances + ot + bonus - totalDeductions - tax);
    const display = document.getElementById('slp-net-display');
    if (display) display.textContent = Utils.formatCurrency(net);
    return net;
  },

  saveAndGenerateSlip() {
    const empId = parseInt(document.getElementById('slp-emp').value);
    const month = document.getElementById('slp-month').value;
    const basic = parseFloat(document.getElementById('slp-basic').value) || 0;
    const allowances = parseFloat(document.getElementById('slp-allowances').value) || 0;
    const pfEmployee = parseFloat(document.getElementById('slp-pf-emp').value) || 0;
    const pfEmployer = parseFloat(document.getElementById('slp-pf-empr').value) || 0;
    const loanDeduction = parseFloat(document.getElementById('slp-loan-ded')?.value) || 0;
    const unpaidLeaveDeduction = parseFloat(document.getElementById('slp-unpaid-ded')?.value) || 0;
    const otherDeductions = parseFloat(document.getElementById('slp-deductions').value) || 0;
    const totalDeductions = otherDeductions + pfEmployee + unpaidLeaveDeduction + loanDeduction;
    const tax = parseFloat(document.getElementById('slp-tax').value) || 0;
    const overtime = parseFloat(document.getElementById('slp-ot').value) || 0;
    const bonus = parseFloat(document.getElementById('slp-bonus').value) || 0;
    const status = document.getElementById('slp-status').value;
    const notes = document.getElementById('slp-notes')?.value.trim() || '';
    const netSalary = Math.max(0, basic + allowances + overtime + bonus - totalDeductions - tax);

    const emp = DB.find('employees', empId);
    if (!emp) return;

    const existing = DB.get('salary').find(s => s.employeeId === empId && s.month === month);
    let slipId;
    if (existing) {
      slipId = existing.id;
      DB.update('salary', existing.id, {
        basic, allowances, deductions: totalDeductions, pfEmployee, pfEmployer,
        loanDeduction, unpaidLeaveDeduction, overtime, bonus, tax, netSalary, status, notes,
        paidOn: status === 'processed' ? (existing.paidOn || Utils.today()) : null
      });
      DB.log('PROCESS', 'Payroll', `Updated salary slip for ${emp.fullName} (${month}) [Loan Recovery: PKR ${loanDeduction}]`, Auth.user?.id);
    } else {
      slipId = DB.nextId('salary');
      DB.add('salary', {
        id: slipId,
        employeeId: empId,
        month,
        basic, allowances, deductions: totalDeductions, pfEmployee, pfEmployer,
        loanDeduction, unpaidLeaveDeduction, overtime, bonus, tax, netSalary, status, notes,
        paidOn: status === 'processed' ? Utils.today() : null
      });
      DB.log('PROCESS', 'Payroll', `Generated salary slip for ${emp.fullName} (${month}) [Loan Recovery: PKR ${loanDeduction}]`, Auth.user?.id);
    }

    // Auto-record installment payment and decrement remaining on active loans
    if (status === 'processed' && loanDeduction > 0) {
      const allLoans = DB.get('loans') || [];
      const empActiveLoans = allLoans.filter(l => l.employeeId === empId && l.status === 'active' && (l.remaining || 0) > 0);
      empActiveLoans.forEach(l => {
        l.repayments = l.repayments || [];
        if (!l.repayments.some(r => r.month === month)) {
          l.repayments.push({
            month,
            amount: l.monthlyDeduction,
            paidOn: Utils.today(),
            method: 'salary_deduction',
            slipId
          });
          l.remaining = Math.max(0, l.remaining - 1);
          if (l.remaining === 0) {
            l.status = 'completed';
          }
          DB.update('loans', l.id, l);
          DB.log('PROCESS', 'Payroll', `Recovered loan installment PKR ${l.monthlyDeduction} from salary for ${emp.fullName} (${l.remaining} left)`, Auth.user?.id);
        }
      });
    }

    // Synchronize with Provident Fund ledger
    const pfRecords = DB.get('provident_fund');
    const existingPF = pfRecords.find(r => r.employeeId === empId && r.month === month);
    if (existingPF) {
      DB.update('provident_fund', existingPF.id, {
        basicSalary: basic,
        employeeShare: pfEmployee,
        employerShare: pfEmployer,
        totalMonthly: pfEmployee + pfEmployer,
        date: `${month}-28`
      });
    } else {
      DB.add('provident_fund', {
        id: pfRecords.length > 0 ? Math.max(...pfRecords.map(r=>r.id||0))+1 : 1,
        employeeId: empId,
        month,
        basicSalary: basic,
        employeeRate: 5,
        employeeShare: pfEmployee,
        employerRate: 5,
        employerShare: pfEmployer,
        interest: 0,
        totalMonthly: pfEmployee + pfEmployer,
        type: 'contribution',
        notes: `Payroll contribution (${month})`,
        date: `${month}-28`,
        createdAt: new Date().toISOString()
      });
    }

    Modal.close('dynamic-modal');
    Toast.show('Salary slip generated successfully!', 'success', `${emp.fullName} — ${new Date(month+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}`);
    this.currentMonth = month;
    this.renderView();

    setTimeout(() => {
      this.viewSlip(empId, month);
    }, 250);
  },

  generateSlip(empId, month) {
    this.showGenerateSlipModal(empId, month);
  },

  processAll() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const existing = DB.get('salary').filter(s => s.month === this.currentMonth).map(s => s.employeeId);
    const ungenerated = emps.filter(e => !existing.includes(e.id));
    const monthLabel = new Date(this.currentMonth+'-01').toLocaleDateString('en',{month:'long',year:'numeric'});

    // 1. GOVERNANCE PRE-PAYROLL BLOCKER CHECK
    const problems = typeof Administration !== 'undefined' && Administration.getAttendanceLeaveProblems 
      ? Administration.getAttendanceLeaveProblems(this.currentMonth) 
      : [];
    const unresolved = problems.filter(p => !p.isResolved);

    if (unresolved.length > 0) {
      Modal.show(`⚠️ Payroll Finalization Blocked — ${unresolved.length} Issues Found`, `
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(245,158,11,0.08));border:1.5px solid rgba(239,68,68,0.35);border-radius:10px;padding:14px 18px">
            <div style="font-weight:800;color:var(--danger);font-size:14.5px;display:flex;align-items:center;gap:8px">
              <i class="fa fa-lock"></i> Mandatory Audit Clearance Required
            </div>
            <div style="font-size:12.5px;color:var(--text-2);margin-top:4px;line-height:1.4">
              Payroll generation for <strong>${monthLabel}</strong> is strictly locked because there are <strong>${unresolved.length} unresolved attendance or leave discrepancies</strong>. Company policy prohibits payroll finalization until all discrepancies are approved, converted to salary deductions, or regularized.
            </div>
          </div>

          <div style="font-weight:700;font-size:12.5px;color:var(--text)">Blocking Issues to Resolve (${unresolved.length}):</div>
          <div style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:9px;padding:8px;background:var(--surface)">
            ${unresolved.map(u => `
              <div style="padding:8px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;font-size:12px">
                <div>
                  <div style="font-weight:700;color:var(--text)">${u.empName} <span style="font-size:11px;font-weight:normal;color:var(--text-3)">(${u.empNo})</span></div>
                  <div style="font-size:11px;color:var(--text-3)">${u.categoryLabel} • ${u.dateOrPeriod}</div>
                </div>
                <span class="badge badge-danger" style="font-size:10.5px">${u.financialImpact}</span>
              </div>
            `).join('')}
          </div>

          <div style="font-size:12px;color:var(--text-3);display:flex;align-items:center;gap:6px">
            <i class="fa fa-info-circle" style="color:var(--primary)"></i>
            <span>Head to the Audit Resolution Center to approve leaves, regularize punches, or apply Loss of Pay salary deductions.</span>
          </div>
        </div>
      `, {
        footer: `
          <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
          <button class="btn btn-primary" onclick="Modal.close('dynamic-modal'); App.navigate('administration'); setTimeout(() => Administration.switchSection('discrepancies'), 100);"><i class="fa fa-arrow-right"></i> Open Audit Center</button>
        `
      });
      return;
    }

    if (ungenerated.length === 0) {
      Toast.show(`All active employees already have salary slips for ${monthLabel}!`, 'info');
      return;
    }

    const pfSettings = this.getPFSettings();

    Modal.confirm('Process All Salaries', `Generate salary slips for <strong>${ungenerated.length} employees</strong> for <strong>${monthLabel}</strong>? Automatic loan recoveries, leave deductions, and 2026-27 FBR tax will be applied.`, () => {
      let count = 0;
      ungenerated.forEach(emp => {
        const basic = emp.salary || 50000;
        const allowances = Math.round(basic * 0.45);
        const pfEmp = Math.round(basic * (pfSettings.employeeRate / 100));
        const pfEmpr = Math.round(basic * (pfSettings.employerRate / 100));
        const otherDeductions = 2000;

        // Auto-detect active loans & deductions
        const allLoans = DB.get('loans') || [];
        const empActiveLoans = allLoans.filter(l => l.employeeId === emp.id && l.status === 'active' && (l.remaining || 0) > 0);
        const loanDeduction = empActiveLoans.reduce((sum, l) => sum + (l.monthlyDeduction || 0), 0);

        // Auto-calculate Loss of Pay / Leave Salary Deductions for current month
        const allLeaves = DB.get('leave_requests') || [];
        const salaryLeaves = allLeaves.filter(l => 
          l.employeeId === emp.id && 
          l.salaryDeduction === true && 
          l.status === 'approved' && 
          ((l.from && l.from.slice(0,7) === this.currentMonth) || (l.to && l.to.slice(0,7) === this.currentMonth))
        );
        const dailyWage = Math.round(basic / 30);
        const unpaidLeaveDays = salaryLeaves.reduce((sum, l) => sum + (l.deductionDays || l.days || 1), 0);
        const unpaidLeaveDeduction = salaryLeaves.reduce((sum, l) => sum + (l.deductionAmount || (dailyWage * (l.days || 1))), 0);

        const totalDeductions = pfEmp + otherDeductions + unpaidLeaveDeduction + loanDeduction;
        const taxCalc = DB.calculateFBRTax(basic + allowances);
        const tax = taxCalc.monthlyTax;
        const net = Math.max(0, basic + allowances - totalDeductions - tax);

        const newSlipId = DB.nextId('salary');
        DB.add('salary', {
          id: newSlipId,
          employeeId: emp.id,
          month: this.currentMonth,
          basic, allowances, deductions: totalDeductions, pfEmployee: pfEmp, pfEmployer: pfEmpr,
          unpaidLeaveDeduction, unpaidLeaveDays,
          loanDeduction,
          overtime: 0, bonus: 0, tax, netSalary: net,
          status: 'processed', paidOn: Utils.today()
        });

        // Deduct installment on active loans
        if (loanDeduction > 0) {
          empActiveLoans.forEach(l => {
            l.repayments = l.repayments || [];
            if (!l.repayments.some(r => r.month === this.currentMonth)) {
              l.repayments.push({
                month: this.currentMonth,
                amount: l.monthlyDeduction,
                paidOn: Utils.today(),
                method: 'salary_deduction',
                slipId: newSlipId
              });
              l.remaining = Math.max(0, l.remaining - 1);
              if (l.remaining === 0) l.status = 'completed';
              DB.update('loans', l.id, l);
            }
          });
        }

        // Sync with PF ledger
        const pfRecords = DB.get('provident_fund');
        const existingPF = pfRecords.find(r => r.employeeId === emp.id && r.month === this.currentMonth);
        if (!existingPF) {
          DB.add('provident_fund', {
            id: pfRecords.length > 0 ? Math.max(...pfRecords.map(r=>r.id||0))+1 : 1,
            employeeId: emp.id,
            month: this.currentMonth,
            basicSalary: basic,
            employeeRate: pfSettings.employeeRate,
            employeeShare: pfEmp,
            employerRate: pfSettings.employerRate,
            employerShare: pfEmpr,
            interest: 0,
            totalMonthly: pfEmp + pfEmpr,
            type: 'contribution',
            notes: `Payroll batch run (${this.currentMonth})`,
            date: `${this.currentMonth}-28`,
            createdAt: new Date().toISOString()
          });
        }
        count++;
      });

      DB.log('PROCESS', 'Payroll', `Bulk processed payroll for ${count} employees (${this.currentMonth})`, Auth.user?.id);
      Toast.show(`Payroll processed for ${count} employees!`, 'success', 'All salary slips and PF contributions updated');
      this.renderView();
    });
  },

  exportPayroll() {
    this.exportSlipsCSV();
  },

  // ════════════════════════════════════════════════════════════
  // PROVIDENT FUND (PF) MODULE ENGINE
  // ════════════════════════════════════════════════════════════

  ensurePFData() {
    let pfRecords = DB.get('provident_fund') || [];
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const months = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
    let modified = false;
    let idCounter = pfRecords.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;

    emps.forEach(emp => {
      const existing = pfRecords.filter(r => r.employeeId === emp.id && r.type !== 'withdrawal');
      if (existing.length === 0) {
        const basic = emp.salary || 50000;
        const joinMonth = (emp.joiningDate || '2020-01-01').slice(0, 7);
        const empShare = Math.round(basic * 0.05);
        const emprShare = Math.round(basic * 0.05);

        months.forEach(m => {
          if (m >= joinMonth) {
            pfRecords.push({
              id: idCounter++,
              employeeId: emp.id,
              month: m,
              basicSalary: basic,
              employeeRate: 5,
              employeeShare: empShare,
              employerRate: 5,
              employerShare: emprShare,
              interest: 0,
              totalMonthly: empShare + emprShare,
              type: 'contribution',
              notes: 'Monthly payroll contribution',
              date: `${m}-28`,
              createdAt: `${m}-28T10:00:00.000Z`
            });
            modified = true;
          }
        });
      }
    });

    if (modified || !DB.get('provident_fund')) {
      DB.set('provident_fund', pfRecords);
    }
    return pfRecords;
  },

  getPFSettings() {
    try {
      const saved = localStorage.getItem('hrm_pf_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      employeeRate: 5,
      employerRate: 5,
      interestRate: 8.5,
      vestingYears: 1
    };
  },

  savePFSettings(settings) {
    localStorage.setItem('hrm_pf_settings', JSON.stringify(settings));
    DB.log('UPDATE', 'Payroll', `PF policy updated: Emp ${settings.employeeRate}%, Empr ${settings.employerRate}%`, Auth.user?.id);
  },

  showPFSettingsModal() {
    const s = this.getPFSettings();
    Modal.show('Provident Fund Policy & Contribution Rates', `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Employee Contribution Rate (%)</label>
          <input type="number" class="form-control" id="pfs-emp-rate" value="${s.employeeRate}" min="0" max="25" step="0.5">
          <span style="font-size:11px;color:var(--text-3)">Standard percentage deducted from basic pay</span>
        </div>
        <div class="form-group">
          <label class="form-label required">Employer Matching Rate (%)</label>
          <input type="number" class="form-control" id="pfs-empr-rate" value="${s.employerRate}" min="0" max="25" step="0.5">
          <span style="font-size:11px;color:var(--text-3)">Company matching share added to employee fund</span>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Annual Interest / Dividend Rate (%)</label>
          <input type="number" class="form-control" id="pfs-interest" value="${s.interestRate}" min="0" max="25" step="0.1">
          <span style="font-size:11px;color:var(--text-3)">Projected annual dividend rate</span>
        </div>
        <div class="form-group">
          <label class="form-label required">Vesting Period (Years)</label>
          <input type="number" class="form-control" id="pfs-vesting" value="${s.vestingYears}" min="0" max="10">
          <span style="font-size:11px;color:var(--text-3)">Service required for 100% employer match eligibility</span>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Payroll.savePFSettingsModal()"><i class="fa fa-save"></i> Save Policy</button>
      `
    });
  },

  savePFSettingsModal() {
    const employeeRate = parseFloat(document.getElementById('pfs-emp-rate').value) || 5;
    const employerRate = parseFloat(document.getElementById('pfs-empr-rate').value) || 5;
    const interestRate = parseFloat(document.getElementById('pfs-interest').value) || 8.5;
    const vestingYears = parseInt(document.getElementById('pfs-vesting').value) || 1;

    this.savePFSettings({ employeeRate, employerRate, interestRate, vestingYears });
    Modal.close('dynamic-modal');
    Toast.show('PF policy updated successfully!', 'success', `Emp: ${employeeRate}% | Company: ${employerRate}%`);
    this.renderView();
  },

  getEmployeePFSummary(empId) {
    this.ensurePFData();
    const records = DB.get('provident_fund')
      .filter(r => r.employeeId === Number(empId))
      .sort((a,b) => (a.month || a.date || '').localeCompare(b.month || b.date || ''));

    let totalEmployee = 0;
    let totalEmployer = 0;
    let totalBalance = 0;

    const ledger = records.map(r => {
      const empAmt = Number(r.employeeShare) || 0;
      const emprAmt = Number(r.employerShare) || 0;
      const netMonthly = r.type === 'withdrawal' ? -(Number(r.amount) || Number(r.totalMonthly) || 0) : (Number(r.totalMonthly) || (empAmt + emprAmt));

      if (r.type === 'withdrawal') {
        totalBalance -= (Number(r.amount) || Number(r.totalMonthly) || 0);
      } else {
        totalEmployee += empAmt;
        totalEmployer += emprAmt;
        totalBalance += netMonthly;
      }

      return {
        ...r,
        runningBalance: Math.max(0, totalBalance)
      };
    });

    return {
      employeeId: empId,
      records: ledger,
      totalEmployee,
      totalEmployer,
      totalBalance: Math.max(0, totalBalance),
      count: records.length
    };
  },

  getCompanyPFSummary() {
    this.ensurePFData();
    const emps = DB.get('employees').filter(e => e.status === 'active');
    let totalPool = 0;
    let totalEmployee = 0;
    let totalEmployer = 0;
    let activeMembers = 0;

    emps.forEach(emp => {
      const summary = this.getEmployeePFSummary(emp.id);
      if (summary.count > 0 || summary.totalBalance > 0) {
        activeMembers++;
        totalPool += summary.totalBalance;
        totalEmployee += summary.totalEmployee;
        totalEmployer += summary.totalEmployer;
      }
    });

    return { totalPool, totalEmployee, totalEmployer, activeMembers, totalEmployees: emps.length };
  },

  renderProvidentFund(container) {
    const isHrOrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
    if (!isHrOrAdmin) {
      this.renderEmployeePFView(container);
    } else {
      this.renderAdminPFView(container);
    }
  },

  renderEmployeePFView(container) {
    const emp = Auth.employee;
    if (!emp) {
      container.innerHTML = `<div class="card" style="text-align:center;padding:40px">Employee profile not linked to user account.</div>`;
      return;
    }
    const summary = this.getEmployeePFSummary(emp.id);
    const pfSettings = this.getPFSettings();

    const allLoans = DB.get('loans') || [];
    const myPFLoans = allLoans.filter(l => l.employeeId === emp.id && l.loanType === 'pf_loan');
    const activePFLoan = myPFLoans.find(l => l.status === 'active' && (l.remaining || 0) > 0);
    const outstandingPFLoan = activePFLoan ? ((activePFLoan.remaining || 0) * (activePFLoan.monthlyDeduction || 0)) : 0;
    const maxLoanEligible = Math.max(0, Math.round((summary.totalBalance - outstandingPFLoan) * 0.80));

    container.innerHTML = `
      <!-- Employee Hero Portfolio Card -->
      <div style="background:linear-gradient(135deg, hsl(221,83%,20%), hsl(262,83%,25%));border:1px solid var(--border);border-radius:16px;padding:26px;color:white;margin-bottom:20px;position:relative;overflow:hidden">
        <div style="position:absolute;right:-20px;bottom:-30px;font-size:160px;opacity:0.05"><i class="fa fa-piggy-bank"></i></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;position:relative;z-index:1">
          <div>
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Provident Fund Account • ${emp.fullName}</div>
            <div style="font-size:36px;font-weight:800;margin:6px 0">${Utils.formatCurrency(summary.totalBalance)}</div>
            <div style="font-size:13px;opacity:0.9">Accumulated balance available in employee fund trust</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${isHrOrAdmin ? `
              <button class="btn btn-secondary btn-sm" onclick="Payroll.exportEmpPFCSV(${emp.id})"><i class="fa fa-file-csv"></i> Download Statement (CSV)</button>
              <button class="btn btn-primary btn-sm" onclick="Payroll.printPFStatement(${emp.id})"><i class="fa fa-print"></i> Print / Save Statement (PDF)</button>
            ` : `
              <div style="background:rgba(255,255,255,0.12);padding:7px 14px;border-radius:8px;font-size:11.5px;display:flex;align-items:center;gap:7px">
                <i class="fa fa-shield-halved"></i> View-Only Portfolio &bull; Official PF Statements Issued by HR Trust
              </div>
            `}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:22px;position:relative;z-index:1">
          <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);border-radius:10px;padding:14px">
            <div style="font-size:11px;opacity:0.8">Your Total Contributions</div>
            <div style="font-size:18px;font-weight:700;margin-top:2px">${Utils.formatCurrency(summary.totalEmployee)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);border-radius:10px;padding:14px">
            <div style="font-size:11px;opacity:0.8">Company Matching Funds</div>
            <div style="font-size:18px;font-weight:700;margin-top:2px">${Utils.formatCurrency(summary.totalEmployer)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);border-radius:10px;padding:14px">
            <div style="font-size:11px;opacity:0.8">Contribution Rate</div>
            <div style="font-size:18px;font-weight:700;margin-top:2px">${pfSettings.employeeRate}% + ${pfSettings.employerRate}% Match</div>
          </div>
          <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);border-radius:10px;padding:14px">
            <div style="font-size:11px;opacity:0.8">Vesting Status</div>
            <div style="font-size:18px;font-weight:700;margin-top:2px;color:#86efac"><i class="fa fa-check-circle"></i> 100% Vested</div>
          </div>
        </div>
      </div>

      <!-- PF Loan & Collateral Facility Card -->
      <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(168,85,247,0.06));border:1px solid rgba(99,102,241,0.25)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
              <i class="fa fa-hand-holding-dollar" style="color:var(--primary)"></i> Loan Facility Against Provident Fund
            </div>
            <div style="font-size:12.5px;color:var(--text-2);margin-top:4px">
              You are entitled to borrow up to <strong>80% of your accumulated PF balance</strong> as a collateral-backed loan with automatic salary recovery.
            </div>
          </div>
          <div style="display:flex;gap:8px">
            ${activePFLoan ? `
              <button class="btn btn-secondary btn-sm" onclick="Payroll.showLoanRepaymentModal(${activePFLoan.id})"><i class="fa fa-receipt"></i> View Active Loan Ledger</button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="Payroll.showAddLoan(true)"><i class="fa fa-paper-plane"></i> Apply for Loan Against PF</button>
            `}
            <button class="btn btn-ghost btn-sm" onclick="Payroll.switchTab('loans')"><i class="fa fa-arrow-right"></i> All My Loans</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Available Borrowing Limit (80%)</div>
            <div style="font-size:20px;font-weight:800;color:var(--success);margin-top:2px">${Utils.formatCurrency(maxLoanEligible)}</div>
            <div style="font-size:11px;color:var(--text-muted)">Unencumbered collateral ceiling</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Active PF Loan Exposure</div>
            <div style="font-size:20px;font-weight:800;color:${outstandingPFLoan > 0 ? 'var(--warning)' : 'var(--text-muted)'};margin-top:2px">
              ${outstandingPFLoan > 0 ? Utils.formatCurrency(outstandingPFLoan) : 'No Active Loan'}
            </div>
            <div style="font-size:11px;color:var(--text-muted)">${activePFLoan ? `${activePFLoan.remaining} installments left (${Utils.formatCurrency(activePFLoan.monthlyDeduction)}/mo)` : 'Zero encumbrance'}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Unencumbered Net Trust Balance</div>
            <div style="font-size:20px;font-weight:800;color:var(--primary);margin-top:2px">${Utils.formatCurrency(Math.max(0, summary.totalBalance - outstandingPFLoan))}</div>
            <div style="font-size:11px;color:var(--text-muted)">Net equity after loan collateral</div>
          </div>
        </div>
      </div>

      <!-- Statement Ledger Card -->
      <div class="card" style="padding:0">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:16px">Provident Fund Transaction Ledger</div>
            <div style="font-size:12px;color:var(--text-3)">Detailed chronological contributions and balance history</div>
          </div>
          <span class="badge badge-success">${summary.records.length} Transactions</span>
        </div>

        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Month / Effective Date</th>
                <th>Basic Salary</th>
                <th>Your Share (${pfSettings.employeeRate}%)</th>
                <th>Employer Match (${pfSettings.employerRate}%)</th>
                <th>Total Added</th>
                <th>Cumulative Balance</th>
                <th>Type</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${summary.records.length === 0 ? `
                <tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">No Provident Fund transactions found.</td></tr>
              ` : summary.records.map(r => `
                <tr>
                  <td><strong>${r.month || r.date}</strong></td>
                  <td>${Utils.formatCurrency(r.basicSalary)}</td>
                  <td style="color:var(--primary);font-weight:600">${Utils.formatCurrency(r.employeeShare || 0)}</td>
                  <td style="color:#a855f7;font-weight:600">${Utils.formatCurrency(r.employerShare || 0)}</td>
                  <td style="font-weight:700;color:${r.type === 'withdrawal' ? 'var(--danger)' : 'var(--success)'}">
                    ${r.type === 'withdrawal' ? '-' : '+'}${Utils.formatCurrency(Math.abs(r.totalMonthly || 0))}
                  </td>
                  <td style="font-weight:800;color:var(--success)">${Utils.formatCurrency(r.runningBalance)}</td>
                  <td><span class="chip">${r.type}</span></td>
                  <td style="font-size:12px;color:var(--text-3)">${r.notes || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAdminPFView(container) {
    const summary = this.getCompanyPFSummary();
    const depts = DB.get('departments');
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const pfSettings = this.getPFSettings();

    const allLoans = DB.get('loans') || [];
    const activePFLoans = allLoans.filter(l => l.loanType === 'pf_loan' && l.status === 'active' && (l.remaining || 0) > 0);
    const totalPFLoanExposure = activePFLoans.reduce((sum, l) => sum + ((l.remaining || 0) * (l.monthlyDeduction || 0)), 0);

    container.innerHTML = `
      <!-- KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:10px;background:var(--success)22;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--success)"><i class="fa fa-piggy-bank"></i></div>
          <div>
            <div style="font-size:18px;font-weight:800;color:var(--success)">${Utils.formatCurrency(summary.totalPool)}</div>
            <div style="font-size:11px;color:var(--text-3)">Total PF Fund Pool</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:10px;background:var(--primary)22;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--primary)"><i class="fa fa-hand-holding-dollar"></i></div>
          <div>
            <div style="font-size:18px;font-weight:800;color:var(--primary)">${Utils.formatCurrency(summary.totalEmployee)}</div>
            <div style="font-size:11px;color:var(--text-3)">Employee Contributions</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:10px;background:#a855f722;display:flex;align-items:center;justify-content:center;font-size:18px;color:#a855f7"><i class="fa fa-building-columns"></i></div>
          <div>
            <div style="font-size:18px;font-weight:800;color:#a855f7">${Utils.formatCurrency(summary.totalEmployer)}</div>
            <div style="font-size:11px;color:var(--text-3)">Employer Match</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:10px;background:var(--warning)22;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--warning)"><i class="fa fa-file-invoice-dollar"></i></div>
          <div>
            <div style="font-size:18px;font-weight:800;color:var(--warning)">${Utils.formatCurrency(totalPFLoanExposure)}</div>
            <div style="font-size:11px;color:var(--text-3)">${activePFLoans.length} Active PF Loans</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:10px;background:var(--info)22;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--info)"><i class="fa fa-users"></i></div>
          <div>
            <div style="font-size:18px;font-weight:800;color:var(--info)">${summary.activeMembers} / ${summary.totalEmployees}</div>
            <div style="font-size:11px;color:var(--text-3)">Enrolled Members</div>
          </div>
        </div>
      </div>

      <!-- Action & Filter Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="position:relative">
            <input class="form-control" id="pf-search" placeholder="Search employee..." style="width:200px;padding-left:32px" oninput="Payroll.filterPFTable()">
            <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px"></i>
          </div>
          <select class="filter-select" id="pf-dept-filter" onchange="Payroll.filterPFTable()" style="width:180px">
            <option value="">All Departments</option>
            ${depts.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="Payroll.printPFReport()"><i class="fa fa-print"></i> Print / PDF Report</button>
          <button class="btn btn-secondary btn-sm" onclick="Payroll.exportPFCSV()"><i class="fa fa-file-csv"></i> Export PF Ledger (CSV)</button>
          <button class="btn btn-secondary btn-sm" onclick="Payroll.showPFSettingsModal()"><i class="fa fa-sliders"></i> PF Policy & Rates</button>
          <button class="btn btn-primary btn-sm" onclick="Payroll.showAddPFAdjustmentModal()"><i class="fa fa-plus"></i> Add Adjustment / Transaction</button>
        </div>
      </div>

      <!-- Accounts Table -->
      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table id="pf-accounts-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department & Designation</th>
                <th>Member Since</th>
                <th>Base Salary</th>
                <th>Monthly Rate</th>
                <th>Employee Share</th>
                <th>Employer Match</th>
                <th>Accumulated Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${emps.map(emp => {
                const s = this.getEmployeePFSummary(emp.id);
                return `
                  <tr class="pf-emp-row" data-name="${emp.fullName.toLowerCase()}" data-empno="${emp.empNo.toLowerCase()}" data-dept="${emp.departmentId}">
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                        <div>
                          <div style="font-weight:600;font-size:13px">${emp.fullName}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-size:12.5px;font-weight:500">${Utils.getDeptName(emp.departmentId)}</div>
                      <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(emp.designationId)}</div>
                    </td>
                    <td>${Utils.formatDate(emp.joiningDate)}</td>
                    <td style="font-weight:600">${Utils.formatCurrency(emp.salary)}</td>
                    <td><span class="chip">${pfSettings.employeeRate}% + ${pfSettings.employerRate}%</span></td>
                    <td style="color:var(--primary);font-weight:600">${Utils.formatCurrency(s.totalEmployee)}</td>
                    <td style="color:#a855f7;font-weight:600">${Utils.formatCurrency(s.totalEmployer)}</td>
                    <td style="font-weight:800;color:var(--success);font-size:14px">${Utils.formatCurrency(s.totalBalance)}</td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="tbl-actions">
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.viewPFStatement(${emp.id})" title="View Statement"><i class="fa fa-file-lines"></i></button>
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.showAddPFAdjustmentModal(${emp.id})" title="Add Adjustment / Withdrawal"><i class="fa fa-plus"></i></button>
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.exportEmpPFCSV(${emp.id})" title="Download CSV"><i class="fa fa-file-csv"></i></button>
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.printPFStatement(${emp.id})" title="Print / PDF Statement"><i class="fa fa-print"></i></button>
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

  filterPFTable() {
    const q = (document.getElementById('pf-search')?.value || '').toLowerCase().trim();
    const deptId = document.getElementById('pf-dept-filter')?.value || '';

    document.querySelectorAll('.pf-emp-row').forEach(row => {
      const name = row.getAttribute('data-name') || '';
      const empNo = row.getAttribute('data-empno') || '';
      const dept = row.getAttribute('data-dept') || '';

      const matchesSearch = !q || name.includes(q) || empNo.includes(q);
      const matchesDept = !deptId || dept === String(deptId);

      row.style.display = (matchesSearch && matchesDept) ? '' : 'none';
    });
  },

  viewPFStatement(empId) {
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const summary = this.getEmployeePFSummary(emp.id);
    const pfSettings = this.getPFSettings();

    Modal.show(`Provident Fund Statement — ${emp.fullName}`, `
      <div style="background:white;color:#111;border-radius:12px;overflow:hidden;padding:20px">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:14px;margin-bottom:16px">
          <div>
            <div style="font-size:20px;font-weight:800;color:#1e40af">HRM Pro — Provident Fund Trust</div>
            <div style="font-size:12px;color:#6b7280">Employee Account Statement • Member ID: PF-${emp.empNo}</div>
          </div>
          <div style="text-align:right">
            <span class="badge badge-success" style="font-size:12px;padding:4px 10px">Status: Active & Vested</span>
            <div style="font-size:11px;color:#6b7280;margin-top:4px">Report as of ${Utils.formatDate(Utils.today())}</div>
          </div>
        </div>

        <!-- Employee Info Card -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:18px">
          <div>
            <div style="font-size:11px;color:#64748b;font-weight:600">EMPLOYEE DETAILS</div>
            <div style="font-size:15px;font-weight:700;color:#0f172a">${emp.fullName}</div>
            <div style="font-size:12px;color:#475569">${Utils.getDesigName(emp.designationId)} • ${Utils.getDeptName(emp.departmentId)}</div>
            <div style="font-size:12px;color:#475569">Joining Date: ${Utils.formatDate(emp.joiningDate)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#64748b;font-weight:600">POLICY SPECIFICATION</div>
            <div style="font-size:12px;color:#475569">Base Salary: <strong>${Utils.formatCurrency(emp.salary)}</strong></div>
            <div style="font-size:12px;color:#475569">Employee Share: <strong>${pfSettings.employeeRate}%</strong></div>
            <div style="font-size:12px;color:#475569">Employer Match: <strong>${pfSettings.employerRate}%</strong></div>
          </div>
        </div>

        <!-- Metric Cards -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:11px;color:#1e40af;font-weight:600">Total Employee Share</div>
            <div style="font-size:18px;font-weight:800;color:#1e40af;margin-top:2px">${Utils.formatCurrency(summary.totalEmployee)}</div>
          </div>
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:11px;color:#6d28d9;font-weight:600">Total Employer Match</div>
            <div style="font-size:18px;font-weight:800;color:#6d28d9;margin-top:2px">${Utils.formatCurrency(summary.totalEmployer)}</div>
          </div>
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:11px;color:#047857;font-weight:600">Accumulated Fund Balance</div>
            <div style="font-size:20px;font-weight:800;color:#047857;margin-top:2px">${Utils.formatCurrency(summary.totalBalance)}</div>
          </div>
        </div>

        <!-- Ledger Table -->
        <div style="max-height:300px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead style="background:#f1f5f9;position:sticky;top:0">
              <tr>
                <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #cbd5e1">Month / Date</th>
                <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #cbd5e1">Basic Pay</th>
                <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #cbd5e1">Employee (${pfSettings.employeeRate}%)</th>
                <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #cbd5e1">Employer (${pfSettings.employerRate}%)</th>
                <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #cbd5e1">Monthly Total</th>
                <th style="padding:8px 10px;text-align:right;border-bottom:1px solid #cbd5e1">Cumulative Balance</th>
                <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #cbd5e1">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${summary.records.map(r => `
                <tr style="border-bottom:1px solid #f1f5f9">
                  <td style="padding:8px 10px"><strong>${r.month || r.date}</strong></td>
                  <td style="padding:8px 10px">${Utils.formatCurrency(r.basicSalary)}</td>
                  <td style="padding:8px 10px;text-align:right;color:#2563eb">${Utils.formatCurrency(r.employeeShare || 0)}</td>
                  <td style="padding:8px 10px;text-align:right;color:#7c3aed">${Utils.formatCurrency(r.employerShare || 0)}</td>
                  <td style="padding:8px 10px;text-align:right;font-weight:600;color:${r.type === 'withdrawal' ? '#dc2626' : '#059669'}">
                    ${r.type === 'withdrawal' ? '-' : '+'}${Utils.formatCurrency(Math.abs(r.totalMonthly || 0))}
                  </td>
                  <td style="padding:8px 10px;text-align:right;font-weight:700;color:#047857">${Utils.formatCurrency(r.runningBalance)}</td>
                  <td style="padding:8px 10px;color:#64748b;font-size:11px">${r.notes || r.type}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `, {
      size: 'modal-lg',
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        ${['superadmin', 'hr_manager'].includes(Auth.role) ? `
          <button class="btn btn-secondary" onclick="Payroll.exportEmpPFCSV(${emp.id})"><i class="fa fa-file-csv"></i> Download CSV</button>
          <button class="btn btn-primary" onclick="Payroll.printPFStatement(${emp.id})"><i class="fa fa-print"></i> Print / PDF Statement</button>
        ` : ''}
      `
    });
  },

  showAddPFAdjustmentModal(empId = null) {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const selectedEmp = empId ? DB.find('employees', Number(empId)) : emps[0];
    const today = Utils.today();

    Modal.show('Add Provident Fund Adjustment / Transaction', `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Employee</label>
          <select class="form-control" id="pfa-emp">
            ${emps.map(e => `<option value="${e.id}" ${selectedEmp && e.id === selectedEmp.id ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Transaction Type</label>
          <select class="form-control" id="pfa-type">
            <option value="contribution">Voluntary Employee Contribution</option>
            <option value="employer_match">Special Employer Match / Grant</option>
            <option value="interest">Annual Profit / Interest Credit</option>
            <option value="withdrawal">Partial Withdrawal / Advance</option>
            <option value="settlement">Final Settlement / Payout</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Amount (PKR)</label>
          <input type="number" class="form-control" id="pfa-amount" placeholder="0" min="100">
        </div>
        <div class="form-group">
          <label class="form-label required">Effective Month / Date</label>
          <input type="date" class="form-control" id="pfa-date" value="${today}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes / Remarks</label>
        <input class="form-control" id="pfa-notes" placeholder="e.g. Voluntary contribution for Q3, or approved advance withdrawal">
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Payroll.savePFAdjustment()"><i class="fa fa-save"></i> Save Transaction</button>
      `
    });
  },

  savePFAdjustment() {
    const empId = Number(document.getElementById('pfa-emp').value);
    const type = document.getElementById('pfa-type').value;
    const amount = parseFloat(document.getElementById('pfa-amount').value) || 0;
    const date = document.getElementById('pfa-date').value || Utils.today();
    const notes = document.getElementById('pfa-notes')?.value.trim() || 'Manual adjustment';

    if (amount <= 0) {
      Toast.show('Please enter a valid amount greater than 0', 'error');
      return;
    }

    const emp = DB.find('employees', empId);
    if (!emp) return;

    const month = date.slice(0, 7);
    let empShare = 0;
    let emprShare = 0;

    if (type === 'contribution') empShare = amount;
    else if (type === 'employer_match') emprShare = amount;
    else if (type === 'interest') emprShare = amount;

    const pfRecords = DB.get('provident_fund');
    const newId = pfRecords.length > 0 ? Math.max(...pfRecords.map(r => r.id || 0)) + 1 : 1;

    DB.add('provident_fund', {
      id: newId,
      employeeId: empId,
      month,
      basicSalary: emp.salary || 0,
      employeeRate: 0,
      employeeShare: empShare,
      employerRate: 0,
      employerShare: emprShare,
      interest: type === 'interest' ? amount : 0,
      totalMonthly: type === 'withdrawal' ? -amount : amount,
      amount: amount,
      type: type,
      notes: notes,
      date: date,
      createdAt: new Date().toISOString()
    });

    DB.log('ADD', 'Payroll', `PF ${type} PKR ${amount.toLocaleString()} for ${emp.fullName}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('PF transaction recorded!', 'success', `${emp.fullName} • PKR ${amount.toLocaleString()}`);
    this.renderView();
  },

  // ════════════════════════════════════════════════════════════
  // EXPORT & PRINT SERVICES (PDF & CSV)
  // ════════════════════════════════════════════════════════════

  printDocument(title, htmlContent) {
    const printWindow = window.open('', '_blank', 'width=900,height=950');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', -apple-system, sans-serif; }
            body { background:#fff; color:#111827; padding:28px; font-size:13px; line-height:1.5; }
            .doc-header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #2563eb; padding-bottom:16px; margin-bottom:20px; }
            .brand-title { font-size:24px; font-weight:800; color:#1e40af; }
            .brand-sub { font-size:12px; color:#6b7280; margin-top:2px; }
            .doc-type { text-align:right; }
            .doc-type-title { font-size:18px; font-weight:800; color:#111827; letter-spacing:0.5px; }
            .doc-date { font-size:12px; color:#6b7280; margin-top:2px; }
            .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:20px; }
            .info-col p { margin-bottom:4px; font-size:12.5px; }
            .info-col strong { color:#0f172a; }
            .stat-pills { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:20px; }
            .stat-pill { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; text-align:center; }
            .stat-pill-label { font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; }
            .stat-pill-val { font-size:18px; font-weight:800; margin-top:4px; }
            table { width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12.5px; }
            th { background:#f1f5f9; color:#334155; font-size:11px; font-weight:700; text-transform:uppercase; padding:10px 12px; text-align:left; border-bottom:2px solid #cbd5e1; }
            td { padding:10px 12px; border-bottom:1px solid #e2e8f0; }
            .text-right { text-align:right; }
            .text-center { text-align:center; }
            .font-bold { font-weight:700; }
            .text-green { color:#059669; }
            .text-red { color:#dc2626; }
            .text-blue { color:#2563eb; }
            .total-banner { background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
            .total-banner-val { font-size:24px; font-weight:800; color:#15803d; }
            .sig-section { display:grid; grid-template-columns:1fr 1fr 1fr; gap:40px; margin-top:60px; text-align:center; }
            .sig-box { border-top:1px dashed #94a3b8; padding-top:8px; font-size:11px; color:#64748b; }
            .footer-note { border-top:1px solid #e2e8f0; margin-top:30px; padding-top:12px; font-size:11px; color:#94a3b8; text-align:center; }
            @media print {
              body { padding:0; }
              @page { size: A4; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 350);
            };
          <\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  },

  printSlip(empId, month) {
    if (!['superadmin', 'hr_manager'].includes(Auth.role)) {
      Toast.show('Printing and downloading payslips is reserved for HR & Admin', 'warning');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    const rec = DB.get('salary').find(s => s.employeeId === Number(empId) && s.month === month);
    if (!emp || !rec) { Toast.show('Salary record not found', 'error'); return; }

    const monthLabel = new Date(month+'-01').toLocaleDateString('en',{month:'long',year:'numeric'});
    const pfSettings = this.getPFSettings();
    const pfSummary = this.getEmployeePFSummary(emp.id);
    const pfEmp = rec.pfEmployee !== undefined ? rec.pfEmployee : Math.round(rec.basic * (pfSettings.employeeRate / 100));
    const pfEmpr = rec.pfEmployer !== undefined ? rec.pfEmployer : Math.round(rec.basic * (pfSettings.employerRate / 100));
    const otherDeductions = Math.max(0, (rec.deductions || 0) - pfEmp);

    const html = `
      <div class="doc-header">
        <div>
          <div class="brand-title">HRM Pro</div>
          <div class="brand-sub">Human Resource Management & Payroll Services</div>
        </div>
        <div class="doc-type">
          <div class="doc-type-title">SALARY PAYSLIP</div>
          <div class="doc-date">${monthLabel}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-col">
          <p><strong>Employee:</strong> ${emp.fullName}</p>
          <p><strong>Employee No:</strong> ${emp.empNo}</p>
          <p><strong>Designation:</strong> ${Utils.getDesigName(emp.designationId)}</p>
          <p><strong>Department:</strong> ${Utils.getDeptName(emp.departmentId)}</p>
        </div>
        <div class="info-col" style="text-align:right">
          <p><strong>Joining Date:</strong> ${Utils.formatDate(emp.joiningDate)}</p>
          <p><strong>Bank Account:</strong> ${emp.bankName || 'HBL'} • ${emp.accountNo || '—'}</p>
          <p><strong>Payment Status:</strong> <span class="text-green font-bold">${(rec.status || 'processed').toUpperCase()}</span></p>
          <p><strong>Payment Date:</strong> ${Utils.formatDate(rec.paidOn || Utils.today())}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <div>
          <div style="background:#f1f5f9;padding:8px 12px;font-weight:700;color:#334155;border-bottom:2px solid #cbd5e1;text-transform:uppercase;font-size:11px">
            Earnings Breakdown
          </div>
          <table>
            <tbody>
              <tr><td>Basic Salary</td><td class="text-right font-bold">${Utils.formatCurrency(rec.basic)}</td></tr>
              <tr><td>Allowances (HRA, Med, Transport)</td><td class="text-right text-green">${Utils.formatCurrency(rec.allowances)}</td></tr>
              ${rec.overtime ? `<tr><td>Overtime Pay</td><td class="text-right text-green">${Utils.formatCurrency(rec.overtime)}</td></tr>` : ''}
              ${rec.bonus ? `<tr><td>Bonus / Incentive</td><td class="text-right text-green">${Utils.formatCurrency(rec.bonus)}</td></tr>` : ''}
              <tr style="background:#f8fafc"><td class="font-bold">Gross Earnings</td><td class="text-right font-bold text-green">${Utils.formatCurrency(rec.basic + rec.allowances + (rec.overtime||0) + (rec.bonus||0))}</td></tr>
            </tbody>
          </table>
        </div>

        <div>
          <div style="background:#f1f5f9;padding:8px 12px;font-weight:700;color:#334155;border-bottom:2px solid #cbd5e1;text-transform:uppercase;font-size:11px">
            Deductions Breakdown
          </div>
          <table>
            <tbody>
              <tr><td>Provident Fund (Employee ${pfSettings.employeeRate}%)</td><td class="text-right text-red">${Utils.formatCurrency(pfEmp)}</td></tr>
              <tr><td>Income Tax (FBR Withholding)</td><td class="text-right text-red">${Utils.formatCurrency(rec.tax)}</td></tr>
              ${rec.unpaidLeaveDeduction > 0 ? `<tr><td style="color:#dc2626;font-weight:600">Unpaid Leave / Loss of Pay (${rec.unpaidLeaveDays || 1}d)</td><td class="text-right text-red font-bold">${Utils.formatCurrency(rec.unpaidLeaveDeduction)}</td></tr>` : ''}
              ${otherDeductions > 0 ? `<tr><td>Other Deductions (EOBI / SESSI)</td><td class="text-right text-red">${Utils.formatCurrency(otherDeductions)}</td></tr>` : ''}
              <tr style="background:#f8fafc"><td class="font-bold">Total Deductions</td><td class="text-right font-bold text-red">${Utils.formatCurrency(rec.deductions + rec.tax)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 18px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase">Employer PF Contribution (Matching ${pfSettings.employerRate}%)</div>
          <div style="font-size:15px;font-weight:800;color:#15803d;margin-top:2px">${Utils.formatCurrency(pfEmpr)} <span style="font-size:11px;font-weight:normal;color:#166534">(Directly credited to PF Trust)</span></div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase">Accumulated PF Balance To Date</div>
          <div style="font-size:15px;font-weight:800;color:#15803d;margin-top:2px">${Utils.formatCurrency(pfSummary.totalBalance)}</div>
        </div>
      </div>

      <div class="total-banner">
        <div>
          <div style="font-size:14px;font-weight:700;color:#166534">NET SALARY PAYABLE FOR ${monthLabel.toUpperCase()}</div>
          <div style="font-size:11px;color:#15803d">Transferred via ${rec.notes || emp.bankName || 'Direct Deposit'}</div>
        </div>
        <div class="total-banner-val">${Utils.formatCurrency(rec.netSalary)}</div>
      </div>

      <div class="sig-section">
        <div class="sig-box">Prepared By (Payroll Officer)</div>
        <div class="sig-box">Approved By (Head of HR / Finance)</div>
        <div class="sig-box">Employee Signature / Confirmation</div>
      </div>

      <div class="footer-note">
        This is a computer-generated payslip generated by HRM Pro. No physical signature is required. Confidential document.
      </div>
    `;

    this.printDocument(`Payslip — ${emp.fullName} — ${monthLabel}`, html);
  },

  printAllSlips() {
    const salaries = DB.get('salary').filter(s => s.month === this.currentMonth && s.status === 'processed');
    if (salaries.length === 0) {
      Toast.show(`No processed payslips found for ${this.currentMonth}`, 'warning');
      return;
    }
    const emps = DB.get('employees');
    const pfSettings = this.getPFSettings();
    const monthLabel = new Date(this.currentMonth+'-01').toLocaleDateString('en',{month:'long',year:'numeric'});

    const slipsHtml = salaries.map((rec, idx) => {
      const emp = emps.find(e => e.id === rec.employeeId);
      if (!emp) return '';
      const pfSummary = this.getEmployeePFSummary(emp.id);
      const pfEmp = rec.pfEmployee !== undefined ? rec.pfEmployee : Math.round(rec.basic * (pfSettings.employeeRate / 100));
      const pfEmpr = rec.pfEmployer !== undefined ? rec.pfEmployer : Math.round(rec.basic * (pfSettings.employerRate / 100));
      const otherDeductions = Math.max(0, (rec.deductions || 0) - pfEmp);

      return `
        <div style="${idx > 0 ? 'page-break-before: always; margin-top: 40px;' : ''}">
          <div class="doc-header">
            <div>
              <div class="brand-title">HRM Pro</div>
              <div class="brand-sub">Human Resource Management & Payroll Services</div>
            </div>
            <div class="doc-type">
              <div class="doc-type-title">SALARY PAYSLIP</div>
              <div class="doc-date">${monthLabel}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-col">
              <p><strong>Employee:</strong> ${emp.fullName}</p>
              <p><strong>Employee No:</strong> ${emp.empNo}</p>
              <p><strong>Designation:</strong> ${Utils.getDesigName(emp.designationId)}</p>
              <p><strong>Department:</strong> ${Utils.getDeptName(emp.departmentId)}</p>
            </div>
            <div class="info-col" style="text-align:right">
              <p><strong>Joining Date:</strong> ${Utils.formatDate(emp.joiningDate)}</p>
              <p><strong>Bank Account:</strong> ${emp.bankName || 'HBL'} • ${emp.accountNo || '—'}</p>
              <p><strong>Payment Status:</strong> <span class="text-green font-bold">${(rec.status || 'processed').toUpperCase()}</span></p>
              <p><strong>Payment Date:</strong> ${Utils.formatDate(rec.paidOn || Utils.today())}</p>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
            <div>
              <div style="background:#f1f5f9;padding:8px 12px;font-weight:700;color:#334155;border-bottom:2px solid #cbd5e1;text-transform:uppercase;font-size:11px">
                Earnings Breakdown
              </div>
              <table>
                <tbody>
                  <tr><td>Basic Salary</td><td class="text-right font-bold">${Utils.formatCurrency(rec.basic)}</td></tr>
                  <tr><td>Allowances</td><td class="text-right text-green">${Utils.formatCurrency(rec.allowances)}</td></tr>
                  ${rec.overtime ? `<tr><td>Overtime Pay</td><td class="text-right text-green">${Utils.formatCurrency(rec.overtime)}</td></tr>` : ''}
                  ${rec.bonus ? `<tr><td>Bonus / Incentive</td><td class="text-right text-green">${Utils.formatCurrency(rec.bonus)}</td></tr>` : ''}
                  <tr style="background:#f8fafc"><td class="font-bold">Gross Earnings</td><td class="text-right font-bold text-green">${Utils.formatCurrency(rec.basic + rec.allowances + (rec.overtime||0) + (rec.bonus||0))}</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <div style="background:#f1f5f9;padding:8px 12px;font-weight:700;color:#334155;border-bottom:2px solid #cbd5e1;text-transform:uppercase;font-size:11px">
                Deductions Breakdown
              </div>
              <table>
                <tbody>
                  <tr><td>Provident Fund (Employee ${pfSettings.employeeRate}%)</td><td class="text-right text-red">${Utils.formatCurrency(pfEmp)}</td></tr>
                  <tr><td>Income Tax</td><td class="text-right text-red">${Utils.formatCurrency(rec.tax)}</td></tr>
                  ${otherDeductions > 0 ? `<tr><td>Other Deductions (EOBI / SESSI)</td><td class="text-right text-red">${Utils.formatCurrency(otherDeductions)}</td></tr>` : ''}
                  <tr style="background:#f8fafc"><td class="font-bold">Total Deductions</td><td class="text-right font-bold text-red">${Utils.formatCurrency(pfEmp + otherDeductions + rec.tax)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 18px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase">Employer PF Match (${pfSettings.employerRate}%)</div>
              <div style="font-size:15px;font-weight:800;color:#15803d;margin-top:2px">${Utils.formatCurrency(pfEmpr)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase">Accumulated PF Balance</div>
              <div style="font-size:15px;font-weight:800;color:#15803d;margin-top:2px">${Utils.formatCurrency(pfSummary.totalBalance)}</div>
            </div>
          </div>

          <div class="total-banner">
            <div>
              <div style="font-size:14px;font-weight:700;color:#166534">NET SALARY PAYABLE FOR ${monthLabel.toUpperCase()}</div>
              <div style="font-size:11px;color:#15803d">Status: ${(rec.status || 'processed').toUpperCase()}</div>
            </div>
            <div class="total-banner-val">${Utils.formatCurrency(rec.netSalary)}</div>
          </div>

          <div class="sig-section">
            <div class="sig-box">Prepared By (Payroll)</div>
            <div class="sig-box">Approved By (HR/Finance)</div>
            <div class="sig-box">Employee Acknowledgment</div>
          </div>
        </div>
      `;
    }).join('');

    this.printDocument(`Consolidated Payslips — ${monthLabel}`, slipsHtml);
  },

  printPFStatement(empId) {
    if (!['superadmin', 'hr_manager'].includes(Auth.role)) {
      Toast.show('Printing and downloading Provident Fund statements is reserved for HR & Admin', 'warning');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const summary = this.getEmployeePFSummary(emp.id);
    const pfSettings = this.getPFSettings();

    const html = `
      <div class="doc-header">
        <div>
          <div class="brand-title">HRM Pro — Provident Fund Trust</div>
          <div class="brand-sub">Official Employee Provident Fund Account Statement</div>
        </div>
        <div class="doc-type">
          <div class="doc-type-title">PF STATEMENT</div>
          <div class="doc-date">Generated: ${Utils.formatDate(Utils.today())}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-col">
          <p><strong>Employee Name:</strong> ${emp.fullName}</p>
          <p><strong>Employee No:</strong> ${emp.empNo} (PF ID: PF-${emp.empNo})</p>
          <p><strong>Department:</strong> ${Utils.getDeptName(emp.departmentId)}</p>
          <p><strong>Designation:</strong> ${Utils.getDesigName(emp.designationId)}</p>
        </div>
        <div class="info-col" style="text-align:right">
          <p><strong>Date of Joining:</strong> ${Utils.formatDate(emp.joiningDate)}</p>
          <p><strong>Basic Salary:</strong> ${Utils.formatCurrency(emp.salary)}</p>
          <p><strong>Employee Contribution:</strong> ${pfSettings.employeeRate}%</p>
          <p><strong>Employer Matching:</strong> ${pfSettings.employerRate}%</p>
        </div>
      </div>

      <div class="stat-pills">
        <div class="stat-pill">
          <div class="stat-pill-label">Employee Contributions</div>
          <div class="stat-pill-val text-blue">${Utils.formatCurrency(summary.totalEmployee)}</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-label">Employer Matching Contributions</div>
          <div class="stat-pill-val" style="color:#7c3aed">${Utils.formatCurrency(summary.totalEmployer)}</div>
        </div>
        <div class="stat-pill" style="background:#ecfdf5;border-color:#a7f3d0">
          <div class="stat-pill-label" style="color:#065f46">Total Accumulated Fund</div>
          <div class="stat-pill-val text-green">${Utils.formatCurrency(summary.totalBalance)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Month / Date</th>
            <th>Basic Salary</th>
            <th class="text-right">Employee Share (${pfSettings.employeeRate}%)</th>
            <th class="text-right">Employer Match (${pfSettings.employerRate}%)</th>
            <th class="text-right">Monthly Addition</th>
            <th class="text-right">Running Balance</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${summary.records.map(r => `
            <tr>
              <td><strong>${r.month || r.date}</strong></td>
              <td>${Utils.formatCurrency(r.basicSalary)}</td>
              <td class="text-right text-blue">${Utils.formatCurrency(r.employeeShare || 0)}</td>
              <td class="text-right" style="color:#7c3aed">${Utils.formatCurrency(r.employerShare || 0)}</td>
              <td class="text-right font-bold ${r.type === 'withdrawal' ? 'text-red' : 'text-green'}">
                ${r.type === 'withdrawal' ? '-' : '+'}${Utils.formatCurrency(Math.abs(r.totalMonthly || 0))}
              </td>
              <td class="text-right font-bold text-green">${Utils.formatCurrency(r.runningBalance)}</td>
              <td>${r.notes || r.type}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-banner">
        <div>
          <div style="font-weight:700;color:#166534">Net Available Provident Fund Balance</div>
          <div style="font-size:12px;color:#15803d">Vested status: 100% Eligible for settlement or advances</div>
        </div>
        <div class="total-banner-val">${Utils.formatCurrency(summary.totalBalance)}</div>
      </div>

      <div class="sig-section">
        <div class="sig-box">Prepared By (HR & Payroll)</div>
        <div class="sig-box">Verified By (Trustee / Finance)</div>
        <div class="sig-box">Employee Signature / Acknowledgment</div>
      </div>

      <div class="footer-note">
        This document is an official financial statement issued by the HRM Pro Provident Fund Trust. For inquiries, contact HR Payroll Division.
      </div>
    `;

    this.printDocument(`PF Statement — ${emp.fullName}`, html);
  },

  printPFReport() {
    const summary = this.getCompanyPFSummary();
    const pfSettings = this.getPFSettings();
    const emps = DB.get('employees').filter(e => e.status === 'active');

    const html = `
      <div class="doc-header">
        <div>
          <div class="brand-title">HRM Pro — Provident Fund Trust</div>
          <div class="brand-sub">Comprehensive Company Provident Fund Audit Report</div>
        </div>
        <div class="doc-type">
          <div class="doc-type-title">PF AUDIT REPORT</div>
          <div class="doc-date">Generated: ${Utils.formatDate(Utils.today())}</div>
        </div>
      </div>

      <div class="stat-pills">
        <div class="stat-pill">
          <div class="stat-pill-label">Total Employee Contributions</div>
          <div class="stat-pill-val text-blue">${Utils.formatCurrency(summary.totalEmployee)}</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-label">Total Company Match</div>
          <div class="stat-pill-val" style="color:#7c3aed">${Utils.formatCurrency(summary.totalEmployer)}</div>
        </div>
        <div class="stat-pill" style="background:#ecfdf5;border-color:#a7f3d0">
          <div class="stat-pill-label" style="color:#065f46">Total Provident Fund Pool</div>
          <div class="stat-pill-val text-green">${Utils.formatCurrency(summary.totalPool)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Emp No</th>
            <th>Department</th>
            <th>Join Date</th>
            <th class="text-right">Base Salary</th>
            <th class="text-right">Employee Contributed</th>
            <th class="text-right">Employer Match</th>
            <th class="text-right">Total PF Balance</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${emps.map(emp => {
            const s = this.getEmployeePFSummary(emp.id);
            return `
              <tr>
                <td><strong>${emp.fullName}</strong></td>
                <td>${emp.empNo}</td>
                <td>${Utils.getDeptName(emp.departmentId)}</td>
                <td>${Utils.formatDate(emp.joiningDate)}</td>
                <td class="text-right">${Utils.formatCurrency(emp.salary)}</td>
                <td class="text-right text-blue">${Utils.formatCurrency(s.totalEmployee)}</td>
                <td class="text-right" style="color:#7c3aed">${Utils.formatCurrency(s.totalEmployer)}</td>
                <td class="text-right font-bold text-green">${Utils.formatCurrency(s.totalBalance)}</td>
                <td class="text-center"><span class="text-green font-bold">Active</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="total-banner">
        <div>
          <div style="font-weight:700;color:#166534">Total Provident Fund Asset Pool</div>
          <div style="font-size:12px;color:#15803d">Enrolled Members: ${summary.activeMembers} of ${summary.totalEmployees} Active Employees • Policy: ${pfSettings.employeeRate}% Emp / ${pfSettings.employerRate}% Match</div>
        </div>
        <div class="total-banner-val">${Utils.formatCurrency(summary.totalPool)}</div>
      </div>

      <div class="sig-section">
        <div class="sig-box">Head of Human Resources</div>
        <div class="sig-box">Chief Financial Officer / Trustee</div>
        <div class="sig-box">Internal Auditor</div>
      </div>
    `;

    this.printDocument('Provident Fund Audit Report', html);
  },

  exportSlipsCSV() {
    const salaries = DB.get('salary').filter(s => s.month === this.currentMonth);
    const emps = DB.get('employees');
    const pfSettings = this.getPFSettings();

    const headers = ['Employee Name','Employee ID','Department','Designation','Month','Basic Salary','Allowances','Other Deductions','Employee PF','Income Tax','Overtime','Bonus','Net Salary','Status','Payment Date'];
    const rows = salaries.map(s => {
      const emp = emps.find(e => e.id === s.employeeId);
      const pfEmp = s.pfEmployee !== undefined ? s.pfEmployee : Math.round(s.basic * (pfSettings.employeeRate / 100));
      const otherDed = Math.max(0, (s.deductions || 0) - pfEmp);
      return [
        `"${emp?.fullName || ''}"`,
        emp?.empNo || '',
        `"${Utils.getDeptName(emp?.departmentId)}"`,
        `"${Utils.getDesigName(emp?.designationId)}"`,
        s.month,
        s.basic,
        s.allowances,
        otherDed,
        pfEmp,
        s.tax,
        s.overtime || 0,
        s.bonus || 0,
        s.netSalary,
        s.status,
        s.paidOn || ''
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `payslips_${this.currentMonth}.csv`);
    Toast.show('Payslips CSV exported!', 'success', `${rows.length} salary records`);
  },

  exportEmpSlipsCSV(empId) {
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const salaries = DB.get('salary').filter(s => s.employeeId === emp.id).sort((a,b) => b.month.localeCompare(a.month));
    const pfSettings = this.getPFSettings();

    const headers = ['Month','Basic Salary','Allowances','Other Deductions','Employee PF (5%)','Employer Match (5%)','Income Tax','Overtime','Bonus','Net Salary','Status','Paid On'];
    const rows = salaries.map(s => {
      const pfEmp = s.pfEmployee !== undefined ? s.pfEmployee : Math.round(s.basic * (pfSettings.employeeRate / 100));
      const pfEmpr = s.pfEmployer !== undefined ? s.pfEmployer : Math.round(s.basic * (pfSettings.employerRate / 100));
      const otherDed = Math.max(0, (s.deductions || 0) - pfEmp);
      return [
        s.month,
        s.basic,
        s.allowances,
        otherDed,
        pfEmp,
        pfEmpr,
        s.tax,
        s.overtime || 0,
        s.bonus || 0,
        s.netSalary,
        s.status,
        s.paidOn || ''
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `payslips_${emp.empNo}.csv`);
    Toast.show('Payslips history exported!', 'success', `${rows.length} records for ${emp.fullName}`);
  },

  exportSingleSlipCSV(empId, month) {
    if (!['superadmin', 'hr_manager'].includes(Auth.role)) {
      Toast.show('Downloading payslips is reserved for HR & Admin', 'warning');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    const s = DB.get('salary').find(x => x.employeeId === Number(empId) && x.month === month);
    if (!emp || !s) { Toast.show('Salary record not found', 'error'); return; }

    const pfSettings = this.getPFSettings();
    const pfSummary = this.getEmployeePFSummary(emp.id);
    const pfEmp = s.pfEmployee !== undefined ? s.pfEmployee : Math.round(s.basic * (pfSettings.employeeRate / 100));
    const pfEmpr = s.pfEmployer !== undefined ? s.pfEmployer : Math.round(s.basic * (pfSettings.employerRate / 100));
    const otherDed = Math.max(0, (s.deductions || 0) - pfEmp);

    const rows = [
      ['FIELD', 'VALUE'],
      ['Employee Name', `"${emp.fullName}"`],
      ['Employee ID', emp.empNo],
      ['Department', `"${Utils.getDeptName(emp.departmentId)}"`],
      ['Designation', `"${Utils.getDesigName(emp.designationId)}"`],
      ['Salary Month', month],
      ['Basic Salary', s.basic],
      ['Allowances', s.allowances],
      ['Overtime Pay', s.overtime || 0],
      ['Bonus / Incentive', s.bonus || 0],
      ['Gross Earnings', s.basic + s.allowances + (s.overtime||0) + (s.bonus||0)],
      ['Provident Fund (Employee 5%)', pfEmp],
      ['Income Tax', s.tax],
      ['Other Deductions', otherDed],
      ['Total Deductions', pfEmp + otherDed + s.tax],
      ['Employer PF Match (5%)', pfEmpr],
      ['Accumulated PF Balance', pfSummary.totalBalance],
      ['Net Salary', s.netSalary],
      ['Status', s.status],
      ['Paid On', s.paidOn || '']
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    Utils.downloadCSV(csv, `payslip_${emp.empNo}_${month}.csv`);
    Toast.show('Payslip CSV downloaded!', 'success');
  },

  exportPFCSV() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const headers = ['Employee Name','Employee ID','Department','Designation','Joining Date','Base Salary','Total Employee Contributed','Total Employer Match','Accumulated PF Balance','Status'];
    const rows = emps.map(emp => {
      const s = this.getEmployeePFSummary(emp.id);
      return [
        `"${emp.fullName}"`,
        emp.empNo,
        `"${Utils.getDeptName(emp.departmentId)}"`,
        `"${Utils.getDesigName(emp.designationId)}"`,
        emp.joiningDate,
        emp.salary || 0,
        s.totalEmployee,
        s.totalEmployer,
        s.totalBalance,
        'Active'
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `provident_fund_ledger_${Utils.today()}.csv`);
    Toast.show('PF ledger exported to CSV!', 'success', `${rows.length} employee accounts`);
  },

  exportEmpPFCSV(empId) {
    if (!['superadmin', 'hr_manager'].includes(Auth.role)) {
      Toast.show('Downloading Provident Fund statements is reserved for HR & Admin', 'warning');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const summary = this.getEmployeePFSummary(emp.id);

    const headers = ['Month/Date','Basic Salary','Employee Share (5%)','Employer Match (5%)','Monthly Total','Running Cumulative Balance','Type','Remarks'];
    const rows = summary.records.map(r => [
      r.month || r.date,
      r.basicSalary,
      r.employeeShare || 0,
      r.employerShare || 0,
      r.type === 'withdrawal' ? -(r.amount || r.totalMonthly || 0) : (r.totalMonthly || 0),
      r.runningBalance,
      r.type,
      `"${r.notes || ''}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `pf_statement_${emp.empNo}.csv`);
    Toast.show('PF statement exported to CSV!', 'success', `${emp.fullName}`);
  },

  // ============================================================
  // BATCH 2: 1-Click Attendance -> Payroll Direct Bridge
  // ============================================================
  syncAttendanceToPayroll(month = this.currentMonth) {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const attAll = DB.get('attendance') || [];
    const attMonth = attAll.filter(a => a.date && a.date.startsWith(month));
    const leavesAll = DB.get('leave_requests') || [];
    const leavesMonth = leavesAll.filter(l => (l.from?.startsWith(month) || l.to?.startsWith(month)) && l.status === 'approved');

    let salaries = DB.get('salary') || [];
    let updatedCount = 0;
    let totalLOPDeductions = 0;
    let totalLatePenalties = 0;
    let totalOTPay = 0;
    let totalOTHours = 0;

    emps.forEach(emp => {
      const empAtt = attMonth.filter(a => a.employeeId === emp.id);
      const absentDays = empAtt.filter(a => a.status === 'absent').length;
      const lateDays = empAtt.filter(a => a.status === 'late' || (a.timeIn && a.timeIn > '11:00')).length;
      const otHours = empAtt.reduce((sum, a) => sum + (Number(a.overtime) || 0), 0);
      
      const empLeaves = leavesMonth.filter(l => l.employeeId === emp.id);
      const unpaidLeaveDays = empLeaves.filter(l => l.salaryDeduction || l.typeId === 6).reduce((sum, l) => sum + (l.days || 1), 0);

      const baseSalary = Number(emp.salary || 60000);
      const lopAmount = Math.round((baseSalary / 30) * absentDays);
      const latePenaltyAmount = Math.round((baseSalary / 60) * lateDays);
      const unpaidLeaveAmount = Math.round((baseSalary / 30) * unpaidLeaveDays);
      // Overtime is NON-CASH compensatory time (banked as Leave Overtime Tokens, not paid in salary)
      const otPay = 0;
      
      const allowanceAmount = Math.round(baseSalary * 0.25);
      const pfShare = Math.round(baseSalary * 0.05);
      const eobiEmp = 370;

      const totalDeductions = lopAmount + latePenaltyAmount + unpaidLeaveAmount + pfShare + eobiEmp;
      const grossTaxable = baseSalary + allowanceAmount + otPay;
      
      const fbrTax = DB.calculateFBRTax(grossTaxable).monthlyTax;
      const netSalary = Math.max(0, grossTaxable - totalDeductions - fbrTax);

      totalLOPDeductions += (lopAmount + unpaidLeaveAmount);
      totalLatePenalties += latePenaltyAmount;
      totalOTHours += otHours;

      let rec = salaries.find(s => s.employeeId === emp.id && s.month === month);
      if (!rec) {
        rec = {
          id: DB.nextId('salary'),
          employeeId: emp.id,
          month,
          basic: baseSalary,
          allowances: allowanceAmount,
          deductions: totalDeductions,
          overtime: otPay,
          bonus: 0,
          tax: fbrTax,
          netSalary,
          status: 'pending',
          paidOn: null,
          syncedDetails: { absentDays, lopAmount, lateDays, latePenaltyAmount, unpaidLeaveDays, otHours, otPay, pfShare, eobiEmp, syncedAt: new Date().toISOString() }
        };
        salaries.push(rec);
      } else {
        rec.basic = baseSalary;
        rec.allowances = allowanceAmount;
        rec.deductions = totalDeductions;
        rec.overtime = otPay;
        rec.tax = fbrTax;
        rec.netSalary = netSalary;
        rec.syncedDetails = { absentDays, lopAmount, lateDays, latePenaltyAmount, unpaidLeaveDays, otHours, otPay, pfShare, eobiEmp, syncedAt: new Date().toISOString() };
      }
      updatedCount++;
    });

    DB.set('salary', salaries);

    DB.add('audit_logs', {
      id: DB.nextId('audit_logs'),
      action: 'PROCESS',
      module: 'Payroll',
      details: `1-Click Attendance Bridge executed for ${month}. Synced ${updatedCount} employees with LOP/Late deductions and FBR tax.`,
      userId: (typeof Auth !== 'undefined' && Auth.user?.id) || 1,
      timestamp: new Date().toISOString()
    });

    Modal.show('⚡ Biometric Attendance & Payroll Sync Completed', `
      <div style="padding:10px 0">
        <div style="display:flex;align-items:center;gap:14px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:16px;margin-bottom:18px">
          <div style="width:44px;height:44px;border-radius:10px;background:#10b98122;display:flex;align-items:center;justify-content:center;color:var(--success);font-size:22px">
            <i class="fa fa-circle-check"></i>
          </div>
          <div>
            <div style="font-weight:800;font-size:15px;color:var(--success)">Direct Attendance &rarr; Payroll Bridge Executed!</div>
            <div style="font-size:12.5px;color:var(--text-2);margin-top:2px">
              Scanned all biometric punch logs, late check-in penalties, approved overtime, and approved unexcused leaves for <strong>${month}</strong>.
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Employees Synced</div>
            <div style="font-size:20px;font-weight:800;color:var(--primary)">${updatedCount} Active</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Total Deductions (LOP & Late)</div>
            <div style="font-size:20px;font-weight:800;color:var(--danger)">${Utils.formatCurrency(totalLOPDeductions + totalLatePenalties)}</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Overtime Banked as Tokens</div>
            <div style="font-size:20px;font-weight:800;color:#8b5cf6">${totalOTHours} hrs (Non-Cash)</div>
          </div>
        </div>

        <div style="background:var(--surface-2);border-radius:8px;padding:12px 16px;font-size:12px;color:var(--text-2);line-height:1.6">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px"><i class="fa fa-info-circle" style="color:var(--primary);margin-right:6px"></i>Automatic Tax & Statutory Compliance:</div>
          <div>&bull; <strong>Overtime Tokens:</strong> Overtime is non-cash compensatory time banked in Leave Tokens (PKR 0 cash salary payout).</div>
          <div>&bull; <strong>Progressive FBR Income Tax:</strong> Recalculated for each employee per Finance Act 2024&ndash;2026 progressive slabs.</div>
          <div>&bull; <strong>PF & EOBI Withholding:</strong> 5% Employee Provident Fund & PKR 370 EOBI automatically applied.</div>
          <div>&bull; <strong>Cutoff Rules:</strong> Any check-in past 11:00 AM window cutoff has been flagged and assessed.</div>
        </div>
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal'); Payroll.renderView();"><i class="fa fa-check"></i> View Updated Payroll Register</button>`
    });

    this.renderView();
  },

  // ============================================================
  // BATCH 2: Pakistani FBR Income Tax Engine (Finance Act 2024-2026)
  // ============================================================
  renderTaxEngine(container) {
    const isEmp = !['superadmin', 'hr_manager'].includes(Auth.role);
    const config = DB.get('tax_config') || { slabs: [] };
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const myEmp = isEmp ? emps.find(e => e.id === Auth.employee?.id) : null;
    const targetEmps = isEmp && myEmp ? [myEmp] : emps;

    const totalAnnualPayroll = targetEmps.reduce((sum, e) => sum + (e.salary || 0) * 12, 0);
    const totalAnnualTax = targetEmps.reduce((sum, e) => {
      const calc = DB.calculateFBRTax((e.salary || 0) * 1.25);
      return sum + calc.annualTax;
    }, 0);
    const totalMonthlyTax = Math.round(totalAnnualTax / 12);

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:19px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(99,102,241,0.12);color:var(--primary)">
              <i class="fa fa-scale-balanced"></i>
            </span>
            Pakistan FBR Income Tax Engine (Finance Act 2026&ndash;2027)
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Salaried Individuals Tax Year 2026&ndash;2027 progressive slab calculator &amp; Section 149 certificates
          </div>
        </div>

        <div style="display:flex;gap:10px">
          ${!isEmp ? `
            <button class="btn btn-secondary btn-sm" onclick="Payroll.exportTaxLedgerCSV()">
              <i class="fa fa-file-export"></i> Export FBR Statement (CSV)
            </button>
          ` : ''}
          <button class="btn btn-primary btn-sm" onclick="Payroll.showSection149Cert(${isEmp ? (Auth.employee?.id || 1) : targetEmps[0]?.id})">
            <i class="fa fa-file-invoice"></i> Section 149 Certificate
          </button>
        </div>
      </div>

      <!-- KPI Overview Cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Annual Taxable Income Base</div>
          <div style="font-size:20px;font-weight:800;color:var(--text);margin-top:6px">${Utils.formatCurrency(totalAnnualPayroll)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${targetEmps.length} salaried personnel</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Projected Annual Tax Withheld</div>
          <div style="font-size:20px;font-weight:800;color:var(--danger);margin-top:6px">${Utils.formatCurrency(totalAnnualTax)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Payable to Federal Treasury</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Monthly Tax Withholding</div>
          <div style="font-size:20px;font-weight:800;color:var(--warning);margin-top:6px">${Utils.formatCurrency(totalMonthlyTax)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Deducted at source per month</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Active Tax Law</div>
          <div style="font-size:16px;font-weight:800;color:var(--success);margin-top:6px">Finance Act 2026–27</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Slabs 1 to 8 Progressive Schedule</div>
        </div>
      </div>

      <!-- FBR Tax Slabs Visual Guide & Live Simulator -->
      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px;margin-bottom:24px">
        <!-- Progressive Slabs Info Grid -->
        <div class="card" style="padding:18px">
          <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px">
            <i class="fa fa-layer-group" style="color:var(--primary)"></i> Progressive Slabs for Salaried Individuals (Tax Year 2026&ndash;2027)
          </div>
          <div style="display:grid;gap:7px">
            <div style="display:flex;justify-content:space-between;padding:7px 12px;background:rgba(16,185,129,0.08);border-left:4px solid var(--success);border-radius:6px;font-size:12px">
              <div><strong>Slab 1: Up to PKR 600,000 / annum</strong> (Up to PKR 50,000/mo)</div>
              <div style="font-weight:800;color:var(--success)">0% (Tax-Free)</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:7px 12px;background:rgba(59,130,246,0.08);border-left:4px solid var(--primary);border-radius:6px;font-size:12px">
              <div><strong>Slab 2: PKR 600,001 – 1,200,000</strong> (50K – 100K/mo)</div>
              <div style="font-weight:700;color:var(--primary)">1% of amount > 600K</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:7px 12px;background:rgba(245,158,11,0.08);border-left:4px solid var(--warning);border-radius:6px;font-size:12px">
              <div><strong>Slab 3: PKR 1,200,001 – 2,200,000</strong> (100K – 183.3K/mo)</div>
              <div style="font-weight:700;color:var(--warning)">PKR 6,000 + 11% of amount > 1.2M</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:7px 12px;background:rgba(236,72,153,0.08);border-left:4px solid #ec4899;border-radius:6px;font-size:12px">
              <div><strong>Slab 4: PKR 2,200,001 – 3,200,000</strong> (183.3K – 266.6K/mo)</div>
              <div style="font-weight:700;color:#ec4899">PKR 116,000 + 20% of amount > 2.2M</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:7px 12px;background:rgba(139,92,246,0.08);border-left:4px solid #8b5cf6;border-radius:6px;font-size:12px">
              <div><strong>Slab 5: PKR 3,200,001 – 4,100,000</strong> (266.6K – 341.6K/mo)</div>
              <div style="font-weight:700;color:#8b5cf6">PKR 316,000 + 25% of amount > 3.2M</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:7px 12px;background:rgba(14,165,233,0.08);border-left:4px solid #0ea5e9;border-radius:6px;font-size:12px">
              <div><strong>Slab 6: PKR 4,100,001 – 5,600,000</strong> (341.6K – 466.6K/mo)</div>
              <div style="font-weight:700;color:#0ea5e9">PKR 541,000 + 29% of amount > 4.1M</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:7px 12px;background:rgba(249,115,22,0.08);border-left:4px solid #f97316;border-radius:6px;font-size:12px">
              <div><strong>Slab 7: PKR 5,600,001 – 7,000,000</strong> (466.6K – 583.3K/mo)</div>
              <div style="font-weight:700;color:#f97316">PKR 976,000 + 32% of amount > 5.6M</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:7px 12px;background:rgba(239,68,68,0.08);border-left:4px solid var(--danger);border-radius:6px;font-size:12px">
              <div><strong>Slab 8: Exceeding PKR 7,000,000</strong> (> 583.3K/mo)</div>
              <div style="font-weight:800;color:var(--danger)">PKR 1,424,000 + 35% of amount > 7.0M</div>
            </div>
          </div>
        </div>

        <!-- Interactive Real-time Calculator -->
        <div class="card" style="padding:18px;background:linear-gradient(135deg,var(--card),var(--surface-2))">
          <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px">
            <i class="fa fa-calculator" style="color:var(--warning)"></i> Real-time FBR Tax Simulator
          </div>
          <div class="form-group" style="margin-bottom:14px">
            <label class="form-label" style="font-size:12px">Enter Monthly Gross Salary (PKR)</label>
            <div style="position:relative">
              <input type="number" id="tax-sim-input" class="form-control" value="${isEmp ? (Auth.employee?.salary || 85000) : 150000}" oninput="Payroll.simulateTax(this.value)" placeholder="e.g. 150000" style="padding-left:40px;font-weight:700;font-size:15px">
              <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:12px;font-weight:700">PKR</span>
            </div>
          </div>

          <div id="tax-sim-result" style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px">
            <!-- Simulated values populated by Payroll.simulateTax() -->
          </div>
        </div>
      </div>

      <!-- Employee Tax Schedule Table -->
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-table" style="color:var(--primary);margin-right:6px"></i> Salaried Employee Tax Withholding Register
          </div>
          <div style="font-size:12px;color:var(--text-3)">Showing ${targetEmps.length} active employee records</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>NTN / Filer</th>
                <th>Monthly Base</th>
                <th>Annual Projected</th>
                <th>Applicable Slab</th>
                <th>Annual Tax</th>
                <th>Monthly Withholding</th>
                <th>Effective Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${targetEmps.map(emp => {
                const base = Number(emp.salary || 60000);
                const gross = Math.round(base * 1.25);
                const tax = DB.calculateFBRTax(gross);
                const ntn = emp.taxInfo?.ntn || `${4000000 + emp.id * 137}-7`;
                const filer = emp.taxInfo?.filerStatus || 'Active Tax Filer';

                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                        <div>
                          <div style="font-weight:600;font-size:13px">${emp.fullName}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp.empNo} &bull; ${Utils.getDesigName(emp.designationId)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-size:12px;font-family:monospace;font-weight:700">${ntn}</div>
                      <span class="badge badge-success" style="font-size:10px">${filer}</span>
                    </td>
                    <td style="font-weight:600">${Utils.formatCurrency(base)}</td>
                    <td style="font-weight:600;color:var(--text-2)">${Utils.formatCurrency(tax.annualIncome)}</td>
                    <td>
                      <span class="badge ${tax.slabId === 1 ? 'badge-secondary' : tax.slabId <= 3 ? 'badge-info' : 'badge-warning'}" style="font-size:11px">
                        Slab ${tax.slabId}
                      </span>
                    </td>
                    <td style="font-weight:700;color:var(--danger)">${Utils.formatCurrency(tax.annualTax)}</td>
                    <td style="font-weight:800;color:var(--danger);font-size:13.5px">${Utils.formatCurrency(tax.monthlyTax)}</td>
                    <td><span class="chip" style="font-weight:700">${tax.effectiveRate}%</span></td>
                    <td>
                      <button class="btn btn-ghost btn-sm" onclick="Payroll.showSection149Cert(${emp.id})" title="Generate Official FBR Section 149 Certificate">
                        <i class="fa fa-file-contract" style="color:var(--primary)"></i> Sec 149
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const initialSimVal = isEmp ? (Auth.employee?.salary || 85000) : 150000;
    this.simulateTax(initialSimVal);
  },

  simulateTax(monthlySalary) {
    const res = document.getElementById('tax-sim-result');
    if (!res) return;
    const gross = Number(monthlySalary) || 0;
    const tax = DB.calculateFBRTax(gross);
    const netMonthly = Math.max(0, gross - tax.monthlyTax);

    res.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">
        <span style="color:var(--text-3)">Annual Gross:</span>
        <strong>${Utils.formatCurrency(tax.annualIncome)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">
        <span style="color:var(--text-3)">Applicable Slab:</span>
        <span class="badge ${tax.slabId===1?'badge-secondary':'badge-primary'}">${tax.slabDesc}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">
        <span style="color:var(--text-3)">Annual Projected Tax:</span>
        <strong style="color:var(--danger)">${Utils.formatCurrency(tax.annualTax)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">
        <span style="color:var(--text-3)">Effective Tax Rate:</span>
        <strong style="color:var(--warning)">${tax.effectiveRate}%</strong>
      </div>
      <div style="border-top:1px dashed var(--border);padding-top:10px;margin-top:10px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:11px;color:var(--text-3)">Monthly Tax Deduction:</div>
          <div style="font-size:17px;font-weight:800;color:var(--danger)">${Utils.formatCurrency(tax.monthlyTax)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-3)">Net Monthly Take-Home:</div>
          <div style="font-size:17px;font-weight:800;color:var(--success)">${Utils.formatCurrency(netMonthly)}</div>
        </div>
      </div>
    `;
  },

  showSection149Cert(employeeId) {
    const emp = DB.find('employees', Number(employeeId)) || DB.get('employees')[0];
    if (!emp) return;

    const base = Number(emp.salary || 60000);
    const grossMonthly = Math.round(base * 1.25);
    const tax = DB.calculateFBRTax(grossMonthly);
    const exemptMedical = Math.round(base * 0.10 * 12); // Medical allowance exemption up to 10% of basic under clause 139
    const taxableIncome = Math.max(0, tax.annualIncome - exemptMedical);
    const ntn = emp.taxInfo?.ntn || `${4000000 + emp.id * 137}-7`;
    const cnic = emp.cnic || '42201-1234567-1';

    Modal.show('Official FBR Section 149 Withholding Tax Certificate', `
      <div id="fbr-cert-print-area" style="background:white;color:#111827;padding:36px 44px;border-radius:10px;border:2px solid #e2e8f0;font-family:'Segoe UI',Roboto,Helvetica,sans-serif;max-width:760px;margin:0 auto;box-shadow:0 10px 25px rgba(0,0,0,0.05)">
        <!-- Official Government Header -->
        <div style="text-align:center;border-bottom:2.5px solid #0f172a;padding-bottom:16px;margin-bottom:20px">
          <div style="font-size:13px;font-weight:800;letter-spacing:1.5px;color:#1e3a8a;text-transform:uppercase">Government of Pakistan &bull; Federal Board of Revenue</div>
          <div style="font-size:17px;font-weight:900;color:#0f172a;margin-top:4px;letter-spacing:0.5px">CERTIFICATE OF COLLECTION OR DEDUCTION OF INCOME TAX</div>
          <div style="font-size:12px;font-weight:600;color:#475569;margin-top:3px">[ Under Section 149 of the Income Tax Ordinance, 2001 &amp; Rule 42 ]</div>
          <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#64748b;margin-top:14px;border-top:1px solid #cbd5e1;padding-top:8px">
            <span>Certificate Ref: <strong>FBR/SEC149/2026/${String(emp.id).padStart(4, '0')}</strong></span>
            <span>Tax Year: <strong>2026 (Period: July 1, 2025 to June 30, 2026)</strong></span>
          </div>
        </div>

        <!-- Withholding Agent (Employer) Particulars -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:18px;font-size:12px">
          <div>
            <div style="color:#64748b;font-size:10.5px;text-transform:uppercase;font-weight:700">Withholding Agent (Employer)</div>
            <div style="font-weight:800;color:#0f172a;font-size:13px;margin-top:2px">HRM Enterprise Solutions (Pvt) Ltd</div>
            <div style="color:#475569">Head Office, Executive Tower, Islamabad</div>
          </div>
          <div style="text-align:right">
            <div style="color:#64748b;font-size:10.5px;text-transform:uppercase;font-weight:700">Employer Tax Credentials</div>
            <div style="font-weight:700;color:#0f172a;font-size:12px;margin-top:2px">NTN: <strong>4120984-7</strong></div>
            <div style="color:#475569;font-size:11px">FBR RTO: Regional Tax Office Islamabad</div>
          </div>
        </div>

        <!-- Employee Particulars -->
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:12px">
          <div style="font-size:11px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;border-bottom:1px solid #f1f5f9;padding-bottom:4px">Particulars of the Salaried Individual / Taxpayer</div>
          <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px">
            <div>Taxpayer Full Name: <strong style="color:#0f172a">${emp.fullName}</strong></div>
            <div>Computerized NIC: <strong style="color:#0f172a;font-family:monospace">${cnic}</strong></div>
            <div>Official Designation: <strong style="color:#0f172a">${Utils.getDesigName(emp.designationId)}</strong></div>
            <div>Taxpayer NTN: <strong style="color:#0f172a;font-family:monospace">${ntn}</strong></div>
            <div>Department &amp; Branch: <strong style="color:#0f172a">${Utils.getDeptName(emp.departmentId)} (${Utils.getBranchName(emp.branchId)})</strong></div>
            <div>Filer Status: <span style="background:#dcfce7;color:#15803d;padding:2px 6px;border-radius:4px;font-weight:700;font-size:10.5px">Active Taxpayer List (ATL)</span></div>
          </div>
        </div>

        <!-- Certified Computation Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px">
          <thead>
            <tr style="background:#f1f5f9;border-top:1.5px solid #0f172a;border-bottom:1.5px solid #0f172a">
              <th style="padding:8px 10px;text-align:left;color:#0f172a;font-weight:800">S#</th>
              <th style="padding:8px 10px;text-align:left;color:#0f172a;font-weight:800">Particulars of Salary &amp; Emoluments</th>
              <th style="padding:8px 10px;text-align:right;color:#0f172a;font-weight:800">Amount in PKR</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:7px 10px">1.</td>
              <td style="padding:7px 10px">Gross Salary, Wages &amp; Cash Allowances Paid</td>
              <td style="padding:7px 10px;text-align:right;font-weight:700">${tax.annualIncome.toLocaleString('en-PK')}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;color:#64748b">
              <td style="padding:7px 10px">2.</td>
              <td style="padding:7px 10px">Less: Medical Allowance Exemption (Clause 139, Part-I, Second Schedule)</td>
              <td style="padding:7px 10px;text-align:right">(${exemptMedical.toLocaleString('en-PK')})</td>
            </tr>
            <tr style="border-bottom:1.5px solid #0f172a;background:#fafafa">
              <td style="padding:7px 10px;font-weight:800">3.</td>
              <td style="padding:7px 10px;font-weight:800;color:#0f172a">Net Taxable Income for Assessment</td>
              <td style="padding:7px 10px;text-align:right;font-weight:800;color:#0f172a">${taxableIncome.toLocaleString('en-PK')}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;background:#fef2f2">
              <td style="padding:8px 10px;font-weight:800;color:#991b1b">4.</td>
              <td style="padding:8px 10px;font-weight:800;color:#991b1b">TOTAL INCOME TAX DEDUCTED &amp; DEPOSITED UNDER SECTION 149</td>
              <td style="padding:8px 10px;text-align:right;font-weight:900;color:#991b1b;font-size:13.5px">PKR ${tax.annualTax.toLocaleString('en-PK')}</td>
            </tr>
          </tbody>
        </table>

        <!-- FBR CPR Deposit Verification -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;margin-bottom:28px;font-size:11.5px;color:#166534">
          <div style="font-weight:800;margin-bottom:2px"><i class="fa fa-shield-check" style="margin-right:6px"></i>Treasury Deposit Verification Notice:</div>
          <div>The tax deducted above has been regularly deposited through Computerized Payment Receipts (CPRs) in the National Bank of Pakistan (NBP) Main Branch to the credit of Federal Government Treasury under Head of Account <strong>B01101 (Taxes on Income / Salary)</strong>.</div>
        </div>

        <!-- Signatures & Verification Seal -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:14px;border-top:1px solid #cbd5e1">
          <div style="text-align:center">
            <div style="font-size:18px;color:#2563eb;font-family:'Brush Script MT',cursive;margin-bottom:4px">Ahmed Khan</div>
            <div style="font-weight:800;font-size:11.5px;color:#0f172a">Ahmed Khan</div>
            <div style="font-size:10.5px;color:#64748b">Chief Executive Officer / Super Admin</div>
          </div>

          <div style="width:110px;height:110px;border:2px dashed #94a3b8;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#64748b;font-size:9.5px;text-align:center;padding:6px">
            <i class="fa fa-stamp" style="font-size:18px;color:#3b82f6;margin-bottom:3px"></i>
            <strong>FBR TAX AGENT</strong>
            <span>OFFICIAL SEAL</span>
          </div>

          <div style="text-align:center">
            <div style="font-size:18px;color:#059669;font-family:'Brush Script MT',cursive;margin-bottom:4px">Sara Malik</div>
            <div style="font-weight:800;font-size:11.5px;color:#0f172a">Sara Malik</div>
            <div style="font-size:10.5px;color:#64748b">Head of HR &amp; Withholding Officer</div>
          </div>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Payroll.printSection149Cert(${emp.id})">
          <i class="fa fa-print"></i> Print Official Section 149 Certificate
        </button>
      `
    });
  },

  printSection149Cert(employeeId) {
    const area = document.getElementById('fbr-cert-print-area');
    if (!area) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>FBR_Section149_Certificate</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <style>
            body { margin:0; padding:20px; font-family:'Segoe UI',Roboto,Helvetica,sans-serif; background:#fff; color:#000; }
            @page { size: A4; margin: 15mm; }
          </style>
        </head>
        <body>
          ${area.outerHTML}
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    w.document.close();
  },

  exportTaxLedgerCSV() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const headers = ['Employee ID','Full Name','CNIC','NTN','Filer Status','Monthly Base (PKR)','Annual Projected Gross (PKR)','Applicable Slab','Annual Tax (PKR)','Monthly Withholding (PKR)','Effective Rate (%)'];
    const rows = emps.map(emp => {
      const base = Number(emp.salary || 60000);
      const gross = Math.round(base * 1.25);
      const tax = DB.calculateFBRTax(gross);
      const ntn = emp.taxInfo?.ntn || `${4000000 + emp.id * 137}-7`;
      const filer = emp.taxInfo?.filerStatus || 'Active Tax Filer';

      return [
        emp.empNo,
        `"${emp.fullName}"`,
        emp.cnic || '—',
        ntn,
        filer,
        base,
        tax.annualIncome,
        `"Slab ${tax.slabId}"`,
        tax.annualTax,
        tax.monthlyTax,
        tax.effectiveRate
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `fbr_withholding_tax_ledger_${Utils.today()}.csv`);
    Toast.show('FBR Tax statement exported to CSV!', 'success', `${rows.length} employee accounts`);
  },

  // ============================================================
  // BATCH 2: Corporate Bank Advice File Generator
  // ============================================================
  selectedBank: 'HBL',

  renderBankAdvice(container) {
    const salaries = DB.get('salary').filter(s => s.month === this.currentMonth);
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const banks = DB.get('banks') || [
      { id:1, name:'Habib Bank Limited', code:'HBL' },
      { id:2, name:'MCB Bank', code:'MCB' },
      { id:3, name:'United Bank Limited', code:'UBL' },
      { id:5, name:'Meezan Bank', code:'MEEZ' },
      { id:4, name:'Allied Bank', code:'ABL' }
    ];

    const totalEmployees = emps.length;
    const totalAmount = emps.reduce((sum, emp) => {
      const s = salaries.find(x => x.employeeId === emp.id);
      return sum + (s?.netSalary || Math.round(Number(emp.salary || 60000) * 0.9));
    }, 0);

    const corporateAccounts = {
      HBL: { accTitle: 'HRM ENTERPRISE PK (PVT) LTD - SALARY DISBURSEMENT', accNo: '00427901849103', iban: 'PK36HABB0000427901849103', branch: 'Corporate Center Clifton, Karachi' },
      MCB: { accTitle: 'HRM ENTERPRISE PK (PVT) LTD - PAYROLL OPERATION', accNo: '09812401928374', iban: 'PK36MUCB0000098124019283', branch: 'Main Branch Gulberg, Lahore' },
      UBL: { accTitle: 'HRM ENTERPRISE PK (PVT) LTD - DISBURSEMENT POOL', accNo: '11029384756102', iban: 'PK36UNIL0000110293847561', branch: 'Blue Area Branch, Islamabad' },
      MEEZ: { accTitle: 'HRM ENTERPRISE PK (PVT) LTD - ISLAMIC SALARY A/C', accNo: '01029485716253', iban: 'PK36MEZN0000010294857162', branch: 'PNSC Corporate Branch, Karachi' },
      ABL: { accTitle: 'HRM ENTERPRISE PK (PVT) LTD - OPERATIONS POOL', accNo: '55667788990011', iban: 'PK36ABPA0000556677889900', branch: 'Parliament Branch, Islamabad' }
    };

    const corp = corporateAccounts[this.selectedBank] || corporateAccounts['HBL'];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:19px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(16,185,129,0.12);color:var(--success)">
              <i class="fa fa-building-columns"></i>
            </span>
            Corporate Bank Advice File Generator &amp; Authority Letter
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Automated batch disbursement file exporter for HBL, MCB, UBL, Meezan, and Allied Bank
          </div>
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary btn-sm" onclick="Payroll.downloadBankAdviceCSV()">
            <i class="fa fa-download"></i> Download Batch File (${this.selectedBank})
          </button>
          <button class="btn btn-primary btn-sm" onclick="Payroll.printBankAuthorityLetter()">
            <i class="fa fa-print"></i> Corporate Authority Letter
          </button>
        </div>
      </div>

      <!-- Bank Selector & Corporate Disbursing Account Banner -->
      <div class="card" style="padding:18px;margin-bottom:20px;background:linear-gradient(135deg,var(--card),var(--surface))">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:50px;height:50px;border-radius:12px;background:var(--primary)18;display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:24px">
              <i class="fa fa-landmark"></i>
            </div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase">Disbursing Corporate Bank</div>
              <div style="font-size:16px;font-weight:800;color:var(--text);margin-top:2px">${corp.accTitle}</div>
              <div style="font-size:12px;color:var(--text-2);margin-top:2px">
                IBAN: <strong style="font-family:monospace;color:var(--primary)">${corp.iban}</strong> &bull; ${corp.branch}
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:10px">
            <label style="font-size:12px;font-weight:600;color:var(--text-2)">Switch Disbursing Bank:</label>
            <select class="form-control" style="width:160px;font-weight:700" onchange="Payroll.selectedBank=this.value;Payroll.renderView()">
              ${banks.map(b => `<option value="${b.code}" ${b.code===this.selectedBank?'selected':''}>${b.name} (${b.code})</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Payout Batch KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Total Payees</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:6px">${totalEmployees} Employees</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Month: ${this.currentMonth}</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Net Disbursement Volume</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:6px">${Utils.formatCurrency(totalAmount)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Ready for 1Link / IBFT clearing</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Value Date</div>
          <div style="font-size:18px;font-weight:800;color:var(--text);margin-top:6px">${Utils.today()}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Immediate settlement</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Clearing Mode</div>
          <div style="font-size:18px;font-weight:800;color:var(--info);margin-top:6px">Direct IBFT / 1Link</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Inter-bank funds transfer</div>
        </div>
      </div>

      <!-- Beneficiary Schedule Table -->
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-list-check" style="color:var(--success);margin-right:6px"></i> Beneficiary Payout Schedule &amp; IBAN Routing
          </div>
          <div style="font-size:12px;color:var(--text-3)">All beneficiary accounts verified for 1Link switch</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Sr#</th>
                <th>Employee / Beneficiary</th>
                <th>Beneficiary Bank</th>
                <th>Account Title</th>
                <th>IBAN / Account Number</th>
                <th>Net Payable</th>
                <th>Transfer Mode</th>
                <th>Verification Status</th>
              </tr>
            </thead>
            <tbody>
              ${emps.map((emp, idx) => {
                const s = salaries.find(x => x.employeeId === emp.id);
                const netPay = s?.netSalary || Math.round(Number(emp.salary || 60000) * 0.9);
                const bankName = emp.bankName || 'HBL';
                const isInternal = bankName.toUpperCase() === this.selectedBank.toUpperCase();
                const iban = emp.iban || `PK36${bankName.padEnd(4,'B').slice(0,4)}000000${String(emp.id).padStart(10,'0')}`;

                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>
                      <div style="font-weight:600;font-size:13px">${emp.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div>
                    </td>
                    <td>
                      <span class="badge ${isInternal ? 'badge-success' : 'badge-primary'}">${bankName}</span>
                    </td>
                    <td style="font-weight:600;font-size:12.5px">${emp.fullName}</td>
                    <td>
                      <div style="font-family:monospace;font-weight:700;font-size:12px">${iban}</div>
                      <div style="font-size:10.5px;color:var(--text-3)">A/C: ${emp.accountNo || '1122334455'}</div>
                    </td>
                    <td style="font-weight:800;color:var(--success);font-size:13.5px">${Utils.formatCurrency(netPay)}</td>
                    <td>
                      <span class="chip" style="font-size:11px">${isInternal ? 'Internal Book Transfer' : '1Link IBFT'}</span>
                    </td>
                    <td>
                      <span class="badge badge-success"><i class="fa fa-circle-check"></i> Account Verified</span>
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

  downloadBankAdviceCSV() {
    const salaries = DB.get('salary').filter(s => s.month === this.currentMonth);
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const bankCode = this.selectedBank;
    const valueDate = Utils.today();

    const corporateAccounts = {
      HBL: 'PK36HABB0000427901849103',
      MCB: 'PK36MUCB0000098124019283',
      UBL: 'PK36UNIL0000110293847561',
      MEEZ: 'PK36MEZN0000010294857162',
      ABL: 'PK36ABPA0000556677889900'
    };
    const debitAccount = corporateAccounts[bankCode] || 'PK36HABB0000427901849103';

    // Standard official corporate bulk payout structure
    const headers = ['Value Date','Debit Account IBAN','Beneficiary Name','Beneficiary Bank','Beneficiary Account / IBAN','Amount (PKR)','Payment Reference','Payment Type'];
    const rows = emps.map(emp => {
      const s = salaries.find(x => x.employeeId === emp.id);
      const netPay = s?.netSalary || Math.round(Number(emp.salary || 60000) * 0.9);
      const bankName = emp.bankName || 'HBL';
      const iban = emp.iban || `PK36${bankName.padEnd(4,'B').slice(0,4)}000000${String(emp.id).padStart(10,'0')}`;
      const isInternal = bankName.toUpperCase() === bankCode.toUpperCase();

      return [
        valueDate,
        debitAccount,
        `"${emp.fullName}"`,
        bankName,
        iban,
        netPay,
        `"SALARY-${this.currentMonth}-${emp.empNo}"`,
        isInternal ? 'IFT' : 'IBFT'
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `bank_advice_${bankCode}_${this.currentMonth}.csv`);
    Toast.show(`Bank Advice File downloaded for ${bankCode}!`, 'success', `${rows.length} transactions queued`);
  },

  printBankAuthorityLetter() {
    const salaries = DB.get('salary').filter(s => s.month === this.currentMonth);
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const bankCode = this.selectedBank;
    const todayStr = Utils.today();
    const monthLabel = new Date(this.currentMonth + '-01').toLocaleDateString('en', { month: 'long', year: 'numeric' });

    const totalAmount = emps.reduce((sum, emp) => {
      const s = salaries.find(x => x.employeeId === emp.id);
      return sum + (s?.netSalary || Math.round(Number(emp.salary || 60000) * 0.9));
    }, 0);

    const corporateAccounts = {
      HBL: { name: 'Habib Bank Limited', branch: 'Corporate Center Clifton, Karachi', accNo: '00427901849103', iban: 'PK36HABB0000427901849103' },
      MCB: { name: 'MCB Bank Limited', branch: 'Main Branch Gulberg, Lahore', accNo: '09812401928374', iban: 'PK36MUCB0000098124019283' },
      UBL: { name: 'United Bank Limited', branch: 'Blue Area Branch, Islamabad', accNo: '11029384756102', iban: 'PK36UNIL0000110293847561' },
      MEEZ: { name: 'Meezan Bank Limited', branch: 'PNSC Corporate Branch, Karachi', accNo: '01029485716253', iban: 'PK36MEZN0000010294857162' },
      ABL: { name: 'Allied Bank Limited', branch: 'Parliament Branch, Islamabad', accNo: '55667788990011', iban: 'PK36ABPA0000556677889900' }
    };
    const b = corporateAccounts[bankCode] || corporateAccounts['HBL'];

    Modal.show('Official Corporate Bank Authority Letter', `
      <div id="bank-letter-print-area" style="background:white;color:#111827;padding:40px 48px;border-radius:10px;border:2px solid #e2e8f0;font-family:'Segoe UI',Roboto,Helvetica,sans-serif;max-width:780px;margin:0 auto;box-shadow:0 10px 25px rgba(0,0,0,0.05)">
        <!-- Executive Corporate Letterhead Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e3a8a;padding-bottom:18px;margin-bottom:24px">
          <div>
            <div style="font-size:22px;font-weight:900;color:#1e3a8a;letter-spacing:0.5px">HRM ENTERPRISE SOLUTIONS (PVT) LTD</div>
            <div style="font-size:12px;color:#475569;margin-top:2px">Corporate Affairs &bull; Treasury &bull; Financial Governance Division</div>
            <div style="font-size:11px;color:#64748b">NTN: 4120984-7 &bull; Incorporation No: 0092184-PK</div>
          </div>
          <div style="text-align:right;font-size:11.5px;color:#475569">
            <div>Executive Tower, Blue Area</div>
            <div>Islamabad, Pakistan</div>
            <div style="margin-top:4px;font-weight:700;color:#1e3a8a">Date: ${todayStr}</div>
          </div>
        </div>

        <!-- Recipient Bank Details -->
        <div style="margin-bottom:20px;font-size:13px;line-height:1.6">
          <div><strong>To,</strong></div>
          <div>The Branch Manager,</div>
          <div style="font-weight:700;color:#1e3a8a">${b.name}</div>
          <div>${b.branch}</div>
        </div>

        <!-- Subject -->
        <div style="background:#f1f5f9;border-left:4px solid #1e3a8a;padding:10px 14px;margin-bottom:20px;font-size:13.5px;font-weight:800;color:#0f172a">
          SUBJECT: AUTHORITY LETTER FOR SALARY DISBURSEMENT FOR THE MONTH OF ${monthLabel.toUpperCase()}
        </div>

        <!-- Body -->
        <div style="font-size:13px;line-height:1.7;color:#334155;margin-bottom:22px">
          <p>Dear Sir / Madam,</p>
          <p>
            You are hereby officially authorized and instructed to debit our Company Corporate Salary Disbursement Account 
            <strong>A/C No: ${b.accNo} (IBAN: ${b.iban})</strong> maintained with your branch, with an aggregate amount of 
            <strong style="color:#0f172a">PKR ${totalAmount.toLocaleString('en-PK')}</strong> 
            and credit the respective bank accounts of our <strong>${emps.length} employees</strong> as detailed in the attached schedule (Annexure-A).
          </p>
          <p>
            The batch electronic file formatted in accordance with your corporate portal specifications has been uploaded through the host-to-host banking portal. Please ensure all 1Link / IBFT transfers are executed on value date <strong>${todayStr}</strong> without delay.
          </p>
          <p>
            Kindly return a duplicate copy of this letter bearing your official bank acknowledgement stamp and transaction batch confirmation reference for our internal audit and regulatory records.
          </p>
        </div>

        <!-- Financial Summary Box -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 18px;margin-bottom:28px;display:flex;justify-content:space-between;font-size:12.5px">
          <div>Total Employees to be Credited: <strong style="color:#1e3a8a">${emps.length} Persons</strong></div>
          <div>Total Net Disbursable Amount: <strong style="color:#16a34a;font-size:14px">PKR ${totalAmount.toLocaleString('en-PK')}</strong></div>
        </div>

        <!-- Authorized Corporate Signatures -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:36px;padding-top:20px;border-top:1px solid #cbd5e1">
          <div style="text-align:center">
            <div style="font-size:20px;color:#1e3a8a;font-family:'Brush Script MT',cursive;margin-bottom:4px">Ahmed Khan</div>
            <div style="border-top:1.5px solid #0f172a;width:180px;margin:0 auto 4px auto"></div>
            <div style="font-weight:800;font-size:12px;color:#0f172a">Ahmed Khan</div>
            <div style="font-size:11px;color:#64748b">Chief Executive Officer (CEO)</div>
            <div style="font-size:10px;color:#64748b">Principal Authorized Signatory</div>
          </div>

          <div style="text-align:center">
            <div style="font-size:20px;color:#059669;font-family:'Brush Script MT',cursive;margin-bottom:4px">Sara Malik</div>
            <div style="border-top:1.5px solid #0f172a;width:180px;margin:0 auto 4px auto"></div>
            <div style="font-weight:800;font-size:12px;color:#0f172a">Sara Malik</div>
            <div style="font-size:11px;color:#64748b">Head of Human Resources</div>
            <div style="font-size:10px;color:#64748b">Joint Authorized Signatory</div>
          </div>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Payroll.executePrintBankLetter()">
          <i class="fa fa-print"></i> Print Executive Authority Letter
        </button>
      `
    });
  },

  executePrintBankLetter() {
    const area = document.getElementById('bank-letter-print-area');
    if (!area) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Bank_Authority_Letter_${this.selectedBank}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <style>
            body { margin:0; padding:20px; font-family:'Segoe UI',Roboto,Helvetica,sans-serif; background:#fff; color:#000; }
            @page { size: A4; margin: 15mm; }
          </style>
        </head>
        <body>
          ${area.outerHTML}
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    w.document.close();
  },

  // ============================================================
  // BATCH 2: Statutory Benefit Ledgers (EOBI, SESSI, Gratuity)
  // ============================================================
  statutorySubTab: 'eobi',

  renderStatutoryLedgers(container) {
    const isEmp = Auth.role === 'employee';
    const subTabs = [
      { id: 'eobi', label: 'EOBI Register (Pension)', icon: 'fa-shield-halved' },
      { id: 'sessi', label: 'SESSI / PESSI (Social Security)', icon: 'fa-user-nurse' },
      { id: 'gratuity', label: 'Gratuity Liability Pool', icon: 'fa-vault' }
    ];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:19px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(245,158,11,0.12);color:var(--warning)">
              <i class="fa fa-landmark-dome"></i>
            </span>
            Pakistan Statutory Benefit Ledgers &amp; Compliance Registers
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Employees' Old-Age Benefits (EOBI), Provincial Social Security (SESSI/PESSI), and Gratuity Fund Pool
          </div>
        </div>

        <div style="display:flex;gap:8px">
          ${this.statutorySubTab === 'eobi' ? `
            <button class="btn btn-secondary btn-sm" onclick="Payroll.exportEOBICSO()"><i class="fa fa-file-export"></i> Form PR-01 (CSV)</button>
            <button class="btn btn-primary btn-sm" onclick="Payroll.showEOBIChallanModal()"><i class="fa fa-receipt"></i> EOBI Bank Challan</button>
          ` : this.statutorySubTab === 'sessi' ? `
            <button class="btn btn-secondary btn-sm" onclick="Payroll.exportSESSICSV()"><i class="fa fa-file-export"></i> Form R-1 (CSV)</button>
            <button class="btn btn-primary btn-sm" onclick="Payroll.showSESSIChallanModal()"><i class="fa fa-receipt"></i> SESSI Deposit Advice</button>
          ` : `
            <button class="btn btn-secondary btn-sm" onclick="Payroll.exportGratuityCSV()"><i class="fa fa-file-export"></i> Actuarial Ledger (CSV)</button>
          `}
        </div>
      </div>

      <!-- Sub Navigation -->
      <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap">
        ${subTabs.map(t => `
          <button class="tab-toggle-btn ${this.statutorySubTab===t.id?'active':''}" onclick="Payroll.switchStatutorySubTab('${t.id}')">
            <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
          </button>
        `).join('')}
      </div>

      <div id="statutory-subtab-content"></div>
    `;

    this.renderStatutorySubTab();
  },

  switchStatutorySubTab(tab) {
    this.statutorySubTab = tab;
    this.renderStatutoryLedgers(document.getElementById('payroll-content'));
  },

  renderStatutorySubTab() {
    const subContainer = document.getElementById('statutory-subtab-content');
    if (!subContainer) return;

    if (this.statutorySubTab === 'eobi') {
      this.renderEOBISubTab(subContainer);
    } else if (this.statutorySubTab === 'sessi') {
      this.renderSESSISubTab(subContainer);
    } else {
      this.renderGratuitySubTab(subContainer);
    }
  },

  renderEOBISubTab(container) {
    const eobiRecords = (DB.get('eobi_ledger') || []).filter(r => r.month === this.currentMonth);
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const totalWorkers = emps.length;
    const totalEmployeeShare = totalWorkers * 370;
    const totalEmployerShare = totalWorkers * 1850;
    const grandTotal = totalEmployeeShare + totalEmployerShare;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Registered Workers</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:6px">${totalWorkers} Active</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Base wage: PKR 37,000</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Employee Share (1%)</div>
          <div style="font-size:20px;font-weight:800;color:var(--warning);margin-top:6px">${Utils.formatCurrency(totalEmployeeShare)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">PKR 370 / worker</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Employer Liability (5%)</div>
          <div style="font-size:20px;font-weight:800;color:var(--danger);margin-top:6px">${Utils.formatCurrency(totalEmployerShare)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">PKR 1,850 / worker</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Total EOBI Deposit</div>
          <div style="font-size:20px;font-weight:800;color:var(--success);margin-top:6px">${Utils.formatCurrency(grandTotal)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">National Bank Deposit Challan</div>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-shield-halved" style="color:var(--primary);margin-right:6px"></i> Monthly EOBI Contribution Register (Form PR-01 Schedule)
          </div>
          <div style="font-size:12px;color:var(--text-3)">Statutory Act of 1976 compliance</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>EOBI Reg No</th>
                <th>Statutory Wage Base</th>
                <th>Employee Share (1%)</th>
                <th>Employer Share (5%)</th>
                <th>Total Contribution</th>
                <th>Deposit Status</th>
                <th>Challan Slip Ref</th>
              </tr>
            </thead>
            <tbody>
              ${emps.map(emp => {
                const rec = eobiRecords.find(r => r.employeeId === emp.id) || {
                  eobiNo: `EOBI-${String(100000 + emp.id * 142)}-PK`,
                  wageBase: 37000,
                  employeeShare: 370,
                  employerShare: 1850,
                  totalContribution: 2220,
                  status: 'deposited',
                  depositSlipNo: `NBP-EOBI-CH-${emp.id}9104`
                };
                return `
                  <tr>
                    <td>
                      <div style="font-weight:600;font-size:13px">${emp.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp.empNo} &bull; ${Utils.getDeptName(emp.departmentId)}</div>
                    </td>
                    <td><span class="chip" style="font-family:monospace;font-weight:700">${rec.eobiNo}</span></td>
                    <td style="font-weight:600">${Utils.formatCurrency(rec.wageBase)}</td>
                    <td style="font-weight:700;color:var(--warning)">PKR 370</td>
                    <td style="font-weight:700;color:var(--danger)">PKR 1,850</td>
                    <td style="font-weight:800;color:var(--success)">PKR 2,220</td>
                    <td><span class="badge badge-success"><i class="fa fa-check"></i> Deposited</span></td>
                    <td><span style="font-size:11px;font-family:monospace">${rec.depositSlipNo || 'NBP-CH-2026'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSESSISubTab(container) {
    const sessiRecords = (DB.get('sessi_ledger') || []).filter(r => r.month === this.currentMonth);
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const totalWorkers = emps.length;
    const totalContribution = totalWorkers * 2220;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Registered Covered Workers</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:6px">${totalWorkers} Persons</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Sindh (SESSI) &bull; Punjab (PESSI)</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Employer Contribution (6%)</div>
          <div style="font-size:22px;font-weight:800;color:var(--danger);margin-top:6px">${Utils.formatCurrency(totalContribution)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">PKR 2,220 / worker per month</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Employee Contribution</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:6px">PKR 0 (Nil)</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">100% Employer Funded Benefit</div>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-user-nurse" style="color:var(--success);margin-right:6px"></i> Provincial Social Security Contribution Register (SESSI / PESSI)
          </div>
          <div style="font-size:12px;color:var(--text-3)">Sindh Employees Social Security Act 2016</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Social Security Reg #</th>
                <th>Institution</th>
                <th>Statutory Wage Base</th>
                <th>Employer Contribution (6%)</th>
                <th>Payment Challan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${emps.map(emp => {
                const isSindh = emp.branchId === 1 || emp.branchId === 2;
                const rec = sessiRecords.find(r => r.employeeId === emp.id) || {
                  socialSecurityNo: `SS-${isSindh ? 'KHI' : 'LHE'}-${String(88000 + emp.id * 19)}`,
                  institution: isSindh ? 'SESSI (Sindh)' : 'PESSI (Punjab)',
                  wageBase: 37000,
                  employerContribution: 2220,
                  status: 'deposited',
                  paymentChallanNo: `NBP-SS-${emp.id}8819`
                };
                return `
                  <tr>
                    <td>
                      <div style="font-weight:600;font-size:13px">${emp.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div>
                    </td>
                    <td><span class="chip" style="font-family:monospace;font-weight:700">${rec.socialSecurityNo}</span></td>
                    <td><span class="badge ${isSindh ? 'badge-primary' : 'badge-warning'}">${rec.institution}</span></td>
                    <td style="font-weight:600">${Utils.formatCurrency(rec.wageBase)}</td>
                    <td style="font-weight:800;color:var(--danger)">PKR 2,220</td>
                    <td><span style="font-size:11px;font-family:monospace">${rec.paymentChallanNo}</span></td>
                    <td><span class="badge badge-success"><i class="fa fa-circle-check"></i> Cleared</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderGratuitySubTab(container) {
    const pool = DB.get('gratuity_pool') || [];
    const totalLiability = pool.reduce((sum, p) => sum + (p.accruedLiability || 0), 0);
    const totalMonthlyProvision = pool.reduce((sum, p) => sum + (p.monthlyProvision || 0), 0);
    const eligibleWorkers = pool.filter(p => p.eligible).length;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Total Accrued Gratuity Pool</div>
          <div style="font-size:20px;font-weight:800;color:var(--danger);margin-top:6px">${Utils.formatCurrency(totalLiability)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Actuarial defined benefit liability</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Eligible Employees (&ge; 1 Yr)</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:6px">${eligibleWorkers} Vested</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Out of ${pool.length} total staff</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Monthly Accrual Provision</div>
          <div style="font-size:20px;font-weight:800;color:var(--warning);margin-top:6px">${Utils.formatCurrency(totalMonthlyProvision)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Transferred to reserve per month</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Funding Status</div>
          <div style="font-size:18px;font-weight:800;color:var(--success);margin-top:6px">100% Fully Backed</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Segregated Escrow Trust Account</div>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-vault" style="color:var(--warning);margin-right:6px"></i> Gratuity Liability &amp; Provisioning Ledger
          </div>
          <div style="font-size:12px;color:var(--text-3)">Standing Orders Ordinance 1968 (30 Days Basic per Year)</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Joining Date</th>
                <th>Tenure</th>
                <th>Basic Salary</th>
                <th>Vesting Status</th>
                <th>Monthly Provision</th>
                <th>Total Accrued Gratuity</th>
                <th>Trust Funding</th>
              </tr>
            </thead>
            <tbody>
              ${pool.map(p => {
                const emp = DB.find('employees', p.employeeId);
                if (!emp) return '';
                return `
                  <tr>
                    <td>
                      <div style="font-weight:600;font-size:13px">${emp.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp.empNo} &bull; ${Utils.getDesigName(emp.designationId)}</div>
                    </td>
                    <td>${p.joiningDate}</td>
                    <td><span class="chip" style="font-weight:700">${p.exactTenureYears} Years</span></td>
                    <td style="font-weight:600">${Utils.formatCurrency(p.basicSalary)}</td>
                    <td>
                      <span class="badge ${p.eligible ? 'badge-success' : 'badge-warning'}">
                        ${p.eligible ? '100% Vested' : 'In Probation (< 1 Yr)'}
                      </span>
                    </td>
                    <td style="font-weight:700;color:var(--warning)">${Utils.formatCurrency(p.monthlyProvision)}</td>
                    <td style="font-weight:800;color:var(--danger);font-size:13.5px">${Utils.formatCurrency(p.accruedLiability)}</td>
                    <td><span class="badge badge-success"><i class="fa fa-check-double"></i> 100% Funded</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportEOBICSO() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const headers = ['Employee ID','Full Name','CNIC','EOBI Registration No','Statutory Wage Base','Employee Share (1%)','Employer Share (5%)','Total Contribution','Contribution Month'];
    const rows = emps.map(emp => [
      emp.empNo,
      `"${emp.fullName}"`,
      emp.cnic || '',
      `EOBI-${String(100000 + emp.id * 142)}-PK`,
      37000,
      370,
      1850,
      2220,
      this.currentMonth
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `eobi_form_pr01_${this.currentMonth}.csv`);
    Toast.show('EOBI Form PR-01 exported!', 'success', `${rows.length} employee schedules`);
  },

  exportSESSICSV() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const headers = ['Employee ID','Full Name','CNIC','Social Security No','Institution','Wage Base','Employer Contribution (6%)','Month'];
    const rows = emps.map(emp => {
      const isSindh = emp.branchId === 1 || emp.branchId === 2;
      return [
        emp.empNo,
        `"${emp.fullName}"`,
        emp.cnic || '',
        `SS-${isSindh ? 'KHI' : 'LHE'}-${String(88000 + emp.id * 19)}`,
        isSindh ? 'SESSI' : 'PESSI',
        37000,
        2220,
        this.currentMonth
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `sessi_return_${this.currentMonth}.csv`);
    Toast.show('SESSI/PESSI Schedule exported!', 'success', `${rows.length} employee returns`);
  },

  exportGratuityCSV() {
    const pool = DB.get('gratuity_pool') || [];
    const headers = ['Employee ID','Full Name','Joining Date','Completed Years','Exact Tenure (Years)','Basic Salary','Eligibility','Monthly Provision Accrual','Total Accrued Gratuity Liability'];
    const rows = pool.map(p => {
      const emp = DB.find('employees', p.employeeId);
      return [
        emp?.empNo || '',
        `"${emp?.fullName || ''}"`,
        p.joiningDate,
        p.completedYears,
        p.exactTenureYears,
        p.basicSalary,
        p.eligible ? 'Vested' : 'Unvested',
        p.monthlyProvision,
        p.accruedLiability
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `gratuity_liability_actuarial_${Utils.today()}.csv`);
    Toast.show('Gratuity Actuarial Statement exported!', 'success', `${rows.length} records`);
  },

  showEOBIChallanModal() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const totalAmount = emps.length * 2220;

    Modal.show('EOBI National Bank Deposit Challan', `
      <div style="background:white;color:#0f172a;padding:24px;border-radius:8px;border:1.5px solid #cbd5e1;font-family:sans-serif">
        <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:14px">
          <div style="font-size:12px;font-weight:800;color:#1e3a8a;text-transform:uppercase">Employees' Old-Age Benefits Institution (EOBI)</div>
          <div style="font-size:16px;font-weight:900;color:#0f172a">CONTRIBUTION PAYMENT CHALLAN (FORM PR-01)</div>
          <div style="font-size:11.5px;color:#64748b">Deposited at National Bank of Pakistan (NBP) Corporate Branch</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;margin-bottom:16px">
          <div>Employer Registration No: <strong>EOBI-EMP-KAR-9821</strong></div>
          <div>Challan No: <strong>NBP-EOBI-2026-0914</strong></div>
          <div>Employer Name: <strong>HRM Enterprise Solutions Ltd</strong></div>
          <div>Month of Contribution: <strong>${this.currentMonth}</strong></div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px">
          <thead>
            <tr style="background:#f1f5f9;border:1px solid #cbd5e1">
              <th style="padding:6px 10px;text-align:left">Head of Account</th>
              <th style="padding:6px 10px;text-align:center">Insured Persons</th>
              <th style="padding:6px 10px;text-align:right">Rate / Person</th>
              <th style="padding:6px 10px;text-align:right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border:1px solid #cbd5e1">
              <td style="padding:6px 10px">Employee Contribution (1%)</td>
              <td style="padding:6px 10px;text-align:center">${emps.length}</td>
              <td style="padding:6px 10px;text-align:right">PKR 370</td>
              <td style="padding:6px 10px;text-align:right;font-weight:700">PKR ${(emps.length * 370).toLocaleString('en-PK')}</td>
            </tr>
            <tr style="border:1px solid #cbd5e1">
              <td style="padding:6px 10px">Employer Contribution (5%)</td>
              <td style="padding:6px 10px;text-align:center">${emps.length}</td>
              <td style="padding:6px 10px;text-align:right">PKR 1,850</td>
              <td style="padding:6px 10px;text-align:right;font-weight:700">PKR ${(emps.length * 1850).toLocaleString('en-PK')}</td>
            </tr>
            <tr style="border:2px solid #0f172a;background:#f8fafc">
              <td colspan="3" style="padding:8px 10px;font-weight:900;text-align:right">TOTAL AMOUNT PAYABLE:</td>
              <td style="padding:8px 10px;text-align:right;font-weight:900;color:#15803d;font-size:14px">PKR ${totalAmount.toLocaleString('en-PK')}</td>
            </tr>
          </tbody>
        </table>
        <div style="font-size:11px;color:#64748b;line-height:1.5;margin-bottom:14px">
          Amount in words: Rupees ${(totalAmount).toLocaleString('en-PK')} Only. Remitted through crossed company cheque payable to "Employees' Old-Age Benefits Institution".
        </div>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
               <button class="btn btn-primary" onclick="window.print()"><i class="fa fa-print"></i> Print Deposit Slip</button>`
    });
  },

  showSESSIChallanModal() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const totalAmount = emps.length * 2220;

    Modal.show('SESSI / PESSI Social Security Deposit Advice', `
      <div style="background:white;color:#0f172a;padding:24px;border-radius:8px;border:1.5px solid #cbd5e1;font-family:sans-serif">
        <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:14px">
          <div style="font-size:12px;font-weight:800;color:#059669;text-transform:uppercase">Sindh &amp; Punjab Employees' Social Security Institution</div>
          <div style="font-size:16px;font-weight:900;color:#0f172a">MONTHLY SOCIAL SECURITY CONTRIBUTION RETURN (FORM R-1)</div>
          <div style="font-size:11.5px;color:#64748b">Section 20 of Sindh Employees Social Security Act</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;margin-bottom:16px">
          <div>Social Security Reg No: <strong>SESSI-CORP-49102</strong></div>
          <div>Period: <strong>${this.currentMonth}</strong></div>
          <div>Employer: <strong>HRM Enterprise Solutions (Pvt) Ltd</strong></div>
          <div>Disbursing Bank: <strong>National Bank of Pakistan</strong></div>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <div style="font-size:11.5px;color:#166534">Total Covered Personnel (Base PKR 37,000):</div>
            <div style="font-size:18px;font-weight:800;color:#166534">${emps.length} Workers</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11.5px;color:#166534">Total 6% Employer Assessment:</div>
            <div style="font-size:20px;font-weight:900;color:#15803d">PKR ${totalAmount.toLocaleString('en-PK')}</div>
          </div>
        </div>
        <div style="font-size:11px;color:#64748b">Verified and certified in compliance with provincial social security statutory rates.</div>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
               <button class="btn btn-primary" onclick="window.print()"><i class="fa fa-print"></i> Print Social Security Advice</button>`
    });
  },

  // ============================================================
  // SALARY STRUCTURES & GRADE COMPENSATION SCALES (Phase 2)
  // ============================================================

  renderSalaryStructures(container) {
    if (typeof DB.ensureSalaryStructureData === 'function') DB.ensureSalaryStructureData();
    const structures = DB.get('salary_structures') || [];
    const components = DB.get('salary_components') || [];
    const empSalaries = DB.get('employee_salaries') || [];
    const emps = DB.get('employees') || [];

    const totalAllocatedSalary = empSalaries.reduce((sum, es) => sum + (es.grossSalary || 0), 0);

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h3 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary)">
              <i class="fa fa-layer-group"></i>
            </span>
            Salary Structures, Grade Scales &amp; Component Matrix
          </h3>
          <div style="font-size:13px;color:var(--text-3);margin-top:4px">
            Transparent enterprise compensation packages, standardized allowance percentages, and statutory deduction rules
          </div>
        </div>

        <button class="btn btn-primary btn-sm" onclick="Payroll.showAddStructureModal()">
          <i class="fa fa-plus"></i> Create Salary Structure
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Defined Grade Scales</div>
          <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:4px">${structures.length} Scales</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Active Enterprise Packages</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Salary Components</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px">${components.length} Items</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Basic, HRA, Medical, PF, Tax</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Assigned Staff</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:4px">${empSalaries.length} Employees</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Bound to Compensation Scales</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Allocated Monthly Gross</div>
          <div style="font-size:22px;font-weight:800;color:var(--accent);margin-top:4px">₨ ${(totalAllocatedSalary).toLocaleString()}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Under Standard Structure</div>
        </div>
      </div>

      <!-- Salary Breakdown Calculator Simulator -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:24px">
        <h4 style="margin:0 0 12px 0;font-size:15px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
          <i class="fa fa-calculator" style="color:var(--primary)"></i> Interactive Structure Breakdown Simulator
        </h4>
        <div style="display:grid;grid-template-columns:1fr 1fr 120px;gap:14px;align-items:end;margin-bottom:16px">
          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Select Grade Scale / Structure</label>
            <select id="sim-structure-id" class="form-control" onchange="Payroll.updateSimulator()">
              ${structures.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Enter Monthly Gross Salary (PKR)</label>
            <input type="number" id="sim-gross-input" class="form-control" value="200000" step="5000" min="20000" oninput="Payroll.updateSimulator()">
          </div>
          <button class="btn btn-outline" style="height:38px" onclick="Payroll.updateSimulator()">
            <i class="fa fa-rotate"></i> Recalculate
          </button>
        </div>

        <div id="sim-results-box" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px">
          <!-- Dynamically populated by updateSimulator() -->
        </div>
      </div>

      <!-- Grade Structure Cards Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">
        ${structures.map(s => {
          const assigned = empSalaries.filter(es => es.structureId === s.id);
          return `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                  <div>
                    <span style="font-family:monospace;font-size:11px;padding:2px 8px;border-radius:6px;background:rgba(99,102,241,0.1);color:var(--primary);font-weight:700">
                      ${s.code}
                    </span>
                    <h4 style="margin:6px 0 2px 0;font-size:15px;font-weight:800;color:var(--text)">${s.name}</h4>
                  </div>
                  <span class="badge ${s.isActive ? 'badge-success' : 'badge-secondary'}">${s.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div style="font-size:12px;color:var(--text-3);margin-bottom:14px;line-height:1.4">${s.description || 'Standard corporate package'}</div>

                <!-- Visual Distribution Bar -->
                <div style="font-size:11.5px;font-weight:700;color:var(--text-3);margin-bottom:6px">Earnings Allocation Ratios:</div>
                <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;margin-bottom:10px">
                  <div style="width:${s.basePercentage}%;background:#3b82f6" title="Basic Salary: ${s.basePercentage}%"></div>
                  <div style="width:${s.hraPercentage}%;background:#6366f1" title="House Rent: ${s.hraPercentage}%"></div>
                  <div style="width:${s.medicalPercentage}%;background:#10b981" title="Medical Allowance: ${s.medicalPercentage}%"></div>
                  <div style="width:${s.conveyancePercentage}%;background:#f59e0b" title="Conveyance Allowance: ${s.conveyancePercentage}%"></div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:var(--text-2);margin-bottom:16px">
                  <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-right:4px"></span>Basic: <strong>${s.basePercentage}%</strong></div>
                  <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6366f1;margin-right:4px"></span>House Rent: <strong>${s.hraPercentage}%</strong></div>
                  <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:4px"></span>Medical: <strong>${s.medicalPercentage}%</strong></div>
                  <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-right:4px"></span>Conveyance: <strong>${s.conveyancePercentage}%</strong></div>
                </div>

                <!-- Assigned Personnel Snippets -->
                <div style="border-top:1px solid var(--border);padding-top:10px;margin-bottom:14px">
                  <div style="font-size:11.5px;font-weight:700;color:var(--text-3);margin-bottom:6px">
                    Assigned Employees (${assigned.length}):
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${assigned.map(as => {
                      const emp = emps.find(e => e.id === as.employeeId);
                      return `
                        <span style="font-size:11px;padding:2px 8px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);display:flex;align-items:center;gap:4px">
                          <i class="fa fa-user" style="color:var(--primary);font-size:10px"></i>
                          ${emp ? emp.fullName : 'Emp #' + as.employeeId}
                        </span>
                      `;
                    }).join('') || '<span style="font-size:11px;color:var(--text-muted)">No employees assigned yet</span>'}
                  </div>
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--border);padding-top:12px">
                <button class="btn btn-outline btn-xs" onclick="Payroll.showAssignStructureModal(${s.id})">
                  <i class="fa fa-user-plus"></i> Assign Staff
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.updateSimulator();
  },

  updateSimulator() {
    const box = document.getElementById('sim-results-box');
    if (!box) return;

    const structId = parseInt(document.getElementById('sim-structure-id')?.value) || 1;
    const gross = parseFloat(document.getElementById('sim-gross-input')?.value) || 200000;
    const structures = DB.get('salary_structures') || [];
    const struct = structures.find(s => s.id === structId) || structures[0] || {
      basePercentage: 50,
      hraPercentage: 25,
      medicalPercentage: 15,
      conveyancePercentage: 10
    };

    const basic = gross * (struct.basePercentage / 100);
    const hra = gross * (struct.hraPercentage / 100);
    const med = gross * (struct.medicalPercentage / 100);
    const conv = gross * (struct.conveyancePercentage / 100);

    // Standard Deductions
    const pf = basic * 0.0833; // 8.33% employee PF
    const eobi = 1300; // Standard EOBI employee share
    // Estimate simple annual tax based on FBR slab
    const annualTaxable = (basic + hra + conv) * 12;
    let annualTax = 0;
    if (annualTaxable > 1200000 && annualTaxable <= 2200000) {
      annualTax = (annualTaxable - 1200000) * 0.15;
    } else if (annualTaxable > 2200000 && annualTaxable <= 3200000) {
      annualTax = 150000 + (annualTaxable - 2200000) * 0.25;
    } else if (annualTaxable > 3200000) {
      annualTax = 400000 + (annualTaxable - 3200000) * 0.35;
    }
    const monthlyTax = Math.round(annualTax / 12);
    const totalDeductions = Math.round(pf + eobi + monthlyTax);
    const netPay = Math.round(gross - totalDeductions);

    box.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px">Earnings Breakdown</div>
          <div style="font-size:12.5px;color:var(--text);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span>Basic Salary (${struct.basePercentage}%):</span> <strong>₨ ${Math.round(basic).toLocaleString()}</strong>
          </div>
          <div style="font-size:12.5px;color:var(--text);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span>House Rent Allowance (${struct.hraPercentage}%):</span> <strong>₨ ${Math.round(hra).toLocaleString()}</strong>
          </div>
          <div style="font-size:12.5px;color:var(--text);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span>Medical Allowance (${struct.medicalPercentage}%):</span> <strong>₨ ${Math.round(med).toLocaleString()}</strong>
          </div>
          <div style="font-size:12.5px;color:var(--text);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span>Conveyance Allowance (${struct.conveyancePercentage}%):</span> <strong>₨ ${Math.round(conv).toLocaleString()}</strong>
          </div>
          <div style="font-size:13px;font-weight:800;color:var(--primary);display:flex;justify-content:space-between;padding:6px 0">
            <span>Total Gross Salary:</span> <span>₨ ${Math.round(gross).toLocaleString()}</span>
          </div>
        </div>

        <div>
          <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px">Statutory Deductions</div>
          <div style="font-size:12.5px;color:var(--text);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span>Provident Fund (8.33% of Basic):</span> <strong style="color:var(--danger)">₨ ${Math.round(pf).toLocaleString()}</strong>
          </div>
          <div style="font-size:12.5px;color:var(--text);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span>EOBI Contribution:</span> <strong style="color:var(--danger)">₨ ${eobi.toLocaleString()}</strong>
          </div>
          <div style="font-size:12.5px;color:var(--text);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span>Est. FBR Income Tax:</span> <strong style="color:var(--danger)">₨ ${monthlyTax.toLocaleString()}</strong>
          </div>
          <div style="font-size:13px;font-weight:800;color:var(--danger);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span>Total Deductions:</span> <span>₨ ${totalDeductions.toLocaleString()}</span>
          </div>
          <div style="font-size:15px;font-weight:900;color:var(--success);display:flex;justify-content:space-between;padding:8px 0;background:rgba(16,185,129,0.1);border-radius:6px;padding:6px 10px;margin-top:6px">
            <span>Estimated Take-Home Net:</span> <span>₨ ${netPay.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;
  },

  showAddStructureModal() {
    const modalHtml = `
      <div class="modal-overlay animate-fade-in" id="add-structure-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;width:100%;max-width:540px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.2)">
          <div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
              <i class="fa fa-layer-group" style="color:var(--primary)"></i> Create Salary Grade Structure
            </h3>
            <button class="btn-icon" onclick="document.getElementById('add-structure-modal').remove()"><i class="fa fa-times"></i></button>
          </div>
          <form onsubmit="Payroll.saveSalaryStructure(event)" style="padding:20px">
            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Grade Scale Name *</label>
              <input type="text" id="struct-name" class="form-control" placeholder="e.g. Lead Technical Architect Scale (S-4)" required>
            </div>
            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Scale Code *</label>
              <input type="text" id="struct-code" class="form-control" placeholder="e.g. TECH-S4" required style="font-family:monospace">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
              <div>
                <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Basic Salary % *</label>
                <input type="number" id="struct-base" class="form-control" value="50" min="10" max="80" required>
              </div>
              <div>
                <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">House Rent (HRA) % *</label>
                <input type="number" id="struct-hra" class="form-control" value="25" min="10" max="50" required>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
              <div>
                <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Medical Allowance % *</label>
                <input type="number" id="struct-med" class="form-control" value="15" min="0" max="30" required>
              </div>
              <div>
                <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Conveyance Allowance % *</label>
                <input type="number" id="struct-conv" class="form-control" value="10" min="0" max="30" required>
              </div>
            </div>
            <div style="margin-bottom:18px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Description / Eligibility Criteria</label>
              <textarea id="struct-desc" class="form-control" rows="2" placeholder="Grade level, experience threshold, or department requirements"></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px">
              <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('add-structure-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm"><i class="fa fa-save"></i> Save Grade Structure</button>
            </div>
          </form>
        </div>
      </div>
    `;
    const existing = document.getElementById('add-structure-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  saveSalaryStructure(e) {
    e.preventDefault();
    const name = document.getElementById('struct-name')?.value.trim();
    const code = document.getElementById('struct-code')?.value.trim().toUpperCase();
    const base = parseFloat(document.getElementById('struct-base')?.value) || 50;
    const hra = parseFloat(document.getElementById('struct-hra')?.value) || 25;
    const med = parseFloat(document.getElementById('struct-med')?.value) || 15;
    const conv = parseFloat(document.getElementById('struct-conv')?.value) || 10;
    const desc = document.getElementById('struct-desc')?.value.trim();

    if (!name || !code) return;

    let structures = DB.get('salary_structures') || [];
    if (structures.some(s => s.code === code)) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`Structure code '${code}' already exists!`, 'danger');
      return;
    }

    const newStruct = {
      id: Date.now(),
      name: name,
      code: code,
      description: desc || `${name} structure`,
      basePercentage: base,
      hraPercentage: hra,
      medicalPercentage: med,
      conveyancePercentage: conv,
      isActive: true
    };

    structures.push(newStruct);
    DB.set('salary_structures', structures);

    document.getElementById('add-structure-modal')?.remove();
    DB.log('CREATE', 'Payroll', `Created salary structure '${name}' (${code})`, Auth.user?.id);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`Salary structure '${name}' created!`, 'success');
    }

    const c = document.getElementById('payroll-content');
    if (c) this.renderSalaryStructures(c);
  },

  showAssignStructureModal(structureId) {
    const structures = DB.get('salary_structures') || [];
    const struct = structures.find(s => s.id === structureId) || structures[0];
    const emps = DB.get('employees') || [];
    const todayStr = new Date().toISOString().split('T')[0];

    const modalHtml = `
      <div class="modal-overlay animate-fade-in" id="assign-struct-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.2)">
          <div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
              <i class="fa fa-user-plus" style="color:var(--primary)"></i> Assign Compensation Structure
            </h3>
            <button class="btn-icon" onclick="document.getElementById('assign-struct-modal').remove()"><i class="fa fa-times"></i></button>
          </div>
          <form onsubmit="Payroll.saveEmployeeSalaryAssignment(event)" style="padding:20px">
            <input type="hidden" id="assign-struct-id" value="${struct?.id || 1}">

            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Selected Salary Grade Scale</label>
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-weight:700;color:var(--text)">
                ${struct?.name} (${struct?.code})
              </div>
            </div>

            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Select Employee *</label>
              <select id="assign-emp-id" class="form-control" required>
                ${emps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo || 'EMP-' + e.id})</option>`).join('')}
              </select>
            </div>

            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Total Agreed Monthly Gross (PKR) *</label>
              <input type="number" id="assign-gross-input" class="form-control" value="180000" step="5000" min="30000" required>
            </div>

            <div style="margin-bottom:18px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Effective Start Date *</label>
              <input type="date" id="assign-eff-date" class="form-control" value="${todayStr}" required>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px">
              <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('assign-struct-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm"><i class="fa fa-check"></i> Confirm Assignment</button>
            </div>
          </form>
        </div>
      </div>
    `;
    const existing = document.getElementById('assign-struct-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  saveEmployeeSalaryAssignment(e) {
    e.preventDefault();
    const structId = parseInt(document.getElementById('assign-struct-id')?.value) || 1;
    const empId = parseInt(document.getElementById('assign-emp-id')?.value);
    const gross = parseFloat(document.getElementById('assign-gross-input')?.value) || 0;
    const effDate = document.getElementById('assign-eff-date')?.value;

    if (!empId || !gross) return;

    const structures = DB.get('salary_structures') || [];
    const struct = structures.find(s => s.id === structId) || structures[0];
    const basic = gross * ((struct?.basePercentage || 50) / 100);

    let empSalaries = DB.get('employee_salaries') || [];
    let existing = empSalaries.find(es => es.employeeId === empId);

    if (existing) {
      existing.structureId = structId;
      existing.basicSalary = basic;
      existing.grossSalary = gross;
      existing.effectiveDate = effDate;
    } else {
      empSalaries.push({
        id: Date.now(),
        employeeId: empId,
        structureId: structId,
        basicSalary: basic,
        grossSalary: gross,
        currency: 'PKR',
        effectiveDate: effDate
      });
    }
    DB.set('employee_salaries', empSalaries);

    // Also synchronize to employee record salary attribute
    let emps = DB.get('employees') || [];
    let emp = emps.find(e => e.id === empId);
    if (emp) {
      emp.salary = gross;
      DB.set('employees', emps);
    }

    document.getElementById('assign-struct-modal')?.remove();
    DB.log('UPDATE', 'Payroll', `Assigned salary structure '${struct?.name}' to employee #${empId}`, Auth.user?.id);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`Salary scale successfully assigned to ${emp?.fullName || 'Employee'}!`, 'success');
    }

    const c = document.getElementById('payroll-content');
    if (c) this.renderSalaryStructures(c);
  }
};

