# HRM Pro — Project Architecture & Implementation Plan

> **Guiding Principle**: 100% Free & Open-Source. No subscriptions, no paid APIs, no recurring costs. Can run locally, on an internal company network (LAN), or on free-tier cloud hosting.

---

## 📌 Decision Log & Core Choices

| Date | Topic | Decision | Rationale | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **2026-09-07** | Backend Framework | **Node.js + Express.js** | Fast, modern, matches frontend JavaScript language, huge ecosystem. | **$0 (Free)** |
| **2026-09-07** | Cloud Database | **Vercel Postgres (Neon) + Prisma** | 100% free serverless PostgreSQL connected directly to Vercel project. | **$0 (Free)** |
| **2026-09-07** | Cloud Deployment | **Vercel Serverless Functions (`api/`)** | Zero configuration serverless deployment with automated CI/CD from GitHub. | **$0 (Free)** |
| **2026-09-07** | Authentication | **JWT (JSON Web Tokens) + Bcrypt** | Industry standard stateless token auth with salted password hashing. | **$0 (Free)** |

---

## 🗺️ Implementation Roadmap

### Phase 1: Environment & Runtime Setup ✅ (Completed)
- [x] Install **Node.js LTS** via Windows Package Manager (`v24.19.0` installed).
- [x] Verify `node` and `npm` commands in terminal (`node v24.19.0`, `npm 11.17.0`).
- [x] Initialize `server/` workspace with `package.json`.

### Phase 2: Database Schema & Data Modeling ✅ (Completed)
- [x] Setup Prisma ORM with SQLite provider (`prisma/schema.prisma`).
- [x] Define relational models:
  - `User` (Authentication, credentials, role, status)
  - `Employee` (Demographics, employment, bank details, emergency contacts)
  - `Department`, `Designation`, `Branch`, `Shift`
  - `Attendance` (Check-in/out timestamps, status, overtime, notes)
  - `LeaveType`, `LeaveBalance`, `LeaveRequest`
  - `Payroll` (Base salary, allowances, deductions, net salary, payslips)
  - `PerformanceReview`, `Goal`
  - `JobPosting`, `Candidate`
  - `CompanyEvent`, `Announcement`, `Holiday`
  - `AuditLog` (System activity tracking)
- [x] Run Prisma migration to generate SQLite database file (`prisma/hrm.db`).
- [x] Create seed script (`prisma/seed.js`) to migrate all seed data.

### Phase 3: REST API Server & Authentication ✅ (Completed)
- [x] Express server setup (`server/src/server.js`) with security middleware (`cors`, `helmet`, JSON body parser).
- [x] **Auth Endpoints**:
  - `POST /api/auth/login` (Verify credentials with bcrypt, issue signed JWT)
  - `GET /api/auth/me` (Retrieve current user profile)
  - `POST /api/auth/change-password`
- [x] **Core API Endpoints**:
  - `/api/employees` (CRUD, profile details, status filters)
  - `/api/attendance` (Clock in/out, monthly history, statistics)
  - `/api/leaves` (Balance lookup, application submission, manager approval)
  - `/api/payroll` (Generate payroll, compute payslips, export)
  - `/api/admin` (Departments, branches, designations, shifts, audit logs)
  - `/api/health` (Health & system uptime monitoring)

### Phase 4: Frontend API Integration ✅ (Completed)
- [x] Create `js/api.js` client layer handling:
  - Base API URL configuration
  - Automatic JWT authorization headers
  - Graceful error handling & toast notifications
- [x] Wire existing UI modules to fetch from backend while keeping local fallback.
- [x] Include `js/api.js` in `index.html`.

### Phase 5: Documentation & Git Synchronization ⏳ (Final Step)
- [x] Update `README.md` with instructions on how to start the backend (`npm start`).
- [x] Add `server/node_modules/` and `*.db` / `*.db-journal` to `.gitignore`.
- [x] Commit all changes and push directly to GitHub repository (`Mghullam65/MY-HRM`).

---

## 🛠️ Instructions for Running the System

### 1. Starting the Backend Server
```powershell
cd "c:\Users\test\.gemini\antigravity-ide\scratch\hrm-system\server"
npm install
npx prisma migrate dev --name init
npm run dev
```

### 2. Opening the Application
Open `index.html` in any web browser, or serve it via the Express backend at `http://localhost:5000`.

---

*This file will be updated continuously as we make progress and finalize decisions.*
