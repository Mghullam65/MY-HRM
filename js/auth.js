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
        this._user = s.user;
        this._employee = s.employee;
      } catch { this._user = null; }
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
    const user = users.find(u => u.username === username && u.password === password && u.status === 'active');
    if (!user) return { success: false, message: 'Invalid username or password.' };
    const employee = DB.find('employees', user.employeeId);
    if (!employee) return { success: false, message: 'Employee record not found.' };
    this._user = user;
    this._employee = employee;
    DB.update('users', user.id, { lastLogin: new Date().toISOString() });
    DB.log('LOGIN', 'Auth', `${employee.fullName} logged in`, user.id);
    sessionStorage.setItem('hrm_session', JSON.stringify({ user, employee }));
    return { success: true };
  },

  logout() {
    if (typeof API !== 'undefined') API.logout();
    DB.log('LOGOUT', 'Auth', `${this._employee?.fullName} logged out`, this._user?.id);
    this._user = null;
    this._employee = null;
    sessionStorage.removeItem('hrm_session');
  },

  get user() { return this._user; },
  get employee() { return this._employee; },
  get role() { return this._user?.role || null; },
  get isLoggedIn() { return !!this._user; },

  can(permission) {
    if (!this.role) return false;
    const perms = permissions[this.role] || [];
    if (perms.includes('all')) return true;
    return perms.some(p => p === permission || p.startsWith(permission + '.') || permission.startsWith(p));
  },

  canAccessModule(module) {
    const isHrOrAdmin = this.role === 'superadmin' || this.role === 'hr_manager';
    const myId = this.employee?.id;
    const emps = typeof DB !== 'undefined' ? (DB.get('employees') || []) : [];
    const hasReportees = emps.some(e => e.reportingTo === myId || e.managerId === myId);

    if (module === 'employees') {
      return isHrOrAdmin || hasReportees;
    }

    const moduleMap = {
      superadmin: ['dashboard','employees','attendance','leaves','payroll','performance','recruitment','events','reports','administration','settings','backup'],
      hr_manager: ['dashboard','employees','attendance','leaves','payroll','performance','recruitment','events','reports','administration'],
      dept_manager: ['dashboard','employees','attendance','leaves','performance','events','reports'],
      employee: ['dashboard','attendance','leaves','payroll','profile','performance','events','holidays','reports'],
      onboarding: ['dashboard','profile','attendance','leaves','events','holidays'],
    };
    return (moduleMap[this.role] || []).includes(module);
  },

  getSidebarItems() {
    const isHrOrAdmin = this.role === 'superadmin' || this.role === 'hr_manager';
    const myId = this.employee?.id;
    const emps = typeof DB !== 'undefined' ? (DB.get('employees') || []) : [];
    const hasReportees = emps.some(e => e.reportingTo === myId || e.managerId === myId);

    const all = [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'profile', label: 'My Profile & Onboarding', icon: 'fa-id-card-clip', roles: ['onboarding'] },
      { 
        id: 'employees', 
        label: isHrOrAdmin ? 'Employees' : 'My Direct Reports', 
        icon: isHrOrAdmin ? 'fa-users' : 'fa-users-line', 
        roles: ['superadmin','hr_manager','dept_manager','employee'],
        hide: !isHrOrAdmin && !hasReportees
      },
      { id: 'attendance', label: 'Attendance', icon: 'fa-clock', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'leaves', label: 'Leaves', icon: 'fa-calendar-xmark', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'payroll', label: 'Payroll', icon: 'fa-money-bill-wave', roles: ['superadmin','hr_manager','employee'] },
      { id: 'performance', label: 'Performance', icon: 'fa-chart-line', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'recruitment', label: 'Recruitment', icon: 'fa-briefcase', roles: ['superadmin','hr_manager'] },
      { id: 'events', label: 'Events', icon: 'fa-calendar-days', roles: ['superadmin','hr_manager','dept_manager','employee','onboarding'] },
      { id: 'reports', label: 'Reports', icon: 'fa-file-chart-column', roles: ['superadmin','hr_manager','dept_manager','employee'] },
      { id: 'administration', label: 'Administration', icon: 'fa-gear', roles: ['superadmin','hr_manager'] },
      { id: 'settings', label: 'Settings', icon: 'fa-sliders', roles: ['superadmin'] },
    ];
    return all.filter(item => item.roles.includes(this.role) && !item.hide);
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
