const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING LANDING PAGE THEME AND COLOR SCHEME ===\n');

// 1. Verify CSS styles and colors
const cssPath = path.join(__dirname, '../css/landing-theme.css');
if (!fs.existsSync(cssPath)) {
  console.error('❌ landing-theme.css not found!');
  process.exit(1);
}
const cssContent = fs.readFileSync(cssPath, 'utf8');

const checks = [
  { name: 'Warm Terracotta/Coral Primary (#e05638)', test: cssContent.includes('#e05638') },
  { name: 'Coral Dark Hover (#c84226)', test: cssContent.includes('#c84226') },
  { name: 'Coral Light Tint (#fff5f2)', test: cssContent.includes('#fff5f2') },
  { name: 'Top Announcement Bar Styling', test: cssContent.includes('.landing-top-announcement') },
  { name: 'Header & Brand Icon Styling', test: cssContent.includes('.landing-brand-icon') },
  { name: '4x4 Module Product Grid', test: cssContent.includes('.modules-product-grid') },
  { name: 'Module Product Card', test: cssContent.includes('.module-prod-card') },
  { name: 'Secondary Banner Styling', test: cssContent.includes('.custom-banner-section') },
  { name: 'Why Choose Us 4-Card Grid', test: cssContent.includes('.why-choose-grid') },
  { name: 'Premium Capabilities / Finishes Grid', test: cssContent.includes('.premium-finishes-grid') },
  { name: '6-Step Lifecycle Workflow Row', test: cssContent.includes('.lifecycle-steps-row') },
  { name: 'Quote / Proposal Request Form', test: cssContent.includes('.quote-demo-section') },
  { name: 'Client Testimonial Feature Card', test: cssContent.includes('.testimonial-coral-card') },
  { name: 'Review Badges & Avatars Cluster', test: cssContent.includes('.avatars-cluster') },
  { name: 'Featured Products Row', test: cssContent.includes('.featured-products-section') },
  { name: 'Integration Partners Row', test: cssContent.includes('.partners-section') },
  { name: 'Modern Footer Styling', test: cssContent.includes('.landing-footer') }
];

let allPassed = true;
checks.forEach(c => {
  if (c.test) {
    console.log(`✅ [CSS] ${c.name} verified`);
  } else {
    console.error(`❌ [CSS] ${c.name} MISSING`);
    allPassed = false;
  }
});

// 2. Verify JS implementation in js/landing.js
const jsPath = path.join(__dirname, '../js/landing.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

const jsChecks = [
  { name: 'Landing.render() exists', test: jsContent.includes('render()') },
  { name: 'Top announcement bar rendered', test: jsContent.includes('landing-top-announcement') },
  { name: '16 Modules product grid rendered', test: jsContent.includes('renderModulesProductGrid') },
  { name: 'Secondary banner rendered', test: jsContent.includes('custom-banner-section') },
  { name: 'Why Choose Us rendered', test: jsContent.includes('why-choose-grid') },
  { name: 'Premium Finishes rendered', test: jsContent.includes('renderPremiumFinishesGrid') },
  { name: 'Workflow steps rendered', test: jsContent.includes('renderWorkflowSteps') },
  { name: 'Quote form rendered', test: jsContent.includes('quote-demo-section') },
  { name: 'submitQuote() handler exists', test: jsContent.includes('submitQuote(') },
  { name: 'Client Testimonials with Tariq Hussain & Avatars', test: jsContent.includes('tariq_hussain.jpg') && jsContent.includes('avatars-cluster') },
  { name: 'Featured Suites rendered', test: jsContent.includes('renderFeaturedSuites') },
  { name: 'Integration Partners rendered', test: jsContent.includes('partners-section') },
  { name: 'Footer rendered', test: jsContent.includes('landing-footer') }
];

console.log('\n--- VERIFYING JAVASCRIPT LANDING IMPLEMENTATION ---');
jsChecks.forEach(c => {
  if (c.test) {
    console.log(`✅ [JS] ${c.name} verified`);
  } else {
    console.error(`❌ [JS] ${c.name} MISSING`);
    allPassed = false;
  }
});

// 3. Verify index.html link
const htmlPath = path.join(__dirname, '../index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
if (htmlContent.includes('css/landing-theme.css')) {
  console.log('\n✅ [HTML] landing-theme.css linked in index.html');
} else {
  console.error('\n❌ [HTML] landing-theme.css NOT linked in index.html');
  allPassed = false;
}

// 4. Verify public build mirroring
const publicCssPath = path.join(__dirname, '../public/css/landing-theme.css');
if (fs.existsSync(publicCssPath)) {
  console.log('✅ [BUILD] public/css/landing-theme.css exists');
} else {
  console.error('❌ [BUILD] public/css/landing-theme.css NOT mirrored');
  allPassed = false;
}

console.log('\n========================================');
if (allPassed) {
  console.log('🎉 ALL LANDING PAGE THEME AUDIT CHECKS PASSED! 🎉');
} else {
  console.error('⚠️ SOME CHECKS FAILED');
  process.exit(1);
}
console.log('========================================\n');
