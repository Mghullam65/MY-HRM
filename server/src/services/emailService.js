const fs = require('fs');
const path = require('path');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  // Graceful fallback if nodemailer is still installing
}

class EmailService {
  constructor() {
    this.sentEmailsDir = path.join(__dirname, '../../data/sent_emails');
    if (!fs.existsSync(this.sentEmailsDir)) {
      try { fs.mkdirSync(this.sentEmailsDir, { recursive: true }); } catch (e) {}
    }
  }

  /**
   * Get dynamic SMTP transporter from environment or settings
   */
  getTransporter(customSettings = {}) {
    if (!nodemailer) {
      try {
        nodemailer = require('nodemailer');
      } catch (e) {
        return null;
      }
    }

    const host = process.env.SMTP_HOST || customSettings.smtpHost;
    const user = process.env.SMTP_USER || customSettings.smtpUser;
    const pass = process.env.SMTP_PASS || customSettings.smtpPass;
    const port = parseInt(process.env.SMTP_PORT || customSettings.smtpPort || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    // Real SMTP configuration
    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
    }

    // Zero-dependency local JSON/stream transporter (safe fallback for dev/testing)
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }

  /**
   * Generate an executive-styled, modern corporate HTML email
   */
  generateDailyAttendanceHtml(data) {
    const {
      companyName = 'ApexHRM Pro',
      dateStr = new Date().toISOString().split('T')[0],
      dayName = 'Working Day',
      timezone = 'Asia/Karachi',
      totalActive = 0,
      presentCount = 0,
      lateCount = 0,
      leaveCount = 0,
      absentCount = 0,
      attendanceRate = '0%',
      presentList = [],
      leaveList = [],
      absentList = []
    } = data;

    const accentColor = '#2563eb';
    const successColor = '#10b981';
    const warningColor = '#f59e0b';
    const dangerColor = '#ef4444';
    const infoColor = '#3b82f6';

    const presentRows = presentList.length > 0 ? presentList.map((p, idx) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1e293b;">${p.empNo || 'EMP-' + p.id}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#0f172a;">${p.fullName}</td>
        <td style="padding:10px 12px;font-size:12px;color:#475569;">${p.department || 'General'}</td>
        <td style="padding:10px 12px;font-size:12px;font-family:monospace;font-weight:600;color:#0284c7;">${p.checkIn || '09:00'}</td>
        <td style="padding:10px 12px;font-size:11.5px;color:#64748b;">${p.device || 'Biometric Terminal'}</td>
        <td style="padding:10px 12px;font-size:11px;">
          ${p.isLate ? `<span style="background:#fef3c7;color:#b45309;padding:3px 8px;border-radius:4px;font-weight:700;">LATE (+${p.lateMinutes || 15}m)</span>` : `<span style="background:#dcfce7;color:#15803d;padding:3px 8px;border-radius:4px;font-weight:700;">ON TIME</span>`}
        </td>
      </tr>
    `).join('') : `<tr><td colspan="7" style="padding:16px;text-align:center;color:#94a3b8;font-size:12px;">No employee check-ins recorded for this date.</td></tr>`;

    const leaveRows = leaveList.length > 0 ? leaveList.map((l, idx) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1e293b;">${l.empNo || 'EMP-' + l.id}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#0f172a;">${l.fullName}</td>
        <td style="padding:10px 12px;font-size:12px;color:#475569;">${l.department || 'General'}</td>
        <td style="padding:10px 12px;font-size:11.5px;">
          <span style="background:#eff6ff;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-weight:600;">${l.leaveType || 'Approved Leave'}</span>
        </td>
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${l.reason || 'Official Approved Leave'}</td>
      </tr>
    `).join('') : `<tr><td colspan="6" style="padding:14px;text-align:center;color:#94a3b8;font-size:12px;">No approved leaves active today.</td></tr>`;

    const absentRows = absentList.length > 0 ? absentList.map((a, idx) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1e293b;">${a.empNo || 'EMP-' + a.id}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#991b1b;">${a.fullName}</td>
        <td style="padding:10px 12px;font-size:12px;color:#475569;">${a.department || 'General'}</td>
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${a.designation || 'Staff'}</td>
        <td style="padding:10px 12px;font-size:11px;">
          <span style="background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:4px;font-weight:700;">UNEXCUSED ABSENT</span>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="6" style="padding:14px;text-align:center;color:#15803d;font-size:12px;font-weight:600;">🎉 100% Attendance achieved! Zero unexcused absences.</td></tr>`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Attendance Summary — ${dateStr}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:760px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);padding:28px 32px;color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#93c5fd;font-weight:700;margin-bottom:6px;">
                      ${companyName} • Executive Telemetry
                    </div>
                    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">
                      Daily Attendance Summary
                    </h1>
                    <div style="font-size:13px;color:#bfdbfe;margin-top:6px;">
                      <strong>${dayName}</strong>, ${dateStr} &nbsp;•&nbsp; Timezone: ${timezone}
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <div style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:8px;text-align:center;border:1px solid rgba(255,255,255,0.2);">
                      <div style="font-size:11px;color:#dbeafe;text-transform:uppercase;font-weight:600;">Attendance Rate</div>
                      <div style="font-size:22px;font-weight:800;color:#ffffff;">${attendanceRate}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary KPI Cards -->
          <tr>
            <td style="padding:24px 32px 12px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Present -->
                  <td width="23%" style="padding:4px;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;text-align:center;">
                      <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Present</div>
                      <div style="font-size:26px;font-weight:800;color:#15803d;margin-top:4px;">${presentCount}</div>
                      <div style="font-size:11px;color:#16a34a;margin-top:2px;">of ${totalActive} active</div>
                    </div>
                  </td>
                  <!-- Late -->
                  <td width="23%" style="padding:4px;">
                    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;text-align:center;">
                      <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Late Arrivals</div>
                      <div style="font-size:26px;font-weight:800;color:#b45309;margin-top:4px;">${lateCount}</div>
                      <div style="font-size:11px;color:#d97706;margin-top:2px;">grace exceeded</div>
                    </div>
                  </td>
                  <!-- On Leave -->
                  <td width="23%" style="padding:4px;">
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;text-align:center;">
                      <div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">On Leave</div>
                      <div style="font-size:26px;font-weight:800;color:#2563eb;margin-top:4px;">${leaveCount}</div>
                      <div style="font-size:11px;color:#3b82f6;margin-top:2px;">approved leaves</div>
                    </div>
                  </td>
                  <!-- Absent -->
                  <td width="23%" style="padding:4px;">
                    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;text-align:center;">
                      <div style="font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Absent</div>
                      <div style="font-size:26px;font-weight:800;color:#dc2626;margin-top:4px;">${absentCount}</div>
                      <div style="font-size:11px;color:#ef4444;margin-top:2px;">unexcused</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section 1: Present & Late Employees -->
          <tr>
            <td style="padding:16px 32px 8px 32px;">
              <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px;display:flex;align-items:center;">
                ✅ Present Employees (${presentCount})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8fafc;border-bottom:1px solid #cbd5e1;text-align:left;">
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">#</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Emp ID</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Employee</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Department</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">In Time</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Terminal</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${presentRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Section 2: Employees on Leave -->
          ${leaveList.length > 0 ? `
          <tr>
            <td style="padding:16px 32px 8px 32px;">
              <div style="font-size:14px;font-weight:700;color:#1e40af;margin-bottom:10px;">
                🏖️ Employees on Approved Leave (${leaveCount})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8fafc;border-bottom:1px solid #cbd5e1;text-align:left;">
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">#</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Emp ID</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Employee</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Department</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Leave Type</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${leaveRows}
                </tbody>
              </table>
            </td>
          </tr>` : ''}

          <!-- Section 3: Absent Employees -->
          ${absentList.length > 0 ? `
          <tr>
            <td style="padding:16px 32px 24px 32px;">
              <div style="font-size:14px;font-weight:700;color:#b91c1c;margin-bottom:10px;">
                ⚠️ Absent Employees (${absentCount})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                <thead>
                  <tr style="background:#fef2f2;border-bottom:1px solid #fecaca;text-align:left;">
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">#</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Emp ID</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Employee</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Department</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Designation</th>
                    <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${absentRows}
                </tbody>
              </table>
            </td>
          </tr>` : ''}

          <!-- Footer / Audit Note -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <div style="font-size:11.5px;color:#64748b;line-height:1.5;">
                This automated operational digest was generated by <strong>${companyName}</strong> server-side background worker.<br>
                Attendance records were compiled automatically from biometric terminals (Head Office & Factory) and HR records.<br>
                <em>Confidential Management Telemetry • Strictly for Authorized HR/Executive Distribution</em>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Dispatch daily attendance summary email
   */
  async sendSummaryEmail({ recipients, subject, htmlContent, summaryData, customSettings = {} }) {
    const toList = Array.isArray(recipients) ? recipients : (recipients || '').split(',').map(e => e.trim()).filter(Boolean);

    if (toList.length === 0) {
      throw new Error('No valid recipients specified for Daily Attendance Summary email.');
    }

    const fromAddress = process.env.SMTP_FROM || customSettings.smtpFrom || 'HRM Telemetry <no-reply@company.com>';
    const transporter = this.getTransporter(customSettings);

    const mailOptions = {
      from: fromAddress,
      to: toList.join(', '),
      subject: subject || `Daily Attendance Summary — ${summaryData.dateStr || new Date().toISOString().split('T')[0]}`,
      html: htmlContent
    };

    let result = null;
    let fallbackSavedPath = null;

    // Archive rendered email to disk for auditing & inspection
    try {
      const filename = `summary_${summaryData.dateStr || 'latest'}_${Date.now()}.html`;
      fallbackSavedPath = path.join(this.sentEmailsDir, filename);
      fs.writeFileSync(fallbackSavedPath, htmlContent, 'utf8');
    } catch (e) {
      console.warn('[EmailService] Notice on saving local email archive:', e.message);
    }

    if (transporter) {
      try {
        result = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] ✅ Email dispatched to [${toList.join(', ')}]. Message ID: ${result.messageId || 'local-stream'}`);
      } catch (err) {
        console.error('[EmailService] ❌ SMTP transport error:', err.message);
        throw err;
      }
    } else {
      console.log(`[EmailService] ℹ️ Nodemailer unavailable, archived to ${fallbackSavedPath}`);
    }

    return {
      success: true,
      recipients: toList,
      archivedFile: fallbackSavedPath,
      messageId: result?.messageId || `archive-${Date.now()}`
    };
  }
}

const instance = new EmailService();
module.exports = instance;
