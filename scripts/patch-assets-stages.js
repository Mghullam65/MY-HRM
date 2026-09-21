const fs = require('fs');
const path = require('path');

console.log('=== Updating js/assets.js to 4 Clean Lifecycle Stages ===');
const assetsPath = path.join(__dirname, '../js/assets.js');
let code = fs.readFileSync(assetsPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add currentStage, getActiveStage, isTabActive, switchStage to Assets object
const stageHelpers = `
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
`;

code = code.replace(
  `const Assets = {\n  filterCategory: 'all',\n  filterStatus: 'all',\n  searchQuery: '',`,
  `const Assets = {\n  filterCategory: 'all',\n  filterStatus: 'all',\n  searchQuery: '',\n${stageHelpers}`
);

// 2. Update render() to include 4-stage Tab Navigation and stage-specific content
const oldRenderHead = `    container.innerHTML = \`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">`;

const newRenderHead = `    const activeStage = this.getActiveStage();
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

    container.innerHTML = \`
      <div class="animate-fade-in">
        <!-- 4 Clean Lifecycle Stage Tabs -->
        <div style="display:flex;gap:6px;margin-bottom:20px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;flex-wrap:wrap;border:1px solid var(--border)">
          \${tabs.map(t => \`
            <button class="tab-toggle-btn \${this.isTabActive(t.id) ? 'active' : ''}" onclick="Assets.switchStage('\${t.id}')">
              <i class="fa \${t.icon}" style="margin-right:6px"></i>\${t.label}
              \${t.badge !== undefined && t.badge !== null ? \`<span class="badge badge-primary" style="margin-left:6px;font-size:10px;padding:2px 6px">\${t.badge}</span>\` : ''}
            </button>
          \`).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">`;

code = code.replace(oldRenderHead, newRenderHead);

// Close the wrapper div at the end of render()
code = code.replace(
  `      <!-- Assets Table Container -->\n      <div id="assets-table-wrap"></div>\n    \`;\n\n    this.renderTable();\n  },`,
  `      <!-- Assets Table Container -->\n      <div id="assets-table-wrap"></div>\n      </div>\n    \`;\n\n    this.renderTable();\n  },`
);

// 3. Update renderTable() to filter by active stage
const oldFilterBlock = `    // Filter by Status\n    if (this.filterStatus !== 'all') {\n      assets = assets.filter(a => a.status === this.filterStatus);\n    }`;

const newFilterBlock = `    // Filter by Active Stage
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
      assets = assets.filter(a => a.status === this.filterStatus);\n    }`;

code = code.replace(oldFilterBlock, newFilterBlock);

fs.writeFileSync(assetsPath, code, 'utf8');
console.log('✅ Successfully patched js/assets.js to 4 clean stages!');
