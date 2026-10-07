# HRM Pro — Project Rules & Instructions for AI Assistant

This document contains persistent project rules, architectural standards, and operational guidelines for **HRM Pro**. 
These instructions are automatically loaded by the AI assistant on every new conversation so that context and project standards are never lost.

---

## 1. Dual-Directory Static Asset Synchronization (CRITICAL)
- The project has two static asset locations:
  - **Root Directory:** `js/`, `css/`, `index.html` (served by local Express server `server/src/server.js`)
  - **Public Directory:** `public/js/`, `public/css/`, `public/index.html` (used for production/Vercel static builds)
- **Mandatory Rule:** Whenever modifying any script in `public/js/` or `js/`, or any stylesheet in `public/css/` or `css/`, **always keep both directories synchronized**. Never update one without mirroring the changes to the other.

---

## 2. Environment & CLI Execution (Windows OS)
- **Shell:** Windows PowerShell.
- **npm scripts Execution Policy:** On this system, `npm.ps1` is restricted by Windows execution policies.
  - To run npm commands or tests, always use `cmd.exe /c "npm test"` or execute directly via `node scripts/...`.
  - To verify health, run: `node scripts/system-wide-health-audit.js` and `node scripts/ci-audit.js`.

---

## 3. Google Gemini AI Integration & Model Routing
- **Service:** `GeminiService` in `js/geminiService.js` and `public/js/geminiService.js`.
- **API Key:** User's Google AI Studio key is configured inside `GeminiService._d` (base64 encoded) and can be overridden via `localStorage.getItem('hrm_gemini_api_key')`.
- **Model Priority:**
  - `gemini-3.5-flash-lite` (Fastest, ~1.3s response, high reliability)
  - `gemini-3.1-flash-lite`
  - `gemini-3.1-flash-lite-preview`
  - `gemini-3.8-flash`
  - `gemini-3.5-flash`
  - `gemini-3.7-flash`
  - `gemini-flash-latest`
- **Fallback Rule:** If remote Gemini endpoints are slow or offline, `LandingAgent` and `HRAssistant` must always gracefully fall back to local knowledge bases without throwing unhandled exceptions.
- **HTML Escaping:** Always use `Utils.escapeHtml(text)` or defensive inline replacement `replace(/&/g, '&amp;')...` when rendering user inputs into chat bubbles to prevent XSS and TypeErrors.

---

## 4. Pakistan Statutory Compliance & Business Rules
- **Progressive Salaried Tax (FBR 2025-27):** 
  - Progressive tax brackets (0% up to 35%) computed dynamically based on annual projected gross taxable income.
  - Automatic monthly withholding with mid-year increment adjustments.
  - Statutory Provident Fund (PF) and EOBI contributions.
- **Statutory Exit Gratuity Settlement (30/26 Formula):**
  - Gratuity calculation: `(Last Gross Salary ÷ 26 × 30) × Qualifying Years of Service`.
  - Multi-gate clearance workflow across IT, Administration, and Finance before issuing formal sign-off settlement vouchers.
- **Multi-Company Model A Scoping:**
  - Subsidiary HR managers and department heads have strict data isolation to their assigned company entity.
  - Group Super Admins have unified cross-subsidiary global oversight and consolidated telemetry.
- **Bank Disbursal Formats:**
  - Generates 6 standard CSV/Excel disbursal formats (Commercial Banks, 1Link, PayPak) with batch audit checksums.
- **Biometric Attendance Gateway:**
  - Native TCP/IP communication with physical ZKTeco, SilkID, and IP biometric machines, grace periods, half-day policies, and peer-to-peer shift swaps.

---

## 5. UI/UX Design System & Theme Principles
- **Styling:** Vanilla CSS using custom properties / design tokens. Do NOT install or use TailwindCSS unless explicitly requested.
- **Dual Themes:** System supports **Obsidian Dark Mode** and **Crisp Light Mode** persisted via localStorage.
- **Table Density:** 1-click toggle between High-Density Compact Mode (for HR/Accountants) and Comfortable Mode.
- **Keyboard Shortcuts:** Global Spotlight Command Palette (`Ctrl+K`), chords `G+D` (Dashboard), `G+E` (Employees), `G+P` (Payroll).
- **Aesthetics:** Rich modern aesthetic, glassmorphism accents, smooth micro-animations, and responsive layouts.

---

## 6. Pre-Seeded Demo Personas
- **Super Administrator:** `admin` / `admin123`
- **HR Director:** `sara.malik` / `hr123`
- **Department Manager:** `usman.baig` / `mgr123`
- **Employee Self-Service:** `fatima.raza` / `emp123`

---

## 7. Quality Assurance Gates
Before finalizing any multi-file feature or fix:
1. Verify no syntax or undefined errors exist across all modified modules.
2. Run `node scripts/ci-audit.js` to ensure all 15 routes and components pass.
3. Keep `git status` clean and free of leftover debug scratch scripts.

---

## 8. Model Switching & Targeted Token Optimization (CRITICAL FOR CLAUDE & FAST RESPONSES)
- **Zero Full-Project Dumps:** Whenever switching models or starting a new turn (especially with Claude 3.5/3.7 Sonnet):
  - **Never read or scan the entire repository at once.**
  - **Ignore `public/` during exploratory analysis:** `public/` is an exact mirror of root `js/` and `css/`. Reading both doubles context size and response latency. Only inspect root `js/` or `css/` files, then mirror changes to `public/` upon saving.
  - **Never read `node_modules/`, `server/node_modules/`, `Design Copy/`, `scratch/`, or `.git/`.**
  - **Targeted Reading Only:** Read only the specific file(s) and specific line ranges needed for the current prompt (using `view_file` with `StartLine`/`EndLine`).
  - **Fast Execution:** Address the user's specific request directly without unprompted mass audits of unrelated modules.

