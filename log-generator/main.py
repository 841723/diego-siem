import socket
import random
import time
import os
import json
from datetime import datetime, timezone

SYSLOG_HOST = os.getenv("SYSLOG_HOST", "backend")
SYSLOG_PORT = int(os.getenv("SYSLOG_PORT", 9001))

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

services = ["auth", "db", "api", "payment"]
levels = ["INFO", "WARN", "ERROR"]
counter = 0

HOSTNAME = "log-generator"
APP_NAME = "mini-siem"
PROCID = "-"
MSGID = "-"

def build_syslog_message(payload):
    # PRI = facility(1=user-level) * 8 + severity(6=info)
    PRI = 14  

    VERSION = 1
    TIMESTAMP = datetime.now(timezone.utc).isoformat()
    
    header = f"<{PRI}>{VERSION} {TIMESTAMP} {HOSTNAME} {APP_NAME} {PROCID} {MSGID} -"
    
    return f"{header} {payload}"

while True:
    log = {
        "service": random.choice(services),
        "message": f"Event {random.randint(1000,9999)}",
        "level": random.choice(levels),
        "timestamp": counter
    }
    counter += 1

    try:
        payload = json.dumps(log)
        msg = build_syslog_message(payload)

        sock.sendto(msg.encode(), (SYSLOG_HOST, SYSLOG_PORT))

        print("sent:", msg)

    except Exception as e:
        print("error:", e)

    time.sleep(1)