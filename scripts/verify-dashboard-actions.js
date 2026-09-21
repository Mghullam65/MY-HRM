const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING DASHBOARD MODULE & EXECUTIVE ACTION CENTER');
console.log('════════════════════════════════════════════════════════════\n');

let passed = 0;
let total = 0;

function assert(condition, desc) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✔ [PASS] ${desc}`);
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    process.exitCode = 1;
  }
}

// 1. Check code structure and methods
console.log('▶ Test 1: Method Signatures & Core Architecture...');
const dashContent = fs.readFileSync('js/dashboard.js', 'utf8');

assert(dashContent.includes('renderMultiCompanyPortfolio'), 'Dashboard has renderMultiCompanyPortfolio');
assert(dashContent.includes('renderHeadlinesTicker'), 'Dashboard has renderHeadlinesTicker');
assert(dashContent.includes('renderActionCenterInbox'), 'Dashboard has renderActionCenterInbox');
assert(dashContent.includes('renderCharts'), 'Dashboard has renderCharts telemetry engine');
assert(dashContent.includes('renderEmployeeDashboard'), 'Dashboard has dedicated Employee Self-Service Dashboard');

// 2. Test Multi-Role Execution in Node
console.log('\n▶ Test 2: Multi-Role Dashboard Rendering Verification...');
['employee', 'dept_manager', 'superadmin', 'hr_manager'].forEach(role => {
  global.window = {};
  global.document = { 
    getElementById: () => ({ innerHTML: '', querySelectorAll: () => [], addEventListener: () => {} }), 
    querySelectorAll: () => [] 
  };
  global.localStorage = { getItem: () => null, setItem: () => {} };
  global.sessionStorage = { ...global.localStorage };
  global.Auth = { 
    role, 
    employee: { id: 1, departmentId: 1, designationId: 1, empNo: 'EMP-001', fullName: 'Test Employee' }, 
    user: { id: 1, role, employeeId: 1 },
    getScopedEmployees: (emps) => emps || [{ id: 1, fullName: 'Test Admin', departmentId: 1, status: 'active', salary: 100000 }],
    getScope: () => 'ALL',
    SCOPES: { ALL: 'ALL', TEAM: 'TEAM', SELF: 'SELF', NONE: 'NONE' }
  };
  global.DB = { 
    get: (t) => {
      if (t === 'companies') return [{ id: 1, name: 'Main Corp', ntn: '12345', disbursementBank: 'HBL' }];
      if (t === 'employees') return [{ id: 1, fullName: 'Test Admin', departmentId: 1, status: 'active', salary: 100000 }];
      return [];
    }, 
    find: () => ({ id: 1, fullName: 'Test', departmentId: 1, designationId: 1, empNo: 'EMP-001', status: 'active' }),
    getActiveCompanyId: () => 'all'
  };
  global.Utils = { 
    today: () => '2026-09-21', 
    thisMonth: () => '2026-09', 
    getDeptName: () => 'General', 
    getDesigName: () => 'Executive',
    formatDate: (d) => d,
    formatCurrency: (n) => 'PKR ' + n,
    avatarColor: () => '#4f46e5',
    avatarInitials: () => 'TA',
    statusBadge: (s) => s
  };
  global.Toast = { show: () => {} };
  global.Chart = function() { return { destroy: () => {} }; };

  eval(dashContent.replace(/const Dashboard\s*=/, 'global.Dashboard ='));

  let rolePassed = true;
  try {
    Dashboard.render();
  } catch (err) {
    rolePassed = false;
    console.error(`  Role ${role} error: ${err.message}`);
  }
  assert(rolePassed, `Role [${role}] renders dashboard cleanly without errors`);
});

// 3. Test Action Center Inbox Filters
console.log('\n▶ Test 3: Validating Action Center Inbox Navigation & Filtering...');
assert(dashContent.includes("setInboxFilter('all')") || dashContent.includes("Dashboard.setInboxFilter"), 'Action center provides category filtering');
assert(dashContent.includes('toggleInboxCollapse'), 'Action center provides collapsible state toggle');

// 4. Check Root and Public Sync
console.log('\n▶ Test 4: Verifying Root & Public File Synchronization...');
const rootDash = fs.readFileSync('js/dashboard.js', 'utf8');
const pubDash = fs.readFileSync(path.join('public', 'js', 'dashboard.js'), 'utf8');
assert(rootDash === pubDash, 'js/dashboard.js is 100% identical between root and public/');

console.log('\n════════════════════════════════════════════════════════════');
if (passed === total) {
  console.log(`🎉 ALL ${passed} DASHBOARD VERIFICATION TESTS PASSED!`);
} else {
  console.log(`⚠️ ${total - passed} OF ${total} TESTS FAILED!`);
}
console.log('════════════════════════════════════════════════════════════\n');
