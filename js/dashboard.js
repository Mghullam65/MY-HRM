// ============================================================
// HRM SYSTEM — Dashboard Module
// ============================================================

const Dashboard = {
  charts: {},

  render() {
    const content = document.getElementById('page-content');
    const att = DB.get('attendance');
    const emps = DB.get('employees');
    const leaves = DB.get('leave_requests');
    const salary = DB.get('salary');
    const reviews = DB.get('performance_reviews');
    const holidays = DB.get('holidays');
    const today = Utils.today();

    const totalEmps = emps.filter(e => e.status === 'active').length;
    const inactiveEmps = emps.filter(e => e.status === 'inactive').length;
    const newJoiners = emps.filter(e => e.joiningDate >= '2026-08-01' && e.status === 'active').length;

    const todayAtt = att.filter(a => a.date === today);
    const present  = todayAtt.filter(a => a.status === 'present').length;
    const absent   = todayAtt.filter(a => a.status === 'absent').length;
    const late     = todayAtt.filter(a => a.status === 'late').length;
    const halfDay  = todayAtt.filter(a => a.status === 'half_day').length;
    const onLeave  = leaves.filter(l => l.status === 'approved' && l.from <= today && l.to >= today).length;

    const pendingLeaves  = leaves.filter(l => l.status === 'pending').length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const rejectedLeaves = leaves.filter(l => l.status === 'rejected').length;

    const pendingSalary  = salary.filter(s => s.status === 'pending').length;
    const processedSalary= salary.filter(s => s.status === 'processed').length;
    const pendingReviews = reviews.filter(r => r.status === 'pending').length;
    const doneReviews    = reviews.filter(r => r.status === 'completed').length;

    // Birthdays, Holidays, Announcements, Anniversaries for Headlines Ticker
    const todayMMDD = today.slice(5);
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
              ${new Date().toLocaleDateString('en-PK', { weekday:'long', month:'long', day:'numeric', year:'numeric' })} • Welcome back, ${Auth.employee.firstName}!
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
             FLOWHCM EXECUTIVE HERO & QUICK MODULE BAR
        ═══════════════════════════════════════════════ -->
        <div class="flow-hero-banner">
          <div class="flow-hero-left">
            <div class="flow-hero-badge">
              <i class="fa fa-sparkles"></i> FlowHCM Cloud Platform • Live Operations
            </div>
            <h2 class="flow-hero-title">Welcome to FlowHCM Workspace, ${Auth.employee.firstName}!</h2>
            <p class="flow-hero-desc">
              Your centralized human capital suite is running at <strong>99.98% SLA</strong>. Manage workforce data, biometric attendance, instant payroll runs, and performance reviews with voice-driven AI.
            </p>
          </div>
          <div class="flow-hero-actions">
            <button class="flow-hero-btn primary" onclick="App.navigate('attendance')">
              <i class="fa fa-fingerprint"></i> Quick Clock In
            </button>
            <button class="flow-hero-btn secondary" onclick="App.navigate('leaves')">
              <i class="fa fa-calendar-plus"></i> Apply Leave
            </button>
            <button class="flow-hero-btn secondary" onclick="App.openFlowAiAssistant()">
              <i class="fa fa-wand-magic-sparkles" style="color:#38bdf8"></i> Ask FlowAI
            </button>
          </div>
        </div>

        <!-- FlowHCM Top Modules Bar -->
        <div class="flow-modules-bar">
          <div class="flow-module-chip" onclick="App.navigate('employees')" title="Employee Management">
            <div class="flow-module-icon" style="background:rgba(2,132,199,0.15);color:#0284c7">
              <i class="fa fa-users"></i>
            </div>
            <div class="flow-module-info">
              <h5>Employees</h5>
              <span>${totalEmps} Active Records</span>
            </div>
          </div>
          <div class="flow-module-chip" onclick="App.navigate('attendance')" title="Time & Attendance">
            <div class="flow-module-icon" style="background:rgba(1,112,185,0.15);color:#0170b9">
              <i class="fa fa-clock"></i>
            </div>
            <div class="flow-module-info">
              <h5>Attendance</h5>
              <span>${present} Checked In</span>
            </div>
          </div>
          <div class="flow-module-chip" onclick="App.navigate('leaves')" title="Leave Management">
            <div class="flow-module-icon" style="background:rgba(16,185,129,0.15);color:#059669">
              <i class="fa fa-calendar-xmark"></i>
            </div>
            <div class="flow-module-info">
              <h5>Leaves</h5>
              <span>${pendingLeaves} Pending Approval</span>
            </div>
          </div>
          <div class="flow-module-chip" onclick="App.navigate('payroll')" title="Payroll Management">
            <div class="flow-module-icon" style="background:rgba(4,120,87,0.15);color:#047857">
              <i class="fa fa-money-bill-wave"></i>
            </div>
            <div class="flow-module-info">
              <h5>Payroll</h5>
              <span>${processedSalary > 0 ? 'Processed' : 'Active Cycle'}</span>
            </div>
          </div>
          <div class="flow-module-chip" onclick="App.navigate('performance')" title="Performance Appraisals">
            <div class="flow-module-icon" style="background:rgba(124,58,237,0.15);color:#7c3aed">
              <i class="fa fa-chart-line"></i>
            </div>
            <div class="flow-module-info">
              <h5>Performance</h5>
              <span>${doneReviews} Done • ${pendingReviews} Pending</span>
            </div>
          </div>
          <div class="flow-module-chip" onclick="App.navigate('recruitment')" title="Recruitment & ATS">
            <div class="flow-module-icon" style="background:rgba(234,88,12,0.15);color:#ea580c">
              <i class="fa fa-briefcase"></i>
            </div>
            <div class="flow-module-info">
              <h5>Recruitment</h5>
              <span>Active ATS Pipeline</span>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════
             MOVING HEADLINES TICKER (Birthdays & Events)
        ═══════════════════════════════════════════════ -->
        <div class="dash-ticker">
          <div class="ticker-badge">
            <span class="ticker-live-dot"></span>
            <i class="fa fa-bolt"></i> HEADLINES
          </div>
          <div class="ticker-track-wrap">
            <div class="ticker-track" id="dash-ticker-track">
              ${tickerItemsHtml}
              ${tickerItemsHtml}
            </div>
          </div>
          <div class="ticker-controls">
            <button class="ticker-ctrl-btn" id="ticker-play-btn" onclick="Dashboard.toggleTickerPlay()" title="Pause/Play Headlines">
              <i class="fa fa-pause"></i>
            </button>
            <button class="ticker-ctrl-btn" id="ticker-speed-btn" onclick="Dashboard.toggleTickerSpeed()" title="Toggle Speed (1x / 2x)">
              <i class="fa fa-gauge"></i> 1x
            </button>
            <button class="ticker-ctrl-btn" onclick="Dashboard.showAllHeadlinesModal()" title="View All Events & Notices">
              <i class="fa fa-list"></i>
            </button>
          </div>
        </div>

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

        <!-- KPI Row 1: Employees -->
        <div class="mb-16" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <h3 style="font-size:13px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:1px">Employee Overview</h3>
        </div>
        <div class="grid-4 mb-20">
          ${this.statCard('Total Employees', totalEmps, 'fa-users', 'blue', `Active: ${totalEmps} | Inactive: ${inactiveEmps}`, '+2 this month', 'up')}
          ${this.statCard('Active Employees', totalEmps, 'fa-user-check', 'green', `On probation: ${emps.filter(e=>e.employmentType==='Probation').length}`, '', '')}
          ${this.statCard('Inactive Employees', inactiveEmps, 'fa-user-xmark', 'red', 'Ex-employees', '', '')}
          ${this.statCard('New Joiners', newJoiners, 'fa-user-plus', 'purple', 'This month', '+' + newJoiners + ' this month', 'up')}
        </div>

        <!-- KPI Row 2: Attendance Today -->
        <div class="mb-16" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <h3 style="font-size:13px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:1px">Today's Attendance — ${Utils.formatDate(today)}</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('attendance')"><i class="fa fa-arrow-right"></i> View Full</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px">
          ${this.miniStatCard('Present',  present,  'fa-circle-check',    '#10b981')}
          ${this.miniStatCard('Absent',   absent,   'fa-circle-xmark',    '#ef4444')}
          ${this.miniStatCard('Late',     late,     'fa-clock',           '#f59e0b')}
          ${this.miniStatCard('Half Day', halfDay,  'fa-circle-half-stroke','#8b5cf6')}
          ${this.miniStatCard('On Leave', onLeave,  'fa-calendar-minus',  '#14b8a6')}
          ${this.miniStatCard('Overtime', att.filter(a=>a.date===today&&a.overtime>0).length,'fa-business-time','#6366f1')}
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
                <div style="font-size:11px;color:var(--text-3)">Total Net Paid</div>
                <div style="font-size:18px;font-weight:800;color:var(--primary)">${Utils.formatCurrency(DB.get('salary').filter(s=>s.status==='processed').reduce((a,s)=>a+s.netSalary,0))}</div>
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
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">
            ${[
              { label:'Add Employee', icon:'fa-user-plus', color:'#6366f1', action:"App.navigate('employees');setTimeout(()=>Employees.showAddForm(),100)" },
              { label:'Apply Leave', icon:'fa-calendar-plus', color:'#14b8a6', action:"App.navigate('leaves');setTimeout(()=>Leaves.showApplyForm(),100)" },
              { label:'Mark Attendance', icon:'fa-fingerprint', color:'#f59e0b', action:"App.navigate('attendance')" },
              { label:'Process Payroll', icon:'fa-money-check-dollar', color:'#10b981', action:"App.navigate('payroll')" },
              { label:'Performance', icon:'fa-chart-line', color:'#8b5cf6', action:"App.navigate('performance')" },
              { label:'View Reports', icon:'fa-file-chart-line', color:'#ec4899', action:"App.navigate('reports')" },
            ].map(a => `
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
              const pendingLeaveList = leaves.filter(l => l.status === 'pending' || l.status === 'manager_approved').slice(0, 5);
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
    setTimeout(() => this.renderCharts(att, emps), 100);
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

  renderCharts(att, emps) {
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
    const leaves = DB.get('leave_requests');
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
    this.makeChart('chart-dept', 'bar',
      depts.map(d => d.name.length > 12 ? d.name.slice(0,12)+'…' : d.name),
      [{ label:'Employees', data: depts.map(d => d.employeeCount), backgroundColor:'rgba(99,102,241,0.7)', borderRadius:4 }],
      gridColor, textColor, { indexAxis: 'y' }
    );

    // ── Monthly Joining (Bar) ──
    const months = ['Mar','Apr','May','Jun','Jul','Aug'];
    const joined = [3,2,1,4,2,2];
    this.makeChart('chart-joining', 'bar', months,
      [{ label:'Joined', data: joined, backgroundColor:'rgba(20,184,166,0.7)', borderRadius:6 }],
      gridColor, textColor
    );

    // ── Late Arrivals (Bar) ──
    const lateByDept = depts.map(d => {
      const deptEmps = emps.filter(e => e.departmentId === d.id).map(e => e.id);
      return att.filter(a => deptEmps.includes(a.employeeId) && a.status === 'late').length;
    });
    this.makeChart('chart-late', 'bar',
      depts.map(d => d.code),
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
    track.classList.toggle('fast');
    const isFast = track.classList.contains('fast');
    btn.innerHTML = `<i class="fa fa-gauge"></i> ${isFast ? '2x' : '1x'}`;
    btn.title = isFast ? 'Normal Speed (1x)' : 'Double Speed (2x)';
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
  }
};
