// Verification script to test all login personas and conditions
const path = require('path');
const fs = require('fs');
const vm = require('vm');

// Mock browser environment for DB & Auth
const localStorageStore = {};
const sessionStorageStore = {};

const mockLocalStorage = {
  getItem: (k) => localStorageStore[k] || null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const mockSessionStorage = {
  getItem: (k) => sessionStorageStore[k] || null,
  setItem: (k, v) => { sessionStorageStore[k] = String(v); },
  removeItem: (k) => { delete sessionStorageStore[k]; },
  clear: () => { Object.keys(sessionStorageStore).forEach(k => delete sessionStorageStore[k]); }
};

const sandbox = {
  window: {},
  document: {
    documentElement: { setAttribute: () => {}, removeAttribute: () => {} },
    body: { setAttribute: () => {}, removeAttribute: () => {} }
  },
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  CustomEvent: function(type, detail) { this.type = type; this.detail = detail; },
  console: { log: () => {}, warn: () => {}, error: console.error },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// 1. Load data.js
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
vm.runInContext(dataCode, sandbox);

// 2. Load auth.js
const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
vm.runInContext(authCode, sandbox);

async function runTests() {
  console.log('🧪 Starting Authentication Verification Suite...');
  
  // Initialize DB
  await sandbox.DB.init();

  const testCases = [
    { name: 'Admin Demo Pill', username: 'admin', pass: 'admin123', expectedRole: 'superadmin' },
    { name: 'HR Demo Pill', username: 'sara.malik', pass: 'hr123', expectedRole: 'hr_manager' },
    { name: 'Manager Demo Pill', username: 'usman.baig', pass: 'mgr123', expectedRole: 'dept_manager' },
    { name: 'Employee Demo Pill', username: 'fatima.raza', pass: 'emp123', expectedRole: 'employee' },
    { name: 'Finance Demo Pill', username: 'tariq.finance', pass: 'fin123', expectedRole: 'payroll_accountant' },
    { name: 'Onboarding Demo Pill', username: 'saad.ibrahim', pass: 'emp123', expectedRole: 'onboarding' },
    { name: 'Email Address Login', username: 'ahmed.khan@company.com', pass: 'admin123', expectedRole: 'superadmin' },
    { name: 'Case-Insensitive Input', username: 'ADMIN', pass: 'admin123', expectedRole: 'superadmin' },
    { name: 'Invalid Password Rejection', username: 'admin', pass: 'badpassword', shouldFail: true }
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const res = sandbox.Auth.login(tc.username, tc.pass);
    if (tc.shouldFail) {
      if (!res.success) {
        console.log(`  ✓ PASSED: ${tc.name} properly rejected invalid credentials.`);
        passed++;
      } else {
        console.error(`  ✗ FAILED: ${tc.name} should have failed but succeeded.`);
        failed++;
      }
    } else {
      if (res.success && sandbox.Auth.user && sandbox.Auth.role === tc.expectedRole) {
        console.log(`  ✓ PASSED: ${tc.name} authenticated successfully as ${sandbox.Auth.role} (${sandbox.Auth.employee?.fullName || 'User'}).`);
        passed++;
      } else {
        console.error(`  ✗ FAILED: ${tc.name} -`, res.message || 'Role mismatch');
        failed++;
      }
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
