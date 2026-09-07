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
    if (this.currentView === 'current')    emps = emps.filter(e => e.status === 'active' && e.role !== 'onboarding');
    if (this.currentView === 'onboarding') emps = emps.filter(e => e.role === 'onboarding');
    if (this.currentView === 'ex')         emps = emps.filter(e => e.status === 'inactive');
    if (this.currentView === 'my') {
      const myId = Auth.employee.id;
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
              <div class="avatar avatar-lg mx-auto" style="background:${Utils.avatarColor(e.id)};margin:0 auto">${Utils.avatarInitials(e.fullName)}</div>
              <div class="name">${e.fullName}</div>
              <div class="desig">${Utils.getDesigName(e.designationId)}</div>
              <div class="dept">${Utils.getDeptName(e.departmentId)}</div>
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
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)}">${Utils.avatarInitials(e.fullName)}</div>
                      <div>
                        <div style="font-weight:600;font-size:13px">${e.fullName}</div>
                        <div style="font-size:11px;color:var(--text-3)">${e.email}</div>
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

        <div class="profile-layout">
          <!-- Left Card -->
          <div>
            <div class="profile-card">
              <div class="profile-cover"></div>
              <div class="profile-info">
                <div class="profile-avatar-wrap">
                  <div class="avatar avatar-xl" style="background:${Utils.avatarColor(emp.id)};margin:0 auto;border:4px solid var(--card)">${Utils.avatarInitials(emp.fullName)}</div>
                </div>
                <div class="profile-name">${emp.fullName}</div>
                <div class="profile-desig">${Utils.getDesigName(emp.designationId)}</div>
                <div class="profile-dept">${Utils.getDeptName(emp.departmentId)}</div>
                <div style="margin-top:8px">
                  ${Employees.getRoleBadge(emp.role || linkedUser?.role || 'employee')}
                  <span class="chip" style="margin-left:4px">${emp.employmentType}</span>
                </div>
                <div class="profile-meta">
                  <div class="profile-meta-item"><i class="fa fa-id-badge"></i>${emp.empNo}</div>
                  <div class="profile-meta-item"><i class="fa fa-envelope"></i>${emp.email}</div>
                  <div class="profile-meta-item"><i class="fa fa-phone"></i>${emp.phone}</div>
                  <div class="profile-meta-item"><i class="fa fa-building"></i>${Utils.getBranchName(emp.branchId)}</div>
                  <div class="profile-meta-item"><i class="fa fa-calendar"></i>Joined: ${Utils.formatDate(emp.joiningDate)}</div>
                  <div class="profile-meta-item"><i class="fa fa-droplet"></i>${emp.bloodGroup || 'Not Specified'}</div>
                </div>
              </div>
            </div>

            <!-- Profile Sidebar Actions -->
            <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
              ${isHR ? `
                <!-- Dedicated Role & Login Access Card for Admin/HR -->
                <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;box-shadow:var(--shadow-sm)">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                    <div style="font-size:12px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px">
                      <i class="fa fa-shield-halved" style="color:var(--primary)"></i> Role & Login Access
                    </div>
                    ${linkedUser 
                      ? `<span class="badge ${linkedUser.status==='active'?'badge-success':'badge-danger'}" style="font-size:9.5px">${linkedUser.status.toUpperCase()}</span>` 
                      : '<span class="badge badge-warning" style="font-size:9.5px">NO LOGIN</span>'}
                  </div>

                  <div style="margin-bottom:10px">
                    <div style="font-size:11px;color:var(--text-3);margin-bottom:4px">Assigned System Role:</div>
                    <div>${Employees.getRoleBadge(emp.role || linkedUser?.role || 'employee')}</div>
                  </div>

                  ${linkedUser ? `
                    <div style="font-size:11.5px;color:var(--text-2);margin-bottom:12px;background:var(--card);padding:8px 10px;border-radius:8px;border:1px solid var(--border)">
                      <div style="display:flex;align-items:center;justify-content:space-between">
                        <span style="font-family:monospace;font-weight:700;color:var(--primary)">
                          <i class="fa fa-user" style="margin-right:5px"></i>${linkedUser.username}
                        </span>
                        <button class="btn btn-ghost btn-xs" onclick="Employees.copyCredentials('${linkedUser.username}', '${linkedUser.password}', '${emp.role||linkedUser.role}')" title="Copy Login Credentials">
                          <i class="fa fa-copy"></i>
                        </button>
                      </div>
                      <div style="font-size:10.5px;color:var(--text-muted);margin-top:4px">
                        Last Sign-in: ${linkedUser.lastLogin ? Utils.formatDate(linkedUser.lastLogin) : 'Never logged in'}
                      </div>
                    </div>
                  ` : `
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;background:var(--card);padding:8px;border-radius:8px;border:1px dashed var(--border)">
                      <i class="fa fa-triangle-exclamation" style="color:var(--warning);margin-right:4px"></i>No active login user account linked.
                    </div>
                  `}

                  <div style="display:flex;flex-direction:column;gap:6px">
                    <button class="btn btn-primary btn-sm w-full" onclick="Employees.showAssignRoleModal(${emp.id})">
                      <i class="fa fa-user-shield"></i> Assign / Edit Role
                    </button>
                    ${linkedUser ? `
                      <button class="btn btn-secondary btn-sm w-full" onclick="Employees.showManageLoginModal(${emp.id})">
                        <i class="fa fa-key"></i> Manage Login & Password
                      </button>
                    ` : `
                      <button class="btn btn-secondary btn-sm w-full" onclick="Employees.createLoginForEmployee(${emp.id})">
                        <i class="fa fa-user-plus"></i> Generate Login Account
                      </button>
                    `}
                  </div>
                </div>
              ` : ''}

              ${isOnboardingSelf ? `
                <button class="btn btn-primary w-full" onclick="Employees.showSelfServiceEditForm(${emp.id})"><i class="fa fa-pen-to-square"></i> Fill / Edit My Info</button>
                <button class="btn btn-secondary w-full" onclick="Employees.showUploadDocumentModal(${emp.id})"><i class="fa fa-upload"></i> Upload Joining Docs</button>
                ${emp.onboardingStatus !== 'submitted_for_review' ? `
                  <button class="btn btn-success w-full" onclick="Employees.submitOnboardingForReview(${emp.id})"><i class="fa fa-paper-plane"></i> Submit to HR for Review</button>
                ` : `
                  <div style="padding:8px 12px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:8px;text-align:center;font-size:11.5px;color:#16a34a;font-weight:600">
                    <i class="fa fa-circle-check"></i> Submitted for HR Verification
                  </div>
                `}
              ` : ''}

              ${isHR ? `
                <button class="btn btn-secondary w-full" onclick="Employees.showEditForm(${emp.id})"><i class="fa fa-pen"></i> Edit Personal Details</button>
                <button class="btn btn-ghost w-full" onclick="Employees.printProfile(${emp.id})"><i class="fa fa-print"></i> Print Profile</button>
              ` : ''}

              ${(!isHR && !isOnboardingSelf) ? `
                <div style="padding:12px 14px;background:rgba(236,72,153,0.1);border:1px solid rgba(236,72,153,0.3);border-radius:12px;text-align:center">
                  <div style="font-size:12.5px;font-weight:700;color:#ec4899"><i class="fa fa-lock" style="margin-right:6px"></i>View-Only Profile</div>
                  <div style="font-size:11px;color:var(--text-3);margin-top:3px">Employee records are protected and managed by HR Administration.</div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Right Tabs -->
          <div class="card" style="padding:0">
            <div class="tabs" style="padding:0 20px;margin-bottom:0;flex-wrap:wrap">
              ${tabs.map((t,i) => `<button class="tab-btn ${i===0?'active':''}" data-tab="prof-${t.replace(/\s/g,'-').toLowerCase()}" onclick="Employees.switchProfileTab(this)">${t}</button>`).join('')}
            </div>
            <div style="padding:20px">
              ${tabs.map((t,i) => `<div id="prof-${t.replace(/\s/g,'-').toLowerCase()}" class="tab-content ${i===0?'active':''}">${this.renderProfileTab(t, emp)}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  switchProfileTab(btn) {
    const tabId = btn.dataset.tab;
    btn.closest('.card').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    btn.closest('.card').querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');
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
      salary, photo: null, managerId: null, reportingTo: null,
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
        <div class="form-group"><label class="form-label">Branch</label>
          <select class="form-control" id="ef-branch">${branches.map(b=>`<option value="${b.id}"${b.id===emp.branchId?' selected':''}>${b.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="ef-address">${emp.address||''}</textarea></div>
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

