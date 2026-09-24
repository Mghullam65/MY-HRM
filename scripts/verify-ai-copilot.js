// ============================================================
// Verification Script: AI Copilot Context-Aware HRM Assistant
// ============================================================

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('🧪 Starting Verification: AI Copilot Enterprise Capabilities...\n');

// 1. Mock minimal DOM and global environment
global.document = {
  getElementById: (id) => ({
    value: '',
    style: {},
    innerHTML: '',
    classList: { add() {}, remove() {}, toggle() {} },
    focus() {},
    scrollTop: 0,
    scrollHeight: 100
  }),
  querySelectorAll: () => [],
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

// Store with realistic enterprise data
const store = {
  employees: [
    { id: 1, fullName: 'Ahmed Khan', email: 'ahmed@apex.com', designation: 'Super Admin' },
    { id: 2, fullName: 'Sara Malik', email: 'sara@apex.com', designation: 'HR Director' }
  ],
  leave_types: [
    { id: 1, name: 'Casual Leave', code: 'CL', maxDays: 12 },
    { id: 2, name: 'Annual Leave', code: 'AL', maxDays: 20 },
    { id: 3, name: 'Sick Leave', code: 'SL', maxDays: 15 }
  ],
  leave_balances: [
    { id: 1, employeeId: 1, year: 2026, balances: { '1': 10, '2': 18, '3': 14 } }
  ],
  leave_requests: [
    { id: 101, employeeId: 1, typeId: 2, days: 2, status: 'pending' }
  ],
  salary: [
    {
      id: 1,
      employeeId: 1,
      month: '2026-08',
      basic: 350000,
      allowances: 75000,
      deductions: 45000,
      tax: 69250,
      netSalary: 310750,
      status: 'processed',
      paidOn: '2026-08-31'
    }
  ],
  helpdesk_tickets: [
    {
      id: 1,
      ticketNumber: 'TKT-2026-001',
      title: 'VPN Gateway Timeouts on Staging',
      category: 'it_support',
      priority: 'urgent',
      reporterId: 1,
      assignedTo: 2,
      department: 'IT Infrastructure',
      status: 'in_progress',
      slaHours: 4,
      messages: [{ id: 1, text: 'Handshake timeout' }]
    }
  ],
  attendance: [
    {
      id: 1,
      employeeId: 1,
      date: new Date().toISOString().split('T')[0],
      timeIn: '09:05 AM',
      timeOut: '18:15 PM',
      status: 'present',
      device: 'ZKTeco-HQ-01'
    }
  ],
  chat_channels: [
    { id: 'chan-copilot', name: 'HRM AI Copilot', type: 'bot', isFavorite: true, members: [1, 999] }
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
Chat.init();

// Helper to test a Copilot query and wait for bot response
function testQuery(prompt) {
  return new Promise((resolve) => {
    Chat.activeChannelId = 'chan-copilot';
    Chat.handleCopilotQuery(prompt);
    setTimeout(() => {
      const msgs = store.chat_messages.filter(m => m.channelId === 'chan-copilot' && m.isBot);
      resolve(msgs[msgs.length - 1]);
    }, 700);
  });
}

async function runTests() {
  // Test 1: Real-time Leave Balance Query
  console.log('▶ Test 1: Query Leave Balance...');
  const res1 = await testQuery('How many annual leaves do I have left?');
  assert(res1 && res1.content, 'Bot should return a response');
  assert(res1.content.includes('Annual Leave (AL)') && res1.content.includes('18 of 20 days remaining'), 'Should return correct real-time balance');
  assert(res1.content.includes('pending leave application'), 'Should identify pending leave applications');
  console.log('  ✅ [PASS] Real-time leave quota and pending leaves verified');

  // Test 2: Real-time Salary & Payslip Query
  console.log('▶ Test 2: Query Salary & Payslip...');
  const res2 = await testQuery('Show me my latest salary and payslip breakdown');
  assert(res2 && res2.content, 'Bot should return salary response');
  assert(res2.content.includes('350,000'), 'Should contain basic salary');
  assert(res2.content.includes('310,750'), 'Should contain net salary take-home');
  assert(res2.content.includes('Section 149'), 'Should mention statutory tax withholding');
  console.log('  ✅ [PASS] Real-time salary breakdown, tax withholding & take-home verified');

  // Test 3: Specific Helpdesk Ticket Lookup with Rich Context Card
  console.log('▶ Test 3: Query Specific Ticket #TKT-2026-001...');
  const res3 = await testQuery('What is the status of ticket #TKT-2026-001?');
  assert(res3 && res3.content, 'Bot should return ticket details');
  assert(res3.content.includes('VPN Gateway Timeouts on Staging'), 'Should include ticket title');
  assert(res3.content.includes('IN_PROGRESS'), 'Should include ticket status');
  assert(res3.ticketContext, 'Should attach structured ticketContext');
  assert.strictEqual(res3.ticketContext.ticketNumber, 'TKT-2026-001', 'ticketContext number should match');
  console.log('  ✅ [PASS] Specific ticket lookup & interactive ticket context card verified');

  // Test 4: Real-time Attendance Telemetry
  console.log('▶ Test 4: Query Attendance & Check-in...');
  const res4 = await testQuery('What was my check-in time today?');
  assert(res4 && res4.content, 'Bot should return attendance telemetry');
  assert(res4.content.includes('09:05 AM'), 'Should return real punch in time');
  assert(res4.content.includes('ZKTeco-HQ-01'), 'Should return biometric terminal');
  console.log('  ✅ [PASS] Biometric punch telemetry verified');

  // Test 5: Corporate Expense Policy Cutoff
  console.log('▶ Test 5: Query Expense Reimbursement Policy...');
  const res5 = await testQuery('When is the expense reimbursement submission cutoff date?');
  assert(res5 && res5.content, 'Bot should return expense policy');
  assert(res5.content.includes('20th of each calendar month'), 'Should mention the 20th cutoff date');
  console.log('  ✅ [PASS] Expense cutoff date and receipt guidelines verified');

  // Test 6: AI Drafting Assistant (Leave Email Template)
  console.log('▶ Test 6: Request Leave Email Draft...');
  const res6 = await testQuery('Draft an annual leave request email for me');
  assert(res6 && res6.content, 'Bot should generate draft template');
  assert(res6.content.includes('Application for [Annual/Sick] Leave — Ahmed Khan'), 'Should customize subject with employee name');
  assert(res6.content.includes('Ahmed Khan'), 'Should include employee sign-off');
  console.log('  ✅ [PASS] AI leave request drafting assistant verified');

  console.log('\n🎉 ALL 6 AI COPILOT CAPABILITY TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
