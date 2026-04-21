package logic

import (
	"backend/internal/model"
	"backend/internal/sources/syslog"
)

func AddSource(s model.SourceConfig) {
	sourcesList = append(sourcesList, s)
	syslog.NewSyslogServer(s, LogsChan)
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
