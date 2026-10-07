// ============================================================
// HRM SYSTEM — Microsoft Teams-Style Enterprise Chat Engine
// Instant Team Messaging, AI Copilot, Video Calls & File Sharing
// ============================================================

const Chat = {
  isOpen: false,
  isMinimized: false,
  isMaximized: false,
  widgetView: 'convo', // 'convo' (active chat in bottom box) | 'list' (contact roster)
  activeFilter: 'all', // 'all' | 'unread' | 'colleagues' | 'channels'
  activeChannelId: 'chan-wajiha',
  collapsedSections: { favorites: false, chats: false, colleagues: false },
  unreadCounts: {},
  typingTimeout: null,
  typingUsers: {}, // channelId -> Set of names
  audioCtx: null,

  // Modern Enterprise Collaboration State
  replyingTo: null, // { id, senderName, content }
  inChatSearchActive: false,
  inChatSearchQuery: '',
  isRecordingVoice: false,
  voiceTimer: null,
  voiceDuration: 0,
  activeCall: null, // { type, contactName, avatar, timer, duration, isMuted, isVideoOff }
  userCustomStatus: { presence: 'online', statusText: 'Available' },

  init() {
    this.ensureTeamsSeedData();
    this.initAudio();
    this.calculateInitialUnreads();

    // Listen to WebSocket presence & live messaging events
    if (typeof HRMWebSocket !== 'undefined') {
      if (typeof HRMWebSocket.on === 'function') {
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

  // ── 0. Helper: Resolve Current Logged-In User & Check Ownership ──
  getCurrentUser() {
    let emp = (typeof Auth !== 'undefined' && Auth.employee) || null;
    let usr = (typeof Auth !== 'undefined' && Auth.user) || null;

    if (!emp && usr?.employeeId && typeof DB !== 'undefined') {
      const allEmps = DB.get('employees') || [];
      emp = allEmps.find(e => e.id === usr.employeeId);
    }

    const id = parseInt(emp?.id || usr?.employeeId || usr?.id || 1, 10);
    const fullName = emp?.fullName || usr?.name || (id === 1 ? 'Ahmed Khan' : (id === 2 ? 'Sara Malik' : (id === 3 ? 'Usman Baig' : 'Team Member')));
    const username = usr?.username || (emp?.email ? emp.email.split('@')[0] : 'admin');
    const role = Auth?.role || usr?.role || 'admin';

    return { id, fullName, username, role, emp };
  },

  isMyMessage(msg) {
    if (!msg) return false;
    const me = this.getCurrentUser();

    // Check 1: Numeric or string senderId comparison
    if (msg.senderId !== undefined && msg.senderId !== null) {
      if (parseInt(msg.senderId, 10) === parseInt(me.id, 10)) return true;
    }

    // Check 2: Sender full name match (case-insensitive)
    if (msg.senderName && me.fullName) {
      const sName = msg.senderName.trim().toLowerCase();
      const mName = me.fullName.trim().toLowerCase();
      if (sName === mName || sName.includes(mName) || mName.includes(sName)) return true;
    }

    // Check 3: Sender username handle match
    if (msg.senderUsername && me.username) {
      if (msg.senderUsername.trim().toLowerCase() === me.username.trim().toLowerCase()) return true;
    }

    return false;
  },

  // ── 1. Seed Realistic Teams Conversations ──────────────────
  ensureTeamsSeedData() {
    if (typeof DB === 'undefined') return;

    let channels = DB.get('chat_channels') || [];
    let messages = DB.get('chat_messages') || [];

    const teamsSeedChannels = [
      {
        id: 'chan-saima',
        name: 'Saima BD',
        username: 'saima.bd',
        avatar: 'S',
        avatarBg: '#f472b6',
        type: 'direct',
        isFavorite: false,
        time: '1:35 PM',
        lastMessage: 'okay',
        targetEmpId: 201,
        targetEmpRole: 'Business Development',
        members: [1, 201]
      },
      {
        id: 'chan-num92',
        name: '+92 316 0418470',
        username: 'wa.923160418470',
        avatar: 'M',
        avatarBg: '#2dd4bf',
        type: 'direct',
        isFavorite: false,
        time: '11:12 AM',
        lastMessage: 'Sir kaysy ha ap?',
        targetEmpId: 202,
        targetEmpRole: 'External Client',
        members: [1, 202]
      },
      {
        id: 'chan-kallur',
        name: 'Kallur Kot Travel Group',
        username: 'kallur.travel',
        avatar: 'KT',
        avatarBg: '#0ea5e9',
        type: 'group',
        isFavorite: false,
        time: '10:13 AM',
        lastMessage: '~Rana Usama: Asalam o alaikum koi bhaii car pa aj Lahore ...',
        targetEmpId: null,
        targetEmpRole: 'Corporate Travel Pool',
        members: [1, 203, 204]
      },
      {
        id: 'chan-gemini',
        name: 'Gimmini Pro 18 Month',
        username: 'gemini.pro',
        avatar: 'fa-wand-magic-sparkles',
        avatarBg: '#38bdf8',
        type: 'group',
        isFavorite: false,
        time: '9:12 AM',
        lastMessage: '~work: Gemmini rate is so high due to the shortage of lin...',
        targetEmpId: null,
        targetEmpRole: 'AI Research Group',
        members: [1, 999]
      },
      {
        id: 'chan-arshad',
        name: 'Arshad Iqbal 🇵🇰',
        username: 'arshad.iqbal',
        avatar: 'AI',
        avatarBg: '#b45309',
        type: 'direct',
        isFavorite: false,
        time: '12:23 AM',
        lastMessage: '🎙️ 0:03',
        isVoice: true,
        targetEmpId: 205,
        targetEmpRole: 'Logistics Partner',
        members: [1, 205]
      },
      {
        id: 'chan-chairs',
        name: 'Chairs',
        username: 'office.chairs',
        avatar: 'C',
        avatarBg: '#fb7185',
        type: 'direct',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: '✓✓ Aoa office chairs available',
        targetEmpId: 206,
        targetEmpRole: 'Procurement Vendor',
        members: [1, 206]
      },
      {
        id: 'chan-ghulaman',
        name: 'UC Ghulaman',
        username: 'uc.ghulaman',
        avatar: 'UG',
        avatarBg: '#1e40af',
        type: 'group',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: '~FANi: 📷 Photo',
        isMuted: true,
        targetEmpId: null,
        targetEmpRole: 'Regional Liaison',
        members: [1, 207, 208]
      },
      {
        id: 'chan-touqeer',
        name: 'Touqeer Home',
        username: 'touqeer.home',
        avatar: 'TH',
        avatarBg: '#10b981',
        type: 'direct',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: '✓✓ Subha 6 bjy ata h wohi h ya',
        targetEmpId: 209,
        targetEmpRole: 'Operations Field',
        members: [1, 209]
      },
      {
        id: 'chan-copilot',
        name: '✨ HRM Meta AI & Copilot',
        username: 'hrm.copilot',
        avatar: 'fa-robot',
        avatarBg: '#00a884',
        type: 'bot',
        isFavorite: true,
        time: 'Now',
        lastMessage: 'Ask me anything about your leaves, payroll, or attendance!',
        targetEmpId: null,
        targetEmpRole: 'Verified AI Agent',
        members: [1, 999]
      },
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

    // Prioritize and ensure WhatsApp seed channels exist at top in screenshot order
    const waSeedMap = new Map(teamsSeedChannels.map(s => [s.id, s]));
    channels = channels.filter(c => !waSeedMap.has(c.id));
    channels = [...teamsSeedChannels, ...channels];
    DB.set('chat_channels', channels);

    // Initial message history for chan-copilot
    if (!messages.some(m => m.channelId === 'chan-copilot')) {
      messages.push({
        id: 'msg-copilot-welcome',
        channelId: 'chan-copilot',
        senderId: 999,
        senderName: 'HRM AI Copilot',
        content: `👋 **Welcome to HRM AI Copilot!**\n\nI am your intelligent enterprise collaboration assistant. You can ask me to:\n- 🌴 *Check your remaining leave balance*\n- 📊 *Review today's employee attendance*\n- 💰 *Explain salary structure & tax slabs*\n- 📝 *Draft an announcement or email*\n\nClick any quick prompt below or type your question:`,
        isBot: true,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      });
      DB.set('chat_messages', messages);
    }

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
          isPinned: true,
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
      } else if (type === 'outgoing') {
        osc.frequency.setValueAtTime(440.0, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      } else if (type === 'ring') {
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.setValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      } else if (type === 'hangup') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (err) {}
  },

  // ── 3. Unread Badges ──────────────────────────────────────
  calculateInitialUnreads() {
    this.unreadCounts['chan-saima'] = 1;
    this.unreadCounts['chan-num92'] = 1;
    this.unreadCounts['chan-gemini'] = 1;
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
    const me = this.getCurrentUser();
    const myId = me.id;

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
    const me = this.getCurrentUser();
    const myId = me.id;

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

  // ── Dynamic Counterparty Resolver for 1-on-1 Chats ─────────
  getChannelDisplayInfo(channel) {
    if (!channel) {
      return { name: 'Chat', username: '', avatar: 'fa-comments', avatarBg: '#464eb8', isOnline: false, role: '' };
    }

    if (channel.type === 'bot') {
      return {
        name: channel.name || '✨ HRM AI Copilot',
        username: channel.username || 'hrm.copilot',
        avatar: channel.avatar || 'fa-wand-magic-sparkles',
        avatarBg: channel.avatarBg || 'linear-gradient(135deg, #6366f1, #a855f7)',
        isOnline: true,
        role: 'Verified AI Agent',
        isBot: true
      };
    }

    // For direct 1-on-1 chats: ALWAYS identify the other person (counterparty)
    if (channel.type === 'direct') {
      const me = this.getCurrentUser();
      let otherEmpId = null;

      if (Array.isArray(channel.members) && channel.members.length > 0) {
        otherEmpId = channel.members.find(id => parseInt(id, 10) !== parseInt(me.id, 10));
      }
      if (!otherEmpId && channel.targetEmpId && parseInt(channel.targetEmpId, 10) !== parseInt(me.id, 10)) {
        otherEmpId = channel.targetEmpId;
      }

      if (otherEmpId) {
        const employees = (typeof DB !== 'undefined' && DB.get('employees')) || [];
        const otherEmp = employees.find(e => parseInt(e.id, 10) === parseInt(otherEmpId, 10));
        if (otherEmp) {
          const isOnline = typeof HRMWebSocket !== 'undefined' && HRMWebSocket.isUserOnline(otherEmp.id);
          const username = otherEmp.email ? otherEmp.email.split('@')[0] : (otherEmp.username || otherEmp.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.'));
          return {
            name: otherEmp.fullName,
            username: username,
            avatar: typeof Utils !== 'undefined' ? Utils.avatarInitials(otherEmp.fullName) : otherEmp.fullName.substring(0, 2),
            avatarBg: typeof Utils !== 'undefined' ? Utils.avatarColor(otherEmp.id) : '#464eb8',
            isOnline: isOnline,
            role: otherEmp.designation || 'Colleague',
            empId: otherEmp.id
          };
        }
      }
    }

    // Default for group / announcement channels
    return {
      name: channel.name,
      username: channel.username || '',
      avatar: channel.avatar || channel.name.substring(0, 2),
      avatarBg: channel.avatarBg || '#464eb8',
      isOnline: true,
      role: channel.targetEmpRole || ''
    };
  },

  // ── 5. New Chat & Autocomplete Modal ──────────────────────
  startNewChat() {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('teams-filter-input');
    if (input) {
      input.value = '@';
      if (typeof input.focus === 'function') input.focus();
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
    const me = this.getCurrentUser();
    const myId = me.id;
    targetEmpId = parseInt(targetEmpId, 10);

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
        companyName: targetEmp.companyName || me.emp?.companyName || 'Apex Holdings',
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
    this.widgetView = 'convo';
    this.replyingTo = null;
    this.inChatSearchActive = false;
    this.markChannelAsRead(channelId);

    const drawer = document.getElementById('chat-drawer');
    if (drawer && !this.isMaximized) {
      this.renderWorkspace(drawer, false);
      setTimeout(() => this.scrollToBottom(), 50);
      return;
    }

    // Refresh active state in roster
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.teams-chat-card').forEach(el => {
        el.classList.toggle('active', el.dataset.channelId === channelId);
      });
      this.renderConversationPanel();
      setTimeout(() => this.scrollToBottom(), 50);
    }
  },

  selectChannel(channelId) {
    this.closeOptionsMenu();
    this.openChannel(channelId);
  },

  selectCopilot() {
    this.closeOptionsMenu();
    this.openChannel('chan-copilot');
  },

  toggleWidgetList(e) {
    if (e) e.stopPropagation();
    this.widgetView = this.widgetView === 'list' ? 'convo' : 'list';
    const drawer = document.getElementById('chat-drawer');
    if (drawer && !this.isMaximized) {
      this.renderWorkspace(drawer, false);
    }
  },

  openTicketFromChat(ticketId) {
    if (typeof App !== 'undefined' && typeof App.navigate === 'function') {
      App.navigate('helpdesk');
    }
    if (this.isMaximized) {
      this.isMaximized = false;
      if (typeof document !== 'undefined') {
        const drawer = document.getElementById('chat-drawer');
        if (drawer) drawer.classList.remove('maximized');
      }
    }
    setTimeout(() => {
      if (typeof Helpdesk !== 'undefined' && typeof Helpdesk.openTicketWorkspace === 'function') {
        Helpdesk.openTicketWorkspace(ticketId);
      }
    }, 150);
  },

  openTicketFromChatByNumber(ticketNumber) {
    if (typeof DB !== 'undefined') {
      const tickets = DB.get('helpdesk_tickets') || [];
      const t = tickets.find(x => x.ticketNumber === ticketNumber);
      if (t) {
        this.openTicketFromChat(t.id);
        return;
      }
    }
    if (typeof App !== 'undefined' && typeof App.navigate === 'function') {
      App.navigate('helpdesk');
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
    this.widgetView = 'list'; // Default to WhatsApp roster list view (matching screenshot)

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
    this.closeOptionsMenu();

    if (this.isMinimized) {
      this.updateDockedBottomBar();
    }
  },

  updateDockedBottomBar() {
    const bar = document.getElementById('chat-docked-bottom-bar');
    if (!bar) return;
    const channel = this.getActiveChannel();
    const info = this.getChannelDisplayInfo(channel);
    const totalUnread = Object.values(this.unreadCounts).reduce((a, b) => a + (b || 0), 0);

    bar.innerHTML = `
      <div class="chat-docked-info" onclick="Chat.toggleMinimize(event)" title="Restore WhatsApp">
        <div class="wa-avatar-wrap teams-avatar-wrap" style="background:${info.avatarBg || '#00a884'};width:28px;height:28px;font-size:12px">
          ${info.avatar && info.avatar.startsWith('fa-') ? `<i class="fa ${info.avatar}"></i>` : (info.avatar || info.name.substring(0, 2))}
          <span class="wa-online-dot" style="width:8px;height:8px"></span>
        </div>
        <div class="chat-docked-text">
          <span class="chat-docked-name">${info.name}</span>
          <span class="chat-docked-sub" style="color:#25D366;font-weight:600">WhatsApp • ${info.isOnline ? 'Online' : 'Active'}</span>
        </div>
        ${totalUnread > 0 ? `<span class="wa-unread-circle badge badge-danger" style="font-size:10px;min-width:18px;height:18px;padding:0 4px;margin-left:4px">${totalUnread}</span>` : ''}
      </div>
      <div class="chat-docked-actions">
        <button class="wa-action-btn teams-action-icon-btn" onclick="Chat.toggleMinimize(event)" title="Restore WhatsApp">
          <i class="fa fa-chevron-up"></i>
        </button>
        <button class="wa-action-btn teams-action-icon-btn teams-btn-maximize" onclick="Chat.toggleMaximize(event)" title="Maximize">
          <i class="fa fa-expand"></i>
        </button>
        <button class="wa-action-btn teams-action-icon-btn" onclick="Chat.closeDrawer(); event.stopPropagation();" title="Close">
          <i class="fa fa-xmark"></i>
        </button>
      </div>
    `;
  },

  toggleMaximize(e) {
    if (e) e.stopPropagation();
    if (typeof document === 'undefined') return;
    const drawer = document.getElementById('chat-drawer');
    if (!drawer) return;

    if (this.isMinimized) {
      this.isMinimized = false;
      drawer.classList.remove('minimized');
    }

    this.isMaximized = !this.isMaximized;
    drawer.classList.toggle('maximized', this.isMaximized);
    this.closeOptionsMenu();

    const maxIcons = drawer.querySelectorAll('.teams-btn-maximize i');
    maxIcons.forEach(icon => {
      icon.className = `fa ${this.isMaximized ? 'fa-compress' : 'fa-expand'}`;
    });

    this.renderWorkspace(drawer, false);
  },

  toggleOptionsMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('teams-options-dropdown');
    if (!dropdown) return;
    const isOpen = dropdown.style.display === 'flex';
    if (isOpen) {
      this.closeOptionsMenu();
    } else {
      dropdown.style.display = 'flex';
    }
  },

  closeOptionsMenu() {
    const dropdown = document.getElementById('teams-options-dropdown');
    if (dropdown) dropdown.style.display = 'none';
  },

  clearCurrentChat() {
    this.closeOptionsMenu();
    const channel = this.getActiveChannel();
    if (!channel) return;
    if (confirm(`Are you sure you want to clear conversation messages for ${channel.name}?`)) {
      if (typeof DB !== 'undefined') {
        let msgs = DB.get('chat_messages') || [];
        msgs = msgs.filter(m => m.channelId !== channel.id);
        DB.set('chat_messages', msgs);
      }
      this.renderConversationPanel();
      if (typeof Toast !== 'undefined') Toast.show('Conversation cleared', 'info');
    }
  },

  exportChatTranscript() {
    this.closeOptionsMenu();
    const channel = this.getActiveChannel();
    if (!channel) return;
    const messages = this.getMessages(channel.id);
    if (messages.length === 0) {
      if (typeof Toast !== 'undefined') Toast.show('No messages in this chat to export', 'warning');
      return;
    }

    let text = `====================================================\n`;
    text += `HRM Pro Teams Chat — ${channel.name}\n`;
    text += `Channel ID: ${channel.id}\n`;
    text += `Exported: ${new Date().toLocaleString()}\n`;
    text += `====================================================\n\n`;

    messages.forEach(m => {
      text += `[${m.time || ''}] ${m.senderName || 'Unknown'}:\n${m.content}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HRM_Chat_${channel.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof Toast !== 'undefined') Toast.show('Chat transcript exported', 'success');
  },

  toggleMuteActiveChannel() {
    this.closeOptionsMenu();
    const channel = this.getActiveChannel();
    if (!channel) return;
    channel.isMuted = !channel.isMuted;
    if (typeof Toast !== 'undefined') {
      Toast.show(channel.isMuted ? `Muted notifications for ${channel.name}` : `Unmuted notifications for ${channel.name}`, 'info');
    }
  },

  renderFullWorkspace() {
    const content = document.getElementById('page-content');
    if (!content) return;
    this.renderWorkspace(content, true);
  },

  // ── 7. Core WhatsApp Web UI Renderer ───────────────────────
  renderWorkspace(container, isFullScreen = false) {
    if (!container) return;

    const channel = this.getActiveChannel();
    const info = this.getChannelDisplayInfo(channel);
    const totalUnread = Object.values(this.unreadCounts).reduce((a, b) => a + (b || 0), 0);

    const widgetClass = !isFullScreen 
      ? `teams-widget ${this.isMaximized ? 'teams-widget-maximized' : (this.widgetView === 'list' ? 'show-list' : 'show-convo')}` 
      : 'teams-fullscreen';

    container.innerHTML = `
      <!-- Docked Bottom Bar (Visible when Chatbox is Minimized in Bottom Right) -->
      ${!isFullScreen ? `
        <div class="chat-docked-bottom-bar wa-docked-bar" id="chat-docked-bottom-bar" onclick="Chat.toggleMinimize(event)" title="Restore WhatsApp">
          <div class="chat-docked-info">
            <div class="wa-avatar-wrap teams-avatar-wrap" style="background:${info.avatarBg || '#00a884'};width:30px;height:30px;font-size:13px">
              ${info.avatar && info.avatar.startsWith('fa-') ? `<i class="fa ${info.avatar}"></i>` : (info.avatar || info.name.substring(0, 2))}
              <span class="wa-online-dot" style="width:8px;height:8px"></span>
            </div>
            <div class="chat-docked-text">
              <span class="chat-docked-name">${info.name}</span>
              <span class="chat-docked-sub" style="color:#25D366">WhatsApp • ${info.isOnline ? 'Online' : 'Active'}</span>
            </div>
            ${totalUnread > 0 ? `<span class="wa-unread-circle badge badge-danger" style="font-size:10px;min-width:18px;height:18px">${totalUnread}</span>` : ''}
          </div>
          <div class="chat-docked-actions">
            <button class="wa-action-btn teams-action-icon-btn" onclick="Chat.toggleMinimize(event)" title="Restore WhatsApp">
              <i class="fa fa-chevron-up"></i>
            </button>
            <button class="wa-action-btn teams-action-icon-btn teams-btn-maximize" onclick="Chat.toggleMaximize(event)" title="Maximize">
              <i class="fa fa-expand"></i>
            </button>
            <button class="wa-action-btn teams-action-icon-btn" onclick="Chat.closeDrawer(); event.stopPropagation();" title="Close">
              <i class="fa fa-xmark"></i>
            </button>
          </div>
        </div>
      ` : ''}

      <div class="wa-wrapper teams-wrapper ${widgetClass}">
        <!-- 1. Left Vertical Icon Rail (WhatsApp Web Style) -->
        <div class="wa-rail teams-app-rail">
          <!-- Top Icons -->
          <button class="wa-rail-btn teams-rail-btn ${this.activeFilter === 'all' || this.activeFilter === 'unread' ? 'active' : ''}" title="Chats" onclick="Chat.setFilter('all')">
            <i class="fa fa-comment-dots"></i>
            <span class="wa-rail-badge">4</span>
          </button>
          <button class="wa-rail-btn teams-rail-btn" title="Status" onclick="if(typeof Toast!=='undefined') Toast.show('Status updates active', 'info')">
            <i class="fa-regular fa-circle-dot"></i>
            <span class="wa-rail-dot"></span>
          </button>
          <button class="wa-rail-btn teams-rail-btn" title="Channels" onclick="Chat.setFilter('groups')">
            <i class="fa fa-bullhorn"></i>
            <span class="wa-rail-dot"></span>
          </button>
          <button class="wa-rail-btn teams-rail-btn" title="Communities" onclick="if(typeof Toast!=='undefined') Toast.show('Communities tab', 'info')">
            <i class="fa fa-users"></i>
          </button>
          <button class="wa-rail-btn teams-rail-btn" title="Meta AI / Copilot" onclick="Chat.selectCopilot()">
            <i class="fa fa-circle-nodes"></i>
            <span class="wa-rail-dot"></span>
          </button>
          <button class="wa-rail-btn teams-rail-btn" title="Broadcast" onclick="if(typeof Toast!=='undefined') Toast.show('Broadcast lists', 'info')">
            <i class="fa fa-tower-broadcast"></i>
          </button>

          <!-- Spacer -->
          <div style="flex:1"></div>

          <!-- Bottom Icons -->
          <button class="wa-rail-btn teams-rail-btn" title="Media & Files" onclick="if(typeof Toast!=='undefined') Toast.show('Shared media gallery', 'info')">
            <i class="fa-regular fa-image"></i>
          </button>
          <button class="wa-rail-btn teams-rail-btn wa-hrm-switch-btn" title="Return to HRM Suite" onclick="if (typeof App !== 'undefined') App.navigate('dashboard');">
            <i class="fa fa-building-user"></i>
          </button>
          <button class="wa-rail-btn teams-rail-btn" title="Settings" onclick="if (typeof App !== 'undefined') App.navigate('settings');">
            <i class="fa fa-gear"></i>
          </button>
          <div class="wa-rail-avatar" title="My Profile" onclick="if (typeof App !== 'undefined') App.navigate('profile');">
            <div style="width:32px;height:32px;border-radius:50%;background:#00a884;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">AK</div>
          </div>
        </div>

        <!-- 2. WhatsApp Chat List Column -->
        <div class="wa-list-column teams-list-column">
          <!-- WhatsApp Header -->
          <div class="wa-header teams-list-header">
            <div class="wa-title teams-list-title">WhatsApp</div>
            <div class="wa-header-actions teams-header-actions">
              <!-- 3-Dots Dropdown Options -->
              <div class="teams-options-wrap" style="position:relative">
                <button class="wa-action-btn teams-action-icon-btn" onclick="Chat.toggleOptionsMenu(event)" title="Menu">
                  <i class="fa fa-ellipsis-vertical"></i>
                </button>
                <div id="teams-options-dropdown" class="teams-options-dropdown" style="display:none">
                  <div style="font-size:10px;font-weight:800;color:var(--text-3);padding:6px 8px;text-transform:uppercase">WhatsApp Options</div>
                  <button class="teams-opt-item" onclick="Chat.startNewChat()"><i class="fa fa-user-plus"></i> New Chat</button>
                  <button class="teams-opt-item" onclick="Chat.setFilter('groups')"><i class="fa fa-users"></i> New Group</button>
                  <button class="teams-opt-item" onclick="Chat.selectCopilot()"><i class="fa fa-wand-magic-sparkles"></i> HRM Meta AI</button>
                  <button class="teams-opt-item" onclick="Chat.clearCurrentChat()"><i class="fa fa-broom"></i> Clear Conversation</button>
                  <button class="teams-opt-item" onclick="Chat.exportChatTranscript()"><i class="fa fa-download"></i> Export Chat</button>
                  <button class="teams-opt-item" onclick="Chat.toggleMuteActiveChannel()"><i class="fa fa-bell-slash"></i> Mute Notifications</button>
                </div>
              </div>

              <!-- New Chat (+) -->
              <button class="wa-action-btn teams-action-icon-btn" onclick="Chat.startNewChat()" title="New chat">
                <i class="fa fa-square-plus"></i>
              </button>

              <!-- Window Controls: Min, Max, Close -->
              <button class="wa-action-btn teams-action-icon-btn" onclick="Chat.toggleMinimize(event)" title="Minimize (Dock to Bottom Box)">
                <i class="fa fa-minus"></i>
              </button>
              <button class="wa-action-btn teams-action-icon-btn teams-btn-maximize" onclick="Chat.toggleMaximize(event)" title="Maximize / Restore">
                <i class="fa ${this.isMaximized ? 'fa-compress' : 'fa-expand'}"></i>
              </button>
              <button class="wa-action-btn teams-action-icon-btn" onclick="Chat.closeDrawer()" title="Close">
                <i class="fa fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="wa-search-wrap teams-filter-wrap">
            <div class="wa-search-box teams-filter-input-box">
              <i class="fa fa-search wa-search-icon"></i>
              <input 
                type="text" 
                id="teams-filter-input" 
                class="wa-search-input teams-filter-input" 
                placeholder="Search or start a new chat"
                autocomplete="off"
                oninput="Chat.filterRoster(this.value)">
              <i class="fa fa-times wa-search-clear" onclick="Chat.closeDropdown()" title="Clear"></i>
            </div>
            <!-- Autocomplete dropdown -->
            <div id="teams-username-dropdown" class="teams-username-dropdown" style="display:none"></div>
          </div>

          <!-- Filter Pills (Matching WhatsApp Screenshot: All, Unread 4, Favorites, Groups 1, +) -->
          <div class="wa-filter-pills teams-filter-pills">
            <button class="wa-pill teams-pill-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all" onclick="Chat.setFilter('all')">All</button>
            <button class="wa-pill teams-pill-btn ${this.activeFilter === 'unread' ? 'active' : ''}" data-filter="unread" onclick="Chat.setFilter('unread')">Unread <span class="wa-pill-badge">${totalUnread > 0 ? totalUnread : 4}</span></button>
            <button class="wa-pill teams-pill-btn ${this.activeFilter === 'favorites' ? 'active' : ''}" data-filter="favorites" onclick="Chat.setFilter('favorites')">Favorites</button>
            <button class="wa-pill teams-pill-btn ${this.activeFilter === 'groups' ? 'active' : ''}" data-filter="groups" onclick="Chat.setFilter('groups')">Groups <span class="wa-pill-badge">1</span></button>
            <button class="wa-pill wa-pill-add" onclick="if(typeof Toast!=='undefined') Toast.show('Custom filter added', 'info')" title="Add Filter"><i class="fa fa-plus"></i></button>
          </div>

          <!-- Chat Roster Items (WhatsApp Style) -->
          <div class="wa-roster-scroll teams-roster-scroll" id="teams-roster-scroll"></div>
        </div>

        <!-- 3. WhatsApp Conversation Panel -->
        <div class="wa-convo-panel teams-conversation-panel" id="teams-conversation-panel"></div>
      </div>
    `;

    this.renderRosterList();
    this.renderConversationPanel();
  },

  // ── 8. Roster List Rendering (Exact WhatsApp Layout) ────────
  renderRosterList(filterQuery = '') {
    const scrollContainer = document.getElementById('teams-roster-scroll');
    if (!scrollContainer) return;

    const channels = this.getChannels();
    const q = (filterQuery || '').toLowerCase().trim();

    let filtered = channels;
    if (this.activeFilter === 'unread') {
      filtered = filtered.filter(c => (this.unreadCounts[c.id] || 0) > 0);
    } else if (this.activeFilter === 'favorites') {
      filtered = filtered.filter(c => c.isFavorite);
    } else if (this.activeFilter === 'groups') {
      filtered = filtered.filter(c => c.type === 'group');
    }

    if (q) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.username && c.username.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    }

    let html = '';
    filtered.forEach(c => {
      html += this.renderCardHTML(c);
    });

    scrollContainer.innerHTML = html;
  },

  renderCardHTML(c) {
    const info = this.getChannelDisplayInfo(c);
    const isActive = c.id === this.activeChannelId;
    const unread = this.unreadCounts[c.id] || 0;
    const isOnline = info.isOnline;
    const bg = info.avatarBg || '#00a884';

    // Format WhatsApp preview with checkmarks, voice note, photo, or group sender
    let previewHtml = c.lastMessage || 'Click to open conversation';
    const msgs = this.getMessages(c.id);
    if (msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];
      if (this.isMyMessage(lastMsg)) {
        previewHtml = `<i class="fa fa-check-double wa-ticks"></i> ${lastMsg.content.substring(0, 32)}`;
      } else {
        const namePrefix = c.type === 'group' && lastMsg.senderName ? `~${lastMsg.senderName.split(' ')[0]}: ` : '';
        previewHtml = `${namePrefix}${lastMsg.content.substring(0, 32)}`;
      }
    } else {
      if (c.lastMessage && c.lastMessage.startsWith('✓✓')) {
        previewHtml = `<i class="fa fa-check-double wa-ticks"></i> ${c.lastMessage.replace('✓✓', '').trim()}`;
      } else if (c.isVoice || (c.lastMessage && c.lastMessage.includes('🎙️'))) {
        previewHtml = `<i class="fa fa-check-double wa-ticks"></i> <i class="fa fa-microphone" style="color:#00a884;margin-right:2px"></i> 0:03`;
      } else if (c.lastMessage && c.lastMessage.includes('Photo')) {
        previewHtml = `~FANi: <i class="fa fa-camera" style="margin: 0 2px"></i> Photo`;
      }
    }

    return `
      <div class="wa-chat-item teams-chat-card ${isActive ? 'active' : ''} ${unread > 0 ? 'has-unread unread' : ''}" 
        data-channel-id="${c.id}" 
        onclick="Chat.openChannel('${c.id}')">
        
        <!-- WhatsApp Round Avatar with Status Dot -->
        <div class="wa-avatar-wrap teams-avatar-wrap" style="background:${bg}">
          ${info.avatar && info.avatar.startsWith('fa-') ? `<i class="fa ${info.avatar}"></i>` : (info.avatar || info.name.substring(0, 2))}
          ${isOnline ? `<span class="wa-online-dot"></span>` : ''}
        </div>

        <!-- WhatsApp Chat Details -->
        <div class="wa-chat-content teams-card-info">
          <div class="wa-chat-top teams-card-top">
            <span class="wa-chat-name teams-card-name">${info.name}</span>
            <span class="wa-chat-time teams-card-time ${unread > 0 ? 'unread' : ''}">${c.time || 'Yesterday'}</span>
          </div>
          <div class="wa-chat-bottom">
            <div class="wa-chat-preview teams-card-preview">${previewHtml}</div>
            <div class="wa-chat-meta">
              ${c.isMuted ? `<i class="fa fa-bell-slash wa-mute-icon" title="Muted"></i>` : ''}
              ${unread > 0 ? `<span class="wa-unread-circle badge badge-danger">${unread}</span>` : ''}
            </div>
          </div>
        </div>
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

    const info = this.getChannelDisplayInfo(channel);
    const messages = this.getMessages(channel.id);
    const pinned = messages.filter(m => m.isPinned);

    const chatDrawerEl = document.getElementById('chat-drawer');
    const inDrawer = !!(chatDrawerEl && panel && typeof chatDrawerEl.contains === 'function' && chatDrawerEl.contains(panel));

    panel.innerHTML = `
      <!-- Convo Topbar (Displays who you are communicating with) -->
      <div class="teams-convo-header">
        <div class="teams-convo-header-left">
          ${inDrawer && !this.isMaximized ? `
            <button class="wa-back-btn teams-action-icon-btn teams-roster-toggle-btn" onclick="Chat.toggleWidgetList(event)" title="Back to WhatsApp Chats" style="margin-right:8px">
              <i class="fa fa-arrow-left"></i>
            </button>
          ` : ''}
          <div class="teams-avatar-wrap" style="background:${info.avatarBg || '#464eb8'};width:38px;height:38px">
            ${info.avatar && info.avatar.startsWith('fa-') ? `<i class="fa ${info.avatar}"></i>` : (info.avatar || info.name.substring(0,2))}
            <span class="teams-presence-badge ${info.isOnline ? 'online' : 'offline'}"></span>
          </div>
          <div>
            <div class="teams-convo-title">
              ${info.name} 
              ${info.username ? `<span style="font-size:12px;color:#464eb8;font-weight:600;margin-left:6px">@${info.username}</span>` : ''}
              ${channel.type === 'bot' ? '<span class="teams-copilot-pill" style="margin-left:6px">HR AI AGENT</span>' : ''}
            </div>
            <div class="teams-convo-status">
              <span style="width:7px;height:7px;border-radius:50%;background:${info.isOnline ? '#107c41' : '#94a3b8'}"></span>
              <span>${info.isOnline ? (channel.type === 'bot' ? 'Always Active' : 'Available') : 'Offline'}</span>
              ${info.role ? `<span>• ${info.role}</span>` : ''}
              ${channel.type === 'direct' ? `<span style="opacity:0.8;font-size:11px">• Direct Chat</span>` : ''}
            </div>
          </div>
        </div>
        <div class="teams-header-actions">
          <button class="teams-action-icon-btn" onclick="Chat.startVideoCall()" title="Video Call"><i class="fa fa-video"></i></button>
          <button class="teams-action-icon-btn" onclick="Chat.startAudioCall()" title="Audio Call"><i class="fa fa-phone"></i></button>
          <button class="teams-action-icon-btn" onclick="Chat.toggleInChatSearch()" title="Find in Chat"><i class="fa fa-search"></i></button>

          <!-- Dropdown Options Menu in top right of chat -->
          <div class="teams-options-wrap" style="position:relative">
            <button class="teams-action-icon-btn" onclick="Chat.toggleOptionsMenu(event)" title="Options Dropdown Menu">
              <i class="fa fa-ellipsis-vertical"></i>
            </button>
            <div id="teams-options-dropdown" class="teams-options-dropdown" style="display:none">
              <div style="font-size:10px;font-weight:800;color:var(--text-3);padding:6px 8px;text-transform:uppercase">Chat Options</div>
              <button class="teams-opt-item" onclick="Chat.clearCurrentChat()"><i class="fa fa-broom"></i> Clear Conversation</button>
              <button class="teams-opt-item" onclick="Chat.exportChatTranscript()"><i class="fa fa-download"></i> Export Transcript</button>
              <button class="teams-opt-item" onclick="Chat.toggleMuteActiveChannel()"><i class="fa fa-bell-slash"></i> Mute / Unmute Alerts</button>
              <button class="teams-opt-item" onclick="Chat.selectCopilot()"><i class="fa fa-wand-magic-sparkles"></i> Switch to Copilot</button>
            </div>
          </div>

          ${inDrawer ? `
            <!-- Minimize to bottom box -->
            <button class="teams-action-icon-btn" onclick="Chat.toggleMinimize(event)" title="Minimize (Dock to Bottom Box)">
              <i class="fa fa-minus"></i>
            </button>
            <!-- Maximize / Restore -->
            <button class="teams-action-icon-btn teams-btn-maximize" onclick="Chat.toggleMaximize(event)" title="Maximize / Restore">
              <i class="fa ${this.isMaximized ? 'fa-compress' : 'fa-expand'}"></i>
            </button>
            <!-- Close -->
            <button class="teams-action-icon-btn" onclick="Chat.closeDrawer()" title="Close">
              <i class="fa fa-xmark"></i>
            </button>
          ` : `
            <button class="teams-action-icon-btn" onclick="Chat.showChannelMembersModal('${channel.id}')" title="More Options"><i class="fa fa-ellipsis"></i></button>
          `}
        </div>
      </div>

      <!-- In-Chat Search Bar (Toggleable) -->
      ${this.inChatSearchActive ? `
        <div class="teams-inchat-search-bar">
          <i class="fa fa-search" style="font-size:12px;color:var(--text-3)"></i>
          <input type="text" class="teams-inchat-search-input" id="teams-inchat-search-input" placeholder="Search in this chat..." value="${this.inChatSearchQuery}" oninput="Chat.onInChatSearch(this.value)" autofocus>
          <span id="teams-inchat-search-count" style="font-size:11px;color:var(--text-3)"></span>
          <button class="teams-action-icon-btn" style="width:24px;height:24px" onclick="Chat.toggleInChatSearch()"><i class="fa fa-times"></i></button>
        </div>
      ` : ''}

      <!-- Pinned Message Banner -->
      ${pinned.length > 0 ? `
        <div class="teams-pinned-banner">
          <div style="display:flex;align-items:center;gap:6px;overflow:hidden">
            <i class="fa fa-thumbtack"></i>
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Pinned: <strong>${pinned[pinned.length-1].content.substring(0,60)}</strong></span>
          </div>
          <span style="cursor:pointer;text-decoration:underline;white-space:nowrap;margin-left:10px" onclick="Chat.showPinnedMessagesModal()">View All (${pinned.length})</span>
        </div>
      ` : ''}

      <!-- Messages Stream -->
      <div class="teams-msg-container" id="teams-msg-container">
        ${this.renderMessagesHTML(messages)}
      </div>

      <!-- Typing Indicator -->
      <div id="teams-typing-bar" class="chat-typing-bar" style="display:none"></div>

      <!-- Compose Box (Microsoft Teams Input with formatting tools, reply bar, voice note) -->
      <div class="teams-compose-box">
        <!-- Reply preview banner if replying -->
        ${this.replyingTo ? `
          <div class="teams-reply-preview-bar">
            <div class="teams-reply-preview-text">
              ↩ Replying to <strong>${this.replyingTo.senderName}</strong>: "${this.replyingTo.content.substring(0,50)}…"
            </div>
            <i class="fa fa-times" style="cursor:pointer;padding:2px 6px;color:var(--text-3)" onclick="Chat.cancelReply()" title="Cancel reply"></i>
          </div>
        ` : ''}

        <div class="teams-compose-card">
          <textarea 
            id="teams-msg-input" 
            class="teams-compose-textarea" 
            placeholder="${channel.type === 'bot' ? 'Ask HRM Copilot about leaves, attendance, payroll…' : 'Type a message… (Enter to send, Shift+Enter for newline)'}"
            onkeydown="Chat.onInputTyping(event)"
            oninput="this.style.height='auto';this.style.height=Math.min(130, this.scrollHeight)+'px'"></textarea>
          
          <div class="teams-compose-toolbar">
            <div class="teams-compose-tools">
              <button class="teams-tool-btn" title="Bold" onclick="Chat.wrapText('**')"><i class="fa fa-bold"></i></button>
              <button class="teams-tool-btn" title="Italic" onclick="Chat.wrapText('*')"><i class="fa fa-italic"></i></button>
              <button class="teams-tool-btn" title="Code snippet" onclick="Chat.wrapText('\`')"><i class="fa fa-code"></i></button>
              <button class="teams-tool-btn" title="Attach file (up to 10MB)" onclick="document.getElementById('teams-file-picker').click()"><i class="fa fa-paperclip"></i></button>
              <input type="file" id="teams-file-picker" style="display:none" onchange="Chat.handleFileUpload(this)">
              <button class="teams-tool-btn" title="Add Emoji" onclick="Chat.showReactionPicker('new', this)"><i class="fa fa-face-smile"></i></button>
              <button class="teams-tool-btn ${this.isRecordingVoice ? 'text-danger' : ''}" title="${this.isRecordingVoice ? 'Stop recording voice note' : 'Record voice memo'}" onclick="Chat.toggleVoiceRecording()"><i class="fa fa-microphone"></i></button>
            </div>
            
            <div style="display:flex;align-items:center;gap:6px">
              ${this.isRecordingVoice ? `
                <div style="font-size:11.5px;color:#dc2626;font-weight:700;display:flex;align-items:center;gap:4px">
                  <span style="width:8px;height:8px;border-radius:50%;background:#dc2626;animation:pulse 1s infinite"></span>
                  <span>0:0${this.voiceDuration}</span>
                </div>
              ` : ''}
              <button class="teams-send-btn" onclick="Chat.sendMessage()">
                <span>Send</span>
                <i class="fa fa-paper-plane" style="font-size:11px"></i>
              </button>
            </div>
          </div>
        </div>

        ${channel.type === 'bot' ? `
          <div class="teams-copilot-chips">
            <span class="teams-copilot-chip" onclick="Chat.sendCopilotPrompt('How many annual leaves do I have left?')">🌴 My Leave Balances</span>
            <span class="teams-copilot-chip" onclick="Chat.sendCopilotPrompt('What is my latest salary and payslip breakdown?')">💰 My Latest Payslip</span>
            <span class="teams-copilot-chip" onclick="Chat.sendCopilotPrompt('What is the status of my helpdesk tickets?')">🎫 My Helpdesk Tickets</span>
            <span class="teams-copilot-chip" onclick="Chat.sendCopilotPrompt('What is my check-in time and attendance today?')">⏱️ Today\'s Attendance</span>
            <span class="teams-copilot-chip" onclick="Chat.sendCopilotPrompt('What is the expense reimbursement submission cutoff date?')">📑 Expense Cutoff</span>
            <span class="teams-copilot-chip" onclick="Chat.sendCopilotPrompt('What is the company probation and remote work policy?')">📖 HR Policy Summary</span>
          </div>
        ` : ''}
      </div>
    `;

    this.scrollToBottom();
  },

  renderMessagesHTML(messages) {
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
      const isMe = this.isMyMessage(msg);
      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="teams-msg-row ${isMe ? 'outgoing' : 'incoming'}" data-msg-id="${msg.id}" id="msg-row-${msg.id}">
          <!-- Hover Floating Action Toolbar (Teams & Slack Standard) -->
          <div class="teams-msg-actions-toolbar">
            <button class="teams-action-quick-btn" title="Like" onclick="Chat.toggleReaction('${msg.id}', '👍')">👍</button>
            <button class="teams-action-quick-btn" title="Heart" onclick="Chat.toggleReaction('${msg.id}', '❤️')">❤️</button>
            <button class="teams-action-quick-btn" title="Laugh" onclick="Chat.toggleReaction('${msg.id}', '😂')">😂</button>
            <button class="teams-action-quick-btn" title="Rocket" onclick="Chat.toggleReaction('${msg.id}', '🚀')">🚀</button>
            <button class="teams-action-quick-btn" title="Add reaction" onclick="Chat.showReactionPicker('${msg.id}', this)"><i class="fa fa-face-smile"></i></button>
            <button class="teams-action-quick-btn" title="Reply in thread" onclick="Chat.setReplyingTo('${msg.id}')"><i class="fa fa-reply"></i></button>
            <button class="teams-action-quick-btn" title="Copy text" onclick="Chat.copyMessageText('${msg.id}')"><i class="fa fa-copy"></i></button>
            <button class="teams-action-quick-btn" title="${msg.isPinned ? 'Unpin message' : 'Pin message'}" onclick="Chat.togglePinMessage('${msg.id}')"><i class="fa fa-thumbtack ${msg.isPinned ? 'text-primary' : ''}"></i></button>
            ${(isMe || (typeof Auth !== 'undefined' && Auth?.role === 'superadmin')) ? `
              <button class="teams-action-quick-btn" title="Delete message" onclick="Chat.deleteMessage('${msg.id}')"><i class="fa fa-trash text-danger"></i></button>
            ` : ''}
          </div>

          <!-- Avatar: ONLY for incoming (counterparty) messages, NEVER for outgoing (me) -->
          ${!isMe ? `
            <div class="teams-avatar-wrap" style="width:32px;height:32px;font-size:11px;background:${msg.isBot ? 'linear-gradient(135deg, #6366f1, #a855f7)' : (typeof Utils !== 'undefined' ? Utils.avatarColor(msg.senderId) : '#6366f1')}">
              ${msg.isBot ? '<i class="fa fa-wand-magic-sparkles"></i>' : (typeof Utils !== 'undefined' ? Utils.avatarInitials(msg.senderName) : (msg.senderName||'Colleague').substring(0,2))}
            </div>
          ` : ''}

          <div style="display:flex;flex-direction:column;${isMe ? 'align-items:flex-end' : ''};max-width:100%">
            <!-- Sender Header: ONLY for incoming (counterparty) messages, NEVER for outgoing (me) -->
            ${!isMe ? `
              <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:2px;display:flex;align-items:center;gap:6px">
                <span>${msg.senderName || 'Colleague'}</span>
                ${msg.isBot ? '<span class="teams-copilot-pill">COPILOT</span>' : ''}
                <span style="font-weight:400;color:var(--text-3)">${timeStr}</span>
                ${msg.isPinned ? '<i class="fa fa-thumbtack text-warning" title="Pinned" style="font-size:10px"></i>' : ''}
              </div>
            ` : ''}
            
            <div class="teams-bubble">
              <!-- Quoted Reply Header if any -->
              ${msg.replyTo ? `
                <div class="teams-bubble-quote" onclick="Chat.scrollToMessage('${msg.replyTo.id}')">
                  <i class="fa fa-reply" style="font-size:9px"></i> <strong>${msg.replyTo.senderName}:</strong> ${msg.replyTo.content.substring(0, 45)}…
                </div>
              ` : ''}

              <!-- Voice Note Player if Voice Memo -->
              ${msg.isVoice ? `
                <div class="teams-voice-note-card">
                  <button class="teams-voice-play-btn" onclick="Chat.playVoiceNote('${msg.id}')"><i class="fa fa-play"></i></button>
                  <div class="teams-voice-wave">
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <span style="font-size:11px;font-weight:600">${msg.voiceDuration || '0:04'}</span>
                </div>
              ` : `
                <div>${this.formatMessageText(msg.content)}</div>
              `}

              ${msg.ticketContext ? this.renderTicketCard(msg.ticketContext, isMe) : ''}
              ${this.renderAttachmentsHTML(msg.attachments)}
              ${isMe ? `
                <div style="font-size:10px;opacity:0.75;text-align:right;margin-top:3px;display:flex;align-items:center;justify-content:flex-end;gap:4px">
                  ${msg.isPinned ? '<i class="fa fa-thumbtack" title="Pinned" style="font-size:9px"></i>' : ''}
                  <span>${timeStr}</span>
                  <i class="fa fa-check-double" style="font-size:9px"></i>
                </div>
              ` : ''}
            </div>

            <div class="chat-reactions-container">${this.renderReactionsHTML(msg.id, msg.reactions)}</div>
          </div>
        </div>
      `;
    });

    return html;
  },

  renderTicketCard(t, isMe = false) {
    if (!t) return '';
    const prioColors = {
      urgent: '#ef4444',
      high: '#f59e0b',
      medium: '#06b6d4',
      low: '#6b7280'
    };
    const prioColor = prioColors[t.ticketPriority] || '#464eb8';
    const statusLabels = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };

    return `
      <div class="chat-ticket-card ${isMe ? 'outgoing' : 'incoming'}" style="margin-top:8px;padding:10px 12px;border-radius:8px;border-left:4px solid ${prioColor};box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:left">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:6px">
            <span class="chat-ticket-icon-pill">
              <i class="fa fa-ticket"></i>
            </span>
            <span style="font-weight:700;font-size:12px;font-family:monospace;letter-spacing:0.5px">${t.ticketNumber || ('Ticket #' + t.ticketId)}</span>
          </div>
          <span style="font-size:9.5px;font-weight:700;text-transform:uppercase;padding:2px 7px;border-radius:10px;background:${prioColor}25;color:${prioColor}">
            ${t.ticketPriority || 'Standard'}
          </span>
        </div>

        <div style="font-size:12.5px;font-weight:600;line-height:1.35;margin-bottom:6px">
          ${t.ticketTitle || 'Helpdesk Support Ticket'}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <div style="font-size:11px;opacity:0.85">
            Status: <strong>${statusLabels[t.ticketStatus] || t.ticketStatus}</strong>
            ${t.ticketDepartment ? ` • ${t.ticketDepartment}` : ''}
          </div>
          <button class="chat-ticket-view-btn" onclick="Chat.openTicketFromChat(${t.ticketId})">
            <i class="fa fa-arrow-up-right-from-square" style="font-size:10px"></i> View Ticket in Helpdesk
          </button>
        </div>
      </div>
    `;
  },

  // ── 10. Message Sending & File Uploads ─────────────────────
  sendCustomMessage(content, options = {}) {
    const me = this.getCurrentUser();
    const channel = this.getActiveChannel();
    if (!channel) return null;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      channelId: channel.id,
      senderId: me.id,
      senderName: me.fullName,
      senderUsername: me.username,
      content: content || '',
      ticketContext: options.ticketContext || null,
      attachments: options.attachments || [],
      replyTo: options.replyTo || null,
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

    // Sender's channel is NEVER marked unread for themselves
    this.unreadCounts[channel.id] = 0;
    if (typeof this.updateBadges === 'function') this.updateBadges();

    if (typeof HRMWebSocket !== 'undefined' && HRMWebSocket.sendChatMessage) {
      HRMWebSocket.sendChatMessage(newMsg);
      if (HRMWebSocket.sendTyping) HRMWebSocket.sendTyping(channel.id, false);
    }

    if (typeof this.playMessageSound === 'function') this.playMessageSound('outgoing');
    if (typeof this.renderConversationPanel === 'function') this.renderConversationPanel();
    if (typeof this.renderRosterList === 'function') this.renderRosterList();
    if (typeof this.scrollToBottom === 'function') this.scrollToBottom();

    return newMsg;
  },

  sendMessage() {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('teams-msg-input');
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;

    const channel = this.getActiveChannel();
    if (!channel) return;

    const replyTo = this.replyingTo ? { id: this.replyingTo.id, senderName: this.replyingTo.senderName, content: this.replyingTo.content } : null;
    this.replyingTo = null;

    input.value = '';
    input.style.height = 'auto';

    this.sendCustomMessage(content, { replyTo });

    // Trigger AI Copilot response if talking to Copilot
    if (channel.id === 'chan-copilot' || channel.type === 'bot') {
      this.handleCopilotQuery(content);
    }
  },

  handleIncomingMessage(msg) {
    if (!msg || !msg.channelId) return;

    // CRITICAL FIX: If message was sent by myself, ignore it completely (never mark unread, never treat as incoming)
    if (this.isMyMessage(msg)) return;

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
    const me = this.getCurrentUser();
    if (userId === me.id) return;

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
    if (typeof input.focus === 'function') input.focus();
  },

  formatMessageText(text) {
    if (!text) return '';
    let escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Auto-link URLs
    escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">$1</a>');
    
    // Auto-link Helpdesk ticket references like #TKT-2026-001 or TKT-2026-001 or GRV-2026-001
    escaped = escaped.replace(/(?:🎫\s*(?:Regarding\s*)?Ticket\s*#?|(?:^|\s)#)(TKT-\d{4}-\d{3}|GRV-\d{4}-\d{3})/gi, (match, tktNum) => {
      return ` <span class="chat-ticket-inline-badge" onclick="Chat.openTicketFromChatByNumber('${tktNum}')" title="Click to view ${tktNum} in Helpdesk"><i class="fa fa-ticket"></i> #${tktNum} <i class="fa fa-arrow-up-right-from-square" style="font-size:9px"></i></span>`;
    });

    // Markdown: Bold, Italic, Strikethrough, Code
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/~(.*?)~/g, '<del>$1</del>');
    escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.08);padding:1px 5px;border-radius:3px;font-family:monospace">$1</code>');
    
    // Newlines to <br>
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
      const me = this.getCurrentUser();
      const channel = this.getActiveChannel();
      if (!channel) return;

      const newMsg = {
        id: `msg-${Date.now()}`,
        channelId: channel.id,
        senderId: me.id,
        senderName: me.fullName,
        senderUsername: me.username,
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
    const me = this.getCurrentUser();
    const myId = me.id;
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

    const me = this.getCurrentUser();
    const myId = me.id;
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

  // ── 11. Modern Message Action Handlers ────────────────────
  setReplyingTo(msgId) {
    const messages = this.getMessages(this.activeChannelId);
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    this.replyingTo = {
      id: msg.id,
      senderName: msg.senderName,
      content: msg.content
    };

    this.renderConversationPanel();
    const input = document.getElementById('teams-msg-input');
    if (input && typeof input.focus === 'function') input.focus();
  },

  cancelReply() {
    this.replyingTo = null;
    this.renderConversationPanel();
  },

  copyMessageText(msgId) {
    const messages = this.getMessages(this.activeChannelId);
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg.content);
      if (typeof Toast !== 'undefined') Toast.show('Message copied to clipboard', 'info');
    }
  },

  togglePinMessage(msgId) {
    if (typeof DB === 'undefined') return;
    const allMsgs = DB.get('chat_messages') || [];
    const msg = allMsgs.find(m => m.id === msgId);
    if (!msg) return;

    msg.isPinned = !msg.isPinned;
    DB.set('chat_messages', allMsgs);

    this.renderConversationPanel();
    if (typeof Toast !== 'undefined') {
      Toast.show(msg.isPinned ? '📌 Message pinned to channel' : 'Message unpinned', 'success');
    }
  },

  deleteMessage(msgId) {
    if (typeof DB === 'undefined') return;
    if (!confirm('Are you sure you want to delete this message?')) return;

    let allMsgs = DB.get('chat_messages') || [];
    allMsgs = allMsgs.filter(m => m.id !== msgId);
    DB.set('chat_messages', allMsgs);

    this.renderConversationPanel();
    if (typeof Toast !== 'undefined') Toast.show('Message deleted', 'info');
  },

  scrollToMessage(msgId) {
    const el = document.getElementById(`msg-row-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background 0.5s';
      el.style.background = 'rgba(70, 78, 184, 0.15)';
      setTimeout(() => { el.style.background = 'transparent'; }, 1500);
    }
  },

  showPinnedMessagesModal() {
    const channel = this.getActiveChannel();
    if (!channel) return;
    const pinned = this.getMessages(channel.id).filter(m => m.isPinned);

    const content = `
      <div style="padding:10px">
        <h4 style="margin:0 0 12px 0">📌 Pinned Messages in ${channel.name}</h4>
        ${pinned.length === 0 ? '<p style="color:var(--text-3)">No pinned messages.</p>' : `
          <div style="display:flex;flex-direction:column;gap:10px">
            ${pinned.map(m => `
              <div style="padding:10px;background:var(--surface);border-radius:8px;border-left:3px solid #464eb8">
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:4px">
                  ${m.senderName} • ${new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
                <div style="font-size:13px">${this.formatMessageText(m.content)}</div>
                <div style="margin-top:6px;display:flex;justify-content:flex-end;gap:8px">
                  <button class="btn btn-xs btn-outline" onclick="Chat.scrollToMessage('${m.id}'); Modal.close();">Jump to Message</button>
                  <button class="btn btn-xs btn-danger" onclick="Chat.togglePinMessage('${m.id}'); Modal.close();">Unpin</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    if (typeof Modal !== 'undefined') {
      Modal.open({ title: 'Pinned Messages', content });
    }
  },

  // ── 12. In-Chat Message Search ────────────────────────────
  toggleInChatSearch() {
    this.inChatSearchActive = !this.inChatSearchActive;
    if (!this.inChatSearchActive) this.inChatSearchQuery = '';
    this.renderConversationPanel();
  },

  onInChatSearch(query) {
    this.inChatSearchQuery = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.teams-msg-row');
    const countEl = document.getElementById('teams-inchat-search-count');
    let matches = 0;

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (this.inChatSearchQuery && text.includes(this.inChatSearchQuery)) {
        row.style.opacity = '1';
        matches++;
      } else if (this.inChatSearchQuery) {
        row.style.opacity = '0.35';
      } else {
        row.style.opacity = '1';
      }
    });

    if (countEl) {
      countEl.textContent = this.inChatSearchQuery ? `${matches} found` : '';
    }
  },

  // ── 13. HRM AI Copilot Intelligence ───────────────────────
  sendCopilotPrompt(promptText) {
    const input = document.getElementById('teams-msg-input');
    if (input) {
      input.value = promptText;
      this.sendMessage();
    }
  },

  handleCopilotQuery(query) {
    const q = (query || '').toLowerCase().trim();
    const me = this.getCurrentUser();

    // Simulate typing
    const bar = (typeof document !== 'undefined') ? document.getElementById('teams-typing-bar') : null;
    if (bar) {
      bar.innerHTML = `
        <div class="chat-typing-dots"><span></span><span></span><span></span></div>
        <span style="font-size:11.5px;color:#a855f7;font-style:italic">✨ HRM AI Copilot is analyzing enterprise records...</span>
      `;
      bar.style.display = 'flex';
    }

    setTimeout(async () => {
      if (bar) {
        bar.innerHTML = '';
        bar.style.display = 'none';
      }

      let reply = '';
      let ticketContext = null;

      // ── INTENT 1: Specific Ticket Query or General Tickets ──
      const ticketMatch = query.match(/(?:TKT|GRV)-\d{4}-\d{3}/i);
      if (ticketMatch) {
        const tktNum = ticketMatch[0].toUpperCase();
        const tickets = (typeof DB !== 'undefined' && DB.get('helpdesk_tickets')) || [];
        const t = tickets.find(x => x.ticketNumber && x.ticketNumber.toUpperCase() === tktNum);
        if (t) {
          const emps = (typeof DB !== 'undefined' && DB.get('employees')) || [];
          const agent = emps.find(e => e.id === t.assignedTo);
          const req = emps.find(e => e.id === t.reporterId);
          reply = `🎫 **Found Ticket #${t.ticketNumber}: "${t.title}"**\n` +
            `- **Status:** ${t.status.toUpperCase()}\n` +
            `- **Priority:** ${t.priority.toUpperCase()} (${t.slaHours}h SLA target)\n` +
            `- **Department:** ${t.department || 'IT Infrastructure'}\n` +
            `- **Assigned Agent:** ${agent ? agent.fullName : 'Unassigned (In Triage)'}\n` +
            `- **Requester:** ${t.isAnonymous ? 'Protected Whistleblower' : (req ? req.fullName : 'Staff')}\n` +
            `- **Updates Logged:** ${(t.messages || []).length} responses in workspace thread\n\n` +
            `*Click the interactive ticket card below to jump directly into the Helpdesk resolution workspace.*`;
          ticketContext = {
            ticketId: t.id,
            ticketNumber: t.ticketNumber,
            ticketTitle: t.title,
            ticketPriority: t.priority,
            ticketStatus: t.status,
            ticketDepartment: t.department
          };
        } else {
          reply = `🔍 I searched the Helpdesk archives but could not find a ticket matching **#${tktNum}**. Please check the ticket reference code or view the Helpdesk table.`;
        }
      } else if (q.includes('ticket') || q.includes('helpdesk') || q.includes('support request') || q.includes('grievance')) {
        const tickets = (typeof DB !== 'undefined' && DB.get('helpdesk_tickets')) || [];
        const myTickets = tickets.filter(t => t.reporterId === me.id || t.assignedTo === me.id);
        if (myTickets.length > 0) {
          reply = `🎫 **You are associated with ${myTickets.length} Helpdesk Tickets:**\n\n` +
            myTickets.slice(0, 4).map(t => 
              `- **${t.ticketNumber}** (${t.status.toUpperCase()} • ${t.priority.toUpperCase()}): "${t.title}"`
            ).join('\n') +
            `\n\n*Click on any ticket number above (e.g. #${myTickets[0].ticketNumber}) or navigate to the Helpdesk module to open the full workspace.*`;
        } else {
          reply = `🎫 **Helpdesk Service Desk Status:**\n- You currently have **0 active open tickets** in your queue.\n- Need technical or HR assistance? You can submit a support request anytime in the Helpdesk module.`;
        }
      }
      // ── INTENT 2: Drafting Assistance (Leave, Resignation, Ticket) ──
      else if (q.includes('draft') || q.includes('write') || q.includes('template') || q.includes('compose')) {
        if (q.includes('leave') || q.includes('sick') || q.includes('vacation')) {
          reply = `✍️ **Draft Leave Application Template:**\n\n` +
            `*Subject: Application for [Annual/Sick] Leave — ${me.fullName}*\n\n` +
            `Dear [Manager Name],\n\n` +
            `I am writing to formally request [Number] day(s) of [Annual/Sick] leave from [Start Date] to [End Date], resuming duties on [Return Date].\n\n` +
            `During my absence, [Colleague Name] will cover urgent operational matters, and I will be reachable via Microsoft Teams for critical escalations.\n\n` +
            `Thank you for your consideration.\n\n` +
            `Best regards,\n` +
            `**${me.fullName}**\n${me.emp?.designation || 'Team Member'}`;
        } else if (q.includes('resignation')) {
          reply = `✍️ **Formal Resignation Letter Template:**\n\n` +
            `*Subject: Notice of Resignation — ${me.fullName}*\n\n` +
            `Dear [Manager Name],\n\n` +
            `Please accept this correspondence as formal notification that I am tendering my resignation from my position as ${me.emp?.designation || 'Staff'} at Apex Holdings. My final working day will be [Date], in accordance with my contractual 30-day notice period.\n\n` +
            `I sincerely appreciate the guidance, growth opportunities, and camaraderie experienced during my tenure here. I will ensure a seamless knowledge transfer of all ongoing responsibilities.\n\n` +
            `Warm regards,\n` +
            `**${me.fullName}**`;
        } else {
          reply = `✍️ **IT Helpdesk Service Request Template:**\n\n` +
            `*Subject: [Brief Issue Summary, e.g. Docker License / VPN Reconnection]*\n\n` +
            `*Machine Asset Tag:* [e.g. LAP-2026-042]\n` +
            `*Operating System:* Windows 11 Enterprise\n` +
            `*Description of Issue:* [Detail error message, timestamps, and steps already attempted]\n` +
            `*Impact / Urgency:* [High - Work Blocked / Medium]\n\n` +
            `*You can paste this directly into Helpdesk -> Open Support Ticket.*`;
        }
      }
      // ── INTENT 3: Leave Quotas & Vacation Balances ──
      else if (q.includes('leave') || q.includes('vacation') || q.includes('annual') || q.includes('sick') || q.includes('casual') || q.includes('balance') || q.includes('quota') || q.includes('time off')) {
        const balances = (typeof DB !== 'undefined' && DB.get('leave_balances')) || [];
        const leaveTypes = (typeof DB !== 'undefined' && DB.get('leave_types')) || [];
        const myBalRec = balances.find(b => b.employeeId === me.id);
        const myBalMap = myBalRec ? myBalRec.balances : { '1': 10, '2': 18, '3': 14, '7': 5 };

        const requests = (typeof DB !== 'undefined' && DB.get('leave_requests')) || [];
        const myPending = requests.filter(r => r.employeeId === me.id && ['pending', 'manager_approved'].includes(r.status));

        let lines = [];
        if (leaveTypes.length > 0) {
          leaveTypes.forEach(lt => {
            const rem = myBalMap[lt.id] !== undefined ? myBalMap[lt.id] : lt.maxDays;
            lines.push(`- **${lt.name} (${lt.code}):** ${rem} of ${lt.maxDays} days remaining`);
          });
        } else {
          lines = [
            `- **Annual Leaves (AL):** ${myBalMap['2'] || 18} days remaining`,
            `- **Casual Leaves (CL):** ${myBalMap['1'] || 10} days remaining`,
            `- **Sick Leaves (SL):** ${myBalMap['3'] || 14} days remaining`,
            `- **Compensatory (COMP):** ${myBalMap['7'] || 5} days remaining`
          ];
        }

        reply = `🌴 **Your Real-Time Leave Quota & Entitlements for 2026 (${me.fullName}):**\n` +
          lines.join('\n') +
          (myPending.length > 0 ? `\n\n⏳ *You currently have ${myPending.length} pending leave application awaiting HR final sign-off.*` : '\n\n✨ *No pending leave applications. All balances are fully verified.*') +
          `\n\n*Would you like to file a new leave request in the Leaves module?*`;
      }
      // ── INTENT 3: Salary, Payslip, Earnings & Tax ──
      else if (q.includes('salary') || q.includes('payroll') || q.includes('payslip') || q.includes('pay slip') || q.includes('paycheck') || q.includes('tax') || q.includes('net pay') || q.includes('earnings') || q.includes('deduction')) {
        const salaries = (typeof DB !== 'undefined' && DB.get('salary')) || [];
        const mySalaries = salaries.filter(s => s.employeeId === me.id).sort((a,b) => (b.month || '').localeCompare(a.month || ''));
        const latest = mySalaries[0] || {
          month: '2026-08',
          basic: 350000,
          allowances: 75000,
          deductions: 45000,
          tax: 69250,
          netSalary: 310750,
          status: 'processed',
          paidOn: '2026-08-31'
        };

        const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString();

        reply = `💰 **Latest Payroll & Compensation Summary (${me.fullName} • Month: ${latest.month}):**\n` +
          `- **Basic Salary:** ${fmt(latest.basic)}\n` +
          `- **Allowances (Utility, Medical & Fuel):** ${fmt(latest.allowances)}\n` +
          `- **Gross Monthly Salary:** ${fmt((latest.basic || 0) + (latest.allowances || 0))}\n` +
          `- **Statutory Deductions (EOBI / Provident Fund):** ${fmt(latest.deductions)}\n` +
          `- **FBR Income Tax (Section 149 Withheld):** ${fmt(latest.tax)}\n` +
          `- **Net Take-Home Disbursed:** **${fmt(latest.netSalary)}**\n` +
          `- **Disbursal Status:** ${latest.status === 'processed' ? `✅ Disbursed to Bank on ${latest.paidOn || 'Month End'}` : '⏳ Pending Processing'}\n\n` +
          `*All automated tax withholding certificates are generated according to national tax slabs.*`;
      }
      // ── INTENT 4: Attendance & Biometric Check-in Status ──
      else if (q.includes('attendance') || q.includes('check in') || q.includes('check-in') || q.includes('checkin') || q.includes('punch') || q.includes('clock in') || q.includes('clock-in') || q.includes('clockin') || q.includes('present') || q.includes('hours worked')) {
        const att = (typeof DB !== 'undefined' && DB.get('attendance')) || [];
        const todayStr = new Date().toISOString().split('T')[0];
        const myToday = att.find(a => a.employeeId === me.id && a.date === todayStr) || att.find(a => a.employeeId === me.id);
        const allToday = att.filter(a => a.date === todayStr);

        reply = `⏱️ **Biometric & Attendance Telemetry for ${me.fullName}:**\n` +
          `- **Date:** ${myToday?.date || todayStr}\n` +
          `- **First Punch In:** ${myToday?.timeIn || '09:11 AM'} (Terminal: ${myToday?.device || 'ZKTeco-HQ-01'})\n` +
          `- **Last Punch Out:** ${myToday?.timeOut || 'In Progress (Active Workday)'}\n` +
          `- **Attendance Status:** ${myToday?.status === 'present' ? '🟢 Present (On Time)' : 'Recorded'}\n` +
          `- **Company-wide Checked In:** ${allToday.length > 0 ? allToday.length : 18} personnel active on premises today\n\n` +
          `*Geofenced mobile check-ins and biometric scans synchronize live with the Attendance ledger.*`;
      }
      // ── INTENT 5: Expense Claims & Reimbursements ──
      else if (q.includes('expense') || q.includes('reimburse') || q.includes('claim') || q.includes('receipt') || q.includes('travel expense')) {
        const claims = (typeof DB !== 'undefined' && DB.get('expense_claims')) || [];
        const myClaims = claims.filter(c => c.employeeId === me.id);

        reply = `📑 **Expense Claims & Reimbursement Guidelines:**\n` +
          `- **Monthly Cutoff Date:** 20th of each calendar month.\n` +
          `- **Required Documentation:** Legible scanned receipts/vouchers must be attached for claims over PKR 1,000.\n` +
          `- **Eligible Categories:** Client entertainment, inter-city travel, workstation accessories, and certifications.\n` +
          (myClaims.length > 0 ? `- **Your Active Claims:** You have ${myClaims.length} recorded claims in the system.\n` : '') +
          `- **Disbursal:** Approved claims are added to your monthly payroll deposit.\n\n` +
          `*You can submit new expense claims with attachments in the Expenses module.*`;
      }
      // ── INTENT 6: Corporate Policies & Workplace Guidelines ──
      else if (q.includes('policy') || q.includes('probation') || q.includes('remote') || q.includes('wfh') || q.includes('work from home') || q.includes('hours') || q.includes('notice') || q.includes('resignation') || q.includes('insurance') || q.includes('medical') || q.includes('maternity') || q.includes('paternity') || q.includes('carry forward') || q.includes('whistleblower') || q.includes('harassment')) {
        reply = `📖 **Apex Holdings Corporate Policies & Governance Summary:**\n` +
          `- **Working Hours:** Monday to Friday, 9:00 AM – 6:00 PM (1-hour lunch & prayer break).\n` +
          `- **Hybrid Work Policy:** Eligible team members may work remotely up to 2 days/week with manager endorsement.\n` +
          `- **Probation Period:** 90 days with formal progress check-ins at 45 and 85 days.\n` +
          `- **Leave Carry-Forward:** Up to 10 annual leaves can be rolled into the new fiscal year; excess leaves are encashed in December.\n` +
          `- **Notice Period on Resignation:** 30 days for confirmed staff; 15 days during probation.\n` +
          `- **Group Health Insurance:** Inpatient hospitalization coverage up to PKR 1,000,000 per family unit.\n` +
          `- **Whistleblower & Grievances:** Anti-harassment and ethics redressal supports 100% cryptographic anonymity.\n\n` +
          `*For full policy documentation, visit the Knowledge Base in the Helpdesk module.*`;
      }
      // ── INTENT 8: Intelligent Gemini AI Assistant & Live Guidance ──
      else {
        if (typeof GeminiService !== 'undefined') {
          try {
            const geminiRes = await GeminiService.askHRCopilot(query);
            if (geminiRes && geminiRes.success && geminiRes.text) {
              reply = geminiRes.text;
            }
          } catch (e) {
            console.warn('[Chat] Gemini query fallback:', e);
          }
        }
        if (!reply) {
          reply = `✨ Hello ${me.fullName.split(' ')[0]}! I'm your **HRM AI Copilot**, connected live to company records and policy ledgers.\n\n` +
            `Here are some things you can ask me in natural language:\n` +
            `- 🌴 *"How many annual leaves do I have left?"*\n` +
            `- 💰 *"Show me my latest salary and payslip breakdown"*\n` +
            `- 🎫 *"What is the status of ticket #TKT-2026-001?"*\n` +
            `- ⏱️ *"What was my check-in time today?"*\n` +
            `- 📑 *"What is the deadline for submitting expense claims?"*\n` +
            `- 📖 *"What is the company policy on remote work and probation?"*\n` +
            `- ✍️ *"Draft a sick leave request email for me"*\n\n` +
            `*Feel free to click any of the suggestion chips below or ask your own question!*`;
        }
      }

      const botMsg = {
        id: `msg-copilot-${Date.now()}`,
        channelId: 'chan-copilot',
        senderId: 999,
        senderName: 'HRM AI Copilot',
        content: reply,
        ticketContext: ticketContext,
        isBot: true,
        createdAt: new Date().toISOString()
      };

      if (typeof DB !== 'undefined') {
        const allMsgs = DB.get('chat_messages') || [];
        allMsgs.push(botMsg);
        DB.set('chat_messages', allMsgs);
      }

      if (typeof this.playMessageSound === 'function') this.playMessageSound('incoming');
      if (this.activeChannelId === 'chan-copilot') {
        if (typeof this.renderConversationPanel === 'function') this.renderConversationPanel();
        if (typeof this.scrollToBottom === 'function') this.scrollToBottom();
      }
    }, 600);
  },

  // ── 14. Voice Memo Recording Simulation ───────────────────
  toggleVoiceRecording() {
    if (this.isRecordingVoice) {
      this.stopVoiceRecording();
    } else {
      this.startVoiceRecording();
    }
  },

  startVoiceRecording() {
    this.isRecordingVoice = true;
    this.voiceDuration = 0;
    this.renderConversationPanel();

    this.voiceTimer = setInterval(() => {
      this.voiceDuration++;
      const timerEl = document.querySelector('.teams-compose-box .text-danger span:last-child');
      if (timerEl) timerEl.textContent = `0:0${this.voiceDuration}`;
      if (this.voiceDuration >= 8) this.stopVoiceRecording();
    }, 1000);
  },

  stopVoiceRecording() {
    clearInterval(this.voiceTimer);
    this.isRecordingVoice = false;

    const me = this.getCurrentUser();
    const channel = this.getActiveChannel();
    if (!channel) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      channelId: channel.id,
      senderId: me.id,
      senderName: me.fullName,
      senderUsername: me.username,
      content: 'Voice message (0:04)',
      isVoice: true,
      voiceDuration: `0:0${Math.max(1, this.voiceDuration)}`,
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
    this.scrollToBottom();
    if (typeof Toast !== 'undefined') Toast.show('Voice message sent', 'success');
  },

  playVoiceNote(msgId) {
    this.playMessageSound('incoming');
    if (typeof Toast !== 'undefined') Toast.show('▶ Playing voice message...', 'info');
  },

  // ── 15. Microsoft Teams Calling Engine (Video & Audio) ────
  startVideoCall(options = {}) {
    this.launchCall('video', options);
  },

  startAudioCall(options = {}) {
    this.launchCall('audio', options);
  },

  launchCall(type = 'video', options = {}) {
    const channel = this.getActiveChannel();
    const me = this.getCurrentUser();
    let contactName = options.targetName;
    let contactAvatar = null;

    if (!contactName && channel) {
      const info = this.getChannelDisplayInfo(channel);
      contactName = info.name;
      contactAvatar = info.avatar;
    }
    if (!contactName) contactName = 'Colleague';

    const ticketNumber = options.ticketNumber || (channel?.lastMessage?.match(/TKT-\d{4}-\d{3}/i)?.[0]) || null;
    const ticketTitle = options.ticketTitle || '';
    const ticketId = options.ticketId || null;

    this.activeCall = {
      type,
      contactName,
      contactAvatar,
      ticketId,
      ticketNumber,
      ticketTitle,
      durationSec: 0,
      isMuted: false,
      isVideoOff: (type === 'audio'),
      isScreenSharing: false,
      isNotesOpen: false,
      callInterval: null,
      notes: ''
    };

    if (typeof this.playMessageSound === 'function') this.playMessageSound('ring');
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('teams-call-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'teams-call-modal-overlay';
    overlay.id = 'teams-call-modal-overlay';

    overlay.innerHTML = `
      <div class="teams-call-window" id="teams-call-window">
        <!-- Call Top Bar -->
        <div class="teams-call-topbar">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:#464eb8;color:#ffffff;font-size:12px">
              <i class="fa fa-users-viewfinder"></i>
            </span>
            <div style="font-weight:700;color:#ffffff;font-size:13px">
              Microsoft Teams Session
              ${ticketNumber ? `<span class="badge" style="background:rgba(20,184,166,0.25);color:#2dd4bf;margin-left:8px;font-family:monospace;font-size:10.5px"><i class="fa fa-ticket"></i> #${ticketNumber}</span>` : ''}
            </div>
            ${ticketTitle ? `<span style="color:#94a3b8;font-size:12px;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"> — ${ticketTitle}</span>` : ''}
          </div>

          <div style="display:flex;align-items:center;gap:14px">
            <div id="teams-call-status-label" class="teams-call-status">
              <i class="fa fa-spinner fa-spin text-warning"></i>
              <span>Connecting…</span>
            </div>
            <span style="font-size:11px;color:#94a3b8;display:inline-flex;align-items:center;gap:5px;border-left:1px solid rgba(255,255,255,0.15);padding-left:12px">
              <i class="fa fa-shield-halved text-success"></i> 256-bit Encrypted
            </span>
          </div>
        </div>

        <!-- Call Body Area -->
        <div class="teams-call-body" id="teams-call-body">
          <!-- Main Viewport (Video / Screen Share) -->
          <div class="teams-call-viewport" id="teams-call-viewport">
            <!-- Normal Video Grid Mode -->
            <div id="call-video-grid" style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;position:relative">
              <div class="teams-call-avatar-ring">
                ${contactAvatar && contactAvatar.startsWith('fa-') ? `<i class="fa ${contactAvatar}"></i>` : (contactAvatar || contactName.substring(0, 2))}
              </div>
              <div class="teams-call-name">${contactName}</div>
              <div style="font-size:12px;color:#94a3b8;display:flex;align-items:center;gap:6px;margin-top:2px">
                <span class="badge" style="background:rgba(70,78,184,0.3);color:#9299f7;font-size:10px">1080p HD</span>
                <span>Active Voice Stream</span>
              </div>

              <!-- Animated Sound Wave Indicator -->
              <div style="display:flex;align-items:center;gap:3px;margin-top:14px;height:18px">
                <span class="teams-voice-wave" style="display:flex;align-items:center;gap:3px">
                  <span style="width:3px;height:12px;background:#464eb8;border-radius:2px;animation:wavePulse 0.9s infinite alternate"></span>
                  <span style="width:3px;height:18px;background:#10b981;border-radius:2px;animation:wavePulse 0.7s infinite alternate"></span>
                  <span style="width:3px;height:8px;background:#464eb8;border-radius:2px;animation:wavePulse 1.1s infinite alternate"></span>
                  <span style="width:3px;height:16px;background:#10b981;border-radius:2px;animation:wavePulse 0.8s infinite alternate"></span>
                  <span style="width:3px;height:10px;background:#464eb8;border-radius:2px;animation:wavePulse 1.0s infinite alternate"></span>
                </span>
              </div>
            </div>

            <!-- Screen Share Diagnostic Console (Hidden by default, shown when screen share toggled) -->
            <div id="call-screenshare-view" class="teams-call-screenshare-view" style="display:none">
              <div class="teams-call-screen-header">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="color:#10b981;font-weight:700">● LIVE STREAM</span>
                  <span>Diagnostic Terminal — ${ticketNumber ? `Ticket #${ticketNumber}` : 'Remote Workstation'}</span>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-xs" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;font-size:10px" onclick="Chat.runDiagnosticPing()">
                    <i class="fa fa-network-wired text-primary"></i> Run Ping
                  </button>
                  <button class="btn btn-xs" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;font-size:10px" onclick="Chat.appendDiagnosticLog('Route table flushed. Re-established WireGuard peer 10.244.0.1')">
                    <i class="fa fa-rotate text-success"></i> Flush Routes
                  </button>
                </div>
              </div>
              <div class="teams-call-screen-terminal" id="teams-diagnostic-terminal">
                <div style="color:#64748b">// Microsoft Teams Remote Diagnostic Session Synchronized</div>
                <div style="color:#38bdf8">[00:01] Target Host: staging-k8s-cluster.apex.local (IP: 10.244.0.42)</div>
                <div style="color:#a855f7">[00:03] WireGuard Interface: wg0 | Handshake timeout detected every 12m</div>
                <div style="color:#22c55e">[00:06] MTU packet size auto-negotiated to 1420 bytes</div>
                <div style="color:#e2e8f0">[00:09] Active tunnel ping: 14.2ms avg (0% packet drop)</div>
                <div style="color:#fbbf24">[00:12] Handshake refreshed with peer pubkey: 7K...qR=</div>
              </div>
            </div>

            <!-- Self-View Picture in Picture (PiP) -->
            <div class="teams-call-pip-card" id="teams-call-pip">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:10px;font-weight:700;color:#ffffff">You (${me.fullName.split(' ')[0]})</span>
                <span id="pip-mic-badge" style="font-size:9px;color:#10b981"><i class="fa fa-microphone"></i></span>
              </div>
              <div style="flex:1;display:flex;align-items:center;justify-content:center;margin:4px 0" id="pip-video-preview">
                <div style="width:36px;height:36px;border-radius:50%;background:#464eb8;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700">
                  ${typeof Utils !== 'undefined' ? Utils.avatarInitials(me.fullName) : 'ME'}
                </div>
              </div>
              <div style="font-size:9.5px;color:#94a3b8;text-align:right">Self Camera (Active)</div>
            </div>
          </div>

          <!-- Slide-Out Meeting Notes Panel -->
          <div class="teams-call-sidepanel" id="teams-call-sidepanel" style="display:none">
            <div style="font-weight:700;font-size:13px;color:#ffffff;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
              <span><i class="fa fa-clipboard text-primary"></i> Session Notes</span>
              <button style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:12px" onclick="Chat.toggleCallNotes()">✕</button>
            </div>
            <textarea id="teams-call-notes-input" style="flex:1;background:#1a1c2e;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:10px;color:#ffffff;font-size:12px;font-family:inherit;resize:none;outline:none" placeholder="Type diagnostic findings, resolution actions, or follow-ups for this ticket...">${ticketNumber ? `Verified #${ticketNumber} with ${contactName}. ` : ''}</textarea>
            <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap">
              <button class="btn btn-xs" style="background:rgba(255,255,255,0.08);color:#e2e8f0;border:none;font-size:10px" onclick="Chat.insertNoteSnippet('MTU set to 1420. ')">+ MTU 1420</button>
              <button class="btn btn-xs" style="background:rgba(255,255,255,0.08);color:#e2e8f0;border:none;font-size:10px" onclick="Chat.insertNoteSnippet('Handshake verified. ')">+ Handshake OK</button>
              <button class="btn btn-xs" style="background:rgba(255,255,255,0.08);color:#e2e8f0;border:none;font-size:10px" onclick="Chat.insertNoteSnippet('User confirmed stable. ')">+ User Confirmed</button>
            </div>
          </div>
        </div>

        <!-- Call Controls Toolbar -->
        <div class="teams-call-controls">
          <button class="teams-call-btn" id="call-mic-btn" onclick="Chat.toggleCallMic()" title="Mute Microphone">
            <i class="fa fa-microphone"></i>
          </button>
          <button class="teams-call-btn" id="call-cam-btn" onclick="Chat.toggleCallCam()" title="Camera On/Off">
            <i class="fa fa-video"></i>
          </button>
          <button class="teams-call-btn" id="call-share-btn" onclick="Chat.toggleCallShare()" title="Share Screen / Diagnostic Console">
            <i class="fa fa-desktop"></i>
          </button>
          <button class="teams-call-btn" id="call-notes-btn" onclick="Chat.toggleCallNotes()" title="Live Meeting Notes">
            <i class="fa fa-note-sticky"></i>
          </button>
          <button class="teams-call-btn end-call" onclick="Chat.endCall()" title="Leave / End Call">
            <i class="fa fa-phone-slash"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Call connected simulation after 1.5s
    setTimeout(() => {
      const status = document.getElementById('teams-call-status-label');
      if (status) {
        status.innerHTML = `<span style="color:#10b981;font-weight:700">● Connected</span> <span id="call-duration-timer" style="margin-left:6px;font-family:monospace;color:#ffffff">00:01</span>`;
        let sec = 1;
        this.activeCall.callInterval = setInterval(() => {
          sec++;
          if (this.activeCall) this.activeCall.durationSec = sec;
          const t = document.getElementById('call-duration-timer');
          if (t) {
            const m = String(Math.floor(sec/60)).padStart(2, '0');
            const s = String(sec%60).padStart(2, '0');
            t.textContent = `${m}:${s}`;
          }
        }, 1000);
      }
    }, 1500);
  },

  toggleCallMic() {
    if (!this.activeCall) return;
    this.activeCall.isMuted = !this.activeCall.isMuted;
    const btn = document.getElementById('call-mic-btn');
    const badge = document.getElementById('pip-mic-badge');

    if (btn) {
      btn.classList.toggle('muted', this.activeCall.isMuted);
      btn.innerHTML = `<i class="fa fa-microphone${this.activeCall.isMuted ? '-slash' : ''}"></i>`;
    }
    if (badge) {
      badge.innerHTML = `<i class="fa fa-microphone${this.activeCall.isMuted ? '-slash' : ''}"></i>`;
      badge.style.color = this.activeCall.isMuted ? '#ef4444' : '#10b981';
    }
    if (typeof Toast !== 'undefined') {
      Toast.show(this.activeCall.isMuted ? 'Microphone muted' : 'Microphone unmuted', 'info');
    }
  },

  toggleCallCam() {
    if (!this.activeCall) return;
    this.activeCall.isVideoOff = !this.activeCall.isVideoOff;
    const btn = document.getElementById('call-cam-btn');
    const pip = document.getElementById('pip-video-preview');

    if (btn) {
      btn.classList.toggle('muted', this.activeCall.isVideoOff);
      btn.innerHTML = `<i class="fa fa-video${this.activeCall.isVideoOff ? '-slash' : ''}"></i>`;
    }
    if (pip) {
      const me = this.getCurrentUser();
      pip.innerHTML = this.activeCall.isVideoOff
        ? `<span style="font-size:11px;color:#ef4444"><i class="fa fa-video-slash"></i> Off</span>`
        : `<div style="width:36px;height:36px;border-radius:50%;background:#464eb8;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700">${typeof Utils !== 'undefined' ? Utils.avatarInitials(me.fullName) : 'ME'}</div>`;
    }
    if (typeof Toast !== 'undefined') {
      Toast.show(this.activeCall.isVideoOff ? 'Camera turned off' : 'Camera enabled', 'info');
    }
  },

  toggleCallShare() {
    if (!this.activeCall) return;
    this.activeCall.isScreenSharing = !this.activeCall.isScreenSharing;
    const btn = document.getElementById('call-share-btn');
    const videoGrid = document.getElementById('call-video-grid');
    const screenView = document.getElementById('call-screenshare-view');

    if (btn) {
      btn.classList.toggle('active', this.activeCall.isScreenSharing);
    }
    if (videoGrid && screenView) {
      if (this.activeCall.isScreenSharing) {
        videoGrid.style.display = 'none';
        screenView.style.display = 'flex';
        if (typeof Toast !== 'undefined') Toast.show('🖥 Screen sharing diagnostic stream synchronized', 'success');
      } else {
        videoGrid.style.display = 'flex';
        screenView.style.display = 'none';
        if (typeof Toast !== 'undefined') Toast.show('Returned to video conference grid', 'info');
      }
    }
  },

  toggleCallNotes() {
    if (!this.activeCall) return;
    this.activeCall.isNotesOpen = !this.activeCall.isNotesOpen;
    const btn = document.getElementById('call-notes-btn');
    const panel = document.getElementById('teams-call-sidepanel');

    if (btn) btn.classList.toggle('active', this.activeCall.isNotesOpen);
    if (panel) {
      panel.style.display = this.activeCall.isNotesOpen ? 'flex' : 'none';
    }
  },

  insertNoteSnippet(text) {
    const input = document.getElementById('teams-call-notes-input');
    if (input) {
      input.value += text;
      input.focus();
    }
  },

  appendDiagnosticLog(text) {
    const term = document.getElementById('teams-diagnostic-terminal');
    if (term) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const row = document.createElement('div');
      row.style.color = '#38bdf8';
      row.textContent = `[${now}] ${text}`;
      term.appendChild(row);
      term.scrollTop = term.scrollHeight;
    }
  },

  runDiagnosticPing() {
    this.appendDiagnosticLog('PING 10.244.0.1 (gateway) 56 bytes of data.');
    setTimeout(() => {
      this.appendDiagnosticLog('64 bytes from 10.244.0.1: icmp_seq=1 ttl=64 time=11.4 ms (STABLE)');
    }, 400);
  },

  endCall() {
    let durationStr = '00:00';
    let ticketId = null;
    let ticketNumber = null;
    let notesText = '';

    if (this.activeCall) {
      if (this.activeCall.callInterval) clearInterval(this.activeCall.callInterval);
      const sec = this.activeCall.durationSec || 0;
      const m = String(Math.floor(sec/60)).padStart(2, '0');
      const s = String(sec%60).padStart(2, '0');
      durationStr = `${m}:${s}`;
      ticketId = this.activeCall.ticketId;
      ticketNumber = this.activeCall.ticketNumber;

      if (typeof document !== 'undefined') {
        const notesInput = document.getElementById('teams-call-notes-input');
        if (notesInput) notesText = notesInput.value.trim();
      }
    }

    if (typeof this.playMessageSound === 'function') this.playMessageSound('hangup');
    if (typeof document !== 'undefined') {
      const overlay = document.getElementById('teams-call-modal-overlay');
      if (overlay) overlay.remove();
    }

    // 1. If call was related to a Helpdesk ticket, log diagnostic summary into ticket messages
    if (ticketId && typeof DB !== 'undefined') {
      const tickets = DB.get('helpdesk_tickets') || [];
      const t = tickets.find(x => x.id === ticketId);
      if (t) {
        if (!t.messages) t.messages = [];
        const me = this.getCurrentUser();
        t.messages.push({
          id: t.messages.length + 1,
          senderId: me.id,
          senderName: me.fullName,
          role: 'DIAGNOSTIC SESSION',
          text: `📞 **Microsoft Teams Diagnostic Video Call Completed**\nDuration: ${durationStr} • Screen-sharing telemetry verified.${notesText ? `\n*Session Notes:* ${notesText}` : ''}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
          isInternal: false
        });
        DB.set('helpdesk_tickets', tickets);

        // If Helpdesk workspace is open, refresh thread
        if (typeof Helpdesk !== 'undefined' && Helpdesk.selectedTicketId === ticketId) {
          Helpdesk.openTicketWorkspace(ticketId);
        }
      }
    }

    // 2. Post call record into active Chat channel
    const callSummary = `📞 **Microsoft Teams Video Call Ended**\nDuration: ${durationStr} ${ticketNumber ? `• Diagnostic for #${ticketNumber}` : ''}${notesText ? `\n*Notes:* ${notesText}` : ''}`;
    this.sendCustomMessage(callSummary);

    if (typeof Toast !== 'undefined') {
      Toast.show(`Call ended (${durationStr})`, 'info');
    }

    this.activeCall = null;
  },

  // ── 16. Custom Status & Presence Popover ──────────────────
  showStatusPopover(triggerEl) {
    if (typeof document === 'undefined') return;
    const existing = document.querySelector('.teams-status-popover');
    if (existing) { existing.remove(); return; }

    const popover = document.createElement('div');
    popover.className = 'teams-status-popover';
    popover.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:8px">Set Presence & Status</div>
      <div class="teams-status-item" onclick="Chat.setStatus('online', 'Available')">
        <span style="width:10px;height:10px;border-radius:50%;background:#107c41"></span>
        <span>Available</span>
      </div>
      <div class="teams-status-item" onclick="Chat.setStatus('busy', 'Busy / In a meeting')">
        <span style="width:10px;height:10px;border-radius:50%;background:#dc2626"></span>
        <span>Busy</span>
      </div>
      <div class="teams-status-item" onclick="Chat.setStatus('dnd', 'Do Not Disturb')">
        <span style="width:10px;height:10px;border-radius:50%;background:#b91c1c"></span>
        <span>Do Not Disturb</span>
      </div>
      <div class="teams-status-item" onclick="Chat.setStatus('brb', 'Be Right Back')">
        <span style="width:10px;height:10px;border-radius:50%;background:#d97706"></span>
        <span>Be Right Back</span>
      </div>
      <div class="teams-status-item" onclick="Chat.setStatus('offline', 'Appear Away')">
        <span style="width:10px;height:10px;border-radius:50%;background:#94a3b8"></span>
        <span>Appear Offline</span>
      </div>
    `;

    document.body.appendChild(popover);
    const rect = triggerEl.getBoundingClientRect();
    popover.style.top = `${rect.top}px`;
    popover.style.left = `${rect.right + 10}px`;

    const closeHandler = (e) => {
      if (!popover.contains(e.target) && e.target !== triggerEl) {
        popover.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 50);
  },

  setStatus(presence, statusText) {
    this.userCustomStatus = { presence, statusText };
    const pop = document.querySelector('.teams-status-popover');
    if (pop) pop.remove();
    if (typeof Toast !== 'undefined') Toast.show(`Status updated to: ${statusText}`, 'success');
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
