const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('=== STEP 1: Update index.html Cache Busters ===');
const indexHtmlPath = path.join(__dirname, '../index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8').replace(/\r\n/g, '\n');
indexHtml = indexHtml.replace('js/assets.js?v=2.5.0', 'js/assets.js?v=2.5.1');
indexHtml = indexHtml.replace('js/helpdesk.js?v=2.5.0', 'js/helpdesk.js?v=2.5.1');
fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('✅ Updated index.html');

console.log('\n=== STEP 2: Sync Files to public/ Directory ===');
const filesToSync = [
  'index.html',
  'js/assets.js',
  'js/helpdesk.js'
];

filesToSync.forEach(file => {
  const src = path.join(__dirname, '..', file);
  const dst = path.join(__dirname, '../public', file);
  const content = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dst, content, 'utf8');
  console.log(`✅ Synced ${file} -> public/${file}`);
});

console.log('\n=== STEP 3: Verify Assets Module 4 Stages ===');
const assetsCode = fs.readFileSync(path.join(__dirname, '../js/assets.js'), 'utf8');
assert(assetsCode.includes('getActiveStage()'), 'assets.js must define getActiveStage()');
assert(assetsCode.includes('isTabActive('), 'assets.js must define isTabActive()');
assert(assetsCode.includes("'inventory'"), 'assets.js must define Stage 1: inventory');
assert(assetsCode.includes("'custody'"), 'assets.js must define Stage 2: custody');
assert(assetsCode.includes("'maintenance'"), 'assets.js must define Stage 3: maintenance');
assert(assetsCode.includes("'returns'"), 'assets.js must define Stage 4: returns');
console.log('  ✔ Assets: 4 Clean Lifecycle Stages Verified');

console.log('\n=== STEP 4: Verify Helpdesk Module 4 Stages ===');
const helpdeskCode = fs.readFileSync(path.join(__dirname, '../js/helpdesk.js'), 'utf8');
assert(helpdeskCode.includes('getActiveStage()'), 'helpdesk.js must define getActiveStage()');
assert(helpdeskCode.includes('isTabActive('), 'helpdesk.js must define isTabActive()');
assert(helpdeskCode.includes("'tickets'"), 'helpdesk.js must define Stage 1: tickets');
assert(helpdeskCode.includes("'sla_queue'"), 'helpdesk.js must define Stage 2: sla_queue');
assert(helpdeskCode.includes("'grievance'"), 'helpdesk.js must define Stage 3: grievance');
assert(helpdeskCode.includes("'knowledge_base'"), 'helpdesk.js must define Stage 4: knowledge_base');
console.log('  ✔ Helpdesk: 4 Clean Service Stages Verified');

console.log('\n=== STEP 5: Verify 100% Root & Public Synchronization ===');
filesToSync.forEach(file => {
  const root = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const pub = fs.readFileSync(path.join(__dirname, '../public', file), 'utf8');
  assert.strictEqual(root, pub, `${file} is not identical between root and public!`);
  console.log(`  ✔ Synced: ${file} 100% identical`);
});

console.log('\n=== STEP 6: Run Master HRM Verification Suite ===');
execSync('node scripts/verify-settlement-engine.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
execSync('node scripts/verify-performance-and-embedded-settlements.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
execSync('node scripts/master-hrm-test-suite.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

console.log('\n🎉 ALL ASSETS, HELPDESK & SYSTEM VERIFICATIONS PASSED WITH ZERO REGRESSIONS!');
