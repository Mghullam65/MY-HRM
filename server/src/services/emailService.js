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

  // ─── SMTP Transporter ─────────────────────────────────────────────

  getTransporter(customSettings = {}) {
    if (!nodemailer) {
      try { nodemailer = require('nodemailer'); } catch (e) {
        return { transporter: null, isRealSmtp: false };
      }
    }

    let host = process.env.SMTP_HOST || customSettings.smtpHost;
    let user = process.env.SMTP_USER || customSettings.smtpUser;
    const pass = process.env.SMTP_PASS || customSettings.smtpPass;
    const port = parseInt(process.env.SMTP_PORT || customSettings.smtpPort || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || customSettings.smtpSecure === true || port === 465;

    // Smart Auto-Correction: If user accidentally passed an email address as the host
    if (host && host.includes('@')) {
      if (!user) user = host;
      const lower = host.toLowerCase();
      if (lower.includes('gmail')) host = 'smtp.gmail.com';
      else if (lower.includes('office365') || lower.includes('outlook') || lower.includes('hotmail')) host = 'smtp.office365.com';
      else if (lower.includes('yahoo')) host = 'smtp.mail.yahoo.com';
      else if (lower.includes('sendgrid')) host = 'smtp.sendgrid.net';
    }

    if (host && user && pass) {
      return {
        transporter: nodemailer.createTransport({
          host, port, secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false }
        }),
        isRealSmtp: true, host, user, port
      };
    }

    return {
      transporter: nodemailer ? nodemailer.createTransport({ jsonTransport: true }) : null,
      isRealSmtp: false,
      host: 'local-archive', user: 'none', port
    };
  }

  async verifyConnection(customSettings = {}) {
    const { transporter, isRealSmtp, host, port } = this.getTransporter(customSettings);
    if (!isRealSmtp) {
      return { success: false, isRealSmtp: false, message: 'SMTP credentials missing. Please provide SMTP Host, Username, and Password.' };
    }
    try {
      await transporter.verify();
      return { success: true, isRealSmtp: true, message: `SMTP Connected and authenticated successfully with ${host}:${port}!` };
    } catch (err) {
      return { success: false, isRealSmtp: true, message: `SMTP Verification failed: ${err.message}` };
    }
  }

  // ─── Generic Email Dispatcher ─────────────────────────────────────

  async _dispatch({ to, subject, html, archiveFilename, customSettings = {} }) {
    const toList = Array.isArray(to) ? to : (to || '').split(',').map(e => e.trim()).filter(Boolean);
    if (toList.length === 0) throw new Error('No valid recipients specified.');

    const fromAddress = process.env.SMTP_FROM || customSettings.smtpFrom || 'HRM Pro <no-reply@company.com>';
    const { transporter, isRealSmtp, host } = this.getTransporter(customSettings);

    let fallbackSavedPath = null;
    try {
      const filename = archiveFilename || `email_${Date.now()}.html`;
      fallbackSavedPath = path.join(this.sentEmailsDir, filename);
      fs.writeFileSync(fallbackSavedPath, html, 'utf8');
    } catch (e) {}

    let result = null;
    if (transporter) {
      try {
        result = await transporter.sendMail({ from: fromAddress, to: toList.join(', '), subject, html });
        console.log(`[EmailService] ✅ Email dispatched to [${toList.join(', ')}] via ${isRealSmtp ? host : 'Local JSON'}. ID: ${result.messageId || 'local'}`);
      } catch (err) {
        console.error('[EmailService] ❌ SMTP error:', err.message);
        throw err;
      }
    }

    return {
      success: true, isRealSmtp,
      provider: isRealSmtp ? host : 'Local Archive (Simulated)',
      recipients: toList,
      archivedFile: fallbackSavedPath,
      messageId: result?.messageId || `archive-${Date.now()}`,
      warning: !isRealSmtp ? 'SMTP credentials not configured. Email archived to disk but NOT delivered to inbox.' : null
    };
  }

  // ─── Shared Email Layout ──────────────────────────────────────────

  _layout({ headerColor = '#1e3a8a', headerGradientTo = '#2563eb', badge = '', title, subtitle, body, company = 'HRM Pro', footer = '' }) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.05);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,${headerColor} 0%,${headerGradientTo} 100%);padding:28px 32px;color:#fff;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.7);font-weight:700;margin-bottom:6px;">${company} • HR Notifications</div>
        ${badge ? `<div style="display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;margin-bottom:10px;">${badge}</div>` : ''}
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;line-height:1.3;">${title}</h1>
        ${subtitle ? `<div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:6px;">${subtitle}</div>` : ''}
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:28px 32px;">${body}</td></tr>
      <!-- Footer -->
      <tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:11.5px;color:#64748b;line-height:1.6;">
          ${footer || `This is an automated notification from <strong>${company}</strong>.<br>Please do not reply to this email. For queries, contact HR directly.`}
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`.trim();
  }

  _infoRow(label, value, highlight = false) {
    return `<tr>
      <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#475569;background:#f8fafc;border-bottom:1px solid #f1f5f9;width:40%;">${label}</td>
      <td style="padding:10px 14px;font-size:12px;color:${highlight ? '#0369a1' : '#1e293b'};font-weight:${highlight ? '700' : '500'};background:#fff;border-bottom:1px solid #f1f5f9;">${value}</td>
    </tr>`;
  }

  _badge(text, color = '#2563eb', bg = '#eff6ff') {
    return `<span style="display:inline-block;background:${bg};color:${color};padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;">${text}</span>`;
  }

  _cta(text, href = '#') {
    return `<div style="text-align:center;margin-top:24px;">
      <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.3px;">${text}</a>
    </div>`;
  }

  // ─── Template 1: Leave Request Submitted (to Manager) ────────────

  generateLeaveRequestHtml({ employee, manager, leaveType, fromDate, toDate, days, reason, requestId, appUrl = '#', company = 'HRM Pro' }) {
    const body = `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:#92400e;">⚠️ Action Required — Leave Approval Pending</div>
        <div style="font-size:12px;color:#b45309;margin-top:4px;">This leave request requires your review and decision.</div>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.7;">Dear <strong>${manager.name}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        <strong>${employee.name}</strong> (${employee.empId || employee.id}) has submitted a leave application that requires your approval.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;margin:20px 0;">
        ${this._infoRow('Request ID', requestId || 'LR-' + Date.now())}
        ${this._infoRow('Employee', `${employee.name} — ${employee.designation || 'Staff'}`, true)}
        ${this._infoRow('Department', employee.department || 'General')}
        ${this._infoRow('Leave Type', this._badge(leaveType, '#1d4ed8', '#eff6ff'))}
        ${this._infoRow('From Date', fromDate)}
        ${this._infoRow('To Date', toDate)}
        ${this._infoRow('Duration', `${days} Working Day${days > 1 ? 's' : ''}`, true)}
        ${this._infoRow('Reason / Remarks', reason || 'No reason provided')}
        ${this._infoRow('Submitted At', new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }))}
      </table>
      ${this._cta('🔍 Review & Action Leave Request', appUrl)}
      <p style="font-size:12px;color:#94a3b8;margin-top:20px;text-align:center;">
        You can also log in to HRM Pro → Leaves → Pending Approvals to action this request.
      </p>`;
    return this._layout({ headerColor: '#92400e', headerGradientTo: '#d97706', badge: '📋 LEAVE REQUEST', title: 'New Leave Application', subtitle: `From ${employee.name} — Requires Your Approval`, body, company });
  }

  // ─── Template 2: Leave Decision (Approved / Rejected) → Employee ─

  generateLeaveDecisionHtml({ employee, decisionBy, status, leaveType, fromDate, toDate, days, reason, remarks, appUrl = '#', company = 'HRM Pro' }) {
    const isApproved = status === 'approved';
    const headerColor = isApproved ? '#065f46' : '#7f1d1d';
    const gradientTo = isApproved ? '#059669' : '#dc2626';
    const badgeText = isApproved ? '✅ LEAVE APPROVED' : '❌ LEAVE REJECTED';
    const bannerBg = isApproved ? '#f0fdf4' : '#fef2f2';
    const bannerBorder = isApproved ? '#bbf7d0' : '#fecaca';
    const bannerTextColor = isApproved ? '#166534' : '#991b1b';
    const bannerSubColor = isApproved ? '#15803d' : '#b91c1c';

    const body = `
      <div style="background:${bannerBg};border:1px solid ${bannerBorder};border-radius:8px;padding:16px 20px;margin-bottom:20px;text-align:center;">
        <div style="font-size:22px;margin-bottom:6px;">${isApproved ? '🎉' : '😔'}</div>
        <div style="font-size:15px;font-weight:800;color:${bannerTextColor};">Your Leave has been ${isApproved ? 'Approved' : 'Rejected'}</div>
        <div style="font-size:12px;color:${bannerSubColor};margin-top:4px;">Decision taken by <strong>${decisionBy}</strong></div>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.7;">Dear <strong>${employee.name}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        ${isApproved
          ? `Your leave application has been <strong style="color:#059669;">approved</strong>. Please ensure proper handover before your leave period begins.`
          : `Your leave application has been <strong style="color:#dc2626;">rejected</strong>. Please contact your manager or HR for further clarification.`}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;margin:20px 0;">
        ${this._infoRow('Leave Type', this._badge(leaveType, '#1d4ed8', '#eff6ff'))}
        ${this._infoRow('From Date', fromDate)}
        ${this._infoRow('To Date', toDate)}
        ${this._infoRow('Duration', `${days} Working Day${days > 1 ? 's' : ''}`, true)}
        ${this._infoRow('Your Reason', reason || 'N/A')}
        ${this._infoRow('Manager Remarks', remarks || (isApproved ? 'Approved as requested.' : 'Rejected — please see your manager.'))}
        ${this._infoRow('Decision By', decisionBy)}
        ${this._infoRow('Decision Date', new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }))}
        ${this._infoRow('Status', this._badge(isApproved ? 'APPROVED' : 'REJECTED', isApproved ? '#065f46' : '#7f1d1d', isApproved ? '#dcfce7' : '#fee2e2'))}
      </table>
      ${this._cta('📋 View My Leave Records', appUrl)}`;
    return this._layout({ headerColor, headerGradientTo: gradientTo, badge: badgeText, title: `Leave ${isApproved ? 'Approved' : 'Rejected'}`, subtitle: `${leaveType} — ${fromDate} to ${toDate}`, body, company });
  }

  // ─── Template 3: Payslip Email → Employee ─────────────────────────

  generatePayslipHtml({ employee, month, year, grossSalary, basicSalary, allowances = [], deductions = [], netSalary, taxDeducted, pfDeducted, generatedBy, appUrl = '#', company = 'HRM Pro' }) {
    const fmt = n => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });
    const allowanceRows = allowances.map(a => `
      <tr><td style="padding:8px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">${a.label}</td>
      <td style="padding:8px 14px;font-size:12px;color:#15803d;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9;">+${fmt(a.amount)}</td></tr>`).join('');
    const deductionRows = deductions.map(d => `
      <tr><td style="padding:8px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">${d.label}</td>
      <td style="padding:8px 14px;font-size:12px;color:#dc2626;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9;">-${fmt(d.amount)}</td></tr>`).join('');

    const body = `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:28px;">💵</div>
        <div>
          <div style="font-size:14px;font-weight:800;color:#1e40af;">Your payslip for ${month} ${year} is ready</div>
          <div style="font-size:12px;color:#3b82f6;margin-top:2px;">Net Salary: <strong style="font-size:16px;color:#1d4ed8;">${fmt(netSalary)}</strong></div>
        </div>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.7;">Dear <strong>${employee.name}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Your salary for <strong>${month} ${year}</strong> has been processed. Please find your payslip details below.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;margin:16px 0;">
        ${this._infoRow('Employee', employee.name, true)}
        ${this._infoRow('Employee ID', employee.empId || employee.id)}
        ${this._infoRow('Designation', employee.designation || 'Staff')}
        ${this._infoRow('Department', employee.department || 'General')}
        ${this._infoRow('Pay Period', `${month} ${year}`, true)}
        ${this._infoRow('Basic Salary', fmt(basicSalary))}
        ${this._infoRow('Gross Salary', fmt(grossSalary), true)}
      </table>
      ${allowanceRows || deductionRows ? `
      <div style="font-size:13px;font-weight:700;color:#1e293b;margin:16px 0 8px;">Salary Breakdown</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#475569;text-align:left;">Component</th>
          <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#475569;text-align:right;">Amount</th>
        </tr></thead>
        <tbody>
          ${allowanceRows}
          ${deductionRows}
          ${pfDeducted ? `<tr><td style="padding:8px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">PF / Provident Fund</td><td style="padding:8px 14px;font-size:12px;color:#dc2626;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9;">-${fmt(pfDeducted)}</td></tr>` : ''}
          ${taxDeducted ? `<tr><td style="padding:8px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">Income Tax (FBR Withholding)</td><td style="padding:8px 14px;font-size:12px;color:#dc2626;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9;">-${fmt(taxDeducted)}</td></tr>` : ''}
        </tbody>
        <tfoot><tr style="background:#f0fdf4;border-top:2px solid #bbf7d0;">
          <td style="padding:12px 14px;font-size:13px;font-weight:800;color:#065f46;">Net Salary (Take Home)</td>
          <td style="padding:12px 14px;font-size:15px;font-weight:800;color:#15803d;text-align:right;">${fmt(netSalary)}</td>
        </tr></tfoot>
      </table>` : ''}
      <p style="font-size:12px;color:#64748b;margin-top:16px;">
        This payslip has been generated by <strong>${generatedBy || 'HR / Finance Team'}</strong> on ${new Date().toLocaleDateString('en-PK')}.
      </p>
      ${this._cta('📄 View Full Payslip Online', appUrl)}`;
    return this._layout({ headerColor: '#064e3b', headerGradientTo: '#059669', badge: '💰 PAYSLIP', title: `Salary Credit — ${month} ${year}`, subtitle: `Net: ${fmt(netSalary)}`, body, company });
  }

  // ─── Template 4: HR Letter Issued → Employee ──────────────────────

  generateHRLetterHtml({ employee, letterType, referenceNo, issuedBy, remarks, appUrl = '#', company = 'HRM Pro' }) {
    const body = `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:#166534;">📄 Official HR Document Issued</div>
        <div style="font-size:12px;color:#15803d;margin-top:4px;">Please review and confirm receipt using the acknowledgment button below.</div>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.7;">Dear <strong>${employee.name}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Human Resources has officially issued a <strong>${letterType}</strong> on your behalf. Kindly review the document and submit your formal acknowledgment of receipt at your earliest convenience.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;margin:20px 0;">
        ${this._infoRow('Document Type', this._badge(letterType, '#1d4ed8', '#eff6ff'))}
        ${this._infoRow('Reference No.', referenceNo || 'HRM/LTR/' + new Date().getFullYear() + '/' + Math.floor(Math.random() * 900 + 100), true)}
        ${this._infoRow('Issued To', employee.name)}
        ${this._infoRow('Employee ID', employee.empId || employee.id)}
        ${this._infoRow('Issued By', issuedBy || 'HR Department')}
        ${this._infoRow('Issue Date', new Date().toLocaleDateString('en-PK'))}
        ${remarks ? this._infoRow('Notes', remarks) : ''}
      </table>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:16px 0;">
        <div style="font-size:12px;font-weight:700;color:#92400e;">⚠️ Action Required: Digital Acknowledgment</div>
        <div style="font-size:12px;color:#b45309;margin-top:4px;">Please log in to HRM Pro and submit your digital acknowledgment of receipt for this official document within <strong>3 working days</strong>.</div>
      </div>
      ${this._cta('✅ View & Acknowledge Document', appUrl)}`;
    return this._layout({ headerColor: '#1e3a8a', headerGradientTo: '#3b82f6', badge: '📑 OFFICIAL DOCUMENT', title: `HR Letter: ${letterType}`, subtitle: `Reference: ${referenceNo || 'Ref# on document'}`, body, company });
  }

  // ─── Template 5: Attendance Correction Decision → Employee ────────

  generateAttendanceCorrectionHtml({ employee, date, status, correctedIn, correctedOut, originalIn, originalOut, actionBy, remarks, appUrl = '#', company = 'HRM Pro' }) {
    const isApproved = status === 'approved' || status === 'final_approved';
    const headerColor = isApproved ? '#065f46' : '#7f1d1d';
    const gradientTo = isApproved ? '#059669' : '#dc2626';
    const body = `
      <div style="background:${isApproved ? '#f0fdf4' : '#fef2f2'};border:1px solid ${isApproved ? '#bbf7d0' : '#fecaca'};border-radius:8px;padding:16px 20px;margin-bottom:20px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:${isApproved ? '#166534' : '#991b1b'};">
          ${isApproved ? '✅ Attendance Correction Approved' : '❌ Attendance Correction Rejected'}
        </div>
        <div style="font-size:12px;color:${isApproved ? '#15803d' : '#b91c1c'};margin-top:4px;">Action taken by <strong>${actionBy}</strong></div>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.7;">Dear <strong>${employee.name}</strong>,</p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Your attendance correction request for <strong>${date}</strong> has been <strong style="color:${isApproved ? '#059669' : '#dc2626'};">${isApproved ? 'approved' : 'rejected'}</strong>.
        ${isApproved ? ' Your attendance record has been updated accordingly.' : ' Please contact your manager for further guidance.'}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;margin:20px 0;">
        ${this._infoRow('Date', date, true)}
        ${originalIn ? this._infoRow('Original Time In', originalIn) : ''}
        ${originalOut ? this._infoRow('Original Time Out', originalOut) : ''}
        ${isApproved && correctedIn ? this._infoRow('Corrected Time In', correctedIn, true) : ''}
        ${isApproved && correctedOut ? this._infoRow('Corrected Time Out', correctedOut, true) : ''}
        ${this._infoRow('Status', this._badge(isApproved ? 'APPROVED' : 'REJECTED', isApproved ? '#065f46' : '#7f1d1d', isApproved ? '#dcfce7' : '#fee2e2'))}
        ${this._infoRow('Reviewed By', actionBy)}
        ${remarks ? this._infoRow('Remarks', remarks) : ''}
      </table>
      ${this._cta('📅 View My Attendance', appUrl)}`;
    return this._layout({ headerColor, headerGradientTo: gradientTo, badge: '🕐 ATTENDANCE CORRECTION', title: `Correction ${isApproved ? 'Approved' : 'Rejected'}`, subtitle: `Date: ${date}`, body, company });
  }

  // ─── Template 6: Welcome Email → New Employee ─────────────────────

  generateWelcomeHtml({ employee, loginUrl = '#', tempPassword, joiningDate, reportingManager, company = 'HRM Pro' }) {
    const body = `
      <div style="text-align:center;padding:20px 0 8px;">
        <div style="font-size:48px;">🎉</div>
        <div style="font-size:20px;font-weight:800;color:#1e3a8a;margin-top:8px;">Welcome to the Team!</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">We're thrilled to have you on board, <strong>${employee.name}</strong>.</div>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <div style="font-size:13px;font-weight:700;color:#1e40af;margin-bottom:8px;">🔐 Your HRM Portal Access</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:12px;color:#475569;padding:4px 0;width:40%;">Portal URL</td><td style="font-size:12px;color:#1d4ed8;font-weight:600;"><a href="${loginUrl}" style="color:#1d4ed8;">${loginUrl}</a></td></tr>
          <tr><td style="font-size:12px;color:#475569;padding:4px 0;">Username</td><td style="font-size:12px;color:#1e293b;font-weight:700;font-family:monospace;">${employee.email || (employee.name.toLowerCase().replace(/\s+/g, '.') + '@company.com')}</td></tr>
          ${tempPassword ? `<tr><td style="font-size:12px;color:#475569;padding:4px 0;">Temporary Password</td><td style="font-size:13px;color:#7c3aed;font-weight:800;font-family:monospace;background:#f5f3ff;padding:2px 8px;border-radius:4px;">${tempPassword}</td></tr>` : ''}
        </table>
        ${tempPassword ? `<div style="font-size:11.5px;color:#7c3aed;margin-top:10px;font-weight:600;">⚠️ Please change your password immediately after your first login.</div>` : ''}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;margin:20px 0;">
        ${this._infoRow('Employee Name', employee.name, true)}
        ${this._infoRow('Employee ID', employee.empId || employee.id)}
        ${this._infoRow('Designation', employee.designation || 'Staff')}
        ${this._infoRow('Department', employee.department || 'General')}
        ${this._infoRow('Joining Date', joiningDate || new Date().toLocaleDateString('en-PK'))}
        ${reportingManager ? this._infoRow('Reporting To', reportingManager) : ''}
      </table>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px;">📋 What to do next:</div>
        <ul style="margin:0;padding-left:18px;color:#475569;font-size:12px;line-height:2;">
          <li>Log in to the HRM Portal and set your new password</li>
          <li>Complete your employee profile (photo, CNIC, bank details)</li>
          <li>Review and e-sign the company policy documents</li>
          <li>Attend the scheduled onboarding orientation session</li>
          <li>Connect with your reporting manager: <strong>${reportingManager || 'TBD'}</strong></li>
        </ul>
      </div>
      ${this._cta('🚀 Log In to HRM Portal', loginUrl)}`;
    return this._layout({ headerColor: '#3730a3', headerGradientTo: '#6366f1', badge: '🌟 WELCOME', title: `Welcome to ${company}!`, subtitle: `Your employee account is now active`, body, company });
  }

  // ─── Daily Attendance Summary (Original) ─────────────────────────

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
      </tr>`).join('') : `<tr><td colspan="7" style="padding:16px;text-align:center;color:#94a3b8;font-size:12px;">No employee check-ins recorded for this date.</td></tr>`;

    const leaveRows = leaveList.length > 0 ? leaveList.map((l, idx) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1e293b;">${l.empNo || 'EMP-' + l.id}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#0f172a;">${l.fullName}</td>
        <td style="padding:10px 12px;font-size:12px;color:#475569;">${l.department || 'General'}</td>
        <td style="padding:10px 12px;font-size:11.5px;"><span style="background:#eff6ff;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-weight:600;">${l.leaveType || 'Approved Leave'}</span></td>
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${l.reason || 'Official Approved Leave'}</td>
      </tr>`).join('') : `<tr><td colspan="6" style="padding:14px;text-align:center;color:#94a3b8;font-size:12px;">No approved leaves active today.</td></tr>`;

    const absentRows = absentList.length > 0 ? absentList.map((a, idx) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1e293b;">${a.empNo || 'EMP-' + a.id}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#991b1b;">${a.fullName}</td>
        <td style="padding:10px 12px;font-size:12px;color:#475569;">${a.department || 'General'}</td>
        <td style="padding:10px 12px;font-size:12px;color:#64748b;">${a.designation || 'Staff'}</td>
        <td style="padding:10px 12px;font-size:11px;"><span style="background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:4px;font-weight:700;">UNEXCUSED ABSENT</span></td>
      </tr>`).join('') : `<tr><td colspan="6" style="padding:14px;text-align:center;color:#15803d;font-size:12px;font-weight:600;">🎉 100% Attendance achieved! Zero unexcused absences.</td></tr>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Attendance Summary — ${dateStr}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:24px 12px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:760px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
        <tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:28px 32px;color:#ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#93c5fd;font-weight:700;margin-bottom:6px;">${companyName} • Executive Telemetry</div>
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">Daily Attendance Summary</h1>
              <div style="font-size:13px;color:#bfdbfe;margin-top:6px;"><strong>${dayName}</strong>, ${dateStr} &nbsp;•&nbsp; Timezone: ${timezone}</div>
            </td>
            <td align="right" valign="top">
              <div style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:8px;text-align:center;border:1px solid rgba(255,255,255,0.2);">
                <div style="font-size:11px;color:#dbeafe;text-transform:uppercase;font-weight:600;">Attendance Rate</div>
                <div style="font-size:22px;font-weight:800;color:#ffffff;">${attendanceRate}</div>
              </div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:24px 32px 12px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="23%" style="padding:4px;"><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Present</div><div style="font-size:26px;font-weight:800;color:#15803d;margin-top:4px;">${presentCount}</div><div style="font-size:11px;color:#16a34a;margin-top:2px;">of ${totalActive} active</div></div></td>
            <td width="23%" style="padding:4px;"><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Late Arrivals</div><div style="font-size:26px;font-weight:800;color:#b45309;margin-top:4px;">${lateCount}</div><div style="font-size:11px;color:#d97706;margin-top:2px;">grace exceeded</div></div></td>
            <td width="23%" style="padding:4px;"><div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">On Leave</div><div style="font-size:26px;font-weight:800;color:#2563eb;margin-top:4px;">${leaveCount}</div><div style="font-size:11px;color:#3b82f6;margin-top:2px;">approved leaves</div></div></td>
            <td width="23%" style="padding:4px;"><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Absent</div><div style="font-size:26px;font-weight:800;color:#dc2626;margin-top:4px;">${absentCount}</div><div style="font-size:11px;color:#ef4444;margin-top:2px;">unexcused</div></div></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:16px 32px 8px 32px;">
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px;">✅ Present Employees (${presentCount})</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
            <thead><tr style="background:#f8fafc;border-bottom:1px solid #cbd5e1;text-align:left;">
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">#</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Emp ID</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Employee</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Department</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">In Time</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Terminal</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Status</th>
            </tr></thead>
            <tbody>${presentRows}</tbody>
          </table>
        </td></tr>
        ${leaveList.length > 0 ? `<tr><td style="padding:16px 32px 8px 32px;">
          <div style="font-size:14px;font-weight:700;color:#1e40af;margin-bottom:10px;">🏖️ Employees on Approved Leave (${leaveCount})</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
            <thead><tr style="background:#f8fafc;border-bottom:1px solid #cbd5e1;text-align:left;">
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">#</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Emp ID</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Employee</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Department</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Leave Type</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#475569;">Remarks</th>
            </tr></thead>
            <tbody>${leaveRows}</tbody>
          </table>
        </td></tr>` : ''}
        ${absentList.length > 0 ? `<tr><td style="padding:16px 32px 24px 32px;">
          <div style="font-size:14px;font-weight:700;color:#b91c1c;margin-bottom:10px;">⚠️ Absent Employees (${absentCount})</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
            <thead><tr style="background:#fef2f2;border-bottom:1px solid #fecaca;text-align:left;">
              <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">#</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Emp ID</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Employee</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Department</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Designation</th><th style="padding:8px 12px;font-size:11px;font-weight:700;color:#991b1b;">Status</th>
            </tr></thead>
            <tbody>${absentRows}</tbody>
          </table>
        </td></tr>` : ''}
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
          <div style="font-size:11.5px;color:#64748b;line-height:1.5;">
            This automated operational digest was generated by <strong>${companyName}</strong> server-side background worker.<br>
            Attendance records were compiled automatically from biometric terminals (Head Office &amp; Factory) and HR records.<br>
            <em>Confidential Management Telemetry • Strictly for Authorized HR/Executive Distribution</em>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
  }

  // ─── Send Methods ─────────────────────────────────────────────────

  async sendLeaveRequestEmail({ managerEmail, data, customSettings = {} }) {
    const html = this.generateLeaveRequestHtml(data);
    const archive = `leave_request_${data.requestId || Date.now()}.html`;
    return this._dispatch({ to: managerEmail, subject: `[Action Required] Leave Request from ${data.employee.name} — ${data.leaveType} (${data.days}d)`, html, archiveFilename: archive, customSettings });
  }

  async sendLeaveDecisionEmail({ employeeEmail, data, customSettings = {} }) {
    const html = this.generateLeaveDecisionHtml(data);
    const status = data.status === 'approved' ? 'Approved' : 'Rejected';
    const archive = `leave_decision_${Date.now()}.html`;
    return this._dispatch({ to: employeeEmail, subject: `Your Leave has been ${status} — ${data.leaveType} (${data.fromDate})`, html, archiveFilename: archive, customSettings });
  }

  async sendPayslipEmail({ employeeEmail, data, customSettings = {} }) {
    const html = this.generatePayslipHtml(data);
    const archive = `payslip_${data.employee.empId || data.employee.id}_${data.month}_${data.year}.html`;
    return this._dispatch({ to: employeeEmail, subject: `Your Payslip for ${data.month} ${data.year} — Net PKR ${Number(data.netSalary || 0).toLocaleString()}`, html, archiveFilename: archive, customSettings });
  }

  async sendHRLetterEmail({ employeeEmail, data, customSettings = {} }) {
    const html = this.generateHRLetterHtml(data);
    const archive = `hr_letter_${data.referenceNo || Date.now()}.html`;
    return this._dispatch({ to: employeeEmail, subject: `[Action Required] HR Document Issued: ${data.letterType} — Ref: ${data.referenceNo || 'See Document'}`, html, archiveFilename: archive, customSettings });
  }

  async sendAttendanceCorrectionEmail({ employeeEmail, data, customSettings = {} }) {
    const html = this.generateAttendanceCorrectionHtml(data);
    const statusWord = (data.status === 'approved' || data.status === 'final_approved') ? 'Approved' : 'Rejected';
    const archive = `att_correction_${Date.now()}.html`;
    return this._dispatch({ to: employeeEmail, subject: `Attendance Correction ${statusWord} — ${data.date}`, html, archiveFilename: archive, customSettings });
  }

  async sendWelcomeEmail({ employeeEmail, data, customSettings = {} }) {
    const html = this.generateWelcomeHtml(data);
    const archive = `welcome_${data.employee.empId || data.employee.id}_${Date.now()}.html`;
    return this._dispatch({ to: employeeEmail, subject: `Welcome to ${data.company || 'HRM Pro'}, ${data.employee.name}! Your Account is Ready 🎉`, html, archiveFilename: archive, customSettings });
  }

  async sendSummaryEmail({ recipients, subject, htmlContent, summaryData, customSettings = {} }) {
    const toList = Array.isArray(recipients) ? recipients : (recipients || '').split(',').map(e => e.trim()).filter(Boolean);
    if (toList.length === 0) throw new Error('No valid recipients specified for Daily Attendance Summary email.');
    const archive = `summary_${summaryData.dateStr || 'latest'}_${Date.now()}.html`;
    return this._dispatch({ to: toList, subject: subject || `Daily Attendance Summary — ${summaryData.dateStr || new Date().toISOString().split('T')[0]}`, html: htmlContent, archiveFilename: archive, customSettings });
  }

  // ─── Sent Email Log Reader ────────────────────────────────────────

  getSentEmailLogs(limit = 50) {
    try {
      const files = fs.readdirSync(this.sentEmailsDir)
        .filter(f => f.endsWith('.html'))
        .map(f => {
          const stat = fs.statSync(path.join(this.sentEmailsDir, f));
          const parts = f.replace('.html', '').split('_');
          let type = 'general';
          if (f.startsWith('leave_request')) type = 'leave_request';
          else if (f.startsWith('leave_decision')) type = 'leave_decision';
          else if (f.startsWith('payslip')) type = 'payslip';
          else if (f.startsWith('hr_letter')) type = 'hr_letter';
          else if (f.startsWith('att_correction')) type = 'attendance_correction';
          else if (f.startsWith('welcome')) type = 'welcome';
          else if (f.startsWith('summary')) type = 'daily_summary';
          return { filename: f, type, size: stat.size, createdAt: stat.mtime.toISOString() };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
      return files;
    } catch (e) {
      return [];
    }
  }
}

const instance = new EmailService();
module.exports = instance;
