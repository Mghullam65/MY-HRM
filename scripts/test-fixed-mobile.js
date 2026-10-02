const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = 'C:\\Users\\test\\.gemini\\antigravity-ide\\brain\\745437ff-eb16-493c-96a5-c86a612185c8';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTTP_PORT = 8089;
const DEBUG_PORT = 9666;
const USER_DATA = path.join(process.env.TEMP, 'hrm_fixed_profile_' + Date.now());

// Simple static server for testing local build
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
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function run() {
  await new Promise(res => server.listen(HTTP_PORT, res));
  console.log(`Test server running at http://127.0.0.1:${HTTP_PORT}`);

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
    await new Promise(r => setTimeout(r, 500));
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

  pageWs.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[${msg.params.type}] ${text}`);
    }
  });

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('Network.enable');

  // Set mobile device emulation (390x844, scale 2)
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
    console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);
    return outPath;
  }

  console.log('Navigating to local build at http://127.0.0.1:8089/#login...');
  await sendPage('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#login` });
  await new Promise(r => setTimeout(r, 3500));
  await screenshot('fixed_mobile_1_login.png');

  console.log('Testing login page on desktop viewport (1440x900)...');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));
  await screenshot('fixed_desktop_1_login.png');

  console.log('Switching back to mobile viewport (390x844)...');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Selecting HR Director (Sara Malik) and logging in...');
  await evaluate(`(() => {
    Login.setTab('demo');
    Login.selectAccount('hr');
    Login.submit();
  })()`);
  await new Promise(r => setTimeout(r, 2500));

  console.log('Capturing Sara Malik mobile dashboard...');
  const dashInfo = await evaluate(`({
    brandTextVisible: window.getComputedStyle(document.querySelector('.brand-wrap .brand-text')).display,
    logoIconVisible: window.getComputedStyle(document.querySelector('.brand-wrap .logo-icon')).display,
    companySwitcherWidth: document.querySelector('.topbar-company-switcher-btn')?.offsetWidth,
    heroRowDirection: window.getComputedStyle(document.querySelector('.dash-hero-row')).flexDirection,
    profileCardWidth: document.querySelector('.dash-user-profile-card')?.offsetWidth,
    tickerWidth: document.querySelector('.dash-ticker-embedded')?.offsetWidth,
    totalEmployeesCard: document.querySelectorAll('.stat-card .stat-value')[0]?.innerText
  })`);
  console.log('Dashboard measurements:', JSON.stringify(dashInfo, null, 2));
  await screenshot('fixed_mobile_2_dashboard_sara.png');

  console.log('Testing mobile sidebar drawer open (all accordions collapsed initially)...');
  await evaluate(`App.openMobileSidebar()`);
  await new Promise(r => setTimeout(r, 1000));
  await screenshot('fixed_mobile_3_drawer_open.png');

  console.log('Expanding People & Talent pillar accordion inside mobile drawer...');
  await evaluate(`(() => {
    const trigger = document.querySelector('.sidebar .nav-pillar-dropdown[data-pillar="people"] .nav-pillar-trigger');
    if (trigger) trigger.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('fixed_mobile_4_drawer_accordion_expanded.png');

  console.log('Closing mobile drawer...');
  await evaluate(`App.closeMobileSidebar()`);
  await new Promise(r => setTimeout(r, 500));

  console.log('Testing tablet viewport (768x1024)...');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1000));
  await screenshot('fixed_tablet_dashboard.png');

  console.log('Testing desktop viewport (1440x900) to ensure no regressions...');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));
  await screenshot('fixed_desktop_dashboard.png');

  console.log('Done!');
  browserProc.kill();
  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
