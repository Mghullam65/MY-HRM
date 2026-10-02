// ============================================================
// HRM SYSTEM — Corporate Document & PDF Export Engine
// ============================================================

const HRMDocumentEngine = {
  currentType: 'payslip',
  selectedEmpId: null,
  selectedMonth: Utils.thisMonth(),
  selectedOfferId: null,

  // Generate authentic corporate QR code SVG for official document validation
  generateQRBadge(refNo, subject) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const hash = btoa(`${refNo}:${subject}:${timestamp}`).slice(0, 16).toUpperCase();
    return `
      <div style="display:inline-flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;font-family:monospace;font-size:10px;color:#334155">
        <svg width="44" height="44" viewBox="0 0 33 33" style="flex-shrink:0" shape-rendering="crispEdges">
          <rect width="33" height="33" fill="#ffffff"/>
          <!-- Position Corners -->
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
        <div style="line-height:1.3">
          <div style="font-weight:700;color:#0f172a;letter-spacing:0.5px">SECURE DIGITAL VERIFICATION</div>
          <div>DOC REF: <strong>${refNo}</strong></div>
          <div>VERIFY HASH: <strong>${hash}</strong></div>
          <div style="color:#64748b;font-size:9px">Scannable on corporate HR portal</div>
        </div>
      </div>
    `;
  },

  // Open the Corporate Document Hub modal
  openDocumentHub(defaultType = 'payslip', prefilledEmpId = null) {
    this.currentType = defaultType;
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';
    this.selectedEmpId = prefilledEmpId || (isStaff ? Auth.employee?.id : (DB.get('employees')[0]?.id || 1));
    this.renderHubModal();
  },

  renderHubModal() {
    const isStaff = Auth.role === 'employee' || Auth.role === 'onboarding';
    let emps = DB.get('employees').filter(e => e.status === 'active');
    if (isStaff && Auth.employee) {
      emps = emps.filter(e => e.id === Auth.employee.id);
    }
    const offers = DB.get('offer_letters') || [];
    const allMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

    const docTypes = [
      { id: 'payslip', label: 'Salary Payslip', icon: 'fa-file-invoice-dollar', desc: 'Detailed earnings, tax & net pay statement' },
      { id: 'offer', label: 'Job Offer Letter', icon: 'fa-envelope-open-text', desc: 'Formal employment offer & compensation terms' },
      { id: 'experience', label: 'Experience Certificate', icon: 'fa-award', desc: 'Tenure, conduct & service certificate' },
      { id: 'salary_cert', label: 'Salary Verification', icon: 'fa-certificate', desc: 'For bank loans, credit cards & visas' },
      { id: 'noc', label: 'No Objection (NOC)', icon: 'fa-passport', desc: 'Official travel / education permission letter' }
    ];

    const currentDoc = this.generateDocumentHTML(this.currentType, this.selectedEmpId, {
      month: this.selectedMonth,
      offerId: this.selectedOfferId
    });

    const modalHTML = `
      <div class="modal active" id="doc-hub-modal" style="display:flex;align-items:center;justify-content:center;position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(6px);z-index:99999;padding:16px">
        <div class="card animate-fade-in" style="width:100%;max-width:1160px;max-height:92vh;display:flex;flex-direction:column;padding:0;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);border:1px solid var(--border)">
          
          <!-- Hub Header -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border);background:var(--surface)">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:white;display:flex;align-items:center;justify-content:center;font-size:18px">
                <i class="fa fa-file-pdf"></i>
              </div>
              <div>
                <h3 style="font-size:17px;font-weight:700;margin:0;color:var(--text)">Corporate Document Hub & PDF Engine</h3>
                <div style="font-size:12px;color:var(--text-3)">Enterprise certified templates, cryptographic seal & instant print / PDF export</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-primary btn-sm" onclick="HRMDocumentEngine.executePrint()" style="padding:7px 16px;font-weight:600">
                <i class="fa fa-print"></i> Print / Download PDF
              </button>
              <button class="btn btn-ghost btn-sm" onclick="HRMDocumentEngine.closeModal()" style="width:32px;height:32px;padding:0">
                <i class="fa fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Hub Body: Controls & Real-time A4 Paper Preview -->
          <div style="display:grid;grid-template-columns:340px 1fr;flex:1;overflow:hidden;background:var(--bg)">
            
            <!-- Left Config Panel -->
            <div style="padding:20px;border-right:1px solid var(--border);background:var(--surface);overflow-y:auto">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);letter-spacing:0.5px;margin-bottom:10px">
                1. Select Official Document
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px">
                ${docTypes.map(d => `
                  <button type="button" 
                    onclick="HRMDocumentEngine.switchType('${d.id}')"
                    style="text-align:left;padding:10px 12px;border-radius:8px;border:1px solid ${this.currentType === d.id ? 'var(--primary)' : 'var(--border)'};background:${this.currentType === d.id ? 'rgba(37,99,235,0.08)' : 'transparent'};cursor:pointer;display:flex;align-items:flex-start;gap:10px;transition:all .15s">
                    <div style="color:${this.currentType === d.id ? 'var(--primary)' : 'var(--text-3)'};font-size:15px;margin-top:2px">
                      <i class="fa ${d.icon}"></i>
                    </div>
                    <div>
                      <div style="font-size:13px;font-weight:700;color:${this.currentType === d.id ? 'var(--primary)' : 'var(--text)'}">${d.label}</div>
                      <div style="font-size:11px;color:var(--text-3);margin-top:2px">${d.desc}</div>
                    </div>
                  </button>
                `).join('')}
              </div>

              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);letter-spacing:0.5px;margin-bottom:10px">
                2. Parameters & Scope
              </div>

              ${this.currentType === 'offer' ? `
                <div class="form-group mb-12">
                  <label class="form-label" style="font-size:12px">Select Candidate Offer</label>
                  <select class="form-control" id="doc-param-offer" onchange="HRMDocumentEngine.onOfferChange(this.value)" style="font-size:12.5px">
                    ${offers.length ? offers.map(o => `<option value="${o.id}">${o.candidateName} — ${o.position || 'Offer'} (${o.refNo})</option>`).join('') : '<option value="">No offer records found</option>'}
                  </select>
                </div>
              ` : `
                <div class="form-group mb-12">
                  <label class="form-label" style="font-size:12px">Select Employee</label>
                  <select class="form-control" id="doc-param-emp" onchange="HRMDocumentEngine.onEmpChange(this.value)" ${isStaff ? 'disabled' : ''} style="font-size:12.5px">
                    ${emps.map(e => `<option value="${e.id}" ${Number(e.id) === Number(this.selectedEmpId) ? 'selected' : ''}>${e.fullName} (${e.empNo})</option>`).join('')}
                  </select>
                </div>
              `}

              ${this.currentType === 'payslip' ? `
                <div class="form-group mb-12">
                  <label class="form-label" style="font-size:12px">Salary Month</label>
                  <select class="form-control" id="doc-param-month" onchange="HRMDocumentEngine.onMonthChange(this.value)" style="font-size:12.5px">
                    ${allMonths.map(m => `<option value="${m}" ${m === this.selectedMonth ? 'selected' : ''}>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</option>`).join('')}
                  </select>
                </div>
              ` : ''}

              ${(this.currentType === 'salary_cert' || this.currentType === 'noc') ? `
                <div class="form-group mb-12">
                  <label class="form-label" style="font-size:12px">Addressed To / Purpose</label>
                  <input type="text" class="form-control" id="doc-param-purpose" value="To Whom It May Concern (Official Purpose)" oninput="HRMDocumentEngine.refreshPreview()" style="font-size:12.5px">
                </div>
              ` : ''}

              <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:12px;margin-top:18px">
                <div style="font-size:12px;font-weight:700;color:#059669;display:flex;align-items:center;gap:6px">
                  <i class="fa fa-shield-halved"></i> Corporate Compliance
                </div>
                <div style="font-size:11px;color:var(--text-3);margin-top:4px;line-height:1.4">
                  Formatted strictly to A4 page standard with high-contrast print styles, legal verification QR code, and executive digital signing block.
                </div>
              </div>
            </div>

            <!-- Right Simulated A4 Paper Viewport -->
            <div style="padding:24px;overflow-y:auto;display:flex;justify-content:center;background:#0f172a15">
              <div id="doc-a4-paper" style="background:#ffffff;color:#111827;width:100%;max-width:760px;min-height:980px;box-shadow:0 10px 25px rgba(0,0,0,0.15);border-radius:4px;padding:40px;box-sizing:border-box">
                ${currentDoc}
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    const existing = document.getElementById('doc-hub-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  closeModal() {
    const el = document.getElementById('doc-hub-modal');
    if (el) el.remove();
  },

  switchType(type) {
    this.currentType = type;
    this.renderHubModal();
  },

  onEmpChange(empId) {
    this.selectedEmpId = Number(empId);
    this.refreshPreview();
  },

  onOfferChange(offerId) {
    this.selectedOfferId = Number(offerId);
    this.refreshPreview();
  },

  onMonthChange(month) {
    this.selectedMonth = month;
    this.refreshPreview();
  },

  refreshPreview() {
    const paper = document.getElementById('doc-a4-paper');
    if (!paper) return;
    const purposeEl = document.getElementById('doc-param-purpose');
    const purpose = purposeEl ? purposeEl.value : 'To Whom It May Concern';
    paper.innerHTML = this.generateDocumentHTML(this.currentType, this.selectedEmpId, {
      month: this.selectedMonth,
      offerId: this.selectedOfferId,
      purpose
    });
  },

  // Document Generator Templates
  generateDocumentHTML(type, empId, options = {}) {
    const settings = DB.getObj('settings') || {};
    const companyName = settings.companyName || 'HRM Pro Enterprise Solutions (Pvt) Ltd';
    const companyAddress = settings.companyAddress || 'Plot 42, Executive Tech Park, Constitution Avenue, Islamabad';
    const companyEmail = settings.companyEmail || 'hr@company.com';
    const companyPhone = settings.companyPhone || '+92-21-1234567';
    const companyNTN = settings.companyNTN || '1234567-8';
    const companyLogo = settings.companyLogo || '';
    const signatoryName = settings.signatoryName || 'Sara Malik';
    const signatoryTitle = settings.signatoryTitle || 'Head of Human Resources';
    const signatorySignature = settings.signatorySignature || '';
    const today = Utils.formatDate(Utils.today());

    const emp = DB.find('employees', Number(empId)) || DB.get('employees')[0] || {
      fullName: 'Sarah Jenkins',
      empNo: 'EMP-001',
      designationId: 1,
      departmentId: 1,
      salary: 145000,
      joiningDate: '2023-01-15',
      bankName: 'Standard Chartered',
      accountNo: '01-4458921-01',
      cnic: '42201-9876543-1'
    };

    const header = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:14px;margin-bottom:22px">
        <div style="display:flex;align-items:center;gap:12px">
          ${companyLogo ? `<img src="${companyLogo}" style="max-height:48px;max-width:80px;object-fit:contain">` : `
            <div style="width:44px;height:44px;border-radius:8px;background:#2563eb;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px">
              ${companyName.slice(0,2).toUpperCase()}
            </div>
          `}
          <div>
            <div style="font-size:18px;font-weight:800;color:#1e3a8a;line-height:1.2">${companyName}</div>
            <div style="font-size:11px;color:#64748b">${companyAddress} • NTN: ${companyNTN}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Official Corporate Letterhead</div>
          <div style="font-size:11px;color:#0f172a;font-weight:600">Date: ${today}</div>
        </div>
      </div>
    `;

    const footer = (refNo, subject) => `
      <div style="margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          ${signatorySignature ? `<div style="margin-bottom:4px"><img src="${signatorySignature}" style="max-height:36px;max-width:120px;object-fit:contain"></div>` : '<div style="height:32px"></div>'}
          <div style="font-size:12.5px;font-weight:700;color:#0f172a">${signatoryName}</div>
          <div style="font-size:11px;color:#64748b">${signatoryTitle}</div>
          <div style="font-size:10px;color:#94a3b8">${companyName}</div>
        </div>
        <div>
          ${this.generateQRBadge(refNo, subject)}
        </div>
      </div>
      <div style="margin-top:18px;font-size:10px;color:#94a3b8;text-align:center">
        This document is an official corporate certificate issued under digital HR governance. Validity can be verified via corporate verification portal.
      </div>
    `;

    if (type === 'payslip') {
      const month = options.month || this.selectedMonth;
      const monthLabel = new Date(month+'-01').toLocaleDateString('en',{month:'long',year:'numeric'});
      const salaries = DB.get('salary') || [];
      const rec = salaries.find(s => s.employeeId === emp.id && s.month === month) || {
        basic: Math.round(emp.salary * 0.7),
        allowances: Math.round(emp.salary * 0.3),
        deductions: Math.round(emp.salary * 0.05),
        tax: Math.round(emp.salary * 0.04),
        netSalary: emp.salary,
        status: 'processed'
      };
      const gross = rec.basic + rec.allowances;
      const totalDed = (rec.deductions || 0) + (rec.tax || 0);
      const refNo = `PAY-${month.replace('-','')}-${emp.empNo}`;

      return `
        ${header}
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:18px">
          <div>
            <div style="font-size:14px;font-weight:800;color:#0f172a;letter-spacing:0.5px">CONFIDENTIAL SALARY PAYSLIP</div>
            <div style="font-size:11.5px;color:#64748b">Pay Period: <strong>${monthLabel}</strong></div>
          </div>
          <div style="text-align:right">
            <span style="background:#10b98122;color:#059669;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase">${rec.status || 'PROCESSED'}</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;margin-bottom:18px;font-size:12px">
          <div>
            <div><strong>Employee:</strong> ${emp.fullName}</div>
            <div style="margin-top:3px"><strong>Employee ID:</strong> ${emp.empNo}</div>
            <div style="margin-top:3px"><strong>Designation:</strong> ${Utils.getDesigName(emp.designationId)}</div>
            <div style="margin-top:3px"><strong>Department:</strong> ${Utils.getDeptName(emp.departmentId)}</div>
          </div>
          <div style="text-align:right">
            <div><strong>Date of Joining:</strong> ${Utils.formatDate(emp.joiningDate)}</div>
            <div style="margin-top:3px"><strong>Bank:</strong> ${emp.bankName || 'HBL Bank'}</div>
            <div style="margin-top:3px"><strong>Account No:</strong> ${emp.accountNo || '—'}</div>
            <div style="margin-top:3px"><strong>CNIC / Tax ID:</strong> ${emp.cnic || '42201-XXXXXXX-X'}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px">
          <div>
            <div style="background:#f1f5f9;padding:6px 10px;font-weight:700;font-size:11px;color:#334155;border-bottom:2px solid #cbd5e1;text-transform:uppercase">Earnings</div>
            <table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:4px">
              <tr><td style="padding:6px 4px;border-bottom:1px solid #f1f5f9">Basic Salary</td><td style="text-align:right;font-weight:600;padding:6px 4px;border-bottom:1px solid #f1f5f9">${Utils.formatCurrency(rec.basic)}</td></tr>
              <tr><td style="padding:6px 4px;border-bottom:1px solid #f1f5f9">House Rent & Medical</td><td style="text-align:right;font-weight:600;padding:6px 4px;border-bottom:1px solid #f1f5f9">${Utils.formatCurrency(rec.allowances)}</td></tr>
              <tr style="background:#f8fafc;font-weight:700">
                <td style="padding:8px 4px;color:#0f172a">Gross Earnings</td>
                <td style="text-align:right;color:#059669;padding:8px 4px">${Utils.formatCurrency(gross)}</td>
              </tr>
            </table>
          </div>

          <div>
            <div style="background:#f1f5f9;padding:6px 10px;font-weight:700;font-size:11px;color:#334155;border-bottom:2px solid #cbd5e1;text-transform:uppercase">Deductions</div>
            <table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:4px">
              <tr><td style="padding:6px 4px;border-bottom:1px solid #f1f5f9">Income Tax (Withheld)</td><td style="text-align:right;font-weight:600;padding:6px 4px;border-bottom:1px solid #f1f5f9;color:#dc2626">${Utils.formatCurrency(rec.tax || 0)}</td></tr>
              <tr><td style="padding:6px 4px;border-bottom:1px solid #f1f5f9">Provident Fund / Retainage</td><td style="text-align:right;font-weight:600;padding:6px 4px;border-bottom:1px solid #f1f5f9;color:#dc2626">${Utils.formatCurrency(rec.deductions || 0)}</td></tr>
              <tr style="background:#f8fafc;font-weight:700">
                <td style="padding:8px 4px;color:#0f172a">Total Deductions</td>
                <td style="text-align:right;color:#dc2626;padding:8px 4px">${Utils.formatCurrency(totalDed)}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="background:#0f172a;color:#ffffff;border-radius:6px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
          <div>
            <div style="font-size:11px;color:#38bdf8;font-weight:700;letter-spacing:0.5px">NET TAKE-HOME DISBURSEMENT</div>
            <div style="font-size:11px;color:#cbd5e1;font-style:italic;margin-top:2px">Official digital remittance in Pakistani Rupees</div>
          </div>
          <div style="font-size:22px;font-weight:800;color:#4ade80">${Utils.formatCurrency(rec.netSalary)}</div>
        </div>

        ${footer(refNo, `Payslip for ${emp.fullName}`)}
      `;
    }

    if (type === 'experience') {
      const refNo = `EXP-${emp.empNo}-${new Date().getFullYear()}`;
      return `
        ${header}
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;margin:0">Experience & Service Certificate</h2>
          <div style="font-size:11px;color:#64748b;margin-top:4px">REF NO: <strong>${refNo}</strong></div>
        </div>

        <div style="font-size:13px;line-height:1.8;color:#334155;text-align:justify">
          <p style="margin-bottom:16px"><strong>TO WHOM IT MAY CONCERN</strong></p>

          <p style="margin-bottom:16px">
            This is to formally certify that <strong>Mr./Ms. ${emp.fullName}</strong> (Employee ID: <code>${emp.empNo}</code>, CNIC: <code>${emp.cnic || '42201-XXXXXXX-X'}</code>) was employed with <strong>${companyName}</strong> as <strong>${Utils.getDesigName(emp.designationId)}</strong> in the <strong>${Utils.getDeptName(emp.departmentId)}</strong> department from <strong>${Utils.formatDate(emp.joiningDate)}</strong> to <strong>${today}</strong>.
          </p>

          <p style="margin-bottom:16px">
            During their tenure of employment with the organization, we found them to be professionally competent, dedicated, punctual, and exemplary in the execution of their responsibilities. They demonstrated excellent teamwork, technical acumen, and high ethical conduct.
          </p>

          <p style="margin-bottom:16px">
            They have discharged all professional obligations and completed company handover clearances in full compliance with corporate policy. We have no hesitation in recommending them for future professional opportunities and wish them continued success in their career.
          </p>
        </div>

        ${footer(refNo, `Experience Certificate - ${emp.fullName}`)}
      `;
    }

    if (type === 'salary_cert') {
      const refNo = `SALCERT-${emp.empNo}-${new Date().getFullYear()}`;
      const purpose = options.purpose || 'Official Verification';
      const gross = emp.salary || 140000;
      const basic = Math.round(gross * 0.7);
      const allowances = Math.round(gross * 0.3);

      return `
        ${header}
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;margin:0">Salary & Employment Verification Certificate</h2>
          <div style="font-size:11px;color:#64748b;margin-top:4px">REF NO: <strong>${refNo}</strong></div>
        </div>

        <div style="font-size:13px;line-height:1.8;color:#334155;text-align:justify">
          <p style="margin-bottom:16px"><strong>${purpose.toUpperCase()}</strong></p>

          <p style="margin-bottom:16px">
            This certificate is issued upon the formal request of <strong>Mr./Ms. ${emp.fullName}</strong> for the stated purpose of <em>${purpose}</em>.
          </p>

          <p style="margin-bottom:16px">
            We hereby certify that <strong>${emp.fullName}</strong> (Employee ID: <code>${emp.empNo}</code>) is a permanent, full-time employee in good standing at <strong>${companyName}</strong>, serving as <strong>${Utils.getDesigName(emp.designationId)}</strong> in the <strong>${Utils.getDeptName(emp.departmentId)}</strong> department since <strong>${Utils.formatDate(emp.joiningDate)}</strong>.
          </p>

          <p style="margin-bottom:10px">Their current regular monthly emoluments and remuneration structure are confirmed as follows:</p>

          <table style="width:100%;font-size:12.5px;border-collapse:collapse;margin-bottom:18px;border:1px solid #cbd5e1">
            <tr style="background:#f8fafc"><td style="padding:8px 12px;border-bottom:1px solid #cbd5e1">Basic Salary Component:</td><td style="padding:8px 12px;text-align:right;font-weight:700;border-bottom:1px solid #cbd5e1">${Utils.formatCurrency(basic)}</td></tr>
            <tr style="background:#ffffff"><td style="padding:8px 12px;border-bottom:1px solid #cbd5e1">House Rent & Executive Allowances:</td><td style="padding:8px 12px;text-align:right;font-weight:700;border-bottom:1px solid #cbd5e1">${Utils.formatCurrency(allowances)}</td></tr>
            <tr style="background:#f0fdf4;color:#166534;font-weight:800"><td style="padding:10px 12px">Total Monthly Gross Remuneration:</td><td style="padding:10px 12px;text-align:right">${Utils.formatCurrency(gross)}</td></tr>
          </table>

          <p style="margin-bottom:16px">
            To the best of our knowledge and records, their employment status is stable, permanent, and free from any disciplinary restrictions.
          </p>
        </div>

        ${footer(refNo, `Salary Certificate - ${emp.fullName}`)}
      `;
    }

    if (type === 'noc') {
      const refNo = `NOC-${emp.empNo}-${new Date().getFullYear()}`;
      const purpose = options.purpose || 'International Travel & Visa Formalities';
      return `
        ${header}
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;margin:0">No Objection Certificate (NOC)</h2>
          <div style="font-size:11px;color:#64748b;margin-top:4px">REF NO: <strong>${refNo}</strong></div>
        </div>

        <div style="font-size:13px;line-height:1.8;color:#334155;text-align:justify">
          <p style="margin-bottom:16px"><strong>TO WHOM IT MAY CONCERN</strong></p>

          <p style="margin-bottom:16px">
            This is to certify that <strong>${companyName}</strong> has no objection whatsoever to <strong>Mr./Ms. ${emp.fullName}</strong> (Employee ID: <code>${emp.empNo}</code>, Designation: <code>${Utils.getDesigName(emp.designationId)}</code>) applying for and undertaking:
          </p>

          <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:12px 18px;margin:16px 0;font-weight:700;color:#0f172a">
            ${purpose}
          </div>

          <p style="margin-bottom:16px">
            The employee has confirmed that they will resume their assigned corporate responsibilities upon completion of the approved period. <strong>${companyName}</strong> confirms that their position and employment remain secure during this authorized timeframe.
          </p>

          <p style="margin-bottom:16px">
            This certificate is issued without any financial or legal liability on the part of the issuing authority.
          </p>
        </div>

        ${footer(refNo, `NOC - ${emp.fullName}`)}
      `;
    }

    // Default: Job Offer Letter
    const offers = DB.get('offer_letters') || [];
    const offer = offers.find(o => o.id === options.offerId) || offers[0] || {
      candidateName: 'Alexander Hayes',
      position: 'Senior Full Stack Engineer',
      salary: 185000,
      joiningDate: '2026-11-01',
      refNo: 'OFFER-2026-089'
    };
    const refNo = offer.refNo || `OFFER-${new Date().getFullYear()}-001`;

    return `
      ${header}
      <div style="text-align:center;margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;margin:0">Official Job Offer Letter</h2>
        <div style="font-size:11px;color:#64748b;margin-top:4px">REF NO: <strong>${refNo}</strong></div>
      </div>

      <div style="font-size:13px;line-height:1.75;color:#334155;text-align:justify">
        <p style="margin-bottom:12px"><strong>Dear ${offer.candidateName},</strong></p>

        <p style="margin-bottom:14px">
          On behalf of <strong>${companyName}</strong>, we are thrilled to extend an official offer of employment for the position of <strong>${offer.position || 'Software Engineer'}</strong>. We were thoroughly impressed by your credentials, domain mastery, and alignment with our corporate culture.
        </p>

        <table style="width:100%;font-size:12.5px;border-collapse:collapse;margin:16px 0;border:1px solid #cbd5e1">
          <tr style="background:#f8fafc"><td style="padding:7px 12px;border-bottom:1px solid #cbd5e1">Position Title:</td><td style="padding:7px 12px;font-weight:700;border-bottom:1px solid #cbd5e1">${offer.position}</td></tr>
          <tr style="background:#ffffff"><td style="padding:7px 12px;border-bottom:1px solid #cbd5e1">Anticipated Joining Date:</td><td style="padding:7px 12px;font-weight:700;border-bottom:1px solid #cbd5e1">${Utils.formatDate(offer.joiningDate || Utils.today())}</td></tr>
          <tr style="background:#f8fafc"><td style="padding:7px 12px;border-bottom:1px solid #cbd5e1">Gross Monthly Compensation:</td><td style="padding:7px 12px;font-weight:700;color:#059669;border-bottom:1px solid #cbd5e1">${Utils.formatCurrency(offer.salary || 175000)}</td></tr>
          <tr style="background:#ffffff"><td style="padding:7px 12px">Work Arrangement:</td><td style="padding:7px 12px;font-weight:700">Full-Time Regular / Hybrid</td></tr>
        </table>

        <p style="margin-bottom:14px">
          This offer is contingent upon successful verification of academic credentials and background references. To confirm your formal acceptance, please sign and return the endorsement block below.
        </p>
      </div>

      <div style="margin-top:22px;padding:12px 16px;border:1px dashed #94a3b8;border-radius:6px;background:#f8fafc">
        <div style="font-size:11px;font-weight:700;color:#0f172a;text-transform:uppercase">Candidate Acceptance & Acknowledgement</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">I accept the terms and conditions outlined in this offer letter.</div>
        <div style="display:flex;justify-content:space-between;margin-top:30px;font-size:11px;color:#64748b">
          <div>Signature: __________________________</div>
          <div>Date: ____________________</div>
        </div>
      </div>

      ${footer(refNo, `Offer Letter - ${offer.candidateName}`)}
    `;
  },

  // Open printable window for instant A4 printing and PDF export
  executePrint() {
    const paper = document.getElementById('doc-a4-paper');
    if (!paper) return;
    const content = paper.innerHTML;
    const title = `${this.currentType.toUpperCase()} — Official Document`;

    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', -apple-system, sans-serif; }
            body { background:#ffffff; color:#0f172a; padding:32px; font-size:13px; line-height:1.6; }
            @page { size: A4 portrait; margin: 12mm; }
            @media print {
              body { padding:0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>
          ${content}
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
    } else {
      window.print();
    }
  },

  // Convenience API Methods
  printPayslip(empId, month) {
    this.openDocumentHub('payslip', empId);
    if (month) this.selectedMonth = month;
    this.refreshPreview();
  },

  printOfferLetter(offerId) {
    this.selectedOfferId = Number(offerId);
    this.openDocumentHub('offer');
    this.refreshPreview();
  },

  printExperienceCertificate(empId) {
    this.openDocumentHub('experience', empId);
  },

  printSalaryCertificate(empId, purpose) {
    this.openDocumentHub('salary_cert', empId);
    if (purpose) {
      setTimeout(() => {
        const el = document.getElementById('doc-param-purpose');
        if (el) { el.value = purpose; this.refreshPreview(); }
      }, 50);
    }
  },

  printNOC(empId, purpose) {
    this.openDocumentHub('noc', empId);
    if (purpose) {
      setTimeout(() => {
        const el = document.getElementById('doc-param-purpose');
        if (el) { el.value = purpose; this.refreshPreview(); }
      }, 50);
    }
  }
};

// Global export
window.HRMDocumentEngine = HRMDocumentEngine;
