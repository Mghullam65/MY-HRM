# HRM Pro — Human Resource Management System

A modern, responsive, full-featured Human Resource Management System built with vanilla HTML5, CSS3, and JavaScript, leveraging browser `localStorage` for offline persistence, Chart.js for data visualization, and role-based access control (RBAC).

---

## 🌟 Key Features

### 1. 👥 Employee Management
- Complete Employee Directory with advanced filtering and instant search.
- Multi-tab employee profile drawer and comprehensive add/edit wizard.
- Manage personal details, academic qualifications, past work experience, and banking information.
- Document and ID attachments tracking.

### 2. ⏱️ Attendance & Timesheets
- Interactive daily punch-in / punch-out widget.
- Real-time status tracking: Present, Late, Absent, Half-Day, On Leave.
- Monthly calendar view with attendance breakdown and overtime calculations.
- Biometric sync simulator.

### 3. 🏖️ Leave Management
- Leave balance tracking across categories (Annual, Sick, Casual, Maternity).
- User-friendly leave application submission with instant business day calculations.
- Multi-tier approval workflow for department managers and HR.
- Organization-wide leave calendar.

### 4. 💵 Payroll & Compensation
- Detailed salary structure configuration (basic pay, allowances, tax deductions, provident funds).
- Monthly payroll generation and one-click salary disbursement.
- Print-ready and downloadable PDF-style payslips with watermarks.
- Bank advice export reports.

### 5. 🎯 Performance & OKRs
- Key Performance Indicators (KPIs) and Objective & Key Results (OKRs) tracking.
- Structured performance appraisal cycles (Self-review, Manager review, 360 feedback).
- Ratings and review history logging.

### 6. 💼 Recruitment & ATS (Applicant Tracking System)
- Job requisition and vacancy posting management.
- Visual candidate pipeline: Applied, Screening, Interview, Offered, Hired, Rejected.
- Candidate rating, resume view, and offer letter generation.

### 7. 📅 Company Events & Notice Board
- Corporate event calendar with RSVP tracking.
- Official public holidays list.
- Company-wide announcements and notice board broadcast.

### 8. 📊 Analytical Reports
- Department headcount distribution, turnover rate, and gender diversity charts.
- Monthly payroll and attendance audit summaries.
- Export capabilities to CSV, Excel-compatible formats, and print-ready layouts.

### 9. ⚙️ Administration & Organization Setup
- Multi-branch, multi-department, and multi-designation structure.
- Shift scheduling (Morning, Evening, Night, Flexible).
- Granular Role-Based Access Control (RBAC) with 5 permission tiers:
  - **Super Admin**
  - **HR Manager**
  - **Department Manager**
  - **Employee**
  - **Onboarding Hire**
- Comprehensive tamper-evident system audit log.

### 10. 🎨 Customization & System Settings
- Light & Dark mode theme switching with instant persistence.
- Complete system backup (JSON export) and instant restore.
- Company branding customization (logo, company name, currency, timezone).

---

## 🚀 Getting Started

No external servers, databases, or runtime installations are required. Everything runs directly in any modern web browser.

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Mghullam65/MY-HRM.git
   ```
2. Open `index.html` in your favorite web browser (Chrome, Edge, Firefox, Safari).
3. Select any demo account on the login page to explore the system!

---

## 🔑 Demo Accounts

Use the one-click demo login buttons or sign in with the following credentials:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Full system access, settings & backup |
| **HR Manager** | `sara.malik` | `hr123` | Employee lifecycle, payroll, recruitment & admin |
| **Dept Manager** | `usman.baig` | `mgr123` | Team attendance, leaves & performance reviews |
| **Employee** | `fatima.raza` | `emp123` | Personal profile, attendance, leaves & payslips |

---

## 🛠️ Technology Stack

- **Markup & Layout**: HTML5 Semantic Elements
- **Styling**: Vanilla CSS3 (CSS Custom Properties, Glassmorphism, Responsive Grid & Flexbox)
- **Scripting**: Modern Vanilla JavaScript (ES6+ modular architecture)
- **Data Layer**: Browser `localStorage` with relational schema management
- **Charts**: [Chart.js 4.4.1](https://www.chartjs.org/)
- **Icons**: [Font Awesome 6.5.1](https://fontawesome.com/)
- **Typography**: [Inter Font](https://fonts.google.com/specimen/Inter)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
