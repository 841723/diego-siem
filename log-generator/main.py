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

        delay = random.uniform(0.5, 1.5)  # Random delay between 0.5 and 1.5 seconds
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

num_processes = 1

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


"""
periodo: (max sleep - min sleep) / 2 = (0.01 - 0.001) / 2 = 0.0045 s

1 proceso:  1 log  / 0.0045 s = 222.22 logs/s
3 procesos: 3 logs / 0.0045 s = 666.67 logs/s


40863 row(s) fetched - 0.118s (0.099s fetch), on 2026-05-10 at 19:42:00
44221 row(s) fetched - 0.135s (0.109s fetch), on 2026-05-10 at 19:44:00

59897 row(s) fetched - 0.276s (0.237s fetch), on 2026-05-10 at 19:54:02
73330 row(s) fetched - 0.266s (0.204s fetch), on 2026-05-10 at 20:01:50
78696 row(s) fetched - 0.266s (0.243s fetch), on 2026-05-10 at 20:04:58


11201 logs in 656 s = 17.07 logs/s
"""
