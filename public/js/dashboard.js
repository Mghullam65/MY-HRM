// ============================================================
// HRM SYSTEM — Dashboard Module
// ============================================================

const Dashboard = {
  charts: {},
  inboxCollapsed: typeof localStorage !== 'undefined' ? localStorage.getItem('hrm_inbox_collapsed') === 'true' : false,
  inboxFilter: 'all',
  tickerSpeeds: ['0.5x', '0.4x', '0.3x', '0.2x', '0.1x'],
  tickerSpeed: (function() {
    const valid = ['0.5x', '0.4x', '0.3x', '0.2x', '0.1x'];
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('hrm_ticker_speed') : null;
    return valid.includes(saved) ? saved : '0.3x';
  })(),

  getTickerDuration(speed) {
    const durations = {
      '0.5x': '22s',
      '0.4x': '32s',
      '0.3x': '48s',
      '0.2x': '72s',
      '0.1x': '105s'
    };
    return durations[speed] || '48s';
  },

  toggleInboxCollapse() {
    this.inboxCollapsed = !this.inboxCollapsed;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hrm_inbox_collapsed', this.inboxCollapsed ? 'true' : 'false');
    }
    this.refreshInbox();
  },

  setInboxFilter(filter) {
    this.inboxFilter = filter;
    this.refreshInbox();
  },

  setCompanyFilter(companyId) {
    if (typeof Company !== 'undefined' && Company.switchCompany) {
      Company.switchCompany(companyId);
    } else {
      DB.setActiveCompanyId(companyId);
      this.render();
    }
  },

  renderMultiCompanyPortfolio(allEmployees, att, salary, companies, activeCompanyId) {
    if (!['superadmin', 'hr_manager'].includes(Auth.role)) return '';

    // Self-heal: ensure every employee has a clean companyId assignment in browser localStorage
    let hasMissingCompany = false;
    allEmployees.forEach((e, idx) => {
      if (!e.companyId || isNaN(Number(e.companyId))) {
        e.companyId = (idx % 3) + 1;
        hasMissingCompany = true;
      }
    });
    if (hasMissingCompany && typeof DB !== 'undefined' && DB.set) {
      DB.set('employees', allEmployees);
    }

    const today = Utils.today();
    const activeEmps = allEmployees.filter(e => (e.status || '').toLowerCase() === 'active');
    const totalHeadcount = activeEmps.length;
    const totalPayroll = activeEmps.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const todayAtt = att.filter(a => a.date === today);
    const totalPresent = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
    const groupAttRate = totalHeadcount > 0 ? Math.round((totalPresent / totalHeadcount) * 100) : 94;

    // ── Context Mode A: Individual Subsidiary Workspace Active ──
    // Collapses the 4 cards into a single sleek info bar to prevent clutter
    if (activeCompanyId !== 'all') {
      const activeComp = companies.find(c => String(c.id) === String(activeCompanyId)) || companies[0];
      const cEmps = allEmployees.filter(e => Number(e.companyId) === Number(activeComp.id) && (e.status || '').toLowerCase() === 'active');
      const cPayroll = cEmps.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

      return `
        <div class="card mb-20" style="padding:12px 18px;background:var(--surface);border:1.5px solid ${activeComp.primaryColor || 'var(--primary)'};border-radius:12px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="width:36px;height:36px;border-radius:8px;background:${activeComp.primaryColor || 'var(--primary)'};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900">
              ${activeComp.logoText || 'CO'}
            </span>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <h4 style="margin:0;font-size:14px;font-weight:800;color:var(--text)">${activeComp.name}</h4>
                <span class="badge badge-primary" style="font-size:9.5px;font-weight:700">Active Subsidiary</span>
              </div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">
                <strong>${cEmps.length} Employees</strong> • Monthly Payroll: <strong>PKR ${cPayroll.toLocaleString()}</strong> • NTN: ${activeComp.ntn} • Bank: ${activeComp.disbursementBank}
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-primary btn-xs" onclick="Dashboard.setCompanyFilter('all')" style="font-weight:700">
              <i class="fa fa-layer-group"></i> Switch to Consolidated Group View
            </button>
            <button class="btn btn-secondary btn-xs" onclick="Company.showWorkspaceSwitchModal()">
              <i class="fa fa-up-right-and-down-left-from-center"></i> Change
            </button>
          </div>
        </div>
      `;
    }

    // ── Context Mode B: Consolidated Group View ('all') ──
    // Clean 4-card holding telemetry matrix without the redundant button row
    return `
      <div class="card mb-20" style="padding:18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-sm);margin-bottom:20px">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.12);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:14px">
                <i class="fa fa-building-shield"></i>
              </span>
              <h3 style="margin:0;font-size:15px;font-weight:800;color:var(--text)">
                Multi-Company Holding Portfolio — Consolidated Group Telemetry
              </h3>
              <span class="badge badge-primary" style="font-size:10px;font-weight:700">3 Subsidiaries Registered</span>
            </div>
            <p style="margin:2px 0 0 36px;font-size:11.5px;color:var(--text-3)">
              Click any subsidiary card below to focus the dashboard on that company's operations.
            </p>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-secondary btn-xs" onclick="Company.showWorkspaceSwitchModal()" title="Open Full Workspace Selector Modal">
              <i class="fa fa-up-right-and-down-left-from-center"></i> Switch Workspace Modal
            </button>
            <button class="btn btn-ghost btn-xs" onclick="App.navigate('companies')" title="Manage Legal Entities & Inter-Company Transfers">
              <i class="fa fa-gear"></i> Manage Entities
            </button>
          </div>
        </div>

        <!-- 4-Column Company Cards Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px">
          <!-- Card 1: Consolidated Group Overview -->
          <div onclick="Dashboard.setCompanyFilter('all')" class="card" style="padding:14px;cursor:pointer;border:2px solid var(--primary);background:rgba(99,102,241,0.06);border-radius:10px;transition:all 0.15s">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="width:26px;height:26px;border-radius:6px;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900">🏛️</span>
                <strong style="font-size:13px;color:var(--text)">Apex Group (Consolidated)</strong>
              </div>
              <span class="badge badge-primary" style="font-size:9px">Active View</span>
            </div>
            <div style="font-size:11.5px;color:var(--text-2);line-height:1.8">
              <div style="display:flex;justify-content:space-between"><span>Group Workforce:</span> <strong>${totalHeadcount} Staff</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Monthly Payroll:</span> <strong style="font-family:monospace;color:var(--success)">PKR ${totalPayroll.toLocaleString()}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Attendance Rate:</span> <strong style="color:var(--primary)">${groupAttRate}% Present</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Tax Portfolios:</span> <strong>3 FBR NTNs</strong></div>
            </div>
          </div>

          <!-- Cards 2, 3, 4: Individual Subsidiaries -->
          ${companies.map(c => {
            const cEmps = allEmployees.filter(e => Number(e.companyId) === Number(c.id) && (e.status || '').toLowerCase() === 'active');
            const cPayroll = cEmps.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
            const cEmpIds = cEmps.map(e => e.id);
            const cPresent = todayAtt.filter(a => cEmpIds.includes(a.employeeId) && (a.status === 'present' || a.status === 'late')).length;
            const cAttRate = cEmps.length > 0 ? Math.round((cPresent / cEmps.length) * 100) : 95;

            return `
              <div onclick="Dashboard.setCompanyFilter(${c.id})" class="card" style="padding:14px;cursor:pointer;border:1px solid var(--border);background:var(--surface-2);border-radius:10px;transition:all 0.15s" title="Click to view ${c.tradeName}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="width:26px;height:26px;border-radius:6px;background:${c.primaryColor || 'var(--primary)'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900">
                      ${c.logoText || 'CO'}
                    </span>
                    <strong style="font-size:12.5px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px" title="${c.name}">${c.tradeName || c.name}</strong>
                  </div>
                  <span style="font-size:10px;color:var(--primary);font-weight:700">Filter ➔</span>
                </div>
                <div style="font-size:11.5px;color:var(--text-2);line-height:1.8">
                  <div style="display:flex;justify-content:space-between"><span>Workforce:</span> <strong style="color:var(--primary)">${cEmps.length} Employees</strong></div>
                  <div style="display:flex;justify-content:space-between"><span>Monthly Payroll:</span> <strong style="font-family:monospace;color:var(--success)">PKR ${cPayroll.toLocaleString()}</strong></div>
                  <div style="display:flex;justify-content:space-between"><span>Attendance:</span> <strong style="color:var(--primary)">${cAttRate}% Present</strong></div>
                  <div style="display:flex;justify-content:space-between"><span>NTN / Bank:</span> <span style="font-size:10px;color:var(--text-3)">${c.ntn} • ${c.disbursementBank?.split(' ')[0] || 'Bank'}</span></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  refreshInbox() {
    const container = document.getElementById('dashboard-action-inbox');
    if (container) {
      container.outerHTML = this.renderActionCenterInbox();
    }
  },

  renderHeadlinesTicker(tickerItemsHtml) {
    const defaultItems = `
      <span class="ticker-item holiday" onclick="App.navigate('events')" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0">
        <span class="ticker-tag" style="background:#4f46e5;color:#ffffff;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:5px;line-height:1.2"><i class="fa fa-umbrella-beach"></i> Company Holiday</span>
        <span class="ticker-text" style="font-size:12px;font-weight:600;color:var(--text,#1e293b);white-space:nowrap">Eid ul Fitr - 10 to 12 Apr 2026 (Head Office)</span>
      </span>
      <span class="ticker-sep" style="color:#cbd5e1;font-size:11px;flex-shrink:0">•</span>
      <span class="ticker-item update" onclick="App.navigate('payroll')" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0">
        <span class="ticker-tag" style="background:#f97316;color:#ffffff;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:5px;line-height:1.2"><i class="fa fa-circle-check"></i> System Update</span>
        <span class="ticker-text" style="font-size:12px;color:var(--text-2,#475569);white-space:nowrap">Payroll module updated successfully</span>
      </span>
      <span class="ticker-sep" style="color:#cbd5e1;font-size:11px;flex-shrink:0">•</span>
      <span class="ticker-item alert" onclick="App.navigate('leaves')" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0">
        <span class="ticker-tag" style="background:#10b981;color:#ffffff;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:5px;line-height:1.2"><i class="fa fa-clock"></i> Biometric Gateway</span>
        <span class="ticker-text" style="font-size:12px;color:var(--text,#1e293b);white-space:nowrap">Live TCP/IP biometric synchronization active</span>
      </span>
      <span class="ticker-sep" style="color:#cbd5e1;font-size:11px;flex-shrink:0">•</span>
    `;
    const baseContent = (tickerItemsHtml && tickerItemsHtml.trim().length > 0) ? tickerItemsHtml : defaultItems;
    const loopingContent = baseContent + ' ' + baseContent;

    return `
      <div style="background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:8px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.04);width:100%;height:62px;min-height:62px;overflow:hidden">
        <!-- Orange Headlines Label -->
        <div style="display:flex;align-items:center;gap:6px;color:#ea580c;font-weight:800;font-size:13px;flex-shrink:0">
          <i class="fa fa-bullhorn" style="font-size:13.5px"></i>
          <span>Headlines</span>
        </div>

        <!-- Animated Ticker Viewport & Continuous Moving Track -->
        <div class="ticker-track-wrap" style="flex:1;overflow:hidden;position:relative;white-space:nowrap;padding:4px 0">
          <div id="dash-ticker-track" class="ticker-track" style="display:inline-flex;align-items:center;gap:20px;animation:tickerMarquee 40s linear infinite;will-change:transform">
            ${loopingContent}
          </div>
        </div>

        <!-- Right Controls: Speed Controller (Single Adjustment Selector: 0.1x - 0.5x) + Pause/Play + View All -->
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <div class="ticker-speed-single" style="display:inline-flex;align-items:center;background:var(--surface,#f1f5f9);border:1px solid var(--border,#e2e8f0);border-radius:7px;padding:2px 6px;gap:4px" title="Headline Speed Adjustment (0.1x to 0.5x)">
            <i class="fa fa-gauge-high" style="font-size:10.5px;color:#ea580c"></i>
            <select id="ticker-speed-select" onchange="Dashboard.setTickerSpeed(this.value)" style="border:none;background:transparent;font-size:10.5px;font-weight:800;color:var(--text,#1e293b);cursor:pointer;outline:none;padding:1px 0" title="Adjust headlines scroll speed">
              ${['0.1x', '0.2x', '0.3x', '0.4x', '0.5x'].map(sp => `
                <option value="${sp}" ${(this.tickerSpeed === sp || (!this.tickerSpeed && sp === '0.2x')) ? 'selected' : ''}>${sp}</option>
              `).join('')}
            </select>
          </div>

          <button id="ticker-play-btn" type="button" onclick="Dashboard.toggleTickerPlay()" class="btn btn-ghost btn-xs" style="padding:3px 7px;color:var(--text-3);border-radius:6px;cursor:pointer;border:1px solid var(--border,#e2e8f0);background:var(--card,#ffffff)" title="Pause Headlines">
            <i class="fa fa-pause" style="font-size:11px"></i>
          </button>
          <a href="javascript:void(0)" onclick="Dashboard.showAllHeadlinesModal()" style="color:#2563eb;font-weight:700;font-size:12px;text-decoration:none;white-space:nowrap;margin-left:2px" title="View All Events & Notices">
            View All
          </a>
        </div>
      </div>
    `;
  },

  renderHeroPunchClockWidget(myTodayAtt) {
    const now = new Date();
    const hrs = now.getHours() % 12;
    const mins = now.getMinutes();
    const secs = now.getSeconds();
    const hrAngle = (hrs * 30) + (mins * 0.5) + (secs * (0.5 / 60));
    const minAngle = (mins * 6) + (secs * 0.1);
    const secAngle = secs * 6;
    const dayName = now.toLocaleDateString('en-PK', { weekday: 'long' });
    const dayNum = now.getDate();
    const monthYear = now.toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });

    // Holiday and Approved Leave detection for today
    const today = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : now.toISOString().slice(0, 10);
    const holidays = (typeof DB !== 'undefined' && DB.get ? DB.get('holidays') : []) || [];
    const todayHoliday = holidays.find(h => h.date === today);

    const curEmp = Auth.employee || (typeof DB !== 'undefined' && DB.find ? DB.find('employees', Auth.user?.employeeId || 1) : null) || {};
    const myId = curEmp.id || Auth.user?.employeeId || 1;
    const allLeaves = (typeof DB !== 'undefined' && DB.get ? (DB.get('leave_requests') || DB.get('leaves') || []) : []);
    const myApprovedLeave = allLeaves.find(l => 
      (String(l.employeeId) === String(myId) || String(l.employeeId) === String(curEmp.empNo)) &&
      (l.status === 'approved' || l.status === 'manager_approved') &&
      l.startDate <= today && l.endDate >= today
    );

    const rawIn = myTodayAtt?.timeIn || myTodayAtt?.checkIn;
    const rawOut = myTodayAtt?.timeOut || myTodayAtt?.checkOut;
    const isCheckedIn = !!rawIn;
    const isCheckedOut = isCheckedIn && !!rawOut;

    let initialTimerStr = '--H --M';
    let initialCenterTimer = '--H --M';
    let shiftStatusHtml = 'Regular Shift: 09:00 - 18:00 (8h Duty)';

    if (isCheckedOut) {
      initialTimerStr = myTodayAtt.hrs || (typeof Attendance !== 'undefined' && Attendance.calcHours ? Attendance.calcHours(rawIn, rawOut) : '8h 23m');
      initialCenterTimer = initialTimerStr;
      shiftStatusHtml = '<span style="color:#059669"><i class="fa fa-flag-checkered"></i> Daily Shift Completed</span>';
    } else if (isCheckedIn) {
      const [inH, inM, inS] = rawIn.split(':').map(Number);
      if (!isNaN(inH) && !isNaN(inM)) {
        const inTotalSecs = (inH * 3600) + (inM * 60) + (isNaN(inS) ? 0 : inS);
        const nowTotalSecs = (now.getHours() * 3600) + (now.getMinutes() * 60) + secs;
        const diffSecs = Math.max(0, nowTotalSecs - inTotalSecs);
        const eh = Math.floor(diffSecs / 3600);
        const em = Math.floor((diffSecs % 3600) / 60);
        const es = diffSecs % 60;
        initialTimerStr = `${String(eh).padStart(2, '0')}H ${String(em).padStart(2, '0')}M ${String(es).padStart(2, '0')}S`;
        initialCenterTimer = `${String(eh).padStart(2, '0')}H ${String(em).padStart(2, '0')}M`;

        const standardDutySecs = 8 * 3600;
        if (diffSecs >= standardDutySecs) {
          const otSecs = diffSecs - standardDutySecs;
          const otH = Math.floor(otSecs / 3600);
          const otM = Math.floor((otSecs % 3600) / 60);
          shiftStatusHtml = `<span style="background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:4px;border:1px solid #fecaca;display:inline-flex;align-items:center;gap:3px"><i class="fa fa-fire"></i> Overtime: +${otH}h ${otM}m</span>`;
        } else {
          const remSecs = standardDutySecs - diffSecs;
          const remH = Math.floor(remSecs / 3600);
          const remM = Math.floor((remSecs % 3600) / 60);
          shiftStatusHtml = `<span style="background:#f0fdf4;color:#16a34a;padding:1px 6px;border-radius:4px;border:1px solid #bbf7d0;display:inline-flex;align-items:center;gap:3px"><i class="fa fa-hourglass-half"></i> Remaining: ${remH}h ${remM}m</span>`;
        }
      } else {
        initialTimerStr = 'In Progress';
        initialCenterTimer = 'In Progress';
      }
    } else if (myApprovedLeave) {
      shiftStatusHtml = `<span style="color:#2563eb"><i class="fa fa-umbrella-beach"></i> On Approved ${myApprovedLeave.leaveType || myApprovedLeave.type || 'Leave'}</span>`;
    } else if (todayHoliday) {
      shiftStatusHtml = `<span style="color:#d97706"><i class="fa fa-champagne-glasses"></i> Public Holiday: ${todayHoliday.name}</span>`;
    }

    const checkInVal = rawIn || '—';
    const checkOutVal = rawOut || '—';
    const breakVal = myTodayAtt?.breakTotal || (isCheckedIn ? (myTodayAtt?.breakOut && !myTodayAtt?.breakIn ? 'On Break' : '45m') : '—');
    const officeHoursVal = isCheckedIn ? (myTodayAtt?.hrs || initialCenterTimer) : '—';
    const deviceName = myTodayAtt?.device || 'ZKTeco Hardware Terminal';

    return `
      <div class="hero-punch-clock-widget">
        <!-- Section 1 (Left): Analog Clock & Live Timer / Status Badge -->
        <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
          <svg width="60" height="60" viewBox="0 0 100 100" style="flex-shrink:0;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.22))">
            <circle cx="50" cy="50" r="48" fill="#0b1120" stroke="#1e293b" stroke-width="2.5"/>
            <circle cx="50" cy="50" r="45" fill="#070c18" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
            <!-- 12 Dial Ticks -->
            <line x1="50" y1="9" x2="50" y2="15" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="91" y1="50" x2="85" y2="50" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="50" y1="91" x2="50" y2="85" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="9" y1="50" x2="15" y2="50" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="70.5" cy="15.5" r="1.5" fill="#64748b"/>
            <circle cx="84.5" cy="29.5" r="1.5" fill="#64748b"/>
            <circle cx="84.5" cy="70.5" r="1.5" fill="#64748b"/>
            <circle cx="70.5" cy="84.5" r="1.5" fill="#64748b"/>
            <circle cx="29.5" cy="84.5" r="1.5" fill="#64748b"/>
            <circle cx="15.5" cy="70.5" r="1.5" fill="#64748b"/>
            <circle cx="15.5" cy="29.5" r="1.5" fill="#64748b"/>
            <circle cx="29.5" cy="15.5" r="1.5" fill="#64748b"/>
            <!-- Live Clock Hands (Updated every second) -->
            <line id="punch-clock-hr-hand" x1="50" y1="50" x2="50" y2="28" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" transform="rotate(${hrAngle} 50 50)"/>
            <line id="punch-clock-min-hand" x1="50" y1="50" x2="50" y2="18" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" transform="rotate(${minAngle} 50 50)"/>
            <line id="punch-clock-sec-hand" x1="50" y1="50" x2="50" y2="13" stroke="#f97316" stroke-width="1.2" stroke-linecap="round" transform="rotate(${secAngle} 50 50)"/>
            <circle cx="50" cy="50" r="3.5" fill="#38bdf8"/>
            <circle cx="50" cy="50" r="1.5" fill="#ffffff"/>
            <text x="50" y="68" font-size="6.5" font-weight="700" fill="${isCheckedIn ? (isCheckedOut ? '#38bdf8' : '#10b981') : (myApprovedLeave ? '#3b82f6' : (todayHoliday ? '#f59e0b' : '#64748b'))}" text-anchor="middle" letter-spacing="0.8">
              ${isCheckedIn ? (isCheckedOut ? 'DONE' : 'ON DUTY') : (myApprovedLeave ? 'LEAVE' : (todayHoliday ? 'HOLIDAY' : 'NOT IN'))}
            </text>
          </svg>

          <div style="display:flex;flex-direction:column;gap:1px;min-width:130px">
            <span style="font-size:11px;color:var(--text-2,#334155);font-weight:600">
              ${dayName} <sup style="font-size:9.5px;font-weight:700;color:var(--text-3,#64748b)">${dayNum} ${monthYear}</sup>
            </span>
            <div id="hero-punch-live-timer" style="font-size:18px;font-weight:900;color:var(--text);letter-spacing:-0.3px;line-height:1.1;margin:1px 0 2px;font-variant-numeric:tabular-nums">
              ${initialTimerStr}
            </div>
            <div>
              ${isCheckedOut ? `
                <span class="punch-badge-btn" style="background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;cursor:default" title="Shift completed at ${checkOutVal}">
                  <i class="fa fa-flag-checkered" style="color:#10b981;font-size:9.5px"></i> Shift Completed
                </span>
              ` : (isCheckedIn ? `
                <span class="punch-badge-btn" onclick="Dashboard.quickSelfPunch('out')" style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;cursor:pointer" title="Checked In at ${checkInVal} via ${deviceName}. Click to Check Out">
                  <i class="fa fa-circle-check" style="color:#10b981;font-size:9.5px"></i> Checked In · Check Out
                </span>
              ` : (myApprovedLeave ? `
                <span class="punch-badge-btn" style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;cursor:default" title="Approved Leave on record today">
                  <i class="fa fa-umbrella-beach" style="color:#2563eb;font-size:9.5px"></i> On Leave (${myApprovedLeave.leaveType || myApprovedLeave.type || 'Approved'})
                </span>
              ` : (todayHoliday ? `
                <span class="punch-badge-btn" style="background:#fffbeb;color:#b45309;border:1px solid #fde68a;cursor:default" title="Official Holiday: ${todayHoliday.name}">
                  <i class="fa fa-champagne-glasses" style="color:#d97706;font-size:9.5px"></i> Holiday (${todayHoliday.name})
                </span>
              ` : `
                <span class="punch-badge-btn" onclick="Dashboard.quickSelfPunch('in')" style="cursor:pointer" title="Click to Check In immediately">
                  <i class="fa fa-arrow-right-to-bracket" style="font-size:9px"></i> Not checked in yet
                </span>
              `)))}
            </div>
          </div>
        </div>

        <!-- Section 2 (Center): Office Time Today Box & Check In/Out Times -->
        <div class="punch-card-white" style="border-radius:12px;padding:8px 16px;min-width:180px;flex:1;max-width:275px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
            <span style="font-size:9.5px;font-weight:800;color:var(--text-3,#64748b);letter-spacing:0.5px">OFFICE TIME TODAY</span>
            <strong id="hero-punch-center-timer" style="font-size:14px;font-weight:900;color:#0284c7;font-variant-numeric:tabular-nums">${initialCenterTimer}</strong>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;font-weight:700;color:var(--text);margin:2px 0">
            <span id="punch-clock-checkin-time" data-time="${rawIn || ''}">${checkInVal !== '—' ? checkInVal : '- : - -'}</span>
            <span id="punch-clock-checkout-time" data-time="${rawOut || ''}">${checkOutVal !== '—' ? checkOutVal : '- : - -'}</span>
          </div>
          <div style="border-bottom:1.5px dotted var(--border,#cbd5e1);margin:4px 0"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:8.5px;font-weight:700;color:var(--text-3,#94a3b8);letter-spacing:0.4px">
            <span>CHECK IN</span>
            <span>CHECK OUT</span>
          </div>
          <!-- Real-Time Shift Countdown & Overtime Alert Badge -->
          <div id="punch-shift-status-badge" style="margin-top:4px;font-size:9.5px;font-weight:700;color:var(--text-3);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${shiftStatusHtml}
          </div>
        </div>

        <!-- Section 3 (Right): 2x2 Mini KPI Cards with Click Actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 8px;flex-shrink:0;min-width:210px">
          <!-- 1. Check In -->
          <div class="punch-card-white" onclick="${!isCheckedIn ? "Dashboard.quickSelfPunch('in')" : ''}" style="border-radius:9px;padding:3px 9px;display:flex;align-items:center;gap:7px;cursor:${!isCheckedIn ? 'pointer' : 'default'}" title="${!isCheckedIn ? 'Click to Check In' : 'Checked In at ' + checkInVal}">
            <div style="width:24px;height:24px;border-radius:6px;background:#cffafe;color:#0891b2;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">
              <i class="fa fa-arrow-right-to-bracket"></i>
            </div>
            <div style="min-width:0;line-height:1.15">
              <div style="font-size:8.5px;color:var(--text-3,#64748b);font-weight:600">Check In</div>
              <div style="font-size:10.5px;font-weight:800;color:var(--text);white-space:nowrap">${checkInVal}</div>
            </div>
          </div>

          <!-- 2. Check Out -->
          <div class="punch-card-white" onclick="${isCheckedIn && !isCheckedOut ? "Dashboard.quickSelfPunch('out')" : ''}" style="border-radius:9px;padding:3px 9px;display:flex;align-items:center;gap:7px;cursor:${isCheckedIn && !isCheckedOut ? 'pointer' : 'default'}" title="${isCheckedIn && !isCheckedOut ? 'Click to Check Out' : (isCheckedOut ? 'Checked Out at ' + checkOutVal : 'Check in first')}">
            <div style="width:24px;height:24px;border-radius:6px;background:#ffe4e6;color:#e11d48;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">
              <i class="fa fa-arrow-right-from-bracket"></i>
            </div>
            <div style="min-width:0;line-height:1.15">
              <div style="font-size:8.5px;color:var(--text-3,#64748b);font-weight:600">Check Out</div>
              <div style="font-size:10.5px;font-weight:800;color:var(--text);white-space:nowrap">${checkOutVal}</div>
            </div>
          </div>

          <!-- 3. Break Time -->
          <div class="punch-card-white" onclick="${isCheckedIn && !isCheckedOut ? "Dashboard.quickSelfPunch(myTodayAtt?.breakOut && !myTodayAtt?.breakIn ? 'ot_in' : 'ot_out')" : ''}" style="border-radius:9px;padding:3px 9px;display:flex;align-items:center;gap:7px;cursor:${isCheckedIn && !isCheckedOut ? 'pointer' : 'default'}" title="${isCheckedIn && !isCheckedOut ? 'Click to toggle Break In / Out' : ''}">
            <div style="width:24px;height:24px;border-radius:6px;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">
              <i class="fa fa-mug-hot"></i>
            </div>
            <div style="min-width:0;line-height:1.15">
              <div style="font-size:8.5px;color:var(--text-3,#64748b);font-weight:600">Break Time</div>
              <div style="font-size:10.5px;font-weight:800;color:var(--text);white-space:nowrap">${breakVal}</div>
            </div>
          </div>

          <!-- 4. Office Hours -->
          <div class="punch-card-white" style="border-radius:9px;padding:3px 9px;display:flex;align-items:center;gap:7px">
            <div style="width:24px;height:24px;border-radius:6px;background:#f3e8ff;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">
              <i class="fa fa-building"></i>
            </div>
            <div style="min-width:0;line-height:1.15">
              <div style="font-size:8.5px;color:var(--text-3,#64748b);font-weight:600">Office Hours</div>
              <div style="font-size:10.5px;font-weight:800;color:var(--text);white-space:nowrap">${officeHoursVal}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  startPunchClockTimer() {
    if (this._punchClockTimer) {
      clearInterval(this._punchClockTimer);
      this._punchClockTimer = null;
    }

    const updateTick = () => {
      const widget = document.querySelector('.hero-punch-clock-widget');
      if (!widget) {
        if (this._punchClockTimer) {
          clearInterval(this._punchClockTimer);
          this._punchClockTimer = null;
        }
        return;
      }

      const now = new Date();
      const hrs = now.getHours() % 12;
      const mins = now.getMinutes();
      const secs = now.getSeconds();
      const hrAngle = (hrs * 30) + (mins * 0.5) + (secs * (0.5 / 60));
      const minAngle = (mins * 6) + (secs * 0.1);
      const secAngle = secs * 6;

      // Update analog clock hands
      const hrHand = document.getElementById('punch-clock-hr-hand');
      const minHand = document.getElementById('punch-clock-min-hand');
      const secHand = document.getElementById('punch-clock-sec-hand');
      if (hrHand) hrHand.setAttribute('transform', `rotate(${hrAngle} 50 50)`);
      if (minHand) minHand.setAttribute('transform', `rotate(${minAngle} 50 50)`);
      if (secHand) secHand.setAttribute('transform', `rotate(${secAngle} 50 50)`);

      // Check if checked in
      const inEl = document.getElementById('punch-clock-checkin-time');
      const checkInRaw = inEl?.dataset?.time || (inEl?.textContent?.trim() !== '- : - -' && inEl?.textContent?.trim() !== '—' ? inEl?.textContent?.trim() : null);
      const outEl = document.getElementById('punch-clock-checkout-time');
      const checkOutRaw = outEl?.dataset?.time || (outEl?.textContent?.trim() !== '- : - -' && outEl?.textContent?.trim() !== '—' ? outEl?.textContent?.trim() : null);

      if (checkInRaw && checkInRaw !== '- : - -' && checkInRaw !== '—' && !checkOutRaw) {
        // Active on duty - live elapsed timer ticking!
        const [inH, inM, inS] = checkInRaw.split(':').map(Number);
        if (!isNaN(inH) && !isNaN(inM)) {
          const inTotalSecs = (inH * 3600) + (inM * 60) + (isNaN(inS) ? 0 : inS);
          const nowTotalSecs = (now.getHours() * 3600) + (now.getMinutes() * 60) + secs;
          const diffSecs = Math.max(0, nowTotalSecs - inTotalSecs);
          const eh = Math.floor(diffSecs / 3600);
          const em = Math.floor((diffSecs % 3600) / 60);
          const es = diffSecs % 60;
          const liveTimeStr = `${String(eh).padStart(2, '0')}H ${String(em).padStart(2, '0')}M ${String(es).padStart(2, '0')}S`;
          const centerTimeStr = `${String(eh).padStart(2, '0')}H ${String(em).padStart(2, '0')}M`;

          const timerDisp1 = document.getElementById('hero-punch-live-timer');
          if (timerDisp1) timerDisp1.textContent = liveTimeStr;
          const timerDisp2 = document.getElementById('hero-punch-center-timer');
          if (timerDisp2) timerDisp2.textContent = centerTimeStr;

          // Update shift countdown & overtime alert pill
          const statusBadge = document.getElementById('punch-shift-status-badge');
          if (statusBadge) {
            const standardDutySecs = 8 * 3600;
            if (diffSecs >= standardDutySecs) {
              const otSecs = diffSecs - standardDutySecs;
              const otH = Math.floor(otSecs / 3600);
              const otM = Math.floor((otSecs % 3600) / 60);
              statusBadge.innerHTML = `<span style="background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:4px;border:1px solid #fecaca;display:inline-flex;align-items:center;gap:3px"><i class="fa fa-fire"></i> Overtime: +${otH}h ${otM}m</span>`;
            } else {
              const remSecs = standardDutySecs - diffSecs;
              const remH = Math.floor(remSecs / 3600);
              const remM = Math.floor((remSecs % 3600) / 60);
              statusBadge.innerHTML = `<span style="background:#f0fdf4;color:#16a34a;padding:1px 6px;border-radius:4px;border:1px solid #bbf7d0;display:inline-flex;align-items:center;gap:3px"><i class="fa fa-hourglass-half"></i> Remaining: ${remH}h ${remM}m</span>`;
            }
          }
        }
      }
    };

    updateTick();
    this._punchClockTimer = setInterval(updateTick, 1000);
  },

  playPunchChime(type = 'in') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'in') {
        // High ascending chime (C5 -> G5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Mellow descending chime (G5 -> C5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(783.99, now);
        osc.frequency.setValueAtTime(523.25, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {}
  },

  quickSelfPunch(type) {
    const today = Utils.today();
    const curEmp = Auth.employee || (typeof DB !== 'undefined' && DB.find ? DB.find('employees', Auth.user?.employeeId || 1) : null) || {};
    const myId = curEmp.id || Auth.user?.employeeId || 1;
    if (!myId) return;

    const allAtt = DB.get('attendance') || [];
    let rec = allAtt.find(a => (String(a.employeeId) === String(myId) || String(a.employeeId) === String(curEmp.empNo)) && a.date === today);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (type === 'in' || type === 'check_in') {
      if (rec && (rec.timeIn || rec.checkIn)) {
        Toast.show('Already checked in today at ' + (rec.timeIn || rec.checkIn), 'info');
        return;
      }
      this.playPunchChime('in');
      const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
      if (rec) {
        rec.timeIn = timeStr;
        rec.checkIn = timeStr;
        rec.status = isLate ? 'late' : 'present';
      } else {
        rec = {
          id: DB.nextId('attendance'),
          employeeId: myId,
          date: today,
          timeIn: timeStr,
          checkIn: timeStr,
          breakOut: '',
          breakIn: '',
          timeOut: '',
          checkOut: '',
          status: isLate ? 'late' : 'present',
          overtime: 0,
          device: 'ZKTeco Hardware Terminal',
          deviceIp: '192.168.1.201',
          remarks: 'Biometric Check-In (Hardware Synced)'
        };
        allAtt.push(rec);
      }
      DB.set('attendance', allAtt);
    } else if (type === 'ot_out' || type === 'b_out') {
      if (!rec || (!rec.timeIn && !rec.checkIn)) {
        Toast.show('Please check in first before recording Break Out', 'warning');
        return;
      }
      if (rec.breakOut) {
        Toast.show('Break Out already recorded at ' + rec.breakOut, 'info');
        return;
      }
      this.playPunchChime('out');
      rec.breakOut = timeStr;
      DB.set('attendance', allAtt);
    } else if (type === 'ot_in' || type === 'b_in') {
      if (!rec || !rec.breakOut) {
        Toast.show('Please record Break Out before recording Break In', 'warning');
        return;
      }
      if (rec.breakIn) {
        Toast.show('Break In already recorded at ' + rec.breakIn, 'info');
        return;
      }
      this.playPunchChime('in');
      rec.breakIn = timeStr;
      DB.set('attendance', allAtt);
    } else if (type === 'out' || type === 'check_out') {
      if (!rec || (!rec.timeIn && !rec.checkIn)) {
        Toast.show('Please check in first before checking out', 'warning');
        return;
      }
      this.playPunchChime('out');
      rec.timeOut = timeStr;
      rec.checkOut = timeStr;
      const inTime = rec.timeIn || rec.checkIn;
      const ot = (typeof Attendance !== 'undefined' && Attendance.calcOvertime)
        ? Attendance.calcOvertime(inTime, rec.timeOut, rec.breakOut, rec.breakIn)
        : 0;
      rec.overtime = ot;
      rec.hrs = (typeof Attendance !== 'undefined' && Attendance.calcHours)
        ? Attendance.calcHours(inTime, rec.timeOut)
        : '8h 00m';
      rec.completionStatus = 'complete';
      DB.set('attendance', allAtt);
    }

    // Record in attendance_logs machine telemetry
    const punchLabel = (type === 'in' || type === 'check_in') ? 'Check-In' : (type === 'ot_out' || type === 'b_out' ? 'Break-Out' : (type === 'ot_in' || type === 'b_in' ? 'Break-In' : 'Check-Out'));
    const punchType = (type === 'in' || type === 'check_in') ? 'check_in' : (type === 'ot_out' || type === 'b_out' ? 'break_out' : (type === 'ot_in' || type === 'b_in' ? 'break_in' : 'check_out'));
    const allLogs = DB.get('attendance_logs') || [];
    const empDayLogs = allLogs.filter(l => (String(l.employeeId) === String(myId) || String(l.employeeId) === String(curEmp.empNo)) && l.date === today);
    const punchNumber = empDayLogs.length + 1;

    allLogs.push({
      id: DB.nextId('attendance_logs'),
      employeeId: myId,
      date: today,
      time: timeStr,
      timestamp: new Date().toISOString(),
      punchType,
      punchLabel,
      punchNumber,
      device: 'ZKTeco Hardware Terminal',
      deviceIp: '192.168.1.201',
      verifyMode: 'Biometric / Fingerprint'
    });
    DB.set('attendance_logs', allLogs);

    if (rec) {
      rec.punchCount = punchNumber;
      DB.set('attendance', allAtt);
    }

    if (type === 'in' || type === 'check_in') {
      Toast.show(`Biometric Check-In recorded at ${timeStr} (Swipe #${punchNumber})`, 'success');
    } else if (type === 'ot_out' || type === 'b_out') {
      Toast.show(`Break Out recorded at ${timeStr} (Swipe #${punchNumber})`, 'info');
    } else if (type === 'ot_in' || type === 'b_in') {
      Toast.show(`Break In recorded at ${timeStr} (Swipe #${punchNumber})`, 'success');
    } else if (type === 'out' || type === 'check_out') {
      Toast.show(`Check-Out recorded at ${timeStr} (Swipe #${punchNumber}). Daily shift completed!`, 'success');
    }
    this.render();
  },

  startAutoSync() {
    if (this._autoSyncTimer) clearInterval(this._autoSyncTimer);
    this._autoSyncTimer = setInterval(() => {
      if (document.hidden) return;
      if (typeof App !== 'undefined' && App.currentModule !== 'dashboard') {
        this.stopAutoSync();
        return;
      }
      this.refreshHeroPunchClock();
    }, 15000);
  },

  stopAutoSync() {
    if (this._autoSyncTimer) {
      clearInterval(this._autoSyncTimer);
      this._autoSyncTimer = null;
    }
  },

  refreshHeroPunchClock() {
    const today = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : new Date().toISOString().slice(0, 10);
    const curEmp = Auth.employee || {};
    const curEmpId = curEmp.id || Auth.user?.employeeId || 1;
    const att = (typeof DB !== 'undefined' && DB.get ? DB.get('attendance') : []) || [];
    let myTodayAtt = att.find(a => (String(a.employeeId) === String(curEmpId) || String(a.employeeId) === String(curEmp.empNo)) && a.date === today);
    const allLogs = (typeof DB !== 'undefined' && DB.get ? DB.get('attendance_logs') : []) || [];
    const myTodayLogs = allLogs.filter(l => (String(l.employeeId) === String(curEmpId) || String(l.employeeId) === String(curEmp.empNo)) && l.date === today);
    if (myTodayLogs.length > 0) {
      const inLog = myTodayLogs.find(l => l.punchType === 'check_in' || l.type === 'check_in');
      const outLog = [...myTodayLogs].reverse().find(l => l.punchType === 'check_out' || l.type === 'check_out');
      if (!myTodayAtt) {
        myTodayAtt = {
          id: 'live_log_' + (inLog?.id || Date.now()),
          employeeId: curEmpId,
          date: today,
          timeIn: inLog?.time || '',
          checkIn: inLog?.time || '',
          timeOut: outLog?.time || '',
          checkOut: outLog?.time || '',
          status: 'present',
          device: inLog?.device || 'ZKTeco Hardware Terminal'
        };
      } else {
        if (!myTodayAtt.timeIn && inLog) myTodayAtt.timeIn = inLog.time;
        if (!myTodayAtt.checkIn && inLog) myTodayAtt.checkIn = inLog.time;
        if (!myTodayAtt.timeOut && outLog) myTodayAtt.timeOut = outLog.time;
        if (!myTodayAtt.checkOut && outLog) myTodayAtt.checkOut = outLog.time;
      }
    }
    const container = document.querySelector('.hero-punch-clock-widget');
    if (container && container.parentElement) {
      container.parentElement.innerHTML = this.renderHeroPunchClockWidget(myTodayAtt);
    }
  },

  
  kpiCard(label, value, icon, color, change, changeDir, sparklinePoints) {
    const isUp = changeDir === 'up';
    const trendColor = isUp ? '#10b981' : '#ef4444';
    const arrowIcon = isUp ? '↑' : '↓';
    
    // Generate smooth SVG sparkline path
    const w = 70, h = 26;
    const min = Math.min(...sparklinePoints);
    const max = Math.max(...sparklinePoints);
    const range = (max - min) || 1;
    const coords = sparklinePoints.map((pt, i) => {
      const x = (i / (sparklinePoints.length - 1)) * w;
      const y = h - ((pt - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const d = coords.reduce((acc, curr, i, arr) => {
      if (i === 0) return `M ${curr}`;
      const prev = arr[i - 1].split(',');
      const c = curr.split(',');
      const mx = ((parseFloat(prev[0]) + parseFloat(c[0])) / 2).toFixed(1);
      return `${acc} C ${mx},${prev[1]} ${mx},${c[1]} ${curr}`;
    }, '');

    return `
      <div class="dash-ref-kpi-card" style="background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:${color}18;color:${color};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
            <i class="fa ${icon}"></i>
          </div>
          <div style="min-width:0;flex:1">
            <div style="font-size:11.5px;font-weight:600;color:var(--text-3,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</div>
            <div style="font-size:24px;font-weight:800;color:var(--text,#1e293b);line-height:1.1;margin-top:2px" class="animate-count-up" data-target="${value}">${value}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px">
          <span style="font-size:11px;font-weight:700;color:${trendColor};display:flex;align-items:center;gap:2px">
            <span>${arrowIcon}</span> ${change}
          </span>
          <svg width="${w}" height="${h}" style="overflow:visible">
            <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    `;
  },

  attBadge(label, count, icon, color) {
    return `
      <div class="dash-ref-att-pill" style="background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:12px 6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 1px 2px rgba(0,0,0,0.03)">
        <div style="font-size:15px;color:${color};margin-bottom:2px"><i class="fa ${icon}"></i></div>
        <div style="font-size:11px;font-weight:600;color:var(--text-3,#64748b)">${label}</div>
        <div style="font-size:20px;font-weight:800;color:var(--text,#1e293b);line-height:1" class="animate-count-up" data-target="${count}">${count}</div>
      </div>
    `;
  },

  switchApprovalTab(tab) {
    ['leaves', 'overtime', 'regular'].forEach(t => {
      const btn = document.getElementById('atab-' + t);
      if (btn) {
        if (t === tab) {
          btn.style.borderBottom = '2px solid #f97316';
          btn.style.color = '#f97316';
          btn.style.fontWeight = '700';
        } else {
          btn.style.borderBottom = '2px solid transparent';
          btn.style.color = 'var(--text-3,#64748b)';
          btn.style.fontWeight = '500';
        }
      }
    });

    const container = document.getElementById('approval-list');
    if (!container) return;
    const emps = (typeof DB !== 'undefined' && DB.get ? DB.get('employees') : []) || [];

    if (tab === 'leaves') {
      const leaves = (typeof DB !== 'undefined' && DB.get ? (DB.get('leave_requests') || DB.get('leaves') || []) : []);
      const pl = leaves.filter(l => l.status === 'pending' || l.status === 'manager_approved').slice(0, 5);
      if (!pl.length) {
        container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-3)">No pending leave requests</div>';
        return;
      }
      container.innerHTML = pl.map(l => {
        const emp = emps.find(e => e.id === l.employeeId) || {};
        const tAgo = l.appliedOn ? (()=>{const h=Math.floor((Date.now()-new Date(l.appliedOn))/3600000);return h<24?h+'h ago':Math.floor(h/24)+'d ago';})() : '2h ago';
        const typeName = (typeof Utils !== 'undefined' && Utils.getLeaveTypeName) ? Utils.getLeaveTypeName(l.leaveTypeId) : 'Leave';
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 10px;background:var(--surface,#f8fafc);border-radius:8px;border:1px solid var(--border,#e2e8f0)">
            <div style="width:34px;height:34px;border-radius:50%;background:${Utils.avatarColor(l.employeeId)};display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0">${Utils.avatarInitials(emp.fullName || '?')}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:700;color:var(--text)">${emp.fullName || 'Employee'}</div>
              <div style="font-size:11px;color:var(--text-3)">${typeName} Request</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
              <span style="font-size:10.5px;color:var(--text-3)">${tAgo}</span>
              <span style="background:#fff7ed;color:#ea580c;font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;border:1px solid #fdba7440">Pending</span>
            </div>
          </div>
        `;
      }).join('');
    } else if (tab === 'overtime') {
      const att = ((typeof DB !== 'undefined' && DB.get ? DB.get('attendance') : []) || []).filter(a => a.overtime > 0).slice(0, 4);
      if (!att.length) {
        container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-3)">No pending overtime requests</div>';
        return;
      }
      container.innerHTML = att.map(a => {
        const emp = emps.find(e => e.id === a.employeeId) || {};
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 10px;background:var(--surface,#f8fafc);border-radius:8px;border:1px solid var(--border,#e2e8f0)">
            <div style="width:34px;height:34px;border-radius:50%;background:${Utils.avatarColor(a.employeeId)};display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0">${Utils.avatarInitials(emp.fullName || '?')}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:700;color:var(--text)">${emp.fullName || 'Employee'}</div>
              <div style="font-size:11px;color:var(--text-3)">Overtime Claim (${a.overtime || 2}h)</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
              <span style="font-size:10.5px;color:var(--text-3)">Today</span>
              <span style="background:#fff7ed;color:#ea580c;font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;border:1px solid #fdba7440">Pending</span>
            </div>
          </div>
        `;
      }).join('');
    } else if (tab === 'regular') {
      const att = ((typeof DB !== 'undefined' && DB.get ? DB.get('attendance') : []) || []).filter(a => a.status === 'late' || a.status === 'half_day').slice(0, 4);
      if (!att.length) {
        container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-3)">No regularization requests</div>';
        return;
      }
      container.innerHTML = att.map(a => {
        const emp = emps.find(e => e.id === a.employeeId) || {};
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 10px;background:var(--surface,#f8fafc);border-radius:8px;border:1px solid var(--border,#e2e8f0)">
            <div style="width:34px;height:34px;border-radius:50%;background:${Utils.avatarColor(a.employeeId)};display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0">${Utils.avatarInitials(emp.fullName || '?')}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:700;color:var(--text)">${emp.fullName || 'Employee'}</div>
              <div style="font-size:11px;color:var(--text-3)">Attendance Regularization</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
              <span style="font-size:10.5px;color:var(--text-3)">1d ago</span>
              <span style="background:#fff7ed;color:#ea580c;font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;border:1px solid #fdba7440">Pending</span>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  render() {
    const content = document.getElementById('page-content');
    if (!content) return;
    if (typeof HRAssistant !== 'undefined' && HRAssistant.injectLauncherButton) {
      HRAssistant.injectLauncherButton();
    }
    const att = (typeof DB !== 'undefined' && DB.get ? (DB.get('attendance') || []) : []);
    const emps = (typeof DB !== 'undefined' && DB.get ? (DB.get('employees') || []) : []);
    const leaves = (typeof DB !== 'undefined' && DB.get ? (DB.get('leave_requests') || DB.get('leaves') || []) : []);
    const salary = (typeof DB !== 'undefined' && DB.get ? (DB.get('salary') || []) : []);
    const reviews = (typeof DB !== 'undefined' && DB.get ? (DB.get('performance_reviews') || []) : []);
    const holidays = (typeof DB !== 'undefined' && DB.get ? (DB.get('holidays') || []) : []);
    const companies = (typeof DB !== 'undefined' && DB.get ? (DB.get('companies') || []) : []);
    const activeCompanyId = (typeof DB !== 'undefined' && DB.getActiveCompanyId) ? DB.getActiveCompanyId() : 'all';
    const today = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : new Date().toISOString().slice(0, 10);

    // Ensure all employees have clean companyId assigned
    let hasMissingCompany = false;
    emps.forEach((e, idx) => {
      if (!e.companyId || isNaN(Number(e.companyId))) {
        e.companyId = (idx % 3) + 1;
        hasMissingCompany = true;
      }
    });
    if (hasMissingCompany && typeof DB !== 'undefined' && DB.set) {
      DB.set('employees', emps);
    }

    let scopedEmps = (typeof Auth !== 'undefined' && Auth.getScopedEmployees) ? (Auth.getScopedEmployees(emps) || emps) : emps;
    const scopedIds = scopedEmps.map(e => e.id);

    const totalEmps = scopedEmps.filter(e => e.status === 'active').length;
    const inactiveEmps = scopedEmps.filter(e => e.status === 'inactive').length;
    const newJoiners = scopedEmps.filter(e => e.joiningDate >= '2026-08-01' && e.status === 'active').length;

    const todayAtt = att.filter(a => a.date === today && (Auth.role === 'dept_manager' ? scopedIds.includes(a.employeeId) : true));
    const present  = todayAtt.filter(a => a.status === 'present').length;
    const absent   = todayAtt.filter(a => a.status === 'absent').length;
    const late     = todayAtt.filter(a => a.status === 'late').length;
    const halfDay  = todayAtt.filter(a => a.status === 'half_day').length;

    const scopedLeaves = Auth.role === 'dept_manager' ? leaves.filter(l => scopedIds.includes(l.employeeId)) : leaves;
    const onLeave  = scopedLeaves.filter(l => l.status === 'approved' && l.from <= today && l.to >= today).length;

    const pendingLeaves  = scopedLeaves.filter(l => l.status === 'pending' || l.status === 'manager_approved').length;
    const approvedLeaves = scopedLeaves.filter(l => l.status === 'approved').length;
    const rejectedLeaves = scopedLeaves.filter(l => l.status === 'rejected').length;

    const pendingSalary  = salary.filter(s => s.status === 'pending' && (Auth.role === 'dept_manager' ? scopedIds.includes(s.employeeId) : true)).length;
    const processedSalary= salary.filter(s => s.status === 'processed' && (Auth.role === 'dept_manager' ? scopedIds.includes(s.employeeId) : true)).length;
    
    // Total Net Paid for selected payroll period
    const paidSalaryList = salary.filter(s => (s.status === 'paid' || s.status === 'processed') && (Auth.role === 'dept_manager' ? scopedIds.includes(s.employeeId) : true));
    const totalNetPaidNum = paidSalaryList.reduce((sum, s) => sum + (Number(s.netSalary || s.netPay || s.net || s.grossSalary || 0)), 0);
    const netPaidFormatted = totalNetPaidNum > 0 
      ? (totalNetPaidNum >= 1000000 ? `Rs. ${(totalNetPaidNum / 1000000).toFixed(2)}M` : `Rs. ${(totalNetPaidNum / 1000).toFixed(0)}k`) 
      : 'Rs. 4.85M';

    const scopedReviews = Auth.role === 'dept_manager' ? reviews.filter(r => scopedIds.includes(r.employeeId)) : reviews;
    const pendingReviews = scopedReviews.filter(r => r.status === 'pending').length;
    const doneReviews    = scopedReviews.filter(r => r.status === 'completed').length;
    const ratedReviews   = scopedReviews.filter(r => (Number(r.overallRating || r.rating) > 0));
    const avgRatingVal   = ratedReviews.length > 0
      ? (ratedReviews.reduce((sum, r) => sum + Number(r.overallRating || r.rating || 0), 0) / ratedReviews.length).toFixed(1)
      : '4.2';

    // Birthdays, Holidays, Announcements, Anniversaries for Headlines Ticker & Dashboard Cards
    // (Company-wide celebrations so all logins: Admin, Manager, Employee see colleague birthdays)
    const allActiveEmps = emps.filter(e => e.status === 'active');
    const todayMMDD = today.slice(5);
    const todayBdays = allActiveEmps.filter(e => e.dob?.slice(5) === todayMMDD);
    const upcomingBdays = allActiveEmps.filter(e => {
      if (!e.dob) return false;
      const bYear = new Date().getFullYear();
      let bd = new Date(bYear + '-' + e.dob.slice(5));
      const now = new Date();
      let diff = (bd - now) / 86400000;
      if (diff < 0) {
        bd = new Date((bYear + 1) + '-' + e.dob.slice(5));
        diff = (bd - now) / 86400000;
      }
      return diff > 0 && diff <= 30;
    }).sort((a,b) => {
      const bYear = new Date().getFullYear();
      let bdA = new Date(bYear + '-' + a.dob.slice(5));
      let bdB = new Date(bYear + '-' + b.dob.slice(5));
      const now = new Date();
      if ((bdA - now) < 0) bdA = new Date((bYear + 1) + '-' + a.dob.slice(5));
      if ((bdB - now) < 0) bdB = new Date((bYear + 1) + '-' + b.dob.slice(5));
      return bdA - bdB;
    });

    const featuredBday = (todayBdays && todayBdays.length > 0)
      ? todayBdays[0]
      : (upcomingBdays && upcomingBdays.length > 0 ? upcomingBdays[0] : (scopedEmps.find(e => e.id === 12) || scopedEmps[3] || scopedEmps[0] || { id: 12, fullName: 'Bilal Ahmad', departmentId: 2, dob: '1996-' + todayMMDD }));
    const isCelebToday = (todayBdays && todayBdays.length > 0);

    const upcomingHols = holidays.filter(h => h.date >= today).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 4);
    const announcements = DB.get('announcements') || [];
    const auditLogs = DB.get('audit_logs') || [];

    // Work anniversaries this month
    const thisMonthNum = today.slice(5, 7);
    const thisYearNum = parseInt(today.slice(0, 4), 10);
    const anniversaries = emps.filter(e => {
      if (!e.joiningDate || e.status !== 'active') return false;
      const jMonth = e.joiningDate.slice(5, 7);
      const jYear = parseInt(e.joiningDate.slice(0, 4), 10);
      return jMonth === thisMonthNum && thisYearNum > jYear;
    }).map(e => ({
      ...e,
      years: thisYearNum - parseInt(e.joiningDate.slice(0, 4), 10)
    }));

    // Construct Moving Headlines items
    const headlines = [];

    // 1. Today's Birthdays
    todayBdays.forEach(e => {
      headlines.push({
        type: 'birthday',
        icon: 'fa-cake-candles',
        tag: "Birthday Today",
        text: `🎉 <strong>${e.fullName}</strong> (${Utils.getDeptName(e.departmentId)}) celebrates their birthday today! Click to send wishes 🎈`,
        action: `Dashboard.showBirthdayWishModal(${e.id})`
      });
    });

    // 2. Upcoming Birthdays (next 14 days)
    upcomingBdays.slice(0, 4).forEach(e => {
      const bd = new Date(new Date().getFullYear() + '-' + e.dob.slice(5));
      const diffDays = Math.max(1, Math.ceil((bd - new Date()) / 86400000));
      headlines.push({
        type: 'birthday',
        icon: 'fa-gift',
        tag: 'Upcoming Birthday',
        text: `🎂 <strong>${e.fullName}</strong> on ${bd.toLocaleDateString('en-US', { month:'short', day:'numeric' })} (${diffDays} days away) 🎈`,
        action: `Dashboard.showBirthdayWishModal(${e.id})`
      });
    });

    // 3. Upcoming Holidays
    upcomingHols.forEach(h => {
      headlines.push({
        type: 'holiday',
        icon: 'fa-umbrella-beach',
        tag: 'Company Holiday',
        text: `🌴 <strong>${h.name}</strong> on ${Utils.formatDate(h.date)} (${h.type.charAt(0).toUpperCase() + h.type.slice(1)})`,
        action: `App.navigate('events')`
      });
    });

    // 4. Company Announcements
    announcements.slice(0, 4).forEach(a => {
      headlines.push({
        type: 'announcement',
        icon: 'fa-bullhorn',
        tag: (a.priority ? a.priority.charAt(0).toUpperCase() + a.priority.slice(1) : 'Notice') + ' Notice',
        text: `📢 <strong>${a.title}</strong> — ${a.body.slice(0, 60)}…`,
        action: `Dashboard.showAnnouncementModal(${a.id})`
      });
    });

    // 5. Work Anniversaries
    anniversaries.forEach(e => {
      headlines.push({
        type: 'anniversary',
        icon: 'fa-award',
        tag: 'Work Anniversary',
        text: `⭐ <strong>${e.fullName}</strong> completed <strong>${e.years} year${e.years>1?'s':''}</strong> with HRM Pro! 🏆`,
        action: `Employees.renderProfile(${e.id})`
      });
    });

    // 6. Action Alerts
    if (pendingLeaves > 0) {
      headlines.push({
        type: 'alert',
        icon: 'fa-clock',
        tag: 'Action Required',
        text: `⚡ <strong>${pendingLeaves} Leave Request${pendingLeaves>1?'s':''}</strong> awaiting manager & HR approval.`,
        action: `App.navigate('leaves')`
      });
    }

    if (processedSalary > 0 && ['superadmin', 'hr_manager'].includes(Auth.role)) {
      headlines.push({
        type: 'alert',
        icon: 'fa-money-bill-wave',
        tag: 'Payroll Ready',
        text: `💰 August 2026 Payroll is processed and ready for disbursement.`,
        action: `App.navigate('payroll')`
      });
    }

    const tickerItemsHtml = headlines.map(h => {
      const bg = h.type === 'birthday' ? '#ec4899' : h.type === 'holiday' ? '#4f46e5' : h.type === 'announcement' ? '#0284c7' : h.type === 'anniversary' ? '#8b5cf6' : '#ea580c';
      return `
        <span class="ticker-item ${h.type}" onclick="${h.action}" title="Click to view details" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0">
          <span style="background:${bg};color:#ffffff;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:5px;line-height:1.2;white-space:nowrap"><i class="fa ${h.icon}"></i> ${h.tag}</span>
          <span style="font-size:12px;font-weight:600;color:var(--text,#1e293b);white-space:nowrap">${h.text}</span>
        </span>
        <span style="color:#cbd5e1;font-size:11px;flex-shrink:0">•</span>
      `;
    }).join(' ');

    // Check scope: if SELF, render dedicated Employee Self-Service Dashboard
    if (Auth.getScope('dashboard') === 'SELF') {
      this.renderEmployeeDashboard(content, headlines, upcomingHols, upcomingBdays, today, todayBdays);
      return;
    }

    const curEmp = Auth.employee || {};
    const curPhoto = curEmp.photo;
    const curFullName = curEmp.fullName || Auth.user?.name || 'Ahmed Khan';
    const curInitials = (typeof Utils !== 'undefined' && Utils.avatarInitials) ? Utils.avatarInitials(curFullName) : 'AK';
    const curRoleLabel = Auth.role ? Auth.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Super Admin';
    const curDesignation = curEmp.designationId && typeof Utils !== 'undefined' && Utils.getDesigName ? Utils.getDesigName(curEmp.designationId) : curRoleLabel;
    const rawCode = curEmp.empNo || curEmp.employeeId || curEmp.code || (curEmp.id ? `EMP-${String(curEmp.id).padStart(3, '0')}` : 'EMP-001');
    const curEmpCode = String(rawCode).startsWith('EMP-') ? rawCode : `EMP-${String(rawCode).padStart(3, '0')}`;
    const curEmpId = curEmp.id || (Auth.user?.employeeId) || 1;
    let myTodayAtt = att.find(a => (String(a.employeeId) === String(curEmpId) || String(a.employeeId) === String(curEmp.empNo)) && a.date === today);

    // Also link with biometric hardware punches logged in attendance_logs
    const allLogs = (typeof DB !== 'undefined' && DB.get ? DB.get('attendance_logs') : []) || [];
    const myTodayLogs = allLogs.filter(l => (String(l.employeeId) === String(curEmpId) || String(l.employeeId) === String(curEmp.empNo)) && l.date === today);
    if (myTodayLogs.length > 0) {
      const inLog = myTodayLogs.find(l => l.punchType === 'check_in' || l.type === 'check_in');
      const outLog = [...myTodayLogs].reverse().find(l => l.punchType === 'check_out' || l.type === 'check_out');
      if (!myTodayAtt) {
        myTodayAtt = {
          id: 'live_log_' + (inLog?.id || Date.now()),
          employeeId: curEmpId,
          date: today,
          timeIn: inLog?.time || '',
          checkIn: inLog?.time || '',
          timeOut: outLog?.time || '',
          checkOut: outLog?.time || '',
          status: 'present',
          device: inLog?.device || 'ZKTeco Hardware Terminal'
        };
      } else {
        if (!myTodayAtt.timeIn && inLog) myTodayAtt.timeIn = inLog.time;
        if (!myTodayAtt.checkIn && inLog) myTodayAtt.checkIn = inLog.time;
        if (!myTodayAtt.timeOut && outLog) myTodayAtt.timeOut = outLog.time;
        if (!myTodayAtt.checkOut && outLog) myTodayAtt.checkOut = outLog.time;
      }
    }

    content.setAttribute('data-theme', 'light');
    content.innerHTML = `
      <div class="animate-fade-in dashboard-reference-layout" data-theme="light" style="display:flex;flex-direction:column;gap:12px">

        <!-- ══════════════════════════════════════════════════════
             1. DASHBOARD OVERVIEW & HERO OFFICE TIME PUNCH-CLOCK WIDGET
        ══════════════════════════════════════════════════════ -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="flex-shrink:0">
            <div style="display:flex;align-items:center;gap:8px">
              <h2 style="font-size:19px;font-weight:800;color:var(--text);letter-spacing:-0.4px;margin:0">Dashboard Overview</h2>
              <span style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:#10b981;background:rgba(16,185,129,0.1);padding:2px 7px;border-radius:10px">
                <span style="width:6px;height:6px;border-radius:50%;background:#10b981"></span> Live System
              </span>
            </div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">
              ${new Date().toLocaleDateString('en-PK',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})} · Real-Time Workforce Summary
            </div>
          </div>

          <!-- The Given Function in Mention Space (Hero Punch Clock & Office Hours Widget) -->
          <div style="flex:1;min-width:320px;max-width:880px">
            ${this.renderHeroPunchClockWidget(myTodayAtt)}
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════
             2. AHMED KHAN PROFILE CARD (LARGER SIZE + SHOWS EMP ID) & HEADLINES
        ══════════════════════════════════════════════════════ -->
        <div class="dash-ref-hero-row" style="display:flex;align-items:stretch;gap:10px">
          <!-- Left: Ahmed Khan User Profile Card (Increased size + Shows Employee ID Code) -->
          <div class="dash-user-profile-card" onclick="App.navigate('profile')" title="View My Profile" style="cursor:pointer;display:flex;align-items:center;gap:12px;background:var(--card,#ffffff);border:1.5px solid var(--border,#e2e8f0);border-radius:12px;padding:6px 16px;height:56px;min-width:240px;flex-shrink:0;box-shadow:0 2px 5px rgba(0,0,0,0.04);transition:all .15s">
            <div style="width:42px;height:42px;min-width:42px;border-radius:50%;overflow:hidden;background:#2563eb;flex-shrink:0;border:2px solid var(--border,#e2e8f0)">
              ${curPhoto ? '<img src="'+curPhoto+'" style="width:100%;height:100%;object-fit:cover" alt="'+curFullName+'">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:800">'+curInitials+'</div>'}
            </div>
            <div style="min-width:0">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:14px;font-weight:800;color:var(--text,#0f172a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${curFullName}</span>
                <span style="font-size:10px;font-weight:800;color:#2563eb;background:#eff6ff;padding:1.5px 6px;border-radius:4px;border:1px solid #bfdbfe;letter-spacing:0.3px">${curEmpCode}</span>
              </div>
              <div style="font-size:11px;color:var(--text-3,#64748b);margin-top:2px;display:flex;align-items:center;gap:5px">
                <span>${curDesignation}</span>
                <span style="width:3px;height:3px;border-radius:50%;background:var(--text-3,#64748b)"></span>
                <span style="color:#10b981;font-weight:700">Active</span>
              </div>
            </div>
          </div>

          <!-- Center/Full: Headlines Ticker (Single Speed Adjustment Control) -->
          <div style="flex:1;min-width:280px;display:flex;align-items:center">
            ${this.renderHeadlinesTicker(tickerItemsHtml)}
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════
             3. APPROVAL REQUESTS QUEUE & EXECUTIVE PRIORITY ACTION INBOX
        ══════════════════════════════════════════════════════ -->
        ${this.renderActionCenterInbox()}

        <!-- ══════════════════════════════════════════════════════
             4. TOTAL EMPLOYEES, ACTIVE EMPLOYEES SO ON (6 KPI CARDS)
        ══════════════════════════════════════════════════════ -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">
          ${this.kpiCard('Total Employees', scopedEmps.length || 128, 'fa-users', '#2563eb', '12%', 'up', [65,70,68,74,80,88,128])}
          ${this.kpiCard('Active Employees', totalEmps || 112, 'fa-box', '#10b981', '8%', 'up', [75,82,85,90,95,105,112])}
          ${this.kpiCard('Inactive Employees', inactiveEmps || 16, 'fa-user-slash', '#ef4444', '5%', 'down', [25,22,20,19,18,17,16])}
          ${this.kpiCard('New Joiners', newJoiners || 6, 'fa-comment-dots', '#8b5cf6', '50%', 'up', [2,3,2,4,3,5,6])}
          ${this.kpiCard('On Leave Today', onLeave || 18, 'fa-clock', '#f97316', '10%', 'down', [24,22,21,20,22,19,18])}
          ${this.kpiCard('Pending Requests', pendingLeaves || 24, 'fa-file-lines', '#06b6d4', '20%', 'up', [14,16,18,19,21,22,24])}
        </div>

        <!-- ══════════════════════════════════════════════════════
             5. QUICK ACTIONS IN 6-COLUMN GRID (LIKE EMPLOYEES DETAILS ABOVE)
        ══════════════════════════════════════════════════════ -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">
          <!-- Action 1: Add Employee -->
          <div onclick="App.navigate('employees');setTimeout(()=>Employees.showAddForm(),100)" class="card" style="padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(37,99,235,0.06);transition:transform .15s,box-shadow .15s" title="Add New Employee">
            <div style="width:32px;height:32px;border-radius:8px;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
              <i class="fa fa-user-plus"></i>
            </div>
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:800;color:#1e40af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Add Employee</div>
              <div style="font-size:9.5px;color:#3b82f6;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Onboard Staff</div>
            </div>
          </div>

          <!-- Action 2: Apply Leave -->
          <div onclick="App.navigate('leaves');setTimeout(()=>Leaves.showApplyForm(),100)" class="card" style="padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(22,163,74,0.06);transition:transform .15s,box-shadow .15s" title="Submit Leave Request">
            <div style="width:32px;height:32px;border-radius:8px;background:#dcfce7;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
              <i class="fa fa-file-lines"></i>
            </div>
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:800;color:#166534;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Apply Leave</div>
              <div style="font-size:9.5px;color:#15803d;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Submit Request</div>
            </div>
          </div>

          <!-- Action 3: Attendance -->
          <div onclick="App.navigate('attendance')" class="card" style="padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(234,88,12,0.06);transition:transform .15s,box-shadow .15s" title="Attendance Log & Machine Sync">
            <div style="width:32px;height:32px;border-radius:8px;background:#ffedd5;color:#ea580c;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
              <i class="fa fa-clock"></i>
            </div>
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:800;color:#9a3412;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Attendance</div>
              <div style="font-size:9.5px;color:#c2410c;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Daily Register</div>
            </div>
          </div>

          <!-- Action 4: Payroll -->
          <div onclick="App.navigate('payroll')" class="card" style="padding:10px 12px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(147,51,234,0.06);transition:transform .15s,box-shadow .15s" title="Salary Processing & Disbursals">
            <div style="width:32px;height:32px;border-radius:8px;background:#f3e8ff;color:#9333ea;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
              <i class="fa fa-credit-card"></i>
            </div>
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:800;color:#6b21a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Payroll</div>
              <div style="font-size:9.5px;color:#7e22ce;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Disbursements</div>
            </div>
          </div>

          <!-- Action 5: Reports -->
          <div onclick="App.navigate('reports')" class="card" style="padding:10px 12px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(13,148,136,0.06);transition:transform .15s,box-shadow .15s" title="Enterprise Reports & Exports">
            <div style="width:32px;height:32px;border-radius:8px;background:#ccfbf1;color:#0d9488;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
              <i class="fa fa-file-chart-column"></i>
            </div>
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:800;color:#115e59;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Reports</div>
              <div style="font-size:9.5px;color:#0f766e;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Analytics &amp; Export</div>
            </div>
          </div>

          <!-- Action 6: AI Assistant -->
          <div onclick="Dashboard.openAgent()" class="card" style="padding:10px 12px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(124,58,237,0.06);transition:transform .15s,box-shadow .15s" title="Ask AI HR Assistant">
            <div style="width:32px;height:32px;border-radius:8px;background:#ede9fe;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
              <i class="fa fa-robot"></i>
            </div>
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:800;color:#5b21b6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">AI Assistant</div>
              <div style="font-size:9.5px;color:#6d28d9;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Ask Co-Pilot</div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════
             6. FULL SPACE: MONTHLY JOINING TRENDS, RECRUITMENT PIPELINE & DEPARTMENT STAFF
        ══════════════════════════════════════════════════════ -->
        <div class="card" style="padding:14px 18px;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:30px;height:30px;border-radius:8px;background:#f0fdf4;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:13px">
                <i class="fa fa-user-plus"></i>
              </div>
              <div>
                <div style="font-size:14px;font-weight:800;color:var(--text)">Monthly Joining Trends, Recruitment Pipeline &amp; Department Staff</div>
                <div style="font-size:10.5px;color:var(--text-3)">Enterprise talent acquisition funnel &bull; 6-month onboardings &bull; Headcount by department</div>
              </div>
            </div>
            <button class="btn btn-ghost btn-xs" onclick="App.navigate('recruitment')" style="color:#16a34a;font-weight:700;font-size:11px">
              <i class="fa fa-arrow-up-right-from-square"></i> View Pipeline
            </button>
          </div>

          <!-- Top: Recruitment Pipeline Summary Badges (5 badges across full width) -->
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#15803d;text-transform:uppercase">Open Jobs</div>
              <div style="font-size:17px;font-weight:900;color:#16a34a;margin-top:1px">5</div>
              <div style="font-size:9px;color:#166534">Active Positions</div>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#1d4ed8;text-transform:uppercase">Applicants</div>
              <div style="font-size:17px;font-weight:900;color:#2563eb;margin-top:1px">67</div>
              <div style="font-size:9px;color:#1e40af">Under Evaluation</div>
            </div>
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#7e22ce;text-transform:uppercase">Interviewing</div>
              <div style="font-size:17px;font-weight:900;color:#9333ea;margin-top:1px">8</div>
              <div style="font-size:9px;color:#6b21a8">Shortlisted</div>
            </div>
            <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#a16207;text-transform:uppercase">Offers Extended</div>
              <div style="font-size:17px;font-weight:900;color:#ca8a04;margin-top:1px">3</div>
              <div style="font-size:9px;color:#854d0e">Awaiting Sign</div>
            </div>
            <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#0e7490;text-transform:uppercase">New Joiners</div>
              <div style="font-size:17px;font-weight:900;color:#0891b2;margin-top:1px">${newJoiners || 6}</div>
              <div style="font-size:9px;color:#155e75">Last 30 Days</div>
            </div>
          </div>

          <!-- Bottom Split: 6-Month Hiring Chart (Left 58%) + Department Progress Bars (Right 42%) -->
          <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px;align-items:start">
            <div style="background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:10px 12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-size:11.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:5px">
                  <i class="fa fa-chart-simple" style="color:#3b82f6"></i> 6-Month Joining Trend
                </span>
                <span style="font-size:10px;color:var(--text-3);font-weight:600">Past 2 Quarters</span>
              </div>
              <div style="height:140px;position:relative">
                <canvas id="chart-monthly-joining" height="140"></canvas>
              </div>
            </div>

            <!-- Department Wise Employees Progress Bars -->
            <div style="background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:10px 12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:11.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:5px">
                  <i class="fa fa-sitemap" style="color:#2563eb"></i> Staff by Department
                </span>
                <span style="font-size:10px;color:var(--text-3);font-weight:700">Total: ${totalEmps} Staff</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                ${[
                  { name: 'IT & Dev', count: 32, max: 40, color: '#3b82f6' },
                  { name: 'HR & Admin', count: 18, max: 40, color: '#f97316' },
                  { name: 'Finance', count: 15, max: 40, color: '#10b981' },
                  { name: 'Sales', count: 22, max: 40, color: '#8b5cf6' },
                  { name: 'Operations', count: 28, max: 40, color: '#06b6d4' },
                  { name: 'Support', count: 13, max: 40, color: '#ec4899' },
                ].map(d => `
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <span style="font-size:10.5px;color:var(--text-2);min-width:75px;white-space:nowrap">${d.name}</span>
                    <div style="flex:1;height:7px;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:4px;overflow:hidden">
                      <div style="width:${Math.round((d.count/d.max)*100)}%;height:100%;background:${d.color};border-radius:4px"></div>
                    </div>
                    <strong style="font-size:10.5px;color:var(--text);min-width:20px;text-align:right">${d.count}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════
             7. FULL SPACE: LEAVE SUMMARY & STATISTICS
        ══════════════════════════════════════════════════════ -->
        <div class="card" style="padding:14px 18px;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:30px;height:30px;border-radius:8px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:13px">
                <i class="fa fa-calendar-check"></i>
              </div>
              <div>
                <div style="font-size:14px;font-weight:800;color:var(--text)">Leave Summary &amp; Statistics</div>
                <div style="font-size:10.5px;color:var(--text-3)">Statutory leave utilization &bull; Category distributions &bull; Approval queue telemetry</div>
              </div>
            </div>
            <button class="btn btn-ghost btn-xs" onclick="App.navigate('leaves')" style="color:#2563eb;font-weight:700;font-size:11px">
              <i class="fa fa-arrow-up-right-from-square"></i> View Full Leaves
            </button>
          </div>

          <!-- Top: Leave KPI Badges across full width -->
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px">
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#c2410c;text-transform:uppercase">Pending Requests</div>
              <div style="font-size:17px;font-weight:900;color:#ea580c;margin-top:1px">${pendingLeaves || 24}</div>
              <div style="font-size:9px;color:#9a3412">Requires Action</div>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#15803d;text-transform:uppercase">Approved YTD</div>
              <div style="font-size:17px;font-weight:900;color:#16a34a;margin-top:1px">${approvedLeaves || 38}</div>
              <div style="font-size:9px;color:#166534">Processed</div>
            </div>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#b91c1c;text-transform:uppercase">Rejected</div>
              <div style="font-size:17px;font-weight:900;color:#dc2626;margin-top:1px">${rejectedLeaves || 5}</div>
              <div style="font-size:9px;color:#991b1b">Declined</div>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#1d4ed8;text-transform:uppercase">On Leave Today</div>
              <div style="font-size:17px;font-weight:900;color:#2563eb;margin-top:1px">${onLeave || 18}</div>
              <div style="font-size:9px;color:#1e40af">Absent from Duty</div>
            </div>
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:6px 10px;text-align:center">
              <div style="font-size:9px;font-weight:700;color:#7e22ce;text-transform:uppercase">Avg Annual Balance</div>
              <div style="font-size:17px;font-weight:900;color:#9333ea;margin-top:1px">14.5d</div>
              <div style="font-size:9px;color:#6b21a8">Per Employee</div>
            </div>
          </div>

          <!-- Bottom: Donut Chart + Category Breakdown + Department Utilization Matrix (3 Columns) -->
          <div style="display:grid;grid-template-columns:1fr 1.2fr 1.3fr;gap:16px;align-items:center">
            <!-- Col 1: Donut Chart -->
            <div style="background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:12px;display:flex;align-items:center;justify-content:center;position:relative">
              <div style="position:relative;width:125px;height:125px">
                <canvas id="chart-leave-stats" width="125" height="125"></canvas>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none">
                  <div style="font-size:18px;font-weight:900;color:var(--text);line-height:1">${onLeave || 18}</div>
                  <div style="font-size:9px;color:var(--text-3);font-weight:700">On Leave</div>
                </div>
              </div>
            </div>

            <!-- Col 2: Leave Categories breakdown -->
            <div style="background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:12px">
              <div style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:8px">Leave Category Split</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:#3b82f6"></span><span style="font-size:11px;color:var(--text-2)">Annual Leave</span></div><strong style="font-size:11px;color:var(--text)">10 (55%)</strong></div>
                <div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:#10b981"></span><span style="font-size:11px;color:var(--text-2)">Sick Leave</span></div><strong style="font-size:11px;color:var(--text)">4 (22%)</strong></div>
                <div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:#f59e0b"></span><span style="font-size:11px;color:var(--text-2)">Casual Leave</span></div><strong style="font-size:11px;color:var(--text)">2 (11%)</strong></div>
                <div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:#ef4444"></span><span style="font-size:11px;color:var(--text-2)">Unpaid Leave</span></div><strong style="font-size:11px;color:var(--text)">1 (6%)</strong></div>
                <div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:#8b5cf6"></span><span style="font-size:11px;color:var(--text-2)">Others</span></div><strong style="font-size:11px;color:var(--text)">1 (6%)</strong></div>
              </div>
            </div>

            <!-- Col 3: Department Absence Distribution & Policies -->
            <div style="background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:11.5px;font-weight:700;color:var(--text)">Absence by Department</span>
                <span style="font-size:9.5px;color:#2563eb;font-weight:700;background:#eff6ff;padding:1px 6px;border-radius:4px;border:1px solid #bfdbfe">Statutory Policy</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10.5px">
                <div style="background:var(--card,#ffffff);padding:5px 8px;border-radius:6px;border:1px solid var(--border,#e2e8f0);display:flex;justify-content:space-between"><span style="color:var(--text-2)">IT &amp; Dev</span><strong style="color:#ef4444">6 Away</strong></div>
                <div style="background:var(--card,#ffffff);padding:5px 8px;border-radius:6px;border:1px solid var(--border,#e2e8f0);display:flex;justify-content:space-between"><span style="color:var(--text-2)">Operations</span><strong style="color:#f97316">5 Away</strong></div>
                <div style="background:var(--card,#ffffff);padding:5px 8px;border-radius:6px;border:1px solid var(--border,#e2e8f0);display:flex;justify-content:space-between"><span style="color:var(--text-2)">HR &amp; Admin</span><strong style="color:#10b981">3 Away</strong></div>
                <div style="background:var(--card,#ffffff);padding:5px 8px;border-radius:6px;border:1px solid var(--border,#e2e8f0);display:flex;justify-content:space-between"><span style="color:var(--text-2)">Sales</span><strong style="color:#8b5cf6">2 Away</strong></div>
              </div>
              <div style="font-size:9.5px;color:var(--text-3);margin-top:8px;line-height:1.3">
                <i class="fa fa-info-circle" style="color:#3b82f6"></i> Pakistan Labor Law: 14 consecutive days earned annual leave entitlement applies to confirmed personnel.
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════
             8. FULL SPACE: TODAY'S ATTENDANCE, RECENT ATTENDANCE & LATE ARRIVALS
                (WITH BREAK IN/OUT, TOTAL BREAK TIME, WORKING HOURS & REMARKS)
        ══════════════════════════════════════════════════════ -->
        <div class="card" style="padding:14px 18px;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:30px;height:30px;border-radius:8px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:13px">
                <i class="fa fa-clock"></i>
              </div>
              <div>
                <div style="font-size:14px;font-weight:800;color:var(--text)">Today's Attendance, Recent Attendance &amp; Late Arrivals</div>
                <div style="font-size:10.5px;color:var(--text-3)">${Utils.formatDate(today)} &bull; Biometric gateway sync &bull; Break times, net duty hours &amp; punctuality remarks</div>
              </div>
            </div>
            <button class="btn btn-ghost btn-xs" onclick="App.navigate('attendance')" style="color:#2563eb;font-weight:700;font-size:11px">
              <i class="fa fa-arrow-up-right-from-square"></i> View Attendance Register
            </button>
          </div>

          <!-- Top: Today's Attendance 6 Badges across full width -->
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:12px;background:var(--surface,#f8fafc);padding:6px 8px;border-radius:8px;border:1px solid var(--border,#e2e8f0)">
            ${this.attBadge('Present', present || 92, 'fa-circle-check', '#10b981')}
            ${this.attBadge('Absent', absent || 8, 'fa-circle-xmark', '#ef4444')}
            ${this.attBadge('Late', late || 12, 'fa-clock', '#f59e0b')}
            ${this.attBadge('Half Day', halfDay || 6, 'fa-circle-half-stroke', '#8b5cf6')}
            ${this.attBadge('On Leave', onLeave || 18, 'fa-calendar-days', '#06b6d4')}
            ${this.attBadge('Overtime', todayAtt.filter(a=>a.overtime>0).length || 4, 'fa-hourglass-half', '#6366f1')}
          </div>

          <!-- Bottom Split: Attendance Table with Break In/Out & Remarks (Left) + Late Arrivals Chart (Right) -->
          <div style="display:grid;grid-template-columns:minmax(0, 1fr) 270px;gap:12px;align-items:stretch">
            <!-- Full Space Recent Attendance Table -->
            <div class="table-responsive" style="background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:8px 10px;overflow-x:auto">
              <table class="table" style="font-size:11px;margin:0;width:100%;min-width:640px">
                <thead>
                  <tr style="border-bottom:1.5px solid var(--border,#e2e8f0);color:var(--text-3);font-size:9.5px;text-transform:uppercase;letter-spacing:0.2px">
                    <th style="padding:6px 6px;font-weight:700;white-space:nowrap;text-align:left">Employee</th>
                    <th style="padding:6px 4px;font-weight:700;text-align:center;white-space:nowrap">In</th>
                    <th style="padding:6px 4px;font-weight:700;text-align:center;white-space:nowrap">Break Out</th>
                    <th style="padding:6px 4px;font-weight:700;text-align:center;white-space:nowrap">Break In</th>
                    <th style="padding:6px 4px;font-weight:700;text-align:center;white-space:nowrap">Out</th>
                    <th style="padding:6px 4px;font-weight:700;text-align:center;white-space:nowrap">Total Break</th>
                    <th style="padding:6px 4px;font-weight:700;text-align:center;white-space:nowrap">Duty Hours</th>
                    <th style="padding:6px 6px;font-weight:700;text-align:left;white-space:nowrap">Remarks</th>
                    <th style="padding:6px 4px;font-weight:700;text-align:center;white-space:nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${[
                    { name: 'Ahmed Khan', title: 'Software Engineer', in: '09:02 AM', breakOut: '01:05 PM', breakIn: '01:50 PM', out: '06:10 PM', breakTotal: '45m', hrs: '8h 23m', remarks: 'Normal Shift · On Time', status: 'Present', color: '#10b981' },
                    { name: 'Sara Malik', title: 'HR Executive', in: '09:15 AM', breakOut: '01:10 PM', breakIn: '01:55 PM', out: '06:05 PM', breakTotal: '45m', hrs: '8h 05m', remarks: 'Late Arrival (+15m)', status: 'Late', color: '#f59e0b' },
                    { name: 'Usman Ali', title: 'Accountant', in: '09:38 AM', breakOut: '01:20 PM', breakIn: '02:10 PM', out: '06:30 PM', breakTotal: '50m', hrs: '8h 02m', remarks: 'Late (+38m) · Client Meet', status: 'Late', color: '#f59e0b' },
                    { name: 'Fatima Noor', title: 'UI/UX Designer', in: '--', breakOut: '--', breakIn: '--', out: '--', breakTotal: '--', hrs: '--', remarks: 'On Leave · Annual Approved', status: 'On Leave', color: '#06b6d4' },
                    { name: 'Bilal Siddiqui', title: 'DevOps Lead', in: '08:52 AM', breakOut: '01:00 PM', breakIn: '01:40 PM', out: '06:15 PM', breakTotal: '40m', hrs: '8h 43m', remarks: 'Normal Shift · Early Punch', status: 'Present', color: '#10b981' },
                    { name: 'Zainab Qureshi', title: 'Talent Acquisition', in: '--', breakOut: '--', breakIn: '--', out: '--', breakTotal: '--', hrs: '--', remarks: 'On Leave · Casual (Day 1/2)', status: 'On Leave', color: '#06b6d4' }
                  ].map(r => `
                    <tr style="border-bottom:1px solid var(--border,#e2e8f0)">
                      <td style="padding:6px 6px;white-space:nowrap">
                        <div style="display:flex;align-items:center;gap:6px">
                          <div style="width:24px;height:24px;border-radius:50%;background:${Utils.avatarColor(r.name.length)};display:flex;align-items:center;justify-content:center;color:#fff;font-size:9.5px;font-weight:700;flex-shrink:0">${Utils.avatarInitials(r.name)}</div>
                          <div style="min-width:0">
                            <div style="font-weight:700;color:var(--text);font-size:11px">${r.name}</div>
                            <div style="font-size:9px;color:var(--text-3)">${r.title}</div>
                          </div>
                        </div>
                      </td>
                      <td style="padding:6px 4px;color:var(--text);font-weight:700;text-align:center;white-space:nowrap">${r.in}</td>
                      <td style="padding:6px 4px;color:var(--text-2);text-align:center;white-space:nowrap">${r.breakOut}</td>
                      <td style="padding:6px 4px;color:var(--text-2);text-align:center;white-space:nowrap">${r.breakIn}</td>
                      <td style="padding:6px 4px;color:var(--text);font-weight:700;text-align:center;white-space:nowrap">${r.out}</td>
                      <td style="padding:6px 4px;color:var(--text-2);font-weight:600;text-align:center;white-space:nowrap">${r.breakTotal}</td>
                      <td style="padding:6px 4px;color:#2563eb;font-weight:800;text-align:center;white-space:nowrap">${r.hrs}</td>
                      <td style="padding:6px 6px;white-space:nowrap" title="${r.remarks}">
                        <span style="font-size:9.5px;color:var(--text-2);font-weight:600;display:inline-flex;align-items:center;gap:4px">
                          ${r.status === 'Late' ? '<i class="fa fa-triangle-exclamation" style="color:#f59e0b"></i>' : r.status === 'On Leave' ? '<i class="fa fa-calendar-xmark" style="color:#06b6d4"></i>' : '<i class="fa fa-circle-check" style="color:#10b981"></i>'}
                          ${r.remarks}
                        </span>
                      </td>
                      <td style="padding:6px 4px;text-align:center;white-space:nowrap">
                        <span style="background:${r.color}15;color:${r.color};font-size:9.5px;font-weight:800;padding:2px 6px;border-radius:4px;border:1px solid ${r.color}30">${r.status}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Late Arrivals by Department Chart & Telemetry (No empty space!) -->
            <div style="background:var(--surface,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <span style="font-size:11.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:5px">
                    <i class="fa fa-business-time" style="color:#f59e0b"></i> Late Arrivals by Dept
                  </span>
                  <span style="font-size:9.5px;font-weight:700;color:#d97706;background:#fffbeb;padding:1px 6px;border-radius:4px;border:1px solid #fde68a">
                    Aug 2026
                  </span>
                </div>
                <div style="height:140px;position:relative">
                  <canvas id="chart-late-arrivals" height="140"></canvas>
                </div>
              </div>

              <!-- Punctuality Telemetry filling the empty space below chart -->
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border,#e2e8f0);display:flex;flex-direction:column;gap:5px">
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px">
                  <span style="color:var(--text-3);font-weight:600">Punctuality Rate</span>
                  <strong style="color:#10b981;font-weight:800">91.4% Punctual</strong>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px">
                  <span style="color:var(--text-3);font-weight:600">Average Delay</span>
                  <strong style="color:#f59e0b;font-weight:800">22 mins</strong>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px">
                  <span style="color:var(--text-3);font-weight:600">Grace Policy</span>
                  <span style="color:#2563eb;font-weight:700;background:#eff6ff;padding:1px 5px;border-radius:3px;font-size:9px">15m Applied</span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px">
                  <span style="color:var(--text-3);font-weight:600">Top Late Dept</span>
                  <strong style="color:#ef4444;font-weight:800">IT &amp; Dev (14)</strong>
                </div>
              </div>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════════════
             9. ROW: UPCOMING BIRTHDAYS (SEPARATE), UPCOMING HOLIDAYS (SEPARATE) & EXECUTIVE PAYROLL TELEMETRY
        ══════════════════════════════════════════════════════ -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:stretch">
          <!-- Card 1: Upcoming Birthdays (Separate Card) -->
          <div class="card" style="padding:14px 16px;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03);display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div style="font-size:13.5px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px">
                  <i class="fa fa-cake-candles" style="color:#ec4899;font-size:13px"></i> Upcoming Birthdays
                </div>
                <button class="btn btn-ghost btn-xs" onclick="App.navigate('events')" style="color:#ec4899;font-weight:700;font-size:10.5px">Events Hub</button>
              </div>

              <!-- Featured Birthday Highlight -->
              <div style="padding:8px 10px;background:rgba(236,72,153,0.08);border:1px solid rgba(236,72,153,0.25);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:8px;min-width:0">
                  <div style="width:34px;height:34px;border-radius:50%;background:${Utils.avatarColor(featuredBday.id || 1)};color:white;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #ec4899;flex-shrink:0">
                    ${Utils.avatarInitials(featuredBday.fullName)}
                  </div>
                  <div style="min-width:0">
                    <div style="font-size:12px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                      ${isCelebToday ? '🎉 ' : '🎂 '}${featuredBday.fullName}
                    </div>
                    <div style="font-size:9.5px;color:#db2777;font-weight:600">
                      ${isCelebToday ? "Today's Celebration!" : 'Birthday on ' + (featuredBday.dob?.slice(5) || 'Upcoming')}
                    </div>
                  </div>
                </div>
                <button onclick="Dashboard.showBirthdayWishModal(${featuredBday.id})" class="btn btn-xs" style="background:#ec4899;color:#fff;border:none;border-radius:6px;padding:3px 9px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0">
                  <i class="fa fa-wand-magic-sparkles"></i> Wish
                </button>
              </div>

              <!-- Birthdays List -->
              <div style="display:flex;flex-direction:column;gap:5px">
                ${[
                  { name: 'Ali Raza', role: 'Software Engineer', date: '08 Oct' },
                  { name: 'Sana Khan', role: 'HR Specialist', date: '12 Oct' },
                  { name: 'Usman Ali', role: 'Sr. Accountant', date: '15 Oct' },
                  { name: 'Fatima Noor', role: 'UI/UX Designer', date: '22 Oct' }
                ].map(b => `
                  <div style="display:flex;align-items:center;justify-content:space-between;font-size:10.5px;padding:4px 6px;background:var(--surface,#f8fafc);border-radius:6px;border:1px solid var(--border,#f1f5f9)">
                    <div>
                      <span style="color:var(--text);font-weight:700">${b.name}</span>
                      <span style="color:var(--text-3);font-size:9px;margin-left:4px">(${b.role})</span>
                    </div>
                    <span style="color:#f97316;font-weight:700;font-size:10px">${b.date} 🎈</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Card 2: Upcoming Holidays (Separate Card) -->
          <div class="card" style="padding:14px 16px;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03);display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div style="font-size:13.5px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px">
                  <i class="fa fa-umbrella-beach" style="color:#2563eb;font-size:13px"></i> Upcoming Holidays
                </div>
                <button class="btn btn-ghost btn-xs" onclick="App.navigate('leaves')" style="color:#2563eb;font-weight:700;font-size:10.5px">Leave Calendar</button>
              </div>

              <!-- Upcoming Statutory Holidays List -->
              <div style="display:flex;flex-direction:column;gap:6px">
                ${[
                  { name: 'Eid ul Fitr', dates: '09 - 11 Apr', type: 'Gazetted Holiday (3 Days)', tag: '🌴 In 14 Days', color: '#10b981' },
                  { name: 'Labour Day', dates: '01 May', type: 'National Public Holiday', tag: '🌴 Statutory', color: '#3b82f6' },
                  { name: 'Eid ul Adha', dates: '17 - 19 Jun', type: 'Gazetted Holiday (3 Days)', tag: '🌴 Scheduled', color: '#8b5cf6' },
                  { name: 'Independence Day', dates: '14 Aug', type: 'National Celebration', tag: '🌴 Gazetted', color: '#06b6d4' }
                ].map(h => `
                  <div style="padding:6px 8px;background:var(--surface,#f8fafc);border-radius:6px;border:1px solid var(--border,#f1f5f9);display:flex;align-items:center;justify-content:space-between">
                    <div>
                      <div style="font-size:11px;font-weight:700;color:var(--text)">${h.name}</div>
                      <div style="font-size:9px;color:var(--text-3)">${h.type} &bull; ${h.dates}</div>
                    </div>
                    <span style="font-size:9.5px;font-weight:700;color:${h.color};background:${h.color}15;padding:2px 6px;border-radius:4px;border:1px solid ${h.color}30">${h.tag}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div style="font-size:9px;color:var(--text-3);margin-top:8px">
              <i class="fa fa-check-double" style="color:#10b981"></i> Pakistan Federal Gazetted Calendar Synced
            </div>
          </div>

          <!-- Card 3: Executive Payroll & Statutory Compliance Report -->
          <div class="card" style="padding:14px 16px;background:var(--card,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03);display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div style="font-size:13.5px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px">
                  <i class="fa fa-file-invoice-dollar" style="color:#10b981;font-size:13px"></i> Payroll &amp; Tax Telemetry
                </div>
                <button class="btn btn-ghost btn-xs" onclick="App.navigate('payroll')" style="color:#10b981;font-weight:700;font-size:10.5px">Payroll Run</button>
              </div>

              <!-- Monthly Gross & Net Payout Headline Banner -->
              <div style="padding:8px 10px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
                <div>
                  <div style="font-size:9.5px;color:#059669;font-weight:700;text-transform:uppercase;letter-spacing:0.3px">Aug 2026 Disbursed Net</div>
                  <div style="font-size:14px;font-weight:900;color:var(--text);letter-spacing:-0.2px">₨ 4,850,000</div>
                </div>
                <span style="font-size:9.5px;font-weight:800;color:#059669;background:#d1fae5;padding:2px 7px;border-radius:5px;border:1px solid #a7f3d0">
                  <i class="fa fa-circle-check"></i> 100% Cleared
                </span>
              </div>

              <!-- Statutory Telemetry Rows -->
              <div style="display:flex;flex-direction:column;gap:6px">
                <div style="padding:6px 8px;background:var(--surface,#f8fafc);border-radius:6px;border:1px solid var(--border,#f1f5f9);display:flex;align-items:center;justify-content:space-between">
                  <div>
                    <div style="font-size:11px;font-weight:700;color:var(--text)">FBR Salaried Tax (2025-27)</div>
                    <div style="font-size:9px;color:var(--text-3)">Progressive Slab Withholding</div>
                  </div>
                  <strong style="font-size:10.5px;color:#ef4444;font-weight:800">₨ 412,500</strong>
                </div>

                <div style="padding:6px 8px;background:var(--surface,#f8fafc);border-radius:6px;border:1px solid var(--border,#f1f5f9);display:flex;align-items:center;justify-content:space-between">
                  <div>
                    <div style="font-size:11px;font-weight:700;color:var(--text)">EOBI &amp; Provident Fund</div>
                    <div style="font-size:9px;color:var(--text-3)">Employer + Employee Match</div>
                  </div>
                  <strong style="font-size:10.5px;color:#3b82f6;font-weight:800">₨ 184,200</strong>
                </div>

                <div style="padding:6px 8px;background:var(--surface,#f8fafc);border-radius:6px;border:1px solid var(--border,#f1f5f9);display:flex;align-items:center;justify-content:space-between">
                  <div>
                    <div style="font-size:11px;font-weight:700;color:var(--text)">Disbursal Gateway Batch</div>
                    <div style="font-size:9px;color:var(--text-3)">1Link / HBL Corporate · 120 Vouchers</div>
                  </div>
                  <span style="font-size:9px;font-weight:700;color:#10b981;background:#ecfdf5;padding:2px 6px;border-radius:4px;border:1px solid #a7f3d0">Batch PK-26</span>
                </div>
              </div>
            </div>
            <div style="font-size:9px;color:var(--text-3);margin-top:8px;display:flex;align-items:center;justify-content:space-between">
              <span><i class="fa fa-shield-halved" style="color:#10b981"></i> FBR Statutory Compliant</span>
              <span style="color:var(--text-3)">Audited Aug 31</span>
            </div>
          </div>
        </div>

        <!-- Multi-Company Portfolio (Consolidated Holding Bar) -->
        ${this.renderMultiCompanyPortfolio(emps, att, salary, companies, activeCompanyId)}

      </div>
    `;// Render charts & animated number counters after DOM is ready
    setTimeout(() => {
      this.renderCharts(att.filter(a => scopedIds.includes(a.employeeId)), scopedEmps, scopedLeaves, Auth.role === 'dept_manager');
      this.startPunchClockTimer();
      this.startAutoSync();
      if (typeof Utils !== 'undefined' && Utils.animateCounter) {
        document.querySelectorAll('.animate-count-up').forEach(el => {
          const val = el.textContent.trim();
          Utils.animateCounter(el, val, 750);
        });
      }
    }, 100);
  },

  switchAttendanceRange(range = '7d') {
    document.querySelectorAll('.chart-range-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.range === range);
    });
    const sub = document.getElementById('att-trend-subtitle');
    if (sub) {
      sub.textContent = range === '90d' ? 'Last 90 days' : (range === '30d' ? 'Last 30 days' : 'Last 7 days');
    }
    const daysCount = range === '90d' ? 90 : (range === '30d' ? 30 : 7);
    const att = (typeof DB !== 'undefined' && DB.get ? DB.get('attendance') : []) || [];
    const emps = (typeof DB !== 'undefined' && DB.get ? DB.get('employees') : []) || [];
    const scopedEmps = (typeof Auth !== 'undefined' && Auth.getScopedEmployees) ? Auth.getScopedEmployees(emps) : emps;
    const scopedIds = scopedEmps.map(e => e.id);

    const days = [];
    const presentData = [], absentData = [], lateData = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (daysCount <= 14 || i % Math.ceil(daysCount / 10) === 0) {
        days.push(d.toLocaleDateString('en', { month: 'short', day: '2-digit' }));
      } else {
        days.push('');
      }
      const dayAtt = att.filter(a => a.date === ds && (Auth.role === 'dept_manager' ? scopedIds.includes(a.employeeId) : true));
      presentData.push(dayAtt.filter(a => a.status === 'present').length);
      absentData.push(dayAtt.filter(a => a.status === 'absent').length);
      lateData.push(dayAtt.filter(a => a.status === 'late').length);
    }

    const gridColor = 'rgba(255,255,255,0.06)';
    const textColor = '#8899aa';

    this.makeChart('chart-att-trend', 'line', days, [
      { label:'Present', data: presentData, borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.15)', tension:0.35, fill:true },
      { label:'Absent',  data: absentData,  borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.15)',  tension:0.35, fill:true },
      { label:'Late',    data: lateData,    borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.15)', tension:0.35, fill:true },
    ], gridColor, textColor);
  },

  renderActionCenterInbox() {
    const role = Auth.role;
    const isMgr = role === 'dept_manager';
    const isAdmin = role === 'superadmin' || role === 'hr_manager';
    const myId = Auth.employee?.id;

    const leaves = DB.get('leave_requests') || [];
    const expenses = DB.get('expense_claims') || [];
    const tickets = DB.get('helpdesk_tickets') || [];
    const assets = DB.get('assets') || [];
    const policies = DB.get('company_policies') || [];
    const emps = DB.get('employees') || [];

    const actions = [];

    // 0. Executive Sign-Offs (Gratuity exit settlement, multi-gate clearances)
    if (isAdmin) {
      actions.push({
        type: 'executive',
        tag: 'EXECUTIVE SIGN-OFF',
        icon: 'fa-crown',
        color: '#8b5cf6',
        title: `Tariq Masood: Gratuity & Final Settlement Sign-Off`,
        sub: `Formula: 30/26 • Net Settlement: ₨ 1,245,000 • IT & Admin Clearance Verified`,
        actions: `
          <button class="btn btn-primary btn-xs" onclick="App.navigate('settlement');setTimeout(()=>Employees.showSettlementModal?.(2),100)"><i class="fa fa-file-signature"></i> Final Sign-Off</button>
          <button class="btn btn-ghost btn-xs" onclick="App.navigate('settlement')"><i class="fa fa-eye"></i> Audit Gate</button>
        `
      });
      actions.push({
        type: 'executive',
        tag: 'CORP DISBURSAL AUDIT',
        icon: 'fa-building-shield',
        color: '#2563eb',
        title: `Group Bank Disbursal Batch Checksum Verification`,
        sub: `1Link & HBL Corporate Batch PK-2026-08 • 120 Vouchers • Total: Rs 4.85M`,
        actions: `
          <button class="btn btn-success btn-xs" onclick="App.navigate('payroll')"><i class="fa fa-check-double"></i> Authorize Batch</button>
        `
      });
    }

    // Overtime approvals
    const otList = [
      { name: 'Ali Raza', hrs: '3.5 hrs', date: 'Yesterday', reason: 'Critical server migration deployment' },
      { name: 'Usman Ali', hrs: '2.0 hrs', date: '07 Oct', reason: 'Month-end ledger balancing' },
      { name: 'Fatima Noor', hrs: '4.0 hrs', date: '06 Oct', reason: 'Mobile UI redesign sprint' }
    ];
    otList.forEach(ot => {
      actions.push({
        type: 'overtime',
        tag: 'OVERTIME CLAIM',
        icon: 'fa-hourglass-half',
        color: '#6366f1',
        title: `${ot.name}: ${ot.hrs} Overtime Claim`,
        sub: `Date: ${ot.date} • Reason: ${ot.reason}`,
        actions: `
          <button class="btn btn-success btn-xs" onclick="Toast.show('Overtime approved for ${ot.name}', 'success')"><i class="fa fa-check"></i> Approve</button>
          <button class="btn btn-secondary btn-xs" onclick="Toast.show('Overtime rejected for ${ot.name}', 'info')"><i class="fa fa-times"></i> Reject</button>
        `
      });
    });

    // Attendance Regularization approvals
    const regList = [
      { name: 'Bilal Ahmad', date: 'Yesterday', reason: 'Biometric device timeout / missed punch' },
      { name: 'Maria Khan', date: '07 Oct', reason: 'Client site audit visit check-in' }
    ];
    regList.forEach(reg => {
      actions.push({
        type: 'regularization',
        tag: 'REGULARIZATION',
        icon: 'fa-user-clock',
        color: '#f59e0b',
        title: `${reg.name}: Missed Punch Regularization`,
        sub: `Date: ${reg.date} • Note: ${reg.reason}`,
        actions: `
          <button class="btn btn-success btn-xs" onclick="Toast.show('Regularization approved for ${reg.name}', 'success')"><i class="fa fa-check"></i> Approve</button>
          <button class="btn btn-secondary btn-xs" onclick="Toast.show('Regularization rejected for ${reg.name}', 'info')"><i class="fa fa-times"></i> Reject</button>
        `
      });
    });

    // 1. Pending Leave Approvals
    if (isMgr) {
      const myDeptEmps = emps.filter(e => e.managerId === myId || e.reportingTo === myId).map(e => e.id);
      leaves.filter(l => l.status === 'pending' && myDeptEmps.includes(l.employeeId)).forEach(l => {
        const u = emps.find(e => e.id === l.employeeId);
        actions.push({
          type: 'leave',
          tag: 'LEAVE APPROVAL',
          icon: 'fa-calendar-xmark',
          color: 'var(--warning)',
          title: `${u?.fullName || 'Employee'} requested ${l.days || 1} day(s) ${Utils.getLeaveTypeName(l.leaveTypeId)}`,
          sub: `${l.from} → ${l.to} • "${l.reason || 'Personal emergency'}"`,
          actions: Auth.can('leaves.approve') ? `
            <button class="btn btn-success btn-xs" onclick="Leaves.approve(${l.id})"><i class="fa fa-check"></i> Approve</button>
            <button class="btn btn-danger btn-xs" onclick="Leaves.reject(${l.id})"><i class="fa fa-times"></i> Reject</button>
          ` : `<span class="badge badge-secondary">Pending Approval</span>`
        });
      });
    } else if (isAdmin) {
      leaves.filter(l => l.status === 'pending' || l.status === 'manager_approved').slice(0, 3).forEach(l => {
        const u = emps.find(e => e.id === l.employeeId);
        actions.push({
          type: 'leave',
          tag: l.status === 'manager_approved' ? 'HR FINAL APPROVAL' : 'LEAVE REQUEST',
          icon: 'fa-calendar-check',
          color: l.status === 'manager_approved' ? 'var(--info)' : 'var(--warning)',
          title: `${u?.fullName || 'Employee'} requested ${l.days || 1} day(s) ${Utils.getLeaveTypeName(l.leaveTypeId)}`,
          sub: `${l.from} → ${l.to} ${l.status === 'manager_approved' ? '(Endorsed by Dept Manager)' : ''}`,
          actions: Auth.can('leaves.approve') ? `
            <button class="btn btn-success btn-xs" onclick="Leaves.approve(${l.id})"><i class="fa fa-check"></i> Final Approve</button>
            <button class="btn btn-danger btn-xs" onclick="Leaves.reject(${l.id})"><i class="fa fa-times"></i> Reject</button>
          ` : `<span class="badge badge-secondary">Pending Corporate Signoff</span>`
        });
      });
    }

    // 2. Pending Expense Claims
    if (isMgr) {
      expenses.filter(c => c.status === 'pending_manager' && c.employeeId !== myId).forEach(c => {
        const u = emps.find(e => e.id === c.employeeId);
        actions.push({
          type: 'expense',
          tag: 'EXPENSE ENDORSEMENT',
          icon: 'fa-receipt',
          color: 'var(--primary)',
          title: `${u?.fullName || 'Staff'} claimed ${c.claimNumber}: ₨ ${(c.amount||0).toLocaleString()}`,
          sub: `${c.title} • Merchant: ${c.merchant}`,
          actions: `
            <button class="btn btn-primary btn-xs" onclick="App.navigate('expenses');setTimeout(()=>Expenses.reviewClaim(${c.id},'manager'),100)"><i class="fa fa-stamp"></i> Review</button>
          `
        });
      });
    } else if (isAdmin) {
      expenses.filter(c => c.status === 'pending_finance').slice(0, 3).forEach(c => {
        const u = emps.find(e => e.id === c.employeeId);
        actions.push({
          type: 'expense',
          tag: 'FINANCE PAYOUT AUDIT',
          icon: 'fa-money-bill-transfer',
          color: 'var(--success)',
          title: `${c.claimNumber}: ₨ ${(c.amount||0).toLocaleString()} for ${u?.fullName}`,
          sub: `${c.title} (Manager Endorsed)`,
          actions: `
            <button class="btn btn-success btn-xs" onclick="App.navigate('expenses');setTimeout(()=>Expenses.reviewClaim(${c.id},'finance'),100)"><i class="fa fa-check"></i> Authorize</button>
          `
        });
      });
    }

    // 3. Urgent Helpdesk Tickets
    if (isAdmin) {
      tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').slice(0, 2).forEach(t => {
        actions.push({
          type: 'ticket',
          tag: 'URGENT SLA INCIDENT',
          icon: 'fa-bolt',
          color: 'var(--danger)',
          title: `${t.ticketNumber}: ${t.title}`,
          sub: `Target SLA: ${t.slaHours}h • Department: ${t.department}`,
          actions: `
            <button class="btn btn-danger btn-xs" onclick="App.navigate('helpdesk');setTimeout(()=>Helpdesk.openTicketWorkspace(${t.id}),100)"><i class="fa fa-reply"></i> Open Workspace</button>
          `
        });
      });
    }

    // 4. Unsigned Corporate Policies (for current user)
    policies.filter(p => !(p.acknowledgments || []).some(a => a.employeeId === myId)).slice(0, 2).forEach(p => {
      actions.push({
        type: 'policy',
        tag: 'COMPLIANCE MANDATE',
        icon: 'fa-signature',
        color: 'var(--primary)',
        title: `Mandatory Compliance: ${p.code} - ${p.title}`,
        sub: `Version: ${p.version} • Requires employee electronic acknowledgment`,
        actions: `
          <button class="btn btn-primary btn-xs" onclick="App.navigate('events');setTimeout(()=>{Events.switchView('policies');Events.showSignPolicyModal(${p.id});},100)"><i class="fa fa-pen"></i> Sign Now</button>
        `
      });
    });

    // 5. Unacknowledged Assets (for current user)
    assets.filter(a => a.assignedTo === myId && !a.acknowledged).forEach(a => {
      actions.push({
        type: 'asset',
        tag: 'HARDWARE HANDOVER',
        icon: 'fa-laptop-file',
        color: 'var(--secondary)',
        title: `Pending Custody Signature: ${a.assetTag} (${a.name})`,
        sub: `Serial: ${a.serialNumber} • Handed over to your custody`,
        actions: `
          <button class="btn btn-secondary btn-xs" onclick="App.navigate('assets');setTimeout(()=>Assets.acknowledgeCustody(${a.id}),100)"><i class="fa fa-file-signature"></i> Sign Handover</button>
        `
      });
    });

    // 5b. Urgent Expiring Documents & CNIC Expiry Notices (for current user)
    const docExpiries = DB.get('document_expiries') || [];
    const todayDate = new Date();
    docExpiries.filter(d => parseInt(d.employeeId) === parseInt(myId)).forEach(d => {
      const exp = new Date(d.expiryDate);
      const diffDays = Math.ceil((exp - todayDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30 || d.status === 'expired' || d.status === 'urgent') {
        const daysText = diffDays < 0 ? `EXPIRED ${Math.abs(diffDays)} day(s) ago!` : `Expires in ${diffDays} days (${d.expiryDate})`;
        actions.unshift({
          type: 'doc_expiry',
          tag: 'IDENTITY & CNIC COMPLIANCE',
          icon: 'fa-id-card-clip',
          color: 'var(--danger)',
          title: `⚠️ Action Required: Renew ${d.docType} (${d.docNumber})`,
          sub: `${daysText} • Initiated by HR. Upload renewed document to your e-DMS Vault`,
          actions: `
            <button class="btn btn-danger btn-xs" onclick="App.navigate('employees');setTimeout(()=>{if(typeof Employees!=='undefined'&&Employees.switchView)Employees.switchView('edms');},150)"><i class="fa fa-upload"></i> Upload to e-DMS</button>
          `
        });
      }
    });

    // 5c. Targeted Unread Notifications from Senior Roles (CNIC, HR Letters, Policy Directives)
    const userNotifs = DB.get('user_notifications') || [];
    userNotifs.filter(n => (parseInt(n.recipientEmpId) === parseInt(myId) || (!n.recipientEmpId && n.recipientRole === role)) && !n.read).forEach(n => {
      if (n.type === 'hr_letter') {
        actions.push({
          type: 'hr_letter',
          tag: 'OFFICIAL DOCUMENT',
          icon: 'fa-file-signature',
          color: 'var(--info)',
          title: n.title,
          sub: `${n.senderName || 'HR'} • Ready for download & print`,
          actions: `
            <button class="btn btn-info btn-xs" onclick="App.handleNotificationClick('${n.id}', 'employees', 'hr_letters')"><i class="fa fa-eye"></i> View Letter</button>
          `
        });
      } else if (n.type === 'doc_expiry' && !actions.some(a => a.type === 'doc_expiry')) {
        actions.unshift({
          type: 'doc_expiry',
          tag: 'IDENTITY & CNIC COMPLIANCE',
          icon: 'fa-id-card-clip',
          color: 'var(--danger)',
          title: n.title,
          sub: n.message,
          actions: `
            <button class="btn btn-danger btn-xs" onclick="App.handleNotificationClick('${n.id}', 'employees', 'edms')"><i class="fa fa-upload"></i> Upload to e-DMS</button>
          `
        });
      }
    });

    // 6. Pending Life Event Verifications (for Super Admin & HR Manager)
    if (isAdmin) {
      const lifeEvents = DB.get('life_events') || [];
      lifeEvents.filter(ev => ev.status === 'pending').slice(0, 2).forEach(ev => {
        const u = emps.find(e => e.id === ev.employeeId);
        actions.push({
          type: 'life_event',
          tag: 'LIFE EVENT VERIFICATION',
          icon: 'fa-people-roof',
          color: 'var(--accent)',
          title: `${u?.fullName || 'Staff'}: ${ev.title}`,
          sub: `Date: ${ev.eventDate} • ${ev.details}`,
          actions: `
            <button class="btn btn-success btn-xs" onclick="Employees.approveLifeEvent(${ev.id})"><i class="fa fa-check"></i> Verify</button>
            <button class="btn btn-danger btn-xs" onclick="Employees.rejectLifeEvent(${ev.id})"><i class="fa fa-times"></i> Reject</button>
          `
        });
      });
    }

    if (actions.length === 0) {
      return `
        <div id="dashboard-action-inbox" class="card" style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(99,102,241,0.05));border:1px solid rgba(16,185,129,0.25);border-radius:10px;padding:12px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:34px;height:34px;border-radius:8px;background:rgba(16,185,129,0.15);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:16px">
              <i class="fa fa-shield-check"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text)">All Clear — Zero Pending Approvals</div>
              <div style="font-size:11.5px;color:var(--text-3)">Your operational approval pipeline is 100% up to date. No pending actions require your immediate triage.</div>
            </div>
          </div>
          <span class="badge badge-success" style="font-size:11px;padding:4px 10px">Pipeline Up-to-Date</span>
        </div>
      `;
    }

    const isCollapsed = this.inboxCollapsed;
    const execCount = actions.filter(a => a.type === 'executive').length;
    const leaveCount = actions.filter(a => a.type === 'leave').length;
    const otCount = actions.filter(a => a.type === 'overtime').length;
    const regCount = actions.filter(a => a.type === 'regularization').length;
    const expenseCount = actions.filter(a => a.type === 'expense').length;
    const complianceCount = actions.filter(a => ['policy', 'doc_expiry', 'hr_letter', 'asset', 'ticket', 'life_event'].includes(a.type)).length;

    const summaryParts = [];
    if (execCount) summaryParts.push(`${execCount} Executive`);
    if (leaveCount) summaryParts.push(`${leaveCount} Leaves`);
    if (otCount) summaryParts.push(`${otCount} Overtime`);
    if (regCount) summaryParts.push(`${regCount} Regularize`);
    if (expenseCount) summaryParts.push(`${expenseCount} Finance`);
    if (complianceCount) summaryParts.push(`${complianceCount} Compliance`);

    const categories = [
      { id: 'all', label: `All (${actions.length})` },
      ...(execCount ? [{ id: 'executive', label: `Executive (${execCount})` }] : []),
      ...(leaveCount ? [{ id: 'leave', label: `Leaves (${leaveCount})` }] : []),
      ...(otCount ? [{ id: 'overtime', label: `Overtime (${otCount})` }] : []),
      ...(regCount ? [{ id: 'regularization', label: `Regularization (${regCount})` }] : []),
      ...(expenseCount ? [{ id: 'expense', label: `Finance (${expenseCount})` }] : []),
      ...(complianceCount ? [{ id: 'compliance', label: `Compliance (${complianceCount})` }] : [])
    ];

    const currentFilter = this.inboxFilter || 'all';
    let filteredActions = actions;
    if (currentFilter !== 'all') {
      if (currentFilter === 'compliance') {
        filteredActions = actions.filter(a => ['policy', 'doc_expiry', 'hr_letter', 'asset', 'ticket', 'life_event'].includes(a.type));
      } else {
        filteredActions = actions.filter(a => a.type === currentFilter);
      }
    }

    return `
      <div id="dashboard-action-inbox" class="card" style="border:1.5px solid rgba(99,102,241,0.25);border-radius:12px;padding:16px 20px;margin-bottom:18px;background:var(--card);box-shadow:0 2px 10px rgba(99,102,241,0.06);transition:all .2s ease">
        <!-- Header Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;${isCollapsed ? '' : 'margin-bottom:12px'}">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="width:32px;height:32px;border-radius:8px;background:rgba(99,102,241,0.12);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:14px">
              <i class="fa fa-stamp"></i>
            </div>
            <div>
              <div style="font-size:14.5px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
                Approval Requests Queue &amp; Executive Priority Action Inbox
                <span class="badge badge-warning" style="font-size:10px;font-weight:700;padding:2px 7px">
                  ${actions.length} Pending Actions
                </span>
              </div>
              <div style="font-size:11px;color:var(--text-3)">Integrated multi-gate approval workflows, statutory sign-offs &amp; attendance requests</div>
            </div>
            ${isCollapsed ? `
              <span style="font-size:11px;color:var(--text-3);margin-left:4px">
                (${summaryParts.join(' &bull; ')})
              </span>
            ` : ''}
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${!isCollapsed && categories.length > 2 ? `
              <div style="display:flex;gap:3px;background:var(--surface);padding:2px 4px;border-radius:8px;border:1px solid var(--border)">
                ${categories.map(c => `
                  <button type="button" class="btn btn-xs ${currentFilter === c.id ? 'btn-primary' : 'btn-ghost'}" 
                    style="padding:2px 7px;font-size:10.5px;border-radius:5px;${currentFilter === c.id ? 'font-weight:700;' : 'color:var(--text-3);'}" 
                    onclick="Dashboard.setInboxFilter('${c.id}')">
                    ${c.label}
                  </button>
                `).join('')}
              </div>
            ` : ''}
            <button type="button" class="btn btn-ghost btn-xs" onclick="Dashboard.toggleInboxCollapse()" title="${isCollapsed ? 'Expand inbox to review approvals' : 'Minimize inbox to save space'}" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:4px 9px;border:1px solid var(--border);border-radius:6px">
              <i class="fa ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
              <span>${isCollapsed ? `Expand (${actions.length})` : 'Minimize'}</span>
            </button>
          </div>
        </div>

        <!-- Integrated Summary Badges on Top (matching Leave Summary & Statistics) -->
        ${!isCollapsed ? `
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:12px;background:var(--surface,#f8fafc);padding:8px 10px;border-radius:10px;border:1px solid var(--border,#e2e8f0)">
            <div onclick="Dashboard.setInboxFilter('executive')" style="cursor:pointer;text-align:center;padding:5px 4px;border-radius:8px;transition:all .15s;${currentFilter === 'executive' ? 'background:#f5f3ff;border:1.5px solid #8b5cf6;' : 'border:1.5px solid transparent;'}">
              <div style="font-size:9.5px;font-weight:700;color:#7c3aed;text-transform:uppercase">Executive Sign-Offs</div>
              <div style="font-size:16px;font-weight:900;color:#6d28d9;line-height:1.2;margin-top:2px">${execCount}</div>
            </div>
            <div onclick="Dashboard.setInboxFilter('leave')" style="cursor:pointer;text-align:center;padding:5px 4px;border-radius:8px;transition:all .15s;${currentFilter === 'leave' ? 'background:#fff7ed;border:1.5px solid #ea580c;' : 'border:1.5px solid transparent;'}">
              <div style="font-size:9.5px;font-weight:700;color:#c2410c;text-transform:uppercase">Leave Approvals</div>
              <div style="font-size:16px;font-weight:900;color:#ea580c;line-height:1.2;margin-top:2px">${leaveCount}</div>
            </div>
            <div onclick="Dashboard.setInboxFilter('overtime')" style="cursor:pointer;text-align:center;padding:5px 4px;border-radius:8px;transition:all .15s;${currentFilter === 'overtime' ? 'background:#eef2ff;border:1.5px solid #6366f1;' : 'border:1.5px solid transparent;'}">
              <div style="font-size:9.5px;font-weight:700;color:#4338ca;text-transform:uppercase">Overtime Claims</div>
              <div style="font-size:16px;font-weight:900;color:#4f46e5;line-height:1.2;margin-top:2px">${otCount}</div>
            </div>
            <div onclick="Dashboard.setInboxFilter('regularization')" style="cursor:pointer;text-align:center;padding:5px 4px;border-radius:8px;transition:all .15s;${currentFilter === 'regularization' ? 'background:#fffbeb;border:1.5px solid #f59e0b;' : 'border:1.5px solid transparent;'}">
              <div style="font-size:9.5px;font-weight:700;color:#b45309;text-transform:uppercase">Regularizations</div>
              <div style="font-size:16px;font-weight:900;color:#d97706;line-height:1.2;margin-top:2px">${regCount}</div>
            </div>
            <div onclick="Dashboard.setInboxFilter('expense')" style="cursor:pointer;text-align:center;padding:5px 4px;border-radius:8px;transition:all .15s;${currentFilter === 'expense' ? 'background:#f0fdf4;border:1.5px solid #10b981;' : 'border:1.5px solid transparent;'}">
              <div style="font-size:9.5px;font-weight:700;color:#15803d;text-transform:uppercase">Finance Claims</div>
              <div style="font-size:16px;font-weight:900;color:#16a34a;line-height:1.2;margin-top:2px">${expenseCount}</div>
            </div>
            <div onclick="Dashboard.setInboxFilter('compliance')" style="cursor:pointer;text-align:center;padding:5px 4px;border-radius:8px;transition:all .15s;${currentFilter === 'compliance' ? 'background:#eff6ff;border:1.5px solid #2563eb;' : 'border:1.5px solid transparent;'}">
              <div style="font-size:9.5px;font-weight:700;color:#1d4ed8;text-transform:uppercase">Compliance &amp; SLA</div>
              <div style="font-size:16px;font-weight:900;color:#2563eb;line-height:1.2;margin-top:2px">${complianceCount}</div>
            </div>
          </div>
        ` : ''}

        <!-- Items Container (hidden if collapsed, scrollable if expanded) -->
        <div id="dashboard-inbox-items" style="${isCollapsed ? 'display:none;' : 'display:flex;flex-direction:column;gap:5px;max-height:190px;overflow-y:auto;padding-right:4px;'}">
          ${filteredActions.length === 0 ? `
            <div style="text-align:center;padding:12px;color:var(--text-3);font-size:12px">No pending items in this category.</div>
          ` : filteredActions.map(act => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;gap:10px;transition:border-color .15s">
              <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;min-width:24px;border-radius:6px;background:rgba(99,102,241,0.1);color:${act.color};font-size:11px">
                  <i class="fa ${act.icon}"></i>
                </span>
                <div style="min-width:0;flex:1;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span class="badge badge-secondary" style="font-size:9px;letter-spacing:0.3px;font-weight:700;padding:1px 5px">${act.tag}</span>
                  <span style="font-weight:700;font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${act.title}">${act.title}</span>
                  <span style="font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${act.sub}">• ${act.sub}</span>
                </div>
              </div>

              <div style="display:flex;gap:4px;flex-shrink:0">
                ${act.actions}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  statCard(label, value, icon, color, sub, change, changeDir) {
    return `
      <div class="stat-card ${color}">
        <div class="stat-header">
          <div class="stat-icon ${color}"><i class="fa ${icon}"></i></div>
          ${change ? `<span class="stat-change ${changeDir}"><i class="fa fa-arrow-${changeDir === 'up' ? 'up' : 'down'}"></i>${change}</span>` : '<span></span>'}
        </div>
        <div class="stat-value animate-count-up" data-target="${value}">${value}</div>
        <div class="stat-label">${label}</div>
        <div class="stat-sub">${sub}</div>
      </div>
    `;
  },

  miniStatCard(label, value, icon, color) {
    return `
      <div class="mini-stat-card" style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 6px;text-align:center;transition:all .2s;overflow:hidden" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
        <div style="font-size:18px;margin-bottom:4px;color:${color}"><i class="fa ${icon}"></i></div>
        <div style="font-size:22px;font-weight:800;color:${color};line-height:1.1">${value}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:3px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${label}">${label}</div>
      </div>
    `;
  },

  renderCharts(att, emps, scopedLeaves, isTeamScope) {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') !== 'light';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // ── 1. Attendance Trend (Line Chart matching reference image) ──
    const trendDays = ['02 Oct', '03 Oct', '04 Oct', '05 Oct', '06 Oct', '07 Oct', '08 Oct'];
    this.makeChart('chart-att-trend', 'line', trendDays, [
      {
        label: 'Present',
        data: [78, 86, 84, 95, 92, 106, 102],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.04)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        borderWidth: 2.5
      },
      {
        label: 'Absent',
        data: [14, 13, 15, 17, 18, 11, 12],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.04)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        borderWidth: 2.5
      },
      {
        label: 'Late',
        data: [8, 9, 8, 10, 10, 7, 7],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.04)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        borderWidth: 2.5
      }
    ], gridColor, textColor, {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0,
          max: 120,
          ticks: { stepSize: 20, color: textColor, font: { size: 10 } },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor, font: { size: 10 } },
          grid: { display: false }
        }
      }
    });

    // ── 2. Leave Statistics (Donut Chart matching reference image) ──
    this.makeChart('chart-leave-stats', 'doughnut',
      ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Unpaid Leave', 'Others'],
      [{
        data: [10, 4, 2, 1, 1],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#ffffff'
      }],
      gridColor, textColor, {
        cutout: '72%',
        plugins: { legend: { display: false } }
      }
    );

    // ── 3. Monthly Joining Chart (Last 6 Months Trend) ──
    const monthLabels = ['May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26'];
    const monthlyJoinCounts = [4, 6, 9, 14, 7, 5];
    this.makeChart('chart-monthly-joining', 'bar', monthLabels, [
      {
        label: 'New Joiners',
        data: monthlyJoinCounts,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 24,
      }
    ], gridColor, textColor, {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 3, color: textColor, font: { size: 10 } },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor, font: { size: 10 } },
          grid: { display: false }
        }
      }
    });

    // ── 4. Late Arrivals by Department (Selected Month) ──
    const deptLabels = ['IT & Dev', 'HR & Admin', 'Finance', 'Sales', 'Operations', 'Support'];
    const deptLateCounts = [14, 4, 6, 12, 9, 5];
    this.makeChart('chart-late-arrivals', 'bar', deptLabels, [
      {
        label: 'Late Arrivals',
        data: deptLateCounts,
        backgroundColor: '#f59e0b',
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 24,
      }
    ], gridColor, textColor, {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 3, color: textColor, font: { size: 10 } },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor, font: { size: 10 } },
          grid: { display: false }
        }
      }
    });
  },


  makeChart(id, type, labels, datasets, gridColor, textColor, extra = {}) {
    const el = document.getElementById(id);
    if (!el || !window.Chart) return;
    if (this.charts[id]) { this.charts[id].destroy(); }
    this.charts[id] = new Chart(el, {
      type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, font: { size: 11 }, boxWidth: 12 }, ...(extra.plugins?.legend || {}) },
          tooltip: { backgroundColor: '#1e2a3a', titleColor: '#fff', bodyColor: '#aab8c8', borderColor: '#334155', borderWidth: 1 },
        },
        scales: type === 'doughnut' ? {} : {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
        },
        ...extra,
      }
    });
  },

  toggleTickerPlay() {
    const track = document.getElementById('dash-ticker-track');
    const btn = document.getElementById('ticker-play-btn');
    if (!track || !btn) return;
    track.classList.toggle('paused');
    const isPaused = track.classList.contains('paused');
    btn.innerHTML = `<i class="fa fa-${isPaused ? 'play' : 'pause'}"></i>`;
    btn.title = isPaused ? 'Play Headlines' : 'Pause Headlines';
  },

  setTickerSpeed(speed) {
    if (!this.tickerSpeeds.includes(speed)) speed = '0.3x';
    this.tickerSpeed = speed;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hrm_ticker_speed', this.tickerSpeed);
    }
    const track = document.getElementById('dash-ticker-track');
    const btn = document.getElementById('ticker-speed-btn');
    if (track) {
      track.style.animationDuration = this.getTickerDuration(speed);
      track.classList.remove('fast', 'slow', 'speed-0-5x', 'speed-0-4x', 'speed-0-3x', 'speed-0-2x', 'speed-0-1x');
      track.classList.add('speed-' + speed.replace('.', '-'));
    }
    if (btn) {
      btn.innerHTML = `<i class="fa fa-gauge"></i> ${speed}`;
      const nextIdx = (this.tickerSpeeds.indexOf(speed) + 1) % this.tickerSpeeds.length;
      const nextSpeed = this.tickerSpeeds[nextIdx];
      btn.title = `Current Speed: ${speed} (Click for ${nextSpeed})`;
      btn.setAttribute('aria-label', `Speed ${speed}. Click to switch to ${nextSpeed}`);
    }
    const sel = document.getElementById('ticker-speed-select');
    if (sel && sel.value !== speed) sel.value = speed;
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show(`Headline speed set to ${speed}`, 'info');
    }
  },

  toggleTickerSpeed() {
    const idx = this.tickerSpeeds.indexOf(this.tickerSpeed);
    const nextIdx = (idx + 1) % this.tickerSpeeds.length;
    this.setTickerSpeed(this.tickerSpeeds[nextIdx]);
  },

  openAgent(query) {
    if (typeof HRAssistant !== 'undefined') {
      if (!HRAssistant.isOpen) HRAssistant.toggle();
      if (query) {
        setTimeout(() => HRAssistant.askQuick(query), 150);
      }
    }
  },

  askInternalAssistant(queryText) {
    this.openAgent(queryText);
  },

  clearInternalAssistant() {
    if (typeof HRAssistant !== 'undefined' && HRAssistant.clearChat) {
      HRAssistant.clearChat();
    }
  },

  focusInternalAssistant() {
    this.openAgent();
  },

  showBirthdayWishModal(empId) {
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const isToday = emp.dob?.slice(5) === Utils.today().slice(5);

    Modal.show({
      title: `<i class="fa fa-cake-candles" style="color:#ec4899;margin-right:8px"></i>${isToday ? "Today's Birthday Celebration!" : "Upcoming Birthday"}`,
      body: `
        <div style="text-align:center;padding:6px 0">
          <div style="width:70px;height:70px;border-radius:50%;background:${Utils.avatarColor(emp.id)};color:white;font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;box-shadow:0 0 24px rgba(236,72,153,0.45);border:3px solid #ec4899">
            ${Utils.avatarInitials(emp.fullName)}
          </div>
          <h3 style="font-size:17px;font-weight:800;color:var(--text);margin-bottom:2px">${emp.fullName}</h3>
          <div style="font-size:12px;color:var(--text-3);margin-bottom:14px">
            ${Utils.getDesigName(emp.designationId)} • ${Utils.getDeptName(emp.departmentId)}
          </div>
          <div style="background:linear-gradient(135deg, hsla(330,85%,60%,0.15), hsla(262,83%,62%,0.15));border:1px solid hsla(330,85%,60%,0.3);border-radius:10px;padding:12px;margin-bottom:14px">
            <div style="font-size:13px;font-weight:700;color:#f472b6;margin-bottom:2px">
              ${isToday ? "🎉 Today is their Birthday! Make their day special!" : `🎂 Birthday on ${new Date(new Date().getFullYear() + '-' + emp.dob.slice(5)).toLocaleDateString('en-US', { month:'long', day:'numeric' })}`}
            </div>
            <div style="font-size:11px;color:var(--text-2)">Send your colleague warm wishes from the entire team!</div>
          </div>

          <div style="text-align:left;margin-bottom:6px;font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Quick Wishes (Click to apply):</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;text-align:left">
            ${[
              "🎉 Happy Birthday! Wishing you an amazing year filled with success and happiness!",
              "🎂 Wishing you a wonderful birthday celebration and continued prosperity!",
              "🌟 Warmest birthday wishes to an awesome colleague and friend!",
              "🎁 Hope your special day is as fantastic and inspiring as you are!"
            ].map(msg => `
              <div style="padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:12px;cursor:pointer;transition:all .15s;color:var(--text-2)"
                onclick="document.getElementById('bday-wish-text').value='${msg.replace(/'/g, "\\'")}'"
                onmouseenter="this.style.borderColor='var(--primary)';this.style.color='var(--text)'"
                onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--text-2)'">
                ${msg}
              </div>
            `).join('')}
          </div>

          <div style="text-align:left">
            <label style="font-size:11.5px;font-weight:600;color:var(--text-3);display:block;margin-bottom:6px">Your Personal Message:</label>
            <textarea id="bday-wish-text" rows="3" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text);font-size:12.5px;resize:none" placeholder="Write your birthday message...">🎉 Happy Birthday ${emp.firstName}! Wishing you a wonderful day and a prosperous year ahead!</textarea>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #ec4899, #8b5cf6);border:none" onclick="Dashboard.sendBirthdayWish(${emp.id})">
          <i class="fa fa-paper-plane"></i> Send Birthday Wish
        </button>
      `
    });
  },

  sendBirthdayWish(empId) {
    const emp = DB.find('employees', Number(empId));
    const text = document.getElementById('bday-wish-text')?.value.trim();
    if (!text) { Toast.show('Please write a message', 'warning'); return; }

    DB.log('WISH', 'Employees', `Sent birthday wish to ${emp?.fullName || 'colleague'}: "${text.slice(0, 45)}..."`, Auth.user?.id);
    Modal.close();
    Toast.show(`🎉 Birthday wish sent to ${emp?.firstName || 'colleague'}!`, 'success', 'Delivered with greetings.');
  },

  showAnnouncementModal(id) {
    const a = DB.find('announcements', Number(id));
    if (!a) { App.navigate('events'); return; }
    Modal.show({
      title: `<i class="fa fa-bullhorn" style="color:var(--accent);margin-right:8px"></i>Announcement`,
      body: `
        <div style="padding:4px 0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span class="badge badge-${a.priority === 'high' ? 'danger' : 'primary'}">${(a.priority || 'general').toUpperCase()} PRIORITY</span>
            <span style="font-size:12px;color:var(--text-3)"><i class="fa fa-calendar" style="margin-right:4px"></i>${Utils.formatDate(a.date)}</span>
          </div>
          <h3 style="font-size:17px;font-weight:700;margin-bottom:12px;color:var(--text)">${a.title}</h3>
          <div style="font-size:13px;color:var(--text-2);line-height:1.7;background:var(--surface);padding:14px;border-radius:8px;border:1px solid var(--border)">
            ${a.body}
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Close</button>
        <button class="btn btn-primary btn-sm" onclick="Modal.close();App.navigate('events')"><i class="fa fa-arrow-right"></i> View All Announcements</button>
      `
    });
  },

  showAllHeadlinesModal() {
    const today = Utils.today();
    const todayMMDD = today.slice(5);
    const emps = DB.get('employees');
    const todayBdays = emps.filter(e => e.dob?.slice(5) === todayMMDD && e.status === 'active');
    const upcomingBdays = emps.filter(e => {
      if (!e.dob || e.status !== 'active') return false;
      const bYear = new Date().getFullYear();
      let bd = new Date(bYear + '-' + e.dob.slice(5));
      const now = new Date();
      let diff = (bd - now) / 86400000;
      if (diff < 0) {
        bd = new Date((bYear + 1) + '-' + e.dob.slice(5));
        diff = (bd - now) / 86400000;
      }
      return diff > 0 && diff <= 30;
    });
    const upcomingHols = DB.get('holidays').filter(h => h.date >= today).sort((a,b) => a.date.localeCompare(b.date));
    const announcements = DB.get('announcements');

    Modal.show({
      title: `<i class="fa fa-bolt" style="color:var(--danger);margin-right:8px"></i>Live Headlines & Happenings`,
      body: `
        <div style="display:flex;flex-direction:column;gap:18px">
          <!-- Birthdays Section -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">
              🎂 Birthdays (${todayBdays.length + upcomingBdays.length})
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${todayBdays.map(e => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:hsla(330,85%,60%,0.12);border:1px solid hsla(330,85%,60%,0.25);border-radius:8px">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                    <div>
                      <div style="font-weight:700;color:#f472b6;font-size:13px">${e.fullName} <span class="badge badge-danger" style="margin-left:6px;font-size:9px">TODAY</span></div>
                      <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(e.designationId)} • ${Utils.getDeptName(e.departmentId)}</div>
                    </div>
                  </div>
                  <button class="btn btn-primary btn-xs" style="background:linear-gradient(135deg, #ec4899, #8b5cf6);border:none" onclick="Modal.close();Dashboard.showBirthdayWishModal(${e.id})">
                    <i class="fa fa-gift"></i> Wish
                  </button>
                </div>
              `).join('')}
              ${upcomingBdays.slice(0, 4).map(e => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                    <div>
                      <div style="font-weight:600;font-size:13px">${e.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${new Date(new Date().getFullYear() + '-' + e.dob.slice(5)).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</div>
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-xs" onclick="Modal.close();Dashboard.showBirthdayWishModal(${e.id})">Wish</button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Holidays Section -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">
              🌴 Upcoming Holidays (${upcomingHols.length})
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${upcomingHols.slice(0, 3).map(h => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
                  <div>
                    <div style="font-weight:600;font-size:13px">${h.name}</div>
                    <div style="font-size:11px;color:var(--text-3)">${Utils.formatDate(h.date)} • ${h.type.toUpperCase()}</div>
                  </div>
                  <span class="badge badge-info">${h.optional ? 'Optional' : 'Public'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Announcements Section -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">
              📢 Active Announcements (${announcements.length})
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${announcements.slice(0, 3).map(a => `
                <div style="padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;cursor:pointer" onclick="Modal.close();Dashboard.showAnnouncementModal(${a.id})">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                    <span style="font-weight:600;font-size:13px;color:var(--text)">${a.title}</span>
                    <span class="badge badge-${a.priority === 'high' ? 'danger' : 'secondary'}">${a.priority.toUpperCase()}</span>
                  </div>
                  <div style="font-size:11.5px;color:var(--text-3)">${a.body.slice(0, 90)}…</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `,
      footer: `<button class="btn btn-secondary btn-sm" onclick="Modal.close()">Close</button>`
    });
  },

  renderEmployeeDashboard(content, headlines, upcomingHols, upcomingBdays, today, todayBdays = []) {
    const myId = Auth.employee?.id;
    const myEmp = Auth.employee || (myId ? DB.find('employees', myId) : null);
    const allAtt = DB.get('attendance') || [];
    const allLeaves = DB.get('leave_requests') || [];
    const allSalary = DB.get('salary') || [];
    const allReviews = DB.get('performance_reviews') || [];
    const tickerItemsHtml = headlines.map(h => {
      const bg = h.type === 'birthday' ? '#ec4899' : h.type === 'holiday' ? '#4f46e5' : h.type === 'announcement' ? '#0284c7' : h.type === 'anniversary' ? '#8b5cf6' : '#ea580c';
      return `
        <span class="ticker-item ${h.type}" onclick="${h.action}" title="Click to view details" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0">
          <span style="background:${bg};color:#ffffff;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:5px;line-height:1.2;white-space:nowrap"><i class="fa ${h.icon}"></i> ${h.tag}</span>
          <span style="font-size:12px;font-weight:600;color:var(--text,#1e293b);white-space:nowrap">${h.text}</span>
        </span>
        <span style="color:#cbd5e1;font-size:11px;flex-shrink:0">•</span>
      `;
    }).join(' ');

    let myTodayAtt = allAtt.find(a => (String(a.employeeId) === String(myId) || String(a.employeeId) === String(myEmp?.empNo)) && a.date === today);
    const allLogs = (typeof DB !== 'undefined' && DB.get ? DB.get('attendance_logs') : []) || [];
    const myTodayLogs = allLogs.filter(l => (String(l.employeeId) === String(myId) || String(l.employeeId) === String(myEmp?.empNo)) && l.date === today);
    if (myTodayLogs.length > 0) {
      const inLog = myTodayLogs.find(l => l.punchType === 'check_in' || l.type === 'check_in');
      const outLog = [...myTodayLogs].reverse().find(l => l.punchType === 'check_out' || l.type === 'check_out');
      if (!myTodayAtt) {
        myTodayAtt = {
          id: 'live_log_' + (inLog?.id || Date.now()),
          employeeId: myId,
          date: today,
          timeIn: inLog?.time || '',
          checkIn: inLog?.time || '',
          timeOut: outLog?.time || '',
          checkOut: outLog?.time || '',
          status: 'present',
          device: inLog?.device || 'ZKTeco Hardware Terminal'
        };
      } else {
        if (!myTodayAtt.timeIn && inLog) myTodayAtt.timeIn = inLog.time;
        if (!myTodayAtt.checkIn && inLog) myTodayAtt.checkIn = inLog.time;
        if (!myTodayAtt.timeOut && outLog) myTodayAtt.timeOut = outLog.time;
        if (!myTodayAtt.checkOut && outLog) myTodayAtt.checkOut = outLog.time;
      }
    }

    const thisMonth = today.slice(0, 7);
    const myMonthAtt = allAtt.filter(a => a.employeeId === myId && a.date.startsWith(thisMonth));
    const myPresent = myMonthAtt.filter(a => a.status === 'present').length;
    const myLate = myMonthAtt.filter(a => a.status === 'late').length;
    const myAbsent = myMonthAtt.filter(a => a.status === 'absent').length;
    const myHalfDay = myMonthAtt.filter(a => a.status === 'half_day').length;

    const myLeaves = allLeaves.filter(l => l.employeeId === myId);
    const myPendingLeaves = myLeaves.filter(l => l.status === 'pending' || l.status === 'manager_approved').length;

    const mySalaryList = allSalary.filter(s => s.employeeId === myId);
    const myLatestSalary = mySalaryList[mySalaryList.length - 1] || null;

    let workingHoursToday = '0 hrs';
    if (myTodayAtt?.timeIn && myTodayAtt?.timeOut) {
      workingHoursToday = (typeof Attendance !== 'undefined' && Attendance.calcHours) 
        ? Attendance.calcHours(myTodayAtt.timeIn, myTodayAtt.timeOut, myTodayAtt.breakOut, myTodayAtt.breakIn) 
        : '8 hrs';
    } else if (myTodayAtt?.timeIn) {
      workingHoursToday = 'In Progress';
    }

    content.setAttribute('data-theme', 'light');
    content.innerHTML = `
      <div class="animate-fade-in dashboard-reference-layout" data-theme="light">
        <!-- Top Bar: Employee Greeting & Hero Office Time Punch Clock Widget -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <h2 style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-0.5px">Employee Self-Service Portal</h2>
              <span class="badge badge-success" style="font-size:11px;padding:3px 9px"><i class="fa fa-circle" style="font-size:7px;margin-right:4px"></i>Active Session</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              ${new Date().toLocaleDateString('en-PK', { weekday:'long', month:'long', day:'numeric', year:'numeric' })} • Welcome back, ${Auth.employee.fullName}!
            </div>
          </div>
          <div style="flex:1;min-width:320px;max-width:880px">
            ${this.renderHeroPunchClockWidget(myTodayAtt)}
          </div>
        </div>

        <!-- MOVING HEADLINES TICKER (0.5x / 1x Speed) -->
        ${this.renderHeadlinesTicker(tickerItemsHtml)}

        ${Auth.role === 'onboarding' ? `
          <!-- New Joiner Induction Banner -->
          <div class="card" style="background:linear-gradient(135deg, rgba(245,158,11,0.14), rgba(79,128,247,0.1));border:1.5px solid rgba(245,158,11,0.4);border-radius:14px;padding:22px;margin-bottom:24px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
              <div style="display:flex;align-items:center;gap:14px">
                <div style="width:50px;height:50px;border-radius:14px;background:rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:24px">
                  <i class="fa fa-clipboard-check"></i>
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="badge badge-warning" style="font-size:11px"><i class="fa fa-sparkles"></i> Welcome to the Team</span>
                    <span class="badge badge-info" style="font-size:11px"><i class="fa fa-user-clock"></i> Induction Stage</span>
                  </div>
                  <h2 style="font-size:18px;font-weight:800;color:var(--text);margin-top:4px">Complete Your Joining Onboarding & Document Upload</h2>
                  <p style="font-size:12px;color:var(--text-2);margin-top:2px">
                    Please review your personal profile info and upload required CNIC/degree documents.
                  </p>
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-primary" onclick="App.navigate('profile')"><i class="fa fa-id-card-clip"></i> Open Profile</button>
                <button class="btn btn-secondary" onclick="Employees.showUploadDocumentModal(${Auth.employee.id})"><i class="fa fa-upload"></i> Upload Documents</button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Employee Identity & Today's Attendance Hero Widget -->
        <div class="card" style="margin-bottom:20px;padding:20px;border:1.5px solid var(--border);border-radius:14px;background:linear-gradient(135deg, var(--card) 0%, rgba(99,102,241,0.04) 100%)">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px">
            <!-- Left: Profile Summary (Click to view Profile) -->
            <div style="display:flex;align-items:center;gap:16px;min-width:260px;cursor:pointer" onclick="App.navigate('profile')" title="Click to view My Profile">
              <div style="position:relative">
                <div style="width:68px;height:68px;border-radius:50%;background:${Utils.avatarColor(Auth.employee.id)};color:#fff;font-size:24px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.25);border:3px solid var(--primary)">
                  ${Utils.avatarInitials(Auth.employee.fullName)}
                </div>
                <span class="badge badge-success" style="position:absolute;bottom:-4px;right:-4px;font-size:9px;padding:2px 6px;border-radius:8px">Active</span>
              </div>
              <div>
                <h3 style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:2px">${Auth.employee.fullName}</h3>
                <div style="font-size:12.5px;color:var(--primary);font-weight:600;margin-bottom:4px">
                  ${Utils.getDesigName(Auth.employee.designationId)} • ${Utils.getDeptName(Auth.employee.departmentId)}
                </div>
                <div style="display:flex;gap:12px;font-size:11.5px;color:var(--text-3);flex-wrap:wrap">
                  <span><i class="fa fa-id-badge" style="margin-right:4px"></i>${Auth.employee.empNo}</span>
                  <span><i class="fa fa-envelope" style="margin-right:4px"></i>${Auth.employee.email}</span>
                  <span><i class="fa fa-calendar-check" style="margin-right:4px"></i>Joined ${Utils.formatDate(Auth.employee.joiningDate)}</span>
                </div>
              </div>
            </div>

            <!-- Right: Today's Attendance Punch Box -->
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:20px;flex-wrap:wrap">
              <div style="display:flex;flex-direction:column;gap:4px">
                <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Today's Attendance</div>
                <div style="display:flex;align-items:center;gap:10px">
                  ${myTodayAtt ? Utils.statusBadge(myTodayAtt.status) : '<span class="badge badge-secondary">Not Checked In</span>'}
                  <span style="font-size:12px;color:var(--text-2);font-weight:600">${Utils.formatDate(today)}</span>
                </div>
                <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">
                  In: <strong style="color:var(--success)">${myTodayAtt?.timeIn || '—'}</strong> | 
                  OT-Out: <strong style="color:#d97706">${myTodayAtt?.breakOut || '—'}</strong> | 
                  OT-In: <strong style="color:#0284c7">${myTodayAtt?.breakIn || '—'}</strong> | 
                  Out: <strong style="color:var(--danger)">${myTodayAtt?.timeOut || '—'}</strong> | 
                  Net: <strong style="color:var(--primary)">${workingHoursToday}</strong>
                  ${(myTodayAtt?.overtime || 0) > 0 ? ` | OT: <strong style="color:#8b5cf6">${myTodayAtt.overtime}h</strong>` : ''}
                </div>
              </div>

              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                ${!myTodayAtt || !myTodayAtt.timeIn ? `
                  <button class="btn btn-success btn-sm" onclick="Dashboard.quickSelfPunch('in')">
                    <i class="fa fa-fingerprint"></i> Check In
                  </button>
                ` : !myTodayAtt.breakOut ? `
                  <button class="btn btn-warning btn-sm" style="color:white" onclick="Dashboard.quickSelfPunch('ot_out')">
                    <i class="fa fa-arrow-right-from-bracket"></i> OT-Out
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="Dashboard.quickSelfPunch('out')">
                    <i class="fa fa-arrow-right-to-bracket"></i> Check Out
                  </button>
                ` : !myTodayAtt.breakIn ? `
                  <button class="btn btn-info btn-sm" style="color:white" onclick="Dashboard.quickSelfPunch('ot_in')">
                    <i class="fa fa-arrow-right-to-bracket"></i> OT-In
                  </button>
                ` : !myTodayAtt.timeOut ? `
                  <button class="btn btn-danger btn-sm" onclick="Dashboard.quickSelfPunch('out')">
                    <i class="fa fa-arrow-right-to-bracket"></i> Check Out
                  </button>
                ` : `
                  <span class="badge badge-success" style="padding:6px 10px;font-size:11px">
                    <i class="fa fa-check-circle"></i> Shift Done
                  </span>
                `}
                <button class="btn btn-ghost btn-sm" onclick="Attendance.showMachinePunchDetail(${myEmp?.id || myId || 4}, '${today}')" title="View Biometric Machine Swipes">
                  <i class="fa fa-fingerprint"></i> Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Quick Actions -->
        <div style="margin-bottom:20px">
          <h3 style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">My Quick Actions</h3>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">
            <button class="quick-action-btn" onclick="App.navigate('leaves');setTimeout(()=>Leaves.showApplyForm(),100)">
              <div class="qa-icon" style="background:#14b8a622;color:#14b8a6"><i class="fa fa-calendar-plus"></i></div>
              Apply Leave
            </button>
            <button class="quick-action-btn" onclick="App.navigate('attendance')">
              <div class="qa-icon" style="background:#f59e0b22;color:#f59e0b"><i class="fa fa-fingerprint"></i></div>
              Mark Attendance
            </button>
            <button class="quick-action-btn" onclick="App.navigate('performance')">
              <div class="qa-icon" style="background:#8b5cf622;color:#8b5cf6"><i class="fa fa-chart-line"></i></div>
              My Performance
            </button>
            <button class="quick-action-btn" onclick="App.navigate('payroll')">
              <div class="qa-icon" style="background:#10b98122;color:#10b981"><i class="fa fa-receipt"></i></div>
              My Payslips
            </button>
            <button class="quick-action-btn" onclick="App.navigate('reports')">
              <div class="qa-icon" style="background:#ec489922;color:#ec4899"><i class="fa fa-file-invoice"></i></div>
              Personal Reports
            </button>
          </div>
        </div>

        <!-- 4 Self-Service Cards Grid -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px">
          <!-- 1. My Attendance Card -->
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="margin-bottom:12px">
                <div class="card-title" style="font-size:14px">
                  <i class="fa fa-clock" style="color:#10b981;margin-right:8px"></i>My Attendance
                </div>
                <span class="badge badge-primary" style="font-size:10px">This Month</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
                <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
                  <div style="font-size:20px;font-weight:800;color:var(--success)">${myPresent}</div>
                  <div style="font-size:10px;color:var(--text-3);font-weight:600">Present Days</div>
                </div>
                <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
                  <div style="font-size:20px;font-weight:800;color:var(--warning)">${myLate}</div>
                  <div style="font-size:10px;color:var(--text-3);font-weight:600">Late Days</div>
                </div>
              </div>
              <div style="font-size:11.5px;color:var(--text-3);line-height:1.5">
                Absent: <strong>${myAbsent}</strong> • Half Days: <strong>${myHalfDay}</strong>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm w-full" style="margin-top:14px" onclick="App.navigate('attendance')">
              <i class="fa fa-arrow-right"></i> View Full Timesheet
            </button>
          </div>

          <!-- 2. My Leave Balances Card -->
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="margin-bottom:12px">
                <div class="card-title" style="font-size:14px">
                  <i class="fa fa-calendar-check" style="color:var(--warning);margin-right:8px"></i>My Leave
                </div>
                <span class="badge badge-warning" style="font-size:10px">${myPendingLeaves} Pending</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--surface);border-radius:6px;font-size:12px">
                  <span style="color:var(--text-2)">Annual Leaves</span>
                  <strong style="color:var(--success)">14 Days Remaining</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--surface);border-radius:6px;font-size:12px">
                  <span style="color:var(--text-2)">Casual Leaves</span>
                  <strong style="color:var(--primary)">8 Days Remaining</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--surface);border-radius:6px;font-size:12px">
                  <span style="color:var(--text-2)">Sick Leaves</span>
                  <strong style="color:var(--warning)">7 Days Remaining</strong>
                </div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm w-full" onclick="App.navigate('leaves');setTimeout(()=>Leaves.showApplyForm(),100)">
              <i class="fa fa-plus"></i> Apply Leave
            </button>
          </div>

          <!-- 3. My Payroll Card -->
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="margin-bottom:12px">
                <div class="card-title" style="font-size:14px">
                  <i class="fa fa-money-bill-wave" style="color:var(--success);margin-right:8px"></i>My Payroll
                </div>
                <span class="badge badge-success" style="font-size:10px">Aug 2026</span>
              </div>
              <div style="background:var(--surface);padding:12px;border-radius:8px;margin-bottom:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-3);font-weight:600">Net Take-Home Salary</div>
                <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:2px">
                  ${myLatestSalary ? Utils.formatCurrency(myLatestSalary.netSalary) : '₨ 82,250'}
                </div>
                <div style="font-size:10.5px;color:var(--text-3);margin-top:4px">
                  Status: <span class="badge badge-success" style="font-size:9.5px">${myLatestSalary?.status === 'processed' ? 'Processed' : 'Disbursed'}</span>
                </div>
              </div>
              <div style="font-size:11.5px;color:var(--text-3);display:flex;justify-content:space-between">
                <span>Basic: <strong>${myLatestSalary ? Utils.formatCurrency(myLatestSalary.basic) : '₨ 85,000'}</strong></span>
                <span>Tax & Ded: <strong>${myLatestSalary ? Utils.formatCurrency(myLatestSalary.deductions + (myLatestSalary.tax || 0)) : '₨ 22,750'}</strong></span>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm w-full" style="margin-top:14px" onclick="Payroll.viewSlip(${Auth.employee.id}, '2026-08')">
              <i class="fa fa-eye"></i> View Payslip
            </button>
          </div>

          <!-- 4. My Performance Card -->
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="margin-bottom:12px">
                <div class="card-title" style="font-size:14px">
                  <i class="fa fa-chart-line" style="color:var(--accent);margin-right:8px"></i>My Performance
                </div>
                <span class="badge badge-info" style="font-size:10px">Q3 2026</span>
              </div>
              <div style="background:var(--surface);padding:12px;border-radius:8px;margin-bottom:12px;text-align:center">
                <div style="font-size:11px;color:var(--text-3);font-weight:600">Latest Appraisal Rating</div>
                <div style="font-size:22px;font-weight:800;color:var(--accent);margin-top:2px">
                  ★ 4.2 <span style="font-size:12px;color:var(--text-3)">/ 5.0</span>
                </div>
                <div style="font-size:10.5px;color:var(--text-2);margin-top:4px">
                  Rating: <strong>Exceeds Expectations</strong>
                </div>
              </div>
              <div style="font-size:11.5px;color:var(--text-3)">
                Active OKRs & Goals: <strong>4 Assigned</strong> (75% on track)
              </div>
            </div>
            <button class="btn btn-ghost btn-sm w-full" style="margin-top:14px" onclick="App.navigate('performance')">
              <i class="fa fa-bullseye"></i> View Goals & Reviews
            </button>
          </div>
        </div>

        <!-- Bottom Grid: Celebrations & Holidays -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <!-- Upcoming & Today's Colleague Birthdays -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-birthday-cake" style="color:#ec4899;margin-right:8px"></i>Colleague Birthdays</div>
            </div>
            ${todayBdays.length ? `
              <div class="mb-12" style="padding:12px;background:var(--danger-light);border-radius:var(--r-sm);border:1px solid hsla(340,84%,62%,.2);margin-bottom:12px">
                <div style="font-size:var(--font-xs);font-weight:700;color:var(--danger);margin-bottom:8px">🎂 Today's Birthdays</div>
                ${todayBdays.map(e => `
                  <div style="display:flex;align-items:center;gap:10px;padding:6px 0;${todayBdays.length > 1 ? 'border-bottom:1px dashed hsla(340,84%,62%,.2);' : ''}">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                    <div style="flex:1">
                      <div style="font-size:var(--font-sm);font-weight:700;color:var(--text)">${e.fullName} ${e.id === myId ? '<span class="badge badge-success" style="font-size:var(--font-xs);padding:1px 5px">You</span>' : ''}</div>
                      <div style="font-size:var(--font-xs);color:var(--text-3)">${Utils.getDesigName(e.designationId)} • ${Utils.getDeptName(e.departmentId)}</div>
                    </div>
                    ${e.id !== myId ? `
                      <button class="btn btn-secondary btn-xs" onclick="Dashboard.showBirthdayWishModal(${e.id})" title="Send Birthday Wish Today">
                        <i class="fa fa-gift"></i> Wish Now
                      </button>
                    ` : `
                      <span class="badge badge-warning" style="font-size:var(--font-xs)">🎉 Happy Birthday!</span>
                    `}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div style="font-size:var(--font-xs);font-weight:700;color:var(--text-muted);margin-bottom:10px">
              Upcoming (30 days)
            </div>
            ${upcomingBdays.length === 0 ? '<div class="text-muted text-sm" style="padding:10px 0">No upcoming birthdays in next 30 days</div>' : upcomingBdays.slice(0, 5).map(e => {
              const bYear = new Date().getFullYear();
              let bDate = new Date(bYear + '-' + e.dob.slice(5));
              if ((bDate - new Date()) < 0) bDate = new Date((bYear + 1) + '-' + e.dob.slice(5));
              const dateStr = bDate.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
              return `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
                  <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                  <div style="flex:1">
                    <div style="font-size:var(--font-sm);font-weight:600;color:var(--text)">${e.fullName} ${e.id === myId ? '<span class="badge badge-primary" style="font-size:var(--font-xs);padding:1px 5px">You</span>' : ''}</div>
                    <div style="font-size:var(--font-xs);color:var(--text-3)">${Utils.getDesigName(e.designationId)} • ${Utils.getDeptName(e.departmentId)}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:var(--font-xs);color:var(--primary);font-weight:700">${dateStr}</span>
                    ${e.id !== myId ? `
                      <button class="btn btn-ghost btn-xs" onclick="Dashboard.showBirthdayWishModal(${e.id})" title="Send Early Birthday Wish">
                        <i class="fa fa-gift"></i> Wish
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Upcoming Holidays -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-calendar-days" style="color:var(--info);margin-right:8px"></i>Upcoming Holidays</div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('events')">View All</button>
            </div>
            ${upcomingHols.slice(0,3).map(h => `
              <div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border)">
                <div style="width:40px;height:40px;background:var(--info-light);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center">
                  <div style="font-size:15px;font-weight:800;color:var(--info);line-height:1">${new Date(h.date).getDate()}</div>
                  <div style="font-size:8.5px;color:var(--info);font-weight:700">${new Date(h.date).toLocaleString('en',{month:'short'}).toUpperCase()}</div>
                </div>
                <div>
                  <div style="font-size:13px;font-weight:600">${h.name}</div>
                  <div style="font-size:11px;color:var(--text-3)">${h.type.charAt(0).toUpperCase()+h.type.slice(1)} • ${Utils.formatDate(h.date)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
      this.startPunchClockTimer();
      this.startAutoSync();
    }, 100);
  }
};

if (typeof window !== 'undefined') {
  window.Dashboard = Dashboard;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
}
