// ============================================================
// HRM SYSTEM — Email Notifier Client (Frontend)
// Fire-and-forget transactional email dispatcher
// Calls the backend /api/email/* endpoints.
// If the backend is offline or SMTP is unconfigured, emails are
// silently archived to disk and the UI continues without blocking.
// ============================================================

const EmailNotifier = (() => {
  // ─── Configuration ────────────────────────────────────────
  const BASE_URL = (() => {
    // Auto-detect server URL
    if (typeof window !== 'undefined') {
      const port = window._HRM_API_PORT || 5000;
      return `http://${window.location.hostname}:${port}/api/email`;
    }
    return 'http://localhost:5000/api/email';
  })();

  // ─── Read SMTP settings from localStorage (saved in Settings) ──
  function _getSmtp() {
    try {
      const settings = JSON.parse(localStorage.getItem('hrm_settings') || '{}');
      return {
        smtpHost: settings.smtpHost || '',
        smtpUser: settings.smtpUser || '',
        smtpPass: settings.smtpPass || '',
        smtpPort: settings.smtpPort || '587',
        smtpSecure: settings.smtpSecure || false,
        smtpFrom: settings.smtpFrom || ''
      };
    } catch (e) {
      return {};
    }
  }

  // ─── Read per-trigger toggles from settings ────────────────
  function _isEnabled(triggerKey) {
    try {
      const settings = JSON.parse(localStorage.getItem('hrm_settings') || '{}');
      // Default all triggers ON unless explicitly set to false
      return settings[triggerKey] !== false;
    } catch (e) {
      return true;
    }
  }

  // ─── Core HTTP sender (non-blocking, fire-and-forget) ──────
  async function _send(endpoint, payload) {
    const smtp = _getSmtp();
    const body = { ...payload, ...smtp };

    try {
      const resp = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // Short timeout — fire and forget, don't block UI
        signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
      });

      const data = await resp.json();
      if (data.success) {
        const providerMsg = data.isRealSmtp
          ? `📧 Email sent via ${data.provider}`
          : `📧 Email queued (SMTP not configured — archived to server)`;
        console.log(`[EmailNotifier] ✅ ${endpoint}: ${providerMsg}. Recipients: ${(data.recipients || []).join(', ')}`);

        // Show subtle non-blocking toast
        if (typeof Toast !== 'undefined') {
          if (data.isRealSmtp) {
            Toast.show(providerMsg, 'success');
          } else {
            // Silent — only log, no toast for archived emails to avoid noise
            console.log('[EmailNotifier] ℹ️ Archived to disk (no SMTP configured).');
          }
        }
      } else {
        console.warn(`[EmailNotifier] ⚠️ ${endpoint} — ${data.message}`);
      }
      return data;
    } catch (err) {
      // Completely silent failure — backend may not be running (offline mode)
      console.log(`[EmailNotifier] ℹ️ Backend unreachable (offline mode). Email for ${endpoint} skipped. ${err.message}`);
      return { success: false, offline: true };
    }
  }

  // ─── Public API ────────────────────────────────────────────

  return {
    /**
     * Send leave request notification to reporting manager.
     * @param {Object} opts - { managerEmail, employee, manager, leaveType, fromDate, toDate, days, reason, requestId }
     */
    async sendLeaveRequestEmail(opts = {}) {
      if (!_isEnabled('emailOnLeaveRequest')) return;
      if (!opts.managerEmail) return console.log('[EmailNotifier] No manager email — leave request email skipped.');
      return _send('leave-request', opts);
    },

    /**
     * Send leave approval/rejection notification to employee.
     * @param {Object} opts - { employeeEmail, employee, decisionBy, status ('approved'|'rejected'), leaveType, fromDate, toDate, days, reason, remarks }
     */
    async sendLeaveDecisionEmail(opts = {}) {
      if (!_isEnabled('emailOnLeaveDecision')) return;
      if (!opts.employeeEmail) return console.log('[EmailNotifier] No employee email — leave decision email skipped.');
      return _send('leave-decision', opts);
    },

    /**
     * Send payslip to a single employee.
     * @param {Object} opts - { employeeEmail, employee, month, year, grossSalary, basicSalary, netSalary, allowances, deductions, taxDeducted, pfDeducted, generatedBy }
     */
    async sendPayslipEmail(opts = {}) {
      if (!_isEnabled('emailOnPayslip')) return;
      if (!opts.employeeEmail) return console.log('[EmailNotifier] No employee email — payslip email skipped.');
      return _send('payslip', opts);
    },

    /**
     * Send payslips to all employees in bulk.
     * @param {Object} opts - { payslips: Array, month, year, generatedBy }
     */
    async sendPayslipBulkEmail(opts = {}) {
      if (!_isEnabled('emailOnPayslip')) return;
      if (!opts.payslips?.length) return;
      return _send('payslip-bulk', opts);
    },

    /**
     * Notify employee that an HR letter has been issued.
     * @param {Object} opts - { employeeEmail, employee, letterType, referenceNo, issuedBy, remarks }
     */
    async sendHRLetterEmail(opts = {}) {
      if (!_isEnabled('emailOnHRLetter')) return;
      if (!opts.employeeEmail) return console.log('[EmailNotifier] No employee email — HR letter email skipped.');
      return _send('hr-letter', opts);
    },

    /**
     * Notify employee of attendance correction outcome.
     * @param {Object} opts - { employeeEmail, employee, date, status, correctedIn, correctedOut, originalIn, originalOut, actionBy, remarks }
     */
    async sendAttendanceCorrectionEmail(opts = {}) {
      if (!_isEnabled('emailOnAttendanceCorrection')) return;
      if (!opts.employeeEmail) return console.log('[EmailNotifier] No employee email — correction email skipped.');
      return _send('attendance-correction', opts);
    },

    /**
     * Send welcome email to newly added employee.
     * @param {Object} opts - { employeeEmail, employee, loginUrl, tempPassword, joiningDate, reportingManager, company }
     */
    async sendWelcomeEmail(opts = {}) {
      if (!_isEnabled('emailOnWelcome')) return;
      if (!opts.employeeEmail) return console.log('[EmailNotifier] No employee email — welcome email skipped.');
      return _send('welcome', opts);
    },

    /**
     * Test SMTP connection and optionally send a test email.
     * @param {Object} smtpSettings - { smtpHost, smtpUser, smtpPass, smtpPort, sendTo }
     */
    async testConnection(smtpSettings = {}) {
      return _send('test', smtpSettings);
    },

    /**
     * Fetch sent email log from backend.
     * @param {number} limit
     */
    async getLogs(limit = 50) {
      try {
        const smtp = _getSmtp();
        const resp = await fetch(`${BASE_URL}/logs?limit=${limit}`);
        return await resp.json();
      } catch (e) {
        return { success: false, data: [], offline: true };
      }
    }
  };
})();
