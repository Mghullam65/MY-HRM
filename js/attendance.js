// ============================================================
// HRM SYSTEM — Attendance Module
// ============================================================

const Attendance = {
  currentView: 'daily',
  currentDate: Utils.today(),
  currentMonth: Utils.thisMonth(),

  getScopedEmployees() {
    let emps = DB.get('employees').filter(e => e.status === 'active');
    if (Auth.role === 'dept_manager') {
      const myId = Auth.employee?.id;
      emps = emps.filter(e => e.managerId === myId || e.reportingTo === myId);
    }
    return emps;
  },

  render() {
    const content = document.getElementById('page-content');
    const scopedEmps = this.getScopedEmployees();
    const scopedIds = scopedEmps.map(e => e.id);
    const totalEmps = scopedEmps.length;
    const allAtt = DB.get('attendance');
    const att = Auth.role === 'dept_manager' ? allAtt.filter(a => scopedIds.includes(a.employeeId)) : allAtt;
    const today = Utils.today();
    const todayAtt = att.filter(a => a.date === today);

    const present = todayAtt.filter(a => a.status === 'present').length;
    const absent  = todayAtt.filter(a => a.status === 'absent').length;
    const late    = todayAtt.filter(a => a.status === 'late').length;
    const half    = todayAtt.filter(a => a.status === 'half_day').length;
    const ot      = todayAtt.filter(a => a.overtime > 0).length;

    const allCorrections = DB.get('attendance_corrections') || [];
    const pendingCorrections = allCorrections.filter(c => {
      if (Auth.role === 'dept_manager') {
        return scopedIds.includes(c.employeeId) && (c.status === 'pending' || c.status === 'manager_approved');
      }
      return c.status === 'pending' || c.status === 'manager_approved';
    }).length;

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Dashboard Summary -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px">
          ${[
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

        <!-- Active Time-In Window Banner -->
        <div style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(16,185,129,0.06));border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:10px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--text)">
            <i class="fa fa-clock" style="color:var(--primary);font-size:16px"></i>
            <span><strong>Time-In Window Rule Active:</strong> Morning Shift Cutoff: <strong>10:00 AM – 11:00 AM</strong>. Punches after <strong>11:00 AM</strong> are automatically recorded as <strong>Late</strong> and require audit resolution before payroll.</span>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.showTimeInWindowConfig()"><i class="fa fa-sliders"></i> Edit Windows</button>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('administration'); setTimeout(() => Administration.switchSection('discrepancies'), 100);"><i class="fa fa-triangle-exclamation" style="color:var(--warning)"></i> Audit Center</button>
          </div>
        </div>

        <!-- View Tabs + Actions -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:gap">
          <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;flex-wrap:wrap">
            ${[
              { id:'daily', label:'Daily' }, { id:'monthly', label:'Monthly' },
              { id:'employee', label:'Employee Wise' }, { id:'dept', label:'Department Wise' },
              { id:'machine', label:'Machine Log' }, { id:'manual', label:'Manual Entry' },
              { id:'corrections', label:'Corrections & WFH', badge: pendingCorrections },
            ].map(t => `
              <button class="tab-toggle-btn ${this.currentView===t.id?'active':''}" onclick="Attendance.switchView('${t.id}')">
                ${t.label} ${t.badge ? `<span class="badge badge-warning" style="margin-left:5px;font-size:10px;padding:2px 6px">${t.badge}</span>` : ''}
              </button>
            `).join('')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="Attendance.showTimeInWindowConfig()"><i class="fa fa-clock"></i> Time-In Windows</button>
            <button class="btn btn-ghost btn-sm" onclick="Attendance.exportAttendance()"><i class="fa fa-file-export"></i> Export CSV</button>
            <button class="btn btn-secondary btn-sm" onclick="Attendance.showBulkAttendance()"><i class="fa fa-users-line"></i> Bulk Mark</button>
            <button class="btn btn-primary btn-sm" onclick="Attendance.showMarkAttendance()"><i class="fa fa-plus"></i> Mark Attendance</button>
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

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('.tab-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.trim().toLowerCase().replace(/\s+/g, '') === view.replace(/\s+/g,''));
    });
    // Re-identify buttons by their onclick
    document.querySelectorAll('[onclick*="Attendance.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\w+)'/);
      if (m) b.classList.toggle('active', m[1] === view);
    });
    this.renderView();
  },

  renderView() {
    const container = document.getElementById('att-content');
    if (!container) return;
    switch(this.currentView) {
      case 'daily':       this.renderDaily(container); break;
      case 'monthly':     this.renderMonthly(container); break;
      case 'employee':    this.renderEmployeeWise(container); break;
      case 'dept':        this.renderDeptWise(container); break;
      case 'machine':     this.renderMachineLog(container); break;
      case 'manual':      this.renderManualEntry(container); break;
      case 'corrections': this.renderCorrections(container); break;
    }
  },

  renderDaily(container) {
    const emps = this.getScopedEmployees();
    const scopedIds = emps.map(e => e.id);
    const att = DB.get('attendance').filter(a => a.date === this.currentDate && scopedIds.includes(a.employeeId));

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
          <button class="btn btn-ghost btn-sm" onclick="Attendance.prevDay()"><i class="fa fa-chevron-left"></i></button>
          <input type="date" class="form-control" style="width:160px" value="${this.currentDate}" onchange="Attendance.currentDate=this.value;Attendance.renderView()">
          <button class="btn btn-ghost btn-sm" onclick="Attendance.nextDay()"><i class="fa fa-chevron-right"></i></button>
          <span style="font-size:13px;color:var(--text-3)">${Utils.formatDate(this.currentDate)}</span>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Time In</th><th>Time Out</th><th>Working Hours</th><th>Overtime</th><th>Device</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${emps.map(emp => {
                const rec = att.find(a => a.employeeId === emp.id);
                const hours = rec?.timeIn && rec?.timeOut ? this.calcHours(rec.timeIn, rec.timeOut) : '—';
                return `
                  <tr>
                    <td><div style="display:flex;align-items:center;gap:10px">
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                      <div><div style="font-weight:600;font-size:13px">${emp.fullName}</div><div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div></div>
                    </div></td>
                    <td style="color:var(--success);font-weight:600">${rec?.timeIn || '—'}</td>
                    <td style="color:var(--danger);font-weight:600">${rec?.timeOut || '—'}</td>
                    <td>${hours}</td>
                    <td>${rec?.overtime ? `<span class="badge badge-primary">${rec.overtime}h</span>` : '—'}</td>
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
    const scopedIds = emps.map(e => e.id);
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
        </div>
        <div style="font-size:12px;color:var(--text-3);display:flex;gap:12px;align-items:center">
          <span><strong style="color:var(--text)">${emps.length}</strong> Employees</span>
          <span><strong style="color:var(--text)">${daysInMonth}</strong> Days</span>
          <span>Click any cell to edit record</span>
        </div>
      </div>
      <div class="table-wrapper" style="overflow-x:auto;max-height:600px">
        <table style="min-width:${180 + days.length * 36 + 180}px;border-collapse:separate;border-spacing:0">
          <thead style="position:sticky;top:0;z-index:10;background:var(--surface)">
            <tr>
              <th style="min-width:180px;position:sticky;left:0;z-index:11;background:var(--surface)">Employee</th>
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
            ${emps.map(emp => {
              let p=0, a=0, l=0, hd=0;
              return `<tr>
                <td style="position:sticky;left:0;background:var(--card);z-index:2">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)};width:26px;height:26px;font-size:10px">${Utils.avatarInitials(emp.fullName)}</div>
                    <div>
                      <div style="font-size:12px;font-weight:600;white-space:nowrap">${emp.fullName}</div>
                      <div style="font-size:10px;color:var(--text-muted)">${emp.empNo}</div>
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
    const scopedIds = emps.map(e => e.id);
    const att = DB.get('attendance').filter(a => scopedIds.includes(a.employeeId));
    container.innerHTML = `
      <div class="card" style="padding:0">
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Late</th><th>Half Day</th><th>Overtime Hrs</th><th>Attendance %</th></tr></thead>
            <tbody>
              ${emps.map(emp => {
                const empAtt = att.filter(a => a.employeeId === emp.id && a.date.startsWith('2026-08'));
                const p  = empAtt.filter(a => a.status === 'present').length;
                const ab = empAtt.filter(a => a.status === 'absent').length;
                const l  = empAtt.filter(a => a.status === 'late').length;
                const hd = empAtt.filter(a => a.status === 'half_day').length;
                const ot = empAtt.reduce((s,a) => s + (a.overtime||0), 0);
                const total = empAtt.length || 1;
                const pct = Math.round(((p+l)/total)*100);
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                    <div><div style="font-weight:600;font-size:13px">${emp.fullName}</div><div style="font-size:11px;color:var(--text-3)">${emp.empNo}</div></div>
                  </div></td>
                  <td>${total}</td>
                  <td style="color:var(--success);font-weight:600">${p}</td>
                  <td style="color:var(--danger);font-weight:600">${ab}</td>
                  <td style="color:var(--warning);font-weight:600">${l}</td>
                  <td style="color:var(--accent);font-weight:600">${hd}</td>
                  <td>${ot}h</td>
                  <td><div style="display:flex;align-items:center;gap:8px"><div class="progress" style="flex:1"><div class="progress-bar" style="width:${pct}%;background:${pct>=90?'var(--success)':pct>=75?'var(--warning)':'var(--danger)'}"></div></div><span style="font-size:12px;font-weight:600;color:${pct>=90?'var(--success)':pct>=75?'var(--warning)':'var(--danger)'}">${pct}%</span></div></td>
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

  renderMachineLog(container) {
    const emps = this.getScopedEmployees();
    const scopedIds = emps.map(e => e.id);
    let logs = DB.get('attendance_logs') || [];
    if (Auth.role === 'dept_manager') {
      logs = logs.filter(l => scopedIds.includes(l.employeeId));
    }
    container.innerHTML = `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 18px;display:flex;align-items:center;gap:12px">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--success);box-shadow:0 0 8px var(--success)"></div>
          <div>
            <div style="font-size:11px;color:var(--text-3)">ZKTeco-01</div>
            <div style="font-size:13px;font-weight:600;color:var(--success)">Online</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 18px;display:flex;align-items:center;gap:12px">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--success);box-shadow:0 0 8px var(--success)"></div>
          <div>
            <div style="font-size:11px;color:var(--text-3)">ZKTeco-02</div>
            <div style="font-size:13px;font-weight:600;color:var(--success)">Online</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 18px;display:flex;align-items:center;gap:12px">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--warning);box-shadow:0 0 8px var(--warning)"></div>
          <div>
            <div style="font-size:11px;color:var(--text-3)">BioTime-01</div>
            <div style="font-size:13px;font-weight:600;color:var(--warning)">Syncing...</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="Toast.show('Syncing machine data...','info','This may take a moment')"><i class="fa fa-rotate"></i> Sync Now</button>
      </div>
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-size:14px;font-weight:600">Machine Log — ${Utils.formatDate(this.currentDate)}</div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Employee</th><th>Emp #</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Device</th><th>Status</th></tr></thead>
            <tbody>
              ${logs.map(log => {
                const emp = emps.find(e => e.id === log.employeeId);
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(log.employeeId)}">${Utils.avatarInitials(emp?.fullName||'?')}</div>
                    <span style="font-weight:500">${emp?.fullName || '—'}</span>
                  </div></td>
                  <td><span style="font-family:monospace;font-size:12px;color:var(--primary)">${emp?.empNo||'—'}</span></td>
                  <td>${Utils.formatDate(log.date)}</td>
                  <td style="color:var(--success);font-weight:700">${log.timeIn||'—'}</td>
                  <td style="color:var(--danger);font-weight:700">${log.timeOut||'—'}</td>
                  <td><span class="chip"><i class="fa fa-fingerprint" style="color:var(--primary);margin-right:4px"></i>${log.device||'—'}</span></td>
                  <td>${Utils.statusBadge(log.status)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
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
          <div class="form-group"><label class="form-label required">Time In</label><input type="time" class="form-control" id="man-in" value="09:00"></div>
          <div class="form-group"><label class="form-label required">Time Out</label><input type="time" class="form-control" id="man-out" value="18:00"></div>
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
          <div class="form-group"><label class="form-label">Overtime (hours)</label><input type="number" class="form-control" id="man-ot" value="0" min="0" max="12"></div>
        </div>
        <div class="form-group"><label class="form-label">Remarks</label><input class="form-control" id="man-remarks" placeholder="Optional remarks"></div>
        <button class="btn btn-primary w-full" onclick="Attendance.saveManual()"><i class="fa fa-save"></i> Save Attendance</button>
      </div>
    `;
  },

  saveManual() {
    const empId   = parseInt(document.getElementById('man-emp').value);
    const date    = document.getElementById('man-date').value;
    const timeIn  = document.getElementById('man-in').value;
    const timeOut = document.getElementById('man-out').value;
    const status  = document.getElementById('man-status').value;
    const overtime = parseInt(document.getElementById('man-ot').value) || 0;
    const remarks = document.getElementById('man-remarks').value;

    const existing = DB.get('attendance').find(a => a.employeeId === empId && a.date === date);
    if (existing) {
      DB.update('attendance', existing.id, { timeIn, timeOut, status, overtime, remarks, device: 'Manual' });
    } else {
      DB.add('attendance', { id: DB.nextId('attendance'), employeeId: empId, date, timeIn, timeOut, status, overtime, device: 'Manual', remarks });
    }
    DB.log('ADD', 'Attendance', `Manual attendance for ${Utils.getEmpName(empId)} on ${date}`, Auth.user?.id);
    Toast.show('Attendance saved!', 'success');
    this.currentDate = date;
    this.switchView('daily');
  },

  editRecord(empId, date) {
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
          <label class="form-label">Time In</label>
          <input type="time" class="form-control" id="ed-att-in" value="${rec?.timeIn || '09:00'}">
        </div>
        <div class="form-group">
          <label class="form-label">Time Out</label>
          <input type="time" class="form-control" id="ed-att-out" value="${rec?.timeOut || '18:00'}">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Overtime (hours)</label>
          <input type="number" class="form-control" id="ed-att-ot" value="${rec?.overtime || 0}" min="0" max="12">
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
    const shift = shifts.find(s => s.id === (emp?.shiftId || 1)) || shifts[0];
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
    const overtime = parseInt(document.getElementById('ed-att-ot')?.value) || 0;
    const device = document.getElementById('ed-att-device')?.value.trim() || 'Manual';
    let remarks = document.getElementById('ed-att-remarks')?.value.trim() || '';

    // Automated Late evaluation against Time-In Window Cutoff (e.g. 11:00 AM)
    const evalRes = this.evaluateTimeIn(empId, timeIn, rawStatus);
    const finalStatus = evalRes.isLate ? 'late' : rawStatus;
    if (evalRes.isLate && !remarks) {
      remarks = evalRes.autoRemark;
    }

    if (recId) {
      DB.update('attendance', recId, { date, status: finalStatus, timeIn, timeOut, overtime, device, remarks });
      DB.log('UPDATE', 'Attendance', `Updated attendance for ${Utils.getEmpName(empId)} on ${date} (${finalStatus})`, Auth.user?.id);
    } else {
      DB.add('attendance', {
        id: DB.nextId('attendance'),
        employeeId: empId,
        date, status: finalStatus, timeIn, timeOut, overtime, device, remarks
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
    Modal.confirm('Delete Attendance Record', 'Are you sure you want to delete this attendance record?', () => {
      DB.delete('attendance', recId);
      DB.log('DELETE', 'Attendance', `Deleted attendance record #${recId}`, Auth.user?.id);
      Modal.close('dynamic-modal');
      Toast.show('Attendance record deleted!', 'warning');
      this.renderView();
    });
  },

  showBulkAttendance() {
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

    const headers = ['Employee #', 'Employee Name', 'Department', 'Date', 'Status', 'Time In', 'Time Out', 'Working Hours', 'Overtime (hrs)', 'Device', 'Remarks'];
    const rows = filtered.map(a => {
      const emp = emps.find(e => e.id === a.employeeId);
      const dept = emp ? Utils.getDeptName(emp.departmentId) : '';
      const hours = (a.timeIn && a.timeOut) ? this.calcHours(a.timeIn, a.timeOut) : '';
      return [
        emp?.empNo || a.employeeId,
        `"${(emp?.fullName || '').replace(/"/g, '""')}"`,
        `"${dept.replace(/"/g, '""')}"`,
        a.date,
        a.status,
        a.timeIn || '',
        a.timeOut || '',
        `"${hours}"`,
        a.overtime || 0,
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
    const scopedEmps = this.getScopedEmployees();
    const scopedIds = scopedEmps.map(e => e.id);
    let corrections = DB.get('attendance_corrections') || [];
    if (Auth.role === 'dept_manager') {
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
              Attendance Correction & Work From Home Requests
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              ${Auth.role === 'dept_manager' ? 'Showing requests from your assigned team members (First-tier approval)' : 'Universal corporate requests (Direct manager review & HR/Admin final approval)'}
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
                <th>Reason & Notes</th>
                <th>Reporting Line & Status</th>
                <th>Action</th>
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
                      <span style="color:var(--success);font-weight:600">${c.timeIn || '09:00'}</span> – 
                      <span style="color:var(--danger);font-weight:600">${c.timeOut || '18:00'}</span>
                    </td>
                    <td style="max-width:240px;font-size:12px">
                      <div style="font-weight:500;color:var(--text)">${c.reason || '—'}</div>
                      ${c.managerRemarks ? `<div style="font-size:10.5px;color:var(--primary);margin-top:2px"><i class="fa fa-comment"></i> Mgr: ${c.managerRemarks}</div>` : ''}
                      ${c.hrRemarks ? `<div style="font-size:10.5px;color:var(--success);margin-top:2px"><i class="fa fa-comment-check"></i> HR: ${c.hrRemarks}</div>` : ''}
                    </td>
                    <td>
                      <div style="display:flex;flex-direction:column;gap:3px">
                        ${c.status === 'pending' ? `
                          <span class="badge badge-warning" style="font-size:11px"><i class="fa fa-clock"></i> Pending Direct Manager</span>
                        ` : c.status === 'manager_approved' ? `
                          <span class="badge badge-info" style="font-size:11px"><i class="fa fa-user-check"></i> Mgr Approved (Awaiting HR/Admin)</span>
                        ` : c.status === 'approved' ? `
                          <span class="badge badge-success" style="font-size:11px"><i class="fa fa-check-double"></i> Approved & Synced</span>
                        ` : `
                          <span class="badge badge-danger" style="font-size:11px"><i class="fa fa-ban"></i> Rejected</span>
                        `}
                        <span style="font-size:10px;color:var(--text-muted)">Chain: Manager ➔ HR ➔ Admin</span>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap">
                        ${(c.status === 'pending' && canManagerApprove) ? `
                          <button class="btn btn-sm btn-primary" onclick="Attendance.approveCorrection(${c.id}, 'manager')" title="Approve as Reporting Manager">
                            <i class="fa fa-check"></i> Manager Approve
                          </button>
                        ` : ''}
                        ${(canFinalApprove && (c.status === 'pending' || c.status === 'manager_approved')) ? `
                          <button class="btn btn-sm btn-success" onclick="Attendance.approveCorrection(${c.id}, 'final')" title="Final Approval & Sync to Attendance">
                            <i class="fa fa-check-double"></i> Final Approve
                          </button>
                        ` : ''}
                        ${(c.status === 'pending' || c.status === 'manager_approved') ? `
                          <button class="btn btn-sm btn-danger" onclick="Attendance.rejectCorrection(${c.id})" title="Reject Request">
                            <i class="fa fa-times"></i>
                          </button>
                        ` : ''}
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

  approveCorrection(corrId, tier) {
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

      if (existing) {
        existing.status = 'present';
        existing.timeIn = item.timeIn || '09:00';
        existing.timeOut = item.timeOut || '18:00';
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
          overtime: 0,
          device: deviceName,
          remarks: note
        });
      }
      DB.set('attendance', allAtt);
      DB.log('APPROVE', 'Attendance', `Final approval granted for attendance correction #${corrId} (Synced to attendance)`, Auth.user?.id);
      Toast.show('Final Approval Granted!', 'success', 'Attendance record synchronized for this date.');
    }

    this.render();
  },

  rejectCorrection(corrId) {
    Modal.confirm('Reject Attendance Correction', 'Are you sure you want to reject this request?', () => {
      let corrections = DB.get('attendance_corrections') || [];
      const item = corrections.find(c => c.id === corrId);
      if (item) {
        item.status = 'rejected';
        item.hrRemarks = `Rejected by ${Auth.user?.username || 'Management'}`;
        DB.set('attendance_corrections', corrections);
        DB.log('REJECT', 'Attendance', `Rejected attendance correction #${corrId}`, Auth.user?.id);
        Toast.show('Request rejected.', 'warning');
        this.render();
      }
    });
  },

  showApplyCorrectionModal() {
    const emps = this.getScopedEmployees();
    Modal.show('Apply Attendance Correction / Work From Home', `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Employee</label>
          <select class="form-control" id="ac-emp">
            ${emps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}
          </select>
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
          <input type="date" class="form-control" id="ac-date" value="${Utils.today()}">
        </div>
        <div class="form-group">
          <label class="form-label required">Time In</label>
          <input type="time" class="form-control" id="ac-in" value="09:00">
        </div>
        <div class="form-group">
          <label class="form-label required">Time Out</label>
          <input type="time" class="form-control" id="ac-out" value="18:00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Reason / Justification</label>
        <textarea class="form-control" id="ac-reason" rows="3" placeholder="Explain the cause of missing punch or reason for working remotely..."></textarea>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text-3)">
        <i class="fa fa-info-circle" style="color:var(--primary);margin-right:6px"></i>
        Requests are routed first to the Direct Reporting Manager (Deputy Manager), then forwarded to HR / Admin for final synchronized approval.
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Attendance.saveCorrection()"><i class="fa fa-paper-plane"></i> Submit Request</button>
      `
    });
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

    const emp = DB.find('employees', empId);
    let corrections = DB.get('attendance_corrections') || [];
    const newCorr = {
      id: DB.nextId('attendance_corrections'),
      employeeId: empId,
      date,
      type,
      timeIn,
      timeOut,
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
    DB.log('APPLY', 'Attendance', `Submitted ${type} request for ${emp?.fullName} on ${date}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Request submitted successfully!', 'success', 'Sent to direct reporting manager for first approval.');
    this.render();
  },

  calcHours(timeIn, timeOut) {
    if (!timeIn || !timeOut) return '—';
    const [inH, inM] = timeIn.split(':').map(Number);
    const [outH, outM] = timeOut.split(':').map(Number);
    const mins = (outH * 60 + outM) - (inH * 60 + inM);
    if (mins <= 0) return '—';
    return `${Math.floor(mins/60)}h ${mins%60}m`;
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
    const [y, m] = this.currentMonth.split('-').map(Number);
    const d = new Date(y, m); this.currentMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    this.renderView();
  },
};
