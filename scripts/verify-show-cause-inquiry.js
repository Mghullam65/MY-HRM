/**
 * Verification Script: Disciplinary Inquiry & Formal Show-Cause Notice System
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Disciplinary Inquiry & Show-Cause Notice Verification Test...\n');

// Mock DOM & Storage environment
global.window = global;
global.window.open = () => ({
  document: { write: () => {}, close: () => {} },
  focus: () => {},
  print: () => {}
});

const formValues = {
  'scn-emp': '2',
  'scn-type': '1',
  'scn-issue-date': '2026-09-24',
  'scn-deadline': '2026-10-01',
  'scn-title': 'Show-Cause Notice for Continuous Unauthorized Absence',
  'scn-allegations': 'Absent without authorized leave for 4 consecutive working days.',
  'scn-evidence': 'Biometric machine logs and line manager confirmation.',
  'scn-auth': 'Director of Human Resources & Legal Affairs',

  'exp-plea': 'admission_mitigation',
  'exp-statement': 'I deeply regret the absence caused by severe sudden medical hospitalization of my family member. Attached medical certificates prove the unavoidable circumstances.',
  'exp-proof': 'Hospital emergency admission slip #4912',

  'hm-date': '2026-10-03',
  'hm-venue': 'Corporate Boardroom B',
  'hm-presiding': 'Head of Legal & Governance',
  'hm-members': 'Senior HR Director, Operations Unit Lead',
  'hm-notes': 'The Committee reviewed the biometric punch logs and the employee defense with medical documentation. While the emergency was genuine, procedural notice was omitted.',
  'hm-finding': 'partially_proven',
  'hm-recommendation': 'Issuance of formal First Written Warning and 15-day remediation counseling.',

  'sanc-type': 'written_warning',
  'sanc-amount': '5000',
  'sanc-days': '0',
  'sanc-notes': 'In view of mitigating factors, committee orders a formal Written Warning and counseling.'
};

global.document = {
  getElementById: (id) => ({
    value: formValues[id] || '',
    style: {}
  }),
  createElement: () => ({ style: {}, setAttribute: () => {} })
};

const mockDBData = {
  employees: [
    { id: 1, fullName: 'Ahmed Khan', empNo: 'EMP-001', departmentId: 1, department: 'Technology', salary: 120000, status: 'active', role: 'employee' },
    { id: 2, fullName: 'Sara Ali', empNo: 'EMP-002', departmentId: 1, department: 'Technology', salary: 90000, status: 'active', role: 'employee' }
  ],
  departments: [
    { id: 1, name: 'Technology' }
  ],
  disciplinary_types: [
    { id: 1, code: 'VIO-ABS', name: 'Unauthorized / Chronic Absenteeism', severity: 'major' },
    { id: 2, code: 'VIO-INSUB', name: 'Willful Insubordination', severity: 'severe' }
  ],
  disciplinary_actions: [],
  show_cause_notices: [],
  warning_letters: [],
  salary_revisions: [],
  company: { name: 'Apex Technologies Ltd', address: 'Plot 42, Blue Area, Islamabad' }
};

global.DB = {
  get: (key) => mockDBData[key] || [],
  set: (key, val) => { mockDBData[key] = val; },
  find: (key, id) => (mockDBData[key] || []).find(x => x.id === id),
  update: (key, id, data) => {
    const list = mockDBData[key] || [];
    const item = list.find(x => x.id === id);
    if (item) Object.assign(item, data);
  },
  generateId: () => Date.now() + Math.floor(Math.random() * 1000),
  nextId: (table) => (mockDBData[table] || []).length + 1,
  log: (action, module, desc, userId) => {}
};

global.Auth = {
  role: 'superadmin',
  user: { id: 99, fullName: 'Super Administrator' },
  employee: { id: 1, fullName: 'Ahmed Khan' },
  getScopedEmployees: (list) => list
};

global.Utils = {
  today: () => '2026-09-24',
  thisMonth: () => '2026-09',
  formatCurrency: (n) => 'PKR ' + Number(n).toLocaleString(),
  formatDate: (d) => d || '2026-09-24',
  formatTime: (t) => t || '09:00',
  getEmpName: (id) => (mockDBData.employees.find(e => e.id === id)?.fullName || 'Staff'),
  getDeptName: (id) => (mockDBData.departments.find(d => d.id === id)?.name || 'General'),
  getDesigName: () => 'Staff Member',
  statusBadge: (status) => `<span class="badge">${status}</span>`,
  avatarInitials: (name) => (name || '').slice(0, 2),
  avatarColor: () => '#6366f1'
};

global.Toast = {
  show: (title, type, msg) => {
    console.log(`  📣 Toast [${type?.toUpperCase()}]: ${title} - ${msg || ''}`);
  }
};

global.Modal = {
  show: () => {},
  close: () => {}
};

// Load Employees module
const empCode = fs.readFileSync(path.join(__dirname, '../js/employees.js'), 'utf8');
eval(empCode + '\n;global.Employees = Employees;');

console.log('--- Step 1: Issuing Statutory Show-Cause Notice (7-Day Reply Mandate) ---');
const fakeEvent = { preventDefault: () => {} };
Employees.createShowCauseNotice(fakeEvent);

const scns = DB.get('show_cause_notices');
if (scns.length === 1 && scns[0].noticeNo.startsWith('SCN/')) {
  console.log(`  ✅ Show-Cause Notice created: ${scns[0].noticeNo} with reply deadline: ${scns[0].replyDeadline}`);
} else {
  throw new Error('Failed to create Show-Cause Notice');
}

console.log('\n--- Step 2: Employee Submits Formal Written Defense / Explanation ---');
Employees.submitShowCauseExplanation(fakeEvent, scns[0].id);

const updatedSCN = DB.get('show_cause_notices').find(s => s.id === scns[0].id);
if (updatedSCN && updatedSCN.status === 'explanation_submitted' && updatedSCN.employeeExplanation?.statement) {
  console.log(`  ✅ Employee defense recorded: Plea = "${updatedSCN.employeeExplanation.plea}"`);
} else {
  throw new Error('Failed to record employee defense statement');
}

console.log('\n--- Step 3: Inquiry Committee Hearing Minutes & Findings ---');
Employees.saveHearingMinutes(fakeEvent, scns[0].id);

const hearingSCN = DB.get('show_cause_notices').find(s => s.id === scns[0].id);
if (hearingSCN && hearingSCN.status === 'findings_recorded' && hearingSCN.hearingMinutes?.committeeFinding === 'partially_proven') {
  console.log(`  ✅ Inquiry Committee Proceedings recorded: Finding = "${hearingSCN.hearingMinutes.committeeFinding}"`);
} else {
  throw new Error('Failed to save Inquiry Committee findings');
}

console.log('\n--- Step 4: Enforcing Statutory Sanction & Decision Order ---');
Employees.enforceSanction(fakeEvent, scns[0].id);

const finalSCN = DB.get('show_cause_notices').find(s => s.id === scns[0].id);
const warningLetters = DB.get('warning_letters');

if (finalSCN && finalSCN.status === 'sanction_enforced' && finalSCN.sanction?.sanctionType === 'written_warning') {
  console.log(`  ✅ Sanction enforced: "${finalSCN.sanction.sanctionType}"`);
} else {
  throw new Error('Sanction enforcement failed');
}

if (warningLetters.length > 0 && warningLetters[0].title.includes('Show-Cause Inquiry')) {
  console.log(`  ✅ Formal Warning Letter auto-generated: "${warningLetters[0].title}" (${warningLetters[0].warningLetterNo})`);
} else {
  throw new Error('Warning letter was not auto-generated from inquiry sanction');
}

console.log('\n--- Step 5: Executive Print Document Generation ---');
Employees.printShowCauseNotice(scns[0].id);
Employees.printInquiryFindingsReport(scns[0].id);
console.log('  ✅ Show-Cause Notice & Inquiry Committee Report PDFs generated without error.');

console.log('\n🎉 DISCIPLINARY INQUIRY & SHOW-CAUSE NOTICE SYSTEM VERIFIED 100%!\n');
