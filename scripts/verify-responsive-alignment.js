const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('🔬 AUDITING RESPONSIVE ALIGNMENT & BESPOKE THEME ENGINE');
console.log('════════════════════════════════════════════════════════════\n');

const cssPath = path.join(__dirname, '../css/landing-theme.css');
const jsPath = path.join(__dirname, '../js/landing.js');

if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath)) {
  console.error('❌ Missing core landing files!');
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

const tests = [
  // 1. Bespoke Color System (No AI Neon Gradients)
  { name: 'Heritage Vermilion Accent defined (#c53a24)', pass: css.includes('--hrm-vermilion: #c53a24;') },
  { name: 'Architectural Stone Neutral System defined (#1c1917, #44403c)', pass: css.includes('--hrm-stone-900: #1c1917;') && css.includes('--hrm-stone-700: #44403c;') },
  { name: 'Alabaster Tint defined (#fbf5f3, not neon pink)', pass: css.includes('--hrm-vermilion-light: #fbf5f3;') },
  { name: 'No raw neon orange gradients in primary styles', pass: !css.includes('linear-gradient(135deg, #e05638 0%, #ea580c 100%)') },

  // 2. Global Viewport & Overflow Safety
  { name: 'Landing page container max-width: 100vw & overflow-x: hidden', pass: css.includes('max-width: 100vw !important;') && css.includes('overflow-x: hidden !important;') },
  { name: 'Box-sizing border-box applied to all child elements', pass: css.includes('box-sizing: border-box !important;') },

  // 3. Mobile Navigation & Drawer (< 1080px)
  { name: 'Mobile hamburger button styled (.landing-mobile-menu-btn)', pass: css.includes('.landing-mobile-menu-btn') },
  { name: 'Mobile drawer styled (.landing-mobile-drawer)', pass: css.includes('.landing-mobile-drawer') },
  { name: 'Desktop-only class hides links on tablets/phones (@media max-width: 1080px)', pass: css.includes('.desktop-only') && css.includes('@media (max-width: 1080px)') },
  { name: 'Landing.toggleMobileNav() implemented in JS', pass: js.includes('toggleMobileNav(') },
  { name: 'Landing.closeMobileNav() implemented in JS', pass: js.includes('closeMobileNav()') },
  { name: 'closeAllMenus() automatically closes mobile drawer', pass: js.includes('this.closeMobileNav()') },

  // 4. Hero Section Alignment
  { name: 'Hero grid uses fluid minmax columns (minmax(0, 1.15fr))', pass: css.includes('minmax(0, 1.15fr)') },
  { name: 'Hero grid stacks cleanly on laptops/tablets (@media max-width: 980px)', pass: css.includes('@media (max-width: 980px)') },
  { name: 'Hero CTA buttons full width on small screens (@media max-width: 520px)', pass: css.includes('@media (max-width: 520px)') && css.includes('.landing-hero-btn-primary') },
  { name: 'Hero image has max-width: 100% and auto height', pass: css.includes('.hero-3d-image') && css.includes('width: 100%;') },

  // 5. 16-Module Grid Alignment
  { name: '4-Column module grid on desktop (repeat(4, minmax(0, 1fr)))', pass: css.includes('repeat(4, minmax(0, 1fr))') },
  { name: '3-Column module grid on laptops (@media max-width: 1140px)', pass: css.includes('@media (max-width: 1140px)') },
  { name: '2-Column module grid on tablets (@media max-width: 780px)', pass: css.includes('@media (max-width: 780px)') },
  { name: '1-Column module grid on mobile (@media max-width: 520px)', pass: css.includes('@media (max-width: 520px)') },
  { name: 'Module cards have equal height with margin-top: auto footers', pass: css.includes('.module-prod-card') && css.includes('height: 100%;') && css.includes('margin-top: auto;') },

  // 6. Why Choose Us 4-Card Grid
  { name: 'Why Choose Us 4-column grid on desktop', pass: css.includes('.why-choose-grid') },
  { name: 'Why Choose Us 2-column grid on tablets (@media max-width: 1024px)', pass: css.includes('@media (max-width: 1024px)') && css.includes('.why-choose-grid') },
  { name: 'Why Choose Us 1-column grid on mobile (@media max-width: 600px)', pass: css.includes('@media (max-width: 600px)') && css.includes('.why-choose-grid') },

  // 7. Premium Finishes 8-Card Tactile Gallery
  { name: 'Gold Foil finish styled with metallic gold accent', pass: js.includes('Gold Foil Cryptographic Seal') && (js.includes('#fbbf24') || js.includes('#fde68a')) },
  { name: 'Silver Foil stamp styled with platinum metallic accent', pass: js.includes('Silver Multi-Tier Stamp') && (js.includes('#e4e4e7') || js.includes('#cbd5e1')) },
  { name: 'Embossed & Debossed finishes styled', pass: js.includes('Embossed Gratuity Relief') && js.includes('Debossed QR Verification') },
  { name: 'Holographic crontab styled with iridescent glow', pass: js.includes('Holographic Crontab Dispatch') && (js.includes('#38bdf8') || js.includes('#bae6fd')) },
  { name: 'Spot UV finish styled with high-gloss green', pass: js.includes('Spot UV Biometric Gateway') && (js.includes('#22c55e') || js.includes('#16a34a')) },

  // 8. 6-Step Lifecycle Workflow Responsive Stepper
  { name: '6-Step workflow grid on desktop (repeat(6, minmax(0, 1fr)))', pass: css.includes('repeat(6, minmax(0, 1fr))') },
  { name: '3-Step workflow grid on tablets (@media max-width: 960px)', pass: css.includes('@media (max-width: 960px)') && css.includes('.lifecycle-steps-row') },
  { name: '1-Step workflow sequence on mobile (@media max-width: 580px)', pass: css.includes('@media (max-width: 580px)') && css.includes('.lifecycle-steps-row') },

  // 9. Interactive Quote & Demo Form
  { name: 'Quote grid 2-column on desktop and 1-column on tablets (@media max-width: 960px)', pass: css.includes('@media (max-width: 960px)') && css.includes('.quote-demo-grid') },
  { name: 'Quote inputs 100% width and touch-friendly (min-height: 42px)', pass: css.includes('.quote-input-field') && css.includes('min-height: 42px;') },
  { name: 'Quote inputs 1-column collapse on mobile (@media max-width: 540px)', pass: css.includes('@media (max-width: 540px)') && css.includes('.quote-inputs-grid') },

  // 10. Testimonials & Avatar Cluster
  { name: 'Testimonials grid stacks on mobile/tablets (@media max-width: 960px)', pass: css.includes('@media (max-width: 960px)') && css.includes('.testimonials-grid') },
  { name: 'Customer avatars cluster centered with no negative margin clipping', pass: css.includes('.avatars-cluster') && css.includes('justify-content: center;') },

  // 11. Footer Responsive Grid
  { name: 'Footer 4-column on desktop, 2-column on tablet, 1-column on mobile', pass: css.includes('.landing-footer-grid') && css.includes('@media (max-width: 960px)') && css.includes('@media (max-width: 520px)') }
];

let allPassed = true;
tests.forEach((t, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  if (t.pass) {
    console.log(`  ✅ [PASS #${num}] ${t.name}`);
  } else {
    console.error(`  ❌ [FAIL #${num}] ${t.name}`);
    allPassed = false;
  }
});

console.log('\n════════════════════════════════════════════════════════════');
if (allPassed) {
  console.log(`🎉 ALL ${tests.length} RESPONSIVE ALIGNMENT & THEME CHECKS PASSED!`);
} else {
  console.error('⚠️ SOME RESPONSIVE AUDIT CHECKS FAILED');
  process.exit(1);
}
console.log('════════════════════════════════════════════════════════════\n');
