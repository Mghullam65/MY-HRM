// ============================================================
// HRM SYSTEM — App Bootstrap, Router & Core Shell
// ============================================================

const App = {
  currentModule: null,

  init() {
    try {
      DB.init();
      Auth.init();
      if (typeof LiveNotifications !== 'undefined' && LiveNotifications.init) {
        LiveNotifications.init();
      }
      // Apply saved theme immediately (default to light mode)
      const savedTheme = (typeof DB !== 'undefined' && DB.getObj) ? (DB.getObj('settings')?.theme || 'light') : 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);

      const loggedIn = typeof Auth !== 'undefined' && (typeof Auth.isLoggedIn === 'function' ? Auth.isLoggedIn() : !!Auth.user);
      if (loggedIn) {
        this.showApp();
      } else {
        this.showLanding();
      }
    } catch (err) {
      console.error('App.init error:', err);
      this.showLanding();
    }
  },

  showLanding() {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'block';
    if (modDetail) modDetail.style.display = 'none';
    if (login) login.style.display = 'none';
    if (trial) trial.style.display = 'none';
    if (app) app.style.display = 'none';
    if (typeof Landing !== 'undefined' && Landing.render) {
      Landing.render();
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  showModule(moduleId) {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    if (modDetail) modDetail.style.display = 'block';
    if (login) login.style.display = 'none';
    if (trial) trial.style.display = 'none';
    if (app) app.style.display = 'none';
    if (typeof Landing !== 'undefined' && Landing.renderModuleDetail) {
      Landing.renderModuleDetail(moduleId);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  showLogin() {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    if (modDetail) modDetail.style.display = 'none';
    if (login) login.style.display = 'flex';
    if (trial) trial.style.display = 'none';
    if (app) app.style.display = 'none';
    Login.render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  showTrial(plan = 'Pro') {
    const landing = document.getElementById('landing-page');
    const modDetail = document.getElementById('module-detail-page');
    const login = document.getElementById('login-page');
    const trial = document.getElementById('trial-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    if (modDetail) modDetail.style.display = 'none';
    if (login) login.style.display = 'none';
    if (trial) trial.style.display = 'flex';
    if (app) app.style.display = 'none';
    if (typeof Trial !== 'undefined' && Trial.render) {
      Trial.render(plan);
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
        ${['superadmin', 'hr_manager'].includes(Auth.role) ? `
          <button class="topbar-btn" onclick="App.navigate('administration'); setTimeout(() => Administration.switchSection('blueprint'), 100);" title="103-Model Enterprise Architecture Blueprint Explorer" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:20px;color:var(--primary);font-size:11.5px;font-weight:700;cursor:pointer;margin-right:6px">
            <i class="fa fa-cubes"></i>
            <span>103 Models</span>
          </button>
        ` : ''}
        ${typeof I18n !== 'undefined' ? I18n.renderLanguageSelector('topbar') + I18n.renderCurrencySelector('topbar') : ''}
        <button class="theme-toggle-btn" onclick="App.toggleTheme()" title="${isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}">
          <i class="fa ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
        </button>
        <button class="topbar-btn" id="history-btn" onclick="App.toggleHistoryDrawer()" title="Activity History (Ctrl+H)">
          <i class="fa fa-clock-rotate-left"></i>
        </button>
        <div style="position:relative">
          <button class="topbar-btn" id="notif-btn" onclick="App.toggleNotifications()" title="Notifications" style="position:relative">
            <i class="fa fa-bell"></i>
            <span class="badge-dot" id="notif-badge-dot"></span>
            <span id="notif-badge-pill" style="display:none;position:absolute;top:2px;right:2px;background:var(--danger);color:#ffffff;font-size:9.5px;font-weight:800;border-radius:10px;padding:1px 5px;line-height:1.2;box-shadow:0 0 6px rgba(239,68,68,0.7)"></span>
          </button>
          <div class="notif-dropdown" id="notif-dropdown" style="width:375px">
            <div class="notif-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border)">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-weight:700">Notifications</span>
                <span class="badge badge-primary" id="notif-count" style="margin-left:2px">0</span>
                <span class="live-status-pill" title="Real-Time Synchronization Active"><span class="live-status-dot"></span> LIVE</span>
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <button class="btn btn-ghost btn-xs" id="desktop-notif-btn" onclick="LiveNotifications.toggleDesktopPermission()" title="Enable Desktop Push Alerts" style="padding:2px 6px;font-size:11px">
                  <i class="fa fa-bell"></i>
                </button>
                <button class="btn btn-ghost btn-xs" style="font-size:10.5px;padding:2px 6px;color:var(--text-3)" onclick="App.markAllNotificationsRead()" title="Mark all notifications as read">Mark all read</button>
              </div>
            </div>
            <div id="notif-list" style="max-height:380px;overflow-y:auto"></div>
            <div style="padding:8px 14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface);font-size:11px;color:var(--text-3)">
              <span><span class="live-status-dot" style="display:inline-block;vertical-align:middle;margin-right:4px"></span> Real-Time Live Sync</span>
              <a href="javascript:void(0)" onclick="LiveNotifications.sendTestAlert()" style="color:var(--primary);font-weight:700">⚡ Test Live Alert</a>
            </div>
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
      dashboard: ['employees', 'attendance', 'leave_requests', 'events', 'announcements', 'users'],
      employees: ['employees', 'departments', 'designations', 'branches', 'documents', 'document_expiries', 'users'],
      attendance: ['attendance', 'attendance_corrections', 'shifts', 'overtime_tokens'],
      leaves: ['leave_requests', 'leave_balances', 'leave_types'],
      payroll: ['salary', 'allowances', 'deductions', 'loans', 'employee_increments'],
      performance: ['performance_reviews', 'kpis', 'goals'],
      recruitment: ['recruitment', 'applications', 'interviews'],
      assets: ['assets', 'asset_assignments'],
      expenses: ['expense_claims'],
      helpdesk: ['helpdesk_tickets'],
      events: ['events', 'announcements'],
      administration: ['users', 'roles', 'permissions', 'audit_logs'],
      settings: ['settings'],
      profile: ['employees', 'documents', 'emergency_contacts', 'users']
    };

    const current = this.currentModule;
    const shouldRefresh = changedTables.length === 0 || (current && moduleTableMap[current]?.some(t => changedTables.includes(t)));
    if (shouldRefresh && this.currentModule && document.getElementById('app')?.style.display !== 'none') {
      console.log(`[App] Auto-refreshing module "${this.currentModule}" due to remote sync (${changedTables.join(', ')})`);
      this.navigate(this.currentModule);
    }
  },

  navigate(module, subView) {
    // Role-based module access guards
    if (module === 'administration' && !['superadmin', 'hr_manager'].includes(Auth.role)) {
      Toast.show('403 Forbidden: Access to Administration is restricted.', 'error');
      if (this.currentModule && this.currentModule !== 'administration') return;
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
        setTimeout(() => Employees.renderProfile(Auth.employee.id, true), 50);
        module = 'profile';
      }
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
      recruitment: 'Recruitment', assets: 'Assets & Inventory',
      expenses: 'Expense Claims', helpdesk: 'Helpdesk & Grievance',
      events: 'Events & Announcements', reports: 'Reports',
      administration: 'Administration', settings: 'Settings', profile: 'My Profile',
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
          case 'assets':        Assets.render(); break;
          case 'expenses':      Expenses.render(); break;
          case 'helpdesk':      Helpdesk.render(); break;
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

// ── LOGIN MODULE (SPLIT-SCREEN SAAS PORTAL) ──
const Login = {
  activeAccount: 'admin',

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
    }
  },

  render() {
    const container = document.getElementById('login-page');
    if (!container) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const acc = this.accounts[this.activeAccount] || this.accounts.admin;

    container.innerHTML = `
      <div class="login-split-page">
        <!-- ─── LEFT HERO & BRAND PANE ─── -->
        <div class="login-split-left">
          <div class="split-left-inner">
            <!-- Brand Header -->
            <a href="#" class="split-left-brand" onclick="App.showLanding();return false;">
              <div class="landing-brand-icon" style="background:#2563eb;color:#ffffff;border-radius:10px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:18px">
                <i class="fa fa-users"></i>
              </div>
              <div>
                <div class="landing-brand-name" style="font-size:22px;font-weight:900;color:var(--text,#0f172a);letter-spacing:-0.5px">HRM Pro</div>
                <div class="landing-brand-tag" style="font-size:11px;color:var(--text-3,#64748b);font-weight:600">Human Resource Information System</div>
              </div>
            </a>

            <!-- Welcome Headline (Matching Reference Screenshot) -->
            <div class="split-left-welcome-wrap">
              <h1 class="split-hero-title">Welcome back,<br><span class="text-blue-highlight" id="login-hero-name">${acc.name.split(' ')[0]}</span></h1>
              <p class="split-hero-subtitle">Sign in to manage your workforce, payroll, attendance, recruitment, reports, and settings.</p>
            </div>

            <!-- Central Visual Scenario Stage (Matching Reference Artwork) -->
            <div class="login-scenario-stage">
              <!-- Floating Metric 1: Employees -->
              <div class="scenario-floating-badge badge-employees animate-float-slow">
                <div class="badge-icon-box" style="background:#eff6ff;color:#2563eb">
                  <i class="fa fa-users"></i>
                </div>
                <div class="badge-content">
                  <div class="badge-title">Employees</div>
                  <div class="badge-number">1,248</div>
                  <div class="badge-trend text-success"><i class="fa fa-arrow-up"></i> 5.2%</div>
                </div>
              </div>

              <!-- Floating Metric 2: Attendance Rate -->
              <div class="scenario-floating-badge badge-attendance animate-float-medium">
                <div class="badge-icon-box" style="background:#f0fdf4;color:#16a34a">
                  <i class="fa fa-chart-column"></i>
                </div>
                <div class="badge-content">
                  <div class="badge-title">Attendance Rate</div>
                  <div class="badge-number">94.6%</div>
                  <div class="badge-trend text-success"><i class="fa fa-arrow-up"></i> 2.3%</div>
                </div>
              </div>

              <!-- Floating Metric 3: Open Positions -->
              <div class="scenario-floating-badge badge-positions animate-float-slow">
                <div class="badge-icon-box" style="background:#eff6ff;color:#2563eb">
                  <i class="fa fa-briefcase"></i>
                </div>
                <div class="badge-content">
                  <div class="badge-title">Open Positions</div>
                  <div class="badge-number">24</div>
                  <div class="badge-trend text-success"><i class="fa fa-arrow-up"></i> 9.1%</div>
                </div>
              </div>

              <!-- Floating Metric 4: Payroll Due -->
              <div class="scenario-floating-badge badge-payroll animate-float-medium">
                <div class="badge-icon-box" style="background:#fdf4ff;color:#a855f7">
                  <i class="fa fa-coins"></i>
                </div>
                <div class="badge-content">
                  <div class="badge-title">Payroll Due</div>
                  <div class="badge-number">$312,450</div>
                  <div class="badge-subtext">Due in 5 days</div>
                </div>
              </div>

              <!-- Scene Illustration Artwork -->
              <div class="scenario-illustration-wrap">
                <img src="assets/login_security_scene.jpg" alt="Enterprise Security Scenario" class="scenario-scene-img">
              </div>
            </div>

            <!-- Bottom 3 Feature Highlights (Directly from Reference Image) -->
            <div class="scenario-bottom-pillars">
              <div class="scenario-pillar-item">
                <div class="pillar-icon-wrap" style="color:#2563eb;background:#eff6ff">
                  <i class="fa fa-shield-check"></i>
                </div>
                <div>
                  <strong>Secure Access</strong>
                  <span>Role-based access and permissions</span>
                </div>
              </div>

              <div class="scenario-pillar-item">
                <div class="pillar-icon-wrap" style="color:#0284c7;background:#f0f9ff">
                  <i class="fa fa-lock"></i>
                </div>
                <div>
                  <strong>Encrypted Data</strong>
                  <span>Enterprise-grade data encryption</span>
                </div>
              </div>

              <div class="scenario-pillar-item">
                <div class="pillar-icon-wrap" style="color:#6366f1;background:#eef2ff">
                  <i class="fa fa-user-gear"></i>
                </div>
                <div>
                  <strong>Admin Portal</strong>
                  <span>Manage your organization with confidence</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── RIGHT FORM PANE ─── -->
        <div class="login-split-right">
          <div class="split-right-topbar">
            <button class="btn-split-back" onclick="App.showLanding()">
              <i class="fa fa-arrow-left"></i> Back to Home
            </button>
            <button class="login-theme-toggle-simple" onclick="App.toggleTheme()" title="Toggle Theme">
              <i class="fa ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
            </button>
          </div>

          <div class="login-split-card animate-slide-up">
            <div class="split-card-header">
              <h2 class="split-card-title">Sign in to your account</h2>
              <p class="split-card-subtitle" id="login-portal-subtitle">Continue to ${acc.portal}</p>
            </div>

            <!-- Active User Profile Bar -->
            <div class="active-user-badge-bar" id="active-user-banner">
              <div class="active-user-avatar-wrap">
                <img src="${acc.avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=2563eb&color=fff'" alt="${acc.name}" class="active-user-img">
                <span class="active-user-online-dot"></span>
              </div>
              <div class="active-user-details">
                <div class="active-user-name" id="active-account-name">${acc.name}</div>
                <div class="active-user-role" id="active-account-role">${acc.role}</div>
              </div>
              <div class="active-user-status-pill">
                <span class="pulse-dot"></span> Online
              </div>
            </div>

            <!-- Quick Account Switcher Chips -->
            <div class="split-account-chips-row">
              <button class="split-account-chip ${this.activeAccount==='admin'?'active':''}" data-role="admin" onclick="Login.selectAccount('admin')">Super Admin</button>
              <button class="split-account-chip ${this.activeAccount==='hr'?'active':''}" data-role="hr" onclick="Login.selectAccount('hr')">HR Director</button>
              <button class="split-account-chip ${this.activeAccount==='manager'?'active':''}" data-role="manager" onclick="Login.selectAccount('manager')">Dept Manager</button>
              <button class="split-account-chip ${this.activeAccount==='employee'?'active':''}" data-role="employee" onclick="Login.selectAccount('employee')">Employee</button>
              <button class="split-account-chip ${this.activeAccount==='onboarding'?'active':''}" data-role="onboarding" onclick="Login.selectAccount('onboarding')">Onboarding</button>
            </div>

            <!-- Error Banner -->
            <div id="login-error" class="alert alert-danger hidden" style="margin-bottom:16px;border-radius:8px">
              <i class="fa fa-circle-xmark"></i>
              <span id="login-error-msg"></span>
            </div>

            <!-- Form -->
            <form onsubmit="event.preventDefault();Login.submit();">
              <div class="split-form-group">
                <label class="split-form-label">Email Address or Username</label>
                <div class="split-input-box">
                  <i class="fa fa-envelope split-input-icon"></i>
                  <input type="text" class="split-input-element" id="login-username" value="${acc.email}" placeholder="name@company.com" autocomplete="username">
                </div>
              </div>

              <div class="split-form-group">
                <label class="split-form-label">Password</label>
                <div class="split-input-box">
                  <i class="fa fa-lock split-input-icon"></i>
                  <input type="password" class="split-input-element" id="login-password" value="${acc.pass}" placeholder="••••••••••••" autocomplete="current-password">
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

              <button type="submit" class="split-submit-btn" id="login-btn">
                <i class="fa fa-arrow-right-to-bracket"></i> Sign In
              </button>
            </form>

            <!-- SSO / Alternative Options -->
            <div class="split-or-divider">
              <span>or continue with</span>
            </div>

            <div class="split-sso-grid">
              <button class="split-sso-btn" onclick="Login.quickLogin('sara.malik','hr123')" title="Quick Sign in as HR Director">
                <img src="https://www.gstatic.com/images/branding/product/1x/gsuite_48dp.png" alt="Google Workspace" style="width:16px;height:16px;object-fit:contain" onerror="this.remove()">
                <span>Google Workspace</span>
              </button>
              <button class="split-sso-btn" onclick="Login.quickLogin('admin','admin123')" title="Quick Sign in as Super Admin">
                <i class="fa-brands fa-microsoft" style="color:#00a4ef;font-size:15px"></i>
                <span>Microsoft 365</span>
              </button>
            </div>

            <!-- MFA Notice Banner -->
            <div class="split-mfa-banner">
              <div class="mfa-icon-shield">
                <i class="fa fa-shield-halved"></i>
              </div>
              <div>
                <strong class="mfa-title">Multi-factor authentication enabled</strong>
                <p class="mfa-desc">For your security, real-time cloud data is synchronized across all authorized devices.</p>
              </div>
            </div>

            <!-- Link to Free Trial -->
            <div style="text-align:center;margin:18px 0;font-size:13.5px;color:var(--text-2,#64748b)">
              Don't have an account? <a href="#" onclick="App.showTrial();return false;" style="color:#2563eb;font-weight:700;text-decoration:none">Start 14-day free trial</a>
            </div>

            <!-- Footer -->
            <div class="split-card-footer">
              <div>© 2026 HRM Pro. Enterprise Cloud Edition.</div>
              <div style="display:flex;gap:12px;margin-top:4px">
                <a href="#" onclick="return false;">Privacy Policy</a> •
                <a href="#" onclick="return false;">Security Protocols</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  selectAccount(roleKey) {
    this.activeAccount = roleKey;
    const acc = this.accounts[roleKey];
    if (!acc) return;

    // Update Portal Subtitle
    const sub = document.getElementById('login-portal-subtitle');
    if (sub) sub.textContent = `Continue to ${acc.portal}`;

    // Update Scope Box
    const scopeTitle = document.getElementById('active-scope-title');
    const scopeDesc = document.getElementById('active-scope-desc');
    if (scopeTitle) scopeTitle.textContent = `${acc.role} Permissions`;
    if (scopeDesc) scopeDesc.textContent = acc.scope;

    // Update Active User Banner
    const nameEl = document.getElementById('active-account-name');
    const roleEl = document.getElementById('active-account-role');
    const imgEl = document.querySelector('.active-user-img');
    const heroNameEl = document.getElementById('login-hero-name');
    if (nameEl) nameEl.textContent = acc.name;
    if (roleEl) roleEl.textContent = acc.role;
    if (imgEl) imgEl.src = acc.avatar;
    if (heroNameEl) heroNameEl.textContent = acc.name.split(' ')[0];

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
        Toast.show('Login successful!', 'success', `Welcome back, ${Auth.employee.firstName}!`);
        App.showApp();
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
  }
};

window.App = App;
window.Login = Login;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
