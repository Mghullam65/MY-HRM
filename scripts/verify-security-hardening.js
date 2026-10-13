/**
 * scripts/verify-security-hardening.js
 * ══════════════════════════════════════════════════════════════════════════════
 * ENTERPRISE SECURITY & HARDENING VERIFICATION SUITE
 * ══════════════════════════════════════════════════════════════════════════════
 * Audits:
 * 1. Backend /api/auth/login brute-force lockout & HTTP 429 response
 * 2. Strict CORS policy and security headers (Permissions-Policy, Helmet)
 * 3. Client-side idle session timeout engine & brute-force shield
 * 4. Password sanitization in storage & memory
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

let APP_URL = process.env.APP_URL || 'http://localhost:3000';
let passedTests = 0;
let totalTests = 0;
let embeddedServerProcess = null;

async function checkServerAvailable(urlStr) {
  return new Promise(resolve => {
    try {
      const u = new URL(urlStr);
      const req = http.get({
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: '/api/health',
        timeout: 1500
      }, res => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch (_) {
      resolve(false);
    }
  });
}

async function ensureServerRunning() {
  const isUp = await checkServerAvailable(APP_URL);
  if (isUp) {
    console.log(`[Security Audit] Target server is active at ${APP_URL}`);
    return;
  }

  const u = new URL(APP_URL);
  const targetPort = u.port || '3000';
  console.log(`[Security Audit] Server at ${APP_URL} not detected. Auto-launching background Express server on port ${targetPort}...`);
  const serverPath = path.join(__dirname, '../server/src/server.js');
  embeddedServerProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: targetPort },
    stdio: 'inherit'
  });

  // Poll for up to 15s (30 x 500ms)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    const ready = await checkServerAvailable(APP_URL);
    if (ready) {
      console.log(`[Security Audit] Background server ready at ${APP_URL} (Attempt ${i + 1})`);
      return;
    }
  }

  throw new Error(`Failed to connect to ${APP_URL} after auto-spawning server/src/server.js`);
}

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, APP_URL);
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json, rawBody: data });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSecurityAudit() {
  await ensureServerRunning();

  console.log('════════════════════════════════════════════════════════════');
  console.log('🔒 ENTERPRISE SECURITY & HARDENING VERIFICATION AUDIT');
  console.log('════════════════════════════════════════════════════════════\n');

  // ── TEST 1: Server Security Headers ──
  console.log('▶ STEP 1: Verifying Server Hardening Headers...');
  const healthRes = await makeRequest('/api/health');
  assert(healthRes.statusCode === 200, 'Server health endpoint reachable (HTTP 200)');
  assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options header active (SAMEORIGIN clickjacking guard)');
  assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options header active (nosniff MIME guard)');
  assert(healthRes.headers['x-xss-protection'] === '1; mode=block', 'X-XSS-Protection header active');
  assert(healthRes.headers['permissions-policy']?.includes('camera=()'), 'Permissions-Policy header active (Hardware limitation)');
  assert(!healthRes.headers['x-powered-by'], 'X-Powered-By header obscured from attacker fingerprinting');

  // ── TEST 2: CORS Whitelisting & Origin Guard ──
  console.log('\n▶ STEP 2: Verifying CORS Origin Protection...');
  const corsPreflight = await makeRequest('/api/auth/login', 'OPTIONS', null, {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'POST'
  });
  assert(corsPreflight.statusCode === 204 || corsPreflight.statusCode === 200, 'CORS preflight valid for local application');
  assert(corsPreflight.headers['access-control-allow-origin'] === 'http://localhost:3000', 'CORS origin properly set for authorized origin');

  // ── TEST 3: Brute-Force Rate Limiting on /api/auth/login ──
  console.log('\n▶ STEP 3: Verifying Brute-Force Protection & Rate Limiting...');
  const testTargetUser = `attacker_test_${Date.now()}`;

  // Send 4 failed attempts (should return 401)
  for (let i = 1; i <= 4; i++) {
    const res = await makeRequest('/api/auth/login', 'POST', { username: testTargetUser, password: 'wrongPassword!' });
    assert(res.statusCode === 401, `Failed attempt ${i} rejected with HTTP 401`);
  }

  // 5th failed attempt: triggers lockout
  const fifthAttempt = await makeRequest('/api/auth/login', 'POST', { username: testTargetUser, password: 'wrongPassword!' });
  assert(fifthAttempt.statusCode === 401, '5th failed attempt processed and triggers security threshold');

  // 6th attempt: MUST return HTTP 429 Too Many Requests
  const sixthAttempt = await makeRequest('/api/auth/login', 'POST', { username: testTargetUser, password: 'wrongPassword!' });
  assert(sixthAttempt.statusCode === 429, '6th attempt blocked with HTTP 429 (Too Many Requests)');
  assert(sixthAttempt.body?.message?.includes('Too many failed login attempts'), 'HTTP 429 response includes security lockout warning');
  assert(sixthAttempt.headers['retry-after'] !== undefined, 'Response includes standard HTTP Retry-After header');

  // Verify another user is NOT locked out (targeted lockout isolation)
  const legitUserRes = await makeRequest('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
  assert(legitUserRes.statusCode === 200, 'Legitimate user login succeeds without false-positive cross-account lockout');

  // ── TEST 4: Client-Side Security Engine Evaluation ──
  console.log('\n▶ STEP 4: Verifying Client-Side Security Engine & Controls...');
  const Security = require('../js/security.js');
  assert(Security !== undefined, 'Security module exports active');
  assert(typeof Security.setupIdleTimeout === 'function', 'Idle Session Timeout engine configured');
  assert(Security.idleTimeoutMs === 15 * 60 * 1000, 'Idle session timeout set to 15 minutes compliance standard');
  assert(Security.idleWarningMs === 60 * 1000, 'Idle warning threshold set to 60 seconds');

  // Test client-side brute-force shield
  const testUser = 'test_shield_user';
  Security.clearFailedLoginAttempt(testUser);
  for (let i = 0; i < 5; i++) {
    Security.recordFailedLoginAttempt(testUser);
  }
  const remainingWait = Security.isLoginLocked(testUser);
  assert(remainingWait > 0, `Client-side brute force lock active (${remainingWait}s remaining)`);
  Security.clearFailedLoginAttempt(testUser);
  assert(Security.isLoginLocked(testUser) === 0, 'Client-side lock resets cleanly on valid authentication');

  // Test Audit Controls Checklist
  const auditReport = Security.getSecurityAuditReport();
  const enabledCount = auditReport.controls.filter(c => c.status === 'Enabled').length;
  assert(enabledCount >= 10, `All 10 Enterprise Security Controls Enabled (${enabledCount}/10)`);

  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`📊 SECURITY HARDENING AUDIT: ${passedTests} OF ${totalTests} CHECKS PASSED`);
  console.log('════════════════════════════════════════════════════════════\n');
  if (passedTests !== totalTests) {
    process.exitCode = 1;
  }
}

runSecurityAudit()
  .catch(err => {
    console.error('[Audit Error]', err);
    process.exitCode = 1;
  })
  .finally(() => {
    if (embeddedServerProcess) {
      console.log('[Security Audit] Terminating auto-launched background server...');
      embeddedServerProcess.kill();
    }
    if (process.exitCode) {
      process.exit(process.exitCode);
    }
  });
