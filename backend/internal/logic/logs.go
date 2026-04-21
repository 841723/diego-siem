package logic

import "backend/internal/model"

func AddLog(l model.Log) {
	stateMu.Lock()
	defer stateMu.Unlock()

	if len(logs) >= maxLogs {
		logs = logs[1:]
	}
	logs = append(logs, l)
}

func GetLogs() []model.Log {
	stateMu.Lock()
	defer stateMu.Unlock()

	logsCopy := make([]model.Log, len(logs))
	copy(logsCopy, logs)
	return logsCopy
}
