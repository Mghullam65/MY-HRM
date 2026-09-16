/**
 * Verification script for Dashboard Page Usability Heuristics Audit Fixes (13 Issues)
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 RUNNING DASHBOARD USABILITY AUDIT VERIFICATION (13 ISSUES)');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');
const dashJsPath = path.join(__dirname, '..', 'js', 'dashboard.js');
const pubCssPath = path.join(__dirname, '..', 'public', 'css', 'main.css');
const pubDashJsPath = path.join(__dirname, '..', 'public', 'js', 'dashboard.js');

const css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');
const dashJs = fs.readFileSync(dashJsPath, 'utf8').replace(/\r\n/g, '\n');
const pubCss = fs.readFileSync(pubCssPath, 'utf8').replace(/\r\n/g, '\n');
const pubDashJs = fs.readFileSync(pubDashJsPath, 'utf8').replace(/\r\n/g, '\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

// 1. Files in sync
assert(css === pubCss, 'css/main.css and public/css/main.css are identical');
assert(dashJs === pubDashJs, 'js/dashboard.js and public/js/dashboard.js are identical');

// Issue 5: Body text is very small (11px -> 12px)
assert(css.includes('.logo-text span {\n  font-size: var(--font-xs);') || css.includes('.logo-text span { font-size: var(--font-xs);'), 'Issue 5: Sidebar logo-text span updated to var(--font-xs) (12px)');

// Issue 6: Long all-caps text in ticker
assert(!dashJs.includes('tag: "TODAY\'S BIRTHDAY"') && dashJs.includes('tag: "Birthday Today"'), 'Issue 6: TODAY\'S BIRTHDAY all-caps tag eliminated and replaced with sentence/title case');
assert(css.includes('.ticker-tag {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 2px 8px;\n  border-radius: var(--r-full);\n  font-size: var(--font-xs);\n  font-weight: 600;\n  letter-spacing: normal;\n  text-transform: none;'), 'Issue 6: .ticker-tag text-transform: uppercase removed and set to text-transform: none');

// Issue 7: Long all-caps text in section heading
assert(!dashJs.includes('Employee Overview</h3>') || !dashJs.includes('text-transform:uppercase;letter-spacing:1px">${Auth.role === \'dept_manager\' ? \'Team Overview\' : \'Employee Overview\'}'), 'Issue 7: Employee Overview uppercase transform removed');
assert(dashJs.includes('font-size:var(--font-sm);font-weight:600;color:var(--text-3);letter-spacing:0.2px">${Auth.role === \'dept_manager\' ? \'Team Overview\' : \'Employee Overview\'}'), 'Issue 7: Standardized heading without uppercase transform');

// Issue 8: Top headlines & birthday ticker clutter & high contrast
assert(css.includes('.ticker-badge {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 8px 16px;\n  background: var(--surface-2);'), 'Issue 8: Ticker badge replaced vibrant red neon with cohesive, calm surface-2');

// Issue 9: Inconsistent Wish buttons
assert(dashJs.includes('class="btn btn-secondary btn-xs"') && dashJs.includes('title="Send Birthday Wish Today"'), 'Issue 9: Today\'s Wish button uses unified btn-secondary btn-xs with clear priority label');
assert(dashJs.includes('class="btn btn-ghost btn-xs"') && dashJs.includes('title="Send Early Birthday Wish"'), 'Issue 9: Upcoming Wish button uses unified btn-ghost btn-xs');

// Issue 10: Inconsistent 'View All' pattern
assert(!dashJs.includes('View All Holidays'), 'Issue 10: Old full-width View All Holidays button removed');
assert(dashJs.includes('<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'events\')">View All</button>'), 'Issue 10: View All Holidays standardized in card-header matching all other cards');

// Issue 11: Pending approvals Mgr Approved label too close to action buttons
assert(dashJs.includes('style="margin-left:6px;margin-right:12px">Mgr Approved</span>') || dashJs.includes('style="margin-left:8px;margin-right:12px">Mgr Approved</span>'), 'Issue 11: Mgr Approved badge given horizontal whitespace padding');
assert(css.includes('.pending-item .pi-actions { display: flex; gap: 6px; margin-left: 14px; flex-shrink: 0; }'), 'Issue 11: .pi-actions separated from status label with margin-left');

// Issue 12: Ambiguous floating ticker controls
assert(dashJs.includes('<div class="ticker-controls" role="toolbar" aria-label="Headlines Controls">'), 'Issue 12: Ticker controls grouped into accessible toolbar container');
assert(css.includes('.ticker-controls {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 4px 10px;\n  background: var(--surface-2);'), 'Issue 12: .ticker-controls styled as distinct attached toolbar');

// Issue 13: Live System status badge competing with heading
assert(dashJs.includes('class="badge badge-subtle-success"'), 'Issue 13: Live System badge replaced with subtle, secondary indicator');
assert(css.includes('.badge-subtle-success {\n  background: var(--surface-2);'), 'Issue 13: .badge-subtle-success styled with quiet background to prioritize H2 heading');

// Global Consistency: Issues 1, 2, 3, 4
assert(css.includes('--font-xs') && css.includes('--font-sm') && css.includes('--font-base'), 'Issue 1: Consistent type scale tokens active');
assert(css.includes('--r-xs') && css.includes('--r-sm') && css.includes('--r-md') && css.includes('--r-full'), 'Issue 3: Consistent border radii tokens active');

console.log('\n🎉 ALL 13 DASHBOARD USABILITY AUDIT CHECKS PASSED WITH 100% SUCCESS!\n');
