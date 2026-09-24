// ============================================================
// Verification Script: Helpdesk Tickets & Teams Chat Integration
// ============================================================

const assert = require('assert');
const fs = require('fs');

console.log('🧪 Starting Verification: Helpdesk Tickets & Teams Chat Integration...\n');

// 1. Mock minimal DOM and global HRM modules
global.document = {
  getElementById: (id) => ({
    value: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    focus() {},
    scrollTop: 0,
    scrollHeight: 100
  }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.window = global;
global.Toast = { show(msg, type) { console.log(`   [Toast ${type || 'info'}]: ${msg.replace(/<[^>]+>/g, '')}`); } };
global.Modal = {
  show(title, body) { console.log(`   [Modal.show]: ${title}`); },
  close(id) { console.log(`   [Modal.close]: ${id}`); }
};
global.Utils = {
  avatarColor: () => '#464eb8',
  avatarInitials: (name) => (name || 'AB').substring(0, 2),
  today: () => '2026-09-24',
  generateId: () => Math.floor(Math.random() * 10000)
};

// Mock store
const store = {
  employees: [
    { id: 1, fullName: 'Ahmed Khan', email: 'ahmed@apex.com', designation: 'Super Admin' },
    { id: 2, fullName: 'Sara Malik', email: 'sara@apex.com', designation: 'HR Director' },
    { id: 3, fullName: 'Usman Baig', email: 'usman@apex.com', designation: 'IT Support Lead' },
    { id: 4, fullName: 'Fatima Raza', email: 'fatima@apex.com', designation: 'Software Engineer' }
  ],
  helpdesk_tickets: [
    {
      id: 1,
      ticketNumber: 'TKT-2026-001',
      title: 'VPN Gateway Timeouts on Staging',
      category: 'it_support',
      priority: 'urgent',
      reporterId: 4,
      isAnonymous: false,
      assignedTo: 1,
      department: 'IT Infrastructure',
      status: 'in_progress',
      slaHours: 4,
      messages: []
    },
    {
      id: 2,
      ticketNumber: 'GRV-2026-002',
      title: 'Confidential Whistleblower Grievance',
      category: 'confidential_grievance',
      priority: 'urgent',
      reporterId: 0,
      anonymousToken: 'ANON-HASH-4412',
      isAnonymous: true,
      assignedTo: 2,
      department: 'Ethics Committee',
      status: 'open',
      slaHours: 24,
      messages: []
    }
  ],
  chat_channels: [],
  chat_messages: []
};

global.DB = {
  get: (k) => store[k] || [],
  set: (k, v) => { store[k] = v; },
  find: (k, id) => (store[k] || []).find(x => x.id === id),
  log: () => {}
};

global.Auth = {
  role: 'superadmin',
  user: { id: 1, name: 'Ahmed Khan', username: 'ahmed', employeeId: 1 },
  employee: { id: 1, fullName: 'Ahmed Khan', email: 'ahmed@apex.com' }
};

let navigatedTo = null;
global.App = {
  navigate(mod) {
    navigatedTo = mod;
    console.log(`   [App.navigate]: ${mod}`);
  }
};

const vm = require('vm');
vm.runInThisContext(fs.readFileSync('js/chat.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/helpdesk.js', 'utf8'));

Chat.init();

// --- TEST 1: Verify Helpdesk.chatWithParty exists and resolves targets ---
console.log('\n--- Test 1: Chat with Requester from Helpdesk Ticket ---');
// Ahmed (id 1) clicks "Chat Requester" on ticket 1 (reporter: Fatima Raza, id 4)
Helpdesk.chatWithParty(1, 'reporter');

assert.strictEqual(Chat.isOpen, true, 'Chat drawer should be open');
const activeChan = Chat.getActiveChannel();
assert(activeChan, 'Active channel should be created/selected');
assert(activeChan.members.includes(1) && activeChan.members.includes(4), 'Channel should include Ahmed & Fatima');
console.log('✅ Test 1 Passed: Direct chat with Requester successfully initiated');

// --- TEST 2: Verify Ticket Context Card Sent and Rendered ---
console.log('\n--- Test 2: Ticket Context Card in Chat ---');
const msgs = Chat.getMessages(activeChan.id);
assert(msgs.length > 0, 'A ticket context message should be posted');
const tktMsg = msgs.find(m => m.ticketContext && m.ticketContext.ticketId === 1);
assert(tktMsg, 'Message should have structured ticketContext');
assert.strictEqual(tktMsg.ticketContext.ticketNumber, 'TKT-2026-001');

const cardHtml = Chat.renderTicketCard(tktMsg.ticketContext, true);
assert(cardHtml.includes('TKT-2026-001'), 'Card HTML should display ticket number');
assert(cardHtml.includes('VPN Gateway Timeouts on Staging'), 'Card HTML should display title');
assert(cardHtml.includes('Chat.openTicketFromChat(1)'), 'Card HTML should have 1-click View in Helpdesk action');
console.log('✅ Test 2 Passed: Ticket context card properly formatted with back-link');

// --- TEST 3: Navigation from Chat back to Helpdesk ---
console.log('\n--- Test 3: 1-Click Back-Navigation from Chat to Helpdesk Ticket ---');
let workspaceOpenedId = null;
Helpdesk.openTicketWorkspace = (id) => {
  workspaceOpenedId = id;
  console.log(`   [Helpdesk.openTicketWorkspace]: ${id}`);
};

Chat.openTicketFromChat(1);
assert.strictEqual(navigatedTo, 'helpdesk', 'App.navigate should be called with "helpdesk"');

// Check delayed workspace open
setTimeout(() => {
  assert.strictEqual(workspaceOpenedId, 1, 'Helpdesk.openTicketWorkspace should be opened with ticket ID 1');
  console.log('✅ Test 3 Passed: Bidirectional navigation from Chat back to Helpdesk confirmed');

  // --- TEST 4: Anonymity Protection for Whistleblower Grievance ---
  console.log('\n--- Test 4: Anonymity Protection for Whistleblowers ---');
  const prevMsgCount = (store.chat_messages || []).length;
  // Attempting to chat with anonymous reporter on ticket 2
  Helpdesk.chatWithParty(2, 'reporter');
  assert.strictEqual((store.chat_messages || []).length, prevMsgCount, 'No direct chat message should be created for anonymous whistleblower');
  console.log('✅ Test 4 Passed: Whistleblower identity protected against direct chat extraction');

  // --- TEST 5: Auto-linking in formatMessageText ---
  console.log('\n--- Test 5: Auto-linking ticket numbers in messages ---');
  const formatted = Chat.formatMessageText('Please check #TKT-2026-001 for urgent updates');
  assert(formatted.includes('chat-ticket-inline-badge'), 'Should contain inline ticket badge');
  assert(formatted.includes('Chat.openTicketFromChatByNumber'), 'Should invoke ticket opener on click');
  console.log('✅ Test 5 Passed: Ticket numbers auto-linked into interactive Helpdesk chips');

  console.log('\n🎉 ALL 5 INTEGRATION TESTS PASSED PERFECTLY!\n');
}, 200);
