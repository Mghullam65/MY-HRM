// ============================================================
// HRM SYSTEM — Modern SaaS Landing Page (HRM Pro)
// ============================================================

const Landing = {
  // ─── Complete Metadata for all 14 HRM Pro Modules ───
  modulesData: {
    employees: {
      id: 'employees',
      title: 'Employee Directory & Digital Documents (e-DMS)',
      subtitle: 'Centralize personnel master files, digital contracts, emergency contacts, and branch hierarchy.',
      category: 'Core Workforce',
      icon: 'fa-users',
      color: '#2563eb',
      bgLight: '#eff6ff',
      recommendedRole: 'hr',
      capabilities: [
        {
          title: '360° Personnel Profiles',
          desc: 'Manage complete personal data, national CNIC/ID, blood group, emergency contacts, qualifications, and bank account information.',
          icon: 'fa-id-card'
        },
        {
          title: 'Digital Document Safe (e-DMS)',
          desc: 'Securely upload and verify educational degrees, signed employment contracts, experience letters, and medical fitness certificates.',
          icon: 'fa-file-shield'
        },
        {
          title: 'Automated Expiry Radar',
          desc: 'Built-in 30/60/90-day alert triggers notifying HR before employee visas, contract terms, or probationary periods expire.',
          icon: 'fa-clock-rotate-left'
        },
        {
          title: 'Organizational Hierarchy Trees',
          desc: 'Structure multiple business units, branches, divisions, and reporting lines with automatic department manager assignments.',
          icon: 'fa-sitemap'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Full Authority', desc: 'Create, edit, archive, and configure organizational data fields.' },
        { role: 'HR Director', access: 'Manage & Verify', desc: 'Add new employees, manage documentation, and issue verification letters.' },
        { role: 'Dept Manager', access: 'Team Directory', desc: 'View department employee profiles, skills, and emergency contact details.' },
        { role: 'Employee', access: 'Self-Service View', desc: 'Inspect own personal profile and submit digital change requests.' }
      ],
      related: ['attendance', 'leaves', 'payroll']
    },

    attendance: {
      id: 'attendance',
      title: 'Biometric Attendance & Shift Rostering',
      subtitle: 'Real-time biometric clock-ins, grace period validations, overtime tracking, and shift rosters.',
      category: 'Core Workforce',
      icon: 'fa-clock',
      color: '#10b981',
      bgLight: '#ecfdf5',
      recommendedRole: 'manager',
      capabilities: [
        {
          title: 'Biometric Hardware Gateway',
          desc: 'Integrate directly with physical biometric fingerprint/facial scanners and digital web clock-in terminals.',
          icon: 'fa-fingerprint'
        },
        {
          title: 'Grace Period & Late Penalties',
          desc: 'Configurable arrival buffers (e.g. 15 mins) with automated late-coming counters and automated half-day deductions.',
          icon: 'fa-stopwatch'
        },
        {
          title: 'Dynamic Shift Rosters',
          desc: 'Assign morning, evening, rotational, and weekend shifts with automated notification to affected employees.',
          icon: 'fa-calendar-week'
        },
        {
          title: 'Overtime Token Computations',
          desc: 'Calculate approved overtime hours automatically and feed approved tokens directly into statutory payroll.',
          icon: 'fa-bolt'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Full Policy Control', desc: 'Configure shift rules, grace thresholds, and hardware connections.' },
        { role: 'HR Director', access: 'Audit & Overrides', desc: 'Review daily organization logs and approve attendance regularization.' },
        { role: 'Dept Manager', access: 'Roster Endorsement', desc: 'Schedule team shifts, verify clock-in discrepancies, and approve overtime.' },
        { role: 'Employee', access: 'Daily Check-In', desc: 'Clock in/out electronically and inspect personal monthly timesheets.' }
      ],
      related: ['leaves', 'payroll', 'employees']
    },

    leaves: {
      id: 'leaves',
      title: 'Leave Policies & Approval Workflows',
      subtitle: 'Automated leave balances, statutory quota tracking, and 2-tier electronic manager/HR approvals.',
      category: 'Core Workforce',
      icon: 'fa-calendar-days',
      color: '#16a34a',
      bgLight: '#f0fdf4',
      recommendedRole: 'employee',
      capabilities: [
        {
          title: 'Multi-Type Leave Quotas',
          desc: 'Track statutory annual, casual, medical/sick, maternity, and unpaid leaves with real-time balance deductions.',
          icon: 'fa-layer-group'
        },
        {
          title: '2-Tier Electronic Approvals',
          desc: 'Leave requests first route to the department manager for recommendation, then to HR Director for final sign-off.',
          icon: 'fa-check-double'
        },
        {
          title: 'Medical Certificate Attachments',
          desc: 'Attach supporting documents and medical certificates directly to extended medical leave applications.',
          icon: 'fa-paperclip'
        },
        {
          title: 'Department Coverage Calendar',
          desc: 'Visual heat map preventing overlapping leave approvals in critical teams to ensure operational continuity.',
          icon: 'fa-calendar-days'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Policy Engine', desc: 'Configure company leave entitlements, encashment, and carry-forward limits.' },
        { role: 'HR Director', access: 'Final Sign-Off', desc: 'Approve or decline leaves and adjust leave ledger balances.' },
        { role: 'Dept Manager', access: 'Team Recommendation', desc: 'Review team availability and endorse subordinate leave requests.' },
        { role: 'Employee', access: 'Self-Service Portal', desc: 'Submit leave applications, view remaining balances, and track approval status.' }
      ],
      related: ['attendance', 'payroll', 'events']
    },

    recruitment: {
      id: 'recruitment',
      title: 'Recruitment Pipeline & ATS Kanban',
      subtitle: 'Job requisitions, drag-and-drop applicant tracking, interview scorecards, and digital offer letters.',
      category: 'Core Workforce',
      icon: 'fa-briefcase',
      color: '#d97706',
      bgLight: '#fffbeb',
      recommendedRole: 'hr',
      capabilities: [
        {
          title: 'Visual ATS Kanban Board',
          desc: 'Drag and drop applicants seamlessly across Applied, Screening, Interview, Offered, and Hired stages.',
          icon: 'fa-table-columns'
        },
        {
          title: 'Structured Interview Scorecards',
          desc: 'Evaluate candidate competency across problem solving, technical skills, and cultural fit with standardized ratings.',
          icon: 'fa-clipboard-check'
        },
        {
          title: 'Automated Digital Offer Letters',
          desc: 'Generate branded PDF employment offer letters with compensation breakdown and digital acceptance tracking.',
          icon: 'fa-file-signature'
        },
        {
          title: 'Instant Onboarding Conversion',
          desc: 'Convert hired applicants directly into the HRM Pro employee directory with zero repetitive data entry.',
          icon: 'fa-user-plus'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Budget & Approval', desc: 'Authorize new job openings and sign off on executive compensation packages.' },
        { role: 'HR Director', access: 'Pipeline Management', desc: 'Post openings, review applications, and coordinate interview panels.' },
        { role: 'Dept Manager', access: 'Technical Evaluation', desc: 'Conduct interviews, complete scorecards, and recommend candidate hiring.' },
        { role: 'Employee', access: 'Referral Portal', desc: 'Submit candidate referrals and track referral bonuses.' }
      ],
      related: ['employees', 'performance', 'payroll']
    },

    payroll: {
      id: 'payroll',
      title: 'Automated Statutory Payroll & Salary Slips',
      subtitle: 'FBR progressive tax slabs, EOBI, provident funds, advance salary amortizations, and digital payslips.',
      category: 'Payroll & Performance',
      icon: 'fa-money-bill-wave',
      color: '#9333ea',
      bgLight: '#faf5ff',
      recommendedRole: 'hr',
      capabilities: [
        {
          title: 'FBR Tax Engine Calculation',
          desc: 'Automated withholding tax deductions according to progressive financial year taxable income slabs.',
          icon: 'fa-calculator'
        },
        {
          title: 'Statutory Funds (EOBI & PF)',
          desc: 'Calculates employer and employee contributions for EOBI, Social Security, and corporate Provident Funds.',
          icon: 'fa-vault'
        },
        {
          title: 'Advance Salary & Loan Ledgers',
          desc: 'Manages company loans with automated monthly installment deductions and remaining principal tracking.',
          icon: 'fa-hand-holding-dollar'
        },
        {
          title: 'Single-Click Payslips & Bank Advice',
          desc: 'Generate printable and downloadable electronic salary slips and export batch bank payment CSV files.',
          icon: 'fa-file-invoice'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Audit & Finalize', desc: 'Review payroll totals, audit statutory deductions, and authorize disbursements.' },
        { role: 'HR Director', access: 'Payroll Processing', desc: 'Compute monthly salaries, adjust allowances, and generate bank advice.' },
        { role: 'Dept Manager', access: 'Salary Oversight', desc: 'View department aggregate payroll figures and compensation structures.' },
        { role: 'Employee', access: 'Payslip Archive', desc: 'Download and inspect personal monthly payslips and tax deduction certificates.' }
      ],
      related: ['attendance', 'leaves', 'expenses']
    },

    performance: {
      id: 'performance',
      title: 'Performance Reviews & Goal OKRs',
      subtitle: 'Objective key results tracking, quarterly appraisal cycles, 360-degree reviews, and merit increments.',
      category: 'Payroll & Performance',
      icon: 'fa-chart-line',
      color: '#0284c7',
      bgLight: '#f0f9ff',
      recommendedRole: 'manager',
      capabilities: [
        {
          title: 'Quarterly OKR & Goal Tracking',
          desc: 'Set measurable goals and key deliverables with weighted percentage milestones for each quarter.',
          icon: 'fa-bullseye'
        },
        {
          title: '360° Multi-Rater Appraisals',
          desc: 'Gather self-evaluations, manager ratings, and peer feedback in an objective, structured format.',
          icon: 'fa-comments'
        },
        {
          title: 'Radar Competency Analytics',
          desc: 'Interactive radar charts visualizing technical proficiency, teamwork, initiative, and leadership traits.',
          icon: 'fa-chart-pie'
        },
        {
          title: 'Historical Increment Ledgers',
          desc: 'Maintain an immutable record of past appraisal ratings, performance bonuses, and merit salary increases.',
          icon: 'fa-award'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Appraisal Cycles', desc: 'Initiate company-wide review cycles and authorize promotion recommendations.' },
        { role: 'HR Director', access: 'Moderation & Calibration', desc: 'Calibrate ratings, monitor completion, and prepare promotion lists.' },
        { role: 'Dept Manager', access: 'Team Evaluation', desc: 'Review goal progress, evaluate subordinates, and recommend increments.' },
        { role: 'Employee', access: 'Self-Assessment', desc: 'Submit self-evaluations, set personal goals, and view appraisal feedback.' }
      ],
      related: ['employees', 'recruitment', 'payroll']
    },

    expenses: {
      id: 'expenses',
      title: 'Expense Claims & Reimbursements',
      subtitle: 'Digital receipt uploads, multi-category travel claims, multi-level approvals, and payroll disbursement.',
      category: 'Payroll & Performance',
      icon: 'fa-receipt',
      color: '#f59e0b',
      bgLight: '#fffbeb',
      recommendedRole: 'employee',
      capabilities: [
        {
          title: 'Digital Receipt Attachments',
          desc: 'Upload invoices, taxi receipts, and hotel bills with automated image previews and claim tagging.',
          icon: 'fa-receipt'
        },
        {
          title: 'Policy Category Guardrails',
          desc: 'Automated spending caps for travel, meals, equipment, and client entertainment to prevent policy violations.',
          icon: 'fa-shield-halved'
        },
        {
          title: 'Multi-Level Approval Flow',
          desc: 'Route claims from Department Manager recommendation to HR & Finance for final payment sign-off.',
          icon: 'fa-file-invoice-dollar'
        },
        {
          title: 'Direct Payroll Integration',
          desc: 'Approved expense reimbursements are automatically rolled into the employee’s next monthly salary slip.',
          icon: 'fa-coins'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Policy Thresholds', desc: 'Define expense allowances, category caps, and audit high-value claims.' },
        { role: 'HR Director', access: 'Finance Approval', desc: 'Verify receipts, approve legitimate claims, and trigger reimbursements.' },
        { role: 'Dept Manager', access: 'Team Verification', desc: 'Validate that claims were required for official business duties.' },
        { role: 'Employee', access: 'Submit & Track', desc: 'File new claims, attach bills, and monitor reimbursement status in real time.' }
      ],
      related: ['payroll', 'employees', 'assets']
    },

    assets: {
      id: 'assets',
      title: 'Asset Management & Hardware Inventory',
      subtitle: 'Company hardware registry, laptop serial tracking, warranties, and offboarding handovers.',
      category: 'Operations & Assets',
      icon: 'fa-laptop-file',
      color: '#0ea5e9',
      bgLight: '#f0f9ff',
      recommendedRole: 'admin',
      capabilities: [
        {
          title: 'Hardware & License Registry',
          desc: 'Track laptops, workstations, screens, mobile devices, and software licenses by unique barcode serials.',
          icon: 'fa-barcode'
        },
        {
          title: 'Digital Handover Acknowledgments',
          desc: 'Record device condition and obtain electronic sign-off from employees upon hardware handover.',
          icon: 'fa-signature'
        },
        {
          title: 'Warranty & Maintenance Schedule',
          desc: 'Automated tracking of vendor warranty expirations, maintenance logs, and asset depreciation values.',
          icon: 'fa-wrench'
        },
        {
          title: 'Offboarding Clearance Audit',
          desc: 'Mandatory asset return verification required before HR issues final settlement clearance to departing staff.',
          icon: 'fa-box-archive'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Full Inventory Mastery', desc: 'Add equipment, configure depreciations, and write off retired assets.' },
        { role: 'HR Director', access: 'Issue & Clear', desc: 'Allocate hardware to joiners and execute asset clearance for departures.' },
        { role: 'Dept Manager', access: 'Department Registry', desc: 'Monitor hardware assigned to team members and request upgrades.' },
        { role: 'Employee', access: 'Assigned Gear', desc: 'View serials and specifications of all company hardware issued to them.' }
      ],
      related: ['employees', 'helpdesk', 'administration']
    },

    helpdesk: {
      id: 'helpdesk',
      title: 'Helpdesk & Employee Grievances',
      subtitle: 'Internal IT/HR ticketing, SLA urgency tracking, confidential grievance channels, and resolution history.',
      category: 'Operations & Assets',
      icon: 'fa-headset',
      color: '#ec4899',
      bgLight: '#fdf2f8',
      recommendedRole: 'employee',
      capabilities: [
        {
          title: 'Multi-Department Ticket Queues',
          desc: 'Categorize requests across IT Support, Payroll Queries, HR Inquiries, Workplace Admin, and Facilities.',
          icon: 'fa-ticket'
        },
        {
          title: 'SLA Priority Queues',
          desc: 'Prioritize issues with Low, Medium, High, and Critical urgency flags with target resolution countdowns.',
          icon: 'fa-stopwatch-20'
        },
        {
          title: 'Confidential Whistleblower Grievances',
          desc: 'Encrypted submission route for sensitive workplace grievances accessible exclusively to authorized leadership.',
          icon: 'fa-user-secret'
        },
        {
          title: 'Activity Threads & Ratings',
          desc: 'Staff can comment on active tickets, attach screenshots, and rate resolution satisfaction upon ticket closure.',
          icon: 'fa-star'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Full System Audit', desc: 'Monitor SLA compliance across all departments and handle critical escalations.' },
        { role: 'HR Director', access: 'Resolve & Assign', desc: 'Assign tickets to internal leads and resolve employee HR and policy queries.' },
        { role: 'Dept Manager', access: 'Team Overview', desc: 'Track technical tickets submitted by team members affecting deliverables.' },
        { role: 'Employee', access: 'Create Tickets', desc: 'Open help requests, attach diagnostic screenshots, and monitor updates.' }
      ],
      related: ['employees', 'assets', 'administration']
    },

    events: {
      id: 'events',
      title: 'Company Events & Public Holidays',
      subtitle: 'Corporate holiday calendar, training workshops, town halls, and organizational celebrations.',
      category: 'Operations & Assets',
      icon: 'fa-calendar-check',
      color: '#8b5cf6',
      bgLight: '#f5f3ff',
      recommendedRole: 'hr',
      capabilities: [
        {
          title: 'Gazetted Public Holiday Calendar',
          desc: 'Official holiday schedule linked with attendance validations so holidays are recognized without penalties.',
          icon: 'fa-calendar-star'
        },
        {
          title: 'Corporate Town Halls & Workshops',
          desc: 'Publish upcoming all-hands meetings, technical webinars, and training seminars with RSVP tracking.',
          icon: 'fa-users-line'
        },
        {
          title: 'Birthday & Milestone Broadcasts',
          desc: 'Automated notification of employee birthdays, company work anniversaries, and project celebrations.',
          icon: 'fa-cake-candles'
        },
        {
          title: 'Team Scheduling Calendar',
          desc: 'Synchronized corporate calendar keeping remote and office teams aligned on all institutional events.',
          icon: 'fa-calendar'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Organization Master', desc: 'Configure annual holiday schedules and company-wide calendar entries.' },
        { role: 'HR Director', access: 'Event Coordinator', desc: 'Publish training events, organize workshops, and track attendance.' },
        { role: 'Dept Manager', access: 'Team Session Scheduler', desc: 'Schedule department sprints, retrospectives, and knowledge transfers.' },
        { role: 'Employee', access: 'Event RSVP', desc: 'View official holidays, register for workshops, and track team celebrations.' }
      ],
      related: ['attendance', 'leaves', 'employees']
    },

    reports: {
      id: 'reports',
      title: 'Analytics & Executive Reports',
      subtitle: 'Exportable payroll registers, biometric timesheets, turnover audits, and regulatory compliance sheets.',
      category: 'Governance & Intelligence',
      icon: 'fa-file-chart-column',
      color: '#6366f1',
      bgLight: '#eef2ff',
      recommendedRole: 'admin',
      capabilities: [
        {
          title: 'Batch Exportable Spreadsheets (CSV/Excel)',
          desc: 'Instant export of attendance timesheets, tax deduction schedules, and salary disbursement advice.',
          icon: 'fa-file-csv'
        },
        {
          title: 'Headcount & Turnover Analytics',
          desc: 'Track department expansion, joiner/leaver ratios, average employee tenure, and retention curves.',
          icon: 'fa-chart-area'
        },
        {
          title: 'Biometric Punctuality Audits',
          desc: 'Detailed reporting on early clock-outs, chronic late arrivals, and absent patterns by department.',
          icon: 'fa-clock-rotate-left'
        },
        {
          title: 'Regulatory & FBR Compliance Ledgers',
          desc: 'Pre-formatted ledgers for provincial labor department audits, income tax filings, and EOBI submissions.',
          icon: 'fa-scale-balanced'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Complete Business Analytics', desc: 'Generate high-level organizational audits, payroll totals, and compliance packs.' },
        { role: 'HR Director', access: 'Operational Reports', desc: 'Export monthly attendance, leave utilization, and employee documentation reports.' },
        { role: 'Dept Manager', access: 'Department Metrics', desc: 'Review department punctuality, leave summaries, and performance scores.' },
        { role: 'Employee', access: 'Personal Statement', desc: 'Export personal attendance logs and annual income tax deduction statements.' }
      ],
      related: ['dashboard', 'payroll', 'attendance']
    },

    administration: {
      id: 'administration',
      title: 'HR Administration & Workflows',
      subtitle: 'Electronic HR letters, official notices, policy repositories, exit clearances, and disciplinary files.',
      category: 'Governance & Intelligence',
      icon: 'fa-gear',
      color: '#475569',
      bgLight: '#f1f5f9',
      recommendedRole: 'hr',
      capabilities: [
        {
          title: 'Automated Official HR Letters',
          desc: 'Generate experience certificates, salary verification letters, increment notices, and warning letters instantly.',
          icon: 'fa-envelope-open-text'
        },
        {
          title: 'Electronic Policy Repository',
          desc: 'Host company handbooks, code of conduct, and leave policies with employee electronic sign-off tracking.',
          icon: 'fa-book-bookmark'
        },
        {
          title: 'Disciplinary & Incident Tracking',
          desc: 'Formal management of warning letters, show-cause notices, inquiry reports, and employee responses.',
          icon: 'fa-gavel'
        },
        {
          title: 'Comprehensive Offboarding Clearance',
          desc: 'Multi-stage checklist ensuring IT devices, library assets, finance loans, and HR documents are settled upon exit.',
          icon: 'fa-user-xmark'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Full Governance', desc: 'Authorize policy changes, approve termination workflows, and sign official notices.' },
        { role: 'HR Director', access: 'Operations Lead', desc: 'Issue letters, maintain policy sign-offs, and conduct exit interviews.' },
        { role: 'Dept Manager', access: 'Clearance Endorsement', desc: 'Complete department handovers and report employee misconduct.' },
        { role: 'Employee', access: 'Policy Acknowledgments', desc: 'Review official policies, electronically sign notices, and view issued letters.' }
      ],
      related: ['employees', 'settings', 'reports']
    },

    settings: {
      id: 'settings',
      title: 'System Settings & Audit Log',
      subtitle: 'Company profile, role security scopes, database backups, real-time sync telemetry, and activity logs.',
      category: 'Governance & Intelligence',
      icon: 'fa-sliders',
      color: '#334155',
      bgLight: '#f8fafc',
      recommendedRole: 'admin',
      capabilities: [
        {
          title: 'Central Real-Time Sync Engine',
          desc: 'Real-time Server-Sent Events (SSE) telemetry, monotonic version tracking, and cross-browser persistence.',
          icon: 'fa-arrows-rotate'
        },
        {
          title: 'Granular Role Scopes',
          desc: 'Manage strict module permissions across Super Admin, HR Director, Dept Manager, Employee, and Onboarding.',
          icon: 'fa-user-lock'
        },
        {
          title: 'Database Export & Disaster Recovery',
          desc: 'Single-click full JSON database snapshots and restoration for zero-data-loss institutional resilience.',
          icon: 'fa-database'
        },
        {
          title: 'Immutable Audit Log',
          desc: 'Cryptographically timestamped telemetry recording every login, record update, approval, and deletion.',
          icon: 'fa-shield'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Exclusive Authority', desc: 'Only Super Administrator has access to system settings, audit logs, and backups.' },
        { role: 'HR Director', access: 'No Access', desc: 'Restricted by system security scope.' },
        { role: 'Dept Manager', access: 'No Access', desc: 'Restricted by system security scope.' },
        { role: 'Employee', access: 'No Access', desc: 'Restricted by system security scope.' }
      ],
      related: ['dashboard', 'reports', 'administration']
    },

    dashboard: {
      id: 'dashboard',
      title: 'Executive Dashboard & Workforce Intelligence',
      subtitle: 'Real-time enterprise metrics, live attendance stream, organizational KPIs, and executive reporting.',
      category: 'Governance & Intelligence',
      icon: 'fa-gauge-high',
      color: '#2563eb',
      bgLight: '#eff6ff',
      recommendedRole: 'admin',
      capabilities: [
        {
          title: 'Real-Time Workforce Telemetry',
          desc: 'Instant view of total active headcount, branch breakdown, department distribution, and probation statuses.',
          icon: 'fa-users'
        },
        {
          title: 'Live Attendance Stream',
          desc: 'Real-time monitor tracking on-time arrivals, biometric check-ins, late penalties, and active shift leaves.',
          icon: 'fa-chart-column'
        },
        {
          title: 'Financial & Payroll Summary',
          desc: 'Executive totals of monthly salary liabilities, tax witholdings, advance amortizations, and pending requests.',
          icon: 'fa-coins'
        },
        {
          title: 'Priority Notification Center',
          desc: 'Audio-chime notifications for pending leave approvals, asset requests, ticket escalations, and official events.',
          icon: 'fa-bell'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Complete Executive View', desc: 'Full institutional telemetry, audit logs, and organization-wide oversight.' },
        { role: 'HR Director', access: 'Operations Dashboard', desc: 'Recruitment velocity, pending leave approvals, and employee records overview.' },
        { role: 'Dept Manager', access: 'Team Management View', desc: 'Direct team attendance, shift coverage, and pending subordinate requests.' },
        { role: 'Employee', access: 'Self-Service Summary', desc: 'Personal timesheet, remaining leave balances, and announcement stream.' }
      ],
      related: ['employees', 'attendance', 'payroll']
    }
  },

  toggleModulesMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('landing-mega-menu');
    if (!menu) return;
    const isShown = menu.classList.contains('open');
    if (isShown) {
      menu.classList.remove('open');
    } else {
      menu.classList.add('open');
    }
  },

  closeModulesMenu() {
    const menu = document.getElementById('landing-mega-menu');
    if (menu) menu.classList.remove('open');
  },

  showModule(moduleId) {
    this.closeModulesMenu();
    App.showModule(moduleId);
  },

  renderModuleDetail(moduleId) {
    const container = document.getElementById('module-detail-page');
    if (!container) return;

    const mod = this.modulesData[moduleId] || this.modulesData.employees;
    const allModuleKeys = Object.keys(this.modulesData);
    const currentIndex = allModuleKeys.indexOf(mod.id);
    const prevKey = allModuleKeys[(currentIndex - 1 + allModuleKeys.length) % allModuleKeys.length];
    const nextKey = allModuleKeys[(currentIndex + 1) % allModuleKeys.length];
    const prevMod = this.modulesData[prevKey];
    const nextMod = this.modulesData[nextKey];

    // Get live data counts for preview
    const emps = (typeof DB !== 'undefined' && DB.get) ? (DB.get('employees') || []) : [];
    const att = (typeof DB !== 'undefined' && DB.get) ? (DB.get('attendance') || []) : [];
    const leaves = (typeof DB !== 'undefined' && DB.get) ? (DB.get('leave_requests') || []) : [];
    const jobs = (typeof DB !== 'undefined' && DB.get) ? (DB.get('recruitment') || []) : [];

    container.innerHTML = `
      <div class="module-detail-page-wrapper">
        <!-- ─── 1. TOP HEADER & BREADCRUMB ─── -->
        <header class="module-detail-header">
          <div class="module-detail-nav-container">
            <div class="module-nav-left">
              <button class="module-btn-back" onclick="App.showLanding()">
                <i class="fa fa-arrow-left"></i> <span>Back to HRM Pro</span>
              </button>
              <div class="module-breadcrumb-sep">/</div>
              <div class="module-breadcrumb-cat">${mod.category}</div>
              <div class="module-breadcrumb-sep">/</div>
              <div class="module-breadcrumb-active">${mod.title.split(' ')[0]}</div>
            </div>

            <div class="module-nav-switcher">
              <button class="module-switcher-btn" onclick="App.showModule('${prevMod.id}')" title="Previous: ${prevMod.title}">
                <i class="fa fa-chevron-left"></i> <span>${prevMod.title.split(' ')[0]}</span>
              </button>
              <button class="module-switcher-btn" onclick="App.showModule('${nextMod.id}')" title="Next: ${nextMod.title}">
                <span>${nextMod.title.split(' ')[0]}</span> <i class="fa fa-chevron-right"></i>
              </button>
              <button class="module-btn-signin" onclick="App.showLogin()">
                <i class="fa fa-right-to-bracket"></i> Open Portal
              </button>
            </div>
          </div>
        </header>

        <!-- ─── 2. MODULE HERO BANNER ─── -->
        <section class="module-detail-hero">
          <div class="module-hero-inner">
            <div class="module-badge-pill" style="background: ${mod.bgLight}; color: ${mod.color}; border: 1px solid ${mod.color}33">
              <i class="fa ${mod.icon}"></i> ${mod.category}
            </div>
            <h1 class="module-hero-title">${mod.title}</h1>
            <p class="module-hero-subtitle">${mod.subtitle}</p>

            <div class="module-hero-actions">
              <button class="btn-module-primary" onclick="Login.quickLogin('${mod.recommendedRole === 'admin' ? 'admin' : (mod.recommendedRole === 'hr' ? 'sara.malik' : (mod.recommendedRole === 'manager' ? 'usman.baig' : 'fatima.raza'))}', '${mod.recommendedRole === 'admin' ? 'admin123' : (mod.recommendedRole === 'hr' ? 'hr123' : (mod.recommendedRole === 'manager' ? 'mgr123' : 'emp123'))}')">
                <i class="fa fa-arrow-up-right-from-square"></i> Launch Interactive ${mod.title.split(' ')[0]}
              </button>
              <button class="btn-module-secondary" onclick="App.showLogin()">
                <i class="fa fa-shield-halved"></i> Choose Role Login
              </button>
            </div>
          </div>
        </section>

        <!-- ─── 3. CAPABILITIES GRID ─── -->
        <section class="module-content-section">
          <div class="module-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 10px auto">
              <i class="fa fa-sparkles" style="color:#2563eb"></i> Key Functional Capabilities
            </div>
            <h2 class="module-section-h2">What this module automates in your organization</h2>
            <p class="module-section-desc">Designed with enterprise rules, zero-loss multi-device synchronization, and automated compliance.</p>
          </div>

          <div class="module-capabilities-grid">
            ${mod.capabilities.map(cap => `
              <div class="module-cap-card">
                <div class="cap-card-icon" style="background:${mod.bgLight};color:${mod.color}">
                  <i class="fa ${cap.icon}"></i>
                </div>
                <h3 class="cap-card-title">${cap.title}</h3>
                <p class="cap-card-desc">${cap.desc}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ─── 4. ROLE-BASED ACCESS PERMISSION MATRIX ─── -->
        <section class="module-content-section" style="padding-top:0">
          <div class="module-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 10px auto">
              <i class="fa fa-user-lock" style="color:#10b981"></i> Role Scopes
            </div>
            <h2 class="module-section-h2">Role-Based Access Matrix</h2>
            <p class="module-section-desc">Strict least-privilege security controls tailored for each tier of your workforce.</p>
          </div>

          <div class="module-matrix-card">
            <div class="module-matrix-table-wrap">
              <table class="module-matrix-table">
                <thead>
                  <tr>
                    <th style="width:200px">Workforce Role</th>
                    <th style="width:200px">Access Level</th>
                    <th>Permissions & Functional Scope</th>
                  </tr>
                </thead>
                <tbody>
                  ${mod.roleMatrix.map(r => `
                    <tr>
                      <td>
                        <strong><i class="fa ${r.role.includes('Admin') ? 'fa-crown text-warning' : (r.role.includes('HR') ? 'fa-user-tie text-primary' : (r.role.includes('Manager') ? 'fa-users-gear text-info' : 'fa-user text-secondary'))}" style="margin-right:6px"></i> ${r.role}</strong>
                      </td>
                      <td>
                        <span class="badge ${r.access.includes('Full') ? 'badge-success' : (r.access.includes('Manage') ? 'badge-info' : (r.access.includes('No Access') ? 'badge-danger' : 'badge-primary'))}">${r.access}</span>
                      </td>
                      <td style="color:var(--text-2);font-size:13px">${r.desc}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ─── 5. RELATED MODULES ROW ─── -->
        <section class="module-content-section" style="padding-top:0">
          <div class="module-section-header">
            <h3 class="module-section-h2" style="font-size:22px">Connected Modules</h3>
            <p class="module-section-desc">Data from ${mod.title.split(' ')[0]} seamlessly synchronizes with these integrated modules.</p>
          </div>

          <div class="module-related-grid">
            ${mod.related.map(relId => {
              const rel = Landing.modulesData[relId];
              if (!rel) return '';
              return `
                <div class="module-related-card" onclick="App.showModule('${rel.id}')">
                  <div class="rel-icon" style="background:${rel.bgLight};color:${rel.color}">
                    <i class="fa ${rel.icon}"></i>
                  </div>
                  <div style="flex:1">
                    <div style="font-size:11px;font-weight:700;color:${rel.color};text-transform:uppercase">${rel.category}</div>
                    <div style="font-size:15px;font-weight:800;color:var(--text);margin:2px 0 4px 0">${rel.title.split('&')[0]}</div>
                    <div style="font-size:12px;color:var(--text-3);line-height:1.4">${rel.subtitle.slice(0, 75)}...</div>
                  </div>
                  <i class="fa fa-chevron-right" style="color:var(--text-3);font-size:12px"></i>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- ─── 6. BOTTOM CTA BANNER ─── -->
        <section class="module-bottom-cta">
          <div class="module-cta-box">
            <div>
              <h2 style="font-size:24px;font-weight:800;color:#ffffff;margin-bottom:8px">Ready to experience the ${mod.title.split(' ')[0]} module?</h2>
              <p style="color:#bfdbfe;font-size:14px;margin:0">Log in to your authorized portal to test real-time data entry and synchronization live.</p>
            </div>
            <div style="display:flex;gap:12px">
              <button class="btn-module-cta-action" onclick="App.showLogin()">
                Open HRM Pro Portal <i class="fa fa-arrow-right"></i>
              </button>
              <button class="btn-module-cta-home" onclick="App.showLanding()">
                Back to Home
              </button>
            </div>
          </div>
        </section>
      </div>
    `;

    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  render() {
    const container = document.getElementById('landing-page');
    if (!container) return;

    // Get live counts from database where available
    const emps = (typeof DB !== 'undefined' && DB.get) ? (DB.get('employees') || []) : [];
    const att = (typeof DB !== 'undefined' && DB.get) ? (DB.get('attendance') || []) : [];
    const leaves = (typeof DB !== 'undefined' && DB.get) ? (DB.get('leave_requests') || []) : [];
    const jobs = (typeof DB !== 'undefined' && DB.get) ? (DB.get('recruitment') || []) : [];

    const todayStr = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : new Date().toISOString().slice(0, 10);
    const totalEmps = emps.length > 0 ? emps.length : 52;
    const presentToday = att.filter(a => a.date === todayStr && a.status === 'present').length || Math.min(totalEmps, 48);
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length || 6;
    const openJobs = jobs.filter(j => j.status === 'active' || j.status === 'open').length || 8;

    container.innerHTML = `
      <div class="landing-wrapper" onclick="Landing.closeModulesMenu()">
        <!-- ─── 1. TOP NAVBAR WITH MEGA-MENU ─── -->
        <header class="landing-header">
          <div class="landing-nav-container">
            <a href="#" class="landing-brand" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">
              <div class="landing-brand-icon" style="background:#2563eb;color:#ffffff;border-radius:10px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:18px">
                <i class="fa fa-users"></i>
              </div>
              <div>
                <div class="landing-brand-name">HRM Pro</div>
                <div class="landing-brand-tag">Human Resource Information System</div>
              </div>
            </a>

            <nav class="landing-nav-links">
              <a href="#features" class="landing-nav-link" onclick="Landing.scrollTo('features');return false;">Features</a>
              <a href="#how-it-works" class="landing-nav-link" onclick="Landing.scrollTo('how-it-works');return false;">How It Works</a>

              <!-- Modules Mega-Menu Dropdown -->
              <div class="landing-nav-dropdown-wrapper" onclick="event.stopPropagation()">
                <button class="landing-nav-link landing-dropdown-btn" id="nav-modules-btn" onclick="Landing.toggleModulesMenu(event)">
                  Modules <i class="fa fa-chevron-down" style="font-size:10px;margin-left:4px;opacity:0.75"></i>
                </button>

                <!-- Mega-Menu Dropdown Panel (Categorized) -->
                <div class="landing-mega-menu" id="landing-mega-menu">
                  <div class="mega-menu-header">
                    <div>
                      <strong style="font-size:13.5px;color:var(--text);font-weight:800">All 14 HRM Pro Modules</strong>
                      <div style="font-size:11.5px;color:var(--text-3)">Click any module to inspect comprehensive features and role permissions</div>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="Landing.closeModulesMenu();App.showLogin()">
                      Open Full Portal <i class="fa fa-arrow-right" style="font-size:10px;margin-left:4px"></i>
                    </button>
                  </div>

                  <div class="mega-menu-grid">
                    <!-- Column 1: Core Workforce -->
                    <div class="mega-menu-col">
                      <div class="mega-col-title"><i class="fa fa-users text-primary"></i> Core Workforce</div>
                      <div class="mega-item" onclick="Landing.showModule('employees')">
                        <div class="mega-item-icon" style="background:#eff6ff;color:#2563eb"><i class="fa fa-users"></i></div>
                        <div>
                          <div class="mega-item-title">Employees & e-DMS</div>
                          <div class="mega-item-desc">Directory, contracts & expiries</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('attendance')">
                        <div class="mega-item-icon" style="background:#ecfdf5;color:#10b981"><i class="fa fa-clock"></i></div>
                        <div>
                          <div class="mega-item-title">Attendance & Shifts</div>
                          <div class="mega-item-desc">Biometrics & overtime tokens</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('leaves')">
                        <div class="mega-item-icon" style="background:#f0fdf4;color:#16a34a"><i class="fa fa-calendar-days"></i></div>
                        <div>
                          <div class="mega-item-title">Leave Approvals</div>
                          <div class="mega-item-desc">Quotas & 2-tier workflows</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('recruitment')">
                        <div class="mega-item-icon" style="background:#fffbeb;color:#d97706"><i class="fa fa-briefcase"></i></div>
                        <div>
                          <div class="mega-item-title">Recruitment ATS</div>
                          <div class="mega-item-desc">Kanban pipeline & offer letters</div>
                        </div>
                      </div>
                    </div>

                    <!-- Column 2: Payroll & Compensation -->
                    <div class="mega-menu-col">
                      <div class="mega-col-title"><i class="fa fa-money-bill-wave text-success"></i> Compensation</div>
                      <div class="mega-item" onclick="Landing.showModule('payroll')">
                        <div class="mega-item-icon" style="background:#faf5ff;color:#9333ea"><i class="fa fa-money-bill-wave"></i></div>
                        <div>
                          <div class="mega-item-title">Statutory Payroll</div>
                          <div class="mega-item-desc">Taxes, EOBI & payslips</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('performance')">
                        <div class="mega-item-icon" style="background:#f0f9ff;color:#0284c7"><i class="fa fa-chart-line"></i></div>
                        <div>
                          <div class="mega-item-title">Performance & OKRs</div>
                          <div class="mega-item-desc">Appraisals & KPI scorecards</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('expenses')">
                        <div class="mega-item-icon" style="background:#fffbeb;color:#f59e0b"><i class="fa fa-receipt"></i></div>
                        <div>
                          <div class="mega-item-title">Expense Claims</div>
                          <div class="mega-item-desc">Receipt attachments & reimbursement</div>
                        </div>
                      </div>
                    </div>

                    <!-- Column 3: Operations & Assets -->
                    <div class="mega-menu-col">
                      <div class="mega-col-title"><i class="fa fa-toolbox text-warning"></i> Operations</div>
                      <div class="mega-item" onclick="Landing.showModule('assets')">
                        <div class="mega-item-icon" style="background:#f0f9ff;color:#0ea5e9"><i class="fa fa-laptop-file"></i></div>
                        <div>
                          <div class="mega-item-title">Asset Inventory</div>
                          <div class="mega-item-desc">Hardware allocations & handovers</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('helpdesk')">
                        <div class="mega-item-icon" style="background:#fdf2f8;color:#ec4899"><i class="fa fa-headset"></i></div>
                        <div>
                          <div class="mega-item-title">Helpdesk Tickets</div>
                          <div class="mega-item-desc">SLA queues & grievances</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('events')">
                        <div class="mega-item-icon" style="background:#f5f3ff;color:#8b5cf6"><i class="fa fa-calendar-check"></i></div>
                        <div>
                          <div class="mega-item-title">Events & Holidays</div>
                          <div class="mega-item-desc">Gazetted holidays & workshops</div>
                        </div>
                      </div>
                    </div>

                    <!-- Column 4: Governance & Intelligence -->
                    <div class="mega-menu-col">
                      <div class="mega-col-title"><i class="fa fa-shield-halved text-danger"></i> Governance</div>
                      <div class="mega-item" onclick="Landing.showModule('dashboard')">
                        <div class="mega-item-icon" style="background:#eff6ff;color:#2563eb"><i class="fa fa-gauge-high"></i></div>
                        <div>
                          <div class="mega-item-title">Executive Dashboard</div>
                          <div class="mega-item-desc">Real-time KPI telemetry</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('reports')">
                        <div class="mega-item-icon" style="background:#eef2ff;color:#6366f1"><i class="fa fa-file-chart-column"></i></div>
                        <div>
                          <div class="mega-item-title">Analytics Reports</div>
                          <div class="mega-item-desc">Excel exports & compliance audits</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('administration')">
                        <div class="mega-item-icon" style="background:#f1f5f9;color:#475569"><i class="fa fa-gear"></i></div>
                        <div>
                          <div class="mega-item-title">HR Administration</div>
                          <div class="mega-item-desc">Official letters & clearances</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('settings')">
                        <div class="mega-item-icon" style="background:#f8fafc;color:#334155"><i class="fa fa-sliders"></i></div>
                        <div>
                          <div class="mega-item-title">System Settings</div>
                          <div class="mega-item-desc">Sync telemetry & audit logs</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <a href="#monitoring" class="landing-nav-link" onclick="Landing.scrollTo('monitoring');return false;">Monitoring</a>
              <a href="#pricing" class="landing-nav-link" onclick="Landing.scrollTo('pricing');return false;">Pricing</a>
              <a href="#about" class="landing-nav-link" onclick="Landing.scrollTo('about');return false;">About</a>
              <a href="#faq" class="landing-nav-link" onclick="Landing.scrollTo('faq');return false;">FAQ</a>
              <a href="#contact" class="landing-nav-link" onclick="Landing.openContactModal();return false;">Contact</a>
            </nav>

            <div class="landing-nav-actions">
              <button class="landing-btn-signin" onclick="App.showLogin()">
                <i class="fa fa-right-to-bracket"></i> Sign In
              </button>
              <button class="landing-btn-cta" onclick="App.showLogin()">
                Start Free Trial
              </button>
            </div>
          </div>
        </header>

        <!-- ─── 2. HERO SECTION (HIGH IMPACT SAAS) ─── -->
        <section class="landing-hero-section">
          <div class="landing-hero-grid">
            <!-- Left Hero Content -->
            <div class="landing-hero-content">
              <div class="landing-pill-badge">
                <i class="fa fa-sparkles" style="color:#2563eb"></i> Intelligent Workforce & HR Platform
              </div>

              <h1 class="landing-hero-title">
                Complete Visibility <br>For Your Modern Workforce <br>with <span class="text-gradient-blue">HRM Pro</span>
              </h1>

              <p class="landing-hero-sub">
                Automatically track time, verify biometric attendance, calculate statutory payroll, evaluate performance, and synchronize team records across all authorized devices with unmatched precision.
              </p>

              <div class="landing-cta-group">
                <button class="landing-hero-btn-primary" onclick="App.showLogin()">
                  Start Tracking <i class="fa fa-arrow-right"></i>
                </button>
                <button class="landing-hero-btn-secondary" onclick="Landing.showDemoModal()">
                  <i class="fa fa-play-circle" style="color:#2563eb;font-size:16px"></i> System Tour
                </button>
              </div>

              <div class="landing-trust-badges">
                <div class="landing-trust-item">
                  <i class="fa fa-shield-halved"></i>
                  <div>
                    <strong>Role-Based Access</strong>
                    <span>5 Specialized Portals</span>
                  </div>
                </div>
                <div class="landing-trust-item">
                  <i class="fa fa-rotate"></i>
                  <div>
                    <strong>Real-Time Sync</strong>
                    <span>Cross-device cloud database</span>
                  </div>
                </div>
                <div class="landing-trust-item">
                  <div class="trust-avatar-dot">
                    <img src="assets/avatars/sara_malik.jpg" onerror="this.src='https://ui-avatars.com/api/?name=Sara+Malik&background=0284c7&color=fff'" alt="HR Director">
                    <span class="online-indicator"></span>
                  </div>
                  <div>
                    <strong>Live Operations</strong>
                    <span>Sara Malik (HR Director)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Hero Visual Showcase (Dashboard Simulation) -->
            <div class="landing-hero-visual">
              <div class="hero-mockup-wrapper">
                <!-- Floating Card 1: Attendance Rate -->
                <div class="hero-floating-card floating-card-attendance" onclick="App.showModule('attendance')" style="cursor:pointer" title="Click to view Attendance Module details">
                  <div class="floating-icon-wrap" style="background:#eff6ff;color:#2563eb">
                    <i class="fa fa-chart-column"></i>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#64748b;font-weight:600">Attendance Rate</div>
                    <div style="font-size:18px;font-weight:800;color:#0f172a">96.2%</div>
                    <div style="font-size:10.5px;color:#10b981;font-weight:600"><i class="fa fa-arrow-trend-up"></i> Live Biometric Sync</div>
                  </div>
                </div>

                <!-- Floating Card 2: Payroll Processed -->
                <div class="hero-floating-card floating-card-payroll" onclick="App.showModule('payroll')" style="cursor:pointer" title="Click to view Payroll Module details">
                  <div class="floating-icon-wrap" style="background:#fdf4ff;color:#a855f7">
                    <i class="fa fa-coins"></i>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#64748b;font-weight:600">Monthly Payroll</div>
                    <div style="font-size:17px;font-weight:800;color:#0f172a">PKR 3.45M</div>
                    <div style="font-size:10.5px;color:#10b981;font-weight:600"><i class="fa fa-check-double"></i> 100% Tax Compliant</div>
                  </div>
                </div>

                <!-- Central Dashboard Card Simulation -->
                <div class="hero-dashboard-mockup">
                  <div class="mockup-topbar">
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="mockup-brand-badge"><i class="fa fa-users-gear"></i> HRM Pro</div>
                      <span style="font-size:12px;font-weight:600;color:#334155">Good morning, Ahmed! 👋</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                      <span style="font-size:12px;color:#64748b">Executive Overview</span>
                      <div style="width:26px;height:26px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#475569;font-size:11px"><i class="fa fa-user-shield"></i></div>
                    </div>
                  </div>

                  <div class="mockup-metrics-grid">
                    <div class="mockup-metric-card" onclick="App.showModule('employees')">
                      <span class="m-label">Total Workforce</span>
                      <span class="m-value">${totalEmps}</span>
                      <span class="m-sub text-success"><i class="fa fa-user-check"></i> Active Master Files</span>
                    </div>
                    <div class="mockup-metric-card" onclick="App.showModule('attendance')">
                      <span class="m-label">Present Today</span>
                      <span class="m-value">${presentToday}</span>
                      <span class="m-sub text-primary"><i class="fa fa-fingerprint"></i> Biometric Verified</span>
                    </div>
                    <div class="mockup-metric-card" onclick="App.showModule('leaves')">
                      <span class="m-label">Pending Leaves</span>
                      <span class="m-value">${pendingLeaves}</span>
                      <span class="m-sub text-warning"><i class="fa fa-hourglass-half"></i> 2-Tier Queues</span>
                    </div>
                    <div class="mockup-metric-card" onclick="App.showModule('recruitment')">
                      <span class="m-label">Open Positions</span>
                      <span class="m-value">${openJobs}</span>
                      <span class="m-sub text-info"><i class="fa fa-briefcase"></i> Active Vacancies</span>
                    </div>
                  </div>

                  <div class="mockup-chart-box">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                      <span style="font-size:11.5px;font-weight:700;color:#334155"><i class="fa fa-wave-pulse" style="color:#2563eb"></i> Monthly Department Attendance Velocity</span>
                      <span style="font-size:10.5px;color:#64748b">Multi-Branch Sync</span>
                    </div>
                    <div class="mockup-bars">
                      <div class="m-bar-col"><div class="m-bar" style="height:70%"></div><span>IT</span></div>
                      <div class="m-bar-col"><div class="m-bar" style="height:92%"></div><span>HR</span></div>
                      <div class="m-bar-col"><div class="m-bar" style="height:85%"></div><span>Fin</span></div>
                      <div class="m-bar-col"><div class="m-bar" style="height:78%"></div><span>Mkt</span></div>
                      <div class="m-bar-col"><div class="m-bar" style="height:88%"></div><span>Ops</span></div>
                      <div class="m-bar-col"><div class="m-bar" style="height:95%"></div><span>Exec</span></div>
                    </div>
                  </div>
                </div>

                <div class="hero-illustration-lady">
                  <div class="avatar-lady-badge">
                    <i class="fa fa-user-tie" style="font-size:32px;color:#2563eb"></i>
                  </div>
                </div>

                <div class="hero-illustration-man">
                  <div class="avatar-man-badge">
                    <i class="fa fa-laptop-code" style="font-size:32px;color:#0284c7"></i>
                  </div>
                  <div class="hero-small-pill">
                    <i class="fa fa-database" style="color:#2563eb"></i> Real-Time Synced
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 3. CORE PILLARS ("EVERYTHING YOU NEED") ─── -->
        <section class="landing-features-section" id="features">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-cubes"></i> Core Platform Capabilities
            </div>
            <h2 class="landing-section-title">Everything you need to monitor remote work and verify hours with absolute confidence</h2>
            <p class="landing-section-sub">Comprehensive enterprise features with flexible options for accurate workforce monitoring.</p>
          </div>

          <div class="landing-pillars-detailed-grid">
            <!-- 1. Time Tracking -->
            <div class="pillar-detailed-card" onclick="Landing.showModule('attendance')">
              <div class="pillar-card-icon" style="background:#eff6ff;color:#2563eb">
                <i class="fa fa-clock"></i>
              </div>
              <h3 class="pillar-card-title">Time Tracking & Biometrics</h3>
              <p class="pillar-card-desc">Comprehensive time tracking solution with flexible options for accurate work monitoring.</p>
              <ul class="pillar-feature-list">
                <li><i class="fa fa-check-circle"></i> One-click start/stop check-in timer & biometric gateway</li>
                <li><i class="fa fa-check-circle"></i> Timesheet edits with 2-tier managerial approvals</li>
                <li><i class="fa fa-check-circle"></i> Real-time multi-branch attendance tracking</li>
              </ul>
              <div class="pillar-card-action">Learn more <i class="fa fa-arrow-right"></i></div>
            </div>

            <!-- 2. Reports & Insights -->
            <div class="pillar-detailed-card" onclick="Landing.showModule('reports')">
              <div class="pillar-card-icon" style="background:#f0fdf4;color:#16a34a">
                <i class="fa fa-chart-pie"></i>
              </div>
              <h3 class="pillar-card-title">Reports & Insights</h3>
              <p class="pillar-card-desc">Detailed analytics and reporting for better business decisions and productivity insights.</p>
              <ul class="pillar-feature-list">
                <li><i class="fa fa-check-circle"></i> Real-time reports per user, department, or client project</li>
                <li><i class="fa fa-check-circle"></i> Exportable summaries for statutory billing and payroll</li>
                <li><i class="fa fa-check-circle"></i> Custom report generation with Excel/PDF compliance exports</li>
              </ul>
              <div class="pillar-card-action">Learn more <i class="fa fa-arrow-right"></i></div>
            </div>

            <!-- 3. Productivity Monitoring -->
            <div class="pillar-detailed-card" onclick="Landing.showModule('performance')">
              <div class="pillar-card-icon" style="background:#faf5ff;color:#9333ea">
                <i class="fa fa-gauge-high"></i>
              </div>
              <h3 class="pillar-card-title">Productivity Monitoring</h3>
              <p class="pillar-card-desc">Advanced monitoring tools to track team velocity, milestones, and ensure accountability.</p>
              <ul class="pillar-feature-list">
                <li><i class="fa fa-check-circle"></i> OKR and KPI target tracking with real-time scoring</li>
                <li><i class="fa fa-check-circle"></i> Shift grace buffers, late penalizations & overtime tokens</li>
                <li><i class="fa fa-check-circle"></i> Structured 360-degree appraisal cycles and merit records</li>
              </ul>
              <div class="pillar-card-action">Learn more <i class="fa fa-arrow-right"></i></div>
            </div>

            <!-- 4. Workforce DMS & Personnel -->
            <div class="pillar-detailed-card" onclick="Landing.showModule('employees')">
              <div class="pillar-card-icon" style="background:#fffbeb;color:#d97706">
                <i class="fa fa-users"></i>
              </div>
              <h3 class="pillar-card-title">Workforce Directory & e-DMS</h3>
              <p class="pillar-card-desc">Centralized personnel profiles and encrypted digital document safe for enterprise compliance.</p>
              <ul class="pillar-feature-list">
                <li><i class="fa fa-check-circle"></i> 360° personnel files with CNIC, emergency & bank details</li>
                <li><i class="fa fa-check-circle"></i> Automated 30/60/90-day contract and visa expiry radar</li>
                <li><i class="fa fa-check-circle"></i> Complete organizational hierarchy trees and branch mapping</li>
              </ul>
              <div class="pillar-card-action">Learn more <i class="fa fa-arrow-right"></i></div>
            </div>
          </div>
        </section>

        <!-- ─── 4. HOW IT WORKS (STREAMLINED WORKFLOW) ─── -->
        <section class="landing-workflow-section" id="how-it-works">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-bolt"></i> Streamlined 4-Step Process
            </div>
            <h2 class="landing-section-title">Get started in minutes with our streamlined workflow</h2>
            <p class="landing-section-sub">From organization onboarding to automated statutory payroll and real-time audit reports.</p>
          </div>

          <div class="how-it-works-grid">
            <!-- Step 1 -->
            <div class="how-step-card">
              <div class="step-num-badge">01</div>
              <div class="step-icon-wrap" style="color:#2563eb;background:#eff6ff">
                <i class="fa fa-sitemap"></i>
              </div>
              <h3 class="step-card-title">Configure Roles & Positions</h3>
              <p class="step-card-desc">Create roles and positions, then organize branches and departments with structured permissions to ensure efficient governance.</p>
            </div>

            <!-- Step 2 -->
            <div class="how-step-card">
              <div class="step-num-badge">02</div>
              <div class="step-icon-wrap" style="color:#10b981;background:#ecfdf5">
                <i class="fa fa-fingerprint"></i>
              </div>
              <h3 class="step-card-title">Track Time & Attendance</h3>
              <p class="step-card-desc">Team members check in via physical biometric scanners or digital web terminals with automated grace-period validations.</p>
            </div>

            <!-- Step 3 -->
            <div class="how-step-card">
              <div class="step-num-badge">03</div>
              <div class="step-icon-wrap" style="color:#9333ea;background:#faf5ff">
                <i class="fa fa-calculator"></i>
              </div>
              <h3 class="step-card-title">Review Timesheets & Payroll</h3>
              <p class="step-card-desc">Managers review detailed timesheets, approve leave quotas, and calculate tax-compliant statutory payroll in a single click.</p>
            </div>

            <!-- Step 4 -->
            <div class="how-step-card">
              <div class="step-num-badge">04</div>
              <div class="step-icon-wrap" style="color:#d97706;background:#fffbeb">
                <i class="fa fa-file-invoice"></i>
              </div>
              <h3 class="step-card-title">Generate Reports & Invoices</h3>
              <p class="step-card-desc">Convert approved time entries into official salary slips, bank transfer files, and executive audit reports with one click.</p>
            </div>
          </div>
        </section>

        <!-- ─── 5. REAL-TIME MONITORING & INTELLIGENCE ─── -->
        <section class="landing-monitoring-section" id="monitoring">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-shield-halved"></i> Enterprise Analytics
            </div>
            <h2 class="landing-section-title">Make informed decisions with comprehensive analytics, real-time tracking, and detailed reporting</h2>
            <p class="landing-section-sub">Go beyond basic tracking with advanced real-time monitoring and multi-dimensional insights.</p>
          </div>

          <div class="monitoring-dual-grid">
            <div class="monitoring-card">
              <div class="monitoring-card-icon" style="color:#2563eb;background:#eff6ff">
                <i class="fa fa-chart-line"></i>
              </div>
              <h3 class="monitoring-title">Advanced Real-Time Monitoring</h3>
              <p class="monitoring-desc">Go beyond basic tracking with advanced real-time monitoring, live productivity scoring, and automated event sync across all devices.</p>
              <ul class="monitoring-list">
                <li><i class="fa fa-check"></i> Real-time productivity scoring across departments</li>
                <li><i class="fa fa-check"></i> Multi-location team monitoring and biometric status</li>
                <li><i class="fa fa-check"></i> Atomic monotonic event stream with zero data loss</li>
              </ul>
            </div>

            <div class="monitoring-card">
              <div class="monitoring-card-icon" style="color:#0284c7;background:#f0f9ff">
                <i class="fa fa-filter"></i>
              </div>
              <h3 class="monitoring-title">Intelligent Data Segmentation</h3>
              <p class="monitoring-desc">Advanced filtering capabilities for deep insights across multiple organizational dimensions, branches, and custom date segments.</p>
              <ul class="monitoring-list">
                <li><i class="fa fa-check"></i> Multi-dimensional filtering by branch, role, or tenure</li>
                <li><i class="fa fa-check"></i> Custom segment creation for payroll and audit groups</li>
                <li><i class="fa fa-check"></i> Advanced date range analysis and historical comparisons</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ─── 6. TRANSPARENT PRICING & TIERS ─── -->
        <section class="landing-pricing-section" id="pricing">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-tags"></i> Transparent Plans
            </div>
            <h2 class="landing-section-title">Choose the perfect plan for your team</h2>
            <p class="landing-section-sub">From startups to global enterprises, we have got your workforce covered.</p>
          </div>

          <div class="pricing-cards-grid">
            <!-- Free / Community Plan -->
            <div class="pricing-card">
              <div class="pricing-card-header">
                <h3 class="plan-name">Community Free</h3>
                <p class="plan-desc">Perfect for small teams and startups testing modern HR.</p>
                <div class="plan-price">
                  <span class="price-val">$0</span>
                  <span class="price-period">/ forever</span>
                </div>
              </div>
              <div class="plan-highlights">
                <div class="highlight-item"><i class="fa fa-users"></i> Up to 25 Employees</div>
                <div class="highlight-item"><i class="fa fa-calendar-check"></i> Attendance & Leaves</div>
                <div class="highlight-item"><i class="fa fa-database"></i> 90 Days Data Retention</div>
              </div>
              <button class="btn-plan-action btn-outline" onclick="App.showLogin()">Get Started Free</button>
            </div>

            <!-- Starter Plan -->
            <div class="pricing-card">
              <div class="pricing-card-header">
                <h3 class="plan-name">Starter</h3>
                <p class="plan-desc">Ideal for growing businesses needing automated operations.</p>
                <div class="plan-price">
                  <span class="price-val">$29</span>
                  <span class="price-period">/ month</span>
                </div>
              </div>
              <div class="plan-highlights">
                <div class="highlight-item"><i class="fa fa-users"></i> Up to 100 Employees</div>
                <div class="highlight-item"><i class="fa fa-money-bill-wave"></i> Statutory Payroll & Tax</div>
                <div class="highlight-item"><i class="fa fa-database"></i> 365 Days Data Retention</div>
              </div>
              <button class="btn-plan-action btn-outline" onclick="App.showLogin()">Choose Starter</button>
            </div>

            <!-- Pro AI (Featured) -->
            <div class="pricing-card featured">
              <div class="pricing-popular-badge">Most Popular</div>
              <div class="pricing-card-header">
                <h3 class="plan-name">Pro Enterprise</h3>
                <p class="plan-desc">Advanced workforce monitoring and intelligence for professional teams.</p>
                <div class="plan-price">
                  <span class="price-val">$79</span>
                  <span class="price-period">/ month</span>
                </div>
              </div>
              <div class="plan-highlights">
                <div class="highlight-item"><i class="fa fa-users"></i> Up to 500 Employees</div>
                <div class="highlight-item"><i class="fa fa-chart-pie"></i> Performance OKRs & Recruitment ATS</div>
                <div class="highlight-item"><i class="fa fa-rotate"></i> Real-Time Multi-Device Live Sync</div>
                <div class="highlight-item"><i class="fa fa-database"></i> 720 Days Data Retention</div>
              </div>
              <button class="btn-plan-action btn-primary" onclick="App.showLogin()">Start Free Pro Trial</button>
            </div>

            <!-- Enterprise Custom -->
            <div class="pricing-card">
              <div class="pricing-card-header">
                <h3 class="plan-name">Enterprise / Custom</h3>
                <p class="plan-desc">Tailored enterprise solution for large-scale corporations.</p>
                <div class="plan-price">
                  <span class="price-val">Custom</span>
                  <span class="price-period">/ tailored SLA</span>
                </div>
              </div>
              <div class="plan-highlights">
                <div class="highlight-item"><i class="fa fa-building"></i> Unlimited Branches & Seats</div>
                <div class="highlight-item"><i class="fa fa-fingerprint"></i> Biometric Hardware Gateway API</div>
                <div class="highlight-item"><i class="fa fa-cubes"></i> 103-Model Architecture Blueprint</div>
                <div class="highlight-item"><i class="fa fa-shield-halved"></i> Dedicated Support & Audit SLA</div>
              </div>
              <button class="btn-plan-action btn-outline" onclick="Landing.openContactModal()">Contact Enterprise</button>
            </div>
          </div>
        </section>

        <!-- ─── 7. ABOUT & CORE VALUES ─── -->
        <section class="landing-about-section" id="about">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-heart"></i> Mission & Values
            </div>
            <h2 class="landing-section-title">Empowering organizations worldwide with transparency, accountability, and real-time insights</h2>
            <p class="landing-section-sub">We believe that great work happens when teams have the right tools to stay connected and productive.</p>
          </div>

          <div class="about-values-grid">
            <div class="about-value-box">
              <div class="value-icon-wrap" style="color:#2563eb;background:#eff6ff"><i class="fa fa-eye"></i></div>
              <h4>Transparency</h4>
              <p>Clear insights and honest reporting for better organizational decision making.</p>
            </div>

            <div class="about-value-box">
              <div class="value-icon-wrap" style="color:#10b981;background:#ecfdf5"><i class="fa fa-users-line"></i></div>
              <h4>Team First</h4>
              <p>Built for teams of all sizes, from startups to enterprises, with intuitive self-service at the core.</p>
            </div>

            <div class="about-value-box">
              <div class="value-icon-wrap" style="color:#9333ea;background:#faf5ff"><i class="fa fa-shield-check"></i></div>
              <h4>Trusted Platform</h4>
              <p>Enterprise-grade security, TLS 1.3 encryption, and immutable audit logs you depend on daily.</p>
            </div>

            <div class="about-value-box">
              <div class="value-icon-wrap" style="color:#d97706;background:#fffbeb"><i class="fa fa-trophy"></i></div>
              <h4>Excellence</h4>
              <p>Committed to delivering unmatched speed, zero data loss, and seamless multi-device replication.</p>
            </div>
          </div>
        </section>

        <!-- ─── 8. FREQUENTLY ASKED QUESTIONS (ACCORDION) ─── -->
        <section class="landing-faq-section" id="faq">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-circle-question"></i> Help & Clarity
            </div>
            <h2 class="landing-section-title">Frequently Asked Questions</h2>
            <p class="landing-section-sub">Everything you need to know about HRM Pro. Can't find the answer? Reach out to our team.</p>
          </div>

          <div class="landing-faq-container">
            <div class="landing-faq-item active" id="faq-item-0" onclick="Landing.toggleFaq(0)">
              <div class="faq-question">
                <span>Does HRM Pro support real-time cross-device synchronization?</span>
                <i class="fa fa-chevron-down faq-chevron"></i>
              </div>
              <div class="faq-answer">
                Yes! HRM Pro utilizes a high-performance central Server-Sent Events (SSE) stream combined with BroadcastChannel. When an employee logs leave, an HR manager approves attendance, or an admin changes a role, all connected devices update immediately with zero manual refresh needed.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-1" onclick="Landing.toggleFaq(1)">
              <div class="faq-question">
                <span>Can we integrate physical biometric attendance machines?</span>
                <i class="fa fa-chevron-down faq-chevron"></i>
              </div>
              <div class="faq-answer">
                Absolutely. HRM Pro features an automated biometric attendance gateway supporting physical fingerprint and facial-recognition hardware terminals. Clock-in timestamps are processed with configurable arrival grace buffers and feed directly into statutory payroll calculations.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-2" onclick="Landing.toggleFaq(2)">
              <div class="faq-question">
                <span>How are payroll taxes and deductions computed?</span>
                <i class="fa fa-chevron-down faq-chevron"></i>
              </div>
              <div class="faq-answer">
                Our statutory payroll engine applies accurate multi-tier income tax slabs, provincial EOBI contributions, social security, and custom allowances/deductions automatically. You can export verified payslips and bank transfer ledgers with a single click.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-3" onclick="Landing.toggleFaq(3)">
              <div class="faq-question">
                <span>How does role-based access control (RBAC) work?</span>
                <i class="fa fa-chevron-down faq-chevron"></i>
              </div>
              <div class="faq-answer">
                HRM Pro provides 5 dedicated role portals (Super Admin, HR Director, Dept Manager, Employee, and Onboarding). Each role is strictly scoped to authorized views. Managers can only view their own department teams, while employees have self-service access to their personal profiles, leaves, and payslips.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-4" onclick="Landing.toggleFaq(4)">
              <div class="faq-question">
                <span>Can we customize our company financial currency and language?</span>
                <i class="fa fa-chevron-down faq-chevron"></i>
              </div>
              <div class="faq-answer">
                Yes! Administrators can configure the company's financial currency (8 supported currencies including PKR, USD, EUR, GBP, AED, SAR, CAD, and INR) and operating language (including English, Urdu [RTL], Arabic [RTL], Spanish, French, German, and Chinese) in Company Profile Settings.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-5" onclick="Landing.toggleFaq(5)">
              <div class="faq-question">
                <span>Is our organizational data encrypted and backed up?</span>
                <i class="fa fa-chevron-down faq-chevron"></i>
              </div>
              <div class="faq-answer">
                Yes. All communications are secured over TLS 1.3 encryption. In addition, the central store maintains atomic monotonic versioning with automated disk snapshots, full JSON backups, and an immutable administrative audit log.
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 9. BOTTOM CTA CONVERSION BANNER ─── -->
        <section class="landing-cta-banner-section">
          <div class="landing-cta-banner">
            <div class="cta-banner-left">
              <div class="cta-illustration-icon">
                <i class="fa fa-shield-heart" style="font-size:38px;color:#2563eb"></i>
              </div>
              <div>
                <h2 class="cta-banner-title">Ready to transform your Workforce & Productivity?</h2>
                <p class="cta-banner-sub">Join forward-thinking companies using HRM Pro to verify hours, automate payroll, and ensure complete institutional peace of mind.</p>
              </div>
            </div>

            <div class="cta-banner-right">
              <button class="landing-btn-banner-action" onclick="App.showLogin()">
                Start Free Trial <i class="fa fa-arrow-right"></i>
              </button>
              <div class="cta-banner-disclaimer">
                5 Specialized Role Portals • Central Real-Time Database
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 10. MODERN ENTERPRISE FOOTER ─── -->
        <footer class="landing-footer">
          <div class="landing-footer-inner">
            <div class="footer-col-brand">
              <div class="landing-brand" style="margin-bottom:10px">
                <div class="landing-brand-icon" style="background:#2563eb;color:#ffffff;border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px"><i class="fa fa-users"></i></div>
                <div>
                  <div class="landing-brand-name">HRM Pro</div>
                  <div class="landing-brand-tag">Human Resource Information System</div>
                </div>
              </div>
              <p style="font-size:12.5px;color:#64748b;line-height:1.6;max-width:320px">
                Enterprise workforce management, biometric attendance, statutory payroll compliance, and multi-device real-time cloud synchronization.
              </p>
            </div>

            <div class="footer-links-grid">
              <div class="footer-col">
                <h4>Product</h4>
                <a href="#features" onclick="Landing.scrollTo('features');return false;">Time & Attendance</a>
                <a href="#how-it-works" onclick="Landing.scrollTo('how-it-works');return false;">How It Works</a>
                <a href="#monitoring" onclick="Landing.scrollTo('monitoring');return false;">Live Monitoring</a>
                <a href="#pricing" onclick="Landing.scrollTo('pricing');return false;">Deployment Pricing</a>
              </div>

              <div class="footer-col">
                <h4>Core Modules</h4>
                <a href="#" onclick="Landing.showModule('employees');return false;">Employees & e-DMS</a>
                <a href="#" onclick="Landing.showModule('attendance');return false;">Attendance & Shifts</a>
                <a href="#" onclick="Landing.showModule('payroll');return false;">Payroll & Taxes</a>
                <a href="#" onclick="Landing.showModule('recruitment');return false;">Recruitment ATS</a>
              </div>

              <div class="footer-col">
                <h4>Company</h4>
                <a href="#about" onclick="Landing.scrollTo('about');return false;">About Us</a>
                <a href="#about" onclick="Landing.scrollTo('about');return false;">Mission & Values</a>
                <a href="#faq" onclick="Landing.scrollTo('faq');return false;">FAQ</a>
                <a href="#contact" onclick="Landing.openContactModal();return false;">Contact Support</a>
              </div>

              <div class="footer-col">
                <h4>Quick Portal Access</h4>
                <a href="#" onclick="Login.quickLogin('admin','admin123');return false;">Super Admin</a>
                <a href="#" onclick="Login.quickLogin('sara.malik','hr123');return false;">HR Director</a>
                <a href="#" onclick="Login.quickLogin('usman.baig','mgr123');return false;">Dept Manager</a>
                <a href="#" onclick="Login.quickLogin('fatima.raza','emp123');return false;">Employee</a>
              </div>
            </div>
          </div>

          <div class="landing-footer-bottom">
            <div>© 2026 HRM Pro. All rights reserved. Enterprise Cloud Edition.</div>
            <div style="display:flex;gap:18px">
              <a href="#" onclick="return false;">Privacy Policy</a>
              <a href="#" onclick="return false;">Terms of Service</a>
              <a href="#" onclick="return false;">Security Protocols</a>
            </div>
          </div>
        </footer>
      </div>
    `;
  },

  toggleFaq(index) {
    const item = document.getElementById(`faq-item-${index}`);
    if (!item) return;
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.landing-faq-item').forEach(el => el.classList.remove('active'));
    if (!wasActive) {
      item.classList.add('active');
    }
  },

  scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  },

  showDemoModal() {
    Modal.show({
      title: 'HRM Pro Interactive System Tour',
      body: `
        <div style="text-align:center;padding:16px 8px">
          <div style="width:64px;height:64px;border-radius:18px;background:rgba(37,99,235,0.1);color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px auto">
            <i class="fa fa-sparkles"></i>
          </div>
          <h3 style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:8px">Experience HRM Pro Live</h3>
          <p style="font-size:13.5px;color:var(--text-2);max-width:440px;margin:0 auto 20px auto;line-height:1.5">
            Explore all 14 enterprise modules with live multi-device synchronization, role-based controls, and automated statutory payroll.
          </p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
            <div style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-align:left;cursor:pointer" onclick="Modal.closeAll();App.showModule('dashboard')">
              <div style="font-weight:700;font-size:13px;color:#2563eb"><i class="fa fa-user-shield"></i> Super Admin</div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">Full organization mastery</div>
            </div>
            <div style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-align:left;cursor:pointer" onclick="Modal.closeAll();App.showModule('employees')">
              <div style="font-weight:700;font-size:13px;color:#10b981"><i class="fa fa-user-tie"></i> HR Director</div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">Recruitment, Payroll, Leaves</div>
            </div>
            <div style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-align:left;cursor:pointer" onclick="Modal.closeAll();App.showModule('leaves')">
              <div style="font-weight:700;font-size:13px;color:#a855f7"><i class="fa fa-user"></i> Employee</div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">Self-service & requests</div>
            </div>
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%;font-weight:700" onclick="Modal.closeAll();App.showLogin()">
            Launch Interactive Portal <i class="fa fa-arrow-right" style="margin-left:6px"></i>
          </button>
        </div>
      `
    });
  },

  openContactModal() {
    Modal.show({
      title: 'Contact HRM Pro Enterprise Solutions',
      body: `
        <div style="padding:10px">
          <p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">
            Need custom biometric hardware integration, multi-branch database replication, or statutory payroll configuration?
          </p>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-control" placeholder="e.g. Tariq Mehmood" id="contact-name">
          </div>
          <div class="form-group">
            <label class="form-label">Corporate Email</label>
            <input type="email" class="form-control" placeholder="tariq@company.com" id="contact-email">
          </div>
          <div class="form-group">
            <label class="form-label">Message / Requirements</label>
            <textarea class="form-control" rows="3" placeholder="Tell us about your organization size and specific requirements..."></textarea>
          </div>
          <button class="btn btn-primary" style="width:100%" onclick="Modal.closeAll();Toast.show('Thank you! Our enterprise solutions team will contact you shortly.','success')">
            Submit Inquiry
          </button>
        </div>
      `
    });
  }
};

window.Landing = Landing;
