# HRM Pro — Comprehensive RBAC & User Privileges Test Plan

This document contains complete, end-to-end test cases for **HRM Pro**. You can supply this document directly to Claude (or any automated testing agent/QA tester) in Chrome to execute structured quality assurance across all user personas, permission tiers, and statutory business workflows.

---

## 1. Environment & Application Access

- **Local Application URL:** [`http://localhost:3000`](http://localhost:3000)
- **Fallback / CI Port (if applicable):** [`http://127.0.0.1:8099`](http://127.0.0.1:8099)
- **Repository:** `https://github.com/Mghullam65/MY-HRM.git`
- **Architecture:** Pure Web Application (HTML5 / Vanilla CSS Design Tokens / ES6 Modular JavaScript / Express Local Server / LocalStore DB)

---

## 2. Seed User Personas & Credentials Matrix

| # | Username | Password | Role / Persona | Employee Record | Company Scope | Scope Tier |
|---|---|---|---|---|---|---|
| **1** | `admin` | `admin123` | `superadmin` | EMP-001 (Ahmed Khan, CEO) | All Holdings (Global) | **Universal Master Access** |
| **2** | `sara.malik` | `hr123` | `hr_manager` | EMP-002 (Sara Malik, HR Head) | Entity-Specific / Group HR | **Full Corporate HR Authority** |
| **3** | `usman.baig` | `mgr123` | `dept_manager` | EMP-003 (Usman Baig, Tech Lead) | IT & Engineering Dept | **Team & Line Manager Scope** |
| **4** | `fatima.raza` | `emp123` | `employee` | EMP-004 (Fatima Raza, Software Eng) | IT & Engineering Dept | **Self-Service Only (Strict)** |
| **5** | `saad.ibrahim` | `emp123` | `onboarding` | EMP-026 (Saad Ibrahim, New Hire) | Corporate Induction | **New Joiner Onboarding Vault** |
| **6** | `junior.hr` | `hr123` | `hr_manager` (Restricted) | EMP-006 (Zain Ali, Junior HR) | Restricted HR Desk | **Partial Permissions (Read/Apply Only)** |

---

## 3. Navigation Architecture (Two-Tier Layout)

When testing any persona, verify the **Two-Tier Persistent Navigation Bar**:
1. **Tier 1 (Top Bar):** Brand Logo, Search (`Ctrl+K`), Persona Switcher, Dark/Light Mode toggle, Notification Bell, User Avatar menu.
2. **Tier 2 (Main Category Row):**
   - `DASHBOARD`
   - `PEOPLE & TALENT`
   - `TIME & ATTENDANCE`
   - `FINANCE & PAYROLL`
   - `OPERATIONS & ADMIN`
3. **Tier 3 (Persistent Sub-Navigation Bar):**
   - When a pillar is clicked, a persistent secondary bar appears underneath showing that pillar's sub-categories side-by-side as flat clickable tabs (e.g., clicking **People & Talent** shows `Employees & e-DMS | Recruitment (ATS) | Performance & OKRs | My Profile`).
   - Clicking between pillars instantly swaps the sub-nav tabs.
   - **Important:** No hover or popup dropdown menus should obscure the view.

---

## 4. Test Suites by Persona

---

### Test Suite 1: Super Administrator (`admin` / `admin123`)
**Objective:** Verify sovereign access to all 16 modules, multi-company switching, payroll calculation, master system configuration, and audit trails.

#### Test Cases:
- **TC-SA-01: Sovereign Login & Dashboard Telemetry**
  - **Action:** Navigate to `http://localhost:3000`, log in with `admin` / `admin123`.
  - **Expected:** Login succeeds immediately. User lands on Dashboard. Topbar indicates `Ahmed Khan (Superadmin)`. Executive Action Inbox displays pending leaves, claims, and approvals.
- **TC-SA-02: Multi-Company Global Entity Switcher**
  - **Action:** In the top bar, click the Company Switcher dropdown (e.g. `Apex Group (All Entities)`). Select subsidiary (e.g. `Apex FinTech Ltd` or `Apex Logistics`).
  - **Expected:** Workforce telemetry, employee count, and records reload to reflect the selected corporate subsidiary. Switching back to `All Entities` aggregates group-level numbers.
- **TC-SA-03: Two-Tier Navigation Verification**
  - **Action:** Click `PEOPLE & TALENT`.
  - **Expected:** Persistent secondary row appears with `Employees & e-DMS`, `Recruitment (ATS)`, `Performance & OKRs`, `My Profile & Onboarding`. Clicking `TIME & ATTENDANCE` updates secondary row to `Attendance & Shifts`, `Leaves & Absence`, `Assets & Inventory`.
- **TC-SA-04: Full Access to Administration & System Settings**
  - **Action:** Click `OPERATIONS & ADMIN` → `Administration`.
  - **Expected:** Access allowed. User can inspect User Roles, RBAC permissions, Security Audit Logs, and Global Configuration.
- **TC-SA-05: Pakistani Statutory Payroll & 30/26 Gratuity Settlement**
  - **Action:** Navigate to `FINANCE & PAYROLL` → `Payroll & Taxes`. Click on an employee pay voucher or generate a run. Then navigate to `Final Settlement`.
  - **Expected:** Progressive FBR tax brackets (0% to 35%) calculate accurately. Gratuity settlement formula `(Last Gross Salary ÷ 26 × 30) × Years of Service` renders breakdown with clearance gates.

---

### Test Suite 2: HR Manager (`sara.malik` / `hr123`)
**Objective:** Verify corporate HR oversight, employee lifecycle management, candidate hiring, leave approvals, and payroll processing while respecting corporate role boundaries.

#### Test Cases:
- **TC-HR-01: HR Authentication & Dashboard**
  - **Action:** Log in with `sara.malik` / `hr123`.
  - **Expected:** User avatar displays `Sara Malik` with role `HR Manager`. Dashboard focuses on HR action items: pending onboarding documents, probation expiries, leave requests awaiting HR sign-off.
- **TC-HR-02: Employee Master Records & e-DMS**
  - **Action:** Click `PEOPLE & TALENT` → `Employees & e-DMS`.
  - **Expected:** Full directory of active employees is visible. Click `Add Employee` modal opens properly. Click on any employee (e.g., `EMP-004 Fatima Raza`) to inspect e-DMS digital file, CNIC, NTN, banking details, and documents.
- **TC-HR-03: Final Gate Leave & Expense Approval**
  - **Action:** Go to `TIME & ATTENDANCE` → `Leaves & Absence` → `Leave Requests`.
  - **Expected:** Review a leave request endorsed by a Department Manager. Sara can click `Final Approve` or `Reject` with remarks.
- **TC-HR-04: Recruitment ATS Pipeline**
  - **Action:** Go to `PEOPLE & TALENT` → `Recruitment (ATS)`.
  - **Expected:** Kanban board displays job requisitions (Screening, Interview, Offer, Hired). Sara can drag candidate stages, schedule interviews, and issue offer letters.
- **TC-HR-05: Administrative Boundaries Check**
  - **Action:** Attempt to access restricted system super-admin settings.
  - **Expected:** System limits role to assigned company and HR management operations.

---

### Test Suite 3: Department Manager (`usman.baig` / `mgr123`)
**Objective:** Verify line management scoping. The manager can approve team requests and manage team attendance, but CANNOT see company-wide salaries or sensitive files of other departments.

#### Test Cases:
- **TC-DM-01: Manager Login & Team Telemetry Scope**
  - **Action:** Log in with `usman.baig` / `mgr123`.
  - **Expected:** Usman Baig lands on Dashboard. Telemetry widgets show metrics strictly for the **IT & Engineering** department (e.g. 8 team members).
- **TC-DM-02: Scoped Employee Roster**
  - **Action:** Click `PEOPLE & TALENT` → `Employees & e-DMS`.
  - **Expected:** Employee list is filtered strictly to reporting team members (e.g. `Fatima Raza`, `Tariq Hussain`). Cannot edit or view non-team members' files.
- **TC-DM-03: Gate-1 Team Leave Approval**
  - **Action:** Go to `TIME & ATTENDANCE` → `Leaves & Absence`.
  - **Expected:** Pending leave requests from direct reports appear with `Manager Endorse` or `Reject`.
- **TC-DM-04: Attendance Corrections & Shift Rosters**
  - **Action:** Go to `TIME & ATTENDANCE` → `Attendance & Shifts`.
  - **Expected:** Team shift schedule is viewable. Can review missing punch regularizations from team members and approve them.
- **TC-DM-05: Security Boundary (No Executive Payroll / Company Admin)**
  - **Action:** Check navigation bar.
  - **Expected:** `Administration` module is either hidden or access to master system audit logs is restricted. Cannot view executive salaries of other department heads.

---

### Test Suite 4: Regular Employee Self-Service (`fatima.raza` / `emp123`)
**Objective:** Verify strict Self-Service isolation. Employee can ONLY see and manage their own attendance, leaves, profile, and payslips.

#### Test Cases:
- **TC-EMP-01: Self-Service Authentication**
  - **Action:** Log in with `fatima.raza` / `emp123`.
  - **Expected:** Logged in as `Fatima Raza` (`Employee`). Dashboard shows personal widgets: Today's Punch status, Leave Balance (Casual, Sick, Annual), upcoming holidays, and announcements.
- **TC-EMP-02: Self Clock-In / Clock-Out**
  - **Action:** On Dashboard or `TIME & ATTENDANCE` → `Attendance & Shifts`.
  - **Expected:** Click `Clock In` button. System records timestamp with geolocation/IP status. Clock In button updates to `Clock Out`.
- **TC-EMP-03: Submit Leave Application**
  - **Action:** Go to `TIME & ATTENDANCE` → `Leaves & Absence` → `Apply Leave`.
  - **Expected:** Form opens with Fatima's remaining balances. Select Leave Type (e.g. `Casual Leave`, 2 days), enter reason, and click `Submit`. Request appears as `Pending Manager Endorsement`.
- **TC-EMP-04: View Own Payslips Only**
  - **Action:** Go to `FINANCE & PAYROLL` → `Payroll & Taxes`.
  - **Expected:** Only Fatima's own monthly payslips appear. Can click `Download PDF Payslip` with FBR tax deductions. **Must NOT show any other employee's salary**.
- **TC-EMP-05: RBAC Lockdown Verification**
  - **Action:** Try to manually navigate to `#administration` or `#companies` via URL hash.
  - **Expected:** Access denied. System automatically redirects safely back to Dashboard or My Profile with an unauthorized permission warning.

---

### Test Suite 5: Onboarding Candidate (`saad.ibrahim` / `emp123`)
**Objective:** Verify onboarding-only portal restrictions for new recruits.

#### Test Cases:
- **TC-ONB-01: Onboarding Login**
  - **Action:** Log in with `saad.ibrahim` / `emp123`.
  - **Expected:** Lands on Onboarding Induction Portal. Welcome banner displays `Saad Ibrahim`.
- **TC-ONB-02: Document Submission Vault**
  - **Action:** Inspect the Onboarding Checklist (CNIC copy, Educational Degrees, Bank Details).
  - **Expected:** Candidate can upload pending verification documents and acknowledge employee handbook policies.
- **TC-ONB-03: Boundary Enforcement**
  - **Action:** Check navigation bar.
  - **Expected:** Operational modules (Payroll processing, ATS recruitment pipelines, company admin) are hidden.

---

### Test Suite 6: Junior Restricted HR (`junior.hr` / `hr123`)
**Objective:** Verify partial permissions where basic HR viewing/entry is allowed, but high-stakes actions (final approvals, salary adjustments) are revoked.

#### Test Cases:
- **TC-JHR-01: Junior HR Login**
  - **Action:** Log in with `junior.hr` / `hr123`.
  - **Expected:** Logged in as `Zain Ali (Restricted HR)`.
- **TC-JHR-02: Read-Only / Partial Action Validation**
  - **Action:** Navigate to `Employees` or `Leaves`.
  - **Expected:** Can view employee records and log data. However, high-level approval buttons (`Authorize Payroll`, `Delete Employee`, `System Reset`) are disabled or hidden.

---

## 5. Security & Boundary Negative Tests

| Test ID | Persona Used | Malicious / Unauthorized Attempt | Expected Safe Behavior |
|---|---|---|---|
| **SEC-01** | `fatima.raza` | URL jump to `#administration` | Blocked: Redirects to safe module, Toast warning shown |
| **SEC-02** | `fatima.raza` | Call `DB.get('users')` or inspect other salaries | Password hashes/secrets masked, cross-tenant data isolated |
| **SEC-03** | `usman.baig` | Attempt to approve an employee outside IT dept | Blocked: Request not in queue, action prohibited |
| **SEC-04** | Any Persona | Rapid clicking on top-tier navigation pillars | Clean instant subnav transition; **zero dropdown overlapping** |
| **SEC-05** | Any Persona | Switch Theme (Dark ↔ Light) and Table Density | Persisted in `localStorage`, clean contrast in both modes |

---

## 6. How to Instruct Chrome Claude

When giving this file to Claude in Chrome, use this prompt:

> *"Please open http://localhost:3000. Follow the test document `COMPREHENSIVE_TEST_CASES_RBAC.md`. Test each persona in order (admin, sara.malik, usman.baig, fatima.raza, saad.ibrahim, junior.hr), verify their login, verify the two-tier persistent navigation (Row 1 pillars, Row 2 sub-items, no dropdowns), and verify that their permission boundaries and module access work as defined."*
