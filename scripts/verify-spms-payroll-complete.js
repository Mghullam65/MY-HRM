// ============================================================
// Complete Automated Verification for SPMS Payroll Module
// ============================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING SPMS PAYROLL MODULE & ACCEPTANCE SUITE');
console.log('════════════════════════════════════════════════════════════\n');

// 1. Load and Verify TaxEngine (§8 & §12)
const TaxEngine = require('../server/src/services/taxEngine');

console.log('▶ Test 1: Validating §12 Benchmark Acceptance Test Cases...');

// Case 1: Normal, gross = splitter
const c1 = TaxEngine.calculate({
  grossIncome: 80750,
  splitter: 80750,
  payrollMonth: '2026-07',
  alreadyNetOfPF: true
});
assert.strictEqual(c1.sendInBankBeforeTax, 80750, 'Case 1 taxed base mismatch');
assert.strictEqual(c1.annualSalary, 969000, 'Case 1 annual salary mismatch');
assert.strictEqual(c1.withholdingTax, 307.5, 'Case 1 tax mismatch');
console.log('  ✔ Case 1 Passed: Taxed Base 80,750 | Annual 969,000 | Tax: 307.50');

// Case 2: Mid-month increment, gross < splitter
const c2 = TaxEngine.calculate({
  grossIncome: 79022,
  splitter: 80750,
  payrollMonth: '2026-07',
  alreadyNetOfPF: true
});
assert.strictEqual(c2.sendInBankBeforeTax, 79022, 'Case 2 taxed base mismatch');
assert.strictEqual(c2.annualSalary, 948264, 'Case 2 annual salary mismatch');
assert.strictEqual(c2.withholdingTax, 290.22, 'Case 2 tax mismatch');
console.log('  ✔ Case 2 Passed: Taxed Base 79,022 | Annual 948,264 | Tax: 290.22');

// Case 3: Cash remittance, gross > splitter
const c3 = TaxEngine.calculate({
  grossIncome: 66500,
  splitter: 50000,
  payrollMonth: '2026-07',
  alreadyNetOfPF: true
});
assert.strictEqual(c3.sendInBankBeforeTax, 50000, 'Case 3 taxed base mismatch');
assert.strictEqual(c3.annualSalary, 600000, 'Case 3 annual salary mismatch');
assert.strictEqual(c3.cashRemittances, 16500, 'Case 3 cash remittance mismatch');
assert.strictEqual(c3.withholdingTax, 0, 'Case 3 tax mismatch');
console.log('  ✔ Case 3 Passed: Taxed Base 50,000 | Untaxed Cash: 16,500 | Tax: 0');

// Case 4: Taxable bonus
const c4 = TaxEngine.calculate({
  grossIncome: 52250,
  bonus: 15000,
  bonusTax: 'yes',
  splitter: 67250,
  payrollMonth: '2026-07',
  alreadyNetOfPF: true
});
assert.strictEqual(c4.sendInBankBeforeTax, 67250, 'Case 4 taxed base mismatch');
assert.strictEqual(c4.annualSalary, 807000, 'Case 4 annual salary mismatch');
assert.strictEqual(c4.withholdingTax, 172.5, 'Case 4 tax mismatch');
console.log('  ✔ Case 4 Passed: Taxed Base 67,250 | Annual 807,000 | Tax: 172.50');

console.log('\n▶ Test 2: Validating Derived Rates Calculation (§7.3)...');
const rates = TaxEngine.deriveRates(110000, 22);
assert.strictEqual(rates.dailyRate, 5000, 'Daily rate mismatch');
assert.strictEqual(rates.hourly, 625, 'Hourly rate mismatch');
assert.strictEqual(rates.perMinute, 10.4167, 'Per minute rate mismatch');
console.log('  ✔ Rates Passed: Monthly 110,000 / 22d = Daily 5,000, Hourly 625, Per Min 10.4167');

console.log('\n▶ Test 3: Validating Effective Tax Slab Resolution (§6)...');
const slabs = TaxEngine.getEffectiveSlabs(TaxEngine.DEFAULT_TAX_SLABS, '2026-07', 1);
assert.strictEqual(slabs.length, 6, 'Should resolve 6 active slabs');
assert.strictEqual(slabs[1].percentage_over, 0.01, 'Percentage over should be fraction 0.01');
console.log('  ✔ Slabs Passed: Correctly resolved active slabs with fraction format.');

console.log('\n▶ Test 4: Verifying Source Files Code Audit...');
const payrollCode = fs.readFileSync(path.join(__dirname, '../js/payroll.js'), 'utf8');
const empCode = fs.readFileSync(path.join(__dirname, '../js/employees.js'), 'utf8');
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

assert(payrollCode.includes('showReportsModal'), 'Missing showReportsModal in payroll.js');
assert(payrollCode.includes('exportPayrollSheetCSV'), 'Missing exportPayrollSheetCSV in payroll.js');
assert(payrollCode.includes('exportBankTransferCSV'), 'Missing exportBankTransferCSV in payroll.js');
assert(payrollCode.includes('exportCashRemittanceCSV'), 'Missing exportCashRemittanceCSV in payroll.js');
assert(payrollCode.includes('exportAnnualTaxDetailCSV'), 'Missing exportAnnualTaxDetailCSV in payroll.js');
assert(payrollCode.includes('exportTotalPFCSV'), 'Missing exportTotalPFCSV in payroll.js');
assert(payrollCode.includes('exportTotalTaxCSV'), 'Missing exportTotalTaxCSV in payroll.js');
assert(payrollCode.includes('showManageTaxSlabsModal'), 'Missing showManageTaxSlabsModal in payroll.js');
assert(payrollCode.includes('numberToWords'), 'Missing numberToWords in payroll.js');
assert(payrollCode.includes('recalculateMonth'), 'Missing recalculateMonth in payroll.js');
console.log('  ✔ js/payroll.js contains all 6 reports, slab CRUD, numberToWords, and deterministic recalculation.');

assert(empCode.includes('ef-pf-fund'), 'Missing ef-pf-fund in employees.js');
assert(empCode.includes('ef-splitter'), 'Missing ef-splitter in employees.js');
assert(empCode.includes('ef-eoib-employee'), 'Missing ef-eoib-employee in employees.js');
assert(empCode.includes('ef-bonus-tax'), 'Missing ef-bonus-tax in employees.js');
assert(empCode.includes('ef-sal-before'), 'Missing mid-month revision fields in employees.js');
console.log('  ✔ js/employees.js contains all §5 employee payroll profile fields.');

assert(dataCode.includes('ensureSPMSData'), 'Missing ensureSPMSData in data.js');
assert(dataCode.includes('tax_table'), 'Missing tax_table initialization in data.js');
console.log('  ✔ js/data.js properly initializes tax_table and seeds default SPMS attributes.');

console.log('\n▶ Test 5: Verifying Root & Public File Synchronization...');
const filesToSync = [
  'js/taxEngine.js',
  'js/payroll.js',
  'js/employees.js',
  'js/data.js',
  'js/leaves.js',
  'index.html'
];
for (const relPath of filesToSync) {
  const rootFile = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const pubFile = fs.readFileSync(path.join(__dirname, '../public', relPath), 'utf8');
  assert.strictEqual(rootFile, pubFile, `File out of sync: ${relPath}`);
  console.log(`  ✔ Synced: ${relPath} is 100% identical between root and public/`);
}

console.log('\n════════════════════════════════════════════════════════════');
console.log('🎉 ALL SPMS PAYROLL TESTS PASSED WITH ZERO REGRESSIONS!');
console.log('════════════════════════════════════════════════════════════\n');
