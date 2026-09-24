// ============================================================
// HRM SYSTEM — Landing Page AI Feature Guide & FAQ Concierge
// Dedicated to informing visitors strictly about HRM Pro capabilities
// ============================================================

const LandingAgent = {
  isOpen: false,
  isTyping: false,
  messageHistory: [],

  faqChips: [
    { label: '💰 Payroll & Tax', query: 'Tell me about Payroll and Pakistan Tax Engine' },
    { label: '⏱️ Biometrics & Shift Swaps', query: 'How does Biometric Attendance and Shift Swapping work?' },
    { label: '⚖️ Show-Cause & Inquiry', query: 'What is the Show-Cause Notice & Disciplinary Inquiry system?' },
    { label: '📈 Merit Increment Matrix', query: 'How does the Performance Merit Increment Matrix work?' },
    { label: '🏖️ Leave Carry-Forward', query: 'How does Annual Leave Encashment and Carry-Forward work?' },
    { label: '👥 Recruitment ATS', query: 'Tell me about the Recruitment ATS Pipeline' },
    { label: '🏢 e-DMS & Probation', query: 'How does Probation Management and e-DMS Document Vault work?' },
    { label: '🎨 Themes & UI Pro', query: 'What UI features and themes are included?' },
    { label: '🔐 Roles & Permissions', query: 'What user roles and permissions exist?' },
    { label: '🚀 Free Trial & Demos', query: 'How can I try a demo or start a free trial?' }
  ],

  // Knowledge Base Dictionary with Keywords, Titles, Bullets, and Action Links
  knowledgeBase: [
    {
      id: 'payroll',
      keywords: ['payroll', 'salary', 'tax', 'fbr', 'tax slab', 'deduction', 'provident fund', 'pf', 'eobi', 'payslip', 'wage', 'compensation', 'allowance'],
      title: 'Automated Payroll & Pakistan Statutory Tax Engine',
      summary: 'HRM Pro features a complete enterprise payroll engine that calculates gross-to-net salary slips in one click with statutory compliance.',
      features: [
        '<strong>Progressive Pakistan Tax Engine:</strong> Built-in FBR progressive tax slabs (0% up to 35%) with automated monthly tax deduction.',
        '<strong>Statutory Benefits & Deductions:</strong> Automatically computes Provident Fund (PF), EOBI contributions, and corporate health insurance.',
        '<strong>Custom Allowance Baskets:</strong> House rent, medical allowance, utility allowance, and custom performance bonuses.',
        '<strong>Banking Advice Export:</strong> 1-click batch export formatted for major commercial banks (CSV, Excel).',
        '<strong>Encrypted PDF Payslips:</strong> Formatted salary slips with corporate letterhead, earnings vs deductions table, and digital verification QR.'
      ],
      actions: [
        { label: 'Explore Payroll Module', icon: 'fa-calculator', onclick: "App.showModule('payroll')" },
        { label: 'Try Payroll Demo', icon: 'fa-key', onclick: "App.showLogin()" }
      ]
    },
    {
      id: 'attendance',
      keywords: ['attendance', 'biometric', 'clock in', 'punch', 'shift', 'swap', 'roster', 'schedule', 'overtime', 'late', 'grace period', 'gate', 'fingerprint', 'facial'],
      title: 'Biometric Attendance Gateway & Peer Shift Swaps',
      summary: 'Track staff presence in real time through physical biometric hardware gates and flexible shift rostering.',
      features: [
        '<strong>Hardware Biometric Integration:</strong> Connects with fingerprint and facial recognition turnstiles and digital web/mobile clock-ins.',
        '<strong>Grace Periods & Late Policies:</strong> Automated 15-minute grace thresholds, half-day deductions, and overtime token computation.',
        '<strong>Monthly Shift Scheduling Matrix:</strong> Visual calendar matrix for morning, evening, night, and rotational shifts.',
        '<strong>Peer-to-Peer Shift Swaps:</strong> Employees can propose shift exchanges directly with teammates, requiring mutual consent and manager sign-off.',
        '<strong>Daily Attendance Exceptions:</strong> Instant flagging of late-ins, early-outs, and unexcused absences.'
      ],
      actions: [
        { label: 'Explore Attendance Module', icon: 'fa-clock', onclick: "App.showModule('attendance')" },
        { label: 'View Shift Roster', icon: 'fa-calendar-days', onclick: "App.showModule('attendance')" }
      ]
    },
    {
      id: 'leaves',
      keywords: ['leave', 'vacation', 'holiday', 'encashment', 'carry forward', 'rollover', 'casual', 'sick', 'annual', 'maternity', 'paternity', 'quota', 'balance'],
      title: 'Leave Management & Fiscal Year-End Encashment',
      summary: 'Automate multi-tier leave quotas, team approval hierarchies, and fiscal year-end roll-overs.',
      features: [
        '<strong>Multi-Tier Quotas:</strong> Configurable annual, casual, sick, maternity, and bereavement balances with real-time balance meters.',
        '<strong>Visual Team Leave Calendar:</strong> Departmental calendar highlighting overlapping leaves to prevent team shortages.',
        '<strong>2-Tier Approval Hierarchy:</strong> Scoped workflow for Line Manager and HR Director approvals.',
        '<strong>Fiscal Year-End Encashment Engine:</strong> Enforces standard statutory 10-day carry-forward to the new fiscal year opening balance.',
        '<strong>Surplus Cash Payout:</strong> Unused days beyond 10 are auto-encashed at <code>surplus × (gross/30)</code> into next month payroll with printable audit reconciliation PDFs.'
      ],
      actions: [
        { label: 'Explore Leaves Module', icon: 'fa-calendar-check', onclick: "App.showModule('leaves')" },
        { label: 'View Encashment Details', icon: 'fa-coins', onclick: "App.showModule('leaves')" }
      ]
    },
    {
      id: 'disciplinary',
      keywords: ['show cause', 'show-cause', 'inquiry', 'disciplinary', 'warning', 'misconduct', 'hearing', 'charge', 'penalty', 'sanction', 'defense', 'notice'],
      title: 'Statutory Show-Cause Notice & Disciplinary Inquiry System',
      summary: 'Complete statutory industrial relations and employee inquiry compliance lifecycle built right into HRM Pro.',
      features: [
        '<strong>Official Show-Cause Notice (SCN) Issuance:</strong> Unique reference numbering (e.g. SCN/2026/001) with pre-loaded statutory violation codes (Insubordination, Absence, Negligence, Financial Impropriety).',
        '<strong>Enforceable 7-Day Reply Mandate:</strong> Automatic urgency countdown clock warning of ex-parte committee proceedings.',
        '<strong>Employee Written Defense Portal:</strong> Formal plea selection (Denial, Mitigating Circumstances, Partial Admission) with written explanation and witness uploads.',
        '<strong>Inquiry Committee Proceedings:</strong> Records hearing minutes, Presiding Officers, examination notes, and formal verdicts (Proven, Partially Proven, Exonerated).',
        '<strong>Statutory Sanction Matrix:</strong> Automated enforcement of Formal Written Warnings, Financial Surcharges, Punitive Suspension, or Termination with Cause, plus executive PDF reports.'
      ],
      actions: [
        { label: 'Explore Employee Relations', icon: 'fa-scale-balanced', onclick: "App.showModule('employees')" }
      ]
    },
    {
      id: 'performance',
      keywords: ['performance', 'appraisal', 'merit', 'increment', 'kpi', 'okr', 'review', 'rating', 'compensation revision', 'bonus', '360'],
      title: 'Performance 360 & Merit Increment Matrix Engine',
      summary: 'Transform annual employee appraisals into automatic, calibrated compensation adjustments.',
      features: [
        '<strong>360° Appraisals & Goal Tracking:</strong> Multi-stakeholder ratings across self, peer, and manager evaluations with 1.0 to 5.0 star scoring.',
        '<strong>Automated Merit Increment Matrix:</strong> Connects review grades directly to compensation tiers: Grade A (4.5–5.0★ &rarr; +15% to +20%), Grade B (3.5–4.4★ &rarr; +8% to +12%), Grade C (2.5–3.4★ &rarr; +3% to +5%), Grade D (<2.5★ &rarr; 0%/PIP).',
        '<strong>Calibration Multiplier Models:</strong> Switch between Balanced Standard, High-Reward Growth, or Conservative Baseline with live payroll impact forecasting.',
        '<strong>1-Click Batch Payroll Commit:</strong> Automatically updates base salary in employee master records and schedules salary revision records.',
        '<strong>Official Merit Letters:</strong> Generates executive Performance Merit Increment Letters with corporate sign-offs.'
      ],
      actions: [
        { label: 'Explore Performance Module', icon: 'fa-chart-line', onclick: "App.showModule('performance')" }
      ]
    },
    {
      id: 'probation',
      keywords: ['probation', 'confirmation', 'permanent', '90 day', 'onboarding', 'induction', 'orientation', 'new joiner', 'checkpoint'],
      title: 'Probation Tracking & Permanent Confirmation Workflow',
      summary: 'Structured 90-day onboarding and permanent employment confirmation pipeline.',
      features: [
        '<strong>Dedicated Probation Workspace:</strong> Live days remaining countdown badge (Overdue in Red, Action Due Soon &le;15d in Amber, In Progress in Blue).',
        '<strong>Milestone Checkpoints:</strong> 30-Day Orientation Checkpoint, 60-Day Mid-Review Checkpoint, and 90-Day Final Evaluation Decision.',
        '<strong>Evaluation & Confirmation Modal:</strong> Grants Permanent employment status, updates employment contract, configures post-probation increment, and updates payroll.',
        '<strong>Probation Extension Workflows:</strong> Formal extension of tenure by 30, 60, or 90 days with performance improvement plan justifications.',
        '<strong>Official Confirmation Letter PDF:</strong> Generates executive confirmation letter with permanent benefits and signature blocks.'
      ],
      actions: [
        { label: 'Explore Directory & Probation', icon: 'fa-user-check', onclick: "App.showModule('employees')" }
      ]
    },
    {
      id: 'recruitment',
      keywords: ['recruitment', 'ats', 'hiring', 'applicant', 'job', 'candidate', 'resume', 'cv', 'interview', 'offer letter', 'career', 'pipeline'],
      title: 'Recruitment & Applicant Tracking System (ATS)',
      summary: 'End-to-end talent acquisition from requisition creation to signed offer letters.',
      features: [
        '<strong>Job Requisitions & Public Career Portal:</strong> Post open positions with salary ranges, experience levels, and department tags.',
        '<strong>Visual Kanban Pipeline:</strong> Drag candidates across stages: Applied &rarr; Screened &rarr; Interviewed &rarr; Offered &rarr; Hired.',
        '<strong>Resume & Portfolio Preview:</strong> Inspect applicant resumes, portfolios, and contact details without downloading.',
        '<strong>Interview Scorecards:</strong> Multi-interviewer evaluation sheets with technical, behavioral, and cultural rating metrics.',
        '<strong>1-Click Executive Offer Letters:</strong> Auto-populates compensation, joining date, reporting manager, and benefits into official PDF offer letters.'
      ],
      actions: [
        { label: 'Explore Recruitment ATS', icon: 'fa-briefcase', onclick: "App.showModule('recruitment')" }
      ]
    },
    {
      id: 'settlement',
      keywords: ['settlement', 'gratuity', 'exit', 'resignation', 'termination', 'f&f', 'clearance', 'severance', 'handover', 'final dues'],
      title: 'Full & Final (F&F) Exit Settlement & Pakistan Gratuity',
      summary: 'Compliant offboarding with departmental clearances and statutory Gratuity calculation.',
      features: [
        '<strong>Multi-Department Clearance Workflow:</strong> Sign-offs across IT (assets/laptops), Admin (keys/cards), and Finance (advances/loans).',
        '<strong>Statutory Pakistan Gratuity Calculation:</strong> Formula: <code>Years of Service × Last Basic Salary × (30 / 26)</code>.',
        '<strong>Automated Exit Additions & Deductions:</strong> Accrued salary, leave encashment additions, loan deductions, and notice buyout calculations.',
        '<strong>Official Settlement Statement PDF:</strong> Generates signed Full & Final Settlement voucher for company and employee records.'
      ],
      actions: [
        { label: 'Explore Settlements Module', icon: 'fa-file-invoice-dollar', onclick: "App.showModule('settlement')" }
      ]
    },
    {
      id: 'ui_suite',
      keywords: ['ui', 'theme', 'dark', 'light', 'obsidian', 'accent', 'color', 'density', 'compact', 'shortcut', 'keyboard', 'skeleton', 'shimmer', 'drawer', 'palette', 'spotlight'],
      title: 'Modern Enterprise UI/UX & Pro Suite (2026 Edition)',
      summary: 'Award-winning user experience built with speed, accessibility, and sleek enterprise ergonomics.',
      features: [
        '<strong>Obsidian Dark & Crisp Light Modes:</strong> Full system-wide dual theme architecture persisted in local storage.',
        '<strong>5 Brand Accent Palettes:</strong> Corporate Cobalt, Emerald Forest, Modern Violet, Crimson Rose, and Amber Gold.',
        '<strong>Table Density Engine:</strong> 1-click toggle between High-Density Compact Mode (for accountants/HR) and Comfortable Mode.',
        '<strong>Spotlight Command Palette (Ctrl+K):</strong> Global instant launcher for navigating modules, actions, and employee lookup.',
        '<strong>Two-Key Navigation Chords:</strong> Press <code>G</code> then <code>D</code> for Dashboard, <code>G</code> then <code>E</code> for Employees, <code>G</code> then <code>P</code> for Payroll, etc.',
        '<strong>Animated Skeleton Shimmers & Quick Inspect Drawers:</strong> Fast, non-blocking UI with side-peek record inspection without page reloads.'
      ],
      actions: [
        { label: 'See Quick Shortcuts (?)', icon: 'fa-keyboard', onclick: "LandingAgent.ask('Show me all keyboard shortcuts')" }
      ]
    },
    {
      id: 'security',
      keywords: ['security', 'role', 'permission', 'rbac', 'access', 'superadmin', 'manager', 'privacy', 'audit', 'session'],
      title: 'Enterprise Security, RBAC & Immutable Audit Logs',
      summary: 'Military-grade privacy and role-based access control protecting sensitive corporate records.',
      features: [
        '<strong>5 Predefined Role Profiles:</strong> Super Administrator, HR Director, Department Manager, Employee Self-Service, and New Joiner Onboarding.',
        '<strong>Granular Data Scoping:</strong> Department managers only inspect their assigned subordinates; staff only access their personal self-service portal.',
        '<strong>Immutable Activity Audit Log:</strong> Logs every action (Add, Update, Delete, Approve, Process, Login) with timestamp, actor IP, and entity ID.',
        '<strong>Secure Client & Storage Sanitization:</strong> Automatic session clearance on logout and password masking from memory caches.'
      ],
      actions: [
        { label: 'Explore Security Architecture', icon: 'fa-shield-halved', onclick: "App.showModule('administration')" }
      ]
    },
    {
      id: 'edms',
      keywords: ['edms', 'dms', 'document', 'cnic', 'degree', 'certificate', 'upload', 'expiry', 'contract', 'vault'],
      title: 'Digital Document Vault (e-DMS) & Expiry Alerts',
      summary: 'Centralized document repository with automated expiry detection for compliance.',
      features: [
        '<strong>Categorized Document Storage:</strong> Organize CNIC/National ID, educational degrees, contracts, experience letters, and police certificates.',
        '<strong>Automated Expiry Alerts:</strong> Configurable 30, 60, and 90-day automated warnings for expiring visas, passports, or security licenses.',
        '<strong>Tamper-Evident Metadata:</strong> Tracks verification status, verification date, and verifying HR officer.'
      ],
      actions: [
        { label: 'Explore e-DMS Vault', icon: 'fa-file-shield', onclick: "App.showModule('employees')" }
      ]
    },
    {
      id: 'demo_trial',
      keywords: ['demo', 'trial', 'free trial', 'login', 'sign in', 'test account', 'try', 'pricing', 'cost'],
      title: 'Live Interactive Demos & 14-Day Enterprise Free Trial',
      summary: 'Experience HRM Pro instantly with pre-populated demo data or start a zero-commitment trial.',
      features: [
        '<strong>1-Click Demo Roles:</strong> Instant login as Super Admin, HR Director, Dept Manager, or Employee on the sign-in screen without entering credentials.',
        '<strong>14-Day Free Enterprise Trial:</strong> Test all 16 modules with your own company team; no credit card required.',
        '<strong>Pre-Seeded Sample Data:</strong> 50+ employee records, biometric logs, leave requests, and payroll slips ready to explore.'
      ],
      actions: [
        { label: 'Sign In / Try Demo Presets', icon: 'fa-arrow-right-to-bracket', onclick: "App.showLogin()" },
        { label: 'Start 14-Day Free Trial', icon: 'fa-rocket', onclick: "App.showTrial()" }
      ]
    }
  ],

  // ── Initialization ──
  init() {
    this.renderChips();
    if (this.messageHistory.length === 0) {
      this.addAgentGreeting();
    }
  },

  // ── UI Controls ──
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    this.isOpen = true;
    const panel = document.getElementById('landing-agent-panel');
    const launcher = document.getElementById('landing-agent-launcher');
    if (panel) panel.classList.add('open');
    if (launcher) launcher.classList.add('active');
    setTimeout(() => {
      const input = document.getElementById('landing-agent-input');
      if (input) input.focus();
    }, 150);
  },

  close() {
    this.isOpen = false;
    const panel = document.getElementById('landing-agent-panel');
    const launcher = document.getElementById('landing-agent-launcher');
    if (panel) panel.classList.remove('open');
    if (launcher) launcher.classList.remove('active');
  },

  reset() {
    this.messageHistory = [];
    const container = document.getElementById('landing-agent-messages');
    if (container) container.innerHTML = '';
    this.addAgentGreeting();
  },

  renderChips() {
    const container = document.getElementById('landing-agent-chips');
    if (!container) return;
    container.innerHTML = this.faqChips.map(chip => `
      <button type="button" class="agent-chip" onclick="LandingAgent.ask('${chip.query.replace(/'/g, "\\'")}')">
        ${chip.label}
      </button>
    `).join('');
  },

  addAgentGreeting() {
    this.appendMessage({
      role: 'agent',
      html: `
        <div class="agent-bubble-title">
          <i class="fa fa-sparkles text-primary"></i> Welcome to HRM Pro Product Guide!
        </div>
        <p>I am your dedicated <strong>HRM Pro Feature Agent</strong>. I can answer any question about our <strong>16 enterprise modules</strong>, statutory Pakistan tax & gratuity rules, biometric shift swaps, disciplinary inquiry compliance, and modern UI capabilities.</p>
        <p style="margin-top:6px;font-size:12px;color:#94a3b8">👉 Tap any suggested topic above or ask me about a specific workflow below!</p>
      `
    });
  },

  ask(query) {
    if (!this.isOpen) this.open();
    this.appendMessage({ role: 'user', text: query });
    this.generateResponse(query);
  },

  handleUserSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('landing-agent-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    this.ask(val);
  },

  appendMessage({ role, text, html }) {
    const container = document.getElementById('landing-agent-messages');
    if (!container) return;

    const wrap = document.createElement('div');
    wrap.className = `agent-msg-wrap ${role}`;

    const avatarHtml = role === 'agent'
      ? `<div class="agent-msg-avatar"><i class="fa fa-robot"></i></div>`
      : '';

    wrap.innerHTML = `
      ${avatarHtml}
      <div class="agent-bubble">
        ${html || Utils.escapeHtml(text)}
      </div>
    `;

    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
    this.messageHistory.push({ role, text, html });
  },

  showTypingIndicator() {
    const container = document.getElementById('landing-agent-messages');
    if (!container) return null;
    const typingEl = document.createElement('div');
    typingEl.id = 'agent-typing-indicator';
    typingEl.className = 'agent-msg-wrap agent';
    typingEl.innerHTML = `
      <div class="agent-msg-avatar"><i class="fa fa-robot"></i></div>
      <div class="agent-bubble">
        <div class="agent-typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
    return typingEl;
  },

  removeTypingIndicator() {
    const el = document.getElementById('agent-typing-indicator');
    if (el) el.remove();
  },

  generateResponse(query) {
    const typing = this.showTypingIndicator();
    const cleanQuery = query.toLowerCase();

    setTimeout(() => {
      this.removeTypingIndicator();
      const matched = this.matchQueryToKnowledge(cleanQuery);
      this.appendMessage({ role: 'agent', html: matched });
    }, 380);
  },

  matchQueryToKnowledge(query) {
    // 1. Direct match in knowledge base
    let bestMatch = null;
    let highestScore = 0;

    for (const item of this.knowledgeBase) {
      let score = 0;
      for (const kw of item.keywords) {
        if (query.includes(kw)) {
          score += kw.length;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && highestScore > 0) {
      return this.formatKnowledgeCard(bestMatch);
    }

    // 2. Specific Keyboard shortcuts inquiry
    if (query.includes('shortcut') || query.includes('keyboard') || query.includes('hotkey')) {
      return `
        <div class="agent-bubble-title">
          <i class="fa fa-keyboard text-primary"></i> Power-User Keyboard Shortcuts
        </div>
        <p>HRM Pro includes high-speed chord navigation:</p>
        <ul class="agent-feature-list">
          <li><code>G</code> then <code>D</code> &rarr; Navigate to <strong>Dashboard</strong></li>
          <li><code>G</code> then <code>E</code> &rarr; Navigate to <strong>Employees Directory</strong></li>
          <li><code>G</code> then <code>A</code> &rarr; Navigate to <strong>Attendance & Shifts</strong></li>
          <li><code>G</code> then <code>P</code> &rarr; Navigate to <strong>Payroll & Taxes</strong></li>
          <li><code>Ctrl + K</code> &rarr; Global <strong>Spotlight Command Palette</strong></li>
          <li><code>T</code> &rarr; Toggle <strong>Dark / Light Mode</strong></li>
          <li><code>D</code> &rarr; Toggle <strong>High-Density Compact Tables</strong></li>
        </ul>
        <div class="agent-bubble-actions">
          <button class="agent-action-btn-link" onclick="App.showLogin()"><i class="fa fa-arrow-right"></i> Try in Demo Portal</button>
        </div>
      `;
    }

    // 3. Fallback: Full Directory of 16 Enterprise Modules
    return `
      <div class="agent-bubble-title">
        <i class="fa fa-cubes text-primary"></i> HRM Pro Enterprise Platform Overview
      </div>
      <p>HRM Pro is an end-to-end Human Resource Information System encompassing <strong>16 integrated modules</strong>:</p>
      <div style="margin:8px 0;display:flex;flex-wrap:wrap;gap:4px">
        <span class="agent-tag-badge">Employees & e-DMS</span>
        <span class="agent-tag-badge">Biometric Attendance</span>
        <span class="agent-tag-badge">Shift Swap Roster</span>
        <span class="agent-tag-badge">Statutory Payroll & Tax</span>
        <span class="agent-tag-badge">Leave Encashment</span>
        <span class="agent-tag-badge">Performance 360</span>
        <span class="agent-tag-badge">Merit Increment Matrix</span>
        <span class="agent-tag-badge">Show-Cause Inquiries</span>
        <span class="agent-tag-badge">Probation Checkpoints</span>
        <span class="agent-tag-badge">Recruitment ATS</span>
        <span class="agent-tag-badge">Exit Settlements & Gratuity</span>
        <span class="agent-tag-badge">Asset Inventory</span>
        <span class="agent-tag-badge">Expense Claims</span>
        <span class="agent-tag-badge">Helpdesk Ticketing</span>
      </div>
      <p style="margin-top:6px">Ask me specifically about any module (e.g. <em>"How does the tax engine work?"</em> or <em>"Explain shift swaps"</em>) or click below to launch the interactive live demo!</p>
      <div class="agent-bubble-actions">
        <button class="agent-action-btn-link" onclick="App.showLogin()"><i class="fa fa-key"></i> Launch Interactive Demo</button>
        <button class="agent-action-btn-link" onclick="App.showTrial()"><i class="fa fa-rocket"></i> Start Free Trial</button>
      </div>
    `;
  },

  formatKnowledgeCard(item) {
    const featuresHtml = item.features.map(f => `<li>${f}</li>`).join('');
    const actionsHtml = item.actions.map(a => `
      <button class="agent-action-btn-link" onclick="${a.onclick}">
        <i class="fa ${a.icon}"></i> ${a.label}
      </button>
    `).join('');

    return `
      <div class="agent-bubble-title">
        <i class="fa fa-check-circle text-success"></i> ${item.title}
      </div>
      <p style="color:#e2e8f0;margin-bottom:8px">${item.summary}</p>
      <ul class="agent-feature-list">
        ${featuresHtml}
      </ul>
      <div class="agent-bubble-actions">
        ${actionsHtml}
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.LandingAgent = LandingAgent;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LandingAgent;
}
