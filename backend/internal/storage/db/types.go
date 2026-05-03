package db

import (
	"fmt"
	"regexp"
	"strings"

	"backend/internal/model"
)

func isValidClickHouseColumnName(columnName string) bool {
	validName := regexp.MustCompile(`^[a-z]+$`)
	return validName.MatchString(columnName)
}

func buildInsert(log model.Log, mapping map[string]string) (string, []any, error) {
	cols := []string{"timestamp", "sourceid"}
	vals := []any{log.Timestamp, log.SourceID}

	for col := range mapping {
		if !isValidClickHouseColumnName(col) {
			continue
		}

		if v, ok := log.Data[col]; ok {
			cols = append(cols, col)
			vals = append(vals, v)
		}
	}

	cols = append(cols, "data")
	vals = append(vals, log.Data)

	placeholders := make([]string, len(vals))
	for i := range placeholders {
		placeholders[i] = "?"
	}

	query := fmt.Sprintf(
		"INSERT INTO \"logs\" (%s) VALUES (%s)",
		strings.Join(cols, ","),
		strings.Join(placeholders, ","),
	)

	return query, vals, nil
}
