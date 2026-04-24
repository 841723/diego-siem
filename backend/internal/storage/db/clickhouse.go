package db

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"backend/internal/model"

	"github.com/ClickHouse/clickhouse-go/v2"
	// "github.com/ClickHouse/clickhouse-go/v2/lib/driver"
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
	err := db.conn.Exec(ctx, "INSERT INTO logs (timestamp, source_id, data) VALUES (?, ?, ?)",
		log.Timestamp, log.SourceID, data)
	if err != nil {
		return fmt.Errorf("failed to insert log: %w", err)
	}
	return nil
}

func (db *ClickHouseDB) GetLogsFromDB(logID string) ([]model.Log, error) {
	ctx := context.Background()
	rows, err := db.conn.Query(ctx, "SELECT timestamp, source_id, data FROM logs WHERE source_id = ? ORDER BY timestamp DESC LIMIT 100", logID)
	if err != nil {
		return nil, fmt.Errorf("failed to query logs: %w", err)
	}
	defer rows.Close()

	var logs []model.Log
	for rows.Next() {
		var log model.Log

		var data map[string]interface{}
		if err := rows.Scan(&log.Timestamp, &log.SourceID, &data); err != nil {
			return nil, fmt.Errorf("failed to scan log row: %w", err)
		}
		log.Data = data

		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating log rows: %w", err)
	}

	return logs, nil
}

func (db *ClickHouseDB) DeleteLogsFromDB() error {
	ctx := context.Background()
	err := db.conn.Exec(ctx, "TRUNCATE TABLE logs")
	if err != nil {
		return fmt.Errorf("failed to delete logs: %w", err)
	}
	return nil
}