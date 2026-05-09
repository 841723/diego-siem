package db

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
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

/********************************************************

						Logs

**********************************************************/

func (db *ClickHouseDB) LogToDB(log map[string]interface{}) error {
	data, err := json.Marshal(log)
	if err != nil {
		return fmt.Errorf("failed to marshal log data: %w", err)
	}
	log["data"] = string(data)
	// Construye la lista de columnas a partir de las keys del map, excluyendo "data" si ya fue procesado
	var columns []string
	var values []interface{}
	for k, v := range log {
		columns = append(columns, k)
		values = append(values, v)
	}

	// Luego, reordena los valores para que coincidan con las columnas ordenadas
	var orderedValues []interface{}
	for _, col := range columns {
		orderedValues = append(orderedValues, log[col])
	}

	ctx := context.Background()
	// Especifica explícitamente las columnas en la consulta
	query := fmt.Sprintf("INSERT INTO logs (%s)", strings.Join(columns, ", "))
	batch, err := db.conn.PrepareBatch(ctx, query)
	if err != nil {
		fmt.Printf("Error preparing batch: %v\n", err)
		return fmt.Errorf("failed to prepare batch: %w", err)
	}
	defer batch.Close()

	if err := batch.Append(orderedValues...); err != nil {
		fmt.Printf("Error appending to batch: %v\n", err)
		return fmt.Errorf("failed to append to batch: %w", err)
	}

	if err := batch.Send(); err != nil {
		fmt.Printf("Error sending batch: %v\n", err)
		return fmt.Errorf("failed to send batch: %w", err)
	}
	return nil
}

func (db *ClickHouseDB) GetLogsFromDB(params model.GetLogsRequest) ([]model.Log, error) {
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

func (db *ClickHouseDB) GetAggsFromDB(params model.GetLogsRequest, aggs model.AggsParam) ([]model.AggsBucket, error) {
	ctx := context.Background()

	var query string
	switch aggs.Interval {
	case "1m", "5m", "1h", "1d":
		query = fmt.Sprintf("SELECT %s, COUNT(*) as count FROM logs WHERE sourceid = ? AND timestamp BETWEEN ? AND ? GROUP BY toStartOfInterval(timestamp, INTERVAL %s) ORDER BY toStartOfInterval(timestamp, INTERVAL %s)", aggs.Field, aggs.Interval, aggs.Interval)
	default:
		query = fmt.Sprintf("SELECT %s, COUNT(*) as count FROM logs WHERE sourceid = ? AND timestamp BETWEEN ? AND ? GROUP BY %s", aggs.Field, aggs.Field)
	}

	rows, err := db.conn.Query(ctx, query, params.SourceID, params.TimestampFrom, params.TimestampTo)
	if err != nil {
		return nil, fmt.Errorf("failed to query aggs: %w", err)
	}
	defer rows.Close()

	var buckets []model.AggsBucket
	for rows.Next() {
		var bucket model.AggsBucket
		if err := rows.Scan(&bucket.Key, &bucket.DocCount); err != nil {
			return nil, fmt.Errorf("failed to scan aggs row: %w", err)
		}
		buckets = append(buckets, bucket)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating aggs rows: %w", err)
	}

	return buckets, nil
}

func (db *ClickHouseDB) CountLogsFromDB(params model.GetLogsRequest) (int, error) {
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

/*******************************************************

						Columns

**********************************************************/

func (db *ClickHouseDB) AddColumnToLogsInDB(columnname string, datatype string) error {
	ctx := context.Background()

	if !isValidClickHouseColumnName(columnname) {
		return fmt.Errorf("invalid column name: %s", columnname)
	}

	query := fmt.Sprintf("ALTER TABLE logs ADD COLUMN IF NOT EXISTS %s %s", columnname, datatype)

	fmt.Println(query)
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

/*******************************************************

						Aggs

**********************************************************/

func (db *ClickHouseDB) GetMeanOfFieldFromDB(req model.GetLogsRequest, fieldName string) (float64, error) {
	ctx := context.Background()
	var mean float64

	if !isValidClickHouseColumnName(fieldName) {
		return 0, fmt.Errorf("invalid field name: %s", fieldName)
	}

	err := db.conn.QueryRow(ctx, fmt.Sprintf("SELECT AVG(%s) FROM logs WHERE sourceid = ?", fieldName), req.SourceID).Scan(&mean)
	if err != nil {
		return 0, fmt.Errorf("failed to get mean of field: %w", err)
	}
	return mean, nil
}
