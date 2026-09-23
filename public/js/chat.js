// ============================================================
// HRM SYSTEM — Microsoft Teams-Style Enterprise Chat Engine
// Instant Team Messaging, Colleague Username Search & File Sharing
// ============================================================

const Chat = {
  isOpen: false,
  isMinimized: false,
  isMaximized: false,
  activeFilter: 'all', // 'all' | 'unread' | 'colleagues' | 'channels'
  activeChannelId: 'chan-wajiha',
  collapsedSections: { favorites: false, chats: false, colleagues: false },
  unreadCounts: {},
  typingTimeout: null,
  typingUsers: {}, // channelId -> Set of names
  audioCtx: null,

  init() {
    this.ensureTeamsSeedData();
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

    // Keyboard shortcut: Ctrl+M / Cmd+M opens chat
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm' && !e.shiftKey) {
          e.preventDefault();
          this.toggleDrawer();
        }
      });
    }

    console.log('%c💬 Microsoft Teams-Style Collaboration Hub initialized', 'color:#464eb8;font-weight:700');
  },

  // ── 1. Seed Realistic Teams Conversations ──────────────────
  ensureTeamsSeedData() {
    if (typeof DB === 'undefined') return;

    let channels = DB.get('chat_channels') || [];
    let messages = DB.get('chat_messages') || [];

    const teamsSeedChannels = [
      {
        id: 'chan-wajiha',
        name: 'Wajiha Mazhar',
        username: 'wajiha.mazhar',
        avatar: 'WM',
        avatarBg: '#d97706',
        type: 'direct',
        isFavorite: false,
        time: '6:36 PM',
        lastMessage: 'ya kia baat hoi',
        targetEmpId: 101,
        targetEmpRole: 'Product Designer',
        members: [1, 101]
      },
      {
        id: 'chan-ghulam',
        name: 'Ghulam Mustafa',
        username: 'ghulam.mustafa',
        avatar: 'GM',
        avatarBg: '#0f766e',
        type: 'direct',
        isFavorite: true,
        time: '4:43 PM',
        lastMessage: 'You: https://www.youtube...',
        targetEmpId: 102,
        targetEmpRole: 'Senior Analyst',
        members: [1, 102]
      },
      {
        id: 'chan-cmit',
        name: 'CMIT Internship Group',
        username: 'cmit.interns',
        avatar: 'CI',
        avatarBg: '#2563eb',
        type: 'group',
        isFavorite: false,
        time: '6:24 PM',
        lastMessage: 'Wajiha: W.slam',
        targetEmpId: null,
        targetEmpRole: 'Engineering Cohort',
        members: [1, 2, 3, 101]
      },
      {
        id: 'chan-humna',
        name: 'Humna Ishfaq',
        username: 'humna.ishfaq',
        avatar: 'HI',
        avatarBg: '#475569',
        type: 'direct',
        isFavorite: false,
        time: '6:08 PM',
        lastMessage: 'You: ok',
        targetEmpId: 103,
        targetEmpRole: 'QA Engineer',
        members: [1, 103]
      },
      {
        id: 'chan-prisha',
        name: 'Prisha Ahmad',
        username: 'prisha.ahmad',
        avatar: 'PA',
        avatarBg: '#059669',
        type: 'direct',
        isFavorite: false,
        time: '6:05 PM',
        lastMessage: 'Sure Sir',
        targetEmpId: 104,
        targetEmpRole: 'HR Executive',
        members: [1, 104]
      },
      {
        id: 'chan-mazhar',
        name: 'Mazhar Hussain',
        username: 'mazhar.hussain',
        avatar: 'MH',
        avatarBg: '#b91c1c',
        type: 'direct',
        isFavorite: false,
        time: '5:44 PM',
        lastMessage: 'You: ok',
        targetEmpId: 105,
        targetEmpRole: 'Operations Manager',
        members: [1, 105]
      },
      {
        id: 'chan-sara',
        name: 'Sara Malik',
        username: 'sara.malik',
        avatar: 'SM',
        avatarBg: '#6366f1',
        type: 'direct',
        isFavorite: true,
        time: '5:15 PM',
        lastMessage: 'Here is the approved Q4 salary matrix and policy.',
        targetEmpId: 2,
        targetEmpRole: 'HR Director',
        members: [1, 2]
      },
      {
        id: 'chan-usman',
        name: 'Usman Baig',
        username: 'usman.baig',
        avatar: 'UB',
        avatarBg: '#14b8a6',
        type: 'direct',
        isFavorite: false,
        time: '3:20 PM',
        lastMessage: 'All engineering sprint tasks are synchronized.',
        targetEmpId: 3,
        targetEmpRole: 'Engineering Lead',
        members: [1, 3]
      },
      {
        id: 'chan-1',
        name: 'All-Hands & Announcements',
        username: 'announcements',
        avatar: 'fa-bullhorn',
        avatarBg: '#464eb8',
        type: 'group',
        isFavorite: false,
        time: '2:00 PM',
        lastMessage: 'Ahmed Khan: Welcome to the unified HRM Workspace!',
        targetEmpId: null,
        targetEmpRole: 'Apex Holdings Inc.',
        members: [1, 2, 3, 4, 5, 26]
      }
    ];

    // Merge seed channels if missing
    teamsSeedChannels.forEach(seed => {
      const exists = channels.find(c => c.id === seed.id || (c.type === 'direct' && c.targetEmpId === seed.targetEmpId));
      if (!exists) {
        channels.push(seed);
      }
    });
    DB.set('chat_channels', channels);

    // Initial message history for chan-wajiha
    if (!messages.some(m => m.channelId === 'chan-wajiha')) {
      messages.push(
        {
          id: 'msg-w-1',
          channelId: 'chan-wajiha',
          senderId: 1,
          senderName: 'Ahmed Khan',
          content: 'Assalam o alaikum Wajiha, did you review the revised UI mockups for the attendance portal?',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'msg-w-2',
          channelId: 'chan-wajiha',
          senderId: 101,
          senderName: 'Wajiha Mazhar',
          content: 'W.slam Sir! Yes, I checked the color contrast and layout cards.',
          createdAt: new Date(Date.now() - 2400000).toISOString()
        },
        {
          id: 'msg-w-3',
          channelId: 'chan-wajiha',
          senderId: 101,
          senderName: 'Wajiha Mazhar',
          content: 'ya kia baat hoi',
          createdAt: new Date(Date.now() - 600000).toISOString()
        }
      );
      DB.set('chat_messages', messages);
    }
  },

  // ── 2. Web Audio Synthesizer ──────────────────────────────
  initAudio() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
    } catch (e) {}
  },

  playMessageSound(type = 'incoming') {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx && AudioCtxClass) this.audioCtx = new AudioCtxClass();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (type === 'incoming') {
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      } else {
        osc.frequency.setValueAtTime(440.0, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (err) {}
  },

  // ── 3. Unread Badges ──────────────────────────────────────
  calculateInitialUnreads() {
    this.unreadCounts['chan-wajiha'] = 1;
    this.updateBadges();
  },

  getTotalUnreadCount() {
    return Object.values(this.unreadCounts).reduce((sum, count) => sum + (count || 0), 0);
  },

  updateBadges() {
    if (typeof document === 'undefined') return;
    const total = this.getTotalUnreadCount();

    const floatBadge = document.getElementById('chat-floating-badge');
    if (floatBadge) {
      if (total > 0) {
        floatBadge.textContent = total > 9 ? '9+' : total;
        floatBadge.style.display = 'flex';
      } else {
        floatBadge.style.display = 'none';
      }
    }

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
    if (dot) dot.style.display = total > 0 ? 'block' : 'none';
  },

  updateTopbarBadge() {
    this.updateBadges();
  },

  // ── 4. Colleague Directory & Username Resolution ──────────
  getAllCompanyMembers() {
    if (typeof DB === 'undefined') return [];
    const employees = DB.get('employees') || [];
    const users = DB.get('users') || [];
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;

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

  getChannels() {
    if (typeof DB === 'undefined') return [];
    let channels = DB.get('chat_channels');
    if (!channels || !channels.length) {
      this.ensureTeamsSeedData();
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

  // ── 5. New Chat & Autocomplete Modal ──────────────────────
  startNewChat() {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('teams-filter-input');
    if (input) {
      input.value = '@';
      input.focus();
      this.filterRoster('@');
    }
  },

  filterRoster(query) {
    if (typeof document === 'undefined') return;
    const cleanQuery = (query || '').toLowerCase().trim();
    const dropdown = document.getElementById('teams-username-dropdown');

    // If starts with @, show username autocomplete
    if (cleanQuery.startsWith('@')) {
      const handle = cleanQuery.replace(/^@/, '');
      const members = this.getAllCompanyMembers();
      const matches = members.filter(m => 
        !m.isSelf && (
          m.username.toLowerCase().includes(handle) ||
          m.fullName.toLowerCase().includes(handle) ||
          m.designation.toLowerCase().includes(handle)
        )
      ).slice(0, 8);

      if (dropdown) {
        if (matches.length === 0) {
          dropdown.innerHTML = `<div style="padding:10px 14px;color:var(--text-3);font-size:12px">No colleague found with login username "@${handle}"</div>`;
        } else {
          dropdown.innerHTML = `
            <div style="padding:6px 12px;font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase">Add / Message Colleague by @username</div>
            ${matches.map(m => `
              <div class="teams-chat-card" onclick="Chat.startDirectChat(${m.empId}); Chat.closeDropdown();" style="border-radius:6px;margin:2px">
                <div class="teams-avatar-wrap" style="background:${typeof Utils !== 'undefined' ? Utils.avatarColor(m.empId) : '#6366f1'}">
                  ${typeof Utils !== 'undefined' ? Utils.avatarInitials(m.fullName) : m.fullName.substring(0,2)}
                  <span class="teams-presence-badge ${m.isOnline ? 'online' : 'offline'}"></span>
                </div>
                <div class="teams-card-info">
                  <div class="teams-card-top">
                    <span class="teams-card-name">${m.fullName}</span>
                    <span style="font-size:11px;color:#464eb8;font-weight:700">@${m.username}</span>
                  </div>
                  <div class="teams-card-preview">${m.designation} • ${m.department}</div>
                </div>
              </div>
            `).join('')}
          `;
        }
        dropdown.style.display = 'block';
      }
      return;
    }

    if (dropdown) dropdown.style.display = 'none';
    this.renderRosterList(cleanQuery);
  },

  closeDropdown() {
    const dropdown = document.getElementById('teams-username-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    const input = document.getElementById('teams-filter-input');
    if (input) input.value = '';
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

    const channels = (typeof DB !== 'undefined' && DB.get('chat_channels')) || [];
    let dmChannel = channels.find(c => 
      c.type === 'direct' && 
      Array.isArray(c.members) && 
      c.members.includes(myId) && 
      c.members.includes(targetEmpId)
    );

    if (!dmChannel) {
      const username = targetEmp.email ? targetEmp.email.split('@')[0] : targetEmp.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      dmChannel = {
        id: `dm-${Math.min(myId, targetEmpId)}-${Math.max(myId, targetEmpId)}`,
        name: targetEmp.fullName,
        username: username,
        type: 'direct',
        isFavorite: false,
        time: 'Just now',
        lastMessage: 'Started new direct conversation',
        targetEmpId: targetEmpId,
        targetEmpRole: targetEmp.designation || 'Staff',
        companyName: targetEmp.companyName || myEmp.companyName || 'Apex Holdings',
        avatar: typeof Utils !== 'undefined' ? Utils.avatarInitials(targetEmp.fullName) : targetEmp.fullName.substring(0,2),
        avatarBg: typeof Utils !== 'undefined' ? Utils.avatarColor(targetEmpId) : '#464eb8',
        members: [myId, targetEmpId]
      };
      channels.unshift(dmChannel);
      if (typeof DB !== 'undefined') DB.set('chat_channels', channels);
    }

    this.activeChannelId = dmChannel.id;
    this.viewMode = 'convo';
    this.closeDropdown();
    this.openChannel(dmChannel.id);
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

    // Refresh active state in roster
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.teams-chat-card').forEach(el => {
        el.classList.toggle('active', el.dataset.channelId === channelId);
      });
      this.renderConversationPanel();
      setTimeout(() => this.scrollToBottom(), 50);
    }
  },

  setFilter(filterName) {
    this.activeFilter = filterName;
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.teams-pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filterName);
      });
      this.renderRosterList();
    }
  },

  toggleSection(sectionKey) {
    this.collapsedSections[sectionKey] = !this.collapsedSections[sectionKey];
    this.renderRosterList();
  },

  // ── 6. Drawer & Full Workspace Views ──────────────────────
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
      this.renderWorkspace(drawer, false);
    }
  },

  closeDrawer() {
    if (typeof document === 'undefined') return;
    this.isOpen = false;
    this.isMinimized = false;

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
    drawer.classList.toggle('minimized', this.isMinimized);
  },

  toggleMaximize(e) {
    if (e) e.stopPropagation();
    if (typeof document === 'undefined') return;
    const drawer = document.getElementById('chat-drawer');
    if (!drawer) return;

    this.isMaximized = !this.isMaximized;
    drawer.classList.toggle('maximized', this.isMaximized);
  },

  renderFullWorkspace() {
    const content = document.getElementById('page-content');
    if (!content) return;
    this.renderWorkspace(content, true);
  },

  // ── 7. Core Microsoft Teams UI Renderer ───────────────────
  renderWorkspace(container, isFullScreen = false) {
    if (!container) return;

    container.innerHTML = `
      <div class="teams-wrapper ${isFullScreen ? 'teams-fullscreen' : 'teams-widget'}">
        <!-- 1. Left Vertical App Rail -->
        <div class="teams-app-rail">
          <div class="teams-rail-logo" title="Microsoft Teams for HRM Pro">
            <i class="fa fa-users-viewfinder"></i>
          </div>
          <button class="teams-rail-btn active" title="Chat" onclick="Chat.setFilter('all')">
            <i class="fa fa-comment-dots"></i>
          </button>
          <button class="teams-rail-btn" title="All Colleagues" onclick="Chat.setFilter('colleagues')">
            <i class="fa fa-address-book"></i>
          </button>
          <button class="teams-rail-btn" title="Channels & Teams" onclick="Chat.setFilter('channels')">
            <i class="fa fa-people-group"></i>
          </button>
          <button class="teams-rail-btn" title="Meet Now" onclick="Chat.startMeetNow()">
            <i class="fa fa-video"></i>
          </button>
          <button class="teams-rail-btn" title="Activity" onclick="if (typeof App !== 'undefined') App.toggleNotifications();">
            <i class="fa fa-bell"></i>
          </button>
        </div>

        <!-- 2. Middle Chat List Column -->
        <div class="teams-list-column">
          <!-- Header -->
          <div class="teams-list-header">
            <div class="teams-list-title">Chat</div>
            <div class="teams-header-actions">
              <button class="teams-action-icon-btn" onclick="document.getElementById('teams-filter-input').focus()" title="Search / Filter">
                <i class="fa fa-search"></i>
              </button>
              <button class="teams-action-icon-btn" onclick="Chat.startMeetNow()" title="Meet">
                <i class="fa fa-video"></i>
              </button>
              <button class="teams-action-icon-btn" onclick="Chat.startNewChat()" title="New Chat (Enter @username)">
                <i class="fa fa-pen-to-square"></i>
              </button>
              ${!isFullScreen ? `
                <button class="teams-action-icon-btn" onclick="Chat.toggleMaximize(event)" title="Maximize / Restore">
                  <i class="fa ${this.isMaximized ? 'fa-compress' : 'fa-expand'}"></i>
                </button>
                <button class="teams-action-icon-btn" onclick="Chat.closeDrawer()" title="Close">
                  <i class="fa fa-xmark"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Search / Filter Input Box -->
          <div class="teams-filter-wrap" style="position:relative">
            <div class="teams-filter-input-box">
              <input 
                type="text" 
                id="teams-filter-input" 
                class="teams-filter-input" 
                placeholder="Filter by person or chat name (type @ for username)…"
                autocomplete="off"
                oninput="Chat.filterRoster(this.value)">
              <i class="fa fa-times" style="font-size:11px;color:#8c8c8c;cursor:pointer" onclick="Chat.closeDropdown()" title="Clear"></i>
            </div>
            <!-- Live @username autocomplete dropdown -->
            <div id="teams-username-dropdown" class="teams-username-dropdown" style="display:none"></div>
          </div>

          <!-- Filter Pills (Matching Teams: Unread, Meeting chats, etc.) -->
          <div class="teams-filter-pills">
            <button class="teams-pill-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all" onclick="Chat.setFilter('all')">All</button>
            <button class="teams-pill-btn ${this.activeFilter === 'unread' ? 'active' : ''}" data-filter="unread" onclick="Chat.setFilter('unread')">Unread</button>
            <button class="teams-pill-btn ${this.activeFilter === 'colleagues' ? 'active' : ''}" data-filter="colleagues" onclick="Chat.setFilter('colleagues')">Colleagues</button>
            <button class="teams-pill-btn ${this.activeFilter === 'channels' ? 'active' : ''}" data-filter="channels" onclick="Chat.setFilter('channels')">Meeting chats</button>
          </div>

          <!-- Chat Items Roster -->
          <div class="teams-roster-scroll" id="teams-roster-scroll"></div>
        </div>

        <!-- 3. Right Conversation Panel -->
        <div class="teams-conversation-panel" id="teams-conversation-panel"></div>
      </div>
    `;

    this.renderRosterList();
    this.renderConversationPanel();
  },

  // ── 8. Roster List Rendering (Exact Microsoft Teams Layout) ─
  renderRosterList(filterQuery = '') {
    const scrollContainer = document.getElementById('teams-roster-scroll');
    if (!scrollContainer) return;

    const channels = this.getChannels();
    const q = (filterQuery || '').toLowerCase().trim();

    let filtered = channels;
    if (this.activeFilter === 'unread') {
      filtered = filtered.filter(c => (this.unreadCounts[c.id] || 0) > 0);
    } else if (this.activeFilter === 'colleagues') {
      filtered = filtered.filter(c => c.type === 'direct');
    } else if (this.activeFilter === 'channels') {
      filtered = filtered.filter(c => c.type !== 'direct');
    }

    if (q) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.username && c.username.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    }

    const favorites = filtered.filter(c => c.isFavorite);
    const chats = filtered.filter(c => !c.isFavorite);

    let html = '';

    // SECTION 1: Favorites
    if (favorites.length > 0) {
      html += `
        <div class="teams-section-header" onclick="Chat.toggleSection('favorites')">
          <i class="fa fa-chevron-down teams-section-chevron ${this.collapsedSections.favorites ? 'collapsed' : ''}"></i>
          <span>Favorites (${favorites.length})</span>
        </div>
      `;
      if (!this.collapsedSections.favorites) {
        favorites.forEach(c => {
          html += this.renderCardHTML(c);
        });
      }
    }

    // SECTION 2: Chats (Active Conversations)
    html += `
      <div class="teams-section-header" style="margin-top:6px" onclick="Chat.toggleSection('chats')">
        <i class="fa fa-chevron-down teams-section-chevron ${this.collapsedSections.chats ? 'collapsed' : ''}"></i>
        <span>Chats (${chats.length})</span>
      </div>
    `;
    if (!this.collapsedSections.chats) {
      chats.forEach(c => {
        html += this.renderCardHTML(c);
      });
    }

    // SECTION 3: All Colleagues Directory
    const colleagues = this.getAllCompanyMembers().filter(m => !m.isSelf);
    html += `
      <div class="teams-section-header" style="margin-top:12px" onclick="Chat.toggleSection('colleagues')">
        <i class="fa fa-chevron-down teams-section-chevron ${this.collapsedSections.colleagues ? 'collapsed' : ''}"></i>
        <span>All Colleagues Directory (${colleagues.length})</span>
      </div>
    `;
    if (!this.collapsedSections.colleagues) {
      colleagues.forEach(m => {
        const initials = typeof Utils !== 'undefined' ? Utils.avatarInitials(m.fullName) : m.fullName.substring(0,2);
        const color = typeof Utils !== 'undefined' ? Utils.avatarColor(m.empId) : '#6366f1';
        html += `
          <div class="teams-chat-card" onclick="Chat.startDirectChat(${m.empId})" title="Click to chat with ${m.fullName} (@${m.username})">
            <div class="teams-avatar-wrap" style="background:${color}">
              ${initials}
              <span class="teams-presence-badge ${m.isOnline ? 'online' : 'offline'}"></span>
            </div>
            <div class="teams-card-info">
              <div class="teams-card-top">
                <span class="teams-card-name">${m.fullName}</span>
                <span style="font-size:10.5px;color:#464eb8;font-weight:700">@${m.username}</span>
              </div>
              <div class="teams-card-preview">${m.designation} • ${m.department}</div>
            </div>
            <button class="btn btn-xs" style="padding:2px 8px;font-size:11px;background:#464eb8;color:#fff;border-radius:4px;border:none">Chat</button>
          </div>
        `;
      });
    }

    scrollContainer.innerHTML = html;
  },

  renderCardHTML(c) {
    const isActive = c.id === this.activeChannelId;
    const unread = this.unreadCounts[c.id] || 0;
    const isOnline = c.targetEmpId ? (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(c.targetEmpId)) : true;
    const bg = c.avatarBg || '#464eb8';

    return `
      <div class="teams-chat-card ${isActive ? 'active' : ''} ${unread > 0 ? 'unread' : ''}" 
        data-channel-id="${c.id}" 
        onclick="Chat.openChannel('${c.id}')">
        <div class="teams-avatar-wrap" style="background:${bg}">
          ${c.avatar && c.avatar.startsWith('fa-') ? `<i class="fa ${c.avatar}"></i>` : (c.avatar || c.name.substring(0, 2))}
          <span class="teams-presence-badge ${isOnline ? 'online' : 'offline'}"></span>
        </div>
        <div class="teams-card-info">
          <div class="teams-card-top">
            <span class="teams-card-name">${c.name}</span>
            <span class="teams-card-time">${c.time || 'Today'}</span>
          </div>
          <div class="teams-card-preview">${c.lastMessage || 'Click to open conversation'}</div>
        </div>
        ${unread > 0 ? `<span class="badge badge-danger" style="font-size:10px;padding:1px 6px;border-radius:10px">${unread}</span>` : ''}
      </div>
    `;
  },

  // ── 9. Right Conversation Panel Rendering ───────────────────
  renderConversationPanel() {
    const panel = document.getElementById('teams-conversation-panel');
    if (!panel) return;

    const channel = this.getActiveChannel();
    if (!channel) {
      panel.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-3)">Select a chat to start messaging</div>`;
      return;
    }

    const isOnline = channel.targetEmpId ? (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(channel.targetEmpId)) : true;
    const messages = this.getMessages(channel.id);
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;

    panel.innerHTML = `
      <!-- Convo Topbar -->
      <div class="teams-convo-header">
        <div class="teams-convo-header-left">
          <div class="teams-avatar-wrap" style="background:${channel.avatarBg || '#464eb8'};width:38px;height:38px">
            ${channel.avatar && channel.avatar.startsWith('fa-') ? `<i class="fa ${channel.avatar}"></i>` : (channel.avatar || channel.name.substring(0,2))}
            <span class="teams-presence-badge ${isOnline ? 'online' : 'offline'}"></span>
          </div>
          <div>
            <div class="teams-convo-title">
              ${channel.name} 
              ${channel.username ? `<span style="font-size:12px;color:#464eb8;font-weight:600;margin-left:6px">@${channel.username}</span>` : ''}
            </div>
            <div class="teams-convo-status">
              <span style="width:7px;height:7px;border-radius:50%;background:${isOnline ? '#107c41' : '#94a3b8'}"></span>
              <span>${isOnline ? 'Available' : 'Offline'}</span>
              ${channel.targetEmpRole ? `<span>• ${channel.targetEmpRole}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="teams-header-actions">
          <button class="teams-action-icon-btn" onclick="Chat.startMeetNow()" title="Video Call"><i class="fa fa-video"></i></button>
          <button class="teams-action-icon-btn" onclick="Chat.startMeetNow()" title="Audio Call"><i class="fa fa-phone"></i></button>
          <button class="teams-action-icon-btn" onclick="document.getElementById('teams-filter-input').focus()" title="Find in Chat"><i class="fa fa-search"></i></button>
          <button class="teams-action-icon-btn" onclick="Chat.showChannelMembersModal('${channel.id}')" title="More Options"><i class="fa fa-ellipsis"></i></button>
        </div>
      </div>

      <!-- Messages Stream -->
      <div class="teams-msg-container" id="teams-msg-container">
        ${this.renderMessagesHTML(messages, myId)}
      </div>

      <!-- Typing Indicator -->
      <div id="teams-typing-bar" class="chat-typing-bar" style="display:none"></div>

      <!-- Compose Box (Microsoft Teams Input with formatting tools) -->
      <div class="teams-compose-box">
        <div class="teams-compose-card">
          <textarea 
            id="teams-msg-input" 
            class="teams-compose-textarea" 
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            onkeydown="Chat.onInputTyping(event)"
            oninput="this.style.height='auto';this.style.height=Math.min(130, this.scrollHeight)+'px'"></textarea>
          <div class="teams-compose-toolbar">
            <div class="teams-compose-tools">
              <button class="teams-tool-btn" title="Bold" onclick="Chat.wrapText('**')"><i class="fa fa-bold"></i></button>
              <button class="teams-tool-btn" title="Italic" onclick="Chat.wrapText('*')"><i class="fa fa-italic"></i></button>
              <button class="teams-tool-btn" title="Attach file (up to 10MB)" onclick="document.getElementById('teams-file-picker').click()"><i class="fa fa-paperclip"></i></button>
              <input type="file" id="teams-file-picker" style="display:none" onchange="Chat.handleFileUpload(this)">
              <button class="teams-tool-btn" title="Add Emoji" onclick="Chat.showReactionPicker('new', this)"><i class="fa fa-face-smile"></i></button>
            </div>
            <button class="teams-send-btn" onclick="Chat.sendMessage()">
              <span>Send</span>
              <i class="fa fa-paper-plane" style="font-size:11px"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    this.scrollToBottom();
  },

  renderMessagesHTML(messages, myId) {
    if (messages.length === 0) {
      return `
        <div style="text-align:center;padding:40px;color:var(--text-3)">
          <div style="font-size:32px;color:#464eb8;margin-bottom:8px"><i class="fa fa-comments"></i></div>
          <div style="font-size:15px;font-weight:700;color:var(--text)">This is the start of your chat</div>
          <div style="font-size:12.5px;margin-top:4px">Send a message or share documents to collaborate.</div>
        </div>
      `;
    }

    let html = `<div style="text-align:center;margin:8px 0"><span style="background:rgba(0,0,0,0.06);padding:3px 10px;border-radius:10px;font-size:11px;font-weight:600;color:var(--text-3)">Today</span></div>`;

    messages.forEach(msg => {
      const isMe = msg.senderId === myId;
      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="teams-msg-row ${isMe ? 'outgoing' : 'incoming'}" data-msg-id="${msg.id}">
          ${!isMe ? `
            <div class="teams-avatar-wrap" style="width:32px;height:32px;font-size:11px;background:${typeof Utils !== 'undefined' ? Utils.avatarColor(msg.senderId) : '#6366f1'}">
              ${typeof Utils !== 'undefined' ? Utils.avatarInitials(msg.senderName) : msg.senderName.substring(0,2)}
            </div>
          ` : ''}
          <div style="display:flex;flex-direction:column;${isMe ? 'align-items:flex-end' : ''}">
            ${!isMe ? `
              <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:2px;display:flex;gap:6px">
                <span>${msg.senderName}</span>
                <span style="font-weight:400;color:var(--text-3)">${timeStr}</span>
              </div>
            ` : ''}
            <div class="teams-bubble">
              <div>${this.formatMessageText(msg.content)}</div>
              ${this.renderAttachmentsHTML(msg.attachments)}
              ${isMe ? `<div style="font-size:10px;opacity:0.75;text-align:right;margin-top:3px">${timeStr} <i class="fa fa-check-double" style="font-size:9px;margin-left:3px"></i></div>` : ''}
            </div>
            <div class="chat-reactions-container">${this.renderReactionsHTML(msg.id, msg.reactions)}</div>
          </div>
        </div>
      `;
    });

    return html;
  },

  // ── 10. Message Sending & File Uploads ─────────────────────
  sendMessage() {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('teams-msg-input');
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;

    const myEmp = (typeof Auth !== 'undefined' && Auth?.employee) || { id: 1, fullName: 'Admin User' };
    const channel = this.getActiveChannel();
    if (!channel) return;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      channelId: channel.id,
      senderId: myEmp.id,
      senderName: myEmp.fullName,
      content,
      createdAt: new Date().toISOString()
    };

    if (typeof DB !== 'undefined') {
      const allMsgs = DB.get('chat_messages') || [];
      allMsgs.push(newMsg);
      DB.set('chat_messages', allMsgs);

      // Update channel last message & time
      const channels = DB.get('chat_channels') || [];
      const ch = channels.find(c => c.id === channel.id);
      if (ch) {
        ch.lastMessage = `You: ${content.substring(0, 30)}${content.length > 30 ? '…' : ''}`;
        ch.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        DB.set('chat_channels', channels);
      }
    }

    if (typeof HRMWebSocket !== 'undefined') {
      HRMWebSocket.sendChatMessage(newMsg);
      HRMWebSocket.sendTyping(channel.id, false);
    }

    this.playMessageSound('outgoing');
    input.value = '';
    input.style.height = 'auto';

    this.renderConversationPanel();
    this.renderRosterList();
    this.scrollToBottom();
  },

  handleIncomingMessage(msg) {
    if (!msg || !msg.channelId) return;
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;
    if (msg.senderId === myId) return;

    if (typeof DB !== 'undefined') {
      const allMsgs = DB.get('chat_messages') || [];
      if (!allMsgs.some(m => m.id === msg.id)) {
        allMsgs.push(msg);
        DB.set('chat_messages', allMsgs);
      }

      const channels = DB.get('chat_channels') || [];
      const ch = channels.find(c => c.id === msg.channelId);
      if (ch) {
        ch.lastMessage = `${msg.senderName}: ${msg.content.substring(0, 25)}`;
        ch.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        DB.set('chat_channels', channels);
      }
    }

    if (this.activeChannelId === msg.channelId) {
      this.renderConversationPanel();
      this.scrollToBottom();
      this.playMessageSound('incoming');
    } else {
      this.unreadCounts[msg.channelId] = (this.unreadCounts[msg.channelId] || 0) + 1;
      this.updateBadges();
      this.playMessageSound('incoming');

      if (typeof Toast !== 'undefined') {
        Toast.show(`💬 <strong>${msg.senderName}:</strong> ${msg.content.substring(0, 45)}…`, 'info');
      }
    }
    this.renderRosterList();
  },

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

    if (!this.typingUsers[channelId]) this.typingUsers[channelId] = new Set();
    if (isTyping) this.typingUsers[channelId].add(userName);
    else this.typingUsers[channelId].delete(userName);

    if (this.activeChannelId === channelId) {
      const bar = document.getElementById('teams-typing-bar');
      if (bar) {
        const names = Array.from(this.typingUsers[channelId]);
        if (names.length === 0) {
          bar.innerHTML = '';
          bar.style.display = 'none';
        } else {
          bar.innerHTML = `
            <div class="chat-typing-dots"><span></span><span></span><span></span></div>
            <span style="font-size:11.5px;color:var(--text-3);font-style:italic">${names[0]} is typing...</span>
          `;
          bar.style.display = 'flex';
        }
      }
    }
  },

  wrapText(tag) {
    const input = document.getElementById('teams-msg-input');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.substring(start, end) || 'text';
    input.value = input.value.substring(0, start) + `${tag}${selected}${tag}` + input.value.substring(end);
    input.focus();
  },

  startMeetNow() {
    if (typeof Toast !== 'undefined') {
      Toast.show('📹 Microsoft Teams Video Conference call link copied to clipboard & room launched.', 'success');
    }
  },

  formatMessageText(text) {
    if (!text) return '';
    let escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">$1</a>');
    return escaped.replace(/\n/g, '<br>');
  },

  renderAttachmentsHTML(attachments) {
    if (!attachments || !attachments.length) return '';
    return `
      <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px">
        ${attachments.map(att => `
          <a href="${att.fileUrl || '#'}" download="${att.fileName}" class="chat-attachment-card" style="padding:6px 10px;border-radius:6px;background:rgba(0,0,0,0.06);display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit">
            <i class="fa fa-file-pdf" style="color:#ef4444;font-size:16px"></i>
            <div style="flex:1;overflow:hidden">
              <div style="font-size:12px;font-weight:600">${att.fileName}</div>
              <div style="font-size:10px;opacity:0.75">${Math.round((att.fileSize||1024)/1024)} KB • Click to download</div>
            </div>
            <i class="fa fa-download" style="font-size:12px;opacity:0.7"></i>
          </a>
        `).join('')}
      </div>
    `;
  },

  handleFileUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      if (typeof Toast !== 'undefined') Toast.show('File exceeds 10MB limit.', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const myEmp = (typeof Auth !== 'undefined' && Auth?.employee) || { id: 1, fullName: 'Admin User' };
      const channel = this.getActiveChannel();
      if (!channel) return;

      const newMsg = {
        id: `msg-${Date.now()}`,
        channelId: channel.id,
        senderId: myEmp.id,
        senderName: myEmp.fullName,
        content: `Shared file: ${file.name}`,
        attachments: [{ id: `att-${Date.now()}`, fileName: file.name, fileSize: file.size, fileUrl: e.target.result }],
        createdAt: new Date().toISOString()
      };

      if (typeof DB !== 'undefined') {
        const allMsgs = DB.get('chat_messages') || [];
        allMsgs.push(newMsg);
        DB.set('chat_messages', allMsgs);
      }

      if (typeof HRMWebSocket !== 'undefined') HRMWebSocket.sendChatMessage(newMsg);
      this.playMessageSound('outgoing');
      this.renderConversationPanel();
      input.value = '';
      if (typeof Toast !== 'undefined') Toast.show(`Shared "${file.name}"`, 'success');
    };
    reader.readAsDataURL(file);
  },

  renderReactionsHTML(msgId, reactions = {}) {
    const emojis = Object.keys(reactions || {});
    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;
    let html = '<div class="chat-reactions-row" style="display:flex;gap:4px;margin-top:3px">';
    emojis.forEach(emoji => {
      const users = reactions[emoji] || [];
      if (!users.length) return;
      const reacted = users.includes(myId);
      html += `<span class="chat-reaction-tag ${reacted ? 'reacted' : ''}" onclick="Chat.toggleReaction('${msgId}', '${emoji}')">${emoji} ${users.length}</span>`;
    });
    html += `<span class="chat-reaction-tag" style="opacity:0.6;font-size:9.5px;cursor:pointer" onclick="Chat.showReactionPicker('${msgId}', this)">➕</span></div>`;
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
    popover.innerHTML = commonEmojis.map(e => `<span style="padding:2px" onclick="Chat.toggleReaction('${msgId}', '${e}'); this.parentElement.remove();">${e}</span>`).join('');

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
    if (msgId === 'new') {
      const input = document.getElementById('teams-msg-input');
      if (input) input.value += ` ${emoji}`;
      return;
    }

    const myId = (typeof Auth !== 'undefined' && Auth?.employee?.id) || 1;
    const chanId = this.activeChannelId;

    if (typeof DB !== 'undefined') {
      const allMsgs = DB.get('chat_messages') || [];
      const msg = allMsgs.find(m => m.id === msgId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
        const idx = msg.reactions[emoji].indexOf(myId);
        if (idx > -1) msg.reactions[emoji].splice(idx, 1);
        else msg.reactions[emoji].push(myId);
        DB.set('chat_messages', allMsgs);
        this.renderConversationPanel();
      }
    }

    if (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isConnected) {
      HRMWebSocket.sendReaction(msgId, chanId, emoji);
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
        if (this.activeChannelId === payload.channelId) {
          this.renderConversationPanel();
        }
      }
    }
  },

  updatePresenceUI() {
    this.renderRosterList();
    this.renderConversationPanel();
  },

  scrollToBottom() {
    if (typeof document === 'undefined') return;
    const stream = document.getElementById('teams-msg-container');
    if (stream) stream.scrollTop = stream.scrollHeight;
  },

  showChannelMembersModal(channelId) {
    const channel = this.getChannels().find(c => c.id === channelId);
    if (!channel) return;
    const employees = (typeof DB !== 'undefined' && DB.get('employees')) || [];
    const members = (channel.members || []).map(id => employees.find(e => e.id === id)).filter(Boolean);

    const content = `
      <div style="padding:10px">
        <h4 style="margin:0 0 10px 0">${channel.name}</h4>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${members.map(m => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;background:var(--surface);border-radius:8px">
              <div>
                <strong>${m.fullName}</strong>
                <div style="font-size:11px;color:var(--text-3)">${m.designation || 'Staff'}</div>
              </div>
              <button class="btn btn-primary btn-xs" onclick="Chat.startDirectChat(${m.id}); Modal.close();">Chat</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (typeof Modal !== 'undefined') {
      Modal.open({ title: 'Chat Members', content });
    }
  }
};

if (typeof window !== 'undefined') {
  window.Chat = Chat;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Chat;
}
