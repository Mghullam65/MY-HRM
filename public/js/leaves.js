// ============================================================
// HRM SYSTEM — Leave Management Module
// ============================================================

const Leaves = {
  currentView: 'requests',
  calMode: 'employee',
  calViewMode: 'year', // Exclusively 'year' (12-Month Interactive Annual Leave Planner)
  calDeptFilter: 'all',
  calEmpSearch: '',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  quotaSortCol: 'sr',
  quotaSortAsc: true,
  quotaDeptFilter: 'all',
  quotaStatusFilter: 'all',
  quotaSearchQuery: '',
  quotaYear: 2026,

  getScopedEmployees() {
    const emps = DB.get('employees') || [];
    return Auth.getScopedEmployees(emps).filter(e => e.status === 'active');
  },

  getScopedLeaves() {
    const allLeaves = DB.get('leave_requests') || [];
    if (Auth.role === 'employee') {
      return allLeaves.filter(l => l.employeeId === Auth.employee?.id);
    }
    if (Auth.role === 'dept_manager') {
      const teamEmps = this.getScopedEmployees();
      const teamIds = teamEmps.map(e => e.id);
      const myEmpId = Auth.employee?.id;
      return allLeaves.filter(l => teamIds.includes(l.employeeId) || (myEmpId && l.managerId === myEmpId) || (l.employeeId === myEmpId));
    }
    return allLeaves;
  },

  render() {
    const content = document.getElementById('page-content');
    if (!content) return;

    if (!Auth.can('leaves.view')) {
      content.innerHTML = `
        <div class="empty-state animate-fade-in" style="padding:60px 20px;text-align:center">
          <div style="width:64px;height:64px;border-radius:50%;background:rgba(239,68,68,0.1);color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px">
            <i class="fa fa-lock"></i>
          </div>
          <h3 style="font-weight:800;color:var(--text);margin-bottom:8px">403 Access Restricted</h3>
          <p style="color:var(--text-3);max-width:440px;margin:0 auto">You do not have permission to view the Leave module. Contact your administrator to adjust role permissions in Settings &gt; Roles &amp; Permissions.</p>
        </div>
      `;
      return;
    }

    const leaves = this.getScopedLeaves();
    const pending = leaves.filter(l => l.status === 'pending').length;
    const approved = leaves.filter(l => l.status === 'approved').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;
    const mgrApproved = leaves.filter(l => l.status === 'manager_approved').length;

    // Filter available tabs based on granular permissions AND feature visibility
    const canManagePolicy = Auth.can('leaves.edit') || Auth.can('leaves.approve') || ['superadmin', 'hr_manager', 'dept_manager'].includes(Auth.role);
    const availableTabs = [
      { id:'requests',   label:'Leave Requests & Approvals', icon:'fa-calendar-check', badge: pending > 0 ? pending : null, allowed: Auth.canSeeFeature('leaves.requests') },
      { id:'calendar',   label:'Leave & Holiday Calendar',   icon:'fa-calendar-days', allowed: Auth.canSeeFeature('leaves.calendar') },
      { id:'quota',      label:'Leave Quotas & Policies',    icon:'fa-scale-balanced', allowed: canManagePolicy && Auth.canSeeFeature('leaves.quota') },
      { id:'tokens',     label:'Comp-Off & TOIL Bank',       icon:'fa-coins', allowed: Auth.canSeeFeature('leaves.tokens') },
      { id:'encashment', label:'Leave Encashment',           icon:'fa-hand-holding-dollar', allowed: Auth.canSeeFeature('leaves.encashment') },
    ].filter(t => t.allowed);

    if (!availableTabs.some(t => this.isTabActive(t.id))) {
      this.currentView = availableTabs[0]?.id || 'requests';
    }

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Summary -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          ${[
            { label:'Pending',          val:pending,     color:'#f59e0b', icon:'fa-clock' },
            { label:'Mgr Approved',     val:mgrApproved, color:'#6366f1', icon:'fa-user-check' },
            { label:'HR Approved',      val:approved,    color:'#10b981', icon:'fa-circle-check' },
            { label:'Rejected',         val:rejected,    color:'#ef4444', icon:'fa-circle-xmark' },
          ].map(s => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid ${s.color}">
              <div style="font-size:22px;color:${s.color}"><i class="fa ${s.icon}"></i></div>
              <div>
                <div style="font-size:26px;font-weight:800;color:${s.color}">${s.val}</div>
                <div style="font-size:12px;color:var(--text-3)">${s.label}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- View Tabs: 4 Clean Lifecycle Stages -->
        <div class="module-stage-tabs">
          ${availableTabs.map(t => `
            <button class="tab-toggle-btn ${this.isTabActive(t.id)?'active':''}" data-tab="${t.id}" onclick="Leaves.switchView('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label} ${t.badge ? `<span class="badge badge-warning" style="margin-left:5px;font-size:10px;padding:2px 6px">${t.badge}</span>` : ''}
            </button>
          `).join('')}
        </div>

        <style>
          .tab-toggle-btn { padding:8px 14px;border:none;background:transparent;color:var(--text-3);font-size:12.5px;font-weight:500;border-radius:7px;cursor:pointer;transition:all .2s; }
          .tab-toggle-btn.active { background:var(--primary);color:white;box-shadow:0 2px 8px var(--primary-glow); }
          .tab-toggle-btn:hover:not(.active) { background:var(--surface-2);color:var(--text); }
        </style>

        <div id="leaves-content"></div>
      </div>
    `;

    this.renderView();
  },

  isTabActive(tabId) {
    if (tabId === 'requests') return this.currentView === 'requests';
    if (tabId === 'calendar') return ['calendar', 'holidays'].includes(this.currentView);
    if (tabId === 'quota') return ['quota', 'balance', 'types'].includes(this.currentView);
    if (tabId === 'tokens') return this.currentView === 'tokens';
    if (tabId === 'encashment') return this.currentView === 'encashment';
    return this.currentView === tabId;
  },

  switchView(view) {
    if (view === 'types') {
      this.currentView = 'quota';
      this.quotaSubView = 'types';
    } else {
      this.currentView = view;
      if (view === 'quota' && !this.quotaSubView) {
        this.quotaSubView = 'matrix';
      }
    }
    document.querySelectorAll('.tab-toggle-btn[data-tab]').forEach(b => {
      const tabId = b.getAttribute('data-tab');
      if (tabId) b.classList.toggle('active', this.isTabActive(tabId));
    });
    this.renderView();
  },

  setQuotaSubView(subView) {
    this.quotaSubView = subView;
    this.renderView();
  },

  renderView() {
    const container = document.getElementById('leaves-content');
    if (!container) return;
    switch(this.currentView) {
      case 'requests':   this.renderRequests(container); break;
      case 'calendar':   this.renderCalendar(container); break;
      case 'quota':
      case 'balance':    this.renderQuota(container); break;
      case 'tokens':     this.renderTokens(container); break;
      case 'encashment': this.renderLeaveEncashment(container); break;
      case 'types':    
        this.currentView = 'quota';
        this.quotaSubView = 'types';
        this.renderQuota(container);
        break;
      case 'holidays':   this.renderHolidays(container); break;
    }
  },

  renderRequests(container) {
    const leaves = this.getScopedLeaves();
    const emps = DB.get('employees');
    const types = DB.get('leave_types');

    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isDeptMgr = Auth.role === 'dept_manager';
    const isHRorAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const canCreate = Auth.can('leaves.create') && Auth.canSeeFeature('leaves.apply_form');
    const canApprove = Auth.can('leaves.approve') && Auth.canSeeFeature('leaves.approvals');
    const canDelete = Auth.can('leaves.delete');

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <span style="font-weight:600">${isEmployee ? 'My Leave Requests' : isDeptMgr ? 'Team Leave Requests (Direct Reportees)' : 'All Leave Requests'}</span>
            ${!canApprove ? `<div style="font-size:11.5px;color:var(--text-3);margin-top:2px"><i class="fa fa-eye" style="color:var(--primary)"></i> View only mode — Approval authority restricted</div>` : ''}
          </div>
          ${canCreate ? `<button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-plus"></i> Apply Leave</button>` : ''}
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Applied On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              ${leaves.length === 0 ? '<tr><td colspan="8"><div class="empty-state" style="padding:40px"><i class="fa fa-calendar-xmark"></i><h3>No leave requests</h3></div></td></tr>' :
              leaves.map(leave => {
                const emp = emps.find(e => e.id === leave.employeeId);
                const type = types.find(t => t.id === leave.typeId);
                const isSelf = Auth.employee?.id === leave.employeeId;
                const calcDays = leave.days != null ? leave.days : (leave.from && leave.to ? Math.max(1, Math.round((new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24)) + 1) : 1);
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(leave.employeeId)}">${Utils.avatarInitials(emp?.fullName||'?')}</div>
                    <div>
                      <div style="font-weight:600;font-size:13px">${emp?.fullName || '—'}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp?.empNo||''}</div>
                    </div>
                  </div></td>
                  <td>
                    <span class="badge" style="background:${type?.color}22;color:${type?.color}">${type?.name||'—'}</span>
                    ${leave.salaryDeduction ? `
                      <div style="margin-top:4px">
                        <span class="badge badge-warning" style="font-size:10.5px;padding:2px 6px;display:inline-flex;align-items:center;gap:4px" title="Unpaid Leave / Loss of Pay">
                          <i class="fa fa-money-bill-wave"></i> PKR ${(leave.deductionAmount||0).toLocaleString()} LOP
                        </span>
                      </div>
                    ` : ''}
                  </td>
                  <td>${Utils.formatDate(leave.from)}</td>
                  <td>${Utils.formatDate(leave.to)}</td>
                  <td><strong>${calcDays} day${calcDays!==1?'s':''}</strong></td>
                  <td style="font-size:12px">${Utils.formatDate(leave.appliedOn)}</td>
                  <td>
                    ${Utils.statusBadge(leave.status)}
                    ${typeof WorkflowEngine !== 'undefined' ? `<div style="margin-top:4px">${WorkflowEngine.renderStepperHTML(leave, 'leaves')}</div>` : ''}
                  </td>
                  <td>
                    <div class="tbl-actions" style="flex-wrap:nowrap;gap:4px">
                      <button class="btn btn-ghost btn-icon btn-xs" onclick="Leaves.viewDetail(${leave.id})" title="View Details"><i class="fa fa-eye"></i></button>
                      ${(canApprove && leave.status === 'pending') ? `
                        <button class="btn ${isHRorAdmin ? 'btn-success' : 'btn-primary'} btn-xs" onclick="Leaves.approve(${leave.id})" title="${isHRorAdmin ? 'Final Corporate Approval' : 'Manager Endorse / Approve'}">
                          ${isHRorAdmin ? '<i class="fa fa-check-double"></i> Final' : '<i class="fa fa-user-check"></i> Mgr'}
                        </button>
                        <button class="btn btn-danger btn-icon btn-xs" onclick="Leaves.reject(${leave.id})" title="Reject">
                          <i class="fa fa-times"></i>
                        </button>
                      ` : ''}
                      ${(canApprove && isHRorAdmin && leave.status === 'manager_approved') ? `
                        <button class="btn btn-success btn-xs" onclick="Leaves.approve(${leave.id})" title="Final Corporate Approval">
                          <i class="fa fa-check-double"></i> Final
                        </button>
                        <button class="btn btn-danger btn-icon btn-xs" onclick="Leaves.reject(${leave.id})" title="Reject">
                          <i class="fa fa-times"></i>
                        </button>
                      ` : ''}
                      ${((isSelf && leave.status === 'pending') || canDelete) ? `
                        <button class="btn btn-danger btn-icon btn-xs" onclick="Leaves.cancelLeave(${leave.id})" title="Cancel"><i class="fa fa-ban"></i></button>
                      ` : ''}
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setCalMode(mode) {
    this.calMode = mode;
    this.renderView();
  },

  setCalViewMode(mode) {
    this.calViewMode = 'year';
    this.renderView();
  },

  prevYear() {
    this.calYear--;
    this.renderView();
  },

  nextYear() {
    this.calYear++;
    this.renderView();
  },

  setCalDeptFilter(deptId) {
    this.calDeptFilter = deptId;
    this.renderView();
  },

  setCalEmpSearch(query) {
    this.calEmpSearch = query ? query.toLowerCase() : '';
    this.renderView();
  },

  renderCalendar(container) {
    const year = this.calYear;
    const month = this.calMonth;
    const allLeaves = DB.get('leave_requests') || [];
    const holidays = DB.get('holidays') || [];
    const types = DB.get('leave_types') || [];
    const allEmps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const depts = DB.get('departments') || [];
    const balances = DB.get('leave_balances') || [];

    const role = Auth.role;
    const isManagement = role === 'superadmin' || role === 'hr_manager' || role === 'dept_manager';
    const isDeptMgr = role === 'dept_manager';
    const myEmp = Auth.employee || allEmps.find(e => e.id === Auth.user?.employeeId) || allEmps[0];

    // Ordinary employees are strictly locked to 'my' calendar
    if (!isManagement) {
      this.calMode = 'my';
    } else if (!this.calMode) {
      this.calMode = 'employee';
    }

    const isMyMode = this.calMode === 'my';

    // Scoped staff for employee calendar: Deputy Manager strictly scoped to direct reportees (4 employees)
    const staffPool = isDeptMgr ? allEmps.filter(e => e.managerId === myEmp?.id || e.reportingTo === myEmp?.id) : allEmps;
    const filteredStaff = staffPool.filter(e => {
      if (this.calDeptFilter !== 'all' && e.departmentId !== parseInt(this.calDeptFilter)) return false;
      if (this.calEmpSearch) {
        const q = this.calEmpSearch;
        return e.fullName.toLowerCase().includes(q) || (e.empNo && e.empNo.toLowerCase().includes(q));
      }
      return true;
    });
    const staffIds = new Set(filteredStaff.map(e => e.id));

    // Filter relevant leaves
    const validLeaves = allLeaves.filter(l => l.status !== 'rejected' && l.status !== 'cancelled');
    const displayLeaves = isMyMode 
      ? validLeaves.filter(l => l.employeeId === myEmp?.id)
      : validLeaves.filter(l => staffIds.has(l.employeeId));

    // Calculate personal quota remaining for myEmp
    let myQuotaRemaining = 0;
    if (myEmp) {
      const myBal = balances.find(b => b.employeeId === myEmp.id);
      const myApproved = allLeaves.filter(l => l.employeeId === myEmp.id && l.status === 'approved');
      types.forEach(t => {
        const alloc = myBal?.quotas?.[t.id] ?? t.maxDays;
        const used = myApproved.filter(l => (l.quotaTypeId === t.id || l.typeId === t.id)).reduce((s, l) => s + l.days, 0);
        const rem = myBal?.balances?.[t.id] ?? Math.max(0, alloc - used);
        myQuotaRemaining += rem;
      });
    }

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const today = new Date();

    // Exclusively render 12-Month Annual Leave Planner Matrix (single month view removed)
    this.renderYearMatrix(container, year, displayLeaves, holidays, isMyMode, isManagement, isDeptMgr, myEmp, filteredStaff, depts, myQuotaRemaining);
    return;

    container.innerHTML = `
      <!-- Stage 2 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm ${this.currentView==='calendar'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('calendar')">
            <i class="fa fa-calendar-days"></i> Leave Calendar &amp; Matrix
          </button>
          <button class="btn btn-sm ${this.currentView==='holidays'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('holidays')">
            <i class="fa fa-umbrella-beach"></i> Corporate Holidays (${holidays.length})
          </button>
        </div>
        ${Auth.can('leaves.create') ? `<button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-plus"></i> Apply Leave</button>` : ''}
      </div>

      <div class="card" style="padding:20px">
        <!-- Top Controls Bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <!-- Left: Calendar Mode Switcher (if Management) & Month Navigation -->
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            ${isManagement ? `
              <div class="cal-mode-switcher">
                <button class="cal-mode-btn ${isMyMode ? 'active' : ''}" onclick="Leaves.setCalMode('my')">
                  <i class="fa fa-user"></i> My Leave Calendar
                </button>
                <button class="cal-mode-btn ${!isMyMode ? 'active' : ''}" onclick="Leaves.setCalMode('employee')">
                  <i class="fa fa-users"></i> Employee Leave Calendar
                </button>
              </div>
            ` : ''}

            <div style="display:flex;align-items:center;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="Leaves.prevMonth()"><i class="fa fa-chevron-left"></i></button>
              <h3 style="font-size:17px;font-weight:700;margin:0;min-width:160px;text-align:center">${monthNames[month]} ${year}</h3>
              <button class="btn btn-ghost btn-sm" onclick="Leaves.nextMonth()"><i class="fa fa-chevron-right"></i></button>
              <button class="btn btn-secondary btn-sm" onclick="Leaves.todayMonth()"><i class="fa fa-calendar-day" style="margin-right:4px"></i> Today</button>
            </div>

            <!-- View Switcher -->
            <div style="display:flex;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:2px">
              <button class="btn btn-xs ${this.calViewMode==='month'?'btn-primary':'btn-ghost'}" onclick="Leaves.setCalViewMode('month')" title="Single Month Focus">
                <i class="fa fa-calendar-days"></i> Month View
              </button>
              <button class="btn btn-xs ${this.calViewMode==='year'?'btn-primary':'btn-ghost'}" onclick="Leaves.setCalViewMode('year')" title="12-Month Annual Leave Planner">
                <i class="fa fa-table-cells"></i> 12-Month Planner
              </button>
            </div>
          </div>

          <!-- Right: Department Filter, Search & Primary Action -->
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            ${(!isMyMode && isManagement) ? `
              ${!isDeptMgr ? `
                <select class="form-control" style="width:auto;font-size:12px;padding:6px 10px;height:34px" onchange="Leaves.setCalDeptFilter(this.value)">
                  <option value="all" ${this.calDeptFilter === 'all' ? 'selected' : ''}>All Departments</option>
                  ${depts.map(d => `<option value="${d.id}" ${this.calDeptFilter == d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
              ` : ''}
              <input type="text" class="form-control" placeholder="Search staff..." style="width:140px;font-size:12px;padding:6px 10px;height:34px" value="${this.calEmpSearch || ''}" oninput="Leaves.setCalEmpSearch(this.value)">
            ` : ''}

            ${Auth.can('leaves.create') ? (isMyMode ? `
              <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm(null, 'my')">
                <i class="fa fa-calendar-plus" style="margin-right:6px"></i> Apply for My Leave
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm(null, 'employee')">
                <i class="fa fa-user-plus" style="margin-right:6px"></i> Mark Employee Leave
              </button>
            `) : ''}
          </div>
        </div>

        <!-- Scope Guidance Banner -->
        <div style="background:linear-gradient(135deg, ${isMyMode ? 'rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.08) 100%' : 'rgba(245,158,11,0.08) 0%, rgba(99,102,241,0.08) 100%'});border:1px solid ${isMyMode ? 'rgba(99,102,241,0.22)' : 'rgba(245,158,11,0.25)'};border-radius:10px;padding:12px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:9px;background:${isMyMode ? 'rgba(99,102,241,0.18)' : 'rgba(245,158,11,0.18)'};color:${isMyMode ? 'var(--primary)' : '#f59e0b'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
              <i class="fa ${isMyMode ? 'fa-user' : 'fa-users'}"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text)">
                ${isMyMode 
                  ? `My Personal Leave Calendar — ${myEmp?.fullName} (${myEmp?.empNo})` 
                  : `Employee Leave Calendar — ${isDeptMgr ? `${Utils.getDeptName(myEmp?.departmentId)} Staff` : 'All Company Staff'}`}
              </div>
              <div style="font-size:12px;color:var(--text-3)">
                ${isMyMode 
                  ? 'Viewing your personal leave records and official holidays. Click on any date to apply for your own leave.' 
                  : 'Viewing leaves for company staff members. Click on any date to mark or apply leave on behalf of an employee.'}
              </div>
            </div>
          </div>
          <div>
            ${isMyMode ? `
              <span class="chip" style="font-size:12px;padding:6px 12px"><i class="fa fa-scale-balanced" style="color:var(--primary);margin-right:6px"></i>Your Personal Quota: <strong style="color:var(--success);margin-left:4px">${myQuotaRemaining} Days Remaining</strong></span>
            ` : `
              <span class="chip" style="font-size:12px;padding:6px 12px"><i class="fa fa-users" style="color:var(--primary);margin-right:6px"></i>Roster: <strong>${filteredStaff.length} Employees</strong></span>
            `}
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-day-header">${d}</div>`).join('')}
          ${cells.map(d => {
            if (!d) return '<div class="cal-day-empty" style="background:var(--surface-2);opacity:0.3;min-height:96px;border:1px solid var(--border);border-radius:var(--radius-sm)"></div>';
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
            const isWeekend = new Date(year, month, d).getDay() % 6 === 0;
            const dayLeaves = displayLeaves.filter(l => l.from <= dateStr && l.to >= dateStr);
            const dayHol = holidays.find(h => h.date === dateStr);

            const canApply = Auth.can('leaves.create');
            return `
              <div class="leave-cal-day ${isToday ? 'today' : ''}" 
                   style="${isWeekend ? 'background:rgba(255,255,255,0.015);' : ''}${dayHol ? 'border-color:rgba(239,68,68,0.4);' : ''}"
                   ${canApply ? `onclick="Leaves.onCalendarDateClick('${dateStr}', '${isMyMode ? 'my' : 'employee'}')"` : ''}
                   title="${canApply ? (isMyMode ? `Click to apply for your leave on ${dateStr}` : `Click to mark leave for an employee on ${dateStr}`) : `Leave calendar for ${dateStr}`}">
                <div class="leave-cal-header">
                  <span class="cal-day-num" style="${isWeekend ? 'color:var(--danger);' : ''}${isToday ? 'background:var(--primary);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:700;' : ''}">${d}</span>
                  ${canApply ? `
                    <span class="cal-quick-apply">
                      <i class="fa ${isMyMode ? 'fa-plus' : 'fa-user-plus'}"></i> ${isMyMode ? 'Apply' : 'Mark'}
                    </span>
                  ` : ''}
                </div>

                ${dayHol ? `
                  <div class="cal-event" style="background:rgba(239,68,68,0.15);color:var(--danger);font-weight:600;margin-bottom:3px" title="Holiday: ${dayHol.name}">
                    <i class="fa fa-umbrella-beach" style="margin-right:2px"></i> ${dayHol.name}
                  </div>
                ` : ''}

                ${dayLeaves.slice(0, 3).map(l => {
                  const emp = DB.find('employees', l.employeeId);
                  const type = DB.find('leave_types', l.typeId);
                  const isPending = l.status === 'pending';
                  const color = type?.color || 'var(--primary)';

                  if (isMyMode) {
                    return isPending ? `
                      <div class="cal-event cal-event-pending" title="My Request — ${type?.name||'Leave'} (Pending Review)">
                        <i class="fa fa-clock" style="margin-right:2px"></i> My Request • ${type?.code||'Leave'}
                      </div>
                    ` : `
                      <div class="cal-event" style="background:${color}22;color:${color};font-weight:600" title="My Leave — ${type?.name||'Leave'} (Approved)">
                        <i class="fa fa-circle-check" style="margin-right:2px"></i> My Leave • ${type?.code||'Leave'}
                      </div>
                    `;
                  } else {
                    return isPending ? `
                      <div class="cal-event cal-event-pending" title="${emp?.fullName||'Employee'} (${emp?.empNo||''}) — ${type?.name||'Leave'} (Pending Review)">
                        <i class="fa fa-clock" style="margin-right:2px"></i> ${Utils.avatarInitials(emp?.fullName||'?')} ${emp?.firstName||'Emp'} • ${type?.code||'Leave'}
                      </div>
                    ` : `
                      <div class="cal-event" style="background:${color}22;color:${color};font-weight:600" title="${emp?.fullName||'Employee'} (${emp?.empNo||''}) — ${type?.name||'Leave'} (Approved)">
                        <i class="fa fa-circle-check" style="margin-right:2px"></i> ${Utils.avatarInitials(emp?.fullName||'?')} ${emp?.firstName||'Emp'} • ${type?.code||'Leave'}
                      </div>
                    `;
                  }
                }).join('')}

                ${dayLeaves.length > 3 ? `
                  <div style="font-size:9.5px;color:var(--text-muted);font-weight:600;padding:1px 4px">+${dayLeaves.length - 3} more</div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Legend -->
        <div style="display:flex;gap:18px;margin-top:18px;flex-wrap:wrap;align-items:center;border-top:1px solid var(--border);padding-top:14px">
          <div style="display:flex;align-items:center;gap:6px;font-size:12px"><div style="width:12px;height:12px;border-radius:3px;background:var(--primary);opacity:0.3;border:1px solid var(--primary)"></div> Approved Leave</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px"><div style="width:12px;height:12px;border-radius:3px;background:rgba(245,158,11,0.2);border:1px dashed #f59e0b"></div> Pending Request</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px"><div style="width:12px;height:12px;border-radius:3px;background:rgba(239,68,68,0.2);border:1px solid var(--danger)"></div> Holiday</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px"><div style="width:12px;height:12px;border-radius:50%;background:var(--primary)"></div> Today</div>
          <div style="margin-left:auto;font-size:11.5px;color:var(--text-3)">
            <i class="fa fa-info-circle" style="margin-right:4px"></i>
            ${isMyMode ? 'Click any date to apply for your personal leave' : 'Click any date to mark leave for an employee'}
          </div>
        </div>
      </div>
    `;
  },

  renderYearMatrix(container, year, displayLeaves, holidays, isMyMode, isManagement, isDeptMgr, myEmp, filteredStaff, depts, myQuotaRemaining) {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // Compute stats for current year
    const yearLeaves = displayLeaves.filter(l => (l.from && l.from.startsWith(String(year))) || (l.to && l.to.startsWith(String(year))));
    const approvedCount = yearLeaves.filter(l => l.status === 'approved').length;
    const pendingCount = yearLeaves.filter(l => l.status === 'pending' || l.status === 'manager_approved').length;
    const holidaysCount = holidays.filter(h => h.date && h.date.startsWith(String(year))).length;

    container.innerHTML = `
      <!-- Stage 2 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm ${this.currentView==='calendar'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('calendar')">
            <i class="fa fa-calendar-days"></i> Leave Calendar &amp; Matrix
          </button>
          <button class="btn btn-sm ${this.currentView==='holidays'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('holidays')">
            <i class="fa fa-umbrella-beach"></i> Corporate Holidays (${holidays.length})
          </button>
        </div>
        ${Auth.can('leaves.create') ? `<button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-plus"></i> Apply Leave</button>` : ''}
      </div>

      <div class="card" style="padding:22px">
        <!-- Top Controls Bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <!-- Left: Scope Switcher, Year Carousel & View Switcher -->
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            ${isManagement ? `
              <div class="cal-mode-switcher">
                <button class="cal-mode-btn ${isMyMode ? 'active' : ''}" onclick="Leaves.setCalMode('my')">
                  <i class="fa fa-user"></i> My Leave Planner
                </button>
                <button class="cal-mode-btn ${!isMyMode ? 'active' : ''}" onclick="Leaves.setCalMode('employee')">
                  <i class="fa fa-users"></i> Employee Leave Planner
                </button>
              </div>
            ` : ''}

            <!-- Carousel (< 2026 >) -->
            <div style="display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:3px 8px">
              <button class="btn btn-ghost btn-sm" onclick="Leaves.prevYear()" title="Previous Year"><i class="fa fa-chevron-left"></i></button>
              <h3 style="font-size:17px;font-weight:800;margin:0;min-width:85px;text-align:center;color:var(--primary);letter-spacing:0.5px">
                <i class="fa fa-calendar" style="margin-right:6px"></i>${year}
              </h3>
              <button class="btn btn-ghost btn-sm" onclick="Leaves.nextYear()" title="Next Year"><i class="fa fa-chevron-right"></i></button>
            </div>

            <!-- 12-Month Planner View Indicator (Month view removed) -->
            <div style="display:flex;align-items:center;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:2px">
              <span class="btn btn-xs btn-primary" style="cursor:default;user-select:none;font-weight:700">
                <i class="fa fa-table-cells"></i> 12-Month Planner
              </span>
            </div>
          </div>

          <!-- Right: Search & Action -->
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            ${(!isMyMode && isManagement) ? `
              ${!isDeptMgr ? `
                <select class="form-control" style="width:auto;font-size:12px;padding:6px 10px;height:34px" onchange="Leaves.setCalDeptFilter(this.value)">
                  <option value="all" ${this.calDeptFilter === 'all' ? 'selected' : ''}>All Departments</option>
                  ${depts.map(d => `<option value="${d.id}" ${this.calDeptFilter == d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
              ` : ''}
              <input type="text" class="form-control" placeholder="Search staff..." style="width:140px;font-size:12px;padding:6px 10px;height:34px" value="${this.calEmpSearch || ''}" oninput="Leaves.setCalEmpSearch(this.value)">
            ` : ''}

            ${Auth.can('leaves.create') ? (isMyMode ? `
              <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm(null, 'my')">
                <i class="fa fa-calendar-plus" style="margin-right:6px"></i> Apply for Leave
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm(null, 'employee')">
                <i class="fa fa-user-plus" style="margin-right:6px"></i> Mark Employee Leave
              </button>
            `) : ''}
          </div>
        </div>

        <!-- Scope Banner -->
        <div style="background:linear-gradient(135deg, ${isMyMode ? 'rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.08) 100%' : 'rgba(245,158,11,0.08) 0%, rgba(99,102,241,0.08) 100%'});border:1px solid ${isMyMode ? 'rgba(99,102,241,0.22)' : 'rgba(245,158,11,0.25)'};border-radius:10px;padding:12px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:9px;background:${isMyMode ? 'rgba(99,102,241,0.18)' : 'rgba(245,158,11,0.18)'};color:${isMyMode ? 'var(--primary)' : '#f59e0b'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
              <i class="fa ${isMyMode ? 'fa-user' : 'fa-users'}"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:13.5px;color:var(--text)">
                ${isMyMode ? `My 12-Month Annual Leave Planner — ${myEmp?.fullName} (${myEmp?.empNo})` : `Employee 12-Month Annual Leave Planner — ${isDeptMgr ? `${Utils.getDeptName(myEmp?.departmentId)} Staff` : 'All Company Staff'}`}
              </div>
              <div style="font-size:12px;color:var(--text-3)">
                The days are marked in the calendar as per the color scheme below. Click any desired day to mark or view leave.
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="chip" style="font-size:11px;padding:3px 9px"><i class="fa fa-umbrella-beach" style="color:#ef4444;margin-right:4px"></i>${holidaysCount} Holidays</span>
            <span class="chip" style="font-size:11px;padding:3px 9px"><i class="fa fa-circle-check" style="color:#10b981;margin-right:4px"></i>${approvedCount} Approved</span>
            ${pendingCount > 0 ? `<span class="chip" style="font-size:11px;padding:3px 9px;background:rgba(245,158,11,0.15);color:#d97706"><i class="fa fa-clock" style="margin-right:4px"></i>${pendingCount} Pending</span>` : ''}
            ${isMyMode ? `<span class="chip" style="font-size:11px;padding:3px 9px;background:rgba(16,185,129,0.15);color:#059669"><i class="fa fa-scale-balanced" style="margin-right:4px"></i>${myQuotaRemaining}d Balance</span>` : ''}
          </div>
        </div>

        <!-- Exact 8-Color Scheme Legend from Leaves.pdf -->
        <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;align-items:center;background:var(--surface);padding:10px 14px;border-radius:10px;border:1px solid var(--border)">
          <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-right:4px">Color Scheme:</div>
          <div style="font-size:10.5px;padding:3px 9px;border-radius:5px;background:#dbeafe;color:#1e40af;font-weight:700;border:1px solid #bfdbfe">Weekend</div>
          <div style="font-size:10.5px;padding:3px 9px;border-radius:5px;background:#fef3c7;color:#92400e;font-weight:700;border:1px solid #fde68a">Today</div>
          <div style="font-size:10.5px;padding:3px 9px;border-radius:5px;background:#991b1b;color:#ffffff;font-weight:700">Holiday</div>
          <div style="font-size:10.5px;padding:3px 9px;border-radius:5px;background:#15803d;color:#ffffff;font-weight:700">Approved</div>
          <div style="font-size:10.5px;padding:3px 9px;border-radius:5px;background:#ea580c;color:#ffffff;font-weight:700">Pending by HR</div>
          <div style="font-size:10.5px;padding:3px 9px;border-radius:5px;background:#dc2626;color:#ffffff;font-weight:700">Pending by DM</div>
          <div style="font-size:10.5px;padding:3px 9px;border-radius:5px;background:#166534;color:#ffffff;font-weight:700">Token Utilized</div>
          <div style="font-size:10.5px;padding:3px 9px;border-radius:5px;background:#94a3b8;color:#ffffff;font-weight:700;text-decoration:line-through">Rejected / Cancelled</div>
        </div>

        <!-- 12-Month Matrix Responsive Grid (3 to 4 columns) -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px">
          ${monthNames.map((mName, mIdx) => {
            const firstD = new Date(year, mIdx, 1).getDay();
            const daysInM = new Date(year, mIdx + 1, 0).getDate();
            const mCells = [];
            for (let i = 0; i < firstD; i++) mCells.push(null);
            for (let d = 1; d <= daysInM; d++) mCells.push(d);

            return `
              <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.03)">
                <div style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);color:#fff;padding:6px 10px;display:flex;align-items:center;justify-content:space-between">
                  <span style="font-weight:700;font-size:12px;letter-spacing:0.3px">${mName} ${year}</span>
                  <button class="btn btn-ghost btn-xs" style="color:#fff;padding:1px 5px;font-size:9.5px" onclick="Leaves.calMonth=${mIdx};Leaves.setCalViewMode('month')" title="Open Single Month Focus">
                    <i class="fa fa-up-right-from-square"></i>
                  </button>
                </div>

                <div style="padding:6px">
                  <div style="display:grid;grid-template-columns:repeat(7, 1fr);text-align:center;font-size:9.5px;font-weight:700;color:var(--text-3);margin-bottom:3px">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>
                  <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:2px;text-align:center">
                    ${mCells.map(d => {
                      if (!d) return '<div style="height:25px"></div>';
                      const dateStr = `${year}-${String(mIdx+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                      const isToday = dateStr === todayStr;
                      const dayOfWeek = new Date(year, mIdx, d).getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                      const dayHol = holidays.find(h => h.date === dateStr);
                      const dayLeaves = displayLeaves.filter(l => l.from <= dateStr && l.to >= dateStr);
                      const hasApproved = dayLeaves.some(l => l.status === 'approved');
                      const hasPendingDM = dayLeaves.some(l => l.status === 'pending');
                      const hasPendingHR = dayLeaves.some(l => l.status === 'manager_approved');
                      const hasToken = dayLeaves.some(l => l.tokensAttached || l.tokenRedeemed);
                      const hasRejected = dayLeaves.some(l => l.status === 'rejected');

                      let bg = isWeekend ? '#dbeafe' : 'var(--surface)';
                      let color = isWeekend ? '#1e40af' : 'var(--text)';
                      let border = isToday ? '2px solid #f59e0b' : '1px solid var(--border)';
                      let title = `${mName} ${d}, ${year}`;

                      if (dayHol) {
                        bg = '#991b1b';
                        color = '#ffffff';
                        title += ` • Holiday: ${dayHol.name}`;
                      } else if (hasToken) {
                        bg = '#166534';
                        color = '#ffffff';
                        title += ` • Compensatory Token Utilized`;
                      } else if (hasApproved) {
                        bg = '#15803d';
                        color = '#ffffff';
                        title += ` • Approved Leave (${dayLeaves.length})`;
                      } else if (hasPendingHR) {
                        bg = '#ea580c';
                        color = '#ffffff';
                        title += ` • Pending HR Approval`;
                      } else if (hasPendingDM) {
                        bg = '#dc2626';
                        color = '#ffffff';
                        title += ` • Pending Manager Approval`;
                      } else if (hasRejected) {
                        bg = '#94a3b8';
                        color = '#ffffff';
                        title += ` • Rejected Leave`;
                      } else if (isToday) {
                        bg = '#fef3c7';
                        color = '#92400e';
                        title += ` • Today`;
                      }

                      return `
                        <div style="height:25px;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:${(isToday||dayHol||hasApproved||hasPendingDM||hasPendingHR)?'700':'500'};background:${bg};color:${color};border:${border};border-radius:4px;cursor:pointer;transition:transform .12s"
                             title="${title}"
                             onmouseover="this.style.transform='scale(1.2)';this.style.zIndex='5'"
                             onmouseout="this.style.transform='none';this.style.zIndex='1'"
                             onclick="Leaves.onCalendarDateClick('${dateStr}', '${isMyMode ? 'my' : 'employee'}')">
                          ${d}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },


  renderSortArrow(col) {
    if (this.quotaSortCol !== col) {
      return '<i class="fa fa-caret-up" style="color:#7dd3fc;margin-left:3px;font-size:10px"></i>';
    }
    return this.quotaSortAsc 
      ? '<i class="fa fa-caret-up" style="color:#0284c7;margin-left:3px;font-size:11px;font-weight:bold"></i>' 
      : '<i class="fa fa-caret-down" style="color:#0284c7;margin-left:3px;font-size:11px;font-weight:bold"></i>';
  },

  setQuotaSort(col) {
    if (this.quotaSortCol === col) {
      this.quotaSortAsc = !this.quotaSortAsc;
    } else {
      this.quotaSortCol = col;
      this.quotaSortAsc = true;
    }
    this.renderView();
  },

  setQuotaStatusFilter(st) {
    this.quotaStatusFilter = st;
    this.renderView();
  },

  setQuotaDeptFilter(deptId) {
    this.quotaDeptFilter = deptId;
    this.renderView();
  },

  searchQuota(q) {
    this.quotaSearchQuery = q;
    this.renderView();
  },

  getEmployeeLeaveQuotaMetrics(emp, year = 2026) {
    if (!emp || !emp.id) return null;
    const balances = DB.get('leave_balances') || [];
    const bal = balances.find(b => b.employeeId === emp.id && (b.year === year || !b.year));
    const allApprovedLeaves = (DB.get('leave_requests') || []).filter(l => 
      l.employeeId === emp.id && 
      (l.status === 'approved' || l.status === 'manager_approved') &&
      (!l.from || l.from.startsWith(String(year)))
    );

    // 1. LEAVE IN QUOTA
    const qAnnual = bal?.quotas?.[2] ?? 20;
    const qCasual = bal?.quotas?.[1] ?? 12;
    const qSick = bal?.quotas?.[3] ?? 15;
    const qSickCasual = qCasual + qSick; // Combined Sick/Casual
    const qComp = bal?.quotas?.[7] ?? 5;
    const qTotal = qAnnual + qSickCasual + qComp;

    // 2. AVAILED LEAVE
    const avAnnual = allApprovedLeaves.filter(l => (l.typeId === 2 || l.quotaTypeId === 2) && !l.salaryDeduction).reduce((s, l) => s + (l.days || 0), 0);
    const avSickCasual = allApprovedLeaves.filter(l => (l.typeId === 1 || l.typeId === 3 || l.quotaTypeId === 1 || l.quotaTypeId === 3) && !l.salaryDeduction).reduce((s, l) => s + (l.days || 0), 0);
    const avComp = allApprovedLeaves.filter(l => (l.typeId === 7 || l.quotaTypeId === 7) && !l.salaryDeduction).reduce((s, l) => s + (l.days || 0), 0);
    const avHalf = allApprovedLeaves.filter(l => l.typeId === 8 || l.leaveDuration === 'half_first' || l.leaveDuration === 'half_second' || l.days === 0.5).reduce((s, l) => s + (l.days || 0), 0);
    const avShort = allApprovedLeaves.filter(l => l.typeId === 9 || l.leaveDuration === 'short' || l.days === 0.25).reduce((s, l) => s + (l.days || 0), 0);
    const avSalary = allApprovedLeaves.filter(l => l.salaryDeduction === true || l.typeId === 6).reduce((s, l) => s + (l.deductionDays || l.days || 0), 0);
    const avTotal = avAnnual + avSickCasual + avComp + avSalary;

    // 3. REMAINING LEAVES (Image order: Sick/Casual, Compensation, Annual, Total)
    const remSickCasual = Math.max(0, Math.round((qSickCasual - avSickCasual) * 100) / 100);
    const remComp = Math.max(0, Math.round((qComp - avComp) * 100) / 100);
    const remAnnual = Math.max(0, Math.round((qAnnual - avAnnual) * 100) / 100);
    const remTotal = Math.round((remSickCasual + remComp + remAnnual) * 100) / 100;

    // 4. OTHER LEAVE
    const otherUnpaid = allApprovedLeaves.filter(l => l.salaryDeduction === true || l.typeId === 6).reduce((s, l) => s + (l.deductionDays || l.days || 0), 0);
    const tokenAvailments = (DB.get('token_availments') || []).filter(a => a.employeeId === emp.id && a.status === 'approved');
    const tokenDaysFromAvail = tokenAvailments.reduce((s, a) => s + (Number(a.days) || 0), 0);
    const tokenDaysFromRequests = allApprovedLeaves.filter(l => l.typeId === 10).reduce((s, l) => s + l.days, 0);
    const otherToken = Math.round(Math.max(tokenDaysFromAvail, tokenDaysFromRequests) * 10) / 10;

    return {
      empId: emp.id,
      empNo: emp.empNo,
      fullName: emp.fullName,
      departmentId: emp.departmentId,
      designationId: emp.designationId,
      // Leave in quota
      qAnnual,
      qSickCasual,
      qComp,
      qTotal,
      // Availed leave
      avAnnual,
      avSickCasual,
      avComp,
      avHalf,
      avShort,
      avSalary,
      avTotal,
      // Remaining leaves
      remSickCasual,
      remComp,
      remAnnual,
      remTotal,
      // Other leave
      otherUnpaid,
      otherToken,
    };
  },

  sortQuotaRows(rows) {
    const col = this.quotaSortCol || 'sr';
    const asc = this.quotaSortAsc !== false;
    return [...rows].sort((a, b) => {
      let vA = a[col];
      let vB = b[col];
      if (col === 'sr') {
        vA = a.sr;
        vB = b.sr;
      } else if (col === 'name') {
        vA = (a.fullName || '').toLowerCase();
        vB = (b.fullName || '').toLowerCase();
      } else if (col === 'empNo') {
        vA = (a.empNo || '').toLowerCase();
        vB = (b.empNo || '').toLowerCase();
      } else {
        vA = Number(vA) || 0;
        vB = Number(vB) || 0;
      }
      if (vA < vB) return asc ? -1 : 1;
      if (vA > vB) return asc ? 1 : -1;
      return 0;
    });
  },

  getFilteredQuotaRows(allRows) {
    return allRows.filter(r => {
      // Dept filter
      if (this.quotaDeptFilter !== 'all' && r.departmentId !== parseInt(this.quotaDeptFilter)) {
        return false;
      }
      // Search query
      if (this.quotaSearchQuery) {
        const q = this.quotaSearchQuery.toLowerCase().trim();
        const matchName = r.fullName.toLowerCase().includes(q);
        const matchEmpNo = r.empNo.toLowerCase().includes(q);
        if (!matchName && !matchEmpNo) return false;
      }
      // Status filter
      if (this.quotaStatusFilter === 'full') {
        return r.avTotal === 0;
      } else if (this.quotaStatusFilter === 'low') {
        return r.remTotal > 0 && r.remTotal <= 10;
      } else if (this.quotaStatusFilter === 'exhausted') {
        return r.remTotal === 0;
      } else if (this.quotaStatusFilter === 'availed') {
        return r.avTotal > 0;
      }
      return true;
    });
  },

  renderQuotaMatrixTable(displayedRows, isEmployeeView, isHrOrAdmin) {
    const canEdit = !isEmployeeView && Auth.can('leaves.edit');
    const sumQAnnual = displayedRows.reduce((s, r) => s + r.qAnnual, 0);
    const sumQSickCasual = displayedRows.reduce((s, r) => s + r.qSickCasual, 0);
    const sumQComp = displayedRows.reduce((s, r) => s + r.qComp, 0);
    const sumQTotal = displayedRows.reduce((s, r) => s + r.qTotal, 0);

    const sumAvAnnual = displayedRows.reduce((s, r) => s + r.avAnnual, 0);
    const sumAvSickCasual = displayedRows.reduce((s, r) => s + r.avSickCasual, 0);
    const sumAvComp = displayedRows.reduce((s, r) => s + r.avComp, 0);
    const sumAvHalf = displayedRows.reduce((s, r) => s + r.avHalf, 0);
    const sumAvShort = displayedRows.reduce((s, r) => s + r.avShort, 0);
    const sumAvSalary = displayedRows.reduce((s, r) => s + r.avSalary, 0);
    const sumAvTotal = displayedRows.reduce((s, r) => s + r.avTotal, 0);

    const sumRemSickCasual = displayedRows.reduce((s, r) => s + r.remSickCasual, 0);
    const sumRemComp = displayedRows.reduce((s, r) => s + r.remComp, 0);
    const sumRemAnnual = displayedRows.reduce((s, r) => s + r.remAnnual, 0);
    const sumRemTotal = displayedRows.reduce((s, r) => s + r.remTotal, 0);

    const sumOtherUnpaid = displayedRows.reduce((s, r) => s + r.otherUnpaid, 0);
    const sumOtherToken = displayedRows.reduce((s, r) => s + r.otherToken, 0);

    return `
      <div class="table-responsive" style="overflow-x:auto;border:1px solid #bae6fd;border-radius:10px;background:var(--card);box-shadow:0 2px 10px rgba(0,0,0,0.02)">
        <table class="quota-matrix-table" style="width:100%;min-width:1200px;border-collapse:separate;border-spacing:0;font-size:12px">
          <thead>
            <!-- Grouping Row 1 -->
            <tr>
              <th rowspan="2" class="qm-th-sortable" style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;padding:9px 6px;text-align:center;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('sr')">
                Sr.# ${this.renderSortArrow('sr')}
              </th>
              <th rowspan="2" class="qm-th-sortable" style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;padding:9px 8px;text-align:left;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('empNo')">
                Employee ID ${this.renderSortArrow('empNo')}
              </th>
              <th rowspan="2" class="qm-th-sortable" style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;padding:9px 10px;text-align:left;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('name')">
                Employee ${this.renderSortArrow('name')}
              </th>

              <!-- Group 1: Leave In Quota (4 cols) -->
              <th colspan="4" style="background:#bae6fd;color:#0369a1;border:1px solid #93c5fd;padding:8px 6px;text-align:center;font-weight:800;font-size:12.5px;letter-spacing:0.3px">
                Leave In Quota
              </th>

              <!-- Group 2: Availed Leave (7 cols) -->
              <th colspan="7" style="background:#bae6fd;color:#0369a1;border:1px solid #93c5fd;padding:8px 6px;text-align:center;font-weight:800;font-size:12.5px;letter-spacing:0.3px">
                Availed Leave
              </th>

              <!-- Group 3: Remaining Leaves (4 cols) -->
              <th colspan="4" style="background:#bae6fd;color:#0369a1;border:1px solid #93c5fd;padding:8px 6px;text-align:center;font-weight:800;font-size:12.5px;letter-spacing:0.3px">
                Remaining Leaves
              </th>

              <!-- Group 4: Other Leave (2 cols) -->
              <th colspan="2" style="background:#bae6fd;color:#0369a1;border:1px solid #93c5fd;padding:8px 6px;text-align:center;font-weight:800;font-size:12.5px;letter-spacing:0.3px">
                Other Leave
              </th>

              ${canEdit ? `
                <th rowspan="2" style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;padding:9px 8px;text-align:right;font-weight:700">
                  Action
                </th>
              ` : ''}
            </tr>

            <!-- Sub-headers Row 2 -->
            <tr>
              <!-- Under Leave In Quota -->
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('qAnnual')">Annual ${this.renderSortArrow('qAnnual')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('qSickCasual')">Sick/Casual ${this.renderSortArrow('qSickCasual')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('qComp')">Compensation ${this.renderSortArrow('qComp')}</th>
              <th class="qm-th-sortable" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bae6fd;padding:7px 6px;font-weight:800;white-space:nowrap" onclick="Leaves.setQuotaSort('qTotal')">Total ${this.renderSortArrow('qTotal')}</th>

              <!-- Under Availed Leave -->
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('avAnnual')">Annual ${this.renderSortArrow('avAnnual')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('avSickCasual')">Sick/Casual ${this.renderSortArrow('avSickCasual')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('avComp')">Compensation ${this.renderSortArrow('avComp')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('avHalf')">Half Leave ${this.renderSortArrow('avHalf')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('avShort')">Short Leave ${this.renderSortArrow('avShort')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('avSalary')">Salary ${this.renderSortArrow('avSalary')}</th>
              <th class="qm-th-sortable" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bae6fd;padding:7px 6px;font-weight:800;white-space:nowrap" onclick="Leaves.setQuotaSort('avTotal')">Total ${this.renderSortArrow('avTotal')}</th>

              <!-- Under Remaining Leaves -->
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('remSickCasual')">Sick/Casual ${this.renderSortArrow('remSickCasual')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('remComp')">Compensation ${this.renderSortArrow('remComp')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('remAnnual')">Annual ${this.renderSortArrow('remAnnual')}</th>
              <th class="qm-th-sortable" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bae6fd;padding:7px 6px;font-weight:800;white-space:nowrap" onclick="Leaves.setQuotaSort('remTotal')">Total ${this.renderSortArrow('remTotal')}</th>

              <!-- Under Other Leave -->
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('otherUnpaid')">Un Paid Leave ${this.renderSortArrow('otherUnpaid')}</th>
              <th class="qm-th-sortable" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:7px 6px;font-weight:700;white-space:nowrap" onclick="Leaves.setQuotaSort('otherToken')">Token Leave ${this.renderSortArrow('otherToken')}</th>
            </tr>
          </thead>
          <tbody>
            ${displayedRows.length === 0 ? `
              <tr>
                <td colspan="${canEdit ? 21 : 20}" style="padding:32px;text-align:center;color:var(--text-muted)">
                  <i class="fa fa-scale-balanced" style="font-size:24px;margin-bottom:8px"></i>
                  <div>No employee quota records match the selected filters.</div>
                </td>
              </tr>
            ` : displayedRows.map((r, idx) => `
              <tr class="qm-data-row" style="transition:background .15s" onmouseenter="this.style.background='rgba(224, 242, 254, 0.35)'" onmouseleave="this.style.background='transparent'">
                <td style="border:1px solid #e0f2fe;padding:7px 6px;font-size:11.5px;color:var(--text-3);text-align:center">${idx + 1}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 8px;font-weight:600;font-size:12px;color:var(--primary);text-align:left">${r.empNo}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 10px;text-align:left">
                  <div style="font-weight:700;font-size:12.5px;color:var(--text)">${r.fullName}</div>
                  <div style="font-size:10.5px;color:var(--text-3)">${Utils.getDeptName(r.departmentId)}</div>
                </td>
                
                <!-- Leave In Quota -->
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center">${r.qAnnual}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center">${r.qSickCasual}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center">${r.qComp}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;font-weight:800;background:rgba(59,130,246,0.06);color:#1d4ed8">${r.qTotal}</td>

                <!-- Availed Leave -->
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.avAnnual>0?'var(--warning)':'var(--text-3)'}">${r.avAnnual}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.avSickCasual>0?'var(--warning)':'var(--text-3)'}">${r.avSickCasual}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.avComp>0?'var(--warning)':'var(--text-3)'}">${r.avComp}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.avHalf>0?'var(--warning)':'var(--text-3)'}">${r.avHalf}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.avShort>0?'var(--warning)':'var(--text-3)'}">${r.avShort}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.avSalary>0?'var(--danger)':'var(--text-3)'}">${r.avSalary}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;font-weight:800;background:rgba(245,158,11,0.08);color:#d97706">${r.avTotal}</td>

                <!-- Remaining Leaves -->
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.remSickCasual===0?'var(--danger)':'var(--success)'}">${r.remSickCasual}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.remComp===0?'var(--danger)':'var(--success)'}">${r.remComp}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.remAnnual===0?'var(--danger)':'var(--success)'}">${r.remAnnual}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;font-weight:800;background:rgba(16,185,129,0.08);color:#059669">${r.remTotal}</td>

                <!-- Other Leave -->
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.otherUnpaid>0?'var(--danger)':'var(--text-3)'}">${r.otherUnpaid}</td>
                <td style="border:1px solid #e0f2fe;padding:7px 6px;text-align:center;color:${r.otherToken>0?'#a855f7':'var(--text-3)'}">${r.otherToken}</td>

                ${canEdit ? `
                  <td style="border:1px solid #e0f2fe;padding:7px 8px;text-align:right">
                    <button class="btn btn-ghost btn-sm" onclick="Leaves.showSetQuotaModal(${r.empId})" title="Edit Leave Quotas for ${r.fullName}" style="padding:3px 8px">
                      <i class="fa fa-pen" style="font-size:11px"></i>
                    </button>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
          ${displayedRows.length > 0 ? `
            <tfoot>
              <tr style="background:#e0f2fe;font-weight:800;color:#0369a1;border-top:2px solid #93c5fd">
                <td colspan="3" style="border:1px solid #bae6fd;padding:9px 12px;text-align:right">
                  Grand Total (${displayedRows.length} ${displayedRows.length===1?'Employee':'Employees'}):
                </td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumQAnnual}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumQSickCasual}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumQComp}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center;font-weight:900;background:#dbeafe;color:#1d4ed8">${sumQTotal}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumAvAnnual}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumAvSickCasual}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumAvComp}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumAvHalf}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumAvShort}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumAvSalary}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center;font-weight:900;background:#dbeafe;color:#b45309">${sumAvTotal}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumRemSickCasual}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumRemComp}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumRemAnnual}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center;font-weight:900;background:#dbeafe;color:#047857">${sumRemTotal}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumOtherUnpaid}</td>
                <td style="border:1px solid #bae6fd;padding:9px 6px;text-align:center">${sumOtherToken}</td>
                ${canEdit ? '<td style="border:1px solid #bae6fd"></td>' : ''}
              </tr>
            </tfoot>
          ` : ''}
        </table>
      </div>
    `;
  },

  exportQuotaMatrixCSV() {
    if (!Auth.can('leaves.export') || !Auth.canSeeFeature('leaves.export')) {
      Toast.show('Permission denied: You do not have permission to export leave records.', 'warning');
      return;
    }
    const activeEmps = this.getScopedEmployees();
    const rows = activeEmps.map(emp => this.getEmployeeLeaveQuotaMetrics(emp, this.quotaYear || 2026));
    
    if (!rows.length) {
      Toast.show('No leave quota records to export', 'warning');
      return;
    }

    const headers = [
      'Sr.#',
      'Employee ID',
      'Employee Name',
      'Department',
      'Designation',
      'Quota Annual',
      'Quota Sick/Casual',
      'Quota Compensation',
      'Quota Total',
      'Availed Annual',
      'Availed Sick/Casual',
      'Availed Compensation',
      'Availed Half Leave',
      'Availed Short Leave',
      'Availed Salary Deduction',
      'Availed Total',
      'Remaining Sick/Casual',
      'Remaining Compensation',
      'Remaining Annual',
      'Remaining Total',
      'Other Unpaid Leave',
      'Other Token Leave'
    ];

    const csvData = rows.map((r, idx) => [
      idx + 1,
      r.empNo,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${Utils.getDeptName(r.departmentId).replace(/"/g, '""')}"`,
      `"${Utils.getDesigName(r.designationId).replace(/"/g, '""')}"`,
      r.qAnnual,
      r.qSickCasual,
      r.qComp,
      r.qTotal,
      r.avAnnual,
      r.avSickCasual,
      r.avComp,
      r.avHalf,
      r.avShort,
      r.avSalary,
      r.avTotal,
      r.remSickCasual,
      r.remComp,
      r.remAnnual,
      r.remTotal,
      r.otherUnpaid,
      r.otherToken
    ]);

    const csv = [headers.join(','), ...csvData.map(c => c.join(','))].join('\n');
    const filename = `leave_quota_balance_${this.quotaYear || 2026}_${Utils.today()}.csv`;
    Utils.downloadCSV(csv, filename);
    Toast.show(`Exported ${rows.length} employee quotas to ${filename}`, 'success');
  },

  renderQuota(container) {
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isDeptMgr = Auth.role === 'dept_manager';
    const isHrOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const types = DB.get('leave_types') || [];
    const allEmps = DB.get('employees') || [];

    if (!this.quotaSubView) this.quotaSubView = 'matrix';

    // If sub-view is 'types', render the integrated Leave Types & Policy console
    if (this.quotaSubView === 'types') {
      this.renderTypes(container);
      return;
    }

    if (isEmployee) {
      // ── EMPLOYEE VIEW: PERSONAL LEAVE QUOTA BREAKDOWN & HISTORY ──
      const myEmp = Auth.employee || allEmps.find(e => e.id === Auth.user?.employeeId) || allEmps[0];
      if (!myEmp) {
        container.innerHTML = `<div class="card"><div class="empty-state" style="padding:60px"><i class="fa fa-user-slash"></i><h3>No Employee Profile Found</h3><p>Your user account is not linked to an active employee profile.</p></div></div>`;
        return;
      }
      const myRow = this.getEmployeeLeaveQuotaMetrics(myEmp, this.quotaYear || 2026) || {};
      myRow.sr = 1;
      const myLeaves = (DB.get('leave_requests') || []).filter(l => l.employeeId === myEmp.id && l.status === 'approved');

      const typeStats = types.map(t => {
        let allocated = 0;
        if (t.id === 2) allocated = myRow.qAnnual;
        else if (t.id === 1) allocated = 12;
        else if (t.id === 3) allocated = 15;
        else if (t.id === 7) allocated = myRow.qComp;
        else allocated = t.maxDays;

        const used = myLeaves.filter(l => l.typeId === t.id).reduce((s, l) => s + l.days, 0);
        const rem = Math.max(0, allocated - used);
        const pct = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;
        return { type: t, allocated, used, rem, pct };
      });

      container.innerHTML = `
        <div class="animate-fade-in">
          <!-- Feature Header & Sub-Nav Switcher -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border);flex-wrap:wrap">
            <div>
              <h2 style="font-size:19px;font-weight:800;margin:0 0 2px 0;display:flex;align-items:center;gap:8px">
                <i class="fa fa-scale-balanced" style="color:var(--primary)"></i>
                Leave Quotas, Balances &amp; Types
              </h2>
              <div style="font-size:12px;color:var(--text-3)">View personal leave quotas, remaining balances, and company leave type policies.</div>
            </div>
            <div style="display:flex;background:var(--surface);padding:4px;border-radius:10px;border:1px solid var(--border);gap:4px">
              <button class="btn btn-sm ${this.quotaSubView !== 'types' ? 'btn-primary' : 'btn-ghost'}" onclick="Leaves.setQuotaSubView('matrix')" style="font-size:12px;font-weight:600;border-radius:7px">
                <i class="fa fa-table-cells" style="margin-right:6px"></i>My Quota &amp; Balances
              </button>
              <button class="btn btn-sm ${this.quotaSubView === 'types' ? 'btn-primary' : 'btn-ghost'}" onclick="Leaves.setQuotaSubView('types')" style="font-size:12px;font-weight:600;border-radius:7px">
                <i class="fa fa-tags" style="margin-right:6px"></i>Company Leave Types (${types.length})
              </button>
            </div>
          </div>

          <!-- Banner -->
          <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(236,72,153,0.12) 100%);border:1px solid rgba(99,102,241,0.25);border-radius:16px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="badge" style="background:rgba(236,72,153,0.2);color:#ec4899;font-size:11px"><i class="fa fa-lock" style="margin-right:4px"></i>Personal Quota (View-Only)</span>
                <span class="chip" style="font-size:11px">Entitlement Year: 2026</span>
              </div>
              <h2 style="font-size:20px;font-weight:800;margin:0 0 4px 0">${myEmp.fullName} — Leave Quota &amp; Entitlement</h2>
              <div style="font-size:12.5px;color:var(--text-3)">${Utils.getDeptName(myEmp.departmentId)} • ${Utils.getDesigName(myEmp.designationId)} • Emp #: ${myEmp.empNo}</div>
            </div>
            <div>
              ${Auth.can('leaves.create') ? `
                <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-calendar-plus"></i> Apply for Leave</button>
              ` : ''}
            </div>
          </div>

          <!-- Overall Summary Cards -->
          <div class="grid-3 mb-20">
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;border-left:4px solid var(--primary)">
              <div style="font-size:26px;font-weight:800;color:var(--primary)">${myRow.qTotal}</div>
              <div style="font-size:12px;color:var(--text-3)">Total Annual Quota Entitled</div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;border-left:4px solid var(--warning)">
              <div style="font-size:26px;font-weight:800;color:var(--warning)">${myRow.avTotal}</div>
              <div style="font-size:12px;color:var(--text-3)">Approved Leave Days Taken</div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;border-left:4px solid var(--success)">
              <div style="font-size:26px;font-weight:800;color:var(--success)">${myRow.remTotal}</div>
              <div style="font-size:12px;color:var(--text-3)">Total Balance Remaining</div>
            </div>
          </div>

          <!-- Exact 20-Column Quota & Balance Matrix for this Employee -->
          <div style="margin-bottom:24px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="font-size:15px;font-weight:800;color:var(--text)">
                <i class="fa fa-table-cells" style="color:var(--primary);margin-right:6px"></i> My Leave Quota &amp; Balance Breakdown (2026)
              </div>
              ${Auth.can('leaves.export') ? `
                <button class="btn btn-ghost btn-sm" onclick="Leaves.exportQuotaMatrixCSV()">
                  <i class="fa fa-download"></i> Download My Ledger
                </button>
              ` : ''}
            </div>
            ${this.renderQuotaMatrixTable([myRow], true, false)}
          </div>

          <!-- Compact Per Leave Type Quota Cards -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:13.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px">
              <i class="fa fa-layer-group" style="color:var(--primary);font-size:12px"></i>
              Leave Type Quota Breakdown
              <span class="badge badge-secondary" style="font-size:10px;padding:1px 6px">${typeStats.length} Types</span>
            </div>
            <button class="btn btn-ghost btn-xs" onclick="Leaves.toggleTypeBreakdown()" id="btn-toggle-breakdown" style="font-size:11px;padding:2px 8px">
              <i class="fa ${this.hideTypeBreakdown ? 'fa-chevron-down' : 'fa-chevron-up'}" style="margin-right:4px"></i>
              ${this.hideTypeBreakdown ? 'Expand' : 'Collapse'}
            </button>
          </div>

          <div id="leave-type-breakdown-container" style="${this.hideTypeBreakdown ? 'display:none;' : ''}margin-bottom:20px">
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(185px, 1fr));gap:8px">
              ${typeStats.map(s => {
                const t = s.type;
                const color = t.color || 'var(--primary)';
                const isLow = s.rem <= s.allocated * 0.3;
                const isExhausted = s.rem === 0;
                return `
                  <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${color};border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;justify-content:space-between;gap:3px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:4px">
                      <span style="font-size:11.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.name}">
                        <span class="badge" style="background:${color}18;color:${color};font-size:9.5px;padding:1px 4px;font-weight:700;margin-right:3px">${t.code}</span>
                        ${t.name}
                      </span>
                      <span style="font-size:11px;font-weight:800;color:${isExhausted ? 'var(--danger)' : color};white-space:nowrap">
                        ${s.rem}<span style="font-size:9.5px;font-weight:600;color:var(--text-3)">/${s.allocated}d</span>
                      </span>
                    </div>

                    <!-- Slim Progress Bar -->
                    <div style="height:3px;background:var(--surface-2);border-radius:2px;overflow:hidden;margin:2px 0">
                      <div style="width:${s.pct}%;background:${color};height:100%;border-radius:2px"></div>
                    </div>

                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--text-3)">
                      <span>${s.used}d used</span>
                      <span>${t.carryForward ? '<i class="fa fa-rotate-right" style="color:var(--accent);font-size:9px" title="Eligible for carry forward"></i> CF' : isExhausted ? '<span style="color:var(--danger);font-weight:700">Exhausted</span>' : '<span style="color:var(--success)">Available</span>'}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Approved Leaves History for this Employee -->
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
              Approved Leaves History (Quota Deductions)
            </div>
            <div class="table-wrapper" style="border:none;border-radius:0">
              <table>
                <thead><tr><th>Leave Type</th><th>From Date</th><th>To Date</th><th>Days Deducted</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                  ${myLeaves.length === 0 ? '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">No approved leaves taken yet this year. Your full quota is available!</td></tr>' :
                    myLeaves.map(l => {
                      const t = types.find(x => x.id === l.typeId);
                      return `<tr>
                        <td><span class="badge" style="background:${t?.color||'#6366f1'}22;color:${t?.color||'#6366f1'}">${t?.name||'Leave'}</span></td>
                        <td>${Utils.formatDate(l.from)}</td>
                        <td>${Utils.formatDate(l.to)}</td>
                        <td><strong style="color:var(--danger)">-${l.days} day(s)</strong></td>
                        <td style="font-size:12px">${l.reason}</td>
                        <td>${Utils.statusBadge(l.status)}</td>
                      </tr>`;
                    }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // ── HR MANAGER & SUPERADMIN & DEPT MANAGER VIEW ──
    const scopedEmps = this.getScopedEmployees();
    const rawRows = scopedEmps.map((emp, idx) => {
      const metrics = this.getEmployeeLeaveQuotaMetrics(emp, this.quotaYear || 2026);
      metrics.sr = idx + 1;
      return metrics;
    });

    const filteredRows = this.getFilteredQuotaRows(rawRows);
    const sortedRows = this.sortQuotaRows(filteredRows);

    // Summary aggregates across active scoped employees
    const totalStaffCount = rawRows.length;
    const totalCompanyQuota = rawRows.reduce((s, r) => s + r.qTotal, 0);
    const totalCompanyAvailed = rawRows.reduce((s, r) => s + r.avTotal, 0);
    const totalCompanyRemaining = rawRows.reduce((s, r) => s + r.remTotal, 0);

    container.innerHTML = `
      <div class="animate-fade-in">
        
        <!-- Header & Action Controls Bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border);flex-wrap:wrap">
          <div>
            <h3 style="font-size:18px;font-weight:800;margin:0 0 4px 0;display:flex;align-items:center;gap:8px">
              <i class="fa fa-scale-balanced" style="color:var(--primary);margin-right:6px"></i> Annual Leave Quotas, Balances &amp; Types — ${this.quotaYear || 2026}
            </h3>
            <div style="font-size:12.5px;color:var(--text-3)">
              Unified leave console tracking employee quotas, availed days, remaining balances, and company leave types catalog.
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <!-- Sub-View Switcher Pills (Matrix vs Types) -->
            <div style="display:flex;background:var(--surface);padding:4px;border-radius:10px;border:1px solid var(--border);gap:4px">
              <button class="btn btn-sm ${this.quotaSubView !== 'types' ? 'btn-primary' : 'btn-ghost'}" onclick="Leaves.setQuotaSubView('matrix')" style="font-size:12px;font-weight:600;border-radius:7px">
                <i class="fa fa-table-cells" style="margin-right:6px"></i>Quota &amp; Balance Matrix
              </button>
              <button class="btn btn-sm ${this.quotaSubView === 'types' ? 'btn-primary' : 'btn-ghost'}" onclick="Leaves.setQuotaSubView('types')" style="font-size:12px;font-weight:600;border-radius:7px">
                <i class="fa fa-tags" style="margin-right:6px"></i>Leave Types &amp; Policy (${types.length})
              </button>
            </div>
            ${Auth.can('leaves.export') ? `
              <button class="btn btn-ghost btn-sm" onclick="Leaves.exportQuotaMatrixCSV()" title="Export complete matrix to CSV">
                <i class="fa fa-file-export"></i> Export CSV
              </button>
            ` : ''}
            ${Auth.can('leaves.edit') ? `
              <button class="btn btn-ghost btn-sm" onclick="Leaves.bulkAllocateQuotas()"><i class="fa fa-wand-magic-sparkles"></i> Bulk Allocate 2026 Quotas</button>
              <button class="btn btn-primary btn-sm" onclick="Leaves.showSetQuotaModal()"><i class="fa fa-plus"></i> Set / Allocate Quota</button>
            ` : ''}
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid-4 mb-20" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;border-left:4px solid var(--primary)">
            <div style="font-size:24px;font-weight:800;color:var(--primary)">${totalStaffCount}</div>
            <div style="font-size:11.5px;color:var(--text-3)">Scoped Employees</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;border-left:4px solid #3b82f6">
            <div style="font-size:24px;font-weight:800;color:#3b82f6">${totalCompanyQuota} days</div>
            <div style="font-size:11.5px;color:var(--text-3)">Total Quota Days Entitled</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;border-left:4px solid var(--warning)">
            <div style="font-size:24px;font-weight:800;color:var(--warning)">${totalCompanyAvailed} days</div>
            <div style="font-size:11.5px;color:var(--text-3)">Total Leave Days Availed</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;border-left:4px solid var(--success)">
            <div style="font-size:24px;font-weight:800;color:var(--success)">${totalCompanyRemaining} days</div>
            <div style="font-size:11.5px;color:var(--text-3)">Net Balance Days Available</div>
          </div>
        </div>

        <!-- Integrated Leave Types Policy Ribbon -->
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:10px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:11px;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">
              <i class="fa fa-tags" style="color:var(--primary);margin-right:4px"></i> Leave Types Policy:
            </span>
            ${types.map(t => `
              <span class="badge" style="background:${t.color}18;color:${t.color};border:1px solid ${t.color}44;font-size:11.5px;padding:4px 10px;display:inline-flex;align-items:center;gap:6px">
                <strong style="font-weight:700">${t.code}</strong> ${t.name} (${t.maxDays}d${t.carryForward ? ' • CF' : ''})
              </span>
            `).join('')}
          </div>
          <div style="display:flex;gap:6px">
            ${isHrOrAdmin ? `
              <button class="btn btn-ghost btn-xs" onclick="Leaves.showAddType()" style="font-size:11px"><i class="fa fa-plus"></i> Add Type</button>
            ` : ''}
            <button class="btn btn-outline btn-xs" onclick="Leaves.setQuotaSubView('types')" style="font-size:11px"><i class="fa fa-sliders"></i> Manage Types</button>
          </div>
        </div>

        <!-- Filter & Search Sub-Bar (Matching Image 1) -->
        <div class="card" style="padding:14px 18px;margin-bottom:16px;background:var(--card);border:1px solid var(--border);border-radius:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            
            <!-- STATUS Filter Pills -->
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="font-size:11px;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-right:4px">STATUS:</span>
              ${[
                { id: 'all', label: 'All Records' },
                { id: 'full', label: 'Full Quota Available' },
                { id: 'low', label: 'Low Balance (< 10d)' },
                { id: 'exhausted', label: 'Exhausted (0d)' },
                { id: 'availed', label: 'Has Availed Leaves' }
              ].map(st => `
                <button class="btn btn-sm ${this.quotaStatusFilter === st.id ? 'btn-primary' : 'btn-ghost'}" style="padding:4px 12px;font-size:11.5px;border-radius:20px;font-weight:600" onclick="Leaves.setQuotaStatusFilter('${st.id}')">
                  ${st.label}
                </button>
              `).join('')}
            </div>

            <!-- Department Filter + Search Input -->
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <select class="form-control" style="width:160px;height:32px;font-size:12px;border-radius:6px" onchange="Leaves.setQuotaDeptFilter(this.value)">
                <option value="all">All Departments</option>
                ${(DB.get('departments') || []).map(d => `<option value="${d.id}" ${this.quotaDeptFilter == d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>

              <div style="position:relative">
                <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--text-muted)"></i>
                <input type="text" class="form-control" style="padding-left:28px;width:180px;font-size:12px;height:32px;border-radius:6px" placeholder="Search employee..." value="${this.quotaSearchQuery || ''}" oninput="Leaves.searchQuota(this.value)">
              </div>
            </div>

          </div>
        </div>

        <!-- 20-Column Multi-Group Quota Table (Matching Image 2) -->
        ${this.renderQuotaMatrixTable(sortedRows, false, isHrOrAdmin)}

      </div>
    `;
  },

  showSetQuotaModal(preselectEmpId) {
    if (!Auth.can('leaves.edit')) {
      Toast.show('Access restricted: You do not have permission to allocate or edit quotas.', 'error');
      return;
    }
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const types = DB.get('leave_types') || [];
    const balances = DB.get('leave_balances') || [];
    const targetEmpId = preselectEmpId || emps[0]?.id;
    const currentBal = balances.find(b => b.employeeId === targetEmpId);

    Modal.show('Set Employee Leave Quota', `
      <div class="form-group">
        <label class="form-label required">Employee</label>
        <select class="form-control" id="sq-emp" onchange="Leaves.onQuotaEmpSelect(this.value)">
          ${emps.map(e => `<option value="${e.id}" ${e.id === targetEmpId ? 'selected' : ''}>${e.fullName} (${e.empNo}) — ${Utils.getDeptName(e.departmentId)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label required">Entitlement Year</label>
        <input class="form-control" id="sq-year" type="number" value="2026" min="2020" max="2030">
      </div>

      <div style="font-size:13px;font-weight:700;margin:14px 0 8px 0;color:var(--text)">Leave Days Quota Allocation</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
        ${types.map(t => {
          const defaultVal = currentBal?.quotas?.[t.id] ?? t.maxDays;
          return `
            <div class="form-group">
              <label class="form-label" style="display:flex;align-items:center;gap:6px">
                <span class="badge" style="background:${t.color||'#6366f1'}22;color:${t.color||'#6366f1'};font-size:10px">${t.code}</span>
                ${t.name}
              </label>
              <input type="number" class="form-control quota-type-input" data-type-id="${t.id}" value="${defaultVal}" min="0" max="100">
            </div>
          `;
        }).join('')}
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Leaves.saveQuota()"><i class="fa fa-save"></i> Save Quota</button>
      `
    });
  },

  onQuotaEmpSelect(empId) {
    const balances = DB.get('leave_balances') || [];
    const types = DB.get('leave_types') || [];
    const bal = balances.find(b => b.employeeId === parseInt(empId));
    types.forEach(t => {
      const input = document.querySelector(`.quota-type-input[data-type-id="${t.id}"]`);
      if (input) {
        input.value = bal?.quotas?.[t.id] ?? t.maxDays;
      }
    });
  },

  saveQuota() {
    if (!Auth.can('leaves.edit')) { Toast.show('Permission denied: Cannot save quota.', 'error'); return; }
    const empId = parseInt(document.getElementById('sq-emp').value);
    const year = parseInt(document.getElementById('sq-year').value) || 2026;
    if (!empId) return;

    const balances = DB.get('leave_balances') || [];
    let bal = balances.find(b => b.employeeId === empId);

    const quotas = {};
    const updatedBalances = {};
    const approvedLeaves = (DB.get('leave_requests') || []).filter(l => l.employeeId === empId && l.status === 'approved');

    document.querySelectorAll('.quota-type-input').forEach(inp => {
      const typeId = parseInt(inp.dataset.typeId);
      const allocated = parseInt(inp.value) || 0;
      quotas[typeId] = allocated;
      const used = approvedLeaves.filter(l => l.typeId === typeId).reduce((s, l) => s + l.days, 0);
      updatedBalances[typeId] = Math.max(0, allocated - used);
    });

    if (bal) {
      bal.quotas = quotas;
      bal.balances = updatedBalances;
      bal.year = year;
    } else {
      balances.push({
        id: DB.nextId('leave_balances'),
        employeeId: empId,
        year,
        quotas,
        balances: updatedBalances,
      });
    }

    DB.set('leave_balances', balances);
    DB.log('QUOTA_UPDATE', 'Leaves', `Leave quota updated for ${Utils.getEmpName(empId)}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Leave quota updated successfully!', 'success');
    this.renderView();
  },

  bulkAllocateQuotas() {
    if (!Auth.can('leaves.edit')) { Toast.show('Permission denied: Cannot bulk allocate quotas.', 'error'); return; }
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const types = DB.get('leave_types') || [];
    const balances = DB.get('leave_balances') || [];
    const approvedLeaves = DB.get('leave_requests') || [];

    let count = 0;
    emps.forEach(emp => {
      let bal = balances.find(b => b.employeeId === emp.id);
      const empApproved = approvedLeaves.filter(l => l.employeeId === emp.id && l.status === 'approved');
      const quotas = {};
      const updatedBals = {};

      types.forEach(t => {
        const alloc = bal?.quotas?.[t.id] ?? t.maxDays;
        quotas[t.id] = alloc;
        const used = empApproved.filter(l => l.typeId === t.id).reduce((s, l) => s + l.days, 0);
        updatedBals[t.id] = Math.max(0, alloc - used);
      });

      if (bal) {
        bal.quotas = quotas;
        bal.balances = updatedBals;
        bal.year = 2026;
      } else {
        balances.push({
          id: DB.nextId('leave_balances'),
          employeeId: emp.id,
          year: 2026,
          quotas,
          balances: updatedBals,
        });
      }
      count++;
    });

    DB.set('leave_balances', balances);
    Toast.show(`Standard 2026 quotas synchronized for ${count} employees!`, 'success');
    this.renderView();
  },

  toggleTypeBreakdown() {
    this.hideTypeBreakdown = !this.hideTypeBreakdown;
    const el = document.getElementById('leave-type-breakdown-container');
    const btn = document.getElementById('btn-toggle-breakdown');
    if (el) el.style.display = this.hideTypeBreakdown ? 'none' : 'block';
    if (btn) {
      btn.innerHTML = `<i class="fa ${this.hideTypeBreakdown ? 'fa-chevron-down' : 'fa-chevron-up'}" style="margin-right:4px"></i>${this.hideTypeBreakdown ? 'Expand' : 'Collapse'}`;
    }
  },

  renderTypes(container) {
    const types = DB.get('leave_types') || [];
    const isHrOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const allLeaves = DB.get('leave_requests') || [];

    const totalTypes = types.length;
    const cfTypes = types.filter(t => t.carryForward).length;
    const totalMaxDays = types.reduce((s, t) => s + (t.maxDays || 0), 0);

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Feature Header & Sub-Nav Switcher -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border);flex-wrap:wrap">
          <div>
            <h3 style="font-size:18px;font-weight:800;margin:0 0 4px 0;display:flex;align-items:center;gap:8px">
              <i class="fa fa-scale-balanced" style="color:var(--primary)"></i> Annual Leave Quotas, Balances &amp; Types
            </h3>
            <div style="font-size:12.5px;color:var(--text-3)">
              Configure company leave types, annual entitlement limits, carry-forward rules, and quota definitions.
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <!-- Sub-View Switcher Pills -->
            <div style="display:flex;background:var(--surface);padding:4px;border-radius:10px;border:1px solid var(--border);gap:4px">
              <button class="btn btn-sm ${this.quotaSubView !== 'types' ? 'btn-primary' : 'btn-ghost'}" onclick="Leaves.setQuotaSubView('matrix')" style="font-size:12px;font-weight:600;border-radius:7px">
                <i class="fa fa-table-cells" style="margin-right:6px"></i>${isEmployee ? 'My Quota & Balances' : 'Quota & Balance Matrix'}
              </button>
              <button class="btn btn-sm ${this.quotaSubView === 'types' ? 'btn-primary' : 'btn-ghost'}" onclick="Leaves.setQuotaSubView('types')" style="font-size:12px;font-weight:600;border-radius:7px">
                <i class="fa fa-tags" style="margin-right:6px"></i>Leave Types &amp; Policy (${types.length})
              </button>
            </div>
            ${isHrOrAdmin ? `
              <button class="btn btn-primary btn-sm" onclick="Leaves.showAddType()"><i class="fa fa-plus"></i> Add Leave Type</button>
            ` : ''}
            <button class="btn btn-outline btn-sm" onclick="Leaves.setQuotaSubView('matrix')"><i class="fa fa-table-cells"></i> View Quota Matrix</button>
          </div>
        </div>

        <!-- Summary KPI Cards -->
        <div class="grid-4 mb-20" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;border-left:4px solid var(--primary)">
            <div style="font-size:24px;font-weight:800;color:var(--primary)">${totalTypes}</div>
            <div style="font-size:11.5px;color:var(--text-3)">Configured Leave Types</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;border-left:4px solid #10b981">
            <div style="font-size:24px;font-weight:800;color:#10b981">${cfTypes}</div>
            <div style="font-size:11.5px;color:var(--text-3)">Carry-Forward Eligible</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;border-left:4px solid #f59e0b">
            <div style="font-size:24px;font-weight:800;color:#f59e0b">${totalMaxDays}d</div>
            <div style="font-size:11.5px;color:var(--text-3)">Cumulative Annual Allowance</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;border-left:4px solid #8b5cf6">
            <div style="font-size:24px;font-weight:800;color:#8b5cf6">${allLeaves.length}</div>
            <div style="font-size:11.5px;color:var(--text-3)">Total Requests Logged</div>
          </div>
        </div>

        <!-- Cards Grid -->
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
          ${types.map(t => {
            const reqCount = allLeaves.filter(l => l.typeId === t.id).length;
            const approvedDays = allLeaves.filter(l => l.typeId === t.id && l.status === 'approved').reduce((s, l) => s + (l.days || 0), 0);
            return `
              <div class="card" style="border-top:4px solid ${t.color || 'var(--primary)'};position:relative;display:flex;flex-direction:column;justify-content:space-between">
                <div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                    <span class="badge" style="background:${t.color || '#6366f1'}22;color:${t.color || '#6366f1'};font-size:12.5px;font-weight:700">${t.code}</span>
                    <div style="display:flex;gap:4px;align-items:center">
                      ${t.carryForward ? '<span class="chip" style="font-size:10px;background:rgba(16,185,129,0.12);color:#059669"><i class="fa fa-rotate-right" style="margin-right:3px"></i>Carry Forward</span>' : '<span class="chip" style="font-size:10px;color:var(--text-muted)">Lapse on Dec 31</span>'}
                    </div>
                  </div>
                  <div style="font-size:17px;font-weight:700;margin-bottom:6px;color:var(--text)">${t.name}</div>
                  <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:12px">
                    <span style="font-size:32px;font-weight:800;color:${t.color || 'var(--primary)'};line-height:1">${t.maxDays}</span>
                    <span style="font-size:12px;color:var(--text-3)">days standard allocation / year</span>
                  </div>
                  
                  <div style="background:var(--surface);border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:11.5px;color:var(--text-2)">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                      <span>Total Requests Logged:</span>
                      <strong>${reqCount}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between">
                      <span>Total Approved Days:</span>
                      <strong>${Math.round(approvedDays * 10) / 10} days</strong>
                    </div>
                  </div>
                </div>

                <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border);margin-top:auto">
                  <span style="font-size:11px;color:var(--text-muted)">ID: #${t.id}</span>
                  <div style="display:flex;gap:6px">
                    ${Auth.can('leaves.edit') ? `
                      <button class="btn btn-ghost btn-xs" onclick="Leaves.showEditType(${t.id})" title="Edit leave type policy" style="padding:4px 8px">
                        <i class="fa fa-pen"></i> Edit
                      </button>
                    ` : ''}
                    ${Auth.can('leaves.delete') && t.id > 7 ? `
                      <button class="btn btn-ghost btn-xs" onclick="Leaves.deleteType(${t.id})" title="Delete custom type" style="padding:4px 8px;color:var(--danger)">
                        <i class="fa fa-trash"></i>
                      </button>
                    ` : ''}
                    <button class="btn btn-outline btn-xs" onclick="Leaves.setQuotaSubView('matrix')" title="View in employee quota matrix" style="padding:4px 8px">
                      <i class="fa fa-table-cells"></i> Quotas
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  showAddType() {
    if (!Auth.can('leaves.edit')) {
      Toast.show('Permission denied: You cannot add leave types.', 'error');
      return;
    }
    Modal.show('Add Leave Type', `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Leave Type Name</label><input class="form-control" id="lt-name" placeholder="e.g. Casual Leave"></div>
        <div class="form-group"><label class="form-label required">Code</label><input class="form-control" id="lt-code" placeholder="e.g. CL" maxlength="5"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Max Days/Year</label><input class="form-control" id="lt-days" type="number" value="15" min="1" max="365"></div>
        <div class="form-group"><label class="form-label">Color</label><input class="form-control" id="lt-color" type="color" value="#6366f1"></div>
      </div>
      <div class="form-group"><label class="form-label">Carry Forward?</label>
        <select class="form-control" id="lt-carry"><option value="false">No</option><option value="true">Yes</option></select>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Leaves.saveType()"><i class="fa fa-save"></i> Save</button>`
    });
  },
  saveType() {
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
    const name = document.getElementById('lt-name').value.trim();
    const code = document.getElementById('lt-code').value.trim();
    if (!name || !code) { Toast.show('Name and code required', 'error'); return; }
    DB.add('leave_types', {
      id: DB.nextId('leave_types'), name, code: code.toUpperCase(),
      maxDays: parseInt(document.getElementById('lt-days').value) || 15,
      color: document.getElementById('lt-color').value,
      carryForward: document.getElementById('lt-carry').value === 'true',
      status: 'active'
    });
    Modal.close('dynamic-modal');
    Toast.show('Leave type added!', 'success');
    this.renderView();
  },

  showEditType(id) {
    if (!Auth.can('leaves.edit')) {
      Toast.show('Permission denied: You do not have permission to edit leave types.', 'error');
      return;
    }
    const type = DB.find('leave_types', id);
    if (!type) {
      Toast.show('Leave type not found.', 'error');
      return;
    }
    Modal.show(`Edit Leave Type: ${type.name}`, `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Leave Type Name</label><input class="form-control" id="lt-edit-name" value="${type.name}"></div>
        <div class="form-group"><label class="form-label required">Code</label><input class="form-control" id="lt-edit-code" value="${type.code}" maxlength="5"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Max Days/Year</label><input class="form-control" id="lt-edit-days" type="number" value="${type.maxDays || 15}" min="1" max="365"></div>
        <div class="form-group"><label class="form-label">Color</label><input class="form-control" id="lt-edit-color" type="color" value="${type.color || '#6366f1'}"></div>
      </div>
      <div class="form-group"><label class="form-label">Carry Forward?</label>
        <select class="form-control" id="lt-edit-carry">
          <option value="false" ${!type.carryForward ? 'selected' : ''}>No</option>
          <option value="true" ${type.carryForward ? 'selected' : ''}>Yes</option>
        </select>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Leaves.updateType(${id})"><i class="fa fa-save"></i> Save Changes</button>`
    });
  },

  updateType(id) {
    if (!Auth.can('leaves.edit')) { Toast.show('Permission denied.', 'error'); return; }
    const name = document.getElementById('lt-edit-name').value.trim();
    const code = document.getElementById('lt-edit-code').value.trim();
    if (!name || !code) { Toast.show('Name and code required', 'error'); return; }
    DB.update('leave_types', id, {
      name,
      code: code.toUpperCase(),
      maxDays: parseInt(document.getElementById('lt-edit-days').value) || 15,
      color: document.getElementById('lt-edit-color').value,
      carryForward: document.getElementById('lt-edit-carry').value === 'true'
    });
    Modal.close('dynamic-modal');
    Toast.show(`Leave type "${name}" updated successfully!`, 'success');
    this.renderView();
  },

  deleteType(id) {
    if (!Auth.can('leaves.delete')) {
      Toast.show('Permission denied: You do not have permission to delete leave types.', 'error');
      return;
    }
    const type = DB.find('leave_types', id);
    if (!type) return;
    const usedCount = (DB.get('leave_requests') || []).filter(l => l.typeId === id).length;
    if (usedCount > 0) {
      Toast.show(`Cannot delete "${type.name}": It has ${usedCount} associated leave requests.`, 'warning');
      return;
    }
    if (!confirm(`Are you sure you want to delete leave type "${type.name}"?`)) return;
    DB.delete('leave_types', id);
    Toast.show(`Leave type "${type.name}" removed.`, 'success');
    this.renderView();
  },



  renderHolidays(container) {
    const holidays = DB.get('holidays').sort((a,b) => a.date.localeCompare(b.date));
    const today = Utils.today();
    container.innerHTML = `
      <!-- Stage 2 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm ${this.currentView==='calendar'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('calendar')">
            <i class="fa fa-calendar-days"></i> Leave Calendar &amp; Matrix
          </button>
          <button class="btn btn-sm ${this.currentView==='holidays'?'btn-primary':'btn-ghost'}" onclick="Leaves.switchView('holidays')">
            <i class="fa fa-umbrella-beach"></i> Corporate Holidays (${holidays.length})
          </button>
        </div>
        ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `<button class="btn btn-primary btn-sm" onclick="Leaves.showAddHoliday()"><i class="fa fa-plus"></i> Add Holiday</button>` : ''}
      </div>
      <div class="grid-2">
        ${holidays.map(h => `
          <div class="card" style="display:flex;gap:16px;align-items:center;${h.date < today ? 'opacity:0.6' : ''}">
            <div style="width:56px;height:56px;background:${h.type==='national'?'var(--primary-glow)':'var(--success-light)'};border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
              <div style="font-size:20px;font-weight:800;color:${h.type==='national'?'var(--primary)':'var(--success)'};line-height:1">${new Date(h.date).getDate()}</div>
              <div style="font-size:9px;color:${h.type==='national'?'var(--primary)':'var(--success)'};font-weight:700">${new Date(h.date).toLocaleString('en',{month:'short'}).toUpperCase()}</div>
            </div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:600">${h.name}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:3px">${Utils.formatDate(h.date)} • ${h.type.charAt(0).toUpperCase()+h.type.slice(1)}</div>
              ${h.optional ? '<span class="badge badge-secondary" style="margin-top:4px;display:inline-flex">Optional</span>' : ''}
            </div>
            <div style="font-size:12px;font-weight:600;color:${h.date >= today ? 'var(--success)' : 'var(--text-muted)'}">${h.date >= today ? 'Upcoming' : 'Passed'}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  onCalendarDateClick(dateStr, mode) {
    if (!Auth.can('leaves.create')) {
      Toast.show('Permission denied: You do not have permission to apply for leave.', 'warning');
      return;
    }
    this.showApplyForm(dateStr, mode || this.calMode);
  },

  switchApplyFormMode(newMode) {
    const from = document.getElementById('lf-from')?.value || Utils.today();
    this.showApplyForm(from, newMode);
  },

  todayMonth() {
    const now = new Date();
    this.calYear = now.getFullYear();
    this.calMonth = now.getMonth();
    this.renderView();
  },

  showApplyForm(prefillDate, targetMode) {
    if (!Auth.can('leaves.create') || !Auth.canSeeFeature('leaves.apply_form')) {
      Toast.show('Permission denied: You do not have permission to submit or mark leave applications.', 'warning');
      return;
    }
    const types = DB.get('leave_types') || [];
    const allEmps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const role = Auth.role;
    const isManagement = role === 'superadmin' || role === 'hr_manager' || role === 'dept_manager';
    const isDeptMgr = role === 'dept_manager';
    const myEmp = Auth.employee || allEmps.find(e => e.id === Auth.user?.employeeId) || allEmps[0];

    // Deputy Managers may only apply leave for themselves, not mark it for employees
    if (isDeptMgr && (targetMode === 'employee' || (!targetMode && this.calMode === 'employee'))) {
      Toast.show('Deputy Managers cannot apply or mark leave on behalf of employees. Only HR and Admins can do this.', 'warning');
      return;
    }

    // Determine targetMode: 'my' (personal application) or 'employee' (marking for staff)
    let mode = targetMode;
    if (!mode) {
      mode = (!isManagement || this.calMode === 'my') ? 'my' : 'employee';
    }
    if (!isManagement) mode = 'my';

    const isSelf = mode === 'my';
    const staffPool = isDeptMgr ? allEmps.filter(e => e.departmentId === myEmp?.departmentId) : allEmps;
    const initialEmpId = isSelf ? myEmp.id : (staffPool[0]?.id || allEmps[0]?.id || 1);

    const defaultDate = prefillDate || Utils.today();
    const holidays = DB.get('holidays') || [];
    const existingHol = holidays.find(h => h.date === defaultDate);

    Modal.show(isSelf ? 'Apply for My Leave' : 'Mark Leave for Employee', `
      <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:14px">
        <!-- Management Switcher: Apply for Myself vs Mark for Employee (hidden for dept_manager) -->
        ${isManagement && !isDeptMgr ? `
          <div style="display:flex;justify-content:center;margin-bottom:2px">
            <div class="cal-mode-switcher">
              <button class="cal-mode-btn ${isSelf ? 'active' : ''}" type="button" onclick="Leaves.switchApplyFormMode('my')">
                <i class="fa fa-user"></i> Apply for Myself
              </button>
              <button class="cal-mode-btn ${!isSelf ? 'active' : ''}" type="button" onclick="Leaves.switchApplyFormMode('employee')">
                <i class="fa fa-users"></i> Mark for Employee
              </button>
            </div>
          </div>
        ` : ''}

        <input type="hidden" id="lf-mode" value="${isSelf ? 'my' : 'employee'}">

        ${prefillDate ? `
          <div style="background:linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(16,185,129,0.1) 100%);border:1px solid rgba(99,102,241,0.25);border-radius:9px;padding:9px 14px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:13px;color:var(--text)">
              <i class="fa fa-calendar-day" style="color:var(--primary);margin-right:7px"></i>Selected Calendar Date: <strong>${Utils.formatDate(prefillDate)}</strong>
            </span>
            <span class="badge ${isSelf ? 'badge-primary' : 'badge-warning'}" style="font-size:11px">
              <i class="fa ${isSelf ? 'fa-user' : 'fa-users'}" style="margin-right:4px"></i>${isSelf ? 'Personal Leave' : 'Employee Leave'}
            </span>
          </div>
        ` : ''}

        ${existingHol ? `
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--danger)">
            <i class="fa fa-umbrella-beach"></i>
            <span><strong>Notice:</strong> ${Utils.formatDate(defaultDate)} is already an official company holiday (<strong>${existingHol.name}</strong>).</span>
          </div>
        ` : ''}

        <!-- Employee Info or Selector -->
        ${isSelf ? `
          <input type="hidden" id="lf-emp" value="${myEmp.id}">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:10px 14px;display:flex;align-items:center;gap:12px">
            <div class="avatar avatar-sm" style="background:${Utils.avatarColor(myEmp.id)}">${Utils.avatarInitials(myEmp?.fullName||'Self')}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13.5px;color:var(--text)">${myEmp?.fullName} <span style="font-size:11px;font-weight:500;color:var(--text-3)">(${myEmp?.empNo})</span></div>
              <div style="font-size:11.5px;color:var(--text-3)">${Utils.getDeptName(myEmp?.departmentId)} • Personal Leave Application</div>
            </div>
            <span class="badge badge-primary" style="font-size:11px"><i class="fa fa-user-check" style="margin-right:4px"></i>Self Application</span>
          </div>
        ` : `
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-user" style="color:var(--primary);margin-right:5px"></i> Select Employee to Mark Leave For</label>
            <select class="form-control" id="lf-emp" onchange="Leaves.onLeaveFormEmpChange(this.value)">
              ${staffPool.map(e => `<option value="${e.id}" ${e.id === initialEmpId ? 'selected' : ''}>${e.fullName} (${e.empNo}) — ${Utils.getDeptName(e.departmentId)}</option>`).join('')}
            </select>
          </div>
        `}

        <!-- Leave Unit / Duration Selection -->
        <div class="form-row form-row-2" style="margin-bottom:0">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-business-time" style="color:var(--primary);margin-right:4px"></i> Leave Duration</label>
            <select class="form-control" id="lf-duration" onchange="Leaves.onLeaveDurationChange(this.value)">
              <option value="full">Full Day (1.0 Day / 8h)</option>
              <option value="half_first">Half Day — Morning / 1st Half (0.5 Day / 4h)</option>
              <option value="half_second">Half Day — Afternoon / 2nd Half (0.5 Day / 4h)</option>
              <option value="short">Short Leave (0.25 Day / 2h)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;display:flex;flex-direction:column;justify-content:flex-end">
            <span id="lf-days-badge" class="badge badge-primary" style="font-size:12px;padding:8px 12px;display:inline-flex;align-items:center;gap:5px;height:38px">
              <i class="fa fa-clock"></i> 1 Day Requested
            </span>
          </div>
        </div>

        <!-- Dates -->
        <div class="form-row form-row-2" style="margin-bottom:0">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-calendar-arrow-down" style="color:var(--primary);margin-right:4px"></i> From Date</label>
            <input type="date" class="form-control" id="lf-from" value="${defaultDate}" onchange="Leaves.onLeaveDateChange()">
          </div>
          <div class="form-group" style="margin-bottom:0" id="lf-to-group">
            <label class="form-label required"><i class="fa fa-calendar-arrow-up" style="color:var(--primary);margin-right:4px"></i> To Date</label>
            <input type="date" class="form-control" id="lf-to" value="${defaultDate}" onchange="Leaves.onLeaveDateChange()">
          </div>
        </div>

        <!-- Leave Type & Quota to Utilize -->
        <div class="form-row form-row-2" style="margin-bottom:0">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-tag" style="color:var(--primary);margin-right:4px"></i> Select Leave Type</label>
            <select class="form-control" id="lf-type" onchange="Leaves.onLeaveTypeChange(this.value)">
              ${types.map(t => `<option value="${t.id}">${t.name} (${t.code})</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-scale-balanced" style="color:var(--primary);margin-right:4px"></i> Which Quota to Utilize</label>
            <select class="form-control" id="lf-quota" onchange="Leaves.onQuotaSelectChange(this.value)">
              <!-- Populated dynamically by updateLeaveFormQuota -->
            </select>
          </div>
        </div>

        <!-- Live Quota Balance & Utilization Card -->
        <div id="lf-quota-preview"></div>

        <!-- Voluntary / Administrative Salary Deduction Option -->
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <label style="display:flex;align-items:center;gap:10px;margin:0;cursor:pointer;font-size:13px;font-weight:700;color:var(--text)">
              <input type="checkbox" id="lf-salary-deduct" onchange="Leaves.onSalaryDeductToggle(this.checked)" style="width:17px;height:17px;cursor:pointer">
              <span><i class="fa fa-money-bill-wave" style="color:var(--warning);margin-right:6px"></i> Deduct from Salary (Unpaid Leave / Loss of Pay)</span>
            </label>
            <span class="badge badge-warning" id="lf-deduct-badge" style="display:none;font-size:11px"><i class="fa fa-receipt"></i> LOP Deduction</span>
          </div>
          <div id="lf-deduct-preview" style="display:none;margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);font-size:12px"></div>
        </div>

        <!-- Compensatory Off-Day Token Redemption Option (From Reference System) -->
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:12px 14px" id="lf-token-wrap">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <label style="display:flex;align-items:center;gap:10px;margin:0;cursor:pointer;font-size:13px;font-weight:700;color:var(--text)">
              <input type="checkbox" id="lf-redeem-token" onchange="Leaves.onRedeemTokenToggle(this.checked)" style="width:17px;height:17px;cursor:pointer">
              <span><i class="fa fa-ticket" style="color:#10b981;margin-right:6px"></i> Redeem Compensatory Token (Comp-Off Credit)</span>
            </label>
            <span class="badge badge-success" id="lf-token-badge" style="display:none;font-size:11px"><i class="fa fa-circle-check"></i> Token Applied</span>
          </div>
          <div id="lf-token-preview" style="display:none;margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);font-size:12px"></div>
        </div>

        <!-- Reason for Leave -->
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label required"><i class="fa fa-pen-to-square" style="color:var(--primary);margin-right:4px"></i> Reason for Leave</label>
          <textarea class="form-control" id="lf-reason" rows="2" placeholder="${isSelf ? 'State your reason for leave...' : 'State the reason for this employee leave...'}"></textarea>
        </div>

        <!-- Remarks / Handover Notes -->
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label"><i class="fa fa-comment-dots" style="color:var(--text-3);margin-right:4px"></i> Remarks / Handover Notes</label>
          <textarea class="form-control" id="lf-remarks" rows="2" placeholder="${isSelf ? 'Handover notes, urgent delegations, or emergency contact...' : 'Management notes, approval remarks, or coverage details...'}"></textarea>
        </div>

        <!-- Approval Workflow Indicator -->
        <div style="background:var(--surface);border-radius:9px;padding:12px 14px;border:1px solid var(--border)">
          <div style="font-size:10.5px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.8px">
            <i class="fa fa-arrows-split-up-and-left" style="margin-right:4px"></i> Approval Workflow
          </div>
          <div class="steps">
            <div class="step done"><div class="step-circle"><i class="fa fa-check"></i></div><div class="step-label">Application</div></div>
            <div class="step-line"></div>
            <div class="step"><div class="step-circle">2</div><div class="step-label">Dept Manager</div></div>
            <div class="step-line"></div>
            <div class="step"><div class="step-circle">3</div><div class="step-label">HR Manager</div></div>
            <div class="step-line"></div>
            <div class="step"><div class="step-circle">✓</div><div class="step-label">Approved</div></div>
          </div>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" id="lf-submit-btn" onclick="Leaves.saveLeave('${isSelf ? 'my' : 'employee'}')">
          <i class="fa fa-paper-plane" style="margin-right:6px"></i> ${isSelf ? 'Submit My Leave Application' : 'Submit Employee Leave'}
        </button>
      `
    });

    // Initialize Quota options and preview immediately
    setTimeout(() => {
      this.populateQuotaOptions();
      this.updateLeaveFormQuota();
    }, 20);
  },

  onLeaveDurationChange(dur) {
    const toInput = document.getElementById('lf-to');
    const toGroup = document.getElementById('lf-to-group');
    const fromVal = document.getElementById('lf-from')?.value;
    if (dur !== 'full') {
      if (toInput && fromVal) toInput.value = fromVal;
      if (toInput) toInput.disabled = true;
      if (toGroup) toGroup.style.opacity = '0.5';
    } else {
      if (toInput) toInput.disabled = false;
      if (toGroup) toGroup.style.opacity = '1';
    }
    this.onLeaveDateChange();
  },

  onLeaveDateChange() {
    const from = document.getElementById('lf-from')?.value;
    const to = document.getElementById('lf-to')?.value;
    const dur = document.getElementById('lf-duration')?.value || 'full';
    let days = 1;
    let label = '1 Day Requested';

    if (dur === 'half_first') {
      days = 0.5;
      label = '0.5 Day Requested (Half Day - Morning)';
    } else if (dur === 'half_second') {
      days = 0.5;
      label = '0.5 Day Requested (Half Day - Afternoon)';
    } else if (dur === 'short') {
      days = 0.25;
      label = '0.25 Day Requested (Short Leave - 2h)';
    } else if (from && to) {
      days = from <= to ? Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1) : 0;
      label = `${days} Day${days !== 1 ? 's' : ''} Requested`;
    }

    const badge = document.getElementById('lf-days-badge');
    if (badge) {
      if (dur === 'full' && from > to) {
        badge.innerHTML = '<i class="fa fa-exclamation-triangle"></i> Invalid Date Range';
        badge.className = 'badge badge-danger';
      } else {
        badge.innerHTML = `<i class="fa fa-clock"></i> ${label}`;
        badge.className = 'badge badge-primary';
      }
    }

    const isDeduct = document.getElementById('lf-salary-deduct')?.checked;
    if (isDeduct) {
      this.onSalaryDeductToggle(true);
    }
    this.updateLeaveFormQuota();
  },

  onSalaryDeductToggle(isChecked) {
    const badge = document.getElementById('lf-deduct-badge');
    const preview = document.getElementById('lf-deduct-preview');
    if (badge) badge.style.display = isChecked ? 'inline-flex' : 'none';
    if (preview) preview.style.display = isChecked ? 'block' : 'none';

    if (isChecked) {
      const empId = parseInt(document.getElementById('lf-emp')?.value || Auth.employee?.id || 1);
      const emp = DB.find('employees', empId);
      const from = document.getElementById('lf-from')?.value;
      const to = document.getElementById('lf-to')?.value;
      const dur = document.getElementById('lf-duration')?.value || 'full';
      let days = 1;
      if (dur === 'half_first' || dur === 'half_second') days = 0.5;
      else if (dur === 'short') days = 0.25;
      else if (from && to && from <= to) days = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1);

      const salary = emp?.salary || 50000;
      const dailyWage = Math.round(salary / 30);
      const totalDed = Math.round(dailyWage * days);

      const isHROrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
      const isSelf = empId === Auth.employee?.id;

      if (preview) {
        if (isHROrAdmin || isSelf) {
          preview.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);padding:10px 12px;border-radius:8px;border:1px solid rgba(245,158,11,0.3)">
              <div>
                <div style="font-size:11px;color:var(--text-3)">Calculated Daily Wage (PKR ${salary.toLocaleString()} / 30 days)</div>
                <div style="font-weight:700;color:var(--text);font-size:13px">PKR ${dailyWage.toLocaleString()} × ${days} day${days!==1?'s':''}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:11px;color:var(--text-3)">Estimated Payroll Deduction</div>
                <div style="font-weight:800;color:var(--danger);font-size:16px">PKR ${totalDed.toLocaleString()}</div>
              </div>
            </div>
            <div style="font-size:11.5px;color:var(--text-2);margin-top:6px;display:flex;align-items:center;gap:6px">
              <i class="fa fa-info-circle" style="color:var(--warning)"></i>
              <span>This leave will be deducted from your next salary slip and will <strong>NOT</strong> consume paid quota.</span>
            </div>
          `;
        } else {
          preview.innerHTML = `
            <div style="background:var(--surface);padding:10px 12px;border-radius:8px;border:1px solid rgba(245,158,11,0.3)">
              <div style="font-weight:700;color:var(--warning);font-size:13px;display:flex;align-items:center;gap:6px">
                <i class="fa fa-clock"></i> Loss of Pay / Unpaid Leave: ${days} day${days!==1?'s':''}
              </div>
              <div style="font-size:11.5px;color:var(--text-2);margin-top:4px">
                This leave will not consume paid quota. Payroll adjustments will be calculated and finalized strictly by HR.
              </div>
            </div>
          `;
        }
      }
    }
    this.updateLeaveFormQuota();
  },

  onRedeemTokenToggle(isChecked) {
    const badge = document.getElementById('lf-token-badge');
    const preview = document.getElementById('lf-token-preview');
    if (badge) badge.style.display = isChecked ? 'inline-flex' : 'none';
    if (preview) preview.style.display = isChecked ? 'block' : 'none';

    if (isChecked) {
      const deductEl = document.getElementById('lf-salary-deduct');
      if (deductEl && deductEl.checked) {
        deductEl.checked = false;
        this.onSalaryDeductToggle(false);
      }
      const empId = parseInt(document.getElementById('lf-emp')?.value || Auth.employee?.id || 1);
      const tokens = (DB.get('overtime_tokens') || []).filter(t => t.employeeId === empId && t.status === 'active');
      if (preview) {
        preview.innerHTML = `
          <div style="background:var(--surface);padding:10px 12px;border-radius:8px;border:1px solid rgba(16,185,129,0.3);color:var(--text)">
            <div style="font-weight:700;color:#10b981;margin-bottom:3px"><i class="fa fa-coins"></i> Active Overtime/Comp-Off Tokens: ${tokens.length} Available</div>
            <div style="font-size:12px;color:var(--text-3)">1 token will be redeemed for this leave. No quota will be consumed and no salary deduction will be applied.</div>
          </div>
        `;
      }
    }
    this.updateLeaveFormQuota();
  },

  onLeaveFormEmpChange(empId) {
    this.populateQuotaOptions();
    this.updateLeaveFormQuota();
  },

  onLeaveTypeChange(typeId) {
    // Synchronize Quota dropdown to matching leave type if available
    const quotaSelect = document.getElementById('lf-quota');
    if (quotaSelect) {
      quotaSelect.value = typeId;
    }
    this.updateLeaveFormQuota();
  },

  onQuotaSelectChange(quotaTypeId) {
    this.updateLeaveFormQuota();
  },

  populateQuotaOptions() {
    const empId = parseInt(document.getElementById('lf-emp')?.value || Auth.employee?.id || 1);
    const types = DB.get('leave_types') || [];
    const balances = DB.get('leave_balances') || [];
    const bal = balances.find(b => b.employeeId === empId);
    const allLeaves = DB.get('leave_requests') || [];
    const empLeaves = allLeaves.filter(l => l.employeeId === empId && l.status === 'approved');

    const quotaSelect = document.getElementById('lf-quota');
    if (!quotaSelect) return;

    const currentType = parseInt(document.getElementById('lf-type')?.value || types[0]?.id || 1);

    quotaSelect.innerHTML = types.map(t => {
      const allocated = bal?.quotas?.[t.id] ?? t.maxDays;
      const used = empLeaves.filter(l => (l.quotaTypeId === t.id || l.typeId === t.id)).reduce((s, l) => s + l.days, 0);
      const rem = bal?.balances?.[t.id] ?? Math.max(0, allocated - used);
      return `<option value="${t.id}" ${t.id === currentType ? 'selected' : ''}>${t.name} Quota (${rem} days remaining / ${allocated} allocated)</option>`;
    }).join('');
  },

  updateLeaveFormQuota() {
    const previewContainer = document.getElementById('lf-quota-preview');
    if (!previewContainer) return;

    const empId = parseInt(document.getElementById('lf-emp')?.value || Auth.employee?.id || 1);
    const quotaTypeId = parseInt(document.getElementById('lf-quota')?.value || 1);
    const from = document.getElementById('lf-from')?.value;
    const to = document.getElementById('lf-to')?.value;
    const dur = document.getElementById('lf-duration')?.value || 'full';
    let days = 1;
    if (dur === 'half_first' || dur === 'half_second') days = 0.5;
    else if (dur === 'short') days = 0.25;
    else if (from && to && from <= to) days = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1);

    const types = DB.get('leave_types') || [];
    const balances = DB.get('leave_balances') || [];
    const bal = balances.find(b => b.employeeId === empId);
    const allLeaves = DB.get('leave_requests') || [];
    const empLeaves = allLeaves.filter(l => l.employeeId === empId && l.status === 'approved');

    const quotaType = types.find(t => t.id === quotaTypeId) || types[0];
    const allocated = bal?.quotas?.[quotaTypeId] ?? (quotaType?.maxDays || 14);
    const used = empLeaves.filter(l => (l.quotaTypeId === quotaTypeId || l.typeId === quotaTypeId) && !l.salaryDeduction).reduce((s, l) => s + (l.days || 0), 0);
    const currentRemaining = bal?.balances?.[quotaTypeId] ?? Math.max(0, Math.round((allocated - used) * 100) / 100);

    const balanceAfterApproval = Math.max(0, Math.round((currentRemaining - days) * 100) / 100);
    const isOverQuota = days > currentRemaining;
    const isRunningLow = currentRemaining <= 3;
    const pct = allocated > 0 ? Math.min(100, Math.round(((used + (isOverQuota ? currentRemaining : days)) / allocated) * 100)) : 0;
    const color = quotaType?.color || 'var(--primary)';

    const durDesc = dur === 'short' ? 'Short Leave (2h)' : (dur === 'half_first' ? 'Half Day Morning (4h)' : (dur === 'half_second' ? 'Half Day Afternoon (4h)' : 'Full Day'));

    previewContainer.innerHTML = `
      <div style="background:var(--surface-2);border:1px solid ${isOverQuota ? 'var(--danger)' : 'var(--border)'};border-radius:10px;padding:12px 16px;transition:all .2s">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px">
            <span class="badge" style="background:${color}22;color:${color};font-weight:700;font-size:11px">${quotaType?.code || 'QUOTA'}</span>
            <span style="font-weight:700;font-size:12.5px;color:var(--text)">${quotaType?.name} Quota Utilization</span>
          </div>
          <span class="badge ${isOverQuota ? 'badge-danger' : isRunningLow ? 'badge-warning' : 'badge-success'}" style="font-size:11px">
            ${isOverQuota ? '⚠️ Insufficient Quota' : isRunningLow ? '⚡ Running Low' : '✓ Quota Available'}
          </span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;margin-bottom:10px">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:6px 4px">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase">Entitled</div>
            <div style="font-size:15px;font-weight:800;color:var(--text)">${allocated}d</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:6px 4px">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase">Used</div>
            <div style="font-size:15px;font-weight:800;color:var(--warning)">${Math.round(used * 100) / 100}d</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:6px 4px">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase">Available</div>
            <div style="font-size:15px;font-weight:800;color:${isOverQuota ? 'var(--danger)' : 'var(--success)'}">${currentRemaining}d</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:6px 4px">
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase">After Approval</div>
            <div style="font-size:15px;font-weight:800;color:${isOverQuota ? 'var(--danger)' : 'var(--primary)'}">${balanceAfterApproval}d</div>
          </div>
        </div>

        <div class="quota-progress-bar" style="height:6px;margin-bottom:6px">
          <div class="quota-progress-fill" style="width:${pct}%;background:${isOverQuota ? 'var(--danger)' : color}"></div>
        </div>

        ${isOverQuota ? `
          <div style="color:${isSalaryDeduct ? 'var(--warning)' : 'var(--danger)'};font-size:11.5px;font-weight:600;display:flex;align-items:center;gap:6px;margin-top:6px">
            <i class="fa fa-${isSalaryDeduct ? 'money-bill-wave' : 'triangle-exclamation'}"></i>
            ${isSalaryDeduct ? `Quota exceeded (${days}d requested vs ${currentRemaining}d available), but <strong>Salary Deduction is Active</strong>. Leave will be approved via Loss of Pay.` : `Requested duration (${days} days, ${durDesc}) exceeds available ${quotaType?.name} quota (${currentRemaining} days remaining)!`}
          </div>
        ` : `
          <div style="color:var(--text-3);font-size:11px;display:flex;align-items:center;justify-content:space-between">
            <span>Deducting <strong>${days} day(s)</strong> (${durDesc}) from ${quotaType?.name} Quota</span>
            <span style="color:var(--success);font-weight:600">Remaining after deduction: ${balanceAfterApproval} days</span>
          </div>
        `}
      </div>
    `;
  },

  saveLeave(targetMode) {
    const mode = targetMode || document.getElementById('lf-mode')?.value || 'my';
    const isSelf = mode === 'my';
    const allEmps = DB.get('employees') || [];
    const myEmp = Auth.employee || allEmps.find(e => e.id === Auth.user?.employeeId) || allEmps[0];

    const empId = isSelf ? myEmp.id : parseInt(document.getElementById('lf-emp')?.value || myEmp.id);
    const typeId = parseInt(document.getElementById('lf-type').value);
    const quotaTypeId = parseInt(document.getElementById('lf-quota')?.value || typeId);
    const from = document.getElementById('lf-from').value;
    const to   = document.getElementById('lf-to').value;
    const dur  = document.getElementById('lf-duration')?.value || 'full';
    const reason = document.getElementById('lf-reason').value.trim();
    const remarks = document.getElementById('lf-remarks')?.value.trim() || '';
    const isSalaryDeduct = document.getElementById('lf-salary-deduct')?.checked || false;

    if (!from || !to || !reason) { Toast.show('Please fill all required fields (Dates and Reason)', 'error'); return; }
    if (new Date(to) < new Date(from)) {
      Toast.show('Validation Error: "To Date" cannot be earlier than "From Date".', 'error');
      return;
    }

    let days = 1;
    if (dur === 'half_first' || dur === 'half_second') {
      days = 0.5;
    } else if (dur === 'short') {
      days = 0.25;
    } else {
      days = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1);
    }

    if (days <= 0 || isNaN(days)) {
      Toast.show('Validation Error: Calculated leave duration must be greater than zero.', 'error');
      return;
    }

    const targetEmp = DB.find('employees', empId);
    const dailyWage = Math.round((targetEmp?.salary || 50000) / 30);
    const deductionAmount = isSalaryDeduct ? Math.round(dailyWage * days) : 0;

    // Balance check against chosen quota (bypassed if salary deduction requested)
    const balances = DB.get('leave_balances') || [];
    const bal = balances.find(b => b.employeeId === empId);
    const quotaType = DB.find('leave_types', quotaTypeId);
    const leaveType = DB.find('leave_types', typeId);
    const remaining = bal?.balances?.[quotaTypeId] ?? (quotaType?.maxDays || 0);

    if (!isSalaryDeduct && days > remaining) {
      Toast.show(`Insufficient ${quotaType?.name || 'leave'} quota! Available: ${remaining} day(s), Requested: ${days} day(s). Check "Deduct from Salary" if taking Loss of Pay.`, 'error');
      return;
    }

    // Overlap check
    const existing = (DB.get('leave_requests') || []).filter(l =>
      l.employeeId === empId && l.status !== 'rejected' && l.status !== 'cancelled' &&
      l.from <= to && l.to >= from && (l.leaveDuration === 'full' || l.leaveDuration === dur)
    );
    if (existing.length > 0) {
      Toast.show('An active leave request already exists overlapping these dates and duration!', 'error');
      return;
    }

    const isRedeemToken = document.getElementById('lf-redeem-token')?.checked || false;

    const newLeave = {
      id: DB.nextId('leave_requests'),
      employeeId: empId,
      typeId,
      quotaTypeId,
      quotaName: isRedeemToken ? 'Comp-Off Token' : (quotaType?.name || leaveType?.name || 'Standard Quota'),
      from,
      to: (dur !== 'full') ? from : to,
      leaveDuration: dur,
      days,
      reason,
      remarks,
      salaryDeduction: isSalaryDeduct,
      deductionDays: isSalaryDeduct ? days : 0,
      deductionAmount: isSalaryDeduct ? deductionAmount : 0,
      tokensAttached: isRedeemToken ? 'Comp-Off Token' : null,
      tokenRedeemed: isRedeemToken,
      status: 'pending',
      managerId: targetEmp?.managerId || 3,
      hrId: 2,
      appliedOn: Utils.today(),
      appliedVia: isSelf ? 'my_leave_calendar' : 'employee_leave_calendar',
      approvedOn: null,
      comments: isSelf ? (isRedeemToken ? 'Redeemed Overtime Comp-Off Token' : (isSalaryDeduct ? 'Employee requested Salary Deduction' : '')) : `Marked by ${myEmp?.fullName||'Manager'} (${Auth.role})`
    };

    if (isRedeemToken) {
      const allTokens = DB.get('overtime_tokens') || [];
      const userToken = allTokens.find(t => t.employeeId === empId && t.status === 'active');
      if (userToken) {
        userToken.status = 'consumed';
        userToken.consumedDate = Utils.today();
        userToken.leaveRequestId = newLeave.id;
        DB.set('overtime_tokens', allTokens);
      }
    }

    DB.add('leave_requests', newLeave);
    DB.flushServerPush();

    // Broadcast live notification across devices
    if (typeof LiveNotifications !== 'undefined' && LiveNotifications.add) {
      LiveNotifications.add({
        title: isSelf ? `📋 Leave Application: ${myEmp?.fullName}` : `📋 Leave Marked: ${targetEmp?.fullName}`,
        message: `${isSelf ? myEmp?.fullName : targetEmp?.fullName} requested ${days}d leave (${from} to ${newLeave.to}) [${newLeave.quotaName}].`,
        type: 'leaves',
        link: 'leaves'
      });
    }

    DB.log('APPLY', 'Leaves', isSelf 
      ? `${myEmp?.fullName} applied for personal leave for ${days}d (${from} to ${newLeave.to}) utilizing ${newLeave.quotaName}`
      : `Leave marked for ${targetEmp?.fullName} by ${myEmp?.fullName} (${days}d from ${from} to ${newLeave.to}) utilizing ${newLeave.quotaName}`, 
      Auth.user?.id);

    Modal.close('dynamic-modal');

    if (isSelf) {
      Toast.show('My leave application submitted!', 'success', `${days} day(s) requested for ${Utils.formatDate(from)}. Awaiting approval.`);
    } else {
      Toast.show(`Leave marked for ${targetEmp?.fullName}!`, 'success', `Request for ${days} day(s) registered under ${newLeave.quotaName}.`);
    }

    // ── Email Notification: Leave Request submitted → manager ─
    if (typeof EmailNotifier !== 'undefined') {
      const manager = targetEmp?.managerId ? DB.find('employees', targetEmp.managerId) : null;
      const managerEmail = manager?.email || manager?.workEmail;
      if (managerEmail) {
        EmailNotifier.sendLeaveRequestEmail({
          managerEmail,
          employee: { name: targetEmp?.fullName || 'Employee', empId: targetEmp?.empNo, designation: targetEmp?.designation, department: DB.find('departments', targetEmp?.departmentId)?.name },
          manager: { name: manager?.fullName || 'Manager' },
          leaveType: leaveType?.name || 'Leave',
          fromDate: Utils.formatDate(from),
          toDate: Utils.formatDate(newLeave.to),
          days,
          reason,
          requestId: 'LR-' + newLeave.id
        });
      }
    }

    this.render();
  },


  approve(leaveId) {
    if (!Auth.can('leaves.approve') || !Auth.canSeeFeature('leaves.approvals')) {
      Toast.show('Permission denied: You do not have permission to approve leaves.', 'error');
      return;
    }
    const leave = DB.find('leave_requests', leaveId);
    if (!leave) return;

    // Execute multi-tier workflow step
    if (typeof WorkflowEngine !== 'undefined') {
      const wf = WorkflowEngine.advanceApproval(leave, 'leaves', Auth.user);
      if (!wf.isFinalTier) {
        DB.update('leave_requests', leaveId, {
          ...wf.updates,
          managerStatus: 'approved',
          managerApprovedAt: new Date().toISOString()
        });
        DB.flushServerPush();
        DB.log('APPROVE', 'Leaves', `Tier ${wf.nextTierNum - 1} endorsed for leave #${leaveId} by ${Auth.user?.username}`, Auth.user?.id);
        Toast.show(`Tier ${wf.nextTierNum - 1} Endorsed!`, 'info', `Forwarded to Tier ${wf.nextTierNum} for final authorization.`);
        this.render();
        return;
      }
    }

    if (Auth.role === 'dept_manager') {
      // First tier approval fallback: Reporting manager endorses request
      DB.update('leave_requests', leaveId, {
        status: 'manager_approved',
        managerStatus: 'approved',
        managerApprovedAt: new Date().toISOString(),
        comments: `Endorsed by ${Auth.user?.username || 'Deputy Manager'}`
      });
      DB.flushServerPush();
      DB.log('APPROVE', 'Leaves', `Manager endorsed leave #${leaveId} for employee #${leave.employeeId}`, Auth.user?.id);
      Toast.show('Leave Endorsed by Manager!', 'info', 'Forwarded to HR & Admin for final approval and quota deduction.');
    } else {
      // Final approval: HR Manager or Superadmin has universal authority
      DB.update('leave_requests', leaveId, {
        status: 'approved',
        hrStatus: 'approved',
        approvedOn: Utils.today(),
        comments: `Final approval granted by ${Auth.user?.username || 'Admin/HR'}`
      });

      // Deduct from leave balance when finally approved using the chosen quota (skip if salary deduction)
      if (!leave.salaryDeduction) {
        const balances = DB.get('leave_balances') || [];
        const bal = balances.find(b => b.employeeId === leave.employeeId);
        const targetQuotaId = leave.quotaTypeId || leave.typeId;
        if (bal && bal.balances && bal.balances[targetQuotaId] !== undefined) {
          bal.balances[targetQuotaId] = Math.max(0, Math.round((bal.balances[targetQuotaId] - leave.days) * 100) / 100);
          DB.set('leave_balances', balances);
        }
      }

      DB.flushServerPush();
      DB.log('APPROVE', 'Leaves', `Leave #${leaveId} approved (Final)`, Auth.user?.id);
      if (leave.salaryDeduction) {
        if (['superadmin', 'hr_manager'].includes(Auth.role)) {
          Toast.show(`Leave approved with Salary Deduction (PKR ${(leave.deductionAmount||0).toLocaleString()}) for payroll!`, 'success');
        } else {
          Toast.show('Leave approved with Loss of Pay and forwarded to HR for payroll adjustment!', 'success');
        }
      } else {
        Toast.show('Final leave approval granted! Quota deducted.', 'success');
      }

      // ── Email Notification: Final leave approved → employee ─
      if (typeof EmailNotifier !== 'undefined') {
        const emp = DB.find('employees', leave.employeeId);
        const empEmail = emp?.email || emp?.workEmail;
        const leaveTypeName = DB.find('leave_types', leave.typeId)?.name || 'Leave';
        if (empEmail) {
          EmailNotifier.sendLeaveDecisionEmail({
            employeeEmail: empEmail,
            employee: { name: emp?.fullName, empId: emp?.empNo },
            decisionBy: Auth.user?.username || Auth.user?.name || 'HR Manager',
            status: 'approved',
            leaveType: leaveTypeName,
            fromDate: Utils.formatDate(leave.from),
            toDate: Utils.formatDate(leave.to),
            days: leave.days,
            reason: leave.reason,
            remarks: `Final approval granted by ${Auth.user?.username || 'Admin/HR'}`
          });
        }
      }
    }

    this.render();
  },


  reject(leaveId) {
    if (!Auth.can('leaves.approve') || !Auth.canSeeFeature('leaves.approvals')) {
      Toast.show('Permission denied: You do not have permission to reject leaves.', 'error');
      return;
    }
    const _rejectLeave = DB.find('leave_requests', leaveId);
    DB.update('leave_requests', leaveId, { status: 'rejected', approvedOn: Utils.today(), comments: 'Rejected' });
    DB.flushServerPush();
    DB.log('REJECT', 'Leaves', `Leave #${leaveId} rejected`, Auth.user?.id);
    Toast.show('Leave rejected.', 'warning');

    // ── Email Notification: Leave rejected → employee ─
    if (typeof EmailNotifier !== 'undefined' && _rejectLeave) {
      const emp = DB.find('employees', _rejectLeave.employeeId);
      const empEmail = emp?.email || emp?.workEmail;
      const leaveTypeName = DB.find('leave_types', _rejectLeave.typeId)?.name || 'Leave';
      if (empEmail) {
        EmailNotifier.sendLeaveDecisionEmail({
          employeeEmail: empEmail,
          employee: { name: emp?.fullName, empId: emp?.empNo },
          decisionBy: Auth.user?.username || 'Manager',
          status: 'rejected',
          leaveType: leaveTypeName,
          fromDate: Utils.formatDate(_rejectLeave.from),
          toDate: Utils.formatDate(_rejectLeave.to),
          days: _rejectLeave.days,
          reason: _rejectLeave.reason,
          remarks: 'Your leave request was not approved at this time. Please contact your manager for details.'
        });
      }
    }

    this.renderView();
  },


  cancelLeave(leaveId) {
    const leave = DB.find('leave_requests', leaveId);
    const isSelf = Auth.employee && leave && leave.employeeId === Auth.employee.id;
    if (!isSelf && !Auth.can('leaves.delete')) {
      Toast.show('Permission denied: You do not have permission to cancel this leave request.', 'error');
      return;
    }
    Modal.confirm('Cancel Leave', 'Are you sure you want to cancel this leave request?', () => {
      DB.delete('leave_requests', leaveId);
      DB.flushServerPush();
      Toast.show('Leave request cancelled.', 'info');
      this.renderView();
    });
  },

  viewDetail(leaveId) {
    const leave = DB.find('leave_requests', leaveId);
    const emp = DB.find('employees', leave.employeeId);
    const type = DB.find('leave_types', leave.typeId);
    const quotaType = leave.quotaTypeId ? DB.find('leave_types', leave.quotaTypeId) : type;
    const isHROrAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
    const isSelf = Auth.employee?.id === leave.employeeId;
    const showFinancials = isHROrAdmin || isSelf;

    Modal.show(`Leave Request — ${emp?.fullName}`, `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${[
          ['Employee', emp?.fullName + ' (' + emp?.empNo + ')'],
          ['Leave Type', type?.name],
          ['Quota Utilized', quotaType?.name ? `${quotaType.name} Quota` : 'Standard Quota'],
          ['From', Utils.formatDate(leave.from)],
          ['To', Utils.formatDate(leave.to)],
          ['Days', `${leave.days != null ? leave.days : (leave.from && leave.to ? Math.max(1, Math.round((new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24)) + 1) : 1)} day${(leave.days != null ? leave.days : 1) !== 1 ? 's' : ''}`],
          ['Reason', leave.reason || '—'],
          ['Remarks / Handover', leave.remarks || '—'],
          ['Salary Deduction', leave.salaryDeduction 
            ? (showFinancials 
                ? `<span class="badge badge-warning" style="font-size:12px"><i class="fa fa-money-bill-wave"></i> PKR ${(leave.deductionAmount||0).toLocaleString()} (Unpaid LOP)</span>` 
                : '<span class="badge badge-warning" style="font-size:12px"><i class="fa fa-clock"></i> Unpaid Leave (Loss of Pay)</span>')
            : '<span class="badge badge-secondary">Paid Quota Leave</span>'],
          ['Applied On', Utils.formatDate(leave.appliedOn)],
          ['Status', Utils.statusBadge(leave.status)],
          ['Comments', leave.comments || '—'],
        ].map(([l,v])=>`<div style="display:flex;padding:8px 0;border-bottom:1px solid var(--border)"><div style="width:140px;font-size:12px;color:var(--text-3);font-weight:500">${l}</div><div style="font-size:13px">${v}</div></div>`).join('')}
      </div>
    `);
  },

  prevMonth() { if (this.calMonth === 0) { this.calMonth = 11; this.calYear--; } else this.calMonth--; this.renderView(); },
  nextMonth() { if (this.calMonth === 11) { this.calMonth = 0; this.calYear++; } else this.calMonth++; this.renderView(); },

  showAddHoliday() {
    if (!Auth.can('leaves.edit')) {
      Toast.show('Permission denied: You do not have permission to add holidays.', 'error');
      return;
    }
    Modal.show('Add Holiday', `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Holiday Name</label><input class="form-control" id="hl-name" placeholder="e.g. Independence Day"></div>
        <div class="form-group"><label class="form-label required">Date</label><input type="date" class="form-control" id="hl-date"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="hl-type">
            <option value="national">National</option>
            <option value="religious">Religious</option>
            <option value="company">Company</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Mandatory?</label>
          <select class="form-control" id="hl-opt"><option value="false">Mandatory</option><option value="true">Optional</option></select>
        </div>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Leaves.saveHoliday()"><i class="fa fa-save"></i> Save</button>`
    });
  },
  saveHoliday() {
    if (!Auth.can('leaves.edit')) { Toast.show('Permission denied: Cannot save holiday.', 'error'); return; }
    const name = document.getElementById('hl-name').value.trim();
    const date = document.getElementById('hl-date').value;
    if (!name || !date) { Toast.show('Name and date are required', 'error'); return; }
    DB.add('holidays', {
      id: DB.nextId('holidays'), name, date,
      type: document.getElementById('hl-type').value,
      optional: document.getElementById('hl-opt').value === 'true'
    });
    Modal.close('dynamic-modal');
    Toast.show('Holiday added!', 'success');
    this.renderView();
  },

  // ============================================================
  // OVERTIME TOKEN MANAGEMENT — Non-Cash Compensatory Time
  // Employee applies token claim for manager approval ->
  // Manager approves/rejects -> Avail as Short/Half/Full (min 45m)
  // ============================================================
  getEmployeeTokenMetrics(empId) {
    const tokens = DB.get('overtime_tokens') || [];
    const availments = DB.get('token_availments') || [];
    const empTokens = tokens.filter(t => t.employeeId === empId);
    const empAvailments = availments.filter(a => a.employeeId === empId && a.status === 'approved');

    const approvedHours = empTokens.filter(t => t.status === 'approved').reduce((s, t) => s + (Number(t.hours) || 0), 0);
    const pendingHours = empTokens.filter(t => t.status === 'pending').reduce((s, t) => s + (Number(t.hours) || 0), 0);
    const rejectedHours = empTokens.filter(t => t.status === 'rejected').reduce((s, t) => s + (Number(t.hours) || 0), 0);
    const availedHours = empAvailments.reduce((s, a) => s + (Number(a.hours) || 0), 0);

    const balanceHours = Math.max(0, Math.round((approvedHours - availedHours) * 100) / 100);
    const balanceDays = Math.round((balanceHours / 8) * 100) / 100;

    return {
      approvedHours: Math.round(approvedHours * 100) / 100,
      pendingHours: Math.round(pendingHours * 100) / 100,
      rejectedHours: Math.round(rejectedHours * 100) / 100,
      availedHours: Math.round(availedHours * 100) / 100,
      balanceHours,
      balanceDays
    };
  },

  renderTokens(container) {
    if (!container) return;
    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isDeptMgr = Auth.role === 'dept_manager';
    const isHRorAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    const scopedEmps = this.getScopedEmployees();
    const scopedIds = scopedEmps.map(e => e.id);
    const metrics = this.getEmployeeTokenMetrics(myEmpId);

    const allTokens = DB.get('overtime_tokens') || [];
    const allAvailments = DB.get('token_availments') || [];

    // Filter pending tokens requiring manager review
    const pendingTokens = allTokens.filter(t => {
      if (isHRorAdmin) return t.status === 'pending';
      if (isDeptMgr) return (t.managerId === myEmpId || scopedIds.includes(t.employeeId)) && t.status === 'pending';
      return false;
    });

    // Claims ledger filtering
    const displayTokens = allTokens.filter(t => {
      if (isEmployee) return t.employeeId === myEmpId;
      if (isDeptMgr) return t.managerId === myEmpId || scopedIds.includes(t.employeeId) || t.employeeId === myEmpId;
      return true;
    });

    // Availments ledger filtering
    const displayAvailments = allAvailments.filter(a => {
      if (isEmployee) return a.employeeId === myEmpId;
      if (isDeptMgr) return scopedIds.includes(a.employeeId) || a.employeeId === myEmpId;
      return true;
    });

    // Calculate 90-day validity and expiry alerts for approved claims
    const nowTime = new Date().getTime();
    const expiringSoonTokens = displayTokens.filter(t => {
      if (t.status !== 'approved') return false;
      const tTime = new Date(t.date).getTime();
      const expiryTime = t.expiryDate ? new Date(t.expiryDate).getTime() : (tTime + 90 * 86400000);
      const daysLeft = Math.ceil((expiryTime - nowTime) / 86400000);
      return daysLeft <= 15 && daysLeft >= 0;
    });

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Banner: Comp-Off & TOIL Info & Actions -->
        <div class="card" style="padding:18px 22px;margin-bottom:20px;background:linear-gradient(135deg,rgba(99,102,241,0.07) 0%,rgba(168,85,247,0.06) 100%);border:1.5px solid rgba(99,102,241,0.25);border-radius:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 14px rgba(99,102,241,0.3)">
                <i class="fa fa-coins"></i>
              </div>
              <div>
                <h3 style="font-size:17px;font-weight:800;color:var(--text);margin:0;letter-spacing:-0.3px">
                  Comp-Off &amp; Time-Off-In-Lieu (TOIL) Token Bank
                </h3>
                <p style="font-size:12px;color:var(--text-3);margin:3px 0 0">
                  Comp-off credits earned for approved overtime, weekend duty, and gazetted holiday work. <strong>Validity: 90 Days</strong>. Tokens can be availed as <strong>Short Leave (min 45 min)</strong>, <strong>Half Day (4h)</strong>, or <strong>Full Day (8h)</strong>.
                </p>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="Leaves.showClaimOvertimeTokenModal()">
                <i class="fa fa-plus-circle"></i> Claim Comp-Off / TOIL
              </button>
              <button class="btn btn-success" onclick="Leaves.showAvailTokenModal()">
                <i class="fa fa-calendar-check"></i> Avail Comp-Off as Leave
              </button>
            </div>
          </div>
        </div>

        ${expiringSoonTokens.length > 0 ? `
          <div style="background:rgba(245,158,11,0.1);border:1.5px solid rgba(245,158,11,0.35);border-radius:12px;padding:12px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
            <i class="fa fa-triangle-exclamation" style="font-size:22px;color:var(--warning)"></i>
            <div style="flex:1">
              <div style="font-weight:700;color:var(--warning);font-size:13.5px">Comp-Off &amp; TOIL Expiry Warning (90-Day Policy Rule)</div>
              <div style="font-size:12px;color:var(--text-2);margin-top:2px">
                <strong>${expiringSoonTokens.length} approved token claim(s)</strong> are expiring within 15 days. Unavailed compensatory credits lapse automatically after 90 days from credit date.
              </div>
            </div>
            <button class="btn btn-warning btn-sm" onclick="Leaves.showAvailTokenModal()"><i class="fa fa-calendar-check"></i> Avail Now</button>
          </div>
        ` : ''}

        <!-- 4 KPI Metrics Hero Grid -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #10b981;box-shadow:0 2px 10px rgba(0,0,0,0.03)">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Available Token Balance</span>
              <i class="fa fa-coins" style="font-size:18px;color:#10b981"></i>
            </div>
            <div style="font-size:28px;font-weight:800;color:#10b981;margin:8px 0 2px">${metrics.balanceHours} <span style="font-size:14px;font-weight:600">hrs</span></div>
            <div style="font-size:11px;color:var(--text-muted)">≈ <strong>${metrics.balanceDays} Days</strong> compensatory leave available</div>
          </div>

          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #6366f1;box-shadow:0 2px 10px rgba(0,0,0,0.03)">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Total Approved Overtime</span>
              <i class="fa fa-shield-check" style="font-size:18px;color:#6366f1"></i>
            </div>
            <div style="font-size:28px;font-weight:800;color:#6366f1;margin:8px 0 2px">${metrics.approvedHours} <span style="font-size:14px;font-weight:600">hrs</span></div>
            <div style="font-size:11px;color:var(--text-muted)">Verified work assigned by manager</div>
          </div>

          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #8b5cf6;box-shadow:0 2px 10px rgba(0,0,0,0.03)">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Availed Token Leave</span>
              <i class="fa fa-clock-rotate-left" style="font-size:18px;color:#8b5cf6"></i>
            </div>
            <div style="font-size:28px;font-weight:800;color:#8b5cf6;margin:8px 0 2px">${metrics.availedHours} <span style="font-size:14px;font-weight:600">hrs</span></div>
            <div style="font-size:11px;color:var(--text-muted)">Recorded under Token Leave quota</div>
          </div>

          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #f59e0b;box-shadow:0 2px 10px rgba(0,0,0,0.03)">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Pending Claims</span>
              <i class="fa fa-hourglass-half" style="font-size:18px;color:#f59e0b"></i>
            </div>
            <div style="font-size:28px;font-weight:800;color:#f59e0b;margin:8px 0 2px">${metrics.pendingHours} <span style="font-size:14px;font-weight:600">hrs</span></div>
            <div style="font-size:11px;color:var(--text-muted)">Under review with reporting manager</div>
          </div>
        </div>

        <!-- Manager / HR Action Box: Pending Token Approvals -->
        ${pendingTokens.length > 0 ? `
          <div class="card" style="padding:0;margin-bottom:24px;border:1.5px solid rgba(245,158,11,0.4)">
            <div style="padding:14px 18px;background:rgba(245,158,11,0.08);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:10px">
                <span class="badge badge-warning" style="font-size:12px;padding:4px 8px"><i class="fa fa-bell"></i> Action Required</span>
                <span style="font-weight:800;font-size:14px;color:var(--text)">Pending Overtime Token Claims from Team Members (${pendingTokens.length})</span>
              </div>
              <span style="font-size:11.5px;color:var(--text-3)">Review work assignment and approve or reject</span>
            </div>
            <div class="table-wrapper" style="border:none">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date Worked</th>
                    <th>Extra Hours</th>
                    <th>Assigned Work / Task Description</th>
                    <th>Applied On</th>
                    <th style="text-align:center">Manager Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingTokens.map(t => {
                    const emp = DB.find('employees', t.employeeId);
                    return `
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:10px">
                            <div class="avatar avatar-sm" style="background:${Utils.avatarColor(t.employeeId)}">${Utils.avatarInitials(emp?.fullName||'?')}</div>
                            <div>
                              <div style="font-weight:700;font-size:13px">${emp?.fullName || 'Employee #' + t.employeeId}</div>
                              <div style="font-size:11px;color:var(--text-3)">${emp?.empNo} • ${Utils.getDeptName(emp?.departmentId)}</div>
                            </div>
                          </div>
                        </td>
                        <td style="font-weight:600;font-size:12.5px">${Utils.formatDate(t.date)}</td>
                        <td><span class="badge badge-primary" style="font-size:12px;font-weight:700">${t.minutes ? `${Math.floor(t.minutes / 60) > 0 ? Math.floor(t.minutes / 60) + 'h ' : ''}${t.minutes % 60}m (${t.hours}h)` : `${t.hours} hrs`} OT</span></td>
                        <td style="max-width:320px;font-size:12.5px;color:var(--text)">
                          <div style="line-height:1.4">${t.taskDescription}</div>
                        </td>
                        <td style="font-size:11.5px;color:var(--text-3)">${t.appliedOn}</td>
                        <td style="text-align:center;white-space:nowrap">
                          ${Auth.can('leaves.approve') ? `
                            <button class="btn btn-success btn-sm" style="margin-right:6px" onclick="Leaves.approveOvertimeToken(${t.id})" title="Approve token claim if work was assigned">
                              <i class="fa fa-check"></i> Approve
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="Leaves.rejectOvertimeToken(${t.id})" title="Reject token claim">
                              <i class="fa fa-times"></i> Reject
                            </button>
                          ` : `<span class="badge badge-secondary">Pending Approval</span>`}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Section 1: Overtime Token Claims Ledger -->
        <div class="card" style="padding:0;margin-bottom:24px">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">
                <i class="fa fa-list-check" style="color:var(--primary);margin-right:6px"></i>
                Comp-Off &amp; Overtime Token Claims &amp; Verification Ledger
              </div>
              <div style="font-size:11.5px;color:var(--text-3)">
                ${isEmployee ? 'History of your submitted claims, 90-day validity countdown, and manager verification notes' : 'Corporate overtime & comp-off claims ledger and reporting manager approvals'}
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="Leaves.showClaimOvertimeTokenModal()">
              <i class="fa fa-plus"></i> Claim Comp-Off / OT
            </button>
          </div>

          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Date Worked</th>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Extra Hours</th>
                  <th>Task Description / Assigned Work</th>
                  <th>Reporting Manager</th>
                  <th>Validity (90 Days)</th>
                  <th>Status</th>
                  <th>Manager Remarks / Approval</th>
                </tr>
              </thead>
              <tbody>
                ${displayTokens.length === 0 ? `
                  <tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted)">No overtime token claims recorded yet.</td></tr>
                ` : displayTokens.map(t => {
                  const emp = DB.find('employees', t.employeeId);
                  const mgr = DB.find('employees', t.managerId || emp?.managerId || emp?.reportingTo || 3);
                  let statusBadge = '<span class="badge badge-warning"><i class="fa fa-clock"></i> Pending Review</span>';
                  if (t.status === 'approved') statusBadge = '<span class="badge badge-success"><i class="fa fa-check-circle"></i> Approved</span>';
                  else if (t.status === 'rejected') statusBadge = '<span class="badge badge-danger"><i class="fa fa-circle-xmark"></i> Rejected</span>';

                  const categoryLabel = t.claimType === 'weekend' ? 'Weekend Comp-Off' : (t.claimType === 'holiday' ? 'Holiday TOIL' : 'Shift Overtime');
                  const categoryIcon = t.claimType === 'weekend' ? 'fa-calendar-week' : (t.claimType === 'holiday' ? 'fa-star' : 'fa-clock');
                  const categoryBadgeColor = t.claimType === 'weekend' ? '#8b5cf6' : (t.claimType === 'holiday' ? '#ec4899' : '#6366f1');

                  // Expiry
                  const tTime = new Date(t.date).getTime();
                  const expiryTime = t.expiryDate ? new Date(t.expiryDate).getTime() : (tTime + 90 * 86400000);
                  const daysLeft = Math.ceil((expiryTime - nowTime) / 86400000);
                  let validityBadge = '<span class="badge badge-neutral">—</span>';
                  if (t.status === 'approved') {
                    if (daysLeft < 0) {
                      validityBadge = '<span class="badge badge-danger" title="90-day validity expired"><i class="fa fa-clock-rotate-left"></i> Expired</span>';
                    } else if (daysLeft <= 15) {
                      validityBadge = `<span class="badge badge-warning" title="Expiring in ${daysLeft} days"><i class="fa fa-triangle-exclamation"></i> ${daysLeft}d Left</span>`;
                    } else {
                      validityBadge = `<span class="badge badge-neutral" style="font-size:11px"><i class="fa fa-shield"></i> ${daysLeft}d left</span>`;
                    }
                  }

                  return `
                    <tr>
                      <td style="font-weight:600;font-size:12.5px">${Utils.formatDate(t.date)}</td>
                      <td>
                        <div style="font-weight:600;font-size:12.5px">${emp?.fullName || 'Self'}</div>
                        <div style="font-size:10.5px;color:var(--text-3)">${emp?.empNo}</div>
                      </td>
                      <td>
                        <span class="badge" style="background:${categoryBadgeColor}15;color:${categoryBadgeColor};border:1px solid ${categoryBadgeColor}35;font-size:11px">
                          <i class="fa ${categoryIcon}" style="margin-right:3px"></i> ${categoryLabel}
                        </span>
                      </td>
                      <td><span class="badge badge-primary" style="font-weight:700">${t.minutes ? `${Math.floor(t.minutes / 60) > 0 ? Math.floor(t.minutes / 60) + 'h ' : ''}${t.minutes % 60}m (${t.hours}h)` : `${t.hours} hrs`}</span></td>
                      <td style="max-width:240px;font-size:12px;color:var(--text-2);line-height:1.4">${t.taskDescription}</td>
                      <td style="font-size:12px;color:var(--text-2)">
                        <strong>${mgr?.fullName || 'Usman Baig'}</strong>
                      </td>
                      <td>${validityBadge}</td>
                      <td>${statusBadge}</td>
                      <td style="font-size:11.5px;color:var(--text-3);max-width:200px">
                        ${t.managerRemarks || (t.status === 'approved' ? '✓ Verified work assignment' : (t.status === 'rejected' ? '✗ Rejected' : 'Awaiting review'))}
                        ${t.managerApprovedAt ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px">${new Date(t.managerApprovedAt).toLocaleDateString()}</div>` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 2: Token Leave Availment Ledger -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">
                <i class="fa fa-calendar-check" style="color:#10b981;margin-right:6px"></i>
                Token Leave Availment History
              </div>
              <div style="font-size:11.5px;color:var(--text-3)">
                Compensatory leave taken utilizing banked overtime tokens (Short Leave 45m+, Half Day 4h, Full Day 8h)
              </div>
            </div>
            <button class="btn btn-success btn-sm" onclick="Leaves.showAvailTokenModal()">
              <i class="fa fa-calendar-plus"></i> Avail Token Leave
            </button>
          </div>

          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Leave Date</th>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration Availed</th>
                  <th>Quota Deducted</th>
                  <th>Reason / Purpose</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${displayAvailments.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No token leave availments recorded yet.</td></tr>
                ` : displayAvailments.map(a => {
                  const emp = DB.find('employees', a.employeeId);
                  const typeLabel = a.leaveDuration === 'short' ? 'Short Leave (45m+)' : (a.leaveDuration === 'half' ? 'Half Day Leave' : 'Full Day Leave');
                  return `
                    <tr>
                      <td style="font-weight:600;font-size:12.5px">${Utils.formatDate(a.date)}</td>
                      <td>
                        <div style="font-weight:600;font-size:12.5px">${emp?.fullName || 'Self'}</div>
                        <div style="font-size:10.5px;color:var(--text-3)">${emp?.empNo}</div>
                      </td>
                      <td><span class="badge badge-info" style="font-size:11px;font-weight:600">${typeLabel}</span></td>
                      <td style="font-weight:700;color:var(--primary)">${a.hours} hrs (${a.minutes || (a.hours*60)} mins)</td>
                      <td><span class="badge badge-secondary">${a.days || Math.round((a.hours/8)*100)/100} Days</span></td>
                      <td style="font-size:12px;color:var(--text-2);max-width:280px">
                        <div>${a.reason}</div>
                        ${a.tokenSummary ? `<div style="font-size:10.5px;color:var(--primary);margin-top:3px;font-weight:600"><i class="fa fa-coins"></i> ${a.tokenSummary}</div>` : ''}
                      </td>
                      <td><span class="badge badge-success"><i class="fa fa-check-circle"></i> Availed &amp; Deducted</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  getAttendanceOvertimeForDate(empId, date) {
    const allAtt = DB.get('attendance') || [];
    const attRec = allAtt.find(a => a.employeeId === empId && a.date === date);

    if (!attRec) {
      return {
        found: false,
        timeIn: null,
        timeOut: null,
        breaks: [],
        workingHours: '0h 0m',
        workingMins: 0,
        recordedOtMins: 0,
        recordedOtHours: 0,
        alreadyClaimedMins: 0,
        remainingClaimableMins: 0
      };
    }

    const timeIn = attRec.timeIn || '';
    const timeOut = attRec.timeOut || '';
    const breakOut = attRec.breakOut || '';
    const breakIn = attRec.breakIn || '';
    const breaks = (attRec.breaks && attRec.breaks.length) ? attRec.breaks : (breakOut && breakIn ? [{ breakOut, breakIn }] : []);

    let workingMins = 0;
    if (typeof Attendance !== 'undefined' && Attendance.calcWorkingMinutes && timeIn && timeOut) {
      workingMins = Attendance.calcWorkingMinutes(timeIn, timeOut, breakOut, breakIn, breaks);
    } else if (timeIn && timeOut) {
      const [inH, inM] = timeIn.split(':').map(Number);
      const [outH, outM] = timeOut.split(':').map(Number);
      let gross = (outH * 60 + outM) - (inH * 60 + inM);
      let bMins = 0;
      breaks.forEach(b => {
        if (b && b.breakOut && b.breakIn) {
          const [bOH, bOM] = b.breakOut.split(':').map(Number);
          const [bIH, bIM] = b.breakIn.split(':').map(Number);
          const diff = (bIH * 60 + bIM) - (bOH * 60 + bOM);
          if (diff > 0) bMins += diff;
        }
      });
      workingMins = Math.max(0, gross - bMins);
    }

    // Standard Shift Requirement: 8.0h (480 mins)
    let calculatedOtMins = Math.max(0, workingMins - 480);
    if (attRec.overtime && typeof attRec.overtime === 'number' && attRec.overtime > 0) {
      const explicitOtMins = Math.round(attRec.overtime * 60);
      calculatedOtMins = Math.max(calculatedOtMins, explicitOtMins);
    }

    // Previously claimed tokens on this date
    const allTokens = DB.get('overtime_tokens') || [];
    const dateTokens = allTokens.filter(t => t.employeeId === empId && t.date === date && t.status !== 'rejected');
    const alreadyClaimedMins = dateTokens.reduce((sum, t) => {
      if (typeof t.minutes === 'number' && t.minutes > 0) return sum + t.minutes;
      return sum + Math.round((Number(t.hours) || 0) * 60);
    }, 0);

    const remainingClaimableMins = Math.max(0, calculatedOtMins - alreadyClaimedMins);

    return {
      found: true,
      status: attRec.status,
      timeIn,
      timeOut,
      breaks,
      workingMins,
      workingHours: `${Math.floor(workingMins / 60)}h ${workingMins % 60}m`,
      recordedOtMins: calculatedOtMins,
      recordedOtHours: Math.round((calculatedOtMins / 60) * 100) / 100,
      alreadyClaimedMins,
      remainingClaimableMins
    };
  },

  showClaimOvertimeTokenModal(prefillDate, prefillHours) {
    const allEmps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const myEmp = Auth.employee || DB.find('employees', 4) || allEmps[0];
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isManagement = !isEmployee;
    const defaultDate = prefillDate || Utils.today();

    // Direct Reporting Manager
    const mgrId = myEmp?.managerId || myEmp?.reportingTo || 3;
    const mgr = DB.find('employees', mgrId) || { fullName: 'Usman Baig (Tech Lead / Deputy Manager)' };

    Modal.show('Apply Overtime Token Claim', `
      <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:14px">
        <div style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.08));border:1px solid rgba(99,102,241,0.3);border-radius:10px;padding:12px 14px">
          <div style="font-size:13px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
            <i class="fa fa-coins" style="color:var(--primary)"></i> Overtime Token Application Policy
          </div>
          <div style="font-size:11.5px;color:var(--text-2);margin-top:4px;line-height:1.4">
            Overtime is <strong>not paid as cash salary</strong>. Claim extra hours worked for approval by your direct reporting manager. Once approved, banked token time can be availed as Short Leave, Half Day, or Full Day compensatory time.
          </div>
        </div>

        ${isManagement ? `
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required">Employee</label>
            <select class="form-control" id="ot-claim-emp" onchange="Leaves.onClaimEmpChange(this.value)">
              ${allEmps.map(e => `<option value="${e.id}" ${e.id === myEmp.id ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
            </select>
          </div>
        ` : `
          <input type="hidden" id="ot-claim-emp" value="${myEmp.id}">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:10px 14px;display:flex;align-items:center;gap:12px">
            <div class="avatar avatar-sm" style="background:${Utils.avatarColor(myEmp.id)}">${Utils.avatarInitials(myEmp.fullName)}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px">${myEmp.fullName} (${myEmp.empNo})</div>
              <div style="font-size:11.5px;color:var(--text-3)">Reporting to: <strong>${mgr.fullName}</strong></div>
            </div>
            <span class="badge badge-primary" style="font-size:11px"><i class="fa fa-coins"></i> OT Token</span>
          </div>
        `}

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label required"><i class="fa fa-tag" style="color:var(--primary);margin-right:4px"></i> Comp-Off / Token Category</label>
          <select class="form-control" id="ot-claim-category" onchange="Leaves.onClaimCategoryChange(this.value)">
            <option value="overtime">Shift Overtime (Extra Hours Worked)</option>
            <option value="weekend">Weekend Duty Comp-Off (Saturday/Sunday Shift — 8h)</option>
            <option value="holiday">Gazetted Public Holiday Comp-Off (Holiday Duty — 8h)</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label required"><i class="fa fa-calendar-day" style="color:var(--primary);margin-right:4px"></i> Date Overtime / Duty Worked</label>
          <input type="date" class="form-control" id="ot-claim-date" value="${defaultDate}" onchange="Leaves.onClaimDateOrEmpChange()">
        </div>

        <!-- Attendance Overtime Verification Strip -->
        <div id="ot-claim-att-strip"></div>

        <!-- Overtime Claim Duration Inputs -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:12px 14px">
          <label class="form-label required" style="margin-bottom:6px">
            <i class="fa fa-business-time" style="color:var(--primary);margin-right:4px"></i> Token Duration to Claim
          </label>
          
          <!-- Remaining claimable info bar -->
          <div id="ot-claim-max-bar" style="margin-bottom:8px"></div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" style="font-size:11.5px;color:var(--text-3);margin-bottom:3px">Hours (max by attendance)</label>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" class="form-control" id="ot-claim-hours" value="0" min="0" max="12" step="1" oninput="Leaves.validateClaimDuration()" onchange="Leaves.validateClaimDuration()">
                <span style="font-size:12px;color:var(--text-3);font-weight:600">hrs</span>
              </div>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" style="font-size:11.5px;color:var(--text-3);margin-bottom:3px">Minutes (max by attendance)</label>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" class="form-control" id="ot-claim-mins" value="0" min="0" max="59" step="1" oninput="Leaves.validateClaimDuration()" onchange="Leaves.validateClaimDuration()">
                <span style="font-size:12px;color:var(--text-3);font-weight:600">mins</span>
              </div>
            </div>
          </div>

          <!-- Quick Fill Pill Shortcuts -->
          <div id="ot-claim-quick-pills"></div>

          <!-- Live Validation Feedback Banner -->
          <div id="ot-claim-val-msg" style="margin-top:8px"></div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label required"><i class="fa fa-user-check" style="color:var(--primary);margin-right:4px"></i> Reporting Manager for Approval</label>
          <input type="text" class="form-control" id="ot-claim-mgr-display" value="${mgr.fullName}" readonly style="background:var(--surface);font-weight:600">
          <input type="hidden" id="ot-claim-mgr-id" value="${mgrId}">
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label required"><i class="fa fa-briefcase" style="color:var(--primary);margin-right:4px"></i> Assigned Task / Work Description</label>
          <textarea class="form-control" id="ot-claim-desc" rows="3" placeholder="Describe the specific work, task, or client issue assigned by your manager that required extra hours (e.g. critical cloud deployment, emergency bug fix, client delivery)..."></textarea>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Reporting manager will review this description to verify the assigned work before approving.</div>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-ot-claim" onclick="Leaves.submitClaimOvertimeToken()"><i class="fa fa-paper-plane"></i> Submit Token Claim</button>
      `
    });

    setTimeout(() => {
      this.onClaimDateOrEmpChange(prefillHours);
    }, 50);
  },

  onClaimEmpChange(empId) {
    const emp = DB.find('employees', parseInt(empId));
    if (!emp) return;
    const mgrId = emp.managerId || emp.reportingTo || 3;
    const mgr = DB.find('employees', mgrId) || { fullName: 'Usman Baig' };
    const disp = document.getElementById('ot-claim-mgr-display');
    const hidden = document.getElementById('ot-claim-mgr-id');
    if (disp) disp.value = mgr.fullName;
    if (hidden) hidden.value = mgrId;
    this.onClaimDateOrEmpChange();
  },

  onClaimCategoryChange(category) {
    const hoursInput = document.getElementById('ot-claim-hours');
    const minsInput = document.getElementById('ot-claim-mins');
    const valMsg = document.getElementById('ot-claim-val-msg');
    const desc = document.getElementById('ot-claim-desc');

    if (category === 'weekend' || category === 'holiday') {
      if (hoursInput) hoursInput.value = 8;
      if (minsInput) minsInput.value = 0;
      if (desc && !desc.value) {
        desc.value = category === 'weekend' ? 'Assigned weekend roster duty' : 'Assigned gazetted public holiday emergency duty';
      }
      if (valMsg) {
        valMsg.innerHTML = `<div style="font-size:12px;color:var(--success);font-weight:600"><i class="fa fa-circle-check"></i> ${category === 'weekend' ? 'Weekend Duty Comp-Off' : 'Gazetted Holiday TOIL'} credit: 8.0 hours (1 Full Day). Valid for 90 days.</div>`;
      }
    } else {
      this.onClaimDateOrEmpChange();
    }
  },

  onClaimDateOrEmpChange(prefillHours) {
    const empInput = document.getElementById('ot-claim-emp');
    const empId = empInput ? parseInt(empInput.value) : (Auth.employee?.id || 4);
    const dateInput = document.getElementById('ot-claim-date');
    const date = dateInput ? dateInput.value : Utils.today();
    const strip = document.getElementById('ot-claim-att-strip');
    const pillsContainer = document.getElementById('ot-claim-quick-pills');
    const hoursInput = document.getElementById('ot-claim-hours');
    const minsInput = document.getElementById('ot-claim-mins');
    if (!strip) return;

    const otInfo = this.getAttendanceOvertimeForDate(empId, date);

    if (!otInfo.found) {
      strip.innerHTML = `
        <div style="background:#fef2f2;border:1px solid #f87171;border-radius:8px;padding:10px 14px;font-size:12px;color:#991b1b">
          <div style="font-weight:700;display:flex;align-items:center;gap:6px">
            <i class="fa fa-triangle-exclamation"></i> No Attendance Record Found
          </div>
          <div style="margin-top:3px;font-size:11.5px;line-height:1.4">
            No attendance shift is logged for <strong>${Utils.formatDate(date)}</strong>. You must have a recorded attendance shift with extra hours clocked beyond 8h 0m to claim overtime tokens.
          </div>
        </div>
      `;
      if (pillsContainer) pillsContainer.innerHTML = '';
      if (hoursInput) hoursInput.value = 0;
      if (minsInput) minsInput.value = 0;
      this.validateClaimDuration();
      return;
    }

    if (otInfo.recordedOtMins <= 0) {
      strip.innerHTML = `
        <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:10px 14px;font-size:12px;color:#92400e">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <div style="font-weight:700;display:flex;align-items:center;gap:6px">
              <i class="fa fa-circle-info"></i> Attendance Shift: ${otInfo.timeIn || '—'} – ${otInfo.timeOut || '—'} (${otInfo.workingHours})
            </div>
            <span class="badge badge-secondary" style="font-size:11px">0 min Overtime</span>
          </div>
          <div style="margin-top:4px;font-size:11.5px;line-height:1.4">
            Standard 8h 0m shift requirement was not exceeded on <strong>${Utils.formatDate(date)}</strong>. Extra hours must be clocked beyond 8.0h to earn compensatory tokens.
          </div>
        </div>
      `;
      if (pillsContainer) pillsContainer.innerHTML = '';
      if (hoursInput) hoursInput.value = 0;
      if (minsInput) minsInput.value = 0;
      this.validateClaimDuration();
      return;
    }

    // Overtime found!
    const recHours = Math.floor(otInfo.recordedOtMins / 60);
    const recMins = otInfo.recordedOtMins % 60;
    const remHours = Math.floor(otInfo.remainingClaimableMins / 60);
    const remMins = otInfo.remainingClaimableMins % 60;
    const wrkH = Math.floor(otInfo.workingMins / 60);
    const wrkM = otInfo.workingMins % 60;

    strip.innerHTML = `
      <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:6px">
          <div style="font-weight:700;display:flex;align-items:center;gap:6px">
            <i class="fa fa-business-time" style="color:var(--success)"></i> Attendance Record for ${Utils.formatDate(date)}
          </div>
          <span style="font-size:11px;color:var(--text-3)">Punches: In <strong>${otInfo.timeIn}</strong> → Out <strong>${otInfo.timeOut}</strong></span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px">
          <div style="background:var(--surface);border-radius:6px;padding:6px 10px;text-align:center">
            <div style="font-size:10px;color:var(--text-3);font-weight:600;margin-bottom:2px">TOTAL WORKED</div>
            <div style="font-size:14px;font-weight:800;color:var(--text)">${wrkH}h ${wrkM}m</div>
            <div style="font-size:10px;color:var(--text-muted)">${otInfo.workingMins} mins</div>
          </div>
          <div style="background:rgba(99,102,241,0.07);border-radius:6px;padding:6px 10px;text-align:center">
            <div style="font-size:10px;color:var(--primary);font-weight:600;margin-bottom:2px">OVERTIME (beyond 8h)</div>
            <div style="font-size:14px;font-weight:800;color:var(--primary)">${recHours}h ${recMins}m</div>
            <div style="font-size:10px;color:var(--text-muted)">${otInfo.recordedOtMins} mins</div>
          </div>
          <div style="background:rgba(16,185,129,0.08);border-radius:6px;padding:6px 10px;text-align:center">
            <div style="font-size:10px;color:var(--success);font-weight:600;margin-bottom:2px">
              ${otInfo.alreadyClaimedMins > 0 ? 'REMAINING TO CLAIM' : 'AVAILABLE TO CLAIM'}
            </div>
            <div style="font-size:14px;font-weight:800;color:var(--success)">${remHours}h ${remMins}m</div>
            <div style="font-size:10px;color:var(--text-muted)">
              ${otInfo.alreadyClaimedMins > 0 ? `${otInfo.alreadyClaimedMins}m already claimed` : `${otInfo.remainingClaimableMins} mins`}
            </div>
          </div>
        </div>
        ${otInfo.alreadyClaimedMins > 0 ? `
          <div style="font-size:11px;color:#b45309;background:rgba(245,158,11,0.08);border-radius:5px;padding:4px 8px;font-weight:600">
            <i class="fa fa-circle-info"></i> You already have ${otInfo.alreadyClaimedMins} mins claimed on this date. You can only apply up to <strong>${otInfo.remainingClaimableMins} mins (${remHours > 0 ? remHours + 'h ' : ''}${remMins}m)</strong> more.
          </div>
        ` : ''}
      </div>
    `;

    // Update max-bar with claimable limit
    const maxBar = document.getElementById('ot-claim-max-bar');
    if (maxBar) {
      if (otInfo.remainingClaimableMins > 0) {
        maxBar.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:7px;font-size:11.5px;color:var(--text-2)">
            <i class="fa fa-lock" style="color:var(--primary)"></i>
            <span>You may claim between <strong>0</strong> and <strong>${remHours > 0 ? remHours + 'h ' : ''}${remMins}m (${otInfo.remainingClaimableMins} mins)</strong> — cannot exceed your actual overtime worked on this date.</span>
          </div>
        `;
      } else {
        maxBar.innerHTML = `
          <div style="padding:6px 10px;background:#fef2f2;border:1px solid #f87171;border-radius:7px;font-size:11.5px;color:#991b1b;font-weight:600">
            <i class="fa fa-ban"></i> No claimable overtime remaining on this date.
          </div>
        `;
      }
    }

    // Update input max attributes dynamically
    if (hoursInput) hoursInput.max = remHours;
    if (minsInput) minsInput.max = (remHours > 0 ? 59 : remMins);

    // Setup quick pills
    if (pillsContainer) {
      const pills = [];
      if (otInfo.remainingClaimableMins >= 45 && otInfo.remainingClaimableMins !== 45) {
        pills.push(`<button type="button" class="btn btn-ghost btn-xs" style="font-size:11px;border:1px solid var(--border);padding:2px 8px;color:var(--primary)" onclick="Leaves.setClaimMinutes(45)"><i class="fa fa-bolt"></i> 45 mins</button>`);
      }
      if (otInfo.remainingClaimableMins >= 60 && otInfo.remainingClaimableMins !== 60) {
        pills.push(`<button type="button" class="btn btn-ghost btn-xs" style="font-size:11px;border:1px solid var(--border);padding:2px 8px;color:var(--primary)" onclick="Leaves.setClaimMinutes(60)"><i class="fa fa-bolt"></i> 1 hour (60m)</button>`);
      }
      if (otInfo.remainingClaimableMins >= 90 && otInfo.remainingClaimableMins !== 90) {
        pills.push(`<button type="button" class="btn btn-ghost btn-xs" style="font-size:11px;border:1px solid var(--border);padding:2px 8px;color:var(--primary)" onclick="Leaves.setClaimMinutes(90)"><i class="fa fa-bolt"></i> 90 mins</button>`);
      }
      if (otInfo.remainingClaimableMins > 0) {
        pills.push(`<button type="button" class="btn btn-ghost btn-xs" style="font-size:11px;border:1px solid rgba(16,185,129,0.4);background:rgba(16,185,129,0.08);padding:2px 8px;color:var(--success);font-weight:700" onclick="Leaves.setClaimMinutes(${otInfo.remainingClaimableMins})"><i class="fa fa-star"></i> Max: ${remHours > 0 ? remHours + 'h ' : ''}${remMins}m</button>`);
      }
      pillsContainer.innerHTML = pills.length ? `
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px">
          <span style="font-size:11px;color:var(--text-3);font-weight:600">Quick Fill:</span>
          ${pills.join('')}
        </div>
      ` : '';
    }

    // Set initial claim inputs based on prefillHours or max available
    let initialClaimMins = otInfo.remainingClaimableMins;
    if (prefillHours && typeof prefillHours === 'number' && prefillHours > 0) {
      const prefMins = Math.round(prefillHours * 60);
      initialClaimMins = Math.min(prefMins, otInfo.remainingClaimableMins);
    }

    if (hoursInput) hoursInput.value = Math.floor(initialClaimMins / 60);
    if (minsInput) minsInput.value = initialClaimMins % 60;

    this.validateClaimDuration();
  },

  validateClaimDuration() {
    const empInput = document.getElementById('ot-claim-emp');
    const empId = empInput ? parseInt(empInput.value) : (Auth.employee?.id || 4);
    const dateInput = document.getElementById('ot-claim-date');
    const date = dateInput ? dateInput.value : Utils.today();
    const hoursInput = document.getElementById('ot-claim-hours');
    const minsInput = document.getElementById('ot-claim-mins');
    const msgEl = document.getElementById('ot-claim-val-msg');
    const btnSubmit = document.getElementById('btn-submit-ot-claim');

    if (!msgEl) return;

    const hours = parseInt(hoursInput?.value) || 0;
    const mins = parseInt(minsInput?.value) || 0;
    const totalClaimedMins = (hours * 60) + mins;

    const otInfo = this.getAttendanceOvertimeForDate(empId, date);

    if (!otInfo.found) {
      msgEl.innerHTML = `<div style="color:var(--danger);font-size:11.5px;font-weight:600"><i class="fa fa-circle-xmark"></i> No attendance record on this date. Cannot claim overtime.</div>`;
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.style.opacity = '0.5'; btnSubmit.style.cursor = 'not-allowed'; }
      return;
    }

    if (otInfo.recordedOtMins <= 0) {
      msgEl.innerHTML = `<div style="color:var(--danger);font-size:11.5px;font-weight:600"><i class="fa fa-circle-xmark"></i> No overtime was clocked on this date (Shift was 8h 0m or less).</div>`;
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.style.opacity = '0.5'; btnSubmit.style.cursor = 'not-allowed'; }
      return;
    }

    if (totalClaimedMins <= 0) {
      msgEl.innerHTML = `<div style="color:var(--warning);font-size:11.5px;font-weight:600"><i class="fa fa-triangle-exclamation"></i> Please enter hours and/or minutes greater than 0.</div>`;
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.style.opacity = '0.5'; btnSubmit.style.cursor = 'not-allowed'; }
      return;
    }

    if (totalClaimedMins > otInfo.remainingClaimableMins) {
      const maxH = Math.floor(otInfo.remainingClaimableMins / 60);
      const maxM = otInfo.remainingClaimableMins % 60;
      // Auto-clamp the input fields to max allowed
      if (hoursInput) hoursInput.value = maxH;
      if (minsInput) minsInput.value = maxM;
      msgEl.innerHTML = `
        <div style="background:#fef2f2;border:1px solid #f87171;color:#991b1b;border-radius:6px;padding:6px 10px;font-size:11.5px;font-weight:600">
          <i class="fa fa-circle-xmark" style="margin-right:4px"></i>
          Cannot apply for ${Math.floor(totalClaimedMins / 60) > 0 ? Math.floor(totalClaimedMins / 60) + 'h ' : ''}${totalClaimedMins % 60}m — your overtime on this date is only <strong>${maxH > 0 ? maxH + 'h ' : ''}${maxM}m (${otInfo.remainingClaimableMins} mins)</strong>. Values auto-corrected to maximum.
        </div>
      `;
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.style.opacity = '0.5'; btnSubmit.style.cursor = 'not-allowed'; }
      // Re-validate after clamp
      setTimeout(() => this.validateClaimDuration(), 50);
      return;
    }

    // Valid claim!
    const clH = Math.floor(totalClaimedMins / 60);
    const clM = totalClaimedMins % 60;
    const decHours = Math.round((totalClaimedMins / 60) * 100) / 100;
    const maxH2 = Math.floor(otInfo.remainingClaimableMins / 60);
    const maxM2 = otInfo.remainingClaimableMins % 60;
    msgEl.innerHTML = `
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);color:var(--success);border-radius:6px;padding:6px 10px;font-size:11.5px;font-weight:600">
        <i class="fa fa-circle-check" style="margin-right:4px"></i>
        Valid claim: <strong>${clH > 0 ? clH + 'h ' : ''}${clM}m</strong> (${totalClaimedMins} mins ≈ ${decHours} hrs) — within your <strong>${maxH2 > 0 ? maxH2 + 'h ' : ''}${maxM2}m</strong> recorded overtime on this date.
      </div>
    `;
    if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
  },

  setClaimMinutes(mins) {
    const hInput = document.getElementById('ot-claim-hours');
    const mInput = document.getElementById('ot-claim-mins');
    if (hInput && mInput) {
      hInput.value = Math.floor(mins / 60);
      mInput.value = mins % 60;
      this.validateClaimDuration();
    }
  },

  submitClaimOvertimeToken() {
    const empInput = document.getElementById('ot-claim-emp');
    const empId = empInput ? parseInt(empInput.value) : (Auth.employee?.id || 4);
    const date = document.getElementById('ot-claim-date')?.value;
    const hours = parseInt(document.getElementById('ot-claim-hours')?.value) || 0;
    const mins = parseInt(document.getElementById('ot-claim-mins')?.value) || 0;
    const managerId = parseInt(document.getElementById('ot-claim-mgr-id')?.value) || 3;
    const taskDescription = document.getElementById('ot-claim-desc')?.value.trim();

    if (!date) { Toast.show('Please select date overtime was worked', 'error'); return; }

    const claimedMins = (hours * 60) + mins;
    if (claimedMins <= 0) {
      Toast.show('Please specify valid extra hours or minutes worked', 'error');
      return;
    }

    if (!taskDescription || taskDescription.length < 5) {
      Toast.show('Please explain the assigned work or task description (minimum 5 characters)', 'error');
      return;
    }

    const category = document.getElementById('ot-claim-category')?.value || 'overtime';
    const otInfo = this.getAttendanceOvertimeForDate(empId, date);

    // Verify against actual attendance overtime only for standard shift overtime
    if (category === 'overtime') {
      if (!otInfo.found) {
        Toast.show(`No attendance record found for ${Utils.formatDate(date)}. Cannot claim overtime tokens.`, 'error');
        return;
      }

      if (otInfo.recordedOtMins <= 0) {
        Toast.show(`No overtime was recorded on ${Utils.formatDate(date)}. Shift did not exceed 8.0 hours.`, 'error');
        return;
      }

      if (claimedMins > otInfo.remainingClaimableMins) {
        Toast.show(`Cannot apply for ${claimedMins} mins. You only have ${otInfo.remainingClaimableMins} mins of overtime recorded on this date.`, 'error');
        return;
      }
    }

    // 90-day expiry calculation
    const expiry = new Date(date);
    expiry.setDate(expiry.getDate() + 90);
    const expiryDate = expiry.toISOString().split('T')[0];

    const claimedHours = Math.round((claimedMins / 60) * 100) / 100;
    const tokens = DB.get('overtime_tokens') || [];
    const newClaim = {
      id: DB.nextId('overtime_tokens'),
      employeeId: empId,
      date,
      claimType: category,
      hours: claimedHours,
      minutes: claimedMins,
      expiryDate,
      recordedOvertimeMinutes: otInfo.recordedOtMins || claimedMins,
      taskDescription,
      status: 'pending',
      appliedOn: Utils.today(),
      managerId,
      managerApprovedAt: null,
      managerRemarks: ''
    };

    tokens.push(newClaim);
    DB.set('overtime_tokens', tokens);
    const catTitle = category === 'weekend' ? 'Weekend Comp-Off' : (category === 'holiday' ? 'Gazetted Holiday TOIL' : 'Overtime Token');
    DB.log('APPLY', 'Leaves', `Submitted ${catTitle} claim (${claimedHours}h, valid until ${expiryDate}) for ${Utils.getEmpName(empId)} on ${date}`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show(`${catTitle} claim submitted successfully!`, 'success', `Sent to ${Utils.getEmpName(managerId)} for verification (90-day validity).`);
    this.render();
  },

  getApprovedTokensWithBalance(empId) {
    const allTokens = DB.get('overtime_tokens') || [];
    const empTokens = allTokens.filter(t => t.employeeId === empId && t.status === 'approved');
    const availments = (DB.get('token_availments') || []).filter(a => a.employeeId === empId && a.status === 'approved');

    // Track deductions
    const deductions = {};
    empTokens.forEach(t => { deductions[t.id] = Number(t.availedHours) || 0; });

    // Reconcile with token_availments
    availments.forEach(a => {
      if (a.tokenDeductions) {
        Object.entries(a.tokenDeductions).forEach(([tId, hrs]) => {
          deductions[tId] = Math.max(deductions[tId] || 0, Number(hrs) || 0);
        });
      } else if (a.tokenIds && a.tokenIds.length === 1) {
        deductions[a.tokenIds[0]] = Math.max(deductions[a.tokenIds[0]] || 0, Number(a.hours) || 0);
      } else {
        // Legacy FIFO allocation across tokens
        let needed = Number(a.hours) || 0;
        for (const t of empTokens) {
          if (needed <= 0) break;
          const currentDed = deductions[t.id] || 0;
          const cap = Math.max(0, Number(t.hours) - currentDed);
          const take = Math.min(needed, cap);
          deductions[t.id] = currentDed + take;
          needed -= take;
        }
      }
    });

    return empTokens.map(t => {
      const totalHours = Number(t.hours) || 0;
      const totalMins = t.minutes || Math.round(totalHours * 60);
      const availed = deductions[t.id] || 0;
      const remHours = Math.max(0, Math.round((totalHours - availed) * 100) / 100);
      const remMins = Math.round(remHours * 60);
      const mgr = DB.find('employees', t.managerId) || { fullName: 'Usman Baig' };
      return {
        ...t,
        managerName: mgr.fullName,
        totalHours,
        totalMins,
        availedHours: Math.round(availed * 100) / 100,
        remHours,
        remMins
      };
    }).filter(t => t.remHours > 0);
  },

  showAvailTokenModal() {
    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;
    const metrics = this.getEmployeeTokenMetrics(myEmpId);
    const approvedTokens = this.getApprovedTokensWithBalance(myEmpId);
    const allEmpTokens = (DB.get('overtime_tokens') || []).filter(t => t.employeeId === myEmpId);
    const pendingTokens = allEmpTokens.filter(t => t.status === 'pending');
    const rejectedTokens = allEmpTokens.filter(t => t.status === 'rejected');
    const hasPending = pendingTokens.length > 0;
    const hasNoApproved = approvedTokens.length === 0;

    Modal.show('Avail Token as Compensatory Leave', `
      <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:14px">
        <!-- Live Token Balance Header with 3 metrics -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          <div style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(99,102,241,0.08));border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:10.5px;color:var(--success);font-weight:700;margin-bottom:4px">AVAILABLE BALANCE</div>
            <div style="font-size:22px;font-weight:800;color:var(--success)">${metrics.balanceHours}h</div>
            <div style="font-size:11px;color:var(--text-muted)">${metrics.balanceDays} Days</div>
          </div>
          <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.25);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:10.5px;color:#d97706;font-weight:700;margin-bottom:4px">PENDING APPROVAL</div>
            <div style="font-size:22px;font-weight:800;color:#d97706">${pendingTokens.length}</div>
            <div style="font-size:11px;color:var(--text-muted)">Token claims</div>
          </div>
          <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:10.5px;color:var(--primary);font-weight:700;margin-bottom:4px">APPROVED TOKENS</div>
            <div style="font-size:22px;font-weight:800;color:var(--primary)">${approvedTokens.length}</div>
            <div style="font-size:11px;color:var(--text-muted)">With balance</div>
          </div>
        </div>

        ${hasPending ? `
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:8px 12px;font-size:11.5px;color:#b45309;display:flex;align-items:center;gap:8px">
            <i class="fa fa-hourglass-half"></i>
            <span><strong>${pendingTokens.length} pending token claim(s)</strong> are awaiting manager approval and <strong>cannot</strong> be used for compensatory leave until approved.</span>
          </div>
        ` : ''}

        <!-- All Employee Tokens Reference Section -->
        ${allEmpTokens.length > 0 ? `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
          <div style="font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:6px">
            <i class="fa fa-wallet" style="color:var(--primary)"></i> Your Previous Overtime Token History
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;max-height:130px;overflow-y:auto">
            ${allEmpTokens.map(t => {
              const tH = Math.floor((t.minutes || Math.round(t.hours*60)) / 60);
              const tM = (t.minutes || Math.round(t.hours*60)) % 60;
              let statusBadge = '';
              if (t.status === 'approved') {
                const thisApproved = approvedTokens.find(at => at.id === t.id);
                const remH = thisApproved ? Math.floor(thisApproved.remMins / 60) : 0;
                const remM = thisApproved ? thisApproved.remMins % 60 : 0;
                const remBal = thisApproved ? thisApproved.remMins : 0;
                statusBadge = `<span class="badge badge-success" style="font-size:10px;font-weight:700">✓ Approved — ${remBal > 0 ? (remH > 0 ? remH + 'h ' : '') + remM + 'm balance' : 'Fully Availed'}</span>`;
              } else if (t.status === 'pending') {
                statusBadge = `<span class="badge badge-warning" style="font-size:10px">⏳ Pending — Cannot use</span>`;
              } else {
                statusBadge = `<span class="badge badge-danger" style="font-size:10px">✗ Rejected</span>`;
              }
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:var(--card);border-radius:7px;border:1px solid ${t.status === 'approved' ? 'rgba(16,185,129,0.2)' : (t.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.15)')}">
                  <div style="flex:1;min-width:0">
                    <span style="font-weight:700;font-size:12px">Token #${t.id}</span>
                    <span style="font-size:11px;color:var(--text-3);margin:0 6px">${Utils.formatDate(t.date)}</span>
                    <span style="font-size:11px;color:var(--text-2)">${tH > 0 ? tH + 'h ' : ''}${tM}m OT</span>
                  </div>
                  ${statusBadge}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Approved Tokens Selection for Leave -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
            <label class="form-label required" style="font-size:12.5px;font-weight:700;margin-bottom:0">
              <i class="fa fa-list-check" style="color:var(--primary);margin-right:4px"></i>
              Select Token(s) to Redeem Against This Leave
              ${approvedTokens.length > 0 ? `<span style="font-size:11px;font-weight:400;color:var(--text-3)">(${approvedTokens.length} approved token${approvedTokens.length > 1 ? 's' : ''} available)</span>` : ''}
            </label>
            ${approvedTokens.length > 0 ? `
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <button type="button" class="btn btn-ghost btn-xs" style="font-size:10.5px;padding:2px 8px" onclick="Leaves.selectTokensForDuration('all')">Select All</button>
              <button type="button" class="btn btn-ghost btn-xs" style="font-size:10.5px;padding:2px 8px" onclick="Leaves.selectTokensForDuration(0.75)">&gt;45m Short</button>
              <button type="button" class="btn btn-ghost btn-xs" style="font-size:10.5px;padding:2px 8px" onclick="Leaves.selectTokensForDuration(4)">4h Half Day</button>
              <button type="button" class="btn btn-ghost btn-xs" style="font-size:10.5px;padding:2px 8px" onclick="Leaves.selectTokensForDuration(8)">8h Full Day</button>
              <button type="button" class="btn btn-ghost btn-xs" style="font-size:10.5px;padding:2px 8px;color:var(--text-3)" onclick="Leaves.selectTokensForDuration(0)">Clear</button>
            </div>
            ` : ''}
          </div>

          <div id="tk-tokens-list" style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:7px;padding-right:2px">
            ${approvedTokens.length === 0 ? `
              <div style="background:rgba(239,68,68,0.06);border:1px dashed #f87171;border-radius:8px;padding:16px;text-align:center;font-size:12.5px;color:var(--danger)">
                <i class="fa fa-triangle-exclamation" style="font-size:22px;margin-bottom:8px;display:block"></i>
                ${hasPending
                  ? `You have <strong>${pendingTokens.length} pending</strong> overtime token claim(s) that are <strong>not yet approved</strong>. You cannot avail compensatory leave until your manager approves them.`
                  : 'No approved overtime tokens with available balance found. Earn extra overtime hours and get them approved by your manager to avail compensatory leave.'}
              </div>
            ` : approvedTokens.map((t) => `
              <label style="background:var(--card);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:0;transition:all 0.15s ease" class="token-card-label" id="token-card-${t.id}">
                <input type="checkbox" class="avail-token-chk" value="${t.id}" data-id="${t.id}" data-rem-hours="${t.remHours}" data-rem-mins="${t.remMins}" checked onchange="Leaves.onTokenSelectionChange()" style="margin-top:3px;cursor:pointer;width:15px;height:15px">
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px">
                    <div style="display:flex;align-items:center;gap:8px">
                      <span style="font-weight:800;font-size:13px;color:var(--text)">Token #${t.id}</span>
                      <span style="font-size:11px;color:var(--text-3)">${Utils.formatDate(t.date)}</span>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center">
                      <span class="badge badge-secondary" style="font-size:10.5px">Total: ${t.totalHours}h</span>
                      <span class="badge badge-success" style="font-size:11px;font-weight:700">
                        <i class="fa fa-coins"></i> ${t.remHours}h ${t.remMins % 60 > 0 ? (t.remMins % 60) + 'm ' : ''}available
                      </span>
                    </div>
                  </div>
                  <div style="font-size:11.5px;color:var(--text-2);margin-top:3px;line-height:1.35">
                    <i class="fa fa-briefcase" style="color:var(--text-3)"></i> ${t.taskDescription}
                  </div>
                  <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">
                    <i class="fa fa-user-check"></i> Approved by ${t.managerName}
                    ${t.availedHours > 0 ? `• <span style="color:#b45309">${t.availedHours}h already availed</span>` : ''}
                  </div>
                </div>
              </label>
            `).join('')}
          </div>

          <!-- Selection Aggregate Strip -->
          <div id="tk-selected-summary" style="margin-top:10px;background:var(--surface-2);border-radius:7px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;font-size:11.5px;flex-wrap:wrap;gap:6px">
            <div>
              Selected Token Time: <strong id="tk-selected-total" style="color:var(--primary);font-size:13px">0 Hours (0 mins)</strong>
            </div>
            <div id="tk-eligible-badges" style="display:flex;gap:4px;flex-wrap:wrap"></div>
          </div>
        </div>

        <div class="form-row form-row-2" style="margin-bottom:0">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-calendar-day" style="color:var(--primary);margin-right:4px"></i> Date of Leave</label>
            <input type="date" class="form-control" id="tk-avail-date" value="${Utils.today()}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-layer-group" style="color:var(--primary);margin-right:4px"></i> Avail Leave As</label>
            <select class="form-control" id="tk-avail-type" onchange="Leaves.onAvailTypeChange(this.value)">
              <option value="short" selected>Short Leave (min 45 mins)</option>
              <option value="half" id="opt-half-leave">Half Day Leave (4.0 Hours = 240 mins)</option>
              <option value="full" id="opt-full-leave">Full Day Leave (8.0 Hours = 480 mins)</option>
            </select>
          </div>
        </div>

        <!-- Short Leave Duration Configuration (Strictly Minimum 45 min) -->
        <div id="tk-short-section" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
          <label class="form-label required" style="font-size:12.5px;font-weight:700">
            <i class="fa fa-stopwatch" style="color:var(--primary);margin-right:4px"></i> Short Leave Duration
          </label>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <select class="form-control" id="tk-short-preset" style="flex:1" onchange="document.getElementById('tk-avail-mins').value=this.value; Leaves.updateAvailLiveCalculation()">
              <option value="45" selected>45 Minutes — Policy Minimum</option>
              <option value="60">60 Minutes (1 hr)</option>
              <option value="90">90 Minutes (1.5 hrs)</option>
              <option value="120">120 Minutes (2 hrs)</option>
            </select>
            <div style="display:flex;align-items:center;gap:6px">
              <input type="number" id="tk-avail-mins" class="form-control" style="width:90px" value="45" min="45" max="479" step="5" oninput="Leaves.updateAvailLiveCalculation()">
              <span style="font-size:12px;font-weight:600;color:var(--text-3)">mins</span>
            </div>
          </div>
          <div style="font-size:11px;color:#d97706;font-weight:600;margin-top:6px">
            <i class="fa fa-circle-info"></i> Policy: Minimum 45 mins. Max 479 mins (use Half/Full Day for ≥4h).
          </div>
        </div>

        <!-- Live Calculation Preview Card -->
        <div id="tk-calc-preview" style="background:var(--surface-2);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:6px;font-size:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <div>
              Leave Requested: <strong id="tk-calc-hrs" style="color:var(--primary);font-size:13px">0.75 Hours (45 mins)</strong>
            </div>
            <div id="tk-calc-rem" style="color:var(--text-3)">Selected Token Time: <strong style="color:var(--success)">0 hrs</strong></div>
          </div>
          <div id="tk-coverage-status" style="font-size:11.5px"></div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label required"><i class="fa fa-comment-dots" style="color:var(--primary);margin-right:4px"></i> Reason for Token Leave</label>
          <textarea class="form-control" id="tk-avail-reason" rows="2" placeholder="e.g. Urgent banking errand, personal doctor visit, family obligation..."></textarea>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-success" id="tk-submit-btn" ${hasNoApproved ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''} onclick="Leaves.submitAvailToken()">
          <i class="fa fa-check"></i> Avail Token Leave
        </button>
      `
    });

    setTimeout(() => {
      this.onTokenSelectionChange();
    }, 50);
  },

  selectTokensForDuration(targetHours) {
    const checkboxes = Array.from(document.querySelectorAll('.avail-token-chk'));
    if (!checkboxes.length) return;

    if (targetHours === 'all') {
      checkboxes.forEach(chk => { chk.checked = true; });
    } else if (targetHours === 0) {
      checkboxes.forEach(chk => { chk.checked = false; });
    } else {
      let accumulatedHours = 0;
      checkboxes.forEach(chk => {
        const hrs = parseFloat(chk.getAttribute('data-rem-hours') || 0);
        if (accumulatedHours < targetHours) {
          chk.checked = true;
          accumulatedHours += hrs;
        } else {
          chk.checked = false;
        }
      });
      const typeSelect = document.getElementById('tk-avail-type');
      if (typeSelect) {
        if (targetHours === 4) typeSelect.value = 'half';
        else if (targetHours === 8) typeSelect.value = 'full';
        this.onAvailTypeChange(typeSelect.value);
      }
    }
    this.onTokenSelectionChange();
  },

  onTokenSelectionChange() {
    const checkboxes = Array.from(document.querySelectorAll('.avail-token-chk:checked'));
    let totalMins = 0;
    checkboxes.forEach(chk => {
      const mins = parseInt(chk.getAttribute('data-rem-mins')) || 0;
      totalMins += mins;
    });

    const totalHours = Math.round((totalMins / 60) * 100) / 100;
    const disp = document.getElementById('tk-selected-total');
    if (disp) {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      disp.innerHTML = `${totalHours} Hours (${h > 0 ? h + 'h ' : ''}${m} mins) <span style="font-size:11px;font-weight:400;color:var(--text-3)">[${checkboxes.length} token(s) selected]</span>`;
    }

    // Update eligible badges
    const badgesEl = document.getElementById('tk-eligible-badges');
    if (badgesEl) {
      const badges = [];
      if (totalHours >= 8.0) {
        badges.push(`<span class="badge badge-success" style="font-size:10px"><i class="fa fa-check"></i> Full Day (8h)</span>`);
      }
      if (totalHours >= 4.0) {
        badges.push(`<span class="badge badge-info" style="font-size:10px"><i class="fa fa-check"></i> Half Day (4h)</span>`);
      }
      if (totalMins >= 45) {
        badges.push(`<span class="badge badge-primary" style="font-size:10px"><i class="fa fa-check"></i> Short Leave (45m+)</span>`);
      } else {
        badges.push(`<span class="badge badge-warning" style="font-size:10px"><i class="fa fa-triangle-exclamation"></i> Min 45m Needed</span>`);
      }
      badgesEl.innerHTML = badges.join('');
    }

    // Highlight selected cards
    document.querySelectorAll('.avail-token-chk').forEach(chk => {
      const card = document.getElementById(`token-card-${chk.value}`);
      if (card) {
        if (chk.checked) {
          card.style.borderColor = 'var(--primary)';
          card.style.background = 'rgba(99,102,241,0.06)';
        } else {
          card.style.borderColor = 'var(--border)';
          card.style.background = 'var(--card)';
        }
      }
    });

    this.updateAvailLiveCalculation();
  },

  onAvailTypeChange(type) {
    const shortSec = document.getElementById('tk-short-section');
    if (shortSec) {
      shortSec.style.display = type === 'short' ? 'block' : 'none';
    }
    this.updateAvailLiveCalculation();
  },

  updateAvailLiveCalculation() {
    const type = document.getElementById('tk-avail-type')?.value || 'short';
    const checkboxes = Array.from(document.querySelectorAll('.avail-token-chk:checked'));
    let selectedMins = 0;
    checkboxes.forEach(chk => {
      selectedMins += parseInt(chk.getAttribute('data-rem-mins')) || 0;
    });
    const selectedHours = Math.round((selectedMins / 60) * 100) / 100;

    let reqHours = 0.75;
    let reqMins = 45;
    let typeLabel = 'Short Leave';

    if (type === 'short') {
      reqMins = parseInt(document.getElementById('tk-avail-mins')?.value) || 45;
      reqHours = Math.round((reqMins / 60) * 100) / 100;
      typeLabel = `Short Leave (${reqMins}m)`;
    } else if (type === 'half') {
      reqHours = 4.0;
      reqMins = 240;
      typeLabel = 'Half Day Leave (4.0h)';
    } else if (type === 'full') {
      reqHours = 8.0;
      reqMins = 480;
      typeLabel = 'Full Day Leave (8.0h)';
    }

    const hrsEl = document.getElementById('tk-calc-hrs');
    const remEl = document.getElementById('tk-calc-rem');
    const statusEl = document.getElementById('tk-coverage-status');
    const btn = document.getElementById('tk-submit-btn');

    if (hrsEl) {
      hrsEl.textContent = `${reqHours} Hours (${reqMins} mins)`;
    }

    if (!checkboxes.length) {
      if (remEl) remEl.innerHTML = `<span style="color:var(--danger);font-weight:700">No Tokens Selected</span>`;
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);font-weight:600"><i class="fa fa-circle-xmark"></i> Please select at least one approved token from the list above.</span>`;
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; }
      return;
    }

    const diffMins = selectedMins - reqMins;

    if (type === 'short' && reqMins < 45) {
      if (remEl) remEl.innerHTML = `<span style="color:var(--danger);font-weight:700">Minimum 45m required</span>`;
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);font-weight:600"><i class="fa fa-circle-xmark"></i> System Rule: Short Leave requires a minimum of 45 minutes.</span>`;
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; }
      return;
    }

    if (diffMins < 0) {
      const shortageMins = Math.abs(diffMins);
      if (remEl) remEl.innerHTML = `<span style="color:var(--danger);font-weight:700"><i class="fa fa-circle-exclamation"></i> Short by ${shortageMins}m</span>`;
      if (statusEl) statusEl.innerHTML = `
        <div style="background:#fef2f2;border:1px solid #f87171;color:#991b1b;border-radius:6px;padding:6px 10px;font-weight:600">
          <i class="fa fa-circle-xmark" style="margin-right:4px"></i>
          Selected time (${selectedMins}m) is less than requested ${typeLabel} (${reqMins}m). Please select more tokens (need ${shortageMins}m more).
        </div>
      `;
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; }
    } else {
      const surplusMins = diffMins;
      if (remEl) remEl.innerHTML = `Remaining: <strong style="color:var(--success)">${surplusMins} mins</strong>`;
      if (statusEl) statusEl.innerHTML = `
        <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);color:var(--success);border-radius:6px;padding:6px 10px;font-weight:600">
          <i class="fa fa-circle-check" style="margin-right:4px"></i>
          Selected tokens (${selectedMins}m) successfully cover requested ${typeLabel} (${reqMins}m).
        </div>
      `;
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
    }
  },

  submitAvailToken() {
    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;

    const date = document.getElementById('tk-avail-date')?.value;
    const type = document.getElementById('tk-avail-type')?.value;
    const reason = document.getElementById('tk-avail-reason')?.value.trim();

    if (!date) { Toast.show('Please select date of leave', 'error'); return; }
    if (!reason) { Toast.show('Please provide a reason for availing token leave', 'error'); return; }

    const checkboxes = Array.from(document.querySelectorAll('.avail-token-chk:checked'));
    if (!checkboxes.length) {
      Toast.show('Please select at least one approved token to redeem for this leave', 'error');
      return;
    }

    let reqHours = 0.75;
    let reqMins = 45;

    if (type === 'short') {
      reqMins = parseInt(document.getElementById('tk-avail-mins')?.value) || 0;
      if (reqMins < 45) {
        Toast.show('Minimum duration to avail an overtime token is 45 minutes.', 'error');
        return;
      }
      reqHours = Math.round((reqMins / 60) * 100) / 100;
    } else if (type === 'half') {
      reqHours = 4.0;
      reqMins = 240;
    } else if (type === 'full') {
      reqHours = 8.0;
      reqMins = 480;
    }

    // Verify all selected tokens exist and are strictly APPROVED
    const allTokens = DB.get('overtime_tokens') || [];
    let totalSelectedMins = 0;

    for (const chk of checkboxes) {
      const tId = parseInt(chk.value);
      const token = allTokens.find(t => t.id === tId);
      if (!token) {
        Toast.show(`Selected token #${tId} was not found.`, 'error');
        return;
      }
      if (token.status !== 'approved') {
        Toast.show(`Token #${tId} is not approved (${token.status}). Only approved tokens can be availed.`, 'error');
        return;
      }
      totalSelectedMins += parseInt(chk.getAttribute('data-rem-mins')) || 0;
    }

    const totalSelectedHours = Math.round((totalSelectedMins / 60) * 100) / 100;
    if (reqHours > totalSelectedHours) {
      Toast.show(`Insufficient selected token time! Selected: ${totalSelectedHours}h, Needed: ${reqHours}h`, 'error');
      return;
    }

    // Deduct requested hours across the selected tokens
    let needed = reqHours;
    const tokenDeductions = {};
    const selectedTokenIds = [];
    const tokenSummaries = [];

    for (const chk of checkboxes) {
      if (needed <= 0) break;
      const tId = parseInt(chk.value);
      const tRemHours = parseFloat(chk.getAttribute('data-rem-hours') || 0);
      const token = allTokens.find(t => t.id === tId);
      if (!token || tRemHours <= 0) continue;

      selectedTokenIds.push(tId);
      const take = Math.min(needed, tRemHours);
      const takeRounded = Math.round(take * 100) / 100;
      tokenDeductions[tId] = takeRounded;
      tokenSummaries.push(`Token #${tId} (${takeRounded}h from ${Utils.formatDate(token.date)})`);

      // Update token's availed hours in database
      const prevAvailed = Number(token.availedHours) || 0;
      const newAvailed = Math.round((prevAvailed + takeRounded) * 100) / 100;
      token.availedHours = newAvailed;
      token.availedMinutes = Math.round(newAvailed * 60);

      needed = Math.round((needed - takeRounded) * 100) / 100;
    }

    DB.set('overtime_tokens', allTokens);

    // Save in token_availments
    const availments = DB.get('token_availments') || [];
    const newAvail = {
      id: DB.nextId('token_availments'),
      employeeId: myEmpId,
      date,
      leaveDuration: type,
      minutes: reqMins,
      hours: reqHours,
      days: Math.round((reqHours / 8) * 100) / 100,
      tokenIds: selectedTokenIds,
      tokenDeductions,
      tokenSummary: tokenSummaries.join(', '),
      reason,
      status: 'approved',
      appliedOn: new Date().toISOString()
    };
    availments.push(newAvail);
    DB.set('token_availments', availments);

    // Also insert into leave_requests as Compensatory Leave (Type 7) to integrate seamlessly with calendar
    const leaves = DB.get('leave_requests') || [];
    const typeName = type === 'short' ? `Short Leave (${reqMins}m)` : (type === 'half' ? 'Half Day Leave (4h)' : 'Full Day Leave (8h)');
    const newLeaveReq = {
      id: DB.nextId('leave_requests'),
      employeeId: myEmpId,
      typeId: 7, // Compensatory Leave
      quotaTypeId: 7,
      quotaName: 'Compensatory Leave',
      from: date,
      to: date,
      fromDate: date,
      toDate: date,
      leaveDuration: type === 'short' ? 'short' : (type === 'half' ? 'half_first' : 'full'),
      days: Math.round((reqHours / 8) * 100) / 100,
      status: 'approved',
      managerStatus: 'approved',
      hrStatus: 'approved',
      reason: `[Overtime Token Availment: ${typeName}] ${reason} (Redeemed: ${tokenSummaries.join(', ')})`,
      appliedOn: Utils.today(),
      remarks: `Availed from approved overtime token(s): ${tokenSummaries.join(', ')}`
    };
    leaves.push(newLeaveReq);
    DB.set('leave_requests', leaves);

    DB.log('APPLY', 'Leaves', `Availed ${reqHours}h (${type}) Overtime Token Leave for ${myEmp.fullName} on ${date} (Tokens: ${selectedTokenIds.join(', ')})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Compensatory token leave applied successfully! Deducted ${reqHours}h across selected token(s).`, 'success');
    this.render();
  },

  approveOvertimeToken(tokenId) {
    if (!Auth.can('leaves.approve')) {
      Toast.show('Permission denied: You do not have permission to approve overtime tokens.', 'error');
      return;
    }
    const tokens = DB.get('overtime_tokens') || [];
    const token = tokens.find(t => t.id === tokenId);
    if (!token) { Toast.show('Token not found', 'error'); return; }

    const emp = DB.find('employees', token.employeeId);
    Modal.confirm('Approve Overtime Token Claim', `
      Are you sure you want to approve this overtime token claim for <strong>${emp?.fullName || 'Employee'}</strong>?
      <div style="background:var(--surface);border-radius:8px;padding:12px;margin-top:10px;font-size:12px;line-height:1.5">
        <div>Date: <strong>${Utils.formatDate(token.date)}</strong></div>
        <div>Extra Hours: <strong style="color:var(--primary)">${token.hours} hrs</strong></div>
        <div>Task / Assigned Work: <em>"${token.taskDescription}"</em></div>
      </div>
      <div class="form-group" style="margin-top:12px;margin-bottom:0">
        <label class="form-label">Manager Approval Remarks</label>
        <input type="text" id="ot-appr-remarks" class="form-control" value="Verified assigned work. Approved ${token.hours}h Overtime Token." placeholder="Approval note...">
      </div>
    `, () => {
      const remarks = document.getElementById('ot-appr-remarks')?.value.trim() || 'Approved by reporting manager';
      token.status = 'approved';
      token.managerApprovedAt = new Date().toISOString();
      token.managerRemarks = remarks;
      DB.set('overtime_tokens', tokens);
      DB.log('APPROVE', 'Leaves', `Manager approved ${token.hours}h Overtime Token for ${emp?.fullName}`, Auth.user?.id);
      Modal.close('dynamic-modal');
      Toast.show(`Approved ${token.hours}h Overtime Token! Banked into employee token balance.`, 'success');
      this.render();
    });
  },

  rejectOvertimeToken(tokenId) {
    if (!Auth.can('leaves.approve')) {
      Toast.show('Permission denied: You do not have permission to reject overtime tokens.', 'error');
      return;
    }
    const tokens = DB.get('overtime_tokens') || [];
    const token = tokens.find(t => t.id === tokenId);
    if (!token) { Toast.show('Token not found', 'error'); return; }

    const emp = DB.find('employees', token.employeeId);
    Modal.confirm('Reject Overtime Token Claim', `
      Are you sure you want to reject this overtime claim for <strong>${emp?.fullName || 'Employee'}</strong>?
      <div class="form-group" style="margin-top:12px;margin-bottom:0">
        <label class="form-label required">Reason for Rejection</label>
        <input type="text" id="ot-rej-remarks" class="form-control" placeholder="Explain why extra time cannot be approved (e.g. unassigned work, exceeded authorized scope)...">
      </div>
    `, () => {
      const remarks = document.getElementById('ot-rej-remarks')?.value.trim() || 'Rejected by reporting manager';
      token.status = 'rejected';
      token.managerRemarks = remarks;
      DB.set('overtime_tokens', tokens);
      DB.log('REJECT', 'Leaves', `Manager rejected Overtime Token for ${emp?.fullName}: ${remarks}`, Auth.user?.id);
      Modal.close('dynamic-modal');
      Toast.show('Overtime token claim rejected.', 'info');
      this.render();
    });
  },

  // ============================================================
  // LEAVE ENCASHMENT MODULE — Statutory Annual Leave Liquidation
  // Formula: (Base Salary / 30) * Encashed Days
  // Retention Rule: Minimum 10 Days Annual Leave preserved
  // Scheduled directly in payroll run upon approval
  // ============================================================
  renderLeaveEncashment(container) {
    if (!container) return;
    const encashments = DB.get('leave_encashments') || [];
    const isHRorAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
    const myEmpId = Auth.employee?.id;

    const displayList = encashments.filter(e => {
      if (Auth.role === 'employee') return e.employeeId === myEmpId;
      if (Auth.role === 'dept_manager') {
        const teamIds = this.getScopedEmployees().map(emp => emp.id);
        return teamIds.includes(e.employeeId) || e.employeeId === myEmpId;
      }
      return true;
    });

    const pendingCount = encashments.filter(e => e.status === 'pending').length;
    const approvedCount = encashments.filter(e => e.status === 'approved').length;
    const totalPayoutAmount = encashments
      .filter(e => e.status === 'approved')
      .reduce((s, e) => s + (Number(e.totalPayout) || 0), 0);

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Statutory Policy Banner Card -->
        <div class="card" style="padding:18px 22px;margin-bottom:20px;background:linear-gradient(135deg,rgba(16,185,129,0.08) 0%,rgba(99,102,241,0.06) 100%);border:1.5px solid rgba(16,185,129,0.3);border-radius:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);color:white;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 14px rgba(16,185,129,0.3)">
                <i class="fa fa-hand-holding-dollar"></i>
              </div>
              <div>
                <h3 style="font-size:17px;font-weight:800;color:var(--text);margin:0;letter-spacing:-0.3px">
                  Statutory Leave Encashment &amp; Liquidation Module
                </h3>
                <p style="font-size:12px;color:var(--text-3);margin:3px 0 0">
                  Encashes surplus earned <strong>Annual Leaves</strong>. Formula: <code>(Base Salary / 30) × Encashed Days</code>. Mandatory reserve: <strong>10 days</strong> must remain retained. Approved payouts are scheduled directly into monthly payroll.
                </p>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${Auth.can('leaves.create') ? `
                <button class="btn btn-primary" onclick="Leaves.showApplyLeaveEncashmentModal()">
                  <i class="fa fa-plus-circle"></i> Apply Leave Encashment
                </button>
              ` : ''}
              ${Auth.can('leaves.edit') ? `
                <button class="btn btn-outline" onclick="Leaves.showBulkEncashmentModal()">
                  <i class="fa fa-users-gear"></i> Annual Bulk Encashment Run
                </button>
                <button class="btn btn-secondary" onclick="Leaves.showYearEndCarryForwardModal()" style="font-weight:700">
                  <i class="fa fa-calendar-check"></i> Fiscal Year-End Carry-Forward Engine
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #10b981">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase">Total Encashed Payout</span>
              <i class="fa fa-money-bill-wave" style="font-size:18px;color:#10b981"></i>
            </div>
            <div style="font-size:24px;font-weight:800;color:#10b981;margin:8px 0 2px">${Utils.formatCurrency(totalPayoutAmount)}</div>
            <div style="font-size:11px;color:var(--text-muted)">Approved corporate encashment disbursed</div>
          </div>

          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #f59e0b">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase">Pending Approvals</span>
              <i class="fa fa-clock" style="font-size:18px;color:#f59e0b"></i>
            </div>
            <div style="font-size:24px;font-weight:800;color:#f59e0b;margin:8px 0 2px">${pendingCount}</div>
            <div style="font-size:11px;color:var(--text-muted)">Awaiting HR &amp; management review</div>
          </div>

          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #6366f1">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase">Approved &amp; Scheduled</span>
              <i class="fa fa-circle-check" style="font-size:18px;color:#6366f1"></i>
            </div>
            <div style="font-size:24px;font-weight:800;color:#6366f1;margin:8px 0 2px">${approvedCount}</div>
            <div style="font-size:11px;color:var(--text-muted)">Ready for inclusion in monthly payroll</div>
          </div>

          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid #8b5cf6">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase">Statutory Reserve Rule</span>
              <i class="fa fa-shield-halved" style="font-size:18px;color:#8b5cf6"></i>
            </div>
            <div style="font-size:24px;font-weight:800;color:#8b5cf6;margin:8px 0 2px">10 <span style="font-size:14px;font-weight:600">Days</span></div>
            <div style="font-size:11px;color:var(--text-muted)">Mandatory retained Annual leave buffer</div>
          </div>
        </div>

        <!-- Encashment Applications Ledger -->
        <div class="card" style="padding:0">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <div style="font-weight:800;font-size:15px;color:var(--text)">
                <i class="fa fa-list-ol" style="color:var(--primary);margin-right:6px"></i>
                Leave Encashment Claims &amp; Payroll Schedule Ledger
              </div>
              <div style="font-size:12px;color:var(--text-3)">
                Detailed breakdown of leave encashments, per-day rates, retained balances, and settlement statuses
              </div>
            </div>
            <div style="display:flex;gap:8px">
              ${Auth.can('leaves.create') ? `
                <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyLeaveEncashmentModal()">
                  <i class="fa fa-plus"></i> New Application
                </button>
              ` : ''}
            </div>
          </div>

          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Encashment ID</th>
                  <th>Employee</th>
                  <th>Year</th>
                  <th>Total Balance</th>
                  <th>Retained</th>
                  <th>Encashed Days</th>
                  <th>Daily Rate</th>
                  <th>Total Payout</th>
                  <th>Status</th>
                  <th>Payroll Month</th>
                  <th style="text-align:center">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${displayList.length === 0 ? `
                  <tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted)">No leave encashment applications recorded yet.</td></tr>
                ` : displayList.map(e => {
                  const emp = DB.find('employees', e.employeeId);
                  const dept = DB.find('departments', emp?.departmentId);
                  const isPending = e.status === 'pending';
                  const isApproved = e.status === 'approved';

                  let statusBadge = '<span class="badge badge-warning"><i class="fa fa-clock"></i> Pending HR</span>';
                  if (isApproved) statusBadge = '<span class="badge badge-success"><i class="fa fa-check-circle"></i> Approved</span>';
                  else if (e.status === 'rejected') statusBadge = '<span class="badge badge-danger"><i class="fa fa-times-circle"></i> Rejected</span>';

                  let payrollBadge = '<span class="badge badge-neutral">Not Scheduled</span>';
                  if (e.payoutStatus === 'scheduled_in_payroll') payrollBadge = `<span class="badge badge-primary"><i class="fa fa-calendar-check"></i> ${e.payrollMonth || 'Next Cycle'}</span>`;
                  else if (e.payoutStatus === 'paid') payrollBadge = '<span class="badge badge-success"><i class="fa fa-check-double"></i> Paid</span>';

                  return `
                    <tr>
                      <td style="font-weight:700;font-family:monospace;color:var(--primary)">#ENC-${e.id.toString().padStart(4, '0')}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:10px">
                          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.employeeId)}">${Utils.avatarInitials(emp?.fullName||'?')}</div>
                          <div>
                            <div style="font-weight:700;font-size:13px">${emp?.fullName || 'Employee #' + e.employeeId}</div>
                            <div style="font-size:11px;color:var(--text-3)">${emp?.empNo} • ${dept?.name || 'Department'}</div>
                          </div>
                        </div>
                      </td>
                      <td style="font-weight:600">${e.year || 2026}</td>
                      <td><span style="font-weight:600">${e.availableBalance}d</span></td>
                      <td><span class="badge badge-neutral" style="font-size:11px">${e.retainedBalance || 10}d Retained</span></td>
                      <td><span class="badge badge-primary" style="font-weight:800;font-size:12px">${e.encashedDays} Days</span></td>
                      <td style="font-size:12px">${Utils.formatCurrency(e.perDayRate)}/d</td>
                      <td style="font-weight:800;font-size:13px;color:var(--success)">${Utils.formatCurrency(e.totalPayout)}</td>
                      <td>${statusBadge}</td>
                      <td>${payrollBadge}</td>
                      <td style="text-align:center;white-space:nowrap">
                        <button class="btn btn-outline btn-xs" style="margin-right:4px" onclick="Leaves.showEncashmentSlipModal(${e.id})" title="View / Print Encashment Certificate">
                          <i class="fa fa-file-invoice-dollar"></i> Slip
                        </button>
                        ${Auth.can('leaves.approve') && isPending ? `
                          <button class="btn btn-success btn-xs" style="margin-right:4px" onclick="Leaves.approveLeaveEncashment(${e.id})" title="Approve & Schedule for Payroll">
                            <i class="fa fa-check"></i>
                          </button>
                          <button class="btn btn-danger btn-xs" onclick="Leaves.rejectLeaveEncashment(${e.id})" title="Reject Encashment">
                            <i class="fa fa-times"></i>
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
      </div>
    `;
  },

  showApplyLeaveEncashmentModal(prefillEmpId) {
    if (!Auth.can('leaves.create')) {
      Toast.show('Permission denied: You do not have permission to apply for leave encashment.', 'error');
      return;
    }
    const allEmps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const myEmpId = Auth.employee?.id || 1;
    const isHRorAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);
    const selectedEmpId = prefillEmpId ? Number(prefillEmpId) : (isHRorAdmin ? allEmps[0]?.id : myEmpId);

    Modal.show('Apply for Leave Encashment', `
      <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:14px">
        <div style="background:linear-gradient(135deg,rgba(16,185,129,0.1),rgba(99,102,241,0.08));border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:12px 14px">
          <div style="font-size:13px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
            <i class="fa fa-hand-holding-dollar" style="color:var(--success)"></i> Statutory Leave Encashment Policy
          </div>
          <div style="font-size:11.5px;color:var(--text-2);margin-top:4px;line-height:1.4">
            Employees can encash surplus <strong>Annual Leaves</strong> in excess of the mandatory <strong>10-day retention reserve</strong>. Rate: <code>(Base Monthly Salary / 30) × Days</code>.
          </div>
        </div>

        ${isHRorAdmin ? `
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required">Select Employee</label>
            <select class="form-control" id="enc-emp-id" onchange="Leaves.updateEncashmentCalculationModal()">
              ${allEmps.map(e => `<option value="${e.id}" ${e.id === selectedEmpId ? 'selected' : ''}>${e.fullName} (${e.empNo}) — Salary: ${Utils.formatCurrency(e.salary || e.basicSalary || 50000)}</option>`).join('')}
            </select>
          </div>
        ` : `
          <input type="hidden" id="enc-emp-id" value="${myEmpId}">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:12px">
            <div class="avatar avatar-sm" style="background:${Utils.avatarColor(myEmpId)}">${Utils.avatarInitials(Auth.employee?.fullName||'Me')}</div>
            <div>
              <div style="font-weight:700;font-size:13px">${Auth.employee?.fullName} (${Auth.employee?.empNo})</div>
              <div style="font-size:11.5px;color:var(--text-3)">Base Salary: <strong>${Utils.formatCurrency(Auth.employee?.salary || 50000)}</strong></div>
            </div>
          </div>
        `}

        <!-- Dynamic Calculation Box -->
        <div id="enc-calc-box" style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px"></div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Notes / Reason for Encashment</label>
          <textarea class="form-control" id="enc-notes" rows="2" placeholder="Optional notes (e.g. Annual balance clearance, emergency funding request)...">Annual surplus earned leave balance liquidation</textarea>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-encashment" onclick="Leaves.submitLeaveEncashment()"><i class="fa fa-check"></i> Submit Encashment Claim</button>
      `
    });

    setTimeout(() => this.updateEncashmentCalculationModal(), 40);
  },

  updateEncashmentCalculationModal() {
    const empId = Number(document.getElementById('enc-emp-id')?.value);
    const box = document.getElementById('enc-calc-box');
    const submitBtn = document.getElementById('btn-submit-encashment');
    if (!box || !empId) return;

    const emp = DB.find('employees', empId);
    const balances = DB.get('leave_balances') || [];
    const bal = balances.find(b => b.employeeId === empId && b.leaveTypeId === 1) || { allocated: 20, used: 2, balance: 18 };
    const currentBalance = bal.balance !== undefined ? bal.balance : 15;
    const baseSalary = Number(emp?.salary || emp?.basicSalary || 60000);
    const perDayRate = Math.round(baseSalary / 30);
    const mandatoryReserve = 10;
    const maxEncashable = Math.max(0, currentBalance - mandatoryReserve);

    let daysInputVal = Number(document.getElementById('enc-days-input')?.value);
    if (!daysInputVal || daysInputVal > maxEncashable) daysInputVal = maxEncashable;
    if (daysInputVal < 1 && maxEncashable > 0) daysInputVal = 1;

    const retainedRemaining = currentBalance - (maxEncashable > 0 ? daysInputVal : 0);
    const totalPayout = daysInputVal * perDayRate;

    if (maxEncashable <= 0) {
      if (submitBtn) submitBtn.disabled = true;
      box.innerHTML = `
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:12px;color:var(--danger);font-size:12.5px;line-height:1.5">
          <i class="fa fa-circle-exclamation" style="margin-right:6px"></i>
          <strong>Ineligible for Leave Encashment:</strong>
          Current Annual Leave balance is <strong>${currentBalance} days</strong>. Under corporate policy, a minimum of <strong>${mandatoryReserve} days</strong> must be retained. No surplus leave days are available for encashment.
        </div>
      `;
      return;
    }

    if (submitBtn) submitBtn.disabled = false;

    box.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
          <div style="font-size:11px;color:var(--text-3)">Current Annual Balance</div>
          <div style="font-size:18px;font-weight:800;color:var(--text);margin-top:2px">${currentBalance} Days</div>
        </div>
        <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
          <div style="font-size:11px;color:var(--text-3)">Statutory Reserve</div>
          <div style="font-size:18px;font-weight:800;color:var(--primary);margin-top:2px">${mandatoryReserve} Days</div>
        </div>
        <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
          <div style="font-size:11px;color:var(--text-3)">Max Encashable</div>
          <div style="font-size:18px;font-weight:800;color:var(--success);margin-top:2px">${maxEncashable} Days</div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:10px">
        <label class="form-label required" style="display:flex;justify-content:space-between">
          <span>Number of Days to Encash</span>
          <span style="font-size:11.5px;color:var(--text-3)">Max: <strong>${maxEncashable} days</strong></span>
        </label>
        <div style="display:flex;gap:10px;align-items:center">
          <input type="number" class="form-control" id="enc-days-input" min="1" max="${maxEncashable}" value="${daysInputVal}" oninput="Leaves.onEncashDaysChange(${currentBalance}, ${perDayRate}, ${maxEncashable})" style="font-size:15px;font-weight:700">
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('enc-days-input').value = ${maxEncashable}; Leaves.onEncashDaysChange(${currentBalance}, ${perDayRate}, ${maxEncashable});">Max (${maxEncashable}d)</button>
        </div>
      </div>

      <div style="background:var(--surface-2);border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:11px;color:var(--text-3)">Formula: (${Utils.formatCurrency(baseSalary)} ÷ 30) × <span id="enc-calc-days-label">${daysInputVal}</span> days</div>
          <div style="font-size:11.5px;margin-top:2px">Retained balance after encashment: <strong id="enc-calc-retained-label">${retainedRemaining}</strong> days</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-3)">Total Payout Amount</div>
          <div id="enc-calc-payout-label" style="font-size:20px;font-weight:800;color:var(--success)">${Utils.formatCurrency(totalPayout)}</div>
        </div>
      </div>
    `;
  },

  onEncashDaysChange(currentBalance, perDayRate, maxEncashable) {
    const input = document.getElementById('enc-days-input');
    let val = Number(input?.value) || 0;
    if (val > maxEncashable) val = maxEncashable;
    if (val < 1) val = 1;
    input.value = val;

    const payout = val * perDayRate;
    const retained = currentBalance - val;

    const daysLabel = document.getElementById('enc-calc-days-label');
    const retainedLabel = document.getElementById('enc-calc-retained-label');
    const payoutLabel = document.getElementById('enc-calc-payout-label');

    if (daysLabel) daysLabel.textContent = val;
    if (retainedLabel) retainedLabel.textContent = retained;
    if (payoutLabel) payoutLabel.textContent = Utils.formatCurrency(payout);
  },

  submitLeaveEncashment() {
    const empId = Number(document.getElementById('enc-emp-id')?.value);
    const days = Number(document.getElementById('enc-days-input')?.value);
    const notes = document.getElementById('enc-notes')?.value.trim();

    if (!empId || !days || days <= 0) {
      Toast.show('Please enter a valid number of days to encash', 'error');
      return;
    }

    const emp = DB.find('employees', empId);
    const balances = DB.get('leave_balances') || [];
    const bal = balances.find(b => b.employeeId === empId && b.leaveTypeId === 1) || { balance: 18 };
    const currentBalance = bal.balance !== undefined ? bal.balance : 15;
    const baseSalary = Number(emp?.salary || emp?.basicSalary || 60000);
    const perDayRate = Math.round(baseSalary / 30);
    const totalPayout = days * perDayRate;

    const encashments = DB.get('leave_encashments') || [];
    const isHRorAdmin = ['superadmin', 'hr_manager'].includes(Auth.role);

    const newEnc = {
      id: DB.nextId('leave_encashments'),
      employeeId: empId,
      year: new Date().getFullYear(),
      leaveTypeId: 1, // Annual
      availableBalance: currentBalance,
      retainedBalance: currentBalance - days,
      encashedDays: days,
      perDayRate: perDayRate,
      totalPayout: totalPayout,
      requestDate: Utils.today(),
      status: isHRorAdmin ? 'approved' : 'pending',
      approvedBy: isHRorAdmin ? (Auth.user?.name || 'HR Admin') : null,
      approvedAt: isHRorAdmin ? new Date().toISOString() : null,
      payoutStatus: isHRorAdmin ? 'scheduled_in_payroll' : 'pending_approval',
      payrollMonth: isHRorAdmin ? new Date().toISOString().slice(0, 7) : null,
      notes: notes || 'Surplus annual leave liquidation'
    };

    encashments.unshift(newEnc);
    DB.set('leave_encashments', encashments);

    if (isHRorAdmin) {
      if (bal) {
        bal.used = (bal.used || 0) + days;
        bal.balance = Math.max(0, (bal.allocated || 0) - bal.used);
        DB.set('leave_balances', balances);
      }
    }

    DB.log('APPLY', 'Leaves', `Leave encashment request for ${days} days (${Utils.formatCurrency(totalPayout)}) by ${emp?.fullName}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(isHRorAdmin ? 'Leave encashment approved and scheduled in payroll!' : 'Leave encashment request submitted to HR!', 'success');
    this.render();
  },

  approveLeaveEncashment(id) {
    if (!Auth.can('leaves.approve')) {
      Toast.show('Permission denied: You do not have permission to approve leave encashments.', 'error');
      return;
    }
    const encashments = DB.get('leave_encashments') || [];
    const enc = encashments.find(e => e.id === Number(id));
    if (!enc) {
      Toast.show('Encashment record not found', 'error');
      return;
    }
    const emp = DB.find('employees', enc.employeeId);

    Modal.confirm('Approve Leave Encashment & Schedule for Payroll', `
      <div style="font-size:13px;line-height:1.6">
        Are you sure you want to approve leave encashment for <strong>${emp?.fullName}</strong>?
        <div style="background:var(--surface);border-radius:8px;padding:12px;margin:12px 0;font-size:12px">
          <div>Encashed Days: <strong>${enc.encashedDays} Days</strong></div>
          <div>Per-Day Rate: <strong>${Utils.formatCurrency(enc.perDayRate)}</strong></div>
          <div>Total Payout Amount: <strong style="color:var(--success);font-size:14px">${Utils.formatCurrency(enc.totalPayout)}</strong></div>
          <div>Retained Balance: <strong>${enc.retainedBalance || 10} Days preserved</strong></div>
        </div>
        <p style="color:var(--text-3);font-size:11.5px;margin:0">
          This will deduct <strong>${enc.encashedDays} days</strong> from employee's Annual Leave balance and schedule the payout in the upcoming payroll run.
        </p>
      </div>
    `, () => {
      enc.status = 'approved';
      enc.payoutStatus = 'scheduled_in_payroll';
      enc.payrollMonth = new Date().toISOString().slice(0, 7);
      enc.approvedBy = Auth.user?.name || 'HR Admin';
      enc.approvedAt = new Date().toISOString();
      DB.set('leave_encashments', encashments);

      const balances = DB.get('leave_balances') || [];
      const bal = balances.find(b => b.employeeId === enc.employeeId && (b.leaveTypeId === 1 || b.leaveTypeId === enc.leaveTypeId));
      if (bal) {
        bal.used = (bal.used || 0) + enc.encashedDays;
        bal.balance = Math.max(0, (bal.allocated || 0) - bal.used);
        DB.set('leave_balances', balances);
      }

      DB.log('APPROVE', 'Leaves', `Approved leave encashment of ${enc.encashedDays} days (${Utils.formatCurrency(enc.totalPayout)}) for ${emp?.fullName}`, Auth.user?.id);
      Toast.show('Leave encashment approved and scheduled in payroll!', 'success');
      this.render();
    });
  },

  rejectLeaveEncashment(id) {
    if (!Auth.can('leaves.approve')) {
      Toast.show('Permission denied: You do not have permission to reject leave encashments.', 'error');
      return;
    }
    const encashments = DB.get('leave_encashments') || [];
    const enc = encashments.find(e => e.id === Number(id));
    if (!enc) return;
    const emp = DB.find('employees', enc.employeeId);

    Modal.confirm('Reject Leave Encashment', `
      Are you sure you want to reject the leave encashment request for <strong>${emp?.fullName}</strong>?
      <div class="form-group" style="margin-top:12px">
        <label class="form-label required">Reason for Rejection</label>
        <textarea id="enc-reject-reason" class="form-control" rows="2" placeholder="Explain reason for rejection..."></textarea>
      </div>
    `, () => {
      const reason = document.getElementById('enc-reject-reason')?.value.trim() || 'Rejected by HR Management';
      enc.status = 'rejected';
      enc.payoutStatus = 'rejected';
      enc.notes = (enc.notes ? enc.notes + ' | ' : '') + `Rejected: ${reason}`;
      DB.set('leave_encashments', encashments);
      DB.log('REJECT', 'Leaves', `Rejected leave encashment for ${emp?.fullName}: ${reason}`, Auth.user?.id);
      Toast.show('Leave encashment rejected', 'info');
      this.render();
    });
  },

  showEncashmentSlipModal(id) {
    const encashments = DB.get('leave_encashments') || [];
    const enc = encashments.find(e => e.id === Number(id));
    if (!enc) { Toast.show('Record not found', 'error'); return; }
    const emp = DB.find('employees', enc.employeeId);
    const dept = DB.find('departments', emp?.departmentId);

    Modal.show(`Leave Encashment Certificate — ${emp?.fullName}`, `
      <div id="printable-encashment-slip" style="padding:12px;font-family:inherit;color:var(--text)">
        <div style="text-align:center;border-bottom:2px solid var(--border);padding-bottom:14px;margin-bottom:16px">
          <h2 style="margin:0;font-size:18px;font-weight:800;color:var(--primary)">ENTERPRISE LEAVE ENCASHMENT CERTIFICATE</h2>
          <div style="font-size:12px;color:var(--text-3);margin-top:4px">Statutory Annual Leave Liquidation &amp; Payout Advice</div>
          <div style="font-size:11px;color:var(--text-muted)">Certificate Ref: #ENC-${enc.id.toString().padStart(5, '0')} | Assessment Year: ${enc.year || 2026}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:12px;background:var(--surface);padding:12px;border-radius:8px;border:1px solid var(--border)">
          <div><strong>Employee Name:</strong> ${emp?.fullName || '—'}</div>
          <div><strong>Employee ID / Code:</strong> ${emp?.empNo || '—'}</div>
          <div><strong>Department:</strong> ${dept?.name || '—'}</div>
          <div><strong>Designation:</strong> ${emp?.designation || '—'}</div>
          <div><strong>Base Monthly Salary:</strong> ${Utils.formatCurrency(emp?.salary || emp?.basicSalary || (enc.perDayRate * 30))}</div>
          <div><strong>Daily Pro-Rata Rate:</strong> ${Utils.formatCurrency(enc.perDayRate)} (Base / 30)</div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px">
          <thead>
            <tr style="background:var(--card);border-bottom:2px solid var(--border)">
              <th style="padding:8px;text-align:left">Entitlement Parameter</th>
              <th style="padding:8px;text-align:right">Days / Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:8px">Total Accrued Annual Leaves</td>
              <td style="padding:8px;text-align:right;font-weight:600">${enc.availableBalance} Days</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:8px">Mandatory Retention Reserve (HR Policy Min. 10d)</td>
              <td style="padding:8px;text-align:right;font-weight:600">${enc.retainedBalance || 10} Days</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border);background:rgba(99,102,241,0.05)">
              <td style="padding:8px;font-weight:700">Encashed Surplus Leaves</td>
              <td style="padding:8px;text-align:right;font-weight:700;color:var(--primary)">${enc.encashedDays} Days</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:8px">Per-Day Remuneration Rate</td>
              <td style="padding:8px;text-align:right;font-weight:600">${Utils.formatCurrency(enc.perDayRate)}</td>
            </tr>
            <tr style="background:rgba(16,185,129,0.08);border-bottom:2px solid #10b981">
              <td style="padding:10px;font-weight:800;font-size:13px">Net Liquidation Payout</td>
              <td style="padding:10px;text-align:right;font-weight:800;font-size:15px;color:#10b981">${Utils.formatCurrency(enc.totalPayout)}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size:11.5px;color:var(--text-3);line-height:1.5;margin-bottom:16px;background:var(--card);padding:10px;border-radius:6px;border:1px solid var(--border)">
          <strong>Approval &amp; Payroll Schedule:</strong><br>
          Status: <strong>${(enc.status || 'Pending').toUpperCase()}</strong> | Payout: <strong>${(enc.payoutStatus || '').toUpperCase()}</strong><br>
          Approved by: <strong>${enc.approvedBy || 'Pending HR Review'}</strong> | Applied: <strong>${enc.requestDate}</strong><br>
          <em>Note: This amount is disbursed via the scheduled payroll processing run and subjected to statutory tax laws as per Ordinance Section 149.</em>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Utils.printDiv('printable-encashment-slip')"><i class="fa fa-print"></i> Print Encashment Slip</button>
      `
    });
  },

  showBulkEncashmentModal() {
    if (!Auth.can('leaves.edit')) {
      Toast.show('Permission denied: You do not have permission to run bulk encashment.', 'error');
      return;
    }
    const employees = (DB.get('employees') || []).filter(e => e.status === 'active');
    const balances = DB.get('leave_balances') || [];

    const eligibleList = employees.map(emp => {
      const bal = balances.find(b => b.employeeId === emp.id && b.leaveTypeId === 1) || { balance: 14 };
      const currentBalance = bal.balance !== undefined ? bal.balance : 12;
      const baseSalary = Number(emp.salary || emp.basicSalary || 50000);
      const perDayRate = Math.round(baseSalary / 30);
      const maxEncashable = Math.max(0, currentBalance - 10);
      return {
        emp,
        currentBalance,
        baseSalary,
        perDayRate,
        maxEncashable,
        estPayout: maxEncashable * perDayRate
      };
    }).filter(item => item.maxEncashable > 0);

    const totalLiability = eligibleList.reduce((s, i) => s + i.estPayout, 0);

    Modal.show('Corporate Annual Leave Encashment Batch Run', `
      <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:14px">
        <div style="background:var(--surface);border-radius:10px;padding:12px 16px;border:1px solid var(--border)">
          <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:4px">
            <i class="fa fa-calculator" style="color:var(--primary);margin-right:6px"></i>
            Annual Balance Clearance Run (Year 2026)
          </div>
          <div style="font-size:12px;color:var(--text-3);line-height:1.4">
            Found <strong>${eligibleList.length} employees</strong> holding surplus Annual Leaves exceeding the 10-day retention threshold. Total estimated payroll liability: <strong style="color:var(--success)">${Utils.formatCurrency(totalLiability)}</strong>.
          </div>
        </div>

        <div class="table-wrapper" style="max-height:280px;overflow-y:auto">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Annual Bal</th>
                <th>Retain</th>
                <th>Encashable</th>
                <th>Daily Rate</th>
                <th>Estimated Payout</th>
              </tr>
            </thead>
            <tbody>
              ${eligibleList.length === 0 ? `
                <tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">No active employees have surplus annual leave >10 days.</td></tr>
              ` : eligibleList.map(item => `
                <tr>
                  <td><strong>${item.emp.fullName}</strong> <span style="font-size:11px;color:var(--text-3)">(${item.emp.empNo})</span></td>
                  <td>${item.currentBalance}d</td>
                  <td><span class="badge badge-neutral">10d</span></td>
                  <td><span class="badge badge-primary">${item.maxEncashable}d</span></td>
                  <td>${Utils.formatCurrency(item.perDayRate)}</td>
                  <td style="font-weight:700;color:var(--success)">${Utils.formatCurrency(item.estPayout)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        ${eligibleList.length > 0 ? `
          <button class="btn btn-primary" onclick="Leaves.processBulkEncashmentBatch()"><i class="fa fa-play"></i> Process All ${eligibleList.length} Encashments</button>
        ` : ''}
      `
    });
  },

  processBulkEncashmentBatch() {
    if (!Auth.can('leaves.edit')) {
      Toast.show('Permission denied: You do not have permission to execute bulk encashment.', 'error');
      return;
    }
    const employees = (DB.get('employees') || []).filter(e => e.status === 'active');
    const balances = DB.get('leave_balances') || [];
    const encashments = DB.get('leave_encashments') || [];
    let processed = 0;

    employees.forEach(emp => {
      const bal = balances.find(b => b.employeeId === emp.id && b.leaveTypeId === 1);
      const currentBalance = bal ? (bal.balance || 0) : 0;
      const maxEncashable = Math.max(0, currentBalance - 10);
      if (maxEncashable > 0) {
        const baseSalary = Number(emp.salary || emp.basicSalary || 50000);
        const perDayRate = Math.round(baseSalary / 30);
        const totalPayout = maxEncashable * perDayRate;

        encashments.unshift({
          id: DB.nextId('leave_encashments'),
          employeeId: emp.id,
          year: new Date().getFullYear(),
          leaveTypeId: 1,
          availableBalance: currentBalance,
          retainedBalance: 10,
          encashedDays: maxEncashable,
          perDayRate,
          totalPayout,
          requestDate: Utils.today(),
          status: 'approved',
          approvedBy: Auth.user?.name || 'HR Admin (Batch Run)',
          approvedAt: new Date().toISOString(),
          payoutStatus: 'scheduled_in_payroll',
          payrollMonth: new Date().toISOString().slice(0, 7),
          notes: 'Annual batch encashment of surplus leaves exceeding 10-day reserve.'
        });

        bal.used = (bal.used || 0) + maxEncashable;
        bal.balance = Math.max(0, (bal.allocated || 0) - bal.used);
        processed++;
      }
    });

    DB.set('leave_encashments', encashments);
    DB.set('leave_balances', balances);
    DB.log('BATCH', 'Leaves', `Executed annual bulk leave encashment for ${processed} employees`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Successfully executed bulk encashment for ${processed} employees! Scheduled in payroll.`, 'success');
    this.render();
  },

  showYearEndCarryForwardModal() {
    if (!Auth.can('leaves.edit')) {
      Toast.show('Permission denied: You do not have permission to access year-end carry-forward.', 'error');
      return;
    }
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const employees = (DB.get('employees') || []).filter(e => e.status === 'active');
    const balances = DB.get('leave_balances') || [];

    const reconList = employees.map(emp => {
      const bal = balances.find(b => b.employeeId === emp.id && b.leaveTypeId === 1) || { balance: 14 };
      const currentBal = bal.balance !== undefined ? bal.balance : 12;
      const carryLimit = 10;
      const carriedDays = Math.min(carryLimit, currentBal);
      const surplus = Math.max(0, currentBal - carryLimit);
      const dailyRate = Math.round(Number(emp.salary || 50000) / 30);
      const estEncashment = surplus * dailyRate;

      return {
        emp,
        currentBal,
        carriedDays,
        surplus,
        dailyRate,
        estEncashment,
        newYearOpening: carriedDays + 14 // 14 days annual entitlement for next year
      };
    });

    const totalCarried = reconList.reduce((s, r) => s + r.carriedDays, 0);
    const totalSurplus = reconList.reduce((s, r) => s + r.surplus, 0);
    const totalEncashLiability = reconList.reduce((s, r) => s + r.estEncashment, 0);

    Modal.show('Fiscal Year-End Leave Carry-Forward & Reconciliation Engine', `
      <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:14px">
        <!-- Configuration Header -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-weight:800;font-size:15px;color:var(--text);display:flex;align-items:center;gap:8px">
              <i class="fa fa-calendar-check" style="color:var(--primary)"></i>
              Annual Transition: Fiscal Year ${currentYear} &rarr; ${nextYear}
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              Execute annual statutory balance rollover, carry-forward caps, and surplus leave reconciliation.
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="Leaves.printYearEndReconciliation(${currentYear})">
              <i class="fa fa-print"></i> Print Audit Report
            </button>
          </div>
        </div>

        <!-- Policy Selector Cards -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px">
          <div style="background:var(--card);border:1.5px solid var(--primary);border-radius:10px;padding:12px">
            <div style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase">Policy Rule 1</div>
            <div style="font-weight:800;font-size:13px;color:var(--text);margin-top:2px">Max 10 Days Carry-Forward</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">Rolls over up to 10 unused annual days to ${nextYear}. Total: <strong>${totalCarried} Days</strong>.</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div style="font-size:11px;font-weight:700;color:var(--success);text-transform:uppercase">Surplus Policy</div>
            <div style="font-weight:800;font-size:13px;color:var(--text);margin-top:2px">Auto-Encash Surplus to Payroll</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">${totalSurplus} surplus days encashed at standard rate: <strong>${Utils.formatCurrency(totalEncashLiability)}</strong>.</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase">New Year Grant</div>
            <div style="font-weight:800;font-size:13px;color:var(--text);margin-top:2px">+14 Days Annual Entitlement</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">Standard annual leave quota added to carried-over balance.</div>
          </div>
        </div>

        <!-- Reconciliation Table -->
        <div class="table-wrapper" style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>${currentYear} Balance</th>
                <th>Carried to ${nextYear}</th>
                <th>Surplus (Encashed)</th>
                <th>Encashment Payout</th>
                <th>${nextYear} Opening Balance</th>
              </tr>
            </thead>
            <tbody>
              ${reconList.map(r => `
                <tr>
                  <td><strong>${r.emp.fullName}</strong> <span style="font-size:11px;color:var(--text-3)">(${r.emp.empNo})</span></td>
                  <td>${r.currentBal}d</td>
                  <td><span class="badge badge-primary">${r.carriedDays} Days</span></td>
                  <td><span class="badge ${r.surplus > 0 ? 'badge-success' : 'badge-neutral'}">${r.surplus} Days</span></td>
                  <td style="font-weight:700;color:${r.surplus > 0 ? 'var(--success)' : 'var(--text-3)'}">
                    ${r.surplus > 0 ? Utils.formatCurrency(r.estEncashment) : '—'}
                  </td>
                  <td style="font-weight:800;color:var(--primary)">${r.newYearOpening} Days</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `, {
      size: 'modal-lg',
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Leaves.executeYearEndCarryForward()" style="background:linear-gradient(135deg,#10b981,#059669);border:none;font-weight:700">
          <i class="fa fa-play"></i> Execute Year-End Transition (${currentYear} &rarr; ${nextYear})
        </button>
      `
    });
  },

  executeYearEndCarryForward() {
    if (!Auth.can('leaves.edit')) {
      Toast.show('Permission denied: You do not have permission to execute carry forward.', 'error');
      return;
    }
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const employees = (DB.get('employees') || []).filter(e => e.status === 'active');
    const balances = DB.get('leave_balances') || [];
    const encashments = DB.get('leave_encashments') || [];
    let count = 0;
    let encashedCount = 0;

    employees.forEach(emp => {
      const bal = balances.find(b => b.employeeId === emp.id && b.leaveTypeId === 1);
      const currentBal = bal ? (bal.balance !== undefined ? bal.balance : 12) : 12;
      const carryLimit = 10;
      const carriedDays = Math.min(carryLimit, currentBal);
      const surplus = Math.max(0, currentBal - carryLimit);

      // If surplus exists, auto-encash and push to payroll
      if (surplus > 0) {
        const baseSalary = Number(emp.salary || 50000);
        const perDayRate = Math.round(baseSalary / 30);
        const totalPayout = surplus * perDayRate;

        encashments.unshift({
          id: DB.nextId('leave_encashments'),
          employeeId: emp.id,
          year: currentYear,
          leaveTypeId: 1,
          availableBalance: currentBal,
          retainedBalance: carriedDays,
          encashedDays: surplus,
          perDayRate,
          totalPayout,
          requestDate: Utils.today(),
          status: 'approved',
          approvedBy: Auth.user?.name || 'HR Admin (Fiscal Year-End)',
          approvedAt: new Date().toISOString(),
          payoutStatus: 'scheduled_in_payroll',
          payrollMonth: `${nextYear}-01`,
          notes: `Fiscal year-end auto-encashment of surplus leaves exceeding ${carryLimit}-day carry-over limit.`
        });
        encashedCount++;
      }

      // Update balance for the new year
      if (bal) {
        bal.allocated = carriedDays + 14;
        bal.used = 0;
        bal.balance = carriedDays + 14;
      }
      count++;
    });

    DB.set('leave_encashments', encashments);
    DB.set('leave_balances', balances);
    DB.log('CARRY_FORWARD', 'Leaves', `Executed fiscal year-end carry forward for ${count} employees (${encashedCount} surplus encashments scheduled in payroll).`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show(`Fiscal Year-End Transition executed for ${count} employees! Balances rolled over to ${nextYear}.`, 'success');
    this.render();
  },

  printYearEndReconciliation(year) {
    const employees = (DB.get('employees') || []).filter(e => e.status === 'active');
    const balances = DB.get('leave_balances') || [];

    const rows = employees.map((emp, i) => {
      const bal = balances.find(b => b.employeeId === emp.id && b.leaveTypeId === 1) || { balance: 14 };
      const currentBal = bal.balance !== undefined ? bal.balance : 12;
      const carried = Math.min(10, currentBal);
      const surplus = Math.max(0, currentBal - 10);
      const payout = surplus * Math.round(Number(emp.salary || 50000) / 30);
      return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${i + 1}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:700">${emp.fullName} (${emp.empNo})</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center">${currentBal}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;color:#2563eb;font-weight:700">${carried}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;color:#10b981">${surplus}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right">${payout > 0 ? Utils.formatCurrency(payout) : '—'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:800;color:#1e40af">${carried + 14}</td>
        </tr>
      `;
    }).join('');

    const w = window.open('', '_blank');
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fiscal_Year_End_Leave_Reconciliation_${year}</title>
          <style>
            body { margin:0; padding:28px; font-family:'Segoe UI',Roboto,Helvetica,sans-serif; background:#fff; color:#111; }
            table { width:100%; border-collapse:collapse; font-size:12px; margin-top:16px; }
            th { background:#f1f5f9; padding:10px; text-align:left; border-bottom:2px solid #cbd5e1; font-size:11px; text-transform:uppercase; }
            @page { size: A4; margin: 12mm; }
          </style>
        </head>
        <body>
          <div style="border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:16px">
            <h2 style="margin:0;color:#1e40af">HRM Enterprise Solutions &bull; Fiscal Year-End Leave Reconciliation</h2>
            <div style="font-size:12px;color:#64748b;margin-top:4px">Audit Period: Year ${year} Rollover &bull; Generated on ${Utils.formatDate(Utils.today())}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee Name</th>
                <th style="text-align:center">Year-End Balance</th>
                <th style="text-align:center">Carried Forward (Max 10)</th>
                <th style="text-align:center">Surplus Encashed</th>
                <th style="text-align:right">Encashment Liability</th>
                <th style="text-align:center">New Year Opening</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 350); };<\/script>
        </body>
      </html>
    `);
    w.document.close();
  }
};
