const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = 'C:\\Users\\test\\.gemini\\antigravity-ide\\brain\\745437ff-eb16-493c-96a5-c86a612185c8';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const DEBUG_PORT = 9333;
const USER_DATA = path.join(process.env.TEMP, 'hrm_verify_profile_' + Date.now());

async function run() {
  console.log('Launching browser at:', BROWSER_PATH);
  const browserProc = spawn(BROWSER_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  process.on('exit', () => {
    try { browserProc.kill(); } catch (e) {}
  });

  // Wait for debug port to be open
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
        console.log('Debugger connected:', wsUrl);
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket debugger URL');
    browserProc.kill();
    process.exit(1);
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

  // Create a new target / page
  const { targetId } = await sendBrowser('Target.createTarget', { url: 'about:blank' });
  const pageWs = new WebSocket(`ws://127.0.0.1:${DEBUG_PORT}/devtools/page/${targetId}`);
  await new Promise(res => pageWs.on('open', res));

  let pageReqId = 1;
  const consoleLogs = [];
  const networkErrors = [];

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
    }
    if (msg.method === 'Network.responseReceived') {
      if (msg.params.response.status >= 400) {
        networkErrors.push(`${msg.params.response.status} ${msg.params.response.url}`);
      }
    }
  });

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('Network.enable');

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

  console.log('--- Step 1: Navigating to https://my-hrm-rosy.vercel.app/ ---');
  await sendPage('Page.navigate', { url: 'https://my-hrm-rosy.vercel.app/' });
  await new Promise(r => setTimeout(r, 4000));

  console.log('--- Step 2: Verifying Landing Page ---');
  const landingState = await evaluate(`({
    title: document.title,
    landingVisible: document.getElementById('landing-page') ? window.getComputedStyle(document.getElementById('landing-page')).display !== 'none' : false,
    heroHeading: document.querySelector('h1, .hero-title, .hero-heading')?.innerText || 'Not found',
    modulesCount: document.querySelectorAll('.module-card, .landing-module-card, [data-module]').length,
    loginBtnText: document.querySelector('.landing-btn-signin, .module-btn-signin, button[onclick*="showLogin"]')?.innerText || 'Not found',
    windowErrors: window._errors || []
  })`);
  console.log('Landing Page State:', JSON.stringify(landingState, null, 2));

  await screenshot('1_live_landing_page.png');

  console.log('--- Step 3: Clicking Sign In / Login ---');
  const loginOpenResult = await evaluate(`(() => {
    // Try clicking sign in button or calling App.showLogin()
    const signinBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText && el.innerText.toLowerCase().includes('sign in'));
    if (signinBtn) {
      signinBtn.click();
      return { method: 'clicked_button', text: signinBtn.innerText };
    } else if (typeof App !== 'undefined' && App.showLogin) {
      App.showLogin();
      return { method: 'called_App_showLogin' };
    }
    return { method: 'failed_to_find' };
  })()`);
  console.log('Login open trigger result:', loginOpenResult);
  await new Promise(r => setTimeout(r, 1500));

  const loginState = await evaluate(`({
    loginVisible: document.getElementById('login-page') ? window.getComputedStyle(document.getElementById('login-page')).display !== 'none' : false,
    loginTitle: document.querySelector('.split-card-title, .login-title, h2')?.innerText,
    hasUsernameInput: !!document.getElementById('login-username'),
    hasPasswordInput: !!document.getElementById('login-password'),
    hasDemoRoleChips: document.querySelectorAll('.split-account-chip').length,
    activeTab: document.querySelector('.login-nav-tab.active')?.innerText
  })`);
  console.log('Login Page State:', JSON.stringify(loginState, null, 2));

  await screenshot('2_live_login_modal.png');

  console.log('--- Step 4: Testing Login & Navigation to Dashboard ---');
  const loginExecResult = await evaluate(`(() => {
    // Switch to demo tab and select admin or fill credentials
    if (typeof Login !== 'undefined') {
      Login.setTab('demo');
      Login.selectAccount('admin');
      Login.submit();
      return { status: 'submitted_demo_admin' };
    }
    return { status: 'Login_not_defined' };
  })()`);
  console.log('Login execution:', loginExecResult);
  await new Promise(r => setTimeout(r, 3000));

  const dashboardState = await evaluate(`({
    appVisible: document.getElementById('app') ? window.getComputedStyle(document.getElementById('app')).display !== 'none' : false,
    currentUser: typeof Auth !== 'undefined' ? Auth.user : null,
    currentEmployee: typeof Auth !== 'undefined' ? (Auth.employee ? { name: Auth.employee.fullName, role: Auth.employee.role, title: Auth.employee.designation } : null) : null,
    currentModule: typeof App !== 'undefined' ? App.currentModule : null,
    statCards: Array.from(document.querySelectorAll('.stat-card, .metric-card, .dashboard-stat')).map(el => el.innerText.replace(/\\n/g, ' ')),
    sidebarNavItems: Array.from(document.querySelectorAll('.sidebar-nav-item, .nav-item, .menu-item')).map(el => el.innerText.trim()).filter(Boolean)
  })`);
  console.log('Dashboard State:', JSON.stringify(dashboardState, null, 2));

  await screenshot('3_live_dashboard.png');

  console.log('--- Step 5: Test Navigation to Another Module (e.g. Employees) ---');
  const navResult = await evaluate(`(() => {
    if (typeof App !== 'undefined' && App.navigate) {
      App.navigate('employees');
      return { navigatedTo: App.currentModule };
    }
    return { error: 'App.navigate not available' };
  })()`);
  console.log('Navigation Result:', navResult);
  await new Promise(r => setTimeout(r, 2000));

  const employeesState = await evaluate(`({
    currentModule: typeof App !== 'undefined' ? App.currentModule : null,
    pageTitle: document.querySelector('h1, .page-title, .module-header-title')?.innerText,
    employeeRowCount: document.querySelectorAll('tr, .employee-card, .grid-card').length
  })`);
  console.log('Employees Module State:', JSON.stringify(employeesState, null, 2));

  await screenshot('4_live_employees_module.png');

  console.log('--- Summary Audit ---');
  console.log('Console Logs count:', consoleLogs.length);
  console.log('Sample Console Logs:', consoleLogs.slice(0, 10));
  console.log('Network 4xx/5xx Errors:', networkErrors);

  // Output test result JSON file
  const report = {
    url: 'https://my-hrm-rosy.vercel.app/',
    timestamp: new Date().toISOString(),
    landingPage: landingState,
    loginPage: loginState,
    dashboardPage: dashboardState,
    employeesPage: employeesState,
    networkErrors,
    consoleLogsCount: consoleLogs.length
  };
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live_site_verification_report.json'), JSON.stringify(report, null, 2));

  console.log('Verification completed successfully!');
  browserProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
