// ============================================================
// HRM SYSTEM — Real-Time WebSocket Client & Presence Engine
// ============================================================

const HRMWebSocket = {
  socket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectDelay: 1500,
  isConnected: false,
  isAuthenticated: false,
  onlineUserIds: new Set(),
  listeners: {},
  pingTimer: null,
  activeUserId: null,

  init() {
    this.connect();

    // Re-auth when Auth session changes
    window.addEventListener('hrm:auth_change', () => {
      if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        this.authenticate();
      }
    });

    console.log('%c⚡ HRMWebSocket client initialized', 'color:#6366f1;font-weight:700');
  },

  getWebSocketUrl() {
    const isHttps = window.location.protocol === 'https:';
    const proto = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:5000';
    return `${proto}//${host}/ws`;
  },

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    const url = this.getWebSocketUrl();

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1500;
        console.log('%c🟢 WebSocket connected to ' + url, 'color:#10b981;font-weight:700');
        
        this.startHeartbeat();
        this.authenticate();
        this.emit('connection:open');
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncoming(payload);
        } catch (err) {
          console.warn('[HRMWebSocket] Parse error:', err);
        }
      };

      this.socket.onclose = (event) => {
        this.isConnected = false;
        this.isAuthenticated = false;
        this.stopHeartbeat();
        this.emit('connection:close');
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        // Silently handled by onclose
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  },

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ [HRMWebSocket] Max reconnect attempts reached. Switching to local polling fallback.');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 15000);
    setTimeout(() => {
      this.connect();
    }, delay);
  },

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 25000);
  },

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  },

  authenticate() {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    if (typeof Auth === 'undefined' || !Auth.isLoggedIn() || !Auth.employee) return;

    const emp = Auth.employee;
    this.activeUserId = emp.id;

    this.send({
      type: 'auth',
      userId: emp.id,
      empId: emp.id,
      name: emp.fullName,
      role: Auth.role || 'employee',
      companyId: emp.companyId || (typeof Company !== 'undefined' ? Company.currentCompanyId : 1)
    });
  },

  handleIncoming(payload) {
    if (!payload || !payload.type) return;

    switch (payload.type) {
      case 'connection:ready':
        // Acknowledged
        break;

      case 'auth:success':
        this.isAuthenticated = true;
        if (Array.isArray(payload.onlineUserIds)) {
          this.onlineUserIds = new Set(payload.onlineUserIds.map(Number));
          this.emit('presence:roster', Array.from(this.onlineUserIds));
        }
        break;

      case 'presence:online':
        if (payload.userId) {
          this.onlineUserIds.add(Number(payload.userId));
          this.emit('presence:change', { userId: payload.userId, isOnline: true });
        }
        break;

      case 'presence:offline':
        if (payload.userId) {
          this.onlineUserIds.delete(Number(payload.userId));
          this.emit('presence:change', { userId: payload.userId, isOnline: false });
        }
        break;

      case 'presence:roster':
        if (Array.isArray(payload.onlineUserIds)) {
          this.onlineUserIds = new Set(payload.onlineUserIds.map(Number));
          this.emit('presence:roster', Array.from(this.onlineUserIds));
        }
        break;

      case 'chat:message':
        this.emit('chat:message', payload.message);
        if (typeof Chat !== 'undefined' && Chat.handleIncomingMessage) {
          Chat.handleIncomingMessage(payload.message);
        }
        break;

      case 'chat:typing':
        this.emit('chat:typing', payload);
        if (typeof Chat !== 'undefined' && Chat.handleTypingIndicator) {
          Chat.handleTypingIndicator(payload);
        }
        break;

      case 'chat:read':
        this.emit('chat:read', payload);
        break;

      case 'notification:live':
        if (payload.notif) {
          if (typeof LiveNotifications !== 'undefined' && LiveNotifications.handleIncomingBroadcast) {
            LiveNotifications.handleIncomingBroadcast({ notif: payload.notif });
          }
          this.emit('notification:live', payload.notif);
        }
        break;

      case 'pong':
        break;

      default:
        this.emit(payload.type, payload);
    }
  },

  send(payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  },

  sendChatMessage(message) {
    return this.send({
      type: 'chat:message',
      message
    });
  },

  sendTyping(channelId, isTyping) {
    return this.send({
      type: 'chat:typing',
      channelId,
      isTyping
    });
  },

  sendReadReceipt(channelId) {
    return this.send({
      type: 'chat:read',
      channelId
    });
  },

  isUserOnline(userId) {
    if (!userId) return false;
    return this.onlineUserIds.has(Number(userId));
  },

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.warn(`[HRMWebSocket] Listener error on '${event}':`, err);
      }
    });
  }
};

window.HRMWebSocket = HRMWebSocket;
