// ============================================================
// HRM SYSTEM — Leave Management Module
// ============================================================

const Leaves = {
  currentView: 'requests',
  calMode: 'employee',
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
      const teamIds = this.getScopedEmployees().map(e => e.id);
      return allLeaves.filter(l => teamIds.includes(l.employeeId));
    }
    return allLeaves;
  },

  render() {
    const content = document.getElementById('page-content');
    const leaves = this.getScopedLeaves();
    const pending = leaves.filter(l => l.status === 'pending').length;
    const approved = leaves.filter(l => l.status === 'approved').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;
    const mgrApproved = leaves.filter(l => l.status === 'manager_approved').length;

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

        <!-- Tabs -->
        <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border);flex-wrap:wrap">
          ${[
            { id:'requests', label:'Leave Requests', icon:'fa-list' },
            { id:'calendar', label:'Leave Calendar', icon:'fa-calendar' },
            { id:'quota',    label:'Leave Quota & Balance',  icon:'fa-scale-balanced' },
            { id:'tokens',   label:'Overtime Tokens', icon:'fa-coins' },
            { id:'holidays', label:'Holidays',       icon:'fa-calendar-days' },
          ].map(t => `
            <button class="tab-toggle-btn ${this.currentView===t.id?'active':''}" onclick="Leaves.switchView('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
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
    document.querySelectorAll('[onclick*="Leaves.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\w+)'/);
      if (m) b.classList.toggle('active', m[1] === this.currentView);
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
      case 'requests': this.renderRequests(container); break;
      case 'calendar': this.renderCalendar(container); break;
      case 'quota':
      case 'balance':  this.renderQuota(container); break;
      case 'tokens':   this.renderTokens(container); break;
      case 'types':    
        this.currentView = 'quota';
        this.quotaSubView = 'types';
        this.renderQuota(container);
        break;
      case 'holidays': this.renderHolidays(container); break;
    }
  },

  renderRequests(container) {
    const leaves = this.getScopedLeaves();
    const emps = DB.get('employees');
    const types = DB.get('leave_types');

    const isDeptMgr = Auth.role === 'dept_manager';
    const isHRorAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const isEmployee = Auth.role === 'employee';

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600">${isEmployee ? 'My Leave Requests' : isDeptMgr ? 'Team Leave Requests (Direct Reportees)' : 'All Leave Requests'}</span>
          <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-plus"></i> Apply Leave</button>
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
                  <td><strong>${leave.days} day${leave.days!==1?'s':''}</strong></td>
                  <td style="font-size:12px">${Utils.formatDate(leave.appliedOn)}</td>
                  <td>${Utils.statusBadge(leave.status)}</td>
                  <td>
                    <div class="tbl-actions">
                      <button class="btn btn-ghost btn-icon btn-sm" onclick="Leaves.viewDetail(${leave.id})" title="View"><i class="fa fa-eye"></i></button>
                      ${(isDeptMgr && leave.status === 'pending') ? `
                        <button class="btn btn-primary btn-sm" onclick="Leaves.approve(${leave.id})" title="Manager Endorse / Approve">
                          <i class="fa fa-check"></i> Manager Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="Leaves.reject(${leave.id})" title="Reject">
                          <i class="fa fa-times"></i>
                        </button>
                      ` : ''}
                      ${(isHRorAdmin && (leave.status === 'pending' || leave.status === 'manager_approved')) ? `
                        <button class="btn btn-success btn-sm" onclick="Leaves.approve(${leave.id})" title="Final Corporate Approval">
                          <i class="fa fa-check-double"></i> Final Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="Leaves.reject(${leave.id})" title="Reject">
                          <i class="fa fa-times"></i>
                        </button>
                      ` : ''}
                      ${isEmployee && leave.status === 'pending' ? `
                        <button class="btn btn-danger btn-icon btn-sm" onclick="Leaves.cancelLeave(${leave.id})" title="Cancel"><i class="fa fa-ban"></i></button>
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

    container.innerHTML = `
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

            ${isMyMode ? `
              <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm(null, 'my')">
                <i class="fa fa-calendar-plus" style="margin-right:6px"></i> Apply for My Leave
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm(null, 'employee')">
                <i class="fa fa-user-plus" style="margin-right:6px"></i> Mark Employee Leave
              </button>
            `}
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

            return `
              <div class="leave-cal-day ${isToday ? 'today' : ''}" 
                   style="${isWeekend ? 'background:rgba(255,255,255,0.015);' : ''}${dayHol ? 'border-color:rgba(239,68,68,0.4);' : ''}"
                   onclick="Leaves.onCalendarDateClick('${dateStr}', '${isMyMode ? 'my' : 'employee'}')"
                   title="${isMyMode ? `Click to apply for your leave on ${dateStr}` : `Click to mark leave for an employee on ${dateStr}`}">
                <div class="leave-cal-header">
                  <span class="cal-day-num" style="${isWeekend ? 'color:var(--danger);' : ''}${isToday ? 'background:var(--primary);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:700;' : ''}">${d}</span>
                  <span class="cal-quick-apply">
                    <i class="fa ${isMyMode ? 'fa-plus' : 'fa-user-plus'}"></i> ${isMyMode ? 'Apply' : 'Mark'}
                  </span>
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
    const avAnnual = allApprovedLeaves.filter(l => l.typeId === 2).reduce((s, l) => s + l.days, 0);
    const avSickCasual = allApprovedLeaves.filter(l => l.typeId === 1 || l.typeId === 3).reduce((s, l) => s + l.days, 0);
    const avComp = allApprovedLeaves.filter(l => l.typeId === 7).reduce((s, l) => s + l.days, 0);
    const avHalf = allApprovedLeaves.filter(l => l.typeId === 8).reduce((s, l) => s + l.days, 0);
    const avShort = allApprovedLeaves.filter(l => l.typeId === 9).reduce((s, l) => s + l.days, 0);
    const avSalary = allApprovedLeaves.filter(l => l.salaryDeduction === true).reduce((s, l) => s + l.days, 0);
    const avTotal = avAnnual + avSickCasual + avComp + avHalf + avShort + avSalary;

    // 3. REMAINING LEAVES (Image order: Sick/Casual, Compensation, Annual, Total)
    const remSickCasual = Math.max(0, qSickCasual - avSickCasual);
    const remComp = Math.max(0, qComp - avComp);
    const remAnnual = Math.max(0, qAnnual - avAnnual);
    const remTotal = remSickCasual + remComp + remAnnual;

    // 4. OTHER LEAVE
    const otherUnpaid = allApprovedLeaves.filter(l => l.typeId === 6).reduce((s, l) => s + l.days, 0);
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

              ${!isEmployeeView && isHrOrAdmin ? `
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
                <td colspan="${!isEmployeeView && isHrOrAdmin ? 21 : 20}" style="padding:32px;text-align:center;color:var(--text-muted)">
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

                ${!isEmployeeView && isHrOrAdmin ? `
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
                ${!isEmployeeView && isHrOrAdmin ? '<td style="border:1px solid #bae6fd"></td>' : ''}
              </tr>
            </tfoot>
          ` : ''}
        </table>
      </div>
    `;
  },

  exportQuotaMatrixCSV() {
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
      const myRow = this.getEmployeeLeaveQuotaMetrics(myEmp, this.quotaYear || 2026);
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
              <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-calendar-plus"></i> Apply for Leave</button>
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
              <button class="btn btn-ghost btn-sm" onclick="Leaves.exportQuotaMatrixCSV()">
                <i class="fa fa-download"></i> Download My Ledger
              </button>
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
            <button class="btn btn-ghost btn-sm" onclick="Leaves.exportQuotaMatrixCSV()" title="Export complete matrix to CSV">
              <i class="fa fa-file-export"></i> Export CSV
            </button>
            ${isHrOrAdmin ? `
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
    if (Auth.role === 'employee') {
      Toast.show('Access restricted: Employees cannot allocate quotas.', 'error');
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
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
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
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
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
                    ${isHrOrAdmin ? `
                      <button class="btn btn-ghost btn-xs" onclick="Leaves.showEditType(${t.id})" title="Edit leave type policy" style="padding:4px 8px">
                        <i class="fa fa-pen"></i> Edit
                      </button>
                      ${t.id > 10 ? `
                        <button class="btn btn-ghost btn-xs" onclick="Leaves.deleteType(${t.id})" title="Delete custom type" style="padding:4px 8px;color:var(--danger)">
                          <i class="fa fa-trash"></i>
                        </button>
                      ` : ''}
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
    if (Auth.role === 'employee') {
      Toast.show('Permission denied: Employees cannot add leave types.', 'error');
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
    if (Auth.role === 'employee' || Auth.role === 'onboarding') {
      Toast.show('Permission denied: Employees cannot edit leave types.', 'error');
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
    if (Auth.role === 'employee' || Auth.role === 'onboarding') { Toast.show('Permission denied.', 'error'); return; }
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
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') {
      Toast.show('Permission denied: Only Administrators and HR can delete leave types.', 'error');
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
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
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
    const types = DB.get('leave_types') || [];
    const allEmps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const role = Auth.role;
    const isManagement = role === 'superadmin' || role === 'hr_manager' || role === 'dept_manager';
    const isDeptMgr = role === 'dept_manager';
    const myEmp = Auth.employee || allEmps.find(e => e.id === Auth.user?.employeeId) || allEmps[0];

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
        <!-- Management Switcher: Apply for Myself vs Mark for Employee -->
        ${isManagement ? `
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

        <!-- Dates & Live Duration -->
        <div class="form-row form-row-2" style="margin-bottom:0">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-calendar-arrow-down" style="color:var(--primary);margin-right:4px"></i> From Date</label>
            <input type="date" class="form-control" id="lf-from" value="${defaultDate}" onchange="Leaves.onLeaveDateChange()">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-calendar-arrow-up" style="color:var(--primary);margin-right:4px"></i> To Date</label>
            <input type="date" class="form-control" id="lf-to" value="${defaultDate}" onchange="Leaves.onLeaveDateChange()">
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:-6px">
          <span id="lf-days-badge" class="badge badge-primary" style="font-size:12px;padding:4px 10px;display:inline-flex;align-items:center;gap:5px">
            <i class="fa fa-clock"></i> 1 Day Requested
          </span>
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

  onLeaveDateChange() {
    const from = document.getElementById('lf-from')?.value;
    const to = document.getElementById('lf-to')?.value;
    if (from && to) {
      const days = from <= to ? Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1) : 0;
      const badge = document.getElementById('lf-days-badge');
      if (badge) {
        badge.innerHTML = from > to ? '<i class="fa fa-exclamation-triangle"></i> Invalid Date Range' : `<i class="fa fa-clock"></i> ${days} Day${days !== 1 ? 's' : ''} Requested`;
        badge.className = from > to ? 'badge badge-danger' : 'badge badge-primary';
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
      const days = (from && to && from <= to) ? Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1) : 1;
      const salary = emp?.salary || 50000;
      const dailyWage = Math.round(salary / 30);
      const totalDed = dailyWage * days;

      if (preview) {
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

    const days = (from && to && from <= to) ? Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1) : 1;

    const types = DB.get('leave_types') || [];
    const balances = DB.get('leave_balances') || [];
    const bal = balances.find(b => b.employeeId === empId);
    const allLeaves = DB.get('leave_requests') || [];
    const empLeaves = allLeaves.filter(l => l.employeeId === empId && l.status === 'approved');

    const quotaType = types.find(t => t.id === quotaTypeId) || types[0];
    const allocated = bal?.quotas?.[quotaTypeId] ?? (quotaType?.maxDays || 14);
    const used = empLeaves.filter(l => (l.quotaTypeId === quotaTypeId || l.typeId === quotaTypeId)).reduce((s, l) => s + l.days, 0);
    const currentRemaining = bal?.balances?.[quotaTypeId] ?? Math.max(0, allocated - used);

    const balanceAfterApproval = Math.max(0, currentRemaining - days);
    const isOverQuota = days > currentRemaining;
    const isRunningLow = currentRemaining <= 3;
    const pct = allocated > 0 ? Math.min(100, Math.round(((used + (isOverQuota ? currentRemaining : days)) / allocated) * 100)) : 0;
    const color = quotaType?.color || 'var(--primary)';

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
            <div style="font-size:15px;font-weight:800;color:var(--warning)">${used}d</div>
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
            ${isSalaryDeduct ? `Quota exceeded (${days}d requested vs ${currentRemaining}d available), but <strong>Salary Deduction is Active</strong>. Leave will be approved via Loss of Pay.` : `Requested duration (${days} days) exceeds available ${quotaType?.name} quota (${currentRemaining} days remaining)!`}
          </div>
        ` : `
          <div style="color:var(--text-3);font-size:11px;display:flex;align-items:center;justify-content:space-between">
            <span>Deducting <strong>${days} day(s)</strong> from ${quotaType?.name} Quota</span>
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
    const reason = document.getElementById('lf-reason').value.trim();
    const remarks = document.getElementById('lf-remarks')?.value.trim() || '';
    const isSalaryDeduct = document.getElementById('lf-salary-deduct')?.checked || false;

    if (!from || !to || !reason) { Toast.show('Please fill all required fields (Dates and Reason)', 'error'); return; }
    if (from > to) { Toast.show('From date cannot be after To date', 'error'); return; }

    const days = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1);
    const targetEmp = DB.find('employees', empId);
    const dailyWage = Math.round((targetEmp?.salary || 50000) / 30);
    const deductionAmount = isSalaryDeduct ? (dailyWage * days) : 0;

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
      l.from <= to && l.to >= from
    );
    if (existing.length > 0) {
      Toast.show('An active leave request already exists overlapping these dates!', 'error');
      return;
    }

    const newLeave = {
      id: DB.nextId('leave_requests'),
      employeeId: empId,
      typeId,
      quotaTypeId,
      quotaName: quotaType?.name || leaveType?.name || 'Standard Quota',
      from,
      to,
      days,
      reason,
      remarks,
      salaryDeduction: isSalaryDeduct,
      deductionDays: isSalaryDeduct ? days : 0,
      deductionAmount: isSalaryDeduct ? deductionAmount : 0,
      status: 'pending',
      managerId: targetEmp?.managerId || 3,
      hrId: 2,
      appliedOn: Utils.today(),
      appliedVia: isSelf ? 'my_leave_calendar' : 'employee_leave_calendar',
      approvedOn: null,
      comments: isSelf ? (isSalaryDeduct ? 'Employee requested Salary Deduction' : '') : `Marked by ${myEmp?.fullName||'Manager'} (${Auth.role})`
    };

    DB.add('leave_requests', newLeave);
    DB.log('APPLY', 'Leaves', isSelf 
      ? `${myEmp?.fullName} applied for personal leave for ${days}d (${from} to ${to}) utilizing ${newLeave.quotaName}`
      : `Leave marked for ${targetEmp?.fullName} by ${myEmp?.fullName} (${days}d from ${from} to ${to}) utilizing ${newLeave.quotaName}`, 
      Auth.user?.id);

    Modal.close('dynamic-modal');

    if (isSelf) {
      Toast.show('My leave application submitted!', 'success', `${days} day(s) requested for ${Utils.formatDate(from)}. Awaiting approval.`);
    } else {
      Toast.show(`Leave marked for ${targetEmp?.fullName}!`, 'success', `Request for ${days} day(s) registered under ${newLeave.quotaName}.`);
    }

    this.render();
  },

  approve(leaveId) {
    const leave = DB.find('leave_requests', leaveId);
    if (!leave) return;

    if (Auth.role === 'dept_manager') {
      // First tier approval: Reporting manager endorses request
      DB.update('leave_requests', leaveId, {
        status: 'manager_approved',
        managerStatus: 'approved',
        managerApprovedAt: new Date().toISOString(),
        comments: `Endorsed by ${Auth.user?.username || 'Deputy Manager'}`
      });
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
          bal.balances[targetQuotaId] = Math.max(0, bal.balances[targetQuotaId] - leave.days);
          DB.set('leave_balances', balances);
        }
      }

      DB.log('APPROVE', 'Leaves', `Leave #${leaveId} approved (Final)`, Auth.user?.id);
      if (leave.salaryDeduction) {
        Toast.show(`Leave approved with Salary Deduction (PKR ${(leave.deductionAmount||0).toLocaleString()}) for payroll!`, 'success');
      } else {
        Toast.show('Final leave approval granted! Quota deducted.', 'success');
      }
    }

    this.render();
  },

  reject(leaveId) {
    DB.update('leave_requests', leaveId, { status: 'rejected', approvedOn: Utils.today(), comments: 'Rejected' });
    DB.log('REJECT', 'Leaves', `Leave #${leaveId} rejected`, Auth.user?.id);
    Toast.show('Leave rejected.', 'warning');
    this.renderView();
  },

  cancelLeave(leaveId) {
    Modal.confirm('Cancel Leave', 'Are you sure you want to cancel this leave request?', () => {
      DB.delete('leave_requests', leaveId);
      Toast.show('Leave request cancelled.', 'info');
      this.renderView();
    });
  },

  viewDetail(leaveId) {
    const leave = DB.find('leave_requests', leaveId);
    const emp = DB.find('employees', leave.employeeId);
    const type = DB.find('leave_types', leave.typeId);
    const quotaType = leave.quotaTypeId ? DB.find('leave_types', leave.quotaTypeId) : type;
    Modal.show(`Leave Request — ${emp?.fullName}`, `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${[
          ['Employee', emp?.fullName + ' (' + emp?.empNo + ')'],
          ['Leave Type', type?.name],
          ['Quota Utilized', quotaType?.name ? `${quotaType.name} Quota` : 'Standard Quota'],
          ['From', Utils.formatDate(leave.from)],
          ['To', Utils.formatDate(leave.to)],
          ['Days', `${leave.days} day${leave.days !== 1 ? 's' : ''}`],
          ['Reason', leave.reason],
          ['Remarks / Handover', leave.remarks || '—'],
          ['Salary Deduction', leave.salaryDeduction ? `<span class="badge badge-warning" style="font-size:12px"><i class="fa fa-money-bill-wave"></i> PKR ${(leave.deductionAmount||0).toLocaleString()} (Unpaid LOP)</span>` : '<span class="badge badge-secondary">Paid Quota Leave</span>'],
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
    if (Auth.role === 'employee') {
      Toast.show('Permission denied: Employees cannot add holidays.', 'error');
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
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
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

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Banner: Overtime Token System Info & Actions -->
        <div class="card" style="padding:18px 22px;margin-bottom:20px;background:linear-gradient(135deg,rgba(99,102,241,0.07) 0%,rgba(168,85,247,0.06) 100%);border:1.5px solid rgba(99,102,241,0.25);border-radius:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 14px rgba(99,102,241,0.3)">
                <i class="fa fa-coins"></i>
              </div>
              <div>
                <h3 style="font-size:17px;font-weight:800;color:var(--text);margin:0;letter-spacing:-0.3px">
                  Overtime Tokens &amp; Compensatory Leave Bank
                </h3>
                <p style="font-size:12px;color:var(--text-3);margin:3px 0 0">
                  Non-Cash Policy: Overtime is <strong>not paid as cash in salary</strong>. Extra hours are converted into verified tokens with reporting manager approval, avail as <strong>Short Leave (min 45 min)</strong>, <strong>Half Day (4h)</strong>, or <strong>Full Day (8h)</strong>.
                </p>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="Leaves.showClaimOvertimeTokenModal()">
                <i class="fa fa-plus-circle"></i> Apply Overtime Token Claim
              </button>
              <button class="btn btn-success" onclick="Leaves.showAvailTokenModal()">
                <i class="fa fa-calendar-check"></i> Avail Token as Leave
              </button>
            </div>
          </div>
        </div>

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
                        <td><span class="badge badge-primary" style="font-size:12px;font-weight:700">${t.hours} hrs OT</span></td>
                        <td style="max-width:320px;font-size:12.5px;color:var(--text)">
                          <div style="line-height:1.4">${t.taskDescription}</div>
                        </td>
                        <td style="font-size:11.5px;color:var(--text-3)">${t.appliedOn}</td>
                        <td style="text-align:center;white-space:nowrap">
                          <button class="btn btn-success btn-sm" style="margin-right:6px" onclick="Leaves.approveOvertimeToken(${t.id})" title="Approve token claim if work was assigned">
                            <i class="fa fa-check"></i> Approve
                          </button>
                          <button class="btn btn-danger btn-sm" onclick="Leaves.rejectOvertimeToken(${t.id})" title="Reject token claim">
                            <i class="fa fa-times"></i> Reject
                          </button>
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
                Overtime Token Claims &amp; Verification Ledger
              </div>
              <div style="font-size:11.5px;color:var(--text-3)">
                ${isEmployee ? 'History of your submitted overtime claims and manager verification notes' : 'Corporate overtime claims ledger and reporting manager approvals'}
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="Leaves.showClaimOvertimeTokenModal()">
              <i class="fa fa-plus"></i> Claim Overtime
            </button>
          </div>

          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Date Worked</th>
                  <th>Employee</th>
                  <th>Extra Hours</th>
                  <th>Task Description / Assigned Work</th>
                  <th>Reporting Manager</th>
                  <th>Status</th>
                  <th>Manager Remarks / Approval</th>
                </tr>
              </thead>
              <tbody>
                ${displayTokens.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No overtime token claims recorded yet.</td></tr>
                ` : displayTokens.map(t => {
                  const emp = DB.find('employees', t.employeeId);
                  const mgr = DB.find('employees', t.managerId || emp?.managerId || emp?.reportingTo || 3);
                  let statusBadge = '<span class="badge badge-warning"><i class="fa fa-clock"></i> Pending Review</span>';
                  if (t.status === 'approved') statusBadge = '<span class="badge badge-success"><i class="fa fa-check-circle"></i> Approved &amp; Banked</span>';
                  else if (t.status === 'rejected') statusBadge = '<span class="badge badge-danger"><i class="fa fa-circle-xmark"></i> Rejected</span>';

                  return `
                    <tr>
                      <td style="font-weight:600;font-size:12.5px">${Utils.formatDate(t.date)}</td>
                      <td>
                        <div style="font-weight:600;font-size:12.5px">${emp?.fullName || 'Self'}</div>
                        <div style="font-size:10.5px;color:var(--text-3)">${emp?.empNo}</div>
                      </td>
                      <td><span class="badge badge-primary" style="font-weight:700">${t.hours} hrs</span></td>
                      <td style="max-width:280px;font-size:12px;color:var(--text-2);line-height:1.4">${t.taskDescription}</td>
                      <td style="font-size:12px;color:var(--text-2)">
                        <strong>${mgr?.fullName || 'Usman Baig'}</strong>
                      </td>
                      <td>${statusBadge}</td>
                      <td style="font-size:11.5px;color:var(--text-3);max-width:220px">
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
                      <td style="font-size:12px;color:var(--text-2);max-width:280px">${a.reason}</td>
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

  showClaimOvertimeTokenModal(prefillDate, prefillHours) {
    const allEmps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const myEmp = Auth.employee || DB.find('employees', 4) || allEmps[0];
    const isEmployee = Auth.role === 'employee' || Auth.role === 'onboarding';
    const isManagement = !isEmployee;
    const defaultDate = prefillDate || Utils.today();
    const defaultHours = prefillHours || 1.5;

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

        <div class="form-row form-row-2" style="margin-bottom:0">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-calendar-day" style="color:var(--primary);margin-right:4px"></i> Date Overtime Worked</label>
            <input type="date" class="form-control" id="ot-claim-date" value="${defaultDate}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-business-time" style="color:var(--primary);margin-right:4px"></i> Extra Hours Worked</label>
            <input type="number" class="form-control" id="ot-claim-hours" value="${defaultHours}" min="0.5" max="12" step="0.5" placeholder="e.g. 1.5, 2.0">
          </div>
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
        <button class="btn btn-primary" onclick="Leaves.submitClaimOvertimeToken()"><i class="fa fa-paper-plane"></i> Submit Token Claim</button>
      `
    });
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
  },

  submitClaimOvertimeToken() {
    const empId = parseInt(document.getElementById('ot-claim-emp').value);
    const date = document.getElementById('ot-claim-date').value;
    const hours = parseFloat(document.getElementById('ot-claim-hours').value);
    const managerId = parseInt(document.getElementById('ot-claim-mgr-id').value) || 3;
    const taskDescription = document.getElementById('ot-claim-desc').value.trim();

    if (!date) { Toast.show('Please select date overtime was worked', 'error'); return; }
    if (isNaN(hours) || hours <= 0) { Toast.show('Please specify valid extra hours worked', 'error'); return; }
    if (!taskDescription || taskDescription.length < 5) {
      Toast.show('Please explain the assigned work or task description (minimum 5 characters)', 'error');
      return;
    }

    const tokens = DB.get('overtime_tokens') || [];
    const newClaim = {
      id: DB.nextId('overtime_tokens'),
      employeeId: empId,
      date,
      hours: Math.round(hours * 10) / 10,
      taskDescription,
      status: 'pending',
      appliedOn: Utils.today(),
      managerId,
      managerApprovedAt: null,
      managerRemarks: ''
    };

    tokens.push(newClaim);
    DB.set('overtime_tokens', tokens);
    DB.log('APPLY', 'Leaves', `Submitted overtime token claim (${hours}h) for ${Utils.getEmpName(empId)} on ${date}`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show('Overtime token claim submitted successfully!', 'success', `Sent to ${Utils.getEmpName(managerId)} for verification.`);
    this.render();
  },

  showAvailTokenModal() {
    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;
    const metrics = this.getEmployeeTokenMetrics(myEmpId);

    Modal.show('Avail Token as Compensatory Leave', `
      <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:14px">
        <!-- Live Token Balance Header -->
        <div style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(99,102,241,0.08));border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:14px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:12px;color:var(--text-3);font-weight:600">Your Current Available Token Balance</div>
            <div style="font-size:24px;font-weight:800;color:var(--success);margin-top:2px">
              ${metrics.balanceHours} <span style="font-size:14px;font-weight:600">Hours (${metrics.balanceDays} Days)</span>
            </div>
          </div>
          <span class="badge badge-success" style="font-size:12px;padding:6px 12px">
            <i class="fa fa-coins"></i> Banked Non-Cash Time
          </span>
        </div>

        ${metrics.balanceHours < 0.75 ? `
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px;font-size:12px;color:var(--danger)">
            <i class="fa fa-triangle-exclamation" style="margin-right:6px"></i>
            <strong>Insufficient Token Balance:</strong> The minimum required time to avail a token is <strong>45 minutes (0.75 hours)</strong>. You currently have <strong>${metrics.balanceHours} hours</strong>. Please earn approved overtime tokens before availing.
          </div>
        ` : ''}

        <div class="form-row form-row-2" style="margin-bottom:0">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-calendar-day" style="color:var(--primary);margin-right:4px"></i> Date of Leave</label>
            <input type="date" class="form-control" id="tk-avail-date" value="${Utils.today()}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label required"><i class="fa fa-layer-group" style="color:var(--primary);margin-right:4px"></i> Avail Leave As</label>
            <select class="form-control" id="tk-avail-type" onchange="Leaves.onAvailTypeChange(this.value)">
              <option value="short" selected>Short Leave (45 mins – 2 hrs)</option>
              <option value="half">Half Day Leave (4.0 Hours)</option>
              <option value="full">Full Day Leave (8.0 Hours)</option>
            </select>
          </div>
        </div>

        <!-- Short Leave Duration Configuration (Strictly Minimum 45 min) -->
        <div id="tk-short-section" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
          <label class="form-label required" style="font-size:12.5px;font-weight:700">
            <i class="fa fa-stopwatch" style="color:var(--primary);margin-right:4px"></i> Select Short Leave Duration
          </label>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <select class="form-control" id="tk-short-preset" style="flex:1" onchange="document.getElementById('tk-avail-mins').value=this.value; Leaves.updateAvailLiveCalculation()">
              <option value="45" selected>45 Minutes (0.75 hrs) — Standard Policy Minimum</option>
              <option value="60">60 Minutes (1.0 hr)</option>
              <option value="90">90 Minutes (1.5 hrs)</option>
              <option value="120">120 Minutes (2.0 hrs)</option>
            </select>
            <div style="display:flex;align-items:center;gap:6px">
              <input type="number" id="tk-avail-mins" class="form-control" style="width:90px" value="45" min="45" max="240" step="5" oninput="Leaves.updateAvailLiveCalculation()">
              <span style="font-size:12px;font-weight:600;color:var(--text-3)">mins</span>
            </div>
          </div>
          <div style="font-size:11px;color:#d97706;font-weight:600;margin-top:6px">
            <i class="fa fa-circle-info"></i> System Rule: The minimum time to avail an overtime token is 45 minutes.
          </div>
        </div>

        <!-- Live Calculation Preview Card -->
        <div id="tk-calc-preview" style="background:var(--surface-2);border-radius:8px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;font-size:12px">
          <div>
            Requested Token Time: <strong id="tk-calc-hrs" style="color:var(--primary);font-size:13px">0.75 Hours (45 mins)</strong>
          </div>
          <div id="tk-calc-rem" style="color:var(--text-3)">
            Remaining Balance After: <strong>${Math.max(0, Math.round((metrics.balanceHours - 0.75)*100)/100)} hrs</strong>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label required"><i class="fa fa-comment-dots" style="color:var(--primary);margin-right:4px"></i> Purpose / Reason for Token Leave</label>
          <textarea class="form-control" id="tk-avail-reason" rows="2" placeholder="e.g. Urgent banking errand, personal doctor visit, family obligation..."></textarea>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-success" id="tk-submit-btn" onclick="Leaves.submitAvailToken()"><i class="fa fa-check"></i> Avail Token Leave</button>
      `
    });

    setTimeout(() => this.updateAvailLiveCalculation(), 20);
  },

  onAvailTypeChange(type) {
    const shortSec = document.getElementById('tk-short-section');
    if (shortSec) {
      shortSec.style.display = type === 'short' ? 'block' : 'none';
    }
    this.updateAvailLiveCalculation();
  },

  updateAvailLiveCalculation() {
    const myEmp = Auth.employee || DB.find('employees', 4);
    const metrics = this.getEmployeeTokenMetrics(myEmp?.id || 4);
    const type = document.getElementById('tk-avail-type')?.value || 'short';
    let reqHours = 0.75;
    let reqMins = 45;

    if (type === 'short') {
      reqMins = parseInt(document.getElementById('tk-avail-mins')?.value) || 45;
      reqHours = Math.round((reqMins / 60) * 100) / 100;
    } else if (type === 'half') {
      reqHours = 4.0;
      reqMins = 240;
    } else if (type === 'full') {
      reqHours = 8.0;
      reqMins = 480;
    }

    const hrsEl = document.getElementById('tk-calc-hrs');
    const remEl = document.getElementById('tk-calc-rem');
    const btn = document.getElementById('tk-submit-btn');

    if (hrsEl) {
      hrsEl.textContent = `${reqHours} Hours (${reqMins} mins)`;
    }
    if (remEl) {
      const rem = Math.round((metrics.balanceHours - reqHours) * 100) / 100;
      if (rem < 0) {
        remEl.innerHTML = `<span style="color:var(--danger);font-weight:700"><i class="fa fa-circle-exclamation"></i> Exceeds Balance by ${Math.abs(rem)}h</span>`;
        if (btn) btn.disabled = true;
      } else if (type === 'short' && reqMins < 45) {
        remEl.innerHTML = `<span style="color:var(--danger);font-weight:700"><i class="fa fa-circle-exclamation"></i> Min 45 mins required</span>`;
        if (btn) btn.disabled = true;
      } else {
        remEl.innerHTML = `Remaining Balance After: <strong style="color:var(--success)">${rem} hrs</strong>`;
        if (btn) btn.disabled = false;
      }
    }
  },

  submitAvailToken() {
    const myEmp = Auth.employee || DB.find('employees', 4);
    const myEmpId = myEmp?.id || 4;
    const metrics = this.getEmployeeTokenMetrics(myEmpId);

    const date = document.getElementById('tk-avail-date').value;
    const type = document.getElementById('tk-avail-type').value;
    const reason = document.getElementById('tk-avail-reason').value.trim();

    if (!date) { Toast.show('Please select date of leave', 'error'); return; }
    if (!reason) { Toast.show('Please provide a reason for availing token leave', 'error'); return; }

    let reqHours = 0;
    let reqMins = 0;

    if (type === 'short') {
      reqMins = parseInt(document.getElementById('tk-avail-mins')?.value) || 0;
      // Minimum duration validation (45 minutes)
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

    // Balance check
    if (reqHours > metrics.balanceHours) {
      Toast.show(`Insufficient token balance! Requested: ${reqHours}h, Available: ${metrics.balanceHours}h`, 'error');
      return;
    }

    const availments = DB.get('token_availments') || [];
    const newAvail = {
      id: DB.nextId('token_availments'),
      employeeId: myEmpId,
      date,
      leaveDuration: type,
      minutes: reqMins,
      hours: reqHours,
      days: Math.round((reqHours / 8) * 100) / 100,
      reason,
      status: 'approved',
      appliedOn: new Date().toISOString()
    };
    availments.push(newAvail);
    DB.set('token_availments', availments);

    // Also insert into leave_requests as Type 10 (Token Leave) to integrate seamlessly with calendar & Leave Quota matrix
    const leaves = DB.get('leave_requests') || [];
    const typeName = type === 'short' ? `Short Leave (${reqMins}m)` : (type === 'half' ? 'Half Day' : 'Full Day');
    const newLeaveReq = {
      id: DB.nextId('leave_requests'),
      employeeId: myEmpId,
      typeId: 10, // Token Leave
      fromDate: date,
      toDate: date,
      days: Math.round((reqHours / 8) * 100) / 100,
      status: 'approved',
      managerStatus: 'approved',
      hrStatus: 'approved',
      reason: `[Overtime Token Availment: ${typeName}] ${reason}`,
      appliedOn: Utils.today(),
      remarks: `Availed from banked overtime tokens (${reqHours}h)`
    };
    leaves.push(newLeaveReq);
    DB.set('leave_requests', leaves);

    DB.log('APPLY', 'Leaves', `Availed ${reqHours}h (${type}) Overtime Token Leave for ${myEmp.fullName} on ${date}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Token leave applied successfully! Deducted ${reqHours}h from your token balance.`, 'success');
    this.render();
  },

  approveOvertimeToken(tokenId) {
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
};
