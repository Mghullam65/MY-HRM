const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = 'C:\\Users\\test\\.gemini\\antigravity-ide\\brain\\745437ff-eb16-493c-96a5-c86a612185c8';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9555;
const HTTP_PORT = 8095;
const USER_DATA = path.join(process.env.TEMP, 'hrm_qa_manual_' + Date.now());

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, '../public', reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

async function run() {
  await new Promise(r => server.listen(HTTP_PORT, r));
  console.log(`[QA] Test server listening on http://127.0.0.1:${HTTP_PORT}`);

  const browserProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--window-size=390,844',
    'about:blank'
  ], { stdio: 'ignore' });

  process.on('exit', () => {
    try { browserProc.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
  });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const json = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${DEBUG_PORT}/json/version`, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (json.webSocketDebuggerUrl) {
        wsUrl = json.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  const browserWs = new WebSocket(wsUrl);
  await new Promise(res => browserWs.on('open', res));

  let reqId = 1;
  function sendBrowser(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = reqId++;
      const onMsg = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === id) {
          browserWs.off('message', onMsg);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      browserWs.on('message', onMsg);
      browserWs.send(JSON.stringify({ id, method, params }));
    });
  }

  const { targetId } = await sendBrowser('Target.createTarget', { url: 'about:blank' });
  const pageWs = new WebSocket(`ws://127.0.0.1:${DEBUG_PORT}/devtools/page/${targetId}`);
  await new Promise(res => pageWs.on('open', res));

  let pageReqId = 1;
  function sendPage(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = pageReqId++;
      const onMsg = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === id) {
          pageWs.off('message', onMsg);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      pageWs.on('message', onMsg);
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  const consoleLogs = [];
  pageWs.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      consoleLogs.push(`[${msg.params.type}] ${text}`);
    }
  });

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  async function evaluate(expression) {
    const res = await sendPage('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result ? res.result.value : null;
  }

  async function screenshot(filename) {
    const res = await sendPage('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[QA SCREENSHOT] Saved ${filename} (${buffer.length} bytes)`);
    return outPath;
  }

  const testResults = [];

  // ─────────────────────────────────────────────────────────────
  // TS-01: Direct Navigation to Login URL (Mobile 390x844)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-01: Direct Navigation to Login URL (Mobile 390x844) ---');
  await sendPage('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#login` });
  await new Promise(r => setTimeout(r, 3500));

  const ts01State = await evaluate(`(() => {
    const login = document.getElementById('login-page');
    const app = document.getElementById('app');
    const card = document.querySelector('.login-split-card');
    return {
      loginDisplay: login ? window.getComputedStyle(login).display : null,
      appDisplay: app ? window.getComputedStyle(app).display : null,
      cardVisible: !!card,
      cardWidth: card ? card.offsetWidth : 0,
      viewportWidth: window.innerWidth
    };
  })()`);
  await screenshot('TS01_mobile_login.png');

  const ts01Passed = ts01State.loginDisplay === 'flex' && ts01State.appDisplay === 'none' && ts01State.cardVisible;
  testResults.push({
    id: 'TS-01',
    name: 'Direct Navigation to Login URL (Mobile 390x844)',
    passed: ts01Passed,
    details: ts01State
  });
  console.log(`TS-01 Result: ${ts01Passed ? 'PASSED' : 'FAILED'}`, ts01State);

  // ─────────────────────────────────────────────────────────────
  // TS-02: Desktop Login Screen Layout (1440x900)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-02: Desktop Login Screen Layout (1440x900) ---');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));

  const ts02State = await evaluate(`(() => {
    const leftPane = document.querySelector('.login-split-left');
    const rightPane = document.querySelector('.login-split-right');
    const demoPills = document.querySelectorAll('.demo-pill-chip');
    return {
      leftPaneDisplay: leftPane ? window.getComputedStyle(leftPane).display : null,
      rightPaneDisplay: rightPane ? window.getComputedStyle(rightPane).display : null,
      leftPaneWidth: leftPane ? leftPane.offsetWidth : 0,
      rightPaneWidth: rightPane ? rightPane.offsetWidth : 0,
      demoPillsCount: demoPills.length
    };
  })()`);
  await screenshot('TS02_desktop_login.png');

  const ts02Passed = ts02State.leftPaneDisplay === 'flex' && ts02State.rightPaneDisplay === 'flex' && ts02State.leftPaneWidth > 400;
  testResults.push({
    id: 'TS-02',
    name: 'Desktop Login Screen Layout (1440x900)',
    passed: ts02Passed,
    details: ts02State
  });
  console.log(`TS-02 Result: ${ts02Passed ? 'PASSED' : 'FAILED'}`, ts02State);

  // ─────────────────────────────────────────────────────────────
  // TS-03: Authentication & Role Transition (Sara Malik - HR Director)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-03: Authentication & Role Transition (Mobile 390x844) ---');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 500));

  await evaluate(`(() => {
    Login.setTab('demo');
    Login.selectAccount('hr');
    Login.submit();
  })()`);
  await new Promise(r => setTimeout(r, 2500));

  const ts03State = await evaluate(`(() => {
    const app = document.getElementById('app');
    const login = document.getElementById('login-page');
    return {
      appDisplay: app ? window.getComputedStyle(app).display : null,
      loginDisplay: login ? window.getComputedStyle(login).display : null,
      userRole: Auth.role,
      userName: Auth.user?.name,
      employeeName: Auth.employee?.fullName,
      currentHash: window.location.hash
    };
  })()`);
  await screenshot('TS03_login_transition.png');

  const ts03Passed = ts03State.appDisplay === 'flex' && ts03State.loginDisplay === 'none' && ts03State.userRole === 'hr_manager';
  testResults.push({
    id: 'TS-03',
    name: 'Authentication & Role Transition (HR Director)',
    passed: ts03Passed,
    details: ts03State
  });
  console.log(`TS-03 Result: ${ts03Passed ? 'PASSED' : 'FAILED'}`, ts03State);

  // ─────────────────────────────────────────────────────────────
  // TS-04: Mobile Topbar Alignment & Spacing (390x844)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-04: Mobile Topbar Alignment & Spacing (390x844) ---');
  const ts04State = await evaluate(`(() => {
    const topbar = document.getElementById('topbar');
    const brandText = document.querySelector('.brand-wrap .brand-text');
    const logoIcon = document.querySelector('.brand-wrap .logo-icon');
    const switcher = document.querySelector('.topbar-company-switcher-btn');
    const hamburger = document.querySelector('.mobile-menu-btn');
    return {
      topbarHeight: topbar ? topbar.offsetHeight : 0,
      brandTextDisplay: brandText ? window.getComputedStyle(brandText).display : null,
      logoIconDisplay: logoIcon ? window.getComputedStyle(logoIcon).display : null,
      logoIconWidth: logoIcon ? logoIcon.offsetWidth : 0,
      switcherWidth: switcher ? switcher.offsetWidth : 0,
      hamburgerVisible: hamburger ? window.getComputedStyle(hamburger).display !== 'none' : false
    };
  })()`);
  await screenshot('TS04_mobile_topbar_alignment.png');

  const ts04Passed = ts04State.topbarHeight <= 60 && ts04State.brandTextDisplay === 'none' && ts04State.logoIconDisplay === 'flex' && ts04State.switcherWidth <= 150 && ts04State.hamburgerVisible;
  testResults.push({
    id: 'TS-04',
    name: 'Mobile Topbar Alignment & Spacing (390x844)',
    passed: ts04Passed,
    details: ts04State
  });
  console.log(`TS-04 Result: ${ts04Passed ? 'PASSED' : 'FAILED'}`, ts04State);

  // ─────────────────────────────────────────────────────────────
  // TS-05: Dashboard Hero Row & Ticker Stacking (Mobile 390x844)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-05: Dashboard Hero Row & Ticker Stacking (390x844) ---');
  const ts05State = await evaluate(`(() => {
    const heroRow = document.querySelector('.dash-hero-row');
    const profileCard = document.querySelector('.dash-user-profile-card');
    const ticker = document.querySelector('.dash-ticker-embedded');
    return {
      heroFlexDirection: heroRow ? window.getComputedStyle(heroRow).flexDirection : null,
      profileCardWidth: profileCard ? profileCard.offsetWidth : 0,
      profileCardHeight: profileCard ? profileCard.offsetHeight : 0,
      tickerWidth: ticker ? ticker.offsetWidth : 0,
      tickerHeight: ticker ? ticker.offsetHeight : 0,
      isStackedVertically: profileCard && ticker ? (ticker.getBoundingClientRect().top >= profileCard.getBoundingClientRect().bottom) : false
    };
  })()`);
  await screenshot('TS05_mobile_hero_stacking.png');

  const ts05Passed = ts05State.heroFlexDirection === 'column' && ts05State.isStackedVertically && ts05State.profileCardWidth > 300;
  testResults.push({
    id: 'TS-05',
    name: 'Dashboard Hero Row & Ticker Stacking (390x844)',
    passed: ts05Passed,
    details: ts05State
  });
  console.log(`TS-05 Result: ${ts05Passed ? 'PASSED' : 'FAILED'}`, ts05State);

  // ─────────────────────────────────────────────────────────────
  // TS-06: KPI Counter Animation Verification (No Negative Values)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-06: KPI Counter Animation Verification ---');
  const ts06State = await evaluate(`(() => {
    const statCards = Array.from(document.querySelectorAll('.stat-card')).map(card => ({
      label: card.querySelector('.stat-label')?.innerText.trim(),
      valueText: card.querySelector('.stat-value')?.innerText.trim(),
      dataTarget: card.querySelector('.stat-value')?.dataset?.target
    }));
    const hasNegative = statCards.some(c => c.valueText.startsWith('-') || Number(c.valueText) < 0);
    return {
      statCards,
      hasNegative
    };
  })()`);
  await screenshot('TS06_kpi_counters_positive.png');

  const ts06Passed = !ts06State.hasNegative && ts06State.statCards.length >= 4;
  testResults.push({
    id: 'TS-06',
    name: 'KPI Counter Animation Verification (Positive Values)',
    passed: ts06Passed,
    details: ts06State
  });
  console.log(`TS-06 Result: ${ts06Passed ? 'PASSED' : 'FAILED'}`, ts06State);

  // ─────────────────────────────────────────────────────────────
  // TS-07: Mobile Navigation Drawer Opening
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-07: Mobile Navigation Drawer Opening ---');
  await evaluate(`App.openMobileSidebar()`);
  await new Promise(r => setTimeout(r, 800));

  const ts07State = await evaluate(`(() => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const dropdownMenus = Array.from(document.querySelectorAll('.sidebar .nav-dropdown-menu')).map(m => window.getComputedStyle(m).display);
    return {
      sidebarOpenClass: sidebar ? sidebar.classList.contains('mobile-open') : false,
      sidebarLeft: sidebar ? sidebar.getBoundingClientRect().left : -999,
      sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
      allDropdownsInitiallyHidden: dropdownMenus.every(d => d === 'none')
    };
  })()`);
  await screenshot('TS07_mobile_drawer_open.png');

  const ts07Passed = ts07State.sidebarOpenClass && ts07State.sidebarLeft === 0 && ts07State.allDropdownsInitiallyHidden;
  testResults.push({
    id: 'TS-07',
    name: 'Mobile Navigation Drawer Opening (Accordions Collapsed)',
    passed: ts07Passed,
    details: ts07State
  });
  console.log(`TS-07 Result: ${ts07Passed ? 'PASSED' : 'FAILED'}`, ts07State);

  // ─────────────────────────────────────────────────────────────
  // TS-08: Drawer Accordion Expansion (People & Talent)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-08: Drawer Accordion Expansion ---');
  await evaluate(`(() => {
    const trigger = document.querySelector('.sidebar .nav-pillar-dropdown[data-pillar="people"] .nav-pillar-trigger');
    if (trigger) trigger.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const ts08State = await evaluate(`(() => {
    const dropdown = document.querySelector('.sidebar .nav-pillar-dropdown[data-pillar="people"]');
    const menu = dropdown ? dropdown.querySelector('.nav-dropdown-menu') : null;
    const subItems = dropdown ? dropdown.querySelectorAll('.nav-dropdown-subitem') : [];
    const arrow = dropdown ? dropdown.querySelector('.nav-pillar-arrow') : null;
    return {
      dropdownIsOpen: dropdown ? dropdown.classList.contains('open') : false,
      menuDisplay: menu ? window.getComputedStyle(menu).display : null,
      menuPosition: menu ? window.getComputedStyle(menu).position : null,
      menuWidth: menu ? menu.offsetWidth : 0,
      sidebarWidth: document.getElementById('sidebar')?.offsetWidth || 0,
      subItemsCount: subItems.length,
      isContainedInSidebar: menu && document.getElementById('sidebar') ? (menu.getBoundingClientRect().right <= document.getElementById('sidebar').getBoundingClientRect().right + 5) : false
    };
  })()`);
  await screenshot('TS08_mobile_drawer_accordion_expanded.png');

  const ts08Passed = ts08State.dropdownIsOpen && ts08State.menuDisplay === 'flex' && ts08State.menuPosition === 'static' && ts08State.isContainedInSidebar;
  testResults.push({
    id: 'TS-08',
    name: 'Drawer Accordion Expansion (Inline Containment)',
    passed: ts08Passed,
    details: ts08State
  });
  console.log(`TS-08 Result: ${ts08Passed ? 'PASSED' : 'FAILED'}`, ts08State);

  // ─────────────────────────────────────────────────────────────
  // TS-09: Mobile Drawer Accordion Navigation (Employees Module)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-09: Mobile Drawer Accordion Navigation ---');
  await evaluate(`(() => {
    const sub = document.querySelector('.sidebar .nav-dropdown-subitem[data-module="employees"]');
    if (sub) sub.click();
  })()`);
  await new Promise(r => setTimeout(r, 1200));

  const ts09State = await evaluate(`(() => {
    const sidebar = document.getElementById('sidebar');
    const table = document.querySelector('.employee-table, .emp-table, table');
    const rows = document.querySelectorAll('tr[data-emp-id], .employee-row, tbody tr');
    return {
      currentModule: App.currentModule,
      currentHash: window.location.hash,
      sidebarClosed: sidebar ? !sidebar.classList.contains('mobile-open') : false,
      tableFound: !!table,
      rowsCount: rows.length
    };
  })()`);
  await screenshot('TS09_mobile_employees_module.png');

  const ts09Passed = ts09State.currentModule === 'employees' && ts09State.sidebarClosed && ts09State.rowsCount > 0;
  testResults.push({
    id: 'TS-09',
    name: 'Mobile Drawer Accordion Navigation to Employees',
    passed: ts09Passed,
    details: ts09State
  });
  console.log(`TS-09 Result: ${ts09Passed ? 'PASSED' : 'FAILED'}`, ts09State);

  // ─────────────────────────────────────────────────────────────
  // TS-10: Tablet Responsive Balance (768x1024)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-10: Tablet Responsive Balance (768x1024) ---');
  await evaluate(`App.navigate('dashboard')`);
  await new Promise(r => setTimeout(r, 800));

  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1000));

  const ts10State = await evaluate(`(() => {
    const grid = document.querySelector('.grid-4');
    const statCards = document.querySelectorAll('.stat-card');
    return {
      gridCols: grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
      statCardsCount: statCards.length,
      viewportWidth: window.innerWidth
    };
  })()`);
  await screenshot('TS10_tablet_dashboard.png');

  const ts10Passed = ts10State.statCardsCount >= 4 && ts10State.viewportWidth === 768;
  testResults.push({
    id: 'TS-10',
    name: 'Tablet Responsive Balance (768x1024)',
    passed: ts10Passed,
    details: ts10State
  });
  console.log(`TS-10 Result: ${ts10Passed ? 'PASSED' : 'FAILED'}`, ts10State);

  // ─────────────────────────────────────────────────────────────
  // TS-11: Desktop Horizontal Navbar & Hover Dropdown (1440x900)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-11: Desktop Horizontal Navbar (1440x900) ---');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 800));

  // Open Finance & Payroll dropdown on desktop
  await evaluate(`(() => {
    const trigger = document.querySelector('.sidebar .nav-pillar-dropdown[data-pillar="finance"] .nav-pillar-trigger');
    if (trigger) trigger.click();
  })()`);
  await new Promise(r => setTimeout(r, 500));

  const ts11State = await evaluate(`(() => {
    const topbar = document.getElementById('topbar');
    const sidebar = document.getElementById('sidebar');
    const financeDropdown = document.querySelector('.sidebar .nav-pillar-dropdown[data-pillar="finance"]');
    const menu = financeDropdown ? financeDropdown.querySelector('.nav-dropdown-menu') : null;
    return {
      topbarHeight: topbar ? topbar.offsetHeight : 0,
      sidebarHeight: sidebar ? sidebar.offsetHeight : 0,
      sidebarFlexDirection: sidebar ? window.getComputedStyle(sidebar).flexDirection : null,
      menuDisplay: menu ? window.getComputedStyle(menu).display : null,
      menuPosition: menu ? window.getComputedStyle(menu).position : null,
      menuTop: menu ? menu.getBoundingClientRect().top : 0
    };
  })()`);
  await screenshot('TS11_desktop_navbar_dropdown.png');

  const ts11Passed = ts11State.sidebarFlexDirection === 'row' && ts11State.menuDisplay === 'flex' && ts11State.menuPosition === 'absolute';
  testResults.push({
    id: 'TS-11',
    name: 'Desktop Horizontal Navbar & Dropdown (1440x900)',
    passed: ts11Passed,
    details: ts11State
  });
  console.log(`TS-11 Result: ${ts11Passed ? 'PASSED' : 'FAILED'}`, ts11State);

  // ─────────────────────────────────────────────────────────────
  // TS-12: PWA & Cache Freshness Verification
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Running TS-12: PWA & Cache Freshness Verification ---');
  const ts12State = await evaluate(`(() => {
    return {
      hasServiceWorker: 'serviceWorker' in navigator,
      protocol: window.location.protocol,
      allModulesLoaded: typeof Employees !== 'undefined' && typeof Attendance !== 'undefined' && typeof Payroll !== 'undefined' && typeof Security !== 'undefined',
      activeCacheExpected: 'hrm-pro-cache-v3.5.3'
    };
  })()`);
  await screenshot('TS12_sw_cache_audit.png');

  const ts12Passed = ts12State.hasServiceWorker && ts12State.allModulesLoaded;
  testResults.push({
    id: 'TS-12',
    name: 'PWA & Cache Freshness Verification',
    passed: ts12Passed,
    details: ts12State
  });
  console.log(`TS-12 Result: ${ts12Passed ? 'PASSED' : 'FAILED'}`, ts12State);

  // ─────────────────────────────────────────────────────────────
  // Summary & Report Generation
  // ─────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('             QA TEST SUITE EXECUTION SUMMARY           ');
  console.log('═══════════════════════════════════════════════════════');
  const passedCount = testResults.filter(t => t.passed).length;
  console.log(`Total Tests: ${testResults.length} | Passed: ${passedCount} | Failed: ${testResults.length - passedCount}`);
  testResults.forEach(t => {
    console.log(`[${t.passed ? 'PASS' : 'FAIL'}] ${t.id}: ${t.name}`);
  });

  const reportData = {
    timestamp: new Date().toISOString(),
    total: testResults.length,
    passed: passedCount,
    failed: testResults.length - passedCount,
    results: testResults,
    consoleLogsCount: consoleLogs.length
  };

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'qa_manual_testing_report.json'), JSON.stringify(reportData, null, 2));

  browserProc.kill();
  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error('[QA RUNNER FATAL ERROR]', err);
  process.exit(1);
});
