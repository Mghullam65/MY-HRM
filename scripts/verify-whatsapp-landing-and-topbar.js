const fs = require('fs');
const path = require('path');

console.log('🧪 Verifying Topbar Theme Toggle Removal & Landing WhatsApp Widget Integration...\n');

const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'css', 'main.css');

const pubAppJsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
const pubIndexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
const pubCssPath = path.join(__dirname, '..', 'public', 'css', 'main.css');

const appJs = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8').replace(/\r\n/g, '\n');
const css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');

const pubAppJs = fs.readFileSync(pubAppJsPath, 'utf8').replace(/\r\n/g, '\n');
const pubIndexHtml = fs.readFileSync(pubIndexHtmlPath, 'utf8').replace(/\r\n/g, '\n');
const pubCss = fs.readFileSync(pubCssPath, 'utf8').replace(/\r\n/g, '\n');

function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ [FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${msg}`);
}

// 1. Files in sync
assert(css === pubCss, 'css/main.css and public/css/main.css are identical');
assert(appJs === pubAppJs, 'js/app.js and public/js/app.js are identical');
assert(indexHtml === pubIndexHtml, 'index.html and public/index.html are identical');

// 2. Topbar theme toggle (moon icon) removed from dashboard topbar
assert(!appJs.includes('<button class="theme-toggle-btn topbar-btn"'), 'Moon theme toggle button removed from App.renderTopbar()');
assert(!appJs.includes('title="${isDark ? \'Switch to Light Mode\' : \'Switch to Dark Mode\'}"'), 'Topbar theme toggle title string removed');

// 3. WhatsApp widget in index.html
assert(indexHtml.includes('id="landing-whatsapp-launcher"'), 'WhatsApp launcher widget container present in index.html');
assert(indexHtml.includes('https://wa.me/923482354146'), 'WhatsApp chat link properly targets wa.me/923482354146');
assert(indexHtml.includes('0348-2354146') || indexHtml.includes('03482354146'), 'Phone number 03482354146 present inside widget');
assert(indexHtml.includes('whatsapp-hover-popup'), 'Hover popup card wrapper present for deferred number display');

// 4. Raw number privacy: number only in hover popup
assert(indexHtml.includes('<div class="whatsapp-popup-number">0348-2354146</div>'), 'Number isolated specifically in hover popup element');

// 5. CSS definitions for WhatsApp widget
assert(css.includes('.landing-whatsapp-launcher'), 'CSS contains .landing-whatsapp-launcher rule');
assert(css.includes('.whatsapp-icon-circle'), 'CSS contains .whatsapp-icon-circle rule');
assert(css.includes('.whatsapp-badge-pulse'), 'CSS contains .whatsapp-badge-pulse rule');
assert(css.includes('.whatsapp-hover-popup'), 'CSS contains .whatsapp-hover-popup rule');
assert(css.includes('opacity: 0;\n  visibility: hidden;'), 'Hover popup hidden by default with opacity 0 and visibility hidden');
assert(css.includes('.whatsapp-btn-link:hover .whatsapp-hover-popup'), 'Hover popup revealed on hover/focus');
assert(css.includes('body.app-workspace-active #landing-whatsapp-launcher'), 'WhatsApp launcher hidden in app workspace');
assert(css.includes('body.login-view-active #landing-whatsapp-launcher'), 'WhatsApp launcher hidden on login view');

// 6. Display lifecycle hooks in app.js
assert(appJs.includes("const waBtn = document.getElementById('landing-whatsapp-launcher');\n    if (waBtn) waBtn.style.display = 'flex';"), 'showLanding sets WhatsApp launcher to flex');
assert(appJs.includes("if (waBtn) waBtn.style.display = 'none';"), 'Other views hide WhatsApp launcher');

console.log('\n🎉 ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
