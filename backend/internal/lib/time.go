package lib

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// now:::now-1h -> timestampFrom, timestampTo

func FormatTimeWindowToUnix(timeWindow string) (string, string, error) {
	if timeWindow == "all" {
		return "0", strconv.FormatInt(^int64(0), 10), nil // from 1970 to max int64
	}

	parts := strings.Split(timeWindow, ":::")
	if len(parts) != 2 {
		return "", "", fmt.Errorf("invalid time window format")
	}

	now := time.Now().Unix()

	timestampFrom, err := parseTimeExpression(parts[1], now)
	if err != nil {
		return "", "", fmt.Errorf("invalid time expression: %w", err)
	}

	timestampTo, err := parseTimeExpression(parts[0], now)
	if err != nil {
		return "", "", fmt.Errorf("invalid time expression: %w", err)
	}

	return strconv.FormatInt(timestampFrom, 10), strconv.FormatInt(timestampTo, 10), nil
}

func parseTimeExpression(expr string, now int64) (int64, error) {
	if expr == "now" {
		return now, nil
	}

	var multiplier int64
	switch {
	case strings.HasSuffix(expr, "s"):
		multiplier = 1
		expr = strings.TrimSuffix(expr, "s")
	case strings.HasSuffix(expr, "m"):
		multiplier = 60
		expr = strings.TrimSuffix(expr, "m")
	case strings.HasSuffix(expr, "h"):
		multiplier = 3600
		expr = strings.TrimSuffix(expr, "h")
	case strings.HasSuffix(expr, "d"):
		multiplier = 86400
		expr = strings.TrimSuffix(expr, "d")
	default:
		return 0, fmt.Errorf("invalid time unit in expression: %s", expr)
	}

	if strings.HasPrefix(expr, "now-") {
		expr = strings.TrimPrefix(expr, "now-")
	}

	num, err := strconv.ParseInt(expr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid time value in expression: %s", expr)
	}

	return now - num*multiplier, nil
}
