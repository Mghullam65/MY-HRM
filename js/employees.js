// ============================================================
// HRM SYSTEM — Employees Module
// ============================================================

const Employees = {
  currentView: 'current',
  searchQuery: '',
  filterDept: '',
  filterStatus: '',

  render() {
    const content = document.getElementById('page-content');
    const depts = DB.get('departments');

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Sub-tabs -->
        <div style="display:flex;gap:4px;margin-bottom:20px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content">
          ${[
            { id:'current', label:'Active Employees', icon:'fa-users' },
            { id:'onboarding', label:'New Joiners (Onboarding)', icon:'fa-user-clock', badge: (DB.get('employees')||[]).filter(e=>e.role==='onboarding').length },
            { id:'ex', label:'Ex Employees', icon:'fa-user-xmark' },
            { id:'all', label:'All Employees', icon:'fa-list' },
            { id:'directory', label:'Directory', icon:'fa-id-card' },
          ].map(t => `
            <button class="tab-toggle-btn ${this.currentView === t.id ? 'active' : ''}" onclick="Employees.switchView('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
              ${t.badge ? `<span class="badge badge-warning" style="margin-left:6px;font-size:10px;padding:2px 6px">${t.badge}</span>` : ''}
            </button>
          `).join('')}
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="search-box">
            <i class="fa fa-search"></i>
            <input type="text" placeholder="Search by name, ID, email, CNIC..." id="emp-search" value="${this.searchQuery}"
              oninput="Employees.searchQuery=this.value;Employees.renderTable()">
          </div>
          <select class="filter-select" id="dept-filter" onchange="Employees.filterDept=this.value;Employees.renderTable()">
            <option value="">All Departments</option>
            ${depts.map(d => `<option value="${d.id}" ${this.filterDept==d.id?'selected':''}>${d.name}</option>`).join('')}
          </select>
          <select class="filter-select" id="type-filter" onchange="Employees.filterStatus=this.value;Employees.renderTable()">
            <option value="">All Types</option>
            <option value="Permanent">Permanent</option>
            <option value="Probation">Probation</option>
            <option value="Contract">Contract</option>
          </select>
          ${Auth.can('employees.add') || Auth.role === 'superadmin' ? `
            <button class="btn btn-primary" onclick="Employees.showAddForm()">
              <i class="fa fa-plus"></i> Add Employee
            </button>
          ` : ''}
          <button class="btn btn-ghost" onclick="Employees.exportEmployees()">
            <i class="fa fa-file-export"></i> Export
          </button>
        </div>

        <!-- Content Area -->
        <div id="emp-content"></div>
      </div>

      <style>
        .tab-toggle-btn { padding:8px 16px;border:none;background:transparent;color:var(--text-3);font-size:12.5px;font-weight:500;border-radius:7px;cursor:pointer;transition:all .2s; }
        .tab-toggle-btn.active { background:var(--primary);color:white; }
        .tab-toggle-btn:hover:not(.active) { background:var(--surface-2);color:var(--text); }
      </style>
    `;

    this.renderTable();
  },

  switchView(view) {
    this.currentView = view;
    this.render();
  },

  getFiltered() {
    let emps = DB.get('employees');
    // Scoped team visibility: Deputy Manager only sees their direct reportees (4 employees)
    if (Auth.role === 'dept_manager') {
      const myId = Auth.employee?.id;
      emps = emps.filter(e => e.managerId === myId || e.reportingTo === myId);
    }
    // Regular employees only see themselves in the employee list
    if (Auth.role === 'employee') {
      const myEmpId = Auth.employee?.id;
      emps = emps.filter(e => e.id === myEmpId);
    }
    if (this.currentView === 'current')    emps = emps.filter(e => e.status === 'active' && e.role !== 'onboarding');
    if (this.currentView === 'onboarding') emps = emps.filter(e => e.role === 'onboarding');
    if (this.currentView === 'ex')         emps = emps.filter(e => e.status === 'inactive');
    if (this.currentView === 'my') {
      const myId = Auth.employee?.id;
      emps = emps.filter(e => e.managerId === myId || e.reportingTo === myId);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      emps = emps.filter(e =>
        e.fullName.toLowerCase().includes(q) ||
        e.empNo.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.cnic||'').includes(q)
      );
    }
    if (this.filterDept) emps = emps.filter(e => e.departmentId == this.filterDept);
    if (this.filterStatus) emps = emps.filter(e => e.employmentType === this.filterStatus);
    return emps;
  },

  renderTable() {
    const emps = this.getFiltered();
    const container = document.getElementById('emp-content');
    if (!container) return;

    if (this.currentView === 'directory') {
      container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px">
          ${emps.map(e => `
            <div class="emp-card" onclick="Employees.renderProfile(${e.id})">
              <div class="avatar avatar-lg mx-auto" style="background:${Utils.avatarColor(e.id)};margin:0 auto;overflow:hidden">${e.photo ? `<img src="${e.photo}" style="width:100%;height:100%;object-fit:cover" alt="${e.fullName}">` : Utils.avatarInitials(e.fullName)}</div>
              <div class="name">${e.fullName}</div>
              <div class="desig">${Utils.getDesigName(e.designationId)}</div>
              <div class="dept">${Utils.getDeptName(e.departmentId)}</div>
              <div style="font-size:10px;color:var(--text-3);margin-top:2px;font-family:monospace">${e.empNo}</div>
              ${Utils.statusBadge(e.status)}
            </div>
          `).join('')}
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:13px;color:var(--text-3)">${emps.length} employee${emps.length!==1?'s':''} found</span>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead><tr>
              <th>Employee</th>
              <th>Emp #</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Contact</th>
              <th>Join Date</th>
              <th>Role & Status</th>
              <th style="text-align:right">Actions</th>
            </tr></thead>
            <tbody>
              ${emps.length === 0 ? `<tr><td colspan="8"><div class="empty-state"><i class="fa fa-users-slash"></i><h3>No employees found</h3></div></td></tr>` : emps.map(e => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${e.id})">${e.photo ? `<img src="${e.photo}" style="width:100%;height:100%;object-fit:cover" alt="${e.fullName}">` : Utils.avatarInitials(e.fullName)}</div>
                      <div>
                        <div style="font-weight:600;font-size:13px;cursor:pointer;color:var(--primary)" onclick="Employees.renderProfile(${e.id})">${e.fullName}</div>
                        <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(e.designationId)} • ${e.email}</div>
                        <div style="font-size:10.5px;color:var(--text-2);margin-top:2px">
                          <i class="fa fa-user-tie" style="color:var(--primary);font-size:9.5px"></i> Report-to: <span style="font-weight:600;color:var(--text)">${e.id === 1 ? 'Board / CEO' : e.id === 2 ? 'Admin (CEO)' : e.id === 3 ? 'Admin & HR' : (Utils.getEmpName(e.managerId || 3) || 'Deputy Manager')}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span style="font-family:monospace;font-size:12px;color:var(--primary)">${e.empNo}</span></td>
                  <td>${Utils.getDeptName(e.departmentId)}</td>
                  <td>${Utils.getDesigName(e.designationId)}</td>
                  <td style="font-size:12px">${e.phone}</td>
                  <td style="font-size:12px">${Utils.formatDate(e.joiningDate)}</td>
                  <td>
                    ${e.role === 'onboarding' 
                      ? `<span class="badge badge-warning" style="font-size:10.5px"><i class="fa fa-user-clock"></i> Onboarding</span>` 
                      : `<span class="chip" style="font-size:11px">${e.role || 'employee'}</span>`}
                    <div style="margin-top:3px">${Utils.statusBadge(e.status)}</div>
                  </td>
                  <td style="text-align:right">
                    <div class="tbl-actions" style="justify-content:flex-end">
                      <button class="btn btn-ghost btn-icon btn-sm" onclick="Employees.renderProfile(${e.id})" title="View Profile"><i class="fa fa-eye"></i></button>
                      ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `
                        ${e.role === 'onboarding' ? `
                          <button class="btn btn-warning btn-xs" onclick="Employees.showOnboardingApprovalModal(${e.id})" title="Review Onboarding & Assign Role">
                            <i class="fa fa-user-check"></i> Assign Role
                          </button>
                        ` : ''}
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="Employees.showEditForm(${e.id})" title="Edit Profile & Role"><i class="fa fa-pen"></i></button>
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="Employees.toggleStatus(${e.id})" title="${e.status==='active'?'Deactivate':'Activate'}" style="color:${e.status==='active'?'var(--danger)':'var(--success)'}"><i class="fa fa-${e.status==='active'?'ban':'circle-check'}"></i></button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderProfile(empId, isMyProfile = false) {
    const emp = DB.find('employees', empId);
    if (!emp) return;
    const content = document.getElementById('page-content');
    const isHR = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    // Access guard: Deputy Manager can only view profiles of their direct team
    if (Auth.role === 'dept_manager') {
      const myId = Auth.employee?.id;
      if (emp.id !== myId && emp.managerId !== myId && emp.reportingTo !== myId) {
        if (content) content.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:60px 20px"><i class="fa fa-lock" style="font-size:48px;color:var(--danger);margin-bottom:20px;display:block"></i><h3 style="color:var(--text);font-size:20px;margin-bottom:8px">Access Restricted</h3><p style="color:var(--text-3);margin-bottom:24px;font-size:14px">You can only view profiles of your direct team members.</p><button class="btn btn-primary" onclick="App.navigate('employees')"><i class="fa fa-arrow-left"></i> Back to My Team</button></div>`;
        return;
      }
    }
    // Regular employees can only view their own profile
    if (Auth.role === 'employee') {
      const myEmpId = Auth.employee?.id;
      if (emp.id !== myEmpId) {
        if (content) content.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:60px 20px"><i class="fa fa-lock" style="font-size:48px;color:var(--danger);margin-bottom:20px;display:block"></i><h3 style="color:var(--text);font-size:20px;margin-bottom:8px">Access Restricted</h3><p style="color:var(--text-3);margin-bottom:24px;font-size:14px">You can only view your own profile.</p><button class="btn btn-primary" onclick="Employees.renderProfile(${myEmpId}, true)"><i class="fa fa-user"></i> View My Profile</button></div>`;
        return;
      }
    }
    const isOnboardingSelf = Auth.role === 'onboarding' && Auth.employee?.id === emp.id;

    const users = DB.get('users') || [];
    const linkedUser = users.find(u => u.employeeId === emp.id);

    const tabs = [
      'Personal','Contact','Emergency Contact','Dependents','Employment','Role & Access',
      'Qualification','Experience','Attendance','Leaves','Salary',
      'Performance','Training','Promotion','Transfer','Assets','Documents','Notes','Exit'
    ];

    content.innerHTML = `
      <div class="animate-fade-in">
        ${!isMyProfile ? `
          <div class="breadcrumb">
            <a onclick="App.navigate('employees')" style="cursor:pointer">Employees</a>
            <i class="fa fa-chevron-right"></i>
            <span>${emp.fullName}</span>
          </div>
        ` : ''}

        ${emp.role === 'onboarding' ? `
          <!-- New Joiner Onboarding Active Banner -->
          <div class="card" style="background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(99,102,241,0.08));border:1.5px solid rgba(245,158,11,0.35);border-radius:12px;padding:18px 22px;margin-bottom:20px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="badge badge-warning" style="font-size:11.5px"><i class="fa fa-user-clock"></i> New Joiner Onboarding Active</span>
                  ${emp.onboardingStatus === 'submitted_for_review' 
                    ? `<span class="badge badge-success" style="font-size:11.5px"><i class="fa fa-circle-check"></i> Submitted for HR Verification</span>` 
                    : `<span class="badge badge-secondary" style="font-size:11.5px"><i class="fa fa-pen"></i> Self-Service Form Active</span>`}
                </div>
                <h3 style="font-size:16px;font-weight:700;color:var(--text);margin-top:6px">Complete Joining Information & Upload Required Documents</h3>
                <p style="font-size:12.5px;color:var(--text-2);margin-top:3px;max-width:650px">
                  Please fill in personal, contact, emergency, and bank account details, and upload all required documents. Once submitted, HR/Admin will assign your permanent role.
                </p>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${isOnboardingSelf ? `
                  <button class="btn btn-primary btn-sm" onclick="Employees.showSelfServiceEditForm(${emp.id})">
                    <i class="fa fa-pen-to-square"></i> Fill / Edit My Info
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="Employees.showUploadDocumentModal(${emp.id})">
                    <i class="fa fa-upload"></i> Upload Documents
                  </button>
                  ${emp.onboardingStatus !== 'submitted_for_review' ? `
                    <button class="btn btn-success btn-sm" onclick="Employees.submitOnboardingForReview(${emp.id})">
                      <i class="fa fa-paper-plane"></i> Submit to HR
                    </button>
                  ` : `
                    <span class="btn btn-ghost btn-sm" style="color:var(--success);cursor:default">
                      <i class="fa fa-circle-check"></i> Queued for HR
                    </span>
                  `}
                ` : ''}
                ${isHR ? `
                  <button class="btn btn-primary btn-sm" onclick="Employees.showAssignRoleModal(${emp.id})">
                    <i class="fa fa-user-shield"></i> Assign / Edit Role
                  </button>
                  <button class="btn btn-success btn-sm" onclick="Employees.assignRoleQuick(${emp.id}, 'employee')">
                    <i class="fa fa-user-check"></i> Make Simple Employee
                  </button>
                  <button class="btn btn-info btn-sm" onclick="Employees.assignRoleQuick(${emp.id}, 'dept_manager')">
                    <i class="fa fa-user-tie"></i> Make Manager
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        ` : ''}

        <div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start">
          <!-- ═══════════════════════════════════════════════
               LEFT SIDEBAR: ACCORDION NAVIGATION (Screenshots 1-5)
          ═══════════════════════════════════════════════ -->
          <div>
            <!-- Header: Photo Thumbnail, Full Name, EMP ID -->
            <div class="card" style="padding:14px;border-radius:8px;margin-bottom:12px;display:flex;align-items:center;gap:14px;border:1px solid var(--border);box-shadow:var(--shadow-sm)">
              <div style="width:62px;height:72px;border:1px solid #cbd5e1;border-radius:4px;overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                ${emp.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName}">` : `
                  <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${Utils.avatarColor(emp.id)};color:#fff;font-size:22px;font-weight:700">
                    ${Utils.avatarInitials(emp.fullName)}
                  </div>
                `}
              </div>
              <div style="overflow:hidden">
                <h3 style="font-size:17px;font-weight:700;color:#0284c7;margin:0;line-height:1.2;white-space:nowrap;text-overflow:ellipsis;overflow:hidden">${emp.fullName}</h3>
                <div style="font-size:12.5px;font-weight:600;color:var(--text-2);margin-top:6px">EMP ID: ${String(emp.empNo||emp.id).replace('EMP-', '')}</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden">${Utils.getDesigName(emp.designationId)}</div>
              </div>
            </div>

            <!-- Accordion Groups matching Screenshots 1-5 -->
            <div class="profile-acc-card" style="background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;box-shadow:var(--shadow-sm)">
              
              <!-- 1. Personal -->
              <div class="profile-acc-group">
                <div class="profile-acc-header" onclick="Employees.toggleAccGroup(this)">
                  <span class="profile-acc-title">Personal</span>
                  <span class="profile-acc-icon">-</span>
                </div>
                <div class="profile-acc-body open">
                  <div class="profile-acc-item ${(!this.currentProfileSection || this.currentProfileSection==='personal-details')?'active':''}" data-section="personal-details" onclick="Employees.switchProfileSection('personal-details', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Personal Details
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='contact-details'?'active':''}" data-section="contact-details" onclick="Employees.switchProfileSection('contact-details', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Contact Details
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='emergency-contacts'?'active':''}" data-section="emergency-contacts" onclick="Employees.switchProfileSection('emergency-contacts', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Emergency Contacts
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='dependants'?'active':''}" data-section="dependants" onclick="Employees.switchProfileSection('dependants', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Dependants
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='photograph'?'active':''}" data-section="photograph" onclick="Employees.switchProfileSection('photograph', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Photograph
                  </div>
                </div>
              </div>

              <!-- 2. Employment -->
              <div class="profile-acc-group">
                <div class="profile-acc-header" onclick="Employees.toggleAccGroup(this)">
                  <span class="profile-acc-title">Employment</span>
                  <span class="profile-acc-icon">+</span>
                </div>
                <div class="profile-acc-body">
                  <div class="profile-acc-item ${this.currentProfileSection==='joining-info'?'active':''}" data-section="joining-info" onclick="Employees.switchProfileSection('joining-info', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Joining Info
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='ending-info'?'active':''}" data-section="ending-info" onclick="Employees.switchProfileSection('ending-info', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Ending Info
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='lunch-subscription'?'active':''}" data-section="lunch-subscription" onclick="Employees.switchProfileSection('lunch-subscription', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Lunch Subscription
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='employment-status'?'active':''}" data-section="employment-status" onclick="Employees.switchProfileSection('employment-status', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Employment Status
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='official-contacts'?'active':''}" data-section="official-contacts" onclick="Employees.switchProfileSection('official-contacts', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Official Contacts
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='office-timings'?'active':''}" data-section="office-timings" onclick="Employees.switchProfileSection('office-timings', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Office Timings
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='report-to'?'active':''}" data-section="report-to" onclick="Employees.switchProfileSection('report-to', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Report-to
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='mis-info'?'active':''}" data-section="mis-info" onclick="Employees.switchProfileSection('mis-info', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> MIS Info
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='login-info'?'active':''}" data-section="login-info" onclick="Employees.switchProfileSection('login-info', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Login Info
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='bank-accounts'?'active':''}" data-section="bank-accounts" onclick="Employees.switchProfileSection('bank-accounts', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Bank Accounts
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='tax-info'?'active':''}" data-section="tax-info" onclick="Employees.switchProfileSection('tax-info', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Tax Info
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='insurance-details'?'active':''}" data-section="insurance-details" onclick="Employees.switchProfileSection('insurance-details', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Insurance Details
                  </div>
                </div>
              </div>

              <!-- 3. Qualification -->
              <div class="profile-acc-group">
                <div class="profile-acc-header" onclick="Employees.toggleAccGroup(this)">
                  <span class="profile-acc-title">Qualification</span>
                  <span class="profile-acc-icon">+</span>
                </div>
                <div class="profile-acc-body">
                  <div class="profile-acc-item ${this.currentProfileSection==='personal-documents'?'active':''}" data-section="personal-documents" onclick="Employees.switchProfileSection('personal-documents', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Personal Documents
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='work-experience'?'active':''}" data-section="work-experience" onclick="Employees.switchProfileSection('work-experience', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Work Experience
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='education'?'active':''}" data-section="education" onclick="Employees.switchProfileSection('education', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Education
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='skills'?'active':''}" data-section="skills" onclick="Employees.switchProfileSection('skills', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Skills
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='working-technologies'?'active':''}" data-section="working-technologies" onclick="Employees.switchProfileSection('working-technologies', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Working Technologies
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='languages'?'active':''}" data-section="languages" onclick="Employees.switchProfileSection('languages', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Languages
                  </div>
                </div>
              </div>

              <!-- 4. Performance Review -->
              <div class="profile-acc-group">
                <div class="profile-acc-header" onclick="Employees.toggleAccGroup(this)">
                  <span class="profile-acc-title">Performance Review</span>
                  <span class="profile-acc-icon">+</span>
                </div>
                <div class="profile-acc-body">
                  <div class="profile-acc-item ${this.currentProfileSection==='performance-review'?'active':''}" data-section="performance-review" onclick="Employees.switchProfileSection('performance-review', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Performance Review
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='employee-review-comments'?'active':''}" data-section="employee-review-comments" onclick="Employees.switchProfileSection('employee-review-comments', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Employee Review Comments
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='pse-evaluation-form'?'active':''}" data-section="pse-evaluation-form" onclick="Employees.switchProfileSection('pse-evaluation-form', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> PSE evaluation form
                  </div>
                  <div class="profile-acc-item ${this.currentProfileSection==='next-year-targets'?'active':''}" data-section="next-year-targets" onclick="Employees.switchProfileSection('next-year-targets', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Next Year Targets
                  </div>
                </div>
              </div>

              <!-- 5. Attendance -->
              <div class="profile-acc-group">
                <div class="profile-acc-header" onclick="Employees.toggleAccGroup(this)">
                  <span class="profile-acc-title">Attendance</span>
                  <span class="profile-acc-icon">+</span>
                </div>
                <div class="profile-acc-body">
                  <div class="profile-acc-item ${this.currentProfileSection==='attendance-correction'?'active':''}" data-section="attendance-correction" onclick="Employees.switchProfileSection('attendance-correction', this, ${emp.id})">
                    <span class="acc-bullet">▸</span> Attendance Correction / Work From Home
                  </div>
                </div>
              </div>

            </div>

            <!-- Profile Sidebar Management Actions -->
            <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">
              ${isHR ? `
                <button class="btn btn-primary btn-sm w-full" onclick="Employees.showAssignRoleModal(${emp.id})">
                  <i class="fa fa-user-shield"></i> Assign / Edit Role
                </button>
                <button class="btn btn-secondary btn-sm w-full" onclick="Employees.showEditForm(${emp.id})">
                  <i class="fa fa-pen"></i> Edit Personal Details
                </button>
              ` : ''}
              <button class="btn btn-ghost btn-sm w-full" onclick="Employees.printProfile(${emp.id})">
                <i class="fa fa-print"></i> Print Profile
              </button>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════
               RIGHT MAIN CONTENT PANEL
          ═══════════════════════════════════════════════ -->
          <div class="card" id="profile-main-content" style="padding:22px 24px;border-radius:10px;min-height:580px;border:1px solid var(--border);box-shadow:var(--shadow-sm)">
            ${this.renderProfileSection(this.currentProfileSection || 'personal-details', emp)}
          </div>
        </div>
      </div>

      <style>
        .profile-acc-card { border: 1px solid var(--border); }
        .profile-acc-group { border-bottom: 1px solid var(--border); }
        .profile-acc-group:last-child { border-bottom: none; }
        .profile-acc-header {
          background: #f8fafc;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13.5px;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s ease;
          border-top: 1px solid var(--border);
        }
        .profile-acc-group:first-child .profile-acc-header { border-top: none; }
        .profile-acc-header:hover { background: #f1f5f9; }
        .profile-acc-icon { font-size: 18px; font-weight: 800; color: #334155; line-height: 1; }
        .profile-acc-body { display: none; background: #ffffff; }
        .profile-acc-body.open { display: block; }
        .profile-acc-item {
          padding: 8px 16px;
          font-size: 12.5px;
          color: #0284c7;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
        }
        .profile-acc-item:last-child { border-bottom: none; }
        .profile-acc-item:hover { background: rgba(2, 132, 199, 0.08); font-weight: 600; }
        .profile-acc-item.active { background: rgba(2, 132, 199, 0.14); font-weight: 700; color: #0369a1; border-left: 3px solid #0284c7; }
        .acc-bullet { color: #0284c7; font-size: 13px; font-family: monospace; }
        
        [data-theme="dark"] .profile-acc-header { background: #1e293b; color: #f8fafc; }
        [data-theme="dark"] .profile-acc-header:hover { background: #334155; }
        [data-theme="dark"] .profile-acc-body { background: #0f172a; }
        [data-theme="dark"] .profile-acc-icon { color: #cbd5e1; }
        [data-theme="dark"] .profile-acc-item { border-bottom-color: #1e293b; color: #38bdf8; }
        [data-theme="dark"] .profile-acc-item:hover { background: rgba(56, 189, 248, 0.12); }
        [data-theme="dark"] .profile-acc-item.active { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border-left-color: #38bdf8; }
      </style>
    `;
  },

  currentProfileSection: 'personal-details',
  activeProfileEmpId: null,

  toggleAccGroup(headerEl) {
    const body = headerEl.nextElementSibling;
    const icon = headerEl.querySelector('.profile-acc-icon');
    if (!body) return;
    const isOpen = body.classList.contains('open');
    if (isOpen) {
      body.classList.remove('open');
      if (icon) icon.textContent = '+';
    } else {
      body.classList.add('open');
      if (icon) icon.textContent = '-';
    }
  },

  switchProfileSection(sectionKey, itemEl, empId) {
    this.currentProfileSection = sectionKey;
    document.querySelectorAll('.profile-acc-item').forEach(el => el.classList.remove('active'));
    if (itemEl) itemEl.classList.add('active');
    const container = document.getElementById('profile-main-content');
    const emp = DB.find('employees', empId || this.activeProfileEmpId);
    if (container && emp) {
      container.innerHTML = this.renderProfileSection(sectionKey, emp);
    }
  },

  renderProfileSection(sectionKey, emp) {
    const isHR = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const isMgr = Auth.role === 'dept_manager';
    const isSelf = Auth.employee?.id === emp.id;
    const myId = Auth.employee?.id;

    const row = (label, val, icon = '') => `
      <div style="display:flex;padding:11px 0;border-bottom:1px solid var(--border);align-items:center">
        <div style="width:210px;font-size:12.5px;color:var(--text-3);font-weight:600;flex-shrink:0;display:flex;align-items:center;gap:8px">
          ${icon ? `<i class="fa ${icon}" style="color:var(--primary);width:16px;text-align:center"></i>` : ''}
          ${label}
        </div>
        <div style="font-size:13.5px;color:var(--text);font-weight:500;flex:1">${val || '—'}</div>
      </div>
    `;

    const sectionHeader = (title, subtitle, actionBtn = '') => `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:10px">
        <div>
          <h3 style="font-size:17.5px;font-weight:700;color:var(--text);margin:0">${title}</h3>
          ${subtitle ? `<div style="font-size:12px;color:var(--text-3);margin-top:2px">${subtitle}</div>` : ''}
        </div>
        ${actionBtn ? `<div>${actionBtn}</div>` : ''}
      </div>
    `;

    switch(sectionKey) {
      // ═════════════════════════════════════════════════════
      // 1. PERSONAL (5 Sub-buttons)
      // ═════════════════════════════════════════════════════
      case 'personal-details': {
        const editBtn = isHR ? `<button class="btn btn-secondary btn-sm" onclick="Employees.showEditForm(${emp.id})"><i class="fa fa-pen"></i> Edit Personal Details</button>` : '';
        return `
          ${sectionHeader('Personal Details', 'Basic identity, demographic and citizenship credentials', editBtn)}
          <div>
            ${row('Full Name', emp.fullName, 'fa-user')}
            ${row('Date of Birth', Utils.formatDate(emp.dob), 'fa-calendar')}
            ${row('Age', Utils.getAge(emp.dob) + ' Years', 'fa-hourglass-half')}
            ${row('Gender', emp.gender, 'fa-venus-mars')}
            ${row('Marital Status', emp.maritalStatus, 'fa-ring')}
            ${row('CNIC / National ID', emp.cnic, 'fa-id-card')}
            ${row('Blood Group', emp.bloodGroup, 'fa-droplet')}
            ${row('Nationality', emp.nationality, 'fa-flag')}
            ${row('Religion', emp.religion, 'fa-mosque')}
            ${row('Residential Address', emp.address, 'fa-location-dot')}
          </div>
        `;
      }

      case 'contact-details': {
        const editBtn = isHR ? `<button class="btn btn-secondary btn-sm" onclick="Employees.showEditForm(${emp.id})"><i class="fa fa-pen"></i> Edit Contacts</button>` : '';
        return `
          ${sectionHeader('Contact Details', 'Direct communications, residences and coordinates', editBtn)}
          <div>
            ${row('Official Email', emp.email, 'fa-envelope')}
            ${row('Personal Phone / Mobile', emp.phone, 'fa-mobile-screen')}
            ${row('Alternate Emergency Phone', emp.emergencyContact?.phone || 'Not Registered', 'fa-phone')}
            ${row('Current Residence', emp.address, 'fa-house-user')}
            ${row('Permanent Address', emp.address, 'fa-building')}
            ${row('City', Utils.getBranchName(emp.branchId) || 'Karachi', 'fa-city')}
            ${row('Country', emp.nationality || 'Pakistan', 'fa-earth-asia')}
          </div>
        `;
      }

      case 'emergency-contacts': {
        const ec = emp.emergencyContact || {};
        return `
          ${sectionHeader('Emergency Contacts', 'Immediate relatives and next-of-kin for critical notifications', '')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:12px;letter-spacing:0.5px">
                <i class="fa fa-user-shield" style="margin-right:6px"></i> Primary Emergency Contact
              </div>
              ${row('Contact Name', ec.name || 'Not Provided')}
              ${row('Relationship', ec.relation || '—')}
              ${row('Emergency Phone', ec.phone || '—')}
              ${row('Residence', emp.address || '—')}
            </div>
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:12px;letter-spacing:0.5px">
                <i class="fa fa-hospital" style="margin-right:6px"></i> Corporate SOS & Medical Desk
              </div>
              ${row('Company Helpline', '021-111-HRM-PRO (Ext 911)')}
              ${row('Head of Medical', 'Dr. Tariq Siddiqui')}
              ${row('Emergency Panel Ambulance', '1122 (Aman / Edhi Link)')}
              ${row('Designated Hospital', 'South City / Aga Khan University')}
            </div>
          </div>
        `;
      }

      case 'dependants': {
        const deps = (DB.get('dependents') || []).filter(d => d.employeeId === emp.id);
        const addBtn = `<button class="btn btn-primary btn-sm" onclick="Employees.showAddDependent(${emp.id})"><i class="fa fa-plus"></i> Add Dependant</button>`;
        return `
          ${sectionHeader('Registered Dependants', 'Family members eligible for medical coverage and dependent benefits', addBtn)}
          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Dependant Name</th>
                  <th>Relationship</th>
                  <th>Date of Birth</th>
                  <th>CNIC / B-Form</th>
                  <th>Medical Coverage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${deps.length === 0 ? `
                  <tr><td colspan="6"><div class="empty-state" style="padding:30px"><i class="fa fa-users"></i><h3>No Dependants Registered</h3><p>Click "Add Dependant" to register family members.</p></div></td></tr>
                ` : deps.map(d => `
                  <tr>
                    <td style="font-weight:600">${d.name}</td>
                    <td><span class="chip">${d.relation}</span></td>
                    <td>${Utils.formatDate(d.dob)}</td>
                    <td>${d.cnic || '—'}</td>
                    <td><span class="badge badge-success"><i class="fa fa-shield-halved"></i> Active Insured</span></td>
                    <td>
                      <button class="btn btn-danger btn-xs" onclick="Employees.deleteDependent(${d.id}, ${emp.id})"><i class="fa fa-trash"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      case 'photograph': {
        const changeBtn = `<button class="btn btn-primary btn-sm" onclick="Employees.showUploadPhotoModal(${emp.id})"><i class="fa fa-upload"></i> Change / Upload Photograph</button>`;
        return `
          ${sectionHeader('Official Photograph', 'Biometric portrait for identification cards and access gates', changeBtn)}
          <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;background:var(--surface);padding:24px;border-radius:12px;border:1px solid var(--border)">
            <div style="width:160px;height:190px;border:2px solid var(--primary);border-radius:8px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md)">
              ${emp.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName}">` : `
                <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${Utils.avatarColor(emp.id)};color:#fff;font-size:52px;font-weight:800">
                  ${Utils.avatarInitials(emp.fullName)}
                </div>
              `}
            </div>
            <div style="flex:1;min-width:240px">
              <h4 style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px">${emp.fullName}</h4>
              <div style="font-size:13px;color:var(--text-3);margin-bottom:12px">EMP ID: <strong>${emp.empNo}</strong> • ${Utils.getDesigName(emp.designationId)}</div>
              <div style="background:var(--card);border:1px dashed var(--border);border-radius:8px;padding:12px;font-size:12px;color:var(--text-2);line-height:1.6">
                <div><i class="fa fa-circle-check" style="color:var(--success);margin-right:6px"></i> White or light blue background standard.</div>
                <div><i class="fa fa-circle-check" style="color:var(--success);margin-right:6px"></i> Passport size portrait framing (300x350px).</div>
                <div><i class="fa fa-circle-check" style="color:var(--success);margin-right:6px"></i> Synchronized with main Biometric turnstile system.</div>
              </div>
            </div>
          </div>
        `;
      }

      // ═════════════════════════════════════════════════════
      // 2. EMPLOYMENT (12 Sub-buttons)
      // ═════════════════════════════════════════════════════
      case 'joining-info': {
        return `
          ${sectionHeader('Joining Information', 'Terms of appointment, induction milestones and tenure', '')}
          <div>
            ${row('Date of Joining', Utils.formatDate(emp.joiningDate), 'fa-calendar-plus')}
            ${row('Confirmation Date', Utils.formatDate(emp.confirmationDate), 'fa-calendar-check')}
            ${row('Probationary Duration', '3 Months (Standard)', 'fa-clock')}
            ${row('Designation at Joining', Utils.getDesigName(emp.designationId), 'fa-briefcase')}
            ${row('Department', Utils.getDeptName(emp.departmentId), 'fa-sitemap')}
            ${row('Assigned Branch', Utils.getBranchName(emp.branchId), 'fa-building')}
            ${row('Employment Category', emp.employmentType, 'fa-file-contract')}
            ${row('Offer & Appointment Letter', '<span class="badge badge-success"><i class="fa fa-circle-check"></i> Formally Executed & Signed</span>', 'fa-file-signature')}
          </div>
        `;
      }

      case 'ending-info': {
        return `
          ${sectionHeader('Ending & Separation Details', 'Notice periods, resignation status and exit clearance records', '')}
          <div>
            ${row('Employment Lifecycle Status', Utils.statusBadge(emp.status), 'fa-user-clock')}
            ${row('Resignation / Exit Date', emp.exitDate ? Utils.formatDate(emp.exitDate) : 'Not Applicable (Currently Active in Service)', 'fa-calendar-xmark')}
            ${row('Last Working Day', emp.exitDate ? Utils.formatDate(emp.exitDate) : 'Currently In Service', 'fa-calendar-day')}
            ${row('Notice Period Requirement', '30 Days Standard Written Notice', 'fa-hourglass-start')}
            ${row('Exit Interview Clearance', emp.status === 'inactive' ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-secondary">Not Required (Active)</span>', 'fa-clipboard-check')}
            ${row('Final Settlement & Gratuity', emp.status === 'inactive' ? 'Processed & Disbursed' : 'Accruing with service years', 'fa-receipt')}
          </div>
        `;
      }

      case 'lunch-subscription': {
        const ls = emp.lunchSubscription || { subscribed: true, plan: 'Standard Corporate Buffet', diet: 'Regular / Halal', cafeteriaPass: `CAF-${String(emp.id).padStart(4,'0')}` };
        const toggleBtn = `<button class="btn btn-primary btn-sm" onclick="Employees.toggleLunchSubscription(${emp.id})"><i class="fa fa-utensils"></i> ${ls.subscribed ? 'Opt-Out from Lunch' : 'Subscribe to Lunch'}</button>`;
        return `
          ${sectionHeader('Lunch Subscription & Cafeteria Plan', 'Daily corporate lunch subscription, cafeteria RFID pass, and dietary preferences', toggleBtn)}
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
              <div>
                <div style="font-size:12px;color:var(--text-3)">Current Meal Subscription Status:</div>
                <div style="font-size:18px;font-weight:700;color:var(--text);margin-top:2px">
                  ${ls.subscribed 
                    ? '<span class="badge badge-success" style="font-size:13px;padding:5px 12px"><i class="fa fa-circle-check"></i> Subscribed & Active</span>' 
                    : '<span class="badge badge-secondary" style="font-size:13px;padding:5px 12px"><i class="fa fa-circle-xmark"></i> Inactive (Opted Out)</span>'}
                </div>
              </div>
              <div style="font-size:32px;color:var(--primary);opacity:0.8"><i class="fa fa-bowl-food"></i></div>
            </div>
            ${row('Cafeteria RFID Access Pass', ls.cafeteriaPass || `CAF-${String(emp.id).padStart(4,'0')}`, 'fa-id-card-clip')}
            ${row('Meal Plan', ls.plan || 'Standard Corporate Buffet (Mon-Fri)', 'fa-plate-wheat')}
            ${row('Dietary Preferences', ls.diet || 'Regular / Halal', 'fa-leaf')}
            ${row('Cafeteria Dining Hours', '01:00 PM – 02:00 PM (Executive Dining Hall)', 'fa-clock')}
            ${row('Company Subsidy Coverage', '70% Subsidized by Employer (30% nominal payroll deduction)', 'fa-hand-holding-dollar')}
          </div>
        `;
      }

      case 'employment-status': {
        return `
          ${sectionHeader('Employment Status & Tenancy', 'Official contractual classification, department and rank', '')}
          <div>
            ${row('Current Standing', Utils.statusBadge(emp.status), 'fa-signal')}
            ${row('Employment Classification', emp.employmentType || 'Permanent', 'fa-briefcase')}
            ${row('Department', Utils.getDeptName(emp.departmentId), 'fa-sitemap')}
            ${row('Designation', Utils.getDesigName(emp.designationId), 'fa-id-badge')}
            ${row('System Authorization Role', Employees.getRoleBadge(emp.role || 'employee'), 'fa-user-shield')}
            ${row('Reports To (Manager)', emp.id === 1 ? 'Board of Directors / CEO' : emp.id === 2 ? 'Ahmed Khan (Super Admin)' : emp.id === 3 ? 'Admin (Ahmed Khan) & HR (Sara Malik)' : `${Utils.getEmpName(emp.managerId || 3)} (Direct Supervisor)`, 'fa-user-tie')}
            ${row('Service Tenure', `Joined on ${Utils.formatDate(emp.joiningDate)}`, 'fa-clock')}
            ${row('Official Work Station', Utils.getBranchName(emp.branchId), 'fa-building')}
          </div>
        `;
      }

      case 'official-contacts': {
        return `
          ${sectionHeader('Official Workplace Contacts', 'Corporate communication lines, desk numbers and extension routing', '')}
          <div>
            ${row('Corporate Email', emp.email, 'fa-envelope')}
            ${row('Internal Phone Extension', `Ext. 10${emp.id}`, 'fa-phone-volume')}
            ${row('Workstation Desk Location', `Desk-${emp.departmentId}-0${emp.id} (Floor 2, Wing B)`, 'fa-desktop')}
            ${row('Corporate SIM / Mobile', `+92 300 000${String(emp.id).padStart(4,'0')}`, 'fa-mobile-screen')}
            ${row('Slack / Teams Handle', `@${emp.email.split('@')[0]}`, 'fa-comments')}
          </div>
        `;
      }

      case 'office-timings': {
        return `
          ${sectionHeader('Office Timings & Shift Schedule', 'Official working hours, morning cutoffs and grace policies', '')}
          <div>
            ${row('Assigned Shift', 'General Morning Shift (Shift #1)', 'fa-clock')}
            ${row('Standard In-Time', '09:00 AM', 'fa-arrow-right-to-bracket')}
            ${row('Standard Out-Time', '06:00 PM', 'fa-arrow-right-from-bracket')}
            ${row('Grace Period Allowance', '15 Minutes (Grace check-in permitted until 09:15 AM)', 'fa-stopwatch')}
            ${row('Time-In Window Rule', '10:00 AM – 11:00 AM Cutoff (Punches after 11:00 AM marked Late)', 'fa-triangle-exclamation')}
            ${row('Working Days', 'Monday through Friday (5 Days/week, 40 hours)', 'fa-calendar-week')}
            ${row('Weekly Off Days', 'Saturday & Sunday', 'fa-couch')}
          </div>
        `;
      }

      case 'report-to': {
        const adminManager = DB.find('employees', 1) || { id: 1, fullName: 'Ahmed Khan', email: 'ahmed.khan@company.com', phone: '0300-1234567' };
        const hrManager = DB.find('employees', 2) || { id: 2, fullName: 'Sara Malik', email: 'sara.malik@company.com', phone: '0321-2345678' };
        const deptManager = DB.find('employees', 3) || { id: 3, fullName: 'Usman Baig', email: 'usman.baig@company.com', phone: '0333-3456789' };

        const myDirectManagerId = emp.managerId || (emp.id === 2 || emp.id === 3 ? 1 : 3);
        const directManager = DB.find('employees', myDirectManagerId) || deptManager;

        // Subordinates (e.g. if this employee is Usman Baig, show his 4 team members)
        const myTeam = (DB.get('employees') || []).filter(e => e.managerId === emp.id || e.reportingTo === emp.id);
        const reassignBtn = isHR && emp.id !== 1 ? `<button class="btn btn-secondary btn-sm" onclick="Employees.showReassignManagerModal(${emp.id})"><i class="fa fa-user-pen"></i> Change Reporting Manager</button>` : '';

        // 1. If viewing Super Admin (Ahmed Khan, ID: 1)
        if (emp.id === 1 || emp.role === 'superadmin') {
          return `
            ${sectionHeader('Executive Leadership & Reporting Structure', 'Chief Executive & Super Administrator (Apex of Organizational Hierarchy)', '')}
            
            <div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid #f59e0b;border-radius:10px;padding:18px;margin-bottom:20px">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
                <div style="display:flex;align-items:center;gap:14px">
                  <div class="avatar avatar-md" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                  <div>
                    <div style="display:flex;align-items:center;gap:8px">
                      <span class="badge badge-warning" style="font-size:10.5px"><i class="fa fa-crown"></i> Apex Executive Leadership</span>
                      <span class="badge badge-success" style="font-size:10px">Universal Authority</span>
                    </div>
                    <div style="font-size:17px;font-weight:700;color:var(--text);margin-top:3px">${emp.fullName}</div>
                    <div style="font-size:12px;color:var(--text-3)">Super Administrator / Chief Executive • ${emp.email} • ${emp.phone}</div>
                  </div>
                </div>
                <div style="text-align:right;max-width:320px">
                  <div style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase">Reports Directly To:</div>
                  <div style="font-size:13px;font-weight:700;color:var(--text);margin-top:2px">Board of Directors & Corporate Ownership</div>
                  <div style="font-size:11px;color:var(--text-3);margin-top:2px">Holds universal override & approval authority across all HR, attendance, payroll, and appraisals.</div>
                </div>
              </div>
            </div>

            <!-- Key Direct Reports under Super Admin -->
            <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:18px">
              <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px">
                <i class="fa fa-sitemap" style="color:var(--primary)"></i> Key Corporate Direct Reports
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:14px">
                <!-- HR Manager -->
                <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid #6366f1;border-radius:8px;padding:14px;display:flex;align-items:center;gap:12px">
                  <div class="avatar avatar-md" style="background:${Utils.avatarColor(hrManager.id)};overflow:hidden">${hrManager.photo ? `<img src="${hrManager.photo}" style="width:100%;height:100%;object-fit:cover" alt="${hrManager.fullName}">` : Utils.avatarInitials(hrManager.fullName)}</div>
                  <div style="flex:1">
                    <span class="badge" style="background:rgba(99,102,241,0.15);color:#6366f1;font-size:10px">Head of Human Resources</span>
                    <div style="font-weight:700;font-size:13.5px;margin-top:2px;cursor:pointer;color:var(--primary)" onclick="Employees.renderProfile(${hrManager.id})">${hrManager.fullName}</div>
                    <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(hrManager.designationId)} • Reports to: Super Admin</div>
                  </div>
                  <button class="btn btn-ghost btn-xs" onclick="Employees.renderProfile(${hrManager.id})" title="View Profile"><i class="fa fa-chevron-right"></i></button>
                </div>
                <!-- Deputy Manager -->
                <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid var(--primary);border-radius:8px;padding:14px;display:flex;align-items:center;gap:12px">
                  <div class="avatar avatar-md" style="background:${Utils.avatarColor(deptManager.id)};overflow:hidden">${deptManager.photo ? `<img src="${deptManager.photo}" style="width:100%;height:100%;object-fit:cover" alt="${deptManager.fullName}">` : Utils.avatarInitials(deptManager.fullName)}</div>
                  <div style="flex:1">
                    <span class="badge badge-primary" style="font-size:10px">Deputy Manager</span>
                    <div style="font-weight:700;font-size:13.5px;margin-top:2px;cursor:pointer;color:var(--primary)" onclick="Employees.renderProfile(${deptManager.id})">${deptManager.fullName}</div>
                    <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(deptManager.designationId)} • Reports to: Admin & HR both</div>
                  </div>
                  <button class="btn btn-ghost btn-xs" onclick="Employees.renderProfile(${deptManager.id})" title="View Profile"><i class="fa fa-chevron-right"></i></button>
                </div>
              </div>
            </div>
          `;
        }

        // 2. If viewing HR Manager (Sara Malik, ID: 2)
        if (emp.id === 2 || emp.role === 'hr_manager') {
          return `
            ${sectionHeader('Reporting Hierarchy ("Report-to")', 'Corporate Human Resources Reporting Structure (Reports to Admin)', reassignBtn)}
            
            <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">
              <!-- Direct Report to Admin -->
              <div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid #f59e0b;border-radius:10px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
                <div style="display:flex;align-items:center;gap:14px">
                  <div class="avatar avatar-md" style="background:${Utils.avatarColor(adminManager.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${adminManager.id})">${adminManager.photo ? `<img src="${adminManager.photo}" style="width:100%;height:100%;object-fit:cover" alt="${adminManager.fullName}">` : Utils.avatarInitials(adminManager.fullName)}</div>
                  <div>
                    <div style="display:flex;align-items:center;gap:8px">
                      <span class="badge badge-warning" style="font-size:10.5px"><i class="fa fa-crown"></i> Reports Directly To: Super Admin (CEO)</span>
                    </div>
                    <div style="font-size:16px;font-weight:700;color:var(--primary);margin-top:3px;cursor:pointer" onclick="Employees.renderProfile(${adminManager.id})">${adminManager.fullName}</div>
                    <div style="font-size:12px;color:var(--text-3)">${Utils.getDesigName(adminManager.designationId)} • ${adminManager.email} • ${adminManager.phone}</div>
                  </div>
                </div>
                <div style="text-align:right;max-width:300px">
                  <div style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase">Hierarchical Mandate</div>
                  <div style="font-size:11.5px;color:var(--text-2);margin-top:2px">HR Manager reports directly to Super Admin for corporate governance, executive approvals, and organizational strategy.</div>
                </div>
              </div>

              <!-- HR Scope & Authority Info -->
              <div style="background:var(--surface);border:1px solid var(--border);border-left:4px solid #6366f1;border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
                <div style="font-size:24px;color:#6366f1"><i class="fa fa-shield-halved"></i></div>
                <div style="font-size:12px;color:var(--text-2);line-height:1.5">
                  <strong style="color:var(--text)">Corporate HR Authority:</strong> Sara Malik holds 2nd-level final sign-off power for all employee leave requests, attendance corrections, and initiates annual performance appraisal cycles across all departments.
                </div>
              </div>
            </div>

            <!-- Key Departmental Reporting Lines under HR -->
            <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:18px">
              <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px">
                <i class="fa fa-users" style="color:var(--primary)"></i> Key Departmental Reporting Lines
              </div>
              <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid var(--primary);border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--text)">Deputy Manager (Usman Baig)</div>
                  <div style="font-size:11px;color:var(--text-3)">Reports to both Admin and HR Manager (Sara Malik)</div>
                </div>
                <button class="btn btn-ghost btn-xs" onclick="Employees.renderProfile(3)" title="View Profile"><i class="fa fa-chevron-right"></i></button>
              </div>
            </div>
          `;
        }

        // 3. If viewing Deputy Manager (Usman Baig, ID: 3)
        if (emp.id === 3 || emp.role === 'dept_manager') {
          return `
            ${sectionHeader('Reporting Hierarchy ("Report-to")', 'Dual Reporting Line: Reports to Super Admin & HR Manager both', reassignBtn)}
            
            <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px">
              <!-- Superior 1: Super Admin (CEO) -->
              <div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid #f59e0b;border-radius:10px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
                <div style="display:flex;align-items:center;gap:14px">
                  <div class="avatar avatar-md" style="background:${Utils.avatarColor(adminManager.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${adminManager.id})">${adminManager.photo ? `<img src="${adminManager.photo}" style="width:100%;height:100%;object-fit:cover" alt="${adminManager.fullName}">` : Utils.avatarInitials(adminManager.fullName)}</div>
                  <div>
                    <div style="display:flex;align-items:center;gap:8px">
                      <span class="badge badge-warning" style="font-size:10.5px"><i class="fa fa-crown"></i> Superior 1: CEO / Super Admin</span>
                    </div>
                    <div style="font-size:16px;font-weight:700;color:var(--primary);margin-top:3px;cursor:pointer" onclick="Employees.renderProfile(${adminManager.id})">${adminManager.fullName}</div>
                    <div style="font-size:12px;color:var(--text-3)">${Utils.getDesigName(adminManager.designationId)} • ${adminManager.email} • ${adminManager.phone}</div>
                  </div>
                </div>
                <div style="text-align:right;max-width:280px">
                  <div style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase">Executive Superior</div>
                  <div style="font-size:11.5px;color:var(--text-2);margin-top:2px">Universal sign-off, departmental budget approvals, and executive decisions.</div>
                </div>
              </div>

              <!-- Superior 2: HR Manager -->
              <div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid #6366f1;border-radius:10px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
                <div style="display:flex;align-items:center;gap:14px">
                  <div class="avatar avatar-md" style="background:${Utils.avatarColor(hrManager.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${hrManager.id})">${hrManager.photo ? `<img src="${hrManager.photo}" style="width:100%;height:100%;object-fit:cover" alt="${hrManager.fullName}">` : Utils.avatarInitials(hrManager.fullName)}</div>
                  <div>
                    <div style="display:flex;align-items:center;gap:8px">
                      <span class="badge" style="background:rgba(99,102,241,0.15);color:#6366f1;font-size:10.5px"><i class="fa fa-users-gear"></i> Superior 2: HR Manager</span>
                    </div>
                    <div style="font-size:16px;font-weight:700;color:var(--primary);margin-top:3px;cursor:pointer" onclick="Employees.renderProfile(${hrManager.id})">${hrManager.fullName}</div>
                    <div style="font-size:12px;color:var(--text-3)">${Utils.getDesigName(hrManager.designationId)} • ${hrManager.email} • ${hrManager.phone}</div>
                  </div>
                </div>
                <div style="text-align:right;max-width:280px">
                  <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase">HR Superior</div>
                  <div style="font-size:11.5px;color:var(--text-2);margin-top:2px">Leave quotas, attendance regularization, and appraisal review initiation.</div>
                </div>
              </div>
            </div>

            <!-- Direct Subordinates / 4 Team Members -->
            <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:18px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <div style="font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
                  <i class="fa fa-users-viewfinder" style="color:var(--primary)"></i> Direct Subordinates / Team (${myTeam.length} Employees)
                </div>
                <span class="badge badge-primary">${myTeam.length} Assigned Team Members</span>
              </div>
              <div style="background:rgba(37,99,235,0.05);border:1px dashed var(--primary);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--text-2)">
                <i class="fa fa-circle-info" style="color:var(--primary);margin-right:4px"></i>
                Usman Baig conducts 1st-level approval of Leaves & Attendance Corrections/WFH for these 4 team members, and evaluates their Performance & Skills (PSE) forms.
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:12px">
                ${myTeam.map(t => `
                  <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(t.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${t.id})">${t.photo ? `<img src="${t.photo}" style="width:100%;height:100%;object-fit:cover" alt="${t.fullName}">` : Utils.avatarInitials(t.fullName)}</div>
                    <div style="flex:1;overflow:hidden">
                      <div style="font-weight:700;font-size:13px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;cursor:pointer;color:var(--primary)" onclick="Employees.renderProfile(${t.id})">${t.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(t.designationId)}</div>
                      <div style="font-size:10.5px;color:var(--text-2);font-family:monospace">${t.empNo} • ${Utils.statusBadge(t.status)}</div>
                    </div>
                    <button class="btn btn-ghost btn-xs" onclick="Employees.renderProfile(${t.id})" title="View Profile">
                      <i class="fa fa-chevron-right"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }

        // 4. Standard Employees (Fatima, Tariq, Sehar, Omar, etc.)
        return `
          ${sectionHeader('Reporting Hierarchy ("Report-to")', '3-Tier Supervisory Chain: Direct Manager ➔ HR Manager ➔ Super Admin', reassignBtn)}
          
          <!-- Hierarchical Reporting Chain -->
          <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px">
            
            <!-- Tier 1: Reporting Manager (Deputy Manager) -->
            <div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid var(--primary);border-radius:10px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div style="display:flex;align-items:center;gap:14px">
                <div class="avatar avatar-md" style="background:${Utils.avatarColor(directManager.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${directManager.id})">${directManager.photo ? `<img src="${directManager.photo}" style="width:100%;height:100%;object-fit:cover" alt="${directManager.fullName}">` : Utils.avatarInitials(directManager.fullName)}</div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="badge badge-primary" style="font-size:10.5px"><i class="fa fa-user-tie"></i> Direct Reporting Manager (Tier 1)</span>
                    ${directManager.id === 3 ? `<span class="badge badge-info" style="font-size:10px">Deputy Manager</span>` : ''}
                  </div>
                  <div style="font-size:16px;font-weight:700;color:var(--primary);margin-top:3px;cursor:pointer" onclick="Employees.renderProfile(${directManager.id})">${directManager.fullName}</div>
                  <div style="font-size:12px;color:var(--text-3)">${Utils.getDesigName(directManager.designationId)} • ${directManager.email} • ${directManager.phone}</div>
                </div>
              </div>
              <div style="text-align:right;max-width:280px">
                <div style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase">Approval Authority</div>
                <div style="font-size:11.5px;color:var(--text-2);margin-top:2px">First-level review and sign-off for Leaves, Attendance Corrections, WFH, and Performance Appraisals.</div>
              </div>
            </div>

            <!-- Tier 2: HR Manager -->
            <div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid #6366f1;border-radius:10px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div style="display:flex;align-items:center;gap:14px">
                <div class="avatar avatar-md" style="background:${Utils.avatarColor(hrManager.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${hrManager.id})">${hrManager.photo ? `<img src="${hrManager.photo}" style="width:100%;height:100%;object-fit:cover" alt="${hrManager.fullName}">` : Utils.avatarInitials(hrManager.fullName)}</div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="badge" style="background:rgba(99,102,241,0.15);color:#6366f1;font-size:10.5px"><i class="fa fa-users-gear"></i> Human Resources (Tier 2)</span>
                  </div>
                  <div style="font-size:16px;font-weight:700;color:var(--primary);margin-top:3px;cursor:pointer" onclick="Employees.renderProfile(${hrManager.id})">${hrManager.fullName}</div>
                  <div style="font-size:12px;color:var(--text-3)">${Utils.getDesigName(hrManager.designationId)} • ${hrManager.email} • ${hrManager.phone}</div>
                </div>
              </div>
              <div style="text-align:right;max-width:280px">
                <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase">Corporate HR Oversight</div>
                <div style="font-size:11.5px;color:var(--text-2);margin-top:2px">Direct final approval power across all company personnel, leave quotas, and performance cycles.</div>
              </div>
            </div>

            <!-- Tier 3: CEO / Executive Administrator (Admin) -->
            <div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid #f59e0b;border-radius:10px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div style="display:flex;align-items:center;gap:14px">
                <div class="avatar avatar-md" style="background:${Utils.avatarColor(adminManager.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${adminManager.id})">${adminManager.photo ? `<img src="${adminManager.photo}" style="width:100%;height:100%;object-fit:cover" alt="${adminManager.fullName}">` : Utils.avatarInitials(adminManager.fullName)}</div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="badge badge-warning" style="font-size:10.5px"><i class="fa fa-crown"></i> CEO / Executive Administrator (Tier 3)</span>
                  </div>
                  <div style="font-size:16px;font-weight:700;color:var(--primary);margin-top:3px;cursor:pointer" onclick="Employees.renderProfile(${adminManager.id})">${adminManager.fullName}</div>
                  <div style="font-size:12px;color:var(--text-3)">${Utils.getDesigName(adminManager.designationId)} • ${adminManager.email} • ${adminManager.phone}</div>
                </div>
              </div>
              <div style="text-align:right;max-width:280px">
                <div style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase">Universal Authority</div>
                <div style="font-size:11.5px;color:var(--text-2);margin-top:2px">Complete company-wide authorization to initiate or approve any leave, correction, or appraisal.</div>
              </div>
            </div>
          </div>

          <!-- Direct Subordinates / Team Members (Shown if employee has reportees) -->
          ${myTeam.length > 0 ? `
            <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:18px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <div style="font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
                  <i class="fa fa-users-viewfinder" style="color:var(--primary)"></i> Direct Subordinates / Team (${myTeam.length} Employees)
                </div>
                <span class="badge badge-primary">${myTeam.length} Assigned Reportees</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:12px">
                ${myTeam.map(t => `
                  <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(t.id)};overflow:hidden;cursor:pointer" onclick="Employees.renderProfile(${t.id})">${t.photo ? `<img src="${t.photo}" style="width:100%;height:100%;object-fit:cover" alt="${t.fullName}">` : Utils.avatarInitials(t.fullName)}</div>
                    <div style="flex:1;overflow:hidden">
                      <div style="font-weight:700;font-size:13px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;cursor:pointer;color:var(--primary)" onclick="Employees.renderProfile(${t.id})">${t.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(t.designationId)}</div>
                      <div style="font-size:10.5px;color:var(--text-2)">${Utils.statusBadge(t.status)}</div>
                    </div>
                    <button class="btn btn-ghost btn-xs" onclick="Employees.renderProfile(${t.id})" title="View Profile">
                      <i class="fa fa-chevron-right"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        `;
      }

      case 'mis-info': {
        return `
          ${sectionHeader('Management Information System (MIS) Details', 'Hardware biometric mapping, ERP cost centers and accounting codes', '')}
          <div>
            ${row('Biometric User ID', `BIO-${1000 + emp.id}`, 'fa-fingerprint')}
            ${row('ERP Cost Center Code', `CC-ENG-0${emp.departmentId || 1}`, 'fa-money-check')}
            ${row('Operating Division', 'Engineering & Enterprise Solutions', 'fa-diagram-project')}
            ${row('Internal Cost Code', `ERP-PK-${String(emp.id).padStart(3,'0')}`, 'fa-barcode')}
            ${row('Main Turnstile Machine', 'Station #01 (Main Head Office Turnstile Gate)', 'fa-door-open')}
          </div>
        `;
      }

      case 'login-info': {
        const users = DB.get('users') || [];
        const user = users.find(u => u.employeeId === emp.id);
        const currentRole = emp.role || user?.role || 'employee';

        return `
          ${sectionHeader('Login Credentials & Role Authorization', 'System credentials, role governance and security access policies', '')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                <i class="fa fa-shield-halved" style="color:var(--primary)"></i> User Account Credentials
              </div>
              ${row('Username', user ? `<span style="font-family:monospace;font-weight:700">${user.username}</span>` : 'No Login Linked', 'fa-user')}
              ${row('Assigned Role', Employees.getRoleBadge(currentRole), 'fa-user-shield')}
              ${row('Account Status', user ? `<span class="badge ${user.status==='active'?'badge-success':'badge-danger'}">${user.status.toUpperCase()}</span>` : '—', 'fa-toggle-on')}
              ${row('Last Sign-In', user?.lastLogin ? Utils.formatDate(user.lastLogin) : 'Never Logged In', 'fa-clock')}
            </div>
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">
                  <i class="fa fa-key" style="color:var(--primary);margin-right:6px"></i> Security & Role Operations
                </div>
                <div style="font-size:12px;color:var(--text-3);line-height:1.5">
                  Administrative controls allow resetting credentials, rotating passwords, or upgrading permissions.
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
                ${isHR ? `
                  <button class="btn btn-primary btn-sm w-full" onclick="Employees.showAssignRoleModal(${emp.id})">
                    <i class="fa fa-user-shield"></i> Assign / Change Role
                  </button>
                  ${user ? `
                    <button class="btn btn-secondary btn-sm w-full" onclick="Employees.showManageLoginModal(${emp.id})">
                      <i class="fa fa-key"></i> Manage Password & Credentials
                    </button>
                  ` : `
                    <button class="btn btn-secondary btn-sm w-full" onclick="Employees.createLoginForEmployee(${emp.id})">
                      <i class="fa fa-user-plus"></i> Generate Login Credentials
                    </button>
                  `}
                ` : `
                  <div style="font-size:11.5px;color:var(--text-muted);background:var(--card);padding:10px;border-radius:6px;border:1px dashed var(--border)">
                    <i class="fa fa-lock" style="margin-right:4px"></i> Managed centrally by HR Administration.
                  </div>
                `}
              </div>
            </div>
          </div>
        `;
      }

      case 'bank-accounts': {
        return `
          ${sectionHeader('Bank Accounts & Salary Disbursement', 'Direct bank deposit information and international IBAN', '')}
          <div>
            ${row('Bank Name', emp.bankName || 'Habib Bank Limited (HBL)', 'fa-building-columns')}
            ${row('Account Title', emp.fullName, 'fa-user')}
            ${row('Account Number', emp.accountNo || '1234567890123', 'fa-money-bill-transfer')}
            ${row('IBAN', emp.iban || 'PK36HABB0000001123456702', 'fa-hashtag')}
            ${row('Branch Name & Code', 'Corporate Main Branch (0421)', 'fa-location-dot')}
            ${row('Disbursement Mode', 'Direct Electronic Funds Transfer via 1-Link', 'fa-bolt')}
          </div>
        `;
      }

      case 'tax-info': {
        const annualSal = (emp.salary || 65000) * 12;
        const estTax = Math.round(annualSal * 0.05);
        return `
          ${sectionHeader('Taxation & FBR Details', 'National Tax identification, active filer status and deduction bracket', '')}
          <div>
            ${row('National Tax Number (NTN)', `${4000000 + emp.id * 137}-7`, 'fa-receipt')}
            ${row('FBR Filer Status', '<span class="badge badge-success"><i class="fa fa-circle-check"></i> Active Tax Filer</span>', 'fa-check')}
            ${row('Income Tax Slab', 'FBR Salaried Slab 2 (5% after basic threshold)', 'fa-scale-balanced')}
            ${row('Standard Allowances', 'Medical Allowance (10%) & Conveyance Allowance (Exempt)', 'fa-shield-halved')}
            ${row('Estimated Annual Tax Deducted', Utils.formatCurrency(estTax), 'fa-money-bill-wave')}
          </div>
        `;
      }

      case 'insurance-details': {
        const isExec = emp.role === 'superadmin' || emp.role === 'dept_manager' || emp.role === 'hr_manager';
        return `
          ${sectionHeader('Corporate Health & Life Insurance', 'Hospitalization coverage, health policy limits and insured family members', '')}
          <div>
            ${row('Insurance Policy Number', `JUB-CORP-${String(88000 + emp.id)}`, 'fa-file-shield')}
            ${row('Insurance Provider', 'Jubilee Life & Health Insurance Co.', 'fa-hospital')}
            ${row('Policy Tier', isExec ? '<span class="badge badge-warning">Executive Platinum Tier</span>' : '<span class="badge badge-primary">Corporate Gold Tier</span>', 'fa-award')}
            ${row('In-Patient Hospitalization Limit', 'PKR 1,500,000 / annum', 'fa-bed-pulse')}
            ${row('Out-Patient (OPD) Benefit Limit', 'PKR 50,000 / annum', 'fa-stethoscope')}
            ${row('Dependants Insured', emp.maritalStatus === 'Married' ? 'Spouse + 2 Children (Full Coverage)' : 'Self Only (Single)', 'fa-users')}
            ${row('Panel Hospital Network Access', 'Access to 400+ cashless panel hospitals nationwide', 'fa-network-wired')}
          </div>
        `;
      }

      // ═════════════════════════════════════════════════════
      // 3. QUALIFICATION (6 Sub-buttons)
      // ═════════════════════════════════════════════════════
      case 'personal-documents': {
        return this.renderProfileTab('Documents', emp);
      }

      case 'work-experience': {
        return this.renderProfileTab('Experience', emp);
      }

      case 'education': {
        return this.renderProfileTab('Qualification', emp);
      }

      case 'skills': {
        const skillsList = emp.skillsList || [
          { name: 'Technical Architecture & Coding', pct: 90, cat: 'Technical' },
          { name: 'Problem Solving & Debugging', pct: 85, cat: 'Technical' },
          { name: 'Agile Team Collaboration', pct: 80, cat: 'Management' },
          { name: 'Quality Assurance & Delivery', pct: 85, cat: 'Technical' }
        ];
        return `
          ${sectionHeader('Skills & Core Competencies', 'Technical proficiencies, operational capabilities and soft skills', '')}
          <div style="display:flex;flex-direction:column;gap:14px">
            ${skillsList.map(s => `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                  <span style="font-weight:600;font-size:13.5px">${s.name} <span class="chip" style="margin-left:6px">${s.cat}</span></span>
                  <span style="font-weight:700;color:var(--primary);font-size:13px">${s.pct}%</span>
                </div>
                <div class="progress" style="height:7px"><div class="progress-bar" style="width:${s.pct}%;background:var(--primary)"></div></div>
              </div>
            `).join('')}
          </div>
        `;
      }

      case 'working-technologies': {
        const techs = emp.technologies || ['React', 'Node.js', 'PostgreSQL', 'Git', 'Docker', 'REST APIs'];
        const addBtn = `<button class="btn btn-primary btn-sm" onclick="Employees.showAddTechnologyModal(${emp.id})"><i class="fa fa-plus"></i> Add Technology</button>`;
        return `
          ${sectionHeader('Working Technologies & Stacks', 'Development frameworks, tools, libraries and databases utilized', addBtn)}
          <div style="display:flex;flex-wrap:wrap;gap:10px">
            ${techs.map(t => `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 16px;display:flex;align-items:center;gap:8px;font-weight:600;font-size:13px">
                <i class="fa fa-layer-group" style="color:var(--primary)"></i>
                <span>${t}</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      case 'languages': {
        const langs = emp.languages || [
          { language: 'English', proficiency: 'Professional / Fluent' },
          { language: 'Urdu', proficiency: 'Native / Mother Tongue' }
        ];
        const addBtn = `<button class="btn btn-primary btn-sm" onclick="Employees.showAddLanguageModal(${emp.id})"><i class="fa fa-plus"></i> Add Language</button>`;
        return `
          ${sectionHeader('Language Proficiencies', 'Spoken and written languages for corporate communications', addBtn)}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            ${langs.map(l => `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-weight:700;font-size:14px"><i class="fa fa-language" style="color:var(--primary);margin-right:6px"></i>${l.language}</div>
                  <div style="font-size:12px;color:var(--text-3);margin-top:2px">${l.proficiency}</div>
                </div>
                <span class="badge badge-primary">Verified</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      // ═════════════════════════════════════════════════════
      // 4. PERFORMANCE REVIEW (4 Sub-buttons)
      // ═════════════════════════════════════════════════════
      case 'performance-review': {
        const initBtn = isHR ? `<button class="btn btn-primary btn-sm" onclick="Performance.showAddReview()"><i class="fa fa-plus"></i> Initiate Performance Review</button>` : '';
        return `
          ${sectionHeader('Performance Review Summary', 'Historical evaluation cycles, overall ratings and appraisal history', initBtn)}
          <div style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(16,185,129,0.06));border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase">Annual Evaluation Score 2026</div>
              <div style="font-size:28px;font-weight:800;color:var(--text);margin-top:4px">
                ★ 4.2 <span style="font-size:14px;color:var(--text-3);font-weight:500">/ 5.0 (Exceeds Expectations)</span>
              </div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px">Evaluated by Direct Reporting Manager & Approved by Corporate HR</div>
            </div>
            <div style="display:flex;gap:10px">
              <span class="badge badge-success" style="font-size:12px;padding:6px 14px"><i class="fa fa-circle-check"></i> Eligible for Annual Increment</span>
            </div>
          </div>
          ${this.renderProfileTab('Performance', emp)}
        `;
      }

      case 'employee-review-comments': {
        const pse = emp.pseEvaluation || {};
        return `
          ${sectionHeader('Employee Review Comments', 'Employee self-assessment commentary, accomplishments, challenges and growth aspirations', '')}
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-weight:700;font-size:13.5px;color:var(--text);margin-bottom:6px">
                <i class="fa fa-quote-left" style="color:var(--primary);margin-right:6px"></i> Key Accomplishments & Deliverables
              </div>
              <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin:0">
                ${pse.employeeComments || 'Successfully delivered all major sprint milestones on schedule, spearheaded component modularization, and actively resolved production incidents.'}
              </p>
            </div>
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-weight:700;font-size:13.5px;color:var(--text);margin-bottom:6px">
                <i class="fa fa-compass" style="color:var(--primary);margin-right:6px"></i> Career Development & Growth Aspirations
              </div>
              <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin:0">
                Seeking to expand leadership responsibilities in architecture and system scalability while mentoring incoming junior engineers.
              </p>
            </div>
          </div>
        `;
      }

      case 'pse-evaluation-form': {
        const pse = emp.pseEvaluation || {
          jobKnowledge: 4, workQuality: 5, teamwork: 4, punctuality: 4, leadership: 4,
          overallScore: '4.2 / 5.0',
          managerComments: 'Consistent high performer with strong initiative and collaborative team mindset.',
          evaluatedBy: 'Usman Baig (Deputy Manager)',
          evaluatedDate: '2026-08-30'
        };
        const canSubmit = isHR || isMgr || (Auth.employee?.id === emp.managerId);
        const evalBtn = canSubmit ? `<button class="btn btn-primary btn-sm" onclick="Employees.showEditPSEModal(${emp.id})"><i class="fa fa-pen-to-square"></i> Evaluate & Submit PSE Review</button>` : '';

        return `
          ${sectionHeader('Performance & Skills Evaluation (PSE) Form', '5 Core Competencies evaluated by Direct Reporting Manager', evalBtn)}
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">
            ${[
              { label: '1. Job Knowledge & Technical Competence', score: pse.jobKnowledge || 4, desc: 'Mastery of technical tools, system design and domain knowledge.' },
              { label: '2. Quality of Work & Delivery Accuracy', score: pse.workQuality || 5, desc: 'Thoroughness, minimal defects, adherence to specifications.' },
              { label: '3. Teamwork, Collaboration & Communication', score: pse.teamwork || 4, desc: 'Cross-functional cooperation, timely updates and helpfulness.' },
              { label: '4. Punctuality, Discipline & Dependability', score: pse.punctuality || 4, desc: 'Regular attendance, schedule adherence and reliability under pressure.' },
              { label: '5. Leadership, Initiative & Problem Solving', score: pse.leadership || 4, desc: 'Proactive ownership, mentoring and creative problem resolution.' },
            ].map(c => `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                  <div style="font-weight:700;font-size:13px">${c.label}</div>
                  <div style="font-weight:800;color:var(--primary);font-size:14px">${c.score} / 5</div>
                </div>
                <div style="font-size:11.5px;color:var(--text-3);margin-bottom:8px">${c.desc}</div>
                <div class="progress" style="height:7px"><div class="progress-bar" style="width:${(c.score/5)*100}%;background:var(--primary)"></div></div>
              </div>
            `).join('')}
          </div>

          <!-- Manager's Narrative Feedback -->
          <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:16px">
            <div style="font-weight:700;font-size:13.5px;color:var(--text);margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <i class="fa fa-comment-dots" style="color:var(--primary)"></i> Reporting Manager Evaluation Remarks
            </div>
            <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin:0;margin-bottom:10px">
              ${pse.managerComments || 'Demonstrates solid initiative and reliable execution throughout the review period.'}
            </p>
            <div style="font-size:11.5px;color:var(--text-3);border-top:1px dashed var(--border);padding-top:8px">
              Evaluated by: <strong>${pse.evaluatedBy || 'Usman Baig (Deputy Manager)'}</strong> • Evaluation Date: ${pse.evaluatedDate || Utils.today()}
            </div>
          </div>
        `;
      }

      case 'next-year-targets': {
        const targets = emp.nextYearTargets || [
          { target: 'Achieve 98% on-time sprint task delivery', metric: 'Sprint Velocity', weight: '40%', timeline: 'Q1-Q4' },
          { target: 'Complete advanced certification in core technology', metric: 'Certification', weight: '30%', timeline: 'Q3' },
          { target: 'Mentor junior team members and conduct code reviews', metric: 'Code Quality', weight: '30%', timeline: 'Ongoing' }
        ];
        const addBtn = `<button class="btn btn-primary btn-sm" onclick="Employees.showAddTargetModal(${emp.id})"><i class="fa fa-plus"></i> Add Target / Goal</button>`;
        return `
          ${sectionHeader('Next Year Targets & Objectives (OKRs)', 'Strategic goals, KPI metrics and measurable deliverables agreed with manager', addBtn)}
          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Target Objective</th>
                  <th>Key Performance Metric</th>
                  <th>Weight</th>
                  <th>Timeline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${targets.map(t => `
                  <tr>
                    <td style="font-weight:600">${t.target}</td>
                    <td><span class="chip">${t.metric}</span></td>
                    <td><strong>${t.weight}</strong></td>
                    <td>${t.timeline}</td>
                    <td><span class="badge badge-info"><i class="fa fa-spinner"></i> In Progress</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      // ═════════════════════════════════════════════════════
      // 5. ATTENDANCE (1 Sub-button: Correction & WFH)
      // ═════════════════════════════════════════════════════
      case 'attendance-correction': {
        const allCorr = DB.get('attendance_corrections') || [];
        const myCorr = allCorr.filter(c => c.employeeId === emp.id);
        const addBtn = `<button class="btn btn-primary btn-sm" onclick="Employees.showApplyCorrectionModal(${emp.id})"><i class="fa fa-plus"></i> Apply for Correction / WFH</button>`;

        const pendingCount = myCorr.filter(c => c.status === 'pending' || c.status === 'manager_approved').length;
        const approvedCount = myCorr.filter(c => c.status === 'approved').length;

        return `
          ${sectionHeader('Attendance Correction / Work From Home', 'Submit punch corrections, biometric resolution or remote working requests', addBtn)}
          
          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:20px">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
              <div style="font-size:22px;font-weight:800;color:var(--text)">${myCorr.length}</div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:600">Total Requests</div>
            </div>
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
              <div style="font-size:22px;font-weight:800;color:var(--warning)">${pendingCount}</div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:600">Pending Review</div>
            </div>
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
              <div style="font-size:22px;font-weight:800;color:var(--success)">${approvedCount}</div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:600">Approved & Synced</div>
            </div>
          </div>

          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Request Type</th>
                  <th>Requested Times</th>
                  <th>Reason / Justification</th>
                  <th>Approval Status</th>
                  <th>Review Action</th>
                </tr>
              </thead>
              <tbody>
                ${myCorr.length === 0 ? `
                  <tr><td colspan="6"><div class="empty-state" style="padding:30px"><i class="fa fa-clock-rotate-left"></i><h3>No Correction or WFH Requests</h3><p>Click "Apply for Correction / WFH" to submit a new request.</p></div></td></tr>
                ` : myCorr.map(c => {
                  const isPendingManager = c.status === 'pending';
                  const isManagerApproved = c.status === 'manager_approved';
                  const isApproved = c.status === 'approved';
                  const isRejected = c.status === 'rejected';

                  let statusBadge = '';
                  if (isPendingManager) statusBadge = `<span class="badge badge-warning" style="font-size:11px"><i class="fa fa-clock"></i> Pending Manager</span>`;
                  else if (isManagerApproved) statusBadge = `<span class="badge badge-info" style="font-size:11px"><i class="fa fa-user-check"></i> Manager Approved (Awaiting HR)</span>`;
                  else if (isApproved) statusBadge = `<span class="badge badge-success" style="font-size:11px"><i class="fa fa-check-double"></i> Approved & Synced</span>`;
                  else if (isRejected) statusBadge = `<span class="badge badge-danger" style="font-size:11px"><i class="fa fa-times"></i> Rejected</span>`;

                  // Actions: Deputy Manager approves tier 1; HR/Admin approves universal
                  const canManagerApprove = (Auth.role === 'dept_manager' && isPendingManager);
                  const canHRApprove = (isHR && (isPendingManager || isManagerApproved));

                  return `
                    <tr>
                      <td style="font-weight:600">${Utils.formatDate(c.date)}</td>
                      <td>
                        <span class="badge" style="background:${c.type==='work_from_home'?'rgba(139,92,246,0.15)':'rgba(2,132,199,0.15)'};color:${c.type==='work_from_home'?'#8b5cf6':'#0284c7'}">
                          <i class="fa ${c.type==='work_from_home'?'fa-house-laptop':'fa-clock'}"></i> ${c.type==='work_from_home'?'Work From Home':'Attendance Correction'}
                        </span>
                      </td>
                      <td><strong>${c.timeIn || '09:00'} – ${c.timeOut || '18:00'}</strong></td>
                      <td style="max-width:200px;font-size:12px">${c.reason}</td>
                      <td>${statusBadge}</td>
                      <td>
                        <div style="display:flex;gap:4px">
                          ${canManagerApprove ? `
                            <button class="btn btn-success btn-xs" onclick="Employees.approveCorrection(${c.id}, 'manager', ${emp.id})" title="Manager 1st Level Approval">
                              <i class="fa fa-check"></i> Approve
                            </button>
                            <button class="btn btn-danger btn-xs" onclick="Employees.rejectCorrection(${c.id}, ${emp.id})" title="Reject Request">
                              <i class="fa fa-times"></i>
                            </button>
                          ` : ''}
                          ${canHRApprove ? `
                            <button class="btn btn-success btn-xs" onclick="Employees.approveCorrection(${c.id}, 'final', ${emp.id})" title="HR/Admin Final Approval">
                              <i class="fa fa-check-double"></i> Final Approve
                            </button>
                            <button class="btn btn-danger btn-xs" onclick="Employees.rejectCorrection(${c.id}, ${emp.id})" title="Reject Request">
                              <i class="fa fa-times"></i>
                            </button>
                          ` : ''}
                          ${(!canManagerApprove && !canHRApprove) ? `<span style="font-size:11px;color:var(--text-3)"><i class="fa fa-shield"></i> Recorded</span>` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      default: {
        return `<div class="empty-state" style="padding:40px"><i class="fa fa-file-circle-question"></i><h3>Section View</h3><p>Details for this view.</p></div>`;
      }
    }
  },

  // ═════════════════════════════════════════════════════════
  // MODAL HANDLERS & PROFILE ACTIONS
  // ═════════════════════════════════════════════════════════
  toggleLunchSubscription(empId) {
    const emps = DB.get('employees') || [];
    const emp = emps.find(e => e.id === empId);
    if (!emp) return;
    if (!emp.lunchSubscription) emp.lunchSubscription = {};
    emp.lunchSubscription.subscribed = !emp.lunchSubscription.subscribed;
    DB.set('employees', emps);
    Toast.show(`Lunch subscription ${emp.lunchSubscription.subscribed ? 'activated' : 'deactivated'}!`, 'success');
    this.switchProfileSection('lunch-subscription', null, empId);
  },

  showAddTechnologyModal(empId) {
    Modal.show('Add Working Technology', `
      <div class="form-group">
        <label class="form-label required">Technology / Framework Name</label>
        <input class="form-control" id="tech-input" placeholder="e.g. Next.js, Python, Flutter, Kubernetes">
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveTechnology(${empId})">Add Technology</button>
      `
    });
  },
  saveTechnology(empId) {
    const val = document.getElementById('tech-input')?.value.trim();
    if (!val) { Toast.show('Technology name is required', 'error'); return; }
    const emps = DB.get('employees') || [];
    const emp = emps.find(e => e.id === empId);
    if (emp) {
      if (!emp.technologies) emp.technologies = [];
      if (!emp.technologies.includes(val)) emp.technologies.push(val);
      DB.set('employees', emps);
    }
    Modal.close('dynamic-modal');
    Toast.show('Technology added!', 'success');
    this.switchProfileSection('working-technologies', null, empId);
  },

  showAddLanguageModal(empId) {
    Modal.show('Add Language Proficiency', `
      <div class="form-group">
        <label class="form-label required">Language</label>
        <input class="form-control" id="lang-input" placeholder="e.g. Arabic, French, German">
      </div>
      <div class="form-group">
        <label class="form-label required">Proficiency Level</label>
        <select class="form-control" id="lang-prof">
          <option>Native / Mother Tongue</option>
          <option>Professional / Fluent</option>
          <option>Intermediate Working</option>
          <option>Elementary</option>
        </select>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveLanguage(${empId})">Save Language</button>
      `
    });
  },
  saveLanguage(empId) {
    const lang = document.getElementById('lang-input')?.value.trim();
    const prof = document.getElementById('lang-prof')?.value;
    if (!lang) { Toast.show('Language is required', 'error'); return; }
    const emps = DB.get('employees') || [];
    const emp = emps.find(e => e.id === empId);
    if (emp) {
      if (!emp.languages) emp.languages = [];
      emp.languages.push({ language: lang, proficiency: prof });
      DB.set('employees', emps);
    }
    Modal.close('dynamic-modal');
    Toast.show('Language added!', 'success');
    this.switchProfileSection('languages', null, empId);
  },

  showAddTargetModal(empId) {
    Modal.show('Add Next Year Target / Goal', `
      <div class="form-group">
        <label class="form-label required">Target Objective</label>
        <textarea class="form-control" id="target-desc" rows="2" placeholder="e.g. Deploy zero-downtime CI/CD pipeline"></textarea>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Metric</label>
          <input class="form-control" id="target-metric" placeholder="e.g. Deployment Frequency">
        </div>
        <div class="form-group">
          <label class="form-label required">Weight (%)</label>
          <input class="form-control" id="target-weight" placeholder="e.g. 25%">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Timeline</label>
        <input class="form-control" id="target-timeline" placeholder="e.g. Q3 2026">
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveTarget(${empId})">Save Target</button>
      `
    });
  },
  saveTarget(empId) {
    const desc = document.getElementById('target-desc')?.value.trim();
    const metric = document.getElementById('target-metric')?.value.trim();
    const weight = document.getElementById('target-weight')?.value.trim() || '20%';
    const timeline = document.getElementById('target-timeline')?.value.trim() || 'Q4';
    if (!desc || !metric) { Toast.show('Please fill required target fields', 'error'); return; }
    const emps = DB.get('employees') || [];
    const emp = emps.find(e => e.id === empId);
    if (emp) {
      if (!emp.nextYearTargets) emp.nextYearTargets = [];
      emp.nextYearTargets.push({ target: desc, metric, weight, timeline });
      DB.set('employees', emps);
    }
    Modal.close('dynamic-modal');
    Toast.show('Target added to review targets!', 'success');
    this.switchProfileSection('next-year-targets', null, empId);
  },

  showEditPSEModal(empId) {
    const emp = DB.find('employees', empId);
    const pse = emp?.pseEvaluation || {};
    Modal.show('Evaluate Performance & Skills (PSE Form)', `
      <div style="font-size:12.5px;color:var(--text-3);margin-bottom:14px">
        Reporting Manager appraisal for <strong>${emp?.fullName}</strong>. Rate competencies from 1 to 5.
      </div>
      <div class="form-group">
        <label class="form-label required">1. Job Knowledge & Technical Competence (1-5)</label>
        <select class="form-control" id="pse-k1">
          ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.jobKnowledge==n?'selected':''}>${n} Star${n>1?'s':''} - ${n===5?'Outstanding':(n===4?'Exceeds Expectations':(n===3?'Meets Requirements':'Needs Improvement'))}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">2. Quality of Work & Delivery Accuracy (1-5)</label>
        <select class="form-control" id="pse-k2">
          ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.workQuality==n?'selected':''}>${n} Star${n>1?'s':''}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">3. Teamwork & Communication (1-5)</label>
        <select class="form-control" id="pse-k3">
          ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.teamwork==n?'selected':''}>${n} Star${n>1?'s':''}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">4. Punctuality & Discipline (1-5)</label>
        <select class="form-control" id="pse-k4">
          ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.punctuality==n?'selected':''}>${n} Star${n>1?'s':''}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">5. Leadership & Initiative (1-5)</label>
        <select class="form-control" id="pse-k5">
          ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.leadership==n?'selected':''}>${n} Star${n>1?'s':''}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Manager Review Comments & Recommendation</label>
        <textarea class="form-control" id="pse-comments" rows="3">${pse.managerComments || ''}</textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.savePSE(${empId})">Submit Performance Review</button>
      `
    });
  },
  savePSE(empId) {
    const k1 = parseInt(document.getElementById('pse-k1')?.value || 4);
    const k2 = parseInt(document.getElementById('pse-k2')?.value || 4);
    const k3 = parseInt(document.getElementById('pse-k3')?.value || 4);
    const k4 = parseInt(document.getElementById('pse-k4')?.value || 4);
    const k5 = parseInt(document.getElementById('pse-k5')?.value || 4);
    const comments = document.getElementById('pse-comments')?.value.trim() || 'Performance reviewed by manager.';

    const avg = ((k1+k2+k3+k4+k5)/5).toFixed(1);

    const emps = DB.get('employees') || [];
    const emp = emps.find(e => e.id === empId);
    if (emp) {
      emp.pseEvaluation = {
        jobKnowledge: k1,
        workQuality: k2,
        teamwork: k3,
        punctuality: k4,
        leadership: k5,
        overallScore: `${avg} / 5.0`,
        managerComments: comments,
        evaluatedBy: `${Auth.employee?.fullName || 'Usman Baig'} (${Auth.role === 'dept_manager' ? 'Deputy Manager' : 'HR/Admin'})`,
        evaluatedDate: Utils.today()
      };
      DB.set('employees', emps);
    }
    Modal.close('dynamic-modal');
    Toast.show('Performance Review submitted by manager!', 'success');
    this.switchProfileSection('pse-evaluation-form', null, empId);
  },

  showUploadPhotoModal(empId) {
    Modal.show('Upload Photograph', `
      <div class="form-group">
        <label class="form-label">Photo Image URL or Base64 Data</label>
        <input class="form-control" id="photo-url-input" placeholder="https://example.com/photo.jpg or paste data:image/...">
      </div>
      <div style="font-size:12px;color:var(--text-3);margin-bottom:12px">
        Or select a picture from your computer:
      </div>
      <input type="file" id="photo-file-input" accept="image/*" class="form-control" onchange="Employees.onPhotoFilePicked(event)">
      <div id="photo-file-preview" style="margin-top:14px;text-align:center"></div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.savePhoto(${empId})">Save Photograph</button>
      `
    });
  },
  onPhotoFilePicked(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        window._tempPhotoData = e.target.result;
        const prev = document.getElementById('photo-file-preview');
        if (prev) prev.innerHTML = `<img src="${e.target.result}" style="width:100px;height:120px;object-fit:cover;border:2px solid var(--primary);border-radius:6px">`;
      };
      reader.readAsDataURL(file);
    }
  },
  savePhoto(empId) {
    const url = document.getElementById('photo-url-input')?.value.trim();
    const photo = window._tempPhotoData || url;
    if (!photo) { Toast.show('Please select or enter a photo', 'error'); return; }
    const emps = DB.get('employees') || [];
    const emp = emps.find(e => e.id === empId);
    if (emp) {
      emp.photo = photo;
      DB.set('employees', emps);
    }
    window._tempPhotoData = null;
    Modal.close('dynamic-modal');
    Toast.show('Photograph updated successfully!', 'success');
    this.renderProfile(empId);
  },

  showReassignManagerModal(empId) {
    const emps = DB.get('employees') || [];
    const targetEmp = emps.find(e => e.id === empId);
    const candidateManagers = emps.filter(e => e.id !== empId && e.status === 'active');

    Modal.show('Reassign Reporting Manager', `
      <div class="form-group">
        <label class="form-label required">Select Reporting Manager for ${targetEmp?.fullName}</label>
        <select class="form-control" id="reassign-mgr-select">
          ${candidateManagers.map(m => `
            <option value="${m.id}" ${targetEmp?.managerId === m.id ? 'selected' : ''}>
              ${m.fullName} (${Utils.getDesigName(m.designationId)} • ${m.role})
            </option>
          `).join('')}
        </select>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveReassignedManager(${empId})">Save Manager</button>
      `
    });
  },
  saveReassignedManager(empId) {
    const newMgrId = parseInt(document.getElementById('reassign-mgr-select')?.value);
    const emps = DB.get('employees') || [];
    const targetEmp = emps.find(e => e.id === empId);
    if (targetEmp && newMgrId) {
      targetEmp.managerId = newMgrId;
      targetEmp.reportingTo = newMgrId;
      DB.set('employees', emps);
      Toast.show('Reporting line updated!', 'success');
    }
    Modal.close('dynamic-modal');
    this.switchProfileSection('report-to', null, empId);
  },

  showApplyCorrectionModal(empId) {
    Modal.show('Apply for Attendance Correction / Work From Home', `
      <div class="form-group">
        <label class="form-label required">Request Type</label>
        <select class="form-control" id="ac-type">
          <option value="attendance_correction">Attendance Correction (Punch-In/Out Adjustment)</option>
          <option value="work_from_home">Work From Home (Remote Working Day)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Date</label>
        <input class="form-control" id="ac-date" type="date" value="${Utils.today()}">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Requested Time In</label>
          <input class="form-control" id="ac-in" type="time" value="09:00">
        </div>
        <div class="form-group">
          <label class="form-label required">Requested Time Out</label>
          <input class="form-control" id="ac-out" type="time" value="18:00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Reason / Justification</label>
        <textarea class="form-control" id="ac-reason" rows="3" placeholder="Explain the reason (e.g., biometric fingerprint failure, urgent remote day, off-site client work)..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveAttendanceCorrection(${empId})">Submit Request</button>
      `
    });
  },
  saveAttendanceCorrection(empId) {
    const type = document.getElementById('ac-type')?.value;
    const date = document.getElementById('ac-date')?.value;
    const timeIn = document.getElementById('ac-in')?.value;
    const timeOut = document.getElementById('ac-out')?.value;
    const reason = document.getElementById('ac-reason')?.value.trim();

    if (!date || !timeIn || !timeOut || !reason) {
      Toast.show('Please fill in all required fields', 'error');
      return;
    }

    const emp = DB.find('employees', empId);
    const corrections = DB.get('attendance_corrections') || [];
    const newId = DB.nextId('attendance_corrections');

    corrections.unshift({
      id: newId,
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
    });

    DB.set('attendance_corrections', corrections);
    Modal.close('dynamic-modal');
    Toast.show('Request submitted successfully!', 'success', 'Forwarded to Reporting Manager for 1st-level approval.');
    this.switchProfileSection('attendance-correction', null, empId);
  },

  approveCorrection(corrId, tier, empId) {
    const corrections = DB.get('attendance_corrections') || [];
    const req = corrections.find(c => c.id === corrId);
    if (!req) return;

    if (tier === 'manager') {
      req.status = 'manager_approved';
      req.managerStatus = 'approved';
      req.managerApprovedAt = new Date().toISOString();
      req.managerRemarks = `Approved by Deputy Manager (${Auth.employee?.fullName || 'Usman Baig'})`;
      DB.set('attendance_corrections', corrections);
      Toast.show('1st-Level Manager Approval recorded!', 'success', 'Forwarded to HR/Admin for final sign-off.');
    } else {
      // Final / HR / Admin approval
      req.status = 'approved';
      req.hrStatus = 'approved';
      req.hrApprovedAt = new Date().toISOString();
      req.hrRemarks = `Approved by Corporate Admin/HR (${Auth.employee?.fullName || 'Admin'})`;
      DB.set('attendance_corrections', corrections);

      // Automatically sync/update actual attendance ledger!
      const att = DB.get('attendance') || [];
      let attRecord = att.find(a => a.employeeId === req.employeeId && a.date === req.date);
      if (attRecord) {
        attRecord.timeIn = req.timeIn;
        attRecord.timeOut = req.timeOut;
        attRecord.status = 'present';
        attRecord.remarks = `Corrected via Request #${req.id} (${req.type==='work_from_home'?'WFH':'Correction'})`;
      } else {
        att.push({
          id: DB.nextId('attendance'),
          employeeId: req.employeeId,
          date: req.date,
          timeIn: req.timeIn,
          timeOut: req.timeOut,
          status: 'present',
          overtime: 0,
          remarks: `Approved ${req.type==='work_from_home'?'WFH':'Correction'} #${req.id}`
        });
      }
      DB.set('attendance', att);
      Toast.show('Request fully approved and synced to attendance ledger!', 'success');
    }

    this.switchProfileSection('attendance-correction', null, empId || req.employeeId);
  },

  rejectCorrection(corrId, empId) {
    Modal.confirm('Reject Request', 'Are you sure you want to reject this correction/WFH request?', () => {
      const corrections = DB.get('attendance_corrections') || [];
      const req = corrections.find(c => c.id === corrId);
      if (req) {
        req.status = 'rejected';
        DB.set('attendance_corrections', corrections);
        Toast.show('Request rejected.', 'warning');
      }
      Employees.switchProfileSection('attendance-correction', null, empId || req?.employeeId);
    });
  },

  renderProfileTab(tab, emp) {
    const row = (label, val) => `
      <div style="display:flex;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:180px;font-size:12.5px;color:var(--text-3);font-weight:500;flex-shrink:0">${label}</div>
        <div style="font-size:13px;color:var(--text)">${val || '—'}</div>
      </div>
    `;

    switch(tab) {
      case 'Personal': return `
        ${row('Full Name', emp.fullName)}
        ${row('Date of Birth', Utils.formatDate(emp.dob))}
        ${row('Age', Utils.getAge(emp.dob) + ' years')}
        ${row('Gender', emp.gender)}
        ${row('Marital Status', emp.maritalStatus)}
        ${row('CNIC', emp.cnic)}
        ${row('Blood Group', emp.bloodGroup)}
        ${row('Nationality', emp.nationality)}
        ${row('Religion', emp.religion)}
        ${row('Address', emp.address)}
      `;
      case 'Contact': return `
        ${row('Email', emp.email)}
        ${row('Phone', emp.phone)}
        ${row('Address', emp.address)}
        ${row('Bank Name', emp.bankName)}
        ${row('Account No.', emp.accountNo)}
        ${row('IBAN', emp.iban)}
      `;
      case 'Emergency Contact': return `
        ${row('Contact Name', emp.emergencyContact?.name)}
        ${row('Relation', emp.emergencyContact?.relation)}
        ${row('Phone', emp.emergencyContact?.phone)}
      `;
      case 'Employment': return `
        ${row('Employee #', emp.empNo)}
        ${row('Department', Utils.getDeptName(emp.departmentId))}
        ${row('Designation', Utils.getDesigName(emp.designationId))}
        ${row('Branch', Utils.getBranchName(emp.branchId))}
        ${row('Employment Type', emp.employmentType)}
        ${row('Assigned Role', Employees.getRoleBadge(emp.role || 'employee'))}
        ${row('Joining Date', Utils.formatDate(emp.joiningDate))}
        ${row('Confirmation Date', Utils.formatDate(emp.confirmationDate))}
        ${row('Reporting To', Utils.getEmpName(emp.managerId))}
        ${row('Status', Utils.statusBadge(emp.status))}
      `;
      case 'Role & Access': {
        const users = DB.get('users') || [];
        const user = users.find(u => u.employeeId === emp.id);
        const currentRole = emp.role || user?.role || 'employee';
        const isHR = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

        const roleConfigs = [
          { code: 'onboarding', name: 'New Joiner / Onboarding', icon: 'fa-user-clock', color: '#f97316', desc: 'Induction access: Can fill personal profile & upload onboarding documents. Profile remains editable.' },
          { code: 'employee', name: 'Simple Employee', icon: 'fa-user', color: '#ec4899', desc: 'Standard employee: Profile is LOCKED to view-only. Full self-service attendance, leaves, and salary slips.' },
          { code: 'dept_manager', name: 'Department Manager', icon: 'fa-users-gear', color: '#14b8a6', desc: 'Team lead access: Review department team attendance, approve leaves, conduct appraisals.' },
          { code: 'hr_manager', name: 'HR Manager', icon: 'fa-user-tie', color: '#6366f1', desc: 'Human Resources: Manage employees, assign roles, recruitment, offers, payroll, and administration.' },
          { code: 'superadmin', name: 'Super Admin', icon: 'fa-crown', color: '#f59e0b', desc: 'Executive administrator: Unrestricted access across all modules, settings, users, and audit logs.' }
        ];

        const modules = [
          { name: 'Dashboard', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
          { name: 'Employees Directory', roles: ['superadmin','hr_manager','dept_manager'] },
          { name: 'Role Assignment & Editing', roles: ['superadmin','hr_manager'] },
          { name: 'Attendance Management', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
          { name: 'Leave Management & Approvals', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
          { name: 'Payroll & Salary Slips', roles: ['superadmin','hr_manager','employee'] },
          { name: 'Performance & Appraisals', roles: ['superadmin','hr_manager','dept_manager','employee'] },
          { name: 'Recruitment & Offer Letters', roles: ['superadmin','hr_manager'] },
          { name: 'Administration & Users', roles: ['superadmin','hr_manager'] },
          { name: 'System Settings & Backup', roles: ['superadmin'] }
        ];

        return `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
            <!-- Role Management Card -->
            <div class="card" style="margin-bottom:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                <div>
                  <div style="font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
                    <i class="fa fa-shield-halved" style="color:var(--primary)"></i> Assigned System Role
                  </div>
                  <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Controls permissions, security policies & workspace access</div>
                </div>
                <div>${Employees.getRoleBadge(currentRole)}</div>
              </div>

              <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px">
                <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px">
                  Role Summary & Governance:
                </div>
                <div style="font-size:12px;color:var(--text-2);line-height:1.5">
                  ${roleConfigs.find(r => r.code === currentRole)?.desc || ''}
                </div>
              </div>

              ${isHR ? `
                <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">
                  Change or Reassign Role:
                </div>
                <div style="display:flex;gap:10px;margin-bottom:12px">
                  <select class="form-control" id="prof-role-quick-select" style="font-size:13px">
                    ${roleConfigs.map(r => `<option value="${r.code}" ${r.code === currentRole ? 'selected' : ''}>${r.name}</option>`).join('')}
                  </select>
                  <button class="btn btn-primary" onclick="Employees.updateEmployeeRole(${emp.id}, document.getElementById('prof-role-quick-select').value, 'Profile quick selector')">
                    <i class="fa fa-check"></i> Save Role
                  </button>
                </div>
                <button class="btn btn-secondary btn-sm w-full" onclick="Employees.showAssignRoleModal(${emp.id})">
                  <i class="fa fa-sliders"></i> Open Detailed Role Assignment Modal
                </button>
              ` : `
                <div style="font-size:12px;color:var(--text-3);background:var(--card);padding:10px 12px;border-radius:8px">
                  <i class="fa fa-lock" style="margin-right:5px"></i> Role assignment is managed by HR Administration and Super Admin.
                </div>
              `}
            </div>

            <!-- Login Credentials Card -->
            <div class="card" style="margin-bottom:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                <div>
                  <div style="font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
                    <i class="fa fa-key" style="color:var(--primary)"></i> Login & Credentials
                  </div>
                  <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Employee workspace sign-in account details</div>
                </div>
                ${user ? `<span class="badge ${user.status==='active'?'badge-success':'badge-danger'}">${user.status.toUpperCase()}</span>` : ''}
              </div>

              ${user ? `
                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--card);border-radius:8px;border:1px solid var(--border)">
                    <div style="font-size:12px;color:var(--text-3);font-weight:600">Username:</div>
                    <div style="font-family:monospace;font-size:13.5px;font-weight:700;color:var(--primary)">${user.username}</div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--card);border-radius:8px;border:1px solid var(--border)">
                    <div style="font-size:12px;color:var(--text-3);font-weight:600">Password:</div>
                    <div style="font-family:monospace;font-size:13.5px;color:var(--text-2);letter-spacing:2px">••••••••</div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--card);border-radius:8px;border:1px solid var(--border)">
                    <div style="font-size:12px;color:var(--text-3);font-weight:600">Last Login:</div>
                    <div style="font-size:12px;color:var(--text)">${user.lastLogin ? Utils.formatDate(user.lastLogin) : 'Never logged in'}</div>
                  </div>
                </div>

                ${isHR ? `
                  <div style="display:flex;gap:8px">
                    <button class="btn btn-secondary btn-sm flex-1" onclick="Employees.showManageLoginModal(${emp.id})">
                      <i class="fa fa-key"></i> Reset Password
                    </button>
                    <button class="btn btn-ghost btn-sm flex-1" onclick="Employees.copyCredentials('${user.username}', '${user.password}', '${currentRole}')">
                      <i class="fa fa-copy"></i> Copy Credentials
                    </button>
                  </div>
                ` : ''}
              ` : `
                <div style="text-align:center;padding:24px 12px">
                  <i class="fa fa-user-slash" style="font-size:32px;color:var(--text-muted);opacity:0.4;margin-bottom:8px;display:block"></i>
                  <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">No Login Account Found</div>
                  <p style="font-size:11.5px;color:var(--text-3);margin-bottom:14px">This employee does not have an active workspace login account.</p>
                  ${isHR ? `
                    <button class="btn btn-primary btn-sm" onclick="Employees.createLoginForEmployee(${emp.id})">
                      <i class="fa fa-user-plus"></i> Generate Login Account Now
                    </button>
                  ` : ''}
                </div>
              `}
            </div>
          </div>

          <!-- Module Access Permissions Table -->
          <div class="card" style="padding:0;overflow:hidden;border:1px solid var(--border);border-radius:12px">
            <div style="padding:14px 18px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <div style="font-size:13px;font-weight:700;color:var(--text)">
                <i class="fa fa-table-cells" style="color:var(--primary);margin-right:6px"></i>
                Module Access Matrix for "${roleConfigs.find(r=>r.code===currentRole)?.name}"
              </div>
              <span class="badge badge-info" style="font-size:10px">Role-Based Access Control</span>
            </div>
            <div class="table-wrapper" style="border:none;margin:0">
              <table>
                <thead>
                  <tr>
                    <th>Workspace Module</th>
                    <th>Access Permission</th>
                    <th>Privilege Scope</th>
                  </tr>
                </thead>
                <tbody>
                  ${modules.map(m => {
                    const allowed = m.roles.includes(currentRole);
                    return `
                      <tr>
                        <td style="font-weight:600;font-size:13px">${m.name}</td>
                        <td>
                          ${allowed 
                            ? '<span class="badge badge-success" style="font-size:10.5px"><i class="fa fa-check" style="margin-right:4px"></i>Authorized</span>' 
                            : '<span class="badge badge-secondary" style="font-size:10.5px"><i class="fa fa-lock" style="margin-right:4px"></i>Restricted</span>'}
                        </td>
                        <td style="font-size:12px;color:var(--text-3)">
                          ${allowed 
                            ? (currentRole === 'superadmin' ? 'Unrestricted Corporate Access' : (currentRole === 'hr_manager' ? 'Full HR Management' : (currentRole === 'dept_manager' ? 'Department Scoped' : (currentRole === 'onboarding' ? 'Induction Self-Service' : 'Personal Self-Service')))) 
                            : 'Not permitted for this role'}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      case 'Qualification': return emp.qualifications?.length ? emp.qualifications.map(q => `
        <div style="padding:14px;background:var(--surface);border-radius:8px;margin-bottom:8px">
          <div style="font-weight:600;font-size:14px">${q.degree}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:4px">${q.institution} • ${q.year} • Grade: ${q.grade}</div>
        </div>
      `).join('') : '<div class="text-muted text-sm">No qualifications recorded.</div>';
      case 'Experience': return emp.experience?.length ? emp.experience.map(ex => `
        <div style="padding:14px;background:var(--surface);border-radius:8px;margin-bottom:8px">
          <div style="font-weight:600;font-size:14px">${ex.designation}</div>
          <div style="font-size:12px;color:var(--primary);margin-top:3px">${ex.company}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:3px">${ex.from} — ${ex.to}</div>
        </div>
      `).join('') : '<div class="text-muted text-sm">No experience recorded.</div>';
      case 'Attendance': {
        const attRec = DB.get('attendance').filter(a => a.employeeId === emp.id).slice(-15);
        if (!attRec.length) return '<div class="text-muted text-sm">No attendance records.</div>';
        return `
          <div class="table-wrapper">
            <table><thead><tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Status</th><th>Overtime</th></tr></thead>
            <tbody>${attRec.reverse().map(a => `
              <tr>
                <td>${Utils.formatDate(a.date)}</td>
                <td>${a.timeIn||'—'}</td>
                <td>${a.timeOut||'—'}</td>
                <td>${Utils.statusBadge(a.status)}</td>
                <td>${a.overtime ? `${a.overtime}h` : '—'}</td>
              </tr>
            `).join('')}</tbody></table>
          </div>
        `;
      }
      case 'Leaves': {
        const leaves = DB.get('leave_requests').filter(l => l.employeeId === emp.id);
        const balances = DB.get('leave_balances').find(b => b.employeeId === emp.id);
        const types = DB.get('leave_types');
        return `
          <div class="mb-16">
            <div style="font-size:13px;font-weight:600;margin-bottom:10px">Leave Balance 2026</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${types.slice(0,4).map(t => `
                <div style="background:var(--surface);border-radius:8px;padding:10px 14px;min-width:120px">
                  <div style="font-size:11px;color:var(--text-3)">${t.name}</div>
                  <div style="font-size:20px;font-weight:800;color:${t.color}">${balances?.balances[t.id] ?? t.maxDays}</div>
                  <div style="font-size:10px;color:var(--text-muted)">/ ${t.maxDays} days</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="table-wrapper">
            <table><thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
            <tbody>${leaves.length === 0 ? '<tr><td colspan="5" class="text-center text-muted">No leave records.</td></tr>' : leaves.map(l => `
              <tr>
                <td>${Utils.getLeaveTypeName(l.typeId)}</td>
                <td>${Utils.formatDate(l.from)}</td>
                <td>${Utils.formatDate(l.to)}</td>
                <td>${l.days}</td>
                <td>${Utils.statusBadge(l.status)}</td>
              </tr>
            `).join('')}</tbody></table>
          </div>
        `;
      }
      case 'Salary': {
        const salRec = DB.get('salary').filter(s => s.employeeId === emp.id);
        return `
          <div style="padding:14px;background:var(--primary-glow);border-radius:8px;margin-bottom:16px;border:1px solid var(--primary-glow)">
            <div style="font-size:12px;color:var(--text-3)">Current Basic Salary</div>
            <div style="font-size:28px;font-weight:800;color:var(--primary)">${Utils.formatCurrency(emp.salary)}</div>
          </div>
          <div class="table-wrapper">
            <table><thead><tr><th>Month</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net</th><th>Status</th></tr></thead>
            <tbody>${salRec.length === 0 ? '<tr><td colspan="6" class="text-center text-muted">No salary records.</td></tr>' : salRec.map(s => `
              <tr>
                <td>${s.month}</td>
                <td>${Utils.formatCurrency(s.basic)}</td>
                <td class="text-success">${Utils.formatCurrency(s.allowances)}</td>
                <td class="text-danger">${Utils.formatCurrency(s.deductions)}</td>
                <td style="font-weight:700">${Utils.formatCurrency(s.netSalary)}</td>
                <td>${Utils.statusBadge(s.status)}</td>
              </tr>
            `).join('')}</tbody></table>
          </div>
        `;
      }
      case 'Performance': {
        const reviews = DB.get('performance_reviews').filter(r => r.employeeId === emp.id);
        return reviews.length === 0 ? '<div class="text-muted text-sm">No performance reviews.</div>' : reviews.map(r => `
          <div style="padding:16px;background:var(--surface);border-radius:8px;margin-bottom:10px;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div><span class="chip">${r.type} — ${r.quarter||''} ${r.year}</span></div>
              ${Utils.statusBadge(r.status)}
            </div>
            ${r.status === 'completed' ? `
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
                ${[['KPI Score',r.kpiScore+'%','var(--primary)'],['KRA Score',r.kraScore+'%','var(--accent)'],['Overall',`${'★'.repeat(r.overallRating)}${'☆'.repeat(5-r.overallRating)}`,'var(--warning)']].map(([l,v,c])=>`
                  <div style="text-align:center;padding:10px;background:var(--card);border-radius:6px">
                    <div style="font-size:18px;font-weight:800;color:${c}">${v}</div>
                    <div style="font-size:11px;color:var(--text-3)">${l}</div>
                  </div>
                `).join('')}
              </div>
              <div style="font-size:12.5px;color:var(--text-2)"><strong>Manager:</strong> ${r.managerFeedback}</div>
            ` : '<div class="badge badge-warning">Pending Review</div>'}
          </div>
        `).join('');
      }
      case 'Training': {
        const trainings = DB.get('trainings').filter(t => t.employeeId === emp.id);
        return trainings.length === 0 ? '<div class="text-muted text-sm">No training records.</div>' : trainings.map(t => `
          <div style="padding:14px;background:var(--surface);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">${t.title}</div>
              <div style="font-size:12px;color:var(--text-3)">${t.provider} • ${Utils.formatDate(t.from)} to ${Utils.formatDate(t.to)}</div>
              <div style="font-size:12px;color:var(--text-3)">Cost: ${Utils.formatCurrency(t.cost)} ${t.certificate ? '• 🎓 Certificate Earned' : ''}</div>
            </div>
            ${Utils.statusBadge(t.status)}
          </div>
        `).join('');
      }
      case 'Assets': {
        const assets = DB.get('assets').filter(a => a.assignedTo === emp.id);
        return assets.length === 0 ? '<div class="text-muted text-sm">No assets assigned.</div>' : assets.map(a => `
          <div style="padding:14px;background:var(--surface);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">${a.name}</div>
              <div style="font-size:12px;color:var(--text-3)">${a.code} • ${a.category} • Assigned: ${Utils.formatDate(a.assignedOn)}</div>
            </div>
            <span class="badge badge-success">${a.condition}</span>
          </div>
        `).join('');
      }
      case 'Documents': {
        const docs = DB.get('documents').filter(d => d.employeeId === emp.id);
        const isHR = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
        const isOnboardingSelf = Auth.role === 'onboarding' && Auth.employee?.id === emp.id;
        const canUpload = isHR || isOnboardingSelf;
        const requiredDocs = [
          { type: 'CNIC', label: 'CNIC Copy (Front & Back)' },
          { type: 'Degree', label: 'Educational Degree / Transcripts' },
          { type: 'CV', label: 'Updated Resume / CV' },
          { type: 'Experience Letter', label: 'Experience / Relieving Certificate' },
          { type: 'Photograph', label: 'Passport-Size Photograph' },
          { type: 'Offer Acceptance', label: 'Signed Offer Acceptance Slip' }
        ];

        return `
          <!-- Mandatory Documents Checklist Card -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin-bottom:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px">
                  <i class="fa fa-clipboard-check" style="color:var(--primary)"></i> Mandatory Joining Documents Checklist
                </div>
                <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Required for induction completion & corporate role confirmation</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px">
                <span class="badge ${docs.length >= 4 ? 'badge-success' : 'badge-warning'}" style="font-size:11px">
                  <i class="fa ${docs.length >= 4 ? 'fa-circle-check' : 'fa-clock'}"></i> ${docs.length} of ${requiredDocs.length} Uploaded
                </span>
                ${canUpload ? `
                  <button class="btn btn-primary btn-sm" onclick="Employees.showUploadDocumentModal(${emp.id})">
                    <i class="fa fa-upload"></i> Upload Document
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Visual Checklist Pills -->
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${requiredDocs.map(rd => {
                const uploaded = docs.find(d => d.type === rd.type || d.name.toLowerCase().includes(rd.type.toLowerCase()));
                return `
                  <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;background:${uploaded ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)'};color:${uploaded ? '#16a34a' : '#ef4444'};border:1px solid ${uploaded ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}">
                    <i class="fa ${uploaded ? 'fa-check' : 'fa-circle-xmark'}"></i>
                    <span>${rd.label}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Uploaded Documents Table -->
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Category</th>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Uploaded On</th>
                  <th>Status</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${docs.length === 0 ? `
                  <tr><td colspan="7" class="text-center text-muted" style="padding:28px">
                    <i class="fa fa-folder-open" style="font-size:28px;display:block;margin-bottom:8px;opacity:0.5"></i>
                    No documents uploaded yet. Click <strong>Upload Document</strong> above to attach files.
                  </td></tr>
                ` : docs.map(d => `
                  <tr>
                    <td>
                      <div style="font-weight:600;color:var(--text);font-size:13px">${d.name}</div>
                      ${d.remarks ? `<div style="font-size:11px;color:var(--text-3);margin-top:2px">${d.remarks}</div>` : ''}
                    </td>
                    <td><span class="chip">${d.type}</span></td>
                    <td style="font-size:12px;font-family:monospace;color:var(--text-2)"><i class="fa fa-paperclip" style="margin-right:4px"></i>${d.filename}</td>
                    <td style="font-size:11.5px;color:var(--text-3)">${d.size || '—'}</td>
                    <td style="font-size:12px">${Utils.formatDate(d.uploadedOn)}</td>
                    <td>
                      <span class="badge badge-${d.status === 'verified' ? 'success' : 'warning'}" style="font-size:10px">
                        <i class="fa ${d.status === 'verified' ? 'fa-check-double' : 'fa-clock'}"></i>
                        ${d.status === 'verified' ? 'Verified' : 'Pending Review'}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <div class="tbl-actions" style="justify-content:flex-end">
                        <button class="btn btn-ghost btn-icon btn-xs" onclick="Employees.previewDocument(${d.id})" title="Preview Details"><i class="fa fa-eye"></i></button>
                        <button class="btn btn-ghost btn-icon btn-xs" onclick="Toast.show('Downloading ${d.filename}...', 'info')" title="Download"><i class="fa fa-download"></i></button>
                        ${(isHR || isOnboardingSelf) ? `
                          <button class="btn btn-ghost btn-icon btn-xs text-danger" onclick="Employees.deleteDocument(${d.id}, ${emp.id})" title="Delete"><i class="fa fa-trash"></i></button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      case 'Promotion': {
        const promotions = DB.get('promotions').filter(p => p.employeeId === emp.id);
        return promotions.length === 0 ? '<div class="text-muted text-sm">No promotion history.</div>' : promotions.map(p => `
          <div style="padding:14px;background:var(--surface);border-radius:8px;margin-bottom:8px">
            <div style="font-weight:600">${Utils.getDesigName(p.fromDesignationId)} → ${Utils.getDesigName(p.toDesignationId)}</div>
            <div style="font-size:12px;color:var(--text-3)">Effective: ${Utils.formatDate(p.effectiveDate)} • Increment: ${Utils.formatCurrency(p.incrementAmount)}</div>
            <div style="font-size:12px;color:var(--text-2);margin-top:6px">${p.remarks}</div>
          </div>
        `).join('');
      }
      case 'Dependents': {
        const deps = DB.get('dependents').filter(d => d.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
        return `
          <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
            ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="Employees.showAddDependent(${emp.id})"><i class="fa fa-plus"></i> Add Dependent</button>` : ''}
          </div>
          <div class="dependents-list">
            ${deps.length === 0 ? '<div class="text-muted text-sm">No dependents recorded.</div>' : deps.map(d => `
              <div class="dependent-card">
                <div style="width:38px;height:38px;border-radius:50%;background:var(--primary-glow);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--primary)">${d.name.charAt(0)}</div>
                <div style="flex:1">
                  <div style="font-weight:600;font-size:13px">${d.name}</div>
                  <div style="font-size:11px;color:var(--text-3)">${d.relation} • DOB: ${d.dob ? Utils.formatDate(d.dob) : '—'} ${d.cnic ? '• CNIC: '+d.cnic : ''}</div>
                </div>
                ${canEdit ? `<button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Employees.deleteDependent(${d.id},${emp.id})"><i class="fa fa-trash"></i></button>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }
      case 'Transfer': {
        const transfers = DB.get('promotions').filter(p => p.employeeId === emp.id && p.type === 'transfer');
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
        const depts = DB.get('departments');
        const branches = DB.get('branches');
        return `
          <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
            ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="Employees.showInitiateTransfer(${emp.id})"><i class="fa fa-right-left"></i> Initiate Transfer</button>` : ''}
          </div>
          ${transfers.length === 0 ? '<div class="text-muted text-sm">No transfer history recorded.</div>' : `
            <div class="table-wrapper">
              <table>
                <thead><tr><th>From Dept</th><th>To Dept</th><th>Effective Date</th><th>Reason</th></tr></thead>
                <tbody>${transfers.map(t => `
                  <tr>
                    <td>${Utils.getDeptName(t.fromDept||emp.departmentId)}</td>
                    <td>${Utils.getDeptName(t.toDept||emp.departmentId)}</td>
                    <td>${Utils.formatDate(t.effectiveDate)}</td>
                    <td>${t.remarks||'—'}</td>
                  </tr>
                `).join('')}</tbody>
              </table>
            </div>
          `}
        `;
      }
      case 'Notes': {
        const notes = DB.get('notes').filter(n => n.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
        return `
          ${canEdit ? `
            <div style="margin-bottom:14px">
              <textarea class="form-control" id="emp-note-text" placeholder="Add an HR note about this employee…" rows="3"></textarea>
              <div style="display:flex;gap:8px;margin-top:8px">
                <select class="filter-select" id="emp-note-type">
                  <option value="general">General</option>
                  <option value="performance">Performance</option>
                  <option value="training">Training</option>
                  <option value="disciplinary">Disciplinary</option>
                </select>
                <button class="btn btn-primary btn-sm" onclick="Employees.saveNote(${emp.id})"><i class="fa fa-save"></i> Save Note</button>
              </div>
            </div>
          ` : ''}
          <div class="notes-list">
            ${notes.length === 0 ? '<div class="text-muted text-sm">No notes recorded.</div>' : notes.map(n => `
              <div class="note-card">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i class="fa fa-note-sticky" style="color:var(--accent);font-size:12px"></i>
                </div>
                <div style="flex:1">
                  <div class="note-text">${n.note}</div>
                  <div class="note-meta"><span class="chip" style="font-size:9px">${n.type}</span> • Added by ${Utils.getEmpName(n.addedBy)} on ${Utils.formatDate(n.addedOn)}</div>
                </div>
                ${canEdit ? `<button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Employees.deleteNote(${n.id},${emp.id})"><i class="fa fa-trash"></i></button>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }
      case 'Exit': {
        const exitRec = DB.get('exit_records').find(e => e.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
        if (!exitRec && emp.status === 'active') {
          return canEdit ? `
            <div style="text-align:center;padding:30px">
              <i class="fa fa-person-walking-arrow-right" style="font-size:40px;color:var(--text-muted);margin-bottom:16px;display:block"></i>
              <div style="font-size:14px;color:var(--text-2);margin-bottom:16px">No exit record. Employee is currently active.</div>
              <button class="btn btn-danger" onclick="Employees.showInitiateExit(${emp.id})"><i class="fa fa-door-open"></i> Initiate Exit Process</button>
            </div>
          ` : '<div class="text-muted text-sm">Employee is active. No exit record.</div>';
        }
        if (!exitRec) return '<div class="text-muted text-sm">No exit record found.</div>';
        const cl = exitRec.clearance || {};
        const clearanceItems = [
          { key: 'it', label: 'IT Equipment & Assets Returned' },
          { key: 'hr', label: 'HR Clearance (Documents, Certificates)' },
          { key: 'finance', label: 'Finance Clearance (No Dues)' },
          { key: 'admin', label: 'Admin Clearance (Keys, Parking)' },
          { key: 'library', label: 'Library / Resources Returned' },
        ];
        return `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
            ${[
              ['Exit Date', Utils.formatDate(exitRec.exitDate)],
              ['Reason', exitRec.reason],
              ['Notice Period', exitRec.noticePeriod + ' days'],
              ['Last Working Day', Utils.formatDate(exitRec.lastWorkingDay)],
            ].map(([l,v]) => `
              <div style="background:var(--surface);border-radius:8px;padding:12px">
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${l}</div>
                <div style="font-size:14px;font-weight:600;margin-top:4px">${v}</div>
              </div>
            `).join('')}
          </div>
          ${exitRec.interviewNotes ? `<div style="padding:12px;background:var(--surface);border-radius:8px;margin-bottom:16px"><div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">EXIT INTERVIEW NOTES</div><div style="font-size:13px;color:var(--text-2)">${exitRec.interviewNotes}</div></div>` : ''}
          <div style="font-size:13px;font-weight:600;margin-bottom:10px">Clearance Checklist</div>
          <div>${clearanceItems.map(item => `
            <div class="clearance-item">
              <input type="checkbox" ${cl[item.key] ? 'checked' : ''} onchange="Employees.updateClearance(${exitRec.id},'${item.key}',this.checked)">
              <span>${item.label}</span>
              <span style="margin-left:auto;font-size:11px;color:${cl[item.key]?'var(--success)':'var(--text-muted)'}">${cl[item.key]?'✓ Cleared':'Pending'}</span>
            </div>
          `).join('')}</div>
        `;
      }
      default: return `<div class="empty-state" style="padding:40px"><i class="fa fa-file-circle-question"></i><h3>${tab}</h3><p>Content for this tab coming soon.</p></div>`;
    }
  },

  // ── Dependent helpers ──
  showAddDependent(empId) {
    Modal.show('Add Dependent', `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Name</label><input class="form-control" id="dep-name" placeholder="Full name"></div>
        <div class="form-group"><label class="form-label required">Relation</label>
          <select class="form-control" id="dep-rel">
            <option>Spouse</option><option>Child</option><option>Parent</option><option>Sibling</option><option>Other</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Date of Birth</label><input class="form-control" id="dep-dob" type="date"></div>
        <div class="form-group"><label class="form-label">CNIC</label><input class="form-control" id="dep-cnic" placeholder="42201-1234567-8"></div>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Employees.saveDependent(${empId})">Save</button>`
    });
  },
  saveDependent(empId) {
    const name = document.getElementById('dep-name').value.trim();
    if (!name) { Toast.show('Name is required', 'error'); return; }
    DB.add('dependents', {
      id: DB.nextId('dependents'), employeeId: empId,
      name, relation: document.getElementById('dep-rel').value,
      dob: document.getElementById('dep-dob').value || null,
      cnic: document.getElementById('dep-cnic').value.trim() || null,
      status: 'active'
    });
    Modal.close('dynamic-modal');
    Toast.show('Dependent added!', 'success');
    this.renderProfile(empId);
  },
  deleteDependent(depId, empId) {
    Modal.confirm('Delete Dependent', 'Remove this dependent?', () => {
      DB.delete('dependents', depId);
      Toast.show('Dependent removed.', 'warning');
      this.renderProfile(empId);
    });
  },

  // ── Transfer helpers ──
  showInitiateTransfer(empId) {
    const emp = DB.find('employees', empId);
    const depts = DB.get('departments');
    const branches = DB.get('branches');
    Modal.show('Initiate Transfer', `
      <div class="form-group"><label class="form-label">Current Department</label>
        <input class="form-control" value="${Utils.getDeptName(emp.departmentId)}" readonly disabled>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Transfer To Department</label>
          <select class="form-control" id="tr-dept">${depts.map(d=>`<option value="${d.id}">${d.name}</option>`)}</select>
        </div>
        <div class="form-group"><label class="form-label">Transfer To Branch</label>
          <select class="form-control" id="tr-branch">${branches.map(b=>`<option value="${b.id}">${b.name}</option>`)}</select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Effective Date</label><input class="form-control" id="tr-date" type="date" value="${Utils.today()}"></div>
        <div class="form-group"><label class="form-label">Reason</label><input class="form-control" id="tr-reason" placeholder="Transfer reason"></div>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Employees.saveTransfer(${empId})"><i class="fa fa-right-left"></i> Confirm Transfer</button>`
    });
  },
  saveTransfer(empId) {
    const emp = DB.find('employees', empId);
    const toDept = parseInt(document.getElementById('tr-dept').value);
    const toBranch = parseInt(document.getElementById('tr-branch').value);
    const effDate = document.getElementById('tr-date').value;
    const reason = document.getElementById('tr-reason').value.trim();
    DB.add('promotions', {
      id: DB.nextId('promotions'), employeeId: empId, type: 'transfer',
      fromDept: emp.departmentId, toDept,
      fromDesignationId: emp.designationId, toDesignationId: emp.designationId,
      effectiveDate: effDate, remarks: reason, incrementAmount: 0, approvedBy: Auth.user?.id,
    });
    DB.update('employees', empId, { departmentId: toDept, branchId: toBranch });
    DB.log('TRANSFER', 'Employees', `${emp.fullName} transferred to ${Utils.getDeptName(toDept)}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Transfer initiated!', 'success');
    this.renderProfile(empId);
  },

  // ── Notes helpers ──
  saveNote(empId) {
    const text = document.getElementById('emp-note-text').value.trim();
    if (!text) { Toast.show('Please enter a note', 'error'); return; }
    const type = document.getElementById('emp-note-type').value;
    DB.add('notes', {
      id: DB.nextId('notes'), employeeId: empId,
      note: text, type, addedBy: Auth.employee.id, addedOn: Utils.today()
    });
    Toast.show('Note saved!', 'success');
    this.renderProfile(empId);
  },
  deleteNote(noteId, empId) {
    Modal.confirm('Delete Note', 'Delete this HR note?', () => {
      DB.delete('notes', noteId);
      Toast.show('Note deleted.', 'warning');
      this.renderProfile(empId);
    });
  },

  // ── Exit helpers ──
  showInitiateExit(empId) {
    const emp = DB.find('employees', empId);
    Modal.show(`Initiate Exit — ${emp.fullName}`, `
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Exit Date</label><input class="form-control" id="ex-date" type="date" value="${Utils.today()}"></div>
        <div class="form-group"><label class="form-label required">Last Working Day</label><input class="form-control" id="ex-lwd" type="date" value="${Utils.today()}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Reason</label>
          <select class="form-control" id="ex-reason">
            <option>Resignation</option><option>Termination</option><option>Retirement</option><option>End of Contract</option><option>Other</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Notice Period (days)</label><input class="form-control" id="ex-notice" type="number" value="30" min="0"></div>
      </div>
      <div class="form-group"><label class="form-label">Exit Interview Notes</label>
        <textarea class="form-control" id="ex-notes" rows="3" placeholder="Reason for leaving, feedback…"></textarea>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-danger" onclick="Employees.saveExit(${empId})"><i class="fa fa-door-open"></i> Confirm Exit</button>`
    });
  },
  saveExit(empId) {
    const exitDate = document.getElementById('ex-date').value;
    const lwd = document.getElementById('ex-lwd').value;
    const reason = document.getElementById('ex-reason').value;
    const notice = parseInt(document.getElementById('ex-notice').value) || 0;
    const notes = document.getElementById('ex-notes').value.trim();
    if (!exitDate) { Toast.show('Exit date is required', 'error'); return; }
    DB.add('exit_records', {
      id: DB.nextId('exit_records'), employeeId: empId,
      exitDate, lastWorkingDay: lwd, reason, noticePeriod: notice,
      interviewNotes: notes, clearance: { it:false, hr:false, finance:false, admin:false, library:false },
      approvedBy: Auth.user?.id, createdOn: Utils.today()
    });
    DB.update('employees', empId, { status: 'inactive', exitDate });
    DB.log('EXIT', 'Employees', `${Utils.getEmpName(empId)} exit initiated. Reason: ${reason}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Exit process initiated!', 'warning', Utils.getEmpName(empId));
    this.renderProfile(empId);
  },
  updateClearance(exitId, key, value) {
    const exits = DB.get('exit_records');
    const rec = exits.find(e => e.id === exitId);
    if (rec) {
      rec.clearance[key] = value;
      DB.set('exit_records', exits);
      Toast.show(`${value ? 'Cleared' : 'Unchecked'}: ${key.toUpperCase()}`, value ? 'success' : 'info');
    }
  },

  showAddForm(prefill = {}) {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied: Employees cannot add new employee records.', 'error');
      return;
    }
    const depts = DB.get('departments');
    const desigs = DB.get('designations');
    const branches = DB.get('branches');
    const shifts = DB.get('shifts');

    // Auto-match designation if passed by title
    let matchedDesigId = prefill.designationId;
    if (!matchedDesigId && prefill.designationName) {
      const match = desigs.find(d => d.name.toLowerCase() === prefill.designationName.toLowerCase());
      if (match) matchedDesigId = match.id;
    }

    const defaultUsername = (prefill.email 
      ? prefill.email.split('@')[0] 
      : (prefill.firstName ? `${prefill.firstName.toLowerCase()}.${(prefill.lastName||'').toLowerCase()}` : '')
    ).replace(/[^a-z0-9._-]/g, '');

    Modal.show(prefill.offerRefNo ? `Register Employee — Offer #${prefill.offerRefNo}` : 'Add New Employee', `
      <input type="hidden" id="ef-applicant-id" value="${prefill.applicantId || ''}">
      <input type="hidden" id="ef-offer-id" value="${prefill.offerId || ''}">

      ${prefill.offerRefNo ? `
        <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:12.5px;color:var(--text);font-weight:700">
              <i class="fa fa-file-circle-check" style="color:var(--success);margin-right:6px"></i>
              Candidate Accepted Offer Letter: <span style="font-family:monospace;color:var(--primary)">${prefill.offerRefNo}</span>
            </div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">
              Details pre-filled from official appointment agreement. Configure system role and corporate login credentials.
            </div>
          </div>
          <span class="badge badge-success" style="font-size:10.5px"><i class="fa fa-check"></i> Accepted</span>
        </div>
      ` : ''}

      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">First Name</label><input class="form-control" id="ef-fname" placeholder="First name" value="${prefill.firstName || ''}"></div>
        <div class="form-group"><label class="form-label required">Last Name</label><input class="form-control" id="ef-lname" placeholder="Last name" value="${prefill.lastName || ''}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Email</label><input class="form-control" id="ef-email" type="email" placeholder="email@company.com" value="${prefill.email || ''}" oninput="if(!document.getElementById('ef-username').dataset.manual){document.getElementById('ef-username').value=this.value.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g,'')}"></div>
        <div class="form-group"><label class="form-label required">Phone</label><input class="form-control" id="ef-phone" placeholder="0300-1234567" value="${prefill.phone || ''}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Department</label>
          <select class="form-control" id="ef-dept">${depts.map(d=>`<option value="${d.id}" ${prefill.departmentId === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label required">Designation</label>
          <select class="form-control" id="ef-desig">${desigs.map(d=>`<option value="${d.id}" ${matchedDesigId === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Join Date</label><input class="form-control" id="ef-join" type="date" value="${prefill.joiningDate || Utils.today()}"></div>
        <div class="form-group"><label class="form-label required">Basic / Gross Salary (PKR)</label><input class="form-control" id="ef-salary" type="number" placeholder="50000" value="${prefill.salary || ''}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Branch</label>
          <select class="form-control" id="ef-branch">${branches.map(b=>`<option value="${b.id}">${b.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Employment Type</label>
          <select class="form-control" id="ef-type">
            <option value="Permanent" ${prefill.empType==='Permanent'?'selected':''}>Permanent</option>
            <option value="Probation" ${!prefill.empType||prefill.empType==='Probation'?'selected':''}>Probation</option>
            <option value="Contract" ${prefill.empType==='Contract'?'selected':''}>Contract</option>
          </select></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required"><i class="fa fa-user-tie" style="color:var(--primary);margin-right:4px"></i>Report-to (Reporting Manager)</label>
          <select class="form-control" id="ef-manager">
            <option value="3" selected>Usman Baig (Deputy Manager / Tech Lead)</option>
            <option value="2">Sara Malik (Head of HR)</option>
            <option value="1">Ahmed Khan (Super Admin / CEO)</option>
            ${(DB.get('employees')||[]).filter(m => ![1,2,3].includes(m.id) && m.status === 'active').map(m => `<option value="${m.id}">${m.fullName} (${Utils.getDesigName(m.designationId)})</option>`).join('')}
          </select>
          <div style="font-size:11px;color:var(--text-3);margin-top:3px">Direct supervisor for 1st-level approval workflows.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Secondary Escalation Authority</label>
          <input class="form-control" value="Sara Malik (Corporate HR) & Ahmed Khan (Admin)" readonly style="background:var(--surface);color:var(--text-3);font-size:12px">
          <div style="font-size:11px;color:var(--text-3);margin-top:3px">Automatic 2nd and 3rd tier escalation chain.</div>
        </div>
      </div>

      <!-- Dedicated System Role & Login Credentials Setup -->
      <div style="margin-top:10px;margin-bottom:12px;padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:10px">
        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--primary);margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <i class="fa fa-shield-halved"></i> System Role & Portal Login Credentials
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required"><i class="fa fa-user-shield" style="margin-right:5px;color:var(--primary)"></i>Assigned System Role</label>
            <select class="form-control" id="ef-role">
              <option value="onboarding" selected>New Joiner / Onboarding (Editable Profile & Upload Docs)</option>
              <option value="employee">Simple Employee (View-Only Profile, Personal Records)</option>
              <option value="dept_manager">Department Manager (Team Management & Approvals)</option>
              <option value="hr_manager">HR Manager (Full HR Management & Role Assignment)</option>
              <option value="superadmin">Super Admin (Full Corporate Control)</option>
            </select>
            <div style="font-size:11px;color:var(--text-3);margin-top:4px">
              <i class="fa fa-circle-info" style="color:var(--primary);margin-right:2px"></i> Select <em>Onboarding</em> during induction, or assign any role according to your needs.
            </div>
          </div>
          <div class="form-group">
            <label class="form-label required"><i class="fa fa-user" style="margin-right:5px;color:var(--primary)"></i>Portal Login Username</label>
            <input class="form-control" id="ef-username" placeholder="e.g. ahmed.khan" value="${defaultUsername}" oninput="this.dataset.manual='1'">
            <div style="font-size:11px;color:var(--text-3);margin-top:4px">Username employee will use to log into HRM Pro.</div>
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required"><i class="fa fa-key" style="margin-right:5px;color:var(--primary)"></i>Initial Password</label>
            <div style="display:flex;gap:6px">
              <input class="form-control" id="ef-password" value="emp123" placeholder="Enter password">
              <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('ef-password').value='emp'+Math.floor(100+Math.random()*900)" title="Generate random password">
                <i class="fa fa-shuffle"></i>
              </button>
            </div>
            <div style="font-size:11px;color:var(--text-3);margin-top:4px">Temporary password for first-time login.</div>
          </div>
          <div class="form-group">
            <label class="form-label">Candidate CNIC</label>
            <input class="form-control" id="ef-cnic" placeholder="42201-1234567-1" value="${prefill.cnic || ''}">
            <div style="font-size:11px;color:var(--text-3);margin-top:4px">Verified National ID number.</div>
          </div>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Gender</label>
          <select class="form-control" id="ef-gender"><option value="Male">Male</option><option value="Female">Female</option></select></div>
        <div class="form-group">
          <label class="form-label">Joining Stage</label>
          <input class="form-control" value="New Hire Induction & Verification" readonly style="background:var(--surface);color:var(--text-3);font-size:12px">
        </div>
      </div>
    `, {
      size: 'modal-lg',
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveEmployee()"><i class="fa fa-save"></i> Register & Create Login</button>
      `
    });
  },

  saveEmployee() {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied.', 'error');
      return;
    }
    const fname = document.getElementById('ef-fname').value.trim();
    const lname = document.getElementById('ef-lname').value.trim();
    const email = document.getElementById('ef-email').value.trim();
    const phone = document.getElementById('ef-phone').value.trim();
    const deptId = parseInt(document.getElementById('ef-dept').value);
    const desigId = parseInt(document.getElementById('ef-desig').value);
    const joinDate = document.getElementById('ef-join').value;
    const salary = parseFloat(document.getElementById('ef-salary').value) || 50000;
    const branchId = parseInt(document.getElementById('ef-branch').value);
    const empType = document.getElementById('ef-type').value;
    const gender = document.getElementById('ef-gender').value;
    const cnic = document.getElementById('ef-cnic').value.trim();
    const role = document.getElementById('ef-role')?.value || 'onboarding';
    const usernameInput = (document.getElementById('ef-username')?.value.trim() || email.split('@')[0] || `emp`).toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const passwordInput = document.getElementById('ef-password')?.value.trim() || 'emp123';
    const chosenManagerId = parseInt(document.getElementById('ef-manager')?.value) || 3;

    if (!fname || !lname || !email || !phone) {
      Toast.show('Please fill all required fields.', 'error');
      return;
    }

    const emps = DB.get('employees');
    const newId = DB.nextId('employees');
    const finalUsername = usernameInput || `emp${newId}`;

    const newEmp = {
      id: newId, empNo: `EMP-${String(newId).padStart(3,'0')}`,
      firstName: fname, lastName: lname, fullName: `${fname} ${lname}`,
      email, phone, cnic, gender,
      departmentId: deptId, designationId: desigId, branchId, shiftId: 1,
      joiningDate: joinDate, confirmationDate: role !== 'onboarding' ? joinDate : null,
      employmentType: empType, status: 'active', role,
      onboardingStatus: role === 'onboarding' ? 'in_progress' : 'completed',
      salary, photo: null, managerId: chosenManagerId, reportingTo: chosenManagerId, hrManagerId: 2, adminId: 1,
      dob: '', maritalStatus: '', address: '',
      bloodGroup: '', nationality: 'Pakistani', religion: '',
      bankName: '', accountNo: '', iban: '',
      emergencyContact: {}, qualifications: [], experience: [],
    };
    DB.add('employees', newEmp);
    
    // Auto-create/synchronize login user account
    const users = DB.get('users') || [];
    let newUser;
    const existingUserIdx = users.findIndex(u => u.username === finalUsername);
    if (existingUserIdx >= 0) {
      users[existingUserIdx].employeeId = newId;
      users[existingUserIdx].role = role;
      users[existingUserIdx].password = passwordInput;
      newUser = users[existingUserIdx];
    } else {
      newUser = {
        id: DB.nextId('users'),
        employeeId: newId,
        username: finalUsername,
        password: passwordInput,
        role,
        status: 'active',
        lastLogin: null
      };
      users.push(newUser);
    }
    DB.set('users', users);

    // Link offer letter if provided
    const offerId = parseInt(document.getElementById('ef-offer-id')?.value);
    if (offerId) {
      DB.update('offer_letters', offerId, { status: 'converted' });
    }

    const applicantId = parseInt(document.getElementById('ef-applicant-id')?.value);
    if (applicantId) {
      DB.update('applications', applicantId, { stage: 'hired' });
    }

    DB.log('ADD', 'Employees', `New employee ${newEmp.fullName} (${newEmp.empNo}) registered with role "${role}" and login "${finalUsername}"`, Auth.user?.id);
    Modal.close('dynamic-modal');

    // Show celebratory credentials creation modal
    Employees.showCredentialsCreatedModal(newEmp, newUser, passwordInput);
    this.render();
  },

  showEditForm(empId) {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied: Profile is view-only for employees.', 'error');
      return;
    }
    const emp = DB.find('employees', empId);
    if (!emp) return;
    const depts = DB.get('departments');
    const desigs = DB.get('designations');
    const branches = DB.get('branches');
    const currentRole = emp.role || 'employee';
    const docs = DB.get('documents') || [];
    const uploadedDocs = docs.filter(d => d.employeeId === emp.id);

    Modal.show(`Edit — ${emp.fullName}`, `
      ${currentRole === 'onboarding' ? `
        <!-- Onboarding Fast-Track Action Callout -->
        <div style="background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(99,102,241,0.08));border:1.5px solid rgba(245,158,11,0.35);border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-size:12.5px;font-weight:700;color:#f59e0b;display:flex;align-items:center;gap:6px">
              <i class="fa fa-user-clock"></i> New Joiner Induction & Onboarding Active
              ${emp.onboardingStatus === 'submitted_for_review' ? '<span class="badge badge-success" style="font-size:10px">Submitted for HR Review</span>' : '<span class="badge badge-secondary" style="font-size:10px">Self-Service Active</span>'}
            </div>
            <div style="font-size:11.5px;color:var(--text-2);margin-top:3px">
              Uploaded Documents: <strong>${uploadedDocs.length}</strong> • Profile Info: <strong>${emp.cnic ? 'CNIC Provided' : 'Pending Info'}</strong>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-success btn-xs" onclick="Employees.assignRoleQuick(${emp.id}, 'employee')" title="Approve & convert to Simple Employee (locks profile to view-only)">
              <i class="fa fa-user-check"></i> Assign Simple Employee
            </button>
            <button type="button" class="btn btn-primary btn-xs" onclick="Employees.assignRoleQuick(${emp.id}, 'dept_manager')" title="Approve & assign Department Manager role">
              <i class="fa fa-user-tie"></i> Assign Manager Role
            </button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="Modal.close('dynamic-modal'); Employees.renderProfile(${emp.id}); setTimeout(() => document.querySelector('[data-tab=\\'prof-documents\\']')?.click(), 200)">
              <i class="fa fa-folder-open"></i> Review Docs (${uploadedDocs.length})
            </button>
          </div>
        </div>
      ` : ''}

      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">First Name</label><input class="form-control" id="ef-fname" value="${emp.firstName}"></div>
        <div class="form-group"><label class="form-label required">Last Name</label><input class="form-control" id="ef-lname" value="${emp.lastName}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="ef-email" type="email" value="${emp.email}"></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="ef-phone" value="${emp.phone}"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Department</label>
          <select class="form-control" id="ef-dept">${depts.map(d=>`<option value="${d.id}"${d.id===emp.departmentId?' selected':''}>${d.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Designation</label>
          <select class="form-control" id="ef-desig">${desigs.map(d=>`<option value="${d.id}"${d.id===emp.designationId?' selected':''}>${d.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Basic Salary</label><input class="form-control" id="ef-salary" type="number" value="${emp.salary}"></div>
        <div class="form-group"><label class="form-label">Employment Type</label>
          <select class="form-control" id="ef-type">
            <option value="Permanent"${emp.employmentType==='Permanent'?' selected':''}>Permanent</option>
            <option value="Probation"${emp.employmentType==='Probation'?' selected':''}>Probation</option>
            <option value="Contract"${emp.employmentType==='Contract'?' selected':''}>Contract</option>
          </select></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label"><i class="fa fa-user-tie" style="color:var(--primary);margin-right:4px"></i>Report-to (Reporting Manager)</label>
          <select class="form-control" id="ef-manager">
            <option value="3" ${emp.managerId === 3 ? 'selected' : ''}>Usman Baig (Deputy Manager / Tech Lead)</option>
            <option value="2" ${emp.managerId === 2 ? 'selected' : ''}>Sara Malik (Head of HR)</option>
            <option value="1" ${emp.managerId === 1 ? 'selected' : ''}>Ahmed Khan (Super Admin / CEO)</option>
            ${(DB.get('employees')||[]).filter(m => ![1,2,3].includes(m.id) && m.id !== emp.id && m.status === 'active').map(m => `<option value="${m.id}" ${emp.managerId === m.id ? 'selected' : ''}>${m.fullName} (${Utils.getDesigName(m.designationId)})</option>`).join('')}
          </select>
          <div style="font-size:11px;color:var(--text-3);margin-top:3px">Direct supervisor for 1st-level approval workflows.</div>
        </div>
        <div class="form-group"><label class="form-label">Branch</label>
          <select class="form-control" id="ef-branch">${branches.map(b=>`<option value="${b.id}"${b.id===emp.branchId?' selected':''}>${b.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required"><i class="fa fa-shield-halved" style="margin-right:5px;color:var(--primary)"></i>Assigned System Role</label>
          <select class="form-control" id="ef-role">
            <option value="onboarding" ${currentRole==='onboarding'?'selected':''}>New Joiner / Onboarding (Can Fill Info & Upload Documents)</option>
            <option value="employee" ${currentRole==='employee'?'selected':''}>Simple Employee (View-Only Profile, Personal Reports)</option>
            <option value="dept_manager" ${currentRole==='dept_manager'?'selected':''}>Dept Manager (Department Scoped Access)</option>
            <option value="hr_manager" ${currentRole==='hr_manager'?'selected':''}>HR Manager (Full HR & Role Assignment Access)</option>
            <option value="superadmin" ${currentRole==='superadmin'?'selected':''}>Super Admin (Full Corporate Access)</option>
          </select>
          <div style="font-size:11px;color:var(--text-3);margin-top:5px;line-height:1.4">
            <i class="fa fa-circle-info" style="color:var(--primary);margin-right:3px"></i>
            <strong>Workflow:</strong> Assign <em>New Joiner / Onboarding</em> during induction so employee can fill info & upload documents. Once verified by HR, change to <em>Simple Employee</em> (locks profile to view-only) or <em>Dept Manager</em>.
          </div>
        </div>
        <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="ef-address" style="min-height:38px">${emp.address||''}</textarea></div>
      </div>
    `, {
      size: 'modal-lg',
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        ${currentRole === 'onboarding' ? `
          <button class="btn btn-success" onclick="Employees.assignRoleQuick(${empId}, 'employee')"><i class="fa fa-user-check"></i> Assign Simple Employee</button>
          <button class="btn btn-primary" onclick="Employees.assignRoleQuick(${empId}, 'dept_manager')"><i class="fa fa-user-tie"></i> Assign Manager</button>
        ` : ''}
        <button class="btn btn-primary" onclick="Employees.updateEmployee(${empId})"><i class="fa fa-save"></i> Update Employee</button>
      `
    });
  },

  updateEmployee(empId) {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied.', 'error');
      return;
    }
    const assignedRole = document.getElementById('ef-role')?.value || 'employee';
    const chosenMgr = parseInt(document.getElementById('ef-manager')?.value);
    const updates = {
      firstName:      document.getElementById('ef-fname').value.trim(),
      lastName:       document.getElementById('ef-lname').value.trim(),
      email:          document.getElementById('ef-email').value.trim(),
      phone:          document.getElementById('ef-phone').value.trim(),
      departmentId:   parseInt(document.getElementById('ef-dept').value),
      designationId:  parseInt(document.getElementById('ef-desig').value),
      salary:         parseFloat(document.getElementById('ef-salary').value),
      employmentType: document.getElementById('ef-type').value,
      role:           assignedRole,
      address:        document.getElementById('ef-address').value.trim(),
    };
    if (chosenMgr) {
      updates.managerId = chosenMgr;
      updates.reportingTo = chosenMgr;
    }
    if (document.getElementById('ef-branch')) {
      updates.branchId = parseInt(document.getElementById('ef-branch').value);
    }
    if (assignedRole === 'employee') {
      updates.onboardingStatus = 'completed';
    }
    updates.fullName = `${updates.firstName} ${updates.lastName}`;
    DB.update('employees', empId, updates);

    // Sync assigned role with users collection
    const users = DB.get('users') || [];
    const user = users.find(u => u.employeeId === empId);
    if (user) {
      user.role = assignedRole;
      DB.set('users', users);
    }
    if (Auth.user && Auth.user.employeeId === empId) {
      Auth._user.role = assignedRole;
      sessionStorage.setItem('hrm_session', JSON.stringify({ user: Auth._user, employee: Auth._employee }));
    }

    DB.log('UPDATE', 'Employees', `Employee ${updates.fullName} (EMP-${String(empId).padStart(3,'0')}) updated. Role: ${assignedRole}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(
      'Employee updated successfully!',
      'success',
      assignedRole === 'employee' ? 'Profile locked to view-only as per policy.' : `Role set to ${assignedRole}`
    );
    this.render();
  },

  toggleStatus(empId) {
    if (Auth.role === 'employee') {
      Toast.show('Permission denied.', 'error');
      return;
    }
    const emp = DB.find('employees', empId);
    if (!emp) return;
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    Modal.confirm(
      newStatus === 'inactive' ? 'Deactivate Employee' : 'Activate Employee',
      `Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} <strong>${emp.fullName}</strong>?`,
      () => {
        DB.update('employees', empId, { status: newStatus });
        DB.log(newStatus === 'inactive' ? 'DEACTIVATE' : 'ACTIVATE', 'Employees', `${emp.fullName} status changed to ${newStatus}`, Auth.user?.id);
        Toast.show(`Employee ${newStatus === 'inactive' ? 'deactivated' : 'activated'}!`, newStatus === 'inactive' ? 'warning' : 'success');
        this.render();
      }
    );
  },

  // ═══════════════════════════════════════════════
  // ONBOARDING SELF-SERVICE PROFILE FILLING
  // ═══════════════════════════════════════════════

  showSelfServiceEditForm(empId) {
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;

    Modal.show({
      size: 'modal-lg',
      title: `<div style="display:flex;align-items:center;gap:10px">
        <i class="fa fa-id-card-clip" style="color:var(--primary)"></i>
        <span>Complete Onboarding Profile — ${emp.fullName}</span>
      </div>`,
      body: `
        <div style="background:rgba(79,128,247,0.08);border:1px solid rgba(79,128,247,0.25);border-radius:10px;padding:12px 16px;margin-bottom:16px">
          <div style="font-size:12.5px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:6px">
            <i class="fa fa-circle-info"></i> Employee Induction Self-Service
          </div>
          <div style="font-size:12px;color:var(--text-2);margin-top:3px;line-height:1.4">
            Please accurately fill in your personal, emergency contact, and bank account details for payroll and corporate records. Company appointment fields are managed by HR Administration.
          </div>
        </div>

        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin-bottom:10px">
          1. Personal & Identification Information
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label required">First Name</label><input class="form-control" id="sf-fname" value="${emp.firstName}"></div>
          <div class="form-group"><label class="form-label required">Last Name</label><input class="form-control" id="sf-lname" value="${emp.lastName}"></div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label required">CNIC / National Identity Card</label><input class="form-control" id="sf-cnic" value="${emp.cnic || ''}" placeholder="42101-1234567-1"></div>
          <div class="form-group"><label class="form-label required">Date of Birth</label><input class="form-control" id="sf-dob" type="date" value="${emp.dob || '1995-01-01'}"></div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select class="form-control" id="sf-gender">
              <option value="Male" ${emp.gender==='Male'?'selected':''}>Male</option>
              <option value="Female" ${emp.gender==='Female'?'selected':''}>Female</option>
              <option value="Other" ${emp.gender==='Other'?'selected':''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Marital Status</label>
            <select class="form-control" id="sf-marital">
              <option value="Single" ${emp.maritalStatus==='Single'?'selected':''}>Single</option>
              <option value="Married" ${emp.maritalStatus==='Married'?'selected':''}>Married</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Blood Group</label>
            <select class="form-control" id="sf-blood">
              <option value="" ${!emp.bloodGroup?'selected':''}>Select Blood Group</option>
              <option value="A+" ${emp.bloodGroup==='A+'?'selected':''}>A+</option>
              <option value="A-" ${emp.bloodGroup==='A-'?'selected':''}>A-</option>
              <option value="B+" ${emp.bloodGroup==='B+'?'selected':''}>B+</option>
              <option value="B-" ${emp.bloodGroup==='B-'?'selected':''}>B-</option>
              <option value="O+" ${emp.bloodGroup==='O+'?'selected':''}>O+</option>
              <option value="O-" ${emp.bloodGroup==='O-'?'selected':''}>O-</option>
              <option value="AB+" ${emp.bloodGroup==='AB+'?'selected':''}>AB+</option>
              <option value="AB-" ${emp.bloodGroup==='AB-'?'selected':''}>AB-</option>
            </select>
          </div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Nationality</label><input class="form-control" id="sf-nationality" value="${emp.nationality || 'Pakistani'}"></div>
          <div class="form-group"><label class="form-label">Religion</label><input class="form-control" id="sf-religion" value="${emp.religion || 'Islam'}"></div>
        </div>
        <div class="form-group"><label class="form-label required">Current Residential Address</label><textarea class="form-control" id="sf-address" rows="2">${emp.address || ''}</textarea></div>

        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin:16px 0 10px">
          2. Contact & Emergency Details
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label required">Official / Contact Email</label><input class="form-control" id="sf-email" type="email" value="${emp.email}"></div>
          <div class="form-group"><label class="form-label required">Mobile Phone Number</label><input class="form-control" id="sf-phone" value="${emp.phone}"></div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group"><label class="form-label required">Emergency Contact Name</label><input class="form-control" id="sf-ec-name" value="${emp.emergencyContact?.name || ''}" placeholder="e.g. Tariq Ibrahim"></div>
          <div class="form-group"><label class="form-label required">Relationship</label><input class="form-control" id="sf-ec-rel" value="${emp.emergencyContact?.relation || ''}" placeholder="e.g. Father / Spouse / Brother"></div>
          <div class="form-group"><label class="form-label required">Emergency Contact Phone</label><input class="form-control" id="sf-ec-phone" value="${emp.emergencyContact?.phone || ''}" placeholder="0300-1234567"></div>
        </div>

        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin:16px 0 10px">
          3. Bank & Salary Disbursement Details
        </div>
        <div class="form-row form-row-3">
          <div class="form-group">
            <label class="form-label required">Bank Name</label>
            <select class="form-control" id="sf-bank">
              <option value="HBL" ${emp.bankName==='HBL'?'selected':''}>Habib Bank Limited (HBL)</option>
              <option value="Meezan" ${emp.bankName==='Meezan'?'selected':''}>Meezan Bank</option>
              <option value="MCB" ${emp.bankName==='MCB'?'selected':''}>MCB Bank</option>
              <option value="UBL" ${emp.bankName==='UBL'?'selected':''}>United Bank Limited (UBL)</option>
              <option value="Allied" ${emp.bankName==='Allied'?'selected':''}>Allied Bank Limited (ABL)</option>
              <option value="Standard Chartered" ${emp.bankName==='Standard Chartered'?'selected':''}>Standard Chartered</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label required">Account Number</label><input class="form-control" id="sf-acct" value="${emp.accountNo || ''}" placeholder="1234567890123"></div>
          <div class="form-group"><label class="form-label required">IBAN (24 Characters)</label><input class="form-control" id="sf-iban" value="${emp.iban || ''}" placeholder="PK36HABB0000001234567890"></div>
        </div>

        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin:16px 0 10px">
          4. Appointment & Corporate Designation (Read-Only)
        </div>
        <div class="form-row form-row-3" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px">
          <div><div style="font-size:11px;color:var(--text-3)">Department</div><div style="font-weight:600;font-size:13px">${Utils.getDeptName(emp.departmentId)}</div></div>
          <div><div style="font-size:11px;color:var(--text-3)">Designation</div><div style="font-weight:600;font-size:13px">${Utils.getDesigName(emp.designationId)}</div></div>
          <div><div style="font-size:11px;color:var(--text-3)">Monthly Gross Salary</div><div style="font-weight:700;color:var(--success);font-size:13px">${Utils.formatCurrency(emp.salary)}</div></div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveSelfServiceProfile(${empId})"><i class="fa fa-save"></i> Save Profile Details</button>
      `
    });
  },

  saveSelfServiceProfile(empId) {
    const fname = document.getElementById('sf-fname')?.value.trim();
    const lname = document.getElementById('sf-lname')?.value.trim();
    const cnic = document.getElementById('sf-cnic')?.value.trim();
    const dob = document.getElementById('sf-dob')?.value;
    const gender = document.getElementById('sf-gender')?.value;
    const maritalStatus = document.getElementById('sf-marital')?.value;
    const bloodGroup = document.getElementById('sf-blood')?.value;
    const nationality = document.getElementById('sf-nationality')?.value.trim();
    const religion = document.getElementById('sf-religion')?.value.trim();
    const address = document.getElementById('sf-address')?.value.trim();
    const email = document.getElementById('sf-email')?.value.trim();
    const phone = document.getElementById('sf-phone')?.value.trim();

    const ecName = document.getElementById('sf-ec-name')?.value.trim();
    const ecRel = document.getElementById('sf-ec-rel')?.value.trim();
    const ecPhone = document.getElementById('sf-ec-phone')?.value.trim();

    const bankName = document.getElementById('sf-bank')?.value;
    const accountNo = document.getElementById('sf-acct')?.value.trim();
    const iban = document.getElementById('sf-iban')?.value.trim();

    if (!fname || !lname || !cnic || !email || !phone) {
      Toast.show('Please fill all mandatory fields (Name, CNIC, Email, Phone).', 'error');
      return;
    }

    const updates = {
      firstName: fname,
      lastName: lname,
      fullName: `${fname} ${lname}`,
      cnic,
      dob,
      gender,
      maritalStatus,
      bloodGroup,
      nationality,
      religion,
      address,
      email,
      phone,
      emergencyContact: { name: ecName, relation: ecRel, phone: ecPhone },
      bankName,
      accountNo,
      iban
    };

    DB.update('employees', Number(empId), updates);
    DB.log('UPDATE', 'Employees', `Onboarding profile updated by employee ${updates.fullName} (EMP-${String(empId).padStart(3,'0')})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Onboarding profile details saved successfully!', 'success');
    this.renderProfile(empId);
  },

  submitOnboardingForReview(empId) {
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;

    Modal.confirm(
      'Submit Onboarding to HR',
      `Are you ready to submit your completed onboarding profile and uploaded documents to HR Administration for final verification and corporate role assignment?`,
      () => {
        DB.update('employees', Number(empId), { onboardingStatus: 'submitted_for_review' });
        DB.log('ONBOARDING_SUBMIT', 'Employees', `Employee ${emp.fullName} submitted onboarding package for HR verification`, Auth.user?.id);
        Toast.show('Onboarding Package Submitted to HR!', 'success', 'Your documents and profile are now under HR review.');
        this.renderProfile(empId);
      },
      'success'
    );
  },

  // ═══════════════════════════════════════════════
  // DOCUMENT MANAGEMENT & UPLOAD MODAL
  // ═══════════════════════════════════════════════

  showUploadDocumentModal(empId) {
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;

    Modal.show({
      size: 'modal-md',
      title: `<div style="display:flex;align-items:center;gap:10px">
        <i class="fa fa-cloud-arrow-up" style="color:var(--primary)"></i>
        <span>Upload Joining Document — ${emp.fullName}</span>
      </div>`,
      body: `
        <div class="form-group">
          <label class="form-label required">Document Classification / Category</label>
          <select class="form-control" id="doc-type" onchange="Employees.onDocCategoryChange(this.value)">
            <option value="CNIC">CNIC Copy (Front & Back)</option>
            <option value="Degree">Educational Degree / Transcript</option>
            <option value="CV">Updated Curriculum Vitae (Resume)</option>
            <option value="Experience Letter">Relieving / Experience Certificate</option>
            <option value="Photograph">Passport-Size Photograph</option>
            <option value="Offer Acceptance">Signed Offer Acceptance Slip</option>
            <option value="Salary Slip">Previous Salary Slip / Bank Statement</option>
            <option value="Other">Other Supporting Document</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Document Title / Description</label>
          <input class="form-control" id="doc-name" value="CNIC Copy (Front & Back)" placeholder="e.g. CNIC Front & Back (Verified)">
        </div>

        <div class="form-group">
          <label class="form-label required">Attach File (PDF, PNG, JPG, DOCX)</label>
          <div style="border:2px dashed var(--border);border-radius:10px;padding:22px;text-align:center;background:var(--surface);cursor:pointer;transition:border-color .2s" onclick="document.getElementById('doc-file-input').click()">
            <i class="fa fa-file-arrow-up" style="font-size:32px;color:var(--primary);margin-bottom:8px;display:block"></i>
            <div style="font-size:13px;font-weight:600;color:var(--text)" id="doc-file-label">Click to browse or drop document here</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:4px">Supported formats: PDF, PNG, JPG, JPEG, DOCX • Max: 15MB</div>
            <input type="file" id="doc-file-input" style="display:none" onchange="Employees.onDocFileSelected(this)">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes / Remarks for HR (Optional)</label>
          <textarea class="form-control" id="doc-remarks" rows="2" placeholder="Any special notes or verification remarks..."></textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveUploadedDocument(${empId})"><i class="fa fa-upload"></i> Upload & Attach Document</button>
      `
    });
  },

  onDocCategoryChange(cat) {
    const titles = {
      'CNIC': 'CNIC Copy (Front & Back)',
      'Degree': 'Educational Degree & Official Transcripts',
      'CV': 'Updated Curriculum Vitae (Resume)',
      'Experience Letter': 'Previous Employment Relieving & Experience Letter',
      'Photograph': 'Passport Size Blue Background Photograph',
      'Offer Acceptance': 'Signed Corporate Offer Letter & Acceptance Declaration',
      'Salary Slip': 'Last 3 Months Salary Slip / Bank Statement',
      'Other': 'Supporting Identification Document'
    };
    const titleInput = document.getElementById('doc-name');
    if (titleInput && titles[cat]) {
      titleInput.value = titles[cat];
    }
  },

  onDocFileSelected(input) {
    const label = document.getElementById('doc-file-label');
    if (input.files && input.files[0]) {
      const f = input.files[0];
      const mb = (f.size / (1024 * 1024)).toFixed(2);
      if (label) {
        label.innerHTML = `<span style="color:var(--success)"><i class="fa fa-check"></i> ${f.name}</span> <span style="color:var(--text-3);font-size:11px">(${mb} MB)</span>`;
      }
    }
  },

  saveUploadedDocument(empId) {
    const type = document.getElementById('doc-type')?.value;
    const name = document.getElementById('doc-name')?.value.trim();
    const remarks = document.getElementById('doc-remarks')?.value.trim() || '';
    const fileInput = document.getElementById('doc-file-input');
    const file = fileInput?.files?.[0];

    if (!name) {
      Toast.show('Document Title is required', 'error');
      return;
    }

    const filename = file ? file.name : `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
    const size = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.4 MB';

    const docs = DB.get('documents') || [];
    const newDoc = {
      id: DB.nextId('documents'),
      employeeId: Number(empId),
      type,
      name,
      filename,
      size,
      remarks,
      uploadedOn: Utils.today(),
      uploadedBy: Auth.user?.id || 1,
      status: Auth.role === 'onboarding' ? 'pending' : 'verified'
    };

    DB.add('documents', newDoc);
    DB.log('UPLOAD', 'Documents', `Uploaded ${type} document "${name}" for EMP-${String(empId).padStart(3,'0')}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Document "${name}" attached successfully!`, 'success');

    this.renderProfile(empId);
    setTimeout(() => {
      document.querySelector('[data-tab="prof-documents"]')?.click();
    }, 150);
  },

  deleteDocument(docId, empId) {
    Modal.confirm('Delete Document', 'Are you sure you want to delete this document from the employee profile?', () => {
      DB.delete('documents', Number(docId));
      Toast.show('Document removed successfully.', 'info');
      this.renderProfile(empId);
      setTimeout(() => {
        document.querySelector('[data-tab="prof-documents"]')?.click();
      }, 150);
    });
  },

  previewDocument(docId) {
    const doc = DB.find('documents', Number(docId));
    if (!doc) return;

    Modal.show({
      size: 'modal-md',
      title: `<div style="display:flex;align-items:center;gap:8px">
        <i class="fa fa-file-lines" style="color:var(--primary)"></i>
        <span>Document Details — ${doc.name}</span>
      </div>`,
      body: `
        <div style="text-align:center;padding:24px 16px">
          <div style="width:68px;height:68px;border-radius:16px;background:rgba(79,128,247,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--primary);font-size:32px">
            <i class="fa fa-file-pdf"></i>
          </div>
          <h3 style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:4px">${doc.name}</h3>
          <div style="font-size:12px;color:var(--text-3);margin-bottom:16px">${doc.filename} • ${doc.size || '1.4 MB'}</div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:left;font-size:12.5px;color:var(--text-2);line-height:1.8;max-width:440px;margin:0 auto">
            <div><strong>Classification:</strong> ${doc.type}</div>
            <div><strong>Uploaded On:</strong> ${Utils.formatDate(doc.uploadedOn)}</div>
            <div><strong>Verification Status:</strong> 
              <span class="badge badge-${doc.status==='verified'?'success':'warning'}" style="font-size:10px">
                <i class="fa ${doc.status==='verified'?'fa-check-double':'fa-clock'}"></i>
                ${doc.status==='verified'?'Verified by HR Administration':'Pending Review'}
              </span>
            </div>
            ${doc.remarks ? `<div style="margin-top:6px;border-top:1px dashed var(--border);padding-top:6px"><strong>Remarks:</strong> ${doc.remarks}</div>` : ''}
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Toast.show('Downloading ${doc.filename}...', 'info')"><i class="fa fa-download"></i> Download Document</button>
      `
    });
  },

  // ═══════════════════════════════════════════════
  // QUICK ROLE ASSIGNMENT & ONBOARDING APPROVAL
  // ═══════════════════════════════════════════════

  assignRoleQuick(empId, targetRole) {
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') {
      Toast.show('Permission denied: Only HR Manager and Super Admin can assign roles.', 'error');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;

    const roleLabels = {
      employee: 'Simple Employee (View-Only Profile, Personal Reports)',
      dept_manager: 'Dept Manager (Department Management & Approvals)',
      hr_manager: 'HR Manager',
      superadmin: 'Super Admin'
    };

    const isSimpleEmployee = targetRole === 'employee';

    Modal.confirm(
      `Confirm Role Transition`,
      `Are you sure you want to assign <strong>${emp.fullName}</strong> to <strong>${roleLabels[targetRole] || targetRole}</strong>?<br><br>` +
      (isSimpleEmployee 
        ? `<div style="font-size:12px;color:var(--text-2);background:var(--surface);padding:12px;border-radius:8px;border:1px solid var(--border);line-height:1.5">
             <i class="fa fa-lock" style="color:#ec4899;margin-right:5px"></i>
             <strong>Governance Enforcement:</strong> Assigning <strong>Simple Employee</strong> will lock this employee's profile to <strong>view-only</strong>. The employee will still view their attendance, leaves, and salary slips, but cannot modify corporate records.
           </div>`
        : `<div style="font-size:12px;color:var(--text-2);background:var(--surface);padding:12px;border-radius:8px;border:1px solid var(--border);line-height:1.5">
             <i class="fa fa-users-gear" style="color:var(--primary);margin-right:5px"></i>
             <strong>Managerial Access:</strong> Assigning <strong>Dept Manager</strong> grants departmental management, leave approvals, and team review privileges.
           </div>`),
      () => {
        // Update employee record
        DB.update('employees', Number(empId), {
          role: targetRole,
          onboardingStatus: 'completed',
          confirmationDate: emp.confirmationDate || Utils.today()
        });

        // Synchronize user login record
        const users = DB.get('users') || [];
        const user = users.find(u => u.employeeId === Number(empId));
        if (user) {
          user.role = targetRole;
          DB.set('users', users);
        }

        DB.log('ROLE_ASSIGNMENT', 'Employees', `Assigned role "${targetRole}" to ${emp.fullName} (${emp.empNo}). Onboarding induction completed.`, Auth.user?.id);
        
        Toast.show(
          `Role Successfully Updated!`,
          'success',
          isSimpleEmployee ? `${emp.fullName} is now a Simple Employee. Profile is locked to view-only.` : `${emp.fullName} is now a Department Manager.`
        );

        Modal.close('dynamic-modal');
        const isProfileActive = document.querySelector('.profile-layout');
        if (isProfileActive) {
          Employees.renderProfile(empId);
        } else {
          Employees.render();
        }
      },
      isSimpleEmployee ? 'primary' : 'success'
    );
  },

  showOnboardingApprovalModal(empId) {
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') return;
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const docs = (DB.get('documents') || []).filter(d => d.employeeId === emp.id);

    Modal.show({
      size: 'modal-lg',
      title: `<div style="display:flex;align-items:center;gap:10px">
        <i class="fa fa-user-check" style="color:var(--primary)"></i>
        <span>Review Onboarding & Assign Role — ${emp.fullName}</span>
      </div>`,
      body: `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;font-size:12.5px">
            <div><div style="color:var(--text-3);font-size:11px">Candidate / Employee</div><strong>${emp.fullName}</strong> (${emp.empNo})</div>
            <div><div style="color:var(--text-3);font-size:11px">CNIC / ID</div><strong style="font-family:monospace">${emp.cnic || 'Pending Submission'}</strong></div>
            <div><div style="color:var(--text-3);font-size:11px">Joining Date</div><strong>${Utils.formatDate(emp.joiningDate)}</strong></div>
            <div><div style="color:var(--text-3);font-size:11px">Department</div><strong>${Utils.getDeptName(emp.departmentId)}</strong></div>
            <div><div style="color:var(--text-3);font-size:11px">Designation</div><strong>${Utils.getDesigName(emp.designationId)}</strong></div>
            <div><div style="color:var(--text-3);font-size:11px">Approved Salary</div><strong style="color:var(--success)">${Utils.formatCurrency(emp.salary)}</strong></div>
          </div>
        </div>

        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
          <span>Uploaded Joining Documents (${docs.length})</span>
          <span class="badge ${docs.length >= 4 ? 'badge-success' : 'badge-warning'}" style="font-size:10.5px">
            ${docs.length >= 4 ? 'Checklist Verified' : 'Checklist Incomplete'}
          </span>
        </div>

        <div class="table-wrapper" style="margin-bottom:20px">
          <table>
            <thead>
              <tr><th>Document</th><th>Category</th><th>File Name</th><th>Uploaded On</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${docs.length === 0 ? '<tr><td colspan="5" class="text-center text-muted">No documents uploaded by candidate yet.</td></tr>' : docs.map(d => `
                <tr>
                  <td><strong>${d.name}</strong></td>
                  <td><span class="chip">${d.type}</span></td>
                  <td style="font-family:monospace;font-size:11.5px">${d.filename}</td>
                  <td>${Utils.formatDate(d.uploadedOn)}</td>
                  <td><span class="badge badge-success" style="font-size:10px"><i class="fa fa-check"></i> Attached</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background:linear-gradient(135deg, rgba(34,197,94,0.1), rgba(79,128,247,0.08));border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:16px">
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Ready to Finalize Role Assignment</div>
          <div style="font-size:12px;color:var(--text-2);margin-bottom:12px;line-height:1.5">
            Select the permanent corporate role for <strong>${emp.fullName}</strong>. Assigning <strong>Simple Employee</strong> locks their profile to view-only mode as required by company policy.
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-success" onclick="Employees.assignRoleQuick(${emp.id}, 'employee')">
              <i class="fa fa-user-check"></i> Assign Simple Employee (Lock Profile View-Only)
            </button>
            <button class="btn btn-primary" onclick="Employees.assignRoleQuick(${emp.id}, 'dept_manager')">
              <i class="fa fa-user-tie"></i> Assign Manager Role
            </button>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
      `
    });
  },

  // ═══════════════════════════════════════════════
  // ROLE & LOGIN CREDENTIALS MANAGEMENT (HR & ADMIN)
  // ═══════════════════════════════════════════════

  getRoleBadge(role) {
    switch(role) {
      case 'superadmin':
        return `<span class="badge" style="background:rgba(245,158,11,0.15);color:#d97706;border:1px solid rgba(245,158,11,0.4)"><i class="fa fa-crown" style="margin-right:4px"></i>Super Admin</span>`;
      case 'hr_manager':
        return `<span class="badge" style="background:rgba(99,102,241,0.15);color:#6366f1;border:1px solid rgba(99,102,241,0.4)"><i class="fa fa-user-tie" style="margin-right:4px"></i>HR Manager</span>`;
      case 'dept_manager':
        return `<span class="badge" style="background:rgba(20,184,166,0.15);color:#0d9488;border:1px solid rgba(20,184,166,0.4)"><i class="fa fa-users-gear" style="margin-right:4px"></i>Dept Manager</span>`;
      case 'employee':
        return `<span class="badge" style="background:rgba(236,72,153,0.15);color:#db2777;border:1px solid rgba(236,72,153,0.4)"><i class="fa fa-user" style="margin-right:4px"></i>Simple Employee</span>`;
      case 'onboarding':
        return `<span class="badge" style="background:rgba(249,115,22,0.15);color:#ea580c;border:1px solid rgba(249,115,22,0.4)"><i class="fa fa-user-clock" style="margin-right:4px"></i>New Joiner (Onboarding)</span>`;
      default:
        return `<span class="badge badge-secondary">${role || 'employee'}</span>`;
    }
  },

  copyCredentials(username, password, role) {
    const text = `HRM Pro Corporate Workspace Credentials\n---------------------------------------\nEmployee Portal: ${window.location.origin + window.location.pathname}\nUsername: ${username}\nPassword: ${password || 'emp123'}\nAssigned Role: ${role || 'Employee'}\n---------------------------------------`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        Toast.show('Login credentials copied to clipboard!', 'success', 'You can now share them with the employee.');
      }).catch(() => {
        prompt('Copy login credentials:', text);
      });
    } else {
      prompt('Copy login credentials:', text);
    }
  },

  showCredentialsCreatedModal(emp, user, password) {
    Modal.show({
      size: 'modal-md',
      title: `<div style="display:flex;align-items:center;gap:10px;color:var(--success)">
        <i class="fa fa-circle-check"></i>
        <span>New Employee Registered & Login Created!</span>
      </div>`,
      body: `
        <div style="text-align:center;padding:10px 0 16px">
          <div class="avatar avatar-lg" style="background:${Utils.avatarColor(emp.id)};margin:0 auto 10px;width:54px;height:54px;font-size:20px;border:3px solid var(--border)">
            ${Utils.avatarInitials(emp.fullName)}
          </div>
          <div style="font-size:17px;font-weight:800;color:var(--text)">${emp.fullName}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:2px">
            ${Utils.getDesigName(emp.designationId)} • ${Utils.getDeptName(emp.departmentId)} (${emp.empNo})
          </div>
        </div>

        <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:16px;margin-bottom:14px">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
            <span><i class="fa fa-key" style="color:var(--primary);margin-right:6px"></i>Official Login Credentials</span>
            <span class="badge badge-success" style="font-size:10px"><i class="fa fa-check"></i> Account Ready</span>
          </div>

          <div style="display:grid;grid-template-columns:110px 1fr;gap:10px;font-size:13px;align-items:center;margin-bottom:10px">
            <div style="color:var(--text-3);font-weight:600">Username:</div>
            <div style="font-family:monospace;font-weight:700;color:var(--primary);font-size:14px;background:var(--card);padding:6px 10px;border-radius:6px;border:1px solid var(--border)">
              ${user.username}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:110px 1fr;gap:10px;font-size:13px;align-items:center;margin-bottom:10px">
            <div style="color:var(--text-3);font-weight:600">Password:</div>
            <div style="font-family:monospace;font-weight:700;color:var(--text);font-size:14px;background:var(--card);padding:6px 10px;border-radius:6px;border:1px solid var(--border)">
              ${password || 'emp123'}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:110px 1fr;gap:10px;font-size:13px;align-items:center">
            <div style="color:var(--text-3);font-weight:600">Assigned Role:</div>
            <div>
              ${Employees.getRoleBadge(user.role || emp.role)}
            </div>
          </div>
        </div>

        <div style="font-size:12px;color:var(--text-2);background:rgba(79,128,247,0.08);padding:10px 12px;border-radius:8px;border:1px solid rgba(79,128,247,0.2);line-height:1.5">
          <i class="fa fa-circle-info" style="color:var(--primary);margin-right:5px"></i>
          Share these credentials with <strong>${emp.fullName}</strong>. They can log into the employee self-service workspace using their username and password.
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Employees.copyCredentials('${user.username}', '${password || 'emp123'}', '${user.role || emp.role}')">
          <i class="fa fa-copy"></i> Copy Credentials
        </button>
        <button class="btn btn-primary" onclick="Modal.close('dynamic-modal'); Employees.renderProfile(${emp.id})">
          <i class="fa fa-id-card"></i> View Profile & Role
        </button>
      `
    });
  },

  showAssignRoleModal(empId) {
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') {
      Toast.show('Permission denied: Only HR Manager and Super Admin can assign roles.', 'error');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const currentRole = emp.role || 'employee';
    const users = DB.get('users') || [];
    const user = users.find(u => u.employeeId === emp.id);

    const rolesList = [
      {
        code: 'onboarding',
        name: 'New Joiner (Onboarding)',
        badge: 'badge-warning',
        icon: 'fa-user-clock',
        color: '#f97316',
        desc: 'Candidate induction stage: Employee can fill personal, emergency, and bank account details and upload mandatory joining documents.',
        governance: 'Profile is EDITABLE by the employee during onboarding.'
      },
      {
        code: 'employee',
        name: 'Simple Employee',
        badge: 'badge-secondary',
        icon: 'fa-user',
        color: '#ec4899',
        desc: 'Regular corporate employee: Self-service access to attendance check-in, leave applications, pay slips, and personal performance.',
        governance: 'Profile is LOCKED to VIEW-ONLY. Corporate records can only be modified by HR Administration.'
      },
      {
        code: 'dept_manager',
        name: 'Department Manager',
        badge: 'badge-info',
        icon: 'fa-users-gear',
        color: '#14b8a6',
        desc: 'Department team supervisor: Monitor departmental team attendance, review & approve leave applications, and conduct appraisals.',
        governance: 'Access is scoped to their department members.'
      },
      {
        code: 'hr_manager',
        name: 'HR Manager',
        badge: 'badge-primary',
        icon: 'fa-user-tie',
        color: '#6366f1',
        desc: 'Human Resources Manager: Complete workforce management, recruitment & offer letter generation, payroll processing, and role assignment.',
        governance: 'Full HR administration & role assignment authority.'
      },
      {
        code: 'superadmin',
        name: 'Super Admin',
        badge: 'badge-warning',
        icon: 'fa-crown',
        color: '#f59e0b',
        desc: 'Executive Governance: Unrestricted corporate access, company settings, system audit logs, user management, and data backups.',
        governance: 'Full system-wide administrative control.'
      }
    ];

    Modal.show({
      size: 'modal-lg',
      title: `<div style="display:flex;align-items:center;gap:10px">
        <i class="fa fa-user-shield" style="color:var(--primary)"></i>
        <span>Assign or Edit System Role — ${emp.fullName}</span>
      </div>`,
      body: `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text)">${emp.fullName} (${emp.empNo})</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              ${Utils.getDesigName(emp.designationId)} • ${Utils.getDeptName(emp.departmentId)}
              ${user ? `• Login: <span style="font-family:monospace;color:var(--primary);font-weight:600">${user.username}</span>` : '• <span style="color:var(--warning)">No Login Account</span>'}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:3px">Current Role:</div>
            <div>${Employees.getRoleBadge(currentRole)}</div>
          </div>
        </div>

        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin-bottom:12px">
          Select Target Role for Employee:
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
          ${rolesList.map(r => `
            <label style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:var(--surface);border:1.5px solid ${r.code===currentRole?'var(--primary)':'var(--border)'};border-radius:10px;cursor:pointer;transition:all .2s" class="role-option-card">
              <input type="radio" name="target-role" value="${r.code}" ${r.code===currentRole?'checked':''} style="margin-top:4px;accent-color:var(--primary)">
              <div style="flex:1">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                  <div style="font-size:13.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px">
                    <i class="fa ${r.icon}" style="color:${r.color}"></i> ${r.name}
                  </div>
                  ${r.code === currentRole ? '<span class="badge badge-primary" style="font-size:9.5px">CURRENT</span>' : ''}
                </div>
                <div style="font-size:12px;color:var(--text-2);line-height:1.4">${r.desc}</div>
                <div style="font-size:11px;color:${r.color};margin-top:4px;font-weight:600">
                  <i class="fa fa-shield-check" style="margin-right:4px"></i>${r.governance}
                </div>
              </div>
            </label>
          `).join('')}
        </div>

        <div class="form-group">
          <label class="form-label">Role Change Reason / Remarks (Optional for Audit Trail)</label>
          <input class="form-control" id="role-change-reason" placeholder="e.g. Induction completed, Promoted to Department Manager, Role reassignment">
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="
          const selected = document.querySelector('input[name=target-role]:checked')?.value;
          const reason = document.getElementById('role-change-reason')?.value.trim();
          if (selected) Employees.updateEmployeeRole(${emp.id}, selected, reason);
        ">
          <i class="fa fa-save"></i> Save & Apply Role
        </button>
      `
    });
  },

  updateEmployeeRole(empId, targetRole, reason = '') {
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') {
      Toast.show('Permission denied: Only HR Manager and Super Admin can assign roles.', 'error');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;

    const prevRole = emp.role || 'employee';

    const updates = {
      role: targetRole,
      confirmationDate: emp.confirmationDate || (targetRole !== 'onboarding' ? Utils.today() : null)
    };
    if (targetRole === 'employee' || targetRole === 'dept_manager' || targetRole === 'hr_manager' || targetRole === 'superadmin') {
      updates.onboardingStatus = 'completed';
    } else if (targetRole === 'onboarding') {
      updates.onboardingStatus = 'in_progress';
    }
    DB.update('employees', Number(empId), updates);

    // Sync with users collection
    const users = DB.get('users') || [];
    let user = users.find(u => u.employeeId === Number(empId));
    if (user) {
      user.role = targetRole;
      DB.set('users', users);
    } else {
      // Create user if one did not exist
      const username = emp.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || `emp${emp.id}`;
      user = {
        id: DB.nextId('users'),
        employeeId: emp.id,
        username,
        password: 'emp123',
        role: targetRole,
        status: 'active',
        lastLogin: null
      };
      users.push(user);
      DB.set('users', users);
    }

    // Update active session if editing current user's role
    if (Auth.user && Auth.user.employeeId === Number(empId)) {
      Auth._user.role = targetRole;
      sessionStorage.setItem('hrm_session', JSON.stringify({ user: Auth._user, employee: Auth._employee }));
    }

    const logDetail = `Role changed for ${emp.fullName} (${emp.empNo}) from "${prevRole}" to "${targetRole}"${reason ? `. Reason: ${reason}` : ''}`;
    DB.log('ROLE_ASSIGNMENT', 'Employees', logDetail, Auth.user?.id);

    Toast.show(
      `Role Successfully Updated!`,
      'success',
      `${emp.fullName} is now assigned as ${targetRole.replace(/_/g, ' ').toUpperCase()}`
    );

    Modal.close('dynamic-modal');

    // Re-render view or profile
    const isProfileActive = document.querySelector('.profile-layout');
    if (isProfileActive) {
      this.renderProfile(empId);
    } else {
      this.render();
    }
  },

  showManageLoginModal(empId) {
    if (Auth.role !== 'superadmin' && Auth.role !== 'hr_manager') {
      Toast.show('Permission denied: Only HR Manager and Super Admin can manage login accounts.', 'error');
      return;
    }
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const users = DB.get('users') || [];
    const user = users.find(u => u.employeeId === emp.id);

    if (!user) {
      this.createLoginForEmployee(empId);
      return;
    }

    Modal.show({
      size: 'modal-md',
      title: `<div style="display:flex;align-items:center;gap:10px">
        <i class="fa fa-key" style="color:var(--primary)"></i>
        <span>Manage Login Credentials — ${emp.fullName}</span>
      </div>`,
      body: `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:16px">
          <div style="font-size:13.5px;font-weight:700;color:var(--text)">${emp.fullName} (${emp.empNo})</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:2px">
            ${Utils.getDesigName(emp.designationId)} • Assigned Role: <strong>${user.role}</strong>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Login Username</label>
          <input class="form-control" id="ml-username" value="${user.username}">
          <div style="font-size:11px;color:var(--text-3);margin-top:4px">Unique username used by the employee to sign in.</div>
        </div>

        <div class="form-group">
          <label class="form-label required">Reset Password</label>
          <div style="display:flex;gap:6px">
            <input class="form-control" id="ml-password" value="${user.password}">
            <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('ml-password').value='emp'+Math.floor(100+Math.random()*900)" title="Generate random password">
              <i class="fa fa-shuffle"></i>
            </button>
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:4px">Enter a new password or generate a random temporary password.</div>
        </div>

        <div class="form-group">
          <label class="form-label">Login Account Status</label>
          <select class="form-control" id="ml-status">
            <option value="active" ${user.status==='active'?'selected':''}>Active (Allowed to Sign In)</option>
            <option value="inactive" ${user.status==='inactive'?'selected':''}>Suspended / Inactive (Sign In Blocked)</option>
          </select>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-secondary" onclick="Employees.copyCredentials(document.getElementById('ml-username').value, document.getElementById('ml-password').value, '${user.role}')">
          <i class="fa fa-copy"></i> Copy Details
        </button>
        <button class="btn btn-primary" onclick="
          const newUsername = document.getElementById('ml-username').value.trim();
          const newPassword = document.getElementById('ml-password').value.trim();
          const newStatus = document.getElementById('ml-status').value;
          if (!newUsername || !newPassword) { Toast.show('Username and password cannot be empty.', 'error'); return; }
          const allUsers = DB.get('users') || [];
          const uIdx = allUsers.findIndex(u => u.id === ${user.id});
          if (uIdx >= 0) {
            allUsers[uIdx].username = newUsername;
            allUsers[uIdx].password = newPassword;
            allUsers[uIdx].status = newStatus;
            DB.set('users', allUsers);
            DB.log('UPDATE', 'Auth', 'Updated login credentials for employee ${emp.fullName} (${emp.empNo})', Auth.user?.id);
            Toast.show('Login credentials updated successfully!', 'success');
            Modal.close('dynamic-modal');
            Employees.renderProfile(${emp.id});
          }
        ">
          <i class="fa fa-save"></i> Save Changes
        </button>
      `
    });
  },

  createLoginForEmployee(empId) {
    const emp = DB.find('employees', Number(empId));
    if (!emp) return;
    const users = DB.get('users') || [];
    const username = emp.email ? emp.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') : `emp${emp.id}`;
    const password = 'emp123';
    const role = emp.role || 'employee';

    const newUser = {
      id: DB.nextId('users'),
      employeeId: emp.id,
      username,
      password,
      role,
      status: 'active',
      lastLogin: null
    };
    users.push(newUser);
    DB.set('users', users);

    DB.log('ADD', 'Auth', `Created new login account "${username}" for ${emp.fullName} with role "${role}"`, Auth.user?.id);
    Toast.show(`Login account created for ${emp.fullName}!`, 'success', `Username: ${username} | Password: ${password}`);
    this.showCredentialsCreatedModal(emp, newUser, password);
  },

  exportEmployees() {
    const emps = this.getFiltered();
    const csv = ['Employee #,Name,Department,Designation,Email,Phone,Join Date,Status']
      .concat(emps.map(e => [e.empNo, e.fullName, Utils.getDeptName(e.departmentId), Utils.getDesigName(e.designationId), e.email, e.phone, e.joiningDate, e.status].join(',')))
      .join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click();
    URL.revokeObjectURL(url);
    Toast.show('Employees exported!', 'success');
  },

  printProfile(empId) {
    window.print();
  },
};

