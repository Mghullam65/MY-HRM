const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png'
};
const HTTP_PORT = 8098;
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, '../public', reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404); res.end('Not Found');
  }
});

async function testMobileFloating() {
  await new Promise(r => server.listen(HTTP_PORT, '127.0.0.1', r));
  const DEBUG_PORT = 9561;
  const p = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, '--user-data-dir=' + path.join(process.env.TEMP, 'test_float2_' + Date.now()), 'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const ver = await new Promise(res => {
    http.get(`http://127.0.0.1:${DEBUG_PORT}/json/version`, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    });
  });
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 1;
  const send = (m, params={}) => new Promise((resolve) => {
    const cur = id++;
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === cur) { ws.off('message', handler); resolve(msg.result); }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const pws = new WebSocket(`ws://127.0.0.1:${DEBUG_PORT}/devtools/page/` + targetId);
  await new Promise(r => pws.on('open', r));
  let pid = 1;
  const psend = (m, params={}) => new Promise(res => {
    const cur = pid++;
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === cur) { pws.off('message', handler); res(msg.result); }
    };
    pws.on('message', handler);
    pws.send(JSON.stringify({ id: cur, method: m, params }));
  });

  await psend('Page.enable');
  await psend('Runtime.enable');
  await psend('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await psend('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#login` });
  await new Promise(r => setTimeout(r, 2000));

  // Perform full login via UI
  await psend('Runtime.evaluate', {
    expression: `(() => {
      Login.setTab('demo');
      Login.selectAccount('hr');
      Login.submit();
    })()`
  });
  await new Promise(r => setTimeout(r, 3000));

  // Get info about floating buttons
  const info = await psend('Runtime.evaluate', {
    expression: `(() => {
      const chatBtn = document.getElementById('chat-floating-launcher');
      const copilotBtn = document.getElementById('hr-copilot-launcher');
      return {
        chatBtn: chatBtn ? {
          rect: chatBtn.getBoundingClientRect(),
          display: window.getComputedStyle(chatBtn).display,
          visible: chatBtn.offsetParent !== null
        } : null,
        copilotBtn: copilotBtn ? {
          rect: copilotBtn.getBoundingClientRect(),
          display: window.getComputedStyle(copilotBtn).display,
          visible: copilotBtn.offsetParent !== null,
          innerText: copilotBtn.innerText.replace(/\\n/g, ' ')
        } : null,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Floating Buttons Info:', JSON.stringify(info.result.value, null, 2));

  // Check if copilot drawer opens
  await psend('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('hr-copilot-launcher');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const copilotDrawer = await psend('Runtime.evaluate', {
    expression: `(() => {
      const d = document.getElementById('hr-copilot-drawer');
      if (!d) return null;
      const rect = d.getBoundingClientRect();
      const style = window.getComputedStyle(d);
      return {
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right },
        opacity: style.opacity,
        active: d.classList.contains('active'),
        overflowRight: (rect.right > window.innerWidth),
        overflowLeft: (rect.left < 0)
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Copilot Drawer Info:', JSON.stringify(copilotDrawer.result.value, null, 2));

  // Now test Teams chat drawer
  await psend('Runtime.evaluate', {
    expression: `(() => {
      if (window.HRAssistant && window.HRAssistant.close) window.HRAssistant.close();
      const chatBtn = document.getElementById('chat-floating-launcher');
      if (chatBtn) chatBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const chatDrawer = await psend('Runtime.evaluate', {
    expression: `(() => {
      const d = document.getElementById('chat-drawer');
      if (!d) return null;
      const rect = d.getBoundingClientRect();
      const style = window.getComputedStyle(d);
      return {
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right },
        open: d.classList.contains('open'),
        overflowRight: (rect.right > window.innerWidth),
        overflowLeft: (rect.left < 0)
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Chat Drawer Info:', JSON.stringify(chatDrawer.result.value, null, 2));

  p.kill();
  server.close();
  process.exit(0);
}
testMobileFloating().catch(e => { console.error(e); process.exit(1); });
