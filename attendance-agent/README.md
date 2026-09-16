# 🕒 ZKTeco Multi-Site Biometric Attendance Sync Agent

A lightweight background sync service that connects your physical ZKTeco biometric terminals over TCP/UDP port 4370 and synchronizes attendance punches with your HRM system.

---

## 🏢 Multi-Site Configuration

The agent is pre-configured for both of your physical company locations:

| Location | Config File | Windows Launcher | Default IP |
| :--- | :--- | :--- | :--- |
| **Head Office** | `config_head_office.json` | `run_head_office.bat` | `192.168.1.201:4370` |
| **Factory** | `config_factory.json` | `run_factory.bat` | `192.168.1.202:4370` |

---

## ⚙️ How to Update Your Settings

Open `config_head_office.json` or `config_factory.json` in Notepad to update your settings at any time:

```json
{
  "device_id": "zk-head-office",
  "device_name": "Head Office Terminal",
  "device_ip": "192.168.1.201",
  "device_port": 4370,
  "device_timeout": 5,
  "hrm_api_url": "http://localhost:3000/api/attendance/biometric-sync",
  "sync_interval_seconds": 300,
  "api_secret": "hrm-biometric-secret-key-2026"
}
```

* **`device_ip`**: The local IP address of the machine on that location's router.
* **`hrm_api_url`**: 
  * If testing locally: `http://localhost:3000/api/attendance/biometric-sync`
  * If deployed live: `https://your-hrm-domain.com/api/attendance/biometric-sync`
* **`sync_interval_seconds`**: How often to fetch punches (Default: `300` seconds = every 5 minutes).

---

## 🚀 How to Run

### Option 1: Double-Click Batch File (Simplest)
* At Head Office: Double-click **`run_head_office.bat`**
* At Factory: Double-click **`run_factory.bat`**

### Option 2: Command Line (Node.js)
```bash
# Run Head Office sync
node zk_sync_agent.js --config config_head_office.json

# Run Factory sync
node zk_sync_agent.js --config config_factory.json

# Run once (single pass)
node zk_sync_agent.js --config config_head_office.json --once
```

### Option 3: Python (If Python is installed)
```bash
python zk_sync_agent.py --device-ip 192.168.1.201
```

---

## 🛡️ Key Features

1. **Automatic De-duplication**:
   The agent records the latest timestamp in `last_sync_[device_id].json`. Only **new** punches are ever uploaded, preventing duplicate records.
2. **Offline Resilience**:
   If the internet or server goes down, the terminal keeps records in memory. The agent will automatically push all accumulated punches as soon as connectivity is restored.
3. **Multi-Terminal Telemetry**:
   Both Head Office and Factory appear independently in your HRM **Biometric Machine Punch Hub** with live status and swipe history.
