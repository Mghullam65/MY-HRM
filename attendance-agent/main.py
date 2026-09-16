from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.list import MDListItem, MDListItemHeadlineText
from kivy.properties import ObjectProperty, StringProperty, BooleanProperty
from kivy.clock import Clock
import threading

from data_generator import generate_fake_attendance_data
from zk_device_connector import ZKDeviceConnector


from kivymd.uix.dialog import MDDialog



class MainScreen(MDScreen):
    status_label = ObjectProperty(None)
    attendance_list = ObjectProperty(None)


class KivyAttendanceApp(MDApp):
    fetch_btn_text = StringProperty("Fetch Mock Data")
    clear_btn_text = StringProperty("Clear Mock Data")
    is_connected = BooleanProperty(False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.attendance_records = []
        self.zk_connector = ZKDeviceConnector("192.168.1.201")  # Placeholder IP
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Indigo"

    def build(self):
        return MainScreen()

    def on_start(self):
        print("Starting app...")
        # Attempt to connect to device on startup
        self.connect_to_device()

    def connect_to_device(self):
        self.root.ids.status_label.text = "Attempting to connect to ZKTeco device..."
        threading.Thread(target=self._connect_device_worker, daemon=True).start()

    def _connect_device_worker(self):
        connected = self.zk_connector.connect_device()
        Clock.schedule_once(lambda dt: self._update_connection_status(connected))

    def _update_connection_status(self, connected):
        self.is_connected = connected
        if connected:
            self.fetch_btn_text = "Fetch Data"
            self.clear_btn_text = "Clear Data"
            self.root.ids.status_label.text = "Connected"
            self.update_attendance_list("Connected to device")
        else:
            self.fetch_btn_text = "Fetch Mock Data"
            self.clear_btn_text = "Clear Mock Data"
            # If we were previously connected, we might want to say "Disconnected"
            # If we failed to connect, we say "Disconnected - Using Mock Data"
            self.root.ids.status_label.text = "Disconnected - Using Mock Data"
            # Load mock data if not connected
            self.load_initial_mock_data()
    
    def toggle_connection(self):
        if self.is_connected:
            self.disconnect_device()
        else:
            self.connect_to_device()

    def load_initial_mock_data(self):
        print("Loading initial mock data...")
        self.attendance_records = generate_fake_attendance_data(10)
        print(f"Generated {len(self.attendance_records)} fake records.")
        self.update_attendance_list("Loaded fake data")

    # ─────────────── Attendance List Update ───────────────
    def update_attendance_list(self, status_text=None):
        print("Updating attendance list...")
        self.root.ids.attendance_list.clear_widgets()
        records = self.attendance_records

        if not records:
            print("No records found.")
            item = MDListItem()
            item.add_widget(MDListItemHeadlineText(text="No attendance records yet."))
            self.root.ids.attendance_list.add_widget(item)
        else:
            print(f"Adding {len(records)} items to list.")
            for record in records:
                # Handle both dict (fake data) and objects (real data if any)
                if isinstance(record, dict):
                    text = f"User {record.get('user_id')} - {record.get('timestamp')}"
                else:
                    text = f"User {record}"
                    
                item = MDListItem()
                item.add_widget(
                    MDListItemHeadlineText(
                        text=text
                    )
                )
                self.root.ids.attendance_list.add_widget(item)

        if status_text:
            self.root.ids.status_label.text = status_text

    # ─────────────── Sync Data ───────────────
    def sync_data(self):
        if self.is_connected:
            self.root.ids.status_label.text = "Fetching data from device..."
            threading.Thread(target=self._sync_data_worker, daemon=True).start()
        else:
            self.root.ids.status_label.text = "Fetching mock data..."
            self.load_initial_mock_data()

    def _sync_data_worker(self):
        records = self.zk_connector.get_attendance_records()
        if records:
            self.attendance_records = records
            Clock.schedule_once(
                lambda dt: self.update_attendance_list(
                    f"Synced {len(records)} records from device"
                )
            )
        else:
            # Check if still connected
            if not self.zk_connector.is_connected():
                 Clock.schedule_once(lambda dt: self._update_connection_status(False))
            else:
                Clock.schedule_once(
                    lambda dt: setattr(
                        self.root.ids.status_label,
                        "text",
                        "No records retrieved"
                    )
                )

    # ─────────────── Clear Data ──────────────
    def clear_data(self):
        self.attendance_records.clear()
        self.update_attendance_list("All records cleared")

    # ─────────────── Disconnect ──────────────
    def disconnect_device(self):
        self.zk_connector.disconnect_device()
        self._update_connection_status(False)

    def show_menu(self):
        # Placeholder for future menu functionality
        print("Menu button pressed!")


if __name__ == "__main__":
    KivyAttendanceApp().run()
