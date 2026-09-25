const fs = require('fs');
const path = require('path');

const landingPath = path.join(__dirname, '../js/landing.js');
let code = fs.readFileSync(landingPath, 'utf8');

const newRenderCode = `  render() {
    const container = document.getElementById('landing-page');
    if (!container) return;
    const savedTheme = localStorage.getItem('hrm_landing_theme') || 'light';
    container.setAttribute('data-theme', savedTheme);
    const detailContainer = document.getElementById('module-detail-page');
    if (detailContainer) detailContainer.setAttribute('data-theme', savedTheme);

    // Live database counts
    const emps = (typeof DB !== 'undefined' && DB.get) ? (DB.get('employees') || []) : [];
    const att = (typeof DB !== 'undefined' && DB.get) ? (DB.get('attendance') || []) : [];
    const leaves = (typeof DB !== 'undefined' && DB.get) ? (DB.get('leave_requests') || []) : [];
    const jobs = (typeof DB !== 'undefined' && DB.get) ? (DB.get('recruitment') || []) : [];
    const depts = (typeof DB !== 'undefined' && DB.get) ? (DB.get('departments') || []) : [];
    const openJobsList = jobs.filter(j => j.status === 'active' || j.status === 'open');
    const openJobsCount = openJobsList.length;
    const uniqueDeptIds = [...new Set(openJobsList.map(j => j.departmentId))];
    const uniqueDepts = uniqueDeptIds.map(id => depts.find(d => d.id === id)).filter(Boolean);

    const todayStr = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : new Date().toISOString().slice(0, 10);
    const totalEmps = emps.length > 0 ? emps.length : 52;
    const presentToday = att.filter(a => a.date === todayStr && a.status === 'present').length || Math.min(totalEmps, 48);
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length || 6;
    const openJobs = openJobsCount;

    container.innerHTML = \`
      <div class="landing-wrapper" onclick="Landing.closeAllMenus()">
        
        <!-- ─── 0. TOP ANNOUNCEMENT BAR (MATCHING SCREENSHOT) ─── -->
        <div class="landing-top-announcement">
          <div class="landing-top-left">
            <i class="fa fa-sparkles"></i>
            <span>Enterprise Human Resource &amp; Payroll Management System</span>
            <span style="opacity:0.4;margin:0 6px">•</span>
            <span>99.98% Cloud Uptime</span>
            <span style="opacity:0.4;margin:0 6px">•</span>
            <span>Free 14-Day Enterprise Trial</span>
          </div>
          <div class="landing-top-right">
            <a href="tel:+18005554767" class="landing-top-contact-item"><i class="fa fa-phone"></i> +1 (800) 555-HRMPRO</a>
            <a href="mailto:enterprise@hrmpro.com" class="landing-top-contact-item"><i class="fa fa-envelope"></i> enterprise@hrmpro.com</a>
            <a href="#" onclick="Landing.showDemoModal();return false;" class="landing-top-demo-btn"><i class="fa fa-play-circle"></i> Book Live Demo</a>
          </div>
        </div>

        <!-- ─── 1. TOP NAVBAR WITH WARM CORAL ACCENTS ─── -->
        <header class="landing-header">
          <div class="landing-nav-container">
            <a href="#" class="landing-brand" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">
              <div class="landing-brand-icon">
                <i class="fa fa-users"></i>
              </div>
              <div>
                <div class="landing-brand-name">HRM Pro</div>
                <div class="landing-brand-tag">Enterprise Human Capital Platform</div>
              </div>
            </a>

            <nav class="landing-nav-links">
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
        </header>

        <!-- ─── 2. HERO SECTION WITH 3D SHOWCASE ─── -->
        <section class="landing-hero-section">
          <div class="landing-hero-grid">
            <!-- Left Hero Content -->
            <div class="landing-hero-content">
              <div class="landing-pill-badge">
                <i class="fa fa-sparkles"></i> Intelligent All-in-One HR &amp; Payroll Platform
              </div>

              <h1 class="landing-hero-title">
                Next-Gen Workforce Operations <br><span class="text-gradient-coral">Made Effortless for Enterprises</span>
              </h1>

              <p class="landing-hero-sub">
                Eliminate payroll friction with automated statutory tax calculations, real-time multi-branch biometric attendance, granular multi-tier role permissions, automated PDF report dispatch, and verified digital document generation.
              </p>

              <div class="landing-cta-group">
                <button class="landing-hero-btn-primary" onclick="Landing.scrollTo('quote-section')">
                  Get Instant Quote / Demo <i class="fa fa-arrow-right"></i>
                </button>
                <button class="landing-hero-btn-secondary" onclick="Landing.showDemoModal()">
                  <i class="fa fa-play-circle" style="color:var(--hrm-coral);font-size:16px"></i> Interactive System Tour
                </button>
              </div>

              <div class="landing-trust-badges">
                <div class="landing-trust-item">
                  <i class="fa fa-building-shield"></i>
                  <div>
                    <strong>Multi-Company Holdings</strong>
                    <span>Head Office &amp; Subsidiary Data Scoping</span>
                  </div>
                </div>
                <div class="landing-trust-item">
                  <i class="fa fa-file-invoice-dollar"></i>
                  <div>
                    <strong>Statutory F&amp;F Settlement</strong>
                    <span>Automated 30/26 Gratuity &amp; Clearances</span>
                  </div>
                </div>
                <div class="landing-trust-item">
                  <i class="fa fa-money-bill-transfer"></i>
                  <div>
                    <strong>SPMS Payroll &amp; 6 CSVs</strong>
                    <span>Exact FBR Tax Engine &amp; Bank Splitter</span>
                  </div>
                </div>
                <div class="landing-trust-item">
                  <i class="fa fa-fingerprint"></i>
                  <div>
                    <strong>Biometric Fleet Hub</strong>
                    <span>Live Hardware Ingestion &amp; Remote IP Gates</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Hero 3D Centerpiece -->
            <div class="landing-hero-visual">
              <div class="hero-3d-wrapper">
                <!-- Floating Metric 1: Biometric Attendance Rate -->
                <div class="hero-3d-badge-floating badge-pos-att" onclick="Landing.showModule('attendance')" style="cursor:pointer" title="Click to view Attendance Module">
                  <div style="width:36px;height:36px;border-radius:8px;background:#fff5f2;color:#e05638;display:flex;align-items:center;justify-content:center;font-size:18px">
                    <i class="fa fa-fingerprint"></i>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#64748b;font-weight:700">Attendance Rate</div>
                    <div style="font-size:17px;font-weight:900;color:#111827">96.8%</div>
                    <div style="font-size:11px;color:#16a34a;font-weight:700"><i class="fa fa-circle-check"></i> Live Biometric Sync</div>
                  </div>
                </div>

                <!-- Floating Metric 2: Monthly Payroll Processed -->
                <div class="hero-3d-badge-floating badge-pos-pay" onclick="Landing.showModule('payroll')" style="cursor:pointer" title="Click to view Payroll Module">
                  <div style="width:36px;height:36px;border-radius:8px;background:#f0fdf4;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:18px">
                    <i class="fa fa-coins"></i>
                  </div>
                  <div>
                    <div style="font-size:11px;color:#64748b;font-weight:700">Monthly Payroll</div>
                    <div style="font-size:17px;font-weight:900;color:#111827">PKR 4.85M</div>
                    <div style="font-size:11px;color:#16a34a;font-weight:700"><i class="fa fa-shield-check"></i> 100% Tax Compliant</div>
                  </div>
                </div>

                <!-- 3D Framed Render Image -->
                <div class="hero-3d-frame">
                  <img src="assets/hero-3d.jpg" alt="HRM Pro Command Center" class="hero-3d-image" onerror="this.src='public/assets/hero-3d.jpg'">
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 3. "YOUR TRUSTED PARTNER" 16 MODULE PRODUCT GRID (MATCHING 4x4 SCREENSHOT GRID) ─── -->
        <section class="section-modules-gallery" id="modules-section">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-cubes"></i> 16 Comprehensive Modules
            </div>
            <h2 class="landing-section-title">Your Trusted Partner for Enterprise Workforce Management</h2>
            <p class="landing-section-sub">
              Empowering fast-growing enterprises, multi-branch corporations &amp; institutions with seamless, audit-ready HR automation.
            </p>
          </div>

          <div class="modules-product-grid">
            \${this.renderModulesProductGrid()}
          </div>
        </section>

        <!-- ─── 4. SECONDARY BANNER (MATCHING SCREENSHOT) ─── -->
        <section class="custom-banner-section">
          <h2 class="custom-banner-title">Custom Enterprise Workflows for High-Growth Teams — Zero Setup Friction</h2>
          <p class="custom-banner-sub">
            Modular role-based permissions, automated approval matrices, multi-branch attendance sync, and instant compliance reports built for scale.
          </p>
        </section>

        <!-- ─── 5. "WHY CHOOSE US" (4 CARDS WITH CORAL CIRCLE ICONS) ─── -->
        <section class="why-choose-section" id="why-us">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-award"></i> The Enterprise Edge
            </div>
            <h2 class="landing-section-title">Why Choose HRM Pro</h2>
            <p class="landing-section-sub">
              Engineered specifically to solve real operational bottlenecks that slow HR and finance teams down.
            </p>
          </div>

          <div class="why-choose-grid">
            <div class="why-card">
              <div class="why-card-icon"><i class="fa fa-user-lock"></i></div>
              <h3 class="why-card-title">Granular Multi-Tier RBAC</h3>
              <p class="why-card-desc">Configure dynamic partial permissions per module (view-only, apply-only, approve-only, export-only) without granting full admin rights.</p>
            </div>

            <div class="why-card">
              <div class="why-card-icon"><i class="fa fa-scale-balanced"></i></div>
              <h3 class="why-card-title">Audit-Ready Statutory Engine</h3>
              <p class="why-card-desc">Pre-configured with Pakistan 2024–2025 FBR tax slabs, EOBI, SESSI/PESSI, and statutory 30/26 gratuity exit settlements.</p>
            </div>

            <div class="why-card">
              <div class="why-card-icon"><i class="fa fa-fingerprint"></i></div>
              <h3 class="why-card-title">Real-Time Biometric Gateway</h3>
              <p class="why-card-desc">Centralized hardware sync with physical fingerprint &amp; facial scanners across all regional branches, with grace buffers and shift swap rules.</p>
            </div>

            <div class="why-card">
              <div class="why-card-icon"><i class="fa fa-file-pdf"></i></div>
              <h3 class="why-card-title">Automated PDF Dispatch</h3>
              <p class="why-card-desc">Scheduled morning briefs, payroll audits, and bank advice reports automatically generated and delivered to executive inboxes.</p>
            </div>
          </div>
        </section>

        <!-- ─── 6. "PREMIUM CAPABILITIES & FINISHES" (2x4 GALLERY MATCHING SCREENSHOT) ─── -->
        <section class="premium-finishes-section" id="capabilities">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-gem"></i> Premium Capabilities &amp; Finishes
            </div>
            <h2 class="landing-section-title">Built with Enterprise Rigor &amp; Attention to Detail</h2>
            <p class="landing-section-sub">
              From cryptographic document seals to multi-company scoping, discover the advanced mechanisms powering your workforce.
            </p>
          </div>

          <div class="premium-finishes-grid">
            \${this.renderPremiumFinishesGrid()}
          </div>
        </section>

        <!-- ─── 7. "ONE PLACE TO MANAGE YOUR WORKFORCE" (6 WORKFLOW STEPS) ─── -->
        <section class="lifecycle-workflow-section" id="workflow">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-arrows-split-up-and-left"></i> End-to-End Pipeline
            </div>
            <h2 class="landing-section-title">One Place to Manage Your Entire Workforce Lifecycle</h2>
            <p class="landing-section-sub">
              Seamlessly guide employees from first application to final gratuity settlement in one unified system.
            </p>
          </div>

          <div class="lifecycle-steps-row">
            \${this.renderWorkflowSteps()}
          </div>
        </section>

        <!-- ─── 8. INTERACTIVE PAKISTAN STATUTORY TAX CALCULATOR ─── -->
        <section class="tax-calc-section" id="tax-calc" style="padding:60px 24px;background:#ffffff;border-top:1px solid #f1f5f9">
          <div class="tax-calc-card">
            <div style="text-align:center;max-width:680px;margin:0 auto 36px auto">
              <div class="landing-pill-badge tax-calc-badge" style="margin-bottom:12px">
                <i class="fa fa-calculator" style="color:var(--hrm-coral)"></i> Live Statutory Payroll Estimator
              </div>
              <h2 class="tax-calc-title" style="font-size:32px;font-weight:900;letter-spacing:-0.8px;margin-bottom:10px">
                Interactive Salary &amp; Income Tax Calculator
              </h2>
              <p class="tax-calc-desc" style="font-size:14px;line-height:1.6;color:#64748b">
                Calculate real-time monthly take-home pay, FBR income tax deductions, and statutory funds under official Tax Slabs (2024-2025). Deducts tax after Provident Fund and exempt allowances for maximum take-home clarity.
              </p>
            </div>

            <div class="tax-calc-grid">
              <!-- Inputs Side -->
              <div class="tax-calc-box-input">
                <label class="tax-calc-label" style="font-size:13.5px;display:block;margin-bottom:6px;font-weight:700">
                  Monthly Gross Salary (PKR)
                </label>
                <div style="position:relative;margin-bottom:14px">
                  <span class="tax-calc-prefix" style="position:absolute;left:14px;top:12px;font-weight:800;font-size:15px;color:var(--hrm-coral)">PKR</span>
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
              </div>

              <!-- Results Display Side -->
              <div class="tax-calc-box-results">
                <div class="tax-results-net-card" style="background:var(--hrm-coral);color:#ffffff;border-radius:14px;padding:22px">
                  <div class="tax-net-title" style="font-size:12px;letter-spacing:0.3px;opacity:0.9">Estimated Net Take-Home Pay</div>
                  <div class="tax-net-amount" id="tax-res-net" style="font-size:32px;font-weight:900;margin:6px 0">PKR 144,000</div>
                  <div class="tax-net-sub" style="font-size:13px;opacity:0.9" id="tax-res-pct">96.0% of gross monthly salary</div>
                </div>

                <!-- Ledger Rows -->
                <div class="tax-results-row" style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">
                  <span class="tax-row-label">Monthly Gross Salary</span>
                  <strong class="tax-row-val" id="tax-res-gross">PKR 150,000</strong>
                </div>
                <div class="tax-results-row" style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">
                  <span class="tax-row-label">Annual Income Tax</span>
                  <strong style="color:#ef4444;font-weight:800" id="tax-res-annual-tax">PKR 72,000</strong>
                </div>
                <div class="tax-results-row" style="display:flex;justify-content:space-between;padding:10px 0">
                  <span class="tax-row-label">FBR Tax Bracket</span>
                  <span style="font-size:12px;color:var(--hrm-coral);text-align:right;font-weight:700" id="tax-res-slab-desc">Slab 3</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 9. FREQUENTLY ASKED QUESTIONS (ACCORDION) ─── -->
        <section class="landing-faq-section" id="faq" style="padding:60px 24px;background:#f9fafb">
          <div class="landing-section-header">
            <div class="landing-pill-badge" style="margin:0 auto 12px auto">
              <i class="fa fa-circle-question"></i> Answers &amp; Clarity
            </div>
            <h2 class="landing-section-title">Frequently Asked Questions</h2>
            <p class="landing-section-sub">Everything you need to know about HRM Pro features, statutory payroll, and enterprise deployment.</p>
          </div>

          <div class="landing-faq-container" style="max-width:860px;margin:0 auto">
            <div class="landing-faq-item" id="faq-item-1" onclick="Landing.toggleFaq(1)" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;padding:18px 22px;cursor:pointer">
              <div class="landing-faq-question" style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px">
                <span>How does HRM Pro automate statutory tax and EOBI calculations?</span>
                <i class="fa fa-chevron-down" style="color:var(--hrm-coral)"></i>
              </div>
              <div class="landing-faq-answer" style="display:none;margin-top:12px;font-size:14px;color:#64748b;line-height:1.6">
                HRM Pro embeds official Pakistan FBR salary tax brackets (Finance Act 2024-2025). The system automatically calculates taxable income, applies progressive slab rates, deducts statutory EOBI employee contributions, and computes Provident Fund contributions seamlessly on each salary run.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-2" onclick="Landing.toggleFaq(2)" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;padding:18px 22px;cursor:pointer">
              <div class="landing-faq-question" style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px">
                <span>Can biometric attendance integrate across multiple physical offices?</span>
                <i class="fa fa-chevron-down" style="color:var(--hrm-coral)"></i>
              </div>
              <div class="landing-faq-answer" style="display:none;margin-top:12px;font-size:14px;color:#64748b;line-height:1.6">
                Yes. HRM Pro features a real-time hardware gateway supporting physical fingerprint and facial scanners across multiple branches. Punches synchronize with cloud database records instantly, calculating arrival grace buffers, late-coming penalties, and approved overtime tokens.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-3" onclick="Landing.toggleFaq(3)" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;padding:18px 22px;cursor:pointer">
              <div class="landing-faq-question" style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px">
                <span>How do granular partial permissions work in the Leave and Payroll modules?</span>
                <i class="fa fa-chevron-down" style="color:var(--hrm-coral)"></i>
              </div>
              <div class="landing-faq-answer" style="display:none;margin-top:12px;font-size:14px;color:#64748b;line-height:1.6">
                Through our multi-tier RBAC engine, administrators can grant view-only, apply-only, or approve-only rights to specific roles. For example, a Department Manager can be granted leave approval authority without gaining permission to modify leave quota allocations or edit employee records.
              </div>
            </div>

            <div class="landing-faq-item" id="faq-item-4" onclick="Landing.toggleFaq(4)" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;padding:18px 22px;cursor:pointer">
              <div class="landing-faq-question" style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:15px">
                <span>How does automated scheduled PDF report dispatching operate?</span>
                <i class="fa fa-chevron-down" style="color:var(--hrm-coral)"></i>
              </div>
              <div class="landing-faq-answer" style="display:none;margin-top:12px;font-size:14px;color:#64748b;line-height:1.6">
                HRM Pro includes an integrated background job scheduler. You can configure daily attendance briefs, weekly department summaries, and monthly payroll audit packages to be compiled into PDF/CSV formats and dispatched automatically to management emails at designated times.
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 10. GET AN INSTANT ENTERPRISE QUOTE / DEMO (MATCHING SCREENSHOT) ─── -->
        <section class="quote-demo-section" id="quote-section">
          <div class="quote-demo-grid">
            <!-- Left Mockup Visual -->
            <div class="quote-visual-card">
              <div style="width:52px;height:52px;border-radius:12px;background:#fff5f2;color:#e05638;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:18px">
                <i class="fa fa-shield-halved"></i>
              </div>
              <h3 style="font-size:24px;font-weight:900;color:#111827;margin-bottom:10px">Enterprise HRM Pro Suite</h3>
              <p style="font-size:14.5px;color:#64748b;line-height:1.6;margin-bottom:20px">
                Get a custom proposal tailored to your employee headcount, branch network, and statutory requirements.
              </p>
              
              <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
                <div style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:#374151;font-weight:600">
                  <i class="fa fa-circle-check" style="color:#e05638"></i> 14-Day Full Access Enterprise Trial
                </div>
                <div style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:#374151;font-weight:600">
                  <i class="fa fa-circle-check" style="color:#e05638"></i> Zero Setup Fee &amp; Assisted Data Migration
                </div>
                <div style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:#374151;font-weight:600">
                  <i class="fa fa-circle-check" style="color:#e05638"></i> 24/7 Priority Support &amp; Dedicated Account Lead
                </div>
              </div>

              <div style="border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.06)">
                <img src="assets/hr_functions_scene.jpg" alt="HR Operations Suite" style="width:100%;height:auto;display:block">
              </div>
            </div>

            <!-- Right Interactive Form -->
            <div class="quote-form-card">
              <h3 class="quote-form-title">Request Enterprise Proposal</h3>
              <p class="quote-form-sub">Fill out the details below to receive a customized pricing quote and live system demonstration.</p>

              <form onsubmit="Landing.submitQuote(event)">
                <div class="quote-inputs-grid">
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Full Name *</label>
                    <input type="text" id="quote-name" class="quote-input-field" placeholder="e.g. Tariq Mehmood" required>
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Work Email *</label>
                    <input type="email" id="quote-email" class="quote-input-field" placeholder="tariq@enterprise.com" required>
                  </div>
                </div>

                <div class="quote-inputs-grid">
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Phone Number</label>
                    <input type="tel" id="quote-phone" class="quote-input-field" placeholder="+92 300 1234567">
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Company / Organization</label>
                    <input type="text" id="quote-company" class="quote-input-field" placeholder="Apex Global Pvt. Ltd.">
                  </div>
                </div>

                <div class="quote-inputs-grid">
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Employee Headcount</label>
                    <select id="quote-size" class="quote-input-field">
                      <option value="10-50">10 – 50 Employees</option>
                      <option value="51-200" selected>51 – 200 Employees</option>
                      <option value="201-500">201 – 500 Employees</option>
                      <option value="500+">500+ Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Primary Need</label>
                    <select id="quote-module" class="quote-input-field">
                      <option value="all" selected>All-in-One Full HRM Pro Suite</option>
                      <option value="payroll">Payroll &amp; Tax Compliance Only</option>
                      <option value="attendance">Biometric Attendance &amp; Shifts</option>
                      <option value="recruitment">Recruitment ATS &amp; Onboarding</option>
                    </select>
                  </div>
                </div>

                <div style="margin-bottom:14px">
                  <label style="font-size:12px;font-weight:700;color:#4b5563;display:block;margin-bottom:4px">Specific Requirements / Notes</label>
                  <textarea id="quote-notes" class="quote-input-field" rows="2" placeholder="Tell us about your multi-branch locations, legacy system migration, or custom policies..."></textarea>
                </div>

                <button type="submit" class="quote-submit-btn">
                  Request Custom Proposal &amp; Live Demo <i class="fa fa-arrow-right" style="margin-left:6px"></i>
                </button>
              </form>
            </div>
          </div>
        </section>

        <!-- ─── 11. CLIENT TESTIMONIALS & REVIEWS (MATCHING SCREENSHOT) ─── -->
        <section class="testimonials-section" id="testimonials">
          <div class="testimonials-grid">
            <!-- Left Terracotta Feature Quote Card -->
            <div class="testimonial-coral-card">
              <div class="testimonial-quote-icon">
                <i class="fa fa-quote-left"></i>
              </div>
              <p class="testimonial-quote-text">
                "Transitioning our 450+ multi-branch workforce to HRM Pro reduced our payroll closing cycle from 6 days to under 4 hours. The automated FBR tax engine and biometric integration are completely dependable."
              </p>
              <div class="testimonial-author-row">
                <img src="assets/avatars/tariq_hussain.jpg" alt="Tariq Hussain" class="testimonial-author-avatar" onerror="this.src='public/assets/avatars/tariq_hussain.jpg'">
                <div>
                  <div class="testimonial-author-name">Tariq Hussain</div>
                  <div class="testimonial-author-role">Chief Human Resources Officer, Apex Global</div>
                </div>
              </div>
            </div>

            <!-- Right Reviews & Avatar Cluster -->
            <div class="reviews-ratings-wrap">
              <div class="reviews-badges-row">
                <div class="review-badge-item">
                  <i class="fa fa-star"></i>
                  <span>Trustpilot <strong>4.9 / 5</strong></span>
                </div>
                <div class="review-badge-item">
                  <i class="fa fa-star"></i>
                  <span>Google Reviews <strong>4.9 ★</strong></span>
                </div>
              </div>

              <div style="font-size:14.5px;font-weight:800;color:#111827;margin-bottom:6px">
                Trusted by 380+ Verified HR Leaders
              </div>
              <div style="font-size:13px;color:#64748b;margin-bottom:18px">
                Across technology, manufacturing, banking, and professional services.
              </div>

              <div class="avatars-cluster">
                <img src="assets/avatars/ahmed_khan.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/ahmed_khan.jpg'">
                <img src="assets/avatars/fatima_raza.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/fatima_raza.jpg'">
                <img src="assets/avatars/omar_farhan.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/omar_farhan.jpg'">
                <img src="assets/avatars/sara_malik.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/sara_malik.jpg'">
                <img src="assets/avatars/sehar_nawaz.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/sehar_nawaz.jpg'">
                <img src="assets/avatars/usman_baig.jpg" alt="Client" class="cluster-avatar" onerror="this.src='public/assets/avatars/usman_baig.jpg'">
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 12. FEATURED PRODUCTS ROW (5 CARDS MATCHING SCREENSHOT) ─── -->
        <section class="featured-products-section">
          <div class="landing-section-header" style="margin-bottom:28px">
            <h3 style="font-size:20px;font-weight:900;color:#111827">Featured Enterprise Suites</h3>
          </div>
          <div class="featured-products-grid">
            \${this.renderFeaturedSuites()}
          </div>
        </section>

        <!-- ─── 13. INTEGRATION PARTNERS (MATCHING SCREENSHOT) ─── -->
        <section class="partners-section">
          <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b">
            Seamlessly Integrated with Enterprise Infrastructure
          </div>
          <div class="partners-logos-row">
            <div class="partner-logo-item"><i class="fa-brands fa-google"></i> Google Workspace</div>
            <div class="partner-logo-item"><i class="fa-brands fa-microsoft"></i> Microsoft 365</div>
            <div class="partner-logo-item"><i class="fa-brands fa-slack"></i> Slack Real-Time</div>
            <div class="partner-logo-item"><i class="fa-brands fa-whatsapp"></i> WhatsApp Alerts</div>
            <div class="partner-logo-item"><i class="fa fa-building-columns"></i> 1-Click Bank Advice CSVs</div>
          </div>
        </section>

        <!-- ─── 14. ACTIVE CAREERS & ATS PORTAL ─── -->
        <section class="landing-careers-section" id="careers" style="padding:60px 24px;background:#ffffff;border-top:1px solid #f1f5f9">
          <div class="landing-careers-inner" style="max-width:1400px;margin:0 auto">
            <div class="landing-section-header">
              <div class="landing-pill-badge" style="margin:0 auto 12px auto">
                <i class="fa fa-briefcase"></i> We Are Actively Hiring
              </div>
              <h2 class="landing-section-title">Current Open Positions at HRM Pro</h2>
              <p class="landing-section-sub">
                Explore high-growth career opportunities across Engineering, Human Resources, Finance, and Operations.
              </p>
            </div>

            <!-- Job Openings Grid -->
            <div class="careers-jobs-grid" id="careers-jobs-list" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:20px">
              \${openJobsList.length > 0 ? openJobsList.map(job => {
                const dept = depts.find(d => d.id === job.departmentId);
                return \`
                  <div class="career-job-card" data-dept="\${job.departmentId}" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                      <div>
                        <span style="font-size:11px;font-weight:700;color:var(--hrm-coral);background:#fff5f2;padding:3px 8px;border-radius:6px">\${dept?.name || 'General Operations'}</span>
                        <h3 style="font-size:16px;font-weight:800;color:#111827;margin-top:6px">\${job.title}</h3>
                      </div>
                      <span style="font-size:11px;color:#16a34a;font-weight:700"><i class="fa fa-circle" style="font-size:8px"></i> Open</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-bottom:12px;font-size:12px;color:#64748b">
                      <span><i class="fa fa-clock"></i> \${job.experience || 'Full-time'}</span>
                      <span>•</span>
                      <span><i class="fa fa-money-bill-wave"></i> Rs. \${job.salary || 'Competitive'}</span>
                    </div>
                    <button class="btn btn-primary" style="width:100%;background:var(--hrm-coral);border-color:var(--hrm-coral);border-radius:8px;font-weight:700" onclick="Landing.openApplyModal(\${job.id})">
                      Apply Now <i class="fa fa-arrow-right"></i>
                    </button>
                  </div>
                \`;
              }).join('') : \`
                <div style="grid-column: 1/-1;text-align:center;padding:40px;background:#f8fafc;border-radius:12px;color:#64748b">
                  <i class="fa fa-briefcase" style="font-size:36px;margin-bottom:12px;color:#94a3b8"></i>
                  <p style="font-size:15px;font-weight:600;margin:0">No current openings matching your criteria. Check back soon!</p>
                </div>
              \`}
            </div>
          </div>
        </section>

        <!-- ─── 15. MODERN ENTERPRISE FOOTER ─── -->
        <footer class="landing-footer">
          <div class="landing-footer-grid">
            <!-- Brand Column -->
            <div class="landing-footer-brand-col">
              <div class="landing-brand" style="margin-bottom:12px">
                <div class="landing-brand-icon">
                  <i class="fa fa-users"></i>
                </div>
                <div>
                  <div class="landing-brand-name">HRM Pro</div>
                  <div class="landing-brand-tag" style="color:#94a3b8">Enterprise Human Capital Platform</div>
                </div>
              </div>
              <p class="landing-footer-tagline">
                Cloud Human Resource Information System with real-time biometric synchronization, automated statutory payroll, and end-to-end employee lifecycle governance.
              </p>
            </div>

            <!-- Links: Product -->
            <div class="landing-footer-col">
              <h3 class="landing-footer-heading">Platform Modules</h3>
              <div class="landing-footer-links">
                <a href="#" onclick="Landing.showModule('employees');return false;">Employees &amp; e-DMS</a>
                <a href="#" onclick="Landing.showModule('attendance');return false;">Biometric Attendance</a>
                <a href="#" onclick="Landing.showModule('payroll');return false;">Statutory Payroll</a>
                <a href="#" onclick="Landing.showModule('leaves');return false;">Leave Approvals</a>
                <a href="#" onclick="Landing.showModule('recruitment');return false;">Recruitment ATS</a>
                <a href="#" onclick="Landing.showModule('reports');return false;">Scheduled PDF Reports</a>
              </div>
            </div>

            <!-- Links: Compliance -->
            <div class="landing-footer-col">
              <h3 class="landing-footer-heading">Statutory &amp; Security</h3>
              <div class="landing-footer-links">
                <a href="#tax-calc" onclick="Landing.scrollTo('tax-calc');return false;">FBR Tax Slabs 2024-25</a>
                <a href="#capabilities" onclick="Landing.scrollTo('capabilities');return false;">30/26 Gratuity Settlement</a>
                <a href="#capabilities" onclick="Landing.scrollTo('capabilities');return false;">ISO 27001 Security</a>
                <a href="#capabilities" onclick="Landing.scrollTo('capabilities');return false;">256-Bit Data Encryption</a>
                <a href="#why-us" onclick="Landing.scrollTo('why-us');return false;">Granular Multi-Tier RBAC</a>
              </div>
            </div>

            <!-- Links: Contact -->
            <div class="landing-footer-col">
              <h3 class="landing-footer-heading">Enterprise Support</h3>
              <div class="landing-footer-links">
                <a href="tel:+18005554767"><i class="fa fa-phone" style="margin-right:6px"></i> +1 (800) 555-HRMPRO</a>
                <a href="mailto:enterprise@hrmpro.com"><i class="fa fa-envelope" style="margin-right:6px"></i> enterprise@hrmpro.com</a>
                <a href="#" onclick="Landing.scrollTo('quote-section');return false;">Request Custom Quote</a>
                <a href="#" onclick="Landing.showDemoModal();return false;">Book Live Demo</a>
                <a href="#" onclick="App.showLogin();return false;">Sign In to Portal</a>
              </div>
            </div>
          </div>

          <div class="landing-footer-bottom">
            <div>© 2026 HRM Pro Enterprise Edition. All rights reserved.</div>
            <div style="display:flex;gap:18px">
              <a href="#" onclick="return false;">Privacy Policy</a>
              <a href="#" onclick="return false;">Terms of Service</a>
              <a href="#" onclick="return false;">Security Protocols</a>
            </div>
          </div>
        </footer>
      </div>
    \`;

    // Initialize interactive tax calculator with default state
    setTimeout(() => {
      Landing.updateTaxCalc(150000);
    }, 50);
  },`;

// Replace render() method: from "render() {" up to "getPillarCardHtml(pillarKey) {"
const startMarker = '  render() {';
const endMarker = '  // ─── Dynamic Pillar Content Generator ───';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find render() bounds in landing.js');
  process.exit(1);
}

const before = code.substring(0, startIndex);
const after = code.substring(endIndex);

const updatedCode = before + newRenderCode + '\n\n  ' + after;
fs.writeFileSync(landingPath, updatedCode, 'utf8');
console.log('✅ Replaced Landing.render() with screenshot-matching layout and warm terracotta theme!');
