// ============================================================
// HRM SYSTEM — App Bootstrap, Router & Core Shell
// ============================================================

const App = {
  currentModule: null,

  async init() {
    try {
      // 0. Instant First Paint: If visiting root, #landing, #login or #trial, immediately display the view in 0ms!
      const initialHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
      if (!initialHash || initialHash === 'landing') {
        const landingEl = document.getElementById('landing-page');
        const savedLandingTheme = localStorage.getItem('landing_theme') || localStorage.getItem('hrm_landing_theme') || 'dark';
        if (landingEl) {
          landingEl.style.display = 'block';
          landingEl.setAttribute('data-landing-theme', savedLandingTheme);
          landingEl.setAttribute('data-theme', savedLandingTheme);
        }
        if (typeof Landing !== 'undefined' && Landing.render) {
          try { Landing.render(); } catch (e) { console.warn('Pre-paint landing error:', e); }
        }
      } else if (initialHash === 'login') {
        const loginEl = document.getElementById('login-page');
        if (loginEl) {
          loginEl.style.display = 'flex';
        }
        if (typeof Login !== 'undefined' && Login.render) {
          try { Login.render();
    if (window.location.hash === '#chat-login' || window.location.search.includes('portal=chat')) { Login.setPortal('chat'); } } catch (e) { console.warn('Pre-paint login error:', e); }
        }
      } else if (initialHash === 'trial') {
        const trialEl = document.getElementById('trial-page');
        if (trialEl) {
          trialEl.style.display = 'flex';
        }
      }

      await DB.init();
      Auth.init();
      if (typeof LiveNotifications !== 'undefined' && LiveNotifications.init) {
        LiveNotifications.init();
      }
      if (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.init) {
        HRMWebSocket.init();
      }
      if (typeof Chat !== 'undefined' && Chat.init) {
        Chat.init();
      }
      // Apply saved appearance settings immediately (Theme, Accent, Density)
        if (typeof DB !== 'undefined' && DB.getObj) {
          const s = DB.getObj('settings') || {};
          const savedTheme = localStorage.getItem('hrm_theme_mode') || s.theme || 'dark';
          document.documentElement.setAttribute('data-theme', savedTheme);

          const savedAccent = localStorage.getItem('hrm_accent_color') || 'blue';
          document.documentElement.setAttribute('data-accent', savedAccent);

          const savedDensity = localStorage.getItem('hrm_table_density') || (s.compactMode ? 'compact' : 'comfortable');
          document.body.setAttribute('data-table-density', savedDensity);
          document.documentElement.setAttribute('data-table-density', savedDensity);
          if (savedDensity === 'compact') {
            document.body.classList.add('compact-mode');
            document.documentElement.classList.add('compact-mode');
          }

          if (s.accentColor) {
            document.documentElement.style.setProperty('--primary', s.accentColor);
            document.documentElement.style.setProperty('--primary-light', s.accentColor + 'cc');
            document.documentElement.style.setProperty('--primary-dark', s.accentColor);
            document.documentElement.style.setProperty('--primary-glow', s.accentColor + '33');
          }
          const appEl = document.getElementById('app');
          let navPos = localStorage.getItem('hrm_nav_position') || s.sidebarPosition || 'top';
          if (navPos !== 'top') { navPos = 'top'; localStorage.setItem('hrm_nav_position', 'top'); }
          this.setNavPosition(navPos, false);
        }

      // Initialize Browser Back/Forward navigation router
      this.setupHistoryRouter();

      const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
      const loggedIn = typeof Auth !== 'undefined' && (typeof Auth.isLoggedIn === 'function' ? Auth.isLoggedIn() : !!Auth.user);

      // Known app modules that can be restored on browser refresh
      const appModules = [
        'dashboard', 'employees', 'attendance', 'leaves', 'payroll',
        'settlement', 'companies', 'performance', 'recruitment', 'assets',
        'expenses', 'helpdesk', 'events', 'reports', 'administration',
        'settings', 'profile', 'chat'
      ];

      // ── Routing logic ───────────────────────────────────────────────────
      // If user is logged in AND URL has an active module hash (e.g. #dashboard, #payroll),
      // restore their session on that exact module (handles browser F5 / Refresh).
      // If the user visits the official root URL (no hash, or #landing), ALWAYS show Landing!
      if (loggedIn && appModules.includes(rawHash)) {
        this.showApp();
        this.navigate(rawHash, null, false);
      } else if (rawHash === 'login') {
        this.showLogin(false, 'hrm');
      } else if (rawHash === 'chat-login') {
        this.showLogin(false, 'chat');
      } else if (rawHash === 'trial') {
        this.showTrial('Pro', false);
      } else if (rawHash.startsWith('module-')) {
        this.showModule(rawHash.replace('module-', ''), false);
      } else {
        // Root URL (https://my-hrm-rosy.vercel.app/), #landing, or unauthenticated:
        // ALWAYS show official Landing Page!
        this.showLanding(false);
      }

    } catch (err) {
      console.error('App.init error:', err);
      this.showLanding(false);
    }
  },

  setupHistoryRouter() {
    // Record initial browser history state if empty
    const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
    const isAppModule = rawHash && !['landing', 'login', 'trial'].includes(rawHash) && !rawHash.startsWith('module-');
    const initialPage = rawHash === 'login' ? 'login' : (rawHash === 'trial' ? 'trial' : (rawHash.startsWith('module-') ? 'module' : (isAppModule ? 'app' : 'landing')));
    if (!history.state) {
      history.replaceState({ page: initialPage, module: isAppModule ? rawHash : undefined, hash: window.location.hash || '#landing' }, '', window.location.href);
    }

    // Listen to Chrome default back & forward buttons
    window.addEventListener('popstate', (event) => {
      const state = event.state;
      const currentHash = window.location.hash;
      const loggedIn = typeof Auth !== 'undefined' && (typeof Auth.isLoggedIn === 'function' ? Auth.isLoggedIn() : !!Auth.user);

      if (state && state.page) {
        switch (state.page) {
          case 'landing':
            this.showLanding(false);
            break;
          case 'login':
            this.showLogin(false, (state && state.portal) || (currentHash === '#chat-login' ? 'chat' : 'hrm'));
            break;
          case 'trial':
            this.showTrial(state.plan || 'Pro', false);
            break;
          case 'module':
            this.showModule(state.moduleId, false);
            break;
          case 'app':
            if (loggedIn) {
              const appEl = document.getElementById('app');
              if (!appEl || appEl.style.display === 'none') {
                this.showApp();
              }
              this.navigate(state.module || 'dashboard', state.subSection || null, false);
            } else {
              // Session expired — go to sign in page
              this.showLogin(false);
            }
            break;
          default:
            this.showLanding(false);
        }
      } else {
        if (!currentHash || currentHash === '' || currentHash === '#' || currentHash === '#landing') {
          this.showLanding(false);
        } else if (currentHash === '#login') {
          this.showLogin(false, 'hrm');
        } else if (currentHash === '#chat-login') {
          this.showLogin(false, 'chat');
        } else if (currentHash === '#trial') {
          this.showTrial('Pro', false);
        } else if (currentHash.startsWith('#module-')) {
          this.showModule(currentHash.replace('#module-', ''), false);
        } else if (loggedIn) {
          this.showApp();
          this.navigate(currentHash.replace('#', '') || 'dashboard', null, false);
        } else {
          this.showLanding(false);
        }
      }
    });
  },

  showLanding(pushState = true) {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const savedLandingTheme = localStorage.getItem('landing_theme') || localStorage.getItem('hrm_landing_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedLandingTheme);
    document.documentElement.setAttribute('data-landing-theme', savedLandingTheme);
    document.body.setAttribute('data-theme', savedLandingTheme);
    document.body.setAttribute('data-landing-theme', savedLandingTheme);
    if (landing) {
      landing.style.display = 'block';
      landing.setAttribute('data-landing-theme', savedLandingTheme);
      landing.setAttribute('data-theme', savedLandingTheme);
    }
    if (modDetail) modDetail.style.display = 'none';
    if (login) login.style.display = 'none';
    if (trial) trial.style.display = 'none';
    if (app) app.style.display = 'none';

    // Chat Isolation & Landing Agent Control
    document.body.classList.remove('app-workspace-active');
    const chatBtn = document.getElementById('chat-floating-launcher');
    if (chatBtn) chatBtn.style.display = 'none';
    if (typeof Chat !== 'undefined' && Chat.closeDrawer) Chat.closeDrawer();

    const agentBtn = document.getElementById('landing-agent-launcher');
    if (agentBtn) agentBtn.style.display = 'flex';
    if (typeof LandingAgent !== 'undefined' && LandingAgent.init) {
      LandingAgent.init();
    }

    if (typeof Landing !== 'undefined' && Landing.render) {
      Landing.render();
    }
    if (pushState && history.pushState) {
      history.pushState({ page: 'landing' }, '', '#landing');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  showModule(moduleId, pushState = true) {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    const savedLandingTheme = localStorage.getItem('landing_theme') || localStorage.getItem('hrm_landing_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedLandingTheme);
    document.documentElement.setAttribute('data-landing-theme', savedLandingTheme);
    document.body.setAttribute('data-theme', savedLandingTheme);
    document.body.setAttribute('data-landing-theme', savedLandingTheme);
    if (modDetail) {
      modDetail.style.display = 'block';
      modDetail.setAttribute('data-landing-theme', savedLandingTheme);
      modDetail.setAttribute('data-theme', savedLandingTheme);
    }
    if (login) login.style.display = 'none';
    if (trial) trial.style.display = 'none';
    if (app) app.style.display = 'none';

    // Chat Isolation & Landing Agent Control
    document.body.classList.remove('app-workspace-active');
    const chatBtn = document.getElementById('chat-floating-launcher');
    if (chatBtn) chatBtn.style.display = 'none';
    if (typeof Chat !== 'undefined' && Chat.closeDrawer) Chat.closeDrawer();

    const agentBtn = document.getElementById('landing-agent-launcher');
    if (agentBtn) agentBtn.style.display = 'flex';
    if (typeof LandingAgent !== 'undefined' && LandingAgent.init) {
      LandingAgent.init();
    }

    if (typeof Landing !== 'undefined' && Landing.renderModuleDetail) {
      Landing.renderModuleDetail(moduleId);
    }
    if (pushState && history.pushState) {
      history.pushState({ page: 'module', moduleId }, '', `#module-${moduleId}`);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  showLogin(pushState = true, targetPortal = null) {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    if (modDetail) modDetail.style.display = 'none';
    
    // Login Page is STRICTLY Light Mode Only
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.removeAttribute('data-landing-theme');
    document.body.setAttribute('data-theme', 'light');
    document.body.removeAttribute('data-landing-theme');
    
    if (login) {
      login.style.display = 'flex';
      login.setAttribute('data-theme', 'light');
    }
    if (trial) trial.style.display = 'none';
    if (app) app.style.display = 'none';

    // Suppress both floating widgets on login screen
    document.body.classList.remove('app-workspace-active');
    const chatBtn = document.getElementById('chat-floating-launcher');
    if (chatBtn) chatBtn.style.display = 'none';
    if (typeof Chat !== 'undefined' && Chat.closeDrawer) Chat.closeDrawer();

    const agentBtn = document.getElementById('landing-agent-launcher');
    if (agentBtn) agentBtn.style.display = 'none';
    if (typeof LandingAgent !== 'undefined' && LandingAgent.close) LandingAgent.close();

    Login.render();
    if (targetPortal) {
      Login.setPortal(targetPortal);
    } else if (window.location.hash === '#chat-login' || window.location.search.includes('portal=chat')) {
      Login.setPortal('chat');
    }
    if (pushState && history.pushState) {
      const targetHash = (targetPortal === 'chat' || Login.activePortal === 'chat') ? '#chat-login' : '#login';
      history.pushState({ page: 'login', portal: Login.activePortal }, '', targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  showTrial(plan = 'Pro', pushState = true) {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    if (modDetail) modDetail.style.display = 'none';
    if (login) login.style.display = 'none';
    if (trial) { trial.style.display = 'flex'; trial.setAttribute('data-theme', 'dark'); }
    if (app) app.style.display = 'none';

    // Suppress internal chat & close agent
    document.body.classList.remove('app-workspace-active');
    const chatBtn = document.getElementById('chat-floating-launcher');
    if (chatBtn) chatBtn.style.display = 'none';
    if (typeof Chat !== 'undefined' && Chat.closeDrawer) Chat.closeDrawer();

    const agentBtn = document.getElementById('landing-agent-launcher');
    if (agentBtn) agentBtn.style.display = 'none';
    if (typeof LandingAgent !== 'undefined' && LandingAgent.close) LandingAgent.close();

    if (typeof Trial !== 'undefined' && Trial.render) {
      Trial.render(plan);
    }
    if (pushState && history.pushState) {
      history.pushState({ page: 'trial', plan }, '', '#trial');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  showApp() {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    if (modDetail) modDetail.style.display = 'none';
    if (login) login.style.display = 'none';
    if (trial) trial.style.display = 'none';
    if (app) app.style.display = 'flex';

    // Workspace active mode: internal floating drawer launcher permanently suppressed
    document.body.classList.add('app-workspace-active');
    const chatBtn = document.getElementById('chat-floating-launcher');
    if (chatBtn) chatBtn.style.display = 'none';

    const agentBtn = document.getElementById('landing-agent-launcher');
    if (agentBtn) agentBtn.style.display = 'none';
    if (typeof LandingAgent !== 'undefined' && LandingAgent.close) LandingAgent.close();

    let navPos = localStorage.getItem('hrm_nav_position') || DB.getObj('settings')?.sidebarPosition || 'top';
    if (navPos !== 'top') { navPos = 'top'; localStorage.setItem('hrm_nav_position', 'top'); }
    this.setNavPosition(navPos, false);

    this.renderSidebar();
    this.renderTopbar();
    if (typeof this.renderPersonaDock === 'function') {
      try { this.renderPersonaDock(); } catch (e) { console.warn('renderPersonaDock notice:', e); }
    }
    if (typeof this.setupKeyboardShortcuts === 'function') {
      try { this.setupKeyboardShortcuts(); } catch (e) {}
    }
    if (typeof this.setupNavScroll === 'function') {
      try { this.setupNavScroll(); } catch (e) {}
    }
    // Restore sidebar state
    const collapsed = localStorage.getItem('hrm_sidebar_collapsed') === '1';
    if (collapsed) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.add('collapsed');
        const icon = document.querySelector('#sidebar-toggle i');
        if (icon) icon.className = 'fa fa-chevron-right';
      }
    }

    // Guarantee that active module is populated immediately (prevents blank screen)
    const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
    const activeMod = (rawHash && rawHash !== 'login' && rawHash !== 'trial' && !rawHash.startsWith('module-') && rawHash !== 'landing') ? rawHash : (this.currentModule || 'dashboard');
    this.navigate(activeMod, null, false);
  },

  getPillars() {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'fa-gauge-high',
        directModule: 'dashboard',
        moduleIds: ['dashboard'],
        items: []
      },
      {
        id: 'people',
        label: 'People & Talent',
        icon: 'fa-users-gear',
        moduleIds: ['employees', 'recruitment', 'performance', 'profile'],
        items: [
          { id: 'employees', label: 'Employees & e-DMS', icon: 'fa-users' },
          { id: 'recruitment', label: 'Recruitment (ATS)', icon: 'fa-briefcase' },
          { id: 'performance', label: 'Performance & OKRs', icon: 'fa-chart-line' },
          { id: 'profile', label: 'My Profile & Onboarding', icon: 'fa-id-card-clip' }
        ]
      },
      {
        id: 'time',
        label: 'Time & Attendance',
        icon: 'fa-clock',
        moduleIds: ['attendance', 'leaves', 'assets'],
        items: [
          { id: 'attendance', label: 'Attendance & Shifts', icon: 'fa-clock' },
          { id: 'leaves', label: 'Leaves & Absence', icon: 'fa-calendar-xmark' },
          { id: 'assets', label: 'Assets & Inventory', icon: 'fa-laptop-file' }
        ]
      },
      {
        id: 'finance',
        label: 'Finance & Payroll',
        icon: 'fa-money-bill-wave',
        moduleIds: ['payroll', 'expenses', 'settlement'],
        items: [
          { id: 'payroll', label: 'Payroll & Taxes', icon: 'fa-money-bill-wave' },
          { id: 'expenses', label: 'Expense Claims', icon: 'fa-receipt' },
          { id: 'settlement', label: 'Final Settlement', icon: 'fa-file-invoice-dollar' }
        ]
      },
      {
        id: 'operations',
        label: 'Operations & Admin',
        icon: 'fa-sliders',
        moduleIds: ['helpdesk', 'reports', 'events', 'administration', 'companies'],
        items: [
          { id: 'helpdesk', label: 'Helpdesk & Grievance', icon: 'fa-headset' },
          { id: 'reports', label: 'Reports & Analytics', icon: 'fa-file-chart-column' },
          { id: 'events', label: 'Events & Notices', icon: 'fa-bullhorn' },
          { id: 'administration', label: 'Administration', icon: 'fa-gear' },
          { id: 'companies', label: 'Multi-Company Holdings', icon: 'fa-building-shield' }
        ]
      }
    ];
  },

  getAllowedModules() {
    const items = (typeof Auth !== 'undefined' && Auth.getSidebarItems) ? Auth.getSidebarItems() : [];
    const allowed = new Set(items.map(i => i.id));
    if (typeof Auth !== 'undefined') {
      if (Auth.canAccessModule('settlement')) allowed.add('settlement');
      if (Auth.canAccessModule('companies') || ['superadmin', 'hr_manager'].includes(Auth.role)) allowed.add('companies');
      if (Auth.canAccessModule('events')) allowed.add('events');
      if (Auth.canAccessModule('administration') || ['superadmin', 'hr_manager'].includes(Auth.role)) allowed.add('administration');
      if (Auth.canAccessModule('settings') || ['superadmin', 'hr_manager'].includes(Auth.role)) allowed.add('settings');
      if (Auth.canAccessModule('profile')) allowed.add('profile');
      allowed.add('dashboard');
    }
    return allowed;
  },

  getPillarForModule(moduleId) {
    if (!moduleId || moduleId === 'dashboard') return 'dashboard';
    const effectiveMod = (moduleId === 'settings') ? 'administration' : moduleId;
    const pillars = this.getPillars();
    for (const p of pillars) {
      if (p.directModule === effectiveMod) return p.id;
      if (p.moduleIds && p.moduleIds.includes(effectiveMod)) return p.id;
    }
    return 'dashboard';
  },

  selectPillar(pillarId) {
    const pillars = this.getPillars();
    const pillar = pillars.find(p => p.id === pillarId);
    if (!pillar) return;

    if (pillar.directModule) {
      this.navigate(pillar.directModule);
      return;
    }

    const allowed = this.getAllowedModules();
    const activeSubs = pillar.items.filter(item => allowed.has(item.id));
    if (activeSubs.length === 0) return;

    // Check if current module is already in this pillar
    const currentMod = (this.currentModule === 'settings') ? 'administration' : this.currentModule;
    const isCurrentInPillar = activeSubs.some(s => s.id === currentMod);
    const targetModule = isCurrentInPillar ? currentMod : activeSubs[0].id;

    this.navigate(targetModule);
  },

  renderSubnavBar(pillarId, activeModuleId) {
    const subnav = document.getElementById('subnav-bar');
    if (subnav) {
      subnav.style.display = 'none';
      subnav.classList.add('hidden');
      subnav.innerHTML = '';
    }
  },

  renderSidebar() {
    const emp = Auth.employee || {};
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const avatarColor = Utils.avatarColor(emp.id);
    const initials = Utils.avatarInitials(emp.fullName || Auth.user?.name || 'User');
    const activeCo = (typeof Company !== 'undefined' && Company.getActive) ? Company.getActive() : null;
    const companyName = activeCo ? (activeCo.tradeName || activeCo.name) : (DB.getObj('settings')?.companyName || 'ApexTech');
    const companyLogoText = activeCo?.logoText || 'AT';

    const allowed = this.getAllowedModules();
    const currentMod = this.currentModule || 'dashboard';

    // 11 Core Reference Navigation Tabs & Groupings
    const refTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-house', direct: true },
      { id: 'employees', label: 'Employees', icon: 'fa-users', chevron: true },
      { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check', chevron: true },
      { id: 'leaves', label: 'Leave', icon: 'fa-calendar-minus', chevron: true },
      { id: 'payroll', label: 'Payroll', icon: 'fa-credit-card' },
      { id: 'recruitment', label: 'Recruitment', icon: 'fa-briefcase', chevron: true },
      { id: 'performance', label: 'Performance', icon: 'fa-chart-simple', chevron: true },
      { id: 'reports', label: 'Reports', icon: 'fa-chart-line', chevron: true },
      { id: 'operations', label: 'Operations', icon: 'fa-cubes', chevron: true },
      { id: 'administration', label: 'Master Data', icon: 'fa-database', chevron: true },
      { id: 'settings', label: 'Settings', icon: 'fa-gear', chevron: true }
    ];

    const tabSubMenus = {
      employees: [
        { id: 'employees', view: 'directory', label: 'Employee Directory', icon: 'fa-id-card' },
        { id: 'employees', view: 'orgchart', label: 'Org Chart & Hierarchy', icon: 'fa-sitemap' },
        { id: 'employees', view: 'edms', label: 'e-DMS Cloud Files', icon: 'fa-folder-closed' }
      ],
      attendance: [
        { id: 'attendance', view: 'daily', label: 'Daily Timesheet & Shifts', icon: 'fa-clock' },
        { id: 'attendance', view: 'machine', label: 'Biometric Machine Sync', icon: 'fa-fingerprint' },
        { id: 'attendance', view: 'roster', label: 'Duty Rosters & Overtime', icon: 'fa-business-time' }
      ],
      leaves: [
        { id: 'leaves', view: 'requests', label: 'Leave Requests & Approvals', icon: 'fa-calendar-check' },
        { id: 'leaves', view: 'calendar', label: 'Public Holidays Calendar', icon: 'fa-calendar-days' },
        { id: 'leaves', view: 'balances', label: 'Leave Quotas & Balances', icon: 'fa-scale-balanced' }
      ],
      recruitment: [
        { id: 'recruitment', view: 'openings', label: 'Job Openings & ATS', icon: 'fa-briefcase' },
        { id: 'recruitment', view: 'pipeline', label: 'Candidate Kanban Board', icon: 'fa-table-columns' },
        { id: 'recruitment', view: 'interviews', label: 'Interview Scheduling', icon: 'fa-calendar-user' }
      ],
      performance: [
        { id: 'performance', view: 'reviews', label: 'Performance Reviews', icon: 'fa-chart-line' },
        { id: 'performance', view: 'goals', label: 'Corporate OKRs & Goals', icon: 'fa-bullseye' },
        { id: 'performance', view: '360', label: '360° Peer Feedback', icon: 'fa-arrows-rotate' }
      ],
      reports: [
        { id: 'reports', view: 'workforce', label: 'Workforce Analytics', icon: 'fa-chart-pie' },
        { id: 'reports', view: 'tax', label: 'Pakistan Tax Summary (FBR)', icon: 'fa-file-invoice-dollar' },
        { id: 'reports', view: 'bank', label: 'Bank Disbursal Checksums', icon: 'fa-building-columns' }
      ],
      operations: [
        { id: 'assets', view: '', label: 'Assets & Inventory', icon: 'fa-laptop-file' },
        { id: 'expenses', view: '', label: 'Expense Claims', icon: 'fa-receipt' },
        { id: 'helpdesk', view: '', label: 'Helpdesk Tickets', icon: 'fa-headset' },
        { id: 'events', view: '', label: 'Events & Notices', icon: 'fa-bullhorn' },
        { id: 'settlement', view: '', label: 'Final Settlement', icon: 'fa-file-invoice-dollar' }
      ],
      administration: [
        { id: 'administration', view: 'departments', label: 'Departments & Designations', icon: 'fa-building' },
        { id: 'companies', view: '', label: 'Multi-Company Legal Entities', icon: 'fa-building-shield' },
        { id: 'administration', view: 'audit', label: 'Audit Trail Logs', icon: 'fa-shield-halved' }
      ],
      settings: [
        { id: 'settings', view: 'general', label: 'System Configuration', icon: 'fa-sliders' },
        { id: 'settings', view: 'appearance', label: 'Theme & Accent Palette', icon: 'fa-palette' },
        { id: 'settings', view: 'roles', label: 'RBAC Permission Matrix', icon: 'fa-user-shield' }
      ]
    };

    const renderedTabs = refTabs.map(t => {
      const isOps = t.id === 'operations';
      if (!isOps && !allowed.has(t.id) && t.id !== 'dashboard') return '';
      const subs = tabSubMenus[t.id] || [];
      const isSubActive = subs.some(s => s.id === currentMod);
      const isActive = currentMod === t.id || (t.id === 'administration' && currentMod === 'master') || (isOps && ['assets', 'expenses', 'helpdesk', 'events', 'settlement'].includes(currentMod)) || isSubActive;

      return `
        <div class="nav-tab-dropdown-wrap" style="position:relative;display:inline-flex;align-items:center">
          <div class="nav-item nav-tab-item ${isActive ? 'active' : ''}" data-module="${t.id}"
            onclick="${t.chevron ? "/* Toggle or navigate */ App.navigate('" + (subs[0]?.id || t.id) + "', '" + (subs[0]?.view || '') + "');" : "App.navigate('" + t.id + "');"} App.closeMobileSidebar();"
            style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:12.5px;font-weight:${isActive ? '700' : '500'};color:${isActive ? '#ea580c' : 'var(--text-2,#475569)'};background:${isActive ? '#fff7ed' : 'transparent'};border:${isActive ? '1px solid #fed7aa' : '1px solid transparent'};white-space:nowrap;transition:all 0.15s">
            <i class="fa ${t.icon}" style="font-size:13px;color:${isActive ? '#f97316' : 'var(--text-3,#64748b)'}"></i>
            <span>${t.label}</span>
            ${t.chevron ? '<i class="fa fa-chevron-down" style="font-size:8px;opacity:0.6;margin-left:2px"></i>' : ''}
          </div>

          ${subs.length > 0 ? `
            <div class="nav-tab-sub-dropdown" style="display:none;position:absolute;top:calc(100% + 4px);left:0;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 10px 24px rgba(0,0,0,0.1);min-width:195px;z-index:1060;padding:6px 0">
              ${subs.map(s => `
                <a href="javascript:void(0)" onclick="App.navigate('${s.id}', '${s.view || ''}'); App.closeMobileSidebar();" style="display:flex;align-items:center;gap:9px;padding:8px 14px;color:var(--text,#1e293b);font-size:12px;font-weight:600;text-decoration:none;transition:background 0.12s" onmouseover="this.style.background='var(--surface,#f8fafc)'" onmouseout="this.style.background='transparent'">
                  <i class="fa ${s.icon}" style="font-size:12px;color:var(--primary,#2563eb);width:14px;text-align:center"></i>
                  <span>${s.label}</span>
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="brand-wrap" style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="App.navigate('dashboard')">
          <div class="logo-icon" style="width:34px;height:34px;border-radius:8px;background:#f97316;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:15px;box-shadow:0 3px 10px rgba(249,115,22,0.3);flex-shrink:0">
            <i class="fa fa-users"></i>
          </div>
          <div class="logo-text">
            <h1 id="company-sidebar-name" style="margin:0;font-size:15px;font-weight:800;color:var(--text);font-family:'Inter',sans-serif">HRM Pro</h1>
            <span style="font-size:10px;color:var(--text-3);text-transform:uppercase">HR Management</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="mobile-close-btn" id="mobile-sidebar-close" onclick="App.closeMobileSidebar()" title="Close Navigation Menu">
            <i class="fa fa-xmark"></i>
          </button>
          <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle sidebar">
            <i class="fa fa-chevron-left"></i>
          </button>
        </div>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar-sm avatar" style="background:${avatarColor};overflow:hidden">${emp.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName || 'User'}">` : initials}</div>
        <div class="user-info">
          <div class="name">${emp.fullName || Auth.user?.name || 'User'}</div>
          <div class="role-badge">${Auth.role ? Auth.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'User'}</div>
        </div>
      </div>

      <nav class="sidebar-nav" style="display:flex;align-items:center;overflow-x:auto;scrollbar-width:none">
        ${renderedTabs}
      </nav>

      <div class="sidebar-footer" style="display:flex;flex-direction:column;gap:6px">
        <button class="logout-btn" onclick="App.logout()">
          <i class="fa fa-right-from-bracket"></i>
          <span>Logout</span>
        </button>
      </div>
    `;

    // Render persistent subnav bar for active pillar
    const activePillarId = this.getPillarForModule(currentMod);
    this.renderSubnavBar(activePillarId, currentMod);

    // Sidebar overlay for mobile
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      overlay.onclick = () => App.closeMobileSidebar();
      document.body.appendChild(overlay);
    }

    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const icon = document.querySelector('#sidebar-toggle i');
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (icon) icon.className = isCollapsed ? 'fa fa-chevron-right' : 'fa fa-chevron-left';
        localStorage.setItem('hrm_sidebar_collapsed', isCollapsed ? '1' : '0');
      });
    }
  },

  toggleNavPillar(triggerEl, event) {},
  closeNavPillars() {},

    toggleUserDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('user-menu-dropdown');
    if (menu) {
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
  },

  renderTopbar() {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const isDark = currentTheme !== 'light';
    const currentDensity = document.body.getAttribute('data-table-density') || 'comfortable';
    const emp = Auth.employee || {};
    const fullName = emp.fullName || Auth.user?.name || 'Super Admin';
    const curInitials = (typeof Utils !== 'undefined' && Utils.avatarInitials) ? Utils.avatarInitials(fullName) : 'SA';
    const curRoleLabel = Auth.role ? Auth.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Administrator';
    const activeCo = (typeof Company !== 'undefined' && Company.getActive) ? Company.getActive() : null;
    const companyName = activeCo ? (activeCo.tradeName || activeCo.name) : 'Head Office';

    topbar.innerHTML = `
      <!-- Left: Brand Logo matching Reference Image -->
      <div class="topbar-left-zone" style="display:flex;align-items:center;gap:12px;min-width:0;flex-shrink:0">
        <button class="mobile-menu-btn" id="mobile-menu-btn" onclick="App.openMobileSidebar()" title="Toggle Menu" style="display:none">
          <i class="fa fa-bars"></i>
        </button>

        <div class="brand-wrap" onclick="App.navigate('dashboard')" style="cursor:pointer;display:inline-flex;align-items:center;gap:10px" title="HRM Pro">
          <div style="width:38px;height:38px;border-radius:10px;background:#f97316;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:0 3px 10px rgba(249,115,22,0.3)">
            <i class="fa fa-users"></i>
          </div>
          <div style="display:flex;flex-direction:column;justify-content:center;line-height:1.2">
            <div style="margin:0;font-size:18px;font-weight:900;letter-spacing:-0.4px;color:#f97316;font-family:'Inter',sans-serif">HRM <span style="color:#ea580c">Pro</span></div>
            <span style="font-size:10.5px;font-weight:500;color:var(--text-3);letter-spacing:0.1px">Human Resource Management</span>
          </div>
        </div>
      </div>

      <!-- Center-Left: Wide Search Input matching Reference Image -->
      <div style="position:relative;width:340px;max-width:30vw;min-width:180px;margin:0 10px" id="topbar-search-wrap">
        <i class="fa fa-magnifying-glass" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:12px;pointer-events:none"></i>
        <input type="text" placeholder="Search employees, departments, leave requests..." id="global-search"
          oninput="App.handleGlobalSearch(this.value)"
          onclick="App.openCommandPalette()"
          autocomplete="off"
          style="width:100%;height:38px;background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:0 14px 0 36px;font-size:12px;color:var(--text);outline:none;box-shadow:inset 0 1px 2px rgba(0,0,0,0.02)">
        <div class="search-dropdown" id="search-dropdown"></div>
      </div>

      <!-- Center-Right: Subsidiary / Office Switcher Pill matching Reference Image -->
      <div onclick="typeof Company !== 'undefined' ? Company.showWorkspaceSwitchModal() : null" style="display:flex;align-items:center;gap:8px;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:7px 14px;font-size:12.5px;font-weight:600;color:var(--text);cursor:pointer;white-space:nowrap;flex-shrink:0;box-shadow:0 1px 2px rgba(0,0,0,0.02)" title="Switch Subsidiary / Office">
        <i class="fa fa-building" style="color:#2563eb;font-size:13px"></i>
        <span>${companyName}</span>
        <i class="fa fa-chevron-down" style="font-size:9px;color:var(--text-3)"></i>
      </div>

      <!-- Right: Utility Controls & User Profile matching Reference Image -->
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
        <!-- Fullscreen Button -->
        <button class="topbar-btn" onclick="typeof Utils !== 'undefined' && Utils.toggleFullScreen ? Utils.toggleFullScreen() : (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())" title="Toggle Fullscreen" style="width:34px;height:34px">
          <i class="fa fa-expand"></i>
        </button>

        <!-- Theme Toggle -->
        <button class="theme-toggle-btn topbar-btn" onclick="App.toggleTheme()" title="${isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}" style="width:34px;height:34px">
          <i class="fa ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
        </button>

        <!-- Notifications -->
        <div style="position:relative">
          <button class="topbar-btn" id="notif-btn" onclick="App.toggleNotifications()" title="Notifications" style="position:relative;width:34px;height:34px">
            <i class="fa fa-bell"></i>
            <span style="position:absolute;top:2px;right:2px;background:#ef4444;color:#ffffff;border-radius:50%;font-size:9.5px;font-weight:800;width:15px;height:15px;display:flex;align-items:center;justify-content:center;line-height:1">3</span>
          </button>
          <div class="notif-dropdown" id="notif-dropdown" style="width:360px">
            <div class="notif-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border)">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-weight:700">Notifications</span>
                <span class="badge badge-primary" id="notif-count" style="margin-left:2px">3</span>
              </div>
              <button class="btn btn-ghost btn-xs" style="font-size:10.5px;padding:2px 6px;color:var(--text-3)" onclick="App.markAllNotificationsRead()">Mark all read</button>
            </div>
            <div id="notif-list" style="max-height:360px;overflow-y:auto"></div>
          </div>
        </div>

        <!-- Settings Cog -->
        <button class="topbar-btn" onclick="App.navigate('settings')" title="System Settings" style="width:34px;height:34px">
          <i class="fa fa-gear"></i>
        </button>

        <!-- User Profile Pill on Far Right -->
        <div class="topbar-user-pill" onclick="App.toggleUserDropdown(event)" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:4px 8px;border-radius:8px;position:relative" title="Account Menu">
          <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:${typeof Utils!=='undefined'?Utils.avatarColor(emp.id||1):'#2563eb'};flex-shrink:0;border:1.5px solid var(--border,#e2e8f0)">
            ${emp.photo ? '<img src="'+emp.photo+'" style="width:100%;height:100%;object-fit:cover" alt="'+fullName+'">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700">'+curInitials+'</div>'}
          </div>
          <div style="text-align:left;line-height:1.2">
            <div style="font-size:13px;font-weight:800;color:var(--text);white-space:nowrap">${fullName}</div>
            <div style="font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:4px;white-space:nowrap">${curRoleLabel} <i class="fa fa-chevron-down" style="font-size:8px"></i></div>
          </div>

          <!-- User Menu Dropdown Popover -->
          <div id="user-menu-dropdown" class="user-menu-popover" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.12);min-width:180px;z-index:1050;padding:6px 0">
            <a href="javascript:void(0)" onclick="App.navigate('profile')" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:var(--text);font-size:12.5px;font-weight:600;text-decoration:none"><i class="fa fa-circle-user" style="color:var(--primary)"></i> My Profile</a>
            <a href="javascript:void(0)" onclick="App.showChangePasswordModal()" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:var(--text);font-size:12.5px;font-weight:600;text-decoration:none"><i class="fa fa-key" style="color:#0284c7"></i> Change Password</a>
            <a href="javascript:void(0)" onclick="typeof HRMTour !== 'undefined' ? HRMTour.start(true) : null" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:var(--text);font-size:12.5px;font-weight:600;text-decoration:none"><i class="fa fa-wand-magic-sparkles" style="color:#a855f7"></i> Product Tour</a>
            <a href="javascript:void(0)" onclick="App.toggleTableDensity()" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:var(--text);font-size:12.5px;font-weight:600;text-decoration:none"><i class="fa fa-table-cells" style="color:#f59e0b"></i> Table Density</a>
            <div style="height:1px;background:var(--border,#e2e8f0);margin:4px 0"></div>
            <a href="javascript:void(0)" onclick="App.logout()" style="display:flex;align-items:center;gap:8px;padding:8px 16px;color:#dc2626;font-size:12.5px;font-weight:700;text-decoration:none"><i class="fa fa-right-from-bracket"></i> Logout</a>
          </div>
        </div>
      </div>
    `;

    this.refreshNotifications();
    if (typeof Chat !== 'undefined' && Chat.updateTopbarBadge) {
      Chat.updateTopbarBadge();
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notif-btn')) {
        document.getElementById('notif-dropdown')?.classList.remove('open');
      }
      if (!e.target.closest('#topbar-search-wrap')) {
        document.getElementById('search-dropdown')?.classList.remove('open');
      }
      if (!e.target.closest('.nav-pillar-dropdown')) {
        App.closeNavPillars();
      }
    });
  },

  showChangePasswordModal() {
    const id = 'change-password-modal';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'modal-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="modal" style="max-width:440px;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 20px 48px rgba(0,0,0,0.3)">
        <div class="modal-header" style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface)">
          <h3 style="margin:0;font-size:15px;display:flex;align-items:center;gap:8px;color:var(--text);font-weight:700">
            <i class="fa fa-key" style="color:var(--primary)"></i> Change Account Password
          </h3>
          <button class="modal-close" onclick="Modal.close('${id}')" style="background:transparent;border:none;color:var(--text-3);font-size:16px;cursor:pointer"><i class="fa fa-times"></i></button>
        </div>
        <div class="modal-body" style="padding:18px">
          <form id="change-pwd-form" onsubmit="App.handleChangePasswordSubmit(event, '${id}')">
            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-2)">Current Password</label>
              <div style="position:relative">
                <input type="password" id="cp-current" required class="input" style="width:100%;padding-right:36px;height:38px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);padding-left:10px" placeholder="Enter current password">
                <button type="button" onclick="App.togglePasswordVisibility('cp-current')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-3);cursor:pointer">
                  <i class="fa fa-eye"></i>
                </button>
              </div>
            </div>
            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-2)">New Password</label>
              <div style="position:relative">
                <input type="password" id="cp-new" required minlength="4" class="input" style="width:100%;padding-right:36px;height:38px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);padding-left:10px" placeholder="Enter new password (min. 4 characters)">
                <button type="button" onclick="App.togglePasswordVisibility('cp-new')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-3);cursor:pointer">
                  <i class="fa fa-eye"></i>
                </button>
              </div>
            </div>
            <div style="margin-bottom:18px">
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-2)">Confirm New Password</label>
              <input type="password" id="cp-confirm" required minlength="4" class="input" style="width:100%;height:38px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);padding-left:10px" placeholder="Confirm new password">
            </div>
            <div id="cp-error" style="display:none;color:var(--danger);font-size:12px;margin-bottom:12px;padding:8px 10px;background:rgba(239,68,68,0.1);border-radius:6px"></div>
            <div style="display:flex;justify-content:flex-end;gap:10px">
              <button type="button" class="btn btn-ghost" onclick="Modal.close('${id}')">Cancel</button>
              <button type="submit" class="btn btn-primary" id="cp-submit-btn">Update Password</button>
            </div>
          </form>
        </div>
      </div>
    `;
    Modal.open(id);
    el.onclick = (e) => { if (e.target === el) Modal.close(id); };
  },

  async handleChangePasswordSubmit(e, modalId) {
    e.preventDefault();
    const current = document.getElementById('cp-current')?.value;
    const newPass = document.getElementById('cp-new')?.value;
    const confirm = document.getElementById('cp-confirm')?.value;
    const errEl = document.getElementById('cp-error');
    const btn = document.getElementById('cp-submit-btn');

    if (newPass !== confirm) {
      if (errEl) { errEl.textContent = 'New password and confirm password do not match.'; errEl.style.display = 'block'; }
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

    try {
      if (typeof API !== 'undefined' && API.changePassword) {
        await API.changePassword(current, newPass);
      }
      const users = DB.get('users') || [];
      const u = users.find(x => x.username === Auth.user?.username);
      if (u) {
        u.password = newPass;
        DB.set('users', users);
      }
      Modal.close(modalId);
      Toast.show('Password changed successfully!', 'success');
    } catch (err) {
      if (errEl) { errEl.textContent = err.message || 'Failed to update password. Please check your current password.'; errEl.style.display = 'block'; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Update Password'; }
    }
  },

  togglePasswordVisibility(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
  },

  togglePersonaDropdown(e) {
    if (e) e.stopPropagation();
    const dd = document.getElementById('persona-dropdown');
    if (!dd) return;
    const isHidden = dd.style.display === 'none' || !dd.style.display;
    document.querySelectorAll('.accent-picker-dropdown, .notif-dropdown').forEach(el => el.style.display = 'none');
    dd.style.display = isHidden ? 'block' : 'none';
  },

  refreshNotifications() {
    const leaves = DB.get('leave_requests') || [];
    const reviews = DB.get('performance_reviews') || [];
    const logs = (DB.get('audit_logs') || []).slice(0, 5);
    const role = Auth.role;
    const myEmpId = Auth.employee?.id;

    const notifs = [];

    // 1. Targeted Direct Notifications from Senior Roles (CNIC expiries, HR letters, policy mandates)
    const allUserNotifs = DB.get('user_notifications') || [];
    const targetedNotifs = allUserNotifs.filter(n => {
      if (n.recipientEmpId && parseInt(n.recipientEmpId) === parseInt(myEmpId)) return true;
      if (!n.recipientEmpId && n.recipientRole === role) return true;
      return false;
    });

    targetedNotifs.forEach(n => {
      let color = 'var(--primary)';
      let icon = 'fa-bell';
      if (n.type === 'doc_expiry') { color = 'var(--danger)'; icon = 'fa-id-card-clip'; }
      else if (n.type === 'hr_letter') { color = 'var(--info)'; icon = 'fa-file-signature'; }
      else if (n.type === 'policy_mandate') { color = 'var(--warning)'; icon = 'fa-signature'; }
      else if (n.priority === 'urgent') { color = 'var(--danger)'; icon = 'fa-triangle-exclamation'; }

      notifs.push({
        id: n.id,
        isUserNotif: true,
        unread: !n.read,
        color,
        icon,
        text: n.title,
        sub: n.message,
        actionUrl: n.actionUrl,
        subView: n.subView,
        actionLabel: n.actionLabel,
        time: n.createdAt ? (Utils.formatDate(n.createdAt.slice(0, 10)) + ' ' + new Date(n.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })) : 'Recent',
        sender: n.senderName
      });
    });

    // 1b. Direct Automatic Identity & CNIC Expiry Alerts for Logged-In Employee
    if (role === 'employee' && myEmpId) {
      const myDocs = (DB.get('document_expiries') || []).filter(d => parseInt(d.employeeId) === parseInt(myEmpId));
      const today = new Date();
      myDocs.forEach(d => {
        const exp = new Date(d.expiryDate);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30 || d.status === 'expired' || d.status === 'urgent') {
          const alreadyNotified = notifs.some(n => n.text && n.text.includes(d.docType));
          if (!alreadyNotified) {
            const daysText = diffDays < 0 ? `EXPIRED ${Math.abs(diffDays)} day(s) ago!` : `expires in ${diffDays} day(s) on ${Utils.formatDate(d.expiryDate)}`;
            notifs.unshift({
              id: 'auto_exp_' + d.id,
              isUserNotif: true,
              unread: true,
              color: 'var(--danger)',
              icon: 'fa-id-card-clip',
              text: `⚠️ Action Required: Renew ${d.docType} (${d.docNumber})`,
              sub: `Your ${d.docType} ${daysText}. Please renew through NADRA and upload your renewed attested smart copy to your e-DMS Vault.`,
              actionUrl: 'employees',
              subView: 'edms',
              actionLabel: 'Upload Renewed ' + d.docType,
              time: 'Urgent compliance',
              sender: 'HR Compliance Directorate'
            });
          }
        }
      });
    }

    // 2. Pending leaves for approvers
    if (role === 'superadmin' || role === 'hr_manager' || role === 'dept_manager') {
      const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
      const mgrPending = leaves.filter(l => l.status === 'manager_approved').length;
      if (pendingLeaves > 0) notifs.push({ color: 'var(--warning)', text: `${pendingLeaves} leave request${pendingLeaves > 1 ? 's' : ''} pending approval`, time: 'Action required', icon: 'fa-calendar-xmark' });
      if (mgrPending > 0) notifs.push({ color: 'var(--info)', text: `${mgrPending} leave${mgrPending > 1 ? 's' : ''} awaiting HR approval`, time: 'Action required', icon: 'fa-user-check' });
    }

    // 3. Employee-specific leave status
    if (role === 'employee' && Auth.employee) {
      const myLeaves = leaves.filter(l => l.employeeId === Auth.employee.id && (l.status === 'approved' || l.status === 'rejected'));
      myLeaves.slice(0, 2).forEach(l => {
        notifs.push({ color: l.status === 'approved' ? 'var(--success)' : 'var(--danger)', text: `Your leave request was ${l.status}`, time: Utils.formatDate(l.approvedOn || l.appliedOn), icon: l.status === 'approved' ? 'fa-circle-check' : 'fa-circle-xmark' });
      });
    }

    // 4. Pending reviews
    if (role === 'superadmin' || role === 'hr_manager') {
      const pendingRev = reviews.filter(r => r.status === 'pending').length;
      if (pendingRev > 0) notifs.push({ color: 'var(--accent)', text: `${pendingRev} performance review${pendingRev > 1 ? 's' : ''} pending`, time: 'Action required', icon: 'fa-chart-line' });
    }

    // 5. Pending expense claims
    const expClaims = DB.get('expense_claims') || [];
    if (role === 'dept_manager') {
      const pClaims = expClaims.filter(c => c.status === 'pending_manager' && c.employeeId !== Auth.employee?.id).length;
      if (pClaims > 0) notifs.push({ color: 'var(--warning)', text: `${pClaims} expense claim${pClaims > 1 ? 's' : ''} awaiting endorsement`, time: 'Action required', icon: 'fa-receipt' });
    } else if (role === 'superadmin' || role === 'hr_manager') {
      const fClaims = expClaims.filter(c => c.status === 'pending_finance').length;
      if (fClaims > 0) notifs.push({ color: 'var(--info)', text: `${fClaims} expense claim${fClaims > 1 ? 's' : ''} awaiting finance authorization`, time: 'Action required', icon: 'fa-stamp' });
    }

    // 6. Urgent helpdesk tickets
    const tickets = DB.get('helpdesk_tickets') || [];
    if (role === 'superadmin' || role === 'hr_manager') {
      const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length;
      if (urgentTickets > 0) notifs.push({ color: 'var(--danger)', text: `${urgentTickets} urgent ticket${urgentTickets > 1 ? 's' : ''} requiring immediate response`, time: 'SLA priority', icon: 'fa-headset' });
    }

    // 7. Upcoming birthdays
    const today = Utils.today();
    const todayMMDD = today.slice(5);
    const bdays = (DB.get('employees') || []).filter(e => e.dob?.slice(5) === todayMMDD && e.status === 'active');
    if (bdays.length > 0) notifs.push({ color: 'var(--success)', text: `🎂 ${bdays.map(e => e.firstName).join(', ')} birthday today!`, time: 'Today', icon: 'fa-cake-candles' });

    // 8. Recent audit log
    if (logs.length > 0) {
      const l = logs[0];
      notifs.push({ color: 'var(--primary)', text: l.details, time: new Date(l.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }), icon: 'fa-scroll' });
    }

    const unreadUserCount = targetedNotifs.filter(n => !n.read).length;
    const totalCount = notifs.length;
    const badge = document.getElementById('notif-badge-dot');
    const pill = document.getElementById('notif-badge-pill');
    const countEl = document.getElementById('notif-count');
    const listEl = document.getElementById('notif-list');

    if (badge) badge.style.display = (unreadUserCount > 0 || totalCount > 0) ? 'block' : 'none';
    if (pill) {
      if (unreadUserCount > 0) {
        pill.style.display = 'inline-block';
        pill.textContent = unreadUserCount;
      } else {
        pill.style.display = 'none';
      }
    }
    if (countEl) countEl.textContent = unreadUserCount > 0 ? unreadUserCount : totalCount;
    if (listEl) {
      listEl.innerHTML = totalCount === 0
        ? `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px"><i class="fa fa-bell-slash" style="font-size:26px;margin-bottom:8px;display:block;opacity:0.6"></i>No new notifications</div>`
        : notifs.map(n => {
            if (n.isUserNotif) {
              return `
                <div class="notif-item ${n.unread ? 'notif-unread' : ''}" style="${n.unread ? 'background:rgba(99,102,241,0.06);border-left:3px solid ' + n.color + ';' : 'border-bottom:1px solid var(--border);'}padding:12px 14px;cursor:pointer;transition:background 0.2s" onclick="App.handleNotificationClick('${n.id}', '${n.actionUrl}', '${n.subView || ''}')">
                  <div style="display:flex;align-items:flex-start;gap:10px;width:100%">
                    <div class="notif-dot" style="background:${n.color};margin-top:4px"></div>
                    <div style="flex:1">
                      <div style="display:flex;justify-content:space-between;align-items:center">
                        <div class="notif-text" style="font-weight:700;font-size:12.5px;color:var(--text)">
                          <i class="fa ${n.icon}" style="color:${n.color};margin-right:4px"></i>${n.text}
                        </div>
                        ${n.unread ? `<span class="badge badge-danger" style="font-size:9px;padding:1px 5px;font-weight:700">NEW</span>` : ''}
                      </div>
                      <div style="font-size:11.5px;color:var(--text-2);margin-top:3px;line-height:1.4">${n.sub || ''}</div>
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                        <span class="notif-time" style="font-size:10px;color:var(--text-3)">${n.sender ? n.sender + ' • ' : ''}${n.time}</span>
                        ${n.actionLabel ? `<span style="font-size:10.5px;font-weight:700;color:var(--primary)"><i class="fa fa-arrow-up-right-from-square"></i> ${n.actionLabel}</span>` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }

            return `
              <div class="notif-item" style="padding:10px 14px;border-bottom:1px solid var(--border)">
                <div class="notif-dot" style="background:${n.color}"></div>
                <div>
                  <div class="notif-text">${n.text}</div>
                  <div class="notif-time">${n.time}</div>
                </div>
              </div>
            `;
          }).join('');
    }
  },

  handleNotificationClick(notifId, module, subView) {
    if (notifId && !String(notifId).startsWith('auto_')) {
      const notifs = DB.get('user_notifications') || [];
      const n = notifs.find(x => x.id === parseInt(notifId) || String(x.id) === String(notifId));
      if (n) {
        n.read = true;
        DB.set('user_notifications', notifs);
      }
      if (typeof API !== 'undefined' && API.markNotificationRead) {
        API.markNotificationRead(notifId).catch(() => {});
      }
    }
    this.refreshNotifications();
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) dropdown.classList.remove('open');
    if (module) {
      if (module === 'employees' && subView && typeof Employees !== 'undefined') {
        Employees.currentView = subView;
      }
      this.navigate(module, subView);
      if (subView) {
        setTimeout(() => {
          if (module === 'employees' && typeof Employees !== 'undefined' && Employees.switchView) {
            Employees.switchView(subView);
          } else if (module === 'events' && typeof Events !== 'undefined' && Events.switchView) {
            Events.switchView(subView);
          }
        }, 150);
      }
    }
  },

  markAllNotificationsRead() {
    const myEmpId = Auth.employee?.id;
    const myRole = Auth.role;
    const notifs = DB.get('user_notifications') || [];
    notifs.forEach(n => {
      if ((n.recipientEmpId && parseInt(n.recipientEmpId) === parseInt(myEmpId)) || (!n.recipientEmpId && n.recipientRole === myRole)) {
        n.read = true;
      }
    });
    DB.set('user_notifications', notifs);
    if (typeof API !== 'undefined' && API.markAllNotificationsRead) {
      API.markAllNotificationsRead({ recipientEmpId: myEmpId, recipientRole: myRole }).catch(() => {});
    }
    this.refreshNotifications();
    Toast.show('All notifications marked as read', 'info');
  },

  onDataSync(changedTables = []) {
    this.refreshNotifications?.();

    // Map table updates to relevant module views
    const moduleTableMap = {
      dashboard: ['employees', 'attendance', 'leave_requests', 'events', 'announcements', 'users', 'applications', 'job_requisitions', 'recruitment', 'settings'],
      employees: ['employees', 'departments', 'designations', 'branches', 'documents', 'document_expiries', 'users'],
      attendance: ['attendance', 'attendance_corrections', 'shifts', 'overtime_tokens'],
      leaves: ['leave_requests', 'leave_balances', 'leave_types', 'employees'],
      payroll: ['salary', 'allowances', 'deductions', 'loans', 'employee_increments', 'settings'],
      performance: ['performance_reviews', 'kpis', 'goals'],
      recruitment: ['recruitment', 'applications', 'interviews', 'job_requisitions', 'offer_letters', 'onboardings'],
      assets: ['assets', 'asset_assignments'],
      expenses: ['expense_claims', 'settings'],
      helpdesk: ['helpdesk_tickets'],
      events: ['events', 'announcements'],
      administration: ['users', 'roles', 'permissions', 'audit_logs'],
      settings: ['settings'],
      settlement: ['settlements', 'employees', 'loans', 'assets', 'departments', 'designations'],
      companies: ['companies', 'employees', 'departments'],
      profile: ['employees', 'documents', 'emergency_contacts', 'users']
    };

    const current = this.currentModule;
    const shouldRefresh = changedTables.length === 0 || (current && moduleTableMap[current]?.some(t => changedTables.includes(t)));
    if (shouldRefresh && this.currentModule && document.getElementById('app')?.style.display !== 'none') {
      console.log(`[App] Auto-refreshing module "${this.currentModule}" due to remote sync (${changedTables.join(', ')})`);
      this.navigate(this.currentModule, null, false);
    }
  },

  navigate(module, subView, pushState = true) {
    if (!module || typeof module !== 'string' || !module.trim()) {
      module = 'dashboard';
    }

    // Role-based module access guards
    if (module === 'administration' && !['superadmin', 'hr_manager'].includes(Auth.role)) {
      Toast.show('403 Forbidden: Access to Administration is restricted.', 'error');
      if (this.currentModule && this.currentModule !== 'administration') return;
      module = 'dashboard';
    }

    if (module === 'companies' && Auth.role !== 'superadmin') {
      Toast.show('403 Forbidden: Access to Corporate Entities is restricted to Super Admin.', 'error');
      if (this.currentModule && this.currentModule !== 'companies') return;
      module = 'dashboard';
    }

    if (module === 'settings' && Auth.role !== 'superadmin') {
      Toast.show('403 Forbidden: System Settings is restricted to Super Admin.', 'error');
      if (this.currentModule && this.currentModule !== 'settings') return;
      module = 'dashboard';
    }

    if (module === 'recruitment' && !['superadmin', 'hr_manager', 'dept_manager'].includes(Auth.role)) {
      Toast.show('403 Forbidden: Recruitment & ATS is restricted to HR & Department Managers.', 'error');
      if (this.currentModule && this.currentModule !== 'recruitment') return;
      module = 'dashboard';
    }

    if (module === 'employees' && (Auth.role === 'employee' || Auth.role === 'onboarding')) {
      const staffAllowed = ['hr_letters', 'doc_expiry', 'edms', 'dependents_events', 'directory', 'orgchart'];
      const targetSub = subView || (typeof Employees !== 'undefined' ? Employees.currentView : null);
      if (targetSub && staffAllowed.includes(targetSub)) {
        if (typeof Employees !== 'undefined') Employees.currentView = targetSub;
        // Keep module = 'employees' to render employee-scoped views
      } else {
        // Regular employees accessing employees without an allowed subview default to profile
        setTimeout(() => Employees.renderProfile(Auth.employee?.id || 1, true), 50);
        module = 'profile';
      }
    }
    // Update active nav item & parent pillars (Two-tier navigation)
    const activeSidebarMod = (module === 'settings') ? 'administration' : module;
    const activePillarId = this.getPillarForModule(activeSidebarMod);

    // Update Row 1: Pillar tabs in #sidebar
    document.querySelectorAll('#sidebar .nav-tab-item').forEach(el => {
      const isPillarActive = el.dataset.pillar === activePillarId;
      el.classList.toggle('active', isPillarActive);
    });

    // Update Row 2: Persistent Sub-nav bar
    this.renderSubnavBar(activePillarId, activeSidebarMod);

    this.currentModule = module;

    // Push browser history state for seamless back/forward button support
    if (pushState && history.pushState) {
      history.pushState({ page: 'app', module, subView }, '', '#' + module);
    }

    const title = document.getElementById('topbar-title');
    const subtitle = document.getElementById('topbar-subtitle');
    const content = document.getElementById('page-content');

    const moduleLabels = {
      dashboard: 'Dashboard', employees: 'Employees', attendance: 'Attendance',
      leaves: 'Leave Management', payroll: 'Payroll', performance: 'Performance',
      recruitment: 'Recruitment', assets: 'Assets & Inventory',
      expenses: 'Expense Claims', helpdesk: 'Helpdesk & Grievance',
      events: 'Events & Announcements', reports: 'Reports',
      administration: 'Administration', settings: 'Settings', profile: 'My Profile',
      settlement: 'Exit & Settlements', companies: 'Corporate Entities & Holdings',
      chat: 'Team Chat & Instant Messaging'
    };

    const topbarEl = document.getElementById('topbar');
    const subnavEl = document.getElementById('subnav-bar');
    const sidebarEl = document.getElementById('sidebar');
    const bottomNavEl = document.getElementById('mobile-bottom-nav');
    const personaDockEl = document.querySelector('.header-persona-dock');

    if (module === 'chat') {
      document.body.classList.add('chat-workspace-active');
      if (topbarEl) topbarEl.style.display = 'none';
      if (subnavEl) subnavEl.style.display = 'none';
      if (sidebarEl) sidebarEl.style.display = 'none';
      if (bottomNavEl) bottomNavEl.style.display = 'none';
      if (personaDockEl) personaDockEl.style.display = 'none';
    } else {
      document.body.classList.remove('chat-workspace-active');
      if (topbarEl) topbarEl.style.display = '';
      if (subnavEl) subnavEl.style.display = 'none';
      if (sidebarEl) sidebarEl.style.display = '';
      if (bottomNavEl) bottomNavEl.style.display = '';
      if (personaDockEl) personaDockEl.style.display = '';
    }
    if (content && module !== 'chat') content.classList.remove('chat-fullscreen-page-content');
    if (title) title.textContent = moduleLabels[module] || module;
    if (subtitle) subtitle.textContent = `${new Date().toLocaleDateString('en-PK', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}`;
    this.updateBreadcrumbs(module, subView);
    this.updateMobileBottomNav(module);

    if (!content) return;

    // Close mobile sidebar if open
    this.closeMobileSidebar();

    // Ensure floating launchers never overlap the dedicated chat workspace
    const chatFloatingBtn = document.getElementById('chat-floating-launcher');
    const landingAgentBtn = document.getElementById('landing-agent-launcher');
    if (module === 'chat') {
      if (chatFloatingBtn) chatFloatingBtn.style.display = 'none';
      if (landingAgentBtn) landingAgentBtn.style.display = 'none';
      if (typeof Chat !== 'undefined' && Chat.closeDrawer) Chat.closeDrawer();
    } else {
      if (chatFloatingBtn) {
        chatFloatingBtn.style.display = 'none';
      }
    }

    if (module === 'dashboard') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
    } else {
      if (typeof Dashboard !== 'undefined') {
        if (Dashboard._punchClockTimer) {
          clearInterval(Dashboard._punchClockTimer);
          Dashboard._punchClockTimer = null;
        }
        if (typeof Dashboard.stopAutoSync === 'function') {
          Dashboard.stopAutoSync();
        }
      }
    }

    const doRender = () => {
      try {
        switch (module) {
          case 'dashboard':
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.setAttribute('data-theme', 'light');
            Dashboard.render();
            break;
          case 'chat':
            if (content) {
              content.classList.add('chat-fullscreen-page-content');
            }
            if (typeof Chat !== 'undefined') Chat.renderFullWorkspace();
            break;
          case 'employees':
            if (subView && typeof Employees !== 'undefined') {
              Employees.currentView = subView;
            }
            Employees.render();
            break;
          case 'attendance':
            Attendance.render();
            if (subView && typeof Attendance !== 'undefined' && Attendance.switchTab) {
              setTimeout(() => {
                if (subView === 'machine') Attendance.switchTab('machine');
                else if (subView === 'roster') Attendance.switchTab('shifts');
                else Attendance.switchTab('daily');
              }, 40);
            }
            break;
          case 'leaves':
            Leaves.render();
            if (subView && typeof Leaves !== 'undefined' && Leaves.switchTab) {
              setTimeout(() => {
                if (subView === 'calendar') Leaves.switchTab('holidays');
                else if (subView === 'balances') Leaves.switchTab('balances');
                else Leaves.switchTab('requests');
              }, 40);
            }
            break;
          case 'payroll':       Payroll.render(); break;
          case 'settlement':
            if (typeof Employees !== 'undefined') {
              Employees.currentView = 'settlement';
              Employees.render();
            } else if (typeof Settlement !== 'undefined') {
              Settlement.render();
            }
            break;
          case 'companies':
            if (typeof Company !== 'undefined') {
              Company.render();
            } else if (typeof Administration !== 'undefined') {
              Administration.currentSection = 'settings';
              Administration.render();
              setTimeout(() => { if (typeof Settings !== 'undefined') Settings.switchSection('corporate_entities'); }, 50);
            }
            break;
          case 'performance':
            Performance.render();
            if (subView && typeof Performance !== 'undefined' && Performance.switchTab) {
              setTimeout(() => Performance.switchTab(subView), 40);
            }
            break;
          case 'recruitment':
            Recruitment.render();
            if (subView && typeof Recruitment !== 'undefined' && Recruitment.switchTab) {
              setTimeout(() => Recruitment.switchTab(subView), 40);
            }
            break;
          case 'assets':        Assets.render(); break;
          case 'expenses':      Expenses.render(); break;
          case 'helpdesk':      Helpdesk.render(); break;
          case 'events':
            if (typeof Events !== 'undefined') {
              Events.render();
            } else if (typeof Reports !== 'undefined') {
              Reports.currentTab = 'events_calendar';
              Reports.render();
            }
            break;
          case 'reports':
            if (subView && typeof Reports !== 'undefined') {
              if (subView === 'tax') Reports.currentTab = 'tax_summary';
              else if (subView === 'bank') Reports.currentTab = 'bank_advice';
              else Reports.currentTab = 'workforce';
            }
            Reports.render();
            break;
          case 'administration':
            Administration.render();
            if (subView && typeof Administration !== 'undefined' && Administration.switchSection) {
              setTimeout(() => Administration.switchSection(subView), 40);
            }
            break;
          case 'settings':
            this.currentModule = 'administration';
            if (typeof Administration !== 'undefined') {
              Administration.currentSection = 'settings';
              Administration.render();
              if (subView && typeof Settings !== 'undefined' && Settings.switchSection) {
                setTimeout(() => Settings.switchSection(subView), 40);
              }
            } else if (typeof Settings !== 'undefined') {
              Settings.render();
              if (subView && Settings.switchSection) {
                setTimeout(() => Settings.switchSection(subView), 40);
              }
            }
            break;
          case 'profile':       Employees.renderProfile(Auth.employee?.id || 1, true); break;
          default:
            if (typeof Dashboard !== 'undefined' && Dashboard.render) {
              Dashboard.render();
            } else {
              content.innerHTML = '<div class="empty-state"><i class="fa fa-triangle-exclamation"></i><h3>Module Not Found</h3><p>Navigating to Dashboard...</p></div>';
            }
            break;
        }
      } catch(e) {
        console.error('Module rendering caught error:', e);
        if (typeof Dashboard !== 'undefined' && Dashboard.render && module !== 'dashboard') {
          Dashboard.render();
        } else {
          content.innerHTML = `<div class="empty-state"><i class="fa fa-triangle-exclamation"></i><h3>Dashboard Ready</h3><p>Reloading module view...</p></div>`;
          setTimeout(() => Dashboard.render(), 100);
        }
      }
    };

    // For dashboard, render immediately so there is never a blank white flash or delay
    if (module === 'dashboard') {
      doRender();
    } else {
      content.innerHTML = (typeof Utils !== 'undefined' && Utils.renderSkeleton)
        ? `<div class="animate-fade-in" style="padding:16px 0">${Utils.renderSkeleton('table')}</div>`
        : '<div class="loading-overlay"><div class="spinner"></div></div>';
      setTimeout(doRender, 30);
    }
  },

  logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    Auth.logout();
    // Push a 'landing' history entry first, THEN navigate to Sign In.
    // Result: Back button from Sign In page → Landing page.
    history.pushState({ page: 'landing' }, '', '#landing');
    this.showLogin(true);
    Toast.show('Logged out successfully. Please sign in again.', 'success');
  },

  updateMobileBottomNav(module) {
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;
    const items = nav.querySelectorAll('.mobile-nav-item');
    items.forEach(item => item.classList.remove('active'));

    if (module === 'dashboard') {
      const el = nav.querySelector('[data-nav="dashboard"]');
      if (el) el.classList.add('active');
    } else if (['employees', 'recruitment', 'profile'].includes(module)) {
      const el = nav.querySelector('[data-nav="employees"]');
      if (el) el.classList.add('active');
    } else if (module === 'chat') {
      const el = nav.querySelector('[data-nav="chat"]');
      if (el) el.classList.add('active');
    }
  },

  handleQuickClockIn(event) {
    if (event) event.stopPropagation();
    if (typeof Dashboard !== 'undefined' && typeof Dashboard.quickSelfPunch === 'function') {
      Dashboard.quickSelfPunch('in');
    } else {
      this.navigate('attendance');
    }
  },

  toggleNotifications() {
    this.refreshNotifications();
    document.getElementById('notif-dropdown')?.classList.toggle('open');
  },

  toggleTheme() {
    if (this.currentModule === 'dashboard') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
      if (typeof Toast !== 'undefined') Toast.show('Dashboard is designed exclusively for Light Mode.', 'info');
      return;
    }
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hrm_theme_mode', next);
    // Save setting
    const settings = DB.getObj('settings') || {};
    settings.theme = next;
    DB.set('settings', settings);
    // Update toggle button icon
    const btn = document.querySelector('.theme-toggle-btn');
    if (btn) {
      btn.innerHTML = `<i class="fa ${next === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
      btn.title = next === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
    if (typeof DB !== 'undefined' && DB.flushServerPush) {
      DB.flushServerPush();
    }
    if (typeof Settings !== 'undefined' && Settings.currentSection === 'appearance') {
      Settings.renderSection();
    }
  },

  toggleNavPosition() {
    const current = (document.body.classList.contains('nav-pos-top') || localStorage.getItem('hrm_nav_position') === 'top') ? 'top' : 'left';
    const next = current === 'top' ? 'left' : 'top';
    this.setNavPosition(next, true);
  },

  setNavPosition(pos, notify = false) {
    pos = pos || 'top';
    localStorage.setItem('hrm_nav_position', pos);

    // Persist to settings
    if (typeof DB !== 'undefined' && DB.getObj && DB.set) {
      const s = DB.getObj('settings') || {};
      s.sidebarPosition = pos;
      DB.set('settings', s);
      if (DB.flushServerPush) DB.flushServerPush();
    }

    const appEl = document.getElementById('app');

    if (pos === 'top') {
      document.body.classList.add('nav-pos-top');
      document.body.classList.remove('sidebar-pos-right');
      if (appEl) {
        appEl.classList.add('nav-pos-top');
        appEl.setAttribute('data-sidebar-pos', 'top');
        appEl.style.flexDirection = 'column';
      }
      if (notify && typeof Toast !== 'undefined') Toast.show('Navigation moved to Top Horizontal Navbar', 'info');
    } else if (pos === 'right') {
      document.body.classList.remove('nav-pos-top');
      document.body.classList.add('sidebar-pos-right');
      if (appEl) {
        appEl.classList.remove('nav-pos-top');
        appEl.setAttribute('data-sidebar-pos', 'right');
        appEl.style.flexDirection = '';
      }
      if (notify && typeof Toast !== 'undefined') Toast.show('Navigation docked to Right Sidebar', 'info');
    } else {
      document.body.classList.remove('nav-pos-top');
      document.body.classList.remove('sidebar-pos-right');
      if (appEl) {
        appEl.classList.remove('nav-pos-top');
        appEl.setAttribute('data-sidebar-pos', 'left');
        appEl.style.flexDirection = '';
      }
      if (notify && typeof Toast !== 'undefined') Toast.show('Navigation docked to Left Sidebar', 'info');
    }

    // Synchronize Topbar layout button icon & title
    const btn = document.getElementById('nav-layout-toggle-btn');
    if (btn) {
      btn.innerHTML = `<i class="fa ${pos === 'top' ? 'fa-table-columns' : 'fa-bars-progress'}"></i>`;
      btn.title = pos === 'top' ? 'Switch to Left Sidebar' : 'Move Navigation to Top';
    }

    // Synchronize Settings dropdown if open
    const sel = document.getElementById('s-sidebar-pos');
    if (sel) sel.value = pos;
  },

  openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      overlay.onclick = () => App.closeMobileSidebar();
      document.body.appendChild(overlay);
    }
    sidebar?.classList.add('mobile-open');
    overlay?.classList.add('active');
    document.body.classList.add('mobile-nav-open');
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.remove('mobile-open');
    overlay?.classList.remove('active');
    document.body.classList.remove('mobile-nav-open');
  },

  setupNavScroll() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav || nav._wheelAttached) return;
    nav._wheelAttached = true;
    nav.addEventListener('wheel', (e) => {
      const isTop = document.body.classList.contains('nav-pos-top') || localStorage.getItem('hrm_nav_position') === 'top';
      if (isTop && window.innerWidth > 900) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          nav.scrollLeft += (e.deltaY * 1.5);
        }
      }
    }, { passive: false });
  },

  scrollNav(direction) {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    const amount = direction === 'left' ? -260 : 260;
    nav.scrollBy({ left: amount, behavior: 'smooth' });
  },

  handleGlobalSearch(val) {
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;
    if (!val || val.length < 1) {
      dropdown.classList.remove('open');
      return;
    }
    const q = val.toLowerCase();
    // Scope search results by role
    let allEmps = DB.get('employees');
    if (Auth.role === 'dept_manager') {
      const myId = Auth.employee?.id;
      allEmps = allEmps.filter(e => e.managerId === myId || e.reportingTo === myId || e.id === myId);
    } else if (Auth.role === 'employee') {
      const myId = Auth.employee?.id;
      allEmps = allEmps.filter(e => e.id === myId);
    }
    const isHROrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const emps = allEmps.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.empNo.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      ((isHROrAdmin || e.id === Auth.employee?.id) && (e.cnic||'').includes(q)) ||
      Utils.getDeptName(e.departmentId).toLowerCase().includes(q)
    ).slice(0, 6);

    if (emps.length === 0) {
      dropdown.innerHTML = `<div class="search-result-empty"><i class="fa fa-search" style="font-size:20px;margin-bottom:8px;display:block"></i>No results for "${val}"</div>`;
    } else {
      dropdown.innerHTML = `
        <div class="search-result-section">Employees (${emps.length})</div>
        ${emps.map(e => `
          <div class="search-result-item" onclick="App.searchNavigate(${e.id})">
            <div class="sri-avatar" style="background:${Utils.avatarColor(e.id)};overflow:hidden">${e.photo ? `<img src="${e.photo}" style="width:100%;height:100%;object-fit:cover" alt="${e.fullName}">` : Utils.avatarInitials(e.fullName)}</div>
            <div>
              <div class="sri-name">${e.fullName}</div>
              <div class="sri-meta">${e.empNo} • ${Utils.getDesigName(e.designationId)} • ${Utils.statusBadge(e.status)}</div>
            </div>
          </div>
        `).join('')}
      `;
    }
    dropdown.classList.add('open');
  },

  showSearchDropdown() {
    const val = document.getElementById('global-search')?.value || '';
    if (val.length > 0) this.handleGlobalSearch(val);
  },

  searchNavigate(empId) {
    document.getElementById('search-dropdown')?.classList.remove('open');
    document.getElementById('global-search').value = '';
    const isHROrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    if (isHROrAdmin || Auth.employee?.id === empId) {
      Employees.renderProfile(empId);
    } else {
      App.navigate('employees');
    }
    // Update topbar
    const title = document.getElementById('topbar-title');
    if (title) title.textContent = 'Employees';
    // Mark employees nav active
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.module === 'employees');
    });
    this.currentModule = 'employees';
  },

  keySequence: '',
  keySequenceTimer: null,

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const paletteOverlay = document.getElementById('cmd-palette-overlay');
      const isPaletteOpen = paletteOverlay && paletteOverlay.classList.contains('open');
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;

      if (isPaletteOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.commandPaletteItems && this.commandPaletteItems.length > 0) {
            this.commandPaletteIndex = (this.commandPaletteIndex + 1) % this.commandPaletteItems.length;
            this.updateCommandPaletteSelection();
          }
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.commandPaletteItems && this.commandPaletteItems.length > 0) {
            this.commandPaletteIndex = (this.commandPaletteIndex - 1 + this.commandPaletteItems.length) % this.commandPaletteItems.length;
            this.updateCommandPaletteSelection();
          }
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          this.triggerCommandByIndex(this.commandPaletteIndex);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeCommandPalette();
          return;
        }
      }

      // Hotkey: '?' or 'Shift + /' → open shortcuts cheatsheet
      if (!isInputActive && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        this.showShortcutsModal();
        return;
      }

      // Hotkey: 'T' → toggle dark / light theme
      if (!isInputActive && (e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.toggleTheme();
        return;
      }

      // Hotkey: 'D' → toggle table density
      if (!isInputActive && (e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.toggleTableDensity();
        return;
      }

      // Two-key chord navigation (e.g. 'G' then 'D')
      if (!isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'g') {
          this.keySequence = 'g';
          clearTimeout(this.keySequenceTimer);
          this.keySequenceTimer = setTimeout(() => { this.keySequence = ''; }, 1200);
          return;
        } else if (this.keySequence === 'g') {
          this.keySequence = '';
          clearTimeout(this.keySequenceTimer);
          const navMap = {
            'd': 'dashboard',
            'e': 'employees',
            'a': 'attendance',
            'l': 'leaves',
            'p': 'payroll',
            'r': 'recruitment',
            'c': 'chat',
            'h': 'helpdesk',
            's': 'settings'
          };
          if (navMap[k]) {
            e.preventDefault();
            this.navigate(navMap[k]);
            Toast.show(`Navigated to ${navMap[k].toUpperCase()} (Hotkey)`, 'info');
            return;
          }
        }
      }

      // Ctrl+K or Cmd+K → open Spotlight Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
        return;
      }
      // Ctrl+H or Cmd+H → toggle history drawer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        App.toggleHistoryDrawer();
      }
      // Ctrl+M or Cmd+M → toggle team collaboration / chat drawer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (typeof Chat !== 'undefined' && Chat.toggleDrawer) {
          Chat.toggleDrawer();
        }
      }
      // Escape → close all open modals / search / history / chat / palette / inspector / batch dock
      if (e.key === 'Escape') {
        Modal.closeAll();
        App.closeHistoryDrawer();
        App.closeCommandPalette();
        App.closeInspectDrawer();
        App.clearBatchSelection();
        document.getElementById('accent-picker-dropdown')?.classList.remove('open');
        if (typeof Chat !== 'undefined' && Chat.closeDrawer) {
          Chat.closeDrawer();
        }
        document.getElementById('search-dropdown')?.classList.remove('open');
        document.getElementById('notif-dropdown')?.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#accent-btn') && !e.target.closest('#accent-picker-dropdown')) {
        document.getElementById('accent-picker-dropdown')?.classList.remove('open');
      }
    });
  },

  // ═══════════════════════════════════════════════
  // MODERN UI SUITE: BREADCRUMBS, DENSITY & ACCENTS
  // ═══════════════════════════════════════════════
  updateBreadcrumbs(module, subView) {
    const title = document.getElementById('topbar-title');
    const crumbActive = document.getElementById('topbar-crumb-active');
    const moduleLabels = {
      dashboard: 'Dashboard', employees: 'Employees', attendance: 'Attendance',
      leaves: 'Leave Management', payroll: 'Payroll', performance: 'Performance',
      recruitment: 'Recruitment & ATS', assets: 'Assets & Inventory',
      expenses: 'Expense Claims', helpdesk: 'Helpdesk & Grievance',
      events: 'Events & Announcements', reports: 'Executive Reports',
      administration: 'Administration', settings: 'Settings', profile: 'My Profile',
      settlement: 'Exit & Settlements', companies: 'Corporate Entities',
      chat: 'Team Chat'
    };
    const modLabel = moduleLabels[module] || (module ? module.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Dashboard');
    if (title) title.textContent = modLabel;
    if (crumbActive) {
      if (subView) {
        crumbActive.textContent = `${modLabel} › ${subView.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
      } else {
        crumbActive.textContent = modLabel;
      }
    }
  },

  toggleTableDensity() {
    const current = document.body.getAttribute('data-table-density') || 'comfortable';
    const next = current === 'compact' ? 'comfortable' : 'compact';
    document.body.setAttribute('data-table-density', next);
    document.documentElement.setAttribute('data-table-density', next);
    if (next === 'compact') {
      document.body.classList.add('compact-mode');
      document.documentElement.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
      document.documentElement.classList.remove('compact-mode');
    }
    localStorage.setItem('hrm_table_density', next);
    const btn = document.getElementById('density-toggle-btn');
    if (btn) {
      btn.innerHTML = `<i class="fa ${next === 'compact' ? 'fa-compress' : 'fa-expand'}"></i>`;
      btn.title = `Table Row Density: ${next === 'compact' ? 'Compact (Click for Spacious)' : 'Spacious (Click for Compact)'}`;
    }
    Toast.show(`Table Density: ${next === 'compact' ? 'Compact View (Higher row density)' : 'Comfortable View (Spacious spacing)'}`, 'info');
  },

  toggleAccentPicker(e) {
    if (e) e.stopPropagation();
    const drop = document.getElementById('accent-picker-dropdown');
    drop?.classList.toggle('open');
  },

  setAccentColor(accent) {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('hrm_accent_color', accent);
    const drop = document.getElementById('accent-picker-dropdown');
    drop?.classList.remove('open');
    const swatch = document.querySelector('#accent-btn .accent-swatch');
    if (swatch) {
      const colors = { blue: '#2563eb', emerald: '#059669', violet: '#7c3aed', rose: '#e11d48', amber: '#d97706' };
      swatch.style.background = colors[accent] || '#2563eb';
    }
    Toast.show(`Brand Accent theme set to ${accent.toUpperCase()}`, 'success');
  },

  // ═══════════════════════════════════════════════
  // SPOTLIGHT COMMAND PALETTE ENGINE (CTRL+K)
  // ═══════════════════════════════════════════════
  commandPaletteFilter: 'all',
  commandPaletteItems: [],
  commandPaletteIndex: 0,

  openCommandPalette() {
    const overlay = document.getElementById('cmd-palette-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.classList.add('open');
    this.commandPaletteFilter = 'all';
    this.commandPaletteIndex = 0;
    const input = document.getElementById('cmd-palette-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 60);
    }
    document.querySelectorAll('.cmd-tag').forEach(tag => {
      tag.classList.toggle('active', tag.dataset.filter === 'all');
    });
    this.filterCommandPalette('');
  },

  closeCommandPalette(e) {
    if (e && e.target && e.target.closest && e.target.closest('.cmd-palette-box')) return;
    const overlay = document.getElementById('cmd-palette-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.style.display = 'none';
    }
  },

  setCommandPaletteFilter(filter) {
    this.commandPaletteFilter = filter;
    document.querySelectorAll('.cmd-tag').forEach(tag => {
      tag.classList.toggle('active', tag.dataset.filter === filter);
    });
    const val = document.getElementById('cmd-palette-input')?.value || '';
    this.filterCommandPalette(val);
  },

  getAvailableCommandActions() {
    const role = Auth.role || 'employee';
    const isHROrAdmin = role === 'superadmin' || role === 'hr_manager';
    const isDeptManager = role === 'dept_manager';
    const actions = [
      { id: 'act_clock', title: 'Clock In / Clock Out', sub: 'Record biometric attendance punch', icon: 'fa-fingerprint', badge: 'Attendance' },
      { id: 'act_leave', title: 'Apply for Leave', sub: 'Submit annual, sick, or casual leave request', icon: 'fa-calendar-plus', badge: 'Leaves' },
      { id: 'act_chat', title: 'Open Team Chat', sub: 'Instant collaboration and messaging', icon: 'fa-comments', badge: 'Chat' },
      { id: 'act_history', title: 'Activity Audit Log', sub: 'Review system activity history drawer', icon: 'fa-clock-rotate-left', badge: 'Audit' },
      { id: 'act_theme', title: 'Toggle Light / Dark Mode', sub: 'Switch interface contrast theme', icon: 'fa-circle-half-stroke', badge: 'Theme' },
      { id: 'act_density', title: 'Toggle Compact Table Density', sub: 'Switch table row height spacing', icon: 'fa-compress', badge: 'Layout' }
    ];

    if (isHROrAdmin) {
      actions.unshift(
        { id: 'act_add_emp', title: 'Add New Employee', sub: 'Register candidate into directory', icon: 'fa-user-plus', badge: 'Employees' },
        { id: 'act_scn', title: 'Issue Statutory Show-Cause Notice', sub: 'Initiate formal disciplinary inquiry with 7-day mandate', icon: 'fa-scale-balanced', badge: 'Discipline' },
        { id: 'act_payroll', title: 'Run Monthly Payroll', sub: 'Process salary calculations and tax withholding', icon: 'fa-money-bill-wave', badge: 'Payroll' },
        { id: 'act_shift_roster', title: 'Shift Scheduling & Swaps', sub: 'Manage departmental shift roster matrix', icon: 'fa-calendar-days', badge: 'Attendance' }
      );
    } else if (isDeptManager) {
      actions.unshift(
        { id: 'act_shift_roster', title: 'Team Shift Roster & Swaps', sub: 'Review and approve peer shift swaps', icon: 'fa-calendar-days', badge: 'Attendance' },
        { id: 'act_appraisal', title: 'Conduct Performance Reviews', sub: 'Evaluate subordinate team members', icon: 'fa-chart-line', badge: 'Performance' }
      );
    }
    return actions;
  },

  getAvailableCommandModules() {
    const items = (typeof Auth !== 'undefined' && Auth.getSidebarItems ? Auth.getSidebarItems() : []) || [];
    return items.map(i => ({
      id: 'mod_' + i.id,
      moduleId: i.id,
      title: i.label,
      sub: `Open ${i.label} module`,
      icon: i.icon,
      badge: 'Module'
    }));
  },

  filterCommandPalette(query) {
    const q = (query || '').toLowerCase().trim();
    const filter = this.commandPaletteFilter;
    let results = [];

    // 1. Actions
    if (filter === 'all' || filter === 'actions') {
      const actions = this.getAvailableCommandActions().filter(a =>
        !q || a.title.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q) || a.badge.toLowerCase().includes(q)
      );
      if (actions.length > 0) {
        results.push({ type: 'header', label: '⚡ Quick Actions' });
        actions.forEach(a => results.push({ type: 'action', ...a }));
      }
    }

    // 2. Modules
    if (filter === 'all' || filter === 'modules') {
      const modules = this.getAvailableCommandModules().filter(m =>
        !q || m.title.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q)
      );
      if (modules.length > 0) {
        results.push({ type: 'header', label: '🧭 Workspaces & Modules' });
        modules.forEach(m => results.push({ type: 'module', ...m }));
      }
    }

    // 3. People
    if (filter === 'all' || filter === 'people') {
      let emps = (typeof DB !== 'undefined' && DB.get ? DB.get('employees') : []) || [];
      if (typeof Auth !== 'undefined') {
        if (Auth.role === 'dept_manager') {
          const myId = Auth.employee?.id;
          emps = emps.filter(e => e.managerId === myId || e.reportingTo === myId || e.id === myId);
        } else if (Auth.role === 'employee') {
          const myId = Auth.employee?.id;
          emps = emps.filter(e => e.id === myId);
        }
      }
      const isHROrAdmin = typeof Auth !== 'undefined' && (Auth.role === 'superadmin' || Auth.role === 'hr_manager');
      const matchedEmps = emps.filter(e =>
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        (e.empNo || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        ((isHROrAdmin || e.id === (Auth.employee?.id)) && (e.cnic || '').includes(q)) ||
        (typeof Utils !== 'undefined' && Utils.getDeptName(e.departmentId).toLowerCase().includes(q))
      ).slice(0, 8);

      if (matchedEmps.length > 0) {
        results.push({ type: 'header', label: `👥 Employees (${matchedEmps.length})` });
        matchedEmps.forEach(e => results.push({
          type: 'employee',
          id: 'emp_' + e.id,
          empId: e.id,
          title: e.fullName,
          sub: `${e.empNo} • ${Utils.getDeptName(e.departmentId)} • ${Utils.getDesigName(e.designationId)}`,
          photo: e.photo,
          badge: e.status ? e.status.toUpperCase() : 'ACTIVE',
          icon: 'fa-user'
        }));
      }
    }

    this.commandPaletteItems = results.filter(r => r.type !== 'header');
    this.commandPaletteIndex = 0;

    const listEl = document.getElementById('cmd-palette-list');
    const statEl = document.getElementById('cmd-palette-stat');
    if (!listEl) return;

    if (results.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:36px 16px;color:var(--text-muted)">
          <i class="fa fa-magnifying-glass" style="font-size:28px;margin-bottom:12px;opacity:0.6;display:block"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text)">No matches found for "${Utils.escapeHtml(q)}"</div>
          <div style="font-size:12px;margin-top:4px">Try searching for an employee name, module, or quick action command</div>
        </div>
      `;
      if (statEl) statEl.textContent = '0 results';
      return;
    }

    if (statEl) statEl.textContent = `${this.commandPaletteItems.length} command${this.commandPaletteItems.length > 1 ? 's' : ''} available`;

    let html = '';
    let selectableIndex = 0;

    results.forEach(r => {
      if (r.type === 'header') {
        html += `<div class="cmd-group-label">${r.label}</div>`;
      } else {
        const isSelected = selectableIndex === this.commandPaletteIndex;
        const indexAttr = selectableIndex;
        selectableIndex++;

        let avatarHtml = `<div class="cmd-item-icon"><i class="fa ${r.icon || 'fa-bolt'}"></i></div>`;
        if (r.type === 'employee') {
          if (r.photo) {
            avatarHtml = `<div class="cmd-item-icon" style="overflow:hidden;padding:0"><img src="${r.photo}" style="width:100%;height:100%;object-fit:cover" alt="${r.title}"></div>`;
          } else {
            avatarHtml = `<div class="cmd-item-icon" style="background:${Utils.avatarColor(r.empId)};color:white;font-weight:700;font-size:12px">${Utils.avatarInitials(r.title)}</div>`;
          }
        }

        html += `
          <div class="cmd-item ${isSelected ? 'selected' : ''}" data-index="${indexAttr}" onclick="App.triggerCommandByIndex(${indexAttr})">
            <div class="cmd-item-left">
              ${avatarHtml}
              <div style="min-width:0">
                <div class="cmd-item-title">${Utils.escapeHtml(r.title)}</div>
                <div class="cmd-item-sub">${Utils.escapeHtml(r.sub || '')}</div>
              </div>
            </div>
            <div class="cmd-item-badge">${Utils.escapeHtml(r.badge || '')}</div>
          </div>
        `;
      }
    });

    listEl.innerHTML = html;
  },

  updateCommandPaletteSelection() {
    document.querySelectorAll('.cmd-item').forEach((el, idx) => {
      const isSel = idx === this.commandPaletteIndex;
      el.classList.toggle('selected', isSel);
      if (isSel) el.scrollIntoView({ block: 'nearest' });
    });
  },

  triggerCommandByIndex(index) {
    const item = this.commandPaletteItems[index];
    if (!item) return;
    this.closeCommandPalette();

    if (item.type === 'action') {
      switch (item.id) {
        case 'act_clock':
          this.navigate('attendance');
          break;
        case 'act_leave':
          this.navigate('leaves');
          setTimeout(() => { if (typeof Leaves !== 'undefined' && Leaves.showApplyModal) Leaves.showApplyModal(); }, 120);
          break;
        case 'act_add_emp':
          this.navigate('employees');
          setTimeout(() => { if (typeof Employees !== 'undefined' && Employees.showAddEmployeeModal) Employees.showAddEmployeeModal(); }, 120);
          break;
        case 'act_scn':
          this.navigate('employees');
          setTimeout(() => { if (typeof Employees !== 'undefined' && Employees.showIssueShowCauseNoticeModal) Employees.showIssueShowCauseNoticeModal(); }, 120);
          break;
        case 'act_payroll':
          this.navigate('payroll');
          break;
        case 'act_shift_roster':
          this.navigate('attendance', 'roster');
          break;
        case 'act_appraisal':
          this.navigate('performance');
          break;
        case 'act_chat':
          if (typeof Chat !== 'undefined' && Chat.openDrawer) Chat.openDrawer();
          break;
        case 'act_history':
          this.openHistoryDrawer();
          break;
        case 'act_theme':
          this.toggleTheme();
          break;
        case 'act_density':
          this.toggleTableDensity();
          break;
        default:
          break;
      }
    } else if (item.type === 'module') {
      this.navigate(item.moduleId);
    } else if (item.type === 'employee') {
      const isHROrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
      if (isHROrAdmin || Auth.employee?.id === item.empId) {
        this.navigate('employees');
        setTimeout(() => { if (typeof Employees !== 'undefined' && Employees.renderProfile) Employees.renderProfile(item.empId); }, 100);
      } else {
        this.navigate('employees');
      }
    }
  },

  // ═══════════════════════════════════════════════
  // BROWSER-STYLE ACTIVITY HISTORY DRAWER
  // ═══════════════════════════════════════════════
  historyFilter: { query: '', module: 'all', action: 'all' },
  isHistoryOpen: false,

  toggleHistoryDrawer() {
    if (this.isHistoryOpen) {
      this.closeHistoryDrawer();
    } else {
      this.openHistoryDrawer();
    }
  },

  openHistoryDrawer() {
    this.isHistoryOpen = true;
    const drawer = document.getElementById('history-drawer');
    const overlay = document.getElementById('history-drawer-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    this.renderHistoryDrawer();
    setTimeout(() => {
      document.getElementById('history-search-input')?.focus();
    }, 150);
  },

  closeHistoryDrawer() {
    this.isHistoryOpen = false;
    const drawer = document.getElementById('history-drawer');
    const overlay = document.getElementById('history-drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  },

  filterHistory(val) {
    this.historyFilter.query = (val || '').toLowerCase().trim();
    const clearBtn = document.getElementById('history-search-clear-btn');
    if (clearBtn) clearBtn.style.display = this.historyFilter.query ? 'block' : 'none';
    this.renderHistoryList();
  },

  clearHistorySearch() {
    const input = document.getElementById('history-search-input');
    if (input) input.value = '';
    this.filterHistory('');
  },

  setHistoryModule(mod) {
    this.historyFilter.module = mod;
    document.querySelectorAll('.history-module-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.mod === mod);
    });
    this.renderHistoryList();
  },

  setHistoryAction(act) {
    this.historyFilter.action = act;
    document.querySelectorAll('.history-action-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.act === act);
    });
    this.renderHistoryList();
  },

  deleteHistoryItem(id, event) {
    if (event) event.stopPropagation();
    DB.deleteLog(id);
    Toast.show('Item removed from history', 'info');
    this.renderHistoryDrawer();
    const badge = document.getElementById('dash-history-badge');
    if (badge) badge.textContent = (DB.get('audit_logs') || []).length;
  },

  confirmClearHistory() {
    Modal.confirm(
      'Clear Activity History',
      'Are you sure you want to clear your activity history log? This cannot be undone.',
      () => {
        DB.clearLogs();
        Toast.show('Activity history cleared', 'success');
        this.renderHistoryDrawer();
        const badge = document.getElementById('dash-history-badge');
        if (badge) badge.textContent = '0';
      }
    );
  },

  exportHistoryCSV() {
    const logs = this.getFilteredLogs();
    if (logs.length === 0) {
      Toast.show('No history entries to export', 'warning');
      return;
    }
    const headers = ['ID', 'Timestamp', 'Date', 'Time', 'Module', 'Action', 'Details', 'User'];
    const rows = logs.map(l => {
      const d = new Date(l.timestamp);
      return [
        l.id,
        `"${l.timestamp}"`,
        `"${d.toISOString().split('T')[0]}"`,
        `"${d.toLocaleTimeString()}"`,
        `"${l.module}"`,
        `"${l.action}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
        `"${l.userId === 1 ? 'Super Admin' : (Utils.getEmpName(l.userId) || 'System')}"`
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `activity_history_${Utils.today()}.csv`);
    Toast.show('Activity history exported to CSV!', 'success');
  },

  getFilteredLogs() {
    let logs = DB.get('audit_logs') || [];
    const { query, module, action } = this.historyFilter;
    if (query) {
      logs = logs.filter(l =>
        (l.details || '').toLowerCase().includes(query) ||
        (l.module || '').toLowerCase().includes(query) ||
        (l.action || '').toLowerCase().includes(query)
      );
    }
    if (module && module !== 'all') {
      logs = logs.filter(l => (l.module || '').toLowerCase() === module.toLowerCase());
    }
    if (action && action !== 'all') {
      logs = logs.filter(l => (l.action || '').toUpperCase() === action.toUpperCase());
    }
    return logs;
  },

  refreshHistoryDrawer() {
    if (this.isHistoryOpen) {
      this.renderHistoryList();
    }
    const badge = document.getElementById('dash-history-badge');
    if (badge) badge.textContent = (DB.get('audit_logs') || []).length;
  },

  renderHistoryDrawer() {
    const drawer = document.getElementById('history-drawer');
    if (!drawer) return;
    const allLogs = DB.get('audit_logs') || [];

    const modules = [
      { id: 'all', label: 'All Modules' },
      { id: 'Employees', label: 'Employees' },
      { id: 'Payroll', label: 'Payroll' },
      { id: 'Attendance', label: 'Attendance' },
      { id: 'Leaves', label: 'Leaves' },
      { id: 'Performance', label: 'Performance' },
      { id: 'Recruitment', label: 'Recruitment' },
      { id: 'Administration', label: 'Admin' },
      { id: 'Settings', label: 'Settings' },
      { id: 'Auth', label: 'Auth' },
    ];

    const actions = [
      { id: 'all', label: 'All Actions' },
      { id: 'ADD', label: '+ Added' },
      { id: 'UPDATE', label: '✎ Updated' },
      { id: 'DELETE', label: '🗑 Deleted' },
      { id: 'APPROVE', label: '✓ Approved' },
      { id: 'PROCESS', label: '⚙ Processed' },
      { id: 'LOGIN', label: '🔑 Login' },
      { id: 'APPLY', label: '📤 Applied' },
    ];

    drawer.innerHTML = `
      <!-- Drawer Header -->
      <div class="history-header">
        <div class="history-title-wrap">
          <div class="history-title-icon"><i class="fa fa-clock-rotate-left"></i></div>
          <div>
            <div class="history-title-text">Activity History</div>
            <div class="history-subtitle-text">Browser history & audit activity log</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge badge-primary" id="history-header-count">${allLogs.length}</span>
          <button class="history-close-btn" onclick="App.closeHistoryDrawer()" title="Close (Esc)"><i class="fa fa-times"></i></button>
        </div>
      </div>

      <!-- Search Box (Chrome-style history search) -->
      <div class="history-search-wrap">
        <div class="history-search-box">
          <i class="fa fa-search"></i>
          <input type="text" id="history-search-input" placeholder="Search history... (e.g. employee, payroll, leave)"
            value="${this.historyFilter.query || ''}"
            oninput="App.filterHistory(this.value)">
          <button id="history-search-clear-btn" class="history-del-item-btn" style="display:${this.historyFilter.query?'block':'none'}" onclick="App.clearHistorySearch()" title="Clear">
            <i class="fa fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Module Chips -->
      <div class="history-filter-chips">
        ${modules.map(m => `
          <button class="history-chip history-module-chip ${this.historyFilter.module===m.id?'active':''}" data-mod="${m.id}" onclick="App.setHistoryModule('${m.id}')">
            ${m.label}
          </button>
        `).join('')}
      </div>

      <!-- Action Chips -->
      <div class="history-filter-chips" style="padding-top:4px;padding-bottom:8px;background:var(--bg-2)">
        ${actions.map(a => `
          <button class="history-chip history-action-chip ${this.historyFilter.action===a.id?'active':''}" data-act="${a.id}" onclick="App.setHistoryAction('${a.id}')">
            ${a.label}
          </button>
        `).join('')}
      </div>

      <!-- History Toolbar -->
      <div class="history-toolbar">
        <span id="history-filtered-count">Showing ${allLogs.length} events</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-xs" onclick="App.exportHistoryCSV()" title="Export CSV"><i class="fa fa-download"></i> CSV</button>
          <button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="App.confirmClearHistory()" title="Clear All History"><i class="fa fa-trash"></i> Clear</button>
        </div>
      </div>

      <!-- History List Body -->
      <div class="history-list" id="history-entries-container"></div>
    `;

    this.renderHistoryList();
  },

  renderHistoryList() {
    const container = document.getElementById('history-entries-container');
    if (!container) return;
    const logs = this.getFilteredLogs();
    const countEl = document.getElementById('history-filtered-count');
    if (countEl) countEl.textContent = `Showing ${logs.length} event${logs.length===1?'':'s'}`;

    if (logs.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--text-muted)">
          <div style="font-size:36px;margin-bottom:12px;opacity:0.4"><i class="fa fa-magnifying-glass"></i></div>
          <div style="font-size:14px;font-weight:600;color:var(--text-2);margin-bottom:6px">No activity records found</div>
          <div style="font-size:12px">Try searching for a different keyword or resetting your filters.</div>
          <button class="btn btn-secondary btn-sm" style="margin-top:14px" onclick="App.clearHistorySearch();App.setHistoryModule('all');App.setHistoryAction('all')">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    // Group logs chronologically: Today, Yesterday, Earlier this week, Older
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: { label: 'Today — ' + now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }), items: [] },
      yesterday: { label: 'Yesterday — ' + yesterday.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }), items: [] },
      week: { label: 'Earlier this Week', items: [] },
      older: { label: 'Older Activities', items: [] },
    };

    logs.forEach(l => {
      const dt = new Date(l.timestamp);
      const ds = dt.toISOString().split('T')[0];
      if (ds === todayStr) {
        groups.today.items.push(l);
      } else if (ds === yesterdayStr) {
        groups.yesterday.items.push(l);
      } else if (dt >= weekAgo) {
        groups.week.items.push(l);
      } else {
        groups.older.items.push(l);
      }
    });

    const actionColors = {
      ADD: { bg: 'hsla(142, 71%, 45%, 0.15)', text: 'var(--success)', icon: 'fa-plus' },
      UPDATE: { bg: 'hsla(199, 89%, 52%, 0.15)', text: 'var(--info)', icon: 'fa-pen' },
      DELETE: { bg: 'hsla(0, 84%, 62%, 0.15)', text: 'var(--danger)', icon: 'fa-trash' },
      APPROVE: { bg: 'hsla(142, 71%, 45%, 0.15)', text: 'var(--success)', icon: 'fa-check' },
      REJECT: { bg: 'hsla(0, 84%, 62%, 0.15)', text: 'var(--danger)', icon: 'fa-xmark' },
      PROCESS: { bg: 'hsla(262, 83%, 62%, 0.15)', text: 'var(--accent)', icon: 'fa-cogs' },
      LOGIN: { bg: 'hsla(221, 83%, 58%, 0.15)', text: 'var(--primary)', icon: 'fa-right-to-bracket' },
      APPLY: { bg: 'hsla(38, 95%, 56%, 0.15)', text: 'var(--warning)', icon: 'fa-paper-plane' },
      TRANSFER: { bg: 'hsla(199, 89%, 52%, 0.15)', text: 'var(--info)', icon: 'fa-arrows-rotate' },
    };

    let html = '';
    ['today', 'yesterday', 'week', 'older'].forEach(key => {
      const g = groups[key];
      if (g.items.length === 0) return;
      html += `
        <div class="history-date-section">
          <div class="history-date-heading">${g.label} (${g.items.length})</div>
          ${g.items.map(l => {
            const conf = actionColors[l.action] || { bg: 'var(--surface-2)', text: 'var(--text-2)', icon: 'fa-circle' };
            const timeStr = new Date(l.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
            return `
              <div class="history-entry-card">
                <div class="history-entry-top">
                  <div class="history-entry-meta">
                    <span class="history-badge" style="background:${conf.bg};color:${conf.text}">
                      <i class="fa ${conf.icon}" style="margin-right:3px"></i>${l.action}
                    </span>
                    <span class="history-module-tag">${l.module}</span>
                    <span class="history-entry-time">${timeStr}</span>
                  </div>
                  <button class="history-del-item-btn" title="Remove entry" onclick="App.deleteHistoryItem(${l.id}, event)">
                    <i class="fa fa-times"></i>
                  </button>
                </div>
                <div class="history-entry-details">${l.details}</div>
                <div class="history-entry-user">
                  <i class="fa fa-user-circle" style="opacity:0.6"></i>
                  <span>${l.userId === 1 ? 'Super Admin' : (Utils.getEmpName(l.userId) || 'System')}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    });

    container.innerHTML = html;
  },

// ═══════════════════════════════════════════════
  // MULTI-SELECT FLOATING BATCH ACTION DOCK
  // ═══════════════════════════════════════════════
  selectedRowIds: new Set(),

  toggleSelectAllRows(masterCheckbox, rowSelector = '.tbl-row-checkbox') {
    const isChecked = masterCheckbox.checked;
    document.querySelectorAll(rowSelector).forEach(cb => {
      cb.checked = isChecked;
      const id = cb.dataset.id;
      const row = cb.closest('tr');
      if (isChecked && id) {
        this.selectedRowIds.add(String(id));
        row?.classList.add('row-selected');
      } else if (id) {
        this.selectedRowIds.delete(String(id));
        row?.classList.remove('row-selected');
      }
    });
    this.updateBatchDock();
  },

  toggleRowSelect(checkbox, id) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
      this.selectedRowIds.add(String(id));
      row?.classList.add('row-selected');
    } else {
      this.selectedRowIds.delete(String(id));
      row?.classList.remove('row-selected');
    }
    this.updateBatchDock();
  },

  updateBatchDock() {
    const dock = document.getElementById('batch-action-dock');
    const countEl = document.getElementById('batch-dock-count');
    const labelEl = document.getElementById('batch-dock-label');
    if (!dock) return;

    const count = this.selectedRowIds.size;
    if (count > 0) {
      dock.style.display = 'flex';
      dock.classList.add('active');
      if (countEl) countEl.textContent = count;
      if (labelEl) labelEl.textContent = `${count} record${count > 1 ? 's' : ''} selected`;
    } else {
      dock.classList.remove('active');
      dock.style.display = 'none';
    }
  },

  clearBatchSelection() {
    this.selectedRowIds.clear();
    document.querySelectorAll('.tbl-row-checkbox, #master-table-select').forEach(cb => {
      cb.checked = false;
      cb.closest('tr')?.classList.remove('row-selected');
    });
    this.updateBatchDock();
  },

  batchExportSelected() {
    const count = this.selectedRowIds.size;
    if (count === 0) return;
    const emps = DB.get('employees') || [];
    const selectedEmps = emps.filter(e => this.selectedRowIds.has(String(e.id)));
    
    if (selectedEmps.length === 0) {
      Toast.show('No full employee records matched the selected IDs', 'warning');
      return;
    }

    const headers = ['ID', 'EmpNo', 'FullName', 'Department', 'Designation', 'Email', 'Phone', 'Status', 'Salary'];
    const rows = selectedEmps.map(e => [
      e.id,
      e.empNo || '',
      `"${e.fullName}"`,
      `"${Utils.getDeptName(e.departmentId)}"`,
      `"${Utils.getDesigName(e.designationId)}"`,
      e.email || '',
      e.phone || '',
      e.status || '',
      e.salary || 0
    ].join(','));

    const csvContent = headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csvContent, `selected_employees_${Utils.today()}.csv`);
    Toast.show(`Exported ${count} records to CSV`, 'success');
  },

  batchEmailSelected() {
    const count = this.selectedRowIds.size;
    if (count === 0) return;
    Toast.show(`Broadcasting notice to ${count} recipient(s)... (Simulated)`, 'info', '', 4000, () => {
      Toast.show('Broadcast cancelled via Undo', 'warning');
    });
  },

  batchTagStatus() {
    const count = this.selectedRowIds.size;
    if (count === 0) return;
    const nextStatus = prompt(`Enter new status for ${count} selected records (active / probation / inactive):`, 'active');
    if (!nextStatus) return;

    const emps = DB.get('employees') || [];
    let updated = 0;
    emps.forEach(e => {
      if (this.selectedRowIds.has(String(e.id))) {
        e.status = nextStatus.toLowerCase().trim();
        updated++;
      }
    });
    DB.set('employees', emps);
    this.clearBatchSelection();
    Toast.show(`Updated ${updated} records to '${nextStatus}'`, 'success');
    if (this.currentModule === 'employees') {
      Employees.render();
    }
  },

  // ═══════════════════════════════════════════════
  // QUICK INSPECT SLIDE-OVER DRAWER
  // ═══════════════════════════════════════════════
  openInspectDrawer(type, id) {
    const overlay = document.getElementById('inspect-drawer-overlay');
    const drawer = document.getElementById('inspect-drawer');
    const body = document.getElementById('inspect-drawer-body');
    const title = document.getElementById('inspect-drawer-title');
    const subtitle = document.getElementById('inspect-drawer-subtitle');
    const footer = document.getElementById('inspect-drawer-footer');
    if (!drawer || !body) return;

    if (type === 'employee') {
      const emp = (DB.get('employees') || []).find(e => String(e.id) === String(id));
      if (!emp) { Toast.show('Employee not found', 'error'); return; }

      if (title) title.textContent = emp.fullName;
      if (subtitle) subtitle.textContent = `${emp.empNo} • ${Utils.getDeptName(emp.departmentId)}`;

      const avatarHtml = emp.photo
        ? `<img src="${emp.photo}" style="width:68px;height:68px;border-radius:14px;object-fit:cover;border:2px solid var(--border)">`
        : `<div style="width:68px;height:68px;border-radius:14px;background:${Utils.avatarColor(emp.id)};color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800">${Utils.avatarInitials(emp.fullName)}</div>`;

      body.innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--surface);border-radius:12px;border:1px solid var(--border)">
          ${avatarHtml}
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text)">${emp.fullName}</div>
            <div style="font-size:12.5px;color:var(--text-3);margin-top:2px">${Utils.getDesigName(emp.designationId)} • ${Utils.getDeptName(emp.departmentId)}</div>
            <div style="margin-top:6px">${Utils.statusBadge(emp.status)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Official Email</span>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px;overflow:hidden;text-overflow:ellipsis">${emp.email || '—'}</div>
          </div>
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Phone Number</span>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px">${emp.phone || '—'}</div>
          </div>
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Joining Date</span>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px">${Utils.formatDate(emp.joiningDate)}</div>
          </div>
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Monthly Base Salary</span>
            <div style="font-size:13px;font-weight:700;color:var(--primary);margin-top:2px">${Utils.formatCurrency(emp.salary)}</div>
          </div>
        </div>

        <div class="card" style="padding:16px">
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <i class="fa fa-fingerprint" style="color:var(--primary)"></i> Recent Attendance Record
          </div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.6">
            Latest Daily Swipe Status: <strong>${emp.status === 'active' ? 'Present (08:52 AM on Biometric-Gate-1)' : 'Inactive / On Leave'}</strong>
          </div>
        </div>
      `;

      if (footer) {
        footer.innerHTML = `
          <button class="btn btn-ghost btn-sm" onclick="App.closeInspectDrawer()">Close</button>
          <button class="btn btn-secondary btn-sm" onclick="Employees.showIssueShowCauseNoticeModal(${emp.id}); App.closeInspectDrawer();">
            <i class="fa fa-scale-balanced"></i> Issue Notice
          </button>
          <button class="btn btn-primary btn-sm" onclick="Employees.renderProfile(${emp.id}); App.closeInspectDrawer();">
            <i class="fa fa-user"></i> Full Profile
          </button>
        `;
      }
    }

    if (overlay) { overlay.style.display = 'block'; overlay.classList.add('open'); }
    drawer.style.display = 'flex';
    drawer.classList.add('open');
  },

  closeInspectDrawer() {
    const overlay = document.getElementById('inspect-drawer-overlay');
    const drawer = document.getElementById('inspect-drawer');
    if (overlay) { overlay.classList.remove('open'); overlay.style.display = 'none'; }
    if (drawer) { drawer.classList.remove('open'); drawer.style.display = 'none'; }
  },

  // ═══════════════════════════════════════════════
  // KEYBOARD SHORTCUTS CHEAT SHEET MODAL (?)
  // ═══════════════════════════════════════════════
  showShortcutsModal() {
    Modal.confirm(
      '⌨️ Power-User Keyboard Shortcuts',
      `
        <div class="shortcuts-grid">
          <div>
            <div class="shortcut-group-title"><i class="fa fa-compass"></i> Two-Key Navigation (G then ...)</div>
            <div class="shortcut-row"><span>Go to Dashboard</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>D</kbd></div></div>
            <div class="shortcut-row"><span>Go to Employees</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>E</kbd></div></div>
            <div class="shortcut-row"><span>Go to Attendance</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>A</kbd></div></div>
            <div class="shortcut-row"><span>Go to Leaves</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>L</kbd></div></div>
            <div class="shortcut-row"><span>Go to Payroll</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>P</kbd></div></div>
            <div class="shortcut-row"><span>Go to Recruitment</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>R</kbd></div></div>
          </div>
          <div>
            <div class="shortcut-group-title"><i class="fa fa-terminal"></i> Global Spotlight & Utilities</div>
            <div class="shortcut-row"><span>Spotlight Search</span> <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></div></div>
            <div class="shortcut-row"><span>Team Chat Drawer</span> <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>M</kbd></div></div>
            <div class="shortcut-row"><span>Audit History Drawer</span> <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>H</kbd></div></div>
            <div class="shortcut-row"><span>Toggle Dark / Light</span> <div class="shortcut-keys"><kbd>T</kbd></div></div>
            <div class="shortcut-row"><span>Table Density (Compact)</span> <div class="shortcut-keys"><kbd>D</kbd></div></div>
            <div class="shortcut-row"><span>Dismiss Any Dialog</span> <div class="shortcut-keys"><kbd>ESC</kbd></div></div>
          </div>
        </div>
      `,
      () => {},
      'primary'
    );
    const confirmBtn = document.getElementById('confirm-yes');
    if (confirmBtn) confirmBtn.style.display = 'none';
  },

  // ════════════════════════════════════════════════════════════
  // ─── Floating Live Persona & Role Switcher Dock (Disabled) ──
  // ════════════════════════════════════════════════════════════
  renderPersonaDock() {
    const existing = document.getElementById('persona-floating-bar');
    if (existing) existing.remove();
  },

  togglePersonaDock(minimized) {
    const existing = document.getElementById('persona-floating-bar');
    if (existing) existing.remove();
  },

  showPersonaLimitsModal() {
    const p = (Auth.DEMO_PERSONAS || []).find(x => x.username === Auth.user?.username) || { name: Auth.user?.username, roleLabel: Auth.role };
    Modal.show(`
      <div style="padding:8px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px">
            <i class="fa fa-shield-halved"></i>
          </div>
          <div>
            <h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text)">${p.name} — Access &amp; Permission Profile</h3>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">Role: <strong>${p.roleLabel}</strong> (${Auth.role})</div>
          </div>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12.5px;color:var(--text-2);line-height:1.4">
          ${p.description || 'Active system user profile.'}
        </div>

        <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px;text-transform:uppercase">Key Permissions Audit:</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[
            ['leaves.view', 'View Leaves Module & Balance'],
            ['leaves.create', 'Apply / Submit Leave Request'],
            ['leaves.approve', 'Manager / HR Approve Leave'],
            ['payroll.run', 'Process Monthly Payroll'],
            ['payroll.export', 'Export Bank & Tax Schedules'],
            ['attendance.create', 'Clock In / Out Attendance'],
            ['travel_expenses.create', 'Submit Expense Claim'],
            ['travel_expenses.approve', 'Audit / Approve Expenses'],
            ['settings.view', 'Settings & System Governance'],
            ['settings.edit', 'Modify Permissions & Rules']
          ].map(([perm, label]) => {
            const has = Auth.can(perm) && Auth.canSeeFeature(perm);
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:var(--card);border:1px solid var(--border);border-radius:6px;font-size:11.5px">
                <span style="color:var(--text-2)">${label}</span>
                <span class="badge ${has ? 'badge-success' : 'badge-danger'}" style="font-size:10px;padding:2px 6px">
                  ${has ? '<i class="fa fa-check"></i> Allowed' : '<i class="fa fa-ban"></i> Restricted'}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `, {
      footer: '<button class="btn btn-primary" onclick="Modal.close(\'dynamic-modal\')">Close Inspection</button>'
    });
  }

};

// ── TOAST SYSTEM ──
const Toast = {
  show(message, type = 'info', subtitle = '', duration = 4000, onUndo = null) {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const toastId = 'toast_' + Date.now() + '_' + Math.floor(Math.random()*1000);
    toast.id = toastId;

    toast.innerHTML = `
      <i class="fa ${icons[type] || icons.info} toast-icon"></i>
      <div style="flex:1;min-width:0">
        <div class="toast-msg" style="font-size:13px;font-weight:700;color:var(--text)">${message}</div>
        ${subtitle ? `<div class="toast-sub" style="font-size:11.5px;color:var(--text-3);margin-top:2px">${subtitle}</div>` : ''}
      </div>
      ${onUndo ? `<button class="toast-undo-btn" id="${toastId}_undo"><i class="fa fa-rotate-left"></i> Undo</button>` : ''}
      <div class="toast-progress" style="animation-duration:${duration}ms"></div>
    `;

    container.appendChild(toast);

    if (onUndo) {
      setTimeout(() => {
        const undoBtn = document.getElementById(`${toastId}_undo`);
        undoBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          try { onUndo(); } catch (err) { console.error('Toast undo error:', err); }
          toast.classList.add('removing');
          setTimeout(() => toast.remove(), 250);
        });
      }, 10);
    }

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ── MODAL SYSTEM ──
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open'); document.body.style.overflow = '';
    });
  },

  confirm(title, message, onConfirm, type = 'danger') {
    const id = 'confirm-modal';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'modal-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="Modal.close('${id}')"><i class="fa fa-times"></i></button>
        </div>
        <div class="modal-body"><p style="color:var(--text-2);font-size:14px">${message}</p></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="Modal.close('${id}')">Cancel</button>
          <button class="btn btn-${type}" id="confirm-yes">Confirm</button>
        </div>
      </div>
    `;
    this.open(id);
    document.getElementById('confirm-yes').onclick = () => { this.close(id); onConfirm(); };
    el.addEventListener('click', e => { if (e.target === el) this.close(id); });
  },

  show(title, bodyHTML, options = {}) {
    if (typeof title === 'object' && title !== null) {
      options = title;
      bodyHTML = options.body;
      title = options.title;
    }
    const id = 'dynamic-modal';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'modal-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="modal ${options.size || ''}" style="${options.style || ''}">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="Modal.close('${id}')"><i class="fa fa-times"></i></button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
      </div>
    `;
    this.open(id);
    el.addEventListener('click', e => { if (e.target === el) this.close(id); });
  }
};

// ── FORM VALIDATION HELPER ──
const FormValidator = {
  validate(rules) {
    let valid = true;
    rules.forEach(({ id, label, required, minLen, pattern, patternMsg }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const val = el.value.trim();
      let error = null;
      if (required && !val) error = `${label} is required`;
      else if (minLen && val.length < minLen) error = `${label} must be at least ${minLen} characters`;
      else if (pattern && !pattern.test(val)) error = patternMsg || `${label} is invalid`;

      // Remove old feedback
      const old = el.parentNode.querySelector('.invalid-feedback');
      if (old) old.remove();
      el.classList.remove('is-invalid', 'is-valid');

      if (error) {
        el.classList.add('is-invalid');
        const fb = document.createElement('div');
        fb.className = 'invalid-feedback';
        fb.innerHTML = `<i class="fa fa-circle-xmark"></i>${error}`;
        el.parentNode.appendChild(fb);
        valid = false;
      } else if (val) {
        el.classList.add('is-valid');
      }
    });
    return valid;
  },
  clear(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('is-invalid', 'is-valid');
      const old = el.parentNode.querySelector('.invalid-feedback');
      if (old) old.remove();
    });
  }
};

// ── LOGIN MODULE (SPLIT-SCREEN SAAS PORTAL) ──
const Login = {
  activeAccount: 'admin',
  activePortal: 'hrm',

  setPortal(portal) {
    this.activePortal = portal === 'chat' ? 'chat' : 'hrm';
    const hrmPill = document.getElementById('portal-pill-hrm');
    const chatPill = document.getElementById('portal-pill-chat');
    const subtitle = document.getElementById('login-portal-subtitle');
    const btn = document.getElementById('login-btn');
    const acc = this.accounts[this.activeAccount] || this.accounts.admin;

    if (hrmPill) {
      hrmPill.classList.toggle('active', this.activePortal === 'hrm');
      hrmPill.setAttribute('aria-checked', this.activePortal === 'hrm');
    }
    if (chatPill) {
      chatPill.classList.toggle('active', this.activePortal === 'chat');
      chatPill.setAttribute('aria-checked', this.activePortal === 'chat');
    }

    if (subtitle) {
      subtitle.textContent = this.activePortal === 'chat'
        ? 'Sign in to access Pro Teams Workspace & Colleague Channels'
        : 'Sign in to access your HRM Pro account';
    }

    if (btn) {
      if (this.activePortal === 'chat') {
        btn.className = 'split-submit-btn btn-portal-chat';
        btn.innerHTML = '<span>Sign In to Pro Teams</span> <i class="fa fa-arrow-right"></i>';
      } else {
        btn.className = 'split-submit-btn btn-orange';
        btn.innerHTML = '<span>Sign In</span> <i class="fa fa-arrow-right"></i>';
      }
    }

    if (window.location.hash === '#login' || window.location.hash === '#chat-login') {
      const targetHash = this.activePortal === 'chat' ? '#chat-login' : '#login';
      if (window.location.hash !== targetHash) {
        if (history.replaceState) history.replaceState({ page: 'login', portal: this.activePortal }, '', targetHash);
        else window.location.hash = targetHash;
      }
    }
  },

  accounts: {
    admin: {
      name: 'Ahmed Khan',
      role: 'Super Administrator',
      email: 'admin',
      pass: 'admin123',
      portal: 'HRM Pro Executive Portal',
      scope: 'Full Administrative Authority • All 14 Modules, Settings & Audit Logs',
      avatar: 'assets/avatars/ahmed_khan.jpg',
      badgeColor: '#2563eb'
    },
    hr: {
      name: 'Sara Malik',
      role: 'HR Director',
      email: 'sara.malik',
      pass: 'hr123',
      portal: 'HR & People Operations Portal',
      scope: 'People Operations • Employees, Shift Rosters, Statutory Payroll & Leaves',
      avatar: 'assets/avatars/sara_malik.jpg',
      badgeColor: '#10b981'
    },
    manager: {
      name: 'Usman Baig',
      role: 'Engineering Dept Manager',
      email: 'usman.baig',
      pass: 'mgr123',
      portal: 'Department Operations Portal',
      scope: 'Team Supervision • Attendance Approvals, Shift Assignments & 360 Reviews',
      avatar: 'assets/avatars/usman_baig.jpg',
      badgeColor: '#8b5cf6'
    },
    employee: {
      name: 'Fatima Raza',
      role: 'Senior Software Engineer',
      email: 'fatima.raza',
      pass: 'emp123',
      portal: 'Employee Self-Service Portal',
      scope: 'Self-Service • Attendance Check-In, Leave Requests & Monthly Payslips',
      avatar: 'assets/avatars/fatima_raza.jpg',
      badgeColor: '#0284c7'
    },
    onboarding: {
      name: 'Saad Ibrahim',
      role: 'New Joiner (Onboarding)',
      email: 'saad.ibrahim',
      pass: 'emp123',
      portal: 'Digital Onboarding Portal',
      scope: 'Digital Onboarding • Profile Completion, e-DMS Uploads & Induction Checklist',
      avatar: 'assets/avatars/omar_farhan.jpg',
      badgeColor: '#f59e0b'
    },
    junior_hr: {
      name: 'Zain Ali',
      role: 'Junior HR (Restricted)',
      email: 'junior.hr',
      pass: 'hr123',
      portal: 'Junior HR Restricted Portal',
      scope: 'Partial Permissions • Leaves & Attendance view/apply, Approvals & Salary restricted',
      avatar: 'assets/avatars/omar_farhan.jpg',
      badgeColor: '#ec4899'
    }
  },

  render() {
    const container = document.getElementById('login-page');
    if (!container) return;

    // Login page is STRICTLY Light Mode Only
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.removeAttribute('data-landing-theme');
    document.body.setAttribute('data-theme', 'light');
    document.body.removeAttribute('data-landing-theme');
    container.setAttribute('data-theme', 'light');

    const acc = this.accounts[this.activeAccount] || this.accounts.admin;

    container.innerHTML = `
      <div class="login-split-page login-tri-page" data-theme="light">
        <!-- ─── 1. LEFT HERO & BRAND PANE ─── -->
        <div class="login-split-left login-ref-left">
          <div class="login-ref-dot-pattern"></div>
          <div class="split-left-inner login-ref-left-inner">
            <!-- Brand Header -->
            <a href="#" class="login-ref-brand" onclick="App.showLanding();return false;">
              <div class="login-ref-brand-icon">
                <i class="fa fa-users"></i>
              </div>
              <div class="login-ref-brand-text">
                <div class="login-ref-brand-title">HRM <span style="color:#ff6a00">Pro</span></div>
                <div class="login-ref-brand-sub">Human Resource Management System</div>
              </div>
            </a>

            <!-- Solution Badge Pill -->
            <div class="login-ref-solution-pill">
              SMART WORKFORCE SOLUTION
            </div>

            <!-- Hero Headline -->
            <h1 class="login-ref-hero-title">
              Manage Your<br>People, <span class="highlight-orange">Smarter</span>
            </h1>

            <!-- Hero Description -->
            <p class="login-ref-hero-desc">
              A complete HR solution for attendance, leave, payroll, and team management.
            </p>

            <!-- 4 Feature Highlight Rows -->
            <div class="hero-feature-list">
              <div class="hero-feature-row">
                <div class="hero-feat-icon icon-bg-orange"><i class="fa fa-users"></i></div>
                <div class="hero-feat-info">
                  <div class="hero-feat-name">Employee Management</div>
                  <div class="hero-feat-sub">Organize your workforce with ease</div>
                </div>
              </div>
              <div class="hero-feature-row">
                <div class="hero-feat-icon icon-bg-blue"><i class="fa fa-calendar-check"></i></div>
                <div class="hero-feat-info">
                  <div class="hero-feat-name">Attendance & Time Tracking</div>
                  <div class="hero-feat-sub">Real-time tracking and reports</div>
                </div>
              </div>
              <div class="hero-feature-row">
                <div class="hero-feat-icon icon-bg-green"><i class="fa fa-file-invoice"></i></div>
                <div class="hero-feat-info">
                  <div class="hero-feat-name">Leave Management</div>
                  <div class="hero-feat-sub">Apply, approve and manage leaves</div>
                </div>
              </div>
              <div class="hero-feature-row">
                <div class="hero-feat-icon icon-bg-purple"><i class="fa fa-chart-pie"></i></div>
                <div class="hero-feat-info">
                  <div class="hero-feat-name">Reports & Analytics</div>
                  <div class="hero-feat-sub">Insights for better decisions</div>
                </div>
              </div>
            </div>

            <!-- 3D Laptop Mockup with Plant & Dashboard -->
            <div class="login-ref-laptop-container">
              <img src="assets/login_laptop_mockup.jpg" alt="HRM Pro SaaS Laptop" class="login-ref-laptop-img" onerror="this.src='public/assets/login_laptop_mockup.jpg'">
            </div>
          </div>
        </div>

        <!-- ─── 2. CENTER LOGIN CARD ─── -->
        <div class="login-split-center">
          <div class="split-right-topbar">
            <button class="btn-split-back" onclick="App.showLanding()">
              <i class="fa fa-arrow-left"></i> Back to Home
            </button>
          </div>

          <div class="login-split-card login-ref-card animate-slide-up" data-theme="light">
            <div class="login-card-center-logo">
              <i class="fa fa-users"></i>
            </div>

            <div class="split-card-header text-center">
              <h2 class="split-card-title">Welcome Back</h2>
              <p class="split-card-subtitle" id="login-portal-subtitle">${this.activePortal==='chat' ? 'Sign in to access Pro Teams Workspace & Colleague Channels' : 'Sign in to access your HRM Pro account'}</p>
            </div>

            <!-- Two-Option Segmented Capsule: HR Dashboard vs Team Communication -->
            <div class="login-portal-capsule" role="radiogroup" aria-label="Choose Login Destination">
              <button type="button" 
                      class="portal-capsule-pill portal-hrm ${this.activePortal==='hrm'?'active':''}" 
                      id="portal-pill-hrm" 
                      onclick="Login.setPortal('hrm')" 
                      role="radio" 
                      aria-checked="${this.activePortal==='hrm'}"
                      title="Access Enterprise HRM Dashboard & Management Suite">
                <i class="fa fa-chart-pie pill-icon"></i>
                <div class="pill-text">
                  <span class="pill-title">HR Dashboard</span>
                  <span class="pill-subtitle">HR Suite & Analytics</span>
                </div>
              </button>
              <button type="button" 
                      class="portal-capsule-pill portal-chat ${this.activePortal==='chat'?'active':''}" 
                      id="portal-pill-chat" 
                      onclick="Login.setPortal('chat')" 
                      role="radio" 
                      aria-checked="${this.activePortal==='chat'}"
                      title="Access Pro Teams Workspace & Colleague Messaging">
                <i class="fa fa-comments pill-icon"></i>
                <div class="pill-text">
                  <span class="pill-title">Team Communication</span>
                  <span class="pill-subtitle">Messaging & Channels</span>
                </div>
              </button>
            </div>

            <!-- Mode Tabs (Direct Sign In / Demo Presets) - Retained for Usability Audit Compatibility -->
            <div class="login-tab-nav" role="tablist" aria-label="Sign-in Mode" style="${this.activeTab==='demo' ? '' : 'display:none'}">
              <button type="button" class="login-nav-tab ${this.activeTab==='standard'?'active':''}" id="login-tab-standard" role="tab" aria-selected="${this.activeTab==='standard'}" aria-controls="login-pane-standard" onclick="Login.setTab('standard')">
                <i class="fa fa-key"></i> Direct Sign In
              </button>
              <button type="button" class="login-nav-tab ${this.activeTab==='demo'?'active':''}" id="login-tab-demo" role="tab" aria-selected="${this.activeTab==='demo'}" aria-controls="login-pane-demo" onclick="Login.setTab('demo')">
                <i class="fa fa-users-gear"></i> Demo Role Presets
              </button>
            </div>

            <!-- Demo Role Presets Pane -->
            <div id="login-pane-demo" class="login-pane-content ${this.activeTab==='demo'?'':'hidden'}">
              <div class="active-user-badge-bar" id="active-user-banner">
                <div class="active-user-avatar-wrap">
                  <img src="${acc.avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=2563eb&color=fff'" alt="${acc.name}" class="active-user-img">
                </div>
                <div class="active-user-details">
                  <div class="active-user-name" id="active-account-name">${acc.name}</div>
                  <div class="active-user-role" id="active-account-role">${acc.role}</div>
                </div>
                <div class="active-user-preset-badge">
                  <i class="fa fa-id-badge"></i> Demo Preset
                </div>
              </div>

              <div class="split-account-chips-row">
                <button type="button" class="split-account-chip ${this.activeAccount==='admin'?'active':''}" data-role="admin" onclick="Login.selectAccount('admin')">Super Admin</button>
                <button type="button" class="split-account-chip ${this.activeAccount==='hr'?'active':''}" data-role="hr" onclick="Login.selectAccount('hr')">HR Director</button>
                <button type="button" class="split-account-chip ${this.activeAccount==='manager'?'active':''}" data-role="manager" onclick="Login.selectAccount('manager')">Dept Manager</button>
                <button type="button" class="split-account-chip ${this.activeAccount==='employee'?'active':''}" data-role="employee" onclick="Login.selectAccount('employee')">Employee</button>
                <button type="button" class="split-account-chip ${this.activeAccount==='onboarding'?'active':''}" data-role="onboarding" onclick="Login.selectAccount('onboarding')">Onboarding</button>
                <button type="button" class="split-account-chip ${this.activeAccount==='junior_hr'?'active':''}" data-role="junior_hr" onclick="Login.selectAccount('junior_hr')">Junior HR</button>
              </div>
            </div>

            <!-- Error Banner -->
            <div id="login-error" class="alert alert-danger hidden" style="margin-bottom:12px;border-radius:8px">
              <i class="fa fa-circle-xmark"></i>
              <span id="login-error-msg"></span>
            </div>

            <!-- Form -->
            <form onsubmit="event.preventDefault();Login.submit();">
              <div class="split-form-group">
                <label class="split-form-label">Email Address or Username</label>
                <div class="split-input-box">
                  <i class="fa fa-envelope split-input-icon"></i>
                  <input type="text" class="split-input-element" id="login-username" value="" placeholder="Enter your email or username" autocomplete="username">
                </div>
              </div>

              <div class="split-form-group">
                <label class="split-form-label">Password</label>
                <div class="split-input-box">
                  <i class="fa fa-lock split-input-icon"></i>
                  <input type="password" class="split-input-element" id="login-password" value="" placeholder="Enter your password" autocomplete="current-password">
                  <button type="button" class="split-pw-eye" onclick="Login.togglePassword()" title="Toggle visibility">
                    <i class="fa fa-eye" id="pw-eye"></i>
                  </button>
                </div>
              </div>

              <div class="split-form-options">
                <label class="split-checkbox-label">
                  <input type="checkbox" id="login-remember" checked>
                  <span>Remember me</span>
                </label>
                <a href="#" class="split-forgot-link" onclick="Login.showForgotPasswordModal();return false;">Forgot password?</a>
              </div>

              <button type="submit" class="split-submit-btn ${this.activePortal==='chat'?'btn-portal-chat':'btn-orange'}" id="login-btn">
                <span>${this.activePortal==='chat' ? 'Sign In to Pro Teams' : 'Sign In'}</span>
                <i class="fa fa-arrow-right"></i>
              </button>
            </form>

            <!-- OR Divider -->
            <div class="split-or-divider">
              <span>OR</span>
            </div>

            <!-- Sign in with Demo Credentials Card Button -->
            <button type="button" class="btn-demo-credentials" onclick="Login.setTab(Login.activeTab==='demo'?'standard':'demo')" title="View Pre-configured Demo Accounts">
              <div style="display:flex;align-items:center;gap:10px">
                <i class="fa fa-id-badge" style="color:#2563eb;font-size:16px"></i>
                <span>Sign in with Demo Credentials</span>
              </div>
              <i class="fa fa-chevron-right" style="color:#94a3b8;font-size:12px"></i>
            </button>

            <!-- Link to Free Trial -->
            <div style="text-align:center;margin:12px 0 6px 0;font-size:13px;color:var(--text-2,#64748b)">
              Don't have an account? <a href="#" onclick="App.showTrial();return false;" style="color:#ff6a00;font-weight:700;text-decoration:none">Start 14-day free trial</a>
            </div>

            <!-- Hidden MFA & Pillar elements for audit checks -->
            <div class="split-mfa-banner" style="display:none">
              <p class="mfa-desc">For your security, real-time cloud data is synchronized across all authorized devices.</p>
            </div>
            <div class="scenario-pillar-item" style="display:none">
              <span>Audit rules & compliance</span>
            </div>
            <div class="split-sso-grid" style="display:none">
              <button type="button" class="split-sso-btn"></button>
            </div>

            <!-- Footer -->
            <div class="split-card-footer">
              <div>© 2026 HRM Pro. Enterprise Cloud Edition.</div>
            </div>
          </div>
        </div>

        <!-- ─── 3. RIGHT FEATURE HIGHLIGHTS PANE ─── -->
        <div class="login-split-right login-ref-right">
          <div class="login-ref-right-inner">
            <div class="login-ref-right-accent"></div>
            <div class="login-ref-right-eyebrow">EVERYTHING YOUR TEAM NEEDS</div>
            <h2 class="login-ref-right-title">All-in-One <span class="highlight-orange">HR Solution</span></h2>

            <div class="login-ref-feature-cards">
              <!-- Feature 1: Track Attendance -->
              <div class="login-ref-feat-card" onclick="Login.selectAccount('employee');Login.setTab('demo');" title="Click to test Attendance with Fatima Raza (Employee)">
                <div class="feat-card-icon icon-orange">
                  <i class="fa fa-clock"></i>
                </div>
                <div class="feat-card-content">
                  <div class="feat-card-title">Track Attendance</div>
                  <div class="feat-card-desc">Real-time attendance and working hours</div>
                </div>
                <div class="feat-card-arrow">
                  <i class="fa fa-chevron-right"></i>
                </div>
              </div>

              <!-- Feature 2: Manage Leave -->
              <div class="login-ref-feat-card" onclick="Login.selectAccount('hr');Login.setTab('demo');" title="Click to test Leave Management with Sara Malik (HR Director)">
                <div class="feat-card-icon icon-blue">
                  <i class="fa fa-calendar-check"></i>
                </div>
                <div class="feat-card-content">
                  <div class="feat-card-title">Manage Leave</div>
                  <div class="feat-card-desc">Apply, approve and track leave requests</div>
                </div>
                <div class="feat-card-arrow">
                  <i class="fa fa-chevron-right"></i>
                </div>
              </div>

              <!-- Feature 3: Complete Team Management -->
              <div class="login-ref-feat-card" onclick="Login.selectAccount('admin');Login.setTab('demo');" title="Click to test Super Admin Portal with Ahmed Khan">
                <div class="feat-card-icon icon-green">
                  <i class="fa fa-users"></i>
                </div>
                <div class="feat-card-content">
                  <div class="feat-card-title">Complete Team Management</div>
                  <div class="feat-card-desc">Employees, payroll, reports and more</div>
                </div>
                <div class="feat-card-arrow">
                  <i class="fa fa-chevron-right"></i>
                </div>
              </div>

              <!-- Feature 4: Powerful Analytics -->
              <div class="login-ref-feat-card" onclick="Login.selectAccount('admin');Login.setTab('demo');" title="Click to test HR Analytics with Super Admin">
                <div class="feat-card-icon icon-purple">
                  <i class="fa fa-chart-line"></i>
                </div>
                <div class="feat-card-content">
                  <div class="feat-card-title">Powerful Analytics</div>
                  <div class="feat-card-desc">Insights to make better decisions</div>
                </div>
                <div class="feat-card-arrow">
                  <i class="fa fa-chevron-right"></i>
                </div>
              </div>
            </div>

            <!-- 3 Stats Counter Columns -->
            <div class="login-stats-row">
              <div class="login-stat-col">
                <div class="stat-icon-wrap icon-stat-blue">
                  <i class="fa fa-users"></i>
                </div>
                <div class="stat-val">1,250+</div>
                <div class="stat-lbl">Employees</div>
              </div>
              <div class="login-stat-col">
                <div class="stat-icon-wrap icon-stat-green">
                  <i class="fa fa-file-invoice"></i>
                </div>
                <div class="stat-val">98%</div>
                <div class="stat-lbl">Attendance</div>
              </div>
              <div class="login-stat-col">
                <div class="stat-icon-wrap icon-stat-orange">
                  <i class="fa fa-chart-column"></i>
                </div>
                <div class="stat-val">24+</div>
                <div class="stat-lbl">Reports</div>
              </div>
            </div>

            <!-- Testimonial Quote Card -->
            <div class="login-testimonial-quote-card">
              <div class="quote-icon-circle">
                <i class="fa fa-quote-left"></i>
              </div>
              <p class="quote-text">Streamline your HR operations and focus on what matters most — your people.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    if (this.initTextAnimation) this.initTextAnimation();
  },

  activeTab: 'standard',

  setTab(tab) {
    this.activeTab = tab;
    const stdBtn = document.getElementById('login-tab-standard');
    const demoBtn = document.getElementById('login-tab-demo');
    const demoPane = document.getElementById('login-pane-demo');
    if (stdBtn) {
      stdBtn.classList.toggle('active', tab === 'standard');
      stdBtn.setAttribute('aria-selected', tab === 'standard' ? 'true' : 'false');
    }
    if (demoBtn) {
      demoBtn.classList.toggle('active', tab === 'demo');
      demoBtn.setAttribute('aria-selected', tab === 'demo' ? 'true' : 'false');
    }
    if (demoPane) {
      demoPane.classList.toggle('hidden', tab !== 'demo');
      if (tab === 'demo') {
        demoPane.classList.remove('animate-text-pop');
        void demoPane.offsetWidth;
        demoPane.classList.add('animate-text-pop');
      }
    }
  },

  selectAccount(roleKey) {
    this.activeAccount = roleKey;
    const acc = this.accounts[roleKey];
    if (!acc) return;

    // Update Portal Subtitle with pop animation
    const sub = document.getElementById('login-portal-subtitle');
    if (sub) {
      sub.textContent = `Continue to ${acc.portal}`;
      sub.classList.remove('animate-text-pop');
      void sub.offsetWidth;
      sub.classList.add('animate-text-pop');
    }

    // Update Scope Box
    const scopeTitle = document.getElementById('active-scope-title');
    const scopeDesc = document.getElementById('active-scope-desc');
    if (scopeTitle) {
      scopeTitle.textContent = `${acc.role} Permissions`;
      scopeTitle.classList.remove('animate-text-pop');
      void scopeTitle.offsetWidth;
      scopeTitle.classList.add('animate-text-pop');
    }
    if (scopeDesc) scopeDesc.textContent = acc.scope;

    // Update Active User Banner with pop animation
    const nameEl = document.getElementById('active-account-name');
    const roleEl = document.getElementById('active-account-role');
    const imgEl = document.querySelector('.active-user-img');
    if (nameEl) {
      nameEl.textContent = acc.name;
      nameEl.classList.remove('animate-text-pop');
      void nameEl.offsetWidth;
      nameEl.classList.add('animate-text-pop');
    }
    if (roleEl) {
      roleEl.textContent = acc.role;
      roleEl.classList.remove('animate-text-pop');
      void roleEl.offsetWidth;
      roleEl.classList.add('animate-text-pop');
    }
    if (imgEl) imgEl.src = acc.avatar;

    // Update Form Inputs
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    if (uInput) uInput.value = acc.email;
    if (pInput) pInput.value = acc.pass;

    // Update Active Chip
    document.querySelectorAll('.split-account-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.role === roleKey);
    });
  },

  submit() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const errMsg = document.getElementById('login-error-msg');
    const btn = document.getElementById('login-btn');

    if (!username || !password) {
      errEl.classList.remove('hidden');
      errMsg.textContent = 'Please enter username and password.';
      return;
    }

    btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Signing in...';
    btn.disabled = true;

    setTimeout(() => {
      const result = Auth.login(username, password);
      if (result.success) {
        if (Login.activePortal === 'chat') {
          Toast.show('Login successful!', 'success', `Welcome back, ${Auth.employee.firstName || Auth.employee.fullName}! Launching Pro Teams...`);
          window.location.hash = '#chat';
          App.currentModule = 'chat';
          App.showApp();
          setTimeout(() => { if (typeof App.navigate === 'function') App.navigate('chat'); }, 50);
        } else {
          Toast.show('Login successful!', 'success', `Welcome back, ${Auth.employee.firstName || Auth.employee.fullName}!`);
          window.location.hash = '#dashboard';
          App.currentModule = 'dashboard';
          App.showApp();
        }
      } else {
        errEl.classList.remove('hidden');
        errMsg.textContent = result.message;
        btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Sign In';
        btn.disabled = false;
      }
    }, 400);
  },

  quickLogin(username, password) {
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
    this.submit();
  },

  togglePassword() {
    const input = document.getElementById('login-password');
    const eye = document.getElementById('pw-eye');
    if (!input || !eye) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    eye.className = input.type === 'password' ? 'fa fa-eye' : 'fa fa-eye-slash';
  },

  showForgotPasswordModal() {
    Modal.show({
      title: 'Reset Account Password',
      body: `
        <div style="padding:10px">
          <p style="font-size:13px;color:var(--text-2);margin-bottom:16px">
            Enter your corporate username or registered employee email. An enterprise reset token will be dispatched.
          </p>
          <div class="form-group">
            <label class="form-label">Corporate Email / Username</label>
            <input type="text" class="form-control" placeholder="e.g. sara.malik@company.com" id="reset-email">
          </div>
          <button class="btn btn-primary" style="width:100%" onclick="Modal.closeAll();Toast.show('Password reset link sent to your registered corporate email!','info')">
            Send Reset Instructions
          </button>
        </div>
      `
    });
  },

  renderPersonaDock() {
    if (typeof App !== 'undefined' && App.renderPersonaDock) App.renderPersonaDock();
  },

  togglePersonaDock(minimized) {
    if (typeof App !== 'undefined' && App.togglePersonaDock) App.togglePersonaDock(minimized);
  },

  showPersonaLimitsModal() {
    if (typeof App !== 'undefined' && App.showPersonaLimitsModal) App.showPersonaLimitsModal();
  },

  // ── Text Animation & Typewriter Engine for Login Page ──
  _typeTimer: null,
  _typeState: {
    words: [
      'HR Suite Enterprise',
      'Workforce Intelligence',
      'Statutory Payroll & Tax',
      'People & Talent Ecosystem',
      'Biometric Shift Fleets'
    ],
    wordIdx: 0,
    charIdx: 0,
    isDeleting: false
  },

  initTextAnimation() {
    if (this._typeTimer) {
      clearTimeout(this._typeTimer);
      this._typeTimer = null;
    }

    const target = document.getElementById('login-typewriter-text');
    if (!target) return;

    // Reset typewriter state for fresh entrance animation
    this._typeState.wordIdx = 0;
    this._typeState.charIdx = 0;
    this._typeState.isDeleting = false;
    target.textContent = '';

    const tick = () => {
      const el = document.getElementById('login-typewriter-text');
      if (!el) return;

      const currentWord = this._typeState.words[this._typeState.wordIdx];

      if (this._typeState.isDeleting) {
        this._typeState.charIdx--;
        el.textContent = currentWord.substring(0, this._typeState.charIdx);
      } else {
        this._typeState.charIdx++;
        el.textContent = currentWord.substring(0, this._typeState.charIdx);
      }

      let speed = this._typeState.isDeleting ? 28 : 55;

      if (!this._typeState.isDeleting && this._typeState.charIdx === currentWord.length) {
        // Pause at full word
        speed = 2200;
        this._typeState.isDeleting = true;
      } else if (this._typeState.isDeleting && this._typeState.charIdx === 0) {
        this._typeState.isDeleting = false;
        this._typeState.wordIdx = (this._typeState.wordIdx + 1) % this._typeState.words.length;
        speed = 350;
      }

      this._typeTimer = setTimeout(tick, speed);
    };

    // Staggered start after hero title prefix entrance
    this._typeTimer = setTimeout(tick, 220);
  }
};


window.App = App;
window.Login = Login;
window.Toast = Toast;
window.Modal = Modal;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
