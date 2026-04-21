package logic

import (
	"backend/internal/model"
	"backend/internal/source"
)

func AddSource(s model.SourceConfig) {
	s.LogsChannel = LogsChan
	sourcesList = append(sourcesList, s)
	source.NewSyslogServer(s)
}

func GetSources() []model.SourceConfig {
	return sourcesList
}

func ClearSources() {
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
