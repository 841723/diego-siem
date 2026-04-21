package app

import (
	"backend/internal/model"
	"fmt"
)

func (a *App) AddLog(l model.Log) {
	a.Mu.Lock()
	defer a.Mu.Unlock()

	if len(a.Logs) >= a.maxLogs {
		a.Logs = a.Logs[1:]
	}
	a.Logs = append(a.Logs, l)
}

func (a *App) GetLogs() []model.Log {
	a.Mu.Lock()
	defer a.Mu.Unlock()
	fmt.Printf("Returning logs: %v\n", a.Logs)

	return a.Logs
}
