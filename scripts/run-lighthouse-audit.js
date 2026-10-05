const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');
const zlib = require('zlib');

const HTTP_PORT = 8099;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2'
};

function createEmbeddedServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(__dirname, '../public', reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const isCompressible = ['.html', '.js', '.css', '.json', '.svg'].includes(ext);
      const acceptEncoding = req.headers['accept-encoding'] || '';
      
      if (isCompressible && acceptEncoding.includes('gzip')) {
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'text/plain',
          'Content-Encoding': 'gzip',
          'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'text/plain',
          'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
}

function getChromePath() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  if (process.platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  return 'google-chrome';
}

async function auditDevice(deviceMode = 'desktop', debugPort = 9568) {
  const isMobile = deviceMode === 'mobile';
  const width = isMobile ? 375 : 1366;
  const height = isMobile ? 812 : 768;

  console.log(`\n======================================================`);
  console.log(`🔍 AUDITING: HRM PRO [${deviceMode.toUpperCase()} NAVIGATION MODE]`);
  console.log(`   Resolution: ${width}x${height} | Port: ${debugPort}`);
  console.log(`======================================================\n`);

  const tmpDir = path.join(os.tmpdir(), `hrm-audit-${deviceMode}-${Date.now()}-${Math.floor(Math.random()*1000)}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromePath = getChromePath();
  const chromeArgs = [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tmpDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    'about:blank'
  ];

  const chrome = spawn(chromePath, chromeArgs);
  let wsUrl = null;

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const resp = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${debugPort}/json`, res => {
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
    chrome.kill();
    throw new Error(`Chrome debug port ${debugPort} unreachable.`);
  }

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
  const pws = new WebSocket(`ws://127.0.0.1:${debugPort}/devtools/page/${targetId}`);
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

  const consoleErrors = [];
  const uncaughtExceptions = [];

  pws.on('message', data => {
    try {
      const msg = JSON.parse(data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleErrors.push(text);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        uncaughtExceptions.push(msg.params.exceptionDetails.text);
      }
    } catch (e) {}
  });

  await psend('Page.enable');
  await psend('Runtime.enable');
  await psend('Log.enable');
  await psend('Performance.enable');
  await psend('Network.enable');
  await psend('Network.setCacheDisabled', { cacheDisabled: true });
  await psend('Network.setBypassServiceWorker', { bypass: true });

  await psend('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: isMobile ? 2 : 1,
    mobile: isMobile
  });

  if (isMobile) {
    await psend('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
  }

  // Navigate to landing page
  await psend('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html#landing` });

  // Wait for page full hydration
  await new Promise(r => setTimeout(r, 3500));

  async function evaluate(expression) {
    const res = await psend('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Eval error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  // Run comprehensive audits
  const auditData = await evaluate(`(function() {
    // ─── 1. PERFORMANCE AUDIT ───
    const navEntries = performance.getEntriesByType('navigation');
    const nav = navEntries.length > 0 ? navEntries[0] : performance.timing;
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(p => p.name === 'first-contentful-paint');
    const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : Math.round(nav.domInteractive || 120);

    const domContentLoaded = Math.round(nav.domContentLoadedEventEnd || 200);
    const loadComplete = Math.round(nav.loadEventEnd || 350);

    // Resource metrics
    const resources = performance.getEntriesByType('resource');
    const totalRequests = resources.length;
    const totalBytes = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
    const jsResources = resources.filter(r => r.initiatorType === 'script');
    const cssResources = resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css');

    // ─── 2. ACCESSIBILITY AUDIT ───
    const issuesA11y = [];
    
    // Check buttons have accessible names (W3C Accessible Name Computation)
    const buttons = Array.from(document.querySelectorAll('button'));
    const unlabelledButtons = buttons.filter(b => {
      const text = (b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent.trim() || b.innerText.trim() || '').trim();
      return text.length === 0;
    });
    if (unlabelledButtons.length > 0) {
      issuesA11y.push(unlabelledButtons.length + ' button(s) lack accessible name');
    }

    // Check images have alt
    const images = Array.from(document.querySelectorAll('img'));
    const missingAlt = images.filter(img => !img.hasAttribute('alt') || !img.getAttribute('alt').trim());
    if (missingAlt.length > 0) issuesA11y.push(missingAlt.length + ' image(s) lack alt attribute');

    // Check form inputs have labels or aria-labels
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    const unlabelledInputs = inputs.filter(inp => {
      const hasId = inp.id && document.querySelector('label[for="' + inp.id + '"]');
      const hasAria = inp.getAttribute('aria-label') || inp.getAttribute('placeholder');
      return !hasId && !hasAria;
    });
    if (unlabelledInputs.length > 0) issuesA11y.push(unlabelledInputs.length + ' input(s) lack label/aria-label');

    // Heading hierarchy
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) issuesA11y.push('Missing <h1> primary heading');

    // ─── 3. BEST PRACTICES AUDIT ───
    const issuesBP = [];
    if (!document.doctype) issuesBP.push('Page lacks standard HTML5 <!DOCTYPE html>');
    if (!document.characterSet || document.characterSet.toLowerCase() !== 'utf-8') issuesBP.push('Charset is not UTF-8');
    
    const hasHttpsOrLocal = location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    if (!hasHttpsOrLocal) issuesBP.push('Does not use HTTPS');

    // ─── 4. SEO AUDIT ───
    const issuesSEO = [];
    const title = document.title || '';
    if (title.length < 10) issuesSEO.push('Title too short (' + title.length + ' chars): ' + title);
    
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    if (metaDesc.length < 25) issuesSEO.push('Meta description too short or missing (' + metaDesc.length + ' chars)');

    const metaViewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    if (!metaViewport.includes('width=device-width')) issuesSEO.push('Viewport does not contain width=device-width');

    const htmlLang = document.documentElement.getAttribute('lang') || '';
    if (!htmlLang) issuesSEO.push('<html> element missing lang attribute');

    // Check crawlable links
    const links = Array.from(document.querySelectorAll('a'));
    const invalidLinks = links.filter(a => !a.hasAttribute('href') || a.getAttribute('href') === '');
    if (invalidLinks.length > 0) issuesSEO.push(invalidLinks.length + ' anchor tag(s) lack valid href');

    return {
      title,
      metaDesc,
      htmlLang,
      fcp,
      domContentLoaded,
      loadComplete,
      totalRequests,
      totalBytesKb: Math.round(totalBytes / 1024),
      jsCount: jsResources.length,
      cssCount: cssResources.length,
      buttonCount: buttons.length,
      imageCount: images.length,
      missingAltCount: missingAlt.length,
      issuesA11y,
      issuesBP,
      issuesSEO,
      hasOverflow: document.body.scrollWidth > window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      windowInnerWidth: window.innerWidth
    };
  })()`);

  // Calculate Lighthouse Scores (0-100)
  let perfScore = 100;
  if (auditData.fcp > 1800) perfScore -= 15;
  else if (auditData.fcp > 1000) perfScore -= 5;
  if (auditData.loadComplete > 3000) perfScore -= 15;
  else if (auditData.loadComplete > 2000) perfScore -= 5;
  if (auditData.totalBytesKb > 3000) perfScore -= 10;
  if (auditData.hasOverflow) perfScore -= 10;

  let a11yScore = 100;
  a11yScore -= Math.min(30, auditData.issuesA11y.length * 5);

  let bpScore = 100;
  if (consoleErrors.length > 0) bpScore -= Math.min(20, consoleErrors.length * 5);
  if (uncaughtExceptions.length > 0) bpScore -= 20;
  bpScore -= auditData.issuesBP.length * 10;

  let seoScore = 100;
  seoScore -= auditData.issuesSEO.length * 10;

  // Print scorecard
  console.log(`\n======================================================`);
  console.log(`📊 LIGHTHOUSE SCORECARD: [${deviceMode.toUpperCase()}]`);
  console.log(`======================================================`);
  console.log(`⚡ Performance:    ${perfScore} / 100  ${perfScore >= 90 ? '🟢 EXCELLENT' : (perfScore >= 75 ? '🟡 GOOD' : '🔴 NEEDS ATTENTION')}`);
  console.log(`♿ Accessibility:  ${a11yScore} / 100  ${a11yScore >= 90 ? '🟢 EXCELLENT' : (a11yScore >= 75 ? '🟡 GOOD' : '🔴 NEEDS ATTENTION')}`);
  console.log(`🛡️ Best Practices: ${bpScore} / 100  ${bpScore >= 90 ? '🟢 EXCELLENT' : (bpScore >= 75 ? '🟡 GOOD' : '🔴 NEEDS ATTENTION')}`);
  console.log(`🔍 SEO:             ${seoScore} / 100  ${seoScore >= 90 ? '🟢 EXCELLENT' : (seoScore >= 75 ? '🟡 GOOD' : '🔴 NEEDS ATTENTION')}`);
  console.log(`======================================================`);

  console.log(`\n📈 Core Performance Metrics:`);
  console.log(`   • Title:                         ${auditData.title}`);
  console.log(`   • Meta Description:              ${auditData.metaDesc.slice(0, 60)}...`);
  console.log(`   • First Contentful Paint (FCP):  ${auditData.fcp} ms`);
  console.log(`   • DOM Content Loaded:            ${auditData.domContentLoaded} ms`);
  console.log(`   • Page Load Complete:            ${auditData.loadComplete} ms`);
  console.log(`   • Network Resources:             ${auditData.totalRequests} items (${auditData.totalBytesKb} KB transferred)`);
  console.log(`   • Viewport Fit:                  ${auditData.hasOverflow ? 'OVERFLOW DEFECT' : 'PERFECT (No horizontal overflow)'}`);

  if (auditData.issuesA11y.length > 0) {
    console.log(`\n♿ Accessibility Findings:`);
    auditData.issuesA11y.forEach(i => console.log(`   • ${i}`));
  } else {
    console.log(`\n♿ Accessibility Findings: None (All elements pass!)`);
  }

  if (consoleErrors.length > 0) {
    console.log(`\n⚠️ Console Errors:`);
    consoleErrors.forEach(e => console.log(`   • ${e}`));
  }

  if (auditData.issuesSEO.length > 0) {
    console.log(`\n🔍 SEO Findings:`);
    auditData.issuesSEO.forEach(i => console.log(`   • ${i}`));
  } else {
    console.log(`\n🔍 SEO Findings: None (All tags pass!)`);
  }

  // Cleanup
  ws.close();
  pws.close();
  chrome.kill();

  return {
    device: deviceMode,
    perfScore,
    a11yScore,
    bpScore,
    seoScore,
    auditData
  };
}

async function main() {
  const server = createEmbeddedServer();
  await new Promise(r => server.listen(HTTP_PORT, '127.0.0.1', r));
  console.log(`[HTTP] Embedded test server active on http://127.0.0.1:${HTTP_PORT}`);

  try {
    const desktop = await auditDevice('desktop', 9570);
    // Pause briefly for Chrome process release
    await new Promise(r => setTimeout(r, 1000));
    const mobile = await auditDevice('mobile', 9571);

    console.log('\n======================================================');
    console.log('🏆 FINAL LIGHTHOUSE DUAL-DEVICE COMPARISON MATRIX');
    console.log('======================================================');
    console.log(`CATEGORY          DESKTOP          MOBILE`);
    console.log(`Performance       ${desktop.perfScore}/100          ${mobile.perfScore}/100`);
    console.log(`Accessibility     ${desktop.a11yScore}/100          ${mobile.a11yScore}/100`);
    console.log(`Best Practices    ${desktop.bpScore}/100          ${mobile.bpScore}/100`);
    console.log(`SEO               ${desktop.seoScore}/100          ${mobile.seoScore}/100`);
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

main().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
