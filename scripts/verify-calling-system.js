// ============================================================
// Verification Script: Teams Video Call & Screen Sharing Diagnostic
// ============================================================

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('🧪 Starting Verification: Live Video Call & Screen-Sharing Diagnostic Simulation...\n');

// 1. Mock DOM
const domElements = {};
global.document = {
  createElement: (tag) => {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      id: '',
      style: {},
      children: [],
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        toggle(c, force) {
          if (force !== undefined) {
            if (force) this.classes.add(c);
            else this.classes.delete(c);
            return force;
          }
          if (this.classes.has(c)) { this.classes.delete(c); return false; }
          this.classes.add(c); return true;
        },
        contains(c) { return this.classes.has(c); }
      },
      appendChild(child) {
        this.children.push(child);
        if (child.id) domElements[child.id] = child;
      },
      remove() {
        if (this.id) delete domElements[this.id];
      }
    };
    return el;
  },
  getElementById: (id) => domElements[id] || null,
  body: {
    appendChild: (child) => {
      if (child.id) domElements[child.id] = child;
    }
  },
  addEventListener: () => {}
};

global.window = global;
global.Toast = { show() {} };
global.Modal = { show() {}, close() {} };
global.Utils = {
  avatarColor: () => '#464eb8',
  avatarInitials: (name) => (name || 'AB').substring(0, 2),
  today: () => '2026-09-24',
  generateId: () => Math.floor(Math.random() * 10000)
};

const store = {
  employees: [
    { id: 1, fullName: 'Ahmed Khan', email: 'ahmed@apex.com', designation: 'Super Admin' },
    { id: 2, fullName: 'Sara Malik', email: 'sara@apex.com', designation: 'HR Director' }
  ],
  helpdesk_tickets: [
    {
      id: 1,
      ticketNumber: 'TKT-2026-001',
      title: 'VPN Gateway Timeouts on Staging',
      category: 'it_support',
      priority: 'urgent',
      reporterId: 2,
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
      assignedTo: 2,
      isAnonymous: true,
      messages: []
    }
  ],
  chat_channels: [
    { id: 'dm-1-2', name: 'Sara Malik', type: 'direct', members: [1, 2] }
  ],
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

global.App = { navigate() {} };

vm.runInThisContext(fs.readFileSync('js/chat.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/helpdesk.js', 'utf8'));

Chat.init();

// --- TEST 1: Launch Diagnostic Call from Helpdesk Ticket ---
console.log('▶ Test 1: Launch Diagnostic Call from Helpdesk Ticket...');
Helpdesk.startDiagnosticCall(1);

assert(Chat.activeCall, 'Chat.activeCall should be initialized');
assert.strictEqual(Chat.activeCall.ticketNumber, 'TKT-2026-001', 'Active call should track ticketNumber');
assert.strictEqual(Chat.activeCall.ticketId, 1, 'Active call should track ticketId');
assert(domElements['teams-call-modal-overlay'], 'Modal overlay element should be attached to DOM');
console.log('  ✅ [PASS] Diagnostic call initiated with ticket telemetry and modal HUD');

// --- TEST 2: Whistleblower Anonymity Protection on Call Launch ---
console.log('▶ Test 2: Whistleblower Anonymity Protection...');
Chat.activeCall = null;
Helpdesk.startDiagnosticCall(2);
assert.strictEqual(Chat.activeCall, null, 'Call must NOT launch for anonymous whistleblower');
console.log('  ✅ [PASS] Whistleblower protected from live calling identification');

// --- TEST 3: Microphone and Camera Mute Toggling ---
console.log('▶ Test 3: Audio & Video Device Controls...');
Helpdesk.startDiagnosticCall(1);
assert.strictEqual(Chat.activeCall.isMuted, false, 'Default mic is unmuted');
Chat.toggleCallMic();
assert.strictEqual(Chat.activeCall.isMuted, true, 'Mic should be muted');
Chat.toggleCallMic();
assert.strictEqual(Chat.activeCall.isMuted, false, 'Mic should be unmuted');

assert.strictEqual(Chat.activeCall.isVideoOff, false, 'Default camera is on');
Chat.toggleCallCam();
assert.strictEqual(Chat.activeCall.isVideoOff, true, 'Camera should be off');
Chat.toggleCallCam();
assert.strictEqual(Chat.activeCall.isVideoOff, false, 'Camera should be on');
console.log('  ✅ [PASS] Mic & Camera device state transitions verified');

// --- TEST 4: Screen Share Diagnostic Remote Stream Toggle ---
console.log('▶ Test 4: Screen Share & Diagnostic Console...');
assert.strictEqual(Chat.activeCall.isScreenSharing, false, 'Default screen share is off');
Chat.toggleCallShare();
assert.strictEqual(Chat.activeCall.isScreenSharing, true, 'Screen share should be active');
Chat.runDiagnosticPing();
Chat.toggleCallShare();
assert.strictEqual(Chat.activeCall.isScreenSharing, false, 'Screen share toggles back to video grid');
console.log('  ✅ [PASS] Screen share console and telemetry ping verified');

// --- TEST 5: Meeting Notes & End Call Ticket Sync ---
console.log('▶ Test 5: Call Termination & Ticket History Sync...');
Chat.toggleCallNotes();
assert.strictEqual(Chat.activeCall.isNotesOpen, true, 'Notes panel should be open');
Chat.activeCall.durationSec = 195; // 3 min 15 sec

// Set note text
domElements['teams-call-notes-input'] = { value: 'Configured MTU to 1420 bytes on WireGuard. Handshake stable.' };

Chat.endCall();
assert.strictEqual(Chat.activeCall, null, 'Call state should be cleared on hangup');

// Check that ticket messages received diagnostic call summary
const tkt = store.helpdesk_tickets.find(x => x.id === 1);
assert(tkt.messages.length > 0, 'Ticket should have call log message');
const callLog = tkt.messages[tkt.messages.length - 1];
assert(callLog.text.includes('03:15'), 'Ticket message should record 03:15 duration');
assert(callLog.text.includes('Configured MTU to 1420 bytes'), 'Ticket message should record session notes');
console.log('  ✅ [PASS] Call duration & diagnostic notes automatically synchronized to ticket history');

// Check that chat message channel received the call end record
const chatMsgs = store.chat_messages;
assert(chatMsgs.length > 0, 'Chat channel should record call completion');
const lastMsg = chatMsgs[chatMsgs.length - 1];
assert(lastMsg.content.includes('03:15'), 'Chat record should display call duration');
assert(lastMsg.content.includes('#TKT-2026-001'), 'Chat record should link ticket number');
console.log('  ✅ [PASS] Chat channel updated with call summary');

console.log('\n🎉 ALL 5 CALLING & SCREEN SHARING TESTS PASSED PERFECTLY!\n');
