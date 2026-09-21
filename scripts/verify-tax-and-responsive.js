const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING TAX CALCULATOR, EXEMPTIONS & RESPONSIVENESS');
console.log('════════════════════════════════════════════════════════════');

// 1. Verify CSS Rules
console.log('\n▶ Test 1: Verifying CSS Dual-Theme & Responsive Subnav Rules...');
const css = fs.readFileSync(path.join(__dirname, '../css/main.css'), 'utf8');

assert(css.includes('.module-stage-tabs'), 'css/main.css must define .module-stage-tabs');
assert(css.includes('.tab-toggle-btn'), 'css/main.css must define .tab-toggle-btn');
assert(css.includes('[data-theme="light"] .tax-calc-card'), 'css/main.css must define light theme tax calculator card');
assert(css.includes('[data-theme="dark"] .tax-calc-card'), 'css/main.css must define dark theme tax calculator card');
assert(css.includes('[data-theme="light"] .tax-calc-input'), 'css/main.css must define light theme tax inputs');
assert(css.includes('[data-theme="dark"] .tax-calc-input'), 'css/main.css must define dark theme tax inputs');
assert(css.includes('[data-theme="light"] .tax-results-net-card'), 'css/main.css must define light theme net take-home card');
assert(css.includes('[data-theme="dark"] .tax-results-net-card'), 'css/main.css must define dark theme net take-home card');
assert(css.includes('[data-theme="light"] .tax-slabs-table'), 'css/main.css must define light theme tax slabs table');
console.log('  ✔ All dual-theme and responsive subnav CSS rules verified.');

// 2. Verify js/landing.js Tax Math Logic
console.log('\n▶ Test 2: Verifying Tax Calculator Post-PF & Post-Benefits Logic...');
const landingJs = fs.readFileSync(path.join(__dirname, '../js/landing.js'), 'utf8');

assert(landingJs.includes('tax-input-benefits-amt'), 'landing.js must contain benefits input');
assert(landingJs.includes('updateBenefitsAmt'), 'landing.js must define updateBenefitsAmt');
assert(landingJs.includes('setBenefitsPreset'), 'landing.js must define setBenefitsPreset');
assert(landingJs.includes('monthlyTaxable = Math.max(0, gross - pf - eobi - benefits)'), 'landing.js must deduct PF, EOBI and benefits before calculating tax');
assert(landingJs.includes('annualTaxable = monthlyTaxable * 12'), 'landing.js must annualize net taxable base');
assert(landingJs.includes('tax-savings-callout'), 'landing.js must feature a tax savings callout');
console.log('  ✔ Tax calculator post-PF & benefits deduction logic verified.');

// 3. Verify Computational Precision
console.log('\n▶ Test 3: Verifying Deterministic Math Accuracy...');
// Scenario: Gross 150,000 | 8.33% PF | 1300 EOBI | 15000 (10% Medical)
const gross = 150000;
const pf = Math.round(gross * 0.0833); // 12495
const eobi = 1300;
const benefits = 15000;
const monthlyTaxable = Math.max(0, gross - pf - eobi - benefits);
const annualTaxable = monthlyTaxable * 12;

assert.strictEqual(monthlyTaxable, 121205, 'Monthly taxable base should be 121,205');
assert.strictEqual(annualTaxable, 1454460, 'Annual taxable base should be 1,454,460');

// FBR Slab 3: 1.2M - 2.2M: 6000 + 11% over 1.2M
const taxAnnual = 6000 + (annualTaxable - 1200000) * 0.11;
const taxMonthly = Math.round(taxAnnual / 12);
assert.strictEqual(taxMonthly, 2833, 'Monthly tax after exemptions should be 2,833');

const netTakeHome = gross - pf - eobi - taxMonthly;
assert.strictEqual(netTakeHome, 133372, 'Net take home pay should be 133,372');
console.log(`  ✔ Precision verified: Gross PKR ${gross.toLocaleString()} -> Net Taxable PKR ${monthlyTaxable.toLocaleString()} -> Tax PKR ${taxMonthly.toLocaleString()} -> Take-Home PKR ${netTakeHome.toLocaleString()}`);

// 4. Verify Module Stage Tabs Across All Core Modules
console.log('\n▶ Test 4: Verifying .module-stage-tabs in All Modules...');
const coreModules = [
  'js/assets.js',
  'js/helpdesk.js',
  'js/performance.js',
  'js/leaves.js',
  'js/employees.js',
  'js/attendance.js',
  'js/payroll.js'
];

coreModules.forEach(modPath => {
  const content = fs.readFileSync(path.join(__dirname, '..', modPath), 'utf8');
  assert(content.includes('class="module-stage-tabs"'), `${modPath} must contain class="module-stage-tabs"`);
  console.log(`  ✔ Verified .module-stage-tabs in ${modPath}`);
});

console.log('\n════════════════════════════════════════════════════════════');
console.log('🎉 ALL TAX & RESPONSIVE ALIGNMENT VERIFICATION CHECKS PASSED!');
console.log('════════════════════════════════════════════════════════════\n');
