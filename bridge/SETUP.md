# ZKTeco ↔ HRM Pro — Setup Guide

## Your Device
**ZKTeco SpeedFace / SF-series**  
(Face recognition + Optical fingerprint + RFID card reader + Color LCD)

---

## Step 1 — Find Your Device's Local IP

On the ZKTeco device:
1. Press **Menu** → **Comm** → **Ethernet**
2. Note the **IP Address** shown (e.g. `192.168.1.201`)

---

## Step 2 — Configure the Bridge

Open `bridge/zkteco-bridge.js` and edit:

```js
const DEVICE_CONFIG = {
  ip:   '192.168.1.201',  // ← CHANGE THIS to your device's actual LAN IP
  port: 4370,             // Leave as-is (ZKTeco default)
};
```

---

## Step 3 — Install & Run the Bridge

```bash
cd bridge
npm install
node zkteco-bridge.js
```

You'll see:
```
╔══════════════════════════════════════════════════════╗
║      ZKTeco ↔ HRM PRO Biometric Bridge v1.0         ║
╚══════════════════════════════════════════════════════╝
  Bridge port     : http://localhost:8877
  ZKTeco device   : 192.168.1.201:4370
  HRM sync URL    : http://localhost:8877/api/attendance/biometric-sync
  ADMS push URL   : http://YOUR_PUBLIC_IP:8877/iclock/cdata
```

---

## Step 4 — Test the Connection

```bash
# Trigger a manual sync (pulls all punches from device)
curl http://localhost:8877/api/attendance/sync-now

# Check device status
curl http://localhost:8877/api/device/status

# View all cached punches
curl http://localhost:8877/api/attendance/punches
```

---

## Step 5 — Open HRM and Sync

1. Open HRM Pro in browser → **Attendance** module
2. Click **"Sync Biometric Hardware Terminals"** button
3. HRM calls `http://localhost:8877/api/attendance/biometric-sync`
4. All punches from the ZKTeco device appear in the attendance register ✅

---

## Option B — ADMS Push Mode (If TCP Pull Fails)

If the device is behind NAT or port 4370 is blocked, use ADMS push mode instead.
The device pushes records TO your server instead of being pulled from.

**On the ZKTeco device:**
1. Menu → **Comm** → **Cloud Server Settings** (or ADMS)
2. Set **Server Address**: `YOUR_PC_IP` (e.g. your public internet IP)
3. Set **Server Port**: `8877`
4. Set **HTTPS**: Off
5. Save → the device will start pushing attendance records automatically

The bridge automatically receives and stores all pushed punches.

---

## Punch Type Mapping

| ZKTeco Status Code | HRM Punch Type   |
|--------------------|-----------------|
| 0                  | Check-In        |
| 1                  | Check-Out       |
| 2                  | Break-Out       |
| 3                  | Break-In        |
| 4                  | OT-In           |
| 5                  | OT-Out          |

## Verify Mode Mapping

| ZKTeco Verify Code | Method              |
|--------------------|---------------------|
| 1                  | Fingerprint         |
| 2                  | Card (RFID)         |
| 10                 | Face Recognition    |
| 15                 | Face + Fingerprint  |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED 4370` | Device IP is wrong, or device is on a different subnet |
| `ETIMEDOUT` | Port 4370 is blocked by router/firewall |
| Device not pushing (ADMS) | Check device ADMS config points to your PC IP:8877 |
| HRM shows "Sync failed" | Make sure bridge is running: `curl http://localhost:8877/health` |
| Wrong employee matched | Set the employee's **biometricId** in HRM to match their PIN number on the device |

---

## Setting Employee Biometric IDs in HRM

Each employee enrolled in the ZKTeco device has a **PIN** (user ID).  
In HRM Pro:
1. Go to **Employees** → Edit employee
2. Set **Biometric ID** field = the PIN number shown on the ZKTeco device
3. The bridge matches punches by this ID

---

*Bridge version 1.0 | Supports: ZKTeco SDK via node-zklib + ADMS HTTP push*
