const fs = require('fs');
const path = require('path');

console.log('🎨 Appending Advanced UI/UX Pro Suite Styles to css/main.css...');

const cssPath = path.join(__dirname, '../css/main.css');
let css = fs.readFileSync(cssPath, 'utf8');

const proSuiteCss = `

/* ═════════════════════════════════════════════════════════════════
   ADVANCED ENTERPRISE UI/UX PRO SUITE (7-FEATURE ACCELERATOR)
   ═════════════════════════════════════════════════════════════════ */

/* ── 1. ANIMATED SKELETON SHIMMER LOADERS ── */
.skeleton-box {
  display: inline-block;
  height: 14px;
  width: 100%;
  background: linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.6s infinite ease-in-out;
  border-radius: var(--radius-sm);
}

@keyframes skeletonShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-circle {
  border-radius: 50% !important;
  flex-shrink: 0;
}

.skeleton-grid-kpi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.skeleton-table-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

/* ── 2. MULTI-SELECT FLOATING BATCH ACTION DOCK ── */
.batch-action-dock {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  opacity: 0;
  pointer-events: none;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1040;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.batch-action-dock.active {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.batch-dock-left {
  display: flex;
  align-items: center;
  gap: 8px;
  border-right: 1px solid var(--border);
  padding-right: 14px;
}

.batch-count-badge {
  background: var(--primary);
  color: #ffffff;
  font-weight: 800;
  font-size: 11px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.batch-count-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.batch-dock-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── 3. QUICK INSPECT SLIDE-OVER DRAWER ── */
.inspect-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1070;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.inspect-drawer-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.inspect-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 580px;
  max-width: 100vw;
  height: 100vh;
  background: var(--card);
  border-left: 1px solid var(--border);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.4);
  z-index: 1080;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.inspect-drawer.open {
  transform: translateX(0);
}

.inspect-drawer-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  flex-shrink: 0;
}

.inspect-drawer-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.inspect-drawer-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

/* ── 4. KEYBOARD SHORTCUTS CHEAT SHEET MODAL ── */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  padding: 8px 0;
}

.shortcut-group-title {
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--primary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-light);
  font-size: 12.5px;
}

.shortcut-row:last-child {
  border-bottom: none;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shortcut-keys kbd {
  background: var(--surface-2);
  border: 1px solid var(--border);
  box-shadow: 0 2px 0 var(--border);
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
  min-width: 22px;
  text-align: center;
}

/* ── 5. RICH TOASTS WITH SHRINKING TIMER & UNDO ── */
#toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(420px, calc(100vw - 32px));
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

@keyframes toastSlideIn {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--primary);
  width: 100%;
  transform-origin: left;
  animation: toastProgressShrink linear forwards;
}

.toast-undo-btn {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.toast-undo-btn:hover {
  background: var(--primary);
  color: #ffffff;
}

@keyframes toastProgressShrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* ── 6. CHART RANGE SWITCHER PILLS ── */
.chart-range-pills {
  display: inline-flex;
  align-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.chart-range-btn {
  background: transparent;
  border: none;
  color: var(--text-3);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chart-range-btn:hover {
  color: var(--text);
}

.chart-range-btn.active {
  background: var(--surface);
  color: var(--primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

/* ── 7. TABLE ROW SELECTION CHECKBOX ── */
.tbl-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  cursor: pointer;
  accent-color: var(--primary);
}

tr.row-selected {
  background: rgba(99, 102, 241, 0.08) !important;
}
`;

if (!css.includes('ADVANCED ENTERPRISE UI/UX PRO SUITE')) {
  fs.writeFileSync(cssPath, css + proSuiteCss, 'utf8');
  console.log('✅ Added Pro Suite CSS to css/main.css');
} else {
  console.log('ℹ️ css/main.css already contains Pro Suite styles');
}
