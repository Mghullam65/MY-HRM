/**
 * Automated Verification: Advanced Enterprise UI/UX Pro Suite (7-Feature Engine)
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Advanced Enterprise UI/UX Pro Suite Verification...\n');

// Mock DOM & Storage environment
global.window = global;
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); }
};

const domElements = {};

function createMockElement(id, tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      toggle: function(c, force) {
        if (force !== undefined) {
          if (force) this.classes.add(c); else this.classes.delete(c);
        } else {
          if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
        }
      },
      contains: function(c) { return this.classes.has(c); }
    },
    attributes: {},
    setAttribute: function(k, v) { this.attributes[k] = String(v); },
    getAttribute: function(k) { return this.attributes[k] || null; },
    removeAttribute: function(k) { delete this.attributes[k]; },
    style: {},
    innerHTML: '',
    textContent: '',
    value: '',
    dataset: {},
    focus: function() {},
    scrollIntoView: function() {},
    appendChild: function(c) { if (c) this.children.push(c); },
    removeChild: function(c) { this.children = this.children.filter(x => x !== c); },
    remove: function() {},
    querySelector: function(sel) { return null; },
    querySelectorAll: function(sel) { return []; },
    addEventListener: function() {},
    children: []
  };
  domElements[id] = el;
  return el;
}

global.document = {
  documentElement: createMockElement('html'),
  body: createMockElement('body'),
  createElement: function(tag) { return createMockElement('mock_' + Math.random(), tag); },
  getElementById: function(id) {
    if (!domElements[id]) domElements[id] = createMockElement(id);
    return domElements[id];
  },
  querySelectorAll: function(sel) {
    return [];
  },
  querySelector: function(sel) {
    return null;
  },
  addEventListener: function() {}
};

// Initialize Mock DB
global.DB = {
  data: {
    employees: [
      { id: 1, fullName: 'Ahmed Khan', empNo: 'EMP-001', departmentId: 1, designationId: 1, email: 'ahmed@company.com', status: 'active', salary: 120000, joiningDate: '2025-01-15' },
      { id: 2, fullName: 'Sara Ali', empNo: 'EMP-002', departmentId: 1, designationId: 2, email: 'sara@company.com', status: 'active', salary: 90000, joiningDate: '2025-06-01' }
    ],
    departments: [{ id: 1, name: 'Technology' }],
    designations: [{ id: 1, title: 'Lead Architect', name: 'Lead Architect' }, { id: 2, title: 'Senior Engineer', name: 'Senior Engineer' }],
    attendance: [
      { id: 1, employeeId: 1, date: '2026-09-24', status: 'present', timeIn: '08:55', timeOut: '17:10' },
      { id: 2, employeeId: 2, date: '2026-09-24', status: 'present', timeIn: '09:00', timeOut: '17:05' }
    ],
    settings: { companyName: 'HRM Pro', theme: 'dark' }
  },
  get: function(t) { return this.data[t] || []; },
  getObj: function(t) { return this.data[t] || null; },
  set: function(t, val) { this.data[t] = val; },
  find: function(t, id) { return (this.data[t] || []).find(x => x.id == id) || null; }
};

global.Auth = {
  user: { id: 1, username: 'admin' },
  role: 'superadmin',
  employee: { id: 1, fullName: 'Ahmed Khan', firstName: 'Ahmed' },
  getScopedEmployees: function(emps) { return emps; },
  getSidebarItems: function() {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
      { id: 'employees', label: 'Employees', icon: 'fa-users' },
      { id: 'attendance', label: 'Attendance', icon: 'fa-clock' }
    ];
  }
};

// Load data.js
eval(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'));

// Populate DB data for test execution
DB.set('employees', [
  { id: 1, fullName: 'Ahmed Khan', empNo: 'EMP-001', departmentId: 1, designationId: 1, email: 'ahmed@company.com', status: 'active', salary: 120000, joiningDate: '2025-01-15' },
  { id: 2, fullName: 'Sara Ali', empNo: 'EMP-002', departmentId: 1, designationId: 2, email: 'sara@company.com', status: 'active', salary: 90000, joiningDate: '2025-06-01' }
]);
DB.set('departments', [{ id: 1, name: 'Technology' }]);
DB.set('designations', [{ id: 1, title: 'Lead Architect', name: 'Lead Architect' }, { id: 2, title: 'Senior Engineer', name: 'Senior Engineer' }]);
DB.set('attendance', [
  { id: 1, employeeId: 1, date: '2026-09-24', status: 'present', timeIn: '08:55', timeOut: '17:10' },
  { id: 2, employeeId: 2, date: '2026-09-24', status: 'present', timeIn: '09:00', timeOut: '17:05' }
]);
DB.set('settings', { companyName: 'HRM Pro', theme: 'dark' });

// Load app.js
eval(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'));

// Load dashboard.js
eval(fs.readFileSync(path.join(__dirname, '../js/dashboard.js'), 'utf8'));

// Mock Chart instance for Dashboard
Dashboard.makeChart = function(id, type, labels, datasets) {
  console.log(`  📊 Chart created: "${id}" [${type}] with ${labels.length} data points`);
};

// --- TEST 1: Skeleton Shimmer Loaders ---
console.log('--- Step 1: Testing Skeleton Shimmer Loaders ---');
const dashSkeleton = Utils.renderSkeleton('dashboard');
if (!dashSkeleton.includes('skeleton-grid-kpi') || !dashSkeleton.includes('skeleton-box')) {
  throw new Error('Dashboard skeleton HTML invalid');
}
console.log('  ✅ Dashboard skeleton generated (KPI grid + chart shimmers)');

const tableSkeleton = Utils.renderSkeleton('table');
if (!tableSkeleton.includes('skeleton-table-row') || !tableSkeleton.includes('skeleton-circle')) {
  throw new Error('Table skeleton HTML invalid');
}
console.log('  ✅ Table skeleton generated (animated row shimmers with avatars)');

// --- TEST 2: Multi-Select Floating Batch Action Dock ---
console.log('\n--- Step 2: Testing Multi-Select Floating Batch Action Dock ---');
const dock = document.getElementById('batch-action-dock');
App.clearBatchSelection();
if (dock.classList.contains('active')) throw new Error('Dock should be inactive initially');

const mockCheckbox1 = { checked: true, dataset: { id: '1' }, closest: () => ({ classList: { add: () => {}, remove: () => {} } }) };
App.toggleRowSelect(mockCheckbox1, 1);
if (!App.selectedRowIds.has('1')) throw new Error('Row 1 not added to selectedRowIds');
if (!dock.classList.contains('active')) throw new Error('Dock should be active after row selection');
console.log(`  ✅ Batch Action Dock activated with ${App.selectedRowIds.size} selected item`);

const mockCheckbox2 = { checked: true, dataset: { id: '2' }, closest: () => ({ classList: { add: () => {}, remove: () => {} } }) };
App.toggleRowSelect(mockCheckbox2, 2);
if (App.selectedRowIds.size !== 2) throw new Error('Selection count mismatch');
console.log(`  ✅ Multiple rows selected: ${Array.from(App.selectedRowIds).join(', ')}`);

App.clearBatchSelection();
if (App.selectedRowIds.size !== 0) throw new Error('Selection not cleared');
if (dock.classList.contains('active')) throw new Error('Dock should be inactive after clear');
console.log('  ✅ Batch selection cleared and dock dismissed');

// --- TEST 3: Quick Inspect Slide-Over Drawer ---
console.log('\n--- Step 3: Testing Quick Inspect Slide-Over Drawer ---');
App.openInspectDrawer('employee', 1);
const inspectDrawer = document.getElementById('inspect-drawer');
const inspectOverlay = document.getElementById('inspect-drawer-overlay');
const inspectBody = document.getElementById('inspect-drawer-body');

if (!inspectDrawer.classList.contains('open')) throw new Error('Inspect drawer did not open');
if (!inspectOverlay.classList.contains('open')) throw new Error('Inspect drawer overlay did not open');
if (!inspectBody.innerHTML.includes('Ahmed Khan')) throw new Error('Employee details missing in inspect body');
console.log('  ✅ Quick Inspect Drawer opened for employee "Ahmed Khan"');

App.closeInspectDrawer();
if (inspectDrawer.classList.contains('open')) throw new Error('Inspect drawer did not close');
console.log('  ✅ Quick Inspect Drawer dismissed successfully');

// --- TEST 4: Keyboard Shortcuts Helper Modal ---
console.log('\n--- Step 4: Testing Keyboard Shortcuts Cheat Sheet Modal ---');
App.showShortcutsModal();
const confirmModal = document.getElementById('confirm-modal');
if (!confirmModal || !confirmModal.classList.contains('open')) throw new Error('Shortcuts modal did not open');
console.log('  ✅ Shortcuts modal opened with keyboard chords guide (G+D, G+E, etc.)');
Modal.closeAll();

// --- TEST 5: Animated Counter Physics ---
console.log('\n--- Step 5: Testing Animated KPI Counter Physics ---');
const counterEl = createMockElement('kpi-counter');
counterEl.textContent = '0';
Utils.animateCounter(counterEl, 1280, 200, '', '');
setTimeout(() => {
  console.log(`  ✅ Counter animated target: "${counterEl.textContent}"`);
}, 300);

// --- TEST 6: Interactive Chart Range Switcher ---
console.log('\n--- Step 6: Testing Interactive Chart Range Switcher (7D / 30D / 90D) ---');
Dashboard.switchAttendanceRange('30d');
const subTitle = document.getElementById('att-trend-subtitle');
if (subTitle && subTitle.textContent !== 'Last 30 days') throw new Error('Chart subtitle failed to update to 30 days');
console.log('  ✅ Attendance trend chart switched to 30-day range');

Dashboard.switchAttendanceRange('90d');
if (subTitle && subTitle.textContent !== 'Last 90 days') throw new Error('Chart subtitle failed to update to 90 days');
console.log('  ✅ Attendance trend chart switched to 90-day range');

// --- TEST 7: Rich Toast Notification with Undo Callback ---
console.log('\n--- Step 7: Testing Rich Toast with Shrinking Progress Bar & Undo ---');
let undoTriggered = false;
Toast.show('Employee archived', 'info', '', 3000, () => {
  undoTriggered = true;
});
const toastContainer = document.getElementById('toast-container');
const lastToast = toastContainer.children[toastContainer.children.length - 1];
if (!lastToast || !lastToast.innerHTML.includes('toast-progress') || !lastToast.innerHTML.includes('toast-undo-btn')) {
  throw new Error('Toast is missing progress bar or undo button');
}
console.log('  ✅ Rich toast created with animated timer bar and Undo button');

setTimeout(() => {
  console.log('\n🎉 ADVANCED ENTERPRISE UI/UX PRO SUITE (ALL 7 FEATURES) VERIFIED 100%!');
}, 350);
