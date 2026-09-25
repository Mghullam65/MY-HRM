const fs = require('fs');
const path = require('path');

// Mock browser environment
const localStorageData = {};
global.localStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; }
};

// Load dependencies
global.window = {};
global.document = {
  getElementById: (id) => ({ innerHTML: '', value: '', style: {}, classList: { add(){}, remove(){} } }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const dbContent = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
eval(dbContent);
global.DB = window.DB;
global.Utils = window.Utils;

const authContent = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
eval(authContent);
global.Auth = window.Auth;

const settingsContent = fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf8');
eval(settingsContent);
global.Settings = window.Settings;

// Initialize RBAC data
DB.init();

// Initialize RBAC data
DB.ensureRBACData();

console.log('--- Testing Unified Roles & Permissions Settings ---');

// 1. Verify FEATURE_CATALOG exists and covers all core modules
console.log('1. Checking FEATURE_CATALOG...');
const catalog = Auth.FEATURE_CATALOG;
if (Array.isArray(catalog) && catalog.length >= 10) {
  console.log(`✅ FEATURE_CATALOG populated with ${catalog.length} modules!`);
} else {
  console.error('❌ FEATURE_CATALOG is invalid or missing.');
  process.exit(1);
}

// 2. Check tab switching logic
console.log('\n2. Checking switchRolesPermissionsTab...');
Settings.rolesPermissionsTab = 'features';
const mockContainer = { innerHTML: '' };
Settings.renderRolesPermissions(mockContainer);

if (mockContainer.innerHTML.includes('Feature &amp; Sub-Option Visibility Manager')) {
  console.log('✅ Default view opens Feature Visibility Manager!');
} else {
  console.error('❌ Default view did not render Feature Visibility Manager.');
  process.exit(1);
}

// Switch to matrix tab
Settings.switchRolesPermissionsTab('matrix');
Settings.renderRolesPermissions(mockContainer);
if (mockContainer.innerHTML.includes('Roles &amp; Granular Permissions Matrix')) {
  console.log('✅ Switched successfully to Action Permissions Matrix!');
} else {
  console.error('❌ Action Permissions Matrix failed to render.');
  process.exit(1);
}

// 3. Test Feature Visibility Toggling per Role
console.log('\n3. Testing Role-based Feature Visibility Toggle...');
global.Toast = { show: () => {} };
Settings.toggleFeatureVisibility('role', 2, 'leaves.requests_list', false);
const isRoleVisible = Settings.isFeatureVisible('role', 2, 'leaves.requests_list', ['hr_manager']);
if (isRoleVisible === false) {
  console.log('✅ Feature visibility for role 2 properly disabled!');
} else {
  console.error('❌ Feature toggle failed to update role visibility.');
  process.exit(1);
}

// 4. Test Feature Visibility Toggling per User Login
console.log('\n4. Testing Individual User Login Feature Visibility Override...');
// Target user 2 (non superadmin)
Settings.toggleFeatureVisibility('user', 2, 'leaves.requests_list', true);
const isUserVisible = Settings.isFeatureVisible('user', 2, 'leaves.requests_list', ['hr_manager']);
if (isUserVisible === true) {
  console.log('✅ Feature visibility override for user 2 successfully set to true!');
} else {
  console.error('❌ Feature override for individual user failed.');
  process.exit(1);
}

console.log('\n=============================================');
console.log('🎉 ALL UNIFIED SETTINGS TESTS PASSED 100%! 🎉');
console.log('=============================================');
