package db

import (
	"context"
	"fmt"
	"log"
	"reflect"
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

func (db *ClickHouseDB) GetLogsFromDB(params model.GetLogsRequest, dynamicColumns []model.Mapping) ([]model.Log, error) {
	ctx := context.Background()

	fixedColumns := []string{"logid", "timestamp", "sourceid", "data"}

	allColumns := make([]string, len(fixedColumns), len(fixedColumns)+len(dynamicColumns))
	copy(allColumns, fixedColumns)
	for _, col := range dynamicColumns {
		allColumns = append(allColumns, col.FieldName)
	}

	query := fmt.Sprintf(
		"SELECT %s FROM logs WHERE sourceid = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp DESC LIMIT ? OFFSET ?",
		strings.Join(allColumns, ", "),
	)
	rows, err := db.conn.Query(ctx, query, params.SourceID, params.TimestampFrom, params.TimestampTo, params.Size, params.From)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	columnTypes := rows.ColumnTypes()

	var results []model.Log

	for rows.Next() {
		var (
			id        model.ID
			timestamp time.Time
			sourceID  model.ID
			data      map[string]any
		)

		scanTargets := make([]any, len(allColumns))
		scanTargets[0] = &id
		scanTargets[1] = &timestamp
		scanTargets[2] = &sourceID
		scanTargets[3] = &data

		for i := range dynamicColumns {
			ptr := reflect.New(columnTypes[len(fixedColumns)+i].ScanType())
			scanTargets[len(fixedColumns)+i] = ptr.Interface()
		}

		if err := rows.Scan(scanTargets...); err != nil {
			return nil, err
		}

		logData := model.LogData(data)
		for i, col := range dynamicColumns {
			ptr := scanTargets[len(fixedColumns)+i]
			logData[col.FieldName] = reflect.ValueOf(ptr).Elem().Interface()
		}

		results = append(results, model.Log{
			ID:        id,
			Timestamp: timestamp,
			SourceID:  sourceID,
			Data:      logData,
		})
	}

	return results, rows.Err()
}

func (db *ClickHouseDB) StatsLogsFromDB(params model.GetLogsRequest, aggs model.AggsParam) (model.StatsAggResult, error) {
	ctx := context.Background()

	// Primero detectamos el tipo de la columna
	typeQuery := fmt.Sprintf("SELECT toTypeName(%s) FROM logs WHERE sourceid = ? LIMIT 1", aggs.Field)
	typeRow := db.conn.QueryRow(ctx, typeQuery, params.SourceID)
	var colTypeName string
	if err := typeRow.Scan(&colTypeName); err != nil {
		return model.StatsAggResult{}, fmt.Errorf("failed to detect column type: %w", err)
	}

	// Según el tipo, construimos la expresión adecuada
	isDatetime := strings.HasPrefix(colTypeName, "Date")
	var numericExpr string
	if isDatetime {
		numericExpr = fmt.Sprintf("toUnixTimestamp(%s)", aggs.Field)
	} else {
		numericExpr = fmt.Sprintf("toFloat64OrNull(toString(%s))", aggs.Field)
	}

	query := fmt.Sprintf(`
		SELECT COUNT(*),
			AVGOrNull(%s),
			MINOrNull(%s),
			MAXOrNull(%s),
			SUMOrNull(%s)
		FROM logs
		WHERE sourceid = ?;`,
		numericExpr, numericExpr, numericExpr, numericExpr,
	)

	rows, err := db.conn.Query(ctx, query, params.SourceID)
	if err != nil {
		return model.StatsAggResult{}, fmt.Errorf("failed to query aggs: %w", err)
	}
	defer rows.Close()

	var result model.StatsAggResult
	for rows.Next() {
		var count uint64

		if isDatetime {
			var (
				avg *float64
				min *uint32
				max *uint32
				sum *uint64
			)
			if err := rows.Scan(&count, &avg, &min, &max, &sum); err != nil {
				return model.StatsAggResult{}, fmt.Errorf("failed to scan aggs row: %w", err)
			}
			result.Count = count
			result.Avg = avg
			if min != nil {
				f := float64(*min)
				result.Min = &f
			}
			if max != nil {
				f := float64(*max)
				result.Max = &f
			}
			if sum != nil {
				f := float64(*sum)
				result.Sum = &f
			}
		} else {
			var (
				avg *float64
				min *float64
				max *float64
				sum *float64
			)
			if err := rows.Scan(&count, &avg, &min, &max, &sum); err != nil {
				return model.StatsAggResult{}, fmt.Errorf("failed to scan aggs row: %w", err)
			}
			result.Count = count
			result.Avg = avg
			result.Min = min
			result.Max = max
			result.Sum = sum
		}

		result.Field = aggs.Field
		result.IsDatetime = isDatetime
	}

	return result, rows.Err()
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
