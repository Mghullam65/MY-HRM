// ============================================================
// HRM SYSTEM — Multi-Company & Corporate Holding Structure
// Model A: Smart Single Login with Company Scoping,
// Global Entity Switcher & Full Super Admin CRUD Access
// ============================================================

const Company = {
  isAdmin() {
    return typeof Auth !== 'undefined' && Auth.role === 'superadmin';
  },

  isHrOrAdmin() {
    return typeof Auth !== 'undefined' && (Auth.role === 'superadmin' || Auth.role === 'hr_manager');
  },

  getActiveId() {
    return DB.getActiveCompanyId ? DB.getActiveCompanyId() : (localStorage.getItem('hrm_active_company') || '1');
  },

  getActive() {
    return DB.getActiveCompany ? DB.getActiveCompany() : { id: 1, name: 'Apex Technologies (Pvt) Ltd', tradeName: 'ApexTech' };
  },

  switchCompany(companyId) {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Switching corporate entities is restricted to Super Admin / Group Executives.', 'error');
      return;
    }

    DB.setActiveCompanyId(companyId);
    const active = this.getActive();
    
    // Update Topbar and Sidebar visual elements
    this.updateShellBranding(active);

    const dropdown = document.getElementById('company-switcher-dropdown');
    if (dropdown) dropdown.style.display = 'none';

    Toast.show(`Switched active context to: ${active.tradeName || active.name}`, 'success');

    // Refresh active view
    if (typeof App !== 'undefined' && App.currentModule) {
      App.navigate(App.currentModule, null, false);
    }
  },

  updateShellBranding(active) {
    const nameEl = document.getElementById('company-sidebar-name');
    if (nameEl) {
      nameEl.textContent = active.id === 'all' ? 'Apex Group' : (active.tradeName || active.name);
    }
    const switcherLabel = document.getElementById('active-company-label');
    if (switcherLabel) {
      switcherLabel.textContent = active.id === 'all' ? 'Group (Consolidated)' : (active.tradeName || active.name);
    }
    const logoBadge = document.getElementById('company-logo-badge');
    if (logoBadge) {
      logoBadge.textContent = active.logoText || 'AG';
      logoBadge.style.background = active.primaryColor || 'var(--primary)';
    }
  },

  toggleDropdown() {
    const dd = document.getElementById('company-switcher-dropdown');
    if (!dd) return;
    dd.style.display = dd.style.display === 'none' || !dd.style.display ? 'block' : 'none';
  },

  // ────────────────────────────────────────────────────────────
  // TOPBAR SWITCHER COMPONENT
  // ────────────────────────────────────────────────────────────
  renderSwitcherHTML() {
    const isAdmin = this.isAdmin();
    const active = this.getActive();
    const activeId = this.getActiveId();
    const companies = DB.get('companies') || [];

    // User's own assigned company if non-admin
    const userEmp = Auth.employee;
    let userCompany = active;
    if (!isAdmin && userEmp && userEmp.companyId) {
      userCompany = companies.find(c => c.id === userEmp.companyId) || active;
    }

    if (!isAdmin) {
      // Locked view for non-admin staff
      return `
        <div class="company-switcher-locked" title="Assigned Legal Entity: ${userCompany.name}" style="display:inline-flex;align-items:center;gap:7px;padding:5px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:20px;font-size:12px;color:var(--text);margin-right:8px">
          <span style="width:20px;height:20px;border-radius:50%;background:${userCompany.primaryColor || 'var(--primary)'};color:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:9.5px">
            ${userCompany.logoText || 'CO'}
          </span>
          <span style="font-weight:700;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${userCompany.tradeName || userCompany.name}
          </span>
          <i class="fa fa-lock" style="font-size:10px;color:var(--text-3)" title="Locked to your employing entity"></i>
        </div>
      `;
    }

    // Interactive Switcher for Super Admin
    return `
      <div class="company-switcher-wrap" style="position:relative;display:inline-block;margin-right:8px">
        <button class="topbar-btn company-switcher-btn" onclick="Company.toggleDropdown()" title="Switch Active Corporate Entity" style="display:inline-flex;align-items:center;gap:8px;padding:4px 12px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:20px;color:var(--text);font-size:12px;cursor:pointer">
          <span id="company-logo-badge" style="width:22px;height:22px;border-radius:50%;background:${active.primaryColor || 'var(--primary)'};color:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:10px">
            ${active.logoText || 'AG'}
          </span>
          <span id="active-company-label" style="font-weight:700;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${activeId === 'all' ? 'Group (Consolidated)' : (active.tradeName || active.name)}
          </span>
          <i class="fa fa-chevron-down" style="font-size:9px;opacity:0.6"></i>
        </button>

        <div class="company-switcher-dropdown card" id="company-switcher-dropdown" style="display:none;position:absolute;top:calc(100% + 6px);left:0;width:290px;padding:8px 0;z-index:9999;box-shadow:var(--shadow-lg);border:1px solid var(--border);border-radius:10px;animation:fadeIn 0.15s ease">
          <div style="padding:6px 14px;font-size:10.5px;font-weight:800;color:var(--text-3);text-transform:uppercase;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <span>Corporate Subsidiaries</span>
            <span class="badge badge-primary" style="font-size:9px">${companies.length} Entities</span>
          </div>

          <!-- Option 1: Consolidated View -->
          <div class="company-dd-item ${activeId === 'all' ? 'active-item' : ''}" onclick="Company.switchCompany('all')" style="padding:9px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.15s;${activeId === 'all' ? 'background:rgba(99,102,241,0.1);font-weight:700;' : ''}">
            <div style="width:26px;height:26px;border-radius:6px;background:#6366f1;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">
              AG
            </div>
            <div style="flex:1;overflow:hidden">
              <div style="font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Apex Group (Consolidated)</div>
              <div style="font-size:10px;color:var(--text-3)">Universal Holding Overview</div>
            </div>
            ${activeId === 'all' ? '<i class="fa fa-check" style="color:var(--primary);font-size:12px"></i>' : ''}
          </div>

          <div style="border-top:1px dashed var(--border);margin:4px 0"></div>

          <!-- Individual Subsidiaries -->
          ${companies.map(c => `
            <div class="company-dd-item ${String(c.id) === String(activeId) ? 'active-item' : ''}" onclick="Company.switchCompany(${c.id})" style="padding:9px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.15s;${String(c.id) === String(activeId) ? 'background:rgba(99,102,241,0.1);font-weight:700;' : ''}">
              <div style="width:26px;height:26px;border-radius:6px;background:${c.primaryColor || 'var(--primary)'};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">
                ${c.logoText || 'CO'}
              </div>
              <div style="flex:1;overflow:hidden">
                <div style="font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.tradeName || c.name}</div>
                <div style="font-size:10px;color:var(--text-3)">NTN: ${c.ntn} • ${c.disbursementBank?.split(' ')[0] || 'Bank'}</div>
              </div>
              ${String(c.id) === String(activeId) ? '<i class="fa fa-check" style="color:var(--primary);font-size:12px"></i>' : ''}
            </div>
          `).join('')}

          <div style="border-top:1px solid var(--border);margin-top:4px;padding:6px 14px;background:var(--surface)">
            <a href="javascript:void(0)" onclick="App.navigate('companies'); Company.toggleDropdown()" style="font-size:11px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:6px;text-decoration:none">
              <i class="fa fa-gear"></i> Manage Corporate Entities & Transfer
            </a>
          </div>
        </div>
      </div>
    `;
  },

  // ────────────────────────────────────────────────────────────
  // CORPORATE ENTITIES COMMAND CENTER (MAIN VIEW)
  // ────────────────────────────────────────────────────────────
  render() {
    const content = document.getElementById('page-content');
    if (!content) return;

    const isAdmin = this.isAdmin();
    const companies = DB.get('companies') || [];
    const allEmployees = DB.get('employees') || [];
    const allSalaries = DB.get('salary') || [];
    const activeId = this.getActiveId();

    // Group analytics
    const totalEntities = companies.length;
    const totalStaff = allEmployees.filter(e => e.status === 'active').length;
    const totalPayrollLiability = allEmployees
      .filter(e => e.status === 'active')
      .reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const uniqueNtns = new Set(companies.map(c => c.ntn)).size;

    content.innerHTML = `
      <div class="animate-fade-in" style="padding-bottom:30px">
        <!-- Header & Action Bar -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:20px">
          <div>
            <h2 style="font-size:22px;font-weight:800;display:flex;align-items:center;gap:10px;margin:0">
              <i class="fa fa-building-shield" style="color:var(--primary)"></i>
              Multi-Company & Corporate Holding Structure
            </h2>
            <p style="color:var(--text-2);font-size:13px;margin:4px 0 0">
              Manage parent holding organization, legal subsidiaries, independent FBR NTNs, and inter-company staff transfers.
            </p>
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="Company.exportConsolidatedCSV()" title="Export Group Register as CSV">
              <i class="fa fa-download"></i> Group CSV Report
            </button>
            ${isAdmin ? `
              <button class="btn btn-secondary btn-sm" onclick="Company.openTransferModal()" title="Execute Inter-Company Staff Transfer">
                <i class="fa fa-arrow-right-arrow-left"></i> Transfer Employee
              </button>
              <button class="btn btn-primary btn-sm" onclick="Company.openAddModal()" style="font-weight:700">
                <i class="fa fa-plus"></i> + Add Corporate Entity
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:14px;margin-bottom:24px">
          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--primary)">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-sitemap"></i>
            </div>
            <div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase">Group Entities</div>
              <div style="font-size:20px;font-weight:800;color:var(--text)">${totalEntities} Subsidiaries</div>
            </div>
          </div>

          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--success)">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(16,185,129,0.12);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-users"></i>
            </div>
            <div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase">Group Workforce</div>
              <div style="font-size:20px;font-weight:800;color:var(--text)">${totalStaff} Total Staff</div>
            </div>
          </div>

          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--accent)">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(139,92,246,0.12);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-money-bill-trend-up"></i>
            </div>
            <div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase">Consolidated Payroll</div>
              <div style="font-size:20px;font-weight:800;color:var(--text)">PKR ${totalPayrollLiability.toLocaleString('en-PK')}</div>
            </div>
          </div>

          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--warning)">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(245,158,11,0.12);color:var(--warning);display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-stamp"></i>
            </div>
            <div>
              <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase">FBR NTN Tax Registrations</div>
              <div style="font-size:20px;font-weight:800;color:var(--text)">${uniqueNtns} Distinct NTNs</div>
            </div>
          </div>
        </div>

        <!-- Corporate Subsidiaries Grid Cards -->
        <h3 style="font-size:15px;font-weight:800;margin:0 0 14px;color:var(--text);display:flex;align-items:center;gap:8px">
          <i class="fa fa-building"></i> Corporate Entities Directory & Banking Portfolios
        </h3>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(330px, 1fr));gap:16px;margin-bottom:30px">
          ${companies.map(c => {
            const emps = allEmployees.filter(e => e.companyId === c.id && e.status === 'active');
            const payroll = emps.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
            const isCurrentActive = String(activeId) === String(c.id);

            return `
              <div class="card" style="padding:20px;position:relative;border:1px solid ${isCurrentActive ? 'var(--primary)' : 'var(--border)'};box-shadow:${isCurrentActive ? '0 0 12px rgba(99,102,241,0.2)' : 'var(--shadow-sm)'}">
                ${isCurrentActive ? `
                  <div style="position:absolute;top:14px;right:14px">
                    <span class="badge badge-primary" style="font-size:10px;font-weight:800">
                      <i class="fa fa-circle-dot"></i> ACTIVE CONTEXT
                    </span>
                  </div>
                ` : ''}

                <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                  <div style="width:44px;height:44px;border-radius:10px;background:${c.primaryColor || 'var(--primary)'};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900">
                    ${c.logoText || 'CO'}
                  </div>
                  <div>
                    <h4 style="margin:0;font-size:15px;font-weight:800;color:var(--text)">${c.name}</h4>
                    <div style="font-size:11.5px;color:var(--text-3)">${c.tradeName} • ${c.isHolding ? 'Holding Company' : 'Subsidiary Entity'}</div>
                  </div>
                </div>

                <div style="font-size:12px;line-height:1.8;border-top:1px solid var(--border);padding-top:10px;margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">NTN Registration:</span>
                    <strong style="font-family:monospace">${c.ntn || '—'}</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">SECP Reg #:</span>
                    <span style="font-family:monospace;font-size:11px">${c.secpRegNo || '—'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">Disbursement Bank:</span>
                    <strong style="color:var(--text)">${c.disbursementBank}</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">IBAN Account:</span>
                    <span style="font-family:monospace;font-size:10.5px">${c.bankAccount || '—'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;border-top:1px dashed var(--border);padding-top:6px;margin-top:6px">
                    <span style="color:var(--text-3)">Active Headcount:</span>
                    <strong style="color:var(--primary)">${emps.length} Employees</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">Monthly Payroll:</span>
                    <strong style="font-family:monospace;color:var(--success)">PKR ${payroll.toLocaleString('en-PK')}</strong>
                  </div>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:12px">
                  ${isAdmin ? `
                    <div style="display:flex;gap:6px">
                      <button class="btn btn-ghost btn-xs" onclick="Company.openEditModal(${c.id})" title="Edit Entity Details">
                        <i class="fa fa-pen"></i> Edit
                      </button>
                      <button class="btn btn-ghost btn-xs text-danger" onclick="Company.confirmDelete(${c.id})" title="Delete Corporate Entity">
                        <i class="fa fa-trash"></i> Delete
                      </button>
                    </div>
                    <button class="btn btn-xs ${isCurrentActive ? 'btn-secondary' : 'btn-primary'}" onclick="Company.switchCompany(${c.id})">
                      ${isCurrentActive ? 'Selected' : '<i class="fa fa-arrow-right-to-bracket"></i> Switch View'}
                    </button>
                  ` : `
                    <span class="badge badge-secondary">${c.isHolding ? 'Holding' : 'Subsidiary'}</span>
                    <span style="font-size:11px;color:var(--text-3)">${c.status}</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Cross-Entity Workforce Distribution Table -->
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <h4 style="margin:0;font-size:14px;font-weight:800;color:var(--text)">
              <i class="fa fa-users-viewfinder" style="margin-right:6px;color:var(--primary)"></i>
              Consolidated Workforce Entity Allocation
            </h4>
            <span class="badge" style="font-size:11px">${allEmployees.length} Total Workforce Records</span>
          </div>

          <div class="table-container" style="margin:0">
            <table class="table" style="width:100%;font-size:12px;margin:0">
              <thead>
                <tr style="background:var(--surface-2);border-bottom:1px solid var(--border)">
                  <th style="padding:10px 16px">Employee</th>
                  <th style="padding:10px 16px">Assigned Corporate Entity</th>
                  <th style="padding:10px 16px">Department & Role</th>
                  <th style="padding:10px 16px">Hire Date</th>
                  <th style="padding:10px 16px;text-align:right">Basic Pay (PKR)</th>
                  ${isAdmin ? '<th style="padding:10px 16px;text-align:right">Action</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${allEmployees.map(e => {
                  const comp = companies.find(c => c.id === e.companyId) || companies[0];
                  return `
                    <tr style="border-bottom:1px solid var(--border)">
                      <td style="padding:10px 16px">
                        <strong style="color:var(--text)">${e.fullName}</strong>
                        <div style="font-size:10.5px;color:var(--text-3)">${e.code || 'EMP-'+e.id}</div>
                      </td>
                      <td style="padding:10px 16px">
                        <span class="badge" style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);color:${comp.primaryColor || 'var(--primary)'};font-weight:700">
                          ${comp.tradeName || comp.name}
                        </span>
                      </td>
                      <td style="padding:10px 16px">
                        <div>${e.department || 'Operations'}</div>
                        <div style="font-size:10.5px;color:var(--text-3)">${e.designation || 'Staff'}</div>
                      </td>
                      <td style="padding:10px 16px;font-family:monospace">${e.joinDate || e.joiningDate || '2024-01-01'}</td>
                      <td style="padding:10px 16px;text-align:right;font-family:monospace;font-weight:700">
                        PKR ${(Number(e.salary) || 0).toLocaleString()}
                      </td>
                      ${isAdmin ? `
                        <td style="padding:10px 16px;text-align:right">
                          <button class="btn btn-ghost btn-xs" onclick="Company.openTransferModal(${e.id})" title="Transfer to another Subsidiary">
                            <i class="fa fa-arrow-right-arrow-left"></i> Transfer
                          </button>
                        </td>
                      ` : ''}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // ────────────────────────────────────────────────────────────
  // ADMIN ACTION: ADD COMPANY MODAL
  // ────────────────────────────────────────────────────────────
  openAddModal() {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Adding corporate entities requires Super Admin privileges.', 'error');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'company-add-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width:720px;width:95%;max-height:90vh;overflow-y:auto">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px">
            <i class="fa fa-building-circle-check" style="color:var(--primary)"></i>
            Register New Corporate Subsidiary / Entity
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('company-add-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:20px">
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Full Legal Company Name *</label>
              <input type="text" class="input input-sm" id="comp-add-name" placeholder="e.g. Apex Health & Pharma (Pvt) Ltd">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Brand / Trade Name *</label>
              <input type="text" class="input input-sm" id="comp-add-trade" placeholder="e.g. ApexPharma">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">FBR NTN Number *</label>
              <input type="text" class="input input-sm" id="comp-add-ntn" placeholder="e.g. 9849201-5">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">SECP Registration #</label>
              <input type="text" class="input input-sm" id="comp-add-secp" placeholder="e.g. SECP-0098492">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Legal Structure</label>
              <select class="input input-sm" id="comp-add-type">
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="Public Limited Company">Public Limited Company</option>
                <option value="Partnership / LLP">Partnership / LLP</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Designated Disbursement Bank *</label>
              <input type="text" class="input input-sm" id="comp-add-bank" placeholder="e.g. Meezan Bank Limited">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">IBAN / Corporate Account #</label>
              <input type="text" class="input input-sm" id="comp-add-iban" placeholder="e.g. PK44MEZN0009988776655443">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Monogram Code (2-3 chars)</label>
              <input type="text" class="input input-sm" id="comp-add-logo" maxlength="3" placeholder="e.g. PH">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Brand Color Hex</label>
              <input type="color" class="input input-sm" id="comp-add-color" value="#6366f1" style="height:36px;padding:2px">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Currency</label>
              <input type="text" class="input input-sm" id="comp-add-curr" value="PKR" readonly>
            </div>
          </div>

          <div style="margin-bottom:14px">
            <label class="form-label" style="font-weight:700;font-size:12px">Corporate Head Office Address</label>
            <input type="text" class="input input-sm" id="comp-add-address" placeholder="e.g. Plot 15, Industrial Estate, Hayatabad, Peshawar">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Contact Email</label>
              <input type="email" class="input input-sm" id="comp-add-email" placeholder="corporate@apexpharma.com.pk">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Contact Telephone</label>
              <input type="tel" class="input input-sm" id="comp-add-phone" placeholder="+92 91 5892014">
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding:14px 20px;display:flex;justify-content:flex-end;gap:10px;background:var(--surface)">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('company-add-modal').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="Company.saveNewCompany()" style="font-weight:700">
            <i class="fa fa-check"></i> Register Subsidiary
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  saveNewCompany() {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Only Super Admin can register entities.', 'error');
      return;
    }

    const name = document.getElementById('comp-add-name')?.value.trim();
    const tradeName = document.getElementById('comp-add-trade')?.value.trim();
    const ntn = document.getElementById('comp-add-ntn')?.value.trim();
    const secpRegNo = document.getElementById('comp-add-secp')?.value.trim();
    const legalType = document.getElementById('comp-add-type')?.value;
    const disbursementBank = document.getElementById('comp-add-bank')?.value.trim();
    const bankAccount = document.getElementById('comp-add-iban')?.value.trim();
    const logoText = (document.getElementById('comp-add-logo')?.value.trim() || name.slice(0, 2)).toUpperCase();
    const primaryColor = document.getElementById('comp-add-color')?.value || '#6366f1';
    const headOfficeAddress = document.getElementById('comp-add-address')?.value.trim();
    const contactEmail = document.getElementById('comp-add-email')?.value.trim();
    const contactPhone = document.getElementById('comp-add-phone')?.value.trim();

    if (!name || !tradeName || !ntn || !disbursementBank) {
      Toast.show('Please fill all mandatory fields: Legal Name, Trade Name, NTN, and Disbursement Bank.', 'warning');
      return;
    }

    const companies = DB.get('companies') || [];
    const nextId = companies.length > 0 ? Math.max(...companies.map(c => c.id || 0)) + 1 : 1;

    const newCompany = {
      id: nextId,
      code: 'APEX-' + tradeName.toUpperCase().slice(0, 4),
      name,
      tradeName,
      legalType,
      ntn,
      secpRegNo,
      currency: 'PKR',
      disbursementBank,
      bankAccount,
      logoText,
      primaryColor,
      headOfficeAddress,
      contactEmail,
      contactPhone,
      isHolding: false,
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0]
    };

    companies.push(newCompany);
    DB.set('companies', companies);

    document.getElementById('company-add-modal')?.remove();
    Toast.show(`Corporate Subsidiary "${tradeName}" registered successfully!`, 'success');
    this.render();
  },

  // ────────────────────────────────────────────────────────────
  // ADMIN ACTION: EDIT COMPANY MODAL
  // ────────────────────────────────────────────────────────────
  openEditModal(companyId) {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Modifying entities is restricted to Super Admin.', 'error');
      return;
    }

    const companies = DB.get('companies') || [];
    const c = companies.find(x => x.id === Number(companyId));
    if (!c) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'company-edit-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width:720px;width:95%;max-height:90vh;overflow-y:auto">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px">
            <i class="fa fa-pen-to-square" style="color:var(--primary)"></i>
            Edit Corporate Entity — ${c.name}
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('company-edit-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:20px">
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Full Legal Company Name *</label>
              <input type="text" class="input input-sm" id="comp-edit-name" value="${c.name}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Brand / Trade Name *</label>
              <input type="text" class="input input-sm" id="comp-edit-trade" value="${c.tradeName || ''}">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">FBR NTN Number *</label>
              <input type="text" class="input input-sm" id="comp-edit-ntn" value="${c.ntn || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">SECP Registration #</label>
              <input type="text" class="input input-sm" id="comp-edit-secp" value="${c.secpRegNo || ''}">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Disbursement Bank Name</label>
              <input type="text" class="input input-sm" id="comp-edit-bank" value="${c.disbursementBank || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Bank IBAN / Account #</label>
              <input type="text" class="input input-sm" id="comp-edit-iban" value="${c.bankAccount || ''}">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Brand Monogram Code</label>
              <input type="text" class="input input-sm" id="comp-edit-logo" value="${c.logoText || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Brand Color</label>
              <input type="color" class="input input-sm" id="comp-edit-color" value="${c.primaryColor || '#6366f1'}" style="height:36px;padding:2px">
            </div>
          </div>

          <div>
            <label class="form-label" style="font-weight:700;font-size:12px">Head Office Address</label>
            <input type="text" class="input input-sm" id="comp-edit-address" value="${c.headOfficeAddress || ''}">
          </div>
        </div>

        <div class="modal-footer" style="padding:14px 20px;display:flex;justify-content:space-between;background:var(--surface)">
          <button class="btn btn-ghost btn-sm text-danger" onclick="Company.confirmDelete(${c.id}); document.getElementById('company-edit-modal').remove();">
            <i class="fa fa-trash"></i> Delete Entity
          </button>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('company-edit-modal').remove()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="Company.saveEditedCompany(${c.id})" style="font-weight:700">
              <i class="fa fa-save"></i> Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  saveEditedCompany(companyId) {
    if (!this.isAdmin()) return;

    const companies = DB.get('companies') || [];
    const c = companies.find(x => x.id === Number(companyId));
    if (!c) return;

    c.name = document.getElementById('comp-edit-name')?.value.trim() || c.name;
    c.tradeName = document.getElementById('comp-edit-trade')?.value.trim() || c.tradeName;
    c.ntn = document.getElementById('comp-edit-ntn')?.value.trim() || c.ntn;
    c.secpRegNo = document.getElementById('comp-edit-secp')?.value.trim() || c.secpRegNo;
    c.disbursementBank = document.getElementById('comp-edit-bank')?.value.trim() || c.disbursementBank;
    c.bankAccount = document.getElementById('comp-edit-iban')?.value.trim() || c.bankAccount;
    c.logoText = (document.getElementById('comp-edit-logo')?.value.trim() || c.logoText).toUpperCase();
    c.primaryColor = document.getElementById('comp-edit-color')?.value || c.primaryColor;
    c.headOfficeAddress = document.getElementById('comp-edit-address')?.value.trim() || c.headOfficeAddress;

    DB.set('companies', companies);
    document.getElementById('company-edit-modal')?.remove();
    Toast.show(`Updated corporate details for "${c.tradeName}"!`, 'success');
    this.render();
  },

  // ────────────────────────────────────────────────────────────
  // ADMIN ACTION: DELETE COMPANY
  // ────────────────────────────────────────────────────────────
  confirmDelete(companyId) {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Deleting corporate entities requires Super Admin rights.', 'error');
      return;
    }

    const companies = DB.get('companies') || [];
    const c = companies.find(x => x.id === Number(companyId));
    if (!c) return;

    // Safety check: Active employees
    const emps = (DB.get('employees') || []).filter(e => e.companyId === c.id);
    if (emps.length > 0) {
      alert(`⚠️ Cannot Delete Corporate Entity:\n\nThere are currently ${emps.length} active employees assigned to "${c.name}".\n\nPlease transfer these employees to another entity before attempting deletion.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete subsidiary "${c.name}"? This action cannot be undone.`)) {
      return;
    }

    const filtered = companies.filter(x => x.id !== Number(companyId));
    DB.set('companies', filtered);

    if (String(this.getActiveId()) === String(companyId)) {
      this.switchCompany('1');
    }

    Toast.show(`Corporate subsidiary "${c.name}" deleted.`, 'info');
    this.render();
  },

  // ────────────────────────────────────────────────────────────
  // ADMIN ACTION: INTER-COMPANY STAFF TRANSFER
  // ────────────────────────────────────────────────────────────
  openTransferModal(preselectedEmpId) {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Inter-company transfers require Super Admin authority.', 'error');
      return;
    }

    const employees = DB.get('employees') || [];
    const companies = DB.get('companies') || [];
    const targetEmp = preselectedEmpId ? employees.find(e => e.id === Number(preselectedEmpId)) : null;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'company-transfer-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width:640px;width:95%">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px">
            <i class="fa fa-arrow-right-arrow-left" style="color:var(--primary)"></i>
            Inter-Company Staff Transfer Gateway
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('company-transfer-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:20px">
          <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--text)">
            <i class="fa fa-shield-halved" style="color:var(--primary);margin-right:4px"></i>
            <strong>Continuous Service Tenure Protection:</strong> Employee hire date, accumulated provident fund balance, and statutory gratuity tenure are 100% preserved during group entity transfers.
          </div>

          <div style="margin-bottom:14px">
            <label class="form-label" style="font-weight:700;font-size:12px">Select Employee to Transfer *</label>
            <select class="input input-sm" id="trans-emp-select" onchange="Company.onTransferEmpSelect(this.value)">
              <option value="">-- Choose Employee --</option>
              ${employees.map(e => `
                <option value="${e.id}" ${targetEmp && targetEmp.id === e.id ? 'selected' : ''}>
                  ${e.fullName} (${e.code || 'EMP-'+e.id}) - Current: ${(companies.find(c=>c.id===e.companyId)?.tradeName || 'Holding')}
                </option>
              `).join('')}
            </select>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Current Employing Entity</label>
              <input type="text" class="input input-sm" id="trans-source-comp" readonly value="${targetEmp ? (companies.find(c=>c.id===targetEmp.companyId)?.name || 'Apex Technologies') : '—'}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Target Destination Entity *</label>
              <select class="input input-sm" id="trans-target-comp">
                ${companies.map(c => `<option value="${c.id}">${c.tradeName || c.name} (NTN: ${c.ntn})</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Effective Transfer Date *</label>
              <input type="date" class="input input-sm" id="trans-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Transfer Authorization Type</label>
              <select class="input input-sm" id="trans-type">
                <option value="inter_company_promotion">Inter-Company Promotion</option>
                <option value="lateral_transfer">Lateral Departmental Transfer</option>
                <option value="project_secondment">Long-Term Project Secondment</option>
                <option value="corporate_reorg">Corporate Restructuring</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label" style="font-weight:700;font-size:12px">Transfer Board Remarks</label>
            <textarea class="input input-sm" id="trans-remarks" rows="2" placeholder="Enter executive transfer rationale and payroll debit instructions..."></textarea>
          </div>
        </div>

        <div class="modal-footer" style="padding:14px 20px;display:flex;justify-content:flex-end;gap:10px;background:var(--surface)">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('company-transfer-modal').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="Company.executeTransfer()" style="font-weight:700">
            <i class="fa fa-arrow-right"></i> Execute Transfer
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  onTransferEmpSelect(empId) {
    if (!empId) return;
    const emp = (DB.get('employees') || []).find(e => e.id === Number(empId));
    const comp = (DB.get('companies') || []).find(c => c.id === emp?.companyId);
    const srcEl = document.getElementById('trans-source-comp');
    if (srcEl && comp) {
      srcEl.value = comp.name;
    }
  },

  executeTransfer() {
    if (!this.isAdmin()) return;

    const empId = Number(document.getElementById('trans-emp-select')?.value);
    const targetCompId = Number(document.getElementById('trans-target-comp')?.value);
    const transDate = document.getElementById('trans-date')?.value;
    const transType = document.getElementById('trans-type')?.value;
    const remarks = document.getElementById('trans-remarks')?.value.trim();

    if (!empId || !targetCompId) {
      Toast.show('Please select employee and destination entity.', 'warning');
      return;
    }

    const employees = DB.get('employees') || [];
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const companies = DB.get('companies') || [];
    const sourceComp = companies.find(c => c.id === emp.companyId);
    const targetComp = companies.find(c => c.id === targetCompId);

    if (emp.companyId === targetCompId) {
      Toast.show(`Employee is already assigned to "${targetComp.tradeName}". Please pick a different destination entity.`, 'warning');
      return;
    }

    // Execute transfer
    const prevCompId = emp.companyId;
    emp.companyId = targetCompId;
    emp.transferredAt = transDate;
    DB.set('employees', employees);

    // Audit log
    const logs = DB.get('audit_logs') || [];
    logs.unshift({
      id: Date.now(),
      action: 'INTER_COMPANY_TRANSFER',
      user: Auth.user?.username || 'admin',
      details: `Transferred ${emp.fullName} from "${sourceComp?.name}" to "${targetComp?.name}" (${transType})`,
      timestamp: new Date().toISOString()
    });
    DB.set('audit_logs', logs);

    document.getElementById('company-transfer-modal')?.remove();
    Toast.show(`Successfully transferred ${emp.fullName} to ${targetComp.tradeName}!`, 'success');
    this.render();
  },

  // ────────────────────────────────────────────────────────────
  // CONSOLIDATED CSV EXPORT
  // ────────────────────────────────────────────────────────────
  exportConsolidatedCSV() {
    const companies = DB.get('companies') || [];
    const employees = DB.get('employees') || [];

    const headers = [
      'Company ID', 'Company Code', 'Legal Name', 'Trade Name', 'FBR NTN', 'SECP Registration',
      'Legal Type', 'Disbursement Bank', 'Bank IBAN', 'Active Staff Count', 'Monthly Payroll Outlay (PKR)'
    ];

    const rows = companies.map(c => {
      const emps = employees.filter(e => e.companyId === c.id && e.status === 'active');
      const payroll = emps.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
      return [
        c.id,
        `"${c.code || ''}"`,
        `"${c.name || ''}"`,
        `"${c.tradeName || ''}"`,
        `"${c.ntn || ''}"`,
        `"${c.secpRegNo || ''}"`,
        `"${c.legalType || ''}"`,
        `"${c.disbursementBank || ''}"`,
        `"${c.bankAccount || ''}"`,
        emps.length,
        payroll
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    Utils.downloadCSV(csvContent, `corporate_holding_register_${new Date().toISOString().slice(0,10)}.csv`);
    Toast.show('Consolidated Group Holdings CSV exported!', 'success');
  }
};

window.Company = Company;
