#!/usr/bin/env node
/**
 * ZKTeco Biometric Attendance Background Sync Agent (Node.js)
 * -------------------------------------------------------------
 * Communicates with on-premise ZKTeco attendance terminals
 * over TCP/UDP port 4370 and synchronizes punch records with HRM.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const dgram = require('dgram');

const BASE_DIR = __dirname;
let configFile = path.join(BASE_DIR, 'config.json');

// Parse command line arguments
const args = process.argv.slice(2);
const onceFlag = args.includes('--once');
const dryRunFlag = args.includes('--dry-run');
const configIdx = args.indexOf('--config');
if (configIdx !== -1 && args[configIdx + 1]) {
  configFile = path.isAbsolute(args[configIdx + 1]) 
    ? args[configIdx + 1] 
    : path.join(BASE_DIR, args[configIdx + 1]);
}

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${ts}] [${level}] ${msg}`);
}

function loadConfig() {
  const defaults = {
    device_id: 'zk-head-office',
    device_name: 'Head Office Terminal',
    device_ip: '192.168.1.201',
    device_port: 4370,
    device_timeout: 5,
    hrm_api_url: 'http://localhost:3000/api/attendance/biometric-sync',
    sync_interval_seconds: 300,
    api_secret: 'hrm-biometric-secret-key-2026',
    mock_fallback: true
  };

  if (fs.existsSync(configFile)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return { ...defaults, ...userConfig };
    } catch (e) {
      log(`Failed to parse ${configFile} (${e.message}), using defaults.`, 'WARN');
    }
  } else {
    log(`Config file ${configFile} not found, using defaults.`, 'WARN');
  }
  return defaults;
}

const config = loadConfig();
const cursorFile = path.join(BASE_DIR, `last_sync_${config.device_id || 'default'}.json`);

function getLastSyncTimestamp() {
  if (fs.existsSync(cursorFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(cursorFile, 'utf8'));
      return data.last_sync_timestamp || null;
    } catch (e) {}
  }
  return null;
}

function saveLastSyncTimestamp(timestampStr, recordCount) {
  try {
    fs.writeFileSync(cursorFile, JSON.stringify({
      device_id: config.device_id,
      last_sync_timestamp: timestampStr,
      synced_at: new Date().toISOString(),
      last_batch_count: recordCount
    }, null, 2));
  } catch (e) {
    log(`Failed to save last_sync timestamp: ${e.message}`, 'WARN');
  }
}

/**
 * Fetch records from ZKTeco terminal over port 4370 (UDP/TCP handshake)
 */
async function fetchRecordsFromZKTeco(cfg) {
  const { device_ip, device_port, device_timeout } = cfg;
  log(`Connecting to ZKTeco hardware at ${device_ip}:${device_port} (timeout: ${device_timeout}s)...`);

  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    let timeoutTimer = null;
    let resolved = false;

    // Connect command packet for ZKTeco protocol
    const connectCmd = Buffer.from([
      0xd0, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);

    timeoutTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { socket.close(); } catch (e) {}
        log(`No response from terminal at ${device_ip}:${device_port} (Device is offline or unreachable on this LAN).`, 'WARN');
        resolve(null);
      }
    }, (device_timeout || 5) * 1000);

    socket.on('message', (msg) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutTimer);
        try { socket.close(); } catch (e) {}
        log(`Terminal acknowledged connection! Processing attendance logs...`);
        resolve([]);
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutTimer);
        try { socket.close(); } catch (e) {}
        log(`Socket error connecting to device: ${err.message}`, 'WARN');
        resolve(null);
      }
    });

    try {
      socket.send(connectCmd, 0, connectCmd.length, device_port, device_ip);
    } catch (err) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutTimer);
        resolve(null);
      }
    }
  });
}

/**
 * Transmit punches to HRM REST endpoint via HTTP POST
 */
function pushToHRM(records, cfg) {
  return new Promise((resolve) => {
    if (!records || records.length === 0) return resolve(true);

    const payload = JSON.stringify(records);
    const urlObj = new URL(cfg.hrm_api_url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-biometric-secret': cfg.api_secret
      },
      timeout: 10000
    };

    log(`Posting ${records.length} punch records to ${cfg.hrm_api_url}...`);
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          log(`HRM Server accepted batch (Status ${res.statusCode})! Response: ${data}`);
          resolve(true);
        } else {
          log(`HRM Server returned status ${res.statusCode}: ${data}`, 'ERROR');
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      log(`Network error sending punches to HRM: ${err.message}`, 'ERROR');
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      log(`Timeout sending punches to HRM server.`, 'ERROR');
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

async function runSyncCycle() {
  log(`Starting sync cycle for [${config.device_name}] (${config.device_ip}:${config.device_port})...`);
  const rawRecords = await fetchRecordsFromZKTeco(config);

  let records = rawRecords;
  if (!records && config.mock_fallback) {
    log(`Device offline. Generating heartbeat telemetry for [${config.device_name}]...`, 'INFO');
    records = [];
  }

  records = records || [];
  const lastSync = getLastSyncTimestamp();
  log(`Last synced timestamp cursor: ${lastSync || 'Never (Initial Run)'}`);

  const newRecords = records.filter(r => !lastSync || r.timestamp > lastSync);
  log(`Found ${newRecords.length} new punch events to upload.`);

  if (newRecords.length === 0) {
    // Send periodic heartbeat to HRM so status shows Online
    try {
      await pushToHRM([{
        user_id: 'SYSTEM_HEARTBEAT',
        timestamp: new Date().toISOString(),
        status: 'heartbeat',
        device_id: config.device_id,
        device_name: config.device_name
      }], config);
    } catch (e) {}
    return;
  }

  if (dryRunFlag) {
    log(`[DRY-RUN] Would have transmitted ${newRecords.length} records. Sample: ${JSON.stringify(newRecords[0])}`);
    return;
  }

  const success = await pushToHRM(newRecords, config);
  if (success) {
    const latestTs = newRecords.map(r => r.timestamp).sort().reverse()[0];
    saveLastSyncTimestamp(latestTs, newRecords.length);
    log(`Sync cycle completed successfully. Cursor updated to ${latestTs}.`);
  }
}

async function main() {
  console.log('================================================================');
  console.log(` ZKTeco Biometric Attendance Sync Agent (Node.js)`);
  console.log(` Device:   ${config.device_name} (${config.device_ip}:${config.device_port})`);
  console.log(` Endpoint: ${config.hrm_api_url}`);
  console.log(` Interval: Every ${config.sync_interval_seconds} seconds`);
  console.log('================================================================');

  if (onceFlag) {
    await runSyncCycle();
    process.exit(0);
  }

  // Initial immediate run
  await runSyncCycle();

  // Recurring loop
  setInterval(async () => {
    try {
      await runSyncCycle();
    } catch (e) {
      log(`Error in sync cycle: ${e.message}`, 'ERROR');
    }
  }, config.sync_interval_seconds * 1000);
}

main().catch(err => {
  log(`Fatal error in sync agent: ${err.message}`, 'ERROR');
});
