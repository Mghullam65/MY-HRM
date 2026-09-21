const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('=== STEP 1: Update index.html Cache Busters ===');
const indexHtmlPath = path.join(__dirname, '../index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8').replace(/\r\n/g, '\n');
indexHtml = indexHtml.replace('js/landing.js?v=2.5.0', 'js/landing.js?v=2.5.1');
fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('✅ Updated index.html');

console.log('\n=== STEP 2: Sync Files to public/ Directory ===');
const filesToSync = [
  'index.html',
  'js/landing.js',
  'css/main.css'
];

filesToSync.forEach(file => {
  const src = path.join(__dirname, '..', file);
  const dst = path.join(__dirname, '../public', file);
  const content = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dst, content, 'utf8');
  console.log(`✅ Synced ${file} -> public/${file}`);
});

console.log('\n=== STEP 3: Verify Landing Page Enhancements ===');
const landingCode = fs.readFileSync(path.join(__dirname, '../js/landing.js'), 'utf8');
assert(landingCode.includes('toggleTheme()'), 'landing.js must define toggleTheme()');
assert(landingCode.includes('applyTheme('), 'landing.js must define applyTheme()');
assert(landingCode.includes('id="landing-theme-toggle-btn"'), 'landing.js must render landing-theme-toggle-btn');
assert(landingCode.includes('leaves: {'), 'landing.js must define leaves pillar');
assert(landingCode.includes('multi_company: {'), 'landing.js must define multi_company pillar');
assert(landingCode.includes('settlement: {'), 'landing.js must define settlement pillar');
assert(landingCode.includes('Stage 4: Life Events & Exit Settlements (F&F)'), 'landing.js must highlight Stage 4 Exit & Settlements');
assert(landingCode.includes('Stage 3: 9-Box Talent Matrix'), 'landing.js must highlight Stage 3 9-Box Grid');
console.log('  ✔ Landing Page Pillars & Theme Toggle Verified');

console.log('\n=== STEP 4: Verify Root and Public 100% Sync ===');
filesToSync.forEach(file => {
  const rootContent = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const pubContent = fs.readFileSync(path.join(__dirname, '../public', file), 'utf8');
  assert.strictEqual(rootContent, pubContent, `${file} is not identical between root and public!`);
  console.log(`  ✔ Synced: ${file} 100% identical`);
});

console.log('\n=== STEP 5: Run Master Test Suite ===');
execSync('node scripts/verify-settlement-engine.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
execSync('node scripts/verify-performance-and-embedded-settlements.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

console.log('\n🎉 ALL LANDING PAGE UPDATES & VERIFICATIONS PASSED!');
