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
        <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border)">
          ${[
            { id:'requests', label:'Leave Requests', icon:'fa-list' },
            { id:'calendar', label:'Leave Calendar', icon:'fa-calendar' },
            { id:'quota',    label:'Leave Quota & Balance',  icon:'fa-scale-balanced' },
            { id:'types',    label:'Leave Types',    icon:'fa-tags' },
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
    this.currentView = view;
    document.querySelectorAll('[onclick*="Leaves.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\w+)'/);
      if (m) b.classList.toggle('active', m[1] === view);
    });
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
      case 'types':    this.renderTypes(container); break;
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


  renderQuota(container) {
    const isEmployee = Auth.role === 'employee';
    const types = DB.get('leave_types') || [];
    const balances = DB.get('leave_balances') || [];
    const allEmps = DB.get('employees') || [];
    const isHrOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    if (isEmployee) {
      // ── EMPLOYEE VIEW: PERSONAL LEAVE QUOTA ONLY (VIEW-ONLY, NO EDIT/ADD) ──
      const myEmp = Auth.employee || allEmps.find(e => e.id === Auth.user?.employeeId) || allEmps[0];
      const myBal = balances.find(b => b.employeeId === myEmp.id);
      const myLeaves = (DB.get('leave_requests') || []).filter(l => l.employeeId === myEmp.id && l.status === 'approved');

      let totalAllocated = 0;
      let totalUsed = 0;

      const typeStats = types.map(t => {
        const allocated = myBal?.quotas?.[t.id] ?? t.maxDays;
        const used = myLeaves.filter(l => l.typeId === t.id).reduce((s, l) => s + l.days, 0);
        const rem = myBal?.balances?.[t.id] ?? Math.max(0, allocated - used);
        const pct = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;
        totalAllocated += allocated;
        totalUsed += used;
        return { type: t, allocated, used, rem, pct };
      });

      const totalRemaining = Math.max(0, totalAllocated - totalUsed);

      container.innerHTML = `
        <div class="animate-fade-in">
          <!-- Banner -->
          <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(236,72,153,0.12) 100%);border:1px solid rgba(99,102,241,0.25);border-radius:16px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="badge" style="background:rgba(236,72,153,0.2);color:#ec4899;font-size:11px"><i class="fa fa-lock" style="margin-right:4px"></i>Personal Quota (View-Only)</span>
                <span class="chip" style="font-size:11px">Entitlement Year: 2026</span>
              </div>
              <h2 style="font-size:20px;font-weight:800;margin:0 0 4px 0">${myEmp.fullName} — Leave Quota & Entitlement</h2>
              <div style="font-size:12.5px;color:var(--text-3)">${Utils.getDeptName(myEmp.departmentId)} • ${Utils.getDesigName(myEmp.designationId)} • Emp #: ${myEmp.empNo}</div>
            </div>
            <div>
              <button class="btn btn-primary btn-sm" onclick="Leaves.showApplyForm()"><i class="fa fa-calendar-plus"></i> Apply for Leave</button>
            </div>
          </div>

          <!-- Overall Summary Cards -->
          <div class="grid-3 mb-20">
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;border-left:4px solid var(--primary)">
              <div style="font-size:26px;font-weight:800;color:var(--primary)">${totalAllocated}</div>
              <div style="font-size:12px;color:var(--text-3)">Total Annual Quota Entitled</div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;border-left:4px solid var(--warning)">
              <div style="font-size:26px;font-weight:800;color:var(--warning)">${totalUsed}</div>
              <div style="font-size:12px;color:var(--text-3)">Approved Leave Days Taken</div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;border-left:4px solid var(--success)">
              <div style="font-size:26px;font-weight:800;color:var(--success)">${totalRemaining}</div>
              <div style="font-size:12px;color:var(--text-3)">Total Balance Remaining</div>
            </div>
          </div>

          <!-- Per Leave Type Quota Cards -->
          <div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--text)">Leave Type Quota Breakdown</div>
          <div class="grid-3 mb-20">
            ${typeStats.map(s => {
              const t = s.type;
              const color = t.color || 'var(--primary)';
              const isLow = s.rem <= s.allocated * 0.3;
              const isExhausted = s.rem === 0;
              return `
                <div class="quota-card" style="border-top:4px solid ${color}">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                    <span class="badge" style="background:${color}22;color:${color};font-size:12px;font-weight:700">${t.code}</span>
                    <span class="badge ${isExhausted ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}">
                      ${isExhausted ? 'Exhausted' : isLow ? 'Running Low' : 'Available'}
                    </span>
                  </div>
                  <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">${t.name}</div>
                  
                  <div style="display:flex;align-items:baseline;gap:6px">
                    <div style="font-size:32px;font-weight:800;color:${isExhausted?'var(--danger)':color}">${s.rem}</div>
                    <div style="font-size:12px;color:var(--text-3)">days available</div>
                  </div>

                  <div class="quota-progress-bar">
                    <div class="quota-progress-fill" style="width:${s.pct}%;background:${color}"></div>
                  </div>

                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--text-3)">
                    <span>${s.used} days used</span>
                    <span>Quota: ${s.allocated} days</span>
                  </div>
                  ${t.carryForward ? '<div style="margin-top:8px;font-size:10.5px;color:var(--accent)"><i class="fa fa-rotate-right" style="margin-right:4px"></i>Eligible for carry forward</div>' : ''}
                </div>
              `;
            }).join('')}
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

    // ── HR MANAGER & SUPERADMIN VIEW: MANAGEMENT & ALLOCATION CONSOLE ──
    const activeEmps = isDeptMgr ? allEmps.filter(e => (e.managerId === myEmp?.id || e.reportingTo === myEmp?.id) && e.status === 'active') : allEmps.filter(e => e.status === 'active');
    const allApprovedLeaves = DB.get('leave_requests') || [];

    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <div>
            <h3 style="font-size:18px;font-weight:800;margin:0 0 4px 0">Annual Leave Quotas & Balances — 2026</h3>
            <div style="font-size:12.5px;color:var(--text-3)">Set, adjust, and regulate employee annual leave entitlements per leave type</div>
          </div>
          ${isHrOrAdmin ? `
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost btn-sm" onclick="Leaves.bulkAllocateQuotas()"><i class="fa fa-wand-magic-sparkles"></i> Bulk Allocate 2026 Quotas</button>
              <button class="btn btn-primary btn-sm" onclick="Leaves.showSetQuotaModal()"><i class="fa fa-plus"></i> Set / Allocate Quota</button>
            </div>
          ` : ''}
        </div>

        <div class="card" style="padding:0">
          <div class="table-wrapper" style="border:none;border-radius:0">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  ${types.map(t => `<th style="text-align:center">${t.code}<br><span style="font-size:10px;font-weight:400;color:var(--text-muted)">Alloc/Used/Rem</span></th>`).join('')}
                  <th style="text-align:center">Total Quota</th>
                  <th style="text-align:center">Total Remaining</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${activeEmps.map(emp => {
                  const bal = balances.find(b => b.employeeId === emp.id);
                  const empLeaves = allApprovedLeaves.filter(l => l.employeeId === emp.id && l.status === 'approved');
                  
                  let totalAlloc = 0;
                  let totalUsed = 0;
                  let totalRem = 0;

                  const typeCols = types.map(t => {
                    const alloc = bal?.quotas?.[t.id] ?? t.maxDays;
                    const used = empLeaves.filter(l => l.typeId === t.id).reduce((s, l) => s + l.days, 0);
                    const rem = bal?.balances?.[t.id] ?? Math.max(0, alloc - used);
                    totalAlloc += alloc;
                    totalUsed += used;
                    totalRem += rem;

                    const color = rem > alloc * 0.5 ? 'var(--success)' : rem > alloc * 0.2 ? 'var(--warning)' : 'var(--danger)';
                    return `
                      <td style="text-align:center;font-size:12px">
                        <span style="color:var(--text-3)">${alloc}</span> /
                        <span style="color:var(--warning)">${used}</span> /
                        <strong style="color:${color}">${rem}</strong>
                      </td>
                    `;
                  }).join('');

                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:10px">
                          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                          <div>
                            <div style="font-weight:700;font-size:13px">${emp.fullName}</div>
                            <div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div>
                          </div>
                        </div>
                      </td>
                      <td>${Utils.getDeptName(emp.departmentId)}</td>
                      ${typeCols}
                      <td style="text-align:center;font-weight:700">${totalAlloc} days</td>
                      <td style="text-align:center"><strong style="color:var(--success);font-size:13px">${totalRem} days</strong></td>
                      <td style="text-align:right">
                        ${isHrOrAdmin ? `
                          <button class="btn btn-ghost btn-sm" onclick="Leaves.showSetQuotaModal(${emp.id})" title="Edit Quotas">
                            <i class="fa fa-pen"></i> Edit Quota
                          </button>
                        ` : '—'}
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

  renderTypes(container) {
    const types = DB.get('leave_types');
    container.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `<button class="btn btn-primary btn-sm" onclick="Leaves.showAddType()"><i class="fa fa-plus"></i> Add Leave Type</button>` : ''}
      </div>
      <div class="grid-3">
        ${types.map(t => `
          <div class="card" style="border-top:4px solid ${t.color}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <span class="badge" style="background:${t.color}22;color:${t.color};font-size:13px">${t.code}</span>
              ${t.carryForward ? '<span class="chip" style="font-size:10px">Carry Forward</span>' : ''}
            </div>
            <div style="font-size:16px;font-weight:700;margin-bottom:4px">${t.name}</div>
            <div style="font-size:28px;font-weight:800;color:${t.color};margin-bottom:4px">${t.maxDays}</div>
            <div style="font-size:12px;color:var(--text-3)">days per year</div>
          </div>
        `).join('')}
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
};
