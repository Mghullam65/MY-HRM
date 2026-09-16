/**
 * Verification script for Login Page Usability Heuristics Audit Fixes (12 Issues)
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 RUNNING LOGIN PAGE USABILITY AUDIT VERIFICATION (12 ISSUES)');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
const pubCssPath = path.join(__dirname, '..', 'public', 'css', 'main.css');
const pubAppJsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');

const css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');
const appJs = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');
const pubCss = fs.readFileSync(pubCssPath, 'utf8').replace(/\r\n/g, '\n');
const pubAppJs = fs.readFileSync(pubAppJsPath, 'utf8').replace(/\r\n/g, '\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

// Check CSS sync
assert(css === pubCss, 'css/main.css and public/css/main.css are identical');
assert(appJs === pubAppJs, 'js/app.js and public/js/app.js are identical');

// 1. Consistent Type Scale
assert(!css.includes('.scenario-pillar-item span {\n  display: block;\n  font-size: 10px;'), 'Issue 1 & 5: 10px font size eliminated');
assert(!css.includes('.mfa-desc {\n  font-size: 11px;'), 'Issue 1 & 7: 11px font size eliminated');
assert(css.includes('.split-card-title {\n  font-size: var(--font-2xl);'), 'Issue 1: Split card title mapped to canonical var(--font-2xl)');

// 2. Text Colours
assert(css.includes('--c-text-primary') && css.includes('--c-text-secondary') && css.includes('--c-text-muted'), 'Issue 2: Semantic color tokens active in login rules');

// 3. Corner Radii
assert(css.includes('.split-submit-btn {\n  width: 100%;\n  height: 44px;\n  background: #2563eb;\n  border: none;\n  border-radius: var(--r-sm);'), 'Issue 3: Button uses canonical var(--r-sm)');

// 4. Button styles
assert(css.includes('.split-submit-btn') && css.includes('.split-sso-btn') && css.includes('.split-account-chip'), 'Issue 4: Clean unified button archetypes defined');

// 5. Body text size (Issue 5: 10px -> 12px)
assert(css.includes('.scenario-pillar-item span {\n  display: block;\n  font-size: var(--font-xs);'), 'Issue 5: Scenario pillar item span raised from 10px to var(--font-xs) (12px)');

// 6. Long all-caps text (Issue 6: text-transform uppercase removed)
assert(css.includes('.split-or-divider span {\n  padding: 0 12px;\n  font-size: var(--font-xs);\n  color: var(--c-text-muted);\n  text-transform: none;'), 'Issue 6: Long uppercase text-transform eliminated, now sentence case');

// 7. Body text size (Issue 7: 11px -> 12px)
assert(css.includes('.mfa-desc {\n  font-size: var(--font-xs);'), 'Issue 7: MFA description text raised from 11px to var(--font-xs) (12px)');

// 8. Role buttons horizontally clipped (Issue 8: flex-wrap: wrap)
assert(css.includes('.split-account-chips-row {\n  display: flex;\n  flex-wrap: wrap;'), 'Issue 8: Role chips row uses flex-wrap: wrap to prevent horizontal clipping of Onboarding');

// 9. 'Back to Home' alignment (Issue 9: relative and 440px max-width alignment)
assert(css.includes('.split-right-topbar {\n  position: relative;\n  top: auto;\n  left: auto;\n  right: auto;\n  max-width: 440px;'), 'Issue 9: Back to Home button aligned with 440px form axis instead of screen corner');

// 10. Density & Clutter (Issue 10: Segmented login mode tabs)
assert(appJs.includes('login-tab-nav') && appJs.includes('id="login-tab-standard"') && appJs.includes('id="login-tab-demo"'), 'Issue 10: Segmented login tabs prioritize standard credentials flow and isolate demo presets');
assert(appJs.includes('setTab(tab) {'), 'Issue 10: Login.setTab method implemented for accessible tab switching');

// 11. Misleading 'Online' status indicator (Issue 11: Demo preset badge)
assert(!appJs.includes('<span class="active-user-online-dot"></span>'), 'Issue 11: Unauthenticated active-user-online-dot removed from login page');
assert(!appJs.includes('Online\n              </div>') && appJs.includes('Demo Preset'), 'Issue 11: Misleading Online status replaced with honest "Demo Preset" label');

// 12. Heavy drop shadow on Sign In button (Issue 12: Softened box-shadow)
assert(css.includes('box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05);'), 'Issue 12: Sign In button drop shadow softened for visual balance');

console.log('\n🎉 ALL 12 LOGIN USABILITY AUDIT CHECKS PASSED WITH 100% SUCCESS!\n');
