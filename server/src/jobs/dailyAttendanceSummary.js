const fs = require('fs');
const path = require('path');
const emailService = require('../services/emailService');

// Resolve data directory and execution ledger
const DATA_DIR = path.join(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}
const LEDGER_FILE = path.join(DATA_DIR, 'daily_summary_job_log.json');

// Helper to safely load store service if running in server context
let storeService = null;
try {
  storeService = require('../services/store');
  if (storeService && !storeService.isInitialized) {
    storeService.init();
  }
} catch (e) {
  // Graceful fallback for standalone CLI/scripts
}

class DailyAttendanceJobEngine {
  constructor() {
    this.schedulerTimer = null;
    this.isTicking = false;
  }

  /**
   * Get execution ledger
   */
  getLedger() {
    if (!fs.existsSync(LEDGER_FILE)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Save execution ledger
   */
  saveLedger(ledger) {
    try {
      fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), 'utf8');
    } catch (e) {
      console.error('[DailyAttendanceJob] Ledger save error:', e.message);
    }
  }

  /**
   * Get settings with defaults
   */
  getSettings() {
    let settings = {};
    if (storeService) {
      settings = storeService.getTable('settings') || {};
    }
    if (!settings || Object.keys(settings).length === 0) {
      const altSettingsPath = path.join(DATA_DIR, 'hrm_store.json');
      if (fs.existsSync(altSettingsPath)) {
        try {
          const store = JSON.parse(fs.readFileSync(altSettingsPath, 'utf8'));
          settings = store.settings || {};
        } catch (e) {}
      }
    }

    return {
      enabled: settings.dailyAttendanceEmailEnabled !== false && settings.dailyAttendanceEmailEnabled !== 'false',
      sendTime: settings.dailyAttendanceEmailTime || '18:00', // 6:00 PM
      timezone: settings.dailyAttendanceEmailTimezone || settings.timezone || 'Asia/Karachi',
      recipients: settings.dailyAttendanceEmailRecipients || 'admin@company.com, hr@company.com',
      companyName: settings.companyName || 'ApexHRM Enterprise',
      officeStartTime: settings.officeStartTime || '09:00',
      gracePeriod: parseInt(settings.gracePeriod || 15, 10),
      weekendDays: (settings.weekendDays || 'Sat,Sun').split(',').map(s => s.trim().toLowerCase())
    };
  }

  /**
   * Calculate target date string (YYYY-MM-DD) and current time (HH:mm) in configured timezone
   */
  getTimezoneContext(tz = 'Asia/Karachi') {
    const now = new Date();
    try {
      const dtfDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
      const dtfTime = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
      const dtfDay = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' });
      const dtfShortDay = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' });

      return {
        dateStr: dtfDate.format(now),
        timeStr: dtfTime.format(now),
        dayName: dtfDay.format(now),
        shortDay: dtfShortDay.format(now).toLowerCase(),
        nowUtc: now.toISOString()
      };
    } catch (e) {
      // Fallback to local machine date/time
      return {
        dateStr: now.toISOString().split('T')[0],
        timeStr: now.toTimeString().substring(0, 5),
        dayName: 'Today',
        shortDay: 'today',
        nowUtc: now.toISOString()
      };
    }
  }

  /**
   * Pure read-only aggregation of employee attendance and leaves
   */
  fetchSummaryData(targetDateStr, tzContext = null) {
    let employees = [];
    let attendance = [];
    let leaves = [];
    let holidays = [];

    if (storeService) {
      employees = storeService.getTable('employees') || [];
      attendance = storeService.getTable('attendance') || [];
      leaves = storeService.getTable('leaves') || storeService.getTable('leave_requests') || [];
      holidays = storeService.getTable('holidays') || [];
    } else {
      const storeFile = path.join(__dirname, '../../data/hrm_store.json');
      if (fs.existsSync(storeFile)) {
        try {
          const raw = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
          employees = raw.employees || [];
          attendance = raw.attendance || [];
          leaves = raw.leaves || raw.leave_requests || [];
          holidays = raw.holidays || [];
        } catch (e) {}
      }
    }

    // Also inspect biometric hardware buffer for real-time punches
    const bufferFile = path.join(DATA_DIR, 'biometric_sync_buffer.json');
    if (fs.existsSync(bufferFile)) {
      try {
        const buffered = JSON.parse(fs.readFileSync(bufferFile, 'utf8') || '[]');
        buffered.forEach(b => {
          if (!b.timestamp || b.user_id === 'SYSTEM_HEARTBEAT') return;
          const bDate = b.timestamp.split('T')[0];
          if (bDate === targetDateStr) {
            const bTime = b.timestamp.split('T')[1]?.substring(0, 5) || '09:00';
            const matchedEmp = employees.find(e =>
              String(e.id) === String(b.user_id) ||
              String(e.empNo).toLowerCase() === String(b.user_id).toLowerCase() ||
              String(e.empNo).replace(/\D/g, '') === String(b.user_id).replace(/\D/g, '')
            );
            if (matchedEmp) {
              let existingAtt = attendance.find(a => a.employeeId === matchedEmp.id && a.date === targetDateStr);
              if (!existingAtt) {
                attendance.push({
                  id: `bio_${matchedEmp.id}`,
                  employeeId: matchedEmp.id,
                  date: targetDateStr,
                  timeIn: bTime,
                  timeOut: null,
                  status: 'present',
                  device: b.device_name || 'Biometric Hardware'
                });
              }
            }
          }
        });
      } catch (e) {}
    }

    const cfg = this.getSettings();
    const activeEmployees = employees.filter(e => e.status === 'active');
    const [startH, startM] = (cfg.officeStartTime || '09:00').split(':').map(Number);
    const graceCutoffMinutes = (startH * 60 + startM) + (cfg.gracePeriod || 15);

    // 1. Identify Present & Late Employees
    const presentMap = new Map();
    attendance.forEach(att => {
      if (att.date === targetDateStr) {
        const emp = activeEmployees.find(e => e.id === att.employeeId);
        if (emp && !presentMap.has(emp.id)) {
          const punchTime = att.timeIn || att.checkIn || '09:00';
          const [pH, pM] = punchTime.split(':').map(Number);
          const punchMinutes = pH * 60 + pM;
          const isLate = punchMinutes > graceCutoffMinutes || att.status === 'late';
          const lateMinutes = isLate ? Math.max(0, punchMinutes - (startH * 60 + startM)) : 0;

          presentMap.set(emp.id, {
            id: emp.id,
            empNo: emp.empNo || `EMP-${emp.id}`,
            fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
            department: emp.departmentName || emp.department || 'Operations',
            checkIn: punchTime,
            checkOut: att.timeOut || att.checkOut || null,
            device: att.device || 'Biometric Hardware',
            isLate,
            lateMinutes
          });
        }
      }
    });

    const presentList = Array.from(presentMap.values());

    // 2. Identify Employees on Approved Leave
    const leaveMap = new Map();
    leaves.forEach(l => {
      const isApproved = l.status === 'approved' || l.status === 'Approved';
      if (isApproved && l.startDate && l.endDate) {
        if (targetDateStr >= l.startDate && targetDateStr <= l.endDate) {
          const emp = activeEmployees.find(e => e.id === l.employeeId);
          if (emp && !presentMap.has(emp.id) && !leaveMap.has(emp.id)) {
            leaveMap.set(emp.id, {
              id: emp.id,
              empNo: emp.empNo || `EMP-${emp.id}`,
              fullName: emp.fullName || 'Employee',
              department: emp.departmentName || emp.department || 'Operations',
              leaveType: l.leaveType || l.type || 'Approved Leave',
              reason: l.reason || 'Official Approved Leave'
            });
          }
        }
      }
    });

    const leaveList = Array.from(leaveMap.values());

    // 3. Identify Absent Employees (Active employees not present and not on leave)
    const absentList = [];
    activeEmployees.forEach(emp => {
      if (!presentMap.has(emp.id) && !leaveMap.has(emp.id)) {
        absentList.push({
          id: emp.id,
          empNo: emp.empNo || `EMP-${emp.id}`,
          fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
          department: emp.departmentName || emp.department || 'Operations',
          designation: emp.designationName || emp.designation || 'Staff',
          phone: emp.phone || 'N/A'
        });
      }
    });

    const totalActive = activeEmployees.length;
    const presentCount = presentList.length;
    const lateCount = presentList.filter(p => p.isLate).length;
    const leaveCount = leaveList.length;
    const absentCount = absentList.length;
    const attendanceRate = totalActive > 0 ? Math.round((presentCount / totalActive) * 100) + '%' : '0%';

    return {
      companyName: cfg.companyName,
      dateStr: targetDateStr,
      dayName: tzContext?.dayName || 'Working Day',
      timezone: cfg.timezone,
      totalActive,
      presentCount,
      lateCount,
      leaveCount,
      absentCount,
      attendanceRate,
      presentList,
      leaveList,
      absentList
    };
  }

  /**
   * Execute Daily Attendance Summary Job
   */
  async executeJob(options = {}) {
    const {
      force = false,
      targetDate = null,
      triggerSource = 'scheduler',
      testRecipient = null
    } = options;

    const cfg = this.getSettings();
    const tzContext = this.getTimezoneContext(cfg.timezone);
    const dateToProcess = targetDate || tzContext.dateStr;

    // Check Automation Enabled
    if (!cfg.enabled && !force && triggerSource === 'scheduler') {
      console.log(`[DailyAttendanceJob] Job skipped: Automation is disabled in settings.`);
      return { success: false, skipped: true, reason: 'automation_disabled' };
    }

    // Check Duplicate Ledger (Prevent sending twice for the same date unless forced)
    const ledger = this.getLedger();
    const existingSuccess = ledger.find(l => l.date === dateToProcess && l.status === 'success');

    if (existingSuccess && !force && !testRecipient) {
      console.log(`[DailyAttendanceJob] Summary for ${dateToProcess} already successfully dispatched at ${existingSuccess.sentAt}. Skipping duplicate execution.`);
      return {
        success: true,
        skipped: true,
        reason: 'already_sent_today',
        date: dateToProcess,
        previousSentAt: existingSuccess.sentAt
      };
    }

    console.log(`\n🚀 [DailyAttendanceJob] Executing Daily Attendance Summary for [${dateToProcess}] (Trigger: ${triggerSource})...`);
    const startTime = Date.now();

    try {
      // 1. Compile Read-Only Summary
      const summaryData = this.fetchSummaryData(dateToProcess, tzContext);

      // 2. Generate Professional HTML Email
      const htmlContent = emailService.generateDailyAttendanceHtml(summaryData);

      // 3. Resolve Target Recipients
      const recipients = testRecipient || cfg.recipients;
      const subject = `Daily Attendance Summary — ${dateToProcess} (${summaryData.attendanceRate} Present)`;

      // 4. Dispatch Email
      const dispatchResult = await emailService.sendSummaryEmail({
        recipients,
        subject,
        htmlContent,
        summaryData,
        customSettings: cfg
      });

      // 5. Record Success Entry in Ledger
      const durationMs = Date.now() - startTime;
      const successEntry = {
        id: `job_${Date.now()}`,
        date: dateToProcess,
        triggeredAt: new Date().toISOString(),
        timezone: cfg.timezone,
        status: 'success',
        triggerSource,
        recipients: dispatchResult.recipients,
        stats: {
          totalActive: summaryData.totalActive,
          presentCount: summaryData.presentCount,
          lateCount: summaryData.lateCount,
          leaveCount: summaryData.leaveCount,
          absentCount: summaryData.absentCount,
          attendanceRate: summaryData.attendanceRate
        },
        durationMs,
        archivedFile: dispatchResult.archivedFile,
        error: null,
        sentAt: new Date().toISOString()
      };

      // Keep last 100 entries in ledger
      const updatedLedger = [successEntry, ...ledger.filter(l => l.date !== dateToProcess || l.status !== 'success')].slice(0, 100);
      this.saveLedger(updatedLedger);

      // Also record in store email_logs if available
      if (storeService) {
        const emailLogs = storeService.getTable('email_logs') || [];
        emailLogs.push({
          id: Date.now(),
          recipient: dispatchResult.recipients.join(', '),
          subject,
          templateCode: 'DAILY_ATTENDANCE_SUMMARY',
          status: 'sent',
          provider: process.env.SMTP_HOST ? 'SMTP' : 'Local Stream / Archive',
          sentAt: new Date().toISOString(),
          errorMessage: null
        });
        storeService.setTable('email_logs', emailLogs);
      }

      console.log(`✅ [DailyAttendanceJob] Summary for ${dateToProcess} sent successfully in ${durationMs}ms to ${dispatchResult.recipients.length} recipients.\n`);

      return {
        success: true,
        date: dateToProcess,
        recipients: dispatchResult.recipients,
        stats: summaryData,
        archivedFile: dispatchResult.archivedFile,
        durationMs
      };

    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error(`❌ [DailyAttendanceJob] Failed execution for ${dateToProcess}:`, err.message);

      // Record Failed Entry in Ledger for Retry Tracking
      const failedEntry = {
        id: `job_err_${Date.now()}`,
        date: dateToProcess,
        triggeredAt: new Date().toISOString(),
        timezone: cfg.timezone,
        status: 'failed',
        triggerSource,
        recipients: testRecipient ? [testRecipient] : cfg.recipients,
        stats: null,
        durationMs,
        error: err.message,
        errorStack: err.stack,
        sentAt: null
      };

      const updatedLedger = [failedEntry, ...ledger].slice(0, 100);
      this.saveLedger(updatedLedger);

      throw err;
    }
  }

  /**
   * Start in-process 60-second scheduler ticker
   */
  startSchedulerTicker() {
    if (this.schedulerTimer) return;

    console.log(`[DailyAttendanceJob] 🕒 Scheduler daemon initialized (checking every 60s)...`);

    // Run first check after 5 seconds, then every 60 seconds
    setTimeout(() => this.tick(), 5000);
    this.schedulerTimer = setInterval(() => this.tick(), 60000);
  }

  /**
   * Scheduler tick handler
   */
  async tick() {
    if (this.isTicking) return;
    this.isTicking = true;

    try {
      const cfg = this.getSettings();
      if (!cfg.enabled) {
        this.isTicking = false;
        return;
      }

      const tzContext = this.getTimezoneContext(cfg.timezone);
      const currentHM = tzContext.timeStr; // e.g. "18:00"
      const targetHM = cfg.sendTime;       // e.g. "18:00"

      if (currentHM === targetHM) {
        const ledger = this.getLedger();
        const alreadyRanToday = ledger.some(l => l.date === tzContext.dateStr && l.status === 'success');

        if (!alreadyRanToday) {
          console.log(`[DailyAttendanceJob] ⏰ Clock matched scheduled time (${currentHM}) in ${cfg.timezone}. Firing automated job...`);
          await this.executeJob({ force: false, triggerSource: 'scheduler' });
        }
      }
    } catch (e) {
      console.error('[DailyAttendanceJob] Scheduler tick error:', e.message);
    } finally {
      this.isTicking = false;
    }
  }

  /**
   * Stop scheduler
   */
  stopScheduler() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }
}

const instance = new DailyAttendanceJobEngine();
module.exports = instance;
