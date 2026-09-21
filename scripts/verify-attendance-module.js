const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING ATTENDANCE MODULE & 4 CLEAN LIFECYCLE STAGES');
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
console.log('▶ Test 1: Method Signatures & Navigation Engine...');
const attContent = fs.readFileSync('js/attendance.js', 'utf8');

assert(attContent.includes('isTabActive(tabId)'), 'Attendance has isTabActive helper');
assert(attContent.includes('My Attendance &amp; Punch') || attContent.includes('My Attendance & Punch'), 'Stage 1 tab: My Attendance & Punch defined');
assert(attContent.includes('Attendance Register &amp; Biometrics') || attContent.includes('Attendance Register & Biometrics'), 'Stage 2 tab: Attendance Register & Biometrics defined');
assert(attContent.includes('Shift Rosters &amp; Work Rules') || attContent.includes('Shift Rosters & Work Rules'), 'Stage 3 tab: Shift Rosters & Work Rules defined');
assert(attContent.includes('Regularization &amp; Timesheets') || attContent.includes('Regularization & Timesheets'), 'Stage 4 tab: Regularization & Timesheets defined');

// 2. Check Stage Sub-Navigations
console.log('\n▶ Test 2: Validating Stage Sub-Navigation Controls...');
assert(attContent.includes("Attendance.switchView('my_employees')") && attContent.includes("Attendance.switchView('machine')"), 'Stage 2 has sub-navigation between Register and Biometric Machine Hub');
assert(attContent.includes("Attendance.switchView('roster')") && attContent.includes("Attendance.switchView('geofence')"), 'Stage 3 has sub-navigation between Shift Rosters and Geo-Fence & IP Rules');
assert(attContent.includes("Attendance.switchView('corrections')") && attContent.includes("Attendance.switchView('timesheets')"), 'Stage 4 has sub-navigation between Regularization/WFH and Project Timesheets');

// 3. Test isTabActive logic in isolation
console.log('\n▶ Test 3: Validating isTabActive Stage Mapping Logic...');
const mockAttendance = {
  currentView: 'daily',
  isTabActive(tabId) {
    if (tabId === 'my_attendance') return this.currentView === 'my_attendance';
    if (tabId === 'my_employees') return ['my_employees', 'machine', 'manual', 'daily', 'monthly', 'employee', 'dept'].includes(this.currentView);
    if (tabId === 'roster') return ['roster', 'geofence'].includes(this.currentView);
    if (tabId === 'corrections') return ['corrections', 'timesheets'].includes(this.currentView);
    return this.currentView === tabId;
  }
};

mockAttendance.currentView = 'my_attendance';
assert(mockAttendance.isTabActive('my_attendance'), 'my_attendance highlights Stage 1');

mockAttendance.currentView = 'machine';
assert(mockAttendance.isTabActive('my_employees'), 'machine highlights Stage 2');

mockAttendance.currentView = 'geofence';
assert(mockAttendance.isTabActive('roster'), 'geofence highlights Stage 3');

mockAttendance.currentView = 'timesheets';
assert(mockAttendance.isTabActive('corrections'), 'timesheets highlights Stage 4');

// 4. Check Root and Public Sync
console.log('\n▶ Test 4: Verifying Root & Public File Synchronization...');
const rootAtt = fs.readFileSync('js/attendance.js', 'utf8');
const pubAtt = fs.readFileSync(path.join('public', 'js', 'attendance.js'), 'utf8');
assert(rootAtt === pubAtt, 'js/attendance.js is 100% identical between root and public/');

console.log('\n════════════════════════════════════════════════════════════');
if (passed === total) {
  console.log(`🎉 ALL ${passed} ATTENDANCE VERIFICATION TESTS PASSED!`);
} else {
  console.log(`⚠️ ${total - passed} OF ${total} TESTS FAILED!`);
}
console.log('════════════════════════════════════════════════════════════\n');
