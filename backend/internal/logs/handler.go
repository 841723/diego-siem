package logs

import (
	"sync"
)

var Logs []Log
var Mu sync.Mutex

func AddLog(l Log) {
	Mu.Lock()
	defer Mu.Unlock()

	Logs = append(Logs, l)

	if len(Logs) > 100 {
		Logs = Logs[1:]
	}
}

func GetLogs() []Log {
	Mu.Lock()
	defer Mu.Unlock()

	return Logs
}