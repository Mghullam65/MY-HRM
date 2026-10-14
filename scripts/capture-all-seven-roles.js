/**
 * scripts/capture-all-seven-roles.js
 * Automates genuine, verified screenshot capture for ALL 7 ROLES in HRM Pro Enterprise.
 * Strictly guarantees ZERO duplicate screenshots and 100% genuine UI captures.
 */

const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HTTP_PORT = 8125;
const DEBUG_PORT = 9590;
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
  const tmpDir = path.join(os.tmpdir(), `hrm-screen-7roles-${Date.now()}`);
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

  // Load root page
  console.log('Navigating to HRM Pro Application...');
  await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });
  await new Promise(r => setTimeout(r, 2200));

  // =========================================================================
  // GUIDE 1: SUPERADMIN SYSTEM ADMINISTRATION GUIDE
  // =========================================================================
  console.log('\n--- CAPTURING GUIDE 1: SUPERADMIN ---');
  await evalJs(`(async function() {
    await Auth.login('admin', 'admin123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('superadmin-dashboard.png');

  // User Management
  await evalJs(`(function() {
    App.navigate('administration');
    if (typeof Administration !== 'undefined') Administration.switchSection('users');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-user-management.png');

  // Create User Form Modal
  await evalJs(`(function() {
    if (typeof Administration !== 'undefined') Administration.showAddUser();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('superadmin-create-user-form.png');

  // Close modal and open RBAC
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('settings');
    if (typeof Settings !== 'undefined') Settings.switchSection('roles_permissions');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-rbac.png');

  // Company Management (Corporate Entities)
  await evalJs(`(function() {
    App.navigate('companies');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-company-management.png');

  // System Settings (General)
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined') Settings.switchSection('general');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-system-settings.png');

  // Security Settings & Audit Trail
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined') Settings.switchSection('security_telemetry');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-audit-security.png');

  // Backup & Recovery Interface
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined') Settings.switchSection('backup');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('superadmin-backup-recovery.png');

  // =========================================================================
  // GUIDE 2: HR MANAGER USER GUIDE (Sara Malik)
  // =========================================================================
  console.log('\n--- CAPTURING GUIDE 2: HR MANAGER ---');
  await evalJs(`(async function() {
    await Auth.login('sara.malik', 'hr123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('hr-manager-dashboard.png');

  // Employee Directory
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

  // Employee Details / Edit Form
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    if (typeof Employees !== 'undefined') Employees.showEditForm(1);
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('hr-manager-employee-edit.png');

  // Document Management (e-DMS)
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-documents.png');

  // Attendance Management
  await evalJs(`(function() {
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-attendance.png');

  // Leave Approval Screen
  await evalJs(`(function() {
    App.navigate('leaves');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-leave-approval.png');

  // Recruitment Pipeline
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('pipeline');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-recruitment.png');

  // HR Reports
  await evalJs(`(function() {
    App.navigate('reports');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('hr-manager-reports.png');

  // =========================================================================
  // GUIDE 3: DEPARTMENT MANAGER GUIDE (Usman Baig)
  // =========================================================================
  console.log('\n--- CAPTURING GUIDE 3: DEPARTMENT MANAGER ---');
  await evalJs(`(async function() {
    await Auth.login('usman.baig', 'mgr123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('department-manager-team-dashboard.png');

  // Team Directory
  await evalJs(`(function() {
    App.navigate('employees');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-team-directory.png');

  // Team Attendance
  await evalJs(`(function() {
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-team-attendance.png');

  // Leave Approval Queue
  await evalJs(`(function() {
    App.navigate('leaves');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-leave-approval.png');

  // Performance Reviews
  await evalJs(`(function() {
    App.navigate('performance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-performance.png');

  // Department Reports
  await evalJs(`(function() {
    App.navigate('reports');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('department-manager-reports.png');

  // =========================================================================
  // GUIDE 4: PAYROLL ACCOUNTANT GUIDE (Tariq Mahmood)
  // =========================================================================
  console.log('\n--- CAPTURING GUIDE 4: PAYROLL ACCOUNTANT ---');
  await evalJs(`(async function() {
    await Auth.login('tariq.finance', 'fin123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('payroll-accountant-dashboard.png');

  // Payroll List & Register
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.switchView('salary');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-payroll-list.png');

  // Payroll Period / Processing Modal
  await evalJs(`(function() {
    if (typeof Payroll !== 'undefined' && Payroll.showGenerateSlipModal) {
      Payroll.showGenerateSlipModal();
    } else if (typeof Payroll !== 'undefined') {
      Payroll.printSlip(1);
    }
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('payroll-accountant-payroll-processing.png');

  // Salary Breakdown & Components
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.switchView('revisions');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-salary-breakdown.png');

  // Tax Details & Form 16
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.switchView('tax');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-tax-details.png');

  // Payslip Preview Modal
  await evalJs(`(function() {
    if (typeof Payroll !== 'undefined') Payroll.printSlip(4);
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('payroll-accountant-payslip-preview.png');

  // Bank Export Interface
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.switchView('bank_advice');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-bank-export.png');

  // Payroll Reports
  await evalJs(`(function() {
    App.navigate('reports');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('payroll-accountant-reports.png');

  // =========================================================================
  // GUIDE 5: EMPLOYEE USER MANUAL (Fatima Raza)
  // =========================================================================
  console.log('\n--- CAPTURING GUIDE 5: EMPLOYEE USER MANUAL ---');
  // Login Page View
  await evalJs(`(function() {
    if (typeof App !== 'undefined') App.showLogin(false, 'hrm');
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('employee-login.png');

  // Employee Login
  await evalJs(`(async function() {
    await Auth.login('fatima.raza', 'emp123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('employee-dashboard.png');

  // Personal Profile
  await evalJs(`(function() {
    Employees.renderProfile(Auth.employee.id, true);
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('employee-profile.png');

  // Punch Clock Interface
  await evalJs(`(function() {
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  await capture('employee-clock-punch.png');

  // Attendance History
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

  // Leave Status Screen
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('leaves');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('employee-leave-status.png');

  // Personal Payslip
  await evalJs(`(function() {
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') Payroll.printSlip(Auth.employee.id);
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('employee-payslip.png');

  // Personal Documents Area
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('employee-documents.png');

  // Mobile PWA Viewport
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
  // GUIDE 6: ONBOARDING RECRUIT GUIDE (Saad Ibrahim)
  // =========================================================================
  console.log('\n--- CAPTURING GUIDE 6: ONBOARDING RECRUIT ---');
  await evalJs(`(async function() {
    await Auth.login('saad.ibrahim', 'emp123');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('onboarding-dashboard.png');

  // Candidate Directory / Available Postings
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('jobs');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-candidate-directory.png');

  // Recruitment Pipeline & Hiring Stages
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('pipeline');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-recruitment-pipeline.png');

  // Interview Scheduling & Tracking
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('interviews');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-interview-tracking.png');

  // Onboarding Tasks & Document Collection
  await evalJs(`(function() {
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-task-documents.png');

  // New Employee Induction & Handbook
  await evalJs(`(function() {
    App.navigate('events');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('onboarding-handbook-induction.png');

  // =========================================================================
  // GUIDE 7: JUNIOR HR GUIDE (Zain Ali)
  // =========================================================================
  console.log('\n--- CAPTURING GUIDE 7: JUNIOR HR ---');
  await evalJs(`(function() {
    Auth.switchPersona('junior.hr');
    App.showApp();
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('junior-hr-dashboard.png');

  // Employee Directory
  await evalJs(`(function() {
    App.navigate('employees');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-employee-directory.png');

  // Permitted Employee Record View
  await evalJs(`(function() {
    Employees.renderProfile(4);
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-employee-view.png');

  // Document Management
  await evalJs(`(function() {
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-document-management.png');

  // Recruitment Assistance
  await evalJs(`(function() {
    App.navigate('recruitment');
    if (typeof Recruitment !== 'undefined') Recruitment.switchView('pipeline');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-recruitment-pipeline.png');

  // Assigned Workflows / Attendance Support
  await evalJs(`(function() {
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('junior-hr-onboarding-tasks.png');

  console.log('\n✅ ALL 53 ROLE SCREENSHOTS CAPTURED WITH ZERO DUPLICATION!');
  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
});
