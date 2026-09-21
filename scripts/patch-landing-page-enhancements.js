const fs = require('fs');
const path = require('path');

console.log('=== STEP 1: Updating js/landing.js ===');
const landingPath = path.join(__dirname, '../js/landing.js');
let code = fs.readFileSync(landingPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add toggleTheme and applyTheme to Landing object
const themeMethods = `
  toggleTheme() {
    const currentTheme = localStorage.getItem('hrm_landing_theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('hrm_landing_theme', newTheme);
    this.applyTheme(newTheme);
  },

  applyTheme(theme) {
    const landingEl = document.getElementById('landing-page');
    const detailEl = document.getElementById('module-detail-page');
    if (landingEl) landingEl.setAttribute('data-theme', theme);
    if (detailEl) detailEl.setAttribute('data-theme', theme);
    const btn = document.getElementById('landing-theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark' 
        ? '<i class="fa fa-sun" style="color:#f59e0b;font-size:16px"></i>' 
        : '<i class="fa fa-moon" style="color:#6366f1;font-size:16px"></i>';
      btn.title = theme === 'dark' ? 'Switch to Crisp Light Theme' : 'Switch to Obsidian Dark Theme';
    }
  },
`;

code = code.replace(
  `  render() {\n    const container = document.getElementById('landing-page');\n    if (!container) return;\n    container.setAttribute('data-theme', 'dark');`,
  `${themeMethods}\n  render() {\n    const container = document.getElementById('landing-page');\n    if (!container) return;\n    const savedTheme = localStorage.getItem('hrm_landing_theme') || 'dark';\n    container.setAttribute('data-theme', savedTheme);\n    const detailContainer = document.getElementById('module-detail-page');\n    if (detailContainer) detailContainer.setAttribute('data-theme', savedTheme);`
);

// 2. Add Theme Toggle Button to navbar in Landing.render()
const oldNavActions = `            <div class="landing-nav-actions">
              <button class="landing-btn-signin" onclick="App.showLogin()" title="Sign in to HRM Portal">
                <i class="fa fa-right-to-bracket"></i>
                <span>Sign In</span>
              </button>
              <button class="landing-btn-cta" onclick="App.showTrial()" title="Start 14-Day Free Enterprise Trial">
                <span>Start Free Trial</span>
              </button>
            </div>`;

const newNavActions = `            <div class="landing-nav-actions">
              <button class="landing-theme-toggle-btn" id="landing-theme-toggle-btn" onclick="Landing.toggleTheme()" title="\${savedTheme === 'dark' ? 'Switch to Crisp Light Theme' : 'Switch to Obsidian Dark Theme'}">
                <i class="fa \${savedTheme === 'dark' ? 'fa-sun' : 'fa-moon'}" style="color:\${savedTheme === 'dark' ? '#f59e0b' : '#6366f1'};font-size:16px"></i>
              </button>
              <button class="landing-btn-signin" onclick="App.showLogin()" title="Sign in to HRM Portal">
                <i class="fa fa-right-to-bracket"></i>
                <span>Sign In</span>
              </button>
              <button class="landing-btn-cta" onclick="App.showTrial()" title="Start 14-Day Free Enterprise Trial">
                <span>Start Free Trial</span>
              </button>
            </div>`;

code = code.replace(oldNavActions, newNavActions);

// 3. Update pillar tabs to include Leaves
const oldPillarTabs = `          <!-- Horizontal Tabs Navigation -->
          <div class="pillar-tabs-nav" role="tablist" aria-label="Core HR Platforms">
            <button class="pillar-tab-btn \${Landing.activePillar === 'people' ? 'active' : ''}" role="tab" id="tab-pillar-people" aria-selected="\${Landing.activePillar === 'people'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('people')">
              <i class="fa fa-users"></i> People & e-DMS
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'attendance' ? 'active' : ''}" role="tab" id="tab-pillar-attendance" aria-selected="\${Landing.activePillar === 'attendance'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('attendance')">
              <i class="fa fa-clock"></i> Biometric Attendance
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'payroll' ? 'active' : ''}" role="tab" id="tab-pillar-payroll" aria-selected="\${Landing.activePillar === 'payroll'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('payroll')">
              <i class="fa fa-money-bill-wave"></i> SPMS Payroll & Tax
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'multi_company' ? 'active' : ''}" role="tab" id="tab-pillar-multi_company" aria-selected="\${Landing.activePillar === 'multi_company'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('multi_company')">
              <i class="fa fa-building-shield"></i> Multi-Company Holdings
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'settlement' ? 'active' : ''}" role="tab" id="tab-pillar-settlement" aria-selected="\${Landing.activePillar === 'settlement'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('settlement')">
              <i class="fa fa-file-invoice-dollar"></i> Exit & Gratuity
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'recruitment' ? 'active' : ''}" role="tab" id="tab-pillar-recruitment" aria-selected="\${Landing.activePillar === 'recruitment'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('recruitment')">
              <i class="fa fa-briefcase"></i> Recruitment ATS
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'performance' ? 'active' : ''}" role="tab" id="tab-pillar-performance" aria-selected="\${Landing.activePillar === 'performance'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('performance')">
              <i class="fa fa-chart-line"></i> Performance & OKRs
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'training' ? 'active' : ''}" role="tab" id="tab-pillar-training" aria-selected="\${Landing.activePillar === 'training'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('training')">
              <i class="fa fa-graduation-cap"></i> Training & LMS
            </button>
          </div>`;

const newPillarTabs = `          <!-- Horizontal Tabs Navigation -->
          <div class="pillar-tabs-nav" role="tablist" aria-label="Core HR Platforms">
            <button class="pillar-tab-btn \${Landing.activePillar === 'people' ? 'active' : ''}" role="tab" id="tab-pillar-people" aria-selected="\${Landing.activePillar === 'people'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('people')">
              <i class="fa fa-users"></i> People &amp; Lifecycle
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'attendance' ? 'active' : ''}" role="tab" id="tab-pillar-attendance" aria-selected="\${Landing.activePillar === 'attendance'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('attendance')">
              <i class="fa fa-clock"></i> Biometric Attendance
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'leaves' ? 'active' : ''}" role="tab" id="tab-pillar-leaves" aria-selected="\${Landing.activePillar === 'leaves'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('leaves')">
              <i class="fa fa-calendar-xmark"></i> Leaves &amp; Approvals
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'payroll' ? 'active' : ''}" role="tab" id="tab-pillar-payroll" aria-selected="\${Landing.activePillar === 'payroll'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('payroll')">
              <i class="fa fa-money-bill-wave"></i> SPMS Payroll &amp; Tax
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'multi_company' ? 'active' : ''}" role="tab" id="tab-pillar-multi_company" aria-selected="\${Landing.activePillar === 'multi_company'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('multi_company')">
              <i class="fa fa-building-shield"></i> Multi-Company Holdings
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'settlement' ? 'active' : ''}" role="tab" id="tab-pillar-settlement" aria-selected="\${Landing.activePillar === 'settlement'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('settlement')">
              <i class="fa fa-file-invoice-dollar"></i> Exit &amp; Gratuity (F&amp;F)
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'recruitment' ? 'active' : ''}" role="tab" id="tab-pillar-recruitment" aria-selected="\${Landing.activePillar === 'recruitment'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('recruitment')">
              <i class="fa fa-briefcase"></i> Recruitment ATS
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'performance' ? 'active' : ''}" role="tab" id="tab-pillar-performance" aria-selected="\${Landing.activePillar === 'performance'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('performance')">
              <i class="fa fa-chart-line"></i> Performance &amp; 9-Box
            </button>
            <button class="pillar-tab-btn \${Landing.activePillar === 'training' ? 'active' : ''}" role="tab" id="tab-pillar-training" aria-selected="\${Landing.activePillar === 'training'}" aria-controls="pillar-showcase-panel" onclick="Landing.switchPillar('training')">
              <i class="fa fa-graduation-cap"></i> Training &amp; LMS
            </button>
          </div>`;

code = code.replace(oldPillarTabs, newPillarTabs);

// 4. Update getPillarCardHtml() to add missing pillars: leaves, multi_company, settlement, and update people & performance
const oldPeoplePillar = `      people: {
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
      },`;

const newPeoplePillar = `      people: {
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
      },`;

code = code.replace(oldPeoplePillar, newPeoplePillar);

const oldPerformancePillar = `      performance: {
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
      },`;

const newPerformancePillar = `      performance: {
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
      },`;

code = code.replace(oldPerformancePillar, newPerformancePillar);

// 5. Update Landing.modulesData.employees capabilities
const oldEmpCaps = `    employees: {
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
      ],`;

const newEmpCaps = `    employees: {
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
      ],`;

code = code.replace(oldEmpCaps, newEmpCaps);

fs.writeFileSync(landingPath, code, 'utf8');
console.log('✅ Updated js/landing.js');

// === STEP 2: Updating css/main.css for .landing-theme-toggle-btn ===
console.log('=== STEP 2: Updating css/main.css ===');
const cssPath = path.join(__dirname, '../css/main.css');
let css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');

const toggleBtnCss = `
/* ── Landing Page Theme Toggle Button ── */
.landing-theme-toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

[data-theme="dark"] .landing-theme-toggle-btn {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(30, 41, 59, 0.7);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.landing-theme-toggle-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  border-color: var(--primary, #4f46e5);
}
`;

if (!css.includes('.landing-theme-toggle-btn')) {
  css += toggleBtnCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Added .landing-theme-toggle-btn to css/main.css');
}

console.log('🎉 Landing page patch script finished successfully!');
