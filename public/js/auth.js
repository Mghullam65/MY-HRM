// ============================================================
// HRM SYSTEM — Authentication & Role Management
// ============================================================

const Auth = {
  _user: null,
  _employee: null,

  init() {
    const saved = sessionStorage.getItem('hrm_session');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        // Verify user and employee still exist and are active in live DB
        const liveUser = s.user ? DB.find('users', s.user.id) : null;
        const liveEmployee = s.employee ? DB.find('employees', s.employee.id) : null;
        
        if (!liveUser || liveUser.status === 'inactive' || (liveEmployee && (liveEmployee.status === 'inactive' || liveEmployee.status === 'terminated'))) {
          this._user = null;
          this._employee = null;
          sessionStorage.removeItem('hrm_session');
          return;
        }
        const safeUser = liveUser ? { ...liveUser } : (s.user ? { ...s.user } : null);
        if (safeUser && safeUser.password) delete safeUser.password;

        this._user = safeUser;
        this._employee = liveEmployee || s.employee;
      } catch { 
        this._user = null; 
        this._employee = null; 
        sessionStorage.removeItem('hrm_session');
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
    DB.update('users', matchedUser.id, { lastLogin: new Date().toISOString() });
    DB.log('LOGIN', 'Auth', `${this._employee.fullName} logged in`, matchedUser.id);
    sessionStorage.setItem('hrm_session', JSON.stringify({ user: safeUser, employee: this._employee }));
    return { success: true };
  },

  logout() {
    if (typeof API !== 'undefined') API.logout();
    DB.log('LOGOUT', 'Auth', `${this._employee?.fullName} logged out`, this._user?.id);
    this._user = null;
    this._employee = null;
    sessionStorage.removeItem('hrm_session');
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

    if (role === 'superadmin' || role === 'hr_manager') {
      return emps;
    }
    if (role === 'dept_manager') {
      const teamIds = this.getTeamEmployeeIds(this._employee?.id, emps);
      return emps.filter(e => teamIds.includes(e.id));
    }
    if (role === 'employee' || role === 'onboarding') {
      const myId = Number(this._employee?.id);
      return emps.filter(e => e.id === myId);
    }
    return [];
  },

  can(permission) {
    if (!this.role) return false;
    if (this.role === 'superadmin') return true;

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

    // Role-specific action prohibitions
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

    // Check dynamic DB role_permissions first if available
    try {
      if (typeof DB !== 'undefined' && DB.get) {
        const roles = DB.get('roles') || [];
        const currentRoleObj = roles.find(r => r.code === this.role);
        if (currentRoleObj) {
          const perms = DB.get('permissions') || [];
          const rolePerms = DB.get('role_permissions') || [];
          const matchedPerm = perms.find(p => p.code === permission || p.code.startsWith(permission + '.') || permission.startsWith(p.code));
          if (matchedPerm) {
            const binding = rolePerms.find(rp => rp.roleId === currentRoleObj.id && rp.permissionId === matchedPerm.id);
            if (binding !== undefined) {
              return !!binding.isGranted;
            }
          }
        }
      }
    } catch (e) {
      // Fall through to static permissions
    }

    const perms = (typeof permissions !== 'undefined' && permissions[this.role]) ? permissions[this.role] : [];
    if (perms.includes('all')) return true;
    return perms.some(p => p === permission || p.startsWith(permission + '.') || permission.startsWith(p));
  },

  isAdmin() {
    return this.role === 'superadmin' || this.role === 'hr_manager';
  },

  canAccessModule(module) {
    const moduleMap = {
      superadmin: ['dashboard','employees','attendance','leaves','payroll','settlement','companies','performance','recruitment','assets','expenses','helpdesk','events','reports','administration','settings','backup'],
      hr_manager: ['dashboard','employees','attendance','leaves','payroll','settlement','performance','recruitment','assets','expenses','helpdesk','events','reports','administration'],
      dept_manager: ['dashboard','employees','attendance','leaves','payroll','settlement','performance','recruitment','assets','expenses','helpdesk','events','reports'],
      employee: ['dashboard','attendance','leaves','payroll','settlement','profile','performance','assets','expenses','helpdesk','events','holidays','reports'],
      onboarding: ['dashboard','profile','attendance','leaves','events','holidays'],
    };
    return (moduleMap[this.role] || []).includes(module);
  },

  getSidebarItems() {
    const all = [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'profile', label: 'My Profile & Onboarding', icon: 'fa-id-card-clip', roles: ['onboarding'] },
      { id: 'employees', label: 'Employees', icon: 'fa-users', roles: ['superadmin','hr_manager','dept_manager'] },
      { id: 'attendance', label: 'Attendance', icon: 'fa-clock', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'leaves', label: 'Leaves', icon: 'fa-calendar-xmark', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'payroll', label: 'Payroll', icon: 'fa-money-bill-wave', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'settlement', label: 'Exit & Settlements', icon: 'fa-file-invoice-dollar', roles: ['superadmin','hr_manager','dept_manager'] },
      { id: 'companies', label: 'Corporate Entities', icon: 'fa-building-shield', roles: ['superadmin'] },
      { id: 'performance', label: 'Performance', icon: 'fa-chart-line', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'recruitment', label: 'Recruitment', icon: 'fa-briefcase', roles: ['superadmin','hr_manager','dept_manager'] },
      { id: 'assets', label: 'Assets & Inventory', icon: 'fa-laptop-file', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'expenses', label: 'Expense Claims', icon: 'fa-receipt', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'helpdesk', label: 'Helpdesk & Grievance', icon: 'fa-headset', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'events', label: 'Events', icon: 'fa-calendar-days', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'reports', label: 'Reports', icon: 'fa-file-chart-column', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'administration', label: 'Administration', icon: 'fa-gear', roles: ['superadmin','hr_manager'] },
      { id: 'settings', label: 'Settings', icon: 'fa-sliders', roles: ['superadmin'] },
    ];
    return all.filter(item => item.roles.includes(this.role));
  },

  getDemoAccounts() {
    return [
      { username: 'admin', password: 'admin123', role: 'Super Admin', name: 'Ahmed Khan', icon: 'fa-crown', color: '#f59e0b' },
      { username: 'sara.malik', password: 'hr123', role: 'HR Manager', name: 'Sara Malik', icon: 'fa-user-tie', color: '#6366f1' },
      { username: 'usman.baig', password: 'mgr123', role: 'Dept Manager', name: 'Usman Baig', icon: 'fa-users-gear', color: '#14b8a6' },
      { username: 'fatima.raza', password: 'emp123', role: 'Employee', name: 'Fatima Raza', icon: 'fa-user', color: '#ec4899' },
    ];
  }
};

window.Auth = Auth;
