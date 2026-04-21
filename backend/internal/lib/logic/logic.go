package logic

import (
	"backend/internal/model"
	"fmt"
	"sync"
)

var Logs []model.Log
var maxLogs = 2

var Mu sync.Mutex
var LogsChan = make(chan model.Log, 10)

func AddLog(l model.Log) {
	Mu.Lock()
	defer Mu.Unlock()

	if len(Logs) >= maxLogs {
		Logs = Logs[1:]
	}
	Logs = append(Logs, l)

	fmt.Printf("Added log: %v\n", l)
}

func GetLogs() []model.Log {
	Mu.Lock()
	defer Mu.Unlock()

	return Logs
}

func addLogsFromChannel() {
	for {
		log := <-LogsChan
		fmt.Printf("Received log from channel: %v\n", log)
		AddLog(log)
	}
}

func Logic() {
	fmt.Println("Logic is running...")

	go addLogsFromChannel()
}
