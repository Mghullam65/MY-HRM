const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png'
};
const HTTP_PORT = 8097;
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

async function findUndefined() {
  await new Promise(r => server.listen(HTTP_PORT, '127.0.0.1', r));
  const port = 9559;
  const p = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(process.env.TEMP, 'test_undef_' + Date.now())}`, 'about:blank'
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
  const pws = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
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
  await psend('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#login` });
  await new Promise(r => setTimeout(r, 2000));

  await psend('Runtime.evaluate', {
    expression: `(() => {
      Login.setTab('demo');
      Login.selectAccount('hr');
      Login.submit();
    })()`
  });
  await new Promise(r => setTimeout(r, 2500));

  for (const mod of ['leaves', 'recruitment']) {
    console.log(`Auditing module #${mod}...`);
    await psend('Runtime.evaluate', { expression: `window.location.hash = '#${mod}';` });
    await new Promise(r => setTimeout(r, 2000));

    const dbData = await psend('Runtime.evaluate', {
      expression: `(() => {
        if ('${mod}' === 'leaves') return DB.get('leave_requests');
        if ('${mod}' === 'recruitment') return DB.get('recruitment');
        return null;
      })()`,
      returnByValue: true
    });
    console.log(`DB DATA for #${mod}:`, JSON.stringify(dbData.result.value, null, 2));

    const hits = await psend('Runtime.evaluate', {
      expression: `(() => {
        try {
          if (!document.body) return [];
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
          const matches = [];
          let node = walker.nextNode();
          while (node) {
            const parent = node.parentElement;
            if (parent && parent.tagName !== 'SCRIPT' && /\\bundefined\\b/i.test(node.nodeValue)) {
              const grandParent = parent ? parent.parentElement : null;
              const tr = grandParent ? grandParent.closest('tr') : null;
              matches.push({
                text: node.nodeValue.trim(),
                parentTag: parent.tagName,
                parentClass: parent.className,
                grandParentTag: grandParent ? grandParent.tagName : '',
                grandParentClass: grandParent ? grandParent.className : '',
                html: tr ? tr.outerHTML.substring(0, 400) : (grandParent ? grandParent.outerHTML.substring(0, 300) : parent.outerHTML)
              });
            }
            node = walker.nextNode();
          }
          return matches;
        } catch(e) {
          return { error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    console.log(`Hits for #${mod}:`, JSON.stringify(hits.result.value, null, 2));
  }

  p.kill();
  server.close();
  process.exit(0);
}
findUndefined().catch(e => { console.error(e); process.exit(1); });
