// Automated Verification Script for Extended Enterprise Features:
// 1. Granular RBAC & User-Level Feature Toggling
// 2. Configurable Multi-Tier Approval Workflows (Leaves, Expenses, Settlement)
// 3. Immutable Forensic Audit Trail with Cryptographic Checksums
// 4. Live Multi-Channel Notification Dispatching (In-App, Email, Webhooks)

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🚀 [Test Suite] Starting Enterprise HR System Comprehensive Verification...\n');

// 1. Verify files exist in root and public
const requiredFiles = [
  'js/workflow-engine.js',
  'public/js/workflow-engine.js',
  'js/auth.js',
  'js/data.js',
  'js/leaves.js',
  'js/expenses.js',
  'js/settlement.js',
  'js/settings.js',
  'js/notifications.js'
];

requiredFiles.forEach(file => {
  const p = path.resolve(__dirname, '..', file);
  assert(fs.existsSync(p), `Missing required file: ${file}`);
  console.log(`  ✓ Verified file exists: ${file}`);
});

// 2. Mock browser environment to test logic
global.window = global;
global.document = {
  documentElement: { getAttribute: () => 'light' },
  getElementById: () => null,
  querySelector: () => null,
  createElement: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    prepend: () => {},
    setAttribute: () => {}
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};
global.Toast = { show: () => {} };
global.Modal = { show: () => {}, confirm: () => {} };
global.Utils = {
  today: () => '2026-09-25',
  formatDate: (d) => d,
  formatDateTime: (d) => d,
  avatarColor: () => '#2563eb',
  avatarInitials: () => 'AA',
  getDesigName: () => 'Engineer'
};

// Load core files
require('../js/data.js');
require('../js/workflow-engine.js');
require('../js/auth.js');
require('../js/notifications.js');

DB.ensureRBACData();

console.log('\n--- 1. Testing Granular RBAC Matrix & User Feature Overrides ---');

// Set Ahmed Khan (Superadmin)
Auth.user = { id: 1, employeeId: 1, role: 'superadmin', username: 'admin' };
Auth.role = 'superadmin';
assert.strictEqual(Auth.can('leaves.create'), true, 'Superadmin should create leaves');
assert.strictEqual(Auth.can('leaves.approve'), true, 'Superadmin should approve leaves');
assert.strictEqual(Auth.can('payroll.run'), true, 'Superadmin should run payroll');
console.log('  ✓ Superadmin has sovereign authority across all actions');

// Set Junior HR (Zain Ali, user id 6)
Auth.user = { id: 6, employeeId: 6, role: 'hr_manager', username: 'junior.hr' };
Auth.role = 'hr_manager';

// Verify that user-level restriction blocks 'leaves.approvals' and 'payroll.run' even though role is hr_manager
assert.strictEqual(Auth.canSeeFeature('leaves.approvals'), false, 'Junior HR approvals should be suppressed by user rule');
assert.strictEqual(Auth.canSeeFeature('leaves.quota_adjustment'), false, 'Junior HR quota adjustment should be suppressed');
assert.strictEqual(Auth.canSeeFeature('payroll.run'), false, 'Junior HR payroll run should be suppressed');
console.log('  ✓ User-level feature suppression correctly revokes specific actions without breaking whole module');

// Verify that basic actions remain permitted
assert.strictEqual(Auth.can('leaves.view'), true, 'Junior HR can view leaves');
assert.strictEqual(Auth.can('leaves.create'), true, 'Junior HR can apply leaves');
console.log('  ✓ Junior HR retains view & apply capabilities');

console.log('\n--- 2. Testing Configurable Multi-Tier Approval Workflows ---');
const leavesChain = WorkflowEngine.getChain('leaves');
assert(leavesChain, 'Leaves workflow chain should exist');
assert.strictEqual(leavesChain.tierCount, 2, 'Default leaves chain should have 2 tiers');
assert.strictEqual(leavesChain.tiers.length, 3, 'Leaves chain definition should have 3 configured tiers');

// Simulate Leave item progression
const sampleLeave = { id: 999, employeeId: 4, days: 3, status: 'pending', tierLevel: 1 };
const step1 = WorkflowEngine.advanceApproval(sampleLeave, 'leaves', { username: 'usman.baig', role: 'dept_manager' });
assert.strictEqual(step1.isFinalTier, false, 'Tier 1 approval in a 2-tier chain is not final');
assert.strictEqual(step1.updates.status, 'manager_approved', 'Intermediate state should be manager_approved');
assert.strictEqual(step1.nextTierNum, 2, 'Next gate should be Tier 2');
console.log('  ✓ Tier 1 approval correctly transitions to intermediate gate');

// Simulate Tier 2 final approval
const sampleLeaveT2 = { ...sampleLeave, ...step1.updates, tierLevel: 2 };
const step2 = WorkflowEngine.advanceApproval(sampleLeaveT2, 'leaves', { username: 'sara.malik', role: 'hr_manager' });
assert.strictEqual(step2.isFinalTier, true, 'Tier 2 approval in a 2-tier chain is final');
assert.strictEqual(step2.updates.status, 'approved', 'Final state should be approved');
console.log('  ✓ Tier 2 approval correctly grants final approval');

// Test Stepper HTML Generator
const stepperHTML = WorkflowEngine.renderStepperHTML(sampleLeaveT2, 'leaves');
assert(stepperHTML.includes('progress-pill') || stepperHTML.includes('T1'), 'Stepper HTML should contain tier progress pills');
console.log('  ✓ Stepper visual indicator rendered cleanly');

console.log('\n--- 3. Testing Immutable Audit Trail & Cryptographic Checksum ---');
const prevLogsCount = (DB.get('audit_logs') || []).length;
DB.log('CONFIG_CHANGE', 'Workflows', 'Modified Tier 2 approver to hr_manager', 1, 'WARNING');
const updatedLogs = DB.get('audit_logs') || [];
assert.strictEqual(updatedLogs.length, prevLogsCount + 1, 'Audit log count should increment');

const latestLog = updatedLogs[0];
assert(latestLog.checksum && latestLog.checksum.length >= 8, 'Audit log entry must have a cryptographic SHA checksum');
assert.strictEqual(latestLog.module, 'Workflows');
assert.strictEqual(latestLog.severity, 'WARNING');
console.log(`  ✓ Cryptographic audit log recorded with SHA Checksum [${latestLog.checksum}]`);

console.log('\n--- 4. Testing Multi-Channel Real-Time Notifications ---');
const initialEmailLogs = (DB.get('email_logs') || []).length;
LiveNotifications.dispatch({
  recipientRole: 'hr_manager',
  title: 'Audit Verification Notification',
  message: 'Automated test alert verifying real-time dispatching.',
  type: 'workflow_gate'
});

const afterEmailLogs = (DB.get('email_logs') || []).length;
assert.strictEqual(afterEmailLogs, initialEmailLogs + 1, 'Outbound email telemetry should automatically record entry');
console.log('  ✓ Multi-channel notification dispatched with outbound SMTP email telemetry');

console.log('\n✨ [Success] All Enterprise Verifications Passed 100%!');
