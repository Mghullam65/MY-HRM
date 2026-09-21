const fs = require('fs');

let code = fs.readFileSync('js/attendance.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Add isTabActive method before switchView
const switchViewAnchor = `  switchView(view) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';`;

const isTabActiveCode = `  isTabActive(tabId) {
    if (tabId === 'my_attendance') return this.currentView === 'my_attendance';
    if (tabId === 'my_employees') return ['my_employees', 'machine', 'manual', 'daily', 'monthly', 'employee', 'dept'].includes(this.currentView);
    if (tabId === 'roster') return ['roster', 'geofence'].includes(this.currentView);
    if (tabId === 'corrections') return ['corrections', 'timesheets'].includes(this.currentView);
    return this.currentView === tabId;
  },

  switchView(view) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';`;

if (code.includes(switchViewAnchor)) {
  code = code.replace(switchViewAnchor, isTabActiveCode);
  console.log('✅ Added isTabActive method');
} else {
  console.log('⚠️ Could not find switchViewAnchor');
}

// 2. Update tabs definitions in render()
const tabsAnchor = `    // Role-specific Tab Navigation (Strictly scoping attendance views)
    let tabs = [];
    if (isEmployee) {
      tabs = [
        { id:'my_attendance', label:'My Attendance' },
        { id:'machine',       label:'My Machine Punch Logs', icon:'fa-fingerprint' },
        { id:'corrections',   label:'Corrections & WFH', badge: pendingCorrections },
        { id:'timesheets',    label:'Project Timesheets & Billing', badge: (DB.get('timesheets')||[]).filter(t=>t.employeeId===myEmpId && t.status==='submitted').length },
      ];
    } else if (isManager) {
      tabs = [
        { id:'my_attendance',  label:'My Attendance' },
        { id:'my_employees',   label:'My Employees Attendance', icon: 'fa-users-line' },
        { id:'machine',        label:'Team Machine Punch Logs', icon: 'fa-fingerprint' },
        { id:'roster',         label:'Shift Roster & Swaps', badge: pendingSwaps },
        { id:'timesheets',     label:'Project Timesheets & Billing', badge: (DB.get('timesheets')||[]).filter(t=>scopedIds.includes(t.employeeId) && t.status==='submitted').length },
        { id:'corrections',    label:'Corrections & WFH', badge: pendingCorrections },
      ];
    } else {
      // Super Admin and HR Manager
      tabs = [
        { id:'my_attendance', label:'My Attendance' },
        { id:'my_employees',  label:'My Employees Attendance', icon: 'fa-users-line' },
        { id:'machine',       label:'Biometric Machine Punch Hub', icon:'fa-fingerprint' },
        { id:'roster',        label:'Shift Roster & Swaps', badge: pendingSwaps },
        { id:'geofence',      label:'Geo-Fence & IP Check' },
        { id:'timesheets',    label:'Project Timesheets & Billing', badge: (DB.get('timesheets')||[]).filter(t=>t.status==='submitted').length },
        { id:'manual',        label:'Manual Entry' },
        { id:'corrections',   label:'Corrections & WFH', badge: pendingCorrections },
      ];
    }`;

const newTabsCode = `    // Role-specific Tab Navigation: 4 Clean Lifecycle Stages
    let tabs = [];
    if (isEmployee) {
      tabs = [
        { id:'my_attendance', label:'My Attendance & Punch', icon:'fa-user-clock' },
        { id:'machine',       label:'My Machine Logs', icon:'fa-fingerprint' },
        { id:'corrections',   label:'Regularization & Timesheets', icon:'fa-clipboard-check', badge: pendingCorrections },
      ];
    } else if (isManager) {
      tabs = [
        { id:'my_attendance',  label:'My Attendance & Punch', icon:'fa-user-clock' },
        { id:'my_employees',   label:'Team Attendance & Biometrics', icon:'fa-users-line' },
        { id:'roster',         label:'Shift Rosters & Swaps', icon:'fa-calendar-days', badge: pendingSwaps },
        { id:'corrections',    label:'Regularization & Timesheets', icon:'fa-clipboard-check', badge: pendingCorrections },
      ];
    } else {
      // Super Admin and HR Manager
      tabs = [
        { id:'my_attendance', label:'My Attendance & Punch', icon:'fa-user-clock' },
        { id:'my_employees',  label:'Attendance Register & Biometrics', icon:'fa-users-line' },
        { id:'roster',        label:'Shift Rosters & Work Rules', icon:'fa-calendar-days', badge: pendingSwaps },
        { id:'corrections',   label:'Regularization & Timesheets', icon:'fa-clipboard-check', badge: pendingCorrections },
      ];
    }`;

if (code.includes(tabsAnchor)) {
  code = code.replace(tabsAnchor, newTabsCode);
  console.log('✅ Updated tabs array to 4 clean lifecycle stages');
} else {
  console.log('⚠️ Could not find tabsAnchor');
}

// 3. Update Tab Button rendering in render()
const tabBtnAnchor = `        <!-- View Tabs + Actions -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;flex-wrap:wrap">
            \${tabs.map(t => \`
              <button class="tab-toggle-btn \${this.currentView===t.id?'active':''}" onclick="Attendance.switchView('\${t.id}')">
                \${t.label} \${t.badge ? \`<span class="badge badge-warning" style="margin-left:5px;font-size:10px;padding:2px 6px">\${t.badge}</span>\` : ''}
              </button>
            \`).join('')}
          </div>`;

const newTabBtnCode = `        <!-- View Tabs: 4 Clean Lifecycle Stages -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;flex-wrap:wrap">
            \${tabs.map(t => \`
              <button class="tab-toggle-btn \${this.isTabActive(t.id)?'active':''}" data-tab="\${t.id}" onclick="Attendance.switchView('\${t.id}')">
                <i class="fa \${t.icon}" style="margin-right:6px"></i>\${t.label} \${t.badge ? \`<span class="badge badge-warning" style="margin-left:5px;font-size:10px;padding:2px 6px">\${t.badge}</span>\` : ''}
              </button>
            \`).join('')}
          </div>`;

if (code.includes(tabBtnAnchor)) {
  code = code.replace(tabBtnAnchor, newTabBtnCode);
  console.log('✅ Updated Tab button markup to use isTabActive and icons');
} else {
  console.log('⚠️ Could not find tabBtnAnchor');
}

// 4. Update switchView button active state updater
const switchViewActiveAnchor = `    // Re-identify buttons by their onclick
    document.querySelectorAll('[onclick*="Attendance.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'([^']+)'/);
      if (m) b.classList.toggle('active', m[1] === view);
    });`;

const newSwitchViewActiveCode = `    // Update active state on tab toggle buttons
    document.querySelectorAll('.tab-toggle-btn[data-tab]').forEach(b => {
      const tabId = b.getAttribute('data-tab');
      if (tabId) b.classList.toggle('active', this.isTabActive(tabId));
    });`;

if (code.includes(switchViewActiveAnchor)) {
  code = code.replace(switchViewActiveAnchor, newSwitchViewActiveCode);
  console.log('✅ Updated switchView active state toggle');
} else {
  console.log('⚠️ Could not find switchViewActiveAnchor');
}

// 5. Stage 2 Sub-Nav in renderMyEmployeesAttendance
const myEmpAnchor = `    container.innerHTML = \`
      <div class="animate-fade-in">
        <!-- Header & Dropdown Filter Control Bar -->`;

const myEmpSubNav = `    container.innerHTML = \`
      <div class="animate-fade-in">
        <!-- Stage 2 Sub-Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
            <button class="btn btn-sm \${this.currentView==='my_employees'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('my_employees')">
              <i class="fa fa-users-line"></i> 4-in-1 Attendance Register
            </button>
            <button class="btn btn-sm \${this.currentView==='machine'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('machine')">
              <i class="fa fa-fingerprint"></i> Biometric Machine Hub
            </button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            \${isAdmin ? \`<button class="btn btn-secondary btn-sm" onclick="Attendance.showBulkAttendance()"><i class="fa fa-users-line"></i> Bulk Mark</button>\` : ''}
            \${isAdmin ? \`<button class="btn btn-primary btn-sm" onclick="Attendance.showMarkAttendance()"><i class="fa fa-plus"></i> Mark Attendance</button>\` : ''}
            <button class="btn btn-ghost btn-sm" onclick="Attendance.exportAttendance()"><i class="fa fa-file-export"></i> Export CSV</button>
          </div>
        </div>

        <!-- Header & Dropdown Filter Control Bar -->`;

if (code.includes(myEmpAnchor)) {
  code = code.replace(myEmpAnchor, myEmpSubNav);
  console.log('✅ Added Stage 2 Sub-Nav to renderMyEmployeesAttendance');
} else {
  console.log('⚠️ Could not find myEmpAnchor');
}

// 6. Stage 2 Sub-Nav in renderMachineLog
const machineAnchor = `    container.innerHTML = \`
      <!-- Header Banner & Scoping Notice -->`;

const machineSubNav = `    container.innerHTML = \`
      <!-- Stage 2 Sub-Navigation -->
      \${!isEmployee ? \`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
            <button class="btn btn-sm \${this.currentView==='my_employees'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('my_employees')">
              <i class="fa fa-users-line"></i> 4-in-1 Attendance Register
            </button>
            <button class="btn btn-sm \${this.currentView==='machine'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('machine')">
              <i class="fa fa-fingerprint"></i> Biometric Machine Hub
            </button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            \${isAdmin ? \`<button class="btn btn-secondary btn-sm" onclick="Attendance.showZKTecoUploadModal()"><i class="fa fa-file-import"></i> Import ZKTeco Log</button>\` : ''}
            <button class="btn btn-ghost btn-sm" onclick="Attendance.exportMachineLogs()"><i class="fa fa-file-export"></i> Export Logs</button>
          </div>
        </div>
      \` : ''}

      <!-- Header Banner & Scoping Notice -->`;

if (code.includes(machineAnchor)) {
  code = code.replace(machineAnchor, machineSubNav);
  console.log('✅ Added Stage 2 Sub-Nav to renderMachineLog');
} else {
  console.log('⚠️ Could not find machineAnchor');
}

// 7. Stage 3 Sub-Nav in renderShiftRoster
const rosterAnchor = `    container.innerHTML = \`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">`;

const rosterSubNav = `    container.innerHTML = \`
      <!-- Stage 3 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm \${this.currentView==='roster'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('roster')">
            <i class="fa fa-calendar-days"></i> Shift Rosters &amp; Swaps
          </button>
          \${!isEmployee && !isManager ? \`
            <button class="btn btn-sm \${this.currentView==='geofence'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('geofence')">
              <i class="fa fa-location-dot"></i> Geo-Fence &amp; IP Rules
            </button>
            <button class="btn btn-sm btn-ghost" onclick="Attendance.showTimeInWindowConfig()">
              <i class="fa fa-clock"></i> Time-In Windows
            </button>
          \` : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          \${!isEmployee ? \`<button class="btn btn-primary btn-sm" onclick="Attendance.showAssignShiftModal()"><i class="fa fa-plus"></i> Assign Shift</button>\` : ''}
          <button class="btn btn-secondary btn-sm" onclick="Attendance.showRequestSwapModal()"><i class="fa fa-right-left"></i> Request Shift Swap</button>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">`;

if (code.includes(rosterAnchor)) {
  code = code.replace(rosterAnchor, rosterSubNav);
  console.log('✅ Added Stage 3 Sub-Nav to renderShiftRoster');
} else {
  console.log('⚠️ Could not find rosterAnchor');
}

// 8. Stage 3 Sub-Nav in renderGeoFenceValidation
const geofenceAnchor = `    container.innerHTML = \`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(16,185,129,0.12);color:var(--success)">
              <i class="fa fa-location-dot"></i>
            </span>
            Geo-Fencing &amp; Corporate IP Clock-In Validation`;

const geofenceSubNav = `    container.innerHTML = \`
      <!-- Stage 3 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm \${this.currentView==='roster'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('roster')">
            <i class="fa fa-calendar-days"></i> Shift Rosters &amp; Swaps
          </button>
          <button class="btn btn-sm \${this.currentView==='geofence'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('geofence')">
            <i class="fa fa-location-dot"></i> Geo-Fence &amp; IP Rules
          </button>
          <button class="btn btn-sm btn-ghost" onclick="Attendance.showTimeInWindowConfig()">
            <i class="fa fa-clock"></i> Time-In Windows
          </button>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="Attendance.testIPWhitelist()"><i class="fa fa-network-wired"></i> Test IP Whitelist</button>
          <button class="btn btn-primary btn-sm" onclick="Attendance.testCurrentGPSLocation()"><i class="fa fa-crosshairs"></i> Test GPS Perimeter</button>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(16,185,129,0.12);color:var(--success)">
              <i class="fa fa-location-dot"></i>
            </span>
            Geo-Fencing &amp; Corporate IP Clock-In Validation`;

if (code.includes(geofenceAnchor)) {
  code = code.replace(geofenceAnchor, geofenceSubNav);
  console.log('✅ Added Stage 3 Sub-Nav to renderGeoFenceValidation');
} else {
  console.log('⚠️ Could not find geofenceAnchor');
}

// 9. Stage 4 Sub-Nav in renderCorrections
const correctionsAnchor = `    container.innerHTML = \`
      <div class="card" style="padding:0">`;

const correctionsSubNav = `    container.innerHTML = \`
      <!-- Stage 4 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm \${this.currentView==='corrections'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('corrections')">
            <i class="fa fa-clipboard-check"></i> Attendance Regularization &amp; WFH
          </button>
          <button class="btn btn-sm \${this.currentView==='timesheets'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('timesheets')">
            <i class="fa fa-business-time"></i> Project Timesheets &amp; Billing
          </button>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Attendance.showApplyCorrectionModal()">
          <i class="fa fa-plus"></i> Apply Correction / WFH
        </button>
      </div>

      <div class="card" style="padding:0">`;

if (code.includes(correctionsAnchor)) {
  code = code.replace(correctionsAnchor, correctionsSubNav);
  console.log('✅ Added Stage 4 Sub-Nav to renderCorrections');
} else {
  console.log('⚠️ Could not find correctionsAnchor');
}

// 10. Stage 4 Sub-Nav in renderTimesheets
const timesheetAnchor = `    container.innerHTML = \`
      <div class="card" style="margin-bottom:16px">`;

const timesheetSubNav = `    container.innerHTML = \`
      <!-- Stage 4 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm \${this.currentView==='corrections'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('corrections')">
            <i class="fa fa-clipboard-check"></i> Attendance Regularization &amp; WFH
          </button>
          <button class="btn btn-sm \${this.currentView==='timesheets'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('timesheets')">
            <i class="fa fa-business-time"></i> Project Timesheets &amp; Billing
          </button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="Attendance.syncTimesheetsToPayroll()" title="Bridge approved weekly hours > 40 into payroll overtime">
            <i class="fa fa-money-bill-transfer"></i> Sync Overtime to Payroll
          </button>
          <button class="btn btn-ghost btn-sm" onclick="Attendance.exportTimesheetsCSV()">
            <i class="fa fa-file-export"></i> Export CSV
          </button>
          <button class="btn btn-primary btn-sm" onclick="Attendance.showLogTimesheetModal()">
            <i class="fa fa-plus"></i> Log Project Hours
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">`;

if (code.includes(timesheetAnchor)) {
  code = code.replace(timesheetAnchor, timesheetSubNav);
  console.log('✅ Added Stage 4 Sub-Nav to renderTimesheets');
} else {
  console.log('⚠️ Could not find timesheetAnchor');
}

fs.writeFileSync('js/attendance.js', code, 'utf8');
console.log('🎉 Successfully patched Attendance into 4 clean lifecycle stages!');
