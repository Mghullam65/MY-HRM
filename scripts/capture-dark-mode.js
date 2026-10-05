const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');
const zlib = require('zlib');

const HTTP_PORT = 8097;
const DEBUG_PORT = 9576;

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

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, '../public', reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const isCompressible = ['.html', '.js', '.css', '.json', '.svg'].includes(ext);
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (isCompressible && acceptEncoding.includes('gzip')) {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain', 'Content-Encoding': 'gzip' });
      fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(HTTP_PORT, '127.0.0.1', async () => {
  const tmpDir = path.join(os.tmpdir(), `hrm-screen-dark-${Date.now()}`);
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
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html#landing` });
  await new Promise(r => setTimeout(r, 2500));

  // Explicitly apply Dark mode
  await send('Runtime.evaluate', {
    expression: `(function() {
      if (typeof Landing !== 'undefined' && Landing.applyTheme) {
        Landing.applyTheme('dark');
      }
    })()`,
    awaitPromise: true
  });

  await new Promise(r => setTimeout(r, 1000));

  // Capture screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = path.join('C:', 'Users', 'test', '.gemini', 'antigravity-ide', 'brain', '745437ff-eb16-493c-96a5-c86a612185c8', 'dark_mode_navbar_hero.png');
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`[SCREENSHOT DARK] Saved to ${outPath}`);

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
});
