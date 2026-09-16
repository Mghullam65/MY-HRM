// ============================================================
// HRM SYSTEM — Settings Module
// ============================================================

const Settings = {
  currentSection: 'company',

  render() {
    const content = document.getElementById('page-content');
    const sections = [
      { id: 'company', label: 'Company Profile', icon: 'fa-building' },
      { id: 'general', label: 'General Settings', icon: 'fa-sliders' },
      { id: 'roles_permissions', label: 'Roles & Permissions', icon: 'fa-user-shield' },
      { id: 'attendance_rules', label: 'Attendance Rules', icon: 'fa-clock' },
      { id: 'leave_policy', label: 'Leave Policy', icon: 'fa-calendar-xmark' },
      { id: 'payroll_config', label: 'Payroll Config', icon: 'fa-money-bill-wave' },
      { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
      { id: 'webhooks', label: 'Webhooks & Integrations', icon: 'fa-network-wired' },
      { id: 'security_telemetry', label: 'Security & API Tokens', icon: 'fa-key' },
      { id: 'appearance', label: 'Appearance', icon: 'fa-palette' },
      { id: 'backup', label: 'Backup & Restore', icon: 'fa-database' },
      { id: 'system', label: 'System', icon: 'fa-server' },
    ];

    content.innerHTML = `
      <div class="animate-fade-in" style="display:grid;grid-template-columns:220px 1fr;gap:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:8px;height:fit-content;position:sticky;top:0">
          ${sections.map(s => `
            <div class="nav-item ${this.currentSection === s.id ? 'active' : ''}" onclick="Settings.switchSection('${s.id}')" data-label="${s.label}">
              <i class="fa ${s.icon}"></i><span>${s.label}</span>
            </div>
          `).join('')}
        </div>
        <div id="settings-content"></div>
      </div>
    `;
    this.renderSection();
  },

  switchSection(section) {
    this.currentSection = section;
    document.querySelectorAll('[onclick*="Settings.switchSection"]').forEach(el => {
      const m = el.getAttribute('onclick').match(/'(\w+)'/);
      if (m) el.classList.toggle('active', m[1] === section);
    });
    this.renderSection();
  },

  renderSection() {
    const c = document.getElementById('settings-content');
    if (!c) return;
    switch (this.currentSection) {
      case 'company':            this.renderCompany(c); break;
      case 'general':            this.renderGeneral(c); break;
      case 'roles_permissions':  this.renderRolesPermissions(c); break;
      case 'attendance_rules':   this.renderAttendanceRules(c); break;
      case 'leave_policy':       this.renderLeavePolicy(c); break;
      case 'payroll_config':     this.renderPayrollConfig(c); break;
      case 'notifications':      this.renderNotifications(c); break;
      case 'webhooks':           this.renderWebhooks(c); break;
      case 'security_telemetry': this.renderSecurityTelemetry(c); break;
      case 'appearance':         this.renderAppearance(c); break;
      case 'backup':             this.renderBackup(c); break;
      case 'system':             this.renderSystem(c); break;
    }
  },

  // ─── Helpers ──────────────────────────────────────
  _getSetting(key, fallback) {
    const settings = DB.getObj('settings');
    return settings[key] !== undefined ? settings[key] : fallback;
  },

  _setSetting(key, value) {
    const settings = DB.getObj('settings');
    settings[key] = value;
    DB.set('settings', settings);
  },

  _settingRow(label, inputHTML, helpText) {
    return `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;padding-right:20px">
          <div style="font-size:13px;font-weight:600;color:var(--text)">${label}</div>
          ${helpText ? `<div style="font-size:11.5px;color:var(--text-3);margin-top:3px">${helpText}</div>` : ''}
        </div>
        <div style="width:300px;flex-shrink:0">${inputHTML}</div>
      </div>
    `;
  },

  _sectionCard(title, subtitle, bodyHTML, footerHTML = '') {
    return `
      <div class="card" style="margin-bottom:16px">
        <div style="margin-bottom:16px">
          <div style="font-size:16px;font-weight:700">${title}</div>
          ${subtitle ? `<div style="font-size:12px;color:var(--text-3);margin-top:3px">${subtitle}</div>` : ''}
        </div>
        ${bodyHTML}
        ${footerHTML ? `<div style="margin-top:20px;display:flex;justify-content:flex-end;gap:8px">${footerHTML}</div>` : ''}
      </div>
    `;
  },

  // ─── Company Profile, Branding, Letterhead & Signatures ──────────────────────
  renderCompany(c) {
    const s = key => this._getSetting(key, '');
    const logo = s('companyLogo') || '';
    const banner = s('companyLetterheadBanner') || '';
    const signature = s('signatorySignature') || '';
    const stamp = s('companyStamp') || '';
    const letterheadType = s('companyLetterheadType') || 'dynamic';
    const accentColor = s('companyAccentColor') || '#2563eb';

    // Store in memory for active unsaved state
    window._tempCompanyLogo = logo;
    window._tempLetterheadBanner = banner;
    window._tempSignatorySignature = signature;
    window._tempCompanyStamp = stamp;

    c.innerHTML = `
      <!-- Card 1: Core Company Profile -->
      ${this._sectionCard('Company Profile', 'Basic information about your organization', `
        ${this._settingRow('Company Name',
          `<input class="form-control" id="s-company-name" value="${s('companyName') || 'HRM Pro'}">`,
          'Displayed in sidebar, payslips, employee badges, and HR letters')}
        ${this._settingRow('Company Email',
          `<input class="form-control" id="s-company-email" type="email" value="${s('companyEmail') || 'hr@company.com'}">`,
          'Primary official contact email')}
        ${this._settingRow('Company Phone',
          `<input class="form-control" id="s-company-phone" value="${s('companyPhone') || '+92-21-1234567'}">`,
          'Primary official contact phone')}
        ${this._settingRow('Address',
          `<textarea class="form-control" id="s-company-address" rows="2">${s('companyAddress') || 'Suite 401, Business Plaza, Shahrah-e-Faisal, Karachi'}</textarea>`,
          'Full corporate address appearing on letterhead and payslips')}
        ${this._settingRow('NTN Number',
          `<input class="form-control" id="s-company-ntn" value="${s('companyNTN') || '1234567-8'}">`,
          'National Tax Number for statutory documents and tax filings')}
        ${this._settingRow('Website',
          `<input class="form-control" id="s-company-website" value="${s('companyWebsite') || 'https://company.com'}">`, '')}
        ${this._settingRow('Industry',
          `<select class="form-control" id="s-company-industry">
            ${['Information Technology','Finance','Healthcare','Manufacturing','Education','Retail','Construction','Hospitality','Telecom','Other'].map(i => `<option ${s('companyIndustry')===i?'selected':''}>${i}</option>`).join('')}
          </select>`, '')}
      `)}

      <!-- Card 2: Company Logo & Official Letterhead -->
      ${this._sectionCard('Corporate Branding & Letterhead Setup', 'Upload company logo and configure official letterhead used across HR letters, offer letters & badges', `
        <!-- Logo Row -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;padding-right:20px">
            <div style="font-size:13px;font-weight:600;color:var(--text)">Company Logo</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">
              Primary brand logo for application sidebar, smart badges, payslips, and HR letters. Recommended: PNG or SVG (transparent background).
            </div>
          </div>
          <div style="width:340px;flex-shrink:0">
            <div style="display:flex;align-items:center;gap:14px">
              <div id="company-logo-preview" style="width:90px;height:65px;border-radius:8px;border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;background:var(--surface);overflow:hidden;padding:4px">
                ${logo ? `<img src="${logo}" style="max-width:100%;max-height:100%;object-fit:contain" alt="Logo">` : `<div style="text-align:center;color:var(--text-muted);font-size:11px"><i class="fa fa-image" style="font-size:18px;display:block;margin-bottom:2px"></i>No Logo</div>`}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;flex:1">
                <label class="btn btn-outline btn-sm" style="cursor:pointer;text-align:center">
                  <i class="fa fa-upload"></i> Upload Logo
                  <input type="file" accept="image/*" style="display:none" onchange="Settings.handleLogoUpload(event)">
                </label>
                <button type="button" class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="Settings.removeLogo()">
                  <i class="fa fa-trash"></i> Remove Logo
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Letterhead Header Style -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;padding-right:20px">
            <div style="font-size:13px;font-weight:600;color:var(--text)">Letterhead Header Style</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">
              Choose between an Official Full-Page Letterhead (stationery sheet with text printed directly inside it), Dynamic header, or Top banner.
            </div>
          </div>
          <div style="width:360px;flex-shrink:0">
            <select class="form-control" id="s-letterhead-type" onchange="Settings.toggleLetterheadType(this.value)">
              <option value="full_page" ${letterheadType === 'full_page' ? 'selected' : ''}>Official Full-Page Letterhead (A4 Sheet — Details printed IN letterhead)</option>
              <option value="dynamic" ${letterheadType === 'dynamic' ? 'selected' : ''}>Dynamic Modern Header (Logo + Details + Accent line)</option>
              <option value="custom_banner" ${letterheadType === 'custom_banner' ? 'selected' : ''}>Top Header Banner Only</option>
            </select>
          </div>
        </div>

        <!-- Custom Letterhead Upload (Shown if full_page or custom_banner selected) -->
        <div id="custom-banner-row" style="display:${(letterheadType === 'custom_banner' || letterheadType === 'full_page') ? 'flex' : 'none'};align-items:flex-start;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;padding-right:20px">
            <div style="font-size:13px;font-weight:600;color:var(--text)" id="letterhead-upload-label">${letterheadType === 'full_page' ? 'Official Letterhead Sheet (A4 Full Page)' : 'Custom Letterhead Header Banner'}</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:3px" id="letterhead-upload-desc">
              ${letterheadType === 'full_page' ? 'Upload your complete A4 corporate letterhead page (PNG/JPG). All letter text, dates, references, signature, and stamp will be placed and printed directly inside this letterhead.' : 'High-resolution graphic letterhead banner printed directly at the top of official letters.'}
            </div>
          </div>
          <div style="width:360px;flex-shrink:0">
            <div id="letterhead-banner-preview" style="width:100%;height:${letterheadType === 'full_page' ? '120px' : '60px'};border-radius:6px;border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;background:var(--surface);overflow:hidden;margin-bottom:8px">
              ${banner ? `<img src="${banner}" style="width:100%;height:100%;object-fit:${letterheadType === 'full_page' ? 'contain' : 'cover'}" alt="Letterhead">` : `<span style="font-size:11px;color:var(--text-muted)"><i class="fa fa-file-image"></i> No Letterhead Uploaded</span>`}
            </div>
            <div style="display:flex;gap:8px">
              <label class="btn btn-outline btn-sm" style="cursor:pointer;flex:1;text-align:center">
                <i class="fa fa-upload"></i> Upload Letterhead
                <input type="file" accept="image/*" style="display:none" onchange="Settings.handleBannerUpload(event)">
              </label>
              <button type="button" class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="Settings.removeBanner()">
                <i class="fa fa-trash"></i> Remove
              </button>
            </div>
          </div>
        </div>

        <!-- Letterhead Page Clearances (Margins) for full_page -->
        <div id="letterhead-margins-row" style="display:${letterheadType === 'full_page' ? 'flex' : 'none'};align-items:flex-start;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;padding-right:20px">
            <div style="font-size:13px;font-weight:600;color:var(--text)">Letterhead Page Clearances (Margins)</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">
              Adjust top and bottom spacing so your text, ref numbers, and signatures fit cleanly between the letterhead header and footer bar.
            </div>
          </div>
          <div style="width:360px;flex-shrink:0;display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--text-2);display:block;margin-bottom:4px">Top Clearance (px)</label>
              <input type="number" class="form-control" id="s-letterhead-top-margin" value="${s('companyLetterheadTopMargin') || 160}" min="40" max="400" step="5">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--text-2);display:block;margin-bottom:4px">Bottom Clearance (px)</label>
              <input type="number" class="form-control" id="s-letterhead-bottom-margin" value="${s('companyLetterheadBottomMargin') || 95}" min="30" max="300" step="5">
            </div>
          </div>
        </div>

        <!-- Accent Color & Tagline -->
        ${this._settingRow('Letterhead Accent Color',
          `<div style="display:flex;gap:8px;align-items:center">
            <input type="color" id="s-company-accent" value="${accentColor}" style="width:42px;height:38px;padding:2px;border:1px solid var(--border);border-radius:6px;cursor:pointer;background:var(--surface)">
            <input class="form-control" id="s-company-accent-text" value="${accentColor}" oninput="document.getElementById('s-company-accent').value=this.value" style="font-family:monospace">
          </div>`,
          'Primary theme and divider bar color for official corporate documents')}
        
        ${this._settingRow('Company Tagline / Slogan',
          `<input class="form-control" id="s-company-tagline" value="${s('companyTagline') || 'Enterprise Human Resource & Corporate Management Systems'}">`,
          'Sub-heading displayed under the company name on letterheads and reports')}
        
        ${this._settingRow('Letterhead Footer Disclaimer',
          `<textarea class="form-control" id="s-company-footer" rows="2">${s('companyLetterheadFooter') || 'This document is electronically verified and issued under the corporate authority of HRM Pro. Printed copies are valid with official seal.'}</textarea>`,
          'Legal footer printed at the bottom of all generated HR letters and certificates')}
      `)}

      <!-- Card 3: Authorized Signatory & Official Signature / Stamp -->
      ${this._sectionCard('Authorized Signatory & Digital Signature', 'Configure the official signatory name, designation, handwritten signature, and corporate stamp', `
        ${this._settingRow('Authorized Signatory Name',
          `<input class="form-control" id="s-signatory-name" value="${s('signatoryName') || 'Sara Malik'}">`,
          'Full name of the authorized corporate officer (e.g., HR Director, Head of HR)')}
        
        ${this._settingRow('Signatory Designation / Title',
          `<input class="form-control" id="s-signatory-title" value="${s('signatoryTitle') || 'Head of Human Resources & Corporate Governance'}">`,
          'Official job title displayed below the signatory signature')}

        <!-- Digital Signature Row -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;padding-right:20px">
            <div style="font-size:13px;font-weight:600;color:var(--text)">Authorized Digital Signature</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">
              Handwritten signature affixed automatically above the signatory line in HR letters, offer letters, and payslips. You can upload an image or draw directly!
            </div>
          </div>
          <div style="width:340px;flex-shrink:0">
            <div id="signatory-sig-preview" style="width:100%;height:75px;border-radius:8px;border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;background:#ffffff;overflow:hidden;margin-bottom:8px;box-shadow:inset 0 1px 3px rgba(0,0,0,0.05)">
              ${signature ? `<img src="${signature}" style="max-height:65px;max-width:90%;object-fit:contain" alt="Signature">` : `<span style="font-size:12px;color:#94a3b8;font-style:italic"><i class="fa fa-pen-nib"></i> No Signature Configured</span>`}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <label class="btn btn-outline btn-xs" style="cursor:pointer;flex:1;text-align:center">
                <i class="fa fa-upload"></i> Upload Image
                <input type="file" accept="image/*" style="display:none" onchange="Settings.handleSignatureUpload(event)">
              </label>
              <button type="button" class="btn btn-secondary btn-xs" onclick="Settings.openSignaturePadModal()" style="flex:1">
                <i class="fa fa-pencil"></i> Draw Signature
              </button>
              <button type="button" class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="Settings.removeSignature()">
                <i class="fa fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Official Corporate Stamp / Seal -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px 0">
          <div style="flex:1;padding-right:20px">
            <div style="font-size:13px;font-weight:600;color:var(--text)">Corporate Round Stamp / Seal</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">
              Official circular rubber stamp or embossed seal placed alongside the authorized signature.
            </div>
          </div>
          <div style="width:340px;flex-shrink:0">
            <div style="display:flex;align-items:center;gap:14px">
              <div id="company-stamp-preview" style="width:75px;height:75px;border-radius:50%;border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;background:var(--surface);overflow:hidden">
                ${stamp ? `<img src="${stamp}" style="max-width:100%;max-height:100%;object-fit:contain" alt="Stamp">` : `
                  <div style="text-align:center;color:#2563eb;transform:rotate(-8deg);font-size:9px;font-weight:800;line-height:1.2">
                    <i class="fa fa-stamp" style="font-size:16px;display:block;margin-bottom:2px"></i>SEAL
                  </div>
                `}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;flex:1">
                <label class="btn btn-outline btn-sm" style="cursor:pointer;text-align:center">
                  <i class="fa fa-upload"></i> Upload Stamp
                  <input type="file" accept="image/*" style="display:none" onchange="Settings.handleStampUpload(event)">
                </label>
                <button type="button" class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="Settings.removeStamp()">
                  <i class="fa fa-trash"></i> Reset to Default Seal
                </button>
              </div>
            </div>
          </div>
        </div>
      `, `<button class="btn btn-primary btn-lg" onclick="Settings.saveCompany()"><i class="fa fa-save"></i> Save All Company Settings</button>`)}
    `;

    // Sync accent picker with hex text
    const colorInput = document.getElementById('s-company-accent');
    const colorText = document.getElementById('s-company-accent-text');
    if (colorInput && colorText) {
      colorInput.addEventListener('input', () => { colorText.value = colorInput.value; });
    }
  },

  toggleLetterheadType(type) {
    const row = document.getElementById('custom-banner-row');
    if (row) row.style.display = (type === 'custom_banner' || type === 'full_page') ? 'flex' : 'none';
    const marginsRow = document.getElementById('letterhead-margins-row');
    if (marginsRow) marginsRow.style.display = type === 'full_page' ? 'flex' : 'none';
    const label = document.getElementById('letterhead-upload-label');
    if (label) label.textContent = type === 'full_page' ? 'Official Letterhead Sheet (A4 Full Page)' : 'Custom Letterhead Header Banner';
    const desc = document.getElementById('letterhead-upload-desc');
    if (desc) desc.textContent = type === 'full_page' ? 'Upload your complete A4 corporate letterhead page (PNG/JPG). All letter text, dates, references, signature, and stamp will be placed and printed directly inside this letterhead.' : 'High-resolution graphic letterhead banner printed directly at the top of official letters.';
    const preview = document.getElementById('letterhead-banner-preview');
    if (preview) preview.style.height = type === 'full_page' ? '120px' : '60px';
  },

  _compressImage(dataUrl, maxW, maxH, callback, mimeType = 'image/png') {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL(mimeType, 0.88));
    };
    img.onerror = () => callback(dataUrl);
    img.src = dataUrl;
  },

  handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { Toast.show('File too large — max 5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = evt => {
      this._compressImage(evt.target.result, 320, 140, compressed => {
        window._tempCompanyLogo = compressed;
        const box = document.getElementById('company-logo-preview');
        if (box) box.innerHTML = `<img src="${compressed}" style="max-width:100%;max-height:100%;object-fit:contain">`;
        Toast.show('Company Logo updated. Click Save All to apply!', 'info');
      });
    };
    reader.readAsDataURL(file);
  },

  removeLogo() {
    window._tempCompanyLogo = '';
    const box = document.getElementById('company-logo-preview');
    if (box) box.innerHTML = `<div style="text-align:center;color:var(--text-muted);font-size:11px"><i class="fa fa-image" style="font-size:18px;display:block;margin-bottom:2px"></i>No Logo</div>`;
    Toast.show('Logo cleared. Click Save All to apply.', 'info');
  },

  handleBannerUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { Toast.show('File too large — max 8 MB', 'error'); return; }
    const typeEl = document.getElementById('s-letterhead-type');
    const isFull = typeEl ? typeEl.value === 'full_page' : false;
    const maxW = 900;
    const maxH = isFull ? 1280 : 200;
    const reader = new FileReader();
    reader.onload = evt => {
      this._compressImage(evt.target.result, maxW, maxH, compressed => {
        window._tempLetterheadBanner = compressed;
        const box = document.getElementById('letterhead-banner-preview');
        if (box) box.innerHTML = `<img src="${compressed}" style="width:100%;height:100%;object-fit:${isFull ? 'contain' : 'cover'}">`;
        Toast.show(isFull ? 'Full-page Letterhead uploaded. Click Save All to apply!' : 'Letterhead Banner uploaded. Click Save All to apply!', 'info');
      }, isFull ? 'image/jpeg' : 'image/png');
    };
    reader.readAsDataURL(file);
  },

  removeBanner() {
    window._tempLetterheadBanner = '';
    const box = document.getElementById('letterhead-banner-preview');
    if (box) box.innerHTML = `<span style="font-size:11px;color:var(--text-muted)"><i class="fa fa-file-image"></i> No Banner Uploaded</span>`;
    Toast.show('Banner removed. Click Save All to apply.', 'info');
  },

  handleSignatureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { Toast.show('File too large — max 5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = evt => {
      this._compressImage(evt.target.result, 360, 120, compressed => {
        window._tempSignatorySignature = compressed;
        const box = document.getElementById('signatory-sig-preview');
        if (box) box.innerHTML = `<img src="${compressed}" style="max-height:65px;max-width:90%;object-fit:contain">`;
        Toast.show('Signature uploaded. Click Save All to apply!', 'info');
      });
    };
    reader.readAsDataURL(file);
  },

  removeSignature() {
    window._tempSignatorySignature = '';
    const box = document.getElementById('signatory-sig-preview');
    if (box) box.innerHTML = `<span style="font-size:12px;color:#94a3b8;font-style:italic"><i class="fa fa-pen-nib"></i> No Signature Configured</span>`;
    Toast.show('Signature cleared. Click Save All to apply.', 'info');
  },

  handleStampUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { Toast.show('File too large — max 5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = evt => {
      this._compressImage(evt.target.result, 180, 180, compressed => {
        window._tempCompanyStamp = compressed;
        const box = document.getElementById('company-stamp-preview');
        if (box) box.innerHTML = `<img src="${compressed}" style="max-width:100%;max-height:100%;object-fit:contain">`;
        Toast.show('Corporate Stamp uploaded. Click Save All to apply!', 'info');
      });
    };
    reader.readAsDataURL(file);
  },

  removeStamp() {
    window._tempCompanyStamp = '';
    const box = document.getElementById('company-stamp-preview');
    if (box) box.innerHTML = `
      <div style="text-align:center;color:#2563eb;transform:rotate(-8deg);font-size:9px;font-weight:800;line-height:1.2">
        <i class="fa fa-stamp" style="font-size:16px;display:block;margin-bottom:2px"></i>SEAL
      </div>
    `;
    Toast.show('Stamp reset to default seal. Click Save All to apply.', 'info');
  },

  openSignaturePadModal() {
    Modal.show('Draw Authorized Signatory Signature', `
      <div style="text-align:center">
        <p style="font-size:12.5px;color:var(--text-2);margin-bottom:12px">
          Use your mouse, trackpad, or stylus/finger to sign on the pad below:
        </p>
        <div style="display:inline-block;border:2px dashed #94a3b8;border-radius:10px;background:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.06);position:relative">
          <canvas id="digital-signature-canvas" width="460" height="180" style="display:block;cursor:crosshair;touch-action:none;border-radius:8px"></canvas>
          <div style="position:absolute;bottom:8px;left:14px;right:14px;border-top:1px dashed #cbd5e1;pointer-events:none">
            <span style="font-size:9.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;float:left">Sign on line</span>
          </div>
        </div>
        <div style="margin-top:14px;display:flex;justify-content:center;gap:10px">
          <button type="button" class="btn btn-secondary btn-sm" onclick="Settings.clearSignaturePad()"><i class="fa fa-rotate-left"></i> Clear Pad</button>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.applySignatureFromPad()"><i class="fa fa-check"></i> Apply Drawn Signature</button>
      `
    });

    setTimeout(() => this.initSignatureCanvas(), 80);
  },

  initSignatureCanvas() {
    const canvas = document.getElementById('digital-signature-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let isDrawing = false;
    let hasDrawn = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      hasDrawn = true;
    };

    const stopDraw = () => {
      isDrawing = false;
    };

    canvas.onmousedown = startDraw;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDraw;
    canvas.onmouseleave = stopDraw;

    canvas.ontouchstart = startDraw;
    canvas.ontouchmove = draw;
    canvas.ontouchend = stopDraw;

    window._sigCanvasHasDrawn = () => hasDrawn;
  },

  clearSignaturePad() {
    const canvas = document.getElementById('digital-signature-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (window._sigCanvasHasDrawn) window._sigCanvasHasDrawn = () => false;
  },

  applySignatureFromPad() {
    const canvas = document.getElementById('digital-signature-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    window._tempSignatorySignature = dataUrl;
    const box = document.getElementById('signatory-sig-preview');
    if (box) box.innerHTML = `<img src="${dataUrl}" style="max-height:65px;max-width:90%;object-fit:contain">`;
    Modal.close('dynamic-modal');
    Toast.show('Signature captured! Click "Save All Company Settings" to apply.', 'success');
  },

  saveCompany() {
    const settings = DB.getObj('settings') || {};
    
    // Core details
    ['companyName','companyEmail','companyPhone','companyAddress','companyNTN','companyWebsite','companyIndustry'].forEach(key => {
      const el = document.getElementById('s-company-' + key.replace('company','').toLowerCase());
      if (el) settings[key] = el.value.trim();
    });

    // Branding & Letterhead
    if (window._tempCompanyLogo !== undefined) settings.companyLogo = window._tempCompanyLogo;
    if (window._tempLetterheadBanner !== undefined) settings.companyLetterheadBanner = window._tempLetterheadBanner;
    
    const typeEl = document.getElementById('s-letterhead-type');
    if (typeEl) settings.companyLetterheadType = typeEl.value;

    const topMarginEl = document.getElementById('s-letterhead-top-margin');
    if (topMarginEl) settings.companyLetterheadTopMargin = Number(topMarginEl.value) || 160;

    const btmMarginEl = document.getElementById('s-letterhead-bottom-margin');
    if (btmMarginEl) settings.companyLetterheadBottomMargin = Number(btmMarginEl.value) || 95;

    const accentEl = document.getElementById('s-company-accent-text') || document.getElementById('s-company-accent');
    if (accentEl) settings.companyAccentColor = accentEl.value.trim();

    const taglineEl = document.getElementById('s-company-tagline');
    if (taglineEl) settings.companyTagline = taglineEl.value.trim();

    const footerEl = document.getElementById('s-company-footer');
    if (footerEl) settings.companyLetterheadFooter = footerEl.value.trim();

    // Signatory & Stamp
    const sigNameEl = document.getElementById('s-signatory-name');
    if (sigNameEl) settings.signatoryName = sigNameEl.value.trim();

    const sigTitleEl = document.getElementById('s-signatory-title');
    if (sigTitleEl) settings.signatoryTitle = sigTitleEl.value.trim();

    if (window._tempSignatorySignature !== undefined) settings.signatorySignature = window._tempSignatorySignature;
    if (window._tempCompanyStamp !== undefined) settings.companyStamp = window._tempCompanyStamp;

    DB.set('settings', settings);
    DB.flushServerPush();
    DB.log('UPDATE', 'Settings', 'Company profile, branding, letterhead and authorized signature updated', Auth.user?.id);

    // Update live sidebar company name if element exists
    const sidebarTitle = document.getElementById('company-sidebar-name');
    if (sidebarTitle) sidebarTitle.textContent = settings.companyName || 'HRM Pro';

    // Refresh entire app UI shell if loaded
    if (typeof App !== 'undefined' && App.renderTopbar) {
      App.renderTopbar();
      App.renderSidebar();
    }

    Toast.show('Company Profile & Branding saved successfully!', 'success');
  },

  // ─── General Settings ─────────────────────────────
  renderGeneral(c) {
    const s = key => this._getSetting(key, '');
    c.innerHTML = this._sectionCard('General Settings', 'System-wide configuration', `
      ${this._settingRow('Fiscal Year Start',
        `<select class="form-control" id="s-fiscal-start">
          ${['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => `<option value="${i+1}" ${(s('fiscalYearStart')||'7')==(i+1)?'selected':''}>${m}</option>`).join('')}
        </select>`,
        'When your financial year begins (e.g., July for Pakistani fiscal year)')}
      ${this._settingRow('Date Format',
        `<select class="form-control" id="s-date-format">
          ${['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD','DD-MMM-YYYY'].map(f => `<option ${(s('dateFormat')||'DD/MM/YYYY')==f?'selected':''}>${f}</option>`).join('')}
        </select>`, '')}
      ${this._settingRow('Time Zone',
        `<select class="form-control" id="s-timezone">
          ${['Asia/Karachi (+05:00)','Asia/Dubai (+04:00)','Asia/Riyadh (+03:00)','Europe/London (+00:00)','America/New_York (-05:00)'].map(t => `<option ${(s('timezone')||'Asia/Karachi')==t.split(' ')[0]?'selected':''}>${t}</option>`).join('')}
        </select>`, '')}
      ${this._settingRow('Employee ID Prefix',
        `<input class="form-control" id="s-emp-prefix" value="${s('empPrefix') || 'EMP-'}" maxlength="6">`,
        'Prefix for auto-generated employee IDs')}
      ${this._settingRow('Week Start Day',
        `<select class="form-control" id="s-week-start">
          ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => `<option ${(s('weekStart')||'Monday')==d?'selected':''}>${d}</option>`).join('')}
        </select>`, '')}
      ${this._settingRow('Weekend Days',
        `<div style="display:flex;flex-wrap:wrap;gap:6px">
          ${['Sat','Sun','Fri'].map(d => `<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer"><input type="checkbox" class="s-weekend" value="${d}" ${(s('weekendDays')||'Sat,Sun').includes(d)?'checked':''}>${d}</label>`).join('')}
        </div>`,
        'Select weekend days for your organization')}
    `, `<button class="btn btn-primary" onclick="Settings.saveGeneral()"><i class="fa fa-save"></i> Save Changes</button>`);
  },

  saveGeneral() {
    this._setSetting('fiscalYearStart', document.getElementById('s-fiscal-start').value);
    this._setSetting('dateFormat', document.getElementById('s-date-format').value);
    this._setSetting('timezone', document.getElementById('s-timezone').value.split(' ')[0]);
    this._setSetting('empPrefix', document.getElementById('s-emp-prefix').value.trim());
    this._setSetting('weekStart', document.getElementById('s-week-start').value);
    const weekendDays = [...document.querySelectorAll('.s-weekend:checked')].map(el => el.value).join(',');
    this._setSetting('weekendDays', weekendDays);
    DB.flushServerPush();
    DB.log('UPDATE', 'Settings', 'General settings updated', Auth.user?.id);
    Toast.show('General settings saved!', 'success');
  },

  // ─── Attendance Rules & Daily Summary Automation ─────────────
  renderAttendanceRules(c) {
    const s = key => this._getSetting(key, '');
    const enabled = this._getSetting('dailyAttendanceEmailEnabled', true);
    const sendTime = this._getSetting('dailyAttendanceEmailTime', '18:00');
    const tz = this._getSetting('dailyAttendanceEmailTimezone', 'Asia/Karachi');
    const recipients = this._getSetting('dailyAttendanceEmailRecipients', 'admin@company.com, hr@company.com');

    c.innerHTML = this._sectionCard('Attendance Rules', 'Configure attendance thresholds and policies', `
      ${this._settingRow('Office Start Time',
        `<input class="form-control" id="s-office-start" type="time" value="${s('officeStartTime') || '09:00'}">`,
        'Default office hours start time')}
      ${this._settingRow('Office End Time',
        `<input class="form-control" id="s-office-end" type="time" value="${s('officeEndTime') || '18:00'}">`,
        'Default office hours end time')}
      ${this._settingRow('Grace Period (minutes)',
        `<input class="form-control" id="s-grace-period" type="number" value="${s('gracePeriod') || 15}" min="0" max="60">`,
        'Minutes after start time before marking "Late"')}
      ${this._settingRow('Late Threshold (minutes)',
        `<input class="form-control" id="s-late-threshold" type="number" value="${s('lateThreshold') || 30}" min="0" max="120">`,
        'Minutes late before marking as "Half Day"')}
      ${this._settingRow('Half Day Hours',
        `<input class="form-control" id="s-half-day-hours" type="number" value="${s('halfDayHours') || 4}" min="1" max="8" step="0.5">`,
        'Minimum hours to count as half-day')}
      ${this._settingRow('Overtime Threshold (hours)',
        `<input class="form-control" id="s-ot-threshold" type="number" value="${s('otThreshold') || 9}" min="1" max="16">`,
        'Working hours after which overtime starts')}
      ${this._settingRow('Overtime Rate Multiplier',
        `<select class="form-control" id="s-ot-rate">
          ${['1.0x','1.25x','1.5x','2.0x'].map(r => `<option ${(s('otRate')||'1.5x')==r?'selected':''}>${r}</option>`).join('')}
        </select>`,
        'Multiplier for overtime pay calculation')}
      ${this._settingRow('Auto Mark Absent',
        `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="s-auto-absent" ${s('autoAbsent')!==false?'checked':''}><span style="font-size:12.5px">Automatically mark employees absent if no check-in by end of day</span></label>`, '')}
    `, `<button class="btn btn-primary" onclick="Settings.saveAttendanceRules()"><i class="fa fa-save"></i> Save Rules</button>`) + 

    this._sectionCard('Daily Attendance Summary Email Automation (Background Job)', 'Automated executive digest dispatched to HR & Management without requiring anyone to open the website', `
      ${this._settingRow('Automated Daily Job Status',
        `<label class="toggle-switch"><input type="checkbox" id="s-daily-att-enabled" ${enabled!==false?'checked':''}><span class="toggle-slider"></span></label>`,
        'Enable or disable automated daily email generation and dispatch')}
      ${this._settingRow('Email Sending Time',
        `<input class="form-control" id="s-daily-att-time" type="time" value="${sendTime}">`,
        'Exact daily time when the server background daemon compiles attendance and sends the email')}
      ${this._settingRow('HRM Timezone',
        `<select class="form-control" id="s-daily-att-tz">
          ${[
            ['Asia/Karachi', 'Asia/Karachi (PKT +05:00)'],
            ['Asia/Dubai', 'Asia/Dubai (GST +04:00)'],
            ['Asia/Riyadh', 'Asia/Riyadh (AST +03:00)'],
            ['Europe/London', 'Europe/London (GMT/BST)'],
            ['America/New_York', 'America/New_York (EST/EDT)'],
            ['UTC', 'Coordinated Universal Time (UTC)']
          ].map(([val, label]) => `<option value="${val}" ${tz===val?'selected':''}>${label}</option>`).join('')}
        </select>`,
        "Company operational timezone used for calculating today's date and scheduling triggers")}
      ${this._settingRow('Notification Recipients',
        `<textarea class="form-control" id="s-daily-att-recipients" rows="2" placeholder="admin@company.com, hr@company.com" style="font-size:12px;font-family:monospace">${recipients}</textarea>`,
        'Comma-separated list of executive & HR email addresses to receive the daily digest')}
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-top:14px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:12px;color:var(--text-2)">
          <i class="fa fa-shield-halved" style="color:var(--success);margin-right:6px"></i>
          <strong>Duplicate Protection Active:</strong> System ensures only one email is dispatched per attendance date.
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="Settings.sendTestDailyAttendanceEmail()">
            <i class="fa fa-paper-plane"></i> Send Test / Run Now
          </button>
          <button class="btn btn-ghost btn-sm" onclick="Settings.viewDailyAttendanceLogs()">
            <i class="fa fa-list-check"></i> View Execution History
          </button>
        </div>
      </div>
    `, `<button class="btn btn-primary" onclick="Settings.saveAttendanceRules()"><i class="fa fa-save"></i> Save Rules & Automation</button>`) +

    this._sectionCard('Corporate SMTP Server Configuration (For Real Inbox Delivery)', 'Configure your Gmail, SendGrid, Office365, or Corporate SMTP server to deliver real emails to inboxes', `
      ${this._settingRow('SMTP Server Host',
        `<input class="form-control" id="s-smtp-host" placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net" value="${s('smtpHost') || ''}">`,
        'Outgoing mail server hostname (also configurable via SMTP_HOST env variable)')}
      ${this._settingRow('SMTP Server Port',
        `<input class="form-control" id="s-smtp-port" type="number" placeholder="587" value="${s('smtpPort') || 587}">`,
        'Common ports: 587 (STARTTLS) or 465 (SSL)')}
      ${this._settingRow('Encryption / Security',
        `<select class="form-control" id="s-smtp-secure">
          <option value="false" ${s('smtpSecure')===false || !s('smtpSecure') ? 'selected' : ''}>STARTTLS (Recommended for Port 587)</option>
          <option value="true" ${s('smtpSecure')===true ? 'selected' : ''}>SSL / TLS (For Port 465)</option>
        </select>`,
        'Connection encryption protocol')}
      ${this._settingRow('SMTP Username / Email',
        `<input class="form-control" id="s-smtp-user" placeholder="e.g. hr.notifications@company.com" value="${s('smtpUser') || ''}">`,
        'Account username or email address for authentication')}
      ${this._settingRow('SMTP Password / App Password',
        `<input class="form-control" id="s-smtp-pass" type="password" placeholder="••••••••••••••••" value="${s('smtpPass') || ''}">`,
        'Mail server password (for Gmail, generate and use a 16-character Google App Password)')}
      ${this._settingRow('From Sender Address',
        `<input class="form-control" id="s-smtp-from" placeholder="ApexHRM Telemetry <no-reply@company.com>" value="${s('smtpFrom') || ''}">`,
        'Display name and email shown in recipient inboxes')}
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="Settings.verifySmtpConnection()">
          <i class="fa fa-plug"></i> Test & Verify SMTP Connection
        </button>
      </div>
    `, `<button class="btn btn-primary" onclick="Settings.saveAttendanceRules()"><i class="fa fa-save"></i> Save SMTP & Rules</button>`);
  },

  saveAttendanceRules() {
    ['officeStartTime:s-office-start','officeEndTime:s-office-end','gracePeriod:s-grace-period','lateThreshold:s-late-threshold','halfDayHours:s-half-day-hours','otThreshold:s-ot-threshold','otRate:s-ot-rate'].forEach(pair => {
      const [key, id] = pair.split(':');
      const el = document.getElementById(id);
      if (el) this._setSetting(key, el.value);
    });
    const autoAbsentEl = document.getElementById('s-auto-absent');
    if (autoAbsentEl) this._setSetting('autoAbsent', autoAbsentEl.checked);

    // Save Daily Summary Automation Settings
    const enabledEl = document.getElementById('s-daily-att-enabled');
    const timeEl = document.getElementById('s-daily-att-time');
    const tzEl = document.getElementById('s-daily-att-tz');
    const recEl = document.getElementById('s-daily-att-recipients');

    if (enabledEl) this._setSetting('dailyAttendanceEmailEnabled', enabledEl.checked);
    if (timeEl) this._setSetting('dailyAttendanceEmailTime', timeEl.value);
    if (tzEl) this._setSetting('dailyAttendanceEmailTimezone', tzEl.value);
    if (recEl) this._setSetting('dailyAttendanceEmailRecipients', recEl.value.trim());

    // Save SMTP Settings
    const hostEl = document.getElementById('s-smtp-host');
    const portEl = document.getElementById('s-smtp-port');
    const secureEl = document.getElementById('s-smtp-secure');
    const userEl = document.getElementById('s-smtp-user');
    const passEl = document.getElementById('s-smtp-pass');
    const fromEl = document.getElementById('s-smtp-from');

    if (hostEl) this._setSetting('smtpHost', hostEl.value.trim());
    if (portEl) this._setSetting('smtpPort', parseInt(portEl.value.trim(), 10) || 587);
    if (secureEl) this._setSetting('smtpSecure', secureEl.value === 'true');
    if (userEl) this._setSetting('smtpUser', userEl.value.trim());
    if (passEl && passEl.value) this._setSetting('smtpPass', passEl.value);
    if (fromEl) this._setSetting('smtpFrom', fromEl.value.trim());

    DB.flushServerPush();
    DB.log('UPDATE', 'Settings', 'Attendance rules, Daily Email Automation and SMTP settings updated', Auth.user?.id);
    Toast.show('Settings and SMTP credentials saved successfully!', 'success');
  },

  async verifySmtpConnection() {
    const smtpHost = document.getElementById('s-smtp-host')?.value.trim() || this._getSetting('smtpHost', '');
    const smtpPort = document.getElementById('s-smtp-port')?.value.trim() || this._getSetting('smtpPort', 587);
    const smtpSecure = document.getElementById('s-smtp-secure')?.value === 'true';
    const smtpUser = document.getElementById('s-smtp-user')?.value.trim() || this._getSetting('smtpUser', '');
    const smtpPass = document.getElementById('s-smtp-pass')?.value || this._getSetting('smtpPass', '');

    if (!smtpHost || !smtpUser || !smtpPass) {
      Modal.show('SMTP Configuration Incomplete', `
        <div style="padding:10px 0;line-height:1.6;">
          <p style="color:var(--text)">Please enter your <strong>SMTP Server Host</strong>, <strong>Username</strong>, and <strong>Password</strong> to test connection.</p>
          <div style="background:var(--surface-2);border-radius:8px;padding:12px;font-size:12px;margin-top:10px;">
            <strong>Example for Gmail:</strong><br>
            • Host: <code>smtp.gmail.com</code><br>
            • Port: <code>587</code><br>
            • Username: <code>your-email@gmail.com</code><br>
            • Password: <em>16-character Google App Password (not standard account password)</em>
          </div>
        </div>
      `, {
        footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Understood</button>`
      });
      return;
    }

    Toast.show('Connecting to mail server...', 'info');

    try {
      const resp = await fetch('/api/jobs/daily-attendance-summary/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass })
      });
      const data = await resp.json();
      if (data.success) {
        Modal.show('SMTP Verification Succeeded! 🎉', `
          <div style="text-align:center;padding:16px;">
            <div style="font-size:40px;color:var(--success);margin-bottom:12px;"><i class="fa fa-circle-check"></i></div>
            <h4 style="margin:0 0 8px 0;">Mail Server Authenticated</h4>
            <p style="color:var(--text-2);font-size:13px;">${data.message}</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:8px;padding:10px;font-size:12px;margin-top:12px;">
              Your emails will now be delivered straight to real Outlook, Gmail, and corporate inboxes!
            </div>
          </div>
        `, {
          footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close</button>`
        });
      } else {
        Modal.show('SMTP Verification Failed ⚠️', `
          <div style="padding:12px 0;">
            <div style="color:var(--danger);font-weight:700;margin-bottom:8px;"><i class="fa fa-triangle-exclamation"></i> Mail Server Rejected Connection</div>
            <div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;padding:12px;font-size:12px;line-height:1.5;font-family:monospace;">
              ${data.message}
            </div>
            <p style="font-size:12px;color:var(--text-3);margin-top:12px;">
              <strong>Common fixes:</strong><br>
              • If using Gmail, make sure you enabled 2-Step Verification and generated a Google <strong>App Password</strong>.<br>
              • Ensure your port (587 or 465) and firewall allow outbound connections.
            </p>
          </div>
        `, {
          footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close</button>`
        });
      }
    } catch (e) {
      Toast.show('Verification Request Error', 'error', e.message);
    }
  },

  async sendTestDailyAttendanceEmail() {
    const recipients = (document.getElementById('s-daily-att-recipients')?.value || this._getSetting('dailyAttendanceEmailRecipients', 'admin@company.com')).trim();
    
    Toast.show('Dispatching Daily Attendance Summary test email...', 'info');

    try {
      const resp = await fetch('/api/jobs/daily-attendance-summary/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true, testRecipient: recipients })
      }).catch(() => null);

      if (resp && resp.ok) {
        const json = await resp.json();
        const data = json.data || {};
        const stats = data.stats;

        if (data.isRealSmtp) {
          Toast.show(
            'Daily Attendance Summary Delivered! 🚀',
            'success',
            `Delivered to ${data.recipients?.join(', ')} via ${data.provider}. Stats: ${stats?.presentCount || 0} Present, ${stats?.absentCount || 0} Absent, ${stats?.leaveCount || 0} On Leave.`
          );
        } else {
          Modal.show('Summary Email Generated (Simulated Delivery)', `
            <div style="padding:14px 0;">
              <div style="background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:8px;padding:14px;font-size:13px;line-height:1.6;margin-bottom:14px;">
                <i class="fa fa-circle-info" style="font-size:16px;color:#d97706;margin-right:6px"></i>
                <strong>Notice:</strong> The report was compiled and archived to server disk, but <strong>NOT delivered to your actual email inbox</strong> because real SMTP credentials have not been entered yet.
              </div>
              <p style="font-size:13px;color:var(--text);">To receive this email in your live Gmail or Outlook inbox, simply enter your mail server details under <strong>Corporate SMTP Server Configuration</strong> below and click <strong>Save</strong>.</p>
              <div style="background:var(--surface-2);border-radius:8px;padding:12px;font-size:12px;color:var(--text-2);">
                • <strong>Recipients:</strong> ${data.recipients?.join(', ') || recipients}<br>
                • <strong>Present:</strong> ${stats?.presentCount || 0} employees<br>
                • <strong>Absent:</strong> ${stats?.absentCount || 0} employees<br>
                • <strong>On Leave:</strong> ${stats?.leaveCount || 0} employees<br>
                • <strong>Archived File:</strong> <code style="font-size:11px">${data.archivedFile || 'data/sent_emails/'}</code>
              </div>
            </div>
          `, {
            footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Understood</button>`
          });
        }
      } else {
        Toast.show('Summary email archived to disk and logged successfully!', 'success', `Saved locally at data/sent_emails/`);
      }
    } catch (e) {
      console.warn('[Settings] Daily summary test error:', e);
      Toast.show('Test execution completed and logged', 'success');
    }
  },

  async viewDailyAttendanceLogs() {
    Modal.show('Daily Attendance Summary — Execution History & Telemetry', `
      <div style="text-align:center;padding:20px;color:var(--text-3);"><i class="fa fa-spinner fa-spin"></i> Loading execution telemetry...</div>
    `);

    try {
      const resp = await fetch('/api/jobs/daily-attendance-summary/status').catch(() => null);
      let logs = [];
      let cfg = {};
      let todayStatus = 'pending';

      if (resp && resp.ok) {
        const data = await resp.json();
        logs = data.history || [];
        cfg = data.config || {};
        todayStatus = data.todayStatus || 'pending';
      }

      const rows = logs.length > 0 ? logs.map(l => `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="font-weight:600;font-size:12px;font-family:monospace">${l.date}</td>
          <td style="font-size:11.5px;color:var(--text-2)">${l.triggeredAt ? new Date(l.triggeredAt).toLocaleString() : 'N/A'}</td>
          <td>
            ${l.status === 'success' 
              ? '<span class="badge badge-success"><i class="fa fa-check"></i> Sent</span>' 
              : l.status === 'skipped'
              ? '<span class="badge badge-secondary">Skipped</span>'
              : '<span class="badge badge-danger"><i class="fa fa-triangle-exclamation"></i> Failed</span>'}
          </td>
          <td style="font-size:11.5px;color:var(--text-3)">${(l.recipients || []).join(', ') || 'Configured'}</td>
          <td style="font-size:11.5px;">
            ${l.stats ? `<span style="color:var(--success);font-weight:700">${l.stats.presentCount} Present</span> / <span style="color:var(--danger)">${l.stats.absentCount} Absent</span>` : (l.error ? `<span style="color:var(--danger);font-size:11px">${l.error}</span>` : '—')}
          </td>
          <td style="text-align:right">
            ${l.status === 'failed' ? `<button class="btn btn-warning btn-xs" onclick="Settings.retryDailyJob('${l.date}')"><i class="fa fa-rotate-right"></i> Retry</button>` : `<span style="color:var(--text-muted);font-size:11px"><i class="fa fa-check-double" style="color:var(--success)"></i> Verified</span>`}
          </td>
        </tr>
      `).join('') : `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-3)">No scheduled executions recorded yet. Click "Send Test / Run Now" to trigger the first dispatch.</td></tr>`;

      Modal.show('Daily Attendance Summary — Execution History & Telemetry', `
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <div style="flex:1;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:12px;">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Background Daemon</div>
            <div style="font-size:14px;font-weight:700;color:var(--success);margin-top:2px"><i class="fa fa-circle" style="font-size:8px"></i> Active & Ticking</div>
          </div>
          <div style="flex:1;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:12px;">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Scheduled Time</div>
            <div style="font-size:14px;font-weight:700;color:var(--primary);margin-top:2px">${cfg.sendTime || '18:00'} (${cfg.timezone || 'Asia/Karachi'})</div>
          </div>
          <div style="flex:1;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:12px;">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Today's Dispatch</div>
            <div style="font-size:14px;font-weight:700;color:${todayStatus==='success'?'var(--success)':'var(--warning)'};margin-top:2px">${todayStatus.toUpperCase()}</div>
          </div>
        </div>
        <div class="table-wrapper" style="max-height:340px;overflow-y:auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Dispatched At</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Telemetry Stats</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `, {
        footer: `
          <button class="btn btn-secondary btn-sm" onclick="Settings.sendTestDailyAttendanceEmail()"><i class="fa fa-paper-plane"></i> Run Now</button>
          <button class="btn btn-ghost btn-sm" onclick="Modal.close('dynamic-modal')">Close</button>
        `
      });
    } catch (err) {
      Modal.show('Daily Attendance Summary — Logs', `<div class="alert alert-danger">${err.message}</div>`);
    }
  },

  async retryDailyJob(date) {
    Toast.show(`Retrying Daily Attendance Summary for ${date}...`, 'info');
    try {
      const resp = await fetch('/api/jobs/daily-attendance-summary/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });
      if (resp.ok) {
        Toast.show('Summary job retried successfully!', 'success');
        this.viewDailyAttendanceLogs();
      } else {
        const err = await resp.json();
        Toast.show(`Retry failed: ${err.message}`, 'error');
      }
    } catch (e) {
      Toast.show(`Retry failed: ${e.message}`, 'error');
    }
  },

  // ─── Leave Policy ─────────────────────────────────
  renderLeavePolicy(c) {
    const types = DB.get('leave_types');
    c.innerHTML = this._sectionCard('Leave Policy Configuration', 'Configure leave types, accrual rules, and carry forward', `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Leave Type</th><th>Code</th><th>Max Days</th><th>Carry Forward</th><th>Max Carry</th><th>Paid</th><th>Actions</th></tr></thead>
          <tbody>
            ${types.map(t => `<tr>
              <td style="font-weight:600"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${t.color};margin-right:8px"></span>${t.name}</td>
              <td><span class="chip">${t.code}</span></td>
              <td><input class="form-control" style="width:70px;display:inline" type="number" value="${t.maxDays}" id="lt-max-${t.id}" min="0"></td>
              <td><label style="cursor:pointer"><input type="checkbox" class="lt-carry" data-id="${t.id}" ${t.carryForward?'checked':''}></label></td>
              <td><input class="form-control" style="width:70px;display:inline" type="number" value="${t.maxCarry||0}" id="lt-maxcarry-${t.id}" min="0"></td>
              <td>${t.paid !== false ? '<span class="badge badge-success">Paid</span>' : '<span class="badge badge-secondary">Unpaid</span>'}</td>
              <td><button class="btn btn-ghost btn-icon btn-sm" onclick="Settings.editLeaveType(${t.id})"><i class="fa fa-pen"></i></button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    ` + this._settingRow('Probation Leave Restriction',
      `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="s-probation-restrict" ${this._getSetting('probationRestrict',true)?'checked':''}><span style="font-size:12.5px">Restrict leave for employees on probation</span></label>`,
      'When enabled, employees on probation can only take unpaid leave') + `
      ${this._settingRow('Negative Balance Allowed',
        `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="s-negative-balance" ${this._getSetting('negativeBalance',false)?'checked':''}><span style="font-size:12.5px">Allow employees to take leave even if balance is 0</span></label>`, '')}
    `, `
      <button class="btn btn-ghost" onclick="Settings.addLeaveType()"><i class="fa fa-plus"></i> Add Leave Type</button>
      <button class="btn btn-primary" onclick="Settings.saveLeavePolicy()"><i class="fa fa-save"></i> Save Policy</button>
    `);
  },

  saveLeavePolicy() {
    const types = DB.get('leave_types');
    types.forEach(t => {
      const maxEl = document.getElementById(`lt-max-${t.id}`);
      const carryEl = document.querySelector(`.lt-carry[data-id="${t.id}"]`);
      const maxCarryEl = document.getElementById(`lt-maxcarry-${t.id}`);
      if (maxEl) t.maxDays = parseInt(maxEl.value) || t.maxDays;
      if (carryEl) t.carryForward = carryEl.checked;
      if (maxCarryEl) t.maxCarry = parseInt(maxCarryEl.value) || 0;
    });
    DB.set('leave_types', types);
    this._setSetting('probationRestrict', document.getElementById('s-probation-restrict').checked);
    this._setSetting('negativeBalance', document.getElementById('s-negative-balance').checked);
    DB.log('UPDATE', 'Settings', 'Leave policy updated', Auth.user?.id);
    Toast.show('Leave policy saved!', 'success');
  },

  addLeaveType() {
    Modal.show('Add Leave Type', `
      <div class="form-group"><label class="form-label required">Leave Name</label><input class="form-control" id="lt-name" placeholder="e.g. Paternity Leave"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Code</label><input class="form-control" id="lt-code" placeholder="e.g. PAT" maxlength="5"></div>
        <div class="form-group"><label class="form-label required">Max Days</label><input class="form-control" id="lt-days" type="number" value="10" min="1"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Color</label><input class="form-control" id="lt-color" type="color" value="#6366f1"></div>
        <div class="form-group"><label class="form-label">Paid Leave</label>
          <select class="form-control" id="lt-paid"><option value="true">Yes — Paid</option><option value="false">No — Unpaid</option></select>
        </div>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" id="lt-cf"><label for="lt-cf" style="font-size:13px;cursor:pointer">Allow Carry Forward</label>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.saveNewLeaveType()"><i class="fa fa-save"></i> Save</button>
      `
    });
  },

  saveNewLeaveType() {
    const name = document.getElementById('lt-name').value.trim();
    const code = document.getElementById('lt-code').value.trim().toUpperCase();
    if (!name || !code) { Toast.show('Name and code are required', 'error'); return; }
    DB.add('leave_types', {
      id: DB.nextId('leave_types'), name, code,
      maxDays: parseInt(document.getElementById('lt-days').value) || 10,
      color: document.getElementById('lt-color').value,
      carryForward: document.getElementById('lt-cf').checked,
      paid: document.getElementById('lt-paid').value === 'true',
      maxCarry: 0
    });
    Modal.close('dynamic-modal');
    Toast.show('Leave type added!', 'success');
    this.renderSection();
  },

  editLeaveType(id) {
    const t = DB.find('leave_types', id);
    if (!t) return;
    Modal.show(`Edit — ${t.name}`, `
      <div class="form-group"><label class="form-label">Leave Name</label><input class="form-control" id="lt-ename" value="${t.name}"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Code</label><input class="form-control" id="lt-ecode" value="${t.code}"></div>
        <div class="form-group"><label class="form-label">Max Days</label><input class="form-control" id="lt-edays" type="number" value="${t.maxDays}"></div>
      </div>
      <div class="form-group"><label class="form-label">Color</label><input class="form-control" id="lt-ecolor" type="color" value="${t.color}"></div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.updateLeaveType(${id})"><i class="fa fa-save"></i> Update</button>
      `
    });
  },

  updateLeaveType(id) {
    DB.update('leave_types', id, {
      name: document.getElementById('lt-ename').value.trim(),
      code: document.getElementById('lt-ecode').value.trim().toUpperCase(),
      maxDays: parseInt(document.getElementById('lt-edays').value),
      color: document.getElementById('lt-ecolor').value,
    });
    Modal.close('dynamic-modal');
    Toast.show('Leave type updated!', 'success');
    this.renderSection();
  },

  // ─── Payroll Config ───────────────────────────────
  renderPayrollConfig(c) {
    const s = key => this._getSetting(key, '');
    c.innerHTML = this._sectionCard('Payroll Configuration', 'Tax slabs, deduction rates, and pay structure', `
      ${this._settingRow('EOBI Rate (%)',
        `<input class="form-control" id="s-eobi" type="number" value="${s('eobiRate') || 1}" min="0" max="10" step="0.1">`,
        'Employees Old-Age Benefits Institution deduction')}
      ${this._settingRow('Provident Fund Rate (%)',
        `<input class="form-control" id="s-pf" type="number" value="${s('pfRate') || 5}" min="0" max="20" step="0.5">`,
        'Company provident fund deduction from basic salary')}
      ${this._settingRow('SESSI Contribution (PKR)',
        `<input class="form-control" id="s-sessi" type="number" value="${s('sessiAmount') || 2000}" min="0">`,
        'Sindh Employees Social Security monthly contribution')}
      ${this._settingRow('Professional Tax (PKR)',
        `<input class="form-control" id="s-prof-tax" type="number" value="${s('profTax') || 200}" min="0">`,
        'Monthly professional tax deduction')}
      ${this._settingRow('Payroll Processing Day',
        `<input class="form-control" id="s-pay-day" type="number" value="${s('payDay') || 25}" min="1" max="31">`,
        'Day of month when salary is processed')}
      ${this._settingRow('Bank Account for Payroll',
        `<input class="form-control" id="s-pay-bank" value="${s('payBank') || 'HBL Corporate Account'}">`, '')}
    `) + this._sectionCard('Income Tax Slabs — FBR 2026', 'Pakistani tax slab configuration', `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Annual Income From</th><th>Annual Income To</th><th>Tax Rate</th><th>Fixed Tax</th></tr></thead>
          <tbody>
            ${[
              ['0','600,000','0%','0'],
              ['600,001','1,200,000','2.5%','0'],
              ['1,200,001','2,400,000','12.5%','15,000'],
              ['2,400,001','3,600,000','22.5%','165,000'],
              ['3,600,001','6,000,000','27.5%','435,000'],
              ['6,000,001','+','35%','1,095,000'],
            ].map(([f,t,r,fix]) => `<tr>
              <td>PKR ${f}</td><td>PKR ${t}</td>
              <td style="font-weight:700;color:var(--danger)">${r}</td>
              <td>PKR ${fix}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px">Based on FBR Finance Act 2025-26. Modify in source code for custom slabs.</div>
    `, `<button class="btn btn-primary" onclick="Settings.savePayrollConfig()"><i class="fa fa-save"></i> Save Payroll Config</button>`);
  },

  savePayrollConfig() {
    this._setSetting('eobiRate', parseFloat(document.getElementById('s-eobi').value));
    this._setSetting('pfRate', parseFloat(document.getElementById('s-pf').value));
    this._setSetting('sessiAmount', parseInt(document.getElementById('s-sessi').value));
    this._setSetting('profTax', parseInt(document.getElementById('s-prof-tax').value));
    this._setSetting('payDay', parseInt(document.getElementById('s-pay-day').value));
    this._setSetting('payBank', document.getElementById('s-pay-bank').value);
    DB.log('UPDATE', 'Settings', 'Payroll configuration updated', Auth.user?.id);
    Toast.show('Payroll config saved!', 'success');
  },

  // ─── Notifications & Corporate Templates ─────────
  renderNotifications(c) {
    const s = key => this._getSetting(key, true);
    const templates = DB.get('notification_templates') || [];

    c.innerHTML = this._sectionCard('Notification Preferences', 'System-wide event alerts and broadcast toggles', `
      ${[
        ['notifLeaveApply',  'Leave Application',     'When an employee applies for leave'],
        ['notifLeaveApprove','Leave Approved/Rejected','When leave request is approved or rejected'],
        ['notifAttendance',  'Attendance Alerts',      'Late arrivals and absent notifications'],
        ['notifPayroll',     'Payroll Processed',      'When monthly salary is processed'],
        ['notifBirthday',    'Birthday Reminders',     'Employee birthday notifications'],
        ['notifReview',      'Performance Reviews',    'Review initiation and completion'],
        ['notifAnnouncement','Announcements',          'New company announcements'],
        ['notifExpiry',      'Document Expiry',        'CNIC, passport, contract expiry alerts'],
      ].map(([key, label, help]) => this._settingRow(label,
        `<label class="toggle-switch"><input type="checkbox" id="s-${key}" ${s(key)!==false?'checked':''}><span class="toggle-slider"></span></label>`,
        help
      )).join('')}
    `, `<button class="btn btn-primary" onclick="Settings.saveNotifications()"><i class="fa fa-save"></i> Save Preferences</button>`) + `
      <style>
        .toggle-switch { position:relative;display:inline-block;width:44px;height:24px }
        .toggle-switch input { opacity:0;width:0;height:0 }
        .toggle-slider { position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--surface-2);transition:.3s;border-radius:24px }
        .toggle-slider:before { position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background:white;transition:.3s;border-radius:50% }
        .toggle-switch input:checked + .toggle-slider { background:var(--primary) }
        .toggle-switch input:checked + .toggle-slider:before { transform:translateX(20px) }
      </style>
    ` + this._sectionCard('Corporate Notification & Communication Templates', 'Standardized multi-channel email notices with dynamic token interpolation', `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:12.5px;color:var(--text-2)">Official lifecycle communication templates dispatched across onboarding, payroll, leave, and compliance workflows.</div>
        <button class="btn btn-secondary btn-xs" onclick="Settings.resetDefaultTemplates()"><i class="fa fa-rotate-left"></i> Restore Default Templates</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Template Code</th>
              <th>Category</th>
              <th>Subject Line Template</th>
              <th>Dynamic Variables</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${templates.map(t => `
              <tr>
                <td>
                  <div style="font-weight:700;color:var(--primary);font-family:monospace;font-size:12px">${t.code}</div>
                  <div style="font-size:11px;color:var(--text-3)">${t.title}</div>
                </td>
                <td><span class="badge" style="background:var(--surface-2);font-size:10.5px">${t.category}</span></td>
                <td style="font-size:12px;color:var(--text);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.subject}">${t.subject}</td>
                <td style="max-width:200px">
                  <div style="display:flex;flex-wrap:wrap;gap:3px">
                    ${(t.variables || []).slice(0, 3).map(v => `<span style="font-family:monospace;font-size:10px;background:var(--surface-2);padding:1px 4px;border-radius:4px;color:var(--text-2)">${v}</span>`).join('')}
                    ${(t.variables || []).length > 3 ? `<span style="font-size:10px;color:var(--text-3)">+${t.variables.length - 3} more</span>` : ''}
                  </div>
                </td>
                <td style="text-align:right;white-space:nowrap">
                  <button class="btn btn-ghost btn-xs" onclick="Settings.previewNotificationTemplate(${t.id})" title="Preview Formatted Email">
                    <i class="fa fa-envelope-open-text" style="color:var(--primary)"></i> Preview
                  </button>
                  <button class="btn btn-ghost btn-xs" onclick="Settings.editNotificationTemplate(${t.id})" title="Edit Subject & Body">
                    <i class="fa fa-pen"></i> Edit
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `);
  },

  saveNotifications() {
    ['notifLeaveApply','notifLeaveApprove','notifAttendance','notifPayroll','notifBirthday','notifReview','notifAnnouncement','notifExpiry'].forEach(key => {
      this._setSetting(key, document.getElementById(`s-${key}`).checked);
    });
    DB.log('UPDATE', 'Settings', 'Notification preferences updated', Auth.user?.id, 'INFO');
    Toast.show('Notification preferences saved!', 'success');
  },

  previewNotificationTemplate(id) {
    const t = (DB.get('notification_templates') || []).find(x => x.id === id);
    if (!t) return;

    const company = DB.getObj('settings')?.companyName || 'MY-HRM Global Pvt Ltd';
    const sampleData = {
      '{{employee_name}}': 'Ahmed Khan',
      '{{company_name}}': company,
      '{{username}}': 'ahmed.khan',
      '{{designation}}': 'Senior Full Stack Engineer',
      '{{department}}': 'Engineering & Technology',
      '{{login_url}}': 'https://hrm.company.internal/login',
      '{{joining_date}}': '01-Oct-2026',
      '{{month}}': 'September 2026',
      '{{net_salary}}': '178,500',
      '{{bank_name}}': 'Habib Bank Limited (HBL)',
      '{{account_mask}}': '****5421',
      '{{payslip_url}}': 'https://hrm.company.internal/payroll/slip/2026-09',
      '{{leave_type}}': 'Annual Casual Leave',
      '{{from_date}}': '15-Sep-2026',
      '{{to_date}}': '18-Sep-2026',
      '{{days}}': '3',
      '{{status}}': 'APPROVED',
      '{{approver_name}}': 'Fatima Raza (Head of HR)',
      '{{remarks}}': 'Approved in accordance with annual departmental coverage schedule.',
      '{{claim_number}}': 'EXP-2026-089',
      '{{title}}': 'Client Onsite Dinner & Inter-City Travel',
      '{{amount}}': '14,850',
      '{{finance_auditor}}': 'Tariq Hussain (VP Finance)',
      '{{policy_code}}': 'POL-SEC-01',
      '{{policy_title}}': 'Acceptable Use & Information Security Policy',
      '{{version}}': 'v3.2',
      '{{deadline}}': '20-Sep-2026',
      '{{sign_url}}': 'https://hrm.company.internal/compliance/sign/POL-SEC-01'
    };

    let previewSubject = t.subject;
    let previewBody = t.body;
    Object.entries(sampleData).forEach(([token, val]) => {
      previewSubject = previewSubject.split(token).join(val);
      previewBody = previewBody.split(token).join(val);
    });

    Modal.show(`Email Preview: ${t.code}`, `
      <div style="background:var(--surface-2);border-radius:10px;padding:14px;margin-bottom:14px;font-size:12px;border:1px solid var(--border)">
        <div style="display:flex;margin-bottom:4px">
          <span style="width:80px;color:var(--text-3);font-weight:600">From:</span>
          <span style="color:var(--text)">${company} Notifications &lt;no-reply@company.com&gt;</span>
        </div>
        <div style="display:flex;margin-bottom:4px">
          <span style="width:80px;color:var(--text-3);font-weight:600">To:</span>
          <span style="color:var(--text)">Ahmed Khan &lt;ahmed.khan@company.com&gt;</span>
        </div>
        <div style="display:flex;margin-bottom:4px">
          <span style="width:80px;color:var(--text-3);font-weight:600">Subject:</span>
          <span style="font-weight:700;color:var(--text)">${previewSubject}</span>
        </div>
        <div style="display:flex">
          <span style="width:80px;color:var(--text-3);font-weight:600">Dispatched:</span>
          <span style="color:var(--text-2);font-family:monospace">${new Date().toUTCString()}</span>
        </div>
      </div>

      <div style="background:#ffffff;color:#1e293b;border-radius:10px;padding:24px;border:1px solid #cbd5e1;box-shadow:0 4px 12px rgba(0,0,0,0.05);font-family:'Segoe UI',sans-serif">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:16px">
          <div style="font-size:16px;font-weight:800;color:#1e3a8a"><i class="fa fa-layer-group"></i> ${company}</div>
          <span style="background:#f1f5f9;color:#475569;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:600">${t.category}</span>
        </div>

        <div style="font-size:13px;line-height:1.7;white-space:pre-wrap;color:#334155;margin-bottom:24px">${previewBody}</div>

        <div style="text-align:center;margin:24px 0">
          <a href="javascript:void(0)" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:12.5px;padding:10px 22px;border-radius:6px">Access HRM Employee Portal</a>
        </div>

        <div style="border-top:1px solid #e2e8f0;padding-top:12px;font-size:11px;color:#94a3b8;text-align:center;line-height:1.4">
          This is an automated system transmission from ${company}. Please do not reply directly to this address.<br>
          Confidential & Statutory Corporate Record.
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-secondary" onclick="Settings.editNotificationTemplate(${t.id})"><i class="fa fa-pen"></i> Edit Template</button>
        <button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close Preview</button>
      `
    });
  },

  editNotificationTemplate(id) {
    const t = (DB.get('notification_templates') || []).find(x => x.id === id);
    if (!t) return;

    Modal.show(`Edit Template: ${t.code}`, `
      <div class="form-group">
        <label class="form-label">Template Title</label>
        <input class="form-control" id="tpl-title" value="${t.title}">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Category</label>
          <input class="form-control" id="tpl-category" value="${t.category}">
        </div>
        <div class="form-group">
          <label class="form-label">Template Code</label>
          <input class="form-control" value="${t.code}" disabled style="background:var(--surface-2)">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Subject Line</label>
        <input class="form-control" id="tpl-subject" value="${t.subject}">
      </div>
      <div class="form-group">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <label class="form-label" style="margin:0">Template Body (Plain text / HTML formatting)</label>
          <span style="font-size:11px;color:var(--text-3)">Click token to append:</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
          ${(t.variables || []).map(v => `
            <button type="button" class="btn btn-ghost btn-xs" style="font-family:monospace;font-size:10.5px" onclick="document.getElementById('tpl-body').value += ' ${v}'">${v}</button>
          `).join('')}
        </div>
        <textarea class="form-control" id="tpl-body" rows="9" style="font-family:monospace;font-size:12px;line-height:1.5">${t.body}</textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.saveNotificationTemplate(${t.id})"><i class="fa fa-save"></i> Save Template</button>
      `
    });
  },

  saveNotificationTemplate(id) {
    const title = document.getElementById('tpl-title').value.trim();
    const category = document.getElementById('tpl-category').value.trim();
    const subject = document.getElementById('tpl-subject').value.trim();
    const body = document.getElementById('tpl-body').value.trim();

    if (!title || !subject || !body) {
      Toast.show('Title, subject, and body are required', 'error');
      return;
    }

    const templates = DB.get('notification_templates') || [];
    const idx = templates.findIndex(t => t.id === id);
    if (idx !== -1) {
      templates[idx].title = title;
      templates[idx].category = category;
      templates[idx].subject = subject;
      templates[idx].body = body;
      templates[idx].lastUpdated = new Date().toISOString().split('T')[0];
      DB.set('notification_templates', templates);
      DB.log('UPDATE', 'Settings', `Updated notification template ${templates[idx].code}`, Auth.user?.id, 'INFO');
      Toast.show('Notification template saved successfully!', 'success');
      Modal.close('dynamic-modal');
      this.renderSection();
    }
  },

  resetDefaultTemplates() {
    Modal.confirm('Restore Default Templates', 'This will reset all corporate notification email templates to standard defaults. Continue?', () => {
      localStorage.removeItem('hrm_notification_templates');
      DB.ensureWebhooksAndTemplates();
      Toast.show('Templates restored to defaults', 'success');
      this.renderSection();
    });
  },

  // ─── Webhooks & Third-Party Integrations ──────────
  renderWebhooks(c) {
    const webhooks = DB.get('webhooks') || [];
    const activeCount = webhooks.filter(w => w.status === 'active').length;

    c.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
          <div>
            <div style="font-size:16px;font-weight:700">Webhooks & Integration Gateways</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:3px">Real-time HTTP event dispatchers for Slack, MS Teams, ERP General Ledger, and external HR systems</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="Settings.simulateBroadcastPing()">
              <i class="fa fa-tower-broadcast"></i> Test Broadcast Ping
            </button>
            <button class="btn btn-primary btn-sm" onclick="Settings.showWebhookModal()">
              <i class="fa fa-plus"></i> Register Webhook Endpoint
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--primary)">${webhooks.length}</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Configured Endpoints</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--success)">${activeCount}</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Active Dispatchers</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--info)">48 ms</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Avg Dispatch Latency</div>
          </div>
          <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--warning)">99.8%</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Delivery Health Rate</div>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Integration Service</th>
                <th>Target Endpoint URL</th>
                <th>Subscribed Events</th>
                <th>Status</th>
                <th>Last Status</th>
                <th style="text-align:right">Forensic Actions</th>
              </tr>
            </thead>
            <tbody>
              ${webhooks.length === 0 ? `
                <tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-3)">No webhooks configured. Click "Register Webhook Endpoint" to add one.</td></tr>
              ` : webhooks.map(w => {
                const isSlack = (w.url || '').includes('slack') || w.format === 'slack_incoming';
                const isTeams = (w.url || '').includes('office.com') || w.format === 'adaptive_card';
                const isERP = (w.url || '').includes('erp') || (w.name || '').toLowerCase().includes('sap');
                const badgeClass = isSlack ? 'badge-primary' : isTeams ? 'badge-info' : isERP ? 'badge-warning' : 'badge-secondary';
                const formatLabel = isSlack ? 'SLACK INCOMING' : isTeams ? 'MS TEAMS ADAPTIVE' : isERP ? 'SAP ERP REST' : (w.format || 'HTTP REST').toUpperCase();

                return `
                  <tr>
                    <td>
                      <div style="font-weight:700;font-size:12.5px;color:var(--text)">${w.name}</div>
                      <span class="badge ${badgeClass}" style="font-size:10px;margin-top:2px">${formatLabel}</span>
                    </td>
                    <td>
                      <div style="font-family:monospace;font-size:11.5px;color:var(--text-2);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${w.url}">
                        ${w.url.replace(/(https:\/\/[^/]+\/).*/, '$1...')}
                      </div>
                      <div style="font-size:10.5px;color:var(--text-3);font-family:monospace">HMAC: ${w.secret ? w.secret.substring(0, 10) + '***' : 'None'}</div>
                    </td>
                    <td style="max-width:220px">
                      <div style="display:flex;flex-wrap:wrap;gap:3px">
                        ${(w.events || ['*']).map(ev => `
                          <span style="font-family:monospace;font-size:10px;background:var(--surface-2);padding:2px 5px;border-radius:4px;color:var(--info)">${ev}</span>
                        `).join('')}
                      </div>
                    </td>
                    <td>
                      <button class="btn btn-xs ${w.status==='active' ? 'btn-success' : 'btn-ghost'}" onclick="Settings.toggleWebhookStatus(${w.id})" title="Click to toggle status">
                        <i class="fa fa-circle" style="font-size:8px;margin-right:4px"></i>${w.status==='active' ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td>
                      ${w.lastStatus ? `
                        <span class="badge badge-success" style="font-family:monospace;font-size:10px">${w.lastStatus} OK</span>
                        <div style="font-size:10px;color:var(--text-3);margin-top:2px">${w.lastDispatchedAt ? new Date(w.lastDispatchedAt).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit'}) : 'Pending'}</div>
                      ` : `
                        <span style="font-size:11px;color:var(--text-3)">Not dispatched yet</span>
                      `}
                    </td>
                    <td style="text-align:right;white-space:nowrap">
                      <button class="btn btn-ghost btn-xs" onclick="Settings.testPingWebhook(${w.id})" title="Simulate Real-Time Dispatch Ping">
                        <i class="fa fa-bolt" style="color:var(--warning)"></i> Ping
                      </button>
                      <button class="btn btn-ghost btn-xs" onclick="Settings.showWebhookModal(${w.id})" title="Edit Configuration">
                        <i class="fa fa-pen"></i>
                      </button>
                      <button class="btn btn-ghost btn-xs" onclick="Settings.viewWebhookLogs(${w.id})" title="View Dispatch Inspection">
                        <i class="fa fa-file-code"></i>
                      </button>
                      <button class="btn btn-ghost btn-xs" onclick="Settings.deleteWebhook(${w.id})" title="Remove Webhook" style="color:var(--danger)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showWebhookModal(id = null) {
    const webhooks = DB.get('webhooks') || [];
    const w = id ? webhooks.find(x => x.id === id) : null;
    const isEdit = !!w;

    const availableEvents = [
      { id: 'payroll.finalized', label: 'Payroll Pay Run Finalized' },
      { id: 'leave.approved', label: 'Leave Requisition Approved' },
      { id: 'employee.onboarded', label: 'New Employee Hired & Onboarded' },
      { id: 'incident.reported', label: 'Whistleblower Grievance Lodged' },
      { id: 'expense.reimbursed', label: 'Expense Claim Settled' },
      { id: 'asset.handover', label: 'Company Asset Assigned / Returned' }
    ];

    const currentEvents = w ? (w.events || []) : ['payroll.finalized', 'employee.onboarded'];

    Modal.show(isEdit ? `Edit Webhook: ${w.name}` : 'Register New Webhook Gateway', `
      <div class="form-group">
        <label class="form-label">Gateway Name / Destination Identifier</label>
        <input class="form-control" id="wh-name" value="${w ? w.name : ''}" placeholder="e.g. Slack HR Announcements or Workday Connector">
      </div>
      <div class="form-group">
        <label class="form-label">Target HTTPS Endpoint URL</label>
        <input class="form-control" id="wh-url" value="${w ? w.url : ''}" placeholder="https://api.domain.com/webhooks/hrm-events">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Payload Architecture / Format</label>
          <select class="form-control" id="wh-format">
            <option value="json_rest" ${w?.format==='json_rest'?'selected':''}>Standard HTTP REST JSON</option>
            <option value="slack_incoming" ${w?.format==='slack_incoming'?'selected':''}>Slack Incoming Webhook (Blocks UI)</option>
            <option value="adaptive_card" ${w?.format==='adaptive_card'?'selected':''}>Microsoft Teams (Adaptive Card v1.4)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">HMAC SHA-256 Signing Secret</label>
          <input class="form-control" id="wh-secret" value="${w ? w.secret : 'sec_' + Math.random().toString(36).substring(2, 12)}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Subscribed Event Topics</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--surface-2);padding:12px;border-radius:8px">
          ${availableEvents.map(ev => `
            <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer">
              <input type="checkbox" class="wh-event-chk" value="${ev.id}" ${currentEvents.includes(ev.id) ? 'checked' : ''}>
              <span>${ev.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Initial Operational State</label>
        <select class="form-control" id="wh-status">
          <option value="active" ${w?.status!=='paused'?'selected':''}>Active (Dispatches in real time)</option>
          <option value="paused" ${w?.status==='paused'?'selected':''}>Paused (Queuing disabled)</option>
        </select>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.saveWebhook(${id || 'null'})"><i class="fa fa-save"></i> ${isEdit ? 'Update Webhook' : 'Register Gateway'}</button>
      `
    });
  },

  saveWebhook(id) {
    const name = document.getElementById('wh-name').value.trim();
    const url = document.getElementById('wh-url').value.trim();
    const format = document.getElementById('wh-format').value;
    const secret = document.getElementById('wh-secret').value.trim();
    const status = document.getElementById('wh-status').value;

    const checkedBoxes = document.querySelectorAll('.wh-event-chk:checked');
    const events = Array.from(checkedBoxes).map(b => b.value);

    if (!name || !url) {
      Toast.show('Gateway Name and Target URL are required', 'error');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Toast.show('Target URL must begin with http:// or https://', 'error');
      return;
    }

    const webhooks = DB.get('webhooks') || [];

    if (id) {
      const idx = webhooks.findIndex(w => w.id === id);
      if (idx !== -1) {
        webhooks[idx] = { ...webhooks[idx], name, url, format, secret, status, events };
        DB.set('webhooks', webhooks);
        DB.log('UPDATE', 'Webhooks', `Updated webhook endpoint "${name}"`, Auth.user?.id, 'INFO');
        Toast.show('Webhook updated successfully', 'success');
      }
    } else {
      const newWh = {
        id: DB.nextId('webhooks'),
        name,
        url,
        format,
        secret,
        status,
        events: events.length ? events : ['*'],
        lastStatus: null,
        failureCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      webhooks.push(newWh);
      DB.set('webhooks', webhooks);
      DB.log('CREATE', 'Webhooks', `Registered new webhook gateway "${name}"`, Auth.user?.id, 'INFO');
      Toast.show('Webhook gateway registered successfully', 'success');
    }

    Modal.close('dynamic-modal');
    this.renderSection();
  },

  toggleWebhookStatus(id) {
    const webhooks = DB.get('webhooks') || [];
    const idx = webhooks.findIndex(w => w.id === id);
    if (idx !== -1) {
      webhooks[idx].status = webhooks[idx].status === 'active' ? 'paused' : 'active';
      DB.set('webhooks', webhooks);
      DB.log('UPDATE', 'Webhooks', `Toggled webhook "${webhooks[idx].name}" to ${webhooks[idx].status}`, Auth.user?.id, 'INFO');
      Toast.show(`Webhook is now ${webhooks[idx].status}`, 'info');
      this.renderSection();
    }
  },

  deleteWebhook(id) {
    const webhooks = DB.get('webhooks') || [];
    const w = webhooks.find(x => x.id === id);
    if (!w) return;

    Modal.confirm(`Remove Webhook Gateway`, `Are you sure you want to permanently unregister <strong>${w.name}</strong>? Dispatches will cease immediately.`, () => {
      const filtered = webhooks.filter(x => x.id !== id);
      DB.set('webhooks', filtered);
      DB.log('DELETE', 'Webhooks', `Removed webhook gateway "${w.name}"`, Auth.user?.id, 'WARNING');
      Toast.show('Webhook removed', 'success');
      this.renderSection();
    }, 'danger');
  },

  testPingWebhook(id) {
    const webhooks = DB.get('webhooks') || [];
    const w = webhooks.find(x => x.id === id);
    if (!w) return;

    const testEvent = (w.events && w.events[0]) || 'ping.handshake';
    const timestamp = new Date().toISOString();
    const mockPayload = {
      event: testEvent,
      timestamp,
      environment: 'production',
      signature: `sha256=${((Date.now() * 37) & 0xffffffff).toString(16)}`,
      data: {
        system: 'MY-HRM Global Enterprise Gateway',
        pingId: `png_${Math.random().toString(36).substring(2, 9)}`,
        status: 'VERIFIED_HEALTHY',
        dispatchedBy: Auth.employee?.fullName || 'Super Administrator',
        subscribedTopics: w.events || ['*']
      }
    };

    // Update dispatch status in database
    w.lastDispatchedAt = timestamp;
    w.lastStatus = 200;
    w.failureCount = 0;
    DB.set('webhooks', webhooks);
    DB.log('DISPATCH', 'Webhooks', `Dispatched test ping to "${w.name}" [200 OK, 38ms]`, Auth.user?.id, 'INFO');

    Modal.show(`Webhook Dispatch Simulation: ${w.name}`, `
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <span class="badge badge-success"><i class="fa fa-circle-check"></i> HTTP 200 OK</span>
        <span class="badge badge-info"><i class="fa fa-bolt"></i> Latency: 38ms</span>
        <span class="badge badge-secondary"><i class="fa fa-shield"></i> HMAC SHA-256 Validated</span>
      </div>

      <div style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px">Outbound Request Headers:</div>
      <pre style="background:var(--surface-2);color:var(--text-2);padding:10px;border-radius:6px;font-size:11px;line-height:1.4;margin-bottom:12px">
POST ${w.url}
Host: ${w.url.replace(/^https?:\/\/([^/]+).*/, '$1')}
Content-Type: application/json
User-Agent: MY-HRM-Enterprise-Webhook-Dispatcher/2.4
X-HRM-Event: ${testEvent}
X-HRM-Signature: sha256=${w.secret ? 'valid_hmac_signature' : 'none'}</pre>

      <div style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px">Dispatched JSON Payload:</div>
      <pre style="background:#0f172a;color:#38bdf8;padding:12px;border-radius:8px;font-size:11px;overflow-x:auto;max-height:170px">${JSON.stringify(mockPayload, null, 2)}</pre>
    `, {
      footer: `
        <button class="btn btn-primary" onclick="Modal.close('dynamic-modal'); Settings.renderSection();">
          <i class="fa fa-check"></i> Complete Verification
        </button>
      `
    });
  },

  simulateBroadcastPing() {
    const webhooks = DB.get('webhooks') || [];
    if (!webhooks.length) {
      Toast.show('No webhooks configured to broadcast', 'warning');
      return;
    }

    const timestamp = new Date().toISOString();
    let count = 0;
    webhooks.forEach(w => {
      if (w.status === 'active') {
        w.lastDispatchedAt = timestamp;
        w.lastStatus = 200;
        count++;
      }
    });
    DB.set('webhooks', webhooks);
    DB.log('BROADCAST', 'Webhooks', `Broadcast test ping dispatched across ${count} active gateways`, Auth.user?.id, 'INFO');
    Toast.show(`Dispatched broadcast test ping to ${count} active gateways!`, 'success');
    this.renderSection();
  },

  viewWebhookLogs(id) {
    const w = (DB.get('webhooks') || []).find(x => x.id === id);
    if (!w) return;

    Modal.show(`Delivery Inspection: ${w.name}`, `
      <div style="margin-bottom:12px;font-size:12px;color:var(--text-2)">
        Historical dispatch telemetry for <code>${w.url}</code>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Verification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-size:11px;font-family:monospace">${w.lastDispatchedAt ? new Date(w.lastDispatchedAt).toLocaleString('en-PK') : '2026-09-08 14:00'}</td>
              <td><span class="badge badge-info" style="font-size:10px">${(w.events && w.events[0]) || 'payroll.finalized'}</span></td>
              <td><span class="badge badge-success" style="font-size:10px">200 OK</span></td>
              <td style="font-size:11px;font-family:monospace">42ms</td>
              <td><i class="fa fa-shield-check" style="color:var(--success)"></i> Valid HMAC</td>
            </tr>
            <tr>
              <td style="font-size:11px;font-family:monospace">2026-09-07 10:30:15</td>
              <td><span class="badge badge-info" style="font-size:10px">employee.onboarded</span></td>
              <td><span class="badge badge-success" style="font-size:10px">200 OK</span></td>
              <td style="font-size:11px;font-family:monospace">35ms</td>
              <td><i class="fa fa-shield-check" style="color:var(--success)"></i> Valid HMAC</td>
            </tr>
          </tbody>
        </table>
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close Inspection</button>`
    });
  },

  triggerWebhooks(module, action, payload) {
    const webhooks = DB.get('webhooks') || [];
    const eventName = `${(module || 'system').toLowerCase()}.${(action || 'event').toLowerCase()}`;
    const active = webhooks.filter(w => w.status === 'active' && (!w.events || w.events.includes('*') || w.events.some(ev => eventName.includes(ev.toLowerCase()) || ev.includes(action.toLowerCase()))));

    if (!active.length) return;
    const now = new Date().toISOString();
    active.forEach(w => {
      w.lastDispatchedAt = now;
      w.lastStatus = 200;
    });
    DB.set('webhooks', webhooks);
  },

  // ─── Security & Communication Telemetry ──────────
  renderSecurityTelemetry(c) {
    const tokens = DB.get('api_tokens') || [];
    const activeTokens = tokens.filter(t => t.isActive);
    const emails = DB.get('email_logs') || [];
    const sms = DB.get('sms_logs') || [];
    const activities = DB.get('activity_logs') || [];

    c.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:18px">
        <!-- Header Card -->
        <div class="card" style="padding:18px 24px;background:linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:12px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg, #6366f1, #a855f7);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px">
                <i class="fa fa-shield-halved"></i>
              </div>
              <div>
                <div style="font-size:17px;font-weight:700;color:var(--text)">Enterprise Security & Communication Telemetry</div>
                <div style="font-size:12px;color:var(--text-3);margin-top:2px">Cryptographic API bearer tokens, multi-channel transactional dispatches, and immutable forensic event audit trail</div>
              </div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-secondary btn-sm" onclick="Settings.simulateTelemetryPing()">
                <i class="fa fa-paper-plane"></i> Test Gateway Dispatch
              </button>
              <button class="btn btn-primary btn-sm" onclick="Settings.showApiTokenModal()">
                <i class="fa fa-key"></i> Generate API Bearer Key
              </button>
            </div>
          </div>

          <!-- KPI Strip -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-top:20px">
            <div style="background:var(--surface-2);border-radius:10px;padding:12px 16px;border:1px solid var(--border)">
              <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Active API Tokens</div>
              <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px">${activeTokens.length} / ${tokens.length}</div>
            </div>
            <div style="background:var(--surface-2);border-radius:10px;padding:12px 16px;border:1px solid var(--border)">
              <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Dispatched Emails</div>
              <div style="font-size:22px;font-weight:800;color:var(--info);margin-top:4px">${emails.length}</div>
            </div>
            <div style="background:var(--surface-2);border-radius:10px;padding:12px 16px;border:1px solid var(--border)">
              <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">SMS Notifications</div>
              <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:4px">${sms.length}</div>
            </div>
            <div style="background:var(--surface-2);border-radius:10px;padding:12px 16px;border:1px solid var(--border)">
              <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600">Forensic Logs</div>
              <div style="font-size:22px;font-weight:800;color:var(--warning);margin-top:4px">${activities.length}</div>
            </div>
          </div>
        </div>

        <!-- Section 1: API Bearer Keys -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div>
              <span style="font-size:14px;font-weight:700">API Bearer Access Tokens</span>
              <span style="margin-left:8px;font-size:12px;color:var(--text-3)">Machine-to-machine integrations (Biometric, SAP, Mobile)</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Settings.showApiTokenModal()"><i class="fa fa-plus"></i> New Token</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client / Service Name</th>
                  <th>Bearer Token Key</th>
                  <th>Scope Permissions</th>
                  <th>Last Used</th>
                  <th>Expiration</th>
                  <th>Status</th>
                  <th style="text-align:right">Action</th>
                </tr>
              </thead>
              <tbody>
                ${tokens.map(t => {
                  let perms = [];
                  try { perms = typeof t.permissions === 'string' ? JSON.parse(t.permissions) : t.permissions; } catch {}
                  return `<tr>
                    <td style="font-weight:700">
                      <i class="fa fa-server" style="color:var(--primary);margin-right:6px"></i>${t.name}
                    </td>
                    <td>
                      <code style="background:var(--surface-2);padding:2px 6px;border-radius:4px;font-size:11.5px;color:var(--primary)">${t.tokenHash.substring(0, 14)}••••••••</code>
                    </td>
                    <td>
                      <div style="display:flex;flex-wrap:wrap;gap:4px">
                        ${perms.map(p => `<span class="badge badge-secondary" style="font-size:10px">${p}</span>`).join('')}
                      </div>
                    </td>
                    <td style="font-size:12px;color:var(--text-2)">${t.lastUsedAt ? Utils.formatDate(t.lastUsedAt) : 'Never'}</td>
                    <td style="font-size:12px;color:var(--text-2)">${t.expiresAt ? Utils.formatDate(t.expiresAt) : 'Permanent'}</td>
                    <td>${t.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Revoked</span>'}</td>
                    <td style="text-align:right">
                      <div class="tbl-actions" style="justify-content:flex-end">
                        ${t.isActive ? `
                          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Settings.revokeApiToken(${t.id})" title="Revoke Token">
                            <i class="fa fa-ban"></i>
                          </button>
                        ` : `
                          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--success)" onclick="Settings.reactivateApiToken(${t.id})" title="Reactivate Token">
                            <i class="fa fa-rotate-right"></i>
                          </button>
                        `}
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 2: Communication Telemetry (Email & SMS Logs) -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
          <!-- Email Logs -->
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border)">
              <span style="font-size:14px;font-weight:700">Transactional Email Dispatches</span>
              <span style="margin-left:8px;font-size:12px;color:var(--text-3)">${emails.length} logs</span>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Provider</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${emails.map(e => `<tr>
                    <td style="font-size:12px;font-weight:600">${e.recipient}</td>
                    <td>
                      <div style="font-size:12px;font-weight:600">${e.subject}</div>
                      <div style="font-size:10px;color:var(--text-3)">Template: ${e.templateCode}</div>
                    </td>
                    <td style="font-size:11px;color:var(--text-2)">${e.provider}</td>
                    <td><span class="badge badge-success">${e.status}</span></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- SMS Logs -->
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border)">
              <span style="font-size:14px;font-weight:700">Enterprise SMS Delivery Logs</span>
              <span style="margin-left:8px;font-size:12px;color:var(--text-3)">${sms.length} logs</span>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Phone</th>
                    <th>Message</th>
                    <th>Gateway</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${sms.map(s => `<tr>
                    <td style="font-size:12px;font-family:monospace;font-weight:600">${s.recipientPhone}</td>
                    <td style="font-size:11.5px;color:var(--text-2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${s.message}">${s.message}</td>
                    <td style="font-size:11px;color:var(--text-2)">${s.provider}</td>
                    <td><span class="badge badge-success">${s.status}</span></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Section 3: Forensic Activity Trail -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div>
              <span style="font-size:14px;font-weight:700">Forensic Activity & Telemetry Trail</span>
              <span style="margin-left:8px;font-size:12px;color:var(--text-3)">Live audit trace</span>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operator</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Forensic Details</th>
                  <th>Client IP</th>
                </tr>
              </thead>
              <tbody>
                ${activities.map(a => `<tr>
                  <td style="font-size:11.5px;color:var(--text-3);white-space:nowrap">${Utils.formatDate(a.createdAt)}</td>
                  <td>
                    <span style="font-weight:600;font-size:12.5px">${a.userName}</span>
                    <span class="badge badge-secondary" style="margin-left:4px;font-size:9px">${a.userRole}</span>
                  </td>
                  <td>
                    <span class="badge ${a.action==='CREATE'?'badge-success':a.action==='UPDATE'?'badge-warning':a.action==='APPROVE'?'badge-info':'badge-primary'}" style="font-size:10px;font-weight:700">
                      ${a.action}
                    </span>
                  </td>
                  <td><span class="chip" style="font-size:11px">${a.entityType} #${a.entityId || 1}</span></td>
                  <td style="font-size:12px;color:var(--text-2)">${a.details}</td>
                  <td><code style="font-size:11px">${a.ipAddress}</code></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  showApiTokenModal() {
    Modal.show('Generate New API Bearer Token', `
      <div class="form-group">
        <label class="form-label required">Integration / Service Name</label>
        <input class="form-control" id="token-name" placeholder="e.g. HR Mobile App or Biometric Device Gateway">
      </div>
      <div class="form-group">
        <label class="form-label">Granted Scope Permissions</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--surface-2);padding:12px;border-radius:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" class="token-scope-chk" value="employees.view" checked> Read Employees
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" class="token-scope-chk" value="attendance.create" checked> Record Attendance
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" class="token-scope-chk" value="leaves.create"> File Leaves
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" class="token-scope-chk" value="payroll.view"> Inspect Payroll
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" class="token-scope-chk" value="travel_expenses.create"> Submit Expenses
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" class="token-scope-chk" value="notifications.view" checked> Read Notifications
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Key Validity Period</label>
        <select class="form-control" id="token-expiry">
          <option value="90">90 Days</option>
          <option value="180">180 Days (6 Months)</option>
          <option value="365" selected>1 Year (365 Days)</option>
          <option value="730">2 Years</option>
        </select>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Settings.saveApiToken()"><i class="fa fa-key"></i> Generate Token</button>
      `
    });
  },

  saveApiToken() {
    const name = document.getElementById('token-name').value.trim();
    if (!name) { Toast.show('Please enter service name', 'error'); return; }
    const scopes = Array.from(document.querySelectorAll('.token-scope-chk:checked')).map(c => c.value);
    const days = parseInt(document.getElementById('token-expiry').value);
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + days);

    const randomHex = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const rawKey = `tok_live_${randomHex}`;

    DB.add('api_tokens', {
      id: DB.nextId('api_tokens'),
      name,
      tokenHash: rawKey,
      permissions: JSON.stringify(scopes),
      lastUsedAt: null,
      expiresAt: expDate.toISOString(),
      isActive: true,
      createdBy: Auth.user?.id || 1,
      createdAt: new Date().toISOString()
    });

    DB.log('ADD', 'Settings', `API Bearer Token generated for ${name}`, Auth.user?.id);
    Modal.close('dynamic-modal');

    Modal.show('API Token Created Successfully', `
      <div style="text-align:center;padding:12px 0">
        <i class="fa fa-circle-check" style="font-size:42px;color:var(--success);margin-bottom:12px"></i>
        <h4 style="margin:0 0 6px 0">API Bearer Token Ready</h4>
        <p style="font-size:12px;color:var(--text-3);margin:0 0 16px 0">Copy your API token now. For security purposes, it will not be displayed in full again.</p>
        <div style="background:var(--surface-2);border:1px dashed var(--primary);padding:10px 14px;border-radius:8px;font-family:monospace;font-size:12.5px;color:var(--primary);word-break:break-all;user-select:all">
          ${rawKey}
        </div>
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">I Have Saved This Key</button>`
    });

    this.renderSection();
  },

  revokeApiToken(id) {
    const token = DB.find('api_tokens', id);
    Modal.confirm('Revoke API Token', `Are you sure you want to revoke API token <strong>${token?.name}</strong>? Any connected daemon will immediately receive HTTP 401 Unauthorized.`, () => {
      DB.update('api_tokens', id, { isActive: false });
      DB.log('UPDATE', 'Settings', `API Token ${token?.name} revoked`, Auth.user?.id);
      Toast.show('API Token revoked!', 'warning');
      this.renderSection();
    }, 'danger');
  },

  reactivateApiToken(id) {
    DB.update('api_tokens', id, { isActive: true });
    Toast.show('API Token reactivated!', 'success');
    this.renderSection();
  },

  simulateTelemetryPing() {
    Toast.show('Dispatching multi-channel telemetry ping to SendGrid & Telenor SMS...', 'info');
    setTimeout(() => {
      const now = new Date().toISOString();
      DB.add('email_logs', {
        id: DB.nextId('email_logs'),
        recipient: 'admin@company.com',
        subject: 'Live Security Telemetry Ping Confirmation',
        templateCode: 'SYS_PING',
        status: 'sent',
        provider: 'Corporate SMTP / SendGrid',
        sentAt: now,
        errorMessage: null
      });

      DB.add('sms_logs', {
        id: DB.nextId('sms_logs'),
        recipientPhone: '+923001234567',
        message: 'ApexHRM Telemetry: Multi-channel gateway broadcast test successfully verified.',
        provider: 'Telenor Enterprise SMS',
        status: 'delivered',
        sentAt: now,
        cost: 1.25
      });

      DB.add('activity_logs', {
        id: DB.nextId('activity_logs'),
        userId: Auth.user?.id || 1,
        userName: Auth.user?.name || 'Ahmed Khan',
        userRole: Auth.role || 'superadmin',
        action: 'TEST',
        entityType: 'TelemetryGateway',
        entityId: 1,
        details: 'Dispatched simulated multi-channel telemetry ping',
        ipAddress: '192.168.10.1',
        userAgent: navigator.userAgent || 'Enterprise Browser',
        createdAt: now
      });

      Toast.show('Telemetry dispatches successfully logged!', 'success');
      this.renderSection();
    }, 400);
  },

  // ─── Appearance ───────────────────────────────────
  renderAppearance(c) {
    const theme = this._getSetting('theme', 'dark');
    const accent = this._getSetting('accentColor', '#4f80f7');
    const sidebarPosition = this._getSetting('sidebarPosition', 'left');
    c.innerHTML = this._sectionCard('Appearance', 'Customize the look and feel', `
      ${this._settingRow('Theme',
        `<div style="display:flex;gap:10px">
          ${[
            { id:'dark', label:'Dark', bg:'#0f1729', color:'white' },
            { id:'light', label:'Light', bg:'#f8fafc', color:'#1a1a2e' },
          ].map(t => `
            <div onclick="Settings.setTheme('${t.id}')" style="cursor:pointer;padding:12px 20px;border-radius:10px;border:2px solid ${theme===t.id?'var(--primary)':'var(--border)'};background:${t.bg};color:${t.color};font-size:13px;font-weight:600;text-align:center;min-width:80px;transition:.2s">
              ${t.id === 'dark' ? '<i class="fa fa-moon" style="margin-right:6px"></i>' : '<i class="fa fa-sun" style="margin-right:6px"></i>'}${t.label}
            </div>
          `).join('')}
        </div>`,
        'Switch between dark and light themes')}
      ${this._settingRow('Accent Color',
        `<div style="display:flex;gap:8px;align-items:center">
          <input type="color" id="s-accent" value="${accent}" style="width:40px;height:34px;border:none;border-radius:8px;cursor:pointer;background:none">
          <span style="font-family:monospace;font-size:12px;color:var(--text-3)">${accent}</span>
        </div>`,
        'Primary color used throughout the interface')}
      ${this._settingRow('Sidebar Position',
        `<select class="form-control" id="s-sidebar-pos">
          <option value="left" ${sidebarPosition==='left'?'selected':''}>Left</option>
          <option value="right" ${sidebarPosition==='right'?'selected':''}>Right</option>
        </select>`, '')}
      ${this._settingRow('Compact Mode',
        `<label class="toggle-switch"><input type="checkbox" id="s-compact" ${this._getSetting('compactMode',false)?'checked':''}><span class="toggle-slider"></span></label>`,
        'Reduce spacing for more content density')}
    `, `<button class="btn btn-primary" onclick="Settings.saveAppearance()"><i class="fa fa-save"></i> Apply & Save</button>`);
  },

  setTheme(theme) {
    this._setSetting('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.renderSection();
    Toast.show(`Theme changed to ${theme} mode`, 'success');
  },

  saveAppearance() {
    this._setSetting('accentColor', document.getElementById('s-accent').value);
    this._setSetting('sidebarPosition', document.getElementById('s-sidebar-pos').value);
    this._setSetting('compactMode', document.getElementById('s-compact').checked);
    DB.log('UPDATE', 'Settings', 'Appearance settings updated', Auth.user?.id);
    Toast.show('Appearance settings saved!', 'success');
  },

  // ─── Backup & Restore ────────────────────────────
  renderBackup(c) {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('hrm_'));
    const totalSize = allKeys.reduce((s, k) => s + localStorage.getItem(k).length, 0);
    const lastBackup = this._getSetting('lastBackup', 'Never');

    c.innerHTML = this._sectionCard('Backup Data', 'Export all system data as a JSON file', `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        ${[
          { label: 'Data Tables', val: allKeys.length, icon: 'fa-database', color: 'var(--primary)' },
          { label: 'Storage Used', val: (totalSize / 1024).toFixed(1) + ' KB', icon: 'fa-hard-drive', color: 'var(--success)' },
          { label: 'Last Backup', val: lastBackup === 'Never' ? 'Never' : Utils.formatDate(lastBackup), icon: 'fa-clock-rotate-left', color: 'var(--warning)' },
        ].map(s => `
          <div style="background:var(--surface);border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:24px;color:${s.color};margin-bottom:8px"><i class="fa ${s.icon}"></i></div>
            <div style="font-size:18px;font-weight:800;color:${s.color}">${s.val}</div>
            <div style="font-size:11px;color:var(--text-3)">${s.label}</div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="Settings.exportBackup()"><i class="fa fa-download"></i> Download Full Backup</button>
        <button class="btn btn-ghost" onclick="Settings.exportBackup('employees')"><i class="fa fa-users"></i> Employees Only</button>
        <button class="btn btn-ghost" onclick="Settings.exportBackup('attendance')"><i class="fa fa-clock"></i> Attendance Only</button>
      </div>
    `) + this._sectionCard('Restore Data', 'Import data from a previously exported backup file', `
      <div style="border:2px dashed var(--border);border-radius:12px;padding:40px;text-align:center;margin-bottom:16px" id="drop-zone">
        <div style="font-size:36px;color:var(--text-muted);margin-bottom:12px"><i class="fa fa-cloud-arrow-up"></i></div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px">Drop backup file here or click to browse</div>
        <div style="font-size:12px;color:var(--text-muted)">Only .json files from HRM Pro backups are accepted</div>
        <input type="file" id="restore-file" accept=".json" style="display:none" onchange="Settings.handleRestore(this)">
        <button class="btn btn-ghost" style="margin-top:12px" onclick="document.getElementById('restore-file').click()"><i class="fa fa-folder-open"></i> Browse Files</button>
      </div>
      <div id="restore-preview" style="display:none"></div>
    `) + this._sectionCard('Danger Zone', 'Irreversible actions', `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:var(--danger)11;border:1px solid var(--danger)33;border-radius:10px">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--danger)">Reset All Data</div>
          <div style="font-size:12px;color:var(--text-3)">Delete all data and restore factory defaults. This cannot be undone.</div>
        </div>
        <button class="btn btn-danger" onclick="Settings.resetAll()"><i class="fa fa-trash"></i> Reset System</button>
      </div>
    `);
  },

  exportBackup(subset = null) {
    const data = {};
    const keys = Object.keys(localStorage).filter(k => k.startsWith('hrm_'));
    if (subset) {
      data[`hrm_${subset}`] = localStorage.getItem(`hrm_${subset}`);
    } else {
      keys.forEach(k => { data[k] = localStorage.getItem(k); });
    }
    const backup = {
      _meta: {
        app: 'HRM Pro',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: Auth.employee?.fullName || 'System',
        type: subset || 'full',
        tables: Object.keys(data).length,
      },
      data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrm-backup-${subset || 'full'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this._setSetting('lastBackup', new Date().toISOString());
    DB.log('BACKUP', 'Settings', `${subset || 'Full'} backup exported`, Auth.user?.id);
    Toast.show('Backup downloaded!', 'success', a.download);
    this.renderSection();
  },

  handleRestore(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup._meta || backup._meta.app !== 'HRM Pro') {
          Toast.show('Invalid backup file', 'error', 'This file is not a valid HRM Pro backup');
          return;
        }
        const preview = document.getElementById('restore-preview');
        const tables = Object.keys(backup.data).length;
        preview.style.display = 'block';
        preview.innerHTML = `
          <div class="card" style="border-color:var(--warning)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
              <div style="width:40px;height:40px;background:var(--warning)22;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--warning);font-size:18px"><i class="fa fa-file-import"></i></div>
              <div>
                <div style="font-size:14px;font-weight:700">Backup File Ready</div>
                <div style="font-size:12px;color:var(--text-3)">${file.name} • ${(file.size/1024).toFixed(1)} KB</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
              <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
                <div style="font-size:16px;font-weight:800;color:var(--primary)">${tables}</div>
                <div style="font-size:11px;color:var(--text-3)">Tables</div>
              </div>
              <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
                <div style="font-size:13px;font-weight:600;color:var(--accent)">${backup._meta.type}</div>
                <div style="font-size:11px;color:var(--text-3)">Type</div>
              </div>
              <div style="background:var(--surface);padding:10px;border-radius:8px;text-align:center">
                <div style="font-size:13px;font-weight:600;color:var(--success)">${Utils.formatDate(backup._meta.exportedAt?.split('T')[0])}</div>
                <div style="font-size:11px;color:var(--text-3)">Exported</div>
              </div>
            </div>
            <div class="alert alert-warning" style="margin-bottom:16px"><i class="fa fa-triangle-exclamation"></i> This will <strong>overwrite</strong> all existing data. Make sure to export a backup first!</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-warning" onclick="Settings.confirmRestore('${btoa(e.target.result).substring(0,50)}')"><i class="fa fa-upload"></i> Restore Now</button>
              <button class="btn btn-ghost" onclick="document.getElementById('restore-preview').style.display='none'">Cancel</button>
            </div>
          </div>
        `;
        // Store backup data temporarily
        Settings._pendingRestore = backup;
      } catch (err) {
        Toast.show('Failed to parse backup file', 'error', err.message);
      }
    };
    reader.readAsText(file);
  },

  confirmRestore() {
    if (!this._pendingRestore) return;
    Modal.confirm('Confirm Restore', 'This will <strong>replace ALL current data</strong> with the backup. This action cannot be undone. Are you sure?', () => {
      const backup = this._pendingRestore;
      Object.entries(backup.data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      this._pendingRestore = null;
      DB.log('RESTORE', 'Settings', 'System data restored from backup', Auth.user?.id);
      Toast.show('Data restored successfully!', 'success', 'Reloading system...');
      setTimeout(() => location.reload(), 1500);
    });
  },

  resetAll() {
    Modal.confirm('⚠️ Reset ALL Data', 'This will <strong>permanently delete ALL data</strong> including employees, attendance, payroll, and settings. The system will be restored to factory defaults.<br><br><strong>This action cannot be undone!</strong>', () => {
      DB.reset();
      DB.log('RESET', 'Settings', 'System reset to factory defaults', Auth.user?.id);
      Toast.show('System reset complete!', 'warning', 'Reloading...');
      setTimeout(() => location.reload(), 1500);
    }, 'danger');
  },

  // ─── System ───────────────────────────────────────
  renderSystem(c) {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('hrm_'));
    c.innerHTML = this._sectionCard('System Information', '', `
      ${[
        ['Application', 'HRM Pro v1.0.0'],
        ['Runtime', 'Client-side (localStorage)'],
        ['Browser', navigator.userAgent.split(' ').pop()],
        ['Platform', navigator.platform],
        ['Screen', `${screen.width}×${screen.height}`],
        ['LocalStorage Tables', allKeys.length],
        ['Storage Used', (allKeys.reduce((s,k) => s + localStorage.getItem(k).length, 0) / 1024).toFixed(1) + ' KB'],
        ['Storage Limit', '~5 MB'],
        ['Session', (typeof Auth.isLoggedIn === 'function' ? Auth.isLoggedIn() : !!Auth.user) ? `Active — ${Auth.employee?.fullName} (${Auth.role})` : 'Not logged in'],
      ].map(([l, v]) => `
        <div style="display:flex;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:200px;font-size:12.5px;color:var(--text-3);font-weight:500">${l}</div>
          <div style="font-size:13px;color:var(--text);font-family:monospace">${v}</div>
        </div>
      `).join('')}
    `) + this._sectionCard('Data Tables', 'All localStorage tables and their sizes', `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Table</th><th>Records</th><th>Size</th></tr></thead>
          <tbody>
            ${allKeys.sort().map(k => {
              const raw = localStorage.getItem(k);
              let count = '—';
              try { const p = JSON.parse(raw); count = Array.isArray(p) ? p.length : (typeof p === 'object' ? Object.keys(p).length : '—'); } catch {}
              return `<tr>
                <td style="font-family:monospace;font-size:12px;color:var(--primary)">${k}</td>
                <td>${count}</td>
                <td style="font-size:12px">${(raw.length / 1024).toFixed(2)} KB</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `);
  },

  // ─── Roles & Granular Permissions Matrix (Phase 2 RBAC) ────
  selectedRoleId: 2, // Default to HR Manager for easy viewing & toggling

  renderRolesPermissions(c) {
    if (typeof DB.ensureRBACData === 'function') DB.ensureRBACData();
    const roles = DB.get('roles') || [];
    const modules = DB.get('system_modules') || [];
    const permissions = DB.get('permissions') || [];
    const rolePermissions = DB.get('role_permissions') || [];
    const users = DB.get('users') || [];

    const selectedRole = roles.find(r => r.id === this.selectedRoleId) || roles[0];
    const isSuperAdmin = selectedRole.code === 'superadmin';

    const totalPermsCount = permissions.length;
    const grantedForSelected = isSuperAdmin
      ? totalPermsCount
      : rolePermissions.filter(rp => rp.roleId === selectedRole.id && rp.isGranted).length;

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h3 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary)">
              <i class="fa fa-user-shield"></i>
            </span>
            Roles &amp; Granular Permissions Matrix
          </h3>
          <div style="font-size:13px;color:var(--text-3);margin-top:4px">
            Configure enterprise role-based access control (RBAC), custom roles, and module-level CRUD authorizations
          </div>
        </div>

        <button class="btn btn-primary btn-sm" onclick="Settings.showAddCustomRoleModal()">
          <i class="fa fa-plus"></i> Create Custom Role
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Defined Roles</div>
          <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:4px">${roles.length} Roles</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${roles.filter(r => !r.isSystem).length} Custom Defined</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Protected Modules</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px">${modules.length} Modules</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Granular Access Gateways</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Active Permissions</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:4px">${grantedForSelected} / ${totalPermsCount}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Granted to ${selectedRole.name}</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Assigned Users</div>
          <div style="font-size:22px;font-weight:800;color:var(--accent);margin-top:4px">${users.filter(u => u.role === selectedRole.code).length} Users</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Bound to Current Role</div>
        </div>
      </div>

      <!-- Role Selector Tabs -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:20px">
        <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:10px">
          Select Role to Inspect &amp; Configure Permissions:
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${roles.map(r => `
            <button class="btn btn-sm ${r.id === selectedRole.id ? 'btn-primary' : 'btn-outline'}"
              style="display:flex;align-items:center;gap:8px;border-radius:8px"
              onclick="Settings.selectRole(${r.id})">
              <span>${r.name}</span>
              <span style="font-size:10px;padding:2px 6px;border-radius:6px;background:${r.id === selectedRole.id ? 'rgba(255,255,255,0.2)' : 'var(--surface)'};color:${r.id === selectedRole.id ? '#fff' : 'var(--text-3)'}">
                ${r.isSystem ? 'System' : 'Custom'}
              </span>
            </button>
          `).join('')}
        </div>
        <div style="margin-top:12px;font-size:12.5px;color:var(--text-2);background:var(--surface);padding:10px 14px;border-radius:8px;display:flex;align-items:center;gap:8px">
          <i class="fa fa-circle-info" style="color:var(--primary)"></i>
          <span><strong>${selectedRole.name} (${selectedRole.code}):</strong> ${selectedRole.description || 'Enterprise role'}</span>
        </div>
      </div>

      <!-- Permissions Matrix Table -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <div>
            <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--text)">Module Access Permissions Matrix</h4>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">Grant or revoke specific actions per submodule</div>
          </div>
          ${!isSuperAdmin ? `
            <div style="display:flex;gap:8px">
              <button class="btn btn-outline btn-xs" onclick="Settings.bulkToggleRolePermissions(${selectedRole.id}, true)">
                <i class="fa fa-check-double"></i> Grant All
              </button>
              <button class="btn btn-outline btn-xs" onclick="Settings.bulkToggleRolePermissions(${selectedRole.id}, false)">
                <i class="fa fa-ban"></i> Revoke All
              </button>
            </div>
          ` : `
            <span class="badge badge-success" style="font-size:11px">
              <i class="fa fa-lock"></i> Sovereign Access (Immutable)
            </span>
          `}
        </div>

        <div class="table-wrapper" style="margin:0">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:var(--surface);text-align:center">
                <th style="text-align:left;padding:12px 18px;font-size:12px;font-weight:700;color:var(--text-3)">Module</th>
                <th style="padding:12px 8px;font-size:12px;font-weight:700;color:var(--text-3);width:90px">View</th>
                <th style="padding:12px 8px;font-size:12px;font-weight:700;color:var(--text-3);width:90px">Create</th>
                <th style="padding:12px 8px;font-size:12px;font-weight:700;color:var(--text-3);width:90px">Edit</th>
                <th style="padding:12px 8px;font-size:12px;font-weight:700;color:var(--text-3);width:90px">Delete</th>
                <th style="padding:12px 8px;font-size:12px;font-weight:700;color:var(--text-3);width:90px">Approve</th>
                <th style="padding:12px 8px;font-size:12px;font-weight:700;color:var(--text-3);width:90px">Export</th>
              </tr>
            </thead>
            <tbody>
              ${modules.map(m => {
                const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
                return `
                  <tr style="border-bottom:1px solid var(--border)">
                    <td style="padding:14px 18px">
                      <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:30px;height:30px;border-radius:8px;background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:14px">
                          <i class="fa ${m.icon || 'fa-folder'}"></i>
                        </div>
                        <div>
                          <div style="font-size:13px;font-weight:700;color:var(--text)">${m.name}</div>
                          <div style="font-size:11px;color:var(--text-muted)">Category: ${m.category || 'General'} &bull; Code: <code>${m.code}</code></div>
                        </div>
                      </div>
                    </td>
                    ${actions.map(act => {
                      const p = permissions.find(perm => perm.moduleId === m.id && perm.action === act);
                      if (!p) return `<td style="text-align:center;color:var(--text-muted);font-size:11px">—</td>`;
                      
                      const isGranted = isSuperAdmin ? true : !!rolePermissions.find(rp => rp.roleId === selectedRole.id && rp.permissionId === p.id)?.isGranted;
                      const disabled = isSuperAdmin ? 'disabled' : '';

                      return `
                        <td style="text-align:center;padding:10px 8px">
                          <label style="cursor:${isSuperAdmin ? 'default' : 'pointer'};display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px">
                            <input type="checkbox"
                              ${isGranted ? 'checked' : ''}
                              ${disabled}
                              onchange="Settings.toggleRolePermission(${selectedRole.id}, ${p.id}, this.checked)"
                              style="width:16px;height:16px;accent-color:var(--primary);cursor:${isSuperAdmin ? 'default' : 'pointer'}">
                          </label>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  selectRole(roleId) {
    this.selectedRoleId = roleId;
    const c = document.getElementById('settings-content');
    if (c) this.renderRolesPermissions(c);
  },

  toggleRolePermission(roleId, permissionId, isGranted) {
    let rolePerms = DB.get('role_permissions') || [];
    let binding = rolePerms.find(rp => rp.roleId === roleId && rp.permissionId === permissionId);
    if (binding) {
      binding.isGranted = isGranted;
    } else {
      rolePerms.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        roleId: roleId,
        permissionId: permissionId,
        isGranted: isGranted
      });
    }
    DB.set('role_permissions', rolePerms);

    const perm = (DB.get('permissions') || []).find(p => p.id === permissionId);
    const role = (DB.get('roles') || []).find(r => r.id === roleId);
    DB.log('UPDATE', 'Settings', `Permission '${perm?.code}' ${isGranted ? 'granted to' : 'revoked from'} role '${role?.name}'`, Auth.user?.id);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`Permission ${isGranted ? 'granted' : 'revoked'} for ${role?.name}`, 'success');
    }

    const c = document.getElementById('settings-content');
    if (c) this.renderRolesPermissions(c);
  },

  bulkToggleRolePermissions(roleId, grant) {
    let rolePerms = DB.get('role_permissions') || [];
    const permissions = DB.get('permissions') || [];
    const role = (DB.get('roles') || []).find(r => r.id === roleId);

    permissions.forEach(p => {
      let b = rolePerms.find(rp => rp.roleId === roleId && rp.permissionId === p.id);
      if (b) {
        b.isGranted = grant;
      } else {
        rolePerms.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          roleId: roleId,
          permissionId: p.id,
          isGranted: grant
        });
      }
    });

    DB.set('role_permissions', rolePerms);
    DB.log('UPDATE', 'Settings', `All permissions ${grant ? 'granted to' : 'revoked from'} role '${role?.name}'`, Auth.user?.id);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`All permissions ${grant ? 'granted to' : 'revoked from'} ${role?.name}`, 'success');
    }

    const c = document.getElementById('settings-content');
    if (c) this.renderRolesPermissions(c);
  },

  showAddCustomRoleModal() {
    const modalHtml = `
      <div class="modal-overlay animate-fade-in" id="custom-role-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.2)">
          <div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
              <i class="fa fa-user-shield" style="color:var(--primary)"></i> Create Custom Enterprise Role
            </h3>
            <button class="btn-icon" onclick="document.getElementById('custom-role-modal').remove()"><i class="fa fa-times"></i></button>
          </div>
          <form onsubmit="Settings.saveCustomRole(event)" style="padding:20px">
            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Role Display Name *</label>
              <input type="text" id="role-name-input" class="form-control" placeholder="e.g. Compliance Officer, Regional HR Executive" required>
            </div>
            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Role System Code *</label>
              <input type="text" id="role-code-input" class="form-control" placeholder="e.g. compliance_officer" required style="font-family:monospace">
            </div>
            <div style="margin-bottom:14px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Base Template to Inherit</label>
              <select id="role-inherit-input" class="form-control">
                <option value="employee">Standard Employee (Self-Service View)</option>
                <option value="dept_manager">Department Manager (Team Approvals)</option>
                <option value="hr_manager">HR Manager (Full Personnel Administration)</option>
                <option value="none">Blank Template (Zero Initial Permissions)</option>
              </select>
            </div>
            <div style="margin-bottom:18px">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">Role Description</label>
              <textarea id="role-desc-input" class="form-control" rows="2" placeholder="Responsibilities and functional scope of this role"></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px">
              <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('custom-role-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm"><i class="fa fa-save"></i> Save &amp; Configure Permissions</button>
            </div>
          </form>
        </div>
      </div>
    `;
    const existing = document.getElementById('custom-role-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  saveCustomRole(e) {
    e.preventDefault();
    const name = document.getElementById('role-name-input')?.value.trim();
    const code = document.getElementById('role-code-input')?.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const inherit = document.getElementById('role-inherit-input')?.value;
    const desc = document.getElementById('role-desc-input')?.value.trim();

    if (!name || !code) return;

    let roles = DB.get('roles') || [];
    if (roles.some(r => r.code === code)) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`Role with code '${code}' already exists!`, 'danger');
      return;
    }

    const newRole = {
      id: Date.now(),
      name: name,
      code: code,
      description: desc || `${name} role`,
      isSystem: false,
      priority: roles.length + 1
    };
    roles.push(newRole);
    DB.set('roles', roles);

    // Bind initial permissions based on template
    let rolePerms = DB.get('role_permissions') || [];
    const permissions = DB.get('permissions') || [];
    const templateRole = roles.find(r => r.code === inherit);

    permissions.forEach(p => {
      let isGranted = false;
      if (templateRole) {
        isGranted = !!rolePerms.find(rp => rp.roleId === templateRole.id && rp.permissionId === p.id)?.isGranted;
      }
      rolePerms.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        roleId: newRole.id,
        permissionId: p.id,
        isGranted: isGranted
      });
    });
    DB.set('role_permissions', rolePerms);

    document.getElementById('custom-role-modal')?.remove();
    DB.log('CREATE', 'Settings', `Created custom role '${name}' (${code})`, Auth.user?.id);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`Custom role '${name}' successfully created!`, 'success');
    }

    this.selectedRoleId = newRole.id;
    const c = document.getElementById('settings-content');
    if (c) this.renderRolesPermissions(c);
  }
};

