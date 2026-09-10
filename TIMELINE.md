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
- [x] **Batch 9: Headcount Requisitions, Candidate Scorecards, Project Timesheets & e-DMS Document Vault**: Departmental headcount requisition and budget approval lifecycle with 1-click active job conversion; Candidate 5-dimension weighted rubric scorecard evaluator (Technical, Problem Solving, Communication, Culture Fit, Leadership) with recommendation badges; Project timesheets engine with daily logging, billable utilization telemetry, and direct payroll overtime bridge (>40h); Enterprise Employee Document Management System (e-DMS) with categorized legal contract repository, attestation audit stamps, and encrypted document preview *(Completed in Batch 9)*.
- [x] **Employee Notification Routing, HR Letter Acknowledgment & Document Re-Upload Self-Service**: Role-based separation of concerns preventing employees from generating/issuing HR letters; dedicated employee-scoped letters portal with 1-click formal receipt acknowledgment dispatching audit notice to HR; scoped document expiry tracker with self-service renewed copy re-upload, auto-archival into e-DMS vault with pending verification status, and smart notification dismissal *(Completed)*.
- [x] **Real-Time Live Notifications Engine**: Cross-tab synchronization via `BroadcastChannel`, Web Audio API synthesized melodic 2-tone chimes (587.33 Hz $\to$ 880 Hz), animated topbar bell ringing (`@keyframes bellRing`), floating glassmorphism live alert cards with 7s auto-dismiss progress timer, 1-click native desktop/OS push notifications, and serverless backend REST & 4s polling gateway (`/api/notifications`) on Vercel *(Completed)*.
- [x] **Phase 1: Enterprise 103-Model Architecture Expansion (Legal Compliance, Profile Normalization & CPD Training)**: 
  - **Prisma Schema & Backend**: Added 14 new relational models (`DisciplinaryType`, `DisciplinaryAction`, `WarningLetter`, `Suspension`, `TerminationRecord`, `Education`, `WorkExperience`, `EmergencyContact`, `Skill`, `Certificate`, `TrainingSession`, `TrainingAttendee`, `TrainingCertificate`, `TrainingFeedback`) and 12 relation fields on `Employee`.
  - **Discipline & Compliance Module**: Dual-perspective workflow with scoped employee portal for review and electronic sign-off of official warnings, and HR Management suite with formal inquiry logging (`DIS-2026-xxx`), hearings scheduling, official corporate letterhead warnings generator (`WRN/2026/xxx`), print layout, and targeted live notifications.
  - **Normalized Personnel Dossier**: Upgraded profile tabs (`Academic Qualifications & Degrees`, `Professional Certifications`, `Work History & Experience`, `Multi-Contact Emergency Registry with Primary Designation`, and `Categorized Skills Matrix with Proficiency Ratings`) backed by normalized data layer with fallback compatibility.
  - **Corporate LMS & CPD Certification**: Training catalog scheduling (`TRN-2026-xxx`), employee enrollment workflow, and cryptographic SHA-256 verified CPD completion certificates with print-ready certificate layout *(Completed)*.
- [x] **Phase 2: Enterprise Architecture Expansion (Dynamic RBAC, Business Travel Operations & Compensation Architecture)**:
  - **Prisma Schema & Backend (17 Models)**:
    - **Governance & Dynamic RBAC (6 Models)**: `Role`, `SystemModule`, `Permission`, `RolePermission`, `UserRole`, `UserPermission`.
    - **Travel & Expense Operations (6 Models)**: `TravelRequest`, `TravelExpense`, `TravelApproval`, `ExpenseCategory`, `ExpenseClaim`, `ExpenseSettlement`.
    - **Compensation & Salary Structure (5 Models)**: `SalaryStructure`, `SalaryComponent`, `EmployeeSalary`, `SalarySlipItem`, `SalaryReview`.
  - **Dynamic Roles & Permissions Matrix UI (`js/settings.js`)**: Real-time permission grid mapping roles against 11 modules and 6 granular actions (View, Create, Edit, Delete, Approve, Export); custom role creator with template inheritance; dynamic `Auth.can(permission)` query engine with instant local storage persistence.
  - **Business Travel & Per-Diem Engine (`js/expenses.js`)**: Dedicated travel requisitions subtab; itinerary logging with origin/destination, dates, flight/rail/road travel modes, estimated budget, and cash advance requests; manager approval workflow; official printable **Travel Authorization & Per-Diem Order (TA/DA Order)** letterhead.
  - **Salary Structures & Grade Scales (`js/payroll.js`)**: Standardized grade packages (Executive E-1, Senior Tech S-3, Associate G-2) with visual component allocation bars; interactive salary breakdown simulator calculating exact Basic, HRA, Medical, Conveyance, PF, EOBI, and FBR tax deductions; employee scale assignment with live employee record synchronization *(Completed)*.

- [x] **Phase 3: Enterprise Architecture Expansion (Multi-Entity Geo & Business Hierarchy, Exit Lifecycle, Corporate Asset Inventory, and Communication & Security Telemetry)**:
  - **Prisma Schema & Backend (23 Models, Total Reaching 73 Models)**:
    - **Multi-Entity & Geo Hierarchy (7 Models)**: `Organization`, `BusinessUnit`, `Division`, `Country`, `State`, `City`, `Location`.
    - **Exit Lifecycle & Offboarding Clearance (5 Models)**: `ExitReason`, `Resignation`, `ExitInterview`, `Clearance`, `FinalSettlement`.
    - **Corporate Asset Inventory & Lifecycle (6 Models)**: `AssetCategory`, `AssetStatus`, `Asset`, `AssetAssignment`, `AssetMaintenance`, `AssetLog`.
    - **Communication Telemetry & Security Forensics (5 Models)**: `Notification`, `EmailLog`, `SMSLog`, `ActivityLog`, `ApiToken`.
  - **Enterprise Business Units & Divisions Administration (`js/administration.js`)**: Real-time management interface for enterprise holding entity (`Apex Global Enterprises`), business units (`BU-DSEP`, `BU-CAFS`, `BU-SSHC`), operating divisions (`DIV-CIA`, `DIV-PEFA`, etc.), and organizational department mappings with CRUD modals.
  - **Geo & Country Hierarchy (`js/administration.js`)**: Multi-national operational jurisdiction hierarchy (Countries, Provinces/States, Metropolitans, Physical Campuses/Facilities) with full interactive CRUD and relationship traversal.
  - **Security & API Token Governance (`js/settings.js`)**: Cryptographic API bearer token generation (`tok_live_...`), permission scope configuration, validity tracking, one-click revocation and reactivation; live multi-channel transactional email & SMS delivery logs; immutable forensic activity audit trail with client IP and user agent tracking.
  - **Backward-Compatible Data Seeding (`js/data.js`)**: Full normalization across all 23 Phase 3 collections with zero data regression. *(Completed)*

- [x] **Phase 4: Full 100% Completion of 103-Model Enterprise HRM Architecture Blueprint**:
  - **Prisma Schema & Backend (30 Final Models, Reaching Exactly 103 Models)**:
    - **Recruitment Pipeline & Hiring Governance (8 Models)**: `RecruitmentStage`, `JobApplication`, `Interview`, `InterviewFeedback`, `OfferLetter`, `TalentPool`, `ReferenceCheck`, `Onboarding`.
    - **Performance Appraisal Cycles & Goals (6 Models)**: `PerformanceCycle`, `PerformanceCriteria`, `PerformanceGoal`, `PerformanceScore`, `Appraisal`, `AppraisalHistory`.
    - **Attendance Rostering & Shift Management (5 Models)**: `AttendanceLog`, `AttendanceCorrection`, `Roster`, `LeaveReason`, `LeavePolicy`.
    - **Profile Masters, Dependants & DMS Vault (5 Models)**: `EducationType`, `Institute`, `Degree`, `Dependant`, `EmployeeDocument`.
    - **Governance, Modules & Compensation Masters (6 Models)**: `SubModule`, `LoginHistory`, `TrainingCategory`, `SalaryReviewRemark`, `Allowance`, `Deduction`.
  - **Recruitment Pipeline & Interview Rubrics (`js/performance.js`)**:
    - Multi-round interview scheduler with panel assignments, online video / in-person mode flags, and scheduling dates.
    - Evaluator rubric scorecard modal (`interview_feedbacks`) scoring candidates across technical depth, problem-solving, and culture fit with hiring recommendations.
    - Strategic talent sourcing pools (`talent_pools`) and candidate professional reference verification registry (`reference_checks`).
    - New hire onboarding tracker (`onboardings`) with step-by-step interactive task checklists, progress bar, and buddy assignment.
  - **Performance Appraisal Cycles, OKRs & Rubrics (`js/performance.js`)**:
    - Performance appraisal cycle manager (`performance_cycles`) with quarterly, semi-annual, and annual review types.
    - Weighted evaluation criteria rubrics (`performance_criteria`) with category tags and max score definitions.
    - Strategic individual & department OKRs (`performance_goals`) with real-time target metrics and progress bars.
    - Appraisal submissions and merit outcomes viewer (`appraisals`, `performance_scores`) tracking salary increment and role elevation recommendations.
  - **Profile & Governance Masters Administration (`js/administration.js`)**:
    - Centralized 4-group master control center for education types, recognized universities/institutes, degrees, leave entitlement policies, leave application reason justifications, recurring allowances, statutory deductions, sub-module system nodes, and user session login audit telemetry.
  - **Automated Verification Suite (`scratch/test-phase4-architecture.js`)**:
    - Exact 103-model validation via Prisma CLI.
    - All 30 Phase 4 client collections initialized and seeded with 100% backward compatibility.
    - Full regression suites (Phases 1, 2, 3, 4, Employee Letters, Live Notifications) executed with 100% pass rate. *(Completed)*

- [x] **Interactive 103-Model Enterprise Blueprint Explorer & Telemetry Control Center (`js/administration.js`, `js/app.js`)**:
  - **15 Functional Domains Grid**: Complete visual architecture matching the enterprise blueprint (`User & Account`, `Organization Management`, `Attendance & Scheduling`, `Time & Leave Management`, `Payroll & Compensation`, `Employee Profile & Dossier`, `Performance & OKRs`, `Recruitment & ATS`, `Training & LMS`, `Asset Management`, `Discipline & Compliance`, `Travel & Expense Operations`, `Exit Lifecycle & Clearances`, `Communication & Alerts`, `System & Security Forensics`).
  - **Central Model Relationship Hub**: Interactive visualization of the central `Employee` model and its relational edges (`hasMany`, `belongsTo`, `hasOne`) across all sub-systems.
  - **Dependency Filtering & Real-time Search**: Multi-tier dependency filters (Core Hubs, High Operational Links, Medium Transactions, Low Masters) and dynamic instant search across domains, model names, schema attributes, and descriptions.
  - **Model Inspector Modal**: Deep-dive inspector displaying schema fields, key attributes, dependency level, domain mapping, and live preview of seeded database records.
  - **100% Enterprise System Health Check**: Real-time diagnostic telemetry verifying all 103 models and reporting live synchronized database record counts.
  - **Global Topbar Telemetry Pill**: Direct access button with live badge in top navigation bar (`103 Models`) linking directly to the Blueprint Explorer *(Completed)*.

- [x] **Compact & Collapsible Executive Approvals Inbox UI Optimization (`js/dashboard.js`)**:
  - Reduced oversized vertical footprint from ~500px down to ~40px (collapsed) and ~220px (expanded), saving up to 440px of dashboard screen height.
  - Implemented 1-click **Minimize / Expand** accordion toggle with persistent user state in `localStorage` (`hrm_inbox_collapsed`).
  - Added category filter pills (`All`, `Leaves`, `Finance`, `Urgent SLA`, `Life Events`, `Compliance`) for instant domain-specific triage.
  - Redesigned action items into single-line dense executive rows with `max-height: 175px` smooth scrollable container, maintaining 100% test compatibility and immediate operational usability *(Completed)*.

- [x] **Role Hierarchy, Centralized Data Scoping Engine, Dedicated Employee Self-Service Portal & Backend IDOR Protection**:
  - **Universal Role Hierarchy (`js/auth.js`)**:
    - **Super Admin (`superadmin`)**: Universal `ALL` scope across all 103 models, all employees, attendance, leaves, payroll, reports, system settings.
    - **HR Manager (`hr_manager`)**: Universal `ALL` scope across all employee records, attendance, leaves, payroll, reports, and approvals.
    - **Deputy Manager (`dept_manager`)**: Strict `TEAM` scope restricted to self + direct and recursive indirect reportees (Usman Baig + Fatima Raza, Tariq Hussain, Sehar Nawaz, Omar Farhan). Full segregation preventing visibility of out-of-team employees, attendance, leaves, payroll, charts, or approvals.
    - **Employee (`employee`)**: Strict `SELF` scope. Full access to personal profile, attendance, leaves, payroll slips, documents, and reports; completely isolated from organization-wide data, 103-model blueprint, management charts, and approval workflows.
    - **New Joiner (`onboarding`)**: Restricted `SELF` scope with induction checklist and document upload stage.
  - **Centralized Data Scoping Engine (`js/auth.js`)**:
    - Defined `Auth.SCOPES = { SELF: 'SELF', TEAM: 'TEAM', ALL: 'ALL', NONE: 'NONE' }`.
    - Implemented `Auth.getScope(module)`, `Auth.getTeamEmployeeIds(managerEmpId, allEmployees)`, and `Auth.getScopedEmployees(allEmployees)`.
    - Integrated across all frontend modules: `js/attendance.js`, `js/leaves.js`, `js/performance.js`, `js/employees.js`, `js/payroll.js`, `js/reports.js`.
  - **Dedicated Employee Self-Service Dashboard (`js/dashboard.js`)**:
    - Dedicated portal for `employee` / `onboarding`: Welcome hero, Today's Punch Widget with quick clock in/out, My Attendance, My Leave, My Payroll slip, My Performance, Personal Quick Actions, Colleague Birthdays, Holidays.
    - Completely hides 103 Model, Employee Overview KPIs, Org charts, Add Employee, Process Payroll, and Executive Approvals Inbox.
  - **Headlines Ticker Speed Control (`js/dashboard.js`, `css/main.css`)**:
    - Speed toggle button (`1x` / `0.5x`) persisted in `localStorage`.
    - Default `1x` (45s cycle) and relaxed `0.5x` (90s cycle) across all dashboards.
  - **Backend API Authorization & IDOR Protection (`server/src/middleware/auth.js`, `routes/`)**:
    - Added `getScopedEmployeeIds(user)` and `assertEmployeeAccess(req, res, targetEmployeeId)`.
    - Enforced strict IDOR protection (`403 Forbidden: Access Denied`) on employee details, payslips, attendance, leave requests, and reports across all REST API endpoints.
    - Gated `103 Model` structure endpoint (`GET /admin/structure`) strictly to `superadmin` and `hr_manager`.
  - **Automated Verification Suites**:
    - Frontend suite (`scratch/test-role-hierarchy-dashboard.js`): 55 / 55 tests passed (100%).
    - Backend API IDOR suite (`scratch/test-api-idor-protection.js`): 14 / 14 tests passed (100%).
    - 103-Model Blueprint Explorer regression (`scratch/test-blueprint-explorer.js`): 100% passed *(Completed)*.

- [x] **Employee Attendance Permissions Hardening & "My Attendance" Dropdown Filter Architecture (`js/attendance.js`)**:
  - **Permission Hardening & Tab Segregation**:
    - Restricted regular employee login (`employee` and `onboarding`) from seeing or accessing administrative attendance views: `Monthly` (company-wide grid), `Employee Wise`, `Department Wise`, `Daily` (all-company listing), `Geo-Fence & IP Check`, `Biometric Sync & ZKTeco`, and `Manual Entry`.
    - Gated `Attendance.switchView(view)` with `403 Forbidden` checks, preventing unauthorized tab transitions and redirecting employees automatically to `my_attendance`.
    - Blocked administrative action buttons (`Time-In Windows`, `Bulk Mark`, `Audit Center`, `Edit Windows`, manual log creation, manual deletion) with 403 authorization rejections.
    - Gated direct log editing (`editRecord()`): redirects employees to submit a formal correction request via `showApplyCorrectionModal()` with locked user identity.
    - Scoped `Corrections & WFH` view: employees can only view their own requests and are blocked from seeing `Manager Approve`, `Final Approve`, or `Reject` buttons.
  - **Dedicated "My Attendance" Self-Service Portal**:
    - Implemented a dedicated personal attendance view named **"My Attendance"** with personal monthly attendance stat cards (Present, Late, Half Day, Absent, Overtime, Punctuality Score).
    - Replaced multi-column grids with a unified **Dropdown Menu Filter** (`#my-att-period-select`) supporting:
      1. **📅 Daily (Single Date)**: Detailed day punch dossier with clock-in/out timestamps, verification source/device terminal, duration logged, shift cutoff check, and 1-click live Clock-In/Clock-Out punch buttons.
      2. **📆 Weekly (7-Day View)**: 7-day rotational breakdown with week navigation controls (`prevWeek`, `nextWeek`, `thisWeek`).
      3. **🗓️ Monthly (Full Month)**: Complete calendar month log with month picker and navigation controls.
      4. **🔍 Custom Dates Range**: Customizable date range filter (`from` to `to`) with instant apply.
    - Integrated secondary filter controls: status filter pills (`All Records`, `Present`, `Late`, `Half Day`, `Absent`), real-time search input, and personal CSV export (`exportMyAttendance()`).
  - **Automated Verification Suite (`scratch/test-employee-attendance-permissions.js`)**:
    - Executed 31-test end-to-end verification suite covering tab visibility, switchView 403 access control, action gating, dropdown menu period filtering (Daily, Weekly, Monthly, Custom), correction request locking, and deputy manager/admin privilege tiers.
    - 31 / 31 tests passed (100% pass rate) with zero regressions across existing role hierarchy, IDOR, and blueprint explorer suites *(Completed)*.

- [x] **Leave Quota & Balance Multi-Group Table Architecture & Status Filter Bar (`js/leaves.js`, `js/data.js`)**:
  - **Exact 20-Column Multi-Group Table Architecture**:
    - Replaced basic quota list with the exact 20-column grouped table structure matching the enterprise specification:
      - **Leading Base Columns (3)**: `Sr.#`, `Employee ID`, and `Employee`.
      - **Leave In Quota (4)**: `Annual`, `Sick/Casual`, `Compensation`, and `Total`.
      - **Availed Leave (7)**: `Annual`, `Sick/Casual`, `Compensation`, `Half Leave`, `Short Leave`, `Salary` (Loss of Pay / deduction), and `Total`.
      - **Remaining Leaves (4)**: `Sick/Casual`, `Compensation`, `Annual`, and `Total`.
      - **Other Leave (2)**: `Un Paid Leave` and `Token Leave`.
    - **Header & Cell Styling**: Applied light sky blue header styling (`#e0f2fe` background, `#0369a1` text, `#bae6fd` border) with subtle group header contrasts matching reference screenshots.
    - **Grand Total Footer (`<tfoot>`)**: Calculates and renders sum totals across all 17 leave metric columns for all displayed staff.
  - **Interactive Sorting & Filter Sub-Bar**:
    - **Interactive Sorting**: Clicking any column header triggers dynamic ascending/descending sorting (`▲` / `▼`) on all columns.
    - **STATUS Filter Pills (Matching Image 1)**: Quick triage pills (`All Records`, `Full Quota Available`, `Low Balance (< 10d)`, `Exhausted (0d)`, `Has Availed Leaves`).
    - **Department & Search Filters**: Department dropdown filter and instant client-side name/empNo search bar.
    - **Comprehensive CSV Export (`exportQuotaMatrixCSV()`)**: 22-column CSV export containing complete quota, availed, remaining, and other leave records.
  - **Role-Based Experience**:
    - **Employees**: View their personal 20-column breakdown matrix alongside high-level KPI cards and per-type breakdowns (view-only).
    - **Managers & Admins**: Full multi-employee matrix with allocation and adjustment modal triggers.
  - **Automated Verification Suite (`scratch/test-leave-quota-table.js`)**:
    - 15 / 15 tests passed (100%) covering leave catalog, metric calculations, 20 columns, status filters, sorting, CSV export, and role scoping *(Completed)*.

- [x] **Attendance Break In/Out Tracking, Non-Cash Overtime, and Leave Overtime Token Management (`js/attendance.js`, `js/leaves.js`, `js/payroll.js`, `js/dashboard.js`, `js/data.js`)**:
  - **Attendance Check In / Out & Break In / Out Tracking**:
    - Mapped `Time In` = `Check In` and `Time Out` = `Check Out`.
    - Added dedicated punch actions and table/modal columns for **Break Out** and **Break In**.
    - Updated net working hours calculation: `(Check Out - Check In) - (Break In - Break Out)`.
    - Automated extra time calculation: any time worked beyond required shift (8.0h) is counted as **Overtime**.
    - Re-architected Single-Day Daily Dossier with 6 dedicated KPI cards (`Check In (Time In)`, `Break Out`, `Break In`, `Check Out (Time Out)`, `Working Hours`, `Overtime`), 4-state contextual punch buttons, and direct "Claim Overtime Token" triggers.
    - Updated table headers and rows in `renderMyAttTable()`, `renderDaily()`, manual attendance entry, and CSV exports to include all break punches.
  - **Non-Cash Overtime Policy Enforced in Payroll**:
    - Overtime is **NOT paid as cash in salary slips** (`otPay = 0` in `syncPayrollFromAttendanceAndTax`).
    - Overtime hours are tracked in payroll metadata (`syncedDetails`) and banked exclusively as non-cash compensatory leave tokens.
  - **Leave Section: Overtime Tokens & Compensatory Leave Bank**:
    - Added dedicated **Overtime Tokens** tab (`#tokens`) in the Leave Management module.
    - Banked token hero metrics: Available Token Balance, Approved Overtime Hours, Availed Token Hours, Pending Claims.
    - **Apply Overtime Token Claim Modal**: Employee selects date, extra hours worked, direct reporting manager, and detailed task description of work assigned.
    - **Reporting Manager Verification Workflow**: Reporting manager reviews assigned work description with one-click **Approve Token** or **Reject Token** actions with manager remarks and audit timestamps.
    - **Avail Token as Compensatory Leave Modal**:
      - Compensatory leave options: **Short Leave** (minimum 45 minutes up to 2 hours), **Half Day Leave** (4 hours / 0.5 days), or **Full Day Leave** (8 hours / 1.0 day).
      - **Strict Minimum Duration Rule**: Availing less than 45 minutes for Short Leave is strictly blocked with validation warnings.
      - **Balance Check**: Ensures requested leave does not exceed available approved token hours.
      - **Leave Quota Matrix Integration**: Availing token leave automatically creates records in `token_availments` and `leave_requests` (Type 10: `Token Leave`), seamlessly reflecting under the `Token Leave` column in the 20-column Leave Quota & Balance matrix.
  - **Leave Section: Unified Leave Quota & Balance + Leave Types Console (`js/leaves.js`)**:
    - Unified the previously separate `Leave Quota & Balance` and `Leave Types` tabs into a single consolidated feature in the main navigation.
    - Integrated sub-navigation switcher pills right inside the feature: `[ ⚖ Quota & Balance Matrix ]` and `[ 🏷 Leave Types & Policy ]`.
    - Added an at-a-glance **Leave Types Policy Ribbon** directly above the Quota Matrix with badge indicators for all active leave types, day entitlements, carry-forward status, and quick `Manage Types` / `Add Type` shortcuts.
    - Re-architected Leave Types management sub-view with summary KPI metrics (Configured Types, Carry-Forward Eligible, Cumulative Allocation, Total Requests Logged) and added full `showEditType(id)` and `deleteType(id)` capabilities.
    - Backward-compatible routing ensuring `switchView('types')` automatically maps to the unified Quota feature with `quotaSubView = 'types'`.
  - **Attendance Module: Single Correction Per Date Rule & Re-application Policy (`js/attendance.js`, `js/employees.js`, `js/data.js`)**:
    - Enforced strict business rule: Only **one active/pending correction request** is permitted against any single date per employee. Multiple requests for the same date are strictly disallowed while a request is pending, manager-endorsed, or approved.
    - Re-application rule: If a manager, HR, or admin **rejects** the request (`status === 'rejected'`), the employee is immediately allowed to re-apply for that date with updated timings and justification.
    - Implemented live date-conflict warning in `showApplyCorrectionModal` (`checkCorrectionDateConflict`) to dynamically warn employees and disable the submit button if an active request already exists for the selected date.
    - Added database deduplication in `ensureHierarchyAndCorrections` to automatically resolve and clean up any historical duplicate pending submissions from prior tests.
  - **Automated Regression Suite (`scratch/test-attendance-single-correction-per-date.js`)**:
    - 8 / 8 tests passed (100%) validating deduplication, submission blocking for duplicate dates, manager/HR rejection flow, re-application allowance upon rejection, and live UI warning indicators.

---

*File automatically maintained and synchronized with the repository.*




