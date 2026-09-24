/**
 * Verification Script: Core HRM 4-Feature Quad Suite
 * 1. Shift Scheduling & Shift Swap Roster (Attendance)
 * 2. Annual Leave Encashment & Carry-Forward Engine (Leaves)
 * 3. Performance Appraisal Cycles & Merit Increment Matrix (Performance)
 * 4. Probation Management & Official Confirmation Workflow (Employees)
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Core HRM 4-Feature Verification Test...\n');

// Mock DOM & Storage environment
global.window = global;
global.window.open = () => ({
  document: { write: () => {}, close: () => {} },
  focus: () => {},
  print: () => {}
});
global.document = {
  getElementById: (id) => ({
    innerHTML: '',
    value: id === 'conf-rating' ? '4.5' : id === 'conf-new-salary' ? '135000' : '2026-09-30',
    checked: true,
    style: {}
  }),
  createElement: () => ({ style: {}, setAttribute: () => {} })
};
global.alert = console.log;

// Initialize mock DB
const mockDBData = {
  employees: [
    { id: 1, fullName: 'Ahmed Khan', empNo: 'EMP-001', departmentId: 1, department: 'Technology', salary: 120000, employmentType: 'Permanent', status: 'active', role: 'employee' },
    { id: 2, fullName: 'Sara Ali', empNo: 'EMP-002', departmentId: 1, department: 'Technology', salary: 90000, employmentType: 'Probation', probationPassed: false, probationEndDate: '2026-10-15', joinDate: '2026-07-15', status: 'active', role: 'employee' },
    { id: 3, fullName: 'Zubair Shah', empNo: 'EMP-003', departmentId: 2, department: 'Finance', salary: 150000, employmentType: 'Permanent', status: 'active', role: 'dept_manager' }
  ],
  departments: [
    { id: 1, name: 'Technology' },
    { id: 2, name: 'Finance' }
  ],
  shifts: [
    { id: 1, name: 'Morning Shift', code: 'MS', startTime: '09:00', endTime: '18:00' },
    { id: 2, name: 'Evening Shift', code: 'ES', startTime: '14:00', endTime: '23:00' }
  ],
  shift_roster: [
    { id: 1, employeeId: 1, shiftId: 1, date: '2026-09-25', status: 'scheduled' },
    { id: 2, employeeId: 2, shiftId: 2, date: '2026-09-25', status: 'scheduled' }
  ],
  shift_swaps: [],
  leave_balances: [
    { id: 1, employeeId: 1, leaveTypeId: 1, year: 2026, allocated: 20, used: 4, balance: 16 },
    { id: 2, employeeId: 3, leaveTypeId: 1, year: 2026, allocated: 20, used: 15, balance: 5 }
  ],
  leave_encashments: [],
  salary_revisions: [],
  performance_reviews: [
    { id: 1, employeeId: 1, overallRating: 4.8, status: 'completed', quarter: 'Q2', year: 2026 },
    { id: 2, employeeId: 2, overallRating: 3.8, status: 'completed', quarter: 'Q2', year: 2026 }
  ],
  appraisals: [],
  contracts: [
    { id: 1, employeeId: 2, contractType: 'Probationary', startDate: '2026-07-15', endDate: '2026-10-15', probationEndDate: '2026-10-15', status: 'probation', probationPassed: false }
  ],
  hr_letters: [],
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
  log: (action, module, desc, userId) => {
    // console.log(`[AUDIT] ${action} in ${module}: ${desc}`);
  }
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
  getDesigName: () => 'Software Engineer',
  statusBadge: (status) => `<span class="badge">${status}</span>`,
  avatarInitials: (name) => (name || '').split(' ').map(n => n[0]).join('').slice(0, 2),
  avatarColor: () => '#6366f1'
};

global.Toast = {
  show: (title, type, msg) => {
    console.log(`  📣 Toast [${type.toUpperCase()}]: ${title} - ${msg || ''}`);
  }
};

global.Modal = {
  show: (title, body, opts) => {},
  close: () => {}
};

// 1. Verify Attendance Shift Scheduling & Swap Roster
console.log('--- TEST 1: Shift Scheduling & Shift Swap Roster ---');
const attendanceCode = fs.readFileSync(path.join(__dirname, '../js/attendance.js'), 'utf8');
eval(attendanceCode + '\n;global.Attendance = Attendance;');

if (typeof Attendance !== 'undefined') {
  console.log('  ✅ Attendance module loaded successfully.');
  if (typeof Attendance.showRequestSwapModal === 'function') {
    console.log('  ✅ Attendance.showRequestSwapModal alias verified.');
  } else {
    throw new Error('Attendance.showRequestSwapModal alias missing');
  }

  // Test employee shift swap request creation
  const swapResult = Attendance.submitShiftSwapRequest({
    requesterId: 1,
    requesterShiftId: 1,
    peerId: 2,
    peerShiftId: 2,
    swapDate: '2026-09-25',
    reason: 'Family emergency schedule accommodation'
  });
  console.log('  ✅ Shift swap request submitted successfully.');
} else {
  throw new Error('Attendance module failed to load');
}

// 2. Verify Annual Leave Encashment & Carry-Forward Engine
console.log('\n--- TEST 2: Annual Leave Encashment & Carry-Forward Engine ---');
const leavesCode = fs.readFileSync(path.join(__dirname, '../js/leaves.js'), 'utf8');
eval(leavesCode + '\n;global.Leaves = Leaves;');

if (typeof Leaves !== 'undefined') {
  console.log('  ✅ Leaves module loaded successfully.');
  if (typeof Leaves.executeYearEndCarryForward === 'function') {
    console.log('  ✅ Leaves.executeYearEndCarryForward verified.');
    Leaves.executeYearEndCarryForward(2026);
    
    // Check results: Ahmed had 16 days balance. Cap is 10. 6 days encashed!
    const encashments = DB.get('leave_encashments');
    const ahmedEncashment = encashments.find(e => e.employeeId === 1);
    if (ahmedEncashment && ahmedEncashment.encashedDays === 6) {
      console.log(`  ✅ Encashment surplus verified: ${ahmedEncashment.encashedDays} days (PKR ${ahmedEncashment.totalPayout.toLocaleString()})`);
    } else {
      throw new Error(`Encashment surplus mismatch: got ${ahmedEncashment?.encashedDays}`);
    }

    const bal1 = DB.get('leave_balances').find(b => b.employeeId === 1);
    if (bal1 && bal1.allocated === 24) {
      console.log('  ✅ New fiscal year opening balance verified (14 standard + 10 carried over = 24 days).');
    } else {
      throw new Error(`Carry forward balance rollover mismatch: got ${bal1?.allocated}`);
    }
  } else {
    throw new Error('Leaves.executeYearEndCarryForward missing');
  }
} else {
  throw new Error('Leaves module failed to load');
}

// 3. Verify Performance Appraisal Cycles & Merit Increment Matrix
console.log('\n--- TEST 3: Merit Increment Matrix & Compensation Engine ---');
const perfCode = fs.readFileSync(path.join(__dirname, '../js/performance.js'), 'utf8');
eval(perfCode + '\n;global.Performance = Performance;');

if (typeof Performance !== 'undefined') {
  console.log('  ✅ Performance module loaded successfully.');
  if (typeof Performance.renderMeritIncrementMatrix === 'function') {
    console.log('  ✅ Performance.renderMeritIncrementMatrix verified.');
  } else {
    throw new Error('Performance.renderMeritIncrementMatrix missing');
  }

  Performance.currentView = 'merit';
  // Apply single merit revision for Ahmed (Rating 4.8 => Grade A: 15% increment)
  Performance.applySingleMeritIncrement(1, 15);
  const emp1 = DB.find('employees', 1);
  const rev1 = DB.get('salary_revisions').find(r => r.employeeId === 1 && r.revisionType === 'merit');
  if (emp1.salary === 138000 && rev1 && rev1.incrementPct === 15) {
    console.log(`  ✅ Merit increment committed: PKR 120,000 -> PKR ${emp1.salary.toLocaleString()} (+15%)`);
  } else {
    throw new Error('Merit salary revision failed');
  }
} else {
  throw new Error('Performance module failed to load');
}

// 4. Verify Probation Management & Official Confirmation Workflow
console.log('\n--- TEST 4: Probation Management & Confirmation Workflow ---');
const empCode = fs.readFileSync(path.join(__dirname, '../js/employees.js'), 'utf8');
eval(empCode + '\n;global.Employees = Employees;');

if (typeof Employees !== 'undefined') {
  console.log('  ✅ Employees module loaded successfully.');
  if (typeof Employees.renderProbationWorkspace === 'function') {
    console.log('  ✅ Employees.renderProbationWorkspace verified.');
  } else {
    throw new Error('Employees.renderProbationWorkspace missing');
  }

  // Test confirming Sara Ali from Probation to Permanent
  Employees.executeConfirmation(2);
  const emp2 = DB.find('employees', 2);
  const contract2 = DB.get('contracts').find(c => c.employeeId === 2);
  const confLetter = DB.get('hr_letters').find(l => l.employeeId === 2 && l.letterType === 'confirmation');

  if (emp2.employmentType === 'Permanent' && emp2.probationPassed === true) {
    console.log('  ✅ Employee employmentType upgraded to Permanent & probationPassed = true.');
  } else {
    throw new Error('Confirmation status update failed');
  }

  if (contract2 && contract2.contractType === 'Permanent' && contract2.probationPassed === true) {
    console.log('  ✅ Associated employment contract upgraded to Permanent.');
  } else {
    throw new Error('Contract confirmation update failed');
  }

  if (confLetter && confLetter.title.includes('Confirmation')) {
    console.log(`  ✅ Official Employment Confirmation Letter generated: "${confLetter.title}" (Ref: ${confLetter.refNo})`);
  } else {
    throw new Error('HR Confirmation Letter generation failed');
  }
} else {
  throw new Error('Employees module failed to load');
}

console.log('\n🎉 ALL 4 CORE HRM FEATURES VERIFIED AND PASSING 100%!\n');
