const fs = require('fs');
const path = require('path');

console.log('🔧 Updating js/app.js with Modern UI features...');
const appPath = path.join(__dirname, '../js/app.js');
let code = fs.readFileSync(appPath, 'utf8');

// 1. Update init() to restore saved theme, accent color, and table density
const oldInitTheme = `      // Apply saved appearance settings immediately
        if (typeof DB !== 'undefined' && DB.getObj) {
          const s = DB.getObj('settings') || {};
          const savedTheme = s.theme || 'light';
          document.documentElement.setAttribute('data-theme', savedTheme);
          if (s.accentColor) {
            document.documentElement.style.setProperty('--primary', s.accentColor);
            document.documentElement.style.setProperty('--primary-light', s.accentColor + 'cc');
            document.documentElement.style.setProperty('--primary-dark', s.accentColor);
            document.documentElement.style.setProperty('--primary-glow', s.accentColor + '33');
          }
          if (s.compactMode === true || s.compactMode === 'true') {
            document.body.classList.add('compact-mode');
            document.documentElement.classList.add('compact-mode');
          }
          const appEl = document.getElementById('app');
          if (appEl && s.sidebarPosition === 'right') {
            appEl.style.flexDirection = 'row-reverse';
          }
        }`;

const newInitTheme = `      // Apply saved appearance settings immediately (Theme, Accent, Density)
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
          if (appEl && s.sidebarPosition === 'right') {
            appEl.style.flexDirection = 'row-reverse';
          }
        }`;

if (code.includes(oldInitTheme)) {
  code = code.replace(oldInitTheme, newInitTheme);
  console.log('✅ Updated init() appearance restore logic');
} else {
  console.log('⚠️ Could not find exact oldInitTheme block');
}

// 2. Replace renderTopbar()
const oldTopbarStart = '  renderTopbar() {';
const oldTopbarEnd = '    // Load dynamic notifications\n    this.refreshNotifications();';

const idxStart = code.indexOf(oldTopbarStart);
const idxEnd = code.indexOf(oldTopbarEnd);

if (idxStart !== -1 && idxEnd !== -1) {
  const newTopbarCode = `  renderTopbar() {
    const topbar = document.getElementById('topbar');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const isDark = currentTheme !== 'light';
    const currentDensity = document.body.getAttribute('data-table-density') || 'comfortable';
    const currentAccent = document.documentElement.getAttribute('data-accent') || 'blue';

    topbar.innerHTML = \`
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        <button class="mobile-menu-btn" id="mobile-menu-btn" onclick="App.openMobileSidebar()" title="Toggle Menu">
          <i class="fa fa-bars"></i>
        </button>
        <div class="topbar-breadcrumb-wrap">
          <div class="topbar-title" id="topbar-title">Dashboard</div>
          <div class="topbar-breadcrumbs" id="topbar-breadcrumbs">
            <span class="crumb-home" onclick="App.navigate('dashboard')"><i class="fa fa-home"></i> Home</span>
            <span class="crumb-sep">/</span>
            <span class="crumb-active" id="topbar-crumb-active">Overview</span>
          </div>
        </div>
      </div>

      <div class="topbar-search" id="topbar-search-wrap" onclick="App.openCommandPalette()" style="cursor:pointer" title="Click or press Ctrl+K to open Spotlight">
        <i class="fa fa-terminal" style="color:var(--primary)"></i>
        <input type="text" placeholder="Spotlight command search… (Ctrl+K)" id="global-search"
          readonly style="cursor:pointer;pointer-events:none">
        <span class="search-shortcut">Ctrl+K</span>
      </div>

      <div class="topbar-actions">
        \${typeof Company !== 'undefined' ? Company.renderSwitcherHTML() : ''}
        \${['superadmin', 'hr_manager'].includes(Auth.role) ? \`
          <button class="topbar-btn" onclick="App.navigate('administration'); setTimeout(() => Administration.switchSection('blueprint'), 100);" title="103-Model Enterprise Architecture Blueprint Explorer" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:20px;color:var(--primary);font-size:11.5px;font-weight:700;cursor:pointer;margin-right:4px">
            <i class="fa fa-cubes"></i>
            <span>103 Models</span>
          </button>
        \` : ''}

        <!-- Quick Spotlight Launcher Button -->
        <button class="topbar-btn" onclick="App.openCommandPalette()" title="Command Palette & Quick Actions (Ctrl+K)">
          <i class="fa fa-magnifying-glass"></i>
        </button>

        <!-- Table Density Toggle Button -->
        <button class="topbar-btn" id="density-toggle-btn" onclick="App.toggleTableDensity()" title="Table Row Density: \${currentDensity === 'compact' ? 'Compact (Click for Spacious)' : 'Spacious (Click for Compact)'}">
          <i class="fa \${currentDensity === 'compact' ? 'fa-compress' : 'fa-expand'}"></i>
        </button>

        <!-- Brand Accent Color Picker -->
        <div style="position:relative">
          <button class="topbar-btn" id="accent-btn" onclick="App.toggleAccentPicker(event)" title="Accent Color Palette">
            <span class="accent-swatch" style="background:var(--primary);width:15px;height:15px;display:inline-block"></span>
          </button>
          <div class="accent-picker-dropdown" id="accent-picker-dropdown">
            <div style="font-size:10.5px;font-weight:800;color:var(--text-muted);padding:4px 8px;text-transform:uppercase;letter-spacing:0.4px">Brand Accent</div>
            <div class="accent-option-row" onclick="App.setAccentColor('blue')">
              <span class="accent-swatch" style="background:#2563eb"></span> <span>Corporate Cobalt</span>
            </div>
            <div class="accent-option-row" onclick="App.setAccentColor('emerald')">
              <span class="accent-swatch" style="background:#059669"></span> <span>Emerald Forest</span>
            </div>
            <div class="accent-option-row" onclick="App.setAccentColor('violet')">
              <span class="accent-swatch" style="background:#7c3aed"></span> <span>Modern Violet</span>
            </div>
            <div class="accent-option-row" onclick="App.setAccentColor('rose')">
              <span class="accent-swatch" style="background:#e11d48"></span> <span>Crimson Rose</span>
            </div>
            <div class="accent-option-row" onclick="App.setAccentColor('amber')">
              <span class="accent-swatch" style="background:#d97706"></span> <span>Amber Gold</span>
            </div>
          </div>
        </div>

        <!-- Dark / Light Mode Switcher -->
        <button class="theme-toggle-btn topbar-btn" onclick="App.toggleTheme()" title="\${isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}">
          <i class="fa \${isDark ? 'fa-sun' : 'fa-moon'}"></i>
        </button>

        <!-- Activity History Drawer -->
        <button class="topbar-btn" id="history-btn" onclick="App.toggleHistoryDrawer()" title="Activity History (Ctrl+H)">
          <i class="fa fa-clock-rotate-left"></i>
        </button>

        <!-- Team Collaboration Chat -->
        <button class="topbar-btn" id="chat-topbar-btn" onclick="Chat.toggleDrawer()" title="Team Collaboration & Chat (Ctrl+M)" style="position:relative">
          <i class="fa fa-comments"></i>
          <span class="badge-dot" id="chat-badge-dot" style="display:none"></span>
          <span id="chat-unread-badge" style="display:none;position:absolute;top:2px;right:2px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:9px;font-weight:800;border-radius:10px;padding:1px 5px;line-height:1.2;box-shadow:0 0 6px rgba(99,102,241,0.6)"></span>
        </button>

        <!-- Notifications -->
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

        <!-- Profile Button -->
        <button class="topbar-btn" onclick="App.navigate('profile')" title="My Profile">
          <div class="avatar avatar-sm" style="background:\${Utils.avatarColor(Auth.employee.id)};width:28px;height:28px;font-size:11px;border-radius:50%;overflow:hidden">
            \${Auth.employee.photo ? \`<img src="\${Auth.employee.photo}" style="width:100%;height:100%;object-fit:cover" alt="\${Auth.employee.fullName}">\` : Utils.avatarInitials(Auth.employee.fullName)}
          </div>
        </button>
      </div>
    \`;\n\n`;

  code = code.slice(0, idxStart) + newTopbarCode + code.slice(idxEnd);
  console.log('✅ Replaced renderTopbar() with modern breadcrumb, spotlight, density & accent controls');
} else {
  console.error('❌ Could not locate renderTopbar block');
}

// 3. Update navigate() to update breadcrumbs
const oldNavUpdate = `    if (title) title.textContent = moduleLabels[module] || module;
    if (subtitle) subtitle.textContent = \`\${new Date().toLocaleDateString('en-PK', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}\`;`;

const newNavUpdate = `    if (title) title.textContent = moduleLabels[module] || module;
    if (subtitle) subtitle.textContent = \`\${new Date().toLocaleDateString('en-PK', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}\`;
    this.updateBreadcrumbs(module, subView);`;

if (code.includes(oldNavUpdate)) {
  code = code.replace(oldNavUpdate, newNavUpdate);
  console.log('✅ Updated navigate() to refresh breadcrumbs');
}

// 4. Update toggleTheme() to save to localStorage
const oldToggleTheme = `  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    // Save setting
    const settings = DB.getObj('settings') || {};
    settings.theme = next;
    DB.set('settings', settings);`;

const newToggleTheme = `  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hrm_theme_mode', next);
    // Save setting
    const settings = DB.getObj('settings') || {};
    settings.theme = next;
    DB.set('settings', settings);`;

if (code.includes(oldToggleTheme)) {
  code = code.replace(oldToggleTheme, newToggleTheme);
  console.log('✅ Updated toggleTheme() with localStorage persistence');
}

// 5. Append the UI suite methods before App closing or right after setupKeyboardShortcuts
const oldShortcutsBlock = `  setupKeyboardShortcuts() {
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
      // Ctrl+M or Cmd+M → toggle team collaboration / chat drawer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (typeof Chat !== 'undefined' && Chat.toggleDrawer) {
          Chat.toggleDrawer();
        }
      }
      // Escape → close modals / search / history / chat
      if (e.key === 'Escape') {
        Modal.closeAll();
        App.closeHistoryDrawer();
        if (typeof Chat !== 'undefined' && Chat.closeDrawer) {
          Chat.closeDrawer();
        }
        document.getElementById('search-dropdown')?.classList.remove('open');
        document.getElementById('notif-dropdown')?.classList.remove('open');
      }
    });
  },`;

const newShortcutsAndSuite = `  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const paletteOverlay = document.getElementById('cmd-palette-overlay');
      const isPaletteOpen = paletteOverlay && paletteOverlay.classList.contains('open');

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

      // Ctrl+K or Cmd+K → open Spotlight Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
        return;
      }
      // Ctrl+H or Cmd+H → toggle history drawer (Browser-style)
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
      // Escape → close modals / search / history / chat / palette
      if (e.key === 'Escape') {
        Modal.closeAll();
        App.closeHistoryDrawer();
        App.closeCommandPalette();
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
    const modLabel = moduleLabels[module] || (module ? module.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase()) : 'Dashboard');
    if (title) title.textContent = modLabel;
    if (crumbActive) {
      if (subView) {
        crumbActive.textContent = \`\${modLabel} › \${subView.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase())}\`;
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
      btn.innerHTML = \`<i class="fa \${next === 'compact' ? 'fa-compress' : 'fa-expand'}"></i>\`;
      btn.title = \`Table Row Density: \${next === 'compact' ? 'Compact (Click for Spacious)' : 'Spacious (Click for Compact)'}\`;
    }
    Toast.show(\`Table Density: \${next === 'compact' ? 'Compact View (Higher row density)' : 'Comfortable View (Spacious spacing)'}\`, 'info');
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
    Toast.show(\`Brand Accent theme set to \${accent.toUpperCase()}\`, 'success');
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
    overlay?.classList.remove('open');
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
      sub: \`Open \${i.label} module\`,
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
        results.push({ type: 'header', label: \`👥 Employees (\${matchedEmps.length})\` });
        matchedEmps.forEach(e => results.push({
          type: 'employee',
          id: 'emp_' + e.id,
          empId: e.id,
          title: e.fullName,
          sub: \`\${e.empNo} • \${Utils.getDeptName(e.departmentId)} • \${Utils.getDesigName(e.designationId)}\`,
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
      listEl.innerHTML = \`
        <div style="text-align:center;padding:36px 16px;color:var(--text-muted)">
          <i class="fa fa-magnifying-glass" style="font-size:28px;margin-bottom:12px;opacity:0.6;display:block"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text)">No matches found for "\${Utils.escapeHtml(q)}"</div>
          <div style="font-size:12px;margin-top:4px">Try searching for an employee name, module, or quick action command</div>
        </div>
      \`;
      if (statEl) statEl.textContent = '0 results';
      return;
    }

    if (statEl) statEl.textContent = \`\${this.commandPaletteItems.length} command\${this.commandPaletteItems.length > 1 ? 's' : ''} available\`;

    let html = '';
    let selectableIndex = 0;

    results.forEach(r => {
      if (r.type === 'header') {
        html += \`<div class="cmd-group-label">\${r.label}</div>\`;
      } else {
        const isSelected = selectableIndex === this.commandPaletteIndex;
        const indexAttr = selectableIndex;
        selectableIndex++;

        let avatarHtml = \`<div class="cmd-item-icon"><i class="fa \${r.icon || 'fa-bolt'}"></i></div>\`;
        if (r.type === 'employee') {
          if (r.photo) {
            avatarHtml = \`<div class="cmd-item-icon" style="overflow:hidden;padding:0"><img src="\${r.photo}" style="width:100%;height:100%;object-fit:cover" alt="\${r.title}"></div>\`;
          } else {
            avatarHtml = \`<div class="cmd-item-icon" style="background:\${Utils.avatarColor(r.empId)};color:white;font-weight:700;font-size:12px">\${Utils.avatarInitials(r.title)}</div>\`;
          }
        }

        html += \`
          <div class="cmd-item \${isSelected ? 'selected' : ''}" data-index="\${indexAttr}" onclick="App.triggerCommandByIndex(\${indexAttr})">
            <div class="cmd-item-left">
              \${avatarHtml}
              <div style="min-width:0">
                <div class="cmd-item-title">\${Utils.escapeHtml(r.title)}</div>
                <div class="cmd-item-sub">\${Utils.escapeHtml(r.sub || '')}</div>
              </div>
            </div>
            <div class="cmd-item-badge">\${Utils.escapeHtml(r.badge || '')}</div>
          </div>
        \`;
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
  },`;

if (code.includes(oldShortcutsBlock)) {
  code = code.replace(oldShortcutsBlock, newShortcutsAndSuite);
  console.log('✅ Updated setupKeyboardShortcuts() and appended Command Palette, Density & Accent methods');
} else {
  console.error('❌ Could not locate oldShortcutsBlock');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('🎉 Successfully updated js/app.js!');
