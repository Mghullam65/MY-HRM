// Verification script for Feature & Sub-Option Visibility Management
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {};
global.document = {
  getElementById: (id) => ({ innerHTML: '', value: '', style: {}, classList: { add(){}, remove(){}, toggle(){} } }),
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
global.Toast = {
  show: (msg, type) => {}
};
global.App = {
  showToast: (msg, type) => {}
};

// Load data, auth, settings
eval(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'));
global.DB = window.DB;
global.Utils = window.Utils;
DB.init();
DB.ensureRBACData();

eval(fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8'));
global.Auth = window.Auth;

eval(fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf8'));
global.Settings = window.Settings;

console.log('--- VERIFYING FEATURE & SUB-OPTION VISIBILITY MANAGEMENT ---');

// 1. Verify FEATURE_CATALOG completeness
console.log('1. Checking Feature Catalog Registry:');
const catalog = Auth.FEATURE_CATALOG;
console.log(`   Found ${catalog.length} modules registered in feature catalog.`);
if (catalog.length < 10) throw new Error('Catalog is missing modules!');

const leavesMod = catalog.find(m => m.moduleCode === 'leaves');
if (!leavesMod || leavesMod.features.length < 5) throw new Error('Leaves module features missing!');
console.log(`   ✅ Leaves module has ${leavesMod.features.length} granular features (Calendar, Quota, Apply, Approvals, Tokens, Encashment, etc.)`);

// 2. Test Baseline Role Feature Visibility
console.log('\n2. Testing Baseline Role Feature Visibility:');
Auth.user = { id: 3, username: 'usman.baig', role: 'dept_manager', roleId: 3 };
Auth.role = 'dept_manager';

const canSeeCalendarDefault = Auth.canSeeFeature('leaves.calendar');
const canSeeEncashmentDefault = Auth.canSeeFeature('leaves.encashment');
console.log('   Dept Manager can see leaves.calendar (default):', canSeeCalendarDefault); // true
console.log('   Dept Manager can see leaves.encashment (default):', canSeeEncashmentDefault); // false

if (!canSeeCalendarDefault) throw new Error('Default calendar should be visible to dept_manager!');
if (canSeeEncashmentDefault) throw new Error('Default encashment should be hidden from dept_manager!');
console.log('   ✅ Baseline feature defaults validated successfully!');

// 3. Test Role-Based Feature Toggle (Hide Calendar for Dept Manager)
console.log('\n3. Testing Role-Based Feature Toggle (Hiding Calendar for Dept Manager):');
Settings.toggleFeatureVisibility('role', 3, 'leaves.calendar', false);

const canSeeCalendarAfterToggle = Auth.canSeeFeature('leaves.calendar');
console.log('   Dept Manager can see leaves.calendar after hiding:', canSeeCalendarAfterToggle); // false
if (canSeeCalendarAfterToggle !== false) throw new Error('leaves.calendar should now be false for dept_manager!');

// Check that Super Admin is unaffected by role restriction
const prevRole = Auth.role;
Auth.role = 'superadmin';
console.log('   Super Admin can see leaves.calendar (Sovereign):', Auth.canSeeFeature('leaves.calendar'));
if (!Auth.canSeeFeature('leaves.calendar')) throw new Error('Superadmin must always be true!');
Auth.role = prevRole;
console.log('   ✅ Role-based feature toggle successfully enforced!');

// 4. Test Specific User / Login Override (Customizing login fatima.raza)
console.log('\n4. Testing Individual Login Override:');
// Create a mock user
const testUsers = [
  { id: 101, username: 'fatima.raza', fullName: 'Fatima Raza', role: 'employee', roleId: 5 }
];
DB.set('users', testUsers);

// Log in as fatima
Auth.user = testUsers[0];
Auth.role = 'employee';

console.log('   Fatima Raza (Employee) can see payroll.run (default):', Auth.canSeeFeature('payroll.run')); // false

// Admin explicitly enables payroll.run for ONLY Fatima Raza's login
Settings.toggleFeatureVisibility('user', 101, 'payroll.run', true);

const fatimaCanRunPayroll = Auth.canSeeFeature('payroll.run');
console.log('   Fatima Raza can see payroll.run after user override:', fatimaCanRunPayroll); // true
if (!fatimaCanRunPayroll) throw new Error('User override for payroll.run should be true!');

// Another employee should still be blocked
Auth.user = { id: 102, username: 'ali.hassan', fullName: 'Ali Hassan', role: 'employee', roleId: 5 };
console.log('   Ali Hassan (Employee without override) can see payroll.run:', Auth.canSeeFeature('payroll.run')); // false
if (Auth.canSeeFeature('payroll.run')) throw new Error('Other employees must not inherit Fatima\'s override!');

console.log('   ✅ Individual login-level feature override successfully validated!');

// 5. Test Batch Module Toggle
console.log('\n5. Testing Batch Module Toggle (Hide all Recruitment features for Dept Manager):');
Settings.batchToggleModuleFeatures('role', 3, 'recruitment', false);

Auth.user = { id: 3, username: 'usman.baig', role: 'dept_manager', roleId: 3 };
Auth.role = 'dept_manager';

const recJobs = Auth.canSeeFeature('recruitment.jobs');
const recPipeline = Auth.canSeeFeature('recruitment.pipeline');
console.log('   Dept Manager recruitment.jobs:', recJobs);
console.log('   Dept Manager recruitment.pipeline:', recPipeline);

if (recJobs || recPipeline) throw new Error('Batch toggle should have hidden all recruitment features!');
console.log('   ✅ Batch module toggle successfully validated!');

// 6. Test Settings.renderFeatureVisibility HTML Generation
console.log('\n6. Testing Settings.renderFeatureVisibility UI rendering:');
const mockContainer = { innerHTML: '' };
Settings.renderFeatureVisibility(mockContainer);

if (!mockContainer.innerHTML.includes('Feature &amp; Sub-Option Visibility Manager')) {
  throw new Error('Feature Visibility UI header not rendered!');
}
if (!mockContainer.innerHTML.includes('Leave Management')) {
  throw new Error('Leave Management module card not rendered!');
}
console.log('   ✅ Settings Feature Visibility UI rendered cleanly with interactive switches!');

console.log('\n============================================================');
console.log('🎉 ALL FEATURE & SUB-OPTION VISIBILITY TESTS PASSED! 🎉');
console.log('============================================================');
process.exit(0);
