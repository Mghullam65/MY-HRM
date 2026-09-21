const fs = require('fs');

let code = fs.readFileSync('js/leaves.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Add isTabActive method before switchView
const switchViewAnchor = `  switchView(view) {
    if (view === 'types') {`;

const isTabActiveCode = `  isTabActive(tabId) {
    if (tabId === 'requests') return this.currentView === 'requests';
    if (tabId === 'calendar') return ['calendar', 'holidays'].includes(this.currentView);
    if (tabId === 'quota') return ['quota', 'balance', 'types'].includes(this.currentView);
    if (tabId === 'tokens') return this.currentView === 'tokens';
    return this.currentView === tabId;
  },

  switchView(view) {
    if (view === 'types') {`;

if (code.includes(switchViewAnchor)) {
  code = code.replace(switchViewAnchor, isTabActiveCode);
  console.log('✅ Added isTabActive method');
} else {
  console.log('⚠️ Could not find switchViewAnchor');
}

// 2. Update tabs in render()
const tabsAnchor = `        <!-- Tabs -->
        <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border);flex-wrap:wrap">
          \${[
            { id:'requests', label:'Leave Requests', icon:'fa-list' },
            { id:'calendar', label:'Leave Calendar', icon:'fa-calendar' },
            { id:'quota',    label:'Leave Quota & Balance',  icon:'fa-scale-balanced' },
            { id:'tokens',   label:'Overtime Tokens', icon:'fa-coins' },
            { id:'holidays', label:'Holidays',       icon:'fa-calendar-days' },
          ].map(t => \`
            <button class="tab-toggle-btn \${this.currentView===t.id?'active':''}" onclick="Leaves.switchView('\${t.id}')">
              <i class="fa \${t.icon}" style="margin-right:6px"></i>\${t.label}
            </button>
          \`).join('')}
        </div>`;

const newTabsCode = `        <!-- View Tabs: 4 Clean Lifecycle Stages -->
        <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border);flex-wrap:wrap">
          \${[
            { id:'requests', label:'Leave Requests & Approvals', icon:'fa-calendar-check', badge: pending > 0 ? pending : null },
            { id:'calendar', label:'Leave & Holiday Calendar',   icon:'fa-calendar-days' },
            { id:'quota',    label:'Leave Quotas & Policies',    icon:'fa-scale-balanced' },
            { id:'tokens',   label:'Comp-Off & Overtime Tokens', icon:'fa-coins' },
          ].map(t => \`
            <button class="tab-toggle-btn \${this.isTabActive(t.id)?'active':''}" data-tab="\${t.id}" onclick="Leaves.switchView('\${t.id}')">
              <i class="fa \${t.icon}" style="margin-right:6px"></i>\${t.label} \${t.badge ? \`<span class="badge badge-warning" style="margin-left:5px;font-size:10px;padding:2px 6px">\${t.badge}</span>\` : ''}
            </button>
          \`).join('')}
        </div>`;

if (code.includes(tabsAnchor)) {
  code = code.replace(tabsAnchor, newTabsCode);
  console.log('✅ Updated Tabs to 4 clean lifecycle stages');
} else {
  console.log('⚠️ Could not find tabsAnchor');
}

// 3. Update switchView button active updater
const switchViewBtnAnchor = `    document.querySelectorAll('[onclick*="Leaves.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\\w+)'/);
      if (m) b.classList.toggle('active', m[1] === this.currentView);
    });`;

const newSwitchViewBtnCode = `    document.querySelectorAll('.tab-toggle-btn[data-tab]').forEach(b => {
      const tabId = b.getAttribute('data-tab');
      if (tabId) b.classList.toggle('active', this.isTabActive(tabId));
    });`;

if (code.includes(switchViewBtnAnchor)) {
  code = code.replace(switchViewBtnAnchor, newSwitchViewBtnCode);
  console.log('✅ Updated switchView active state toggle');
} else {
  console.log('⚠️ Could not find switchViewBtnAnchor');
}

// 4. Add Stage 2 Sub-Nav in renderCalendar
const renderCalAnchor = `    container.innerHTML = \`
      <div class="card" style="padding:20px">
        <!-- Top Controls Bar -->`;

const renderCalSubNav = `    container.innerHTML = \`
      <!-- Stage 2 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm \${this.currentView==='calendar'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('calendar')">
            <i class="fa fa-calendar-days"></i> Leave Calendar &amp; Matrix
          </button>
          <button class="btn btn-sm \${this.currentView==='holidays'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('holidays')">
            <i class="fa fa-umbrella-beach"></i> Corporate Holidays (\${holidays.length})
          </button>
        </div>
        \${!isDeptMgr ? \`<button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-plus"></i> Apply Leave</button>\` : ''}
      </div>

      <div class="card" style="padding:20px">
        <!-- Top Controls Bar -->`;

if (code.includes(renderCalAnchor)) {
  code = code.replace(renderCalAnchor, renderCalSubNav);
  console.log('✅ Added Stage 2 Sub-Nav to renderCalendar');
} else {
  console.log('⚠️ Could not find renderCalAnchor');
}

// 5. Add Stage 2 Sub-Nav in renderYearMatrix
const yearMatrixAnchor = `    container.innerHTML = \`
      <div class="card" style="padding:22px">
        <!-- Top Controls Bar -->`;

const yearMatrixSubNav = `    container.innerHTML = \`
      <!-- Stage 2 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm \${this.currentView==='calendar'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('calendar')">
            <i class="fa fa-calendar-days"></i> Leave Calendar &amp; Matrix
          </button>
          <button class="btn btn-sm \${this.currentView==='holidays'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('holidays')">
            <i class="fa fa-umbrella-beach"></i> Corporate Holidays (\${holidays.length})
          </button>
        </div>
        \${!isDeptMgr ? \`<button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-plus"></i> Apply Leave</button>\` : ''}
      </div>

      <div class="card" style="padding:22px">
        <!-- Top Controls Bar -->`;

if (code.includes(yearMatrixAnchor)) {
  code = code.replace(yearMatrixAnchor, yearMatrixSubNav);
  console.log('✅ Added Stage 2 Sub-Nav to renderYearMatrix');
} else {
  console.log('⚠️ Could not find yearMatrixAnchor');
}

// 6. Add Stage 2 Sub-Nav in renderHolidays
const holidaysAnchor = `  renderHolidays(container) {
    const holidays = DB.get('holidays').sort((a,b) => a.date.localeCompare(b.date));
    const today = Utils.today();
    container.innerHTML = \`
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        \${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? \`<button class="btn btn-primary btn-sm" onclick="Leaves.showAddHoliday()"><i class="fa fa-plus"></i> Add Holiday</button>\` : ''}
      </div>`;

const holidaysSubNav = `  renderHolidays(container) {
    const holidays = DB.get('holidays').sort((a,b) => a.date.localeCompare(b.date));
    const today = Utils.today();
    container.innerHTML = \`
      <!-- Stage 2 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm \${this.currentView==='calendar'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('calendar')">
            <i class="fa fa-calendar-days"></i> Leave Calendar &amp; Matrix
          </button>
          <button class="btn btn-sm \${this.currentView==='holidays'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('holidays')">
            <i class="fa fa-umbrella-beach"></i> Corporate Holidays (\${holidays.length})
          </button>
        </div>
        \${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? \`<button class="btn btn-primary btn-sm" onclick="Leaves.showAddHoliday()"><i class="fa fa-plus"></i> Add Holiday</button>\` : ''}
      </div>`;

if (code.includes(holidaysAnchor)) {
  code = code.replace(holidaysAnchor, holidaysSubNav);
  console.log('✅ Added Stage 2 Sub-Nav to renderHolidays');
} else {
  console.log('⚠️ Could not find holidaysAnchor');
}

// 7. Null safety guard in getEmployeeLeaveQuotaMetrics
const quotaMetricsAnchor = `  getEmployeeLeaveQuotaMetrics(emp, year = 2026) {
    const allApprovedLeaves = (DB.get('leave_requests') || []).filter(l => l.employeeId === emp.id && l.status === 'approved' && ((l.from && l.from.startsWith(String(year))) || (l.to && l.to.startsWith(String(year)))));`;

const quotaMetricsGuard = `  getEmployeeLeaveQuotaMetrics(emp, year = 2026) {
    if (!emp || !emp.id) return null;
    const allApprovedLeaves = (DB.get('leave_requests') || []).filter(l => l.employeeId === emp.id && l.status === 'approved' && ((l.from && l.from.startsWith(String(year))) || (l.to && l.to.startsWith(String(year)))));`;

if (code.includes(quotaMetricsAnchor)) {
  code = code.replace(quotaMetricsAnchor, quotaMetricsGuard);
  console.log('✅ Added null safety guard to getEmployeeLeaveQuotaMetrics');
} else {
  console.log('⚠️ Could not find quotaMetricsAnchor');
}

// 8. Null safety guard in renderQuota for employee profile
const renderQuotaEmpAnchor = `      const myEmp = Auth.employee || allEmps.find(e => e.id === Auth.user?.employeeId) || allEmps[0];
      const myRow = this.getEmployeeLeaveQuotaMetrics(myEmp, this.quotaYear || 2026);
      myRow.sr = 1;`;

const renderQuotaEmpGuard = `      const myEmp = Auth.employee || allEmps.find(e => e.id === Auth.user?.employeeId) || allEmps[0];
      if (!myEmp) {
        container.innerHTML = \`<div class="card"><div class="empty-state" style="padding:60px"><i class="fa fa-user-slash"></i><h3>No Employee Profile Found</h3><p>Your user account is not linked to an active employee profile.</p></div></div>\`;
        return;
      }
      const myRow = this.getEmployeeLeaveQuotaMetrics(myEmp, this.quotaYear || 2026) || {};
      myRow.sr = 1;`;

if (code.includes(renderQuotaEmpAnchor)) {
  code = code.replace(renderQuotaEmpAnchor, renderQuotaEmpGuard);
  console.log('✅ Added null safety guard in renderQuota');
} else {
  console.log('⚠️ Could not find renderQuotaEmpAnchor');
}

fs.writeFileSync('js/leaves.js', code, 'utf8');
console.log('🎉 Successfully patched Leaves into 4 clean lifecycle stages!');
