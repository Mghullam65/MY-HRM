const fs = require('fs');
const path = require('path');

console.log('🚀 Patching js/app.js with 7-Feature Pro UI Suite...');

const appPath = path.join(__dirname, '../js/app.js');
let code = fs.readFileSync(appPath, 'utf8');

// 1. Update Toast.show
const oldToastBlock = `const Toast = {
  show(message, type = 'info', subtitle = '') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = \`toast toast-\${type}\`;
    toast.innerHTML = \`
      <i class="fa \${icons[type] || icons.info} toast-icon"></i>
      <div>
        <div class="toast-msg">\${message}</div>
        \${subtitle ? \`<div class="toast-sub">\${subtitle}</div>\` : ''}
      </div>
    \`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};`;

const newToastBlock = `const Toast = {
  show(message, type = 'info', subtitle = '', duration = 4000, onUndo = null) {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = \`toast toast-\${type}\`;
    const toastId = 'toast_' + Date.now() + '_' + Math.floor(Math.random()*1000);
    toast.id = toastId;

    toast.innerHTML = \`
      <i class="fa \${icons[type] || icons.info} toast-icon"></i>
      <div style="flex:1;min-width:0">
        <div class="toast-msg" style="font-size:13px;font-weight:700;color:var(--text)">\${message}</div>
        \${subtitle ? \`<div class="toast-sub" style="font-size:11.5px;color:var(--text-3);margin-top:2px">\${subtitle}</div>\` : ''}
      </div>
      \${onUndo ? \`<button class="toast-undo-btn" id="\${toastId}_undo"><i class="fa fa-rotate-left"></i> Undo</button>\` : ''}
      <div class="toast-progress" style="animation-duration:\${duration}ms"></div>
    \`;

    container.appendChild(toast);

    if (onUndo) {
      setTimeout(() => {
        const undoBtn = document.getElementById(\`\${toastId}_undo\`);
        undoBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          try { onUndo(); } catch (err) { console.error('Toast undo error:', err); }
          toast.classList.add('removing');
          setTimeout(() => toast.remove(), 250);
        });
      }, 10);
    }

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};`;

if (code.includes(oldToastBlock)) {
  code = code.replace(oldToastBlock, newToastBlock);
  console.log('✅ Updated Toast.show with animated timer bar & undo capability');
} else {
  console.log('⚠️ Could not find exact oldToastBlock');
}

// 2. Update navigate() to use skeleton shimmer during loading
const oldNavLoading = `content.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';`;
const newNavLoading = `content.innerHTML = (typeof Utils !== 'undefined' && Utils.renderSkeleton)
      ? \`<div class="animate-fade-in" style="padding:16px 0">\${Utils.renderSkeleton(module === 'dashboard' ? 'dashboard' : 'table')}</div>\`
      : '<div class="loading-overlay"><div class="spinner"></div></div>';`;

if (code.includes(oldNavLoading)) {
  code = code.replace(oldNavLoading, newNavLoading);
  console.log('✅ Replaced spinner with animated skeleton shimmer in navigate()');
}

// 3. Add Keyboard Shortcuts button in renderTopbar()
const oldTopbarActionsStart = '<!-- Quick Spotlight Launcher Button -->';
const newTopbarShortcutsButton = `<!-- Keyboard Shortcuts Modal Trigger -->
        <button class="topbar-btn" onclick="App.showShortcutsModal()" title="Keyboard Shortcuts Cheat Sheet (?)">
          <i class="fa fa-keyboard"></i>
        </button>

        <!-- Quick Spotlight Launcher Button -->`;

if (code.includes(oldTopbarActionsStart)) {
  code = code.replace(oldTopbarActionsStart, newTopbarShortcutsButton);
  console.log('✅ Added Keyboard Shortcuts button to topbar');
}

// 4. Update setupKeyboardShortcuts() with hotkey sequence detection (G then D, etc.)
const oldKeyboardStart = '  setupKeyboardShortcuts() {';
const oldKeyboardEnd = '  // ═══════════════════════════════════════════════\n  // MODERN UI SUITE: BREADCRUMBS, DENSITY & ACCENTS';

const idxKbStart = code.indexOf(oldKeyboardStart);
const idxKbEnd = code.indexOf(oldKeyboardEnd);

if (idxKbStart !== -1 && idxKbEnd !== -1) {
  const newKeyboardCode = `  keySequence: '',
  keySequenceTimer: null,

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const paletteOverlay = document.getElementById('cmd-palette-overlay');
      const isPaletteOpen = paletteOverlay && paletteOverlay.classList.contains('open');
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;

      if (isPaletteOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.commandPaletteItems && this.commandPaletteItems.length > 0) {
            this.commandPaletteIndex = (this.commandPaletteIndex + 1) % this.commandPaletteItems.length;
            this.updateCommandPaletteSelection();
          }
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.commandPaletteItems && this.commandPaletteItems.length > 0) {
            this.commandPaletteIndex = (this.commandPaletteIndex - 1 + this.commandPaletteItems.length) % this.commandPaletteItems.length;
            this.updateCommandPaletteSelection();
          }
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          this.triggerCommandByIndex(this.commandPaletteIndex);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeCommandPalette();
          return;
        }
      }

      // Hotkey: '?' or 'Shift + /' → open shortcuts cheatsheet
      if (!isInputActive && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        this.showShortcutsModal();
        return;
      }

      // Hotkey: 'T' → toggle dark / light theme
      if (!isInputActive && (e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.toggleTheme();
        return;
      }

      // Hotkey: 'D' → toggle table density
      if (!isInputActive && (e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.toggleTableDensity();
        return;
      }

      // Two-key chord navigation (e.g. 'G' then 'D')
      if (!isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'g') {
          this.keySequence = 'g';
          clearTimeout(this.keySequenceTimer);
          this.keySequenceTimer = setTimeout(() => { this.keySequence = ''; }, 1200);
          return;
        } else if (this.keySequence === 'g') {
          this.keySequence = '';
          clearTimeout(this.keySequenceTimer);
          const navMap = {
            'd': 'dashboard',
            'e': 'employees',
            'a': 'attendance',
            'l': 'leaves',
            'p': 'payroll',
            'r': 'recruitment',
            'c': 'chat',
            'h': 'helpdesk',
            's': 'settings'
          };
          if (navMap[k]) {
            e.preventDefault();
            this.navigate(navMap[k]);
            Toast.show(\`Navigated to \${navMap[k].toUpperCase()} (Hotkey)\`, 'info');
            return;
          }
        }
      }

      // Ctrl+K or Cmd+K → open Spotlight Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
        return;
      }
      // Ctrl+H or Cmd+H → toggle history drawer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        App.toggleHistoryDrawer();
      }
      // Ctrl+M or Cmd+M → toggle team collaboration / chat drawer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (typeof Chat !== 'undefined' && Chat.toggleDrawer) {
          Chat.toggleDrawer();
        }
      }
      // Escape → close all open modals / search / history / chat / palette / inspector / batch dock
      if (e.key === 'Escape') {
        Modal.closeAll();
        App.closeHistoryDrawer();
        App.closeCommandPalette();
        App.closeInspectDrawer();
        App.clearBatchSelection();
        document.getElementById('accent-picker-dropdown')?.classList.remove('open');
        if (typeof Chat !== 'undefined' && Chat.closeDrawer) {
          Chat.closeDrawer();
        }
        document.getElementById('search-dropdown')?.classList.remove('open');
        document.getElementById('notif-dropdown')?.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#accent-btn') && !e.target.closest('#accent-picker-dropdown')) {
        document.getElementById('accent-picker-dropdown')?.classList.remove('open');
      }
    });
  },\n\n`;

  code = code.slice(0, idxKbStart) + newKeyboardCode + code.slice(idxKbEnd);
  console.log('✅ Enhanced setupKeyboardShortcuts() with hotkey chords (G+D, G+E, etc.) & ? helper');
}

// 5. Append Pro Suite Methods (Batch Actions, Inspect Drawer, Shortcuts Modal)
const proMethods = `
  // ═══════════════════════════════════════════════
  // MULTI-SELECT FLOATING BATCH ACTION DOCK
  // ═══════════════════════════════════════════════
  selectedRowIds: new Set(),

  toggleSelectAllRows(masterCheckbox, rowSelector = '.tbl-row-checkbox') {
    const isChecked = masterCheckbox.checked;
    document.querySelectorAll(rowSelector).forEach(cb => {
      cb.checked = isChecked;
      const id = cb.dataset.id;
      const row = cb.closest('tr');
      if (isChecked && id) {
        this.selectedRowIds.add(String(id));
        row?.classList.add('row-selected');
      } else if (id) {
        this.selectedRowIds.delete(String(id));
        row?.classList.remove('row-selected');
      }
    });
    this.updateBatchDock();
  },

  toggleRowSelect(checkbox, id) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
      this.selectedRowIds.add(String(id));
      row?.classList.add('row-selected');
    } else {
      this.selectedRowIds.delete(String(id));
      row?.classList.remove('row-selected');
    }
    this.updateBatchDock();
  },

  updateBatchDock() {
    const dock = document.getElementById('batch-action-dock');
    const countEl = document.getElementById('batch-dock-count');
    const labelEl = document.getElementById('batch-dock-label');
    if (!dock) return;

    const count = this.selectedRowIds.size;
    if (count > 0) {
      dock.classList.add('active');
      if (countEl) countEl.textContent = count;
      if (labelEl) labelEl.textContent = \`\${count} record\${count > 1 ? 's' : ''} selected\`;
    } else {
      dock.classList.remove('active');
    }
  },

  clearBatchSelection() {
    this.selectedRowIds.clear();
    document.querySelectorAll('.tbl-row-checkbox, #master-table-select').forEach(cb => {
      cb.checked = false;
      cb.closest('tr')?.classList.remove('row-selected');
    });
    this.updateBatchDock();
  },

  batchExportSelected() {
    const count = this.selectedRowIds.size;
    if (count === 0) return;
    const emps = DB.get('employees') || [];
    const selectedEmps = emps.filter(e => this.selectedRowIds.has(String(e.id)));
    
    if (selectedEmps.length === 0) {
      Toast.show('No full employee records matched the selected IDs', 'warning');
      return;
    }

    const headers = ['ID', 'EmpNo', 'FullName', 'Department', 'Designation', 'Email', 'Phone', 'Status', 'Salary'];
    const rows = selectedEmps.map(e => [
      e.id,
      e.empNo || '',
      \`"\${e.fullName}"\`,
      \`"\${Utils.getDeptName(e.departmentId)}"\`,
      \`"\${Utils.getDesigName(e.designationId)}"\`,
      e.email || '',
      e.phone || '',
      e.status || '',
      e.salary || 0
    ].join(','));

    const csvContent = headers.join(',') + '\\n' + rows.join('\\n');
    Utils.downloadCSV(csvContent, \`selected_employees_\${Utils.today()}.csv\`);
    Toast.show(\`Exported \${count} records to CSV\`, 'success');
  },

  batchEmailSelected() {
    const count = this.selectedRowIds.size;
    if (count === 0) return;
    Toast.show(\`Broadcasting notice to \${count} recipient(s)... (Simulated)\`, 'info', '', 4000, () => {
      Toast.show('Broadcast cancelled via Undo', 'warning');
    });
  },

  batchTagStatus() {
    const count = this.selectedRowIds.size;
    if (count === 0) return;
    const nextStatus = prompt(\`Enter new status for \${count} selected records (active / probation / inactive):\`, 'active');
    if (!nextStatus) return;

    const emps = DB.get('employees') || [];
    let updated = 0;
    emps.forEach(e => {
      if (this.selectedRowIds.has(String(e.id))) {
        e.status = nextStatus.toLowerCase().trim();
        updated++;
      }
    });
    DB.set('employees', emps);
    this.clearBatchSelection();
    Toast.show(\`Updated \${updated} records to '\${nextStatus}'\`, 'success');
    if (this.currentModule === 'employees') {
      Employees.render();
    }
  },

  // ═══════════════════════════════════════════════
  // QUICK INSPECT SLIDE-OVER DRAWER
  // ═══════════════════════════════════════════════
  openInspectDrawer(type, id) {
    const overlay = document.getElementById('inspect-drawer-overlay');
    const drawer = document.getElementById('inspect-drawer');
    const body = document.getElementById('inspect-drawer-body');
    const title = document.getElementById('inspect-drawer-title');
    const subtitle = document.getElementById('inspect-drawer-subtitle');
    const footer = document.getElementById('inspect-drawer-footer');
    if (!drawer || !body) return;

    if (type === 'employee') {
      const emp = (DB.get('employees') || []).find(e => String(e.id) === String(id));
      if (!emp) { Toast.show('Employee not found', 'error'); return; }

      if (title) title.textContent = emp.fullName;
      if (subtitle) subtitle.textContent = \`\${emp.empNo} • \${Utils.getDeptName(emp.departmentId)}\`;

      const avatarHtml = emp.photo
        ? \`<img src="\${emp.photo}" style="width:68px;height:68px;border-radius:14px;object-fit:cover;border:2px solid var(--border)">\`
        : \`<div style="width:68px;height:68px;border-radius:14px;background:\${Utils.avatarColor(emp.id)};color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800">\${Utils.avatarInitials(emp.fullName)}</div>\`;

      body.innerHTML = \`
        <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--surface);border-radius:12px;border:1px solid var(--border)">
          \${avatarHtml}
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text)">\${emp.fullName}</div>
            <div style="font-size:12.5px;color:var(--text-3);margin-top:2px">\${Utils.getDesigName(emp.designationId)} • \${Utils.getDeptName(emp.departmentId)}</div>
            <div style="margin-top:6px">\${Utils.statusBadge(emp.status)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Official Email</span>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px;overflow:hidden;text-overflow:ellipsis">\${emp.email || '—'}</div>
          </div>
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Phone Number</span>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px">\${emp.phone || '—'}</div>
          </div>
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Joining Date</span>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px">\${Utils.formatDate(emp.joiningDate)}</div>
          </div>
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Monthly Base Salary</span>
            <div style="font-size:13px;font-weight:700;color:var(--primary);margin-top:2px">\${Utils.formatCurrency(emp.salary)}</div>
          </div>
        </div>

        <div class="card" style="padding:16px">
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <i class="fa fa-fingerprint" style="color:var(--primary)"></i> Recent Attendance Record
          </div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.6">
            Latest Daily Swipe Status: <strong>\${emp.status === 'active' ? 'Present (08:52 AM on Biometric-Gate-1)' : 'Inactive / On Leave'}</strong>
          </div>
        </div>
      \`;

      if (footer) {
        footer.innerHTML = \`
          <button class="btn btn-ghost btn-sm" onclick="App.closeInspectDrawer()">Close</button>
          <button class="btn btn-secondary btn-sm" onclick="Employees.showIssueShowCauseNoticeModal(\${emp.id}); App.closeInspectDrawer();">
            <i class="fa fa-scale-balanced"></i> Issue Notice
          </button>
          <button class="btn btn-primary btn-sm" onclick="Employees.renderProfile(\${emp.id}); App.closeInspectDrawer();">
            <i class="fa fa-user"></i> Full Profile
          </button>
        \`;
      }
    }

    overlay?.classList.add('open');
    drawer.classList.add('open');
  },

  closeInspectDrawer() {
    const overlay = document.getElementById('inspect-drawer-overlay');
    const drawer = document.getElementById('inspect-drawer');
    overlay?.classList.remove('open');
    drawer?.classList.remove('open');
  },

  // ═══════════════════════════════════════════════
  // KEYBOARD SHORTCUTS CHEAT SHEET MODAL (?)
  // ═══════════════════════════════════════════════
  showShortcutsModal() {
    Modal.confirm(
      '⌨️ Power-User Keyboard Shortcuts',
      \`
        <div class="shortcuts-grid">
          <div>
            <div class="shortcut-group-title"><i class="fa fa-compass"></i> Two-Key Navigation (G then ...)</div>
            <div class="shortcut-row"><span>Go to Dashboard</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>D</kbd></div></div>
            <div class="shortcut-row"><span>Go to Employees</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>E</kbd></div></div>
            <div class="shortcut-row"><span>Go to Attendance</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>A</kbd></div></div>
            <div class="shortcut-row"><span>Go to Leaves</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>L</kbd></div></div>
            <div class="shortcut-row"><span>Go to Payroll</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>P</kbd></div></div>
            <div class="shortcut-row"><span>Go to Recruitment</span> <div class="shortcut-keys"><kbd>G</kbd> then <kbd>R</kbd></div></div>
          </div>
          <div>
            <div class="shortcut-group-title"><i class="fa fa-terminal"></i> Global Spotlight & Utilities</div>
            <div class="shortcut-row"><span>Spotlight Search</span> <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></div></div>
            <div class="shortcut-row"><span>Team Chat Drawer</span> <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>M</kbd></div></div>
            <div class="shortcut-row"><span>Audit History Drawer</span> <div class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>H</kbd></div></div>
            <div class="shortcut-row"><span>Toggle Dark / Light</span> <div class="shortcut-keys"><kbd>T</kbd></div></div>
            <div class="shortcut-row"><span>Table Density (Compact)</span> <div class="shortcut-keys"><kbd>D</kbd></div></div>
            <div class="shortcut-row"><span>Dismiss Any Dialog</span> <div class="shortcut-keys"><kbd>ESC</kbd></div></div>
          </div>
        </div>
      \`,
      () => {},
      'primary'
    );
    const confirmBtn = document.getElementById('confirm-yes');
    if (confirmBtn) confirmBtn.style.display = 'none';
  },
`;

const insertMarker = 'window.App = App;';
if (code.includes(insertMarker)) {
  code = code.replace(insertMarker, proMethods + '\n' + insertMarker);
  console.log('✅ Appended Batch Action Dock, Inspect Drawer, and Shortcuts Modal methods to App');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('🎉 Successfully patched js/app.js!');
