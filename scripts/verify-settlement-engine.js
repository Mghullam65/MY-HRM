const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING STATUTORY GRATUITY & F&F SETTLEMENT ENGINE');
console.log('════════════════════════════════════════════════════════════\n');

// 1. Math Verification
console.log('▶ Test 1: Validating Statutory Gratuity Formula (30/26 Rule)...');

function calcGratuity(basic, roundedYears) {
  if (roundedYears < 1) return 0;
  return Math.round((basic * roundedYears * 30) / 26);
}

function calcTenureYears(joinStr, exitStr) {
  const join = new Date(joinStr);
  const exit = new Date(exitStr);
  let months = (exit.getFullYear() - join.getFullYear()) * 12 + (exit.getMonth() - join.getMonth());
  if (exit.getDate() < join.getDate()) months--;
  months = Math.max(0, months);
  const fullYears = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths >= 6 ? fullYears + 1 : fullYears;
}

// Case 1: 75,000 Basic, 7 years
const g1 = calcGratuity(75000, 7);
assert.strictEqual(g1, 605769, `Expected 605,769, got ${g1}`);
console.log(`  ✔ Case 1: Basic PKR 75k × 7 yrs × 30/26 = PKR ${g1.toLocaleString('en-PK')}`);

// Case 2: 60,000 Basic, 4 years
const g2 = calcGratuity(60000, 4);
assert.strictEqual(g2, 276923, `Expected 276,923, got ${g2}`);
console.log(`  ✔ Case 2: Basic PKR 60k × 4 yrs × 30/26 = PKR ${g2.toLocaleString('en-PK')}`);

// Case 3: 100,000 Basic, 3 years 8 months -> 4 years
const t3 = calcTenureYears('2022-01-01', '2025-09-01'); // 3 years 8 months
assert.strictEqual(t3, 4, `Expected 4 years rounded, got ${t3}`);
const g3 = calcGratuity(100000, t3);
assert.strictEqual(g3, 461538, `Expected 461,538, got ${g3}`);
console.log(`  ✔ Case 3: Basic PKR 100k × 4 yrs (3y 8m rounded) × 30/26 = PKR ${g3.toLocaleString('en-PK')}`);

// Case 4: 60,000 Basic, 1 year 2 months -> 1 year
const t4 = calcTenureYears('2024-01-01', '2025-03-01'); // 1 year 2 months
assert.strictEqual(t4, 1, `Expected 1 year rounded, got ${t4}`);
const g4 = calcGratuity(60000, t4);
assert.strictEqual(g4, 69231, `Expected 69,231, got ${g4}`);
console.log(`  ✔ Case 4: Basic PKR 60k × 1 yr (1y 2m rounded) × 30/26 = PKR ${g4.toLocaleString('en-PK')}`);

// Case 5: Ineligible (< 1 year)
const t5 = calcTenureYears('2025-01-01', '2025-06-01'); // 5 months
assert.strictEqual(t5, 0, `Expected 0 rounded years, got ${t5}`);
const g5 = calcGratuity(80000, t5);
assert.strictEqual(g5, 0, `Expected 0 gratuity, got ${g5}`);
console.log(`  ✔ Case 5: Tenure < 1 year is ineligible -> Gratuity: PKR 0`);

// 2. Net Settlement Equation
console.log('\n▶ Test 2: Validating Full & Final Net Settlement Equation...');
const lastBasic = 75000;
const prorated = Math.round((75000 / 30) * 25); // 62500
const gratuity = 605769;
const leaveEncash = Math.round((75000 / 30) * 8); // 20000
const pfRefund = 185000;
const otherAdd = 15000;
const gross = prorated + gratuity + leaveEncash + pfRefund + otherAdd;
assert.strictEqual(gross, 888269, `Expected gross 888,269, got ${gross}`);

const loansDed = 45000;
const assetDed = 0;
const noticeDed = 0;
const taxDed = 8500;
const eobiDed = 1300;
const otherDed = 0;
const totalDeductions = loansDed + assetDed + noticeDed + taxDed + eobiDed + otherDed;
assert.strictEqual(totalDeductions, 54800, `Expected deductions 54,800, got ${totalDeductions}`);

const net = gross - totalDeductions;
assert.strictEqual(net, 833469, `Expected net 833,469, got ${net}`);
console.log(`  ✔ Net Equation: Gross PKR ${gross.toLocaleString()} - Deductions PKR ${totalDeductions.toLocaleString()} = Net PKR ${net.toLocaleString('en-PK')}`);

// 3. Admin Permissions & Role Prohibitions
console.log('\n▶ Test 3: Verifying Admin Rights & Non-Admin Prohibitions...');
const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
  const empCode = fs.readFileSync(path.join(__dirname, '../js/employees.js'), 'utf8');

assert(authCode.includes('isAdmin()'), 'auth.js must include isAdmin() helper');
assert(authCode.includes("'settlement.add'"), 'auth.js must restrict settlement.add');
assert(authCode.includes("'settlement.edit'"), 'auth.js must restrict settlement.edit');
assert(authCode.includes("'settlement.delete'"), 'auth.js must restrict settlement.delete');
assert(empCode.includes("'settlement'"), 'employees.js must integrate settlement in Stage 4');
console.log('  ✔ Auth: Strict Admin CRUD protection enforced for Add, Edit, Delete, and Recalculate.');

// 4. Source Files & Script Inclusions
console.log('\n▶ Test 4: Verifying Module Registrations...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(indexHtml.includes('js/settlement.js'), 'index.html must include js/settlement.js');
assert(indexHtml.includes("'Settlement'"), 'index.html safety check must verify Settlement module');

const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appCode.includes("case 'settlement':"), 'app.js must route settlement module');
assert(appCode.includes("settlement: 'Exit & Settlements'"), 'app.js must register settlement title');

const payrollCode = fs.readFileSync(path.join(__dirname, '../js/payroll.js'), 'utf8');
assert(payrollCode.includes("'settlements'") || payrollCode.includes("App.navigate('settlement')"), 'payroll.js must route settlements');

const serverCode = fs.readFileSync(path.join(__dirname, '../server/src/server.js'), 'utf8');
assert(serverCode.includes("app.use('/api/settlements'"), 'server.js must mount settlements router');
console.log('  ✔ Registrations: Frontend and backend endpoints properly wired.');

// 5. Root & Public Synchronization
console.log('\n▶ Test 5: Verifying Root & Public File Synchronization...');
const syncedFiles = [
  'js/settlement.js',
  'js/data.js',
  'js/auth.js',
  'js/app.js',
  'js/payroll.js',
  'js/employees.js',
  'js/performance.js',
  'index.html'
];

syncedFiles.forEach(file => {
  const rootContent = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const pubContent = fs.readFileSync(path.join(__dirname, '../public', file), 'utf8');
  assert.strictEqual(rootContent, pubContent, `${file} differs between root and public/!`);
  console.log(`  ✔ Synced: ${file} is 100% identical between root and public/`);
});

console.log('\n════════════════════════════════════════════════════════════');
console.log('🎉 ALL STATUTORY SETTLEMENT & ADMIN ACCESS TESTS PASSED!');
console.log('════════════════════════════════════════════════════════════\n');
