// ============================================================
// HRM SYSTEM — Modern SaaS Landing Page (HRM Pro)
// ============================================================

const Landing = {
  // ─── Complete Metadata for all 14 HRM Pro Modules ───
  modulesData: {
    training: {
      id: 'training',
      title: 'Training & Learning Management (LMS)',
      subtitle: 'Schedule employee training courses, track nominations, log attendance, and measure skills & certifications.',
      category: 'Talent & Development',
      icon: 'fa-graduation-cap',
      color: '#0891b2',
      bgLight: '#ecfeff',
      recommendedRole: 'hr',
      capabilities: [
        {
          title: 'Training Course Catalog',
          desc: 'Manage internal and external training programs with defined agendas, prerequisites, and learning outcomes.',
          icon: 'fa-book-bookmark'
        },
        {
          title: 'Training Calendar & Scheduler',
          desc: 'Schedule upcoming workshops, webinars, and on-site training sessions with automated employee invites.',
          icon: 'fa-calendar-days'
        },
        {
          title: 'Nomination & Attendance Tracking',
          desc: 'Managerial nominations, enrollment approvals, and barcode/QR verification of session attendance.',
          icon: 'fa-user-check'
        },
        {
          title: 'Skill Matrix & Certification Safe',
          desc: 'Track employee skills proficiency, upload completion certificates, and monitor certification expiries.',
          icon: 'fa-award'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'LMS Policy Control', desc: 'Configure training budgets, course categories, and vendor accreditations.' },
        { role: 'HR Director', access: 'Full Program Manager', desc: 'Create workshops, approve nominations, issue certificates, and track training ROI.' },
        { role: 'Dept Manager', access: 'Team Nominations', desc: 'Nominate subordinates for technical or leadership training programs.' },
        { role: 'Employee', access: 'Learning Portal', desc: 'Browse available courses, enroll in programs, and download certificates.' }
      ],
      related: ['performance', 'employees', 'administration']
    },
    employees: {
      id: 'employees',
      title: 'Employee Lifecycle & Digital Documents (e-DMS)',
      subtitle: '4 Clean Lifecycle Stages: Directory Roster, e-DMS Vault, Letters & Disciplinary Hub, and Life Events & Exit Settlements (F&F).',
      category: 'Core Workforce',
      icon: 'fa-users',
      color: '#2563eb',
      bgLight: '#eff6ff',
      recommendedRole: 'hr',
      capabilities: [
        {
          title: 'Stage 1: 360° Directory & Hierarchy',
          desc: 'Manage complete personal data, national CNIC/ID, blood group, emergency contacts, branch hierarchy trees, and reporting lines.',
          icon: 'fa-id-card'
        },
        {
          title: 'Stage 2: Digital Document Vault (e-DMS)',
          desc: 'Upload educational degrees, signed contracts, and experience letters with 30/60/90-day automated expiry alert triggers.',
          icon: 'fa-file-shield'
        },
        {
          title: 'Stage 3: Letters & Disciplinary Hub',
          desc: 'Official appointment letters, experience certificates, warning letters, show-cause notices, and employee response tracking.',
          icon: 'fa-file-signature'
        },
        {
          title: 'Stage 4: Life Events & Exit Settlements (F&F)',
          desc: 'Dependents records, multi-gate exit clearance handover, and statutory Pakistan 30/26 Gratuity Full & Final (F&F) settlement vouchers.',
          icon: 'fa-door-open'
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
    },
    company: {
      id: 'company',
      title: 'Multi-Company & Corporate Holding Structure',
      subtitle: 'Model A corporate holding structure, entity switcher, legal entity scoping, and consolidated group telemetry.',
      category: 'Governance & Holding Structure',
      icon: 'fa-building-columns',
      color: '#0284c7',
      bgLight: '#f0f9ff',
      recommendedRole: 'admin',
      capabilities: [
        {
          title: 'Parent & Subsidiary Holding Hierarchy',
          desc: 'Manage parent holding corporations and individual legal entities with separate NTNs, SECP registration numbers, and disbursement bank accounts.',
          icon: 'fa-sitemap'
        },
        {
          title: 'Global Multi-Entity Switcher',
          desc: 'Seamless single login with top-level company switcher. Switch between Apex Technologies, Apex Digital, or view "All Holdings" in 1 click.',
          icon: 'fa-arrows-rotate'
        },
        {
          title: 'Smart Scoping & Role Isolation',
          desc: 'Subsidiary HR managers are strictly scoped to their assigned legal entity, while Super Admins command consolidated holding-wide authority.',
          icon: 'fa-shield-halved'
        },
        {
          title: 'Consolidated Executive Telemetry',
          desc: 'Executive portfolio cards summarizing cross-subsidiary workforce headcounts, attendance rates, and combined monthly payroll liabilities.',
          icon: 'fa-chart-pie'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Complete Holding Authority', desc: 'Manage all companies, legal entities, NTN profiles, entity switcher, and consolidated executive reports.' },
        { role: 'HR Director', access: 'Assigned Entity Scoped', desc: 'Complete HR management scoped exclusively to their designated legal subsidiary.' },
        { role: 'Dept Manager', access: 'Departmental Access', desc: 'Departmental staff management within their designated company.' },
        { role: 'Employee', access: 'Company Mapped Portal', desc: 'Self-service portal automatically mapped to their legal employer entity.' }
      ],
      related: ['administration', 'dashboard', 'payroll', 'settlement']
    },

    settlement: {
      id: 'settlement',
      title: 'Statutory Gratuity & Full and Final (F&F) Settlement Engine',
      subtitle: 'Automated 30/26 Gratuity Engine, Leave Encashment, Multi-Gate Clearances, and Audit-Ready Vouchers.',
      category: 'Exit & Statutory Compliance',
      icon: 'fa-handshake-simple',
      color: '#7c3aed',
      bgLight: '#faf5ff',
      recommendedRole: 'hr',
      capabilities: [
        {
          title: 'Statutory Gratuity Calculation (30/26 Rule)',
          desc: 'Implements official Industrial & Commercial Employment Ordinance: (Basic Salary × Years × 30) / 26 with automated ≥6 months tenure rounding.',
          icon: 'fa-calculator'
        },
        {
          title: 'Multi-Gate Departmental Clearances',
          desc: 'Digital clearance workflows across IT (laptops, credentials), Admin (access cards, keys), and Finance (loans, salary advances).',
          icon: 'fa-list-check'
        },
        {
          title: 'Leave Encashment & Notice Period Pay',
          desc: 'Automatic computation of unavailed earned leaves and compensation/deduction for notice period buyout.',
          icon: 'fa-coins'
        },
        {
          title: 'Official F&F Settlement Vouchers',
          desc: 'Print-ready and PDF exportable exit settlement vouchers with itemized gross earnings, statutory deductions, and dual sign-offs.',
          icon: 'fa-file-invoice-dollar'
        }
      ],
      roleMatrix: [
        { role: 'Super Admin', access: 'Master Exit Authority', desc: 'Full configuration of gratuity rules, approval overrides, audit trail, and payout disbursements.' },
        { role: 'HR Director', access: 'Settlement Processing', desc: 'Initiate exit requests, compute statutory gratuity, review clearances, and generate F&F statements.' },
        { role: 'Dept Manager', access: 'Clearance Sign-Off', desc: 'Verify handover of departmental assets, project responsibilities, and team transitions.' },
        { role: 'Employee', access: 'Transparent Statement', desc: 'View itemized breakdown of final dues, gratuity calculation, and clearance progress.' }
      ],
      related: ['payroll', 'leaves', 'assets', 'company']
    },

  },

  toggleModulesMenu(e) {
    if (e) e.stopPropagation();
    this.closeResourcesMenu();
    const menu = document.getElementById('landing-mega-menu');
    if (!menu) return;
    menu.classList.toggle('open');
  },

  closeModulesMenu() {
    const menu = document.getElementById('landing-mega-menu');
    if (menu) menu.classList.remove('open');
  },

  toggleResourcesMenu(e) {
    if (e) e.stopPropagation();
    this.closeModulesMenu();
    const menu = document.getElementById('landing-resources-menu');
    const btn = document.getElementById('nav-resources-btn');
    if (!menu) return;
    menu.classList.toggle('open');
    const isOpen = menu.classList.contains('open');
    if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  },

  closeResourcesMenu() {
    const menu = document.getElementById('landing-resources-menu');
    const btn = document.getElementById('nav-resources-btn');
    if (menu) menu.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  },

  toggleMobileNav(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const drawer = document.getElementById('landing-mobile-drawer');
    if (!drawer) return;
    drawer.classList.toggle('open');
  },

  closeMobileNav() {
    const drawer = document.getElementById('landing-mobile-drawer');
    if (drawer) drawer.classList.remove('open');
  },

  closeAllMenus() {
    this.closeModulesMenu();
    this.closeResourcesMenu();
    this.closeMobileNav();
  },

  showModule(moduleId) {
    this.closeAllMenus();
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

    const savedTheme = localStorage.getItem('hrm_landing_theme') || 'dark';
    container.setAttribute('data-theme', savedTheme);

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
              <button class="landing-theme-toggle-btn" id="landing-theme-toggle-btn" onclick="Landing.toggleTheme()" title="${savedTheme === 'dark' ? 'Switch to Crisp Light Theme' : 'Switch to Obsidian Dark Theme'}" style="margin-right:4px">
                <i class="fa ${savedTheme === 'dark' ? 'fa-sun' : 'fa-moon'}" style="color:${savedTheme === 'dark' ? '#f59e0b' : '#6366f1'};font-size:15px"></i>
              </button>
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
              <button class="btn-module-primary" onclick="App.showLogin()">
                <i class="fa fa-arrow-up-right-from-square"></i> Sign In to Explore ${mod.title.split(' ')[0]}
              </button>
              <button class="btn-module-secondary" onclick="App.showLanding()">
                <i class="fa fa-arrow-left"></i> Back to Overview
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

  // Active state for interactive pillar tabs
  activePillar: 'people',

  // State for interactive tax & salary calculator (Official Tax Slabs 2026-27)
  taxCalcState: {
    gross: 150000,
    pfPct: 0,
    eobiAmount: 0,
    taxYear: '2026-2027'
  },


  toggleTheme() {
    const currentTheme = localStorage.getItem('hrm_landing_theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('hrm_landing_theme', newTheme);
    this.applyTheme(newTheme);
  },

  applyTheme(theme) {
    const landingEl = document.getElementById('landing-page');
    const detailEl = document.getElementById('module-detail-page');
    if (landingEl) landingEl.setAttribute('data-theme', theme);
    if (detailEl) detailEl.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    const wrappers = document.querySelectorAll('.landing-wrapper, .module-detail-page-wrapper');
    wrappers.forEach(w => w.setAttribute('data-theme', theme));

    const btns = document.querySelectorAll('.landing-theme-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = theme === 'dark' 
        ? '<i class="fa fa-sun" style="color:#f59e0b;font-size:16px"></i>' 
        : '<i class="fa fa-moon" style="color:#6366f1;font-size:16px"></i>';
      btn.title = theme === 'dark' ? 'Switch to Crisp Light Theme' : 'Switch to Obsidian Dark Theme';
    });
  },

  render() {
    const container = document.getElementById('landing-page');
    if (!container) return;
    const savedTheme = localStorage.getItem('hrm_landing_theme') || 'light';
    container.setAttribute('data-theme', savedTheme);
    const detailContainer = document.getElementById('module-detail-page');
    if (detailContainer) detailContainer.setAttribute('data-theme', savedTheme);

    // Live database counts
    const emps = (typeof DB !== 'undefined' && DB.get) ? (DB.get('employees') || []) : [];
    const att = (typeof DB !== 'undefined' && DB.get) ? (DB.get('attendance') || []) : [];
    const leaves = (typeof DB !== 'undefined' && DB.get) ? (DB.get('leave_requests') || []) : [];
    const jobs = (typeof DB !== 'undefined' && DB.get) ? (DB.get('recruitment') || []) : [];
    const depts = (typeof DB !== 'undefined' && DB.get) ? (DB.get('departments') || []) : [];
    const openJobsList = jobs.filter(j => j.status === 'active' || j.status === 'open');
    const openJobsCount = openJobsList.length;
    const uniqueDeptIds = [...new Set(openJobsList.map(j => j.departmentId))];
    const uniqueDepts = uniqueDeptIds.map(id => depts.find(d => d.id === id)).filter(Boolean);

    const todayStr = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : new Date().toISOString().slice(0, 10);
    const totalEmps = emps.length > 0 ? emps.length : 52;
    const presentToday = att.filter(a => a.date === todayStr && a.status === 'present').length || Math.min(totalEmps, 48);
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length || 6;
    const openJobs = openJobsCount;
    const loggedIn = typeof Auth !== 'undefined' && (typeof Auth.isLoggedIn === 'function' ? Auth.isLoggedIn() : !!Auth.user);

    container.innerHTML = `
      <div class="landing-wrapper" onclick="Landing.closeAllMenus()">
        
        <!-- ─── 0. TOP ANNOUNCEMENT BAR (MATCHING SCREENSHOT) ─── -->
        <div class="landing-top-announcement">
          <div class="landing-top-left">
            <i class="fa fa-sparkles"></i>
            <span>Enterprise Human Resource &amp; Payroll Management System</span>
            <span style="opacity:0.4;margin:0 6px">•</span>
            <span>99.98% Cloud Uptime</span>
            <span style="opacity:0.4;margin:0 6px">•</span>
            <span>Free 14-Day Enterprise Trial</span>
          </div>
          <div class="landing-top-right">
            <a href="tel:+18005554767" class="landing-top-contact-item"><i class="fa fa-phone"></i> +1 (800) 555-HRMPRO</a>
            <a href="mailto:enterprise@hrmpro.com" class="landing-top-contact-item"><i class="fa fa-envelope"></i> enterprise@hrmpro.com</a>
            <a href="#" onclick="Landing.showDemoModal();return false;" class="landing-top-demo-btn"><i class="fa fa-play-circle"></i> Book Live Demo</a>
          </div>
        </div>

        <!-- ─── 1. TOP NAVBAR WITH WARM CORAL ACCENTS ─── -->
        <header class="landing-header">
          <div class="landing-nav-container">
            <a href="#" class="landing-brand" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">
              <div class="landing-brand-icon">
                <i class="fa fa-users"></i>
              </div>
              <div>
                <div class="landing-brand-name">HRM Pro</div>
                <div class="landing-brand-tag">Enterprise Human Capital Platform</div>
              </div>
            </a>

            <!-- Desktop Nav Links -->
            <nav class="landing-nav-links desktop-only">
              <a href="#" class="landing-nav-link" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">Home</a>
              <a href="#modules-section" class="landing-nav-link" onclick="Landing.scrollTo('modules-section');return false;">16 Modules</a>
              <a href="#why-us" class="landing-nav-link" onclick="Landing.scrollTo('why-us');return false;">Why Choose Us</a>
              <a href="#capabilities" class="landing-nav-link" onclick="Landing.scrollTo('capabilities');return false;">Capabilities</a>
              <a href="#workflow" class="landing-nav-link" onclick="Landing.scrollTo('workflow');return false;">Workflow</a>
              <a href="#tax-calc" class="landing-nav-link" onclick="Landing.scrollTo('tax-calc');return false;">Tax Calculator</a>
              <a href="#faq" class="landing-nav-link" onclick="Landing.scrollTo('faq');return false;">FAQs</a>
              <a href="#careers" class="landing-nav-link" onclick="Landing.scrollTo('careers');return false;">Careers <span class="landing-careers-nav-pill" style="background:var(--hrm-vermilion-light);color:var(--hrm-vermilion);border:1px solid var(--hrm-vermilion-border)">${openJobsCount}&nbsp;Open</span></a>
            </nav>

            <div class="landing-nav-actions">
              ${loggedIn ? `
              <button class="landing-btn-signin desktop-only" onclick="App.showApp();App.navigate('dashboard');" title="Open HRM Dashboard" style="background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;border-color:transparent">
                <i class="fa fa-gauge-high"></i>
                <span>Dashboard</span>
              </button>
              <button class="landing-btn-cta" onclick="App.showLogin()" title="Switch Account / Sign In">
                <span>Sign In</span>
              </button>
              ` : `
              <button class="landing-btn-signin desktop-only" onclick="App.showLogin()" title="Sign in to HRM Portal">
                <i class="fa fa-right-to-bracket"></i>
                <span>Sign In</span>
              </button>
              <button class="landing-btn-cta" onclick="Landing.scrollTo('quote-section')" title="Request Custom Proposal & Trial">
                <span>Get Free Quote / Trial</span>
              </button>
              `}
              <!-- Mobile Hamburger Toggle Button -->
              <button class="landing-mobile-menu-btn" onclick="Landing.toggleMobileNav(event)" aria-label="Toggle navigation menu">
                <i class="fa fa-bars"></i>
              </button>
            </div>
          </div>

          <!-- Mobile Nav Drawer -->
          <div class="landing-mobile-drawer" id="landing-mobile-drawer">
            <div class="landing-mobile-drawer-inner">
              <a href="#" class="landing-mobile-link" onclick="Landing.closeMobileNav();window.scrollTo({top:0,behavior:'smooth'});return false;"><i class="fa fa-house"></i> Home</a>
              <a href="#modules-section" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('modules-section');return false;"><i class="fa fa-cubes"></i> 16 Enterprise Modules</a>
              <a href="#why-us" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('why-us');return false;"><i class="fa fa-award"></i> Why Choose Us</a>
              <a href="#capabilities" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('capabilities');return false;"><i class="fa fa-gem"></i> Premium Capabilities</a>
              <a href="#workflow" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('workflow');return false;"><i class="fa fa-arrows-split-up-and-left"></i> Lifecycle Workflow</a>
              <a href="#tax-calc" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('tax-calc');return false;"><i class="fa fa-calculator"></i> Tax Calculator</a>
              <a href="#faq" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('faq');return false;"><i class="fa fa-circle-question"></i> FAQs</a>
              <a href="#careers" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('careers');return false;"><i class="fa fa-briefcase"></i> Careers (${openJobsCount} Open)</a>
              <div class="landing-mobile-actions">
                ${loggedIn ? `
                <button class="landing-btn-signin" style="width:100%;justify-content:center;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff" onclick="Landing.closeMobileNav();App.showApp();App.navigate('dashboard')"><i class="fa fa-gauge-high"></i> Open Dashboard</button>
                <button class="landing-btn-cta" style="width:100%;justify-content:center" onclick="Landing.closeMobileNav();App.showLogin()">Sign In (Switch Account)</button>
                ` : `
                <button class="landing-btn-signin" style="width:100%;justify-content:center" onclick="Landing.closeMobileNav();App.showLogin()"><i class="fa fa-right-to-bracket"></i> Sign In to Portal</button>
                <button class="landing-btn-cta" style="width:100%;justify-content:center" onclick="Landing.closeMobileNav();Landing.scrollTo('quote-section')">Request Free Proposal</button>
                `}
              </div>
            </div>
          </div>
        </header>

        <!-- ─── 2. HERO SECTION WITH 3D SHOWCASE ─── -->
        <section class="landing-hero-section">
          <div class="landing-hero-grid">
            <!-- Left Hero Content -->
            <div class="landing-hero-content">
              <div class="landing-pill-badge">
                <i class="fa fa-sparkles"></i> Intelligent All-in-One HR &amp; Payroll Platform
              </div>

              <h1 class="landing-hero-title">
                Next-Gen Workforce Operations <br><span class="text-gradient-coral">Made Effortless for Enterprises</span>
              </h1>

              <p class="landing-hero-sub">
                Eliminate payroll friction with automated statutory tax calculations, real-time multi-branch biometric attendance, granular multi-tier role permissions, automated PDF report dispatch, and verified digital document generation.
              </p>

              <div class="landing-cta-group">
                <button class="landing-hero-btn-primary" onclick="Landing.scrollTo('quote-section')">
                  Get Instant Quote / Demo <i class="fa fa-arrow-right"></i>
                </button>
                <button class="landing-hero-btn-secondary" onclick="Landing.showDemoModal()">
                  <i class="fa fa-play-circle" style="color:var(--hrm-coral);font-size:16px"></i> Interactive System Tour
                </button>
              </div>

              <div class="landing-trust-badges">
                <div class="landing-trust-item">
                  <i class="fa fa-building-shield"></i>
                  <div>
                    <strong>Multi-Company Holdings</strong>
                    <span>Head Office &amp; Subsidiary Data Scoping</span>
                  </div>
                </div>
                <div class="landing-trust-item">
                  <i class="fa fa-file-invoice-dollar"></i>
                  <div>
                    <strong>Statutory F&amp;F Settlement</strong>
                    <span>Automated 30/26 Gratuity &amp; Clearances</span>
                  </div>
                </div>
                <div class="landing-trust-item">
                  <i class="fa fa-money-bill-transfer"></i>
                  <div>
                    <strong>SPMS Payroll &amp; 6 CSVs</strong>
                    <span>Exact FBR Tax Engine &amp; Bank Splitter</span>
                  </div>
                </div>
                <div class="landing-trust-item">
                  <i class="fa fa-fingerprint"></i>
                  <div>
                    <strong>Biometric Fleet Hub</strong>
                    <span>Live Hardware Ingestion &amp; Remote IP Gates</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Hero 3D Centerpiece -->
            <div class="landing-hero-visual">
              <div class="hero-3d-wrapper">
                <!-- Floating Metric 1: Biometric Attendance Rate -->
                <div class="hero-3d-badge-floating badge-pos-att" onclick="Landing.showModule('attendance')" style="cursor:pointer" title="Click to view Attendance Module">
                  <div style="width:36px;height:36px;border-radius:8px;background:var(--hrm-vermilion-light);color:var(--hrm-vermilion);display:flex;align-items:center;justify-content:center;font-size:18px">
                    <i class="fa fa-fingerprint"></i>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#64748b;font-weight:700">Attendance Rate</div>
                    <div style="font-size:17px;font-weight:900;color:#111827">96.8%</div>
                    <div style="font-size:11px;color:#16a34a;font-weight:700"><i class="fa fa-circle-check"></i> Live Biometric Sync</div>
                  </div>
                </div>

                <!-- Floating Metric 2: Monthly Payroll Processed -->
                <div class="hero-3d-badge-floating badge-pos-pay" onclick="Landing.showModule('payroll')" style="cursor:pointer" title="Click to view Payroll Module">
                  <div style="width:36px;height:36px;border-radius:8px;background:#f0fdf4;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:18px">
                    <i class="fa fa-coins"></i>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#64748b;font-weight:700">Monthly Payroll</div>
                    <div style="font-size:17px;font-weight:900;color:#111827">PKR 4.85M</div>
                    <div style="font-size:11px;color:#16a34a;font-weight:700"><i class="fa fa-shield-check"></i> 100% Tax Compliant</div>
                  </div>
                </div>

                <!-- 3D Framed Render Image -->
                <div class="hero-3d-frame">
                  <img src="assets/hero-3d.jpg" alt="HRM Pro Command Center" class="hero-3d-image" onerror="this.src='public/assets/hero-3d.jpg'">
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 3. "YOUR TRUSTED PARTNER" 16 MODULE PRODUCT GRID (MATCHING 4x4 SCREENSHOT GRID) ─── -->
        <section class="section-modules-gallery" id="modules-section">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-cubes"></i> 16 Comprehensive Modules
            </div>
            <h2 class="landing-section-title">Your Trusted Partner for Enterprise Workforce Management</h2>
            <p class="landing-section-sub">
              Empowering fast-growing enterprises, multi-branch corporations &amp; institutions with seamless, audit-ready HR automation.
            </p>
          </div>

          <div class="modules-product-grid">
            ${this.renderModulesProductGrid()}
          </div>
        </section>

        <!-- ─── 4. SECONDARY BANNER (MATCHING SCREENSHOT) ─── -->
        <section class="custom-banner-section">
          <h2 class="custom-banner-title">Custom Enterprise Workflows for High-Growth Teams — Zero Setup Friction</h2>
          <p class="custom-banner-sub">
            Modular role-based permissions, automated approval matrices, multi-branch attendance sync, and instant compliance reports built for scale.
          </p>
        </section>

        <!-- ─── 5. "WHY CHOOSE US" (4 CARDS WITH CORAL CIRCLE ICONS) ─── -->
        <section class="why-choose-section" id="why-us">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-award"></i> The Enterprise Edge
            </div>
            <h2 class="landing-section-title">Why Choose HRM Pro</h2>
            <p class="landing-section-sub">
              Engineered specifically to solve real operational bottlenecks that slow HR and finance teams down.
            </p>
          </div>

          <div class="why-choose-grid">
            <div class="why-card">
              <div class="why-card-icon"><i class="fa fa-user-lock"></i></div>
              <h3 class="why-card-title">Granular Multi-Tier RBAC</h3>
              <p class="why-card-desc">Configure dynamic partial permissions per module (view-only, apply-only, approve-only, export-only) without granting full admin rights.</p>
            </div>

            <div class="why-card">
              <div class="why-card-icon"><i class="fa fa-scale-balanced"></i></div>
              <h3 class="why-card-title">Audit-Ready Statutory Engine</h3>
              <p class="why-card-desc">Pre-configured with Pakistan 2024–2025 FBR tax slabs, EOBI, SESSI/PESSI, and statutory 30/26 gratuity exit settlements.</p>
            </div>

            <div class="why-card">
              <div class="why-card-icon"><i class="fa fa-fingerprint"></i></div>
              <h3 class="why-card-title">Real-Time Biometric Gateway</h3>
              <p class="why-card-desc">Centralized hardware sync with physical fingerprint &amp; facial scanners across all regional branches, with grace buffers and shift swap rules.</p>
            </div>

            <div class="why-card">
              <div class="why-card-icon"><i class="fa fa-file-pdf"></i></div>
              <h3 class="why-card-title">Automated PDF Dispatch</h3>
              <p class="why-card-desc">Scheduled morning briefs, payroll audits, and bank advice reports automatically generated and delivered to executive inboxes.</p>
            </div>
          </div>
        </section>

        <!-- ─── 6. "PREMIUM CAPABILITIES & FINISHES" (2x4 GALLERY MATCHING SCREENSHOT) ─── -->
        <section class="premium-finishes-section" id="capabilities">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-gem"></i> Premium Capabilities &amp; Finishes
            </div>
            <h2 class="landing-section-title">Built with Enterprise Rigor &amp; Attention to Detail</h2>
            <p class="landing-section-sub">
              From cryptographic document seals to multi-company scoping, discover the advanced mechanisms powering your workforce.
            </p>
          </div>

          <div class="premium-finishes-grid">
            ${this.renderPremiumFinishesGrid()}
          </div>
        </section>

        <!-- ─── 7. "ONE PLACE TO MANAGE YOUR WORKFORCE" (6 WORKFLOW STEPS) ─── -->
        <section class="lifecycle-workflow-section" id="workflow">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-arrows-split-up-and-left"></i> End-to-End Pipeline
            </div>
            <h2 class="landing-section-title">One Place to Manage Your Entire Workforce Lifecycle</h2>
            <p class="landing-section-sub">
              Seamlessly guide employees from first application to final gratuity settlement in one unified system.
            </p>
          </div>

          <div class="lifecycle-steps-row">
            ${this.renderWorkflowSteps()}
          </div>
        </section>

        <!-- ─── 8. INTERACTIVE PAKISTAN STATUTORY TAX CALCULATOR ─── -->
        <section class="tax-calc-section" id="tax-calc" style="padding:60px 24px;background:#ffffff;border-top:1px solid #f1f5f9">
          <div class="tax-calc-card">
            <div style="text-align:center;max-width:680px;margin:0 auto 36px auto">
              <div class="landing-pill-badge tax-calc-badge" style="margin-bottom:12px">
                <i class="fa fa-calculator" style="color:var(--hrm-coral)"></i> Live Statutory Payroll Estimator
              </div>
              <h2 class="tax-calc-title" style="font-size:32px;font-weight:900;letter-spacing:-0.8px;margin-bottom:10px">
                Interactive Salary &amp; Income Tax Calculator
              </h2>
              <p class="tax-calc-desc" style="font-size:14px;line-height:1.6;color:#64748b">
                Calculate real-time monthly take-home pay, FBR income tax deductions, and statutory funds under official Tax Slabs (2024-2025). Deducts tax after Provident Fund and exempt allowances for maximum take-home clarity.
              </p>
            </div>

            <div class="tax-calc-grid">
              <!-- Inputs Side -->
              <div class="tax-calc-box-input">
                <label class="tax-calc-label" style="font-size:13.5px;display:block;margin-bottom:6px;font-weight:700">
                  Monthly Gross Salary (PKR)
                </label>
                <div style="position:relative;margin-bottom:14px">
                  <span class="tax-calc-prefix" style="position:absolute;left:14px;top:12px;font-weight:800;font-size:15px;color:var(--hrm-coral)">PKR</span>
                  <input type="number" id="tax-input-gross" value="150000" min="0" max="10000000" step="5000"
                    class="tax-calc-input"
                    style="width:100%;box-sizing:border-box;border-radius:10px;padding:12px 14px 12px 55px;font-size:18px;font-weight:800;outline:none"
                    oninput="Landing.updateTaxCalc(this.value)">
                </div>

                <input type="range" id="tax-slider-gross" min="30000" max="1500000" step="5000" value="150000" class="tax-range-slider"
                  oninput="Landing.updateTaxCalc(this.value)">

                <!-- Quick Presets Chips -->
                <div class="tax-calc-desc" style="font-size:12px;margin-top:14px;margin-bottom:6px;font-weight:700">Quick Presets:</div>
                <div class="tax-presets-row" role="group" aria-label="Salary Presets">
                  <button type="button" id="preset-tax-80000" class="tax-preset-chip" onclick="Landing.setTaxPreset(80000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 80k</button>
                  <button type="button" id="preset-tax-150000" class="tax-preset-chip active" onclick="Landing.setTaxPreset(150000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 150k</button>
                  <button type="button" id="preset-tax-250000" class="tax-preset-chip" onclick="Landing.setTaxPreset(250000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 250k</button>
                  <button type="button" id="preset-tax-500000" class="tax-preset-chip" onclick="Landing.setTaxPreset(500000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 500k</button>
                  <button type="button" id="preset-tax-1000000" class="tax-preset-chip" onclick="Landing.setTaxPreset(1000000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 1.0M</button>
                </div>
              </div>

              <!-- Results Display Side -->
              <div class="tax-calc-box-results">
                <div class="tax-results-net-card" style="background:var(--hrm-coral);color:#ffffff;border-radius:14px;padding:22px">
                  <div class="tax-net-title" style="font-size:12px;letter-spacing:0.3px;opacity:0.9">Estimated Net Take-Home Pay</div>
                  <div class="tax-net-amount" id="tax-res-net" style="font-size:32px;font-weight:900;margin:6px 0">PKR 144,000</div>
                  <div class="tax-net-sub" style="font-size:13px;opacity:0.9" id="tax-res-pct">96.0% of gross monthly salary</div>
                </div>

                <!-- Ledger Rows -->
                <div class="tax-results-row" style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">
                  <span class="tax-row-label">Monthly Gross Salary</span>
                  <strong class="tax-row-val" id="tax-res-gross">PKR 150,000</strong>
                </div>
                <div class="tax-results-row" style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">
                  <span class="tax-row-label">Annual Income Tax</span>
                  <strong style="color:#ef4444;font-weight:800" id="tax-res-annual-tax">PKR 72,000</strong>
                </div>
                <div class="tax-results-row" style="display:flex;justify-content:space-between;padding:10px 0">
                  <span class="tax-row-label">FBR Tax Bracket</span>
                  <span style="font-size:12px;color:var(--hrm-coral);text-align:right;font-weight:700" id="tax-res-slab-desc">Slab 3</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 9. FREQUENTLY ASKED QUESTIONS (ACCORDION) ─── -->
        <section class="landing-faq-section" id="faq" style="padding:60px 24px;background:#f9fafb">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-circle-question"></i> Answers &amp; Clarity
            </div>
            <h2 class="landing-section-title">Frequently Asked Questions</h2>
            <p class="landing-section-sub">Everything you need to know about HRM Pro features, statutory payroll, and enterprise deployment.</p>
          </div>

          <div class="landing-faq-container" style="max-width:860px;margin:0 auto">
            <div class="landing-faq-item" id="faq-item-1" onclick="Landing.toggleFaq(1, event)" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;padding:18px 22px;cursor:pointer">
              <div class="landing-faq-question faq-question" style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px">
                <span>How does HRM Pro automate statutory tax and EOBI calculations?</span>
                <i class="fa fa-chevron-down faq-chevron" style="color:var(--hrm-coral)"></i>
              </div>
              <div class="landing-faq-answer faq-answer">
                HRM Pro embeds official Pakistan FBR salary tax brackets (Finance Act 2024-2025). The system automatically calculates taxable income, applies progressive slab rates, deducts statutory EOBI employee contributions, and computes Provident Fund contributions seamlessly on each salary run.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-2" onclick="Landing.toggleFaq(2, event)" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;padding:18px 22px;cursor:pointer">
              <div class="landing-faq-question faq-question" style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px">
                <span>Can biometric attendance integrate across multiple physical offices?</span>
                <i class="fa fa-chevron-down faq-chevron" style="color:var(--hrm-coral)"></i>
              </div>
              <div class="landing-faq-answer faq-answer">
                Yes. HRM Pro features a real-time hardware gateway supporting physical fingerprint and facial scanners across multiple branches. Punches synchronize with cloud database records instantly, calculating arrival grace buffers, late-coming penalties, and approved overtime tokens.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-3" onclick="Landing.toggleFaq(3, event)" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;padding:18px 22px;cursor:pointer">
              <div class="landing-faq-question faq-question" style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px">
                <span>How do granular partial permissions work in the Leave and Payroll modules?</span>
                <i class="fa fa-chevron-down faq-chevron" style="color:var(--hrm-coral)"></i>
              </div>
              <div class="landing-faq-answer faq-answer">
                Through our multi-tier RBAC engine, administrators can grant view-only, apply-only, or approve-only rights to specific roles. For example, a Department Manager can be granted leave approval authority without gaining permission to modify leave quota allocations or edit employee records.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-4" onclick="Landing.toggleFaq(4, event)" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;padding:18px 22px;cursor:pointer">
              <div class="landing-faq-question faq-question" style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px">
                <span>How does automated scheduled PDF report dispatching operate?</span>
                <i class="fa fa-chevron-down faq-chevron" style="color:var(--hrm-coral)"></i>
              </div>
              <div class="landing-faq-answer faq-answer">
                HRM Pro includes an integrated background job scheduler. You can configure daily attendance briefs, weekly department summaries, and monthly payroll audit packages to be compiled into PDF/CSV formats and dispatched automatically to management emails at designated times.
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 10. GET AN INSTANT ENTERPRISE QUOTE / DEMO (MATCHING SCREENSHOT) ─── -->
        <section class="quote-demo-section" id="quote-section">
          <div class="quote-demo-grid">
            <!-- Left Mockup Visual -->
            <div class="quote-visual-card">
              <div style="width:52px;height:52px;border-radius:12px;background:var(--hrm-vermilion-light);color:var(--hrm-vermilion);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:18px">
                <i class="fa fa-shield-halved"></i>
              </div>
              <h3 style="font-size:24px;font-weight:900;color:#111827;margin-bottom:10px">Enterprise HRM Pro Suite</h3>
              <p style="font-size:14.5px;color:#64748b;line-height:1.6;margin-bottom:20px">
                Get a custom proposal tailored to your employee headcount, branch network, and statutory requirements.
              </p>
              
              <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
                <div style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:#374151;font-weight:600">
                  <i class="fa fa-circle-check" style="color:var(--hrm-vermilion)"></i> 14-Day Full Access Enterprise Trial
                </div>
                <div style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:#374151;font-weight:600">
                  <i class="fa fa-circle-check" style="color:var(--hrm-vermilion)"></i> Zero Setup Fee &amp; Assisted Data Migration
                </div>
                <div style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:#374151;font-weight:600">
                  <i class="fa fa-circle-check" style="color:var(--hrm-vermilion)"></i> 24/7 Priority Support &amp; Dedicated Account Lead
                </div>
              </div>

              <div style="border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.06)">
                <img src="assets/hr_functions_scene.jpg" alt="HR Operations Suite" style="width:100%;height:auto;display:block">
              </div>
            </div>

            <!-- Right Interactive Form -->
            <div class="quote-form-card">
              <h3 class="quote-form-title">Request Enterprise Proposal</h3>
              <p class="quote-form-sub">Fill out the details below to receive a customized pricing quote and live system demonstration.</p>

              <form onsubmit="Landing.submitQuote(event)">
                <div class="quote-inputs-grid">
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Full Name *</label>
                    <input type="text" id="quote-name" class="quote-input-field" placeholder="e.g. Tariq Mehmood" required>
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Work Email *</label>
                    <input type="email" id="quote-email" class="quote-input-field" placeholder="tariq@enterprise.com" required>
                  </div>
                </div>

                <div class="quote-inputs-grid">
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Phone Number</label>
                    <input type="tel" id="quote-phone" class="quote-input-field" placeholder="+92 300 1234567">
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Company / Organization</label>
                    <input type="text" id="quote-company" class="quote-input-field" placeholder="Apex Global Pvt. Ltd.">
                  </div>
                </div>

                <div class="quote-inputs-grid">
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Employee Headcount</label>
                    <select id="quote-size" class="quote-input-field">
                      <option value="10-50">10 – 50 Employees</option>
                      <option value="51-200" selected>51 – 200 Employees</option>
                      <option value="201-500">201 – 500 Employees</option>
                      <option value="500+">500+ Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Primary Need</label>
                    <select id="quote-module" class="quote-input-field">
                      <option value="all" selected>All-in-One Full HRM Pro Suite</option>
                      <option value="payroll">Payroll &amp; Tax Compliance Only</option>
                      <option value="attendance">Biometric Attendance &amp; Shifts</option>
                      <option value="recruitment">Recruitment ATS &amp; Onboarding</option>
                    </select>
                  </div>
                </div>

                <div style="margin-bottom:14px">
                  <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Specific Requirements / Notes</label>
                  <textarea id="quote-notes" class="quote-input-field" rows="2" placeholder="Tell us about your multi-branch locations, legacy system migration, or custom policies..."></textarea>
                </div>

                <button type="submit" class="quote-submit-btn">
                  Request Custom Proposal &amp; Live Demo <i class="fa fa-arrow-right" style="margin-left:6px"></i>
                </button>
              </form>
            </div>
          </div>
        </section>

        <!-- ─── 10b. SEE IT IN ACTION — DASHBOARD SCREENSHOTS ─── -->
        <section style="padding:72px 24px;background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%);overflow:hidden">
          <div style="max-width:1400px;margin:0 auto">
            <!-- Section Header -->
            <div style="text-align:center;margin-bottom:52px">
              <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.3);border-radius:20px;padding:6px 16px;margin-bottom:18px">
                <i class="fa fa-display" style="color:#60a5fa;font-size:13px"></i>
                <span style="color:#60a5fa;font-size:12.5px;font-weight:700;letter-spacing:0.3px">LIVE PLATFORM PREVIEW</span>
              </div>
              <h2 style="font-size:clamp(26px,4vw,40px);font-weight:900;color:#f1f5f9;letter-spacing:-0.5px;margin-bottom:14px">
                See HRM Pro in Action
              </h2>
              <p style="font-size:16px;color:#94a3b8;max-width:560px;margin:0 auto;line-height:1.6">
                Real screenshots from the live platform — everything you see is fully functional and available after sign-in.
              </p>
            </div>

            <!-- Screenshot Tabs Switcher -->
            <div style="display:flex;justify-content:center;gap:8px;margin-bottom:32px;flex-wrap:wrap">
              <button id="ss-tab-dash" onclick="Landing.switchScreenshot('dashboard')" style="padding:8px 20px;border-radius:20px;border:1px solid #2563eb;background:#2563eb;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s">
                <i class="fa fa-gauge-high"></i> Executive Dashboard
              </button>
              <button id="ss-tab-payroll" onclick="Landing.switchScreenshot('payroll')" style="padding:8px 20px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#94a3b8;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s">
                <i class="fa fa-file-invoice-dollar"></i> Payroll Processing
              </button>
              <button id="ss-tab-attendance" onclick="Landing.switchScreenshot('attendance')" style="padding:8px 20px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#94a3b8;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s">
                <i class="fa fa-fingerprint"></i> Biometric Attendance
              </button>
            </div>

            <!-- Screenshot Frames -->
            <div style="position:relative">
              <!-- Dashboard Screenshot -->
              <div id="ss-frame-dashboard" style="border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.08),0 40px 80px rgba(0,0,0,0.6);transition:opacity 0.3s ease">
                <div style="background:#1e293b;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,0.08)">
                  <div style="width:10px;height:10px;border-radius:50%;background:#ef4444"></div>
                  <div style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></div>
                  <div style="width:10px;height:10px;border-radius:50%;background:#10b981"></div>
                  <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:4px;height:20px;margin:0 8px;display:flex;align-items:center;padding:0 10px">
                    <span style="font-size:11px;color:#64748b">hrmpro.enterprise.com/dashboard</span>
                  </div>
                </div>
                <img src="assets/ss-dashboard.jpg" alt="HRM Pro Executive Dashboard — KPIs, Charts, Employee Overview" style="width:100%;display:block;max-height:540px;object-fit:cover;object-position:top" onerror="this.src='public/assets/ss-dashboard.jpg'">
              </div>

              <!-- Payroll Screenshot (hidden by default) -->
              <div id="ss-frame-payroll" style="border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.08),0 40px 80px rgba(0,0,0,0.6);display:none">
                <div style="background:#1e293b;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,0.08)">
                  <div style="width:10px;height:10px;border-radius:50%;background:#ef4444"></div>
                  <div style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></div>
                  <div style="width:10px;height:10px;border-radius:50%;background:#10b981"></div>
                  <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:4px;height:20px;margin:0 8px;display:flex;align-items:center;padding:0 10px">
                    <span style="font-size:11px;color:#64748b">hrmpro.enterprise.com/payroll</span>
                  </div>
                </div>
                <img src="assets/ss-payroll.jpg" alt="HRM Pro Payroll Processing — September 2026 Summary, Employee Pay Data" style="width:100%;display:block;max-height:540px;object-fit:cover;object-position:top" onerror="this.src='public/assets/ss-payroll.jpg'">
              </div>

              <!-- Attendance Screenshot (hidden by default) -->
              <div id="ss-frame-attendance" style="border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.08),0 40px 80px rgba(0,0,0,0.6);display:none">
                <div style="background:#1e293b;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,0.08)">
                  <div style="width:10px;height:10px;border-radius:50%;background:#ef4444"></div>
                  <div style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></div>
                  <div style="width:10px;height:10px;border-radius:50%;background:#10b981"></div>
                  <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:4px;height:20px;margin:0 8px;display:flex;align-items:center;padding:0 10px">
                    <span style="font-size:11px;color:#64748b">hrmpro.enterprise.com/attendance</span>
                  </div>
                </div>
                <img src="assets/ss-attendance.jpg" alt="HRM Pro Biometric Attendance — Live Check-in Records and Monthly Heatmap" style="width:100%;display:block;max-height:540px;object-fit:cover;object-position:top" onerror="this.src='public/assets/ss-attendance.jpg'">
              </div>
            </div>

            <!-- Feature Bullets + CTA -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:36px">
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:12px">
                <div style="width:36px;height:36px;border-radius:8px;background:rgba(37,99,235,0.2);color:#60a5fa;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa fa-gauge-high"></i></div>
                <div><div style="color:#f1f5f9;font-weight:700;font-size:13.5px">Live KPI Dashboard</div><div style="color:#64748b;font-size:12px;margin-top:3px">Real-time workforce telemetry, charts & alerts</div></div>
              </div>
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:12px">
                <div style="width:36px;height:36px;border-radius:8px;background:rgba(16,185,129,0.2);color:#34d399;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa fa-coins"></i></div>
                <div><div style="color:#f1f5f9;font-weight:700;font-size:13.5px">FBR-Compliant Payroll</div><div style="color:#64748b;font-size:12px;margin-top:3px">Automated statutory deductions & bank advice</div></div>
              </div>
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:12px">
                <div style="width:36px;height:36px;border-radius:8px;background:rgba(245,158,11,0.2);color:#fbbf24;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa fa-fingerprint"></i></div>
                <div><div style="color:#f1f5f9;font-weight:700;font-size:13.5px">Biometric Attendance</div><div style="color:#64748b;font-size:12px;margin-top:3px">Hardware-synced check-ins with shift management</div></div>
              </div>
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:12px">
                <div style="width:36px;height:36px;border-radius:8px;background:rgba(168,85,247,0.2);color:#c084fc;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa fa-shield-halved"></i></div>
                <div><div style="color:#f1f5f9;font-weight:700;font-size:13.5px">Multi-Tier RBAC</div><div style="color:#64748b;font-size:12px;margin-top:3px">Granular role permissions across all modules</div></div>
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-top:40px">
              <button onclick="App.showLogin()" style="display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(37,99,235,0.4);transition:all 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 32px rgba(37,99,235,0.55)'" onmouseout="this.style.transform='';this.style.boxShadow='0 8px 24px rgba(37,99,235,0.4)'">
                <i class="fa fa-right-to-bracket"></i> Sign In to Access Full Platform
                <i class="fa fa-arrow-right" style="font-size:13px;opacity:0.8"></i>
              </button>
              <p style="color:#475569;font-size:12.5px;margin-top:10px">All 16 modules · Live data · No setup required</p>
            </div>
          </div>
        </section>

        <!-- ─── 11. CLIENT TESTIMONIALS &amp; REVIEWS (MATCHING SCREENSHOT) ─── -->
        <section class="testimonials-section" id="testimonials">
          <div class="testimonials-grid">
            <!-- Left Terracotta Feature Quote Card -->
            <div class="testimonial-coral-card" style="background:#c53a24 !important;color:#ffffff !important;border-radius:18px !important;padding:36px !important;box-shadow:0 16px 36px rgba(197,58,36,0.28) !important;position:relative !important">
              <div class="testimonial-quote-icon" style="color:rgba(255,255,255,0.85) !important;font-size:32px !important;margin-bottom:16px !important;display:block !important">
                <i class="fa fa-quote-left" style="color:rgba(255,255,255,0.85) !important"></i>
              </div>
              <p class="testimonial-quote-text" style="color:#ffffff !important;font-size:17.5px !important;line-height:1.68 !important;font-weight:500 !important;font-style:italic !important;margin-bottom:24px !important;opacity:1 !important;display:block !important">
                "Transitioning our 450+ multi-branch workforce to HRM Pro reduced our payroll closing cycle from 6 days to under 4 hours. The automated FBR tax engine and biometric integration are completely dependable."
              </p>
              <div class="testimonial-author-row" style="display:flex;align-items:center;gap:14px">
                <img src="assets/avatars/tariq_hussain.jpg" alt="Tariq Hussain" class="testimonial-author-avatar" onerror="this.src='public/assets/avatars/tariq_hussain.jpg'" style="width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,0.8);object-fit:cover">
                <div>
                  <div class="testimonial-author-name" style="color:#ffffff !important;font-size:17px !important;font-weight:800 !important">Tariq Hussain</div>
                  <div class="testimonial-author-role" style="color:rgba(255,255,255,0.92) !important;font-size:13.5px !important">Chief Human Resources Officer, Apex Global</div>
                </div>
              </div>
            </div>

            <!-- Right Reviews & Avatar Cluster -->
            <div class="reviews-ratings-wrap">
              <div class="reviews-badges-row">
                <div class="review-badge-item">
                  <i class="fa fa-star"></i>
                  <span>Trustpilot <strong>4.9 / 5</strong></span>
                </div>
                <div class="review-badge-item">
                  <i class="fa fa-star"></i>
                  <span>Google Reviews <strong>4.9 ★</strong></span>
                </div>
              </div>

              <div style="font-size:14.5px;font-weight:800;color:#111827;margin-bottom:6px">
                Trusted by 380+ Verified HR Leaders
              </div>
              <div style="font-size:13px;color:#64748b;margin-bottom:18px">
                Across technology, manufacturing, banking, and professional services.
              </div>

              <div class="avatars-cluster">
                <img src="assets/avatars/ahmed_khan.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/ahmed_khan.jpg'">
                <img src="assets/avatars/fatima_raza.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/fatima_raza.jpg'">
                <img src="assets/avatars/omar_farhan.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/omar_farhan.jpg'">
                <img src="assets/avatars/sara_malik.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/sara_malik.jpg'">
                <img src="assets/avatars/sehar_nawaz.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/sehar_nawaz.jpg'">
                <img src="assets/avatars/usman_baig.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/usman_baig.jpg'">
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 12. FEATURED PRODUCTS ROW (5 CARDS MATCHING SCREENSHOT) ─── -->
        <section class="featured-products-section">
          <div class="landing-section-header" style="margin-bottom:28px">
            <h3 style="font-size:20px;font-weight:900;color:#111827">Featured Enterprise Suites</h3>
          </div>
          <div class="featured-products-grid">
            ${this.renderFeaturedSuites()}
          </div>
        </section>

        <!-- ─── 13. INTEGRATION PARTNERS (MATCHING SCREENSHOT) ─── -->
        <section class="partners-section">
          <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b">
            Seamlessly Integrated with Enterprise Infrastructure
          </div>
          <div class="partners-logos-row">
            <div class="partner-logo-item"><i class="fa-brands fa-google"></i> Google Workspace</div>
            <div class="partner-logo-item"><i class="fa-brands fa-microsoft"></i> Microsoft 365</div>
            <div class="partner-logo-item"><i class="fa-brands fa-slack"></i> Slack Real-Time</div>
            <div class="partner-logo-item"><i class="fa-brands fa-whatsapp"></i> WhatsApp Alerts</div>
            <div class="partner-logo-item"><i class="fa fa-building-columns"></i> 1-Click Bank Advice CSVs</div>
          </div>
        </section>

        <!-- ─── 14. ACTIVE CAREERS & ATS PORTAL ─── -->
        <section class="landing-careers-section" id="careers" style="padding:60px 24px;background:#ffffff;border-top:1px solid #f1f5f9">
          <div class="landing-careers-inner" style="max-width:1400px;margin:0 auto">
            <div class="landing-section-header">
              <div class="landing-pill-badge" style="margin:0 auto 12px auto">
                <i class="fa fa-briefcase"></i> We Are Actively Hiring
              </div>
              <h2 class="landing-section-title">Current Open Positions at HRM Pro</h2>
              <p class="landing-section-sub">
                Explore high-growth career opportunities across Engineering, Human Resources, Finance, and Operations.
              </p>
            </div>

            <!-- Job Openings Grid -->
            <div class="careers-jobs-grid" id="careers-jobs-list" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:20px">
              ${openJobsList.length > 0 ? openJobsList.map(job => {
                const dept = depts.find(d => d.id === job.departmentId);
                return `
                  <div class="career-job-card" data-dept="${job.departmentId}" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                      <div>
                        <span style="font-size:11px;font-weight:700;color:var(--hrm-coral);background:var(--hrm-vermilion-light);padding:3px 8px;border-radius:6px">${dept?.name || 'General Operations'}</span>
                        <h3 style="font-size:16px;font-weight:800;color:#111827;margin-top:6px">${job.title}</h3>
                      </div>
                      <span style="font-size:11px;color:#16a34a;font-weight:700"><i class="fa fa-circle" style="font-size:8px"></i> Open</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-bottom:12px;font-size:12px;color:#64748b">
                      <span><i class="fa fa-clock"></i> ${job.experience || 'Full-time'}</span>
                      <span>•</span>
                      <span><i class="fa fa-money-bill-wave"></i> Rs. ${job.salary || 'Competitive'}</span>
                    </div>
                    <button class="btn btn-primary" style="width:100%;background:var(--hrm-coral);border-color:var(--hrm-coral);border-radius:8px;font-weight:700" onclick="Landing.openApplyModal(${job.id})">
                      Apply Now <i class="fa fa-arrow-right"></i>
                    </button>
                  </div>
                `;
              }).join('') : `
                <div style="grid-column: 1/-1;text-align:center;padding:40px;background:#f8fafc;border-radius:12px;color:#64748b">
                  <i class="fa fa-briefcase" style="font-size:36px;margin-bottom:12px;color:#94a3b8"></i>
                  <p style="font-size:15px;font-weight:600;margin:0">No current openings matching your criteria. Check back soon!</p>
                </div>
              `}
            </div>
          </div>
        </section>

        <!-- ─── 15. MODERN ENTERPRISE FOOTER ─── -->
        <footer class="landing-footer">
          <div class="landing-footer-grid">
            <!-- Brand Column -->
            <div class="landing-footer-brand-col">
              <div class="landing-brand" style="margin-bottom:12px">
                <div class="landing-brand-icon">
                  <i class="fa fa-users"></i>
                </div>
                <div>
                  <div class="landing-brand-name">HRM Pro</div>
                  <div class="landing-brand-tag" style="color:#94a3b8">Enterprise Human Capital Platform</div>
                </div>
              </div>
              <p class="landing-footer-tagline">
                Cloud Human Resource Information System with real-time biometric synchronization, automated statutory payroll, and end-to-end employee lifecycle governance.
              </p>
            </div>

            <!-- Links: Product -->
            <div class="landing-footer-col">
              <h3 class="landing-footer-heading">Platform Modules</h3>
              <div class="landing-footer-links">
                <a href="#" onclick="Landing.showModule('employees');return false;">Employees &amp; e-DMS</a>
                <a href="#" onclick="Landing.showModule('attendance');return false;">Biometric Attendance</a>
                <a href="#" onclick="Landing.showModule('payroll');return false;">Statutory Payroll</a>
                <a href="#" onclick="Landing.showModule('leaves');return false;">Leave Approvals</a>
                <a href="#" onclick="Landing.showModule('recruitment');return false;">Recruitment ATS</a>
                <a href="#" onclick="Landing.showModule('reports');return false;">Scheduled PDF Reports</a>
              </div>
            </div>

            <!-- Links: Compliance -->
            <div class="landing-footer-col">
              <h3 class="landing-footer-heading">Statutory &amp; Security</h3>
              <div class="landing-footer-links">
                <a href="#tax-calc" onclick="Landing.scrollTo('tax-calc');return false;">FBR Tax Slabs 2024-25</a>
                <a href="#capabilities" onclick="Landing.scrollTo('capabilities');return false;">30/26 Gratuity Settlement</a>
                <a href="#capabilities" onclick="Landing.scrollTo('capabilities');return false;">ISO 27001 Security</a>
                <a href="#capabilities" onclick="Landing.scrollTo('capabilities');return false;">256-Bit Data Encryption</a>
                <a href="#why-us" onclick="Landing.scrollTo('why-us');return false;">Granular Multi-Tier RBAC</a>
              </div>
            </div>

            <!-- Links: Contact -->
            <div class="landing-footer-col">
              <h3 class="landing-footer-heading">Enterprise Support</h3>
              <div class="landing-footer-links">
                <a href="tel:+18005554767"><i class="fa fa-phone" style="margin-right:6px"></i> +1 (800) 555-HRMPRO</a>
                <a href="mailto:enterprise@hrmpro.com"><i class="fa fa-envelope" style="margin-right:6px"></i> enterprise@hrmpro.com</a>
                <a href="#" onclick="Landing.scrollTo('quote-section');return false;">Request Custom Quote</a>
                <a href="#" onclick="Landing.showDemoModal();return false;">Book Live Demo</a>
                <a href="#" onclick="App.showLogin();return false;">Sign In to Portal</a>
              </div>
            </div>
          </div>

          <div class="landing-footer-bottom">
            <div>© 2026 HRM Pro Enterprise Edition. All rights reserved.</div>
            <div style="display:flex;gap:18px">
              <a href="#" onclick="return false;">Privacy Policy</a>
              <a href="#" onclick="return false;">Terms of Service</a>
              <a href="#" onclick="return false;">Security Protocols</a>
            </div>
          </div>
        </footer>
      </div>
    `;

    // Initialize interactive tax calculator with default state
    setTimeout(() => {
      Landing.updateTaxCalc(150000);
    }, 50);
  },

    // ─── Dynamic Pillar Content Generator ───
  getPillarCardHtml(pillarKey) {
    const pillars = {
      people: {
        title: 'People Management & Workforce Lifecycle',
        tagline: '4 Lifecycle Stages: Roster, e-DMS, HR Letters, Life Events & Exit Settlements',
        desc: 'Manage the complete employee journey: Stage 1 (Directory & Hierarchy), Stage 2 (e-DMS & Expiries Radar), Stage 3 (HR Letters & Discipline), and Stage 4 (Life Events, Exit Clearance & F&F Settlements).',
        color: '#2563eb',
        bg: '#eff6ff',
        badge: 'Core Workforce',
        modId: 'employees',
        caps: [
          { title: 'Stage 1: Directory & Hierarchy', desc: '360° personnel profiles, National CNIC/ID, dynamic org trees, and reporting lines.', icon: 'fa-users' },
          { title: 'Stage 2: e-DMS & Expiry Radar', desc: 'Encrypted document vault with 30/60/90-day automated alert triggers before expiry.', icon: 'fa-file-shield' },
          { title: 'Stage 3: Letters & Disciplinary Hub', desc: 'Standardized HR appointment letters, warning notices, and inquiry tracking.', icon: 'fa-file-signature' },
          { title: 'Stage 4: Life Events & Exit (F&F)', desc: 'Dependents records, exit handover clearance, and statutory 30/26 F&F settlement vouchers.', icon: 'fa-door-open' }
        ],
        stat: '4 Lifecycle Stages',
        statSub: '100% Verified'
      },
      leaves: {
        title: 'Leave Approvals & Statutory Holiday Calendar',
        tagline: 'Multi-Tier Approvals, Annual Quotas, Accruals & Encashment Rules',
        desc: 'Automate employee leave requests with multi-tier managerial endorsements, live balance checks, compensatory off tracking, and Pakistan public holiday calendars.',
        color: '#0d9488',
        bg: '#f0fdf4',
        badge: 'Time Off & Balances',
        modId: 'leaves',
        caps: [
          { title: '4-Stage Leave Lifecycle', desc: 'Manage applications, multi-tier reviews, statutory calendar, and department entitlement quotas.', icon: 'fa-calendar-check' },
          { title: '2-Tier Approval Workflows', desc: 'Direct reporting manager Tier-1 endorsement followed by final HR Director authorization.', icon: 'fa-user-shield' },
          { title: 'Public Holidays & Calendar', desc: 'Integrated Pakistan gazetted holiday dates with automatic non-working day exclusions.', icon: 'fa-calendar-day' },
          { title: 'Encashment & Quota Ledgers', desc: 'Live annual entitlement tracking with automated carry-forward and year-end encashment math.', icon: 'fa-wallet' }
        ],
        stat: '100% Policy Enforced',
        statSub: 'Multi-Tier Flow'
      },
      attendance: {
        title: 'Biometric Attendance & Shift Rostering',
        tagline: 'Physical Hardware Gateway, Late Arrival Buffers & Overtime Engine',
        desc: 'Integrate directly with fingerprint and facial scanners. Stream check-ins in real-time, enforce arrival buffers, and automate overtime tokens.',
        color: '#10b981',
        bg: '#ecfdf5',
        badge: 'Time & Attendance',
        modId: 'attendance',
        caps: [
          { title: 'Biometric Hardware Gateway', desc: 'Live socket sync with physical fingerprint/facial scanners and digital web terminals.', icon: 'fa-fingerprint' },
          { title: 'Grace Buffers & Late Penalties', desc: 'Configurable arrival buffers (e.g. 15 mins) with automated half-day deduction rules.', icon: 'fa-stopwatch' },
          { title: 'Dynamic Shift Rosters', desc: 'Assign morning, evening, rotational, and weekend shifts with automated notifications.', icon: 'fa-calendar-week' },
          { title: 'Overtime Token Computations', desc: 'Calculate approved overtime hours automatically and feed approved tokens to payroll.', icon: 'fa-bolt' }
        ],
        stat: '96.8% Punch Rate',
        statSub: 'Hardware Synced'
      },
      payroll: {
        title: 'Statutory Payroll & FBR Tax Engine',
        tagline: 'Formula-Based Pay Rules, EOBI Ledgers, 1LINK Advice & Payslips',
        desc: 'Run error-free payroll across flexible pay structures with real-time Pakistan statutory income tax brackets, EOBI, and Provident Fund deductions.',
        color: '#9333ea',
        bg: '#faf5ff',
        badge: 'Compensation',
        modId: 'payroll',
        caps: [
          { title: 'Formula-Based Engine', desc: 'Auto-syncs worked hours, leaves, and approved overtime into exact gross-to-net pay.', icon: 'fa-calculator' },
          { title: 'FBR Tax Engine', desc: 'Up-to-date Pakistan statutory tax slabs with progressive progressive rates and rebates.', icon: 'fa-scale-balanced' },
          { title: 'EOBI & Provident Fund', desc: 'Automated employee/employer statutory shares with audit-proof cumulative ledgers.', icon: 'fa-piggy-bank' },
          { title: '1-Click Bank Advice & Slips', desc: 'Generate bank disbursal advice batches and digital PDF payslips in a single click.', icon: 'fa-file-invoice-dollar' }
        ],
        stat: '100% Tax Compliant',
        statSub: 'Audit Ready'
      },
      recruitment: {
        title: 'Recruitment ATS & Onboarding Pipeline',
        tagline: '5-Stage Kanban, 10-Criteria Scoring Rubrics & Cascaded Offers',
        desc: 'Publish career vacancies, track candidate applications, score finalists on structured rubrics, extend offer letters, and run onboarding checklists.',
        color: '#d97706',
        bg: '#fffbeb',
        badge: 'Talent Acquisition',
        modId: 'recruitment',
        caps: [
          { title: 'Public Careers & CV Intake', desc: 'Clean public job board with drag-and-drop CV upload directly into cloud database.', icon: 'fa-file-arrow-up' },
          { title: '5-Stage Applicant Pipeline', desc: 'Progress candidates from Applied -> Shortlisted -> Interview -> Offer -> Hired.', icon: 'fa-diagram-project' },
          { title: '10-Criteria Rubric Scoring', desc: 'Standardized evaluation matrix ensuring objective, bias-free candidate assessments.', icon: 'fa-star-half-stroke' },
          { title: 'Onboarding Checklist', desc: 'Pre-joining and post-joining task workflows converting hires to active employees.', icon: 'fa-list-check' }
        ],
        stat: '5 Active Vacancies',
        statSub: '31/31 Verified'
      },
      performance: {
        title: 'Performance Management & 9-Box Grid',
        tagline: '4 Clean Lifecycle Stages, 360° Appraisals, 9-Box Matrix & LMS Competencies',
        desc: 'Drive workforce productivity with 4 streamlined stages: Stage 1 (Goals & KPIs), Stage 2 (360° Reviews & Feedback), Stage 3 (9-Box Grid & Succession), and Stage 4 (LMS & Competencies).',
        color: '#e11d48',
        bg: '#fff1f2',
        badge: '4-Stage Lifecycle',
        modId: 'performance',
        caps: [
          { title: 'Stage 1: Goals, KPIs & Cycles', desc: 'Define SMART objectives and departmental KPIs with quantitative milestone tracking.', icon: 'fa-bullseye' },
          { title: 'Stage 2: Reviews & 360° Feedback', desc: 'Multi-rater evaluations gathering self, peer, and manager appraisals with scoring rubrics.', icon: 'fa-comments' },
          { title: 'Stage 3: 9-Box Talent Matrix', desc: 'Map employee performance against leadership potential for data-driven succession planning.', icon: 'fa-border-all' },
          { title: 'Stage 4: LMS & Competency Matrix', desc: 'Upskill talent through course catalogs, training schedules, and digital certifications.', icon: 'fa-award' }
        ],
        stat: '4 Clean Stages',
        statSub: '9-Box Grid'
      },
      multi_company: {
        title: 'Corporate Holdings & Legal Entities',
        tagline: 'Model A Parent/Subsidiary Hierarchy, Global Entity Switcher & Scoping',
        desc: 'Consolidate multiple legal business entities under a single unified corporate group. Manage separate NTN, SECP registrations, and bank disbursement accounts with 1-click entity switching.',
        color: '#0284c7',
        bg: '#f0f9ff',
        badge: 'Enterprise Holdings',
        modId: 'company',
        caps: [
          { title: 'Parent & Subsidiary Structure', desc: 'Manage parent holding corporations and individual legal subsidiaries with isolated ledgers.', icon: 'fa-sitemap' },
          { title: 'Global Multi-Entity Switcher', desc: 'Instant single-click switching between Apex Technologies, Apex Digital, or consolidated group view.', icon: 'fa-arrows-rotate' },
          { title: 'Legal Scoping & Isolation', desc: 'Subsidiary HR managers are strictly scoped to their assigned entity, while Admins command group-wide authority.', icon: 'fa-shield-halved' },
          { title: 'Consolidated Telemetry', desc: 'Executive cross-subsidiary workforce headcounts, attendance rates, and combined payroll liabilities.', icon: 'fa-chart-pie' }
        ],
        stat: 'Consolidated Group',
        statSub: 'Multi-NTN Ready'
      },
      settlement: {
        title: 'Exit & Statutory Gratuity Settlements',
        tagline: 'Pakistan Statutory 30/26 Gratuity Engine, 4-Gate Clearances & F&F Vouchers',
        desc: 'Embedded inside Employees Stage 4: Automate offboarding with the official Pakistan 30/26 statutory gratuity formula, unused leave encashment, multi-department clearance gates, and audit-ready F&F vouchers.',
        color: '#7c3aed',
        bg: '#faf5ff',
        badge: 'Employees Stage 4',
        modId: 'settlement',
        caps: [
          { title: 'Pakistan 30/26 Gratuity Engine', desc: 'Calculates: (Basic Salary × Years × 30) / 26 with automated ≥6 months tenure rounding.', icon: 'fa-scale-balanced' },
          { title: '4-Gate Clearance Workflows', desc: 'Sequential multi-department clearance gates: HR Handover, IT Asset Recovery, Finance Dues, and Admin.', icon: 'fa-door-open' },
          { title: 'Unused Leave Encashment', desc: 'Converts unutilized annual leave balances to cash based on current basic salary rates.', icon: 'fa-coins' },
          { title: 'Audit-Proof F&F Vouchers', desc: 'Generates detailed Full & Final settlement vouchers with payment references and disbursement tracking.', icon: 'fa-file-invoice-dollar' }
        ],
        stat: '30/26 Statutory',
        statSub: 'Audit-Proof F&F'
      },
      training: {
        title: 'Training & Learning Management (LMS)',
        tagline: 'Course Catalog, Training Calendar, Nominations & Certifications',
        desc: 'Upskill your workforce with comprehensive training schedules, attendance tracking, post-session assessments, and certification expiry tracking.',
        color: '#0891b2',
        bg: '#ecfeff',
        badge: 'Learning & Dev',
        modId: 'training',
        caps: [
          { title: 'Training Course Catalog', desc: 'Curate internal and external technical, leadership, and compliance courses.', icon: 'fa-book-bookmark' },
          { title: 'Training Calendar & Scheduler', desc: 'Schedule workshops and webinars with automated employee notifications.', icon: 'fa-calendar-days' },
          { title: 'Nomination & Attendance', desc: 'Manager nominations with automated enrollment and QR session check-in.', icon: 'fa-user-check' },
          { title: 'Certification Tracking', desc: 'Maintain digital credential repositories with automated renewal reminders.', icon: 'fa-award' }
        ],
        stat: '100% Tracking',
        statSub: 'Skills Matrix'
      }
    };

    const p = pillars[pillarKey] || pillars.people;

    return `
      <div class="pillar-showcase-card animate-fade-in">
        <div>
          <div style="display:inline-flex;align-items:center;gap:8px;padding:4px 12px;background:${p.bg};color:${p.color};border-radius:9999px;font-size:11.5px;font-weight:800;margin-bottom:12px">
            ${p.badge}
          </div>
          <h3 style="font-size:24px;font-weight:900;color:var(--text,#0f172a);margin-bottom:6px">${p.title}</h3>
          <div style="font-size:13.5px;font-weight:700;color:${p.color};margin-bottom:12px">${p.tagline}</div>
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin-bottom:20px">${p.desc}</p>

          <div class="pillar-cap-list">
            ${p.caps.map(c => `
              <div class="pillar-cap-item">
                <div class="pillar-cap-icon" style="background:${p.bg};color:${p.color}">
                  <i class="fa ${c.icon}"></i>
                </div>
                <div>
                  <div class="pillar-cap-title">${c.title}</div>
                  <div class="pillar-cap-desc">${c.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="display:flex;gap:12px;align-items:center;margin-top:20px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="Landing.showModule('${p.modId}')" style="font-weight:700">
              Explore Full ${p.badge} Tour <i class="fa fa-arrow-right" style="margin-left:6px"></i>
            </button>
            <button class="btn btn-secondary" onclick="App.showLogin()" style="font-weight:600">
              <i class="fa fa-arrow-up-right-from-square" style="margin-right:6px"></i> Open Portal Access
            </button>
          </div>
        </div>

        <!-- Right Graphic Box -->
        <div style="background:${p.bg};border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:32px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px">
          <div style="width:72px;height:72px;border-radius:20px;background:#ffffff;color:${p.color};display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 12px 30px rgba(0,0,0,0.08);margin-bottom:18px">
            <i class="fa ${p.caps[0].icon}"></i>
          </div>
          <div style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:4px">${p.stat}</div>
          <div style="font-size:13px;font-weight:700;color:${p.color};margin-bottom:18px">${p.statSub}</div>
          <div style="background:#ffffff;border-radius:10px;padding:10px 18px;font-size:12px;font-weight:700;color:#334155;box-shadow:0 4px 12px rgba(0,0,0,0.04)">
            <i class="fa fa-circle-check text-success" style="margin-right:6px"></i> Production-Ready Module
          </div>
        </div>
      </div>
    `;
  },

  switchPillar(pillarKey) {
    this.activePillar = pillarKey;
    document.querySelectorAll('.pillar-tab-btn').forEach(btn => btn.classList.remove('active'));
    const clickedBtn = event && event.currentTarget ? event.currentTarget : null;
    if (clickedBtn) clickedBtn.classList.add('active');

    const panel = document.getElementById('pillar-showcase-panel');
    if (panel) {
      panel.innerHTML = this.getPillarCardHtml(pillarKey);
    }
  },

  // ─── Interactive Tax Calculator Methods (Official Tax Slabs 2026-27) ───
  taxCalcState: {
    gross: 150000,
    pfPct: 0,
    eobiAmount: 0,
    exemptBenefits: 0
  },

  updateTaxCalc(val) {
    if (!this.taxCalcState) {
      this.taxCalcState = { gross: 150000, pfPct: 0, eobiAmount: 0, exemptBenefits: 0 };
    }
    const gross = Math.max(0, Number(val) !== undefined && !isNaN(Number(val)) ? Number(val) : 150000);
    this.taxCalcState.gross = gross;

    const inputGross = document.getElementById('tax-input-gross');
    const sliderGross = document.getElementById('tax-slider-gross');
    if (inputGross && inputGross.value != gross) inputGross.value = gross;
    if (sliderGross && sliderGross.value != gross) sliderGross.value = gross;

    const pfPct = Math.max(0, Number(this.taxCalcState.pfPct) || 0);
    const pf = Math.round(gross * (pfPct / 100));
    const eobi = Math.max(0, Number(this.taxCalcState.eobiAmount) || 0);
    const benefits = Math.max(0, Number(this.taxCalcState.exemptBenefits) || 0);

    // DEDUCT TAX AFTER PF, EOBI AND OTHER BENEFIT EXEMPTIONS:
    const monthlyTaxable = Math.max(0, gross - pf - eobi - benefits);
    const annualTaxable = monthlyTaxable * 12;

    // FBR 2026-27 Slabs calculation on annualTaxable
    let annualTax = 0;
    let slabDesc = 'Slab 1 (Up to PKR 600,000: 0% Tax-Free)';
    let slabId = 1;

    if (annualTaxable <= 600000) {
      annualTax = 0;
      slabDesc = 'Slab 1 (Up to PKR 600,000: 0% Tax-Free)';
      slabId = 1;
    } else if (annualTaxable <= 1200000) {
      annualTax = (annualTaxable - 600000) * 0.01;
      slabDesc = 'Slab 2 (PKR 600,001 – 1,200,000: 1% of excess over PKR 600k)';
      slabId = 2;
    } else if (annualTaxable <= 2200000) {
      annualTax = 6000 + (annualTaxable - 1200000) * 0.11;
      slabDesc = 'Slab 3 (PKR 1,200,001 – 2,200,000: PKR 6,000 + 11% of excess over PKR 1.2M)';
      slabId = 3;
    } else if (annualTaxable <= 3200000) {
      annualTax = 116000 + (annualTaxable - 2200000) * 0.20;
      slabDesc = 'Slab 4 (PKR 2,200,001 – 3,200,000: PKR 116,000 + 20% of excess over PKR 2.2M)';
      slabId = 4;
    } else if (annualTaxable <= 4100000) {
      annualTax = 316000 + (annualTaxable - 3200000) * 0.25;
      slabDesc = 'Slab 5 (PKR 3,200,001 – 4,100,000: PKR 316,000 + 25% of excess over PKR 3.2M)';
      slabId = 5;
    } else if (annualTaxable <= 5600000) {
      annualTax = 541000 + (annualTaxable - 4100000) * 0.29;
      slabDesc = 'Slab 6 (PKR 4,100,001 – 5,600,000: PKR 541,000 + 29% of excess over PKR 4.1M)';
      slabId = 6;
    } else if (annualTaxable <= 7000000) {
      annualTax = 976000 + (annualTaxable - 5600000) * 0.32;
      slabDesc = 'Slab 7 (PKR 5,600,001 – 7,000,000: PKR 976,000 + 32% of excess over PKR 5.6M)';
      slabId = 7;
    } else {
      annualTax = 1424000 + (annualTaxable - 7000000) * 0.35;
      slabDesc = 'Slab 8 (Above PKR 7,000,000: PKR 1,424,000 + 35% of excess over PKR 7.0M)';
      slabId = 8;
    }

    const monthlyTax = Math.round(annualTax / 12);

    // Calculate unreduced tax on raw gross to demonstrate exemption savings
    let rawAnnual = gross * 12;
    let rawTax = 0;
    if (rawAnnual > 600000 && rawAnnual <= 1200000) rawTax = (rawAnnual - 600000) * 0.01;
    else if (rawAnnual > 1200000 && rawAnnual <= 2200000) rawTax = 6000 + (rawAnnual - 1200000) * 0.11;
    else if (rawAnnual > 2200000 && rawAnnual <= 3200000) rawTax = 116000 + (rawAnnual - 2200000) * 0.20;
    else if (rawAnnual > 3200000 && rawAnnual <= 4100000) rawTax = 316000 + (rawAnnual - 3200000) * 0.25;
    else if (rawAnnual > 4100000 && rawAnnual <= 5600000) rawTax = 541000 + (rawAnnual - 4100000) * 0.29;
    else if (rawAnnual > 5600000 && rawAnnual <= 7000000) rawTax = 976000 + (rawAnnual - 5600000) * 0.32;
    else if (rawAnnual > 7000000) rawTax = 1424000 + (rawAnnual - 7000000) * 0.35;

    const rawMonthlyTax = Math.round(rawTax / 12);
    const taxSaved = Math.max(0, rawMonthlyTax - monthlyTax);

    // Net take home pay: Gross minus PF, EOBI, and Income Tax
    const netSalary = Math.max(0, gross - pf - eobi - monthlyTax);

    const netPct = gross > 0 ? ((netSalary / gross) * 100).toFixed(1) : '0.0';
    const taxPct = gross > 0 ? ((monthlyTax / gross) * 100).toFixed(1) : '0.0';
    const dedPct = gross > 0 ? (((eobi + pf) / gross) * 100).toFixed(1) : '0.0';

    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('tax-res-net', 'PKR ' + netSalary.toLocaleString());
    setTxt('tax-res-pct', netPct + '% of gross monthly salary');
    setTxt('tax-res-gross', 'PKR ' + gross.toLocaleString());
    setTxt('tax-res-annual', 'PKR ' + annualTaxable.toLocaleString());
    setTxt('tax-res-monthly-tax', 'PKR ' + monthlyTax.toLocaleString());
    setTxt('tax-res-annual-tax', 'PKR ' + Math.round(annualTax).toLocaleString());
    setTxt('tax-res-eobi', 'PKR ' + eobi.toLocaleString());
    setTxt('tax-res-pf', 'PKR ' + pf.toLocaleString());
    setTxt('tax-res-pf-pct-label', pfPct + '%');
    setTxt('tax-res-benefits', 'PKR ' + benefits.toLocaleString());
    setTxt('tax-res-slab-desc', slabDesc);

    // Summary badges
    setTxt('tax-pf-summary-badge', pfPct + '% (PKR ' + pf.toLocaleString() + ')');
    setTxt('tax-eobi-summary-badge', 'PKR ' + eobi.toLocaleString());
    setTxt('tax-benefits-summary-badge', 'PKR ' + benefits.toLocaleString());

    // Savings callout
    const callout = document.getElementById('tax-savings-callout');
    const calloutTxt = document.getElementById('tax-savings-txt');
    if (callout && calloutTxt) {
      if (taxSaved > 0) {
        callout.style.display = 'block';
        calloutTxt.textContent = `Tax calculated after PF & exemptions saves PKR ${taxSaved.toLocaleString()}/mo in withholding tax!`;
      } else {
        callout.style.display = 'none';
      }
    }

    // Highlight active slab in table if visible
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') !== 'light';
    for (let i = 1; i <= 8; i++) {
      const row = document.getElementById(`slab-row-${i}`);
      if (row) {
        if (slabId === i) {
          row.style.background = isDark ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.12)';
          row.style.fontWeight = '700';
          row.style.color = isDark ? '#ffffff' : '#1d4ed8';
        } else {
          row.style.background = 'transparent';
          row.style.fontWeight = 'normal';
          row.style.color = '';
        }
      }
    }

    const barNet = document.getElementById('tax-bar-net');
    const barTax = document.getElementById('tax-bar-tax');
    const barDed = document.getElementById('tax-bar-ded');
    if (barNet) barNet.style.width = netPct + '%';
    if (barTax) barTax.style.width = taxPct + '%';
    if (barDed) barDed.style.width = dedPct + '%';
  },

  setTaxPreset(amt) {
    document.querySelectorAll('.tax-preset-chip').forEach(c => c.classList.remove('active'));
    const btn = document.getElementById(`preset-tax-${amt}`);
    if (btn) btn.classList.add('active');
    this.updateTaxCalc(amt);
  },

  updatePfPct(pctVal) {
    const pct = Math.max(0, parseFloat(pctVal) || 0);
    this.taxCalcState.pfPct = pct;
    const input = document.getElementById('tax-input-pf-pct');
    if (input && input.value != pctVal) input.value = pctVal;

    ['0', '5', '833', '10'].forEach(k => {
      const chip = document.getElementById(`chip-pf-${k}`);
      if (chip) chip.classList.remove('active');
    });
    if (pct === 0) document.getElementById('chip-pf-0')?.classList.add('active');
    else if (pct === 5) document.getElementById('chip-pf-5')?.classList.add('active');
    else if (Math.abs(pct - 8.33) < 0.05) document.getElementById('chip-pf-833')?.classList.add('active');
    else if (pct === 10) document.getElementById('chip-pf-10')?.classList.add('active');

    this.updateTaxCalc(this.taxCalcState.gross);
  },

  setPfPreset(pct) {
    this.updatePfPct(pct);
  },

  updateEobiAmt(amtVal) {
    const amt = Math.max(0, parseInt(amtVal, 10) || 0);
    this.taxCalcState.eobiAmount = amt;
    const input = document.getElementById('tax-input-eobi-amt');
    if (input && input.value != amtVal) input.value = amtVal;

    ['0', '1300'].forEach(k => {
      const chip = document.getElementById(`chip-eobi-${k}`);
      if (chip) chip.classList.remove('active');
    });
    if (amt === 0) document.getElementById('chip-eobi-0')?.classList.add('active');
    else if (amt === 1300) document.getElementById('chip-eobi-1300')?.classList.add('active');

    this.updateTaxCalc(this.taxCalcState.gross);
  },

  setEobiPreset(amt) {
    this.updateEobiAmt(amt);
  },

  updateBenefitsAmt(amtVal) {
    const amt = Math.max(0, parseInt(amtVal, 10) || 0);
    this.taxCalcState.exemptBenefits = amt;
    const input = document.getElementById('tax-input-benefits-amt');
    if (input && input.value != amtVal) input.value = amtVal;

    ['0', '5000', '10000', '10pct'].forEach(k => {
      const chip = document.getElementById(`chip-ben-${k}`);
      if (chip) chip.classList.remove('active');
    });
    if (amt === 0) document.getElementById('chip-ben-0')?.classList.add('active');
    else if (amt === 5000) document.getElementById('chip-ben-5000')?.classList.add('active');
    else if (amt === 10000) document.getElementById('chip-ben-10000')?.classList.add('active');

    this.updateTaxCalc(this.taxCalcState.gross);
  },

  setBenefitsPreset(val) {
    let amt = 0;
    if (val === '10pct') {
      amt = Math.round((this.taxCalcState.gross || 150000) * 0.10);
    } else {
      amt = Number(val) || 0;
    }
    this.taxCalcState.exemptBenefits = amt;
    const input = document.getElementById('tax-input-benefits-amt');
    if (input) input.value = amt;

    ['0', '5000', '10000', '10pct'].forEach(k => {
      const chip = document.getElementById(`chip-ben-${k}`);
      if (chip) chip.classList.remove('active');
    });
    if (val === '10pct') document.getElementById('chip-ben-10pct')?.classList.add('active');
    else if (amt === 0) document.getElementById('chip-ben-0')?.classList.add('active');
    else if (amt === 5000) document.getElementById('chip-ben-5000')?.classList.add('active');
    else if (amt === 10000) document.getElementById('chip-ben-10000')?.classList.add('active');

    this.updateTaxCalc(this.taxCalcState.gross);
  },
  toggleSlabsTable() {
    const container = document.getElementById('tax-slabs-table-container');
    const txt = document.getElementById('tax-slabs-toggle-txt');
    if (!container) return;
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    if (txt) {
      txt.textContent = isHidden ? 'Hide Tax Slabs (2026-27) Table' : 'View Official Tax Slabs (2026-27) Table';
    }
  },

  toggleCustomDeductions() {
    const body = document.getElementById('tax-custom-ded-body');
    const icon = document.getElementById('tax-custom-ded-icon');
    if (!body) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (icon) {
      icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  },

  toggleFaq(index, evt) {
    // Prevent the wrapper's closeAllMenus from interfering
    if (!evt && typeof window !== 'undefined' && window.event) evt = window.event;
    if (evt && evt.stopPropagation) evt.stopPropagation();

    const item = document.getElementById(`faq-item-${index}`);
    if (!item) return;
    const wasOpen = item.classList.contains('active');

    // Close all other FAQ items
    document.querySelectorAll('.landing-faq-item').forEach(el => {
      el.classList.remove('active');
      const ans = el.querySelector('.landing-faq-answer, .faq-answer');
      if (ans) {
        ans.style.setProperty('display', 'none', 'important');
      }
      const chevron = el.querySelector('i.fa-chevron-down, .faq-chevron');
      if (chevron) {
        chevron.style.transform = 'rotate(0deg)';
      }
    });

    // Toggle targeted FAQ item
    if (!wasOpen) {
      item.classList.add('active');
      const ans = item.querySelector('.landing-faq-answer, .faq-answer');
      if (ans) {
        ans.style.setProperty('display', 'block', 'important');
      }
      const chevron = item.querySelector('i.fa-chevron-down, .faq-chevron');
      if (chevron) {
        chevron.style.transform = 'rotate(180deg)';
      }
    }
  },

  scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  },

  switchScreenshot(name) {
    // Hide all frames
    ['dashboard', 'payroll', 'attendance'].forEach(key => {
      const frame = document.getElementById(`ss-frame-${key}`);
      const tab   = document.getElementById(`ss-tab-${key === 'dashboard' ? 'dash' : key}`);
      if (frame) frame.style.display = 'none';
      if (tab) {
        tab.style.background = 'transparent';
        tab.style.color = '#94a3b8';
        tab.style.borderColor = 'rgba(255,255,255,0.15)';
      }
    });
    // Show selected frame and activate its tab
    const activeFrame = document.getElementById(`ss-frame-${name}`);
    const activeTabId = name === 'dashboard' ? 'ss-tab-dash' : `ss-tab-${name}`;
    const activeTab   = document.getElementById(activeTabId);
    if (activeFrame) activeFrame.style.display = 'block';
    if (activeTab) {
      activeTab.style.background = '#2563eb';
      activeTab.style.color = '#fff';
      activeTab.style.borderColor = '#2563eb';
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

  filterCareers(deptId, buttonEl) {
    if (buttonEl) {
      document.querySelectorAll('.career-filter-btn').forEach(b => b.classList.remove('active'));
      buttonEl.classList.add('active');
    }
    const cards = document.querySelectorAll('.career-job-card');
    cards.forEach(card => {
      if (deptId === 'all' || card.dataset.dept === String(deptId)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  },

  viewJobDetails(jobId) {
    const jobs = (typeof DB !== 'undefined' && DB.get) ? (DB.get('recruitment') || []) : [];
    const depts = (typeof DB !== 'undefined' && DB.get) ? (DB.get('departments') || []) : [];
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const dept = depts.find(d => d.id === job.departmentId);

    Modal.show({
      title: `${job.title} — Job Overview`,
      body: `
        <div style="padding:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
            <div>
              <span class="badge badge-primary" style="font-size:11px">${dept?.name || 'Department'}</span>
              <span class="badge badge-success" style="font-size:11px;margin-left:6px"><i class="fa fa-circle-check"></i> Actively Hiring</span>
            </div>
            <div style="font-size:12px;color:var(--text-3)"><i class="fa fa-calendar-clock"></i> Deadline: ${Utils.formatDate(job.deadline)}</div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;margin-bottom:16px">
            <div class="card" style="padding:10px;margin:0;text-align:center;background:var(--surface)">
              <div style="font-size:12px;color:var(--text-3)">Vacancies</div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">${job.positions} Open</div>
            </div>
            <div class="card" style="padding:10px;margin:0;text-align:center;background:var(--surface)">
              <div style="font-size:12px;color:var(--text-3)">Experience</div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">${job.experience}</div>
            </div>
            <div class="card" style="padding:10px;margin:0;text-align:center;background:var(--surface)">
              <div style="font-size:12px;color:var(--text-3)">Salary Range</div>
              <div style="font-weight:700;font-size:14px;color:#10b981">Rs. ${job.salary} / mo</div>
            </div>
          </div>

          <div style="margin-bottom:14px">
            <h4 style="font-size:13.5px;font-weight:700;margin-bottom:6px;color:var(--text)">Position Overview</h4>
            <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin:0">
              ${job.description || 'We are looking for a skilled, impact-oriented professional to join our team. In this role, you will be responsible for executing key institutional objectives and collaborating with cross-functional teams.'}
            </p>
          </div>

          <div style="margin-bottom:18px">
            <h4 style="font-size:13.5px;font-weight:700;margin-bottom:6px;color:var(--text)">Requirements & Core Competencies</h4>
            <ul style="font-size:12.5px;color:var(--text-2);line-height:1.6;padding-left:18px;margin:0">
              <li>Relevant bachelor's degree or practical industry equivalence in ${dept?.name || 'the required discipline'}.</li>
              <li>Proven track record with at least ${job.experience} of relevant industry experience.</li>
              <li>Strong problem-solving mindset, clear communication, and collaborative spirit.</li>
              <li>Ability to adapt to fast-paced agile environments.</li>
            </ul>
          </div>

          <button class="btn btn-primary btn-lg" style="width:100%;font-weight:700" onclick="Modal.closeAll();Landing.openApplyModal(${job.id})">
            <i class="fa fa-paper-plane" style="margin-right:6px"></i> Apply for this Position Now
          </button>
        </div>
      `
    });
  },

  openApplyModal(jobId) {
    const jobs = (typeof DB !== 'undefined' && DB.get) ? (DB.get('recruitment') || []) : [];
    const depts = (typeof DB !== 'undefined' && DB.get) ? (DB.get('departments') || []) : [];
    const job = jobs.find(j => j.id === jobId) || jobs.find(j => j.status === 'open') || jobs[0];
    if (!job) {
      Toast.show('No open positions available at this time.', 'info');
      return;
    }
    const dept = depts.find(d => d.id === job.departmentId);

    Landing._currentCvFileData = null;
    Landing._currentCvFileName = null;

    Modal.show({
      title: `Apply for ${job.title}`,
      body: `
        <div class="apply-modal-wrapper" style="padding:4px">
          <!-- Job Context Banner -->
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;border-radius:8px;background:#2563eb;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:16px">
                <i class="fa fa-briefcase"></i>
              </div>
              <div>
                <div style="font-weight:800;font-size:15px;color:#0f172a">${job.title}</div>
                <div style="font-size:12px;color:#64748b">${dept?.name || 'Department'} • Rs. ${job.salary} / mo • ${job.experience} experience</div>
              </div>
            </div>
            <span class="badge badge-success" style="font-size:11px;font-weight:700"><i class="fa fa-circle-check"></i> Actively Hiring</span>
          </div>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12.5px;color:#475569;display:flex;align-items:center;gap:8px">
            <i class="fa fa-shield-check" style="color:#2563eb;font-size:16px;flex-shrink:0"></i>
            <span><strong>No account required.</strong> Your application and CV will be delivered directly to our HR & Talent Acquisition team for shortlisting.</span>
          </div>

          <form id="public-candidate-apply-form" onsubmit="Landing.submitApplication(event, ${job.id});return false;" novalidate>
            <div class="form-row form-row-2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">Full Name <span style="color:#ef4444">*</span></label>
                <input type="text" class="form-control" id="cand-name" placeholder="e.g. Zainab Ahmed" required style="width:100%;box-sizing:border-box">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">Email Address <span style="color:#ef4444">*</span></label>
                <input type="email" class="form-control" id="cand-email" placeholder="zainab@example.com" required style="width:100%;box-sizing:border-box">
              </div>
            </div>

            <div class="form-row form-row-2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">Phone / Mobile <span style="color:#ef4444">*</span></label>
                <input type="tel" class="form-control" id="cand-phone" placeholder="+92 300 1234567" required style="width:100%;box-sizing:border-box">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">Current City / Location <span style="color:#ef4444">*</span></label>
                <input type="text" class="form-control" id="cand-city" placeholder="e.g. Islamabad / Lahore / Karachi" required style="width:100%;box-sizing:border-box">
              </div>
            </div>

            <div class="form-row form-row-2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">Total Relevant Experience <span style="color:#ef4444">*</span></label>
                <input type="text" class="form-control" id="cand-exp" placeholder="e.g. 5 Years" required style="width:100%;box-sizing:border-box">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">Expected Salary (PKR) <span style="color:#ef4444">*</span></label>
                <input type="text" class="form-control" id="cand-salary" placeholder="e.g. 180,000" required style="width:100%;box-sizing:border-box">
              </div>
            </div>

            <div class="form-group" style="margin-bottom:12px">
              <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">LinkedIn or Portfolio URL (Optional)</label>
              <input type="url" class="form-control" id="cand-portfolio" placeholder="https://linkedin.com/in/username" style="width:100%;box-sizing:border-box">
            </div>

            <!-- Upload CV Area -->
            <div class="form-group" style="margin-bottom:12px">
              <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">Upload CV / Resume <span style="color:#ef4444">*</span></label>
              <div class="cv-upload-dropzone" id="cv-dropzone" onclick="document.getElementById('cand-cv-file').click()">
                <input type="file" id="cand-cv-file" accept=".pdf,.doc,.docx" style="display:none" onchange="Landing.handleCvFileChange(this)">
                <div class="cv-dropzone-content" id="cv-dropzone-content">
                  <i class="fa fa-cloud-arrow-up" style="font-size:28px;color:#2563eb;margin-bottom:6px"></i>
                  <div style="font-size:13px;font-weight:700;color:var(--text)">Click or drag & drop your CV here</div>
                  <div style="font-size:11px;color:var(--text-3)">Supports PDF, DOC, DOCX up to 10MB</div>
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:16px">
              <label class="form-label" style="font-size:12.5px;font-weight:600;margin-bottom:4px;display:block">Brief Cover Note / Pitch</label>
              <textarea class="form-control" id="cand-cover" rows="2" placeholder="Tell us about your background, key achievements, and availability..." style="width:100%;box-sizing:border-box"></textarea>
            </div>

            <div id="apply-error-alert" class="alert alert-danger" style="display:none;margin-bottom:12px;font-size:12px;padding:8px 12px"></div>

            <button type="submit" id="cand-submit-btn" class="btn btn-primary btn-lg" style="width:100%;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px">
              <i class="fa fa-paper-plane"></i> Submit Application & CV
            </button>
          </form>
        </div>
      `
    });
  },

  handleCvFileChange(input) {
    const file = input.files && input.files[0];
    const dropzoneContent = document.getElementById('cv-dropzone-content');
    if (!file) return;

    Landing._currentCvFile = file;
    Landing._currentCvFileName = file.name;
    const reader = new FileReader();
    reader.onload = function(e) {
      Landing._currentCvFileData = e.target.result;
    };
    reader.readAsDataURL(file);

    if (dropzoneContent) {
      const sizeKB = Math.round(file.size / 1024);
      const isDoc = file.name.match(/\.(doc|docx)$/i);
      const iconClass = isDoc ? 'fa-file-word' : 'fa-file-pdf';
      const iconColor = isDoc ? '#2563eb' : '#16a34a';
      dropzoneContent.innerHTML = `
        <i class="fa ${iconClass}" style="font-size:32px;color:${iconColor};margin-bottom:6px"></i>
        <div style="font-size:13.5px;font-weight:700;color:var(--text)">${file.name}</div>
        <div style="font-size:11px;color:var(--text-3)">${sizeKB} KB • Ready for upload</div>
      `;
    }
  },

  async submitApplication(event, jobId) {
    if (event) event.preventDefault();
    const name = (document.getElementById('cand-name')?.value || '').trim();
    const email = (document.getElementById('cand-email')?.value || '').trim();
    const phone = (document.getElementById('cand-phone')?.value || '').trim();
    const city = (document.getElementById('cand-city')?.value || '').trim();
    const exp = (document.getElementById('cand-exp')?.value || '').trim();
    const salary = (document.getElementById('cand-salary')?.value || '').trim();
    const portfolio = (document.getElementById('cand-portfolio')?.value || '').trim();
    const cover = (document.getElementById('cand-cover')?.value || '').trim();
    const errAlert = document.getElementById('apply-error-alert');
    const submitBtn = document.getElementById('cand-submit-btn');

    if (!name || !email || !phone || !city || !exp || !salary) {
      if (errAlert) {
        errAlert.textContent = 'Please fill out all required fields marked with (*).';
        errAlert.style.display = 'block';
      }
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (errAlert) {
        errAlert.textContent = 'Please enter a valid email address.';
        errAlert.style.display = 'block';
      }
      return;
    }

    // Check for duplicate application for the same position by email
    const existingApps = DB.get('applications') || [];
    const isDuplicate = existingApps.some(a => 
      a.jobId === jobId && 
      a.email && 
      a.email.toLowerCase() === email.toLowerCase()
    );
    if (isDuplicate) {
      if (errAlert) {
        errAlert.textContent = `You have already submitted an application for this position with ${email}. Duplicate submissions are restricted.`;
        errAlert.style.display = 'block';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa fa-circle-notch fa-spin"></i> Submitting application & uploading CV...';
    }

    try {
      // Ensure candidate's uploaded CV file data is fully loaded into memory before submission
      if (!Landing._currentCvFileData && Landing._currentCvFile) {
        try {
          Landing._currentCvFileData = await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.onerror = () => resolve(null);
            r.readAsDataURL(Landing._currentCvFile);
          });
        } catch (readErr) {
          console.warn('[Landing] FileReader async read notice:', readErr);
        }
      }

      const jobs = DB.get('recruitment') || [];
      const job = jobs.find(j => j.id === jobId) || { id: jobId, title: 'Open Position' };
      const originalFileName = Landing._currentCvFileName || `${name.replace(/\s+/g, '_')}_CV.pdf`;
      const resumeData = Landing._currentCvFileData || null;
      const newAppId = Date.now();
      const safeName = (name || 'candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const extMatch = originalFileName.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0].toLowerCase() : '.pdf';
      const safeOriginalBase = originalFileName.replace(/\.[0-9a-z]+$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const expectedResumeUrl = `/uploads/cv/${newAppId}_${safeName}_${safeOriginalBase}${ext}`;

      const newApp = {
        id: newAppId,
        jobId: job.id,
        jobTitle: job.title,
        name: name,
        email: email,
        phone: phone,
        cnic: 'Verified Public Applicant',
        city: city,
        experience: exp,
        expectedSalary: salary,
        portfolio: portfolio,
        coverNote: cover,
        resume: originalFileName,
        resumeName: originalFileName,
        resumeUrl: expectedResumeUrl,
        resumeData: resumeData || null, // Persists into cloud database for cross-device HR access
        stage: 'applied',
        appliedOn: new Date().toISOString().split('T')[0],
        interviewDate: null,
        score: 0,
        notes: `Submitted via Public Careers Portal on ${new Date().toLocaleDateString()}. Location: ${city}. Exp: ${exp}. Expected Salary: PKR ${salary}.`
      };

      // Full payload for the backend server
      const serverApplicant = {
        ...newApp,
        resumeData: resumeData // server receives the candidate's exact raw uploaded file bytes
      };

      // Add to local applications array
      const apps = DB.get('applications') || [];
      apps.unshift(newApp);
      DB.set('applications', apps);

      // Increment job applicant count
      if (job && jobs.length) {
        const found = jobs.find(j => j.id === job.id);
        if (found) {
          found.applicantCount = (found.applicantCount || 0) + 1;
          DB.set('recruitment', jobs);
        }
      }

      // Add live notification for HR & Admin
      if (typeof LiveNotifications !== 'undefined' && LiveNotifications.add) {
        LiveNotifications.add({
          title: `🎯 New Job Application: ${name}`,
          message: `${name} submitted an application & CV for ${job.title} (${exp} exp, PKR ${salary}).`,
          type: 'recruitment',
          link: 'recruitment'
        });
      }

      // Direct synchronization with backend server
      if (typeof API !== 'undefined') {
        try {
          if (API.post) {
            const res = await API.post('/api/sync/apply', { applicant: serverApplicant, jobId: job.id });
            if (res && res.resumeUrl) {
              newApp.resumeUrl = res.resumeUrl;
              newApp.resumeName = res.resumeName || originalFileName;
              DB.set('applications', apps);
            }
          }
        } catch (apiErr) {
          console.warn('[Landing] Direct apply endpoint notice:', apiErr.message);
        }

        try {
          if (API.syncSetTable) {
            await API.syncSetTable('applications', apps, DB.clientId);
            await API.syncSetTable('recruitment', jobs, DB.clientId);
          }
        } catch (syncErr) {
          console.warn('[Landing] Direct syncSetTable notice:', syncErr.message);
        }
      }

      Modal.closeAll();

      // Show confirmation modal
      Modal.show({
        title: 'Application Submitted Successfully! 🎉',
        body: `
          <div style="text-align:center;padding:24px 10px">
            <div style="width:64px;height:64px;background:#dcfce7;color:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px auto">
              <i class="fa fa-circle-check"></i>
            </div>
            <h2 style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:8px">Thank You, ${name}!</h2>
            <p style="font-size:13.5px;color:var(--text-2);line-height:1.5;max-width:440px;margin:0 auto 18px auto">
              Your application and CV for <strong>${job.title}</strong> have been successfully received and queued in our ATS pipeline. Our HR and talent acquisition team will review your profile for shortlisting.
            </p>
            <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12px;color:var(--text-3);max-width:360px;margin:0 auto 20px auto">
              Application Reference: <strong style="color:var(--primary)">HRM-APP-${Math.floor(10000 + Math.random() * 90000)}</strong><br>
              Direct contact: <strong>${email}</strong>
            </div>
            <button class="btn btn-primary" onclick="Modal.closeAll();Landing.render();">
              Back to Careers
            </button>
          </div>
        `
      });

      // Update Landing page cards
      Landing.render();
    } catch (err) {
      console.error('Error submitting application:', err);
      if (errAlert) {
        errAlert.textContent = 'Submission encountered a problem. Please try again.';
        errAlert.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa fa-paper-plane"></i> Submit Application & CV';
      }
    }
  },

  submitQuote(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = document.getElementById('quote-name')?.value?.trim();
    const email = document.getElementById('quote-email')?.value?.trim();
    const phone = document.getElementById('quote-phone')?.value?.trim();
    const company = document.getElementById('quote-company')?.value?.trim();
    const size = document.getElementById('quote-size')?.value;
    const module = document.getElementById('quote-module')?.value;
    const notes = document.getElementById('quote-notes')?.value?.trim();

    if (!name || !email) {
      if (typeof Toast !== 'undefined') Toast.show('Please provide your name and business email.', 'warning');
      return;
    }

    const quotes = JSON.parse(localStorage.getItem('hrm_quotes') || '[]');
    const newQuote = {
      id: Date.now(),
      refNo: 'REQ-' + Math.floor(100000 + Math.random() * 900000),
      name, email, phone, company, size, module, notes,
      createdAt: new Date().toISOString()
    };
    quotes.push(newQuote);
    localStorage.setItem('hrm_quotes', JSON.stringify(quotes));

    if (typeof Modal !== 'undefined') {
      Modal.show({
        title: 'Enterprise Proposal Request Confirmed',
        body: `
          <div style="text-align:center;padding:24px 12px">
            <div style="width:64px;height:64px;border-radius:50%;background:var(--hrm-vermilion-light);color:var(--hrm-vermilion);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px auto">
              <i class="fa fa-circle-check"></i>
            </div>
            <h3 style="font-size:20px;font-weight:900;color:#111827;margin-bottom:8px">Proposal Request Received!</h3>
            <p style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:18px">
              Thank you, <strong>${name}</strong>. Your customized enterprise deployment quote for <strong>${company || 'your organization'}</strong> has been registered.
            </p>
            <div style="background:#f9fafb;border:1px dashed var(--hrm-vermilion);border-radius:10px;padding:12px;margin-bottom:20px">
              <div style="font-size:12px;color:#6b7280">Reference Tracking Number:</div>
              <div style="font-size:18px;font-weight:900;color:var(--hrm-vermilion);letter-spacing:1px">${newQuote.refNo}</div>
            </div>
            <p style="font-size:13px;color:#4b5563;margin-bottom:24px">
              A dedicated HR Solutions Specialist will reach out to <strong>${email}</strong> within 2 business hours.
            </p>
            <button class="btn btn-primary" style="background:var(--hrm-vermilion);border-color:var(--hrm-vermilion);border-radius:9999px;padding:10px 28px;font-weight:800" onclick="Modal.closeAll()">
              Done
            </button>
          </div>
        `
      });
    } else if (typeof Toast !== 'undefined') {
      Toast.show('Proposal request submitted successfully!', 'success');
    }
  },

  
  renderModulesProductGrid() {
    const list = [
      { id: 'employees', title: 'Employee Directory & e-DMS', category: 'Core Workforce', icon: 'fa-users', subtitle: '360° master directory, CNIC records, emergency contacts, branch hierarchy, and 30/60/90-day document expiry triggers.' },
      { id: 'attendance', title: 'Biometric Attendance & Shifts', category: 'Time & Attendance', icon: 'fa-fingerprint', subtitle: 'Real-time biometric fingerprint & facial hardware ingestion, geofencing, grace minutes, and shift rostering.' },
      { id: 'payroll', title: 'Statutory Payroll & Tax Engine', category: 'Compensation', icon: 'fa-money-bill-wave', subtitle: 'Pakistan FBR 2024–2025 tax slabs, EOBI, SESSI/PESSI, auto-deductions, and 6 standard bank advice CSVs.' },
      { id: 'leaves', title: 'Leave Approvals & Quotas', category: 'Time Off & Quota', icon: 'fa-calendar-days', subtitle: 'Granular partial permissions (apply, review, approve, quota adjustment), annual allowances, and encashment.' },
      { id: 'performance', title: 'Performance Reviews & OKRs', category: 'Talent Growth', icon: 'fa-chart-line', subtitle: 'Quarterly appraisal cycles, managerial ratings, KPI scorecards, and continuous feedback.' },
      { id: 'recruitment', title: 'Recruitment ATS & Kanban', category: 'Talent Acquisition', icon: 'fa-briefcase', subtitle: 'Job board posting, candidate tracking stages, resume parsing, and verified digital offer letters.' },
      { id: 'assets', title: 'Asset Inventory & Custody', category: 'Operations', icon: 'fa-laptop-file', subtitle: 'Hardware asset tracking, serial barcodes, custodian sign-offs, and return inspection on exit.' },
      { id: 'expenses', title: 'Travel & Expense Claims', category: 'Finance', icon: 'fa-receipt', subtitle: 'Multi-currency expense submissions, receipt uploads, mileage logs, and manager reimbursement sign-offs.' },
      { id: 'helpdesk', title: 'IT Helpdesk & Grievance', category: 'Support & SLA', icon: 'fa-headset', subtitle: 'SLA-based ticket queues, priority triage, departmental assignment, and resolution tracking.' },
      { id: 'settlement', title: 'Full & Final Gratuity', category: 'Separation', icon: 'fa-file-invoice-dollar', subtitle: 'Statutory 30/26 gratuity formula engine, multi-gate clearances (IT/Admin/Finance), and F&F vouchers.' },
      { id: 'training', title: 'Training & LMS Certifications', category: 'Learning', icon: 'fa-graduation-cap', subtitle: 'Course catalog, training calendar, nomination approvals, and skill matrix certificates.' },
      { id: 'company', title: 'Multi-Company Holdings', category: 'Enterprise', icon: 'fa-building-columns', subtitle: 'Model A architecture for parent holding companies and multi-branch subsidiaries with data scoping.' },
      { id: 'administration', title: 'Dynamic HR Documents', category: 'Governance', icon: 'fa-file-signature', subtitle: 'Experience certificates, relieving letters, salary visa verifications, NDAs, and executive digital stamps.' },
      { id: 'reports', title: 'Crontab Scheduled Reports', category: 'Analytics', icon: 'fa-file-chart-column', subtitle: 'Automated morning briefs, weekly attendance digests, and monthly payroll audit exports via email.' },
      { id: 'events', title: 'Events & Public Holidays', category: 'Workplace', icon: 'fa-calendar-check', subtitle: 'Gazetted public holidays, corporate announcements, training workshops, and employee social calendar.' },
      { id: 'dashboard', title: 'Executive Telemetry & KPIs', category: 'Intelligence', icon: 'fa-gauge-high', subtitle: 'Live workforce KPIs, gender diversity metrics, turnover analytics, and departmental charts.' }
    ];

    return list.map(m => `
      <div class="module-prod-card" onclick="Landing.showModule('${m.id}')">
        <div class="module-prod-card-top">
          <div class="module-prod-icon"><i class="fa ${m.icon}"></i></div>
          <span class="module-prod-pill">${m.category}</span>
        </div>
        <div class="module-prod-title">${m.title}</div>
        <div class="module-prod-desc">${m.subtitle}</div>
        <div class="module-prod-footer">
          <span>Inspect Module</span>
          <i class="fa fa-arrow-right"></i>
        </div>
      </div>
    `).join('');
  },

  renderPremiumFinishesGrid() {
    const finishes = [
      { title: 'Gold Foil Cryptographic Seal', icon: 'fa-stamp', bg: 'radial-gradient(ellipse at center, #fffbeb 0%, #fef3c7 100%)', color: '#b45309', border: '#fde68a' },
      { title: 'Silver Multi-Tier Stamp', icon: 'fa-users-gear', bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', color: '#475569', border: '#cbd5e1' },
      { title: 'Embossed Gratuity Relief', icon: 'fa-scale-balanced', bg: '#fbfbfa', color: '#334155', border: '#e7e5e4' },
      { title: 'Debossed QR Verification', icon: 'fa-qrcode', bg: '#f8fafc', color: '#0f172a', border: '#e2e8f0' },
      { title: 'Holographic Crontab Dispatch', icon: 'fa-file-pdf', bg: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #faf5ff 100%)', color: '#0284c7', border: '#bae6fd' },
      { title: 'Spot UV Biometric Gateway', icon: 'fa-fingerprint', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', color: '#16a34a', border: '#bbf7d0' },
      { title: 'Matte Corporate Scoping', icon: 'fa-building-shield', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', color: '#ea580c', border: '#fed7aa' },
      { title: 'Soft-Touch Asset Custody', icon: 'fa-barcode', bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', color: '#e11d48', border: '#fecdd3' }
    ];

    return finishes.map(f => `
      <div class="premium-card">
        <div class="premium-card-preview" style="background:${f.bg};color:${f.color};border-bottom:1px solid ${f.border}">
          <i class="fa ${f.icon}"></i>
        </div>
        <div class="premium-card-badge">
          <i class="fa fa-circle-check"></i>
          <span>${f.title}</span>
        </div>
      </div>
    `).join('');
  },

  renderWorkflowSteps() {
    const steps = [
      { num: '01', title: 'Recruit & ATS', sub: 'Kanban & Scoring', icon: 'fa-user-plus' },
      { num: '02', title: 'Digital Onboard', sub: 'e-DMS & Contracts', icon: 'fa-file-shield' },
      { num: '03', title: 'Biometrics', sub: 'Hardware Punches', icon: 'fa-clock' },
      { num: '04', title: 'Leaves & Quota', sub: 'Multi-Tier Approvals', icon: 'fa-calendar-days' },
      { num: '05', title: 'Auto Payroll', sub: 'FBR Tax & 6 CSVs', icon: 'fa-money-bill-wave' },
      { num: '06', title: 'Exit & Settle', sub: '30/26 Gratuity Vouchers', icon: 'fa-handshake' }
    ];

    return steps.map(s => `
      <div class="lifecycle-step-item">
        <div class="lifecycle-step-circle">
          <i class="fa ${s.icon}"></i>
        </div>
        <div class="lifecycle-step-label">${s.num}. ${s.title}</div>
        <div class="lifecycle-step-sub">${s.sub}</div>
      </div>
    `).join('');
  },

  renderFeaturedSuites() {
    const items = [
      { title: 'Biometric Attendance Hub', icon: 'fa-fingerprint' },
      { title: 'Statutory Payroll Engine', icon: 'fa-money-bill-transfer' },
      { title: 'Full & Final Gratuity', icon: 'fa-file-invoice-dollar' },
      { title: 'Dynamic HR Documents', icon: 'fa-file-signature' },
      { title: 'Crontab Scheduled PDF', icon: 'fa-file-pdf' }
    ];

    return items.map(it => `
      <div class="featured-prod-card" onclick="Landing.scrollTo('modules-section')">
        <div class="featured-prod-icon">
          <i class="fa ${it.icon}"></i>
        </div>
        <div class="featured-prod-title">${it.title}</div>
      </div>
    `).join('');
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
