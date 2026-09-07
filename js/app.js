// ============================================================
// HRM SYSTEM — App Bootstrap, Router & Core Shell
// ============================================================

const App = {
  currentModule: null,

  init() {
    DB.init();
    Auth.init();
    // Apply saved theme immediately (default to light mode)
    const savedTheme = DB.getObj('settings')?.theme || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (Auth.isLoggedIn) {
      this.showApp();
    } else {
      this.showLogin();
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    const settings = DB.getObj('settings') || {};
    settings.theme = next;
    DB.set('settings', settings);
    const icon = document.querySelector('#login-theme-btn i');
    if (icon) {
      icon.className = next === 'dark' ? 'fa fa-sun' : 'fa fa-moon';
    }
    const label = document.querySelector('#login-theme-btn span');
    if (label) {
      label.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
    const topbarIcon = document.querySelector('#theme-toggle-btn i');
    if (topbarIcon) {
      topbarIcon.className = next === 'dark' ? 'fa fa-sun' : 'fa fa-moon';
    }
  },

  showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    Login.render();
  },

  showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    this.renderSidebar();
    this.renderTopbar();
    this.setupKeyboardShortcuts();
    this.navigate('dashboard');
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
  },

  renderSidebar() {
    const emp = Auth.employee;
    const items = Auth.getSidebarItems();
    const sidebar = document.getElementById('sidebar');
    const avatarColor = Utils.avatarColor(emp.id);
    const initials = Utils.avatarInitials(emp.fullName);

    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="logo-icon">HR</div>
        <div class="logo-text">
          <h1 id="company-sidebar-name">${DB.getObj('settings')?.companyName || 'HRM Pro'}</h1>
          <span>HR Management System</span>
        </div>
        <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle sidebar">
          <i class="fa fa-chevron-left"></i>
        </button>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar-sm avatar" style="background:${avatarColor};overflow:hidden">${emp.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName}">` : initials}</div>
        <div class="user-info">
          <div class="name">${emp.fullName}</div>
          <div class="role-badge">${Auth.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Main Menu</div>
        ${items.map(item => `
          <div class="nav-item" data-module="${item.id}" data-label="${item.label}"
            onclick="App.navigate('${item.id}')"
            data-tooltip="${item.label}">
            <i class="fa ${item.icon}"></i>
            <span>${item.label}</span>
          </div>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" onclick="App.logout()">
          <i class="fa fa-right-from-bracket"></i>
          <span>Logout</span>
        </button>
      </div>
    `;

    // Sidebar overlay for mobile
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      overlay.onclick = () => App.closeMobileSidebar();
      document.body.appendChild(overlay);
    }

    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const icon = document.querySelector('#sidebar-toggle i');
      const isCollapsed = sidebar.classList.contains('collapsed');
      icon.className = isCollapsed ? 'fa fa-chevron-right' : 'fa fa-chevron-left';
      localStorage.setItem('hrm_sidebar_collapsed', isCollapsed ? '1' : '0');
    });
  },

  renderTopbar() {
    const topbar = document.getElementById('topbar');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const isDark = currentTheme !== 'light';
    topbar.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <button class="mobile-menu-btn" id="mobile-menu-btn" onclick="App.openMobileSidebar()">
          <i class="fa fa-bars"></i>
        </button>
        <div>
          <div class="topbar-title" id="topbar-title">Dashboard</div>
          <div class="topbar-subtitle" id="topbar-subtitle">Welcome back, ${Auth.employee.firstName}!</div>
        </div>
      </div>
      <div class="topbar-search" id="topbar-search-wrap">
        <i class="fa fa-search"></i>
        <input type="text" placeholder="Search employees… (Ctrl+K)" id="global-search"
          oninput="App.handleGlobalSearch(this.value)"
          onfocus="App.showSearchDropdown()"
          autocomplete="off">
        <span class="search-shortcut">Ctrl+K</span>
        <div class="search-dropdown" id="search-dropdown"></div>
      </div>
      <div class="topbar-actions">
        <button class="theme-toggle-btn" onclick="App.toggleTheme()" title="${isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}">
          <i class="fa ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
        </button>
        <button class="topbar-btn" id="history-btn" onclick="App.toggleHistoryDrawer()" title="Activity History (Ctrl+H)">
          <i class="fa fa-clock-rotate-left"></i>
        </button>
        <div style="position:relative">
          <button class="topbar-btn" id="notif-btn" onclick="App.toggleNotifications()" title="Notifications">
            <i class="fa fa-bell"></i>
            <span class="badge-dot" id="notif-badge-dot"></span>
          </button>
          <div class="notif-dropdown" id="notif-dropdown">
            <div class="notif-header">Notifications <span class="badge badge-primary" id="notif-count" style="margin-left:8px">0</span></div>
            <div id="notif-list"></div>
          </div>
        </div>
        <button class="topbar-btn" onclick="App.navigate('profile')" title="My Profile">
          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(Auth.employee.id)};width:28px;height:28px;font-size:11px;border-radius:50%;overflow:hidden">
            ${Auth.employee.photo ? `<img src="${Auth.employee.photo}" style="width:100%;height:100%;object-fit:cover" alt="${Auth.employee.fullName}">` : Utils.avatarInitials(Auth.employee.fullName)}
          </div>
        </button>
      </div>
    `;

    // Load dynamic notifications
    this.refreshNotifications();

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notif-btn')) {
        document.getElementById('notif-dropdown')?.classList.remove('open');
      }
      if (!e.target.closest('#topbar-search-wrap')) {
        document.getElementById('search-dropdown')?.classList.remove('open');
      }
    });
  },

  refreshNotifications() {
    const leaves = DB.get('leave_requests');
    const reviews = DB.get('performance_reviews');
    const logs = DB.get('audit_logs').slice(0, 5);
    const role = Auth.role;

    const notifs = [];

    // Pending leaves for approvers
    if (role === 'superadmin' || role === 'hr_manager' || role === 'dept_manager') {
      const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
      const mgrPending = leaves.filter(l => l.status === 'manager_approved').length;
      if (pendingLeaves > 0) notifs.push({ color: 'var(--warning)', text: `${pendingLeaves} leave request${pendingLeaves > 1 ? 's' : ''} pending approval`, time: 'Action required', icon: 'fa-calendar-xmark' });
      if (mgrPending > 0) notifs.push({ color: 'var(--info)', text: `${mgrPending} leave${mgrPending > 1 ? 's' : ''} awaiting HR approval`, time: 'Action required', icon: 'fa-user-check' });
    }

    // Employee-specific
    if (role === 'employee') {
      const myLeaves = leaves.filter(l => l.employeeId === Auth.employee.id && (l.status === 'approved' || l.status === 'rejected'));
      myLeaves.slice(0, 2).forEach(l => {
        notifs.push({ color: l.status === 'approved' ? 'var(--success)' : 'var(--danger)', text: `Your leave request was ${l.status}`, time: Utils.formatDate(l.approvedOn || l.appliedOn), icon: l.status === 'approved' ? 'fa-circle-check' : 'fa-circle-xmark' });
      });
    }

    // Pending reviews
    if (role === 'superadmin' || role === 'hr_manager') {
      const pendingRev = reviews.filter(r => r.status === 'pending').length;
      if (pendingRev > 0) notifs.push({ color: 'var(--accent)', text: `${pendingRev} performance review${pendingRev > 1 ? 's' : ''} pending`, time: 'Action required', icon: 'fa-chart-line' });
    }

    // Upcoming birthdays
    const today = Utils.today();
    const todayMMDD = today.slice(5);
    const bdays = DB.get('employees').filter(e => e.dob?.slice(5) === todayMMDD && e.status === 'active');
    if (bdays.length > 0) notifs.push({ color: 'var(--success)', text: `🎂 ${bdays.map(e => e.firstName).join(', ')} birthday today!`, time: 'Today', icon: 'fa-cake-candles' });

    // Recent audit log
    if (logs.length > 0) {
      const l = logs[0];
      notifs.push({ color: 'var(--primary)', text: l.details, time: new Date(l.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }), icon: 'fa-scroll' });
    }

    const count = notifs.length;
    const badge = document.getElementById('notif-badge-dot');
    const countEl = document.getElementById('notif-count');
    const listEl = document.getElementById('notif-list');

    if (badge) badge.style.display = count > 0 ? 'block' : 'none';
    if (countEl) countEl.textContent = count;
    if (listEl) {
      listEl.innerHTML = count === 0
        ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px"><i class="fa fa-bell-slash" style="font-size:24px;margin-bottom:8px;display:block"></i>No new notifications</div>`
        : notifs.map(n => `
            <div class="notif-item">
              <div class="notif-dot" style="background:${n.color}"></div>
              <div>
                <div class="notif-text">${n.text}</div>
                <div class="notif-time">${n.time}</div>
              </div>
            </div>
          `).join('');
    }
  },

  navigate(module) {
    // Role-based module access guard
    if (module === 'employees' && Auth.role === 'employee') {
      // Regular employees don't have the employees list, redirect to their own profile
      setTimeout(() => Employees.renderProfile(Auth.employee.id, true), 50);
      module = 'profile';
    }
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.module === module);
    });

    this.currentModule = module;
    const title = document.getElementById('topbar-title');
    const subtitle = document.getElementById('topbar-subtitle');
    const content = document.getElementById('page-content');

    const moduleLabels = {
      dashboard: 'Dashboard', employees: 'Employees', attendance: 'Attendance',
      leaves: 'Leave Management', payroll: 'Payroll', performance: 'Performance',
      recruitment: 'Recruitment', events: 'Events & Announcements',
      reports: 'Reports', administration: 'Administration', settings: 'Settings', profile: 'My Profile',
    };

    if (title) title.textContent = moduleLabels[module] || module;
    if (subtitle) subtitle.textContent = `${new Date().toLocaleDateString('en-PK', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}`;

    content.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

    // Close mobile sidebar if open
    this.closeMobileSidebar();

    setTimeout(() => {
      try {
        switch (module) {
          case 'dashboard':     Dashboard.render(); break;
          case 'employees':     Employees.render(); break;
          case 'attendance':    Attendance.render(); break;
          case 'leaves':        Leaves.render(); break;
          case 'payroll':       Payroll.render(); break;
          case 'performance':   Performance.render(); break;
          case 'recruitment':   Recruitment.render(); break;
          case 'events':        Events.render(); break;
          case 'reports':       Reports.render(); break;
          case 'administration':Administration.render(); break;
          case 'settings':      Settings.render(); break;
          case 'profile':       Employees.renderProfile(Auth.employee.id, true); break;
          default:              content.innerHTML = '<div class="empty-state"><i class="fa fa-construction"></i><h3>Coming Soon</h3><p>This module is under development.</p></div>';
        }
      } catch(e) {
        console.error(e);
        content.innerHTML = `<div class="empty-state"><i class="fa fa-triangle-exclamation"></i><h3>Module Error</h3><p>${e.message}</p></div>`;
      }
    }, 50);
  },

  logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    Auth.logout();
    this.showLogin();
    Toast.show('Logged out successfully', 'success');
  },

  toggleNotifications() {
    this.refreshNotifications();
    document.getElementById('notif-dropdown')?.classList.toggle('open');
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
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
  },

  openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.add('mobile-open');
    overlay?.classList.add('active');
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.remove('mobile-open');
    overlay?.classList.remove('active');
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
    const emps = allEmps.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.empNo.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.cnic||'').includes(q) ||
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
    Employees.renderProfile(empId);
    // Update topbar
    const title = document.getElementById('topbar-title');
    if (title) title.textContent = 'Employees';
    // Mark employees nav active
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.module === 'employees');
    });
    this.currentModule = 'employees';
  },

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K → focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search');
        if (input) { input.focus(); input.select(); }
      }
      // Ctrl+H or Cmd+H → toggle history drawer (Browser-style)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        App.toggleHistoryDrawer();
      }
      // Escape → close modals / search / history
      if (e.key === 'Escape') {
        Modal.closeAll();
        App.closeHistoryDrawer();
        document.getElementById('search-dropdown')?.classList.remove('open');
        document.getElementById('notif-dropdown')?.classList.remove('open');
      }
    });
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
  }
};

// ── TOAST SYSTEM ──
const Toast = {
  show(message, type = 'info', subtitle = '') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa ${icons[type] || icons.info} toast-icon"></i>
      <div>
        <div class="toast-msg">${message}</div>
        ${subtitle ? `<div class="toast-sub">${subtitle}</div>` : ''}
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
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

// ── LOGIN MODULE ──
const Login = {
  render() {
    const container = document.getElementById('login-page');
    const demos = Auth.getDemoAccounts();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    container.innerHTML = `
      <button class="login-theme-toggle" onclick="App.toggleTheme()" title="Toggle Theme" id="login-theme-btn">
        <i class="fa ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
        <span>${isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      <div class="login-centered-card animate-slide-up">
        <div class="login-header-center">
          <div class="login-badge-pill">
            <i class="fa fa-shield-check"></i> Enterprise HR Suite
          </div>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px">
            <div class="logo-icon" style="width:44px;height:44px;font-size:20px;border-radius:12px">HR</div>
            <div style="text-align:left">
              <h2 class="login-brand-title">HRM Pro</h2>
              <span class="login-brand-sub-title">Human Resource Management</span>
            </div>
          </div>
          <p class="login-brand-sub">Sign in with your corporate credentials to access your portal</p>
        </div>

        <div id="login-error" class="alert alert-danger hidden" style="margin-bottom:16px;border-radius:10px">
          <i class="fa fa-circle-xmark"></i>
          <span id="login-error-msg"></span>
        </div>

        <div class="login-input-wrap">
          <i class="fa fa-user login-input-icon"></i>
          <input type="text" class="login-input-field" id="login-username" placeholder="Username or employee ID" autocomplete="username">
        </div>

        <div class="login-input-wrap">
          <i class="fa fa-lock login-input-icon"></i>
          <input type="password" class="login-input-field" id="login-password" placeholder="Password" autocomplete="current-password" onkeydown="if(event.key==='Enter')Login.submit()">
          <button type="button" class="login-pw-toggle" onclick="Login.togglePassword()" title="Toggle password visibility">
            <i class="fa fa-eye" id="pw-eye"></i>
          </button>
        </div>

        <button class="login-submit-btn" onclick="Login.submit()" id="login-btn">
          <i class="fa fa-arrow-right-to-bracket"></i> Sign In to Workspace
        </button>

        <div style="margin-top:24px">
          <div class="login-divider">
            <div class="login-divider-line"></div>
            <span class="login-divider-text">Quick Demo Access</span>
            <div class="login-divider-line"></div>
          </div>
          <div class="demo-role-grid">
            ${demos.map(d => `
              <div class="demo-role-card" onclick="Login.quickLogin('${d.username}','${d.password}')" title="Sign in as ${d.role}">
                <div class="demo-role-icon" style="background:${d.color}15;border:1px solid ${d.color}35;color:${d.color}">
                  <i class="fa ${d.icon}"></i>
                </div>
                <div style="flex:1;min-width:0">
                  <div class="demo-role-name truncate">${d.role}</div>
                  <div class="demo-role-user">${d.username}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="login-footer-lock">
          <i class="fa fa-lock"></i> 256-bit SSL Encrypted • Role-Based Access Control
        </div>
      </div>
    `;
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
        Toast.show('Login successful!', 'success', `Welcome back, ${Auth.employee.firstName}!`);
        App.showApp();
      } else {
        errEl.classList.remove('hidden');
        errMsg.textContent = result.message;
        btn.innerHTML = '<i class="fa fa-right-to-bracket"></i> Sign In';
        btn.disabled = false;
      }
    }, 500);
  },

  quickLogin(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
    this.submit();
  },

  togglePassword() {
    const input = document.getElementById('login-password');
    const eye = document.getElementById('pw-eye');
    input.type = input.type === 'password' ? 'text' : 'password';
    eye.className = input.type === 'password' ? 'fa fa-eye' : 'fa fa-eye-slash';
  }
};

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
