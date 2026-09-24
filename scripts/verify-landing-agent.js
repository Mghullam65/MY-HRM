/**
 * Automated Verification: HRM Pro Landing Agent & Chat Isolation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting HRM Pro Landing Agent & Chatbox Isolation Verification...\n');

// Mock DOM
global.window = global;
global.window.scrollTo = () => {};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); }
};

const domElements = {};

function createMockElement(id, tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      toggle: function(c, force) {
        if (force !== undefined) {
          if (force) this.classes.add(c); else this.classes.delete(c);
        } else {
          if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
        }
      },
      contains: function(c) { return this.classes.has(c); }
    },
    attributes: {},
    setAttribute: function(k, v) { this.attributes[k] = String(v); },
    getAttribute: function(k) { return this.attributes[k] || null; },
    removeAttribute: function(k) { delete this.attributes[k]; },
    style: {},
    innerHTML: '',
    textContent: '',
    value: '',
    dataset: {},
    focus: function() {},
    scrollIntoView: function() {},
    appendChild: function(c) { if (c) this.children.push(c); },
    removeChild: function(c) { this.children = this.children.filter(x => x !== c); },
    remove: function() {},
    querySelector: function(sel) { return null; },
    querySelectorAll: function(sel) { return []; },
    addEventListener: function() {},
    children: []
  };
  domElements[id] = el;
  return el;
}

global.document = {
  documentElement: createMockElement('html'),
  body: createMockElement('body'),
  createElement: function(tag) { return createMockElement('mock_' + Math.random(), tag); },
  getElementById: function(id) {
    if (!domElements[id]) domElements[id] = createMockElement(id);
    return domElements[id];
  },
  querySelectorAll: function(sel) { return []; },
  querySelector: function(sel) { return null; },
  addEventListener: function() {}
};

// Global mocks
global.Utils = {
  escapeHtml: (s) => String(s),
  today: () => '2026-09-24',
  avatarColor: () => '#2563eb',
  avatarInitials: () => 'AK',
  renderSkeleton: () => '<div class="skeleton-shimmer"></div>'
};

global.DB = {
  get: () => [],
  getObj: () => ({ companyName: 'HRM Pro' }),
  set: () => {}
};

global.Auth = {
  user: null,
  role: 'superadmin',
  isLoggedIn: () => false,
  getSidebarItems: () => []
};

global.Chat = {
  closeDrawer: () => {
    const d = document.getElementById('chat-drawer');
    if (d) d.classList.remove('open');
  }
};

// 1. Load Landing Agent
eval(fs.readFileSync(path.join(__dirname, '../js/landingAgent.js'), 'utf8'));

// --- Step 1: Testing LandingAgent Knowledge Base & Queries ---
console.log('--- Step 1: Testing LandingAgent Knowledge & FAQ Responses ---');
if (typeof LandingAgent === 'undefined') throw new Error('LandingAgent not defined');
console.log('  ✅ LandingAgent module defined successfully');

// Initialize Agent
LandingAgent.init();
console.log('  ✅ LandingAgent initialized with greeting and FAQ chips');

// Test 1: Payroll and Tax Engine query
const taxAnswer = LandingAgent.matchQueryToKnowledge('tell me about payroll tax slabs and fbr calculations');
if (!taxAnswer.includes('Progressive Pakistan Tax Engine') || !taxAnswer.includes('FBR progressive tax slabs')) {
  throw new Error('Payroll tax answer missing key compliance details');
}
console.log('  ✅ Query "payroll tax slabs" returned accurate Pakistan FBR tax details');

// Test 2: Shift swap query
const shiftAnswer = LandingAgent.matchQueryToKnowledge('how do shift swaps work in attendance?');
if (!shiftAnswer.includes('Peer-to-Peer Shift Swaps') || !shiftAnswer.includes('mutual consent')) {
  throw new Error('Shift swap answer missing peer workflow details');
}
console.log('  ✅ Query "shift swaps" returned peer consent & rostering details');

// Test 3: Disciplinary inquiry & Show-Cause Notice query
const scnAnswer = LandingAgent.matchQueryToKnowledge('explain the show cause notice and inquiry committee');
if (!scnAnswer.includes('Show-Cause Notice (SCN)') || !scnAnswer.includes('7-Day Reply Mandate')) {
  throw new Error('Show cause notice answer missing 7-day mandate or SCN details');
}
console.log('  ✅ Query "show cause notice" returned statutory 7-day inquiry details');

// Test 4: Performance Merit Increment Matrix query
const meritAnswer = LandingAgent.matchQueryToKnowledge('how does the merit increment matrix work?');
if (!meritAnswer.includes('Merit Increment Matrix') || !meritAnswer.includes('Grade A')) {
  throw new Error('Merit increment answer missing rating tiers');
}
console.log('  ✅ Query "merit increment matrix" returned Grade A-D compensation tiers');

// Test 5: Leave carry-forward and encashment query
const leaveAnswer = LandingAgent.matchQueryToKnowledge('what is the leave carry forward and encashment rule?');
if (!leaveAnswer.includes('10-day carry-forward') || !leaveAnswer.includes('surplus × (gross/30)')) {
  throw new Error('Leave encashment answer missing statutory formula');
}
console.log('  ✅ Query "leave carry forward" returned 10-day carry-forward and encashment formula');

// Test 6: Recruitment ATS query
const atsAnswer = LandingAgent.matchQueryToKnowledge('tell me about the recruitment ats and hiring pipeline');
if (!atsAnswer.includes('Kanban Pipeline') || !atsAnswer.includes('offer letter')) {
  throw new Error('ATS answer missing pipeline or offer letters');
}
console.log('  ✅ Query "recruitment ats" returned Kanban and offer letter details');

// Test 7: UI Pro Suite & Themes query
const uiAnswer = LandingAgent.matchQueryToKnowledge('what themes and keyboard shortcuts are available?');
if (!uiAnswer.includes('Obsidian Dark') || !uiAnswer.includes('Spotlight Command Palette')) {
  throw new Error('UI suite answer missing theme or spotlight info');
}
console.log('  ✅ Query "themes and shortcuts" returned Obsidian Dark, light, and chord shortcuts');

// --- Step 2: Testing Widget Open/Close States ---
console.log('\n--- Step 2: Testing LandingAgent UI Toggle & Modal Physics ---');
const panel = document.getElementById('landing-agent-panel');
const launcher = document.getElementById('landing-agent-launcher');

LandingAgent.open();
if (!panel.classList.contains('open')) throw new Error('Panel should have .open class when opened');
console.log('  ✅ LandingAgent opened successfully');

LandingAgent.close();
if (panel.classList.contains('open')) throw new Error('Panel should not have .open class after close');
console.log('  ✅ LandingAgent closed successfully');

// --- Step 3: Testing Chat Isolation & Page Routing ---
console.log('\n--- Step 3: Testing Page State Routing & Team Chat Isolation ---');
eval(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'));

const chatLauncher = document.getElementById('chat-floating-launcher');

// 1. Visit Landing Page
App.showLanding(false);
if (chatLauncher.style.display !== 'none') throw new Error('Team chat launcher must be hidden on landing page');
if (launcher.style.display !== 'flex') throw new Error('Landing agent launcher must be visible on landing page');
if (document.body.classList.contains('app-workspace-active')) throw new Error('Body must not have app-workspace-active on landing page');
console.log('  ✅ On Landing Page: Team Chatbox is HIDDEN, HRM Pro Feature Agent is VISIBLE');

// 2. Visit Sign In Page
App.showLogin(false);
if (chatLauncher.style.display !== 'none') throw new Error('Team chat launcher must be hidden on login page');
if (launcher.style.display !== 'none') throw new Error('Landing agent launcher must be hidden on login page');
console.log('  ✅ On Login Page: Both floating widgets are suppressed');

// 3. User logs in -> App Workspace
Auth.isLoggedIn = () => true;
Auth.employee = { id: 1, fullName: 'Ahmed Khan' };
App.showApp();
if (chatLauncher.style.display !== 'flex') throw new Error('Team chat launcher must be visible inside app workspace');
if (launcher.style.display !== 'none') throw new Error('Landing agent launcher must be hidden inside app workspace');
if (!document.body.classList.contains('app-workspace-active')) throw new Error('Body must have app-workspace-active in app workspace');
console.log('  ✅ Inside App Workspace: Team Chatbox is VISIBLE for authenticated staff, Landing Agent is HIDDEN');

console.log('\n🎉 ALL HRM PRO LANDING AGENT & CHAT ISOLATION TESTS PASSED (100%)!\n');
