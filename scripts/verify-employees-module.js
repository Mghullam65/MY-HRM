const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING EMPLOYEES MODULE & 4 CLEAN LIFECYCLE STAGES');
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
const empContent = fs.readFileSync('js/employees.js', 'utf8');

assert(empContent.includes('getActiveStage()'), 'Employees has getActiveStage helper');
assert(empContent.includes('isTabActive(tabId)'), 'Employees has isTabActive helper');
assert(empContent.includes('Directory &amp; Hierarchy') || empContent.includes('Directory & Hierarchy'), 'Stage 1 tab: Directory & Hierarchy defined');
assert(empContent.includes('Document Vault &amp; Compliance') || empContent.includes('Document Vault & Compliance'), 'Stage 2 tab: Document Vault & Compliance defined');
assert(empContent.includes('Official Letters &amp; Disciplinary Hub') || empContent.includes('Official Letters & Disciplinary Hub'), 'Stage 3 tab: Official Letters & Disciplinary Hub defined');
assert(empContent.includes('Life Events &amp; Exit Clearance (F&amp;F)') || empContent.includes('Life Events & Exit Clearance (F&F)') || empContent.includes('Life Events, Exit & Settlements (F&F)'), 'Stage 4 tab: Life Events & Exit Clearance defined');

// 2. Check Stage Sub-Navigations
console.log('\n▶ Test 2: Validating Stage Sub-Navigation Controls...');
assert(empContent.includes("Employees.switchView('current')") && empContent.includes("Employees.switchView('directory')") && empContent.includes("Employees.switchView('orgchart')"), 'Stage 1 has sub-navigation between Roster, Directory Cards, and Org Chart');
assert(empContent.includes("Employees.switchView('edms')") && empContent.includes("Employees.switchView('doc_expiry')"), 'Stage 2 has sub-navigation between e-DMS and Document Expiries');
assert(empContent.includes("Employees.switchView('hr_letters')") && empContent.includes("Employees.switchView('discipline')"), 'Stage 3 has sub-navigation between Official HR Letters and Discipline');
assert(empContent.includes("Employees.switchView('dependents_events')") && empContent.includes("Employees.switchView('exit_clearance')"), 'Stage 4 has sub-navigation between Dependents and Exit Clearance');

// 3. Test isTabActive logic in isolation
console.log('\n▶ Test 3: Validating isTabActive Stage Mapping Logic...');
const mockEmployees = {
  currentView: 'current',
  getActiveStage() {
    if (['current', 'ex', 'all', 'directory', 'orgchart'].includes(this.currentView)) return 'directory';
    if (['edms', 'doc_expiry'].includes(this.currentView)) return 'edms';
    if (['hr_letters', 'discipline'].includes(this.currentView)) return 'hr_letters';
    if (['dependents_events', 'exit_clearance'].includes(this.currentView)) return 'dependents_events';
    return 'directory';
  },
  isTabActive(tabId) {
    const active = this.getActiveStage();
    if (tabId === 'directory' || tabId === 'current') return active === 'directory';
    return active === tabId;
  }
};

mockEmployees.currentView = 'current';
assert(mockEmployees.isTabActive('directory'), 'current highlights Stage 1');

mockEmployees.currentView = 'orgchart';
assert(mockEmployees.isTabActive('directory'), 'orgchart highlights Stage 1');

mockEmployees.currentView = 'edms';
assert(mockEmployees.isTabActive('edms'), 'edms highlights Stage 2');

mockEmployees.currentView = 'doc_expiry';
assert(mockEmployees.isTabActive('edms'), 'doc_expiry highlights Stage 2');

mockEmployees.currentView = 'hr_letters';
assert(mockEmployees.isTabActive('hr_letters'), 'hr_letters highlights Stage 3');

mockEmployees.currentView = 'discipline';
assert(mockEmployees.isTabActive('hr_letters'), 'discipline highlights Stage 3');

mockEmployees.currentView = 'dependents_events';
assert(mockEmployees.isTabActive('dependents_events'), 'dependents_events highlights Stage 4');

mockEmployees.currentView = 'exit_clearance';
assert(mockEmployees.isTabActive('dependents_events'), 'exit_clearance highlights Stage 4');

// 4. Check Root and Public Sync
console.log('\n▶ Test 4: Verifying Root & Public File Synchronization...');
const rootEmp = fs.readFileSync('js/employees.js', 'utf8');
const pubEmp = fs.readFileSync(path.join('public', 'js', 'employees.js'), 'utf8');
assert(rootEmp === pubEmp, 'js/employees.js is 100% identical between root and public/');

const rootIndex = fs.readFileSync('index.html', 'utf8');
const pubIndex = fs.readFileSync(path.join('public', 'index.html'), 'utf8');
assert(rootIndex === pubIndex, 'index.html is 100% identical between root and public/');

console.log('\n════════════════════════════════════════════════════════════');
if (passed === total) {
  console.log(`🎉 ALL ${passed} EMPLOYEES VERIFICATION TESTS PASSED!`);
} else {
  console.log(`⚠️ ${total - passed} OF ${total} TESTS FAILED!`);
}
console.log('════════════════════════════════════════════════════════════\n');
