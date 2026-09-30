// ============================================================
// HRM SYSTEM — Authentication & Role Management
// ============================================================

const Auth = {
  _user: null,
  _employee: null,

  init() {
    const saved = localStorage.getItem('hrm_session') || sessionStorage.getItem('hrm_session');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s && s.user) {
          // Verify user and employee still exist and are active in live DB
          const users = (typeof DB !== 'undefined' && DB.get) ? (DB.get('users') || []) : [];
          const liveUser = users.find(u => String(u.id) === String(s.user.id) || u.username === s.user.username);
          const emps = (typeof DB !== 'undefined' && DB.get) ? (DB.get('employees') || []) : [];
          const liveEmployee = s.employee ? emps.find(e => String(e.id) === String(s.employee.id)) : null;

          if (liveUser && liveUser.status === 'inactive') {
            this._user = null;
            this._employee = null;
            sessionStorage.removeItem('hrm_session');
            localStorage.removeItem('hrm_session');
            return;
          }

          const safeUser = liveUser ? { ...liveUser } : { ...s.user };
          delete safeUser.password;

          this._user = safeUser;
          this._employee = liveEmployee || s.employee || { id: safeUser.employeeId || 1, fullName: safeUser.username, role: safeUser.role };

          // Keep both storages synchronized
          localStorage.setItem('hrm_session', JSON.stringify({ user: this._user, employee: this._employee }));
          sessionStorage.setItem('hrm_session', JSON.stringify({ user: this._user, employee: this._employee }));
        }
      } catch (e) {
        console.warn('[Auth] Session restore warning:', e);
      }
    }
  },

  login(username, password) {
    // Attempt background API login to synchronize JWT session
    if (typeof API !== 'undefined') {
      API.login(username, password)
        .then(res => {
          if (res.token) API.setToken(res.token);
        })
        .catch(err => console.log('[Auth] API login sync notice:', err.message));
    }

    const users = DB.get('users');
    const matchedUser = users.find(u => u.username === username && u.password === password);
    if (!matchedUser) return { success: false, message: 'Invalid username or password.' };

    const employee = DB.find('employees', matchedUser.employeeId);
    
    // Check if either employee or user is inactive/terminated
    if (matchedUser.status === 'inactive' || (employee && (employee.status === 'inactive' || employee.status === 'terminated'))) {
      return { 
        success: false, 
        message: 'Account Inactive: Your employee profile has been deactivated. Please contact HR Administration.' 
      };
    }

    if (!employee && matchedUser.role !== 'superadmin') {
      return { success: false, message: 'Employee record not found.' };
    }

    // Security: Never store passwords in memory or session storage
    const safeUser = { ...matchedUser };
    delete safeUser.password;

    this._user = safeUser;
    this._employee = employee || { id: 0, fullName: matchedUser.username, role: matchedUser.role };
    if (this.role !== 'superadmin' && this._employee?.companyId && typeof DB !== 'undefined' && DB.setActiveCompanyId) {
      DB.setActiveCompanyId(this._employee.companyId);
    }
    DB.update('users', matchedUser.id, { lastLogin: new Date().toISOString() });
    DB.log('LOGIN', 'Auth', `${this._employee.fullName} logged in`, matchedUser.id);
    sessionStorage.setItem('hrm_session', JSON.stringify({ user: safeUser, employee: this._employee }));
    localStorage.setItem('hrm_session', JSON.stringify({ user: safeUser, employee: this._employee }));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hrm:auth_change', { detail: { action: 'login', user: safeUser, employee: this._employee } }));
    }
    return { success: true };
  },

  logout() {
    if (typeof API !== 'undefined') API.logout();
    DB.log('LOGOUT', 'Auth', `${this._employee?.fullName} logged out`, this._user?.id);
    this._user = null;
    this._employee = null;
    sessionStorage.removeItem('hrm_session');
    localStorage.removeItem('hrm_session');
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hrm:auth_change', { detail: { action: 'logout' } }));
    }
  },

  refreshSession() {
    if (!this.isLoggedIn()) return;
    const currentUserId = this._user?.id;
    const currentEmpId = this._employee?.id;
    if (!currentUserId && !currentEmpId) return;

    const liveUser = currentUserId ? DB.find('users', currentUserId) : null;
    const liveEmployee = currentEmpId ? DB.find('employees', currentEmpId) : null;

    if (!liveUser || liveUser.status === 'inactive' || (liveEmployee && (liveEmployee.status === 'inactive' || liveEmployee.status === 'terminated'))) {
      this.logout();
      if (typeof Toast !== 'undefined') {
        Toast.show('Account Inactive: Your account has been deactivated by HR Administration.', 'danger');
      }
      if (typeof App !== 'undefined' && App.showLogin) {
        App.showLogin();
      }
      return;
    }

    const oldRole = this._user.role;
    const newRole = liveUser.role;
    this._user = liveUser;
    if (liveEmployee) this._employee = liveEmployee;
    sessionStorage.setItem('hrm_session', JSON.stringify({ user: this._user, employee: this._employee }));

    if (oldRole !== newRole) {
      console.log(`[Auth] User role updated remotely from ${oldRole} to ${newRole}`);
      if (typeof App !== 'undefined') {
        App.renderSidebar?.();
        App.renderTopbar?.();
        App.navigate?.(App.currentModule || 'dashboard');
        if (typeof Toast !== 'undefined') {
          Toast.show(`Role Updated: Your access role is now "${newRole}".`, 'info');
        }
      }
    }
  },

  DEMO_PERSONAS: [
    { id: 1, username: 'admin', role: 'superadmin', name: 'Super Administrator', roleLabel: 'Super Admin', icon: 'fa-shield-halved', color: '#6366f1', badge: 'Full Sovereign', description: 'Master administrator with unrestricted access to all 16 modules, master configurations, and cloud databases.' },
    { id: 2, username: 'sara.malik', role: 'hr_manager', name: 'Sara Malik', roleLabel: 'HR Manager', icon: 'fa-user-tie', color: '#10b981', badge: 'HR Operations', description: 'Enterprise HR leadership: payroll processing, lifecycle approvals, quotas, and employee records.' },
    { id: 3, username: 'usman.baig', role: 'dept_manager', name: 'Usman Baig', roleLabel: 'Dept Manager', icon: 'fa-users-gear', color: '#0ea5e9', badge: 'Team Scope', description: 'Department head: team attendance, shift roster swaps, claim endorsements, and headcount requisitions.' },
    { id: 4, username: 'fatima.raza', role: 'employee', name: 'Fatima Raza', roleLabel: 'Regular Employee', icon: 'fa-user', color: '#f59e0b', badge: 'Self-Service', description: 'Standard employee: personal punch clock, leave requests, expense claim lodging, and payslip downloads.' },
    { id: 5, username: 'saad.ibrahim', role: 'onboarding', name: 'Saad Ibrahim', roleLabel: 'Onboarding Hire', icon: 'fa-user-plus', color: '#8b5cf6', badge: 'Induction', description: 'New recruit: onboarding checklists, document uploads, and company handbook verification.' },
    { id: 6, username: 'junior.hr', role: 'hr_manager', name: 'Zain Ali', roleLabel: 'Junior HR (Restricted)', icon: 'fa-user-lock', color: '#ec4899', badge: 'Partial Permissions', description: 'Restricted Junior HR: Can view & apply leaves/attendance, but approvals, salary processing, and quota adjustments are revoked.' },
  ],

  switchPersona(target) {
    const users = DB.get('users') || [];
    const matched = users.find(u => u.username === target || u.id === Number(target) || u.email === target) 
      || this.DEMO_PERSONAS.find(p => p.username === target || p.id === Number(target));
    if (!matched) {
      if (typeof Toast !== 'undefined') Toast.show('Persona not found', 'error');
      return;
    }
    const userInDb = users.find(u => u.username === matched.username || u.id === matched.id) || matched;
    const employee = DB.find('employees', userInDb.employeeId) || { id: userInDb.employeeId || 1, fullName: userInDb.fullName || userInDb.username, role: userInDb.role };
    
    const safeUser = { ...userInDb };
    delete safeUser.password;
    this._user = safeUser;
    this._employee = employee;
    sessionStorage.setItem('hrm_session', JSON.stringify({ user: safeUser, employee }));
    localStorage.setItem('hrm_session', JSON.stringify({ user: safeUser, employee }));
    
    DB.log('SWITCH_PERSONA', 'Auth', `Switched active session to persona '${safeUser.username}' (${safeUser.role})`, safeUser.id);
    
    if (typeof Toast !== 'undefined') {
      Toast.show(`Switched to Persona: ${safeUser.fullName || safeUser.username} (${safeUser.role})`, 'success');
    }

    const dd = document.getElementById('persona-dropdown');
    if (dd) dd.style.display = 'none';

    if (typeof App !== 'undefined') {
      App.renderTopbar();
      App.renderSidebar();
      App.navigate('dashboard', null, true);
    }
  },

  get user() { return this._user; },
  set user(u) { this._user = u; },
  get employee() { return this._employee; },
  set employee(e) { this._employee = e; },
  get role() { return this._role || this._user?.role || null; },
  set role(r) { this._role = r; if (this._user) this._user.role = r; },
  isLoggedIn() { return !!this._user; },

  SCOPES: {
    SELF: 'SELF',
    TEAM: 'TEAM',
    ALL: 'ALL',
    NONE: 'NONE'
  },

  getScope(module) {
    const role = this.role;
    if (!role) return this.SCOPES.NONE;
    if (role === 'superadmin' || role === 'hr_manager') return this.SCOPES.ALL;
    if (role === 'dept_manager') {
      const teamModules = ['dashboard', 'employees', 'attendance', 'leaves', 'performance', 'recruitment', 'reports', 'approvals', 'assets', 'expenses', 'helpdesk'];
      return teamModules.includes(module) ? this.SCOPES.TEAM : this.SCOPES.NONE;
    }
    if (role === 'employee' || role === 'onboarding') {
      const selfModules = ['dashboard', 'profile', 'attendance', 'leaves', 'payroll', 'performance', 'reports', 'assets', 'expenses', 'helpdesk', 'events', 'holidays'];
      return selfModules.includes(module) ? this.SCOPES.SELF : this.SCOPES.NONE;
    }
    return this.SCOPES.NONE;
  },

  getTeamEmployeeIds(managerEmpId, allEmployees) {
    const emps = allEmployees || (typeof DB !== 'undefined' && DB.get ? DB.get('employees') : []) || [];
    const mgrId = Number(managerEmpId || this._employee?.id);
    if (!mgrId) return [];

    const result = new Set([mgrId]);
    let queue = [mgrId];

    while (queue.length > 0) {
      const current = queue.shift();
      emps.forEach(e => {
        if ((e.managerId === current || e.reportingTo === current) && !result.has(e.id)) {
          result.add(e.id);
          queue.push(e.id);
        }
      });
    }
    return Array.from(result);
  },

  getScopedEmployees(allEmployees) {
    const emps = allEmployees || (typeof DB !== 'undefined' && DB.get ? DB.get('employees') : []) || [];
    const role = this.role;
    const userCompanyId = this._employee?.companyId;
    const activeCompanyId = (typeof DB !== 'undefined' && DB.getActiveCompanyId) ? DB.getActiveCompanyId() : 'all';

    if (role === 'superadmin') {
      if (activeCompanyId === 'all') return emps;
      return emps.filter(e => String(e.companyId) === String(activeCompanyId));
    }

    if (role === 'hr_manager') {
      // Subsidiary HR: strictly locked to their assigned employer company
      if (userCompanyId && userCompanyId !== 'all') {
        return emps.filter(e => String(e.companyId) === String(userCompanyId));
      }
      // Group HR Director: respects active company selector or shows all in consolidated view
      if (activeCompanyId === 'all') return emps;
      return emps.filter(e => String(e.companyId) === String(activeCompanyId));
    }

    if (role === 'dept_manager') {
      const teamIds = this.getTeamEmployeeIds(this._employee?.id, emps);
      let teamEmps = emps.filter(e => teamIds.includes(e.id));
      if (userCompanyId && userCompanyId !== 'all') {
        teamEmps = teamEmps.filter(e => String(e.companyId) === String(userCompanyId));
      }
      return teamEmps;
    }

    if (role === 'employee' || role === 'onboarding') {
      const myId = Number(this._employee?.id);
      return emps.filter(e => e.id === myId);
    }
    return [];
  },

  can(permOrAction, maybeMod) {
    if (!this.role) return false;
    if (this.role === 'superadmin') return true;

    // Support both Auth.can('leaves.create') and Auth.can('create', 'leaves') or Auth.can('leaves', 'create')
    let permission = permOrAction;
    if (maybeMod) {
      const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
      if (actions.includes(permOrAction.toLowerCase())) {
        permission = `${maybeMod}.${permOrAction}`;
      } else {
        permission = `${permOrAction}.${maybeMod}`;
      }
    }

    // Direct scope-based granular permission checks
    if (permission.endsWith('_self') || permission.endsWith('.self') || permission.endsWith('.own')) {
      return ['superadmin', 'hr_manager', 'dept_manager', 'employee', 'onboarding'].includes(this.role);
    }
    if (permission.endsWith('_team') || permission.endsWith('.team')) {
      return ['superadmin', 'hr_manager', 'dept_manager'].includes(this.role);
    }
    if (permission.endsWith('_all') || permission.endsWith('.all')) {
      return ['superadmin', 'hr_manager'].includes(this.role);
    }

    // 1. PRIMARY CHECK: Dynamic DB role_permissions from the Permissions Matrix
    try {
      if (typeof DB !== 'undefined' && DB.get) {
        const roles = DB.get('roles') || [];
        const currentRoleObj = roles.find(r => r.code === this.role);
        if (currentRoleObj) {
          if (currentRoleObj.code === 'superadmin') return true;

          const perms = DB.get('permissions') || [];
          const rolePerms = DB.get('role_permissions') || [];
          
          let cleanPerm = permission.toLowerCase().trim();
          // Normalize action synonyms
          cleanPerm = cleanPerm.replace(/\.add$/, '.create');
          cleanPerm = cleanPerm.replace(/\.apply$/, '.create');
          cleanPerm = cleanPerm.replace(/\.manage$/, '.edit');
          cleanPerm = cleanPerm.replace(/\.update$/, '.edit');
          cleanPerm = cleanPerm.replace(/\.remove$/, '.delete');
          cleanPerm = cleanPerm.replace(/\.cancel$/, '.delete');
          cleanPerm = cleanPerm.replace(/\.endorse$/, '.approve');
          cleanPerm = cleanPerm.replace(/\.reject$/, '.approve');

          const candidateCodes = [
            cleanPerm,
            permission,
            cleanPerm.replace(/^expenses\./, 'travel_expenses.'),
            cleanPerm.replace(/^travel_expenses\./, 'expenses.'),
            cleanPerm.replace(/^company\./, 'companies.'),
            cleanPerm.replace(/^companies\./, 'company.'),
            cleanPerm.replace(/^lms\./, 'training.'),
            cleanPerm.replace(/^edms\./, 'documents.')
          ];

          const matchedPerm = perms.find(p => p && typeof p.code === 'string' && candidateCodes.some(c => p.code === c || p.code.startsWith(c + '.') || c.startsWith(p.code)));
          if (matchedPerm) {
            const binding = rolePerms.find(rp => rp.roleId === currentRoleObj.id && rp.permissionId === matchedPerm.id);
            if (binding !== undefined) {
              return !!binding.isGranted;
            }
          }
        }
      }
    } catch (e) {
      // Fall through to fallback rules
    }

    // 2. FALLBACK CHECK: Role-specific action prohibitions if DB permission not defined
    if (this.role === 'employee' || this.role === 'onboarding') {
      const prohibitedForEmployee = [
        'employee.create', 'employee.add', 'employees.add', 'employee.edit', 'employee.delete',
        'payroll.process', 'payroll.generate',
        'settlement.add', 'settlement.edit', 'settlement.delete', 'settlement.recalculate',
        'company.add', 'company.edit', 'company.delete', 'company.transfer',
        'approvals.view', 'approvals.manage',
        'administration', 'settings', '103_model'
      ];
      if (prohibitedForEmployee.some(p => permission === p || permission.startsWith(p + '.'))) {
        return false;
      }
    }

    if (this.role === 'dept_manager') {
      const prohibitedForDeptManager = [
        'payroll.process', 'payroll.generate',
        'settlement.add', 'settlement.edit', 'settlement.delete', 'settlement.recalculate',
        'company.add', 'company.edit', 'company.delete', 'company.transfer',
        'administration', 'settings', '103_model'
      ];
      if (prohibitedForDeptManager.some(p => permission === p || permission.startsWith(p + '.'))) {
        return false;
      }
    }

    const perms = (typeof permissions !== 'undefined' && permissions[this.role]) ? permissions[this.role] : [];
    if (perms.includes('all')) return true;
    return perms.some(p => p === permission || p.startsWith(permission + '.') || permission.startsWith(p));
  },

  isAdmin() {
    return this.role === 'superadmin' || this.role === 'hr_manager';
  },

  canAccessModule(module) {
    // Dynamic DB RBAC check for module view permission
    try {
      if (typeof DB !== 'undefined' && DB.get) {
        const roles = DB.get('roles') || [];
        const currentRoleObj = roles.find(r => r.code === this.role);
        if (currentRoleObj) {
          if (currentRoleObj.code === 'superadmin') return true;

          const moduleCodeMap = {
            expenses: 'travel_expenses',
            company: 'companies',
            lms: 'training',
            edms: 'documents'
          };
          const resolvedCode = moduleCodeMap[module] || module;

          const perms = DB.get('permissions') || [];
          const rolePerms = DB.get('role_permissions') || [];
          const viewPerm = perms.find(p => p.code === `${resolvedCode}.view` || p.code === `${module}.view`);
          if (viewPerm) {
            const binding = rolePerms.find(rp => rp.roleId === currentRoleObj.id && rp.permissionId === viewPerm.id);
            if (binding !== undefined) {
              return !!binding.isGranted;
            }
          }
        }
      }
    } catch (e) {
      // Fall through
    }

    const moduleMap = {
      superadmin: ['dashboard','chat','employees','attendance','leaves','payroll','settlement','companies','performance','recruitment','assets','expenses','helpdesk','events','reports','administration','settings','backup','training','documents','shifts'],
      hr_manager: ['dashboard','chat','employees','attendance','leaves','payroll','settlement','performance','recruitment','assets','expenses','helpdesk','events','reports','administration','training','documents','shifts'],
      dept_manager: ['dashboard','chat','employees','attendance','leaves','payroll','settlement','performance','recruitment','assets','expenses','helpdesk','events','reports','training','documents','shifts'],
      employee: ['dashboard','chat','attendance','leaves','payroll','settlement','profile','performance','assets','expenses','helpdesk','events','holidays','reports','training','documents','shifts'],
      onboarding: ['dashboard','chat','profile','attendance','leaves','events','holidays','training','documents'],
    };
    return (moduleMap[this.role] || []).includes(module);
  },

  getSidebarItems() {
    const all = [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'profile', label: 'My Profile & Onboarding', icon: 'fa-id-card-clip', roles: ['onboarding'] },
      { id: 'employees', label: 'Employees & e-DMS', icon: 'fa-users', roles: ['superadmin','hr_manager','dept_manager'] },
      { id: 'attendance', label: 'Attendance & Shifts', icon: 'fa-clock', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'leaves', label: 'Leaves', icon: 'fa-calendar-xmark', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'payroll', label: 'Payroll & Taxes', icon: 'fa-money-bill-wave', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'performance', label: 'Performance & OKRs', icon: 'fa-chart-line', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'recruitment', label: 'Recruitment (ATS)', icon: 'fa-briefcase', roles: ['superadmin','hr_manager','dept_manager'] },
      { id: 'assets', label: 'Assets & Inventory', icon: 'fa-laptop-file', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'expenses', label: 'Expense Claims', icon: 'fa-receipt', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'helpdesk', label: 'Helpdesk & Grievance', icon: 'fa-headset', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'reports', label: 'Reports & Analytics', icon: 'fa-file-chart-column', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'administration', label: 'Administration', icon: 'fa-gear', roles: ['superadmin','hr_manager'] },
    ];
    return all.filter(item => {
      // Must be allowed for role and have view access
      if (!item.roles.includes(this.role)) return false;
      return this.canAccessModule(item.id);
    });
  },

  getDemoAccounts() {
    return [
      { username: 'admin', password: 'admin123', role: 'Super Admin', name: 'Ahmed Khan', icon: 'fa-crown', color: '#f59e0b' },
      { username: 'sara.malik', password: 'hr123', role: 'HR Manager', name: 'Sara Malik', icon: 'fa-user-tie', color: '#6366f1' },
      { username: 'usman.baig', password: 'mgr123', role: 'Dept Manager', name: 'Usman Baig', icon: 'fa-users-gear', color: '#14b8a6' },
      { username: 'fatima.raza', password: 'emp123', role: 'Employee', name: 'Fatima Raza', icon: 'fa-user', color: '#ec4899' },
    ];
  },

  // ─── Dynamic Feature & Option Visibility Engine ───
  canSeeFeature(featureKey, fallbackModule = null) {
    if (this.role === 'superadmin') return true;

    try {
      if (typeof DB !== 'undefined' && DB.get) {
        // 1. Direct User / Login Override
        const userId = this.user?.id;
        if (userId) {
          const userOverrides = DB.get('user_feature_access') || [];
          const userRule = userOverrides.find(r => r.userId === userId && r.featureKey === featureKey);
          if (userRule && typeof userRule.visible === 'boolean') {
            return userRule.visible;
          }
        }

        // 2. Role-based Feature Access
        const roleOverrides = DB.get('role_feature_access') || [];
        const roleRule = roleOverrides.find(r => (r.role === this.role || r.roleId === this.user?.roleId) && r.featureKey === featureKey);
        if (roleRule && typeof roleRule.visible === 'boolean') {
          return roleRule.visible;
        }

        // 3. Fallback to FEATURE_CATALOG defaultRoles
        const catalog = Auth.FEATURE_CATALOG || window.FEATURE_CATALOG || [];
        for (const m of catalog) {
          const f = m.features.find(feat => feat.key === featureKey);
          if (f && Array.isArray(f.defaultRoles)) {
            return f.defaultRoles.includes(this.role);
          }
        }
      }
    } catch (e) {
      console.warn('Feature visibility lookup error:', e);
    }

    // 4. Fallback to Action-based Auth.can
    if (featureKey && featureKey.includes('.')) {
      const parts = featureKey.split('.');
      const mod = parts[0];
      const feat = parts[1];
      if (['create', 'apply_form', 'submit'].includes(feat)) return this.can(mod, 'create');
      if (['approve', 'approvals'].includes(feat)) return this.can(mod, 'approve');
      if (['export'].includes(feat)) return this.can(mod, 'export');
      if (['delete'].includes(feat)) return this.can(mod, 'delete');
    }

    return true;
  }
};

Auth.FEATURE_CATALOG = [
  {
    moduleCode: 'leaves',
    moduleName: 'Leave Management',
    moduleIcon: 'fa-calendar-xmark',
    features: [
      { key: 'leaves.requests', name: 'Leave Requests & History Ledger', desc: 'View submitted leave applications and personal/team leave status', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'leaves.apply_form', name: 'Apply Leave Button & Form', desc: 'Display "Apply Leave" button and allow submitting leave applications', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'leaves.approvals', name: 'Approval & Rejection Actions', desc: 'Show Approve/Reject buttons on leave requests and permit decision-making', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'leaves.calendar', name: 'Team Leave Calendar Tab', desc: 'Display interactive team absence schedule and holiday dates', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'leaves.quota', name: 'Annual Quota & Balances Matrix Tab', desc: 'Display employee leave quotas, annual entitlements, and balance allocations', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'leaves.tokens', name: 'Short Leave & Emergency Tokens Tab', desc: 'Allow employees and managers to request and track hourly emergency tokens', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'leaves.encashment', name: 'Leave Encashment & Cashouts Tab', desc: 'Permit unutilized leave encashment calculations and payout claims', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'leaves.export', name: 'Export Quotas & History (CSV)', desc: 'Show CSV/Excel export buttons for leave data', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] }
    ]
  },
  {
    moduleCode: 'attendance',
    moduleName: 'Attendance & Rostering',
    moduleIcon: 'fa-clock',
    features: [
      { key: 'attendance.clock_in', name: 'Web Clock-In / Clock-Out Punch', desc: 'Display interactive punch in/out buttons for logging work hours', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'attendance.daily', name: 'Daily Attendance Register Tab', desc: 'Show real-time daily team attendance register and status cards', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'attendance.monthly', name: 'Monthly Timesheets & Overtime Tab', desc: 'Display monthly time cards, late arrivals, and overtime calculations', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'attendance.shifts', name: 'Shift Rostering & Swaps Tab', desc: 'Display shift scheduling calendar and team shift swap requests', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'attendance.corrections', name: 'Attendance Correction Requests Tab', desc: 'Permit submitting and approving missed punch correction requests', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'attendance.biometric', name: 'Biometric Machine Logs & Telemetry Tab', desc: 'View raw device punch logs and biometric terminal statuses', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'attendance.export', name: 'Export Attendance & Rosters (CSV)', desc: 'Show Export buttons for attendance registers and roster schedules', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] }
    ]
  },
  {
    moduleCode: 'payroll',
    moduleName: 'Payroll & Compensation',
    moduleIcon: 'fa-money-bill-wave',
    features: [
      { key: 'payroll.run', name: 'Run & Process Payroll Wizard', desc: 'Execute monthly payroll batch runs and gross-to-net calculations', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'payroll.register', name: 'Payroll Register & Salary Sheets Tab', desc: 'View complete company salary breakdowns and disbursement status', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'payroll.tax_slabs', name: 'Statutory Income Tax Slabs Tab', desc: 'Access progressive tax brackets, exemptions, and tax calculation formulas', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'payroll.bank_formats', name: 'Bank Transfer File Generator Tab', desc: 'Generate bank-specific direct transfer files (HBL, MCB, UBL, Meezan)', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'payroll.payslips', name: 'My Payslips & PDF Viewer Tab', desc: 'Permit employee to view, download, and print salary payslips', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'payroll.export', name: 'Export Payroll & Tax Reports (CSV)', desc: 'Export salary registers, bank sheets, and tax deductions to CSV', defaultRoles: ['superadmin', 'hr_manager'] }
    ]
  },
  {
    moduleCode: 'expenses',
    moduleName: 'Travel & Expense Reimbursements',
    moduleIcon: 'fa-plane-departure',
    features: [
      { key: 'expenses.submit', name: 'Submit Expense Claim Button & Modal', desc: 'Allow user to upload receipts and submit out-of-pocket expenses', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'expenses.claims_list', name: 'Expense Claims History Tab', desc: 'View personal or departmental submitted expense claims', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'expenses.approvals', name: 'Approvals & Audit Queue Tab', desc: 'Show manager/finance review queue to approve or reject vouchers', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'expenses.travel_requests', name: 'Travel Requisitions & Advance Tab', desc: 'Permit filing and approving business travel travel requests', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'expenses.payroll_sync', name: '1-Click Sync to Payroll', desc: 'Allow pushing approved claims into payroll disbursement ledger', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'expenses.export', name: 'Export Expense Vouchers (CSV)', desc: 'Export claim audit sheets and disbursement files', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] }
    ]
  },
  {
    moduleCode: 'performance',
    moduleName: 'Performance & Appraisal',
    moduleIcon: 'fa-chart-line',
    features: [
      { key: 'performance.cycles', name: 'Appraisal Cycles Setup Tab', desc: 'Create and configure organizational appraisal cycles and deadlines', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'performance.goals', name: 'Goals & OKRs Management Tab', desc: 'Set, track, and align individual and departmental OKR targets', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'performance.kpi', name: 'KPI Metrics Catalog Tab', desc: 'View and manage organizational key performance indicator library', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'performance.reviews', name: 'Performance Reviews & Sign-offs Tab', desc: 'Conduct manager evaluations and employee self-assessments', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'performance.feedback360', name: '360° Peer Feedback Tab', desc: 'Gather anonymous peer reviews and cross-functional feedback', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'performance.merit', name: 'Merit Increment Matrix Tab', desc: 'Calculate merit salary increases based on appraisal scores', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'performance.succession', name: '9-Box Grid & Succession Planning Tab', desc: 'Access 9-box performance vs potential talent mapping', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'performance.lms', name: 'LMS & Competency Skill Matrix Tab', desc: 'Track employee training certifications and skill competencies', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] }
    ]
  },
  {
    moduleCode: 'recruitment',
    moduleName: 'Recruitment & ATS',
    moduleIcon: 'fa-briefcase',
    features: [
      { key: 'recruitment.jobs', name: 'Job Openings & Postings Tab', desc: 'Create and manage active career postings and descriptions', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'recruitment.pipeline', name: 'Applicant Pipeline & Kanban Tab', desc: 'View candidate applications across interview pipeline stages', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'recruitment.requisitions', name: 'Headcount Requisitions Tab', desc: 'Submit and approve new hiring headcount requests', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'recruitment.assessments', name: 'Screening & Interview Scorecards Tab', desc: 'Score candidates and record structured interview feedback', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'recruitment.offers', name: 'Offer Letters & Onboarding Tab', desc: 'Generate and send official compensation offer letters', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'recruitment.export', name: 'Export Candidate Data (CSV)', desc: 'Export applicant rosters and recruitment metrics', defaultRoles: ['superadmin', 'hr_manager'] }
    ]
  },
  {
    moduleCode: 'assets',
    moduleName: 'Corporate Asset Inventory',
    moduleIcon: 'fa-laptop-file',
    features: [
      { key: 'assets.register', name: 'Register Asset Button & Form', desc: 'Add new hardware devices, laptops, and equipment to the register', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'assets.catalog', name: 'Hardware Register & Catalog Tab', desc: 'Browse full company inventory with serials, specs, and status', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'assets.custody', name: 'Custody & Handover Ledger Tab', desc: 'Check-out equipment and record signed employee custody undertakings', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'assets.maintenance', name: 'Maintenance & Warranty Radar Tab', desc: 'Track repair service tickets and expiring hardware warranties', defaultRoles: ['superadmin', 'hr_manager', 'employee'] },
      { key: 'assets.returns', name: 'Return Clearances & Depreciation Tab', desc: 'Process exit asset handovers and calculate asset depreciation', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'assets.export', name: 'Export Asset Inventory (CSV)', desc: 'Export full hardware asset register to CSV spreadsheet', defaultRoles: ['superadmin', 'hr_manager'] }
    ]
  },
  {
    moduleCode: 'settlement',
    moduleName: 'Exit & Settlements (F&F)',
    moduleIcon: 'fa-handshake-simple',
    features: [
      { key: 'settlement.register', name: 'Settlement Register & Status Tab', desc: 'View active separation cases and full-and-final settlement status', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'settlement.initiate', name: 'Initiate Settlement Button & Modal', desc: 'Submit resignation notice or initiate administrative separation', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'settlement.clearances', name: 'Multi-Gate Department Clearances Tab', desc: 'Departmental sign-offs (HR, IT, Finance, Admin) before final payout', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'settlement.gratuity', name: 'Statutory Gratuity & Encashment Engine', desc: 'Calculate legal gratuity (30/26 formula), notice pay, and deductions', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'settlement.export', name: 'Export Settlement Vouchers (CSV)', desc: 'Export final discharge vouchers and payment advice sheets', defaultRoles: ['superadmin', 'hr_manager'] }
    ]
  },
  {
    moduleCode: 'helpdesk',
    moduleName: 'Helpdesk & Grievance Redressal',
    moduleIcon: 'fa-headset',
    features: [
      { key: 'helpdesk.tickets', name: 'Support Tickets Ledger Tab', desc: 'View internal support tickets and status updates', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'helpdesk.create', name: 'Open Support Ticket Button', desc: 'Permit submitting IT support, HR inquiry, or facility tickets', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'helpdesk.grievance', name: 'File Confidential Grievance Button', desc: 'Submit protected anonymous whistleblower or harassment complaints', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'helpdesk.kb', name: 'Knowledge Base & FAQs Tab', desc: 'Browse company policies, IT setup guides, and self-help articles', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] }
    ]
  },
  {
    moduleCode: 'employees',
    moduleName: 'Personnel & Employee Dossiers',
    moduleIcon: 'fa-users',
    features: [
      { key: 'employees.directory', name: 'Employee Directory & Cards', desc: 'Search and browse active personnel rosters and contact cards', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'employees.create', name: 'Add New Employee Button & Wizard', desc: 'Onboard new hire and create digital personnel file', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'employees.org_chart', name: 'Visual Org Chart & Reporting Line Tab', desc: 'Interactive hierarchical tree and departmental reporting structure', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'employees.documents', name: 'Digital Document Vault (e-DMS) Tab', desc: 'Manage CNIC, degrees, contracts, and employment letters', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'employees.export', name: 'Export Personnel Directory (CSV)', desc: 'Export complete employee master data file to CSV', defaultRoles: ['superadmin', 'hr_manager'] }
    ]
  },
  {
    moduleCode: 'events',
    moduleName: 'Company Events & Holidays',
    moduleIcon: 'fa-calendar-days',
    features: [
      { key: 'events.calendar', name: 'Events Calendar View', desc: 'View corporate events, town halls, trainings, and team outings', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'events.create', name: 'Create Event Button & Modal', desc: 'Schedule and publish company-wide or departmental events', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'events.holidays', name: 'Public & Gazetted Holidays List', desc: 'View official recognized public and religious holiday list', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] }
    ]
  },
  {
    moduleCode: 'reports',
    moduleName: 'Executive Analytics & Reports',
    moduleIcon: 'fa-file-chart-column',
    features: [
      { key: 'reports.headcount', name: 'Headcount & Turnover Analytics', desc: 'Executive demographic graphs, attrition rates, and hiring velocity', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'reports.attendance_summary', name: 'Attendance & Punctuality Reports', desc: 'Monthly punctuality trends, late minutes, and absenteeism radar', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'reports.payroll_summary', name: 'Payroll & Cost Center Analytics', desc: 'Departmental salary expenditure, tax withholdings, and overtime costs', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'reports.leave_utilization', name: 'Leave Utilization & Liability Reports', desc: 'Annual leave consumption patterns and financial liability analysis', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager'] },
      { key: 'reports.export', name: 'Export Executive Reports (PDF/CSV)', desc: 'Download printable executive dashboards and analytical raw data', defaultRoles: ['superadmin', 'hr_manager'] }
    ]
  },
  {
    moduleCode: 'dashboard',
    moduleName: 'Executive Dashboard & Quick Stats',
    moduleIcon: 'fa-gauge-high',
    features: [
      { key: 'dashboard.kpi_cards', name: 'Executive Workforce KPI Metric Cards', desc: 'Real-time counters for headcount, active workforce, and department breakdown', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'dashboard.attendance_widget', name: 'Daily Attendance Punch & Status Widget', desc: 'Clock-in card, shift countdown timer, and daily punctuality stats', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'dashboard.leaves_widget', name: 'Available Leave Balances Radar', desc: 'Casual, annual, and medical leave quota summary meters', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'dashboard.announcements', name: 'Corporate Broadcasts & Announcements', desc: 'Company-wide bulletin board notices and circulars', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] }
    ]
  },
  {
    moduleCode: 'companies',
    moduleName: 'Corporate Entities & Subsidiaries',
    moduleIcon: 'fa-building-shield',
    features: [
      { key: 'companies.view', name: 'Corporate Entities Directory Tab', desc: 'View registered legal corporate entities, NTNs, and branches', defaultRoles: ['superadmin'] },
      { key: 'companies.create', name: 'Add Corporate Entity Button & Form', desc: 'Register new corporate subsidiary or regional company', defaultRoles: ['superadmin'] },
      { key: 'companies.export', name: 'Export Legal Entities Data', desc: 'Export corporate registry to CSV spreadsheet', defaultRoles: ['superadmin'] }
    ]
  },
  {
    moduleCode: 'chat',
    moduleName: 'Enterprise Team Chat & Channels',
    moduleIcon: 'fa-comments',
    features: [
      { key: 'chat.messaging', name: 'Direct & Channel Chat Messaging', desc: 'Real-time peer messaging and department collaboration channels', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] },
      { key: 'chat.attachments', name: 'File & Document Sharing in Chat', desc: 'Allow uploading and sending documents/images in chat rooms', defaultRoles: ['superadmin', 'hr_manager', 'dept_manager', 'employee'] }
    ]
  },
  {
    moduleCode: 'administration',
    moduleName: 'System Administration & Governance',
    moduleIcon: 'fa-gear',
    features: [
      { key: 'administration.users', name: 'User Management & Provisioning', desc: 'Create, lock, and manage employee login credentials and passwords', defaultRoles: ['superadmin', 'hr_manager'] },
      { key: 'administration.audit_logs', name: 'System Security Audit Trail Logs', desc: 'Review immutable compliance logs of system mutations and logins', defaultRoles: ['superadmin'] },
      { key: 'administration.db_backup', name: 'Database Maintenance & Snapshots', desc: 'Download system backups and run database integrity health checks', defaultRoles: ['superadmin'] }
    ]
  }
];

window.Auth = Auth;
window.FEATURE_CATALOG = Auth.FEATURE_CATALOG;
