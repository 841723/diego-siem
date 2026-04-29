package lib

import (
	"fmt"
	"strconv"
	"strings"
)

// params.TimeWindow -> "now-1m" OR "now-1h" OR "now-1d"
func ClickHouse_FormatTimeWindow(timeWindow string) (string, string, error) {
	// separar el timeWindow en partes para obtener el to y el from
	// ejemplo: "now-1m" -> ["now", "1m"]
	// ejemplo: "now-1h" -> ["now", "1h"]
	// ejemplo: "now-1d" -> ["now", "1d"]

	split := strings.Split(timeWindow, "-")
	if len(split) != 2 {
		return "", "", fmt.Errorf("invalid time window format")
	}

	from, err := formatTimestampToClickHouse(split[0])
	if err != nil {
		return "", "", fmt.Errorf("failed to format from timestamp: %w", err)
	}

	to, err := formatTimestampToClickHouse(split[1])
	if err != nil {
		return "", "", fmt.Errorf("failed to format to timestamp: %w", err)
	}

	return from, to, nil
}

func formatTimestampToClickHouse(timestamp string) (string, error) {
	if timestamp == "now" {
		return "now()", nil
	}

	// ejemplo: "30s" -> 30 segundos
	// ejemplo: "1m" -> 1 minuto
	// ejemplo: "1h" -> 1 hora
	// ejemplo: "1d" -> 1 día
	// ejemplo: "1w" -> 1 semana
	// ejemplo: "1M" -> 1 mes
	// ejemplo: "1y" -> 1 año

	unit := timestamp[len(timestamp)-1]
	valueStr := timestamp[:len(timestamp)-1]
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return "", fmt.Errorf("invalid time window value: %w", err)
	}

	switch unit {
	case 's':
		return fmt.Sprintf("now() - INTERVAL %d SECOND", value), nil
	case 'm':
		return fmt.Sprintf("now() - INTERVAL %d MINUTE", value), nil
	case 'h':
		return fmt.Sprintf("now() - INTERVAL %d HOUR", value), nil
	case 'd':
		return fmt.Sprintf("now() - INTERVAL %d DAY", value), nil
	case 'w':
		return fmt.Sprintf("now() - INTERVAL %d WEEK", value), nil
	case 'M':
		return fmt.Sprintf("now() - INTERVAL %d MONTH", value), nil
	case 'y':
		return fmt.Sprintf("now() - INTERVAL %d YEAR", value), nil
	default:
		return "", fmt.Errorf("invalid time window unit: %c", unit)
	}
}
