// ============================================================
// HRM SYSTEM — Multi-Company & Corporate Holding Structure
// Model A: Smart Single Login with Company Scoping,
// Global Entity Switcher, Dynamic Brand Token Injection,
// White-Label Corporate Stationery & Continuous Transfer Engine
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
    
    // Apply full brand tokens dynamically (CSS tokens + Shell Branding)
    this.applyBrandTokens(active);

    const dropdown = document.getElementById('company-switcher-dropdown');
    if (dropdown) dropdown.style.display = 'none';

    Toast.show(`Switched active context to: ${active.tradeName || active.name}`, 'success');

    // Refresh active view
    if (typeof App !== 'undefined' && App.currentModule) {
      App.navigate(App.currentModule, null, false);
    }
  },

  applyBrandTokens(active) {
    if (!active) active = this.getActive();
    const isAll = active.id === 'all';
    const primary = isAll ? '#4f46e5' : (active.primaryColor || '#4f46e5');
    const secondary = isAll ? '#06b6d4' : (active.secondaryColor || '#06b6d4');

    // Dynamic CSS root custom properties for white-labeling
    try {
      document.documentElement.style.setProperty('--brand-entity-primary', primary);
      document.documentElement.style.setProperty('--brand-entity-secondary', secondary);
      if (!isAll && active.primaryColor) {
        document.documentElement.style.setProperty('--primary', primary);
        document.documentElement.style.setProperty('--primary-light', primary + 'cc');
        document.documentElement.style.setProperty('--primary-dark', primary);
        document.documentElement.style.setProperty('--primary-glow', primary + '33');
      }
    } catch (e) {
      console.warn('Error setting brand token CSS vars:', e);
    }

    this.updateShellBranding(active);
  },

  updateShellBranding(active) {
    if (!active) active = this.getActive();
    const isAll = active.id === 'all';
    const name = isAll ? 'Apex Group (Holding)' : (active.tradeName || active.name);
    const code = isAll ? 'AG' : (active.logoText || 'CO');
    const color = isAll ? '#4f46e5' : (active.primaryColor || '#4f46e5');

    // Sidebar elements
    const nameEl = document.getElementById('company-sidebar-name');
    if (nameEl) nameEl.textContent = isAll ? 'Apex Group' : (active.tradeName || active.name);
    
    const logoIcon = document.querySelector('.sidebar .logo-icon');
    if (logoIcon && !isAll) {
      logoIcon.style.background = color;
      logoIcon.style.boxShadow = `0 3px 10px ${color}44`;
    }

    // Topbar elements
    const topNameEl = document.getElementById('topbar-company-name');
    if (topNameEl) topNameEl.textContent = name;

    const topBadge = document.getElementById('topbar-logo-badge');
    if (topBadge) {
      topBadge.textContent = code;
      topBadge.style.background = color;
    }

    const topPill = document.getElementById('topbar-company-pill');
    if (topPill) {
      topPill.style.borderColor = color;
    }

    const switcherLabel = document.getElementById('active-company-label');
    if (switcherLabel) switcherLabel.textContent = isAll ? 'Group (Consolidated)' : name;

    const logoBadge = document.getElementById('company-logo-badge');
    if (logoBadge) {
      logoBadge.textContent = code;
      logoBadge.style.background = color;
    }
  },

  toggleDropdown() {
    const dd = document.getElementById('company-switcher-dropdown');
    if (!dd) return;
    dd.style.display = dd.style.display === 'none' || !dd.style.display ? 'block' : 'none';
  },

  // ────────────────────────────────────────────────────────────
  // TOPBAR SWITCHER & WORKSPACE MODAL
  // ────────────────────────────────────────────────────────────
  showWorkspaceSwitchModal() {
    if (!this.isAdmin()) return;

    const companies = DB.get('companies') || [];
    const activeId = this.getActiveId();

    const existing = document.getElementById('company-workspace-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'company-workspace-modal';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
      <div class="modal" style="max-width:760px;width:95%;animation:fadeIn 0.2s ease">
        <div class="modal-header" style="border-bottom:1px solid var(--border);padding:18px 22px">
          <div>
            <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px;color:var(--text)">
              <i class="fa fa-building-circle-check" style="color:var(--primary)"></i>
              Select Corporate Workspace Context
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              Choose which corporate subsidiary workspace to load, or select Consolidated Group View.
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('company-workspace-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:22px">
          <!-- Option 1: Consolidated Group Option (Dominant Card) -->
          <div class="card" onclick="Company.switchCompany('all'); document.getElementById('company-workspace-modal').remove();"
            style="padding:16px 20px;margin-bottom:16px;cursor:pointer;border:2px solid ${activeId === 'all' ? 'var(--primary)' : 'var(--border)'};background:${activeId === 'all' ? 'rgba(99,102,241,0.06)' : 'var(--surface)'};border-radius:12px;display:flex;align-items:center;justify-content:space-between;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:48px;height:48px;border-radius:12px;background:#6366f1;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900">
                🏛️
              </div>
              <div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-weight:800;font-size:15px;color:var(--text)">Apex Group (Consolidated Holding)</span>
                  <span class="badge badge-primary" style="font-size:10px">Recommended for Board & Admin</span>
                </div>
                <div style="font-size:12px;color:var(--text-3);margin-top:2px">
                  Universal multi-company command view: Consolidated 26 staff, PKR 2.58M group payroll, and cross-subsidiary analytics.
                </div>
              </div>
            </div>
            <div>
              <button class="btn btn-sm ${activeId === 'all' ? 'btn-primary' : 'btn-secondary'}" style="pointer-events:none">
                ${activeId === 'all' ? 'Active' : 'Select'}
              </button>
            </div>
          </div>

          <div style="font-size:11.5px;font-weight:800;color:var(--text-3);text-transform:uppercase;margin:18px 0 10px;display:flex;align-items:center;gap:6px">
            <span>Or Choose an Individual Subsidiary Workspace</span>
            <div style="flex:1;height:1px;background:var(--border)"></div>
          </div>

          <!-- Individual Subsidiaries Grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:12px">
            ${companies.map(c => {
              const isSelected = String(activeId) === String(c.id);
              return `
                <div class="card" onclick="Company.switchCompany(${c.id}); document.getElementById('company-workspace-modal').remove();"
                  style="padding:14px;cursor:pointer;border:1.5px solid ${isSelected ? (c.primaryColor || 'var(--primary)') : 'var(--border)'};background:${isSelected ? 'rgba(99,102,241,0.06)' : 'var(--surface)'};border-radius:10px;display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.15s, border-color 0.15s">
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                    <div style="width:34px;height:34px;border-radius:8px;background:${c.primaryColor || 'var(--primary)'};color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">
                      ${c.logoText || 'CO'}
                    </div>
                    <div style="overflow:hidden">
                      <div style="font-size:13px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.tradeName || c.name}</div>
                      <div style="font-size:10.5px;color:var(--text-3)">NTN: ${c.ntn}</div>
                    </div>
                  </div>
                  <div style="font-size:11px;color:var(--text-2);margin-bottom:12px">
                    Bank: <strong>${c.disbursementBank?.split(' ')[0] || 'Bank'}</strong>
                  </div>
                  <button class="btn btn-xs ${isSelected ? 'btn-primary' : 'btn-secondary'}" style="width:100%;pointer-events:none">
                    ${isSelected ? 'Active Context' : 'Open Workspace'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="modal-footer" style="padding:12px 22px;display:flex;justify-content:space-between;align-items:center;background:var(--surface)">
          <span style="font-size:11px;color:var(--text-3)">
            <i class="fa fa-info-circle"></i> You can switch workspaces anytime from the top navigation bar.
          </span>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('company-workspace-modal').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

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
        <div class="company-switcher-locked" title="Assigned Legal Entity: ${userCompany.name}" style="display:inline-flex;align-items:center;gap:8px;padding:5px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:20px;font-size:12px;color:var(--text);margin-right:8px">
          <span style="width:22px;height:22px;border-radius:50%;background:${userCompany.primaryColor || 'var(--primary)'};color:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:10px">
            ${userCompany.logoText || 'CO'}
          </span>
          <span style="font-weight:700;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${userCompany.tradeName || userCompany.name}
          </span>
          <i class="fa fa-lock" style="font-size:10px;color:var(--text-3)" title="Locked to your employing entity"></i>
        </div>
      `;
    }

    // Prominent Interactive Switcher for Super Admin
    return `
      <div class="company-switcher-wrap" style="position:relative;display:inline-block;margin-right:8px">
        <button class="company-switcher-btn" onclick="Company.toggleDropdown()" title="Switch Corporate Entity Workspace"
          style="display:inline-flex;align-items:center;gap:8px;padding:5px 14px;background:var(--surface);border:1.5px solid var(--primary);border-radius:22px;color:var(--text);font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(99,102,241,0.18)">
          <span id="company-logo-badge" style="width:22px;height:22px;border-radius:50%;background:${active.primaryColor || 'var(--primary)'};color:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:10px">
            ${active.logoText || 'AG'}
          </span>
          <span id="active-company-label" style="font-weight:800;max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${activeId === 'all' ? 'Apex Group (All Entities)' : (active.tradeName || active.name)}
          </span>
          <span style="font-size:10px;color:var(--primary);background:rgba(99,102,241,0.12);padding:2px 7px;border-radius:10px;font-weight:700">Switch ▾</span>
        </button>

        <div class="company-switcher-dropdown card" id="company-switcher-dropdown" style="display:none;position:absolute;top:calc(100% + 6px);left:0;width:310px;padding:8px 0;z-index:9999;box-shadow:var(--shadow-lg);border:1px solid var(--border);border-radius:10px;animation:fadeIn 0.15s ease">
          <div style="padding:8px 14px;font-size:11px;font-weight:800;color:var(--text-3);text-transform:uppercase;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <span>Corporate Subsidiaries</span>
            <button class="btn btn-ghost btn-xs" onclick="Company.showWorkspaceSwitchModal(); Company.toggleDropdown();" style="font-size:10px;color:var(--primary)">
              <i class="fa fa-expand"></i> Modal View
            </button>
          </div>

          <!-- Option 1: Consolidated View -->
          <div class="company-dd-item ${activeId === 'all' ? 'active-item' : ''}" onclick="Company.switchCompany('all')" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.15s;${activeId === 'all' ? 'background:rgba(99,102,241,0.1);font-weight:700;' : ''}">
            <div style="width:28px;height:28px;border-radius:8px;background:#6366f1;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">
              🏛️
            </div>
            <div style="flex:1;overflow:hidden">
              <div style="font-size:12.5px;color:var(--text);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Apex Group (All Companies)</div>
              <div style="font-size:10.5px;color:var(--text-3)">Consolidated Group Command View</div>
            </div>
            ${activeId === 'all' ? '<i class="fa fa-check" style="color:var(--primary);font-size:12px"></i>' : ''}
          </div>

          <div style="border-top:1px dashed var(--border);margin:4px 0"></div>

          <!-- Individual Subsidiaries -->
          ${companies.map(c => `
            <div class="company-dd-item ${String(c.id) === String(activeId) ? 'active-item' : ''}" onclick="Company.switchCompany(${c.id})" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.15s;${String(c.id) === String(activeId) ? 'background:rgba(99,102,241,0.1);font-weight:700;' : ''}">
              <div style="width:28px;height:28px;border-radius:8px;background:${c.primaryColor || 'var(--primary)'};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">
                ${c.logoText || 'CO'}
              </div>
              <div style="flex:1;overflow:hidden">
                <div style="font-size:12px;color:var(--text);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.tradeName || c.name}</div>
                <div style="font-size:10px;color:var(--text-3)">NTN: ${c.ntn} • ${c.disbursementBank?.split(' ')[0] || 'Bank'}</div>
              </div>
              ${String(c.id) === String(activeId) ? '<i class="fa fa-check" style="color:var(--primary);font-size:12px"></i>' : ''}
            </div>
          `).join('')}

          <div style="border-top:1px solid var(--border);margin-top:4px;padding:8px 14px;background:var(--surface);display:flex;justify-content:space-between;align-items:center">
            <a href="javascript:void(0)" onclick="App.navigate('companies'); Company.toggleDropdown()" style="font-size:11px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:6px;text-decoration:none">
              <i class="fa fa-gear"></i> Manage Subsidiaries
            </a>
            <button class="btn btn-ghost btn-xs" onclick="Company.openTransferModal(); Company.toggleDropdown()" style="font-size:11px;color:var(--text-2)">
              <i class="fa fa-arrow-right-arrow-left"></i> Transfer Staff
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ────────────────────────────────────────────────────────────
  // CORPORATE ENTITIES COMMAND CENTER (MAIN VIEW)
  // ────────────────────────────────────────────────────────────
  render(targetEl = null) {
    const content = targetEl || document.getElementById('page-content');
    if (!content) return;

    const isAdmin = this.isAdmin();
    const companies = DB.get('companies') || [];
    const allEmployees = DB.get('employees') || [];
    const activeId = this.getActiveId();

    // Ensure all employees are cleanly allocated to subsidiaries
    let empUpdated = false;
    allEmployees.forEach((e, idx) => {
      if (!e.companyId || isNaN(Number(e.companyId))) {
        e.companyId = (idx % 3) + 1;
        empUpdated = true;
      }
    });
    if (empUpdated) {
      DB.set('employees', allEmployees);
    }

    // Group analytics
    const totalEntities = companies.length;
    const totalStaff = allEmployees.filter(e => (e.status || '').toLowerCase() === 'active').length;
    const totalPayrollLiability = allEmployees
      .filter(e => (e.status || '').toLowerCase() === 'active')
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
              Manage parent holding organization, legal subsidiaries, independent FBR NTNs, brand tokens, and continuous-service inter-company staff transfers.
            </p>
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="Company.exportConsolidatedCSV()" title="Export Group Register as CSV">
              <i class="fa fa-download"></i> Group CSV Report
            </button>
            <button class="btn btn-secondary btn-sm" onclick="Company.renderOfficialLetterModal()" title="Generate Official Letterhead & Certificates">
              <i class="fa fa-stamp"></i> Stationery & Letters
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
          <i class="fa fa-building"></i> Corporate Entities Directory & White-Label Portfolios
        </h3>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(330px, 1fr));gap:16px;margin-bottom:30px">
          ${companies.map(c => {
            const emps = allEmployees.filter(e => Number(e.companyId) === Number(c.id) && (e.status || '').toLowerCase() === 'active');
            const payroll = emps.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
            const isCurrentActive = String(activeId) === String(c.id);

            return `
              <div class="card" style="padding:20px;position:relative;border:1px solid ${isCurrentActive ? (c.primaryColor || 'var(--primary)') : 'var(--border)'};box-shadow:${isCurrentActive ? '0 0 14px rgba(99,102,241,0.2)' : 'var(--shadow-sm)'}">
                ${isCurrentActive ? `
                  <div style="position:absolute;top:14px;right:14px">
                    <span class="badge badge-primary" style="font-size:10px;font-weight:800;background:${c.primaryColor || 'var(--primary)'}">
                      <i class="fa fa-circle-dot"></i> ACTIVE CONTEXT
                    </span>
                  </div>
                ` : ''}

                <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                  <div style="width:46px;height:46px;border-radius:12px;background:${c.primaryColor || 'var(--primary)'};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;box-shadow:0 4px 10px ${c.primaryColor || '#4f46e5'}44">
                    ${c.logoText || 'CO'}
                  </div>
                  <div>
                    <h4 style="margin:0;font-size:15px;font-weight:800;color:var(--text)">${c.name}</h4>
                    <div style="font-size:11.5px;color:var(--text-3)">${c.tradeName} • ${c.isHolding ? 'Holding Company' : 'Subsidiary Entity'}</div>
                  </div>
                </div>

                <div style="font-size:12px;line-height:1.8;border-top:1px solid var(--border);padding-top:10px;margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">Tagline:</span>
                    <span style="font-style:italic;color:var(--text-2);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.tagline || 'Corporate Subsidiary'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">NTN Registration:</span>
                    <strong style="font-family:monospace">${c.ntn || '—'}</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">SECP Reg #:</span>
                    <span style="font-family:monospace;font-size:11px">${c.secpRegNo || '—'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">STRN (Sales Tax):</span>
                    <span style="font-family:monospace;font-size:11px">${c.strn || '—'}</span>
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
                    <strong style="color:${c.primaryColor || 'var(--primary)'}">${emps.length} Employees</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:var(--text-3)">Monthly Payroll:</span>
                    <strong style="font-family:monospace;color:var(--success)">PKR ${payroll.toLocaleString('en-PK')}</strong>
                  </div>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:12px;flex-wrap:wrap;gap:8px">
                  ${isAdmin ? `
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      <button class="btn btn-ghost btn-xs" onclick="Company.renderOfficialLetterModal(${c.id})" title="Official Subsidiary Letterhead & Certificates" style="color:var(--primary);font-weight:700">
                        <i class="fa fa-stamp"></i> Stationery
                      </button>
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
                    <button class="btn btn-ghost btn-xs" onclick="Company.renderOfficialLetterModal(${c.id})" style="color:var(--primary)">
                      <i class="fa fa-stamp"></i> Stationery
                    </button>
                    <span class="badge badge-secondary">${c.isHolding ? 'Holding' : 'Subsidiary'}</span>
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

          <div class="table-wrapper table-container" style="margin:0">
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
                          <div style="display:inline-flex;gap:4px">
                            <button class="btn btn-ghost btn-xs" onclick="Company.renderOfficialLetterModal(${comp.id}, ${e.id})" title="Generate Official Letter / Certificate" style="color:var(--primary)">
                              <i class="fa fa-stamp"></i> Letter
                            </button>
                            <button class="btn btn-ghost btn-xs" onclick="Company.openTransferModal(${e.id})" title="Transfer to another Subsidiary">
                              <i class="fa fa-arrow-right-arrow-left"></i> Transfer
                            </button>
                          </div>
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
  // ADMIN ACTION: ADD COMPANY MODAL WITH WHITE-LABEL PREVIEW
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
      <div class="modal" style="max-width:760px;width:95%;max-height:92vh;overflow-y:auto">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px">
            <i class="fa fa-building-circle-check" style="color:var(--primary)"></i>
            Register New Corporate Subsidiary / White-Label Entity
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('company-add-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:20px">
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Full Legal Company Name *</label>
              <input type="text" class="input input-sm" id="comp-add-name" placeholder="e.g. Apex Health & Pharma (Pvt) Ltd" oninput="Company.updateAddPreview()">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Brand / Trade Name *</label>
              <input type="text" class="input input-sm" id="comp-add-trade" placeholder="e.g. ApexPharma" oninput="Company.updateAddPreview()">
            </div>
          </div>

          <div style="margin-bottom:14px">
            <label class="form-label" style="font-weight:700;font-size:12px">Corporate Brand Tagline</label>
            <input type="text" class="input input-sm" id="comp-add-tagline" placeholder="e.g. Precision Diagnostics, Genomics & Specialized Therapeutics" oninput="Company.updateAddPreview()">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">FBR NTN Number *</label>
              <input type="text" class="input input-sm" id="comp-add-ntn" placeholder="e.g. 9849201-5" oninput="Company.updateAddPreview()">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">SECP Registration #</label>
              <input type="text" class="input input-sm" id="comp-add-secp" placeholder="e.g. SECP-ISB-0098492" oninput="Company.updateAddPreview()">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">STRN (Sales Tax #)</label>
              <input type="text" class="input input-sm" id="comp-add-strn" placeholder="e.g. 3200987654321">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Disbursement Bank *</label>
              <input type="text" class="input input-sm" id="comp-add-bank" placeholder="e.g. Meezan Bank Limited">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Corporate Branch</label>
              <input type="text" class="input input-sm" id="comp-add-branch" placeholder="e.g. Blue Area Corporate Branch">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">IBAN / Corporate Account #</label>
              <input type="text" class="input input-sm" id="comp-add-iban" placeholder="e.g. PK44MEZN0009988776655443">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Monogram Code (2-3)</label>
              <input type="text" class="input input-sm" id="comp-add-logo" maxlength="3" placeholder="PH" oninput="Company.updateAddPreview()">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Primary Color</label>
              <input type="color" class="input input-sm" id="comp-add-color" value="#0284c7" style="height:36px;padding:2px" onchange="Company.updateAddPreview()">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Secondary Accent</label>
              <input type="color" class="input input-sm" id="comp-add-secondary" value="#38bdf8" style="height:36px;padding:2px" onchange="Company.updateAddPreview()">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Legal Structure</label>
              <select class="input input-sm" id="comp-add-type">
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="Public Limited Company">Public Limited Company</option>
                <option value="LLP / Partnership">LLP / Partnership</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Authorized Signatory Name</label>
              <input type="text" class="input input-sm" id="comp-add-signatory" placeholder="e.g. Sara Malik">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Signatory Designation / Title</label>
              <input type="text" class="input input-sm" id="comp-add-title" placeholder="e.g. Director of Operations">
            </div>
          </div>

          <div style="margin-bottom:14px">
            <label class="form-label" style="font-weight:700;font-size:12px">Corporate Head Office Address</label>
            <input type="text" class="input input-sm" id="comp-add-address" placeholder="e.g. Plot 15, Industrial Estate, Hayatabad, Peshawar">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Contact Email</label>
              <input type="email" class="input input-sm" id="comp-add-email" placeholder="corporate@apexpharma.com.pk">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Contact Telephone</label>
              <input type="tel" class="input input-sm" id="comp-add-phone" placeholder="+92 91 5892014">
            </div>
          </div>

          <!-- Live White-Label Stationery Preview Box -->
          <div style="background:var(--surface-2);border:1px dashed var(--border);border-radius:10px;padding:14px;margin-top:10px">
            <div style="font-size:11px;font-weight:800;color:var(--text-3);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px">
              <i class="fa fa-eye"></i> Live White-Label Stationery Preview
            </div>
            <div id="add-preview-box" style="background:#ffffff;border-radius:8px;padding:12px 16px;border:1px solid #cbd5e1;display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:12px">
                <div id="add-prev-badge" style="width:38px;height:38px;border-radius:8px;background:#0284c7;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px">PH</div>
                <div>
                  <div id="add-prev-title" style="font-size:14px;font-weight:800;color:#0f172a">ApexPharma</div>
                  <div id="add-prev-sub" style="font-size:11px;color:#64748b">NTN: 9849201-5 • SECP Registered</div>
                </div>
              </div>
              <div style="border:1.5px dashed #0284c7;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:6px;font-weight:900;color:#0284c7;text-align:center;transform:rotate(-10deg)">
                OFFICIAL<br>SEAL
              </div>
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

  updateAddPreview() {
    const trade = document.getElementById('comp-add-trade')?.value.trim() || 'ApexPharma';
    const ntn = document.getElementById('comp-add-ntn')?.value.trim() || '9849201-5';
    const logo = (document.getElementById('comp-add-logo')?.value.trim() || trade.slice(0, 2)).toUpperCase();
    const color = document.getElementById('comp-add-color')?.value || '#0284c7';

    const b = document.getElementById('add-prev-badge');
    if (b) { b.textContent = logo; b.style.background = color; }
    const t = document.getElementById('add-prev-title');
    if (t) t.textContent = trade;
    const s = document.getElementById('add-prev-sub');
    if (s) s.textContent = `NTN: ${ntn} • SECP Registered`;
  },

  saveNewCompany() {
    if (!this.isAdmin()) {
      Toast.show('403 Forbidden: Only Super Admin can register entities.', 'error');
      return;
    }

    const name = document.getElementById('comp-add-name')?.value.trim();
    const tradeName = document.getElementById('comp-add-trade')?.value.trim();
    const tagline = document.getElementById('comp-add-tagline')?.value.trim() || 'Corporate Subsidiary Entity';
    const ntn = document.getElementById('comp-add-ntn')?.value.trim();
    const secpRegNo = document.getElementById('comp-add-secp')?.value.trim();
    const strn = document.getElementById('comp-add-strn')?.value.trim();
    const legalType = document.getElementById('comp-add-type')?.value;
    const disbursementBank = document.getElementById('comp-add-bank')?.value.trim();
    const bankBranch = document.getElementById('comp-add-branch')?.value.trim() || 'Corporate Branch';
    const bankAccount = document.getElementById('comp-add-iban')?.value.trim();
    const logoText = (document.getElementById('comp-add-logo')?.value.trim() || name.slice(0, 2)).toUpperCase();
    const primaryColor = document.getElementById('comp-add-color')?.value || '#0284c7';
    const secondaryColor = document.getElementById('comp-add-secondary')?.value || '#38bdf8';
    const signatoryName = document.getElementById('comp-add-signatory')?.value.trim() || 'Sara Malik';
    const signatoryTitle = document.getElementById('comp-add-title')?.value.trim() || 'Director of Operations';
    const headOfficeAddress = document.getElementById('comp-add-address')?.value.trim();
    const contactEmail = document.getElementById('comp-add-email')?.value.trim();
    const contactPhone = document.getElementById('comp-add-phone')?.value.trim();

    if (!name || !tradeName || !ntn || !disbursementBank) {
      Toast.show('Please fill mandatory fields: Legal Name, Trade Name, NTN, and Disbursement Bank.', 'warning');
      return;
    }

    const companies = DB.get('companies') || [];
    const nextId = companies.length > 0 ? Math.max(...companies.map(c => c.id || 0)) + 1 : 1;

    const newCompany = {
      id: nextId,
      code: 'APEX-' + tradeName.toUpperCase().slice(0, 4),
      name,
      tradeName,
      tagline,
      legalType,
      ntn,
      secpRegNo,
      strn,
      currency: 'PKR',
      disbursementBank,
      bankBranch,
      bankAccount,
      logoText,
      primaryColor,
      secondaryColor,
      letterheadHeader: `${name.toUpperCase()} — OPERATIONS CENTER`,
      letterheadFooter: `Registered with SECP under Companies Act 2017 • FBR NTN: ${ntn} • Confidential Corporate Record`,
      sealText: `OFFICIALLY VERIFIED • ${name.toUpperCase()} • PAKISTAN`,
      signatoryName,
      signatoryTitle,
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
  // ADMIN ACTION: EDIT COMPANY MODAL WITH WHITE-LABEL CUSTOMIZER
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
      <div class="modal" style="max-width:760px;width:95%;max-height:92vh;overflow-y:auto">
        <div class="modal-header">
          <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px">
            <i class="fa fa-pen-to-square" style="color:${c.primaryColor || 'var(--primary)'}"></i>
            Edit Corporate Entity & White-Label Tokens — ${c.tradeName || c.name}
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

          <div style="margin-bottom:14px">
            <label class="form-label" style="font-weight:700;font-size:12px">Corporate Brand Tagline</label>
            <input type="text" class="input input-sm" id="comp-edit-tagline" value="${c.tagline || ''}">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">FBR NTN Number *</label>
              <input type="text" class="input input-sm" id="comp-edit-ntn" value="${c.ntn || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">SECP Registration #</label>
              <input type="text" class="input input-sm" id="comp-edit-secp" value="${c.secpRegNo || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">STRN (Sales Tax #)</label>
              <input type="text" class="input input-sm" id="comp-edit-strn" value="${c.strn || ''}">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Disbursement Bank</label>
              <input type="text" class="input input-sm" id="comp-edit-bank" value="${c.disbursementBank || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Corporate Branch</label>
              <input type="text" class="input input-sm" id="comp-edit-branch" value="${c.bankBranch || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Bank IBAN / Account #</label>
              <input type="text" class="input input-sm" id="comp-edit-iban" value="${c.bankAccount || ''}">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Brand Monogram Code</label>
              <input type="text" class="input input-sm" id="comp-edit-logo" value="${c.logoText || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Primary Brand Color</label>
              <input type="color" class="input input-sm" id="comp-edit-color" value="${c.primaryColor || '#6366f1'}" style="height:36px;padding:2px">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Secondary Accent Color</label>
              <input type="color" class="input input-sm" id="comp-edit-secondary" value="${c.secondaryColor || '#06b6d4'}" style="height:36px;padding:2px">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Authorized Signatory Name</label>
              <input type="text" class="input input-sm" id="comp-edit-signatory" value="${c.signatoryName || 'Sara Malik'}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Signatory Designation / Title</label>
              <input type="text" class="input input-sm" id="comp-edit-title" value="${c.signatoryTitle || 'Director of Operations'}">
            </div>
          </div>

          <div style="margin-bottom:14px">
            <label class="form-label" style="font-weight:700;font-size:12px">Head Office Address</label>
            <input type="text" class="input input-sm" id="comp-edit-address" value="${c.headOfficeAddress || ''}">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Contact Email</label>
              <input type="email" class="input input-sm" id="comp-edit-email" value="${c.contactEmail || ''}">
            </div>
            <div>
              <label class="form-label" style="font-weight:700;font-size:12px">Contact Telephone</label>
              <input type="tel" class="input input-sm" id="comp-edit-phone" value="${c.contactPhone || ''}">
            </div>
          </div>

          <div style="margin-bottom:14px">
            <label class="form-label" style="font-weight:700;font-size:12px">Official Letterhead Footer Notice</label>
            <input type="text" class="input input-sm" id="comp-edit-footer" value="${c.letterheadFooter || 'Registered with SECP under Companies Act 2017 • Confidential Statutory Document'}">
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
    c.tagline = document.getElementById('comp-edit-tagline')?.value.trim() || c.tagline;
    c.ntn = document.getElementById('comp-edit-ntn')?.value.trim() || c.ntn;
    c.secpRegNo = document.getElementById('comp-edit-secp')?.value.trim() || c.secpRegNo;
    c.strn = document.getElementById('comp-edit-strn')?.value.trim() || c.strn;
    c.disbursementBank = document.getElementById('comp-edit-bank')?.value.trim() || c.disbursementBank;
    c.bankBranch = document.getElementById('comp-edit-branch')?.value.trim() || c.bankBranch;
    c.bankAccount = document.getElementById('comp-edit-iban')?.value.trim() || c.bankAccount;
    c.logoText = (document.getElementById('comp-edit-logo')?.value.trim() || c.logoText).toUpperCase();
    c.primaryColor = document.getElementById('comp-edit-color')?.value || c.primaryColor;
    c.secondaryColor = document.getElementById('comp-edit-secondary')?.value || c.secondaryColor;
    c.signatoryName = document.getElementById('comp-edit-signatory')?.value.trim() || c.signatoryName;
    c.signatoryTitle = document.getElementById('comp-edit-title')?.value.trim() || c.signatoryTitle;
    c.headOfficeAddress = document.getElementById('comp-edit-address')?.value.trim() || c.headOfficeAddress;
    c.contactEmail = document.getElementById('comp-edit-email')?.value.trim() || c.contactEmail;
    c.contactPhone = document.getElementById('comp-edit-phone')?.value.trim() || c.contactPhone;
    c.letterheadFooter = document.getElementById('comp-edit-footer')?.value.trim() || c.letterheadFooter;

    DB.set('companies', companies);
    document.getElementById('company-edit-modal')?.remove();
    Toast.show(`Updated corporate details for "${c.tradeName}"!`, 'success');

    // If active context matches, apply updated tokens immediately
    if (String(this.getActiveId()) === String(c.id)) {
      this.applyBrandTokens(c);
    }
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
  // ADMIN ACTION: INTER-COMPANY STAFF TRANSFER ENGINE
  // Preserves Continuous Service Tenure (Pakistan 30/26 Gratuity)
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
            <strong>Continuous Service Tenure Protection:</strong> Employee hire date, accumulated provident fund balance, and statutory gratuity tenure (Pakistan 30/26 formula) are 100% preserved during group entity transfers.
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

    // Execute transfer while preserving continuous service tenure
    const prevCompId = emp.companyId;
    emp.companyId = targetCompId;
    emp.transferredAt = transDate;
    emp.transferHistory = emp.transferHistory || [];
    emp.transferHistory.push({
      id: 'TRF-' + Date.now().toString(36).toUpperCase(),
      fromCompanyId: prevCompId,
      fromCompanyName: sourceComp?.tradeName || sourceComp?.name || 'Apex Technologies',
      toCompanyId: targetCompId,
      toCompanyName: targetComp?.tradeName || targetComp?.name || 'Apex Subsidiary',
      transferDate: transDate,
      transferType: transType,
      remarks: remarks || 'Continuous service inter-company relocation',
      approvedBy: (Auth.user && Auth.user.name) || 'Sara Malik (Super Admin)',
      continuousHireDate: emp.joiningDate || emp.joinDate || '2024-01-01',
      gratuityTenureStatus: '30/26 Exit Gratuity Continuous Tenure Preserved'
    });
    DB.set('employees', employees);

    // Audit log
    const logs = DB.get('audit_logs') || [];
    logs.unshift({
      id: Date.now(),
      action: 'INTER_COMPANY_TRANSFER',
      user: Auth.user?.username || 'admin',
      details: `Transferred ${emp.fullName} from "${sourceComp?.name}" to "${targetComp?.name}" (${transType}). 30/26 Gratuity tenure preserved.`,
      timestamp: new Date().toISOString()
    });
    DB.set('audit_logs', logs);

    document.getElementById('company-transfer-modal')?.remove();
    Toast.show(`Successfully transferred ${emp.fullName} to ${targetComp.tradeName}! Continuous tenure preserved.`, 'success');
    this.render();

    // Show completion dialog with 1-click letter issuance
    this.showTransferSuccessModal(emp, sourceComp, targetComp, transDate, transType);
  },

  showTransferSuccessModal(emp, sourceComp, targetComp, transDate, transType) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'company-transfer-success-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width:540px;width:95%;text-align:center;padding:24px">
        <div style="width:60px;height:60px;border-radius:50%;background:rgba(16,185,129,0.12);color:var(--success);display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:14px">
          <i class="fa fa-check"></i>
        </div>
        <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:var(--text)">Inter-Company Transfer Executed</h3>
        <p style="font-size:13px;color:var(--text-2);margin:0 0 16px;line-height:1.5">
          <strong>${emp.fullName}</strong> has been transferred from <strong>${sourceComp?.tradeName || 'Holding'}</strong> to <strong>${targetComp?.tradeName}</strong>.<br>
          <span style="font-size:12px;color:var(--success);font-weight:700">
            <i class="fa fa-shield-halved"></i> Continuous Service Tenure & 30/26 Exit Gratuity Preserved
          </span>
        </p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('company-transfer-success-modal').remove()">Done</button>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('company-transfer-success-modal').remove(); Company.renderOfficialLetterModal(${targetComp?.id}, ${emp.id})">
            <i class="fa fa-stamp"></i> Issue Official Transfer Order
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // ────────────────────────────────────────────────────────────
  // WHITE-LABEL CORPORATE STATIONERY & OFFICIAL LETTERS GENERATOR
  // ────────────────────────────────────────────────────────────
  renderOfficialLetterModal(companyId = null, empId = null) {
    const companies = DB.get('companies') || [];
    const comp = companies.find(c => Number(c.id) === Number(companyId)) || this.getActive() || companies[0];
    const employees = (DB.get('employees') || []).filter(e => (e.status || '').toLowerCase() === 'active');
    const selectedEmp = empId ? (employees.find(e => Number(e.id) === Number(empId)) || employees[0]) : employees[0] || {};

    const existing = document.getElementById('company-letter-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'company-letter-modal';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
      <div class="modal" style="max-width:880px;width:95%;max-height:92vh;overflow-y:auto">
        <div class="modal-header" style="border-bottom:1px solid var(--border);padding:16px 22px">
          <div>
            <div style="font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px;color:var(--text)">
              <i class="fa fa-stamp" style="color:${comp.primaryColor || 'var(--primary)'}"></i>
              Official Subsidiary Stationery & Letters Generator
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              Generate corporate letterhead, service verification, transfer notices, and tax certificates bearing authentic digital seals.
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" onclick="document.getElementById('company-letter-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="modal-body" style="padding:20px">
          <!-- Document Selector Bar -->
          <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:18px;background:var(--surface-2);padding:14px;border-radius:10px;border:1px solid var(--border)">
            <div style="flex:1;min-width:200px">
              <label class="form-label" style="font-size:11.5px;font-weight:700">Issuing Legal Entity</label>
              <select class="input input-sm" id="letter-comp-select" onchange="Company.renderOfficialLetterModal(this.value, document.getElementById('letter-emp-select').value)">
                ${companies.map(c => `<option value="${c.id}" ${Number(c.id) === Number(comp.id) ? 'selected' : ''}>${c.tradeName || c.name} (NTN: ${c.ntn})</option>`).join('')}
              </select>
            </div>
            <div style="flex:1;min-width:200px">
              <label class="form-label" style="font-size:11.5px;font-weight:700">Subject Employee</label>
              <select class="input input-sm" id="letter-emp-select" onchange="Company.renderOfficialLetterModal(document.getElementById('letter-comp-select').value, this.value)">
                ${employees.map(e => `<option value="${e.id}" ${Number(e.id) === Number(selectedEmp.id) ? 'selected' : ''}>${e.fullName} (${e.code || 'EMP-'+e.id}) - ${e.designation || 'Staff'}</option>`).join('')}
              </select>
            </div>
            <div style="flex:1;min-width:200px">
              <label class="form-label" style="font-size:11.5px;font-weight:700">Stationery Document Type</label>
              <select class="input input-sm" id="letter-type-select" onchange="Company.updateLetterContent()">
                <option value="service_cert">Continuous Service & Employment Certificate</option>
                <option value="transfer_order">Inter-Company Staff Transfer Order</option>
                <option value="salary_tax_cert">Annual Salary & FBR Tax Withholding Letter</option>
              </select>
            </div>
          </div>

          <!-- Printable Letter Canvas -->
          <div id="letter-printable-canvas" style="background:#ffffff;color:#1e293b;border:1px solid #cbd5e1;border-radius:10px;padding:36px 44px;box-shadow:0 4px 20px rgba(0,0,0,0.06);font-family:'Inter',sans-serif">
            <!-- Dynamic Letterhead Header -->
            <div style="border-bottom:2.5px solid ${comp.primaryColor || '#4f46e5'};padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start">
              <div style="display:flex;align-items:center;gap:16px">
                <div style="width:52px;height:52px;border-radius:12px;background:${comp.primaryColor || '#4f46e5'};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;box-shadow:0 4px 12px ${comp.primaryColor || '#4f46e5'}44">
                  ${comp.logoText || 'CO'}
                </div>
                <div>
                  <div style="font-size:20px;font-weight:900;color:#0f172a;letter-spacing:-0.2px">${comp.name}</div>
                  <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:2px">${comp.tradeName} • ${comp.tagline || 'Corporate Subsidiary Entity'}</div>
                  <div style="font-size:10.5px;color:#94a3b8;margin-top:2px;font-family:monospace">
                    FBR NTN: <strong>${comp.ntn || '—'}</strong> • SECP Reg: <strong>${comp.secpRegNo || '—'}</strong> ${comp.strn ? '• STRN: <strong>' + comp.strn + '</strong>' : ''}
                  </div>
                </div>
              </div>
              <div style="text-align:right;font-size:11px;color:#64748b;line-height:1.4">
                <div>${comp.headOfficeAddress || 'Islamabad, Pakistan'}</div>
                <div>Tel: ${comp.contactPhone || '+92 51 8849201'}</div>
                <div>Email: ${comp.contactEmail || 'corporate@apex.com.pk'}</div>
              </div>
            </div>

            <!-- Letter Body Container -->
            <div id="letter-body-content">
              ${Company.getLetterBody('service_cert', comp, selectedEmp)}
            </div>

            <!-- Footer & Digital Authorization Seal Block -->
            <div style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:20px;display:flex;justify-content:space-between;align-items:flex-end">
              <div>
                <div style="border-top:1.5px solid #0f172a;width:180px;padding-top:6px;font-size:12px;font-weight:800;color:#0f172a">
                  ${comp.signatoryName || 'Sara Malik'}
                </div>
                <div style="font-size:11px;color:#64748b;font-weight:600">
                  ${comp.signatoryTitle || 'Director of Human Capital & Operations'}
                </div>
                <div style="font-size:10.5px;color:#94a3b8">
                  ${comp.tradeName || comp.name}
                </div>
              </div>

              <!-- High-Fidelity Circular Digital Seal Stamp -->
              <div style="border:2.5px dashed ${comp.primaryColor || '#4f46e5'};border-radius:50%;width:88px;height:88px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${comp.primaryColor || '#4f46e5'};font-weight:900;text-align:center;padding:4px;transform:rotate(-10deg);box-shadow:inset 0 0 8px ${comp.primaryColor || '#4f46e5'}22">
                <span style="font-size:7.5px;letter-spacing:1px">★ VERIFIED ★</span>
                <span style="font-size:11px;letter-spacing:1.5px;margin:2px 0">${comp.logoText || 'SECP'}</span>
                <span style="font-size:6.5px;font-family:monospace">${comp.ntn || 'STATUTORY'}</span>
                <span style="font-size:6px;letter-spacing:0.5px">CORPORATE SEAL</span>
              </div>
            </div>

            <!-- Legal Letterhead Footer -->
            <div style="margin-top:24px;border-top:1px dashed #cbd5e1;padding-top:8px;font-size:9.5px;color:#94a3b8;text-align:center">
              ${comp.letterheadFooter || 'Registered with SECP under Companies Act 2017 • Confidential Statutory Employment Record'}
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding:14px 22px;display:flex;justify-content:space-between;align-items:center;background:var(--surface)">
          <span style="font-size:11.5px;color:var(--text-3)">
            <i class="fa fa-shield-halved" style="color:var(--primary)"></i> Ready for physical printout or electronic PDF dispatch.
          </span>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('company-letter-modal').remove()">Close</button>
            <button class="btn btn-primary btn-sm" onclick="Company.printOfficialLetter()" style="font-weight:700">
              <i class="fa fa-print"></i> Print Official Letter
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  updateLetterContent() {
    const compId = document.getElementById('letter-comp-select')?.value;
    const empId = document.getElementById('letter-emp-select')?.value;
    const docType = document.getElementById('letter-type-select')?.value || 'service_cert';

    const companies = DB.get('companies') || [];
    const comp = companies.find(c => Number(c.id) === Number(compId)) || this.getActive() || companies[0];
    const employees = DB.get('employees') || [];
    const emp = employees.find(e => Number(e.id) === Number(empId)) || employees[0] || {};

    const container = document.getElementById('letter-body-content');
    if (container) {
      container.innerHTML = Company.getLetterBody(docType, comp, emp);
    }
  },

  getLetterBody(type, comp, emp) {
    const today = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
    const hireDate = emp.joiningDate || emp.joinDate || '2024-01-15';
    const refNo = `APEX/${comp.code || 'CORP'}/${new Date().getFullYear()}/${String(emp.id || '101').padStart(4, '0')}`;
    const monthlySalary = Number(emp.salary || 120000);
    const annualGross = monthlySalary * 12;

    if (type === 'transfer_order') {
      return `
        <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#64748b">
          <div><strong>REF:</strong> ${refNo}-TRF</div>
          <div><strong>DATE:</strong> ${today}</div>
        </div>

        <h3 style="font-size:16px;font-weight:900;text-align:center;text-transform:uppercase;color:#0f172a;letter-spacing:0.5px;margin:20px 0 24px;border-bottom:1px solid #e2e8f0;padding-bottom:10px">
          INTER-COMPANY STAFF TRANSFER ORDER & POSTING NOTICE
        </h3>

        <div style="font-size:13px;line-height:1.7;color:#334155">
          <p>This executive order serves to formally notify the continuous-service inter-subsidiary relocation of <strong>${emp.fullName}</strong> (${emp.code || 'EMP-'+emp.id}), designated as <strong>${emp.designation || 'Specialist'}</strong> in the Department of <strong>${emp.department || 'Operations'}</strong>.</p>
          
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:18px 0">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">
              <div><strong>Transferring Entity:</strong> Apex Technologies / Holding</div>
              <div><strong>Receiving Entity:</strong> ${comp.name}</div>
              <div><strong>Effective Transfer Date:</strong> ${today}</div>
              <div><strong>Designated Office:</strong> ${comp.headOfficeAddress || 'Islamabad'}</div>
            </div>
          </div>

          <p><strong>Statutory Continuous Tenure Clause:</strong> Pursuant to Pakistan Labor Laws and corporate governance rules, the employee's original hire date of <strong>${hireDate}</strong> remains intact. There shall be no probation reset, no deduction in earned annual leave balances, and no interruption in continuous service qualification for the <strong>Pakistan Statutory 30/26 Exit Gratuity Formula</strong>.</p>

          <p>The corporate finance department of ${comp.tradeName} is instructed to enroll the employee into its designated disbursement account at <strong>${comp.disbursementBank}</strong> under corporate NTN <strong>${comp.ntn}</strong>.</p>
        </div>
      `;
    }

    if (type === 'salary_tax_cert') {
      return `
        <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#64748b">
          <div><strong>REF:</strong> ${refNo}-TAX</div>
          <div><strong>DATE:</strong> ${today}</div>
        </div>

        <h3 style="font-size:16px;font-weight:900;text-align:center;text-transform:uppercase;color:#0f172a;letter-spacing:0.5px;margin:20px 0 24px;border-bottom:1px solid #e2e8f0;padding-bottom:10px">
          ANNUAL SALARY & FBR PROGRESSIVE TAX WITHHOLDING CERTIFICATE
        </h3>

        <div style="font-size:13px;line-height:1.7;color:#334155">
          <p><strong>TO WHOM IT MAY CONCERN</strong></p>
          <p>This is to certify that <strong>${emp.fullName}</strong> (${emp.code || 'EMP-'+emp.id}) is a bonafide regular employee of <strong>${comp.name}</strong>, serving as <strong>${emp.designation || 'Executive'}</strong> since <strong>${hireDate}</strong>.</p>
          
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:18px 0">
            <div style="font-size:12.5px;font-weight:800;color:#0f172a;margin-bottom:10px">Current Emoluments Breakdown (Pak Rupees):</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
              <div>Monthly Basic & Allowances: <strong>PKR ${monthlySalary.toLocaleString()}</strong></div>
              <div>Projected Annual Gross: <strong>PKR ${annualGross.toLocaleString()}</strong></div>
              <div>FBR Progressive Salaried Tax: <strong>Compliant with 2025-27 Slabs</strong></div>
              <div>Corporate Withholding NTN: <strong>${comp.ntn}</strong></div>
            </div>
          </div>

          <p>All salary payments are disbursed through banking channels into the employee's designated account via ${comp.disbursementBank}. Income tax is deducted at source under Section 149 of the Income Tax Ordinance, 2001 and deposited directly to the Federal Board of Revenue.</p>
        </div>
      `;
    }

    // Default: service_cert
    return `
      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#64748b">
        <div><strong>REF:</strong> ${refNo}-SVC</div>
        <div><strong>DATE:</strong> ${today}</div>
      </div>

      <h3 style="font-size:16px;font-weight:900;text-align:center;text-transform:uppercase;color:#0f172a;letter-spacing:0.5px;margin:20px 0 24px;border-bottom:1px solid #e2e8f0;padding-bottom:10px">
        CONTINUOUS SERVICE & EMPLOYMENT VERIFICATION CERTIFICATE
      </h3>

      <div style="font-size:13px;line-height:1.7;color:#334155">
        <p><strong>TO WHOM IT MAY CONCERN</strong></p>
        <p>This official certificate is issued upon corporate record to confirm that <strong>${emp.fullName}</strong> (National ID / Code: <strong>${emp.code || 'EMP-'+emp.id}</strong>) is currently employed with <strong>${comp.name}</strong> in the active capacity of <strong>${emp.designation || 'Specialist'}</strong> within the <strong>${emp.department || 'Operations'}</strong> Department.</p>
        
        <p>The employee originally entered corporate group employment on <strong>${hireDate}</strong>. Under our Model A Conglomerate Governance framework, service tenure is continuous across corporate group entities and subsidiaries without any interruption in seniority or statutory entitlement.</p>

        <div style="background:#f8fafc;border-left:4px solid ${comp.primaryColor || '#4f46e5'};padding:12px 16px;margin:18px 0;border-radius:0 8px 8px 0">
          <strong style="color:#0f172a">Statutory Pakistan Exit Gratuity Coverage (30/26 Rule):</strong><br>
          <span style="font-size:12px;color:#475569">
            Qualifying service tenure is computed continuously from the verified hire date (${hireDate}) under the statutory Pakistan gratuity standard: <em>(Last Drawn Gross Salary ÷ 26 × 30) × Qualifying Years of Service</em>.
          </span>
        </div>

        <p>This certificate is issued at the request of the employee for official verification and record purposes without any financial liability on the part of the issuing corporation.</p>
      </div>
    `;
  },

  printOfficialLetter() {
    const canvas = document.getElementById('letter-printable-canvas');
    if (!canvas) return;

    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) {
      Toast.show('Popup blocked! Please allow popups to print official stationery.', 'warning');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Corporate Official Stationery</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 20px; background: #fff; color: #1e293b; }
            @media print {
              body { margin: 0; padding: 10px; }
              @page { size: A4; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          ${canvas.outerHTML}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
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
