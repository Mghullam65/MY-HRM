const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const chatUploadsDir = path.join(__dirname, '../../uploads/chat');
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// In-memory store initialized with enterprise collaboration seed data
let channels = [
  {
    id: 'chan-1',
    name: 'All-Hands & Announcements',
    type: 'group',
    scope: 'all_company',
    companyId: 1,
    companyName: 'Apex Holdings Inc.',
    description: 'Corporate announcements, town halls, and general workforce updates.',
    createdBy: 1,
    createdByName: 'Ahmed Khan (Executive Director)',
    avatar: 'fa-bullhorn',
    createdAt: '2026-09-01T08:00:00.000Z',
    members: [1, 2, 3, 4, 5, 6]
  },
  {
    id: 'chan-2',
    name: 'Cross-Company Leadership Hub',
    type: 'cross_company',
    scope: 'executives',
    companyId: 0, // Cross-company
    companyName: 'Group Holdings & Affiliates',
    description: 'Executive committee and department heads across sister entities.',
    createdBy: 1,
    createdByName: 'Ahmed Khan (Executive Director)',
    avatar: 'fa-building-columns',
    createdAt: '2026-09-02T10:30:00.000Z',
    members: [1, 2, 3]
  },
  {
    id: 'chan-3',
    name: 'Engineering & Tech Operations',
    type: 'group',
    scope: 'department',
    companyId: 1,
    companyName: 'Apex Holdings Inc.',
    description: 'Software development, infrastructure releases, and tech support sync.',
    createdBy: 3,
    createdByName: 'Bilal Ahmed (Lead Architect)',
    avatar: 'fa-code-branch',
    createdAt: '2026-09-03T11:00:00.000Z',
    members: [1, 3, 5]
  }
];

let messages = [
  {
    id: 'msg-1',
    channelId: 'chan-1',
    senderId: 1,
    senderName: 'Ahmed Khan',
    senderRole: 'Super Admin',
    senderCompany: 'Apex Holdings Inc.',
    content: 'Welcome everyone to the unified HRM Collaboration & Messaging Workspace! You can share files up to 10MB and launch scheduled meetings directly from here.',
    messageType: 'text',
    attachments: [],
    createdAt: '2026-09-10T09:00:00.000Z'
  },
  {
    id: 'msg-2',
    channelId: 'chan-1',
    senderId: 2,
    senderName: 'Sara Malik',
    senderRole: 'HR Manager',
    senderCompany: 'Apex Holdings Inc.',
    content: 'Here is the approved Employee Holiday Calendar and Q4 Policy Circular for reference.',
    messageType: 'file',
    attachments: [
      {
        id: 'att-1',
        fileName: 'Q4_Holiday_Schedule_2026.pdf',
        fileSize: 420800,
        fileType: 'application/pdf',
        fileUrl: '/uploads/chat/sample_holiday_schedule.pdf'
      }
    ],
    createdAt: '2026-09-10T09:15:00.000Z'
  },
  {
    id: 'msg-3',
    channelId: 'chan-2',
    senderId: 1,
    senderName: 'Ahmed Khan',
    senderRole: 'Super Admin',
    senderCompany: 'Apex Holdings Inc.',
    content: 'Leadership sync scheduled for Thursday. Review the attached consolidation model before joining.',
    messageType: 'file',
    attachments: [
      {
        id: 'att-2',
        fileName: 'Group_Consolidated_Budget_Q4.xlsx',
        fileSize: 852000,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileUrl: '/uploads/chat/sample_budget_model.xlsx'
      }
    ],
    createdAt: '2026-09-12T14:30:00.000Z'
  }
];

let meetings = [
  {
    id: 'meet-1',
    title: 'Executive Strategic Planning & Q4 Review',
    description: 'Quarterly review of company-wide performance metrics, hiring targets, and capital allocations.',
    meetingId: '849-204-118',
    passcode: 'HRM92X',
    hostId: 1,
    hostName: 'Ahmed Khan',
    hostCompany: 'Apex Holdings Inc.',
    startTime: '2026-09-25T10:00:00.000Z',
    durationMinutes: 60,
    isExternalAllowed: true,
    status: 'scheduled',
    attendees: [
      { id: 1, name: 'Ahmed Khan', email: 'ahmed.khan@apex.com', type: 'internal' },
      { id: 2, name: 'Sara Malik', email: 'sara.malik@apex.com', type: 'internal' },
      { id: 3, name: 'Bilal Ahmed', email: 'bilal.ahmed@apex.com', type: 'internal' },
      { email: 'investor.relations@venturecap.com', name: 'External Partner', type: 'external' }
    ]
  },
  {
    id: 'meet-2',
    title: 'Lead Full-Stack Engineer Technical Interview',
    description: 'Live coding walkthrough and technical architecture discussion with shortlisted candidate.',
    meetingId: '731-905-442',
    passcode: 'TECH45',
    hostId: 2,
    hostName: 'Sara Malik',
    hostCompany: 'Apex Holdings Inc.',
    startTime: '2026-09-26T15:00:00.000Z',
    durationMinutes: 45,
    isExternalAllowed: true,
    status: 'scheduled',
    attendees: [
      { id: 2, name: 'Sara Malik', email: 'sara.malik@apex.com', type: 'internal' },
      { id: 3, name: 'Bilal Ahmed', email: 'bilal.ahmed@apex.com', type: 'internal' },
      { email: 'candidate.tariq@gmail.com', name: 'Tariq Mansoor', type: 'external' }
    ]
  }
];

// Helper: Format 9-digit meeting ID
function generateMeetingId() {
  const n = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${n.substring(0, 3)}-${n.substring(3, 6)}-${n.substring(6, 9)}`;
}

// Helper: Format 6-character alphanumeric passcode
function generatePasscode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ── GET /api/chat/channels ──────────────────────────────────
// Returns accessible channels and 1-on-1 direct conversations for user
router.get('/channels', (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId) : null;
  const userCompanyId = req.query.companyId ? parseInt(req.query.companyId) : null;

  let accessibleChannels = channels;
  if (userId) {
    accessibleChannels = channels.filter(c => {
      if (c.type === 'direct') {
        return c.members.includes(userId);
      }
      if (c.type === 'cross_company' || c.scope === 'all_company') {
        return true;
      }
      return c.members.includes(userId);
    });
  }

  res.json({
    success: true,
    channels: accessibleChannels
  });
});

// ── POST /api/chat/channels ─────────────────────────────────
// Create office group or initiate direct chat
router.post('/channels', (req, res) => {
  const { name, type, scope, companyId, companyName, description, createdBy, createdByName, members, avatar } = req.body;

  if (type === 'direct') {
    // Check if direct channel already exists between these 2 users
    const [u1, u2] = members || [];
    const existing = channels.find(c => c.type === 'direct' && c.members.includes(u1) && c.members.includes(u2));
    if (existing) {
      return res.json({ success: true, channel: existing, isExisting: true });
    }
  }

  const newChannel = {
    id: `chan-${Date.now()}`,
    name: name || 'New Chat',
    type: type || 'group',
    scope: scope || 'custom',
    companyId: companyId || 0,
    companyName: companyName || 'Enterprise',
    description: description || '',
    createdBy: createdBy || 1,
    createdByName: createdByName || 'Admin',
    avatar: avatar || (type === 'direct' ? 'fa-user' : 'fa-users'),
    createdAt: new Date().toISOString(),
    members: Array.isArray(members) ? members : [createdBy]
  };

  channels.unshift(newChannel);
  res.status(201).json({ success: true, channel: newChannel });
});

// ── GET /api/chat/messages/:channelId ───────────────────────
// Fetch messages for a channel
router.get('/messages/:channelId', (req, res) => {
  const { channelId } = req.params;
  const channelMsgs = messages.filter(m => m.channelId === channelId);
  res.json({ success: true, messages: channelMsgs });
});

// ── POST /api/chat/messages ─────────────────────────────────
// Post message to a channel
router.post('/messages', (req, res) => {
  const { channelId, senderId, senderName, senderRole, senderCompany, content, messageType, attachments } = req.body;

  if (!channelId || !senderId || (!content && (!attachments || attachments.length === 0))) {
    return res.status(400).json({ success: false, message: 'Message content or attachment required' });
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    channelId,
    senderId: parseInt(senderId),
    senderName: senderName || 'User',
    senderRole: senderRole || 'Employee',
    senderCompany: senderCompany || 'Company',
    content: content || '',
    messageType: messageType || (attachments && attachments.length > 0 ? 'file' : 'text'),
    attachments: attachments || [],
    createdAt: new Date().toISOString()
  };

  messages.push(newMsg);
  res.status(201).json({ success: true, message: newMsg });
});

// ── POST /api/chat/upload ───────────────────────────────────
// Enforces strict 10MB limit and saves PDF, Excel, Word, or Image files
router.post('/upload', (req, res) => {
  const { fileName, fileType, fileData } = req.body;

  if (!fileName || !fileData) {
    return res.status(400).json({ success: false, message: 'Missing fileName or fileData' });
  }

  let base64Content = fileData;
  if (base64Content.includes(';base64,')) {
    base64Content = base64Content.split(';base64,')[1];
  }

  const buffer = Buffer.from(base64Content, 'base64');
  const maxBytes = 10 * 1024 * 1024; // 10MB limit

  if (buffer.length > maxBytes) {
    return res.status(413).json({
      success: false,
      message: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum allowed limit of 10MB.`
    });
  }

  // Sanitize filename & create unique disk name
  const ext = path.extname(fileName) || '.bin';
  const cleanBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const diskFileName = `${cleanBase}_${Date.now()}${ext}`;
  const diskPath = path.join(chatUploadsDir, diskFileName);

  fs.writeFileSync(diskPath, buffer);

  const fileUrl = `/uploads/chat/${diskFileName}`;
  res.json({
    success: true,
    fileName,
    diskFileName,
    fileSize: buffer.length,
    fileType: fileType || 'application/octet-stream',
    fileUrl
  });
});

// ── GET /api/chat/meetings ──────────────────────────────────
// Retrieve scheduled meetings
router.get('/meetings', (req, res) => {
  res.json({ success: true, meetings });
});

// ── POST /api/chat/meetings ─────────────────────────────────
// Schedule a meeting, generating unique 9-digit ID and 6-char passcode
router.post('/meetings', (req, res) => {
  const { title, description, hostId, hostName, hostCompany, startTime, durationMinutes, isExternalAllowed, attendees } = req.body;

  if (!title || !startTime) {
    return res.status(400).json({ success: false, message: 'Meeting title and start time are required' });
  }

  const meetingId = generateMeetingId();
  const passcode = generatePasscode();

  const newMeeting = {
    id: `meet-${Date.now()}`,
    title,
    description: description || '',
    meetingId,
    passcode,
    hostId: hostId ? parseInt(hostId) : 1,
    hostName: hostName || 'Host',
    hostCompany: hostCompany || 'Enterprise',
    startTime: new Date(startTime).toISOString(),
    durationMinutes: parseInt(durationMinutes) || 45,
    isExternalAllowed: isExternalAllowed !== false,
    status: 'scheduled',
    attendees: Array.isArray(attendees) ? attendees : [],
    createdAt: new Date().toISOString()
  };

  meetings.unshift(newMeeting);

  res.status(201).json({
    success: true,
    meeting: newMeeting,
    joinUrl: `/meet.html?id=${meetingId}&pwd=${passcode}`
  });
});

// ── POST /api/chat/meetings/verify ──────────────────────────
// Verification endpoint for internal or external attendees joining with ID and Passcode
router.post('/meetings/verify', (req, res) => {
  const { meetingId, passcode } = req.body;

  if (!meetingId || !passcode) {
    return res.status(400).json({ success: false, message: 'Meeting ID and Passcode are required' });
  }

  const cleanId = meetingId.trim().replace(/\s+/g, '');
  const cleanPasscode = passcode.trim().toUpperCase();

  const found = meetings.find(m => {
    const mClean = m.meetingId.trim().replace(/\s+/g, '');
    return (mClean === cleanId || m.meetingId === meetingId) && m.passcode.toUpperCase() === cleanPasscode;
  });

  if (!found) {
    return res.status(401).json({ success: false, message: 'Invalid Meeting ID or Passcode. Please check your credentials.' });
  }

  res.json({
    success: true,
    meeting: {
      id: found.id,
      title: found.title,
      description: found.description,
      meetingId: found.meetingId,
      hostName: found.hostName,
      hostCompany: found.hostCompany,
      startTime: found.startTime,
      durationMinutes: found.durationMinutes,
      status: found.status
    }
  });
});

module.exports = router;
