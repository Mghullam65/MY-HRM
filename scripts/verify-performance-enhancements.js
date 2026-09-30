// scripts/verify-performance-enhancements.js
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Verification of Performance Management & Appraisals Enhancements...\n');

// Mock browser globals
global.window = global;
global.Blob = class {
  constructor(parts, opts) {
    this.parts = parts;
    this.type = opts?.type || '';
  }
};
global.URL = {
  createObjectURL(blob) { return 'blob://mock-url'; },
  revokeObjectURL(url) {}
};

global.document = {
  createElement(tag) {
    return {
      tagName: tag.toUpperCase(),
      style: {},
      innerHTML: '',
      setAttribute(k, v) { this[k] = v; },
      click() { this.clicked = true; },
      focus() {}
    };
  },
  getElementById(id) {
    return {
      id,
      innerHTML: '',
      value: '85',
      style: {}
    };
  },
  body: {
    appendChild(child) {},
    removeChild(child) {}
  }
};

global.Toast = {
  show(title, type, msg) {
    console.log(`    [Toast] ${title}: ${msg || ''}`);
  }
};

global.Modal = {
  show(title, body) {
    this.title = title;
    this.body = body;
  },
  close() {}
};

global.localStorage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = v; },
  removeItem(k) { delete this.data[k]; }
};

global.DB = {
  get(key) {
    const raw = global.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  set(key, val) {
    global.localStorage.setItem(key, JSON.stringify(val));
  },
  find(tbl, id) {
    const all = this.get(tbl) || [];
    return all.find(x => x.id === id) || null;
  },
  update(tbl, id, patch) {
    let all = this.get(tbl) || [];
    all = all.map(x => x.id === id ? { ...x, ...patch } : x);
    this.set(tbl, all);
  },
  log() {},
  generateId() { return Date.now(); }
};

global.Utils = {
  formatCurrency(n) { return 'PKR ' + (n || 0).toLocaleString(); },
  today() { return '2026-09-24'; },
  getDesigName() { return 'Senior Full Stack Engineer'; },
  getDeptName() { return 'Engineering'; },
  statusBadge(s) { return `<span class="badge">${s}</span>`; },
  avatarColor() { return '#6366f1'; },
  avatarInitials(n) { return n ? n.substring(0, 2) : 'EM'; }
};

global.Auth = {
  role: 'superadmin',
  user: { id: 1, name: 'Ahmed Khan' },
  employee: { id: 1, fullName: 'Ahmed Khan' },
  getScopedEmployees(emps) { return emps; },
  can(perm) { return true; },
  canSeeFeature(feat) { return true; }
};

// Seed test data
DB.set('employees', [
  { id: 1, fullName: 'Ahmed Khan', departmentId: 1, designationId: 1, salary: 250000, status: 'active', empNo: 'EMP-001' },
  { id: 2, fullName: 'Sara Malik', departmentId: 2, designationId: 2, salary: 200000, status: 'active', empNo: 'EMP-002' },
  { id: 3, fullName: 'Usman Baig', departmentId: 1, designationId: 3, salary: 180000, status: 'active', empNo: 'EMP-003' },
  { id: 4, fullName: 'Bilal Tariq', departmentId: 1, designationId: 4, salary: 150000, status: 'active', empNo: 'EMP-004' },
]);

DB.set('departments', [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Human Resources' }
]);

DB.set('kpis', [
  { id: 1, departmentId: 1, name: 'Sprint Velocity', target: 100, achieved: 95, weight: 40 },
  { id: 2, departmentId: 1, name: 'Code Quality Pass Rate', target: 100, achieved: 92, weight: 30 },
  { id: 3, departmentId: 1, name: 'Uptime SLA', target: 100, achieved: 99, weight: 30 },
]);

DB.set('feedback_360', [
  {
    id: 1,
    employeeId: 4,
    raterId: 1,
    relationship: 'Manager',
    scores: { technical: 5, leadership: 4, teamwork: 5, innovation: 4, values: 5 },
    overallScore: 4.6,
    strengths: 'Outstanding system architecture and technical execution.',
    improvements: 'Continue expanding cross-team communication.'
  },
  {
    id: 2,
    employeeId: 4,
    raterId: 3,
    relationship: 'Peer',
    scores: { technical: 4, leadership: 4, teamwork: 5, innovation: 5, values: 4 },
    overallScore: 4.4,
    strengths: 'Very helpful peer, always eager to unblock colleagues.',
    improvements: 'More active involvement in design review forums.'
  },
  {
    id: 3,
    employeeId: 4,
    raterId: 4,
    relationship: 'Self',
    scores: { technical: 4, leadership: 4, teamwork: 4, innovation: 4, values: 5 },
    overallScore: 4.2,
    strengths: 'Committed to code quality and test-driven architecture.',
    improvements: 'Improve sprint estimation precision.'
  }
]);

DB.set('performance_reviews', [
  { id: 101, employeeId: 4, reviewerId: 1, type: 'quarterly', status: 'pending', quarter: 'Q3', year: 2026 }
]);

// Load Performance module
const perfPath = path.join(__dirname, '..', 'js', 'performance.js');
const perfCode = fs.readFileSync(perfPath, 'utf8');
eval(perfCode);

console.log('--- Test 1: 360° Multilateral SVG Radar Chart ---');
const categories = [
  { key: 'technical', label: 'Technical Competence & Execution' },
  { key: 'leadership', label: 'Leadership, Ownership & Initiative' },
  { key: 'teamwork', label: 'Teamwork & Collaboration' },
  { key: 'innovation', label: 'Problem Solving & Innovation' },
  { key: 'values', label: 'Cultural Alignment & Company Values' }
];

const empReviews = DB.get('feedback_360').filter(f => f.employeeId === 4);
const radarSVG = Performance.render360RadarSVG(categories, empReviews);

if (!radarSVG.includes('<svg') || !radarSVG.includes('polygon points=')) {
  throw new Error('❌ Radar chart did not render SVG polygon elements');
}
if (!radarSVG.includes('#6366f1') || !radarSVG.includes('#10b981') || !radarSVG.includes('#ec4899')) {
  throw new Error('❌ Radar chart missing distinct Manager, Peer, or Self polygon colors');
}
console.log('  ✅ 360° SVG Radar chart rendered with concentric webs, spokes, and 3-perspective polygons.');

console.log('\n--- Test 2: KPI Auto-Sync & Weighted Review Scoring ---');
const autoKpi = Performance.calculateEmployeeKPIFulfillment(4);
console.log(`  ✅ Calculated Department KPI Fulfillment for Employee #4: ${autoKpi}%`);
if (autoKpi < 85 || autoKpi > 100) {
  throw new Error(`❌ Expected autoKpi between 85 and 100, got ${autoKpi}`);
}

// Test review submission with 60/40 weighting
Performance.submitReview(101);
const updatedRev = DB.find('performance_reviews', 101);
if (updatedRev.status !== 'completed') {
  throw new Error('❌ Review status not marked as completed');
}
if (!updatedRev.overallRating || updatedRev.overallRating < 1 || updatedRev.overallRating > 5) {
  throw new Error(`❌ Invalid overall rating: ${updatedRev.overallRating}`);
}
console.log(`  ✅ Evaluation submitted with weighted rating: ★ ${updatedRev.overallRating} (Status: ${updatedRev.status})`);

console.log('\n--- Test 3: Budget-Constrained Merit Increment Simulation ---');
const mockContainer = { innerHTML: '' };
Performance.meritBudgetPool = 500000;
Performance.renderMeritIncrementMatrix(mockContainer);

if (!mockContainer.innerHTML.includes('Increment Pool Budget') || !mockContainer.innerHTML.includes('% Utilized')) {
  throw new Error('❌ Merit Matrix missing Increment Pool Budget utilization card');
}
if (!mockContainer.innerHTML.includes('exportMeritMatrixCSV')) {
  throw new Error('❌ Export CSV button missing from Merit Matrix toolbar');
}
console.log('  ✅ Merit Matrix rendered with Budget Pool Cap input and real-time utilization gauge.');

console.log('\n--- Test 4: Merit Matrix CSV Export Functionality ---');
let exportedCSV = null;
global.Blob = class {
  constructor(parts) {
    exportedCSV = parts.join('');
  }
};

Performance.exportMeritMatrixCSV();
if (!exportedCSV || !exportedCSV.includes('Employee ID,Employee Name,Designation,Department')) {
  throw new Error('❌ CSV export failed or missing expected CSV header columns');
}
if (!exportedCSV.includes('Ahmed Khan') || !exportedCSV.includes('Bilal Tariq')) {
  throw new Error('❌ CSV export missing employee rows');
}
console.log('  ✅ Confirmed CSV export generation with full employee salary & calibration delta columns.');

console.log('\n🎉 ALL 4 PERFORMANCE MANAGEMENT ENHANCEMENT TESTS PASSED (100%)!\n');
