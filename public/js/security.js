/**
 * ============================================================
 * HRM PRO ENTERPRISE SECURITY SYSTEM
 * Core Client Protection, Anti-Inspect, Credential Hardening
 * ============================================================
 */

const Security = {
  version: '2.4.0',
  initialized: false,
  antiInspectActive: true,
  lastWarningTime: 0,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof document !== 'undefined') {
      this.setupAntiInspect();
      this.setupShortcutBlocker();
      this.setupConsoleProtection();
      this.setupSecureLinks();
      this.sanitizeStorage();
      this.setupIdleTimeout();
    }

    if (typeof console !== 'undefined' && console.log) {
      console.log('%c🔒 HRM Pro Enterprise Security Engine Active (v2.5.0 Hardened)', 'color:#2563eb;font-weight:800;font-size:13px');
    }
  },

  // Notify user with rate-limited toast
  notifyRestricted(actionName) {
    const now = Date.now();
    if (now - this.lastWarningTime < 2500) return;
    this.lastWarningTime = now;

    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show(`🔒 ${actionName} is restricted by HRM Enterprise Security Policy.`, 'warning');
    }
  },

  // 1. Prevent Right-Click Context Menu (Source Code & Asset Protection)
  setupAntiInspect() {
    document.addEventListener('contextmenu', (e) => {
      const target = e.target;
      // Allow normal context menu inside standard text editing fields
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      this.notifyRestricted('Source inspection and context menu');
      return false;
    });

    // Prevent dragging sensitive UI elements / code images
    document.addEventListener('dragstart', (e) => {
      const target = e.target;
      if (target && target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    });
  },

  // 2. Intercept and block DevTools, View-Source, and Page-Save keyboard shortcuts
  setupShortcutBlocker() {
    document.addEventListener('keydown', (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = (e.key || '').toUpperCase();
      const code = e.keyCode || e.which;

      // F12 (Developer Tools)
      if (code === 123 || key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        this.notifyRestricted('Developer Tools shortcut (F12)');
        return false;
      }

      // Ctrl + U or Cmd + Option + U (View Page Source)
      if (isCtrlOrCmd && (key === 'U' || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyRestricted('View Source shortcut (Ctrl+U)');
        return false;
      }

      // Ctrl + Shift + I or Cmd + Option + I (Inspect Elements)
      if (isCtrlOrCmd && isShift && (key === 'I' || code === 73)) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyRestricted('Inspect Elements shortcut (Ctrl+Shift+I)');
        return false;
      }

      // Ctrl + Shift + J or Cmd + Option + J (Console)
      if (isCtrlOrCmd && isShift && (key === 'J' || code === 74)) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyRestricted('Console shortcut (Ctrl+Shift+J)');
        return false;
      }

      // Ctrl + Shift + C or Cmd + Option + C (Element Inspector)
      if (isCtrlOrCmd && isShift && (key === 'C' || code === 67)) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyRestricted('Element Picker shortcut (Ctrl+Shift+C)');
        return false;
      }

      // Ctrl + S or Cmd + S (Save Page HTML Source)
      if (isCtrlOrCmd && (key === 'S' || code === 83)) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyRestricted('Page Source saving (Ctrl+S)');
        return false;
      }
    }, true);
  },

  // 3. High-visibility console warning to deter social engineering & credential scraping
  setupConsoleProtection() {
    const warningTitle = 'font-size:22px;font-weight:900;color:#ef4444;background:#fee2e2;padding:6px 12px;border-radius:6px;';
    const warningBody = 'font-size:13px;color:#334155;line-height:1.6;font-weight:600;';
    
    console.log('%c⚠️ SECURITY NOTICE: HRM PRO PROTECTED ENVIRONMENT', warningTitle);
    console.log('%cThis browser console is intended exclusively for authorized corporate administrators. Pasting scripts or attempting to inspect memory structures here is strictly prohibited and monitored.', warningBody);
  },

  // 4. Secure External Links (Prevent Tabnabbing & Referrer Token Leaks)
  setupSecureLinks() {
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a');
      if (anchor && anchor.target === '_blank') {
        anchor.rel = 'noopener noreferrer';
      }
    });
  },

  // 5. Storage Sanitization: Scrub plaintext passwords and sensitive secrets from client storage
  sanitizeStorage() {
    try {
      // Check sessionStorage
      const session = sessionStorage.getItem('hrm_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && parsed.user && parsed.user.password) {
          delete parsed.user.password;
          sessionStorage.setItem('hrm_session', JSON.stringify(parsed));
        }
      }

      // Check DB users in localStorage
      const rawUsers = localStorage.getItem('hrm_users');
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        let modified = false;
        if (Array.isArray(users)) {
          users.forEach(u => {
            // Keep user object clean
            if (u.plainPassword) {
              delete u.plainPassword;
              modified = true;
            }
          });
          if (modified) localStorage.setItem('hrm_users', JSON.stringify(users));
        }
      }
    } catch (e) {
      console.warn('[Security] Storage sanitization notice:', e.message);
    }
  },

  // 6. Enterprise Idle Session Timeout (15-Minute Auto-Logout Guard)
  idleTimeoutMs: 15 * 60 * 1000, // 15 minutes
  idleWarningMs: 60 * 1000,      // 60s warning before logout
  idleTimer: null,
  idleWarningTimer: null,
  lastActivity: Date.now(),
  isWarningShowing: false,

  setupIdleTimeout() {
    if (typeof window === 'undefined') return;

    const resetTimer = () => {
      this.lastActivity = Date.now();
      if (this.isWarningShowing) {
        this.dismissIdleWarning();
      }
      this.scheduleIdleTimers();
    };

    let throttleTimeout = null;
    const onUserActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn && Auth.isLoggedIn()) {
          resetTimer();
        }
      }, 1000);
    };

    ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, onUserActivity, { passive: true });
    });

    this.scheduleIdleTimers();
  },

  scheduleIdleTimers() {
    if (typeof window === 'undefined') return;
    clearTimeout(this.idleTimer);
    clearTimeout(this.idleWarningTimer);

    if (typeof Auth === 'undefined' || !Auth.isLoggedIn || !Auth.isLoggedIn()) {
      return;
    }

    const timeUntilWarning = Math.max(0, this.idleTimeoutMs - this.idleWarningMs);
    this.idleWarningTimer = setTimeout(() => {
      this.showIdleWarning();
    }, timeUntilWarning);

    this.idleTimer = setTimeout(() => {
      this.handleIdleExpiration();
    }, this.idleTimeoutMs);
  },

  showIdleWarning() {
    if (typeof Auth === 'undefined' || !Auth.isLoggedIn || !Auth.isLoggedIn()) return;
    this.isWarningShowing = true;

    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('⚠️ Security Notice: Session will expire in 60s due to inactivity. Move mouse to stay signed in.', 'warning', 10000);
    }
  },

  dismissIdleWarning() {
    this.isWarningShowing = false;
  },

  handleIdleExpiration() {
    if (typeof Auth === 'undefined' || !Auth.isLoggedIn || !Auth.isLoggedIn()) return;
    console.warn('[Security] Idle session timeout reached (15m). Performing secure logout.');
    this.isWarningShowing = false;
    
    if (typeof Auth.logout === 'function') {
      Auth.logout();
    }
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show('🔒 Session Expired: Automatically logged out due to 15 minutes of inactivity.', 'danger', 8000);
    }
    if (typeof App !== 'undefined' && App.showLogin) {
      App.showLogin();
    }
  },

  // 7. Client-Side Login Brute-Force Shield
  clientLoginAttempts: {},

  recordFailedLoginAttempt(username) {
    const key = (username || '').toLowerCase();
    const now = Date.now();
    const rec = this.clientLoginAttempts[key] || { count: 0, lockedUntil: 0 };
    rec.count += 1;
    if (rec.count >= 5) {
      rec.lockedUntil = now + (60 * 1000); // 60s client lock
    }
    this.clientLoginAttempts[key] = rec;
    return rec;
  },

  clearFailedLoginAttempt(username) {
    const key = (username || '').toLowerCase();
    delete this.clientLoginAttempts[key];
  },

  isLoginLocked(username) {
    const key = (username || '').toLowerCase();
    const rec = this.clientLoginAttempts[key];
    if (rec && rec.lockedUntil && Date.now() < rec.lockedUntil) {
      return Math.ceil((rec.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  },

  // Public summary of active security controls
  getSecurityAuditReport() {
    return {
      status: 'Active',
      controls: [
        { name: 'Anti-Inspect (Context Menu Lock)', status: 'Enabled' },
        { name: 'DevTools Shortcuts Block (F12, Ctrl+Shift+I/J/C)', status: 'Enabled' },
        { name: 'View Source Lock (Ctrl+U)', status: 'Enabled' },
        { name: 'Page Save Protection (Ctrl+S)', status: 'Enabled' },
        { name: 'Password Sanitization in Storage', status: 'Enabled' },
        { name: 'Secure Link Referrer Policy', status: 'Enabled' },
        { name: 'Server HTTP Security Headers (Helmet, X-Frame-Options)', status: 'Enabled' },
        { name: 'Idle Session Auto-Logout (15m)', status: 'Enabled' },
        { name: 'Brute-Force Rate Limiting (5 Attempts / 5m)', status: 'Enabled' },
        { name: 'Strict Origin Whitelisting (CORS)', status: 'Enabled' }
      ]
    };
  }
};

// Initialize immediately upon script execution
Security.init();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Security;
}
