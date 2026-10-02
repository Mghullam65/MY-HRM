const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const HTTP_PORT = 8096;
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

async function runAudit() {
  await new Promise(r => server.listen(HTTP_PORT, '127.0.0.1', r));
  console.log(`Embedded server running on http://127.0.0.1:${HTTP_PORT}`);
  console.log('=== STARTING DEEP SYSTEM ISSUE AUDIT ===');
  const port = 9556;
  const tempDir = path.join(process.env.TEMP, 'chrome_audit_' + Date.now());
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const ver = await new Promise(res => {
    http.get(`http://127.0.0.1:${port}/json/version`, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    });
  });

  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  let id = 1;
  const send = (m, params = {}) => new Promise((resolve) => {
    const cur = id++;
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === cur) { ws.off('message', handler); resolve(msg.result); }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const pws = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
  await new Promise(r => pws.on('open', r));

  let pid = 1;
  const psend = (m, params = {}) => new Promise(res => {
    const cur = pid++;
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === cur) { pws.off('message', handler); res(msg.result); }
    };
    pws.on('message', handler);
    pws.send(JSON.stringify({ id: cur, method: m, params }));
  });

  const consoleLogs = [];
  const exceptions = [];
  const networkErrors = [];

  pws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      if (msg.params.type === 'error' || msg.params.type === 'warning') {
        consoleLogs.push({ type: msg.params.type, text });
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails);
    }
    if (msg.method === 'Network.responseReceived') {
      if (msg.params.response.status >= 400) {
        networkErrors.push({ status: msg.params.response.status, url: msg.params.response.url });
      }
    }
  });

  await psend('Page.enable');
  await psend('Runtime.enable');
  await psend('Network.enable');

  const auditReport = {
    target: `http://127.0.0.1:${HTTP_PORT}`,
    routesTested: [],
    overflowIssues: [],
    brokenImages: [],
    nanOrUndefinedStrings: [],
    modalsTested: [],
    themeTested: null,
    i18nTested: null,
    exceptions,
    consoleErrors: consoleLogs,
    networkErrors
  };

  // Step 1: Test Login Page on Mobile
  await psend('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log('[1] Testing Mobile Login Route (#login)...');
  await psend('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#login` });
  await new Promise(r => setTimeout(r, 2500));

  // Check overflow on Mobile Login
  const loginOverflow = await psend('Runtime.evaluate', {
    expression: '(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, hasOverflow: document.documentElement.scrollWidth > window.innerWidth }))()',
    returnByValue: true
  });
  if (loginOverflow.result.value.hasOverflow) {
    auditReport.overflowIssues.push({ route: '#login', details: loginOverflow.result.value });
  }

  // Step 2: Login via UI demo account selection (Sara Malik - HR Director)
  console.log('[2] Authenticating as Sara Malik (HR Director) via UI...');
  await psend('Runtime.evaluate', {
    expression: `(() => {
      Login.setTab('demo');
      Login.selectAccount('hr');
      Login.submit();
    })()`
  });
  await new Promise(r => setTimeout(r, 3000));

  // Collect all hash routes from navigation
  const routes = await psend('Runtime.evaluate', {
    expression: `(() => {
      const links = Array.from(document.querySelectorAll('a[href^="#"], [data-nav], [data-route]'));
      const hashes = new Set();
      links.forEach(l => {
        const href = l.getAttribute('href') || l.getAttribute('data-nav') || l.getAttribute('data-route');
        if (href && href.startsWith('#') && href.length > 1) hashes.add(href);
      });
      // Standard modules
      const standard = ['#dashboard', '#employees', '#attendance', '#leaves', '#payroll', '#performance', '#recruitment', '#assets', '#expenses', '#helpdesk', '#events', '#reports', '#administration', '#settings', '#profile'];
      standard.forEach(s => hashes.add(s));
      return Array.from(hashes);
    })()`,
    returnByValue: true
  });

  console.log(`[3] Found ${routes.result.value.length} routes to audit:`, routes.result.value);

  // Test routes on Mobile (390px)
  for (const r of routes.result.value) {
    console.log(`Testing route on Mobile: ${r}`);
    await psend('Runtime.evaluate', { expression: `window.location.hash = '${r}';` });
    await new Promise(res => setTimeout(res, 800));

    const check = await psend('Runtime.evaluate', {
      expression: `(() => {
        const sw = document.documentElement.scrollWidth;
        const iw = window.innerWidth;
        const overflow = sw > (iw + 2); // 2px tolerance for subpixel
        
        // Check for broken images
        const imgs = Array.from(document.querySelectorAll('img'));
        const broken = imgs.filter(i => i.complete && i.naturalWidth === 0 && !i.src.includes('data:image/svg')).map(i => i.src);
        
        // Check for literal "undefined" or "NaN" in visible text
        const bodyText = document.body.innerText;
        const hasNaN = /\\bNaN\\b/.test(bodyText);
        const hasUndefined = /\\bundefined\\b/.test(bodyText);
        
        return {
          route: '${r}',
          scrollWidth: sw,
          innerWidth: iw,
          overflow,
          brokenImages: broken,
          hasNaN,
          hasUndefined
        };
      })()`,
      returnByValue: true
    });

    const res = check.result.value;
    auditReport.routesTested.push(r);
    if (res.overflow) {
      auditReport.overflowIssues.push({ route: r, scrollWidth: res.scrollWidth, innerWidth: res.innerWidth });
    }
    if (res.brokenImages && res.brokenImages.length > 0) {
      auditReport.brokenImages.push({ route: r, images: res.brokenImages });
    }
    if (res.hasNaN || res.hasUndefined) {
      auditReport.nanOrUndefinedStrings.push({ route: r, hasNaN: res.hasNaN, hasUndefined: res.hasUndefined });
    }
  }

  // Step 4: Test Modal Dialogs (Add Employee modal, Clock in modal)
  console.log('[4] Testing Modal Dialogs...');
  const modalTest = await psend('Runtime.evaluate', {
    expression: `(() => {
      const results = [];
      // Test opening employee modal
      if (typeof window.Employees !== 'undefined' && typeof window.Employees.openAddModal === 'function') {
        try {
          window.Employees.openAddModal();
          const modal = document.querySelector('.modal-container.active, .modal.active, #modal-container.active, .modal-backdrop');
          results.push({ modal: 'Employees.openAddModal', opened: !!modal });
          if (window.Modal && typeof window.Modal.close === 'function') window.Modal.close();
        } catch(e) {
          results.push({ modal: 'Employees.openAddModal', error: e.message });
        }
      }
      return results;
    })()`,
    returnByValue: true
  });
  auditReport.modalsTested = modalTest.result.value;

  // Step 5: Test Theme Switcher (Dark/Light)
  console.log('[5] Testing Theme Switching...');
  const themeTest = await psend('Runtime.evaluate', {
    expression: `(() => {
      const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      let switched = false;
      const toggleBtn = document.querySelector('[data-action="toggle-theme"], #theme-toggle, .theme-toggle-btn');
      if (toggleBtn) {
        toggleBtn.click();
        const newTheme = document.documentElement.getAttribute('data-theme');
        switched = (newTheme !== initialTheme);
        // toggle back
        toggleBtn.click();
      }
      return { initialTheme, hasToggleBtn: !!toggleBtn, switchedSuccessfully: switched };
    })()`,
    returnByValue: true
  });
  auditReport.themeTested = themeTest.result.value;

  // Step 6: Test Desktop Viewport Navigation & Navbar
  console.log('[6] Testing Desktop Viewport (1440x900)...');
  await psend('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await psend('Runtime.evaluate', { expression: `window.location.hash = '#dashboard';` });
  await new Promise(r => setTimeout(r, 1200));

  const desktopCheck = await psend('Runtime.evaluate', {
    expression: `(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
      navItemsCount: document.querySelectorAll('.nav-pillar, .nav-item').length,
      statCardsCount: document.querySelectorAll('.stat-card, .kpi-card, .metric-card').length
    }))()`,
    returnByValue: true
  });
  auditReport.desktopCheck = desktopCheck.result.value;

  // Save report
  fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify(auditReport, null, 2));
  console.log('=== AUDIT COMPLETE ===');
  console.log('Results summary:');
  console.log('- Routes tested:', auditReport.routesTested.length);
  console.log('- Overflow issues:', auditReport.overflowIssues.length, auditReport.overflowIssues);
  console.log('- Broken images:', auditReport.brokenImages.length, auditReport.brokenImages);
  console.log('- NaN or Undefined strings:', auditReport.nanOrUndefinedStrings.length, auditReport.nanOrUndefinedStrings);
  console.log('- Exceptions caught:', auditReport.exceptions.length);
  console.log('- Console errors:', auditReport.consoleErrors.length);
  console.log('- Network errors (4xx/5xx):', auditReport.networkErrors.length);

  try { server.close(); } catch(e) {}
  chrome.kill();
  process.exit(0);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
