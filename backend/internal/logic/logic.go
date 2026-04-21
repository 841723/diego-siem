package logic

import (
	"fmt"
	"sync"

	"backend/internal/model"
)

// Array with all logs in memory
var (
	Logs    []model.Log
	maxLogs = 2
)

// Mutex to protect access to Logs
var Mu sync.Mutex

// Channel to receive logs from sources
var LogsChan = make(chan model.Log, 10)

// Array with all sources in memory
var sourcesList = []model.SourceConfig{}

func waitLogsFromChallenge() {
	for {
		log := <-LogsChan
		fmt.Printf("Received log from channel: %v\n", log)
		AddLog(log)
	}
}

func Logic() {
	fmt.Println("Logic is running...")

	go initSources()

	go waitLogsFromChallenge()
}
