const fs = require('fs');

let code = fs.readFileSync('js/performance.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Add getActiveStage and isTabActive helpers before render()
const renderAnchor = `  render() {
    const content = document.getElementById('page-content');`;

const helpersAndRender = `  getActiveStage() {
    if (['cycles', 'goals', 'kpi'].includes(this.currentView)) return 'cycles';
    if (['reviews', 'feedback360'].includes(this.currentView)) return 'reviews';
    if (['succession'].includes(this.currentView)) return 'succession';
    if (['lms'].includes(this.currentView)) return 'lms';
    return 'reviews';
  },

  isTabActive(tabId) {
    return this.getActiveStage() === tabId;
  },

  render() {
    const content = document.getElementById('page-content');`;

if (code.includes(renderAnchor)) {
  code = code.replace(renderAnchor, helpersAndRender);
  console.log('✅ Added getActiveStage and isTabActive helpers');
} else {
  console.log('⚠️ Could not find renderAnchor');
}

// 2. Replace 7 tabs with 4 Clean Lifecycle Stages in render()
const tabsAnchor = `        <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap">
          \${[
            { id:'reviews', label:'Performance Reviews', icon:'fa-clipboard-list' },
            { id:'cycles', label:'Appraisal Cycles & OKRs', icon:'fa-rotate' },
            { id:'feedback360', label:'360° Peer Feedback', icon:'fa-arrows-spin' },
            { id:'lms', label:'LMS & Skill Matrix', icon:'fa-graduation-cap' },
            { id:'succession', label:'9-Box & Succession', icon:'fa-sitemap' },
            { id:'kpi', label:'KPIs', icon:'fa-bullseye' },
            { id:'goals', label:'Goals & OKRs', icon:'fa-flag' },
          ].map(t => \`
            <button class="tab-toggle-btn \${this.currentView===t.id?'active':''}" onclick="Performance.switchView('\${t.id}')">
              <i class="fa \${t.icon}" style="margin-right:6px"></i>\${t.label}
            </button>
          \`).join('')}
        </div>`;

const newTabsAndSubNav = `        <!-- View Tabs: 4 Clean Lifecycle Stages -->
        <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border);flex-wrap:wrap">
          \${[
            { id:'cycles',     label:'Goals, KPIs & Appraisal Cycles', icon:'fa-bullseye' },
            { id:'reviews',    label:'Reviews & 360° Feedback', icon:'fa-clipboard-list' },
            { id:'succession', label:'9-Box Grid & Succession Planning', icon:'fa-sitemap' },
            { id:'lms',        label:'LMS & Competency Skill Matrix', icon:'fa-graduation-cap' },
          ].map(t => \`
            <button class="tab-toggle-btn \${this.isTabActive(t.id)?'active':''}" data-tab="\${t.id}" onclick="Performance.switchView('\${t.id}')">
              <i class="fa \${t.icon}" style="margin-right:6px"></i>\${t.label}
            </button>
          \`).join('')}
        </div>

        <!-- Stage Sub-Navigation -->
        \${this.getActiveStage() === 'cycles' ? \`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
              <button class="btn btn-sm \${this.currentView==='cycles'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('cycles')">
                <i class="fa fa-rotate"></i> Appraisal Cycles &amp; Setup
              </button>
              <button class="btn btn-sm \${this.currentView==='goals'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('goals')">
                <i class="fa fa-flag"></i> Goals &amp; OKRs
              </button>
              <button class="btn btn-sm \${this.currentView==='kpi'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('kpi')">
                <i class="fa fa-bullseye"></i> KPI Metrics Catalog
              </button>
            </div>
            \${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? \`
              <button class="btn btn-primary btn-sm" onclick="Performance.showAddCycleModal()">
                <i class="fa fa-plus"></i> New Cycle
              </button>
            \` : ''}
          </div>
        \` : this.getActiveStage() === 'reviews' ? \`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
              <button class="btn btn-sm \${this.currentView==='reviews'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('reviews')">
                <i class="fa fa-clipboard-list"></i> Performance Reviews
              </button>
              <button class="btn btn-sm \${this.currentView==='feedback360'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('feedback360')">
                <i class="fa fa-arrows-spin"></i> 360° Peer Feedback
              </button>
            </div>
            \${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? \`
              <button class="btn btn-primary btn-sm" onclick="Performance.showAddReview()">
                <i class="fa fa-plus"></i> Initiate Review
              </button>
            \` : ''}
          </div>
        \` : ''}`;

if (code.includes(tabsAnchor)) {
  code = code.replace(tabsAnchor, newTabsAndSubNav);
  console.log('✅ Updated Tabs to 4 clean stages with sub-navigation');
} else {
  console.log('⚠️ Could not find tabsAnchor');
}

// 3. Update switchView button active state updater
const switchViewAnchor = `  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('[onclick*="Performance.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\\w+)'/);
      if (m) b.classList.toggle('active', m[1] === view);
    });
    this.renderView();
  },`;

const newSwitchView = `  switchView(view) {
    this.currentView = view;
    this.render();
  },`;

if (code.includes(switchViewAnchor)) {
  code = code.replace(switchViewAnchor, newSwitchView);
  console.log('✅ Updated switchView to re-render stages cleanly');
} else {
  console.log('⚠️ Could not find switchViewAnchor');
}

// 4. Fix 9-Box Grid empty / sparse employee crash
const gridNineMapAnchor = `                <div style="display:flex;flex-direction:column;gap:6px">
                  \${box.emps.map(e => \`
                    <div style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:6px 10px;display:flex;align-items:center;gap:8px">
                      <div class="avatar avatar-sm" style="background:\${Utils.avatarColor(e.id)};width:24px;height:24px;font-size:10px">\${Utils.avatarInitials(e.fullName)}</div>
                      <div style="overflow:hidden">
                        <div style="font-size:12px;font-weight:700;white-space:nowrap;text-overflow:ellipsis">\${e.fullName}</div>
                        <div style="font-size:10px;color:var(--text-3)">\${Utils.getDesigName(e.designationId)}</div>
                      </div>
                    </div>
                  \`).join('')}
                </div>
              </div>

              <div style="font-size:10.5px;color:var(--text-3);margin-top:10px;text-align:right">
                \${box.emps.length} Talent Candidates
              </div>`;

const gridNineMapSafe = `                <div style="display:flex;flex-direction:column;gap:6px">
                  \${box.emps.filter(Boolean).map(e => \`
                    <div style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:6px 10px;display:flex;align-items:center;gap:8px">
                      <div class="avatar avatar-sm" style="background:\${Utils.avatarColor(e.id)};width:24px;height:24px;font-size:10px">\${Utils.avatarInitials(e.fullName)}</div>
                      <div style="overflow:hidden">
                        <div style="font-size:12px;font-weight:700;white-space:nowrap;text-overflow:ellipsis">\${e.fullName}</div>
                        <div style="font-size:10px;color:var(--text-3)">\${Utils.getDesigName(e.designationId)}</div>
                      </div>
                    </div>
                  \`).join('')}
                </div>
              </div>

              <div style="font-size:10.5px;color:var(--text-3);margin-top:10px;text-align:right">
                \${box.emps.filter(Boolean).length} Talent Candidates
              </div>`;

if (code.includes(gridNineMapAnchor)) {
  code = code.replace(gridNineMapAnchor, gridNineMapSafe);
  console.log('✅ Applied filter(Boolean) guard to 9-Box grid');
} else {
  console.log('⚠️ Could not find gridNineMapAnchor');
}

fs.writeFileSync('js/performance.js', code, 'utf8');
console.log('🎉 Successfully patched Performance into 4 clean lifecycle stages!');
