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

  render() {
    this.ensureTasks();
    const content = document.getElementById('page-content');
    if (!content) return;

    content.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border)">
          ${[
            { id:'calendar',      label:'Company Calendar', icon:'fa-calendar' },
            { id:'events',        label:'Events List',      icon:'fa-calendar-days' },
            { id:'announcements', label:'Announcements',    icon:'fa-bullhorn' },
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
                <div style="font-size:12px;color:var(--text-3)">Type: ${h.type.toUpperCase()} • ${h.optional ? 'Optional Holiday' : 'Mandatory Public Holiday'}</div>
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
                  <div style="font-size:12px;color:var(--text-3);margin-top:4px">Assigned to: <strong>${emp?.fullName || 'Unassigned'}</strong> • Category: ${t.category} • Priority: ${t.priority.toUpperCase()}</div>
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
};

// ============================================================
// HRM SYSTEM — Universal Scoped Reports Module
// ============================================================

const Reports = {
  currentReport: null,
  startDate: '2026-01-01',
  endDate: Utils.today(),
  preset: 'year',

  setPreset(preset) {
    this.preset = preset;
    const now = new Date();
    const todayStr = Utils.today();

    if (preset === 'today') {
      this.startDate = todayStr;
      this.endDate = todayStr;
    } else if (preset === 'week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      this.startDate = start.toISOString().split('T')[0];
      this.endDate = end.toISOString().split('T')[0];
    } else if (preset === 'month') {
      this.startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
      this.endDate = todayStr;
    } else if (preset === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lme = new Date(now.getFullYear(), now.getMonth(), 0);
      this.startDate = lm.toISOString().split('T')[0];
      this.endDate = lme.toISOString().split('T')[0];
    } else if (preset === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      const qs = new Date(now.getFullYear(), q * 3, 1);
      const qe = new Date(now.getFullYear(), (q + 1) * 3, 0);
      this.startDate = qs.toISOString().split('T')[0];
      this.endDate = qe.toISOString().split('T')[0];
    } else if (preset === 'year') {
      this.startDate = `${now.getFullYear()}-01-01`;
      this.endDate = `${now.getFullYear()}-12-31`;
    } else if (preset === 'all') {
      this.startDate = '2020-01-01';
      this.endDate = todayStr;
    }

    if (this.currentReport) {
      this.renderReport(this.currentReport);
    } else {
      this.render();
    }
  },

  onDateChange() {
    if (this.startDate > this.endDate) {
      Toast.show('Start date cannot be after end date', 'warning');
      return;
    }
    if (this.currentReport) {
      this.renderReport(this.currentReport);
    } else {
      this.render();
    }
  },

  getScopedEmployees() {
    const all = DB.get('employees') || [];
    if (Auth.role === 'employee') {
      const myId = Auth.employee?.id || Auth.user?.employeeId;
      return all.filter(e => e.id === myId);
    }
    if (Auth.role === 'dept_manager') {
      const deptId = Auth.employee?.departmentId;
      return all.filter(e => e.departmentId === deptId);
    }
    return all;
  },

  renderScopeBadge() {
    if (Auth.role === 'employee') {
      return `<span class="badge" style="background:rgba(236,72,153,0.18);color:#ec4899;font-size:12px;padding:6px 12px;border-radius:20px;border:1px solid rgba(236,72,153,0.3)"><i class="fa fa-user" style="margin-right:6px"></i>Personal Scope: ${Auth.employee?.fullName || 'My Records'} (Only Your Data)</span>`;
    }
    if (Auth.role === 'dept_manager') {
      const deptName = Utils.getDeptName(Auth.employee?.departmentId);
      return `<span class="badge" style="background:rgba(20,184,166,0.18);color:#14b8a6;font-size:12px;padding:6px 12px;border-radius:20px;border:1px solid rgba(20,184,166,0.3)"><i class="fa fa-building" style="margin-right:6px"></i>Department Scope: ${deptName}</span>`;
    }
    return `<span class="badge" style="background:rgba(16,185,129,0.18);color:#10b981;font-size:12px;padding:6px 12px;border-radius:20px;border:1px solid rgba(16,185,129,0.3)"><i class="fa fa-globe" style="margin-right:6px"></i>Company-Wide Scope (${Auth.role === 'superadmin' ? 'Super Admin' : 'HR Manager'})</span>`;
  },

  renderDateControls() {
    return `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:12px;font-weight:700;color:var(--text-3);margin-right:4px"><i class="fa fa-calendar-range" style="margin-right:5px"></i>Presets:</span>
          ${[
            { id:'today',      label:'Today' },
            { id:'week',       label:'This Week' },
            { id:'month',      label:'This Month' },
            { id:'last_month', label:'Last Month' },
            { id:'quarter',    label:'This Qtr' },
            { id:'year',       label:'Year 2026' },
            { id:'all',        label:'All Time' },
          ].map(p => `
            <button class="btn btn-ghost btn-sm" style="${this.preset===p.id?'background:var(--primary);color:#fff;font-weight:700;box-shadow:0 2px 6px var(--primary-glow);':''}" onclick="Reports.setPreset('${p.id}')">${p.label}</button>
          `).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--text-3);font-weight:600">From:</span>
          <input type="date" class="form-control" style="width:138px;padding:4px 8px;font-size:12px" value="${this.startDate}" onchange="Reports.preset='custom';Reports.startDate=this.value">
          <span style="font-size:12px;color:var(--text-3);font-weight:600">To:</span>
          <input type="date" class="form-control" style="width:138px;padding:4px 8px;font-size:12px" value="${this.endDate}" onchange="Reports.preset='custom';Reports.endDate=this.value">
          <button class="btn btn-primary btn-sm" onclick="Reports.onDateChange()"><i class="fa fa-filter"></i> Apply Filter</button>
        </div>
      </div>
    `;
  },

  render() {
    const content = document.getElementById('page-content');
    if (!content) return;

    const reportTypes = [
      { id:'attendance',  title:'Attendance Report', icon:'fa-clock', color:'var(--primary)', desc:'Daily, monthly attendance summary & percentage' },
      { id:'leave',       title:'Leave Report', icon:'fa-calendar-xmark', color:'var(--warning)', desc:'Leave requests, approvals & quota usage' },
      { id:'payroll',     title:'Payroll Report', icon:'fa-money-bill-wave', color:'var(--success)', desc:'Gross salary, tax, deductions & net pay' },
      { id:'late',        title:'Late Report', icon:'fa-alarm-exclamation', color:'var(--danger)', desc:'Late arrivals and delay duration analysis' },
      { id:'absent',      title:'Absent Report', icon:'fa-user-slash', color:'var(--danger)', desc:'Employee absenteeism records and trends' },
      { id:'employee',    title:'Employee Demographics', icon:'fa-users', color:'var(--accent)', desc:'Headcount, active status, and gender breakdown' },
      { id:'joining',     title:'Joining Report', icon:'fa-user-plus', color:'var(--info)', desc:'New joiners onboarding within date range' },
      { id:'exit',        title:'Exit & Attrition Report', icon:'fa-user-minus', color:'var(--danger)', desc:'Resignations, clearances, and turnover' },
      { id:'performance', title:'Performance Report', icon:'fa-chart-line', color:'var(--primary)', desc:'Quarterly KPI/KRA scores and ratings' },
      { id:'birthday',    title:'Birthday Report', icon:'fa-cake-candles', color:'#ec4899', desc:'Upcoming celebrations within period' },
      { id:'department',  title:'Department Statistics', icon:'fa-building', color:'var(--accent)', desc:'Department-wise headcount, leaves, and activity' },
      { id:'machine',     title:'Biometric Logs Report', icon:'fa-fingerprint', color:'var(--info)', desc:'ZKTeco biometric machine device logs' },
    ];

    content.innerHTML = `
      <div class="animate-fade-in">
        ${!this.currentReport ? `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap">
            <div>
              <h2 style="font-size:22px;font-weight:800;margin:0 0 4px 0">Reports & Analytics</h2>
              <div style="font-size:13px;color:var(--text-3)">Generate role-scoped corporate and personal reports across custom date ranges</div>
            </div>
            ${this.renderScopeBadge()}
          </div>

          ${this.renderDateControls()}

          <div class="mb-20">
            <div class="grid-4">
              ${reportTypes.map(r => `
                <div class="card" style="cursor:pointer;text-align:center;border-top:4px solid ${r.color};transition:transform .2s,box-shadow .2s" onclick="Reports.showReport('${r.id}')" onmouseenter="this.style.transform='translateY(-3px)'" onmouseleave="this.style.transform=''">
                  <div style="font-size:32px;margin-bottom:12px;color:${r.color}"><i class="fa ${r.icon}"></i></div>
                  <div style="font-size:14px;font-weight:700;margin-bottom:4px">${r.title}</div>
                  <div style="font-size:12px;color:var(--text-3);line-height:1.4">${r.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="Reports.currentReport=null;Reports.render()"><i class="fa fa-arrow-left"></i> Back to Reports</button>
            <div style="font-size:18px;font-weight:800">${reportTypes.find(r=>r.id===this.currentReport)?.title}</div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${this.renderScopeBadge()}
              <button class="btn btn-ghost btn-sm" onclick="Reports.exportCSV()"><i class="fa fa-file-csv"></i> CSV</button>
              <button class="btn btn-ghost btn-sm" onclick="Reports.exportPDF()"><i class="fa fa-file-pdf"></i> PDF</button>
              <button class="btn btn-primary btn-sm" onclick="window.print()"><i class="fa fa-print"></i> Print</button>
            </div>
          </div>

          ${this.renderDateControls()}

          <div id="report-output"></div>
        `}
      </div>
    `;

    if (this.currentReport) {
      this.renderReport(this.currentReport);
    }
  },

  showReport(type) {
    this.currentReport = type;
    this.render();
  },

  renderReport(type) {
    const container = document.getElementById('report-output');
    if (!container) return;
    switch(type) {
      case 'attendance':  this.reportAttendance(container); break;
      case 'leave':       this.reportLeave(container); break;
      case 'payroll':     this.reportPayroll(container); break;
      case 'late':        this.reportLate(container); break;
      case 'absent':      this.reportAbsent(container); break;
      case 'employee':    this.reportEmployee(container); break;
      case 'joining':     this.reportJoining(container); break;
      case 'exit':        this.reportExit(container); break;
      case 'birthday':    this.reportBirthday(container); break;
      case 'performance': this.reportPerformance(container); break;
      case 'department':  this.reportDepartment(container); break;
      case 'machine':     this.reportMachine(container); break;
      default:            container.innerHTML = `<div class="empty-state"><i class="fa fa-file-circle-question"></i><h3>Report generating...</h3></div>`; break;
    }
  },

  // 1. Attendance Report
  reportAttendance(container) {
    const emps = this.getScopedEmployees();
    const empIds = new Set(emps.map(e => e.id));
    const att = (DB.get('attendance') || []).filter(a => empIds.has(a.employeeId) && a.date >= this.startDate && a.date <= this.endDate);

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px;font-weight:700">Attendance Report — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)}</span>
          <span class="chip" style="font-size:11px">${emps.length} Employee(s) Scoped</span>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Present</th><th>Absent</th><th>Late</th><th>Half Day</th><th>Total Logged</th><th>Attendance Rate</th></tr></thead>
            <tbody>
              ${emps.length === 0 ? '<tr><td colspan="8" class="text-center text-muted" style="padding:24px">No employees found in scope.</td></tr>' :
                emps.map(emp => {
                  const ea = att.filter(a => a.employeeId === emp.id);
                  const p = ea.filter(a => a.status === 'present').length;
                  const ab = ea.filter(a => a.status === 'absent').length;
                  const l = ea.filter(a => a.status === 'late').length;
                  const hd = ea.filter(a => a.status === 'half_day').length;
                  const total = ea.length;
                  const pct = total > 0 ? Math.round(((p + l + (hd * 0.5)) / total) * 100) : 0;
                  return `<tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                        <div>
                          <div style="font-weight:700">${emp.fullName}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div>
                        </div>
                      </div>
                    </td>
                    <td>${Utils.getDeptName(emp.departmentId)}</td>
                    <td style="color:var(--success);font-weight:700">${p}</td>
                    <td style="color:var(--danger);font-weight:700">${ab}</td>
                    <td style="color:var(--warning);font-weight:700">${l}</td>
                    <td style="color:var(--accent);font-weight:700">${hd}</td>
                    <td>${total} days</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div style="flex:1;height:6px;background:var(--surface-2);border-radius:3px;overflow:hidden;min-width:60px">
                          <div style="width:${pct}%;height:100%;background:${pct>=85?'var(--success)':pct>=70?'var(--warning)':'var(--danger)'};border-radius:3px"></div>
                        </div>
                        <span style="font-weight:700;font-size:12px;color:${pct>=85?'var(--success)':pct>=70?'var(--warning)':'var(--danger)'}">${pct}%</span>
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

  // 2. Leave Report
  reportLeave(container) {
    const emps = this.getScopedEmployees();
    const empIds = new Set(emps.map(e => e.id));
    const types = DB.get('leave_types') || [];
    const leaves = (DB.get('leave_requests') || []).filter(l => empIds.has(l.employeeId) && l.from <= this.endDate && l.to >= this.startDate);

    const totalDays = leaves.filter(l => l.status === 'approved').reduce((s, l) => s + l.days, 0);

    container.innerHTML = `
      <div class="grid-3 mb-16">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--primary)">${leaves.length}</div>
          <div style="font-size:12px;color:var(--text-3)">Total Requests in Range</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--success)">${totalDays}</div>
          <div style="font-size:12px;color:var(--text-3)">Approved Leave Days</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--warning)">${leaves.filter(l=>l.status==='pending'||l.status==='manager_approved').length}</div>
          <div style="font-size:12px;color:var(--text-3)">Pending Approvals</div>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Leave Applications — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)}
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Leave Type</th><th>From Date</th><th>To Date</th><th>Days</th><th>Reason</th><th>Status</th><th>Applied On</th></tr></thead>
            <tbody>
              ${leaves.length === 0 ? '<tr><td colspan="8" class="text-center text-muted" style="padding:28px">No leave records match the selected date range and scope.</td></tr>' :
                leaves.map(l => {
                  const emp = emps.find(e => e.id === l.employeeId) || DB.find('employees', l.employeeId);
                  const type = types.find(t => t.id === l.typeId);
                  return `<tr>
                    <td style="font-weight:600">${emp?.fullName || '—'} (${emp?.empNo || ''})</td>
                    <td><span class="badge" style="background:${type?.color||'#6366f1'}22;color:${type?.color||'#6366f1'}">${type?.name || '—'}</span></td>
                    <td>${Utils.formatDate(l.from)}</td>
                    <td>${Utils.formatDate(l.to)}</td>
                    <td><strong>${l.days}</strong> day(s)</td>
                    <td style="font-size:12px;max-width:200px" class="truncate">${l.reason || '—'}</td>
                    <td>${Utils.statusBadge(l.status)}</td>
                    <td style="font-size:12px">${Utils.formatDate(l.appliedOn)}</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 3. Payroll Report
  reportPayroll(container) {
    const emps = this.getScopedEmployees();
    const empIds = new Set(emps.map(e => e.id));
    const startM = this.startDate.slice(0, 7);
    const endM = this.endDate.slice(0, 7);

    const salaries = (DB.get('salary') || []).filter(s => {
      if (!empIds.has(s.employeeId)) return false;
      if (s.date && s.date >= this.startDate && s.date <= this.endDate) return true;
      if (s.month && s.month >= startM && s.month <= endM) return true;
      return false;
    });

    const totalGross = salaries.reduce((a, s) => a + (s.basic || 0) + (s.allowances || 0), 0);
    const totalDeductions = salaries.reduce((a, s) => a + (s.deductions || 0) + (s.tax || 0), 0);
    const totalNet = salaries.reduce((a, s) => a + (s.netSalary || 0), 0);

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--primary)">${Utils.formatCurrency(totalGross)}</div>
          <div style="font-size:12px;color:var(--text-3)">Total Gross Earnings</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--danger)">${Utils.formatCurrency(totalDeductions)}</div>
          <div style="font-size:12px;color:var(--text-3)">Total Deductions & Tax</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--success)">${Utils.formatCurrency(totalNet)}</div>
          <div style="font-size:12px;color:var(--text-3)">Total Net Salary Disbursed</div>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Salary Disbursements (${salaries.length} Slips) — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)}
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Month</th><th>Basic Pay</th><th>Allowances</th><th>Deductions</th><th>Income Tax</th><th>Net Pay</th><th>Status</th></tr></thead>
            <tbody>
              ${salaries.length === 0 ? '<tr><td colspan="8" class="text-center text-muted" style="padding:28px">No payroll disbursements found in this date range.</td></tr>' :
                salaries.map(s => `<tr>
                  <td style="font-weight:600">${Utils.getEmpName(s.employeeId)}</td>
                  <td><span class="chip">${s.month}</span></td>
                  <td>${Utils.formatCurrency(s.basic)}</td>
                  <td style="color:var(--success);font-weight:600">${Utils.formatCurrency(s.allowances)}</td>
                  <td style="color:var(--danger)">${Utils.formatCurrency(s.deductions)}</td>
                  <td style="color:var(--danger)">${Utils.formatCurrency(s.tax)}</td>
                  <td style="font-weight:800;color:var(--primary)">${Utils.formatCurrency(s.netSalary)}</td>
                  <td>${Utils.statusBadge(s.status)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 4. Late Arrivals Report
  reportLate(container) {
    const emps = this.getScopedEmployees();
    const empIds = new Set(emps.map(e => e.id));
    const att = (DB.get('attendance') || []).filter(a => empIds.has(a.employeeId) && a.status === 'late' && a.date >= this.startDate && a.date <= this.endDate);

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Late Arrivals Summary — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)} (${att.length} Instances)
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Arrival Time</th><th>Late Duration</th><th>Device/Source</th></tr></thead>
            <tbody>
              ${att.length === 0 ? '<tr><td colspan="6" class="text-center text-muted" style="padding:28px">No late arrivals recorded for this period.</td></tr>' :
                att.map(a => {
                  const emp = DB.find('employees', a.employeeId);
                  return `<tr>
                    <td style="font-weight:600">${emp?.fullName || '—'} (${emp?.empNo || ''})</td>
                    <td>${Utils.getDeptName(emp?.departmentId)}</td>
                    <td>${Utils.formatDate(a.date)}</td>
                    <td style="color:var(--warning);font-weight:700">${a.timeIn}</td>
                    <td><span class="badge badge-warning">${this.calcLateBy(a.timeIn)} mins</span></td>
                    <td><span class="chip"><i class="fa fa-fingerprint" style="margin-right:4px"></i>${a.device || 'ZKTeco Pro'}</span></td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 5. Absenteeism Report
  reportAbsent(container) {
    const emps = this.getScopedEmployees();
    const empIds = new Set(emps.map(e => e.id));
    const att = (DB.get('attendance') || []).filter(a => empIds.has(a.employeeId) && a.status === 'absent' && a.date >= this.startDate && a.date <= this.endDate);

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Absenteeism Log — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)} (${att.length} Absences)
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Designation</th><th>Remarks</th></tr></thead>
            <tbody>
              ${att.length === 0 ? '<tr><td colspan="5" class="text-center text-muted" style="padding:28px">No unauthorized absences recorded in this date range.</td></tr>' :
                att.map(a => {
                  const emp = DB.find('employees', a.employeeId);
                  return `<tr>
                    <td style="font-weight:600">${emp?.fullName || '—'} (${emp?.empNo || ''})</td>
                    <td>${Utils.getDeptName(emp?.departmentId)}</td>
                    <td style="font-weight:700;color:var(--danger)">${Utils.formatDate(a.date)}</td>
                    <td>${Utils.getDesigName(emp?.designationId)}</td>
                    <td style="color:var(--text-3)">${a.remarks || 'Uninformed Absence'}</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 6. Employee Demographics Report
  reportEmployee(container) {
    const emps = this.getScopedEmployees();
    const active = emps.filter(e => e.status === 'active');
    const inactive = emps.filter(e => e.status === 'inactive');
    const male = emps.filter(e => e.gender === 'Male').length;
    const female = emps.filter(e => e.gender === 'Female').length;

    container.innerHTML = `
      <div class="grid-4 mb-16">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--primary)">${emps.length}</div>
          <div style="font-size:12px;color:var(--text-3)">Total In Scope</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--success)">${active.length}</div>
          <div style="font-size:12px;color:var(--text-3)">Active Personnel</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--info)">${male} / ${female}</div>
          <div style="font-size:12px;color:var(--text-3)">Male / Female</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--danger)">${inactive.length}</div>
          <div style="font-size:12px;color:var(--text-3)">Inactive / Exited</div>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Scoped Staff Directory
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Emp #</th><th>Full Name</th><th>Department</th><th>Designation</th><th>Gender</th><th>Type</th><th>Joining Date</th><th>Status</th></tr></thead>
            <tbody>
              ${emps.map(e => `<tr>
                <td><span style="font-family:monospace;color:var(--primary);font-weight:700">${e.empNo}</span></td>
                <td style="font-weight:600">${e.fullName}</td>
                <td>${Utils.getDeptName(e.departmentId)}</td>
                <td>${Utils.getDesigName(e.designationId)}</td>
                <td>${e.gender}</td>
                <td><span class="chip">${e.employmentType}</span></td>
                <td>${Utils.formatDate(e.joiningDate)}</td>
                <td>${Utils.statusBadge(e.status)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 7. Joining Report
  reportJoining(container) {
    const emps = this.getScopedEmployees().filter(e => e.joiningDate && e.joiningDate >= this.startDate && e.joiningDate <= this.endDate);

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          New Joiners Report — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)} (${emps.length} Onboarded)
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Emp #</th><th>Employee Name</th><th>Department</th><th>Designation</th><th>Branch</th><th>Joining Date</th><th>Contract</th><th>Status</th></tr></thead>
            <tbody>
              ${emps.length === 0 ? '<tr><td colspan="8" class="text-center text-muted" style="padding:28px">No employees joined during this date range.</td></tr>' :
                emps.map(e => `<tr>
                  <td><span style="font-family:monospace;color:var(--primary);font-weight:700">${e.empNo}</span></td>
                  <td style="font-weight:600">${e.fullName}</td>
                  <td>${Utils.getDeptName(e.departmentId)}</td>
                  <td>${Utils.getDesigName(e.designationId)}</td>
                  <td>${Utils.getBranchName(e.branchId)}</td>
                  <td style="color:var(--success);font-weight:700">${Utils.formatDate(e.joiningDate)}</td>
                  <td><span class="chip">${e.employmentType}</span></td>
                  <td>${Utils.statusBadge(e.status)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 8. Exit Report
  reportExit(container) {
    const emps = this.getScopedEmployees();
    const empIds = new Set(emps.map(e => e.id));
    const exits = (DB.get('exit_records') || []).filter(x => empIds.has(x.employeeId) && (!x.exitDate || (x.exitDate >= this.startDate && x.exitDate <= this.endDate)));

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Employee Exit & Attrition Report — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)} (${exits.length} Records)
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Exit Date</th><th>Reason</th><th>Notice Period</th><th>Clearance</th><th>Status</th></tr></thead>
            <tbody>
              ${exits.length === 0 ? '<tr><td colspan="7" class="text-center text-muted" style="padding:28px">No employee exits recorded in this date range.</td></tr>' :
                exits.map(x => {
                  const emp = DB.find('employees', x.employeeId);
                  return `<tr>
                    <td style="font-weight:600">${emp?.fullName || '—'} (${emp?.empNo || ''})</td>
                    <td>${Utils.getDeptName(emp?.departmentId)}</td>
                    <td style="color:var(--danger);font-weight:700">${Utils.formatDate(x.exitDate)}</td>
                    <td>${x.reason || 'Resignation'}</td>
                    <td>${x.noticePeriod || 30} days</td>
                    <td><span class="badge badge-success">Completed</span></td>
                    <td>${Utils.statusBadge(emp?.status || 'inactive')}</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 9. Birthday Report
  reportBirthday(container) {
    const emps = this.getScopedEmployees().filter(e => e.status === 'active' && e.dob);
    const startMMDD = this.startDate.slice(5);
    const endMMDD = this.endDate.slice(5);

    const bdays = emps.filter(e => {
      const b = e.dob.slice(5);
      if (startMMDD <= endMMDD) return b >= startMMDD && b <= endMMDD;
      return b >= startMMDD || b <= endMMDD;
    }).sort((a, b) => a.dob.slice(5).localeCompare(b.dob.slice(5)));

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Birthday Celebrations — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)} (${bdays.length} Upcoming)
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Birth Date</th><th>Upcoming Birthday</th><th>Age</th></tr></thead>
            <tbody>
              ${bdays.length === 0 ? '<tr><td colspan="5" class="text-center text-muted" style="padding:28px">No birthdays occur within this date range.</td></tr>' :
                bdays.map(e => `<tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                      <span style="font-weight:700">${e.fullName}</span>
                    </div>
                  </td>
                  <td>${Utils.getDeptName(e.departmentId)}</td>
                  <td>${Utils.formatDate(e.dob)}</td>
                  <td style="color:#ec4899;font-weight:700"><i class="fa fa-cake-candles" style="margin-right:5px"></i>${new Date(new Date().getFullYear() + '-' + e.dob.slice(5)).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</td>
                  <td>${Utils.getAge(e.dob)} yrs</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 10. Performance Report
  reportPerformance(container) {
    const emps = this.getScopedEmployees();
    const empIds = new Set(emps.map(e => e.id));
    const reviews = (DB.get('performance_reviews') || []).filter(r => {
      if (!empIds.has(r.employeeId)) return false;
      if (r.reviewDate && (r.reviewDate < this.startDate || r.reviewDate > this.endDate)) return false;
      return true;
    });

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Performance Reviews — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)} (${reviews.length} Reviews)
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Evaluation</th><th>Period</th><th>KPI Score</th><th>KRA Score</th><th>Rating</th><th>Promotion/Inc</th><th>Status</th></tr></thead>
            <tbody>
              ${reviews.length === 0 ? '<tr><td colspan="8" class="text-center text-muted" style="padding:28px">No performance reviews recorded for this period.</td></tr>' :
                reviews.map(r => `<tr>
                  <td style="font-weight:600">${Utils.getEmpName(r.employeeId)}</td>
                  <td><span class="chip">${r.type}</span></td>
                  <td>${r.quarter || ''} ${r.year}</td>
                  <td style="color:var(--primary);font-weight:700">${r.kpiScore || '—'}${r.kpiScore ? '%' : ''}</td>
                  <td style="color:var(--accent);font-weight:700">${r.kraScore || '—'}${r.kraScore ? '%' : ''}</td>
                  <td style="color:var(--warning);font-weight:700">${r.overallRating ? '★'.repeat(r.overallRating) : '—'}</td>
                  <td>${r.incrementRecommended ? '<span class="badge badge-success">Recommended</span>' : '<span class="badge badge-secondary">Standard</span>'}</td>
                  <td>${Utils.statusBadge(r.status)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 11. Department Statistics Report
  reportDepartment(container) {
    const allDepts = DB.get('departments') || [];
    const depts = (Auth.role === 'dept_manager' || Auth.role === 'employee') ?
      allDepts.filter(d => d.id === Auth.employee?.departmentId) : allDepts;

    const emps = DB.get('employees') || [];
    const att = (DB.get('attendance') || []).filter(a => a.date >= this.startDate && a.date <= this.endDate);

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Departmental Analytics — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)}
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Department</th><th>Code</th><th>Total Staff</th><th>Active</th><th>Present Logs</th><th>Late Logs</th><th>Dept Head</th></tr></thead>
            <tbody>
              ${depts.map(d => {
                const de = emps.filter(e => e.departmentId === d.id);
                const deIds = new Set(de.map(e => e.id));
                const da = att.filter(a => deIds.has(a.employeeId));
                const p = da.filter(a => a.status === 'present').length;
                const l = da.filter(a => a.status === 'late').length;
                return `<tr>
                  <td style="font-weight:700">${d.name}</td>
                  <td><span class="chip">${d.code}</span></td>
                  <td>${de.length}</td>
                  <td style="color:var(--success);font-weight:700">${de.filter(e=>e.status==='active').length}</td>
                  <td style="color:var(--primary);font-weight:700">${p}</td>
                  <td style="color:var(--warning);font-weight:700">${l}</td>
                  <td>${Utils.getEmpName(d.headId)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 12. Biometric Machine Logs Report
  reportMachine(container) {
    const emps = this.getScopedEmployees();
    const empIds = new Set(emps.map(e => e.id));
    const logs = (DB.get('attendance_logs') || []).filter(l => empIds.has(l.employeeId) && (!l.date || (l.date >= this.startDate && l.date <= this.endDate)));

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">
          Biometric Hardware Logs — ${Utils.formatDate(this.startDate)} to ${Utils.formatDate(this.endDate)} (${logs.length} Records)
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Emp #</th><th>Log Date</th><th>Clock In</th><th>Clock Out</th><th>Biometric Device</th><th>Status</th></tr></thead>
            <tbody>
              ${logs.length === 0 ? '<tr><td colspan="7" class="text-center text-muted" style="padding:28px">No hardware punch logs recorded in this period.</td></tr>' :
                logs.map(log => {
                  const emp = emps.find(e => e.id === log.employeeId) || DB.find('employees', log.employeeId);
                  return `<tr>
                    <td style="font-weight:600">${emp?.fullName || '—'}</td>
                    <td><span style="font-family:monospace;color:var(--primary);font-weight:700">${emp?.empNo || '—'}</span></td>
                    <td>${Utils.formatDate(log.date)}</td>
                    <td style="color:var(--success);font-weight:700">${log.timeIn || '—'}</td>
                    <td style="color:var(--danger);font-weight:700">${log.timeOut || '—'}</td>
                    <td><span class="chip"><i class="fa fa-fingerprint" style="margin-right:4px"></i>${log.device || 'ZKTeco uFace 800'}</span></td>
                    <td>${Utils.statusBadge(log.status)}</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  calcLateBy(timeIn) {
    if (!timeIn) return 0;
    const [h, m] = timeIn.split(':').map(Number);
    const late = (h * 60 + m) - (9 * 60 + 15);
    return Math.max(0, late);
  },

  exportCSV() {
    const table = document.querySelector('#report-output table');
    if (!table) {
      Toast.show('No tabular data to export', 'warning');
      return;
    }
    const rows = [];
    table.querySelectorAll('tr').forEach(tr => {
      const row = [];
      tr.querySelectorAll('th, td').forEach(cell => {
        let text = cell.innerText.replace(/\r?\n|\r/g, ' ').trim();
        text = text.replace(/"/g, '""');
        row.push(`"${text}"`);
      });
      if (row.length > 0) rows.push(row.join(','));
    });
    const csvContent = rows.join('\n');
    const filename = `${this.currentReport || 'report'}_${this.startDate}_to_${this.endDate}.csv`;
    Utils.downloadCSV(csvContent, filename);
    Toast.show(`Report exported to ${filename}!`, 'success');
  },

  exportPDF() {
    Toast.show('Opening print dialogue for PDF generation...', 'info');
    window.print();
  },
};
