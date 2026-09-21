const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== STEP 1: Update index.html Cache Busters ===');
const indexHtmlPath = path.join(__dirname, '../index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8').replace(/\r\n/g, '\n');

indexHtml = indexHtml.replace('js/employees.js?v=2.5.1', 'js/employees.js?v=2.5.2');
indexHtml = indexHtml.replace('js/settlement.js?v=2.5.0', 'js/settlement.js?v=2.5.1');
indexHtml = indexHtml.replace('js/performance.js?v=2.5.0', 'js/performance.js?v=2.5.1');

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('✅ Updated cache busters in index.html');

console.log('\n=== STEP 2: Sync Files to public/ Directory ===');
const filesToSync = [
  'index.html',
  'js/employees.js',
  'js/settlement.js',
  'js/performance.js',
  'js/auth.js',
  'js/app.js',
];

filesToSync.forEach(file => {
  const src = path.join(__dirname, '..', file);
  const dst = path.join(__dirname, '../public', file);
  const content = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dst, content, 'utf8');
  console.log(`✅ Synced ${file} -> public/${file}`);
});

console.log('\n=== STEP 3: Verify Settlement Verification Suite ===');
execSync('node scripts/verify-settlement-engine.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

console.log('\n=== STEP 4: Verify SPMS & Payroll Complete Suite ===');
execSync('node scripts/verify-spms-payroll-complete.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

console.log('\n=== STEP 5: Verify Master HRM Test Suite ===');
execSync('node scripts/master-hrm-test-suite.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

console.log('\n🎉 ALL SYNC AND VERIFICATION STEPS PASSED SUCCESSFULLY!');
