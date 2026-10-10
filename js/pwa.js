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

  getOfflineQueue() {
    try {
      return JSON.parse(localStorage.getItem('hrm_offline_punches') || '[]');
    } catch (e) {
      return [];
    }
  },

  recordOfflinePunch(punchRecord) {
    try {
      const queue = this.getOfflineQueue();
      queue.push({
        ...punchRecord,
        queuedAt: new Date().toISOString()
      });
      localStorage.setItem('hrm_offline_punches', JSON.stringify(queue));
      window.dispatchEvent(new CustomEvent('hrm:offline-queue-changed', { detail: { count: queue.length } }));
      if (window.Toast) {
        Toast.show(`💾 Offline Punch Stored (${queue.length} in queue). Will auto-sync when internet reconnects.`, 'warning');
      }
      return true;
    } catch (err) {
      console.error('[PWA] Failed to record offline punch:', err);
      return false;
    }
  },

  async syncOfflinePunches() {
    try {
      const queue = this.getOfflineQueue();
      if (!queue.length) return;

      console.log(`[PWA] Syncing ${queue.length} offline punches to database...`);
      if (window.DB && typeof DB.get === 'function') {
        const allAtt = DB.get('attendance') || [];
        const allLogs = DB.get('attendance_logs') || [];

        queue.forEach((item) => {
          const dateStr = item.date || (typeof Utils !== 'undefined' ? Utils.today() : new Date().toISOString().slice(0, 10));
          const timeStr = item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const empId = item.employeeId || (typeof Auth !== 'undefined' && Auth.employee ? Auth.employee.id : 1);
          const type = item.type || item.punchType || 'in';

          const isCheckIn  = type === 'in' || type === 'check_in';
          const isCheckOut = type === 'out' || type === 'check_out';
          const isBreakOut = type === 'ot_out' || type === 'b_out' || type === 'break_out';
          const isBreakIn  = type === 'ot_in' || type === 'b_in' || type === 'break_in';

          // Record in attendance_logs
          allLogs.push({
            id: DB.nextId ? DB.nextId('attendance_logs') : Date.now(),
            employeeId: empId,
            date: dateStr,
            time: timeStr,
            timestamp: item.timestamp || new Date().toISOString(),
            punchType: isCheckIn ? 'check_in' : (isCheckOut ? 'check_out' : (isBreakOut ? 'break_out' : 'break_in')),
            punchLabel: isCheckIn ? 'Check-In' : (isCheckOut ? 'Check-Out' : (isBreakOut ? 'Break-Out' : 'Break-In')),
            punchNumber: allLogs.filter(l => l.employeeId === empId && l.date === dateStr).length + 1,
            device: 'Mobile PWA (Offline Sync)',
            deviceIp: '127.0.0.1 (Offline Synced)',
            verifyMode: 'Offline Cache Crypt-Hash'
          });

          // Correctly resolve into attendance register
          let att = allAtt.find(a => (String(a.employeeId) === String(empId)) && a.date === dateStr);
          if (isCheckIn) {
            if (!att) {
              att = {
                id: DB.nextId ? DB.nextId('attendance') : Date.now(),
                employeeId: empId,
                date: dateStr,
                timeIn: timeStr,
                checkIn: timeStr,
                clockIn: timeStr,
                breakOut: '',
                breakIn: '',
                timeOut: '',
                checkOut: '',
                status: 'present',
                overtime: 0,
                device: 'Mobile PWA (Offline Synced)',
                remarks: 'Queued offline; auto-synced with cloud'
              };
              allAtt.push(att);
            } else {
              att.timeIn = timeStr;
              att.checkIn = timeStr;
              att.clockIn = timeStr;
            }
          } else if (isCheckOut) {
            if (att) {
              att.timeOut = timeStr;
              att.checkOut = timeStr;
              att.clockOut = timeStr;
              att.completionStatus = 'complete';
              if (att.timeIn || att.checkIn) {
                const inTime = att.timeIn || att.checkIn;
                att.hrs = (typeof Attendance !== 'undefined' && Attendance.calcHours) ? Attendance.calcHours(inTime, timeStr) : '8h 00m';
                att.overtime = (typeof Attendance !== 'undefined' && Attendance.calcOvertime) ? Attendance.calcOvertime(inTime, timeStr) : 0;
              }
            }
          } else if (isBreakOut && att) {
            att.breakOut = timeStr;
          } else if (isBreakIn && att) {
            att.breakIn = timeStr;
          }
        });

        DB.set('attendance', allAtt);
        DB.set('attendance_logs', allLogs);
        if (typeof DB.syncToSupabase === 'function') {
          await DB.syncToSupabase('attendance');
        }
      }

      const count = queue.length;
      localStorage.removeItem('hrm_offline_punches');
      window.dispatchEvent(new CustomEvent('hrm:offline-queue-changed', { detail: { count: 0 } }));

      if (window.Toast) {
        Toast.show(`✅ Network Restored: Successfully synced ${count} offline attendance punch(es) to cloud!`, 'success');
      }

      // Refresh Dashboard and Attendance interfaces
      if (typeof Dashboard !== 'undefined' && Dashboard.renderHeroPunchClock) {
        Dashboard.renderHeroPunchClock();
      }
      if (typeof Dashboard !== 'undefined' && Dashboard.refreshHeroPunchClock) {
        Dashboard.refreshHeroPunchClock();
      }
      if (typeof Attendance !== 'undefined' && typeof App !== 'undefined' && App.currentModule === 'attendance' && Attendance.renderView) {
        Attendance.renderView();
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
