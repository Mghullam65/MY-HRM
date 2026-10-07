const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>HRM Pro - Comprehensive RBAC & QA Test Plan</title>
<style>
  @page {
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.5;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
  }
  .header {
    border-bottom: 3px solid #2563eb;
    padding-bottom: 12px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .logo {
    font-size: 24pt;
    font-weight: 900;
    color: #1e3a8a;
    letter-spacing: -0.5px;
  }
  .doc-meta {
    font-size: 9pt;
    color: #64748b;
    text-align: right;
  }
  h1 { font-size: 19pt; color: #0f172a; margin: 0 0 8px 0; }
  h2 { font-size: 13.5pt; color: #1e40af; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 5px; margin-top: 22px; margin-bottom: 10px; page-break-after: avoid; }
  h3 { font-size: 11.5pt; color: #0f172a; margin-top: 16px; margin-bottom: 6px; page-break-after: avoid; }
  p { margin: 6px 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }
  th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
  }
  td {
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }
  code {
    background: #e2e8f0;
    padding: 2px 5px;
    border-radius: 4px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
    color: #0f172a;
    font-weight: 600;
  }
  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 12px;
    border-radius: 6px;
    font-size: 8.5pt;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Consolas', monospace;
    page-break-inside: avoid;
  }
  ul { margin: 5px 0; padding-left: 18px; }
  li { margin-bottom: 4px; }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 700;
  }
  .badge-super { background: #e0e7ff; color: #3730a3; }
  .badge-hr { background: #d1fae5; color: #065f46; }
  .badge-mgr { background: #e0f2fe; color: #075985; }
  .badge-emp { background: #fef3c7; color: #92400e; }
  .card-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #2563eb;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0;
    page-break-inside: avoid;
  }
  .footer-note {
    font-size: 8.5pt;
    color: #94a3b8;
    text-align: center;
    margin-top: 24px;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">HRM Pro</div>
      <div style="font-size: 11pt; color: #475569; font-weight: 600;">Workforce Intelligence & Enterprise Management</div>
    </div>
    <div class="doc-meta">
      <strong>QA / Testing Specification</strong><br>
      Version: 4.2.0 Enterprise<br>
      Date: October 7, 2026<br>
      Target: Chrome Automation & QA Test
    </div>
  </div>

  <h1>Comprehensive RBAC & User Privileges Test Plan</h1>
  <p>This master specification contains end-to-end test suites across all 6 pre-seeded role personas, corporate scoping rules, Pakistani statutory tax/gratuity computations, and the new <strong>Two-Tier Persistent Navigation Bar</strong>.</p>

  <div class="card-box">
    <strong>Local Test Environment:</strong><br>
    &bull; <strong>Primary Web App URL:</strong> <code>http://localhost:3000</code><br>
    &bull; <strong>Alternative CI Testing Port:</strong> <code>http://127.0.0.1:8099</code><br>
    &bull; <strong>Repository Origin:</strong> <code>https://github.com/Mghullam65/MY-HRM.git</code>
  </div>

  <h2>1. Seed User Personas & Credentials Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Username</th>
        <th>Password</th>
        <th>Role / Persona</th>
        <th>Employee ID</th>
        <th>Department Scope</th>
        <th>Authority Tier</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>admin</code></td>
        <td><code>admin123</code></td>
        <td><span class="badge badge-super">superadmin</span></td>
        <td>EMP-001 (Ahmed Khan)</td>
        <td>All Holdings (Global)</td>
        <td><strong>Universal Master Access</strong> (16 Modules, master config, audit)</td>
      </tr>
      <tr>
        <td><code>sara.malik</code></td>
        <td><code>hr123</code></td>
        <td><span class="badge badge-hr">hr_manager</span></td>
        <td>EMP-002 (Sara Malik)</td>
        <td>Corporate HR / Entity</td>
        <td><strong>Full HR Authority</strong> (Payroll runs, leave gate, ATS hiring)</td>
      </tr>
      <tr>
        <td><code>usman.baig</code></td>
        <td><code>mgr123</code></td>
        <td><span class="badge badge-mgr">dept_manager</span></td>
        <td>EMP-003 (Usman Baig)</td>
        <td>IT & Engineering</td>
        <td><strong>Team Scope</strong> (Gate-1 leave endorsements, shift swaps)</td>
      </tr>
      <tr>
        <td><code>fatima.raza</code></td>
        <td><code>emp123</code></td>
        <td><span class="badge badge-emp">employee</span></td>
        <td>EMP-004 (Fatima Raza)</td>
        <td>IT & Engineering</td>
        <td><strong>Self-Service Only</strong> (Punch clock, apply leaves, own payslip)</td>
      </tr>
      <tr>
        <td><code>saad.ibrahim</code></td>
        <td><code>emp123</code></td>
        <td><span class="badge badge-emp">onboarding</span></td>
        <td>EMP-026 (Saad Ibrahim)</td>
        <td>New Joiner Vault</td>
        <td><strong>Induction Only</strong> (Checklist, degree & CNIC uploads)</td>
      </tr>
      <tr>
        <td><code>junior.hr</code></td>
        <td><code>hr123</code></td>
        <td><span class="badge badge-hr">hr_manager (Restricted)</span></td>
        <td>EMP-006 (Zain Ali)</td>
        <td>HR Operations</td>
        <td><strong>Partial HR Scope</strong> (Read/Apply allowed, salary edit blocked)</td>
      </tr>
    </tbody>
  </table>

  <h2>2. Navigation Architecture (Two-Tier Persistent Bar)</h2>
  <p>The system utilizes a <strong>Two-Tier Persistent Bar Layout</strong> with <strong>Zero Dropdowns</strong>:</p>
  <ul>
    <li><strong>Row 1 (Top Bar):</strong> System Brand Logo, Global Spotlight Command Palette (<code>Ctrl+K</code>), Persona Quick Switcher, Dark/Light Theme toggle, Notifications, Profile menu.</li>
    <li><strong>Row 2 (Main Pillars):</strong> <code>DASHBOARD</code> | <code>PEOPLE & TALENT</code> | <code>TIME & ATTENDANCE</code> | <code>FINANCE & PAYROLL</code> | <code>OPERATIONS & ADMIN</code>.</li>
    <li><strong>Row 3 (Persistent Sub-Navigation Bar):</strong> Clicking any pillar renders its sub-modules side-by-side as flat clickable tabs directly underneath:
      <ul>
        <li><strong>PEOPLE & TALENT:</strong> <code>Employees & e-DMS</code> | <code>Recruitment (ATS)</code> | <code>Performance & OKRs</code> | <code>My Profile & Onboarding</code></li>
        <li><strong>TIME & ATTENDANCE:</strong> <code>Attendance & Shifts</code> | <code>Leaves & Absence</code> | <code>Assets & Inventory</code></li>
        <li><strong>FINANCE & PAYROLL:</strong> <code>Payroll & Taxes</code> | <code>Expense Claims</code> | <code>Final Settlement</code></li>
        <li><strong>OPERATIONS & ADMIN:</strong> <code>Helpdesk & Grievance</code> | <code>Reports & Analytics</code> | <code>Events & Notices</code> | <code>Administration</code> | <code>Multi-Company Holdings</code></li>
      </ul>
    </li>
    <li><em>Dashboard view cleanly collapses the sub-navigation bar to optimize screen space.</em></li>
  </ul>

  <h2>3. Persona QA Test Suites</h2>

  <h3>Suite 1: Super Administrator (<code>admin</code> / <code>admin123</code>)</h3>
  <ul>
    <li><strong>TC-SA-01: Master Authentication:</strong> Log in with <code>admin</code>. Lands on Dashboard with full executive telemetry and action inboxes.</li>
    <li><strong>TC-SA-02: Multi-Company Entity Switcher:</strong> Click Company dropdown in top bar. Switch between <code>Apex Group (All Entities)</code>, <code>Apex FinTech</code>, and <code>Apex Logistics</code>. Workforce counters immediately reload.</li>
    <li><strong>TC-SA-03: Two-Tier Navigation Verification:</strong> Click each pillar in Row 2. Verify sub-items appear in Row 3 cleanly without any hover dropdowns.</li>
    <li><strong>TC-SA-04: Master Administration Access:</strong> Go to <code>Operations & Admin</code> &rarr; <code>Administration</code>. Verify full access to Role Configurations, RBAC matrix, and System Audit Logs.</li>
    <li><strong>TC-SA-05: Pakistani FBR Tax & 30/26 Gratuity Settlement:</strong> Go to <code>Finance & Payroll</code> &rarr; <code>Payroll & Taxes</code> and <code>Final Settlement</code>. Verify progressive annual tax slabs (0% to 35%) and formula <code>(Last Gross &divide; 26 &times; 30) &times; Service Years</code> calculate accurately.</li>
  </ul>

  <h3>Suite 2: Corporate HR Manager (<code>sara.malik</code> / <code>hr123</code>)</h3>
  <ul>
    <li><strong>TC-HR-01: HR Dashboard & Pending Actions:</strong> Log in with <code>sara.malik</code>. Dashboard displays pending probation confirmations, document expiries, and pending leaves.</li>
    <li><strong>TC-HR-02: Master Employee Directory & e-DMS:</strong> Click <code>People & Talent</code> &rarr; <code>Employees & e-DMS</code>. Full directory of 26 employees is visible. "Add Employee" modal opens properly.</li>
    <li><strong>TC-HR-03: Final Gate Approval for Leaves & Claims:</strong> Review a leave request approved by a Department Manager. Sara can issue Final Approval or Reject with remarks.</li>
    <li><strong>TC-HR-04: Recruitment ATS Kanban:</strong> Go to <code>People & Talent</code> &rarr; <code>Recruitment (ATS)</code>. Move candidate cards across Screening &rarr; Interview &rarr; Offer &rarr; Hired stages.</li>
    <li><strong>TC-HR-05: Administrative Isolation:</strong> Master system settings outside HR are restricted to assigned company scope.</li>
  </ul>

  <h3>Suite 3: Department Manager (<code>usman.baig</code> / <code>mgr123</code>)</h3>
  <ul>
    <li><strong>TC-DM-01: Scoped Telemetry:</strong> Log in with <code>usman.baig</code>. Dashboard widgets show stats strictly for the <strong>IT & Engineering</strong> department.</li>
    <li><strong>TC-DM-02: Scoped Employee Roster:</strong> Click <code>People & Talent</code> &rarr; <code>Employees & e-DMS</code>. List is scoped strictly to direct reports (e.g. Fatima Raza, Tariq Hussain). Non-team records are hidden.</li>
    <li><strong>TC-DM-03: Gate-1 Team Leave Endorsement:</strong> Review pending team leaves. Click "Manager Endorse" or "Reject".</li>
    <li><strong>TC-DM-04: Attendance Rosters & Corrections:</strong> Go to <code>Time & Attendance</code> &rarr; <code>Attendance & Shifts</code>. Review and approve missing punch regularizations from team members.</li>
    <li><strong>TC-DM-05: Security Boundary:</strong> Cannot view salaries or confidential personnel files of employees in other departments.</li>
  </ul>

  <h3>Suite 4: Regular Employee Self-Service (<code>fatima.raza</code> / <code>emp123</code>)</h3>
  <ul>
    <li><strong>TC-EMP-01: Self-Service Punch Clock:</strong> Log in with <code>fatima.raza</code>. On Dashboard, click "Clock In". System logs timestamp with IP/device status. Button updates to "Clock Out".</li>
    <li><strong>TC-EMP-02: Submit Leave Request:</strong> Go to <code>Time & Attendance</code> &rarr; <code>Leaves & Absence</code> &rarr; "Apply Leave". Submit 2-day Casual Leave. Status shows "Pending Manager Endorsement".</li>
    <li><strong>TC-EMP-03: Confidential Payslip Download:</strong> Go to <code>Finance & Payroll</code> &rarr; <code>Payroll & Taxes</code>. Only Fatima's personal monthly payslips appear. Other employees' salaries are strictly invisible.</li>
    <li><strong>TC-EMP-04: RBAC Security Guard:</strong> Attempt to manually type <code>#administration</code> into the browser URL. System blocks access and safely redirects to Dashboard with an access denied alert.</li>
  </ul>

  <h3>Suite 5: Onboarding Candidate (<code>saad.ibrahim</code> / <code>emp123</code>)</h3>
  <ul>
    <li><strong>TC-ONB-01: Induction Portal:</strong> Log in with <code>saad.ibrahim</code>. Welcome onboarding portal displays induction progress bar.</li>
    <li><strong>TC-ONB-02: Document Vault Uploads:</strong> Candidate can upload CNIC, educational transcripts, and acknowledge company policies.</li>
    <li><strong>TC-ONB-03: System Lockdown:</strong> Operational modules (Payroll, ATS pipelines, executive settings) are hidden.</li>
  </ul>

  <h3>Suite 6: Restricted Junior HR (<code>junior.hr</code> / <code>hr123</code>)</h3>
  <ul>
    <li><strong>TC-JHR-01: Restricted Access Verification:</strong> Log in with <code>junior.hr</code> (Zain Ali).</li>
    <li><strong>TC-JHR-02: Partial Permission Check:</strong> Can view roster and apply entries, but high-stakes buttons (salary authorization, delete employee, master system resets) are disabled/hidden.</li>
  </ul>

  <h2>4. Security & Negative Boundary Tests</h2>
  <table>
    <thead>
      <tr>
        <th>Test ID</th>
        <th>Persona</th>
        <th>Unauthorized Action Attempted</th>
        <th>Expected Safe Behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SEC-01</strong></td>
        <td><code>fatima.raza</code></td>
        <td>Direct URL hash navigation to <code>#administration</code></td>
        <td>Blocked: Redirects safely to Dashboard with unauthorized toast warning.</td>
      </tr>
      <tr>
        <td><strong>SEC-02</strong></td>
        <td><code>fatima.raza</code></td>
        <td>Inspect other employees' salaries in browser memory</td>
        <td>Blocked: Passwords masked, data filtered strictly to self session.</td>
      </tr>
      <tr>
        <td><strong>SEC-03</strong></td>
        <td><code>usman.baig</code></td>
        <td>Attempt to endorse a leave outside IT department</td>
        <td>Blocked: Cross-department requests do not appear in manager inbox.</td>
      </tr>
      <tr>
        <td><strong>SEC-04</strong></td>
        <td>Any Persona</td>
        <td>Rapid clicking across navigation pillars in Row 2</td>
        <td>Passed: Instant sub-nav row update; zero dropdown overlapping or glitches.</td>
      </tr>
      <tr>
        <td><strong>SEC-05</strong></td>
        <td>Any Persona</td>
        <td>Toggle Obsidian Dark Mode &harr; Crisp Light Mode</td>
        <td>Passed: High-contrast readability, tokens persisted in localStorage.</td>
      </tr>
    </tbody>
  </table>

  <h2>5. Chrome Claude Prompt Instructions</h2>
  <pre>Please open http://localhost:3000. Follow the test plan in this document.
Test each persona sequentially:
1. admin (admin123) - Superadmin Universal Access, Multi-Company, Two-Tier Nav
2. sara.malik (hr123) - HR Manager, e-DMS, ATS Kanban, Final Leave Approval
3. usman.baig (mgr123) - Line Manager, Scoped Team Telemetry, Gate-1 Approvals
4. fatima.raza (emp123) - Self-Service, Punch Clock, Leave Submission, Own Payslip
5. saad.ibrahim (emp123) - Onboarding Induction Vault & Policy Acknowledgment
6. junior.hr (hr123) - Restricted Junior HR with partial permissions
Verify that all navigation uses the persistent two-tier bar without dropdowns, and report test status.</pre>

  <div class="footer-note">
    HRM Pro Enterprise &bull; Automated QA & RBAC Test Suite &bull; Generated for Chrome Claude Testing
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlContent);
});

server.listen(8097, '127.0.0.1', () => {
  console.log('[Server] Serving printable HTML at http://127.0.0.1:8097');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outputPath = path.join(__dirname, '..', 'docs', 'HRM_PRO_TEST_CASES_RBAC.pdf');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${outputPath}`,
    'http://127.0.0.1:8097'
  ]);

  chrome.on('close', (code) => {
    console.log('[Success] Chrome printed PDF with exit code', code);
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`[File Ready] ${outputPath} (${stats.size} bytes)`);
    }
    server.close();
    process.exit(0);
  });

  chrome.on('error', (err) => {
    console.error('[Error spawning Chrome]', err);
    server.close();
    process.exit(1);
  });
});
