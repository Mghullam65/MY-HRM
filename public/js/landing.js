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

  testimonialsData: [
    {
      id: 0,
      quote: "HRM Pro cut our monthly payroll cycle from 5 days to under 2 hours with 100% tax accuracy across our 350 employees in Karachi, Lahore, and Islamabad. The automated FBR tax slabs and bank advice splitters are a lifesaver.",
      author: "Tariq Hussain",
      role: "Chief Financial Officer, Apex Global Group",
      avatar: "assets/avatars/tariq_hussain.jpg"
    },
    {
      id: 1,
      quote: "Managing leave quotas, biometrics across regional branches, and multi-gate exit clearances used to be a nightmare of paper and spreadsheets. HRM Pro unified everything into one calm, reliable platform.",
      author: "Fatima Raza",
      role: "Group Head of People & Culture, Crescent Logistics",
      avatar: "assets/avatars/fatima_raza.jpg"
    },
    {
      id: 2,
      quote: "The real-time biometric gateway with grace period calculations has eliminated attendance disputes entirely. The mobile app clock-in with GPS geotagging is an indispensable tool for our operations.",
      author: "Ahmed Khan",
      role: "Chief Operating Officer, Horizon Tech Dynamics",
      avatar: "assets/avatars/ahmed_khan.jpg"
    }
  ],

  activeTestimonialIdx: 0,

  switchTestimonial(idx) {
    this.activeTestimonialIdx = idx;
    const t = this.testimonialsData[idx];
    if (!t) return;
    const bodyEl = document.getElementById('editorial-spotlight-quote');
    const authorEl = document.getElementById('editorial-spotlight-author');
    const roleEl = document.getElementById('editorial-spotlight-role');
    if (bodyEl) {
      bodyEl.style.opacity = '0';
      setTimeout(() => {
        bodyEl.textContent = `"${t.quote}"`;
        bodyEl.style.opacity = '1';
      }, 150);
    }
    if (authorEl) authorEl.textContent = t.author;
    if (roleEl) roleEl.textContent = t.role;
    
    document.querySelectorAll('.editorial-avatar-btn').forEach((btn, i) => {
      if (i === idx) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  },

  render() {
    const container = document.getElementById('landing-page');
    if (!container) return;

    const savedTheme = localStorage.getItem('landing_theme') || 'dark';
    container.setAttribute('data-landing-theme', savedTheme);

    // Live database telemetry
    const emps = (typeof DB !== 'undefined' && DB.getEmployees) ? DB.getEmployees() : [];
    const att = (typeof DB !== 'undefined' && DB.getAttendance) ? DB.getAttendance() : [];
    const leaves = (typeof DB !== 'undefined' && DB.getLeaves) ? DB.getLeaves() : [];
    const jobs = (typeof DB !== 'undefined' && DB.getJobs) ? DB.getJobs() : [];
    const depts = (typeof DB !== 'undefined' && DB.getDepartments) ? DB.getDepartments() : [];

    const openJobsList = jobs.filter(j => j.status === 'active' || j.status === 'open');
    const openJobsCount = openJobsList.length;

    const todayStr = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : new Date().toISOString().slice(0, 10);
    const totalEmps = emps.length > 0 ? emps.length : 52;
    const presentToday = att.filter(a => a.date === todayStr && a.status === 'present').length || Math.min(totalEmps, 48);
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length || 6;

    container.innerHTML = `
      <div class="landing-wrapper" data-landing-theme="${savedTheme}" onclick="Landing.closeAllMenus()">
        <!-- ─── 1. TOP NAVBAR (WITH DUAL THEME TOGGLE) ─── -->
        <header class="landing-header">
          <div class="landing-nav-container">
            <a href="#" class="landing-brand" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">
              <div class="landing-brand-icon">
                <i class="fa fa-users"></i>
              </div>
              <div>
                <div class="landing-brand-name">HRM Pro</div>
                <div class="landing-brand-tag">Workforce Intelligence System</div>
              </div>
            </a>

            <!-- Floating Pill Navigation Bar -->
            <nav class="landing-nav-pill-wrapper" id="desktop-nav-pill">
              <a href="#why-us" class="landing-nav-link" onclick="Landing.scrollTo('why-us');return false;">Why HRM Pro</a>
              <a href="#values" class="landing-nav-link" onclick="Landing.scrollTo('values');return false;">Values</a>
              <a href="#modules-catalog" class="landing-nav-link" onclick="Landing.scrollTo('modules-catalog');return false;">
                16 Modules <span style="font-size:10px;padding:2px 6px;border-radius:9999px;background:var(--color-primary);color:#FFFFFF;margin-left:4px">New</span>
              </a>
              <a href="#features" class="landing-nav-link" onclick="Landing.scrollTo('features');return false;">Pillars</a>
              <a href="#tax-calc" class="landing-nav-link" onclick="Landing.scrollTo('tax-calc');return false;">Tax Engine</a>
              <a href="#integrations" class="landing-nav-link" onclick="Landing.scrollTo('integrations');return false;">Integrations</a>
              <a href="#faq" class="landing-nav-link" onclick="Landing.scrollTo('faq');return false;">FAQ</a>
            </nav>

            <!-- Nav Action Buttons & Theme Switcher -->
            <div style="display:flex;align-items:center;gap:10px;">
              <!-- Light / Dark Theme Switcher Button -->
              <button class="landing-theme-toggle-btn" id="landing-theme-toggle" onclick="Landing.toggleTheme()" title="Switch Light / Dark Theme">
                <i class="fa fa-sun theme-icon-sun"></i>
                <i class="fa fa-moon theme-icon-moon"></i>
                <span class="theme-toggle-label">${savedTheme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>

              <button class="btn-automark-outline" style="padding:9px 20px;font-size:13.5px;" onclick="App.showLogin()">
                <i class="fa fa-arrow-right-to-bracket" style="font-size:11px;"></i> Sign In
              </button>
              <button class="btn-automark-primary" style="padding:9px 20px;font-size:13.5px;" onclick="Trial.show()">
                <i class="fa fa-rocket" style="font-size:11px;"></i> Free Trial
              </button>
            </div>
          </div>
        </header>

        <!-- ─── 2. HERO SECTION WITH 3 ANIMATED MOVING OBJECTS ─── -->
        <section class="landing-hero">
          <!-- Ambient Spore Particles Canvas -->
          <div class="hero-spore-container">
            <canvas class="heroSporeCanvas"></canvas>
          </div>

          <!-- THREE (3) 3D ANIMATED MOVING OBJECTS -->
          <div class="hero-3d-scene-container">
            <!-- 3D Moving Object 1: Holographic Gyroscope Cube (Top Right) -->
            <div class="anim-3d-cube-wrapper" title="3D Gyroscope Engine Node">
              <div class="anim-3d-cube">
                <div class="cube-face cube-front"><i class="fa fa-cubes"></i></div>
                <div class="cube-face cube-back"><i class="fa fa-layer-group"></i></div>
                <div class="cube-face cube-right"><i class="fa fa-chart-simple"></i></div>
                <div class="cube-face cube-left"><i class="fa fa-microchip"></i></div>
                <div class="cube-face cube-top"><i class="fa fa-shield-halved"></i></div>
                <div class="cube-face cube-bottom"><i class="fa fa-bolt"></i></div>
              </div>
            </div>

            <!-- 3D Moving Object 2: Planetary Workforce Orb & Orbit Rings (Top Left) -->
            <div class="anim-3d-orb-wrapper" title="3D Planetary Workforce Core">
              <div class="anim-3d-orb-core">
                <i class="fa fa-network-wired"></i>
              </div>
              <div class="anim-orbit-ring ring-a"></div>
              <div class="anim-orbit-ring ring-b"></div>
            </div>

            <!-- 3D Moving Object 3: Holographic Telemetry Badge & Biometric Radar (Bottom Right) -->
            <div class="anim-3d-shield-wrapper" title="Live Telemetry Ingestion Node">
              <div class="anim-3d-shield-card">
                <div class="shield-radar-box">
                  <div class="radar-sweep-beam"></div>
                  <i class="fa fa-fingerprint"></i>
                </div>
                <div style="text-align:left">
                  <div style="font-size:12.5px;font-weight:700;color:var(--color-heading);display:flex;align-items:center;gap:6px;">
                    <span class="live-pulse-dot"></span> Live Biometric Ingestion
                  </div>
                  <div style="font-size:11px;color:var(--color-text-dark)">ZKTeco & SilkID Fleet · 14ms latency</div>
                </div>
              </div>
            </div>
          </div>

          <div class="landing-hero-content">
            <div class="badge-automark">
              <i class="fa fa-sparkles"></i> Automated Workforce Intelligence Platform
            </div>

            <h1 class="landing-hero-title hasHighlight">
              The All-In-One Growth Software for <strong>Modern Enterprises</strong>
            </h1>

            <p class="landing-hero-subtitle">
              The complete automated workforce system designed to manage personnel master files, biometric punch fleets, multi-company holdings, and 100% compliant statutory FBR tax & 30/26 gratuity settlements — all in one unified cloud hub.
            </p>

            <div class="landing-hero-actions">
              <button class="btn-automark-primary" onclick="Trial.show()">
                <i class="fa fa-rocket"></i> Start Your 14-Day Free Trial
              </button>
              <button class="btn-automark-outline" onclick="App.showLogin()">
                <i class="fa fa-shield-halved"></i> Access Portal Demo
              </button>
            </div>
          </div>

          <!-- 3D Perspective Showcase Mockup -->
          <div class="hero-showcase-perspective">
            <div class="hero-dashboard-mockup">
              <!-- Mockup Window Bar -->
              <div class="mockup-topbar">
                <div class="mockup-window-controls">
                  <div class="mockup-dot red"></div>
                  <div class="mockup-dot yellow"></div>
                  <div class="mockup-dot green"></div>
                  <span style="margin-left:12px;font-size:12px;color:var(--color-text-dark);font-family:var(--font-primary);">hrm-pro.enterprise.cloud/dashboard</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                  <span class="mockup-company-badge">
                    <i class="fa fa-building-columns"></i> Apex Holding Corp (HQ) ▾
                  </span>
                  <span style="font-size:12px;color:#34D399;display:flex;align-items:center;gap:6px;font-weight:700">
                    <span class="live-pulse-dot"></span> Telemetry Active
                  </span>
                </div>
              </div>

              <!-- Mockup Body Content -->
              <div class="mockup-body">
                <div class="mockup-kpis-grid">
                  <div class="mockup-kpi-box">
                    <div class="kpi-title"><i class="fa fa-users" style="color:#60A5FA;margin-right:6px"></i> Active Personnel</div>
                    <div class="kpi-val">${totalEmps}</div>
                    <div class="kpi-trend" style="color:#34D399;"><i class="fa fa-arrow-trend-up"></i> 100% Master Files Verified</div>
                  </div>
                  <div class="mockup-kpi-box">
                    <div class="kpi-title"><i class="fa fa-clock" style="color:#34D399;margin-right:6px"></i> Today's Attendance</div>
                    <div class="kpi-val">${presentToday} <span style="font-size:16px;color:var(--color-text-dark)">/ ${totalEmps}</span></div>
                    <div class="kpi-trend" style="color:#34D399;"><i class="fa fa-fingerprint"></i> 92.3% Punctuality (Biometric Synced)</div>
                  </div>
                  <div class="mockup-kpi-box">
                    <div class="kpi-title"><i class="fa fa-money-bill-wave" style="color:#A78BFA;margin-right:6px"></i> Monthly Payroll</div>
                    <div class="kpi-val">PKR 4.85M</div>
                    <div class="kpi-trend" style="color:#A78BFA;"><i class="fa fa-scale-balanced"></i> Exact FBR Tax Deducted</div>
                  </div>
                  <div class="mockup-kpi-box">
                    <div class="kpi-title"><i class="fa fa-hourglass-half" style="color:#FBBF24;margin-right:6px"></i> Pending Clearances</div>
                    <div class="kpi-val">${pendingLeaves}</div>
                    <div class="kpi-trend" style="color:#FBBF24;"><i class="fa fa-file-signature"></i> Multi-Gate Exit & Leaves</div>
                  </div>
                </div>

                <!-- Showcase Feature Strip -->
                <div style="background:var(--color-card-subtle);border:1px solid var(--color-border);border-radius:18px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                  <div style="display:flex;align-items:center;gap:14px;">
                    <div style="width:38px;height:38px;border-radius:10px;background:rgba(99,102,241,0.15);color:var(--color-primary);display:flex;align-items:center;justify-content:center;">
                      <i class="fa fa-network-wired"></i>
                    </div>
                    <div style="text-align:left">
                      <div style="font-size:13.5px;font-weight:700;color:var(--color-heading)">Unified Holding Operations Active</div>
                      <div style="font-size:12px;color:var(--color-text-dark)">3 Subsidiary Entities · 2 Biometric Fleets · Automated Tax Clearing</div>
                    </div>
                  </div>
                  <button class="btn-automark-outline" style="padding:8px 18px;font-size:12.5px;" onclick="App.showLogin()">
                    Explore Live Dashboard <i class="fa fa-arrow-right" style="margin-left:6px;font-size:11px;"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 3. TRUST & STATS STRIP ─── -->
        <section class="landing-trust-strip">
          <div class="landing-trust-strip-title">Trusted By Leading Enterprises, Multi-Entity Holdings & Factory Hubs</div>
          <div class="landing-trust-badges-grid">
            <div class="landing-trust-item">
              <i class="fa fa-building-shield"></i>
              <div>
                <strong style="color:var(--color-heading);display:block;font-size:14.5px;margin-bottom:2px">Multi-Company Holdings</strong>
                <span style="font-size:12.5px;color:var(--color-text-dark)">Head Office & Subsidiary Data Scoping</span>
              </div>
            </div>
            <div class="landing-trust-item">
              <i class="fa fa-fingerprint"></i>
              <div>
                <strong style="color:var(--color-heading);display:block;font-size:14.5px;margin-bottom:2px">Biometric Fleet Hub</strong>
                <span style="font-size:12.5px;color:var(--color-text-dark)">Live Hardware Ingestion & Remote IP Gates</span>
              </div>
            </div>
            <div class="landing-trust-item">
              <i class="fa fa-money-bill-transfer"></i>
              <div>
                <strong style="color:var(--color-heading);display:block;font-size:14.5px;margin-bottom:2px">SPMS Payroll & 6 CSVs</strong>
                <span style="font-size:12.5px;color:var(--color-text-dark)">Exact FBR Tax Engine & Bank Splitter</span>
              </div>
            </div>
            <div class="landing-trust-item">
              <i class="fa fa-file-invoice-dollar"></i>
              <div>
                <strong style="color:var(--color-heading);display:block;font-size:14.5px;margin-bottom:2px">Statutory F&F Settlement</strong>
                <span style="font-size:12.5px;color:var(--color-text-dark)">Automated 30/26 Gratuity & Clearances</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 4. THE WORKFORCE FRICTION GAP (WHY US) ─── -->
        <section class="section-box-automark" id="why-us">
          <div class="section-intro-automark">
            <div class="badge-automark"><i class="fa fa-triangle-exclamation"></i> The Operational Gap</div>
            <h2 class="hasHighlight">Are you losing real workforce hours to the <strong>Manual HR Gap?</strong></h2>
            <p>Stop wasting money and leadership time on fragmented spreadsheets, lost WhatsApp leave requests, and guesswork tax calculations that trigger statutory penalties.</p>
          </div>

          <!-- 6 Friction Chips -->
          <div class="gap-chips-container">
            <div class="gap-chip"><i class="fa fa-xmark"></i> Wasted Payroll Spreadsheets (50+ hrs/mo)</div>
            <div class="gap-chip"><i class="fa fa-xmark"></i> Ghost Punches & Unsynced Scanners</div>
            <div class="gap-chip"><i class="fa fa-xmark"></i> Inaccurate FBR Tax Deductions & Audits</div>
            <div class="gap-chip"><i class="fa fa-xmark"></i> Disconnected Subsidiary Data Silos</div>
            <div class="gap-chip"><i class="fa fa-xmark"></i> Uncalculated 30/26 Exit Gratuity Disputes</div>
            <div class="gap-chip"><i class="fa fa-xmark"></i> Lost Candidate Resumes & Delayed ATS</div>
          </div>

          <!-- Side-by-Side Comparison -->
          <div class="problem-solution-grid-automark">
            <div class="ps-card-automark broken">
              <span class="ps-card-tag"><i class="fa fa-xmark"></i> The Broken Legacy Franken-Stack</span>
              <h3 style="font-size:22px;margin-bottom:12px;color:var(--color-heading)">Disconnected Tools & Manual Guesswork</h3>
              <p style="font-size:14.5px;color:var(--color-text-dark);line-height:1.6">HR teams juggle 5 separate tools, paper files, and WhatsApp chats, leading to salary errors, ghost punches, and audit penalties.</p>
              <ul class="ps-list-automark">
                <li class="ps-list-item-automark" style="color:#F87171"><i class="fa fa-circle-xmark"></i> Disconnected Excel files prone to formula crashes and data loss</li>
                <li class="ps-list-item-automark" style="color:#F87171"><i class="fa fa-circle-xmark"></i> Physical biometric scanners offline with manual USB log extraction</li>
                <li class="ps-list-item-automark" style="color:#F87171"><i class="fa fa-circle-xmark"></i> Outdated tax tables causing employee withholding tax discrepancies</li>
                <li class="ps-list-item-automark" style="color:#F87171"><i class="fa fa-circle-xmark"></i> Zero subsidiary data isolation for multi-company holdings</li>
                <li class="ps-list-item-automark" style="color:#F87171"><i class="fa fa-circle-xmark"></i> Unstandardized exit gratuity computations leading to labor court claims</li>
              </ul>
            </div>

            <div class="ps-card-automark solution">
              <span class="ps-card-tag"><i class="fa fa-check"></i> The HRM Pro Unified Engine</span>
              <h3 style="font-size:22px;margin-bottom:12px;color:var(--color-heading)">Automated, Audit-Proof & Cloud Synced</h3>
              <p style="font-size:14.5px;color:var(--color-text);line-height:1.6">All 16 operational workforce pillars operate seamlessly in one unified cloud database with strict statutory compliance and live hardware sync.</p>
              <ul class="ps-list-automark">
                <li class="ps-list-item-automark" style="color:#34D399"><i class="fa fa-circle-check"></i> Real-time cloud database with complete digital employee master files (e-DMS)</li>
                <li class="ps-list-item-automark" style="color:#34D399"><i class="fa fa-circle-check"></i> Live biometric hardware push API across Head Office & Factory terminals</li>
                <li class="ps-list-item-automark" style="color:#34D399"><i class="fa fa-circle-check"></i> Native SPMS payroll engine with official FY 2025-26 & 2026-27 FBR tax brackets</li>
                <li class="ps-list-item-automark" style="color:#34D399"><i class="fa fa-circle-check"></i> Model A Multi-Company isolation with unified holding executive governance</li>
                <li class="ps-list-item-automark" style="color:#34D399"><i class="fa fa-circle-check"></i> Statutory 30/26 Gratuity exit settlements with multi-gate clearance vouchers</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ─── 5. VALUE PROPOSITION CARDS ─── -->
        <section class="value-props-section" id="values">
          <div class="section-intro-automark">
            <div class="badge-automark"><i class="fa fa-gem"></i> Core Value System</div>
            <h2 class="hasHighlight">Replace Your Clunky Tools With A <strong>Smart, All-In-One System</strong></h2>
            <p>Log in to a single powerful command center to manage your holding workforce seamlessly.</p>
          </div>

          <div class="value-cards-grid">
            <div class="value-card-automark">
              <div class="value-card-icon-box"><i class="fa fa-building-shield"></i></div>
              <h3 class="value-card-title">Multi-Company Holdings</h3>
              <p class="value-card-desc">Govern parent holdings and autonomous subsidiary business units with strict Model A data isolation and unified group telemetry.</p>
              <ul class="value-card-list">
                <li><i class="fa fa-circle-check"></i> Unified Holding Command Center</li>
                <li><i class="fa fa-circle-check"></i> Model A Subsidiary Scoped Security</li>
                <li><i class="fa fa-circle-check"></i> 1-Click Entity & Branch Switcher</li>
              </ul>
            </div>

            <div class="value-card-automark">
              <div class="value-card-icon-box"><i class="fa fa-fingerprint"></i></div>
              <h3 class="value-card-title">Biometric Fleet Gateway</h3>
              <p class="value-card-desc">Direct hardware push integration with physical fingerprint/facial scanners across branches, remote IP gates, and overtime calculations.</p>
              <ul class="value-card-list">
                <li><i class="fa fa-circle-check"></i> Real-Time Punch Ingestion API</li>
                <li><i class="fa fa-circle-check"></i> Arrival Buffers & Late Deductions</li>
                <li><i class="fa fa-circle-check"></i> Automated Overtime Token Feeds</li>
              </ul>
            </div>

            <div class="value-card-automark">
              <div class="value-card-icon-box"><i class="fa fa-money-bill-transfer"></i></div>
              <h3 class="value-card-title">SPMS Payroll & Tax</h3>
              <p class="value-card-desc">Error-free monthly pay runs with exact FBR income tax slabs, 6 exportable banking CSV batches, and cumulative EOBI ledgers.</p>
              <ul class="value-card-list">
                <li><i class="fa fa-circle-check"></i> Official FY 2025-27 Tax Slabs</li>
                <li><i class="fa fa-circle-check"></i> 6 CSV Financial Disbursal Files</li>
                <li><i class="fa fa-circle-check"></i> Gross vs Splitter Bank Accounts</li>
              </ul>
            </div>

            <div class="value-card-automark">
              <div class="value-card-icon-box"><i class="fa fa-file-invoice-dollar"></i></div>
              <h3 class="value-card-title">Statutory Exit & Gratuity</h3>
              <p class="value-card-desc">End-to-end offboarding with legal 30/26 gratuity computations, multi-department sign-offs, and printable settlement vouchers.</p>
              <ul class="value-card-list">
                <li><i class="fa fa-circle-check"></i> Legal 30/26 Formula Automation</li>
                <li><i class="fa fa-circle-check"></i> IT, Finance & Dept Clearances</li>
                <li><i class="fa fa-circle-check"></i> Printable Final Settlement Vouchers</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ─── 6. ALL 16 ENTERPRISE MODULES & DETAILED FEATURE CATALOG ─── -->
        <section class="modules-catalog-section" id="modules-catalog">
          <div class="section-intro-automark">
            <div class="badge-automark"><i class="fa fa-cubes"></i> Complete System Inventory</div>
            <h2 class="hasHighlight">All 16 Enterprise Modules & <strong>Feature Details</strong></h2>
            <p>Our platform delivers 16 interconnected operational modules with role-based governance. Click any module below to inspect full capabilities and workflows.</p>
          </div>

          <!-- Category Filter Bar -->
          <div class="catalog-filter-bar">
            <button class="catalog-filter-btn active" data-cat="all" onclick="Landing.filterModulesCatalog('all')">
              All 16 Modules
            </button>
            <button class="catalog-filter-btn" data-cat="workforce" onclick="Landing.filterModulesCatalog('workforce')">
              Core Workforce
            </button>
            <button class="catalog-filter-btn" data-cat="finance" onclick="Landing.filterModulesCatalog('finance')">
              Compensation & Talent
            </button>
            <button class="catalog-filter-btn" data-cat="operations" onclick="Landing.filterModulesCatalog('operations')">
              Operations & BI
            </button>
            <button class="catalog-filter-btn" data-cat="governance" onclick="Landing.filterModulesCatalog('governance')">
              Holdings & Legal
            </button>
          </div>

          <!-- Dynamic 16 Modules Cards Grid -->
          <div class="modules-catalog-grid" id="modules-catalog-grid">
            ${this.getModulesCatalogHtml('all')}
          </div>
        </section>

        <!-- ─── 7. INTERACTIVE 8-PILLAR CORE HR SHOWCASE ─── -->
        <section class="pillar-tabs-container" id="features">
          <div class="section-intro-automark">
            <div class="badge-automark"><i class="fa fa-layer-group"></i> 8 Enterprise Pillars</div>
            <h2 class="hasHighlight">Explore The <strong>Core Platform Pillars</strong></h2>
            <p>Inspect live telemetry metrics, security access gates, and architectural workflows for our signature engines.</p>
          </div>

          <div class="pillar-tabs-nav" role="tablist">
            <button class="pillar-tab-btn ${Landing.activePillar === 'people' ? 'active' : ''}" onclick="Landing.switchPillar('people')">
              <i class="fa fa-users"></i> People & e-DMS
            </button>
            <button class="pillar-tab-btn ${Landing.activePillar === 'attendance' ? 'active' : ''}" onclick="Landing.switchPillar('attendance')">
              <i class="fa fa-clock"></i> Biometric Fleet
            </button>
            <button class="pillar-tab-btn ${Landing.activePillar === 'payroll' ? 'active' : ''}" onclick="Landing.switchPillar('payroll')">
              <i class="fa fa-money-bill-wave"></i> SPMS Payroll & Tax
            </button>
            <button class="pillar-tab-btn ${Landing.activePillar === 'multi_company' ? 'active' : ''}" onclick="Landing.switchPillar('multi_company')">
              <i class="fa fa-building-shield"></i> Multi-Company Holdings
            </button>
            <button class="pillar-tab-btn ${Landing.activePillar === 'settlement' ? 'active' : ''}" onclick="Landing.switchPillar('settlement')">
              <i class="fa fa-file-invoice-dollar"></i> Exit & Gratuity
            </button>
            <button class="pillar-tab-btn ${Landing.activePillar === 'recruitment' ? 'active' : ''}" onclick="Landing.switchPillar('recruitment')">
              <i class="fa fa-briefcase"></i> Recruitment ATS
            </button>
            <button class="pillar-tab-btn ${Landing.activePillar === 'performance' ? 'active' : ''}" onclick="Landing.switchPillar('performance')">
              <i class="fa fa-chart-line"></i> Performance & OKRs
            </button>
            <button class="pillar-tab-btn ${Landing.activePillar === 'training' ? 'active' : ''}" onclick="Landing.switchPillar('training')">
              <i class="fa fa-graduation-cap"></i> Training & LMS
            </button>
          </div>

          <div class="pillar-showcase-panel" id="pillar-showcase-panel">
            ${Landing.getPillarCardHtml(Landing.activePillar)}
          </div>
        </section>

        <!-- ─── 8. FOUNDER / CEO THOUGHT SECTION ─── -->
        <div class="ourstory-section">
          <div class="ourstory-quote-mark">
            <i class="fa fa-quote-left"></i>
          </div>
          <h2 class="ourstory-title hasHighlight">
            We know you didn't build your enterprise to spend weekends <strong>Debugging Payroll Spreadsheets</strong>
          </h2>
          <blockquote class="ourstory-quote">
            "Before HRM Pro, our accounts and HR department spent 7 full days at each month-end reconciling biometric attendance logs, manually computing FBR tax brackets, and settling subsidiary transfers. Now, our entire holding payroll of 450+ staff across 3 corporate entities runs in under 12 minutes with 100% audit accuracy."
          </blockquote>
          <div style="font-family:var(--font-secondary);font-size:18px;font-weight:700;color:var(--color-heading)">Ronald Richards</div>
          <div style="font-size:13.5px;color:var(--color-primary);font-weight:600">Group Chief Operating Officer · Nexus Holdings</div>
        </div>

        <!-- ─── 9. TESTIMONIAL & STAT BLOBS ─── -->
        <section class="testimonial-section-automark" id="testimonials">
          <div class="testimonial-grid-automark">
            <div class="stat-blobs-col">
              <div class="blob-message-automark">
                <strong>10,000+</strong>
                Active Personnel Managed Across Regional Hubs
              </div>
              <div class="blob-message-automark" style="margin-left:20px;">
                <strong>5x Faster</strong>
                Automated Leave & Multi-Gate Exit Approvals
              </div>
              <div class="blob-message-automark">
                <strong>100% Audit-Ready</strong>
                Statutory FBR Tax & Legal 30/26 Gratuity Compliance
              </div>
            </div>

            <div class="testimonial-card-automark">
              <div style="color:#FBBF24;font-size:18px;margin-bottom:20px;display:flex;gap:4px;">
                <i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>
              </div>
              <blockquote style="font-size:19px;line-height:1.7;color:var(--color-heading);font-family:var(--font-secondary);margin-bottom:28px;">
                "This all-in-one software is exactly what our enterprise holding group needed. It completely eliminated our need for 4 separate disconnected vendors, streamlined our biometric punch fleet across factory sites, and gave our board instant visibility into subsidiary headcount costs."
              </blockquote>
              <div style="display:flex;align-items:center;gap:16px;">
                <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-accent-cyan));display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-size:20px;font-weight:800;">
                  RR
                </div>
                <div>
                  <h4 style="font-size:17px;font-weight:700;color:var(--color-heading);margin-bottom:2px">Ronald Richards</h4>
                  <p style="font-size:13px;color:var(--color-text-dark);margin:0">Group Chief Operating Officer, Indus Holdings</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 10. 3-STEP PATH TO AUTOMATED WORKFORCE GROWTH ─── -->
        <section class="growth-process-section" id="process">
          <div class="section-intro-automark">
            <div class="badge-automark"><i class="fa fa-route"></i> Seamless Deployment</div>
            <h2 class="hasHighlight">Your 3-Step Path to <strong>Automated Workforce Operations</strong></h2>
            <p>Transform your entire human resource lifecycle from manual friction to autonomous accuracy in days.</p>
          </div>

          <div class="growth-steps-grid">
            <div class="growth-step-card">
              <div class="growth-step-badge">01</div>
              <h3 style="font-size:20px;font-weight:700;margin-bottom:12px;color:var(--color-heading)">Configure Group Holdings</h3>
              <p style="font-size:14.5px;color:var(--color-text);line-height:1.6">Set up your parent corporate entity, autonomous subsidiaries, branches, and custom grading rules in under 15 minutes.</p>
            </div>
            <div class="growth-step-card">
              <div class="growth-step-badge">02</div>
              <h3 style="font-size:20px;font-weight:700;margin-bottom:12px;color:var(--color-heading)">Connect Hardware & Staff</h3>
              <p style="font-size:14.5px;color:var(--color-text);line-height:1.6">Import digital personnel master files, link physical biometric scanner terminal IPs, and invite department managers with role-based gates.</p>
            </div>
            <div class="growth-step-card">
              <div class="growth-step-badge">03</div>
              <h3 style="font-size:20px;font-weight:700;margin-bottom:12px;color:var(--color-heading)">Scale on Autopilot</h3>
              <p style="font-size:14.5px;color:var(--color-text);line-height:1.6">Watch daily attendance aggregate, run 1-click statutory payroll with exact FBR tax deductions, and disburse 6 banking CSV files automatically.</p>
            </div>
          </div>

          <div>
            <button class="btn-automark-primary" onclick="Trial.show()">
              <i class="fa fa-rocket"></i> Start Your 14-Day Free Trial
            </button>
          </div>
        </section>

        <!-- ─── 11. PAKISTAN STATUTORY TAX CALCULATOR ─── -->
        <section class="tax-calc-section" id="tax-calc">
          <div class="tax-calc-card">
            <div style="text-align:center;max-width:720px;margin:0 auto 40px auto">
              <div class="badge-automark">
                <i class="fa fa-calculator text-primary"></i> Live Statutory Payroll Estimator
              </div>
              <h2 class="hasHighlight" style="font-size:34px;margin-bottom:12px;color:var(--color-heading)">
                Interactive Salary & <strong>Income Tax Calculator</strong>
              </h2>
              <p style="font-size:15px;color:var(--color-text);line-height:1.6">
                Calculate real-time monthly take-home pay, progressive FBR income tax withholdings, and statutory funds under official Pakistan Tax Slabs (FY 2025-26 & 2026-27).
              </p>
            </div>

            <div class="tax-calc-grid">
              <!-- Inputs Side -->
              <div style="background:var(--color-card-subtle);border:1px solid var(--color-border);border-radius:24px;padding:30px;">
                <label style="font-size:14px;font-weight:700;color:var(--color-heading);display:block;margin-bottom:8px">
                  Monthly Gross Salary (PKR)
                </label>
                <div style="position:relative;margin-bottom:16px">
                  <span style="position:absolute;left:16px;top:12px;font-weight:800;color:var(--color-primary);font-size:15px">PKR</span>
                  <input type="number" id="tax-input-gross" value="150000" min="0" max="10000000" step="5000"
                    style="width:100%;box-sizing:border-box;background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:12px 14px 12px 60px;font-size:18px;font-weight:800;color:var(--color-heading);outline:none"
                    oninput="Landing.updateTaxCalc(this.value)">
                </div>

                <input type="range" id="tax-slider-gross" min="30000" max="1500000" step="5000" value="150000" class="tax-range-slider"
                  oninput="Landing.updateTaxCalc(this.value)">

                <!-- Quick Presets Chips -->
                <div style="font-size:12px;color:var(--color-text-dark);margin-top:16px;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">Quick Salary Presets:</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                  <button type="button" class="tax-preset-chip" onclick="Landing.setTaxPreset(80000)">PKR 80k</button>
                  <button type="button" class="tax-preset-chip active" onclick="Landing.setTaxPreset(150000)">PKR 150k</button>
                  <button type="button" class="tax-preset-chip" onclick="Landing.setTaxPreset(250000)">PKR 250k</button>
                  <button type="button" class="tax-preset-chip" onclick="Landing.setTaxPreset(500000)">PKR 500k</button>
                  <button type="button" class="tax-preset-chip" onclick="Landing.setTaxPreset(1000000)">PKR 1.0M</button>
                </div>

                <!-- Custom Deductions -->
                <div style="margin-top:22px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 18px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="Landing.toggleCustomDeductions()">
                    <span style="font-size:13px;font-weight:700;color:var(--color-primary);display:flex;align-items:center;gap:8px">
                      <i class="fa fa-sliders"></i> Customize Provident Fund & EOBI Deductions
                    </span>
                    <i class="fa fa-chevron-down" id="custom-deductions-caret" style="color:var(--color-text-dark);font-size:11px"></i>
                  </div>
                  <div id="custom-deductions-body" style="display:none;margin-top:14px;padding-top:12px;border-top:1px solid var(--color-border)">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                      <div>
                        <label style="font-size:12px;color:var(--color-text);display:block;margin-bottom:4px">PF Contribution (%)</label>
                        <input type="number" id="tax-input-pf" value="0" min="0" max="25" step="1"
                          style="width:100%;box-sizing:border-box;background:var(--color-card-subtle);border:1px solid var(--color-border);border-radius:8px;padding:8px 10px;font-size:14px;color:var(--color-heading)"
                          oninput="Landing.updateTaxCalc(document.getElementById('tax-input-gross').value)">
                      </div>
                      <div>
                        <label style="font-size:12px;color:var(--color-text);display:block;margin-bottom:4px">EOBI Employee (PKR)</label>
                        <input type="number" id="tax-input-eobi" value="130" min="0" max="5000" step="10"
                          style="width:100%;box-sizing:border-box;background:var(--color-card-subtle);border:1px solid var(--color-border);border-radius:8px;padding:8px 10px;font-size:14px;color:var(--color-heading)"
                          oninput="Landing.updateTaxCalc(document.getElementById('tax-input-gross').value)">
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Results Side -->
              <div class="tax-result-box">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--color-border)">
                  <div>
                    <div style="font-size:12px;font-weight:700;color:var(--color-text-dark);text-transform:uppercase;letter-spacing:0.04em">Take-Home Pay (Monthly)</div>
                    <div style="font-size:34px;font-weight:800;color:#34D399;font-family:var(--font-secondary);" id="calc-net-salary">PKR 147,370</div>
                  </div>
                  <div style="text-align:right">
                    <span style="display:inline-block;padding:5px 12px;border-radius:9999px;background:rgba(52,211,153,0.15);color:#34D399;font-size:12px;font-weight:700">
                      Tax Compliant
                    </span>
                  </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:12px;font-size:14px;">
                  <div style="display:flex;justify-content:space-between;color:var(--color-text)">
                    <span>Annual Taxable Gross</span>
                    <strong style="color:var(--color-heading)" id="calc-annual-gross">PKR 1,800,000</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;color:var(--color-text)">
                    <span>Applicable FBR Tax Slab</span>
                    <strong style="color:var(--color-primary)" id="calc-tax-slab">Slab 2 (PKR 1.2M - 2.4M)</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;color:var(--color-text)">
                    <span>Monthly Income Tax Withholding</span>
                    <strong style="color:#F87171" id="calc-monthly-tax">PKR 2,500</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;color:var(--color-text)">
                    <span>Statutory EOBI Deduction</span>
                    <strong style="color:var(--color-text)" id="calc-monthly-eobi">PKR 130</strong>
                  </div>
                </div>

                <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--color-border)">
                  <button class="btn-automark-primary" style="width:100%;" onclick="Trial.show()">
                    <i class="fa fa-file-invoice-dollar"></i> Run Full Holding Payroll
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 12. CONNECT ALL YOUR APPLICATIONS (INTEGRATIONS) ─── -->
        <section class="integrations-section" id="integrations">
          <div class="section-intro-automark">
            <div class="badge-automark"><i class="fa fa-plug"></i> Ecosystem Hub</div>
            <h2 class="hasHighlight">Connect All Your <strong>Workforce Applications</strong></h2>
            <p>Seamlessly integrate physical biometric scanners, official statutory portals, and enterprise communication channels.</p>
          </div>

          <div class="integrations-bubbles-grid">
            <div class="integration-bubble">
              <i class="fa fa-fingerprint"></i>
              <span>ZKTeco & SilkID</span>
            </div>
            <div class="integration-bubble">
              <i class="fa fa-building-columns"></i>
              <span>FBR IRIS Portal</span>
            </div>
            <div class="integration-bubble">
              <i class="fa fa-money-check"></i>
              <span>1Link & 6 Banks</span>
            </div>
            <div class="integration-bubble">
              <i class="fa fa-shield-halved"></i>
              <span>EOBI / PESSI</span>
            </div>
            <div class="integration-bubble">
              <i class="fa-brands fa-microsoft"></i>
              <span>Microsoft 365</span>
            </div>
            <div class="integration-bubble">
              <i class="fa-brands fa-slack"></i>
              <span>Slack Alerts</span>
            </div>
            <div class="integration-bubble">
              <i class="fa-brands fa-google"></i>
              <span>Google Safe</span>
            </div>
            <div class="integration-bubble">
              <i class="fa-brands fa-whatsapp"></i>
              <span>WhatsApp Bot</span>
            </div>
          </div>
        </section>

        <!-- ─── 13. ENTERPRISE SECURITY & GOVERNANCE ─── -->
        <section class="section-box-automark" id="security" style="padding-top:40px;">
          <div class="section-intro-automark">
            <div class="badge-automark"><i class="fa fa-lock"></i> Bank-Grade Protection</div>
            <h2 class="hasHighlight">Enterprise Security, Privacy & <strong>Audit Safe</strong></h2>
            <p>Engineered for high-compliance multi-entity organizations, manufacturing hubs, and public corporate groups.</p>
          </div>

          <div class="value-cards-grid">
            <div class="value-card-automark">
              <div class="value-card-icon-box"><i class="fa fa-shield-halved"></i></div>
              <h3 class="value-card-title">Role-Based Access</h3>
              <p class="value-card-desc">5 discrete permission tiers: Super Admin, HR Director, Department Manager, Finance/Accounts, and Self-Service Employee.</p>
            </div>
            <div class="value-card-automark">
              <div class="value-card-icon-box"><i class="fa fa-file-shield"></i></div>
              <h3 class="value-card-title">AES-256 Encrypted e-DMS</h3>
              <p class="value-card-desc">Personnel contracts, national IDs, and salary documents encrypted at rest and in transit with strict permission watermarks.</p>
            </div>
            <div class="value-card-automark">
              <div class="value-card-icon-box"><i class="fa fa-building-lock"></i></div>
              <h3 class="value-card-title">Model A Scoped Isolation</h3>
              <p class="value-card-desc">Subsidiary HR managers cannot view sister company data, preventing unauthorized intra-group salary disclosure.</p>
            </div>
            <div class="value-card-automark">
              <div class="value-card-icon-box"><i class="fa fa-receipt"></i></div>
              <h3 class="value-card-title">Immutable Audit Safe</h3>
              <p class="value-card-desc">Every punch modification, salary change, and exit settlement is stamped with timestamp, IP address, and author ID.</p>
            </div>
          </div>
        </section>

        <!-- ─── 14. RICH FAQ ACCORDION ─── -->
        <section class="landing-faq-section" id="faq">
          <div class="section-intro-automark">
            <div class="badge-automark"><i class="fa fa-circle-question"></i> Common Questions</div>
            <h2 class="hasHighlight">Frequently Asked <strong>Questions</strong></h2>
            <p>Everything you need to know about setting up HRM Pro for your enterprise.</p>
          </div>

          <div>
            <div class="faq-item" onclick="Landing.toggleFaq(1)">
              <div class="faq-question">
                <span>How does Multi-Company Model A Scoping work?</span>
                <i class="fa fa-chevron-down" id="faq-caret-1" style="color:var(--color-primary);font-size:13px"></i>
              </div>
              <div class="faq-answer" id="faq-answer-1" style="display:none;">
                Model A Scoping isolates employee data, attendance logs, and payroll records per corporate subsidiary. Subsidiary HR managers only have access to their company records, while Group Super Admins have unified global telemetry and reporting across all entities.
              </div>
            </div>

            <div class="faq-item" onclick="Landing.toggleFaq(2)">
              <div class="faq-question">
                <span>Can we connect our physical ZKTeco biometric machines?</span>
                <i class="fa fa-chevron-down" id="faq-caret-2" style="color:var(--color-primary);font-size:13px"></i>
              </div>
              <div class="faq-answer" id="faq-answer-2" style="display:none;">
                Yes! HRM Pro comes bundled with the background attendance agent (Node.js & Python drivers). It communicates directly with ZKTeco, SilkID, and standalone IP terminals, streaming check-in punches straight to the cloud in real-time.
              </div>
            </div>

            <div class="faq-item" onclick="Landing.toggleFaq(3)">
              <div class="faq-question">
                <span>Are Pakistan FBR Salaried Tax Slabs (2025-27) supported?</span>
                <i class="fa fa-chevron-down" id="faq-caret-3" style="color:var(--color-primary);font-size:13px"></i>
              </div>
              <div class="faq-answer" id="faq-answer-3" style="display:none;">
                100% yes. The native SPMS payroll engine automatically applies progressive tax brackets, computes monthly withholding amounts, and handles EOBI & Provident Fund shares with zero manual math.
              </div>
            </div>

            <div class="faq-item" onclick="Landing.toggleFaq(4)">
              <div class="faq-question">
                <span>How does Statutory 30/26 Gratuity Exit Settlement operate?</span>
                <i class="fa fa-chevron-down" id="faq-caret-4" style="color:var(--color-primary);font-size:13px"></i>
              </div>
              <div class="faq-answer" id="faq-answer-4" style="display:none;">
                When an employee resigns or exits, HRM Pro calculates their legal gratuity under the statutory (Last Gross Salary ÷ 26 × 30) formula multiplied by qualifying years of service. It triggers multi-gate clearances across IT, HR, and Accounts before issuing printable vouchers.
              </div>
            </div>

            <div class="faq-item" onclick="Landing.toggleFaq(5)">
              <div class="faq-question">
                <span>Can we generate bank-ready salary disbursal files?</span>
                <i class="fa fa-chevron-down" id="faq-caret-5" style="color:var(--color-primary);font-size:13px"></i>
              </div>
              <div class="faq-answer" id="faq-answer-5" style="display:none;">
                Yes, HRM Pro generates 6 standard CSV disbursal formats formatted for commercial banks, 1Link, and PayPak, including Gross vs Splitter bank accounts.
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 15. BOTTOM CALL TO ACTION ─── -->
        <section class="landing-cta-section">
          <h2 class="landing-cta-title hasHighlight">
            Ready to Put Your Workforce Operations on <strong>Autopilot?</strong>
          </h2>
          <p class="landing-cta-sub">
            Join hundreds of enterprises that run multi-company holdings, hardware biometric fleets, and 100% compliant statutory payroll on HRM Pro.
          </p>
          <div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;">
            <button class="btn-automark-primary" onclick="Trial.show()">
              <i class="fa fa-rocket"></i> Start Your 14-Day Free Trial
            </button>
            <button class="btn-automark-outline" onclick="App.showLogin()">
              <i class="fa fa-shield-halved"></i> Access Portal Demo
            </button>
          </div>
        </section>

        <!-- ─── 16. MODERN FOOTER ─── -->
        <footer class="landing-footer">
          <div class="landing-footer-grid">
            <div>
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
                <div class="landing-brand-icon" style="width:36px;height:36px;font-size:16px;">
                  <i class="fa fa-users"></i>
                </div>
                <div class="landing-brand-name" style="font-size:20px;">HRM Pro</div>
              </div>
              <p style="font-size:14px;line-height:1.6;color:var(--color-text-dark);max-width:320px;margin-bottom:20px;">
                The complete automated workforce system designed for modern multi-entity enterprises, holding companies, and manufacturing hubs.
              </p>
              <div style="font-size:13.5px;color:var(--color-text-dark)">
                <i class="fa fa-envelope" style="color:var(--color-primary);margin-right:8px"></i> enterprise@hrmpro.cloud<br>
                <i class="fa fa-phone" style="color:var(--color-primary);margin-right:8px;margin-top:8px"></i> +92 (51) 880-9900
              </div>
            </div>

            <div class="landing-footer-col">
              <h4>Core Platforms</h4>
              <ul>
                <li><a href="#" onclick="Landing.showModule('employees');return false;">People & e-DMS</a></li>
                <li><a href="#" onclick="Landing.showModule('attendance');return false;">Biometric Fleet</a></li>
                <li><a href="#" onclick="Landing.showModule('payroll');return false;">SPMS Payroll</a></li>
                <li><a href="#" onclick="Landing.showModule('company');return false;">Multi-Company</a></li>
                <li><a href="#" onclick="Landing.showModule('settlement');return false;">Exit Settlements</a></li>
              </ul>
            </div>

            <div class="landing-footer-col">
              <h4>Governance</h4>
              <ul>
                <li><a href="#security" onclick="Landing.scrollTo('security');return false;">Role-Based Matrix</a></li>
                <li><a href="#security" onclick="Landing.scrollTo('security');return false;">AES-256 Encryption</a></li>
                <li><a href="#security" onclick="Landing.scrollTo('security');return false;">Model A Isolation</a></li>
                <li><a href="#security" onclick="Landing.scrollTo('security');return false;">Immutable Audit Safe</a></li>
                <li><a href="#tax-calc" onclick="Landing.scrollTo('tax-calc');return false;">Tax Slabs 2026-27</a></li>
              </ul>
            </div>

            <div class="landing-footer-col">
              <h4>Portals</h4>
              <ul>
                <li><a href="#" onclick="App.showLogin();return false;">Super Admin Command</a></li>
                <li><a href="#" onclick="App.showLogin();return false;">HR Director Workspace</a></li>
                <li><a href="#" onclick="App.showLogin();return false;">Finance & Accounts</a></li>
                <li><a href="#" onclick="App.showLogin();return false;">Employee Self-Service</a></li>
                <li><a href="#" onclick="Trial.show();return false;">Start Free Trial</a></li>
              </ul>
            </div>
          </div>

          <div class="landing-footer-bottom">
            <div>© 2026 HRM Pro Enterprise Edition. All rights reserved.</div>
            <div style="display:flex;gap:20px;">
              <a href="#" onclick="return false;" style="color:var(--color-text-dark);text-decoration:none">Privacy Policy</a>
              <a href="#" onclick="return false;" style="color:var(--color-text-dark);text-decoration:none">Terms of Service</a>
              <a href="#" onclick="return false;" style="color:var(--color-text-dark);text-decoration:none">Security Whitepaper</a>
            </div>
          </div>
        </footer>
      </div>
    `;

    // Apply saved theme
    this.applyTheme(savedTheme);

    // Initialize interactive tax calculator & spore particle canvas
    setTimeout(() => {
      Landing.updateTaxCalc(150000);
      if (typeof window.initSporeCanvas === 'function') {
        window.initSporeCanvas();
      }
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
  
  activeCatalogCategory: 'all',

  toggleTheme() {
    const current = localStorage.getItem('landing_theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('landing_theme', next);
    this.applyTheme(next);
  },

  applyTheme(theme) {
    const page = document.getElementById('landing-page');
    const wrapper = document.querySelector('.landing-wrapper');
    if (page) page.setAttribute('data-landing-theme', theme);
    if (wrapper) wrapper.setAttribute('data-landing-theme', theme);
    const label = document.querySelector('.theme-toggle-label');
    if (label) label.innerText = theme === 'dark' ? 'Dark' : 'Light';
    const toggleBtn = document.getElementById('landing-theme-toggle');
    if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to ' + (theme === 'dark' ? 'Light' : 'Dark') + ' Theme');
  },

  getModulesCatalogHtml(activeCategory = 'all') {
    const modules = Object.values(this.modulesData || {});
    const filtered = activeCategory === 'all' 
      ? modules 
      : modules.filter(m => {
          if (activeCategory === 'workforce') return ['Core Workforce', 'Time & Attendance', 'Leaves & Absences', 'Talent Acquisition'].includes(m.category);
          if (activeCategory === 'finance') return ['Compensation', 'Talent & Development', 'Performance', 'Expenses'].includes(m.category);
          if (activeCategory === 'operations') return ['Operations', 'Support', 'Company Culture', 'Executive BI'].includes(m.category);
          if (activeCategory === 'governance') return ['Multi-Company Holdings', 'Legal & Settlements', 'Governance', 'System Administration'].includes(m.category);
          return m.category === activeCategory;
        });

    return filtered.map(m => {
      const caps = (m.capabilities || []).slice(0, 3);
      return `
        <div class="module-catalog-card" data-category="${m.category}" onclick="Landing.showModule('${m.id}')">
          <div class="module-catalog-top">
            <div class="module-catalog-icon" style="background:${m.color}1a;color:${m.color}">
              <i class="fa ${m.icon}"></i>
            </div>
            <span class="module-catalog-cat-badge">${m.category}</span>
          </div>
          <h3 class="module-catalog-title">${m.title}</h3>
          <p class="module-catalog-desc">${m.subtitle}</p>
          
          <ul class="module-caps-list">
            ${caps.map(c => `
              <li class="module-cap-item">
                <i class="fa ${c.icon || 'fa-check'}"></i>
                <div><strong>${c.title}:</strong> ${c.desc}</div>
              </li>
            `).join('')}
          </ul>

          <div class="module-catalog-footer">
            <span class="module-role-pill"><i class="fa fa-user-shield"></i> ${m.recommendedRole ? m.recommendedRole.toUpperCase() : 'ALL'} Access</span>
            <button class="btn-inspect-module" onclick="event.stopPropagation();Landing.showModule('${m.id}')">
              Inspect Features <i class="fa fa-arrow-right" style="font-size:10px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  filterModulesCatalog(category) {
    this.activeCatalogCategory = category;
    document.querySelectorAll('.catalog-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === category);
    });
    const grid = document.getElementById('modules-catalog-grid');
    if (grid) {
      grid.innerHTML = this.getModulesCatalogHtml(category);
    }
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
