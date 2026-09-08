const express = require('express');
const router = express.Router();

// In-memory live notifications cache for fast real-time polling across sessions
let liveNotifications = [
  {
    id: 1,
    recipientEmpId: 4, // Fatima Raza
    recipientRole: 'employee',
    senderRole: 'hr_manager',
    senderName: 'Sara Malik (HR Manager)',
    type: 'doc_expiry',
    priority: 'urgent',
    title: '⚠️ Urgent: NADRA CNIC Expiry Notice (Renewal Required)',
    message: 'Your NADRA CNIC (No: 42201-4567890-4) will expire on 2026-09-28 (in 20 days). Please initiate NADRA renewal and upload your renewed attested smart copy to your e-DMS Document Vault.',
    actionUrl: 'employees',
    subView: 'doc_expiry',
    actionLabel: 'Update / Re-upload CNIC',
    read: false,
    createdAt: '2026-09-08T09:30:00.000Z'
  },
  {
    id: 2,
    recipientEmpId: 4, // Fatima Raza
    recipientRole: 'employee',
    senderRole: 'hr_manager',
    senderName: 'Sara Malik (HR Operations)',
    type: 'hr_letter',
    priority: 'normal',
    title: '📄 Official HR Document Issued: Salary Verification Certificate',
    message: 'Human Resources has generated and officially issued your Salary Verification Certificate (Ref: HRM/SAL/2026/014). Please review the letter and submit your electronic acknowledgment of receipt.',
    actionUrl: 'employees',
    subView: 'hr_letters',
    actionLabel: 'View & Acknowledge',
    read: false,
    createdAt: '2026-09-07T14:15:00.000Z'
  },
  {
    id: 3,
    recipientEmpId: 3, // Usman Baig
    recipientRole: 'dept_manager',
    senderRole: 'superadmin',
    senderName: 'Ahmed Khan (Super Admin)',
    type: 'policy_mandate',
    priority: 'high',
    title: '🛡️ Compliance Mandate: IT Security & Remote Access Policy v2.4',
    message: 'All Department Leads and engineering teams are required to execute electronic acknowledgment of the revised IT Security & Acceptable Use Policy before September 15.',
    actionUrl: 'events',
    subView: 'policies',
    actionLabel: 'Review & E-Sign',
    read: false,
    createdAt: '2026-09-06T11:00:00.000Z'
  }
];

let lastUpdatedTimestamp = Date.now();

// ── GET /api/notifications ──────────────────────────────────
// Retrieve targeted notifications with optional filters
router.get('/', (req, res) => {
  try {
    const { recipientEmpId, recipientRole, unreadOnly, since } = req.query;

    let filtered = [...liveNotifications];

    if (recipientEmpId) {
      filtered = filtered.filter(n => 
        (n.recipientEmpId && parseInt(n.recipientEmpId) === parseInt(recipientEmpId)) ||
        (!n.recipientEmpId && recipientRole && n.recipientRole === recipientRole)
      );
    } else if (recipientRole) {
      filtered = filtered.filter(n => !n.recipientEmpId || n.recipientRole === recipientRole);
    }

    if (unreadOnly === 'true' || unreadOnly === '1') {
      filtered = filtered.filter(n => !n.read);
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        filtered = filtered.filter(n => new Date(n.createdAt) > sinceDate);
      }
    }

    res.json({
      success: true,
      count: filtered.length,
      lastUpdated: lastUpdatedTimestamp,
      data: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: err.message });
  }
});

// ── GET /api/notifications/poll ─────────────────────────────
// Ultra-lightweight endpoint for high-frequency client polling
router.get('/poll', (req, res) => {
  try {
    const { recipientEmpId, recipientRole, since } = req.query;

    let targetNotifs = [...liveNotifications];

    if (recipientEmpId) {
      targetNotifs = targetNotifs.filter(n => 
        (n.recipientEmpId && parseInt(n.recipientEmpId) === parseInt(recipientEmpId)) ||
        (!n.recipientEmpId && recipientRole && n.recipientRole === recipientRole)
      );
    }

    const unreadCount = targetNotifs.filter(n => !n.read).length;
    let newNotifs = [];

    if (since) {
      const sinceNum = parseInt(since);
      const sinceDate = isNaN(sinceNum) ? new Date(since) : new Date(sinceNum);
      if (!isNaN(sinceDate.getTime())) {
        newNotifs = targetNotifs.filter(n => new Date(n.createdAt) > sinceDate);
      }
    }

    const latest = targetNotifs.length > 0 ? targetNotifs[0] : null;

    res.json({
      success: true,
      timestamp: Date.now(),
      totalCount: targetNotifs.length,
      unreadCount,
      latestId: latest ? latest.id : 0,
      hasNew: newNotifs.length > 0,
      newNotifs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Poll error', error: err.message });
  }
});

// ── POST /api/notifications ────────────────────────────────
// Dispatch a new live notification
router.post('/', (req, res) => {
  try {
    const {
      recipientEmpId,
      recipientRole,
      senderRole,
      senderName,
      type,
      priority,
      title,
      message,
      actionUrl,
      subView,
      actionLabel
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const nextId = liveNotifications.reduce((max, n) => Math.max(max, n.id || 0), 0) + 1;

    const newNotif = {
      id: nextId,
      recipientEmpId: recipientEmpId ? parseInt(recipientEmpId) : null,
      recipientRole: recipientRole || 'all',
      senderRole: senderRole || 'system',
      senderName: senderName || 'System',
      type: type || 'general',
      priority: priority || 'normal',
      title,
      message,
      actionUrl: actionUrl || 'dashboard',
      subView: subView || null,
      actionLabel: actionLabel || 'View Details',
      read: false,
      createdAt: new Date().toISOString()
    };

    liveNotifications.unshift(newNotif);
    // Keep max 200 notifications in memory
    if (liveNotifications.length > 200) {
      liveNotifications = liveNotifications.slice(0, 200);
    }
    lastUpdatedTimestamp = Date.now();

    res.status(201).json({
      success: true,
      message: 'Live notification dispatched successfully.',
      data: newNotif
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to dispatch notification', error: err.message });
  }
});

// ── PUT /api/notifications/:id/read ────────────────────────
// Mark a notification as read
router.put('/:id/read', (req, res) => {
  try {
    const notifId = parseInt(req.params.id);
    const notif = liveNotifications.find(n => n.id === notifId);

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notif.read = true;
    lastUpdatedTimestamp = Date.now();

    res.json({ success: true, message: 'Notification marked as read', data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification', error: err.message });
  }
});

// ── PUT /api/notifications/read-all ────────────────────────
// Mark all notifications read for recipient
router.put('/read-all', (req, res) => {
  try {
    const { recipientEmpId, recipientRole } = req.body;

    let updatedCount = 0;
    liveNotifications.forEach(n => {
      let matches = false;
      if (recipientEmpId && parseInt(n.recipientEmpId) === parseInt(recipientEmpId)) matches = true;
      if (!n.recipientEmpId && recipientRole && n.recipientRole === recipientRole) matches = true;
      if (!recipientEmpId && !recipientRole) matches = true;

      if (matches && !n.read) {
        n.read = true;
        updatedCount++;
      }
    });

    lastUpdatedTimestamp = Date.now();

    res.json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      updatedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications read', error: err.message });
  }
});

module.exports = router;
