# 🕒 HRM Pro — Complete Project Timeline & Technology Evolution

> **Project Repository**: [https://github.com/Mghullam65/MY-HRM](https://github.com/Mghullam65/MY-HRM)  
> **Guiding Principle**: 100% Free & Open-Source. Zero license costs, zero cloud subscriptions.  
> **Last Updated**: 2026-09-07  

---

## 📌 Executive Summary

**HRM Pro** is a modern, enterprise-ready Human Resource Management System built to handle the entire employee lifecycle — from recruitment and onboarding to daily attendance, leave approvals, payroll generation, and performance appraisals. It is designed to work seamlessly in dual modes: **locally** on an office network or laptop with a single-file SQLite database, and **in the cloud** on Vercel with a 100% free serverless PostgreSQL database (Vercel Postgres / Neon).

---

## 🗓️ Detailed Chronological Development Timeline

```
[Step 1] Initial Inspection & Architecture Audit
   └── Validated 12 core frontend modules, vanilla CSS design system & mock data layer.
[Step 2] Version Control & GitHub Repository Setup
   └── Git repo initialized on 'main', README.md created, pushed to Mghullam65/MY-HRM.
[Step 3] Full-Stack Database Architecture Planning
   └── Decided on 100% free stack: Node.js, Express, Prisma ORM, SQLite & PostgreSQL.
[Step 4] Runtime Installation
   └── Installed Node.js LTS (v24.19.0) and npm (v11.17.0) via Windows Package Manager.
[Step 5] Backend Server & Relational Schema Scaffolding
   └── Built Express server, Prisma schema with 11 relational models & seed engine.
[Step 6] REST API Client & Local Verification
   └── Created js/api.js with JWT auth and verified endpoints on http://localhost:5000.
[Step 7] Vercel Serverless & Cloud Postgres Integration
   └── Connected Vercel Postgres, built api/index.js serverless function & vercel.json.
[Step 8] Modern Bright Theme & Login Experience Redesign
   └── Redesigned login screen to clean SaaS aesthetic, bright default theme & theme toggle.
[Step 9] Profile Sidebar Accordion, Reporting Hierarchy, Multi-Tier Approvals & Scoping
   └── Exact 5-section / 28-button profile accordion, 3-tier hierarchy, 4-member manager scoping & PSE appraisals.
```

---

### Step 1: Workspace & Architecture Audit
- **Objective**: Inspect the existing codebase, file layout, and verify module integrity.
- **Technologies**: Vanilla HTML5, Vanilla CSS3 (Custom properties & dark/light theme), Vanilla JavaScript (ES6+), Chart.js 4.4.1, Font Awesome 6.5.1.
- **Key Actions**:
  - Validated 17 global modules (`DB`, `Auth`, `App`, `Dashboard`, `Employees`, `Attendance`, `Leaves`, `Payroll`, `Performance`, `Recruitment`, `Events`, `Reports`, `Administration`, `Settings`, `Toast`, `Modal`, `Utils`).
  - Confirmed script loading hierarchy in `index.html`.
  - Audited the client-side mock data store in `js/data.js`.

---

### Step 2: Version Control & GitHub Connection
- **Objective**: Establish git version control and connect to the user's remote GitHub repository.
- **Technologies**: Git 2.55.0, GitHub HTTPS REST/Git Protocol.
- **Key Actions**:
  - Initialized git repository on branch `main`.
  - Configured project `.gitignore` to prevent committing sensitive environment variables, OS files, and `node_modules`.
  - Authored a comprehensive, professional `README.md` with demo credentials and feature tables.
  - Configured GitHub Personal Access Token authentication for seamless automated pushes.
  - Committed initial 16 project files (`19,003` insertions) and pushed to [Mghullam65/MY-HRM](https://github.com/Mghullam65/MY-HRM).

---

### Step 3: Zero-Cost Database & Backend Strategy
- **Objective**: Plan an enterprise-grade backend with zero financial constraints (no paid hosting, no paid database subscriptions).
- **Decisions**:
  - **Framework**: Node.js with Express.js (unified JavaScript language across stack).
  - **Database**: SQLite for local self-hosted zero-config development + PostgreSQL for cloud production.
  - **ORM**: Prisma ORM for type safety, relational foreign keys, and automated database migrations.
  - **Authentication**: Stateless JSON Web Tokens (JWT) + salted password hashing using `bcryptjs`.
  - Created [`PROJECT_PLAN.md`](PROJECT_PLAN.md) to log all architectural decisions and roadmaps.

---

### Step 4: Development Environment Setup
- **Objective**: Provide required execution runtimes on the developer machine.
- **Technologies**: Windows Package Manager (`winget.exe`).
- **Key Actions**:
  - Automated installation of **Node.js LTS (`v24.19.0`)** and **npm (`11.17.0`)**.
  - Verified Node and NPM executables in PowerShell.

---

### Step 5: Backend Server & Relational Database Scaffolding
- **Objective**: Build the backend API server and data modeling layer.
- **Technologies**: Express.js 4.21, Prisma ORM 6.4, Bcrypt.js 2.4, JSONWebToken 9.0, Helmet 8.0, Cors 2.8.
- **Key Actions**:
  - Created `server/package.json` and configured scripts (`start`, `dev`, `seed`, `prisma:migrate`).
  - Authored `server/prisma/schema.prisma` defining 11 interconnected relational models:
    1. `User` (Credentials, role, status, last login timestamp)
    2. `Employee` (Demographics, job details, salary, bank account, emergency contacts)
    3. `Department` (Codes, budgets, department heads)
    4. `Designation` (Job titles, levels, salary brackets)
    5. `Branch` (Offices in Karachi, Lahore, Islamabad)
    6. `Shift` (Morning, Evening, Night, Flexible with grace periods)
    7. `Attendance` (Check-in/out timestamps, late minutes, overtime calculations)
    8. `LeaveType` & `LeaveBalance` & `LeaveRequest` (Approval state machines)
    9. `Payroll` (Gross pay, tax deductions, medical/conveyance allowances, net pay)
    10. `PerformanceReview` & `JobPosting` & `Candidate`
    11. `AuditLog` (Tamper-evident system activity logging)
  - Created modular database seed engine (`server/prisma/seed-fn.js`) to prepopulate departments, designations, branches, shifts, leave types, and demo accounts.
  - Built Express REST API server (`server/src/server.js`) with security middleware (`helmet`, `cors`).

---

### Step 6: REST API Client & Local Verification
- **Objective**: Connect frontend UI to backend REST API with offline resilience.
- **Technologies**: Fetch API, LocalStorage/SessionStorage token persistence.
- **Key Actions**:
  - Created `js/api.js` client wrapper supporting automatic JWT header injection and standardized error handling.
  - Updated `js/auth.js` to synchronize JWT tokens upon login while maintaining instant offline fallback.
  - Included `js/api.js` in `index.html`.
  - Launched Express daemon on `http://localhost:5000`.
  - Tested health check (`GET /api/health`), authentication (`POST /api/auth/login`), and employee queries (`GET /api/employees`).

---

### Step 7: Cloud Database & Vercel Integration
- **Objective**: Deploy application to Vercel with shared cloud database access.
- **Technologies**: Vercel Serverless Functions, Vercel Postgres (Neon Serverless PostgreSQL).
- **Key Actions**:
  - Connected Vercel Postgres database to project `my-hrm`.
  - Switched `schema.prisma` to `provider = "postgresql"` using official Vercel variables (`POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`).
  - Created `api/index.js` as the serverless API handler for Vercel.
  - Authored `scripts/build.js` for safe cross-platform Prisma generation and database schema synchronization.
  - Configured `vercel.json` with `"outputDirectory": "."` to serve static root assets alongside serverless functions.
  - Added auto-seed trigger so freshly provisioned cloud databases populate on first launch.

---

### Step 8: Modern Bright Theme & Login Screen Redesign
- **Objective**: Improve the login interface aesthetics, eliminate dark empty void spaces, set a modern bright theme by default, and provide seamless one-click theme switching.
- **Technologies**: Vanilla CSS3 (ambient radial gradients, micro-dot grid pattern, soft shadows, responsive cards), ES6+ DOM logic.
- **Key Actions**:
  - Replaced the dark background on `#login-page` with a clean, ambient workspace background featuring subtle gradients and a micro-dot matrix.
  - Rebuilt the login card into a modern SaaS card with clean borders (`#e2e8f0`), soft shadows, and light inputs.
  - Added a floating light/dark theme switch button on the login screen (`#login-theme-btn`) connected to `App.toggleTheme()`.
  - Added 4 quick demo role access pills (`Super Admin`, `HR Manager`, `Dept Manager`, `Employee`) with role icons and subtle hover elevation.
  - Maintained full dark mode compatibility with tailored `[data-theme="dark"]` overrides.

---

### Step 9: Employee Profile Sidebar Accordion, 3-Tier Hierarchy, Multi-Tier Approvals & Scoping
- **Objective**: Match all 5 accordion sections and 28 sub-buttons shown across user screenshots, enforce a strict 3-tier reporting hierarchy, scope the Deputy Manager's login strictly to their 4 direct team members, and implement multi-tier leave/attendance approvals and manager-driven performance evaluations.
- **Technologies**: Vanilla HTML5, Vanilla CSS3 (Accordion UI, active indicator borders, badge counters), Vanilla JavaScript ES6+, LocalStorage data sync.
- **Key Actions**:
  - **Employee Profile Left Sidebar Accordion (Screenshots 1–5)**:
    - Designed exact replica of reference design: Square photo avatar thumbnail with border, employee full name in vibrant cyan/blue (`#0284c7`), and `EMP ID: <number>` underneath.
    - Implemented all 5 collapsible accordions with toggle indicators (`[+]` / `[-]`) and all **28 sub-buttons** with blue chevron bullets (`▸`):
      1. **Personal**: `Personal Details`, `Contact Details`, `Emergency Contacts`, `Dependants`, `Photograph`.
      2. **Employment**: `Joining Info`, `Ending Info`, `Lunch Subscription`, `Employment Status`, `Official Contacts`, `Office Timings`, `Report-to`, `MIS Info`, `Login Info`, `Bank Accounts`, `Tax Info`, `Insurance Details`.
      3. **Qualification**: `Personal Documents`, `Work Experience`, `Education`, `Skills`, `Working Technologies`, `Languages`.
      4. **Performance Review**: `Performance Review`, `Employee Review Comments`, `PSE evaluation form`, `Next Year Targets`.
      5. **Attendance**: `Attendance Correction / Work From Home`.
    - Fully implemented interactive management modals and cards for all 28 sub-buttons (e.g. toggle lunch subscription, add technologies, add languages, edit PSE form, apply for attendance corrections, and reassign managers).
  - **Strict 3-Tier Reporting Line ("Report-to")**:
    - **HR Manager (Sara Malik)** reports directly to **Super Admin / CEO (Ahmed Khan)**.
    - **Deputy Manager (Usman Baig)** reports to both **Admin** and **HR**.
    - **Employees** report directly to **Deputy Manager** (Level 1 Direct Supervisor), with escalation to **HR** (Level 2) and **Admin** (Level 3).
    - **Super Admin (Ahmed Khan)** displays Apex Leadership, reporting directly to the Board of Directors with direct links to his key executive reports.
    - **Role-Tailored Hierarchy Cards**: The profile `Report-to` view dynamically adapts depending on who is viewed (Admin apex overview, HR direct report to Admin, Deputy Manager dual superiors + 4 team members grid, and Employees 3-tier chain).
    - **Add & Edit Form Integration**: Added explicit `Report-to (Reporting Manager)` dropdown selector to the Add Employee and Edit Employee modals, allowing dynamic assignment of reporting managers.
    - **Directory & Table Visibility**: Each employee's row in the table explicitly shows a `Report-to: <name>` tag for quick organization-wide clarity.
  - **Deputy Manager Scoped Team Visibility (4 Employees Only)**:
    - Deputy Manager Usman Baig (`dept_manager`) is assigned exactly 4 team members: **Fatima Raza (EMP-004)**, **Tariq Hussain (EMP-009)**, **Sehar Nawaz (EMP-025)**, and **Omar Farhan (EMP-013)**.
    - When Usman Baig logs in, all modules strictly scope to these 4 employees:
      - **Employees Module**: Directory, active employees, and search only display his 4 team members.
      - **Attendance Module**: Daily, monthly matrix, employee-wise, department-wise, and machine logs only display his 4 team members.
      - **Leaves Module**: Summary stats, leave request tables, calendar staff pool, and quota balances only show his 4 team members.
      - **Performance Module**: Only displays reviews for his 4 team members.
      - **Dashboard Module**: Headcount, active employee cards, present/absent counters, and leave/review summaries scope to 4 team members.
      - **Admin & HR**: Retain unrestricted universal access across all employees company-wide.
  - **Multi-Tier Hierarchical Approvals**:
    - **Tier 1 (Reporting Manager Approval)**: When an employee submits a Leave request or Attendance Correction / WFH request, their Direct Reporting Manager (Deputy Manager) reviews and endorses it (`status: 'manager_approved'`).
    - **Tier 2 (Final Executive Approval)**: HR and Admin possess universal authority to grant final corporate approval (`status: 'approved'`), which automatically synchronizes to attendance timesheets and deducts paid leave quotas.
  - **Performance Review Appraisal Workflow**:
    - Performance reviews are initiated by **Admin** or **HR Manager** (`status: 'pending'`), designating the employee's direct reporting manager as the evaluator.
    - The direct reporting manager (Deputy Manager) evaluates their reportees using the **PSE (Performance Standard Evaluation) Form**, grading across 5 core dimensions (Job Knowledge, Work Quality, Teamwork, Punctuality, Leadership), submitting qualitative comments and next year targets.
    - Upon submission (`status: 'completed'`), the ratings, feedback, and targets automatically synchronize live to the employee's profile sidebar accordion.

---

## 💻 Technology Stack Matrix

| Layer | Technology | Purpose | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Vanilla HTML5 & ES6+ JavaScript | Fast, zero-dependency SPA shell | **$0** |
| **Styling & Design** | Vanilla CSS3 Custom Properties | Modern dark/light glassmorphic UI | **$0** |
| **Data Visualization** | Chart.js 4.4.1 | Interactive headcount, attendance & payroll charts | **$0** |
| **Icons & Typography** | Font Awesome 6.5.1, Inter Font | Professional typography & iconography | **$0** |
| **Backend API** | Node.js + Express.js | JSON REST API with route controllers | **$0** |
| **Serverless Runtime** | Vercel Serverless Functions | Hosts `/api/*` endpoints globally | **$0** |
| **Database (Cloud)** | Vercel Postgres (Neon) | Cloud PostgreSQL with connection pooling | **$0** |
| **Database (Local)** | SQLite (`hrm.db`) | Local self-contained file database | **$0** |
| **ORM & Migrations** | Prisma ORM | Relational modeling & automated migrations | **$0** |
| **Security & Auth** | JSON Web Tokens (JWT) + Bcrypt | Encrypted sessions & salted password hashing | **$0** |
| **Hosting & CI/CD** | Vercel + GitHub Actions | Automated Git deployments upon `git push` | **$0** |

---

## 📦 System Modules & Capabilities

1. **Dashboard & Analytics**: Real-time KPI statistics, headcount distribution, attendance trends, quick punch widget.
2. **Employee Lifecycle & OrgChart**: Directory, complete profile views, interactive hierarchical OrgChart with search & zoom, document expiry compliance tracker, exit clearance & F&F settlement calculator, and automated HR letters generator (Experience, Relieving, Salary, Confirmation).
3. **Attendance & Timesheets**: Daily clock in/out, late arrival tracking with 11:00 AM window cutoff, overtime calculation, monthly calendar, and direct 1-click bridge to payroll.
4. **Leave Management**: Leave quotas (Annual, Sick, Casual, Maternity, LOP), application workflow with multi-tier approval.
5. **Payroll, Taxation & Banking (Finance Act 2024–2026)**:
   - Progressive FBR Income Tax Engine with live simulator and Section 149 Withholding Tax Certificates.
   - 1-Click Attendance-to-Payroll Bridge (auto-calculates LOP, late check-in penalties, and overtime).
   - Corporate Bank Advice file generator (HBL, MCB, UBL, Meezan, ABL) with printable executive authority letters.
   - Statutory compliance ledgers (EOBI, SESSI/PESSI, and Gratuity Liability Reserve Pool).
   - Payslip generator with PDF print and CSV export support.
6. **Performance & OKRs**: Objectives, KPIs, self-evaluations, supervisor appraisals, and performance ratings.
7. **Recruitment & ATS**: Job vacancy postings, applicant pipeline stages (Screening, Interview, Offer, Hired) with 1-click candidate-to-employee onboarding.
8. **Company Noticeboard & Events**: Corporate events calendar, public holidays, official broadcasts.
9. **Administration & RBAC**: Branches, departments, designations, shifts, user accounts, and audit log viewer.
10. **System Settings**: Localization, currency, company branding, dark/light theme toggle, JSON backup & restore.
11. **Assets & Equipment Lifecycle**: Enterprise hardware tracking, valuation, check-out/check-in audits, warranty tracking, custody history, digital handover signing, and printable equipment undertaking certificates.
12. **Expense Claims & Travel Reimbursements**: Multi-category claims, digital tax invoice receipt viewer, manager endorsement and finance final authorization, and 1-click direct bridge to payroll payout.
13. **Employee Helpdesk & Grievance Redressal**: Multi-department support ticketing, live resolution workspace, SLA timers, and confidential anti-harassment / whistleblower redressal conforming to workplace protection acts with cryptographic anonymity tokens.
14. **Digital ID Badges, Corporate Policies & Executive Action Center**: Photorealistic CR-80 PVC printable employee smart badges with vector QR tokens, formal Corporate Policy Repository with employee digital signatures, and unified Executive Priority Action Inbox on the main Dashboard.

---

## 🔮 Future Roadmap & Changelog

*This section automatically tracks upcoming features, company customizations, and improvements:*

- [x] **Interactive Organizational Chart (OrgChart)**: Dynamic tree visualization with search, zoom, and direct profile navigation *(Completed in Batch 1)*.
- [x] **Document Expiry & Compliance Tracker**: Alerts for CNIC, Passports, Driving Licenses, and Visas with renewal wizard *(Completed in Batch 1)*.
- [x] **Exit Clearance & Full & Final (F&F) Settlement Engine**: 4-Department clearance checklist and automated financial settlement statement *(Completed in Batch 1)*.
- [x] **Automated HR Letters Engine**: Experience, Relieving, Salary Certificate for Visa/Loans, and Confirmation with print-ready letterhead *(Completed in Batch 1)*.
- [x] **1-Click ATS Onboarding**: Direct conversion from applicant pipeline to employee record *(Completed in Batch 1)*.
- [x] **Pakistani FBR Income Tax Engine (Finance Act 2024–2026)**: 6 Progressive slabs, tax simulator, and Section 149 Tax Certificates *(Completed in Batch 2)*.
- [x] **Direct Attendance-to-Payroll Bridge**: 1-click sync importing LOP deductions, late check-in penalties, and approved overtime *(Completed in Batch 2)*.
- [x] **Corporate Bank Advice File Generator**: Multi-bank bulk payout export (HBL, MCB, UBL, Meezan, ABL) and official Bank Authority Letter *(Completed in Batch 2)*.
- [x] **Statutory Benefit Ledgers**: EOBI, SESSI/PESSI, and Gratuity Defined Benefit Liability Pool *(Completed in Batch 2)*.
- [x] **Batch 3: Time, Attendance & Field Operations**: Multi-shift roster calendar, automated rotational schedule generator, peer-to-peer shift swaps, GPS geo-fencing (Haversine perimeter verification), corporate IP whitelisting, and ZKTeco biometric machine log parser *(Completed in Batch 3)*.
- [x] **Batch 4: Talent, LMS & Performance Management**: 360-degree multi-rater peer reviews & competency radar, Corporate LMS & Training Center with skill gap matrix & CPD credits, and 9-box talent matrix with executive succession planning *(Completed in Batch 4)*.
- [x] **Batch 5: Employee Engagement & Culture**: Company asset inventory lifecycle, expense & travel requisition reimbursement, internal helpdesk / grievance redressal ticketing *(Completed in Batch 5)*.
- [x] **Batch 6: ESS Smart Badges, Policy Hub & Executive Action Center**: Photorealistic digital smart ID badges with vector QR codes, corporate policies repository with digital signature audit, and unified Dashboard Executive Action Center Inbox *(Completed in Batch 6)*.
- [x] **Batch 7: Executive BI Analytics, Custom Report Builder, Dependents & Life Events**: Interactive Executive BI Analytics deck, dynamic multi-entity Custom Report Builder with live column selection, aggregation math, Excel UTF-8 BOM CSV export and 3-tier signing executive PDF reports, 6 pre-configured standard compliance statements, Employee Family Dependents & Beneficiary Matrix with TPA health cards & gratuity share audit, and Employee Life Events Self-Service Portal with HR verification workflow *(Completed in Batch 7)*.
- [x] **Batch 8: Immutable Security Audit Vault, Webhooks & Corporate Communication Templates**: Tamper-evident cryptographic SHA-256 verification hash ledger for all lifecycle events, forensic audit inspector modal, CSV export, and printable legal forensic audit transcript; real-time HTTP Webhooks Gateway with HMAC signatures, Slack Incoming Webhooks, MS Teams Adaptive Cards, SAP ERP accounting sync, and test dispatch simulator; Corporate Multi-Channel Notification Templates with live HTML preview and dynamic token interpolation (`{{employee_name}}`, `{{net_salary}}`, `{{leave_type}}`, etc.) *(Completed in Batch 8)*.

---

*File automatically maintained and synchronized with the repository.*

