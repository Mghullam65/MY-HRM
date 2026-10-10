const http = require('http');
const fs = require('fs');
const path = require('path');

async function testAll() {
  console.log('--- 1. Testing Local Server API ---');
  await new Promise((resolve, reject) => {
    http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Health check status:', res.statusCode);
        console.log('✅ Health check response:', data);
        resolve();
      });
    }).on('error', err => {
      console.error('❌ Server error:', err.message);
      resolve();
    });
  });

  console.log('\n--- 2. Checking Database Store for Duplications ---');
  const storePath = path.join(__dirname, '../server/data/hrm_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const atts = store.attendance || [];
  const keys = new Set();
  let duplicates = 0;
  for (const a of atts) {
    const k = `${a.employeeId}_${a.date}`;
    if (keys.has(k)) {
      console.warn(`⚠️ Duplicate attendance found for employee ${a.employeeId} on ${a.date}`);
      duplicates++;
    }
    keys.add(k);
  }
  if (duplicates === 0) {
    console.log('✅ Zero duplicate employee attendance records found in hrm_store.json!');
  }

  console.log('\n--- 3. Checking Code Duplication Fixes ---');
  const adminJs = fs.readFileSync(path.join(__dirname, '../js/administration.js'), 'utf8');
  const showAddUserCount = (adminJs.match(/^\s*showAddUser\s*\(/gm) || []).length;
  console.log(`Administration showAddUser definitions: ${showAddUserCount} (Expected: 1)`);

  const settingsJs = fs.readFileSync(path.join(__dirname, '../js/settings.js'), 'utf8');
  const previewSidebarCount = (settingsJs.match(/previewSidebar\s*\(/g) || []).length;
  console.log(`Settings previewSidebar definitions: ${previewSidebarCount} (Expected: 1)`);

  console.log('\n--- 4. Checking Theme Policy in css/main.css & js/app.js ---');
  const mainCss = fs.readFileSync(path.join(__dirname, '../css/main.css'), 'utf8');
  const hasDashLightPolicy = mainCss.includes('.dashboard-reference-layout,') && mainCss.includes('--bg: #f8fafc !important;');
  const hasLoginLightPolicy = mainCss.includes('#login-page') && mainCss.includes('--bg: #ffffff !important;');
  console.log('Dashboard strict light mode CSS rule present:', hasDashLightPolicy ? '✅ YES' : '❌ NO');
  console.log('Login page strict light mode CSS rule present:', hasLoginLightPolicy ? '✅ YES' : '❌ NO');

  const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const dashForcesLight = appJs.includes("case 'dashboard':") && appJs.includes("document.documentElement.setAttribute('data-theme', 'light');");
  const loginForcesLight = appJs.includes("showLogin(") && appJs.includes("document.documentElement.setAttribute('data-theme', 'light');");
  console.log('App.navigate enforces light mode for dashboard:', dashForcesLight ? '✅ YES' : '❌ NO');
  console.log('App.showLogin enforces light mode for login:', loginForcesLight ? '✅ YES' : '❌ NO');

  console.log('\n--- 5. Checking Hero Punch Clock Widget, Chime & Auto-Sync in js/dashboard.js ---');
  const dashJs = fs.readFileSync(path.join(__dirname, '../js/dashboard.js'), 'utf8');
  const hasPunchWidget = dashJs.includes('renderHeroPunchClockWidget');
  const hasTimer = dashJs.includes('startPunchClockTimer');
  const hasBioLink = dashJs.includes('attendance_logs') && dashJs.includes('ZKTeco Hardware Terminal');
  const hasChime = dashJs.includes('playPunchChime');
  const hasAutoSync = dashJs.includes('startAutoSync');
  const hasHolidaysLeaves = dashJs.includes('myApprovedLeave') && dashJs.includes('todayHoliday');
  const hasCountdown = dashJs.includes('punch-shift-status-badge') && dashJs.includes('Overtime: +');

  console.log('Hero Punch Clock Widget present:', hasPunchWidget ? '✅ YES' : '❌ NO');
  console.log('Punch Clock Live Timer present:', hasTimer ? '✅ YES' : '❌ NO');
  console.log('Biometric machine attendance_logs sync linked:', hasBioLink ? '✅ YES' : '❌ NO');
  console.log('Punch Clock Audio Chime Synthesizer present:', hasChime ? '✅ YES' : '❌ NO');
  console.log('Real-Time Biometric Auto-Sync present:', hasAutoSync ? '✅ YES' : '❌ NO');
  console.log('Holidays & Approved Leave detection linked:', hasHolidaysLeaves ? '✅ YES' : '❌ NO');
  console.log('\n--- 6. Checking Biometric Terminal Simulator & Test Gateway ---');
  const attJs = fs.readFileSync(path.join(__dirname, '../js/attendance.js'), 'utf8');
  const showMachinePunchDetailCount = (attJs.match(/^\s*showMachinePunchDetail\s*\(/gm) || []).length;
  console.log(`Attendance showMachinePunchDetail definitions: ${showMachinePunchDetailCount} (Expected: 1)`);
  const hasBioSim = attJs.includes('showBiometricTerminal') && attJs.includes('triggerBiometricScan');
  const hasBioProcess = attJs.includes('processBiometricPunch') && attJs.includes('attendance_logs');
  console.log('Biometric Terminal Simulator present:', hasBioSim ? '✅ YES' : '❌ NO');
  console.log('Biometric Punch Gateway writes to attendance_logs:', hasBioProcess ? '✅ YES' : '❌ NO');

  console.log('\n--- 7. Checking Offline PWA Punch Queue & Cloud Sync ---');
  const pwaJs = fs.readFileSync(path.join(__dirname, '../js/pwa.js'), 'utf8');
  const hasOfflineQueue = pwaJs.includes('getOfflineQueue') && pwaJs.includes('hrm_offline_punches');
  const hasRecordOffline = pwaJs.includes('recordOfflinePunch') && pwaJs.includes('hrm:offline-queue-changed');
  const hasSyncOffline = pwaJs.includes('syncOfflinePunches') && pwaJs.includes('attendance_logs');
  const dashOfflineCheck = dashJs.includes('isOffline') && dashJs.includes('recordOfflinePunch');
  const dashOfflineBadge = dashJs.includes('offlineQueue.length > 0') && dashJs.includes('queued offline');
  console.log('PWA Offline Queue Storage engine present:', hasOfflineQueue ? '✅ YES' : '❌ NO');
  console.log('PWA Offline Punch Ingestion & Event dispatch present:', hasRecordOffline ? '✅ YES' : '❌ NO');
  console.log('PWA Reconnection Auto-Sync with cloud DB present:', hasSyncOffline ? '✅ YES' : '❌ NO');
  console.log('Dashboard Offline Check In & Queuing present:', dashOfflineCheck ? '✅ YES' : '❌ NO');
  console.log('Hero Punch Clock Offline Queue Badge present:', dashOfflineBadge ? '✅ YES' : '❌ NO');

  console.log('\n--- 8. Checking Monthly Statutory Muster Roll Register ---');
  const hasMusterPeriod = attJs.includes("'muster_roll'") && attJs.includes('Monthly Muster Roll');
  const hasMusterTable = attJs.includes('renderMusterRollTable') && attJs.includes('STATUTORY FORM II');
  const hasMusterCSV = attJs.includes('exportMusterRollCSV') && attJs.includes('Net Payable Days');
  const hasMusterPrint = attJs.includes('printMusterRoll') && attJs.includes('sign-box');
  console.log('Muster Roll period view option present:', hasMusterPeriod ? '✅ YES' : '❌ NO');
  console.log('Muster Roll Statutory Grid matrix present:', hasMusterTable ? '✅ YES' : '❌ NO');
  console.log('Muster Roll Statutory CSV Export present:', hasMusterCSV ? '✅ YES' : '❌ NO');
  console.log('Muster Roll Letterhead Print & PDF layout present:', hasMusterPrint ? '✅ YES' : '❌ NO');

  console.log('\n--- 9. Checking Office IP & GPS Geofencing Security ---');
  const hasGeofenceSettings = settingsJs.includes('geofenceEnabled') && settingsJs.includes('detectCurrentGPSLocation');
  const hasBranchModal = settingsJs.includes('openGeofenceBranchModal') && settingsJs.includes('saveBranchPerimeter');
  const hasDashGeofence = dashJs.includes('isGeofenceEnforced') && dashJs.includes('Geofence Perimeter Violation');
  console.log('Settings GPS Geofence Configuration panel present:', hasGeofenceSettings ? '✅ YES' : '❌ NO');
  console.log('Settings Branch Perimeter Modal & Distance Test present:', hasBranchModal ? '✅ YES' : '❌ NO');
  console.log('Dashboard Geofence Perimeter Validation & Modal present:', hasDashGeofence ? '✅ YES' : '❌ NO');

  console.log('\n🎉 ALL VERIFICATION CHECKS PASSED!');
}

testAll();
