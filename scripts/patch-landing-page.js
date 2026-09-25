const fs = require('fs');
const path = require('path');

const landingPath = path.join(__dirname, '../js/landing.js');
let content = fs.readFileSync(landingPath, 'utf8');

// 1. Ensure submitQuote method is present in Landing object
if (!content.includes('submitQuote(e)')) {
  const insertMarker = 'openContactModal() {';
  const submitQuoteCode = `submitQuote(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = document.getElementById('quote-name')?.value?.trim();
    const email = document.getElementById('quote-email')?.value?.trim();
    const phone = document.getElementById('quote-phone')?.value?.trim();
    const company = document.getElementById('quote-company')?.value?.trim();
    const size = document.getElementById('quote-size')?.value;
    const module = document.getElementById('quote-module')?.value;
    const notes = document.getElementById('quote-notes')?.value?.trim();

    if (!name || !email) {
      if (typeof Toast !== 'undefined') Toast.show('Please provide your name and business email.', 'warning');
      return;
    }

    const quotes = JSON.parse(localStorage.getItem('hrm_quotes') || '[]');
    const newQuote = {
      id: Date.now(),
      refNo: 'REQ-' + Math.floor(100000 + Math.random() * 900000),
      name, email, phone, company, size, module, notes,
      createdAt: new Date().toISOString()
    };
    quotes.push(newQuote);
    localStorage.setItem('hrm_quotes', JSON.stringify(quotes));

    if (typeof Modal !== 'undefined') {
      Modal.show({
        title: 'Enterprise Proposal Request Confirmed',
        body: \`
          <div style="text-align:center;padding:24px 12px">
            <div style="width:64px;height:64px;border-radius:50%;background:#fff5f2;color:#e05638;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px auto">
              <i class="fa fa-circle-check"></i>
            </div>
            <h3 style="font-size:20px;font-weight:900;color:#111827;margin-bottom:8px">Proposal Request Received!</h3>
            <p style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:18px">
              Thank you, <strong>\${name}</strong>. Your customized enterprise deployment quote for <strong>\${company || 'your organization'}</strong> has been registered.
            </p>
            <div style="background:#f9fafb;border:1px dashed #e05638;border-radius:10px;padding:12px;margin-bottom:20px">
              <div style="font-size:12px;color:#6b7280">Reference Tracking Number:</div>
              <div style="font-size:18px;font-weight:900;color:#e05638;letter-spacing:1px">\${newQuote.refNo}</div>
            </div>
            <p style="font-size:13px;color:#4b5563;margin-bottom:24px">
              A dedicated HR Solutions Specialist will reach out to <strong>\${email}</strong> within 2 business hours.
            </p>
            <button class="btn btn-primary" style="background:#e05638;border-color:#e05638;border-radius:9999px;padding:10px 28px;font-weight:800" onclick="Modal.closeAll()">
              Done
            </button>
          </div>
        \`
      });
    } else if (typeof Toast !== 'undefined') {
      Toast.show('Proposal request submitted successfully!', 'success');
    }
  },

  `;
  content = content.replace(insertMarker, submitQuoteCode + insertMarker);
}

// 2. Add helper render methods for screenshot sections if not present
if (!content.includes('renderModulesProductGrid()')) {
  const helpersCode = `
  renderModulesProductGrid() {
    const list = [
      { id: 'employees', title: 'Employee Directory & e-DMS', category: 'Core Workforce', icon: 'fa-users', subtitle: '360° master directory, CNIC records, emergency contacts, branch hierarchy, and 30/60/90-day document expiry triggers.' },
      { id: 'attendance', title: 'Biometric Attendance & Shifts', category: 'Time & Attendance', icon: 'fa-fingerprint', subtitle: 'Real-time biometric fingerprint & facial hardware ingestion, geofencing, grace minutes, and shift rostering.' },
      { id: 'payroll', title: 'Statutory Payroll & Tax Engine', category: 'Compensation', icon: 'fa-money-bill-wave', subtitle: 'Pakistan FBR 2024–2025 tax slabs, EOBI, SESSI/PESSI, auto-deductions, and 6 standard bank advice CSVs.' },
      { id: 'leaves', title: 'Leave Approvals & Quotas', category: 'Time Off & Quota', icon: 'fa-calendar-days', subtitle: 'Granular partial permissions (apply, review, approve, quota adjustment), annual allowances, and encashment.' },
      { id: 'performance', title: 'Performance Reviews & OKRs', category: 'Talent Growth', icon: 'fa-chart-line', subtitle: 'Quarterly appraisal cycles, managerial ratings, KPI scorecards, and continuous feedback.' },
      { id: 'recruitment', title: 'Recruitment ATS & Kanban', category: 'Talent Acquisition', icon: 'fa-briefcase', subtitle: 'Job board posting, candidate tracking stages, resume parsing, and verified digital offer letters.' },
      { id: 'assets', title: 'Asset Inventory & Custody', category: 'Operations', icon: 'fa-laptop-file', subtitle: 'Hardware asset tracking, serial barcodes, custodian sign-offs, and return inspection on exit.' },
      { id: 'expenses', title: 'Travel & Expense Claims', category: 'Finance', icon: 'fa-receipt', subtitle: 'Multi-currency expense submissions, receipt uploads, mileage logs, and manager reimbursement sign-offs.' },
      { id: 'helpdesk', title: 'IT Helpdesk & Grievance', category: 'Support & SLA', icon: 'fa-headset', subtitle: 'SLA-based ticket queues, priority triage, departmental assignment, and resolution tracking.' },
      { id: 'settlement', title: 'Full & Final Gratuity', category: 'Separation', icon: 'fa-file-invoice-dollar', subtitle: 'Statutory 30/26 gratuity formula engine, multi-gate clearances (IT/Admin/Finance), and F&F vouchers.' },
      { id: 'training', title: 'Training & LMS Certifications', category: 'Learning', icon: 'fa-graduation-cap', subtitle: 'Course catalog, training calendar, nomination approvals, and skill matrix certificates.' },
      { id: 'company', title: 'Multi-Company Holdings', category: 'Enterprise', icon: 'fa-building-columns', subtitle: 'Model A architecture for parent holding companies and multi-branch subsidiaries with data scoping.' },
      { id: 'administration', title: 'Dynamic HR Documents', category: 'Governance', icon: 'fa-file-signature', subtitle: 'Experience certificates, relieving letters, salary visa verifications, NDAs, and executive digital stamps.' },
      { id: 'reports', title: 'Crontab Scheduled Reports', category: 'Analytics', icon: 'fa-file-chart-column', subtitle: 'Automated morning briefs, weekly attendance digests, and monthly payroll audit exports via email.' },
      { id: 'events', title: 'Events & Public Holidays', category: 'Workplace', icon: 'fa-calendar-check', subtitle: 'Gazetted public holidays, corporate announcements, training workshops, and employee social calendar.' },
      { id: 'dashboard', title: 'Executive Telemetry & KPIs', category: 'Intelligence', icon: 'fa-gauge-high', subtitle: 'Live workforce KPIs, gender diversity metrics, turnover analytics, and departmental charts.' }
    ];

    return list.map(m => \`
      <div class="module-prod-card" onclick="Landing.showModule('\${m.id}')">
        <div class="module-prod-card-top">
          <div class="module-prod-icon"><i class="fa \${m.icon}"></i></div>
          <span class="module-prod-pill">\${m.category}</span>
        </div>
        <div class="module-prod-title">\${m.title}</div>
        <div class="module-prod-desc">\${m.subtitle}</div>
        <div class="module-prod-footer">
          <span>Inspect Module</span>
          <i class="fa fa-arrow-right"></i>
        </div>
      </div>
    \`).join('');
  },

  renderPremiumFinishesGrid() {
    const finishes = [
      { title: 'Digital Signatures & Seals', icon: 'fa-stamp', badge: 'Cryptographic Seals' },
      { title: 'Multi-Tier Approvals', icon: 'fa-users-gear', badge: 'Hierarchical Workflows' },
      { title: 'FBR Tax & Gratuity Engine', icon: 'fa-scale-balanced', badge: 'Statutory 30/26 & Tax' },
      { title: 'QR Verification Badges', icon: 'fa-qrcode', badge: 'Tamper-Proof Verification' },
      { title: 'Crontab PDF Reports', icon: 'fa-file-pdf', badge: 'Automated Dispatches' },
      { title: 'Biometric Gateway', icon: 'fa-fingerprint', badge: 'Hardware Socket Sync' },
      { title: 'Multi-Company Scoping', icon: 'fa-building-shield', badge: 'Holding Structures' },
      { title: 'Asset Barcode & Audit', icon: 'fa-barcode', badge: 'Hardware Custody Tracking' }
    ];

    return finishes.map(f => \`
      <div class="premium-card">
        <div class="premium-card-preview">
          <i class="fa \${f.icon}"></i>
        </div>
        <div class="premium-card-badge">
          <i class="fa fa-circle-check"></i>
          <span>\${f.title}</span>
        </div>
      </div>
    \`).join('');
  },

  renderWorkflowSteps() {
    const steps = [
      { num: '01', title: 'Recruit & ATS', sub: 'Kanban & Scoring', icon: 'fa-user-plus' },
      { num: '02', title: 'Digital Onboard', sub: 'e-DMS & Contracts', icon: 'fa-file-shield' },
      { num: '03', title: 'Biometrics', sub: 'Hardware Punches', icon: 'fa-clock' },
      { num: '04', title: 'Leaves & Quota', sub: 'Multi-Tier Approvals', icon: 'fa-calendar-days' },
      { num: '05', title: 'Auto Payroll', sub: 'FBR Tax & 6 CSVs', icon: 'fa-money-bill-wave' },
      { num: '06', title: 'Exit & Settle', sub: '30/26 Gratuity Vouchers', icon: 'fa-handshake' }
    ];

    return steps.map(s => \`
      <div class="lifecycle-step-item">
        <div class="lifecycle-step-circle">
          <i class="fa \${s.icon}"></i>
        </div>
        <div class="lifecycle-step-label">\${s.num}. \${s.title}</div>
        <div class="lifecycle-step-sub">\${s.sub}</div>
      </div>
    \`).join('');
  },

  renderFeaturedSuites() {
    const items = [
      { title: 'Biometric Attendance Hub', icon: 'fa-fingerprint' },
      { title: 'Statutory Payroll Engine', icon: 'fa-money-bill-transfer' },
      { title: 'Full & Final Gratuity', icon: 'fa-file-invoice-dollar' },
      { title: 'Dynamic HR Documents', icon: 'fa-file-signature' },
      { title: 'Crontab Scheduled PDF', icon: 'fa-file-pdf' }
    ];

    return items.map(it => \`
      <div class="featured-prod-card" onclick="Landing.scrollTo('modules-section')">
        <div class="featured-prod-icon">
          <i class="fa \${it.icon}"></i>
        </div>
        <div class="featured-prod-title">\${it.title}</div>
      </div>
    \`).join('');
  },
  `;

  content = content.replace('openContactModal() {', helpersCode + '\n  openContactModal() {');
}

fs.writeFileSync(landingPath, content, 'utf8');
console.log('✅ Patched landing.js with helper generators and submitQuote handler');
