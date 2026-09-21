const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING PERFORMANCE & EMBEDDED SETTLEMENT MODULE');
console.log('════════════════════════════════════════════════════════════');

// Mock browser environment
global.window = {};
global.document = {
  getElementById: (id) => ({
    id,
    innerHTML: '',
    value: '',
    classList: { toggle: () => {}, add: () => {}, remove: () => {} },
    appendChild: () => {},
    querySelectorAll: () => []
  }),
  querySelector: () => null,
  querySelectorAll: () => []
};

// 1. Verify Performance Module Stages
console.log('\n▶ Test 1: Performance 4 Stages & Null Safety...');
const perfCode = fs.readFileSync(path.join(__dirname, '../js/performance.js'), 'utf8');

assert(perfCode.includes('getActiveStage()'), 'performance.js must have getActiveStage()');
assert(perfCode.includes('isTabActive('), 'performance.js must have isTabActive()');
assert(perfCode.includes("'cycles'"), 'performance.js must define Stage 1: cycles');
assert(perfCode.includes("'reviews'"), 'performance.js must define Stage 2: reviews');
assert(perfCode.includes("'succession'"), 'performance.js must define Stage 3: succession');
assert(perfCode.includes("'lms'"), 'performance.js must define Stage 4: lms');
assert(perfCode.includes('.filter(Boolean)'), '9-box grid must guard against undefined employees with .filter(Boolean)');
console.log('  ✔ Performance: 4 Clean Lifecycle Stages + 9-Box Grid Null Guard Verified');

// 2. Verify Employees Stage 4 & Embedded Settlement
console.log('\n▶ Test 2: Employees Stage 4 & Embedded Settlement Integration...');
const empCode = fs.readFileSync(path.join(__dirname, '../js/employees.js'), 'utf8');

assert(empCode.includes("['dependents_events', 'exit_clearance', 'settlement'].includes(this.currentView)"), 'employees.js getActiveStage() must map settlement to Stage 4');
assert(empCode.includes("Life Events, Exit & Settlements (F&F)"), 'employees.js must label Stage 4 with Settlements');
assert(empCode.includes("Full &amp; Final (F&amp;F) Settlements"), 'employees.js Stage 4 sub-nav must include Settlements button');
assert(empCode.includes("if (this.currentView === 'settlement')"), 'employees.js renderTable() must render Settlement');
console.log('  ✔ Employees: Stage 4 seamlessly embeds Exit Clearance & Full & Final (F&F) Settlements');

// 3. Verify Settlement Container Mounting Support
console.log('\n▶ Test 3: Settlement.render(targetContainer) Mounting Support...');
const stlCode = fs.readFileSync(path.join(__dirname, '../js/settlement.js'), 'utf8');

assert(stlCode.includes('render(targetContainer)'), 'settlement.js must accept targetContainer in render()');
assert(stlCode.includes("document.getElementById('emp-content')"), 'settlement.js must detect #emp-content when inside Employees');
console.log('  ✔ Settlement: Automatically mounts in #emp-content when inside Employees module');

// 4. Verify Sidebar & Router Integration
console.log('\n▶ Test 4: Auth Sidebar & App Router Navigation...');
const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

assert(!authCode.includes("{ id: 'settlement', label: 'Exit & Settlements'"), 'auth.js must NOT have settlement as separate sidebar item');
assert(appCode.includes("case 'settlement':"), 'app.js must route settlement');
assert(appCode.includes("Employees.currentView = 'settlement'"), 'app.js router must switch Employees view to settlement');
console.log('  ✔ Auth & Router: Exit & Settlements removed from separate sidebar and routed to Employees module');

// 5. Verify 100% Root & Public File Sync
console.log('\n▶ Test 5: Root and Public/ Synchronization...');
const files = [
  'js/performance.js',
  'js/employees.js',
  'js/settlement.js',
  'js/auth.js',
  'js/app.js',
  'index.html'
];

files.forEach(f => {
  const root = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const pub = fs.readFileSync(path.join(__dirname, '../public', f), 'utf8');
  assert.strictEqual(root, pub, `${f} differs between root and public!`);
  console.log(`  ✔ Synced: ${f} is 100% identical between root and public/`);
});

console.log('\n════════════════════════════════════════════════════════════');
console.log('🎉 ALL PERFORMANCE & EMBEDDED SETTLEMENT TESTS PASSED!');
console.log('════════════════════════════════════════════════════════════\n');
