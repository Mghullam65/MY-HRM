const fs = require('fs');
const path = require('path');

console.log('🧪 [Test] Running RBAC Permissions Matrix Verification Suite...');

// Mock localStorage and window
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = global;
global.document = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelectorAll: () => [],
  documentElement: { getAttribute: () => 'dark', setAttribute: () => {} }
};

// Seed an old 11-module state to rigorously test backwards-compatible schema migration
storage['hrm_system_modules'] = JSON.stringify([
  { id: 1, code: 'dashboard', name: 'Executive Dashboard & Telemetry', category: 'General', icon: 'fa-gauge-high', sortOrder: 1, isActive: true },
  { id: 2, code: 'employees', name: 'Personnel & Employee Dossiers', category: 'Human Resources', icon: 'fa-users', sortOrder: 2, isActive: true },
  { id: 3, code: 'attendance', name: 'Time & Attendance Roster', category: 'Operations', icon: 'fa-clock', sortOrder: 3, isActive: true },
  { id: 4, code: 'leaves', name: 'Leave Allocations & Quotas', category: 'Operations', icon: 'fa-calendar-xmark', sortOrder: 4, isActive: true },
  { id: 5, code: 'payroll', name: 'Compensation, Tax & Payroll', category: 'Finance', icon: 'fa-money-bill-wave', sortOrder: 5, isActive: true },
  { id: 6, code: 'travel_expenses', name: 'Business Travel & Expense Claims', category: 'Finance', icon: 'fa-plane-departure', sortOrder: 6, isActive: true },
  { id: 7, code: 'performance', name: 'Performance Appraisals & KPIs', category: 'Talent', icon: 'fa-chart-line', sortOrder: 7, isActive: true },
  { id: 8, code: 'recruitment', name: 'Talent Acquisition & Pipeline', category: 'Talent', icon: 'fa-briefcase', sortOrder: 8, isActive: true },
  { id: 9, code: 'discipline', name: 'Legal Inquiries & Disciplinary Notices', category: 'Compliance', icon: 'fa-gavel', sortOrder: 9, isActive: true },
  { id: 10, code: 'assets', name: 'Corporate Asset Inventory', category: 'Operations', icon: 'fa-laptop-file', sortOrder: 10, isActive: true },
  { id: 11, code: 'settings', name: 'Governance, RBAC & Configurations', category: 'Administration', icon: 'fa-sliders', sortOrder: 11, isActive: true }
]);

// Load DB
eval(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'));

// Run ensureRBACData
DB.ensureRBACData();

const modules = DB.get('system_modules') || [];
console.log(`📦 Loaded ${modules.length} System Modules into Matrix`);

const expectedCodes = [
  'dashboard', 'employees', 'documents', 'attendance', 'shifts', 'leaves',
  'payroll', 'settlement', 'travel_expenses', 'performance', 'training',
  'recruitment', 'discipline', 'assets', 'helpdesk', 'events', 'companies',
  'reports', 'chat', 'administration', 'settings'
];

let failed = false;

expectedCodes.forEach(code => {
  const found = modules.find(m => m.code === code);
  if (!found) {
    console.error(`❌ Missing expected module: ${code}`);
    failed = true;
  } else {
    console.log(`  ✅ Module [${found.code}]: "${found.name}" (Category: ${found.category})`);
  }
});

if (modules.length < 21) {
  console.error(`❌ Expected at least 21 modules, got ${modules.length}`);
  failed = true;
}

const permissions = DB.get('permissions') || [];
console.log(`\n🔑 Generated ${permissions.length} Granular Permissions`);

expectedCodes.forEach(code => {
  const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
  actions.forEach(act => {
    const p = permissions.find(perm => perm.code === `${code}.${act}`);
    if (!p) {
      console.error(`❌ Missing permission: ${code}.${act}`);
      failed = true;
    }
  });
});

const roles = DB.get('roles') || [];
console.log(`\n👥 Configured ${roles.length} System Roles`);

const rolePerms = DB.get('role_permissions') || [];
console.log(`🔗 Configured ${rolePerms.length} Role-Permission Junction Bindings`);

roles.forEach(r => {
  const count = rolePerms.filter(rp => rp.roleId === r.id).length;
  console.log(`  Role [${r.code}] "${r.name}": ${count} permissions mapped`);
  if (count < permissions.length) {
    console.error(`❌ Incomplete bindings for role ${r.code}: ${count} / ${permissions.length}`);
    failed = true;
  }
});

// Load Auth and verify access
eval(fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8'));

Auth.role = 'superadmin';
Auth.employee = { id: 1, fullName: 'Ahmed Khan' };
const superadminCanViewAll = expectedCodes.every(code => Auth.canAccessModule(code));
console.log(`\n👑 Superadmin view access to all modules: ${superadminCanViewAll ? 'PASS' : 'FAIL'}`);
if (!superadminCanViewAll) failed = true;

Auth.role = 'employee';
Auth.employee = { id: 4, fullName: 'Fatima Raza' };
const empHasSettings = Auth.canAccessModule('settings');
const empHasAttendance = Auth.canAccessModule('attendance');
const empCanCreateLeave = Auth.can('leaves.create');
const empCanDeleteSettings = Auth.can('settings.delete');

console.log(`👤 Employee access checks:`);
console.log(`  Settings access (should be false): ${!empHasSettings ? 'PASS' : 'FAIL'}`);
console.log(`  Attendance access (should be true): ${empHasAttendance ? 'PASS' : 'FAIL'}`);
console.log(`  Can create leave (should be true): ${empCanCreateLeave ? 'PASS' : 'FAIL'}`);
console.log(`  Can delete settings (should be false): ${!empCanDeleteSettings ? 'PASS' : 'FAIL'}`);

if (empHasSettings || !empHasAttendance || !empCanCreateLeave || empCanDeleteSettings) {
  failed = true;
}

if (failed) {
  console.error('\n❌ RBAC Matrix Verification FAILED!');
  process.exit(1);
} else {
  console.log('\n🌟 100% RBAC PERMISSIONS MATRIX VERIFICATION SUITE PASSED SUCCESSFULLY!');
}
