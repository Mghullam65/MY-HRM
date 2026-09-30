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
    this.bindInstallEvents();
    this.bindNetworkEvents();
    this.renderInstallUI();
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
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('[PWA] beforeinstallprompt event captured');
      this.showInstallButtons();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      console.log('[PWA] App installed successfully');
      if (window.Toast) {
        Toast.show('🎉 HRM Pro installed successfully on your device!', 'success');
      }
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
    const installBtns = document.querySelectorAll('.pwa-install-btn');
    installBtns.forEach(btn => btn.style.display = 'inline-flex');
    this.renderFloatingBanner();
  },

  hideInstallButtons() {
    const installBtns = document.querySelectorAll('.pwa-install-btn');
    installBtns.forEach(btn => btn.style.display = 'none');
    const floating = document.getElementById('pwa-floating-install-banner');
    if (floating) floating.remove();
  },

  renderInstallUI() {
    if (this.isInstalled) return;

    // Check if dismissed in last 24h
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < 86400000) {
      return;
    }

    setTimeout(() => {
      this.renderFloatingBanner();
    }, 3500);
  },

  renderFloatingBanner() {
    if (this.isInstalled || document.getElementById('pwa-floating-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-floating-install-banner';
    banner.className = 'pwa-install-sheet';
    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 360px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6), 0 0 20px rgba(59,130,246,0.25);
      z-index: 9999;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    banner.innerHTML = `
      <style>
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="assets/icon-192.png" alt="HRM Pro" style="width: 42px; height: 42px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <div>
            <div style="font-weight: 700; font-size: 15px; letter-spacing: -0.2px;">Install HRM Pro App</div>
            <div style="font-size: 12px; color: #94a3b8;">Fast 1-tap access & offline attendance</div>
          </div>
        </div>
        <button onclick="PWA.dismissBanner()" style="background: none; border: none; color: #64748b; font-size: 16px; cursor: pointer; padding: 4px;">✕</button>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 4px;">
        <button onclick="PWA.promptInstall()" class="btn btn-primary" style="flex: 1; font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: #2563eb; color: #fff; border: none; cursor: pointer;">
          <i class="fa fa-download"></i> Install Now
        </button>
        <button onclick="PWA.dismissBanner()" class="btn btn-ghost" style="font-size: 13px; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; cursor: pointer;">
          Later
        </button>
      </div>
    `;

    document.body.appendChild(banner);
  },

  dismissBanner() {
    const banner = document.getElementById('pwa-floating-install-banner');
    if (banner) banner.remove();
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  },

  async promptInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      console.log('[PWA] User choice:', choice.outcome);
      if (choice.outcome === 'accepted') {
        this.dismissBanner();
      }
      this.deferredPrompt = null;
      return;
    }

    if (this.isIOS) {
      this.showIOSInstallModal();
      return;
    }

    // Desktop or other browser
    this.showGenericInstallModal();
  },

  showIOSInstallModal() {
    if (window.Modal) {
      Modal.open({
        title: '📱 Install on iPhone / iPad',
        body: `
          <div style="text-align: center; padding: 10px 0;">
            <img src="assets/icon-192.png" alt="HRM Pro" style="width: 64px; height: 64px; border-radius: 14px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            <h4 style="margin: 0 0 8px 0; font-size: 17px;">Install HRM Pro on iOS</h4>
            <p style="color: var(--text-muted, #94a3b8); font-size: 13px; margin-bottom: 20px;">
              Apple Safari lets you install directly to your home screen in 3 quick steps:
            </p>
            
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 12px; padding: 16px; text-align: left; display: flex; flex-direction: column; gap: 14px; font-size: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="background: #2563eb; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">1</span>
                <span>Tap the <strong>Share</strong> button <i class="fa fa-arrow-up-from-bracket" style="color: #38bdf8; margin: 0 4px;"></i> at the bottom of Safari.</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="background: #2563eb; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong> <i class="fa fa-plus-square" style="color: #38bdf8; margin: 0 4px;"></i>.</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="background: #2563eb; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">3</span>
                <span>Tap <strong>Add</strong> in the top right corner. Done!</span>
              </div>
            </div>
          </div>
        `,
        actions: [
          {
            label: 'Got It',
            className: 'btn-primary',
            onClick: () => Modal.close()
          }
        ]
      });
    } else {
      alert("To install on iOS: Tap the Share button in Safari, then tap 'Add to Home Screen'!");
    }
  },

  showGenericInstallModal() {
    if (window.Modal) {
      Modal.open({
        title: '📲 Download & Install HRM Pro',
        body: `
          <div style="text-align: center; padding: 10px 0;">
            <img src="assets/icon-192.png" alt="HRM Pro" style="width: 64px; height: 64px; border-radius: 14px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            <h4 style="margin: 0 0 8px 0; font-size: 17px;">Install HRM Pro Desktop / Mobile</h4>
            <p style="color: var(--text-muted, #94a3b8); font-size: 13px; margin-bottom: 20px;">
              HRM Pro runs as an installed standalone application on your device.
            </p>
            
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 12px; padding: 16px; text-align: left; display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
              <div>
                <strong>💻 On Chrome / Edge (Laptop & PC):</strong>
                <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Look at the right side of the address bar at the top of your browser. Click the <strong>Install App icon (computer with down arrow)</strong>.</p>
              </div>
              <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                <strong>📱 On Android (Chrome / Samsung):</strong>
                <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Tap the 3 dots in the top right menu, then tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
              </div>
            </div>
          </div>
        `,
        actions: [
          {
            label: 'Close',
            className: 'btn-primary',
            onClick: () => Modal.close()
          }
        ]
      });
    }
  }
};

// Auto initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PWA.init());
} else {
  PWA.init();
}

window.PWA = PWA;
