const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════════');
console.log('🚀 PATCHING TAX CALCULATOR, BENEFIT EXEMPTIONS & RESPONSIVE ALIGNMENT');
console.log('════════════════════════════════════════════════════════════');

// 1. UPDATE CSS IN css/main.css
const cssPath = path.join(__dirname, '../css/main.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Add .module-stage-tabs and .tab-toggle-btn base & responsive rules if not present
const responsiveStageTabsCSS = `
/* ── MODULE STAGE SUB-NAVIGATION TABS (DESKTOP & SMARTPHONES) ── */
.module-stage-tabs,
.tab-toggle-container,
.subnav-tabs {
  display: inline-flex;
  gap: 6px;
  background: var(--surface);
  padding: 5px;
  border-radius: 10px;
  border: 1px solid var(--border);
  margin-bottom: 20px;
  max-width: 100%;
  box-sizing: border-box;
}

.tab-toggle-btn {
  padding: 7px 14px;
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 12.5px;
  font-weight: 600;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  flex-shrink: 0;
  text-decoration: none;
}

.tab-toggle-btn:hover:not(.active) {
  background: var(--surface-2);
  color: var(--text);
}

.tab-toggle-btn.active {
  background: var(--primary);
  color: #ffffff !important;
  box-shadow: 0 2px 8px var(--primary-glow, rgba(37, 99, 235, 0.35));
}

.tab-toggle-btn.active .badge {
  background: rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
}

@media (max-width: 768px) {
  .module-stage-tabs,
  .tab-toggle-container,
  .subnav-tabs,
  div[style*="display:flex"][style*="border-radius:10px"][style*="background:var(--surface)"] {
    width: 100% !important;
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    padding: 4px !important;
    margin-bottom: 16px !important;
  }
  .module-stage-tabs::-webkit-scrollbar,
  .tab-toggle-container::-webkit-scrollbar,
  .subnav-tabs::-webkit-scrollbar {
    display: none !important;
  }
  .tab-toggle-btn {
    font-size: 11.5px !important;
    padding: 6px 11px !important;
    flex-shrink: 0 !important;
  }
}

/* ── SMARTPHONE & TABLET MODULE ALIGNMENT & GAP OPTIMIZATION ── */
@media (max-width: 768px) {
  .page-content {
    padding: 14px 12px !important;
  }
  .card {
    padding: 16px 14px !important;
  }
  .table-wrapper {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: var(--radius-sm);
  }
  .grid-4 {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
  }
  .stat-card {
    padding: 14px 12px !important;
    gap: 8px !important;
  }
  .topbar {
    padding: 0 12px !important;
    gap: 8px !important;
  }
  .topbar-actions {
    gap: 6px !important;
  }
  .notif-dropdown {
    max-width: calc(100vw - 20px) !important;
    right: -40px !important;
  }
  .tax-calc-grid {
    grid-template-columns: 1fr !important;
    gap: 20px !important;
  }
  .tax-calc-card {
    padding: 24px 16px !important;
    border-radius: 18px !important;
  }
  .tax-calc-box-input,
  .tax-calc-box-results {
    padding: 20px 16px !important;
  }
}

@media (max-width: 440px) {
  .grid-4 {
    grid-template-columns: 1fr !important;
  }
  .topbar-actions .topbar-btn:not(#notif-btn):not(.theme-toggle-btn) {
    display: none !important;
  }
  .tax-presets-row {
    gap: 5px !important;
  }
  .tax-preset-chip {
    padding: 5px 10px !important;
    font-size: 11px !important;
  }
}
`;

// Complete Dual-Theme styles for Tax Calculator
const taxDualThemeCSS = `
/* ════════════════════════════════════════════════════════════
   TAX CALCULATOR DUAL-THEME HIGH-CONTRAST STYLING
════════════════════════════════════════════════════════════ */

/* DARK THEME */
[data-theme="dark"] .tax-calc-card {
  background: linear-gradient(135deg, #070c18 0%, #0f172a 50%, #1e1b4b 100%) !important;
  border: 1px solid rgba(99, 102, 241, 0.3) !important;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7) !important;
  color: #ffffff !important;
}
[data-theme="dark"] .tax-calc-badge {
  background: rgba(59, 130, 246, 0.15) !important;
  border: 1px solid rgba(59, 130, 246, 0.35) !important;
  color: #93c5fd !important;
}
[data-theme="dark"] .tax-calc-title {
  color: #ffffff !important;
}
[data-theme="dark"] .tax-calc-desc {
  color: #cbd5e1 !important;
}
[data-theme="dark"] .tax-calc-box-input,
[data-theme="dark"] .tax-calc-box-results {
  background: rgba(15, 23, 42, 0.65) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}
[data-theme="dark"] .tax-calc-label {
  color: #f1f5f9 !important;
}
[data-theme="dark"] .tax-calc-input {
  background: rgba(0, 0, 0, 0.4) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}
[data-theme="dark"] .tax-calc-input:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important;
}
[data-theme="dark"] .tax-calc-prefix,
[data-theme="dark"] .tax-calc-suffix {
  color: #94a3b8 !important;
}
[data-theme="dark"] .tax-preset-chip {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  color: #cbd5e1 !important;
}
[data-theme="dark"] .tax-preset-chip:hover {
  background: #2563eb !important;
  color: #ffffff !important;
}
[data-theme="dark"] .tax-preset-chip.active {
  background: #2563eb !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}
[data-theme="dark"] .tax-custom-inputs-card {
  background: rgba(15, 23, 42, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}
[data-theme="dark"] .tax-calc-accordion-title {
  color: #93c5fd !important;
}
[data-theme="dark"] .tax-mini-chip {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  color: #cbd5e1 !important;
}
[data-theme="dark"] .tax-mini-chip.active {
  background: #2563eb !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}
[data-theme="dark"] .tax-results-net-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1)) !important;
  border: 1.5px solid rgba(16, 185, 129, 0.4) !important;
}
[data-theme="dark"] .tax-net-title {
  color: #a7f3d0 !important;
}
[data-theme="dark"] .tax-net-amount {
  color: #34d399 !important;
}
[data-theme="dark"] .tax-net-sub {
  color: #cbd5e1 !important;
}
[data-theme="dark"] .tax-results-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}
[data-theme="dark"] .tax-row-label {
  color: #cbd5e1 !important;
}
[data-theme="dark"] .tax-row-val {
  color: #ffffff !important;
}
[data-theme="dark"] .tax-slabs-table th {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #93c5fd !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
}
[data-theme="dark"] .tax-slabs-table td {
  color: #cbd5e1 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
}

/* LIGHT THEME (CRISP HIGH-CONTRAST NORMAL VIEW) */
[data-theme="light"] .tax-calc-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%) !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03) !important;
  color: #0f172a !important;
}
[data-theme="light"] .tax-calc-badge {
  background: rgba(37, 99, 235, 0.08) !important;
  border: 1px solid rgba(37, 99, 235, 0.25) !important;
  color: #1d4ed8 !important;
}
[data-theme="light"] .tax-calc-title {
  color: #0f172a !important;
}
[data-theme="light"] .tax-calc-desc {
  color: #475569 !important;
}
[data-theme="light"] .tax-calc-box-input,
[data-theme="light"] .tax-calc-box-results {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
}
[data-theme="light"] .tax-calc-label {
  color: #0f172a !important;
  font-weight: 700 !important;
}
[data-theme="light"] .tax-calc-input {
  background: #ffffff !important;
  border: 1.5px solid #cbd5e1 !important;
  color: #0f172a !important;
}
[data-theme="light"] .tax-calc-input:focus {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2) !important;
}
[data-theme="light"] .tax-calc-prefix,
[data-theme="light"] .tax-calc-suffix {
  color: #64748b !important;
}
[data-theme="light"] .tax-preset-chip {
  background: #f1f5f9 !important;
  border: 1px solid #cbd5e1 !important;
  color: #1e293b !important;
}
[data-theme="light"] .tax-preset-chip:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
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
[data-theme="light"] .tax-calc-accordion-title {
  color: #1d4ed8 !important;
  font-weight: 700 !important;
}
[data-theme="light"] .tax-mini-chip {
  background: #e2e8f0 !important;
  border: 1px solid #cbd5e1 !important;
  color: #334155 !important;
}
[data-theme="light"] .tax-mini-chip:hover {
  background: #cbd5e1 !important;
  color: #0f172a !important;
}
[data-theme="light"] .tax-mini-chip.active {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
}
[data-theme="light"] .tax-results-net-card {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%) !important;
  border: 1.5px solid #a7f3d0 !important;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08) !important;
}
[data-theme="light"] .tax-net-title {
  color: #065f46 !important;
  font-weight: 800 !important;
}
[data-theme="light"] .tax-net-amount {
  color: #047857 !important;
  font-weight: 900 !important;
}
[data-theme="light"] .tax-net-sub {
  color: #374151 !important;
  font-weight: 600 !important;
}
[data-theme="light"] .tax-results-row {
  border-bottom: 1px solid #e2e8f0 !important;
}
[data-theme="light"] .tax-row-label {
  color: #475569 !important;
  font-weight: 600 !important;
}
[data-theme="light"] .tax-row-val {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="light"] .tax-slabs-table th {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  border-bottom: 2px solid #cbd5e1 !important;
}
[data-theme="light"] .tax-slabs-table td {
  color: #1e293b !important;
  border-bottom: 1px solid #e2e8f0 !important;
}
[data-theme="light"] #tax-slabs-table-container {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06) !important;
}
`;

if (!css.includes('MODULE STAGE SUB-NAVIGATION TABS')) {
  css += '\n' + responsiveStageTabsCSS;
}
if (!css.includes('TAX CALCULATOR DUAL-THEME HIGH-CONTRAST STYLING')) {
  css += '\n' + taxDualThemeCSS;
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✔ Updated css/main.css with responsive subnav and high-contrast dual-theme tax calculator rules');

// 2. UPDATE js/landing.js TAX CALCULATOR
const landingPath = path.join(__dirname, '../js/landing.js');
let landingCode = fs.readFileSync(landingPath, 'utf8');

// Replace the Tax Calculator section HTML with clean semantic classes and 3rd accordion section for Tax-Exempt Benefits & Medical
const oldTaxSectionStart = '<!-- ─── 6. INTERACTIVE PAKISTAN STATUTORY TAX CALCULATOR (2026-27) ─── -->';
const oldTaxSectionEnd = '<!-- ─── 7. 6-PHASE PAYROLL & HR AUTOMATION WORKFLOW ─── -->';

const newTaxSectionHTML = `<!-- ─── 6. INTERACTIVE PAKISTAN STATUTORY TAX CALCULATOR (2026-27) ─── -->
        <section class="tax-calc-section" id="tax-calc">
          <div class="tax-calc-card">
            <div style="text-align:center;max-width:680px;margin:0 auto 36px auto">
              <div class="landing-pill-badge tax-calc-badge" style="margin-bottom:12px">
                <i class="fa fa-calculator text-primary"></i> Live Statutory Payroll Estimator
              </div>
              <h2 class="tax-calc-title" style="font-size:32px;font-weight:900;letter-spacing:-0.8px;margin-bottom:10px">
                Interactive Salary & Income Tax Calculator
              </h2>
              <p class="tax-calc-desc" style="font-size:14px;line-height:1.6">
                Calculate real-time monthly take-home pay, FBR income tax deductions, and statutory funds under official Tax Slabs (2026-27). Deducts tax after Provident Fund and exempt allowances for maximum take-home clarity.
              </p>
            </div>

            <div class="tax-calc-grid">
              <!-- Inputs Side -->
              <div class="tax-calc-box-input">
                <label class="tax-calc-label" style="font-size:13.5px;display:block;margin-bottom:6px">
                  Monthly Gross Salary (PKR)
                </label>
                <div style="position:relative;margin-bottom:14px">
                  <span class="tax-calc-prefix" style="position:absolute;left:14px;top:12px;font-weight:800;font-size:15px">PKR</span>
                  <input type="number" id="tax-input-gross" value="150000" min="0" max="10000000" step="5000"
                    class="tax-calc-input"
                    style="width:100%;box-sizing:border-box;border-radius:10px;padding:12px 14px 12px 55px;font-size:18px;font-weight:800;outline:none"
                    oninput="Landing.updateTaxCalc(this.value)">
                </div>

                <input type="range" id="tax-slider-gross" min="30000" max="1500000" step="5000" value="150000" class="tax-range-slider"
                  oninput="Landing.updateTaxCalc(this.value)">

                <!-- Quick Presets Chips -->
                <div class="tax-calc-desc" style="font-size:12px;margin-top:14px;margin-bottom:6px;font-weight:700">Quick Presets:</div>
                <div class="tax-presets-row" role="group" aria-label="Salary Presets">
                  <button type="button" id="preset-tax-80000" class="tax-preset-chip" onclick="Landing.setTaxPreset(80000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 80k</button>
                  <button type="button" id="preset-tax-150000" class="tax-preset-chip active" onclick="Landing.setTaxPreset(150000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 150k</button>
                  <button type="button" id="preset-tax-250000" class="tax-preset-chip" onclick="Landing.setTaxPreset(250000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 250k</button>
                  <button type="button" id="preset-tax-500000" class="tax-preset-chip" onclick="Landing.setTaxPreset(500000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 500k</button>
                  <button type="button" id="preset-tax-1000000" class="tax-preset-chip" onclick="Landing.setTaxPreset(1000000)"><i class="fa fa-calculator" style="font-size:11px;opacity:0.8"></i> PKR 1.0M</button>
                </div>

                <!-- Custom PF, EOBI & Benefits Controls Accordion -->
                <div class="tax-custom-inputs-card" style="border-radius:12px;padding:16px;margin-top:16px">
                  <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;user-select:none" onclick="Landing.toggleCustomDeductions()">
                    <span class="tax-calc-accordion-title" style="font-size:13px;display:flex;align-items:center;gap:8px">
                      <i class="fa fa-sliders text-primary"></i> Deduct Tax After PF, EOBI & Benefits (Optional)
                    </span>
                    <i class="fa fa-chevron-down" id="tax-custom-ded-icon" style="font-size:12px;transition:transform 0.2s"></i>
                  </div>

                  <div id="tax-custom-ded-body" style="display:none;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
                    <!-- 1. Provident Fund Input -->
                    <div style="margin-bottom:16px">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                        <label class="tax-calc-label" style="font-size:13px;display:flex;align-items:center;gap:6px">
                          <i class="fa fa-piggy-bank text-primary"></i> Provident Fund (PF) Rate (%)
                        </label>
                        <span id="tax-pf-summary-badge" class="tax-calc-badge" style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px">0% (PKR 0)</span>
                      </div>
                      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                        <div style="position:relative;width:110px">
                          <input type="number" id="tax-input-pf-pct" value="0" min="0" max="50" step="0.5"
                            class="tax-calc-input"
                            style="width:100%;box-sizing:border-box;border-radius:8px;padding:8px 26px 8px 10px;font-size:14px;font-weight:700;outline:none"
                            oninput="Landing.updatePfPct(this.value)">
                          <span class="tax-calc-suffix" style="position:absolute;right:8px;top:8px;font-weight:800;font-size:13px">%</span>
                        </div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap">
                          <button type="button" class="tax-mini-chip active" id="chip-pf-0" onclick="Landing.setPfPreset(0)">0% (None)</button>
                          <button type="button" class="tax-mini-chip" id="chip-pf-5" onclick="Landing.setPfPreset(5)">5%</button>
                          <button type="button" class="tax-mini-chip" id="chip-pf-833" onclick="Landing.setPfPreset(8.33)">8.33% (Std)</button>
                          <button type="button" class="tax-mini-chip" id="chip-pf-10" onclick="Landing.setPfPreset(10)">10%</button>
                        </div>
                      </div>
                    </div>

                    <!-- 2. EOBI Input -->
                    <div style="margin-bottom:16px">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                        <label class="tax-calc-label" style="font-size:13px;display:flex;align-items:center;gap:6px">
                          <i class="fa fa-shield-heart text-warning"></i> EOBI Contribution (PKR)
                        </label>
                        <span id="tax-eobi-summary-badge" class="tax-calc-badge" style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px">PKR 0</span>
                      </div>
                      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                        <div style="position:relative;width:130px">
                          <span class="tax-calc-prefix" style="position:absolute;left:9px;top:8px;font-weight:800;font-size:12px">PKR</span>
                          <input type="number" id="tax-input-eobi-amt" value="0" min="0" max="20000" step="100"
                            class="tax-calc-input"
                            style="width:100%;box-sizing:border-box;border-radius:8px;padding:8px 8px 8px 36px;font-size:14px;font-weight:700;outline:none"
                            oninput="Landing.updateEobiAmt(this.value)">
                        </div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap">
                          <button type="button" class="tax-mini-chip active" id="chip-eobi-0" onclick="Landing.setEobiPreset(0)">PKR 0 (Exempt)</button>
                          <button type="button" class="tax-mini-chip" id="chip-eobi-1300" onclick="Landing.setEobiPreset(1300)">PKR 1,300 (Std)</button>
                        </div>
                      </div>
                    </div>

                    <!-- 3. Tax-Exempt Benefits & Medical Allowance Input -->
                    <div>
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                        <label class="tax-calc-label" style="font-size:13px;display:flex;align-items:center;gap:6px">
                          <i class="fa fa-hand-holding-medical text-success"></i> Tax-Exempt Allowances & Medical (PKR)
                        </label>
                        <span id="tax-benefits-summary-badge" class="tax-calc-badge" style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px">PKR 0</span>
                      </div>
                      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                        <div style="position:relative;width:130px">
                          <span class="tax-calc-prefix" style="position:absolute;left:9px;top:8px;font-weight:800;font-size:12px">PKR</span>
                          <input type="number" id="tax-input-benefits-amt" value="0" min="0" max="200000" step="1000"
                            class="tax-calc-input"
                            style="width:100%;box-sizing:border-box;border-radius:8px;padding:8px 8px 8px 36px;font-size:14px;font-weight:700;outline:none"
                            oninput="Landing.updateBenefitsAmt(this.value)">
                        </div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap">
                          <button type="button" class="tax-mini-chip active" id="chip-ben-0" onclick="Landing.setBenefitsPreset(0)">PKR 0 (None)</button>
                          <button type="button" class="tax-mini-chip" id="chip-ben-5000" onclick="Landing.setBenefitsPreset(5000)">PKR 5,000</button>
                          <button type="button" class="tax-mini-chip" id="chip-ben-10000" onclick="Landing.setBenefitsPreset(10000)">PKR 10,000</button>
                          <button type="button" class="tax-mini-chip" id="chip-ben-10pct" onclick="Landing.setBenefitsPreset('10pct')">10% Medical (Std)</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- View Tax Slabs Table Toggle Button -->
                <div style="margin-top:14px">
                  <button type="button" class="tax-mini-chip" style="width:100%;padding:10px 18px;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px" onclick="Landing.toggleSlabsTable()" aria-expanded="false" aria-controls="tax-slabs-table-container">
                    <i class="fa fa-table-list"></i> <span id="tax-slabs-toggle-txt">View Official Tax Slabs (2026-27) Table</span>
                  </button>
                </div>

                <!-- Collapsible Official Slabs Table (Verbatim 2026-27 Schedule) -->
                <div id="tax-slabs-table-container" style="display:none;margin-top:14px;border-radius:12px;overflow:hidden;max-height:360px;overflow-y:auto">
                  <table class="tax-slabs-table">
                    <thead>
                      <tr>
                        <th>Taxable Income (PKR)</th>
                        <th>Tax Rate (2026-27)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr id="slab-row-1">
                        <td>Up to 600,000</td>
                        <td>0%</td>
                      </tr>
                      <tr id="slab-row-2">
                        <td>600,001 – 1,200,000</td>
                        <td>1% of the amount exceeding 600,000</td>
                      </tr>
                      <tr id="slab-row-3">
                        <td>1,200,001 – 2,200,000</td>
                        <td>PKR 6,000 + 11% of the amount exceeding 1,200,000</td>
                      </tr>
                      <tr id="slab-row-4">
                        <td>2,200,001 – 3,200,000</td>
                        <td>PKR 116,000 + 20% of the amount exceeding 2,200,000</td>
                      </tr>
                      <tr id="slab-row-5">
                        <td>3,200,001 – 4,100,000</td>
                        <td>PKR 316,000 + 25% of the amount exceeding 3,200,000</td>
                      </tr>
                      <tr id="slab-row-6">
                        <td>4,100,001 – 5,600,000</td>
                        <td>PKR 541,000 + 29% of the amount exceeding 4,100,000</td>
                      </tr>
                      <tr id="slab-row-7">
                        <td>5,600,001 – 7,000,000</td>
                        <td>PKR 976,000 + 32% of the amount exceeding 5,600,000</td>
                      </tr>
                      <tr id="slab-row-8">
                        <td>Above 7,000,000</td>
                        <td>PKR 1,424,000 + 35% of the amount exceeding 7,000,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Results Display Side -->
              <div class="tax-calc-box-results">
                <div class="tax-results-net-card">
                  <div class="tax-net-title" style="font-size:12px;letter-spacing:0.3px">Estimated Net Take-Home Pay</div>
                  <div class="tax-net-amount" id="tax-res-net">PKR 144,000</div>
                  <div class="tax-net-sub" style="font-size:13px" id="tax-res-pct">96.0% of gross monthly salary</div>
                </div>

                <!-- Breakdown Progress Bar -->
                <div class="tax-breakdown-bar">
                  <div class="tax-bar-net" id="tax-bar-net" style="width:96.0%" title="Take-Home Pay"></div>
                  <div class="tax-bar-tax" id="tax-bar-tax" style="width:4.0%" title="Income Tax"></div>
                  <div class="tax-bar-ded" id="tax-bar-ded" style="width:0%" title="EOBI, PF & Benefits"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3);margin-bottom:16px">
                  <span><span style="color:#10b981">■</span> Take-Home</span>
                  <span><span style="color:#ef4444">■</span> Income Tax</span>
                  <span><span style="color:#f59e0b">■</span> PF & Statutory</span>
                </div>

                <!-- Ledger Rows -->
                <div class="tax-results-row">
                  <span class="tax-row-label">Monthly Gross Salary</span>
                  <strong class="tax-row-val" id="tax-res-gross">PKR 150,000</strong>
                </div>
                <div class="tax-results-row">
                  <span class="tax-row-label">Less: Provident Fund (<span id="tax-res-pf-pct-label">0%</span>)</span>
                  <span style="color:#f59e0b;font-weight:700" id="tax-res-pf">PKR 0</span>
                </div>
                <div class="tax-results-row">
                  <span class="tax-row-label">Less: EOBI Contribution</span>
                  <span style="color:#f59e0b;font-weight:700" id="tax-res-eobi">PKR 0</span>
                </div>
                <div class="tax-results-row">
                  <span class="tax-row-label">Less: Exempt Allowances & Medical</span>
                  <span style="color:#10b981;font-weight:700" id="tax-res-benefits">PKR 0</span>
                </div>
                <div class="tax-results-row" style="background:var(--surface);padding:8px 10px;border-radius:8px">
                  <span class="tax-row-label" style="font-weight:700">Net Taxable Income (Annual)</span>
                  <strong class="tax-row-val" style="color:var(--primary)" id="tax-res-annual">PKR 1,800,000</strong>
                </div>
                <div class="tax-results-row">
                  <span class="tax-row-label">Monthly Income Tax (After Exemptions)</span>
                  <strong style="color:#ef4444;font-weight:800" id="tax-res-monthly-tax">PKR 6,000</strong>
                </div>
                <div class="tax-results-row">
                  <span class="tax-row-label">Annual Income Tax</span>
                  <strong style="color:#ef4444;font-weight:800" id="tax-res-annual-tax">PKR 72,000</strong>
                </div>
                <div class="tax-results-row">
                  <span class="tax-row-label">FBR Tax Bracket</span>
                  <span style="font-size:12px;color:var(--primary);text-align:right;max-width:260px;font-weight:600" id="tax-res-slab-desc">Slab 3</span>
                </div>
                <!-- Tax Savings Notification Badge -->
                <div id="tax-savings-callout" style="margin-top:14px;padding:8px 12px;border-radius:8px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);font-size:12px;color:#047857;display:none;font-weight:600;text-align:center">
                  <i class="fa fa-shield-halved" style="margin-right:6px"></i><span id="tax-savings-txt"></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        `;

const startIdx = landingCode.indexOf(oldTaxSectionStart);
const endIdx = landingCode.indexOf(oldTaxSectionEnd);
if (startIdx !== -1 && endIdx !== -1) {
  landingCode = landingCode.slice(0, startIdx) + newTaxSectionHTML + landingCode.slice(endIdx);
  console.log('✔ Replaced Tax Calculator section HTML in js/landing.js');
} else {
  console.warn('⚠ Could not find exact tax section boundaries in js/landing.js');
}

// Update the tax calculator JS methods in Landing
const newTaxMethods = `  // ─── Interactive Tax Calculator Methods (Official Tax Slabs 2026-27) ───
  taxCalcState: {
    gross: 150000,
    pfPct: 0,
    eobiAmount: 0,
    exemptBenefits: 0
  },

  updateTaxCalc(val) {
    if (!this.taxCalcState) {
      this.taxCalcState = { gross: 150000, pfPct: 0, eobiAmount: 0, exemptBenefits: 0 };
    }
    const gross = Math.max(0, Number(val) !== undefined && !isNaN(Number(val)) ? Number(val) : 150000);
    this.taxCalcState.gross = gross;

    const inputGross = document.getElementById('tax-input-gross');
    const sliderGross = document.getElementById('tax-slider-gross');
    if (inputGross && inputGross.value != gross) inputGross.value = gross;
    if (sliderGross && sliderGross.value != gross) sliderGross.value = gross;

    const pfPct = Math.max(0, Number(this.taxCalcState.pfPct) || 0);
    const pf = Math.round(gross * (pfPct / 100));
    const eobi = Math.max(0, Number(this.taxCalcState.eobiAmount) || 0);
    const benefits = Math.max(0, Number(this.taxCalcState.exemptBenefits) || 0);

    // DEDUCT TAX AFTER PF, EOBI AND OTHER BENEFIT EXEMPTIONS:
    const monthlyTaxable = Math.max(0, gross - pf - eobi - benefits);
    const annualTaxable = monthlyTaxable * 12;

    // FBR 2026-27 Slabs calculation on annualTaxable
    let annualTax = 0;
    let slabDesc = 'Slab 1 (Up to PKR 600,000: 0% Tax-Free)';
    let slabId = 1;

    if (annualTaxable <= 600000) {
      annualTax = 0;
      slabDesc = 'Slab 1 (Up to PKR 600,000: 0% Tax-Free)';
      slabId = 1;
    } else if (annualTaxable <= 1200000) {
      annualTax = (annualTaxable - 600000) * 0.01;
      slabDesc = 'Slab 2 (PKR 600,001 – 1,200,000: 1% of excess over PKR 600k)';
      slabId = 2;
    } else if (annualTaxable <= 2200000) {
      annualTax = 6000 + (annualTaxable - 1200000) * 0.11;
      slabDesc = 'Slab 3 (PKR 1,200,001 – 2,200,000: PKR 6,000 + 11% of excess over PKR 1.2M)';
      slabId = 3;
    } else if (annualTaxable <= 3200000) {
      annualTax = 116000 + (annualTaxable - 2200000) * 0.20;
      slabDesc = 'Slab 4 (PKR 2,200,001 – 3,200,000: PKR 116,000 + 20% of excess over PKR 2.2M)';
      slabId = 4;
    } else if (annualTaxable <= 4100000) {
      annualTax = 316000 + (annualTaxable - 3200000) * 0.25;
      slabDesc = 'Slab 5 (PKR 3,200,001 – 4,100,000: PKR 316,000 + 25% of excess over PKR 3.2M)';
      slabId = 5;
    } else if (annualTaxable <= 5600000) {
      annualTax = 541000 + (annualTaxable - 4100000) * 0.29;
      slabDesc = 'Slab 6 (PKR 4,100,001 – 5,600,000: PKR 541,000 + 29% of excess over PKR 4.1M)';
      slabId = 6;
    } else if (annualTaxable <= 7000000) {
      annualTax = 976000 + (annualTaxable - 5600000) * 0.32;
      slabDesc = 'Slab 7 (PKR 5,600,001 – 7,000,000: PKR 976,000 + 32% of excess over PKR 5.6M)';
      slabId = 7;
    } else {
      annualTax = 1424000 + (annualTaxable - 7000000) * 0.35;
      slabDesc = 'Slab 8 (Above PKR 7,000,000: PKR 1,424,000 + 35% of excess over PKR 7.0M)';
      slabId = 8;
    }

    const monthlyTax = Math.round(annualTax / 12);

    // Calculate unreduced tax on raw gross to demonstrate exemption savings
    let rawAnnual = gross * 12;
    let rawTax = 0;
    if (rawAnnual > 600000 && rawAnnual <= 1200000) rawTax = (rawAnnual - 600000) * 0.01;
    else if (rawAnnual > 1200000 && rawAnnual <= 2200000) rawTax = 6000 + (rawAnnual - 1200000) * 0.11;
    else if (rawAnnual > 2200000 && rawAnnual <= 3200000) rawTax = 116000 + (rawAnnual - 2200000) * 0.20;
    else if (rawAnnual > 3200000 && rawAnnual <= 4100000) rawTax = 316000 + (rawAnnual - 3200000) * 0.25;
    else if (rawAnnual > 4100000 && rawAnnual <= 5600000) rawTax = 541000 + (rawAnnual - 4100000) * 0.29;
    else if (rawAnnual > 5600000 && rawAnnual <= 7000000) rawTax = 976000 + (rawAnnual - 5600000) * 0.32;
    else if (rawAnnual > 7000000) rawTax = 1424000 + (rawAnnual - 7000000) * 0.35;

    const rawMonthlyTax = Math.round(rawTax / 12);
    const taxSaved = Math.max(0, rawMonthlyTax - monthlyTax);

    // Net take home pay: Gross minus PF, EOBI, and Income Tax
    const netSalary = Math.max(0, gross - pf - eobi - monthlyTax);

    const netPct = gross > 0 ? ((netSalary / gross) * 100).toFixed(1) : '0.0';
    const taxPct = gross > 0 ? ((monthlyTax / gross) * 100).toFixed(1) : '0.0';
    const dedPct = gross > 0 ? (((eobi + pf) / gross) * 100).toFixed(1) : '0.0';

    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('tax-res-net', 'PKR ' + netSalary.toLocaleString());
    setTxt('tax-res-pct', netPct + '% of gross monthly salary');
    setTxt('tax-res-gross', 'PKR ' + gross.toLocaleString());
    setTxt('tax-res-annual', 'PKR ' + annualTaxable.toLocaleString());
    setTxt('tax-res-monthly-tax', 'PKR ' + monthlyTax.toLocaleString());
    setTxt('tax-res-annual-tax', 'PKR ' + Math.round(annualTax).toLocaleString());
    setTxt('tax-res-eobi', 'PKR ' + eobi.toLocaleString());
    setTxt('tax-res-pf', 'PKR ' + pf.toLocaleString());
    setTxt('tax-res-pf-pct-label', pfPct + '%');
    setTxt('tax-res-benefits', 'PKR ' + benefits.toLocaleString());
    setTxt('tax-res-slab-desc', slabDesc);

    // Summary badges
    setTxt('tax-pf-summary-badge', pfPct + '% (PKR ' + pf.toLocaleString() + ')');
    setTxt('tax-eobi-summary-badge', 'PKR ' + eobi.toLocaleString());
    setTxt('tax-benefits-summary-badge', 'PKR ' + benefits.toLocaleString());

    // Savings callout
    const callout = document.getElementById('tax-savings-callout');
    const calloutTxt = document.getElementById('tax-savings-txt');
    if (callout && calloutTxt) {
      if (taxSaved > 0) {
        callout.style.display = 'block';
        calloutTxt.textContent = \`Tax calculated after PF & exemptions saves PKR \${taxSaved.toLocaleString()}/mo in withholding tax!\`;
      } else {
        callout.style.display = 'none';
      }
    }

    // Highlight active slab in table if visible
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') !== 'light';
    for (let i = 1; i <= 8; i++) {
      const row = document.getElementById(\`slab-row-\${i}\`);
      if (row) {
        if (slabId === i) {
          row.style.background = isDark ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.12)';
          row.style.fontWeight = '700';
          row.style.color = isDark ? '#ffffff' : '#1d4ed8';
        } else {
          row.style.background = 'transparent';
          row.style.fontWeight = 'normal';
          row.style.color = '';
        }
      }
    }

    const barNet = document.getElementById('tax-bar-net');
    const barTax = document.getElementById('tax-bar-tax');
    const barDed = document.getElementById('tax-bar-ded');
    if (barNet) barNet.style.width = netPct + '%';
    if (barTax) barTax.style.width = taxPct + '%';
    if (barDed) barDed.style.width = dedPct + '%';
  },

  setTaxPreset(amt) {
    document.querySelectorAll('.tax-preset-chip').forEach(c => c.classList.remove('active'));
    const btn = document.getElementById(\`preset-tax-\${amt}\`);
    if (btn) btn.classList.add('active');
    this.updateTaxCalc(amt);
  },

  updatePfPct(pctVal) {
    const pct = Math.max(0, parseFloat(pctVal) || 0);
    this.taxCalcState.pfPct = pct;
    const input = document.getElementById('tax-input-pf-pct');
    if (input && input.value != pctVal) input.value = pctVal;

    ['0', '5', '833', '10'].forEach(k => {
      const chip = document.getElementById(\`chip-pf-\${k}\`);
      if (chip) chip.classList.remove('active');
    });
    if (pct === 0) document.getElementById('chip-pf-0')?.classList.add('active');
    else if (pct === 5) document.getElementById('chip-pf-5')?.classList.add('active');
    else if (Math.abs(pct - 8.33) < 0.05) document.getElementById('chip-pf-833')?.classList.add('active');
    else if (pct === 10) document.getElementById('chip-pf-10')?.classList.add('active');

    this.updateTaxCalc(this.taxCalcState.gross);
  },

  setPfPreset(pct) {
    this.updatePfPct(pct);
  },

  updateEobiAmt(amtVal) {
    const amt = Math.max(0, parseInt(amtVal, 10) || 0);
    this.taxCalcState.eobiAmount = amt;
    const input = document.getElementById('tax-input-eobi-amt');
    if (input && input.value != amtVal) input.value = amtVal;

    ['0', '1300'].forEach(k => {
      const chip = document.getElementById(\`chip-eobi-\${k}\`);
      if (chip) chip.classList.remove('active');
    });
    if (amt === 0) document.getElementById('chip-eobi-0')?.classList.add('active');
    else if (amt === 1300) document.getElementById('chip-eobi-1300')?.classList.add('active');

    this.updateTaxCalc(this.taxCalcState.gross);
  },

  setEobiPreset(amt) {
    this.updateEobiAmt(amt);
  },

  updateBenefitsAmt(amtVal) {
    const amt = Math.max(0, parseInt(amtVal, 10) || 0);
    this.taxCalcState.exemptBenefits = amt;
    const input = document.getElementById('tax-input-benefits-amt');
    if (input && input.value != amtVal) input.value = amtVal;

    ['0', '5000', '10000', '10pct'].forEach(k => {
      const chip = document.getElementById(\`chip-ben-\${k}\`);
      if (chip) chip.classList.remove('active');
    });
    if (amt === 0) document.getElementById('chip-ben-0')?.classList.add('active');
    else if (amt === 5000) document.getElementById('chip-ben-5000')?.classList.add('active');
    else if (amt === 10000) document.getElementById('chip-ben-10000')?.classList.add('active');

    this.updateTaxCalc(this.taxCalcState.gross);
  },

  setBenefitsPreset(val) {
    let amt = 0;
    if (val === '10pct') {
      amt = Math.round((this.taxCalcState.gross || 150000) * 0.10);
    } else {
      amt = Number(val) || 0;
    }
    this.taxCalcState.exemptBenefits = amt;
    const input = document.getElementById('tax-input-benefits-amt');
    if (input) input.value = amt;

    ['0', '5000', '10000', '10pct'].forEach(k => {
      const chip = document.getElementById(\`chip-ben-\${k}\`);
      if (chip) chip.classList.remove('active');
    });
    if (val === '10pct') document.getElementById('chip-ben-10pct')?.classList.add('active');
    else if (amt === 0) document.getElementById('chip-ben-0')?.classList.add('active');
    else if (amt === 5000) document.getElementById('chip-ben-5000')?.classList.add('active');
    else if (amt === 10000) document.getElementById('chip-ben-10000')?.classList.add('active');

    this.updateTaxCalc(this.taxCalcState.gross);
  },
`;

const oldMethodsTarget = '  // ─── Interactive Tax Calculator Methods (Official Tax Slabs 2026-27) ───\n  updateTaxCalc(val) {';
const nextMethodTarget = '  toggleSlabsTable() {';

const mStart = landingCode.indexOf(oldMethodsTarget);
const mEnd = landingCode.indexOf(nextMethodTarget);
if (mStart !== -1 && mEnd !== -1) {
  landingCode = landingCode.slice(0, mStart) + newTaxMethods + landingCode.slice(mEnd);
  console.log('✔ Replaced Tax Calculator JS methods in js/landing.js');
} else {
  console.warn('⚠ Could not find exact tax JS methods boundaries in js/landing.js');
}

fs.writeFileSync(landingPath, landingCode, 'utf8');

// 3. UPDATE js/payroll.js line 1266 (deduct PF & statutory benefits before computing autoTax)
const payrollPath = path.join(__dirname, '../js/payroll.js');
let payrollCode = fs.readFileSync(payrollPath, 'utf8');

const oldAutoTaxLine = '    const autoTax = DB.calculateFBRTax(basic + allowances).monthlyTax;';
const newAutoTaxLine = `    const taxableGross = Math.max(0, (basic + allowances) - pfEmployee - (existingRec?.eobiEmployee || 370) - (existingRec?.taxExemptBenefits || 0));
    const autoTax = DB.calculateFBRTax(taxableGross, selectedEmp).monthlyTax;`;

if (payrollCode.includes(oldAutoTaxLine)) {
  payrollCode = payrollCode.replace(oldAutoTaxLine, newAutoTaxLine);
  fs.writeFileSync(payrollPath, payrollCode, 'utf8');
  console.log('✔ Updated js/payroll.js to calculate autoTax net of PF and exemptions');
}

// 4. ADD .module-stage-tabs CLASS TO STAGE NAVIGATION IN ALL MODULE FILES
const moduleFiles = [
  'js/assets.js',
  'js/helpdesk.js',
  'js/performance.js',
  'js/leaves.js',
  'js/employees.js',
  'js/attendance.js',
  'js/payroll.js',
  'js/recruitment.js'
];

moduleFiles.forEach(relPath => {
  const fPath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(fPath)) {
    let content = fs.readFileSync(fPath, 'utf8');
    const regex = /<div style="display:flex;gap:6px;margin-bottom:20px;background:var\(--surface\);padding:4px;border-radius:10px;width:fit-content;flex-wrap:wrap;border:1px solid var\(--border\)">/g;
    if (regex.test(content)) {
      content = content.replace(regex, '<div class="module-stage-tabs">');
      fs.writeFileSync(fPath, content, 'utf8');
      console.log(`✔ Added .module-stage-tabs to ${relPath}`);
    }
  }
});

console.log('✔ All patches applied successfully!');
