DROP TABLE IF EXISTS logs;

CREATE TABLE logs (
    timestamp DateTime,
    source_id String,
    data JSON
) ENGINE = MergeTree()
ORDER BY timestamp;