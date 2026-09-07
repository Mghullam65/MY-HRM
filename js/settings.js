// ============================================================
// HRM SYSTEM — Settings Module
// ============================================================

const Settings = {
  currentSection: 'company',

  render() {
    const content = document.getElementById('page-content');
    const sections = [
      { id: 'company', label: 'Company Profile', icon: 'fa-building' },
      { id: 'general', label: 'General Settings', icon: 'fa-sliders' },
      { id: 'attendance_rules', label: 'Attendance Rules', icon: 'fa-clock' },
      { id: 'leave_policy', label: 'Leave Policy', icon: 'fa-calendar-xmark' },
      { id: 'payroll_config', label: 'Payroll Config', icon: 'fa-money-bill-wave' },
      { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
      { id: 'appearance', label: 'Appearance', icon: 'fa-palette' },
      { id: 'backup', label: 'Backup & Restore', icon: 'fa-database' },
      { id: 'system', label: 'System', icon: 'fa-server' },
    ];

    content.innerHTML = `
      <div class="animate-fade-in" style="display:grid;grid-template-columns:220px 1fr;gap:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:8px;height:fit-content;position:sticky;top:0">
          ${sections.map(s => `
            <div class="nav-item ${this.currentSection === s.id ? 'active' : ''}" onclick="Settings.switchSection('${s.id}')" data-label="${s.label}">
              <i class="fa ${s.icon}"></i><span>${s.label}</span>
            </div>
          `).join('')}
        </div>
        <div id="settings-content"></div>
      </div>
    `;
    this.renderSection();
  },

  switchSection(section) {
    this.currentSection = section;
    document.querySelectorAll('[onclick*="Settings.switchSection"]').forEach(el => {
      const m = el.getAttribute('onclick').match(/'(\w+)'/);
      if (m) el.classList.toggle('active', m[1] === section);
    });
    this.renderSection();
  },

  renderSection() {
    const c = document.getElementById('settings-content');
    if (!c) return;
    switch (this.currentSection) {
      case 'company':          this.renderCompany(c); break;
      case 'general':          this.renderGeneral(c); break;
      case 'attendance_rules': this.renderAttendanceRules(c); break;
      case 'leave_policy':     this.renderLeavePolicy(c); break;
      case 'payroll_config':   this.renderPayrollConfig(c); break;
      case 'notifications':    this.renderNotifications(c); break;
      case 'appearance':       this.renderAppearance(c); break;
      case 'backup':           this.renderBackup(c); break;
      case 'system':           this.renderSystem(c); break;
    }
  },

  // ─── Helpers ──────────────────────────────────────
  _getSetting(key, fallback) {
    const settings = DB.getObj('settings');
    return settings[key] !== undefined ? settings[key] : fallback;
  },

  _setSetting(key, value) {
    const settings = DB.getObj('settings');
    settings[key] = value;
    DB.set('settings', settings);
  },

  _settingRow(label, inputHTML, helpText) {
    return `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;padding-right:20px">
          <div style="font-size:13px;font-weight:600;color:var(--text)">${label}</div>
          ${helpText ? `<div style="font-size:11.5px;color:var(--text-3);margin-top:3px">${helpText}</div>` : ''}
        </div>
        <div style="width:300px;flex-shrink:0">${inputHTML}</div>
      </div>
    `;
  },

  _sectionCard(title, subtitle, bodyHTML, footerHTML = '') {
    return `
      <div class="card" style="margin-bottom:16px">
        <div style="margin-bottom:16px">
          <div style="font-size:16px;font-weight:700">${title}</div>
          ${subtitle ? `<div style="font-size:12px;color:var(--text-3);margin-top:3px">${subtitle}</div>` : ''}
        </div>
        ${bodyHTML}
        ${footerHTML ? `<div style="margin-top:20px;display:flex;justify-content:flex-end;gap:8px">${footerHTML}</div>` : ''}
      </div>
    `;
  },

  // ─── Company Profile ──────────────────────────────
  renderCompany(c) {
    const s = key => this._getSetting(key, '');
    c.innerHTML = this._sectionCard('Company Profile', 'Basic information about your organization', `
      ${this._settingRow('Company Name',
        `<input class="form-control" id="s-company-name" value="${s('companyName') || 'HRM Pro'}">`,
        'Displayed in sidebar, payslips, and reports')}
      ${this._settingRow('Company Email',
        `<input class="form-control" id="s-company-email" type="email" value="${s('companyEmail') || 'hr@company.com'}">`,
        'Primary contact email')}
      ${this._settingRow('Company Phone',
        `<input class="form-control" id="s-company-phone" value="${s('companyPhone') || '+92-21-1234567'}">`,
        'Primary contact phone')}
      ${this._settingRow('Address',
        `<textarea class="form-control" id="s-company-address" rows="2">${s('companyAddress') || 'Suite 401, Business Plaza, Shahrah-e-Faisal, Karachi'}</textarea>`,
        'Full business address')}
      ${this._settingRow('NTN Number',
        `<input class="form-control" id="s-company-ntn" value="${s('companyNTN') || '1234567-8'}">`,
        'National Tax Number for tax filings')}
      ${this._settingRow('Website',
        `<input class="form-control" id="s-company-website" value="${s('companyWebsite') || 'https://company.com'}">`, '')}
      ${this._settingRow('Industry',
        `<select class="form-control" id="s-company-industry">
          ${['Information Technology','Finance','Healthcare','Manufacturing','Education','Retail','Construction','Hospitality','Telecom','Other'].map(i => `<option ${s('companyIndustry')===i?'selected':''}>${i}</option>`).join('')}
        </select>`, '')}
    `, `<button class="btn btn-primary" onclick="Settings.saveCompany()"><i class="fa fa-save"></i> Save Changes</button>`);
  },

  saveCompany() {
    ['companyName','companyEmail','companyPhone','companyAddress','companyNTN','companyWebsite','companyIndustry'].forEach(key => {
      const el = document.getElementById('s-company-' + key.replace('company','').toLowerCase());
      if (el) this._setSetting(key, el.value.trim());
    });
    DB.log('UPDATE', 'Settings', 'Company profile updated', Auth.user?.id);
    Toast.show('Company profile saved!', 'success');
  },

  // ─── General Settings ─────────────────────────────
  renderGeneral(c) {
    const s = key => this._getSetting(key, '');
    c.innerHTML = this._sectionCard('General Settings', 'System-wide configuration', `
      ${this._settingRow('Fiscal Year Start',
        `<select class="form-control" id="s-fiscal-start">
          ${['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => `<option value="${i+1}" ${(s('fiscalYearStart')||'7')==(i+1)?'selected':''}>${m}</option>`).join('')}
        </select>`,
        'When your financial year begins (e.g., July for Pakistani fiscal year)')}
      ${this._settingRow('Currency',
        `<select class="form-control" id="s-currency">
          ${['PKR - Pakistani Rupee','USD - US Dollar','GBP - British Pound','EUR - Euro','AED - UAE Dirham','SAR - Saudi Riyal'].map(c => `<option ${(s('currency')||'PKR')==c.split(' ')[0]?'selected':''}>${c}</option>`).join('')}
        </select>`,
        'Default currency for salary and payroll')}
      ${this._settingRow('Date Format',
        `<select class="form-control" id="s-date-format">
          ${['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD','DD-MMM-YYYY'].map(f => `<option ${(s('dateFormat')||'DD/MM/YYYY')==f?'selected':''}>${f}</option>`).join('')}
        </select>`, '')}
      ${this._settingRow('Time Zone',
        `<select class="form-control" id="s-timezone">
          ${['Asia/Karachi (+05:00)','Asia/Dubai (+04:00)','Asia/Riyadh (+03:00)','Europe/London (+00:00)','America/New_York (-05:00)'].map(t => `<option ${(s('timezone')||'Asia/Karachi')==t.split(' ')[0]?'selected':''}>${t}</option>`).join('')}
        </select>`, '')}
      ${this._settingRow('Employee ID Prefix',
        `<input class="form-control" id="s-emp-prefix" value="${s('empPrefix') || 'EMP-'}" maxlength="6">`,
        'Prefix for auto-generated employee IDs')}
      ${this._settingRow('Week Start Day',
        `<select class="form-control" id="s-week-start">
          ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => `<option ${(s('weekStart')||'Monday')==d?'selected':''}>${d}</option>`).join('')}
        </select>`, '')}
      ${this._settingRow('Weekend Days',
        `<div style="display:flex;flex-wrap:wrap;gap:6px">
          ${['Sat','Sun','Fri'].map(d => `<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer"><input type="checkbox" class="s-weekend" value="${d}" ${(s('weekendDays')||'Sat,Sun').includes(d)?'checked':''}>${d}</label>`).join('')}
        </div>`,
        'Select weekend days for your organization')}
    `, `<button class="btn btn-primary" onclick="Settings.saveGeneral()"><i class="fa fa-save"></i> Save Changes</button>`);
  },

  saveGeneral() {
    this._setSetting('fiscalYearStart', document.getElementById('s-fiscal-start').value);
    this._setSetting('currency', document.getElementById('s-currency').value.split(' ')[0]);
    this._setSetting('dateFormat', document.getElementById('s-date-format').value);
    this._setSetting('timezone', document.getElementById('s-timezone').value.split(' ')[0]);
    this._setSetting('empPrefix', document.getElementById('s-emp-prefix').value.trim());
    this._setSetting('weekStart', document.getElementById('s-week-start').value);
    const weekendDays = [...document.querySelectorAll('.s-weekend:checked')].map(el => el.value).join(',');
    this._setSetting('weekendDays', weekendDays);
    DB.log('UPDATE', 'Settings', 'General settings updated', Auth.user?.id);
    Toast.show('General settings saved!', 'success');
  },

  // ─── Attendance Rules ─────────────────────────────
  renderAttendanceRules(c) {
    const s = key => this._getSetting(key, '');
    c.innerHTML = this._sectionCard('Attendance Rules', 'Configure attendance thresholds and policies', `
      ${this._settingRow('Office Start Time',
        `<input class="form-control" id="s-office-start" type="time" value="${s('officeStartTime') || '09:00'}">`,
        'Default office hours start time')}
      ${this._settingRow('Office End Time',
        `<input class="form-control" id="s-office-end" type="time" value="${s('officeEndTime') || '18:00'}">`,
        'Default office hours end time')}
      ${this._settingRow('Grace Period (minutes)',
        `<input class="form-control" id="s-grace-period" type="number" value="${s('gracePeriod') || 15}" min="0" max="60">`,
        'Minutes after start time before marking "Late"')}
      ${this._settingRow('Late Threshold (minutes)',
        `<input class="form-control" id="s-late-threshold" type="number" value="${s('lateThreshold') || 30}" min="0" max="120">`,
        'Minutes late before marking as "Half Day"')}
      ${this._settingRow('Half Day Hours',
        `<input class="form-control" id="s-half-day-hours" type="number" value="${s('halfDayHours') || 4}" min="1" max="8" step="0.5">`,
        'Minimum hours to count as half-day')}
      ${this._settingRow('Overtime Threshold (hours)',
        `<input class="form-control" id="s-ot-threshold" type="number" value="${s('otThreshold') || 9}" min="1" max="16">`,
        'Working hours after which overtime starts')}
      ${this._settingRow('Overtime Rate Multiplier',
        `<select class="form-control" id="s-ot-rate">
          ${['1.0x','1.25x','1.5x','2.0x'].map(r => `<option ${(s('otRate')||'1.5x')==r?'selected':''}>${r}</option>`).join('')}
        </select>`,
        'Multiplier for overtime pay calculation')}
      ${this._settingRow('Auto Mark Absent',
        `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="s-auto-absent" ${s('autoAbsent')!==false?'checked':''}><span style="font-size:12.5px">Automatically mark employees absent if no check-in by end of day</span></label>`, '')}
    `, `<button class="btn btn-primary" onclick="Settings.saveAttendanceRules()"><i class="fa fa-save"></i> Save Rules</button>`);
  },

  saveAttendanceRules() {
    ['officeStartTime:s-office-start','officeEndTime:s-office-end','gracePeriod:s-grace-period','lateThreshold:s-late-threshold','halfDayHours:s-half-day-hours','otThreshold:s-ot-threshold','otRate:s-ot-rate'].forEach(pair => {
      const [key, id] = pair.split(':');
      this._setSetting(key, document.getElementById(id).value);
    });
    this._setSetting('autoAbsent', document.getElementById('s-auto-absent').checked);
    DB.log('UPDATE', 'Settings', 'Attendance rules updated', Auth.user?.id);
    Toast.show('Attendance rules saved!', 'success');
  },

  // ─── Leave Policy ─────────────────────────────────
  renderLeavePolicy(c) {
    const types = DB.get('leave_types');
    c.innerHTML = this._sectionCard('Leave Policy Configuration', 'Configure leave types, accrual rules, and carry forward', `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Leave Type</th><th>Code</th><th>Max Days</th><th>Carry Forward</th><th>Max Carry</th><th>Paid</th><th>Actions</th></tr></thead>
          <tbody>
            ${types.map(t => `<tr>
              <td style="font-weight:600"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${t.color};margin-right:8px"></span>${t.name}</td>
              <td><span class="chip">${t.code}</span></td>
              <td><input class="form-control" style="width:70px;display:inline" type="number" value="${t.maxDays}" id="lt-max-${t.id}" min="0"></td>
              <td><label style="cursor:pointer"><input type="checkbox" class="lt-carry" data-id="${t.id}" ${t.carryForward?'checked':''}></label></td>
              <td><input class="form-control" style="width:70px;display:inline" type="number" value="${t.maxCarry||0}" id="lt-maxcarry-${t.id}" min="0"></td>
              <td>${t.paid !== false ? '<span class="badge badge-success">Paid</span>' : '<span class="badge badge-secondary">Unpaid</span>'}</td>
              <td><button class="btn btn-ghost btn-icon btn-sm" onclick="Settings.editLeaveType(${t.id})"><i class="fa fa-pen"></i></button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    ` + this._settingRow('Probation Leave Restriction',
      `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="s-probation-restrict" ${this._getSetting('probationRestrict',true)?'checked':''}><span style="font-size:12.5px">Restrict leave for employees on probation</span></label>`,
      'When enabled, employees on probation can only take unpaid leave') + `
      ${this._settingRow('Negative Balance Allowed',
        `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="s-negative-balance" ${this._getSetting('negativeBalance',false)?'checked':''}><span style="font-size:12.5px">Allow employees to take leave even if balance is 0</span></label>`, '')}
    `, `
      <button class="btn btn-ghost" onclick="Settings.addLeaveType()"><i class="fa fa-plus"></i> Add Leave Type</button>
      <button class="btn btn-primary" onclick="Settings.saveLeavePolicy()"><i class="fa fa-save"></i> Save Policy</button>
    `);
  },

  saveLeavePolicy() {
    const types = DB.get('leave_types');
    types.forEach(t => {
      const maxEl = document.getElementById(`lt-max-${t.id}`);
      const carryEl = document.querySelector(`.lt-carry[data-id="${t.id}"]`);
      const maxCarryEl = document.getElementById(`lt-maxcarry-${t.id}`);
      if (maxEl) t.maxDays = parseInt(maxEl.value) || t.maxDays;
      if (carryEl) t.carryForward = carryEl.checked;
      if (maxCarryEl) t.maxCarry = parseInt(maxCarryEl.value) || 0;
    });
    DB.set('leave_types', types);
    this._setSetting('probationRestrict', document.getElementById('s-probation-restrict').checked);
    this._setSetting('negativeBalance', document.getElementById('s-negative-balance').checked);
    DB.log('UPDATE', 'Settings', 'Leave policy updated', Auth.user?.id);
    Toast.show('Leave policy saved!', 'success');
  },

  addLeaveType() {
    Modal.show('Add Leave Type', `
      <div class="form-group"><label class="form-label required">Leave Name</label><input class="form-control" id="lt-name" placeholder="e.g. Paternity Leave"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Code</label><input class="form-control" id="lt-code" placeholder="e.g. PAT" maxlength="5"></div>
        <div class="form-group"><label class="form-label required">Max Days</label><input class="form-control" id="lt-days" type="number" value="10" min="1"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Color</label><input class="form-control" id="lt-color" type="color" value="#6366f1"></div>
        <div class="form-group"><label class="form-label">Paid Leave</label>
          <select class="form-control" id="lt-paid"><option value="true">Yes — Paid</option><option value="false">No — Unpaid</option></select>
        </div>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" id="lt-cf"><label for="lt-cf" style="font-size:13px;cursor:pointer">Allow Carry Forward</label>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.saveNewLeaveType()"><i class="fa fa-save"></i> Save</button>
      `
    });
  },

  saveNewLeaveType() {
    const name = document.getElementById('lt-name').value.trim();
    const code = document.getElementById('lt-code').value.trim().toUpperCase();
    if (!name || !code) { Toast.show('Name and code are required', 'error'); return; }
    DB.add('leave_types', {
      id: DB.nextId('leave_types'), name, code,
      maxDays: parseInt(document.getElementById('lt-days').value) || 10,
      color: document.getElementById('lt-color').value,
      carryForward: document.getElementById('lt-cf').checked,
      paid: document.getElementById('lt-paid').value === 'true',
      maxCarry: 0
    });
    Modal.close('dynamic-modal');
    Toast.show('Leave type added!', 'success');
    this.renderSection();
  },

  editLeaveType(id) {
    const t = DB.find('leave_types', id);
    if (!t) return;
    Modal.show(`Edit — ${t.name}`, `
      <div class="form-group"><label class="form-label">Leave Name</label><input class="form-control" id="lt-ename" value="${t.name}"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Code</label><input class="form-control" id="lt-ecode" value="${t.code}"></div>
        <div class="form-group"><label class="form-label">Max Days</label><input class="form-control" id="lt-edays" type="number" value="${t.maxDays}"></div>
      </div>
      <div class="form-group"><label class="form-label">Color</label><input class="form-control" id="lt-ecolor" type="color" value="${t.color}"></div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.updateLeaveType(${id})"><i class="fa fa-save"></i> Update</button>
      `
    });
  },

  updateLeaveType(id) {
    DB.update('leave_types', id, {
      name: document.getElementById('lt-ename').value.trim(),
      code: document.getElementById('lt-ecode').value.trim().toUpperCase(),
      maxDays: parseInt(document.getElementById('lt-edays').value),
      color: document.getElementById('lt-ecolor').value,
    });
    Modal.close('dynamic-modal');
    Toast.show('Leave type updated!', 'success');
    this.renderSection();
  },

  // ─── Payroll Config ───────────────────────────────
  renderPayrollConfig(c) {
    const s = key => this._getSetting(key, '');
    c.innerHTML = this._sectionCard('Payroll Configuration', 'Tax slabs, deduction rates, and pay structure', `
      ${this._settingRow('EOBI Rate (%)',
        `<input class="form-control" id="s-eobi" type="number" value="${s('eobiRate') || 1}" min="0" max="10" step="0.1">`,
        'Employees Old-Age Benefits Institution deduction')}
      ${this._settingRow('Provident Fund Rate (%)',
        `<input class="form-control" id="s-pf" type="number" value="${s('pfRate') || 5}" min="0" max="20" step="0.5">`,
        'Company provident fund deduction from basic salary')}
      ${this._settingRow('SESSI Contribution (PKR)',
        `<input class="form-control" id="s-sessi" type="number" value="${s('sessiAmount') || 2000}" min="0">`,
        'Sindh Employees Social Security monthly contribution')}
      ${this._settingRow('Professional Tax (PKR)',
        `<input class="form-control" id="s-prof-tax" type="number" value="${s('profTax') || 200}" min="0">`,
        'Monthly professional tax deduction')}
      ${this._settingRow('Payroll Processing Day',
        `<input class="form-control" id="s-pay-day" type="number" value="${s('payDay') || 25}" min="1" max="31">`,
        'Day of month when salary is processed')}
      ${this._settingRow('Bank Account for Payroll',
        `<input class="form-control" id="s-pay-bank" value="${s('payBank') || 'HBL Corporate Account'}">`, '')}
    `) + this._sectionCard('Income Tax Slabs — FBR 2026', 'Pakistani tax slab configuration', `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Annual Income From</th><th>Annual Income To</th><th>Tax Rate</th><th>Fixed Tax</th></tr></thead>
          <tbody>
            ${[
              ['0','600,000','0%','0'],
              ['600,001','1,200,000','2.5%','0'],
              ['1,200,001','2,400,000','12.5%','15,000'],
              ['2,400,001','3,600,000','22.5%','165,000'],
              ['3,600,001','6,000,000','27.5%','435,000'],
              ['6,000,001','+','35%','1,095,000'],
            ].map(([f,t,r,fix]) => `<tr>
              <td>PKR ${f}</td><td>PKR ${t}</td>
              <td style="font-weight:700;color:var(--danger)">${r}</td>
              <td>PKR ${fix}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px">Based on FBR Finance Act 2025-26. Modify in source code for custom slabs.</div>
    `, `<button class="btn btn-primary" onclick="Settings.savePayrollConfig()"><i class="fa fa-save"></i> Save Payroll Config</button>`);
  },

  savePayrollConfig() {
    this._setSetting('eobiRate', parseFloat(document.getElementById('s-eobi').value));
    this._setSetting('pfRate', parseFloat(document.getElementById('s-pf').value));
    this._setSetting('sessiAmount', parseInt(document.getElementById('s-sessi').value));
    this._setSetting('profTax', parseInt(document.getElementById('s-prof-tax').value));
    this._setSetting('payDay', parseInt(document.getElementById('s-pay-day').value));
    this._setSetting('payBank', document.getElementById('s-pay-bank').value);
    DB.log('UPDATE', 'Settings', 'Payroll configuration updated', Auth.user?.id);
    Toast.show('Payroll config saved!', 'success');
  },

  // ─── Notifications ────────────────────────────────
  renderNotifications(c) {
    const s = key => this._getSetting(key, true);
    c.innerHTML = this._sectionCard('Notification Preferences', 'Control which notifications are active', `
      ${[
        ['notifLeaveApply',  'Leave Application',     'When an employee applies for leave'],
        ['notifLeaveApprove','Leave Approved/Rejected','When leave request is approved or rejected'],
        ['notifAttendance',  'Attendance Alerts',      'Late arrivals and absent notifications'],
        ['notifPayroll',     'Payroll Processed',      'When monthly salary is processed'],
        ['notifBirthday',    'Birthday Reminders',     'Employee birthday notifications'],
        ['notifReview',      'Performance Reviews',    'Review initiation and completion'],
        ['notifAnnouncement','Announcements',          'New company announcements'],
        ['notifExpiry',      'Document Expiry',        'CNIC, passport, contract expiry alerts'],
      ].map(([key, label, help]) => this._settingRow(label,
        `<label class="toggle-switch"><input type="checkbox" id="s-${key}" ${s(key)!==false?'checked':''}><span class="toggle-slider"></span></label>`,
        help
      )).join('')}
    `, `<button class="btn btn-primary" onclick="Settings.saveNotifications()"><i class="fa fa-save"></i> Save</button>`) + `
      <style>
        .toggle-switch { position:relative;display:inline-block;width:44px;height:24px }
        .toggle-switch input { opacity:0;width:0;height:0 }
        .toggle-slider { position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--surface-2);transition:.3s;border-radius:24px }
        .toggle-slider:before { position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background:white;transition:.3s;border-radius:50% }
        .toggle-switch input:checked + .toggle-slider { background:var(--primary) }
        .toggle-switch input:checked + .toggle-slider:before { transform:translateX(20px) }
      </style>
    `;
  },

  saveNotifications() {
    ['notifLeaveApply','notifLeaveApprove','notifAttendance','notifPayroll','notifBirthday','notifReview','notifAnnouncement','notifExpiry'].forEach(key => {
      this._setSetting(key, document.getElementById(`s-${key}`).checked);
    });
    DB.log('UPDATE', 'Settings', 'Notification preferences updated', Auth.user?.id);
    Toast.show('Notification preferences saved!', 'success');
  },

  // ─── Appearance ───────────────────────────────────
  renderAppearance(c) {
    const theme = this._getSetting('theme', 'dark');
    const accent = this._getSetting('accentColor', '#4f80f7');
    const sidebarPosition = this._getSetting('sidebarPosition', 'left');
    c.innerHTML = this._sectionCard('Appearance', 'Customize the look and feel', `
      ${this._settingRow('Theme',
        `<div style="display:flex;gap:10px">
          ${[
            { id:'dark', label:'Dark', bg:'#0f1729', color:'white' },
            { id:'light', label:'Light', bg:'#f8fafc', color:'#1a1a2e' },
          ].map(t => `
            <div onclick="Settings.setTheme('${t.id}')" style="cursor:pointer;padding:12px 20px;border-radius:10px;border:2px solid ${theme===t.id?'var(--primary)':'var(--border)'};background:${t.bg};color:${t.color};font-size:13px;font-weight:600;text-align:center;min-width:80px;transition:.2s">
              ${t.id === 'dark' ? '<i class="fa fa-moon" style="margin-right:6px"></i>' : '<i class="fa fa-sun" style="margin-right:6px"></i>'}${t.label}
            </div>
          `).join('')}
        </div>`,
        'Switch between dark and light themes')}
      ${this._settingRow('Accent Color',
        `<div style="display:flex;gap:8px;align-items:center">
          <input type="color" id="s-accent" value="${accent}" style="width:40px;height:34px;border:none;border-radius:8px;cursor:pointer;background:none">
          <span style="font-family:monospace;font-size:12px;color:var(--text-3)">${accent}</span>
        </div>`,
        'Primary color used throughout the interface')}
      ${this._settingRow('Sidebar Position',
        `<select class="form-control" id="s-sidebar-pos">
          <option value="left" ${sidebarPosition==='left'?'selected':''}>Left</option>
          <option value="right" ${sidebarPosition==='right'?'selected':''}>Right</option>
        </select>`, '')}
      ${this._settingRow('Compact Mode',
        `<label class="toggle-switch"><input type="checkbox" id="s-compact" ${this._getSetting('compactMode',false)?'checked':''}><span class="toggle-slider"></span></label>`,
        'Reduce spacing for more content density')}
    `, `<button class="btn btn-primary" onclick="Settings.saveAppearance()"><i class="fa fa-save"></i> Apply & Save</button>`);
  },

  setTheme(theme) {
    this._setSetting('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.renderSection();
    Toast.show(`Theme changed to ${theme} mode`, 'success');
  },

  saveAppearance() {
    this._setSetting('accentColor', document.getElementById('s-accent').value);
    this._setSetting('sidebarPosition', document.getElementById('s-sidebar-pos').value);
    this._setSetting('compactMode', document.getElementById('s-compact').checked);
    DB.log('UPDATE', 'Settings', 'Appearance settings updated', Auth.user?.id);
    Toast.show('Appearance settings saved!', 'success');
  },

  // ─── Backup & Restore ────────────────────────────
  renderBackup(c) {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('hrm_'));
    const totalSize = allKeys.reduce((s, k) => s + localStorage.getItem(k).length, 0);
    const lastBackup = this._getSetting('lastBackup', 'Never');

    c.innerHTML = this._sectionCard('Backup Data', 'Export all system data as a JSON file', `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        ${[
          { label: 'Data Tables', val: allKeys.length, icon: 'fa-database', color: 'var(--primary)' },
          { label: 'Storage Used', val: (totalSize / 1024).toFixed(1) + ' KB', icon: 'fa-hard-drive', color: 'var(--success)' },
          { label: 'Last Backup', val: lastBackup === 'Never' ? 'Never' : Utils.formatDate(lastBackup), icon: 'fa-clock-rotate-left', color: 'var(--warning)' },
        ].map(s => `
          <div style="background:var(--surface);border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:24px;color:${s.color};margin-bottom:8px"><i class="fa ${s.icon}"></i></div>
            <div style="font-size:18px;font-weight:800;color:${s.color}">${s.val}</div>
            <div style="font-size:11px;color:var(--text-3)">${s.label}</div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="Settings.exportBackup()"><i class="fa fa-download"></i> Download Full Backup</button>
        <button class="btn btn-ghost" onclick="Settings.exportBackup('employees')"><i class="fa fa-users"></i> Employees Only</button>
        <button class="btn btn-ghost" onclick="Settings.exportBackup('attendance')"><i class="fa fa-clock"></i> Attendance Only</button>
      </div>
    `) + this._sectionCard('Restore Data', 'Import data from a previously exported backup file', `
      <div style="border:2px dashed var(--border);border-radius:12px;padding:40px;text-align:center;margin-bottom:16px" id="drop-zone">
        <div style="font-size:36px;color:var(--text-muted);margin-bottom:12px"><i class="fa fa-cloud-arrow-up"></i></div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px">Drop backup file here or click to browse</div>
        <div style="font-size:12px;color:var(--text-muted)">Only .json files from HRM Pro backups are accepted</div>
        <input type="file" id="restore-file" accept=".json" style="display:none" onchange="Settings.handleRestore(this)">
        <button class="btn btn-ghost" style="margin-top:12px" onclick="document.getElementById('restore-file').click()"><i class="fa fa-folder-open"></i> Browse Files</button>
      </div>
      <div id="restore-preview" style="display:none"></div>
    `) + this._sectionCard('Danger Zone', 'Irreversible actions', `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:var(--danger)11;border:1px solid var(--danger)33;border-radius:10px">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--danger)">Reset All Data</div>
          <div style="font-size:12px;color:var(--text-3)">Delete all data and restore factory defaults. This cannot be undone.</div>
        </div>
        <button class="btn btn-danger" onclick="Settings.resetAll()"><i class="fa fa-trash"></i> Reset System</button>
      </div>
    `);
  },

  exportBackup(subset = null) {
    const data = {};
    const keys = Object.keys(localStorage).filter(k => k.startsWith('hrm_'));
    if (subset) {
      data[`hrm_${subset}`] = localStorage.getItem(`hrm_${subset}`);
    } else {
      keys.forEach(k => { data[k] = localStorage.getItem(k); });
    }
    const backup = {
      _meta: {
        app: 'HRM Pro',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: Auth.employee?.fullName || 'System',
        type: subset || 'full',
        tables: Object.keys(data).length,
      },
      data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrm-backup-${subset || 'full'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this._setSetting('lastBackup', new Date().toISOString());
    DB.log('BACKUP', 'Settings', `${subset || 'Full'} backup exported`, Auth.user?.id);
    Toast.show('Backup downloaded!', 'success', a.download);
    this.renderSection();
  },

  handleRestore(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup._meta || backup._meta.app !== 'HRM Pro') {
          Toast.show('Invalid backup file', 'error', 'This file is not a valid HRM Pro backup');
          return;
        }
        const preview = document.getElementById('restore-preview');
        const tables = Object.keys(backup.data).length;
        preview.style.display = 'block';
        preview.innerHTML = `
          <div class="card" style="border-color:var(--warning)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
              <div style="width:40px;height:40px;background:var(--warning)22;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--warning);font-size:18px"><i class="fa fa-file-import"></i></div>
              <div>
                <div style="font-size:14px;font-weight:700">Backup File Ready</div>
                <div style="font-size:12px;color:var(--text-3)">${file.name} • ${(file.size/1024).toFixed(1)} KB</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
              <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
                <div style="font-size:16px;font-weight:800;color:var(--primary)">${tables}</div>
                <div style="font-size:11px;color:var(--text-3)">Tables</div>
              </div>
              <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
                <div style="font-size:13px;font-weight:600;color:var(--accent)">${backup._meta.type}</div>
                <div style="font-size:11px;color:var(--text-3)">Type</div>
              </div>
              <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
                <div style="font-size:13px;font-weight:600;color:var(--success)">${Utils.formatDate(backup._meta.exportedAt?.split('T')[0])}</div>
                <div style="font-size:11px;color:var(--text-3)">Exported</div>
              </div>
            </div>
            <div class="alert alert-warning" style="margin-bottom:16px"><i class="fa fa-triangle-exclamation"></i> This will <strong>overwrite</strong> all existing data. Make sure to export a backup first!</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-warning" onclick="Settings.confirmRestore('${btoa(e.target.result).substring(0,50)}')"><i class="fa fa-upload"></i> Restore Now</button>
              <button class="btn btn-ghost" onclick="document.getElementById('restore-preview').style.display='none'">Cancel</button>
            </div>
          </div>
        `;
        // Store backup data temporarily
        Settings._pendingRestore = backup;
      } catch (err) {
        Toast.show('Failed to parse backup file', 'error', err.message);
      }
    };
    reader.readAsText(file);
  },

  confirmRestore() {
    if (!this._pendingRestore) return;
    Modal.confirm('Confirm Restore', 'This will <strong>replace ALL current data</strong> with the backup. This action cannot be undone. Are you sure?', () => {
      const backup = this._pendingRestore;
      Object.entries(backup.data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      this._pendingRestore = null;
      DB.log('RESTORE', 'Settings', 'System data restored from backup', Auth.user?.id);
      Toast.show('Data restored successfully!', 'success', 'Reloading system...');
      setTimeout(() => location.reload(), 1500);
    });
  },

  resetAll() {
    Modal.confirm('⚠️ Reset ALL Data', 'This will <strong>permanently delete ALL data</strong> including employees, attendance, payroll, and settings. The system will be restored to factory defaults.<br><br><strong>This action cannot be undone!</strong>', () => {
      DB.reset();
      DB.log('RESET', 'Settings', 'System reset to factory defaults', Auth.user?.id);
      Toast.show('System reset complete!', 'warning', 'Reloading...');
      setTimeout(() => location.reload(), 1500);
    }, 'danger');
  },

  // ─── System ───────────────────────────────────────
  renderSystem(c) {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('hrm_'));
    c.innerHTML = this._sectionCard('System Information', '', `
      ${[
        ['Application', 'HRM Pro v1.0.0'],
        ['Runtime', 'Client-side (localStorage)'],
        ['Browser', navigator.userAgent.split(' ').pop()],
        ['Platform', navigator.platform],
        ['Screen', `${screen.width}×${screen.height}`],
        ['LocalStorage Tables', allKeys.length],
        ['Storage Used', (allKeys.reduce((s,k) => s + localStorage.getItem(k).length, 0) / 1024).toFixed(1) + ' KB'],
        ['Storage Limit', '~5 MB'],
        ['Session', Auth.isLoggedIn ? `Active — ${Auth.employee?.fullName} (${Auth.role})` : 'Not logged in'],
      ].map(([l, v]) => `
        <div style="display:flex;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:200px;font-size:12.5px;color:var(--text-3);font-weight:500">${l}</div>
          <div style="font-size:13px;color:var(--text);font-family:monospace">${v}</div>
        </div>
      `).join('')}
    `) + this._sectionCard('Data Tables', 'All localStorage tables and their sizes', `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Table</th><th>Records</th><th>Size</th></tr></thead>
          <tbody>
            ${allKeys.sort().map(k => {
              const raw = localStorage.getItem(k);
              let count = '—';
              try { const p = JSON.parse(raw); count = Array.isArray(p) ? p.length : (typeof p === 'object' ? Object.keys(p).length : '—'); } catch {}
              return `<tr>
                <td style="font-family:monospace;font-size:12px;color:var(--primary)">${k}</td>
                <td>${count}</td>
                <td style="font-size:12px">${(raw.length / 1024).toFixed(2)} KB</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `);
  },
};
