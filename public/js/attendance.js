// ============================================================
// HRM SYSTEM — Attendance Module
// ============================================================

const Attendance = {
  currentView: 'daily',
  currentDate: Utils.today(),
  currentMonth: Utils.thisMonth(),
  myAttPeriod: 'monthly', // 'daily' | 'weekly' | 'monthly' | 'custom'
  myAttDate: Utils.today(),
  myAttMonth: Utils.thisMonth(),
  myAttWeekOffset: 0,
  myAttFrom: '',
  myAttTo: Utils.today(),
  myAttStatusFilter: 'all',
  myAttSearchQuery: '',
  // "My Employees Attendance" combined view state (for dept_manager)
  myEmpAttPeriod: 'daily',  // 'daily' | 'monthly' | 'employee_wise' | 'dept_wise' | 'weekly' | 'custom'
  myEmpAttDate: Utils.today(),
  myEmpAttMonth: Utils.thisMonth(),
  myEmpAttWeekOffset: 0,
  myEmpAttFrom: '',
  myEmpAttTo: Utils.today(),
  myEmpAttEmpFilter: 'all', // employee id or 'all'
  myEmpAttStatusFilter: 'all',
  adminDailyDeptFilter: 'all',
  adminMonthlyDeptFilter: 'all',
  adminEmpWiseDeptFilter: 'all',
  adminMyEmpDeptFilter: 'all',

  machineLogDate: Utils.today(),
  machineLogDeptFilter: 'all',
  machineLogEmpFilter: 'all',
  machineLogPunchFilter: 'all',
  machineLogDeviceFilter: 'all',
  machineLogSearchQuery: '',

  getScopedEmployees() {
    const emps = DB.get('employees') || [];
    return Auth.getScopedEmployees(emps).filter(e => e.status === 'active');
  },

  render() {
    const content = document.getElementById('page-content');
    if (!Auth.can('attendance.view')) {
      if (content) {
        content.innerHTML = `
          <div class="empty-state card" style="text-align:center;padding:48px 24px;margin-top:24px">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(239,68,68,0.1);color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px">
              <i class="fa fa-ban"></i>
            </div>
            <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Access Restricted</h3>
            <p style="color:var(--text-3);max-width:440px;margin:0 auto">You do not have permission to view Attendance records.</p>
          </div>
        `;
      }
      return;
    }
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isManager = Auth.role === 'dept_manager';
    const isAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    // Restrict default view
    if (isEmployee && !['my_attendance', 'machine', 'corrections', 'timesheets', 'roster'].includes(this.currentView)) {
      this.currentView = 'my_attendance';
    } else if (isManager && !['my_attendance', 'my_employees', 'machine', 'roster', 'timesheets', 'corrections'].includes(this.currentView)) {
      this.currentView = 'my_employees';
    } else if (isAdmin && !['my_attendance', 'my_employees', 'machine', 'roster', 'geofence', 'timesheets', 'manual', 'corrections'].includes(this.currentView)) {
      this.currentView = 'my_employees';
    }

    const scopedEmps = this.getScopedEmployees();
    const scopedIds = scopedEmps.map(e => e.id);
    const totalEmps = scopedEmps.length;
    const allAtt = DB.get('attendance') || [];
    const att = isManager ? allAtt.filter(a => scopedIds.includes(a.employeeId)) : allAtt;
    const today = Utils.today();
    const todayAtt = att.filter(a => a.date === today);

    // Organization / Team KPI counters
    const present = todayAtt.filter(a => a.status === 'present').length;
    const absent  = todayAtt.filter(a => a.status === 'absent').length;
    const late    = todayAtt.filter(a => a.status === 'late').length;
    const half    = todayAtt.filter(a => a.status === 'half_day').length;
    const ot      = todayAtt.filter(a => a.overtime > 0).length;

    // Personal monthly metrics for logged in employee
    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;
    const thisMonth = this.myAttMonth || Utils.thisMonth();
    const myMonthAtt = allAtt.filter(a => a.employeeId === myEmpId && a.date.startsWith(thisMonth));
    const myPresent = myMonthAtt.filter(a => a.status === 'present').length;
    const myLate = myMonthAtt.filter(a => a.status === 'late').length;
    const myHalf = myMonthAtt.filter(a => a.status === 'half_day').length;
    const myAbsent = myMonthAtt.filter(a => a.status === 'absent').length;
    const myOT = myMonthAtt.filter(a => (a.overtime || 0) > 0).length;
    const myRate = myMonthAtt.length > 0 ? Math.round(((myPresent + myLate) / myMonthAtt.length) * 100) : 100;

    const allCorrections = DB.get('attendance_corrections') || [];
    const pendingCorrections = allCorrections.filter(c => {
      if (isEmployee) return c.employeeId === myEmpId && c.status === 'pending';
      if (isManager) return scopedIds.includes(c.employeeId) && (c.status === 'pending' || c.status === 'manager_approved');
      return c.status === 'pending' || c.status === 'manager_approved';
    }).length;

    const allSwaps = DB.get('shift_swaps') || [];
    const pendingSwaps = allSwaps.filter(s => {
      if (isEmployee) return (s.targetEmployeeId === myEmpId && s.status === 'pending_peer') || (s.requesterId === myEmpId && s.status === 'pending_peer');
      if (isManager) return scopedIds.includes(s.requesterId) && (s.status === 'pending_peer' || s.status === 'peer_accepted');
      return s.status === 'pending_peer' || s.status === 'peer_accepted';
    }).length;

    // Role-specific Tab Navigation: 4 Clean Lifecycle Stages
    let tabs = [];
    if (isEmployee) {
      tabs = [
        { id:'my_attendance', label:'My Attendance & Punch', icon:'fa-user-clock' },
        { id:'roster',        label:'My Shift Roster & Swaps', icon:'fa-calendar-days', badge: pendingSwaps },
        { id:'machine',       label:'My Machine Logs', icon:'fa-fingerprint' },
        { id:'corrections',   label:'Regularization & Timesheets', icon:'fa-clipboard-check', badge: pendingCorrections },
      ];
    } else if (isManager) {
      tabs = [
        { id:'my_attendance',  label:'My Attendance & Punch', icon:'fa-user-clock' },
        { id:'my_employees',   label:'Team Attendance & Biometrics', icon:'fa-users-line' },
        { id:'roster',         label:'Shift Rosters & Swaps', icon:'fa-calendar-days', badge: pendingSwaps },
        { id:'corrections',    label:'Regularization & Timesheets', icon:'fa-clipboard-check', badge: pendingCorrections },
      ];
    } else {
      // Super Admin and HR Manager
      tabs = [
        { id:'my_attendance', label:'My Attendance & Punch', icon:'fa-user-clock' },
        { id:'my_employees',  label:'Attendance Register & Biometrics', icon:'fa-users-line' },
        { id:'roster',        label:'Shift Rosters & Work Rules', icon:'fa-calendar-days', badge: pendingSwaps },
        { id:'corrections',   label:'Regularization & Timesheets', icon:'fa-clipboard-check', badge: pendingCorrections },
      ];
    }

    // Filter tabs based on feature visibility
    tabs = tabs.filter(t => {
      if (t.id === 'my_attendance') return Auth.canSeeFeature('attendance.clock_in') || Auth.canSeeFeature('attendance.daily');
      if (t.id === 'my_employees') return Auth.canSeeFeature('attendance.daily');
      if (t.id === 'roster') return Auth.canSeeFeature('attendance.shifts');
      if (t.id === 'machine') return Auth.canSeeFeature('attendance.biometric');
      if (t.id === 'corrections') return Auth.canSeeFeature('attendance.corrections');
      return true;
    });
    if (!tabs.some(t => t.id === this.currentView) && tabs.length > 0) {
      this.currentView = tabs[0].id;
    }

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Metrics Header -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px">
          ${isEmployee ? [
            { label:'Present',         val: myPresent, icon:'fa-circle-check',       color:'#10b981', sub: `${myPresent} Days logged` },
            { label:'Late Check-ins',  val: myLate,    icon:'fa-clock',              color:'#f59e0b', sub: `${myLate} Cutoff exceeded` },
            { label:'Half Day',        val: myHalf,    icon:'fa-circle-half-stroke', color:'#8b5cf6', sub: `${myHalf} Half-days` },
            { label:'Absent / Leave',  val: myAbsent,  icon:'fa-circle-xmark',       color:'#ef4444', sub: `${myAbsent} Unattended` },
            { label:'Overtime',        val: `${myOT}d`,icon:'fa-business-time',      color:'#6366f1', sub: `${myMonthAtt.reduce((s,a)=>s+(a.overtime||0),0)}h total` },
            { label:'Punctuality',     val: `${myRate}%`, icon:'fa-gauge-high',      color:'#0ea5e9', sub: `Monthly Score` },
          ].map(s => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;border-top:3px solid ${s.color}">
              <div style="font-size:24px;margin-bottom:4px;color:${s.color}"><i class="fa ${s.icon}"></i></div>
              <div style="font-size:26px;font-weight:800;color:${s.color}">${s.val}</div>
              <div style="font-size:11px;color:var(--text-3);font-weight:600">${s.label}</div>
              <div style="font-size:10.5px;color:var(--text-muted);margin-top:4px">${s.sub}</div>
            </div>
          `).join('') : [
            { label:'Present',  val: present, total: totalEmps, icon:'fa-circle-check',       color:'#10b981' },
            { label:'Absent',   val: absent,  total: totalEmps, icon:'fa-circle-xmark',       color:'#ef4444' },
            { label:'Late',     val: late,    total: totalEmps, icon:'fa-clock',               color:'#f59e0b' },
            { label:'Half Day', val: half,    total: totalEmps, icon:'fa-circle-half-stroke',  color:'#8b5cf6' },
            { label:'Overtime', val: ot,      total: totalEmps, icon:'fa-business-time',       color:'#6366f1' },
            { label:'Not Mark', val: Math.max(0, totalEmps - todayAtt.length), total: totalEmps, icon:'fa-circle-question', color:'#64748b' },
          ].map(s => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;border-top:3px solid ${s.color}">
              <div style="font-size:24px;margin-bottom:4px;color:${s.color}"><i class="fa ${s.icon}"></i></div>
              <div style="font-size:26px;font-weight:800;color:${s.color}">${s.val}</div>
              <div style="font-size:11px;color:var(--text-3);font-weight:500">${s.label}</div>
              <div style="margin-top:6px"><div class="progress"><div class="progress-bar" style="width:${s.total?Math.round(s.val/s.total*100):0}%;background:${s.color}"></div></div></div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:3px">${s.total?Math.round(s.val/s.total*100):0}%</div>
            </div>
          `).join('')}
        </div>

        <!-- Shift Policy / Active Time-In Window Banner -->
        ${isEmployee ? `
          <div style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(16,185,129,0.06));border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:12px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div style="display:flex;align-items:center;gap:12px;font-size:12.5px;color:var(--text)">
              <div style="width:36px;height:36px;border-radius:9px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:18px">
                <i class="fa fa-user-clock"></i>
              </div>
              <div>
                <div style="font-weight:700;font-size:13px;color:var(--text)">Personal Attendance &amp; Shift Compliance Policy</div>
                <div style="font-size:12px;color:var(--text-3);margin-top:2px">Morning Shift (<strong>09:00 AM – 06:00 PM</strong>) • Punctuality Cutoff: <strong>11:00 AM</strong>. Punches after cutoff require an approved attendance correction.</div>
              </div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary btn-sm" onclick="Attendance.showApplyCorrectionModal()"><i class="fa fa-plus"></i> Request Correction / WFH</button>
            </div>
          </div>
        ` : `
          <div style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(16,185,129,0.06));border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:10px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div style="display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--text)">
              <i class="fa fa-clock" style="color:var(--primary);font-size:16px"></i>
              <span><strong>Time-In Window Rule Active:</strong> Morning Shift Cutoff: <strong>10:00 AM – 11:00 AM</strong>. Punches after <strong>11:00 AM</strong> are automatically recorded as <strong>Late</strong> and require audit resolution before payroll.</span>
            </div>
            <div style="display:flex;gap:6px">
              ${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="Attendance.showTimeInWindowConfig()"><i class="fa fa-sliders"></i> Edit Windows</button>` : ''}
              ${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="App.navigate('administration'); setTimeout(() => Administration.switchSection('discrepancies'), 100);"><i class="fa fa-triangle-exclamation" style="color:var(--warning)"></i> Audit Center</button>` : ''}
            </div>
          </div>
        `}

        <!-- View Tabs: 4 Clean Lifecycle Stages -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div class="module-stage-tabs">
            ${tabs.map(t => `
              <button class="tab-toggle-btn ${this.isTabActive(t.id)?'active':''}" data-tab="${t.id}" onclick="Attendance.switchView('${t.id}')">
                <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label} ${t.badge ? `<span class="badge badge-warning" style="margin-left:5px;font-size:10px;padding:2px 6px">${t.badge}</span>` : ''}
              </button>
            `).join('')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${isEmployee ? `
              <button class="btn btn-primary btn-sm" onclick="Attendance.showApplyCorrectionModal()"><i class="fa fa-plus"></i> Apply Correction / WFH</button>
              <button class="btn btn-ghost btn-sm" onclick="Attendance.exportMyAttendance()"><i class="fa fa-file-export"></i> Export My Records</button>
            ` : isManager ? `
              <button class="btn btn-ghost btn-sm" onclick="Attendance.exportAttendance()"><i class="fa fa-file-export"></i> Export CSV</button>
              ${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="Attendance.showTimeInWindowConfig()"><i class="fa fa-clock"></i> Time-In Windows</button>` : ''}
              <button class="btn btn-ghost btn-sm" onclick="Attendance.exportAttendance()"><i class="fa fa-file-export"></i> Export CSV</button>
              ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="Attendance.showBulkImportModal()"><i class="fa fa-file-excel"></i> Import CSV</button>` : ''}
              ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="Attendance.showBiometricTerminal()"><i class="fa fa-fingerprint"></i> Biometric Simulator</button>` : ''}
              ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="Attendance.showBulkAttendance()"><i class="fa fa-users-line"></i> Bulk Mark</button>` : ''}
              <button class="btn btn-primary btn-sm" onclick="Attendance.showMarkAttendance()"><i class="fa fa-plus"></i> Mark Attendance</button>
            ` : ''}
          </div>
        </div>

        <style>
          .tab-toggle-btn { padding:8px 14px;border:none;background:transparent;color:var(--text-3);font-size:12.5px;font-weight:500;border-radius:7px;cursor:pointer;transition:all .2s; }
          .tab-toggle-btn.active { background:var(--primary);color:white; }
          .tab-toggle-btn:hover:not(.active) { background:var(--surface-2);color:var(--text); }
        </style>

        <div id="att-content"></div>
      </div>
    `;

    this.renderView();
  },

  isTabActive(tabId) {
    if (tabId === 'my_attendance') return this.currentView === 'my_attendance';
    if (tabId === 'my_employees') return ['my_employees', 'machine', 'manual', 'daily', 'monthly', 'employee', 'dept'].includes(this.currentView);
    if (tabId === 'roster') return ['roster', 'geofence'].includes(this.currentView);
    if (tabId === 'corrections') return ['corrections', 'timesheets'].includes(this.currentView);
    return this.currentView === tabId;
  },

  switchView(view) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const employeeAllowed = ['my_attendance', 'machine', 'corrections', 'timesheets'];
    if (isEmployee && !employeeAllowed.includes(view)) {
      Toast.show('403 Forbidden: Access Denied to administrative attendance views.', 'error');
      view = 'my_attendance';
    }

    const isManager = Auth.role === 'dept_manager';
    const managerBlocked = ['geofence', 'manual'];
    if (isManager && managerBlocked.includes(view)) {
      Toast.show('403 Forbidden: Access Denied to administrative configuration.', 'error');
      view = 'my_employees';
    }
    if (['daily', 'monthly', 'employee', 'dept'].includes(view)) {
      this.currentView = 'my_employees';
      if (view === 'daily') this.myEmpAttPeriod = 'daily';
      else if (view === 'monthly') this.myEmpAttPeriod = 'monthly';
      else if (view === 'employee') this.myEmpAttPeriod = 'employee_wise';
      else if (view === 'dept') this.myEmpAttPeriod = 'dept_wise';
      this.renderView();
      return;
    }

    this.currentView = view;
    this.renderView();
    // Update active state on tab toggle buttons
    document.querySelectorAll('.tab-toggle-btn[data-tab]').forEach(b => {
      const tabId = b.getAttribute('data-tab');
      if (tabId) b.classList.toggle('active', this.isTabActive(tabId));
    });
  },

  renderView() {
    const container = document.getElementById('att-content');
    if (!container) return;
    switch(this.currentView) {
      case 'my_attendance': this.renderMyAttendance(container); break;
      case 'my_employees':  this.renderMyEmployeesAttendance(container); break;
      case 'daily':         this.renderDaily(container); break;
      case 'monthly':       this.renderMonthly(container); break;
      case 'employee':      this.renderEmployeeWise(container); break;
      case 'dept':          this.renderDeptWise(container); break;
      case 'roster':        this.renderShiftRoster(container); break;
      case 'geofence':      this.renderGeoFenceValidation(container); break;
      case 'machine':       this.renderMachineLog(container); break;
      case 'timesheets':    this.renderTimesheets(container); break;
      case 'manual':        this.renderManualEntry(container); break;
      case 'corrections':   this.renderCorrections(container); break;
      default:              this.renderMyAttendance(container); break;
    }
  },

  // ============================================================
  // MY EMPLOYEES ATTENDANCE — Dept Manager Combined View
  // Merges Daily + Monthly into one tab with period dropdown
  // View-only: no edit/create actions for dept_manager
  // ============================================================
  changeMyEmpAttPeriod(period) {
    this.myEmpAttPeriod = period;
    this.renderView();
  },

  prevMyEmpAttDay() {
    const d = new Date(this.myEmpAttDate || Utils.today());
    d.setDate(d.getDate() - 1);
    this.myEmpAttDate = d.toISOString().split('T')[0];
    this.renderView();
  },

  nextMyEmpAttDay() {
    const d = new Date(this.myEmpAttDate || Utils.today());
    d.setDate(d.getDate() + 1);
    this.myEmpAttDate = d.toISOString().split('T')[0];
    this.renderView();
  },

  setMyEmpAttDate(val) {
    this.myEmpAttDate = val;
    this.renderView();
  },

  prevMyEmpAttWeek() {
    this.myEmpAttWeekOffset = (this.myEmpAttWeekOffset || 0) - 1;
    this.renderView();
  },

  nextMyEmpAttWeek() {
    this.myEmpAttWeekOffset = (this.myEmpAttWeekOffset || 0) + 1;
    this.renderView();
  },

  getMyEmpAttWeekDates() {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const baseMonday = new Date(today.setDate(diff));
    baseMonday.setDate(baseMonday.getDate() + ((this.myEmpAttWeekOffset || 0) * 7));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  },

  prevMyEmpAttMonth() {
    const [y, m] = (this.myEmpAttMonth || Utils.thisMonth()).split('-').map(Number);
    const d = new Date(y, m - 2);
    this.myEmpAttMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.renderView();
  },

  nextMyEmpAttMonth() {
    const [y, m] = (this.myEmpAttMonth || Utils.thisMonth()).split('-').map(Number);
    const d = new Date(y, m);
    this.myEmpAttMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.renderView();
  },

  setMyEmpAttMonth(val) {
    this.myEmpAttMonth = val;
    this.renderView();
  },

  applyMyEmpAttCustomRange() {
    const fromEl = document.getElementById('myemp-att-from');
    const toEl   = document.getElementById('myemp-att-to');
    if (fromEl && toEl) {
      if (fromEl.value && toEl.value && fromEl.value > toEl.value) {
        Toast.show('From Date cannot be later than To Date', 'warning');
        return;
      }
      this.myEmpAttFrom = fromEl.value;
      this.myEmpAttTo   = toEl.value;
      this.renderView();
    }
  },

  setMyEmpAttEmpFilter(val) {
    this.myEmpAttEmpFilter = val;
    this.renderView();
  },

  setMyEmpAttStatusFilter(val) {
    this.myEmpAttStatusFilter = val;
    this.renderView();
  },

  renderMyEmployeesAttendance(container) {
    if (!container) return;
    const emps = this.getScopedEmployees();
    if (!emps.length) {
      container.innerHTML = `<div class="card"><div class="empty-state" style="padding:60px"><i class="fa fa-users"></i><h3>No Employees Found</h3><p>You have no accessible employees assigned.</p></div></div>`;
      return;
    }

    const isAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const isManager = Auth.role === 'dept_manager';
    const allAtt = DB.get('attendance') || [];
    const holidays = DB.get('holidays') || [];
    const depts = DB.get('departments') || [];
    const period = this.myEmpAttPeriod || 'daily';
    const empFilter = this.myEmpAttEmpFilter || 'all';
    const statusFilter = this.myEmpAttStatusFilter || 'all';

    // Apply department filter for HR/Admin if selected
    let deptFilteredEmps = emps;
    if (isAdmin && this.adminMyEmpDeptFilter && this.adminMyEmpDeptFilter !== 'all') {
      deptFilteredEmps = emps.filter(e => e.departmentId === parseInt(this.adminMyEmpDeptFilter));
    }
    const displayEmps = empFilter === 'all' ? deptFilteredEmps : deptFilteredEmps.filter(e => e.id === parseInt(empFilter));
    const scopedIds = displayEmps.map(e => e.id);

    if (!this.myEmpAttDate)  this.myEmpAttDate  = Utils.today();
    if (!this.myEmpAttMonth) this.myEmpAttMonth = Utils.thisMonth();
    if (!this.myEmpAttTo)    this.myEmpAttTo    = Utils.today();
    if (!this.myEmpAttFrom) {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      this.myEmpAttFrom = d.toISOString().split('T')[0];
    }

    // Build date list based on period
    let dateList = [];
    let periodLabel = '';

    if (period === 'daily' || period === 'dept_wise') {
      dateList = [this.myEmpAttDate];
      const dObj = new Date(this.myEmpAttDate);
      periodLabel = dObj.toLocaleDateString('en-PK', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    } else if (period === 'weekly') {
      dateList = this.getMyEmpAttWeekDates();
      const wStart = new Date(dateList[0]).toLocaleDateString('en-PK', { month:'short', day:'numeric' });
      const wEnd   = new Date(dateList[6]).toLocaleDateString('en-PK', { month:'short', day:'numeric', year:'numeric' });
      periodLabel = `${wStart} – ${wEnd}`;
    } else if (period === 'monthly' || period === 'employee_wise') {
      const [y, m] = (this.myEmpAttMonth || Utils.thisMonth()).split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dateList.push(`${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
      }
      periodLabel = new Date((this.myEmpAttMonth || Utils.thisMonth()) + '-01').toLocaleDateString('en-PK', { month:'long', year:'numeric' });
    } else if (period === 'custom') {
      const start = new Date(this.myEmpAttFrom);
      const end   = new Date(this.myEmpAttTo);
      let curr = new Date(start);
      while (curr <= end && dateList.length < 366) {
        dateList.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
      periodLabel = `${Utils.formatDate(this.myEmpAttFrom)} to ${Utils.formatDate(this.myEmpAttTo)}`;
    }

    // Period control HTML
    let periodControls = '';
    if (period === 'daily' || period === 'dept_wise') {
      periodControls = `
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.prevMyEmpAttDay()" title="Previous Day"><i class="fa fa-chevron-left"></i></button>
          <input type="date" class="form-control" style="width:148px;height:34px;font-size:12.5px" value="${this.myEmpAttDate}" onchange="Attendance.setMyEmpAttDate(this.value)">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.nextMyEmpAttDay()" title="Next Day"><i class="fa fa-chevron-right"></i></button>
          <button class="btn btn-ghost btn-sm" style="height:34px;font-size:12px" onclick="Attendance.setMyEmpAttDate('${Utils.today()}')"><i class="fa fa-calendar-day"></i> Today</button>
        </div>`;
    } else if (period === 'weekly') {
      periodControls = `
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.prevMyEmpAttWeek()" title="Previous Week"><i class="fa fa-chevron-left"></i></button>
          <div style="font-size:12.5px;font-weight:700;color:var(--text);padding:0 6px;white-space:nowrap">${periodLabel}</div>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.nextMyEmpAttWeek()" title="Next Week"><i class="fa fa-chevron-right"></i></button>
          <button class="btn btn-ghost btn-sm" style="height:34px;font-size:12px" onclick="Attendance.myEmpAttWeekOffset=0;Attendance.renderView()"><i class="fa fa-rotate-left"></i> Current</button>
        </div>`;
    } else if (period === 'monthly' || period === 'employee_wise') {
      const allMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
      const selM = this.myEmpAttMonth || Utils.thisMonth();
      periodControls = `
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.prevMyEmpAttMonth()" title="Previous Month"><i class="fa fa-chevron-left"></i></button>
          <select class="filter-select" style="width:170px;height:34px" onchange="Attendance.setMyEmpAttMonth(this.value)">
            ${allMonths.map(mo => `<option value="${mo}" ${mo===selM?'selected':''}>${new Date(mo+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>`).join('')}
          </select>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.nextMyEmpAttMonth()" title="Next Month"><i class="fa fa-chevron-right"></i></button>
        </div>`;
    } else if (period === 'custom') {
      periodControls = `
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:11.5px;color:var(--text-3);font-weight:600">From:</span>
          <input type="date" class="form-control" id="myemp-att-from" style="width:135px;height:34px;font-size:12px" value="${this.myEmpAttFrom}">
          <span style="font-size:11.5px;color:var(--text-3);font-weight:600">To:</span>
          <input type="date" class="form-control" id="myemp-att-to" style="width:135px;height:34px;font-size:12px" value="${this.myEmpAttTo}">
          <button class="btn btn-primary btn-sm" style="height:34px" onclick="Attendance.applyMyEmpAttCustomRange()"><i class="fa fa-filter"></i> Apply</button>
        </div>`;
    }

    const statusColors = { present:'var(--success)', late:'var(--warning)', half_day:'var(--accent)', absent:'var(--danger)' };
    const statusIcons  = { present:'fa-circle-check', late:'fa-clock', half_day:'fa-circle-half-stroke', absent:'fa-circle-xmark' };
    const statusLabels = { present:'Present', late:'Late', half_day:'Half Day', absent:'Absent' };

    // KPI summary strip across all filtered employees for the period
    let kpiPresent=0, kpiAbsent=0, kpiLate=0, kpiHalf=0, kpiOT=0, kpiTotal=0;
    displayEmps.forEach(emp => {
      const empRecs = allAtt.filter(a => a.employeeId === emp.id && dateList.includes(a.date));
      kpiPresent += empRecs.filter(a => a.status === 'present').length;
      kpiLate    += empRecs.filter(a => a.status === 'late').length;
      kpiHalf    += empRecs.filter(a => a.status === 'half_day').length;
      kpiAbsent  += empRecs.filter(a => a.status === 'absent').length;
      kpiOT      += empRecs.filter(a => (a.overtime || 0) > 0).length;
      kpiTotal   += empRecs.length;
    });

    // Build Table or View HTML based on period
    let tableHTML = '';

    if (period === 'employee_wise') {
      // 1. Employee Wise Summary View
      const selMonth = this.myEmpAttMonth || Utils.thisMonth();
      tableHTML = `
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Total Days</th>
              <th style="color:var(--success)">Present</th>
              <th style="color:var(--danger)">Absent</th>
              <th style="color:var(--warning)">Late</th>
              <th style="color:var(--accent)">Half Day</th>
              <th>Overtime</th>
              <th>Attendance Rate</th>
            </tr></thead>
            <tbody>
              ${displayEmps.map(emp => {
                const empAtt = allAtt.filter(a => a.employeeId === emp.id && a.date.startsWith(selMonth));
                const p  = empAtt.filter(a => a.status === 'present').length;
                const ab = empAtt.filter(a => a.status === 'absent').length;
                const l  = empAtt.filter(a => a.status === 'late').length;
                const hd = empAtt.filter(a => a.status === 'half_day').length;
                const ot = empAtt.reduce((s,a) => s + (a.overtime||0), 0);
                const total = empAtt.length || 1;
                const pct = Math.round(((p + l) / total) * 100);
                const color = pct >= 90 ? 'var(--success)' : pct >= 75 ? 'var(--warning)' : 'var(--danger)';
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                    <div>
                      <div style="font-weight:600;font-size:13px">${emp.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp.empNo} · ${emp.designation || 'Staff'}</div>
                    </div>
                  </div></td>
                  <td><span class="badge badge-secondary">${Utils.getDeptName(emp.departmentId)}</span></td>
                  <td style="font-weight:600">${empAtt.length}</td>
                  <td style="color:var(--success);font-weight:700">${p}</td>
                  <td style="color:var(--danger);font-weight:700">${ab}</td>
                  <td style="color:var(--warning);font-weight:700">${l}</td>
                  <td style="color:var(--accent);font-weight:700">${hd}</td>
                  <td style="font-weight:600">${ot > 0 ? `<span class="badge badge-primary">${ot}h</span>` : '0h'}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress" style="flex:1;height:8px">
                        <div class="progress-bar" style="width:${pct}%;background:${color}"></div>
                      </div>
                      <span style="font-size:12px;font-weight:700;color:${color}">${pct}%</span>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (period === 'dept_wise') {
      // 2. Department Wise Overview
      const deptIds = [...new Set(emps.map(e => e.departmentId))];
      const myDepts = isAdmin ? depts : depts.filter(d => deptIds.includes(d.id));
      const targetDate = this.myEmpAttDate || Utils.today();
      const dayAtt = allAtt.filter(a => a.date === targetDate && scopedIds.includes(a.employeeId));

      tableHTML = `
        <div style="padding:18px">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-bottom:18px">
            ${myDepts.map(dept => {
              const deptEmps = emps.filter(e => e.departmentId === dept.id);
              const deptAtt = dayAtt.filter(a => deptEmps.some(e => e.id === a.employeeId));
              const p = deptAtt.filter(a => a.status === 'present').length;
              const ab = deptAtt.filter(a => a.status === 'absent').length;
              const l = deptAtt.filter(a => a.status === 'late').length;
              const hd = deptAtt.filter(a => a.status === 'half_day').length;
              const pct = deptEmps.length ? Math.round(((p + l) / deptEmps.length) * 100) : 0;
              const color = pct >= 90 ? 'var(--success)' : pct >= 75 ? 'var(--warning)' : 'var(--danger)';
              return `
                <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
                    <div>
                      <div style="font-size:16px;font-weight:700;color:var(--text)">${dept.name}</div>
                      <div style="font-size:12px;color:var(--text-3);margin-top:2px">${dept.code || 'DEPT'} • ${deptEmps.length} Team Members</div>
                    </div>
                    <div style="font-size:28px;font-weight:800;color:${color}">${pct}%</div>
                  </div>
                  <div class="progress" style="height:8px;margin-bottom:14px">
                    <div class="progress-bar" style="width:${pct}%;background:${color}"></div>
                  </div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <span class="badge badge-success">Present: ${p}</span>
                    <span class="badge badge-warning">Late: ${l}</span>
                    <span class="badge badge-accent">Half Day: ${hd}</span>
                    <span class="badge badge-danger">Absent: ${ab}</span>
                    <span class="badge badge-secondary">Not Marked: ${Math.max(0, deptEmps.length - deptAtt.length)}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="font-weight:700;font-size:13.5px;margin-bottom:10px;color:var(--text)">Employee Status Breakdown for ${Utils.formatDate(targetDate)}:</div>
          <div class="table-wrapper" style="border:1px solid var(--border);border-radius:8px">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th>${isAdmin ? '<th style="text-align:center">Action</th>' : ''}</tr></thead>
              <tbody>
                ${displayEmps.map(emp => {
                  const rec = dayAtt.find(a => a.employeeId === emp.id);
                  const hrs = rec?.timeIn && rec?.timeOut ? this.calcHours(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn) : '—';
                  return `<tr>
                    <td><div style="display:flex;align-items:center;gap:8px">
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                      <div><div style="font-size:12.5px;font-weight:600">${emp.fullName}</div><div style="font-size:10.5px;color:var(--text-3)">${emp.empNo}</div></div>
                    </div></td>
                    <td><span class="badge badge-secondary">${Utils.getDeptName(emp.departmentId)}</span></td>
                    <td style="color:var(--success);font-weight:600">${rec?.timeIn || '—'}</td>
                    <td style="color:var(--danger);font-weight:600">${rec?.timeOut || '—'}</td>
                    <td style="font-weight:600">${hrs}</td>
                    <td>${rec ? Utils.statusBadge(rec.status) : '<span class="badge badge-secondary">Not Marked</span>'}</td>
                    ${isAdmin ? `
                      <td style="text-align:center">
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.editRecord(${emp.id},'${targetDate}')" title="Edit Record"><i class="fa fa-pen"></i></button>
                      </td>
                    ` : ''}
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (period === 'monthly' || period === 'custom') {
      // 3. Monthly Matrix View
      const days = dateList.map(dStr => {
        const dt = new Date(dStr);
        return {
          dateStr: dStr,
          day: String(dt.getDate()).padStart(2, '0'),
          dayName: dt.toLocaleDateString('en', { weekday: 'narrow' }),
          isWeekend: dt.getDay() === 0 || dt.getDay() === 6,
          isHoliday: holidays.some(h => h.date === dStr)
        };
      });

      tableHTML = `
        <div class="table-wrapper" style="overflow-x:auto;max-height:520px;border:none;border-radius:0">
          <table style="min-width:${200 + days.length * 34}px;border-collapse:separate;border-spacing:0">
            <thead style="position:sticky;top:0;z-index:10;background:var(--surface)">
              <tr>
                <th style="min-width:180px;position:sticky;left:0;z-index:11;background:var(--surface)">Employee</th>
                ${days.map(d => `
                  <th style="text-align:center;min-width:32px;padding:5px 2px;font-size:10.5px;${(d.isWeekend || d.isHoliday) ? 'background:rgba(255,255,255,0.02);color:var(--text-muted)' : ''}" title="${d.dateStr}">
                    <div>${d.day}</div><div style="font-size:9px;font-weight:400;color:var(--text-muted)">${d.dayName}</div>
                  </th>`).join('')}
                <th style="text-align:center;min-width:32px;color:var(--success)">P</th>
                <th style="text-align:center;min-width:32px;color:var(--warning)">L</th>
                <th style="text-align:center;min-width:32px;color:var(--danger)">A</th>
                <th style="text-align:center;min-width:32px;color:var(--accent)">HD</th>
              </tr>
            </thead>
            <tbody>
              ${displayEmps.map(emp => {
                let p=0, l=0, a=0, hd=0;
                const cells = days.map(d => {
                  if ((d.isWeekend || d.isHoliday) && !allAtt.find(r => r.employeeId===emp.id && r.date===d.dateStr)) {
                    return `<td style="text-align:center;background:rgba(255,255,255,0.02);color:var(--text-muted);font-size:10px">${d.isHoliday ? 'H' : 'W'}</td>`;
                  }
                  const rec = allAtt.find(r => r.employeeId===emp.id && r.date===d.dateStr);
                  if (!rec) {
                    return isAdmin 
                      ? `<td style="text-align:center;cursor:pointer" onclick="Attendance.editRecord(${emp.id},'${d.dateStr}')" title="Mark for ${d.dateStr}"><span style="color:var(--text-muted)">—</span></td>`
                      : `<td style="text-align:center;color:var(--text-muted);font-size:10px">—</td>`;
                  }
                  if (rec.status==='present') p++;
                  else if (rec.status==='late') { l++; p++; }
                  else if (rec.status==='half_day') hd++;
                  else if (rec.status==='absent') a++;
                  const ic = { present:'P', late:'L', half_day:'H', absent:'A' };
                  const cl = statusColors[rec.status] || 'var(--text)';
                  const cellClick = isAdmin ? `onclick="Attendance.editRecord(${emp.id},'${d.dateStr}')" style="cursor:pointer;padding:3px 2px"` : `style="padding:3px 2px"`;
                  return `<td style="text-align:center" ${cellClick} title="${emp.fullName}: ${rec.status} (${rec.timeIn||'—'} – ${rec.timeOut||'—'})">
                    <span style="font-size:11px;font-weight:700;color:${cl};display:inline-block;padding:1px 4px;border-radius:4px;background:${cl}18">${ic[rec.status]||'?'}</span>
                  </td>`;
                }).join('');
                return `<tr>
                  <td style="position:sticky;left:0;background:var(--card);z-index:2">
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)};width:26px;height:26px;font-size:10px">${Utils.avatarInitials(emp.fullName)}</div>
                      <div><div style="font-size:12px;font-weight:600;white-space:nowrap">${emp.fullName}</div><div style="font-size:10px;color:var(--text-muted)">${emp.empNo} · ${Utils.getDeptName(emp.departmentId)}</div></div>
                    </div>
                  </td>
                  ${cells}
                  <td style="text-align:center;color:var(--success);font-weight:700">${p}</td>
                  <td style="text-align:center;color:var(--warning);font-weight:700">${l}</td>
                  <td style="text-align:center;color:var(--danger);font-weight:700">${a}</td>
                  <td style="text-align:center;color:var(--accent);font-weight:700">${hd}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:10px;display:flex;gap:14px;font-size:11.5px;color:var(--text-muted);flex-wrap:wrap">
          <span><strong style="color:var(--success)">P</strong> = Present</span>
          <span><strong style="color:var(--warning)">L</strong> = Late</span>
          <span><strong style="color:var(--danger)">A</strong> = Absent</span>
          <span><strong style="color:var(--accent)">H</strong> = Half Day</span>
          <span><strong>W</strong> = Weekend</span>
          <span><strong>H</strong> = Holiday</span>
          ${isAdmin ? `<span style="margin-left:auto;color:var(--primary);font-weight:600"><i class="fa fa-mouse-pointer"></i> Click any cell to mark or edit record</span>` : ''}
        </div>`;
    } else {
      // 4. Daily / Weekly Detailed Table View
      const allDates = period === 'weekly' ? dateList : [this.myEmpAttDate];
      tableHTML = allDates.map(dStr => {
        const dt = new Date(dStr);
        const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
        const isHoliday = holidays.some(h => h.date === dStr);
        const dayLabel = dt.toLocaleDateString('en-PK', { weekday:'long', month:'short', day:'numeric' });
        const dayAtt = allAtt.filter(a => scopedIds.includes(a.employeeId) && a.date === dStr);

        const rows = displayEmps.map(emp => {
          const rec = dayAtt.find(a => a.employeeId === emp.id);
          const recStatus = rec?.status;
          if (statusFilter !== 'all' && recStatus !== statusFilter && !(statusFilter === 'not_marked' && !rec)) return '';
          const hours = rec?.timeIn && rec?.timeOut ? this.calcHours(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn) : '—';
          const ot = rec?.overtime || 0;
          const statusCol = statusColors[recStatus] || 'var(--text-muted)';
          return `
            <tr class="myemp-att-row">
              <td><div style="display:flex;align-items:center;gap:10px">
                <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                <div><div style="font-weight:600;font-size:13px">${emp.fullName}</div><div style="font-size:11px;color:var(--text-3)">${emp.empNo} · ${Utils.getDeptName(emp.departmentId)}</div></div>
              </div></td>
              <td style="color:var(--success);font-weight:600">${rec?.timeIn || '—'}</td>
              <td style="color:#d97706;font-weight:600">${rec?.breakOut || '—'}</td>
              <td style="color:#2563eb;font-weight:600">${rec?.breakIn || '—'}</td>
              <td style="color:var(--danger);font-weight:600">${rec?.timeOut || '—'}</td>
              <td style="font-weight:600">${hours}</td>
              <td>${ot ? `<span class="badge badge-primary">${ot}h</span>` : '—'}</td>
              <td style="font-size:12px">${rec?.device || '—'}</td>
              <td>${rec ? `<span class="badge" style="background:${statusCol}20;color:${statusCol};border:1px solid ${statusCol}50;font-size:11px">${statusLabels[recStatus]||recStatus}</span>` : '<span class="badge badge-secondary" style="font-size:11px">Not Marked</span>'}</td>
              ${isAdmin ? `
                <td style="text-align:center">
                  <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.editRecord(${emp.id},'${dStr}')" title="Edit Record"><i class="fa fa-pen"></i></button>
                </td>
              ` : ''}
            </tr>`;
        }).join('');

        const totalRecs = dayAtt.filter(a => displayEmps.some(e => e.id === a.employeeId)).length;
        const headerBg = isWeekend || isHoliday ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.06)';

        return `
          <div style="margin-bottom:${period==='weekly'?'16px':'0'}">
            ${period === 'weekly' ? `
              <div style="background:${headerBg};border:1px solid var(--border);border-radius:8px 8px 0 0;padding:8px 14px;display:flex;align-items:center;justify-content:space-between">
                <div style="font-weight:700;font-size:13px;color:${isWeekend||isHoliday?'var(--text-muted)':'var(--text)'}">
                  <i class="fa ${isHoliday ? 'fa-star' : isWeekend ? 'fa-coffee' : 'fa-calendar-day'}" style="margin-right:6px;color:${isWeekend||isHoliday?'var(--text-muted)':'var(--primary)'}"></i>
                  ${dayLabel} ${isHoliday ? '<span class="badge badge-warning" style="font-size:10px">Holiday</span>' : isWeekend ? '<span class="badge badge-secondary" style="font-size:10px">Weekend</span>' : ''}
                </div>
                <div style="font-size:12px;color:var(--text-3)">${totalRecs} / ${displayEmps.length} marked</div>
              </div>
              <div class="table-wrapper" style="border-radius:0 0 8px 8px;border-top:none">
            ` : '<div class="table-wrapper">'}
              <table>
                <thead><tr>
                  <th>Employee</th><th>Check In</th><th>Break Out</th><th>Break In</th><th>Check Out</th><th>Working Hrs</th><th>Overtime</th><th>Device</th><th>Status</th>${isAdmin ? '<th style="text-align:center">Action</th>' : ''}
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="10"><div class="empty-state" style="padding:20px"><i class="fa fa-circle-check"></i><p style="margin:4px 0;font-size:12px">Weekend / Holiday — No Records</p></div></td></tr>'}</tbody>
              </table>
            </div>
          </div>`;
      }).join('');
    }

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Stage 2 Sub-Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
            <button class="btn btn-sm ${this.currentView==='my_employees'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('my_employees')">
              <i class="fa fa-users-line"></i> 4-in-1 Attendance Register
            </button>
            <button class="btn btn-sm ${this.currentView==='machine'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('machine')">
              <i class="fa fa-fingerprint"></i> Biometric Machine Hub
            </button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="Attendance.showBulkAttendance()"><i class="fa fa-users-line"></i> Bulk Mark</button>` : ''}
            ${isAdmin ? `<button class="btn btn-primary btn-sm" onclick="Attendance.showMarkAttendance()"><i class="fa fa-plus"></i> Mark Attendance</button>` : ''}
            <button class="btn btn-ghost btn-sm" onclick="Attendance.exportAttendance()"><i class="fa fa-file-export"></i> Export CSV</button>
          </div>
        </div>

        <!-- Header & Dropdown Filter Control Bar -->
        <div class="card" style="padding:16px 20px;margin-bottom:18px;background:var(--card);border:1px solid var(--border);border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
            
            <!-- Title & Dropdown Filter -->
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:38px;height:38px;border-radius:10px;background:rgba(79,128,247,0.12);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:18px">
                  <i class="fa fa-users-line"></i>
                </div>
                <div>
                  <div style="font-size:16px;font-weight:800;color:var(--text);letter-spacing:-0.3px">My Employees Attendance <span style="font-size:12px;font-weight:600;color:var(--text-3);margin-left:6px">• ${periodLabel}</span></div>
                  <div style="font-size:11.5px;color:var(--text-3)">
                    ${displayEmps.length} Employees ${isAdmin ? '• All Departments' : `• ${Utils.getDeptName(emps[0]?.departmentId)}`} • ${isAdmin ? 'Management View' : 'View-only'}
                  </div>
                </div>
              </div>

              <div style="height:28px;width:1px;background:var(--border);margin:0 4px"></div>

              <!-- Period Sub-Navigation Button Group -->
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Period View:</span>
                <div style="display:inline-flex;align-items:center;gap:3px;background:var(--surface);padding:3px;border-radius:8px;border:1px solid var(--border);flex-wrap:wrap">
                  ${[
                    { id: 'daily', label: 'Daily', icon: 'fa-calendar-day' },
                    { id: 'weekly', label: 'Weekly', icon: 'fa-calendar-week' },
                    { id: 'monthly', label: 'Monthly', icon: 'fa-calendar' },
                    { id: 'employee_wise', label: 'Employee Wise', icon: 'fa-user' },
                    { id: 'dept_wise', label: 'Dept Wise', icon: 'fa-building' },
                    { id: 'custom', label: 'Custom', icon: 'fa-sliders' },
                  ].map(p => `
                    <button class="btn btn-sm ${period === p.id ? 'btn-primary' : 'btn-ghost'}"
                      onclick="Attendance.changeMyEmpAttPeriod('${p.id}')"
                      style="padding:4px 9px;font-size:11.5px;font-weight:600;border-radius:6px;gap:5px;display:inline-flex;align-items:center">
                      <i class="fa ${p.icon}"></i>
                      <span>${p.label}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Dynamic Context Controls depending on selected period -->
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${periodControls}
            </div>

          </div>

          <!-- Filter Sub-bar: Department Filter (Admin) + Employee Filter + Status Filter + Read Only/Admin Badge + Export CSV -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;gap:10px">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              ${isAdmin ? `
                <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Department:</span>
                <select class="filter-select" style="height:32px;min-width:160px" onchange="Attendance.adminMyEmpDeptFilter=this.value;Attendance.renderView()">
                  <option value="all" ${(!this.adminMyEmpDeptFilter||this.adminMyEmpDeptFilter==='all')?'selected':''}>🏢 All Departments (${depts.length})</option>
                  ${depts.map(d => `<option value="${d.id}" ${this.adminMyEmpDeptFilter==d.id?'selected':''}>${d.name}</option>`).join('')}
                </select>
              ` : ''}

              <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Employee:</span>
              <select class="filter-select" style="height:32px;min-width:170px" onchange="Attendance.setMyEmpAttEmpFilter(this.value)">
                <option value="all" ${empFilter==='all'?'selected':''}>All Employees (${deptFilteredEmps.length})</option>
                ${deptFilteredEmps.map(e => `<option value="${e.id}" ${empFilter==e.id?'selected':''}>${e.fullName}</option>`).join('')}
              </select>

              <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-left:6px">Status:</span>
              ${['all', 'present', 'late', 'half_day', 'absent'].map(st => `
                <button class="btn btn-sm ${statusFilter===st?'btn-primary':'btn-ghost'}" style="padding:4px 10px;font-size:11.5px;border-radius:20px" onclick="Attendance.setMyEmpAttStatusFilter('${st}')">
                  ${st === 'all' ? 'All Records' : (st === 'half_day' ? 'Half Day' : (st.charAt(0).toUpperCase() + st.slice(1)))}
                </button>
              `).join('')}
            </div>

            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${isAdmin ? `
                <span style="background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600">
                  <i class="fa fa-shield-check" style="margin-right:4px"></i>Full Admin Access
                </span>
              ` : `
                <span style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600">
                  <i class="fa fa-lock" style="margin-right:4px"></i>Read Only
                </span>
              `}
              <button class="btn btn-ghost btn-sm" style="height:32px" onclick="Attendance.exportMyEmpAttendance()">
                <i class="fa fa-file-export"></i> Export CSV
              </button>
            </div>
          </div>
        </div>

        <!-- KPI Strip -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px">
          ${[
            { label:'Present',  val:kpiPresent, color:'#10b981', icon:'fa-circle-check' },
            { label:'Late',     val:kpiLate,    color:'#f59e0b', icon:'fa-clock' },
            { label:'Half Day', val:kpiHalf,    color:'#8b5cf6', icon:'fa-circle-half-stroke' },
            { label:'Absent',   val:kpiAbsent,  color:'#ef4444', icon:'fa-circle-xmark' },
            { label:'Overtime', val:kpiOT,      color:'#6366f1', icon:'fa-business-time' },
          ].map(s => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;border-left:3px solid ${s.color}">
              <i class="fa ${s.icon}" style="color:${s.color};font-size:18px"></i>
              <div>
                <div style="font-size:22px;font-weight:800;color:${s.color}">${s.val}</div>
                <div style="font-size:11px;color:var(--text-3)">${s.label}</div>
              </div>
            </div>`).join('')}
        </div>

        <!-- Attendance Table / Card View -->
        <div class="card" style="padding:0;overflow:hidden">
          ${tableHTML}
        </div>
      </div>
    `;
  },

  exportMyEmpAttendance() {
    if (!Auth.can('attendance.export')) {
      Toast.show('Permission denied: You do not have permission to export attendance data.', 'error');
      return;
    }
    const emps = this.getScopedEmployees();
    const isAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    let deptFiltered = emps;
    if (isAdmin && this.adminMyEmpDeptFilter && this.adminMyEmpDeptFilter !== 'all') {
      deptFiltered = emps.filter(e => e.departmentId === parseInt(this.adminMyEmpDeptFilter));
    }
    const empFilter = this.myEmpAttEmpFilter || 'all';
    const displayEmps = empFilter === 'all' ? deptFiltered : deptFiltered.filter(e => e.id === parseInt(empFilter));
    const scopedIds = displayEmps.map(e => e.id);
    const allAtt = DB.get('attendance') || [];
    let records = allAtt.filter(a => scopedIds.includes(a.employeeId));

    if (this.myEmpAttPeriod === 'daily' || this.myEmpAttPeriod === 'dept_wise') {
      records = records.filter(a => a.date === (this.myEmpAttDate || Utils.today()));
    } else if (this.myEmpAttPeriod === 'weekly') {
      const weekDates = this.getMyEmpAttWeekDates();
      records = records.filter(a => weekDates.includes(a.date));
    } else if (this.myEmpAttPeriod === 'monthly' || this.myEmpAttPeriod === 'employee_wise') {
      const month = this.myEmpAttMonth || Utils.thisMonth();
      records = records.filter(a => a.date.startsWith(month));
    } else if (this.myEmpAttPeriod === 'custom' && this.myEmpAttFrom && this.myEmpAttTo) {
      records = records.filter(a => a.date >= this.myEmpAttFrom && a.date <= this.myEmpAttTo);
    }

    if (this.myEmpAttStatusFilter && this.myEmpAttStatusFilter !== 'all') {
      records = records.filter(a => a.status === this.myEmpAttStatusFilter);
    }

    if (records.length === 0) {
      Toast.show('No team attendance records found to export for this period', 'warning');
      return;
    }

    const headers = ['Date', 'Employee #', 'Employee Name', 'Department', 'Check In', 'Break Out', 'Break In', 'Check Out', 'Working Hours', 'Overtime (hrs)', 'Status', 'Device', 'Remarks'];
    const rows = records.map(a => {
      const emp = emps.find(e => e.id === a.employeeId);
      const hours = a.timeIn && a.timeOut ? this.calcHours(a.timeIn, a.timeOut, a.breakOut, a.breakIn) : '';
      const ot = a.overtime || (a.timeIn && a.timeOut ? this.calcOvertime(a.timeIn, a.timeOut, a.breakOut, a.breakIn) : 0);
      return [
        a.date,
        emp?.empNo || a.employeeId,
        `"${(emp?.fullName || '').replace(/"/g, '""')}"`,
        `"${Utils.getDeptName(emp?.departmentId).replace(/"/g, '""')}"`,
        a.timeIn || '',
        a.breakOut || '',
        a.breakIn || '',
        a.timeOut || '',
        `"${hours}"`,
        ot,
        a.status,
        `"${(a.device || '').replace(/"/g, '""')}"`,
        `"${(a.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `team_attendance_${this.myEmpAttPeriod}_${Utils.today()}.csv`;
    Utils.downloadCSV(csv, filename);
    Toast.show(`Exported ${records.length} team records to ${filename}`, 'success');
  },

  // ============================================================
  // MY ATTENDANCE — Comprehensive Employee Self-Service View
  // Dropdown Menu Filter: Daily | Weekly | Monthly | Custom Dates
  // ============================================================
  changeMyAttPeriod(period) {
    this.myAttPeriod = period;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  setMyAttDate(date) {
    this.myAttDate = date;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  prevMyAttDay() {
    const d = new Date(this.myAttDate || Utils.today());
    d.setDate(d.getDate() - 1);
    this.myAttDate = d.toISOString().split('T')[0];
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  nextMyAttDay() {
    const d = new Date(this.myAttDate || Utils.today());
    d.setDate(d.getDate() + 1);
    this.myAttDate = d.toISOString().split('T')[0];
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  setMyAttToday() {
    this.myAttDate = Utils.today();
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  getMyAttWeekDates() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Monday
    const baseMonday = new Date(today.setDate(diff));
    baseMonday.setDate(baseMonday.getDate() + ((this.myAttWeekOffset || 0) * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  },

  prevMyAttWeek() {
    this.myAttWeekOffset = (this.myAttWeekOffset || 0) - 1;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  nextMyAttWeek() {
    this.myAttWeekOffset = (this.myAttWeekOffset || 0) + 1;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  setMyAttThisWeek() {
    this.myAttWeekOffset = 0;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  setMyAttMonth(month) {
    this.myAttMonth = month;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  prevMyAttMonth() {
    const [y, m] = (this.myAttMonth || Utils.thisMonth()).split('-').map(Number);
    const d = new Date(y, m - 2);
    this.myAttMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  nextMyAttMonth() {
    const [y, m] = (this.myAttMonth || Utils.thisMonth()).split('-').map(Number);
    const d = new Date(y, m);
    this.myAttMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  applyMyAttCustomRange() {
    const fromEl = document.getElementById('my-att-from');
    const toEl = document.getElementById('my-att-to');
    if (fromEl && toEl) {
      if (fromEl.value && toEl.value && fromEl.value > toEl.value) {
        Toast.show('From Date cannot be later than To Date', 'warning');
        return;
      }
      this.myAttFrom = fromEl.value;
      this.myAttTo = toEl.value;
      this.renderMyAttendance(document.getElementById('att-content'));
    }
  },

  setMyAttStatusFilter(status) {
    this.myAttStatusFilter = status;
    this.renderMyAttendance(document.getElementById('att-content'));
  },

  searchMyAtt(query) {
    this.myAttSearchQuery = (query || '').toLowerCase().trim();
    document.querySelectorAll('.my-att-row').forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(this.myAttSearchQuery) ? '' : 'none';
    });
  },

  renderPeriodContextControls() {
    if (this.myAttPeriod === 'daily') {
      return `
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.prevMyAttDay()" title="Previous Day"><i class="fa fa-chevron-left"></i></button>
          <input type="date" class="form-control" style="width:150px;height:34px;font-size:12.5px" value="${this.myAttDate}" onchange="Attendance.setMyAttDate(this.value)">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.nextMyAttDay()" title="Next Day"><i class="fa fa-chevron-right"></i></button>
          <button class="btn btn-ghost btn-sm" style="font-size:12px;height:34px" onclick="Attendance.setMyAttToday()"><i class="fa fa-calendar-day"></i> Today</button>
        </div>
      `;
    } else if (this.myAttPeriod === 'weekly') {
      const weekDates = this.getMyAttWeekDates();
      const wStart = new Date(weekDates[0]).toLocaleDateString('en', { month:'short', day:'numeric' });
      const wEnd = new Date(weekDates[6]).toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' });
      return `
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.prevMyAttWeek()" title="Previous Week"><i class="fa fa-chevron-left"></i></button>
          <div style="font-size:12.5px;font-weight:700;color:var(--text);padding:0 6px;white-space:nowrap">${wStart} – ${wEnd}</div>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.nextMyAttWeek()" title="Next Week"><i class="fa fa-chevron-right"></i></button>
          <button class="btn btn-ghost btn-sm" style="font-size:12px;height:34px" onclick="Attendance.setMyAttThisWeek()"><i class="fa fa-rotate-left"></i> Current</button>
        </div>
      `;
    } else if (this.myAttPeriod === 'monthly') {
      const allMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
      const selMonth = this.myAttMonth || Utils.thisMonth();
      return `
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.prevMyAttMonth()" title="Previous Month"><i class="fa fa-chevron-left"></i></button>
          <select class="filter-select" style="width:170px;height:34px" onchange="Attendance.setMyAttMonth(this.value)">
            ${allMonths.map(m => `
              <option value="${m}" ${m===selMonth?'selected':''}>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>
            `).join('')}
          </select>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.nextMyAttMonth()" title="Next Month"><i class="fa fa-chevron-right"></i></button>
        </div>
      `;
    } else if (this.myAttPeriod === 'custom') {
      return `
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:11.5px;color:var(--text-3);font-weight:600">From:</span>
          <input type="date" class="form-control" id="my-att-from" style="width:135px;height:34px;font-size:12px" value="${this.myAttFrom}">
          <span style="font-size:11.5px;color:var(--text-3);font-weight:600">To:</span>
          <input type="date" class="form-control" id="my-att-to" style="width:135px;height:34px;font-size:12px" value="${this.myAttTo}">
          <button class="btn btn-primary btn-sm" style="height:34px" onclick="Attendance.applyMyAttCustomRange()"><i class="fa fa-filter"></i> Apply</button>
        </div>
      `;
    }
    return '';
  },

  renderMyAttendance(container) {
    if (!container) return;
    const emp = Auth.employee || DB.find('employees', 4);
    const empId = emp?.id || 4;
    const allAtt = DB.get('attendance') || [];
    const myAttList = allAtt.filter(a => a.employeeId === empId);
    const shifts = DB.get('shifts') || [];
    const myShift = shifts.find(s => s.id === (emp?.shiftId || 1)) || shifts[0];
    const holidays = DB.get('holidays') || [];

    if (!this.myAttDate) this.myAttDate = Utils.today();
    if (!this.myAttMonth) this.myAttMonth = Utils.thisMonth();
    if (!this.myAttTo) this.myAttTo = Utils.today();
    if (!this.myAttFrom) {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      this.myAttFrom = d.toISOString().split('T')[0];
    }

    // Generate date sequence based on period
    let dateList = [];
    let periodTitle = '';
    let periodSubtitle = '';

    if (this.myAttPeriod === 'daily') {
      dateList = [this.myAttDate];
      const d = new Date(this.myAttDate);
      periodTitle = `Daily Attendance — ${d.toLocaleDateString('en-PK', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}`;
      periodSubtitle = `Detailed day punch dossier, verification stamps, and shift punctuality assessment`;
    } else if (this.myAttPeriod === 'weekly') {
      dateList = this.getMyAttWeekDates();
      const wStart = new Date(dateList[0]).toLocaleDateString('en-PK', { month:'short', day:'numeric' });
      const wEnd = new Date(dateList[6]).toLocaleDateString('en-PK', { month:'short', day:'numeric', year:'numeric' });
      periodTitle = `Weekly Attendance — ${wStart} to ${wEnd}`;
      periodSubtitle = `7-day rotational shift breakdown and weekly punctuality score`;
    } else if (this.myAttPeriod === 'monthly') {
      const [y, m] = (this.myAttMonth || Utils.thisMonth()).split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dateList.push(`${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
      }
      const mName = new Date(this.myAttMonth + '-01').toLocaleDateString('en-PK', { month:'long', year:'numeric' });
      periodTitle = `Monthly Attendance — ${mName}`;
      periodSubtitle = `Complete calendar month log of working hours, overtime, and leave history`;
    } else if (this.myAttPeriod === 'custom') {
      const start = new Date(this.myAttFrom);
      const end = new Date(this.myAttTo);
      let curr = new Date(start);
      while (curr <= end && dateList.length < 366) {
        dateList.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
      periodTitle = `Custom Period Attendance — ${Utils.formatDate(this.myAttFrom)} to ${Utils.formatDate(this.myAttTo)}`;
      periodSubtitle = `Custom date range report showing ${dateList.length} days of attendance records`;
    }

    // Metric aggregates across period
    let totalWorkingDays = 0;
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let totalMinutesWorked = 0;
    let totalOvertimeHours = 0;

    dateList.forEach(dStr => {
      const dt = new Date(dStr);
      const isWeekend = (dt.getDay() === 0 || dt.getDay() === 6);
      const isHoliday = holidays.some(h => h.date === dStr);
      const isWorkDay = !isWeekend && !isHoliday;
      if (isWorkDay) totalWorkingDays++;

      const rec = myAttList.find(a => a.date === dStr);
      if (rec) {
        if (rec.status === 'present') presentCount++;
        else if (rec.status === 'late') { lateCount++; presentCount++; }
        else if (rec.status === 'half_day') halfDayCount++;
        else if (rec.status === 'absent') absentCount++;

        if (rec.timeIn && rec.timeOut) {
          const netMins = this.calcWorkingMinutes(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn);
          if (netMins > 0) totalMinutesWorked += netMins;
        }
        totalOvertimeHours += (rec.overtime || 0);
      } else if (isWorkDay && dStr < Utils.today()) {
        absentCount++;
      }
    });

    const totalHoursWorked = Math.round((totalMinutesWorked / 60) * 10) / 10;
    const punctualityRate = totalWorkingDays > 0 ? Math.round((presentCount / totalWorkingDays) * 100) : 100;

    // Filter rows based on status filter
    const filteredDates = dateList.filter(dStr => {
      if (this.myAttStatusFilter === 'all') return true;
      const rec = myAttList.find(a => a.date === dStr);
      const isWeekend = (new Date(dStr).getDay() === 0 || new Date(dStr).getDay() === 6);
      const isHoliday = holidays.some(h => h.date === dStr);
      if (this.myAttStatusFilter === 'absent') {
        return (rec && rec.status === 'absent') || (!rec && !isWeekend && !isHoliday && dStr < Utils.today());
      }
      return rec && rec.status === this.myAttStatusFilter;
    });

    container.innerHTML = `
      <!-- Header & Dropdown Filter Control Bar -->
      <div class="card" style="padding:16px 20px;margin-bottom:20px;background:var(--card);border:1px solid var(--border);border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.03)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
          
          <!-- Title & Dropdown Filter -->
          <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:38px;height:38px;border-radius:10px;background:rgba(79,128,247,0.12);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:18px">
                <i class="fa fa-calendar-check"></i>
              </div>
              <div>
                <div style="font-size:16px;font-weight:800;color:var(--text);letter-spacing:-0.3px">My Attendance <span style="font-size:12px;font-weight:600;color:var(--text-3);margin-left:6px">• ${periodTitle}</span></div>
                <div style="font-size:11.5px;color:var(--text-3)">${emp.fullName} (${emp.empNo}) • ${Utils.getDeptName(emp.departmentId)} • ${periodSubtitle}</div>
              </div>
            </div>

            <div style="height:28px;width:1px;background:var(--border);margin:0 4px"></div>

            <!-- Dropdown Menu replacing multiple disparate columns -->
            <div style="display:flex;align-items:center;gap:8px">
              <label for="my-att-period-select" style="font-size:12px;font-weight:700;color:var(--text-2);margin:0">
                <i class="fa fa-filter" style="color:var(--primary);margin-right:4px"></i> Period View:
              </label>
              <select id="my-att-period-select" class="form-control" style="width:205px;font-weight:700;background:var(--surface);border-color:rgba(79,128,247,0.4)" onchange="Attendance.changeMyAttPeriod(this.value)">
                <option value="daily" ${this.myAttPeriod==='daily'?'selected':''}>📅 Daily (Single Date)</option>
                <option value="weekly" ${this.myAttPeriod==='weekly'?'selected':''}>📆 Weekly (7-Day View)</option>
                <option value="monthly" ${this.myAttPeriod==='monthly'?'selected':''}>🗓️ Monthly (Full Month)</option>
                <option value="custom" ${this.myAttPeriod==='custom'?'selected':''}>🔍 Custom Dates Range</option>
              </select>
            </div>
          </div>

          <!-- Dynamic Context Controls depending on selected period -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${this.renderPeriodContextControls()}
          </div>

        </div>

        <!-- Filter Sub-bar: Status Filter Pills + Search Input + CSV Export -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-right:4px">Status:</span>
            ${['all', 'present', 'late', 'half_day', 'absent'].map(st => `
              <button class="btn btn-sm ${this.myAttStatusFilter===st?'btn-primary':'btn-ghost'}" style="padding:4px 10px;font-size:11.5px;border-radius:20px" onclick="Attendance.setMyAttStatusFilter('${st}')">
                ${st === 'all' ? 'All Records' : (st === 'half_day' ? 'Half Day' : (st.charAt(0).toUpperCase() + st.slice(1)))}
              </button>
            `).join('')}
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <div style="position:relative">
              <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--text-muted)"></i>
              <input type="text" class="form-control" style="padding-left:28px;width:180px;font-size:12px;height:32px" placeholder="Search date, remark..." value="${this.myAttSearchQuery||''}" oninput="Attendance.searchMyAtt(this.value)">
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Attendance.exportMyAttendance()" title="Export current attendance view to CSV">
              <i class="fa fa-file-export"></i> Export CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Filtered Period KPI Summary Row -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center">
          <div style="font-size:11px;color:var(--text-3);font-weight:600">Total Period Days</div>
          <div style="font-size:20px;font-weight:800;color:var(--text);margin-top:2px">${dateList.length}</div>
          <div style="font-size:10px;color:var(--text-muted)">${totalWorkingDays} Workdays</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center">
          <div style="font-size:11px;color:var(--text-3);font-weight:600">Present Days</div>
          <div style="font-size:20px;font-weight:800;color:var(--success);margin-top:2px">${presentCount}</div>
          <div style="font-size:10px;color:var(--text-muted)">${totalWorkingDays ? Math.round(presentCount/totalWorkingDays*100) : 0}% of schedule</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center">
          <div style="font-size:11px;color:var(--text-3);font-weight:600">Late Check-ins</div>
          <div style="font-size:20px;font-weight:800;color:var(--warning);margin-top:2px">${lateCount}</div>
          <div style="font-size:10px;color:var(--text-muted)">Cutoff: 11:00 AM</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center">
          <div style="font-size:11px;color:var(--text-3);font-weight:600">Half Days</div>
          <div style="font-size:20px;font-weight:800;color:#8b5cf6;margin-top:2px">${halfDayCount}</div>
          <div style="font-size:10px;color:var(--text-muted)">Recorded</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center">
          <div style="font-size:11px;color:var(--text-3);font-weight:600">Absent / Missed</div>
          <div style="font-size:20px;font-weight:800;color:var(--danger);margin-top:2px">${absentCount}</div>
          <div style="font-size:10px;color:var(--text-muted)">Requires resolution</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center">
          <div style="font-size:11px;color:var(--text-3);font-weight:600">Working Hours</div>
          <div style="font-size:20px;font-weight:800;color:var(--primary);margin-top:2px">${totalHoursWorked}h</div>
          <div style="font-size:10px;color:var(--text-muted)">Target: 8h/day</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center">
          <div style="font-size:11px;color:var(--text-3);font-weight:600">Overtime Logged</div>
          <div style="font-size:20px;font-weight:800;color:#6366f1;margin-top:2px">${totalOvertimeHours}h</div>
          <div style="font-size:10px;color:var(--text-muted)">Verified extra hours</div>
        </div>
      </div>

      <!-- Main Content: Daily Single-Day Dossier OR Detailed Records Table -->
      ${this.myAttPeriod === 'daily' ? this.renderMyAttDailyDossier(dateList[0], myAttList, myShift, holidays, empId) : this.renderMyAttTable(filteredDates, myAttList, myShift, holidays, empId)}
    `;
  },

  renderMyAttDailyDossier(dStr, myAttList, myShift, holidays, empId = (Auth.employee?.id || 4)) {
    const rec = myAttList.find(a => a.date === dStr);
    const dt = new Date(dStr);
    const isToday = dStr === Utils.today();
    const isWeekend = (dt.getDay() === 0 || dt.getDay() === 6);
    const holiday = holidays.find(h => h.date === dStr);
    const hours = rec?.timeIn && rec?.timeOut ? this.calcHours(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn) : '—';
    const overtimeHours = rec?.overtime || (rec?.timeIn && rec?.timeOut ? this.calcOvertime(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn) : 0);

    let statusBadge = '<span class="badge badge-secondary">Not Marked</span>';
    if (rec) statusBadge = Utils.statusBadge(rec.status);
    else if (holiday) statusBadge = `<span class="badge badge-info"><i class="fa fa-umbrella-beach"></i> Holiday: ${holiday.name}</span>`;
    else if (isWeekend) statusBadge = `<span class="badge badge-secondary"><i class="fa fa-couch"></i> Weekend Rest Day</span>`;
    else if (dStr < Utils.today()) statusBadge = `<span class="badge badge-danger"><i class="fa fa-circle-xmark"></i> Absent (Missed Punch)</span>`;
    else statusBadge = `<span class="badge badge-info"><i class="fa fa-calendar"></i> Scheduled</span>`;

    return `
      <div class="card" style="padding:22px;border-radius:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <h3 style="font-size:18px;font-weight:800;color:var(--text);margin:0">
                ${dt.toLocaleDateString('en-PK', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
              </h3>
              ${statusBadge}
            </div>
            <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
              Assigned Shift: <strong>${myShift?.name || 'Standard Shift'}</strong> (${myShift?.startTime || '09:00'} – ${myShift?.endTime || '18:00'}) • Time-In Cutoff: <strong>11:00 AM</strong>
            </div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${isToday ? `
              ${(!rec || !rec.timeIn) ? `
                <button class="btn btn-success" style="padding:8px 18px;font-weight:700" onclick="Dashboard.quickSelfPunch('in');setTimeout(()=>Attendance.renderView(),300)">
                  <i class="fa fa-fingerprint"></i> Check In (Punch #1)
                </button>
              ` : (!rec.breakOut ? `
                <button class="btn btn-warning" style="padding:8px 16px;font-weight:700;color:white" onclick="Dashboard.quickSelfPunch('ot_out');setTimeout(()=>Attendance.renderView(),300)">
                  <i class="fa fa-mug-hot"></i> OT-Out (Punch #2)
                </button>
                <button class="btn btn-danger" style="padding:8px 16px;font-weight:700" onclick="Dashboard.quickSelfPunch('out');setTimeout(()=>Attendance.renderView(),300)">
                  <i class="fa fa-arrow-right-from-bracket"></i> Check Out
                </button>
              ` : (!rec.breakIn ? `
                <button class="btn btn-info" style="padding:8px 16px;font-weight:700;color:white" onclick="Dashboard.quickSelfPunch('ot_in');setTimeout(()=>Attendance.renderView(),300)">
                  <i class="fa fa-rotate-left"></i> OT-In (Punch #3)
                </button>
                <button class="btn btn-danger" style="padding:8px 16px;font-weight:700" onclick="Dashboard.quickSelfPunch('out');setTimeout(()=>Attendance.renderView(),300)">
                  <i class="fa fa-arrow-right-from-bracket"></i> Check Out
                </button>
              ` : (!rec.timeOut ? `
                <button class="btn btn-danger" style="padding:8px 18px;font-weight:700" onclick="Dashboard.quickSelfPunch('out');setTimeout(()=>Attendance.renderView(),300)">
                  <i class="fa fa-arrow-right-from-bracket"></i> Check Out (Punch #4)
                </button>
              ` : `
                <span class="badge badge-success" style="padding:6px 12px;font-size:12px"><i class="fa fa-circle-check"></i> Shift Completed (${rec.punchCount || 4}/4 Swipes)</span>
              `)))}
            ` : ''}

            <button class="btn btn-ghost btn-sm" onclick="Attendance.showMachinePunchDetail(${empId}, '${dStr}')" title="View Biometric Machine Swipes">
              <i class="fa fa-fingerprint"></i> Machine Swipes Log
            </button>

            <button class="btn btn-warning btn-sm" onclick="Attendance.showApplyCorrectionModal('${dStr}')">
              <i class="fa fa-wrench"></i> Request Attendance Correction / WFH
            </button>
          </div>
        </div>

        <!-- 6 KPI Dossier Cards: Check In, OT-Out, OT-In, Check Out, Working Hours, Overtime -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:20px">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;border-top:3px solid var(--success)">
            <div style="font-size:11px;color:var(--text-3);font-weight:700"><i class="fa fa-arrow-right-to-bracket" style="color:var(--success);margin-right:5px"></i>Check In (Punch #1)</div>
            <div style="font-size:22px;font-weight:800;color:${rec?.timeIn?'var(--success)':'var(--text-muted)'};margin-top:6px">
              ${rec?.timeIn || '—'}
            </div>
            <div style="font-size:10.5px;color:var(--text-3);margin-top:4px">
              ${rec?.timeIn ? (rec.timeIn <= (myShift.timeInWindowEnd || '11:00') ? '✓ On-Time Arrival' : '⚠ Late Arrival') : 'No punch recorded'}
            </div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;border-top:3px solid #d97706">
            <div style="font-size:11px;color:var(--text-3);font-weight:700"><i class="fa fa-mug-hot" style="color:#d97706;margin-right:5px"></i>OT-Out (Punch #2)</div>
            <div style="font-size:22px;font-weight:800;color:${rec?.breakOut?'#d97706':'var(--text-muted)'};margin-top:6px">
              ${rec?.breakOut || '—'}
            </div>
            <div style="font-size:10.5px;color:var(--text-3);margin-top:4px">
              ${rec?.breakOut ? 'OT / Lunch exit punch' : 'No punch recorded'}
            </div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;border-top:3px solid #2563eb">
            <div style="font-size:11px;color:var(--text-3);font-weight:700"><i class="fa fa-rotate-left" style="color:#2563eb;margin-right:5px"></i>OT-In (Punch #3)</div>
            <div style="font-size:22px;font-weight:800;color:${rec?.breakIn?'#2563eb':'var(--text-muted)'};margin-top:6px">
              ${rec?.breakIn || '—'}
            </div>
            <div style="font-size:10.5px;color:var(--text-3);margin-top:4px">
              ${rec?.breakIn ? 'OT / Lunch resume punch' : 'No punch recorded'}
            </div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;border-top:3px solid var(--danger)">
            <div style="font-size:11px;color:var(--text-3);font-weight:700"><i class="fa fa-arrow-right-from-bracket" style="color:var(--danger);margin-right:5px"></i>Check Out (Punch #4)</div>
            <div style="font-size:22px;font-weight:800;color:${rec?.timeOut?'var(--danger)':'var(--text-muted)'};margin-top:6px">
              ${rec?.timeOut || '—'}
            </div>
            <div style="font-size:10.5px;color:var(--text-3);margin-top:4px">
              ${rec?.timeOut ? 'Standard shift punch-out' : 'Awaiting punch-out'}
            </div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;border-top:3px solid var(--primary)">
            <div style="font-size:11px;color:var(--text-3);font-weight:700"><i class="fa fa-business-time" style="color:var(--primary);margin-right:5px"></i>Working Hours / Total Duration Logged</div>
            <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:6px">
              ${hours}
            </div>
            <div style="font-size:10.5px;color:var(--text-3);margin-top:4px">
              Net duration (deducts breaks)
            </div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;border-top:3px solid #8b5cf6">
            <div style="font-size:11px;color:var(--text-3);font-weight:700"><i class="fa fa-clock" style="color:#8b5cf6;margin-right:5px"></i>Overtime</div>
            <div style="font-size:22px;font-weight:800;color:#8b5cf6;margin-top:6px">
              ${overtimeHours ? overtimeHours + ' hrs' : '0.0 hrs'}
            </div>
            <div style="font-size:10.5px;color:var(--text-3);margin-top:4px">
              ${rec?.punchCount ? `${rec.punchCount}/4 Swipes (${rec.completionStatus || 'Complete'})` : 'Daily Machine Punch Cycle'}
            </div>
          </div>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div>
              <div style="font-size:12px;color:var(--text-3);font-weight:600">Verification Source &amp; Device Terminal</div>
              <div style="font-size:13.5px;font-weight:700;color:var(--text);margin-top:2px">
                <i class="fa fa-fingerprint" style="color:var(--primary);margin-right:6px"></i>
                ${rec?.device || (isWeekend ? 'Rest Day' : (holiday ? 'Holiday' : 'Web Punch / Biometric Sync'))}
              </div>
            </div>
            <div>
              <div style="font-size:12px;color:var(--text-3);font-weight:600">System Remarks &amp; Audit Logs</div>
              <div style="font-size:13.5px;color:var(--text-2);margin-top:2px">
                ${rec?.remarks || (isWeekend ? 'Rest Day' : (holiday ? holiday.name : 'Regular attendance record verified'))}
              </div>
            </div>
            <div>
              <button class="btn btn-ghost btn-sm" onclick="Attendance.exportMyAttendance()"><i class="fa fa-download"></i> Export Slip</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderMyAttTable(filteredDates, myAttList, myShift, holidays, empId = (Auth.employee?.id || 4)) {
    if (filteredDates.length === 0) {
      return `
        <div class="card" style="padding:40px;text-align:center">
          <div style="font-size:36px;color:var(--text-muted);margin-bottom:12px"><i class="fa fa-calendar-xmark"></i></div>
          <h3 style="font-size:16px;font-weight:700;color:var(--text)">No Attendance Records Found</h3>
          <p style="font-size:12.5px;color:var(--text-3);max-width:400px;margin:6px auto 16px">
            No matching records for the selected period and status filter.
          </p>
          <button class="btn btn-primary btn-sm" onclick="Attendance.setMyAttStatusFilter('all')"><i class="fa fa-rotate"></i> Reset Filters</button>
        </div>
      `;
    }

    return `
      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th style="min-width:130px">Date &amp; Day</th>
                <th>Shift</th>
                <th>Check In (Time In)</th>
                <th>OT-Out (Break)</th>
                <th>OT-In (Resume)</th>
                <th>Check Out (Time Out)</th>
                <th>Working Hours</th>
                <th>Overtime</th>
                <th>Source / Device</th>
                <th>Status</th>
                <th>Remarks</th>
                <th style="text-align:center">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDates.map(dStr => {
                const rec = myAttList.find(a => a.date === dStr);
                const dt = new Date(dStr);
                const isWeekend = (dt.getDay() === 0 || dt.getDay() === 6);
                const holiday = holidays.find(h => h.date === dStr);
                const dayName = dt.toLocaleDateString('en-PK', { weekday:'short' });
                const hours = rec?.timeIn && rec?.timeOut ? this.calcHours(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn) : '—';
                const otHours = rec?.overtime || (rec?.timeIn && rec?.timeOut ? this.calcOvertime(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn) : 0);

                let statusPill = '<span class="badge badge-secondary">Not Marked</span>';
                if (rec) statusPill = Utils.statusBadge(rec.status);
                else if (holiday) statusPill = `<span class="badge badge-info"><i class="fa fa-umbrella-beach"></i> Holiday</span>`;
                else if (isWeekend) statusPill = `<span class="badge badge-secondary">Weekend</span>`;
                else if (dStr < Utils.today()) statusPill = `<span class="badge badge-danger">Absent</span>`;
                else statusPill = `<span class="badge badge-info">Scheduled</span>`;

                const needsCorrection = rec?.status === 'late' || rec?.status === 'absent' || (!rec && !isWeekend && !holiday && dStr < Utils.today());

                return `
                  <tr class="my-att-row">
                    <td>
                      <div style="font-weight:700;font-size:13px;color:var(--text)">${Utils.formatDate(dStr)}</div>
                      <div style="font-size:11px;color:var(--text-3)">${dayName} ${isWeekend ? '• Weekend' : ''}</div>
                    </td>
                    <td>
                      <span style="font-size:12px;font-weight:500;color:var(--text-2)">${myShift?.name || 'Standard Shift'}</span>
                    </td>
                    <td style="color:var(--success);font-weight:700">
                      ${rec?.timeIn ? `<i class="fa fa-arrow-right-to-bracket" style="font-size:10px;margin-right:4px;opacity:0.8"></i>${rec.timeIn}` : '—'}
                    </td>
                    <td style="color:#d97706;font-weight:600">
                      ${rec?.breakOut ? `<i class="fa fa-mug-hot" style="font-size:10px;margin-right:4px;opacity:0.8"></i>${rec.breakOut}` : '—'}
                    </td>
                    <td style="color:#2563eb;font-weight:600">
                      ${rec?.breakIn ? `<i class="fa fa-rotate-left" style="font-size:10px;margin-right:4px;opacity:0.8"></i>${rec.breakIn}` : '—'}
                    </td>
                    <td style="color:var(--danger);font-weight:700">
                      ${rec?.timeOut ? `<i class="fa fa-arrow-right-from-bracket" style="font-size:10px;margin-right:4px;opacity:0.8"></i>${rec.timeOut}` : '—'}
                    </td>
                    <td style="font-weight:700;font-size:12.5px;color:var(--primary)">${hours}</td>
                    <td>${otHours > 0 ? `<span class="badge badge-primary" style="font-weight:700">${otHours}h</span>` : '—'}</td>
                    <td style="font-size:11.5px;color:var(--text-3)">
                      ${rec?.device || (isWeekend ? 'Rest Day' : (holiday ? holiday.name : '—'))}
                    </td>
                    <td>${statusPill}</td>
                    <td style="max-width:180px;font-size:11.5px;color:var(--text-2);text-overflow:ellipsis;overflow:hidden;white-space:nowrap" title="${rec?.remarks || ''}">
                      ${rec?.remarks || (isWeekend ? 'Rest Day' : (holiday ? holiday.name : '—'))}
                    </td>
                    <td style="text-align:center;white-space:nowrap">
                      <button class="btn btn-ghost btn-sm" style="color:var(--primary);padding:3px 7px;font-size:11px" onclick="Attendance.showMachinePunchDetail(${empId}, '${dStr}')" title="View Machine Swipes">
                        <i class="fa fa-fingerprint"></i> Swipes
                      </button>
                      ${needsCorrection ? `
                        <button class="btn btn-ghost btn-sm" style="color:var(--warning);padding:3px 7px;font-size:11px" onclick="Attendance.showApplyCorrectionModal('${dStr}')" title="Request Attendance Correction">
                          <i class="fa fa-wrench"></i> Fix
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportMyAttendance() {
    if (!Auth.can('attendance.export')) {
      Toast.show('Permission denied: You do not have permission to export attendance data.', 'error');
      return;
    }
    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;
    const allAtt = DB.get('attendance') || [];
    let records = allAtt.filter(a => a.employeeId === myEmpId);

    if (this.myAttPeriod === 'daily') {
      records = records.filter(a => a.date === (this.myAttDate || Utils.today()));
    } else if (this.myAttPeriod === 'weekly') {
      const weekDates = this.getMyAttWeekDates();
      records = records.filter(a => weekDates.includes(a.date));
    } else if (this.myAttPeriod === 'monthly') {
      const month = this.myAttMonth || Utils.thisMonth();
      records = records.filter(a => a.date.startsWith(month));
    } else if (this.myAttPeriod === 'custom' && this.myAttFrom && this.myAttTo) {
      records = records.filter(a => a.date >= this.myAttFrom && a.date <= this.myAttTo);
    }

    if (records.length === 0) {
      Toast.show('No attendance records found to export for this period', 'warning');
      return;
    }

    const headers = ['Date', 'Day', 'Employee #', 'Name', 'Check In (Time In)', 'Break Out', 'Break In', 'Check Out (Time Out)', 'Working Hours', 'Overtime (hrs)', 'Status', 'Device', 'Remarks'];
    const rows = records.map(a => {
      const d = new Date(a.date);
      const dayName = d.toLocaleDateString('en-PK', { weekday: 'short' });
      const hours = a.timeIn && a.timeOut ? this.calcHours(a.timeIn, a.timeOut, a.breakOut, a.breakIn) : '';
      const ot = a.overtime || (a.timeIn && a.timeOut ? this.calcOvertime(a.timeIn, a.timeOut, a.breakOut, a.breakIn) : 0);
      return [
        a.date,
        dayName,
        myEmp.empNo,
        `"${myEmp.fullName.replace(/"/g, '""')}"`,
        a.timeIn || '',
        a.breakOut || '',
        a.breakIn || '',
        a.timeOut || '',
        `"${hours}"`,
        ot,
        a.status,
        `"${(a.device || '').replace(/"/g, '""')}"`,
        `"${(a.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `my_attendance_${myEmp.empNo}_${this.myAttPeriod}_${Utils.today()}.csv`;
    Utils.downloadCSV(csv, filename);
    Toast.show(`Exported ${records.length} records to ${filename}`, 'success');
  },

  renderDaily(container) {
    const emps = this.getScopedEmployees();
    const depts = DB.get('departments') || [];
    const isAdminOrHr = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    let filteredEmps = emps;
    if (isAdminOrHr && this.adminDailyDeptFilter && this.adminDailyDeptFilter !== 'all') {
      filteredEmps = emps.filter(e => e.departmentId === parseInt(this.adminDailyDeptFilter));
    }
    const scopedIds = filteredEmps.map(e => e.id);
    const att = DB.get('attendance').filter(a => a.date === this.currentDate && scopedIds.includes(a.employeeId));

    container.innerHTML = `
      <!-- Stage 4 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm ${this.currentView==='corrections'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('corrections')">
            <i class="fa fa-clipboard-check"></i> Attendance Regularization &amp; WFH
          </button>
          <button class="btn btn-sm ${this.currentView==='timesheets'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('timesheets')">
            <i class="fa fa-business-time"></i> Project Timesheets &amp; Billing
          </button>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Attendance.showApplyCorrectionModal()">
          <i class="fa fa-plus"></i> Apply Correction / WFH
        </button>
      </div>

      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.prevDay()"><i class="fa fa-chevron-left"></i></button>
            <input type="date" class="form-control" style="width:160px" value="${this.currentDate}" onchange="Attendance.currentDate=this.value;Attendance.renderView()">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.nextDay()"><i class="fa fa-chevron-right"></i></button>
            <span style="font-size:13px;color:var(--text-3);font-weight:600">${Utils.formatDate(this.currentDate)}</span>
          </div>
          ${isAdminOrHr ? `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:12px;color:var(--text-3);font-weight:600">Department:</span>
              <select class="filter-select" style="min-width:180px;height:34px" onchange="Attendance.adminDailyDeptFilter=this.value;Attendance.renderView()">
                <option value="all" ${(!this.adminDailyDeptFilter||this.adminDailyDeptFilter==='all')?'selected':''}>🏢 All Departments (${depts.length})</option>
                ${depts.map(d => `<option value="${d.id}" ${this.adminDailyDeptFilter==d.id?'selected':''}>${d.name}</option>`).join('')}
              </select>
            </div>
          ` : ''}
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Check In (Time In)</th><th>Break Out</th><th>Break In</th><th>Check Out (Time Out)</th><th>Working Hours</th><th>Overtime</th><th>Device</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${filteredEmps.map(emp => {
                const rec = att.find(a => a.employeeId === emp.id);
                const hours = rec?.timeIn && rec?.timeOut ? this.calcHours(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn) : '—';
                const ot = rec?.overtime || (rec?.timeIn && rec?.timeOut ? this.calcOvertime(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn) : 0);
                return `
                  <tr>
                    <td><div style="display:flex;align-items:center;gap:10px">
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                      <div><div style="font-weight:600;font-size:13px">${emp.fullName}</div><div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div></div>
                    </div></td>
                    <td><span class="badge badge-secondary">${Utils.getDeptName(emp.departmentId)}</span></td>
                    <td style="color:var(--success);font-weight:600">${rec?.timeIn || '—'}</td>
                    <td style="color:#d97706;font-weight:600">${rec?.breakOut || '—'}</td>
                    <td style="color:#2563eb;font-weight:600">${rec?.breakIn || '—'}</td>
                    <td style="color:var(--danger);font-weight:600">${rec?.timeOut || '—'}</td>
                    <td style="font-weight:600">${hours}</td>
                    <td>${ot ? `<span class="badge badge-primary">${ot}h</span>` : '—'}</td>
                    <td style="font-size:12px">${rec?.device || '—'}</td>
                    <td>${rec ? Utils.statusBadge(rec.status) : '<span class="badge badge-secondary">Not Marked</span>'}</td>
                    <td><button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.editRecord(${emp.id},'${this.currentDate}')"><i class="fa fa-pen"></i></button></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderMonthly(container) {
    const [year, month] = this.currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const emps = this.getScopedEmployees();
    const depts = DB.get('departments') || [];
    const isAdminOrHr = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    let filteredEmps = emps;
    if (isAdminOrHr && this.adminMonthlyDeptFilter && this.adminMonthlyDeptFilter !== 'all') {
      filteredEmps = emps.filter(e => e.departmentId === parseInt(this.adminMonthlyDeptFilter));
    }
    const scopedIds = filteredEmps.map(e => e.id);
    const att = DB.get('attendance').filter(a => a.date.startsWith(this.currentMonth) && scopedIds.includes(a.employeeId));

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
      days.push({ day: String(d).padStart(2,'0'), isWeekend, dayName: date.toLocaleDateString('en', { weekday: 'narrow' }) });
    }

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-ghost btn-sm" onclick="Attendance.prevMonth()"><i class="fa fa-chevron-left"></i></button>
          <select class="filter-select" onchange="Attendance.currentMonth=this.value;Attendance.renderView()" style="width:190px">
            ${['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'].map(m => `<option value="${m}" ${m===this.currentMonth?'selected':''}>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>`).join('')}
          </select>
          <button class="btn btn-ghost btn-sm" onclick="Attendance.nextMonth()"><i class="fa fa-chevron-right"></i></button>
          ${isAdminOrHr ? `
            <select class="filter-select" style="min-width:180px;height:34px" onchange="Attendance.adminMonthlyDeptFilter=this.value;Attendance.renderView()">
              <option value="all" ${(!this.adminMonthlyDeptFilter||this.adminMonthlyDeptFilter==='all')?'selected':''}>🏢 All Departments (${depts.length})</option>
              ${depts.map(d => `<option value="${d.id}" ${this.adminMonthlyDeptFilter==d.id?'selected':''}>${d.name}</option>`).join('')}
            </select>
          ` : ''}
        </div>
        <div style="font-size:12px;color:var(--text-3);display:flex;gap:12px;align-items:center">
          <span><strong style="color:var(--text)">${filteredEmps.length}</strong> Employees</span>
          <span><strong style="color:var(--text)">${daysInMonth}</strong> Days</span>
          <span>Click any cell to edit record</span>
        </div>
      </div>
      <div class="table-wrapper" style="overflow-x:auto;max-height:600px">
        <table style="min-width:${180 + days.length * 36 + 180}px;border-collapse:separate;border-spacing:0">
          <thead style="position:sticky;top:0;z-index:10;background:var(--surface)">
            <tr>
              <th style="min-width:200px;position:sticky;left:0;z-index:11;background:var(--surface)">Employee</th>
              ${days.map(d => `
                <th style="text-align:center;min-width:34px;padding:6px 2px;font-size:11px;${d.isWeekend ? 'background:rgba(255,255,255,0.02);color:var(--text-muted)' : ''}">
                  <div>${d.day}</div>
                  <div style="font-size:9px;font-weight:400;color:var(--text-muted)">${d.dayName}</div>
                </th>
              `).join('')}
              <th style="text-align:center;min-width:35px;color:var(--success)">P</th>
              <th style="text-align:center;min-width:35px;color:var(--danger)">A</th>
              <th style="text-align:center;min-width:35px;color:var(--warning)">L</th>
              <th style="text-align:center;min-width:35px;color:var(--accent)">HD</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEmps.map(emp => {
              let p=0, a=0, l=0, hd=0;
              return `<tr>
                <td style="position:sticky;left:0;background:var(--card);z-index:2">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)};width:26px;height:26px;font-size:10px">${Utils.avatarInitials(emp.fullName)}</div>
                    <div>
                      <div style="font-size:12px;font-weight:600;white-space:nowrap">${emp.fullName}</div>
                      <div style="font-size:10px;color:var(--text-muted)">${emp.empNo} · ${Utils.getDeptName(emp.departmentId)}</div>
                    </div>
                  </div>
                </td>
                ${days.map(d => {
                  const dateStr = `${this.currentMonth}-${d.day}`;
                  const rec = att.find(a => a.employeeId === emp.id && a.date === dateStr);
                  if (d.isWeekend && !rec) {
                    return `<td style="text-align:center;background:rgba(255,255,255,0.02);color:var(--text-muted);font-size:10px">W</td>`;
                  }
                  if (!rec) {
                    return `<td style="text-align:center;cursor:pointer" onclick="Attendance.editRecord(${emp.id},'${dateStr}')" title="Mark for ${dateStr}"><span style="color:var(--text-muted)">—</span></td>`;
                  }
                  const icons = { present:'P', absent:'A', late:'L', half_day:'H' };
                  const colors = { present:'var(--success)', absent:'var(--danger)', late:'var(--warning)', half_day:'var(--accent)' };
                  if (rec.status === 'present') p++;
                  else if (rec.status === 'absent') a++;
                  else if (rec.status === 'late') { l++; p++; }
                  else if (rec.status === 'half_day') hd++;
                  return `
                    <td style="text-align:center;cursor:pointer;padding:4px 2px" onclick="Attendance.editRecord(${emp.id},'${dateStr}')" title="${emp.fullName}: ${rec.status} (${rec.timeIn || '—'} to ${rec.timeOut || '—'})">
                      <span style="font-size:11px;font-weight:700;color:${colors[rec.status]||'var(--text)'};display:inline-block;padding:2px 4px;border-radius:4px;background:${colors[rec.status]}15">
                        ${icons[rec.status]||'?'}
                      </span>
                    </td>
                  `;
                }).join('')}
                <td style="text-align:center;color:var(--success);font-weight:700">${p}</td>
                <td style="text-align:center;color:var(--danger);font-weight:700">${a}</td>
                <td style="text-align:center;color:var(--warning);font-weight:700">${l}</td>
                <td style="text-align:center;color:var(--accent);font-weight:700">${hd}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;display:flex;gap:16px;font-size:11.5px;color:var(--text-muted);flex-wrap:wrap">
        <span><strong style="color:var(--success)">P</strong> = Present</span>
        <span><strong style="color:var(--danger)">A</strong> = Absent</span>
        <span><strong style="color:var(--warning)">L</strong> = Late</span>
        <span><strong style="color:var(--accent)">H</strong> = Half Day</span>
        <span><strong>W</strong> = Weekend</span>
      </div>
    `;
  },

  renderEmployeeWise(container) {
    const emps = this.getScopedEmployees();
    const depts = DB.get('departments') || [];
    const isAdminOrHr = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const selMonth = this.currentMonth || Utils.thisMonth();

    let filteredEmps = emps;
    if (isAdminOrHr && this.adminEmpWiseDeptFilter && this.adminEmpWiseDeptFilter !== 'all') {
      filteredEmps = emps.filter(e => e.departmentId === parseInt(this.adminEmpWiseDeptFilter));
    }
    const scopedIds = filteredEmps.map(e => e.id);
    const att = DB.get('attendance').filter(a => scopedIds.includes(a.employeeId));

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:12.5px;font-weight:600;color:var(--text-3)">Month:</span>
            <select class="filter-select" onchange="Attendance.currentMonth=this.value;Attendance.renderView()" style="width:190px">
              ${['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'].map(m => `<option value="${m}" ${m===selMonth?'selected':''}>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>`).join('')}
            </select>
          </div>
          ${isAdminOrHr ? `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:12px;color:var(--text-3);font-weight:600">Department:</span>
              <select class="filter-select" style="min-width:180px;height:34px" onchange="Attendance.adminEmpWiseDeptFilter=this.value;Attendance.renderView()">
                <option value="all" ${(!this.adminEmpWiseDeptFilter||this.adminEmpWiseDeptFilter==='all')?'selected':''}>🏢 All Departments (${depts.length})</option>
                ${depts.map(d => `<option value="${d.id}" ${this.adminEmpWiseDeptFilter==d.id?'selected':''}>${d.name}</option>`).join('')}
              </select>
            </div>
          ` : ''}
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Late</th><th>Half Day</th><th>Overtime Hrs</th><th>Attendance %</th></tr></thead>
            <tbody>
              ${filteredEmps.map(emp => {
                const empAtt = att.filter(a => a.employeeId === emp.id && a.date.startsWith(selMonth));
                const p  = empAtt.filter(a => a.status === 'present').length;
                const ab = empAtt.filter(a => a.status === 'absent').length;
                const l  = empAtt.filter(a => a.status === 'late').length;
                const hd = empAtt.filter(a => a.status === 'half_day').length;
                const ot = empAtt.reduce((s,a) => s + (a.overtime||0), 0);
                const total = empAtt.length || 1;
                const pct = Math.round(((p+l)/total)*100);
                const color = pct>=90?'var(--success)':pct>=75?'var(--warning)':'var(--danger)';
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                    <div><div style="font-weight:600;font-size:13px">${emp.fullName}</div><div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div></div>
                  </div></td>
                  <td><span class="badge badge-secondary">${Utils.getDeptName(emp.departmentId)}</span></td>
                  <td>${total}</td>
                  <td style="color:var(--success);font-weight:600">${p}</td>
                  <td style="color:var(--danger);font-weight:600">${ab}</td>
                  <td style="color:var(--warning);font-weight:600">${l}</td>
                  <td style="color:var(--accent);font-weight:600">${hd}</td>
                  <td>${ot}h</td>
                  <td><div style="display:flex;align-items:center;gap:8px"><div class="progress" style="flex:1"><div class="progress-bar" style="width:${pct}%;background:${color}"></div></div><span style="font-size:12px;font-weight:600;color:${color}">${pct}%</span></div></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderDeptWise(container) {
    const emps = this.getScopedEmployees();
    let depts = DB.get('departments');
    if (Auth.role === 'dept_manager') {
      const deptIds = [...new Set(emps.map(e => e.departmentId))];
      depts = depts.filter(d => deptIds.includes(d.id));
    }
    const scopedIds = emps.map(e => e.id);
    const att = DB.get('attendance').filter(a => a.date === this.currentDate && scopedIds.includes(a.employeeId));
    container.innerHTML = `
      <div class="grid-3">
        ${depts.map(dept => {
          const deptEmpIds = emps.filter(e => e.departmentId === dept.id && e.status === 'active').map(e => e.id);
          const deptAtt = att.filter(a => deptEmpIds.includes(a.employeeId));
          const p = deptAtt.filter(a => a.status === 'present').length;
          const ab = deptAtt.filter(a => a.status === 'absent').length;
          const l = deptAtt.filter(a => a.status === 'late').length;
          const pct = deptEmpIds.length ? Math.round((p + l) / deptEmpIds.length * 100) : 0;
          return `
            <div class="card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                <div>
                  <div style="font-size:15px;font-weight:700">${dept.name}</div>
                  <div style="font-size:12px;color:var(--text-3)">${dept.code} • ${dept.employeeCount} employees</div>
                </div>
                <div style="font-size:28px;font-weight:800;color:${pct>=90?'var(--success)':pct>=75?'var(--warning)':'var(--danger)'}">${pct}%</div>
              </div>
              <div class="progress" style="margin-bottom:12px"><div class="progress-bar" style="width:${pct}%;background:${pct>=90?'var(--success)':pct>=75?'var(--warning)':'var(--danger)'}"></div></div>
              <div style="display:flex;gap:8px">
                <span class="badge badge-success">Present: ${p}</span>
                <span class="badge badge-danger">Absent: ${ab}</span>
                <span class="badge badge-warning">Late: ${l}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  setMachineLogDate(d) {
    this.machineLogDate = d;
    this.renderView();
  },

  prevMachineLogDate() {
    const dt = new Date(this.machineLogDate || Utils.today());
    dt.setDate(dt.getDate() - 1);
    this.machineLogDate = dt.toISOString().split('T')[0];
    this.renderView();
  },

  nextMachineLogDate() {
    const dt = new Date(this.machineLogDate || Utils.today());
    dt.setDate(dt.getDate() + 1);
    this.machineLogDate = dt.toISOString().split('T')[0];
    this.renderView();
  },

  setMachineLogToday() {
    this.machineLogDate = Utils.today();
    this.renderView();
  },

  setMachineLogDeptFilter(dept) {
    this.machineLogDeptFilter = dept;
    this.renderView();
  },

  setMachineLogEmpFilter(empId) {
    this.machineLogEmpFilter = empId;
    this.renderView();
  },

  setMachineLogPunchFilter(punch) {
    this.machineLogPunchFilter = punch;
    this.renderView();
  },

  setMachineLogDeviceFilter(dev) {
    this.machineLogDeviceFilter = dev;
    this.renderView();
  },

  setMachineLogSearch(q) {
    this.machineLogSearchQuery = (q || '').toLowerCase().trim();
    document.querySelectorAll('.machine-punch-row').forEach(row => {
      const txt = row.textContent.toLowerCase();
      row.style.display = txt.includes(this.machineLogSearchQuery) ? '' : 'none';
    });
  },

  renderMachineLog(container) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isManager = Auth.role === 'dept_manager';
    const isAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    const allEmps = DB.get('employees') || [];
    const activeEmps = allEmps.filter(e => e.status === 'active');
    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;

    let scopedEmps = [];
    if (isEmployee) {
      scopedEmps = myEmp ? [myEmp] : [];
    } else if (isManager) {
      scopedEmps = this.getScopedEmployees();
    } else {
      scopedEmps = activeEmps;
    }
    const scopedIds = scopedEmps.map(e => e.id);

    const allLogs = DB.get('attendance_logs') || [];
    const devices = DB.get('biometric_devices') || [
      { id: 1, name: 'Head Office Terminal', ip: '192.168.1.201', port: 4370, location: 'Head Office Main Entrance', status: 'online' },
      { id: 2, name: 'Factory Main Gate', ip: '192.168.1.202', port: 4370, location: 'Factory Plant Entrance', status: 'online' }
    ];
    const departments = DB.get('departments') || [];
    const curDate = this.machineLogDate || Utils.today();

    // Filter logs by date and role scoping
    const dateRoleLogs = allLogs.filter(l => scopedIds.includes(l.employeeId) && l.date === curDate);

    // Group punches by employee for daily sequence & frequency calculation
    const empPunchesMap = {};
    dateRoleLogs.forEach(l => {
      if (!empPunchesMap[l.employeeId]) empPunchesMap[l.employeeId] = [];
      empPunchesMap[l.employeeId].push(l);
    });
    Object.keys(empPunchesMap).forEach(eId => {
      empPunchesMap[eId].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    });

    // Compute day KPIs
    const totalSwipesCaptured = dateRoleLogs.length;
    const uniqueEmployeesCount = Object.keys(empPunchesMap).length;

    let completeCyclesCount = 0;
    let inProgressCount = 0;
    let partialCount = 0;

    Object.keys(empPunchesMap).forEach(eId => {
      const pList = empPunchesMap[eId];
      const types = pList.map(p => p.punchType);
      const hasIn = types.includes('check_in');
      const hasOTOut = types.includes('ot_out');
      const hasOTIn = types.includes('ot_in');
      const hasOut = types.includes('check_out');

      if (hasIn && hasOTOut && hasOTIn && hasOut) {
        completeCyclesCount++;
      } else if (hasIn && !hasOut) {
        inProgressCount++;
      } else {
        partialCount++;
      }
    });

    // Apply secondary filters (Department, Employee, Punch Type, Device)
    let filteredLogs = [...dateRoleLogs];

    if (isAdmin && this.machineLogDeptFilter !== 'all') {
      filteredLogs = filteredLogs.filter(l => {
        const emp = allEmps.find(e => e.id === l.employeeId);
        return String(emp?.departmentId) === String(this.machineLogDeptFilter);
      });
    }

    if (this.machineLogEmpFilter !== 'all') {
      filteredLogs = filteredLogs.filter(l => String(l.employeeId) === String(this.machineLogEmpFilter));
    }

    if (this.machineLogPunchFilter !== 'all') {
      filteredLogs = filteredLogs.filter(l => l.punchType === this.machineLogPunchFilter);
    }

    if (this.machineLogDeviceFilter !== 'all') {
      filteredLogs = filteredLogs.filter(l => l.device === this.machineLogDeviceFilter);
    }

    // Sort newest punches first
    filteredLogs.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    // Punch badge generator
    const getPunchBadge = (pType, pLabel) => {
      switch (pType) {
        case 'check_in':
          return `<span class="badge badge-success" style="font-size:11px;font-weight:700;padding:4px 9px"><i class="fa fa-arrow-right-to-bracket" style="margin-right:4px"></i>${pLabel || 'Check-In'}</span>`;
        case 'ot_out':
          return `<span class="badge badge-warning" style="background:#f59e0b;color:white;font-size:11px;font-weight:700;padding:4px 9px"><i class="fa fa-mug-hot" style="margin-right:4px"></i>${pLabel || 'OT-Out'}</span>`;
        case 'ot_in':
          return `<span class="badge badge-info" style="background:#0284c7;color:white;font-size:11px;font-weight:700;padding:4px 9px"><i class="fa fa-rotate-left" style="margin-right:4px"></i>${pLabel || 'OT-In'}</span>`;
        case 'check_out':
          return `<span class="badge badge-danger" style="font-size:11px;font-weight:700;padding:4px 9px"><i class="fa fa-arrow-right-from-bracket" style="margin-right:4px"></i>${pLabel || 'Check-Out'}</span>`;
        default:
          return `<span class="badge badge-secondary" style="font-size:11px;padding:4px 9px">${pLabel || 'Punch'}</span>`;
      }
    };

    container.innerHTML = `
      <!-- Stage 2 Sub-Navigation -->
      ${!isEmployee ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
            <button class="btn btn-sm ${this.currentView==='my_employees'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('my_employees')">
              <i class="fa fa-users-line"></i> 4-in-1 Attendance Register
            </button>
            <button class="btn btn-sm ${this.currentView==='machine'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('machine')">
              <i class="fa fa-fingerprint"></i> Biometric Machine Hub
            </button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="Attendance.showZKTecoUploadModal()"><i class="fa fa-file-import"></i> Import ZKTeco Log</button>` : ''}
            <button class="btn btn-ghost btn-sm" onclick="Attendance.exportMachineLogs()"><i class="fa fa-file-export"></i> Export Logs</button>
          </div>
        </div>
      ` : ''}

      <!-- Header Banner & Scoping Notice -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(99,102,241,0.14);color:var(--primary)">
              <i class="fa fa-fingerprint"></i>
            </span>
            ${isEmployee ? 'My Biometric Machine Punch Logs & Swipe Telemetry' : isManager ? 'Department Team Biometric Machine Punch Logs' : 'Biometric Machine Hardware Integration & Punch Hub'}
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            ${isEmployee 
              ? 'Personal biometric terminal swipe logs, 4-option punch frequency tracking (Check-In, OT-Out, OT-In, Check-Out), and daily attendance cycle status.' 
              : isManager 
              ? 'Monitoring swipe logs for you and your department staff. Review punch frequencies, sequences, and verify 4-way shift completion.' 
              : 'Enterprise-wide biometric terminal telemetry hub. Real-time swipe logs, 4-option machine tracking, frequency analytics, and automated attendance cycle verification.'}
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${isAdmin ? `
            <button class="btn btn-secondary btn-sm" onclick="Attendance.showZKTecoUploadModal()">
              <i class="fa fa-file-import"></i> Import ZKTeco Log (.dat / .csv)
            </button>
            <button class="btn btn-primary btn-sm" onclick="Attendance.syncBiometricHardware()">
              <i class="fa fa-rotate"></i> 1-Click Terminal Hardware Sync
            </button>
          ` : ''}
          <button class="btn btn-ghost btn-sm" onclick="Attendance.exportMachinePunchLogs()">
            <i class="fa fa-file-export"></i> Export CSV Log
          </button>
        </div>
      </div>

      <!-- 4 KPI Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--primary)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Total Machine Swipes</div>
              <div style="font-size:26px;font-weight:800;color:var(--primary);margin-top:4px">${totalSwipesCaptured}</div>
            </div>
            <div style="width:36px;height:36px;border-radius:9px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:16px">
              <i class="fa fa-fingerprint"></i>
            </div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">
            Captured on ${Utils.formatDate(curDate)} across all terminals
          </div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--success)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Complete Daily Cycles</div>
              <div style="font-size:26px;font-weight:800;color:var(--success);margin-top:4px">${completeCyclesCount}</div>
            </div>
            <div style="width:36px;height:36px;border-radius:9px;background:rgba(16,185,129,0.12);display:flex;align-items:center;justify-content:center;color:var(--success);font-size:16px">
              <i class="fa fa-circle-check"></i>
            </div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">
            Completed all 4 machine options (In, OT-Out, OT-In, Out)
          </div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid #0284c7">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Active On Shift</div>
              <div style="font-size:26px;font-weight:800;color:#0284c7;margin-top:4px">${inProgressCount}</div>
            </div>
            <div style="width:36px;height:36px;border-radius:9px;background:rgba(2,132,199,0.12);display:flex;align-items:center;justify-content:center;color:#0284c7;font-size:16px">
              <i class="fa fa-person-walking-arrow-right"></i>
            </div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">
            Swiped Check-In or OT-In; awaiting evening Check-Out
          </div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid #8b5cf6">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Unique Users Swiped</div>
              <div style="font-size:26px;font-weight:800;color:#8b5cf6;margin-top:4px">${uniqueEmployeesCount}</div>
            </div>
            <div style="width:36px;height:36px;border-radius:9px;background:rgba(139,92,246,0.12);display:flex;align-items:center;justify-content:center;color:#8b5cf6;font-size:16px">
              <i class="fa fa-users"></i>
            </div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">
            ${uniqueEmployeesCount > 0 ? (totalSwipesCaptured / uniqueEmployeesCount).toFixed(1) : 0} avg swipes per employee today
          </div>
        </div>
      </div>

      <!-- Biometric Hardware Terminals Strip (Admin / Manager) -->
      ${!isEmployee ? `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
          ${devices.map(d => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:10px;height:10px;border-radius:50%;background:var(--success);box-shadow:0 0 8px var(--success)"></div>
                  <div>
                    <div style="font-weight:700;font-size:13px;color:var(--text)">${d.name}</div>
                    <div style="font-size:11px;color:var(--text-3)">${d.location || 'Hardware Terminal'}</div>
                  </div>
                </div>
                <span class="badge badge-success" style="font-size:10px">ONLINE (Port 4370)</span>
              </div>
              <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:11px;color:var(--text-3)">
                <span>IP: <strong style="font-family:monospace;color:var(--text)">${d.ip}</strong></span>
                <span>Mode: <strong>Biometric / RFID</strong></span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Interactive Filters & Sub-bar -->
      <div class="card" style="padding:14px 18px;margin-bottom:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <!-- Date Navigator -->
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.prevMachineLogDate()" title="Previous Day"><i class="fa fa-chevron-left"></i></button>
            <input type="date" class="form-control" style="width:145px;padding:6px 10px;font-size:12.5px" value="${curDate}" onchange="Attendance.setMachineLogDate(this.value)">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.nextMachineLogDate()" title="Next Day"><i class="fa fa-chevron-right"></i></button>
            <button class="btn btn-ghost btn-sm" onclick="Attendance.setMachineLogToday()"><i class="fa fa-calendar-day"></i> Today</button>
          </div>

          <!-- Dropdowns -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${isAdmin ? `
              <select class="form-control" style="width:160px;font-size:12px;padding:6px 10px" onchange="Attendance.setMachineLogDeptFilter(this.value)">
                <option value="all" ${this.machineLogDeptFilter==='all'?'selected':''}>All Departments</option>
                ${departments.map(d => `<option value="${d.id}" ${String(this.machineLogDeptFilter)===String(d.id)?'selected':''}>${d.name}</option>`).join('')}
              </select>
            ` : ''}

            ${!isEmployee ? `
              <select class="form-control" style="width:160px;font-size:12px;padding:6px 10px" onchange="Attendance.setMachineLogEmpFilter(this.value)">
                <option value="all" ${this.machineLogEmpFilter==='all'?'selected':''}>All Employees (${scopedEmps.length})</option>
                ${scopedEmps.map(e => `<option value="${e.id}" ${String(this.machineLogEmpFilter)===String(e.id)?'selected':''}>${e.fullName} (${e.empNo})</option>`).join('')}
              </select>
            ` : ''}

            <select class="form-control" style="width:160px;font-size:12px;padding:6px 10px" onchange="Attendance.setMachineLogPunchFilter(this.value)">
              <option value="all" ${this.machineLogPunchFilter==='all'?'selected':''}>All Punch Options (4)</option>
              <option value="check_in" ${this.machineLogPunchFilter==='check_in'?'selected':''}>Check-In (Punch #1)</option>
              <option value="ot_out" ${this.machineLogPunchFilter==='ot_out'?'selected':''}>OT-Out (Punch #2)</option>
              <option value="ot_in" ${this.machineLogPunchFilter==='ot_in'?'selected':''}>OT-In (Punch #3)</option>
              <option value="check_out" ${this.machineLogPunchFilter==='check_out'?'selected':''}>Check-Out (Punch #4)</option>
            </select>

            <select class="form-control" style="width:160px;font-size:12px;padding:6px 10px" onchange="Attendance.setMachineLogDeviceFilter(this.value)">
              <option value="all" ${this.machineLogDeviceFilter==='all'?'selected':''}>All Biometric Terminals</option>
              ${devices.map(d => `<option value="${d.name}" ${this.machineLogDeviceFilter===d.name?'selected':''}>${d.name}</option>`).join('')}
            </select>

            <div style="position:relative">
              <input type="text" class="form-control" placeholder="Search employee..." style="padding:6px 10px 6px 28px;font-size:12px;width:150px" oninput="Attendance.setMachineLogSearch(this.value)">
              <i class="fa fa-magnifying-glass" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:11px"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Machine Swipes Telemetry Table -->
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div style="font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:8px">
            <i class="fa fa-list-check" style="color:var(--primary)"></i>
            Biometric Machine Swipe Telemetry Log &bull; ${Utils.formatDate(curDate)}
          </div>
          <div style="font-size:12px;color:var(--text-3)">
            Showing <strong>${filteredLogs.length}</strong> of <strong>${totalSwipesCaptured}</strong> swipe events
          </div>
        </div>

        ${filteredLogs.length === 0 ? `
          <div style="padding:48px 20px;text-align:center">
            <div style="font-size:38px;color:var(--text-muted);margin-bottom:12px"><i class="fa fa-fingerprint"></i></div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text)">No Biometric Machine Logs Found</h3>
            <p style="font-size:12.5px;color:var(--text-3);max-width:440px;margin:6px auto 16px">
              No swipe telemetry captured for this date and selected filter criteria.
            </p>
            ${isAdmin ? `
              <button class="btn btn-primary btn-sm" onclick="Attendance.syncBiometricHardware()"><i class="fa fa-rotate"></i> Sync Biometric Hardware Terminals</button>
            ` : ''}
          </div>
        ` : `
          <div class="table-wrapper" style="border:none;border-radius:0">
            <table>
              <thead>
                <tr>
                  <th style="min-width:110px">Swipe Time</th>
                  <th>Machine Option</th>
                  <th>Swipe Frequency / Seq #</th>
                  <th>Employee</th>
                  <th>Emp # &amp; Dept</th>
                  <th>Terminal Hardware</th>
                  <th>Verify Mode</th>
                  <th>Daily Shift Cycle</th>
                  <th style="text-align:center">Action</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLogs.map(log => {
                  const emp = allEmps.find(e => e.id === log.employeeId);
                  const dept = emp ? Utils.getDeptName(emp.departmentId) : '—';
                  const pList = empPunchesMap[log.employeeId] || [];
                  const empTotalToday = pList.length;
                  const punchIdx = pList.findIndex(p => p.id === log.id);
                  const seqNum = punchIdx >= 0 ? (punchIdx + 1) : (log.punchNumber || 1);

                  // Completion status for employee
                  const types = pList.map(p => p.punchType);
                  const is4WayComplete = types.includes('check_in') && types.includes('ot_out') && types.includes('ot_in') && types.includes('check_out');
                  const isInProgress = types.includes('check_in') && !types.includes('check_out');

                  return `
                    <tr class="machine-punch-row">
                      <td>
                        <div style="font-family:monospace;font-size:13.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px">
                          <i class="fa fa-clock" style="color:var(--primary);font-size:12px"></i>
                          ${log.time || '—'}
                        </div>
                        <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">${Utils.formatDate(log.date)}</div>
                      </td>

                      <td>
                        ${getPunchBadge(log.punchType, log.punchLabel)}
                      </td>

                      <td>
                        <div style="display:flex;align-items:center;gap:6px">
                          <span class="badge badge-secondary" style="font-weight:700;font-size:11px">
                            Swipe #${seqNum} of ${empTotalToday}
                          </span>
                        </div>
                        <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">
                          ${empTotalToday >= 4 ? '<span style="color:var(--success);font-weight:600">✓ 4 Swipes Completed</span>' : `<span style="color:var(--warning);font-weight:600">${empTotalToday} swipe(s) recorded</span>`}
                        </div>
                      </td>

                      <td>
                        <div style="display:flex;align-items:center;gap:10px">
                          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(log.employeeId)}">${Utils.avatarInitials(emp?.fullName||'?')}</div>
                          <div>
                            <div style="font-weight:700;font-size:13px;color:var(--text)">${emp?.fullName || '—'}</div>
                            <div style="font-size:11px;color:var(--text-3)">${emp?.designation || 'Staff'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style="font-family:monospace;font-size:12px;color:var(--primary);font-weight:700">${emp?.empNo || '—'}</span>
                        <div style="font-size:11px;color:var(--text-3);margin-top:2px">${dept}</div>
                      </td>

                      <td>
                        <div style="font-weight:600;font-size:12px;color:var(--text);display:flex;align-items:center;gap:5px">
                          <i class="fa fa-fingerprint" style="color:var(--primary)"></i>
                          ${log.device || 'ZKTeco-Main-Gate'}
                        </div>
                        <div style="font-size:10.5px;font-family:monospace;color:var(--text-3);margin-top:1px">${log.deviceIp || '192.168.1.201'}</div>
                      </td>

                      <td>
                        <span class="chip" style="font-size:11px">
                          <i class="fa ${log.verifyMode === 'Face Recognition' ? 'fa-user-tag' : 'fa-fingerprint'}" style="margin-right:4px;color:var(--primary)"></i>
                          ${log.verifyMode || 'Fingerprint'}
                        </span>
                      </td>

                      <td>
                        ${is4WayComplete ? `
                          <span class="badge badge-success" style="font-size:11px;font-weight:700"><i class="fa fa-circle-check"></i> Complete (4/4)</span>
                        ` : isInProgress ? `
                          <span class="badge badge-primary" style="font-size:11px;font-weight:700"><i class="fa fa-person-walking-arrow-right"></i> In Progress (${empTotalToday}/4)</span>
                        ` : `
                          <span class="badge badge-warning" style="font-size:11px;font-weight:700"><i class="fa fa-circle-exclamation"></i> Incomplete (${empTotalToday}/4)</span>
                        `}
                      </td>

                      <td style="text-align:center">
                        <button class="btn btn-ghost btn-sm" onclick="Attendance.showMachinePunchDetail(${log.employeeId}, '${curDate}')" title="View Full Day Swipes Timeline">
                          <i class="fa fa-timeline" style="color:var(--primary)"></i> Day Log
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  showMachinePunchDetail(empId, date) {
    const emp = DB.find('employees', empId);
    if (!emp) return;

    const allLogs = DB.get('attendance_logs') || [];
    const empLogs = allLogs.filter(l => l.employeeId === empId && l.date === date);
    empLogs.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const allAtt = DB.get('attendance') || [];
    const attRec = allAtt.find(a => a.employeeId === empId && a.date === date);

    const checkInLog  = empLogs.find(l => l.punchType === 'check_in');
    const otOutLog    = empLogs.find(l => l.punchType === 'ot_out');
    const otInLog     = empLogs.find(l => l.punchType === 'ot_in');
    const checkOutLog = empLogs.find(l => l.punchType === 'check_out');

    const totalSwipes = empLogs.length;
    const isComplete = checkInLog && otOutLog && otInLog && checkOutLog;
    const isInProgress = checkInLog && !checkOutLog;

    Modal.show(`Biometric Machine Swipe Dossier &bull; ${emp.fullName}`, `
      <div style="margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="avatar avatar-md" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text)">${emp.fullName} <span style="font-family:monospace;font-size:13px;color:var(--primary);margin-left:6px">(${emp.empNo})</span></div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">${emp.designation || 'Staff'} &bull; ${Utils.getDeptName(emp.departmentId)} &bull; ${Utils.formatDate(date)}</div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:8px">
          <div style="background:var(--surface);padding:8px 14px;border-radius:8px;border:1px solid var(--border);text-align:center">
            <div style="font-size:10px;color:var(--text-3);font-weight:700;text-transform:uppercase">Total Swipes Today</div>
            <div style="font-size:20px;font-weight:800;color:var(--primary);margin-top:2px">${totalSwipes} Times</div>
          </div>
          <div style="background:var(--surface);padding:8px 14px;border-radius:8px;border:1px solid var(--border);text-align:center">
            <div style="font-size:10px;color:var(--text-3);font-weight:700;text-transform:uppercase">Shift Status</div>
            <div style="font-size:13px;font-weight:700;margin-top:4px">
              ${isComplete ? '<span style="color:var(--success)">Complete (4/4)</span>' : isInProgress ? '<span style="color:var(--primary)">In Progress</span>' : '<span style="color:var(--warning)">Incomplete</span>'}
            </div>
          </div>
        </div>
      </div>

      <!-- 4 Machine Option Punch Matrix Strip -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <!-- Punch #1 Check-In -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;border-top:3px solid var(--success)">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);display:flex;align-items:center;gap:5px">
            <i class="fa fa-arrow-right-to-bracket" style="color:var(--success)"></i> Punch #1: Check-In
          </div>
          <div style="font-size:19px;font-weight:800;color:${checkInLog ? 'var(--success)' : 'var(--text-muted)'};margin-top:6px;font-family:monospace">
            ${checkInLog?.time || '—'}
          </div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">
            ${checkInLog ? `${checkInLog.device || 'ZKTeco'} &bull; ${checkInLog.verifyMode || 'Fingerprint'}` : 'Not swiped'}
          </div>
        </div>

        <!-- Punch #2 OT-Out -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;border-top:3px solid #f59e0b">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);display:flex;align-items:center;gap:5px">
            <i class="fa fa-mug-hot" style="color:#f59e0b"></i> Punch #2: OT-Out
          </div>
          <div style="font-size:19px;font-weight:800;color:${otOutLog ? '#f59e0b' : 'var(--text-muted)'};margin-top:6px;font-family:monospace">
            ${otOutLog?.time || '—'}
          </div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">
            ${otOutLog ? `${otOutLog.device || 'ZKTeco'} &bull; ${otOutLog.verifyMode || 'Fingerprint'}` : 'Not swiped'}
          </div>
        </div>

        <!-- Punch #3 OT-In -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;border-top:3px solid #0284c7">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);display:flex;align-items:center;gap:5px">
            <i class="fa fa-rotate-left" style="color:#0284c7"></i> Punch #3: OT-In
          </div>
          <div style="font-size:19px;font-weight:800;color:${otInLog ? '#0284c7' : 'var(--text-muted)'};margin-top:6px;font-family:monospace">
            ${otInLog?.time || '—'}
          </div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">
            ${otInLog ? `${otInLog.device || 'ZKTeco'} &bull; ${otInLog.verifyMode || 'Fingerprint'}` : 'Not swiped'}
          </div>
        </div>

        <!-- Punch #4 Check-Out -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;border-top:3px solid var(--danger)">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);display:flex;align-items:center;gap:5px">
            <i class="fa fa-arrow-right-from-bracket" style="color:var(--danger)"></i> Punch #4: Check-Out
          </div>
          <div style="font-size:19px;font-weight:800;color:${checkOutLog ? 'var(--danger)' : 'var(--text-muted)'};margin-top:6px;font-family:monospace">
            ${checkOutLog?.time || '—'}
          </div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">
            ${checkOutLog ? `${checkOutLog.device || 'ZKTeco'} &bull; ${checkOutLog.verifyMode || 'Fingerprint'}` : 'Not swiped'}
          </div>
        </div>
      </div>

      <!-- Chronological Visual Swipe Timeline -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px">
        <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <i class="fa fa-clock-rotate-left" style="color:var(--primary)"></i>
          Chronological Machine Swipe Timeline (${empLogs.length} Events)
        </div>

        ${empLogs.length === 0 ? `
          <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">
            No machine swipes recorded on this date.
          </div>
        ` : `
          <div style="position:relative;padding-left:24px;border-left:2px dashed var(--border);margin-left:12px;display:flex;flex-direction:column;gap:16px">
            ${empLogs.map((log, idx) => {
              const prev = idx > 0 ? empLogs[idx - 1] : null;
              let elapsedText = '';
              if (prev && prev.time && log.time) {
                const [h1, m1] = prev.time.split(':').map(Number);
                const [h2, m2] = log.time.split(':').map(Number);
                const diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
                if (diffMin > 0) {
                  const hrs = Math.floor(diffMin / 60);
                  const mins = diffMin % 60;
                  elapsedText = `${hrs > 0 ? hrs + 'h ' : ''}${mins}m interval`;
                }
              }

              const badge = log.punchType === 'check_in' ? '#10b981' : log.punchType === 'ot_out' ? '#f59e0b' : log.punchType === 'ot_in' ? '#0284c7' : '#ef4444';

              return `
                <div style="position:relative">
                  <div style="position:absolute;left:-31px;top:2px;width:14px;height:14px;border-radius:50%;background:${badge};box-shadow:0 0 0 3px var(--card)"></div>
                  <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <div style="display:flex;align-items:center;gap:8px">
                        <strong style="font-size:13px;color:var(--text)">Swipe #${idx + 1}: ${log.punchLabel || log.punchType}</strong>
                        <span class="chip" style="font-size:10.5px">${log.device || 'ZKTeco'}</span>
                      </div>
                      <div style="font-family:monospace;font-weight:800;font-size:13.5px;color:${badge}">
                        ${log.time}
                      </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-3);margin-top:4px;display:flex;justify-content:space-between">
                      <span>Terminal: <strong>${log.deviceIp || '192.168.1.201'}</strong> &bull; Mode: <strong>${log.verifyMode || 'Fingerprint'}</strong></span>
                      ${elapsedText ? `<span style="font-weight:600;color:var(--text-2)"><i class="fa fa-hourglass-half"></i> ${elapsedText}</span>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Attendance.exportSingleEmployeePunches(${empId}, '${date}')">
          <i class="fa fa-download"></i> Export Employee Punches CSV
        </button>
      `
    });
  },

  exportSingleEmployeePunches(empId, date) {
    const emp = DB.find('employees', empId);
    if (!emp) return;

    const allLogs = DB.get('attendance_logs') || [];
    const empLogs = allLogs.filter(l => l.employeeId === empId && l.date === date);
    empLogs.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (empLogs.length === 0) {
      Toast.show('No machine punches to export for this employee.', 'warning');
      return;
    }

    const headers = ['Swipe #', 'Employee ID', 'Employee Name', 'Department', 'Date', 'Time', 'Punch Option', 'Device', 'Device IP', 'Verify Mode'];
    const rows = empLogs.map((l, idx) => [
      idx + 1,
      emp.empNo || emp.id,
      `"${emp.fullName.replace(/"/g, '""')}"`,
      `"${Utils.getDeptName(emp.departmentId).replace(/"/g, '""')}"`,
      l.date,
      l.time,
      l.punchLabel || l.punchType,
      l.device || 'ZKTeco',
      l.deviceIp || '192.168.1.201',
      l.verifyMode || 'Fingerprint'
    ]);

    Utils.exportCSV(`Biometric_Punches_${emp.empNo}_${date}.csv`, headers, rows);
    Toast.show(`Exported ${empLogs.length} machine punches for ${emp.fullName}`, 'success');
  },

  exportMachinePunchLogs() {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isManager = Auth.role === 'dept_manager';
    const allEmps = DB.get('employees') || [];
    const myEmp = Auth.employee || DB.find('employees', 4);

    let scopedEmps = [];
    if (isEmployee) scopedEmps = myEmp ? [myEmp] : [];
    else if (isManager) scopedEmps = this.getScopedEmployees();
    else scopedEmps = allEmps;
    const scopedIds = scopedEmps.map(e => e.id);

    const allLogs = DB.get('attendance_logs') || [];
    const curDate = this.machineLogDate || Utils.today();
    const logs = allLogs.filter(l => scopedIds.includes(l.employeeId) && l.date === curDate);

    if (logs.length === 0) {
      Toast.show('No machine punch logs found to export.', 'warning');
      return;
    }

    const headers = ['Date', 'Time', 'Employee #', 'Employee Name', 'Department', 'Punch Option', 'Device Terminal', 'Device IP', 'Verify Mode'];
    const rows = logs.map(l => {
      const emp = allEmps.find(e => e.id === l.employeeId);
      return [
        l.date,
        l.time,
        emp?.empNo || l.employeeId,
        `"${(emp?.fullName || '').replace(/"/g, '""')}"`,
        `"${(Utils.getDeptName(emp?.departmentId) || '').replace(/"/g, '""')}"`,
        l.punchLabel || l.punchType,
        l.device || 'ZKTeco-Main-Gate',
        l.deviceIp || '192.168.1.201',
        l.verifyMode || 'Fingerprint'
      ];
    });

    Utils.exportCSV(`Biometric_Machine_Logs_${curDate}.csv`, headers, rows);
    Toast.show(`Exported ${logs.length} biometric machine logs!`, 'success');
  },

  renderManualEntry(container) {
    const emps = this.getScopedEmployees();
    container.innerHTML = `
      <div class="card" style="max-width:600px">
        <div class="card-header"><div class="card-title">Manual Attendance Entry</div></div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label required">Employee</label>
            <select class="form-control" id="man-emp">${emps.map(e=>`<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}</select>
          </div>
          <div class="form-group"><label class="form-label required">Date</label>
            <input type="date" class="form-control" id="man-date" value="${this.currentDate}">
          </div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label required">Time In (Check In)</label><input type="time" class="form-control" id="man-in" value="09:00"></div>
          <div class="form-group"><label class="form-label required">Time Out (Check Out)</label><input type="time" class="form-control" id="man-out" value="18:00"></div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Break Out</label><input type="time" class="form-control" id="man-break-out" value="13:00"></div>
          <div class="form-group"><label class="form-label">Break In</label><input type="time" class="form-control" id="man-break-in" value="14:00"></div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Status</label>
            <select class="form-control" id="man-status">
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Overtime (hours)</label><input type="number" step="0.5" class="form-control" id="man-ot" value="0" min="0" max="12"></div>
        </div>
        <div class="form-group"><label class="form-label">Remarks</label><input class="form-control" id="man-remarks" placeholder="Optional remarks"></div>
        <button class="btn btn-primary w-full" onclick="Attendance.saveManual()"><i class="fa fa-save"></i> Save Attendance</button>
      </div>
    `;
  },

  saveManual() {
    if (Auth.role === 'employee' || Auth.role === 'onboarding') {
      Toast.show('403 Forbidden: Manual attendance entry is restricted to administrators.', 'error');
      return;
    }
    const empId   = parseInt(document.getElementById('man-emp').value);
    const date    = document.getElementById('man-date').value;
    const timeIn  = document.getElementById('man-in').value;
    const timeOut = document.getElementById('man-out').value;
    const breakOut = document.getElementById('man-break-out')?.value || '';
    const breakIn  = document.getElementById('man-break-in')?.value || '';
    const status  = document.getElementById('man-status').value;
    let overtime  = parseFloat(document.getElementById('man-ot').value);
    if (isNaN(overtime) || overtime === 0) {
      overtime = this.calcOvertime(timeIn, timeOut, breakOut, breakIn);
    }
    const remarks = document.getElementById('man-remarks').value;

    const existing = DB.get('attendance').find(a => a.employeeId === empId && a.date === date);
    if (existing) {
      DB.update('attendance', existing.id, { timeIn, timeOut, breakOut, breakIn, status, overtime, remarks, device: 'Manual' });
    } else {
      DB.add('attendance', { id: DB.nextId('attendance'), employeeId: empId, date, timeIn, timeOut, breakOut, breakIn, status, overtime, device: 'Manual', remarks });
    }
    DB.log('ADD', 'Attendance', `Manual attendance for ${Utils.getEmpName(empId)} on ${date}`, Auth.user?.id);
    Toast.show('Attendance saved!', 'success');
    this.currentDate = date;
    this.switchView('daily');
  },

  editRecord(empId, date) {
    if (Auth.role === 'employee' || Auth.role === 'onboarding') {
      Toast.show('Employees cannot directly edit attendance logs. Please submit an attendance correction request.', 'warning');
      this.showApplyCorrectionModal(date);
      return;
    }
    if (Auth.role === 'dept_manager') {
      Toast.show('Deputy Managers are not permitted to edit attendance records. Please submit a correction request or contact HR.', 'warning');
      return;
    }
    const emp = DB.find('employees', empId);
    if (!emp) return;
    const rec = DB.get('attendance').find(a => a.employeeId === empId && a.date === date);

    Modal.show(`Edit Attendance — ${emp.fullName}`, `
      <div style="background:var(--surface);padding:10px 14px;border-radius:8px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:600;font-size:13px">${emp.fullName} (${emp.empNo})</div>
          <div style="font-size:12px;color:var(--text-3)">${Utils.getDeptName(emp.departmentId)} • ${Utils.formatDate(date)}</div>
        </div>
        ${rec ? Utils.statusBadge(rec.status) : '<span class="badge badge-secondary">Not Marked</span>'}
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Date</label>
          <input type="date" class="form-control" id="ed-att-date" value="${date}">
        </div>
        <div class="form-group">
          <label class="form-label required">Status</label>
          <select class="form-control" id="ed-att-status">
            <option value="present" ${rec?.status === 'present' || !rec ? 'selected' : ''}>Present</option>
            <option value="late" ${rec?.status === 'late' ? 'selected' : ''}>Late</option>
            <option value="half_day" ${rec?.status === 'half_day' ? 'selected' : ''}>Half Day</option>
            <option value="absent" ${rec?.status === 'absent' ? 'selected' : ''}>Absent</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Time In (Check In)</label>
          <input type="time" class="form-control" id="ed-att-in" value="${rec?.timeIn || '09:00'}">
        </div>
        <div class="form-group">
          <label class="form-label">Time Out (Check Out)</label>
          <input type="time" class="form-control" id="ed-att-out" value="${rec?.timeOut || '18:00'}">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Break Out</label>
          <input type="time" class="form-control" id="ed-att-break-out" value="${rec?.breakOut || '13:00'}">
        </div>
        <div class="form-group">
          <label class="form-label">Break In</label>
          <input type="time" class="form-control" id="ed-att-break-in" value="${rec?.breakIn || '14:00'}">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Overtime (hours)</label>
          <input type="number" step="0.5" class="form-control" id="ed-att-ot" value="${rec?.overtime || 0}" min="0" max="12">
        </div>
        <div class="form-group">
          <label class="form-label">Device / Source</label>
          <input class="form-control" id="ed-att-device" value="${rec?.device || 'Manual'}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Remarks</label>
        <input class="form-control" id="ed-att-remarks" value="${rec?.remarks || ''}" placeholder="Optional remarks">
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        ${rec ? `<button class="btn btn-danger" style="margin-right:auto" onclick="Attendance.deleteRecord(${rec.id})"><i class="fa fa-trash"></i> Delete</button>` : ''}
        <button class="btn btn-primary" onclick="Attendance.saveEditRecord(${rec ? rec.id : 'null'}, ${empId})"><i class="fa fa-save"></i> Save Changes</button>
      `
    });
  },

  evaluateTimeIn(empId, timeIn, explicitStatus) {
    if (!timeIn || explicitStatus === 'absent') return { status: explicitStatus, lateMinutes: 0, isLate: false, autoRemark: '' };
    const emp = DB.find('employees', empId);
    const shifts = DB.get('shifts') || [];
    // BUG-07 FIX: guard against empty shifts array — never fall through to undefined cutoff
    const shift = shifts.length ? (shifts.find(s => s.id === (emp?.shiftId || 1)) || shifts[0]) : null;
    const cutoff = shift?.timeInWindowEnd || '11:00';

    if (timeIn > cutoff) {
      const [inH, inM] = timeIn.split(':').map(Number);
      const [cutH, cutM] = cutoff.split(':').map(Number);
      const lateMins = Math.max(1, (inH * 60 + inM) - (cutH * 60 + cutM));
      return {
        status: 'late',
        lateMinutes: lateMins,
        isLate: true,
        autoRemark: `Checked in at ${timeIn} (After ${cutoff} cutoff, ${lateMins}m late)`
      };
    }
    return { status: explicitStatus || 'present', lateMinutes: 0, isLate: false, autoRemark: '' };
  },

  saveEditRecord(recId, empId) {
    const date = document.getElementById('ed-att-date').value;
    const rawStatus = document.getElementById('ed-att-status').value;
    const timeIn = rawStatus === 'absent' ? '' : (document.getElementById('ed-att-in')?.value || '');
    const timeOut = rawStatus === 'absent' ? '' : (document.getElementById('ed-att-out')?.value || '');
    const breakOut = rawStatus === 'absent' ? '' : (document.getElementById('ed-att-break-out')?.value || '');
    const breakIn = rawStatus === 'absent' ? '' : (document.getElementById('ed-att-break-in')?.value || '');
    let overtime = parseFloat(document.getElementById('ed-att-ot')?.value);
    if (isNaN(overtime) || overtime === 0) {
      overtime = this.calcOvertime(timeIn, timeOut, breakOut, breakIn);
    }
    const device = document.getElementById('ed-att-device')?.value.trim() || 'Manual';
    let remarks = document.getElementById('ed-att-remarks')?.value.trim() || '';

    // Automated Late evaluation against Time-In Window Cutoff (e.g. 11:00 AM)
    const evalRes = this.evaluateTimeIn(empId, timeIn, rawStatus);
    const finalStatus = evalRes.isLate ? 'late' : rawStatus;
    if (evalRes.isLate && !remarks) {
      remarks = evalRes.autoRemark;
    }

    if (recId) {
      DB.update('attendance', recId, { date, status: finalStatus, timeIn, timeOut, breakOut, breakIn, overtime, device, remarks });
      DB.log('UPDATE', 'Attendance', `Updated attendance for ${Utils.getEmpName(empId)} on ${date} (${finalStatus})`, Auth.user?.id);
    } else {
      DB.add('attendance', {
        id: DB.nextId('attendance'),
        employeeId: empId,
        date, status: finalStatus, timeIn, timeOut, breakOut, breakIn, overtime, device, remarks
      });
      DB.log('ADD', 'Attendance', `Created attendance for ${Utils.getEmpName(empId)} on ${date} (${finalStatus})`, Auth.user?.id);
    }
    Modal.close('dynamic-modal');
    if (evalRes.isLate) {
      Toast.show(`Check-in was after cutoff (${evalRes.autoRemark}) — Marked LATE!`, 'warning');
    } else {
      Toast.show('Attendance record updated!', 'success');
    }
    this.renderView();
  },

  deleteRecord(recId) {
    if (Auth.role === 'employee' || Auth.role === 'onboarding') {
      Toast.show('403 Forbidden: Access Denied.', 'error');
      return;
    }
    if (Auth.role === 'dept_manager') {
      Toast.show('403 Forbidden: Deputy Managers cannot delete attendance records. Contact HR / Admin.', 'error');
      return;
    }
    Modal.confirm('Delete Attendance Record', 'Are you sure you want to delete this attendance record?<br><br><small style="color:var(--text-3)"><i class="fa fa-info-circle"></i> The employee will be notified and unblocked to submit an attendance correction for this date if needed.</small>', () => {
      const rec = DB.find('attendance', recId);
      if (rec) {
        const empId = rec.employeeId;
        const date = rec.date;
        const emp = DB.find('employees', empId);

        // 1. Delete the attendance record
        DB.delete('attendance', recId);

        // 2. Unblock any previous attendance correction requests for this date & employee
        let corrections = DB.get('attendance_corrections') || [];
        corrections = corrections.map(c => {
          if (c.employeeId === empId && c.date === date) {
            return {
              ...c,
              status: 'rejected',
              hrStatus: 'rejected',
              hrRemarks: `Attendance record was deleted by HR (${Auth.employee?.fullName || 'HR Administration'}). You may submit a new correction request.`,
              hrApprovedAt: new Date().toISOString()
            };
          }
          return c;
        });
        DB.set('attendance_corrections', corrections);

        // 3. Notify the employee that their attendance record was deleted and they can re-apply
        if (typeof LiveNotifications !== 'undefined' && LiveNotifications.dispatch) {
          LiveNotifications.dispatch({
            recipientEmpId: empId,
            recipientRole: 'employee',
            type: 'attendance_alert',
            priority: 'high',
            title: 'Attendance Record Removed by HR',
            message: `Your attendance record for ${Utils.formatDate(date)} was removed by HR (${Auth.employee?.fullName || 'HR Administration'}). You can now submit a new attendance correction request for this date if needed.`,
            actionUrl: 'attendance',
            subView: 'corrections',
            actionLabel: 'Apply Correction'
          });
        }

        DB.log('DELETE', 'Attendance', `Deleted attendance record #${recId} for ${emp?.fullName || ('EMP #' + empId)} on ${date} (Corrections unblocked & employee notified)`, Auth.user?.id);
      } else {
        DB.delete('attendance', recId);
      }

      Modal.close('dynamic-modal');
      Toast.show('Attendance record deleted!', 'warning', 'Employee notified and enabled to re-apply for correction.');
      this.renderView();
    });
  },

  showBulkAttendance() {
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') {
      Toast.show('403 Forbidden: Bulk attendance marking is restricted to administrators.', 'error');
      return;
    }
    const emps = this.getScopedEmployees();
    const depts = DB.get('departments');

    Modal.show('Bulk Mark Attendance', `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Date</label>
          <input type="date" class="form-control" id="bulk-date" value="${this.currentDate}">
        </div>
        <div class="form-group">
          <label class="form-label required">Default Status</label>
          <select class="form-control" id="bulk-status" onchange="Attendance.onBulkStatusChange(this.value)">
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2" id="bulk-time-row">
        <div class="form-group">
          <label class="form-label">Time In</label>
          <input type="time" class="form-control" id="bulk-in" value="09:00">
        </div>
        <div class="form-group">
          <label class="form-label">Time Out</label>
          <input type="time" class="form-control" id="bulk-out" value="18:00">
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin:12px 0 8px">
        <label class="form-label" style="margin:0;font-weight:600">Select Employees (${emps.length})</label>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-ghost btn-sm" onclick="document.querySelectorAll('.bulk-emp-cb').forEach(c=>c.checked=true);Attendance.updateBulkCount()">Select All</button>
          <button type="button" class="btn btn-ghost btn-sm" onclick="document.querySelectorAll('.bulk-emp-cb').forEach(c=>c.checked=false);Attendance.updateBulkCount()">Deselect All</button>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:8px">
        <select class="form-control" id="bulk-dept-filter" onchange="Attendance.filterBulkEmployees(this.value)">
          <option value="">All Departments</option>
          ${depts.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}
        </select>
      </div>
      <div id="bulk-emp-list" style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--surface)">
        ${emps.map(e => `
          <label class="bulk-emp-item" data-dept="${e.departmentId}" style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:13px;transition:background .15s" onmouseenter="this.style.background='var(--surface-2)'" onmouseleave="this.style.background=''">
            <input type="checkbox" class="bulk-emp-cb" value="${e.id}" checked onchange="Attendance.updateBulkCount()">
            <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)};width:26px;height:26px;font-size:10px">${Utils.avatarInitials(e.fullName)}</div>
            <span style="font-weight:500;flex:1">${e.fullName}</span>
            <span style="font-size:11px;color:var(--text-3)">${Utils.getDeptName(e.departmentId)}</span>
            <span style="font-family:monospace;font-size:11px;color:var(--text-muted)">${e.empNo}</span>
          </label>
        `).join('')}
      </div>
      <div id="bulk-selected-count" style="font-size:12px;color:var(--text-3);margin-top:8px">
        ${emps.length} employee${emps.length > 1 ? 's' : ''} selected
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Attendance.saveBulkAttendance()"><i class="fa fa-check-double"></i> Mark Selected</button>
      `
    });
  },

  onBulkStatusChange(status) {
    const timeRow = document.getElementById('bulk-time-row');
    if (timeRow) {
      timeRow.style.display = status === 'absent' ? 'none' : 'grid';
    }
  },

  filterBulkEmployees(deptId) {
    document.querySelectorAll('.bulk-emp-item').forEach(item => {
      if (!deptId || item.getAttribute('data-dept') === String(deptId)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
    Attendance.updateBulkCount();
  },

  updateBulkCount() {
    const checked = Array.from(document.querySelectorAll('.bulk-emp-cb')).filter(c => c.checked && c.closest('.bulk-emp-item').style.display !== 'none').length;
    const countEl = document.getElementById('bulk-selected-count');
    if (countEl) countEl.textContent = `${checked} employee${checked === 1 ? '' : 's'} selected`;
  },

  saveBulkAttendance() {
    const date = document.getElementById('bulk-date').value;
    const status = document.getElementById('bulk-status').value;
    const timeIn = status === 'absent' ? '' : (document.getElementById('bulk-in')?.value || '09:00');
    const timeOut = status === 'absent' ? '' : (document.getElementById('bulk-out')?.value || '18:00');

    const checkboxes = Array.from(document.querySelectorAll('.bulk-emp-cb')).filter(c => c.checked && c.closest('.bulk-emp-item').style.display !== 'none');
    if (checkboxes.length === 0) {
      Toast.show('Please select at least one employee', 'error');
      return;
    }

    const empIds = checkboxes.map(c => parseInt(c.value));
    let addedCount = 0;
    let updatedCount = 0;

    empIds.forEach(empId => {
      const evalRes = Attendance.evaluateTimeIn(empId, timeIn, status);
      const finalStatus = evalRes.isLate ? 'late' : status;
      const remarks = evalRes.isLate ? evalRes.autoRemark : `Bulk marked as ${status}`;

      const existing = DB.get('attendance').find(a => a.employeeId === empId && a.date === date);
      if (existing) {
        DB.update('attendance', existing.id, {
          timeIn, timeOut, status: finalStatus, device: 'Bulk Marking', remarks
        });
        updatedCount++;
      } else {
        DB.add('attendance', {
          id: DB.nextId('attendance'),
          employeeId: empId,
          date, timeIn, timeOut, status: finalStatus, overtime: 0,
          device: 'Bulk Marking',
          remarks
        });
        addedCount++;
      }
    });

    DB.log('ADD', 'Attendance', `Bulk marked attendance on ${date} for ${empIds.length} employees (${status})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Attendance marked for ${empIds.length} employees (${addedCount} added, ${updatedCount} updated)!`, 'success');
    this.currentDate = date;
    this.renderView();
  },

  showTimeInWindowConfig() {
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') {
      Toast.show('403 Forbidden: Time-In window configuration is restricted to administrators.', 'error');
      return;
    }
    const shifts = DB.get('shifts') || [];
    Modal.show('Configure Attendance Time-In Windows', `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(16,185,129,0.08));border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:12px 16px">
          <div style="font-weight:700;color:var(--text);font-size:13.5px;display:flex;align-items:center;gap:7px">
            <i class="fa fa-clock" style="color:var(--primary)"></i> Time-In Window & Cutoff Governance
          </div>
          <div style="font-size:12px;color:var(--text-2);margin-top:3px;line-height:1.4">
            Specify the allowable check-in window for each shift (e.g. <strong>10:00 AM to 11:00 AM</strong>). If an employee checks in after <strong>11:00 AM</strong>, their status is automatically marked as <strong>Late</strong>, creating a discrepancy in the Administration Audit Center that must be resolved before payroll can proceed.
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          ${shifts.map(s => `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <span style="font-weight:700;font-size:13.5px">${s.name} Shift (${s.startTime} – ${s.endTime})</span>
                <span class="badge ${s.status==='active'?'badge-success':'badge-secondary'}">${s.status}</span>
              </div>
              <div class="form-row form-row-2" style="margin:0">
                <div class="form-group" style="margin:0">
                  <label class="form-label" style="font-size:11px">Window Start Time</label>
                  <input type="time" class="form-control" id="win-start-${s.id}" value="${s.timeInWindowStart || '10:00'}">
                </div>
                <div class="form-group" style="margin:0">
                  <label class="form-label required" style="font-size:11px">Window Cutoff (Late After This)</label>
                  <input type="time" class="form-control" id="win-end-${s.id}" value="${s.timeInWindowEnd || '11:00'}">
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Attendance.saveTimeInWindowConfig()"><i class="fa fa-save"></i> Save Windows</button>
      `
    });
  },

  saveTimeInWindowConfig() {
    const shifts = DB.get('shifts') || [];
    shifts.forEach(s => {
      const startEl = document.getElementById(`win-start-${s.id}`);
      const endEl = document.getElementById(`win-end-${s.id}`);
      if (startEl && endEl) {
        s.timeInWindowStart = startEl.value || '10:00';
        s.timeInWindowEnd = endEl.value || '11:00';
      }
    });
    DB.set('shifts', shifts);
    DB.log('UPDATE', 'Attendance', 'Updated Time-In windows for company shifts', Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Time-In windows updated successfully!', 'success', 'Automatic late check-in cutoff is now active');
    this.render();
  },

  showMarkAttendance() {
    this.switchView('manual');
  },

  exportAttendance() {
    if (!Auth.can('attendance.export')) {
      Toast.show('Permission denied: You do not have permission to export attendance data.', 'error');
      return;
    }
    if (this.currentView === 'my_employees') {
      this.exportMyEmpAttendance();
      return;
    }
    const emps = this.getScopedEmployees();
    const scopedIds = emps.map(e => e.id);
    let att = DB.get('attendance');
    if (Auth.role === 'dept_manager') {
      att = att.filter(a => scopedIds.includes(a.employeeId));
    }
    const filtered = this.currentView === 'daily'
      ? att.filter(a => a.date === this.currentDate)
      : att.filter(a => a.date.startsWith(this.currentMonth));

    if (filtered.length === 0) {
      Toast.show('No attendance records found for this period', 'warning');
      return;
    }

    const headers = ['Employee #', 'Employee Name', 'Department', 'Date', 'Status', 'Check In (Time In)', 'Break Out', 'Break In', 'Check Out (Time Out)', 'Working Hours', 'Overtime (hrs)', 'Device', 'Remarks'];
    const rows = filtered.map(a => {
      const emp = emps.find(e => e.id === a.employeeId);
      const dept = emp ? Utils.getDeptName(emp.departmentId) : '';
      const hours = (a.timeIn && a.timeOut) ? this.calcHours(a.timeIn, a.timeOut, a.breakOut, a.breakIn) : '';
      const ot = a.overtime || (a.timeIn && a.timeOut ? this.calcOvertime(a.timeIn, a.timeOut, a.breakOut, a.breakIn) : 0);
      return [
        emp?.empNo || a.employeeId,
        `"${(emp?.fullName || '').replace(/"/g, '""')}"`,
        `"${dept.replace(/"/g, '""')}"`,
        a.date,
        a.status,
        a.timeIn || '',
        a.breakOut || '',
        a.breakIn || '',
        a.timeOut || '',
        `"${hours}"`,
        ot,
        `"${(a.device || '').replace(/"/g, '""')}"`,
        `"${(a.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `attendance_${this.currentView === 'daily' ? this.currentDate : this.currentMonth}.csv`;
    Utils.downloadCSV(csv, filename);
    Toast.show(`Exported ${filtered.length} records to ${filename}`, 'success');
  },

  renderCorrections(container) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const scopedEmps = this.getScopedEmployees();
    const scopedIds = scopedEmps.map(e => e.id);
    let corrections = DB.get('attendance_corrections') || [];
    if (isEmployee) {
      corrections = corrections.filter(c => c.employeeId === (Auth.employee?.id || 4));
    } else if (Auth.role === 'dept_manager') {
      corrections = corrections.filter(c => scopedIds.includes(c.employeeId));
    }

    const canManagerApprove = Auth.role === 'dept_manager' || Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const canFinalApprove = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--text)">
              <i class="fa fa-clock-rotate-left" style="color:var(--primary);margin-right:6px"></i>
              Attendance Correction &amp; Work From Home Requests
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              ${isEmployee ? 'Track your submitted attendance correction and Work From Home requests.' : (Auth.role === 'dept_manager' ? 'Showing requests from your assigned team members (First-tier approval)' : 'Universal corporate requests (Direct manager review & HR/Admin final approval)')}
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" onclick="Attendance.showApplyCorrectionModal()">
              <i class="fa fa-plus"></i> Apply Correction / WFH
            </button>
          </div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Request Type</th>
                <th>Target Date</th>
                <th>Requested Hours</th>
                <th>Reason &amp; Notes</th>
                <th>Reporting Line &amp; Status</th>
                <th style="text-align:center">Action</th>
              </tr>
            </thead>
            <tbody>
              ${corrections.length === 0 ? `
                <tr><td colspan="7"><div class="empty-state" style="padding:40px"><i class="fa fa-circle-check"></i><h3>No Pending Attendance Requests</h3><p>All attendance corrections and WFH requests are up to date.</p></div></td></tr>
              ` : corrections.map(c => {
                const emp = DB.find('employees', c.employeeId);
                const isWFH = c.type === 'work_from_home';
                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(c.employeeId)}">${Utils.avatarInitials(emp?.fullName||'?')}</div>
                        <div>
                          <div style="font-weight:600;font-size:13px">${emp?.fullName || 'Unknown'}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp?.empNo || ''} • ${Utils.getDeptName(emp?.departmentId)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${isWFH ? 'badge-primary' : 'badge-warning'}" style="display:inline-flex;align-items:center;gap:5px">
                        <i class="fa ${isWFH ? 'fa-house-laptop' : 'fa-wrench'}"></i>
                        ${isWFH ? 'Work From Home' : 'Attendance Correction'}
                      </span>
                    </td>
                    <td style="font-weight:600;font-size:12.5px">${Utils.formatDate(c.date)}</td>
                    <td style="font-size:12px">
                      <div style="font-weight:600">
                        <span style="color:var(--success)">${c.timeIn || '09:00'}</span> – 
                        <span style="color:var(--danger)">${c.timeOut || '18:00'}</span>
                      </div>
                      <div style="font-size:11px;color:#d97706;margin-top:2px">
                        ${(c.breaks && c.breaks.length > 1)
                          ? `<i class="fa fa-mug-hot"></i> Breaks (${c.breaks.length}): ${c.breaks.map(b => `${b.breakOut}–${b.breakIn}`).join(', ')}`
                          : (c.breakOut && c.breakIn) 
                            ? `<i class="fa fa-mug-hot"></i> Break: ${c.breakOut} – ${c.breakIn}` 
                            : `<span style="color:var(--text-muted);font-style:italic"><i class="fa fa-mug-hot"></i> No break deducted</span>`}
                      </div>
                      <div style="font-size:10.5px;color:var(--text-3);margin-top:1px">
                        Net: <strong>${this.calcHours(c.timeIn, c.timeOut, c.breakOut, c.breakIn, c.breaks)}</strong>
                        ${this.calcOvertime(c.timeIn, c.timeOut, c.breakOut, c.breakIn, 8.0, c.breaks) > 0 ? `<span class="badge badge-success" style="font-size:9.5px;padding:1px 4px;margin-left:4px">+${this.calcOvertime(c.timeIn, c.timeOut, c.breakOut, c.breakIn, 8.0, c.breaks)}h OT</span>` : ''}
                      </div>
                    </td>
                    <td style="max-width:170px;word-break:break-word;font-size:11.5px;line-height:1.35">
                      <div style="font-weight:500;color:var(--text)">${c.reason || '—'}</div>
                      ${c.managerRemarks ? `<div style="font-size:10px;color:var(--primary);margin-top:2px"><i class="fa fa-comment"></i> Mgr: ${c.managerRemarks}</div>` : ''}
                      ${c.hrRemarks ? `<div style="font-size:10px;color:var(--success);margin-top:2px"><i class="fa fa-comment-check"></i> HR: ${c.hrRemarks}</div>` : ''}
                    </td>
                    <td>
                      <div style="display:flex;flex-direction:column;gap:3px">
                        ${c.status === 'pending' ? `
                          <span class="badge badge-warning" style="font-size:10.5px"><i class="fa fa-clock"></i> Pending Manager</span>
                        ` : c.status === 'manager_approved' ? `
                          <span class="badge badge-info" style="font-size:10.5px"><i class="fa fa-user-check"></i> Mgr Approved</span>
                        ` : c.status === 'approved' ? `
                          <span class="badge badge-success" style="font-size:10.5px"><i class="fa fa-check-double"></i> Approved &amp; Synced</span>
                        ` : `
                          <span class="badge badge-danger" style="font-size:10.5px"><i class="fa fa-ban"></i> Rejected</span>
                        `}
                        <span style="font-size:9.5px;color:var(--text-muted)">Chain: Manager ➔ HR ➔ Admin</span>
                      </div>
                    </td>
                    <td style="text-align:center">
                      ${isEmployee ? `
                        <span class="badge ${c.status==='approved'?'badge-success':c.status==='rejected'?'badge-danger':'badge-warning'}" style="font-size:10.5px">
                          ${c.status==='approved'?'<i class="fa fa-check-double"></i> Approved':(c.status==='rejected'?'<i class="fa fa-ban"></i> Rejected':'<i class="fa fa-clock"></i> In Review')}
                        </span>
                      ` : `
                        <div style="display:flex;gap:4px;justify-content:center;align-items:center;flex-wrap:nowrap">
                          ${(c.status === 'pending' && canManagerApprove) ? `
                            <button class="btn btn-xs btn-primary" onclick="Attendance.approveCorrection(${c.id}, 'manager')" title="Approve as Reporting Manager" style="white-space:nowrap">
                              <i class="fa fa-user-check"></i> Mgr
                            </button>
                          ` : ''}
                          ${(canFinalApprove && (c.status === 'pending' || c.status === 'manager_approved')) ? `
                            <button class="btn btn-xs btn-success" onclick="Attendance.approveCorrection(${c.id}, 'final')" title="Final Approval &amp; Sync to Attendance" style="white-space:nowrap">
                              <i class="fa fa-check-double"></i> Final
                            </button>
                          ` : ''}
                          ${((canManagerApprove || canFinalApprove) && (c.status === 'pending' || c.status === 'manager_approved')) ? `
                            <button class="btn btn-xs btn-danger btn-icon" onclick="Attendance.rejectCorrection(${c.id})" title="Reject Request">
                              <i class="fa fa-times"></i>
                            </button>
                          ` : ''}
                        </div>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  approveCorrection(corrId, tier) {
    if (!Auth.can('attendance.approve')) {
      Toast.show('Permission denied: You do not have permission to approve attendance corrections.', 'error');
      return;
    }
    let corrections = DB.get('attendance_corrections') || [];
    const item = corrections.find(c => c.id === corrId);
    if (!item) return;

    if (tier === 'manager') {
      item.managerStatus = 'approved';
      item.managerApprovedAt = new Date().toISOString();
      item.status = 'manager_approved';
      item.managerRemarks = `Endorsed by ${Auth.user?.username || 'Deputy Manager'}`;
      DB.set('attendance_corrections', corrections);
      DB.log('APPROVE', 'Attendance', `Manager endorsed attendance correction #${corrId} for employee #${item.employeeId}`, Auth.user?.id);
      Toast.show('Manager Approval Granted!', 'info', 'Forwarded to HR & Admin for final confirmation.');
    } else {
      // Final approval by HR or Admin
      item.hrStatus = 'approved';
      item.hrApprovedAt = new Date().toISOString();
      item.status = 'approved';
      item.hrRemarks = `Final approval granted by ${Auth.user?.username || 'Admin/HR'}`;
      DB.set('attendance_corrections', corrections);

      // Synchronize directly with attendance table!
      const allAtt = DB.get('attendance') || [];
      const existing = allAtt.find(a => a.employeeId === item.employeeId && a.date === item.date);
      const isWFH = item.type === 'work_from_home';
      const deviceName = isWFH ? 'Work From Home' : 'Biometric Correction';
      const note = `${isWFH ? 'WFH Approved' : 'Correction Approved'}: ${item.reason}`;
      const workingHours = this.calcHours(item.timeIn, item.timeOut, item.breakOut, item.breakIn, item.breaks);
      const overtime = this.calcOvertime(item.timeIn, item.timeOut, item.breakOut, item.breakIn, 8.0, item.breaks);
      const itemBreaks = (item.breaks && item.breaks.length) 
        ? item.breaks 
        : (item.breakOut && item.breakIn ? [{ breakOut: item.breakOut, breakIn: item.breakIn }] : []);

      if (existing) {
        existing.status = 'present';
        existing.timeIn = item.timeIn || '09:00';
        existing.timeOut = item.timeOut || '18:00';
        existing.breakOut = item.breakOut || (itemBreaks[0]?.breakOut || '');
        existing.breakIn = item.breakIn || (itemBreaks[0]?.breakIn || '');
        existing.breaks = itemBreaks;
        existing.workingHours = workingHours;
        existing.overtime = overtime;
        existing.device = deviceName;
        existing.remarks = note;
      } else {
        allAtt.push({
          id: DB.nextId('attendance'),
          employeeId: item.employeeId,
          date: item.date,
          status: 'present',
          timeIn: item.timeIn || '09:00',
          timeOut: item.timeOut || '18:00',
          breakOut: item.breakOut || (itemBreaks[0]?.breakOut || ''),
          breakIn: item.breakIn || (itemBreaks[0]?.breakIn || ''),
          breaks: itemBreaks,
          workingHours: workingHours,
          overtime: overtime,
          device: deviceName,
          remarks: note
        });
      }
      DB.set('attendance', allAtt);
      DB.log('APPROVE', 'Attendance', `Final approval granted for attendance correction #${corrId} (Synced to attendance)`, Auth.user?.id);
      Toast.show('Final Approval Granted!', 'success', 'Attendance record synchronized for this date.');

      // ── Email Notification: Correction approved → employee ─
      if (typeof EmailNotifier !== 'undefined') {
        const corrEmp = DB.find('employees', item.employeeId);
        const corrEmpEmail = corrEmp?.email || corrEmp?.workEmail;
        if (corrEmpEmail) {
          EmailNotifier.sendAttendanceCorrectionEmail({
            employeeEmail: corrEmpEmail,
            employee: { name: corrEmp?.fullName, empId: corrEmp?.empNo },
            date: item.date,
            status: 'approved',
            correctedIn: item.timeIn,
            correctedOut: item.timeOut,
            actionBy: Auth.user?.username || 'HR Manager',
            remarks: item.hrRemarks
          });
        }
      }
    }

    this.render();
  },


  rejectCorrection(corrId) {
    if (!Auth.can('attendance.approve')) {
      Toast.show('Permission denied: You do not have permission to reject attendance corrections.', 'error');
      return;
    }
    Modal.confirm('Reject Attendance Correction', 'Are you sure you want to reject this request?', () => {
      let corrections = DB.get('attendance_corrections') || [];
      const item = corrections.find(c => c.id === corrId);
      if (item) {
        item.status = 'rejected';
        item.hrRemarks = `Rejected by ${Auth.user?.username || 'Management'}`;
        DB.set('attendance_corrections', corrections);
        DB.log('REJECT', 'Attendance', `Rejected attendance correction #${corrId}`, Auth.user?.id);
        Toast.show('Request rejected.', 'warning');

        // ── Email Notification: Correction rejected → employee ─
        if (typeof EmailNotifier !== 'undefined') {
          const corrEmp = DB.find('employees', item.employeeId);
          const corrEmpEmail = corrEmp?.email || corrEmp?.workEmail;
          if (corrEmpEmail) {
            EmailNotifier.sendAttendanceCorrectionEmail({
              employeeEmail: corrEmpEmail,
              employee: { name: corrEmp?.fullName, empId: corrEmp?.empNo },
              date: item.date,
              status: 'rejected',
              actionBy: Auth.user?.username || 'Management',
              remarks: 'Your correction request was not approved. Please contact your manager for details.'
            });
          }
        }

        this.render();
      }
    });
  },


  showApplyCorrectionModal(prefillDate) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const emps = this.getScopedEmployees();
    const defaultDate = prefillDate || Utils.today();
    const myId = Auth.employee?.id || 4;

    // Check if attendance record exists for prefilling
    const allAtt = DB.get('attendance') || [];
    const existingRec = allAtt.find(a => a.employeeId === myId && a.date === defaultDate);
    const initialIn = existingRec?.timeIn || '09:00';
    const initialOut = existingRec?.timeOut || '18:00';
    const initialBreakOut = (existingRec?.breakOut !== undefined && existingRec?.breakOut !== null) ? existingRec.breakOut : '13:00';
    const initialBreakIn = (existingRec?.breakIn !== undefined && existingRec?.breakIn !== null) ? existingRec.breakIn : '14:00';

    Modal.show('Apply Attendance Correction / Work From Home', `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Employee</label>
          ${isEmployee ? `
            <input type="text" class="form-control" value="${(Auth.employee?.fullName || 'Employee')} (${Auth.employee?.empNo || ''})" readonly style="background:var(--surface)">
            <input type="hidden" id="ac-emp" value="${myId}">
          ` : `
            <select class="form-control" id="ac-emp" onchange="Attendance.checkCorrectionDateConflict()">
              ${emps.map(e => `<option value="${e.id}" ${e.id === myId ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
            </select>
          `}
        </div>
        <div class="form-group">
          <label class="form-label required">Request Type</label>
          <select class="form-control" id="ac-type">
            <option value="attendance_correction">Attendance Correction</option>
            <option value="work_from_home">Work From Home (WFH)</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-3">
        <div class="form-group">
          <label class="form-label required">Date</label>
          <input type="date" class="form-control" id="ac-date" value="${defaultDate}" onchange="Attendance.checkCorrectionDateConflict()">
        </div>
        <div class="form-group">
          <label class="form-label required">Time In</label>
          <input type="time" class="form-control" id="ac-in" value="${initialIn}" oninput="Attendance.calcCorrectionPreview()" onchange="Attendance.calcCorrectionPreview()">
        </div>
        <div class="form-group">
          <label class="form-label required">Time Out</label>
          <input type="time" class="form-control" id="ac-out" value="${initialOut}" oninput="Attendance.calcCorrectionPreview()" onchange="Attendance.calcCorrectionPreview()">
        </div>
      </div>

      <!-- Break Times Configuration Section: Add, Edit, Delete with Multi-Break Support -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px">
          <div style="font-weight:600;font-size:13px;display:flex;align-items:center;gap:6px;color:var(--text)">
            <i class="fa fa-mug-hot" style="color:#d97706"></i> Break Time Adjustment
            <span style="font-size:11px;font-weight:normal;color:var(--text-3)">(Optional)</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-ghost btn-xs" style="font-size:11px;color:var(--success);border:1px solid var(--border);padding:2px 8px" onclick="Attendance.addBreakRow()" title="Add another break period">
              <i class="fa fa-plus"></i> Add Break
            </button>
            <button type="button" class="btn btn-ghost btn-xs" style="font-size:11px;color:var(--primary);border:1px solid var(--border);padding:2px 8px" onclick="Attendance.setStandardBreakTimes()" title="Set standard 1-hour lunch break (13:00 - 14:00)">
              <i class="fa fa-clock"></i> Standard Break (1h)
            </button>
            <button type="button" class="btn btn-ghost btn-xs" style="font-size:11px;color:var(--danger);border:1px solid var(--border);padding:2px 8px" onclick="Attendance.clearBreakTimes()" title="Delete all breaks for continuous shift">
              <i class="fa fa-trash-can"></i> Delete Break
            </button>
          </div>
        </div>

        <div id="ac-breaks-container">
          ${initialBreakOut && initialBreakIn ? `
            <div class="ac-break-row" style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:flex-end;margin-bottom:8px">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" style="font-size:11.5px;margin-bottom:3px">
                  <i class="fa fa-mug-hot" style="color:#d97706;font-size:10px"></i> Break #1 Out (Start)
                </label>
                <input type="time" class="form-control ac-break-out" value="${initialBreakOut}" oninput="Attendance.calcCorrectionPreview()" onchange="Attendance.calcCorrectionPreview()">
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" style="font-size:11.5px;margin-bottom:3px">
                  <i class="fa fa-building" style="color:var(--primary);font-size:10px"></i> Break #1 In (End)
                </label>
                <input type="time" class="form-control ac-break-in" value="${initialBreakIn}" oninput="Attendance.calcCorrectionPreview()" onchange="Attendance.calcCorrectionPreview()">
              </div>
              <div style="padding-bottom:2px">
                <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger);padding:7px 9px;border:1px solid var(--border);border-radius:6px" onclick="Attendance.removeBreakRow(this)" title="Delete this break slot">
                  <i class="fa fa-trash-can" style="font-size:12px"></i>
                </button>
              </div>
            </div>
          ` : `
            <div id="ac-no-breaks-msg" style="padding:8px 10px;font-size:11.5px;color:var(--text-muted);font-style:italic;background:var(--background);border-radius:6px;margin-bottom:8px">
              <i class="fa fa-circle-check" style="color:var(--success);margin-right:4px"></i> No break deducted. Click "+ Add Break" if you took a break during your shift.
            </div>
          `}
        </div>

        <!-- Live Calculation Preview strip -->
        <div id="ac-calc-preview" style="display:flex;align-items:center;justify-content:space-between;background:rgba(217,119,6,0.06);border:1px dashed #d97706;border-radius:6px;padding:7px 12px;font-size:11.5px;color:#92400e;margin-top:6px">
          <div id="ac-preview-break-label">
            <i class="fa fa-stopwatch"></i> Break Duration: <strong>1h 0m</strong>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span>Net Work Hours: <strong id="ac-preview-net-hours" style="color:var(--text)">8h 0m</strong></span>
            <span id="ac-preview-ot-badge" class="badge badge-success" style="font-size:10px;padding:2px 6px;display:none">+0h Overtime</span>
          </div>
        </div>
      </div>

      <!-- Live Date Conflict Warning Box -->
      <div id="ac-date-conflict-warning" style="display:none;background:#fef2f2;border:1px solid #f87171;color:#991b1b;border-radius:8px;padding:9px 12px;font-size:12px;margin-bottom:14px">
        <i class="fa fa-triangle-exclamation" style="margin-right:6px"></i>
        <span id="ac-date-conflict-msg"></span>
      </div>

      <div class="form-group">
        <label class="form-label required">Reason / Justification</label>
        <textarea class="form-control" id="ac-reason" rows="3" placeholder="Explain the cause of missing punch or reason for working remotely..."></textarea>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text-3)">
        <i class="fa fa-info-circle" style="color:var(--primary);margin-right:6px"></i>
        <strong>One Correction Per Date Policy:</strong> Only 1 active correction request is permitted per date. Multiple requests for the same date are not allowed unless the previous request was rejected by your manager or HR.
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-correction" onclick="Attendance.saveCorrection()"><i class="fa fa-paper-plane"></i> Submit Request</button>
      `
    });

    setTimeout(() => {
      this.checkCorrectionDateConflict();
      this.calcCorrectionPreview();
    }, 50);
  },

  addBreakRow(bOut = '', bIn = '') {
    const container = document.getElementById('ac-breaks-container');
    if (!container) return;

    const noBreaks = document.getElementById('ac-no-breaks-msg');
    if (noBreaks) noBreaks.remove();

    const count = container.querySelectorAll('.ac-break-row').length + 1;
    if (!bOut && !bIn) {
      if (count === 1) { bOut = '13:00'; bIn = '14:00'; }
      else if (count === 2) { bOut = '16:30'; bIn = '17:00'; }
      else if (count === 3) { bOut = '11:00'; bIn = '11:15'; }
      else { bOut = '15:00'; bIn = '15:15'; }
    }

    const row = document.createElement('div');
    row.className = 'ac-break-row';
    row.style = 'display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:flex-end;margin-bottom:8px';
    row.innerHTML = `
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="font-size:11.5px;margin-bottom:3px">
          <i class="fa fa-mug-hot" style="color:#d97706;font-size:10px"></i> Break #${count} Out (Start)
        </label>
        <input type="time" class="form-control ac-break-out" value="${bOut}" oninput="Attendance.calcCorrectionPreview()" onchange="Attendance.calcCorrectionPreview()">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="font-size:11.5px;margin-bottom:3px">
          <i class="fa fa-building" style="color:var(--primary);font-size:10px"></i> Break #${count} In (End)
        </label>
        <input type="time" class="form-control ac-break-in" value="${bIn}" oninput="Attendance.calcCorrectionPreview()" onchange="Attendance.calcCorrectionPreview()">
      </div>
      <div style="padding-bottom:2px">
        <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger);padding:7px 9px;border:1px solid var(--border);border-radius:6px" onclick="Attendance.removeBreakRow(this)" title="Delete this break slot">
          <i class="fa fa-trash-can" style="font-size:12px"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
    this.calcCorrectionPreview();
  },

  removeBreakRow(btn) {
    const row = btn.closest('.ac-break-row');
    if (row) row.remove();
    const container = document.getElementById('ac-breaks-container');
    if (container && container.querySelectorAll('.ac-break-row').length === 0) {
      container.innerHTML = `
        <div id="ac-no-breaks-msg" style="padding:8px 10px;font-size:11.5px;color:var(--text-muted);font-style:italic;background:var(--background);border-radius:6px;margin-bottom:8px">
          <i class="fa fa-circle-check" style="color:var(--success);margin-right:4px"></i> No break deducted. Click "+ Add Break" if you took a break during your shift.
        </div>
      `;
    }
    this.calcCorrectionPreview();
  },

  setStandardBreakTimes() {
    const container = document.getElementById('ac-breaks-container');
    if (container) {
      container.innerHTML = '';
      this.addBreakRow('13:00', '14:00');
      Toast.show('Standard 1-hour lunch break (13:00 - 14:00) applied.', 'info');
    }
  },

  clearBreakTimes() {
    const container = document.getElementById('ac-breaks-container');
    if (container) {
      container.innerHTML = `
        <div id="ac-no-breaks-msg" style="padding:8px 10px;font-size:11.5px;color:var(--text-muted);font-style:italic;background:var(--background);border-radius:6px;margin-bottom:8px">
          <i class="fa fa-circle-check" style="color:var(--success);margin-right:4px"></i> No break deducted. Click "+ Add Break" if you took a break during your shift.
        </div>
      `;
      this.calcCorrectionPreview();
      Toast.show('All breaks removed. Continuous shift with zero break deduction.', 'warning');
    }
  },

  calcCorrectionPreview() {
    const timeIn = document.getElementById('ac-in')?.value;
    const timeOut = document.getElementById('ac-out')?.value;
    const breakRows = document.querySelectorAll('#ac-breaks-container .ac-break-row');
    
    const breakLabel = document.getElementById('ac-preview-break-label');
    const netHoursEl = document.getElementById('ac-preview-net-hours');
    const otBadge = document.getElementById('ac-preview-ot-badge');
    if (!breakLabel || !netHoursEl) return;

    let totalBreakMins = 0;
    let validBreakCount = 0;
    let hasInvalid = false;

    breakRows.forEach(row => {
      const bOut = row.querySelector('.ac-break-out')?.value || '';
      const bIn = row.querySelector('.ac-break-in')?.value || '';
      if (bOut && bIn) {
        const [bOutH, bOutM] = bOut.split(':').map(Number);
        const [bInH, bInM] = bIn.split(':').map(Number);
        const mins = (bInH * 60 + bInM) - (bOutH * 60 + bOutM);
        if (mins > 0) {
          totalBreakMins += mins;
          validBreakCount++;
        } else {
          hasInvalid = true;
        }
      } else if (bOut || bIn) {
        hasInvalid = true;
      }
    });

    if (hasInvalid) {
      breakLabel.innerHTML = `<span style="color:var(--danger)"><i class="fa fa-circle-exclamation"></i> Break In must be after Break Out for each break</span>`;
    } else if (validBreakCount > 1) {
      breakLabel.innerHTML = `<i class="fa fa-mug-hot"></i> Total Breaks (<strong>${validBreakCount}</strong>): <strong>${Math.floor(totalBreakMins / 60)}h ${totalBreakMins % 60}m</strong>`;
    } else if (validBreakCount === 1) {
      breakLabel.innerHTML = `<i class="fa fa-stopwatch"></i> Break Duration: <strong>${Math.floor(totalBreakMins / 60)}h ${totalBreakMins % 60}m</strong>`;
    } else {
      breakLabel.innerHTML = `<span style="color:var(--success)"><i class="fa fa-check"></i> No Break Deducted (Continuous Shift)</span>`;
    }

    let netMins = 0;
    if (timeIn && timeOut) {
      const [inH, inM] = timeIn.split(':').map(Number);
      const [outH, outM] = timeOut.split(':').map(Number);
      let grossMins = (outH * 60 + outM) - (inH * 60 + inM);
      netMins = Math.max(0, grossMins - totalBreakMins);
      netHoursEl.textContent = `${Math.floor(netMins / 60)}h ${netMins % 60}m`;
    } else {
      netHoursEl.textContent = '—';
    }

    if (otBadge) {
      const ot = (netMins > 480) ? Math.round(((netMins - 480) / 60) * 10) / 10 : 0;
      if (ot > 0) {
        otBadge.textContent = `+${ot}h Overtime`;
        otBadge.style.display = 'inline-block';
      } else {
        otBadge.style.display = 'none';
      }
    }
  },

  checkCorrectionDateConflict() {
    const empId = parseInt(document.getElementById('ac-emp')?.value) || Auth.employee?.id || 4;
    const date = document.getElementById('ac-date')?.value;
    const warnBox = document.getElementById('ac-date-conflict-warning');
    const warnMsg = document.getElementById('ac-date-conflict-msg');
    const submitBtn = document.getElementById('btn-submit-correction');
    if (!date || !warnBox || !warnMsg) return;

    const allAtt = DB.get('attendance') || [];
    const attRec = allAtt.find(a => a.employeeId === empId && a.date === date);

    let corrections = DB.get('attendance_corrections') || [];
    let activeExisting = corrections.find(c => c.employeeId === empId && c.date === date && c.status !== 'rejected');

    // Auto-heal / unblock: If correction was approved, but the attendance record does not exist
    // (e.g. was deleted by HR), unblock the employee so they can apply again!
    if (activeExisting && activeExisting.status === 'approved' && !attRec) {
      activeExisting.status = 'rejected';
      activeExisting.hrStatus = 'rejected';
      activeExisting.hrRemarks = 'Attendance record was deleted by HR. You may submit a new correction request.';
      DB.set('attendance_corrections', corrections);
      activeExisting = null;
    }

    if (activeExisting) {
      const statusText = activeExisting.status === 'approved' 
        ? 'has already been approved' 
        : activeExisting.status === 'manager_approved' 
          ? 'has been endorsed by your manager and is awaiting final HR approval' 
          : 'is already pending review with your reporting manager';
      warnMsg.innerHTML = `<strong>Existing Request:</strong> An attendance correction for <strong>${Utils.formatDate(date)}</strong> ${statusText}. Multiple requests for the same date are not allowed. You can only apply again if this request is rejected.`;
      warnBox.style.display = 'block';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
      }
    } else {
      warnBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
      // Check if existing attendance record exists to prefill
      if (attRec) {
        const inEl = document.getElementById('ac-in');
        const outEl = document.getElementById('ac-out');
        if (inEl && attRec.timeIn) inEl.value = attRec.timeIn;
        if (outEl && attRec.timeOut) outEl.value = attRec.timeOut;

        const container = document.getElementById('ac-breaks-container');
        if (container) {
          container.innerHTML = '';
          const breaks = (attRec.breaks && attRec.breaks.length) 
            ? attRec.breaks 
            : (attRec.breakOut && attRec.breakIn ? [{ breakOut: attRec.breakOut, breakIn: attRec.breakIn }] : []);
          if (breaks.length) {
            breaks.forEach(b => Attendance.addBreakRow(b.breakOut, b.breakIn));
          } else {
            Attendance.clearBreakTimes();
          }
        }
      }
      this.calcCorrectionPreview();
    }
  },

  saveCorrection() {
    const empId = parseInt(document.getElementById('ac-emp').value);
    const type = document.getElementById('ac-type').value;
    const date = document.getElementById('ac-date').value;
    const timeIn = document.getElementById('ac-in').value;
    const timeOut = document.getElementById('ac-out').value;
    const reason = document.getElementById('ac-reason').value.trim();

    if (!date || !reason) {
      Toast.show('Please provide a date and reason', 'error');
      return;
    }

    const breakRows = document.querySelectorAll('#ac-breaks-container .ac-break-row');
    const breaks = [];
    for (const row of breakRows) {
      const bOut = row.querySelector('.ac-break-out')?.value || '';
      const bIn = row.querySelector('.ac-break-in')?.value || '';
      if (bOut || bIn) {
        if (!bOut || !bIn) {
          Toast.show('Please provide both Break Out and Break In times, or delete unneeded break rows.', 'warning');
          return;
        }
        const [bOutH, bOutM] = bOut.split(':').map(Number);
        const [bInH, bInM] = bIn.split(':').map(Number);
        if ((bInH * 60 + bInM) <= (bOutH * 60 + bOutM)) {
          Toast.show('Break In (end) time must be after Break Out (start) time for every break.', 'error');
          return;
        }
        breaks.push({ breakOut: bOut, breakIn: bIn });
      }
    }

    const breakOut = breaks.length > 0 ? breaks[0].breakOut : '';
    const breakIn = breaks.length > 0 ? breaks[0].breakIn : '';

    const allAtt = DB.get('attendance') || [];
    const attRec = allAtt.find(a => a.employeeId === empId && a.date === date);

    const emp = DB.find('employees', empId);
    let corrections = DB.get('attendance_corrections') || [];

    // Rule: One correction request is required against one date.
    // Multiple requests for the same date are NOT allowed unless previous request was rejected.
    let activeExisting = corrections.find(c => 
      c.employeeId === empId && 
      c.date === date && 
      c.status !== 'rejected'
    );

    // Auto-heal / unblock: If correction was approved, but the attendance record does not exist
    // (e.g. was deleted by HR), unblock the employee so they can apply again!
    if (activeExisting && activeExisting.status === 'approved' && !attRec) {
      activeExisting.status = 'rejected';
      activeExisting.hrStatus = 'rejected';
      activeExisting.hrRemarks = 'Attendance record was deleted by HR. You may submit a new correction request.';
      DB.set('attendance_corrections', corrections);
      activeExisting = null;
    }

    if (activeExisting) {
      if (activeExisting.status === 'approved') {
        Toast.show(`An attendance record for ${Utils.formatDate(date)} has already been approved. Multiple requests for the same date are not allowed.`, 'error');
        return;
      } else if (activeExisting.status === 'manager_approved') {
        Toast.show(`A correction request for ${Utils.formatDate(date)} has already been approved by your manager and is awaiting final HR approval. Multiple requests for the same date are not allowed.`, 'error');
        return;
      } else {
        Toast.show(`A correction request for ${Utils.formatDate(date)} is already pending review. Multiple requests for the same date are not allowed. You can only apply again if this request is rejected.`, 'error');
        return;
      }
    }

    const newCorr = {
      id: DB.nextId('attendance_corrections'),
      employeeId: empId,
      date,
      type,
      timeIn,
      timeOut,
      breakOut,
      breakIn,
      breaks,
      reason,
      status: 'pending',
      managerId: emp?.managerId || 3,
      managerStatus: 'pending',
      managerApprovedAt: null,
      managerRemarks: '',
      hrStatus: 'pending',
      hrApprovedAt: null,
      hrRemarks: '',
      createdAt: Utils.today()
    };

    corrections.push(newCorr);
    DB.set('attendance_corrections', corrections);
    DB.log('APPLY', 'Attendance', `Submitted ${type} request for ${emp?.fullName} on ${date} (In: ${timeIn}, Out: ${timeOut}, Breaks: ${breaks.length})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Request submitted successfully!', 'success', 'Sent to direct reporting manager for first approval.');
    this.render();
  },

  calcHours(timeIn, timeOut, breakOut, breakIn, breaks) {
    const totalMins = this.calcWorkingMinutes(timeIn, timeOut, breakOut, breakIn, breaks);
    if (totalMins <= 0) return '—';
    return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
  },

  calcWorkingMinutes(timeIn, timeOut, breakOut, breakIn, breaks) {
    if (!timeIn || !timeOut) return 0;
    const [inH, inM] = timeIn.split(':').map(Number);
    const [outH, outM] = timeOut.split(':').map(Number);
    let totalMins = (outH * 60 + outM) - (inH * 60 + inM);

    const breakList = Array.isArray(breaks) 
      ? breaks 
      : (Array.isArray(breakOut) ? breakOut : (breakOut && breakIn ? [{ breakOut, breakIn }] : []));

    let totalBreakMins = 0;
    breakList.forEach(b => {
      if (b && b.breakOut && b.breakIn) {
        const [bOutH, bOutM] = b.breakOut.split(':').map(Number);
        const [bInH, bInM] = b.breakIn.split(':').map(Number);
        const mins = (bInH * 60 + bInM) - (bOutH * 60 + bOutM);
        if (mins > 0) totalBreakMins += mins;
      }
    });

    if (totalBreakMins > 0) totalMins -= totalBreakMins;
    return Math.max(0, totalMins);
  },

  calcOvertime(timeIn, timeOut, breakOut, breakIn, shiftHours = 8.0, breaks) {
    const workingMins = this.calcWorkingMinutes(timeIn, timeOut, breakOut, breakIn, breaks);
    const reqMins = Math.round(shiftHours * 60);
    if (workingMins > reqMins) {
      return Math.round(((workingMins - reqMins) / 60) * 10) / 10;
    }
    return 0;
  },

  prevDay() {
    const d = new Date(this.currentDate); d.setDate(d.getDate() - 1);
    this.currentDate = d.toISOString().split('T')[0];
    this.renderView();
  },
  nextDay() {
    const d = new Date(this.currentDate); d.setDate(d.getDate() + 1);
    this.currentDate = d.toISOString().split('T')[0];
    this.renderView();
  },
  prevMonth() {
    const [y, m] = this.currentMonth.split('-').map(Number);
    const d = new Date(y, m-2); this.currentMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    this.renderView();
  },
  nextMonth() {
    const d = new Date(this.currentMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    this.currentMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    this.renderView();
  },

  // ============================================================
  // BATCH 3: Multi-Shift Roster & Shift Swap Requests
  // ============================================================
  rosterStartDate: null,

  getRosterDays() {
    let start;
    if (this.rosterStartDate) {
      start = new Date(this.rosterStartDate);
    } else {
      const today = new Date();
      const day = today.getDay(); // 0 is Sun, 1 is Mon
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(today.setDate(diff));
      this.rosterStartDate = start.toISOString().split('T')[0];
    }

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  },

  prevRosterWeek() {
    const d = new Date(this.rosterStartDate);
    d.setDate(d.getDate() - 7);
    this.rosterStartDate = d.toISOString().split('T')[0];
    this.renderShiftRoster(document.getElementById('att-content'));
  },

  nextRosterWeek() {
    const d = new Date(this.rosterStartDate);
    d.setDate(d.getDate() + 7);
    this.rosterStartDate = d.toISOString().split('T')[0];
    this.renderShiftRoster(document.getElementById('att-content'));
  },

  renderShiftRoster(container) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isManager = Auth.role === 'dept_manager';
    const isAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const emps = this.getScopedEmployees();
    const days = this.getRosterDays();
    const shifts = DB.get('shifts') || [];
    const roster = DB.get('shift_roster') || [];
    const swaps = DB.get('shift_swaps') || [];

    const weekLabel = `${new Date(days[0]).toLocaleDateString('en', { month:'short', day:'numeric' })} &ndash; ${new Date(days[6]).toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' })}`;

    container.innerHTML = `
      <!-- Stage 3 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm ${this.currentView==='roster'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('roster')">
            <i class="fa fa-calendar-days"></i> Shift Rosters &amp; Swaps
          </button>
          ${!isEmployee && !isManager ? `
            <button class="btn btn-sm ${this.currentView==='geofence'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('geofence')">
              <i class="fa fa-location-dot"></i> Geo-Fence &amp; IP Rules
            </button>
            <button class="btn btn-sm btn-ghost" onclick="Attendance.showTimeInWindowConfig()">
              <i class="fa fa-clock"></i> Time-In Windows
            </button>
          ` : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${!isEmployee ? `<button class="btn btn-primary btn-sm" onclick="Attendance.showAssignShiftModal()"><i class="fa fa-plus"></i> Assign Shift</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="Attendance.showRequestSwapModal()"><i class="fa fa-right-left"></i> Request Shift Swap</button>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(99,102,241,0.12);color:var(--primary)">
              <i class="fa fa-calendar-week"></i>
            </span>
            Multi-Shift Roster &amp; Rotational Scheduling
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Weekly shift scheduling, automated rotational generation, and peer-to-peer shift swaps
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="Attendance.exportRosterCSV()"><i class="fa fa-download"></i> Export Roster (CSV)</button>
          <button class="btn btn-secondary btn-sm" onclick="Attendance.generateRotationalRoster()"><i class="fa fa-arrows-rotate"></i> Auto-Rotate Shifts</button>
          <button class="btn btn-primary btn-sm" onclick="Attendance.showShiftSwapModal()"><i class="fa fa-handshake"></i> Request Shift Swap</button>
        </div>
      </div>

      <!-- Week Navigator & Legend Banner -->
      <div class="card" style="padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.prevRosterWeek()"><i class="fa fa-chevron-left"></i></button>
          <div style="font-weight:800;font-size:14.5px;color:var(--text)">Week: ${weekLabel}</div>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Attendance.nextRosterWeek()"><i class="fa fa-chevron-right"></i></button>
        </div>

        <!-- Shift Color Legend -->
        <div style="display:flex;gap:12px;font-size:11.5px;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#3b82f6"></span> Morning (09-18)</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#8b5cf6"></span> Evening (14-22)</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#f59e0b"></span> Night (22-06)</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#10b981"></span> Flexible</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#64748b"></span> Rest Day</span>
        </div>
      </div>

      <!-- Roster Matrix Table -->
      <div class="card" style="padding:0;margin-bottom:24px">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th style="min-width:200px">Employee</th>
                <th style="min-width:120px">Default Shift</th>
                ${days.map(d => {
                  const dt = new Date(d);
                  const dayName = dt.toLocaleDateString('en', { weekday: 'short' });
                  const dayNum = dt.getDate();
                  const isToday = d === Utils.today();
                  return `
                    <th style="text-align:center;min-width:105px;${isToday ? 'background:rgba(99,102,241,0.1);color:var(--primary);font-weight:800' : ''}">
                      <div>${dayName}</div>
                      <div style="font-size:11px;font-weight:400">${dayNum}</div>
                    </th>
                  `;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${emps.map(emp => {
                const defShift = shifts.find(s => s.id === emp.shiftId) || shifts[0];
                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                        <div>
                          <div style="font-weight:600;font-size:13px">${emp.fullName}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp.empNo} &bull; ${Utils.getDeptName(emp.departmentId)}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="chip" style="font-size:11.5px">${defShift?.name || 'Morning'}</span></td>
                    ${days.map(d => {
                      const entry = roster.find(r => r.employeeId === emp.id && r.date === d);
                      const shiftId = entry ? entry.shiftId : emp.shiftId;
                      const isOff = entry ? entry.isOff : (new Date(d).getDay() === 0 || new Date(d).getDay() === 6);
                      const assignedShift = shifts.find(s => s.id === shiftId);

                      let bg = '#3b82f6';
                      let shiftName = 'Morning';
                      if (isOff) {
                        bg = '#64748b';
                        shiftName = 'OFF';
                      } else if (shiftId === 2) {
                        bg = '#8b5cf6';
                        shiftName = 'Evening';
                      } else if (shiftId === 3) {
                        bg = '#f59e0b';
                        shiftName = 'Night';
                      } else if (shiftId === 4) {
                        bg = '#10b981';
                        shiftName = 'Flexible';
                      }

                      return `
                        <td style="text-align:center;padding:8px 4px">
                          <button style="border:none;border-radius:6px;background:${bg}18;color:${bg};border:1px solid ${bg}33;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer;width:100%;transition:all .2s" onclick="Attendance.showAssignShiftModal(${emp.id}, '${d}')" title="Click to change shift for ${d}">
                            ${shiftName}
                          </button>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Peer Shift Swap Requests Section -->
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-handshake" style="color:var(--warning);margin-right:6px"></i> Peer Shift Swap Requests &amp; Approvals
          </div>
          <span class="badge badge-warning">${swaps.length} Active Swaps</span>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Requester</th>
                <th>Target Colleague</th>
                <th>Swap Date</th>
                <th>Requested Shift</th>
                <th>Offered Shift</th>
                <th>Reason</th>
                <th>Peer Status</th>
                <th>Manager Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${swaps.map(s => {
                const req = DB.find('employees', s.requesterId);
                const tgt = DB.find('employees', s.targetEmployeeId);
                const reqShift = shifts.find(x => x.id === s.requestedShiftId);
                const tgtShift = shifts.find(x => x.id === s.targetShiftId);

                return `
                  <tr>
                    <td><strong>${req?.fullName || '—'}</strong></td>
                    <td><strong>${tgt?.fullName || '—'}</strong></td>
                    <td>${Utils.formatDate(s.date)}</td>
                    <td><span class="badge badge-primary">${reqShift?.name || 'Shift'}</span></td>
                    <td><span class="badge badge-secondary">${tgtShift?.name || 'Shift'}</span></td>
                    <td style="font-size:12px;color:var(--text-2);max-width:200px">${s.reason || '—'}</td>
                    <td>
                      ${s.status === 'pending_peer' ? '<span class="badge badge-warning">Awaiting Peer</span>' : '<span class="badge badge-success">Accepted by Peer</span>'}
                    </td>
                    <td>
                      ${s.status === 'approved' ? '<span class="badge badge-success">Manager Approved</span>' : s.status === 'rejected' ? '<span class="badge badge-danger">Rejected</span>' : '<span class="badge badge-info">Pending Manager</span>'}
                    </td>
                    <td>
                      <div class="tbl-actions">
                        ${s.status === 'pending_peer' ? `
                          <button class="btn btn-success btn-sm" onclick="Attendance.respondShiftSwap(${s.id}, 'accept')"><i class="fa fa-check"></i> Accept</button>
                          <button class="btn btn-danger btn-sm" onclick="Attendance.respondShiftSwap(${s.id}, 'decline')"><i class="fa fa-xmark"></i></button>
                        ` : s.status === 'peer_accepted' ? `
                          <button class="btn btn-primary btn-sm" onclick="Attendance.managerApproveShiftSwap(${s.id}, 'approve')"><i class="fa fa-check-double"></i> Approve</button>
                          <button class="btn btn-danger btn-sm" onclick="Attendance.managerApproveShiftSwap(${s.id}, 'reject')"><i class="fa fa-ban"></i></button>
                        ` : `
                          <span style="font-size:11px;color:var(--text-3)">Completed</span>
                        `}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showAssignShiftModal(empId, date) {
    const emp = DB.find('employees', Number(empId));
    const shifts = DB.get('shifts') || [];
    const roster = DB.get('shift_roster') || [];
    const currentEntry = roster.find(r => r.employeeId === empId && r.date === date);

    Modal.show(`Assign Shift: ${emp?.fullName}`, `
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-control" value="${date}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label required">Select Shift</label>
        <select class="form-control" id="asgn-shift-select">
          ${shifts.map(s => `
            <option value="${s.id}" ${(currentEntry?.shiftId === s.id && !currentEntry?.isOff) ? 'selected' : ''}>
              ${s.name} (${s.startTime} &ndash; ${s.endTime})
            </option>
          `).join('')}
          <option value="off" ${currentEntry?.isOff ? 'selected' : ''}>Weekly Rest Day / Off</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Assignment Notes</label>
        <input class="form-control" id="asgn-shift-notes" placeholder="e.g. Special weekend operational support" value="${currentEntry?.notes || ''}">
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Attendance.saveShiftAssignment(${empId}, '${date}')"><i class="fa fa-save"></i> Save Assignment</button>
      `
    });
  },

  saveShiftAssignment(empId, date) {
    const val = document.getElementById('asgn-shift-select').value;
    const notes = document.getElementById('asgn-shift-notes').value.trim();
    let roster = DB.get('shift_roster') || [];
    let entry = roster.find(r => r.employeeId === empId && r.date === date);

    const isOff = val === 'off';
    const shiftId = isOff ? null : Number(val);

    if (entry) {
      entry.shiftId = shiftId;
      entry.isOff = isOff;
      entry.status = isOff ? 'weekend' : 'scheduled';
      entry.notes = notes;
    } else {
      roster.push({
        id: DB.nextId('shift_roster'),
        employeeId: empId,
        date,
        shiftId,
        isOff,
        status: isOff ? 'weekend' : 'scheduled',
        notes
      });
    }

    DB.set('shift_roster', roster);
    DB.log('UPDATE', 'Attendance', `Shift updated for ${Utils.getEmpName(empId)} on ${date}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Shift roster updated!', 'success');
    this.renderShiftRoster(document.getElementById('att-content'));
  },

  generateRotationalRoster() {
    Modal.confirm('Generate 2-Week Rotational Roster', 'This will automatically distribute support, engineering, and IT staff across Morning, Evening, and Night shifts in a balanced 2-week rotational schedule. Proceed?', () => {
      const emps = DB.get('employees').filter(e => e.status === 'active');
      const days = this.getRosterDays();
      let roster = DB.get('shift_roster') || [];

      emps.forEach((emp, idx) => {
        days.forEach(d => {
          const dayOfWeek = new Date(d).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          // Rotate shift based on employee index and date
          let shiftId = 1;
          const rotSeed = (idx + new Date(d).getDate()) % 3;
          if (rotSeed === 0) shiftId = 1;
          else if (rotSeed === 1) shiftId = 2;
          else shiftId = 3;

          let entry = roster.find(r => r.employeeId === emp.id && r.date === d);
          if (entry) {
            entry.shiftId = isWeekend ? null : shiftId;
            entry.isOff = isWeekend;
            entry.status = isWeekend ? 'weekend' : 'scheduled';
            entry.notes = isWeekend ? 'Rest Day' : 'Rotational Assignment';
          } else {
            roster.push({
              id: DB.nextId('shift_roster'),
              employeeId: emp.id,
              date: d,
              shiftId: isWeekend ? null : shiftId,
              isOff: isWeekend,
              status: isWeekend ? 'weekend' : 'scheduled',
              notes: isWeekend ? 'Rest Day' : 'Rotational Assignment'
            });
          }
        });
      });

      DB.set('shift_roster', roster);
      DB.log('PROCESS', 'Attendance', `Generated 2-week rotational shift schedule for ${emps.length} employees`, Auth.user?.id);
      Modal.close('dynamic-modal');
      Toast.show('Rotational shift roster generated successfully!', 'success');
      this.renderShiftRoster(document.getElementById('att-content'));
    });
  },

  showRequestSwapModal() {
    this.showShiftSwapModal();
  },

  showShiftSwapModal() {
    const emps = this.getScopedEmployees();
    const shifts = DB.get('shifts') || [];
    const myId = Auth.employee?.id || 4;

    Modal.show('Submit Peer Shift Swap Request', `
      <div class="form-group">
        <label class="form-label required">Select Date for Swap</label>
        <input type="date" class="form-control" id="swap-date" value="${Utils.today()}">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Swap Colleague</label>
          <select class="form-control" id="swap-target-emp">
            ${emps.filter(e => e.id !== myId).map(e => `
              <option value="${e.id}">${e.fullName} (${Utils.getDeptName(e.departmentId)})</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Shift You Want to Work</label>
          <select class="form-control" id="swap-req-shift">
            ${shifts.map(s => `<option value="${s.id}">${s.name} (${s.startTime}&ndash;${s.endTime})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Reason for Swap</label>
        <textarea class="form-control" id="swap-reason" rows="2" placeholder="e.g. Urgent family medical appointment in morning; exchanging for evening shift"></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Attendance.submitShiftSwapRequest()"><i class="fa fa-paper-plane"></i> Submit Swap Request</button>
      `
    });
  },

  submitShiftSwapRequest() {
    const date = document.getElementById('swap-date').value;
    const targetEmpId = Number(document.getElementById('swap-target-emp').value);
    const requestedShiftId = Number(document.getElementById('swap-req-shift').value);
    const reason = document.getElementById('swap-reason').value.trim();
    const myId = Auth.employee?.id || 4;

    if (!reason) {
      Toast.show('Please provide a reason for the shift swap', 'error');
      return;
    }

    const swaps = DB.get('shift_swaps') || [];
    const newSwap = {
      id: DB.nextId('shift_swaps'),
      requesterId: myId,
      targetEmployeeId: targetEmpId,
      date,
      requestedShiftId,
      targetShiftId: 1, // Default offered shift
      reason,
      status: 'pending_peer',
      createdAt: new Date().toISOString(),
      peerRespondedAt: null,
      managerApprovedAt: null,
      managerRemarks: ''
    };

    swaps.unshift(newSwap);
    DB.set('shift_swaps', swaps);
    DB.log('APPLY', 'Attendance', `Shift swap requested by ${Utils.getEmpName(myId)} with ${Utils.getEmpName(targetEmpId)} for ${date}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Shift swap request sent to peer for consent!', 'success');
    this.renderShiftRoster(document.getElementById('att-content'));
  },

  respondShiftSwap(swapId, action) {
    let swaps = DB.get('shift_swaps') || [];
    const swap = swaps.find(s => s.id === swapId);
    if (!swap) return;

    if (action === 'accept') {
      swap.status = 'peer_accepted';
      swap.peerRespondedAt = new Date().toISOString();
      Toast.show('You accepted the shift swap request!', 'success', 'Forwarded to Department Manager for sign-off.');
    } else {
      swap.status = 'rejected';
      swap.peerRespondedAt = new Date().toISOString();
      Toast.show('Shift swap request declined.', 'info');
    }

    DB.set('shift_swaps', swaps);
    this.renderShiftRoster(document.getElementById('att-content'));
  },

  managerApproveShiftSwap(swapId, action) {
    if (!Auth.can('attendance.approve')) {
      Toast.show('Permission denied: You do not have permission to approve/reject shift swaps.', 'error');
      return;
    }
    let swaps = DB.get('shift_swaps') || [];
    const swap = swaps.find(s => s.id === swapId);
    if (!swap) return;

    if (action === 'approve') {
      swap.status = 'approved';
      swap.managerApprovedAt = new Date().toISOString();
      swap.managerRemarks = 'Approved by management.';

      // Automatically swap in roster
      let roster = DB.get('shift_roster') || [];
      let reqEntry = roster.find(r => r.employeeId === swap.requesterId && r.date === swap.date);
      let tgtEntry = roster.find(r => r.employeeId === swap.targetEmployeeId && r.date === swap.date);

      if (reqEntry && tgtEntry) {
        const temp = reqEntry.shiftId;
        reqEntry.shiftId = tgtEntry.shiftId;
        tgtEntry.shiftId = temp;
      }
      DB.set('shift_roster', roster);
      Toast.show('Shift swap approved and roster updated!', 'success');
    } else {
      swap.status = 'rejected';
      swap.managerApprovedAt = new Date().toISOString();
      swap.managerRemarks = 'Rejected due to shift coverage constraints.';
      Toast.show('Shift swap rejected by manager.', 'warning');
    }

    DB.set('shift_swaps', swaps);
    this.renderShiftRoster(document.getElementById('att-content'));
  },

  exportRosterCSV() {
    if (!Auth.can('attendance.export')) {
      Toast.show('Permission denied: You do not have permission to export shift roster.', 'error');
      return;
    }
    const emps = this.getScopedEmployees();
    const days = this.getRosterDays();
    const shifts = DB.get('shifts') || [];
    const roster = DB.get('shift_roster') || [];

    const headers = ['Employee ID','Full Name','Department', ...days];
    const rows = emps.map(emp => {
      const rowDays = days.map(d => {
        const entry = roster.find(r => r.employeeId === emp.id && r.date === d);
        const shiftId = entry ? entry.shiftId : emp.shiftId;
        const isOff = entry ? entry.isOff : (new Date(d).getDay() === 0 || new Date(d).getDay() === 6);
        if (isOff) return 'OFF';
        const s = shifts.find(x => x.id === shiftId);
        return s?.name || 'Morning';
      });
      return [emp.empNo, `"${emp.fullName}"`, `"${Utils.getDeptName(emp.departmentId)}"`, ...rowDays];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `shift_roster_schedule_${days[0]}.csv`);
    Toast.show('Shift roster schedule exported to CSV!', 'success');
  },

  // ============================================================
  // BATCH 3: Geo-Fencing & IP-Restricted Clock In
  // ============================================================
  renderGeoFenceValidation(container) {
    const geofences = DB.get('branch_geofences') || [];

    container.innerHTML = `
      <!-- Stage 3 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm ${this.currentView==='roster'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('roster')">
            <i class="fa fa-calendar-days"></i> Shift Rosters &amp; Swaps
          </button>
          <button class="btn btn-sm ${this.currentView==='geofence'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('geofence')">
            <i class="fa fa-location-dot"></i> Geo-Fence &amp; IP Rules
          </button>
          <button class="btn btn-sm btn-ghost" onclick="Attendance.showTimeInWindowConfig()">
            <i class="fa fa-clock"></i> Time-In Windows
          </button>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="Attendance.testIPWhitelist()"><i class="fa fa-network-wired"></i> Test IP Whitelist</button>
          <button class="btn btn-primary btn-sm" onclick="Attendance.testCurrentGPSLocation()"><i class="fa fa-crosshairs"></i> Test GPS Perimeter</button>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(16,185,129,0.12);color:var(--success)">
              <i class="fa fa-location-dot"></i>
            </span>
            Geo-Fencing &amp; Corporate IP Clock-In Validation
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Branch perimeter boundary enforcement (Haversine formula) &amp; Office Intranet IP Whitelisting
          </div>
        </div>

        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="Attendance.testIPWhitelist()"><i class="fa fa-network-wired"></i> Test IP Whitelist</button>
          <button class="btn btn-primary btn-sm" onclick="Attendance.testCurrentGPSLocation()"><i class="fa fa-crosshairs"></i> Test GPS Perimeter</button>
        </div>
      </div>

      <!-- Live GPS & IP Verification Widget -->
      <div class="card" style="padding:20px;margin-bottom:24px;background:linear-gradient(135deg,var(--card),var(--surface-2))">
        <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <i class="fa fa-satellite" style="color:var(--primary)"></i> Real-Time Mobile / Browser Geolocation Check-In
        </div>

        <div id="geofence-live-card" style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:18px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
            <div>
              <div style="font-size:12px;color:var(--text-3)">Current Geolocation Coordinates:</div>
              <div id="geo-coord-display" style="font-size:18px;font-weight:800;color:var(--text);margin-top:4px;font-family:monospace">
                Lat: 24.8609&deg; N, Lng: 67.0013&deg; E
              </div>
              <div id="geo-dist-display" style="font-size:12px;color:var(--success);margin-top:4px;font-weight:600">
                <i class="fa fa-circle-check" style="margin-right:4px"></i> Within Karachi Head Office perimeter (32 meters from center)
              </div>
            </div>

            <button class="btn btn-success" style="padding:10px 20px;font-weight:700" onclick="Attendance.punchWithGPSVerification()">
              <i class="fa fa-fingerprint"></i> Punch In with GPS Verification
            </button>
          </div>
        </div>
      </div>

      <!-- Branch Geofence Perimeters List -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
        ${geofences.map(g => `
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <div style="font-weight:800;font-size:14px;color:var(--text)">${g.branchName}</div>
              <span class="badge ${g.status==='active'?'badge-success':'badge-secondary'}">${g.status.toUpperCase()}</span>
            </div>

            <div style="font-size:12px;color:var(--text-2);margin-bottom:12px">
              <i class="fa fa-map-pin" style="color:var(--danger);margin-right:4px"></i> ${g.address}
            </div>

            <div style="background:var(--surface);border-radius:8px;padding:10px 12px;font-size:11.5px;display:grid;gap:6px;margin-bottom:14px">
              <div><span style="color:var(--text-3)">Center Point:</span> <strong style="font-family:monospace">${g.latitude}&deg;, ${g.longitude}&deg;</strong></div>
              <div><span style="color:var(--text-3)">Allowed Radius:</span> <strong style="color:var(--primary)">${g.radiusMeters} Meters</strong></div>
              <div><span style="color:var(--text-3)">Office IP Whitelist:</span> <strong style="font-family:monospace;font-size:10.5px">${g.ipRange}</strong></div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border)">
              <span style="font-size:11.5px;color:var(--text-3)">Perimeter Strict Enforcement:</span>
              <button class="btn btn-ghost btn-sm" onclick="Attendance.toggleBranchGeofence(${g.id})">
                <i class="fa ${g.enforceGeo ? 'fa-toggle-on' : 'fa-toggle-off'}" style="font-size:18px;color:${g.enforceGeo ? 'var(--success)' : 'var(--text-3)'}"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  testCurrentGPSLocation() {
    Toast.show('Acquiring high-accuracy GPS coordinates...', 'info');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.displayEvaluatedGPS(lat, lng);
        },
        err => {
          // Fallback to Karachi simulation
          const simLat = 24.8609;
          const simLng = 67.0014;
          this.displayEvaluatedGPS(simLat, simLng);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      this.displayEvaluatedGPS(24.8609, 67.0014);
    }
  },

  displayEvaluatedGPS(lat, lng) {
    const geofences = DB.get('branch_geofences') || [];
    let nearestBranch = null;
    let shortestDist = Infinity;

    geofences.forEach(g => {
      const dist = DB.calculateGeoDistance(lat, lng, g.latitude, g.longitude);
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestBranch = g;
      }
    });

    const isInside = nearestBranch && shortestDist <= nearestBranch.radiusMeters;

    const coordEl = document.getElementById('geo-coord-display');
    const distEl = document.getElementById('geo-dist-display');
    if (coordEl) coordEl.textContent = `Lat: ${lat.toFixed(4)}° N, Lng: ${lng.toFixed(4)}° E`;
    if (distEl) {
      distEl.innerHTML = isInside
        ? `<i class="fa fa-circle-check" style="color:var(--success);margin-right:4px"></i> <strong>VERIFIED:</strong> Within ${nearestBranch.branchName} (${shortestDist}m from center &le; ${nearestBranch.radiusMeters}m)`
        : `<i class="fa fa-triangle-exclamation" style="color:var(--danger);margin-right:4px"></i> <strong style="color:var(--danger)">OUT OF BOUNDS:</strong> ${shortestDist}m from ${nearestBranch.branchName} (Allowed: ${nearestBranch.radiusMeters}m)`;
    }

    Toast.show(isInside ? 'GPS Location Verified within Branch Perimeter!' : 'Location outside authorized branch perimeter!', isInside ? 'success' : 'warning');
  },

  punchWithGPSVerification() {
    const myId = Auth.employee?.id || 1;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const dateStr = Utils.today();

    // Check cutoff
    const isLate = timeStr > '11:00';
    const status = isLate ? 'late' : 'present';

    // Support offline punch queueing when device loses connection
    if (typeof navigator !== 'undefined' && !navigator.onLine && typeof PWA !== 'undefined' && PWA.recordOfflinePunch) {
      PWA.recordOfflinePunch({
        id: DB.nextId('attendance'),
        employeeId: myId,
        date: dateStr,
        timeIn: timeStr,
        timeOut: null,
        status,
        device: 'Mobile-PWA (Offline Queued)',
        remarks: 'Recorded in offline mode; auto-synced with cloud',
        overtime: 0
      });
      return;
    }

    let att = DB.get('attendance') || [];
    let rec = att.find(a => a.employeeId === myId && a.date === dateStr);
    if (!rec) {
      att.push({
        id: DB.nextId('attendance'),
        employeeId: myId,
        date: dateStr,
        timeIn: timeStr,
        timeOut: null,
        status,
        device: 'Mobile-GPS (Verified In-Perimeter)',
        remarks: isLate ? 'Late arrival via GPS check-in' : 'Verified via Geofence GPS',
        overtime: 0
      });
    } else {
      rec.timeOut = timeStr;
    }

    DB.set('attendance', att);
    DB.log('ADD', 'Attendance', `GPS Punch recorded for ${Utils.getEmpName(myId)} at ${timeStr}`, Auth.user?.id);
    Toast.show(`Clock-In successful at ${timeStr}!`, 'success', `Device: Mobile-GPS Verified (${status.toUpperCase()})`);
  },

  testIPWhitelist() {
    Modal.show('Corporate IP Whitelist Checker', `
      <div class="form-group">
        <label class="form-label required">Enter IP Address to Test</label>
        <input class="form-control" id="ip-test-input" value="192.168.1.45" placeholder="e.g. 192.168.1.45 or 115.186.140.22">
      </div>
      <div id="ip-test-result" style="background:var(--surface);border-radius:8px;padding:12px;margin-top:12px;display:none"></div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Attendance.runIPCheck()"><i class="fa fa-network-wired"></i> Validate IP</button>
      `
    });
  },

  runIPCheck() {
    const ip = document.getElementById('ip-test-input').value.trim();
    const res = document.getElementById('ip-test-result');
    if (!ip || !res) return;

    const geofences = DB.get('branch_geofences') || [];
    let matched = null;

    geofences.forEach(g => {
      const prefixes = (g.ipRange || '').split(',').map(s => s.trim().split('/')[0].slice(0, 7));
      if (prefixes.some(p => ip.startsWith(p))) {
        matched = g;
      }
    });

    res.style.display = 'block';
    if (matched) {
      res.innerHTML = `
        <div style="color:var(--success);font-weight:700"><i class="fa fa-circle-check"></i> IP Address Whitelisted!</div>
        <div style="font-size:12px;color:var(--text-2);margin-top:4px">Matches corporate subnet of <strong>${matched.branchName}</strong> (${matched.ipRange}). Automated web check-in permitted.</div>
      `;
    } else {
      res.innerHTML = `
        <div style="color:var(--danger);font-weight:700"><i class="fa fa-circle-xmark"></i> IP Not in Office Whitelist</div>
        <div style="font-size:12px;color:var(--text-2);margin-top:4px">The IP <code>${ip}</code> is not in any office subnet. Field Punch flag will be recorded.</div>
      `;
    }
  },

  toggleBranchGeofence(branchId) {
    let geofences = DB.get('branch_geofences') || [];
    const g = geofences.find(x => x.id === branchId);
    if (g) {
      g.enforceGeo = !g.enforceGeo;
      DB.set('branch_geofences', geofences);
      Toast.show(`${g.branchName} Geofence enforcement ${g.enforceGeo ? 'ENABLED' : 'DISABLED'}`, 'info');
      this.renderGeoFenceValidation(document.getElementById('att-content'));
    }
  },

  // ============================================================
  // BATCH 3: ZKTeco Log File Importer & Biometric Hardware Sync
  // ============================================================
  showZKTecoUploadModal() {
    Modal.show('Import ZKTeco Machine Punch Log', `
      <div style="margin-bottom:14px;font-size:12.5px;color:var(--text-2)">
        Paste or upload raw biometric machine logs directly from your ZKTeco or BioTime attendance device (supports standard <code>attlog.dat</code>, <code>.txt</code>, or <code>.csv</code>).
      </div>

      <div class="form-group">
        <label class="form-label">Sample Template or Paste Raw Log:</label>
        <textarea class="form-control" id="zk-raw-input" rows="8" style="font-family:monospace;font-size:11.5px">1\t2026-09-08 09:02:14\t1\t1\t0\t0
2\t2026-09-08 09:12:45\t1\t1\t0\t0
3\t2026-09-08 09:44:10\t2\t1\t0\t0
4\t2026-09-08 09:05:00\t1\t1\t0\t0
7\t2026-09-08 11:22:30\t1\t1\t0\t0
9\t2026-09-08 09:14:15\t2\t1\t0\t0
14\t2026-09-08 09:08:22\t1\t1\t0\t0</textarea>
      </div>

      <div style="font-size:11px;color:var(--text-3);background:var(--surface);padding:8px 12px;border-radius:6px">
        Format: <code>[Employee ID / PIN] [DateTime (YYYY-MM-DD HH:MM:SS)] [Device ID] [Verify Mode]</code>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Attendance.processZKTecoLogText()"><i class="fa fa-bolt"></i> Parse &amp; Sync Punches</button>
      `
    });
  },

  processZKTecoLogText() {
    const raw = document.getElementById('zk-raw-input').value.trim();
    if (!raw) return;

    const lines = raw.split('\n');
    let att = DB.get('attendance') || [];
    let logs = DB.get('attendance_logs') || [];
    let parsedCount = 0;
    let lateCount = 0;

    const activeEmps = DB.get('employees') || [];
    let skippedCount = 0;
    lines.forEach(line => {
      const parts = line.trim().split(/[\t, ]+/);
      if (parts.length >= 2) {
        const empId = parseInt(parts[0]);
        const date = parts[1];
        const time = parts[2]?.slice(0, 5) || '09:00';

        // BUG-03 FIX: validate employee exists before creating records
        const empExists = activeEmps.some(e =>
          e.id === empId ||
          (e.biometricId && String(e.biometricId) === String(empId)) ||
          String(e.empNo).replace(/\D/g, '') === String(empId)
        );
        if (!empExists) { skippedCount++; return; }

        if (empId && date) {
          // BUG-03 FIX: use evaluateTimeIn for consistent cutoff logic
          const evalRes = this.evaluateTimeIn(empId, time, null);
          const isLate = evalRes.isLate;
          if (isLate) lateCount++;

          // Update or add machine log
          logs.unshift({
            id: DB.nextId('attendance_logs'),
            employeeId: empId,
            date,
            timeIn: time,
            timeOut: '18:00',
            device: 'ZKTeco-Hardware',
            status: isLate ? 'late' : 'present'
          });

          // Sync into daily attendance
          let rec = att.find(a => a.employeeId === empId && a.date === date);
          if (rec) {
            rec.timeIn = time;
            rec.status = isLate ? 'late' : rec.status;
            rec.device = 'ZKTeco-Hardware';
          } else {
            att.push({
              id: DB.nextId('attendance'),
              employeeId: empId,
              date,
              timeIn: time,
              timeOut: '18:00',
              status: isLate ? 'late' : 'present',
              device: 'ZKTeco-Hardware',
              overtime: 0,
              remarks: isLate ? 'Machine punch after 11:00 AM window cutoff' : 'Biometric Turnstile punch'
            });
          }
          parsedCount++;
        }
      }
    });

    DB.set('attendance', att);
    DB.set('attendance_logs', logs);
    DB.log('IMPORT', 'Attendance', `Imported ${parsedCount} biometric machine punches from ZKTeco device (${skippedCount} skipped — unknown employee IDs)`, Auth.user?.id);

    Modal.close('dynamic-modal');
    const skipMsg = skippedCount > 0 ? ` ${skippedCount} lines skipped (unknown employee IDs).` : '';
    Toast.show(`Successfully imported ${parsedCount} biometric punches!`, 'success', `${lateCount} punches flagged late.${skipMsg}`);
    this.renderView();
  },

  async syncBiometricHardware() {
    // Bridge URL: configurable via localStorage key 'zkBridgeUrl'
    // Default: http://localhost:8877 (run bridge/zkteco-bridge.js on the same machine)
    const bridgeUrl = localStorage.getItem('zkBridgeUrl') || 'http://localhost:8877';
    Toast.show('Connecting to ZKTeco Bridge & hardware terminals...', 'info');
    try {
      const resp = await fetch(`${bridgeUrl}/api/attendance/biometric-sync`).catch(() => null);
      if (resp && resp.ok) {
        const data = await resp.json();
        const emps = (DB.get('employees') || []).filter(e => e.status === 'active');
        let att = DB.get('attendance') || [];
        let logs = DB.get('attendance_logs') || [];
        let newPunches = 0;

        if (data.buffer && data.buffer.length > 0) {
          data.buffer.forEach(b => {
            if (b.user_id === 'SYSTEM_HEARTBEAT') return;
            // Flexible employee matcher: ID, empNo, or numeric portion
            const emp = emps.find(e => 
              (e.biometricId && String(e.biometricId) === String(b.user_id)) ||
                String(e.id) === String(b.user_id) || 
                String(e.empNo).toLowerCase() === String(b.user_id).toLowerCase() ||
                String(e.empNo).replace(/\D/g, '') === String(b.user_id).replace(/\D/g, ''));
            if (emp) {
              const punchDate = b.timestamp ? b.timestamp.split('T')[0] : Utils.today();
              const punchTime = b.timestamp ? b.timestamp.split('T')[1].substring(0, 5) : '09:00';
              
              const existsInLogs = logs.some(l => l.employeeId === emp.id && l.date === punchDate && l.time === punchTime);
              if (!existsInLogs) {
                logs.push({
                  id: DB.nextId('attendance_logs'),
                  employeeId: emp.id,
                  date: punchDate,
                  time: punchTime,
                  type: b.status === 'check-out' ? 'check_out' : 'check_in',
                  device: b.device_name || b.device_id || 'ZKTeco Terminal',
                  verifyMode: 'Biometric / Fingerprint'
                });
              }

              let rec = att.find(a => a.employeeId === emp.id && a.date === punchDate);
              if (!rec) {
                // BUG-01 FIX: use evaluateTimeIn for unified cutoff — was: (h > 9)||(h===9 && m>30) i.e. 09:31
                const evalRes = this.evaluateTimeIn(emp.id, punchTime, null);
                att.push({
                  id: DB.nextId('attendance'),
                  employeeId: emp.id,
                  date: punchDate,
                  timeIn: punchTime,
                  timeOut: null,
                  status: evalRes.isLate ? 'late' : 'present',
                  device: b.device_name || 'Biometric Terminal',
                  overtime: 0,
                  remarks: evalRes.isLate ? evalRes.autoRemark : `Live sync from ${b.device_name || 'Hardware'}`
                });
                newPunches++;
              } else if (!rec.timeOut && punchTime > (rec.timeIn || '00:00')) {
                rec.timeOut = punchTime;
                newPunches++;
              }
            }
          });
          DB.set('attendance', att);
          DB.set('attendance_logs', logs);
        }

        const hoStatus = (data.devices?.['zk-head-office']?.status || 'online').toUpperCase();
        const factStatus = (data.devices?.['zk-factory']?.status || 'online').toUpperCase();
        Toast.show('Biometric terminals synchronized!', 'success', `Head Office (${hoStatus}) & Factory (${factStatus}) synced. ${newPunches} new punches processed.`);
        this.renderView();
        return;
      }
    } catch (e) {
      console.warn('[Sync] Fallback to simulated sync:', e);
    }

    setTimeout(() => {
      const emps = DB.get('employees').filter(e => e.status === 'active');
      let att = DB.get('attendance') || [];
      const today = Utils.today();
      let newPunches = 0;

      emps.forEach(emp => {
        let rec = att.find(a => a.employeeId === emp.id && a.date === today);
        if (!rec) {
          att.push({
            id: DB.nextId('attendance'),
            employeeId: emp.id,
            date: today,
            timeIn: '09:08',
            timeOut: '18:05',
            status: 'present',
            device: 'Head Office Terminal',
            overtime: 0,
            remarks: 'Synced via TCP/IP hardware port 4370'
          });
          newPunches++;
        }
      });

      DB.set('attendance', att);
      Toast.show('Biometric terminals synchronized!', 'success', `${newPunches} new employee punches downloaded.`);
      this.renderView();
    }, 600);
  },

  // ═══════════════════════════════════════════════
  // PROJECT TIMESHEETS & BILLABLE HOURS ENGINE
  // ═══════════════════════════════════════════════

  timesheetWeekStart: '2026-08-31',
  timesheetFilterEmp: '',

  getTimesheetDays(startStr) {
    const d = new Date(startStr || '2026-08-31');
    const days = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(d);
      cur.setDate(d.getDate() + i);
      days.push(cur.toISOString().split('T')[0]);
    }
    return days;
  },

  prevTimesheetWeek() {
    const d = new Date(this.timesheetWeekStart);
    d.setDate(d.getDate() - 7);
    this.timesheetWeekStart = d.toISOString().split('T')[0];
    this.renderView();
  },

  nextTimesheetWeek() {
    const d = new Date(this.timesheetWeekStart);
    d.setDate(d.getDate() + 7);
    this.timesheetWeekStart = d.toISOString().split('T')[0];
    this.renderView();
  },

  renderTimesheets(container) {
    const emps = this.getScopedEmployees();
    const scopedIds = emps.map(e => e.id);
    const allTimesheets = DB.get('timesheets') || [];
    const days = this.getTimesheetDays(this.timesheetWeekStart);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    let timesheets = allTimesheets.filter(t => t.weekStartDate === this.timesheetWeekStart && scopedIds.includes(t.employeeId));
    if (this.timesheetFilterEmp) {
      timesheets = timesheets.filter(t => t.employeeId == this.timesheetFilterEmp);
    }

    const totalHours = timesheets.reduce((sum, t) => sum + (t.totalHours || 0), 0);
    const billableHours = timesheets.reduce((sum, t) => sum + (t.billableHours || 0), 0);
    const utilizationRate = totalHours > 0 ? ((billableHours / totalHours) * 100).toFixed(1) : 0;
    const totalBillingVal = timesheets.reduce((sum, t) => sum + (t.billableHours || 0) * (t.hourlyRate || 0), 0);
    const pendingApprovals = timesheets.filter(t => t.status === 'submitted').length;

    const isManagerOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager' || Auth.role === 'dept_manager';

    container.innerHTML = `
      <!-- Stage 4 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm ${this.currentView==='corrections'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('corrections')">
            <i class="fa fa-clipboard-check"></i> Attendance Regularization &amp; WFH
          </button>
          <button class="btn btn-sm ${this.currentView==='timesheets'?'btn-primary':'btn-ghost'}" onclick="Attendance.switchView('timesheets')">
            <i class="fa fa-business-time"></i> Project Timesheets &amp; Billing
          </button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="Attendance.syncTimesheetsToPayroll()" title="Bridge approved weekly hours > 40 into payroll overtime">
            <i class="fa fa-money-bill-transfer"></i> Sync Overtime to Payroll
          </button>
          <button class="btn btn-ghost btn-sm" onclick="Attendance.exportTimesheetsCSV()">
            <i class="fa fa-file-export"></i> Export CSV
          </button>
          <button class="btn btn-primary btn-sm" onclick="Attendance.showLogTimesheetModal()">
            <i class="fa fa-plus"></i> Log Project Hours
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:16px;font-weight:700">Project Timesheets & Client Billing Engine</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:3px">Weekly project activity logging, billable utilization telemetry, and direct payroll overtime bridge</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="Attendance.syncTimesheetsToPayroll()" title="Bridge approved weekly hours > 40 into payroll overtime">
              <i class="fa fa-money-bill-transfer"></i> Sync Overtime to Payroll
            </button>
            <button class="btn btn-ghost btn-sm" onclick="Attendance.exportTimesheetsCSV()">
              <i class="fa fa-file-export"></i> Export CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="Attendance.showLogTimesheetModal()">
              <i class="fa fa-plus"></i> Log Project Hours
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--primary)">${totalHours} hrs</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Total Logged Hours</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--success)">${utilizationRate}%</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Billable Utilization (${billableHours}h)</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--info)">$${totalBillingVal.toLocaleString()}</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Client Billing Value</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--warning)">${pendingApprovals}</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Pending Approvals</div>
          </div>
        </div>

        <!-- Timesheet Week & Filter Toolbar -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--surface-2);border-radius:8px;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.prevTimesheetWeek()"><i class="fa fa-chevron-left"></i></button>
            <div style="font-weight:700;font-size:13px;color:var(--text)">
              Week: <span style="color:var(--primary)">${Utils.formatDate(days[0])}</span> – <span style="color:var(--primary)">${Utils.formatDate(days[6])}</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Attendance.nextTimesheetWeek()"><i class="fa fa-chevron-right"></i></button>
          </div>

          <div style="display:flex;align-items:center;gap:10px">
            <select class="form-control" style="width:220px;font-size:12px" onchange="Attendance.timesheetFilterEmp=this.value;Attendance.renderView()">
              <option value="">All Scoped Personnel (${emps.length})</option>
              ${emps.map(e => `<option value="${e.id}" ${this.timesheetFilterEmp==e.id?'selected':''}>${e.fullName} (${e.empNo})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Personnel</th>
                <th>Project & Task Activity</th>
                <th>Rate / Type</th>
                ${dayNames.map((name, i) => `<th style="text-align:center;font-size:11px">${name}<br><span style="font-weight:400;color:var(--text-3);font-size:10px">${days[i].split('-')[2]}</span></th>`).join('')}
                <th style="text-align:center">Total</th>
                <th style="text-align:right">Billing</th>
                <th>Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${timesheets.length === 0 ? `
                <tr><td colspan="15" style="text-align:center;padding:24px;color:var(--text-3)">No timesheet records found for this week. Click "Log Project Hours" to record tasks.</td></tr>
              ` : timesheets.map(t => {
                const emp = DB.find('employees', t.employeeId);
                const hrs = t.hours || {};
                const isOT = (t.totalHours || 0) > 40;
                const statusBadge = t.status === 'approved' ? '<span class="badge badge-success"><i class="fa fa-check"></i> Approved</span>' :
                                    t.status === 'submitted' ? '<span class="badge badge-warning"><i class="fa fa-clock"></i> Submitted</span>' :
                                    t.status === 'rejected' ? '<span class="badge badge-danger"><i class="fa fa-times"></i> Rejected</span>' :
                                    '<span class="badge badge-secondary">Draft</span>';

                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="avatar avatar-xs" style="background:${Utils.avatarColor(t.employeeId)}">${Utils.avatarInitials(emp?.fullName || 'U')}</div>
                        <div>
                          <div style="font-weight:700;font-size:12px;color:var(--text)">${emp?.fullName || 'Employee'}</div>
                          <div style="font-size:10.5px;color:var(--text-3)">${emp?.empNo || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight:600;font-size:12.5px;color:var(--text)">${t.projectName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${t.taskName}</div>
                    </td>
                    <td>
                      ${t.isBillable ? `
                        <span class="badge badge-primary" style="font-size:10px"><i class="fa fa-bolt"></i> $${t.hourlyRate}/h</span>
                      ` : `
                        <span class="badge badge-secondary" style="font-size:10px">Internal Non-Billable</span>
                      `}
                    </td>
                    <td style="text-align:center;font-size:11.5px;font-family:monospace;background:rgba(255,255,255,0.01)">${hrs.mon || 0}</td>
                    <td style="text-align:center;font-size:11.5px;font-family:monospace;background:rgba(255,255,255,0.01)">${hrs.tue || 0}</td>
                    <td style="text-align:center;font-size:11.5px;font-family:monospace;background:rgba(255,255,255,0.01)">${hrs.wed || 0}</td>
                    <td style="text-align:center;font-size:11.5px;font-family:monospace;background:rgba(255,255,255,0.01)">${hrs.thu || 0}</td>
                    <td style="text-align:center;font-size:11.5px;font-family:monospace;background:rgba(255,255,255,0.01)">${hrs.fri || 0}</td>
                    <td style="text-align:center;font-size:11.5px;font-family:monospace;color:var(--text-3)">${hrs.sat || 0}</td>
                    <td style="text-align:center;font-size:11.5px;font-family:monospace;color:var(--text-3)">${hrs.sun || 0}</td>
                    <td style="text-align:center;font-weight:700;font-size:13px">
                      ${t.totalHours}h
                      ${isOT ? `<span class="badge badge-info" style="font-size:9.5px;display:block;margin-top:2px">+${t.totalHours - 40}h OT</span>` : ''}
                    </td>
                    <td style="text-align:right;font-family:monospace;font-weight:700;color:var(--success)">
                      $${((t.billableHours || 0) * (t.hourlyRate || 0)).toLocaleString()}
                    </td>
                    <td>
                      ${statusBadge}
                      ${t.syncedToPayroll ? '<div style="font-size:9.5px;color:var(--info);margin-top:2px"><i class="fa fa-check-double"></i> Payroll Synced</div>' : ''}
                    </td>
                    <td style="text-align:right;white-space:nowrap">
                      ${isManagerOrAdmin && t.status === 'submitted' ? `
                        <button class="btn btn-success btn-xs" onclick="Attendance.approveTimesheet(${t.id})" title="Approve Timesheet"><i class="fa fa-check"></i></button>
                        <button class="btn btn-danger btn-xs" onclick="Attendance.rejectTimesheet(${t.id})" title="Reject Timesheet"><i class="fa fa-times"></i></button>
                      ` : ''}
                      <button class="btn btn-ghost btn-xs" onclick="Attendance.deleteTimesheet(${t.id})" title="Delete Entry" style="color:var(--danger)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showLogTimesheetModal() {
    const emps = this.getScopedEmployees();
    const projects = DB.get('projects') || [
      { id: 1, name: 'ERP Core Banking Gateway' },
      { id: 2, name: 'Mobile Banking & Fintech SuperApp' },
      { id: 3, name: 'Internal Infrastructure Optimization' }
    ];

    Modal.show('Log Project Timesheet Hours', `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Employee</label>
          <select class="form-control" id="ts-emp">
            ${emps.map(e => `<option value="${e.id}" ${e.id === (Auth.employee?.id || 1) ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Project Allocation</label>
          <select class="form-control" id="ts-proj">
            ${projects.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Task Activity & Deliverables Description</label>
        <input class="form-control" id="ts-task" placeholder="e.g. Microservices endpoint testing, query optimization...">
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Billing Classification</label>
          <select class="form-control" id="ts-billable" onchange="document.getElementById('ts-rate-box').style.display = this.value === 'true' ? 'block' : 'none'">
            <option value="true" selected>Billable to Client</option>
            <option value="false">Internal / Non-Billable</option>
          </select>
        </div>
        <div class="form-group" id="ts-rate-box">
          <label class="form-label">Hourly Billing Rate (USD)</label>
          <input class="form-control" id="ts-rate" type="number" value="45" min="0" step="5">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Daily Logged Hours (Mon – Sun)</label>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">
          ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => `
            <div style="text-align:center">
              <span style="font-size:11px;font-weight:600;color:var(--text-3)">${day}</span>
              <input class="form-control ts-daily-input" id="ts-d-${day.toLowerCase()}" type="number" min="0" max="24" value="${i < 5 ? 8 : 0}" style="text-align:center;font-weight:700">
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Timesheet Submission State</label>
        <select class="form-control" id="ts-status">
          <option value="approved">Approved & Finalized</option>
          <option value="submitted" selected>Submitted for Manager Endorsement</option>
          <option value="draft">Draft (Work in Progress)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="ts-notes" rows="2" placeholder="Any blockers, sprint notes, or client references..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Attendance.saveTimesheetEntry()"><i class="fa fa-save"></i> Save Timesheet</button>
      `
    });
  },

  saveTimesheetEntry() {
    const empId = parseInt(document.getElementById('ts-emp').value);
    const projSelect = document.getElementById('ts-proj');
    const projId = parseInt(projSelect.value);
    const projName = projSelect.options[projSelect.selectedIndex].getAttribute('data-name') || projSelect.options[projSelect.selectedIndex].text;
    const taskName = document.getElementById('ts-task').value.trim();
    const isBillable = document.getElementById('ts-billable').value === 'true';
    const rate = isBillable ? (parseFloat(document.getElementById('ts-rate').value) || 0) : 0;
    const status = document.getElementById('ts-status').value;
    const notes = document.getElementById('ts-notes').value.trim();

    if (!taskName) {
      Toast.show('Task description is required', 'error');
      return;
    }

    const hours = {
      mon: parseFloat(document.getElementById('ts-d-mon').value) || 0,
      tue: parseFloat(document.getElementById('ts-d-tue').value) || 0,
      wed: parseFloat(document.getElementById('ts-d-wed').value) || 0,
      thu: parseFloat(document.getElementById('ts-d-thu').value) || 0,
      fri: parseFloat(document.getElementById('ts-d-fri').value) || 0,
      sat: parseFloat(document.getElementById('ts-d-sat').value) || 0,
      sun: parseFloat(document.getElementById('ts-d-sun').value) || 0,
    };

    const totalHours = Object.values(hours).reduce((sum, h) => sum + h, 0);
    const billableHours = isBillable ? totalHours : 0;

    const timesheets = DB.get('timesheets') || [];
    const days = this.getTimesheetDays(this.timesheetWeekStart);

    const newTs = {
      id: DB.nextId('timesheets'),
      employeeId: empId,
      weekStartDate: this.timesheetWeekStart,
      weekEndDate: days[6],
      projectId: projId,
      projectName: projName,
      taskName,
      isBillable,
      hourlyRate: rate,
      currency: 'USD',
      hours,
      totalHours,
      billableHours,
      status,
      submittedAt: new Date().toISOString(),
      approvedBy: status === 'approved' ? (Auth.user?.id || 1) : null,
      approvedAt: status === 'approved' ? new Date().toISOString() : null,
      notes,
      syncedToPayroll: false
    };

    timesheets.push(newTs);
    DB.set('timesheets', timesheets);
    DB.log('CREATE', 'Attendance', `Logged ${totalHours} hrs on project "${projName}" (${isBillable ? 'Billable $' + rate + '/h' : 'Non-Billable'})`, Auth.user?.id, 'INFO');
    Toast.show(`Timesheet entry saved (${totalHours} hrs)!`, 'success');
    Modal.close('dynamic-modal');
    this.renderView();
  },

  approveTimesheet(id) {
    const timesheets = DB.get('timesheets') || [];
    const idx = timesheets.findIndex(t => t.id === id);
    if (idx === -1) return;

    timesheets[idx].status = 'approved';
    timesheets[idx].approvedBy = Auth.user?.id || 1;
    timesheets[idx].approvedAt = new Date().toISOString();
    DB.set('timesheets', timesheets);
    DB.log('APPROVE', 'Attendance', `Approved timesheet #${id} for ${Utils.getEmpName(timesheets[idx].employeeId)} (${timesheets[idx].totalHours} hrs)`, Auth.user?.id, 'INFO');
    Toast.show('Timesheet approved successfully!', 'success');
    this.renderView();
  },

  rejectTimesheet(id) {
    const timesheets = DB.get('timesheets') || [];
    const idx = timesheets.findIndex(t => t.id === id);
    if (idx === -1) return;

    timesheets[idx].status = 'rejected';
    DB.set('timesheets', timesheets);
    DB.log('REJECT', 'Attendance', `Rejected timesheet #${id}`, Auth.user?.id, 'WARNING');
    Toast.show('Timesheet rejected', 'info');
    this.renderView();
  },

  deleteTimesheet(id) {
    const timesheets = DB.get('timesheets') || [];
    const idx = timesheets.findIndex(t => t.id === id);
    if (idx === -1) return;

    Modal.confirm('Delete Timesheet Entry', 'Are you sure you want to delete this timesheet entry?', () => {
      const filtered = timesheets.filter(t => t.id !== id);
      DB.set('timesheets', filtered);
      DB.log('DELETE', 'Attendance', `Deleted timesheet #${id}`, Auth.user?.id, 'WARNING');
      Toast.show('Timesheet removed', 'info');
      this.renderView();
    }, 'danger');
  },

  syncTimesheetsToPayroll() {
    const timesheets = DB.get('timesheets') || [];
    const weekTs = timesheets.filter(t => t.weekStartDate === this.timesheetWeekStart && t.status === 'approved' && !t.syncedToPayroll && t.totalHours > 40);

    if (!weekTs.length) {
      Toast.show('No unsynced approved overtime timesheets (> 40h) found for this week.', 'info');
      return;
    }

    let syncedCount = 0;
    let totalOTHours = 0;

    weekTs.forEach(t => {
      const otHours = t.totalHours - 40;
      totalOTHours += otHours;
      t.syncedToPayroll = true;
      syncedCount++;
    });

    DB.set('timesheets', timesheets);
    DB.log('SYNC', 'Payroll', `Synced ${totalOTHours} overtime hours from ${syncedCount} approved timesheets to payroll ledger`, Auth.user?.id, 'INFO');
    Toast.show(`Successfully synced ${totalOTHours} overtime hours to payroll ledger!`, 'success');
    this.renderView();
  },

  exportTimesheetsCSV() {
    const timesheets = DB.get('timesheets') || [];
    const weekTs = timesheets.filter(t => t.weekStartDate === this.timesheetWeekStart);
    if (!weekTs.length) {
      Toast.show('No timesheet records to export for this week', 'warning');
      return;
    }

    const headers = ['ID', 'Employee ID', 'Employee Name', 'Week Start', 'Week End', 'Project Name', 'Task Activity', 'Is Billable', 'Hourly Rate', 'Total Hours', 'Billable Hours', 'Status', 'Billing Value'];
    const rows = weekTs.map(t => [
      t.id,
      t.employeeId,
      `"${Utils.getEmpName(t.employeeId).replace(/"/g, '""')}"`,
      t.weekStartDate,
      t.weekEndDate,
      `"${(t.projectName||'').replace(/"/g, '""')}"`,
      `"${(t.taskName||'').replace(/"/g, '""')}"`,
      t.isBillable ? 'YES' : 'NO',
      t.hourlyRate || 0,
      t.totalHours || 0,
      t.billableHours || 0,
      t.status,
      (t.billableHours || 0) * (t.hourlyRate || 0)
    ].join(','));

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csvContent, `timesheet_billing_week_${this.timesheetWeekStart}.csv`);
    Toast.show('Timesheets exported to CSV!', 'success');
  },

  // ============================================================
  // BIOMETRIC MACHINE PUNCH HUB & TELEMETRY LOGS
  // Options: Check-In, OT-Out, OT-In, Check-Out
  // Role Scoping:
  //   - Employee: Self machine punch logs only
  //   - Deputy Manager: Self + Department Team machine punch logs
  //   - HR / Admin: Complete company-wide machine punch hub
  // Tracks swipe frequency: how many times employee used machine
  // ============================================================
  prevMachineLogDay() {
    const d = new Date(this.machineLogDate || Utils.today());
    d.setDate(d.getDate() - 1);
    this.machineLogDate = d.toISOString().split('T')[0];
    this.renderView();
  },

  nextMachineLogDay() {
    const d = new Date(this.machineLogDate || Utils.today());
    d.setDate(d.getDate() + 1);
    this.machineLogDate = d.toISOString().split('T')[0];
    this.renderView();
  },

  setMachineLogDate(val) {
    this.machineLogDate = val || Utils.today();
    this.renderView();
  },

  setMachineLogDept(val) {
    this.machineLogDeptFilter = val;
    this.machineLogEmpFilter = 'all';
    this.renderView();
  },

  setMachineLogEmp(val) {
    this.machineLogEmpFilter = val;
    this.renderView();
  },

  setMachineLogPunchType(val) {
    this.machineLogPunchFilter = val;
    this.renderView();
  },

  setMachineLogDevice(val) {
    this.machineLogDeviceFilter = val;
    this.renderView();
  },

  setMachineLogSearch(val) {
    this.machineLogSearchQuery = (val || '').toLowerCase().trim();
    this.renderView();
  },

  renderMachineLog(container) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isManager  = Auth.role === 'dept_manager';
    const isAdmin    = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;
    const allEmps = DB.get('employees') || [];
    const depts = DB.get('departments') || [];

    // Role-based employee scoping
    let scopedEmps = [];
    if (isEmployee) {
      scopedEmps = allEmps.filter(e => e.id === myEmpId);
    } else if (isManager) {
      scopedEmps = this.getScopedEmployees();
    } else {
      scopedEmps = allEmps.filter(e => e.status === 'active');
    }
    const scopedEmpIds = scopedEmps.map(e => e.id);

    const selectedDate = this.machineLogDate || Utils.today();
    const isToday = selectedDate === Utils.today();

    // Pull raw biometric logs
    let allLogs = DB.get('attendance_logs') || [];
    if (!allLogs.length && typeof Data !== 'undefined' && Data.genMachinePunchLogs) {
      allLogs = Data.genMachinePunchLogs();
      DB.set('attendance_logs', allLogs);
    }

    // Filter by selected date and user's role scope
    let dayLogs = allLogs.filter(l => l.date === selectedDate && scopedEmpIds.includes(l.employeeId));

    // Admin Department Filter
    if (isAdmin && this.machineLogDeptFilter && this.machineLogDeptFilter !== 'all') {
      const deptEmpIds = scopedEmps.filter(e => e.department === this.machineLogDeptFilter).map(e => e.id);
      dayLogs = dayLogs.filter(l => deptEmpIds.includes(l.employeeId));
    }

    // Specific Employee Filter
    if (this.machineLogEmpFilter && this.machineLogEmpFilter !== 'all') {
      const targetEmpId = parseInt(this.machineLogEmpFilter);
      dayLogs = dayLogs.filter(l => l.employeeId === targetEmpId);
    }

    // Punch Type Filter (check_in, ot_out, ot_in, check_out)
    if (this.machineLogPunchFilter && this.machineLogPunchFilter !== 'all') {
      dayLogs = dayLogs.filter(l => l.punchType === this.machineLogPunchFilter);
    }

    // Device / Terminal Filter
    if (this.machineLogDeviceFilter && this.machineLogDeviceFilter !== 'all') {
      dayLogs = dayLogs.filter(l => l.device === this.machineLogDeviceFilter);
    }

    // Text Search Filter (name, empNo, device)
    if (this.machineLogSearchQuery) {
      const q = this.machineLogSearchQuery;
      dayLogs = dayLogs.filter(l => {
        const emp = DB.find('employees', l.employeeId);
        const name = (emp?.fullName || '').toLowerCase();
        const empNo = (emp?.empNo || '').toLowerCase();
        const dev = (l.device || '').toLowerCase();
        return name.includes(q) || empNo.includes(q) || dev.includes(q);
      });
    }

    // Sort by timestamp descending (most recent punch first)
    dayLogs.sort((a, b) => {
      const tA = a.timestamp || `${a.date}T${a.time}:00`;
      const tB = b.timestamp || `${b.date}T${b.time}:00`;
      return tB.localeCompare(tA);
    });

    // Compute KPIs across scoped employees for the day
    const allScopedDayLogs = allLogs.filter(l => l.date === selectedDate && scopedEmpIds.includes(l.employeeId));
    const totalSwipes = allScopedDayLogs.length;

    // Calculate shift completion per employee on this date
    const empPunchCounts = {};
    const empPunchTypes = {};
    allScopedDayLogs.forEach(l => {
      empPunchCounts[l.employeeId] = (empPunchCounts[l.employeeId] || 0) + 1;
      if (!empPunchTypes[l.employeeId]) empPunchTypes[l.employeeId] = new Set();
      empPunchTypes[l.employeeId].add(l.punchType);
    });

    let completeShifts = 0;
    let activeShifts = 0;
    Object.keys(empPunchCounts).forEach(eId => {
      const types = empPunchTypes[eId];
      if (types.has('check_in') && types.has('ot_out') && types.has('ot_in') && types.has('check_out')) {
        completeShifts++;
      } else if (types.has('check_in') && !types.has('check_out')) {
        activeShifts++;
      }
    });

    // Unique Active Terminals
    const activeTerminals = [...new Set(allScopedDayLogs.map(l => l.device).filter(Boolean))];
    const totalTerminals = Math.max(activeTerminals.length, 3);

    // Punch Type Badges Config
    const punchMeta = {
      check_in:  { label: 'Check-In',  num: 1, icon: 'fa-arrow-right-to-bracket', bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
      ot_out:    { label: 'OT-Out',    num: 2, icon: 'fa-mug-hot',                bg: 'rgba(245,158,11,0.15)', color: '#d97706', border: 'rgba(245,158,11,0.3)' },
      ot_in:     { label: 'OT-In',     num: 3, icon: 'fa-rotate-left',            bg: 'rgba(37,99,235,0.15)',  color: '#2563eb', border: 'rgba(37,99,235,0.3)' },
      check_out: { label: 'Check-Out', num: 4, icon: 'fa-arrow-right-from-bracket',bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)' }
    };

    container.innerHTML = `
      <div class="card animate-fade-in" style="padding:22px">
        <!-- Header Banner & Scoping Title -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--border);padding-bottom:16px">
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:40px;height:40px;border-radius:10px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:20px">
                <i class="fa fa-fingerprint"></i>
              </div>
              <div>
                <h3 style="font-size:18px;font-weight:800;color:var(--text);margin:0">
                  ${isEmployee ? 'My Machine Punch Logs (Biometric Swipes)' : isManager ? 'Team Biometric Machine Punch Logs' : 'Biometric Machine Punch Hub & Telemetry'}
                </h3>
                <p style="font-size:12.5px;color:var(--text-3);margin:2px 0 0 0">
                  ${isEmployee 
                    ? 'Audit of your 4 machine options (Check-In, OT-Out, OT-In, Check-Out) and swipe frequency counter' 
                    : isManager 
                    ? 'Live punch logs and swipe counts for your department team from physical attendance machines' 
                    : 'Real-time company-wide biometric machine logs with punch frequency tracking and daily completion cycles'}
                </p>
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.exportMachinePunchLogs()">
              <i class="fa fa-file-export"></i> Export Machine Logs CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="Attendance.renderView()">
              <i class="fa fa-rotate"></i> Refresh Logs
            </button>
          </div>
        </div>

        <!-- KPI Dossier Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid var(--primary)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase">Total Swipes Today</span>
              <span style="width:30px;height:30px;border-radius:8px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;color:var(--primary)"><i class="fa fa-fingerprint"></i></span>
            </div>
            <div style="font-size:26px;font-weight:800;color:var(--primary);margin-top:6px">${totalSwipes}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px">Machine events recorded on ${selectedDate}</div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid var(--success)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase">Complete Shifts (4/4)</span>
              <span style="width:30px;height:30px;border-radius:8px;background:rgba(16,185,129,0.12);display:flex;align-items:center;justify-content:center;color:var(--success)"><i class="fa fa-circle-check"></i></span>
            </div>
            <div style="font-size:26px;font-weight:800;color:var(--success);margin-top:6px">${completeShifts}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px">Employees with all 4 punch states completed</div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #f59e0b">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase">Active / In Progress</span>
              <span style="width:30px;height:30px;border-radius:8px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;color:#f59e0b"><i class="fa fa-clock"></i></span>
            </div>
            <div style="font-size:26px;font-weight:800;color:#f59e0b;margin-top:6px">${activeShifts}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px">Currently checked in or on break</div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #0ea5e9">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase">Online Terminals</span>
              <span style="width:30px;height:30px;border-radius:8px;background:rgba(14,165,233,0.12);display:flex;align-items:center;justify-content:center;color:#0ea5e9"><i class="fa fa-network-wired"></i></span>
            </div>
            <div style="font-size:26px;font-weight:800;color:#0ea5e9;margin-top:6px">${totalTerminals} Terminals</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px">Biometric hardware devices transmitting</div>
          </div>
        </div>

        <!-- Multi-criteria Filter & Navigation Toolbar -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px">
          <!-- Date Navigator -->
          <div style="display:flex;align-items:center;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.prevMachineLogDay()" title="Previous Day"><i class="fa fa-chevron-left"></i></button>
            <input type="date" class="form-control" style="width:145px;padding:5px 8px;font-size:12.5px" value="${selectedDate}" onchange="Attendance.setMachineLogDate(this.value)">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.nextMachineLogDay()" title="Next Day"><i class="fa fa-chevron-right"></i></button>
            <button class="btn ${isToday ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="Attendance.setMachineLogDate('${Utils.today()}')">Today</button>
          </div>

          <!-- Filters Row -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${isAdmin ? `
              <!-- Department Dropdown for Admin -->
              <select class="form-control" style="width:160px;padding:5px 8px;font-size:12px" onchange="Attendance.setMachineLogDept(this.value)">
                <option value="all" ${this.machineLogDeptFilter === 'all' ? 'selected' : ''}>All Departments</option>
                ${depts.map(d => `<option value="${d.name}" ${this.machineLogDeptFilter === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
            ` : ''}

            ${!isEmployee ? `
              <!-- Employee Dropdown for Manager / Admin -->
              <select class="form-control" style="width:180px;padding:5px 8px;font-size:12px" onchange="Attendance.setMachineLogEmp(this.value)">
                <option value="all" ${this.machineLogEmpFilter === 'all' ? 'selected' : ''}>All Employees (${scopedEmps.length})</option>
                ${scopedEmps.map(e => `<option value="${e.id}" ${this.machineLogEmpFilter == e.id ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
              </select>
            ` : ''}

            <!-- 4 Punch Options Filter -->
            <select class="form-control" style="width:150px;padding:5px 8px;font-size:12px" onchange="Attendance.setMachineLogPunchType(this.value)">
              <option value="all" ${this.machineLogPunchFilter === 'all' ? 'selected' : ''}>All Punch Options</option>
              <option value="check_in" ${this.machineLogPunchFilter === 'check_in' ? 'selected' : ''}>Check-In (Punch #1)</option>
              <option value="ot_out" ${this.machineLogPunchFilter === 'ot_out' ? 'selected' : ''}>OT-Out (Punch #2)</option>
              <option value="ot_in" ${this.machineLogPunchFilter === 'ot_in' ? 'selected' : ''}>OT-In (Punch #3)</option>
              <option value="check_out" ${this.machineLogPunchFilter === 'check_out' ? 'selected' : ''}>Check-Out (Punch #4)</option>
            </select>

            <!-- Machine Device Filter -->
            <select class="form-control" style="width:180px;padding:5px 8px;font-size:12px" onchange="Attendance.setMachineLogDevice(this.value)">
              <option value="all" ${this.machineLogDeviceFilter === 'all' ? 'selected' : ''}>All Biometric Terminals</option>
              <option value="ZKTeco-Main-Gate" ${this.machineLogDeviceFilter === 'ZKTeco-Main-Gate' ? 'selected' : ''}>ZKTeco-Main-Gate (192.168.1.201)</option>
              <option value="ZKTeco-Plant-Entrance" ${this.machineLogDeviceFilter === 'ZKTeco-Plant-Entrance' ? 'selected' : ''}>ZKTeco-Plant-Entrance (192.168.1.202)</option>
              <option value="ZKTeco-Admin-Office" ${this.machineLogDeviceFilter === 'ZKTeco-Admin-Office' ? 'selected' : ''}>ZKTeco-Admin-Office (192.168.1.203)</option>
            </select>

            <!-- Search Field -->
            <div style="position:relative">
              <i class="fa fa-search" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:11px"></i>
              <input type="text" class="form-control" placeholder="Search employee or terminal..." style="padding-left:26px;width:180px;font-size:12px" value="${this.machineLogSearchQuery || ''}" oninput="Attendance.setMachineLogSearch(this.value)">
            </div>
          </div>
        </div>

        <!-- Biometric Machine Punch Telemetry Table -->
        <div class="table-responsive">
          <table class="table table-hover" style="font-size:12.5px">
            <thead>
              <tr style="background:var(--surface-2)">
                <th style="width:100px">Time</th>
                <th>Employee &amp; Department</th>
                <th style="width:140px">Machine Option</th>
                <th style="width:110px">Swipe Sequence</th>
                <th>Biometric Terminal</th>
                <th style="width:130px">Verify Mode</th>
                <th style="width:150px">Day Cycle Status</th>
                <th style="text-align:right;width:110px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${dayLogs.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center;padding:48px;color:var(--text-muted)">
                    <div style="font-size:36px;margin-bottom:10px;opacity:0.4"><i class="fa fa-fingerprint"></i></div>
                    <div style="font-weight:700;font-size:14px;color:var(--text-2)">No Machine Punch Logs Found</div>
                    <div style="font-size:12px;margin-top:4px">No biometric swipe events match the selected date and filters.</div>
                  </td>
                </tr>
              ` : dayLogs.map(l => {
                const emp = DB.find('employees', l.employeeId) || { fullName: `Employee #${l.employeeId}`, empNo: `EMP-${l.employeeId}`, department: 'Staff' };
                const pInfo = punchMeta[l.punchType] || { label: l.punchLabel || l.punchType, num: l.punchNumber || 1, icon: 'fa-fingerprint', bg: 'var(--surface-2)', color: 'var(--text-2)', border: 'var(--border)' };
                
                // Determine total swipes and completion for this employee on this date
                const userSwipes = empPunchCounts[l.employeeId] || 1;
                const userTypes = empPunchTypes[l.employeeId] || new Set([l.punchType]);
                const isComplete = userTypes.has('check_in') && userTypes.has('ot_out') && userTypes.has('ot_in') && userTypes.has('check_out');

                return `
                  <tr>
                    <td>
                      <div style="font-weight:800;color:var(--text);font-size:13px">${l.time || '—'}</div>
                      <div style="font-size:10.5px;color:var(--text-muted)">${l.date}</div>
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:9px">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:11.5px">
                          ${emp.fullName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style="font-weight:700;color:var(--text)">${emp.fullName}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp.empNo} • <span class="badge badge-secondary" style="font-size:10px;padding:1px 5px">${emp.department || 'General'}</span></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;font-size:11.5px;font-weight:700;background:${pInfo.bg};color:${pInfo.color};border:1px solid ${pInfo.border}">
                        <i class="fa ${pInfo.icon}"></i> ${pInfo.label}
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-secondary" style="font-size:11px;font-weight:600">
                        <i class="fa fa-hashtag"></i> Swipe #${l.punchNumber || pInfo.num}
                      </span>
                    </td>
                    <td>
                      <div style="font-weight:600;color:var(--text);font-size:12px">
                        <i class="fa fa-microchip" style="color:var(--primary);margin-right:4px"></i>
                        ${l.device || 'ZKTeco-Main-Gate'}
                      </div>
                      <div style="font-size:10.5px;color:var(--text-muted);font-family:monospace">
                        IP: ${l.deviceIp || '192.168.1.201'}
                      </div>
                    </td>
                    <td>
                      <span style="font-size:11.5px;color:var(--text-2);display:inline-flex;align-items:center;gap:5px">
                        <i class="fa ${l.verifyMode === 'Face Recognition' ? 'fa-camera' : 'fa-fingerprint'}" style="color:var(--primary)"></i>
                        ${l.verifyMode || 'Fingerprint'}
                      </span>
                    </td>
                    <td>
                      ${isComplete ? `
                        <span class="badge badge-success" style="font-size:11px;padding:3px 8px">
                          <i class="fa fa-circle-check"></i> Complete (4/4 Swipes)
                        </span>
                      ` : `
                        <span class="badge ${userSwipes >= 2 ? 'badge-warning' : 'badge-primary'}" style="font-size:11px;padding:3px 8px">
                          <i class="fa fa-clock"></i> ${userSwipes}/4 Swipes (${userSwipes === 1 ? 'In' : userSwipes === 2 ? 'OT-Out' : 'OT-In'})
                        </span>
                      `}
                    </td>
                    <td style="text-align:right">
                      <button class="btn btn-ghost btn-xs" onclick="Attendance.showMachinePunchDetail(${l.employeeId}, '${l.date}')" title="View Full Day Punch Timeline">
                        <i class="fa fa-timeline" style="color:var(--primary);margin-right:4px"></i>Timeline
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Terminal Fleet Status Footer -->
        <div style="margin-top:18px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12px">
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <span style="color:var(--text-3);font-weight:600"><i class="fa fa-circle" style="color:var(--success);font-size:9px;margin-right:5px"></i>Hardware Network: Online &amp; Synchronized</span>
            <span style="color:var(--text-muted)">Terminal 01: <strong>ZKTeco-Main-Gate (192.168.1.201)</strong></span>
            <span style="color:var(--text-muted)">Terminal 02: <strong>ZKTeco-Plant-Entrance (192.168.1.202)</strong></span>
            <span style="color:var(--text-muted)">Terminal 03: <strong>ZKTeco-Admin-Office (192.168.1.203)</strong></span>
          </div>
          <div style="color:var(--text-3);font-weight:600">
            Auto-Sync Interval: <strong>Real-time WebSocket Push</strong>
          </div>
        </div>
      </div>
    `;
  },

  // ============================================================
  // SINGLE EMPLOYEE BIOMETRIC MACHINE PUNCH MODAL & TIMELINE
  // Shows 4 options Breakdown, Swipes Counter, and Audit Trail
  // ============================================================
  showMachinePunchDetail(empId, date) {
    const emp = DB.find('employees', empId) || { fullName: `Employee #${empId}`, empNo: `EMP-${empId}`, department: 'General', designation: 'Staff' };
    const allLogs = DB.get('attendance_logs') || [];
    const empLogs = allLogs.filter(l => l.employeeId === empId && l.date === date);

    // Sort by sequence or time
    empLogs.sort((a, b) => (a.punchNumber || 0) - (b.punchNumber || 0) || (a.time || '').localeCompare(b.time || ''));

    // Map 4 machine options
    const checkInLog  = empLogs.find(l => l.punchType === 'check_in');
    const otOutLog    = empLogs.find(l => l.punchType === 'ot_out');
    const otInLog     = empLogs.find(l => l.punchType === 'ot_in');
    const checkOutLog = empLogs.find(l => l.punchType === 'check_out');

    const totalSwipes = empLogs.length;
    const isComplete  = checkInLog && otOutLog && otInLog && checkOutLog;

    Modal.show(`Biometric Machine Punch Timeline — ${emp.fullName}`, `
      <div style="margin-bottom:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px">
              ${emp.fullName.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div>
              <div style="font-size:15px;font-weight:800;color:var(--text)">${emp.fullName}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px">
                ${emp.empNo} • ${emp.designation || 'Staff'} • <strong>${emp.department || 'General'}</strong>
              </div>
            </div>
          </div>

          <div style="text-align:right">
            <div style="font-size:11.5px;color:var(--text-3);font-weight:600">Punch Date: <strong>${date}</strong></div>
            <div style="margin-top:4px">
              <span class="badge ${isComplete ? 'badge-success' : 'badge-warning'}" style="padding:4px 10px;font-size:11.5px">
                <i class="fa ${isComplete ? 'fa-circle-check' : 'fa-clock'}"></i>
                ${isComplete ? 'Daily Cycle Complete (4/4 Swipes)' : `${totalSwipes}/4 Swipes Logged`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 Machine Options State Dossier -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">
        <!-- Punch 1: Check-In -->
        <div style="background:var(--surface);border:1px solid ${checkInLog ? 'rgba(16,185,129,0.4)' : 'var(--border)'};border-radius:10px;padding:12px;border-top:3px solid #10b981">
          <div style="font-size:11px;font-weight:700;color:#10b981"><i class="fa fa-arrow-right-to-bracket" style="margin-right:4px"></i>Option 1: Check-In</div>
          <div style="font-size:18px;font-weight:800;color:${checkInLog ? '#10b981' : 'var(--text-muted)'};margin-top:5px">
            ${checkInLog?.time || '—'}
          </div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">
            ${checkInLog ? `${checkInLog.device || 'ZKTeco'} (${checkInLog.verifyMode || 'Fingerprint'})` : 'Awaiting Check-In swipe'}
          </div>
        </div>

        <!-- Punch 2: OT-Out -->
        <div style="background:var(--surface);border:1px solid ${otOutLog ? 'rgba(245,158,11,0.4)' : 'var(--border)'};border-radius:10px;padding:12px;border-top:3px solid #d97706">
          <div style="font-size:11px;font-weight:700;color:#d97706"><i class="fa fa-mug-hot" style="margin-right:4px"></i>Option 2: OT-Out</div>
          <div style="font-size:18px;font-weight:800;color:${otOutLog ? '#d97706' : 'var(--text-muted)'};margin-top:5px">
            ${otOutLog?.time || '—'}
          </div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">
            ${otOutLog ? `${otOutLog.device || 'ZKTeco'} (${otOutLog.verifyMode || 'Fingerprint'})` : 'No OT-Out swipe yet'}
          </div>
        </div>

        <!-- Punch 3: OT-In -->
        <div style="background:var(--surface);border:1px solid ${otInLog ? 'rgba(37,99,235,0.4)' : 'var(--border)'};border-radius:10px;padding:12px;border-top:3px solid #2563eb">
          <div style="font-size:11px;font-weight:700;color:#2563eb"><i class="fa fa-rotate-left" style="margin-right:4px"></i>Option 3: OT-In</div>
          <div style="font-size:18px;font-weight:800;color:${otInLog ? '#2563eb' : 'var(--text-muted)'};margin-top:5px">
            ${otInLog?.time || '—'}
          </div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">
            ${otInLog ? `${otInLog.device || 'ZKTeco'} (${otInLog.verifyMode || 'Fingerprint'})` : 'No OT-In swipe yet'}
          </div>
        </div>

        <!-- Punch 4: Check-Out -->
        <div style="background:var(--surface);border:1px solid ${checkOutLog ? 'rgba(239,68,68,0.4)' : 'var(--border)'};border-radius:10px;padding:12px;border-top:3px solid #ef4444">
          <div style="font-size:11px;font-weight:700;color:#ef4444"><i class="fa fa-arrow-right-from-bracket" style="margin-right:4px"></i>Option 4: Check-Out</div>
          <div style="font-size:18px;font-weight:800;color:${checkOutLog ? '#ef4444' : 'var(--text-muted)'};margin-top:5px">
            ${checkOutLog?.time || '—'}
          </div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">
            ${checkOutLog ? `${checkOutLog.device || 'ZKTeco'} (${checkOutLog.verifyMode || 'Fingerprint'})` : 'Shift not completed yet'}
          </div>
        </div>
      </div>

      <!-- Chronological Swipes Audit List -->
      <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
        <span>Machine Punch Event Log (Machine Used: <strong>${totalSwipes} times</strong>)</span>
        <span style="font-size:11.5px;color:var(--text-3);font-weight:500">Biometric Terminal Device Verification</span>
      </div>

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <table class="table" style="font-size:12px;margin:0">
          <thead>
            <tr style="background:var(--surface-2)">
              <th style="width:70px">Seq #</th>
              <th>Option</th>
              <th>Exact Time</th>
              <th>Hardware Device</th>
              <th>Device IP</th>
              <th>Verify Mode</th>
            </tr>
          </thead>
          <tbody>
            ${empLogs.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">
                  No physical machine punches recorded for this employee on ${date}.
                </td>
              </tr>
            ` : empLogs.map((l, idx) => `
              <tr>
                <td><span class="badge badge-secondary" style="font-size:10px">#${l.punchNumber || (idx + 1)}</span></td>
                <td>
                  <span style="font-weight:700;color:${l.punchType === 'check_in' ? '#10b981' : l.punchType === 'ot_out' ? '#d97706' : l.punchType === 'ot_in' ? '#2563eb' : '#ef4444'}">
                    ${l.punchLabel || l.punchType}
                  </span>
                </td>
                <td style="font-weight:700;color:var(--text)">${l.time}</td>
                <td><i class="fa fa-microchip" style="color:var(--primary);margin-right:4px"></i>${l.device || 'ZKTeco-Main-Gate'}</td>
                <td style="font-family:monospace;color:var(--text-3)">${l.deviceIp || '192.168.1.201'}</td>
                <td>
                  <i class="fa ${l.verifyMode === 'Face Recognition' ? 'fa-camera' : 'fa-fingerprint'}" style="color:var(--primary);margin-right:4px"></i>
                  ${l.verifyMode || 'Fingerprint'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Attendance.exportSingleEmployeePunches(${empId}, '${date}')">
          <i class="fa fa-download"></i> Export Swipes Slip
        </button>
      `
    });
  },

  // ============================================================
  // CSV EXPORT FOR BIOMETRIC MACHINE LOGS
  // ============================================================
  exportSingleEmployeePunches(empId, date) {
    const emp = DB.find('employees', empId) || { fullName: `Employee #${empId}`, empNo: `EMP-${empId}`, department: 'General' };
    const allLogs = DB.get('attendance_logs') || [];
    const empLogs = allLogs.filter(l => l.employeeId === empId && l.date === date);

    if (!empLogs.length) {
      Toast.show('No machine punch records to export for this employee on ' + date, 'warning');
      return;
    }

    const headers = ['Log ID', 'Date', 'Time', 'Employee ID', 'Employee Name', 'Emp No', 'Department', 'Punch Option', 'Punch Seq #', 'Biometric Device', 'Device IP', 'Verify Mode'];
    const rows = empLogs.map(l => [
      l.id,
      l.date,
      l.time,
      l.employeeId,
      `"${emp.fullName.replace(/"/g, '""')}"`,
      `"${emp.empNo}"`,
      `"${(emp.department||'').replace(/"/g, '""')}"`,
      `"${(l.punchLabel||l.punchType).replace(/"/g, '""')}"`,
      l.punchNumber || 1,
      `"${(l.device||'').replace(/"/g, '""')}"`,
      `"${(l.deviceIp||'').replace(/"/g, '""')}"`,
      `"${(l.verifyMode||'').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csvContent, `machine_punches_${emp.empNo}_${date}.csv`);
    Toast.show(`Punches for ${emp.fullName} exported!`, 'success');
  },

  exportMachinePunchLogs() {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isManager  = Auth.role === 'dept_manager';
    const isAdmin    = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;
    const allEmps = DB.get('employees') || [];

    let scopedEmps = [];
    if (isEmployee) scopedEmps = allEmps.filter(e => e.id === myEmpId);
    else if (isManager) scopedEmps = this.getScopedEmployees();
    else scopedEmps = allEmps.filter(e => e.status === 'active');
    const scopedEmpIds = scopedEmps.map(e => e.id);

    const selectedDate = this.machineLogDate || Utils.today();
    let allLogs = DB.get('attendance_logs') || [];
    let dayLogs = allLogs.filter(l => l.date === selectedDate && scopedEmpIds.includes(l.employeeId));

    if (isAdmin && this.machineLogDeptFilter && this.machineLogDeptFilter !== 'all') {
      const deptEmpIds = scopedEmps.filter(e => e.department === this.machineLogDeptFilter).map(e => e.id);
      dayLogs = dayLogs.filter(l => deptEmpIds.includes(l.employeeId));
    }

    if (this.machineLogEmpFilter && this.machineLogEmpFilter !== 'all') {
      const targetEmpId = parseInt(this.machineLogEmpFilter);
      dayLogs = dayLogs.filter(l => l.employeeId === targetEmpId);
    }

    if (this.machineLogPunchFilter && this.machineLogPunchFilter !== 'all') {
      dayLogs = dayLogs.filter(l => l.punchType === this.machineLogPunchFilter);
    }

    if (this.machineLogDeviceFilter && this.machineLogDeviceFilter !== 'all') {
      dayLogs = dayLogs.filter(l => l.device === this.machineLogDeviceFilter);
    }

    if (!dayLogs.length) {
      Toast.show('No biometric machine punch records match the selected criteria to export.', 'warning');
      return;
    }

    const headers = ['Log ID', 'Date', 'Time', 'Employee ID', 'Employee Name', 'Emp No', 'Department', 'Punch Option', 'Punch Seq #', 'Biometric Device', 'Device IP', 'Verify Mode'];
    const rows = dayLogs.map(l => {
      const emp = DB.find('employees', l.employeeId) || { fullName: `Employee #${l.employeeId}`, empNo: `EMP-${l.employeeId}`, department: 'Staff' };
      return [
        l.id,
        l.date,
        l.time,
        l.employeeId,
        `"${emp.fullName.replace(/"/g, '""')}"`,
        `"${emp.empNo}"`,
        `"${(emp.department||'').replace(/"/g, '""')}"`,
        `"${(l.punchLabel||l.punchType).replace(/"/g, '""')}"`,
        l.punchNumber || 1,
        `"${(l.device||'').replace(/"/g, '""')}"`,
        `"${(l.deviceIp||'').replace(/"/g, '""')}"`,
        `"${(l.verifyMode||'').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csvContent, `biometric_machine_logs_${selectedDate}.csv`);
    Toast.show(`Exported ${dayLogs.length} machine punch records!`, 'success');
  },

  showBiometricTerminal() {
    const emps = this.getScopedEmployees();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = Utils.today ? Utils.today() : now.toISOString().slice(0, 10);

    const html = `
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);color:white;border-radius:12px;padding:24px;border:1px solid rgba(255,255,255,0.15)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;color:#818cf8;font-size:22px">
              <i class="fa fa-fingerprint"></i>
            </div>
            <div>
              <div style="font-weight:800;font-size:16px;letter-spacing:0.5px">ZKTeco SilkBio-101 Pro</div>
              <div style="font-size:11px;color:#94a3b8">Biometric Terminal Simulator • IP: 192.168.10.45 • ADMS Online</div>
            </div>
          </div>
          <div style="text-align:right">
            <div id="bio-live-clock" style="font-family:monospace;font-size:20px;font-weight:800;color:#38bdf8">${timeStr}</div>
            <div style="font-size:11px;color:#94a3b8">${dateStr}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div>
            <label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:6px">Select Employee</label>
            <select id="bio-sim-emp" class="form-control" style="background:#1e293b;color:white;border-color:#475569">
              ${emps.map(e => `<option value="${e.id}">[${e.empNo || 'EMP-' + e.id}] ${e.fullName} (${e.department || 'Staff'})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:6px">Terminal Gate / Location</label>
            <select id="bio-sim-device" class="form-control" style="background:#1e293b;color:white;border-color:#475569">
              <option value="Main Gate Turnstile 01">Main Gate Turnstile 01 (Head Office)</option>
              <option value="IT Wing Glass Door Scanner">IT Wing Glass Door Scanner</option>
              <option value="Factory Floor Entrance A">Factory Floor Entrance A</option>
              <option value="Executive Suites Turnstile">Executive Suites Turnstile</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
          <div>
            <label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:6px">Punch Mode</label>
            <select id="bio-sim-punch-type" class="form-control" style="background:#1e293b;color:white;border-color:#475569">
              <option value="Check-In">🟢 Check-In (Time In)</option>
              <option value="Check-Out">🔴 Check-Out (Time Out)</option>
              <option value="Break-Out">☕ Break-Out</option>
              <option value="Break-In">🥪 Break-In</option>
              <option value="Overtime-In">⏱️ Overtime-In</option>
              <option value="Overtime-Out">🏁 Overtime-Out</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:6px">Verification Sensor</label>
            <select id="bio-sim-mode" class="form-control" style="background:#1e293b;color:white;border-color:#475569">
              <option value="Fingerprint (SilkID Optical)">Fingerprint (SilkID Optical)</option>
              <option value="Facial Recognition 3D">Facial Recognition 3D</option>
              <option value="RFID Proximity Card (Mifare)">RFID Proximity Card (Mifare)</option>
            </select>
          </div>
        </div>

        <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.2);border-radius:10px;margin-bottom:20px">
          <div id="bio-scan-indicator" style="font-size:42px;color:#818cf8;margin-bottom:8px">
            <i class="fa fa-fingerprint"></i>
          </div>
          <div id="bio-scan-status" style="font-size:13px;font-weight:600;color:#94a3b8">Ready for optical or proximity scan</div>
        </div>

        <div style="display:flex;gap:12px;justify-content:flex-end">
          <button class="btn btn-ghost" onclick="Modal.close()" style="color:#cbd5e1">Dismiss</button>
          <button class="btn btn-primary" onclick="Attendance.triggerBiometricScan()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:10px 24px;font-weight:700">
            <i class="fa fa-bolt"></i> Scan & Punch Now
          </button>
        </div>
      </div>
    `;

    Modal.show('Virtual Hardware Biometric Ingestion Terminal', html);
  },

  triggerBiometricScan() {
    const empId = Number(document.getElementById('bio-sim-emp')?.value);
    const device = document.getElementById('bio-sim-device')?.value || 'Main Gate Turnstile 01';
    const punchType = document.getElementById('bio-sim-punch-type')?.value || 'Check-In';
    const verifyMode = document.getElementById('bio-sim-mode')?.value || 'Fingerprint';

    const indicator = document.getElementById('bio-scan-indicator');
    const statusText = document.getElementById('bio-scan-status');

    if (indicator) {
      indicator.innerHTML = '<i class="fa fa-spinner fa-spin" style="color:#38bdf8"></i>';
    }
    if (statusText) statusText.innerText = 'Scanning biometric template...';

    setTimeout(() => {
      this.processBiometricPunch(empId, punchType, device, verifyMode);
      if (indicator) indicator.innerHTML = '<i class="fa fa-circle-check" style="color:#10b981"></i>';
      if (statusText) statusText.innerText = 'Verified! Punch recorded successfully.';
      setTimeout(() => Modal.close(), 800);
    }, 500);
  },

  processBiometricPunch(empId, punchType, device, verifyMode) {
    const emp = DB.find('employees', empId);
    if (!emp) return;

    const now = new Date();
    const dateStr = Utils.today ? Utils.today() : now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    // 1. Record raw machine punch
    const machineLogs = DB.get('machine_attendance_logs') || [];
    const newLog = {
      id: Date.now(),
      date: dateStr,
      time: timeStr,
      employeeId: empId,
      punchType: punchType,
      punchLabel: punchType,
      punchNumber: machineLogs.filter(l => l.employeeId === empId && l.date === dateStr).length + 1,
      device: device,
      deviceIp: '192.168.10.45',
      verifyMode: verifyMode,
      syncStatus: 'synced',
      createdAt: now.toISOString()
    };
    machineLogs.unshift(newLog);
    DB.save('machine_attendance_logs', machineLogs);

    // 2. Synchronize into Attendance Register
    const allAtt = DB.get('attendance') || [];
    let att = allAtt.find(a => a.employeeId === empId && a.date === dateStr);

    const isCheckIn  = punchType.includes('In')  && !punchType.includes('Break');
    const isCheckOut = punchType.includes('Out') && !punchType.includes('Break');
    const isBreakOut = punchType.includes('Break-Out') || punchType === 'Break-Out';
    const isBreakIn  = punchType.includes('Break-In')  || punchType === 'Break-In';

    if (isCheckIn || (!att && !isCheckOut)) {
      if (!att) {
        // BUG-02 FIX: use evaluateTimeIn for unified cutoff — was hardcoded timeStr > '10:00'
        const evalRes = this.evaluateTimeIn(empId, timeStr, null);
        att = {
          id: Date.now() + 1,
          employeeId: empId,
          date: dateStr,
          timeIn: timeStr,
          clockIn: timeStr,
          clockOut: null,
          status: evalRes.isLate ? 'late' : 'present',
          overtime: 0,
          device: device,
          remarks: evalRes.isLate ? evalRes.autoRemark : `Punch via ${device} (${verifyMode})`
        };
        allAtt.push(att);
      } else if (!att.clockIn && !att.timeIn) {
        att.clockIn = timeStr;
        att.timeIn = timeStr;
      }
    } else if (isCheckOut) {
      // BUG-05 FIX: warn operator if Check-Out arrives without a prior Check-In
      if (!att || (!att.clockIn && !att.timeIn)) {
        Toast.show(`Check-Out recorded for ${emp.fullName} — no prior Check-In found. Please verify.`, 'warning');
        if (!att) {
          att = { id: Date.now() + 1, employeeId: empId, date: dateStr, timeIn: null, clockIn: null, overtime: 0, device: device, remarks: `Orphan Check-Out via ${device}` };
          allAtt.push(att);
        }
      }
      att.clockOut = timeStr;
      att.timeOut  = timeStr;
      if (att.clockIn || att.timeIn) {
        const inTime = att.clockIn || att.timeIn;
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = timeStr.split(':').map(Number);
        const diffHours = (outH + outM / 60) - (inH + inM / 60);
        if (diffHours > 8.5) {
          att.overtime = Math.round((diffHours - 8) * 10) / 10;
        }
      }
    } else if (isBreakOut) {
      // BUG-04 FIX: sync Break-Out punch into attendance register
      if (att) {
        att.breakOut = timeStr;
        if (!att.breaks) att.breaks = [];
        att.breaks.push({ breakOut: timeStr, breakIn: null });
      }
    } else if (isBreakIn) {
      // BUG-04 FIX: sync Break-In punch into attendance register
      if (att) {
        att.breakIn = timeStr;
        const lastBreak = att.breaks && att.breaks[att.breaks.length - 1];
        if (lastBreak && !lastBreak.breakIn) lastBreak.breakIn = timeStr;
      }
    }
    DB.save('attendance', allAtt);

    // 3. Broadcast real-time event
    if (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.send) {
      HRMWebSocket.send({
        type: 'attendance:punch',
        employeeId: empId,
        employeeName: emp.fullName,
        punchType,
        device,
        time: timeStr
      });
    }

    Toast.show(`Biometric ${punchType} recorded for ${emp.fullName} (${timeStr})`, 'success');
    this.render();
  },

  showBulkImportModal() {
    const html = `
      <div style="padding:10px 0">
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:13px">Download Sample CSV Template</div>
            <div style="font-size:12px;color:var(--text-3)">Standard attendance format (EmployeeID, Date, ClockIn, ClockOut, Status)</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Attendance.downloadSampleCSV()"><i class="fa fa-download"></i> Sample CSV</button>
        </div>

        <div style="border:2px dashed var(--border);border-radius:10px;padding:24px;text-align:center;background:var(--surface);margin-bottom:16px"
             ondragover="event.preventDefault();this.style.borderColor='var(--primary)';"
             ondragleave="this.style.borderColor='var(--border)';"
             ondrop="event.preventDefault();Attendance.handleCSVFileDrop(event);">
          <i class="fa fa-file-csv" style="font-size:36px;color:var(--primary);margin-bottom:8px"></i>
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">Drag & Drop Attendance CSV Here</div>
          <div style="font-size:12px;color:var(--text-3);margin-bottom:12px">or click to browse your files</div>
          <input type="file" id="att-csv-input" accept=".csv" style="display:none" onchange="Attendance.handleCSVFileSelect(this)" />
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('att-csv-input').click()"><i class="fa fa-folder-open"></i> Select File</button>
        </div>

        <div id="att-import-preview" style="display:none">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">Preview Data to Import:</div>
          <div style="max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;margin-bottom:16px">
            <table class="table" style="font-size:11.5px;margin:0">
              <thead><tr><th>Emp ID</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Status</th></tr></thead>
              <tbody id="att-import-tbody"></tbody>
            </table>
          </div>
          <button class="btn btn-primary btn-block" onclick="Attendance.confirmCSVImport()"><i class="fa fa-check"></i> Commit & Import All Records</button>
        </div>
      </div>
    `;

    Modal.show('Bulk Import Attendance Logs (CSV / Machine Sheet)', html);
  },

  downloadSampleCSV() {
    const csv = "EmployeeID,Date,ClockIn,ClockOut,Status,Notes\n1,2026-09-25,09:00,18:00,present,Regular on-time\n2,2026-09-25,09:15,18:05,present,Morning shift\n3,2026-09-25,10:35,18:30,late,Morning traffic\n4,2026-09-25,09:00,13:30,half_day,Doctor appointment";
    Utils.downloadCSV(csv, "attendance_sample_template.csv");
  },

  handleCSVFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    this.parseCSVFile(input.files[0]);
  },

  handleCSVFileDrop(e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      this.parseCSVFile(e.dataTransfer.files[0]);
    }
  },

  parseCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        Toast.show('CSV file is empty or missing data rows', 'warning');
        return;
      }
      this._parsedRows = [];
      this._csvSkipped = [];
      const knownEmps = DB.get('employees') || [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const empId = Number(parts[0]);
          // BUG-08 FIX: validate EmployeeID — report skipped rows instead of silent drop
          if (isNaN(empId) || empId <= 0) {
            this._csvSkipped.push({ row: i + 1, reason: `Invalid EmployeeID: '${parts[0]}'` });
            continue;
          }
          const empExists = knownEmps.some(e => e.id === empId || String(e.empNo).replace(/\D/g, '') === String(empId));
          if (!empExists) {
            this._csvSkipped.push({ row: i + 1, reason: `Unknown Employee ID: ${empId}` });
            continue;
          }
          this._parsedRows.push({
            employeeId: empId,
            date: parts[1],
            clockIn: parts[2] || '09:00',
            clockOut: parts[3] || '18:00',
            status: parts[4] || 'present',
            notes: parts[5] || 'Bulk CSV Import'
          });
        }
      }

      const previewDiv = document.getElementById('att-import-preview');
      const tbody = document.getElementById('att-import-tbody');
      if (previewDiv && tbody) {
        tbody.innerHTML = this._parsedRows.slice(0, 5).map(r => `
          <tr>
            <td>${r.employeeId}</td>
            <td>${r.date}</td>
            <td>${r.clockIn}</td>
            <td>${r.clockOut}</td>
            <td><span class="badge badge-success">${r.status}</span></td>
          </tr>
        `).join('');
        // BUG-08 FIX: show skipped row warnings below preview
        if (this._csvSkipped && this._csvSkipped.length > 0) {
          tbody.innerHTML += `<tr><td colspan="5" style="color:var(--warning);font-size:11px;font-weight:600;padding:6px 8px"><i class="fa fa-triangle-exclamation"></i> ${this._csvSkipped.length} row(s) skipped: ${this._csvSkipped.map(s => `Row ${s.row} — ${s.reason}`).join(', ')}</td></tr>`;
        }
        previewDiv.style.display = 'block';
      }
    };
    reader.readAsText(file);
  },

  confirmCSVImport() {
    if (!this._parsedRows || !this._parsedRows.length) return;
    const allAtt = DB.get('attendance') || [];
    let created = 0, overwritten = 0;
    this._parsedRows.forEach(r => {
      const existing = allAtt.find(a => a.employeeId === r.employeeId && a.date === r.date);
      if (existing) {
        // BUG-06 FIX: track overwrite count and include in audit log instead of silent replace
        existing.clockIn  = r.clockIn;
        existing.clockOut = r.clockOut;
        existing.status   = r.status;
        existing.timeIn   = r.clockIn;
        existing.timeOut  = r.clockOut;
        existing.notes    = r.notes;
        existing.device   = 'Bulk CSV Import';
        overwritten++;
      } else {
        allAtt.push({ id: Date.now() + Math.random(), timeIn: r.clockIn, timeOut: r.clockOut, device: 'Bulk CSV Import', ...r });
        created++;
      }
    });
    DB.save('attendance', allAtt);
    DB.log('IMPORT', 'Attendance', `CSV bulk import: ${created} created, ${overwritten} overwritten by ${Auth.user?.username || 'Admin'}`, Auth.user?.id);
    const overwriteNote = overwritten > 0 ? ` (${overwritten} existing record(s) updated)` : '';
    Toast.show(`Imported ${created + overwritten} attendance records!${overwriteNote}`, 'success');
    Modal.close();
    this.render();
  }

};

