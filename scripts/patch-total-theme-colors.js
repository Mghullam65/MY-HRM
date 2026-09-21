const fs = require('fs');
const path = require('path');

console.log('=== STEP 1: Updating css/main.css for Complete Theme Transformation ===');
const cssPath = path.join(__dirname, '../css/main.css');
let css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');

// Replace the permanent dark overrides block (from line 8420 onwards)
const darkBlockStart = '/* ═════════════════════════════════════════════════════════════════\n   PERMANENT SIGNATURE DARK SCHEME FOR PUBLIC LANDING & SHOWCASE PAGES';
const startIndex = css.indexOf(darkBlockStart);

if (startIndex === -1) {
  console.error('Could not find darkBlockStart in css/main.css');
  process.exit(1);
}

// Slice off everything from startIndex
css = css.slice(0, startIndex);

// Add both fully defined [data-theme="dark"] AND [data-theme="light"] blocks
const fullThemeCss = `/* ═════════════════════════════════════════════════════════════════
   THEME STYLES FOR PUBLIC LANDING & SHOWCASE PAGES (DARK & LIGHT)
   ═════════════════════════════════════════════════════════════════ */

/* ── 1. OBSIDIAN DARK THEME ── */
[data-theme="dark"] #landing-page,
[data-theme="dark"] .landing-wrapper,
[data-theme="dark"] #module-detail-page,
[data-theme="dark"] #trial-page {
  --bg:             hsl(222, 47%, 7%) !important;
  --bg-2:           hsl(222, 40%, 10%) !important;
  --surface:        hsl(222, 35%, 13%) !important;
  --surface-2:      hsl(222, 30%, 17%) !important;
  --card:           hsl(222, 28%, 15%) !important;
  --card-hover:     hsl(222, 28%, 19%) !important;
  --border:         hsl(222, 25%, 22%) !important;
  --border-light:   hsl(222, 20%, 28%) !important;
  --text:           hsl(210, 40%, 96%) !important;
  --text-2:         hsl(210, 20%, 72%) !important;
  --text-3:         hsl(210, 15%, 52%) !important;
  --text-muted:     hsl(210, 12%, 40%) !important;
  --sidebar-bg:     hsl(222, 47%, 8%) !important;
  --sidebar-border: hsl(222, 30%, 16%) !important;
  color-scheme: dark !important;
}

[data-theme="dark"] .landing-wrapper {
  background: 
    radial-gradient(ellipse 85% 45% at 50% -15%, rgba(99, 102, 241, 0.24), transparent),
    radial-gradient(circle at 92% 18%, rgba(56, 189, 248, 0.14), transparent 45%),
    radial-gradient(circle at 8% 35%, rgba(139, 92, 246, 0.12), transparent 45%),
    #080c16 !important;
  color: #f8fafc !important;
}

[data-theme="dark"] .landing-header {
  background: rgba(8, 12, 22, 0.88) !important;
  border-bottom: 1px solid rgba(30, 41, 59, 0.7) !important;
}

[data-theme="dark"] .landing-brand-name {
  color: #f8fafc !important;
}

[data-theme="dark"] .landing-brand-tag {
  color: #94a3b8 !important;
}

[data-theme="dark"] .landing-nav-link {
  color: #94a3b8 !important;
}
[data-theme="dark"] .landing-nav-link:hover {
  color: #ffffff !important;
}
[data-theme="dark"] .landing-btn-signin {
  color: #e2e8f0 !important;
  border-color: rgba(51, 65, 85, 0.8) !important;
  background: rgba(15, 23, 42, 0.6) !important;
}
[data-theme="dark"] .landing-btn-signin:hover {
  color: #ffffff !important;
  border-color: #3b82f6 !important;
  background: rgba(30, 41, 59, 0.85) !important;
}
[data-theme="dark"] .landing-pill-badge {
  background: rgba(30, 41, 59, 0.7) !important;
  border-color: rgba(51, 65, 85, 0.8) !important;
  color: #93c5fd !important;
}
[data-theme="dark"] .landing-hero-title {
  color: #ffffff !important;
}
[data-theme="dark"] .landing-hero-sub {
  color: #94a3b8 !important;
}
[data-theme="dark"] .landing-hero-btn-secondary {
  color: #cbd5e1 !important;
  border-color: rgba(51, 65, 85, 0.9) !important;
  background: rgba(15, 23, 42, 0.6) !important;
}
[data-theme="dark"] .landing-hero-btn-secondary:hover {
  color: #ffffff !important;
  border-color: #3b82f6 !important;
  background: rgba(30, 41, 59, 0.9) !important;
}
[data-theme="dark"] .landing-trust-item strong {
  color: #f1f5f9 !important;
}
[data-theme="dark"] .landing-trust-item span {
  color: #94a3b8 !important;
}
[data-theme="dark"] .landing-section-title {
  color: #ffffff !important;
}
[data-theme="dark"] .landing-section-sub {
  color: #94a3b8 !important;
}
[data-theme="dark"] .landing-feature-card,
[data-theme="dark"] .pillar-showcase-card,
[data-theme="dark"] .security-card,
[data-theme="dark"] .landing-stat-box,
[data-theme="dark"] .landing-testimonial-box,
[data-theme="dark"] .automation-step-card,
[data-theme="dark"] .hero-3d-badge-floating,
[data-theme="dark"] .career-job-card {
  background: rgba(15, 23, 42, 0.65) !important;
  border: 1px solid rgba(30, 41, 59, 0.8) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}
[data-theme="dark"] .landing-feature-card:hover,
[data-theme="dark"] .career-job-card:hover {
  background: rgba(15, 23, 42, 0.9) !important;
  border-color: rgba(79, 70, 229, 0.5) !important;
}
[data-theme="dark"] .feature-card-title,
[data-theme="dark"] .security-title,
[data-theme="dark"] .step-title,
[data-theme="dark"] .stat-number,
[data-theme="dark"] .testimonial-name {
  color: #f1f5f9 !important;
}
[data-theme="dark"] .feature-card-desc,
[data-theme="dark"] .security-desc,
[data-theme="dark"] .step-desc,
[data-theme="dark"] .stat-label,
[data-theme="dark"] .testimonial-quote-text {
  color: #94a3b8 !important;
}
[data-theme="dark"] .pillar-tabs-nav {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(30, 41, 59, 0.7) !important;
}
[data-theme="dark"] .pillar-tab-btn {
  color: #94a3b8 !important;
}
[data-theme="dark"] .pillar-tab-btn:hover:not(.active) {
  color: #ffffff !important;
  background: rgba(30, 41, 59, 0.6) !important;
}
[data-theme="dark"] .pillar-tab-btn.active {
  background: var(--primary, #4f46e5) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4) !important;
}
[data-theme="dark"] .pillar-cap-item {
  background: rgba(15, 23, 42, 0.4) !important;
  border: 1px solid rgba(30, 41, 59, 0.6) !important;
}
[data-theme="dark"] .pillar-cap-title {
  color: #f1f5f9 !important;
}
[data-theme="dark"] .pillar-cap-desc {
  color: #94a3b8 !important;
}
[data-theme="dark"] .tax-calc-card {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 12, 22, 0.95)) !important;
  border: 1px solid rgba(59, 130, 246, 0.25) !important;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7) !important;
  color: #ffffff !important;
}
[data-theme="dark"] .tax-calc-card h2 {
  color: #ffffff !important;
}
[data-theme="dark"] .tax-calc-card p {
  color: #cbd5e1 !important;
}
[data-theme="dark"] .tax-calc-box-input,
[data-theme="dark"] .tax-calc-box-result {
  background: rgba(0, 0, 0, 0.25) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
[data-theme="dark"] .tax-calc-box-input label {
  color: #e2e8f0 !important;
}
[data-theme="dark"] #tax-input-gross {
  background: rgba(0,0,0,0.3) !important;
  border-color: rgba(255,255,255,0.2) !important;
  color: #ffffff !important;
}
[data-theme="dark"] .tax-preset-chip {
  background: rgba(15, 23, 42, 0.7) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: #cbd5e1 !important;
}
[data-theme="dark"] .tax-preset-chip.active {
  background: #2563eb !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}
[data-theme="dark"] .tax-custom-inputs-card {
  background: rgba(15, 23, 42, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
[data-theme="dark"] .landing-mega-menu,
[data-theme="dark"] .landing-dropdown-menu {
  background: rgba(8, 12, 22, 0.95) !important;
  border: 1px solid rgba(30, 41, 59, 0.9) !important;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7) !important;
}
[data-theme="dark"] .mega-menu-header {
  border-bottom: 1px solid rgba(30, 41, 59, 0.8) !important;
}
[data-theme="dark"] .mega-menu-header strong {
  color: #ffffff !important;
}
[data-theme="dark"] .mega-col-title {
  color: #94a3b8 !important;
}
[data-theme="dark"] .mega-item {
  color: #ffffff !important;
}
[data-theme="dark"] .mega-item:hover {
  background: rgba(30, 41, 59, 0.7) !important;
}
[data-theme="dark"] .mega-item-title {
  color: #ffffff !important;
}
[data-theme="dark"] .mega-item-desc {
  color: #94a3b8 !important;
}
[data-theme="dark"] .landing-footer {
  background: #050811 !important;
  border-top: 1px solid rgba(30, 41, 59, 0.8) !important;
}
[data-theme="dark"] .footer-col h4 {
  color: #f8fafc !important;
}
[data-theme="dark"] .footer-col a {
  color: #64748b !important;
}
[data-theme="dark"] .footer-col a:hover {
  color: #38bdf8 !important;
}
[data-theme="dark"] .landing-footer-bottom {
  border-top: 1px solid rgba(30, 41, 59, 0.6) !important;
  color: #64748b !important;
}

/* ── 2. TOTAL CRISP LIGHT THEME ── */
[data-theme="light"] #landing-page,
[data-theme="light"] .landing-wrapper,
[data-theme="light"] #module-detail-page,
[data-theme="light"] #trial-page {
  --bg:             #f8fafc !important;
  --bg-2:           #f1f5f9 !important;
  --surface:        #ffffff !important;
  --surface-2:      #f8fafc !important;
  --card:           #ffffff !important;
  --card-hover:     #f1f5f9 !important;
  --border:         #e2e8f0 !important;
  --border-light:   #f1f5f9 !important;
  --text:           #0f172a !important;
  --text-2:         #334155 !important;
  --text-3:         #64748b !important;
  --text-muted:     #94a3b8 !important;
  --sidebar-bg:     #ffffff !important;
  --sidebar-border: #e2e8f0 !important;
  color-scheme: light !important;
}

[data-theme="light"] .landing-wrapper {
  background: 
    radial-gradient(ellipse 85% 45% at 50% -10%, rgba(99, 102, 241, 0.08), transparent),
    radial-gradient(circle at 92% 18%, rgba(14, 165, 233, 0.06), transparent 45%),
    radial-gradient(circle at 8% 35%, rgba(168, 85, 247, 0.05), transparent 45%),
    #f8fafc !important;
  color: #0f172a !important;
}

[data-theme="light"] .landing-header {
  background: rgba(255, 255, 255, 0.92) !important;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
}

[data-theme="light"] .landing-brand-name {
  color: #0f172a !important;
}

[data-theme="light"] .landing-brand-tag {
  color: #64748b !important;
}

[data-theme="light"] .landing-nav-link {
  color: #475569 !important;
}

[data-theme="light"] .landing-nav-link:hover {
  color: #2563eb !important;
}

[data-theme="light"] .landing-btn-signin {
  color: #1e293b !important;
  border: 1px solid #cbd5e1 !important;
  background: #ffffff !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

[data-theme="light"] .landing-btn-signin:hover {
  color: #2563eb !important;
  border-color: #93c5fd !important;
  background: #eff6ff !important;
}

[data-theme="light"] .landing-pill-badge {
  background: rgba(238, 242, 255, 0.9) !important;
  border: 1px solid #c7d2fe !important;
  color: #4338ca !important;
}

[data-theme="light"] .landing-hero-title {
  color: #0f172a !important;
}

[data-theme="light"] .landing-hero-sub {
  color: #475569 !important;
}

[data-theme="light"] .landing-hero-btn-secondary {
  color: #1e293b !important;
  border: 1px solid #cbd5e1 !important;
  background: #ffffff !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06) !important;
}

[data-theme="light"] .landing-hero-btn-secondary:hover {
  color: #2563eb !important;
  border-color: #93c5fd !important;
  background: #eff6ff !important;
}

[data-theme="light"] .landing-trust-item strong {
  color: #0f172a !important;
}

[data-theme="light"] .landing-trust-item span {
  color: #64748b !important;
}

[data-theme="light"] .landing-section-title {
  color: #0f172a !important;
}

[data-theme="light"] .landing-section-sub {
  color: #475569 !important;
}

[data-theme="light"] .landing-feature-card,
[data-theme="light"] .pillar-showcase-card,
[data-theme="light"] .security-card,
[data-theme="light"] .landing-stat-box,
[data-theme="light"] .landing-testimonial-box,
[data-theme="light"] .automation-step-card,
[data-theme="light"] .hero-3d-badge-floating,
[data-theme="light"] .career-job-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
  color: #0f172a !important;
}

[data-theme="light"] .landing-feature-card:hover,
[data-theme="light"] .career-job-card:hover {
  background: #ffffff !important;
  border-color: rgba(79, 70, 229, 0.4) !important;
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.1) !important;
}

[data-theme="light"] .feature-card-title,
[data-theme="light"] .security-title,
[data-theme="light"] .step-title,
[data-theme="light"] .stat-number,
[data-theme="light"] .testimonial-name {
  color: #0f172a !important;
}

[data-theme="light"] .feature-card-desc,
[data-theme="light"] .security-desc,
[data-theme="light"] .step-desc,
[data-theme="light"] .stat-label,
[data-theme="light"] .testimonial-quote-text,
[data-theme="light"] .testimonial-role {
  color: #475569 !important;
}

[data-theme="light"] .pillar-tabs-nav {
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
}

[data-theme="light"] .pillar-tab-btn {
  color: #64748b !important;
}

[data-theme="light"] .pillar-tab-btn:hover:not(.active) {
  color: #0f172a !important;
  background: rgba(255, 255, 255, 0.6) !important;
}

[data-theme="light"] .pillar-tab-btn.active {
  background: #ffffff !important;
  color: #2563eb !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

[data-theme="light"] .pillar-cap-item {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}

[data-theme="light"] .pillar-cap-title {
  color: #0f172a !important;
}

[data-theme="light"] .pillar-cap-desc {
  color: #64748b !important;
}

[data-theme="light"] .tax-calc-card {
  background: linear-gradient(145deg, #ffffff, #f8fafc) !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.08) !important;
  color: #0f172a !important;
}

[data-theme="light"] .tax-calc-card h2 {
  color: #0f172a !important;
}

[data-theme="light"] .tax-calc-card p {
  color: #475569 !important;
}

[data-theme="light"] .tax-calc-box-input,
[data-theme="light"] .tax-calc-box-result {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .tax-calc-box-input label {
  color: #1e293b !important;
}

[data-theme="light"] #tax-input-gross {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}

[data-theme="light"] .tax-preset-chip {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #334155 !important;
}

[data-theme="light"] .tax-preset-chip.active {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
}

[data-theme="light"] .tax-custom-inputs-card {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}

[data-theme="light"] .landing-mega-menu,
[data-theme="light"] .landing-dropdown-menu {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.12) !important;
}

[data-theme="light"] .mega-menu-header {
  border-bottom: 1px solid #e2e8f0 !important;
}

[data-theme="light"] .mega-menu-header strong {
  color: #0f172a !important;
}

[data-theme="light"] .mega-col-title {
  color: #64748b !important;
}

[data-theme="light"] .mega-item {
  color: #0f172a !important;
}

[data-theme="light"] .mega-item:hover {
  background: #f1f5f9 !important;
}

[data-theme="light"] .mega-item-title {
  color: #0f172a !important;
}

[data-theme="light"] .mega-item-desc {
  color: #64748b !important;
}

[data-theme="light"] .dropdown-item-title {
  color: #0f172a !important;
}

[data-theme="light"] .dropdown-item-desc {
  color: #64748b !important;
}

[data-theme="light"] .landing-footer {
  background: #f1f5f9 !important;
  border-top: 1px solid #e2e8f0 !important;
}

[data-theme="light"] .footer-col h4 {
  color: #0f172a !important;
}

[data-theme="light"] .footer-col a {
  color: #475569 !important;
}

[data-theme="light"] .footer-col a:hover {
  color: #2563eb !important;
}

[data-theme="light"] .landing-footer-bottom {
  border-top: 1px solid #e2e8f0 !important;
  color: #64748b !important;
}

[data-theme="light"] .module-detail-page-wrapper {
  background: #f8fafc !important;
  color: #0f172a !important;
}

[data-theme="light"] .module-detail-header {
  background: rgba(255, 255, 255, 0.92) !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

[data-theme="light"] .module-btn-back {
  color: #475569 !important;
}

[data-theme="light"] .module-btn-back:hover {
  color: #2563eb !important;
}

[data-theme="light"] .module-breadcrumb-cat {
  color: #64748b !important;
}

[data-theme="light"] .module-breadcrumb-active {
  color: #0f172a !important;
}

[data-theme="light"] .module-switcher-btn {
  color: #475569 !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
}

[data-theme="light"] .module-switcher-btn:hover {
  color: #2563eb !important;
  border-color: #93c5fd !important;
}

[data-theme="light"] .module-btn-signin {
  color: #1e293b !important;
  border: 1px solid #cbd5e1 !important;
  background: #ffffff !important;
}

[data-theme="light"] .module-hero-title {
  color: #0f172a !important;
}

[data-theme="light"] .module-hero-subtitle {
  color: #475569 !important;
}

[data-theme="light"] .capability-card,
[data-theme="light"] .role-matrix-table,
[data-theme="light"] .module-related-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .capability-title,
[data-theme="light"] .related-card-title {
  color: #0f172a !important;
}

[data-theme="light"] .capability-desc,
[data-theme="light"] .related-card-desc {
  color: #475569 !important;
}

/* ── 3. Theme Toggle Button ── */
.landing-theme-toggle-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .landing-theme-toggle-btn {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(30, 41, 59, 0.7);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.landing-theme-toggle-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  border-color: var(--primary, #4f46e5);
}
`;

css += fullThemeCss;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ Updated css/main.css with complete Light & Dark themes');

// === STEP 2: Updating Landing.applyTheme in js/landing.js ===
console.log('=== STEP 2: Updating Landing.applyTheme in js/landing.js ===');
const landingPath = path.join(__dirname, '../js/landing.js');
let code = fs.readFileSync(landingPath, 'utf8').replace(/\r\n/g, '\n');

const oldApplyTheme = `  applyTheme(theme) {
    const landingEl = document.getElementById('landing-page');
    const detailEl = document.getElementById('module-detail-page');
    if (landingEl) landingEl.setAttribute('data-theme', theme);
    if (detailEl) detailEl.setAttribute('data-theme', theme);
    const btn = document.getElementById('landing-theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark' 
        ? '<i class="fa fa-sun" style="color:#f59e0b;font-size:16px"></i>' 
        : '<i class="fa fa-moon" style="color:#6366f1;font-size:16px"></i>';
      btn.title = theme === 'dark' ? 'Switch to Crisp Light Theme' : 'Switch to Obsidian Dark Theme';
    }
  },`;

const newApplyTheme = `  applyTheme(theme) {
    const landingEl = document.getElementById('landing-page');
    const detailEl = document.getElementById('module-detail-page');
    if (landingEl) landingEl.setAttribute('data-theme', theme);
    if (detailEl) detailEl.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    const wrappers = document.querySelectorAll('.landing-wrapper, .module-detail-page-wrapper');
    wrappers.forEach(w => w.setAttribute('data-theme', theme));

    const btns = document.querySelectorAll('.landing-theme-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = theme === 'dark' 
        ? '<i class="fa fa-sun" style="color:#f59e0b;font-size:16px"></i>' 
        : '<i class="fa fa-moon" style="color:#6366f1;font-size:16px"></i>';
      btn.title = theme === 'dark' ? 'Switch to Crisp Light Theme' : 'Switch to Obsidian Dark Theme';
    });
  },`;

code = code.replace(oldApplyTheme, newApplyTheme);
fs.writeFileSync(landingPath, code, 'utf8');
console.log('✅ Updated Landing.applyTheme in js/landing.js');

console.log('🎉 Theme colors patch script complete!');
