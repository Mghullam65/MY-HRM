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

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.pro-composer-plus-wrap') && !e.target.closest('.pro-emoji-popover')) {
          Chat.closePopovers();
        }
      });
    }

    console.log('%c💼 Pro Teams Workspace initialized', 'color:#2563eb;font-weight:700');
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
    if (msg.id === 'gen-1' || msg.id === 'gen-2' || msg.id === 'gen-3') return false;
    if (msg.id === 'gen-4') return true;
    if (msg.isOwn) return true;
    const me = this.getCurrentUser();
    if (msg.senderId !== undefined && msg.senderId !== null && me && me.id) {
      if (parseInt(msg.senderId, 10) === parseInt(me.id, 10)) return true;
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
        displayName: 'General',
        topic: 'Company-wide announcements, townhalls & team discussions',
        description: 'Company-wide announcements, townhalls & team discussions',
        type: 'channel',
        isFavorite: true,
        time: '10:24 AM',
        lastMessage: 'Q4 goals have been updated...',
        avatar: 'G',
        avatarBg: '#3b82f6',
        avatarColor: '#ffffff',
        isPinned: true,
        members: [1, 2, 3, 4, 5, 26, 101, 102],
        files: [
          { id: 'f-1', name: 'Company_Holiday_Calendar_2026.pdf', size: '1.2 MB', ext: 'pdf', uploadedBy: 'Ahmed Khan', date: 'Oct 08, 2026' }
        ]
      },
      {
        id: 'chan-hr-announcements',
        name: 'hr-announcements',
        displayName: 'HR Announcements',
        topic: 'Official human resource notices, policies & holidays',
        description: 'Official human resource notices, policies & holidays',
        type: 'channel',
        isFavorite: true,
        time: '09:18 AM',
        unreadCount: 2,
        lastMessage: 'New policy has been shared',
        avatar: 'fa-bullhorn',
        avatarBg: '#f3e8ff',
        avatarColor: '#9333ea',
        members: [1, 2, 4, 5, 26],
        files: [
          { id: 'f-3', name: 'Leave_Policy_Handbook_2026.pdf', size: '2.1 MB', ext: 'pdf', uploadedBy: 'Sara Malik', date: 'Sep 28, 2026' }
        ]
      },
      {
        id: 'chan-operations',
        name: 'operations-team',
        displayName: 'Operations Team',
        topic: 'Logistics, shifts, office ops & biometric device sync',
        description: 'Operations coordination and facility management',
        type: 'channel',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: 'Please check the latest report',
        avatar: 'fa-users',
        avatarBg: '#dcfce7',
        avatarColor: '#16a34a',
        members: [1, 2, 3, 5],
        files: []
      },
      {
        id: 'chan-project-updates',
        name: 'project-updates',
        displayName: 'Project Updates',
        topic: 'Sprint planning at 3 PM',
        description: 'Cross-functional project sprints and product releases',
        type: 'channel',
        isFavorite: false,
        time: 'Yesterday',
        lastMessage: 'Sprint planning at 3 PM',
        avatar: 'PU',
        avatarBg: '#ffedd5',
        avatarColor: '#ea580c',
        members: [1, 3, 4, 101],
        files: []
      },
      {
        id: 'chan-it-support',
        name: 'it-support',
        displayName: 'IT Support',
        topic: 'Your request has been resolved',
        description: 'Hardware, email, VPN and portal technical assistance',
        type: 'channel',
        isFavorite: false,
        time: 'Oct 06',
        lastMessage: 'Your request has been resolved',
        avatar: 'IT',
        avatarBg: '#fce7f3',
        avatarColor: '#db2777',
        members: [1, 3, 26],
        files: []
      },
      {
        id: 'chan-finance',
        name: 'finance',
        displayName: 'Finance',
        topic: 'Monthly summary attached',
        description: 'Monthly payroll schedules, statutory tax brackets & expense claims',
        type: 'channel',
        isFavorite: false,
        time: 'Oct 05',
        lastMessage: 'Monthly summary attached',
        avatar: 'FI',
        avatarBg: '#e0f2fe',
        avatarColor: '#0284c7',
        members: [1, 2, 5],
        files: [
          { id: 'f-6', name: 'Q4_Salary_Structure_Approved.pdf', size: '1.5 MB', ext: 'pdf', uploadedBy: 'Ahmed Khan', date: 'Oct 01, 2026' }
        ]
      },
      {
        id: 'chan-tech',
        name: 'engineering',
        displayName: 'Engineering',
        topic: 'Build deployed successfully',
        description: 'Architecture, release sprints, CI/CD pipeline & code reviews',
        type: 'channel',
        isFavorite: false,
        time: 'Oct 05',
        hasUnreadDot: true,
        lastMessage: 'Build deployed successfully',
        avatar: 'EN',
        avatarBg: '#d1fae5',
        avatarColor: '#059669',
        members: [1, 3, 4, 101, 102],
        files: [
          { id: 'f-5', name: 'System_Architecture_Diagram_v2.png', size: '820 KB', ext: 'img', uploadedBy: 'Fatima Raza', date: 'Yesterday' }
        ]
      },
      {
        id: 'chan-design-team',
        name: 'design-team',
        displayName: 'Design Team',
        topic: 'New assets uploaded',
        description: 'Design system, wireframes, user testing & UI assets',
        type: 'channel',
        isFavorite: false,
        time: 'Oct 04',
        lastMessage: 'New assets uploaded',
        avatar: 'DE',
        avatarBg: '#fee2e2',
        avatarColor: '#dc2626',
        members: [1, 101],
        files: []
      },
      {
        id: 'chan-marketing',
        name: 'marketing',
        displayName: 'Marketing',
        topic: 'Campaign ideas discussion',
        description: 'Corporate branding, LinkedIn announcements and event outreach',
        type: 'channel',
        isFavorite: false,
        time: 'Oct 04',
        lastMessage: 'Campaign ideas discussion',
        avatar: 'MA',
        avatarBg: '#ede9fe',
        avatarColor: '#7c3aed',
        members: [1, 2, 101],
        files: []
      },
      {
        id: 'chan-watercooler',
        name: 'random',
        displayName: 'Random',
        topic: 'Ali: Thanks!',
        description: 'Casual coffee chats, colleague birthdays & team celebrations',
        type: 'channel',
        isFavorite: false,
        time: 'Oct 03',
        lastMessage: 'Ali: Thanks!',
        avatar: 'RA',
        avatarBg: '#fef3c7',
        avatarColor: '#d97706',
        members: [1, 2, 3, 4, 5, 101],
        files: []
      },
      // Direct Messages with Real Company Personnel (Colleagues & HR)
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
        role: 'Onboarding Employee',
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
          senderId: 101,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          avatar: 'AK',
          avatarBg: '#3b82f6',
          isOnline: true,
          time: '09:09 AM',
          content: 'Good morning everyone! 👋\nWe have deployed our new centralized HRM Enterprise Suite & Team Workspace. Please take a look at the attached 2026 holiday calendar.',
          attachments: [{ name: 'Company_Holiday_Calendar_2026.pdf', size: '1.2 MB', ext: 'pdf' }],
          isPinned: true,
          reactions: { '👍': 12, '❤️': 8, '🎉': 5 },
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'gen-2',
          channelId: 'chan-general',
          senderId: 2,
          senderName: 'Sara Malik',
          senderRole: 'HR Director',
          avatar: 'SM',
          avatarBg: '#9333ea',
          isOnline: true,
          time: '09:15 AM',
          content: 'Reminder: The Quarterly HR Town Hall is scheduled for this Friday at 3:00 PM in Conference Hall A & live via Teams Video Call.',
          meeting: {
            id: 'meet-townhall',
            title: 'Quarterly HR Town Hall',
            dateTime: 'Friday, 10 Oct 2026 • 3:00 PM - 4:00 PM',
            location: 'Conference Hall A & Teams Video Call',
            joinUrl: '#call'
          },
          reactions: { '👍': 6, '❤️': 3 },
          createdAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: 'gen-3',
          channelId: 'chan-general',
          senderId: 101,
          senderName: 'Ahmed Khan',
          senderRole: 'Super Administrator',
          avatar: 'AK',
          avatarBg: '#3b82f6',
          isOnline: true,
          time: '10:20 AM',
          content: 'All departmental quarterly goals have been mapped to OKRs. Great execution team! 🚀',
          reactions: { '👍': 9, '🎉': 4 },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'gen-4',
          channelId: 'chan-general',
          senderId: 9999,
          senderName: 'You',
          time: '10:24 AM',
          isOwn: true,
          status: 'read',
          content: 'Can you share the detailed report as well?',
          createdAt: new Date(Date.now() - 60000).toISOString()
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
    this.unreadCounts['chan-hr-announcements'] = 2;
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
    const me = this.getCurrentUser();
    const initials = me.fullName ? me.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JD';
    const totalUnread = this.getTotalUnreadCount();

    container.innerHTML = `
      <div class="pro-teams-workspace">
        <!-- 1. Top Header Bar -->
        <header class="pro-teams-topbar">
          <div class="pro-topbar-left">
            <div class="pro-teams-brand-pill" onclick="Chat.setFilter('all')" style="cursor:pointer" title="Pro Teams Workspace">
              <i class="fa fa-comments" style="color:#2563eb;font-size:17px"></i>
              <span>Pro Teams</span>
            </div>
          </div>

          <div class="pro-topbar-center">
            <div class="pro-top-search-wrap">
              <i class="fa fa-search pro-top-search-icon"></i>
              <input 
                type="text" 
                class="pro-top-search-input" 
                placeholder="Search messages, people, files..."
                oninput="Chat.onGlobalSearch(this.value)">
            </div>
          </div>

          <div class="pro-topbar-right">
            <button class="pro-top-btn" onclick="Chat.startVideoCall()" title="Start Instant Video Meeting">
              <i class="fa fa-video"></i>
            </button>
            <button class="pro-top-btn" onclick="Chat.startAudioCall()" title="Audio Huddle">
              <i class="fa fa-phone"></i>
            </button>
            <button class="pro-top-btn" onclick="if (typeof App !== 'undefined') App.navigate('dashboard');" title="Return to HRM Suite">
              <i class="fa fa-th"></i>
            </button>
            <button class="pro-top-logout-btn" onclick="Chat.logout()" title="Logout from Pro Teams">
              <i class="fa fa-arrow-right-from-bracket"></i>
              <span>Logout</span>
            </button>
            <div class="pro-top-avatar-wrap" onclick="Chat.showStatusPopover(event)" title="${me.fullName} (${me.role})">
              <div class="pro-top-avatar" style="background:#6366f1">${initials}</div>
              <span class="pro-top-status-dot"></span>
            </div>
          </div>
        </header>

        <!-- 2. Workspace Body: Left Sidebar + Right Stage -->
        <div class="pro-teams-body">
          <aside class="pro-teams-sidebar">
            <div class="pro-sidebar-header">
              <h2 class="pro-sidebar-title">Chat</h2>
              <button class="pro-compose-btn" onclick="Chat.startNewChat()" title="New Chat (Direct or Channel)">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
            </div>

            <div class="pro-sidebar-search">
              <i class="fa fa-search"></i>
              <input 
                type="text" 
                placeholder="Search chats, messages..." 
                oninput="Chat.filterRoster(this.value)">
            </div>

            <div class="pro-filter-pills">
              <button class="pro-filter-pill ${this.activeFilter === 'all' ? 'active' : ''}" onclick="Chat.setFilter('all')">All</button>
              <button class="pro-filter-pill ${this.activeFilter === 'unread' ? 'active' : ''}" onclick="Chat.setFilter('unread')">
                Unread <span class="pro-badge-red">${totalUnread || 3}</span>
              </button>
              <button class="pro-filter-pill ${this.activeFilter === 'mentions' ? 'active' : ''}" onclick="Chat.setFilter('mentions')">Mentions</button>
              <button class="pro-filter-pill ${this.activeFilter === 'files' ? 'active' : ''}" onclick="Chat.setFilter('files')">Files</button>
            </div>

            <div class="pro-chat-list" id="pro-chat-list">
              <!-- Rendered by renderRosterList -->
            </div>

            <div class="pro-sidebar-footer">
              <div class="pro-sidebar-user" onclick="Chat.showStatusPopover(event)" title="Presence & Account Settings">
                <div class="pro-sidebar-user-avatar" style="background:#6366f1">${initials}</div>
                <div class="pro-sidebar-user-meta">
                  <div class="pro-sidebar-user-name">${me.fullName || 'User'}</div>
                  <div class="pro-sidebar-user-status"><span class="pro-status-dot-mini"></span> Online</div>
                </div>
              </div>
              <button class="pro-sidebar-logout-btn" onclick="Chat.logout()" title="Sign Out of Pro Teams">
                <i class="fa fa-arrow-right-from-bracket"></i>
              </button>
            </div>
          </aside>

          <!-- Right Conversation Stage -->
          <main class="pro-teams-stage" id="pro-teams-stage">
            ${this.renderStageAreaHTML(channel, info)}
          </main>
        </div>
      </div>
    `;

    this.renderRosterList();
    this.scrollToBottom();
  },

  onGlobalSearch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.renderRosterList();
      return;
    }
    this.renderRosterList(q);
  },

  filterRoster(query) {
    this.renderRosterList(query);
  },

  renderRosterList(searchQuery = '') {
    const listEl = document.getElementById('pro-chat-list');
    if (!listEl) return;

    const channels = this.getChannels();
    const q = (searchQuery || '').toLowerCase().trim();

    let items = channels;
    if (this.activeFilter === 'unread') {
      items = items.filter(c => (this.unreadCounts[c.id] || 0) > 0 || c.hasUnreadDot);
    } else if (this.activeFilter === 'mentions') {
      items = items.filter(c => c.type === 'direct');
    } else if (this.activeFilter === 'files') {
      items = items.filter(c => (c.files || []).length > 0);
    }

    if (q) {
      items = items.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.displayName && c.displayName.toLowerCase().includes(q)) ||
        (c.topic && c.topic.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    }

    listEl.innerHTML = items.map(c => {
      const isActive = c.id === this.activeChannelId;
      const unread = this.unreadCounts[c.id] || c.unreadCount || 0;
      const isPinned = c.isPinned;

      let avatarContent = '';
      if (c.avatar && c.avatar.startsWith('fa-')) {
        avatarContent = `<i class="fa ${c.avatar}" style="color:${c.avatarColor || '#fff'}"></i>`;
      } else {
        avatarContent = c.avatar || (c.name ? c.name.substring(0, 2).toUpperCase() : 'CH');
      }

      return `
        <div class="pro-chat-item ${isActive ? 'active' : ''}" onclick="Chat.openChannel('${c.id}')" data-channel-id="${c.id}">
          <div class="pro-chat-avatar" style="background:${c.avatarBg || '#3b82f6'};color:${c.avatarColor || '#fff'}">
            ${avatarContent}
            ${c.hasUnreadDot ? '<span class="pro-unread-dot"></span>' : ''}
          </div>
          <div class="pro-chat-info">
            <div class="pro-chat-row-1">
              <span class="pro-chat-name">${c.displayName || c.name}</span>
              <span class="pro-chat-time">${c.time || ''}</span>
            </div>
            <div class="pro-chat-row-2">
              <span class="pro-chat-snippet">${c.lastMessage || c.topic || ''}</span>
              ${isPinned ? '<span class="pro-pin-icon"><i class="fa fa-thumbtack"></i></span>' : ''}
              ${unread > 0 ? `<span class="pro-unread-pill">${unread}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderStageArea() {
    const stage = document.getElementById('pro-teams-stage');
    if (!stage) return;
    const channel = this.getActiveChannel();
    const info = this.getChannelDisplayInfo(channel);
    stage.innerHTML = this.renderStageAreaHTML(channel, info);
    this.scrollToBottom();
  },

  renderStageAreaHTML(channel, info) {
    if (!channel) {
      return `<div style="padding:60px;text-align:center;color:#94a3b8">Select a conversation or colleague to start messaging</div>`;
    }

    const messages = this.getMessages(channel.id);
    const filesCount = (channel.files || []).length;
    const membersCount = (channel.members || []).length || 18;

    return `
      <!-- Channel Top Header -->
      <div class="pro-stage-header">
        <div class="pro-header-left">
          <div class="pro-header-avatar" style="background:${info.avatarBg || '#3b82f6'}">
            ${info.isChannel ? '#' : (info.avatar && info.avatar.startsWith('fa-') ? `<i class="fa ${info.avatar}"></i>` : (info.avatar || info.name.substring(0, 2)))}
          </div>
          <div class="pro-header-meta">
            <div class="pro-header-title">
              ${info.name}
              ${info.role ? `<span class="pro-role-pill">${info.role}</span>` : ''}
            </div>
            <div class="pro-header-subtitle">${info.topic || info.description || (info.isOnline ? 'Active Now' : 'Offline')}</div>
          </div>
        </div>

        <div class="pro-stage-tabs">
          <button class="pro-stage-tab ${this.activeTab === 'chat' ? 'active' : ''}" onclick="Chat.setActiveTab('chat')">Chat</button>
          <button class="pro-stage-tab ${this.activeTab === 'files' ? 'active' : ''}" onclick="Chat.setActiveTab('files')">Files</button>
          <button class="pro-stage-tab ${this.activeTab === 'members' ? 'active' : ''}" onclick="Chat.setActiveTab('members')">Members (${membersCount})</button>
        </div>

        <div class="pro-header-actions">
          <button class="pro-action-btn" onclick="Chat.toggleInChatSearch()" title="Search messages"><i class="fa fa-search"></i></button>
          <button class="pro-action-btn" onclick="Chat.showChannelInfo()" title="Channel Details"><i class="fa-regular fa-circle-question"></i></button>
          <button class="pro-action-btn" onclick="Chat.showMoreMenu()" title="More options"><i class="fa fa-ellipsis"></i></button>
        </div>
      </div>

      <!-- Stage Content (Chat feed or Files or Members) -->
      <div class="pro-stage-content" id="pro-stage-content" style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0">
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
    }

    const messages = this.getMessages(channel.id);
    return `
      <!-- Messages Feed -->
      <div class="pro-messages-container" id="pro-messages-container">
        <div class="pro-date-divider">
          <span class="pro-date-badge">Today, 08 October 2026</span>
        </div>
        ${this.renderMessagesHTML(messages)}
      </div>

      <!-- Modern Composer -->
      ${this.renderComposerHTML(channel)}
    `;
  },

  renderMessagesHTML(messages) {
    if (!messages || messages.length === 0) {
      return `<div style="text-align:center;padding:50px;color:#94a3b8">No messages yet. Send a message to start collaborating!</div>`;
    }

    const me = this.getCurrentUser();
    const myInitials = me.fullName ? me.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JD';

    return messages.map(m => {
      const isMe = m.isOwn || this.isMyMessage(m);
      const initial = (m.avatar || m.senderName || 'U').substring(0, 2).toUpperCase();
      const timeStr = m.time || (m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:24 AM');

      if (isMe) {
        return `
          <div class="pro-msg-row pro-msg-outgoing" id="msg-card-${m.id}">
            <div class="pro-msg-bubble-wrap">
              <div class="pro-msg-bubble">${this.formatMessageText(m.content)}</div>
              ${m.meeting ? this.renderMeetingCardHTML(m.meeting) : ''}
              ${m.attachments ? this.renderAttachmentsHTML(m.attachments) : ''}
              <div class="pro-msg-meta">
                <span class="pro-msg-time">${timeStr}</span>
                <span class="pro-msg-checkmarks"><i class="fa fa-check-double"></i></span>
              </div>
              ${this.renderReactionsHTML(m.id, m.reactions)}
            </div>
            <div class="pro-msg-avatar" style="background:#6366f1">${myInitials}</div>
          </div>
        `;
      }

      // Incoming message
      const avatarBg = m.avatarBg || (m.senderName === 'Sara Malik' ? '#c084fc' : '#38bdf8');
      return `
        <div class="pro-msg-row pro-msg-incoming" id="msg-card-${m.id}">
          <div class="pro-msg-avatar" style="background:${avatarBg}">
            ${initial}
            ${m.isOnline !== false ? '<span class="pro-avatar-online-dot"></span>' : ''}
          </div>
          <div class="pro-msg-body">
            <div class="pro-msg-header">
              <span class="pro-msg-time">${timeStr}</span>
            </div>
            <div class="pro-msg-bubble">
              <div class="pro-msg-content">${this.formatMessageText(m.content)}</div>
              ${m.meeting ? this.renderMeetingCardHTML(m.meeting) : ''}
              ${m.attachments ? this.renderAttachmentsHTML(m.attachments) : ''}
            </div>
            ${this.renderReactionsHTML(m.id, m.reactions)}
          </div>
        </div>
      `;
    }).join('');
  },

  renderMeetingCardHTML(meeting) {
    if (!meeting) return '';
    const title = meeting.title || 'Quarterly HR Town Hall';
    const dateTime = meeting.dateTime || 'Friday, 10 Oct 2026 • 3:00 PM - 4:00 PM';
    const escapedTitle = title.replace(/'/g, "\\'");

    return `
      <div class="pro-meeting-card">
        <div class="pro-meeting-left">
          <div class="pro-meeting-icon-box">
            <i class="fa-regular fa-calendar-days"></i>
          </div>
          <div class="pro-meeting-info">
            <div class="pro-meeting-title">${title}</div>
            <div class="pro-meeting-time">${dateTime}</div>
          </div>
        </div>
        <button class="pro-join-meeting-btn" onclick="Chat.joinMeeting('${escapedTitle}')">
          <i class="fa fa-video"></i> Join Meeting
        </button>
      </div>
    `;
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
        <div class="pro-file-card">
          <div class="pro-file-icon-box ${iconClass}"><i class="fa-regular ${icon}"></i></div>
          <div class="pro-file-info">
            <div class="pro-file-name" title="${att.name}">${att.name}</div>
            <div class="pro-file-size">${att.size || '1.2 MB'} • ${(att.ext || 'pdf').toUpperCase()}</div>
          </div>
          <button class="pro-file-download-btn" onclick="Chat.downloadAttachment('${att.name}')" title="Download ${att.name}">
            <i class="fa fa-download"></i>
          </button>
        </div>
      `;
    }).join('');
  },

  renderReactionsHTML(msgId, reactions) {
    const list = Object.entries(reactions || {});
    return `
      <div class="pro-reactions-row">
        ${list.map(([emoji, count]) => `
          <button class="pro-reaction-badge" onclick="Chat.toggleReaction('${msgId}', '${emoji}')">
            <span>${emoji}</span> <span>${count}</span>
          </button>
        `).join('')}
        <button class="pro-reaction-add-btn" onclick="Chat.toggleReaction('${msgId}', '👍')" title="Add Reaction">
          <i class="fa-regular fa-face-smile"></i>
        </button>
      </div>
    `;
  },

  renderComposerHTML(channel) {
    const placeholder = `Type a message in #${channel.name || 'general'}...`;

    return `
      <div class="pro-composer-box">
        <div class="pro-composer-input-row">
          <!-- Plus button with options -->
          <div class="pro-composer-plus-wrap">
            <button class="pro-plus-btn" onclick="Chat.togglePlusMenu(event)" title="Schedule Meeting, Attach File, etc.">
              <i class="fa fa-plus"></i>
            </button>
            <div class="pro-plus-menu" id="pro-plus-menu" style="display:none">
              <button class="pro-plus-item" onclick="Chat.openScheduleMeetingModal()">
                <i class="fa fa-calendar-plus" style="color:#2563eb"></i>
                <span>Schedule Meeting</span>
              </button>
              <button class="pro-plus-item" onclick="Chat.openUploadFileModal()">
                <i class="fa fa-paperclip" style="color:#10b981"></i>
                <span>Attach File</span>
              </button>
              <button class="pro-plus-item" onclick="Chat.toggleVoiceRecording()">
                <i class="fa fa-microphone" style="color:#ef4444"></i>
                <span>Voice Note</span>
              </button>
            </div>
          </div>

          <input 
            type="text" 
            id="teams-composer-input" 
            class="pro-composer-input" 
            placeholder="${placeholder}" 
            onkeydown="Chat.onInputKeyDown(event)">

          <div class="pro-composer-actions">
            <button class="pro-composer-icon-btn" onclick="Chat.toggleEmojiPicker(event)" title="Emoji">
              <i class="fa-regular fa-face-smile"></i>
            </button>
            <button class="pro-composer-icon-btn" onclick="document.getElementById('teams-file-input').click()" title="Attach File">
              <i class="fa fa-paperclip"></i>
            </button>
            <input type="file" id="teams-file-input" style="display:none" onchange="Chat.handleFileUpload(this)">
            <button class="pro-composer-icon-btn" onclick="Chat.openUploadFileModal('image')" title="Attach Image">
              <i class="fa-regular fa-image"></i>
            </button>
            <button class="pro-send-btn" onclick="Chat.sendMessage()" title="Send">
              <i class="fa fa-paper-plane"></i>
            </button>
          </div>
        </div>

        <!-- Emoji Picker Popover -->
        <div class="pro-emoji-popover" id="pro-emoji-popover" style="display:none">
          <div class="pro-emoji-grid">
            <button onclick="Chat.insertEmoji('👍')">👍</button>
            <button onclick="Chat.insertEmoji('❤️')">❤️</button>
            <button onclick="Chat.insertEmoji('🎉')">🎉</button>
            <button onclick="Chat.insertEmoji('🚀')">🚀</button>
            <button onclick="Chat.insertEmoji('😊')">😊</button>
            <button onclick="Chat.insertEmoji('👋')">👋</button>
            <button onclick="Chat.insertEmoji('💡')">💡</button>
            <button onclick="Chat.insertEmoji('🔥')">🔥</button>
            <button onclick="Chat.insertEmoji('🙌')">🙌</button>
            <button onclick="Chat.insertEmoji('👏')">👏</button>
            <button onclick="Chat.insertEmoji('☕')">☕</button>
            <button onclick="Chat.insertEmoji('🎯')">🎯</button>
            <button onclick="Chat.insertEmoji('📅')">📅</button>
            <button onclick="Chat.insertEmoji('💼')">💼</button>
            <button onclick="Chat.insertEmoji('✅')">✅</button>
            <button onclick="Chat.insertEmoji('💯')">💯</button>
          </div>
        </div>
      </div>
    `;
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
    esc = esc.replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>');

    return esc;
  },

  // ── Meeting Scheduler Modal & Action Handlers ──
  openScheduleMeetingModal() {
    this.closePopovers();
    const existing = document.getElementById('pro-meeting-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pro-meeting-modal-overlay';
    overlay.className = 'pro-modal-backdrop';
    overlay.innerHTML = `
      <div class="pro-modal-dialog">
        <div class="pro-modal-header">
          <div class="pro-modal-title">
            <i class="fa fa-calendar-plus" style="color:#2563eb"></i>
            <span>Schedule Pro Teams Meeting</span>
          </div>
          <button class="pro-modal-close" onclick="document.getElementById('pro-meeting-modal-overlay').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="pro-modal-body">
          <div class="pro-form-group">
            <label class="pro-form-label">Meeting Title / Topic</label>
            <input type="text" id="pro-meet-title" class="pro-form-input" placeholder="e.g. Quarterly HR Town Hall" value="Quarterly HR Town Hall">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="pro-form-group">
              <label class="pro-form-label">Date</label>
              <input type="text" id="pro-meet-date" class="pro-form-input" value="Friday, 10 Oct 2026">
            </div>
            <div class="pro-form-group">
              <label class="pro-form-label">Time Slot</label>
              <input type="text" id="pro-meet-time" class="pro-form-input" value="3:00 PM - 4:00 PM">
            </div>
          </div>

          <div class="pro-form-group">
            <label class="pro-form-label">Location / Platform</label>
            <input type="text" id="pro-meet-loc" class="pro-form-input" value="Conference Hall A & Teams Video Call">
          </div>

          <div class="pro-form-group">
            <label class="pro-form-label">Agenda / Description</label>
            <textarea id="pro-meet-agenda" class="pro-form-textarea" rows="2" placeholder="Discussion points...">Quarterly town hall meeting, departmental updates & live Q&A session.</textarea>
          </div>
        </div>

        <div class="pro-modal-footer">
          <button class="pro-btn-secondary" onclick="document.getElementById('pro-meeting-modal-overlay').remove()">Cancel</button>
          <button class="pro-btn-primary" onclick="Chat.submitScheduleMeeting()">
            <i class="fa fa-paper-plane"></i> Send Meeting Invite
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  submitScheduleMeeting() {
    const title = (document.getElementById('pro-meet-title')?.value || 'Team Meeting').trim();
    const date = (document.getElementById('pro-meet-date')?.value || 'Today').trim();
    const time = (document.getElementById('pro-meet-time')?.value || '3:00 PM').trim();
    const loc = (document.getElementById('pro-meet-loc')?.value || 'Teams Video Call').trim();

    const dateTimeStr = `${date} • ${time}`;
    const me = this.getCurrentUser();

    const newMsg = {
      id: 'msg-' + Date.now(),
      channelId: this.activeChannelId,
      senderId: me.id,
      senderName: me.fullName,
      senderRole: me.role === 'admin' ? 'Super Administrator' : (me.role === 'hr_manager' ? 'HR Director' : 'Team Member'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      content: `Meeting scheduled: **${title}**\n${loc}`,
      meeting: {
        id: 'meet-' + Date.now(),
        title: title,
        dateTime: dateTimeStr,
        location: loc
      },
      reactions: { '👍': 1 },
      createdAt: new Date().toISOString()
    };

    let msgs = DB.get('chat_messages') || [];
    msgs.push(newMsg);
    DB.set('chat_messages', msgs);

    document.getElementById('pro-meeting-modal-overlay')?.remove();
    this.playMessageSound('outgoing');
    this.renderStageArea();
    this.scrollToBottom();
    if (typeof Toast !== 'undefined') Toast.show('Meeting Invite Sent!', 'success', `${title} posted to chat.`);
  },

  joinMeeting(title) {
    if (typeof Toast !== 'undefined') Toast.show('Connecting...', 'info', `Joining ${title}`);
    this.launchCallModal('video', { targetName: title || 'Team Meeting' });
  },

  openUploadFileModal(type = 'file') {
    this.closePopovers();
    const existing = document.getElementById('pro-upload-modal-overlay');
    if (existing) existing.remove();

    const presets = [
      { name: 'Company_Holiday_Calendar_2026.pdf', size: '1.2 MB', ext: 'pdf' },
      { name: 'Q4_Salary_Structure_Approved.pdf', size: '1.5 MB', ext: 'pdf' },
      { name: 'Oct_Biometric_Payroll_Roster.xlsx', size: '640 KB', ext: 'excel' },
      { name: 'Leave_Policy_Handbook_2026.pdf', size: '2.1 MB', ext: 'pdf' },
      { name: 'System_Architecture_Diagram_v2.png', size: '820 KB', ext: 'img' }
    ];

    const overlay = document.createElement('div');
    overlay.id = 'pro-upload-modal-overlay';
    overlay.className = 'pro-modal-backdrop';
    overlay.innerHTML = `
      <div class="pro-modal-dialog">
        <div class="pro-modal-header">
          <div class="pro-modal-title">
            <i class="fa fa-paperclip" style="color:#10b981"></i>
            <span>Share File in Pro Teams</span>
          </div>
          <button class="pro-modal-close" onclick="document.getElementById('pro-upload-modal-overlay').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="pro-modal-body">
          <p style="font-size:13px;color:#64748b;margin:0">Select an enterprise document to share or browse your device:</p>

          <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;padding-right:4px">
            ${presets.map(p => `
              <div class="pro-file-card" style="margin:0;cursor:pointer;width:100%" onclick="Chat.sendPresetFile('${p.name}', '${p.size}', '${p.ext}')">
                <div class="pro-file-icon-box ${p.ext}"><i class="fa-regular ${p.ext === 'pdf' ? 'fa-file-pdf' : (p.ext === 'excel' ? 'fa-file-excel' : 'fa-file-image')}"></i></div>
                <div class="pro-file-info">
                  <div class="pro-file-name">${p.name}</div>
                  <div class="pro-file-size">${p.size} • Verified</div>
                </div>
                <span style="font-size:12px;color:#2563eb;font-weight:600">Send <i class="fa fa-arrow-right"></i></span>
              </div>
            `).join('')}
          </div>

          <div style="text-align:center;margin-top:6px">
            <button class="pro-btn-secondary" onclick="document.getElementById('teams-file-input').click();document.getElementById('pro-upload-modal-overlay').remove()">
              <i class="fa fa-folder-open"></i> Browse Device Files...
            </button>
          </div>
        </div>

        <div class="pro-modal-footer">
          <button class="pro-btn-secondary" onclick="document.getElementById('pro-upload-modal-overlay').remove()">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  sendPresetFile(name, size, ext) {
    document.getElementById('pro-upload-modal-overlay')?.remove();
    const me = this.getCurrentUser();
    const newMsg = {
      id: 'msg-' + Date.now(),
      channelId: this.activeChannelId,
      senderId: me.id,
      senderName: me.fullName,
      senderRole: me.role === 'admin' ? 'Super Administrator' : 'Team Member',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      content: `Shared document: **${name}**`,
      attachments: [{ name, size, ext }],
      reactions: { '👍': 1 },
      createdAt: new Date().toISOString()
    };

    let msgs = DB.get('chat_messages') || [];
    msgs.push(newMsg);
    DB.set('chat_messages', msgs);

    this.playMessageSound('outgoing');
    this.renderStageArea();
    this.scrollToBottom();
    if (typeof Toast !== 'undefined') Toast.show('File Shared!', 'success', `${name} posted.`);
  },

  togglePlusMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('pro-plus-menu');
    if (!menu) return;
    const isShowing = menu.style.display !== 'none';
    this.closePopovers();
    menu.style.display = isShowing ? 'none' : 'flex';
  },

  toggleEmojiPicker(e) {
    if (e) e.stopPropagation();
    const pop = document.getElementById('pro-emoji-popover');
    if (!pop) return;
    const isShowing = pop.style.display !== 'none';
    this.closePopovers();
    pop.style.display = isShowing ? 'none' : 'block';
  },

  closePopovers() {
    const menu = document.getElementById('pro-plus-menu');
    if (menu) menu.style.display = 'none';
    const pop = document.getElementById('pro-emoji-popover');
    if (pop) pop.style.display = 'none';
  },

  insertEmoji(emoji) {
    const input = document.getElementById('teams-composer-input');
    if (input) {
      input.value += emoji + ' ';
      input.focus();
    }
    this.closePopovers();
  },

  showChannelInfo() {
    const channel = this.getActiveChannel();
    if (!channel) return;
    if (typeof Toast !== 'undefined') {
      Toast.show(channel.displayName || channel.name, 'info', channel.topic || channel.description || 'Channel Info');
    }
  },

  showMoreMenu() {
    if (typeof Toast !== 'undefined') {
      Toast.show('Channel Options', 'info', 'Notifications: All • Pinned: On • Mute: Off');
    }
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
      senderRole: me.role === 'admin' ? 'Super Administrator' : (me.role === 'hr_manager' ? 'HR Director' : 'Team Member'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: 'read',
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
    const me = this.getCurrentUser();

    const ext = file.name.endsWith('.pdf') ? 'pdf' : (file.name.endsWith('.xlsx') ? 'excel' : (file.name.endsWith('.png') || file.name.endsWith('.jpg') ? 'img' : 'file'));
    const sizeStr = (file.size / 1024 > 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB');
    const newDoc = {
      id: 'doc-' + Date.now(),
      name: file.name,
      size: sizeStr,
      ext,
      uploadedBy: me.fullName,
      date: 'Just now'
    };

    if (!channel.files) channel.files = [];
    channel.files.push(newDoc);

    const channels = DB.get('chat_channels') || [];
    const ch = channels.find(c => c.id === channel.id);
    if (ch) {
      if (!ch.files) ch.files = [];
      ch.files.push(newDoc);
      ch.lastMessage = `${me.fullName}: Shared ${file.name}`;
      ch.time = 'Just now';
      DB.set('chat_channels', channels);
    }

    // Add message with file attachment card
    const newMsg = {
      id: 'msg-' + Date.now(),
      channelId: channel.id,
      senderId: me.id,
      senderName: me.fullName,
      senderRole: me.role === 'admin' ? 'Super Administrator' : 'Team Member',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      content: `Shared file: **${file.name}**`,
      attachments: [{ name: file.name, size: sizeStr, ext }],
      reactions: { '👍': 1 },
      createdAt: new Date().toISOString()
    };

    let msgs = DB.get('chat_messages') || [];
    msgs.push(newMsg);
    DB.set('chat_messages', msgs);

    this.playMessageSound('outgoing');
    if (typeof Toast !== 'undefined') Toast.show(`Uploaded: ${file.name}`, 'success');
    this.renderStageArea();
    this.renderRosterList();
    this.scrollToBottom();
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
  logout() {
    if (confirm('Are you sure you want to sign out of Pro Teams?')) {
      if (typeof Auth !== 'undefined' && Auth.logout) {
        Auth.logout();
      }
      document.body.classList.remove('chat-workspace-active');
      const topbarEl = document.getElementById('topbar');
      const subnavEl = document.getElementById('subnav-bar');
      const sidebarEl = document.getElementById('sidebar');
      const bottomNavEl = document.getElementById('mobile-bottom-nav');
      if (topbarEl) topbarEl.style.display = '';
      if (subnavEl) subnavEl.style.display = '';
      if (sidebarEl) sidebarEl.style.display = '';
      if (bottomNavEl) bottomNavEl.style.display = '';
      if (typeof App !== 'undefined' && App.showLogin) {
        App.showLogin(false, 'chat');
      } else {
        window.location.hash = '#chat-login';
        window.location.reload();
      }
      if (typeof Toast !== 'undefined') {
        Toast.show('Logged Out', 'info', 'You have signed out of Pro Teams.');
      }
    }
  },

  showStatusPopover(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const existing = document.getElementById('pro-profile-popover');
    if (existing) { existing.remove(); return; }

    const me = this.getCurrentUser();
    const initials = me.fullName ? me.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JD';
    const pop = document.createElement('div');
    pop.id = 'pro-profile-popover';
    pop.className = 'pro-profile-popover animate-scale-in';
    pop.innerHTML = `
      <div class="pro-pop-user-card">
        <div class="pro-pop-avatar" style="background:#6366f1">${initials}</div>
        <div class="pro-pop-meta">
          <div class="pro-pop-name">${me.fullName || 'Active User'}</div>
          <div class="pro-pop-role">${me.role === 'admin' ? 'Super Administrator' : (me.role === 'hr_manager' ? 'HR Director' : 'Team Member')}</div>
        </div>
      </div>
      <div class="pro-pop-divider"></div>
      <div class="pro-pop-section-title">Presence Status:</div>
      <div class="pro-pop-presence-list">
        <button class="pro-pop-pres-item ${this.userCustomStatus.presence==='online'?'active':''}" onclick="Chat.setPresence('online','Available')">
          <span class="pro-pres-dot" style="background:#22c55e"></span> Available
        </button>
        <button class="pro-pop-pres-item ${this.userCustomStatus.presence==='busy'?'active':''}" onclick="Chat.setPresence('busy','In a Meeting / Busy')">
          <span class="pro-pres-dot" style="background:#ef4444"></span> Busy
        </button>
        <button class="pro-pop-pres-item ${this.userCustomStatus.presence==='away'?'active':''}" onclick="Chat.setPresence('away','Be Right Back / Away')">
          <span class="pro-pres-dot" style="background:#f59e0b"></span> Away
        </button>
      </div>
      <div class="pro-pop-divider"></div>
      <button class="pro-pop-logout-btn" onclick="Chat.logout()">
        <i class="fa fa-arrow-right-from-bracket"></i>
        <span>Sign Out of Pro Teams</span>
      </button>
    `;
    document.body.appendChild(pop);
  },

  setPresence(key, label) {
    this.userCustomStatus = { presence: key, statusText: label };
    document.getElementById('pro-profile-popover')?.remove();
    this.renderRosterList();
    if (typeof Toast !== 'undefined') Toast.show(`Presence updated: ${label}`, 'info');
  },

  updatePresenceUI() {
    this.renderRosterList();
  },

  startDirectChat(empId, name) {
    if (!name && typeof DB !== 'undefined') {
      const emp = DB.getEmployee ? DB.getEmployee(empId) : null;
      if (emp) name = emp.firstName ? `${emp.firstName} ${emp.lastName}` : (emp.name || `Employee #${empId}`);
    }
    return this.startDirectChatWithEmployee(empId, name || `Employee #${empId}`);
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
    const existing = document.getElementById('pro-newchat-modal');
    if (existing) existing.remove();

    const emps = (typeof DB !== 'undefined' ? DB.get('employees') : []) || [];
    const colleagues = emps.slice(0, 10);

    const overlay = document.createElement('div');
    overlay.id = 'pro-newchat-modal';
    overlay.className = 'pro-modal-backdrop';
    overlay.innerHTML = `
      <div class="pro-modal-dialog">
        <div class="pro-modal-header">
          <div class="pro-modal-title">
            <i class="fa fa-pen-to-square" style="color:#2563eb"></i>
            <span>New Chat in Pro Teams</span>
          </div>
          <button class="pro-modal-close" onclick="document.getElementById('pro-newchat-modal').remove()">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="pro-modal-body">
          <div class="pro-form-group">
            <label class="pro-form-label">Message a Colleague (1-on-1 Direct Message)</label>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto">
              ${colleagues.map(e => `
                <div class="pro-chat-item" style="padding:6px 10px;display:flex;align-items:center;gap:10px;cursor:pointer" onclick="Chat.startDirectChatWithEmployee(${e.id}, '${e.fullName.replace(/'/g, "\\'")}'); document.getElementById('pro-newchat-modal').remove();">
                  <div class="pro-chat-avatar" style="width:32px;height:32px;background:#3b82f6;font-size:12px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff">${e.fullName.substring(0, 2).toUpperCase()}</div>
                  <div class="pro-chat-info" style="flex:1">
                    <div class="pro-chat-name" style="font-size:13px">${e.fullName}</div>
                    <div class="pro-chat-snippet" style="font-size:11px">${e.designation || e.department || 'Colleague'}</div>
                  </div>
                  <i class="fa fa-comment-dots" style="color:#2563eb"></i>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="pro-form-group" style="border-top:1px solid #e2e8f0;padding-top:12px">
            <label class="pro-form-label">Or Create a New Channel</label>
            <div style="display:flex;gap:8px">
              <input type="text" id="pro-new-chan-name" class="pro-form-input" style="flex:1" placeholder="e.g. mobile-engineering">
              <button class="pro-btn-primary" onclick="Chat.createChannelFromModal()">Create</button>
            </div>
          </div>
        </div>

        <div class="pro-modal-footer">
          <button class="pro-btn-secondary" onclick="document.getElementById('pro-newchat-modal').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  createChannelFromModal() {
    const input = document.getElementById('pro-new-chan-name');
    const name = (input?.value || '').trim();
    if (!name) return;
    document.getElementById('pro-newchat-modal')?.remove();

    const id = 'chan-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newChan = {
      id,
      name: name,
      displayName: name.startsWith('#') ? name : ('# ' + name),
      type: 'channel',
      isFavorite: false,
      time: 'Just now',
      lastMessage: 'Channel created.',
      avatar: 'fa-hashtag',
      avatarBg: '#3b82f6',
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
      const scroll = document.getElementById('pro-messages-container') || document.getElementById('teams-messages-scroll');
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

if (typeof window !== 'undefined') {
  window.Chat = Chat;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Chat;
}

