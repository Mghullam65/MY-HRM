const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml'
};

const HTTP_PORT = 8099;
const DEBUG_PORT = 9565;

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, '../public', reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

function getChromePath() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (process.platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  const linuxPaths = [
    process.env.CHROME_BIN,
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium'
  ].filter(Boolean);
  for (const p of linuxPaths) {
    if (fs.existsSync(p)) return p;
  }
  try {
    const which = require('child_process').execSync('which google-chrome || which chrome || which chromium').toString().trim().split('\n')[0];
    if (which && fs.existsSync(which)) return which;
  } catch (e) {}
  return process.env.CHROME_BIN || 'google-chrome';
}

async function runCIAudit() {
  console.log('====================================================');
  console.log('🚀 HRM PRO ENTERPRISE — CI/CD QA QUALITY AUDIT GATE');
  console.log('====================================================\n');

  await new Promise(r => server.listen(HTTP_PORT, '127.0.0.1', r));
  console.log(`[CI] Embedded HTTP server active on http://127.0.0.1:${HTTP_PORT}`);

  const chromePath = getChromePath();
  console.log(`[CI] Launching Chrome executable: ${chromePath}`);

  const chromeArgs = [
    '--headless=new',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--mute-audio',
    '--no-first-run',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${path.join(process.env.TEMP || '/tmp', 'hrm_ci_' + Date.now())}`,
    'about:blank'
  ];

  const chrome = spawn(chromePath, chromeArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  chrome.stdout.on('data', d => console.log(`[Chrome] ${d.toString().trim()}`));
  chrome.stderr.on('data', d => {
    const str = d.toString().trim();
    if (!str.includes('Created TensorFlow Lite') && !str.includes('font_family') && !str.includes('DevTools listening on')) {
      console.log(`[Chrome log] ${str}`);
    }
  });

  chrome.on('error', (err) => {
    console.error('[CI] Chrome spawn error:', err.message);
    process.exit(1);
  });

  // Poll until Chrome debug port is ready (up to 20s / 40 retries)
  let ver = null;
  for (let attempt = 1; attempt <= 40; attempt++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      ver = await new Promise((res, rej) => {
        const req = http.get(`http://127.0.0.1:${DEBUG_PORT}/json/version`, r => {
          let d = ''; r.on('data', c => d += c); r.on('end', () => {
            try { res(JSON.parse(d)); } catch (e) { rej(e); }
          });
        });
        req.on('error', rej);
        req.setTimeout(1000, () => { req.destroy(); rej(new Error('timeout')); });
      });
      console.log(`[CI] Chrome ready on attempt ${attempt} (${attempt * 0.5}s)`);
      break;
    } catch (_) {
      if (attempt === 40) {
        console.error('[CI] Chrome debug port never became available after 20s. Aborting.');
        chrome.kill();
        server.close();
        process.exit(1);
      }
      // still waiting…
    }
  }

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
  const pws = new WebSocket(`ws://127.0.0.1:${DEBUG_PORT}/devtools/page/${targetId}`);
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

  const errors = [];
  const exceptions = [];

  pws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        errors.push(text);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails);
    }
  });

  await psend('Page.enable');
  await psend('Runtime.enable');

  // Test 1: Mobile Viewport 390x844
  await psend('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log('[CI] Step 1: Navigating to #login...');
  await psend('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#login` });
  await new Promise(r => setTimeout(r, 2500));

  // Authenticate as HR Director
  console.log('[CI] Step 2: Authenticating with persona...');
  await psend('Runtime.evaluate', {
    expression: `(() => {
      Auth.login('sara.malik', 'hr123');
      App.showApp();
      App.navigate('dashboard');
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  const standardRoutes = [
    '#dashboard', '#employees', '#attendance', '#leaves',
    '#payroll', '#performance', '#recruitment', '#assets',
    '#expenses', '#helpdesk', '#events', '#reports',
    '#administration', '#settings', '#profile'
  ];

  let passedRoutes = 0;
  let overflowCount = 0;
  let undefinedStringCount = 0;

  console.log(`[CI] Step 3: Auditing ${standardRoutes.length} core application routes...`);

  for (const r of standardRoutes) {
    const mod = r.replace('#', '');
    await psend('Runtime.evaluate', { expression: `App.navigate('${mod}');` });
    await new Promise(res => setTimeout(res, 600));

    const check = await psend('Runtime.evaluate', {
      expression: `(() => {
        const sw = document.documentElement.scrollWidth;
        const iw = window.innerWidth;
        const overflow = sw > (iw + 2);
        
        let hasUndef = false;
        try {
          if (document.body) {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let n = walker.nextNode();
            while (n) {
              const p = n.parentElement;
              if (p && p.tagName !== 'SCRIPT' && /\\b(undefined|NaN)\\b/i.test(n.nodeValue)) {
                hasUndef = true;
                break;
              }
              n = walker.nextNode();
            }
          }
        } catch(e) {}
        
        return { overflow, hasUndef, scrollWidth: sw, innerWidth: iw };
      })()`,
      returnByValue: true
    });

    const res = check.result.value;
    if (res.overflow) {
      console.error(`❌ [OVERFLOW] Route ${r} exceeded viewport (scrollWidth: ${res.scrollWidth}px, innerWidth: ${res.innerWidth}px)`);
      overflowCount++;
    }
    if (res.hasUndef) {
      console.error(`❌ [UNDEFINED_TEXT] Route ${r} contains literal 'undefined' or 'NaN' text`);
      undefinedStringCount++;
    }
    if (!res.overflow && !res.hasUndef) {
      passedRoutes++;
    }
  }

  // Test Mobile Bottom Nav Presence & Active Class
  const bottomNavCheck = await psend('Runtime.evaluate', {
    expression: `(() => {
      const nav = document.getElementById('mobile-bottom-nav');
      if (!nav) return { exists: false, appFound: !!document.getElementById('app') };
      const style = window.getComputedStyle(nav);
      const items = nav.querySelectorAll('.mobile-nav-item').length;
      return { exists: true, display: style.display, items };
    })()`,
    returnByValue: true
  });
  console.log('[CI] Step 4: Mobile bottom navigation dock:', JSON.stringify(bottomNavCheck.result.value));

  // Test Enterprise Enhancements (Tour, DocEngine, PWA)
  const enhancementsCheck = await psend('Runtime.evaluate', {
    expression: `(() => {
      return {
        tourLoaded: typeof HRMTour !== 'undefined',
        docEngineLoaded: typeof HRMDocumentEngine !== 'undefined',
        docHubAccessible: typeof HRMDocumentEngine !== 'undefined' && typeof HRMDocumentEngine.openDocumentHub === 'function',
        badgeGeneratorLoaded: typeof HRMBadgeGenerator !== 'undefined',
        badgeModalAccessible: typeof HRMBadgeGenerator !== 'undefined' && typeof HRMBadgeGenerator.openModal === 'function',
        geminiServiceLoaded: typeof GeminiService !== 'undefined',
        pwaActive: typeof PWA !== 'undefined'
      };
    })()`,
    returnByValue: true
  });
  console.log('[CI] Step 5: Enterprise Enhancements Health:', JSON.stringify(enhancementsCheck.result.value));

  // Teardown
  chrome.kill();
  server.close();

  console.log('\n====================================================');
  console.log('📊 CI/CD AUDIT RESULTS:');
  console.log(`- Routes Passed: ${passedRoutes} / ${standardRoutes.length}`);
  console.log(`- Layout Overflows: ${overflowCount}`);
  console.log(`- Template Undefined/NaN Strings: ${undefinedStringCount}`);
  console.log(`- Uncaught JS Exceptions: ${exceptions.length}`);
  console.log(`- Unhandled Console Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Detail of errors:', JSON.stringify(errors, null, 2));
  }
  console.log('====================================================\n');

  if (overflowCount > 0 || undefinedStringCount > 0 || exceptions.length > 0 || errors.length > 0 || passedRoutes !== standardRoutes.length) {
    console.error('❌ CI AUDIT FAILED: Quality gate failed.');
    process.exit(1);
  } else {
    console.log('✅ ALL CI QUALITY GATES PASSED (100% HEALTHY)');
    process.exit(0);
  }
}

runCIAudit().catch(err => {
  console.error('Fatal CI error:', err);
  process.exit(1);
});
