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
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';
    const myEmpId = Auth.employee?.id;

    // Staff role subtab access guard: redirect unallowed admin subtabs
    const staffAllowedViews = ['hr_letters', 'discipline', 'doc_expiry', 'edms', 'dependents_events', 'directory', 'orgchart'];
    if (isStaff && !staffAllowedViews.includes(this.currentView)) {
      this.currentView = 'hr_letters';
    }

    const depts = DB.get('departments');
    let docs = DB.get('document_expiries') || [];
    if (isStaff && myEmpId) {
      docs = docs.filter(d => d.employeeId === myEmpId);
    }
    const urgentDocs = docs.filter(d => {
      const days = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000*60*60*24));
      return days <= 30;
    }).length;
    const pendingExits = isStaff ? 0 : (DB.get('exit_clearances') || []).filter(c => c.status === 'in_progress').length;
    const pendingDiscipline = isStaff 
      ? (DB.get('warning_letters')||[]).filter(w=>w.employeeId===myEmpId && !w.acknowledged).length 
      : (DB.get('disciplinary_actions')||[]).filter(a=>a.status==='under_investigation').length;

    const tabs = isStaff ? [
      { id:'hr_letters', label:'My Official HR Letters', icon:'fa-file-signature', badge: (DB.get('hr_letters')||[]).filter(l=>l.employeeId===myEmpId && !l.acknowledged).length },
      { id:'discipline', label:'My Discipline & Notices', icon:'fa-gavel', badge: pendingDiscipline },
      { id:'doc_expiry', label:'My Document Expiries', icon:'fa-id-card-clip', badge: urgentDocs },
      { id:'edms', label:'e-DMS Document Vault', icon:'fa-folder-open', badge: (DB.get('employee_documents')||[]).filter(d=>d.employeeId===myEmpId && d.verificationStatus==='pending').length },
      { id:'dependents_events', label:'Dependents & Life Events', icon:'fa-people-roof' },
      { id:'directory', label:'Company Directory', icon:'fa-id-card' },
      { id:'orgchart', label:'Org Chart', icon:'fa-sitemap' },
    ] : [
      { id:'current', label:'Active Employees', icon:'fa-users' },
      { id:'onboarding', label:'New Joiners (Onboarding)', icon:'fa-user-clock', badge: (DB.get('employees')||[]).filter(e=>e.role==='onboarding').length },
      { id:'ex', label:'Ex Employees', icon:'fa-user-xmark' },
      { id:'directory', label:'Directory', icon:'fa-id-card' },
      { id:'orgchart', label:'Org Chart', icon:'fa-sitemap' },
      { id:'doc_expiry', label:'Document Expiry', icon:'fa-id-card-clip', badge: urgentDocs },
      { id:'exit_clearance', label:'Exit & Clearance (F&F)', icon:'fa-user-minus', badge: pendingExits },
      { id:'discipline', label:'Discipline & Compliance', icon:'fa-gavel', badge: pendingDiscipline },
      { id:'hr_letters', label:'HR Letters', icon:'fa-file-signature' },
      { id:'dependents_events', label:'Dependents & Life Events', icon:'fa-people-roof', badge: (DB.get('life_events')||[]).filter(e=>e.status==='pending').length },
      { id:'edms', label:'e-DMS Document Vault', icon:'fa-folder-open', badge: (DB.get('employee_documents')||[]).filter(d=>d.verificationStatus==='pending').length },
    ];

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Sub-tabs -->
        <div style="display:flex;gap:4px;margin-bottom:20px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;flex-wrap:wrap">
          ${tabs.map(t => `
            <button class="tab-toggle-btn ${this.currentView === t.id ? 'active' : ''}" onclick="Employees.switchView('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
              ${t.badge ? `<span class="badge ${t.id==='doc_expiry'||t.id==='hr_letters'||t.id==='discipline'?'badge-danger':'badge-warning'}" style="margin-left:6px;font-size:10px;padding:2px 6px">${t.badge}</span>` : ''}
            </button>
          `).join('')}
        </div>

        ${!['orgchart','doc_expiry','exit_clearance','hr_letters','dependents_events','edms','discipline'].includes(this.currentView) ? `
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
        ` : ''}

        <!-- Content Area -->
        <div id="emp-content"></div>
      </div>

      <style>
        .tab-toggle-btn { padding:8px 16px;border:none;background:transparent;color:var(--text-3);font-size:12.5px;font-weight:500;border-radius:7px;cursor:pointer;transition:all .2s; }
        .tab-toggle-btn.active { background:var(--primary);color:white;box-shadow:0 2px 8px var(--primary-glow); }
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
    let emps = DB.get('employees') || [];
    emps = Auth.getScopedEmployees(emps);
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
    const container = document.getElementById('emp-content');
    if (!container) return;

    if (this.currentView === 'orgchart') {
      this.renderOrgChart(container);
      return;
    }
    if (this.currentView === 'doc_expiry') {
      this.renderDocExpiry(container);
      return;
    }
    if (this.currentView === 'exit_clearance') {
      this.renderExitClearance(container);
      return;
    }
    if (this.currentView === 'hr_letters') {
      this.renderHRLetters(container);
      return;
    }
    if (this.currentView === 'dependents_events') {
      this.renderDependentsAndLifeEvents(container);
      return;
    }
    if (this.currentView === 'edms') {
      this.renderDocumentVault(container);
      return;
    }
    if (this.currentView === 'discipline') {
      this.renderDiscipline(container);
      return;
    }

    const emps = this.getFiltered();

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
              <!-- Clickable photo thumbnail -->
              <div style="position:relative;width:62px;height:72px;flex-shrink:0;cursor:${(isHR || Auth.employee?.id === emp.id) ? 'pointer' : 'default'};"
                ${(isHR || Auth.employee?.id === emp.id) ? `onclick="Employees.showUploadPhotoModal(${emp.id})" title="Click to upload / change photo" ` : ''}>
                <div style="width:62px;height:72px;border:1.5px solid ${(isHR || Auth.employee?.id === emp.id) ? 'var(--primary)' : '#cbd5e1'};border-radius:6px;overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
                  ${emp.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName}" id="profile-photo-thumb">` : `
                    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${Utils.avatarColor(emp.id)};color:#fff;font-size:22px;font-weight:700">
                      ${Utils.avatarInitials(emp.fullName)}
                    </div>
                  `}
                </div>
                ${(isHR || Auth.employee?.id === emp.id) ? `
                  <!-- Camera hover overlay -->
                  <div class="photo-upload-overlay" style="position:absolute;inset:0;background:rgba(2,132,199,0.72);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;pointer-events:none">
                    <i class="fa fa-camera" style="font-size:16px;color:#fff"></i>
                    <span style="font-size:9px;color:#fff;font-weight:700;margin-top:3px">EDIT</span>
                  </div>
                ` : ''}
              </div>
              <div style="overflow:hidden">
                <h3 style="font-size:17px;font-weight:700;color:#0284c7;margin:0;line-height:1.2;white-space:nowrap;text-overflow:ellipsis;overflow:hidden">${emp.fullName}</h3>
                <div style="font-size:12.5px;font-weight:600;color:var(--text-2);margin-top:6px">EMP ID: ${String(emp.empNo||emp.id).replace('EMP-', '')}</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden">${Utils.getDesigName(emp.designationId)}</div>
                ${(isHR || Auth.employee?.id === emp.id) ? `
                  <button class="btn btn-ghost btn-xs" onclick="Employees.showUploadPhotoModal(${emp.id})" style="margin-top:5px;font-size:10px;padding:2px 7px;color:var(--primary)">
                    <i class="fa fa-camera" style="font-size:9px"></i> Edit Photo
                  </button>
                ` : ''}
              </div>
            </div>

            <style>
              .photo-upload-overlay { pointer-events: none; }
              [style*="cursor:pointer"]:hover .photo-upload-overlay { opacity: 1 !important; }
            </style>

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
              <button class="btn btn-outline btn-sm w-full" style="color:var(--primary)" onclick="Employees.showDigitalBadge(${emp.id})">
                <i class="fa fa-id-card"></i> Digital Smart Badge (QR)
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
        const normContacts = (DB.get('emergency_contacts') || []).filter(c => c.employeeId === emp.id);
        const ec = emp.emergencyContact || {};
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager' || Auth.employee?.id === emp.id;
        const addBtn = canEdit ? `<button class="btn btn-primary btn-sm" onclick="Employees.showAddEmergencyContactModal(${emp.id})"><i class="fa fa-plus"></i> Add Contact</button>` : '';

        return `
          ${sectionHeader('Emergency Contacts', 'Immediate relatives and next-of-kin for critical notifications', addBtn)}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:12px;letter-spacing:0.5px">
                <i class="fa fa-user-shield" style="margin-right:6px"></i> ${normContacts.length ? `Registered Emergency Contacts (${normContacts.length})` : 'Primary Emergency Contact'}
              </div>
              ${normContacts.length ? normContacts.map(c => `
                <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed var(--border)">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-weight:700;font-size:13.5px">${c.name}</span>
                    ${c.isPrimary ? '<span class="badge badge-primary" style="font-size:9.5px"><i class="fa fa-star"></i> Primary</span>' : '<span class="badge badge-secondary" style="font-size:9.5px">Secondary</span>'}
                  </div>
                  <div style="font-size:12px;color:var(--primary);font-weight:600;margin-top:2px">${c.relation}</div>
                  <div style="font-size:12px;color:var(--text);margin-top:3px"><i class="fa fa-phone" style="width:14px;color:var(--text-3)"></i>${c.phone}</div>
                  ${c.altPhone ? `<div style="font-size:11.5px;color:var(--text-3)"><i class="fa fa-mobile" style="width:14px"></i>${c.altPhone}</div>` : ''}
                </div>
              `).join('') : `
                ${row('Contact Name', ec.name || 'Not Provided')}
                ${row('Relationship', ec.relation || '—')}
                ${row('Emergency Phone', ec.phone || '—')}
                ${row('Residence', emp.address || '—')}
              `}
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
        const canEditPhoto = isHR || isSelf;
        const changeBtn = canEditPhoto ? `<button class="btn btn-primary btn-sm" onclick="Employees.showUploadPhotoModal(${emp.id})"><i class="fa fa-camera"></i> Change / Upload Photo</button>` : '';
        return `
          ${sectionHeader('Official Photograph', 'Biometric portrait for identification cards and access gates', changeBtn)}
          <div style="display:flex;align-items:flex-start;gap:28px;flex-wrap:wrap;background:var(--surface);padding:24px;border-radius:12px;border:1px solid var(--border)">
            <!-- Large Photo with click-to-change overlay -->
            <div style="position:relative;width:160px;height:190px;flex-shrink:0" ${canEditPhoto ? `onclick="Employees.showUploadPhotoModal(${emp.id})" title="Click to change photo"` : ''}>
              <div style="width:160px;height:190px;border:2px solid var(--primary);border-radius:8px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md)">
                ${emp.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName}">` : `
                  <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${Utils.avatarColor(emp.id)};color:#fff;font-size:52px;font-weight:800">
                    ${Utils.avatarInitials(emp.fullName)}
                  </div>
                `}
              </div>
              ${canEditPhoto ? `
                <div style="position:absolute;inset:0;background:rgba(2,132,199,0.7);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;cursor:pointer" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">
                  <i class="fa fa-camera" style="font-size:28px;color:#fff;margin-bottom:6px"></i>
                  <span style="font-size:12px;color:#fff;font-weight:700">Click to Edit</span>
                </div>
              ` : ''}
            </div>
            <div style="flex:1;min-width:240px">
              <h4 style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px">${emp.fullName}</h4>
              <div style="font-size:13px;color:var(--text-3);margin-bottom:12px">EMP ID: <strong>${emp.empNo}</strong> • ${Utils.getDesigName(emp.designationId)}</div>
              ${canEditPhoto ? `
                <button class="btn btn-primary btn-sm" onclick="Employees.showUploadPhotoModal(${emp.id})" style="margin-bottom:14px;width:100%">
                  <i class="fa fa-upload"></i> Upload / Change Photograph
                </button>
                ${emp.photo ? `<button class="btn btn-danger btn-sm" onclick="Employees.removePhoto(${emp.id})" style="margin-bottom:14px;width:100%"><i class="fa fa-trash"></i> Remove Current Photo</button>` : ''}
              ` : ''}
              <div style="background:var(--card);border:1px dashed var(--border);border-radius:8px;padding:12px;font-size:12px;color:var(--text-2);line-height:1.6">
                <div><i class="fa fa-circle-check" style="color:var(--success);margin-right:6px"></i>White or light blue background standard.</div>
                <div><i class="fa fa-circle-check" style="color:var(--success);margin-right:6px"></i>Passport size portrait framing (300x350px).</div>
                <div><i class="fa fa-circle-check" style="color:var(--success);margin-right:6px"></i>Max file size: 5 MB (JPG, PNG supported).</div>
                <div><i class="fa fa-circle-check" style="color:var(--success);margin-right:6px"></i>Synchronized with main Biometric turnstile system.</div>
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
        const normSkills = (DB.get('employee_skills') || []).filter(s => s.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager' || Auth.employee?.id === emp.id;
        const addBtn = canEdit ? `<button class="btn btn-primary btn-sm" onclick="Employees.showAddSkillModal(${emp.id})"><i class="fa fa-plus"></i> Add Skill</button>` : '';

        const skillsList = normSkills.length > 0 ? normSkills.map(s => ({
          name: s.skillName,
          cat: s.category || 'Technical',
          pct: s.proficiency === 'expert' ? 95 : (s.proficiency === 'advanced' ? 85 : (s.proficiency === 'intermediate' ? 65 : 40)),
          level: s.proficiency,
          yrs: s.yearsOfExperience
        })) : (emp.skillsList || [
          { name: 'Technical Architecture & Coding', pct: 90, cat: 'Technical', level: 'expert' },
          { name: 'Problem Solving & Debugging', pct: 85, cat: 'Technical', level: 'advanced' },
          { name: 'Agile Team Collaboration', pct: 80, cat: 'Management', level: 'advanced' },
          { name: 'Quality Assurance & Delivery', pct: 85, cat: 'Technical', level: 'advanced' }
        ]);

        return `
          ${sectionHeader('Skills & Core Competencies', 'Technical proficiencies, operational capabilities and soft skills', addBtn)}
          <div style="display:flex;flex-direction:column;gap:14px">
            ${skillsList.map(s => `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                  <span style="font-weight:600;font-size:13.5px">${s.name} <span class="chip" style="margin-left:6px">${s.cat}</span></span>
                  <div style="display:flex;align-items:center;gap:8px">
                    ${s.level ? `<span class="badge badge-secondary" style="font-size:10px;text-transform:capitalize">${s.level}</span>` : ''}
                    <span style="font-weight:700;color:var(--primary);font-size:13px">${s.pct}%</span>
                  </div>
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
    const emp = DB.find('employees', empId);
    window._tempPhotoData = null;
    Modal.show('Upload / Change Profile Photo', `
      <div style="text-align:center;margin-bottom:16px">
        <!-- Current / Preview Photo -->
        <div id="photo-preview-wrap" style="width:120px;height:142px;border:2.5px solid var(--primary);border-radius:8px;overflow:hidden;margin:0 auto 10px;background:var(--surface);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md)">
          ${emp?.photo
            ? `<img id="photo-preview-img" src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="photo">`
            : `<div id="photo-preview-init" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${Utils.avatarColor(empId)};color:#fff;font-size:40px;font-weight:800">${Utils.avatarInitials(emp?.fullName||'')}</div>`
          }
        </div>
        <div style="font-size:12px;color:var(--text-3)">${emp?.photo ? '<span style="color:var(--success)"><i class="fa fa-circle-check"></i> Current photo</span>' : 'No photo uploaded yet'}</div>
      </div>

      <!-- Drag & Drop / Click to pick -->
      <div id="photo-drop-zone"
        style="border:2px dashed var(--primary);border-radius:10px;padding:22px 16px;text-align:center;cursor:pointer;transition:background .2s;background:var(--surface)"
        onclick="document.getElementById('photo-file-input').click()"
        ondragover="event.preventDefault();this.style.background='rgba(2,132,199,0.08)'"
        ondragleave="this.style.background='var(--surface)'"
        ondrop="Employees.onPhotoFileDrop(event)">
        <i class="fa fa-cloud-arrow-up" style="font-size:28px;color:var(--primary);display:block;margin-bottom:8px"></i>
        <div style="font-size:13.5px;font-weight:600;color:var(--text)">Click to select or drag &amp; drop</div>
        <div style="font-size:11.5px;color:var(--text-3);margin-top:4px">JPG, PNG, WEBP • Max 5 MB</div>
      </div>
      <input type="file" id="photo-file-input" accept="image/*" style="display:none" onchange="Employees.onPhotoFilePicked(event)">

      <div style="margin-top:12px">
        <label class="form-label" style="font-size:12px">Or paste an image URL</label>
        <input class="form-control" id="photo-url-input" placeholder="https://example.com/photo.jpg" style="font-size:13px">
      </div>

      ${emp?.photo ? `
        <div style="margin-top:10px;text-align:center">
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);font-size:12px" onclick="Employees.removePhoto(${empId});Modal.close('dynamic-modal')">
            <i class="fa fa-trash"></i> Remove Current Photo
          </button>
        </div>
      ` : ''}
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.savePhoto(${empId})"><i class="fa fa-save"></i> Save Photo</button>
      `
    });
  },

  onPhotoFileDrop(event) {
    event.preventDefault();
    document.getElementById('photo-drop-zone').style.background = 'var(--surface)';
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      Employees._readPhotoFile(file);
    } else {
      Toast.show('Please drop a valid image file', 'error');
    }
  },

  onPhotoFilePicked(event) {
    const file = event.target.files[0];
    if (file) Employees._readPhotoFile(file);
  },

  _readPhotoFile(file) {
    if (file.size > 5 * 1024 * 1024) { Toast.show('File too large — max 5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      window._tempPhotoData = e.target.result;
      // Update the live preview inside the modal
      const wrap = document.getElementById('photo-preview-wrap');
      if (wrap) wrap.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
      // clear the URL input since a file was picked
      const urlInput = document.getElementById('photo-url-input');
      if (urlInput) urlInput.value = '';
      Toast.show('Photo ready — click Save to apply', 'info');
    };
    reader.readAsDataURL(file);
  },

  removePhoto(empId) {
    const emps = DB.get('employees') || [];
    const emp = emps.find(e => e.id === empId);
    if (emp) { emp.photo = null; DB.set('employees', emps); }
    Toast.show('Photo removed', 'success');
    this.renderProfile(empId);
    // Refresh topbar/sidebar if it's the logged-in user
    if (Auth.employee?.id === empId) { App.renderSidebar(); App.renderTopbar(); }
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
    // Refresh topbar/sidebar if it's the logged-in user
    if (Auth.employee?.id === empId) {
      // Re-read updated employee into Auth session
      const updated = DB.find('employees', empId);
      if (updated) {
        const session = JSON.parse(sessionStorage.getItem('hrm_session') || '{}');
        session.employee = updated;
        sessionStorage.setItem('hrm_session', JSON.stringify(session));
        Auth._employee = updated;
      }
      App.renderSidebar();
      App.renderTopbar();
    }
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

    // Rule: One correction request is required against one date.
    // Multiple requests for the same date are NOT allowed unless previous request was rejected.
    const activeExisting = corrections.find(c => 
      c.employeeId === empId && 
      c.date === date && 
      c.status !== 'rejected'
    );

    if (activeExisting) {
      const statusLabel = activeExisting.status === 'approved' 
        ? 'has already been approved' 
        : activeExisting.status === 'manager_approved' 
          ? 'is endorsed by manager and awaiting final HR approval' 
          : 'is currently pending review';
      Toast.show(`A correction request for ${Utils.formatDate(date)} ${statusLabel}. Multiple requests for the same date are not allowed unless rejected.`, 'error');
      return;
    }

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
      case 'Emergency Contact': {
        const normContacts = (DB.get('emergency_contacts') || []).filter(c => c.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager' || Auth.employee?.id === emp.id;
        if (normContacts.length > 0) {
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
              <div style="font-size:13px;font-weight:700;color:var(--text)"><i class="fa fa-phone-volume" style="color:var(--primary);margin-right:6px"></i>Registered Emergency Contacts (${normContacts.length})</div>
              ${canEdit ? `<button class="btn btn-primary btn-xs" onclick="Employees.showAddEmergencyContactModal(${emp.id})"><i class="fa fa-plus"></i> Add Emergency Contact</button>` : ''}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px">
              ${normContacts.map(c => `
                <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px;position:relative">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                    <span style="font-weight:700;font-size:14px;color:var(--text)">${c.name}</span>
                    ${c.isPrimary ? '<span class="badge badge-primary" style="font-size:10px"><i class="fa fa-star"></i> Primary</span>' : '<span class="badge badge-secondary" style="font-size:10px">Secondary</span>'}
                  </div>
                  <div style="font-size:12px;color:var(--primary);font-weight:600;margin-bottom:6px"><i class="fa fa-people-arrows" style="margin-right:4px"></i>${c.relation}</div>
                  <div style="font-size:12.5px;color:var(--text);margin-bottom:3px"><i class="fa fa-phone" style="width:16px;color:var(--text-3)"></i><strong>${c.phone}</strong></div>
                  ${c.altPhone ? `<div style="font-size:12px;color:var(--text-3);margin-bottom:3px"><i class="fa fa-mobile" style="width:16px"></i>${c.altPhone}</div>` : ''}
                  ${c.address ? `<div style="font-size:11.5px;color:var(--text-3);margin-top:6px"><i class="fa fa-location-dot" style="width:16px"></i>${c.address}</div>` : ''}
                </div>
              `).join('')}
            </div>
          `;
        }
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div style="font-size:13px;font-weight:700;color:var(--text)"><i class="fa fa-phone-volume" style="color:var(--primary);margin-right:6px"></i>Primary Emergency Contact</div>
            ${canEdit ? `<button class="btn btn-primary btn-xs" onclick="Employees.showAddEmergencyContactModal(${emp.id})"><i class="fa fa-plus"></i> Add Emergency Contact</button>` : ''}
          </div>
          ${row('Contact Name', emp.emergencyContact?.name)}
          ${row('Relation', emp.emergencyContact?.relation)}
          ${row('Phone', emp.emergencyContact?.phone)}
        `;
      }
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
      case 'Qualification': {
        const educations = (DB.get('educations') || []).filter(e => e.employeeId === emp.id);
        const certs = (DB.get('employee_certificates') || []).filter(c => c.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager' || Auth.employee?.id === emp.id;

        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:14px;font-weight:700;color:var(--text)"><i class="fa fa-user-graduate" style="color:var(--primary);margin-right:6px"></i>Academic Degrees & Education</div>
            ${canEdit ? `<button class="btn btn-primary btn-xs" onclick="Employees.showAddEducationModal(${emp.id})"><i class="fa fa-plus"></i> Add Degree / Education</button>` : ''}
          </div>

          ${educations.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
              ${educations.map(ed => `
                <div style="padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
                  <div>
                    <div style="font-weight:700;font-size:14px;color:var(--text);display:flex;align-items:center;gap:8px">
                      ${ed.degree} ${ed.fieldOfStudy ? `<span style="font-weight:500;color:var(--text-2)">— in ${ed.fieldOfStudy}</span>` : ''}
                      ${ed.verified ? '<span class="badge badge-success" style="font-size:10px"><i class="fa fa-check-double"></i> Verified</span>' : ''}
                    </div>
                    <div style="font-size:12px;color:var(--text-3);margin-top:4px">
                      <i class="fa fa-building-columns" style="margin-right:4px"></i>${ed.institution} • Passed: <strong>${ed.year}</strong> ${ed.grade ? `• Grade/CGPA: <strong>${ed.grade}</strong>` : ''}
                    </div>
                  </div>
                  <span class="chip" style="font-size:11px"><i class="fa fa-certificate"></i> Higher Education</span>
                </div>
              `).join('')}
            </div>
          ` : (emp.qualifications?.length ? emp.qualifications.map(q => `
            <div style="padding:14px;background:var(--surface);border-radius:8px;margin-bottom:8px">
              <div style="font-weight:600;font-size:14px">${q.degree}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:4px">${q.institution} • ${q.year} • Grade: ${q.grade}</div>
            </div>
          `).join('') : '<div class="text-muted text-sm mb-16">No formal degrees recorded.</div>')}

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-top:12px;border-top:1px solid var(--border)">
            <div style="font-size:14px;font-weight:700;color:var(--text)"><i class="fa fa-award" style="color:var(--accent);margin-right:6px"></i>Professional Certifications & Licenses</div>
            ${canEdit ? `<button class="btn btn-secondary btn-xs" onclick="Employees.showAddCertificateModal(${emp.id})"><i class="fa fa-plus"></i> Add Certification</button>` : ''}
          </div>

          ${certs.length > 0 ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px">
              ${certs.map(c => `
                <div style="padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <span style="font-weight:700;font-size:13.5px;color:var(--text)">${c.title}</span>
                    <span class="badge ${c.verificationStatus==='verified'?'badge-success':'badge-warning'}" style="font-size:10px">${c.verificationStatus.toUpperCase()}</span>
                  </div>
                  <div style="font-size:12px;color:var(--primary);font-weight:600;margin-bottom:4px"><i class="fa fa-landmark" style="margin-right:4px"></i>${c.issuingOrg}</div>
                  <div style="font-size:11.5px;color:var(--text-3)">Issued: ${Utils.formatDate(c.issueDate)} ${c.expiryDate ? `• Expires: ${Utils.formatDate(c.expiryDate)}` : '• No Expiry'}</div>
                  ${c.credentialId ? `<div style="font-size:10.5px;font-family:monospace;color:var(--text-3);margin-top:4px">ID: ${c.credentialId}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : '<div class="text-muted text-sm">No professional certifications on file.</div>'}
        `;
      }
      case 'Experience': {
        const experiences = (DB.get('work_experiences') || []).filter(w => w.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager' || Auth.employee?.id === emp.id;

        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:14px;font-weight:700;color:var(--text)"><i class="fa fa-briefcase" style="color:var(--primary);margin-right:6px"></i>Prior Employment & Work History</div>
            ${canEdit ? `<button class="btn btn-primary btn-xs" onclick="Employees.showAddExperienceModal(${emp.id})"><i class="fa fa-plus"></i> Add Work Experience</button>` : ''}
          </div>

          ${experiences.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:12px">
              ${experiences.map(ex => `
                <div style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
                    <div>
                      <div style="font-weight:700;font-size:14.5px;color:var(--text)">${ex.jobTitle || ex.designation}</div>
                      <div style="font-size:13px;color:var(--primary);font-weight:600;margin-top:2px"><i class="fa fa-building" style="margin-right:4px"></i>${ex.company}</div>
                      ${ex.location ? `<div style="font-size:11.5px;color:var(--text-3);margin-top:2px"><i class="fa fa-location-dot" style="margin-right:4px"></i>${ex.location}</div>` : ''}
                    </div>
                    <div style="text-align:right">
                      <span class="chip" style="font-size:11px">
                        ${Utils.formatDate(ex.from)} — ${ex.isCurrent ? '<span class="badge badge-success" style="padding:2px 6px">Current</span>' : Utils.formatDate(ex.to)}
                      </span>
                    </div>
                  </div>
                  ${ex.responsibilities ? `<div style="font-size:12.5px;color:var(--text-2);margin-top:10px;line-height:1.5;padding-top:8px;border-top:1px dashed var(--border)">${ex.responsibilities}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : (emp.experience?.length ? emp.experience.map(ex => `
            <div style="padding:14px;background:var(--surface);border-radius:8px;margin-bottom:8px">
              <div style="font-weight:600;font-size:14px">${ex.designation}</div>
              <div style="font-size:12px;color:var(--primary);margin-top:3px">${ex.company}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:3px">${ex.from} — ${ex.to}</div>
            </div>
          `).join('') : '<div class="text-muted text-sm">No prior work experience recorded.</div>')}
        `;
      }
      case 'Skills': {
        const skills = (DB.get('employee_skills') || []).filter(s => s.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager' || Auth.employee?.id === emp.id;

        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:14px;font-weight:700;color:var(--text)"><i class="fa fa-bolt" style="color:var(--warning);margin-right:6px"></i>Skill Matrix & Core Competencies</div>
            ${canEdit ? `<button class="btn btn-primary btn-xs" onclick="Employees.showAddSkillModal(${emp.id})"><i class="fa fa-plus"></i> Add Skill</button>` : ''}
          </div>

          ${skills.length > 0 ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px">
              ${skills.map(s => {
                const pct = s.proficiency === 'expert' ? 95 : (s.proficiency === 'advanced' ? 85 : (s.proficiency === 'intermediate' ? 65 : 40));
                const badgeColor = s.proficiency === 'expert' ? 'badge-primary' : (s.proficiency === 'advanced' ? 'badge-success' : 'badge-info');
                return `
                  <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                      <span style="font-weight:700;font-size:13.5px;color:var(--text)">${s.skillName}</span>
                      <span class="badge ${badgeColor}" style="font-size:10px;text-transform:capitalize">${s.proficiency}</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:var(--text-3);margin-bottom:8px">
                      <span><i class="fa fa-tag" style="margin-right:4px"></i>${s.category || 'General'}</span>
                      <span>${s.yearsOfExperience ? `${s.yearsOfExperience} yrs exp` : ''}</span>
                    </div>
                    <div class="progress" style="height:6px;background:var(--border)"><div class="progress-bar" style="width:${pct}%;background:var(--primary)"></div></div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<div class="text-muted text-sm">No skills recorded yet. Click "Add Skill" to register competencies.</div>'}
        `;
      }
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
        const attendees = (DB.get('training_attendees') || []).filter(a => a.employeeId === emp.id);
        const tCerts = (DB.get('training_certificates') || []).filter(c => c.employeeId === emp.id);
        const sessions = DB.get('training_sessions') || [];

        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:14px;font-weight:700;color:var(--text)"><i class="fa fa-graduation-cap" style="color:var(--primary);margin-right:6px"></i>LMS Training Sessions & Enrollment History</div>
          </div>

          ${attendees.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
              ${attendees.map(a => {
                const s = sessions.find(x => x.id === a.sessionId) || {};
                return `
                  <div style="padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
                    <div>
                      <div style="font-weight:700;font-size:14px;color:var(--text);display:flex;align-items:center;gap:8px">
                        ${s.title || 'Corporate Training Session'}
                        <code style="font-size:11px;color:var(--primary)">${s.sessionCode || ''}</code>
                      </div>
                      <div style="font-size:12px;color:var(--text-3);margin-top:4px">
                        <i class="fa fa-chalkboard-user" style="margin-right:4px"></i>Trainer: <strong>${s.trainerName || 'Corporate Faculty'}</strong> • 
                        <i class="fa fa-clock" style="margin-left:6px;margin-right:4px"></i>${s.creditHours || 8} CPD Hours • 
                        ${s.mode === 'online' ? '<i class="fa fa-video" style="color:var(--info)"></i> Virtual' : '<i class="fa fa-building" style="color:var(--primary)"></i> On-Premise'}
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      <span class="badge ${a.attendanceStatus==='completed'?'badge-success':'badge-warning'}" style="text-transform:capitalize">${a.attendanceStatus}</span>
                      ${a.postTestScore ? `<span class="badge badge-info">${a.postTestScore}%</span>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : (DB.get('trainings').filter(t => t.employeeId === emp.id).length > 0 ? DB.get('trainings').filter(t => t.employeeId === emp.id).map(t => `
            <div style="padding:14px;background:var(--surface);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:600">${t.title}</div>
                <div style="font-size:12px;color:var(--text-3)">${t.provider} • ${Utils.formatDate(t.from)} to ${Utils.formatDate(t.to)}</div>
                <div style="font-size:12px;color:var(--text-3)">Cost: ${Utils.formatCurrency(t.cost)} ${t.certificate ? '• 🎓 Certificate Earned' : ''}</div>
              </div>
              ${Utils.statusBadge(t.status)}
            </div>
          `).join('') : '<div class="text-muted text-sm mb-16">No training session enrollments on record.</div>')}

          <!-- Verified Training Certificates -->
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px;padding-top:14px;border-top:1px solid var(--border)">
            <i class="fa fa-certificate" style="color:var(--warning);margin-right:6px"></i>Earned CPD Training Certificates (${tCerts.length})
          </div>

          ${tCerts.length > 0 ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:14px">
              ${tCerts.map(tc => `
                <div style="background:var(--surface);border:1.5px solid var(--primary);border-radius:10px;padding:16px;position:relative">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                    <span style="font-weight:800;font-size:13.5px;color:var(--primary)"><i class="fa fa-award" style="margin-right:6px"></i>${tc.title}</span>
                    <span class="badge badge-success" style="font-size:10px">VERIFIED</span>
                  </div>
                  <div style="font-size:12px;color:var(--text);margin-bottom:4px">Credential ID: <code>${tc.certificateNo}</code></div>
                  <div style="font-size:11.5px;color:var(--text-3);margin-bottom:10px">Issued: ${Utils.formatDate(tc.issuedDate)} • Score: <strong>${tc.score}%</strong></div>
                  <button class="btn btn-outline btn-xs w-full" onclick="Employees.previewTrainingCertificateModal(${tc.id})">
                    <i class="fa fa-eye"></i> View & Print CPD Certificate
                  </button>
                </div>
              `).join('')}
            </div>
          ` : '<div class="text-muted text-sm">No verified training certificates issued yet.</div>'}
        `;
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
        const fullDeps = DB.get('employee_dependents') || [];
        let deps = fullDeps.filter(d => d.employeeId === emp.id);
        if (!deps.length) {
          const legacy = DB.get('dependents').filter(d => d.employeeId === emp.id);
          deps = legacy.map(l => ({
            id: l.id,
            employeeId: l.employeeId,
            fullName: l.name,
            relation: l.relation,
            dob: l.dob,
            cnicOrBForm: l.cnic,
            isMedicalCovered: true,
            isEmergencyContact: true,
            beneficiaryPercent: 50,
            bloodGroup: '—'
          }));
        }
        const lifeEvents = (DB.get('life_events') || []).filter(e => e.employeeId === emp.id);
        const canEdit = Auth.role === 'superadmin' || Auth.role === 'hr_manager' || Auth.employee?.id === emp.id;

        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
            <div>
              <h4 style="font-size:14px;font-weight:700;color:var(--text);margin:0 0 2px 0">Family Dependents & Beneficiary Schedule</h4>
              <p style="font-size:11.5px;color:var(--text-3);margin:0">Eligible family members for Group Health TPA Cover and Life/Gratuity Beneficiaries</p>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-secondary btn-sm" onclick="Employees.showSubmitLifeEventModal(${emp.id})">
                <i class="fa fa-bullhorn"></i> Submit Life Event
              </button>
              ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="Employees.showAddDependent(${emp.id})"><i class="fa fa-plus"></i> Add Dependent</button>` : ''}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:14px;margin-bottom:24px">
            ${deps.length === 0 ? '<div class="card text-muted text-sm" style="padding:24px;text-align:center;grid-column:1/-1"><i class="fa fa-people-roof" style="font-size:28px;display:block;margin-bottom:8px"></i>No dependents registered yet.</div>' : deps.map(d => `
              <div class="card" style="padding:16px;border-radius:10px;border-left:4px solid ${d.relation==='Spouse'?'var(--accent)':d.relation==='Child'?'var(--info)':'var(--primary)'}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                  <div>
                    <div style="font-weight:700;font-size:14px;color:var(--text)">${d.fullName}</div>
                    <div style="font-size:11.5px;color:var(--text-3)">${d.relation} ${d.gender ? `(${d.gender})` : ''} • DOB: ${d.dob ? Utils.formatDate(d.dob) : '—'}</div>
                  </div>
                  <span class="badge badge-secondary" style="font-size:11px">${d.relation}</span>
                </div>

                <div style="font-size:11.5px;color:var(--text-2);margin-bottom:12px;line-height:1.6">
                  <div><strong>CNIC / B-Form:</strong> ${d.cnicOrBForm || '—'}</div>
                  <div><strong>Blood Group:</strong> <span style="color:var(--danger);font-weight:700">${d.bloodGroup || '—'}</span></div>
                  ${d.emergencyPhone ? `<div><strong>Emergency Tel:</strong> ${d.emergencyPhone}</div>` : ''}
                </div>

                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
                  ${d.isMedicalCovered ? `<span class="badge badge-success" style="font-size:10.5px"><i class="fa fa-shield-heart"></i> TPA Medical Card Active</span>` : '<span class="badge badge-secondary" style="font-size:10.5px">No Medical Cover</span>'}
                  ${d.isEmergencyContact ? `<span class="badge badge-info" style="font-size:10.5px"><i class="fa fa-phone"></i> Next-of-Kin</span>` : ''}
                  <span class="badge badge-warning" style="font-size:10.5px"><i class="fa fa-hand-holding-dollar"></i> ${d.beneficiaryPercent || 0}% Gratuity Share</span>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:10px;font-size:11px">
                  <button class="btn btn-ghost btn-xs" onclick="Employees.printDependentHealthCard(${d.id})">
                    <i class="fa fa-id-card"></i> Print Health Card
                  </button>
                  ${canEdit ? `
                    <button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="Employees.deleteDependent(${d.id}, ${emp.id})">
                      <i class="fa fa-trash"></i> Remove
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Life Events Section for Employee -->
          <div style="margin-top:20px">
            <h4 style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px"><i class="fa fa-calendar-check" style="color:var(--primary);margin-right:6px"></i>Employee Life Events History</h4>
            <p style="font-size:11.5px;color:var(--text-3);margin-bottom:12px">Notified corporate life milestones, official documents, and HR verification status</p>

            ${lifeEvents.length === 0 ? `
              <div class="card" style="padding:20px;text-align:center;color:var(--text-3);font-size:12.5px">
                No life events submitted. Use "Submit Life Event" above for marriage, childbirth, address change, or new qualifications.
              </div>
            ` : `
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Effective Date</th>
                      <th>Description</th>
                      <th>Proof Document</th>
                      <th>Status</th>
                      <th>HR Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lifeEvents.map(ev => `
                      <tr>
                        <td><strong>${ev.title}</strong></td>
                        <td>${Utils.formatDate(ev.eventDate)}</td>
                        <td style="font-size:11.5px;color:var(--text-2);max-width:280px">${ev.details}</td>
                        <td><span class="badge badge-secondary" style="font-size:10.5px"><i class="fa fa-paperclip"></i> ${ev.supportingDocName || 'Attachment'}</span></td>
                        <td>${Utils.statusBadge(ev.status)}</td>
                        <td style="font-size:11.5px">${ev.hrRemarks || (ev.status === 'pending' ? 'Pending HR Review' : 'Verified')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
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

  // ── Dependent & Life Event helpers ──
  showAddDependent(empId = null) {
    const allEmps = DB.get('employees').filter(e => e.status === 'active');
    const empSelectHtml = empId ? `
      <input type="hidden" id="dep-emp-id" value="${empId}">
      <div class="form-group">
        <label class="form-label">Employee</label>
        <input class="form-control" value="${Utils.getEmpName(empId)}" readonly disabled>
      </div>
    ` : `
      <div class="form-group">
        <label class="form-label required">Select Employee</label>
        <select class="form-control" id="dep-emp-id">
          ${allEmps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}
        </select>
      </div>
    `;

    Modal.show('Register Family Dependent & Beneficiary', `
      ${empSelectHtml}
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Full Legal Name</label>
          <input class="form-control" id="dep-name" placeholder="e.g. Ayesha Khan">
        </div>
        <div class="form-group">
          <label class="form-label required">Relationship</label>
          <select class="form-control" id="dep-rel">
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-3">
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-control" id="dep-gender">
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date of Birth</label>
          <input class="form-control" id="dep-dob" type="date">
        </div>
        <div class="form-group">
          <label class="form-label">Blood Group</label>
          <select class="form-control" id="dep-blood">
            <option value="">Unknown</option>
            <option value="A+">A+</option><option value="A-">A-</option>
            <option value="B+">B+</option><option value="B-">B-</option>
            <option value="AB+">AB+</option><option value="AB-">AB-</option>
            <option value="O+">O+</option><option value="O-">O-</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">CNIC / B-Form Number</label>
          <input class="form-control" id="dep-cnic" placeholder="e.g. 42101-1234567-1">
        </div>
        <div class="form-group">
          <label class="form-label">Emergency Phone</label>
          <input class="form-control" id="dep-phone" placeholder="e.g. +92 300 1234567">
        </div>
      </div>
      <div class="form-row form-row-2" style="background:var(--surface-2);padding:10px 14px;border-radius:8px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;font-weight:600">
            <input type="checkbox" id="dep-med" checked>
            <span><i class="fa fa-shield-heart" style="color:var(--success);margin-right:4px"></i>Enroll in Group Health TPA Cover</span>
          </label>
        </div>
        <div class="form-group" style="margin:0">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;font-weight:600">
            <input type="checkbox" id="dep-emergency">
            <span><i class="fa fa-phone" style="color:var(--info);margin-right:4px"></i>Primary Next-of-Kin Contact</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Gratuity / Life Insurance Beneficiary Share (%)</label>
        <input class="form-control" id="dep-benefit" type="number" min="0" max="100" value="50" placeholder="0 - 100%">
        <small style="color:var(--text-3);font-size:11px">Percentage share of corporate gratuity defined benefit reserve & life insurance payout.</small>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Employees.saveDependent()"><i class="fa fa-check"></i> Save Dependent</button>`
    });
  },

  saveDependent() {
    const empIdEl = document.getElementById('dep-emp-id');
    const empId = parseInt(empIdEl?.value);
    const name = document.getElementById('dep-name')?.value.trim();
    if (!name) { Toast.show('Full Name is required', 'error'); return; }
    if (!empId) { Toast.show('Employee selection required', 'error'); return; }

    const relation = document.getElementById('dep-rel')?.value || 'Spouse';
    const gender = document.getElementById('dep-gender')?.value || 'Female';
    const dob = document.getElementById('dep-dob')?.value || null;
    const bloodGroup = document.getElementById('dep-blood')?.value || '—';
    const cnicOrBForm = document.getElementById('dep-cnic')?.value.trim() || '';
    const emergencyPhone = document.getElementById('dep-phone')?.value.trim() || '';
    const isMedicalCovered = document.getElementById('dep-med')?.checked ?? true;
    const isEmergencyContact = document.getElementById('dep-emergency')?.checked ?? false;
    const beneficiaryPercent = parseInt(document.getElementById('dep-benefit')?.value) || 0;

    const newDep = {
      id: DB.nextId('employee_dependents'),
      employeeId: empId,
      fullName: name,
      relation,
      gender,
      dob,
      cnicOrBForm,
      bloodGroup,
      isMedicalCovered,
      isEmergencyContact,
      emergencyPhone,
      beneficiaryPercent,
      verified: true,
      createdAt: Utils.today()
    };

    DB.add('employee_dependents', newDep);

    // Sync legacy dependents
    DB.add('dependents', {
      id: newDep.id,
      employeeId: empId,
      name,
      relation,
      dob,
      cnic: cnicOrBForm,
      status: 'active'
    });

    DB.log('ADD_DEPENDENT', 'employees', `Registered dependent ${name} (${relation}) for ${Utils.getEmpName(empId)}`, Auth.employee?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Dependent ${name} registered successfully!`, 'success');

    if (this.currentView === 'dependents_events') {
      this.renderDependentsAndLifeEvents(document.getElementById('emp-content'));
    } else {
      this.renderProfile(empId);
    }
  },

  deleteDependent(depId, empId) {
    Modal.confirm('Remove Dependent', 'Are you sure you want to remove this family dependent and cancel their TPA medical coverage?', () => {
      DB.delete('employee_dependents', depId);
      DB.delete('dependents', depId);
      DB.log('DELETE_DEPENDENT', 'employees', `Removed dependent #${depId}`, Auth.employee?.id);
      Toast.show('Dependent removed.', 'warning');
      if (this.currentView === 'dependents_events') {
        this.renderDependentsAndLifeEvents(document.getElementById('emp-content'));
      } else {
        this.renderProfile(empId);
      }
    });
  },

  showSubmitLifeEventModal(empId = null) {
    const allEmps = DB.get('employees').filter(e => e.status === 'active');
    const currentEmpId = empId || Auth.employee?.id || (allEmps[0]?.id || 1);
    const isHrOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    const empSelectHtml = isHrOrAdmin && !empId ? `
      <div class="form-group">
        <label class="form-label required">Employee</label>
        <select class="form-control" id="ev-emp-id">
          ${allEmps.map(e => `<option value="${e.id}" ${e.id === currentEmpId ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
        </select>
      </div>
    ` : `
      <input type="hidden" id="ev-emp-id" value="${currentEmpId}">
      <div class="form-group">
        <label class="form-label">Employee</label>
        <input class="form-control" value="${Utils.getEmpName(currentEmpId)}" readonly disabled>
      </div>
    `;

    Modal.show('Submit Employee Life Event Notification', `
      ${empSelectHtml}
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Event Type</label>
          <select class="form-control" id="ev-type" onchange="Employees.onLifeEventTypeChange()">
            <option value="childbirth">Childbirth / Adoption</option>
            <option value="marriage">Marriage Solemnization</option>
            <option value="address_change">Residential Address Relocation</option>
            <option value="qualification">Academic Degree / Professional Certification</option>
            <option value="emergency_contact_update">Emergency Next-of-Kin Update</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Effective Event Date</label>
          <input class="form-control" id="ev-date" type="date" value="${Utils.today()}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Event Subject / Title</label>
        <input class="form-control" id="ev-title" placeholder="e.g. Birth of Son / Completion of MBA Executive">
      </div>
      <div class="form-group">
        <label class="form-label required">Event Details & Requests</label>
        <textarea class="form-control" id="ev-details" rows="3" placeholder="Describe the milestone and any requested company actions (e.g. Health Insurance enrollment, tax exemption updates, corporate transport route change)..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Supporting Verification Document</label>
        <input class="form-control" id="ev-doc-name" placeholder="e.g. Birth_Certificate_NADRA.pdf or Nikahnama_Scan.pdf">
        <small style="color:var(--text-3);font-size:11px">Official NADRA certificate, university degree, or utility bill for address verification.</small>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-primary" onclick="Employees.submitLifeEvent()"><i class="fa fa-paper-plane"></i> Submit Event for Verification</button>`
    });
  },

  onLifeEventTypeChange() {
    const type = document.getElementById('ev-type')?.value;
    const titleInput = document.getElementById('ev-title');
    const docInput = document.getElementById('ev-doc-name');
    if (!titleInput) return;

    if (type === 'childbirth') {
      titleInput.value = 'Birth of Child & Corporate Health Coverage Request';
      if (docInput) docInput.value = 'Hospital_Birth_Certificate_NADRA.pdf';
    } else if (type === 'marriage') {
      titleInput.value = 'Marriage Solemnization & Spouse TPA Health Enrollment';
      if (docInput) docInput.value = 'NADRA_Marriage_Registration_Certificate.pdf';
    } else if (type === 'address_change') {
      titleInput.value = 'Residential Relocation & Transport Roster Alignment';
      if (docInput) docInput.value = 'K-Electric_Utility_Bill_Relocation_Proof.pdf';
    } else if (type === 'qualification') {
      titleInput.value = 'Higher Education Degree Award / Certification';
      if (docInput) docInput.value = 'Official_Degree_Transcript_Verified.pdf';
    } else {
      titleInput.value = 'Emergency Contact / Next-of-Kin Record Update';
      if (docInput) docInput.value = 'Emergency_Contact_Form.pdf';
    }
  },

  submitLifeEvent() {
    const empId = parseInt(document.getElementById('ev-emp-id')?.value);
    const type = document.getElementById('ev-type')?.value;
    const date = document.getElementById('ev-date')?.value;
    const title = document.getElementById('ev-title')?.value.trim();
    const details = document.getElementById('ev-details')?.value.trim();
    const docName = document.getElementById('ev-doc-name')?.value.trim() || 'Verification_Document.pdf';

    if (!title || !details) {
      Toast.show('Title and details are required', 'error');
      return;
    }

    const newEvent = {
      id: DB.nextId('life_events'),
      employeeId: empId,
      eventType: type,
      title,
      eventDate: date,
      details,
      supportingDocName: docName,
      status: 'pending',
      submittedOn: Utils.today(),
      reviewedBy: null,
      reviewedOn: null,
      hrRemarks: '',
      impactActions: ['Verification by HR Operations', 'Profile Synchronization']
    };

    DB.add('life_events', newEvent);
    DB.log('LIFE_EVENT_SUBMITTED', 'employees', `Submitted life event: ${title} for ${Utils.getEmpName(empId)}`, Auth.employee?.id);
    Modal.close('dynamic-modal');
    Toast.show('Life event submitted successfully! Awaiting HR review.', 'success');

    if (this.currentView === 'dependents_events') {
      this.renderDependentsAndLifeEvents(document.getElementById('emp-content'));
    } else {
      this.renderProfile(empId);
    }
  },

  approveLifeEvent(id) {
    const event = DB.find('life_events', id);
    if (!event) return;

    Modal.confirm('Approve Life Event', `Approve "${event.title}" for ${Utils.getEmpName(event.employeeId)} and execute corporate benefits synchronization?`, () => {
      DB.update('life_events', id, {
        status: 'approved',
        reviewedBy: Auth.employee?.id || 1,
        reviewedOn: Utils.today(),
        hrRemarks: 'Verified and approved by HR Operations.'
      });

      DB.log('LIFE_EVENT_APPROVED', 'employees', `Approved life event #${id}: ${event.title}`, Auth.employee?.id);
      Toast.show('Life event verified & approved!', 'success');

      if (this.currentView === 'dependents_events') {
        this.renderDependentsAndLifeEvents(document.getElementById('emp-content'));
      } else if (App.currentModule === 'dashboard') {
        Dashboard.render();
      } else {
        this.renderProfile(event.employeeId);
      }
    });
  },

  rejectLifeEvent(id) {
    const event = DB.find('life_events', id);
    if (!event) return;

    Modal.show('Reject Life Event', `
      <div class="form-group">
        <label class="form-label required">Reason for Rejection / Missing Documents</label>
        <textarea class="form-control" id="ev-reject-reason" rows="3" placeholder="Specify reasons (e.g. Unclear document scan, missing official NADRA seal)..."></textarea>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
               <button class="btn btn-danger" onclick="Employees.confirmRejectLifeEvent(${id})">Confirm Rejection</button>`
    });
  },

  confirmRejectLifeEvent(id) {
    const reason = document.getElementById('ev-reject-reason')?.value.trim() || 'Missing official proof documents.';
    DB.update('life_events', id, {
      status: 'rejected',
      reviewedBy: Auth.employee?.id || 1,
      reviewedOn: Utils.today(),
      hrRemarks: reason
    });

    DB.log('LIFE_EVENT_REJECTED', 'employees', `Rejected life event #${id}: ${reason}`, Auth.employee?.id);
    Modal.close('dynamic-modal');
    Toast.show('Life event rejected', 'warning');

    if (this.currentView === 'dependents_events') {
      this.renderDependentsAndLifeEvents(document.getElementById('emp-content'));
    } else if (App.currentModule === 'dashboard') {
      Dashboard.render();
    }
  },

  auditBeneficiaryShares() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const dependents = DB.get('employee_dependents') || [];

    const auditRows = emps.map(emp => {
      const empDeps = dependents.filter(d => d.employeeId === emp.id);
      const totalPct = empDeps.reduce((acc, d) => acc + (d.beneficiaryPercent || 0), 0);
      let statusBadge = '<span class="badge badge-success"><i class="fa fa-check"></i> 100% Compliant</span>';
      if (totalPct === 0) statusBadge = '<span class="badge badge-danger">0% (Unallocated)</span>';
      else if (totalPct < 100) statusBadge = `<span class="badge badge-warning">${totalPct}% (Under-allocated)</span>`;
      else if (totalPct > 100) statusBadge = `<span class="badge badge-danger">${totalPct}% (Exceeds 100%)</span>`;
      return { emp, count: empDeps.length, totalPct, statusBadge };
    });

    Modal.show('Corporate Life Insurance & Gratuity Beneficiary Audit Matrix', `
      <div style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">
        Statutory review of defined benefit Gratuity reserve and Life Takaful beneficiary allocations across all active personnel.
      </div>
      <div class="table-wrapper" style="max-height:360px">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Dependents Count</th>
              <th>Beneficiary Allocation</th>
              <th>Audit Status</th>
            </tr>
          </thead>
          <tbody>
            ${auditRows.map(r => `
              <tr>
                <td><strong>${r.emp.fullName}</strong> <span style="font-size:11px;color:var(--text-3)">(${r.emp.empNo})</span></td>
                <td>${Utils.getDeptName(r.emp.departmentId)}</td>
                <td style="text-align:center">${r.count}</td>
                <td style="font-weight:700;font-family:monospace">${r.totalPct}%</td>
                <td>${r.statusBadge}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close Audit</button>`
    });
  },

  printDependentHealthCard(depId) {
    const dep = (DB.get('employee_dependents') || []).find(d => d.id === depId) || (DB.get('dependents') || []).find(d => d.id === depId);
    if (!dep) { Toast.show('Dependent not found', 'error'); return; }
    const emp = DB.find('employees', dep.employeeId) || { fullName: 'Employee', empNo: 'EMP-001' };
    const settings = DB.getObj('settings') || { companyName: 'MY-HRM Global Enterprise' };

    const win = window.open('', '_blank');
    if (!win) {
      Toast.show('Pop-up blocked. Please allow pop-ups to print.', 'error');
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Family Medical Card — ${dep.fullName || dep.name}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; background: #f3f4f6; }
          .card { width: 85mm; height: 54mm; background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius: 4mm; color: #ffffff; padding: 4mm; box-sizing: border-box; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 2mm; margin-bottom: 2mm; }
          .logo { font-size: 8pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
          .policy-badge { font-size: 6pt; background: #10b981; color: #fff; padding: 1mm 2mm; border-radius: 1mm; font-weight: 700; }
          .dep-name { font-size: 11pt; font-weight: 800; color: #ffffff; margin-top: 1mm; }
          .dep-rel { font-size: 7.5pt; color: #a5b4fc; margin-bottom: 2mm; font-weight: 600; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm; font-size: 6.5pt; background: rgba(0,0,0,0.2); padding: 1.5mm; border-radius: 1.5mm; }
          .footer { position: absolute; bottom: 2mm; left: 4mm; right: 4mm; display: flex; justify-content: space-between; font-size: 5pt; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 1mm; }
          @media print { body { background: transparent; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">${settings.companyName}</div>
            <div class="policy-badge">TPA GROUP HEALTH PASS</div>
          </div>
          <div class="dep-name">${dep.fullName || dep.name}</div>
          <div class="dep-rel">${dep.relation} of ${emp.fullName} (${emp.empNo})</div>
          <div class="info-grid">
            <div><strong>CNIC/B-Form:</strong> ${dep.cnicOrBForm || dep.cnic || 'Verified on file'}</div>
            <div><strong>Blood Group:</strong> <span style="color:#f87171;font-weight:700">${dep.bloodGroup || 'O+'}</span></div>
            <div><strong>DOB:</strong> ${dep.dob ? Utils.formatDate(dep.dob) : '—'}</div>
            <div><strong>Card Ref:</strong> TPA-${emp.id}-${dep.id}</div>
          </div>
          <div class="footer">
            <span>24/7 TPA Helpline: 0800-48762</span>
            <span>Corporate Health Scheme 2026</span>
          </div>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    win.document.close();
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

  // ============================================================
  // BATCH 1: INTERACTIVE VISUAL ORG CHART
  // ============================================================
  orgChartZoom: 1.0,
  orgChartDeptFilter: 'all',
  orgChartSearchQuery: '',

  renderOrgChart(container) {
    const allEmps = DB.get('employees') || [];
    const activeEmps = allEmps.filter(e => e.status === 'active');
    const depts = DB.get('departments') || [];

    // Filter root and build reporting map
    const rootEmp = activeEmps.find(e => e.role === 'superadmin' || e.id === 1) || activeEmps[0];

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Toolbar -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px">
              <i class="fa fa-sitemap" style="color:var(--primary)"></i> Organization Hierarchy Chart
            </div>
            <span class="chip" style="font-size:11px;background:var(--surface)">${activeEmps.length} Active Members</span>
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <!-- Search in Tree -->
            <div style="position:relative;width:200px">
              <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:11px"></i>
              <input type="text" class="form-control" placeholder="Find in chart..." style="padding-left:28px;font-size:12px;height:32px"
                value="${this.orgChartSearchQuery}" oninput="Employees.orgChartSearchQuery=this.value.toLowerCase(); Employees.filterOrgChartNodes()">
            </div>

            <!-- Dept Filter -->
            <select class="form-control" style="width:160px;font-size:12px;height:32px" onchange="Employees.orgChartDeptFilter=this.value; Employees.renderOrgChart(document.getElementById('emp-content'))">
              <option value="all">All Departments</option>
              ${depts.map(d => `<option value="${d.id}" ${this.orgChartDeptFilter==d.id?'selected':''}>${d.name}</option>`).join('')}
            </select>

            <!-- Zoom Controls -->
            <div style="display:flex;align-items:center;gap:2px;background:var(--surface);padding:2px;border-radius:8px;border:1px solid var(--border)">
              <button class="btn btn-ghost btn-xs" onclick="Employees.zoomOrgChart(0.1)" title="Zoom In"><i class="fa fa-magnifying-glass-plus"></i></button>
              <span id="org-zoom-level" style="font-size:11px;font-family:monospace;padding:0 6px;min-width:40px;text-align:center">${Math.round(this.orgChartZoom*100)}%</span>
              <button class="btn btn-ghost btn-xs" onclick="Employees.zoomOrgChart(-0.1)" title="Zoom Out"><i class="fa fa-magnifying-glass-minus"></i></button>
              <button class="btn btn-ghost btn-xs" onclick="Employees.resetOrgChartZoom()" title="Reset Zoom"><i class="fa fa-arrows-rotate"></i></button>
            </div>

            <button class="btn btn-ghost btn-sm" onclick="Employees.switchView('directory')" title="Switch to Grid View">
              <i class="fa fa-id-card"></i> Grid View
            </button>
          </div>
        </div>

        <!-- Org Chart Canvas / Tree Area -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:30px 20px;overflow:auto;min-height:540px;display:flex;justify-content:center;position:relative">
          <div id="org-tree-root" style="transform:scale(${this.orgChartZoom});transform-origin:top center;transition:transform .2s ease;display:inline-block">
            ${this.buildOrgTreeNode(rootEmp, activeEmps)}
          </div>
        </div>
      </div>

      <style>
        .org-node-wrap { display: flex; flex-direction: column; align-items: center; }
        .org-card {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          width: 220px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: all .2s ease;
          position: relative;
          text-align: center;
        }
        .org-card:hover {
          border-color: var(--primary);
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        .org-card.highlighted {
          border-color: var(--warning);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.3);
        }
        .org-card.root-card { border-top: 4px solid var(--primary); }
        .org-card.manager-card { border-top: 4px solid var(--accent); }
        .org-card.lead-card { border-top: 4px solid var(--info); }
        .org-card.member-card { border-top: 4px solid #10b981; }
        .org-line-down { width: 2px; height: 24px; background: var(--border); margin: 0 auto; }
        .org-line-up { width: 2px; height: 24px; background: var(--border); margin: 0 auto; }
        .org-children-row {
          display: flex;
          justify-content: center;
          gap: 24px;
          position: relative;
          padding-top: 24px;
        }
        .org-children-row::before {
          content: '';
          position: absolute;
          top: 0;
          left: 110px;
          right: 110px;
          height: 2px;
          background: var(--border);
        }
        .org-child-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .org-child-col::before {
          content: '';
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 24px;
          background: var(--border);
        }
      </style>
    `;
  },

  buildOrgTreeNode(emp, allEmps) {
    if (!emp) return '';

    // Find direct reports
    let reports = allEmps.filter(e => e.id !== emp.id && (e.managerId === emp.id || e.reportingTo === emp.id));
    
    // Apply department filter if selected
    if (this.orgChartDeptFilter !== 'all') {
      reports = reports.filter(e => e.departmentId == this.orgChartDeptFilter || e.role === 'dept_manager' || e.role === 'superadmin');
    }

    const isRoot = emp.role === 'superadmin' || emp.id === 1;
    const isDeptManager = emp.role === 'dept_manager' || emp.id === 3;
    const isHR = emp.role === 'hr_manager' || emp.id === 2;

    const cardClass = isRoot ? 'root-card' : isHR ? 'manager-card' : isDeptManager ? 'lead-card' : 'member-card';

    return `
      <div class="org-node-wrap" data-emp-id="${emp.id}" data-name="${emp.fullName.toLowerCase()}" data-dept="${emp.departmentId}">
        <div class="org-card ${cardClass}" onclick="Employees.renderProfile(${emp.id})" title="Click to view ${emp.fullName}'s complete profile">
          <!-- Avatar + Photo -->
          <div style="position:relative;width:52px;height:52px;margin:0 auto 8px;border-radius:50%;overflow:hidden;border:2px solid var(--primary);box-shadow:var(--shadow-sm)">
            ${emp.photo 
              ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName}">` 
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${Utils.avatarColor(emp.id)};color:#fff;font-size:16px;font-weight:700">${Utils.avatarInitials(emp.fullName)}</div>`}
          </div>

          <div style="font-weight:700;font-size:13.5px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${emp.fullName}</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.getDesigName(emp.designationId)}</div>
          <div style="font-size:10px;color:var(--primary);margin-top:2px">${Utils.getDeptName(emp.departmentId)}</div>

          <div style="margin-top:6px;display:flex;align-items:center;justify-content:center;gap:6px">
            <span class="chip" style="font-size:9.5px;padding:2px 6px">${emp.empNo}</span>
            ${reports.length > 0 ? `<span class="badge badge-primary" style="font-size:9px;padding:2px 6px"><i class="fa fa-users"></i> ${reports.length} Reports</span>` : ''}
          </div>
        </div>

        ${reports.length > 0 ? `
          <div class="org-line-down"></div>
          <div class="org-children-row">
            ${reports.map(child => `
              <div class="org-child-col">
                ${this.buildOrgTreeNode(child, allEmps)}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  zoomOrgChart(delta) {
    this.orgChartZoom = Math.min(1.8, Math.max(0.4, Math.round((this.orgChartZoom + delta) * 10) / 10));
    const root = document.getElementById('org-tree-root');
    if (root) root.style.transform = `scale(${this.orgChartZoom})`;
    const label = document.getElementById('org-zoom-level');
    if (label) label.textContent = `${Math.round(this.orgChartZoom * 100)}%`;
  },

  resetOrgChartZoom() {
    this.orgChartZoom = 1.0;
    const root = document.getElementById('org-tree-root');
    if (root) root.style.transform = 'scale(1)';
    const label = document.getElementById('org-zoom-level');
    if (label) label.textContent = '100%';
  },

  filterOrgChartNodes() {
    const q = this.orgChartSearchQuery;
    document.querySelectorAll('.org-card').forEach(card => {
      card.classList.remove('highlighted');
      if (q && card.parentElement.getAttribute('data-name')?.includes(q)) {
        card.classList.add('highlighted');
      }
    });
  },

  // ============================================================
  // BATCH 1: DOCUMENT EXPIRY & COMPLIANCE TRACKER
  // ============================================================
  docExpiryFilter: 'all',
  docTypeFilter: 'all',
  docSearchQuery: '',

  renderDocExpiry(container) {
    let docs = DB.get('document_expiries') || [];
    const allEmps = DB.get('employees') || [];
    const today = new Date();
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';
    const myEmpId = Auth.employee?.id;

    if (isStaff && myEmpId) {
      docs = docs.filter(d => d.employeeId === myEmpId);
    }

    const enriched = docs.map(d => {
      const emp = allEmps.find(e => e.id === d.employeeId) || { fullName: 'Unknown', empNo: 'EMP-??', departmentId: 1 };
      const exp = new Date(d.expiryDate);
      const diffTime = exp - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      let statusCat = 'active';
      if (diffDays < 0) statusCat = 'expired';
      else if (diffDays <= 30) statusCat = 'urgent';
      else if (diffDays <= 60) statusCat = 'upcoming';
      return { ...d, emp, diffDays, statusCat };
    });

    const expiredCount = enriched.filter(d => d.statusCat === 'expired').length;
    const urgentCount = enriched.filter(d => d.statusCat === 'urgent').length;
    const upcomingCount = enriched.filter(d => d.statusCat === 'upcoming').length;
    const activeCount = enriched.filter(d => d.statusCat === 'active').length;

    let filtered = enriched;
    if (this.docExpiryFilter !== 'all') filtered = filtered.filter(d => d.statusCat === this.docExpiryFilter);
    if (this.docTypeFilter !== 'all') filtered = filtered.filter(d => d.docType === this.docTypeFilter);
    if (this.docSearchQuery) {
      const q = this.docSearchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.emp.fullName.toLowerCase().includes(q) ||
        d.emp.empNo.toLowerCase().includes(q) ||
        d.docNumber.toLowerCase().includes(q) ||
        d.issuingAuthority.toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Metrics Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          ${[
            { label: isStaff ? 'My Expired Documents' : 'Expired Documents', val: expiredCount, color:'#ef4444', icon:'fa-triangle-exclamation', filter:'expired' },
            { label: isStaff ? 'My Critical (< 30 Days)' : 'Critical (< 30 Days)', val: urgentCount, color:'#f59e0b', icon:'fa-bell', filter:'urgent' },
            { label: isStaff ? 'My Upcoming (< 60 Days)' : 'Upcoming (< 60 Days)', val: upcomingCount, color:'#6366f1', icon:'fa-calendar-clock', filter:'upcoming' },
            { label: isStaff ? 'My Valid & Compliant' : 'Valid & Compliant', val: activeCount, color:'#10b981', icon:'fa-circle-check', filter:'active' },
          ].map(s => `
            <div style="background:var(--card);border:1px solid var(--border);border-left:4px solid ${s.color};border-radius:12px;padding:16px;cursor:pointer;transition:all .2s"
              onclick="Employees.docExpiryFilter='${s.filter}'; Employees.renderDocExpiry(document.getElementById('emp-content'))">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-size:26px;font-weight:800;color:${s.color}">${s.val}</div>
                  <div style="font-size:12px;color:var(--text-3);margin-top:2px">${s.label}</div>
                </div>
                <div style="width:40px;height:40px;border-radius:10px;background:${s.color}22;display:flex;align-items:center;justify-content:center;color:${s.color};font-size:18px">
                  <i class="fa ${s.icon}"></i>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Filter Bar -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <!-- Search -->
            <div style="position:relative;width:220px">
              <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:11px"></i>
              <input type="text" class="form-control" placeholder="Search by name, CNIC, doc #..." style="padding-left:28px;font-size:12px;height:32px"
                value="${this.docSearchQuery}" oninput="Employees.docSearchQuery=this.value; Employees.renderDocExpiry(document.getElementById('emp-content'))">
            </div>

            <!-- Status Filter -->
            <select class="form-control" style="width:160px;font-size:12px;height:32px" onchange="Employees.docExpiryFilter=this.value; Employees.renderDocExpiry(document.getElementById('emp-content'))">
              <option value="all" ${this.docExpiryFilter==='all'?'selected':''}>All Expiry Statuses</option>
              <option value="expired" ${this.docExpiryFilter==='expired'?'selected':''}>Expired Only</option>
              <option value="urgent" ${this.docExpiryFilter==='urgent'?'selected':''}>Urgent (< 30 Days)</option>
              <option value="upcoming" ${this.docExpiryFilter==='upcoming'?'selected':''}>Upcoming (< 60 Days)</option>
              <option value="active" ${this.docExpiryFilter==='active'?'selected':''}>Valid & Active</option>
            </select>

            <!-- Doc Type Filter -->
            <select class="form-control" style="width:160px;font-size:12px;height:32px" onchange="Employees.docTypeFilter=this.value; Employees.renderDocExpiry(document.getElementById('emp-content'))">
              <option value="all" ${this.docTypeFilter==='all'?'selected':''}>All Document Types</option>
              <option value="CNIC" ${this.docTypeFilter==='CNIC'?'selected':''}>CNIC</option>
              <option value="Passport" ${this.docTypeFilter==='Passport'?'selected':''}>Passport</option>
              <option value="Visa / Work Permit" ${this.docTypeFilter==='Visa / Work Permit'?'selected':''}>Visa / Work Permit</option>
              <option value="Driving License" ${this.docTypeFilter==='Driving License'?'selected':''}>Driving License</option>
              <option value="Medical Fitness" ${this.docTypeFilter==='Medical Fitness'?'selected':''}>Medical Fitness</option>
            </select>
          </div>

          <div>
            ${isStaff ? `
              <button class="btn btn-primary btn-sm" onclick="Employees.showReuploadDocModal()">
                <i class="fa fa-cloud-arrow-up"></i> Re-upload / Update Document
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="Employees.showAddDocModal()">
                <i class="fa fa-plus"></i> Add Employee Document
              </button>
            `}
          </div>
        </div>

        <!-- Document Expiry Table -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:13px;color:var(--text-3)">Showing ${filtered.length} compliance document record${filtered.length!==1?'s':''}</span>
            ${this.docExpiryFilter !== 'all' ? `<button class="btn btn-ghost btn-xs" onclick="Employees.docExpiryFilter='all';Employees.renderDocExpiry(document.getElementById('emp-content'))"><i class="fa fa-times"></i> Clear Filter</button>` : ''}
          </div>
          <div class="table-wrapper" style="border:none;border-radius:0">
            <table>
              <thead><tr>
                ${!isStaff ? `<th>Employee</th>` : ''}
                <th>Document Type</th>
                <th>Document Number</th>
                <th>Issuing Authority</th>
                <th>Expiry Date</th>
                <th>Status & Days Remaining</th>
                <th>Notes / Compliance Remarks</th>
                <th style="text-align:right">Actions</th>
              </tr></thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr><td colspan="${isStaff ? 7 : 8}"><div class="empty-state"><i class="fa fa-circle-check" style="color:var(--success)"></i><h3>All documents within filter are compliant!</h3></div></td></tr>
                ` : filtered.map(d => {
                  let badge = '';
                  if (d.statusCat === 'expired') {
                    badge = `<span class="badge badge-danger" style="font-size:11px"><i class="fa fa-triangle-exclamation"></i> Expired (${Math.abs(d.diffDays)} days ago)</span>`;
                  } else if (d.statusCat === 'urgent') {
                    badge = `<span class="badge badge-warning" style="font-size:11px;background:#f59e0b;color:#fff"><i class="fa fa-bell"></i> Critical (${d.diffDays} days left)</span>`;
                  } else if (d.statusCat === 'upcoming') {
                    badge = `<span class="badge badge-primary" style="font-size:11px"><i class="fa fa-clock"></i> ${d.diffDays} days left</span>`;
                  } else {
                    badge = `<span class="badge badge-success" style="font-size:11px"><i class="fa fa-circle-check"></i> Valid (${d.diffDays} days)</span>`;
                  }

                  if (isStaff) {
                    return `
                      <tr>
                        <td><strong>${d.docType}</strong></td>
                        <td><code style="font-family:monospace;font-size:12px;color:var(--primary)">${d.docNumber}</code></td>
                        <td style="font-size:12px">${d.issuingAuthority || 'N/A'}</td>
                        <td style="font-size:12px;font-weight:600">${Utils.formatDate(d.expiryDate)}</td>
                        <td>${badge}</td>
                        <td style="font-size:11.5px;color:var(--text-3);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${d.notes||''}">${d.notes || '—'}</td>
                        <td style="text-align:right">
                          <div class="tbl-actions" style="justify-content:flex-end">
                            <button class="btn btn-primary btn-xs" onclick="Employees.showReuploadDocModal(${d.id})" title="Re-upload or update renewed document copy">
                              <i class="fa fa-cloud-arrow-up"></i> Re-upload / Update
                            </button>
                            <button class="btn btn-ghost btn-xs" onclick="Employees.switchView('edms')" title="View in e-DMS Vault">
                              <i class="fa fa-folder-open"></i> Vault
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }

                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:10px">
                          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(d.emp.id)};cursor:pointer" onclick="Employees.renderProfile(${d.emp.id})">
                            ${d.emp.photo ? `<img src="${d.emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${d.emp.fullName}">` : Utils.avatarInitials(d.emp.fullName)}
                          </div>
                          <div>
                            <div style="font-weight:600;font-size:13px;cursor:pointer;color:var(--primary)" onclick="Employees.renderProfile(${d.emp.id})">${d.emp.fullName}</div>
                            <div style="font-size:10.5px;color:var(--text-3)">${d.emp.empNo} • ${Utils.getDeptName(d.emp.departmentId)}</div>
                          </div>
                        </div>
                      </td>
                      <td><strong>${d.docType}</strong></td>
                      <td><code style="font-family:monospace;font-size:12px;color:var(--primary)">${d.docNumber}</code></td>
                      <td style="font-size:12px">${d.issuingAuthority || 'N/A'}</td>
                      <td style="font-size:12px;font-weight:600">${Utils.formatDate(d.expiryDate)}</td>
                      <td>${badge}</td>
                      <td style="font-size:11.5px;color:var(--text-3);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${d.notes||''}">${d.notes || '—'}</td>
                      <td style="text-align:right">
                        <div class="tbl-actions" style="justify-content:flex-end">
                          <button class="btn btn-warning btn-xs" onclick="Employees.sendDocExpiryReminder(${d.id})" title="Dispatch urgent expiry reminder notification to ${d.emp.fullName}">
                            <i class="fa fa-bell"></i> Send Notice
                          </button>
                          <button class="btn btn-primary btn-xs" onclick="Employees.showRenewDocModal(${d.id})" title="Renew or update expiry date">
                            <i class="fa fa-arrows-rotate"></i> Renew
                          </button>
                          <button class="btn btn-ghost btn-icon btn-xs" onclick="Employees.deleteDoc(${d.id})" title="Delete record">
                            <i class="fa fa-trash" style="color:var(--danger)"></i>
                          </button>
                        </div>
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

  showAddDocModal() {
    const allEmps = (DB.get('employees') || []).filter(e => e.status === 'active');
    Modal.show('Add Employee Document', `
      <form onsubmit="Employees.saveAddDoc(event)">
        <div class="form-group mb-14">
          <label class="form-label required">Employee</label>
          <select class="form-control" id="m-doc-emp" required>
            ${allEmps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo}) - ${Utils.getDeptName(e.departmentId)}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Document Type</label>
            <select class="form-control" id="m-doc-type" required>
              <option value="CNIC">National ID Card (CNIC)</option>
              <option value="Passport">Passport</option>
              <option value="Visa / Work Permit">Visa / Work Permit</option>
              <option value="Driving License">Driving License</option>
              <option value="Medical Fitness">Medical Fitness Certificate</option>
              <option value="Educational Degree">Degree Attestation</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Document Number / ID</label>
            <input type="text" class="form-control" id="m-doc-num" placeholder="e.g. 42201-1234567-1" required>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb-14">
          <div class="form-group">
            <label class="form-label">Issue Date</label>
            <input type="date" class="form-control" id="m-doc-issue" value="${Utils.today()}">
          </div>
          <div class="form-group">
            <label class="form-label required">Expiry Date</label>
            <input type="date" class="form-control" id="m-doc-expiry" required>
          </div>
        </div>
        <div class="form-group mb-14">
          <label class="form-label">Issuing Authority</label>
          <input type="text" class="form-control" id="m-doc-auth" placeholder="e.g. NADRA, Traffic Police, Passport Office">
        </div>
        <div class="form-group mb-14">
          <label class="form-label">Notes & Remarks</label>
          <textarea class="form-control" id="m-doc-notes" rows="2" placeholder="Renewal notes or verification remarks"></textarea>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Save Document</button>
        </div>
      </form>
    `);
  },

  saveAddDoc(e) {
    e.preventDefault();
    const docs = DB.get('document_expiries') || [];
    const newDoc = {
      id: DB.nextId('document_expiries'),
      employeeId: parseInt(document.getElementById('m-doc-emp').value),
      docType: document.getElementById('m-doc-type').value,
      docNumber: document.getElementById('m-doc-num').value.trim(),
      issueDate: document.getElementById('m-doc-issue').value,
      expiryDate: document.getElementById('m-doc-expiry').value,
      issuingAuthority: document.getElementById('m-doc-auth').value.trim(),
      notes: document.getElementById('m-doc-notes').value.trim(),
      status: 'active'
    };
    docs.push(newDoc);
    DB.set('document_expiries', docs);
    Modal.close('dynamic-modal');
    Toast.show('Document registered successfully!', 'success');
    this.renderDocExpiry(document.getElementById('emp-content'));
  },

  showRenewDocModal(docId) {
    const docs = DB.get('document_expiries') || [];
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    const emp = DB.find('employees', doc.employeeId) || { fullName: 'Employee' };

    Modal.show(`Renew Document — ${doc.docType}`, `
      <form onsubmit="Employees.saveRenewDoc(event, ${doc.id})">
        <div style="background:var(--surface);padding:10px 14px;border-radius:8px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
          <div>
            <div style="font-weight:700;font-size:13px">${emp.fullName}</div>
            <div style="font-size:11px;color:var(--text-3)">Current ${doc.docType}: <code>${doc.docNumber}</code> | Expired on: <strong>${doc.expiryDate}</strong></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Renewed Document #</label>
            <input type="text" class="form-control" id="m-renew-num" value="${doc.docNumber}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">New Expiry Date</label>
            <input type="date" class="form-control" id="m-renew-exp" required>
          </div>
        </div>
        <div class="form-group mb-14">
          <label class="form-label">Issuing Authority</label>
          <input type="text" class="form-control" id="m-renew-auth" value="${doc.issuingAuthority||''}">
        </div>
        <div class="form-group mb-14">
          <label class="form-label">Renewal Notes</label>
          <textarea class="form-control" id="m-renew-notes" rows="2" placeholder="Enter receipt number, renewal date, and verification notes">${doc.notes ? doc.notes + '\n' : ''}Renewed on ${Utils.today()}</textarea>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-arrows-rotate"></i> Confirm Renewal</button>
        </div>
      </form>
    `);
  },

  saveRenewDoc(e, docId) {
    e.preventDefault();
    const docs = DB.get('document_expiries') || [];
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    doc.docNumber = document.getElementById('m-renew-num').value.trim();
    doc.expiryDate = document.getElementById('m-renew-exp').value;
    doc.issuingAuthority = document.getElementById('m-renew-auth').value.trim();
    doc.notes = document.getElementById('m-renew-notes').value.trim();
    doc.status = 'active';
    DB.set('document_expiries', docs);
    Modal.close('dynamic-modal');
    Toast.show('Document successfully renewed!', 'success');
    this.renderDocExpiry(document.getElementById('emp-content'));
  },

  showReuploadDocModal(docId) {
    const myId = Auth.employee?.id;
    const allDocs = DB.get('document_expiries') || [];
    const myDocs = myId ? allDocs.filter(d => d.employeeId === myId) : allDocs;
    let doc = docId ? allDocs.find(d => d.id === docId) : myDocs[0];
    if (!doc && myDocs.length > 0) doc = myDocs[0];
    if (!doc) return Toast.show('No document record found to update.', 'info');

    // Suggest 5 years from today as a convenient default for renewed smart card / passport
    const suggestedExp = new Date();
    suggestedExp.setFullYear(suggestedExp.getFullYear() + 5);
    const suggestedExpStr = suggestedExp.toISOString().split('T')[0];

    Modal.show(`Re-upload / Update Document — ${doc.docType}`, `
      <form onsubmit="Employees.saveReuploadDoc(event, ${doc.id})">
        <div style="background:var(--surface);padding:12px 16px;border-radius:10px;margin-bottom:16px;border-left:4px solid var(--primary)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">${doc.docType} Renewal Self-Service</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px">
                Current Number: <code>${doc.docNumber}</code> | Current Expiry: <strong>${Utils.formatDate(doc.expiryDate)}</strong>
              </div>
            </div>
            <span class="badge ${doc.statusCat === 'expired' ? 'badge-danger' : 'badge-warning'}">
              ${doc.statusCat === 'expired' ? 'Expired' : 'Renewal Due'}
            </span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Document Type</label>
            <input type="text" class="form-control" id="m-reup-type" value="${doc.docType}" readonly style="background:var(--surface);opacity:0.85">
          </div>
          <div class="form-group">
            <label class="form-label required">Document / Smart Card #</label>
            <input type="text" class="form-control" id="m-reup-num" value="${doc.docNumber}" required placeholder="e.g. 42201-4567890-4">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">New / Renewed Expiry Date</label>
            <input type="date" class="form-control" id="m-reup-exp" value="${suggestedExpStr}" min="${Utils.today()}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Issuing Authority</label>
            <input type="text" class="form-control" id="m-reup-auth" value="${doc.issuingAuthority || 'NADRA'}" required placeholder="e.g. NADRA / DGI&P">
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label required">Attach Scanned Copy / Proof (PDF, PNG, JPG)</label>
          <div style="border:2px dashed var(--border);border-radius:10px;padding:16px;text-align:center;background:var(--surface);cursor:pointer" onclick="document.getElementById('m-reup-file').click()">
            <i class="fa fa-cloud-arrow-up" style="font-size:28px;color:var(--primary);margin-bottom:6px;display:block"></i>
            <div style="font-size:13px;font-weight:600;color:var(--text)" id="m-reup-file-label">Click to select renewed document scan</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">Official government smart card scan or passport bio page (Max 10 MB)</div>
            <input type="file" id="m-reup-file" style="display:none" accept=".pdf,.png,.jpg,.jpeg" onchange="document.getElementById('m-reup-file-label').textContent = this.files[0] ? this.files[0].name + ' (' + Math.round(this.files[0].size/1024) + ' KB)' : 'Click to select renewed document scan'">
          </div>
        </div>

        <div class="form-group mb-16">
          <label class="form-label">Employee Remarks / Reference Details</label>
          <textarea class="form-control" id="m-reup-notes" rows="2" placeholder="e.g. Renewed Smart Card issued by NADRA Executive Center on ${Utils.today()}">${doc.notes ? doc.notes + '\n' : ''}Renewed & re-uploaded on ${Utils.today()}</textarea>
        </div>

        <div class="modal-footer" style="padding:0;margin-top:20px;display:flex;justify-content:space-between;align-items:center">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa fa-paper-plane"></i> Submit Renewed Document to HR
          </button>
        </div>
      </form>
    `);
  },

  saveReuploadDoc(e, docId) {
    e.preventDefault();
    const allDocs = DB.get('document_expiries') || [];
    const doc = allDocs.find(d => d.id === docId);
    if (!doc) return Toast.show('Document record not found', 'danger');

    const newDocNum = document.getElementById('m-reup-num').value.trim();
    const newExpiry = document.getElementById('m-reup-exp').value;
    const newAuthority = document.getElementById('m-reup-auth').value.trim();
    const notes = document.getElementById('m-reup-notes').value.trim();
    const fileInput = document.getElementById('m-reup-file');
    const uploadedFileName = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0].name : `${doc.docType.toLowerCase().replace(/[^a-z0-9]/g, '_')}_renewed_${Date.now()}.pdf`;

    // 1. Update document_expiries record
    doc.docNumber = newDocNum || doc.docNumber;
    doc.expiryDate = newExpiry;
    doc.issuingAuthority = newAuthority || doc.issuingAuthority;
    doc.notes = notes;
    doc.status = 'active';
    doc.lastRenewedAt = new Date().toISOString();
    doc.renewedByEmployee = true;
    doc.verificationStatus = 'pending_verification';
    DB.set('document_expiries', allDocs);

    // 2. If CNIC, synchronize with employee profile
    if (doc.docType === 'CNIC') {
      const allEmps = DB.get('employees') || [];
      const emp = allEmps.find(x => x.id === doc.employeeId);
      if (emp) {
        emp.cnic = newDocNum;
        emp.cnicExpiry = newExpiry;
        DB.set('employees', allEmps);
      }
    }

    // 3. Archive in e-DMS Vault (employee_documents)
    const empDocs = DB.get('employee_documents') || [];
    empDocs.unshift({
      id: DB.nextId('employee_documents'),
      employeeId: doc.employeeId,
      title: `Renewed ${doc.docType} (${newDocNum})`,
      category: 'Identity & Legal',
      fileName: uploadedFileName,
      fileSize: fileInput && fileInput.files && fileInput.files[0] ? `${Math.round(fileInput.files[0].size/1024)} KB` : '1.5 MB',
      fileType: uploadedFileName.endsWith('.pdf') ? 'pdf' : 'image',
      uploadedAt: new Date().toISOString(),
      uploadedBy: Auth.user?.name || Auth.employee?.fullName || 'Employee',
      verificationStatus: 'pending',
      notes: notes || `Renewed copy uploaded by employee. New Expiry: ${newExpiry}`
    });
    DB.set('employee_documents', empDocs);

    // 4. Dispatch live notification to HR Manager and Super Admin
    const hrNotifPayload = {
      recipientRole: 'hr_manager',
      senderRole: 'employee',
      senderName: Auth.user?.name || 'Employee',
      type: 'document_update',
      priority: 'high',
      title: `📄 Renewed Document Uploaded: ${doc.docType}`,
      message: `${Auth.user?.name || 'Employee'} (${Auth.employee?.empNo || 'EMP'}) has uploaded their renewed ${doc.docType} (Number: ${newDocNum}, New Expiry: ${newExpiry}). Please review and verify in e-DMS Vault.`,
      actionUrl: 'employees',
      subView: 'doc_expiry',
      actionLabel: 'Verify Document'
    };

    if (typeof LiveNotifications !== 'undefined' && LiveNotifications.dispatch) {
      LiveNotifications.dispatch(hrNotifPayload);
    } else {
      const userNotifs = DB.get('user_notifications') || [];
      userNotifs.unshift({ id: DB.nextId('user_notifications'), ...hrNotifPayload, read: false, createdAt: new Date().toISOString() });
      DB.set('user_notifications', userNotifs);
    }

    // 5. Mark employee's own expiry notifications as read
    const userNotifs = DB.get('user_notifications') || [];
    userNotifs.forEach(n => {
      if (parseInt(n.recipientEmpId) === parseInt(doc.employeeId) && (n.type === 'doc_expiry' || n.type === 'cnic_reminder' || n.subView === 'doc_expiry' || n.subView === 'edms')) {
        n.read = true;
      }
    });
    DB.set('user_notifications', userNotifs);
    if (typeof App !== 'undefined' && App.refreshNotifications) App.refreshNotifications();

    Modal.close('dynamic-modal');
    Toast.show('Renewed document uploaded successfully! HR Directorate notified for verification.', 'success');
    this.renderDocExpiry(document.getElementById('emp-content'));
  },

  deleteDoc(docId) {
    if (!confirm('Are you sure you want to remove this document compliance record?')) return;
    let docs = DB.get('document_expiries') || [];
    docs = docs.filter(d => d.id !== docId);
    DB.set('document_expiries', docs);
    Toast.show('Document record removed', 'info');
    this.renderDocExpiry(document.getElementById('emp-content'));
  },

  sendDocExpiryReminder(docId) {
    const docs = DB.get('document_expiries') || [];
    const doc = docs.find(d => d.id === docId);
    if (!doc) return Toast.show('Document record not found', 'danger');

    const emp = (DB.get('employees') || []).find(e => e.id === doc.employeeId);
    const empName = emp ? emp.fullName : 'Employee';
    const today = new Date();
    const exp = new Date(doc.expiryDate);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    const daysText = diffDays < 0 ? `expired ${Math.abs(diffDays)} day(s) ago` : `expires in ${diffDays} day(s) on ${Utils.formatDate(doc.expiryDate)}`;

    // 1. Create targeted user_notification for the employee
    const notifPayload = {
      recipientEmpId: doc.employeeId,
      recipientRole: 'employee',
      senderRole: Auth.role || 'hr_manager',
      senderName: Auth.employee ? `${Auth.employee.fullName} (${Auth.role === 'superadmin' ? 'Super Admin' : 'HR Manager'})` : 'HR Compliance Directorate',
      type: 'doc_expiry',
      priority: diffDays <= 30 ? 'urgent' : 'high',
      title: `⚠️ Action Required: ${doc.docType} Renewal Reminder`,
      message: `Your ${doc.docType} (No: ${doc.docNumber}) ${daysText}. Under statutory compliance regulations, please renew through NADRA / issuing authority and upload your updated copy to your e-DMS Vault.`,
      actionUrl: 'employees',
      subView: 'doc_expiry',
      actionLabel: 'Update / Re-upload ' + doc.docType
    };

    if (typeof LiveNotifications !== 'undefined' && LiveNotifications.dispatch) {
      LiveNotifications.dispatch(notifPayload);
    } else {
      const userNotifs = DB.get('user_notifications') || [];
      userNotifs.unshift({ id: DB.nextId('user_notifications'), ...notifPayload, read: false, createdAt: new Date().toISOString() });
      DB.set('user_notifications', userNotifs);
    }

    // 2. Dispatch simulated webhook event
    if (typeof Webhooks !== 'undefined' && Webhooks.dispatchMockEvent) {
      Webhooks.dispatchMockEvent('document.expiry_reminder', {
        employeeId: doc.employeeId,
        employeeName: empName,
        docType: doc.docType,
        docNumber: doc.docNumber,
        expiryDate: doc.expiryDate,
        daysRemaining: diffDays,
        sentBy: Auth.user?.username || 'admin'
      });
    }

    // 3. Security Audit Log
    DB.log('NOTIFICATION', 'Compliance', `Dispatched expiry notice for ${doc.docType} (${doc.docNumber}) to ${empName}`, Auth.user?.id, 'INFO');

    // 4. Update topbar notification counter in real-time
    if (typeof App !== 'undefined' && App.refreshNotifications) {
      App.refreshNotifications();
    }

    Toast.show(`Expiry notice & email alert dispatched to ${empName}!`, 'success', 'Notification Sent');
  },

  // ============================================================
  // BATCH 1: EXIT CLEARANCE & FULL & FINAL (F&F) SETTLEMENT
  // ============================================================
  renderExitClearance(container) {
    const clearances = DB.get('exit_clearances') || [];
    const allEmps = DB.get('employees') || [];

    const inProgress = clearances.filter(c => c.status === 'in_progress').length;
    const completed = clearances.filter(c => c.status === 'completed').length;
    const totalDisbursed = clearances.reduce((sum, c) => sum + (c.settlement?.netPayable || 0), 0);

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Metrics Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          ${[
            { label:'Total Resignations & Exits', val: clearances.length, color:'var(--primary)', icon:'fa-user-minus' },
            { label:'Clearances in Progress', val: inProgress, color:'#f59e0b', icon:'fa-spinner' },
            { label:'Clearances Completed', val: completed, color:'#10b981', icon:'fa-circle-check' },
            { label:'Total F&F Settlement Value', val: Utils.formatCurrency(totalDisbursed), color:'var(--accent)', icon:'fa-money-bill-transfer' },
          ].map(s => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;gap:14px">
              <div style="width:44px;height:44px;border-radius:10px;background:${s.color}22;display:flex;align-items:center;justify-content:center;color:${s.color};font-size:20px">
                <i class="fa ${s.icon}"></i>
              </div>
              <div>
                <div style="font-size:20px;font-weight:800;color:${s.color}">${s.val}</div>
                <div style="font-size:12px;color:var(--text-3)">${s.label}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Action Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div>
            <h3 style="font-size:16px;font-weight:700;margin:0 0 2px 0">Exit Clearance & Final Settlement Cases</h3>
            <div style="font-size:12px;color:var(--text-3)">Multi-department clearance checklist across IT, Admin, Finance, and HR</div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="Employees.showInitiateExitModal()">
              <i class="fa fa-user-xmark"></i> Initiate Exit Clearance
            </button>
          </div>
        </div>

        <!-- Clearance Cases List -->
        <div style="display:flex;flex-direction:column;gap:18px">
          ${clearances.length === 0 ? `
            <div class="card"><div class="empty-state"><i class="fa fa-user-shield"></i><h3>No exit clearance cases recorded</h3></div></div>
          ` : clearances.map(c => {
            const emp = allEmps.find(e => e.id === c.employeeId) || { fullName: 'Employee', empNo: 'EMP-??', departmentId: 1, designationId: 1 };
            
            // Calculate progress percentage across all 4 departments
            let totalItems = 0;
            let doneItems = 0;
            ['it', 'admin', 'finance', 'hr'].forEach(deptKey => {
              const d = c.departments?.[deptKey];
              if (d && d.items) {
                totalItems += d.items.length;
                doneItems += d.items.filter(i => i.done).length;
              }
            });
            const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

            return `
              <div class="card" style="padding:20px">
                <!-- Case Header -->
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:16px">
                  <div style="display:flex;align-items:center;gap:12px">
                    <div class="avatar avatar-md" style="background:${Utils.avatarColor(emp.id)}">
                      ${emp.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName}">` : Utils.avatarInitials(emp.fullName)}
                    </div>
                    <div>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:16px;font-weight:700;color:var(--primary);cursor:pointer" onclick="Employees.renderProfile(${emp.id})">${emp.fullName}</span>
                        <span class="chip" style="font-size:10.5px">${emp.empNo}</span>
                        <span class="badge ${c.status==='completed'?'badge-success':'badge-warning'}" style="font-size:10px">
                          ${c.status === 'completed' ? '<i class="fa fa-check-double"></i> Fully Cleared & Settled' : '<i class="fa fa-spinner"></i> Clearance In Progress'}
                        </span>
                      </div>
                      <div style="font-size:12px;color:var(--text-3);margin-top:2px">
                        ${Utils.getDesigName(emp.designationId)} • ${Utils.getDeptName(emp.departmentId)} | 
                        Resignation: <strong>${c.resignationDate}</strong> | Last Working Day: <strong>${c.lastWorkingDay}</strong>
                      </div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div style="display:flex;align-items:center;gap:8px">
                    <button class="btn btn-secondary btn-sm" onclick="Employees.showFandFModal(${c.id})">
                      <i class="fa fa-calculator"></i> View / Edit F&F
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="Employees.printFandFStatement(${c.id})">
                      <i class="fa fa-print"></i> Print F&F Statement
                    </button>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div style="margin-bottom:18px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
                    <span><strong>Overall Clearance Progress:</strong> ${doneItems} of ${totalItems} checkpoints completed</span>
                    <span style="font-weight:700;color:${pct===100?'var(--success)':'var(--primary)'}">${pct}%</span>
                  </div>
                  <div class="progress" style="height:8px;background:var(--surface)">
                    <div class="progress-bar" style="width:${pct}%;background:${pct===100?'var(--success)':'var(--primary)'}"></div>
                  </div>
                </div>

                <!-- 4 Department Checkpoint Cards Grid -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">
                  ${[
                    { key:'it', label:'IT Dept', icon:'fa-laptop', data: c.departments?.it },
                    { key:'admin', label:'Admin & Facility', icon:'fa-building', data: c.departments?.admin },
                    { key:'finance', label:'Finance Dept', icon:'fa-landmark', data: c.departments?.finance },
                    { key:'hr', label:'Human Resources', icon:'fa-user-tie', data: c.departments?.hr },
                  ].map(dept => {
                    const isCleared = dept.data?.cleared;
                    return `
                      <div style="background:var(--surface);border:1px solid ${isCleared?'var(--success)':'var(--border)'};border-radius:10px;padding:12px;position:relative">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                          <div style="font-weight:700;font-size:12.5px;display:flex;align-items:center;gap:6px">
                            <i class="fa ${dept.icon}" style="color:var(--primary)"></i> ${dept.label}
                          </div>
                          <span class="badge ${isCleared?'badge-success':'badge-warning'}" style="font-size:9.5px;padding:1px 6px">
                            ${isCleared ? 'Cleared' : 'Pending'}
                          </span>
                        </div>

                        <!-- Checkbox items -->
                        <div style="display:flex;flex-direction:column;gap:6px;font-size:11.5px;margin-bottom:10px">
                          ${(dept.data?.items || []).map((item, idx) => `
                            <label style="display:flex;align-items:flex-start;gap:6px;cursor:pointer;line-height:1.3">
                              <input type="checkbox" ${item.done?'checked':''} onchange="Employees.toggleClearanceItem(${c.id}, '${dept.key}', ${idx})" style="margin-top:2px">
                              <span style="${item.done?'text-decoration:line-through;color:var(--text-3)':''}">${item.name}</span>
                            </label>
                          `).join('')}
                        </div>

                        <div style="font-size:10px;color:var(--text-3);border-top:1px dashed var(--border);padding-top:6px">
                          ${isCleared ? `<span style="color:var(--success)"><i class="fa fa-check"></i> ${dept.data.clearedBy || 'Verified'} (${dept.data.clearedDate || ''})</span>` : 'Awaiting final sign-off'}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <!-- Financial Settlement Quick Bar -->
                <div style="background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(16,185,129,0.06));border:1px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
                  <div style="display:flex;align-items:center;gap:18px;font-size:12px;flex-wrap:wrap">
                    <div><span style="color:var(--text-3)">Basic Salary:</span> <strong>${Utils.formatCurrency(c.settlement?.basicSalary || 0)}</strong></div>
                    <div><span style="color:var(--text-3)">Leave Encashment:</span> <strong>${Utils.formatCurrency(c.settlement?.leaveEncashmentAmount || 0)}</strong> (${c.settlement?.leaveBalanceDays || 0} days)</div>
                    <div><span style="color:var(--text-3)">Gratuity:</span> <strong>${Utils.formatCurrency(c.settlement?.gratuityAmount || 0)}</strong> (${c.settlement?.gratuityYears || 0} yrs)</div>
                    <div><span style="color:var(--text-3)">Deductions:</span> <strong style="color:var(--danger)">${Utils.formatCurrency((c.settlement?.noticeDeduction||0) + (c.settlement?.loanDeduction||0))}</strong></div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:13px;color:var(--text-2);font-weight:600">Net Payable:</span>
                    <span style="font-size:18px;font-weight:800;color:var(--success)">${Utils.formatCurrency(c.settlement?.netPayable || 0)}</span>
                    <span class="badge ${c.settlement?.paymentStatus==='paid'?'badge-success':'badge-warning'}" style="font-size:10px;margin-left:4px">
                      ${c.settlement?.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  toggleClearanceItem(caseId, deptKey, itemIdx) {
    const clearances = DB.get('exit_clearances') || [];
    const c = clearances.find(x => x.id === caseId);
    if (!c || !c.departments?.[deptKey]?.items?.[itemIdx]) return;

    c.departments[deptKey].items[itemIdx].done = !c.departments[deptKey].items[itemIdx].done;
    
    // If all items done in this dept, mark cleared
    const allDone = c.departments[deptKey].items.every(i => i.done);
    c.departments[deptKey].cleared = allDone;
    if (allDone) {
      c.departments[deptKey].clearedBy = Auth.user?.name || 'Authorized Officer';
      c.departments[deptKey].clearedDate = Utils.today();
    }

    // Check if all 4 depts are cleared
    const allDeptsCleared = ['it', 'admin', 'finance', 'hr'].every(d => c.departments[d]?.cleared);
    if (allDeptsCleared) {
      c.status = 'completed';
    } else {
      c.status = 'in_progress';
    }

    DB.set('exit_clearances', clearances);
    Toast.show('Clearance checklist updated!', 'success');
    this.renderExitClearance(document.getElementById('emp-content'));
  },

  showInitiateExitModal() {
    const activeEmps = (DB.get('employees') || []).filter(e => e.status === 'active');
    Modal.show('Initiate Exit Clearance', `
      <form onsubmit="Employees.saveInitiateExit(event)">
        <div class="form-group mb-14">
          <label class="form-label required">Employee</label>
          <select class="form-control" id="m-exit-emp" required>
            ${activeEmps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo}) — ${Utils.getDesigName(e.designationId)}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Resignation Date</label>
            <input type="date" class="form-control" id="m-exit-resig" value="${Utils.today()}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Last Working Day (LWD)</label>
            <input type="date" class="form-control" id="m-exit-lwd" required>
          </div>
        </div>
        <div class="form-group mb-14">
          <label class="form-label">Notice Period (Days)</label>
          <input type="number" class="form-control" id="m-exit-notice" value="30">
        </div>
        <div class="form-group mb-14">
          <label class="form-label required">Reason for Leaving</label>
          <select class="form-control" id="m-exit-reason" required>
            <option value="Better Career Opportunity / Higher Compensation">Better Career Opportunity / Higher Compensation</option>
            <option value="Relocation / Family Reasons">Relocation / Family Reasons</option>
            <option value="Pursuing Higher Studies">Pursuing Higher Studies</option>
            <option value="Health / Personal Reasons">Health / Personal Reasons</option>
            <option value="End of Contract Tenure">End of Contract Tenure</option>
            <option value="Mutual Separation / Redundancy">Mutual Separation / Redundancy</option>
          </select>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-danger"><i class="fa fa-user-xmark"></i> Initiate Clearance</button>
        </div>
      </form>
    `);
  },

  saveInitiateExit(e) {
    e.preventDefault();
    const empId = parseInt(document.getElementById('m-exit-emp').value);
    const emp = DB.find('employees', empId);
    if (!emp) return;

    const clearances = DB.get('exit_clearances') || [];
    const basicSalary = emp.salary || 70000;
    const leaveBalance = 10; // default estimated
    const gratuityYears = Math.max(1, new Date().getFullYear() - parseInt((emp.joiningDate||'2022').slice(0,4)));

    const newCase = {
      id: DB.nextId('exit_clearances'),
      employeeId: empId,
      resignationDate: document.getElementById('m-exit-resig').value,
      lastWorkingDay: document.getElementById('m-exit-lwd').value,
      noticePeriodDays: parseInt(document.getElementById('m-exit-notice').value) || 30,
      reason: document.getElementById('m-exit-reason').value,
      status: 'in_progress',
      departments: {
        it: {
          cleared: false, clearedBy: '', clearedDate: '',
          remarks: 'Awaiting asset return & credential deactivation',
          items: [
            { name: 'Laptop & Charger Returned', done: false },
            { name: 'Email & Cloud Accounts Deactivated', done: false },
            { name: 'Source Code & VPN Access Revoked', done: false }
          ]
        },
        admin: {
          cleared: false, clearedBy: '', clearedDate: '',
          remarks: 'Awaiting badge and keys return',
          items: [
            { name: 'Building Access Card Handed In', done: false },
            { name: 'Locker Keys Returned & Cleared', done: false },
            { name: 'Cafeteria Card Deactivated', done: false }
          ]
        },
        finance: {
          cleared: false, clearedBy: '', clearedDate: '',
          remarks: 'Awaiting final account reconciliation',
          items: [
            { name: 'Company Loan Balances Settled', done: false },
            { name: 'Petty Cash Advances Reconciled', done: false },
            { name: 'Corporate Fuel/Credit Card Revoked', done: false }
          ]
        },
        hr: {
          cleared: false, clearedBy: '', clearedDate: '',
          remarks: 'Exit interview pending',
          items: [
            { name: 'Exit Interview Completed', done: false },
            { name: 'Health Insurance Cards Returned', done: false },
            { name: 'Handover Document Signed by Supervisor', done: false },
            { name: 'Final F&F Settlement Statement Approved', done: false }
          ]
        }
      },
      settlement: {
        basicSalary,
        workedDays: 30,
        unpaidSalary: basicSalary,
        leaveBalanceDays: leaveBalance,
        leaveEncashmentAmount: Math.round((basicSalary / 30) * leaveBalance),
        gratuityYears,
        gratuityAmount: basicSalary * gratuityYears,
        noticeShortfallDays: 0,
        noticeDeduction: 0,
        loanDeduction: 0,
        otherDeductions: 0,
        netPayable: basicSalary + Math.round((basicSalary / 30) * leaveBalance) + (basicSalary * gratuityYears),
        paymentStatus: 'pending',
        paidDate: null,
        chequeNo: ''
      }
    };

    clearances.push(newCase);
    DB.set('exit_clearances', clearances);
    Modal.close('dynamic-modal');
    Toast.show(`Exit clearance initiated for ${emp.fullName}`, 'success');
    this.renderExitClearance(document.getElementById('emp-content'));
  },

  showFandFModal(caseId) {
    const clearances = DB.get('exit_clearances') || [];
    const c = clearances.find(x => x.id === caseId);
    if (!c) return;
    const emp = DB.find('employees', c.employeeId) || { fullName: 'Employee', empNo: 'EMP-??' };
    const s = c.settlement || {};

    Modal.show(`Full & Final Settlement — ${emp.fullName}`, `
      <form onsubmit="Employees.saveFandF(event, ${c.id})">
        <div style="background:var(--surface);padding:12px;border-radius:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:14px">${emp.fullName} (${emp.empNo})</div>
            <div style="font-size:11.5px;color:var(--text-3)">Resignation: ${c.resignationDate} | LWD: ${c.lastWorkingDay}</div>
          </div>
          <span class="chip">${c.reason}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <!-- Earnings / Additions -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px">
            <h4 style="font-size:13px;font-weight:700;margin:0 0 10px 0;color:var(--success)"><i class="fa fa-circle-plus"></i> Payable Items</h4>
            <div class="form-group mb-8">
              <label class="form-label" style="font-size:11px">Monthly Basic Salary</label>
              <input type="number" class="form-control" id="ff-basic" value="${s.basicSalary||0}" oninput="Employees.recalcFF()">
            </div>
            <div class="form-group mb-8">
              <label class="form-label" style="font-size:11px">Worked Days in Last Month</label>
              <input type="number" class="form-control" id="ff-worked-days" value="${s.workedDays||30}" oninput="Employees.recalcFF()">
            </div>
            <div class="form-group mb-8">
              <label class="form-label" style="font-size:11px">Unavailed Leaves to Encash (Days)</label>
              <input type="number" class="form-control" id="ff-leave-days" value="${s.leaveBalanceDays||0}" oninput="Employees.recalcFF()">
            </div>
            <div class="form-group mb-8">
              <label class="form-label" style="font-size:11px">Gratuity Completed Years</label>
              <input type="number" class="form-control" id="ff-gratuity-yrs" value="${s.gratuityYears||0}" oninput="Employees.recalcFF()">
            </div>
          </div>

          <!-- Deductions -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px">
            <h4 style="font-size:13px;font-weight:700;margin:0 0 10px 0;color:var(--danger)"><i class="fa fa-circle-minus"></i> Deductions</h4>
            <div class="form-group mb-8">
              <label class="form-label" style="font-size:11px">Notice Period Shortfall (Days)</label>
              <input type="number" class="form-control" id="ff-notice-days" value="${s.noticeShortfallDays||0}" oninput="Employees.recalcFF()">
            </div>
            <div class="form-group mb-8">
              <label class="form-label" style="font-size:11px">Loan / Advance Deduction</label>
              <input type="number" class="form-control" id="ff-loan-deduct" value="${s.loanDeduction||0}" oninput="Employees.recalcFF()">
            </div>
            <div class="form-group mb-8">
              <label class="form-label" style="font-size:11px">Other Deductions (Assets/Damages)</label>
              <input type="number" class="form-control" id="ff-other-deduct" value="${s.otherDeductions||0}" oninput="Employees.recalcFF()">
            </div>
            <div class="form-group mb-8">
              <label class="form-label" style="font-size:11px">Disbursement Status</label>
              <select class="form-control" id="ff-status">
                <option value="pending" ${s.paymentStatus==='pending'?'selected':''}>Pending Payment</option>
                <option value="paid" ${s.paymentStatus==='paid'?'selected':''}>Paid & Reconciled</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Live Net Calculation Display -->
        <div style="background:var(--card);border:2px solid var(--primary);border-radius:10px;padding:14px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-size:12px;color:var(--text-3)">Calculated Net Payable Amount</div>
            <div style="font-size:24px;font-weight:800;color:var(--success)" id="ff-net-display">${Utils.formatCurrency(s.netPayable||0)}</div>
          </div>
          <div style="font-size:11.5px;color:var(--text-3);text-align:right" id="ff-breakdown-text">
            Salary: ${Utils.formatCurrency(s.unpaidSalary||0)} + Leaves: ${Utils.formatCurrency(s.leaveEncashmentAmount||0)} + Gratuity: ${Utils.formatCurrency(s.gratuityAmount||0)}
          </div>
        </div>

        <div class="modal-footer" style="padding:0">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Save F&F Settlement</button>
        </div>
      </form>
    `);
  },

  recalcFF() {
    const basic = parseFloat(document.getElementById('ff-basic')?.value) || 0;
    const workedDays = parseFloat(document.getElementById('ff-worked-days')?.value) || 0;
    const leaveDays = parseFloat(document.getElementById('ff-leave-days')?.value) || 0;
    const gratYears = parseFloat(document.getElementById('ff-gratuity-yrs')?.value) || 0;
    const noticeDays = parseFloat(document.getElementById('ff-notice-days')?.value) || 0;
    const loanDeduct = parseFloat(document.getElementById('ff-loan-deduct')?.value) || 0;
    const otherDeduct = parseFloat(document.getElementById('ff-other-deduct')?.value) || 0;

    const perDay = basic / 30;
    const unpaidSalary = Math.round(perDay * workedDays);
    const leaveEncash = Math.round(perDay * leaveDays);
    const gratuity = Math.round(basic * gratYears);
    const noticeDeduct = Math.round(perDay * noticeDays);

    const net = Math.max(0, unpaidSalary + leaveEncash + gratuity - noticeDeduct - loanDeduct - otherDeduct);

    const display = document.getElementById('ff-net-display');
    if (display) display.textContent = Utils.formatCurrency(net);
    const breakdown = document.getElementById('ff-breakdown-text');
    if (breakdown) breakdown.textContent = `Salary: ${Utils.formatCurrency(unpaidSalary)} + Leaves: ${Utils.formatCurrency(leaveEncash)} + Gratuity: ${Utils.formatCurrency(gratuity)} - Deductions: ${Utils.formatCurrency(noticeDeduct + loanDeduct + otherDeduct)}`;
  },

  saveFandF(e, caseId) {
    e.preventDefault();
    const clearances = DB.get('exit_clearances') || [];
    const c = clearances.find(x => x.id === caseId);
    if (!c) return;

    const basic = parseFloat(document.getElementById('ff-basic')?.value) || 0;
    const workedDays = parseFloat(document.getElementById('ff-worked-days')?.value) || 0;
    const leaveDays = parseFloat(document.getElementById('ff-leave-days')?.value) || 0;
    const gratYears = parseFloat(document.getElementById('ff-gratuity-yrs')?.value) || 0;
    const noticeDays = parseFloat(document.getElementById('ff-notice-days')?.value) || 0;
    const loanDeduct = parseFloat(document.getElementById('ff-loan-deduct')?.value) || 0;
    const otherDeduct = parseFloat(document.getElementById('ff-other-deduct')?.value) || 0;
    const status = document.getElementById('ff-status')?.value || 'pending';

    const perDay = basic / 30;
    const unpaidSalary = Math.round(perDay * workedDays);
    const leaveEncash = Math.round(perDay * leaveDays);
    const gratuity = Math.round(basic * gratYears);
    const noticeDeduct = Math.round(perDay * noticeDays);
    const net = Math.max(0, unpaidSalary + leaveEncash + gratuity - noticeDeduct - loanDeduct - otherDeduct);

    c.settlement = {
      basicSalary: basic,
      workedDays,
      unpaidSalary,
      leaveBalanceDays: leaveDays,
      leaveEncashmentAmount: leaveEncash,
      gratuityYears: gratYears,
      gratuityAmount: gratuity,
      noticeShortfallDays: noticeDays,
      noticeDeduction: noticeDeduct,
      loanDeduction: loanDeduct,
      otherDeductions: otherDeduct,
      netPayable: net,
      paymentStatus: status,
      paidDate: status === 'paid' ? Utils.today() : null
    };

    DB.set('exit_clearances', clearances);
    Modal.close('dynamic-modal');
    Toast.show('F&F Settlement calculations saved!', 'success');
    this.renderExitClearance(document.getElementById('emp-content'));
  },

  printFandFStatement(caseId) {
    const clearances = DB.get('exit_clearances') || [];
    const c = clearances.find(x => x.id === caseId);
    if (!c) return;
    const emp = DB.find('employees', c.employeeId) || { fullName: 'Employee', empNo: 'EMP-??', cnic: '42201-???????-?' };
    const s = c.settlement || {};
    const settings = DB.getObj('settings') || {};

    const printWin = window.open('', '_blank', 'width=900,height=950');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Full & Final Settlement Statement — ${emp.fullName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .meta-table td { padding: 6px 10px; font-size: 13px; border: 1px solid #e2e8f0; }
          .meta-table td.label { background: #f8fafc; font-weight: 700; width: 22%; color: #475569; }
          .calc-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .calc-table th { background: #1e293b; color: #fff; padding: 10px; font-size: 13px; text-align: left; }
          .calc-table td { padding: 8px 10px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          .calc-table tr.total-row { background: #eff6ff; font-weight: 800; font-size: 15px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 60px; text-align: center; }
          .sig-line { border-top: 1.5px solid #475569; padding-top: 8px; font-size: 12px; font-weight: 600; }
          @media print { body { padding: 15mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin:0;font-size:24px;color:#1e40af">${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</h1>
            <div style="font-size:12px;color:#64748b">${settings.companyAddress || 'Head Office: Business Executive Tower, Karachi, Pakistan'}</div>
          </div>
          <div style="text-align:right">
            <div class="title">Full & Final Settlement</div>
            <div style="font-size:12px;color:#64748b">Ref: FNF-${String(c.id).padStart(4,'0')} | Date: ${Utils.today()}</div>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="label">Employee Name:</td>
            <td><strong>${emp.fullName}</strong></td>
            <td class="label">Employee ID:</td>
            <td><strong>${emp.empNo}</strong></td>
          </tr>
          <tr>
            <td class="label">CNIC No:</td>
            <td>${emp.cnic || 'N/A'}</td>
            <td class="label">Department:</td>
            <td>${Utils.getDeptName(emp.departmentId)}</td>
          </tr>
          <tr>
            <td class="label">Designation:</td>
            <td>${Utils.getDesigName(emp.designationId)}</td>
            <td class="label">Date of Joining:</td>
            <td>${emp.joiningDate || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Resignation Date:</td>
            <td>${c.resignationDate}</td>
            <td class="label">Last Working Day:</td>
            <td>${c.lastWorkingDay}</td>
          </tr>
          <tr>
            <td class="label">Separation Reason:</td>
            <td colspan="3">${c.reason}</td>
          </tr>
        </table>

        <h3 style="font-size:15px;margin:0 0 10px 0;color:#1e293b">Financial Settlement Summary</h3>
        <table class="calc-table">
          <thead>
            <tr>
              <th>Component Description</th>
              <th style="text-align:center">Basis / Formula</th>
              <th style="text-align:right">Payable (PKR)</th>
              <th style="text-align:right">Deductions (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Unpaid Salary for Last Month</td>
              <td style="text-align:center">${s.workedDays} days worked @ PKR ${Math.round(s.basicSalary/30)}/day</td>
              <td style="text-align:right">${Utils.formatCurrency(s.unpaidSalary||0)}</td>
              <td style="text-align:right">—</td>
            </tr>
            <tr>
              <td>Leave Encashment (Unavailed Balance)</td>
              <td style="text-align:center">${s.leaveBalanceDays} days balance encashed</td>
              <td style="text-align:right">${Utils.formatCurrency(s.leaveEncashmentAmount||0)}</td>
              <td style="text-align:right">—</td>
            </tr>
            <tr>
              <td>Statutory Gratuity Allowance</td>
              <td style="text-align:center">${s.gratuityYears} completed years of service</td>
              <td style="text-align:right">${Utils.formatCurrency(s.gratuityAmount||0)}</td>
              <td style="text-align:right">—</td>
            </tr>
            <tr>
              <td>Notice Period Shortfall Recovery</td>
              <td style="text-align:center">${s.noticeShortfallDays || 0} days shortfall</td>
              <td style="text-align:right">—</td>
              <td style="text-align:right;color:#dc2626">${s.noticeDeduction ? Utils.formatCurrency(s.noticeDeduction) : '0'}</td>
            </tr>
            <tr>
              <td>Outstanding Company Loan Balance</td>
              <td style="text-align:center">Clearance from Finance Dept</td>
              <td style="text-align:right">—</td>
              <td style="text-align:right;color:#dc2626">${s.loanDeduction ? Utils.formatCurrency(s.loanDeduction) : '0'}</td>
            </tr>
            <tr>
              <td>Other Asset / Damage Deductions</td>
              <td style="text-align:center">Clearance verification</td>
              <td style="text-align:right">—</td>
              <td style="text-align:right;color:#dc2626">${s.otherDeductions ? Utils.formatCurrency(s.otherDeductions) : '0'}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2">NET SETTLEMENT AMOUNT PAYABLE</td>
              <td colspan="2" style="text-align:right;color:#16a34a;font-size:18px">${Utils.formatCurrency(s.netPayable||0)}</td>
            </tr>
          </tbody>
        </table>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;font-size:11.5px;color:#475569;margin-bottom:30px">
          <strong>Employee Acknowledgment:</strong> I, <u>${emp.fullName}</u>, hereby confirm receipt of the above mentioned full and final settlement amount towards all my claims and dues against ${settings.companyName || 'the Company'}. I confirm that I have returned all company property and have no further financial claims.
        </div>

        <div class="signatures">
          <div>
            <div class="sig-line">Prepared By (HR Officer)</div>
          </div>
          <div>
            <div class="sig-line">Verified By (Finance Head)</div>
          </div>
          <div>
            <div class="sig-line">Employee Signature & Date</div>
          </div>
        </div>

        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  // ============================================================
  // BATCH 1: AUTOMATED HR LETTERS GENERATOR
  // ============================================================
  renderHRLetters(container) {
    const letters = DB.get('hr_letters') || [];
    const allEmps = DB.get('employees') || [];
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';
    const myEmpId = Auth.employee?.id;

    if (isStaff) {
      // Regular employees strictly view their own letters, print/download, and send acknowledgments
      const myLetters = letters.filter(l => l.employeeId === myEmpId);
      const pendingAckCount = myLetters.filter(l => !l.acknowledged).length;

      container.innerHTML = `
        <div class="animate-fade-in">
          <!-- Employee Portal Header Card -->
          <div class="card mb-20" style="background:linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(37,99,235,0.04) 100%);border-left:4px solid var(--primary)">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div>
                <h3 style="font-size:17px;font-weight:700;margin:0 0 4px 0;display:flex;align-items:center;gap:8px">
                  <i class="fa fa-file-signature" style="color:var(--primary)"></i> My Official HR Letters & Verification Certificates
                </h3>
                <div style="font-size:12.5px;color:var(--text-3)">
                  Corporate letters and certificates issued to you by Management & Human Resources. Review, print, and submit formal acknowledgment of receipt.
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                ${pendingAckCount > 0 ? `
                  <span class="badge badge-warning" style="font-size:11.5px;padding:4px 10px;background:#f59e0b;color:#fff">
                    <i class="fa fa-bell"></i> ${pendingAckCount} Acknowledgment${pendingAckCount > 1 ? 's' : ''} Pending
                  </span>
                ` : `
                  <span class="badge badge-success" style="font-size:11.5px;padding:4px 10px">
                    <i class="fa fa-circle-check"></i> All Letters Acknowledged
                  </span>
                `}
                <span class="chip" style="font-size:11px"><i class="fa fa-stamp"></i> Corporate Authorized Documents</span>
              </div>
            </div>
          </div>

          <!-- Letters Archive Table for Employee -->
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <h4 style="font-size:14px;font-weight:700;margin:0">Official Letters Issued to Me (${myLetters.length})</h4>
              <span style="font-size:12px;color:var(--text-3)">Digitally signed and verifiable corporate certificates</span>
            </div>
            <div class="table-wrapper" style="border:none;border-radius:0">
              <table>
                <thead><tr>
                  <th>Reference #</th>
                  <th>Letter Title & Type</th>
                  <th>Addressee / Purpose</th>
                  <th>Issue Date</th>
                  <th>Issued By</th>
                  <th>Receipt Status</th>
                  <th style="text-align:right">Actions</th>
                </tr></thead>
                <tbody>
                  ${myLetters.length === 0 ? `
                    <tr><td colspan="7"><div class="empty-state"><i class="fa fa-file-circle-check" style="color:var(--primary)"></i><h3>No HR letters issued yet</h3><p>Official letters generated by HR Management will appear here with instant print and acknowledgment options.</p></div></td></tr>
                  ` : myLetters.map(l => `
                    <tr>
                      <td><code style="font-family:monospace;font-size:12px;color:var(--primary)">${l.refNo}</code></td>
                      <td>
                        <div style="font-weight:600;font-size:13px;color:var(--text)">${l.title || l.templateType}</div>
                        <div style="font-size:11px;color:var(--text-3);text-transform:capitalize">${(l.templateType || '').replace(/_/g, ' ')}</div>
                      </td>
                      <td style="font-size:12px">
                        <div><strong>${l.recipient}</strong></div>
                        <div style="font-size:11px;color:var(--text-3)">${l.purpose || 'General Purpose'}</div>
                      </td>
                      <td style="font-size:12px">${Utils.formatDate(l.issueDate)}</td>
                      <td style="font-size:12px">${l.issuedBy}</td>
                      <td>
                        ${l.acknowledged ? `
                          <span class="badge badge-success" style="font-size:11px;padding:3px 8px">
                            <i class="fa fa-circle-check"></i> Acknowledged (${Utils.formatDate(l.acknowledgedAt)})
                          </span>
                        ` : `
                          <span class="badge badge-warning" style="font-size:11px;padding:3px 8px;background:#f59e0b;color:#fff">
                            <i class="fa fa-clock"></i> Action Required: Pending
                          </span>
                        `}
                      </td>
                      <td style="text-align:right">
                        <div style="display:flex;justify-content:flex-end;gap:6px">
                          <button class="btn btn-ghost btn-xs" onclick="Employees.previewLetterModal(${l.id})">
                            <i class="fa fa-eye"></i> View & Print
                          </button>
                          ${!l.acknowledged ? `
                            <button class="btn btn-success btn-xs" onclick="Employees.acknowledgeLetter(${l.id})" title="Formally confirm and acknowledge receipt of this official letter">
                              <i class="fa fa-check-double"></i> Acknowledge Receipt
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // HR Management & Super Admin View (Letter Generator Form + Company-wide Archive)
    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Letter Generator Header & Wizard Card -->
        <div class="card mb-20">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:14px;margin-bottom:18px">
            <div>
              <h3 style="font-size:17px;font-weight:700;margin:0 0 3px 0;display:flex;align-items:center;gap:8px">
                <i class="fa fa-file-signature" style="color:var(--primary)"></i> Official HR Letter & Certificate Generator
              </h3>
              <div style="font-size:12.5px;color:var(--text-3)">Generate formal corporate documents on official letterhead with 1-click print & PDF download</div>
            </div>
            <span class="chip" style="font-size:11px"><i class="fa fa-stamp"></i> Corporate Authorized Format</span>
          </div>

          <!-- Generation Form -->
          <form onsubmit="Employees.generateHRLetter(event)">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px" class="mb-14">
              <div class="form-group">
                <label class="form-label required">Select Employee</label>
                <select class="form-control" id="hl-emp" required>
                  ${allEmps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo}) - ${Utils.getDesigName(e.designationId)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label required">Template Type</label>
                <select class="form-control" id="hl-template" required onchange="Employees.onLetterTemplateChange()">
                  <option value="experience">Experience & Service Certificate</option>
                  <option value="relieving">Formal Relieving Letter</option>
                  <option value="salary_certificate">Salary Verification Certificate</option>
                  <option value="confirmation">Employment Confirmation Letter</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label required">Recipient / Addressee</label>
                <input type="text" class="form-control" id="hl-recipient" value="To Whom It May Concern" required>
              </div>

              <div class="form-group">
                <label class="form-label required">Issue Date</label>
                <input type="date" class="form-control" id="hl-date" value="${Utils.today()}" required>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-16">
              <div class="form-group">
                <label class="form-label">Purpose / Reference Remarks</label>
                <input type="text" class="form-control" id="hl-purpose" placeholder="e.g. Visa Application, Banking / Credit Card, Higher Studies">
              </div>
              <div class="form-group">
                <label class="form-label">Authorized Signatory</label>
                <input type="text" class="form-control" id="hl-signatory" value="Sara Malik (Head of Human Resources)">
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px">
              <button type="submit" class="btn btn-primary">
                <i class="fa fa-wand-magic-sparkles"></i> Generate & Preview Official Letter
              </button>
            </div>
          </form>
        </div>

        <!-- Previously Issued Letters Table -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <h4 style="font-size:14px;font-weight:700;margin:0">Previously Issued Letters Archive (${letters.length})</h4>
            <span style="font-size:12px;color:var(--text-3)">Audit trail of all generated verification letters</span>
          </div>
          <div class="table-wrapper" style="border:none;border-radius:0">
            <table>
              <thead><tr>
                <th>Reference #</th>
                <th>Employee</th>
                <th>Letter Type</th>
                <th>Recipient / Purpose</th>
                <th>Issue Date</th>
                <th>Issued By</th>
                <th>Receipt Status</th>
                <th style="text-align:right">Action</th>
              </tr></thead>
              <tbody>
                ${letters.length === 0 ? `
                  <tr><td colspan="8"><div class="empty-state"><i class="fa fa-file-invoice"></i><h3>No letters issued yet</h3></div></td></tr>
                ` : letters.map(l => {
                  const emp = allEmps.find(e => e.id === l.employeeId) || { fullName: 'Employee', empNo: 'EMP-??' };
                  return `
                    <tr>
                      <td><code style="font-family:monospace;font-size:12px;color:var(--primary)">${l.refNo}</code></td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px">
                          <div class="avatar avatar-xs" style="background:${Utils.avatarColor(emp.id)}">${Utils.avatarInitials(emp.fullName)}</div>
                          <span style="font-weight:600">${emp.fullName}</span>
                          <span style="font-size:11px;color:var(--text-3)">(${emp.empNo})</span>
                        </div>
                      </td>
                      <td><span class="chip" style="font-size:11px">${l.title || l.templateType}</span></td>
                      <td style="font-size:12px">${l.recipient}</td>
                      <td style="font-size:12px">${Utils.formatDate(l.issueDate)}</td>
                      <td style="font-size:12px">${l.issuedBy}</td>
                      <td>
                        ${l.acknowledged ? `
                          <span class="badge badge-success" style="font-size:11px;padding:3px 8px">
                            <i class="fa fa-circle-check"></i> Acknowledged (${Utils.formatDate(l.acknowledgedAt)})
                          </span>
                        ` : `
                          <span class="badge badge-secondary" style="font-size:11px;padding:3px 8px">
                            <i class="fa fa-clock"></i> Pending
                          </span>
                        `}
                      </td>
                      <td style="text-align:right">
                        <button class="btn btn-ghost btn-xs" onclick="Employees.previewLetterModal(${l.id})">
                          <i class="fa fa-eye"></i> View & Print
                        </button>
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

  acknowledgeLetter(letterId) {
    const letters = DB.get('hr_letters') || [];
    const l = letters.find(x => x.id === letterId);
    if (!l) return Toast.show('Letter not found', 'danger');
    if (l.acknowledged) return Toast.show('This letter has already been acknowledged.', 'info');

    const emp = Auth.employee || DB.find('employees', l.employeeId);
    const empName = emp ? emp.fullName : (Auth.user?.name || 'Employee');

    l.acknowledged = true;
    l.acknowledgedAt = new Date().toISOString();
    l.acknowledgedBy = empName;
    DB.set('hr_letters', letters);

    // Notify HR Management and Super Admin via LiveNotifications
    const ackPayload = {
      recipientRole: 'hr_manager',
      senderRole: 'employee',
      senderName: empName,
      type: 'letter_acknowledgment',
      priority: 'normal',
      title: `✅ Letter Acknowledged: ${l.title || 'Official Letter'}`,
      message: `${empName} (${emp?.empNo || 'EMP'}) has formally acknowledged receipt of official letter ${l.refNo} (${l.title || l.templateType}).`,
      actionUrl: 'employees',
      subView: 'hr_letters',
      actionLabel: 'View Letter'
    };

    if (typeof LiveNotifications !== 'undefined' && LiveNotifications.dispatch) {
      LiveNotifications.dispatch(ackPayload);
    } else {
      const userNotifs = DB.get('user_notifications') || [];
      userNotifs.unshift({ id: DB.nextId('user_notifications'), ...ackPayload, read: false, createdAt: new Date().toISOString() });
      DB.set('user_notifications', userNotifs);
    }

    // Mark employee's own notification about this letter as read
    const userNotifs = DB.get('user_notifications') || [];
    userNotifs.forEach(n => {
      if (parseInt(n.recipientEmpId) === parseInt(l.employeeId) && (n.type === 'hr_letter' || n.subView === 'hr_letters')) {
        if ((n.message && n.message.includes(l.refNo)) || (n.title && n.title.includes(l.title))) {
          n.read = true;
        }
      }
    });
    DB.set('user_notifications', userNotifs);
    if (typeof App !== 'undefined' && App.refreshNotifications) App.refreshNotifications();

    Toast.show('Official letter receipt acknowledged! Confirmation sent to HR.', 'success');
    this.renderHRLetters(document.getElementById('emp-content'));
  },

  onLetterTemplateChange() {
    const template = document.getElementById('hl-template')?.value;
    const recipient = document.getElementById('hl-recipient');
    const purpose = document.getElementById('hl-purpose');
    if (!recipient || !purpose) return;

    if (template === 'salary_certificate') {
      recipient.value = 'The Visa Officer / The Branch Manager';
      purpose.value = 'Official Visit Visa Application / Banking Services';
    } else if (template === 'experience' || template === 'relieving') {
      recipient.value = 'To Whom It May Concern';
      purpose.value = 'Proof of Employment & Service Record';
    } else if (template === 'confirmation') {
      recipient.value = 'Employee Direct';
      purpose.value = 'Confirmation of Employment Post Probation';
    }
  },

  generateHRLetter(e) {
    e.preventDefault();
    const empId = parseInt(document.getElementById('hl-emp').value);
    const emp = DB.find('employees', empId);
    if (!emp) return;

    const templateType = document.getElementById('hl-template').value;
    const recipient = document.getElementById('hl-recipient').value.trim();
    const issueDate = document.getElementById('hl-date').value;
    const purpose = document.getElementById('hl-purpose').value.trim() || 'General Verification';
    const issuedBy = document.getElementById('hl-signatory').value.trim();

    const letters = DB.get('hr_letters') || [];
    const year = new Date().getFullYear();
    const count = letters.length + 1;
    const refNo = `HRM/${templateType.toUpperCase().slice(0,3)}/${year}/${String(count).padStart(3, '0')}`;

    let title = 'Experience & Service Certificate';
    if (templateType === 'relieving') title = 'Formal Relieving & Release Letter';
    if (templateType === 'salary_certificate') title = 'Salary Verification & Employment Certificate';
    if (templateType === 'confirmation') title = 'Employment Confirmation Letter';

    const newLetter = {
      id: DB.nextId('hr_letters'),
      refNo,
      employeeId: empId,
      templateType,
      title,
      recipient,
      issueDate,
      issuedBy,
      purpose
    };

    letters.unshift(newLetter);
    DB.set('hr_letters', letters);

    // Dispatch targeted live notification to the employee
    const letterNotifPayload = {
      recipientEmpId: empId,
      recipientRole: 'employee',
      senderRole: Auth.role || 'hr_manager',
      senderName: issuedBy || 'HR Operations Directorate',
      type: 'hr_letter',
      priority: 'normal',
      title: `📄 Official HR Document Issued: ${title}`,
      message: `Your official ${title} (Ref: ${refNo}) has been issued by ${issuedBy || 'HR'}. You can view and print your digitally signed certificate directly from your portal.`,
      actionUrl: 'employees',
      subView: 'hr_letters',
      actionLabel: 'View Letter'
    };

    if (typeof LiveNotifications !== 'undefined' && LiveNotifications.dispatch) {
      LiveNotifications.dispatch(letterNotifPayload);
    } else {
      const userNotifs = DB.get('user_notifications') || [];
      userNotifs.unshift({ id: DB.nextId('user_notifications'), ...letterNotifPayload, read: false, createdAt: new Date().toISOString() });
      DB.set('user_notifications', userNotifs);
      if (typeof App !== 'undefined' && App.refreshNotifications) App.refreshNotifications();
    }

    Toast.show('Official letter generated and notified to employee!', 'success');
    this.renderHRLetters(document.getElementById('emp-content'));
    this.previewLetterModal(newLetter.id);
  },

  previewLetterModal(letterId) {
    const letters = DB.get('hr_letters') || [];
    const l = letters.find(x => x.id === letterId);
    if (!l) return;
    const emp = DB.find('employees', l.employeeId) || { fullName: 'Employee', empNo: 'EMP-??', cnic: '42201-???????-?', salary: 75000, joiningDate: '2022-01-01' };
    const settings = DB.getObj('settings') || {};

    let bodyHTML = '';
    if (l.templateType === 'experience') {
      bodyHTML = `
        <p>This is to certify that <strong>Mr./Ms. ${emp.fullName}</strong> (CNIC: <code>${emp.cnic || 'N/A'}</code>, Employee No: <code>${emp.empNo}</code>) was employed with <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong> as <strong>${Utils.getDesigName(emp.designationId)}</strong> in the <strong>${Utils.getDeptName(emp.departmentId)}</strong> department from <strong>${Utils.formatDate(emp.joiningDate)}</strong> to <strong>${l.issueDate}</strong>.</p>
        <p>During their tenure with us, we found them to be hard-working, disciplined, and professionally competent in executing their responsibilities. Their conduct and performance were exemplary.</p>
        <p>We wish them the very best in all their future personal and professional endeavors.</p>
      `;
    } else if (l.templateType === 'relieving') {
      bodyHTML = `
        <p>With reference to your formal resignation, we hereby accept your resignation and relieve you from your duties as <strong>${Utils.getDesigName(emp.designationId)}</strong> at <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong> with effect from the close of business hours on <strong>${l.issueDate}</strong>.</p>
        <p>We confirm that you have completed all mandatory exit clearances across the IT, Administration, Finance, and Human Resources departments, and have returned all company assets in satisfactory order. All financial dues have been settled.</p>
        <p>We appreciate your valuable contributions during your service with the company and wish you success in your future endeavors.</p>
      `;
    } else if (l.templateType === 'salary_certificate') {
      bodyHTML = `
        <p>This certificate is issued upon the request of <strong>Mr./Ms. ${emp.fullName}</strong> for the purpose of <strong>${l.purpose}</strong>.</p>
        <p>We confirm that Mr./Ms. ${emp.fullName} (CNIC: <code>${emp.cnic || 'N/A'}</code>, Employee ID: <code>${emp.empNo}</code>) is a permanent, full-time employee with <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong> since <strong>${Utils.formatDate(emp.joiningDate)}</strong>, currently serving as <strong>${Utils.getDesigName(emp.designationId)}</strong> in the <strong>${Utils.getDeptName(emp.departmentId)}</strong> department.</p>
        <p>Their present monthly salary and compensation breakdown is as follows:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
          <tr style="border-bottom:1px solid #ddd"><td style="padding:6px 0">Monthly Gross Basic Salary:</td><td style="text-align:right;font-weight:700">${Utils.formatCurrency(emp.salary || 70000)}</td></tr>
          <tr style="border-bottom:1px solid #ddd"><td style="padding:6px 0">House Rent & Utility Allowance:</td><td style="text-align:right;font-weight:700">${Utils.formatCurrency(Math.round((emp.salary||70000)*0.25))}</td></tr>
          <tr style="border-bottom:2px solid #333;font-weight:800"><td style="padding:8px 0">Total Gross Monthly Emoluments:</td><td style="text-align:right;color:#16a34a">${Utils.formatCurrency(Math.round((emp.salary||70000)*1.25))}</td></tr>
        </table>
        <p>To the best of our knowledge, their employment status is secure, active, and in good standing.</p>
      `;
    } else {
      bodyHTML = `
        <p>Following your successful performance review and the completion of your probationary service period, management is pleased to formally confirm your appointment as permanent <strong>${Utils.getDesigName(emp.designationId)}</strong> at <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong> effective <strong>${l.issueDate}</strong>.</p>
        <p>All other terms and conditions of your employment contract, including confidentiality, workplace code of conduct, and company benefits, shall remain applicable.</p>
        <p>We congratulate you on this milestone and look forward to your continued dedication and success with the organization.</p>
      `;
    }

    Modal.show('Official Letterhead Preview', `
      <div id="print-letterhead-area" style="background:#fff;color:#111;padding:30px;border-radius:8px;border:1px solid #ddd;font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;position:relative">
        <!-- Corporate Letterhead Header -->
        <div style="border-bottom:3px solid #2563eb;padding-bottom:14px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end">
          <div>
            <h2 style="margin:0;font-size:22px;color:#1e3a8a;font-weight:800;letter-spacing:0.5px">${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</h2>
            <div style="font-size:11.5px;color:#64748b">${settings.companyAddress || 'Corporate Plaza, Main Boulevard, Karachi, Pakistan'}</div>
            <div style="font-size:11px;color:#64748b">Phone: 021-34567890 | Email: hr@company.com | NTN: 4200881-7</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11.5px;color:#64748b">Ref: <strong>${l.refNo}</strong></div>
            <div style="font-size:11.5px;color:#64748b">Date: <strong>${l.issueDate}</strong></div>
          </div>
        </div>

        <!-- Addressee -->
        <div style="margin-bottom:20px;font-size:13px">
          <div><strong>To:</strong></div>
          <div style="font-size:14px;font-weight:700">${l.recipient}</div>
        </div>

        <!-- Title -->
        <div style="text-align:center;margin-bottom:22px">
          <h3 style="display:inline-block;margin:0;font-size:16px;font-weight:800;text-decoration:underline;text-transform:uppercase;letter-spacing:0.5px;color:#0f172a">
            ${l.title}
          </h3>
        </div>

        <!-- Body -->
        <div style="font-size:13.5px;color:#334155;text-align:justify;margin-bottom:40px">
          ${bodyHTML}
        </div>

        <!-- Signature & Seal Block -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px">
          <div>
            <div style="width:140px;height:45px;border-bottom:1.5px solid #334155;margin-bottom:6px"></div>
            <div style="font-size:12.5px;font-weight:700">${l.issuedBy}</div>
            <div style="font-size:11px;color:#64748b">Authorized Signatory</div>
            <div style="font-size:10.5px;color:#64748b">${settings.companyName || 'HRM Pro Corporation'}</div>
          </div>

          <!-- Official Stamp Watermark -->
          <div style="border:2px dashed #2563eb;border-radius:50%;width:88px;height:88px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#2563eb;transform:rotate(-10deg);opacity:0.85">
            <i class="fa fa-stamp" style="font-size:14px"></i>
            <span style="font-size:8px;font-weight:800;text-transform:uppercase;margin-top:2px">HR DEPT</span>
            <span style="font-size:7px">OFFICIAL SEAL</span>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="padding:14px 0 0 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <span style="font-size:12px;color:var(--text-3)">Printed copies are valid with official corporate seal</span>
        <div style="display:flex;gap:8px;align-items:center">
          ${l.acknowledged ? `
            <span style="font-size:12px;color:var(--success);font-weight:600;margin-right:6px">
              <i class="fa fa-circle-check"></i> Acknowledged on ${Utils.formatDate(l.acknowledgedAt)} by ${l.acknowledgedBy || 'Employee'}
            </span>
          ` : (Auth.role === 'employee' || Auth.employee?.id === l.employeeId ? `
            <button type="button" class="btn btn-success" onclick="Employees.acknowledgeLetter(${l.id}); Modal.close('dynamic-modal')">
              <i class="fa fa-check-double"></i> Acknowledge Receipt
            </button>
          ` : '')}
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
          <button type="button" class="btn btn-primary" onclick="Employees.printLetter(${l.id})">
            <i class="fa fa-print"></i> Print Official Letter
          </button>
        </div>
      </div>
    `);
  },

  printLetter(letterId) {
    const letters = DB.get('hr_letters') || [];
    const l = letters.find(x => x.id === letterId);
    if (!l) return;
    const emp = DB.find('employees', l.employeeId) || { fullName: 'Employee', empNo: 'EMP-??', cnic: '42201-???????-?', salary: 75000, joiningDate: '2022-01-01' };
    const settings = DB.getObj('settings') || {};

    let bodyHTML = '';
    if (l.templateType === 'experience') {
      bodyHTML = `
        <p>This is to certify that <strong>Mr./Ms. ${emp.fullName}</strong> (CNIC: <code>${emp.cnic || 'N/A'}</code>, Employee No: <code>${emp.empNo}</code>) was employed with <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong> as <strong>${Utils.getDesigName(emp.designationId)}</strong> in the <strong>${Utils.getDeptName(emp.departmentId)}</strong> department from <strong>${Utils.formatDate(emp.joiningDate)}</strong> to <strong>${l.issueDate}</strong>.</p>
        <p>During their tenure with us, we found them to be hard-working, disciplined, and professionally competent in executing their responsibilities. Their conduct and performance were exemplary.</p>
        <p>We wish them the very best in all their future personal and professional endeavors.</p>
      `;
    } else if (l.templateType === 'relieving') {
      bodyHTML = `
        <p>With reference to your formal resignation, we hereby accept your resignation and relieve you from your duties as <strong>${Utils.getDesigName(emp.designationId)}</strong> at <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong> with effect from the close of business hours on <strong>${l.issueDate}</strong>.</p>
        <p>We confirm that you have completed all mandatory exit clearances across the IT, Administration, Finance, and Human Resources departments, and have returned all company assets in satisfactory order. All financial dues have been settled.</p>
        <p>We appreciate your valuable contributions during your service with the company and wish you success in your future endeavors.</p>
      `;
    } else if (l.templateType === 'salary_certificate') {
      bodyHTML = `
        <p>This certificate is issued upon the request of <strong>Mr./Ms. ${emp.fullName}</strong> for the purpose of <strong>${l.purpose}</strong>.</p>
        <p>We confirm that Mr./Ms. ${emp.fullName} (CNIC: <code>${emp.cnic || 'N/A'}</code>, Employee ID: <code>${emp.empNo}</code>) is a permanent, full-time employee with <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong> since <strong>${Utils.formatDate(emp.joiningDate)}</strong>, currently serving as <strong>${Utils.getDesigName(emp.designationId)}</strong> in the <strong>${Utils.getDeptName(emp.departmentId)}</strong> department.</p>
        <p>Their present monthly salary and compensation breakdown is as follows:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
          <tr style="border-bottom:1px solid #ddd"><td style="padding:6px 0">Monthly Gross Basic Salary:</td><td style="text-align:right;font-weight:700">${Utils.formatCurrency(emp.salary || 70000)}</td></tr>
          <tr style="border-bottom:1px solid #ddd"><td style="padding:6px 0">House Rent & Utility Allowance:</td><td style="text-align:right;font-weight:700">${Utils.formatCurrency(Math.round((emp.salary||70000)*0.25))}</td></tr>
          <tr style="border-bottom:2px solid #333;font-weight:800"><td style="padding:8px 0">Total Gross Monthly Emoluments:</td><td style="text-align:right;color:#16a34a">${Utils.formatCurrency(Math.round((emp.salary||70000)*1.25))}</td></tr>
        </table>
        <p>To the best of our knowledge, their employment status is secure, active, and in good standing.</p>
      `;
    } else {
      bodyHTML = `
        <p>Following your successful performance review and the completion of your probationary service period, management is pleased to formally confirm your appointment as permanent <strong>${Utils.getDesigName(emp.designationId)}</strong> at <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong> effective <strong>${l.issueDate}</strong>.</p>
        <p>All other terms and conditions of your employment contract, including confidentiality, workplace code of conduct, and company benefits, shall remain applicable.</p>
        <p>We congratulate you on this milestone and look forward to your continued dedication and success with the organization.</p>
      `;
    }

    const printWin = window.open('', '_blank', 'width=900,height=950');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${l.title} — ${emp.fullName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { text-align: center; margin: 30px 0 25px; font-size: 18px; font-weight: 800; text-decoration: underline; text-transform: uppercase; }
          .content { font-size: 14.5px; text-align: justify; margin-bottom: 50px; }
          .sig-block { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; }
          .sig-line { width: 180px; border-top: 1.5px solid #111; padding-top: 6px; font-size: 13px; font-weight: 700; }
          .seal { border: 2px dashed #2563eb; border-radius: 50%; width: 90px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #2563eb; transform: rotate(-10deg); }
          @media print { body { padding: 15mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin:0;font-size:24px;color:#1e40af">${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</h1>
            <div style="font-size:12px;color:#64748b">${settings.companyAddress || 'Corporate Plaza, Main Boulevard, Karachi, Pakistan'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:#64748b">Ref: <strong>${l.refNo}</strong></div>
            <div style="font-size:12px;color:#64748b">Date: <strong>${l.issueDate}</strong></div>
          </div>
        </div>

        <div style="margin-bottom:20px;font-size:14px">
          <div><strong>To:</strong></div>
          <div style="font-size:15px;font-weight:700">${l.recipient}</div>
        </div>

        <div class="title">${l.title}</div>
        <div class="content">${bodyHTML}</div>

        <div class="sig-block">
          <div>
            <div class="sig-line">${l.issuedBy}</div>
            <div style="font-size:11.5px;color:#64748b">Authorized Signatory</div>
            <div style="font-size:11px;color:#64748b">${settings.companyName || 'HRM Pro Corporation'}</div>
          </div>
          <div class="seal">
            <span style="font-size:9px;font-weight:800;text-transform:uppercase">HR DEPT</span>
            <span style="font-size:8px">OFFICIAL SEAL</span>
          </div>
        </div>

        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  printProfile(empId) {
    window.print();
  },

  showDigitalBadge(empId) {
    const emp = DB.find('employees', empId);
    if (!emp) return;
    const settings = DB.getObj('settings') || { companyName: 'HRM Pro Enterprise' };
    const empCode = emp.code || `EMP-${String(emp.id).padStart(4, '0')}`;
    const bloodGroup = emp.bloodGroup || 'B+';
    const dept = Utils.getDeptName(emp.departmentId);
    const desig = Utils.getDesigName(emp.designationId);
    const branch = Utils.getBranchName(emp.branchId);

    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 25 25" shape-rendering="crispEdges">
      <rect width="25" height="25" fill="#ffffff"/>
      <path d="M2 2h7v7H2zM3 3v5h5V3zm1 1h3v3H4zm7-2h3v1h-1v2h-1v-2h-1zm4 0h7v7h-7zm1 1v5h5V4zm1 1h3v3h-3zm-6 2h1v1h-1zm1 1h2v1h-2zm-8 3h1v1H3zm2 0h1v2H5zm2 0h2v1H7zm5 0h1v1h-1zm3 0h1v2h-1zm3 0h2v1h-2zm-9 1h1v1h-1zm4 0h1v1h-1zm3 0h1v2h-1zm-13 1h1v1H2zm3 0h1v1H5zm6 0h2v2h-1v-1h-1zm5 0h1v1h-1zm-14 1h1v1H2zm4 0h1v1H6zm5 0h1v1h-1zm3 0h1v1h-1zm-14 2h7v7H2zm1 1v5h5v-5zm1 1h3v3H4zm6-2h1v1h-1zm4 0h1v1h-1zm3 0h1v1h-1zm-6 1h2v1h-1v1h-1zm4 0h1v2h-1zm-3 1h1v1h-1zm2 0h1v2h-2v-1zm-4 1h1v1h-1zm-1 1h2v1h-2z" fill="#0f172a"/>
    </svg>`;

    Modal.show('Corporate Employee Digital Smart Badge', `
      <div style="display:flex;justify-content:center;margin-bottom:16px">
        <div id="smart-badge-card" style="width:300px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.18);border:1px solid #cbd5e1;font-family:'Segoe UI',sans-serif;position:relative;text-align:center">
          <div style="width:36px;height:7px;background:#94a3b8;border-radius:10px;margin:10px auto 4px"></div>
          <div style="background:linear-gradient(135deg,#1e1b4b,#4338ca);padding:14px 16px 36px;color:#ffffff;position:relative">
            <div style="font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase">${settings.companyName}</div>
            <div style="font-size:10px;letter-spacing:1.5px;color:#a5b4fc;text-transform:uppercase;margin-top:2px">Verified Employee Credential</div>
          </div>
          <div style="margin-top:-32px;display:flex;justify-content:center;position:relative">
            <div style="width:84px;height:84px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.15);overflow:hidden;background:${Utils.avatarColor(emp.id)}">
              ${emp.photo ? `<img src="${emp.photo}" style="width:100%;height:100%;object-fit:cover" alt="${emp.fullName}">` : `<div style="font-size:28px;line-height:84px;color:#ffffff;font-weight:700">${Utils.avatarInitials(emp.fullName)}</div>`}
            </div>
          </div>
          <div style="padding:10px 20px 20px">
            <div style="font-size:17px;font-weight:800;color:#0f172a;margin-top:2px">${emp.fullName}</div>
            <div style="font-size:12.5px;font-weight:600;color:#4f46e5;margin-top:2px">${desig}</div>
            <div style="font-size:11px;color:#64748b;margin-top:1px">${dept} • ${branch}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;margin:14px 0 12px;font-size:11px">
              <div>
                <span style="color:#94a3b8;font-size:9.5px;text-transform:uppercase;display:block">EMP ID</span>
                <b style="color:#0f172a;font-family:monospace;font-size:12px">${empCode}</b>
              </div>
              <div>
                <span style="color:#94a3b8;font-size:9.5px;text-transform:uppercase;display:block">BLOOD GROUP</span>
                <b style="color:#dc2626;font-size:12px">${bloodGroup}</b>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;margin-top:6px">
              <div style="padding:6px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.05)">
                ${qrSvg}
              </div>
              <div style="font-size:9px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-top:4px">
                Scan for Access Authorization
              </div>
            </div>
          </div>
          <div style="background:#0f172a;color:#94a3b8;font-size:9px;padding:6px;letter-spacing:1px;text-transform:uppercase">
            PROPERTY OF ${settings.companyName.toUpperCase()}
          </div>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-primary" onclick="Employees.printDigitalBadge(${emp.id})"><i class="fa fa-print"></i> Print Standard PVC Badge</button>
      `
    });
  },

  printDigitalBadge(empId) {
    const emp = DB.find('employees', empId);
    if (!emp) return;
    const settings = DB.getObj('settings') || { companyName: 'HRM Pro Enterprise' };
    const empCode = emp.code || `EMP-${String(emp.id).padStart(4, '0')}`;
    const bloodGroup = emp.bloodGroup || 'B+';
    const dept = Utils.getDeptName(emp.departmentId);
    const desig = Utils.getDesigName(emp.designationId);
    const branch = Utils.getBranchName(emp.branchId);

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PVC Employee Badge - ${emp.fullName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; background: #f1f5f9; }
          .card { width: 54mm; height: 86mm; background: #ffffff; border: 1px solid #94a3b8; border-radius: 4mm; overflow: hidden; position: relative; text-align: center; box-sizing: border-box; }
          .lanyard { width: 12mm; height: 2.5mm; background: #cbd5e1; border-radius: 2mm; margin: 2mm auto 1mm; }
          .header { background: #1e1b4b; padding: 3mm 2mm 8mm; color: #ffffff; }
          .photo { width: 22mm; height: 22mm; border-radius: 50%; border: 1.5mm solid #ffffff; margin: -10mm auto 1mm; overflow: hidden; background: #4f46e5; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 14pt; }
          .photo img { width: 100%; height: 100%; object-fit: cover; }
          .name { font-size: 11pt; font-weight: 800; color: #0f172a; margin-top: 1mm; }
          .desig { font-size: 8pt; font-weight: 700; color: #4f46e5; }
          .meta { font-size: 6.5pt; color: #64748b; margin-top: 0.5mm; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm; background: #f8fafc; border: 0.5mm solid #e2e8f0; border-radius: 2mm; margin: 2mm 3mm; padding: 1mm; font-size: 7pt; }
          .footer { position: absolute; bottom: 0; width: 100%; background: #0f172a; color: #ffffff; font-size: 5.5pt; padding: 1.5mm 0; letter-spacing: 0.5px; }
          @media print { body { background: transparent; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="lanyard"></div>
          <div class="header">
            <div style="font-size: 8pt; font-weight: 800; text-transform: uppercase;">${settings.companyName}</div>
            <div style="font-size: 5.5pt; color: #a5b4fc; text-transform: uppercase;">Employee Access Credential</div>
          </div>
          <div class="photo">
            ${emp.photo ? `<img src="${emp.photo}">` : Utils.avatarInitials(emp.fullName)}
          </div>
          <div class="name">${emp.fullName}</div>
          <div class="desig">${desig}</div>
          <div class="meta">${dept} • ${branch}</div>
          <div class="grid">
            <div><span style="font-size:5pt;color:#94a3b8;display:block">EMP ID</span><b>${empCode}</b></div>
            <div><span style="font-size:5pt;color:#94a3b8;display:block">BLOOD GRP</span><b style="color:#dc2626">${bloodGroup}</b></div>
          </div>
          <div style="font-size: 6pt; color: #64748b; margin-top: 1mm">
            CNIC: ${emp.cnic || 'Verified on file'}<br>
            Emergency: ${emp.phone || '+92 300 0000000'}
          </div>
          <div class="footer">OFFICIAL IDENTITY CARD • CR-80 COMPLIANT</div>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    win.document.close();
  },

  // ═════════════════════════════════════════════════════════════════════════
  // DEPENDENTS & LIFE EVENTS PORTAL
  // ═════════════════════════════════════════════════════════════════════════
  depSubTab: 'dependents', // 'dependents' | 'events'
  depSearchQuery: '',
  depRelFilter: '',

  renderDependentsAndLifeEvents(container) {
    if (!container) return;

    const allDeps = DB.get('employee_dependents') || [];
    const allEvents = DB.get('life_events') || [];
    const allEmps = DB.get('employees') || [];

    const totalDeps = allDeps.length;
    const insuredDeps = allDeps.filter(d => d.isMedicalCovered).length;
    const emergencyContacts = allDeps.filter(d => d.isEmergencyContact).length;
    const pendingEvents = allEvents.filter(e => e.status === 'pending').length;

    const canManage = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Metrics Deck -->
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:20px">
          <div class="stat-card" style="border-left:4px solid var(--primary)">
            <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:var(--primary)"><i class="fa fa-people-roof"></i></div>
            <div class="stat-info">
              <div class="stat-value">${totalDeps}</div>
              <div class="stat-label">Registered Dependents</div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Spouses, Children & Parents</div>
            </div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--success)">
            <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--success)"><i class="fa fa-shield-heart"></i></div>
            <div class="stat-info">
              <div class="stat-value">${insuredDeps}</div>
              <div class="stat-label">TPA Medical Covered</div>
              <div style="font-size:11.5px;color:var(--success);margin-top:2px">${Math.round(totalDeps ? insuredDeps/totalDeps*100 : 100)}% Insurance Enrollment</div>
            </div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--info)">
            <div class="stat-icon" style="background:rgba(20,184,166,0.15);color:var(--info)"><i class="fa fa-phone"></i></div>
            <div class="stat-info">
              <div class="stat-value">${emergencyContacts}</div>
              <div class="stat-label">Next-of-Kin Contacts</div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Designated Emergency Contacts</div>
            </div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--warning)">
            <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--warning)"><i class="fa fa-bell"></i></div>
            <div class="stat-info">
              <div class="stat-value">${pendingEvents}</div>
              <div class="stat-label">Pending Life Events</div>
              <div style="font-size:11.5px;color:${pendingEvents>0?'var(--warning)':'var(--success)'};margin-top:2px">${pendingEvents>0 ? 'Awaiting HR Verification' : 'All Verified'}</div>
            </div>
          </div>
        </div>

        <!-- Sub-Navigation & Actions Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;border:1px solid var(--border)">
            <button class="tab-toggle-btn ${this.depSubTab === 'dependents' ? 'active' : ''}" onclick="Employees.depSubTab='dependents';Employees.renderDependentsAndLifeEvents(document.getElementById('emp-content'))">
              <i class="fa fa-users" style="margin-right:6px"></i>Family Dependents & Beneficiaries (${totalDeps})
            </button>
            <button class="tab-toggle-btn ${this.depSubTab === 'events' ? 'active' : ''}" onclick="Employees.depSubTab='events';Employees.renderDependentsAndLifeEvents(document.getElementById('emp-content'))">
              <i class="fa fa-bullhorn" style="margin-right:6px"></i>Life Events Portal
              ${pendingEvents > 0 ? `<span class="badge badge-warning" style="margin-left:6px;font-size:10px;padding:2px 6px">${pendingEvents}</span>` : ''}
            </button>
          </div>

          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="Employees.auditBeneficiaryShares()">
              <i class="fa fa-scale-balanced"></i> Beneficiary Audit
            </button>
            <button class="btn btn-secondary btn-sm" onclick="Employees.showSubmitLifeEventModal()">
              <i class="fa fa-bullhorn"></i> Submit Life Event
            </button>
            ${canManage ? `
              <button class="btn btn-primary btn-sm" onclick="Employees.showAddDependent()">
                <i class="fa fa-plus"></i> Add Dependent
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Tab Body Content -->
        ${this.depSubTab === 'dependents' ? this.renderDependentsViewHTML(allDeps, allEmps, canManage) : this.renderLifeEventsViewHTML(allEvents, allEmps, canManage)}
      </div>
    `;
  },

  renderDependentsViewHTML(allDeps, allEmps, canManage) {
    let filtered = [...allDeps];

    if (this.depRelFilter) {
      filtered = filtered.filter(d => d.relation === this.depRelFilter);
    }

    if (this.depSearchQuery) {
      const q = this.depSearchQuery.toLowerCase();
      filtered = filtered.filter(d => {
        const emp = allEmps.find(e => e.id === d.employeeId);
        return (d.fullName || '').toLowerCase().includes(q) ||
               (d.cnicOrBForm || '').toLowerCase().includes(q) ||
               (emp?.fullName || '').toLowerCase().includes(q);
      });
    }

    return `
      <!-- Filters -->
      <div class="filter-bar" style="margin-bottom:16px">
        <div class="search-box">
          <i class="fa fa-search"></i>
          <input type="text" placeholder="Search by dependent name, CNIC, or employee..." value="${this.depSearchQuery}"
            oninput="Employees.depSearchQuery=this.value;Employees.renderDependentsAndLifeEvents(document.getElementById('emp-content'))">
        </div>
        <select class="filter-select" onchange="Employees.depRelFilter=this.value;Employees.renderDependentsAndLifeEvents(document.getElementById('emp-content'))">
          <option value="">All Relationships</option>
          <option value="Spouse" ${this.depRelFilter==='Spouse'?'selected':''}>Spouses</option>
          <option value="Child" ${this.depRelFilter==='Child'?'selected':''}>Children</option>
          <option value="Parent" ${this.depRelFilter==='Parent'?'selected':''}>Parents</option>
          <option value="Sibling" ${this.depRelFilter==='Sibling'?'selected':''}>Siblings</option>
        </select>
      </div>

      <!-- Table View -->
      <div class="card" style="padding:0;border-radius:12px;overflow:hidden">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Dependent Name</th>
                <th>Relationship</th>
                <th>Employee / Sponsor</th>
                <th>CNIC / B-Form</th>
                <th>Blood Group</th>
                <th>Health Insurance</th>
                <th>Gratuity Share</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-3)"><i class="fa fa-people-roof" style="font-size:24px;display:block;margin-bottom:8px"></i>No dependents matched current filter.</td></tr>
              ` : filtered.map(d => {
                const emp = allEmps.find(e => e.id === d.employeeId) || { fullName: 'Employee', empNo: 'EMP-??' };
                return `
                  <tr>
                    <td>
                      <div style="font-weight:700;color:var(--text)">${d.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">DOB: ${d.dob ? Utils.formatDate(d.dob) : '—'} ${d.gender ? `(${d.gender})` : ''}</div>
                    </td>
                    <td><span class="badge badge-secondary">${d.relation}</span></td>
                    <td>
                      <div style="font-weight:600;color:var(--text)">${emp.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp.empNo} • ${Utils.getDeptName(emp.departmentId)}</div>
                    </td>
                    <td><code style="font-family:monospace;font-size:12px">${d.cnicOrBForm || '—'}</code></td>
                    <td><span style="font-weight:700;color:var(--danger)">${d.bloodGroup || '—'}</span></td>
                    <td>
                      ${d.isMedicalCovered ? `<span class="badge badge-success" style="font-size:11px"><i class="fa fa-shield-heart"></i> TPA Active</span>` : '<span class="badge badge-secondary" style="font-size:11px">No</span>'}
                      ${d.isEmergencyContact ? `<span class="badge badge-info" style="font-size:10.5px;margin-left:4px" title="Emergency Next of Kin"><i class="fa fa-phone"></i></span>` : ''}
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="font-weight:700;font-family:monospace">${d.beneficiaryPercent || 0}%</span>
                        <div style="width:50px;height:6px;background:var(--surface-2);border-radius:3px;overflow:hidden">
                          <div style="width:${d.beneficiaryPercent || 0}%;height:100%;background:var(--primary)"></div>
                        </div>
                      </div>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex;justify-content:flex-end;gap:4px">
                        <button class="btn btn-ghost btn-xs" title="Print Medical Card" onclick="Employees.printDependentHealthCard(${d.id})">
                          <i class="fa fa-id-card"></i> Card
                        </button>
                        ${canManage ? `
                          <button class="btn btn-ghost btn-xs" style="color:var(--danger)" title="Remove" onclick="Employees.deleteDependent(${d.id}, ${d.employeeId})">
                            <i class="fa fa-trash"></i>
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

  renderLifeEventsViewHTML(allEvents, allEmps, canManage) {
    return `
      <div class="card" style="padding:0;border-radius:12px;overflow:hidden">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Employee</th>
                <th>Subject & Description</th>
                <th>Event Date</th>
                <th>Supporting Proof</th>
                <th>Verification Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${allEvents.length === 0 ? `
                <tr><td colspan="7" style="text-align:center;padding:36px;color:var(--text-3)"><i class="fa fa-bullhorn" style="font-size:24px;display:block;margin-bottom:8px"></i>No life events recorded.</td></tr>
              ` : allEvents.map(ev => {
                const emp = allEmps.find(e => e.id === ev.employeeId) || { fullName: 'Employee', empNo: 'EMP-??' };
                const isPending = ev.status === 'pending';
                return `
                  <tr style="${isPending ? 'background:rgba(245,158,11,0.03)' : ''}">
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:32px;height:32px;border-radius:8px;background:var(--primary-glow);color:var(--primary);display:flex;align-items:center;justify-content:center">
                          <i class="fa ${ev.eventType === 'childbirth' ? 'fa-baby' : ev.eventType === 'marriage' ? 'fa-rings-wedding' : ev.eventType === 'qualification' ? 'fa-graduation-cap' : 'fa-house'}"></i>
                        </div>
                        <span style="font-weight:700;text-transform:capitalize;font-size:12px">${ev.eventType.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight:600;color:var(--text)">${emp.fullName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp.empNo} • ${Utils.getDeptName(emp.departmentId)}</div>
                    </td>
                    <td style="max-width:320px">
                      <div style="font-weight:700;font-size:12.5px;color:var(--text)">${ev.title}</div>
                      <div style="font-size:11.5px;color:var(--text-2);margin-top:2px;line-height:1.4">${ev.details}</div>
                      ${ev.hrRemarks ? `<div style="font-size:11px;color:var(--info);margin-top:4px"><i class="fa fa-comment-dots"></i> HR: ${ev.hrRemarks}</div>` : ''}
                    </td>
                    <td style="font-size:12px">${Utils.formatDate(ev.eventDate)}</td>
                    <td>
                      <span class="badge badge-secondary" style="font-size:10.5px">
                        <i class="fa fa-file-pdf" style="color:var(--danger);margin-right:4px"></i>${ev.supportingDocName || 'Certificate.pdf'}
                      </span>
                    </td>
                    <td>${Utils.statusBadge(ev.status)}</td>
                    <td style="text-align:right">
                      <div style="display:flex;justify-content:flex-end;gap:4px">
                        ${isPending && canManage ? `
                          <button class="btn btn-success btn-xs" onclick="Employees.approveLifeEvent(${ev.id})">
                            <i class="fa fa-check"></i> Verify & Approve
                          </button>
                          <button class="btn btn-danger btn-xs" onclick="Employees.rejectLifeEvent(${ev.id})">
                            <i class="fa fa-times"></i> Reject
                          </button>
                        ` : `
                          <span style="font-size:11.5px;color:var(--text-3)">${ev.reviewedOn ? 'Reviewed ' + Utils.formatDate(ev.reviewedOn) : '—'}</span>
                        `}
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

  // ═══════════════════════════════════════════════
  // ENTERPRISE DOCUMENT MANAGEMENT SYSTEM (e-DMS)
  // ═══════════════════════════════════════════════

  docVaultCategory: 'all',
  docVaultSearch: '',
  docVaultStatus: 'all',

  renderDocumentVault(container) {
    const allDocs = DB.get('employee_documents') || [];
    let docs = allDocs;

    // Scope check
    if (Auth.role === 'employee') {
      docs = docs.filter(d => d.employeeId === (Auth.employee?.id || 1));
    } else if (Auth.role === 'dept_manager') {
      const myId = Auth.employee?.id;
      const scopedEmps = DB.get('employees').filter(e => e.managerId === myId || e.reportingTo === myId).map(e => e.id);
      scopedEmps.push(myId);
      docs = docs.filter(d => scopedEmps.includes(d.employeeId));
    }

    if (this.docVaultCategory !== 'all') {
      docs = docs.filter(d => d.category === this.docVaultCategory);
    }
    if (this.docVaultStatus !== 'all') {
      docs = docs.filter(d => d.verificationStatus === this.docVaultStatus);
    }
    if (this.docVaultSearch) {
      const q = this.docVaultSearch.toLowerCase();
      docs = docs.filter(d => {
        const empName = (Utils.getEmpName(d.employeeId) || '').toLowerCase();
        return (d.title || '').toLowerCase().includes(q) ||
               (d.fileName || '').toLowerCase().includes(q) ||
               (d.notes || '').toLowerCase().includes(q) ||
               empName.includes(q);
      });
    }

    const verifiedCount = docs.filter(d => d.verificationStatus === 'verified').length;
    const pendingCount = docs.filter(d => d.verificationStatus === 'pending').length;
    const categories = [
      'All Categories',
      'Contracts & Agreements',
      'Identity & Legal',
      'Academic & Professional',
      'Tax & Statutory',
      'Medical & Insurance'
    ];

    const canManage = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:16px;font-weight:700">Enterprise Employee Document Vault (e-DMS)</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:3px">Centralized legal contracts, attested academic credentials, tax forms, and corporate compliance archives</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${canManage && pendingCount > 0 ? `
              <button class="btn btn-secondary btn-sm" onclick="Employees.batchVerifyDocuments()">
                <i class="fa fa-shield-check"></i> Batch Verify Pending (${pendingCount})
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="Employees.showUploadDocModal()">
              <i class="fa fa-cloud-arrow-up"></i> Upload Document
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--primary)">${docs.length}</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Archived Documents</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--success)">${verifiedCount}</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Verified & Audited</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--warning)">${pendingCount}</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Pending HR Review</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--info)">18.4 MB</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Encrypted Vault Storage</div>
          </div>
        </div>

        <!-- Category Tabs -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px">
          ${categories.map(cat => {
            const catKey = cat === 'All Categories' ? 'all' : cat;
            const isActive = this.docVaultCategory === catKey;
            return `
              <button class="btn btn-xs ${isActive ? 'btn-primary' : 'btn-ghost'}" onclick="Employees.docVaultCategory='${catKey}';Employees.renderTable()">
                ${cat}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Filters Toolbar -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:240px">
            <input type="text" class="form-control" style="font-size:12px" placeholder="Search by document title, filename, or employee..."
              value="${this.docVaultSearch}" oninput="Employees.docVaultSearch=this.value;Employees.renderTable()">
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <select class="form-control" style="width:160px;font-size:12px" onchange="Employees.docVaultStatus=this.value;Employees.renderTable()">
              <option value="all" ${this.docVaultStatus==='all'?'selected':''}>All Statuses</option>
              <option value="verified" ${this.docVaultStatus==='verified'?'selected':''}>Verified Only</option>
              <option value="pending" ${this.docVaultStatus==='pending'?'selected':''}>Pending Review</option>
              <option value="rejected" ${this.docVaultStatus==='rejected'?'selected':''}>Rejected</option>
            </select>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Document Name & File</th>
                <th>Personnel</th>
                <th>Category</th>
                <th>Upload Date</th>
                <th>Expiry Date</th>
                <th>Audit Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${docs.length === 0 ? `
                <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-3)">No documents match the filter criteria.</td></tr>
              ` : docs.map(d => {
                const emp = DB.find('employees', d.employeeId);
                const isPDF = (d.fileName || '').endsWith('.pdf');
                const isImg = (d.fileName || '').endsWith('.jpg') || (d.fileName || '').endsWith('.png');
                const fileIcon = isPDF ? 'fa-file-pdf text-danger' : isImg ? 'fa-file-image text-success' : 'fa-file-lines text-info';
                const statusBadge = d.verificationStatus === 'verified' ? '<span class="badge badge-success"><i class="fa fa-circle-check"></i> Verified</span>' :
                                    d.verificationStatus === 'rejected' ? '<span class="badge badge-danger"><i class="fa fa-times"></i> Rejected</span>' :
                                    '<span class="badge badge-warning"><i class="fa fa-clock"></i> Pending Review</span>';

                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div style="font-size:20px"><i class="fa ${fileIcon}"></i></div>
                        <div>
                          <div style="font-weight:700;font-size:12.5px;color:var(--text)">${d.title}</div>
                          <div style="font-size:10.5px;color:var(--text-3);font-family:monospace">${d.fileName} (${d.fileSize || '1.2 MB'})</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight:600;font-size:12px">${emp?.fullName || 'Employee'}</div>
                      <div style="font-size:10.5px;color:var(--text-3)">${emp?.empNo || ''}</div>
                    </td>
                    <td><span class="badge" style="background:var(--surface-2);font-size:10.5px">${d.category}</span></td>
                    <td style="font-size:11.5px;color:var(--text-2)">${Utils.formatDate(d.uploadedAt)}</td>
                    <td style="font-size:11.5px;color:var(--text-2)">${d.expiryDate ? Utils.formatDate(d.expiryDate) : '<span style="color:var(--text-3)">Permanent</span>'}</td>
                    <td>
                      ${statusBadge}
                      ${d.verifiedBy ? `<div style="font-size:10px;color:var(--text-3);margin-top:2px">Audited by ${Utils.getEmpName(d.verifiedBy)}</div>` : ''}
                    </td>
                    <td style="text-align:right;white-space:nowrap">
                      <button class="btn btn-ghost btn-xs" onclick="Employees.previewDocument(${d.id})" title="Preview Document">
                        <i class="fa fa-eye"></i> Preview
                      </button>
                      ${canManage && d.verificationStatus === 'pending' ? `
                        <button class="btn btn-success btn-xs" onclick="Employees.verifyDocument(${d.id})" title="Approve Document">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-danger btn-xs" onclick="Employees.rejectDocument(${d.id})" title="Reject Document">
                          <i class="fa fa-times"></i>
                        </button>
                      ` : ''}
                      <button class="btn btn-ghost btn-xs" onclick="Employees.deleteDocument(${d.id})" title="Delete" style="color:var(--danger)">
                        <i class="fa fa-trash"></i>
                      </button>
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

  showUploadDocModal() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    const categories = [
      'Contracts & Agreements',
      'Identity & Legal',
      'Academic & Professional',
      'Tax & Statutory',
      'Medical & Insurance'
    ];

    Modal.show('Upload Employee Document to e-DMS', `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Employee</label>
          <select class="form-control" id="up-emp">
            ${emps.map(e => `<option value="${e.id}" ${e.id === (Auth.employee?.id || 1) ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Document Category</label>
          <select class="form-control" id="up-cat">
            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Document Title / Formal Description</label>
        <input class="form-control" id="up-title" placeholder="e.g. Master of Business Administration (MBA) Degree">
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Simulated File Name</label>
          <input class="form-control" id="up-filename" placeholder="e.g. Employee_Degree_Attested.pdf" value="Employee_Document_${Date.now().toString().slice(-4)}.pdf">
        </div>
        <div class="form-group">
          <label class="form-label">Document Expiry Date (if applicable)</label>
          <input class="form-control" id="up-expiry" type="date">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Verification State</label>
        <select class="form-control" id="up-status">
          <option value="verified" ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? 'selected' : ''}>Verified by HR (Direct Upload)</option>
          <option value="pending" ${Auth.role === 'employee' ? 'selected' : ''}>Pending Verification</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Archival Notes</label>
        <textarea class="form-control" id="up-notes" rows="2" placeholder="Storage location, issuing authority, registration ID..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.saveUploadedDocument()"><i class="fa fa-upload"></i> Upload & Archive</button>
      `
    });
  },

  saveUploadedDocument() {
    const empId = parseInt(document.getElementById('up-emp').value);
    const category = document.getElementById('up-cat').value;
    const title = document.getElementById('up-title').value.trim();
    const fileName = document.getElementById('up-filename').value.trim() || 'Document.pdf';
    const expiryDate = document.getElementById('up-expiry').value;
    const status = document.getElementById('up-status').value;
    const notes = document.getElementById('up-notes').value.trim();

    if (!title) {
      Toast.show('Document title is required', 'error');
      return;
    }

    const docs = DB.get('employee_documents') || [];
    const newDoc = {
      id: DB.nextId('employee_documents'),
      employeeId: empId,
      title,
      category,
      fileName,
      fileSize: '1.2 MB',
      fileType: fileName.endsWith('.jpg') || fileName.endsWith('.png') ? 'Image' : 'PDF',
      uploadedAt: new Date().toISOString().split('T')[0],
      expiryDate,
      verificationStatus: status,
      verifiedBy: status === 'verified' ? (Auth.user?.id || 1) : null,
      verifiedAt: status === 'verified' ? new Date().toISOString().split('T')[0] : null,
      notes
    };

    docs.push(newDoc);
    DB.set('employee_documents', docs);
    DB.log('UPLOAD', 'Employees', `Uploaded document "${title}" for ${Utils.getEmpName(empId)}`, Auth.user?.id, 'INFO');
    Toast.show('Document uploaded and archived successfully!', 'success');
    Modal.close('dynamic-modal');
    this.renderTable();
  },

  verifyDocument(id) {
    const docs = DB.get('employee_documents') || [];
    const idx = docs.findIndex(d => d.id === id);
    if (idx === -1) return;

    docs[idx].verificationStatus = 'verified';
    docs[idx].verifiedBy = Auth.user?.id || 1;
    docs[idx].verifiedAt = new Date().toISOString().split('T')[0];
    DB.set('employee_documents', docs);
    DB.log('VERIFY', 'Employees', `Verified compliance document "${docs[idx].title}"`, Auth.user?.id, 'INFO');
    Toast.show('Document verified and audit stamped!', 'success');
    this.renderTable();
  },

  rejectDocument(id) {
    const docs = DB.get('employee_documents') || [];
    const idx = docs.findIndex(d => d.id === id);
    if (idx === -1) return;

    Modal.confirm('Reject Document', 'Reject this document and notify employee to re-upload?', () => {
      docs[idx].verificationStatus = 'rejected';
      DB.set('employee_documents', docs);
      DB.log('REJECT', 'Employees', `Rejected document "${docs[idx].title}"`, Auth.user?.id, 'WARNING');
      Toast.show('Document marked as rejected', 'info');
      this.renderTable();
    }, 'danger');
  },

  batchVerifyDocuments() {
    const docs = DB.get('employee_documents') || [];
    let count = 0;
    const today = new Date().toISOString().split('T')[0];
    docs.forEach(d => {
      if (d.verificationStatus === 'pending') {
        d.verificationStatus = 'verified';
        d.verifiedBy = Auth.user?.id || 1;
        d.verifiedAt = today;
        count++;
      }
    });
    DB.set('employee_documents', docs);
    DB.log('VERIFY', 'Employees', `Batch verified ${count} pending employee documents`, Auth.user?.id, 'INFO');
    Toast.show(`Verified ${count} documents!`, 'success');
    this.renderTable();
  },

  deleteDocument(id) {
    const docs = DB.get('employee_documents') || [];
    const d = docs.find(x => x.id === id);
    if (!d) return;

    Modal.confirm('Delete Document', `Are you sure you want to permanently delete <strong>${d.title}</strong>?`, () => {
      const filtered = docs.filter(x => x.id !== id);
      DB.set('employee_documents', filtered);
      DB.log('DELETE', 'Employees', `Deleted archived document "${d.title}"`, Auth.user?.id, 'WARNING');
      Toast.show('Document deleted', 'success');
      this.renderTable();
    }, 'danger');
  },

  previewDocument(id) {
    const d = (DB.get('employee_documents') || []).find(x => x.id === id);
    if (!d) return;
    const emp = DB.find('employees', d.employeeId);

    Modal.show(`Document Inspection: ${d.title}`, `
      <div style="background:var(--surface-2);border-radius:10px;padding:14px;margin-bottom:14px;font-size:12px;line-height:1.6">
        <div style="display:flex;justify-content:space-between">
          <div><strong>Associated Personnel:</strong> ${emp?.fullName} (${emp?.empNo})</div>
          <div><span class="badge badge-primary">${d.category}</span></div>
        </div>
        <div><strong>Original File:</strong> <code>${d.fileName}</code> (${d.fileSize || '1.2 MB'})</div>
        <div><strong>Uploaded Date:</strong> ${Utils.formatDate(d.uploadedAt)}</div>
        <div><strong>Expiry / Renewal:</strong> ${d.expiryDate ? Utils.formatDate(d.expiryDate) : 'Permanent Document'}</div>
        <div><strong>Audit Status:</strong> <span class="badge ${d.verificationStatus==='verified'?'badge-success':'badge-warning'}">${d.verificationStatus.toUpperCase()}</span></div>
      </div>

      <div style="background:#ffffff;color:#1e293b;border-radius:10px;padding:24px;border:1px solid #cbd5e1;box-shadow:0 4px 12px rgba(0,0,0,0.06);font-family:'Segoe UI',sans-serif;text-align:center">
        <div style="font-size:40px;color:#dc2626;margin-bottom:10px"><i class="fa fa-file-pdf"></i></div>
        <div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:4px">${d.title}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:16px">${d.fileName} • Official Corporate Archive Copy</div>

        <div style="display:inline-block;background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:16px 24px;margin-bottom:16px;text-align:left;font-size:11.5px;color:#334155;line-height:1.5">
          <div><strong>Integrity Checksum:</strong> <code>SHA256-${((d.id * 837) & 0xfffffff).toString(16).toUpperCase()}</code></div>
          <div><strong>Digital Storage Path:</strong> <code>/hrm-vault/secured-docs/${emp?.empNo}/${d.fileName}</code></div>
          <div><strong>Audited By:</strong> ${d.verifiedBy ? Utils.getEmpName(d.verifiedBy) : 'Pending HR Verification'}</div>
          <div><strong>Archival Notes:</strong> ${d.notes || 'Official personnel record certified genuine.'}</div>
        </div>

        <div>
          <button class="btn btn-primary btn-sm" onclick="Toast.show('Initiating encrypted mock PDF download...', 'info')">
            <i class="fa fa-download"></i> Download Verified Document
          </button>
        </div>
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close Preview</button>`
    });
  },

  // ============================================================
  // PHASE 1: DISCIPLINE & LEGAL COMPLIANCE MODULE
  // ============================================================
  disciplinarySubTab: 'inquiries',

  renderDiscipline(container) {
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';
    const myEmpId = Auth.employee?.id;
    const allEmps = DB.get('employees') || [];
    const types = DB.get('disciplinary_types') || [];
    const actions = DB.get('disciplinary_actions') || [];
    const warningLetters = DB.get('warning_letters') || [];
    const suspensions = DB.get('suspensions') || [];
    const terminations = DB.get('terminations') || [];

    // Helper for warning severity badge
    const warningBadge = (level) => {
      switch(level) {
        case 'verbal': return '<span class="badge badge-info"><i class="fa fa-comment-dots"></i> Verbal Warning</span>';
        case 'first_written': return '<span class="badge badge-warning" style="background:#f59e0b;color:#fff"><i class="fa fa-file-pen"></i> First Written Warning</span>';
        case 'second_written': return '<span class="badge badge-warning" style="background:#ea580c;color:#fff"><i class="fa fa-triangle-exclamation"></i> Second Written Warning</span>';
        case 'final_written': return '<span class="badge badge-danger"><i class="fa fa-circle-exclamation"></i> Final Written Warning</span>';
        case 'show_cause': return '<span class="badge badge-primary"><i class="fa fa-scale-balanced"></i> Show Cause Notice</span>';
        default: return `<span class="badge badge-secondary">${level}</span>`;
      }
    };

    const statusBadge = (status) => {
      switch(status) {
        case 'under_investigation': return '<span class="badge badge-warning" style="background:#f59e0b;color:#fff"><i class="fa fa-magnifying-glass"></i> Under Investigation</span>';
        case 'hearing_scheduled': return '<span class="badge badge-info"><i class="fa fa-calendar-check"></i> Hearing Scheduled</span>';
        case 'action_taken': return '<span class="badge badge-danger"><i class="fa fa-gavel"></i> Sanction Issued</span>';
        case 'closed': return '<span class="badge badge-success"><i class="fa fa-circle-check"></i> Inquiry Closed</span>';
        default: return `<span class="badge badge-secondary">${status}</span>`;
      }
    };

    if (isStaff) {
      // ──────────────────────────────────────────────────────────
      // EMPLOYEE PORTAL: Strictly Scoped Personal Notices & Legal Acknowledgment
      // ──────────────────────────────────────────────────────────
      const myLetters = warningLetters.filter(w => w.employeeId === myEmpId);
      const myInquiries = actions.filter(a => a.employeeId === myEmpId);
      const pendingAck = myLetters.filter(w => !w.acknowledged).length;

      container.innerHTML = `
        <div class="animate-fade-in">
          <!-- Compliance Header Banner -->
          <div class="card mb-20" style="background:linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(99,102,241,0.04) 100%);border-left:4px solid var(--danger)">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div>
                <h3 style="font-size:17px;font-weight:700;margin:0 0 4px 0;display:flex;align-items:center;gap:8px">
                  <i class="fa fa-gavel" style="color:var(--danger)"></i> Legal & Disciplinary Compliance Portal
                </h3>
                <div style="font-size:12.5px;color:var(--text-3)">
                  Formal corporate disciplinary notices, inquiry hearings, and corrective remediation directives. Review official documents and formally sign receipt acknowledgment.
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                ${pendingAck > 0 ? `
                  <span class="badge badge-warning" style="font-size:12px;padding:5px 12px;background:#f59e0b;color:#fff">
                    <i class="fa fa-bell"></i> ${pendingAck} Pending Acknowledgment${pendingAck>1?'s':''}
                  </span>
                ` : `
                  <span class="badge badge-success" style="font-size:12px;padding:5px 12px">
                    <i class="fa fa-circle-check"></i> Fully Compliant & Acknowledged
                  </span>
                `}
                <span class="chip" style="font-size:11px"><i class="fa fa-shield-halved"></i> Corporate Legal Records</span>
              </div>
            </div>
          </div>

          <!-- Warning Letters Table for Employee -->
          <div class="card mb-20" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <h4 style="font-size:14.5px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px">
                <i class="fa fa-triangle-exclamation" style="color:var(--warning)"></i> Official Warning Letters & Corrective Directives (${myLetters.length})
              </h4>
              <span style="font-size:12px;color:var(--text-3)">Confidential official correspondence issued to you</span>
            </div>
            <div class="table-wrapper" style="border:none;border-radius:0">
              <table>
                <thead><tr>
                  <th>Notice Ref #</th>
                  <th>Warning Classification</th>
                  <th>Subject & Details</th>
                  <th>Issue Date</th>
                  <th>Remediation Period</th>
                  <th>Acknowledgment Status</th>
                  <th style="text-align:right">Actions</th>
                </tr></thead>
                <tbody>
                  ${myLetters.length === 0 ? `
                    <tr><td colspan="7"><div class="empty-state" style="padding:40px"><i class="fa fa-circle-check" style="color:var(--success);font-size:36px;margin-bottom:10px;display:block"></i><h3>No Disciplinary Notices</h3><p style="color:var(--text-3);font-size:13px">Your personnel record is clean with zero active disciplinary actions or warnings.</p></div></td></tr>
                  ` : myLetters.map(w => `
                    <tr style="${!w.acknowledged ? 'background:rgba(245,158,11,0.03)' : ''}">
                      <td><code style="font-family:monospace;font-weight:700;color:var(--primary)">${w.warningLetterNo}</code></td>
                      <td>${warningBadge(w.warningLevel)}</td>
                      <td>
                        <div style="font-weight:600;font-size:13px;color:var(--text)">${w.title}</div>
                        <div style="font-size:11.5px;color:var(--text-3);margin-top:2px;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${w.remediationPlan || 'Adherence to corporate standard operating procedures.'}</div>
                      </td>
                      <td style="font-size:12px">${Utils.formatDate(w.issueDate)}</td>
                      <td style="font-size:12px">
                        <span class="chip" style="font-size:10.5px">${w.remediationDays ? `${w.remediationDays} Days` : 'Immediate'}</span>
                      </td>
                      <td>
                        ${w.acknowledged ? `
                          <span class="badge badge-success" style="font-size:11px;padding:3px 8px">
                            <i class="fa fa-circle-check"></i> Acknowledged on ${Utils.formatDate(w.acknowledgedAt)}
                          </span>
                        ` : `
                          <span class="badge badge-warning" style="font-size:11px;padding:3px 8px;background:#f59e0b;color:#fff;animation:pulse 2s infinite">
                            <i class="fa fa-clock"></i> Action Required: Sign Receipt
                          </span>
                        `}
                      </td>
                      <td style="text-align:right">
                        <div style="display:flex;justify-content:flex-end;gap:6px">
                          <button class="btn btn-ghost btn-xs" onclick="Employees.previewWarningLetterModal(${w.id})">
                            <i class="fa fa-eye"></i> View Notice
                          </button>
                          ${!w.acknowledged ? `
                            <button class="btn btn-success btn-xs" onclick="Employees.acknowledgeWarningLetter(${w.id})" title="Sign and acknowledge receipt of this official notice">
                              <i class="fa fa-signature"></i> Sign Receipt
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Formal Disciplinary Inquiries Section for Employee -->
          ${myInquiries.length > 0 ? `
            <div class="card" style="padding:0">
              <div style="padding:14px 18px;border-bottom:1px solid var(--border)">
                <h4 style="font-size:14px;font-weight:700;margin:0">Active or Resolved Inquiry Cases (${myInquiries.length})</h4>
              </div>
              <div class="table-wrapper" style="border:none;border-radius:0">
                <table>
                  <thead><tr>
                    <th>Case #</th>
                    <th>Allegation Category</th>
                    <th>Summary</th>
                    <th>Incident Date</th>
                    <th>Hearing Date</th>
                    <th>Investigation Status</th>
                  </tr></thead>
                  <tbody>
                    ${myInquiries.map(a => {
                      const typeObj = types.find(t => t.id === a.typeId);
                      return `
                        <tr>
                          <td><code style="font-weight:700;color:var(--danger)">${a.caseNo}</code></td>
                          <td><span class="chip">${typeObj?.name || 'General Inquiry'}</span></td>
                          <td>
                            <div style="font-weight:600;font-size:13px">${a.title}</div>
                            <div style="font-size:11.5px;color:var(--text-3);max-width:350px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.description}</div>
                          </td>
                          <td style="font-size:12px">${Utils.formatDate(a.incidentDate)}</td>
                          <td style="font-size:12px">${a.hearingDate ? Utils.formatDate(a.hearingDate) : 'Not Scheduled'}</td>
                          <td>${statusBadge(a.status)}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}
        </div>
      `;
      return;
    }

    // ──────────────────────────────────────────────────────────
    // HR MANAGEMENT & SUPERADMIN: Corporate Disciplinary Dashboard & Case Registry
    // ──────────────────────────────────────────────────────────
    const activeInquiries = actions.filter(a => a.status === 'under_investigation' || a.status === 'hearing_scheduled').length;
    const totalWarnings = warningLetters.length;
    const pendingAckCount = warningLetters.filter(w => !w.acknowledged).length;
    const totalSanctions = suspensions.length + terminations.length;

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Statistics Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:20px">
          <div class="card" style="padding:16px 20px;border-left:4px solid #f59e0b">
            <div style="font-size:12px;color:var(--text-3);font-weight:600;text-transform:uppercase">Active Inquiries</div>
            <div style="font-size:26px;font-weight:800;color:#f59e0b;margin-top:4px">${activeInquiries}</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Under investigation / hearing</div>
          </div>
          <div class="card" style="padding:16px 20px;border-left:4px solid var(--primary)">
            <div style="font-size:12px;color:var(--text-3);font-weight:600;text-transform:uppercase">Warnings Issued</div>
            <div style="font-size:26px;font-weight:800;color:var(--primary);margin-top:4px">${totalWarnings}</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Formal written directives</div>
          </div>
          <div class="card" style="padding:16px 20px;border-left:4px solid ${pendingAckCount>0?'#ea580c':'#16a34a'}">
            <div style="font-size:12px;color:var(--text-3);font-weight:600;text-transform:uppercase">Pending Signatures</div>
            <div style="font-size:26px;font-weight:800;color:${pendingAckCount>0?'#ea580c':'#16a34a'};margin-top:4px">${pendingAckCount}</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Employee acknowledgments</div>
          </div>
          <div class="card" style="padding:16px 20px;border-left:4px solid var(--danger)">
            <div style="font-size:12px;color:var(--text-3);font-weight:600;text-transform:uppercase">Severe Escalations</div>
            <div style="font-size:26px;font-weight:800;color:var(--danger);margin-top:4px">${totalSanctions}</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Suspensions & Terminations</div>
          </div>
        </div>

        <!-- Management Header & Actions Bar -->
        <div class="card mb-20" style="padding:16px 20px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <h3 style="font-size:17.5px;font-weight:700;margin:0 0 4px 0;display:flex;align-items:center;gap:8px">
                <i class="fa fa-scale-balanced" style="color:var(--primary)"></i> Corporate Legal & Disciplinary Management
              </h3>
              <div style="font-size:12.5px;color:var(--text-3)">
                Manage formal inquiries, schedule hearings, issue corporate warning notices, and audit compliance trails.
              </div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" onclick="Employees.showIssueWarningLetterModal()">
                <i class="fa fa-file-pen"></i> Issue Warning Letter
              </button>
              <button class="btn btn-primary btn-sm" onclick="Employees.showAddDisciplinaryActionModal()">
                <i class="fa fa-plus"></i> Log Disciplinary Inquiry
              </button>
            </div>
          </div>

          <!-- Internal Sub-navigation Tabs -->
          <div style="display:flex;gap:8px;margin-top:16px;border-top:1px solid var(--border);padding-top:14px">
            <button class="btn btn-xs ${this.disciplinarySubTab==='inquiries'?'btn-primary':'btn-ghost'}" onclick="Employees.disciplinarySubTab='inquiries';Employees.renderDiscipline(document.getElementById('emp-content'))">
              <i class="fa fa-magnifying-glass"></i> Inquiry Cases (${actions.length})
            </button>
            <button class="btn btn-xs ${this.disciplinarySubTab==='warnings'?'btn-primary':'btn-ghost'}" onclick="Employees.disciplinarySubTab='warnings';Employees.renderDiscipline(document.getElementById('emp-content'))">
              <i class="fa fa-triangle-exclamation"></i> Warning Letters Registry (${warningLetters.length})
            </button>
            <button class="btn btn-xs ${this.disciplinarySubTab==='types'?'btn-primary':'btn-ghost'}" onclick="Employees.disciplinarySubTab='types';Employees.renderDiscipline(document.getElementById('emp-content'))">
              <i class="fa fa-book-bookmark"></i> Violation Policies (${types.length})
            </button>
          </div>
        </div>

        <!-- Section 1: Inquiries Table -->
        ${this.disciplinarySubTab === 'inquiries' ? `
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <h4 style="font-size:14px;font-weight:700;margin:0">Active & Historical Disciplinary Cases</h4>
              <span style="font-size:12px;color:var(--text-3)">Standard inquiry hearings and evidence repository</span>
            </div>
            <div class="table-wrapper" style="border:none;border-radius:0">
              <table>
                <thead><tr>
                  <th>Case Ref #</th>
                  <th>Employee</th>
                  <th>Violation Type</th>
                  <th>Allegation Title</th>
                  <th>Incident Date</th>
                  <th>Hearing Date</th>
                  <th>Investigator</th>
                  <th>Status</th>
                  <th style="text-align:right">Actions</th>
                </tr></thead>
                <tbody>
                  ${actions.length === 0 ? `
                    <tr><td colspan="9"><div class="empty-state" style="padding:30px"><h3>No Disciplinary Cases Logged</h3><p>Click "Log Disciplinary Inquiry" to create a new formal investigation.</p></div></td></tr>
                  ` : actions.map(a => {
                    const emp = allEmps.find(e => e.id === a.employeeId) || {};
                    const typeObj = types.find(t => t.id === a.typeId);
                    return `
                      <tr>
                        <td><code style="font-family:monospace;font-weight:700;color:var(--danger)">${a.caseNo}</code></td>
                        <td>
                          <div style="font-weight:700;font-size:13px;color:var(--primary);cursor:pointer" onclick="Employees.renderProfile(${emp.id})">${emp.fullName || 'Unknown'}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp.empNo || ''} • ${Utils.getDeptName(emp.departmentId)}</div>
                        </td>
                        <td><span class="chip" style="font-size:11px">${typeObj?.name || 'General'}</span></td>
                        <td>
                          <div style="font-weight:600;font-size:13px">${a.title}</div>
                          <div style="font-size:11px;color:var(--text-3);max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.description}</div>
                        </td>
                        <td style="font-size:12px">${Utils.formatDate(a.incidentDate)}</td>
                        <td style="font-size:12px">${a.hearingDate ? Utils.formatDate(a.hearingDate) : 'TBD'}</td>
                        <td style="font-size:12px">${a.investigatorName || 'HR Directorate'}</td>
                        <td>${statusBadge(a.status)}</td>
                        <td style="text-align:right">
                          <div style="display:flex;justify-content:flex-end;gap:6px">
                            <button class="btn btn-secondary btn-xs" onclick="Employees.showIssueWarningLetterModal(${a.id})" title="Issue warning notice linked to this case">
                              <i class="fa fa-gavel"></i> Sanction
                            </button>
                            ${a.status !== 'closed' ? `
                              <button class="btn btn-ghost btn-xs" onclick="Employees.closeDisciplinaryAction(${a.id})" title="Mark inquiry case resolved and closed">
                                <i class="fa fa-check"></i> Close
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
        ` : ''}

        <!-- Section 2: Warning Letters Registry Table -->
        ${this.disciplinarySubTab === 'warnings' ? `
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <h4 style="font-size:14px;font-weight:700;margin:0">Official Warning Letters & Directives Registry</h4>
              <span style="font-size:12px;color:var(--text-3)">Audited corporate notices with digital receipt signatures</span>
            </div>
            <div class="table-wrapper" style="border:none;border-radius:0">
              <table>
                <thead><tr>
                  <th>Warning Ref #</th>
                  <th>Employee</th>
                  <th>Notice Level</th>
                  <th>Subject & Allegation</th>
                  <th>Issue Date</th>
                  <th>Remediation</th>
                  <th>Issued By</th>
                  <th>Acknowledgment</th>
                  <th style="text-align:right">Actions</th>
                </tr></thead>
                <tbody>
                  ${warningLetters.length === 0 ? `
                    <tr><td colspan="9"><div class="empty-state" style="padding:30px"><h3>No Warning Letters Issued</h3><p>Click "Issue Warning Letter" to generate a formal corporate notice.</p></div></td></tr>
                  ` : warningLetters.map(w => {
                    const emp = allEmps.find(e => e.id === w.employeeId) || {};
                    return `
                      <tr>
                        <td><code style="font-family:monospace;font-weight:700;color:var(--primary)">${w.warningLetterNo}</code></td>
                        <td>
                          <div style="font-weight:700;font-size:13px;color:var(--text)">${emp.fullName || 'Unknown'}</div>
                          <div style="font-size:11px;color:var(--text-3)">${emp.empNo || ''}</div>
                        </td>
                        <td>${warningBadge(w.warningLevel)}</td>
                        <td>
                          <div style="font-weight:600;font-size:13px">${w.title}</div>
                        </td>
                        <td style="font-size:12px">${Utils.formatDate(w.issueDate)}</td>
                        <td style="font-size:12px">
                          <span class="chip" style="font-size:11px">${w.remediationDays ? `${w.remediationDays} Days` : '30 Days'}</span>
                        </td>
                        <td style="font-size:12px">${w.authorizedBy || 'HR Management'}</td>
                        <td>
                          ${w.acknowledged ? `
                            <span class="badge badge-success" style="font-size:11px;padding:3px 8px">
                              <i class="fa fa-circle-check"></i> Signed (${Utils.formatDate(w.acknowledgedAt)})
                            </span>
                          ` : `
                            <span class="badge badge-warning" style="font-size:11px;padding:3px 8px;background:#f59e0b;color:#fff">
                              <i class="fa fa-clock"></i> Pending Signature
                            </span>
                          `}
                        </td>
                        <td style="text-align:right">
                          <button class="btn btn-ghost btn-xs" onclick="Employees.previewWarningLetterModal(${w.id})">
                            <i class="fa fa-print"></i> View & Print
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

        <!-- Section 3: Disciplinary Types Catalog -->
        ${this.disciplinarySubTab === 'types' ? `
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border)">
              <h4 style="font-size:14px;font-weight:700;margin:0">Standard Disciplinary Violation Types & Policy Matrix</h4>
            </div>
            <div class="table-wrapper" style="border:none;border-radius:0">
              <table>
                <thead><tr>
                  <th>Code</th>
                  <th>Policy Name</th>
                  <th>Default Severity</th>
                  <th>Description & Policy Guidelines</th>
                  <th>Standard Protocol</th>
                </tr></thead>
                <tbody>
                  ${types.map(t => `
                    <tr>
                      <td><code style="font-weight:700;font-size:12px">${t.code}</code></td>
                      <td style="font-weight:600;font-size:13px">${t.name}</td>
                      <td>
                        <span class="badge ${t.severity==='severe'?'badge-danger':(t.severity==='major'?'badge-warning':'badge-info')}">
                          ${t.severity.toUpperCase()}
                        </span>
                      </td>
                      <td style="font-size:12.5px;color:var(--text-2);max-width:380px">${t.description}</td>
                      <td style="font-size:12px;color:var(--text-3)">Formal investigation + Written notice</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Modal: Create Disciplinary Action Inquiry
  showAddDisciplinaryActionModal() {
    const emps = DB.get('employees') || [];
    const types = DB.get('disciplinary_types') || [];

    Modal.show('Log Formal Disciplinary Inquiry', `
      <form onsubmit="Employees.createDisciplinaryAction(event)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Subject Employee</label>
            <select class="form-control" id="da-emp" required>
              ${emps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo}) - ${Utils.getDeptName(e.departmentId)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Violation Category</label>
            <select class="form-control" id="da-type" required>
              ${types.map(t => `<option value="${t.id}">${t.name} (${t.code})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Incident Date</label>
            <input type="date" class="form-control" id="da-date" value="${Utils.today()}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Hearing Date (Optional)</label>
            <input type="date" class="form-control" id="da-hearing" value="${Utils.today()}">
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label required">Allegation / Case Title</label>
          <input type="text" class="form-control" id="da-title" placeholder="e.g. Unexcused absence from duty without prior line management notice" required>
        </div>

        <div class="form-group mb-14">
          <label class="form-label required">Detailed Incident Description & Factual Circumstances</label>
          <textarea class="form-control" id="da-desc" rows="3" placeholder="Provide factual particulars of the incident, witness accounts, and impacts on business operations..." required></textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label">Reported By</label>
            <input type="text" class="form-control" id="da-reported-by" value="Department Manager">
          </div>
          <div class="form-group">
            <label class="form-label">Assigned Hearing Officer / Investigator</label>
            <input type="text" class="form-control" id="da-investigator" value="HR Operations Directorate">
          </div>
        </div>

        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--border)">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-check"></i> Register Formal Case</button>
        </div>
      </form>
    `);
  },

  createDisciplinaryAction(e) {
    e.preventDefault();
    const empId = parseInt(document.getElementById('da-emp').value);
    const typeId = parseInt(document.getElementById('da-type').value);
    const incidentDate = document.getElementById('da-date').value;
    const hearingDate = document.getElementById('da-hearing').value || null;
    const title = document.getElementById('da-title').value.trim();
    const description = document.getElementById('da-desc').value.trim();
    const reportedBy = document.getElementById('da-reported-by').value.trim();
    const investigatorName = document.getElementById('da-investigator').value.trim();

    const actions = DB.get('disciplinary_actions') || [];
    const caseNo = `DIS-2026-${String(actions.length + 1).padStart(3, '0')}`;

    const newAction = {
      id: DB.nextId('disciplinary_actions'),
      caseNo,
      employeeId: empId,
      typeId,
      incidentDate,
      hearingDate,
      title,
      description,
      status: 'under_investigation',
      reportedBy,
      investigatorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    actions.unshift(newAction);
    DB.set('disciplinary_actions', actions);

    // Notify employee of formal investigation hearing
    const emp = DB.find('employees', empId);
    if (typeof LiveNotifications !== 'undefined' && LiveNotifications.dispatch) {
      LiveNotifications.dispatch({
        recipientEmpId: empId,
        recipientRole: 'employee',
        senderRole: 'hr_manager',
        senderName: 'HR Legal Directorate',
        type: 'legal_compliance',
        priority: 'high',
        title: `⚖️ Notice of Formal Disciplinary Inquiry (${caseNo})`,
        message: `An inquiry case (${caseNo}: ${title}) has been registered regarding incident on ${Utils.formatDate(incidentDate)}. Please review via your portal.`,
        actionUrl: 'employees',
        subView: 'discipline',
        actionLabel: 'View Notice'
      });
    }

    Toast.show(`Disciplinary inquiry ${caseNo} registered successfully!`, 'success');
    Modal.close('dynamic-modal');
    this.renderDiscipline(document.getElementById('emp-content'));
  },

  closeDisciplinaryAction(actionId) {
    const actions = DB.get('disciplinary_actions') || [];
    const a = actions.find(x => x.id === actionId);
    if (!a) return;
    if (!confirm(`Are you sure you want to mark disciplinary inquiry ${a.caseNo} as officially resolved and closed?`)) return;

    a.status = 'closed';
    a.resolvedAt = new Date().toISOString();
    a.updatedAt = new Date().toISOString();
    DB.set('disciplinary_actions', actions);
    Toast.show(`Case ${a.caseNo} has been marked as closed.`, 'info');
    this.renderDiscipline(document.getElementById('emp-content'));
  },

  // Modal: Issue Formal Warning Letter
  showIssueWarningLetterModal(actionId = null) {
    const emps = DB.get('employees') || [];
    const actions = DB.get('disciplinary_actions') || [];
    const targetAction = actionId ? actions.find(a => a.id === actionId) : null;
    const defaultEmpId = targetAction ? targetAction.employeeId : (emps[0]?.id || 1);

    Modal.show('Issue Official Corporate Warning Letter', `
      <form onsubmit="Employees.issueWarningLetter(event)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Employee</label>
            <select class="form-control" id="wl-emp" required>
              ${emps.map(e => `<option value="${e.id}" ${e.id===defaultEmpId?'selected':''}>${e.fullName} (${e.empNo})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Warning Classification</label>
            <select class="form-control" id="wl-level" required>
              <option value="first_written">First Written Warning</option>
              <option value="second_written">Second Written Warning</option>
              <option value="final_written">Final Written Warning</option>
              <option value="verbal">Documented Verbal Warning</option>
              <option value="show_cause">Formal Show Cause Notice</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Issue Date</label>
            <input type="date" class="form-control" id="wl-date" value="${Utils.today()}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Remediation Period</label>
            <select class="form-control" id="wl-days" required>
              <option value="30">30 Days Remediation</option>
              <option value="60">60 Days Remediation</option>
              <option value="90">90 Days Remediation</option>
              <option value="15">15 Days Immediate</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label required">Warning Subject Title</label>
          <input type="text" class="form-control" id="wl-title" value="${targetAction ? targetAction.title : 'First Written Warning — Violation of Workplace Standards'}" required>
        </div>

        <div class="form-group mb-14">
          <label class="form-label required">Statement of Violation & Corrective Action Required</label>
          <textarea class="form-control" id="wl-plan" rows="3" required>${targetAction ? `With reference to inquiry ${targetAction.caseNo}: ${targetAction.description}. You are hereby instructed to strictly rectify performance and adhere to corporate guidelines.` : 'You are hereby directed to strictly observe official work timings, line manager reporting, and code of conduct obligations.'}</textarea>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Authorized Signatory</label>
          <input type="text" class="form-control" id="wl-auth" value="Director of Human Resources & Legal Compliance" required>
        </div>

        <input type="hidden" id="wl-action-id" value="${actionId || ''}">

        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--border)">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-danger"><i class="fa fa-stamp"></i> Issue & Dispatch Warning Notice</button>
        </div>
      </form>
    `);
  },

  issueWarningLetter(e) {
    e.preventDefault();
    const empId = parseInt(document.getElementById('wl-emp').value);
    const warningLevel = document.getElementById('wl-level').value;
    const issueDate = document.getElementById('wl-date').value;
    const remediationDays = parseInt(document.getElementById('wl-days').value) || 30;
    const title = document.getElementById('wl-title').value.trim();
    const remediationPlan = document.getElementById('wl-plan').value.trim();
    const authorizedBy = document.getElementById('wl-auth').value.trim();
    const actionIdVal = document.getElementById('wl-action-id').value;
    const actionId = actionIdVal ? parseInt(actionIdVal) : null;

    const letters = DB.get('warning_letters') || [];
    const warningLetterNo = `WRN/2026/${String(letters.length + 1).padStart(3, '0')}`;

    const newLetter = {
      id: DB.nextId('warning_letters'),
      warningLetterNo,
      employeeId: empId,
      disciplinaryActionId: actionId,
      warningLevel,
      title,
      issueDate,
      remediationPlan,
      remediationDays,
      acknowledged: false,
      acknowledgedAt: null,
      acknowledgedBy: null,
      signatureNotes: null,
      authorizedBy,
      createdAt: new Date().toISOString()
    };

    letters.unshift(newLetter);
    DB.set('warning_letters', letters);

    // If associated with a disciplinary action, update its status
    if (actionId) {
      const actions = DB.get('disciplinary_actions') || [];
      const act = actions.find(a => a.id === actionId);
      if (act) {
        act.status = 'action_taken';
        act.updatedAt = new Date().toISOString();
        DB.set('disciplinary_actions', actions);
      }
    }

    // Dispatch targeted live notification to employee
    if (typeof LiveNotifications !== 'undefined' && LiveNotifications.dispatch) {
      LiveNotifications.dispatch({
        recipientEmpId: empId,
        recipientRole: 'employee',
        senderRole: 'hr_manager',
        senderName: authorizedBy || 'HR Legal Compliance',
        type: 'legal_compliance',
        priority: 'high',
        title: `⚠️ Formal Warning Notice Issued (${warningLetterNo})`,
        message: `You have been issued a formal ${warningLevel.replace(/_/g, ' ')} (${warningLetterNo}: ${title}). A formal electronic acknowledgment of receipt is required.`,
        actionUrl: 'employees',
        subView: 'discipline',
        actionLabel: 'Sign Notice'
      });
    }

    Toast.show(`Official warning notice ${warningLetterNo} issued and dispatched to employee!`, 'success');
    Modal.close('dynamic-modal');
    this.renderDiscipline(document.getElementById('emp-content'));
    this.previewWarningLetterModal(newLetter.id);
  },

  previewWarningLetterModal(letterId) {
    const letters = DB.get('warning_letters') || [];
    const l = letters.find(x => x.id === letterId);
    if (!l) return;
    const emp = DB.find('employees', l.employeeId) || { fullName: 'Employee', empNo: 'EMP-??', cnic: '42201-???????-?', departmentId: 1, designationId: 1 };
    const settings = DB.getObj('settings') || {};
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';

    Modal.show('Corporate Legal Notice & Letterhead Preview', `
      <div id="print-warning-letter-area" style="background:#fff;color:#111;padding:34px 38px;border-radius:8px;border:1.5px solid #cbd5e1;font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;position:relative">
        <!-- Corporate Header -->
        <div style="border-bottom:3px solid #dc2626;padding-bottom:14px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end">
          <div>
            <h2 style="margin:0;font-size:22px;color:#991b1b;font-weight:800;letter-spacing:0.5px">${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</h2>
            <div style="font-size:11.5px;color:#64748b">Directorate of Legal Affairs, Governance & Human Capital</div>
            <div style="font-size:11px;color:#64748b">Confidential Personnel Document • Ref: <strong>${l.warningLetterNo}</strong></div>
          </div>
          <div style="text-align:right">
            <span class="badge badge-danger" style="font-size:11px;padding:4px 10px;text-transform:uppercase;letter-spacing:1px">STRICTLY CONFIDENTIAL</span>
            <div style="font-size:11.5px;color:#64748b;margin-top:6px">Date: <strong>${l.issueDate}</strong></div>
          </div>
        </div>

        <!-- Addressee Information -->
        <div style="margin-bottom:20px;font-size:13px;background:#f8fafc;padding:12px 16px;border-radius:6px;border-left:3px solid #64748b">
          <div><strong>To:</strong> Mr./Ms. ${emp.fullName}</div>
          <div><strong>Designation:</strong> ${Utils.getDesigName(emp.designationId)} | <strong>Employee ID:</strong> <code>${emp.empNo}</code></div>
          <div><strong>Department:</strong> ${Utils.getDeptName(emp.departmentId)} | <strong>CNIC:</strong> ${emp.cnic || 'N/A'}</div>
        </div>

        <!-- Document Subject -->
        <div style="text-align:center;margin-bottom:22px">
          <h3 style="display:inline-block;margin:0;font-size:16.5px;font-weight:800;text-decoration:underline;text-transform:uppercase;color:#991b1b;letter-spacing:0.5px">
            OFFICIAL NOTICE: ${l.title}
          </h3>
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-top:4px">
            CLASSIFICATION: ${(l.warningLevel || '').replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>

        <!-- Letter Body Content -->
        <div style="font-size:13.5px;color:#334155;text-align:justify;line-height:1.7;margin-bottom:30px">
          <p>This formal written notice serves as an official reprimand and corrective remediation directive under the Employment Regulations and Code of Professional Conduct of <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong>.</p>
          
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:14px 0">
            <strong style="color:#991b1b">Statement of Violation & Directive:</strong>
            <p style="margin:4px 0 0 0;font-size:13px;color:#7f1d1d">${l.remediationPlan || 'Compliance with company standards and line management instructions is strictly mandated.'}</p>
          </div>

          <p>You are hereby granted a formal Remediation Period of <strong>${l.remediationDays || 30} calendar days</strong> from the receipt of this notice to demonstrate sustained, measurable improvement in your conduct and responsibilities.</p>

          <p style="font-size:12.5px;color:#64748b"><strong>Consequences of Non-Compliance:</strong> Failure to comply with the stipulated remediation directives or any recurrence of similar misconduct during or following this period shall result in escalated disciplinary sanctions, up to and including suspension without emoluments or summary termination of your contract of employment under corporate policy and applicable labor laws.</p>
        </div>

        <!-- Dual Signature & Acknowledgment Block -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0">
          <div>
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:20px">Issued By Management:</div>
            <div style="width:160px;height:40px;border-bottom:1.5px solid #334155;margin-bottom:6px"></div>
            <div style="font-size:13px;font-weight:700">${l.authorizedBy || 'HR Operations Directorate'}</div>
            <div style="font-size:11px;color:#64748b">Authorized Signatory • Legal Affairs</div>
          </div>

          <div>
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:20px">Employee Receipt Acknowledgment:</div>
            ${l.acknowledged ? `
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 12px">
                <div style="font-size:12px;font-weight:700;color:#166534">
                  <i class="fa fa-circle-check"></i> Digitally Signed & Acknowledged
                </div>
                <div style="font-size:11px;color:#15803d;margin-top:2px">
                  Acknowledged by: <strong>${l.acknowledgedBy || emp.fullName}</strong>
                </div>
                <div style="font-size:10.5px;color:#15803d">
                  Timestamp: ${Utils.formatDate(l.acknowledgedAt)} (Portal E-Sign)
                </div>
              </div>
            ` : `
              <div style="width:160px;height:40px;border-bottom:1.5px dashed #dc2626;margin-bottom:6px"></div>
              <div style="font-size:12px;font-weight:700;color:#dc2626"><i class="fa fa-clock"></i> Pending Employee Acknowledgment</div>
              <div style="font-size:11px;color:#64748b">Must be confirmed via employee workspace</div>
            `}
          </div>
        </div>
      </div>

      <div class="modal-footer" style="padding:14px 0 0 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <span style="font-size:12px;color:var(--text-3)">Confidential personnel record stored in audit vault</span>
        <div style="display:flex;gap:8px;align-items:center">
          ${!l.acknowledged && (isStaff || Auth.employee?.id === l.employeeId) ? `
            <button type="button" class="btn btn-success" onclick="Employees.acknowledgeWarningLetter(${l.id}); Modal.close('dynamic-modal')">
              <i class="fa fa-signature"></i> Sign & Acknowledge Receipt
            </button>
          ` : ''}
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
          <button type="button" class="btn btn-primary" onclick="Employees.printWarningLetter(${l.id})">
            <i class="fa fa-print"></i> Print Official Notice
          </button>
        </div>
      </div>
    `);
  },

  acknowledgeWarningLetter(letterId) {
    const letters = DB.get('warning_letters') || [];
    const l = letters.find(x => x.id === letterId);
    if (!l) return;

    const emp = DB.find('employees', l.employeeId) || {};
    l.acknowledged = true;
    l.acknowledgedAt = new Date().toISOString();
    l.acknowledgedBy = (typeof Auth !== 'undefined' && Auth.employee?.fullName) ? Auth.employee.fullName : (emp.fullName || 'Employee');
    l.signatureNotes = 'Formally signed and acknowledged via secure employee portal session.';
    DB.set('warning_letters', letters);
    if (typeof LiveNotifications !== 'undefined' && LiveNotifications.dispatch) {
      LiveNotifications.dispatch({
        recipientRole: 'hr_manager',
        senderEmpId: l.employeeId,
        senderName: emp.fullName || 'Employee',
        type: 'legal_compliance',
        priority: 'high',
        title: `⚖️ Notice Acknowledged: ${emp.fullName}`,
        message: `${emp.fullName} has formally acknowledged receipt and signed disciplinary warning notice ${l.warningLetterNo}.`,
        actionUrl: 'employees',
        subView: 'discipline',
        actionLabel: 'View Audit'
      });
    }

    Toast.show('Disciplinary notice receipt formally signed and recorded in corporate audit archive!', 'success');
    this.render();
  },

  printWarningLetter(letterId) {
    const letters = DB.get('warning_letters') || [];
    const l = letters.find(x => x.id === letterId);
    if (!l) return;
    const emp = DB.find('employees', l.employeeId) || { fullName: 'Employee', empNo: 'EMP-??', cnic: '42201-???????-?', departmentId: 1, designationId: 1 };
    const settings = DB.getObj('settings') || {};

    const printWin = window.open('', '_blank', 'width=900,height=950');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DISCIPLINARY NOTICE ${l.warningLetterNo} — ${emp.fullName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
          .header { border-bottom: 3px solid #dc2626; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { text-align: center; margin: 25px 0 20px; font-size: 17px; font-weight: 800; text-decoration: underline; color: #991b1b; text-transform: uppercase; }
          .content { font-size: 14px; text-align: justify; margin-bottom: 40px; }
          .sig-block { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; padding-top: 20px; border-top: 1px solid #cbd5e1; }
          .sig-line { width: 180px; border-top: 1.5px solid #111; padding-top: 6px; font-size: 13px; font-weight: 700; }
          @media print { body { padding: 15mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin:0;font-size:22px;color:#991b1b">${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</h2>
            <div style="font-size:12px;color:#64748b">Directorate of Legal Affairs, Governance & Human Capital</div>
            <div style="font-size:11px;color:#64748b">Ref: ${l.warningLetterNo}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:800;color:#dc2626;font-size:12px">STRICTLY CONFIDENTIAL</div>
            <div style="font-size:12px;color:#64748b">Date: ${l.issueDate}</div>
          </div>
        </div>

        <div style="background:#f8fafc;padding:12px;margin-bottom:20px;border-left:3px solid #64748b;font-size:13px">
          <div><strong>To:</strong> Mr./Ms. ${emp.fullName} (EMP ID: ${emp.empNo})</div>
          <div><strong>Designation:</strong> ${Utils.getDesigName(emp.designationId)} | <strong>Department:</strong> ${Utils.getDeptName(emp.departmentId)}</div>
        </div>

        <div class="title">${l.title}</div>

        <div class="content">
          <p>This formal notice constitutes an official reprimand and corrective remediation directive under the Employment Regulations and Code of Conduct of <strong>${settings.companyName || 'HRM Pro Corporation Pvt. Ltd.'}</strong>.</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;padding:12px;margin:15px 0">
            <strong>Statement of Violation:</strong>
            <p style="margin:4px 0 0 0">${l.remediationPlan}</p>
          </div>
          <p>You are granted a formal Remediation Period of <strong>${l.remediationDays || 30} days</strong> from receipt hereof to rectify compliance and adhere to company operating standards.</p>
          <p>Failure to satisfy these directives may result in escalated disciplinary sanctions up to contract termination under corporate rules and employment regulations.</p>
        </div>

        <div class="sig-block">
          <div>
            <div class="sig-line">${l.authorizedBy || 'HR Directorate'}</div>
            <div style="font-size:11px;color:#64748b">Authorized Corporate Officer</div>
          </div>
          <div style="text-align:right">
            <div class="sig-line" style="margin-left:auto">${l.acknowledged ? `Acknowledged by ${l.acknowledgedBy}` : 'Employee Receipt Acknowledgment'}</div>
            <div style="font-size:11px;color:#64748b">${l.acknowledged ? `Acknowledged: ${Utils.formatDate(l.acknowledgedAt)}` : 'Pending Employee Signature'}</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 400);
  },

  // ============================================================
  // NORMALIZED PROFILE MODALS (Education, Experience, Skills, Contacts)
  // ============================================================
  showAddEducationModal(empId) {
    Modal.show('Add Academic Degree / Qualification', `
      <form onsubmit="Employees.saveEducation(event, ${empId})">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Degree / Certificate</label>
            <input type="text" class="form-control" id="ed-degree" placeholder="e.g. Master of Science (MS / MPhil)" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Field of Study / Specialization</label>
            <input type="text" class="form-control" id="ed-field" placeholder="e.g. Computer Science, Finance, HR" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Institution / University</label>
            <input type="text" class="form-control" id="ed-inst" placeholder="e.g. FAST-NUCES, LUMS, IBA" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Passing Year</label>
            <input type="number" class="form-control" id="ed-year" min="1970" max="2030" value="2022" required>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label">Grade / CGPA</label>
            <input type="text" class="form-control" id="ed-grade" placeholder="e.g. 3.82 CGPA or A+">
          </div>
          <div class="form-group">
            <label class="form-label">Verification Status</label>
            <select class="form-control" id="ed-verified">
              <option value="true">Verified Genuine</option>
              <option value="false">Pending Verification</option>
            </select>
          </div>
        </div>

        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--border)">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-plus"></i> Save Education</button>
        </div>
      </form>
    `);
  },

  saveEducation(e, empId) {
    e.preventDefault();
    const degree = document.getElementById('ed-degree').value.trim();
    const fieldOfStudy = document.getElementById('ed-field').value.trim();
    const institution = document.getElementById('ed-inst').value.trim();
    const year = parseInt(document.getElementById('ed-year').value) || 2024;
    const grade = document.getElementById('ed-grade').value.trim() || 'A';
    const verified = document.getElementById('ed-verified').value === 'true';

    const educations = DB.get('educations') || [];
    educations.push({
      id: DB.nextId('educations'),
      employeeId: empId,
      degree,
      fieldOfStudy,
      institution,
      year,
      grade,
      verified,
      createdAt: new Date().toISOString()
    });
    DB.set('educations', educations);

    Toast.show('Educational degree added successfully!', 'success');
    Modal.close('dynamic-modal');
    this.renderProfile(empId);
  },

  showAddCertificateModal(empId) {
    Modal.show('Add Professional Certification', `
      <form onsubmit="Employees.saveCertificate(event, ${empId})">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Certification Title</label>
            <input type="text" class="form-control" id="cert-title" placeholder="e.g. AWS Certified Solutions Architect" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Issuing Organization / Body</label>
            <input type="text" class="form-control" id="cert-org" placeholder="e.g. Amazon Web Services, Scrum.org" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Issue Date</label>
            <input type="date" class="form-control" id="cert-issue" value="${Utils.today()}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Expiry Date (Optional)</label>
            <input type="date" class="form-control" id="cert-expiry">
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Credential ID / Verification URL</label>
          <input type="text" class="form-control" id="cert-cred-id" placeholder="e.g. CERT-AWS-883921">
        </div>

        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--border)">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-plus"></i> Save Certification</button>
        </div>
      </form>
    `);
  },

  saveCertificate(e, empId) {
    e.preventDefault();
    const title = document.getElementById('cert-title').value.trim();
    const issuingOrg = document.getElementById('cert-org').value.trim();
    const issueDate = document.getElementById('cert-issue').value;
    const expiryDate = document.getElementById('cert-expiry').value || null;
    const credentialId = document.getElementById('cert-cred-id').value.trim();

    const certs = DB.get('employee_certificates') || [];
    certs.push({
      id: DB.nextId('employee_certificates'),
      employeeId: empId,
      title,
      issuingOrg,
      issueDate,
      expiryDate,
      credentialId,
      verificationStatus: 'verified',
      createdAt: new Date().toISOString()
    });
    DB.set('employee_certificates', certs);

    Toast.show('Professional certification saved!', 'success');
    Modal.close('dynamic-modal');
    this.renderProfile(empId);
  },

  showAddExperienceModal(empId) {
    Modal.show('Add Prior Employment Experience', `
      <form onsubmit="Employees.saveExperience(event, ${empId})">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Designation / Role</label>
            <input type="text" class="form-control" id="exp-role" placeholder="e.g. Senior Software Engineer" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Company / Employer</label>
            <input type="text" class="form-control" id="exp-company" placeholder="e.g. TechLogix Systems Pvt. Ltd." required>
          </div>
          <div class="form-group">
            <label class="form-label required">From Date</label>
            <input type="date" class="form-control" id="exp-from" value="2022-01-01" required>
          </div>
          <div class="form-group">
            <label class="form-label">To Date</label>
            <input type="date" class="form-control" id="exp-to" value="${Utils.today()}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label">Location / City</label>
            <input type="text" class="form-control" id="exp-loc" placeholder="e.g. Karachi, Pakistan">
          </div>
          <div class="form-group" style="display:flex;align-items:center;margin-top:24px">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
              <input type="checkbox" id="exp-current"> Currently Employed Here
            </label>
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Key Responsibilities & Deliverables</label>
          <textarea class="form-control" id="exp-resp" rows="3" placeholder="Brief summary of projects, technologies and accomplishments..."></textarea>
        </div>

        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--border)">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-plus"></i> Save Experience</button>
        </div>
      </form>
    `);
  },

  saveExperience(e, empId) {
    e.preventDefault();
    const designation = document.getElementById('exp-role').value.trim();
    const company = document.getElementById('exp-company').value.trim();
    const from = document.getElementById('exp-from').value;
    const isCurrent = document.getElementById('exp-current').checked;
    const to = isCurrent ? null : (document.getElementById('exp-to').value || null);
    const location = document.getElementById('exp-loc').value.trim();
    const responsibilities = document.getElementById('exp-resp').value.trim();

    const exps = DB.get('work_experiences') || [];
    exps.push({
      id: DB.nextId('work_experiences'),
      employeeId: empId,
      designation,
      jobTitle: designation,
      company,
      from,
      to,
      isCurrent,
      location,
      responsibilities,
      createdAt: new Date().toISOString()
    });
    DB.set('work_experiences', exps);

    Toast.show('Work experience saved!', 'success');
    Modal.close('dynamic-modal');
    this.renderProfile(empId);
  },

  showAddEmergencyContactModal(empId) {
    Modal.show('Add Emergency Contact', `
      <form onsubmit="Employees.saveEmergencyContact(event, ${empId})">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Contact Full Name</label>
            <input type="text" class="form-control" id="ec-name" placeholder="e.g. Asad Raza" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Relationship</label>
            <input type="text" class="form-control" id="ec-rel" placeholder="e.g. Spouse, Brother, Father" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Primary Mobile / Phone</label>
            <input type="text" class="form-control" id="ec-phone" placeholder="e.g. +92 300 1234567" required>
          </div>
          <div class="form-group">
            <label class="form-label">Alternate Phone</label>
            <input type="text" class="form-control" id="ec-alt-phone" placeholder="e.g. 021-34567890">
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Residential Address</label>
          <input type="text" class="form-control" id="ec-addr" placeholder="e.g. House 45, Block 6, Gulshan, Karachi">
        </div>

        <div class="form-group mb-14">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="ec-primary" checked> Set as Primary Emergency Contact
          </label>
        </div>

        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--border)">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-plus"></i> Save Contact</button>
        </div>
      </form>
    `);
  },

  saveEmergencyContact(e, empId) {
    e.preventDefault();
    const name = document.getElementById('ec-name').value.trim();
    const relation = document.getElementById('ec-rel').value.trim();
    const phone = document.getElementById('ec-phone').value.trim();
    const altPhone = document.getElementById('ec-alt-phone').value.trim() || null;
    const address = document.getElementById('ec-addr').value.trim() || null;
    const isPrimary = document.getElementById('ec-primary').checked;

    let contacts = DB.get('emergency_contacts') || [];
    if (isPrimary) {
      contacts.forEach(c => {
        if (c.employeeId === empId) c.isPrimary = false;
      });
    }

    contacts.push({
      id: DB.nextId('emergency_contacts'),
      employeeId: empId,
      name,
      relation,
      phone,
      altPhone,
      address,
      isPrimary,
      createdAt: new Date().toISOString()
    });
    DB.set('emergency_contacts', contacts);

    Toast.show('Emergency contact registered!', 'success');
    Modal.close('dynamic-modal');
    this.renderProfile(empId);
  },

  showAddSkillModal(empId) {
    Modal.show('Add Core Competency / Skill', `
      <form onsubmit="Employees.saveSkill(event, ${empId})">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="mb-14">
          <div class="form-group">
            <label class="form-label required">Skill Name</label>
            <input type="text" class="form-control" id="sk-name" placeholder="e.g. Node.js Architecture, Risk Analysis" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select class="form-control" id="sk-cat" required>
              <option value="Technical">Technical</option>
              <option value="Management">Management</option>
              <option value="Soft Skills">Soft Skills</option>
              <option value="Operational">Operational</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Proficiency Level</label>
            <select class="form-control" id="sk-prof" required>
              <option value="beginner">Beginner (Foundational)</option>
              <option value="intermediate">Intermediate (Working)</option>
              <option value="advanced" selected>Advanced (Proficient)</option>
              <option value="expert">Expert (Mastery / Lead)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Years of Experience</label>
            <input type="number" class="form-control" id="sk-yrs" min="1" max="40" value="4">
          </div>
        </div>

        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--border)">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-plus"></i> Save Skill</button>
        </div>
      </form>
    `);
  },

  saveSkill(e, empId) {
    e.preventDefault();
    const skillName = document.getElementById('sk-name').value.trim();
    const category = document.getElementById('sk-cat').value;
    const proficiency = document.getElementById('sk-prof').value;
    const yearsOfExperience = parseInt(document.getElementById('sk-yrs').value) || 2;

    const skills = DB.get('employee_skills') || [];
    skills.push({
      id: DB.nextId('employee_skills'),
      employeeId: empId,
      skillName,
      category,
      proficiency,
      yearsOfExperience,
      createdAt: new Date().toISOString()
    });
    DB.set('employee_skills', skills);

    Toast.show('Competency skill saved to employee matrix!', 'success');
    Modal.close('dynamic-modal');
    this.renderProfile(empId);
  },

  // ============================================================
  // TRAINING CERTIFICATE MODAL & PRINTING
  // ============================================================
  previewTrainingCertificateModal(certId) {
    const certs = DB.get('training_certificates') || [];
    const cert = certs.find(c => c.id === certId);
    if (!cert) return;
    const emp = DB.find('employees', cert.employeeId) || { fullName: 'Employee', empNo: 'EMP-??' };
    const session = (DB.get('training_sessions') || []).find(s => s.id === cert.sessionId) || {};
    const settings = DB.getObj('settings') || {};

    Modal.show('Corporate CPD Training Certificate', `
      <div id="print-cpd-cert-area" style="background:#fff;color:#0f172a;padding:36px;border:3px double #d97706;border-radius:12px;font-family:'Georgia',serif;text-align:center;position:relative;box-shadow:0 10px 25px rgba(0,0,0,0.08)">
        <!-- Security Watermark / Crest -->
        <div style="font-size:12px;letter-spacing:3px;font-weight:700;color:#92400e;text-transform:uppercase;margin-bottom:6px">
          ${settings.companyName || 'HRM PRO ENTERPRISE CORP'} • TALENT ACADEMY
        </div>
        <h1 style="font-size:26px;color:#1e3a8a;font-weight:800;margin:0 0 16px 0;letter-spacing:1px;font-family:'Segoe UI',sans-serif">
          CERTIFICATE OF ACHIEVEMENT
        </h1>
        <div style="font-size:13px;color:#64748b;font-style:italic;margin-bottom:18px">
          Continuing Professional Development (CPD) & Competency Certification
        </div>

        <div style="font-size:14px;color:#334155;margin-bottom:10px">This is to proudly certify that</div>
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:14px;border-bottom:2px solid #e2e8f0;display:inline-block;padding:0 30px 4px 30px;font-family:'Segoe UI',sans-serif">
          ${emp.fullName}
        </div>
        <div style="font-size:12px;color:#64748b;margin-bottom:20px">Employee Number: <code>${emp.empNo}</code></div>

        <div style="font-size:14.5px;color:#334155;max-width:540px;margin:0 auto 20px auto;line-height:1.6">
          has successfully attended, completed all coursework, and demonstrated professional competence in
          <div style="font-size:17px;font-weight:800;color:#1e3a8a;margin-top:6px;font-family:'Segoe UI',sans-serif">
            ${cert.title}
          </div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">
            Course Ref: <strong>${session.sessionCode || 'TRN-2026'}</strong> • ${session.creditHours || 8} Verified CPD Credit Hours
          </div>
        </div>

        <div style="display:inline-flex;gap:20px;background:#f8fafc;padding:10px 24px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:28px;font-family:'Segoe UI',sans-serif">
          <div style="font-size:12px"><strong>Credential ID:</strong> <code>${cert.certificateNo}</code></div>
          <div style="font-size:12px"><strong>Assessment Score:</strong> <span style="color:#16a34a;font-weight:700">${cert.score}%</span></div>
          <div style="font-size:12px"><strong>Issue Date:</strong> ${Utils.formatDate(cert.issuedDate)}</div>
        </div>

        <!-- Verification Hash -->
        <div style="font-size:10px;font-family:monospace;color:#64748b;margin-bottom:26px">
          VERIFICATION HASH: <strong>SHA256:${cert.verificationHash || 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'}</strong>
        </div>

        <!-- Signatures & Seal -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;padding:0 30px;font-family:'Segoe UI',sans-serif">
          <div style="text-align:center">
            <div style="width:140px;border-bottom:1.5px solid #334155;margin:0 auto 6px auto"></div>
            <div style="font-size:12px;font-weight:700">${session.trainerName || 'Corporate Master Trainer'}</div>
            <div style="font-size:10.5px;color:#64748b">Lead Instructor</div>
          </div>
          <div style="border:2px dashed #d97706;border-radius:50%;width:74px;height:74px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#d97706">
            <i class="fa fa-award" style="font-size:16px"></i>
            <span style="font-size:7px;font-weight:800;text-transform:uppercase;margin-top:2px">CPD VERIFIED</span>
          </div>
          <div style="text-align:center">
            <div style="width:140px;border-bottom:1.5px solid #334155;margin:0 auto 6px auto"></div>
            <div style="font-size:12px;font-weight:700">Directorate of HR</div>
            <div style="font-size:10.5px;color:#64748b">Learning & Development</div>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="padding:14px 0 0 0;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;color:var(--text-3)">Cryptographically auditable CPD qualification credential</span>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
          <button type="button" class="btn btn-primary" onclick="Employees.printTrainingCertificate(${cert.id})">
            <i class="fa fa-print"></i> Print Official Certificate
          </button>
        </div>
      </div>
    `);
  },

  printTrainingCertificate(certId) {
    const certs = DB.get('training_certificates') || [];
    const cert = certs.find(c => c.id === certId);
    if (!cert) return;
    const emp = DB.find('employees', cert.employeeId) || { fullName: 'Employee', empNo: 'EMP-??' };
    const session = (DB.get('training_sessions') || []).find(s => s.id === cert.sessionId) || {};
    const settings = DB.getObj('settings') || {};

    const printWin = window.open('', '_blank', 'width=950,height=750');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CPD CERTIFICATE ${cert.certificateNo} — ${emp.fullName}</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          body { font-family: 'Georgia', serif; padding: 30px; text-align: center; color: #0f172a; }
          .border-box { border: 3px double #d97706; padding: 40px; border-radius: 12px; position: relative; }
          h1 { font-family: 'Segoe UI', Arial, sans-serif; font-size: 28px; color: #1e3a8a; margin: 10px 0; font-weight: 800; }
          .recipient { font-family: 'Segoe UI', Arial, sans-serif; font-size: 26px; font-weight: 800; border-bottom: 2px solid #e2e8f0; display: inline-block; padding: 0 30px 4px 30px; margin: 15px 0; }
          .course { font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: 800; color: #1e3a8a; margin: 10px 0; }
          .sig-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; padding: 0 40px; font-family: 'Segoe UI', Arial, sans-serif; }
          .sig-line { width: 160px; border-top: 1.5px solid #111; padding-top: 6px; font-size: 13px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div style="font-size:12px;letter-spacing:3px;font-weight:700;color:#92400e;text-transform:uppercase">${settings.companyName || 'HRM PRO ENTERPRISE CORP'} • TALENT ACADEMY</div>
          <h1>CERTIFICATE OF ACHIEVEMENT</h1>
          <div style="font-size:14px;color:#64748b;font-style:italic">Continuing Professional Development (CPD) & Competency Certification</div>
          
          <div style="margin-top:20px;font-size:15px">This is to proudly certify that</div>
          <div class="recipient">${emp.fullName}</div>
          <div style="font-size:12px;color:#64748b">Employee ID: ${emp.empNo}</div>

          <p style="font-size:15px;max-width:600px;margin:15px auto;line-height:1.6">
            has successfully completed all requirements and passed formal competency evaluation for
          </p>
          <div class="course">${cert.title}</div>
          <div style="font-size:13px;color:#64748b">Course Ref: ${session.sessionCode || 'TRN-2026'} • ${session.creditHours || 8} Verified CPD Hours</div>

          <div style="margin:20px auto;display:inline-block;padding:8px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-family:'Segoe UI',sans-serif;font-size:12px">
            Credential ID: <strong>${cert.certificateNo}</strong> • Assessment Score: <strong>${cert.score}%</strong> • Issued: ${Utils.formatDate(cert.issuedDate)}
          </div>
          <div style="font-size:9.5px;font-family:monospace;color:#64748b">VERIFICATION HASH: SHA256:${cert.verificationHash || 'GENUINE-CPD-VERIFIED'}</div>

          <div class="sig-row">
            <div>
              <div class="sig-line">${session.trainerName || 'Corporate Master Trainer'}</div>
              <div style="font-size:11px;color:#64748b">Lead Instructor</div>
            </div>
            <div style="border:2px dashed #d97706;border-radius:50%;width:70px;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#d97706">
              <span style="font-size:7px;font-weight:800">CPD CERT</span>
            </div>
            <div>
              <div class="sig-line">Director of HR</div>
              <div style="font-size:11px;color:#64748b">Learning & Development</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 400);
  }

};

