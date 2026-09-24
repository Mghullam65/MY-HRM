/**
 * Automated Verification Script: Modern Enterprise UI Suite
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Modern Enterprise UI Suite Verification...\n');

// Mock DOM & Storage environment
global.window = global;
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
    focus: function() {},
    scrollIntoView: function() {},
    appendChild: function() {},
    removeChild: function() {},
    remove: function() {}
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
  querySelectorAll: function(sel) {
    return [];
  },
  querySelector: function(sel) {
    return null;
  },
  addEventListener: function() {}
};

// Initialize Mock DB
global.DB = {
  data: {
    employees: [
      { id: 1, fullName: 'Ahmed Khan', empNo: 'EMP-001', departmentId: 1, designationId: 1, email: 'ahmed@company.com', status: 'active' },
      { id: 2, fullName: 'Sara Ali', empNo: 'EMP-002', departmentId: 1, designationId: 2, email: 'sara@company.com', status: 'active' }
    ],
    departments: [{ id: 1, name: 'Technology' }],
    designations: [{ id: 1, title: 'Lead Architect' }, { id: 2, title: 'Senior Engineer' }],
    settings: { companyName: 'HRM Pro', theme: 'dark' }
  },
  get: function(t) { return this.data[t] || []; },
  getObj: function(t) { return this.data[t] || null; },
  set: function(t, val) { this.data[t] = val; }
};

global.Auth = {
  user: { id: 1, username: 'admin' },
  role: 'superadmin',
  employee: { id: 1, fullName: 'Ahmed Khan', firstName: 'Ahmed' },
  getSidebarItems: function() {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
      { id: 'employees', label: 'Employees', icon: 'fa-users' },
      { id: 'attendance', label: 'Attendance', icon: 'fa-clock' },
      { id: 'leaves', label: 'Leaves', icon: 'fa-calendar-days' },
      { id: 'payroll', label: 'Payroll', icon: 'fa-money-bill-wave' }
    ];
  }
};

global.Utils = {
  escapeHtml: function(s) { return String(s || ''); },
  avatarColor: function() { return '#2563eb'; },
  avatarInitials: function(n) { return (n || 'U').slice(0, 2).toUpperCase(); },
  getDeptName: function(id) { return 'Technology'; },
  getDesigName: function(id) { return 'Engineer'; }
};

global.Toast = {
  show: function(msg, type) {
    console.log(`  📣 Toast [${type}]: ${msg}`);
  }
};

// Load app.js
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
eval(appCode);

// --- TEST 1: Spotlight Command Palette Lifecycle ---
console.log('--- Step 1: Testing Spotlight Command Palette (Ctrl+K) ---');
App.openCommandPalette();
const overlay = document.getElementById('cmd-palette-overlay');
if (!overlay.classList.contains('open')) throw new Error('Command palette overlay did not open');
console.log('  ✅ Command Palette opened successfully');

App.filterCommandPalette('leave');
if (App.commandPaletteItems.length === 0) throw new Error('Command palette search for "leave" returned 0 items');
console.log(`  ✅ Search for "leave" returned ${App.commandPaletteItems.length} matching command(s)`);

App.filterCommandPalette('sara');
if (App.commandPaletteItems.length === 0) throw new Error('Command palette search for "sara" returned 0 items');
console.log(`  ✅ Search for "sara" returned employee: ${App.commandPaletteItems[0].title}`);

App.closeCommandPalette();
if (overlay.classList.contains('open')) throw new Error('Command palette overlay did not close');
console.log('  ✅ Command Palette closed successfully');

// --- TEST 2: Table Density Toggle Engine ---
console.log('\n--- Step 2: Testing Table Density Engine (Compact / Comfortable) ---');
document.body.setAttribute('data-table-density', 'comfortable');
App.toggleTableDensity();
if (document.body.getAttribute('data-table-density') !== 'compact') throw new Error('Table density failed to toggle to compact');
if (!document.body.classList.contains('compact-mode')) throw new Error('compact-mode class missing on body');
console.log('  ✅ Successfully toggled to Compact Mode (High-Density)');

App.toggleTableDensity();
if (document.body.getAttribute('data-table-density') !== 'comfortable') throw new Error('Table density failed to toggle to comfortable');
console.log('  ✅ Successfully toggled back to Comfortable Mode (Spacious)');

// --- TEST 3: Brand Accent Theme Engine ---
console.log('\n--- Step 3: Testing Brand Accent Palette Switcher ---');
App.setAccentColor('emerald');
if (document.documentElement.getAttribute('data-accent') !== 'emerald') throw new Error('Accent color not set to emerald');
if (localStorage.getItem('hrm_accent_color') !== 'emerald') throw new Error('Accent color not persisted to localStorage');
console.log('  ✅ Brand Accent switched to Emerald');

App.setAccentColor('violet');
if (document.documentElement.getAttribute('data-accent') !== 'violet') throw new Error('Accent color not set to violet');
console.log('  ✅ Brand Accent switched to Violet');

// --- TEST 4: Global Dark / Light Mode Switcher ---
console.log('\n--- Step 4: Testing Global Dark / Light Mode Switcher ---');
document.documentElement.setAttribute('data-theme', 'dark');
App.toggleTheme();
if (document.documentElement.getAttribute('data-theme') !== 'light') throw new Error('Theme not switched to light');
if (localStorage.getItem('hrm_theme_mode') !== 'light') throw new Error('Theme preference not saved to localStorage');
console.log('  ✅ Switched to Crisp Light Theme');

App.toggleTheme();
if (document.documentElement.getAttribute('data-theme') !== 'dark') throw new Error('Theme not switched to dark');
console.log('  ✅ Switched back to Obsidian Dark Theme');

// --- TEST 5: Breadcrumbs Trail Update ---
console.log('\n--- Step 5: Testing Dynamic Breadcrumb Trail ---');
App.updateBreadcrumbs('attendance', 'roster');
const crumbActive = document.getElementById('topbar-crumb-active');
if (!crumbActive.textContent.includes('Attendance › Roster')) throw new Error('Breadcrumb text mismatch: ' + crumbActive.textContent);
console.log(`  ✅ Breadcrumb updated: "${crumbActive.textContent}"`);

console.log('\n🎉 ALL 5 MODERN ENTERPRISE UI SUITE FEATURES VERIFIED 100%!');
