// ============================================================
// HRM SYSTEM — Real-Time Live Notifications Engine
// ============================================================

const LiveNotifications = {
  channel: null,
  pollInterval: null,
  audioCtx: null,
  soundEnabled: true,
  lastPollTimestamp: Date.now(),
  seenNotificationIds: new Set(),
  isPolling: false,

  init() {
    this.initAudio();
    this.initCrossTab();
    this.initSeenCache();
    this.startPolling();
    this.checkNativePushPermission();

    console.log('%c🟢 LiveNotifications engine initialized (Web Audio, Cross-Tab Broadcast, Cloud Polling)', 'color:#10b981;font-weight:700');
  },

  // ─── 1. Web Audio Synthesizer (Professional 2-Tone Chime) ───
  initAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('[LiveNotifications] Web Audio init notice:', e.message);
    }

    // Auto-resume AudioContext on first user interaction if suspended
    const unlockAudio = () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
  },

  playChime(type = 'default') {
    if (!this.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Primary Harmonious 2-Tone Notification Chime (D5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.1); // A5
      gain2.gain.setValueAtTime(0.22, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.43);
    } catch (err) {
      console.warn('[LiveNotifications] Sound chime notice:', err.message);
    }
  },

  // ─── 2. Cross-Tab & Cross-Window Synchronization ────────────
  initCrossTab() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('hrm_live_sync');
        this.channel.onmessage = (event) => {
          this.handleIncomingBroadcast(event.data);
        };
      }
    } catch (e) {
      console.warn('[LiveNotifications] BroadcastChannel notice:', e.message);
    }

    // Storage Event fallback for older browsers or isolated sandboxes
    window.addEventListener('storage', (e) => {
      if (e.key === 'hrm_live_notif_ping' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          this.handleIncomingBroadcast(payload);
        } catch (err) {}
      }
    });
  },

  handleIncomingBroadcast(payload) {
    if (!payload || !payload.notif) return;
    const notif = payload.notif;

    // Avoid duplicate triggers in the sender tab
    if (this.seenNotificationIds.has(notif.id)) return;
    this.seenNotificationIds.add(notif.id);

    // Sync into local DB if not already present
    const existing = DB.get('user_notifications') || [];
    if (!existing.some(x => x.id === notif.id)) {
      existing.unshift(notif);
      DB.set('user_notifications', existing);
    }

    // Refresh UI
    if (typeof App !== 'undefined' && App.refreshNotifications) {
      App.refreshNotifications();
    }

    // If notification targets the current active logged-in user, trigger live feedback
    if (this.isRecipient(notif)) {
      this.triggerLiveAlert(notif);
    }
  },

  isRecipient(notif) {
    if (typeof Auth === 'undefined' || !Auth.isLoggedIn()) return false;
    const myEmpId = Auth.employee?.id;
    const myRole = Auth.role;

    if (notif.recipientEmpId && parseInt(notif.recipientEmpId) === parseInt(myEmpId)) return true;
    if (!notif.recipientEmpId && notif.recipientRole && (notif.recipientRole === myRole || notif.recipientRole === 'all')) return true;
    return false;
  },

  initSeenCache() {
    const existing = DB.get('user_notifications') || [];
    existing.forEach(n => { if (n.id) this.seenNotificationIds.add(n.id); });
  },

  // ─── 3. Live Alert Presentation (Chime, Bell Ring, Floating Card) ──
  triggerLiveAlert(notif) {
    // 1. Play synthesized audio chime
    this.playChime(notif.priority);

    // 2. Animate topbar bell with jiggle / ring
    this.ringBell();

    // 3. Render floating glassmorphism banner
    this.showLiveBanner(notif);

    // 4. Native OS / Desktop notification
    this.showNativePush(notif);
  },

  ringBell() {
    const bellBtn = document.getElementById('notif-btn');
    if (bellBtn) {
      const icon = bellBtn.querySelector('i');
      if (icon) {
        icon.classList.remove('bell-ringing');
        void icon.offsetWidth; // Trigger reflow
        icon.classList.add('bell-ringing');
        setTimeout(() => icon.classList.remove('bell-ringing'), 1800);
      }
    }
  },

  showLiveBanner(notif) {
    let container = document.getElementById('live-notif-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'live-notif-container';
      document.body.appendChild(container);
    }

    const card = document.createElement('div');
    card.className = 'live-notif-card';
    if (notif.priority === 'urgent') {
      card.style.borderLeftColor = 'var(--danger)';
    } else if (notif.type === 'hr_letter') {
      card.style.borderLeftColor = 'var(--info)';
    }

    let iconClass = 'fa-bell';
    let iconColor = 'var(--primary)';
    if (notif.type === 'doc_expiry') { iconClass = 'fa-id-card-clip'; iconColor = 'var(--danger)'; }
    else if (notif.type === 'hr_letter') { iconClass = 'fa-file-signature'; iconColor = 'var(--info)'; }
    else if (notif.type === 'policy_mandate') { iconClass = 'fa-signature'; iconColor = 'var(--warning)'; }

    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:34px;height:34px;border-radius:8px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;color:${iconColor};flex-shrink:0">
            <i class="fa ${iconClass}" style="font-size:16px"></i>
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="live-status-pill"><span class="live-status-dot"></span> LIVE NOTIFICATION</span>
              ${notif.priority === 'urgent' ? '<span class="badge badge-danger" style="font-size:9px;padding:1px 5px">URGENT</span>' : ''}
            </div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">${notif.senderName || 'HR Operations'} • Just now</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" style="color:var(--text-3);padding:2px 6px;font-size:14px;line-height:1" onclick="this.closest('.live-notif-card').remove()">
          &times;
        </button>
      </div>
      <div style="margin-top:8px">
        <div style="font-size:13px;font-weight:700;color:var(--text)">${notif.title}</div>
        <div style="font-size:12px;color:var(--text-2);margin-top:3px;line-height:1.4">${notif.message}</div>
      </div>
      <div style="margin-top:10px;display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-ghost btn-xs" style="font-size:11.5px" onclick="this.closest('.live-notif-card').remove()">Dismiss</button>
        ${notif.actionUrl ? `
          <button class="btn btn-primary btn-xs" style="font-size:11.5px;font-weight:700;box-shadow:0 2px 8px var(--primary-glow)" onclick="LiveNotifications.handleBannerAction('${notif.id}', '${notif.actionUrl}', '${notif.subView || ''}', this)">
            <i class="fa fa-arrow-up-right-from-square" style="font-size:10px;margin-right:4px"></i> ${notif.actionLabel || 'View & Review'}
          </button>
        ` : ''}
      </div>
      <div class="live-notif-progress"></div>
    `;

    container.prepend(card);

    // Auto-dismiss after 7 seconds
    setTimeout(() => {
      if (card && card.parentNode) {
        card.classList.add('removing');
        setTimeout(() => card.remove(), 300);
      }
    }, 7000);
  },

  handleBannerAction(notifId, module, subView, btnEl) {
    if (btnEl) {
      const card = btnEl.closest('.live-notif-card');
      if (card) card.remove();
    }
    if (typeof App !== 'undefined' && App.handleNotificationClick) {
      App.handleNotificationClick(notifId, module, subView);
    }
  },

  // ─── 4. Native OS / Desktop Push Notifications ──────────────
  checkNativePushPermission() {
    if ('Notification' in window) {
      this.updateDesktopButtonState(Notification.permission);
    }
  },

  async toggleDesktopPermission() {
    if (!('Notification' in window)) {
      Toast.show('Desktop push notifications are not supported in this browser.', 'warning');
      return;
    }

    if (Notification.permission === 'granted') {
      Toast.show('Desktop push alerts are already enabled!', 'info');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      this.updateDesktopButtonState(perm);
      if (perm === 'granted') {
        Toast.show('Desktop push alerts enabled successfully!', 'success');
        this.showNativePush({
          title: 'HRM Pro Live Alerts Enabled',
          message: 'You will now receive real-time notifications for official HR letters, renewals, and compliance alerts.'
        });
      } else {
        Toast.show('Desktop notifications permission was not granted.', 'warning');
      }
    } catch (err) {
      console.warn('[LiveNotifications] Permission error:', err.message);
    }
  },

  updateDesktopButtonState(perm) {
    const btn = document.getElementById('desktop-notif-btn');
    if (btn) {
      if (perm === 'granted') {
        btn.innerHTML = '<i class="fa fa-bell-on" style="color:var(--success)"></i>';
        btn.title = 'Desktop Push Alerts Active (Click to check)';
      } else {
        btn.innerHTML = '<i class="fa fa-bell"></i>';
        btn.title = 'Click to Enable Desktop Push Alerts';
      }
    }
  },

  showNativePush(notif) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(notif.title || 'HRM Pro Notification', {
        body: notif.message || '',
        icon: 'assets/logo.png',
        tag: 'hrm_' + (notif.id || Date.now())
      });
      n.onclick = () => {
        window.focus();
        if (notif.actionUrl && typeof App !== 'undefined') {
          App.handleNotificationClick(notif.id, notif.actionUrl, notif.subView);
        }
        n.close();
      };
    } catch (e) {
      console.warn('[LiveNotifications] Native push error:', e.message);
    }
  },

  // ─── 5. Periodic Cloud Polling & Live Heartbeat ─────────────
  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    // Poll every 4 seconds
    this.pollInterval = setInterval(() => {
      this.pollCycle();
    }, 4000);
  },

  async pollCycle() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const myEmpId = (typeof Auth !== 'undefined' && Auth.isLoggedIn()) ? Auth.employee?.id : null;
      const myRole = (typeof Auth !== 'undefined' && Auth.isLoggedIn()) ? Auth.role : null;

      // 1. Fetch remote cloud notifications via /api/notifications/poll
      if (typeof API !== 'undefined' && API.pollNotifications) {
        const res = await API.pollNotifications({
          recipientEmpId: myEmpId,
          recipientRole: myRole,
          since: this.lastPollTimestamp
        }).catch(() => null);

        if (res && res.success) {
          this.lastPollTimestamp = res.timestamp || Date.now();
          if (res.newNotifs && res.newNotifs.length > 0) {
            res.newNotifs.forEach(n => {
              if (!this.seenNotificationIds.has(n.id)) {
                this.seenNotificationIds.add(n.id);
                // Merge into local DB
                const current = DB.get('user_notifications') || [];
                if (!current.some(x => x.id === n.id)) {
                  current.unshift(n);
                  DB.set('user_notifications', current);
                }
                // If it targets active user, show live alert
                if (this.isRecipient(n)) {
                  this.triggerLiveAlert(n);
                }
              }
            });
            if (typeof App !== 'undefined' && App.refreshNotifications) {
              App.refreshNotifications();
            }
          }
        }
      }

      // 2. Check document expiry deadlines and auto-trigger live compliance notice if entering urgent range
      this.evaluateLocalComplianceAlerts();

    } catch (err) {
      // Fail silently to keep UX smooth
    } finally {
      this.isPolling = false;
    }
  },

  evaluateLocalComplianceAlerts() {
    if (typeof Auth === 'undefined' || !Auth.isLoggedIn() || Auth.role !== 'employee') return;
    const myEmpId = Auth.employee?.id;
    if (!myEmpId) return;

    const docs = (DB.get('document_expiries') || []).filter(d => parseInt(d.employeeId) === parseInt(myEmpId));
    const today = new Date();
    docs.forEach(d => {
      const exp = new Date(d.expiryDate);
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 20 && diffDays >= 0) {
        const notifs = DB.get('user_notifications') || [];
        const hasNotif = notifs.some(n => parseInt(n.recipientEmpId) === parseInt(myEmpId) && n.type === 'doc_expiry' && n.title.includes(d.docType));
        if (!hasNotif) {
          this.dispatch({
            recipientEmpId: myEmpId,
            recipientRole: 'employee',
            senderRole: 'hr_manager',
            senderName: 'Sara Malik (HR Operations)',
            type: 'doc_expiry',
            priority: 'urgent',
            title: `⚠️ Urgent: NADRA ${d.docType} Expiry Notice (Renewal Required)`,
            message: `Your NADRA ${d.docType} (No: ${d.docNumber}) will expire in ${diffDays} day(s) on ${Utils.formatDate(d.expiryDate)}. Please initiate NADRA renewal and upload your renewed attested smart copy.`,
            actionUrl: 'employees',
            subView: 'doc_expiry',
            actionLabel: 'Update / Re-upload ' + d.docType
          });
        }
      }
    });
  },

  // ─── 6. Central Dispatcher (Single Source of Truth) ─────────
  dispatch(notifData) {
    const userNotifs = DB.get('user_notifications') || [];
    const nextId = DB.nextId('user_notifications');

    const notif = {
      id: nextId,
      recipientEmpId: notifData.recipientEmpId ? parseInt(notifData.recipientEmpId) : null,
      recipientRole: notifData.recipientRole || 'all',
      senderRole: notifData.senderRole || (typeof Auth !== 'undefined' ? Auth.role : 'system'),
      senderName: notifData.senderName || (typeof Auth !== 'undefined' ? (Auth.employee?.fullName || 'System') : 'System'),
      type: notifData.type || 'general',
      priority: notifData.priority || 'normal',
      title: notifData.title,
      message: notifData.message,
      actionUrl: notifData.actionUrl || 'dashboard',
      subView: notifData.subView || null,
      actionLabel: notifData.actionLabel || 'View Details',
      read: false,
      createdAt: new Date().toISOString()
    };

    // 1. Save to local storage
    userNotifs.unshift(notif);
    DB.set('user_notifications', userNotifs);
    this.seenNotificationIds.add(notif.id);

    // 2. Broadcast across browser tabs
    const broadcastPayload = { type: 'NEW_NOTIFICATION', notif, timestamp: Date.now() };
    if (this.channel) {
      try { this.channel.postMessage(broadcastPayload); } catch (e) {}
    }
    try {
      localStorage.setItem('hrm_live_notif_ping', JSON.stringify(broadcastPayload));
    } catch (e) {}

    // 2.5 Real-Time WebSocket Push (Zero latency)
    if (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isConnected) {
      try {
        HRMWebSocket.sendNotification(notif);
      } catch (wsErr) {
        console.warn('[LiveNotifications] WebSocket push notice:', wsErr.message);
      }
    }

    // 3. Sync to Cloud REST API in background
    if (typeof API !== 'undefined' && API.createNotification) {
      API.createNotification(notif).catch(() => {});
    }

    // 4. Update UI
    if (typeof App !== 'undefined' && App.refreshNotifications) {
      App.refreshNotifications();
    }

    // 5. Trigger live feedback if current tab is also recipient
    if (this.isRecipient(notif)) {
      this.triggerLiveAlert(notif);
    }

    return notif;
  },

  // ─── 7. Test Alert Generator ─────────────────────────────────
  sendTestAlert() {
    const isEmp = typeof Auth !== 'undefined' && Auth.role === 'employee';
    const myEmpId = typeof Auth !== 'undefined' ? Auth.employee?.id : 4;

    const sample = isEmp ? {
      recipientEmpId: myEmpId,
      recipientRole: 'employee',
      senderRole: 'hr_manager',
      senderName: 'Sara Malik (HR Operations)',
      type: 'hr_letter',
      priority: 'normal',
      title: '📄 Live Test: Official HR Letter Issued',
      message: 'This is a real-time live notification simulation. Audio chime, bell animation, and floating banner are active!',
      actionUrl: 'employees',
      subView: 'hr_letters',
      actionLabel: 'View Letter'
    } : {
      recipientRole: Auth.role || 'hr_manager',
      senderRole: 'employee',
      senderName: 'Fatima Raza (Software Engineer)',
      type: 'letter_ack',
      priority: 'normal',
      title: '✅ Live Test: Official Letter Acknowledged',
      message: 'Fatima Raza has verified and electronically acknowledged receipt of official letter HRM/SAL/2026/014.',
      actionUrl: 'employees',
      subView: 'hr_letters',
      actionLabel: 'Inspect Archive'
    };

    this.dispatch(sample);
    Toast.show('Live notification dispatched with audio chime and bell ring!', 'success');
  }
};

window.LiveNotifications = LiveNotifications;
