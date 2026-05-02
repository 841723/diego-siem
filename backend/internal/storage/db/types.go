package db

import (
	"fmt"
	"regexp"
	"strings"

	"backend/internal/model"
)

func isValidClickHouseDataType(dataType string) bool {
	dataType = strings.ToLower(dataType)
	return dataType == "int8" ||
		dataType == "int16" ||
		dataType == "int32" ||
		dataType == "int64" ||
		dataType == "int128" ||
		dataType == "int256" ||
		dataType == "uint8" ||
		dataType == "uint16" ||
		dataType == "uint32" ||
		dataType == "uint64" ||
		dataType == "uint128" ||
		dataType == "uint256" ||
		dataType == "float32" ||
		dataType == "float64" ||
		dataType == "decimal32" ||
		dataType == "decimal64" ||
		dataType == "decimal128" ||
		dataType == "decimal256" ||
		dataType == "date" ||
		dataType == "date32" ||
		dataType == "datetime" ||
		dataType == "datetime64" ||
		dataType == "time" ||
		dataType == "time64" ||
		dataType == "string" ||
		dataType == "fixedstring" ||
		dataType == "enum" ||
		dataType == "enum8" ||
		dataType == "enum16" ||
		dataType == "ipv4" ||
		dataType == "ipv6" ||
		dataType == "uuid" ||
		dataType == "array" ||
		dataType == "tuple" ||
		dataType == "map" ||
		dataType == "nested" ||
		dataType == "lowcardinality" ||
		dataType == "nullable" ||
		dataType == "bool"
}

func isValidClickHouseColumnName(columnName string) bool {
	validName := regexp.MustCompile(`^[a-z]+$`)
	return validName.MatchString(columnName)
}

func buildInsert(log model.Log, mapping map[string]string) (string, []any, error) {

	cols := []string{"timestamp", "sourceid"}
	vals := []any{log.Timestamp, log.SourceID}

	for col := range mapping {
		if !isValidClickHouseColumnName(col){
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
