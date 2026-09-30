/**
 * scripts/verify-message-ownership.js
 * Verification of message ownership alignment, outgoing vs incoming rendering,
 * counterparty display in 1-on-1 direct chats, and unread count isolation.
 */

const assert = require('assert');

console.log('════════════════════════════════════════════════════════════');
console.log('🔍 VERIFYING MESSAGE OWNERSHIP, OUTGOING UI & UNREAD ISOLATION');
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
      { id: 1, employeeId: 1, username: 'admin', role: 'superadmin', name: 'Ahmed Khan' },
      { id: 2, employeeId: 2, username: 'sara.malik', role: 'hr_manager', name: 'Sara Malik' }
    ],
    employees: [
      { id: 1, fullName: 'Ahmed Khan', designation: 'Super Admin / CEO', department: 'Executive', companyId: 1 },
      { id: 2, fullName: 'Sara Malik', designation: 'HR Director', department: 'Human Resources', companyId: 1 }
    ],
    chat_channels: [
      {
        id: 'chan-sara',
        name: 'Sara Malik',
        username: 'sara.malik',
        type: 'direct',
        targetEmpId: 2,
        members: [1, 2]
      }
    ],
    chat_messages: []
  },
  get(key) { return this.data[key] || []; },
  set(key, val) { this.data[key] = val; }
};

global.Auth = {
  user: { id: 1, employeeId: 1, username: 'admin', role: 'superadmin', name: 'Ahmed Khan' },
  employee: { id: 1, fullName: 'Ahmed Khan', designation: 'Super Admin / CEO', department: 'Executive' },
  role: 'superadmin'
};

global.HRMWebSocket = {
  isConnected: true,
  isUserOnline(id) { return true; },
  on(event, fn) {},
  sendChatMessage(msg) {},
  sendTyping() {},
  sendReadReceipt() {},
  sendReaction() {}
};

global.document = {
  listeners: {},
  addEventListener(event, fn) { this.listeners[event] = fn; },
  getElementById(id) {
    return {
      id,
      style: {},
      classList: { add() {}, remove() {}, contains() { return false; } },
      innerHTML: '',
      value: ''
    };
  },
  querySelectorAll() { return []; },
  querySelector() { return null; }
};

const Chat = require('../js/chat.js');
Chat.init();

console.log('▶ CATEGORY 1: User & Ownership Resolution...');
const me = Chat.getCurrentUser();
check(me.id === 1, 'Current user correctly identified with id: 1');
check(me.fullName === 'Ahmed Khan', 'Current user correctly identified with fullName: "Ahmed Khan"');

const myMsg = { id: 'm-1', channelId: 'chan-sara', senderId: 1, senderName: 'Ahmed Khan', content: 'hio' };
const othersMsg = { id: 'm-2', channelId: 'chan-sara', senderId: 2, senderName: 'Sara Malik', content: 'hello sir' };

check(Chat.isMyMessage(myMsg) === true, 'Ahmed Khan message correctly identified as isMyMessage: true');
check(Chat.isMyMessage(othersMsg) === false, 'Sara Malik message correctly identified as isMyMessage: false');

console.log('\n▶ CATEGORY 2: Outgoing vs Incoming Message Bubble Rendering...');
const html = Chat.renderMessagesHTML([myMsg, othersMsg]);

// 1. Ahmed's own message must have 'outgoing', NOT 'incoming'
check(html.includes('teams-msg-row outgoing'), 'Ahmed\'s own message rendered with class "outgoing" (right-aligned)');
// 2. Outgoing messages must NOT render an avatar on the left
check(!html.includes('teams-avatar-wrap" style="width:32px;height:32px;font-size:11px;background:#f59e0b">AK'), 'Outgoing message does NOT render sender avatar');
// 3. Outgoing messages must NOT render sender name above the bubble
check(!html.includes('<span>Ahmed Khan</span>'), 'Outgoing message does NOT render "Ahmed Khan" sender name header');
// 4. Sara\'s message must have 'incoming' and render Sara\'s name
check(html.includes('teams-msg-row incoming'), 'Sara\'s message rendered with class "incoming" (left-aligned)');
check(html.includes('<span>Sara Malik</span>'), 'Sara\'s message correctly displays "Sara Malik" sender header');

console.log('\n▶ CATEGORY 3: Unread Count & Echo Prevention...');
Chat.unreadCounts['chan-sara'] = 0;
// Simulate WebSocket broadcasting Ahmed's own message back to him
Chat.handleIncomingMessage(myMsg);
check(Chat.unreadCounts['chan-sara'] === 0, 'Incoming self-message does NOT increment unread count');

// Simulate incoming message from Sara
Chat.activeChannelId = 'chan-wajiha'; // viewing another channel
Chat.handleIncomingMessage(othersMsg);
check(Chat.unreadCounts['chan-sara'] === 1, 'Message from counterparty increments unread count when not active');

console.log('\n▶ CATEGORY 4: Counterparty Dynamic Header Display...');
const channel = DB.get('chat_channels').find(c => c.id === 'chan-sara') || DB.get('chat_channels')[0];
const displayInfo = Chat.getChannelDisplayInfo(channel);
check(displayInfo.name === 'Sara Malik', '1-on-1 direct channel displays counterparty name "Sara Malik" for Ahmed Khan');

console.log('\n════════════════════════════════════════════════════════════');
console.log(`📊 MESSAGE OWNERSHIP VERIFICATION: ${passedChecks} OF ${totalChecks} CHECKS PASSED`);
console.log('════════════════════════════════════════════════════════════\n');
