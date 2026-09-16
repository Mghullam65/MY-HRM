const express = require('express');
const jobEngine = require('../jobs/dailyAttendanceSummary');

const router = express.Router();

/**
 * GET /api/jobs/daily-attendance-summary/status
 * Returns current scheduler status, today's run status, and recent execution ledger
 */
router.get('/daily-attendance-summary/status', async (req, res) => {
  try {
    const cfg = jobEngine.getSettings();
    const tzContext = jobEngine.getTimezoneContext(cfg.timezone);
    const ledger = jobEngine.getLedger();

    const todayEntry = ledger.find(l => l.date === tzContext.dateStr);

    res.json({
      success: true,
      config: {
        enabled: cfg.enabled,
        sendTime: cfg.sendTime,
        timezone: cfg.timezone,
        recipients: cfg.recipients,
        officeStartTime: cfg.officeStartTime,
        gracePeriod: cfg.gracePeriod
      },
      currentContext: {
        currentDate: tzContext.dateStr,
        currentTime: tzContext.timeStr,
        timezone: cfg.timezone,
        dayName: tzContext.dayName
      },
      todayStatus: todayEntry ? todayEntry.status : 'pending',
      lastExecution: ledger[0] || null,
      history: ledger.slice(0, 20)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve job status', error: err.message });
  }
});

/**
 * POST /api/jobs/daily-attendance-summary/run
 * Trigger manual execution or send test preview to specific email
 */
router.post('/daily-attendance-summary/run', async (req, res) => {
  try {
    const { force = true, testRecipient = null, targetDate = null } = req.body || {};

    const result = await jobEngine.executeJob({
      force: force === true || force === 'true',
      testRecipient: testRecipient ? String(testRecipient).trim() : null,
      targetDate: targetDate ? String(targetDate).trim() : null,
      triggerSource: testRecipient ? 'test_preview' : 'manual_api'
    });

    res.json({
      success: true,
      message: result.skipped
        ? `Job skipped: ${result.reason}`
        : `Daily Attendance Summary dispatched successfully for ${result.date}`,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Failed to execute Daily Attendance Summary: ${err.message}`,
      error: err.message
    });
  }
});

/**
 * POST /api/jobs/daily-attendance-summary/retry
 * Retry a failed summary for a specific date
 */
router.post('/daily-attendance-summary/retry', async (req, res) => {
  try {
    const { date } = req.body || {};
    if (!date) {
      return res.status(400).json({ success: false, message: 'Missing target date parameter (YYYY-MM-DD).' });
    }

    const result = await jobEngine.executeJob({
      force: true,
      targetDate: date,
      triggerSource: 'retry'
    });

    res.json({
      success: true,
      message: `Retried Daily Attendance Summary for ${date} successfully.`,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Retry failed for ${req.body?.date}: ${err.message}`,
      error: err.message
    });
  }
});

/**
 * GET /api/cron/daily-attendance-summary
 * Vercel Cron or external scheduler entry point
 */
router.get('/cron/daily-attendance-summary', async (req, res) => {
  try {
    const secret = req.headers['x-cron-secret'] || req.query.secret;
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid cron secret.' });
    }

    const cfg = jobEngine.getSettings();
    if (!cfg.enabled) {
      return res.json({ success: true, status: 'skipped', reason: 'automation_disabled' });
    }

    const tzContext = jobEngine.getTimezoneContext(cfg.timezone);
    const ledger = jobEngine.getLedger();
    const alreadyRanToday = ledger.some(l => l.date === tzContext.dateStr && l.status === 'success');

    if (alreadyRanToday) {
      return res.json({
        success: true,
        status: 'skipped',
        reason: 'already_sent_today',
        date: tzContext.dateStr
      });
    }

    // If running under cron check: check if current time is past or equal to sendTime
    const [currH, currM] = tzContext.timeStr.split(':').map(Number);
    const [targetH, targetM] = cfg.sendTime.split(':').map(Number);
    const currTotalMinutes = currH * 60 + currM;
    const targetTotalMinutes = targetH * 60 + targetM;

    // Run if we have reached or passed the configured time today
    if (currTotalMinutes >= targetTotalMinutes) {
      const result = await jobEngine.executeJob({
        force: false,
        triggerSource: 'vercel_cron'
      });
      return res.json({ success: true, status: 'executed', data: result });
    }

    return res.json({
      success: true,
      status: 'pending',
      currentTime: tzContext.timeStr,
      scheduledTime: cfg.sendTime,
      timezone: cfg.timezone,
      message: 'Scheduled time not yet reached today.'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Cron execution error', error: err.message });
  }
});

module.exports = router;
