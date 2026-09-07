// ============================================================
// HRM SYSTEM — Payroll Module
// ============================================================

const Payroll = {
  currentView: 'salary',
  currentMonth: Utils.thisMonth(),

  render() {
    this.ensurePFData();
    const content = document.getElementById('page-content');
    const isEmp = Auth.role === 'employee';

    // Auto-scope employee to slips or pf if on admin view
    if (isEmp && (this.currentView === 'salary' || this.currentView === 'allowances' || this.currentView === 'deductions')) {
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
      { id:'loans', label:'My Loans', icon:'fa-hand-holding-dollar' },
    ] : [
      { id:'salary', label:'Salary Processing', icon:'fa-money-check' },
      { id:'allowances', label:'Allowances', icon:'fa-circle-plus' },
      { id:'deductions', label:'Deductions', icon:'fa-circle-minus' },
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
    this.currentView = view;
    document.querySelectorAll('[onclick*="Payroll.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\w+)'/);
      if (m) b.classList.toggle('active', m[1] === view);
    });
    this.renderView();
  },

  renderView() {
    const container = document.getElementById('payroll-content');
    if (!container) return;
    switch(this.currentView) {
      case 'salary':     this.renderSalary(container); break;
      case 'allowances': this.renderAllowances(container); break;
      case 'deductions': this.renderDeductions(container); break;
      case 'loans':      this.renderLoans(container); break;
      case 'slips':      this.renderSlips(container); break;
      case 'pf':         this.renderProvidentFund(container); break;
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


  renderLoans(container) {
    let loans = DB.get('loans');
    if (Auth.role === 'employee') {
      loans = loans.filter(l => l.employeeId === Auth.employee?.id);
    }
    container.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `<button class="btn btn-primary btn-sm" onclick="Payroll.showAddLoan()"><i class="fa fa-plus"></i> New Loan</button>` : ''}
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Amount</th><th>Purpose</th><th>Monthly</th><th>Installments</th><th>Remaining</th><th>Start Date</th><th>Status</th></tr></thead>
            <tbody>
              ${loans.map(l => `<tr>
                <td>${Utils.getEmpName(l.employeeId)}</td>
                <td style="font-weight:700">${Utils.formatCurrency(l.amount)}</td>
                <td>${l.purpose}</td>
                <td style="color:var(--danger)">${Utils.formatCurrency(l.monthlyDeduction)}</td>
                <td>${l.installments}</td>
                <td><strong>${l.remaining}</strong> left</td>
                <td>${Utils.formatDate(l.startDate)}</td>
                <td>${Utils.statusBadge(l.status)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showAddLoan() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    Modal.show('New Loan Application', `
      <div class="form-group"><label class="form-label required">Employee</label>
        <select class="form-control" id="ln-emp">${emps.map(e=>`<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}</select>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Loan Amount (PKR)</label><input class="form-control" id="ln-amount" type="number" placeholder="100000" min="0"></div>
        <div class="form-group"><label class="form-label required">No. of Installments</label><input class="form-control" id="ln-inst" type="number" placeholder="12" min="1" max="60"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Purpose</label><input class="form-control" id="ln-purpose" placeholder="Medical, Education, etc."></div>
        <div class="form-group"><label class="form-label required">Start Date</label><input class="form-control" id="ln-start" type="date" value="${Utils.today()}"></div>
      </div>
      <div id="ln-monthly-preview" style="background:var(--surface);border-radius:8px;padding:12px;margin-top:8px;display:none">
        <div style="font-size:12px;color:var(--text-3)">Monthly Deduction</div>
        <div id="ln-monthly-val" style="font-size:22px;font-weight:800;color:var(--danger)">—</div>
      </div>
      <script>document.getElementById('ln-amount')?.addEventListener('input',()=>Payroll._updateLoanPreview());document.getElementById('ln-inst')?.addEventListener('input',()=>Payroll._updateLoanPreview());</script>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Payroll.saveLoan()"><i class="fa fa-save"></i> Create Loan</button>`
    });
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
  saveLoan() {
    const empId = parseInt(document.getElementById('ln-emp').value);
    const amount = parseFloat(document.getElementById('ln-amount').value) || 0;
    const installments = parseInt(document.getElementById('ln-inst').value) || 1;
    const purpose = document.getElementById('ln-purpose').value.trim();
    const startDate = document.getElementById('ln-start').value;
    if (!amount || !purpose || !startDate) { Toast.show('Please fill all required fields', 'error'); return; }
    const monthly = Math.ceil(amount / installments);
    DB.add('loans', {
      id: DB.nextId('loans'), employeeId: empId, amount, purpose,
      installments, remaining: installments, monthlyDeduction: monthly,
      startDate, status: 'active', approvedBy: Auth.user?.id
    });
    DB.log('ADD', 'Payroll', `Loan PKR ${amount.toLocaleString()} for ${Utils.getEmpName(empId)}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Loan created!', 'success', `${installments} installments of ${Utils.formatCurrency(monthly)}`);
    this.renderView();
  },


  renderSlips(container) {
    let emps = DB.get('employees').filter(e => e.status === 'active');
    if (Auth.role === 'employee') {
      emps = emps.filter(e => e.id === Auth.employee?.id);
    }
    const salaries = DB.get('salary');
    const depts = DB.get('departments');
    const allMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
    const canManage = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

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
            <button class="btn btn-secondary btn-sm" onclick="Payroll.exportEmpSlipsCSV(Auth.employee?.id)"><i class="fa fa-file-csv"></i> Download My Payslips (CSV)</button>
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
                  <button class="btn btn-primary btn-sm" style="flex:1" onclick="Payroll.viewSlip(${emp.id},'${this.currentMonth}')"><i class="fa fa-eye"></i> View Slip</button>
                  <button class="btn btn-ghost btn-sm" onclick="Payroll.printSlip(${emp.id},'${this.currentMonth}')" title="Print / PDF"><i class="fa fa-print"></i></button>
                  ${canManage ? `<button class="btn btn-ghost btn-icon btn-sm" onclick="Payroll.showGenerateSlipModal(${emp.id},'${this.currentMonth}')" title="Edit Slip"><i class="fa fa-pen"></i></button>` : ''}
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
    const emp = DB.find('employees', Number(empId));
    const rec = DB.get('salary').find(s => s.employeeId === Number(empId) && s.month === month);
    if (!emp || !rec) { Toast.show('Salary record not found', 'error'); return; }
    const monthLabel = new Date(month+'-01').toLocaleDateString('en',{month:'long',year:'numeric'});
    const pfSettings = this.getPFSettings();
    const pfSummary = this.getEmployeePFSummary(emp.id);

    const pfEmployee = rec.pfEmployee !== undefined ? rec.pfEmployee : Math.round(rec.basic * (pfSettings.employeeRate / 100));
    const pfEmployer = rec.pfEmployer !== undefined ? rec.pfEmployer : Math.round(rec.basic * (pfSettings.employerRate / 100));
    const otherDeductions = Math.max(0, (rec.deductions || 0) - pfEmployee);

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
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>Income Tax</span><span style="color:#ef4444">PKR ${rec.tax.toLocaleString()}</span></div>
            ${rec.unpaidLeaveDeduction > 0 ? `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9">
                <span style="color:#dc2626;font-weight:600">Unpaid Leave / Loss of Pay (${rec.unpaidLeaveDays || 1}d)</span>
                <span style="color:#dc2626;font-weight:700">PKR ${rec.unpaidLeaveDeduction.toLocaleString()}</span>
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
        <button class="btn btn-secondary" onclick="Payroll.exportSingleSlipCSV(${emp.id}, '${month}')"><i class="fa fa-file-csv"></i> Download CSV</button>
        <button class="btn btn-secondary" onclick="Toast.show('Payslip emailed to ${emp.email}', 'success', 'Notification sent')"><i class="fa fa-envelope"></i> Email Slip</button>
        <button class="btn btn-primary" onclick="Payroll.printSlip(${emp.id}, '${month}')"><i class="fa fa-print"></i> Print / Save as PDF</button>
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

    // Auto-detect unpaid leave deductions for this employee & targetMonth
    const allLeaves = DB.get('leave_requests') || [];
    const salaryLeaves = allLeaves.filter(l => 
      l.employeeId === selectedEmp.id && 
      l.salaryDeduction === true && 
      l.status === 'approved' && 
      ((l.from && l.from.slice(0,7) === targetMonth) || (l.to && l.to.slice(0,7) === targetMonth))
    );
    const dailyWage = Math.round(basic / 30);
    const autoUnpaidDays = salaryLeaves.reduce((sum, l) => sum + (l.deductionDays || l.days || 1), 0);
    const autoUnpaidDeduction = salaryLeaves.reduce((sum, l) => sum + (l.deductionAmount || (dailyWage * (l.days || 1))), 0);
    const unpaidLeaveDeduction = existingRec?.unpaidLeaveDeduction !== undefined ? existingRec.unpaidLeaveDeduction : autoUnpaidDeduction;
    const unpaidLeaveDays = existingRec?.unpaidLeaveDays !== undefined ? existingRec.unpaidLeaveDays : autoUnpaidDays;

    const basic = existingRec ? existingRec.basic : (selectedEmp.salary || 50000);
    const allowances = existingRec ? existingRec.allowances : Math.round(basic * 0.45);
    const pfEmployee = existingRec?.pfEmployee !== undefined ? existingRec.pfEmployee : Math.round(basic * (pfSettings.employeeRate / 100));
    const pfEmployer = existingRec?.pfEmployer !== undefined ? existingRec.pfEmployer : Math.round(basic * (pfSettings.employerRate / 100));
    const deductions = existingRec ? Math.max(0, existingRec.deductions - pfEmployee - (existingRec.unpaidLeaveDeduction || 0)) : 2000;
    const overtime = existingRec ? (existingRec.overtime || 0) : 0;
    const bonus = existingRec ? (existingRec.bonus || 0) : 0;
    const tax = existingRec ? existingRec.tax : Math.round(basic * 0.10);
    const net = Math.max(0, basic + allowances + overtime + bonus - (deductions + pfEmployee + unpaidLeaveDeduction) - tax);

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
          <span style="font-size:11px;color:var(--text-3)">Deducted from net pay</span>
        </div>
        <div class="form-group">
          <label class="form-label">Employer PF Match (${pfSettings.employerRate}%)</label>
          <input type="number" class="form-control" id="slp-pf-empr" value="${pfEmployer}">
          <span style="font-size:11px;color:var(--text-3)">Company matching contribution</span>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Unpaid Leave / Loss of Pay Deduction (PKR)</label>
          <input type="number" class="form-control" id="slp-unpaid-ded" value="${unpaidLeaveDeduction}" oninput="Payroll.calcSlipNet()">
          <span style="font-size:11px;color:${unpaidLeaveDeduction > 0 ? 'var(--danger)' : 'var(--text-3)'}">
            ${unpaidLeaveDays > 0 ? `Auto-detected: ${unpaidLeaveDays} day(s) approved unpaid leave` : 'Deducted for unpaid leaves/absences'}
          </span>
        </div>
        <div class="form-group">
          <label class="form-label">Other Deductions (EOBI / SESSI / Loan)</label>
          <input type="number" class="form-control" id="slp-deductions" value="${deductions}" oninput="Payroll.calcSlipNet()">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Income Tax (PKR)</label>
          <input type="number" class="form-control" id="slp-tax" value="${tax}" oninput="Payroll.calcSlipNet()">
        </div>
        <div class="form-group">
          <label class="form-label">Overtime Pay (PKR)</label>
          <input type="number" class="form-control" id="slp-ot" value="${overtime}" oninput="Payroll.calcSlipNet()">
        </div>
      </div>
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
            <option value="processed" ${existingRec?.status === 'processed' || !existingRec ? 'selected' : ''}>Processed (Paid)</option>
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
          <div style="font-size:12px;color:var(--text-3)">Calculated Net Payable</div>
          <div style="font-size:11px;color:var(--text-muted)">Basic + Allowances + Overtime + Bonus - (Other Deductions + PF) - Tax</div>
        </div>
        <div style="font-size:24px;font-weight:800;color:var(--success)" id="slp-net-display">
          ${Utils.formatCurrency(net)}
        </div>
      </div>
    `, {
      size: 'modal-lg',
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Payroll.saveAndGenerateSlip()"><i class="fa fa-file-invoice-dollar"></i> Generate & View Payslip</button>
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
    const deductions = parseFloat(document.getElementById('slp-deductions')?.value) || 0;
    const unpaidDeduct = parseFloat(document.getElementById('slp-unpaid-ded')?.value) || 0;
    const tax = parseFloat(document.getElementById('slp-tax')?.value) || 0;
    const ot = parseFloat(document.getElementById('slp-ot')?.value) || 0;
    const bonus = parseFloat(document.getElementById('slp-bonus')?.value) || 0;

    const net = Math.max(0, basic + allowances + ot + bonus - (deductions + pfEmp + unpaidDeduct) - tax);
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
    const otherDeductions = parseFloat(document.getElementById('slp-deductions').value) || 0;
    const unpaidLeaveDeduction = parseFloat(document.getElementById('slp-unpaid-ded')?.value) || 0;
    const totalDeductions = otherDeductions + pfEmployee + unpaidLeaveDeduction;
    const tax = parseFloat(document.getElementById('slp-tax').value) || 0;
    const overtime = parseFloat(document.getElementById('slp-ot').value) || 0;
    const bonus = parseFloat(document.getElementById('slp-bonus').value) || 0;
    const status = document.getElementById('slp-status').value;
    const notes = document.getElementById('slp-notes')?.value.trim() || '';
    const netSalary = Math.max(0, basic + allowances + overtime + bonus - totalDeductions - tax);

    const emp = DB.find('employees', empId);
    if (!emp) return;

    const existing = DB.get('salary').find(s => s.employeeId === empId && s.month === month);
    if (existing) {
      DB.update('salary', existing.id, {
        basic, allowances, deductions: totalDeductions, pfEmployee, pfEmployer, unpaidLeaveDeduction, overtime, bonus, tax, netSalary, status, notes,
        paidOn: status === 'processed' ? (existing.paidOn || Utils.today()) : null
      });
      DB.log('PROCESS', 'Payroll', `Updated salary slip for ${emp.fullName} (${month}) with LOP deduction PKR ${unpaidLeaveDeduction}`, Auth.user?.id);
    } else {
      DB.add('salary', {
        id: DB.nextId('salary'),
        employeeId: empId,
        month,
        basic, allowances, deductions: totalDeductions, pfEmployee, pfEmployer, unpaidLeaveDeduction, overtime, bonus, tax, netSalary, status, notes,
        paidOn: status === 'processed' ? Utils.today() : null
      });
      DB.log('PROCESS', 'Payroll', `Generated salary slip for ${emp.fullName} (${month}) with LOP deduction PKR ${unpaidLeaveDeduction}`, Auth.user?.id);
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

    Modal.confirm('Process All Salaries', `Generate salary slips for <strong>${ungenerated.length} employees</strong> for <strong>${monthLabel}</strong>? Automatic leave deductions will be applied.`, () => {
      let count = 0;
      ungenerated.forEach(emp => {
        const basic = emp.salary || 50000;
        const allowances = Math.round(basic * 0.45);
        const pfEmp = Math.round(basic * (pfSettings.employeeRate / 100));
        const pfEmpr = Math.round(basic * (pfSettings.employerRate / 100));
        const otherDeductions = 2000;

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

        const totalDeductions = pfEmp + otherDeductions + unpaidLeaveDeduction;
        const tax = Math.round(basic * 0.10);
        const net = Math.max(0, basic + allowances - totalDeductions - tax);

        DB.add('salary', {
          id: DB.nextId('salary'),
          employeeId: emp.id,
          month: this.currentMonth,
          basic, allowances, deductions: totalDeductions, pfEmployee: pfEmp, pfEmployer: pfEmpr,
          unpaidLeaveDeduction, unpaidLeaveDays,
          overtime: 0, bonus: 0, tax, netSalary: net,
          status: 'processed', paidOn: Utils.today()
        });

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
    let pfRecords = DB.get('provident_fund');
    if (pfRecords && pfRecords.length > 0) return pfRecords;

    const emps = DB.get('employees').filter(e => e.status === 'active');
    const months = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08'];
    const seeded = [];
    let idCounter = 1;

    emps.forEach(emp => {
      const basic = emp.salary || 50000;
      const joinMonth = (emp.joiningDate || '2020-01-01').slice(0, 7);
      const empShare = Math.round(basic * 0.05);
      const emprShare = Math.round(basic * 0.05);

      months.forEach(m => {
        if (m >= joinMonth) {
          seeded.push({
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
        }
      });
    });

    DB.set('provident_fund', seeded);
    return seeded;
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
    const isEmp = Auth.role === 'employee';
    if (isEmp) {
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

    container.innerHTML = `
      <!-- Employee Hero Portfolio Card -->
      <div style="background:linear-gradient(135deg, hsl(221,83%,20%), hsl(262,83%,25%));border:1px solid var(--border);border-radius:16px;padding:26px;color:white;margin-bottom:24px;position:relative;overflow:hidden">
        <div style="position:absolute;right:-20px;bottom:-30px;font-size:160px;opacity:0.05"><i class="fa fa-piggy-bank"></i></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;position:relative;z-index:1">
          <div>
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Provident Fund Account • ${emp.fullName}</div>
            <div style="font-size:36px;font-weight:800;margin:6px 0">${Utils.formatCurrency(summary.totalBalance)}</div>
            <div style="font-size:13px;opacity:0.9">Accumulated balance available in employee fund trust</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="Payroll.exportEmpPFCSV(${emp.id})"><i class="fa fa-file-csv"></i> Download Statement (CSV)</button>
            <button class="btn btn-primary btn-sm" onclick="Payroll.printPFStatement(${emp.id})"><i class="fa fa-print"></i> Print / Save Statement (PDF)</button>
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

    container.innerHTML = `
      <!-- KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--success)22;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--success)"><i class="fa fa-piggy-bank"></i></div>
          <div>
            <div style="font-size:20px;font-weight:800;color:var(--success)">${Utils.formatCurrency(summary.totalPool)}</div>
            <div style="font-size:12px;color:var(--text-3)">Total PF Fund Pool</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--primary)22;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--primary)"><i class="fa fa-hand-holding-dollar"></i></div>
          <div>
            <div style="font-size:20px;font-weight:800;color:var(--primary)">${Utils.formatCurrency(summary.totalEmployee)}</div>
            <div style="font-size:12px;color:var(--text-3)">Total Employee Contributions</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px">
          <div style="width:48px;height:48px;border-radius:12px;background:#a855f722;display:flex;align-items:center;justify-content:center;font-size:20px;color:#a855f7"><i class="fa fa-building-columns"></i></div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#a855f7">${Utils.formatCurrency(summary.totalEmployer)}</div>
            <div style="font-size:12px;color:var(--text-3)">Total Employer Match</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--info)22;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--info)"><i class="fa fa-users"></i></div>
          <div>
            <div style="font-size:20px;font-weight:800;color:var(--info)">${summary.activeMembers} / ${summary.totalEmployees}</div>
            <div style="font-size:12px;color:var(--text-3)">Enrolled Active Members</div>
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
        <button class="btn btn-secondary" onclick="Payroll.exportEmpPFCSV(${emp.id})"><i class="fa fa-file-csv"></i> Download CSV</button>
        <button class="btn btn-primary" onclick="Payroll.printPFStatement(${emp.id})"><i class="fa fa-print"></i> Print / PDF Statement</button>
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

};
