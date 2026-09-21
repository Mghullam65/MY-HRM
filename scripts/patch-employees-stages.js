const fs = require('fs');

let code = fs.readFileSync('js/employees.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Add getActiveStage and isTabActive helper methods
const renderAnchor = `  render() {
    const content = document.getElementById('page-content');`;

const helpersAndRender = `  getActiveStage() {
    if (['current', 'ex', 'all', 'directory', 'orgchart'].includes(this.currentView)) return 'directory';
    if (['edms', 'doc_expiry'].includes(this.currentView)) return 'edms';
    if (['hr_letters', 'discipline'].includes(this.currentView)) return 'hr_letters';
    if (['dependents_events', 'exit_clearance'].includes(this.currentView)) return 'dependents_events';
    return 'directory';
  },

  isTabActive(tabId) {
    const active = this.getActiveStage();
    if (tabId === 'directory' || tabId === 'current') return active === 'directory';
    return active === tabId;
  },

  render() {
    const content = document.getElementById('page-content');`;

if (code.includes(renderAnchor)) {
  code = code.replace(renderAnchor, helpersAndRender);
  console.log('✅ Added getActiveStage and isTabActive helpers');
} else {
  console.log('⚠️ Could not find renderAnchor');
}

// 2. Expand staffAllowedViews and deptMgrAllowedViews to support all 4 stages
const allowedAnchor = `    // Staff role subtab access guard: redirect unallowed admin subtabs
    const staffAllowedViews = ['hr_letters', 'discipline', 'doc_expiry', 'edms', 'dependents_events', 'directory', 'orgchart'];
    if (isStaff && !staffAllowedViews.includes(this.currentView)) {
      this.currentView = 'hr_letters';
    }

    // Deputy Manager access guard: restricted strictly to employee lists and orgchart
    const deptMgrAllowedViews = ['current', 'ex', 'all', 'orgchart', 'directory'];
    if (isDeptMgr && !deptMgrAllowedViews.includes(this.currentView)) {
      this.currentView = 'current';
    }`;

const newAllowed = `    // Staff role subtab access guard: includes exit_clearance
    const staffAllowedViews = ['hr_letters', 'discipline', 'doc_expiry', 'edms', 'dependents_events', 'directory', 'orgchart', 'exit_clearance'];
    if (isStaff && !staffAllowedViews.includes(this.currentView)) {
      this.currentView = 'directory';
    }

    // Deputy Manager access guard: access to team views across the 4 stages
    const deptMgrAllowedViews = ['current', 'ex', 'all', 'orgchart', 'directory', 'edms', 'doc_expiry', 'hr_letters', 'discipline', 'dependents_events', 'exit_clearance'];
    if (isDeptMgr && !deptMgrAllowedViews.includes(this.currentView)) {
      this.currentView = 'current';
    }`;

if (code.includes(allowedAnchor)) {
  code = code.replace(allowedAnchor, newAllowed);
  console.log('✅ Updated allowed views for staff and dept managers');
} else {
  console.log('⚠️ Could not find allowedAnchor');
}

// 3. Update tabs definition in render()
const tabsAnchor = `    let tabs = [];
    if (isStaff) {
      tabs = [
        { id:'hr_letters', label:'My Official HR Letters', icon:'fa-file-signature', badge: (DB.get('hr_letters')||[]).filter(l=>l.employeeId===myEmpId && !l.acknowledged).length },
        { id:'discipline', label:'My Discipline & Notices', icon:'fa-gavel', badge: pendingDiscipline },
        { id:'doc_expiry', label:'My Document Expiries', icon:'fa-id-card-clip', badge: urgentDocs },
        { id:'exit_clearance', label:'Resignation & Exit (F&F)', icon:'fa-person-walking-arrow-right', badge: pendingExits || null },
        { id:'edms', label:'e-DMS Document Vault', icon:'fa-folder-open', badge: (DB.get('employee_documents')||[]).filter(d=>d.employeeId===myEmpId && d.verificationStatus==='pending').length },
        { id:'dependents_events', label:'Dependents & Life Events', icon:'fa-people-roof' },
        { id:'directory', label:'Company Directory', icon:'fa-id-card' },
        { id:'orgchart', label:'Org Chart', icon:'fa-sitemap' },
      ];
    } else if (isDeptMgr) {
      // Deputy Manager only sees employee rosters and orgchart
      tabs = [
        { id:'current', label:'Active Employees', icon:'fa-user-check', badge: activeCount },
        { id:'ex', label:'Ex Employees', icon:'fa-user-xmark', badge: exCount },
        { id:'all', label:'All Employees (Active & Ex)', icon:'fa-users', badge: totalCount },
        { id:'orgchart', label:'Team Org Chart', icon:'fa-sitemap' },
        { id:'directory', label:'Team Directory', icon:'fa-id-card' },
      ];
    } else {
      // Admin & HR: Primary 3 types of employees requested by user: Active, Ex, All (Active & Ex)
      tabs = [
        { id:'current', label:'Active Employees', icon:'fa-user-check', badge: activeCount },
        { id:'ex', label:'Ex Employees', icon:'fa-user-xmark', badge: exCount },
        { id:'all', label:'All Employees (Active & Ex)', icon:'fa-users', badge: totalCount },
        { id:'directory', label:'Directory Cards', icon:'fa-id-card' },
        { id:'orgchart', label:'Org Chart', icon:'fa-sitemap' },
        { id:'doc_expiry', label:'Document Expiry', icon:'fa-id-card-clip', badge: urgentDocs },
        { id:'exit_clearance', label:'Exit & Clearance (F&F)', icon:'fa-user-minus', badge: pendingExits },
        { id:'discipline', label:'Discipline & Compliance', icon:'fa-gavel', badge: pendingDiscipline },
        { id:'hr_letters', label:'HR Letters', icon:'fa-file-signature' },
        { id:'dependents_events', label:'Dependents & Life Events', icon:'fa-people-roof', badge: (DB.get('life_events')||[]).filter(e=>e.status==='pending').length },
        { id:'edms', label:'e-DMS Document Vault', icon:'fa-folder-open', badge: (DB.get('employee_documents')||[]).filter(d=>d.verificationStatus==='pending').length },
      ];
    }`;

const newTabs = `    // Role-specific Tab Navigation: 4 Clean Lifecycle Stages
    let tabs = [];
    if (isStaff) {
      tabs = [
        { id:'directory',         label:'Directory & Org Chart', icon:'fa-users' },
        { id:'edms',              label:'My Document Vault & Expiries', icon:'fa-folder-open', badge: urgentDocs || null },
        { id:'hr_letters',        label:'My Letters & Disciplinary Notices', icon:'fa-file-signature', badge: pendingDiscipline || null },
        { id:'dependents_events', label:'Dependents & Exit Clearance (F&F)', icon:'fa-people-roof', badge: pendingExits || null },
      ];
    } else if (isDeptMgr) {
      tabs = [
        { id:'directory',         label:'Team Directory & Hierarchy', icon:'fa-users', badge: totalCount },
        { id:'edms',              label:'Team Documents & Expiries', icon:'fa-folder-open', badge: urgentDocs || null },
        { id:'hr_letters',        label:'Official Letters & Compliance', icon:'fa-file-signature', badge: pendingDiscipline || null },
        { id:'dependents_events', label:'Life Events & Team Exits', icon:'fa-people-roof', badge: pendingExits || null },
      ];
    } else {
      // Super Admin & HR Manager: 4 Clean Lifecycle Stages
      tabs = [
        { id:'directory',         label:'Directory & Hierarchy', icon:'fa-users', badge: totalCount },
        { id:'edms',              label:'Document Vault & Compliance', icon:'fa-folder-open', badge: urgentDocs || null },
        { id:'hr_letters',        label:'Official Letters & Disciplinary Hub', icon:'fa-file-signature', badge: pendingDiscipline || null },
        { id:'dependents_events', label:'Life Events & Exit Clearance (F&F)', icon:'fa-people-roof', badge: pendingExits || null },
      ];
    }`;

if (code.includes(tabsAnchor)) {
  code = code.replace(tabsAnchor, newTabs);
  console.log('✅ Updated Tabs definition to 4 clean stages');
} else {
  console.log('⚠️ Could not find tabsAnchor');
}

// 4. Update tab button markup and insert Stage Sub-Navigation in render()
const subTabsAnchor = `        <!-- Sub-tabs -->
        <div style="display:flex;gap:4px;margin-bottom:20px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;flex-wrap:wrap">
          \${tabs.map(t => \`
            <button class="tab-toggle-btn \${this.currentView === t.id ? 'active' : ''}" onclick="Employees.switchView('\${t.id}')">
              <i class="fa \${t.icon}" style="margin-right:6px"></i>\${t.label}
              \${t.badge !== undefined && t.badge !== null ? \`<span class="badge \${t.id==='ex'?'badge-danger':t.id==='current'?'badge-success':t.id==='all'?'badge-primary':'badge-warning'}" style="margin-left:6px;font-size:10px;padding:2px 6px">\${t.badge}</span>\` : ''}
            </button>
          \`).join('')}
        </div>`;

const newSubTabsAndPillNav = `        <!-- View Tabs: 4 Clean Lifecycle Stages -->
        <div style="display:flex;gap:6px;margin-bottom:20px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;flex-wrap:wrap">
          \${tabs.map(t => \`
            <button class="tab-toggle-btn \${this.isTabActive(t.id) ? 'active' : ''}" data-tab="\${t.id}" onclick="Employees.switchView('\${t.id}')">
              <i class="fa \${t.icon}" style="margin-right:6px"></i>\${t.label}
              \${t.badge !== undefined && t.badge !== null ? \`<span class="badge badge-primary" style="margin-left:6px;font-size:10px;padding:2px 6px">\${t.badge}</span>\` : ''}
            </button>
          \`).join('')}
        </div>

        <!-- Stage Sub-Navigation -->
        \${this.getActiveStage() === 'directory' ? \`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
              <button class="btn btn-sm \${['current','ex','all'].includes(this.currentView)?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('current')">
                <i class="fa fa-list"></i> Employee Roster
              </button>
              <button class="btn btn-sm \${this.currentView==='directory'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('directory')">
                <i class="fa fa-id-card"></i> Directory Cards
              </button>
              <button class="btn btn-sm \${this.currentView==='orgchart'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('orgchart')">
                <i class="fa fa-sitemap"></i> Organization Chart
              </button>
            </div>
            \${['current','ex','all'].includes(this.currentView) ? \`
              <div style="display:flex;gap:6px;align-items:center">
                <span style="font-size:11.5px;color:var(--text-3);font-weight:600">Roster Filter:</span>
                <div style="display:flex;gap:4px;background:var(--surface);padding:3px;border-radius:8px;border:1px solid var(--border)">
                  <button class="btn btn-xs \${this.currentView==='current'?'btn-success':'btn-ghost'}" onclick="Employees.switchView('current')">Active (\${activeCount})</button>
                  <button class="btn btn-xs \${this.currentView==='ex'?'btn-danger':'btn-ghost'}" onclick="Employees.switchView('ex')">Ex-Staff (\${exCount})</button>
                  <button class="btn btn-xs \${this.currentView==='all'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('all')">All (\${totalCount})</button>
                </div>
              </div>
            \` : ''}
          </div>
        \` : this.getActiveStage() === 'edms' ? \`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
              <button class="btn btn-sm \${this.currentView==='edms'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('edms')">
                <i class="fa fa-folder-open"></i> e-DMS Document Vault
              </button>
              <button class="btn btn-sm \${this.currentView==='doc_expiry'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('doc_expiry')">
                <i class="fa fa-id-card-clip"></i> Document Expiries &amp; Alerts \${urgentDocs > 0 ? \`<span class="badge badge-warning" style="margin-left:4px;font-size:10px">\${urgentDocs} Urgent</span>\` : ''}
              </button>
            </div>
          </div>
        \` : this.getActiveStage() === 'hr_letters' ? \`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
              <button class="btn btn-sm \${this.currentView==='hr_letters'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('hr_letters')">
                <i class="fa fa-file-signature"></i> Official HR Letters
              </button>
              <button class="btn btn-sm \${this.currentView==='discipline'?'btn-primary':'btn-ghost'}" onclick="Employees.switchView('discipline')">
                <i class="fa fa-gavel"></i> Discipline &amp; Compliance \${pendingDiscipline > 0 ? \`<span class="badge badge-danger" style="margin-left:4px;font-size:10px">\${pendingDiscipline} Pending</span>\` : ''}
              </button>
            </div>
          </div>
        \` : this.getActiveStage() === 'dependents_events' ? \`
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

if (code.includes(subTabsAnchor)) {
  code = code.replace(subTabsAnchor, newSubTabsAndPillNav);
  console.log('✅ Added Stage Sub-Navigation and updated view tabs markup');
} else {
  console.log('⚠️ Could not find subTabsAnchor');
}

fs.writeFileSync('js/employees.js', code, 'utf8');
console.log('🎉 Successfully patched Employees into 4 clean lifecycle stages!');
