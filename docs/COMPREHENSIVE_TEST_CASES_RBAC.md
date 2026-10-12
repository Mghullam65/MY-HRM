# HRM Pro — Complete Application RBAC & QA Test Suite Specification

This master document contains end-to-end, comprehensive test cases covering the entire **HRM Pro** web application across all user personas, permission tiers, business modules, and statutory compliance workflows.

You can supply this specification directly to **Claude in Chrome** (or any QA automation tester / human tester) to systematically validate every feature, privilege, boundary, and negative test condition.

---

## 1. System Architecture & Access Endpoints

| Resource | URL / Connection | Description |
|---|---|---|
| **Primary Local Web Application** | [`http://localhost:3000`](http://localhost:3000) | Full SPA Frontend & Express Static Host |
| **REST API Base URL** | [`http://localhost:3000/api`](http://localhost:3000/api) | Core RESTful API root |
| **API Health Check Endpoint** | [`http://localhost:3000/api/health`](http://localhost:3000/api/health) | Uptime, system status, and backend health |
| **Real-Time WebSocket Stream** | `ws://localhost:3000/ws` | Live attendance, chat, and notification events |
| **Database Sync / SSE Stream** | [`http://localhost:3000/api/sync/stream`](http://localhost:3000/api/sync/stream) | Multi-tab and database synchronization engine |
| **Alternative CI / Test Port** | [`http://127.0.0.1:8099`](http://127.0.0.1:8099) | Embedded QA server for automated CI headless runs |

> **Backend Architecture Note:** The backend runs Node.js / Express with autonomous failover to in-memory/JSON store (`server/data/hrm_store.json`) and Supabase PostgreSQL cloud sync, guaranteeing 100% uptime even when local PostgreSQL is offline.

---

## 2. Seed User Personas & Credentials Matrix

All test personas are pre-seeded in the database and ready for instant testing:

| # | Username | Password | Role / Persona | Associated Employee Record | Department / Entity Scope | Authority Tier & Privileges |
|---|---|---|---|---|---|---|
| **1** | `admin` | `admin123` | `superadmin` | `EMP-001` (Ahmed Khan, CEO) | **Global Holdings** (All Companies & Branches) | **Universal Master Access:** Sovereign control over all 16 modules, multi-company switcher, payroll finalization, administrative security, and audit logs. |
| **2** | `sara.malik` | `hr123` | `hr_manager` | `EMP-002` (Sara Malik, HR Director) | **Apex Technologies** (Subsidiary Entity HR) | **Corporate HR Authority:** Full employee lifecycle, e-DMS records, candidate ATS pipeline, Tier-2 final leave approvals, corporate payroll generation. |
| **3** | `usman.baig` | `mgr123` | `dept_manager` | `EMP-003` (Usman Baig, Tech Lead) | **IT & Engineering Department** | **Team Line Management Scope:** Scoped team telemetry, Tier-1 manager leave endorsements, missing punch regularization, team performance appraisals. Forbidden from viewing company salaries. |
| **4** | `fatima.raza` | `emp123` | `employee` | `EMP-004` (Fatima Raza, Software Engineer) | **IT & Engineering Department** | **Strict Self-Service Only:** Biometric punch clock, apply for personal leaves, view own confidential payslips with FBR tax deductions, personal profile. Strict peer confidentiality. |
| **5** | `saad.ibrahim` | `emp123` | `onboarding` | `EMP-026` (Saad Ibrahim, Junior Associate) | **Corporate Induction Vault** | **New Joiner Onboarding Portal:** Upload induction documents (CNIC, Degrees, Bank IBAN), acknowledge company policy handbook. Administrative modules completely hidden. |
| **6** | `junior.hr` | `hr123` | `hr_manager` (Restricted) | `EMP-006` (Zain Ali, Junior HR Officer) | **HR Operations Desk** | **Partial Permissions Desk:** Read employee directory, log candidate notes, register attendance corrections. High-stakes actions (final salary authorization, system settings, employee deletion) revoked. |

---

## 3. UI Navigation Model (Two-Tier Persistent Header)

The application uses a modern **Two-Tier Persistent Navigation Architecture** designed for high productivity without obscuring dropdown menus:

- **Tier 1 (Top Bar):**
  - Brand Logo & Version Badge (`HRM Pro Enterprise`)
  - Global Search / Spotlight Command Palette (`Ctrl+K`)
  - Multi-Company Entity Switcher (Superadmin only)
  - Demo Persona Quick Switcher (`Admin`, `HR Director`, `Dept Manager`, `Employee`)
  - Dark Mode (`Obsidian`) / Light Mode (`Crisp`) Toggle
  - Notification Bell with unread counter
  - User Avatar & Profile Dropdown
- **Tier 2 (Main Category Pillars):**
  - `DASHBOARD`
  - `PEOPLE & TALENT`
  - `TIME & ATTENDANCE`
  - `FINANCE & PAYROLL`
  - `OPERATIONS & ADMIN`
- **Tier 3 (Persistent Sub-Navigation Bar):**
  - Clicking any pillar instantly renders flat, horizontal tabs underneath without hovering dropdowns.
  - Example: Clicking `PEOPLE & TALENT` renders:
    `Employees & e-DMS` | `Recruitment (ATS)` | `Performance & OKRs` | `My Profile & Onboarding`
  - Example: Clicking `TIME & ATTENDANCE` renders:
    `Attendance & Shifts` | `Leaves & Absence` | `Assets & Inventory`

---

## 4. Comprehensive Test Suites Across All Modules

---

### Test Suite 1: Authentication, Session Management & Persona Switcher

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **AUTH-01** | `admin` | Navigate to `http://localhost:3000/#login`. Enter `admin` / `admin123`. Click **Sign In**. | Login succeeds within 1 sec. Redirects to `#dashboard`. Topbar shows `Ahmed Khan (Superadmin)`. Session persisted in `localStorage` and `sessionStorage`. |
| **AUTH-02** | `sara.malik` | Navigate to login. Enter `sara.malik` / `hr123`. Click **Sign In**. | Login succeeds. Redirects to `#dashboard`. Topbar shows `Sara Malik` with badge `HR Manager`. |
| **AUTH-03** | `usman.baig` | Navigate to login. Enter `usman.baig` / `mgr123`. Click **Sign In**. | Login succeeds. Topbar shows `Usman Baig (Department Manager)`. Telemetry scopes to IT Department. |
| **AUTH-04** | `fatima.raza` | Navigate to login. Enter `fatima.raza` / `emp123`. Click **Sign In**. | Login succeeds. Redirects to `#dashboard`. Topbar shows `Fatima Raza (Employee)`. |
| **AUTH-05** | Any | Enter valid username with invalid password (e.g. `admin` / `wrongPass99`). | Login fails with error Toast: `"Invalid username or password."`. Password input is cleared. |
| **AUTH-06** | Inactive User | Attempt login with deactivated credentials (`inactive.user` / `Password123!`). | System rejects login with error: `"Account Inactive: Your employee profile has been deactivated."` |
| **AUTH-07** | Any Persona | Click Topbar User Avatar → Click **Sign Out**. | Session cleared immediately. Redirects to `#login`. Back button in browser cannot access authenticated pages. |
| **AUTH-08** | Any Persona | In Topbar, click the **Demo Persona Switcher** dropdown and choose a different persona. | Active session instantly switches to the selected persona without page reload, reloading UI with the corresponding role's permissions. |

---

### Test Suite 2: Executive Dashboard & Live Attendance Punch Clock

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **DASH-01** | `admin` | On `#dashboard`, inspect KPI Summary Cards (Total Employees, Present Today, On Leave, Monthly Payroll Expense). | All 4 metric cards display numeric counters with upward/downward percentage sparklines and zero `NaN` or `undefined` strings. |
| **DASH-02** | `fatima.raza` | In the **Biometric Punch Clock** widget, view live clock timer and click **Clock In**. | Live clock updates every second. Clicking **Clock In** plays subtle confirmation audio chime, records timestamp, and button toggles to glowing **Clock Out**. |
| **DASH-03** | `fatima.raza` | Click **Clock Out** in the punch clock widget. | Punch clock logs out-time, calculates shift duration, and displays success toast. |
| **DASH-04** | `admin` | Inspect the **Executive Action Inbox** widget on Dashboard. | Displays items awaiting approval (pending leave requests, expense claims, pending hires). Badge counts reflect live pending numbers. |
| **DASH-05** | Any | Inspect the **Corporate Headlines & Noticeboard** widget. | Shows active announcements (e.g., upcoming public holidays, quarterly town hall, policy revisions). |
| **DASH-06** | Any | Click the **Quick Action Floating / WhatsApp Help** button on bottom-right. | Opens quick support channel modal or initiates WhatsApp assistant without layout errors. |

---

### Test Suite 3: Workforce Directory & e-DMS Digital File Vault

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **EMP-01** | `sara.malik` (HR) | Click `PEOPLE & TALENT` → `Employees & e-DMS`. Inspect directory table. | Table displays list of all corporate employees with Avatar, ID, Full Name, Designation, Department, Status badge, and Action buttons. |
| **EMP-02** | `sara.malik` (HR) | Click **+ Add Employee** button. Fill form (Name, CNIC, Email, Department, Designation, Salary, Joining Date) and click **Save Employee**. | Form validates inputs. New employee is saved, added to table, and audit log records `ADD_EMPLOYEE`. |
| **EMP-03** | `sara.malik` (HR) | Click on `EMP-004 Fatima Raza` to open the **e-DMS Digital Profile Vault**. | Displays tabs: `Basic Info`, `Employment Details`, `Statutory & Tax (CNIC, NTN, EOBI)`, `Bank Details (IBAN)`, `Documents (CNIC copy, Degree, Contract)`. |
| **EMP-04** | `usman.baig` (Mgr) | Click `PEOPLE & TALENT` → `Employees & e-DMS`. | Employee list is filtered strictly to **IT & Engineering** department. Cannot view or edit employees from Finance, Marketing, or Operations. |
| **EMP-05** | `fatima.raza` (Emp) | Click `PEOPLE & TALENT` → `My Profile`. | Only Fatima's personal profile opens. Cannot view salary or CNIC of peers. Read-only fields cannot be tampered with. |
| **EMP-06** | `junior.hr` (Restricted) | Open employee directory. Click an employee record. | Can view profile data and documents. High-privilege actions like **Terminate Employee** or **Salary Edit** are hidden or disabled. |

---

### Test Suite 4: Time, Attendance, Biometric Gateway & Muster Roll

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **ATT-01** | `admin` / `sara.malik` | Click `TIME & ATTENDANCE` → `Attendance & Shifts`. View today's attendance roster. | Daily log displays check-in time, check-out time, working hours, punctuality status (`On Time`, `Late`, `Half Day`, `Absent`). |
| **ATT-02** | Any | Open **Biometric Terminal Simulator** tab. Select employee and click **Simulate Machine Punch**. | Simulates TCP/IP ZKTeco biometric machine event. Real-time log captures punch, pushes via WebSocket, and updates attendance grid. |
| **ATT-03** | `fatima.raza` (Emp) | In attendance tab, click **Request Attendance Regularization** (missing punch). Enter date, missed time, and reason (e.g. "Biometric machine power outage"). | Regularization request is submitted with status `Pending Manager Approval`. |
| **ATT-04** | `usman.baig` (Mgr) | Open `Attendance Regularization Approvals`. | Usman sees pending request from team member Fatima Raza. Can click **Endorse** or **Reject**. |
| **ATT-05** | `admin` / `sara.malik` | Navigate to **Monthly Statutory Muster Roll** tab. Select Month/Year. | Grid generates comprehensive 31-day matrix with `P` (Present), `A` (Absent), `L` (Leave), `H` (Holiday), total payable days, and export to CSV/Excel. |
| **ATT-06** | Any | Toggle **GPS Geofencing Restriction** simulation in Attendance Settings. | If user punch location is outside designated office coordinates, system flags punch as `"Remote / Geofence Warning"`. |
| **ATT-07** | `fatima.raza` (Emp) | Disconnect internet or toggle Offline Mode in DevTools. Click **Clock In**. | PWA Service Worker queues punch in `IndexedDB/Local Queue`. Upon reconnection, punch auto-synchronizes to server without data loss. |

---

### Test Suite 5: Leave Management & 2-Tier Approval Workflow

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **LEV-01** | `fatima.raza` (Emp) | Click `TIME & ATTENDANCE` → `Leaves & Absence`. Inspect quota balance cards. | Cards show annual quotas: `Annual Leave (14)`, `Casual Leave (10)`, `Sick Leave (8)` with Used, Available, and Pending counts. |
| **LEV-02** | `fatima.raza` (Emp) | Click **Apply Leave**. Select `Casual Leave`, Date Range (2 days), enter reason `"Family Event"`. Click **Submit Application**. | Validation ensures sufficient balance. Leave created with status `Pending Line Manager Endorsement`. Available balance decrements tentatively. |
| **LEV-03** | `usman.baig` (Mgr) | Log in as `usman.baig`. Go to `Leaves & Absence` → `Pending Approvals`. | Fatima's leave request appears in Usman's queue. Usman clicks **Endorse Request** with comment `"Approved from IT"`. Status updates to `Pending HR Final Approval`. |
| **LEV-04** | `sara.malik` (HR) | Log in as `sara.malik`. Go to `Leaves & Absence` → `Executive Approvals`. | Request appears with Manager endorsement note. Sara clicks **Final Approve**. Status becomes `Approved`. Email notification logged in audit trail. |
| **LEV-05** | `usman.baig` (Mgr) | Attempt to review or approve a leave application from `Finance` or `HR` department. | Cross-department leaves do NOT appear in Usman's inbox. Enforces strict departmental boundary isolation. |
| **LEV-06** | `admin` / `sara.malik` | Inspect **Leave Calendar & Team Heatmap** view. | Visual monthly calendar highlights team members on leave, preventing scheduling conflicts. |

---

### Test Suite 6: Finance, Payroll & Pakistani Statutory FBR Tax Engine

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **PAY-01** | `admin` / `sara.malik` | Click `FINANCE & PAYROLL` → `Payroll & Taxes`. Click **Generate Monthly Payroll Run** for current month. | System processes all active employees, computing Basic Pay, House Rent (45%), Medical Allowance (10%), Utilities (10%), Gross Salary. |
| **PAY-02** | `admin` | Inspect tax deduction calculation for an employee with PKR 150,000 monthly gross salary (PKR 1,800,000 annual). | FBR 2025-27 progressive salaried tax table calculates exact monthly withholding. Slabs above exemption limit (PKR 600,000) are applied incrementally. |
| **PAY-03** | `admin` | Inspect statutory deductions: **Provident Fund (PF 8.33%)** and **EOBI (PKR 350 / statutory rate)**. | Deductions match statutory formula. Net Salary = `Gross - FBR Tax - PF - EOBI - Unpaid Absences`. |
| **PAY-04** | `admin` / `sara.malik` | In Payroll screen, click **Generate Bank Disbursal File**. Select format (e.g. `HBL Bulk Payment`, `MCB Corporate`, `1Link CSV`). | System exports compliant CSV/Excel file with Account No, IBAN, Beneficiary Name, Net Amount, and batch checksum. |
| **PAY-05** | `fatima.raza` (Emp) | Log in as `fatima.raza`. Navigate to `FINANCE & PAYROLL` → `Payroll & Taxes`. | **Strict Isolation:** Fatima sees ONLY her own monthly payslips. **All other employees' salary figures are completely hidden**. |
| **PAY-06** | `fatima.raza` (Emp) | Click **Download PDF Payslip** next to Fatima's payslip. | Generates printable payslip voucher with corporate branding, salary breakdown, FBR tax deductions, and net disbursed amount. |
| **PAY-07** | `usman.baig` (Mgr) | Log in as `usman.baig`. Navigate to `FINANCE & PAYROLL`. | Usman cannot see executive salaries of peers or department heads. Payroll generation buttons are restricted. |

---

### Test Suite 7: Statutory Gratuity Final Settlement (30/26 Formula)

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **SET-01** | `admin` / `sara.malik` | Click `FINANCE & PAYROLL` → `Final Settlement`. Click **Initiate Employee Exit Clearance**. | Opens settlement wizard: Select resigned/retiring employee, Exit Date, Notice Period Served, and Reason for Exit. |
| **SET-02** | `admin` / `sara.malik` | Inspect the **Statutory Gratuity Calculation** card. | Automatically calculates gratuity using Pakistani statutory labor formula: `(Last Gross Salary ÷ 26 × 30) × Qualifying Service Years`. |
| **SET-03** | `admin` / `sara.malik` | Verify the **3-Gate Departmental Clearance Workflow**: Gate 1: IT Asset Return, Gate 2: Admin Handover, Gate 3: Finance Clearance. | Each gate can be marked cleared by authorized role with remarks. Final settlement cannot be signed off until all 3 gates pass. |
| **SET-04** | `admin` / `sara.malik` | Inspect unavailed leave encashment and notice period adjustment. | Leave balance encashment adds to gross clearance voucher; unserved notice period is deducted proportionately. |
| **SET-05** | `admin` | Click **Generate Final Settlement Voucher (PDF/Print)**. | Outputs formal clearance letter and settlement voucher with itemized gratuity, encashment, deductions, and authorized signatory blocks. |

---

### Test Suite 8: Multi-Company Model A Scoping (Holding & Subsidiaries)

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **CMP-01** | `admin` (Superadmin) | In Topbar, click Company Switcher dropdown. Switch from `Apex Group (All Holdings)` to `Apex FinTech Ltd`. | Entire UI scopes instantly to `Apex FinTech Ltd`. Employee roster, payroll numbers, and dashboard metrics reload to reflect only this subsidiary. |
| **CMP-02** | `admin` (Superadmin) | Click `OPERATIONS & ADMIN` → `Company Entities`. | Superadmin can create new subsidiaries, edit NTN/Tax IDs, define branch locations, and assign subsidiary HR managers. |
| **CMP-03** | `sara.malik` (HR) | Check Company Switcher in Topbar. | Sara is locked to her assigned company entity (`Apex Technologies`). She cannot tamper with or view records of sister subsidiary `Apex Logistics`. |
| **CMP-04** | `admin` (Superadmin) | Switch back to `Apex Group (All Holdings)`. | System aggregates cross-subsidiary enterprise telemetry, showing global headcount and consolidated payroll expenditure. |

---

### Test Suite 9: Recruitment ATS & Kanban Candidate Pipeline

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **REC-01** | `sara.malik` (HR) | Click `PEOPLE & TALENT` → `Recruitment (ATS)`. Inspect Job Openings and Candidate Kanban Board. | Kanban displays hiring workflow columns: `Screening`, `Shortlisted`, `Technical Interview`, `HR Interview`, `Job Offer`, `Hired`. |
| **REC-02** | `sara.malik` (HR) | Click **+ Post Job Opening**. Fill title (e.g. `Senior React Engineer`), Department, Vacancies, Salary Range, and click **Publish**. | Requisition is created and appears in recruitment dashboard. |
| **REC-03** | `sara.malik` (HR) | Drag a candidate card from `Screening` to `Technical Interview`. | Candidate stage updates smoothly via drag-and-drop or status selector. Modal prompts to schedule interview with Department Manager (`usman.baig`). |
| **REC-04** | `sara.malik` (HR) | On candidate in `Job Offer` column, click **Generate Offer Letter**. | System auto-generates branded offer letter with proposed CTC, joining date, and designation. |
| **REC-05** | `sara.malik` (HR) | Click **Mark Candidate Hired & Convert to Employee**. | Automatically provisions a new employee profile in e-DMS directory and generates onboarding checklist. |

---

### Test Suite 10: Performance Management, OKRs & 360 Appraisals

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **PRF-01** | `usman.baig` (Mgr) | Click `PEOPLE & TALENT` → `Performance & OKRs`. Inspect Team Goals. | Usman sees assigned KPIs/OKRs for his IT department team members (e.g. Code Quality, Sprint Velocity, Uptime). |
| **PRF-02** | `usman.baig` (Mgr) | Click on `Fatima Raza` → **Conduct Manager Appraisal Review**. Enter ratings (1-5) across competencies and submit feedback. | Review is saved. Score aggregates weighted average. Status updates to `Completed`. |
| **PRF-03** | `fatima.raza` (Emp) | Log in as `fatima.raza`. Navigate to `Performance & OKRs`. | Fatima sees her own assigned goals and manager appraisal remarks. Cannot view performance ratings of peer engineers. |
| **PRF-04** | `admin` / `sara.malik` | Navigate to **Annual Promotion & Increment Simulator**. | Calculates performance-linked salary revisions and generates increment letters. |

---

### Test Suite 11: Company Assets & Inventory Lifecycle

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **AST-01** | `admin` / `sara.malik` | Click `TIME & ATTENDANCE` → `Assets & Inventory`. Inspect inventory list. | Displays company assets (Laptops, Monitors, Phones, Ergonomic Chairs) with Asset Tag, Serial, Status (`Available`, `Assigned`, `Under Repair`). |
| **AST-02** | `sara.malik` (HR) | Click **Assign Asset**. Select asset `ASSET-001 (Dell Laptop)` and assign to `EMP-004 Fatima Raza`. | Asset status changes to `Assigned`. Assignment agreement logged with date and condition (`Good`). |
| **AST-03** | `fatima.raza` (Emp) | Log in as `fatima.raza`. Check `My Profile` → `Assigned Assets`. | Dell Laptop appears in Fatima's personal custody list with asset code and serial number. |
| **AST-04** | `sara.malik` (HR) | Initiate asset return or condition assessment. | Asset returned to inventory, condition recorded, and clearance gate updated in exit settlement if retiring. |

---

### Test Suite 12: Expense Claims & Travel Reimbursements

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **EXP-01** | `fatima.raza` (Emp) | Click `FINANCE & PAYROLL` → `Expense Claims`. Click **+ Submit Expense Claim**. | Form opens. Enter Category (`Travel / Fuel`), Amount (`PKR 4,500`), Date, attach receipt, click **Submit**. |
| **EXP-02** | `fatima.raza` (Emp) | Inspect personal claims history table. | Claim displays with status `Pending Manager Endorsement`. |
| **EXP-03** | `usman.baig` (Mgr) | Log in as `usman.baig`. Navigate to `Expense Claims` → `Team Approvals`. | Fatima's PKR 4,500 claim appears with receipt preview. Usman clicks **Endorse Claim**. |
| **EXP-04** | `admin` / `sara.malik` | Finalize claim in Finance queue and approve for payroll disbursement. | Claim approved. Reimbursement amount automatically queues into Fatima's upcoming monthly payroll slip. |

---

### Test Suite 13: Helpdesk Ticketing, Live Chat & Gemini HR Co-Pilot

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **HLP-01** | `fatima.raza` (Emp) | Click `OPERATIONS & ADMIN` → `Helpdesk & Support`. Click **Create Ticket**. | Submit ticket with Category (`IT Support / VPN Access`), Priority (`High`), Description. Ticket created with tracking ID (e.g. `TICK-101`). |
| **HLP-02** | `admin` / `usman.baig` | Open Helpdesk dashboard. View open tickets. Assign `TICK-101` to technician. Update status to `Resolved`. | Ticket status updates live. Employee receives notification. |
| **HLP-03** | Any Persona | Open the floating **Enterprise Live Chat** widget on bottom-right. Send message to colleague. | Real-time message transmits via WebSocket, timestamped, stored securely in audit history. |
| **HLP-04** | Any Persona | Open the **HR AI Co-Pilot (Gemini Assistant)** modal. Ask: *"What is the statutory gratuity formula in Pakistan?"* | Gemini model (`gemini-3.5-flash-lite` or fast fallback) answers accurately: Explains `(Last Gross / 26 * 30) * Years of service` with clear formatting and zero errors. |
| **HLP-05** | Any Persona | Click the floating **WhatsApp Quick Connect** launcher. | Launches pre-configured WhatsApp chat link with HR desk helpline. |

---

### Test Suite 14: Headcount Telemetry, Analytics & Custom Reports

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **REP-01** | `admin` / `sara.malik` | Click `OPERATIONS & ADMIN` → `Reports & Analytics`. | Dashboard renders interactive Chart.js visualizations: Department Headcount, Gender Diversity, Monthly Attrition, Attendance Trends. |
| **REP-02** | `admin` / `sara.malik` | Select **FBR Annual Tax Schedule Report**. Click **Generate Report**. | Generates detailed annual tax deduction ledger with employee CNIC, gross taxable earnings, and progressive tax deducted. |
| **REP-03** | `admin` / `sara.malik` | Select **Attendance Muster Summary** and export to CSV. | Clean CSV file downloads with zero corrupted bytes or character encoding issues. |
| **REP-04** | `usman.baig` (Mgr) | Navigate to `Reports & Analytics`. | Usman can only generate reports pertaining to his own team members (e.g. Team Attendance, Team Leave Consumption). |

---

### Test Suite 15: Administration, RBAC Role Matrix & Audit Trail

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **ADM-01** | `admin` (Superadmin) | Click `OPERATIONS & ADMIN` → `Administration`. | Full administration suite opens: `User Accounts`, `Role & Permissions Matrix`, `Departments`, `Branches`, `Designations`, `Security Audit Logs`. |
| **ADM-02** | `admin` (Superadmin) | Open **User Accounts** tab. Inspect user list. Click **Reset Password** on a demo user. | Password resets securely. Audit log records action with admin timestamp and IP. |
| **ADM-03** | `admin` (Superadmin) | Open **Role & Permissions Matrix**. Inspect privilege toggles across modules (`View`, `Create`, `Edit`, `Delete`, `Approve`). | Toggles accurately represent permissions defined in system architecture. |
| **ADM-04** | `admin` (Superadmin) | Open **Security Audit Logs** tab. Search for recent actions (`LOGIN`, `PAYROLL_RUN`, `LEAVE_APPROVE`). | Displays chronological immutable audit trail with User, Action, Entity, Details, and Timestamp. |
| **ADM-05** | `sara.malik` / `usman.baig` | Attempt to navigate to `#administration` or edit master system roles. | Access is strictly restricted. Sensitive administrative settings remain accessible only to Superadmin. |

---

### Test Suite 16: System Settings, Themes, Density & PWA Offline Queue

| Test ID | Persona / Role | Test Action / Steps | Expected Result |
|---|---|---|---|
| **SET-01** | Any Persona | In Topbar or Settings, toggle between **Obsidian Dark Mode** and **Crisp Light Mode**. | Whole UI transitions instantly with high-contrast text and zero styling breakage. Theme choice persists across browser reloads via `localStorage`. |
| **SET-02** | Any Persona | In Settings or Table Headers, toggle **Table Density** (`High-Density Compact` vs `Comfortable`). | Tables instantly toggle row padding without page refresh, catering to accounting and HR heavy data workflows. |
| **SET-03** | Any Persona | Press keyboard shortcut `Ctrl+K` (or `Cmd+K` on Mac). | **Spotlight Global Search & Command Palette** modal opens. Typing route name (e.g. "Payroll") navigates directly. Chords `G+D` (Dashboard), `G+E` (Employees), `G+P` (Payroll) function reliably. |
| **SET-04** | Any Persona | Click **Interactive Guided Tour** button. | Step-by-step interactive walkthrough highlights navigation pillars, punch clock, action inbox, and profile settings with tooltip cards. |
| **SET-05** | Any Persona | Inspect Service Worker registration (`sw.js`). | PWA service worker is registered and active, caching static assets and enabling offline attendance punch queuing. |

---

## 5. Security & Boundary Negative Tests

| Test ID | Persona Tested | Unauthorized / Malicious Attempt | Expected Secure Behavior |
|---|---|---|---|
| **SEC-01** | `fatima.raza` (Emp) | Direct URL manipulation: typing `http://localhost:3000/#administration` into address bar. | System blocks navigation, shows access denied toast, and redirects safely back to `#dashboard` or `#profile`. |
| **SEC-02** | `fatima.raza` (Emp) | Inspecting DOM or Console: attempting to read `DB.get('users')` or other employee salaries. | Passwords and hashes are completely sanitized from runtime objects. Cross-employee salary records are inaccessible. |
| **SEC-03** | `usman.baig` (Mgr) | Attempting to endorse a leave or edit records of an employee outside the IT department. | Action strictly blocked: Non-department employees do not appear in manager queues, API rejects cross-department edits. |
| **SEC-04** | `saad.ibrahim` (Onboarding) | Attempting to access Payroll, ATS, or Attendance Management modules. | Blocked: Onboarding persona is restricted strictly to induction document vault and handbook acknowledgment. |
| **SEC-05** | Any Persona | Rapid clicking across top navigation pillars (`People & Talent`, `Time & Attendance`, `Finance & Payroll`). | Instant clean tab transition. **Zero overlapping dropdowns**, zero CSS overflow or memory leaks. |
| **SEC-06** | Any Persona | XSS Injection attempt in chat or leave remarks (e.g. `<script>alert('xss')</script>`). | Input is sanitized via `Utils.escapeHtml()` and defensive regex before DOM insertion. Script does not execute. |
| **SEC-07** | Inactive User | Attempting to invoke authenticated API requests with a revoked or inactive JWT session. | API returns `401 Unauthorized` / `403 Forbidden` and purges client session storage. |
| **SEC-08** | Any Persona | Browser zoom testing at 100%, 125%, 150%, and mobile viewport (375px width). | Layout reflows seamlessly: Topbar collapses to mobile hamburger, bottom navigation dock activates, zero horizontal page breaking. |

---

## 6. Chrome Claude Step-by-Step Prompt & Execution Guide

When handing this test plan to **Claude in Chrome** (or your automated browser testing assistant), copy and paste the prompt below:

```text
Please open http://localhost:3000. You are performing a formal Quality Assurance and RBAC Audit of HRM Pro using the test plan in COMPREHENSIVE_TEST_CASES_RBAC.md.

Execute the test suites sequentially across all 6 seed users:

1. Superadmin: admin / admin123
   - Verify login, topbar role, KPI sparklines, and Two-Tier Navigation (Pillars -> Persistent Sub-nav tabs, no dropdowns).
   - Test Multi-Company Switcher (switch to Apex FinTech and back to All Holdings).
   - Verify FBR Salaried Tax calculation in Payroll and 30/26 Gratuity Settlement.
   - Verify full access to Administration and Security Audit Logs.

2. HR Director: sara.malik / hr123
   - Verify corporate HR dashboard and e-DMS digital employee files.
   - Test Recruitment ATS Kanban board candidate stage transitions.
   - Verify Tier-2 final leave approvals.

3. Department Manager: usman.baig / mgr123
   - Verify scoping: Usman must ONLY see employees in the IT & Engineering department.
   - Verify Tier-1 manager leave endorsement for Fatima Raza.
   - Verify that company salaries and system administration settings are restricted.

4. Regular Employee: fatima.raza / emp123
   - Verify Self-Service Dashboard, Punch Clock Live Timer (Clock In / Clock Out with audio chime).
   - Submit a 2-day Casual Leave request.
   - Verify Fatima can ONLY view her own payslips and cannot view any peer salaries.
   - Test negative security: try navigating to #administration directly and confirm it gets blocked.

5. Onboarding Joiner: saad.ibrahim / emp123
   - Verify candidate induction vault and document upload checklist.
   - Confirm all operational and financial modules are hidden.

6. Junior Restricted HR: junior.hr / hr123
   - Verify read/log access to employee directory.
   - Confirm high-stakes actions (final salary authorization, system settings) are disabled.

7. General UI & Responsiveness:
   - Toggle Obsidian Dark Mode <-> Crisp Light Mode.
   - Test Spotlight Command Palette (Ctrl+K).
   - Verify mobile bottom navigation dock at narrow viewport.

Provide a structured report with:
- Summary of Passed / Failed test cases
- Any UX, RBAC, or layout defects observed
- Overall system health rating
```

---

*HRM Pro Enterprise • System Quality Assurance & RBAC Audit Specification • Generated for Automated & Manual QA Testing*
