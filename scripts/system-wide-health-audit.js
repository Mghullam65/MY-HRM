/**
 * scripts/system-wide-health-audit.js
 * Comprehensive System-Wide Health, Feature & Handler Integrity Audit
 */

const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('🔬 SYSTEM-WIDE HEALTH, MODULE & FEATURE INTEGRITY AUDIT');
console.log('════════════════════════════════════════════════════════════\n');

let totalChecks = 0;
let passedChecks = 0;
let warnings = [];

function assert(condition, label, isWarn = false) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${label}`);
  } else {
    if (isWarn) {
      warnings.push(label);
      console.warn(`  ⚠️ [WARN] ${label}`);
    } else {
      console.error(`  ❌ [FAIL] ${label}`);
      process.exitCode = 1;
    }
  }
}

// 1. Audit File Structure & Core Assets
console.log('▶ STEP 1: Auditing Core Assets & Architecture...');
const coreFiles = [
  'index.html',
  'css/main.css',
  'js/app.js',
  'js/auth.js',
  'js/data.js',
  'js/dashboard.js',
  'js/employees.js',
  'js/attendance.js',
  'js/leaves.js',
  'js/payroll.js',
  'js/company.js',
  'js/performance.js',
  'js/recruitment.js',
  'js/assets.js',
  'js/expenses.js',
  'js/helpdesk.js',
  'js/settlement.js',
  'js/administration.js',
  'js/settings.js',
  'js/taxEngine.js',
  'js/security.js',
  'js/api.js',
  'js/i18n.js',
  'js/notifications.js',
  'js/landing.js',
  'js/trial.js',
  'js/events.js',
  'js/reports.js'
];

coreFiles.forEach(f => {
  const p = path.join(__dirname, '..', f);
  assert(fs.existsSync(p), `Core file exists: ${f}`);
});

// Verify consolidated global runtime objects (Utils, Modal, Toast)
const dataJsForGlobals = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const appJsForGlobals = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(dataJsForGlobals.includes('const Utils =') || dataJsForGlobals.includes('var Utils =') || dataJsForGlobals.includes('window.Utils ='), 'Global Utils engine initialized in js/data.js');
assert(appJsForGlobals.includes('const Toast =') || appJsForGlobals.includes('var Toast =') || appJsForGlobals.includes('window.Toast ='), 'Global Toast notification system initialized in js/app.js');
assert(appJsForGlobals.includes('const Modal =') || appJsForGlobals.includes('var Modal =') || appJsForGlobals.includes('window.Modal ='), 'Global Modal controller initialized in js/app.js');

// 2. Audit All Inline Event Handlers (onclick, onchange, onsubmit)
console.log('\n▶ STEP 2: Auditing HTML Event Handlers Across All Modules...');
const moduleFilesMap = {
  'App': 'js/app.js',
  'Auth': 'js/auth.js',
  'DB': 'js/data.js',
  'Utils': 'js/data.js',
  'Modal': 'js/app.js',
  'Toast': 'js/app.js',
  'Dashboard': 'js/dashboard.js',
  'Employees': 'js/employees.js',
  'Attendance': 'js/attendance.js',
  'Leaves': 'js/leaves.js',
  'Payroll': 'js/payroll.js',
  'Company': 'js/company.js',
  'Performance': 'js/performance.js',
  'Recruitment': 'js/recruitment.js',
  'Assets': 'js/assets.js',
  'Expenses': 'js/expenses.js',
  'Helpdesk': 'js/helpdesk.js',
  'Settlement': 'js/settlement.js',
  'Administration': 'js/administration.js',
  'Settings': 'js/settings.js',
  'TaxEngine': 'js/taxEngine.js'
};

const moduleContents = {};
for (const [mod, f] of Object.entries(moduleFilesMap)) {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    moduleContents[mod] = fs.readFileSync(p, 'utf8');
  }
}

let missingHandlersCount = 0;
const jsFiles = fs.readdirSync(path.join(__dirname, '../js')).filter(f => f.endsWith('.js'));

jsFiles.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, '../js', file), 'utf8');
  const regex = /on(?:click|change|submit|input)\s*=\s*["']([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*\(/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const mod = match[1];
    const fn = match[2];
    if (moduleContents[mod]) {
      const code = moduleContents[mod];
      const isDefined = code.includes(fn + '(') || code.includes(fn + ':') || code.includes(fn + ' =');
      if (!isDefined) {
        missingHandlersCount++;
        warnings.push(`File js/${file} calls missing method ${mod}.${fn}()`);
      }
    }
  }
});

assert(missingHandlersCount === 0, `All HTML inline event handlers mapped to active module methods (0 broken handlers)`);

// 3. Audit Database Schema Integrity & Cross-Table Relations
console.log('\n▶ STEP 3: Auditing In-Memory & Cloud Database Schema Integrity...');
const dataJs = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

const requiredTables = [
  'employees',
  'departments',
  'designations',
  'users',
  'attendance',
  'attendance_corrections',
  'leaves',
  'leave_types',
  'leave_balances',
  'salary',
  'tax_table',
  'companies',
  'recruitment',
  'assets',
  'expense_claims',
  'helpdesk_tickets',
  'settlements',
  'audit_logs',
  'notifications'
];

requiredTables.forEach(tbl => {
  assert(dataJs.includes(`'${tbl}'`) || dataJs.includes(`"${tbl}"`), `Database initializes table schema: ${tbl}`);
});

// 4. Audit Navigation & App Routing
console.log('\n▶ STEP 4: Auditing App Navigation & Module Mounting...');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const routes = [
  'dashboard',
  'employees',
  'attendance',
  'leaves',
  'payroll',
  'settlement',
  'companies',
  'performance',
  'recruitment',
  'assets',
  'expenses',
  'helpdesk',
  'events',
  'reports',
  'administration',
  'settings'
];

routes.forEach(r => {
  assert(appJs.includes(`case '${r}':`) || appJs.includes(`'${r}':`), `App router routes module: "${r}"`);
});

// 5. Audit Local Storage & Session Guarding
console.log('\n▶ STEP 5: Auditing Security, Session Guarding & Local Sync...');
const authJs = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
assert(authJs.includes('sessionStorage.removeItem(\'hrm_session\')'), 'Logout securely purges active session storage');
assert(authJs.includes('delete safeUser.password'), 'Authentication controller removes password from session payloads');
assert(authJs.includes('getScopedEmployees'), 'Workforce hierarchy controller implements getScopedEmployees');

// 6. Audit Desktop & Laptop 100% Zoom CSS Properties
console.log('\n▶ STEP 6: Auditing Responsive CSS Rules for 100% Zoom Compatibility...');
const mainCss = fs.readFileSync(path.join(__dirname, '../css/main.css'), 'utf8');
assert(mainCss.includes('--sidebar-w:      220px;'), 'Default sidebar width optimized to 220px');
assert(mainCss.includes('min-width: 0;'), 'Flex containers protected with min-width: 0 against overflow');
assert(mainCss.includes('.table-wrapper, .table-responsive, .table-container'), 'Tables protected with responsive scroll wrapper');
assert(mainCss.includes('@media (max-width: 1440px)'), '1366px-1440px laptop breakpoint active');
assert(mainCss.includes('@media (max-width: 1280px)'), '1280px compact breakpoint active');

console.log('\n════════════════════════════════════════════════════════════');
console.log(`📊 SYSTEM AUDIT RESULT: ${passedChecks} OF ${totalChecks} CHECKS PASSED`);
if (warnings.length > 0) {
  console.log(`⚠️  NOTICES & POTENTIAL IMPROVEMENTS (${warnings.length}):`);
  warnings.forEach(w => console.log(`   - ${w}`));
}
console.log('════════════════════════════════════════════════════════════\n');

if (process.exitCode === 1) {
  process.exit(1);
} else {
  process.exit(0);
}
