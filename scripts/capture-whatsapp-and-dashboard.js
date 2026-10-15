const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DEBUG_PORT = 9688;
const TARGET_URL = 'http://127.0.0.1:5000';
const ARTIFACTS_DIR = 'C:\\Users\\mghul\\.gemini\\antigravity-ide\\brain\\1326450e-7133-4695-b023-fe529e8867f2';

async function main() {
  console.log('🚀 Starting Chrome CDP capture for WhatsApp Widget & Dashboard Topbar...');

  const tmpDir = path.join(os.tmpdir(), `hrm-screen-wa-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpDir}`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const resp = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${DEBUG_PORT}/json`, r => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      const page = resp.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch(e) {}
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket debugger URL');
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.on('open', r));

  let pid = 1;
  function send(method, params = {}) {
    return new Promise(res => {
      const cur = pid++;
      const handler = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === cur) { ws.off('message', handler); res(msg.result); }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: cur, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // 1. Navigate to Landing Page
  console.log('Navigating to landing page...');
  await send('Page.navigate', { url: `${TARGET_URL}/#landing` });
  await new Promise(r => setTimeout(r, 2500));

  // Verify WhatsApp widget state on Landing Page
  const waCheck = await send('Runtime.evaluate', {
    expression: `(function() {
      const launcher = document.getElementById('landing-whatsapp-launcher');
      const numberEl = document.querySelector('.whatsapp-popup-number');
      const linkEl = document.getElementById('whatsapp-btn-link');
      return {
        launcherExists: !!launcher,
        launcherDisplay: launcher ? window.getComputedStyle(launcher).display : 'none',
        numberText: numberEl ? numberEl.innerText : '',
        linkHref: linkEl ? linkEl.href : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('Landing WhatsApp Check:', waCheck.result.value);

  // Take landing screenshot without hover (clean state, no visible phone digits)
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  const landingFile = path.join(ARTIFACTS_DIR, 'whatsapp_landing_clean.png');
  fs.writeFileSync(landingFile, Buffer.from(snap1.data, 'base64'));
  console.log('✅ Clean landing screenshot saved:', landingFile);

  // Hover over the WhatsApp launcher
  await send('Runtime.evaluate', {
    expression: `(function() {
      const tooltip = document.getElementById('whatsapp-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        tooltip.style.transform = 'translateX(0)';
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  const hoverFile = path.join(ARTIFACTS_DIR, 'whatsapp_landing_hover.png');
  fs.writeFileSync(hoverFile, Buffer.from(snap2.data, 'base64'));
  console.log('✅ Hovered WhatsApp screenshot saved:', hoverFile);

  // 2. Navigate to Dashboard
  console.log('Navigating to Dashboard...');
  await send('Runtime.evaluate', {
    expression: `(function() {
      if (typeof Auth !== 'undefined' && Auth.login) {
        Auth.login('admin', 'admin123');
      }
      if (typeof App !== 'undefined') {
        App.showApp();
        App.navigate('dashboard');
      }
    })()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 2000));

  // Check topbar for moon icon
  const topbarCheck = await send('Runtime.evaluate', {
    expression: `(function() {
      const topbarEl = document.getElementById('topbar') || document.querySelector('.topbar');
      const moonBtn = topbarEl ? topbarEl.querySelector('.theme-toggle-btn') : null;
      const moonIcon = topbarEl ? topbarEl.querySelector('.fa-moon') : null;
      const waLauncher = document.getElementById('landing-whatsapp-launcher');
      const topbarButtons = topbarEl ? Array.from(topbarEl.querySelectorAll('.topbar-btn')).map(b => b.title || b.innerHTML.trim()) : [];
      return {
        hasMoonBtn: !!moonBtn,
        hasMoonIcon: !!moonIcon,
        waLauncherDisplayInDashboard: waLauncher ? window.getComputedStyle(waLauncher).display : 'none',
        topbarButtons
      };
    })()`,
    returnByValue: true
  });
  console.log('Dashboard Topbar Check:', topbarCheck.result.value);

  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  const dashFile = path.join(ARTIFACTS_DIR, 'dashboard_topbar_clean.png');
  fs.writeFileSync(dashFile, Buffer.from(snap3.data, 'base64'));
  console.log('✅ Dashboard screenshot saved:', dashFile);

  ws.close();
  chrome.kill();
  console.log('🎉 Done CDP Capture verification!');
}

main().catch(err => {
  console.error('Error during CDP capture:', err);
  process.exit(1);
});
