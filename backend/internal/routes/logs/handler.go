package logs

import (
	"fmt"
	"sync"
	"backend/internal/model"
)

var Logs [5]model.Log
var Mu sync.Mutex

func AddLog(l model.Log) {
	Mu.Lock()
	defer Mu.Unlock()

	for i := len(Logs) - 1; i > 0; i-- {
		Logs[i] = Logs[i-1]
	}
	Logs[0] = l
	
	fmt.Printf("Added log: %v\n", l)
}

func GetLogs() [5]model.Log {
	Mu.Lock()
	defer Mu.Unlock()

	return Logs
}