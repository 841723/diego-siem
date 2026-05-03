package db

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"backend/internal/model"

	"github.com/ClickHouse/clickhouse-go/v2"
)

type ClickHouseDB struct {
	conn clickhouse.Conn
}

func NewClickHouseDB() *ClickHouseDB {
	db := &ClickHouseDB{}
	if err := db.connect(); err != nil {
		log.Fatalf("Error connecting to ClickHouse®: %v", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatalf("Error pinging ClickHouse®: %v", err)
	}

	return db
}

func (db *ClickHouseDB) connect() error {
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{"siem-clickhouse:9000"},
		Auth: clickhouse.Auth{
			Database: "",
			Username: "default",
			Password: "default",
		},
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to ClickHouse®: %w", err)
	}
	db.conn = conn
	return nil
}

func (db *ClickHouseDB) Ping() error {
	ctx := context.Background()
	if err := db.conn.Ping(ctx); err != nil {
		return fmt.Errorf("failed to ping ClickHouse®: %w", err)
	}
	return nil
}

func (db *ClickHouseDB) GetVersion() (string, error) {
	ctx := context.Background()
	var version string
	if err := db.conn.QueryRow(ctx, "SELECT version()").Scan(&version); err != nil {
		return "", fmt.Errorf("failed to query version: %w", err)
	}
	return version, nil
}

func (db *ClickHouseDB) LogToDB(log model.Log) error {
	// Convert log.Data to JSON object string
	data := "{}"
	if log.Data != nil {
		jsonData, err := json.Marshal(log.Data)
		if err != nil {
			return fmt.Errorf("failed to marshal log data: %w", err)
		}
		data = string(jsonData)
	}

	ctx := context.Background()
	err := db.conn.Exec(ctx, "INSERT INTO logs (logid, timestamp, sourceid, data) VALUES (?, ?, ?, ?)", log.ID, log.Timestamp, log.SourceID, data)
	if err != nil {
		return fmt.Errorf("failed to insert log: %w", err)
	}
	return nil
}

func (db *ClickHouseDB) GetLogsFromDB(params model.GetLogsParams) ([]model.Log, error) {
	ctx := context.Background()
	rows, err := db.conn.Query(ctx, "SELECT logid, timestamp, sourceid, data FROM logs WHERE sourceid = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp DESC LIMIT ? OFFSET ?", params.SourceID, params.TimestampFrom, params.TimestampTo, params.Size, params.From)
	if err != nil {
		return nil, fmt.Errorf("failed to query logs: %w", err)
	}
	defer rows.Close()

	var logs []model.Log
	for rows.Next() {
		var log model.Log
		var sourceID model.ID

		var data map[string]interface{}
		if err := rows.Scan(&log.ID, &log.Timestamp, &sourceID, &data); err != nil {
			return nil, fmt.Errorf("failed to scan log row: %w", err)
		}
		log.SourceID = sourceID
		log.Data = data

		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating log rows: %w", err)
	}

	fmt.Printf("Retrieved %d logs from ClickHouse®\n", len(logs))

	return logs, nil
}

func (db *ClickHouseDB) CountLogsFromDB(params model.GetLogsParams) (int, error) {
	ctx := context.Background()
	var count uint64
	//     "error": "failed to count logs: clickhouse [ScanRow]: (COUNT()) converting UInt64 to *int is unsupported. try using *uint64"

	err := db.conn.QueryRow(ctx, "SELECT COUNT(*) FROM logs WHERE sourceid = ? AND timestamp BETWEEN ? AND ?", params.SourceID, params.TimestampFrom, params.TimestampTo).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count logs: %w", err)
	}

	return int(count), nil
}

func (db *ClickHouseDB) DeleteLogsFromDB() error {
	ctx := context.Background()
	err := db.conn.Exec(ctx, "TRUNCATE TABLE logs")
	if err != nil {
		return fmt.Errorf("failed to delete logs: %w", err)
	}
	return nil
}

func (db *ClickHouseDB) AddColumnToLogsInDB(columnname string, datatype string) error {
	ctx := context.Background()

	if !isValidClickHouseColumnName(columnname) {
		return fmt.Errorf("invalid column name: %s", columnname)
	}

	if !isValidClickHouseDataType(datatype) {
		return fmt.Errorf("invalid data type: %s", datatype)
	}
	query := fmt.Sprintf("ALTER TABLE logs ADD COLUMN IF NOT EXISTS %s %s", columnname, datatype)

	err := db.conn.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to add column: %w", err)
	}
	return nil
}

func (db *ClickHouseDB) RemoveColumnFromLogsInDB(columnname string) error {
	ctx := context.Background()

	if !isValidClickHouseColumnName(columnname) {
		return fmt.Errorf("invalid column name: %s", columnname)
	}

	query := fmt.Sprintf("ALTER TABLE logs DROP COLUMN IF EXISTS %s", columnname)

	err := db.conn.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to remove column: %w", err)
	}
	return nil
}
