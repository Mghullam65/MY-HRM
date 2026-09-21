const fs = require('fs');
const path = require('path');

console.log('Starting patch to embed Settlements inside Employees module...');

// 1. Patch js/employees.js
const empPath = path.join(__dirname, '../js/employees.js');
let empCode = fs.readFileSync(empPath, 'utf8').replace(/\r\n/g, '\n');

// 1.1 Update getActiveStage()
empCode = empCode.replace(
  `if (['dependents_events', 'exit_clearance'].includes(this.currentView)) return 'dependents_events';`,
  `if (['dependents_events', 'exit_clearance', 'settlement'].includes(this.currentView)) return 'dependents_events';`
);

// 1.2 Update staffAllowedViews and deptMgrAllowedViews
empCode = empCode.replace(
  `const staffAllowedViews = ['hr_letters', 'discipline', 'doc_expiry', 'edms', 'dependents_events', 'directory', 'orgchart', 'exit_clearance'];`,
  `const staffAllowedViews = ['hr_letters', 'discipline', 'doc_expiry', 'edms', 'dependents_events', 'directory', 'orgchart', 'exit_clearance', 'settlement'];`
);
empCode = empCode.replace(
  `const deptMgrAllowedViews = ['current', 'ex', 'all', 'orgchart', 'directory', 'edms', 'doc_expiry', 'hr_letters', 'discipline', 'dependents_events', 'exit_clearance'];`,
  `const deptMgrAllowedViews = ['current', 'ex', 'all', 'orgchart', 'directory', 'edms', 'doc_expiry', 'hr_letters', 'discipline', 'dependents_events', 'exit_clearance', 'settlement'];`
);

// 1.3 Add pendingSettlements count logic before tabs definition
const pendingSettlementCalc = `
    const allSettlements = DB.get('settlements') || [];
    const pendingSettlements = isStaff
      ? allSettlements.filter(s => s.employeeId === myEmpId && s.settlementStatus !== 'disbursed').length
      : allSettlements.filter(s => s.settlementStatus === 'under_clearance' || s.settlementStatus === 'draft').length;
    const stage4Badge = (pendingExits + pendingSettlements) || null;
`;

empCode = empCode.replace(
  `    const scopedAllEmps = Auth.getScopedEmployees(DB.get('employees') || []);`,
  `${pendingSettlementCalc}    const scopedAllEmps = Auth.getScopedEmployees(DB.get('employees') || []);`
);

// 1.4 Update Stage 4 tab labels and badge
empCode = empCode.replace(
  `{ id:'dependents_events', label:'Dependents & Exit Clearance (F&F)', icon:'fa-people-roof', badge: pendingExits || null },`,
  `{ id:'dependents_events', label:'Life Events, Exit & Settlements (F&F)', icon:'fa-people-roof', badge: stage4Badge },`
);
empCode = empCode.replace(
  `{ id:'dependents_events', label:'Life Events & Team Exits', icon:'fa-people-roof', badge: pendingExits || null },`,
  `{ id:'dependents_events', label:'Life Events, Exit & Settlements (F&F)', icon:'fa-people-roof', badge: stage4Badge },`
);
empCode = empCode.replace(
  `{ id:'dependents_events', label:'Life Events & Exit Clearance (F&F)', icon:'fa-people-roof', badge: pendingExits || null },`,
  `{ id:'dependents_events', label:'Life Events, Exit & Settlements (F&F)', icon:'fa-people-roof', badge: stage4Badge },`
);

// 1.5 Update Stage 4 sub-nav pills
const stage4OldSubNav = `        \` : this.getActiveStage() === 'dependents_events' ? \`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
              <button class="btn btn-sm \${this.currentView==='dependents_events'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('dependents_events')">
                <i class="fa fa-people-roof"></i> Dependents &amp; Life Events
              </button>
              <button class="btn btn-sm \${this.currentView==='exit_clearance'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('exit_clearance')">
                <i class="fa fa-user-minus"></i> Exit Clearance &amp; Handover (F&amp;F) \${pendingExits > 0 ? \`<span class="badge badge-warning" style="margin-left:4px;font-size:10px">\${pendingExits} Pending</span>\` : ''}
              </button>
            </div>
          </div>
        \` : ''}`;

const stage4NewSubNav = `        \` : this.getActiveStage() === 'dependents_events' ? \`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px;flex-wrap:wrap">
              <button class="btn btn-sm \${this.currentView==='dependents_events'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('dependents_events')">
                <i class="fa fa-people-roof"></i> Dependents &amp; Life Events
              </button>
              <button class="btn btn-sm \${this.currentView==='exit_clearance'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('exit_clearance')">
                <i class="fa fa-user-minus"></i> Exit Clearance &amp; Handover \${pendingExits > 0 ? \`<span class="badge badge-warning" style="margin-left:4px;font-size:10px">\${pendingExits} Pending</span>\` : ''}
              </button>
              <button class="btn btn-sm \${this.currentView==='settlement'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('settlement')">
                <i class="fa fa-file-invoice-dollar"></i> Full &amp; Final (F&amp;F) Settlements \${pendingSettlements > 0 ? \`<span class="badge badge-primary" style="margin-left:4px;font-size:10px">\${pendingSettlements}</span>\` : ''}
              </button>
            </div>
          </div>
        \` : ''}`;

empCode = empCode.replace(stage4OldSubNav, stage4NewSubNav);

// 1.6 Update filter-bar suppression to include 'settlement'
empCode = empCode.replace(
  `\${!['orgchart','doc_expiry','exit_clearance','hr_letters','dependents_events','edms','discipline'].includes(this.currentView) ? \``,
  `\${!['orgchart','doc_expiry','exit_clearance','hr_letters','dependents_events','edms','discipline','settlement'].includes(this.currentView) ? \``
);

// 1.7 In renderTable(), handle settlement view
const settlementTableHandler = `    if (this.currentView === 'settlement') {
      if (typeof Settlement !== 'undefined' && Settlement.render) {
        Settlement.render(container);
      } else {
        container.innerHTML = '<div class="empty-state"><i class="fa fa-file-invoice-dollar"></i><h3>Settlement Module</h3><p>Loading...</p></div>';
      }
      return;
    }\n`;

empCode = empCode.replace(
  `    if (this.currentView === 'exit_clearance') {`,
  `${settlementTableHandler}    if (this.currentView === 'exit_clearance') {`
);

fs.writeFileSync(empPath, empCode, 'utf8');
console.log('✅ Updated js/employees.js to integrate settlements view and navigation');

// 2. Patch js/settlement.js
const stlPath = path.join(__dirname, '../js/settlement.js');
let stlCode = fs.readFileSync(stlPath, 'utf8').replace(/\r\n/g, '\n');

// Update render() signature and container detection
stlCode = stlCode.replace(
  `  render() {
    const content = document.getElementById('page-content');
    if (!content) return;`,
  `  render(targetContainer) {
    let content = targetContainer;
    if (!content) {
      if (document.getElementById('emp-content') && (window.location.hash.includes('employees') || (typeof Employees !== 'undefined' && Employees.currentView === 'settlement'))) {
        content = document.getElementById('emp-content');
      } else {
        content = document.getElementById('page-content');
      }
    }
    if (!content) return;`
);

// Add id="settlement-tbody" to table tbody
stlCode = stlCode.replace(
  `              <tbody>
                \${this.renderTableRows(settlements)}
              </tbody>`,
  `              <tbody id="settlement-tbody">
                \${this.renderTableRows(settlements)}
              </tbody>`
);

// Update handleSearch and handleStatusFilter to target #settlement-tbody first
stlCode = stlCode.replace(
  `  handleSearch(val) {
    this.searchTerm = val;
    const tbody = document.querySelector('tbody');`,
  `  handleSearch(val) {
    this.searchTerm = val;
    const tbody = document.getElementById('settlement-tbody') || document.querySelector('tbody');`
);

stlCode = stlCode.replace(
  `  handleStatusFilter(val) {
    this.filterStatus = val;
    const tbody = document.querySelector('tbody');`,
  `  handleStatusFilter(val) {
    this.filterStatus = val;
    const tbody = document.getElementById('settlement-tbody') || document.querySelector('tbody');`
);

fs.writeFileSync(stlPath, stlCode, 'utf8');
console.log('✅ Updated js/settlement.js to support mounting inside #emp-content');

// 3. Patch js/auth.js (remove separate sidebar item)
const authPath = path.join(__dirname, '../js/auth.js');
let authCode = fs.readFileSync(authPath, 'utf8').replace(/\r\n/g, '\n');

authCode = authCode.replace(
  `      { id: 'settlement', label: 'Exit & Settlements', icon: 'fa-file-invoice-dollar', roles: ['superadmin','hr_manager','dept_manager'] },\n`,
  ``
);

fs.writeFileSync(authPath, authCode, 'utf8');
console.log('✅ Removed separate Exit & Settlements sidebar item from js/auth.js');

// 4. Patch js/app.js (route settlement to Employees Stage 4 settlement view)
const appPath = path.join(__dirname, '../js/app.js');
let appCode = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');

// In navigate(): update active sidebar nav item to highlight 'employees' when navigating to 'settlement'
appCode = appCode.replace(
  `    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.module === module);
    });`,
  `    // Update active nav item
    const activeSidebarMod = (module === 'settlement') ? 'employees' : module;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.module === activeSidebarMod);
    });`
);

// In module switch statement:
appCode = appCode.replace(
  `case 'settlement':    Settlement.render(); break;`,
  `case 'settlement':
            this.currentModule = 'employees';
            if (typeof Employees !== 'undefined') {
              Employees.currentView = 'settlement';
              Employees.render();
            } else if (typeof Settlement !== 'undefined') {
              Settlement.render();
            }
            break;`
);

fs.writeFileSync(appPath, appCode, 'utf8');
console.log('✅ Updated js/app.js to route settlement to Employees Stage 4 Settlements');

// 5. Patch scripts/verify-settlement-engine.js
const verPath = path.join(__dirname, 'verify-settlement-engine.js');
if (fs.existsSync(verPath)) {
  let verCode = fs.readFileSync(verPath, 'utf8').replace(/\r\n/g, '\n');
  verCode = verCode.replace(
    `assert(authCode.includes("'settlement'"), 'auth.js must register settlement in sidebar');`,
    `assert(empCode.includes("'settlement'"), 'employees.js must integrate settlement in Stage 4');`
  );
  if (!verCode.includes(`const empCode = fs.readFileSync(path.join(__dirname, '../js/employees.js'), 'utf8');`)) {
    verCode = verCode.replace(
      `const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');`,
      `const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');\n  const empCode = fs.readFileSync(path.join(__dirname, '../js/employees.js'), 'utf8');`
    );
  }
  fs.writeFileSync(verPath, verCode, 'utf8');
  console.log('✅ Updated scripts/verify-settlement-engine.js');
}

console.log('🎉 All files successfully patched!');
