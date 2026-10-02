const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');

async function test() {
  const p = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9555', '--user-data-dir=' + path.join(process.env.TEMP, 'test_mod_' + Date.now()), 'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const ver = await new Promise(res => {
    http.get('http://127.0.0.1:9555/json/version', r => {
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
  const pws = new WebSocket('ws://127.0.0.1:9555/devtools/page/' + targetId);
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
  pws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
    }
    if (msg.method === 'Network.responseReceived') {
      if (msg.params.response.status >= 400) {
        console.log('NET ERROR:', msg.params.response.status, msg.params.response.url);
      }
    }
  });
  await psend('Page.enable');
  await psend('Runtime.enable');
  await psend('Network.enable');

  console.log('Navigating to https://my-hrm-rosy.vercel.app/...');
  await psend('Page.navigate', { url: 'https://my-hrm-rosy.vercel.app/' });
  await new Promise(r => setTimeout(r, 6000));
  const res = await psend('Runtime.evaluate', {
    expression: '(() => { const req = ["Security","API","I18n","DB","LiveNotifications","Auth","HRMWebSocket","Landing","LandingAgent","Trial","App","Dashboard","Employees","Attendance","Leaves","Payroll","Company","Settlement","Performance","Recruitment","Assets","Expenses","Helpdesk","Events","Reports","Administration","Settings","Toast","Modal","Utils","Chat","HRAssistant"]; return req.filter(m => typeof window[m] === "undefined"); })()',
    returnByValue: true
  });
  console.log('MISSING MODULES:', res.result.value);
  p.kill();
  process.exit(0);
}
test();
