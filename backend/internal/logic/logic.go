package logic

import (
	"fmt"
	"sync"

	"backend/internal/model"
)

var (
	Logs    []model.Log
	maxLogs = 1000
)

var Mu sync.Mutex

var LogsChan = make(chan model.Log, 100)

var sourcesList = []model.SourceConfig{}

func waitLogsFromChannel() {
	for {
		log := <-LogsChan
		fmt.Printf("Received log from channel: %v\n", log)
		AddLog(log)
	}
}

func Logic() {
	fmt.Println("Logic is running...")
	initSources()
	go waitLogsFromChannel()
}
