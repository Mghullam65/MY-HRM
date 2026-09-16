// ============================================================
// Script to upgrade Landing Page Theme & Color Scheme
// Handles CRLF / LF normalization robustly
// ============================================================

const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace .landing-wrapper
const oldWrapper = `.landing-wrapper {
  min-height: 100vh;
  background: #ffffff;
  color: #0f172a;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
}

[data-theme="dark"] .landing-wrapper {
  background: #090d16;
  color: #f8fafc;
}`;

const newWrapper = `.landing-wrapper {
  min-height: 100vh;
  background: 
    radial-gradient(ellipse 85% 45% at 50% -15%, rgba(99, 102, 241, 0.12), transparent),
    radial-gradient(circle at 92% 18%, rgba(56, 189, 248, 0.08), transparent 45%),
    radial-gradient(circle at 8% 35%, rgba(139, 92, 246, 0.07), transparent 45%),
    #fafbfd;
  color: #0f172a;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
}

[data-theme="dark"] .landing-wrapper {
  background: 
    radial-gradient(ellipse 85% 45% at 50% -15%, rgba(99, 102, 241, 0.24), transparent),
    radial-gradient(circle at 92% 18%, rgba(56, 189, 248, 0.14), transparent 45%),
    radial-gradient(circle at 8% 35%, rgba(139, 92, 246, 0.12), transparent 45%),
    #080c16;
  color: #f8fafc;
}`;

// Robust replacement helper
function robustReplace(source, targetStr, replacementStr) {
  // Try direct
  if (source.includes(targetStr)) return source.replace(targetStr, replacementStr);
  // Try CRLF normalized
  const targetCRLF = targetStr.replace(/\r?\n/g, '\r\n');
  const replCRLF = replacementStr.replace(/\r?\n/g, '\r\n');
  if (source.includes(targetCRLF)) return source.replace(targetCRLF, replCRLF);
  // Try LF normalized
  const targetLF = targetStr.replace(/\r?\n/g, '\n');
  const replLF = replacementStr.replace(/\r?\n/g, '\n');
  if (source.includes(targetLF)) return source.replace(targetLF, replLF);
  console.warn('Could not match target snippet:', targetStr.slice(0, 40));
  return source;
}

css = robustReplace(css, oldWrapper, newWrapper);

// Header frosted glass
css = robustReplace(css,
`.landing-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.2s ease;
}

[data-theme="dark"] .landing-header {
  background: rgba(9, 13, 22, 0.85);
  border-bottom-color: rgba(30, 41, 59, 0.8);
}`,
`.landing-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
  transition: all 0.25s ease;
}

[data-theme="dark"] .landing-header {
  background: rgba(8, 12, 22, 0.88);
  border-bottom-color: rgba(30, 41, 59, 0.7);
}`);

// Brand icon
css = robustReplace(css,
`.landing-brand-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-radius: 10px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}`,
`.landing-brand-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%);
  border-radius: 12px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
}`);

// Pill badges
css = robustReplace(css,
`.landing-pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  color: #1d4ed8;
  letter-spacing: 0.2px;
  margin-bottom: 20px;
}

[data-theme="dark"] .landing-pill-badge {
  background: #1e293b;
  border-color: #2563eb;
  color: #60a5fa;
}`,
`.landing-pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 800;
  color: #4338ca;
  letter-spacing: 0.2px;
  margin-bottom: 22px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.08);
}

[data-theme="dark"] .landing-pill-badge {
  background: rgba(99, 102, 241, 0.16);
  border-color: rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.2);
}`);

// Gradient heading
css = robustReplace(css,
`.text-gradient-blue {
  background: linear-gradient(135deg, #2563eb 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}`,
`.text-gradient-blue {
  background: linear-gradient(135deg, #4f46e5 0%, #2563eb 45%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}`);

// Primary CTA
css = robustReplace(css,
`.landing-hero-btn-primary {
  background: #2563eb;
  border: none;
  border-radius: 8px;
  padding: 13px 26px;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  transition: all 0.2s ease;
}

.landing-hero-btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.5);
}`,
`.landing-hero-btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.45), 0 4px 10px rgba(59, 130, 246, 0.25);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px -5px rgba(79, 70, 229, 0.55), 0 6px 14px rgba(59, 130, 246, 0.35);
  filter: brightness(1.05);
}`);

// Topbar CTA
css = robustReplace(css,
`.landing-btn-cta {
  background: #2563eb;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 13.5px;
  font-weight: 700;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
}

.landing-btn-cta:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}`,
`.landing-btn-cta {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13.5px;
  font-weight: 800;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  transition: all 0.2s ease;
}

.landing-btn-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.5);
  filter: brightness(1.05);
}`);

// Hero 3D Frame
css = robustReplace(css,
`.hero-3d-frame {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03));
  box-shadow: 0 30px 80px -15px rgba(37, 99, 235, 0.3), 0 0 0 1px rgba(37, 99, 235, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease;
}`,
`.hero-3d-frame {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(99, 102, 241, 0.3);
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03));
  box-shadow: 0 35px 85px -15px rgba(79, 70, 229, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.15);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease;
}`);

// Metrics Banner
css = robustReplace(css,
`.landing-metrics-banner {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 20px;
  padding: 32px 40px;
  margin: 30px auto 70px auto;
  max-width: 1280px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  box-shadow: 0 20px 45px -15px rgba(15, 23, 42, 0.3);
  color: #ffffff;
}`,
`.landing-metrics-banner {
  background: linear-gradient(135deg, #090e1a 0%, #0f172a 60%, #1e1b4b 100%);
  border-radius: 22px;
  padding: 34px 44px;
  margin: 30px auto 75px auto;
  max-width: 1280px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  border: 1px solid rgba(99, 102, 241, 0.25);
  box-shadow: 0 25px 50px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1);
  color: #ffffff;
}`);

// Stat gradient
css = robustReplace(css,
`.landing-metric-stat {
  font-size: 34px;
  font-weight: 900;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
  margin-bottom: 6px;
}`,
`.landing-metric-stat {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
  margin-bottom: 6px;
}`);

// Pillar tabs nav
css = robustReplace(css,
`.pillar-tabs-nav {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 36px;
}

.pillar-tab-btn {
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

[data-theme="dark"] .pillar-tab-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.pillar-tab-btn:hover {
  border-color: #94a3b8;
  color: #0f172a;
}

.pillar-tab-btn.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
}`,
`.pillar-tabs-nav {
  display: inline-flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0 auto 36px auto;
  background: rgba(241, 245, 249, 0.85);
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 6px;
  border-radius: 9999px;
  backdrop-filter: blur(8px);
}

[data-theme="dark"] .pillar-tabs-nav {
  background: rgba(30, 41, 59, 0.7);
  border-color: rgba(51, 65, 85, 0.7);
}

.pillar-tab-btn {
  padding: 10px 22px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pillar-tab-btn:hover {
  color: #0f172a;
}

[data-theme="dark"] .pillar-tab-btn:hover {
  color: #f8fafc;
}

.pillar-tab-btn.active {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.4);
}`);

// Tax calc card
css = robustReplace(css,
`.tax-calc-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 24px;
  padding: 44px;
  color: #ffffff;
  box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}`,
`.tax-calc-card {
  background: linear-gradient(135deg, #070c18 0%, #0f172a 50%, #1e1b4b 100%);
  border-radius: 26px;
  padding: 48px;
  color: #ffffff;
  box-shadow: 0 30px 70px -15px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.25);
}`);

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ css/main.css updated!');

const publicCssPath = path.join(__dirname, '..', 'public', 'css', 'main.css');
fs.writeFileSync(publicCssPath, css, 'utf8');
console.log('✅ public/css/main.css mirrored!');
