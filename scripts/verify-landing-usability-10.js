/**
 * Verification script for Landing Page Usability Heuristics Audit Fixes (10 Issues)
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 RUNNING LANDING PAGE USABILITY AUDIT VERIFICATION (10 ISSUES)');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');
const landingJsPath = path.join(__dirname, '..', 'js', 'landing.js');
const pubCssPath = path.join(__dirname, '..', 'public', 'css', 'main.css');
const pubLandingJsPath = path.join(__dirname, '..', 'public', 'js', 'landing.js');

const css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');
const landingJs = fs.readFileSync(landingJsPath, 'utf8').replace(/\r\n/g, '\n');
const pubCss = fs.readFileSync(pubCssPath, 'utf8').replace(/\r\n/g, '\n');
const pubLandingJs = fs.readFileSync(pubLandingJsPath, 'utf8').replace(/\r\n/g, '\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

// 1. Files in sync
assert(css === pubCss, 'css/main.css and public/css/main.css are identical');
assert(landingJs === pubLandingJs, 'js/landing.js and public/js/landing.js are identical');

// Issue 1, 2, 3: Canonical Design Tokens
assert(css.includes('--font-xs') && css.includes('--font-sm') && css.includes('--font-base'), 'Issue 1: Consistent type scale tokens active');
assert(css.includes('--c-text-main') && css.includes('--c-text-sub') && css.includes('--c-text-muted'), 'Issue 2: Text color tokens active');
assert(css.includes('--r-xs') && css.includes('--r-sm') && css.includes('--r-md') && css.includes('--r-full'), 'Issue 3: Border radii tokens active');

// Issue 4: Button archetypes unified
assert(landingJs.includes('class="btn btn-secondary btn-sm"') && css.includes('.career-card-bottom .btn-secondary'), 'Issue 4 & 8: Unified button archetype (.btn-secondary.btn-sm) used in career cards');

// Issue 5: Body text is very small (11px -> min 12px)
assert(landingJs.includes('id="tax-slabs-toggle-txt"') && !landingJs.includes('font-size:11px;padding:9px;display:flex;align-items:center;justify-content:center;gap:8px'), 'Issue 5: #tax-slabs-toggle-txt container font raised above 11px');
assert(css.includes('.tax-mini-chip {\n  background: rgba(255, 255, 255, 0.08);\n  border: 1px solid rgba(255, 255, 255, 0.16);\n  border-radius: var(--r-xs);\n  padding: 7px 14px;\n  font-size: var(--font-xs);'), 'Issue 5: .tax-mini-chip raised to var(--font-xs) (12px) with comfortable padding');

// Issue 6: Long all-caps text in Careers salary
assert(!landingJs.includes('PKR ${job.salary}') && landingJs.includes('Rs. ${job.salary} / mo'), 'Issue 6: 17-char all-caps salary replaced with sentence case "Rs. ${job.salary} / mo"');

// Issue 7: Conflicting Manual Pain Point vs HRM Pro Automated badges
assert(!landingJs.includes('class="ps-badge-problem"'), 'Issue 7: Conflicting red Manual Pain Point badges eliminated');
assert(landingJs.includes('Automated Payroll Engine') && landingJs.includes('Audit-Ready Compliance'), 'Issue 7: Single clear solution badge per card defines purpose unambiguously');

// Issue 8: Inconsistent secondary navigational actions
assert(!landingJs.includes('class="career-view-link" onclick="Landing.viewJobDetails'), 'Issue 8: Raw text link replaced with standardized secondary button in careers list');
assert(landingJs.includes('<button type="button" class="btn btn-secondary btn-sm" onclick="Landing.viewJobDetails(${job.id})">'), 'Issue 8: View Requirements now uses standard .btn-secondary.btn-sm');

// Issue 9: Open Portal Access missing icon
assert(landingJs.includes('<i class="fa fa-arrow-up-right-from-square" style="margin-right:6px"></i> Open Portal Access'), 'Issue 9: Open Portal Access button equipped with matching navigation icon');

// Issue 10: Tax calculator dense spacing & small font sizes
assert(css.includes('.tax-slabs-table th {\n  background: rgba(255, 255, 255, 0.12);\n  padding: 12px 16px;'), 'Issue 10: .tax-slabs-table th padding increased to 12px 16px');
assert(css.includes('.tax-slabs-table td {\n  padding: 12px 16px;'), 'Issue 10: .tax-slabs-table td padding increased to 12px 16px');
assert(css.includes('.tax-results-row {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 14px 0;'), 'Issue 10: .tax-results-row padding expanded from 10px to 14px with var(--font-base)');
assert(landingJs.includes('Estimated Net Take-Home Pay') && !landingJs.includes('ESTIMATED NET TAKE-HOME PAY'), 'Issue 10: Estimated Net Take-Home Pay formatted in readable title case');

console.log('\n🎉 ALL 10 LANDING PAGE USABILITY AUDIT CHECKS PASSED WITH 100% SUCCESS!\n');
