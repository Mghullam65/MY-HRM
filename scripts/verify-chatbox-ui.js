/**
 * scripts/verify-chatbox-ui.js
 * Verification suite for Chatbox UI, Colleague Username Autocomplete,
 * Direct 1-on-1 Conversations, Presence Tracking, and File Sharing.
 */

const assert = require('assert');

console.log('════════════════════════════════════════════════════════════');
console.log('💬 VERIFYING CHATBOX UI & COLLEAGUE USERNAME MESSAGING');
console.log('════════════════════════════════════════════════════════════\n');

let totalChecks = 0;
let passedChecks = 0;

function check(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. Mock DB and environment
global.DB = {
  data: {
    users: [
      { id: 1, employeeId: 1, username: 'admin', role: 'superadmin', status: 'active' },
      { id: 2, employeeId: 2, username: 'sara.malik', role: 'hr_manager', status: 'active' },
      { id: 3, employeeId: 3, username: 'usman.baig', role: 'dept_manager', status: 'active' },
      { id: 4, employeeId: 4, username: 'fatima.raza', role: 'employee', status: 'active' },
      { id: 5, employeeId: 26, username: 'saad.ibrahim', role: 'onboarding', status: 'active' },
    ],
    employees: [
      { id: 1, fullName: 'Super Admin', designation: 'Chief Executive', department: 'Executive', companyId: 1 },
      { id: 2, fullName: 'Sara Malik', designation: 'HR Director', department: 'Human Resources', companyId: 1 },
      { id: 3, fullName: 'Usman Baig', designation: 'Engineering Lead', department: 'Engineering', companyId: 1 },
      { id: 4, fullName: 'Fatima Raza', designation: 'Frontend Engineer', department: 'Engineering', companyId: 1 },
      { id: 26, fullName: 'Saad Ibrahim', designation: 'Talent Associate', department: 'Human Resources', companyId: 1 },
    ],
    chat_channels: [
      { id: 'chan-1', name: 'general', type: 'public', members: [1, 2, 3, 4, 26] }
    ],
    chat_messages: []
  },
  get(key) {
    return this.data[key] || [];
  },
  set(key, val) {
    this.data[key] = val;
  }
};

global.Auth = {
  employee: { id: 1, fullName: 'Super Admin', companyId: 1 },
  role: 'superadmin'
};

global.HRMWebSocket = {
  isConnected: true,
  isUserOnline(id) {
    return id === 2 || id === 3; // Sara and Usman online
  },
  sendChatMessage(msg) {},
  sendTyping() {},
  sendReadReceipt() {},
  sendReaction() {}
};

// Mock DOM
global.document = {
  listeners: {},
  addEventListener(event, fn) {
    this.listeners[event] = fn;
  },
  getElementById(id) {
    return {
      id,
      style: {},
      classList: {
        add() {},
        remove() {},
        contains() { return false; }
      },
      innerHTML: '',
      value: ''
    };
  },
  querySelector() { return null; }
};

// Load Chat module
const Chat = require('../js/chat.js');

console.log('▶ CATEGORY 1: Colleague Directory & Username Resolution...');
const members = Chat.getAllCompanyMembers();
check(members.length === 5, 'Resolved all 5 active company employees');

const sara = members.find(m => m.username === 'sara.malik');
check(sara !== undefined, 'Sara Malik found with login username @sara.malik');
check(sara && sara.isOnline === true, 'Sara Malik has active online presence (🟢 online)');
check(sara && sara.designation === 'HR Director', 'Sara Malik has correct designation');

const usman = members.find(m => m.username === 'usman.baig');
check(usman !== undefined, 'Usman Baig resolved with @usman.baig');
check(usman && usman.isOnline === true, 'Usman Baig is online');

const fatima = members.find(m => m.username === 'fatima.raza');
check(fatima !== undefined && fatima.isOnline === false, 'Fatima Raza resolved with offline presence');

console.log('\n▶ CATEGORY 2: Direct 1-on-1 Chat Initiation...');
Chat.startDirectChat(2); // Start DM with Sara Malik (id: 2)
const channels = DB.get('chat_channels');
const dm = channels.find(c => c.type === 'direct');
check(dm !== undefined, 'Direct 1-on-1 channel created in DB');
check(dm.members.includes(1) && dm.members.includes(2), 'Direct channel includes both Super Admin (1) and Sara Malik (2)');
check(dm.id === 'dm-1-2', 'Direct channel has deterministic canonical ID dm-1-2');
check(Chat.activeChannelId === 'dm-1-2', 'Chat controller switched active channel to dm-1-2');
check(Chat.viewMode === 'convo', 'Chat controller entered conversation view mode');

console.log('\n▶ CATEGORY 3: Direct Messaging by Login Username (@username)...');
Chat.startDirectChatByUsername('usman.baig');
const channelsAfterUsman = DB.get('chat_channels');
const usmanDM = channelsAfterUsman.find(c => c.id === 'dm-1-3');
check(usmanDM !== undefined, 'Colleague added and direct chat opened by username "usman.baig"');
check(usmanDM.members.includes(1) && usmanDM.members.includes(3), 'Usman DM channel has correct members [1, 3]');

Chat.startDirectChatByUsername('@fatima.raza');
const fatimaDM = DB.get('chat_channels').find(c => c.id === 'dm-1-4');
check(fatimaDM !== undefined, 'Colleague direct chat opened with leading "@" prefix ("@fatima.raza")');

console.log('\n▶ CATEGORY 4: Unread Count Badges & Notification Sounds...');
Chat.unreadCounts['chan-1'] = 3;
check(Chat.getTotalUnreadCount() >= 3, 'Total unread counts correctly calculated across channels');
Chat.markChannelAsRead('chan-1');
check(Chat.unreadCounts['chan-1'] === 0, 'Marking channel read clears its unread count');

console.log('\n▶ CATEGORY 5: File Attachments & Formatting...');
const formatted = Chat.formatMessageText('Check this out: https://example.com/doc and note\nNew line');
check(formatted.includes('<a href="https://example.com/doc"'), 'Auto-linked URL in message formatting');
check(formatted.includes('<br>'), 'Newlines converted to <br>');

const attHTML = Chat.renderAttachmentsHTML([
  { fileName: 'Q3_Report.pdf', fileType: 'application/pdf', fileSize: 1048576, fileUrl: 'data:pdf' }
]);
check(attHTML.includes('fa-file-pdf'), 'PDF attachment rendered with dedicated PDF icon');
check(attHTML.includes('1024 KB'), 'File size converted to readable KB');

console.log('\n════════════════════════════════════════════════════════════');
console.log(`📊 CHATBOX VERIFICATION: ${passedChecks} OF ${totalChecks} CHECKS PASSED`);
console.log('════════════════════════════════════════════════════════════\n');
