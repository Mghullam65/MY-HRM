// Automated verification of granular partial permissions across Leave and core modules
const fs = require('fs');
const path = require('path');

// Mock browser environment for testing
global.window = {};
global.document = {
  getElementById: (id) => ({ innerHTML: '', value: '', style: {}, classList: { add(){}, remove(){} } }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

// Load DB, Security, and Auth
const secCode = fs.readFileSync(path.join(__dirname, '../js/security.js'), 'utf8');
eval(secCode);

const dbCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
eval(dbCode);
global.DB = window.DB;
global.Utils = window.Utils;

async function run() {
  await DB.init();
  DB.ensureRBACData();

  const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
  eval(authCode);
  global.Auth = window.Auth;

  console.log('--- TESTING GRANULAR PARTIAL PERMISSIONS ---');

// Setup mock session as HR Manager
Auth.user = { id: 2, username: 'hrmanager', role: 'hr_manager', fullName: 'HR Manager' };
Auth.role = 'hr_manager';
Auth.employee = { id: 2, fullName: 'HR Manager', departmentId: 1 };

const roles = DB.get('roles') || [];
const perms = DB.get('permissions') || [];
let rolePerms = DB.get('role_permissions') || [];

function setRolePerm(roleCode, permCode, isGranted) {
  const role = roles.find(r => r.code === roleCode);
  const perm = perms.find(p => p.code === permCode);
  if (!role || !perm) throw new Error(`Role ${roleCode} or perm ${permCode} not found!`);
  let binding = rolePerms.find(rp => rp.roleId === role.id && rp.permissionId === perm.id);
  if (binding) {
    binding.isGranted = isGranted;
  } else {
    binding = { id: Date.now() + Math.random(), roleId: role.id, permissionId: perm.id, isGranted };
    rolePerms.push(binding);
  }
  DB.set('role_permissions', rolePerms);
}

// Case 1: Check baseline full access for hr_manager
console.log('1. Baseline Check (Default Permissions):');
console.log('   leaves.view:', Auth.can('leaves.view'));
console.log('   leaves.create:', Auth.can('leaves.create'));
console.log('   leaves.approve:', Auth.can('leaves.approve'));
console.log('   leaves.export:', Auth.can('leaves.export'));

if (!Auth.can('leaves.view') || !Auth.can('leaves.approve')) {
  throw new Error('Baseline test failed!');
}

// Case 2: Grant ONLY leaves.create, revoke leaves.approve and leaves.export
console.log('\n2. Partial Permission Test: Grant create, revoke approve & export');
setRolePerm('hr_manager', 'leaves.view', true);
setRolePerm('hr_manager', 'leaves.create', true);
setRolePerm('hr_manager', 'leaves.approve', false);
setRolePerm('hr_manager', 'leaves.export', false);

console.log('   leaves.view:', Auth.can('leaves.view'));       // Expected: true
console.log('   leaves.create:', Auth.can('leaves.create'));   // Expected: true
console.log('   leaves.approve:', Auth.can('leaves.approve')); // Expected: false
console.log('   leaves.export:', Auth.can('leaves.export'));   // Expected: false

if (!Auth.can('leaves.view')) throw new Error('leaves.view should be true');
if (!Auth.can('leaves.create')) throw new Error('leaves.create should be true');
if (Auth.can('leaves.approve')) throw new Error('leaves.approve should be false when revoked!');
if (Auth.can('leaves.export')) throw new Error('leaves.export should be false when revoked!');
console.log('   ✅ Partial permission for Leave (Apply-Only) successfully enforced!');

// Case 3: Grant ONLY leaves.approve, revoke leaves.create
console.log('\n3. Partial Permission Test: Grant approve, revoke create');
setRolePerm('hr_manager', 'leaves.view', true);
setRolePerm('hr_manager', 'leaves.create', false);
setRolePerm('hr_manager', 'leaves.approve', true);
setRolePerm('hr_manager', 'leaves.export', false);

console.log('   leaves.view:', Auth.can('leaves.view'));       // Expected: true
console.log('   leaves.create:', Auth.can('leaves.create'));   // Expected: false
console.log('   leaves.approve:', Auth.can('leaves.approve')); // Expected: true

if (Auth.can('leaves.create')) throw new Error('leaves.create should be false when revoked!');
if (!Auth.can('leaves.approve')) throw new Error('leaves.approve should be true!');
console.log('   ✅ Partial permission for Leave (Approve-Only) successfully enforced!');

// Case 4: Revoke entire module view
console.log('\n4. Module Revocation Test: Revoke leaves.view');
setRolePerm('hr_manager', 'leaves.view', false);

console.log('   leaves.view:', Auth.can('leaves.view'));       // Expected: false
if (Auth.can('leaves.view')) throw new Error('leaves.view should be false when revoked!');
console.log('   ✅ Module view restriction successfully enforced!');

// Case 5: Partial permission on Payroll
console.log('\n5. Payroll Partial Permission Test: Grant view & export, revoke approve');
setRolePerm('hr_manager', 'payroll.view', true);
setRolePerm('hr_manager', 'payroll.create', false);
setRolePerm('hr_manager', 'payroll.approve', false);
setRolePerm('hr_manager', 'payroll.export', true);

console.log('   payroll.view:', Auth.can('payroll.view'));       // Expected: true
console.log('   payroll.approve:', Auth.can('payroll.approve')); // Expected: false
console.log('   payroll.export:', Auth.can('payroll.export'));   // Expected: true

if (!Auth.can('payroll.view') || Auth.can('payroll.approve') || !Auth.can('payroll.export')) {
  throw new Error('Payroll partial permission failed!');
}
console.log('   ✅ Payroll partial permission successfully enforced!');

// Case 6: Partial permission on Expenses
console.log('\n6. Travel/Expenses Partial Permission Test: Grant create, revoke approve');
setRolePerm('hr_manager', 'travel_expenses.view', true);
setRolePerm('hr_manager', 'travel_expenses.create', true);
setRolePerm('hr_manager', 'travel_expenses.approve', false);

console.log('   travel_expenses.view:', Auth.can('travel_expenses.view'));       // Expected: true
console.log('   travel_expenses.create:', Auth.can('travel_expenses.create'));   // Expected: true
console.log('   travel_expenses.approve:', Auth.can('travel_expenses.approve')); // Expected: false

if (!Auth.can('travel_expenses.create') || Auth.can('travel_expenses.approve')) {
  throw new Error('Expenses partial permission failed!');
}
console.log('   ✅ Expenses partial permission successfully enforced!');

console.log('\n========================================');
console.log('🎉 ALL PARTIAL PERMISSION TESTS PASSED! 🎉');
console.log('========================================');
process.exit(0);
}

run().catch(err => {
  console.error('Fatal error in verify-partial-permissions:', err);
  process.exit(1);
});
