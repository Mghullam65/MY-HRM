/**
 * server/src/websocket.js
 * Real-Time WebSocket Server for HRM Internal Chat & Live Notifications
 */

const { WebSocketServer, WebSocket } = require('ws');

class HRMWebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // ws -> client metadata
    this.heartbeatInterval = null;
  }

  init(server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start 30-second heartbeat ping-pong
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws) => {
        const client = this.clients.get(ws);
        if (!client || client.isAlive === false) {
          this.handleDisconnect(ws);
          return ws.terminate();
        }
        client.isAlive = false;
        try {
          ws.ping();
        } catch (err) {
          this.handleDisconnect(ws);
        }
      });
    }, 30000);

    console.log('📡 [WebSocket] HRM Real-Time WebSocket Server mounted at /ws');
  }

  handleConnection(ws, req) {
    const clientMeta = {
      ws,
      userId: null,
      empId: null,
      name: 'Guest User',
      role: 'employee',
      companyId: null,
      isAlive: true,
      connectedAt: new Date().toISOString()
    };

    this.clients.set(ws, clientMeta);

    ws.on('pong', () => {
      const meta = this.clients.get(ws);
      if (meta) meta.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        this.handleClientMessage(ws, payload);
      } catch (err) {
        console.warn('⚠️ [WebSocket] Malformed client message:', err.message);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.warn('⚠️ [WebSocket] Client error:', err.message);
      this.handleDisconnect(ws);
    });

    // Send connection established confirmation
    this.send(ws, {
      type: 'connection:ready',
      message: 'Connected to HRM Real-Time Collaboration Gateway',
      serverTime: new Date().toISOString()
    });
  }

  handleDisconnect(ws) {
    const meta = this.clients.get(ws);
    if (!meta) return;

    const { userId, empId, name } = meta;
    this.clients.delete(ws);

    if (userId) {
      // Check if user still has other open tabs
      const hasOtherSockets = Array.from(this.clients.values()).some(c => c.userId === userId);
      if (!hasOtherSockets) {
        this.broadcast({
          type: 'presence:offline',
          userId,
          empId,
          name,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  handleClientMessage(ws, payload) {
    const meta = this.clients.get(ws);
    if (!meta) return;

    switch (payload.type) {
      case 'auth': {
        meta.userId = payload.userId ? parseInt(payload.userId) : null;
        meta.empId = payload.empId ? parseInt(payload.empId) : null;
        meta.name = payload.name || 'Anonymous';
        meta.role = payload.role || 'employee';
        meta.companyId = payload.companyId || null;

        // Acknowledge auth
        this.send(ws, {
          type: 'auth:success',
          user: {
            userId: meta.userId,
            empId: meta.empId,
            name: meta.name,
            role: meta.role
          },
          onlineUserIds: this.getOnlineUserIds()
        });

        // Broadcast user joined online roster
        this.broadcast({
          type: 'presence:online',
          userId: meta.userId,
          empId: meta.empId,
          name: meta.name,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'presence:query': {
        this.send(ws, {
          type: 'presence:roster',
          onlineUserIds: this.getOnlineUserIds()
        });
        break;
      }

      case 'chat:message': {
        if (!payload.message) return;
        const msg = payload.message;
        if (!msg.id) msg.id = 'msg-' + Date.now();
        if (!msg.createdAt) msg.createdAt = new Date().toISOString();

        // Persist message into shared chat store if available
        try {
          const chatRoutes = require('./routes/chat');
          if (chatRoutes && typeof chatRoutes.addMessage === 'function') {
            chatRoutes.addMessage(msg);
          }
        } catch (e) {}

        // Broadcast to relevant clients
        this.broadcastChatMessage(msg, ws);
        break;
      }

      case 'notification:send': {
        if (!payload.notif) return;
        const notif = payload.notif;
        if (!notif.id) notif.id = 'notif-' + Date.now();
        if (!notif.createdAt) notif.createdAt = new Date().toISOString();

        this.broadcastNotification(notif.recipientEmpId, notif, notif.recipientRole);
        break;
      }

      case 'chat:typing': {
        // Relays ephemeral typing state
        this.broadcastToOthers(ws, {
          type: 'chat:typing',
          channelId: payload.channelId,
          userId: meta.userId,
          userName: meta.name,
          isTyping: !!payload.isTyping
        });
        break;
      }

      case 'chat:read': {
        this.broadcastToOthers(ws, {
          type: 'chat:read',
          channelId: payload.channelId,
          userId: meta.userId,
          readAt: new Date().toISOString()
        });
        break;
      }

      case 'chat:reaction': {
        if (!payload.messageId || !payload.emoji) return;
        try {
          const chatRoutes = require('./routes/chat');
          if (chatRoutes && typeof chatRoutes.toggleReaction === 'function') {
            const actorId = meta.empId || meta.userId || payload.userId;
            const updatedReactions = chatRoutes.toggleReaction(payload.messageId, actorId, payload.emoji);
            this.broadcast({
              type: 'chat:reaction',
              messageId: payload.messageId,
              channelId: payload.channelId,
              reactions: updatedReactions
            });
          }
        } catch (e) {}
        break;
      }

      case 'ping': {
        this.send(ws, { type: 'pong', timestamp: Date.now() });
        break;
      }

      default:
        console.log('ℹ️ [WebSocket] Unhandled message type:', payload.type);
    }
  }

  broadcastChatMessage(msg, senderWs) {
    const envelope = {
      type: 'chat:message',
      message: msg
    };

    for (const [ws, meta] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, envelope);
      }
    }
  }

  // Push instant notification to target employee/user
  broadcastNotification(recipientId, notif, roleFilter = null) {
    const envelope = {
      type: 'notification:live',
      notif,
      timestamp: new Date().toISOString()
    };

    let deliveredCount = 0;
    for (const [ws, meta] of this.clients.entries()) {
      if (ws.readyState !== WebSocket.OPEN) continue;

      let isMatch = false;
      if (recipientId && (meta.userId === parseInt(recipientId) || meta.empId === parseInt(recipientId))) {
        isMatch = true;
      } else if (!recipientId && roleFilter && (meta.role === roleFilter || roleFilter === 'all')) {
        isMatch = true;
      }

      if (isMatch) {
        this.send(ws, envelope);
        deliveredCount++;
      }
    }

    return deliveredCount;
  }

  broadcast(payload) {
    for (const [ws] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, payload);
      }
    }
  }

  broadcastToOthers(senderWs, payload) {
    for (const [ws] of this.clients.entries()) {
      if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
        this.send(ws, payload);
      }
    }
  }

  send(ws, payload) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    } catch (err) {
      console.warn('⚠️ [WebSocket] Failed to send to client:', err.message);
    }
  }

  getOnlineUserIds() {
    const ids = new Set();
    for (const meta of this.clients.values()) {
      if (meta.userId) ids.add(meta.userId);
      if (meta.empId) ids.add(meta.empId);
    }
    return Array.from(ids);
  }

  close() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.wss) {
      this.wss.close();
    }
  }
}

const wsService = new HRMWebSocketService();

module.exports = wsService;
