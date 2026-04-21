package logic

import "backend/internal/model"

func AddLog(l model.Log) {
	Mu.Lock()
	defer Mu.Unlock()

	if len(Logs) >= maxLogs {
		Logs = Logs[1:]
	}
	Logs = append(Logs, l)
}

func GetLogs() []model.Log {
	Mu.Lock()
	defer Mu.Unlock()

	return Logs
}
