/**
 * scripts/capture-docs-screenshots.js
 * Captures live screenshots from HRM Pro for client enterprise documentation:
 * 1. Employee User Manual
 * 2. HR Manager Admin Guide
 * 3. Superadmin System Administration Guide
 */

const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');
const zlib = require('zlib');

const HTTP_PORT = 8124;
const DEBUG_PORT = 9588;
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
    // Check in public
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
  console.log(`[Capture] Static server running on http://127.0.0.1:${HTTP_PORT}`);
  const tmpDir = path.join(os.tmpdir(), `hrm-screen-docs-${Date.now()}`);
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
      console.log(`  📸 Saved screenshot: ${filename} (${buf.length} bytes)`);
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

  // Navigate to root
  console.log('Navigating to HRM Pro...');
  await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Landing / Login Page
  await evalJs(`(function() {
    if (typeof App !== 'undefined') App.showLogin(false, 'hrm');
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('doc_emp_01_login.png');
  await capture('doc_hr_01_login.png');

  // ─────────────────────────────────────────────────────────────
  // PART 1: EMPLOYEE SELF-SERVICE USER MANUAL SCREENSHOTS
  // ─────────────────────────────────────────────────────────────
  console.log('Authenticating as Employee (fatima.raza)...');
  await evalJs(`(async function() {
    if (typeof Auth !== 'undefined') {
      await Auth.login('fatima.raza', 'emp123');
      App.showApp();
      App.navigate('dashboard');
    }
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('doc_emp_02_dashboard.png');

  // Employee Profile
  await evalJs(`(function() {
    Employees.renderProfile(Auth.employee.id, true);
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_emp_03_profile.png');

  // Punch in/out hero widget
  await evalJs(`(function() {
    App.navigate('dashboard');
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  await capture('doc_emp_04_punch.png');

  // Attendance history
  await evalJs(`(function() {
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_emp_05_attendance_history.png');

  // Leave Status Page
  await evalJs(`(function() {
    App.navigate('leaves');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_emp_07_leave_status.png');

  // Leave Apply Form Modal
  await evalJs(`(function() {
    if (typeof Leaves !== 'undefined' && Leaves.showApplyForm) {
      Leaves.showApplyForm();
    }
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('doc_emp_06_leave_apply.png');

  // Close modal and show Payslip modal
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('payroll');
    if (typeof Payroll !== 'undefined') {
      const myId = Auth.employee ? Auth.employee.id : 4;
      if (Payroll.printSlip) Payroll.printSlip(myId);
    }
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  await capture('doc_emp_08_payslip.png');

  // Employee Documents EDMS
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('employees', 'edms');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_emp_09_documents.png');

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
  await capture('doc_emp_10_pwa_mobile.png');

  // Restore Desktop Viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // ─────────────────────────────────────────────────────────────
  // PART 2: HR MANAGER / ADMIN GUIDE SCREENSHOTS
  // ─────────────────────────────────────────────────────────────
  console.log('Authenticating as HR Director (sara.malik)...');
  await evalJs(`(async function() {
    if (typeof Auth !== 'undefined') {
      await Auth.login('sara.malik', 'hr123');
      App.showApp();
      App.navigate('dashboard');
    }
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('doc_hr_02_dashboard.png');

  // Employee Directory / Roster
  await evalJs(`(function() {
    App.navigate('employees');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_hr_03_emp_list.png');

  // Add Employee Form Modal
  await evalJs(`(function() {
    if (typeof Employees !== 'undefined' && Employees.showAddForm) {
      Employees.showAddForm({});
    }
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('doc_hr_04_emp_add.png');

  // Edit Employee Form Modal
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    if (typeof Employees !== 'undefined' && Employees.showEditForm) {
      Employees.showEditForm(1);
    }
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await capture('doc_hr_05_emp_edit.png');

  // Attendance Management
  await evalJs(`(function() {
    if (typeof Modal !== 'undefined') Modal.close();
    App.navigate('attendance');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_hr_06_attendance.png');

  // Leave Approval Action Center
  await evalJs(`(function() {
    App.navigate('leaves');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_hr_07_leave_approval.png');

  // Payroll Management & FBR Tax
  await evalJs(`(function() {
    App.navigate('payroll');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_hr_08_payroll_gen.png');

  // Recruitment ATS Pipeline
  await evalJs(`(function() {
    App.navigate('recruitment');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_hr_09_recruitment.png');

  // Reports & BI Analytics
  await evalJs(`(function() {
    App.navigate('reports');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_hr_10_reports.png');

  // ─────────────────────────────────────────────────────────────
  // PART 3: SUPERADMIN SYSTEM ADMINISTRATION GUIDE SCREENSHOTS
  // ─────────────────────────────────────────────────────────────
  console.log('Authenticating as Superadmin (admin)...');
  await evalJs(`(async function() {
    if (typeof Auth !== 'undefined') {
      await Auth.login('admin', 'admin123');
      App.showApp();
      App.navigate('dashboard');
    }
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await capture('doc_admin_01_dashboard.png');

  // User Management
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined' && Settings.switchTab) {
      Settings.switchTab('users');
    }
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_admin_02_users.png');

  // Role Permissions (RBAC)
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined' && Settings.switchTab) {
      Settings.switchTab('rbac');
    }
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_admin_03_rbac.png');

  // Company Management (Corporate Entities & Holdings)
  await evalJs(`(function() {
    App.navigate('companies');
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_admin_04_companies.png');

  // Database / Global Settings
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined' && Settings.switchTab) {
      Settings.switchTab('general');
    }
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_admin_05_settings.png');

  // Security Settings & Audit Logs
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined' && Settings.switchTab) {
      Settings.switchTab('security');
    }
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_admin_06_security.png');

  // Backup & Recovery Configuration
  await evalJs(`(function() {
    App.navigate('settings');
    if (typeof Settings !== 'undefined' && Settings.switchTab) {
      Settings.switchTab('backup');
    }
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await capture('doc_admin_07_backup.png');

  console.log('✅ All 27 client documentation screenshots captured successfully!');
  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
});
