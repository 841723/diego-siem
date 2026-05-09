import socket
import random
import time
import os
import json
from datetime import datetime, timezone
from multiprocessing import Process


def create_log_generator(
    log_SYSLOG_HOST = "backend",
    log_SYSLOG_PORT = 9001,
    log_services = ["auth", "db", "api", "payment"],
    log_levels = ["INFO", "WARN", "ERROR"],
    log_HOSTNAME = "log-generator",
    log_APP_NAME = "mini-siem",
    log_PROCID = "-",
    log_MSGID = "-"
):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    counter = 0

    def build_syslog_message(payload):
        # PRI = facility(1=user-level) * 8 + severity(6=info)
        PRI = 14  

        VERSION = 1
        TIMESTAMP = datetime.now(timezone.utc).isoformat()
        
        header = f"<{PRI}>{VERSION} {TIMESTAMP} {log_HOSTNAME} {log_APP_NAME} {log_PROCID} {log_MSGID} -"
        
        return f"{header} {payload}"

    while True:
        log = {
            "service": random.choice(log_services),
            "message": f"Event {random.randint(1000,9999)}",
            "level": random.choice(log_levels),
            "numseq": counter
        }
        counter += 1

        try:
            payload = json.dumps(log)
            msg = build_syslog_message(payload)

            sock.sendto(msg.encode(), (log_SYSLOG_HOST, log_SYSLOG_PORT))

        except Exception as e:
            print("error:", e)

        delay = random.uniform(0.1, 1.0)
        time.sleep(delay)


SYSLOG_HOST = "backend"
SYSLOG_PORT = [
    9001,
    9002,
    9003
]

services = [
    ["auth", "db", "api", "payment"],
    ["backend", "frontend", "cache", "search"],
    ["email", "notification", "analytics", "billing"]
]
levels = [
    ["INFO", "WARN", "ERROR"],
    ["INFO", "WARN", "ERROR"],
    ["INFO", "WARN", "ERROR"]
]
HOSTNAME = [
    "log-generator",
    "log-generator-2",
    "log-generator-3"
]
APP_NAME = "mini-siem"
PROCID = "-"
MSGID = "-"

num_processes = 3

if __name__ == "__main__":
    processes = []
    for i in range(num_processes):
        p = Process(target=create_log_generator, args=(
            SYSLOG_HOST,
            SYSLOG_PORT[i],
            services[i],
            levels[i],
            HOSTNAME[i],
            APP_NAME,
            PROCID,
            MSGID
        ))
        p.start()
        processes.append(p)

    for p in processes:
        p.join()