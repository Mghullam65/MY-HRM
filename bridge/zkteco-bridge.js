/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║        HRM PRO — ZKTeco Biometric Bridge Server             ║
 * ║        Supports: ZKTeco SpeedFace / SF / F-series           ║
 * ║        Protocol: TCP port 4370 (node-zklib pull mode)       ║
 * ║        Also supports: ADMS HTTP push mode (port 8877)       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * USAGE:
 *   node bridge/zkteco-bridge.js
 *
 * CONFIGURE:
 *   Edit DEVICE_CONFIG below with your machine's IP and port.
 *   Then open HRM → Attendance → "Sync Biometric Hardware Terminals"
 */

const express = require('express');
const cors    = require('cors');
const ZKLib   = require('node-zklib');
const http    = require('http');
const fs      = require('fs');
const path    = require('path');

// ──────────────────────────────────────────────
// 🔧 DEVICE CONFIGURATION  ← Edit this section
// ──────────────────────────────────────────────
const DEVICE_CONFIG = {
  ip:      process.env.ZK_IP   || '192.168.1.201', // ← Your ZKTeco device IP
  port:    Number(process.env.ZK_PORT) || 4370,    // ZKTeco default TCP port
  timeout: 5000,
  inport:  5200,
};

// Bridge HTTP server port (HRM frontend calls this)
const BRIDGE_PORT = process.env.BRIDGE_PORT || 8877;

// ──────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Persistent punch log (survives restarts)
const LOG_FILE = path.join(__dirname, 'punch_log.json');
let punchLog = [];
if (fs.existsSync(LOG_FILE)) {
  try { punchLog = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch(e) { punchLog = []; }
}
function savePunchLog() {
  fs.writeFileSync(LOG_FILE, JSON.stringify(punchLog, null, 2));
}

// ──────────────────────────────────────────────
// ZKTeco status tracking
// ──────────────────────────────────────────────
let deviceStatus = 'offline';
let lastSyncTime = null;
let lastError    = null;

function pad(n) { return String(n).padStart(2, '0'); }

// ──────────────────────────────────────────────
// ZKTeco TCP Pull (port 4370)
// ──────────────────────────────────────────────
async function pullFromDevice() {
  const zkInstance = new ZKLib(
    DEVICE_CONFIG.ip,
    DEVICE_CONFIG.port,
    DEVICE_CONFIG.timeout,
    DEVICE_CONFIG.inport
  );

  try {
    console.log(`[ZKTeco] Connecting to ${DEVICE_CONFIG.ip}:${DEVICE_CONFIG.port}...`);
    await zkInstance.createSocket();
    deviceStatus = 'online';

    const { data: attendanceLogs } = await zkInstance.getAttendances();
    console.log(`[ZKTeco] Retrieved ${attendanceLogs.length} records from device`);

    // Map ZKTeco inOutStatus → HRM punch type
    const statusMap = { 0:'check-in', 1:'check-out', 2:'break-out', 3:'break-in', 4:'ot-in', 5:'ot-out' };
    // Map ZKTeco verifyType → readable label
    const verifyMap = {
      0:'Password', 1:'Fingerprint', 2:'Card (RFID)', 3:'Password',
      4:'Fingerprint + Password', 10:'Face Recognition', 11:'Palm',
      15:'Face + Fingerprint'
    };

    let newCount = 0;
    for (const log of attendanceLogs) {
      const userId = String(log.deviceUserId);
      const dt     = new Date(log.attTime);
      const iso    = dt.toISOString();
      const exists = punchLog.some(p => p.user_id === userId && p.timestamp === iso);
      if (exists) continue;

      punchLog.push({
        user_id:     userId,
        timestamp:   iso,
        date:        iso.slice(0, 10),
        time:        `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
        status:      statusMap[log.inOutStatus] || 'check-in',
        verify_mode: verifyMap[log.verifyType]  || 'Fingerprint',
        device_name: `ZKTeco (${DEVICE_CONFIG.ip})`,
        device_id:   DEVICE_CONFIG.ip,
        source:      'tcp_pull'
      });
      newCount++;
    }

    if (newCount > 0) savePunchLog();
    lastSyncTime = new Date().toISOString();
    await zkInstance.disconnect();
    console.log(`[ZKTeco] Sync done — ${newCount} new punches (total: ${punchLog.length})`);
    return { success: true, newPunches: newCount, total: punchLog.length };

  } catch (err) {
    deviceStatus = 'error';
    lastError    = err.message;
    console.error(`[ZKTeco] Pull error: ${err.message}`);
    try { await zkInstance.disconnect(); } catch(_) {}
    return { success: false, error: err.message };
  }
}

// ──────────────────────────────────────────────
// ADMS HTTP Push Receiver
// On your ZKTeco device: Menu → Comm → ADMS → Server Address = YOUR_PC_IP
// Device will push to: http://YOUR_PC_IP:8877/iclock/cdata
// ──────────────────────────────────────────────
app.get('/iclock/cdata', (req, res) => {
  const sn = req.query.SN || 'UNKNOWN';
  console.log(`[ADMS] Device handshake — SN: ${sn}`);
  res.set('Content-Type', 'text/plain');
  res.send([
    `GET OPTION FROM: ${sn}`,
    `ATTLOGStamp=9999`,
    `OPERLOGStamp=9999`,
    `ATTPHOTOStamp=9999`,
    `ErrorDelay=30`,
    `Delay=10`,
    `TransTimes=00:00;14:05`,
    `TransInterval=1`,
    `TransFlag=TransData AttLog\tOpLog`,
    `TimeZone=5`,
    `Realtime=1`,
    `Encrypt=None`
  ].join('\r\n'));
});

app.post('/iclock/cdata', (req, res) => {
  const body = req.body;
  const rawLines = (body.ATTLOG || body.attlog || '');
  const lines    = rawLines.split('\n').filter(Boolean);

  const statusMap = { 0:'check-in', 1:'check-out', 2:'break-out', 3:'break-in', 4:'ot-in', 5:'ot-out' };
  const verifyMap = { 0:'Password', 1:'Fingerprint', 2:'Card (RFID)', 10:'Face Recognition', 15:'Face + Fingerprint' };

  let added = 0;
  for (const line of lines) {
    // ZKTeco ATTLOG format: PIN\tDateTime\tStatus\tVerify\tWorkCode\tReserved
    const parts = line.trim().split('\t');
    if (parts.length < 2) continue;

    const userId = parts[0];
    const dt     = new Date(parts[1]);
    const iso    = dt.toISOString();
    const status = parseInt(parts[2]) || 0;
    const verify = parseInt(parts[3]) || 1;

    const exists = punchLog.some(p => p.user_id === userId && p.timestamp === iso);
    if (exists) continue;

    punchLog.push({
      user_id:     userId,
      timestamp:   iso,
      date:        iso.slice(0, 10),
      time:        `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
      status:      statusMap[status] || 'check-in',
      verify_mode: verifyMap[verify] || 'Fingerprint',
      device_name: `ZKTeco ADMS (${req.ip})`,
      device_id:   req.ip,
      source:      'adms_push'
    });
    added++;
    console.log(`[ADMS] Punch: User ${userId} @ ${parts[1]} (${statusMap[status]})`);
  }

  if (added > 0) {
    savePunchLog();
    deviceStatus = 'online';
    lastSyncTime = new Date().toISOString();
  }

  // ZKTeco requires this exact plain-text OK response
  res.set('Content-Type', 'text/plain');
  res.send('OK');
});

// ──────────────────────────────────────────────
// HRM API endpoints
// ──────────────────────────────────────────────

// ★ This is the endpoint attendance.js → syncBiometricHardware() calls
app.get('/api/attendance/biometric-sync', async (req, res) => {
  // Pull fresh data from device first, then return all punches
  const pullResult = await pullFromDevice();

  res.json({
    success:      true,
    synced_at:    lastSyncTime || new Date().toISOString(),
    pull:         pullResult,
    buffer: punchLog.map(p => ({
      user_id:     p.user_id,
      timestamp:   p.timestamp,
      status:      p.status,
      verify_mode: p.verify_mode,
      device_name: p.device_name,
      device_id:   p.device_id
    })),
    devices: {
      'zk-head-office': {
        ip:        DEVICE_CONFIG.ip,
        status:    deviceStatus,
        model:     'ZKTeco SpeedFace/SF-series',
        last_sync: lastSyncTime
      }
    }
  });
});

// Force sync without waiting for HRM
app.post('/api/attendance/sync-now', async (req, res) => {
  res.json(await pullFromDevice());
});

// Get cached punches (with optional filters)
app.get('/api/attendance/punches', (req, res) => {
  let data = [...punchLog];
  if (req.query.date)    data = data.filter(p => p.date    === req.query.date);
  if (req.query.user_id) data = data.filter(p => p.user_id === req.query.user_id);
  res.json({ count: data.length, data });
});

// Device status
app.get('/api/device/status', (req, res) => {
  res.json({ ip: DEVICE_CONFIG.ip, port: DEVICE_CONFIG.port,
    status: deviceStatus, last_sync: lastSyncTime, last_error: lastError,
    cached_punches: punchLog.length });
});

// Clear log (admin)
app.delete('/api/attendance/punches', (req, res) => {
  punchLog = []; savePunchLog();
  res.json({ success: true });
});

app.get('/health', (_, res) => res.json({ status:'ok', uptime: process.uptime() }));

// ──────────────────────────────────────────────
// Start
// ──────────────────────────────────────────────
app.listen(BRIDGE_PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║      ZKTeco ↔ HRM PRO Biometric Bridge v1.0         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Bridge port     : http://localhost:${BRIDGE_PORT}`);
  console.log(`  ZKTeco device   : ${DEVICE_CONFIG.ip}:${DEVICE_CONFIG.port}`);
  console.log(`  HRM sync URL    : http://localhost:${BRIDGE_PORT}/api/attendance/biometric-sync`);
  console.log(`  ADMS push URL   : http://YOUR_PUBLIC_IP:${BRIDGE_PORT}/iclock/cdata`);
  console.log(`  Cached punches  : ${punchLog.length}`);
  console.log('══════════════════════════════════════════════════════\n');

  // Auto-pull on startup
  pullFromDevice().then(r => {
    if (r.success) console.log(`[Startup] Sync OK — ${r.newPunches} new punches`);
    else           console.log(`[Startup] Device offline — ADMS push mode ready`);
  });
});
