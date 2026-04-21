package logic

import (
	"backend/internal/model"
	"backend/internal/source"
)

func AddSource(s model.SourceConfig) {
	s.LogsChannel = LogsChan
	stateMu.Lock()
	sourcesList = append(sourcesList, s)
	stateMu.Unlock()
	source.NewSyslogServer(s)
}

func GetSources() []model.SourceConfig {
	stateMu.Lock()
	defer stateMu.Unlock()

	sourcesCopy := make([]model.SourceConfig, len(sourcesList))
	copy(sourcesCopy, sourcesList)
	return sourcesCopy
}

func ClearSources() {
	stateMu.Lock()
	defer stateMu.Unlock()

	sourcesList = []model.SourceConfig{}
}

func initSources() {
	firstSource := model.SourceConfig{
		ID:       "1",
		Port:     "9001",
		Protocol: "udp",
		Parser:   "syslog",
		Name:     "Default Syslog Source",
	}
	AddSource(firstSource)
}
