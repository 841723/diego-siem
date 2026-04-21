package pipelines

import (
	"backend/internal/model"
)

func formatLog(log model.Log) string {
	return "[" + log.Service + "] " + log.Message
}