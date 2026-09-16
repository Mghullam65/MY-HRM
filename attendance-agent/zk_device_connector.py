from zk import ZK

class ZKDeviceConnector:
    def __init__(self, device_ip, port=4370, timeout=5):
        self.device_ip = device_ip
        self.port = port
        self.timeout = timeout
        self.zk = ZK(ip=device_ip, port=port, timeout=timeout, password=0)
        self.conn = None

    def set_device_ip(self, new_ip):
        # Disconnect existing connection if active
        self.disconnect_device()

        self.device_ip = new_ip
        self.zk = ZK(ip=new_ip, port=self.port, timeout=self.timeout, password=0)
        print(f"ZKDeviceConnector device IP updated to {new_ip}")

    def connect_device(self):
        try:
            if self.conn:
                return True # Already connected
            self.conn = self.zk.connect()
            print(f"Connected to ZKTeco device at {self.device_ip}:{self.port}")
            return True
        except Exception as e:
            print(f"Failed to connect to ZKTeco device: {e}")
            self.conn = None
            return False

    def disconnect_device(self):
        try:
            if self.conn:
                self.conn.disconnect()
                self.conn = None
                print(f"Disconnected from ZKTeco device at {self.device_ip}:{self.port}")
        except Exception as e:
            print(f"Error disconnecting: {e}")

    def is_connected(self):
        return self.conn is not None

    def get_attendance_records(self):
        records = []
        # If not connected, try to connect temporarily? 
        # Or assume caller handles connection? 
        # Given the new flow, caller should handle connection, but let's be safe.
        
        local_conn = False
        if not self.conn:
             # If we want to support ad-hoc fetching, we could connect here.
             # But the requirement is explicit "Connected" state.
             # So we'll return empty or raise error if not connected.
             print("Not connected to device.")
             return []

        try:
            # self.conn is the ZK object's connection handle
            attendance_logs = self.conn.get_attendance()
            for log in attendance_logs:
                event_type = "check-in" if log.status == 0 else "check-out"
                records.append(
                    {
                        "user_id": log.user_id,
                        "timestamp": log.timestamp.isoformat(),
                        "status": event_type,
                        "device_id": f"ZKTeco-{self.device_ip}",
                    }
                )

        except Exception as e:
            print(f"Error communicating with ZKTeco device: {e}")
            # If error occurs, maybe connection is lost
            self.disconnect_device()
        
        return records


if __name__ == "__main__":
    connector = ZKDeviceConnector("192.168.1.201")
    records = connector.get_attendance_records()
    if records:
        for record in records:
            print(record)
    else:
        print("No records retrieved or connection failed.")
