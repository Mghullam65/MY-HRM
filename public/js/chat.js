// ============================================================
// HRM SYSTEM — Real-Time Internal Chat & Collaboration Engine
// Instant Team Messaging, Colleague Username Search & File Sharing
// ============================================================

const Chat = {
  isOpen: false,
  isMinimized: false,
  isMaximized: false,
  activeTab: 'colleagues', // 'colleagues' | 'chats' | 'channels'
  viewMode: 'list',  // 'list' | 'convo'
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
        if (data.channelId && data.userId !== (typeof Auth !== 'undefined' && Auth?.employee?.id)) {
          // Read receipt sync
        }
      });
      HRMWebSocket.on('chat:reaction', (data) => this.handleReactionUpdate(data));
      HRMWebSocket.on('chat:typing', (data) => this.handleTypingIndicator(data));
      HRMWebSocket.on('chat:message', (data) => {
        if (data.message) this.handleIncomingMessage(data.message);
      });
    }

    // Keyboard shortcut: Ctrl+M / Cmd+M opens chat drawer
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm' && !e.shiftKey) {
          e.preventDefault();
          this.toggleDrawer();
        }
      });
    }

    console.log('%c💬 Real-Time Chatbox & Colleague Collaboration Engine initialized', 'color:#6366f1;font-weight:700');
  },

  // ── 1. Web Audio Synthesizer for Message Pop ───────────────
  initAudio() {
    try {
      if (typeof window === 'undefined') return;
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
      if (typeof window === 'undefined') return;
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
    channels.forEach(ch => {
      if (ch.id === 'chan-1' && !this.unreadCounts[ch.id]) {
        this.unreadCounts[ch.id] = 1;
      } else if (!this.unreadCounts[ch.id]) {
        this.unreadCounts[ch.id] = 0;
      }
    });

    this.updateBadges();
  },

  getTotalUnreadCount() {
    return Object.values(this.unreadCounts).reduce((sum, count) => sum + (count || 0), 0);
  },

  updateBadges() {
    if (typeof document === 'undefined') return;
    const total = this.getTotalUnreadCount();

    // 1. Floating launcher badge
    const floatBadge = document.getElementById('chat-floating-badge');
    if (floatBadge) {
      if (total > 0) {
        floatBadge.textContent = total > 9 ? '9+' : total;
        floatBadge.style.display = 'flex';
      } else {
        floatBadge.style.display = 'none';
      }
    }

    // 2. Topbar navigation badge
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

    // 3. Chat tabs badge
    const tabBadge = document.getElementById('chat-tab-unread-badge');
    if (tabBadge) {
      if (total > 0) {
        tabBadge.textContent = total > 9 ? '9+' : total;
        tabBadge.style.display = 'inline-block';
      } else {
        tabBadge.style.display = 'none';
      }
    }
  },

  updateTopbarBadge() {
    this.updateBadges();
  },

  // ── 3. Data Getters & Channels ────────────────────────────
  getChannels() {
    if (typeof DB === 'undefined') return [];
    let channels = DB.get('chat_channels');
    if (!channels || !channels.length) {
      if (DB.ensureChatAndMeetingsData) DB.ensureChatAndMeetingsData();
      channels = DB.get('chat_channels') || [];
    }
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;

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
    if (typeof DB === 'undefined') return [];
    const all = DB.get('chat_messages') || [];
    return all.filter(m => m.channelId === channelId);
  },

  // ── 4. Colleague Directory & Username Resolution ──────────
  getAllCompanyMembers() {
    if (typeof DB === 'undefined') return [];
    const employees = DB.get('employees') || [];
    const users = DB.get('users') || [];
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;

    // Build username map from users table
    const empUserMap = {};
    users.forEach(u => {
      if (u.employeeId) empUserMap[u.employeeId] = u.username;
    });

    return employees.map(emp => {
      let username = empUserMap[emp.id];
      if (!username) {
        if (emp.email) {
          username = emp.email.split('@')[0];
        } else {
          username = (emp.fullName || `emp${emp.id}`).toLowerCase().replace(/[^a-z0-9]/g, '.');
        }
      }

      const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(emp.id);

      return {
        empId: emp.id,
        username: username,
        fullName: emp.fullName,
        designation: emp.designation || 'Team Member',
        department: emp.department || 'General',
        companyName: emp.companyName || 'Apex Holdings',
        companyId: emp.companyId || 1,
        email: emp.email || '',
        photo: emp.photo || '',
        isOnline: isOnline,
        isSelf: emp.id === myId
      };
    });
  },

  searchColleaguesByUsername(query) {
    if (typeof document === 'undefined') return;
    const popover = document.getElementById('chat-username-autocomplete');
    if (!popover) return;

    const trimmed = (query || '').trim().replace(/^@/, '').toLowerCase();
    if (!trimmed) {
      popover.style.display = 'none';
      popover.innerHTML = '';
      return;
    }

    const members = this.getAllCompanyMembers();
    const matches = members.filter(m => 
      !m.isSelf && (
        m.username.toLowerCase().includes(trimmed) ||
        m.fullName.toLowerCase().includes(trimmed) ||
        m.designation.toLowerCase().includes(trimmed) ||
        m.department.toLowerCase().includes(trimmed)
      )
    ).slice(0, 8); // Top 8 matches

    if (matches.length === 0) {
      popover.innerHTML = `
        <div style="padding:12px;text-align:center;color:var(--text-3);font-size:12px">
          No colleague found matching "<strong>@${query.replace(/^@/, '')}</strong>"
        </div>
      `;
      popover.style.display = 'block';
      return;
    }

    let html = '';
    matches.forEach(m => {
      const initials = typeof Utils !== 'undefined' && Utils.avatarInitials 
        ? Utils.avatarInitials(m.fullName) 
        : m.fullName.substring(0, 2).toUpperCase();
      const color = typeof Utils !== 'undefined' && Utils.avatarColor 
        ? Utils.avatarColor(m.empId) 
        : '#6366f1';

      html += `
        <div class="chat-user-autocomplete-item" onclick="Chat.startDirectChat(${m.empId})">
          <div class="chat-user-item-left">
            <div class="chat-user-avatar" style="background:${color}">
              ${initials}
              <span class="chat-status-dot ${m.isOnline ? 'online' : 'offline'}"></span>
            </div>
            <div>
              <div class="chat-user-info-name">${m.fullName}</div>
              <div class="chat-user-info-handle">@${m.username}</div>
              <div class="chat-user-info-role">${m.designation} • ${m.department}</div>
            </div>
          </div>
          <button class="chat-directory-btn" style="padding:3px 9px;font-size:11px">
            <i class="fa fa-comment-dots"></i> Chat
          </button>
        </div>
      `;
    });

    popover.innerHTML = html;
    popover.style.display = 'block';
  },

  clearSearchInput() {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('chat-username-input');
    const popover = document.getElementById('chat-username-autocomplete');
    if (input) input.value = '';
    if (popover) {
      popover.style.display = 'none';
      popover.innerHTML = '';
    }
  },

  startDirectChatByUsername(username) {
    const cleanUser = (username || '').trim().replace(/^@/, '').toLowerCase();
    if (!cleanUser) return;

    const members = this.getAllCompanyMembers();
    const match = members.find(m => m.username.toLowerCase() === cleanUser);
    if (match) {
      this.startDirectChat(match.empId);
    } else {
      if (typeof Toast !== 'undefined') {
        Toast.show(`Colleague with username @${cleanUser} not found.`, 'warning');
      }
    }
  },

  startDirectChat(targetEmpId) {
    const myEmp = (typeof Auth !== 'undefined' && Auth?.employee) || { id: 1, fullName: 'Admin User' };
    const myId = myEmp.id;
    targetEmpId = parseInt(targetEmpId);

    if (myId === targetEmpId) {
      if (typeof Toast !== 'undefined') Toast.show('Cannot start a direct chat with yourself.', 'info');
      return;
    }

    const employees = (typeof DB !== 'undefined' && DB.get('employees')) || [];
    const targetEmp = employees.find(e => e.id === targetEmpId);
    if (!targetEmp) return;

    // Check if DM channel already exists
    const channels = (typeof DB !== 'undefined' && DB.get('chat_channels')) || [];
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
        companyId: targetEmp.companyId || myEmp.companyId || 1,
        companyName: targetEmp.companyName || myEmp.companyName || 'Apex Holdings',
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
      if (typeof DB !== 'undefined') DB.set('chat_channels', channels);
    }

    this.activeChannelId = dmChannel.id;
    this.viewMode = 'convo';
    this.clearSearchInput();
    this.openDrawer();
  },

  // ── 5. Slide-Over & Dockable Chatbox Controls ─────────────
  toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  },

  openDrawer() {
    if (typeof document === 'undefined') return;
    this.isOpen = true;
    this.isMinimized = false;

    const overlay = document.getElementById('chat-drawer-overlay');
    const drawer = document.getElementById('chat-drawer');

    if (overlay) overlay.classList.add('open');
    if (drawer) {
      drawer.classList.add('open');
      drawer.classList.remove('minimized');
      if (this.isMaximized) drawer.classList.add('maximized');
      this.renderDrawer();
    }

    if (this.activeChannelId) {
      this.markChannelAsRead(this.activeChannelId);
    }
  },

  closeDrawer() {
    if (typeof document === 'undefined') return;
    this.isOpen = false;
    this.isMinimized = false;
    this.clearSearchInput();

    const overlay = document.getElementById('chat-drawer-overlay');
    const drawer = document.getElementById('chat-drawer');

    if (overlay) overlay.classList.remove('open');
    if (drawer) {
      drawer.classList.remove('open');
      drawer.classList.remove('minimized');
      drawer.classList.remove('maximized');
    }
  },

  toggleMinimize(e) {
    if (e) e.stopPropagation();
    if (typeof document === 'undefined') return;
    const drawer = document.getElementById('chat-drawer');
    if (!drawer) return;

    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      drawer.classList.add('minimized');
    } else {
      drawer.classList.remove('minimized');
    }
  },

  toggleMaximize(e) {
    if (e) e.stopPropagation();
    if (typeof document === 'undefined') return;
    const drawer = document.getElementById('chat-drawer');
    if (!drawer) return;

    this.isMaximized = !this.isMaximized;
    if (this.isMaximized) {
      drawer.classList.add('maximized');
    } else {
      drawer.classList.remove('maximized');
    }
    const maxBtn = document.getElementById('chat-max-btn');
    if (maxBtn) {
      maxBtn.innerHTML = this.isMaximized ? '<i class="fa fa-compress"></i>' : '<i class="fa fa-expand"></i>';
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    this.viewMode = 'list';
    this.clearSearchInput();
    this.renderDrawer();
  },

  backToList() {
    this.viewMode = 'list';
    this.renderDrawer();
  },

  markChannelAsRead(channelId) {
    this.unreadCounts[channelId] = 0;
    this.updateBadges();

    if (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.sendReadReceipt) {
      HRMWebSocket.sendReadReceipt(channelId);
    }
  },

  openChannel(channelId) {
    this.activeChannelId = channelId;
    this.viewMode = 'convo';
    this.markChannelAsRead(channelId);
    this.renderDrawer();
    setTimeout(() => this.scrollToBottom(), 60);
  },

  // ── 6. Message Dispatch & Receiving ───────────────────────
  sendMessage() {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('chat-input-text');
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;

    const myEmp = (typeof Auth !== 'undefined' && Auth?.employee) || { id: 1, fullName: 'Admin User', designation: 'Manager' };
    const channel = this.getActiveChannel();
    if (!channel) return;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      channelId: channel.id,
      senderId: myEmp.id,
      senderName: myEmp.fullName,
      senderRole: (typeof Auth !== 'undefined' && Auth?.role) 
        ? Auth.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) 
        : 'Employee',
      senderCompany: myEmp.companyName || 'Apex Holdings Inc.',
      content,
      messageType: 'text',
      attachments: [],
      createdAt: new Date().toISOString()
    };

    // Save to local DB
    if (typeof DB !== 'undefined') {
      const allMsgs = DB.get('chat_messages') || [];
      allMsgs.push(newMsg);
      DB.set('chat_messages', allMsgs);
    }

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

    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;
    if (msg.senderId === myId) return;

    // Check if channel belongs to current active view
    if (typeof DB !== 'undefined') {
      const allMsgs = DB.get('chat_messages') || [];
      if (!allMsgs.some(m => m.id === msg.id)) {
        allMsgs.push(msg);
        DB.set('chat_messages', allMsgs);
      }
    }

    if (this.isOpen && this.activeChannelId === msg.channelId && this.viewMode === 'convo') {
      this.appendMessageToDOM(msg);
      this.scrollToBottom();
      this.playMessageSound('incoming');
    } else {
      // Increment unread count
      this.unreadCounts[msg.channelId] = (this.unreadCounts[msg.channelId] || 0) + 1;
      this.updateBadges();
      this.playMessageSound('incoming');

      // Show toast alert
      if (typeof Toast !== 'undefined') {
        const preview = msg.content.length > 50 ? msg.content.substring(0, 50) + '…' : msg.content;
        Toast.show(`💬 <strong>${msg.senderName}:</strong> ${preview}`, 'info');
      }

      // Re-render list if currently on list view
      if (this.isOpen && this.viewMode === 'list') {
        this.renderDrawer();
      }
    }
  },

  // ── 7. Live Typing Indicators ─────────────────────────────
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
    if (!payload || !payload.channelId) return;
    const { channelId, userName, isTyping, userId } = payload;
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;
    if (userId === myId) return;

    if (!this.typingUsers[channelId]) {
      this.typingUsers[channelId] = new Set();
    }

    if (isTyping) {
      this.typingUsers[channelId].add(userName);
    } else {
      this.typingUsers[channelId].delete(userName);
    }

    if (this.isOpen && this.activeChannelId === channelId && this.viewMode === 'convo') {
      this.renderTypingBar();
    }
  },

  renderTypingBar() {
    if (typeof document === 'undefined') return;
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
        <div class="chat-typing-dots">
          <span></span><span></span><span></span>
        </div>
        <span>${label}</span>
      `;
      bar.style.display = 'flex';
    }
  },

  // ── 8. UI Rendering: Modern Header, Tabs, & Views ───────────
  renderDrawer() {
    if (typeof document === 'undefined') return;
    const drawer = document.getElementById('chat-drawer');
    if (!drawer) return;

    const channel = this.getActiveChannel();
    const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isConnected;
    const totalUnreads = this.getTotalUnreadCount();

    // 1. Header & Controls
    const headerHTML = `
      <div class="chat-header">
        <div class="chat-title-wrap">
          <div class="chat-title-icon">
            <i class="fa fa-comments"></i>
          </div>
          <div>
            <div class="chat-title-text">Company Chatbox</div>
            <div class="chat-subtitle-text">
              <span class="chat-online-dot" style="background:${isOnline ? '#10b981' : '#f59e0b'}"></span>
              <span>${isOnline ? 'Active Connection' : 'Offline Engine'}</span>
              <span>•</span>
              <span style="color:#818cf8;font-weight:600">Enterprise HRM</span>
            </div>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="chat-btn-ctrl" onclick="Chat.toggleMinimize(event)" title="Minimize">
            <i class="fa fa-minus"></i>
          </button>
          <button class="chat-btn-ctrl" id="chat-max-btn" onclick="Chat.toggleMaximize(event)" title="${this.isMaximized ? 'Restore' : 'Maximize'}">
            <i class="fa ${this.isMaximized ? 'fa-compress' : 'fa-expand'}"></i>
          </button>
          <button class="chat-btn-ctrl" onclick="Chat.closeDrawer()" title="Close">
            <i class="fa fa-xmark" style="font-size:15px"></i>
          </button>
        </div>
      </div>
    `;

    // 2. Navigation Tabs Bar
    const tabsHTML = `
      <div class="chat-tabs-bar">
        <button class="chat-tab-item ${this.activeTab === 'chats' ? 'active' : ''}" onclick="Chat.switchTab('chats')">
          <i class="fa fa-comment-dots"></i>
          <span>Chats</span>
          <span id="chat-tab-unread-badge" class="chat-tab-badge" style="display:${totalUnreads > 0 ? 'inline-block' : 'none'}">${totalUnreads > 9 ? '9+' : totalUnreads}</span>
        </button>
        <button class="chat-tab-item ${this.activeTab === 'colleagues' ? 'active' : ''}" onclick="Chat.switchTab('colleagues')">
          <i class="fa fa-users"></i>
          <span>All Colleagues</span>
        </button>
        <button class="chat-tab-item ${this.activeTab === 'channels' ? 'active' : ''}" onclick="Chat.switchTab('channels')">
          <i class="fa fa-hashtag"></i>
          <span>Channels</span>
        </button>
      </div>
    `;

    // 3. Username Search Bar with Autocomplete Popover
    const searchHTML = `
      <div class="chat-username-search-wrap">
        <div class="chat-search-input-box">
          <span class="chat-search-prefix">@</span>
          <input 
            type="text" 
            id="chat-username-input" 
            class="chat-username-input" 
            placeholder="Search colleague by login username (e.g. sara.malik, admin)…" 
            autocomplete="off"
            oninput="Chat.searchColleaguesByUsername(this.value)">
          <i class="fa fa-times chat-search-clear" onclick="Chat.clearSearchInput()" title="Clear"></i>
        </div>
        <div id="chat-username-autocomplete" class="chat-username-autocomplete" style="display:none"></div>
      </div>
    `;

    // 4. Content Area: Either Conversation View or Tab List
    let contentHTML = '';

    if (this.viewMode === 'convo' && channel) {
      contentHTML = this.renderConvoViewHTML(channel);
    } else {
      contentHTML = `
        <div class="chat-scroll-area">
          ${this.activeTab === 'chats' ? this.renderRecentChatsListHTML() : ''}
          ${this.activeTab === 'colleagues' ? this.renderColleaguesDirectoryHTML() : ''}
          ${this.activeTab === 'channels' ? this.renderChannelsListHTML() : ''}
        </div>
      `;
    }

    drawer.innerHTML = `
      ${headerHTML}
      ${tabsHTML}
      ${searchHTML}
      ${contentHTML}
    `;

    if (this.viewMode === 'convo' && channel) {
      this.renderMessagesStream();
      this.renderTypingBar();
    }
  },

  // ── 9. Conversation View HTML ─────────────────────────────
  renderConvoViewHTML(channel) {
    const isDirect = channel.type === 'direct';
    const isTargetOnline = isDirect && typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(channel.targetEmpId);

    return `
      <div class="chat-convo-wrapper">
        <!-- Convo Header with Back Button -->
        <div class="chat-convo-header">
          <div class="chat-convo-header-left">
            <button class="chat-convo-back-btn" onclick="Chat.backToList()" title="Back to Chats / Directory">
              <i class="fa fa-arrow-left"></i>
            </button>
            <div style="position:relative">
              <div class="chat-msg-avatar" style="background:${isDirect ? '#4f46e5' : '#059669'}">
                <i class="fa ${isDirect ? 'fa-user' : (channel.avatar || 'fa-hashtag')}"></i>
              </div>
              ${isDirect ? `<span class="chat-status-dot ${isTargetOnline ? 'online' : 'offline'}" style="bottom:-2px;right:-2px"></span>` : ''}
            </div>
            <div>
              <div class="chat-convo-title">
                ${channel.name}
                ${channel.scope === 'all_company' ? '<span class="badge badge-primary" style="font-size:9.5px;padding:1px 5px;margin-left:5px">All Hands</span>' : ''}
              </div>
              <div class="chat-convo-sub">
                ${isDirect 
                  ? (isTargetOnline ? '<span style="color:#10b981;font-weight:600">🟢 Active Now</span>' : '<span style="color:var(--text-3)">⚪ Offline</span>')
                  : `<span style="color:var(--text-3)"><i class="fa fa-users" style="font-size:10px"></i> ${(channel.members ? channel.members.length : 1)} members</span>`}
                <span>•</span>
                <span>${channel.companyName || 'Apex Holdings'}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <button class="chat-btn-ctrl" onclick="Chat.showChannelMembersModal('${channel.id}')" title="Members Details">
              <i class="fa fa-circle-info"></i>
            </button>
          </div>
        </div>

        <!-- Messages Container Stream -->
        <div class="chat-messages-container" id="chat-messages-stream"></div>

        <!-- Ephemeral Typing Indicator -->
        <div class="chat-typing-bar" id="chat-typing-bar" style="display:none"></div>

        <!-- Input Box -->
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <button class="chat-btn-attach" onclick="document.getElementById('chat-file-picker').click()" title="Share File/Document (up to 10MB)">
              <i class="fa fa-paperclip"></i>
            </button>
            <input type="file" id="chat-file-picker" style="display:none" onchange="Chat.handleFileUpload(this)">
            <textarea 
              id="chat-input-text" 
              rows="1" 
              class="chat-input-field"
              placeholder="Message ${isDirect ? '@' + channel.name : '#' + channel.name}… (Enter to send, Shift+Enter for newline)"
              onkeydown="Chat.onInputTyping(event)"
              oninput="this.style.height='auto';this.style.height=Math.min(120, this.scrollHeight)+'px'"></textarea>
            <button class="chat-btn-send" onclick="Chat.sendMessage()" title="Send Message">
              <i class="fa fa-paper-plane"></i>
            </button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px 0;font-size:10.5px;color:var(--text-3)">
            <span><i class="fa fa-shield-halved" style="font-size:9.5px;margin-right:3px"></i> Enterprise Protected</span>
            <span>Press <strong>Enter</strong> to send</span>
          </div>
        </div>
      </div>
    `;
  },

  // ── 10. Tab Views: Chats, Directory, & Channels ───────────
  renderRecentChatsListHTML() {
    const channels = this.getChannels();
    const directChats = channels.filter(c => c.type === 'direct');
    const groupChannels = channels.filter(c => c.type !== 'direct');

    let html = '';

    // Direct Messages Section
    html += `<div class="chat-section-title">Direct Messages (${directChats.length})</div>`;
    if (directChats.length === 0) {
      html += `
        <div style="padding:14px;background:var(--surface);border-radius:10px;text-align:center;color:var(--text-3);font-size:12px;margin-bottom:8px">
          <i class="fa fa-user-plus" style="font-size:18px;margin-bottom:6px;display:block;color:#818cf8"></i>
          No 1-on-1 conversations yet. Search any colleague above by their login username or browse "All Colleagues".
        </div>
      `;
    } else {
      directChats.forEach(c => {
        const isActive = c.id === this.activeChannelId;
        const unread = this.unreadCounts[c.id] || 0;
        const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(c.targetEmpId);

        html += `
          <div class="chat-item-card ${isActive ? 'active' : ''}" onclick="Chat.openChannel('${c.id}')">
            <div class="chat-item-left">
              <div style="position:relative">
                <div class="chat-msg-avatar" style="background:#4f46e5">
                  <i class="fa fa-user"></i>
                </div>
                <span class="chat-status-dot ${isOnline ? 'online' : 'offline'}" style="bottom:-2px;right:-2px"></span>
              </div>
              <div class="chat-item-text">
                <div class="chat-item-title">${c.name}</div>
                <div class="chat-item-subtitle">${c.targetEmpRole || 'Colleague'} • ${isOnline ? '🟢 Online' : '⚪ Offline'}</div>
              </div>
            </div>
            ${unread > 0 ? `<span class="chat-item-badge">${unread}</span>` : ''}
          </div>
        `;
      });
    }

    // Channels Section
    html += `<div class="chat-section-title" style="margin-top:8px">Workspaces & Channels (${groupChannels.length})</div>`;
    groupChannels.forEach(c => {
      const isActive = c.id === this.activeChannelId;
      const unread = this.unreadCounts[c.id] || 0;

      html += `
        <div class="chat-item-card ${isActive ? 'active' : ''}" onclick="Chat.openChannel('${c.id}')">
          <div class="chat-item-left">
            <div class="chat-msg-avatar" style="background:${c.type === 'cross_company' ? '#8b5cf6' : '#059669'}">
              <i class="fa ${c.avatar || 'fa-hashtag'}"></i>
            </div>
            <div class="chat-item-text">
              <div class="chat-item-title">${c.name}</div>
              <div class="chat-item-subtitle">${c.companyName || 'Company'} • ${(c.members ? c.members.length : 1)} members</div>
            </div>
          </div>
          ${unread > 0 ? `<span class="chat-item-badge">${unread}</span>` : ''}
        </div>
      `;
    });

    return html;
  },

  renderColleaguesDirectoryHTML() {
    const colleagues = this.getAllCompanyMembers();
    const otherMembers = colleagues.filter(m => !m.isSelf);

    let html = `
      <div class="chat-section-title">All Company Members (${otherMembers.length})</div>
      <div class="chat-directory-list">
    `;

    otherMembers.forEach(m => {
      const initials = typeof Utils !== 'undefined' && Utils.avatarInitials 
        ? Utils.avatarInitials(m.fullName) 
        : m.fullName.substring(0, 2).toUpperCase();
      const color = typeof Utils !== 'undefined' && Utils.avatarColor 
        ? Utils.avatarColor(m.empId) 
        : '#6366f1';

      html += `
        <div class="chat-directory-card">
          <div class="chat-item-left">
            <div style="position:relative">
              <div class="chat-msg-avatar" style="background:${color}">
                ${initials}
              </div>
              <span class="chat-status-dot ${m.isOnline ? 'online' : 'offline'}" style="bottom:-2px;right:-2px"></span>
            </div>
            <div class="chat-item-text">
              <div class="chat-item-title">${m.fullName}</div>
              <div style="font-size:11px;color:#818cf8;font-weight:600">@${m.username}</div>
              <div class="chat-item-subtitle">${m.designation} • ${m.department}</div>
            </div>
          </div>
          <button class="chat-directory-btn" onclick="Chat.startDirectChat(${m.empId})">
            <i class="fa fa-comment-dots"></i> Message
          </button>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  },

  renderChannelsListHTML() {
    const channels = this.getChannels().filter(c => c.type !== 'direct');

    let html = `
      <div class="chat-section-title">Team Channels (${channels.length})</div>
      <div class="chat-directory-list">
    `;

    channels.forEach(c => {
      const isActive = c.id === this.activeChannelId;
      const unread = this.unreadCounts[c.id] || 0;

      html += `
        <div class="chat-directory-card ${isActive ? 'active' : ''}">
          <div class="chat-item-left">
            <div class="chat-msg-avatar" style="background:${c.type === 'cross_company' ? '#8b5cf6' : '#059669'}">
              <i class="fa ${c.avatar || 'fa-hashtag'}"></i>
            </div>
            <div class="chat-item-text">
              <div class="chat-item-title">${c.name}</div>
              <div class="chat-item-subtitle">${c.description || 'Channel workspace'}</div>
              <div style="font-size:10px;color:var(--text-3);margin-top:2px">
                <i class="fa fa-users" style="font-size:9.5px"></i> ${(c.members ? c.members.length : 1)} members • ${c.companyName || 'Apex Holdings'}
              </div>
            </div>
          </div>
          <button class="chat-directory-btn" onclick="Chat.openChannel('${c.id}')">
            ${unread > 0 ? `<span class="chat-tab-badge" style="margin-right:4px">${unread}</span>` : ''}
            Join
          </button>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  },

  renderChannelList(filterText = '') {
    this.renderDrawer();
  },

  filterChannels(val) {
    this.searchColleaguesByUsername(val);
  },

  updatePresenceUI() {
    if (this.isOpen) {
      if (this.viewMode === 'convo') {
        const channel = this.getActiveChannel();
        if (channel && channel.type === 'direct') {
          const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(channel.targetEmpId);
          const sub = document.querySelector('.chat-convo-sub');
          if (sub) {
            sub.innerHTML = `
              ${isOnline ? '<span style="color:#10b981;font-weight:600">🟢 Active Now</span>' : '<span style="color:var(--text-3)">⚪ Offline</span>'}
              <span>•</span>
              <span>${channel.companyName || 'Apex Holdings'}</span>
            `;
          }
        }
      } else {
        this.renderDrawer();
      }
    }
  },

  // ── 11. Messages Stream Rendering ─────────────────────────
  renderMessagesStream() {
    if (typeof document === 'undefined') return;
    const stream = document.getElementById('chat-messages-stream');
    if (!stream) return;

    const messages = this.getMessages(this.activeChannelId);
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;

    if (messages.length === 0) {
      stream.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-3);padding:30px;text-align:center">
          <div style="width:50px;height:50px;border-radius:50%;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;color:#818cf8;font-size:22px;margin-bottom:12px">
            <i class="fa fa-comments"></i>
          </div>
          <h4 style="margin:0 0 6px 0;color:var(--text);font-size:14.5px">Direct HRM Chat</h4>
          <p style="margin:0;font-size:12px;max-width:260px">Send messages, documents or notes instantly within your enterprise network.</p>
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
        <div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}" data-msg-id="${msg.id}">
          ${!isMe ? `
            <div class="chat-msg-avatar" style="background:${typeof Utils !== 'undefined' ? Utils.avatarColor(msg.senderId) : '#6366f1'}">
              ${typeof Utils !== 'undefined' ? Utils.avatarInitials(msg.senderName) : msg.senderName.substring(0,2).toUpperCase()}
            </div>
          ` : ''}
          <div class="chat-msg-bubble-wrap">
            ${!isMe ? `
              <div class="chat-msg-sender-meta">
                <span style="font-weight:700;color:var(--text)">${msg.senderName}</span>
                <span style="color:var(--text-3)">${msg.senderRole || ''}</span>
              </div>
            ` : ''}
            <div class="chat-bubble">
              <div class="chat-msg-text">${this.formatMessageText(msg.content)}</div>
              ${this.renderAttachmentsHTML(msg.attachments)}
              <div class="chat-msg-time">${timeStr} ${isMe ? '<i class="fa fa-check-double" style="font-size:9.5px;margin-left:3px;color:#93c5fd"></i>' : ''}</div>
            </div>
            <div class="chat-reactions-container">${this.renderReactionsHTML(msg.id, msg.reactions)}</div>
          </div>
        </div>
      `;
    });

    stream.innerHTML = html;
    this.scrollToBottom();
  },

  appendMessageToDOM(msg) {
    if (typeof document === 'undefined') return;
    const stream = document.getElementById('chat-messages-stream');
    if (!stream) return;

    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;
    const isMe = msg.senderId === myId;
    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const row = document.createElement('div');
    row.className = `chat-msg-row ${isMe ? 'outgoing' : 'incoming'} new-message-anim`;
    row.setAttribute('data-msg-id', msg.id);
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
            <span style="color:var(--text-3)">${msg.senderRole || ''}</span>
          </div>
        ` : ''}
        <div class="chat-bubble">
          <div class="chat-msg-text">${this.formatMessageText(msg.content)}</div>
          ${this.renderAttachmentsHTML(msg.attachments)}
          <div class="chat-msg-time">${timeStr} ${isMe ? '<i class="fa fa-check-double" style="font-size:9.5px;margin-left:3px;color:#93c5fd"></i>' : ''}</div>
        </div>
        <div class="chat-reactions-container">${this.renderReactionsHTML(msg.id, msg.reactions)}</div>
      </div>
    `;

    stream.appendChild(row);
  },

  // ── 12. Emoji Reactions ───────────────────────────────────
  renderReactionsHTML(msgId, reactions = {}) {
    const emojis = Object.keys(reactions || {});
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;
    let html = '<div class="chat-reactions-row">';
    emojis.forEach(emoji => {
      const users = reactions[emoji] || [];
      if (!users.length) return;
      const reacted = users.includes(myId);
      html += `<span class="chat-reaction-tag ${reacted ? 'reacted' : ''}" onclick="Chat.toggleReaction('${msgId}', '${emoji}')" title="${users.length} reaction${users.length > 1 ? 's' : ''}">${emoji} <span>${users.length}</span></span>`;
    });
    html += `<span class="chat-reaction-tag" style="opacity:0.6;font-size:9.5px;cursor:pointer" onclick="Chat.showReactionPicker('${msgId}', this)" title="Add Reaction">➕</span></div>`;
    return html;
  },

  showReactionPicker(msgId, triggerEl) {
    if (typeof document === 'undefined') return;
    const existing = document.querySelector('.chat-reaction-popover');
    if (existing) existing.remove();

    const commonEmojis = ['👍', '❤️', '🎉', '🔥', '👏', '✅'];
    const popover = document.createElement('div');
    popover.className = 'chat-reaction-popover';
    popover.style.cssText = 'position:fixed;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:5px 9px;display:flex;gap:7px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:9999;font-size:17px;cursor:pointer;';
    popover.innerHTML = commonEmojis.map(e => `<span style="transition:transform 0.12s;display:inline-block;padding:2px" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'" onclick="Chat.toggleReaction('${msgId}', '${e}'); this.parentElement.remove();">${e}</span>`).join('');

    document.body.appendChild(popover);
    const rect = triggerEl.getBoundingClientRect();
    popover.style.top = `${Math.max(10, rect.top - 42)}px`;
    popover.style.left = `${Math.max(10, rect.left - 50)}px`;

    const closePopover = (ev) => {
      if (!popover.contains(ev.target) && ev.target !== triggerEl) {
        popover.remove();
        document.removeEventListener('click', closePopover);
      }
    };
    setTimeout(() => document.addEventListener('click', closePopover), 50);
  },

  toggleReaction(msgId, emoji) {
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;
    const chanId = this.activeChannelId;

    if (typeof DB !== 'undefined') {
      const allMsgs = DB.get('chat_messages') || [];
      const msg = allMsgs.find(m => m.id === msgId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
        const idx = msg.reactions[emoji].indexOf(myId);
        if (idx > -1) {
          msg.reactions[emoji].splice(idx, 1);
          if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
        } else {
          msg.reactions[emoji].push(myId);
        }
        DB.set('chat_messages', allMsgs);
        this.handleReactionUpdate({ messageId: msgId, channelId: chanId, reactions: msg.reactions });
      }
    }

    if (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isConnected) {
      HRMWebSocket.sendReaction(msgId, chanId, emoji);
    }

    if (typeof API !== 'undefined' && API.request) {
      API.request(`/chat/messages/${msgId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ userId: myId, emoji })
      }).catch(() => {});
    }
  },

  handleReactionUpdate(payload) {
    if (!payload || !payload.messageId) return;
    if (typeof DB !== 'undefined') {
      const allMsgs = DB.get('chat_messages') || [];
      const msg = allMsgs.find(m => m.id === payload.messageId);
      if (msg) {
        msg.reactions = payload.reactions || {};
        DB.set('chat_messages', allMsgs);
      }
    }
    if (typeof document !== 'undefined') {
      const container = document.querySelector(`[data-msg-id="${payload.messageId}"] .chat-reactions-container`);
      if (container) {
        container.innerHTML = this.renderReactionsHTML(payload.messageId, payload.reactions || {});
      }
    }
  },

  // ── 13. File Sharing & Attachments ────────────────────────
  formatMessageText(text) {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

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
            <a href="${att.fileUrl || '#'}" download="${att.fileName}" class="chat-attachment-card" title="Click to download ${att.fileName}">
              <i class="fa ${icon} chat-attachment-icon"></i>
              <div style="flex:1;overflow:hidden">
                <div class="chat-attachment-name">${att.fileName}</div>
                <div class="chat-attachment-size">${sizeKb} • Click to download</div>
              </div>
              <i class="fa fa-download" style="font-size:12px;opacity:0.7"></i>
            </a>
          `;
        }).join('')}
      </div>
    `;
  },

  handleFileUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    const maxBytes = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxBytes) {
      if (typeof Toast !== 'undefined') {
        Toast.show(`File size (${(file.size / (1024*1024)).toFixed(2)}MB) exceeds 10MB limit.`, 'error');
      }
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const myEmp = (typeof Auth !== 'undefined' && Auth?.employee) || { id: 1, fullName: 'Admin User', designation: 'Staff' };
      const channel = this.getActiveChannel();
      if (!channel) return;

      const newMsg = {
        id: `msg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        channelId: channel.id,
        senderId: myEmp.id,
        senderName: myEmp.fullName,
        senderRole: (typeof Auth !== 'undefined' && Auth?.role) 
          ? Auth.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) 
          : 'Staff',
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

      if (typeof DB !== 'undefined') {
        const allMsgs = DB.get('chat_messages') || [];
        allMsgs.push(newMsg);
        DB.set('chat_messages', allMsgs);
      }

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
    if (typeof document === 'undefined') return;
    const stream = document.getElementById('chat-messages-stream');
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  },

  showChannelMembersModal(channelId) {
    const channel = this.getChannels().find(c => c.id === channelId);
    if (!channel) return;

    const employees = (typeof DB !== 'undefined' && DB.get('employees')) || [];
    const members = (channel.members || []).map(id => employees.find(e => e.id === id)).filter(Boolean);

    const content = `
      <div style="padding:10px">
        <div style="margin-bottom:14px">
          <h4 style="margin:0 0 4px 0">${channel.name}</h4>
          <p style="margin:0;font-size:12px;color:var(--text-3)">${channel.description || 'Channel Member Directory'}</p>
        </div>
        <div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
          ${members.map(m => {
            const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(m.id);
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surface);border-radius:8px">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="position:relative">
                    <div class="avatar avatar-sm" style="background:${typeof Utils !== 'undefined' ? Utils.avatarColor(m.id) : '#6366f1'}">
                      ${typeof Utils !== 'undefined' ? Utils.avatarInitials(m.fullName) : m.fullName.substring(0,2)}
                    </div>
                    <span class="chat-status-dot ${isOnline ? 'online' : 'offline'}" style="bottom:-2px;right:-2px"></span>
                  </div>
                  <div>
                    <div style="font-size:13px;font-weight:700;color:var(--text)">${m.fullName}</div>
                    <div style="font-size:11px;color:var(--text-3)">${m.designation || 'Staff'} • ${m.department || 'General'}</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="badge ${isOnline ? 'badge-success' : 'badge-ghost'}" style="font-size:10px">
                    ${isOnline ? 'Online' : 'Offline'}
                  </span>
                  <button class="btn btn-primary btn-xs" onclick="Chat.startDirectChat(${m.id}); if (typeof Modal !== 'undefined') Modal.close();">
                    Message
                  </button>
                </div>
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

if (typeof window !== 'undefined') {
  window.Chat = Chat;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Chat;
}
