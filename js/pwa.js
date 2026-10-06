/**
 * HRM Pro — Progressive Web App (PWA) & Offline Sync Engine
 * Handles Service Worker registration, mobile install banners, iOS installation, and offline sync.
 */
const PWA = {
  deferredPrompt: null,
  isInstalled: false,
  isIOS: false,

  init() {
    this.detectPlatform();
    this.registerServiceWorker();
    this.bindNetworkEvents();
    this.hideInstallButtons();
  },

  detectPlatform() {
    const ua = window.navigator.userAgent.toLowerCase();
    this.isIOS = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (this.isStandalone) {
      this.isInstalled = true;
      document.body.classList.add('pwa-installed');
    }
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    if (window.Toast) {
                      Toast.show('⚡ New version of HRM Pro available! Refreshing...', 'info');
                    }
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[PWA] ServiceWorker registration skipped/failed:', err);
          });
      });
    }
  },

  bindInstallEvents() {
    // Pure web application mode: prevent default browser install mini-infobars
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.hideInstallButtons();
    });
  },

  bindNetworkEvents() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });
    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Check initial state
    if (!navigator.onLine) {
      this.handleOffline();
    }
  },

  handleOffline() {
    console.warn('[PWA] Device went offline');
    let banner = document.getElementById('pwa-offline-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'pwa-offline-banner';
      banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(245, 158, 11, 0.4);
        color: #fbbf24;
        padding: 10px 18px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        z-index: 10000;
        backdrop-filter: blur(8px);
      `;
      banner.innerHTML = `
        <i class="fa fa-wifi-slash" style="color: #f59e0b;"></i>
        <span>Offline Mode — Punches & changes will auto-sync when online</span>
      `;
      document.body.appendChild(banner);
    }
    banner.style.display = 'flex';
  },

  handleOnline() {
    console.log('[PWA] Device is online again');
    const banner = document.getElementById('pwa-offline-banner');
    if (banner) {
      banner.style.display = 'none';
    }
    if (window.Toast) {
      Toast.show('🟢 Back online! Synchronizing offline data...', 'success');
    }
    this.syncOfflinePunches();
  },

  recordOfflinePunch(punchRecord) {
    try {
      const queue = JSON.parse(localStorage.getItem('hrm_offline_punches') || '[]');
      queue.push({
        ...punchRecord,
        queuedAt: new Date().toISOString()
      });
      localStorage.setItem('hrm_offline_punches', JSON.stringify(queue));
      if (window.Toast) {
        Toast.show('💾 Attendance recorded locally (Offline). Will auto-sync when reconnected.', 'warning');
      }
      return true;
    } catch (err) {
      console.error('[PWA] Failed to record offline punch:', err);
      return false;
    }
  },

  async syncOfflinePunches() {
    try {
      const queue = JSON.parse(localStorage.getItem('hrm_offline_punches') || '[]');
      if (!queue.length) return;

      console.log(`[PWA] Syncing ${queue.length} offline punches to database...`);
      if (window.DB && typeof DB.get === 'function') {
        const attendance = DB.get('attendance') || [];
        queue.forEach((item) => {
          attendance.unshift(item);
        });
        DB.set('attendance', attendance);
        if (typeof DB.syncToSupabase === 'function') {
          await DB.syncToSupabase('attendance');
        }
      }

      localStorage.removeItem('hrm_offline_punches');
      if (window.Toast) {
        Toast.show(`✅ Successfully synced ${queue.length} offline attendance records with the cloud!`, 'success');
      }
    } catch (err) {
      console.error('[PWA] Error syncing offline punches:', err);
    }
  },

  showInstallButtons() {
    // Pure web mode: install buttons remain hidden
    this.hideInstallButtons();
  },

  hideInstallButtons() {
    const installBtns = document.querySelectorAll('.pwa-install-btn');
    installBtns.forEach(btn => {
      btn.style.display = 'none';
      if (btn.parentNode && btn.classList.contains('pwa-install-btn')) {
        btn.remove();
      }
    });
    const floating = document.getElementById('pwa-floating-install-banner');
    if (floating) floating.remove();
  },

  renderInstallUI() {
    // Pure web mode: no install UI rendered
  },

  renderFloatingBanner() {
    // Pure web mode: no floating banners
    const floating = document.getElementById('pwa-floating-install-banner');
    if (floating) floating.remove();
  },

  dismissBanner() {
    const banner = document.getElementById('pwa-floating-install-banner');
    if (banner) banner.remove();
  },

  promptInstall() {
    // Pure web mode: runs seamlessly directly in the browser
    console.log('[HRM Pro] Web App active. No application download required.');
  },

  showIOSInstallModal() {
    // Pure web mode: no app modal
  },

  showGenericInstallModal() {
    // Pure web mode: no app modal
  },

  downloadAndroidAPK() {
    // Pure web mode: no APK download
  },

  downloadWindowsDesktop() {
    // Pure web mode: no desktop download
  }
};

// Auto initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PWA.init());
} else {
  PWA.init();
}

window.PWA = PWA;
