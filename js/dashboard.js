// ============================================================
// HRM SYSTEM — Dashboard Module
// ============================================================

const Dashboard = {
  charts: {},
  inboxCollapsed: typeof localStorage !== 'undefined' ? localStorage.getItem('hrm_inbox_collapsed') === 'true' : false,
  inboxFilter: 'all',
  tickerSpeed: typeof localStorage !== 'undefined' ? (localStorage.getItem('hrm_ticker_speed') || '1x') : '1x',

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

  refreshInbox() {
    const container = document.getElementById('dashboard-action-inbox');
    if (container) {
      container.outerHTML = this.renderActionCenterInbox();
    }
  },

  renderHeadlinesTicker(tickerItemsHtml) {
    const isSlow = this.tickerSpeed === '0.5x';
    return `
      <div class="dash-ticker">
        <div class="ticker-badge">
          <span class="ticker-live-dot"></span>
          <i class="fa fa-bolt"></i> HEADLINES
        </div>
        <div class="ticker-track-wrap">
          <div class="ticker-track ${isSlow ? 'slow' : ''}" id="dash-ticker-track">
            ${tickerItemsHtml}
            ${tickerItemsHtml}
          </div>
        </div>
        <div class="ticker-controls">
          <button class="ticker-ctrl-btn" id="ticker-play-btn" onclick="Dashboard.toggleTickerPlay()" title="Pause/Play Headlines">
            <i class="fa fa-pause"></i>
          </button>
          <button class="ticker-ctrl-btn" id="ticker-speed-btn" onclick="Dashboard.toggleTickerSpeed()" title="Toggle Speed (1x / 0.5x)">
            <i class="fa fa-gauge"></i> ${this.tickerSpeed || '1x'}
          </button>
          <button class="ticker-ctrl-btn" onclick="Dashboard.showAllHeadlinesModal()" title="View All Events & Notices">
            <i class="fa fa-list"></i>
          </button>
        </div>
      </div>
    `;
  },

  quickSelfPunch(type) {
    const today = Utils.today();
    const myId = Auth.employee?.id;
    if (!myId) return;
    const allAtt = DB.get('attendance') || [];
    let rec = allAtt.find(a => a.employeeId === myId && a.date === today);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (type === 'in') {
      if (rec && rec.timeIn) {
        Toast.show('Already checked in today at ' + rec.timeIn, 'info');
        return;
      }
      const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
      if (rec) {
        rec.timeIn = timeStr;
        rec.status = isLate ? 'late' : 'present';
        DB.set('attendance', allAtt);
      } else {
        const newRec = {
          id: DB.nextId('attendance'),
          employeeId: myId,
          date: today,
          timeIn: timeStr,
          breakOut: '',
          breakIn: '',
          timeOut: '',
          status: isLate ? 'late' : 'present',
          overtime: 0,
          device: 'ZKTeco-Main-Gate',
          remarks: 'Self Check-In'
        };
        DB.add('attendance', newRec);
        rec = newRec;
      }
    } else if (type === 'ot_out' || type === 'b_out') {
      if (!rec || !rec.timeIn) {
        Toast.show('Please check in first before recording OT-Out', 'warning');
        return;
      }
      if (rec.breakOut) {
        Toast.show('OT-Out already recorded at ' + rec.breakOut, 'info');
        return;
      }
      rec.breakOut = timeStr;
      DB.set('attendance', allAtt);
    } else if (type === 'ot_in' || type === 'b_in') {
      if (!rec || !rec.breakOut) {
        Toast.show('Please record OT-Out before recording OT-In', 'warning');
        return;
      }
      if (rec.breakIn) {
        Toast.show('OT-In already recorded at ' + rec.breakIn, 'info');
        return;
      }
      rec.breakIn = timeStr;
      DB.set('attendance', allAtt);
    } else if (type === 'out') {
      if (!rec || !rec.timeIn) {
        Toast.show('Please check in first before checking out', 'warning');
        return;
      }
      rec.timeOut = timeStr;
      const ot = (typeof Attendance !== 'undefined' && Attendance.calcOvertime)
        ? Attendance.calcOvertime(rec.timeIn, rec.timeOut, rec.breakOut, rec.breakIn)
        : 0;
      rec.overtime = ot;
      DB.set('attendance', allAtt);
    }

    // Record in attendance_logs machine telemetry
    const punchLabel = type === 'in' ? 'Check-In' : (type === 'ot_out' || type === 'b_out' ? 'OT-Out' : (type === 'ot_in' || type === 'b_in' ? 'OT-In' : 'Check-Out'));
    const punchType = type === 'in' ? 'check_in' : (type === 'ot_out' || type === 'b_out' ? 'ot_out' : (type === 'ot_in' || type === 'b_in' ? 'ot_in' : 'check_out'));
    const allLogs = DB.get('attendance_logs') || [];
    const empDayLogs = allLogs.filter(l => l.employeeId === myId && l.date === today);
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
      device: 'ZKTeco-Main-Gate',
      deviceIp: '192.168.1.201',
      verifyMode: 'Biometric / Fingerprint'
    });
    DB.set('attendance_logs', allLogs);

    if (rec) {
      rec.punchCount = punchNumber;
      rec.completionStatus = (rec.timeIn && rec.breakOut && rec.breakIn && rec.timeOut) ? 'Complete' : 'In Progress';
      DB.set('attendance', allAtt);
    }

    if (type === 'in') {
      Toast.show(`Check-In recorded at ${timeStr} (Swipe #${punchNumber})`, 'success');
    } else if (type === 'ot_out' || type === 'b_out') {
      Toast.show(`OT-Out recorded at ${timeStr} (Swipe #${punchNumber})`, 'info');
    } else if (type === 'ot_in' || type === 'b_in') {
      Toast.show(`OT-In recorded at ${timeStr} (Swipe #${punchNumber})`, 'success');
    } else if (type === 'out') {
      Toast.show(`Check-Out recorded at ${timeStr} (Swipe #${punchNumber}). Daily shift completed!`, 'success');
    }
    this.render();
  },

  render() {
    const content = document.getElementById('page-content');
    const att = DB.get('attendance');
    const emps = DB.get('employees');
    const leaves = DB.get('leave_requests');
    const salary = DB.get('salary');
    const reviews = DB.get('performance_reviews');
    const holidays = DB.get('holidays');
    const today = Utils.today();

    let scopedEmps = Auth.getScopedEmployees(emps);
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
    
    const scopedReviews = Auth.role === 'dept_manager' ? reviews.filter(r => scopedIds.includes(r.employeeId)) : reviews;
    const pendingReviews = scopedReviews.filter(r => r.status === 'pending').length;
    const doneReviews    = scopedReviews.filter(r => r.status === 'completed').length;

    // Birthdays, Holidays, Announcements, Anniversaries for Headlines Ticker
    const todayMMDD = today.slice(5);
    const todayBdays = scopedEmps.filter(e => e.dob?.slice(5) === todayMMDD && e.status === 'active');
    const upcomingBdays = scopedEmps.filter(e => {
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
    }).sort((a,b) => a.dob.slice(5).localeCompare(b.dob.slice(5)));

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
        tag: "TODAY'S BIRTHDAY",
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
        tag: 'UPCOMING BIRTHDAY',
        text: `🎂 <strong>${e.fullName}</strong> on ${bd.toLocaleDateString('en-US', { month:'short', day:'numeric' })} (${diffDays} days away) 🎈`,
        action: `Dashboard.showBirthdayWishModal(${e.id})`
      });
    });

    // 3. Upcoming Holidays
    upcomingHols.forEach(h => {
      headlines.push({
        type: 'holiday',
        icon: 'fa-umbrella-beach',
        tag: 'COMPANY HOLIDAY',
        text: `🌴 <strong>${h.name}</strong> on ${Utils.formatDate(h.date)} (${h.type.toUpperCase()})`,
        action: `App.navigate('events')`
      });
    });

    // 4. Company Announcements
    announcements.slice(0, 4).forEach(a => {
      headlines.push({
        type: 'announcement',
        icon: 'fa-bullhorn',
        tag: (a.priority || 'notice').toUpperCase() + ' NOTICE',
        text: `📢 <strong>${a.title}</strong> — ${a.body.slice(0, 60)}…`,
        action: `Dashboard.showAnnouncementModal(${a.id})`
      });
    });

    // 5. Work Anniversaries
    anniversaries.forEach(e => {
      headlines.push({
        type: 'anniversary',
        icon: 'fa-award',
        tag: 'WORK ANNIVERSARY',
        text: `⭐ <strong>${e.fullName}</strong> completed <strong>${e.years} year${e.years>1?'s':''}</strong> with HRM Pro! 🏆`,
        action: `Employees.renderProfile(${e.id})`
      });
    });

    // 6. Action Alerts
    if (pendingLeaves > 0) {
      headlines.push({
        type: 'alert',
        icon: 'fa-clock',
        tag: 'ACTION REQUIRED',
        text: `⚡ <strong>${pendingLeaves} Leave Request${pendingLeaves>1?'s':''}</strong> awaiting manager & HR approval.`,
        action: `App.navigate('leaves')`
      });
    }

    if (processedSalary > 0) {
      headlines.push({
        type: 'alert',
        icon: 'fa-money-bill-wave',
        tag: 'PAYROLL READY',
        text: `💰 August 2026 Payroll is processed and ready for disbursement.`,
        action: `App.navigate('payroll')`
      });
    }

    const tickerItemsHtml = headlines.map(h => `
      <span class="ticker-item ${h.type}" onclick="${h.action}" title="Click to view details">
        <i class="fa ${h.icon}"></i>
        <span style="font-size:10px;font-weight:800;letter-spacing:0.5px;opacity:0.9;margin-right:2px">[${h.tag}]</span>
        ${h.text}
      </span>
      <span class="ticker-sep">✦</span>
    `).join('');

    // Check scope: if SELF, render dedicated Employee Self-Service Dashboard
    if (Auth.getScope('dashboard') === 'SELF') {
      this.renderEmployeeDashboard(content, headlines, upcomingHols, upcomingBdays, today);
      return;
    }

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Bar: Overview Header & Recent Activity Button (Right Corner) -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <h2 style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-0.5px">Dashboard Overview</h2>
              <span class="badge badge-success" style="font-size:11px;padding:3px 9px"><i class="fa fa-circle" style="font-size:7px;margin-right:4px"></i>Live System</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              ${new Date().toLocaleDateString('en-PK', { weekday:'long', month:'long', day:'numeric', year:'numeric' })} • Welcome back, ${Auth.employee?.firstName || Auth.employee?.fullName || 'User'}!
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-secondary btn-sm" onclick="App.openHistoryDrawer()" title="View browser-style activity history drawer (Ctrl+H)" style="box-shadow:0 2px 10px rgba(79,128,247,0.18)">
              <i class="fa fa-clock-rotate-left"></i> Activity History
              <span class="badge badge-primary" id="dash-history-badge" style="margin-left:6px">${auditLogs.length}</span>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="Dashboard.render()" title="Refresh Dashboard Data">
              <i class="fa fa-rotate"></i> Refresh
            </button>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════
             MOVING HEADLINES TICKER (Birthdays & Events)
        ═══════════════════════════════════════════════ -->
        ${this.renderHeadlinesTicker(tickerItemsHtml)}

        ${Auth.role === 'onboarding' ? `
          <!-- New Joiner Welcome & Induction Checklist Card -->
          <div class="card" style="background:linear-gradient(135deg, rgba(245,158,11,0.14), rgba(79,128,247,0.1));border:1.5px solid rgba(245,158,11,0.4);border-radius:14px;padding:22px;margin-bottom:24px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
              <div style="display:flex;align-items:center;gap:14px">
                <div style="width:52px;height:52px;border-radius:14px;background:rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:26px">
                  <i class="fa fa-clipboard-check"></i>
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="badge badge-warning" style="font-size:11px"><i class="fa fa-sparkles"></i> Welcome to the Team</span>
                    <span class="badge badge-info" style="font-size:11px"><i class="fa fa-user-clock"></i> Induction Stage</span>
                  </div>
                  <h2 style="font-size:19px;font-weight:800;color:var(--text);margin-top:4px">Complete Your Joining Onboarding & Document Upload</h2>
                  <p style="font-size:12.5px;color:var(--text-2);margin-top:2px">
                    Your account is currently in <strong>New Joiner Onboarding</strong> mode. Please fill in your profile info and upload mandatory documents. Once submitted, HR will finalize your role.
                  </p>
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-primary" onclick="App.navigate('profile')">
                  <i class="fa fa-id-card-clip"></i> Open Onboarding Profile
                </button>
                <button class="btn btn-secondary" onclick="Employees.showUploadDocumentModal(${Auth.employee.id})">
                  <i class="fa fa-upload"></i> Upload Documents
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- ═══════════════════════════════════════════════
             EXECUTIVE APPROVALS & PRIORITY ACTION INBOX
        ═══════════════════════════════════════════════ -->
        ${this.renderActionCenterInbox()}

        <!-- KPI Row 1: Employees -->
        <div class="mb-16" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <h3 style="font-size:13px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:1px">${Auth.role === 'dept_manager' ? 'Team Overview' : 'Employee Overview'}</h3>
        </div>
        <div class="grid-4 mb-20">
          ${this.statCard(Auth.role === 'dept_manager' ? 'Team Members' : 'Total Employees', totalEmps, 'fa-users', 'blue', `Active: ${totalEmps} | Inactive: ${inactiveEmps}`, Auth.role === 'dept_manager' ? 'Direct & Team' : '+2 this month', 'up')}
          ${this.statCard(Auth.role === 'dept_manager' ? 'Active in Team' : 'Active Employees', totalEmps, 'fa-user-check', 'green', `On probation: ${scopedEmps.filter(e=>e.employmentType==='Probation').length}`, '', '')}
          ${this.statCard(Auth.role === 'dept_manager' ? 'Inactive in Team' : 'Inactive Employees', inactiveEmps, 'fa-user-xmark', 'red', 'Ex-employees', '', '')}
          ${this.statCard(Auth.role === 'dept_manager' ? 'New Team Joiners' : 'New Joiners', newJoiners, 'fa-user-plus', 'purple', 'This month', '+' + newJoiners + ' this month', 'up')}
        </div>

        <!-- KPI Row 2: Attendance Today -->
        <div class="mb-16" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <h3 style="font-size:13px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:1px">${Auth.role === 'dept_manager' ? "Team Today's Attendance" : "Today's Attendance"} — ${Utils.formatDate(today)}</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('attendance')"><i class="fa fa-arrow-right"></i> View Full</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px">
          ${this.miniStatCard('Present',  present,  'fa-circle-check',    '#10b981')}
          ${this.miniStatCard('Absent',   absent,   'fa-circle-xmark',    '#ef4444')}
          ${this.miniStatCard('Late',     late,     'fa-clock',           '#f59e0b')}
          ${this.miniStatCard('Half Day', halfDay,  'fa-circle-half-stroke','#8b5cf6')}
          ${this.miniStatCard('On Leave', onLeave,  'fa-calendar-minus',  '#14b8a6')}
          ${this.miniStatCard('Overtime', todayAtt.filter(a=>a.overtime>0).length,'fa-business-time','#6366f1')}
        </div>

        <!-- Charts Row -->
        <div class="grid-2 mb-20">
          <div class="chart-card">
            <div class="card-header">
              <div><div class="card-title">Attendance Trend</div><div class="card-subtitle">Last 7 days</div></div>
            </div>
            <canvas id="chart-att-trend" height="220"></canvas>
          </div>
          <div class="chart-card">
            <div class="card-header">
              <div><div class="card-title">Leave Statistics</div><div class="card-subtitle">This year</div></div>
            </div>
            <canvas id="chart-leave-stats" height="220"></canvas>
          </div>
        </div>

        <div class="grid-3 mb-20">
          <div class="chart-card">
            <div class="card-header">
              <div><div class="card-title">Dept. Employees</div><div class="card-subtitle">Distribution</div></div>
            </div>
            <canvas id="chart-dept" height="220"></canvas>
          </div>
          <div class="chart-card">
            <div class="card-header">
              <div><div class="card-title">Monthly Joining</div><div class="card-subtitle">Last 6 months</div></div>
            </div>
            <canvas id="chart-joining" height="220"></canvas>
          </div>
          <div class="chart-card">
            <div class="card-header">
              <div><div class="card-title">Late Arrivals</div><div class="card-subtitle">This month</div></div>
            </div>
            <canvas id="chart-late" height="220"></canvas>
          </div>
        </div>

        <!-- Bottom Row: Leaves, Payroll, Performance, Birthdays -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">
          <!-- Leaves Summary -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-calendar-xmark" style="color:var(--warning);margin-right:8px"></i>Leave Summary</div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('leaves')">View All</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${[
                { label:'Pending',  val: pendingLeaves,  color: 'var(--warning)' },
                { label:'Approved', val: approvedLeaves, color: 'var(--success)' },
                { label:'Rejected', val: rejectedLeaves, color: 'var(--danger)'  },
              ].map(l => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border-radius:8px">
                  <span style="font-size:13px;color:var(--text-2)">${l.label}</span>
                  <span style="font-size:16px;font-weight:700;color:${l.color}">${l.val}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Payroll -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-money-bill-wave" style="color:var(--success);margin-right:8px"></i>Payroll — Aug 2026</div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('payroll')">View All</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${[
                { label:'Salary Pending',   val: pendingSalary,  color: 'var(--warning)' },
                { label:'Salary Processed', val: processedSalary,color: 'var(--success)' },
              ].map(l => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border-radius:8px">
                  <span style="font-size:13px;color:var(--text-2)">${l.label}</span>
                  <span style="font-size:16px;font-weight:700;color:${l.color}">${l.val}</span>
                </div>
              `).join('')}
              <div style="padding:10px 12px;background:var(--primary-glow);border-radius:8px;border:1px solid var(--primary-glow)">
                <div style="font-size:11px;color:var(--text-3)">${Auth.role === 'dept_manager' ? 'Team Net Paid' : 'Total Net Paid'}</div>
                <div style="font-size:18px;font-weight:800;color:var(--primary)">${Utils.formatCurrency(salary.filter(s=>s.status==='processed' && (Auth.role === 'dept_manager' ? scopedIds.includes(s.employeeId) : true)).reduce((a,s)=>a+s.netSalary,0))}</div>
              </div>
            </div>
          </div>

          <!-- Performance -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-chart-line" style="color:var(--accent);margin-right:8px"></i>Performance Q3 2026</div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('performance')">View All</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${[
                { label:'Pending Reviews',   val: pendingReviews, color: 'var(--warning)' },
                { label:'Completed Reviews', val: doneReviews,    color: 'var(--success)' },
              ].map(l => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border-radius:8px">
                  <span style="font-size:13px;color:var(--text-2)">${l.label}</span>
                  <span style="font-size:16px;font-weight:700;color:${l.color}">${l.val}</span>
                </div>
              `).join('')}
              <div style="padding:10px 12px;background:var(--accent-glow);border-radius:8px;border:1px solid var(--accent-glow)">
                <div style="font-size:11px;color:var(--text-3)">Avg. Rating</div>
                <div style="font-size:18px;font-weight:800;color:var(--accent)">★ 4.0 / 5</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div style="margin-bottom:20px">
          <h3 style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Quick Actions</h3>
          <div style="display:grid;grid-template-columns:repeat(${Auth.role === 'dept_manager' ? 4 : 6},1fr);gap:10px">
            ${[
              { label:'Add Employee', icon:'fa-user-plus', color:'#6366f1', action:"App.navigate('employees');setTimeout(()=>Employees.showAddForm(),100)" },
              { label:'Apply Leave', icon:'fa-calendar-plus', color:'#14b8a6', action:"App.navigate('leaves');setTimeout(()=>Leaves.showApplyForm(),100)" },
              { label:'Mark Attendance', icon:'fa-fingerprint', color:'#f59e0b', action:"App.navigate('attendance')" },
              { label:'Process Payroll', icon:'fa-money-check-dollar', color:'#10b981', action:"App.navigate('payroll')" },
              { label:'Performance', icon:'fa-chart-line', color:'#8b5cf6', action:"App.navigate('performance')" },
              { label:'View Reports', icon:'fa-file-chart-line', color:'#ec4899', action:"App.navigate('reports')" },
            ].filter(a => {
              if (Auth.role === 'dept_manager') {
                return !['Add Employee', 'Process Payroll'].includes(a.label);
              }
              return true;
            }).map(a => `
              <button class="quick-action-btn" onclick="${a.action}">
                <div class="qa-icon" style="background:${a.color}22;color:${a.color}"><i class="fa ${a.icon}"></i></div>
                ${a.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Pending Approvals, Birthdays & Holidays -->
        <div class="grid-3" style="margin-bottom:20px">
          <!-- Pending Approvals -->
          <div class="card">
            <div class="card-header">
              <div><div class="card-title"><i class="fa fa-clock" style="color:var(--warning);margin-right:8px"></i>Pending Approvals</div></div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('leaves')">View All</button>
            </div>
            ${(() => {
              const pendingLeaveList = scopedLeaves.filter(l => l.status === 'pending' || l.status === 'manager_approved').slice(0, 5);
              if (pendingLeaveList.length === 0) return '<div style="text-align:center;padding:20px;color:var(--text-muted)"><i class="fa fa-check-circle" style="font-size:28px;margin-bottom:8px;display:block;color:var(--success)"></i>All caught up!</div>';
              return pendingLeaveList.map(l => {
                const emp = emps.find(e => e.id === l.employeeId);
                return `
                  <div class="pending-item">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(l.employeeId)}">${Utils.avatarInitials(emp?.fullName||'?')}</div>
                    <div class="pi-info">
                      <div class="pi-name">${emp?.fullName||'—'}</div>
                      <div class="pi-detail">${l.days} day${l.days!==1?'s':''} leave • ${Utils.formatDate(l.from)} ${l.status==='manager_approved'?'<span class="badge badge-info">Mgr Approved</span>':''}</div>
                    </div>
                    <div style="display:flex;gap:4px">
                      <button class="btn btn-success btn-sm" onclick="Leaves.approve(${l.id});setTimeout(()=>App.navigate('dashboard'),200)"><i class="fa fa-check"></i></button>
                      <button class="btn btn-danger btn-sm" onclick="Leaves.reject(${l.id});setTimeout(()=>App.navigate('dashboard'),200)"><i class="fa fa-times"></i></button>
                    </div>
                  </div>
                `;
              }).join('');
            })()}
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-birthday-cake" style="color:#ec4899;margin-right:8px"></i>Birthdays</div>
            </div>
            ${todayBdays.length ? `
              <div class="mb-12" style="padding:12px;background:var(--danger-light);border-radius:8px;border:1px solid hsla(340,84%,62%,.2)">
                <div style="font-size:11px;font-weight:600;color:#ec4899;margin-bottom:6px">🎂 TODAY'S BIRTHDAYS</div>
                ${todayBdays.map(e => `
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                    <div>
                      <div style="font-size:13px;font-weight:600">${e.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(e.designationId)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.8px">Upcoming (30 days)</div>
            ${upcomingBdays.length === 0 ? '<div class="text-muted text-sm">No upcoming birthdays</div>' : upcomingBdays.slice(0,4).map(e => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
                <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:500">${e.fullName}</div>
                  <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(e.designationId)}</div>
                </div>
                <div style="font-size:12px;color:var(--primary);font-weight:600">${new Date(new Date().getFullYear()+'-'+e.dob.slice(5)).toLocaleDateString('en-PK',{month:'short',day:'2-digit'})}</div>
              </div>
            `).join('')}
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-calendar-days" style="color:var(--info);margin-right:8px"></i>Upcoming Holidays</div>
            </div>
            ${upcomingHols.map(h => `
              <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)">
                <div style="width:44px;height:44px;background:var(--info-light);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center">
                  <div style="font-size:16px;font-weight:800;color:var(--info);line-height:1">${new Date(h.date).getDate()}</div>
                  <div style="font-size:9px;color:var(--info);font-weight:600">${new Date(h.date).toLocaleString('en',{month:'short'}).toUpperCase()}</div>
                </div>
                <div>
                  <div style="font-size:13px;font-weight:600">${h.name}</div>
                  <div style="font-size:11px;color:var(--text-3)">${h.type.charAt(0).toUpperCase()+h.type.slice(1)} • ${Utils.formatDate(h.date)}</div>
                </div>
                ${h.optional ? `<span class="badge badge-secondary" style="margin-left:auto">Optional</span>` : ''}
              </div>
            `).join('')}
            <div style="margin-top:12px">
              <button class="btn btn-ghost btn-sm w-full" onclick="App.navigate('events')">View All Holidays</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render charts after DOM is ready
    setTimeout(() => this.renderCharts(att.filter(a => scopedIds.includes(a.employeeId)), scopedEmps, scopedLeaves, Auth.role === 'dept_manager'), 100);
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
          actions: `
            <button class="btn btn-success btn-xs" onclick="Leaves.approve(${l.id})"><i class="fa fa-check"></i> Approve</button>
            <button class="btn btn-danger btn-xs" onclick="Leaves.reject(${l.id})"><i class="fa fa-times"></i> Reject</button>
          `
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
          actions: `
            <button class="btn btn-success btn-xs" onclick="Leaves.approve(${l.id})"><i class="fa fa-check"></i> Final Approve</button>
            <button class="btn btn-danger btn-xs" onclick="Leaves.reject(${l.id})"><i class="fa fa-times"></i> Reject</button>
          `
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
    const leaveCount = actions.filter(a => a.type === 'leave').length;
    const expenseCount = actions.filter(a => a.type === 'expense').length;
    const ticketCount = actions.filter(a => a.type === 'ticket').length;
    const lifeCount = actions.filter(a => a.type === 'life_event').length;
    const complianceCount = actions.filter(a => ['policy', 'doc_expiry', 'hr_letter', 'asset'].includes(a.type)).length;

    const summaryParts = [];
    if (leaveCount) summaryParts.push(`${leaveCount} Leave${leaveCount > 1 ? 's' : ''}`);
    if (expenseCount) summaryParts.push(`${expenseCount} Finance Payout${expenseCount > 1 ? 's' : ''}`);
    if (ticketCount) summaryParts.push(`${ticketCount} SLA Incident${ticketCount > 1 ? 's' : ''}`);
    if (lifeCount) summaryParts.push(`${lifeCount} Life Event${lifeCount > 1 ? 's' : ''}`);
    if (complianceCount) summaryParts.push(`${complianceCount} Compliance`);

    const categories = [
      { id: 'all', label: `All (${actions.length})` },
      ...(leaveCount ? [{ id: 'leave', label: `Leaves (${leaveCount})` }] : []),
      ...(expenseCount ? [{ id: 'expense', label: `Finance (${expenseCount})` }] : []),
      ...(ticketCount ? [{ id: 'ticket', label: `SLA (${ticketCount})` }] : []),
      ...(lifeCount ? [{ id: 'life_event', label: `Life Events (${lifeCount})` }] : []),
      ...(complianceCount ? [{ id: 'compliance', label: `Compliance (${complianceCount})` }] : [])
    ];

    const currentFilter = this.inboxFilter || 'all';
    let filteredActions = actions;
    if (currentFilter !== 'all') {
      if (currentFilter === 'compliance') {
        filteredActions = actions.filter(a => ['policy', 'doc_expiry', 'hr_letter', 'asset'].includes(a.type));
      } else {
        filteredActions = actions.filter(a => a.type === currentFilter);
      }
    }

    return `
      <div id="dashboard-action-inbox" class="card" style="border:1.5px solid rgba(99,102,241,0.25);border-radius:12px;padding:${isCollapsed ? '8px 14px' : '10px 14px'};margin-bottom:18px;background:var(--card);box-shadow:0 2px 10px rgba(99,102,241,0.06);transition:all .2s ease">
        <!-- Compact Header Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;${isCollapsed ? '' : 'margin-bottom:8px'}">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:var(--primary);color:#ffffff;font-size:11.5px">
              <i class="fa fa-inbox"></i>
            </span>
            <span style="font-size:13.5px;font-weight:800;color:var(--text)">
              Executive Approvals &amp; Priority Action Inbox
            </span>
            <span class="badge badge-warning" style="font-size:10px;font-weight:700;padding:2px 7px">
              ${actions.length} Pending Actions
            </span>
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
            <button type="button" class="btn btn-ghost btn-xs" onclick="Dashboard.toggleInboxCollapse()" title="${isCollapsed ? 'Expand inbox to review approvals' : 'Minimize inbox to save space'}" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:3px 8px;border:1px solid var(--border);border-radius:6px">
              <i class="fa ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
              <span>${isCollapsed ? `Expand (${actions.length})` : 'Minimize'}</span>
            </button>
          </div>
        </div>

        <!-- Items Container (hidden if collapsed, scrollable if expanded) -->
        <div id="dashboard-inbox-items" style="${isCollapsed ? 'display:none;' : 'display:flex;flex-direction:column;gap:5px;max-height:175px;overflow-y:auto;padding-right:4px;'}">
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
        <div class="stat-value animate-count-up">${value}</div>
        <div class="stat-label">${label}</div>
        <div class="stat-sub">${sub}</div>
      </div>
    `;
  },

  miniStatCard(label, value, icon, color) {
    return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;transition:all .2s" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
        <div style="font-size:20px;margin-bottom:6px;color:${color}"><i class="fa ${icon}"></i></div>
        <div style="font-size:26px;font-weight:800;color:${color}">${value}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:3px;font-weight:500">${label}</div>
      </div>
    `;
  },

  renderCharts(att, emps, scopedLeaves, isTeamScope) {
    const chartDefaults = {
      color: '#fff',
      borderColor: 'var(--border)',
    };

    const gridColor = 'rgba(255,255,255,0.06)';
    const textColor = '#8899aa';

    // ── Attendance Trend (Line) ──
    const days = [];
    const presentData = [], absentData = [], lateData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      days.push(d.toLocaleDateString('en',{weekday:'short',day:'2-digit'}));
      const dayAtt = att.filter(a => a.date === ds);
      presentData.push(dayAtt.filter(a => a.status === 'present').length);
      absentData.push(dayAtt.filter(a => a.status === 'absent').length);
      lateData.push(dayAtt.filter(a => a.status === 'late').length);
    }
    this.makeChart('chart-att-trend', 'line', days, [
      { label:'Present', data: presentData, borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.1)', tension:0.4, fill:true },
      { label:'Absent',  data: absentData,  borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.1)',  tension:0.4, fill:true },
      { label:'Late',    data: lateData,    borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.1)', tension:0.4, fill:true },
    ], gridColor, textColor);

    // ── Leave Statistics (Doughnut) ──
    const leaves = scopedLeaves || DB.get('leave_requests');
    this.makeChart('chart-leave-stats', 'doughnut',
      ['Pending','Approved','Rejected','Manager Approved'],
      [{ data: [
        leaves.filter(l=>l.status==='pending').length,
        leaves.filter(l=>l.status==='approved').length,
        leaves.filter(l=>l.status==='rejected').length,
        leaves.filter(l=>l.status==='manager_approved').length,
      ], backgroundColor:['#f59e0b','#10b981','#ef4444','#6366f1'], borderWidth:0 }],
      gridColor, textColor, { plugins: { legend: { position: 'bottom' } } }
    );

    // ── Dept Employees (Horizontal Bar) ──
    const depts = DB.get('departments');
    const displayDepts = isTeamScope ? depts.filter(d => emps.some(e => e.departmentId === d.id)) : depts;
    this.makeChart('chart-dept', 'bar',
      displayDepts.map(d => d.name.length > 12 ? d.name.slice(0,12)+'…' : d.name),
      [{ label: isTeamScope ? 'Team Members' : 'Employees', data: displayDepts.map(d => emps.filter(e => e.departmentId === d.id).length), backgroundColor:'rgba(99,102,241,0.7)', borderRadius:4 }],
      gridColor, textColor, { indexAxis: 'y' }
    );

    // ── Monthly Joining (Bar) ──
    const months = ['Mar','Apr','May','Jun','Jul','Aug'];
    const joined = isTeamScope
      ? months.map((m, idx) => {
          const mNum = String(idx + 3).padStart(2, '0');
          return emps.filter(e => e.joiningDate && e.joiningDate.includes(`-0${idx + 3}-`)).length;
        })
      : [3,2,1,4,2,2];
    this.makeChart('chart-joining', 'bar', months,
      [{ label:'Joined', data: joined, backgroundColor:'rgba(20,184,166,0.7)', borderRadius:6 }],
      gridColor, textColor
    );

    // ── Late Arrivals (Bar) ──
    const lateByDept = displayDepts.map(d => {
      const deptEmps = emps.filter(e => e.departmentId === d.id).map(e => e.id);
      return att.filter(a => deptEmps.includes(a.employeeId) && a.status === 'late').length;
    });
    this.makeChart('chart-late', 'bar',
      displayDepts.map(d => d.code),
      [{ label:'Late Count', data: lateByDept, backgroundColor:'rgba(245,158,11,0.7)', borderRadius:6 }],
      gridColor, textColor
    );
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

  toggleTickerSpeed() {
    const track = document.getElementById('dash-ticker-track');
    const btn = document.getElementById('ticker-speed-btn');
    if (!track || !btn) return;
    track.classList.remove('fast');
    if (this.tickerSpeed === '1x') {
      this.tickerSpeed = '0.5x';
      track.classList.add('slow');
      btn.innerHTML = `<i class="fa fa-gauge"></i> 0.5x`;
      btn.title = 'Current Speed: 0.5x (Click for 1x)';
    } else {
      this.tickerSpeed = '1x';
      track.classList.remove('slow');
      btn.innerHTML = `<i class="fa fa-gauge"></i> 1x`;
      btn.title = 'Current Speed: 1x (Click for 0.5x)';
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hrm_ticker_speed', this.tickerSpeed);
    }
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

  renderEmployeeDashboard(content, headlines, upcomingHols, upcomingBdays, today) {
    const myId = Auth.employee?.id;
    const myEmp = Auth.employee || (myId ? DB.find('employees', myId) : null);
    const allAtt = DB.get('attendance') || [];
    const allLeaves = DB.get('leave_requests') || [];
    const allSalary = DB.get('salary') || [];
    const allReviews = DB.get('performance_reviews') || [];
    const tickerItemsHtml = headlines.map(h => `
      <span class="ticker-item ${h.type}" onclick="${h.action}" title="Click to view details">
        <i class="fa ${h.icon}"></i>
        <span style="font-size:10px;font-weight:800;letter-spacing:0.5px;opacity:0.9;margin-right:2px">[${h.tag}]</span>
        ${h.text}
      </span>
      <span class="ticker-sep">✦</span>
    `).join('');

    const myTodayAtt = allAtt.find(a => a.employeeId === myId && a.date === today);
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

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Bar: Employee Greeting -->
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
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-secondary btn-sm" onclick="App.openHistoryDrawer()" title="View your activity history drawer (Ctrl+H)">
              <i class="fa fa-clock-rotate-left"></i> My Activity History
            </button>
            <button class="btn btn-ghost btn-sm" onclick="Dashboard.render()" title="Refresh Dashboard">
              <i class="fa fa-rotate"></i> Refresh
            </button>
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
            <!-- Left: Profile Summary -->
            <div style="display:flex;align-items:center;gap:16px;min-width:260px">
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
          <!-- Upcoming Birthdays -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-birthday-cake" style="color:#ec4899;margin-right:8px"></i>Colleague Birthdays</div>
            </div>
            ${upcomingBdays.length === 0 ? '<div class="text-muted text-sm">No upcoming birthdays</div>' : upcomingBdays.slice(0,3).map(e => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
                <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600">${e.fullName}</div>
                  <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(e.designationId)} • ${Utils.getDeptName(e.departmentId)}</div>
                </div>
                <button class="btn btn-ghost btn-xs" onclick="Dashboard.showBirthdayWishModal(${e.id})" style="color:#ec4899">
                  <i class="fa fa-gift"></i> Wish
                </button>
              </div>
            `).join('')}
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
  }
};
