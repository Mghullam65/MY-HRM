// ============================================================
// HRM SYSTEM — Multi-Language & Multi-Currency Engine (I18n)
// ============================================================

const I18n = {
  activeLang: 'en',
  activeCurrency: 'PKR',

  // ─── Supported Global Currencies ───
  currencies: {
    PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰', rate: 1.0, locale: 'en-PK' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 0.0036, locale: 'en-US' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.0033, locale: 'de-DE' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.0028, locale: 'en-GB' },
    AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', rate: 0.0132, locale: 'ar-AE' },
    SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', rate: 0.0135, locale: 'ar-SA' },
    CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 0.0049, locale: 'en-CA' },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 0.303, locale: 'en-IN' }
  },

  // ─── Supported International Languages ───
  languages: {
    en: { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', dir: 'ltr' },
    ur: { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰', dir: 'rtl' },
    ar: { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    es: { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
    fr: { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
    de: { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
    zh: { code: 'zh', name: 'Chinese', native: '简体中文', flag: '🇨🇳', dir: 'ltr' }
  },

  // ─── Multi-Language Dictionaries ───
  translations: {
    en: {
      appName: 'HRM Pro',
      tagline: 'Human Resource Management Platform',
      dashboard: 'Dashboard',
      employees: 'Employees',
      attendance: 'Attendance',
      leaves: 'Leaves',
      payroll: 'Payroll',
      performance: 'Performance',
      recruitment: 'Recruitment',
      assets: 'Assets & Inventory',
      expenses: 'Expense Claims',
      helpdesk: 'Helpdesk & Support',
      events: 'Events & Holidays',
      reports: 'Analytics & Reports',
      administration: 'Administration',
      settings: 'Settings',
      modules: 'Modules',
      solutions: 'Solutions',
      impact: 'Impact & ROI',
      contact: 'Contact',
      sign_in: 'Sign In',
      get_started: 'Get Started',
      open_portal: 'Open Portal',
      system_tour: 'System Tour',
      logout: 'Logout',
      welcome_back: 'Welcome back',
      total_employees: 'Total Employees',
      present_today: 'Present Today',
      pending_leaves: 'Pending Leaves',
      open_positions: 'Open Positions',
      monthly_payroll: 'Monthly Payroll',
      attendance_rate: 'Attendance Rate',
      role_based_access: 'Role-Based Access',
      real_time_sync: 'Real-Time Sync',
      back_to_home: 'Back to HRM Pro',
      super_admin: 'Super Admin',
      hr_director: 'HR Director',
      dept_manager: 'Dept Manager',
      employee: 'Employee',
      onboarding: 'Onboarding',
      email_placeholder: 'Email Address or Username',
      password_placeholder: 'Password',
      remember_me: 'Remember me',
      forgot_password: 'Forgot password?',
      or_continue_with: 'or continue with',
      search_placeholder: 'Search employees… (Ctrl+K)',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      quick_portal_access: 'Quick Portal Access',
      core_modules: 'Core Modules',
      governance: 'Governance',
      currency: 'Currency',
      language: 'Language'
    },
    ur: {
      appName: 'ایچ آر ایم پرو',
      tagline: 'ہیومن ریسورس مینجمنٹ پلیٹ فارم',
      dashboard: 'ڈیش بورڈ',
      employees: 'ملازمین کی فہرست',
      attendance: 'حاضری اور شفٹ',
      leaves: 'چھٹیوں کا انتظام',
      payroll: 'تنخواہ اور ٹیکس',
      performance: 'کارکردگی اور جائزے',
      recruitment: 'بھرتی اور ملازمت',
      assets: 'کمپنی اثاثہ جات',
      expenses: 'اخراجات کے دعوے',
      helpdesk: 'ہیلپ ڈیسک سپورٹ',
      events: 'تقریبات اور تعطیلات',
      reports: 'رپورٹس اور اینالیٹکس',
      administration: 'انتظامی امور',
      settings: 'سسٹم سیٹنگز',
      modules: 'ماڈیولز',
      solutions: 'حل اور خدمات',
      impact: 'اہم فوائد',
      contact: 'رابطہ کریں',
      sign_in: 'لاگ ان کریں',
      get_started: 'شروع کریں',
      open_portal: 'پورٹل کھولیں',
      system_tour: 'سسٹم ٹور',
      logout: 'لاگ آؤٹ',
      welcome_back: 'خوش آمدید',
      total_employees: 'کل ملازمین',
      present_today: 'آج حاضر',
      pending_leaves: 'زیر التواء چھٹیاں',
      open_positions: 'خالی آسامیاں',
      monthly_payroll: 'ماہانہ تنخواہیں',
      attendance_rate: 'حاضری کی شرح',
      role_based_access: 'کردار کی بنیاد پر رسائی',
      real_time_sync: 'فوری کلاؤڈ سنک',
      back_to_home: 'واپس مین پیج',
      super_admin: 'سپر ایڈمن',
      hr_director: 'ایچ آر ڈائریکٹر',
      dept_manager: 'ڈیپارٹمنٹ منیجر',
      employee: 'ملازم پورٹل',
      onboarding: 'نیا ملازم آن بورڈنگ',
      email_placeholder: 'ای میل یا یوزر نیم',
      password_placeholder: 'پاس ورڈ درج کریں',
      remember_me: 'مجھے یاد رکھیں',
      forgot_password: 'پاس ورڈ بھول گئے؟',
      or_continue_with: 'یا جاری رکھیں بذریعہ',
      search_placeholder: 'ملازمین تلاش کریں… (Ctrl+K)',
      active: 'فعال',
      inactive: 'غیر فعال',
      pending: 'زیر التواء',
      approved: 'منظور شدہ',
      rejected: 'مسترد',
      present: 'حاضر',
      absent: 'غیر حاضر',
      late: 'تاخیر',
      quick_portal_access: 'فوری پورٹل رسائی',
      core_modules: 'بنیادی ماڈیولز',
      governance: 'انتظامیہ اور آڈٹ',
      currency: 'کرنسی',
      language: 'زبان'
    },
    ar: {
      appName: 'إتش آر إم برو',
      tagline: 'منصة إدارة الموارد البشرية السحابية',
      dashboard: 'لوحة التحكم',
      employees: 'دليل الموظفين',
      attendance: 'الحضور والانصراف',
      leaves: 'إدارة الإجازات',
      payroll: 'مسير الرواتب والضرائب',
      performance: 'تقييم الأداء',
      recruitment: 'التوظيف والاستقطاب',
      assets: 'إدارة العهد والأصول',
      expenses: 'مطالبات المصروفات',
      helpdesk: 'الدعم والتذاكر',
      events: 'الفعاليات والعطلات',
      reports: 'التقارير والإحصائيات',
      administration: 'الشؤون الإدارية',
      settings: 'إعدادات النظام',
      modules: 'الوحدات',
      solutions: 'الحلول المؤسسية',
      impact: 'الأثر والعائد',
      contact: 'اتصل بنا',
      sign_in: 'تسجيل الدخول',
      get_started: 'ابدأ الآن',
      open_portal: 'فتح البوابة',
      system_tour: 'جولة في النظام',
      logout: 'تسجيل الخروج',
      welcome_back: 'مرحباً بك مجدداً',
      total_employees: 'إجمالي الموظفين',
      present_today: 'الحاضرون اليوم',
      pending_leaves: 'إجازات قيد الانتظار',
      open_positions: 'الوظائف الشاغرة',
      monthly_payroll: 'الرواتب الشهرية',
      attendance_rate: 'نسبة الحضور',
      role_based_access: 'صلاحيات حسب الدور',
      real_time_sync: 'مزامنة سحابية فورية',
      back_to_home: 'العودة للرئيسية',
      super_admin: 'المدير العام',
      hr_director: 'مدير الموارد البشرية',
      dept_manager: 'مدير القسم',
      employee: 'بوابة الموظف',
      onboarding: 'تهيئة الموظفين الجدد',
      email_placeholder: 'البريد الإلكتروني أو اسم المستخدم',
      password_placeholder: 'كلمة المرور',
      remember_me: 'تذكرني',
      forgot_password: 'نسيت كلمة المرور؟',
      or_continue_with: 'أو المتابعة عبر',
      search_placeholder: 'بحث عن موظف… (Ctrl+K)',
      active: 'نشط',
      inactive: 'غير نشط',
      pending: 'معلق',
      approved: 'معتمد',
      rejected: 'مرفوض',
      present: 'حاضر',
      absent: 'غائب',
      late: 'متأخر',
      quick_portal_access: 'وصول سريع للبوابات',
      core_modules: 'الوحدات الأساسية',
      governance: 'الحوكمة والأمان',
      currency: 'العملة',
      language: 'اللغة'
    },
    es: {
      appName: 'HRM Pro',
      tagline: 'Plataforma de Gestión de Recursos Humanos',
      dashboard: 'Panel de Control',
      employees: 'Directorio de Empleados',
      attendance: 'Control de Asistencia',
      leaves: 'Gestión de Permisos',
      payroll: 'Nómina y Salarios',
      performance: 'Evaluación de Desempeño',
      recruitment: 'Reclutamiento y Selección',
      assets: 'Inventario de Activos',
      expenses: 'Reclamos de Gastos',
      helpdesk: 'Mesa de Ayuda y Soporte',
      events: 'Eventos y Feriados',
      reports: 'Informes y Métricas',
      administration: 'Administración',
      settings: 'Configuración',
      modules: 'Módulos',
      solutions: 'Soluciones',
      impact: 'Impacto y ROI',
      contact: 'Contacto',
      sign_in: 'Iniciar Sesión',
      get_started: 'Empezar Ahora',
      open_portal: 'Abrir Portal',
      system_tour: 'Recorrido',
      logout: 'Cerrar Sesión',
      welcome_back: 'Bienvenido de nuevo',
      total_employees: 'Total de Empleados',
      present_today: 'Presentes Hoy',
      pending_leaves: 'Permisos Pendientes',
      open_positions: 'Puestos Vacantes',
      monthly_payroll: 'Nómina Mensual',
      attendance_rate: 'Tasa de Asistencia',
      role_based_access: 'Acceso por Roles',
      real_time_sync: 'Sincronización en Tiempo Real',
      back_to_home: 'Volver a HRM Pro',
      super_admin: 'Super Administrador',
      hr_director: 'Directora de RRHH',
      dept_manager: 'Gerente de Depto',
      employee: 'Portal del Empleado',
      onboarding: 'Incorporación',
      email_placeholder: 'Correo o Usuario',
      password_placeholder: 'Contraseña',
      remember_me: 'Recordarme',
      forgot_password: '¿Olvidó su contraseña?',
      or_continue_with: 'o continuar con',
      search_placeholder: 'Buscar empleados… (Ctrl+K)',
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      present: 'Presente',
      absent: 'Ausente',
      late: 'Tardanza',
      quick_portal_access: 'Acceso Rápido al Portal',
      core_modules: 'Módulos Principales',
      governance: 'Gobernanza',
      currency: 'Moneda',
      language: 'Idioma'
    },
    fr: {
      appName: 'HRM Pro',
      tagline: 'Plateforme de Gestion des Ressources Humaines',
      dashboard: 'Tableau de bord',
      employees: 'Répertoire des Employés',
      attendance: 'Présence & Horaires',
      leaves: 'Gestion des Congés',
      payroll: 'Paie & Rémunération',
      performance: 'Évaluation des Performances',
      recruitment: 'Recrutement & Talents',
      assets: 'Gestion des Actifs',
      expenses: 'Notes de Frais',
      helpdesk: 'Support & Assistance',
      events: 'Événements & Fêtes',
      reports: 'Rapports & Analyses',
      administration: 'Administration RH',
      settings: 'Paramètres Système',
      modules: 'Modules',
      solutions: 'Solutions',
      impact: 'Impact & ROI',
      contact: 'Contact',
      sign_in: 'Connexion',
      get_started: 'Commencer',
      open_portal: 'Accéder au Portail',
      system_tour: 'Visite guidée',
      logout: 'Déconnexion',
      welcome_back: 'Bienvenue',
      total_employees: 'Effectif Total',
      present_today: 'Présents Aujourd’hui',
      pending_leaves: 'Congés en Attente',
      open_positions: 'Postes Ouverts',
      monthly_payroll: 'Masse Salariale',
      attendance_rate: 'Taux de Présence',
      role_based_access: 'Contrôle d’Accès par Rôle',
      real_time_sync: 'Synchronisation en Temps Réel',
      back_to_home: 'Retour à HRM Pro',
      super_admin: 'Super Administrateur',
      hr_director: 'Directrice RH',
      dept_manager: 'Chef de Département',
      employee: 'Portail Employé',
      onboarding: 'Intégration',
      email_placeholder: 'Email ou Identifiant',
      password_placeholder: 'Mot de passe',
      remember_me: 'Se souvenir de moi',
      forgot_password: 'Mot de passe oublié ?',
      or_continue_with: 'ou continuer avec',
      search_placeholder: 'Rechercher un employé… (Ctrl+K)',
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      present: 'Présent',
      absent: 'Absent',
      late: 'En retard',
      quick_portal_access: 'Accès Rapide aux Portails',
      core_modules: 'Modules Principaux',
      governance: 'Gouvernance',
      currency: 'Devise',
      language: 'Langue'
    },
    de: {
      appName: 'HRM Pro',
      tagline: 'Personalmanagement- und Cloud-Plattform',
      dashboard: 'Dashboard',
      employees: 'Mitarbeiterverzeichnis',
      attendance: 'Zeiterfassung & Schichten',
      leaves: 'Urlaubsverwaltung',
      payroll: 'Gehaltsabrechnung',
      performance: 'Leistungsbeurteilung',
      recruitment: 'Personalbeschaffung',
      assets: 'Inventarverwaltung',
      expenses: 'Spesenabrechnung',
      helpdesk: 'Helpdesk & Support',
      events: 'Veranstaltungen & Feiertage',
      reports: 'Berichte & Analysen',
      administration: 'Personalverwaltung',
      settings: 'Systemeinstellungen',
      modules: 'Module',
      solutions: 'Lösungen',
      impact: 'Wirkung & ROI',
      contact: 'Kontakt',
      sign_in: 'Anmelden',
      get_started: 'Jetzt Starten',
      open_portal: 'Portal Öffnen',
      system_tour: 'System-Tour',
      logout: 'Abmelden',
      welcome_back: 'Willkommen zurück',
      total_employees: 'Mitarbeiter Gesamt',
      present_today: 'Heute Anwesend',
      pending_leaves: 'Offene Urlaubsanträge',
      open_positions: 'Offene Stellen',
      monthly_payroll: 'Monatliche Gehaltssumme',
      attendance_rate: 'Anwesenheitsrate',
      role_based_access: 'Rollenbasierter Zugriff',
      real_time_sync: 'Echtzeit-Synchronisierung',
      back_to_home: 'Zurück zu HRM Pro',
      super_admin: 'Super-Administrator',
      hr_director: 'Personalleiterin',
      dept_manager: 'Abteilungsleiter',
      employee: 'Mitarbeiter-Portal',
      onboarding: 'Einarbeitung',
      email_placeholder: 'E-Mail oder Benutzername',
      password_placeholder: 'Passwort',
      remember_me: 'Angemeldet bleiben',
      forgot_password: 'Passwort vergessen?',
      or_continue_with: 'oder fortfahren mit',
      search_placeholder: 'Mitarbeiter suchen… (Strg+K)',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      present: 'Anwesend',
      absent: 'Abwesend',
      late: 'Verspätet',
      quick_portal_access: 'Schnellzugriff auf Portale',
      core_modules: 'Kernmodule',
      governance: 'Unternehmensführung',
      currency: 'Währung',
      language: 'Sprache'
    },
    zh: {
      appName: 'HRM Pro',
      tagline: '现代企业人力资源管理平台',
      dashboard: '数据仪表盘',
      employees: '员工名录与文档',
      attendance: '考勤与班次排期',
      leaves: '请假与审批流',
      payroll: '薪资核算与工资条',
      performance: '绩效考核与目标',
      recruitment: '招聘与求职者追踪',
      assets: '固定资产与设备',
      expenses: '费用报销申请',
      helpdesk: '服务台与工单支持',
      events: '公司活动与法定假日',
      reports: '数据统计与分析',
      administration: '行政与工作流',
      settings: '系统安全设置',
      modules: '功能模块',
      solutions: '企业解决方案',
      impact: '业务价值与回报',
      contact: '联系我们',
      sign_in: '登录系统',
      get_started: '立即使用',
      open_portal: '进入门户',
      system_tour: '系统功能导览',
      logout: '退出登录',
      welcome_back: '欢迎回来',
      total_employees: '在职员工总数',
      present_today: '今日出勤人数',
      pending_leaves: '待审批请假',
      open_positions: '招聘中的职位',
      monthly_payroll: '本月薪酬支出',
      attendance_rate: '出勤达标率',
      role_based_access: '基于角色的权限控制',
      real_time_sync: '多端实时云端同步',
      back_to_home: '返回 HRM Pro 首页',
      super_admin: '超级管理员',
      hr_director: '人力资源总监',
      dept_manager: '部门主管',
      employee: '员工自助门户',
      onboarding: '新入职引导',
      email_placeholder: '企业邮箱或用户名',
      password_placeholder: '请输入密码',
      remember_me: '记住登录状态',
      forgot_password: '忘记密码？',
      or_continue_with: '或通过以下方式登录',
      search_placeholder: '快速搜索员工… (Ctrl+K)',
      active: '正常在职',
      inactive: '已停用',
      pending: '待处理',
      approved: '已通过',
      rejected: '已拒绝',
      present: '已出勤',
      absent: '缺勤',
      late: '迟到',
      quick_portal_access: '角色快捷登录通道',
      core_modules: '核心业务模块',
      governance: '企业治理与安全',
      currency: '货币单位',
      language: '选择语言'
    }
  },

  // ─── Initialization ───
  init() {
    let companyLang = null;
    let companyCurr = null;
    try {
      if (typeof DB !== 'undefined' && DB.getObj) {
        const s = DB.getObj('settings');
        if (s) {
          if (s.companyLanguage) companyLang = s.companyLanguage;
          if (s.companyCurrency) companyCurr = s.companyCurrency;
        }
      }
    } catch (e) {}

    this.activeLang = companyLang || localStorage.getItem('hrm_language') || 'en';
    this.activeCurrency = companyCurr || localStorage.getItem('hrm_currency') || 'PKR';
    this.applyHtmlAttributes();
  },

  applyHtmlAttributes() {
    const langObj = this.languages[this.activeLang] || this.languages.en;
    document.documentElement.setAttribute('lang', this.activeLang);
    document.documentElement.setAttribute('dir', langObj.dir || 'ltr');
    document.documentElement.setAttribute('data-currency', this.activeCurrency);
  },

  t(key, fallback) {
    const dict = this.translations[this.activeLang] || this.translations.en;
    if (dict && dict[key]) return dict[key];
    const enDict = this.translations.en;
    if (enDict && enDict[key]) return enDict[key];
    return fallback || key;
  },

  setLanguage(langCode) {
    if (!this.languages[langCode]) return;
    this.activeLang = langCode;
    localStorage.setItem('hrm_language', langCode);
    this.applyHtmlAttributes();

    // Close any open dropdowns
    document.querySelectorAll('.i18n-dropdown-menu').forEach(m => m.classList.remove('open'));

    // Re-render active view
    this.refreshActiveViews();
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show(`Language changed to ${this.languages[langCode].name} (${this.languages[langCode].native})`, 'info');
    }
  },

  setCurrency(currCode) {
    if (!this.currencies[currCode]) return;
    this.activeCurrency = currCode;
    localStorage.setItem('hrm_currency', currCode);
    this.applyHtmlAttributes();

    // Close any open dropdowns
    document.querySelectorAll('.i18n-dropdown-menu').forEach(m => m.classList.remove('open'));

    // Re-render active view
    this.refreshActiveViews();
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show(`Currency set to ${this.currencies[currCode].name} (${this.currencies[currCode].symbol})`, 'success');
    }
  },

  formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '—';
    const num = Number(amount);
    const curr = this.currencies[this.activeCurrency] || this.currencies.PKR;

    // Convert from base PKR
    const converted = num * (curr.rate || 1.0);

    // Format with locale
    if (curr.code === 'PKR') {
      return `PKR ${Math.round(converted).toLocaleString('en-PK')}`;
    }
    if (curr.code === 'USD') {
      return `$${Math.round(converted).toLocaleString('en-US')}`;
    }
    if (curr.code === 'EUR') {
      return `€${Math.round(converted).toLocaleString('de-DE')}`;
    }
    if (curr.code === 'GBP') {
      return `£${Math.round(converted).toLocaleString('en-GB')}`;
    }
    if (curr.code === 'AED') {
      return `AED ${Math.round(converted).toLocaleString('en-US')}`;
    }
    if (curr.code === 'SAR') {
      return `SAR ${Math.round(converted).toLocaleString('en-US')}`;
    }
    if (curr.code === 'CAD') {
      return `CA$${Math.round(converted).toLocaleString('en-CA')}`;
    }
    if (curr.code === 'INR') {
      return `₹${Math.round(converted).toLocaleString('en-IN')}`;
    }

    return `${curr.symbol} ${Math.round(converted).toLocaleString()}`;
  },

  refreshActiveViews() {
    // If on landing page
    const landing = document.getElementById('landing-page');
    if (landing && landing.style.display !== 'none' && typeof Landing !== 'undefined') {
      Landing.render();
      return;
    }

    // If on login page
    const login = document.getElementById('login-page');
    if (login && login.style.display !== 'none' && typeof Login !== 'undefined') {
      Login.render();
      return;
    }

    // If on app shell
    const app = document.getElementById('app');
    if (app && app.style.display !== 'none' && typeof App !== 'undefined') {
      App.renderTopbar();
      App.renderSidebar();
      if (App.currentModule) {
        App.navigate(App.currentModule);
      }
    }
  },

  // ─── Component Renderers for UI Dropdowns ───
  renderLanguageSelector(containerId) {
    const cur = this.languages[this.activeLang] || this.languages.en;
    return `
      <div class="i18n-dropdown-wrapper" onclick="event.stopPropagation()">
        <button type="button" class="i18n-selector-btn" onclick="I18n.toggleDropdown('${containerId}-lang-menu')" title="Change Language">
          <span class="i18n-flag">${cur.flag}</span>
          <span class="i18n-label">${cur.code.toUpperCase()}</span>
          <i class="fa fa-chevron-down i18n-chevron"></i>
        </button>
        <div class="i18n-dropdown-menu" id="${containerId}-lang-menu">
          <div class="i18n-menu-title">${this.t('language', 'Language')}</div>
          ${Object.values(this.languages).map(l => `
            <div class="i18n-menu-item ${l.code === this.activeLang ? 'active' : ''}" onclick="I18n.setLanguage('${l.code}')">
              <span class="i18n-item-flag">${l.flag}</span>
              <span class="i18n-item-name">${l.name}</span>
              <span class="i18n-item-native">${l.native}</span>
              ${l.code === this.activeLang ? '<i class="fa fa-check i18n-check"></i>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderCurrencySelector(containerId) {
    const cur = this.currencies[this.activeCurrency] || this.currencies.PKR;
    return `
      <div class="i18n-dropdown-wrapper" onclick="event.stopPropagation()">
        <button type="button" class="i18n-selector-btn" onclick="I18n.toggleDropdown('${containerId}-curr-menu')" title="Change Currency">
          <span class="i18n-flag">${cur.flag}</span>
          <span class="i18n-label">${cur.code} (${cur.symbol})</span>
          <i class="fa fa-chevron-down i18n-chevron"></i>
        </button>
        <div class="i18n-dropdown-menu" id="${containerId}-curr-menu">
          <div class="i18n-menu-title">${this.t('currency', 'Currency')}</div>
          ${Object.values(this.currencies).map(c => `
            <div class="i18n-menu-item ${c.code === this.activeCurrency ? 'active' : ''}" onclick="I18n.setCurrency('${c.code}')">
              <span class="i18n-item-flag">${c.flag}</span>
              <span class="i18n-item-name">${c.code}</span>
              <span class="i18n-item-native">${c.symbol} • ${c.name}</span>
              ${c.code === this.activeCurrency ? '<i class="fa fa-check i18n-check"></i>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  toggleDropdown(menuId) {
    const el = document.getElementById(menuId);
    if (!el) return;
    const wasOpen = el.classList.contains('open');
    document.querySelectorAll('.i18n-dropdown-menu').forEach(m => m.classList.remove('open'));
    if (!wasOpen) {
      el.classList.add('open');
    }
  }
};

// Global click to dismiss dropdowns
window.addEventListener('click', () => {
  document.querySelectorAll('.i18n-dropdown-menu').forEach(m => m.classList.remove('open'));
});

// Auto-initialize on load
I18n.init();
window.I18n = I18n;
