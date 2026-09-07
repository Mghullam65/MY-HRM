// ============================================================
// HRM SYSTEM — Administration Module
// ============================================================

const Administration = {
  currentSection: 'departments',
  auditMonth: typeof Utils !== 'undefined' ? Utils.thisMonth() : new Date().toISOString().slice(0,7),
  auditStatusFilter: 'all',
  auditCategoryFilter: 'all',
  auditSearch: '',

  render() {
    const content = document.getElementById('page-content');
    const curMonth = this.auditMonth || (typeof Utils !== 'undefined' ? Utils.thisMonth() : '2026-09');
    const unresolvedIssues = this.getAttendanceLeaveProblems(curMonth).filter(p => !p.isResolved);

    const sections = [
      { id:'departments', label:'Departments', icon:'fa-building-user' },
      { id:'designations', label:'Designations', icon:'fa-id-badge' },
      { id:'branches', label:'Branches', icon:'fa-building' },
      { id:'shifts', label:'Shifts & Windows', icon:'fa-clock' },
      { id:'discrepancies', label:'Attendance & Leave Audit', icon:'fa-triangle-exclamation', badge: unresolvedIssues.length },
      { id:'banks', label:'Banks', icon:'fa-landmark' },
      { id:'salary_grades', label:'Salary Grades', icon:'fa-layer-group' },
      { id:'skills', label:'Skills', icon:'fa-star' },
      { id:'projects', label:'Projects', icon:'fa-diagram-project' },
      { id:'teams', label:'Teams', icon:'fa-people-group' },
      { id:'assets', label:'Assets', icon:'fa-laptop' },
      { id:'users', label:'Users', icon:'fa-user-gear' },
      { id:'roles', label:'Roles & Permissions', icon:'fa-shield-halved' },
      { id:'audit', label:'Audit Logs', icon:'fa-scroll' },
      { id:'holidays', label:'Holidays', icon:'fa-calendar-days' },
    ];

    content.innerHTML = `
      <div class="animate-fade-in" style="display:grid;grid-template-columns:230px 1fr;gap:20px">
        <!-- Left Nav -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:8px;height:fit-content;position:sticky;top:0">
          ${sections.map(s => `
            <div class="nav-item ${this.currentSection === s.id ? 'active' : ''}" onclick="Administration.switchSection('${s.id}')" data-label="${s.label}">
              <i class="fa ${s.icon}" ${s.id === 'discrepancies' && s.badge > 0 ? 'style="color:var(--danger)"' : ''}></i>
              <span>${s.label}</span>
              ${s.badge ? `<span class="badge badge-danger" style="margin-left:auto;font-size:10px;padding:2px 7px;border-radius:10px">${s.badge}</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Right Content -->
        <div id="admin-content"></div>
      </div>
    `;

    this.renderSection();
  },

  switchSection(section) {
    this.currentSection = section;
    document.querySelectorAll('[onclick*="Administration.switchSection"]').forEach(el => {
      const m = el.getAttribute('onclick').match(/'(\w+)'/);
      if (m) el.classList.toggle('active', m[1] === section);
    });
    this.renderSection();
  },

  renderSection() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    switch(this.currentSection) {
      case 'departments':   this.renderDepartments(container); break;
      case 'designations':  this.renderDesignations(container); break;
      case 'branches':      this.renderBranches(container); break;
      case 'shifts':        this.renderShifts(container); break;
      case 'discrepancies': this.renderDiscrepancies(container); break;
      case 'banks':         this.renderBanks(container); break;
      case 'salary_grades': this.renderSalaryGrades(container); break;
      case 'skills':        this.renderSkills(container); break;
      case 'projects':      this.renderProjects(container); break;
      case 'teams':         this.renderTeams(container); break;
      case 'assets':        this.renderAssets(container); break;
      case 'users':         this.renderUsers(container); break;
      case 'roles':         this.renderRoles(container); break;
      case 'audit':         this.renderAuditLog(container); break;
      case 'holidays':      this.renderHolidays(container); break;
      default:              container.innerHTML = '<div class="empty-state"><i class="fa fa-construction"></i><h3>Coming Soon</h3></div>';
    }
  },

  // ── Generic table + header helper ──
  tableCard(title, addBtn, headers, rows, count) {
    return `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div><span style="font-size:14px;font-weight:700">${title}</span><span style="margin-left:8px;font-size:12px;color:var(--text-3)">${count} records</span></div>
          ${addBtn}
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderDepartments(container) {
    const depts = DB.get('departments');
    const emps = DB.get('employees');
    const rows = depts.map(d => `<tr>
      <td style="font-weight:700">${d.name}</td>
      <td><span class="chip">${d.code}</span></td>
      <td>${Utils.getEmpName(d.headId)}</td>
      <td><strong>${emps.filter(e=>e.departmentId===d.id&&e.status==='active').length}</strong></td>
      <td>${Utils.statusBadge(d.status)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editDept(${d.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteDept(${d.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Departments',
      Auth.role==='superadmin' ? `<button class="btn btn-primary btn-sm" onclick="Administration.showAddDept()"><i class="fa fa-plus"></i> Add</button>` : '',
      ['Department Name','Code','Head','Employees','Status','Actions'], rows, depts.length
    );
  },

  renderDesignations(container) {
    const desigs = DB.get('designations');
    const rows = desigs.map(d => `<tr>
      <td style="font-weight:600">${d.name}</td>
      <td>${Utils.getDeptName(d.departmentId)}</td>
      <td><span class="chip">${d.level}</span></td>
      <td>${Utils.statusBadge(d.status)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editDesig(${d.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteDesig(${d.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Designations',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddDesig()"><i class="fa fa-plus"></i> Add</button>`,
      ['Designation','Department','Level','Status','Actions'], rows, desigs.length
    );
  },

  renderBranches(container) {
    const branches = DB.get('branches');
    const rows = branches.map(b => `<tr>
      <td style="font-weight:700">${b.name}</td>
      <td>${b.city}</td>
      <td>${b.address}</td>
      <td>${Utils.statusBadge(b.status)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editBranch(${b.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteBranch(${b.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Branches',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddBranch()"><i class="fa fa-plus"></i> Add Branch</button>`,
      ['Branch Name','City','Address','Status','Actions'], rows, branches.length
    );
  },

  renderShifts(container) {
    const shifts = DB.get('shifts');
    const rows = shifts.map(s => `<tr>
      <td style="font-weight:700">${s.name}</td>
      <td style="color:var(--success);font-weight:600">${s.startTime} – ${s.endTime}</td>
      <td>
        <span class="badge badge-info" style="font-size:12px;display:inline-flex;align-items:center;gap:5px">
          <i class="fa fa-clock"></i> ${s.timeInWindowStart || '10:00'} – ${s.timeInWindowEnd || '11:00'}
        </span>
        <div style="font-size:11px;color:var(--text-3);margin-top:3px">Cutoff: <strong>${s.timeInWindowEnd || '11:00'}</strong> (Marked late after)</div>
      </td>
      <td>${s.gracePeriod} min</td>
      <td>${Utils.statusBadge(s.status)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editShift(${s.id})" title="Edit Shift & Window"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteShift(${s.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Shifts & Time-In Windows',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddShift()"><i class="fa fa-plus"></i> Add Shift</button>`,
      ['Shift Name','Work Hours','Time-In Window (Cutoff)','Grace Period','Status','Actions'], rows, shifts.length
    );
  },

  renderBanks(container) {
    const banks = DB.get('banks');
    const rows = banks.map(b => `<tr>
      <td style="font-weight:700">${b.name}</td>
      <td><span class="chip">${b.code}</span></td>
      <td style="font-family:monospace;font-size:12px">${b.swiftCode}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editBank(${b.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteBank(${b.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Banks',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddBank()"><i class="fa fa-plus"></i> Add Bank</button>`,
      ['Bank Name','Code','SWIFT Code','Actions'], rows, banks.length
    );
  },

  renderSalaryGrades(container) {
    const grades = DB.get('salary_grades');
    const rows = grades.map(g => `<tr>
      <td style="font-weight:700">${g.grade}</td>
      <td>${g.description}</td>
      <td style="color:var(--success)">${Utils.formatCurrency(g.minSalary)}</td>
      <td style="color:var(--warning)">${Utils.formatCurrency(g.maxSalary)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editGrade(${g.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteGrade(${g.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Salary Grades',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddGrade()"><i class="fa fa-plus"></i> Add Grade</button>`,
      ['Grade','Description','Min Salary','Max Salary','Actions'], rows, grades.length
    );
  },

  renderSkills(container) {
    const skills = DB.get('skills');
    const rows = skills.map(s => `<tr>
      <td style="font-weight:600">${s.name}</td>
      <td><span class="chip">${s.category}</span></td>
      <td>${Utils.statusBadge(s.status)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editSkill(${s.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteSkill(${s.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Skills',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddSkill()"><i class="fa fa-plus"></i> Add Skill</button>`,
      ['Skill Name','Category','Status','Actions'], rows, skills.length
    );
  },

  renderProjects(container) {
    const projects = DB.get('projects');
    const rows = projects.map(p => `<tr>
      <td style="font-weight:700">${p.name}</td>
      <td>${Utils.getDeptName(p.departmentId)}</td>
      <td>${Utils.getEmpName(p.managerId)}</td>
      <td>${Utils.formatDate(p.startDate)}</td>
      <td>${Utils.formatDate(p.endDate)}</td>
      <td><strong>${p.members.length}</strong></td>
      <td>${Utils.statusBadge(p.status)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editProject(${p.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteProject(${p.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Projects',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddProject()"><i class="fa fa-plus"></i> Add Project</button>`,
      ['Project','Department','Manager','Start','End','Members','Status','Actions'], rows, projects.length
    );
  },

  renderTeams(container) {
    const teams = DB.get('teams');
    const rows = teams.map(t => `<tr>
      <td style="font-weight:700">${t.name}</td>
      <td>${Utils.getDeptName(t.departmentId)}</td>
      <td>${Utils.getEmpName(t.leaderId)}</td>
      <td><strong>${t.members.length}</strong> members</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editTeam(${t.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteTeam(${t.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Teams',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddTeam()"><i class="fa fa-plus"></i> Add Team</button>`,
      ['Team Name','Department','Team Lead','Members','Actions'], rows, teams.length
    );
  },

  renderAssets(container) {
    const assets = DB.get('assets');
    const rows = assets.map(a => `<tr>
      <td style="font-weight:600">${a.name}</td>
      <td><span style="font-family:monospace;font-size:12px;color:var(--primary)">${a.code}</span></td>
      <td><span class="chip">${a.category}</span></td>
      <td>${a.assignedTo ? Utils.getEmpName(a.assignedTo) : '<span class="text-muted">Unassigned</span>'}</td>
      <td>${Utils.formatDate(a.assignedOn)}</td>
      <td><span class="badge ${a.condition==='excellent'?'badge-success':a.condition==='good'?'badge-info':'badge-warning'}">${a.condition}</span></td>
      <td>${Utils.statusBadge(a.status)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editAsset(${a.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteAsset(${a.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Assets Registry',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddAsset()"><i class="fa fa-plus"></i> Add Asset</button>`,
      ['Asset Name','Code','Category','Assigned To','Assigned On','Condition','Status','Actions'], rows, assets.length
    );
  },

  renderUsers(container) {
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') {
      container.innerHTML = `<div class="alert alert-danger"><i class="fa fa-lock"></i> Only Super Admin and HR Manager can manage users and assign roles.</div>`;
      return;
    }
    const users = DB.get('users');
    const rows = users.map(u => `<tr>
      <td>${Utils.getEmpName(u.employeeId)}</td>
      <td style="font-family:monospace;color:var(--primary)">${u.username}</td>
      <td><span class="chip">${u.role.replace(/_/g,' ')}</span></td>
      <td style="font-size:12px;color:var(--text-3)">${u.lastLogin ? Utils.formatDate(u.lastLogin) : 'Never'}</td>
      <td>${Utils.statusBadge(u.status)}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editUser(${u.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.toggleUserStatus(${u.id})"><i class="fa fa-${u.status==='active'?'ban':'circle-check'}"></i></button>
        </div>
      </td>
    </tr>`).join('');

    container.innerHTML = this.tableCard('System Users',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddUser()"><i class="fa fa-plus"></i> Add User</button>`,
      ['Employee','Username','Role','Last Login','Status','Actions'], rows, users.length
    );
  },

  renderRoles(container) {
    if (Auth.role !== 'superadmin') {
      container.innerHTML = `<div class="alert alert-danger"><i class="fa fa-lock"></i> Only Super Admin can manage roles and permissions.</div>`;
      return;
    }
    const roles = DB.get('roles');
    const permsMap = DB.getObj('permissions');
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        ${roles.map(r => {
          const perms = permsMap[r.code] || [];
          return `
            <div class="card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <div>
                  <div style="font-size:15px;font-weight:700">${r.name}</div>
                  <div style="font-size:12px;color:var(--text-3)">${r.description}</div>
                </div>
                ${Auth.role === 'superadmin' && r.code !== 'superadmin' ? `<button class="btn btn-ghost btn-sm"><i class="fa fa-pen"></i> Edit Permissions</button>` : ''}
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${perms.includes('all') ? '<span class="badge badge-success">Full Access — All Modules</span>' :
                  perms.map(p => `<span class="chip" style="font-size:11px">${p}</span>`).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderAuditLog(container) {
    if (Auth.role !== 'superadmin') {
      container.innerHTML = `<div class="alert alert-danger"><i class="fa fa-lock"></i> Only Super Admin can view audit logs.</div>`;
      return;
    }
    const logs = DB.get('audit_logs');
    const actionColors = { LOGIN:'var(--success)', LOGOUT:'var(--text-muted)', ADD:'var(--primary)', UPDATE:'var(--warning)', DELETE:'var(--danger)', APPROVE:'var(--success)', REJECT:'var(--danger)', PROCESS:'var(--info)', APPLY:'var(--accent)' };
    const rows = logs.map(l => `<tr>
      <td><span class="badge" style="background:${actionColors[l.action]||'var(--primary)'}22;color:${actionColors[l.action]||'var(--primary)'}">${l.action}</span></td>
      <td><span class="chip">${l.module}</span></td>
      <td style="font-size:12.5px">${l.details}</td>
      <td style="font-size:12px;color:var(--text-3)">${Utils.getEmpName(l.userId)}</td>
      <td style="font-size:12px;color:var(--text-muted)">${new Date(l.timestamp).toLocaleString('en-PK')}</td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Audit Logs',
      `<button class="btn btn-ghost btn-sm" onclick="Toast.show('Logs exported!','success')"><i class="fa fa-download"></i> Export</button>`,
      ['Action','Module','Details','User','Timestamp'], rows, logs.length
    );
  },

  renderHolidays(container) {
    const holidays = DB.get('holidays').sort((a,b) => a.date.localeCompare(b.date));
    const rows = holidays.map(h => `<tr>
      <td style="font-weight:700">${h.name}</td>
      <td>${Utils.formatDate(h.date)}</td>
      <td><span class="badge ${h.type==='national'?'badge-primary':'badge-success'}">${h.type.charAt(0).toUpperCase()+h.type.slice(1)}</span></td>
      <td>${h.optional ? '<span class="badge badge-warning">Optional</span>' : '<span class="badge badge-success">Mandatory</span>'}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="Administration.editHoliday(${h.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Administration.deleteHoliday(${h.id})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
    container.innerHTML = this.tableCard('Public Holidays',
      `<button class="btn btn-primary btn-sm" onclick="Administration.showAddHoliday()"><i class="fa fa-plus"></i> Add Holiday</button>`,
      ['Holiday Name','Date','Type','Mandatory','Actions'], rows, holidays.length
    );
  },

  // ── Form handlers ──
  _genericForm(title, fields, saveFn) {
    Modal.show(title, fields.map(f => {
      if (f.type === 'select') {
        return `<div class="form-group"><label class="form-label ${f.required?'required':''}">${f.label}</label>
          <select class="form-control" id="${f.id}">${f.options.map(o => `<option value="${o.value||o}" ${f.value===(o.value||o)?'selected':''}>${o.label||o}</option>`).join('')}</select></div>`;
      }
      if (f.type === 'textarea') {
        return `<div class="form-group"><label class="form-label ${f.required?'required':''}">${f.label}</label>
          <textarea class="form-control" id="${f.id}" rows="2" placeholder="${f.placeholder||''}">${f.value||''}</textarea></div>`;
      }
      return `<div class="form-group"><label class="form-label ${f.required?'required':''}">${f.label}</label>
        <input class="form-control" id="${f.id}" type="${f.type||'text'}" value="${f.value||''}" placeholder="${f.placeholder||''}" ${f.maxlength?'maxlength="'+f.maxlength+'"':''} ${f.min!==undefined?'min="'+f.min+'"':''} ${f.max!==undefined?'max="'+f.max+'"':''}></div>`;
    }).join(''), {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="${saveFn}"><i class="fa fa-save"></i> Save</button>`
    });
  },

  // ── Department ──
  showAddDept() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    this._genericForm('Add Department', [
      { id:'df-name', label:'Department Name', required:true, placeholder:'e.g. Finance' },
      { id:'df-code', label:'Code', required:true, placeholder:'e.g. FIN', maxlength:5 },
      { id:'df-head', label:'Department Head', type:'select', options:emps.map(e=>({value:e.id,label:e.fullName})) },
    ], 'Administration.saveDept()');
  },

  saveDept() {
    const name = document.getElementById('df-name').value.trim();
    const code = document.getElementById('df-code').value.trim().toUpperCase();
    const headId = parseInt(document.getElementById('df-head').value);
    if (!name || !code) { Toast.show('Please fill required fields', 'error'); return; }
    DB.add('departments', { id: DB.nextId('departments'), name, code, headId, employeeCount: 0, status: 'active' });
    DB.log('ADD', 'Administration', `Department ${name} (${code}) created`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Department added!', 'success');
    this.renderSection();
  },

  editDept(id) {
    const dept = DB.find('departments', id);
    if (!dept) return;
    const emps = DB.get('employees').filter(e => e.status === 'active');
    this._genericForm(`Edit — ${dept.name}`, [
      { id:'df-ename', label:'Department Name', required:true, value:dept.name },
      { id:'df-ecode', label:'Code', required:true, value:dept.code, maxlength:5 },
      { id:'df-ehead', label:'Department Head', type:'select', value:dept.headId, options:emps.map(e=>({value:e.id,label:e.fullName})) },
    ], `Administration.updateDept(${id})`);
  },

  updateDept(id) {
    DB.update('departments', id, {
      name: document.getElementById('df-ename').value.trim(),
      code: document.getElementById('df-ecode').value.trim().toUpperCase(),
      headId: parseInt(document.getElementById('df-ehead').value),
    });
    Modal.close('dynamic-modal');
    DB.log('UPDATE', 'Administration', `Department updated`, Auth.user?.id);
    Toast.show('Department updated!', 'success');
    this.renderSection();
  },

  deleteDept(id) {
    const dept = DB.find('departments', id);
    const empCount = DB.get('employees').filter(e => e.departmentId === id && e.status === 'active').length;
    if (empCount > 0) {
      Toast.show(`Cannot delete — ${empCount} active employees in this department`, 'error');
      return;
    }
    Modal.confirm('Delete Department', `Are you sure you want to delete <strong>${dept?.name}</strong>?`,
      () => {
        DB.delete('departments', id);
        DB.log('DELETE', 'Administration', `Department ${dept?.name} deleted`, Auth.user?.id);
        Toast.show('Department deleted!', 'warning');
        this.renderSection();
      }, 'danger');
  },

  // ── Designation ──
  showAddDesig() {
    const depts = DB.get('departments');
    this._genericForm('Add Designation', [
      { id:'dg-name', label:'Designation Title', required:true, placeholder:'e.g. Senior Developer' },
      { id:'dg-dept', label:'Department', type:'select', options:depts.map(d=>({value:d.id,label:d.name})) },
      { id:'dg-level', label:'Level', type:'select', options:['Entry','Junior','Mid','Senior','Lead','Manager','Director','VP','C-Level'] },
    ], 'Administration.saveDesig()');
  },

  saveDesig() {
    const name = document.getElementById('dg-name').value.trim();
    if (!name) { Toast.show('Designation name required', 'error'); return; }
    DB.add('designations', { id: DB.nextId('designations'), name, departmentId: parseInt(document.getElementById('dg-dept').value), level: document.getElementById('dg-level').value, status: 'active' });
    Modal.close('dynamic-modal');
    Toast.show('Designation added!', 'success');
    this.renderSection();
  },

  // ── Branch ──
  showAddBranch() {
    this._genericForm('Add Branch', [
      { id:'br-name', label:'Branch Name', required:true, placeholder:'e.g. Lahore Office' },
      { id:'br-city', label:'City', required:true, placeholder:'e.g. Lahore' },
      { id:'br-address', label:'Address', type:'textarea', placeholder:'Full address' },
    ], 'Administration.saveBranch()');
  },

  saveBranch() {
    const name = document.getElementById('br-name').value.trim();
    const city = document.getElementById('br-city').value.trim();
    if (!name || !city) { Toast.show('Name and city are required', 'error'); return; }
    DB.add('branches', { id: DB.nextId('branches'), name, city, address: document.getElementById('br-address').value.trim(), status: 'active' });
    Modal.close('dynamic-modal');
    Toast.show('Branch added!', 'success');
    this.renderSection();
  },

  // ── Shift ──
  showAddShift() {
    this._genericForm('Add Shift & Time-In Window', [
      { id:'sh-name', label:'Shift Name', required:true, placeholder:'e.g. Morning Shift' },
      { id:'sh-start', label:'Work Start Time', type:'time', required:true, value:'09:00' },
      { id:'sh-end', label:'Work End Time', type:'time', required:true, value:'18:00' },
      { id:'sh-wstart', label:'Time-In Window Start (e.g. 10:00 AM)', type:'time', required:true, value:'10:00' },
      { id:'sh-wend', label:'Time-In Window Cutoff / End (e.g. 11:00 AM - Check-in after this is Late)', type:'time', required:true, value:'11:00' },
      { id:'sh-grace', label:'Grace Period (minutes)', type:'number', value:'15', min:0, max:60 },
    ], 'Administration.saveShift()');
  },

  saveShift() {
    const name = document.getElementById('sh-name').value.trim();
    if (!name) { Toast.show('Shift name required', 'error'); return; }
    DB.add('shifts', {
      id: DB.nextId('shifts'),
      name,
      startTime: document.getElementById('sh-start').value,
      endTime: document.getElementById('sh-end').value,
      timeInWindowStart: document.getElementById('sh-wstart')?.value || '10:00',
      timeInWindowEnd: document.getElementById('sh-wend')?.value || '11:00',
      gracePeriod: parseInt(document.getElementById('sh-grace').value) || 15,
      status: 'active'
    });
    Modal.close('dynamic-modal');
    Toast.show('Shift and Time-In window configured!', 'success');
    this.renderSection();
  },

  // ── Bank ──
  showAddBank() {
    this._genericForm('Add Bank', [
      { id:'bk-name', label:'Bank Name', required:true, placeholder:'e.g. Allied Bank' },
      { id:'bk-code', label:'Code', required:true, placeholder:'e.g. ABL', maxlength:10 },
      { id:'bk-swift', label:'SWIFT Code', placeholder:'e.g. ABPAPKKA' },
    ], 'Administration.saveBank()');
  },

  saveBank() {
    const name = document.getElementById('bk-name').value.trim();
    const code = document.getElementById('bk-code').value.trim().toUpperCase();
    if (!name || !code) { Toast.show('Name and code required', 'error'); return; }
    DB.add('banks', { id: DB.nextId('banks'), name, code, swiftCode: document.getElementById('bk-swift').value.trim() });
    Modal.close('dynamic-modal');
    Toast.show('Bank added!', 'success');
    this.renderSection();
  },

  // ── Salary Grade ──
  showAddGrade() {
    this._genericForm('Add Salary Grade', [
      { id:'sg-grade', label:'Grade Code', required:true, placeholder:'e.g. G-8' },
      { id:'sg-desc', label:'Description', placeholder:'e.g. Senior Management' },
      { id:'sg-min', label:'Min Salary (PKR)', type:'number', required:true, min:0, placeholder:'50000' },
      { id:'sg-max', label:'Max Salary (PKR)', type:'number', required:true, min:0, placeholder:'200000' },
    ], 'Administration.saveGrade()');
  },

  saveGrade() {
    const grade = document.getElementById('sg-grade').value.trim();
    if (!grade) { Toast.show('Grade code required', 'error'); return; }
    DB.add('salary_grades', { id: DB.nextId('salary_grades'), grade, description: document.getElementById('sg-desc').value.trim(), minSalary: parseInt(document.getElementById('sg-min').value) || 0, maxSalary: parseInt(document.getElementById('sg-max').value) || 0 });
    Modal.close('dynamic-modal');
    Toast.show('Salary grade added!', 'success');
    this.renderSection();
  },

  // ── Skills ──
  showAddSkill() {
    this._genericForm('Add Skill', [
      { id:'sk-name', label:'Skill Name', required:true, placeholder:'e.g. Node.js' },
      { id:'sk-cat', label:'Category', type:'select', options:['Technical','Management','Soft Skill','Language','Design','DevOps'] },
    ], 'Administration.saveSkill()');
  },

  saveSkill() {
    const name = document.getElementById('sk-name').value.trim();
    if (!name) { Toast.show('Skill name required', 'error'); return; }
    DB.add('skills', { id: DB.nextId('skills'), name, category: document.getElementById('sk-cat').value, status: 'active' });
    Modal.close('dynamic-modal');
    Toast.show('Skill added!', 'success');
    this.renderSection();
  },

  // ── Project ──
  showAddProject() {
    const depts = DB.get('departments');
    const emps = DB.get('employees').filter(e => e.status === 'active');
    this._genericForm('Add Project', [
      { id:'pj-name', label:'Project Name', required:true, placeholder:'e.g. ERP Migration' },
      { id:'pj-dept', label:'Department', type:'select', options:depts.map(d=>({value:d.id,label:d.name})) },
      { id:'pj-mgr', label:'Project Manager', type:'select', options:emps.map(e=>({value:e.id,label:e.fullName})) },
      { id:'pj-start', label:'Start Date', type:'date', required:true },
      { id:'pj-end', label:'End Date', type:'date' },
    ], 'Administration.saveProject()');
  },

  saveProject() {
    const name = document.getElementById('pj-name').value.trim();
    if (!name) { Toast.show('Project name required', 'error'); return; }
    DB.add('projects', { id: DB.nextId('projects'), name, departmentId: parseInt(document.getElementById('pj-dept').value), managerId: parseInt(document.getElementById('pj-mgr').value), startDate: document.getElementById('pj-start').value, endDate: document.getElementById('pj-end').value, status: 'active', members: [] });
    Modal.close('dynamic-modal');
    Toast.show('Project added!', 'success');
    this.renderSection();
  },

  // ── Team ──
  showAddTeam() {
    const depts = DB.get('departments');
    const emps = DB.get('employees').filter(e => e.status === 'active');
    this._genericForm('Add Team', [
      { id:'tm-name', label:'Team Name', required:true, placeholder:'e.g. Backend Team' },
      { id:'tm-dept', label:'Department', type:'select', options:depts.map(d=>({value:d.id,label:d.name})) },
      { id:'tm-lead', label:'Team Lead', type:'select', options:emps.map(e=>({value:e.id,label:e.fullName})) },
    ], 'Administration.saveTeam()');
  },

  saveTeam() {
    const name = document.getElementById('tm-name').value.trim();
    if (!name) { Toast.show('Team name required', 'error'); return; }
    DB.add('teams', { id: DB.nextId('teams'), name, departmentId: parseInt(document.getElementById('tm-dept').value), leaderId: parseInt(document.getElementById('tm-lead').value), members: [] });
    Modal.close('dynamic-modal');
    Toast.show('Team added!', 'success');
    this.renderSection();
  },

  // ── Asset ──
  showAddAsset() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    this._genericForm('Add Asset', [
      { id:'as-name', label:'Asset Name', required:true, placeholder:'e.g. MacBook Pro 16"' },
      { id:'as-code', label:'Asset Code', required:true, placeholder:'e.g. AST-001' },
      { id:'as-cat', label:'Category', type:'select', options:['Laptop','Desktop','Monitor','Phone','Furniture','Vehicle','Other'] },
      { id:'as-assign', label:'Assign To', type:'select', options:[{value:'',label:'— Unassigned —'},...emps.map(e=>({value:e.id,label:e.fullName}))] },
      { id:'as-cond', label:'Condition', type:'select', options:['excellent','good','fair','poor'] },
    ], 'Administration.saveAsset()');
  },

  saveAsset() {
    const name = document.getElementById('as-name').value.trim();
    const code = document.getElementById('as-code').value.trim();
    if (!name || !code) { Toast.show('Name and code required', 'error'); return; }
    DB.add('assets', { id: DB.nextId('assets'), name, code, category: document.getElementById('as-cat').value, assignedTo: parseInt(document.getElementById('as-assign').value) || null, assignedOn: Utils.today(), condition: document.getElementById('as-cond').value, status: 'active' });
    Modal.close('dynamic-modal');
    Toast.show('Asset added!', 'success');
    this.renderSection();
  },

  // ── User ──
  showAddUser() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const roles = DB.get('roles');
    this._genericForm('Add User', [
      { id:'us-emp', label:'Employee', type:'select', required:true, options:emps.map(e=>({value:e.id,label:e.fullName})) },
      { id:'us-user', label:'Username', required:true, placeholder:'e.g. john.doe' },
      { id:'us-pass', label:'Password', required:true, type:'password', placeholder:'Enter password' },
      { id:'us-role', label:'Role', type:'select', options:roles.map(r=>({value:r.code,label:r.name})) },
    ], 'Administration.saveUser()');
  },

  saveUser() {
    const username = document.getElementById('us-user').value.trim();
    const password = document.getElementById('us-pass').value;
    if (!username || !password) { Toast.show('Username and password required', 'error'); return; }
    if (DB.get('users').find(u => u.username === username)) { Toast.show('Username already exists!', 'error'); return; }
    DB.add('users', { id: DB.nextId('users'), employeeId: parseInt(document.getElementById('us-emp').value), username, password, role: document.getElementById('us-role').value, status: 'active', lastLogin: null });
    Modal.close('dynamic-modal');
    Toast.show('User account created!', 'success');
    this.renderSection();
  },

  // ── Holiday ──
  showAddHoliday() {
    this._genericForm('Add Holiday', [
      { id:'hl-name', label:'Holiday Name', required:true, placeholder:'e.g. Eid ul Fitr' },
      { id:'hl-date', label:'Date', type:'date', required:true },
      { id:'hl-type', label:'Type', type:'select', options:[{value:'national',label:'National'},{value:'religious',label:'Religious'},{value:'company',label:'Company'}] },
      { id:'hl-opt', label:'Optional', type:'select', options:[{value:'false',label:'Mandatory'},{value:'true',label:'Optional'}] },
    ], 'Administration.saveHoliday()');
  },

  saveHoliday() {
    const name = document.getElementById('hl-name').value.trim();
    const date = document.getElementById('hl-date').value;
    if (!name || !date) { Toast.show('Name and date required', 'error'); return; }
    DB.add('holidays', { id: DB.nextId('holidays'), name, date, type: document.getElementById('hl-type').value, optional: document.getElementById('hl-opt').value === 'true' });
    Modal.close('dynamic-modal');
    Toast.show('Holiday added!', 'success');
    this.renderSection();
  },

  deleteHoliday(id) {
    const h = DB.find('holidays', id);
    Modal.confirm('Delete Holiday', `Delete <strong>${h?.name}</strong>?`, () => {
      DB.delete('holidays', id);
      Toast.show('Holiday deleted!', 'warning');
      this.renderSection();
    });
  },

  // ── Edit handlers ──
  editDesig(id) {
    const d = DB.find('designations', id);
    if (!d) return;
    const depts = DB.get('departments');
    this._genericForm(`Edit — ${d.name}`, [
      { id:'dg-ename', label:'Designation Title', required:true, value:d.name },
      { id:'dg-edept', label:'Department', type:'select', value:d.departmentId, options:depts.map(dep=>({value:dep.id,label:dep.name})) },
      { id:'dg-elevel', label:'Level', type:'select', value:d.level, options:['Entry','Junior','Mid','Senior','Lead','Manager','Director','VP','C-Level'] },
    ], `Administration.updateDesig(${id})`);
  },
  updateDesig(id) {
    DB.update('designations', id, {
      name: document.getElementById('dg-ename').value.trim(),
      departmentId: parseInt(document.getElementById('dg-edept').value),
      level: document.getElementById('dg-elevel').value
    });
    Modal.close('dynamic-modal');
    Toast.show('Designation updated!', 'success');
    this.renderSection();
  },
  deleteDesig(id) {
    const d = DB.find('designations', id);
    const empCount = DB.get('employees').filter(e => e.designationId === id && e.status === 'active').length;
    if (empCount > 0) { Toast.show(`Cannot delete — ${empCount} active employees have this designation`, 'error'); return; }
    Modal.confirm('Delete Designation', `Delete <strong>${d?.name}</strong>?`, () => {
      DB.delete('designations', id);
      Toast.show('Designation deleted!', 'warning');
      this.renderSection();
    });
  },

  editBranch(id) {
    const b = DB.find('branches', id);
    if (!b) return;
    this._genericForm(`Edit — ${b.name}`, [
      { id:'br-ename', label:'Branch Name', required:true, value:b.name },
      { id:'br-ecity', label:'City', required:true, value:b.city },
      { id:'br-eaddr', label:'Address', type:'textarea', value:b.address },
    ], `Administration.updateBranch(${id})`);
  },
  updateBranch(id) {
    DB.update('branches', id, {
      name: document.getElementById('br-ename').value.trim(),
      city: document.getElementById('br-ecity').value.trim(),
      address: document.getElementById('br-eaddr').value.trim(),
    });
    Modal.close('dynamic-modal');
    Toast.show('Branch updated!', 'success');
    this.renderSection();
  },
  deleteBranch(id) {
    const b = DB.find('branches', id);
    Modal.confirm('Delete Branch', `Delete branch <strong>${b?.name}</strong>?`, () => {
      DB.delete('branches', id);
      Toast.show('Branch deleted!', 'warning');
      this.renderSection();
    });
  },

  editShift(id) {
    const s = DB.find('shifts', id);
    if (!s) return;
    this._genericForm(`Edit — ${s.name} & Time-In Window`, [
      { id:'sh-ename', label:'Shift Name', required:true, value:s.name },
      { id:'sh-estart', label:'Work Start Time', type:'time', value:s.startTime },
      { id:'sh-eend', label:'Work End Time', type:'time', value:s.endTime },
      { id:'sh-ewstart', label:'Time-In Window Start (e.g. 10:00 AM)', type:'time', value:s.timeInWindowStart || '10:00' },
      { id:'sh-ewend', label:'Time-In Window Cutoff / End (e.g. 11:00 AM - Check-in after this is Late)', type:'time', value:s.timeInWindowEnd || '11:00' },
      { id:'sh-egrace', label:'Grace Period (minutes)', type:'number', value:s.gracePeriod, min:0, max:60 },
    ], `Administration.updateShift(${id})`);
  },
  updateShift(id) {
    DB.update('shifts', id, {
      name: document.getElementById('sh-ename').value.trim(),
      startTime: document.getElementById('sh-estart').value,
      endTime: document.getElementById('sh-eend').value,
      timeInWindowStart: document.getElementById('sh-ewstart')?.value || '10:00',
      timeInWindowEnd: document.getElementById('sh-ewend')?.value || '11:00',
      gracePeriod: parseInt(document.getElementById('sh-egrace').value) || 15,
    });
    Modal.close('dynamic-modal');
    Toast.show('Shift and Time-In window updated!', 'success');
    this.renderSection();
  },
  deleteShift(id) {
    const s = DB.find('shifts', id);
    Modal.confirm('Delete Shift', `Delete shift <strong>${s?.name}</strong>?`, () => {
      DB.delete('shifts', id);
      Toast.show('Shift deleted!', 'warning');
      this.renderSection();
    });
  },

  editBank(id) {
    const b = DB.find('banks', id);
    if (!b) return;
    this._genericForm(`Edit — ${b.name}`, [
      { id:'bk-ename', label:'Bank Name', required:true, value:b.name },
      { id:'bk-ecode', label:'Code', required:true, value:b.code, maxlength:10 },
      { id:'bk-eswift', label:'SWIFT Code', value:b.swiftCode },
    ], `Administration.updateBank(${id})`);
  },
  updateBank(id) {
    DB.update('banks', id, {
      name: document.getElementById('bk-ename').value.trim(),
      code: document.getElementById('bk-ecode').value.trim().toUpperCase(),
      swiftCode: document.getElementById('bk-eswift').value.trim(),
    });
    Modal.close('dynamic-modal');
    Toast.show('Bank updated!', 'success');
    this.renderSection();
  },
  deleteBank(id) {
    const b = DB.find('banks', id);
    Modal.confirm('Delete Bank', `Delete <strong>${b?.name}</strong>?`, () => {
      DB.delete('banks', id);
      Toast.show('Bank deleted!', 'warning');
      this.renderSection();
    });
  },

  editGrade(id) {
    const g = DB.find('salary_grades', id);
    if (!g) return;
    this._genericForm(`Edit — Grade ${g.grade}`, [
      { id:'sg-egrade', label:'Grade Code', required:true, value:g.grade },
      { id:'sg-edesc', label:'Description', value:g.description },
      { id:'sg-emin', label:'Min Salary (PKR)', type:'number', value:g.minSalary, min:0 },
      { id:'sg-emax', label:'Max Salary (PKR)', type:'number', value:g.maxSalary, min:0 },
    ], `Administration.updateGrade(${id})`);
  },
  updateGrade(id) {
    DB.update('salary_grades', id, {
      grade: document.getElementById('sg-egrade').value.trim(),
      description: document.getElementById('sg-edesc').value.trim(),
      minSalary: parseInt(document.getElementById('sg-emin').value) || 0,
      maxSalary: parseInt(document.getElementById('sg-emax').value) || 0,
    });
    Modal.close('dynamic-modal');
    Toast.show('Salary grade updated!', 'success');
    this.renderSection();
  },
  deleteGrade(id) {
    const g = DB.find('salary_grades', id);
    Modal.confirm('Delete Grade', `Delete grade <strong>${g?.grade}</strong>?`, () => {
      DB.delete('salary_grades', id);
      Toast.show('Grade deleted!', 'warning');
      this.renderSection();
    });
  },

  editSkill(id) {
    const s = DB.find('skills', id);
    if (!s) return;
    this._genericForm(`Edit — ${s.name}`, [
      { id:'sk-ename', label:'Skill Name', required:true, value:s.name },
      { id:'sk-ecat', label:'Category', type:'select', value:s.category, options:['Technical','Management','Soft Skill','Language','Design','DevOps'] },
    ], `Administration.updateSkill(${id})`);
  },
  updateSkill(id) {
    DB.update('skills', id, {
      name: document.getElementById('sk-ename').value.trim(),
      category: document.getElementById('sk-ecat').value,
    });
    Modal.close('dynamic-modal');
    Toast.show('Skill updated!', 'success');
    this.renderSection();
  },
  deleteSkill(id) {
    const s = DB.find('skills', id);
    Modal.confirm('Delete Skill', `Delete skill <strong>${s?.name}</strong>?`, () => {
      DB.delete('skills', id);
      Toast.show('Skill deleted!', 'warning');
      this.renderSection();
    });
  },

  editProject(id) {
    const p = DB.find('projects', id);
    if (!p) return;
    const depts = DB.get('departments');
    const emps = DB.get('employees').filter(e => e.status === 'active');
    this._genericForm(`Edit — ${p.name}`, [
      { id:'pj-ename', label:'Project Name', required:true, value:p.name },
      { id:'pj-edept', label:'Department', type:'select', value:p.departmentId, options:depts.map(d=>({value:d.id,label:d.name})) },
      { id:'pj-emgr', label:'Project Manager', type:'select', value:p.managerId, options:emps.map(e=>({value:e.id,label:e.fullName})) },
      { id:'pj-estart', label:'Start Date', type:'date', value:p.startDate },
      { id:'pj-eend', label:'End Date', type:'date', value:p.endDate },
      { id:'pj-estatus', label:'Status', type:'select', value:p.status, options:['active','upcoming','completed','cancelled'] },
    ], `Administration.updateProject(${id})`);
  },
  updateProject(id) {
    DB.update('projects', id, {
      name: document.getElementById('pj-ename').value.trim(),
      departmentId: parseInt(document.getElementById('pj-edept').value),
      managerId: parseInt(document.getElementById('pj-emgr').value),
      startDate: document.getElementById('pj-estart').value,
      endDate: document.getElementById('pj-eend').value,
      status: document.getElementById('pj-estatus').value,
    });
    Modal.close('dynamic-modal');
    Toast.show('Project updated!', 'success');
    this.renderSection();
  },
  deleteProject(id) {
    const p = DB.find('projects', id);
    Modal.confirm('Delete Project', `Delete project <strong>${p?.name}</strong>?`, () => {
      DB.delete('projects', id);
      Toast.show('Project deleted!', 'warning');
      this.renderSection();
    });
  },

  editTeam(id) {
    const t = DB.find('teams', id);
    if (!t) return;
    const depts = DB.get('departments');
    const emps = DB.get('employees').filter(e => e.status === 'active');
    this._genericForm(`Edit — ${t.name}`, [
      { id:'tm-ename', label:'Team Name', required:true, value:t.name },
      { id:'tm-edept', label:'Department', type:'select', value:t.departmentId, options:depts.map(d=>({value:d.id,label:d.name})) },
      { id:'tm-elead', label:'Team Lead', type:'select', value:t.leaderId, options:emps.map(e=>({value:e.id,label:e.fullName})) },
    ], `Administration.updateTeam(${id})`);
  },
  updateTeam(id) {
    DB.update('teams', id, {
      name: document.getElementById('tm-ename').value.trim(),
      departmentId: parseInt(document.getElementById('tm-edept').value),
      leaderId: parseInt(document.getElementById('tm-elead').value),
    });
    Modal.close('dynamic-modal');
    Toast.show('Team updated!', 'success');
    this.renderSection();
  },
  deleteTeam(id) {
    const t = DB.find('teams', id);
    Modal.confirm('Delete Team', `Delete team <strong>${t?.name}</strong>?`, () => {
      DB.delete('teams', id);
      Toast.show('Team deleted!', 'warning');
      this.renderSection();
    });
  },

  editAsset(id) {
    const a = DB.find('assets', id);
    if (!a) return;
    const emps = DB.get('employees').filter(e => e.status === 'active');
    this._genericForm(`Edit — ${a.name}`, [
      { id:'as-ename', label:'Asset Name', required:true, value:a.name },
      { id:'as-ecode', label:'Asset Code', required:true, value:a.code },
      { id:'as-ecat', label:'Category', type:'select', value:a.category, options:['Laptop','Desktop','Monitor','Phone','Furniture','Vehicle','Other'] },
      { id:'as-eassign', label:'Assign To', type:'select', value:a.assignedTo||'', options:[{value:'',label:'— Unassigned —'},...emps.map(e=>({value:e.id,label:e.fullName}))] },
      { id:'as-econd', label:'Condition', type:'select', value:a.condition, options:['excellent','good','fair','poor'] },
    ], `Administration.updateAsset(${id})`);
  },
  updateAsset(id) {
    DB.update('assets', id, {
      name: document.getElementById('as-ename').value.trim(),
      code: document.getElementById('as-ecode').value.trim(),
      category: document.getElementById('as-ecat').value,
      assignedTo: parseInt(document.getElementById('as-eassign').value) || null,
      condition: document.getElementById('as-econd').value,
    });
    Modal.close('dynamic-modal');
    Toast.show('Asset updated!', 'success');
    this.renderSection();
  },
  deleteAsset(id) {
    const a = DB.find('assets', id);
    Modal.confirm('Delete Asset', `Delete asset <strong>${a?.name}</strong>?`, () => {
      DB.delete('assets', id);
      Toast.show('Asset deleted!', 'warning');
      this.renderSection();
    });
  },

  showAddUser() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const roles = DB.get('roles') || [];
    this._genericForm('Add System User', [
      { id:'us-emp', label:'Employee', type:'select', required:true, options:emps.map(e=>({value:e.id,label:`${e.fullName} (${e.empNo})`})) },
      { id:'us-user', label:'Username', required:true, placeholder:'e.g. fatima.raza' },
      { id:'us-pass', label:'Password', type:'password', required:true, placeholder:'Enter secure password' },
      { id:'us-role', label:'Assigned Role', type:'select', value:'employee', options:roles.map(r=>({value:r.code,label:r.name})) },
    ], 'Administration.saveUser()');
  },
  saveUser() {
    const empId = parseInt(document.getElementById('us-emp').value);
    const username = document.getElementById('us-user').value.trim();
    const password = document.getElementById('us-pass').value;
    const role = document.getElementById('us-role').value;
    if (!empId || !username || !password) {
      Toast.show('All fields are required', 'error');
      return;
    }
    const existing = DB.get('users').find(u => u.username === username);
    if (existing) {
      Toast.show('Username already taken', 'error');
      return;
    }
    DB.add('users', {
      id: DB.nextId('users'),
      employeeId: empId,
      username,
      password,
      role,
      status: 'active',
      lastLogin: null,
    });
    DB.update('employees', empId, { role });
    Modal.close('dynamic-modal');
    Toast.show('User account created and role assigned!', 'success');
    this.renderSection();
  },

  editUser(id) {
    const u = DB.find('users', id);
    if (!u) return;
    const roles = DB.get('roles');
    this._genericForm(`Edit User — ${u.username}`, [
      { id:'us-euser', label:'Username', required:true, value:u.username },
      { id:'us-epass', label:'New Password (leave blank to keep)', type:'password', value:'' },
      { id:'us-erole', label:'Role', type:'select', value:u.role, options:roles.map(r=>({value:r.code,label:r.name})) },
    ], `Administration.updateUser(${id})`);
  },
  updateUser(id) {
    const user = DB.find('users', id);
    const newRole = document.getElementById('us-erole').value;
    const updates = {
      username: document.getElementById('us-euser').value.trim(),
      role: newRole,
    };
    const newPass = document.getElementById('us-epass').value;
    if (newPass) updates.password = newPass;
    DB.update('users', id, updates);

    // Sync role with employee record
    if (user && user.employeeId) {
      DB.update('employees', user.employeeId, { role: newRole });
    }
    if (Auth.user && Auth.user.id === id) {
      Auth._user.role = newRole;
      sessionStorage.setItem('hrm_session', JSON.stringify({ user: Auth._user, employee: Auth._employee }));
    }

    DB.log('UPDATE', 'Administration', `User ${updates.username} role changed to ${newRole}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('User and role updated successfully!', 'success');
    this.renderSection();
  },
  toggleUserStatus(id) {
    const u = DB.find('users', id);
    if (!u) return;
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    Modal.confirm(`${newStatus === 'inactive' ? 'Disable' : 'Enable'} User`, `Are you sure you want to ${newStatus === 'inactive' ? 'disable' : 'enable'} <strong>${u.username}</strong>?`, () => {
      DB.update('users', id, { status: newStatus });
      DB.log('UPDATE', 'Administration', `User ${u.username} ${newStatus}`, Auth.user?.id);
      Toast.show(`User ${newStatus}!`, newStatus === 'inactive' ? 'warning' : 'success');
      this.renderSection();
    });
  },

  editHoliday(id) {
    const h = DB.find('holidays', id);
    if (!h) return;
    this._genericForm(`Edit — ${h.name}`, [
      { id:'hl-ename', label:'Holiday Name', required:true, value:h.name },
      { id:'hl-edate', label:'Date', type:'date', required:true, value:h.date },
      { id:'hl-etype', label:'Type', type:'select', value:h.type, options:[{value:'national',label:'National'},{value:'religious',label:'Religious'},{value:'company',label:'Company'}] },
      { id:'hl-eopt', label:'Optional', type:'select', value:String(h.optional), options:[{value:'false',label:'Mandatory'},{value:'true',label:'Optional'}] },
    ], `Administration.updateHoliday(${id})`);
  },
  updateHoliday(id) {
    DB.update('holidays', id, {
      name: document.getElementById('hl-ename').value.trim(),
      date: document.getElementById('hl-edate').value,
      type: document.getElementById('hl-etype').value,
      optional: document.getElementById('hl-eopt').value === 'true',
    });
    Modal.close('dynamic-modal');
    Toast.show('Holiday updated!', 'success');
    this.renderSection();
  },

  // ════════════════════════════════════════════════════════════
  // ATTENDANCE & LEAVE AUDIT AND PROBLEM RESOLUTION CENTER
  // ════════════════════════════════════════════════════════════

  getAttendanceLeaveProblems(targetMonth) {
    const month = targetMonth || this.auditMonth || (typeof Utils !== 'undefined' ? Utils.thisMonth() : new Date().toISOString().slice(0,7));
    const att = DB.get('attendance') || [];
    const leaves = DB.get('leave_requests') || [];
    const emps = DB.get('employees') || [];
    const shifts = DB.get('shifts') || [];
    const resolutions = DB.get('audit_resolutions') || [];

    const problems = [];
    const findRes = (k) => resolutions.find(r => r.problemKey === k);

    // 1. UNAPPROVED LEAVE REQUESTS
    leaves.forEach(leave => {
      const touches = (leave.from && leave.from.slice(0,7) === month) || (leave.to && leave.to.slice(0,7) === month);
      if (!touches) return;

      const emp = emps.find(e => e.id === leave.employeeId);
      const key = `leave_${leave.id}`;
      const res = findRes(key);

      if (leave.status === 'pending' || leave.status === 'manager_approved') {
        const estDaily = Math.round((emp?.salary || 50000) / 30);
        const estDeduction = estDaily * leave.days;
        problems.push({
          id: key,
          category: 'unapproved_leave',
          categoryLabel: 'Unapproved Leave Request',
          severity: 'danger',
          icon: 'fa-calendar-xmark',
          badgeColor: '#f59e0b',
          employeeId: leave.employeeId,
          empName: emp ? emp.fullName : `Employee #${leave.employeeId}`,
          empNo: emp ? emp.empNo : '—',
          deptName: emp ? Utils.getDeptName(emp.departmentId) : '—',
          dateOrPeriod: `${Utils.formatDate(leave.from)} to ${Utils.formatDate(leave.to)} (${leave.days}d)`,
          details: `Leave request for ${leave.days} day(s) is pending ${leave.status === 'pending' ? 'Manager & HR' : 'HR'} approval. Reason: "${leave.reason || 'Personal'}".`,
          financialImpact: leave.salaryDeduction ? `Loss of Pay: PKR ${estDeduction.toLocaleString()}` : `Paid Leave Quota (${leave.days}d)`,
          isResolved: res ? true : false,
          resolution: res || null,
          rawType: 'leave',
          rawRecord: leave,
          canDeductSalary: true,
          canApprove: true,
        });
      } else if (leave.status === 'rejected') {
        // Check if employee missed work during rejected leave period
        const daysInLeave = [];
        let curr = new Date(leave.from);
        const endD = new Date(leave.to);
        while (curr <= endD) {
          daysInLeave.push(curr.toISOString().split('T')[0]);
          curr.setDate(curr.getDate() + 1);
        }
        const missedWork = att.filter(a => a.employeeId === leave.employeeId && daysInLeave.includes(a.date) && (a.status === 'absent' || !a.timeIn));
        if (missedWork.length > 0) {
          const rejKey = `leave_rejected_missed_${leave.id}`;
          const rejRes = findRes(rejKey);
          const estDed = Math.round((emp?.salary || 50000) / 30 * missedWork.length);
          problems.push({
            id: rejKey,
            category: 'rejected_leave_absence',
            categoryLabel: 'Rejected Leave (Missed Work)',
            severity: 'danger',
            icon: 'fa-user-slash',
            badgeColor: '#ef4444',
            employeeId: leave.employeeId,
            empName: emp ? emp.fullName : `Employee #${leave.employeeId}`,
            empNo: emp ? emp.empNo : '—',
            deptName: emp ? Utils.getDeptName(emp.departmentId) : '—',
            dateOrPeriod: `${Utils.formatDate(leave.from)} to ${Utils.formatDate(leave.to)}`,
            details: `Leave was rejected by management, but employee did not attend work on ${missedWork.length} day(s). Requires salary deduction or official regularization.`,
            financialImpact: `Loss of Pay: PKR ${estDed.toLocaleString()} (${missedWork.length}d)`,
            isResolved: rejRes ? true : false,
            resolution: rejRes || null,
            rawType: 'leave_rejected',
            rawRecord: leave,
            missedCount: missedWork.length,
            canDeductSalary: true,
            canRegularize: true,
          });
        }
      } else if (leave.salaryDeduction && leave.status === 'approved') {
        // Voluntary salary deduction leave - audit transparency
        const dedKey = `leave_salary_ded_${leave.id}`;
        const dedRes = findRes(dedKey);
        const dedAmount = leave.deductionAmount || Math.round((emp?.salary || 50000) / 30 * leave.days);
        problems.push({
          id: dedKey,
          category: 'salary_deduction_leave',
          categoryLabel: 'Leave Salary Deduction (Approved)',
          severity: 'info',
          icon: 'fa-money-bill-wave',
          badgeColor: '#3b82f6',
          employeeId: leave.employeeId,
          empName: emp ? emp.fullName : `Employee #${leave.employeeId}`,
          empNo: emp ? emp.empNo : '—',
          deptName: emp ? Utils.getDeptName(emp.departmentId) : '—',
          dateOrPeriod: `${Utils.formatDate(leave.from)} to ${Utils.formatDate(leave.to)} (${leave.days}d)`,
          details: `Voluntary Loss of Pay leave requested by employee. Scheduled for PKR ${dedAmount.toLocaleString()} deduction in payroll.`,
          financialImpact: `Deduction: PKR ${dedAmount.toLocaleString()}`,
          isResolved: true, // already approved & recorded
          resolution: dedRes || { action: 'Approved Salary Deduction', note: 'Automatic deduction in payroll', resolvedBy: 'System', resolvedAt: leave.approvedOn || leave.appliedOn },
          rawType: 'leave_salary_ded',
          rawRecord: leave,
        });
      }
    });

    // 2. ATTENDANCE DISCREPANCIES (Absences, Late arrivals past cutoff, Missing check-outs)
    const monthAtt = att.filter(a => a.date && a.date.slice(0,7) === month);
    monthAtt.forEach(rec => {
      const key = `att_${rec.id}`;
      const res = findRes(key);
      const emp = emps.find(e => e.id === rec.employeeId);
      const shift = shifts.find(s => s.id === (emp?.shiftId || 1)) || shifts[0];
      const windowEnd = shift?.timeInWindowEnd || '11:00';

      // (a) UNEXPLAINED / UNMARKED ABSENCES
      if (rec.status === 'absent') {
        const hasApprovedLeave = leaves.some(l => l.employeeId === rec.employeeId && l.status === 'approved' && l.from <= rec.date && l.to >= rec.date);
        if (!hasApprovedLeave) {
          const daily = Math.round((emp?.salary || 50000) / 30);
          problems.push({
            id: key,
            category: 'unexplained_absence',
            categoryLabel: 'Unexplained Absence (No Leave)',
            severity: 'danger',
            icon: 'fa-circle-xmark',
            badgeColor: '#ef4444',
            employeeId: rec.employeeId,
            empName: emp ? emp.fullName : `Employee #${rec.employeeId}`,
            empNo: emp ? emp.empNo : '—',
            deptName: emp ? Utils.getDeptName(emp.departmentId) : '—',
            dateOrPeriod: Utils.formatDate(rec.date),
            details: `Employee marked absent on ${Utils.formatDate(rec.date)} without an approved leave. Requires salary deduction or attendance regularization.`,
            financialImpact: `Loss of Pay: PKR ${daily.toLocaleString()} (1 Day)`,
            isResolved: res ? true : false,
            resolution: res || null,
            rawType: 'attendance_absence',
            rawRecord: rec,
            canDeductSalary: true,
            canRegularize: true,
          });
        }
      }

      // (b) LATE ARRIVALS BEYOND TIME-IN WINDOW CUTOFF (e.g. after 11:00 AM)
      if (rec.timeIn && rec.status !== 'absent') {
        const isPastCutoff = rec.timeIn > windowEnd;
        if (isPastCutoff || rec.status === 'late') {
          const lateKey = `att_late_${rec.id}`;
          const lateRes = findRes(lateKey);
          const [inH, inM] = rec.timeIn.split(':').map(Number);
          const [winH, winM] = windowEnd.split(':').map(Number);
          const lateMins = Math.max(1, (inH * 60 + inM) - (winH * 60 + winM));
          const latePenalty = lateMins >= 60 ? Math.round((emp?.salary || 50000) / 60) : 0; // half day deduction if >= 60m late

          problems.push({
            id: lateKey,
            category: 'late_arrival',
            categoryLabel: 'Late Arrival (Past Cutoff)',
            severity: 'warning',
            icon: 'fa-clock',
            badgeColor: '#f59e0b',
            employeeId: rec.employeeId,
            empName: emp ? emp.fullName : `Employee #${rec.employeeId}`,
            empNo: emp ? emp.empNo : '—',
            deptName: emp ? Utils.getDeptName(emp.departmentId) : '—',
            dateOrPeriod: `${Utils.formatDate(rec.date)} at ${rec.timeIn}`,
            details: `Checked in at ${rec.timeIn} (Window cutoff: ${windowEnd}). ${lateMins} minutes late. Needs penalty deduction or HR late waiver.`,
            financialImpact: latePenalty > 0 ? `Late Penalty: PKR ${latePenalty.toLocaleString()}` : 'Late Warning Recorded',
            isResolved: lateRes ? true : false,
            resolution: lateRes || null,
            rawType: 'attendance_late',
            rawRecord: rec,
            lateMinutes: lateMins,
            latePenalty,
            canWaiveLate: true,
            canDeductSalary: latePenalty > 0,
            canRegularize: true,
          });
        }
      }

      // (c) MISSING CHECK-OUT PUNCHES
      const todayStr = (typeof Utils !== 'undefined' ? Utils.today() : new Date().toISOString().split('T')[0]);
      if (rec.timeIn && (!rec.timeOut || rec.timeOut === '' || rec.timeOut === '--:--') && rec.status !== 'absent' && rec.date < todayStr) {
        const missKey = `att_missing_out_${rec.id}`;
        const missRes = findRes(missKey);
        problems.push({
          id: missKey,
          category: 'missing_punch',
          categoryLabel: 'Missing Check-Out Punch',
          severity: 'warning',
          icon: 'fa-right-from-bracket',
          badgeColor: '#8b5cf6',
          employeeId: rec.employeeId,
          empName: emp ? emp.fullName : `Employee #${rec.employeeId}`,
          empNo: emp ? emp.empNo : '—',
          deptName: emp ? Utils.getDeptName(emp.departmentId) : '—',
          dateOrPeriod: Utils.formatDate(rec.date),
          details: `Employee punched in at ${rec.timeIn} on ${Utils.formatDate(rec.date)} but has no check-out record. Work hours unverified.`,
          financialImpact: 'Incomplete Audit Record',
          isResolved: missRes ? true : false,
          resolution: missRes || null,
          rawType: 'attendance_missing_out',
          rawRecord: rec,
          canCompletePunch: true,
          canRegularize: true,
        });
      }
    });

    return problems;
  },

  renderDiscrepancies(container) {
    const month = this.auditMonth || Utils.thisMonth();
    const allProblems = this.getAttendanceLeaveProblems(month);
    const allMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

    // Filter problems
    let filtered = allProblems;
    if (this.auditStatusFilter === 'unresolved') {
      filtered = filtered.filter(p => !p.isResolved);
    } else if (this.auditStatusFilter === 'resolved') {
      filtered = filtered.filter(p => p.isResolved);
    }

    if (this.auditCategoryFilter && this.auditCategoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === this.auditCategoryFilter);
    }

    if (this.auditSearch && this.auditSearch.trim()) {
      const q = this.auditSearch.trim().toLowerCase();
      filtered = filtered.filter(p => 
        p.empName.toLowerCase().includes(q) ||
        p.empNo.toLowerCase().includes(q) ||
        p.deptName.toLowerCase().includes(q) ||
        p.details.toLowerCase().includes(q)
      );
    }

    const totalCount = allProblems.length;
    const unresolvedCount = allProblems.filter(p => !p.isResolved).length;
    const resolvedCount = allProblems.filter(p => p.isResolved).length;
    const unapprovedLeaves = allProblems.filter(p => p.category === 'unapproved_leave' && !p.isResolved).length;
    const lateArrivals = allProblems.filter(p => p.category === 'late_arrival' && !p.isResolved).length;
    const absences = allProblems.filter(p => p.category === 'unexplained_absence' && !p.isResolved).length;
    const missingPunches = allProblems.filter(p => p.category === 'missing_punch' && !p.isResolved).length;

    const monthLabel = new Date(month + '-01').toLocaleDateString('en', { month: 'long', year: 'numeric' });

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Header & Month Selector -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <h2 style="margin:0;font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px">
              <i class="fa fa-triangle-exclamation" style="color:var(--warning)"></i>
              Attendance & Leave Audit Resolution Center
            </h2>
            <p style="margin:4px 0 0;font-size:12.5px;color:var(--text-3)">
              Comprehensive audit of all attendance anomalies, late arrivals beyond cutoff, unapproved leaves, and payroll salary deduction governance.
            </p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <select class="form-control" style="width:180px;font-weight:600" onchange="Administration.auditMonth=this.value;Administration.renderSection()">
              ${allMonths.map(m => `<option value="${m}" ${m === month ? 'selected' : ''}>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>`).join('')}
            </select>
            <button class="btn btn-ghost btn-sm" onclick="Administration.exportDiscrepanciesCSV()"><i class="fa fa-file-export"></i> Export CSV</button>
            ${unresolvedCount > 0 ? `
              <button class="btn btn-secondary btn-sm" onclick="Administration.autoResolveAll()"><i class="fa fa-wand-magic-sparkles"></i> Auto-Regularize Safe</button>
            ` : ''}
          </div>
        </div>

        <!-- Payroll Governance Status Banner -->
        ${unresolvedCount > 0 ? `
          <div style="background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(245,158,11,0.08));border:1.5px solid rgba(239,68,68,0.35);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:44px;height:44px;border-radius:12px;background:#ef444422;display:flex;align-items:center;justify-content:center;color:var(--danger);font-size:20px;flex-shrink:0">
                <i class="fa fa-lock"></i>
              </div>
              <div>
                <div style="font-weight:800;color:var(--danger);font-size:14.5px;display:flex;align-items:center;gap:8px">
                  <span>PAYROLL FINALIZATION LOCKED FOR ${monthLabel.toUpperCase()}</span>
                  <span class="badge badge-danger" style="font-size:11px">${unresolvedCount} UNRESOLVED ISSUES</span>
                </div>
                <div style="font-size:12.5px;color:var(--text-2);margin-top:3px">
                  Payroll cannot be generated until all attendance anomalies, unexplained absences, and unapproved leaves for this month are resolved or converted to salary deductions.
                </div>
              </div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="Administration.auditStatusFilter='unresolved';Administration.renderSection()" style="flex-shrink:0">
              <i class="fa fa-filter"></i> View ${unresolvedCount} Blocking Issues
            </button>
          </div>
        ` : `
          <div style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(99,102,241,0.08));border:1.5px solid rgba(16,185,129,0.35);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:44px;height:44px;border-radius:12px;background:#10b98122;display:flex;align-items:center;justify-content:center;color:var(--success);font-size:20px;flex-shrink:0">
                <i class="fa fa-circle-check"></i>
              </div>
              <div>
                <div style="font-weight:800;color:var(--success);font-size:14.5px">
                  AUDIT CLEAN — PAYROLL UNLOCKED FOR ${monthLabel.toUpperCase()}
                </div>
                <div style="font-size:12.5px;color:var(--text-2);margin-top:3px">
                  All attendance & leave discrepancies for this month have been fully resolved and verified. You may proceed to generate salary slips with automatic leave deductions applied.
                </div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('payroll')" style="flex-shrink:0">
              <i class="fa fa-arrow-right"></i> Open Payroll Processing
            </button>
          </div>
        `}

        <!-- Metrics Grid -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
          ${[
            { label:'Total Discrepancies', val: totalCount, sub: `${resolvedCount} resolved`, icon:'fa-triangle-exclamation', color:'#6366f1' },
            { label:'Unapproved Leaves', val: unapprovedLeaves, sub:'Pending HR/Manager', icon:'fa-calendar-xmark', color:'#f59e0b' },
            { label:'Late Arrivals (>11:00 AM)', val: lateArrivals, sub:'Past window cutoff', icon:'fa-clock', color:'#ef4444' },
            { label:'Unexplained Absences', val: absences, sub:'Missed work without leave', icon:'fa-circle-xmark', color:'#dc2626' },
            { label:'Missing Punches', val: missingPunches, sub:'No checkout logged', icon:'fa-right-from-bracket', color:'#8b5cf6' },
          ].map(m => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-left:4px solid ${m.color}">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span style="font-size:12px;color:var(--text-3);font-weight:600">${m.label}</span>
                <i class="fa ${m.icon}" style="color:${m.color};font-size:16px"></i>
              </div>
              <div style="font-size:24px;font-weight:800;color:${m.color}">${m.val}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${m.sub}</div>
            </div>
          `).join('')}
        </div>

        <!-- Filter and Search Bar -->
        <div class="card" style="padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:700;color:var(--text-3)">Filter By:</span>
            <div style="display:flex;gap:4px;background:var(--surface);padding:3px;border-radius:8px">
              <button class="tab-toggle-btn ${this.auditStatusFilter==='all'?'active':''}" onclick="Administration.auditStatusFilter='all';Administration.renderSection()">All (${totalCount})</button>
              <button class="tab-toggle-btn ${this.auditStatusFilter==='unresolved'?'active':''}" onclick="Administration.auditStatusFilter='unresolved';Administration.renderSection()">Unresolved (${unresolvedCount})</button>
              <button class="tab-toggle-btn ${this.auditStatusFilter==='resolved'?'active':''}" onclick="Administration.auditStatusFilter='resolved';Administration.renderSection()">Resolved (${resolvedCount})</button>
            </div>
            <select class="form-control" style="width:210px;font-size:12.5px" onchange="Administration.auditCategoryFilter=this.value;Administration.renderSection()">
              <option value="all" ${this.auditCategoryFilter==='all'?'selected':''}>All Discrepancy Categories</option>
              <option value="unapproved_leave" ${this.auditCategoryFilter==='unapproved_leave'?'selected':''}>Unapproved Leaves</option>
              <option value="late_arrival" ${this.auditCategoryFilter==='late_arrival'?'selected':''}>Late Arrivals (>11:00 AM)</option>
              <option value="unexplained_absence" ${this.auditCategoryFilter==='unexplained_absence'?'selected':''}>Unexplained Absences</option>
              <option value="missing_punch" ${this.auditCategoryFilter==='missing_punch'?'selected':''}>Missing Check-Outs</option>
              <option value="salary_deduction_leave" ${this.auditCategoryFilter==='salary_deduction_leave'?'selected':''}>Salary Deductions</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="search-box" style="width:230px">
              <i class="fa fa-search"></i>
              <input type="text" class="form-control" placeholder="Search employee / ID..." value="${this.auditSearch||''}" oninput="Administration.auditSearch=this.value;Administration.renderSection()">
            </div>
          </div>
        </div>

        <!-- Discrepancy Table -->
        <div class="card" style="padding:0">
          <div class="table-wrapper" style="border:none;border-radius:0">
            <table>
              <thead><tr>
                <th>Employee</th>
                <th>Issue Category</th>
                <th>Date / Period</th>
                <th>Discrepancy Details</th>
                <th>Financial / Quota Impact</th>
                <th>Audit Status</th>
                <th>Resolution Actions</th>
              </tr></thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="7">
                      <div class="empty-state" style="padding:40px">
                        <i class="fa fa-circle-check" style="font-size:36px;color:var(--success)"></i>
                        <h3 style="margin-top:10px">No Discrepancies Found</h3>
                        <p style="font-size:12.5px;color:var(--text-3)">No attendance or leave discrepancies match your selected filters for ${monthLabel}.</p>
                      </div>
                    </td>
                  </tr>
                ` : filtered.map(prob => `
                  <tr style="${!prob.isResolved ? 'background:rgba(239,68,68,0.02)' : ''}">
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(prob.employeeId)}">${Utils.avatarInitials(prob.empName)}</div>
                        <div>
                          <div style="font-weight:700;font-size:13px">${prob.empName}</div>
                          <div style="font-size:11px;color:var(--text-3)">${prob.empNo} • ${prob.deptName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge" style="background:${prob.badgeColor}22;color:${prob.badgeColor};font-weight:700;font-size:11.5px;display:inline-flex;align-items:center;gap:5px">
                        <i class="fa ${prob.icon}"></i> ${prob.categoryLabel}
                      </span>
                    </td>
                    <td style="font-size:12.5px;font-weight:600;white-space:nowrap">${prob.dateOrPeriod}</td>
                    <td style="font-size:12px;max-width:280px;line-height:1.4">${prob.details}</td>
                    <td>
                      <span style="font-weight:700;font-size:12px;color:${prob.financialImpact.includes('Loss') || prob.financialImpact.includes('Deduction') ? 'var(--danger)' : 'var(--text-2)'}">
                        ${prob.financialImpact}
                      </span>
                    </td>
                    <td>
                      ${prob.isResolved ? `
                        <span class="badge badge-success" style="font-size:11px;display:inline-flex;align-items:center;gap:4px">
                          <i class="fa fa-check"></i> Resolved
                        </span>
                        <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">${prob.resolution?.action || 'Handled'}</div>
                      ` : `
                        <span class="badge badge-danger" style="font-size:11px;display:inline-flex;align-items:center;gap:4px">
                          <i class="fa fa-triangle-exclamation"></i> Unresolved (Blocking)
                        </span>
                      `}
                    </td>
                    <td>
                      ${prob.isResolved ? `
                        <button class="btn btn-ghost btn-sm" onclick="Administration.undoResolution('${prob.id}')" title="Re-open discrepancy">
                          <i class="fa fa-rotate-left"></i> Re-open
                        </button>
                      ` : `
                        <div style="display:flex;gap:4px;flex-wrap:wrap">
                          ${prob.canDeductSalary ? `
                            <button class="btn btn-danger btn-sm" onclick="Administration.promptDeductSalary('${prob.id}')" title="Deduct from Salary (Loss of Pay)">
                              <i class="fa fa-money-bill-wave"></i> Deduct Salary
                            </button>
                          ` : ''}
                          ${prob.canApprove ? `
                            <button class="btn btn-success btn-sm" onclick="Administration.promptApproveLeave('${prob.id}')" title="Approve Leave (Paid Quota)">
                              <i class="fa fa-check"></i> Approve
                            </button>
                          ` : ''}
                          ${prob.canRegularize ? `
                            <button class="btn btn-primary btn-sm" onclick="Administration.promptRegularize('${prob.id}')" title="Regularize Attendance (Present)">
                              <i class="fa fa-user-check"></i> Regularize
                            </button>
                          ` : ''}
                          ${prob.canWaiveLate ? `
                            <button class="btn btn-secondary btn-sm" onclick="Administration.promptWaiveLate('${prob.id}')" title="Waive Late Penalty with HR remark">
                              <i class="fa fa-handshake"></i> Waive Late
                            </button>
                          ` : ''}
                          ${prob.canCompletePunch ? `
                            <button class="btn btn-secondary btn-sm" onclick="Administration.promptCompletePunch('${prob.id}')" title="Add Missing Check-out">
                              <i class="fa fa-clock"></i> Set Punch Out
                            </button>
                          ` : ''}
                        </div>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // ── Resolution Handlers ──

  promptDeductSalary(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob) return;

    const emp = DB.find('employees', prob.employeeId);
    const dailyWage = Math.round((emp?.salary || 50000) / 30);
    const defaultDays = prob.rawType === 'leave' ? (prob.rawRecord?.days || 1) : 1;
    const defaultAmount = dailyWage * defaultDays;

    Modal.show(`Deduct from Salary (Loss of Pay) — ${prob.empName}`, `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:12px 16px">
          <div style="font-weight:700;color:var(--danger);font-size:13.5px">Confirm Leave Salary Deduction (Unpaid LOP)</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:3px">${prob.details}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--surface);padding:12px;border-radius:9px;border:1px solid var(--border)">
          <div>
            <div style="font-size:11px;color:var(--text-3)">Monthly Base Salary</div>
            <div style="font-weight:700;font-size:14px">PKR ${(emp?.salary || 50000).toLocaleString()}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-3)">Calculated Daily Rate (Base / 30)</div>
            <div style="font-weight:700;font-size:14px;color:var(--primary)">PKR ${dailyWage.toLocaleString()} / day</div>
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Deduction Days</label>
            <input type="number" class="form-control" id="audit-ded-days" value="${defaultDays}" min="0.5" step="0.5" oninput="document.getElementById('audit-ded-amount').value = Math.round(${dailyWage} * parseFloat(this.value || 0))">
          </div>
          <div class="form-group">
            <label class="form-label required">Deduction Amount (PKR)</label>
            <input type="number" class="form-control" id="audit-ded-amount" value="${defaultAmount}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Audit / Payroll Remarks</label>
          <textarea class="form-control" id="audit-ded-remarks" rows="2" placeholder="e.g. Approved deduction for unapproved absence / employee requested LOP"></textarea>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-danger" onclick="Administration.executeDeductSalary('${problemKey}')"><i class="fa fa-money-bill-wave"></i> Confirm Salary Deduction</button>
      `
    });
  },

  executeDeductSalary(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob) return;

    const days = parseFloat(document.getElementById('audit-ded-days')?.value) || 1;
    const amount = parseFloat(document.getElementById('audit-ded-amount')?.value) || 0;
    const remarks = document.getElementById('audit-ded-remarks')?.value.trim() || 'Salary deduction applied via Audit Center';

    // 1. If it was an unapproved leave request, convert it to approved salary-deduction leave
    if (prob.rawType === 'leave') {
      DB.update('leave_requests', prob.rawRecord.id, {
        status: 'approved',
        salaryDeduction: true,
        deductionDays: days,
        deductionAmount: amount,
        approvedOn: Utils.today(),
        comments: `Approved as Salary Deduction: ${remarks}`
      });
    } else if (prob.rawType === 'attendance_absence' || prob.rawType === 'leave_rejected') {
      // Create an official salary deduction leave entry so Payroll will automatically deduct it
      const newLeave = {
        id: DB.nextId('leave_requests'),
        employeeId: prob.employeeId,
        typeId: 6, // Unpaid Leave
        quotaTypeId: 6,
        quotaName: 'Unpaid Leave (Loss of Pay)',
        from: prob.rawRecord.date || prob.rawRecord.from,
        to: prob.rawRecord.date || prob.rawRecord.to,
        days: days,
        reason: `Salary deduction for missed work: ${remarks}`,
        status: 'approved',
        salaryDeduction: true,
        deductionDays: days,
        deductionAmount: amount,
        appliedOn: Utils.today(),
        approvedOn: Utils.today(),
        comments: remarks
      };
      DB.add('leave_requests', newLeave);

      if (prob.rawType === 'attendance_absence') {
        DB.update('attendance', prob.rawRecord.id, {
          remarks: `Converted to Unpaid Leave (Salary Deduction: PKR ${amount.toLocaleString()})`
        });
      }
    }

    // 2. Persist resolution in audit_resolutions
    const resolutions = DB.get('audit_resolutions') || [];
    resolutions.push({
      id: DB.nextId('audit_resolutions'),
      problemKey,
      action: 'Deducted from Salary',
      note: `PKR ${amount.toLocaleString()} for ${days}d deduction (${remarks})`,
      deductionAmount: amount,
      deductionDays: days,
      resolvedBy: Auth.user?.username || 'HR Admin',
      resolvedAt: Utils.today()
    });
    DB.set('audit_resolutions', resolutions);

    DB.log('AUDIT', 'Administration', `Resolved discrepancy ${problemKey} with salary deduction PKR ${amount} for ${prob.empName}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Salary deduction of PKR ${amount.toLocaleString()} scheduled for ${prob.empName}!`, 'success');
    this.render();
  },

  promptApproveLeave(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob || prob.rawType !== 'leave') return;

    Modal.confirm('Approve Leave Request', `Approve leave request for <strong>${prob.empName}</strong> (${prob.dateOrPeriod}) against employee quota?`, () => {
      Leaves.approve(prob.rawRecord.id);

      const resolutions = DB.get('audit_resolutions') || [];
      resolutions.push({
        id: DB.nextId('audit_resolutions'),
        problemKey,
        action: 'Approved against Quota',
        note: 'Approved by HR Audit Center',
        resolvedBy: Auth.user?.username || 'HR Admin',
        resolvedAt: Utils.today()
      });
      DB.set('audit_resolutions', resolutions);

      DB.log('AUDIT', 'Administration', `Approved leave #${prob.rawRecord.id} for ${prob.empName}`, Auth.user?.id);
      Toast.show(`Leave approved for ${prob.empName}!`, 'success');
      this.render();
    });
  },

  promptRegularize(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob) return;

    Modal.show(`Regularize Attendance — ${prob.empName}`, `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="font-size:13px;color:var(--text)">
          Regularize attendance on <strong>${prob.dateOrPeriod}</strong> as <strong>Present</strong> (e.g. for official client visit, biometric failure, or field assignment).
        </div>
        <div class="form-group">
          <label class="form-label required">Regularization Reason</label>
          <select class="form-control" id="reg-reason">
            <option value="Biometric Machine Malfunction">Biometric Machine Malfunction</option>
            <option value="Client Site / Field Visit">Client Site / Field Visit</option>
            <option value="Work From Home / Remote Approval">Work From Home / Remote Approval</option>
            <option value="Official Company Duty">Official Company Duty</option>
            <option value="Manager Verbal Approval">Manager Verbal Approval</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">HR / Audit Remarks</label>
          <input class="form-control" id="reg-remarks" placeholder="Optional audit notes">
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Administration.executeRegularize('${problemKey}')"><i class="fa fa-user-check"></i> Mark Regularized (Present)</button>
      `
    });
  },

  executeRegularize(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob) return;

    const reason = document.getElementById('reg-reason')?.value || 'Official Regularization';
    const remarks = document.getElementById('reg-remarks')?.value.trim() || '';
    const noteText = remarks ? `${reason}: ${remarks}` : reason;

    if (prob.rawRecord?.id) {
      if (prob.rawType?.startsWith('attendance')) {
        DB.update('attendance', prob.rawRecord.id, {
          status: 'present',
          timeIn: prob.rawRecord.timeIn || '09:00',
          timeOut: prob.rawRecord.timeOut || '18:00',
          remarks: `Regularized by HR: ${noteText}`
        });
      }
    }

    const resolutions = DB.get('audit_resolutions') || [];
    resolutions.push({
      id: DB.nextId('audit_resolutions'),
      problemKey,
      action: 'Regularized Attendance (Present)',
      note: noteText,
      resolvedBy: Auth.user?.username || 'HR Admin',
      resolvedAt: Utils.today()
    });
    DB.set('audit_resolutions', resolutions);

    DB.log('AUDIT', 'Administration', `Regularized attendance for ${prob.empName} (${noteText})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Attendance regularized as Present for ${prob.empName}!`, 'success');
    this.render();
  },

  promptWaiveLate(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob) return;

    Modal.show(`Waive Late Arrival — ${prob.empName}`, `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="font-size:13px;color:var(--text)">
          Waive late arrival penalty for <strong>${prob.empName}</strong> on <strong>${prob.dateOrPeriod}</strong>.
        </div>
        <div class="form-group">
          <label class="form-label required">Waiver Justification</label>
          <select class="form-control" id="waive-reason">
            <option value="Severe Traffic Congestion / Route Blockage">Severe Traffic Congestion / Route Blockage</option>
            <option value="Client Emergency Meeting on the way">Client Emergency Meeting on the way</option>
            <option value="Personal Emergency / Medical Exception">Personal Emergency / Medical Exception</option>
            <option value="First Late Warning of the Month (Excused)">First Late Warning of the Month (Excused)</option>
            <option value="Approved by Department Head">Approved by Department Head</option>
          </select>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-secondary" onclick="Administration.executeWaiveLate('${problemKey}')"><i class="fa fa-handshake"></i> Waive Late Penalty</button>
      `
    });
  },

  executeWaiveLate(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob) return;

    const reason = document.getElementById('waive-reason')?.value || 'Excused by HR';

    if (prob.rawRecord?.id) {
      DB.update('attendance', prob.rawRecord.id, {
        remarks: `Late arrival excused by HR: ${reason}`
      });
    }

    const resolutions = DB.get('audit_resolutions') || [];
    resolutions.push({
      id: DB.nextId('audit_resolutions'),
      problemKey,
      action: 'Waived Late Arrival',
      note: reason,
      resolvedBy: Auth.user?.username || 'HR Admin',
      resolvedAt: Utils.today()
    });
    DB.set('audit_resolutions', resolutions);

    DB.log('AUDIT', 'Administration', `Waived late arrival for ${prob.empName} (${reason})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Late penalty waived for ${prob.empName}!`, 'success');
    this.render();
  },

  promptCompletePunch(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob) return;

    Modal.show(`Complete Punch Out — ${prob.empName}`, `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="font-size:13px;color:var(--text)">
          Employee punched in at <strong>${prob.rawRecord?.timeIn || '09:00'}</strong> on <strong>${prob.dateOrPeriod}</strong>. Please enter the verified check-out time.
        </div>
        <div class="form-group">
          <label class="form-label required">Check-Out Time</label>
          <input type="time" class="form-control" id="audit-checkout-time" value="18:00">
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Administration.executeCompletePunch('${problemKey}')"><i class="fa fa-save"></i> Save Punch Out</button>
      `
    });
  },

  executeCompletePunch(problemKey) {
    const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth());
    const prob = problems.find(p => p.id === problemKey);
    if (!prob) return;

    const timeOut = document.getElementById('audit-checkout-time')?.value || '18:00';

    if (prob.rawRecord?.id) {
      DB.update('attendance', prob.rawRecord.id, {
        timeOut,
        remarks: `Punch out completed via Audit Center (${timeOut})`
      });
    }

    const resolutions = DB.get('audit_resolutions') || [];
    resolutions.push({
      id: DB.nextId('audit_resolutions'),
      problemKey,
      action: 'Check-out Logged',
      note: `Punched out at ${timeOut}`,
      resolvedBy: Auth.user?.username || 'HR Admin',
      resolvedAt: Utils.today()
    });
    DB.set('audit_resolutions', resolutions);

    DB.log('AUDIT', 'Administration', `Completed check-out punch for ${prob.empName} at ${timeOut}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Check-out punch saved for ${prob.empName}!`, 'success');
    this.render();
  },

  undoResolution(problemKey) {
    const resolutions = DB.get('audit_resolutions') || [];
    const filtered = resolutions.filter(r => r.problemKey !== problemKey);
    DB.set('audit_resolutions', filtered);
    Toast.show('Discrepancy re-opened for audit', 'info');
    this.render();
  },

  autoResolveAll() {
    Modal.confirm('Auto-Regularize Safe Discrepancies', 'Automatically regularize remaining attendance discrepancies and approve pending leaves for this month so payroll can proceed?', () => {
      const problems = this.getAttendanceLeaveProblems(this.auditMonth || Utils.thisMonth()).filter(p => !p.isResolved);
      let count = 0;

      problems.forEach(prob => {
        if (prob.canApprove) {
          Leaves.approve(prob.rawRecord.id);
        } else if (prob.canCompletePunch) {
          DB.update('attendance', prob.rawRecord.id, { timeOut: '18:00', remarks: 'Auto-completed punch out' });
        } else if (prob.canWaiveLate) {
          DB.update('attendance', prob.rawRecord.id, { remarks: 'Excused by HR bulk regularization' });
        } else if (prob.canRegularize) {
          DB.update('attendance', prob.rawRecord.id, { status: 'present', remarks: 'Auto-regularized as present' });
        }

        const resolutions = DB.get('audit_resolutions') || [];
        resolutions.push({
          id: DB.nextId('audit_resolutions'),
          problemKey: prob.id,
          action: 'Batch Regularized',
          note: 'Resolved via Auto-Regularization',
          resolvedBy: Auth.user?.username || 'HR Admin',
          resolvedAt: Utils.today()
        });
        DB.set('audit_resolutions', resolutions);
        count++;
      });

      DB.log('AUDIT', 'Administration', `Batch resolved ${count} discrepancies`, Auth.user?.id);
      Toast.show(`Successfully regularized ${count} issues! Payroll is now ready.`, 'success');
      this.render();
    });
  },

  exportDiscrepanciesCSV() {
    const month = this.auditMonth || Utils.thisMonth();
    const problems = this.getAttendanceLeaveProblems(month);

    if (problems.length === 0) {
      Toast.show('No discrepancy records found to export', 'info');
      return;
    }

    const headers = ['Employee #', 'Employee Name', 'Department', 'Category', 'Date / Occurrence', 'Details', 'Financial Impact', 'Resolved', 'Resolution Action', 'Resolved By'];
    const rows = problems.map(p => [
      `"${p.empNo}"`,
      `"${p.empName.replace(/"/g, '""')}"`,
      `"${p.deptName.replace(/"/g, '""')}"`,
      `"${p.categoryLabel.replace(/"/g, '""')}"`,
      `"${p.dateOrPeriod.replace(/"/g, '""')}"`,
      `"${p.details.replace(/"/g, '""')}"`,
      `"${p.financialImpact.replace(/"/g, '""')}"`,
      p.isResolved ? 'Yes' : 'No',
      `"${(p.resolution?.action || '').replace(/"/g, '""')}"`,
      `"${(p.resolution?.resolvedBy || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csv, `attendance_leave_audit_${month}.csv`);
    Toast.show(`Exported ${problems.length} audit records to CSV`, 'success');
  },
};
