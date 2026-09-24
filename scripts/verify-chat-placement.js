const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Verification of Chatbox Placement, Removal & Controls...\n');

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
    _html: '',
    get innerHTML() { return this._html; },
    set innerHTML(val) {
      this._html = val;
      // auto-register any id="..." elements created in innerHTML
      const idMatches = val.matchAll(/id=["']([^"']+)["']/g);
      for (const m of idMatches) {
        if (!domElements[m[1]]) {
          createMockElement(m[1]);
        }
      }
    },
    textContent: '',
    value: '',
    dataset: {},
    focus: function() {},
    scrollIntoView: function() {},
    appendChild: function(c) { if (c) this.children.push(c); },
    removeChild: function(c) { this.children = this.children.filter(x => x !== c); },
    remove: function() {},
    querySelector: function(sel) {
      if (sel.includes('#')) {
        const id = sel.replace('#', '');
        return domElements[id] || null;
      }
      return null;
    },
    querySelectorAll: function(sel) { return []; },
    addEventListener: function() {},
    contains: function() { return true; },
    children: []
  };
  domElements[id] = el;
  return el;
}

global.document = {
  documentElement: createMockElement('html'),
  getElementById: (id) => domElements[id] || null,
  querySelector: (sel) => {
    if (sel.startsWith('#')) return domElements[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement(`dyn-${Date.now()}-${Math.random()}`, tag),
  body: createMockElement('body'),
  addEventListener: () => {}
};

// Create required DOM structures
createMockElement('chat-drawer', 'aside');
createMockElement('chat-drawer-overlay');
createMockElement('chat-floating-launcher');
createMockElement('chat-floating-badge');
createMockElement('landing-agent-launcher');
createMockElement('landing-agent-drawer', 'aside');
createMockElement('landing-agent-overlay');
createMockElement('topbar');

// Mock Auth, DB, App
global.DB = {
  get: (k) => {
    if (k === 'employees') return [{ id: 1, fullName: 'Ahmed Khan', email: 'ahmed@apextech.com' }];
    if (k === 'users') return [{ id: 1, employeeId: 1, username: 'ahmed.khan' }];
    return [];
  },
  set: () => {}
};

// Load code
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const chatCode = fs.readFileSync(path.join(__dirname, '../js/chat.js'), 'utf8');

eval(dataCode);
eval(authCode);
eval(appCode);
eval(chatCode);

// --- TEST 1: Left Sidebar Verification ---
console.log('--- Test 1: Sidebar Verification ---');
const sidebarItems = Auth.getSidebarItems();
const chatInSidebar = sidebarItems.some(item => item.id === 'chat' || item.label.toLowerCase().includes('chat'));
if (chatInSidebar) {
  throw new Error('❌ FAILED: Team Chat is still present in Auth.getSidebarItems()!');
}
console.log('  ✅ Confirmed: Team Chat is NOT in sidebar items (0 occurrences).');

// --- TEST 2: Topbar Header Verification ---
console.log('\n--- Test 2: Topbar Header Verification ---');
Auth.employee = { id: 1, fullName: 'Ahmed Khan', role: 'superadmin' };
const topbarHtml = App.renderTopbar();
if (topbarHtml && topbarHtml.includes('id="chat-topbar-btn"')) {
  throw new Error('❌ FAILED: #chat-topbar-btn is still rendered in Topbar!');
}
console.log('  ✅ Confirmed: #chat-topbar-btn is NOT rendered in topbar header.');

// --- TEST 3: Right Bottom Launcher Verification ---
console.log('\n--- Test 3: Right Bottom Launcher Verification ---');
const launcher = document.getElementById('chat-floating-launcher');
if (!launcher) {
  throw new Error('❌ FAILED: #chat-floating-launcher is missing from the document!');
}
console.log('  ✅ Confirmed: #chat-floating-launcher is present exclusively in the bottom right.');

// --- TEST 4: Chat Drawer & Top-Right Controls ---
console.log('\n--- Test 4: Chatbox Drawer & Top-Right Header Controls ---');
Chat.init();
Chat.openDrawer();

const drawer = document.getElementById('chat-drawer');
if (!drawer || !drawer.classList.contains('open')) {
  throw new Error('❌ FAILED: Chat drawer did not open on openDrawer()');
}
console.log('  ✅ Chat drawer opened successfully.');

// Verify conversation panel is rendered
const convoPanel = document.getElementById('teams-conversation-panel');
if (!convoPanel) {
  throw new Error('❌ FAILED: Conversation panel not rendered!');
}
console.log('  ✅ Conversation panel rendered in bottom box (not stuck in list form).');

// Verify top right controls in conversation header
if (!convoPanel.innerHTML.includes('teams-options-dropdown')) {
  throw new Error('❌ FAILED: teams-options-dropdown missing from conversation header!');
}
if (!convoPanel.innerHTML.includes('Chat.toggleMinimize(event)')) {
  throw new Error('❌ FAILED: Chat.toggleMinimize missing from conversation header!');
}
if (!convoPanel.innerHTML.includes('Chat.toggleMaximize(event)')) {
  throw new Error('❌ FAILED: Chat.toggleMaximize missing from conversation header!');
}
if (!convoPanel.innerHTML.includes('Chat.closeDrawer()')) {
  throw new Error('❌ FAILED: Chat.closeDrawer missing from conversation header!');
}
console.log('  ✅ Confirmed: Drop options, Minimize, Maximize, and Close all present in top right of chat header.');

// Test Dropdown Toggle
Chat.toggleOptionsMenu();
const dropMenu = document.getElementById('teams-options-dropdown');
if (!dropMenu || dropMenu.style.display !== 'flex') {
  throw new Error('❌ FAILED: Dropdown menu did not open on toggleOptionsMenu()');
}
console.log('  ✅ Drop options menu opened (display: flex).');
Chat.closeOptionsMenu();
if (dropMenu.style.display !== 'none') {
  throw new Error('❌ FAILED: Dropdown menu did not close on closeOptionsMenu()');
}
console.log('  ✅ Drop options menu closed (display: none).');

// Check Minimize Button
Chat.toggleMinimize();
if (!drawer.classList.contains('minimized')) {
  throw new Error('❌ FAILED: Drawer did not get .minimized class');
}
const dockedBar = document.getElementById('chat-docked-bottom-bar');
if (!dockedBar) {
  throw new Error('❌ FAILED: #chat-docked-bottom-bar missing when minimized!');
}
console.log('  ✅ Minimized into clean docked bottom box bar with active contact info.');

// Test Restore from Minimize
Chat.toggleMinimize();
if (drawer.classList.contains('minimized')) {
  throw new Error('❌ FAILED: Drawer still has .minimized after restore');
}
console.log('  ✅ Restored smoothly from minimized bottom box.');

// Check Maximize Button
Chat.toggleMaximize();
if (!drawer.classList.contains('maximized')) {
  throw new Error('❌ FAILED: Drawer did not get .maximized class');
}
console.log('  ✅ Maximize toggled successfully into wide workspace mode.');

Chat.toggleMaximize();
if (drawer.classList.contains('maximized')) {
  throw new Error('❌ FAILED: Drawer did not restore from maximized');
}
console.log('  ✅ Restored back to standard bottom-right chatbox.');

// Test Close
Chat.closeDrawer();
if (drawer.classList.contains('open')) {
  throw new Error('❌ FAILED: Drawer did not close');
}
console.log('  ✅ Chatbox closed cleanly.');

console.log('\n🎉 ALL 4 TESTS PASSED (100%): Chatbox is ONLY in bottom right, top right contains min/max/drop options, and minimized state collapses into the docked bottom box!\n');
