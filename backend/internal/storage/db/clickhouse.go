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
	err := db.conn.Exec(ctx, "INSERT INTO logs (timestamp, source_id, data) VALUES (?, ?, ?)",
		log.Timestamp, log.SourceID, data)
	if err != nil {
		return fmt.Errorf("failed to insert log: %w", err)
	}
	return nil
}
