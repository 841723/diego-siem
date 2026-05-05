DROP TABLE IF EXISTS logs;

CREATE TABLE logs (
    logid UUID, 
    data JSON,
    sourceid UUID,
    timestamp DateTime64(3)
) 
ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (sourceid, timestamp);

-- ALTER TABLE logs
-- ADD COLUMN IF NOT EXISTS new_column_name DataType [DEFAULT expression] [AFTER existing_column | FIRST];

-- ALTER TABLE logs
-- DROP COLUMN IF EXISTS column_name;