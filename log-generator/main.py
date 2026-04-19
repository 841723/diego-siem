import requests
import random
import time
import os

url = os.getenv("BACKEND_URL", "http://backend:8080/logs")

services = ["auth", "db", "api", "payment"]
levels = ["INFO", "WARN", "ERROR"]

while True:
    log = {
        "service": random.choice(services),
        "message": f"Event {random.randint(1000,9999)}",
        "level": random.choice(levels)
    }

    try:
        requests.post(url, json=log)
        print("sent:", log)
    except Exception as e:
        print("error:", e)

    time.sleep(1)