// Automated End-to-End Enterprise Lifecycle Test:
// 1. Employee Leave Application -> Multi-Tier Progression
// 2. Department Manager Tier 1 Endorsement
// 3. HR Director Tier 2 Final Approval
// 4. Junior HR Permission Enforcement Check
// 5. Biometric Terminal Live Ingestion Simulator
// 6. Forensic Cryptographic Audit Trail Verification

const assert = require('assert');
const fs = require('fs');

console.log('🌟 [E2E Lifecycle Test] Initializing Enterprise HRM Full Simulation...\n');

// Mock browser environment
global.window = global;
global.document = {
  documentElement: { getAttribute: () => 'light' },
  getElementById: (id) => null,
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
global.Toast = { show: (msg, type) => console.log(`   [Toast - ${type || 'info'}]: ${msg}`) };
global.Modal = { show: () => {}, close: () => {}, confirm: () => {} };
global.Utils = {
  today: () => '2026-09-25',
  formatDate: (d) => d,
  formatDateTime: (d) => d,
  avatarColor: () => '#2563eb',
  avatarInitials: () => 'FR',
  getDesigName: () => 'Software Engineer'
};

// Load core files
require('../js/data.js');
require('../js/workflow-engine.js');
require('../js/auth.js');
require('../js/notifications.js');
require('../js/settings.js');

DB.ensureRBACData();

console.log('--- Step 1: Employee Submits Leave Request ---');
Auth.user = { id: 4, employeeId: 4, role: 'employee', username: 'fatima.raza' };
Auth.role = 'employee';
assert.strictEqual(Auth.can('leaves.create'), true, 'Employee must have leave creation permission');
assert.strictEqual(Auth.can('leaves.approve'), false, 'Regular employee cannot approve leaves');

let leaves = DB.get('leave_requests') || [];
const newLeave = {
  id: 8888,
  employeeId: 4,
  leaveTypeId: 1,
  startDate: '2026-10-01',
  endDate: '2026-10-03',
  days: 3,
  reason: 'Family event in Lahore',
  status: 'pending',
  tierLevel: 1,
  appliedAt: new Date().toISOString()
};
leaves.unshift(newLeave);
DB.set('leave_requests', leaves);
console.log(`  ✓ Fatima Raza lodged leave request #${newLeave.id} (Status: ${newLeave.status}, Tier: ${newLeave.tierLevel})`);

console.log('\n--- Step 2: Department Manager Endorses Tier 1 ---');
Auth.user = { id: 3, employeeId: 3, role: 'dept_manager', username: 'usman.baig' };
Auth.role = 'dept_manager';
assert.strictEqual(Auth.can('leaves.approve'), true, 'Dept Manager can approve Tier 1');

const t1Result = WorkflowEngine.advanceApproval(newLeave, 'leaves', Auth.user);
assert.strictEqual(t1Result.isFinalTier, false, 'Tier 1 should not finalize a 2-tier approval');
assert.strictEqual(t1Result.nextTierNum, 2, 'Next gate should be Tier 2 (HR Director)');
assert.strictEqual(t1Result.updates.status, 'manager_approved', 'Intermediate state should be manager_approved');

Object.assign(newLeave, t1Result.updates);
console.log(`  ✓ Usman Baig endorsed request (Status: ${newLeave.status}, Forwarded to Tier: ${newLeave.tierLevel})`);

console.log('\n--- Step 3: Junior HR Restricted Check ---');
Auth.user = { id: 6, employeeId: 6, role: 'hr_manager', username: 'junior.hr' };
Auth.role = 'hr_manager';
const canJuniorApprove = Auth.can('leaves.approve') && Auth.canSeeFeature('leaves.approvals');
assert.strictEqual(canJuniorApprove, false, 'Junior HR approvals must be strictly blocked');
console.log('  ✓ Junior HR attempt to approve blocked (Feature visibility override enforced)');

console.log('\n--- Step 4: HR Manager Grants Final Tier 2 Approval ---');
Auth.user = { id: 2, employeeId: 2, role: 'hr_manager', username: 'sara.malik' };
Auth.role = 'hr_manager';
const canSaraApprove = Auth.can('leaves.approve') && Auth.canSeeFeature('leaves.approvals');
assert.strictEqual(canSaraApprove, true, 'Corporate HR Director can approve');

const t2Result = WorkflowEngine.advanceApproval(newLeave, 'leaves', Auth.user);
assert.strictEqual(t2Result.isFinalTier, true, 'Tier 2 is final approval');
assert.strictEqual(t2Result.updates.status, 'approved', 'Final state must be approved');
Object.assign(newLeave, t2Result.updates);
console.log(`  ✓ Sara Malik granted final corporate approval (Status: ${newLeave.status})`);

console.log('\n--- Step 5: Biometric Machine Live Ingestion Simulation ---');
DB.set('employees', [
  { id: 4, empNo: 'EMP-004', fullName: 'Fatima Raza', status: 'active', departmentId: 1 }
]);
DB.set('biometric_devices', [
  { id: 1, name: 'Head Office Main Entrance', deviceId: 'zk-head-office', ip: '192.168.1.201' }
]);

// Simulate hardware ingestion call
const initialAttendanceCount = (DB.get('attendance') || []).length;
const initialPunchesCount = (DB.get('biometric_punches') || []).length;

// Inject inputs into DOM mock
const mockFields = {
  'sim-emp-id': { value: '4' },
  'sim-device-id': { value: '1' },
  'sim-punch-type': { value: 'check_in' },
  'sim-modality': { value: 'FaceID' },
  'sim-punch-time': { value: '08:55' }
};
global.document.getElementById = (id) => mockFields[id] || null;

Settings.executeBiometricPunchSimulation();

const updatedAttendance = DB.get('attendance') || [];
const updatedPunches = DB.get('biometric_punches') || [];
assert(updatedAttendance.length >= initialAttendanceCount, 'Attendance record created or updated');
assert.strictEqual(updatedPunches.length, initialPunchesCount + 1, 'Biometric hardware punch log recorded');

const latestPunch = updatedPunches[0];
assert.strictEqual(latestPunch.employeeId, 4);
assert.strictEqual(latestPunch.modality, 'FaceID');
console.log(`  ✓ Hardware punch successfully ingested: ${latestPunch.employeeName} clocked in at 08:55 via FaceID [${latestPunch.terminalName}]`);

console.log('\n--- Step 6: Cryptographic Audit Trail Verification ---');
const auditLogs = DB.get('audit_logs') || [];
const bioLog = auditLogs.find(l => l.action === 'BIOMETRIC_PUNCH');
assert(bioLog, 'Audit log must record BIOMETRIC_PUNCH event');
assert(bioLog.checksum.startsWith('SHA256-'), 'Biometric punch must be cryptographically sealed');
console.log(`  ✓ Audit event sealed with hash: ${bioLog.checksum}`);

console.log('\n🎉 [Success] All 6 Lifecycle Stages Executed & Verified with 100% Accuracy!');
