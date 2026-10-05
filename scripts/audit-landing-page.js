const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const HTTP_PORT = 3000;
const DEBUG_PORT = 9566;

function getChromePath() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  if (process.platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  return 'google-chrome';
}

async function runAudit() {
  console.log('--- Starting Landing Page Automated Audit ---');
  const chromePath = getChromePath();
  const chromeArgs = [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `http://127.0.0.1:${HTTP_PORT}/index.html#landing`
  ];

  const chrome = spawn(chromePath, chromeArgs);
  let wsUrl = null;

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const resp = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${DEBUG_PORT}/json`, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (resp && resp[0] && resp[0].webSocketDebuggerUrl) {
        wsUrl = resp[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome debugging port.');
    chrome.kill();
    process.exit(1);
  }

  console.log(`[CDP] Connected: ${wsUrl}`);
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.on('open', r));

  let msgId = 1;
  const send = (m, params = {}) => new Promise(resolve => {
    const cur = msgId++;
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

  pws.on('message', data => {
    try {
      const msg = JSON.parse(data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        console.log(`[Browser Console ${msg.params.type}]`, text);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error(`[Browser Exception]`, msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
      }
    } catch(e) {}
  });

  await psend('Page.enable');
  await psend('Runtime.enable');
  await psend('Log.enable');

  console.log('[Page] Navigating to http://127.0.0.1:3000/index.html#landing ...');
  await psend('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html#landing` });

  async function evaluate(expression) {
    const res = await psend('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  // Wait for Page to load and App to initialize
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n--- 1. Testing Theme Switching ---');
  const initialTheme = await evaluate(`({
    landingThemeAttr: document.getElementById('landing-page')?.getAttribute('data-landing-theme'),
    dataThemeAttr: document.getElementById('landing-page')?.getAttribute('data-theme'),
    wrapperThemeAttr: document.querySelector('.landing-wrapper')?.getAttribute('data-landing-theme'),
    computedBg: window.getComputedStyle(document.querySelector('.landing-wrapper') || document.body).backgroundColor,
    computedColor: window.getComputedStyle(document.querySelector('.landing-brand-name') || document.body).color
  })`);
  console.log('Initial Theme State:', initialTheme);

  // Click Theme Toggle
  const toggleResult = await evaluate(`(function() {
    const btn = document.getElementById('landing-theme-toggle') || document.querySelector('.landing-theme-toggle-btn');
    if (!btn) return { error: 'Toggle button not found' };
    btn.click();
    return {
      clicked: true,
      newLandingThemeAttr: document.getElementById('landing-page')?.getAttribute('data-landing-theme'),
      newDataThemeAttr: document.getElementById('landing-page')?.getAttribute('data-theme'),
      wrapperThemeAttr: document.querySelector('.landing-wrapper')?.getAttribute('data-landing-theme'),
      computedBg: window.getComputedStyle(document.querySelector('.landing-wrapper') || document.body).backgroundColor,
      computedColor: window.getComputedStyle(document.querySelector('.landing-brand-name') || document.body).color,
      savedThemeInStorage: localStorage.getItem('landing_theme') || localStorage.getItem('hrm_landing_theme')
    };
  })()`);
  console.log('After Theme Toggle Click:', toggleResult);

  console.log('\n--- 2. Testing 16 Module Catalog & Filter Buttons ---');
  const catalogAudit = await evaluate(`(function() {
    const grid = document.getElementById('modules-catalog-grid');
    if (!grid) return { error: 'modules-catalog-grid element not found' };
    const initialCards = grid.querySelectorAll('.module-catalog-card').length;
    
    // Test clicking category filters
    const filterButtons = Array.from(document.querySelectorAll('.catalog-filter-btn'));
    const filterResults = {};
    
    filterButtons.forEach(btn => {
      const cat = btn.getAttribute('data-cat');
      btn.click();
      const count = document.querySelectorAll('#modules-catalog-grid .module-catalog-card').length;
      filterResults[cat] = count;
    });

    // Reset to 'all'
    const allBtn = document.querySelector('.catalog-filter-btn[data-cat="all"]');
    if (allBtn) allBtn.click();

    return {
      initialCards,
      filterButtonsCount: filterButtons.length,
      filterResults
    };
  })()`);
  console.log('Catalog Audit:', catalogAudit);

  console.log('\n--- 3. Testing Module Detail Navigation ---');
  const moduleDetailAudit = await evaluate(`(function() {
    const firstCard = document.querySelector('#modules-catalog-grid .module-catalog-card');
    if (!firstCard) return { error: 'No module cards in grid' };
    firstCard.click();
    
    const detailPage = document.getElementById('module-detail-page');
    const isDetailVisible = detailPage && detailPage.style.display !== 'none';
    const heroTitle = detailPage?.querySelector('.module-hero-title')?.textContent?.trim();
    const capsCount = detailPage?.querySelectorAll('.module-cap-card')?.length || 0;
    
    // Back button
    const backBtn = detailPage?.querySelector('.module-btn-back') || detailPage?.querySelector('.btn-module-secondary');
    if (backBtn) backBtn.click();
    
    const landingPage = document.getElementById('landing-page');
    const isLandingRestored = landingPage && landingPage.style.display !== 'none';

    return {
      isDetailVisible,
      heroTitle,
      capsCount,
      isLandingRestored
    };
  })()`);
  console.log('Module Detail Audit:', moduleDetailAudit);

  console.log('\n--- 4. Testing Live DB Telemetry on Landing Page ---');
  const telemetryAudit = await evaluate(`(function() {
    return {
      hasDB: typeof DB !== 'undefined',
      hasGet: typeof DB !== 'undefined' && typeof DB.get === 'function',
      hasGetEmployees: typeof DB !== 'undefined' && typeof DB.getEmployees === 'function',
      empCountFromGet: (typeof DB !== 'undefined' && DB.get) ? (DB.get('employees') || []).length : 'N/A',
      attCountFromGet: (typeof DB !== 'undefined' && DB.get) ? (DB.get('attendance') || []).length : 'N/A'
    };
  })()`);
  console.log('Telemetry Audit:', telemetryAudit);

  console.log('\n--- 5. Testing Viewport Alignment & Overflow ---');
  const viewports = [
    { name: 'Desktop (1440x900)', width: 1440, height: 900 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Mobile (375x812)', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    await psend('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 900
    });
    await new Promise(r => setTimeout(r, 400));
    
    const overflowInfo = await evaluate(`({
      bodyScrollWidth: document.body.scrollWidth,
      windowInnerWidth: window.innerWidth,
      hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
      headerWidth: document.querySelector('.landing-header')?.offsetWidth,
      heroWidth: document.querySelector('.landing-hero')?.offsetWidth
    })`);
    console.log(`Viewport ${vp.name}:`, overflowInfo);
  }

  // Cleanup
  ws.close();
  chrome.kill();
  console.log('\n--- Audit Complete ---');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
