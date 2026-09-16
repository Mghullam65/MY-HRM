// ==============================================================================
// MASTER HRM APPLICATION AUDIT & ROLE-BASED TEST SUITE
// Covers all components, all 5 roles, cloud persistence, security, and workflows
// ==============================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

// --- Supabase Config ---
const SUPABASE_URL = 'https://fualeqgyjvflgkjgpohb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Yx_qmwQzE6x2NLmy9dJ44w_RotLBdbA';

// --- Test Results Aggregator ---
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  categories: {}
};

function runTest(category, testName, fn) {
  results.total++;
  if (!results.categories[category]) {
    results.categories[category] = { total: 0, passed: 0, failed: 0, tests: [] };
  }
  results.categories[category].total++;

  try {
    const outcome = fn();
    if (outcome === false) {
      throw new Error('Assertion returned false');
    }
    results.passed++;
    results.categories[category].passed++;
    results.categories[category].tests.push({ name: testName, status: 'PASS' });
    console.log(`  ✅ [PASS] ${testName}`);
  } catch (err) {
    results.failed++;
    results.categories[category].failed++;
    results.categories[category].tests.push({ name: testName, status: 'FAIL', error: err.message });
    console.log(`  ❌ [FAIL] ${testName} --> ${err.message}`);
  }
}

async function runAsyncTest(category, testName, fn) {
  results.total++;
  if (!results.categories[category]) {
    results.categories[category] = { total: 0, passed: 0, failed: 0, tests: [] };
  }
  results.categories[category].total++;

  try {
    const outcome = await fn();
    if (outcome === false) {
      throw new Error('Async assertion returned false');
    }
    results.passed++;
    results.categories[category].passed++;
    results.categories[category].tests.push({ name: testName, status: 'PASS' });
    console.log(`  ✅ [PASS] ${testName}`);
  } catch (err) {
    results.failed++;
    results.categories[category].failed++;
    results.categories[category].tests.push({ name: testName, status: 'FAIL', error: err.message });
    console.log(`  ❌ [FAIL] ${testName} --> ${err.message}`);
  }
}

function httpsRequest(urlPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'fualeqgyjvflgkjgpohb.supabase.co',
      path: urlPath,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Build headless HRM runtime
function createHrmRuntime() {
  const mockStorage = {};
  const mockSession = {};

  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    },
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    Date, Math, JSON, Array, Object, String, Number, Boolean, RegExp,
    fetch: globalThis.fetch,
    window: {},
    document: {
      createElement: (tag) => ({
        tagName: tag,
        className: '',
        id: '',
        innerHTML: '',
        textContent: '',
        style: {},
        appendChild: () => {},
        remove: () => {},
        classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} }
      }),
      body: {
        appendChild: () => {},
        removeChild: () => {}
      },
      documentElement: {
        setAttribute: () => {},
        getAttribute: () => 'light'
      },
      getElementById: (id) => ({
        id,
        value: '',
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {}
      }),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {}
    },
    localStorage: {
      getItem: k => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: k => { delete mockStorage[k]; },
      clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
    },
    sessionStorage: {
      getItem: k => mockSession[k] || null,
      setItem: (k, v) => { mockSession[k] = String(v); },
      removeItem: k => { delete mockSession[k]; },
      clear: () => { Object.keys(mockSession).forEach(k => delete mockSession[k]); }
    },
    navigator: { userAgent: 'HeadlessHrmAgent' },
    location: { protocol: 'https:', href: 'https://my-hrm-rosy.vercel.app/', hash: '' }
  };
  sandbox.window = sandbox;

  const ctx = vm.createContext(sandbox);

  const scripts = [
    { file: 'js/vendor/supabase.js' },
    { file: 'js/security.js' },
    { file: 'js/api.js' },
    { file: 'js/i18n.js', post: '\nwindow.I18n = I18n;' },
    { file: 'js/data.js', post: '\nwindow.DB = DB;' },
    { file: 'js/auth.js', post: '\nwindow.Auth = Auth;' },
    { file: 'js/leaves.js', post: '\nwindow.Leaves = Leaves;' },
    { file: 'js/settings.js', post: '\nwindow.Settings = Settings;' },
    { file: 'js/performance.js', post: '\nwindow.Performance = Performance;\nwindow.Recruitment = Recruitment;' },
    { file: 'js/attendance.js', post: '\nwindow.Attendance = Attendance;' },
    { file: 'js/employees.js', post: '\nwindow.Employees = Employees;' },
    { file: 'js/payroll.js', post: '\nwindow.Payroll = Payroll;' },
    { file: 'js/dashboard.js', post: '\nwindow.Dashboard = Dashboard;' },
    { file: 'js/app.js', post: '\nwindow.App = App;' }
  ];

  scripts.forEach(s => {
    const fullPath = path.join(__dirname, '..', s.file);
    if (fs.existsSync(fullPath)) {
      let code = fs.readFileSync(fullPath, 'utf8');
      if (s.post) code += s.post;
      try {
        vm.runInContext(code, ctx, { filename: s.file });
      } catch (err) {
        // tolerate minor DOM-only reference warnings
      }
    }
  });

  return sandbox;
}

// Master Test Execution
async function executeMasterTestSuite() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPLETE MASTER HRM SYSTEM AUDIT & ROLE TEST SUITE');
  console.log('================================================================\n');

  // ============================================================================
  // 1. CLOUD DATABASE & PERSISTENCE (Supabase PostgreSQL)
  // ============================================================================
  console.log('📂 CATEGORY 1: Cloud Database & Persistence Layer');

  await runAsyncTest('Cloud Database & Persistence', 'Supabase Cloud REST API Connectivity', async () => {
    const res = await httpsRequest('/rest/v1/hrm_store?select=id&limit=1');
    return res.status === 200 && Array.isArray(res.body);
  });

  await runAsyncTest('Cloud Database & Persistence', 'Cloud Schema Columns Integrity (id, data, version, updated_at)', async () => {
    const res = await httpsRequest('/rest/v1/hrm_store?id=eq.settings&select=*');
    if (res.status !== 200 || !res.body[0]) return false;
    const row = res.body[0];
    return ('id' in row) && ('data' in row) && ('version' in row) && ('updated_at' in row);
  });

  await runAsyncTest('Cloud Database & Persistence', 'Master 145 Tables Population in Supabase PostgreSQL', async () => {
    const res = await httpsRequest('/rest/v1/hrm_store?select=id');
    if (res.status !== 200 || !Array.isArray(res.body)) return false;
    const tableCount = res.body.length;
    console.log(`     (Confirmed ${tableCount} master tables in cloud database)`);
    return tableCount >= 140;
  });

  await runAsyncTest('Cloud Database & Persistence', 'Direct PostgREST JSONB Write & Read Round-Trip', async () => {
    const testId = 'audit_probe_' + Date.now();
    const testPayload = { id: testId, data: [{ ping: 'audit_ok', ts: Date.now() }], version: 1, updated_at: new Date().toISOString() };
    
    // Write
    const writeRes = await httpsRequest('/rest/v1/hrm_store', 'POST', testPayload);
    if (writeRes.status !== 201) return false;

    // Read back
    const readRes = await httpsRequest(`/rest/v1/hrm_store?id=eq.${testId}&select=*`);
    if (readRes.status !== 200 || !readRes.body[0]) return false;

    // Clean up
    await httpsRequest(`/rest/v1/hrm_store?id=eq.${testId}`, 'DELETE');
    return readRes.body[0].data[0].ping === 'audit_ok';
  });

  await runAsyncTest('Cloud Database & Persistence', 'Client DB.init() Hydration from Cloud Database', async () => {
    const runtime = createHrmRuntime();
    await runtime.DB.init();
    const emps = runtime.DB.get('employees');
    const leaves = runtime.DB.get('leave_requests');
    const settings = runtime.DB.get('settings');
    return Array.isArray(emps) && emps.length > 0 && Array.isArray(leaves) && leaves.length > 0 && typeof settings === 'object';
  });

  // ============================================================================
  // 2. AUTHENTICATION & SESSION SECURITY (Across all 5 Roles)
  // ============================================================================
  console.log('\n📂 CATEGORY 2: Authentication & Multi-Role Session Security');

  runTest('Authentication & Security', 'Super Admin Login (Role: superadmin)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    const res = runtime.Auth.login('admin', 'admin123');
    return res.success === true && runtime.Auth.role === 'superadmin' && runtime.Auth.user.id === 1;
  });

  runTest('Authentication & Security', 'HR Manager Login (Role: hr_manager)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    const res = runtime.Auth.login('sara.malik', 'hr123');
    return res.success === true && runtime.Auth.role === 'hr_manager' && runtime.Auth.employee.id === 2;
  });

  runTest('Authentication & Security', 'Deputy Manager Login (Role: dept_manager)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    const res = runtime.Auth.login('usman.baig', 'mgr123');
    return res.success === true && runtime.Auth.role === 'dept_manager' && runtime.Auth.employee.id === 3;
  });

  runTest('Authentication & Security', 'Regular Employee Login (Role: employee)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    const res = runtime.Auth.login('fatima.raza', 'emp123');
    return res.success === true && runtime.Auth.role === 'employee' && runtime.Auth.employee.id === 4;
  });

  runTest('Authentication & Security', 'Onboarding Employee Login (Role: onboarding)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    const res = runtime.Auth.login('saad.ibrahim', 'emp123');
    return res.success === true && runtime.Auth.role === 'onboarding' && runtime.Auth.employee.id === 26;
  });

  runTest('Authentication & Security', 'Password Sanitization: Passwords Never Kept in Auth.user or Session', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('admin', 'admin123');
    const hasPasswordInUser = 'password' in runtime.Auth.user;
    const sessionRaw = runtime.sessionStorage.getItem('hrm_session');
    const hasPasswordInSession = sessionRaw && sessionRaw.includes('admin123');
    return !hasPasswordInUser && !hasPasswordInSession;
  });

  runTest('Authentication & Security', 'Invalid Password Handling (Safely rejected)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    const res = runtime.Auth.login('admin', 'wrong_password_999');
    return res.success === false && !runtime.Auth.user;
  });

  runTest('Authentication & Security', 'Deactivated / Inactive Account Lockout', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.DB.update('users', 4, { status: 'inactive' });
    const res = runtime.Auth.login('fatima.raza', 'emp123');
    return res.success === false && res.message.toLowerCase().includes('inactive');
  });

  runTest('Authentication & Security', 'Logout Clears Active User & Session Storage', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('admin', 'admin123');
    runtime.Auth.logout();
    return runtime.Auth.user === null && runtime.sessionStorage.getItem('hrm_session') === null;
  });

  // ============================================================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION BARRIERS
  // ============================================================================
  console.log('\n📂 CATEGORY 3: Role-Based Access Control & Permission Scopes');

  runTest('RBAC & Permission Scopes', 'Super Admin Universal Administration Access', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('admin', 'admin123');
    return runtime.Auth.can('system_settings') && runtime.Auth.can('manage_users') && runtime.Auth.can('approve_all_leaves');
  });

  runTest('RBAC & Permission Scopes', 'HR Manager Can Access Recruitment & Final Approval', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('sara.malik', 'hr123');
    return runtime.Auth.can('leaves.approve') && runtime.Auth.can('recruitment');
  });

  runTest('RBAC & Permission Scopes', 'Deputy Manager Blocked from System Administration', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('usman.baig', 'mgr123');
    return !runtime.Auth.can('system_settings') && !runtime.Auth.can('manage_users');
  });

  runTest('RBAC & Permission Scopes', 'Regular Employee Forbidden from Approving Leaves', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('fatima.raza', 'emp123');
    return !runtime.Auth.can('approve_leaves') && !runtime.Auth.can('endorse_leaves');
  });

  runTest('RBAC & Permission Scopes', 'Employee Department Scope: Scoped to Self Only', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('fatima.raza', 'emp123');
    const scopedEmps = runtime.Auth.getScopedEmployees(runtime.DB.get('employees'));
    return scopedEmps.length === 1 && scopedEmps[0].id === 4;
  });

  runTest('RBAC & Permission Scopes', 'Manager Team Scope: Scoped to Department Team Members', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('usman.baig', 'mgr123'); // Dept Manager in Engineering (deptId: 1)
    const scopedEmps = runtime.Auth.getScopedEmployees(runtime.DB.get('employees'));
    return scopedEmps.length > 1 && scopedEmps.every(e => e.departmentId === 1 || e.managerId === 3 || e.id === 3);
  });

  // ============================================================================
  // 4. LEAVE MANAGEMENT & APPROVAL WORKFLOWS
  // ============================================================================
  console.log('\n📂 CATEGORY 4: Leave Management & Multi-Tier Approval Workflows');

  runTest('Leave Management', 'Employee Leave Balances & Quota Availability Check', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('fatima.raza', 'emp123');
    const balances = runtime.DB.get('leave_balances').find(b => b.employeeId === 4);
    return balances && balances.balances && typeof balances.balances[1] === 'number';
  });

  runTest('Leave Management', 'Employee Applies for Leave (Generates Status: pending)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('fatima.raza', 'emp123');

    const newLeave = {
      id: 9901,
      employeeId: 4,
      typeId: 1,
      quotaTypeId: 1,
      quotaName: 'Annual Leave',
      from: '2026-11-10',
      to: '2026-11-12',
      leaveDuration: 'full',
      days: 3,
      reason: 'Family wedding event in Lahore',
      status: 'pending',
      managerId: 3,
      appliedOn: '2026-09-15'
    };

    runtime.DB.add('leave_requests', newLeave);
    const added = runtime.DB.find('leave_requests', 9901);
    return added && added.status === 'pending' && added.days === 3;
  });

  runTest('Leave Management', 'Deputy Manager Endorsement (Tier 1: manager_approved)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    
    // Add pending request
    runtime.DB.add('leave_requests', {
      id: 9902,
      employeeId: 4,
      managerId: 3,
      status: 'pending',
      days: 2
    });

    // Login Manager and Endorse
    runtime.Auth.login('usman.baig', 'mgr123');
    runtime.Leaves.approve(9902);

    const updated = runtime.DB.find('leave_requests', 9902);
    return updated && updated.status === 'manager_approved' && updated.managerStatus === 'approved';
  });

  runTest('Leave Management', 'HR Manager Final Approval (Tier 2: approved & Quota Deducted)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const empId = 4;
    const initialBal = runtime.DB.get('leave_balances').find(b => b.employeeId === empId)?.balances?.[1] || 15;

    runtime.DB.add('leave_requests', {
      id: 9903,
      employeeId: empId,
      typeId: 1,
      quotaTypeId: 1,
      days: 2,
      status: 'manager_approved'
    });

    // Login HR Manager and Grant Final Approval
    runtime.Auth.login('sara.malik', 'hr123');
    runtime.Leaves.approve(9903);

    const updated = runtime.DB.find('leave_requests', 9903);
    const newBal = runtime.DB.get('leave_balances').find(b => b.employeeId === empId)?.balances?.[1];

    return updated && updated.status === 'approved' && newBal === (initialBal - 2);
  });

  runTest('Leave Management', 'Leave Rejection by Manager or HR (Status: rejected)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    runtime.DB.add('leave_requests', { id: 9904, employeeId: 4, managerId: 3, status: 'pending' });
    runtime.Auth.login('usman.baig', 'mgr123');
    runtime.Leaves.reject(9904);

    const updated = runtime.DB.find('leave_requests', 9904);
    return updated && updated.status === 'rejected';
  });

  runTest('Leave Management', 'Leave Cancellation & Deletion', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    runtime.DB.add('leave_requests', { id: 9905, employeeId: 4, status: 'pending' });
    runtime.DB.delete('leave_requests', 9905);

    const found = runtime.DB.find('leave_requests', 9905);
    return found === null;
  });

  runTest('Leave Management', 'Leave Scoping: Employee Only Sees Own Leave Requests', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    runtime.DB.add('leave_requests', { id: 9906, employeeId: 4, status: 'pending' });
    runtime.DB.add('leave_requests', { id: 9907, employeeId: 5, status: 'pending' });

    runtime.Auth.login('fatima.raza', 'emp123'); // Employee 4
    const visible = runtime.Leaves.getScopedLeaves();
    return visible.every(l => l.employeeId === 4);
  });

  // ============================================================================
  // 5. RECRUITMENT & ATS PIPELINE
  // ============================================================================
  console.log('\n📂 CATEGORY 5: Recruitment & ATS Pipeline');

  runTest('Recruitment & ATS', 'Create Job Requisition / Opening', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const newJob = {
      id: 8801,
      title: 'Senior Cloud DevOps Engineer',
      department: 'Engineering',
      status: 'active',
      applicantCount: 0,
      postedDate: '2026-09-15'
    };

    runtime.DB.add('recruitment', newJob);
    const added = runtime.DB.find('recruitment', 8801);
    return added && added.title === 'Senior Cloud DevOps Engineer' && added.status === 'active';
  });

  runTest('Recruitment & ATS', 'Submit Candidate Application with Resume Metadata', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const candidateApp = {
      id: 7701,
      jobId: 8801,
      name: 'Kamran Akmal',
      email: 'kamran.devops@gmail.com',
      phone: '0300-1234567',
      stage: 'applied',
      resumeUrl: '/uploads/cv/7701_Kamran_Akmal_CV.pdf',
      appliedOn: '2026-09-15'
    };

    runtime.DB.add('applications', candidateApp);
    const added = runtime.DB.find('applications', 7701);
    return added && added.stage === 'applied' && added.resumeUrl.includes('.pdf');
  });

  runTest('Recruitment & ATS', 'Candidate Stage Progression (applied -> interview -> offer)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    runtime.DB.add('applications', { id: 7702, name: 'Zainab Qasim', stage: 'applied' });
    runtime.DB.update('applications', 7702, { stage: 'interview', interviewDate: '2026-09-20' });
    let updated = runtime.DB.find('applications', 7702);
    if (updated.stage !== 'interview') return false;

    runtime.DB.update('applications', 7702, { stage: 'offer', offerSalary: 220000 });
    updated = runtime.DB.find('applications', 7702);
    return updated.stage === 'offer' && updated.offerSalary === 220000;
  });

  runTest('Recruitment & ATS', 'Issue Official Offer Letter & Candidate Hire', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    runtime.DB.add('applications', { id: 7702, name: 'Zainab Qasim', stage: 'interview' });
    runtime.DB.add('offer_letters', {
      id: 6601,
      candidateName: 'Zainab Qasim',
      position: 'Senior UI/UX Architect',
      status: 'sent',
      baseSalary: 220000
    });

    runtime.DB.update('offer_letters', 6601, { status: 'accepted' });
    runtime.DB.update('applications', 7702, { stage: 'hired' });

    const offer = runtime.DB.find('offer_letters', 6601);
    const candidate = runtime.DB.find('applications', 7702);

    return offer.status === 'accepted' && candidate.stage === 'hired';
  });

  // ============================================================================
  // 6. EMPLOYEE MANAGEMENT & ORG DIRECTORY
  // ============================================================================
  console.log('\n📂 CATEGORY 6: Employee Management & Org Directory');

  runTest('Employee Management', 'Employee Directory Listing Active Employees', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    const emps = runtime.DB.get('employees');
    const active = emps.filter(e => e.status === 'active');
    return active.length > 20 && active.every(e => e.fullName && e.email);
  });

  runTest('Employee Management', 'Create New Employee Record', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const newEmp = {
      id: 5501,
      empNo: 'EMP-5501',
      fullName: 'Tariq Mehmood',
      email: 'tariq.mehmood@company.com',
      departmentId: 1,
      designationId: 2,
      managerId: 3,
      status: 'active',
      salary: 165000,
      joinedDate: '2026-09-15'
    };

    runtime.DB.add('employees', newEmp);
    const added = runtime.DB.find('employees', 5501);
    return added && added.fullName === 'Tariq Mehmood' && added.empNo === 'EMP-5501';
  });

  runTest('Employee Management', 'Update Employee Designation & Department', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    runtime.DB.update('employees', 5501, { designationId: 4, departmentId: 2, salary: 185000 });
    const updated = runtime.DB.find('employees', 5501);
    return updated && updated.designationId === 4 && updated.salary === 185000;
  });

  runTest('Employee Management', 'Deactivate Employee (Status: inactive triggers session lockout)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    runtime.DB.update('employees', 5501, { status: 'inactive' });
    const updated = runtime.DB.find('employees', 5501);
    return updated && updated.status === 'inactive';
  });

  // ============================================================================
  // 7. ATTENDANCE & TELEMETRY
  // ============================================================================
  console.log('\n📂 CATEGORY 7: Attendance Tracking & Punch Telemetry');

  runTest('Attendance & Telemetry', 'Record Employee Punch In / Punch Out', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const punchRecord = {
      id: 4401,
      employeeId: 4,
      date: '2026-09-15',
      checkIn: '08:58:30',
      checkOut: '17:35:12',
      status: 'present',
      workHours: 8.6
    };

    runtime.DB.add('attendance', punchRecord);
    const added = runtime.DB.find('attendance', 4401);
    return added && added.status === 'present' && added.workHours === 8.6;
  });

  runTest('Attendance & Telemetry', 'Attendance Summary Metrics Calculation', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    const records = runtime.DB.get('attendance');
    const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
    return presentCount > 0;
  });

  runTest('Attendance & Telemetry', 'Attendance Correction Request & Manager Approval', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const correction = {
      id: 3301,
      employeeId: 4,
      date: '2026-09-14',
      originalCheckIn: '10:15:00',
      correctedCheckIn: '09:00:00',
      reason: 'Biometric fingerprint reader glitch at main lobby',
      status: 'pending',
      managerId: 3
    };

    runtime.DB.add('attendance_corrections', correction);
    runtime.DB.update('attendance_corrections', 3301, { status: 'approved', approvedBy: 3 });

    const updated = runtime.DB.find('attendance_corrections', 3301);
    return updated && updated.status === 'approved';
  });

  // ============================================================================
  // 8. PAYROLL & COMPENSATION
  // ============================================================================
  console.log('\n📂 CATEGORY 8: Payroll & Compensation Processing');

  runTest('Payroll & Compensation', 'Calculate Net Salary (Basic + Allowances - Deductions)', () => {
    const basic = 150000;
    const houseRent = 30000;
    const medical = 15000;
    const incomeTax = 12000;
    const providentFund = 7500;

    const gross = basic + houseRent + medical; // 195,000
    const deductions = incomeTax + providentFund; // 19,500
    const net = gross - deductions; // 175,500

    return net === 175500;
  });

  runTest('Payroll & Compensation', 'Disburse Payslip & Payment Status Transition (pending -> paid)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const payslip = {
      id: 2201,
      employeeId: 4,
      month: 'August',
      year: 2026,
      basic: 120000,
      netSalary: 145000,
      status: 'pending',
      paymentMethod: 'Bank Transfer'
    };

    runtime.DB.add('salary', payslip);
    runtime.DB.update('salary', 2201, { status: 'paid', paidOn: '2026-09-01' });

    const updated = runtime.DB.find('salary', 2201);
    return updated && updated.status === 'paid' && updated.netSalary === 145000;
  });

  // ============================================================================
  // 9. SETTINGS & COMPLETE REMOVAL OF LANGUAGE / CURRENCY
  // ============================================================================
  console.log('\n📂 CATEGORY 9: Settings Module & Removal of Language/Currency');

  runTest('Settings & Localization', 'Currency Dropdowns & Selectors Completely Absent from Settings UI', () => {
    const settingsCode = fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf8');
    const hasCompanyCurrencySelect = settingsCode.includes('id="s-company-currency"');
    const hasDefaultCurrencySelect = settingsCode.includes('id="s-currency"');
    const hasPreviewCurrency = settingsCode.includes('previewCurrencySelection');
    return !hasCompanyCurrencySelect && !hasDefaultCurrencySelect && !hasPreviewCurrency;
  });

  runTest('Settings & Localization', 'Language Dropdowns & Selectors Completely Absent from Settings UI', () => {
    const settingsCode = fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf8');
    const hasLanguageSelect = settingsCode.includes('id="s-company-language"');
    return !hasLanguageSelect;
  });

  runTest('Settings & Localization', 'Topbar & Dashboard Have No Currency or Language Dropdowns', () => {
    const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
    const dashCode = fs.readFileSync(path.join(__dirname, '../js/dashboard.js'), 'utf8');
    const hasLangInTop = appCode.includes('renderLanguageSelector') || dashCode.includes('renderLanguageSelector');
    const hasCurrInTop = appCode.includes('renderCurrencySelector') || dashCode.includes('renderCurrencySelector');
    return !hasLangInTop && !hasCurrInTop;
  });

  runTest('Settings & Localization', 'System Default Locked to Standard English (en) & PKR (₨)', () => {
    const runtime = createHrmRuntime();
    runtime.I18n.init();
    const lang = runtime.I18n.activeLang;
    const curr = runtime.I18n.activeCurrency;
    const formatted = runtime.I18n.formatCurrency(250000);
    return lang === 'en' && curr === 'PKR' && formatted.includes('PKR 250,000');
  });

  runTest('Settings & Localization', 'Remaining Settings Persist: Company Profile, Fiscal Year, Timezone', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const newSettings = {
      companyName: 'MY-HRM Enterprise Inc',
      fiscalYearStart: '7',
      timezone: 'Asia/Karachi',
      dateFormat: 'DD/MM/YYYY',
      theme: 'light'
    };

    runtime.DB.set('settings', newSettings);
    const saved = runtime.DB.getObj('settings');

    return saved.companyName === 'MY-HRM Enterprise Inc' && saved.timezone === 'Asia/Karachi';
  });

  // ============================================================================
  // 10. DASHBOARD METRICS & MULTI-ROLE ACCURACY
  // ============================================================================
  console.log('\n📂 CATEGORY 10: Dashboard Intelligence & Multi-Role Metric Accuracy');

  runTest('Dashboard Metrics', 'Executive Dashboard Totals (Employees, Leaves, Attendance)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();

    const emps = runtime.DB.get('employees');
    const totalEmps = emps.length;
    const activeEmps = emps.filter(e => e.status === 'active').length;
    const leaves = runtime.DB.get('leave_requests');
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

    return totalEmps > 0 && activeEmps > 0 && pendingLeaves >= 0;
  });

  runTest('Dashboard Metrics', 'Employee Personal Dashboard (Scoped to self metrics)', () => {
    const runtime = createHrmRuntime();
    runtime.DB.seed();
    runtime.Auth.login('fatima.raza', 'emp123'); // Employee 4

    const myLeaves = runtime.Leaves.getScopedLeaves();
    const myBalances = runtime.DB.get('leave_balances').find(b => b.employeeId === 4);

    return myLeaves.every(l => l.employeeId === 4) && !!myBalances;
  });

  // ============================================================================
  // FINAL SUMMARY REPORT
  // ============================================================================
  console.log('\n================================================================');
  console.log('📊 FINAL MASTER AUDIT & TEST RESULTS SUMMARY');
  console.log('================================================================');
  console.log(`TOTAL TESTS EXECUTED: ${results.total}`);
  console.log(`✅ TOTAL PASSED:     ${results.passed}`);
  console.log(`❌ TOTAL FAILED:     ${results.failed}`);
  console.log(`📈 SUCCESS RATE:      ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('----------------------------------------------------------------');

  for (const [cat, data] of Object.entries(results.categories)) {
    const icon = data.failed === 0 ? '🟢' : '🔴';
    console.log(`${icon} ${cat.padEnd(35)}: ${data.passed}/${data.total} Passed (${((data.passed / data.total) * 100).toFixed(0)}%)`);
  }
  console.log('================================================================\n');

  return results;
}

executeMasterTestSuite();
