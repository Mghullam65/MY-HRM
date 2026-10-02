const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = 'C:\\Users\\test\\.gemini\\antigravity-ide\\brain\\745437ff-eb16-493c-96a5-c86a612185c8';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9444;
const USER_DATA = path.join(process.env.TEMP, 'hrm_mobile_profile_' + Date.now());

async function run() {
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
  const consoleLogs = [];
  const uncaughtErrors = [];

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
      consoleLogs.push(`[${msg.params.type}] ${text}`);
      if (msg.params.type === 'error') {
        console.error('PAGE ERROR:', text);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION:', msg.params.exceptionDetails);
      uncaughtErrors.push(msg.params.exceptionDetails);
    }
  });

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('Network.enable');

  // Set mobile device emulation (iPhone 14 / Pixel: 390x844, scale 3, mobile=true)
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sendPage('Emulation.setTouchEmulationEnabled', { enabled: true });

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

  console.log('Navigating to live site on mobile...');
  await sendPage('Page.navigate', { url: 'https://my-hrm-rosy.vercel.app/' });
  await new Promise(r => setTimeout(r, 4000));
  await screenshot('mobile_1_landing.png');

  console.log('Opening login on mobile...');
  await evaluate(`App.showLogin()`);
  await new Promise(r => setTimeout(r, 1500));
  await screenshot('mobile_2_login.png');

  console.log('Logging in as HR Director (Sara Malik)...');
  await evaluate(`(() => {
    Login.setTab('demo');
    Login.selectAccount('hr');
    Login.submit();
  })()`);
  await new Promise(r => setTimeout(r, 3500));

  const mobileDashboardInfo = await evaluate(`({
    appDisplay: window.getComputedStyle(document.getElementById('app')).display,
    appHeight: document.getElementById('app').offsetHeight,
    topbarHeight: document.getElementById('topbar').offsetHeight,
    topbarComputed: {
      position: window.getComputedStyle(document.getElementById('topbar')).position,
      height: window.getComputedStyle(document.getElementById('topbar')).height,
      zIndex: window.getComputedStyle(document.getElementById('topbar')).zIndex
    },
    sidebarComputed: {
      display: window.getComputedStyle(document.getElementById('sidebar')).display,
      position: window.getComputedStyle(document.getElementById('sidebar')).position,
      transform: window.getComputedStyle(document.getElementById('sidebar')).transform,
      height: window.getComputedStyle(document.getElementById('sidebar')).height
    },
    pageContentComputed: {
      display: window.getComputedStyle(document.getElementById('page-content')).display,
      height: window.getComputedStyle(document.getElementById('page-content')).height,
      overflow: window.getComputedStyle(document.getElementById('page-content')).overflowY
    },
    htmlContentPreview: document.getElementById('page-content').innerHTML.substring(0, 300)
  })`);
  console.log('Mobile Dashboard DOM Info:', JSON.stringify(mobileDashboardInfo, null, 2));

  await screenshot('mobile_3_dashboard_sara.png');

  console.log('Testing side navigation / hamburger click...');
  await evaluate(`App.openMobileSidebar()`);
  await new Promise(r => setTimeout(r, 1000));
  await screenshot('mobile_4_sidebar_drawer.png');

  browserProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
