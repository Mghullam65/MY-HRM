const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// ─── Helper: Get SMTP settings from request body ───────────────────
function getSmtpSettings(body) {
  return {
    smtpHost: body.smtpHost,
    smtpUser: body.smtpUser,
    smtpPass: body.smtpPass,
    smtpPort: body.smtpPort,
    smtpSecure: body.smtpSecure,
    smtpFrom: body.smtpFrom
  };
}

// ═══════════════════════════════════════════════════════════════════
// POST /api/email/test — Verify SMTP connection
// ═══════════════════════════════════════════════════════════════════
router.post('/test', async (req, res) => {
  try {
    const smtp = getSmtpSettings(req.body);
    const { sendTo, subject } = req.body;

    // First verify connection
    const connResult = await emailService.verifyConnection(smtp);
    if (!connResult.success) {
      return res.json({ success: false, message: connResult.message, isRealSmtp: connResult.isRealSmtp });
    }

    // Optionally send a test email
    if (sendTo) {
      const html = emailService._layout({
        headerColor: '#1e3a8a',
        headerGradientTo: '#6366f1',
        badge: '🔌 CONNECTION TEST',
        title: 'SMTP Test Successful!',
        subtitle: `Connected to ${connResult.message}`,
        body: `
          <p style="font-size:14px;color:#334155;line-height:1.7;">This is a test email from your <strong>HRM Pro</strong> notification system.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:16px 0;">
            <div style="font-size:13px;font-weight:700;color:#166534;">✅ SMTP Configuration is Working Correctly</div>
            <div style="font-size:12px;color:#15803d;margin-top:4px;">Your email notification system is ready to send transactional emails for leave requests, payslips, HR letters, and more.</div>
          </div>
          <p style="font-size:12px;color:#64748b;">Sent at: <strong>${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</strong></p>`
      });
      await emailService._dispatch({
        to: sendTo,
        subject: subject || '✅ HRM Pro — SMTP Connection Test Successful',
        html,
        archiveFilename: `test_email_${Date.now()}.html`,
        customSettings: smtp
      });
      return res.json({ success: true, message: `${connResult.message} Test email sent to ${sendTo}.`, isRealSmtp: true });
    }

    res.json({ success: true, message: connResult.message, isRealSmtp: true });
  } catch (err) {
    res.json({ success: false, message: `Connection failed: ${err.message}`, isRealSmtp: false });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/email/leave-request — Leave request notification to manager
// ═══════════════════════════════════════════════════════════════════
router.post('/leave-request', async (req, res) => {
  try {
    const { managerEmail, employee, manager, leaveType, fromDate, toDate, days, reason, requestId, appUrl } = req.body;
    const smtp = getSmtpSettings(req.body);

    if (!managerEmail) {
      return res.status(400).json({ success: false, message: 'managerEmail is required.' });
    }
    if (!employee || !leaveType) {
      return res.status(400).json({ success: false, message: 'employee and leaveType are required.' });
    }

    const result = await emailService.sendLeaveRequestEmail({
      managerEmail,
      data: { employee, manager: manager || { name: 'Manager' }, leaveType, fromDate, toDate, days: days || 1, reason, requestId, appUrl },
      customSettings: smtp
    });

    res.json({ success: true, message: `Leave request email dispatched to ${managerEmail}`, ...result });
  } catch (err) {
    console.error('[/api/email/leave-request]', err.message);
    res.json({ success: false, message: `Email dispatch failed: ${err.message}`, archived: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/email/leave-decision — Leave approval/rejection → employee
// ═══════════════════════════════════════════════════════════════════
router.post('/leave-decision', async (req, res) => {
  try {
    const { employeeEmail, employee, decisionBy, status, leaveType, fromDate, toDate, days, reason, remarks, appUrl } = req.body;
    const smtp = getSmtpSettings(req.body);

    if (!employeeEmail) {
      return res.status(400).json({ success: false, message: 'employeeEmail is required.' });
    }

    const result = await emailService.sendLeaveDecisionEmail({
      employeeEmail,
      data: { employee: employee || {}, decisionBy: decisionBy || 'HR Manager', status, leaveType, fromDate, toDate, days: days || 1, reason, remarks, appUrl },
      customSettings: smtp
    });

    res.json({ success: true, message: `Leave decision email dispatched to ${employeeEmail}`, ...result });
  } catch (err) {
    console.error('[/api/email/leave-decision]', err.message);
    res.json({ success: false, message: `Email dispatch failed: ${err.message}`, archived: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/email/payslip — Single payslip email to one employee
// ═══════════════════════════════════════════════════════════════════
router.post('/payslip', async (req, res) => {
  try {
    const { employeeEmail, employee, month, year, grossSalary, basicSalary, netSalary, allowances, deductions, taxDeducted, pfDeducted, generatedBy, appUrl } = req.body;
    const smtp = getSmtpSettings(req.body);

    if (!employeeEmail) {
      return res.status(400).json({ success: false, message: 'employeeEmail is required.' });
    }

    const result = await emailService.sendPayslipEmail({
      employeeEmail,
      data: { employee: employee || {}, month, year, grossSalary, basicSalary, netSalary, allowances, deductions, taxDeducted, pfDeducted, generatedBy, appUrl },
      customSettings: smtp
    });

    res.json({ success: true, message: `Payslip email dispatched to ${employeeEmail}`, ...result });
  } catch (err) {
    console.error('[/api/email/payslip]', err.message);
    res.json({ success: false, message: `Email dispatch failed: ${err.message}`, archived: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/email/payslip-bulk — Send payslip emails to all employees
// ═══════════════════════════════════════════════════════════════════
router.post('/payslip-bulk', async (req, res) => {
  try {
    const { payslips, month, year, generatedBy, appUrl } = req.body;
    const smtp = getSmtpSettings(req.body);

    if (!payslips || !Array.isArray(payslips) || payslips.length === 0) {
      return res.status(400).json({ success: false, message: 'payslips array is required.' });
    }

    const results = [];
    let sent = 0, failed = 0, skipped = 0;

    for (const ps of payslips) {
      const email = ps.employeeEmail || ps.employee?.email;
      if (!email) { skipped++; continue; }

      try {
        const result = await emailService.sendPayslipEmail({
          employeeEmail: email,
          data: { ...ps, month, year, generatedBy, appUrl },
          customSettings: smtp
        });
        results.push({ email, success: true, messageId: result.messageId });
        sent++;
      } catch (err) {
        results.push({ email, success: false, error: err.message });
        failed++;
      }
    }

    res.json({
      success: true,
      message: `Bulk payslip dispatch complete. Sent: ${sent}, Failed: ${failed}, Skipped (no email): ${skipped}`,
      summary: { sent, failed, skipped, total: payslips.length },
      results
    });
  } catch (err) {
    console.error('[/api/email/payslip-bulk]', err.message);
    res.status(500).json({ success: false, message: `Bulk dispatch failed: ${err.message}` });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/email/hr-letter — HR letter issuance notification
// ═══════════════════════════════════════════════════════════════════
router.post('/hr-letter', async (req, res) => {
  try {
    const { employeeEmail, employee, letterType, referenceNo, issuedBy, remarks, appUrl } = req.body;
    const smtp = getSmtpSettings(req.body);

    if (!employeeEmail) {
      return res.status(400).json({ success: false, message: 'employeeEmail is required.' });
    }

    const result = await emailService.sendHRLetterEmail({
      employeeEmail,
      data: { employee: employee || {}, letterType: letterType || 'HR Letter', referenceNo, issuedBy, remarks, appUrl },
      customSettings: smtp
    });

    res.json({ success: true, message: `HR letter notification dispatched to ${employeeEmail}`, ...result });
  } catch (err) {
    console.error('[/api/email/hr-letter]', err.message);
    res.json({ success: false, message: `Email dispatch failed: ${err.message}`, archived: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/email/attendance-correction — Correction outcome → employee
// ═══════════════════════════════════════════════════════════════════
router.post('/attendance-correction', async (req, res) => {
  try {
    const { employeeEmail, employee, date, status, correctedIn, correctedOut, originalIn, originalOut, actionBy, remarks, appUrl } = req.body;
    const smtp = getSmtpSettings(req.body);

    if (!employeeEmail) {
      return res.status(400).json({ success: false, message: 'employeeEmail is required.' });
    }

    const result = await emailService.sendAttendanceCorrectionEmail({
      employeeEmail,
      data: { employee: employee || {}, date, status, correctedIn, correctedOut, originalIn, originalOut, actionBy: actionBy || 'Manager', remarks, appUrl },
      customSettings: smtp
    });

    res.json({ success: true, message: `Attendance correction notification dispatched to ${employeeEmail}`, ...result });
  } catch (err) {
    console.error('[/api/email/attendance-correction]', err.message);
    res.json({ success: false, message: `Email dispatch failed: ${err.message}`, archived: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/email/welcome — Welcome email to new employee
// ═══════════════════════════════════════════════════════════════════
router.post('/welcome', async (req, res) => {
  try {
    const { employeeEmail, employee, loginUrl, tempPassword, joiningDate, reportingManager, company } = req.body;
    const smtp = getSmtpSettings(req.body);

    if (!employeeEmail) {
      return res.status(400).json({ success: false, message: 'employeeEmail is required.' });
    }

    const result = await emailService.sendWelcomeEmail({
      employeeEmail,
      data: { employee: employee || {}, loginUrl, tempPassword, joiningDate, reportingManager, company },
      customSettings: smtp
    });

    res.json({ success: true, message: `Welcome email dispatched to ${employeeEmail}`, ...result });
  } catch (err) {
    console.error('[/api/email/welcome]', err.message);
    res.json({ success: false, message: `Email dispatch failed: ${err.message}`, archived: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/email/logs — Retrieve sent email log archive list
// ═══════════════════════════════════════════════════════════════════
router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = emailService.getSentEmailLogs(limit);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: `Failed to retrieve email logs: ${err.message}` });
  }
});

module.exports = router;
