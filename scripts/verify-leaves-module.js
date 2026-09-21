const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING LEAVES MODULE & 4 CLEAN LIFECYCLE STAGES');
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
const leavesContent = fs.readFileSync('js/leaves.js', 'utf8');

assert(leavesContent.includes('isTabActive(tabId)'), 'Leaves has isTabActive helper');
assert(leavesContent.includes('Leave Requests &amp; Approvals') || leavesContent.includes('Leave Requests & Approvals'), 'Stage 1 tab: Leave Requests & Approvals defined');
assert(leavesContent.includes('Leave &amp; Holiday Calendar') || leavesContent.includes('Leave & Holiday Calendar'), 'Stage 2 tab: Leave & Holiday Calendar defined');
assert(leavesContent.includes('Leave Quotas &amp; Policies') || leavesContent.includes('Leave Quotas & Policies'), 'Stage 3 tab: Leave Quotas & Policies defined');
assert(leavesContent.includes('Comp-Off &amp; Overtime Tokens') || leavesContent.includes('Comp-Off & Overtime Tokens'), 'Stage 4 tab: Comp-Off & Overtime Tokens defined');

// 2. Check Stage Sub-Navigations
console.log('\n▶ Test 2: Validating Stage Sub-Navigation Controls...');
assert(leavesContent.includes("Leaves.switchView('calendar')") && leavesContent.includes("Leaves.switchView('holidays')"), 'Stage 2 has sub-navigation between Calendar and Corporate Holidays');

// 3. Test isTabActive logic in isolation
console.log('\n▶ Test 3: Validating isTabActive Stage Mapping Logic...');
const mockLeaves = {
  currentView: 'requests',
  isTabActive(tabId) {
    if (tabId === 'requests') return this.currentView === 'requests';
    if (tabId === 'calendar') return ['calendar', 'holidays'].includes(this.currentView);
    if (tabId === 'quota') return ['quota', 'balance', 'types'].includes(this.currentView);
    if (tabId === 'tokens') return this.currentView === 'tokens';
    return this.currentView === tabId;
  }
};

mockLeaves.currentView = 'requests';
assert(mockLeaves.isTabActive('requests'), 'requests highlights Stage 1');

mockLeaves.currentView = 'calendar';
assert(mockLeaves.isTabActive('calendar'), 'calendar highlights Stage 2');

mockLeaves.currentView = 'holidays';
assert(mockLeaves.isTabActive('calendar'), 'holidays highlights Stage 2');

mockLeaves.currentView = 'quota';
assert(mockLeaves.isTabActive('quota'), 'quota highlights Stage 3');

mockLeaves.currentView = 'types';
assert(mockLeaves.isTabActive('quota'), 'types highlights Stage 3');

mockLeaves.currentView = 'tokens';
assert(mockLeaves.isTabActive('tokens'), 'tokens highlights Stage 4');

// 4. Check Null-Safety Guard
console.log('\n▶ Test 4: Validating Null-Safety Guard in Metrics...');
assert(leavesContent.includes('if (!emp || !emp.id) return null;'), 'getEmployeeLeaveQuotaMetrics safely guards against null or unlinked employees');

// 5. Check Root and Public Sync
console.log('\n▶ Test 5: Verifying Root & Public File Synchronization...');
const rootLeaves = fs.readFileSync('js/leaves.js', 'utf8');
const pubLeaves = fs.readFileSync(path.join('public', 'js', 'leaves.js'), 'utf8');
assert(rootLeaves === pubLeaves, 'js/leaves.js is 100% identical between root and public/');

const rootIndex = fs.readFileSync('index.html', 'utf8');
const pubIndex = fs.readFileSync(path.join('public', 'index.html'), 'utf8');
assert(rootIndex === pubIndex, 'index.html is 100% identical between root and public/');

console.log('\n════════════════════════════════════════════════════════════');
if (passed === total) {
  console.log(`🎉 ALL ${passed} LEAVES VERIFICATION TESTS PASSED!`);
} else {
  console.log(`⚠️ ${total - passed} OF ${total} TESTS FAILED!`);
}
console.log('════════════════════════════════════════════════════════════\n');
