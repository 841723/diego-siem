DROP TABLE IF EXISTS logs;

CREATE TABLE logs (
    timestamp DateTime,
    sourceid Int,
    data JSON
) ENGINE = MergeTree()
ORDER BY timestamp;