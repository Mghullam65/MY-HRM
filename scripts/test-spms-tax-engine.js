// ============================================================
// Acceptance Tests for Tax Engine (§12 Acceptance Criteria)
// ============================================================

const assert = require('assert');
const TaxEngine = require('../server/src/services/taxEngine');

console.log('--- Testing SPMS Tax Engine Acceptance Criteria (§12) ---');

// Case 1: Normal, gross = splitter
// Inputs: gross 80,750; splitter 80,750; pf 5%
// Taxed base: 80,750 | Annual: 969,000 | Expected tax: ≈ 308 (307.5)
const case1 = TaxEngine.calculate({
  grossIncome: 80750,
  splitter: 80750,
  pfFundRate: 0, // In this case, 80750 is already net of PF
  payrollMonth: '2026-07',
  alreadyNetOfPF: true
});
console.log('Case 1 Result:', {
  taxedBase: case1.sendInBankBeforeTax,
  annualSalary: case1.annualSalary,
  withholdingTax: case1.withholdingTax
});
assert.strictEqual(case1.sendInBankBeforeTax, 80750);
assert.strictEqual(case1.annualSalary, 969000);
assert.strictEqual(case1.withholdingTax, 307.5);
console.log('✅ Case 1 Passed: Withholding tax = 307.50');

// Case 2: Mid-month increment, gross < splitter
// Inputs: gross 79,022; splitter 80,750
// Taxed base: 79,022 | Annual: 948,264 | Expected tax: ≈ 290 (290.2)
const case2 = TaxEngine.calculate({
  grossIncome: 79022,
  splitter: 80750,
  payrollMonth: '2026-07',
  alreadyNetOfPF: true
});
console.log('Case 2 Result:', {
  taxedBase: case2.sendInBankBeforeTax,
  annualSalary: case2.annualSalary,
  withholdingTax: case2.withholdingTax
});
assert.strictEqual(case2.sendInBankBeforeTax, 79022);
assert.strictEqual(case2.annualSalary, 948264);
assert.strictEqual(case2.withholdingTax, 290.22);
console.log('✅ Case 2 Passed: Withholding tax = 290.22');

// Case 3: Cash remittance, gross > splitter
// Inputs: gross 66,500; splitter 50,000
// Taxed base: 50,000 | Annual: 600,000 | Expected tax: 0
const case3 = TaxEngine.calculate({
  grossIncome: 66500,
  splitter: 50000,
  payrollMonth: '2026-07',
  alreadyNetOfPF: true
});
console.log('Case 3 Result:', {
  taxedBase: case3.sendInBankBeforeTax,
  annualSalary: case3.annualSalary,
  cashRemittances: case3.cashRemittances,
  withholdingTax: case3.withholdingTax
});
assert.strictEqual(case3.sendInBankBeforeTax, 50000);
assert.strictEqual(case3.annualSalary, 600000);
assert.strictEqual(case3.cashRemittances, 16500);
assert.strictEqual(case3.withholdingTax, 0);
console.log('✅ Case 3 Passed: Withholding tax = 0 (16,500 untaxed cash remittance)');

// Case 4: Taxable bonus
// Inputs: salary-after-PF 52,250; bonus 15,000; splitter 67,250; bonus_tax yes
// Taxed base: 67,250 | Annual: 807,000 | Expected tax: ≈ 173 (172.5)
const case4 = TaxEngine.calculate({
  grossIncome: 52250,
  bonus: 15000,
  bonusTax: 'yes',
  splitter: 67250,
  payrollMonth: '2026-07',
  alreadyNetOfPF: true
});
console.log('Case 4 Result:', {
  taxedBase: case4.sendInBankBeforeTax,
  annualSalary: case4.annualSalary,
  withholdingTax: case4.withholdingTax
});
assert.strictEqual(case4.sendInBankBeforeTax, 67250);
assert.strictEqual(case4.annualSalary, 807000);
assert.strictEqual(case4.withholdingTax, 172.5);
console.log('✅ Case 4 Passed: Withholding tax = 172.50');

console.log('🎉 ALL 4 ACCEPTANCE CASES PASSED WITH 100% PRECISION!');
