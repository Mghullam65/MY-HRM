#!/usr/bin/env python3
"""
ZKTeco Biometric Attendance Background Sync Agent (Python)
-----------------------------------------------------------
Reads punch records from on-premise ZKTeco biometric terminals
over TCP/IP port 4370 and synchronizes them with the HRM web system.
"""

import os
import sys
import time
import json
import argparse
from datetime import datetime

try:
    import requests
except ImportError:
    requests = None

# Import the existing device connector from the same folder
try:
    from zk_device_connector import ZKDeviceConnector
except ImportError:
    ZKDeviceConnector = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")
CURSOR_FILE = os.path.join(BASE_DIR, "last_sync.json")


def log(msg, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {msg}", flush=True)


def load_config():
    defaults = {
        "device_ip": "192.168.1.201",
        "device_port": 4370,
        "device_timeout": 5,
        "hrm_api_url": "http://localhost:3000/api/attendance/biometric-sync",
        "sync_interval_seconds": 300,
        "api_secret": "hrm-biometric-secret-key-2026",
        "device_name": "ZKTeco-01 Main Lobby",
        "mock_fallback": True
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                defaults.update(data)
        except Exception as e:
            log(f"Error reading config.json ({e}); using defaults.", "WARN")
    return defaults


def get_last_sync_timestamp():
    if os.path.exists(CURSOR_FILE):
        try:
            with open(CURSOR_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("last_sync_timestamp")
        except Exception:
            pass
    return None


def save_last_sync_timestamp(timestamp_str, record_count):
    try:
        with open(CURSOR_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "last_sync_timestamp": timestamp_str,
                "synced_at": datetime.now().isoformat(),
                "last_batch_count": record_count
            }, f, indent=2)
    except Exception as e:
        log(f"Failed to update last_sync.json: {e}", "WARN")


def fetch_punches_from_device(cfg, dry_run=False):
    if not ZKDeviceConnector:
        log("zk_device_connector module not found.", "ERROR")
        return []

    ip = cfg["device_ip"]
    port = cfg["device_port"]
    timeout = cfg["device_timeout"]

    log(f"Attempting connection to ZKTeco terminal at {ip}:{port} (timeout: {timeout}s)...")
    connector = ZKDeviceConnector(ip, port=port, timeout=timeout)

    connected = connector.connect_device()
    if not connected:
        log(f"Cannot reach ZKTeco device at {ip}:{port}.", "WARN")
        return []

    try:
        raw_records = connector.get_attendance_records()
        log(f"Successfully retrieved {len(raw_records)} records from device memory.")
        return raw_records
    finally:
        connector.disconnect_device()


def filter_new_records(records, last_sync):
    if not last_sync:
        return records
    new_records = []
    for r in records:
        ts = r.get("timestamp")
        if ts and ts > last_sync:
            new_records.append(r)
    return new_records


def push_to_hrm(records, cfg):
    if not records:
        return True

    if not requests:
        log("Python 'requests' package is not installed. Cannot transmit to HRM.", "ERROR")
        return False

    url = cfg["hrm_api_url"]
    headers = {
        "Content-Type": "application/json",
        "x-biometric-secret": cfg["api_secret"]
    }

    try:
        log(f"Transmitting batch of {len(records)} punches to HRM at {url}...")
        resp = requests.post(url, json=records, headers=headers, timeout=12)
        if resp.status_code in (200, 201):
            log(f"HRM Server accepted batch successfully! Response: {resp.text}")
            return True
        else:
            log(f"HRM Server returned status {resp.status_code}: {resp.text}", "ERROR")
            return False
    except Exception as e:
        log(f"Network error pushing to HRM server: {e}", "ERROR")
        return False


def run_sync_cycle(cfg, dry_run=False):
    log("Starting biometric sync cycle...")
    records = fetch_punches_from_device(cfg, dry_run)
    last_sync = get_last_sync_timestamp()

    new_records = filter_new_records(records, last_sync)
    log(f"Found {len(new_records)} new punch events since last sync ({last_sync or 'Initial Sync'}).")

    if not new_records:
        log("No new punch events to upload.")
        return

    if dry_run:
        log(f"[DRY-RUN] Would have transmitted {len(new_records)} records. Sample: {new_records[0] if new_records else 'None'}")
        return

    success = push_to_hrm(new_records, cfg)
    if success:
        latest_timestamp = max(r["timestamp"] for r in new_records if "timestamp" in r)
        save_last_sync_timestamp(latest_timestamp, len(new_records))
        log(f"Sync complete. Updated cursor to {latest_timestamp}.")


def main():
    parser = argparse.ArgumentParser(description="ZKTeco Attendance Background Sync Agent")
    parser.add_argument("--once", action="store_true", help="Run a single sync cycle and exit")
    parser.add_argument("--dry-run", action="store_true", help="Fetch records without transmitting to HRM")
    parser.add_argument("--interval", type=int, help="Override sync interval in seconds")
    parser.add_argument("--device-ip", type=str, help="Override ZKTeco terminal IP")
    args = parser.parse_args()

    cfg = load_config()
    if args.interval:
        cfg["sync_interval_seconds"] = args.interval
    if args.device_ip:
        cfg["device_ip"] = args.device_ip

    log("=" * 60)
    log(f"ZKTeco Attendance Background Sync Agent Started")
    log(f"Terminal: {cfg['device_name']} ({cfg['device_ip']}:{cfg['device_port']})")
    log(f"HRM Endpoint: {cfg['hrm_api_url']}")
    log(f"Sync Interval: Every {cfg['sync_interval_seconds']} seconds")
    log("=" * 60)

    if args.once:
        run_sync_cycle(cfg, args.dry_run)
        return

    while True:
        try:
            run_sync_cycle(cfg, args.dry_run)
        except Exception as e:
            log(f"Unexpected error during sync cycle: {e}", "ERROR")

        log(f"Sleeping for {cfg['sync_interval_seconds']} seconds until next cycle...")
        time.sleep(cfg["sync_interval_seconds"])


if __name__ == "__main__":
    main()
