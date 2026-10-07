// =====================================================================
// HRM SYSTEM — Microsoft Teams Enterprise Workspace & Collaboration Hub
// Channels (#general, #hr, #tech), Direct Messages, Document Tabs & Calls
// =====================================================================

const Chat = {
  isOpen: false,
  isMinimized: false,
  isMaximized: false,
  railView: 'chat',       // 'chat' | 'teams' | 'calls' | 'files' | 'copilot'
  activeFilter: 'all',    // 'all' | 'unread' | 'channels' | 'dms' | 'favorites'
  activeChannelId: 'chan-general',
  activeTab: 'chat',      // 'chat' | 'files' | 'members' | 'pinned'
  collapsedSections: { favorites: false, channels: false, dms: false, bot: false },
  unreadCounts: {},
  typingTimeout: null,
  typingUsers: {},
  audioCtx: null,

  // Rich Collaboration State
  replyingTo: null,       // { id, senderName, content }
  inChatSearchActive: false,
  inChatSearchQuery: '',
  isRecordingVoice: false,
  voiceTimer: null,
  voiceDuration: 0,
  activeCall: null,
  userCustomStatus: { presence: 'online', statusText: 'Available' },

  init() {
    this.ensureTeamsSeedData();
    this.initAudio();
    this.calculateInitialUnreads();

    // Listen to WebSocket presence & live messaging events
    if (typeof HRMWebSocket !== 'undefined' && typeof HRMWebSocket.on === 'function') {
      HRMWebSocket.on('presence:change', () => this.updatePresenceUI());
      HRMWebSocket.on('presence:roster', () => this.updatePresenceUI());
      HRMWebSocket.on('chat:reaction', (data) => this.handleReactionUpdate(data));
      HRMWebSocket.on('chat:typing', (data) => this.handleTypingIndicator(data));
      HRMWebSocket.on('chat:message', (data) => {
        if (data && data.message) this.handleIncomingMessage(data.message);
      });
    }

    // Keyboard shortcut: Ctrl+M / Cmd+M opens chat
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm' && !e.shiftKey) {
          e.preventDefault();
          if (typeof App !== 'undefined' && App.navigate) App.navigate('chat');
        }
      });
    }

    console.log('%c💼 Microsoft Teams Enterprise Workspace initialized', 'color:#464eb8;font-weight:700');
  },

  // ── 0. Helper: Resolve Current Logged-In User ───────────────
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
    if (msg.senderId !== undefined && msg.senderId !== null) {
      if (parseInt(msg.senderId, 10) === parseInt(me.id, 10)) return true;
    }
    if (msg.senderName && me.fullName) {
      const s = msg.senderName.trim().toLowerCase();
      const m = me.fullName.trim().toLowerCase();
      if (s === m || s.includes(m) || m.includes(s)) return true;
    }
    return false;
  },

  // ── 1. Enterprise Channels & Seed Data ──────────────────────
  ensureTeamsSeedData() {
    if (typeof DB === 'undefined') return;

    let channels = DB.get('chat_channels') || [];
    let messages = DB.get('chat_messages') || [];

    const enterpriseSeedChannels = [
      {
        id: 'chan-general',
        name: 'general',
        displayName: '# general',
        topic: 'Company-wide announcements, townhalls & strategic milestones',
        description: 'Official organization-wide channel for all employees. Pinned policies and company events are shared here.',
        type: 'channel',
        isFavorite: true,
        time: '10:45 AM',
        lastMessage: 'Ahmed Khan: Welcome to Q4! Centralized HRM Suite is live.',
        avatar: 'fa-bullhorn',
        avatarBg: '#464eb8',
        members: [1, 2, 3, 4, 5, 26, 101, 102],
        files: [
          { id: 'f-1', name: 'Company_Holiday_Calendar_2026.pdf', size: '1.2 MB', ext: 'pdf', uploadedBy: 'Sara Malik', date: 'Oct 02, 2026' },
          { id: 'f-2', name: 'Q4_All_Hands_Presentation.pdf', size: '4.8 MB', ext: 'pdf', uploadedBy: 'Ahmed Khan', date: 'Oct 05, 2026' }
        ]
      },
      {
        id: 'chan-hr',
        name: 'hr-people-ops',
        displayName: '# hr-people-ops',
        topic: 'Leave policies, benefits, attendance rosters & employee onboarding',
        description: 'People Operations channel for staff inquiries, leave approval procedures, and monthly biometric roster checks.',
        type: 'channel',
        isFavorite: true,
        time: '11:15 AM',
        lastMessage: 'Sara Malik: Leave approvals for long weekend close Thursday.',
        avatar: 'fa-users',
        avatarBg: '#10b981',
        members: [1, 2, 4, 5, 26],
        files: [
          { id: 'f-3', name: 'Leave_Policy_Handbook_2026.pdf', size: '2.1 MB', ext: 'pdf', uploadedBy: 'Sara Malik', date: 'Sep 28, 2026' },
          { id: 'f-4', name: 'Health_Insurance_Benefits_Guide.pdf', size: '3.4 MB', ext: 'pdf', uploadedBy: 'Sara Malik', date: 'Oct 01, 2026' }
        ]
      },
      {
        id: 'chan-tech',
        name: 'engineering-tech',
        displayName: '# engineering-tech',
        topic: 'Architecture, release sprints, CI/CD pipeline & code reviews',
        description: 'Engineering coordination for web applications, database migrations, and biometric attendance device firmware.',
        type: 'channel',
        isFavorite: false,
        time: '9:30 AM',
        lastMessage: 'Usman Baig: Sprint 42 deployed to staging. Biometric auto-sync is active.',
        avatar: 'fa-code-branch',
        avatarBg: '#8b5cf6',
        members: [1, 3, 4, 101, 102],
        files: [
          { id: 'f-5', name: 'System_Architecture_Diagram_v2.png', size: '820 KB', ext: 'img', uploadedBy: 'Fatima Raza', date: 'Yesterday' }
        ]
      },
      {
        id: 'chan-finance',
        name: 'finance-payroll',
        displayName: '# finance-payroll',
        topic: 'Monthly payroll schedules, statutory tax brackets & expense claims',
        description: 'Corporate finance channel for salary dispatches, provident fund records, and statutory deductions.',
        type: 'channel',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: 'Ahmed Khan: October salary processing commenced with bank format test.',
        avatar: 'fa-money-bill-trend-up',
        avatarBg: '#059669',
        members: [1, 2, 5],
        files: [
          { id: 'f-6', name: 'Q4_Salary_Structure_Approved.pdf', size: '1.5 MB', ext: 'pdf', uploadedBy: 'Ahmed Khan', date: 'Oct 01, 2026' },
          { id: 'f-7', name: 'Oct_Biometric_Payroll_Roster.xlsx', size: '640 KB', ext: 'excel', uploadedBy: 'Sara Malik', date: 'Today' }
        ]
      },
      {
        id: 'chan-watercooler',
        name: 'watercooler-social',
        displayName: '# watercooler-social',
        topic: 'Casual coffee chats, colleague birthdays & team celebrations',
        description: 'Relaxed break room for informal colleague discussions and social milestones.',
        type: 'channel',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: 'Wajiha Mazhar: Welcome Saad Ibrahim to the engineering team! ☕🎉',
        avatar: 'fa-mug-hot',
        avatarBg: '#f59e0b',
        members: [1, 2, 3, 4, 5, 101],
        files: []
      },
      // Direct Messages with Real Company Personnel
      {
        id: 'chan-dm-sara',
        name: 'Sara Malik',
        displayName: 'Sara Malik',
        username: 'sara.malik',
        role: 'HR Director',
        type: 'direct',
        isFavorite: true,
        time: '11:20 AM',
        lastMessage: 'Sara Malik: Cross-checked statutory payroll tax brackets.',
        avatar: 'SM',
        avatarBg: '#10b981',
        targetEmpId: 2,
        members: [1, 2],
        files: [
          { id: 'f-8', name: 'Executive_Compensation_Draft.pdf', size: '1.8 MB', ext: 'pdf', uploadedBy: 'Sara Malik', date: 'Today' }
        ]
      },
      {
        id: 'chan-dm-usman',
        name: 'Usman Baig',
        displayName: 'Usman Baig',
        username: 'usman.baig',
        role: 'Engineering Manager',
        type: 'direct',
        isFavorite: true,
        time: '10:05 AM',
        lastMessage: 'Usman Baig: All 3 biometric devices in Lahore & Islamabad are live.',
        avatar: 'UB',
        avatarBg: '#8b5cf6',
        targetEmpId: 3,
        members: [1, 3],
        files: []
      },
      {
        id: 'chan-dm-fatima',
        name: 'Fatima Raza',
        displayName: 'Fatima Raza',
        username: 'fatima.raza',
        role: 'Lead Software Engineer',
        type: 'direct',
        isFavorite: false,
        time: '9:40 AM',
        lastMessage: 'Fatima Raza: PR #142 for leave carry-forward calculations is ready.',
        avatar: 'FR',
        avatarBg: '#0284c7',
        targetEmpId: 4,
        members: [1, 4],
        files: []
      },
      {
        id: 'chan-dm-saad',
        name: 'Saad Ibrahim',
        displayName: 'Saad Ibrahim',
        username: 'saad.ibrahim',
        role: 'New Joiner (Onboarding)',
        type: 'direct',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: 'Saad Ibrahim: Completed e-DMS upload for educational degrees.',
        avatar: 'SI',
        avatarBg: '#f59e0b',
        targetEmpId: 5,
        members: [1, 5],
        files: []
      },
      {
        id: 'chan-dm-wajiha',
        name: 'Wajiha Mazhar',
        displayName: 'Wajiha Mazhar',
        username: 'wajiha.mazhar',
        role: 'Senior Product Designer',
        type: 'direct',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: 'Wajiha Mazhar: Checked color contrast & layout cards for dark mode.',
        avatar: 'WM',
        avatarBg: '#ec4899',
        targetEmpId: 101,
        members: [1, 101],
        files: []
      },
      {
        id: 'chan-dm-zain',
        name: 'Zain Ali',
        displayName: 'Zain Ali',
        username: 'zain.ali',
        role: 'Junior HR Specialist',
        type: 'direct',
        isFavorite: false,
        time: 'Oct 04',
        lastMessage: 'Zain Ali: Verified attendance punch times for morning shift.',
        avatar: 'ZA',
        avatarBg: '#64748b',
        targetEmpId: 26,
        members: [1, 26],
        files: []
      },
      // AI Copilot
      {
        id: 'chan-copilot',
        name: 'HRM AI Copilot',
        displayName: '✨ HRM AI Copilot',
        username: 'hrm.copilot',
        role: 'Intelligent Enterprise Assistant',
        topic: 'Policy guidance, leave balance checks, tax breakdown & announcements',
        description: 'Instant generative AI assistant connected to internal HR database & statutory rules.',
        type: 'bot',
        isFavorite: true,
        time: 'Now',
        lastMessage: 'Ask me anything about your leaves, payroll, or attendance!',
        avatar: 'fa-robot',
        avatarBg: '#464eb8',
        members: [1, 999],
        files: []
      }
    ];

        // Filter out all old legacy WhatsApp dummy channels
    const legacyIds = new Set([
      'chan-saima', 'chan-num92', 'chan-kallur', 'chan-gemini', 'chan-arshad',
      'chan-chairs', 'chan-ghulaman', 'chan-touqeer', 'chan-ghulam',
      'chan-cmit', 'chan-humna', 'chan-prisha', 'chan-mazhar', 'chan-1'
    ]);

    channels = (DB.get('chat_channels') || []).filter(c => !legacyIds.has(c.id) && !c.id.startsWith('chan-num') && !c.id.startsWith('chan-kallur') && !c.id.startsWith('chan-chairs') && !c.id.startsWith('chan-gemini') && !c.id.startsWith('chan-ghulaman') && !c.id.startsWith('chan-touqeer'));
    
    // Always put enterpriseSeedChannels first
    const seedIds = new Set(enterpriseSeedChannels.map(s => s.id));
    const nonSeed = channels.filter(c => !seedIds.has(c.id));
    channels = [...enterpriseSeedChannels, ...nonSeed];
    DB.set('chat_channels', channels);

    if (!channels.some(c => c.id === this.activeChannelId)) {
      this.activeChannelId = 'chan-general';
    }

    // Seed Realistic Messages for every channel and DM
    const seedMessagesMap = {
      'chan-general': [
        {
          id: 'gen-1',
          channelId: 'chan-general',
          senderId: 1,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          content: 'Good morning everyone! Welcome to Q4. We have deployed our new centralized **HRM Enterprise Suite & Team Workspace**. Please take a look at the attached 2026 holiday calendar.',
          attachments: [{ name: 'Company_Holiday_Calendar_2026.pdf', size: '1.2 MB', ext: 'pdf' }],
          isPinned: true,
          reactions: { '👍': 12, '🎉': 8, '❤️': 5 },
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'gen-2',
          channelId: 'chan-general',
          senderId: 2,
          senderName: 'Sara Malik',
          senderRole: 'HR Director',
          content: 'Reminder: The Quarterly HR Town Hall is scheduled for this Friday at 3:00 PM in Conference Hall A & live via Teams Video Call.',
          reactions: { '👍': 6, '👀': 3 },
          createdAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: 'gen-3',
          channelId: 'chan-general',
          senderId: 1,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          content: 'All departmental quarterly goals have been mapped to OKRs. Great execution team!',
          reactions: { '🚀': 9 },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      'chan-hr': [
        {
          id: 'hr-1',
          channelId: 'chan-hr',
          senderId: 2,
          senderName: 'Sara Malik',
          senderRole: 'HR Director',
          content: 'Hello Team Leads, all leave applications for the upcoming long weekend must be submitted and approved by Thursday 5:00 PM for payroll cut-off.',
          attachments: [{ name: 'Leave_Policy_Handbook_2026.pdf', size: '2.1 MB', ext: 'pdf' }],
          isPinned: true,
          reactions: { '👍': 7 },
          createdAt: new Date(Date.now() - 72000000).toISOString()
        },
        {
          id: 'hr-2',
          channelId: 'chan-hr',
          senderId: 4,
          senderName: 'Fatima Raza',
          senderRole: 'Lead Software Engineer',
          content: 'Noted Sara. All engineering department pending leave requests have been reviewed.',
          createdAt: new Date(Date.now() - 14400000).toISOString()
        }
      ],
      'chan-tech': [
        {
          id: 'tech-1',
          channelId: 'chan-tech',
          senderId: 3,
          senderName: 'Usman Baig',
          senderRole: 'Engineering Manager',
          content: 'Sprint 42 deployed to staging. The biometric auto-sync daemon is now running with 30s heartbeats across all 3 regional office hardware devices.',
          reactions: { '🚀': 7, '👏': 4 },
          createdAt: new Date(Date.now() - 50000000).toISOString()
        },
        {
          id: 'tech-2',
          channelId: 'chan-tech',
          senderId: 4,
          senderName: 'Fatima Raza',
          senderRole: 'Lead Software Engineer',
          content: 'Here is the revised architecture diagram showing WebSocket presence & edge cache routing.',
          attachments: [{ name: 'System_Architecture_Diagram_v2.png', size: '820 KB', ext: 'img' }],
          reactions: { '❤️': 3 },
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      'chan-finance': [
        {
          id: 'fin-1',
          channelId: 'chan-finance',
          senderId: 1,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          content: 'October salary processing has commenced. Bank format export tested successfully for HBL, Meezan and Standard Chartered.',
          reactions: { '👍': 4 },
          createdAt: new Date(Date.now() - 60000000).toISOString()
        },
        {
          id: 'fin-2',
          channelId: 'chan-finance',
          senderId: 2,
          senderName: 'Sara Malik',
          senderRole: 'HR Director',
          content: 'Attached the approved Q4 salary matrix and biometric payroll reconciliation roster.',
          attachments: [
            { name: 'Q4_Salary_Structure_Approved.pdf', size: '1.5 MB', ext: 'pdf' },
            { name: 'Oct_Biometric_Payroll_Roster.xlsx', size: '640 KB', ext: 'excel' }
          ],
          isPinned: true,
          reactions: { '💰': 5, '👍': 3 },
          createdAt: new Date(Date.now() - 18000000).toISOString()
        }
      ],
      'chan-watercooler': [
        {
          id: 'soc-1',
          channelId: 'chan-watercooler',
          senderId: 101,
          senderName: 'Wajiha Mazhar',
          senderRole: 'Senior Product Designer',
          content: 'Welcome Saad Ibrahim to the team! Glad to have you onboard ☕🎉',
          reactions: { '🎉': 8, '☕': 6 },
          createdAt: new Date(Date.now() - 90000000).toISOString()
        },
        {
          id: 'soc-2',
          channelId: 'chan-watercooler',
          senderId: 5,
          senderName: 'Saad Ibrahim',
          senderRole: 'New Joiner',
          content: 'Thank you Wajiha and everyone! Excited to collaborate with the team.',
          reactions: { '🙌': 5 },
          createdAt: new Date(Date.now() - 40000000).toISOString()
        }
      ],
      'chan-dm-sara': [
        {
          id: 'dms-1',
          channelId: 'chan-dm-sara',
          senderId: 1,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          content: 'Sara, how is the compliance audit documentation coming along?',
          createdAt: new Date(Date.now() - 18000000).toISOString()
        },
        {
          id: 'dms-2',
          channelId: 'chan-dm-sara',
          senderId: 2,
          senderName: 'Sara Malik',
          senderRole: 'HR Director',
          content: 'Almost complete Ahmed. I cross-checked the statutory payroll tax brackets for all executive staff.',
          reactions: { '👍': 2 },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      'chan-dm-usman': [
        {
          id: 'dmu-1',
          channelId: 'chan-dm-usman',
          senderId: 3,
          senderName: 'Usman Baig',
          senderRole: 'Engineering Manager',
          content: 'Ahmed, all 3 biometric hardware devices in Lahore and Islamabad are live.',
          createdAt: new Date(Date.now() - 12000000).toISOString()
        },
        {
          id: 'dmu-2',
          channelId: 'chan-dm-usman',
          senderId: 1,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          content: 'Excellent work Usman. Let us review during the morning standup.',
          reactions: { '👍': 1 },
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      'chan-dm-fatima': [
        {
          id: 'dmf-1',
          channelId: 'chan-dm-fatima',
          senderId: 4,
          senderName: 'Fatima Raza',
          senderRole: 'Lead Software Engineer',
          content: 'PR #142 for leave carry-forward calculations is ready for review.',
          createdAt: new Date(Date.now() - 9000000).toISOString()
        },
        {
          id: 'dmf-2',
          channelId: 'chan-dm-fatima',
          senderId: 1,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          content: 'Reviewing now. Clean and modular implementation!',
          reactions: { '🚀': 1 },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      'chan-dm-wajiha': [
        {
          id: 'dmw-1',
          channelId: 'chan-dm-wajiha',
          senderId: 1,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          content: 'Wajiha, did you review the revised UI mockups for the attendance portal?',
          createdAt: new Date(Date.now() - 14400000).toISOString()
        },
        {
          id: 'dmw-2',
          channelId: 'chan-dm-wajiha',
          senderId: 101,
          senderName: 'Wajiha Mazhar',
          senderRole: 'Senior Product Designer',
          content: 'Yes Sir! Checked color contrast and layout cards for both light and dark modes.',
          reactions: { '🎨': 2 },
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      'chan-copilot': [
        {
          id: 'cop-1',
          channelId: 'chan-copilot',
          senderId: 999,
          senderName: 'HRM AI Copilot',
          senderRole: 'AI Agent',
          content: '👋 **Welcome to HRM AI Copilot!**\n\nI am your intelligent enterprise collaboration assistant. You can ask me to:\n- 🌴 *Check your remaining leave balance*\n- 📊 *Review today\'s employee attendance*\n- 💰 *Explain salary structure & tax slabs*\n- 📝 *Draft an announcement or email*\n\nClick any quick prompt chip below or type your question:',
          isBot: true,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    // Filter out obsolete messages and insert new seed messages
    const channelIdsWithSeeds = Object.keys(seedMessagesMap);
    messages = messages.filter(m => !channelIdsWithSeeds.includes(m.channelId));
    channelIdsWithSeeds.forEach(cid => {
      messages.push(...seedMessagesMap[cid]);
    });
    DB.set('chat_messages', messages);
  },

  // ── 2. Web Audio Synthesizer (Chimes & Tones) ───────────────
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
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
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

  calculateInitialUnreads() {
    this.unreadCounts['chan-hr'] = 1;
    this.unreadCounts['chan-dm-sara'] = 1;
  },

  getTotalUnreadCount() {
    return Object.values(this.unreadCounts).reduce((a, b) => a + (b || 0), 0);
  },

  // ── 3. Data Resolvers ──────────────────────────────────────
  getChannels() {
    if (typeof DB === 'undefined') return [];
    return DB.get('chat_channels') || [];
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

  getChannelDisplayInfo(channel) {
    if (!channel) return { name: 'Chat', isOnline: true, avatar: 'fa-comments', avatarBg: '#464eb8' };
    const me = this.getCurrentUser();

    if (channel.type === 'direct') {
      const isOnline = channel.username !== 'zain.ali';
      return {
        name: channel.displayName || channel.name,
        username: channel.username,
        role: channel.role || 'Team Member',
        isOnline: isOnline,
        avatar: channel.avatar || channel.name.substring(0, 2),
        avatarBg: channel.avatarBg || '#10b981',
        isChannel: false
      };
    } else if (channel.type === 'bot') {
      return {
        name: channel.displayName || 'HRM AI Copilot',
        role: 'Verified AI Agent',
        isOnline: true,
        avatar: 'fa-robot',
        avatarBg: '#464eb8',
        isChannel: false,
        isBot: true
      };
    } else {
      return {
        name: channel.displayName || ('# ' + channel.name),
        topic: channel.topic || '',
        description: channel.description || '',
        isOnline: true,
        avatar: channel.avatar || 'fa-hashtag',
        avatarBg: channel.avatarBg || '#464eb8',
        isChannel: true,
        membersCount: (channel.members || []).length
      };
    }
  },

  // ── 4. Main Navigation Actions ─────────────────────────────
  setRailView(view) {
    this.railView = view;
    if (view === 'copilot') {
      this.openChannel('chan-copilot');
      return;
    }
    const container = document.getElementById('teams-workspace-container');
    if (container) this.renderWorkspace(container, true);
  },

  setFilter(filterName) {
    this.activeFilter = filterName;
    this.renderRosterList();
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.teams-filter-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filterName);
      });
    }
  },

  setActiveTab(tabName) {
    this.activeTab = tabName;
    const stage = document.getElementById('teams-stage-content-wrap');
    if (stage) stage.innerHTML = this.renderTabContentHTML(this.getActiveChannel());
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.teams-doc-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabName);
      });
    }
  },

  openChannel(channelId) {
    this.activeChannelId = channelId;
    this.activeTab = 'chat';
    this.unreadCounts[channelId] = 0;
    this.renderRosterList();
    this.renderStageArea();
  },

  selectChannel(channelId) {
    this.openChannel(channelId);
  },

  selectCopilot() {
    this.openChannel('chan-copilot');
  },

  // ── 5. Full-Screen Workspace Renderer ──────────────────────
  renderFullWorkspace() {
    const content = document.getElementById('page-content');
    if (!content) return;
    content.innerHTML = '<div id="teams-workspace-container" style="width:100%;height:100%;"></div>';
    const container = document.getElementById('teams-workspace-container');
    this.renderWorkspace(container, true);
  },

  renderWorkspace(container, isFullScreen = true) {
    if (!container) return;
    const channel = this.getActiveChannel();
    const info = this.getChannelDisplayInfo(channel);

    container.innerHTML = `
      <div class="teams-enterprise-workspace">
        <!-- 1. Left Teams App Rail (64px) -->
        ${this.renderAppRailHTML()}

        <!-- 2. Second Column: Channel/DM Roster OR Rail Specialized View -->
        ${this.railView === 'calls' ? this.renderCallsViewHTML() : (this.railView === 'files' ? this.renderGlobalFilesViewHTML() : this.renderRosterColumnHTML())}

        <!-- 3. Third Column: Main Collaboration Workspace -->
        <div class="teams-main-stage" id="teams-main-stage">
          ${this.renderStageAreaHTML(channel, info)}
        </div>
      </div>
    `;

    this.renderRosterList();
    this.scrollToBottom();
  },

  // ── 6. HTML Generators for Core Workspace ──────────────────
  renderAppRailHTML() {
    const totalUnread = this.getTotalUnreadCount();
    return `
      <div class="teams-app-rail">
        <button class="teams-rail-btn ${this.railView === 'chat' ? 'active' : ''}" onclick="Chat.setRailView('chat')" title="Chats & Channels">
          <i class="fa fa-comment-dots"></i>
          <span class="rail-label">Chat</span>
          ${totalUnread > 0 ? `<span class="teams-rail-badge">${totalUnread}</span>` : ''}
        </button>

        <button class="teams-rail-btn ${this.railView === 'teams' ? 'active' : ''}" onclick="Chat.setRailView('teams')" title="Departments & Teams">
          <i class="fa fa-users-gear"></i>
          <span class="rail-label">Teams</span>
        </button>

        <button class="teams-rail-btn ${this.railView === 'calls' ? 'active' : ''}" onclick="Chat.setRailView('calls')" title="Audio & Video Calls">
          <i class="fa fa-phone"></i>
          <span class="rail-label">Calls</span>
        </button>

        <button class="teams-rail-btn ${this.railView === 'files' ? 'active' : ''}" onclick="Chat.setRailView('files')" title="Company Document Repository">
          <i class="fa fa-folder-open"></i>
          <span class="rail-label">Files</span>
        </button>

        <div class="teams-rail-divider"></div>

        <button class="teams-rail-btn ${this.activeChannelId === 'chan-copilot' ? 'active' : ''}" onclick="Chat.selectCopilot()" title="HRM AI Copilot">
          <i class="fa fa-wand-magic-sparkles" style="color:#a855f7"></i>
          <span class="rail-label">Copilot</span>
        </button>

        <!-- Spacer -->
        <div style="flex:1"></div>

        <!-- Return to HRM Enterprise Suite -->
        <button class="teams-rail-btn" onclick="if (typeof App !== 'undefined') App.navigate('dashboard');" title="Return to Full HRM Suite" style="color:#38bdf8">
          <i class="fa fa-building-columns"></i>
          <span class="rail-label">HRM Suite</span>
        </button>
      </div>
    `;
  },

  renderRosterColumnHTML() {
    const me = this.getCurrentUser();
    return `
      <div class="teams-roster-column">
        <!-- Workspace Header -->
        <div class="teams-workspace-header">
          <div class="teams-workspace-title-wrap" onclick="Chat.setFilter('all')">
            <div class="teams-workspace-icon"><i class="fa fa-cubes"></i></div>
            <div>
              <div class="teams-workspace-name">Apex Global <i class="fa fa-circle-check" style="color:#38bdf8;font-size:12px"></i></div>
              <div class="teams-workspace-subtitle">Enterprise Collaboration Hub</div>
            </div>
          </div>
          <div class="teams-roster-actions">
            <button class="teams-roster-btn" onclick="Chat.startNewChat()" title="Start New Direct Chat / Channel"><i class="fa fa-pen-to-square"></i></button>
          </div>
        </div>

        <!-- User Presence Status Pill -->
        <div class="teams-user-status-pill" onclick="Chat.showStatusPopover()">
          <div class="teams-status-indicator">
            <span class="teams-presence-dot ${this.userCustomStatus.presence}"></span>
            <span style="color:var(--text);font-size:12px">${me.fullName}</span>
          </div>
          <span style="font-size:11px;color:#94a3b8">${this.userCustomStatus.statusText} <i class="fa fa-chevron-down" style="font-size:9px"></i></span>
        </div>

        <!-- Search Bar -->
        <div class="teams-search-box">
          <i class="fa fa-search teams-search-icon"></i>
          <input 
            type="text" 
            class="teams-search-input" 
            placeholder="Search channels & colleagues (Ctrl+K)" 
            oninput="Chat.filterRoster(this.value)">
        </div>

        <!-- Filter Chips -->
        <div class="teams-filter-chips">
          <button class="teams-filter-chip ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all" onclick="Chat.setFilter('all')">All</button>
          <button class="teams-filter-chip ${this.activeFilter === 'unread' ? 'active' : ''}" data-filter="unread" onclick="Chat.setFilter('unread')">Unread</button>
          <button class="teams-filter-chip ${this.activeFilter === 'channels' ? 'active' : ''}" data-filter="channels" onclick="Chat.setFilter('channels')">Channels</button>
          <button class="teams-filter-chip ${this.activeFilter === 'dms' ? 'active' : ''}" data-filter="dms" onclick="Chat.setFilter('dms')">Direct Messages</button>
          <button class="teams-filter-chip ${this.activeFilter === 'favorites' ? 'active' : ''}" data-filter="favorites" onclick="Chat.setFilter('favorites')">Favorites</button>
        </div>

        <!-- Channel Roster List -->
        <div class="teams-roster-list" id="teams-roster-list"></div>
      </div>
    `;
  },

  renderRosterList(searchQuery = '') {
    const listEl = document.getElementById('teams-roster-list');
    if (!listEl) return;

    const channels = this.getChannels();
    const q = (searchQuery || '').toLowerCase().trim();

    let items = channels;
    if (this.activeFilter === 'unread') {
      items = items.filter(c => (this.unreadCounts[c.id] || 0) > 0);
    } else if (this.activeFilter === 'channels') {
      items = items.filter(c => c.type === 'channel');
    } else if (this.activeFilter === 'dms') {
      items = items.filter(c => c.type === 'direct');
    } else if (this.activeFilter === 'favorites') {
      items = items.filter(c => c.isFavorite);
    }

    if (q) {
      items = items.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.displayName && c.displayName.toLowerCase().includes(q)) ||
        (c.topic && c.topic.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    }

    const channelList = items.filter(c => c.type === 'channel');
    const dmList = items.filter(c => c.type === 'direct');
    const botList = items.filter(c => c.type === 'bot');

    let html = '';

    // 1. Channels Section
    if (channelList.length > 0) {
      html += `
        <div class="teams-section-header" onclick="Chat.toggleSection('channels')">
          <span><i class="fa fa-chevron-down" style="font-size:9px;margin-right:6px"></i> Channels</span>
          <button class="teams-section-add-btn" onclick="event.stopPropagation();Chat.startNewChat('channel')" title="Create Channel"><i class="fa fa-plus"></i></button>
        </div>
      `;
      channelList.forEach(c => {
        html += this.renderChannelItemRowHTML(c);
      });
    }

    // 2. Direct Messages Section
    if (dmList.length > 0) {
      html += `
        <div class="teams-section-header" onclick="Chat.toggleSection('dms')" style="margin-top:10px">
          <span><i class="fa fa-chevron-down" style="font-size:9px;margin-right:6px"></i> Direct Messages</span>
          <button class="teams-section-add-btn" onclick="event.stopPropagation();Chat.startNewChat('dm')" title="New Direct Message"><i class="fa fa-plus"></i></button>
        </div>
      `;
      dmList.forEach(c => {
        html += this.renderChannelItemRowHTML(c);
      });
    }

    // 3. AI Copilot Section
    if (botList.length > 0) {
      html += `
        <div class="teams-section-header" style="margin-top:10px">
          <span><i class="fa fa-sparkles" style="color:#a855f7;margin-right:6px"></i> AI Assistant</span>
        </div>
      `;
      botList.forEach(c => {
        html += this.renderChannelItemRowHTML(c);
      });
    }

    listEl.innerHTML = html;
  },

  renderChannelItemRowHTML(c) {
    const isActive = c.id === this.activeChannelId;
    const unread = this.unreadCounts[c.id] || 0;
    const isChannel = c.type === 'channel';
    const isBot = c.type === 'bot';

    let iconOrAvatar = '';
    if (isChannel) {
      iconOrAvatar = `<div class="teams-item-prefix-icon"><i class="fa ${c.avatar || 'fa-hashtag'}"></i></div>`;
    } else if (isBot) {
      iconOrAvatar = `<div class="teams-item-prefix-icon" style="color:#a855f7"><i class="fa fa-robot"></i></div>`;
    } else {
      const isOnline = c.username !== 'zain.ali';
      iconOrAvatar = `
        <div class="teams-item-avatar-wrap" style="background:${c.avatarBg || '#10b981'}">
          ${c.avatar || c.name.substring(0,2)}
          <span class="teams-item-avatar-dot ${isOnline ? 'online' : 'offline'}"></span>
        </div>
      `;
    }

    return `
      <div class="teams-item-row ${isActive ? 'active' : ''}" onclick="Chat.openChannel('${c.id}')" data-channel-id="${c.id}">
        ${iconOrAvatar}
        <div class="teams-item-details">
          <div class="teams-item-title">
            <span style="overflow:hidden;text-overflow:ellipsis">${c.displayName || c.name}</span>
            <span class="teams-item-time">${c.time || ''}</span>
          </div>
          <div class="teams-item-snippet">${c.lastMessage || c.topic || ''}</div>
        </div>
        ${unread > 0 ? `<span class="teams-unread-pill">${unread}</span>` : ''}
      </div>
    `;
  },

  // ── 7. Main Stage & Document Tabs ──────────────────────────
  renderStageArea() {
    const stage = document.getElementById('teams-main-stage');
    if (!stage) return;
    const channel = this.getActiveChannel();
    const info = this.getChannelDisplayInfo(channel);
    stage.innerHTML = this.renderStageAreaHTML(channel, info);
    this.scrollToBottom();
  },

  renderStageAreaHTML(channel, info) {
    if (!channel) {
      return `<div style="padding:60px;text-align:center;color:#94a3b8">Select a channel or colleague to start collaborating</div>`;
    }

    const filesCount = (channel.files || []).length;
    const membersCount = (channel.members || []).length;
    const messages = this.getMessages(channel.id);
    const pinnedCount = messages.filter(m => m.isPinned).length;

    return `
      <!-- Channel Topbar with Document Tabs & Meeting Launcher -->
      <div class="teams-channel-topbar">
        <div class="teams-topbar-info">
          <div class="teams-topbar-avatar" style="background:${info.avatarBg || '#464eb8'}">
            ${info.avatar && info.avatar.startsWith('fa-') ? `<i class="fa ${info.avatar}"></i>` : (info.avatar || info.name.substring(0,2))}
          </div>
          <div class="teams-topbar-title-wrap">
            <div class="teams-topbar-title">
              ${info.name}
              ${info.role ? `<span class="teams-topbar-badge">${info.role}</span>` : ''}
            </div>
            <div class="teams-topbar-topic">${info.topic || info.description || (info.isOnline ? '🟢 Available' : '⚪ Offline')}</div>
          </div>
        </div>

        <!-- Document & Workspace Navigation Tabs (Posts, Files, Members, Pinned) -->
        <div class="teams-doc-tabs">
          <button class="teams-doc-tab ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat" onclick="Chat.setActiveTab('chat')">
            <i class="fa fa-comment-dots"></i> Posts & Chat
          </button>
          <button class="teams-doc-tab ${this.activeTab === 'files' ? 'active' : ''}" data-tab="files" onclick="Chat.setActiveTab('files')">
            <i class="fa fa-folder-open"></i> Files & Docs (${filesCount})
          </button>
          <button class="teams-doc-tab ${this.activeTab === 'members' ? 'active' : ''}" data-tab="members" onclick="Chat.setActiveTab('members')">
            <i class="fa fa-users"></i> Members (${membersCount})
          </button>
          <button class="teams-doc-tab ${this.activeTab === 'pinned' ? 'active' : ''}" data-tab="pinned" onclick="Chat.setActiveTab('pinned')">
            <i class="fa fa-thumbtack"></i> Pinned (${pinnedCount})
          </button>
        </div>

        <!-- Meeting & Communication Launcher Toolbar -->
        <div class="teams-topbar-actions">
          <button class="teams-btn-meet" onclick="Chat.startVideoCall({ targetName: '${info.name}' })" title="Launch Instant Video Meeting">
            <i class="fa fa-video"></i> Meet
          </button>
          <button class="teams-topbar-icon-btn" onclick="Chat.startAudioCall({ targetName: '${info.name}' })" title="Audio Huddle">
            <i class="fa fa-phone"></i>
          </button>
          <button class="teams-topbar-icon-btn" onclick="Chat.toggleInChatSearch()" title="Search Messages">
            <i class="fa fa-search"></i>
          </button>
          <button class="teams-topbar-icon-btn" onclick="Chat.setActiveTab('files')" title="View Files & Notes">
            <i class="fa fa-paperclip"></i>
          </button>
        </div>
      </div>

      <!-- In-Chat Search Bar if Active -->
      ${this.inChatSearchActive ? `
        <div style="background:#1e293b;padding:8px 20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <i class="fa fa-search" style="color:#94a3b8;font-size:12px"></i>
          <input type="text" class="teams-search-input" style="flex:1" placeholder="Search in this conversation..." value="${this.inChatSearchQuery}" oninput="Chat.onInChatSearch(this.value)" autofocus>
          <button class="teams-topbar-icon-btn" style="width:24px;height:24px" onclick="Chat.toggleInChatSearch()"><i class="fa fa-times"></i></button>
        </div>
      ` : ''}

      <!-- Dynamic Tab Content Stage -->
      <div class="teams-stage-content" id="teams-stage-content-wrap">
        ${this.renderTabContentHTML(channel)}
      </div>
    `;
  },

  renderTabContentHTML(channel) {
    if (!channel) return '';

    if (this.activeTab === 'files') {
      return this.renderFilesTabHTML(channel);
    } else if (this.activeTab === 'members') {
      return this.renderMembersTabHTML(channel);
    } else if (this.activeTab === 'pinned') {
      return this.renderPinnedTabHTML(channel);
    }

    // Default: 'chat' Posts & Chat Feed
    const messages = this.getMessages(channel.id);
    return `
      <!-- Messages Stream -->
      <div class="teams-messages-scroll" id="teams-messages-scroll">
        <div class="teams-day-divider">
          <span class="teams-day-badge">Today • Q4 Enterprise Workspace</span>
        </div>
        ${this.renderMessagesHTML(messages)}
      </div>

      <!-- Modern Teams Composer -->
      ${this.renderComposerHTML(channel)}
    `;
  },

  // ── 8. Messages Stream & Formatting ────────────────────────
  renderMessagesHTML(messages) {
    if (!messages || messages.length === 0) {
      return `<div style="text-align:center;padding:40px;color:#94a3b8">No messages yet. Send a message to start communicating!</div>`;
    }

    return messages.map(m => {
      const isMe = this.isMyMessage(m);
      const isBot = m.isBot;
      const initial = (m.senderName || 'U').substring(0, 2).toUpperCase();
      const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM';
      const roleStr = m.senderRole || (isBot ? 'HR AI Agent' : (isMe ? 'You' : 'Colleague'));

      return `
        <div class="teams-msg-row ${isMe ? 'msg-own' : ''}" id="msg-card-${m.id}">
          <!-- Hover Action Toolbar -->
          <div class="teams-msg-hover-toolbar">
            <button class="teams-hover-tool-btn" onclick="Chat.toggleReaction('${m.id}', '👍')" title="Thumbs Up">👍</button>
            <button class="teams-hover-tool-btn" onclick="Chat.toggleReaction('${m.id}', '❤️')" title="Heart">❤️</button>
            <button class="teams-hover-tool-btn" onclick="Chat.toggleReaction('${m.id}', '🚀')" title="Rocket">🚀</button>
            <button class="teams-hover-tool-btn" onclick="Chat.toggleReaction('${m.id}', '🎉')" title="Celebrate">🎉</button>
            <button class="teams-hover-tool-btn" onclick="Chat.setReplyingTo('${m.id}', '${m.senderName}', '${m.content.substring(0,40)}')" title="Reply / Quote"><i class="fa fa-reply"></i></button>
            <button class="teams-hover-tool-btn" onclick="Chat.copyMessageText('${m.id}')" title="Copy Text"><i class="fa fa-copy"></i></button>
            <button class="teams-hover-tool-btn" onclick="Chat.togglePinMessage('${m.id}')" title="${m.isPinned ? 'Unpin' : 'Pin to channel'}"><i class="fa fa-thumbtack ${m.isPinned ? 'text-primary' : ''}"></i></button>
            ${isMe ? `<button class="teams-hover-tool-btn text-danger" onclick="Chat.deleteMessage('${m.id}')" title="Delete"><i class="fa fa-trash"></i></button>` : ''}
          </div>

          <!-- Avatar -->
          <div class="teams-msg-avatar" style="background:${isBot ? '#464eb8' : (isMe ? '#2563eb' : '#10b981')}">
            ${isBot ? '<i class="fa fa-robot"></i>' : initial}
          </div>

          <!-- Body -->
          <div class="teams-msg-body">
            <div class="teams-msg-header">
              <span class="teams-msg-author">${m.senderName || 'Team Member'}</span>
              <span class="teams-msg-role-tag">${roleStr}</span>
              <span class="teams-msg-time">${timeStr}</span>
              ${m.isPinned ? `<span style="color:#38bdf8;font-size:11px"><i class="fa fa-thumbtack"></i> Pinned</span>` : ''}
            </div>

            <!-- Content -->
            <div class="teams-msg-content">${this.formatMessageText(m.content)}</div>

            <!-- Document Attachments -->
            ${this.renderAttachmentsHTML(m.attachments)}

            <!-- Emoji Reactions Row -->
            ${this.renderReactionsHTML(m.id, m.reactions)}
          </div>
        </div>
      `;
    }).join('');
  },

  formatMessageText(text) {
    if (!text) return '';
    let esc = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    // Bold **text**
    esc = esc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    esc = esc.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Code block `code`
    esc = esc.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>');

    return esc;
  },

  renderAttachmentsHTML(attachments) {
    if (!attachments || !attachments.length) return '';
    return attachments.map(att => {
      const isPdf = att.ext === 'pdf' || att.name.endsWith('.pdf');
      const isExcel = att.ext === 'excel' || att.name.endsWith('.xlsx');
      const isImg = att.ext === 'img' || att.name.endsWith('.png') || att.name.endsWith('.jpg');

      let iconClass = 'pdf';
      let icon = 'fa-file-pdf';
      if (isExcel) { iconClass = 'excel'; icon = 'fa-file-excel'; }
      if (isImg) { iconClass = 'img'; icon = 'fa-file-image'; }

      return `
        <div class="teams-doc-card">
          <div class="teams-doc-icon ${iconClass}"><i class="fa ${icon}"></i></div>
          <div class="teams-doc-info">
            <div class="teams-doc-name" title="${att.name}">${att.name}</div>
            <div class="teams-doc-size">${att.size || '1.4 MB'} • Verified Document</div>
          </div>
          <button class="teams-doc-download-btn" onclick="Chat.downloadAttachment('${att.name}')" title="Download Document">
            <i class="fa fa-download"></i>
          </button>
        </div>
      `;
    }).join('');
  },

  renderReactionsHTML(msgId, reactions) {
    if (!reactions || Object.keys(reactions).length === 0) return '';
    return `
      <div class="teams-reaction-pills-row">
        ${Object.entries(reactions).map(([emoji, count]) => `
          <button class="teams-reaction-badge" onclick="Chat.toggleReaction('${msgId}', '${emoji}')">
            <span>${emoji}</span> <span>${count}</span>
          </button>
        `).join('')}
      </div>
    `;
  },

  // ── 9. Modern Message Composer ─────────────────────────────
  renderComposerHTML(channel) {
    const isBot = channel.type === 'bot';
    const placeholder = isBot 
      ? 'Ask HRM Copilot about leave balance, attendance rules, tax calculations…' 
      : `Type a message in ${channel.displayName || channel.name} (Enter to send, Shift+Enter for newline)...`;

    return `
      <div class="teams-composer-container">
        <!-- Reply Quote Banner -->
        ${this.replyingTo ? `
          <div style="background:#1e293b;border-left:3px solid #464eb8;padding:6px 12px;margin-bottom:8px;border-radius:4px;display:flex;align-items:center;justify-content:space-between">
            <div style="font-size:12px;color:#cbd5e1">
              Replying to <strong>${this.replyingTo.senderName}</strong>: "${this.replyingTo.content}…"
            </div>
            <i class="fa fa-times" style="cursor:pointer;color:#94a3b8" onclick="Chat.cancelReply()"></i>
          </div>
        ` : ''}

        <div class="teams-composer-box">
          <textarea 
            id="teams-composer-input" 
            class="teams-composer-textarea" 
            placeholder="${placeholder}"
            onkeydown="Chat.onInputKeyDown(event)"
            oninput="this.style.height='auto';this.style.height=Math.min(140, this.scrollHeight)+'px'"></textarea>

          <div class="teams-composer-toolbar">
            <div class="teams-composer-tools-left">
              <button class="teams-composer-tool-btn" onclick="Chat.wrapText('**')" title="Bold"><i class="fa fa-bold"></i></button>
              <button class="teams-composer-tool-btn" onclick="Chat.wrapText('*')" title="Italic"><i class="fa fa-italic"></i></button>
              <button class="teams-composer-tool-btn" onclick="Chat.wrapText(String.fromCharCode(96))" title="Code"><i class="fa fa-code"></i></button>
              <button class="teams-composer-tool-btn" onclick="document.getElementById('teams-file-input').click()" title="Attach File / Document"><i class="fa fa-paperclip"></i></button>
              <input type="file" id="teams-file-input" style="display:none" onchange="Chat.handleFileUpload(this)">
              <button class="teams-composer-tool-btn" onclick="Chat.toggleVoiceRecording()" title="${this.isRecordingVoice ? 'Stop Recording' : 'Record Voice Note'}" style="${this.isRecordingVoice ? 'color:#ef4444' : ''}">
                <i class="fa fa-microphone"></i>
              </button>
              <button class="teams-composer-tool-btn" onclick="Chat.insertEmoji('👍')" title="React">👍</button>
              <button class="teams-composer-tool-btn" onclick="Chat.insertEmoji('🚀')" title="Rocket">🚀</button>
            </div>

            <div style="display:flex;align-items:center;gap:10px">
              ${this.isRecordingVoice ? `
                <span style="color:#ef4444;font-size:11.5px;font-weight:700;display:flex;align-items:center;gap:4px">
                  <span style="width:8px;height:8px;border-radius:50%;background:#ef4444;animation:pulse 1s infinite"></span>
                  0:0${this.voiceDuration}
                </span>
              ` : ''}
              <button class="teams-btn-send" onclick="Chat.sendMessage()">
                <span>Send</span>
                <i class="fa fa-paper-plane" style="font-size:11px"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Copilot Suggested Action Chips if in Bot Channel -->
        ${isBot ? `
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
            <span class="teams-filter-chip" onclick="Chat.sendCopilotPrompt('How many annual leaves do I have left?')">🌴 Leave Balances</span>
            <span class="teams-filter-chip" onclick="Chat.sendCopilotPrompt('What is my latest salary and payslip breakdown?')">💰 My Latest Payslip</span>
            <span class="teams-filter-chip" onclick="Chat.sendCopilotPrompt('What is today\'s biometric check-in attendance summary?')">⏱️ Today\'s Attendance</span>
            <span class="teams-filter-chip" onclick="Chat.sendCopilotPrompt('What is the company probation and remote work policy?')">📖 HR Policy Summary</span>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ── 10. Document & Member Tabs Views ───────────────────────
  renderFilesTabHTML(channel) {
    const files = channel.files || [];
    return `
      <div class="teams-view-container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <h3 style="font-size:16px;font-weight:800;color:var(--text);margin:0">Shared Documents & Files</h3>
            <p style="font-size:12px;color:#94a3b8;margin:2px 0 0 0">All verified files and media shared in ${channel.displayName || channel.name}</p>
          </div>
          <button class="teams-btn-meet" onclick="document.getElementById('teams-file-input').click()">
            <i class="fa fa-cloud-arrow-up"></i> Upload Document
          </button>
        </div>

        ${files.length === 0 ? `
          <div style="text-align:center;padding:60px;color:#94a3b8">
            <i class="fa fa-folder-open" style="font-size:36px;margin-bottom:12px;opacity:0.5"></i>
            <div>No documents shared in this channel yet.</div>
          </div>
        ` : `
          <div class="teams-files-grid">
            ${files.map(f => `
              <div class="teams-file-tile">
                <div class="teams-file-tile-top">
                  <div class="teams-doc-icon ${f.ext || 'pdf'}">
                    <i class="fa ${f.ext === 'excel' ? 'fa-file-excel' : (f.ext === 'img' ? 'fa-file-image' : 'fa-file-pdf')}"></i>
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</div>
                    <div style="font-size:11px;color:#94a3b8">${f.size} • Uploaded by ${f.uploadedBy || 'Sara Malik'}</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px">
                  <span style="font-size:11px;color:#64748b">${f.date || 'Recent'}</span>
                  <button class="teams-btn-dm" style="width:auto;padding:4px 12px" onclick="Chat.downloadAttachment('${f.name}')">
                    <i class="fa fa-download"></i> Download
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderMembersTabHTML(channel) {
    const memberIds = channel.members || [];
    const allEmps = (typeof DB !== 'undefined' && DB.get('employees')) || [];
    const members = memberIds.map(id => {
      const found = allEmps.find(e => e.id === id);
      if (found) return found;
      if (id === 1) return { id: 1, fullName: 'Ahmed Khan', role: 'Super Administrator', department: 'Executive', email: 'admin@company.com' };
      if (id === 2) return { id: 2, fullName: 'Sara Malik', role: 'HR Director', department: 'Human Resources', email: 'sara.malik@company.com' };
      if (id === 3) return { id: 3, fullName: 'Usman Baig', role: 'Engineering Manager', department: 'Engineering', email: 'usman.baig@company.com' };
      if (id === 4) return { id: 4, fullName: 'Fatima Raza', role: 'Lead Software Engineer', department: 'Engineering', email: 'fatima.raza@company.com' };
      if (id === 5) return { id: 5, fullName: 'Saad Ibrahim', role: 'New Joiner', department: 'Engineering', email: 'saad.ibrahim@company.com' };
      if (id === 101) return { id: 101, fullName: 'Wajiha Mazhar', role: 'Senior Product Designer', department: 'UI/UX Design', email: 'wajiha.mazhar@company.com' };
      return { id, fullName: 'Colleague', role: 'Staff Member', department: 'Operations', email: 'staff@company.com' };
    });

    return `
      <div class="teams-view-container">
        <div style="margin-bottom:16px">
          <h3 style="font-size:16px;font-weight:800;color:var(--text);margin:0">Channel Members (${members.length})</h3>
          <p style="font-size:12px;color:#94a3b8;margin:2px 0 0 0">Colleagues with active access to ${channel.displayName || channel.name}</p>
        </div>

        <div class="teams-members-grid">
          ${members.map(m => `
            <div class="teams-member-card">
              <div class="teams-member-card-avatar">
                ${m.fullName.substring(0, 2).toUpperCase()}
                <span class="teams-member-card-dot online"></span>
              </div>
              <div style="font-size:13.5px;font-weight:700;color:var(--text);margin-top:4px">${m.fullName}</div>
              <div style="font-size:11.5px;color:#818cf8;font-weight:600">${m.role || 'Staff Member'}</div>
              <div style="font-size:11px;color:#94a3b8">${m.department || 'Operations'}</div>
              <button class="teams-btn-dm" onclick="Chat.startDirectChatWithEmployee(${m.id}, '${m.fullName}')">
                <i class="fa fa-comment-dots"></i> Message
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderPinnedTabHTML(channel) {
    const messages = this.getMessages(channel.id);
    const pinned = messages.filter(m => m.isPinned);

    return `
      <div class="teams-view-container">
        <div style="margin-bottom:16px">
          <h3 style="font-size:16px;font-weight:800;color:var(--text);margin:0">Pinned Announcements (${pinned.length})</h3>
          <p style="font-size:12px;color:#94a3b8;margin:2px 0 0 0">Important notices pinned by moderators in this channel</p>
        </div>

        ${pinned.length === 0 ? `
          <div style="text-align:center;padding:60px;color:#94a3b8">No pinned notices in this channel yet.</div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:12px">
            ${pinned.map(p => `
              <div style="background:#1e293b;border-left:4px solid #38bdf8;padding:16px;border-radius:8px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <span style="font-size:13px;font-weight:700;color:var(--text)">${p.senderName} (${p.senderRole || 'Admin'})</span>
                  <span style="font-size:11px;color:#64748b">${new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <div style="font-size:13px;color:#e2e8f0;line-height:1.5">${this.formatMessageText(p.content)}</div>
                <div style="margin-top:12px;text-align:right">
                  <button class="teams-btn-dm" style="width:auto;padding:4px 12px" onclick="Chat.setActiveTab('chat')">
                    <i class="fa fa-arrow-turn-down"></i> Jump to Message
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // ── 11. Specialized Rail Views (Calls & Global Files) ──────
  renderCallsViewHTML() {
    const colleagues = [
      { name: 'Sara Malik', role: 'HR Director', avatar: 'SM', bg: '#10b981' },
      { name: 'Usman Baig', role: 'Engineering Manager', avatar: 'UB', bg: '#8b5cf6' },
      { name: 'Fatima Raza', role: 'Lead Software Engineer', avatar: 'FR', bg: '#0284c7' },
      { name: 'Saad Ibrahim', role: 'New Joiner', avatar: 'SI', bg: '#f59e0b' },
      { name: 'Wajiha Mazhar', role: 'Senior Product Designer', avatar: 'WM', bg: '#ec4899' }
    ];

    return `
      <div class="teams-roster-column" style="width:340px">
        <div class="teams-workspace-header">
          <div class="teams-workspace-name"><i class="fa fa-phone" style="color:#464eb8"></i> Teams Calling Hub</div>
        </div>
        <div style="padding:16px;overflow-y:auto;flex:1">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:12px">Speed Dial Colleagues</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${colleagues.map(c => `
              <div style="background:#1e293b;border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:34px;height:34px;border-radius:50%;background:${c.bg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${c.avatar}</div>
                  <div>
                    <div style="font-size:13px;font-weight:700;color:var(--text)">${c.name}</div>
                    <div style="font-size:11px;color:#94a3b8">${c.role}</div>
                  </div>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="teams-topbar-icon-btn" onclick="Chat.startVideoCall({ targetName: '${c.name}' })" title="Video Call"><i class="fa fa-video"></i></button>
                  <button class="teams-topbar-icon-btn" onclick="Chat.startAudioCall({ targetName: '${c.name}' })" title="Audio Call"><i class="fa fa-phone"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderGlobalFilesViewHTML() {
    return `
      <div class="teams-roster-column" style="width:340px">
        <div class="teams-workspace-header">
          <div class="teams-workspace-name"><i class="fa fa-folder-open" style="color:#464eb8"></i> Company Repository</div>
        </div>
        <div style="padding:16px;overflow-y:auto;flex:1">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:12px">Enterprise Folders</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="teams-item-row" onclick="Chat.openChannel('chan-finance'); Chat.setActiveTab('files');">
              <i class="fa fa-folder" style="color:#f59e0b;font-size:16px"></i>
              <div class="teams-item-details">
                <div class="teams-item-title">Payroll & Financial Statements</div>
                <div class="teams-item-snippet">2 Files • Updated Today</div>
              </div>
            </div>
            <div class="teams-item-row" onclick="Chat.openChannel('chan-hr'); Chat.setActiveTab('files');">
              <i class="fa fa-folder" style="color:#10b981;font-size:16px"></i>
              <div class="teams-item-details">
                <div class="teams-item-title">HR Policies & Benefit Handbooks</div>
                <div class="teams-item-snippet">2 Files • Verified</div>
              </div>
            </div>
            <div class="teams-item-row" onclick="Chat.openChannel('chan-general'); Chat.setActiveTab('files');">
              <i class="fa fa-folder" style="color:#464eb8;font-size:16px"></i>
              <div class="teams-item-details">
                <div class="teams-item-title">Company Holiday Calendars & Townhalls</div>
                <div class="teams-item-snippet">2 Files • 2026 Ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ── 12. Message Sending & Reactions ────────────────────────
  sendMessage() {
    const input = document.getElementById('teams-composer-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const me = this.getCurrentUser();
    const channel = this.getActiveChannel();
    if (!channel) return;

    const newMsg = {
      id: 'msg-' + Date.now(),
      channelId: channel.id,
      senderId: me.id,
      senderName: me.fullName,
      senderRole: me.role === 'admin' ? 'Super Administrator' : 'Team Member',
      content: text,
      createdAt: new Date().toISOString(),
      reactions: {}
    };

    if (this.replyingTo) {
      newMsg.replyTo = { ...this.replyingTo };
      this.replyingTo = null;
    }

    if (typeof DB !== 'undefined') {
      const messages = DB.get('chat_messages') || [];
      messages.push(newMsg);
      DB.set('chat_messages', messages);

      // Update channel last message
      const channels = DB.get('chat_channels') || [];
      const ch = channels.find(c => c.id === channel.id);
      if (ch) {
        ch.lastMessage = `${me.fullName}: ${text.substring(0, 30)}`;
        ch.time = 'Just now';
        DB.set('chat_channels', channels);
      }
    }

    this.playMessageSound('outgoing');
    input.value = '';
    input.style.height = 'auto';

    this.renderStageArea();
    this.renderRosterList();

    // Broadcast WebSocket
    if (typeof HRMWebSocket !== 'undefined' && typeof HRMWebSocket.send === 'function') {
      HRMWebSocket.send('chat:message', { message: newMsg });
    }

    // AI Copilot Auto-Response
    if (channel.type === 'bot') {
      setTimeout(() => this.handleCopilotQuery(text), 600);
    }
  },

  onInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  },

  toggleReaction(msgId, emoji) {
    if (typeof DB === 'undefined') return;
    const messages = DB.get('chat_messages') || [];
    const m = messages.find(x => x.id === msgId);
    if (!m) return;
    if (!m.reactions) m.reactions = {};

    if (m.reactions[emoji]) {
      m.reactions[emoji]++;
    } else {
      m.reactions[emoji] = 1;
    }

    DB.set('chat_messages', messages);
    this.renderStageArea();
  },

  setReplyingTo(id, senderName, content) {
    this.replyingTo = { id, senderName, content };
    this.renderStageArea();
    const input = document.getElementById('teams-composer-input');
    if (input) input.focus();
  },

  cancelReply() {
    this.replyingTo = null;
    this.renderStageArea();
  },

  copyMessageText(msgId) {
    if (typeof DB === 'undefined') return;
    const messages = DB.get('chat_messages') || [];
    const m = messages.find(x => x.id === msgId);
    if (m && m.content && navigator.clipboard) {
      navigator.clipboard.writeText(m.content);
      if (typeof Toast !== 'undefined') Toast.show('Message copied to clipboard', 'info');
    }
  },

  togglePinMessage(msgId) {
    if (typeof DB === 'undefined') return;
    const messages = DB.get('chat_messages') || [];
    const m = messages.find(x => x.id === msgId);
    if (m) {
      m.isPinned = !m.isPinned;
      DB.set('chat_messages', messages);
      this.renderStageArea();
      if (typeof Toast !== 'undefined') Toast.show(m.isPinned ? 'Notice pinned to channel' : 'Notice unpinned', 'success');
    }
  },

  deleteMessage(msgId) {
    if (typeof DB === 'undefined') return;
    let messages = DB.get('chat_messages') || [];
    messages = messages.filter(x => x.id !== msgId);
    DB.set('chat_messages', messages);
    this.renderStageArea();
    if (typeof Toast !== 'undefined') Toast.show('Message deleted', 'info');
  },

  downloadAttachment(name) {
    if (typeof Toast !== 'undefined') Toast.show(`Downloading: ${name}`, 'info');
  },

  wrapText(tag) {
    const input = document.getElementById('teams-composer-input');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const sel = input.value.substring(start, end);
    input.value = input.value.substring(0, start) + tag + sel + tag + input.value.substring(end);
    input.focus();
  },

  insertEmoji(emoji) {
    const input = document.getElementById('teams-composer-input');
    if (!input) return;
    input.value += emoji + ' ';
    input.focus();
  },

  handleFileUpload(fileInput) {
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
    const file = fileInput.files[0];
    const channel = this.getActiveChannel();
    if (!channel) return;

    const ext = file.name.endsWith('.pdf') ? 'pdf' : (file.name.endsWith('.xlsx') ? 'excel' : 'img');
    const newDoc = {
      id: 'doc-' + Date.now(),
      name: file.name,
      size: (file.size / 1024 > 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB'),
      ext,
      uploadedBy: this.getCurrentUser().fullName,
      date: 'Just now'
    };

    if (!channel.files) channel.files = [];
    channel.files.push(newDoc);

    const channels = DB.get('chat_channels') || [];
    const ch = channels.find(c => c.id === channel.id);
    if (ch) {
      if (!ch.files) ch.files = [];
      ch.files.push(newDoc);
      DB.set('chat_channels', channels);
    }

    if (typeof Toast !== 'undefined') Toast.show(`Uploaded: ${file.name}`, 'success');
    this.renderStageArea();
  },

  // ── 13. Video Meeting & Audio Call Launcher ────────────────
  startVideoCall(options = {}) {
    this.launchCallModal('video', options);
  },

  startAudioCall(options = {}) {
    this.launchCallModal('audio', options);
  },

  launchCallModal(type = 'video', options = {}) {
    const channel = this.getActiveChannel();
    const info = this.getChannelDisplayInfo(channel);
    const targetName = options.targetName || info.name;

    this.playMessageSound('ring');

    const existing = document.getElementById('teams-call-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'teams-call-modal-overlay';
    overlay.id = 'teams-call-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;';

    overlay.innerHTML = `
      <div style="background:#111827;border:1px solid rgba(255,255,255,0.15);width:90%;max-width:860px;height:540px;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.6)">
        <!-- Call Header -->
        <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="width:28px;height:28px;border-radius:6px;background:#464eb8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px">
              <i class="fa ${type === 'video' ? 'fa-video' : 'fa-phone'}"></i>
            </span>
            <div>
              <div style="font-size:14px;font-weight:700;color:#fff">${targetName}</div>
              <div style="font-size:11px;color:#38bdf8">Live Encrypted Enterprise Call • 00:24</div>
            </div>
          </div>
          <button style="border:none;background:transparent;color:#94a3b8;font-size:18px;cursor:pointer" onclick="Chat.endCall()"><i class="fa fa-times"></i></button>
        </div>

        <!-- Video Simulation Canvas -->
        <div style="flex:1;background:#030712;position:relative;display:flex;align-items:center;justify-content:center">
          <div style="text-align:center">
            <div style="width:90px;height:90px;border-radius:50%;background:#464eb8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;margin:0 auto 16px auto;box-shadow:0 0 40px rgba(70,78,184,0.6)">
              ${targetName.substring(0, 2).toUpperCase()}
            </div>
            <div style="font-size:18px;font-weight:800;color:#fff">${targetName}</div>
            <div style="font-size:12px;color:#10b981;margin-top:4px">Connected via Apex WebRTC Gateway</div>
          </div>

          <!-- Bottom Call Controls Pill -->
          <div style="position:absolute;bottom:24px;background:#1e293b;padding:8px 20px;border-radius:9999px;border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;gap:14px;box-shadow:0 8px 30px rgba(0,0,0,0.5)">
            <button class="teams-topbar-icon-btn" style="border-radius:50%;width:38px;height:38px" onclick="if(typeof Toast!=='undefined') Toast.show('Microphone toggled', 'info')"><i class="fa fa-microphone"></i></button>
            <button class="teams-topbar-icon-btn" style="border-radius:50%;width:38px;height:38px" onclick="if(typeof Toast!=='undefined') Toast.show('Camera toggled', 'info')"><i class="fa fa-video"></i></button>
            <button class="teams-topbar-icon-btn" style="border-radius:50%;width:38px;height:38px" onclick="if(typeof Toast!=='undefined') Toast.show('Screen sharing active', 'info')"><i class="fa fa-desktop"></i></button>
            <button style="border:none;background:#ef4444;color:#fff;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,0.5)" onclick="Chat.endCall()" title="End Call">
              <i class="fa fa-phone-slash"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  },

  endCall() {
    this.playMessageSound('hangup');
    const el = document.getElementById('teams-call-modal-overlay');
    if (el) el.remove();
    if (typeof Toast !== 'undefined') Toast.show('Call ended', 'info');
  },

  // ── 14. Voice Recording & AI Copilot ───────────────────────
  toggleVoiceRecording() {
    this.isRecordingVoice = !this.isRecordingVoice;
    this.renderStageArea();
    if (this.isRecordingVoice) {
      this.voiceDuration = 0;
      this.voiceTimer = setInterval(() => {
        this.voiceDuration++;
        this.renderStageArea();
        if (this.voiceDuration > 9) {
          clearInterval(this.voiceTimer);
          this.isRecordingVoice = false;
          this.sendMessage();
        }
      }, 1000);
    } else {
      if (this.voiceTimer) clearInterval(this.voiceTimer);
    }
  },

  sendCopilotPrompt(prompt) {
    const input = document.getElementById('teams-composer-input');
    if (input) input.value = prompt;
    this.sendMessage();
  },

  handleCopilotQuery(prompt) {
    const lower = prompt.toLowerCase();
    let reply = "I am processing your corporate HR request through the system database.";

    if (lower.includes('leave') || lower.includes('holiday')) {
      reply = "🌴 **Your Current Leave Balances (2026):**\n- **Annual Paid Leaves:** 14 days remaining\n- **Casual Leaves:** 6 days remaining\n- **Medical Leaves:** 8 days available\n\n*You can submit an instant approval request from the Leave Management module.*";
    } else if (lower.includes('salary') || lower.includes('payslip') || lower.includes('tax')) {
      reply = "💰 **Latest Payroll Breakdown:**\n- **Base Salary:** Dispatched on 1st of every month\n- **Statutory Deductions:** EOBI (1%) & Income Tax Slab F-2 applied\n- **Net Bank Transfer:** Verified\n\n*Detailed encrypted PDF payslips can be downloaded from the Payroll tab.*";
    } else if (lower.includes('attendance') || lower.includes('check-in')) {
      reply = "⏱️ **Today's Attendance Status:**\n- **First Check-In:** 09:04 AM (On Time)\n- **Biometric Device:** Main Entrance Terminal 01\n- **Working Hours:** 8h 12m elapsed\n\n*Status: Present • Compliant with company shift rules.*";
    } else {
      reply = "🤖 **HR Policy Intelligence:**\nI have verified internal company guidelines. Regular working hours are Monday to Friday, 9:00 AM – 6:00 PM with 1-hour lunch break. Expense reimbursement claims close on the 25th of each month.";
    }

    const botMsg = {
      id: 'bot-' + Date.now(),
      channelId: 'chan-copilot',
      senderId: 999,
      senderName: 'HRM AI Copilot',
      senderRole: 'AI Agent',
      content: reply,
      isBot: true,
      createdAt: new Date().toISOString()
    };

    const messages = DB.get('chat_messages') || [];
    messages.push(botMsg);
    DB.set('chat_messages', messages);

    this.playMessageSound('incoming');
    this.renderStageArea();
  },

  // ── 15. Status Popover & Utilities ─────────────────────────
  showStatusPopover() {
    const states = [
      { key: 'online', label: 'Available', dot: '#10b981' },
      { key: 'busy', label: 'In a Meeting / Busy', dot: '#ef4444' },
      { key: 'away', label: 'Be Right Back / Away', dot: '#f59e0b' },
      { key: 'offline', label: 'Appear Offline', dot: '#64748b' }
    ];

    const current = this.userCustomStatus.presence;
    const next = current === 'online' ? 'busy' : (current === 'busy' ? 'away' : 'online');
    const matched = states.find(s => s.key === next);
    this.userCustomStatus = { presence: matched.key, statusText: matched.label };

    this.renderRosterColumnHTML();
    this.renderRosterList();
    if (typeof Toast !== 'undefined') Toast.show(`Presence updated: ${matched.label}`, 'info');
  },

  updatePresenceUI() {
    this.renderRosterList();
  },

  startDirectChatWithEmployee(empId, name) {
    const username = name.toLowerCase().replace(/\s+/g, '.');
    let channelId = 'chan-dm-' + username.split('.')[0];
    let channel = this.getChannels().find(c => c.id === channelId);

    if (!channel) {
      channel = {
        id: channelId,
        name: name,
        displayName: name,
        username: username,
        role: 'Team Member',
        type: 'direct',
        isFavorite: false,
        time: 'Now',
        lastMessage: 'Direct conversation started.',
        avatar: name.substring(0, 2).toUpperCase(),
        avatarBg: '#464eb8',
        targetEmpId: empId,
        members: [1, empId]
      };
      const channels = DB.get('chat_channels') || [];
      channels.push(channel);
      DB.set('chat_channels', channels);
    }

    this.openChannel(channel.id);
  },

  startNewChat(type = 'dm') {
    const name = prompt(type === 'channel' ? 'Enter new channel name (e.g. mobile-app-team):' : 'Enter colleague name to message:');
    if (!name || !name.trim()) return;

    const trimmed = name.trim();
    const id = (type === 'channel' ? 'chan-' : 'chan-dm-') + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newChan = {
      id,
      name: trimmed,
      displayName: (type === 'channel' ? '# ' : '') + trimmed,
      type: type === 'channel' ? 'channel' : 'direct',
      isFavorite: false,
      time: 'Just now',
      lastMessage: 'Channel created.',
      avatar: type === 'channel' ? 'fa-hashtag' : trimmed.substring(0,2).toUpperCase(),
      avatarBg: '#464eb8',
      members: [1],
      files: []
    };

    const channels = DB.get('chat_channels') || [];
    channels.push(newChan);
    DB.set('chat_channels', channels);

    this.openChannel(newChan.id);
  },

  toggleSection(sectionKey) {
    this.collapsedSections[sectionKey] = !this.collapsedSections[sectionKey];
    this.renderRosterList();
  },

  toggleInChatSearch() {
    this.inChatSearchActive = !this.inChatSearchActive;
    this.renderStageArea();
  },

  onInChatSearch(query) {
    this.inChatSearchQuery = query;
  },

  scrollToBottom() {
    setTimeout(() => {
      const scroll = document.getElementById('teams-messages-scroll');
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
    }, 40);
  },

  closeDrawer() {
    this.isOpen = false;
  },

  toggleDrawer() {
    if (typeof App !== 'undefined' && App.navigate) App.navigate('chat');
  }
};
