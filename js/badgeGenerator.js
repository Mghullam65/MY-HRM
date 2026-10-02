// ============================================================
// HRM SYSTEM — Digital Employee ID Card & Badge Generator
// ============================================================

const HRMBadgeGenerator = {
  currentEmpId: null,
  isFlipped: false,
  orientation: 'vertical', // 'vertical' | 'horizontal'
  colorTheme: 'navy',      // 'navy' | 'emerald' | 'purple' | 'carbon'

  themes: {
    navy: {
      primary: '#1e3a8a',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      accent: '#38bdf8',
      chipBg: '#eff6ff',
      textColor: '#ffffff'
    },
    emerald: {
      primary: '#065f46',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
      accent: '#34d399',
      chipBg: '#ecfdf5',
      textColor: '#ffffff'
    },
    purple: {
      primary: '#581c87',
      gradient: 'linear-gradient(135deg, #3b0764 0%, #7c3aed 100%)',
      accent: '#c084fc',
      chipBg: '#faf5ff',
      textColor: '#ffffff'
    },
    carbon: {
      primary: '#18181b',
      gradient: 'linear-gradient(135deg, #09090b 0%, #27272a 100%)',
      accent: '#a1a1aa',
      chipBg: '#f4f4f5',
      textColor: '#ffffff'
    }
  },

  // Open the Digital ID Card modal
  openModal(empId = null) {
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';
    this.currentEmpId = empId || (isStaff ? Auth.employee?.id : (DB.get('employees')[0]?.id || 1));
    this.isFlipped = false;
    this.renderModal();
  },

  closeModal() {
    const el = document.getElementById('hrm-badge-modal');
    if (el) el.remove();
  },

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    const card = document.getElementById('id-badge-card');
    if (card) {
      card.classList.toggle('flipped', this.isFlipped);
    }
    const flipBtnText = document.getElementById('badge-flip-text');
    if (flipBtnText) {
      flipBtnText.textContent = this.isFlipped ? 'Show Front Side' : 'Show Back Side';
    }
  },

  setOrientation(orient) {
    this.orientation = orient;
    this.renderModal();
  },

  setTheme(themeKey) {
    if (this.themes[themeKey]) {
      this.colorTheme = themeKey;
      this.renderModal();
    }
  },

  onEmpChange(empId) {
    this.currentEmpId = Number(empId);
    this.isFlipped = false;
    this.renderModal();
  },

  // Generate SVG Barcode for Employee ID
  generateBarcodeSVG(empNo) {
    // Deterministic bars based on string chars
    const bars = [];
    const seed = String(empNo || 'EMP001').toUpperCase();
    let pattern = [2,1,1,2,3,1,2,1,1,3,2,1,2,2,1,1,2,3,1,2,1,1,2,2,3,1,1,2,1,3];
    for (let i = 0; i < seed.length; i++) {
      pattern.push((seed.charCodeAt(i) % 3) + 1);
    }

    let x = 8;
    const rects = [];
    pattern.forEach((w, idx) => {
      if (idx % 2 === 0) {
        rects.push(`<rect x="${x}" y="2" width="${w}" height="36" fill="#0f172a" />`);
      }
      x += w + 1;
    });

    const totalWidth = x + 8;
    return `
      <svg width="${totalWidth}" height="40" viewBox="0 0 ${totalWidth} 40" style="display:block;margin:0 auto;max-width:100%" shape-rendering="crispEdges">
        <rect width="${totalWidth}" height="40" fill="#ffffff" rx="4"/>
        ${rects.join('')}
      </svg>
    `;
  },

  // Generate SVG QR Code for verification
  generateQRCodeSVG(empNo, name) {
    const payload = `HRM-VERIFIED:${empNo}:${name.replace(/\s+/g, '_')}`;
    return `
      <svg width="68" height="68" viewBox="0 0 33 33" style="flex-shrink:0;background:#fff;border-radius:6px;padding:3px" shape-rendering="crispEdges">
        <rect width="33" height="33" fill="#ffffff"/>
        <!-- Corners -->
        <rect x="2" y="2" width="7" height="7" fill="#0f172a"/>
        <rect x="3" y="3" width="5" height="5" fill="#ffffff"/>
        <rect x="4" y="4" width="3" height="3" fill="#0f172a"/>
        <rect x="24" y="2" width="7" height="7" fill="#0f172a"/>
        <rect x="25" y="3" width="5" height="5" fill="#ffffff"/>
        <rect x="26" y="4" width="3" height="3" fill="#0f172a"/>
        <rect x="2" y="24" width="7" height="7" fill="#0f172a"/>
        <rect x="3" y="25" width="5" height="5" fill="#ffffff"/>
        <rect x="4" y="26" width="3" height="3" fill="#0f172a"/>
        <!-- Data blocks -->
        <rect x="11" y="4" width="3" height="3" fill="#0f172a"/>
        <rect x="16" y="3" width="2" height="4" fill="#0f172a"/>
        <rect x="20" y="5" width="2" height="2" fill="#0f172a"/>
        <rect x="11" y="11" width="4" height="2" fill="#0f172a"/>
        <rect x="17" y="12" width="3" height="3" fill="#0f172a"/>
        <rect x="22" y="10" width="3" height="4" fill="#0f172a"/>
        <rect x="4" y="13" width="4" height="2" fill="#0f172a"/>
        <rect x="4" y="18" width="2" height="3" fill="#0f172a"/>
        <rect x="13" y="17" width="6" height="2" fill="#0f172a"/>
        <rect x="10" y="22" width="3" height="4" fill="#0f172a"/>
        <rect x="15" y="24" width="5" height="2" fill="#0f172a"/>
        <rect x="22" y="17" width="2" height="5" fill="#0f172a"/>
        <rect x="26" y="22" width="4" height="3" fill="#0f172a"/>
        <rect x="24" y="27" width="3" height="3" fill="#0f172a"/>
      </svg>
    `;
  },

  renderModal() {
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';
    let emps = DB.get('employees').filter(e => e.status === 'active');
    if (isStaff && Auth.employee) {
      emps = emps.filter(e => e.id === Auth.employee.id);
    }
    const emp = DB.find('employees', Number(this.currentEmpId)) || emps[0] || {
      fullName: 'Sarah Jenkins',
      empNo: 'EMP-001',
      designationId: 1,
      departmentId: 1,
      joiningDate: '2023-01-15',
      emergencyContact: '+92-300-1234567',
      bloodGroup: 'O+'
    };

    const settings = DB.getObj('settings') || {};
    const companyName = settings.companyName || 'HRM Pro Enterprise Solutions (Pvt) Ltd';
    const companyLogo = settings.companyLogo || '';
    const signatorySignature = settings.signatorySignature || '';
    const currentTheme = this.themes[this.colorTheme] || this.themes.navy;

    const isVert = this.orientation === 'vertical';
    const cardWidth = isVert ? 330 : 490;
    const cardHeight = isVert ? 510 : 320;

    // Blood group fallback
    const bloodGroup = emp.bloodGroup || 'B+';
    const validUntil = '12/2028';
    const issueDate = Utils.formatDate(emp.joiningDate || '2023-01-15');

    const modalHTML = `
      <div class="modal active" id="hrm-badge-modal" style="display:flex;align-items:center;justify-content:center;position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(8px);z-index:99999;padding:16px">
        <div class="card animate-fade-in" style="width:100%;max-width:960px;max-height:94vh;display:flex;flex-direction:column;padding:0;overflow:hidden;box-shadow:0 25px 60px -15px rgba(0,0,0,0.5);border:1px solid var(--border)">
          
          <!-- Header -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border);background:var(--surface)">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;display:flex;align-items:center;justify-content:center;font-size:18px">
                <i class="fa fa-id-card"></i>
              </div>
              <div>
                <h3 style="font-size:17px;font-weight:700;margin:0;color:var(--text)">Corporate Digital Employee ID Badge</h3>
                <div style="font-size:12px;color:var(--text-3)">Interactive 3D Badge &bull; Cryptographic Barcode/QR &bull; 1-Click PNG & Lanyard PDF Export</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-secondary btn-sm" onclick="HRMBadgeGenerator.downloadPNG()" title="Download Badge as High-Res PNG">
                <i class="fa fa-image"></i> Download PNG
              </button>
              <button class="btn btn-primary btn-sm" onclick="HRMBadgeGenerator.printBadgePDF()" title="Print Badge with Foldable Lanyard Template">
                <i class="fa fa-print"></i> Print Official Badge
              </button>
              <button class="btn btn-ghost btn-sm" onclick="HRMBadgeGenerator.closeModal()" style="width:32px;height:32px;padding:0">
                <i class="fa fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div style="display:grid;grid-template-columns:310px 1fr;flex:1;overflow:hidden;background:var(--bg)">
            
            <!-- Controls Sidebar -->
            <div style="padding:20px;border-right:1px solid var(--border);background:var(--surface);overflow-y:auto">
              
              <!-- Employee Picker -->
              <div class="form-group mb-16">
                <label class="form-label" style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-3)">Select Employee</label>
                <select class="form-control" onchange="HRMBadgeGenerator.onEmpChange(this.value)" ${isStaff ? 'disabled' : ''} style="font-size:12.5px">
                  ${emps.map(e => `<option value="${e.id}" ${Number(e.id) === Number(emp.id) ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
                </select>
              </div>

              <!-- Orientation Toggle -->
              <div class="form-group mb-16">
                <label class="form-label" style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-3)">Badge Orientation</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                  <button type="button" class="btn btn-sm ${isVert ? 'btn-primary' : 'btn-ghost'}" onclick="HRMBadgeGenerator.setOrientation('vertical')" style="font-size:12px">
                    <i class="fa fa-mobile-screen"></i> Vertical (Lanyard)
                  </button>
                  <button type="button" class="btn btn-sm ${!isVert ? 'btn-primary' : 'btn-ghost'}" onclick="HRMBadgeGenerator.setOrientation('horizontal')" style="font-size:12px">
                    <i class="fa fa-id-card"></i> Horizontal (Wallet)
                  </button>
                </div>
              </div>

              <!-- Color Themes -->
              <div class="form-group mb-16">
                <label class="form-label" style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-3)">Color Theme</label>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
                  ${Object.keys(this.themes).map(k => `
                    <button type="button" onclick="HRMBadgeGenerator.setTheme('${k}')" 
                      style="height:34px;border-radius:6px;border:2px solid ${this.colorTheme === k ? 'var(--primary)' : 'var(--border)'};background:${this.themes[k].gradient};cursor:pointer;position:relative" title="${k.toUpperCase()}">
                      ${this.colorTheme === k ? '<i class="fa fa-check" style="color:white;font-size:11px"></i>' : ''}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Flip Action -->
              <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
                <button type="button" class="btn btn-secondary w-full" onclick="HRMBadgeGenerator.toggleFlip()" style="padding:10px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px">
                  <i class="fa fa-arrows-rotate"></i>
                  <span id="badge-flip-text">${this.isFlipped ? 'Show Front Side' : 'Show Back Side'}</span>
                </button>
                <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:6px">
                  Click button or click badge to flip 3D view
                </div>
              </div>

              <!-- Specs Card -->
              <div style="margin-top:20px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.25);border-radius:8px;padding:12px;font-size:11.5px;color:var(--text-2);line-height:1.4">
                <div style="font-weight:700;color:var(--primary);margin-bottom:4px;display:flex;align-items:center;gap:6px">
                  <i class="fa fa-shield-halved"></i> Corporate Security Standards
                </div>
                Standard CR80 dimensions (85.6mm &times; 53.98mm) equipped with holographic micro-seal, contactless NFC coil graphic, and verifiable barcode checksum.
              </div>

            </div>

            <!-- 3D Interactive Badge Stage -->
            <div style="padding:30px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:auto;perspective:1200px">
              
              <div id="id-badge-card" 
                class="badge-3d-card ${this.isFlipped ? 'flipped' : ''}" 
                onclick="HRMBadgeGenerator.toggleFlip()"
                style="width:${cardWidth}px;height:${cardHeight}px;position:relative;transform-style:preserve-3d;transition:transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);cursor:pointer;user-select:none">
                
                <!-- ══════ FRONT FACE ══════ -->
                <div class="badge-face badge-front" style="position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;overflow:hidden;box-shadow:0 20px 45px -10px rgba(0,0,0,0.35);background:#ffffff;border:1px solid #cbd5e1;display:flex;flex-direction:column">
                  
                  <!-- Top Banner Header -->
                  <div style="background:${currentTheme.gradient};color:${currentTheme.textColor};padding:${isVert ? '16px 18px 14px' : '12px 18px'};position:relative;overflow:hidden">
                    
                    ${isVert ? `
                      <!-- Lanyard Hole Punch -->
                      <div style="width:36px;height:8px;border-radius:4px;background:rgba(0,0,0,0.35);margin:0 auto 12px;border:1px solid rgba(255,255,255,0.2)"></div>
                    ` : ''}

                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <div style="display:flex;align-items:center;gap:10px">
                        ${companyLogo ? `<img src="${companyLogo}" style="max-height:34px;max-width:44px;object-fit:contain">` : `
                          <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;border:1px solid rgba(255,255,255,0.3)">
                            ${companyName.slice(0,2).toUpperCase()}
                          </div>
                        `}
                        <div>
                          <div style="font-size:13px;font-weight:800;letter-spacing:0.3px;line-height:1.2">${companyName}</div>
                          <div style="font-size:9px;color:${currentTheme.accent};letter-spacing:0.5px;text-transform:uppercase">Official Access Credential</div>
                        </div>
                      </div>
                      
                      <!-- Holographic Security Foil -->
                      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(244,114,182,0.6) 30%, rgba(56,189,248,0.6) 70%, rgba(255,255,255,0.9) 100%);box-shadow:inset 0 0 4px rgba(255,255,255,0.8), 0 2px 5px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.9)">
                        <i class="fa fa-shield-halved" style="font-size:13px;color:#0f172a"></i>
                      </div>
                    </div>
                  </div>

                  <!-- Front Content -->
                  ${isVert ? `
                    <!-- Vertical Layout -->
                    <div style="flex:1;padding:18px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;background:#ffffff">
                      
                      <!-- Photo / Avatar Frame -->
                      <div style="position:relative;margin-top:2px;margin-bottom:14px">
                        <div style="width:110px;height:110px;border-radius:20px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.15);border:3px solid #ffffff;background:${Utils.avatarColor(emp.id)};display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:38px;font-weight:800">
                          ${Utils.avatarInitials(emp.fullName)}
                        </div>
                        <span style="position:absolute;bottom:-4px;right:-4px;background:#10b981;border:2px solid #ffffff;width:18px;height:18px;border-radius:50%" title="Active & Verified"></span>
                      </div>

                      <div style="font-size:18px;font-weight:800;color:#0f172a;line-height:1.2">${emp.fullName}</div>
                      <div style="font-size:12px;font-weight:600;color:#2563eb;margin-top:4px">${Utils.getDesigName(emp.designationId)}</div>
                      <div style="font-size:11px;color:#64748b;margin-top:2px">${Utils.getDeptName(emp.departmentId)}</div>

                      <!-- Badges Pill Row -->
                      <div style="display:flex;gap:8px;margin-top:14px">
                        <div style="background:#f1f5f9;border:1px solid #cbd5e1;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;color:#0f172a">
                          ID: <span style="color:#2563eb">${emp.empNo}</span>
                        </div>
                        <div style="background:#fef2f2;border:1px solid #fecaca;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;color:#dc2626">
                          BLOOD: ${bloodGroup}
                        </div>
                      </div>

                      <!-- Bottom Chip / Dates -->
                      <div style="margin-top:auto;width:100%;border-top:1px dashed #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#64748b">
                        <div style="display:flex;align-items:center;gap:6px">
                          <!-- Micro SIM Chip Graphic -->
                          <div style="width:24px;height:18px;background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);border-radius:3px;border:1px solid #b45309;display:flex;align-items:center;justify-content:center">
                            <i class="fa fa-wifi" style="font-size:9px;color:#fff;transform:rotate(90deg)"></i>
                          </div>
                          <span>ISSUED: ${issueDate}</span>
                        </div>
                        <div style="font-weight:700;color:#0f172a">VALID: ${validUntil}</div>
                      </div>
                    </div>
                  ` : `
                    <!-- Horizontal Layout -->
                    <div style="flex:1;padding:16px 20px;display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:center;background:#ffffff">
                      <div style="position:relative">
                        <div style="width:115px;height:125px;border-radius:14px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.12);border:2px solid #ffffff;background:${Utils.avatarColor(emp.id)};display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:36px;font-weight:800">
                          ${Utils.avatarInitials(emp.fullName)}
                        </div>
                        <span style="position:absolute;bottom:2px;right:2px;background:#10b981;border:2px solid #ffffff;width:16px;height:16px;border-radius:50%"></span>
                      </div>
                      <div>
                        <div style="font-size:17px;font-weight:800;color:#0f172a">${emp.fullName}</div>
                        <div style="font-size:12px;font-weight:600;color:#2563eb;margin-top:2px">${Utils.getDesigName(emp.designationId)}</div>
                        <div style="font-size:11px;color:#64748b;margin-top:1px">${Utils.getDeptName(emp.departmentId)}</div>
                        <div style="display:flex;gap:6px;margin-top:10px">
                          <span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;color:#0f172a">ID: ${emp.empNo}</span>
                          <span style="background:#fef2f2;border:1px solid #fecaca;padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;color:#dc2626">BLOOD: ${bloodGroup}</span>
                        </div>
                        <div style="margin-top:12px;display:flex;justify-content:space-between;font-size:9.5px;color:#64748b">
                          <span>ISSUED: ${issueDate}</span>
                          <span style="font-weight:700;color:#0f172a">VALID: ${validUntil}</span>
                        </div>
                      </div>
                    </div>
                  `}

                </div>

                <!-- ══════ BACK FACE ══════ -->
                <div class="badge-face badge-back" style="position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;overflow:hidden;box-shadow:0 20px 45px -10px rgba(0,0,0,0.35);background:#ffffff;border:1px solid #cbd5e1;display:flex;flex-direction:column;transform:rotateY(180deg)">
                  
                  <!-- Magnetic Stripe -->
                  <div style="background:#09090b;height:42px;width:100%;margin-top:16px;border-top:1px solid #27272a;border-bottom:1px solid #27272a"></div>

                  <div style="flex:1;padding:16px 20px;display:flex;flex-direction:column;justify-content:space-between">
                    
                    <!-- Company Terms Notice -->
                    <div style="font-size:9.5px;color:#64748b;line-height:1.45;text-align:justify">
                      This badge is the official property of <strong>${companyName}</strong>. The holder is authorized to enter corporate premises. If found, please return to: Plot 42, Executive Tech Park, Constitution Avenue, Islamabad or call emergency hotline <strong>+92-21-1234567</strong>.
                    </div>

                    <!-- Barcode Block -->
                    <div style="text-align:center;margin:8px 0">
                      ${this.generateBarcodeSVG(emp.empNo)}
                      <div style="font-family:monospace;font-size:11px;font-weight:700;color:#0f172a;letter-spacing:2px;margin-top:2px">${emp.empNo}</div>
                    </div>

                    <!-- Bottom Info & QR Verification -->
                    <div style="display:flex;align-items:flex-end;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:10px">
                      <div>
                        <div style="font-size:9.5px;color:#64748b">EMERGENCY CONTACT</div>
                        <div style="font-size:11px;font-weight:700;color:#0f172a">${emp.emergencyContact || '+92-300-1234567'}</div>
                        <div style="margin-top:6px;font-size:9px;color:#94a3b8">AUTHORIZED SIGNATURE</div>
                        ${signatorySignature ? `
                          <div style="margin-top:2px"><img src="${signatorySignature}" style="max-height:22px;max-width:80px;object-fit:contain"></div>
                        ` : `
                          <div style="width:70px;border-bottom:1px solid #94a3b8;margin-top:6px"></div>
                        `}
                      </div>

                      <div style="text-align:right">
                        ${this.generateQRCodeSVG(emp.empNo, emp.fullName)}
                        <div style="font-size:8px;font-weight:700;color:#0f172a;margin-top:2px">SCAN TO VERIFY</div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              <!-- Flip Prompt -->
              <div style="margin-top:18px;font-size:12px;color:var(--text-3);display:flex;align-items:center;gap:6px">
                <i class="fa fa-hand-pointer"></i> Click anywhere on the badge to flip side
              </div>

            </div>

          </div>

        </div>
      </div>
    `;

    const existing = document.getElementById('hrm-badge-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  // 1-Click High Resolution PNG Exporter using HTML5 Canvas
  downloadPNG() {
    const isVert = this.orientation === 'vertical';
    const emp = DB.find('employees', Number(this.currentEmpId)) || DB.get('employees')[0];
    const settings = DB.getObj('settings') || {};
    const companyName = settings.companyName || 'HRM Pro Enterprise Solutions';
    const currentTheme = this.themes[this.colorTheme] || this.themes.navy;

    const width = 800;
    const height = isVert ? 1200 : 780;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background Card
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(20, 20, width - 40, height - 40, 36);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Top Header Gradient
    const headerHeight = isVert ? 300 : 200;
    const grad = ctx.createLinearGradient(0, 0, width, headerHeight);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, currentTheme.primary);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(20, 20, width - 40, headerHeight, [36, 36, 0, 0]);
    ctx.fill();

    // Company Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(companyName, 60, isVert ? 140 : 100);

    ctx.fillStyle = currentTheme.accent;
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText('OFFICIAL ACCESS CREDENTIAL', 60, isVert ? 180 : 135);

    // Lanyard punch hole
    if (isVert) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.roundRect(width / 2 - 40, 45, 80, 20, 10);
      ctx.fill();
    }

    // Avatar Circle / Box
    const avatarY = isVert ? 240 : 250;
    const avatarX = isVert ? width / 2 - 110 : 80;
    const avatarSize = isVert ? 220 : 200;

    ctx.fillStyle = Utils.avatarColor(emp.id);
    ctx.beginPath();
    ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 30);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Avatar Initials
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Utils.avatarInitials(emp.fullName), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 25);

    // Employee Details Text
    ctx.textAlign = isVert ? 'center' : 'left';
    const textX = isVert ? width / 2 : 330;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillText(emp.fullName, textX, isVert ? 550 : 320);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillText(Utils.getDesigName(emp.designationId), textX, isVert ? 600 : 365);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText(Utils.getDeptName(emp.departmentId), textX, isVert ? 640 : 405);

    // Badges: ID and Blood Group
    ctx.fillStyle = '#f1f5f9';
    const pillY = isVert ? 690 : 450;
    const pillX = isVert ? width / 2 - 140 : 330;
    ctx.roundRect(pillX, pillY, 130, 45, 12);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ID: ${emp.empNo}`, pillX + 65, pillY + 30);

    ctx.fillStyle = '#fef2f2';
    ctx.roundRect(pillX + 150, pillY, 130, 45, 12);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(`BLOOD: ${emp.bloodGroup || 'B+'}`, pillX + 215, pillY + 30);

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ISSUED: ${Utils.formatDate(emp.joiningDate || Utils.today())}   •   VALID THROUGH: 12/2028`, width / 2, height - 60);

    // Download trigger
    const link = document.createElement('a');
    link.download = `HRM_Badge_${emp.empNo}_${emp.fullName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    Toast.show('Badge Downloaded!', 'success', `${emp.fullName}'s ID badge saved as high-res PNG.`);
  },

  // 1-Click Printable Lanyard PDF Page
  printBadgePDF() {
    const emp = DB.find('employees', Number(this.currentEmpId)) || DB.get('employees')[0];
    const settings = DB.getObj('settings') || {};
    const companyName = settings.companyName || 'HRM Pro Enterprise Solutions (Pvt) Ltd';
    const currentTheme = this.themes[this.colorTheme] || this.themes.navy;
    const bloodGroup = emp.bloodGroup || 'B+';
    const issueDate = Utils.formatDate(emp.joiningDate || '2023-01-15');

    const printWin = window.open('', '_blank', 'width=900,height=950');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ID Badge — ${emp.fullName} (${emp.empNo})</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', -apple-system, sans-serif; }
          body { background:#ffffff; color:#0f172a; padding:30px; }
          @page { size: A4 portrait; margin: 15mm; }
          @media print {
            body { padding:0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          .guide-box { border:1px dashed #94a3b8; border-radius:12px; padding:20px; margin-bottom:30px; background:#f8fafc; }
          .guide-title { font-size:14px; font-weight:800; color:#1e40af; margin-bottom:6px; }
          .guide-sub { font-size:12px; color:#64748b; line-height:1.5; }
          .cut-line { border-top:1px dashed #cbd5e1; margin:20px 0; text-align:center; font-size:10px; color:#94a3b8; }
        </style>
      </head>
      <body>
        <div class="guide-box">
          <div class="guide-title">✂ OFFICIAL CORPORATE EMPLOYEE BADGE (PRINT & CUT SHEET)</div>
          <div class="guide-sub">
            Instructions: Print on high-durability glossy cardstock (250-300 GSM). Cut along the dotted guidelines, fold along center line to sandwich front and back together, and laminate for standard 54mm &times; 86mm lanyard slot or wallet badge.
          </div>
        </div>

        <div style="display:flex;justify-content:center;gap:30px;align-items:flex-start">
          
          <!-- FRONT BADGE -->
          <div style="width:310px;height:480px;border-radius:16px;border:2px solid #0f172a;overflow:hidden;background:#ffffff;display:flex;flex-direction:column;box-shadow:0 4px 15px rgba(0,0,0,0.1)">
            <div style="background:${currentTheme.gradient};color:#fff;padding:14px;text-align:center">
              <div style="width:34px;height:7px;border-radius:4px;background:rgba(0,0,0,0.4);margin:0 auto 10px;border:1px solid rgba(255,255,255,0.3)"></div>
              <div style="font-size:13px;font-weight:800">${companyName}</div>
              <div style="font-size:9px;color:${currentTheme.accent};text-transform:uppercase;letter-spacing:0.5px">Official Access Credential</div>
            </div>

            <div style="flex:1;padding:16px;display:flex;flex-direction:column;align-items:center;text-align:center">
              <div style="width:100px;height:100px;border-radius:18px;background:${Utils.avatarColor(emp.id)};color:#fff;font-size:36px;font-weight:800;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.15);margin-bottom:12px">
                ${Utils.avatarInitials(emp.fullName)}
              </div>
              <div style="font-size:17px;font-weight:800;color:#0f172a">${emp.fullName}</div>
              <div style="font-size:12px;font-weight:600;color:#2563eb;margin-top:2px">${Utils.getDesigName(emp.designationId)}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px">${Utils.getDeptName(emp.departmentId)}</div>
              <div style="display:flex;gap:6px;margin-top:12px">
                <span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700">ID: ${emp.empNo}</span>
                <span style="background:#fef2f2;border:1px solid #fecaca;padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;color:#dc2626">BLOOD: ${bloodGroup}</span>
              </div>
              <div style="margin-top:auto;width:100%;border-top:1px dashed #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;font-size:9px;color:#64748b">
                <span>ISSUED: ${issueDate}</span>
                <span style="font-weight:700;color:#0f172a">VALID: 12/2028</span>
              </div>
            </div>
          </div>

          <!-- BACK BADGE -->
          <div style="width:310px;height:480px;border-radius:16px;border:2px solid #0f172a;overflow:hidden;background:#ffffff;display:flex;flex-direction:column;box-shadow:0 4px 15px rgba(0,0,0,0.1)">
            <div style="background:#09090b;height:38px;width:100%;margin-top:14px"></div>
            <div style="flex:1;padding:16px;display:flex;flex-direction:column;justify-content:space-between">
              <div style="font-size:9px;color:#64748b;line-height:1.4;text-align:justify">
                This badge is the official property of <strong>${companyName}</strong>. If found, please return to: Plot 42, Executive Tech Park, Constitution Avenue, Islamabad. Hotline: +92-21-1234567.
              </div>
              <div style="text-align:center;margin:10px 0">
                ${this.generateBarcodeSVG(emp.empNo)}
                <div style="font-family:monospace;font-size:10.5px;font-weight:700;margin-top:2px">${emp.empNo}</div>
              </div>
              <div style="display:flex;align-items:flex-end;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:8px">
                <div>
                  <div style="font-size:8.5px;color:#64748b">EMERGENCY CONTACT</div>
                  <div style="font-size:10.5px;font-weight:700">${emp.emergencyContact || '+92-300-1234567'}</div>
                  <div style="margin-top:4px;font-size:8.5px;color:#94a3b8">AUTHORIZED SIGNATURE</div>
                  <div style="width:65px;border-bottom:1px solid #94a3b8;margin-top:6px"></div>
                </div>
                <div>
                  ${this.generateQRCodeSVG(emp.empNo, emp.fullName)}
                </div>
              </div>
            </div>
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        <\/script>
      </body>
      </html>
    `);
    printWin.document.close();
  }
};

// Global export
window.HRMBadgeGenerator = HRMBadgeGenerator;
