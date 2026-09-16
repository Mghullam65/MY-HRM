from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker()

def generate_fake_attendance_record():
    """Generates a single fake attendance record."""
    user_id = random.randint(1000, 9999)
    timestamp = fake.date_time_between(start_date="-1y", end_date="now")
    # ZKTeco devices often have specific event types, e.g., 0 for check-in, 1 for check-out
    event_type = random.choice([0, 1]) 
    
    return {
        "user_id": user_id,
        "timestamp": timestamp.isoformat(),
        "event_type": event_type,
        "device_id": "ZKTeco-Mock-001"
    }

def generate_fake_attendance_data(num_records=10):
    """Generates a list of fake attendance records."""
    return [generate_fake_attendance_record() for _ in range(num_records)]

if __name__ == "__main__":
    # Example usage
    attendance_data = generate_fake_attendance_data(5)
    for record in attendance_data:
        print(record)
