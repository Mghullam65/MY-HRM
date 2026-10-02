// ============================================================
// HRM SYSTEM — REST API & Database Client
// ============================================================

const API = {
  // Config: automatically uses relative path when hosted from the Express server,
  // or defaults to localhost:5000 when opened directly via file://
  baseUrl: (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ? '/api'
    : 'http://localhost:5000/api',

  // Store & retrieve JWT session token
  getToken() {
    return localStorage.getItem('hrm_jwt_token') || sessionStorage.getItem('hrm_jwt_token') || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('hrm_jwt_token', token);
      sessionStorage.setItem('hrm_jwt_token', token);
    } else {
      localStorage.removeItem('hrm_jwt_token');
      sessionStorage.removeItem('hrm_jwt_token');
    }
  },

  _warnedEndpoints: {},

  // Central fetch wrapper with auth header and error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      // If network fails (e.g. backend server is not running on static hosting), log once per endpoint and throw
      const baseKey = endpoint.split('?')[0];
      if (!this._warnedEndpoints[baseKey]) {
        this._warnedEndpoints[baseKey] = true;
        console.info(`[API] Endpoint ${baseKey} unavailable (${err.message}). Using autonomous client store.`);
      }
      throw err;
    }
  },

  // Check if backend database API is alive
  async checkHealth() {
    try {
      const res = await this.request('/health');
      return res.status === 'ok';
    } catch {
      return false;
    }
  },

  // Auth APIs
  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token) this.setToken(res.token);
    return res;
  },

  async getCurrentUser() {
    return this.request('/auth/me');
  },

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  logout() {
    this.setToken(null);
  },

  // Employees APIs
  async getEmployees(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/employees${query ? '?' + query : ''}`);
  },

  async getEmployee(id) {
    return this.request(`/employees/${id}`);
  },

  async createEmployee(data) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateEmployee(id, data) {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteEmployee(id) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE'
    });
  },

  // Attendance APIs
  async getAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/attendance${query ? '?' + query : ''}`);
  },

  async getAttendanceSummary() {
    return this.request('/attendance/today-summary');
  },

  async punch(employeeId) {
    const currentEmpId = (typeof Auth !== 'undefined' && (Auth.employee?.id || Auth.user?.employeeId)) || null;
    let targetEmpId = employeeId || currentEmpId;
    // Prevent IDOR: standard employees cannot punch on behalf of other staff
    if (typeof Auth !== 'undefined' && (Auth.role === 'employee' || Auth.role === 'onboarding')) {
      targetEmpId = currentEmpId;
    }
    return this.request('/attendance/punch', {
      method: 'POST',
      body: JSON.stringify({ employeeId: targetEmpId })
    });
  },

  // Leaves APIs
  async getLeaveBalances(employeeId, year) {
    const params = {};
    if (employeeId) params.employeeId = employeeId;
    if (year) params.year = year;
    const query = new URLSearchParams(params).toString();
    return this.request(`/leaves/balances${query ? '?' + query : ''}`);
  },

  async getLeaveRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/leaves/requests${query ? '?' + query : ''}`);
  },

  async applyLeave(data) {
    return this.request('/leaves/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateLeaveStatus(id, status, rejectionReason) {
    return this.request(`/leaves/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionReason })
    });
  },

  // Payroll APIs
  async getPayroll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/payroll${query ? '?' + query : ''}`);
  },

  async generatePayroll(month, year) {
    return this.request('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify({ month, year })
    });
  },

  async updatePayrollStatus(id, paymentStatus, paymentMethod) {
    return this.request(`/payroll/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus, paymentMethod })
    });
  },

  // Organization & Admin APIs
  async getOrgStructure() {
    return this.request('/admin/structure');
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/audit-logs${query ? '?' + query : ''}`);
  },

  // Live Notifications APIs
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/notifications${query ? '?' + query : ''}`);
  },

  async pollNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/notifications/poll${query ? '?' + query : ''}`);
  },

  async createNotification(data) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  async markAllNotificationsRead(data = {}) {
    return this.request('/notifications/read-all', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Central Database Sync APIs
  async syncGetAll() {
    return this.request('/sync/all');
  },

  async syncGetVersion() {
    return this.request('/sync/version');
  },

  async syncGetTables(names = []) {
    const query = new URLSearchParams({ names: names.join(',') }).toString();
    return this.request(`/sync/tables?${query}`);
  },

  async syncSetTable(table, data, clientId = null) {
    return this.request('/sync/set', {
      method: 'POST',
      body: JSON.stringify({ table, data, clientId })
    });
  },

  async syncBatch(tables = {}, clientId = null) {
    return this.request('/sync/batch', {
      method: 'POST',
      body: JSON.stringify({ tables, clientId })
    });
  }
};

window.API = API;
