// ============================================================
// Script to cleanly upgrade Landing Page with Modern SaaS Design
// Modeled after Document.html with 3D Centerpiece, Tax Calculator,
// Problem/Solution, 6 Pillar Tabs, 6-Phase Flow, Mobile Showcase & Security
// ============================================================

const fs = require('fs');
const path = require('path');

const landingPath = path.join(__dirname, '..', 'js', 'landing.js');
let content = fs.readFileSync(landingPath, 'utf8');

// 1. Add training module to modulesData if not present
if (!content.includes('training: {')) {
  const trainingModuleData = `    training: {
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
`;
  content = content.replace('    employees: {', trainingModuleData + '    employees: {');
}

// 2. Locate render() in landing.js and replace up to toggleFaq
const renderStartIdx = content.indexOf('  render() {');
const toggleFaqIdx = content.indexOf('  toggleFaq(index) {');

if (renderStartIdx === -1 || toggleFaqIdx === -1) {
  console.error('Could not locate render() or toggleFaq() in landing.js');
  process.exit(1);
}

const newRenderCode = `  // Active state for interactive pillar tabs
  activePillar: 'people',

  // State for interactive tax & salary calculator
  taxCalcState: {
    gross: 150000,
    includeEobi: true,
    includePf: true,
    taxYear: '2024-2025'
  },

  render() {
    const container = document.getElementById('landing-page');
    if (!container) return;

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

    container.innerHTML = \`
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
              <a href="#why-us" class="landing-nav-link" onclick="Landing.scrollTo('why-us');return false;">Why HRM Pro</a>
              <a href="#features" class="landing-nav-link" onclick="Landing.scrollTo('features');return false;">Features</a>
              
              <!-- Modules Mega-Menu Dropdown -->
              <div class="landing-nav-dropdown-wrapper" onclick="event.stopPropagation()">
                <button class="landing-nav-link landing-dropdown-btn" id="nav-modules-btn" onclick="Landing.toggleModulesMenu(event)">
                  Modules <i class="fa fa-chevron-down" style="font-size:10px;margin-left:4px;opacity:0.75"></i>
                </button>

                <!-- Mega-Menu Dropdown Panel -->
                <div class="landing-mega-menu" id="landing-mega-menu">
                  <div class="mega-menu-header">
                    <div>
                      <strong style="font-size:13.5px;color:var(--text);font-weight:800">All 15 HRM Pro Modules</strong>
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

                    <!-- Column 2: Compensation & LMS -->
                    <div class="mega-menu-col">
                      <div class="mega-col-title"><i class="fa fa-money-bill-wave text-success"></i> Compensation & Talent</div>
                      <div class="mega-item" onclick="Landing.showModule('payroll')">
                        <div class="mega-item-icon" style="background:#faf5ff;color:#9333ea"><i class="fa fa-money-bill-wave"></i></div>
                        <div>
                          <div class="mega-item-title">Statutory Payroll</div>
                          <div class="mega-item-desc">Taxes, EOBI & payslips</div>
                        </div>
                      </div>
                      <div class="mega-item" onclick="Landing.showModule('training')">
                        <div class="mega-item-icon" style="background:#ecfeff;color:#0891b2"><i class="fa fa-graduation-cap"></i></div>
                        <div>
                          <div class="mega-item-title">Training & LMS</div>
                          <div class="mega-item-desc">Courses, calendar & skills</div>
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
                          <div class="mega-item-desc">Receipts & reimbursement</div>
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
                          <div class="mega-item-desc">Hardware allocations & returns</div>
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
                          <div class="mega-item-desc">Excel exports & audit logs</div>
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
                          <div class="mega-item-desc">Sync telemetry & audit trail</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <a href="#tax-calc" class="landing-nav-link" onclick="Landing.scrollTo('tax-calc');return false;">Tax Calculator</a>
              <a href="#workflow" class="landing-nav-link" onclick="Landing.scrollTo('workflow');return false;">Workflow</a>
              <a href="#careers" class="landing-nav-link" onclick="Landing.scrollTo('careers');return false;">Careers <span class="landing-careers-nav-pill">\${openJobsCount}&nbsp;Open</span></a>
              <a href="#security" class="landing-nav-link" onclick="Landing.scrollTo('security');return false;">Security</a>
              <a href="#faq" class="landing-nav-link" onclick="Landing.scrollTo('faq');return false;">FAQ</a>
            </nav>

            <div class="landing-nav-actions">
              <button class="landing-btn-signin" onclick="App.showLogin()" title="Sign in to HRM Portal">
                <i class="fa fa-right-to-bracket"></i>
                <span>Sign In</span>
              </button>
              <button class="landing-btn-cta" onclick="App.showTrial()" title="Start 14-Day Free Enterprise Trial">
                <span>Start Free Trial</span>
              </button>
            </div>
          </div>
        </header>

        <!-- ─── 2. HERO SECTION WITH 3D CENTERPIECE ─── -->
        <section class="landing-hero-section">
          <div class="landing-hero-grid">
            <!-- Left Hero Content -->
            <div class="landing-hero-content">
              <div class="landing-pill-badge">
                <i class="fa fa-sparkles" style="color:#2563eb"></i> Intelligent All-in-One HR & Payroll Platform
              </div>

              <h1 class="landing-hero-title">
                One System to Deliver <br><span class="text-gradient-blue">Error-Free HR & Payroll</span><br>Every Time
              </h1>

              <p class="landing-hero-sub">
                Eliminate end-of-month payroll panic, guarantee statutory FBR tax compliance, auto-sync multi-branch biometric attendance, and empower employees across all devices with enterprise precision.
              </p>

              <div class="landing-cta-group">
                <button class="landing-hero-btn-primary" onclick="App.showTrial()">
                  Start Free Trial <i class="fa fa-arrow-right"></i>
                </button>
                <button class="landing-hero-btn-secondary" onclick="Landing.showDemoModal()">
                  <i class="fa fa-play-circle" style="color:#2563eb;font-size:16px"></i> Interactive System Tour
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
                  <i class="fa fa-fingerprint"></i>
                  <div>
                    <strong>Biometric Gateway</strong>
                    <span>Physical scanner + web punch</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Hero 3D Isometric Centerpiece -->
            <div class="landing-hero-visual">
              <div class="hero-3d-wrapper">
                <!-- Floating Metric 1: Biometric Attendance Rate -->
                <div class="hero-3d-badge-floating badge-pos-att" onclick="App.showModule('attendance')" style="cursor:pointer" title="Click to view Attendance Module">
                  <div style="width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:18px">
                    <i class="fa fa-fingerprint"></i>
                  </div>
                  <div>
                    <div style="font-size:10.5px;color:#64748b;font-weight:700">Attendance Rate</div>
                    <div style="font-size:17px;font-weight:900;color:#0f172a">96.8%</div>
                    <div style="font-size:10px;color:#10b981;font-weight:700"><i class="fa fa-circle-check"></i> Live Biometric Sync</div>
                  </div>
                </div>

                <!-- Floating Metric 2: Monthly Payroll Processed -->
                <div class="hero-3d-badge-floating badge-pos-pay" onclick="App.showModule('payroll')" style="cursor:pointer" title="Click to view Payroll Module">
                  <div style="width:36px;height:36px;border-radius:10px;background:#f0fdf4;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:18px">
                    <i class="fa fa-coins"></i>
                  </div>
                  <div>
                    <div style="font-size:10.5px;color:#64748b;font-weight:700">Monthly Payroll</div>
                    <div style="font-size:17px;font-weight:900;color:#0f172a">PKR 3.45M</div>
                    <div style="font-size:10px;color:#10b981;font-weight:700"><i class="fa fa-shield-check"></i> 100% Tax Compliant</div>
                  </div>
                </div>

                <!-- Floating Metric 3: Real-Time Sync Status -->
                <div class="hero-3d-badge-floating badge-pos-sync">
                  <div style="width:32px;height:32px;border-radius:8px;background:#ecfeff;color:#0891b2;display:flex;align-items:center;justify-content:center;font-size:15px">
                    <i class="fa fa-database"></i>
                  </div>
                  <div>
                    <div style="font-size:10.5px;color:#64748b;font-weight:700">Cloud Persistence</div>
                    <div style="font-size:12px;font-weight:800;color:#0891b2">Multi-Device Synced</div>
                  </div>
                </div>

                <!-- Floating Metric 4: Workforce Master Files -->
                <div class="hero-3d-badge-floating badge-pos-team" onclick="App.showModule('employees')" style="cursor:pointer" title="Click to view Directory">
                  <div style="width:32px;height:32px;border-radius:8px;background:#fef3c7;color:#d97706;display:flex;align-items:center;justify-content:center;font-size:15px">
                    <i class="fa fa-users"></i>
                  </div>
                  <div>
                    <div style="font-size:10.5px;color:#64748b;font-weight:700">Active Workforce</div>
                    <div style="font-size:14px;font-weight:800;color:#0f172a">\${totalEmps} Master Files</div>
                  </div>
                </div>

                <!-- 3D Framed Render Image -->
                <div class="hero-3d-frame">
                  <img src="assets/hero-3d.jpg" alt="HRM Pro 3D Enterprise Command Center" class="hero-3d-image" onerror="this.src='public/assets/hero-3d.jpg'">
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 3. METRICS VALUE BANNER ─── -->
        <div style="padding:0 24px">
          <div class="landing-metrics-banner">
            <div class="landing-metric-item">
              <div class="landing-metric-stat">100%</div>
              <div class="landing-metric-label">Payroll Accuracy</div>
              <div class="landing-metric-sub">Hit through automated FBR tax slabs & pro-rated pay</div>
            </div>
            <div class="landing-metric-item">
              <div class="landing-metric-stat">70%</div>
              <div class="landing-metric-label">Process Time Saved</div>
              <div class="landing-metric-sub">Achieved through attendance & payroll auto-sync</div>
            </div>
            <div class="landing-metric-item">
              <div class="landing-metric-stat">12+ Hrs</div>
              <div class="landing-metric-label">Saved Every Week</div>
              <div class="landing-metric-sub">By transitioning from manual Excel files to HRM Pro</div>
            </div>
            <div class="landing-metric-item">
              <div class="landing-metric-stat">80%</div>
              <div class="landing-metric-label">Less Manual Tracking</div>
              <div class="landing-metric-sub">Real-time biometric gateway & cross-device telemetry</div>
            </div>
          </div>
        </div>

        <!-- ─── 4. PROBLEM VS SOLUTION ("STOP FORCING BROKEN TOOLS") ─── -->
        <section class="problem-solution-section" id="why-us">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-circle-exclamation" style="color:#ef4444"></i> Stop Forcing Broken Tools to Run HR & Payroll
            </div>
            <h2 class="landing-section-title">Say Goodbye to End-of-Month Payroll Chaos</h2>
            <p class="landing-section-sub">
              Spreadsheets fail when shifts rotate, taxes change, or teams scale. HRM Pro eliminates payroll friction with unified automation.
            </p>
          </div>

          <div class="problem-solution-grid">
            <!-- Card 1 -->
            <div class="ps-card">
              <div class="ps-card-badges">
                <span class="ps-badge-problem"><i class="fa fa-triangle-exclamation"></i> Manual Pain Point</span>
                <span class="ps-badge-solution"><i class="fa fa-circle-check"></i> HRM Pro Automated</span>
              </div>
              <h3 class="ps-card-title">Say No to End-of-Month Payroll Panic</h3>
              <p class="ps-card-text">
                Manual spreadsheets break easily with mid-month joining, unpaid leaves, and complex overtime formulas. A single wrong cell throws an entire salary batch off balance.
              </p>
              <div class="ps-feature-highlight">
                <i class="fa fa-bolt text-primary" style="margin-right:6px"></i> Formula-based payroll engine automatically calculates pro-rated pay, overtime tokens, and generates digital payslips in seconds.
              </div>
            </div>

            <!-- Card 2 -->
            <div class="ps-card">
              <div class="ps-card-badges">
                <span class="ps-badge-problem"><i class="fa fa-triangle-exclamation"></i> Compliance Risk</span>
                <span class="ps-badge-solution"><i class="fa fa-circle-check"></i> Audit-Ready</span>
              </div>
              <h3 class="ps-card-title">Spending Too Long on Statutory Compliance?</h3>
              <p class="ps-card-text">
                FBR annual income tax brackets, EOBI calculations, and Provident Fund deductions require constant vigilance. Mistakes result in hefty legal penalties and employee grievances.
              </p>
              <div class="ps-feature-highlight">
                <i class="fa fa-scale-balanced text-success" style="margin-right:6px"></i> Built-in Pakistan FBR salary tax engine, EOBI ledgers, and PF fund tracking run in full compliance automatically.
              </div>
            </div>

            <!-- Card 3 -->
            <div class="ps-card">
              <div class="ps-card-badges">
                <span class="ps-badge-problem"><i class="fa fa-triangle-exclamation"></i> Operational Silos</span>
                <span class="ps-badge-solution"><i class="fa fa-circle-check"></i> Multi-Branch Sync</span>
              </div>
              <h3 class="ps-card-title">Multi-Location Attendance Minus The Mess</h3>
              <p class="ps-card-text">
                Managing multiple regional offices, warehouses, and remote staff leads to disconnected punch machines, lost records, and inaccurate overtime disputes.
              </p>
              <div class="ps-feature-highlight">
                <i class="fa fa-fingerprint text-info" style="margin-right:6px"></i> Centralized biometric hardware gateway and web punch terminals with dynamic grace period buffers and shift rosters.
              </div>
            </div>

            <!-- Card 4 -->
            <div class="ps-card">
              <div class="ps-card-badges">
                <span class="ps-badge-problem"><i class="fa fa-triangle-exclamation"></i> Disconnected ATS</span>
                <span class="ps-badge-solution"><i class="fa fa-circle-check"></i> Hire to Retire</span>
              </div>
              <h3 class="ps-card-title">Fragmented Hiring, Appraisals & Offboarding</h3>
              <p class="ps-card-text">
                Using one tool for job applicants, another for performance OKRs, and emails for resignation clearances causes massive record discrepancies.
              </p>
              <div class="ps-feature-highlight">
                <i class="fa fa-network-wired text-warning" style="margin-right:6px"></i> Unified lifecycle: 10-criteria rubric scoring, offer letter generation, automated onboarding checklists, and final settlement vouchers.
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 5. INTERACTIVE PILLAR SHOWCASE TABS ─── -->
        <section class="pillar-tabs-container" id="features">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-cubes text-primary"></i> Complete Modular Architecture
            </div>
            <h2 class="landing-section-title">One System. Built for All Your HR Needs.</h2>
            <p class="landing-section-sub">
              Explore the core pillars powering error-free operations for modern enterprise workforces.
            </p>
          </div>

          <!-- Horizontal Tabs Navigation -->
          <div class="pillar-tabs-nav">
            <button class="pillar-tab-btn \${Landing.activePillar === 'people' ? 'active' : ''}" onclick="Landing.switchPillar('people')">
              <i class="fa fa-users"></i> People & e-DMS
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'attendance' ? 'active' : ''}" onclick="Landing.switchPillar('attendance')">
              <i class="fa fa-clock"></i> Biometric Attendance
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'payroll' ? 'active' : ''}" onclick="Landing.switchPillar('payroll')">
              <i class="fa fa-money-bill-wave"></i> Statutory Payroll
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'recruitment' ? 'active' : ''}" onclick="Landing.switchPillar('recruitment')">
              <i class="fa fa-briefcase"></i> Recruitment ATS
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'performance' ? 'active' : ''}" onclick="Landing.switchPillar('performance')">
              <i class="fa fa-chart-line"></i> Performance & OKRs
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'training' ? 'active' : ''}" onclick="Landing.switchPillar('training')">
              <i class="fa fa-graduation-cap"></i> Training & LMS
            </button>
          </div>

          <!-- Dynamic Tab Display Card -->
          <div id="pillar-showcase-panel">
            \${Landing.getPillarCardHtml(Landing.activePillar)}
          </div>
        </section>

        <!-- ─── 6. INTERACTIVE PAKISTAN STATUTORY TAX CALCULATOR ─── -->
        <section class="tax-calc-section" id="tax-calc">
          <div class="tax-calc-card">
            <div style="text-align:center;max-width:680px;margin:0 auto 36px auto">
              <div class="landing-pill-badge" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:#93c5fd;margin-bottom:12px">
                <i class="fa fa-calculator text-primary"></i> Live Statutory Payroll Estimator
              </div>
              <h2 style="font-size:32px;font-weight:900;letter-spacing:-0.8px;margin-bottom:10px;color:#ffffff">
                Interactive Salary & Income Tax Calculator
              </h2>
              <p style="font-size:14px;color:#cbd5e1;line-height:1.6">
                Calculate real-time monthly take-home salary, FBR income tax deductions, and statutory funds under official Finance Act 2024-2025 slabs.
              </p>
            </div>

            <div class="tax-calc-grid">
              <!-- Inputs Side -->
              <div class="tax-calc-box-input">
                <label style="font-size:13.5px;font-weight:700;color:#e2e8f0;display:block;margin-bottom:6px">
                  Monthly Gross Salary (PKR)
                </label>
                <div style="position:relative;margin-bottom:14px">
                  <span style="position:absolute;left:14px;top:12px;font-weight:800;color:#94a3b8;font-size:15px">PKR</span>
                  <input type="number" id="tax-input-gross" value="150000" min="30000" max="2500000" step="5000"
                    style="width:100%;box-sizing:border-box;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px 14px 12px 55px;font-size:18px;font-weight:800;color:#ffffff;outline:none"
                    oninput="Landing.updateTaxCalc(this.value)">
                </div>

                <input type="range" id="tax-slider-gross" min="30000" max="1500000" step="10000" value="150000" class="tax-range-slider"
                  oninput="Landing.updateTaxCalc(this.value)">

                <!-- Quick Presets Chips -->
                <div style="font-size:11px;color:#94a3b8;margin-top:12px;font-weight:700">QUICK PRESETS:</div>
                <div class="tax-presets-row">
                  <span class="tax-preset-chip" onclick="Landing.setTaxPreset(80000)">PKR 80k</span>
                  <span class="tax-preset-chip" onclick="Landing.setTaxPreset(150000)">PKR 150k</span>
                  <span class="tax-preset-chip" onclick="Landing.setTaxPreset(250000)">PKR 250k</span>
                  <span class="tax-preset-chip" onclick="Landing.setTaxPreset(500000)">PKR 500k</span>
                  <span class="tax-preset-chip" onclick="Landing.setTaxPreset(1000000)">PKR 1.0M</span>
                </div>

                <!-- Statutory Deductions Toggles -->
                <div class="tax-toggles-row">
                  <label class="tax-toggle-item">
                    <input type="checkbox" id="tax-opt-eobi" checked onchange="Landing.toggleTaxOption('includeEobi')">
                    <span>Include EOBI (PKR 1,300/mo)</span>
                  </label>
                  <label class="tax-toggle-item">
                    <input type="checkbox" id="tax-opt-pf" checked onchange="Landing.toggleTaxOption('includePf')">
                    <span>Include Provident Fund (8.33%)</span>
                  </label>
                </div>
              </div>

              <!-- Results Display Side -->
              <div class="tax-calc-box-results">
                <div class="tax-results-net-card">
                  <div style="font-size:11px;color:#a7f3d0;font-weight:800;letter-spacing:0.5px">ESTIMATED NET TAKE-HOME PAY</div>
                  <div class="tax-net-amount" id="tax-res-net">PKR 131,200</div>
                  <div style="font-size:11.5px;color:#cbd5e1" id="tax-res-pct">87.5% of gross salary</div>
                </div>

                <!-- Breakdown Progress Bar -->
                <div class="tax-breakdown-bar">
                  <div class="tax-bar-net" id="tax-bar-net" style="width:87.5%" title="Take-Home Pay"></div>
                  <div class="tax-bar-tax" id="tax-bar-tax" style="width:4.2%" title="Income Tax"></div>
                  <div class="tax-bar-ded" id="tax-bar-ded" style="width:8.3%" title="EOBI & PF"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#94a3b8;margin-bottom:16px">
                  <span><span style="color:#10b981">■</span> Take-Home</span>
                  <span><span style="color:#ef4444">■</span> Income Tax</span>
                  <span><span style="color:#f59e0b">■</span> EOBI & PF</span>
                </div>

                <!-- Ledger Rows -->
                <div class="tax-results-row">
                  <span style="color:#cbd5e1">Annual Taxable Income</span>
                  <strong style="color:#ffffff" id="tax-res-annual">PKR 1,800,000</strong>
                </div>
                <div class="tax-results-row">
                  <span style="color:#cbd5e1">Monthly Income Tax</span>
                  <strong style="color:#f87171" id="tax-res-monthly-tax">PKR 6,300</strong>
                </div>
                <div class="tax-results-row">
                  <span style="color:#cbd5e1">Annual Income Tax</span>
                  <strong style="color:#f87171" id="tax-res-annual-tax">PKR 75,600</strong>
                </div>
                <div class="tax-results-row">
                  <span style="color:#cbd5e1">EOBI Employee Share</span>
                  <span style="color:#fcd34d" id="tax-res-eobi">PKR 1,300</span>
                </div>
                <div class="tax-results-row">
                  <span style="color:#cbd5e1">Provident Fund (8.33%)</span>
                  <span style="color:#fcd34d" id="tax-res-pf">PKR 12,495</span>
                </div>
                <div class="tax-results-row">
                  <span style="color:#cbd5e1">FBR Bracket</span>
                  <span style="font-size:11px;color:#93c5fd;text-align:right;max-width:200px" id="tax-res-slab-desc">Slab 3: PKR 1.2M – 2.2M</span>
                </div>

                <div style="margin-top:20px">
                  <button class="btn btn-primary" style="width:100%;font-weight:800;padding:12px;display:flex;align-items:center;justify-content:center;gap:8px" onclick="App.showLogin()">
                    <i class="fa fa-play"></i> Process Automated Payroll in Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 7. 6-PHASE PAYROLL & HR AUTOMATION WORKFLOW ─── -->
        <section class="automation-walkthrough-section" id="workflow">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-arrows-split-up-and-left text-primary"></i> End-to-End Enterprise Flow
            </div>
            <h2 class="landing-section-title">Run Payroll from Start to Finish, All in One System</h2>
            <p class="landing-section-sub">
              From contract onboarding to biometric punch synchronization and 1-click bank advice.
            </p>
          </div>

          <div class="automation-flow-grid">
            <!-- Phase 1 -->
            <div class="automation-step-card">
              <div class="step-num-pill">01</div>
              <h3 class="step-title">Master Data & e-DMS</h3>
              <p class="step-desc">
                Centralize CNIC, signed contracts, banking details, and salary components in encrypted employee master records.
              </p>
            </div>

            <!-- Phase 2 -->
            <div class="automation-step-card">
              <div class="step-num-pill">02</div>
              <h3 class="step-title">Biometric Auto-Sync</h3>
              <p class="step-desc">
                Punches stream directly from biometric scanners into attendance ledgers, validating shift grace periods and late arrivals.
              </p>
            </div>

            <!-- Phase 3 -->
            <div class="automation-step-card">
              <div class="step-num-pill">03</div>
              <h3 class="step-title">Formula Tax & Deductions</h3>
              <p class="step-desc">
                The engine applies up-to-date Pakistan statutory tax brackets, EOBI, approved overtime tokens, and loan repayment installments.
              </p>
            </div>

            <!-- Phase 4 -->
            <div class="automation-step-card">
              <div class="step-num-pill">04</div>
              <h3 class="step-title">2-Tier Signoff & Approvals</h3>
              <p class="step-desc">
                Department Managers verify timesheet exceptions; HR Directors review statutory ledgers with full audit trails.
              </p>
            </div>

            <!-- Phase 5 -->
            <div class="automation-step-card">
              <div class="step-num-pill">05</div>
              <h3 class="step-title">Bank Advice & Payslips</h3>
              <p class="step-desc">
                Generate 1-click bank disbursal advice files and publish password-protected digital payslips instantly to employee portals.
              </p>
            </div>

            <!-- Phase 6 -->
            <div class="automation-step-card">
              <div class="step-num-pill">06</div>
              <h3 class="step-title">Settlement & Offboarding</h3>
              <p class="step-desc">
                Automated Gratuity math based on tenure, leave encashment, asset recovery clearance, and formal exit release letters.
              </p>
            </div>
          </div>
        </section>

        <!-- ─── 8. MOBILE APP & REMOTE WORKFORCE SHOWCASE ─── -->
        <section class="mobile-showcase-section">
          <div class="mobile-showcase-grid">
            <!-- Left Side: Phone Mockup Frame -->
            <div>
              <div class="phone-mockup-outer">
                <div class="phone-screen-inner">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:11px;font-weight:700">
                    <span>9:41 AM</span>
                    <span><i class="fa fa-wifi"></i> <i class="fa fa-battery-full"></i></span>
                  </div>
                  
                  <div style="background:#eff6ff;border-radius:12px;padding:12px;margin-bottom:12px;text-align:center">
                    <div style="font-size:11px;color:#2563eb;font-weight:700">MOBILE BIOMETRIC PUNCH</div>
                    <div style="font-size:18px;font-weight:900;color:#0f172a;margin:4px 0">09:41:22 AM</div>
                    <div style="font-size:10px;color:#16a34a"><i class="fa fa-location-dot"></i> In Geofence Radius (Office HQ)</div>
                  </div>

                  <button class="btn btn-primary btn-sm" style="width:100%;font-weight:800;margin-bottom:14px;border-radius:8px">
                    <i class="fa fa-fingerprint"></i> Tap to Clock In
                  </button>

                  <div style="font-size:11px;font-weight:800;color:#334155;margin-bottom:8px">QUICK ACTIONS</div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
                    <div style="background:var(--surface,#f8fafc);border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center">
                      <i class="fa fa-calendar-plus text-primary"></i>
                      <div style="font-size:10.5px;font-weight:700;margin-top:4px">Apply Leave</div>
                    </div>
                    <div style="background:var(--surface,#f8fafc);border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center">
                      <i class="fa fa-file-invoice text-success"></i>
                      <div style="font-size:10.5px;font-weight:700;margin-top:4px">View Payslip</div>
                    </div>
                  </div>

                  <div style="font-size:11px;font-weight:800;color:#334155;margin-bottom:6px">RECENT PAYSLIP</div>
                  <div style="background:#f1f5f9;border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
                    <div>
                      <div style="font-size:11px;font-weight:800">August 2026</div>
                      <div style="font-size:9.5px;color:#64748b">Direct Bank Deposit</div>
                    </div>
                    <strong style="color:#16a34a;font-size:11px">PKR 142,500</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: Features -->
            <div>
              <div class="landing-pill-badge" style="margin-bottom:12px">
                <i class="fa fa-mobile-screen text-primary"></i> Mobile Workforce Experience
              </div>
              <h2 style="font-size:36px;font-weight:900;letter-spacing:-1px;margin-bottom:16px;color:var(--text,#0f172a)">
                Stay in Control, Wherever Work Happens
              </h2>
              <p style="font-size:15px;color:#64748b;line-height:1.6;margin-bottom:24px">
                Empower distributed teams with mobile self-service. From biometric GPS check-in to 1-tap leave approvals and digital payslips.
              </p>

              <div style="display:flex;flex-direction:column;gap:16px">
                <div style="display:flex;align-items:flex-start;gap:14px">
                  <div style="width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">
                    <i class="fa fa-location-crosshairs"></i>
                  </div>
                  <div>
                    <h4 style="font-size:15px;font-weight:800;color:var(--text,#0f172a);margin:0 0 3px 0">Biometric GPS Clock-In</h4>
                    <p style="font-size:13px;color:#64748b;margin:0">Verify physical arrival within authorized branch geofence radii with zero hardware overhead.</p>
                  </div>
                </div>

                <div style="display:flex;align-items:flex-start;gap:14px">
                  <div style="width:36px;height:36px;border-radius:10px;background:#ecfdf5;color:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">
                    <i class="fa fa-check-double"></i>
                  </div>
                  <div>
                    <h4 style="font-size:15px;font-weight:800;color:var(--text,#0f172a);margin:0 0 3px 0">1-Tap Manager Approvals</h4>
                    <p style="font-size:13px;color:#64748b;margin:0">Review team leave requests, overtime approvals, and expense receipts on the go.</p>
                  </div>
                </div>

                <div style="display:flex;align-items:flex-start;gap:14px">
                  <div style="width:36px;height:36px;border-radius:10px;background:#faf5ff;color:#9333ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">
                    <i class="fa fa-file-pdf"></i>
                  </div>
                  <div>
                    <h4 style="font-size:15px;font-weight:800;color:var(--text,#0f172a);margin:0 0 3px 0">Instant Digital Payslips</h4>
                    <p style="font-size:13px;color:#64748b;margin:0">Employees download encrypted, audit-ready PDF payslips with complete tax breakdown directly from their phone.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 9. ENTERPRISE SECURITY & COMPLIANCE GRID ─── -->
        <section class="security-compliance-section" id="security">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-shield-halved text-primary"></i> Bank-Grade Protection
            </div>
            <h2 class="landing-section-title">Enterprise-Grade Security & Full Compliance</h2>
            <p class="landing-section-sub">
              Your confidential workforce and compensation data protected by multi-layered encryption and rigorous access governance.
            </p>
          </div>

          <div class="security-grid">
            <div class="security-card">
              <div class="security-icon"><i class="fa fa-certificate"></i></div>
              <h3 class="security-title">ISO 27001 Aligned</h3>
              <p class="security-desc">Structured information security controls safeguarding sensitive HR personnel files.</p>
            </div>

            <div class="security-card">
              <div class="security-icon"><i class="fa fa-lock"></i></div>
              <h3 class="security-title">256-Bit AES Encryption</h3>
              <p class="security-desc">End-to-end cryptographic encryption for data in transit and at rest in cloud database.</p>
            </div>

            <div class="security-card">
              <div class="security-icon"><i class="fa fa-user-shield"></i></div>
              <h3 class="security-title">5-Tier Granular RBAC</h3>
              <p class="security-desc">Strict departmental scoping preventing unauthorized compensation or records inspection.</p>
            </div>

            <div class="security-card">
              <div class="security-icon"><i class="fa fa-clock-rotate-left"></i></div>
              <h3 class="security-title">Immutable Audit Trail</h3>
              <p class="security-desc">Monotonic timestamped event logs tracking every salary revision, punch edit, and approval.</p>
            </div>
          </div>
        </section>

        <!-- ─── 10. ACTIVE CAREERS & ATS PORTAL ─── -->
        <section class="landing-careers-section" id="careers">
          <div class="landing-careers-inner">
            <div class="landing-section-header">
              <div class="landing-pill-badge" style="margin:0 auto 12px auto">
                <i class="fa fa-briefcase text-primary"></i> We Are Actively Hiring
              </div>
              <h2 class="landing-section-title">Current Open Positions at HRM Pro</h2>
              <p class="landing-section-sub">
                Explore high-growth career opportunities across Engineering, Human Resources, Finance, and Operations. Apply directly with your CV in under 2 minutes.
              </p>
            </div>

            <!-- Department Filter Bar -->
            <div class="careers-filter-bar">
              <button class="career-filter-btn active" onclick="Landing.filterCareers('all', this)">
                All Openings (\${openJobsList.length})
              </button>
              \${uniqueDepts.map(dept => \`
                <button class="career-filter-btn" onclick="Landing.filterCareers('\${dept.id}', this)">
                  \${dept.name}
                </button>
              \`).join('')}
            </div>

            <!-- Job Openings Grid -->
            <div class="careers-jobs-grid" id="careers-jobs-list">
              \${openJobsList.length > 0 ? openJobsList.map(job => {
                const dept = depts.find(d => d.id === job.departmentId);
                return \`
                  <div class="career-job-card animate-card" data-dept="\${job.departmentId}">
                    <div class="career-card-top">
                      <div>
                        <span class="career-dept-tag">\${dept?.name || 'General Operations'}</span>
                        <h3 class="career-job-title">\${job.title}</h3>
                      </div>
                      <span class="career-hiring-status">
                        <span class="status-pulse-green"></span> Actively Hiring
                      </span>
                    </div>

                    <div class="career-chips-wrap">
                      <span class="career-chip">
                        <i class="fa fa-users"></i> \${job.positions} Position\${job.positions > 1 ? 's' : ''}
                      </span>
                      <span class="career-chip">
                        <i class="fa fa-business-time"></i> \${job.experience}
                      </span>
                      <span class="career-chip">
                        <i class="fa fa-money-bill-wave"></i> PKR \${job.salary}
                      </span>
                      <span class="career-chip">
                        <i class="fa fa-calendar-days"></i> Due: \${Utils.formatDate(job.deadline)}
                      </span>
                    </div>

                    <p class="career-job-summary">
                      \${job.description || 'Join our high-performing team to build scalable enterprise solutions, lead mission-critical workflows, and accelerate organizational growth.'}
                    </p>

                    <div class="career-card-bottom">
                      <div class="career-applicant-tally">
                        <i class="fa fa-user-check" style="color:#2563eb"></i>
                        <span><strong>\${job.applicantCount || 0}</strong> applicants</span>
                      </div>
                      <div class="career-actions-row">
                        <button class="btn-career-view" onclick="Landing.viewJobDetails(\${job.id})">
                          <i class="fa fa-eye"></i> Details
                        </button>
                        <button class="btn-career-apply" onclick="Landing.openApplyModal(\${job.id})">
                          Apply with CV <i class="fa fa-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                \`;
              }).join('') : \`
                <div style="grid-column: 1/-1;text-align:center;padding:40px;background:var(--surface-2);border-radius:12px;color:var(--text-3)">
                  <i class="fa fa-briefcase" style="font-size:36px;margin-bottom:12px;color:#94a3b8"></i>
                  <p style="font-size:15px;font-weight:600;margin:0">No current openings matching your criteria. Check back soon!</p>
                </div>
              \`}
            </div>
          </div>
        </section>

        <!-- ─── 11. RICH FAQ ACCORDION ─── -->
        <section class="landing-faq-section" id="faq">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-circle-question text-primary"></i> Answers & Clarity
            </div>
            <h2 class="landing-section-title">Frequently Asked Questions</h2>
            <p class="landing-section-sub">Everything you need to know about HRM Pro features, statutory payroll, and security.</p>
          </div>

          <div class="landing-faq-container">
            <div class="landing-faq-item" id="faq-item-1" onclick="Landing.toggleFaq(1)">
              <div class="landing-faq-question">
                <span>How does HRM Pro automate statutory tax and EOBI calculations?</span>
                <i class="fa fa-chevron-down"></i>
              </div>
              <div class="landing-faq-answer">
                HRM Pro embeds official Pakistan FBR salary tax brackets (Finance Act 2024-2025). The system automatically calculates taxable income, applies progressive slab rates, deducts statutory EOBI employee contributions, and computes Provident Fund contributions seamlessly on each salary run.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-2" onclick="Landing.toggleFaq(2)">
              <div class="landing-faq-question">
                <span>Can biometric attendance integrate across multiple physical offices?</span>
                <i class="fa fa-chevron-down"></i>
              </div>
              <div class="landing-faq-answer">
                Yes. HRM Pro features a real-time hardware gateway supporting physical fingerprint and facial scanners across multiple branches. Punches synchronize with cloud database records instantly, calculating arrival grace buffers, late-coming penalties, and approved overtime tokens.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-3" onclick="Landing.toggleFaq(3)">
              <div class="landing-faq-question">
                <span>How does the Recruitment ATS and scoring rubric work?</span>
                <i class="fa fa-chevron-down"></i>
              </div>
              <div class="landing-faq-answer">
                Candidates applying on the career portal automatically land in the 5-stage ATS pipeline. Interviewers rate candidates using an objective 10-criteria rubric (totaling 50 points), generate standardized assessment sheets, designate P1/P2 preferences, extend formal offer letters, and initialize onboarding checklists upon acceptance.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-4" onclick="Landing.toggleFaq(4)">
              <div class="landing-faq-question">
                <span>Can employees access their own payslips and request leaves?</span>
                <i class="fa fa-chevron-down"></i>
              </div>
              <div class="landing-faq-answer">
                Absolutely. Employees have dedicated self-service portal access where they can clock in, submit leave requests with medical attachments, review annual leave quotas, inspect monthly payslips, and download PDF tax statements with complete transparency.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-5" onclick="Landing.toggleFaq(5)">
              <div class="landing-faq-question">
                <span>Is my workforce data secure and isolated?</span>
                <i class="fa fa-chevron-down"></i>
              </div>
              <div class="landing-faq-answer">
                Yes. All data is protected with 256-bit AES encryption in transit and at rest. Strict 5-tier role-based access control (Super Admin, HR Director, Dept Manager, Employee, Onboarding) ensures users only see records within their authorized organizational scope.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-6" onclick="Landing.toggleFaq(6)">
              <div class="landing-faq-question">
                <span>How easy is it to migrate our existing employee database?</span>
                <i class="fa fa-chevron-down"></i>
              </div>
              <div class="landing-faq-answer">
                Very simple. HRM Pro provides structured CSV and Excel import templates for employees, opening leave balances, shift assignments, and historical salaries. Our database hydrates within seconds.
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 12. BOTTOM CONVERSION CTA BANNER ─── -->
        <section class="landing-cta-banner">
          <div class="landing-cta-inner">
            <div class="landing-pill-badge" style="background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.3);color:#ffffff;margin-bottom:16px">
              <i class="fa fa-sparkles"></i> Transform Your HR Operations Today
            </div>
            <h2 class="landing-cta-title">Ready to Run Error-Free HR & Payroll?</h2>
            <p class="landing-cta-sub">
              Join forward-thinking enterprise teams using HRM Pro to automate biometric attendance, eliminate payroll panic, and elevate employee experience.
            </p>
            <div class="landing-cta-actions">
              <button class="landing-btn-banner-primary" onclick="App.showTrial()">
                Start 14-Day Free Trial <i class="fa fa-arrow-right"></i>
              </button>
              <button class="landing-btn-banner-secondary" onclick="Landing.showDemoModal()">
                <i class="fa fa-play-circle"></i> Schedule System Tour
              </button>
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:20px">
              <i class="fa fa-check-circle"></i> No credit card required &nbsp;•&nbsp; 
              <i class="fa fa-check-circle"></i> 14-day full feature access &nbsp;•&nbsp; 
              <i class="fa fa-check-circle"></i> 1-click cloud sync
            </div>
          </div>
        </section>

        <!-- ─── 13. MODERN ENTERPRISE FOOTER ─── -->
        <footer class="landing-footer">
          <div class="landing-footer-grid">
            <!-- Brand Column -->
            <div class="landing-footer-brand-col">
              <div class="landing-brand" style="margin-bottom:12px">
                <div class="landing-brand-icon" style="background:#2563eb;color:#ffffff;border-radius:10px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:18px">
                  <i class="fa fa-users"></i>
                </div>
                <div>
                  <div class="landing-brand-name">HRM Pro</div>
                  <div class="landing-brand-tag">Human Resource Information System</div>
                </div>
              </div>
              <p class="landing-footer-tagline">
                Enterprise cloud human resource information system with real-time biometric synchronization, automated statutory payroll, and end-to-end recruitment lifecycle management.
              </p>
              <div style="display:flex;gap:10px;margin-top:16px">
                <div style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:#64748b"><i class="fa-brands fa-linkedin-in"></i></div>
                <div style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:#64748b"><i class="fa-brands fa-twitter"></i></div>
                <div style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:#64748b"><i class="fa-brands fa-github"></i></div>
              </div>
            </div>

            <!-- Links: Product -->
            <div class="landing-footer-col">
              <h4 class="landing-footer-heading">Platform Modules</h4>
              <div class="landing-footer-links">
                <a href="#" onclick="Landing.showModule('employees');return false;">Employees & e-DMS</a>
                <a href="#" onclick="Landing.showModule('attendance');return false;">Biometric Attendance</a>
                <a href="#" onclick="Landing.showModule('payroll');return false;">Statutory Payroll</a>
                <a href="#" onclick="Landing.showModule('recruitment');return false;">Recruitment ATS</a>
                <a href="#" onclick="Landing.showModule('training');return false;">Training & LMS</a>
                <a href="#" onclick="Landing.showModule('performance');return false;">Performance & OKRs</a>
              </div>
            </div>

            <!-- Links: Governance -->
            <div class="landing-footer-col">
              <h4 class="landing-footer-heading">Enterprise & Security</h4>
              <div class="landing-footer-links">
                <a href="#security" onclick="Landing.scrollTo('security');return false;">ISO 27001 Architecture</a>
                <a href="#security" onclick="Landing.scrollTo('security');return false;">256-Bit Data Encryption</a>
                <a href="#security" onclick="Landing.scrollTo('security');return false;">5-Tier Role Matrix</a>
                <a href="#security" onclick="Landing.scrollTo('security');return false;">Audit Trails & Logs</a>
                <a href="#tax-calc" onclick="Landing.scrollTo('tax-calc');return false;">FBR Tax Slabs 2024-25</a>
              </div>
            </div>

            <!-- Links: Quick Portals -->
            <div class="landing-footer-col">
              <h4 class="landing-footer-heading">Interactive Access</h4>
              <div class="landing-footer-links">
                <a href="#" onclick="App.showLogin();return false;">Sign In to Portal</a>
                <a href="#" onclick="App.showTrial();return false;">Start Free Trial</a>
                <a href="#" onclick="Landing.showDemoModal();return false;">System Demo Tour</a>
                <a href="#careers" onclick="Landing.scrollTo('careers');return false;">Careers Portal (\${openJobsCount} Open)</a>
                <a href="#" onclick="Landing.openContactModal();return false;">Contact Solutions Team</a>
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
    \`;

    // Initialize interactive tax calculator with default state
    setTimeout(() => {
      Landing.updateTaxCalc(150000);
    }, 50);
  },

  // ─── Dynamic Pillar Content Generator ───
  getPillarCardHtml(pillarKey) {
    const pillars = {
      people: {
        title: 'People Management & Encrypted e-DMS',
        tagline: '360° Workforce Directory, Contract Life Cycle & Expiry Radar',
        desc: 'Centralize personnel master files, digital employment contracts, emergency contacts, and branch hierarchy trees with strict compliance.',
        color: '#2563eb',
        bg: '#eff6ff',
        badge: 'Core Workforce',
        modId: 'employees',
        caps: [
          { title: '360° Personnel Profiles', desc: 'National CNIC/ID, blood group, emergency contacts, qualifications, and bank accounts.', icon: 'fa-id-card' },
          { title: 'Digital Document Safe (e-DMS)', desc: 'Securely upload educational degrees, signed contracts, and experience letters.', icon: 'fa-file-shield' },
          { title: 'Expiry Radar', desc: 'Automated 30/60/90-day alert triggers before visas, contracts, or probationary periods expire.', icon: 'fa-clock-rotate-left' },
          { title: 'Org Hierarchy Trees', desc: 'Structure multiple business units, branches, and divisions with dynamic reporting lines.', icon: 'fa-sitemap' }
        ],
        stat: '52+ Active Files',
        statSub: '100% Verified'
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
        title: 'Performance Management & OKR Scorecards',
        tagline: 'Quarterly Reviews, 9-Box Grid, KPI Targets & Merit Appraisals',
        desc: 'Align workforce productivity with organizational objectives using continuous performance reviews, 360 appraisals, and merit increments.',
        color: '#0284c7',
        bg: '#f0f9ff',
        badge: 'Productivity',
        modId: 'performance',
        caps: [
          { title: 'OKR & KPI Target Tracking', desc: 'Define individual and departmental key results with quantitative progress bars.', icon: 'fa-bullseye' },
          { title: '360° Appraisal Cycles', desc: 'Structured self, peer, and manager evaluation reviews with scoring rubrics.', icon: 'fa-arrows-spin' },
          { title: '9-Box Talent Matrix', desc: 'Map employee performance against leadership potential for succession planning.', icon: 'fa-border-all' },
          { title: 'Merit Salary Increments', desc: 'Seamlessly transition approved performance ratings into annual payroll revisions.', icon: 'fa-arrow-trend-up' }
        ],
        stat: '4.8/5.0 Rating',
        statSub: 'Merit Aligned'
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

    return \`
      <div class="pillar-showcase-card animate-fade-in">
        <div>
          <div style="display:inline-flex;align-items:center;gap:8px;padding:4px 12px;background:\${p.bg};color:\${p.color};border-radius:9999px;font-size:11.5px;font-weight:800;margin-bottom:12px">
            \${p.badge}
          </div>
          <h3 style="font-size:24px;font-weight:900;color:var(--text,#0f172a);margin-bottom:6px">\${p.title}</h3>
          <div style="font-size:13.5px;font-weight:700;color:\${p.color};margin-bottom:12px">\${p.tagline}</div>
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin-bottom:20px">\${p.desc}</p>

          <div class="pillar-cap-list">
            \${p.caps.map(c => \`
              <div class="pillar-cap-item">
                <div class="pillar-cap-icon" style="background:\${p.bg};color:\${p.color}">
                  <i class="fa \${c.icon}"></i>
                </div>
                <div>
                  <div class="pillar-cap-title">\${c.title}</div>
                  <div class="pillar-cap-desc">\${c.desc}</div>
                </div>
              </div>
            \`).join('')}
          </div>

          <div style="display:flex;gap:12px;align-items:center;margin-top:20px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="Landing.showModule('\${p.modId}')" style="font-weight:700">
              Explore Full \${p.badge} Tour <i class="fa fa-arrow-right" style="margin-left:6px"></i>
            </button>
            <button class="btn btn-secondary" onclick="App.showLogin()" style="font-weight:600">
              Open Portal Access
            </button>
          </div>
        </div>

        <!-- Right Graphic Box -->
        <div style="background:\${p.bg};border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:32px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px">
          <div style="width:72px;height:72px;border-radius:20px;background:#ffffff;color:\${p.color};display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 12px 30px rgba(0,0,0,0.08);margin-bottom:18px">
            <i class="fa \${p.caps[0].icon}"></i>
          </div>
          <div style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:4px">\${p.stat}</div>
          <div style="font-size:13px;font-weight:700;color:\${p.color};margin-bottom:18px">\${p.statSub}</div>
          <div style="background:#ffffff;border-radius:10px;padding:10px 18px;font-size:12px;font-weight:700;color:#334155;box-shadow:0 4px 12px rgba(0,0,0,0.04)">
            <i class="fa fa-circle-check text-success" style="margin-right:6px"></i> Production-Ready Module
          </div>
        </div>
      </div>
    \`;
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

  // ─── Interactive Tax Calculator Methods ───
  updateTaxCalc(val) {
    const gross = Math.max(30000, Number(val) || 150000);
    this.taxCalcState.gross = gross;

    const inputGross = document.getElementById('tax-input-gross');
    const sliderGross = document.getElementById('tax-slider-gross');
    if (inputGross && inputGross.value != gross) inputGross.value = gross;
    if (sliderGross && sliderGross.value != gross) sliderGross.value = gross;

    // Use DB.calculateFBRTax if available, else local Finance Act 2024 calculation
    let taxCalc;
    if (typeof DB !== 'undefined' && DB.calculateFBRTax) {
      taxCalc = DB.calculateFBRTax(gross);
    } else {
      const annual = gross * 12;
      let annualTax = 0;
      let slabDesc = 'Slab 1: Tax-Free up to PKR 600,000';
      if (annual <= 600000) {
        annualTax = 0;
      } else if (annual <= 1200000) {
        annualTax = (annual - 600000) * 0.05;
        slabDesc = 'Slab 2 (PKR 600k – 1.2M): 5% excess';
      } else if (annual <= 2200000) {
        annualTax = 30000 + (annual - 1200000) * 0.15;
        slabDesc = 'Slab 3 (PKR 1.2M – 2.2M): PKR 30k + 15% excess';
      } else if (annual <= 3200000) {
        annualTax = 180000 + (annual - 2200000) * 0.25;
        slabDesc = 'Slab 4 (PKR 2.2M – 3.2M): PKR 180k + 25% excess';
      } else if (annual <= 4100000) {
        annualTax = 430000 + (annual - 3200000) * 0.30;
        slabDesc = 'Slab 5 (PKR 3.2M – 4.1M): PKR 430k + 30% excess';
      } else {
        annualTax = 700000 + (annual - 4100000) * 0.35;
        slabDesc = 'Slab 6 (Above PKR 4.1M): PKR 700k + 35% excess';
      }
      taxCalc = {
        annualIncome: annual,
        annualTax: Math.round(annualTax),
        monthlyTax: Math.round(annualTax / 12),
        slabDesc
      };
    }

    const monthlyTax = taxCalc.monthlyTax;
    const annualTax = taxCalc.annualTax;
    const eobi = this.taxCalcState.includeEobi ? 1300 : 0;
    const pf = this.taxCalcState.includePf ? Math.round(gross * 0.0833) : 0;
    const totalDeductions = monthlyTax + eobi + pf;
    const netSalary = Math.max(0, gross - totalDeductions);

    const netPct = ((netSalary / gross) * 100).toFixed(1);
    const taxPct = ((monthlyTax / gross) * 100).toFixed(1);
    const dedPct = (((eobi + pf) / gross) * 100).toFixed(1);

    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('tax-res-net', 'PKR ' + netSalary.toLocaleString());
    setTxt('tax-res-pct', netPct + '% of gross monthly salary');
    setTxt('tax-res-annual', 'PKR ' + taxCalc.annualIncome.toLocaleString());
    setTxt('tax-res-monthly-tax', 'PKR ' + monthlyTax.toLocaleString());
    setTxt('tax-res-annual-tax', 'PKR ' + annualTax.toLocaleString());
    setTxt('tax-res-eobi', 'PKR ' + eobi.toLocaleString());
    setTxt('tax-res-pf', 'PKR ' + pf.toLocaleString());
    setTxt('tax-res-slab-desc', taxCalc.slabDesc);

    const barNet = document.getElementById('tax-bar-net');
    const barTax = document.getElementById('tax-bar-tax');
    const barDed = document.getElementById('tax-bar-ded');
    if (barNet) barNet.style.width = netPct + '%';
    if (barTax) barTax.style.width = taxPct + '%';
    if (barDed) barDed.style.width = dedPct + '%';
  },

  setTaxPreset(amt) {
    this.updateTaxCalc(amt);
  },

  toggleTaxOption(optionKey) {
    this.taxCalcState[optionKey] = !this.taxCalcState[optionKey];
    this.updateTaxCalc(this.taxCalcState.gross);
  },

`;

// Perform the replacement
const updatedContent = content.slice(0, renderStartIdx) + newRenderCode + content.slice(toggleFaqIdx);

fs.writeFileSync(landingPath, updatedContent, 'utf8');
console.log('Successfully upgraded js/landing.js!');

// Also mirror to public/js/landing.js
const publicLandingPath = path.join(__dirname, '..', 'public', 'js', 'landing.js');
fs.writeFileSync(publicLandingPath, updatedContent, 'utf8');
console.log('Successfully mirrored to public/js/landing.js!');
