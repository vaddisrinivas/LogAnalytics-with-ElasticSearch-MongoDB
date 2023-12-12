import json
import random
import string
import requests
from datetime import datetime, timedelta
from faker import Faker


def generate_hex(length):
    return ''.join(random.choices(string.hexdigits.lower(), k=length))


def generate_timestamp():
    start_date = datetime(2022, 9, 15)
    end_date = datetime(2023, 11, 20)
    random_date = start_date + (end_date - start_date) * random.random()
    return random_date.strftime("%Y-%m-%dT%H:%M:%SZ")


fake = Faker()

data = []

log_levels = ["fatal", "error", "warn", "info", "debug"]

messages = [
    "Failed to connect to DB",
    "Timeout error on request",
    "Authentication failed",
    "Internal server error",
    "Resource not found",
    "Disk space running low",
    "Network connection lost",
    "Service unavailable",
    "Invalid input data",
    "File not found",
    "Configuration error",
    "Database connection lost",
    "Permission denied",
    "Unexpected server response",
    "Invalid credentials",
    "Security breach detected"
]

additional_words = [fake.word()
                    for _ in range(500)]  # Generate additional words


def generate_data(num=20000):
    for _ in range(num):
        current_resource_id = fake.word()
        current_span_id = fake.word()
        row = {
            "level": random.choice(log_levels),
            "message": random.choice(messages) +
            ". " +
            ' '.join(
                random.choices(
                    additional_words,
                    k=random.randint(
                        10,
                        20))),
            "resourceId": current_resource_id,
            "timestamp": generate_timestamp(),
            "traceId": generate_hex(8) +
            '-' +
            generate_hex(4) +
            '-' +
            generate_hex(4) +
            '-' +
            generate_hex(4) +
            '-' +
            generate_hex(12),
            "spanId": current_span_id,
            "commit": generate_hex(7)}
        data.append(row)
    all_resource_ids = list(set(row['resourceId'] for row in data))
    all_span_ids = list(set(row['spanId'] for row in data))

    for row in data:
        row['metadata'] = {
            "parentResourceId": random.choice(all_resource_ids)
        }
    return data


num = 100
data = generate_data(num)

for row in data:
    try:
        requests.post('http://localhost:3000/api/v1/logs/', json=row)
    except Exception as e:
        print("Failed to send row:", e)

# Save the generated data to a JSON file
with open('../fake_data.json', 'w') as outfile:
    json.dump(data, outfile, indent=4)
