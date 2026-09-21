const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING ENTERPRISE RECRUITMENT MODULE & STREAMLINED TABS');
console.log('════════════════════════════════════════════════════════════\n');

let passed = 0;
let total = 0;

function assert(condition, desc) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✔ [PASS] ${desc}`);
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    process.exitCode = 1;
  }
}

// 1. Check file separation and exports
console.log('▶ Test 1: Architectural Separation & Dedicated Module...');
const recruitContent = fs.readFileSync('js/recruitment.js', 'utf8');
const perfContent = fs.readFileSync('js/performance.js', 'utf8');

assert(recruitContent.includes('const Recruitment = {'), 'js/recruitment.js declares Recruitment object');
assert(recruitContent.includes('module.exports = Recruitment'), 'js/recruitment.js exports Recruitment');
assert(!perfContent.includes('const Recruitment = {'), 'js/performance.js no longer contains Recruitment');
assert(perfContent.includes('module.exports = Performance'), 'js/performance.js exports Performance');

// 2. Check 4 Clean Lifecycle Stages
console.log('\n▶ Test 2: Validating 4 Streamlined Lifecycle Tabs...');
assert(recruitContent.includes('Overview &amp; Requisitions'), 'Tab 1: Overview & Requisitions is present');
assert(recruitContent.includes('Job Openings'), 'Tab 2: Job Openings is present');
assert(recruitContent.includes('Candidate Pipeline &amp; Evaluation'), 'Tab 3: Candidate Pipeline & Evaluation is present');
assert(recruitContent.includes('Offers &amp; Onboarding'), 'Tab 4: Offers & Onboarding is present');

// 3. Check Sub-Navigation Controls
console.log('\n▶ Test 3: Validating Stage Sub-Navigation Controls...');
assert(recruitContent.includes("Recruitment.switchView('pipeline')") && recruitContent.includes("Recruitment.switchView('interviews')") && recruitContent.includes("Recruitment.switchView('assessment_sheets')"), 'Stage 3 has unified sub-nav across Pipeline, Interviews, and Assessment Sheets');
assert(recruitContent.includes("Recruitment.switchView('offers')") && recruitContent.includes("Recruitment.switchView('onboarding')"), 'Stage 4 has unified sub-nav between Offer Letters and Onboarding');
assert(recruitContent.includes("Recruitment.switchView('dashboard')"), 'Stage 1 provides 1-click access to Funnel Analytics & KPIs');

// 4. Check Root and Public Sync
console.log('\n▶ Test 4: Verifying Root & Public File Synchronization...');
const filesToSync = [
  'js/recruitment.js',
  'js/performance.js',
  'index.html'
];

filesToSync.forEach(relPath => {
  const rootFile = fs.readFileSync(relPath, 'utf8');
  const pubFile = fs.readFileSync(path.join('public', relPath), 'utf8');
  assert(rootFile === pubFile, `Synced: ${relPath} is 100% identical between root and public/`);
});

console.log('\n════════════════════════════════════════════════════════════');
if (passed === total) {
  console.log(`🎉 ALL ${passed} RECRUITMENT VERIFICATION TESTS PASSED!`);
} else {
  console.log(`⚠️ ${total - passed} OF ${total} TESTS FAILED!`);
}
console.log('════════════════════════════════════════════════════════════\n');
