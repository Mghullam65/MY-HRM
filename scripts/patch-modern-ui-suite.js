const fs = require('fs');
const path = require('path');

console.log('🚀 Patching Modern Enterprise UI & Design Suite...');

// 1. Patch css/main.css
const cssPath = path.join(__dirname, '../css/main.css');
let css = fs.readFileSync(cssPath, 'utf8');

const suiteCss = `

/* ═════════════════════════════════════════════════════════════════
   MODERN ENTERPRISE UI & DESIGN SYSTEM SUITE (2026 EDITION)
   ═════════════════════════════════════════════════════════════════ */

/* ── 1. GLOBAL LIGHT THEME REFINEMENT FOR MAIN APPLICATION ── */
[data-theme="light"],
:root[data-theme="light"] {
  --bg:             #f8fafc;
  --bg-2:           #f1f5f9;
  --surface:        #ffffff;
  --surface-2:      #f8fafc;
  --card:           #ffffff;
  --card-hover:     #f8fafc;
  --border:         #e2e8f0;
  --border-light:   #cbd5e1;

  --text:           #0f172a;
  --text-2:         #334155;
  --text-3:         #64748b;
  --text-muted:     #94a3b8;

  --sidebar-bg:     #ffffff;
  --sidebar-border: #e2e8f0;
  --shadow-sm:      0 1px 3px rgba(0,0,0,0.06);
  --shadow:         0 4px 16px rgba(0,0,0,0.06);
  --shadow-lg:      0 12px 32px rgba(0,0,0,0.1);
  color-scheme: light;
}

[data-theme="light"] body {
  background: var(--bg) !important;
  color: var(--text) !important;
}

[data-theme="light"] #app,
[data-theme="light"] .main-content,
[data-theme="light"] .page-content {
  background: #f8fafc !important;
  color: #0f172a !important;
}

[data-theme="light"] .topbar {
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .sidebar {
  background: #ffffff !important;
  border-right: 1px solid #e2e8f0 !important;
}

[data-theme="light"] .sidebar-user {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
}

[data-theme="light"] .sidebar-user .name {
  color: #0f172a !important;
}

[data-theme="light"] .nav-section-label {
  color: #64748b !important;
}

[data-theme="light"] .nav-item {
  color: #475569 !important;
}

[data-theme="light"] .nav-item:hover {
  background: #f1f5f9 !important;
  color: var(--primary) !important;
}

[data-theme="light"] .nav-item.active {
  background: #eff6ff !important;
  color: var(--primary) !important;
  font-weight: 700 !important;
}

[data-theme="light"] .card,
[data-theme="light"] .stat-card,
[data-theme="light"] .chart-card,
[data-theme="light"] .table-wrapper,
[data-theme="light"] .table-container,
[data-theme="light"] .modal {
  background: #ffffff !important;
  border-color: #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .card-header,
[data-theme="light"] .modal-header,
[data-theme="light"] .modal-footer {
  border-color: #e2e8f0 !important;
}

[data-theme="light"] .card-title,
[data-theme="light"] .modal-header h3 {
  color: #0f172a !important;
}

[data-theme="light"] thead,
[data-theme="light"] th {
  background: #f1f5f9 !important;
  color: #334155 !important;
  border-bottom: 2px solid #e2e8f0 !important;
}

[data-theme="light"] td {
  border-bottom: 1px solid #f1f5f9 !important;
  color: #1e293b !important;
}

[data-theme="light"] tbody tr:hover {
  background: #f8fafc !important;
}

[data-theme="light"] .form-control {
  background: #ffffff !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
}

[data-theme="light"] .form-control:focus {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
}

[data-theme="light"] .form-label {
  color: #334155 !important;
}

[data-theme="light"] .topbar-search {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
}

[data-theme="light"] .topbar-search input {
  color: #0f172a !important;
}

[data-theme="light"] .topbar-search input::placeholder {
  color: #94a3b8 !important;
}

[data-theme="light"] .topbar-btn {
  background: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
  color: #475569 !important;
}

[data-theme="light"] .topbar-btn:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
}

[data-theme="light"] .notif-dropdown,
[data-theme="light"] .search-dropdown,
[data-theme="light"] .cmd-palette-box {
  background: #ffffff !important;
  border-color: #e2e8f0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12) !important;
}

/* ── 2. BRAND ACCENT PALETTE ENGINE ── */
[data-accent="emerald"] {
  --primary:        #059669 !important;
  --primary-dark:   #047857 !important;
  --primary-light:  #10b981 !important;
  --primary-glow:   rgba(16, 185, 129, 0.28) !important;
  --accent:         #0d9488 !important;
}

[data-accent="violet"] {
  --primary:        #7c3aed !important;
  --primary-dark:   #6d28d9 !important;
  --primary-light:  #8b5cf6 !important;
  --primary-glow:   rgba(124, 58, 237, 0.28) !important;
  --accent:         #a855f7 !important;
}

[data-accent="rose"] {
  --primary:        #e11d48 !important;
  --primary-dark:   #be123c !important;
  --primary-light:  #f43f5e !important;
  --primary-glow:   rgba(225, 29, 72, 0.28) !important;
  --accent:         #fb7185 !important;
}

[data-accent="amber"] {
  --primary:        #d97706 !important;
  --primary-dark:   #b45309 !important;
  --primary-light:  #f59e0b !important;
  --primary-glow:   rgba(217, 119, 6, 0.28) !important;
  --accent:         #f59e0b !important;
}

[data-accent="cobalt"],
[data-accent="blue"] {
  --primary:        hsl(221, 83%, 58%) !important;
  --primary-dark:   hsl(221, 83%, 48%) !important;
  --primary-light:  hsl(221, 83%, 68%) !important;
  --primary-glow:   hsla(221, 83%, 58%, 0.3) !important;
}

/* ── 3. DATA TABLES ENHANCEMENTS & STICKY HEADERS ── */
.table-wrapper,
.table-responsive,
.table-container {
  position: relative;
  max-height: 72vh;
  overflow: auto;
  border-radius: 12px;
}

.table-wrapper th,
.table-responsive th,
.table-container th,
table thead th {
  position: sticky !important;
  top: 0 !important;
  z-index: 6 !important;
  background: var(--surface) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 1px 0 var(--border) !important;
}

/* Table Density Controls */
body.compact-mode table th,
body.compact-mode table td,
body[data-table-density="compact"] table th,
body[data-table-density="compact"] table td {
  padding: 5px 8px !important;
  font-size: 11px !important;
  line-height: 1.25 !important;
}

body[data-table-density="comfortable"] table th,
body[data-table-density="comfortable"] table td {
  padding: 12px 14px !important;
  font-size: 13px !important;
}

/* ── 4. GLASSMORPHIC KPI STAT CARDS & MICRO-INTERACTIONS ── */
.stat-card {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.2s ease !important;
  border: 1px solid var(--border) !important;
  background: var(--card) !important;
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0; right: 0; width: 120px; height: 120px;
  background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
  pointer-events: none;
  opacity: 0.6;
  transition: opacity 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25) !important;
  border-color: var(--primary) !important;
}

.stat-card:hover::after {
  opacity: 1;
}

/* KPI Trend Sparkline Badges */
.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  margin-top: 4px;
}
.trend-badge.up {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.trend-badge.down {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

/* ── 5. SPOTLIGHT COMMAND PALETTE (CTRL+K) ── */
.cmd-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.cmd-palette-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.cmd-palette-box {
  width: 660px;
  max-width: calc(100vw - 32px);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transform: scale(0.96) translateY(-12px);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  max-height: 75vh;
}

.cmd-palette-overlay.open .cmd-palette-box {
  transform: scale(1) translateY(0);
}

.cmd-palette-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: relative;
}

.cmd-palette-icon {
  font-size: 18px;
  color: var(--primary);
  flex-shrink: 0;
}

.cmd-palette-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  font-family: inherit;
}

.cmd-palette-input::placeholder {
  color: var(--text-muted);
}

.cmd-palette-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cmd-tag {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-2);
  padding: 4px 9px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cmd-tag:hover {
  background: var(--border-light);
  color: var(--text);
}

.cmd-tag.active {
  background: var(--primary-glow);
  color: var(--primary);
  border-color: var(--primary);
}

.cmd-esc-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 2px 6px;
  border-radius: 5px;
  cursor: pointer;
  flex-shrink: 0;
}

.cmd-palette-list {
  overflow-y: auto;
  padding: 10px 8px;
  max-height: 52vh;
  min-height: 120px;
}

.cmd-group-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.cmd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--text);
  gap: 12px;
}

.cmd-item:hover,
.cmd-item.selected {
  background: var(--surface-2);
  color: var(--primary);
}

.cmd-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.cmd-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--primary);
  flex-shrink: 0;
}

.cmd-item-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
}

.cmd-item:hover .cmd-item-title,
.cmd-item.selected .cmd-item-title {
  color: var(--primary);
}

.cmd-item-sub {
  font-size: 11.5px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cmd-item-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-2);
}

.cmd-palette-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  font-size: 11.5px;
  color: var(--text-muted);
}

.cmd-palette-footer kbd {
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-2);
}

/* ── 6. BREADCRUMBS & TOPBAR POLISH ── */
.topbar-breadcrumb-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.topbar-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-3);
  font-weight: 500;
}

.topbar-breadcrumbs a,
.topbar-breadcrumbs .crumb-home {
  color: var(--text-3);
  cursor: pointer;
  transition: color 0.15s ease;
}

.topbar-breadcrumbs a:hover,
.topbar-breadcrumbs .crumb-home:hover {
  color: var(--primary);
}

.crumb-sep {
  font-size: 10px;
  opacity: 0.5;
}

.crumb-active {
  color: var(--text);
  font-weight: 600;
}

/* ── 7. ACCENT COLOR PICKER POPOVER ── */
.accent-picker-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  display: none;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  z-index: 1060;
  width: 170px;
}

.accent-picker-dropdown.open {
  display: flex;
}

.accent-option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  transition: background 0.15s ease;
}

.accent-option-row:hover {
  background: var(--surface-2);
}

.accent-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
`;

if (!css.includes('MODERN ENTERPRISE UI & DESIGN SYSTEM SUITE (2026 EDITION)')) {
  fs.writeFileSync(cssPath, css + suiteCss, 'utf8');
  console.log('✅ Added Modern UI Suite to css/main.css');
} else {
  console.log('ℹ️ css/main.css already contains modern UI suite');
}
