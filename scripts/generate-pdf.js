const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>HRM Pro - Complete Application RBAC & QA Test Suite</title>
<style>
  @page {
    size: A4;
    margin: 14mm 12mm 14mm 12mm;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.45;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }
  .header {
    border-bottom: 3px solid #2563eb;
    padding-bottom: 10px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .logo {
    font-size: 22pt;
    font-weight: 900;
    color: #1e3a8a;
    letter-spacing: -0.5px;
  }
  .subtitle {
    font-size: 10pt;
    color: #475569;
    font-weight: 600;
  }
  .doc-meta {
    font-size: 8.5pt;
    color: #64748b;
    text-align: right;
    line-height: 1.35;
  }
  h1 { font-size: 16pt; color: #0f172a; margin: 0 0 6px 0; }
  h2 { font-size: 12pt; color: #1e40af; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; page-break-after: avoid; }
  h3 { font-size: 10pt; color: #0f172a; margin-top: 12px; margin-bottom: 4px; page-break-after: avoid; }
  p { margin: 4px 0 6px 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 12px 0;
    font-size: 8pt;
    page-break-inside: auto;
  }
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }
  code {
    background: #e2e8f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 7.8pt;
    color: #0f172a;
    font-weight: 600;
  }
  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 10px;
    border-radius: 5px;
    font-size: 7.8pt;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Consolas', monospace;
    page-break-inside: avoid;
    margin: 6px 0;
  }
  .card-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #2563eb;
    padding: 8px 12px;
    border-radius: 0 4px 4px 0;
    margin: 8px 0;
    page-break-inside: avoid;
    font-size: 8.5pt;
  }
  .badge {
    display: inline-block;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-super { background: #e0e7ff; color: #3730a3; }
  .badge-hr { background: #d1fae5; color: #065f46; }
  .badge-mgr { background: #e0f2fe; color: #075985; }
  .badge-emp { background: #fef3c7; color: #92400e; }
  .footer-note {
    font-size: 7.5pt;
    color: #94a3b8;
    text-align: center;
    margin-top: 18px;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">HRM Pro Enterprise</div>
      <div class="subtitle">Complete Application Quality Assurance & RBAC Audit Specification</div>
    </div>
    <div class="doc-meta">
      <strong>QA Specification & Test Execution Plan</strong><br>
      System Version: 4.2.0 Enterprise Release<br>
      Local App URL: <code>http://localhost:3000</code><br>
      Target: Chrome Automation & Claude Testing
    </div>
  </div>

  <h1>Complete Application RBAC & QA Test Suite</h1>
  <p>This master document provides comprehensive, end-to-end test cases covering the entire <strong>HRM Pro</strong> application across all user personas, permission tiers, business modules, and Pakistani statutory compliance workflows.</p>

  <div class="card-box">
    <strong>Local Environment & System Endpoints:</strong><br>
    &bull; <strong>Primary Web App & SPA Frontend:</strong> <code>http://localhost:3000</code><br>
    &bull; <strong>REST API Base:</strong> <code>http://localhost:3000/api</code> | <strong>Health Check:</strong> <code>http://localhost:3000/api/health</code><br>
    &bull; <strong>Live WebSocket Stream:</strong> <code>ws://localhost:3000/ws</code> | <strong>Sync SSE Stream:</strong> <code>http://localhost:3000/api/sync/stream</code><br>
    &bull; <strong>Backend Storage:</strong> Autonomous Dual Storage (Express local store with Supabase PostgreSQL cloud sync fallback)
  </div>

  <h2>1. Seed User Personas & Credentials Matrix</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Username</th>
        <th style="width: 12%;">Password</th>
        <th style="width: 14%;">Role / Persona</th>
        <th style="width: 20%;">Employee Record</th>
        <th style="width: 16%;">Entity / Dept Scope</th>
        <th style="width: 24%;">Authority Tier & Privileges</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>admin</code></td>
        <td><code>admin123</code></td>
        <td><span class="badge badge-super">superadmin</span></td>
        <td>EMP-001 (Ahmed Khan, CEO)</td>
        <td>All Holdings (Global)</td>
        <td><strong>Universal Master Access:</strong> Sovereign access to all 16 modules, multi-company switcher, payroll finalization, administrative security.</td>
      </tr>
      <tr>
        <td><code>sara.malik</code></td>
        <td><code>hr123</code></td>
        <td><span class="badge badge-hr">hr_manager</span></td>
        <td>EMP-002 (Sara Malik, HR Head)</td>
        <td>Apex Technologies (Entity)</td>
        <td><strong>Corporate HR Authority:</strong> Employee lifecycle, e-DMS records, ATS recruitment pipeline, Tier-2 final leave approvals, payroll runs.</td>
      </tr>
      <tr>
        <td><code>usman.baig</code></td>
        <td><code>mgr123</code></td>
        <td><span class="badge badge-mgr">dept_manager</span></td>
        <td>EMP-003 (Usman Baig, Tech Lead)</td>
        <td>IT & Engineering Dept</td>
        <td><strong>Team Line Management Scope:</strong> Scoped team telemetry, Tier-1 leave endorsements, missing punch regularization. Blocked from company salaries.</td>
      </tr>
      <tr>
        <td><code>fatima.raza</code></td>
        <td><code>emp123</code></td>
        <td><span class="badge badge-emp">employee</span></td>
        <td>EMP-004 (Fatima Raza, Software Eng)</td>
        <td>IT & Engineering Dept</td>
        <td><strong>Strict Self-Service Only:</strong> Biometric punch clock, apply personal leaves, view own confidential payslips with FBR tax. Peer data strictly isolated.</td>
      </tr>
      <tr>
        <td><code>saad.ibrahim</code></td>
        <td><code>emp123</code></td>
        <td><span class="badge badge-emp">onboarding</span></td>
        <td>EMP-026 (Saad Ibrahim, New Hire)</td>
        <td>Corporate Induction</td>
        <td><strong>New Joiner Onboarding Vault:</strong> Upload induction documents (CNIC, degrees, IBAN), acknowledge handbook. Operational modules hidden.</td>
      </tr>
      <tr>
        <td><code>junior.hr</code></td>
        <td><code>hr123</code></td>
        <td><span class="badge badge-hr">hr_manager</span> (Restricted)</td>
        <td>EMP-006 (Zain Ali, Junior HR)</td>
        <td>HR Operations Desk</td>
        <td><strong>Partial Permissions Desk:</strong> Read employee directory, log candidate notes. High-privilege actions (salary finalize, system settings) revoked.</td>
      </tr>
    </tbody>
  </table>

  <h2>2. Navigation Architecture (Two-Tier Persistent Header)</h2>
  <div class="card-box">
    <strong>Layout Verification Standard:</strong><br>
    &bull; <strong>Tier 1 (Top Bar):</strong> Brand Logo, Global Search (<code>Ctrl+K</code>), Multi-Company Switcher, Demo Persona Switcher, Dark/Light Mode, Notifications.<br>
    &bull; <strong>Tier 2 (Main Category Pillars):</strong> <code>DASHBOARD</code> | <code>PEOPLE & TALENT</code> | <code>TIME & ATTENDANCE</code> | <code>FINANCE & PAYROLL</code> | <code>OPERATIONS & ADMIN</code><br>
    &bull; <strong>Tier 3 (Persistent Sub-Navigation Bar):</strong> Clicking any category pillar renders horizontal flat sub-tabs underneath. <strong>Zero hover dropdowns obscuring the screen</strong>.
  </div>

  <h2>3. Complete Application Test Suites by Module</h2>

  <h3>Suite 1: Authentication, Session Management & Persona Switcher</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>AUTH-01</strong></td>
        <td><code>admin</code></td>
        <td>Navigate to <code>http://localhost:3000/#login</code>. Enter <code>admin</code> / <code>admin123</code>.</td>
        <td>Login succeeds. Redirects to <code>#dashboard</code>. Topbar displays Ahmed Khan (Superadmin). Session stored in localStorage.</td>
      </tr>
      <tr>
        <td><strong>AUTH-02</strong></td>
        <td><code>sara.malik</code></td>
        <td>Login with <code>sara.malik</code> / <code>hr123</code>.</td>
        <td>Lands on Dashboard with HR Manager role badge. Corporate HR widgets loaded.</td>
      </tr>
      <tr>
        <td><strong>AUTH-03</strong></td>
        <td><code>usman.baig</code></td>
        <td>Login with <code>usman.baig</code> / <code>mgr123</code>.</td>
        <td>Dashboard scopes strictly to IT & Engineering team members and pending manager approvals.</td>
      </tr>
      <tr>
        <td><strong>AUTH-04</strong></td>
        <td><code>fatima.raza</code></td>
        <td>Login with <code>fatima.raza</code> / <code>emp123</code>.</td>
        <td>Dashboard renders Self-Service view: Punch Clock, personal leave balance, own upcoming events.</td>
      </tr>
      <tr>
        <td><strong>AUTH-05</strong></td>
        <td>Any Persona</td>
        <td>Enter valid username with incorrect password (e.g. <code>admin</code> / <code>wrongPass</code>).</td>
        <td>Login blocked with error: "Invalid username or password". Password field cleared.</td>
      </tr>
      <tr>
        <td><strong>AUTH-06</strong></td>
        <td>Inactive User</td>
        <td>Attempt login with deactivated user (<code>inactive.user</code> / <code>Password123!</code>).</td>
        <td>Rejection alert: "Account Inactive: Your employee profile has been deactivated."</td>
      </tr>
      <tr>
        <td><strong>AUTH-07</strong></td>
        <td>Any Persona</td>
        <td>Click User Avatar → <strong>Sign Out</strong>.</td>
        <td>Session purged from sessionStorage and localStorage. Immediate redirect to <code>#login</code>.</td>
      </tr>
      <tr>
        <td><strong>AUTH-08</strong></td>
        <td>Any Persona</td>
        <td>Select persona from <strong>Demo Persona Switcher</strong> in topbar.</td>
        <td>Instant session swap to chosen persona without page reload; navigation updates to match role.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 2: Executive Dashboard & Live Biometric Punch Clock</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>DASH-01</strong></td>
        <td><code>admin</code></td>
        <td>Inspect 4 KPI Summary Cards on Dashboard.</td>
        <td>Total Employees, Present Today, On Leave, Monthly Payroll show live numbers with percentage sparklines. Zero <code>NaN</code> or <code>undefined</code>.</td>
      </tr>
      <tr>
        <td><strong>DASH-02</strong></td>
        <td><code>fatima.raza</code></td>
        <td>Inspect Live Punch Clock widget. Click <strong>Clock In</strong>.</td>
        <td>Live seconds timer running. Click plays confirmation audio chime, logs punch timestamp, and button toggles to glowing <strong>Clock Out</strong>.</td>
      </tr>
      <tr>
        <td><strong>DASH-03</strong></td>
        <td><code>fatima.raza</code></td>
        <td>Click <strong>Clock Out</strong>.</td>
        <td>Calculates shift working duration, logs out-time, and shows success toast.</td>
      </tr>
      <tr>
        <td><strong>DASH-04</strong></td>
        <td><code>admin</code></td>
        <td>Inspect <strong>Executive Action Inbox</strong> widget.</td>
        <td>Displays items awaiting sign-off (pending leaves, expense claims, new hires). Badge counts reflect live pending items.</td>
      </tr>
      <tr>
        <td><strong>DASH-05</strong></td>
        <td>Any</td>
        <td>Inspect <strong>Corporate Headlines & Noticeboard</strong> widget.</td>
        <td>Displays current announcements, upcoming holidays, and company news cleanly.</td>
      </tr>
      <tr>
        <td><strong>DASH-06</strong></td>
        <td>Any</td>
        <td>Click <strong>Floating WhatsApp / Quick Action</strong> button.</td>
        <td>Opens quick support dialogue or initiates WhatsApp helpline without layout breakage.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 3: Workforce Directory & e-DMS Digital File Vault</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>EMP-01</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Click <code>PEOPLE & TALENT</code> → <code>Employees & e-DMS</code>.</td>
        <td>Full workforce directory displays with Avatar, Emp ID, Full Name, Designation, Department, Status, Actions.</td>
      </tr>
      <tr>
        <td><strong>EMP-02</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Click <strong>+ Add Employee</strong>. Fill details and save.</td>
        <td>Form validates inputs. New employee is added to database and audit log registers creation.</td>
      </tr>
      <tr>
        <td><strong>EMP-03</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Click on <code>EMP-004 Fatima Raza</code> to open e-DMS Vault.</td>
        <td>Displays digital file: Basic Info, Employment, Statutory (CNIC, NTN, EOBI), Bank (IBAN), and Document Attachments.</td>
      </tr>
      <tr>
        <td><strong>EMP-04</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Click <code>PEOPLE & TALENT</code> → <code>Employees & e-DMS</code>.</td>
        <td>Filtered strictly to IT & Engineering department. Employees in Finance, HR, or Marketing are hidden.</td>
      </tr>
      <tr>
        <td><strong>EMP-05</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Click <code>PEOPLE & TALENT</code> → <code>My Profile</code>.</td>
        <td>Only Fatima's own profile opens. Cannot view peer salaries or confidential records.</td>
      </tr>
      <tr>
        <td><strong>EMP-06</strong></td>
        <td><code>junior.hr</code></td>
        <td>Inspect employee record actions.</td>
        <td>View and note logging permitted; destructive actions (Delete, Terminate, Salary Edit) disabled.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 4: Time, Attendance, Biometric Gateway & Muster Roll</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>ATT-01</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Click <code>TIME & ATTENDANCE</code> → <code>Attendance & Shifts</code>.</td>
        <td>Daily attendance grid renders check-in, check-out, working hours, and punctuality badges (On Time, Late, Absent).</td>
      </tr>
      <tr>
        <td><strong>ATT-02</strong></td>
        <td>Any</td>
        <td>Open <strong>Biometric Simulator</strong> tab. Click <strong>Simulate Punch</strong>.</td>
        <td>Simulates TCP/IP ZKTeco machine punch. Pushes punch via WebSocket and updates attendance grid in real time.</td>
      </tr>
      <tr>
        <td><strong>ATT-03</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Click <strong>Request Attendance Regularization</strong>.</td>
        <td>Submits missed punch regularisation request with reason. Status set to Pending Manager Approval.</td>
      </tr>
      <tr>
        <td><strong>ATT-04</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Open Regularization Approvals queue.</td>
        <td>Usman sees Fatima's request. Can click <strong>Endorse</strong> or <strong>Reject</strong> with manager comments.</td>
      </tr>
      <tr>
        <td><strong>ATT-05</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Open <strong>Monthly Statutory Muster Roll</strong> tab.</td>
        <td>Generates 31-day attendance matrix with P/A/L/H codes, total payable days, and CSV export.</td>
      </tr>
      <tr>
        <td><strong>ATT-06</strong></td>
        <td>Any</td>
        <td>Toggle GPS Geofencing in Attendance Settings.</td>
        <td>Punches recorded outside office geofence radius are flagged as "Remote / Geofence Warning".</td>
      </tr>
      <tr>
        <td><strong>ATT-07</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Simulate Offline Mode in DevTools. Click Clock In.</td>
        <td>PWA service worker queues punch locally; automatically syncs to backend upon network reconnection.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 5: Leave Management & 2-Tier Approval Workflow</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>LEV-01</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Click <code>TIME & ATTENDANCE</code> → <code>Leaves & Absence</code>.</td>
        <td>Quota cards display Annual (14), Casual (10), Sick (8) with Used, Available, and Pending numbers.</td>
      </tr>
      <tr>
        <td><strong>LEV-02</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Click <strong>Apply Leave</strong>. Select Casual Leave (2 days), enter reason, and Submit.</td>
        <td>Leave application recorded. Status set to <code>Pending Manager Endorsement</code>.</td>
      </tr>
      <tr>
        <td><strong>LEV-03</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Log in as <code>usman.baig</code>. Open Pending Leave Approvals.</td>
        <td>Fatima's request appears in queue. Usman clicks <strong>Endorse Request</strong>. Status advances to <code>Pending HR Approval</code>.</td>
      </tr>
      <tr>
        <td><strong>LEV-04</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Log in as <code>sara.malik</code>. Open Executive Leave Approvals.</td>
        <td>Request displays with Manager Endorsement. Sara clicks <strong>Final Approve</strong>. Balance deducted; status <code>Approved</code>.</td>
      </tr>
      <tr>
        <td><strong>LEV-05</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Inspect leave queue for non-IT employees (Finance, HR).</td>
        <td>Non-IT employee leaves do NOT appear in Usman's queue. Department isolation verified.</td>
      </tr>
      <tr>
        <td><strong>LEV-06</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Inspect <strong>Team Leave Heatmap & Calendar</strong>.</td>
        <td>Visual calendar highlights planned leaves, preventing cross-team coverage bottlenecks.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 6: Finance, Payroll & Pakistani Statutory FBR Tax Engine</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>PAY-01</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Click <code>FINANCE & PAYROLL</code> → <code>Payroll & Taxes</code> → <strong>Generate Payroll Run</strong>.</td>
        <td>Calculates Basic Pay, House Rent (45%), Medical (10%), Utilities (10%), Gross Salary for all active employees.</td>
      </tr>
      <tr>
        <td><strong>PAY-02</strong></td>
        <td><code>admin</code></td>
        <td>Verify FBR Tax calculation for PKR 150,000 monthly salary (PKR 1.8M annual).</td>
        <td>FBR 2025-27 progressive salaried tax table computes dynamic monthly withholding. Slabs above 600K apply incrementally.</td>
      </tr>
      <tr>
        <td><strong>PAY-03</strong></td>
        <td><code>admin</code></td>
        <td>Inspect statutory deductions: Provident Fund (PF 8.33%) and EOBI (PKR 350).</td>
        <td>Net Salary matches: <code>Gross - FBR Tax - PF - EOBI - Unpaid Days</code>. Deductions ledger balanced.</td>
      </tr>
      <tr>
        <td><strong>PAY-04</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Click <strong>Generate Bank Disbursal File</strong>. Select HBL / MCB / 1Link format.</td>
        <td>Exports formatted CSV/Excel file with Account No, IBAN, Beneficiary Name, Net Salary, and batch checksum.</td>
      </tr>
      <tr>
        <td><strong>PAY-05</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Log in as <code>fatima.raza</code>. Navigate to <code>FINANCE & PAYROLL</code>.</td>
        <td>Fatima sees ONLY her personal payslips. <strong>All other employee salaries are completely hidden</strong>.</td>
      </tr>
      <tr>
        <td><strong>PAY-06</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Click <strong>Download PDF Payslip</strong>.</td>
        <td>Generates branded PDF payslip with salary breakdown, tax deductions, and net disbursed figure.</td>
      </tr>
      <tr>
        <td><strong>PAY-07</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Navigate to <code>FINANCE & PAYROLL</code>.</td>
        <td>Cannot view salaries of peers or department heads. Payroll execution buttons hidden.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 7: Statutory Gratuity Final Settlement (30/26 Formula)</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>SET-01</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Click <code>FINANCE & PAYROLL</code> → <code>Final Settlement</code> → <strong>Initiate Exit Clearance</strong>.</td>
        <td>Settlement wizard opens: Select employee, Exit Date, Notice Period Served, and Reason for Exit.</td>
      </tr>
      <tr>
        <td><strong>SET-02</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Inspect <strong>Statutory Gratuity Card</strong>.</td>
        <td>Computes Pakistani labor law formula: <code>(Last Gross Salary ÷ 26 × 30) × Qualifying Service Years</code> accurately.</td>
      </tr>
      <tr>
        <td><strong>SET-03</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Verify <strong>3-Gate Clearance Workflow</strong> (Gate 1: IT Asset, Gate 2: Admin, Gate 3: Finance).</td>
        <td>Each gate requires sign-off with remarks. Final voucher blocked until all 3 gates are marked cleared.</td>
      </tr>
      <tr>
        <td><strong>SET-04</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Inspect Leave Encashment & Notice Period Adjustments.</td>
        <td>Unavailed leaves encashed at last gross daily rate; unserved notice period deducted proportionately.</td>
      </tr>
      <tr>
        <td><strong>SET-05</strong></td>
        <td><code>admin</code></td>
        <td>Click <strong>Generate Settlement Voucher (Print/PDF)</strong>.</td>
        <td>Outputs clearance letter and settlement voucher with itemized gratuity, deductions, and signature blocks.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 8: Multi-Company Model A Scoping (Holding & Subsidiaries)</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>CMP-01</strong></td>
        <td><code>admin</code></td>
        <td>In Topbar Company Switcher, switch from <code>Apex Group</code> to <code>Apex FinTech Ltd</code>.</td>
        <td>UI scopes instantly to Apex FinTech. Employee directory and dashboard numbers reload to reflect only this subsidiary.</td>
      </tr>
      <tr>
        <td><strong>CMP-02</strong></td>
        <td><code>admin</code></td>
        <td>Click <code>OPERATIONS & ADMIN</code> → <code>Company Entities</code>.</td>
        <td>Superadmin can manage holding companies, add branches, and assign entity HR managers.</td>
      </tr>
      <tr>
        <td><strong>CMP-03</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Inspect Topbar Company Switcher.</td>
        <td>Sara is locked to her assigned company (<code>Apex Technologies</code>). Sister entity records remain isolated.</td>
      </tr>
      <tr>
        <td><strong>CMP-04</strong></td>
        <td><code>admin</code></td>
        <td>Switch back to <code>Apex Group (All Holdings)</code>.</td>
        <td>Aggregates group-level headcount and global payroll metrics.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 9: Recruitment ATS & Kanban Pipeline</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>REC-01</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Click <code>PEOPLE & TALENT</code> → <code>Recruitment (ATS)</code>.</td>
        <td>Kanban board displays columns: Screening, Shortlisted, Technical Interview, HR Interview, Job Offer, Hired.</td>
      </tr>
      <tr>
        <td><strong>REC-02</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Click <strong>+ Post Job Opening</strong>. Fill title, department, vacancies and publish.</td>
        <td>Job requisition created and visible in recruitment dashboard.</td>
      </tr>
      <tr>
        <td><strong>REC-03</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Drag candidate card from Screening to Technical Interview.</td>
        <td>Candidate card moves smoothly. Prompt opens to schedule interview with Department Manager.</td>
      </tr>
      <tr>
        <td><strong>REC-04</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Click <strong>Generate Offer Letter</strong> on candidate in Job Offer column.</td>
        <td>Generates branded offer letter with proposed designation, compensation, and joining date.</td>
      </tr>
      <tr>
        <td><strong>REC-05</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Click <strong>Mark Hired & Convert to Employee</strong>.</td>
        <td>Provisions new employee record into e-DMS directory and generates onboarding checklist.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 10: Performance Management, OKRs & Appraisals</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>PRF-01</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Click <code>PEOPLE & TALENT</code> → <code>Performance & OKRs</code>.</td>
        <td>Usman views assigned KPIs and sprint goals for his IT engineering team members.</td>
      </tr>
      <tr>
        <td><strong>PRF-02</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Conduct manager appraisal review for Fatima Raza. Enter ratings (1-5) and submit.</td>
        <td>Review saved. Weighted score computed; status updates to Completed.</td>
      </tr>
      <tr>
        <td><strong>PRF-03</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Log in as <code>fatima.raza</code>. Navigate to Performance & OKRs.</td>
        <td>Fatima views her personal goals and manager appraisal notes. Peer ratings remain hidden.</td>
      </tr>
      <tr>
        <td><strong>PRF-04</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Open Annual Promotion & Increment Simulator.</td>
        <td>Simulates performance-linked salary revisions and generates increment letters.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 11: Company Assets & Inventory Lifecycle</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>AST-01</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Click <code>TIME & ATTENDANCE</code> → <code>Assets & Inventory</code>.</td>
        <td>Inventory list displays assets (Laptops, Chairs, Phones) with Asset Tag, Serial, Status (Available/Assigned).</td>
      </tr>
      <tr>
        <td><strong>AST-02</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Assign asset <code>ASSET-001 (Dell Laptop)</code> to <code>EMP-004 Fatima Raza</code>.</td>
        <td>Status updates to Assigned; assignment timestamp and handover agreement logged.</td>
      </tr>
      <tr>
        <td><strong>AST-03</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Log in as Fatima. Check My Profile → Assigned Assets.</td>
        <td>Dell Laptop appears in Fatima's personal custody list.</td>
      </tr>
      <tr>
        <td><strong>AST-04</strong></td>
        <td><code>sara.malik</code> (HR)</td>
        <td>Initiate asset return.</td>
        <td>Asset returned to inventory; condition logged; updates exit settlement clearance if retiring.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 12: Expense Claims & Travel Reimbursements</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>EXP-01</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Click <code>FINANCE & PAYROLL</code> → <code>Expense Claims</code> → <strong>Submit Claim</strong>.</td>
        <td>Enter Category (Travel/Fuel), Amount (PKR 4,500), attach receipt, and Submit.</td>
      </tr>
      <tr>
        <td><strong>EXP-02</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Inspect personal claims table.</td>
        <td>Claim appears with status Pending Manager Endorsement.</td>
      </tr>
      <tr>
        <td><strong>EXP-03</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Log in as <code>usman.baig</code>. Open Team Expense Approvals.</td>
        <td>Fatima's claim displays with receipt preview. Usman clicks Endorse Claim.</td>
      </tr>
      <tr>
        <td><strong>EXP-04</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Approve claim in Finance queue.</td>
        <td>Claim approved; reimbursement amount automatically queues into upcoming monthly payroll slip.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 13: Helpdesk Ticketing, Live Chat & Gemini HR Co-Pilot</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>HLP-01</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Click <code>OPERATIONS & ADMIN</code> → <code>Helpdesk & Support</code> → <strong>Create Ticket</strong>.</td>
        <td>Submit ticket (Category: IT Support / VPN, Priority: High). Ticket registered with tracking ID (e.g. TICK-101).</td>
      </tr>
      <tr>
        <td><strong>HLP-02</strong></td>
        <td><code>admin</code> / <code>usman.baig</code></td>
        <td>Open Helpdesk dashboard. Assign ticket to technician and mark Resolved.</td>
        <td>Ticket status updates live; employee receives resolution notification.</td>
      </tr>
      <tr>
        <td><strong>HLP-03</strong></td>
        <td>Any Persona</td>
        <td>Open floating <strong>Enterprise Live Chat</strong> on bottom-right. Send message.</td>
        <td>Transmits via WebSocket, timestamps message, updates chat thread with zero latency.</td>
      </tr>
      <tr>
        <td><strong>HLP-04</strong></td>
        <td>Any Persona</td>
        <td>Open <strong>HR AI Co-Pilot (Gemini Assistant)</strong>. Ask about gratuity formula.</td>
        <td>Gemini model (gemini-3.5-flash-lite or fast fallback) explains (Last Gross/26*30)*Years clearly with no errors.</td>
      </tr>
      <tr>
        <td><strong>HLP-05</strong></td>
        <td>Any Persona</td>
        <td>Click floating <strong>WhatsApp Quick Connect</strong> launcher.</td>
        <td>Opens pre-configured WhatsApp chat link with HR helpline.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 14: Headcount Analytics & Custom Reports</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>REP-01</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Click <code>OPERATIONS & ADMIN</code> → <code>Reports & Analytics</code>.</td>
        <td>Dashboard renders Chart.js visualisations: Department Headcount, Diversity, Attrition, Attendance trends.</td>
      </tr>
      <tr>
        <td><strong>REP-02</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Generate <strong>FBR Annual Tax Schedule Report</strong>.</td>
        <td>Generates annual tax ledger with employee CNICs, gross taxable salaries, and progressive tax deducted.</td>
      </tr>
      <tr>
        <td><strong>REP-03</strong></td>
        <td><code>admin</code> / <code>sara.malik</code></td>
        <td>Select <strong>Attendance Muster Summary</strong> and export to CSV.</td>
        <td>Downloads clean CSV file with zero encoding errors.</td>
      </tr>
      <tr>
        <td><strong>REP-04</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Navigate to Reports & Analytics.</td>
        <td>Usman can only generate reports pertaining to his own team members (Team Attendance, Team Leaves).</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 15: Administration, RBAC Role Matrix & Security Audit Trail</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>ADM-01</strong></td>
        <td><code>admin</code> (Superadmin)</td>
        <td>Click <code>OPERATIONS & ADMIN</code> → <code>Administration</code>.</td>
        <td>Access allowed: User Accounts, Role & Permissions Matrix, Departments, Branches, Designations, Audit Logs.</td>
      </tr>
      <tr>
        <td><strong>ADM-02</strong></td>
        <td><code>admin</code> (Superadmin)</td>
        <td>In User Accounts tab, click <strong>Reset Password</strong> on a demo user.</td>
        <td>Password resets securely; audit log registers action with admin timestamp and IP.</td>
      </tr>
      <tr>
        <td><strong>ADM-03</strong></td>
        <td><code>admin</code> (Superadmin)</td>
        <td>Inspect <strong>Role & Permissions Matrix</strong>.</td>
        <td>Toggles accurately reflect permission rules (View, Create, Edit, Delete, Approve) across modules.</td>
      </tr>
      <tr>
        <td><strong>ADM-04</strong></td>
        <td><code>admin</code> (Superadmin)</td>
        <td>Inspect <strong>Security Audit Logs</strong> tab.</td>
        <td>Displays immutable audit trail with User, Action, Entity, Details, and Timestamp.</td>
      </tr>
      <tr>
        <td><strong>ADM-05</strong></td>
        <td><code>sara.malik</code> / <code>usman.baig</code></td>
        <td>Attempt to navigate to <code>#administration</code>.</td>
        <td>Access restricted. System administration settings reserved exclusively for Superadmin.</td>
      </tr>
    </tbody>
  </table>

  <h3>Suite 16: System Settings, Themes, Density & PWA Offline Queue</h3>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Action / Steps</th><th style="width:35%;">Expected Result</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>SET-01</strong></td>
        <td>Any Persona</td>
        <td>Toggle between <strong>Obsidian Dark Mode</strong> and <strong>Crisp Light Mode</strong>.</td>
        <td>Instant theme transition with high-contrast readability; persists across page reload in localStorage.</td>
      </tr>
      <tr>
        <td><strong>SET-02</strong></td>
        <td>Any Persona</td>
        <td>Toggle <strong>Table Density</strong> (High-Density Compact vs Comfortable).</td>
        <td>Tables immediately toggle row padding without page refresh, optimising accounting data view.</td>
      </tr>
      <tr>
        <td><strong>SET-03</strong></td>
        <td>Any Persona</td>
        <td>Press <code>Ctrl+K</code> (or <code>Cmd+K</code>).</td>
        <td>Spotlight Command Palette opens. Typing module name navigates directly. Chords G+D, G+E, G+P work.</td>
      </tr>
      <tr>
        <td><strong>SET-04</strong></td>
        <td>Any Persona</td>
        <td>Click <strong>Interactive Guided Tour</strong>.</td>
        <td>Interactive walkthrough highlights navigation pillars, punch clock, action inbox, and profile.</td>
      </tr>
      <tr>
        <td><strong>SET-05</strong></td>
        <td>Any Persona</td>
        <td>Inspect Service Worker registration (<code>sw.js</code>).</td>
        <td>PWA service worker active, enabling offline punch queue and static asset caching.</td>
      </tr>
    </tbody>
  </table>

  <h2>4. Security & Boundary Negative Tests</h2>
  <table>
    <thead><tr><th style="width:12%;">Test ID</th><th style="width:18%;">Persona</th><th style="width:35%;">Unauthorized Attempt</th><th style="width:35%;">Expected Secure Behavior</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>SEC-01</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Direct URL jump: typing <code>http://localhost:3000/#administration</code>.</td>
        <td>Blocked: System intercepts navigation, shows access warning toast, redirects to safe view.</td>
      </tr>
      <tr>
        <td><strong>SEC-02</strong></td>
        <td><code>fatima.raza</code> (Emp)</td>
        <td>Inspect Console: attempting to read <code>DB.get('users')</code> or peer salaries.</td>
        <td>Passwords and hashes sanitized from memory. Cross-employee salary records are inaccessible.</td>
      </tr>
      <tr>
        <td><strong>SEC-03</strong></td>
        <td><code>usman.baig</code> (Mgr)</td>
        <td>Attempt to endorse a leave outside IT department.</td>
        <td>Blocked: Non-department requests do not appear in manager inbox.</td>
      </tr>
      <tr>
        <td><strong>SEC-04</strong></td>
        <td><code>saad.ibrahim</code> (Onboarding)</td>
        <td>Attempt to access Payroll, ATS, or Attendance modules.</td>
        <td>Blocked: Onboarding persona locked strictly to induction vault and handbook acknowledgment.</td>
      </tr>
      <tr>
        <td><strong>SEC-05</strong></td>
        <td>Any Persona</td>
        <td>Rapid clicking across navigation pillars in Row 2.</td>
        <td>Instant sub-nav row update; zero dropdown overlapping or glitches.</td>
      </tr>
      <tr>
        <td><strong>SEC-06</strong></td>
        <td>Any Persona</td>
        <td>XSS attempt in leave remarks (<code>&lt;script&gt;alert('xss')&lt;/script&gt;</code>).</td>
        <td>Sanitized via <code>Utils.escapeHtml()</code> before rendering. Zero script execution.</td>
      </tr>
      <tr>
        <td><strong>SEC-07</strong></td>
        <td>Inactive User</td>
        <td>Attempting API requests with deactivated session.</td>
        <td>API rejects with 401/403 and purges client session tokens.</td>
      </tr>
      <tr>
        <td><strong>SEC-08</strong></td>
        <td>Any Persona</td>
        <td>Browser zoom testing (100%, 125%, 150%) and mobile viewport (375px).</td>
        <td>Layout reflows seamlessly: Topbar collapses to mobile hamburger, bottom nav dock activates.</td>
      </tr>
    </tbody>
  </table>

  <h2>5. Chrome Claude Prompt Instructions</h2>
  <pre>Please open http://localhost:3000. Follow the test plan in this document.
Test each persona sequentially:
1. admin (admin123) - Superadmin Universal Access, Multi-Company Switcher, Two-Tier Nav, FBR Tax, Gratuity
2. sara.malik (hr123) - HR Director, e-DMS Vault, ATS Kanban, Final Leave Approval
3. usman.baig (mgr123) - Line Manager, Scoped Team Telemetry, Gate-1 Approvals, No Company Salaries
4. fatima.raza (emp123) - Self-Service, Punch Clock with chime, Leave Submission, Own Payslip Only
5. saad.ibrahim (emp123) - Onboarding Induction Vault & Policy Acknowledgment
6. junior.hr (hr123) - Restricted Junior HR with partial permissions (Read/Log only)
Verify that all navigation uses the persistent two-tier bar without dropdowns, and report pass/fail status.</pre>

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
