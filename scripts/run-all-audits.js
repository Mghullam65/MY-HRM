const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const scriptsDir = __dirname;
const allFiles = fs.readdirSync(scriptsDir)
  .filter(f => (f.startsWith('verify-') || f.startsWith('test-') || f.startsWith('simulate-') || f === 'system-wide-health-audit.js') && f.endsWith('.js') && f !== 'run-all-audits.js');

console.log(`Found ${allFiles.length} audit & verification test suites in scripts/\n`);

const results = [];
let passCount = 0;
let failCount = 0;

for (let i = 0; i < allFiles.length; i++) {
  const f = allFiles[i];
  process.stdout.write(`[${i + 1}/${allFiles.length}] Testing ${f}... `);
  try {
    const out = execSync(`node "${path.join(scriptsDir, f)}"`, {
      encoding: 'utf8',
      timeout: 60000,
      stdio: 'pipe'
    });
    console.log('✅ PASS');
    passCount++;
    results.push({ file: f, status: 'PASS' });
  } catch (err) {
    console.log('❌ FAIL');
    failCount++;
    const errMsg = (err.stdout || err.stderr || err.message || '').slice(0, 400);
    results.push({ file: f, status: 'FAIL', error: errMsg });
  }
}

console.log('\n' + '='.repeat(60));
console.log(`TOTAL SUITES EXECUTED : ${allFiles.length}`);
console.log(`✅ PASSED             : ${passCount}`);
console.log(`❌ FAILED             : ${failCount}`);
console.log(`📈 SUCCESS RATE       : ${((passCount / allFiles.length) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

if (failCount > 0) {
  console.log('\nFAILED SUITES DETAILS:');
  results.filter(r => r.status === 'FAIL').forEach(f => {
    console.log(`\n❌ ${f.file}:`);
    console.log(f.error);
  });
}
