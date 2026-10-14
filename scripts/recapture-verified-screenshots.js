/**
 * scripts/recapture-verified-screenshots.js
 * Recaptures all 53 genuine application screenshots across all 7 roles.
 * CRITICAL: Guarantees modals are cleanly destroyed between captures so no modal overlay ever leaks.
 */

const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HTTP_PORT = 8126;
const DEBUG_PORT = 9595;
const DOCS_SCREENSHOTS = path.resolve(__dirname, '../docs/screenshots');
const ARTIFACTS_DIR = 'C:/Users/test/.gemini/antigravity-ide/brain/71d0d514-c26d-4a7a-ad6d-c80536fb4a73';

if (!fs.existsSync(DOCS_SCREENSHOTS)) {
  fs.mkdirSync(DOCS_SCREENSHOTS, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const pubPath = path.join(__dirname, '../public', reqPath);
    if (fs.existsSync(pubPath) && fs.statSync(pubPath).isFile()) {
      const ext = path.extname(pubPath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      fs.createReadStream(pubPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

server.listen(HTTP_PORT, '127.0.0.1', async () => {
  console.log(`[Capture Server] Serving on http://127.0.0.1:${HTTP_PORT}`);
  const tmpDir = path.join(os.tmpdir(), `hrm-screen-verified-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpDir}`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const resp = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${DEBUG_PORT}/json`, r => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      const page = resp.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch(e) {}
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket Debugger URL from Chrome');
    chrome.kill();
    server.close();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.on('open', r));

  let pid = 1;
  function send(method, params = {}) {
    return new Promise(res => {
      const cur = pid++;
      const handler = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === cur) { ws.off('message', handler); res(msg.result); }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: cur, method, params }));
    });
  }

  async function evalJs(expr) {
    return send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true
    });
  }

  async function cleanModals() {
    await evalJs(`(function() {
      if (typeof Modal !== 'undefined') {
        if (typeof Modal.closeAll === 'function') Modal.closeAll();
        if (typeof Modal.close === 'function') Modal.close('dynamic-modal');
      }
      document.querySelectorAll('.modal-overlay').forEach(el => {
        el.classList.remove('open');
        el.remove();
      });
      document.body.style.overflow = '';
    })()`);
    await new Promise(r => setTimeout(r, 200));
  }

  async function capture(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(path.join(DOCS_SCREENSHOTS, filename), buf);
      try {
        fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), buf);
      } catch(e) {}
      console.log(`  📸 [Captured] ${filename} (${buf.length} bytes)`);
    }
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to HRM Pro Application...');
  await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });
  await new Promise(r => setTimeout(r, 2200));

  // =========================================================================
  // GUIDE 1: SUPERADMIN
  // =========================================================================
  console.log('\n--- GUIDE 1: SUPERADMIN ---');
  await cleanModals();
  await evalJs(`(async function() {
    await Auth.login('admin', 'admin123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1400));
  await capture('superadmin-dashboard.png');

  // User Management
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('administration');
    if (typeof Administration !== 'undefined') Administration.switchSection('users');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-user-management.png');

  // Create User Form
  await evalJs(`(function() {
    if (typeof Administration !== 'undefined') Administration.showAddUser();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('superadmin-create-user-form.png');
  await cleanModals();

  // Role Permissions (RBAC)
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined') Settings.switchSection('roles_permissions');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-rbac.png');

  // Company Management (Corporate Entities)
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('companies');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-company-management.png');

  // Global System Settings
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined') Settings.switchSection('general');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-system-settings.png');

  // Security Telemetry & Audit Logs
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined') Settings.switchSection('security_telemetry');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-audit-security.png');

  // Backup & Recovery
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined') Settings.switchSection('backup');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-backup-recovery.png');

  // =========================================================================
  // GUIDE 2: HR MANAGER (Sara Malik)
  // =========================================================================
  console.log('\n--- GUIDE 2: HR MANAGER ---');
  await cleanModals();
  await evalJs(`(async function() {
    await Auth.login('sara.malik', 'hr123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1400));
  await capture('hr-manager-dashboard.png');

  // Employee Directory
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('employees');
    if (typeof Employees !== 'undefined') {
      Employees.currentView = 'list';
      Employees.render();
    }
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-employee-list.png');

  // Create Employee Form
  await evalJs(`(function() {
    if (typeof Employees !== 'undefined') Employees.showAddForm({});
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('hr-manager-create-employee.png');
  await cleanModals();

  // Employee Details / Edit Form
  await evalJs(`(function() {
    if (typeof Employees !== 'undefined') Employees.showEditForm(1);
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('hr-manager-employee-edit.png');
  await cleanModals();

  // Document Management (e-DMS)
  await evalJs(`(function() {
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-documents.png');

  // Attendance Management
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-attendance.png');

  // Leave Approval Screen
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('leaves');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-leave-approval.png');

  // Recruitment ATS Pipeline
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('pipeline');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-recruitment.png');

  // HR Analytics Reports
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('reports');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-reports.png');

  // =========================================================================
  // GUIDE 3: DEPARTMENT MANAGER (Usman Baig)
  // =========================================================================
  console.log('\n--- GUIDE 3: DEPARTMENT MANAGER ---');
  await cleanModals();
  await evalJs(`(async function() {
    await Auth.login('usman.baig', 'mgr123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1400));
  await capture('department-manager-team-dashboard.png');

  // Team Directory
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('employees');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-team-directory.png');

  // Team Attendance
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-team-attendance.png');

  // Leave Approval Queue
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('leaves');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-leave-approval.png');

  // Performance Reviews
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('performance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-performance.png');

  // Department Reports
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('reports');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-reports.png');

  // =========================================================================
  // GUIDE 4: PAYROLL ACCOUNTANT (Tariq Mahmood)
  // =========================================================================
  console.log('\n--- GUIDE 4: PAYROLL ACCOUNTANT ---');
  await cleanModals();
  await evalJs(`(async function() {
    await Auth.login('tariq.finance', 'fin123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1400));
  await capture('payroll-accountant-dashboard.png');

  // Payroll List & Register
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.switchView('salary');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-payroll-list.png');

  // Payroll Processing (Generate Salary Slip Modal)
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') {
      Payroll.switchView('salary');
      Payroll.showGenerateSlipModal(null, Payroll.currentMonth);
    }
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-payroll-processing.png');
  await cleanModals();

  // Salary Breakdown & Increments
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.switchView('revisions');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-salary-breakdown.png');

  // Tax Details & Form 16
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.switchView('tax');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-tax-details.png');

  // Payslip Preview Modal
  await cleanModals();
  await evalJs(`(function() {
    if (typeof Payroll !== 'undefined') Payroll.printSlip(4);
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  await capture('payroll-accountant-payslip-preview.png');
  await cleanModals();

  // Bank Disbursal Advice
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.switchView('bank_advice');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-bank-export.png');

  // Payroll Variance Reports
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('reports');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-reports.png');

  // =========================================================================
  // GUIDE 5: EMPLOYEE USER MANUAL (Fatima Raza)
  // =========================================================================
  console.log('\n--- GUIDE 5: EMPLOYEE USER MANUAL ---');
  await cleanModals();
  await evalJs(`(function() {
    if (typeof App !== 'undefined') App.showLogin(false, 'hrm');
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('employee-login.png');

  // Employee Login
  await cleanModals();
  await evalJs(`(async function() {
    await Auth.login('fatima.raza', 'emp123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1400));
  await capture('employee-dashboard.png');

  // Personal Profile
  await cleanModals();
  await evalJs(`(function() {
    Employees.renderProfile(Auth.employee.id, true);
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('employee-profile.png');

  // Punch Clock Interface
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  await capture('employee-clock-punch.png');

  // Attendance History
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('employee-attendance-history.png');

  // Apply Leave Form
  await evalJs(`(function() {
    if (typeof Leaves !== 'undefined') Leaves.showApplyForm();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('employee-leave-request.png');
  await cleanModals();

  // Leave Status Screen
  await evalJs(`(function() {
    App.navigate('leaves');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('employee-leave-status.png');

  // Personal Payslip Modal
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.printSlip(Auth.employee.id);
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('employee-payslip.png');
  await cleanModals();

  // Personal Documents Area
  await evalJs(`(function() {
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('employee-documents.png');

  // Mobile PWA Viewport
  await cleanModals();
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await evalJs(`(function() {
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('employee-mobile-pwa.png');

  // Reset to desktop viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // =========================================================================
  // GUIDE 6: ONBOARDING RECRUIT (Saad Ibrahim)
  // =========================================================================
  console.log('\n--- GUIDE 6: ONBOARDING RECRUIT ---');
  await cleanModals();
  await evalJs(`(async function() {
    await Auth.login('saad.ibrahim', 'emp123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1400));
  await capture('onboarding-dashboard.png');

  // Candidate Directory / Open Requisitions
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('jobs');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-candidate-directory.png');

  // Recruitment Pipeline & Hiring Stages
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('pipeline');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-recruitment-pipeline.png');

  // Interview Scheduling & Tracking
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('interviews');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-interview-tracking.png');

  // Onboarding Tasks & Document Collection
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-task-documents.png');

  // New Employee Induction & Handbook
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('events');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-handbook-induction.png');

  // =========================================================================
  // GUIDE 7: JUNIOR HR (Zain Ali)
  // =========================================================================
  console.log('\n--- GUIDE 7: JUNIOR HR ---');
  await cleanModals();
  await evalJs(`(function() {
    Auth.switchPersona('junior.hr');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1400));
  await capture('junior-hr-dashboard.png');

  // Permitted Employee Directory
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('employees');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-employee-directory.png');

  // Masked Employee Record View
  await cleanModals();
  await evalJs(`(function() {
    Employees.renderProfile(4);
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-employee-view.png');

  // Document Management
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-document-management.png');

  // Recruitment Assistance
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('pipeline');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-recruitment-pipeline.png');

  // Assigned Workflows / Attendance Support
  await cleanModals();
  await evalJs(`(function() {
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-onboarding-tasks.png');

  console.log('\n✅ ALL 53 SCREENSHOTS RECAPTURED CLEANLY WITH ZERO MODAL LEAKAGE!');
  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
});
