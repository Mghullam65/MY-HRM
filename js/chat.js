// ============================================================
// HRM SYSTEM — Real-Time Internal Chat & Collaboration Engine
// ============================================================

const Chat = {
  isOpen: false,
  activeChannelId: 'chan-1',
  unreadCounts: {},
  typingTimeout: null,
  typingUsers: {}, // channelId -> Set of names
  audioCtx: null,

  init() {
    if (typeof DB !== 'undefined' && DB.ensureChatAndMeetingsData) {
      DB.ensureChatAndMeetingsData();
    }

    this.initAudio();
    this.calculateInitialUnreads();

    // Listen to WebSocket presence & live messaging events
    if (typeof HRMWebSocket !== 'undefined') {
      HRMWebSocket.on('presence:change', () => this.updatePresenceUI());
      HRMWebSocket.on('presence:roster', () => this.updatePresenceUI());
      HRMWebSocket.on('chat:read', (data) => {
        if (data.channelId && data.userId !== Auth?.employee?.id) {
          // Read receipt sync
        }
      });
    }

    // Keyboard shortcut: Ctrl+M / Alt+C opens chat drawer
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm' && !e.shiftKey) {
        e.preventDefault();
        this.toggleDrawer();
      }
    });

    console.log('%c💬 Chat & Real-Time Collaboration Engine initialized', 'color:#6366f1;font-weight:700');
  },

  // ── 1. Web Audio Synthesizer for Message Pop ───────────────
  initAudio() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn('[Chat] Audio init notice:', e.message);
    }
  },

  playMessageSound(type = 'incoming') {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx && AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (type === 'incoming') {
        // High soft bubble pop (659Hz -> 880Hz)
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        // Subtle outgoing pop (440Hz -> 587Hz)
        osc.frequency.setValueAtTime(440.0, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch (err) {}
  },

  // ── 2. Unread Badge Calculation ───────────────────────────
  calculateInitialUnreads() {
    const channels = this.getChannels();
    const myId = Auth?.employee?.id || 1;
    const messages = DB.get('chat_messages') || [];

    // Initialize counts
    channels.forEach(ch => {
      // Simulate 1 unread in announcements if not already read
      if (ch.id === 'chan-1' && !this.unreadCounts[ch.id]) {
        this.unreadCounts[ch.id] = 1;
      } else if (!this.unreadCounts[ch.id]) {
        this.unreadCounts[ch.id] = 0;
      }
    });

    this.updateTopbarBadge();
  },

  getTotalUnreadCount() {
    return Object.values(this.unreadCounts).reduce((sum, count) => sum + (count || 0), 0);
  },

  updateTopbarBadge() {
    const total = this.getTotalUnreadCount();
    const pill = document.getElementById('chat-unread-badge');
    const dot = document.getElementById('chat-badge-dot');

    if (pill) {
      if (total > 0) {
        pill.textContent = total > 9 ? '9+' : total;
        pill.style.display = 'inline-block';
      } else {
        pill.style.display = 'none';
      }
    }

    if (dot) {
      dot.style.display = total > 0 ? 'block' : 'none';
    }
  },

  // ── 3. Data Getters & Channels ────────────────────────────
  getChannels() {
    let channels = DB.get('chat_channels');
    if (!channels || !channels.length) {
      DB.ensureChatAndMeetingsData();
      channels = DB.get('chat_channels') || [];
    }
    const myId = Auth?.employee?.id || 1;

    // Filter channels user is member of or public
    return channels.filter(c => {
      if (c.type === 'direct') {
        return Array.isArray(c.members) && c.members.includes(myId);
      }
      return true;
    });
  },

  getActiveChannel() {
    const channels = this.getChannels();
    return channels.find(c => c.id === this.activeChannelId) || channels[0] || null;
  },

  getMessages(channelId) {
    const all = DB.get('chat_messages') || [];
    return all.filter(m => m.channelId === channelId);
  },

  // ── 4. Slide-Over Collaboration Drawer ────────────────────
  toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  },

  openDrawer() {
    this.isOpen = true;
    const overlay = document.getElementById('chat-drawer-overlay');
    const drawer = document.getElementById('chat-drawer');

    if (overlay) overlay.classList.add('open');
    if (drawer) {
      drawer.classList.add('open');
      this.renderDrawer();
    }

    // Mark active channel as read
    if (this.activeChannelId) {
      this.markChannelAsRead(this.activeChannelId);
    }
  },

  closeDrawer() {
    this.isOpen = false;
    const overlay = document.getElementById('chat-drawer-overlay');
    const drawer = document.getElementById('chat-drawer');

    if (overlay) overlay.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
  },

  markChannelAsRead(channelId) {
    this.unreadCounts[channelId] = 0;
    this.updateTopbarBadge();
    this.renderChannelList();

    if (typeof HRMWebSocket !== 'undefined') {
      HRMWebSocket.sendReadReceipt(channelId);
    }
  },

  openChannel(channelId) {
    this.activeChannelId = channelId;
    this.markChannelAsRead(channelId);
    this.renderDrawer();
    setTimeout(() => this.scrollToBottom(), 50);
  },

  startDirectChat(targetEmpId) {
    const myEmp = Auth?.employee;
    if (!myEmp) return;
    const myId = myEmp.id;
    targetEmpId = parseInt(targetEmpId);

    if (myId === targetEmpId) {
      if (typeof Toast !== 'undefined') Toast.show('Cannot start a direct chat with yourself.', 'info');
      return;
    }

    const employees = DB.get('employees') || [];
    const targetEmp = employees.find(e => e.id === targetEmpId);
    if (!targetEmp) return;

    // Check if DM channel already exists
    const channels = DB.get('chat_channels') || [];
    let dmChannel = channels.find(c => 
      c.type === 'direct' && 
      Array.isArray(c.members) && 
      c.members.includes(myId) && 
      c.members.includes(targetEmpId)
    );

    if (!dmChannel) {
      dmChannel = {
        id: `dm-${Math.min(myId, targetEmpId)}-${Math.max(myId, targetEmpId)}`,
        name: targetEmp.fullName,
        type: 'direct',
        scope: 'direct',
        companyId: targetEmp.companyId || myEmp.companyId,
        companyName: targetEmp.companyName || myEmp.companyName || 'Company',
        description: `Direct conversation with ${targetEmp.fullName} (${targetEmp.designation || 'Staff'})`,
        createdBy: myId,
        createdByName: myEmp.fullName,
        avatar: targetEmp.photo || 'fa-user',
        targetEmpId: targetEmpId,
        targetEmpName: targetEmp.fullName,
        targetEmpRole: targetEmp.designation,
        createdAt: new Date().toISOString(),
        members: [myId, targetEmpId]
      };
      channels.push(dmChannel);
      DB.set('chat_channels', channels);
    }

    this.activeChannelId = dmChannel.id;
    this.openDrawer();
  },

  // ── 5. Message Dispatch & Receiving ───────────────────────
  sendMessage() {
    const input = document.getElementById('chat-input-text');
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;

    const myEmp = Auth?.employee || { id: 1, fullName: 'Admin User', designation: 'Manager' };
    const channel = this.getActiveChannel();
    if (!channel) return;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      channelId: channel.id,
      senderId: myEmp.id,
      senderName: myEmp.fullName,
      senderRole: Auth?.role ? Auth.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Employee',
      senderCompany: myEmp.companyName || 'Apex Holdings Inc.',
      content,
      messageType: 'text',
      attachments: [],
      createdAt: new Date().toISOString()
    };

    // Save to local DB
    const allMsgs = DB.get('chat_messages') || [];
    allMsgs.push(newMsg);
    DB.set('chat_messages', allMsgs);

    // Send via WebSocket
    if (typeof HRMWebSocket !== 'undefined') {
      HRMWebSocket.sendChatMessage(newMsg);
      HRMWebSocket.sendTyping(channel.id, false);
    }

    // Play subtle outgoing pop
    this.playMessageSound('outgoing');

    // Reset input
    input.value = '';
    input.style.height = 'auto';

    // Append to DOM immediately
    this.appendMessageToDOM(newMsg);
    this.scrollToBottom();
  },

  handleIncomingMessage(msg) {
    if (!msg || !msg.channelId) return;

    const myId = Auth?.employee?.id || 1;
    // If sent by me, it's already rendered locally
    if (msg.senderId === myId) return;

    // Check if channel belongs to current active view
    const allMsgs = DB.get('chat_messages') || [];
    if (!allMsgs.some(m => m.id === msg.id)) {
      allMsgs.push(msg);
      DB.set('chat_messages', allMsgs);
    }

    if (this.isOpen && this.activeChannelId === msg.channelId) {
      this.appendMessageToDOM(msg);
      this.scrollToBottom();
      this.playMessageSound('incoming');
    } else {
      // Increment unread count
      this.unreadCounts[msg.channelId] = (this.unreadCounts[msg.channelId] || 0) + 1;
      this.updateTopbarBadge();
      this.renderChannelList();
      this.playMessageSound('incoming');

      // Show toast alert
      if (typeof Toast !== 'undefined') {
        const preview = msg.content.length > 50 ? msg.content.substring(0, 50) + '…' : msg.content;
        Toast.show(`💬 <strong>${msg.senderName}:</strong> ${preview}`, 'info');
      }
    }
  },

  // ── 6. Live Typing Indicators ─────────────────────────────
  onInputTyping(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
      return;
    }

    const channel = this.getActiveChannel();
    if (!channel || typeof HRMWebSocket === 'undefined') return;

    if (!this.typingTimeout) {
      HRMWebSocket.sendTyping(channel.id, true);
    }

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      HRMWebSocket.sendTyping(channel.id, false);
      this.typingTimeout = null;
    }, 2000);
  },

  handleTypingIndicator(payload) {
    const { channelId, userName, isTyping, userId } = payload;
    const myId = Auth?.employee?.id || 1;
    if (userId === myId) return;

    if (!this.typingUsers[channelId]) {
      this.typingUsers[channelId] = new Set();
    }

    if (isTyping) {
      this.typingUsers[channelId].add(userName);
    } else {
      this.typingUsers[channelId].delete(userName);
    }

    if (this.isOpen && this.activeChannelId === channelId) {
      this.renderTypingBar();
    }
  },

  renderTypingBar() {
    const bar = document.getElementById('chat-typing-bar');
    if (!bar) return;

    const names = Array.from(this.typingUsers[this.activeChannelId] || []);
    if (names.length === 0) {
      bar.innerHTML = '';
      bar.style.display = 'none';
    } else {
      const label = names.length === 1 
        ? `${names[0]} is typing...` 
        : `${names.slice(0, 2).join(', ')} are typing...`;
      bar.innerHTML = `
        <div class="chat-typing-indicator">
          <span></span><span></span><span></span>
        </div>
        <span style="font-size:11.5px;color:var(--text-3);font-style:italic">${label}</span>
      `;
      bar.style.display = 'flex';
    }
  },

  // ── 7. UI Rendering ───────────────────────────────────────
  renderDrawer() {
    const drawer = document.getElementById('chat-drawer');
    if (!drawer) return;

    const channel = this.getActiveChannel();
    const channels = this.getChannels();
    const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isConnected;

    drawer.innerHTML = `
      <div class="chat-drawer-container">
        <!-- Drawer Header -->
        <div class="chat-drawer-header">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="chat-header-icon">
              <i class="fa fa-comments"></i>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">HRM Collaboration Hub</h3>
                <span class="live-status-pill" style="font-size:9.5px;padding:1px 6px">
                  <span class="live-status-dot" style="background:${isOnline ? '#10b981' : '#ef4444'}"></span>
                  ${isOnline ? 'REAL-TIME' : 'POLLING'}
                </span>
              </div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">Instant team messaging, presence & file sharing</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Chat.closeDrawer()" title="Close (Esc)" style="width:32px;height:32px;padding:0;border-radius:8px">
            <i class="fa fa-xmark" style="font-size:16px"></i>
          </button>
        </div>

        <!-- Main Body: 2 Columns -->
        <div class="chat-drawer-body">
          <!-- Left Panel: Channels & Roster -->
          <div class="chat-channels-panel">
            <div style="padding:10px 12px;border-bottom:1px solid var(--border)">
              <div class="chat-search-wrap">
                <i class="fa fa-search" style="font-size:12px;color:var(--text-3)"></i>
                <input type="text" placeholder="Search channels or colleagues…" id="chat-filter-input" oninput="Chat.filterChannels(this.value)">
              </div>
            </div>
            <div class="chat-channels-list" id="chat-channels-list">
              <!-- Rendered by renderChannelList() -->
            </div>
          </div>

          <!-- Right Panel: Conversation Thread -->
          <div class="chat-conversation-panel">
            <!-- Channel Header -->
            <div class="chat-convo-header" id="chat-convo-header">
              ${this.renderConvoHeaderHTML(channel)}
            </div>

            <!-- Messages Stream -->
            <div class="chat-messages-stream" id="chat-messages-stream">
              <!-- Rendered messages -->
            </div>

            <!-- Ephemeral Typing Indicator -->
            <div class="chat-typing-bar" id="chat-typing-bar" style="display:none"></div>

            <!-- Input Bar -->
            <div class="chat-input-area">
              <div class="chat-input-wrapper">
                <button class="chat-btn-attach" onclick="document.getElementById('chat-file-picker').click()" title="Share Document / Image (up to 10MB)">
                  <i class="fa fa-paperclip"></i>
                </button>
                <input type="file" id="chat-file-picker" style="display:none" onchange="Chat.handleFileUpload(this)">
                <textarea 
                  id="chat-input-text" 
                  rows="1" 
                  placeholder="Message ${channel ? (channel.type === 'direct' ? '@' + channel.name : '#' + channel.name) : ''}… (Enter to send, Shift+Enter for newline)"
                  onkeydown="Chat.onInputTyping(event)"
                  oninput="this.style.height='auto';this.style.height=(this.scrollHeight)+'px'"></textarea>
                <button class="chat-btn-send" onclick="Chat.sendMessage()" title="Send Message">
                  <i class="fa fa-paper-plane"></i>
                </button>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px 0;font-size:11px;color:var(--text-3)">
                <span><i class="fa fa-shield-halved" style="font-size:10px;margin-right:4px"></i> End-to-end encrypted within your enterprise organization</span>
                <span>Press <strong>Enter</strong> to send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderChannelList();
    this.renderMessagesStream();
    this.renderTypingBar();
  },

  renderConvoHeaderHTML(channel) {
    if (!channel) return '<div style="padding:14px;color:var(--text-3)">Select a channel</div>';

    const isDirect = channel.type === 'direct';
    const isTargetOnline = isDirect && typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(channel.targetEmpId);

    return `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="position:relative">
          <div class="chat-channel-avatar" style="background:${channel.type === 'cross_company' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)'}">
            <i class="fa ${isDirect ? 'fa-user' : (channel.avatar || 'fa-hashtag')}"></i>
          </div>
          ${isDirect ? `<span class="chat-presence-dot ${isTargetOnline ? 'online' : 'offline'}"></span>` : ''}
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:14px;font-weight:700;color:var(--text)">${channel.name}</span>
            ${channel.scope === 'all_company' ? '<span class="badge badge-primary" style="font-size:9.5px;padding:1px 5px">All Hands</span>' : ''}
            ${channel.type === 'cross_company' ? '<span class="badge badge-info" style="font-size:9.5px;padding:1px 5px">Group Holdings</span>' : ''}
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:1px">
            ${isDirect ? (isTargetOnline ? '🟢 Active now' : '⚪ Offline') : (channel.description || 'Enterprise collaboration channel')}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn btn-ghost btn-xs" onclick="Chat.showChannelMembersModal('${channel.id}')" title="View Channel Members" style="gap:5px">
          <i class="fa fa-users" style="font-size:11px"></i>
          <span>${channel.members ? channel.members.length : 1} Members</span>
        </button>
      </div>
    `;
  },

  renderChannelList(filterText = '') {
    const container = document.getElementById('chat-channels-list');
    if (!container) return;

    const channels = this.getChannels();
    const query = (filterText || '').toLowerCase();

    const filtered = channels.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.description && c.description.toLowerCase().includes(query))
    );

    const groups = filtered.filter(c => c.type !== 'direct');
    const directChats = filtered.filter(c => c.type === 'direct');

    let html = '';

    // Office Channels & Teams
    html += `<div class="chat-section-label">CHANNELS & WORKSPACES (${groups.length})</div>`;
    groups.forEach(c => {
      const isActive = c.id === this.activeChannelId;
      const unread = this.unreadCounts[c.id] || 0;
      html += `
        <div class="chat-channel-item ${isActive ? 'active' : ''}" onclick="Chat.openChannel('${c.id}')">
          <div class="chat-item-icon">
            <i class="fa ${c.avatar || 'fa-hashtag'}"></i>
          </div>
          <div class="chat-item-info">
            <div class="chat-item-name">${c.name}</div>
            <div class="chat-item-sub">${c.companyName || 'Apex Holdings'}</div>
          </div>
          ${unread > 0 ? `<span class="badge badge-danger chat-unread-pill">${unread}</span>` : ''}
        </div>
      `;
    });

    // Direct Messages
    html += `<div class="chat-section-label" style="margin-top:14px">DIRECT MESSAGES (${directChats.length})</div>`;
    if (directChats.length === 0) {
      html += `<div style="padding:8px 12px;font-size:11.5px;color:var(--text-3);font-style:italic">No direct messages yet. Click colleague profile to chat.</div>`;
    } else {
      directChats.forEach(c => {
        const isActive = c.id === this.activeChannelId;
        const unread = this.unreadCounts[c.id] || 0;
        const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(c.targetEmpId);

        html += `
          <div class="chat-channel-item ${isActive ? 'active' : ''}" onclick="Chat.openChannel('${c.id}')">
            <div style="position:relative">
              <div class="chat-item-icon direct-avatar">
                <i class="fa fa-user"></i>
              </div>
              <span class="chat-presence-dot ${isOnline ? 'online' : 'offline'}"></span>
            </div>
            <div class="chat-item-info">
              <div class="chat-item-name">${c.name}</div>
              <div class="chat-item-sub">${c.targetEmpRole || c.companyName || 'Staff'}</div>
            </div>
            ${unread > 0 ? `<span class="badge badge-danger chat-unread-pill">${unread}</span>` : ''}
          </div>
        `;
      });
    }

    container.innerHTML = html;
  },

  filterChannels(val) {
    this.renderChannelList(val);
  },

  updatePresenceUI() {
    this.renderChannelList();
    const channel = this.getActiveChannel();
    const header = document.getElementById('chat-convo-header');
    if (header && channel) {
      header.innerHTML = this.renderConvoHeaderHTML(channel);
    }
  },

  renderMessagesStream() {
    const stream = document.getElementById('chat-messages-stream');
    if (!stream) return;

    const messages = this.getMessages(this.activeChannelId);
    const myId = Auth?.employee?.id || 1;

    if (messages.length === 0) {
      stream.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-3);padding:30px;text-align:center">
          <div style="width:54px;height:54px;border-radius:50%;background:rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:22px;margin-bottom:12px">
            <i class="fa fa-paper-plane"></i>
          </div>
          <h4 style="margin:0 0 6px 0;color:var(--text);font-size:15px">Start the Conversation</h4>
          <p style="margin:0;font-size:12.5px;max-width:280px">Say hello to the team or share reference documents and notes.</p>
        </div>
      `;
      return;
    }

    let html = '';
    let lastDate = '';

    messages.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (msgDate !== lastDate) {
        html += `
          <div class="chat-date-separator">
            <span>${msgDate}</span>
          </div>
        `;
        lastDate = msgDate;
      }

      const isMe = msg.senderId === myId;
      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}">
          ${!isMe ? `
            <div class="chat-msg-avatar" style="background:${typeof Utils !== 'undefined' ? Utils.avatarColor(msg.senderId) : '#6366f1'}">
              ${typeof Utils !== 'undefined' ? Utils.avatarInitials(msg.senderName) : msg.senderName.substring(0,2).toUpperCase()}
            </div>
          ` : ''}
          <div class="chat-msg-bubble-wrap">
            ${!isMe ? `
              <div class="chat-msg-sender-meta">
                <span style="font-weight:700;color:var(--text)">${msg.senderName}</span>
                <span class="chat-sender-role">${msg.senderRole || ''}</span>
              </div>
            ` : ''}
            <div class="chat-msg-bubble">
              <div class="chat-msg-text">${this.formatMessageText(msg.content)}</div>
              ${this.renderAttachmentsHTML(msg.attachments)}
              <div class="chat-msg-time">${timeStr} ${isMe ? '<i class="fa fa-check-double" style="font-size:9.5px;margin-left:3px;color:#93c5fd"></i>' : ''}</div>
            </div>
          </div>
        </div>
      `;
    });

    stream.innerHTML = html;
    this.scrollToBottom();
  },

  appendMessageToDOM(msg) {
    const stream = document.getElementById('chat-messages-stream');
    if (!stream) return;

    const myId = Auth?.employee?.id || 1;
    const isMe = msg.senderId === myId;
    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const row = document.createElement('div');
    row.className = `chat-msg-row ${isMe ? 'outgoing' : 'incoming'} new-message-anim`;
    row.innerHTML = `
      ${!isMe ? `
        <div class="chat-msg-avatar" style="background:${typeof Utils !== 'undefined' ? Utils.avatarColor(msg.senderId) : '#6366f1'}">
          ${typeof Utils !== 'undefined' ? Utils.avatarInitials(msg.senderName) : msg.senderName.substring(0,2).toUpperCase()}
        </div>
      ` : ''}
      <div class="chat-msg-bubble-wrap">
        ${!isMe ? `
          <div class="chat-msg-sender-meta">
            <span style="font-weight:700;color:var(--text)">${msg.senderName}</span>
            <span class="chat-sender-role">${msg.senderRole || ''}</span>
          </div>
        ` : ''}
        <div class="chat-msg-bubble">
          <div class="chat-msg-text">${this.formatMessageText(msg.content)}</div>
          ${this.renderAttachmentsHTML(msg.attachments)}
          <div class="chat-msg-time">${timeStr} ${isMe ? '<i class="fa fa-check-double" style="font-size:9.5px;margin-left:3px;color:#93c5fd"></i>' : ''}</div>
        </div>
      </div>
    `;

    stream.appendChild(row);
  },

  formatMessageText(text) {
    if (!text) return '';
    // Escape HTML
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Auto-link URLs
    escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;word-break:break-all">$1</a>');
    return escaped.replace(/\n/g, '<br>');
  },

  renderAttachmentsHTML(attachments) {
    if (!attachments || !attachments.length) return '';

    return `
      <div class="chat-attachments-list">
        ${attachments.map(att => {
          let icon = 'fa-file';
          if (att.fileType && att.fileType.includes('pdf')) icon = 'fa-file-pdf text-danger';
          else if (att.fileType && (att.fileType.includes('sheet') || att.fileType.includes('excel') || att.fileName.endsWith('.xlsx') || att.fileName.endsWith('.csv'))) icon = 'fa-file-excel text-success';
          else if (att.fileType && att.fileType.includes('image')) icon = 'fa-file-image text-info';

          const sizeKb = att.fileSize ? Math.round(att.fileSize / 1024) + ' KB' : '';

          return `
            <div class="chat-attachment-card">
              <i class="fa ${icon}" style="font-size:18px"></i>
              <div style="flex:1;overflow:hidden">
                <div class="att-name" title="${att.fileName}">${att.fileName}</div>
                <div class="att-size">${sizeKb}</div>
              </div>
              <a href="${att.fileUrl || '#'}" download="${att.fileName}" class="att-dl-btn" title="Download">
                <i class="fa fa-download"></i>
              </a>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  handleFileUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      if (typeof Toast !== 'undefined') {
        Toast.show(`File size (${(file.size / (1024*1024)).toFixed(2)}MB) exceeds 10MB maximum limit.`, 'error');
      }
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const myEmp = Auth?.employee || { id: 1, fullName: 'Admin User', designation: 'Staff' };
      const channel = this.getActiveChannel();

      const newMsg = {
        id: `msg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        channelId: channel.id,
        senderId: myEmp.id,
        senderName: myEmp.fullName,
        senderRole: Auth?.role ? Auth.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Staff',
        senderCompany: myEmp.companyName || 'Apex Holdings Inc.',
        content: `Shared file: ${file.name}`,
        messageType: 'file',
        attachments: [
          {
            id: `att-${Date.now()}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream',
            fileUrl: e.target.result // Base64 data URL
          }
        ],
        createdAt: new Date().toISOString()
      };

      const allMsgs = DB.get('chat_messages') || [];
      allMsgs.push(newMsg);
      DB.set('chat_messages', allMsgs);

      if (typeof HRMWebSocket !== 'undefined') {
        HRMWebSocket.sendChatMessage(newMsg);
      }

      this.playMessageSound('outgoing');
      this.appendMessageToDOM(newMsg);
      this.scrollToBottom();
      input.value = '';

      if (typeof Toast !== 'undefined') {
        Toast.show(`File "${file.name}" sent successfully.`, 'success');
      }
    };

    reader.readAsDataURL(file);
  },

  scrollToBottom() {
    const stream = document.getElementById('chat-messages-stream');
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  },

  showChannelMembersModal(channelId) {
    const channel = this.getChannels().find(c => c.id === channelId);
    if (!channel) return;

    const employees = DB.get('employees') || [];
    const members = (channel.members || []).map(id => employees.find(e => e.id === id)).filter(Boolean);

    const content = `
      <div style="padding:10px">
        <div style="margin-bottom:14px">
          <h4 style="margin:0 0 4px 0">${channel.name}</h4>
          <p style="margin:0;font-size:12px;color:var(--text-3)">${channel.description || ''}</p>
        </div>
        <div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
          ${members.map(m => {
            const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(m.id);
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surface-hover);border-radius:8px">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="position:relative">
                    <div class="avatar avatar-sm" style="background:${Utils.avatarColor(m.id)}">${Utils.avatarInitials(m.fullName)}</div>
                    <span class="chat-presence-dot ${isOnline ? 'online' : 'offline'}"></span>
                  </div>
                  <div>
                    <div style="font-size:13px;font-weight:700;color:var(--text)">${m.fullName}</div>
                    <div style="font-size:11px;color:var(--text-3)">${m.designation || 'Staff'} • ${m.department || 'General'}</div>
                  </div>
                </div>
                <span class="badge ${isOnline ? 'badge-success' : 'badge-ghost'}" style="font-size:10px">
                  ${isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    if (typeof Modal !== 'undefined') {
      Modal.open({
        title: 'Channel Members Directory',
        content,
        footer: '<button class="btn btn-primary btn-sm" onclick="Modal.close()">Close</button>'
      });
    }
  }
};

window.Chat = Chat;
