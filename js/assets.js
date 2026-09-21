// ============================================================
// HRM SYSTEM — Company Asset Inventory & Equipment Lifecycle
// Batch 5: Assets Management, Custody Audits, and Handover Clearance
// ============================================================

const Assets = {
  filterCategory: 'all',
  filterStatus: 'all',
  searchQuery: '',

  currentStage: 'inventory', // 'inventory' | 'custody' | 'maintenance' | 'returns'

  getActiveStage() {
    if (['inventory', 'catalog'].includes(this.currentStage)) return 'inventory';
    if (['custody', 'assigned', 'my_assets'].includes(this.currentStage)) return 'custody';
    if (['maintenance', 'repairs', 'warranties'].includes(this.currentStage)) return 'maintenance';
    if (['returns', 'depreciation', 'scrap'].includes(this.currentStage)) return 'returns';
    return 'inventory';
  },

  isTabActive(tabId) {
    return this.getActiveStage() === tabId;
  },

  switchStage(stage) {
    this.currentStage = stage;
    this.render();
  },


  render() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const role = Auth.role;
    const isEmp = role === 'employee';
    const allAssets = DB.get('assets') || [];
    const allEmps = DB.get('employees') || [];

    // Calculate executive inventory analytics
    const totalCount = allAssets.length;
    const assignedAssets = allAssets.filter(a => a.status === 'assigned');
    const availableAssets = allAssets.filter(a => a.status === 'available');
    const maintenanceAssets = allAssets.filter(a => a.status === 'maintenance');
    const totalValuation = allAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
    const myAssets = isEmp ? allAssets.filter(a => a.assignedTo === Auth.employee?.id) : [];

    const activeStage = this.getActiveStage();
    const warrantyExpiringCount = allAssets.filter(a => {
      if (!a.warrantyExpiry || a.warrantyExpiry === 'N/A') return false;
      const days = Math.ceil((new Date(a.warrantyExpiry) - new Date()) / (1000*60*60*24));
      return days <= 60 && days >= -30;
    }).length;

    // Define 4 Clean Lifecycle Stages
    const tabs = isEmp ? [
      { id: 'custody',     label: 'My Assigned Equipment', icon: 'fa-laptop-code', badge: myAssets.length || null },
      { id: 'inventory',   label: 'Company Hardware Catalog', icon: 'fa-boxes-stacked' },
      { id: 'maintenance', label: 'My Repair & Service Logs', icon: 'fa-wrench', badge: myAssets.filter(a => a.status === 'maintenance').length || null },
      { id: 'returns',     label: 'Custody Return Clearances', icon: 'fa-door-open' }
    ] : [
      { id: 'inventory',   label: 'Hardware Register & Catalog', icon: 'fa-boxes-stacked', badge: totalCount },
      { id: 'custody',     label: 'Custody & Handover Ledger', icon: 'fa-user-check', badge: assignedAssets.length },
      { id: 'maintenance', label: 'Maintenance & Warranty Radar', icon: 'fa-screwdriver-wrench', badge: (maintenanceAssets.length + warrantyExpiringCount) || null },
      { id: 'returns',     label: 'Return Clearance & Depreciation', icon: 'fa-scale-balanced' }
    ];

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- 4 Clean Lifecycle Stage Tabs -->
        <div style="display:flex;gap:6px;margin-bottom:20px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;flex-wrap:wrap;border:1px solid var(--border)">
          ${tabs.map(t => `
            <button class="tab-toggle-btn ${this.isTabActive(t.id) ? 'active' : ''}" onclick="Assets.switchStage('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
              ${t.badge !== undefined && t.badge !== null ? `<span class="badge badge-primary" style="margin-left:6px;font-size:10px;padding:2px 6px">${t.badge}</span>` : ''}
            </button>
          `).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary)">
              <i class="fa fa-laptop-file"></i>
            </span>
            ${isEmp ? 'My Assigned Company Assets & Equipment' : 'Company Asset Inventory & Equipment Lifecycle'}
          </h2>
          <div style="font-size:13px;color:var(--text-3);margin-top:4px">
            ${isEmp ? 'Manage hardware custody, verify serial numbers, and sign handover undertakings' : 'Enterprise hardware tracking, custody assignments, warranties, and return inspections'}
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${!isEmp ? `
            <button class="btn btn-outline btn-sm" onclick="Assets.exportCSV()">
              <i class="fa fa-file-csv"></i> Export Inventory
            </button>
            <button class="btn btn-outline btn-sm" onclick="Assets.showAssignModal()">
              <i class="fa fa-arrow-right-arrow-left"></i> Check-out / Assign
            </button>
            <button class="btn btn-primary btn-sm" onclick="Assets.showRegisterModal()">
              <i class="fa fa-plus"></i> Register New Asset
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="Helpdesk.showCreateModal('facilities', 'Equipment Replacement / Upgrade Request')">
              <i class="fa fa-wrench"></i> Request Hardware Upgrade
            </button>
          `}
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Total Inventory Value</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px">₨ ${(totalValuation / 1000000).toFixed(2)}M</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${totalCount} Total Capital Assets</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">In Active Custody</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:4px">${assignedAssets.length} <span style="font-size:13px;color:var(--text-muted)">(${Math.round(assignedAssets.length / (totalCount || 1) * 100)}%)</span></div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Assigned to Employees</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Available in Store</div>
          <div style="font-size:22px;font-weight:800;color:var(--info);margin-top:4px">${availableAssets.length} Units</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Ready for Immediate Deployment</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Maintenance / In Repair</div>
          <div style="font-size:22px;font-weight:800;color:var(--warning);margin-top:4px">${maintenanceAssets.length} Units</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Under Service Inspection</div>
        </div>
      </div>

      ${isEmp && myAssets.length === 0 ? `
        <div class="card" style="padding:40px;text-align:center;margin-bottom:24px">
          <div style="width:60px;height:60px;border-radius:50%;background:rgba(99,102,241,0.1);color:var(--primary);display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px">
            <i class="fa fa-laptop-code"></i>
          </div>
          <h3 style="font-size:16px;font-weight:700;color:var(--text);margin:0 0 6px">No Hardware Assets Assigned to Your Custody</h3>
          <p style="font-size:13px;color:var(--text-3);max-width:440px;margin:0 auto 16px">If you have been issued a company laptop, workstation, or test device, please contact the IT Administrator to update your custody ledger.</p>
        </div>
      ` : ''}

      <!-- Filter and Search Toolbar -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div style="position:relative;width:240px">
            <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:12px"></i>
            <input type="text" class="form-control" style="padding-left:30px;height:34px;font-size:12px" placeholder="Search Tag, Model, Serial..." value="${this.searchQuery}" oninput="Assets.searchQuery=this.value.trim().toLowerCase();Assets.renderTable()">
          </div>

          <select class="form-control" style="height:34px;font-size:12px;width:150px" onchange="Assets.filterCategory=this.value;Assets.renderTable()">
            <option value="all">All Categories</option>
            <option value="Laptop" ${this.filterCategory==='Laptop'?'selected':''}>Laptops</option>
            <option value="Workstation" ${this.filterCategory==='Workstation'?'selected':''}>Workstations</option>
            <option value="Display / Monitor" ${this.filterCategory==='Display / Monitor'?'selected':''}>Monitors</option>
            <option value="Mobile / Tablet" ${this.filterCategory==='Mobile / Tablet'?'selected':''}>Mobiles / QA</option>
            <option value="Vehicle" ${this.filterCategory==='Vehicle'?'selected':''}>Vehicles</option>
            <option value="Furniture / Ergonomics" ${this.filterCategory==='Furniture / Ergonomics'?'selected':''}>Furniture</option>
          </select>

          <select class="form-control" style="height:34px;font-size:12px;width:140px" onchange="Assets.filterStatus=this.value;Assets.renderTable()">
            <option value="all">All Statuses</option>
            <option value="assigned" ${this.filterStatus==='assigned'?'selected':''}>Assigned</option>
            <option value="available" ${this.filterStatus==='available'?'selected':''}>Available</option>
            <option value="maintenance" ${this.filterStatus==='maintenance'?'selected':''}>In Repair</option>
            <option value="retired" ${this.filterStatus==='retired'?'selected':''}>Retired</option>
          </select>
        </div>

        <div style="font-size:12px;color:var(--text-muted)">
          Showing <b id="asset-count-badge" style="color:var(--text)">${allAssets.length}</b> assets
        </div>
      </div>

      <!-- Assets Table Container -->
      <div id="assets-table-wrap"></div>
      </div>
    `;

    this.renderTable();
  },

  renderTable() {
    const wrap = document.getElementById('assets-table-wrap');
    if (!wrap) return;

    const role = Auth.role;
    const isEmp = role === 'employee';
    let assets = DB.get('assets') || [];
    const allEmps = DB.get('employees') || [];

    // Filter by search query
    if (this.searchQuery) {
      assets = assets.filter(a =>
        a.assetTag?.toLowerCase().includes(this.searchQuery) ||
        a.name?.toLowerCase().includes(this.searchQuery) ||
        a.serialNumber?.toLowerCase().includes(this.searchQuery) ||
        a.brand?.toLowerCase().includes(this.searchQuery)
      );
    }

    // Filter by Category
    if (this.filterCategory !== 'all') {
      assets = assets.filter(a => a.category === this.filterCategory);
    }

    // Filter by Active Stage
    const stage = this.getActiveStage();
    if (stage === 'custody') {
      assets = isEmp ? assets.filter(a => a.assignedTo === Auth.employee?.id) : assets.filter(a => a.status === 'assigned');
    } else if (stage === 'maintenance') {
      assets = assets.filter(a => a.status === 'maintenance' || a.condition === 'damaged' || a.condition === 'fair');
    } else if (stage === 'returns') {
      assets = assets.filter(a => a.status === 'retired' || a.status === 'available' || a.condition === 'damaged');
    }

    // Filter by Status
    if (this.filterStatus !== 'all') {
      assets = assets.filter(a => a.status === this.filterStatus);
    }

    // If employee, highlight their assets first
    if (isEmp) {
      assets.sort((a, b) => {
        if (a.assignedTo === Auth.employee?.id) return -1;
        if (b.assignedTo === Auth.employee?.id) return 1;
        return 0;
      });
    }

    const countBadge = document.getElementById('asset-count-badge');
    if (countBadge) countBadge.textContent = assets.length;

    if (assets.length === 0) {
      wrap.innerHTML = `
        <div class="card" style="padding:40px;text-align:center">
          <div style="font-size:36px;color:var(--text-muted);margin-bottom:12px"><i class="fa fa-box-open"></i></div>
          <h4 style="font-size:15px;font-weight:700;color:var(--text);margin:0 0 6px">No Assets Found</h4>
          <p style="font-size:12.5px;color:var(--text-3);margin:0">Try adjusting your filters or search keywords.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div class="card" style="overflow:hidden;padding:0">
        <div class="table-responsive">
          <table class="table" style="margin:0">
            <thead>
              <tr style="background:var(--surface)">
                <th style="width:120px">Asset Tag</th>
                <th>Asset Name &amp; Specifications</th>
                <th>Category</th>
                <th>Serial Number</th>
                <th>Assigned Custodian</th>
                <th>Condition</th>
                <th>Valuation</th>
                <th>Status</th>
                <th style="text-align:right;width:140px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${assets.map(a => {
                const custodian = allEmps.find(e => e.id === a.assignedTo);
                const isMyAsset = isEmp && a.assignedTo === Auth.employee?.id;

                let statusBadge = '<span class="badge badge-success">Assigned</span>';
                if (a.status === 'available') statusBadge = '<span class="badge badge-info">Available in Store</span>';
                if (a.status === 'maintenance') statusBadge = '<span class="badge badge-warning">In Repair</span>';
                if (a.status === 'retired') statusBadge = '<span class="badge badge-secondary">Retired</span>';

                let condBadge = '<span class="badge badge-success">Excellent</span>';
                if (a.condition === 'good') condBadge = '<span class="badge badge-primary">Good</span>';
                if (a.condition === 'fair') condBadge = '<span class="badge badge-warning">Fair</span>';
                if (a.condition === 'damaged') condBadge = '<span class="badge badge-danger">Damaged</span>';

                return `
                  <tr style="${isMyAsset ? 'background:rgba(99,102,241,0.06)' : ''}">
                    <td>
                      <span style="font-family:monospace;font-weight:700;font-size:12px;color:var(--primary);background:rgba(99,102,241,0.1);padding:3px 8px;border-radius:6px">
                        ${a.assetTag}
                      </span>
                    </td>
                    <td>
                      <div style="font-weight:700;font-size:13px;color:var(--text)">
                        ${a.name}
                        ${isMyAsset ? '<span class="badge badge-primary" style="margin-left:6px;font-size:10px">In Your Custody</span>' : ''}
                      </div>
                      <div style="font-size:11px;color:var(--text-3);margin-top:2px;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${a.specs || a.model || 'Standard Enterprise Spec'}
                      </div>
                    </td>
                    <td>
                      <span style="font-size:12px;color:var(--text-2);display:inline-flex;align-items:center;gap:6px">
                        <i class="fa ${this.getCategoryIcon(a.category)}" style="color:var(--primary);font-size:11px"></i>
                        ${a.category}
                      </span>
                    </td>
                    <td>
                      <span style="font-family:monospace;font-size:11.5px;color:var(--text-2)">
                        ${a.serialNumber || '—'}
                      </span>
                    </td>
                    <td>
                      ${custodian ? `
                        <div style="display:flex;align-items:center;gap:8px">
                          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(custodian.id)};width:26px;height:26px;font-size:10px;border-radius:50%;overflow:hidden">
                            ${custodian.photo ? `<img src="${custodian.photo}" style="width:100%;height:100%;object-fit:cover">` : Utils.avatarInitials(custodian.fullName)}
                          </div>
                          <div>
                            <div style="font-weight:600;font-size:12px;color:var(--text)">${custodian.fullName}</div>
                            <div style="font-size:10px;color:var(--text-muted)">Since ${a.assignedDate || '—'}</div>
                          </div>
                        </div>
                      ` : `
                        <span style="font-size:11.5px;color:var(--text-muted);font-style:italic">Unassigned (In IT Store)</span>
                      `}
                    </td>
                    <td>${condBadge}</td>
                    <td>
                      <div style="font-weight:700;font-size:12.5px;color:var(--text)">₨ ${(a.purchaseCost || 0).toLocaleString()}</div>
                      <div style="font-size:10px;color:var(--text-muted)">War: ${a.warrantyExpiry || 'N/A'}</div>
                    </td>
                    <td>${statusBadge}</td>
                    <td style="text-align:right">
                      <div style="display:inline-flex;gap:4px">
                        <button class="btn btn-ghost btn-xs" onclick="Assets.showDetailModal(${a.id})" title="View Details & Custody History">
                          <i class="fa fa-eye"></i>
                        </button>
                        <button class="btn btn-ghost btn-xs" onclick="Assets.printHandoverSlip(${a.id})" title="Print Handover Certificate">
                          <i class="fa fa-print"></i>
                        </button>
                        ${!isEmp ? `
                          ${a.status === 'assigned' ? `
                            <button class="btn btn-ghost btn-xs" style="color:var(--warning)" onclick="Assets.showReturnModal(${a.id})" title="Check-in / Return Asset">
                              <i class="fa fa-arrow-down-to-bracket"></i>
                            </button>
                          ` : `
                            <button class="btn btn-ghost btn-xs" style="color:var(--success)" onclick="Assets.showAssignModal(${a.id})" title="Assign to Employee">
                              <i class="fa fa-user-plus"></i>
                            </button>
                          `}
                          <button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="Assets.deleteAsset(${a.id})" title="Delete Asset Record">
                            <i class="fa fa-trash"></i>
                          </button>
                        ` : `
                          ${isMyAsset && !a.acknowledged ? `
                            <button class="btn btn-primary btn-xs" onclick="Assets.acknowledgeCustody(${a.id})">
                              <i class="fa fa-signature"></i> Sign Handover
                            </button>
                          ` : ''}
                        `}
                      </div>
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

  getCategoryIcon(cat) {
    switch (cat) {
      case 'Laptop': return 'fa-laptop';
      case 'Workstation': return 'fa-desktop';
      case 'Display / Monitor': return 'fa-tv';
      case 'Mobile / Tablet': return 'fa-mobile-screen';
      case 'Vehicle': return 'fa-car';
      case 'Furniture / Ergonomics': return 'fa-chair';
      case 'Access & Security': return 'fa-id-badge';
      default: return 'fa-box';
    }
  },

  showRegisterModal() {
    Modal.show('Register New Corporate Capital Asset', `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Asset Name & Model <span style="color:var(--danger)">*</span></label>
          <input type="text" class="form-control" id="ast-name" placeholder="e.g. Apple MacBook Pro 16 M3 Max" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category <span style="color:var(--danger)">*</span></label>
          <select class="form-control" id="ast-category">
            <option value="Laptop">Laptop</option>
            <option value="Workstation">Workstation / Desktop</option>
            <option value="Display / Monitor">Display / Monitor</option>
            <option value="Mobile / Tablet">Mobile / Tablet (QA Device)</option>
            <option value="Vehicle">Vehicle / Fleet</option>
            <option value="Furniture / Ergonomics">Furniture / Ergonomics</option>
            <option value="Access & Security">Access Card & Security</option>
            <option value="Peripheral">IT Peripheral</option>
          </select>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Brand / Manufacturer</label>
          <input type="text" class="form-control" id="ast-brand" placeholder="e.g. Apple, Dell, Lenovo, HP">
        </div>
        <div class="form-group">
          <label class="form-label">Hardware Serial Number <span style="color:var(--danger)">*</span></label>
          <input type="text" class="form-control" id="ast-serial" placeholder="e.g. C02G4589MD6V" required>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Purchase Cost (PKR) <span style="color:var(--danger)">*</span></label>
          <input type="number" class="form-control" id="ast-cost" placeholder="e.g. 850000" min="0" required>
        </div>
        <div class="form-group">
          <label class="form-label">Purchase Date</label>
          <input type="date" class="form-control" id="ast-purchase-date" value="${Utils.today()}">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Warranty Expiry Date</label>
          <input type="date" class="form-control" id="ast-warranty" value="2027-09-08">
        </div>
        <div class="form-group">
          <label class="form-label">Physical Location / Desk</label>
          <input type="text" class="form-control" id="ast-location" placeholder="e.g. Karachi IT Storeroom / Desk #14" value="Karachi IT Storeroom">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Technical Specifications</label>
        <textarea class="form-control" id="ast-specs" rows="2" placeholder="Processor, RAM, Storage, Screen resolution, Accessories included..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Assets.submitRegister()"><i class="fa fa-check"></i> Register Asset</button>
      `
    });
  },

  submitRegister() {
    const name = document.getElementById('ast-name')?.value.trim();
    const serialNumber = document.getElementById('ast-serial')?.value.trim();
    const category = document.getElementById('ast-category')?.value;
    const purchaseCost = parseFloat(document.getElementById('ast-cost')?.value) || 0;

    if (!name || !serialNumber) {
      Toast.show('Please fill in required fields (Name and Serial Number)', 'error');
      return;
    }

    const assets = DB.get('assets') || [];
    const prefixMap = {
      'Laptop': 'AST-LPT', 'Workstation': 'AST-WRK', 'Display / Monitor': 'AST-MON',
      'Mobile / Tablet': 'AST-MOB', 'Vehicle': 'AST-VEH', 'Furniture / Ergonomics': 'AST-FUR',
      'Access & Security': 'AST-SEC', 'Peripheral': 'AST-PER'
    };
    const pfx = prefixMap[category] || 'AST-IT';
    const tagNum = String(assets.length + 1).padStart(3, '0');
    const assetTag = `${pfx}-${tagNum}`;

    const newAsset = {
      id: Utils.generateId(),
      assetTag,
      name,
      category,
      brand: document.getElementById('ast-brand')?.value.trim() || 'Enterprise',
      model: name,
      serialNumber,
      purchaseCost,
      purchaseDate: document.getElementById('ast-purchase-date')?.value || Utils.today(),
      warrantyExpiry: document.getElementById('ast-warranty')?.value || 'N/A',
      location: document.getElementById('ast-location')?.value.trim() || 'IT Store',
      specs: document.getElementById('ast-specs')?.value.trim() || '',
      status: 'available',
      assignedTo: null,
      assignedDate: null,
      condition: 'excellent',
      acknowledged: false,
      custodyHistory: []
    };

    assets.push(newAsset);
    DB.set('assets', assets);
    DB.log('CREATE', 'Assets', `Registered new capital asset ${assetTag} (${name})`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show(`Asset ${assetTag} registered successfully!`, 'success');
    this.render();
  },

  showAssignModal(preSelectedAssetId) {
    const assets = (DB.get('assets') || []).filter(a => a.status === 'available' || a.id === preSelectedAssetId);
    const emps = (DB.get('employees') || []).filter(e => e.status === 'active');

    if (assets.length === 0) {
      Toast.show('No available assets in store to assign! Register an asset first.', 'warning');
      return;
    }

    Modal.show('Assign Hardware Asset Custody', `
      <div class="form-group">
        <label class="form-label">Select Asset to Check-out <span style="color:var(--danger)">*</span></label>
        <select class="form-control" id="assign-asset-id">
          ${assets.map(a => `<option value="${a.id}" ${a.id===preSelectedAssetId?'selected':''}>${a.assetTag} - ${a.name} (${a.serialNumber})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Assignee (Employee) <span style="color:var(--danger)">*</span></label>
        <select class="form-control" id="assign-emp-id">
          ${emps.map(e => `<option value="${e.id}">${e.fullName} (${Utils.getDesigName(e.designationId)} - ${Utils.getDeptName(e.departmentId)})</option>`).join('')}
        </select>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Handover Date</label>
          <input type="date" class="form-control" id="assign-date" value="${Utils.today()}">
        </div>
        <div class="form-group">
          <label class="form-label">Condition at Handover</label>
          <select class="form-control" id="assign-condition">
            <option value="excellent">Excellent (New / Pristine)</option>
            <option value="good" selected>Good (Normal Minor Wear)</option>
            <option value="fair">Fair (Visible Scuffs)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Handover Remarks &amp; Accessories</label>
        <textarea class="form-control" id="assign-remarks" rows="2" placeholder="e.g. Issued with original 140W USB-C MagSafe Charger, laptop sleeve, and wireless mouse."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Assets.submitAssign()"><i class="fa fa-arrow-right-arrow-left"></i> Confirm Check-out</button>
      `
    });
  },

  submitAssign() {
    const assetId = parseInt(document.getElementById('assign-asset-id')?.value);
    const empId = parseInt(document.getElementById('assign-emp-id')?.value);
    const assignDate = document.getElementById('assign-date')?.value || Utils.today();
    const condition = document.getElementById('assign-condition')?.value || 'good';
    const remarks = document.getElementById('assign-remarks')?.value.trim() || 'Regular assignment';

    const assets = DB.get('assets') || [];
    const asset = assets.find(a => a.id === assetId);
    const emp = DB.find('employees', empId);

    if (!asset || !emp) {
      Toast.show('Invalid asset or employee selection', 'error');
      return;
    }

    asset.status = 'assigned';
    asset.assignedTo = empId;
    asset.assignedDate = assignDate;
    asset.condition = condition;
    asset.acknowledged = false;

    if (!asset.custodyHistory) asset.custodyHistory = [];
    asset.custodyHistory.unshift({
      employeeId: empId,
      assignedDate: assignDate,
      returnDate: null,
      condition,
      remarks
    });

    DB.set('assets', assets);
    DB.log('ASSIGN', 'Assets', `Checked out asset ${asset.assetTag} to ${emp.fullName}`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show(`Asset ${asset.assetTag} checked out to ${emp.fullName}!`, 'success');
    this.render();
  },

  showReturnModal(assetId) {
    const asset = DB.find('assets', assetId);
    if (!asset) return;
    const custodian = DB.find('employees', asset.assignedTo);

    Modal.show('Asset Check-in & Return Inspection', `
      <div style="background:var(--surface);padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:13px">
        <div><b>Asset:</b> ${asset.assetTag} - ${asset.name}</div>
        <div><b>Current Custodian:</b> ${custodian ? custodian.fullName : 'Unknown'}</div>
        <div><b>Serial Number:</b> ${asset.serialNumber}</div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Return Date</label>
          <input type="date" class="form-control" id="return-date" value="${Utils.today()}">
        </div>
        <div class="form-group">
          <label class="form-label">Inspected Return Condition <span style="color:var(--danger)">*</span></label>
          <select class="form-control" id="return-condition">
            <option value="excellent">Excellent (Clean, no damage)</option>
            <option value="good" selected>Good (Normal expected wear)</option>
            <option value="fair">Fair (Scratches/Cosmetic wear)</option>
            <option value="damaged">Damaged (Faulty/Requires repair)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Next Destination Status</label>
        <select class="form-control" id="return-status">
          <option value="available" selected>Return to IT Storeroom (Available)</option>
          <option value="maintenance">Send to Maintenance Workshop</option>
          <option value="retired">Retire / Scrap Asset</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Return Inspection Notes &amp; Clearance</label>
        <textarea class="form-control" id="return-notes" rows="2" placeholder="Accessories verified, iCloud/MDM signed out, factory reset conducted..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Assets.submitReturn(${assetId})"><i class="fa fa-check"></i> Complete Return Inspection</button>
      `
    });
  },

  submitReturn(assetId) {
    const returnDate = document.getElementById('return-date')?.value || Utils.today();
    const condition = document.getElementById('return-condition')?.value || 'good';
    const nextStatus = document.getElementById('return-status')?.value || 'available';
    const notes = document.getElementById('return-notes')?.value.trim() || 'Returned in good order';

    const assets = DB.get('assets') || [];
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const prevCustId = asset.assignedTo;
    const prevCust = DB.find('employees', prevCustId);

    // Update custody history
    if (asset.custodyHistory && asset.custodyHistory.length > 0) {
      const activeEntry = asset.custodyHistory.find(h => !h.returnDate);
      if (activeEntry) {
        activeEntry.returnDate = returnDate;
        activeEntry.returnCondition = condition;
        activeEntry.returnNotes = notes;
      }
    }

    asset.status = nextStatus;
    asset.assignedTo = null;
    asset.assignedDate = null;
    asset.condition = condition;
    asset.acknowledged = false;

    DB.set('assets', assets);
    DB.log('RETURN', 'Assets', `Checked in asset ${asset.assetTag} from ${prevCust?.fullName || 'custodian'} (${nextStatus})`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show(`Asset ${asset.assetTag} successfully returned and inspected!`, 'success');
    this.render();
  },

  acknowledgeCustody(assetId) {
    const assets = DB.get('assets') || [];
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    Modal.confirm(`I acknowledge receipt of company asset ${asset.assetTag} (${asset.name}, Serial: ${asset.serialNumber}) in good condition, and undertake to maintain it in accordance with corporate IT security and acceptable use policies.`, () => {
      asset.acknowledged = true;
      DB.set('assets', assets);
      DB.log('ACKNOWLEDGE', 'Assets', `Digitally signed custody acknowledgment for ${asset.assetTag}`, Auth.user?.id);
      Toast.show('Digital custody acknowledgment signed successfully!', 'success');
      this.render();
    });
  },

  showDetailModal(assetId) {
    const asset = DB.find('assets', assetId);
    if (!asset) return;
    const custodian = DB.find('employees', asset.assignedTo);
    const emps = DB.get('employees') || [];

    Modal.show(`Asset Dossier: ${asset.assetTag}`, `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--surface);padding:12px;border-radius:8px">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase">Asset Tag</div>
          <div style="font-size:16px;font-weight:800;color:var(--primary);font-family:monospace">${asset.assetTag}</div>
        </div>
        <div style="background:var(--surface);padding:12px;border-radius:8px">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase">Hardware Serial</div>
          <div style="font-size:14px;font-weight:700;color:var(--text);font-family:monospace">${asset.serialNumber}</div>
        </div>
        <div style="background:var(--surface);padding:12px;border-radius:8px">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase">Purchase Cost</div>
          <div style="font-size:15px;font-weight:700;color:var(--success)">₨ ${(asset.purchaseCost||0).toLocaleString()}</div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px">Technical Specifications:</div>
        <div style="font-size:13px;color:var(--text-2);background:var(--surface);padding:10px 14px;border-radius:8px">
          ${asset.specs || 'Standard manufacturer specifications.'}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;font-size:12.5px">
        <div><b>Category:</b> ${asset.category}</div>
        <div><b>Brand / Model:</b> ${asset.brand} / ${asset.model || asset.name}</div>
        <div><b>Purchase Date:</b> ${asset.purchaseDate || '—'}</div>
        <div><b>Warranty Expiry:</b> ${asset.warrantyExpiry || '—'}</div>
        <div><b>Current Location:</b> ${asset.location || 'Karachi HQ'}</div>
        <div><b>Physical Condition:</b> ${asset.condition?.toUpperCase() || 'GOOD'}</div>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <i class="fa fa-history" style="color:var(--primary)"></i> Custody Assignment Timeline
        </div>
        ${(asset.custodyHistory && asset.custodyHistory.length > 0) ? `
          <div style="display:grid;gap:8px">
            ${asset.custodyHistory.map(h => {
              const u = emps.find(e => e.id === h.employeeId);
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--surface);border-radius:6px;font-size:12px">
                  <div>
                    <b>${u ? u.fullName : 'Employee #' + h.employeeId}</b>
                    <span style="color:var(--text-muted);margin-left:8px">(${h.assignedDate} → ${h.returnDate || 'Present'})</span>
                    <div style="color:var(--text-3);font-size:11px;margin-top:2px">${h.remarks || ''}</div>
                  </div>
                  <span class="badge ${h.returnDate ? 'badge-secondary' : 'badge-success'}">${h.returnDate ? 'Returned' : 'Active Custody'}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="font-size:12px;color:var(--text-muted);font-style:italic">No previous custody transfers recorded.</div>
        `}
      </div>
    `, {
      footer: `
        <button class="btn btn-outline" onclick="Assets.printHandoverSlip(${asset.id})"><i class="fa fa-print"></i> Print Handover Slip</button>
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
      `
    });
  },

  deleteAsset(assetId) {
    const asset = DB.find('assets', assetId);
    if (!asset) return;

    Modal.confirm(`Are you sure you want to delete asset record ${asset.assetTag} (${asset.name})? This action cannot be undone.`, () => {
      const assets = (DB.get('assets') || []).filter(a => a.id !== assetId);
      DB.set('assets', assets);
      DB.log('DELETE', 'Assets', `Deleted asset record ${asset.assetTag}`, Auth.user?.id);
      Toast.show(`Asset ${asset.assetTag} removed from inventory.`, 'warning');
      this.render();
    });
  },

  printHandoverSlip(assetId) {
    const asset = DB.find('assets', assetId);
    if (!asset) return;
    const custodian = DB.find('employees', asset.assignedTo) || { fullName: '______________________', cnic: '42101-XXXXXXXX-X', designation: 'Employee' };
    const settings = DB.getObj('settings') || { companyName: 'HRM Pro Enterprise Solutions' };

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Asset Handover Undertaking - ${asset.assetTag}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; font-size: 13px; }
          .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 6px; }
          .box b { color: #0f172a; }
          .terms { font-size: 11.5px; color: #334155; margin-bottom: 40px; text-align: justify; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
          .sig-line { border-top: 1px solid #0f172a; padding-top: 8px; font-size: 12px; text-align: center; }
          @media print { body { padding: 15mm; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${settings.companyName}</div>
          <div class="subtitle">CORPORATE IT EQUIPMENT CUSTODY UNDERTAKING &amp; HANDOVER CERTIFICATE</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px">Document Ref: AST-ACK-${asset.assetTag}-${new Date().getFullYear()}</div>
        </div>

        <div class="grid">
          <div class="box">
            <b>CUSTODIAN DETAILS:</b><br><br>
            <b>Employee Name:</b> ${custodian.fullName}<br>
            <b>CNIC No:</b> ${custodian.cnic || 'Verified on file'}<br>
            <b>Designation:</b> ${Utils.getDesigName(custodian.designationId) || 'Staff'}<br>
            <b>Handover Date:</b> ${asset.assignedDate || Utils.today()}
          </div>
          <div class="box">
            <b>HARDWARE SPECIFICATIONS:</b><br><br>
            <b>Asset Tag:</b> ${asset.assetTag}<br>
            <b>Item Name:</b> ${asset.name}<br>
            <b>Serial Number:</b> ${asset.serialNumber}<br>
            <b>Declared Value:</b> PKR ${(asset.purchaseCost || 0).toLocaleString()}
          </div>
        </div>

        <div class="terms">
          <b>TERMS &amp; ACCEPTABLE USE UNDERTAKING:</b><br>
          1. The above-listed company property is issued solely for official business activities and remains the exclusive capital property of the Company.<br>
          2. The employee agrees to exercise due care, safeguard the device from physical damage, water spillages, and theft, and avoid unauthorized hardware modifications.<br>
          3. In the event of loss or gross negligence resulting in destruction, the incident must be reported to IT and HR within 24 hours.<br>
          4. Upon cessation of employment, exit clearance, or upon company demand, this asset must be surrendered in good operational condition to IT Operations.
        </div>

        <div class="signatures">
          <div>
            <div class="sig-line">
              <b>ISSUED BY (IT ADMINISTRATOR)</b><br>
              Signature &amp; Corporate Stamp
            </div>
          </div>
          <div>
            <div class="sig-line">
              <b>RECEIVED &amp; UNDERTAKEN BY (EMPLOYEE)</b><br>
              ${custodian.fullName} (Sign &amp; Date)
            </div>
          </div>
        </div>

        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  },

  exportCSV() {
    const assets = DB.get('assets') || [];
    const emps = DB.get('employees') || [];

    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Brand', 'Serial Number', 'Purchase Cost (PKR)', 'Purchase Date', 'Warranty Expiry', 'Status', 'Condition', 'Custodian Name', 'Location'];
    const rows = assets.map(a => {
      const e = emps.find(emp => emp.id === a.assignedTo);
      return [
        `"${a.assetTag}"`,
        `"${a.name}"`,
        `"${a.category}"`,
        `"${a.brand}"`,
        `"${a.serialNumber}"`,
        a.purchaseCost || 0,
        `"${a.purchaseDate || ''}"`,
        `"${a.warrantyExpiry || ''}"`,
        `"${a.status}"`,
        `"${a.condition}"`,
        `"${e ? e.fullName : 'Unassigned'}"`,
        `"${a.location || ''}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    Utils.downloadCSV(csvContent, `Company_Assets_Inventory_${Utils.today()}.csv`);
    Toast.show('Asset inventory CSV exported!', 'success');
  }
};
