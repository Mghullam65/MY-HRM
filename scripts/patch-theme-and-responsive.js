const fs = require('fs');
const path = require('path');

const landingPath = path.join(__dirname, '../js/landing.js');
let code = fs.readFileSync(landingPath, 'utf8');

// 1. Add toggleMobileNav and closeMobileNav methods if not present
if (!code.includes('toggleMobileNav(')) {
  const insertMarker = 'closeAllMenus() {';
  const navMethods = `toggleMobileNav(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const drawer = document.getElementById('landing-mobile-drawer');
    if (!drawer) return;
    drawer.classList.toggle('open');
  },

  closeMobileNav() {
    const drawer = document.getElementById('landing-mobile-drawer');
    if (drawer) drawer.classList.remove('open');
  },

  `;
  code = code.replace(insertMarker, navMethods + insertMarker);
}

// 2. Ensure closeAllMenus calls closeMobileNav
if (!code.includes('this.closeMobileNav()')) {
  code = code.replace(
    'closeAllMenus() {\n    this.closeModulesMenu();\n    this.closeResourcesMenu();\n  },',
    'closeAllMenus() {\n    this.closeModulesMenu();\n    this.closeResourcesMenu();\n    this.closeMobileNav();\n  },'
  );
}

// 3. Update renderPremiumFinishesGrid to tactile luxury cards matching screenshot
const newFinishesCode = `  renderPremiumFinishesGrid() {
    const finishes = [
      { title: 'Gold Foil Cryptographic Seal', icon: 'fa-stamp', bg: 'radial-gradient(ellipse at center, #272218 0%, #0d0c0a 100%)', color: '#fbbf24', shadow: 'rgba(251,191,36,0.45)' },
      { title: 'Silver Multi-Tier Stamp', icon: 'fa-users-gear', bg: 'linear-gradient(135deg, #262629 0%, #0e0e11 100%)', color: '#e4e4e7', shadow: 'rgba(228,228,231,0.35)' },
      { title: 'Embossed Gratuity Relief', icon: 'fa-scale-balanced', bg: '#1c1917', color: '#d6d3d1', shadow: 'rgba(214,211,209,0.3)' },
      { title: 'Debossed QR Verification', icon: 'fa-qrcode', bg: '#18181b', color: '#a1a1aa', shadow: 'rgba(161,161,170,0.3)' },
      { title: 'Holographic Crontab Dispatch', icon: 'fa-file-pdf', bg: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #0c0a09 100%)', color: '#38bdf8', shadow: 'rgba(56,189,248,0.45)' },
      { title: 'Spot UV Biometric Gateway', icon: 'fa-fingerprint', bg: '#09090b', color: '#22c55e', shadow: 'rgba(34,197,94,0.4)' },
      { title: 'Matte Corporate Scoping', icon: 'fa-building-shield', bg: '#18181b', color: '#f97316', shadow: 'rgba(249,115,22,0.4)' },
      { title: 'Soft-Touch Asset Custody', icon: 'fa-barcode', bg: '#1c1917', color: '#f43f5e', shadow: 'rgba(244,63,94,0.4)' }
    ];

    return finishes.map(f => \`
      <div class="premium-card">
        <div class="premium-card-preview" style="background:\${f.bg};color:\${f.color}">
          <i class="fa \${f.icon}" style="filter:drop-shadow(0 2px 10px \${f.shadow})"></i>
        </div>
        <div class="premium-card-badge">
          <i class="fa fa-circle-check"></i>
          <span>\${f.title}</span>
        </div>
      </div>
    \`).join('');
  },`;

const startFin = code.indexOf('  renderPremiumFinishesGrid() {');
const endFin = code.indexOf('  renderWorkflowSteps() {');
if (startFin !== -1 && endFin !== -1) {
  code = code.substring(0, startFin) + newFinishesCode + '\n\n' + code.substring(endFin);
}

// 4. Update the navbar in render() to include desktop-only and mobile hamburger + drawer
const oldNavSection = `            <nav class="landing-nav-links">
              <a href="#" class="landing-nav-link" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">Home</a>
              <a href="#modules-section" class="landing-nav-link" onclick="Landing.scrollTo('modules-section');return false;">16 Modules</a>
              <a href="#why-us" class="landing-nav-link" onclick="Landing.scrollTo('why-us');return false;">Why Choose Us</a>
              <a href="#capabilities" class="landing-nav-link" onclick="Landing.scrollTo('capabilities');return false;">Capabilities</a>
              <a href="#workflow" class="landing-nav-link" onclick="Landing.scrollTo('workflow');return false;">Workflow</a>
              <a href="#tax-calc" class="landing-nav-link" onclick="Landing.scrollTo('tax-calc');return false;">Tax Calculator</a>
              <a href="#faq" class="landing-nav-link" onclick="Landing.scrollTo('faq');return false;">FAQs</a>
              <a href="#careers" class="landing-nav-link" onclick="Landing.scrollTo('careers');return false;">Careers <span class="landing-careers-nav-pill" style="background:#fff5f2;color:#e05638;border:1px solid rgba(224,86,56,0.3)">\${openJobsCount}&nbsp;Open</span></a>
            </nav>

            <div class="landing-nav-actions" style="display:flex;align-items:center;gap:12px">
              <button class="landing-btn-signin" onclick="App.showLogin()" title="Sign in to HRM Portal">
                <i class="fa fa-right-to-bracket"></i>
                <span>Sign In</span>
              </button>
              <button class="landing-btn-cta" onclick="Landing.scrollTo('quote-section')" title="Request Custom Proposal & Trial">
                <span>Get Free Quote / Trial</span>
              </button>
            </div>
          </div>
        </header>`;

const newNavSection = `            <!-- Desktop Nav Links -->
            <nav class="landing-nav-links desktop-only">
              <a href="#" class="landing-nav-link" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">Home</a>
              <a href="#modules-section" class="landing-nav-link" onclick="Landing.scrollTo('modules-section');return false;">16 Modules</a>
              <a href="#why-us" class="landing-nav-link" onclick="Landing.scrollTo('why-us');return false;">Why Choose Us</a>
              <a href="#capabilities" class="landing-nav-link" onclick="Landing.scrollTo('capabilities');return false;">Capabilities</a>
              <a href="#workflow" class="landing-nav-link" onclick="Landing.scrollTo('workflow');return false;">Workflow</a>
              <a href="#tax-calc" class="landing-nav-link" onclick="Landing.scrollTo('tax-calc');return false;">Tax Calculator</a>
              <a href="#faq" class="landing-nav-link" onclick="Landing.scrollTo('faq');return false;">FAQs</a>
              <a href="#careers" class="landing-nav-link" onclick="Landing.scrollTo('careers');return false;">Careers <span class="landing-careers-nav-pill" style="background:var(--hrm-vermilion-light);color:var(--hrm-vermilion);border:1px solid var(--hrm-vermilion-border)">\${openJobsCount}&nbsp;Open</span></a>
            </nav>

            <div class="landing-nav-actions">
              <button class="landing-btn-signin desktop-only" onclick="App.showLogin()" title="Sign in to HRM Portal">
                <i class="fa fa-right-to-bracket"></i>
                <span>Sign In</span>
              </button>
              <button class="landing-btn-cta" onclick="Landing.scrollTo('quote-section')" title="Request Custom Proposal & Trial">
                <span>Get Free Quote / Trial</span>
              </button>
              <!-- Mobile Hamburger Toggle Button -->
              <button class="landing-mobile-menu-btn" onclick="Landing.toggleMobileNav(event)" aria-label="Toggle navigation menu">
                <i class="fa fa-bars"></i>
              </button>
            </div>
          </div>

          <!-- Mobile Nav Drawer -->
          <div class="landing-mobile-drawer" id="landing-mobile-drawer">
            <div class="landing-mobile-drawer-inner">
              <a href="#" class="landing-mobile-link" onclick="Landing.closeMobileNav();window.scrollTo({top:0,behavior:'smooth'});return false;"><i class="fa fa-house"></i> Home</a>
              <a href="#modules-section" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('modules-section');return false;"><i class="fa fa-cubes"></i> 16 Enterprise Modules</a>
              <a href="#why-us" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('why-us');return false;"><i class="fa fa-award"></i> Why Choose Us</a>
              <a href="#capabilities" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('capabilities');return false;"><i class="fa fa-gem"></i> Premium Capabilities</a>
              <a href="#workflow" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('workflow');return false;"><i class="fa fa-arrows-split-up-and-left"></i> Lifecycle Workflow</a>
              <a href="#tax-calc" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('tax-calc');return false;"><i class="fa fa-calculator"></i> Tax Calculator</a>
              <a href="#faq" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('faq');return false;"><i class="fa fa-circle-question"></i> FAQs</a>
              <a href="#careers" class="landing-mobile-link" onclick="Landing.closeMobileNav();Landing.scrollTo('careers');return false;"><i class="fa fa-briefcase"></i> Careers (\${openJobsCount} Open)</a>
              <div class="landing-mobile-actions">
                <button class="landing-btn-signin" style="width:100%;justify-content:center" onclick="Landing.closeMobileNav();App.showLogin()"><i class="fa fa-right-to-bracket"></i> Sign In to Portal</button>
                <button class="landing-btn-cta" style="width:100%;justify-content:center" onclick="Landing.closeMobileNav();Landing.scrollTo('quote-section')">Request Free Proposal</button>
              </div>
            </div>
          </div>
        </header>`;

if (code.includes(oldNavSection)) {
  code = code.replace(oldNavSection, newNavSection);
}

fs.writeFileSync(landingPath, code, 'utf8');
console.log('✅ Updated landing.js with mobile drawer, hamburger button, and luxury finish cards.');
