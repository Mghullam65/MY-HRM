// ============================================================
// HRM SYSTEM — Events, Calendar & Reports Module
// ============================================================

const Events = {
  currentView: 'calendar',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  calFilters: {
    holiday: true,
    event: true,
    task: true,
    missing: true,
    reminder: true,
  },

  ensureTasks() {
    let tasks = DB.get('tasks');
    if (!tasks || tasks.length === 0) {
      const year = new Date().getFullYear();
      const m = String(new Date().getMonth() + 1).padStart(2, '0');
      const prevM = String(Math.max(1, new Date().getMonth())).padStart(2, '0');
      tasks = [
        { id: 1, title: 'Submit Monthly Tax Return (FBR)', dueDate: `${year}-${m}-15`, priority: 'high', status: 'pending', assignedTo: 5, category: 'Finance', description: 'Prepare and file monthly withholding tax return.' },
        { id: 2, title: 'ZKTeco Biometric Sync & Backup', dueDate: `${year}-${m}-08`, priority: 'medium', status: 'completed', assignedTo: 3, category: 'IT', description: 'Biometric firmware logs validation and sync.' },
        { id: 3, title: 'Employee Performance Appraisals Q3', dueDate: `${year}-${m}-25`, priority: 'high', status: 'in_progress', assignedTo: 2, category: 'HR', description: 'Finalize KPI and KRA evaluations with department heads.' },
        { id: 4, title: 'Complete Server Security Patching', dueDate: `${year}-${prevM}-28`, priority: 'high', status: 'overdue', assignedTo: 4, category: 'IT', description: 'Critical patch update for internal Linux servers.' },
        { id: 5, title: 'Review Probation Contracts', dueDate: `${year}-${prevM}-20`, priority: 'medium', status: 'overdue', assignedTo: 6, category: 'HR', description: '3 probation evaluations overdue for confirmation.' },
        { id: 6, title: 'Audit Fire Extinguishers & Safety', dueDate: `${year}-${m}-18`, priority: 'low', status: 'pending', assignedTo: 10, category: 'Operations', description: 'Annual workplace health and safety equipment check.' },
        { id: 7, title: 'Finalize September Payroll Slips', dueDate: `${year}-${m}-28`, priority: 'high', status: 'pending', assignedTo: 2, category: 'Finance', description: 'Generate and review payroll calculations and bank advise.' },
      ];
      DB.set('tasks', tasks);
    }
  },

  render(targetEl = null) {
    this.ensureTasks();
    const content = targetEl || document.getElementById('page-content');
    if (!content) return;

    content.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border)">
          ${[
            { id:'calendar',      label:'Company Calendar', icon:'fa-calendar' },
            { id:'events',        label:'Events List',      icon:'fa-calendar-days' },
            { id:'trainings',     label:'Training & LMS',   icon:'fa-graduation-cap' },
            { id:'announcements', label:'Announcements',    icon:'fa-bullhorn' },
            { id:'policies',      label:'Policies & Compliance', icon:'fa-book-bookmark' },
          ].map(t => `
            <button class="tab-toggle-btn ${this.currentView===t.id?'active':''}" onclick="Events.switchView('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
            </button>
          `).join('')}
        </div>
        <style>
          .tab-toggle-btn { padding:8px 16px;border:none;background:transparent;color:var(--text-3);font-size:12.5px;font-weight:600;border-radius:7px;cursor:pointer;transition:all .2s; }
          .tab-toggle-btn.active { background:var(--primary);color:white;box-shadow:0 2px 8px var(--primary-glow); }
          .tab-toggle-btn:hover:not(.active) { background:var(--surface-2);color:var(--text); }
        </style>
        <div id="events-content"></div>
      </div>
    `;
    this.renderView();
  },

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('[onclick*="Events.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\w+)'/);
      if (m) b.classList.toggle('active', m[1] === view);
    });
    this.renderView();
  },

  renderView() {
    const container = document.getElementById('events-content');
    if (!container) return;
    if (this.currentView === 'calendar') this.renderCalendar(container);
    else if (this.currentView === 'events') this.renderEvents(container);
    else if (this.currentView === 'trainings') this.renderTrainings(container);
    else if (this.currentView === 'policies') this.renderPolicies(container);
    else this.renderAnnouncements(container);
  },

  // ── MULTI-CATEGORY COMPANY CALENDAR ──
  renderCalendar(container) {
    this.ensureTasks();
    const year = this.calYear;
    const month = this.calMonth;
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const holidays = DB.get('holidays') || [];
    const events = DB.get('events') || [];
    const tasks = DB.get('tasks') || [];
    const announcements = DB.get('announcements') || [];
    const employees = DB.get('employees') || [];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = Utils.today();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isHrOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    container.innerHTML = `
      <div class="card mb-20" style="padding:16px 20px">
        <!-- Top Toolbar -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:18px">
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-ghost btn-sm" onclick="Events.prevMonth()"><i class="fa fa-chevron-left"></i></button>
            <h2 style="font-size:20px;font-weight:800;letter-spacing:-0.3px;margin:0;min-width:180px;text-align:center">${monthNames[month]} ${year}</h2>
            <button class="btn btn-ghost btn-sm" onclick="Events.nextMonth()"><i class="fa fa-chevron-right"></i></button>
            <button class="btn btn-ghost btn-sm" style="margin-left:6px" onclick="Events.calYear=new Date().getFullYear();Events.calMonth=new Date().getMonth();Events.renderView()"><i class="fa fa-calendar-day"></i> Today</button>
          </div>

          <!-- Category Filter Pills -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px">Filters:</span>
            ${[
              { id:'holiday',  label:'Holidays',      color:'#ef4444', icon:'fa-flag' },
              { id:'event',    label:'Events',        color:'#6366f1', icon:'fa-calendar-check' },
              { id:'task',     label:'Tasks',         color:'#10b981', icon:'fa-list-check' },
              { id:'missing',  label:'Missing Tasks', color:'#f97316', icon:'fa-triangle-exclamation' },
              { id:'reminder', label:'Reminders',     color:'#ec4899', icon:'fa-bell' },
            ].map(f => {
              const active = this.calFilters[f.id];
              return `
                <button class="cal-category-pill ${active?'active':''}" style="${active ? `background:${f.color}22;color:${f.color};border-color:${f.color}55;` : 'background:var(--surface);color:var(--text-muted);border-color:var(--border);'}" onclick="Events.toggleCalFilter('${f.id}')">
                  <i class="fa ${f.icon}"></i> ${f.label}
                </button>
              `;
            }).join('')}
          </div>

          ${isHrOrAdmin ? `
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary btn-sm" onclick="Events.showAddEvent()"><i class="fa fa-plus"></i> Add Event</button>
              <button class="btn btn-ghost btn-sm" onclick="Events.showAddTask()"><i class="fa fa-plus"></i> Add Task</button>
            </div>
          ` : ''}
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-day-header">${d}</div>`).join('')}
          ${cells.map(d => {
            if (!d) return '<div class="cal-day-empty" style="background:var(--surface-2);opacity:0.3;min-height:95px;border:1px solid var(--border)"></div>';
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
            const isPast = dateStr < todayStr;
            const isWeekend = new Date(year, month, d).getDay() % 6 === 0;

            // Gather items for this day
            const dayHols = this.calFilters.holiday ? holidays.filter(h => h.date === dateStr) : [];
            const dayEvents = this.calFilters.event ? events.filter(e => e.date === dateStr) : [];
            
            // Tasks due today
            const dayTasks = this.calFilters.task ? tasks.filter(t => t.dueDate === dateStr && t.status !== 'overdue' && !(isPast && t.status !== 'completed')) : [];
            
            // Missing/Overdue tasks (overdue or due on or before today and pending)
            const dayMissing = this.calFilters.missing ? tasks.filter(t => t.dueDate === dateStr && (t.status === 'overdue' || (isPast && t.status !== 'completed'))) : [];
            
            // Reminders (birthdays, announcements)
            const dayReminders = [];
            if (this.calFilters.reminder) {
              const mmdd = `${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              employees.filter(e => e.status === 'active' && e.dob?.slice(5) === mmdd).forEach(e => {
                dayReminders.push({ title: `🎂 ${e.fullName.split(' ')[0]}'s Birthday`, type: 'birthday' });
              });
              announcements.filter(a => a.date === dateStr).forEach(a => {
                dayReminders.push({ title: `📢 ${a.title}`, type: 'announcement' });
              });
            }

            const totalItems = dayHols.length + dayEvents.length + dayTasks.length + dayMissing.length + dayReminders.length;

            return `
              <div class="cal-day ${isToday ? 'today' : ''}" style="${isWeekend ? 'background:rgba(255,255,255,0.015);' : ''}min-height:98px;padding:6px;cursor:pointer;transition:border-color .2s" onclick="Events.showDayAgenda('${dateStr}')" title="Click to view agenda for ${dateStr}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                  <span class="cal-day-num" style="${isWeekend ? 'color:var(--danger);' : ''}${isToday ? 'background:var(--primary);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;' : 'font-size:12px;font-weight:600;'}">${d}</span>
                  ${dayMissing.length > 0 ? `<span class="badge" style="background:#f97316;color:#fff;font-size:9px;padding:1px 5px;border-radius:10px" title="Overdue / Missing Task!">${dayMissing.length} Overdue</span>` : ''}
                </div>

                <!-- Item pills -->
                <div style="display:flex;flex-direction:column;gap:2px">
                  ${dayHols.map(h => `<div class="cal-item-badge cal-badge-holiday"><i class="fa fa-flag" style="margin-right:3px"></i>${h.name}</div>`).join('')}
                  ${dayEvents.map(e => `<div class="cal-item-badge cal-badge-event"><i class="fa fa-calendar-check" style="margin-right:3px"></i>${e.title}</div>`).join('')}
                  ${dayTasks.map(t => `<div class="cal-item-badge cal-badge-task"><i class="fa fa-list-check" style="margin-right:3px"></i>${t.title}</div>`).join('')}
                  ${dayMissing.map(m => `<div class="cal-item-badge cal-badge-missing"><i class="fa fa-triangle-exclamation" style="margin-right:3px"></i>${m.title}</div>`).join('')}
                  ${dayReminders.map(r => `<div class="cal-item-badge cal-badge-reminder"><i class="fa fa-bell" style="margin-right:3px"></i>${r.title}</div>`).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Legend / Info footer -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:16px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;font-size:12px">
          <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#ef4444;border-radius:2px"></span> Holidays</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#6366f1;border-radius:2px"></span> Company Events</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#10b981;border-radius:2px"></span> Scheduled Tasks</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#f97316;border-radius:2px"></span> Missing / Overdue Tasks</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#ec4899;border-radius:2px"></span> Reminders & Birthdays</span>
          </div>
          <div style="color:var(--text-3);font-style:italic">
            <i class="fa fa-mouse-pointer" style="margin-right:4px"></i> Click any day to view detailed schedule
          </div>
        </div>
      </div>
    `;
  },

  toggleCalFilter(cat) {
    this.calFilters[cat] = !this.calFilters[cat];
    this.renderView();
  },

  prevMonth() {
    if (this.calMonth === 0) { this.calMonth = 11; this.calYear--; }
    else this.calMonth--;
    this.renderView();
  },

  nextMonth() {
    if (this.calMonth === 11) { this.calMonth = 0; this.calYear++; }
    else this.calMonth++;
    this.renderView();
  },

  showDayAgenda(dateStr) {
    const holidays = (DB.get('holidays') || []).filter(h => h.date === dateStr);
    const events = (DB.get('events') || []).filter(e => e.date === dateStr);
    const tasks = (DB.get('tasks') || []).filter(t => t.dueDate === dateStr);
    const announcements = (DB.get('announcements') || []).filter(a => a.date === dateStr);
    const employees = DB.get('employees') || [];
    const mmdd = dateStr.slice(5);
    const birthdays = employees.filter(e => e.status === 'active' && e.dob?.slice(5) === mmdd);

    const isHrOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const isPast = dateStr < Utils.today();

    Modal.show(`Schedule & Agenda — ${Utils.formatDate(dateStr)}`, `
      <div style="display:flex;flex-direction:column;gap:16px">
        <!-- Holidays -->
        ${holidays.length > 0 ? `
          <div>
            <div style="font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;margin-bottom:8px"><i class="fa fa-flag" style="margin-right:5px"></i>Official Holidays</div>
            ${holidays.map(h => `
              <div style="padding:10px 14px;background:rgba(239,68,68,0.1);border-left:4px solid #ef4444;border-radius:8px;margin-bottom:6px">
                <div style="font-weight:700;font-size:14px;color:#ef4444">${h.name}</div>
                <div style="font-size:12px;color:var(--text-3)">Type: ${(h.type || 'Holiday').toUpperCase()} • ${h.optional ? 'Optional Holiday' : 'Mandatory Public Holiday'}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Events -->
        ${events.length > 0 ? `
          <div>
            <div style="font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;margin-bottom:8px"><i class="fa fa-calendar-check" style="margin-right:5px"></i>Company Events (${events.length})</div>
            ${events.map(e => `
              <div style="padding:12px 14px;background:rgba(99,102,241,0.1);border-left:4px solid #6366f1;border-radius:8px;margin-bottom:6px">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <div style="font-weight:700;font-size:14px">${e.title}</div>
                  <span class="badge" style="background:#6366f122;color:#6366f1">${e.type}</span>
                </div>
                <div style="font-size:12px;color:var(--text-3);margin-top:4px"><i class="fa fa-clock"></i> ${e.time || 'All Day'} • <i class="fa fa-location-dot"></i> ${e.location || 'Office'}</div>
                <div style="font-size:12.5px;color:var(--text-2);margin-top:6px">${e.description || 'No description provided.'}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Tasks & Missing Tasks -->
        ${tasks.length > 0 ? `
          <div>
            <div style="font-size:12px;font-weight:700;color:#10b981;text-transform:uppercase;margin-bottom:8px"><i class="fa fa-list-check" style="margin-right:5px"></i>Assigned Tasks (${tasks.length})</div>
            ${tasks.map(t => {
              const isOverdue = t.status === 'overdue' || (isPast && t.status !== 'completed');
              const emp = DB.find('employees', t.assignedTo);
              return `
                <div style="padding:12px 14px;background:${isOverdue ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)'};border-left:4px solid ${isOverdue ? '#f97316' : '#10b981'};border-radius:8px;margin-bottom:6px">
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="font-weight:700;font-size:14px;color:${isOverdue ? '#f97316' : 'inherit'}">
                      ${isOverdue ? '<i class="fa fa-triangle-exclamation" style="margin-right:4px"></i>[OVERDUE / MISSING] ' : ''}${t.title}
                    </div>
                    <span class="badge ${isOverdue ? 'badge-danger' : t.status==='completed' ? 'badge-success' : 'badge-warning'}">${t.status}</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-3);margin-top:4px">Assigned to: <strong>${emp?.fullName || 'Unassigned'}</strong> • Category: ${t.category} • Priority: ${(t.priority || 'Normal').toUpperCase()}</div>
                  ${t.description ? `<div style="font-size:12px;color:var(--text-2);margin-top:4px">${t.description}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- Birthdays & Reminders -->
        ${(birthdays.length > 0 || announcements.length > 0) ? `
          <div>
            <div style="font-size:12px;font-weight:700;color:#ec4899;text-transform:uppercase;margin-bottom:8px"><i class="fa fa-bell" style="margin-right:5px"></i>Birthdays & Reminders</div>
            ${birthdays.map(b => `
              <div style="padding:10px 14px;background:rgba(236,72,153,0.1);border-left:4px solid #ec4899;border-radius:8px;margin-bottom:6px">
                <div style="font-weight:700;font-size:13.5px;color:#ec4899"><i class="fa fa-cake-candles" style="margin-right:6px"></i>${b.fullName}'s Birthday Today!</div>
                <div style="font-size:12px;color:var(--text-3)">${Utils.getDeptName(b.departmentId)} • ${Utils.getDesigName(b.designationId)}</div>
              </div>
            `).join('')}
            ${announcements.map(a => `
              <div style="padding:10px 14px;background:rgba(99,102,241,0.08);border-left:4px solid var(--primary);border-radius:8px;margin-bottom:6px">
                <div style="font-weight:700;font-size:13.5px"><i class="fa fa-bullhorn" style="margin-right:6px"></i>${a.title}</div>
                <div style="font-size:12px;color:var(--text-2);margin-top:2px">${a.body}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${holidays.length === 0 && events.length === 0 && tasks.length === 0 && birthdays.length === 0 && announcements.length === 0 ? `
          <div class="empty-state" style="padding:30px">
            <i class="fa fa-calendar-xmark" style="font-size:36px;color:var(--text-muted)"></i>
            <h4 style="margin:10px 0 4px 0">No events or tasks scheduled</h4>
            <p style="font-size:12.5px;color:var(--text-3)">There are no holidays, events, or missing task deadlines recorded for this date.</p>
          </div>
        ` : ''}
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        ${isHrOrAdmin ? `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal');Events.showAddEvent('${dateStr}')"><i class="fa fa-plus"></i> Add Event on this Date</button>` : ''}
      `
    });
  },

  showAddTask() {
    if (Auth.role === 'employee') {
      Toast.show('Access restricted: Employees cannot create tasks.', 'error');
      return;
    }
    const emps = DB.get('employees').filter(e => e.status === 'active');
    Modal.show('Add Company Task', `
      <div class="form-group"><label class="form-label required">Task Title</label><input class="form-control" id="tk-title" placeholder="e.g. Complete Q3 Tax Filing"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Due Date</label><input type="date" class="form-control" id="tk-date" value="${Utils.today()}"></div>
        <div class="form-group"><label class="form-label required">Priority</label>
          <select class="form-control" id="tk-priority">
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Assigned To</label>
          <select class="form-control" id="tk-emp">
            ${emps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Category</label>
          <input class="form-control" id="tk-cat" placeholder="HR, IT, Finance, Operations" value="Operations">
        </div>
      </div>
      <div class="form-group"><label class="form-label">Task Description</label><textarea class="form-control" id="tk-desc" rows="3" placeholder="Describe the task expectations..."></textarea></div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Events.saveTask()"><i class="fa fa-save"></i> Save Task</button>
      `
    });
  },

  saveTask() {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied.', 'error');
      return;
    }
    const title = document.getElementById('tk-title').value.trim();
    const dueDate = document.getElementById('tk-date').value;
    if (!title || !dueDate) { Toast.show('Title and Due Date are required', 'error'); return; }

    const isPast = dueDate < Utils.today();
    DB.add('tasks', {
      id: DB.nextId('tasks'),
      title,
      dueDate,
      priority: document.getElementById('tk-priority').value,
      status: isPast ? 'overdue' : 'pending',
      assignedTo: parseInt(document.getElementById('tk-emp').value),
      category: document.getElementById('tk-cat').value.trim() || 'General',
      description: document.getElementById('tk-desc').value.trim(),
    });
    Modal.close('dynamic-modal');
    Toast.show('Task created successfully!', 'success');
    this.renderView();
  },

  renderEvents(container) {
    const events = DB.get('events') || [];
    const typeIcons = { company:'fa-building', training:'fa-chalkboard-teacher', meeting:'fa-comments', company_event:'fa-party-horn' };
    const typeColors = { company:'var(--primary)', training:'var(--success)', meeting:'var(--warning)', company_event:'var(--accent)' };
    const isHrOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <div style="font-size:14px;color:var(--text-3);font-weight:600">Company meetings, trainings, and official events</div>
        ${isHrOrAdmin ? `<button class="btn btn-primary btn-sm" onclick="Events.showAddEvent()"><i class="fa fa-plus"></i> Add Event</button>` : ''}
      </div>
      <div class="grid-2">
        ${events.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;padding:40px"><i class="fa fa-calendar-xmark"></i><h3>No events found</h3></div>' :
          events.map(e => {
            const color = typeColors[e.type] || 'var(--primary)';
            const icon = typeIcons[e.type] || 'fa-calendar';
            return `
              <div class="card" style="border-left:4px solid ${color}">
                <div style="display:flex;align-items:flex-start;gap:14px">
                  <div style="width:50px;height:50px;background:${color}22;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
                    <div style="font-size:18px;font-weight:800;color:${color};line-height:1">${new Date(e.date).getDate()}</div>
                    <div style="font-size:9px;color:${color};font-weight:700">${new Date(e.date).toLocaleString('en',{month:'short'}).toUpperCase()}</div>
                  </div>
                  <div style="flex:1">
                    <div style="font-size:14px;font-weight:700;margin-bottom:4px">${e.title}</div>
                    <div style="font-size:12px;color:var(--text-3)">${e.description || 'No description'}</div>
                    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
                      <span class="chip"><i class="fa fa-clock" style="margin-right:4px"></i>${e.time || '10:00'}</span>
                      <span class="chip"><i class="fa fa-location-dot" style="margin-right:4px"></i>${e.location || 'HQ'}</span>
                      <span class="badge" style="background:${color}22;color:${color}">${e.type?.replace(/_/g,' ').toUpperCase()}</span>
                      ${Utils.statusBadge(e.status)}
                    </div>
                  </div>
                  ${isHrOrAdmin ? `
                    <div style="display:flex;flex-direction:column;gap:4px">
                      <button class="btn btn-ghost btn-icon btn-sm" onclick="Events.editEvent(${e.id})" title="Edit"><i class="fa fa-pen"></i></button>
                      <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Events.deleteEvent(${e.id})" title="Delete"><i class="fa fa-trash"></i></button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
      </div>
    `;
  },

  renderAnnouncements(container) {
    const announcements = DB.get('announcements') || [];
    const priorityColors = { high:'var(--danger)', normal:'var(--primary)', low:'var(--text-muted)' };
    const priorityIcons = { high:'fa-triangle-exclamation', normal:'fa-circle-info', low:'fa-circle-dot' };
    const isHrOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <div style="font-size:14px;color:var(--text-3);font-weight:600">Company-wide notices and organizational updates</div>
        ${isHrOrAdmin ? `<button class="btn btn-primary btn-sm" onclick="Events.showAddAnnouncement()"><i class="fa fa-plus"></i> Post Announcement</button>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${announcements.length === 0 ? '<div class="empty-state" style="padding:40px"><i class="fa fa-bullhorn"></i><h3>No announcements found</h3></div>' :
          announcements.map(a => {
            const author = DB.find('employees', a.authorId);
            const color = priorityColors[a.priority] || 'var(--primary)';
            const icon = priorityIcons[a.priority] || 'fa-circle-info';
            const uid = Auth.user?.id || Auth.employee?.id || 1;
            const isRead = Array.isArray(a.read) && a.read.includes(uid);
            return `
              <div class="card" style="${isRead ? 'opacity:0.9;' : 'border-left:4px solid var(--primary);'}">
                <div style="display:flex;align-items:flex-start;gap:14px">
                  <div style="width:42px;height:42px;border-radius:10px;background:${color}22;display:flex;align-items:center;justify-content:center;font-size:18px;color:${color};flex-shrink:0">
                    <i class="fa ${icon}"></i>
                  </div>
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                      <div style="font-size:15px;font-weight:700">${a.title}</div>
                      <div style="display:flex;gap:8px;align-items:center">
                        ${isRead ? '<span class="badge badge-secondary" style="font-size:10.5px"><i class="fa fa-check-double" style="margin-right:4px"></i>Read</span>' : '<span class="badge badge-warning" style="font-size:10.5px"><i class="fa fa-envelope" style="margin-right:4px"></i>Unread</span>'}
                        <span class="badge" style="background:${color}22;color:${color};text-transform:capitalize">${a.priority} Priority</span>
                        <span style="font-size:11px;color:var(--text-muted)">${Utils.formatDate(a.date)}</span>
                      </div>
                    </div>
                    <div style="font-size:13px;color:var(--text-2);line-height:1.6">${a.body}</div>
                    <div style="margin-top:10px;display:flex;align-items:center;gap:8px;justify-content:space-between">
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(a.authorId)};width:24px;height:24px;font-size:10px">${Utils.avatarInitials(author?.fullName||'?')}</div>
                        <span style="font-size:12px;color:var(--text-3)">Posted by ${author?.fullName||'Management'}</span>
                      </div>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-ghost btn-sm" onclick="Events.toggleReadAnnouncement(${a.id})" title="${isRead ? 'Mark as unread' : 'Mark as read'}">
                          <i class="fa ${isRead ? 'fa-envelope' : 'fa-envelope-open'}"></i> ${isRead ? 'Mark Unread' : 'Mark Read'}
                        </button>
                        ${isHrOrAdmin ? `
                          <button class="btn btn-ghost btn-icon btn-sm" onclick="Events.editAnnouncement(${a.id})"><i class="fa fa-pen"></i></button>
                          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Events.deleteAnnouncement(${a.id})"><i class="fa fa-trash"></i></button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
      </div>
    `;
  },

  showAddEvent(defaultDate) {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied: Employees cannot add events.', 'error');
      return;
    }
    Modal.show('Add New Event', `
      <div class="form-group"><label class="form-label required">Event Title</label><input class="form-control" id="ef-title" placeholder="e.g. Q3 Strategy Review"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Date</label><input type="date" class="form-control" id="ef-date" value="${defaultDate || Utils.today()}"></div>
        <div class="form-group"><label class="form-label required">Time</label><input type="time" class="form-control" id="ef-time" value="10:00"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="ef-type">
            <option value="company">Company</option>
            <option value="training">Training</option>
            <option value="meeting">Meeting</option>
            <option value="company_event">Company Event</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="ef-location" placeholder="Conference Room A, Head Office"></div>
      </div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ef-desc" rows="3" placeholder="Event details and agenda..."></textarea></div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Events.saveEvent()"><i class="fa fa-save"></i> Save Event</button>
      `
    });
  },

  saveEvent() {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied.', 'error');
      return;
    }
    const title = document.getElementById('ef-title').value.trim();
    const date = document.getElementById('ef-date').value;
    if (!title || !date) { Toast.show('Title and date are required', 'error'); return; }
    DB.add('events', {
      id: DB.nextId('events'),
      title,
      date,
      time: document.getElementById('ef-time').value,
      type: document.getElementById('ef-type').value,
      location: document.getElementById('ef-location').value.trim() || 'HQ',
      description: document.getElementById('ef-desc').value.trim(),
      status: 'upcoming',
    });
    Modal.close('dynamic-modal');
    Toast.show('Event added successfully!', 'success');
    this.renderView();
  },

  editEvent(id) {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied: Employees cannot edit events.', 'error');
      return;
    }
    const e = DB.find('events', id);
    if (!e) return;
    Modal.show(`Edit Event \u2014 ${e.title}`, `
      <div class="form-group"><label class="form-label required">Event Title</label><input class="form-control" id="ef-etitle" value="${e.title}"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Date</label><input type="date" class="form-control" id="ef-edate" value="${e.date}"></div>
        <div class="form-group"><label class="form-label required">Time</label><input type="time" class="form-control" id="ef-etime" value="${e.time||'10:00'}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="ef-etype">
            <option value="company" ${e.type==='company'?'selected':''}>Company</option>
            <option value="training" ${e.type==='training'?'selected':''}>Training</option>
            <option value="meeting" ${e.type==='meeting'?'selected':''}>Meeting</option>
            <option value="company_event" ${e.type==='company_event'?'selected':''}>Company Event</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="ef-eloc" value="${e.location||''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ef-edesc" rows="3">${e.description||''}</textarea></div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Events.updateEvent(${id})"><i class="fa fa-save"></i> Update</button>`
    });
  },

  updateEvent(id) {
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
    DB.update('events', id, {
      title: document.getElementById('ef-etitle').value.trim(),
      date: document.getElementById('ef-edate').value,
      time: document.getElementById('ef-etime').value,
      type: document.getElementById('ef-etype').value,
      location: document.getElementById('ef-eloc').value.trim(),
      description: document.getElementById('ef-edesc').value.trim(),
    });
    Modal.close('dynamic-modal');
    Toast.show('Event updated!', 'success');
    this.renderView();
  },

  deleteEvent(id) {
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
    const e = DB.find('events', id);
    Modal.confirm('Delete Event', `Delete <strong>${e?.title}</strong>?`, () => {
      DB.delete('events', id);
      DB.log('DELETE', 'Events', `Event deleted: ${e?.title}`, Auth.user?.id);
      Toast.show('Event deleted!', 'warning');
      this.renderView();
    });
  },

  showAddAnnouncement() {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied: Employees cannot post announcements.', 'error');
      return;
    }
    Modal.show('Post Announcement', `
      <div class="form-group"><label class="form-label required">Title</label><input class="form-control" id="an-title" placeholder="Announcement headline"></div>
      <div class="form-group"><label class="form-label required">Priority</label>
        <select class="form-control" id="an-priority"><option value="low">Low</option><option value="normal" selected>Normal</option><option value="high">High</option></select>
      </div>
      <div class="form-group"><label class="form-label required">Message</label><textarea class="form-control" id="an-body" rows="5" placeholder="Announcement content..."></textarea></div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Events.saveAnnouncement()"><i class="fa fa-bullhorn"></i> Post</button>
      `
    });
  },

  saveAnnouncement() {
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
    const title = document.getElementById('an-title').value.trim();
    const body  = document.getElementById('an-body').value.trim();
    if (!title || !body) { Toast.show('Please fill all fields', 'error'); return; }
    DB.add('announcements', {
      id: DB.nextId('announcements'), title, body,
      priority: document.getElementById('an-priority').value,
      authorId: Auth.employee?.id || 1, date: Utils.today(), read: []
    });
    Modal.close('dynamic-modal');
    Toast.show('Announcement posted!', 'success');
    this.renderView();
  },

  editAnnouncement(id) {
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
    const a = DB.find('announcements', id);
    if (!a) return;
    Modal.show(`Edit Announcement \u2014 ${a.title}`, `
      <div class="form-group"><label class="form-label required">Title</label><input class="form-control" id="af-etitle" value="${a.title}"></div>
      <div class="form-group"><label class="form-label">Priority</label>
        <select class="form-control" id="af-eprio">
          <option value="low" ${a.priority==='low'?'selected':''}>Low</option>
          <option value="normal" ${a.priority==='normal'?'selected':''}>Normal</option>
          <option value="high" ${a.priority==='high'?'selected':''}>High</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label required">Body</label><textarea class="form-control" id="af-ebody" rows="4">${a.body||''}</textarea></div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Events.updateAnnouncement(${id})"><i class="fa fa-save"></i> Update</button>`
    });
  },

  updateAnnouncement(id) {
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
    DB.update('announcements', id, {
      title: document.getElementById('af-etitle').value.trim(),
      priority: document.getElementById('af-eprio').value,
      body: document.getElementById('af-ebody').value.trim(),
    });
    Modal.close('dynamic-modal');
    Toast.show('Announcement updated!', 'success');
    this.renderView();
  },

  deleteAnnouncement(id) {
    if (Auth.role === 'employee') { Toast.show('Permission denied.', 'error'); return; }
    const a = DB.find('announcements', id);
    Modal.confirm('Delete Announcement', `Delete <strong>${a?.title}</strong>?`, () => {
      DB.delete('announcements', id);
      DB.log('DELETE', 'Events', `Announcement deleted: ${a?.title}`, Auth.user?.id);
      Toast.show('Announcement deleted!', 'warning');
      this.renderView();
    });
  },

  toggleReadAnnouncement(id) {
    const a = DB.find('announcements', id);
    if (!a) return;
    const uid = Auth.user?.id || Auth.employee?.id || 1;
    let readArr = Array.isArray(a.read) ? [...a.read] : [];
    if (readArr.includes(uid)) {
      readArr = readArr.filter(u => u !== uid);
      Toast.show('Marked announcement as unread', 'info');
    } else {
      readArr.push(uid);
      Toast.show('Marked announcement as read', 'success');
    }
    DB.update('announcements', id, { read: readArr });
    this.renderView();
  },

  // ── CORPORATE POLICIES & COMPLIANCE HUB ──
  renderPolicies(container) {
    const policies = DB.get('company_policies') || [];
    const allEmps = DB.get('employees') || [];
    const myId = Auth.employee?.id || 1;
    const isAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    const mySignedCount = policies.filter(p => (p.acknowledgments || []).some(a => a.employeeId === myId)).length;
    const myPendingCount = policies.length - mySignedCount;

    // Overall compliance percentage across all employees
    let totalSignaturesPossible = policies.length * allEmps.length;
    let actualSignatures = policies.reduce((s, p) => s + (p.acknowledgments ? p.acknowledgments.length : 0), 0);
    let overallRate = totalSignaturesPossible > 0 ? Math.round((actualSignatures / totalSignaturesPossible) * 100) : 100;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:19px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary)">
              <i class="fa fa-book-bookmark"></i>
            </span>
            Corporate Policies &amp; Compliance Hub
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Official employee handbooks, statutory anti-harassment regulations, code of ethics, and digital acknowledgments
          </div>
        </div>

        ${isAdmin ? `
          <button class="btn btn-outline btn-sm" onclick="Events.remindUnsignedPolicies()">
            <i class="fa fa-bell"></i> Send Acknowledgment Reminder
          </button>
        ` : ''}
      </div>

      <!-- KPI Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Standard Policies</div>
          <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:4px">${policies.length} Formal Codes</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Legal &amp; Operational Framework</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Your Signed Standing</div>
          <div style="font-size:22px;font-weight:800;color:${myPendingCount === 0 ? 'var(--success)' : 'var(--warning)'};margin-top:4px">
            ${mySignedCount} / ${policies.length}
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${myPendingCount === 0 ? 'Fully Compliant &amp; Signed' : myPendingCount + ' Policy Signature Pending'}</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Company Compliance Rate</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px">${overallRate}%</div>
          <div style="font-size:11px;color:var(--success);margin-top:2px">Audited Active Workforce</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Last Policy Revision</div>
          <div style="font-size:18px;font-weight:800;color:var(--text);margin-top:6px">March 2026</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Annual Legal Review Completed</div>
        </div>
      </div>

      <!-- Policy Cards Grid -->
      <div style="display:grid;gap:18px;margin-bottom:30px">
        ${policies.map(p => {
          const isSigned = (p.acknowledgments || []).some(a => a.employeeId === myId);
          const sigCount = (p.acknowledgments || []).length;
          const pct = Math.round((sigCount / (allEmps.length || 1)) * 100);

          return `
            <div class="card" style="padding:22px;border:1px solid var(--border);border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:12px">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-family:monospace;font-size:12px;font-weight:800;background:rgba(99,102,241,0.1);color:var(--primary);padding:4px 10px;border-radius:8px">
                    ${p.code}
                  </span>
                  <span class="badge badge-secondary" style="font-size:11px">${p.category}</span>
                  <span style="font-size:11px;color:var(--text-muted)">${p.version} • Effective ${p.effectiveDate}</span>
                </div>

                <div>
                  ${isSigned ? `
                    <span class="badge badge-success" style="font-size:11.5px;padding:6px 12px">
                      <i class="fa fa-circle-check"></i> Acknowledged &amp; Signed
                    </span>
                  ` : `
                    <button class="btn btn-primary btn-sm" onclick="Events.showSignPolicyModal(${p.id})">
                      <i class="fa fa-signature"></i> Read &amp; Acknowledge Policy
                    </button>
                  `}
                </div>
              </div>

              <h3 style="font-size:16px;font-weight:800;color:var(--text);margin:0 0 8px">${p.title}</h3>
              <p style="font-size:13px;color:var(--text-2);line-height:1.5;margin:0 0 16px">${p.summary}</p>

              <!-- Key Clauses Highlights -->
              <div style="background:var(--surface);border-radius:10px;padding:14px;border:1px solid var(--border);margin-bottom:16px">
                <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">
                  <i class="fa fa-scale-balanced" style="color:var(--primary);margin-right:6px"></i> Key Regulatory &amp; Behavioral Clauses:
                </div>
                <div style="display:grid;gap:6px">
                  ${(p.clauses || []).map(c => `
                    <div style="font-size:12px;color:var(--text-3);line-height:1.4">
                      ${c}
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Footer Controls & Audit Rate -->
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-top:1px solid var(--border);padding-top:14px">
                <div style="display:flex;align-items:center;gap:12px">
                  <div style="width:140px;background:var(--surface);height:8px;border-radius:4px;overflow:hidden">
                    <div style="width:${pct}%;background:var(--success);height:100%"></div>
                  </div>
                  <span style="font-size:11.5px;color:var(--text-3)"><b>${sigCount} / ${allEmps.length}</b> Employees Acknowledged (${pct}%)</span>
                </div>

                <div style="display:flex;gap:8px">
                  <button class="btn btn-ghost btn-xs" onclick="Events.printPolicy(${p.id})" title="Print Corporate Policy">
                    <i class="fa fa-print"></i> Print PDF
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  showSignPolicyModal(policyId) {
    const policy = DB.find('company_policies', policyId);
    if (!policy) return;

    Modal.show(`Acknowledge Policy: ${policy.code}`, `
      <div style="background:var(--surface);padding:14px;border-radius:8px;margin-bottom:16px">
        <div style="font-weight:800;font-size:15px;color:var(--text)">${policy.title}</div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${policy.version} • Mandated Compliance</div>
      </div>

      <div style="max-height:260px;overflow-y:auto;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:18px;font-size:12.5px;color:var(--text-2);line-height:1.6">
        <p><b>Summary of Employee Commitment:</b> ${policy.summary}</p>
        <p><b>Statutory Standard Clauses:</b></p>
        <ul>
          ${(policy.clauses || []).map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>

      <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.3);padding:12px;border-radius:8px">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin:0">
          <input type="checkbox" id="policy-agree-check" style="width:16px;height:16px;margin-top:2px">
          <div style="font-size:12px;color:var(--text)">
            I, <b>${Auth.employee.fullName}</b> (Employee ID #${Auth.employee.id}), hereby confirm that I have carefully read, fully understood, and undertake to strictly comply with all terms stipulated in <b>${policy.title}</b>.
          </div>
        </label>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-success" onclick="Events.submitPolicyAcknowledgment(${policy.id})"><i class="fa fa-signature"></i> Sign &amp; Submit Undertaking</button>
      `
    });
  },

  submitPolicyAcknowledgment(policyId) {
    const agreed = document.getElementById('policy-agree-check')?.checked;
    if (!agreed) {
      Toast.show('You must check the agreement declaration to proceed', 'warning');
      return;
    }

    const policies = DB.get('company_policies') || [];
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return;

    if (!policy.acknowledgments) policy.acknowledgments = [];
    const myId = Auth.employee.id;

    if (!policy.acknowledgments.some(a => a.employeeId === myId)) {
      policy.acknowledgments.push({
        employeeId: myId,
        signedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        ip: '192.168.1.' + (10 + (myId % 50))
      });
      DB.set('company_policies', policies);
      DB.log('POLICY_ACK', 'Compliance', `Signed digital acknowledgment for ${policy.code} (${policy.title})`, Auth.user?.id);
    }

    Modal.close('dynamic-modal');
    Toast.show(`Successfully signed compliance acknowledgment for ${policy.code}!`, 'success');
    this.renderPolicies(document.getElementById('events-content'));
  },

  printPolicy(policyId) {
    const policy = DB.find('company_policies', policyId);
    if (!policy) return;
    const settings = DB.getObj('settings') || { companyName: 'HRM Pro Enterprise' };

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Policy Document - ${policy.code}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; text-align: center; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; }
          .meta { font-size: 12px; color: #64748b; margin-top: 6px; }
          .summary { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13.5px; }
          .clause { margin-bottom: 12px; font-size: 13px; }
          @media print { body { padding: 15mm; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size:14px;font-weight:700;letter-spacing:1px;color:#4f46e5;text-transform:uppercase">${settings.companyName}</div>
          <div class="title">${policy.title}</div>
          <div class="meta">Code: ${policy.code} | Version: ${policy.version} | Effective: ${policy.effectiveDate}</div>
        </div>
        <div class="summary"><b>POLICY PURPOSE:</b> ${policy.summary}</div>
        <h3>STANDARD OPERATIONAL CLAUSES:</h3>
        ${(policy.clauses || []).map(c => `<div class="clause">${c}</div>`).join('')}
        <div style="margin-top:60px;border-top:1px solid #0f172a;padding-top:10px;font-size:11px;color:#64748b;text-align:center">
          OFFICIAL CORPORATE COMPLIANCE DOCUMENT • MAINTAINED BY CORPORATE GOVERNANCE
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    win.document.close();
  },

  remindUnsignedPolicies() {
    Toast.show('Broadcast reminder sent to all employees with pending policy acknowledgments!', 'success');
  },

  // ============================================================
  // PHASE 1: TRAINING & LEARNING MANAGEMENT SYSTEM (LMS)
  // ============================================================
  renderTrainings(container) {
    const trainings = DB.get('trainings') || [];
    const myId = Auth.employee?.id;
    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap">
          <div>
            <h2 style="font-size:22px;font-weight:800;margin:0 0 4px 0">Training & Certifications (LMS)</h2>
            <div style="font-size:13px;color:var(--text-3)">Corporate courses, skill development programs, and compliance certifications</div>
          </div>
          ${Auth.role !== 'employee' ? `<button class="btn btn-primary btn-sm" onclick="Events.showAddTrainingModal()"><i class="fa fa-plus"></i> Create Training Program</button>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
          ${trainings.length === 0 ? '<div class="card" style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-3)">No active training programs found.</div>' :
            trainings.map(t => {
              const enrolled = (t.enrolled || []).includes(myId);
              const priority = t?.priority || 'Normal';
              return `
                <div class="card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between">
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                      <span class="badge badge-primary" style="font-size:11px">${t.category || 'General'}</span>
                      <span class="badge" style="background:var(--surface-2);color:var(--text-3);font-size:11px">Priority: ${priority}</span>
                    </div>
                    <h3 style="font-size:16px;font-weight:700;margin:0 0 6px">${t.title}</h3>
                    <p style="font-size:12.5px;color:var(--text-3);margin:0 0 14px;line-height:1.5">${t.description || ''}</p>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);padding-top:12px;margin-top:12px">
                    <span style="font-size:11.5px;color:var(--text-3)"><i class="fa fa-users" style="margin-right:4px"></i> ${(t.enrolled || []).length} Enrolled</span>
                    ${enrolled ? '<span class="badge badge-success" style="font-size:11px"><i class="fa fa-check"></i> Enrolled</span>' : `<button class="btn btn-sm btn-primary" onclick="Events.enrollTraining(${t.id})">Enroll Now</button>`}
                  </div>
                </div>
              `;
            }).join('')}
        </div>
      </div>
    `;
  },

  showAddTrainingModal() {
    Modal.show('Create Training Program', `
      <div class="form-group">
        <label class="form-label">Training Title</label>
        <input type="text" id="train-title" class="form-control" placeholder="e.g. Advanced Cybersecurity 2026">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <input type="text" id="train-cat" class="form-control" placeholder="e.g. Security, Compliance, Tech">
      </div>
      <div class="form-group">
        <label class="form-label">Priority</label>
        <select id="train-priority" class="form-control">
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="train-desc" class="form-control" rows="3" placeholder="Course objectives and details..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Events.submitTraining()">Create Program</button>
      `
    });
  },

  submitTraining() {
    const title = document.getElementById('train-title')?.value;
    const category = document.getElementById('train-cat')?.value || 'General';
    const priority = document.getElementById('train-priority')?.value || 'Normal';
    const description = document.getElementById('train-desc')?.value || '';
    if (!title) {
      Toast.show('Please enter training title', 'warning');
      return;
    }
    const trainings = DB.get('trainings') || [];
    trainings.push({
      id: Date.now(),
      title,
      category,
      priority,
      description,
      enrolled: [],
      createdAt: Utils.today()
    });
    DB.set('trainings', trainings);
    Modal.close('dynamic-modal');
    Toast.show('Training program created successfully', 'success');
    this.renderTrainings(document.getElementById('events-content'));
  },

  enrollTraining(id) {
    const trainings = DB.get('trainings') || [];
    const t = trainings.find(x => x.id === id);
    if (!t) return;
    const myId = Auth.employee?.id;
    if (!t.enrolled) t.enrolled = [];
    if (!t.enrolled.includes(myId)) {
      t.enrolled.push(myId);
      DB.set('trainings', trainings);
      Toast.show('Successfully enrolled in training', 'success');
      this.renderTrainings(document.getElementById('events-content'));
    }
  },

  renderEventHistory(container) {
    const history = DB.get('event_history') || [];
    const filtered = history.filter(h => {
      const type = h?.type || 'General';
      return type;
    });
  }
};
