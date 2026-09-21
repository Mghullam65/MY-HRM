const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('════════════════════════════════════════════════════════════');
console.log('🔄 SYNCHRONIZING ASSETS & RUNNING FULL VERIFICATION SUITE');
console.log('════════════════════════════════════════════════════════════');

// 1. Update cache busters in index.html
const indexHtmlPath = path.join(__dirname, '../index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const bumps = [
  { from: /css\/main\.css\?v=[0-9.]+/g, to: 'css/main.css?v=2.5.2' },
  { from: /js\/landing\.js\?v=[0-9.]+/g, to: 'js/landing.js?v=2.5.2' },
  { from: /js\/payroll\.js\?v=[0-9.]+/g, to: 'js/payroll.js?v=2.5.2' },
  { from: /js\/assets\.js\?v=[0-9.]+/g, to: 'js/assets.js?v=2.5.2' },
  { from: /js\/helpdesk\.js\?v=[0-9.]+/g, to: 'js/helpdesk.js?v=2.5.2' },
  { from: /js\/attendance\.js\?v=[0-9.]+/g, to: 'js/attendance.js?v=2.5.2' },
  { from: /js\/leaves\.js\?v=[0-9.]+/g, to: 'js/leaves.js?v=2.5.2' },
  { from: /js\/performance\.js\?v=[0-9.]+/g, to: 'js/performance.js?v=2.5.2' },
  { from: /js\/employees\.js\?v=[0-9.]+/g, to: 'js/employees.js?v=2.5.2' }
];

bumps.forEach(b => {
  indexHtml = indexHtml.replace(b.from, b.to);
});
fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('✔ Updated cache busters in index.html to v=2.5.2');

// 2. Synchronize all updated files to public/
const filesToSync = [
  'index.html',
  'css/main.css',
  'js/landing.js',
  'js/payroll.js',
  'js/assets.js',
  'js/helpdesk.js',
  'js/attendance.js',
  'js/leaves.js',
  'js/performance.js',
  'js/employees.js'
];

filesToSync.forEach(relPath => {
  const src = path.join(__dirname, '..', relPath);
  const dest = path.join(__dirname, '../public', relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`✔ Synced ${relPath} -> public/${relPath}`);
});

// 3. Run verification test suite
console.log('\n▶ Running verify-tax-and-responsive.js...');
execSync('node scripts/verify-tax-and-responsive.js', { stdio: 'inherit' });

console.log('\n▶ Running verify-spms-payroll-complete.js...');
execSync('node scripts/verify-spms-payroll-complete.js', { stdio: 'inherit' });

console.log('\n▶ Running verify-settlement-engine.js...');
execSync('node scripts/verify-settlement-engine.js', { stdio: 'inherit' });

console.log('\n▶ Running verify-performance-and-embedded-settlements.js...');
execSync('node scripts/verify-performance-and-embedded-settlements.js', { stdio: 'inherit' });

console.log('\n▶ Running master-hrm-test-suite.js...');
execSync('node scripts/master-hrm-test-suite.js', { stdio: 'inherit' });

console.log('\n════════════════════════════════════════════════════════════');
console.log('🎉 100% SYNC & TEST RUN COMPLETE — ALL SUITES PASSED!');
console.log('════════════════════════════════════════════════════════════\n');
