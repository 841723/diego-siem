package app

import (
	"backend/internal/model"
	"backend/internal/source"
)

func (a *App) AddSource(s model.SourceConfig) {
	s.LogsChannel = a.LogsChan
	a.sourcesList = append(a.sourcesList, s)
	source.NewSyslogServer(s)
}

func (a *App) GetSources() []model.SourceConfig {
	return a.sourcesList
}

func (a *App) ClearSources() {
	a.sourcesList = []model.SourceConfig{}
}

func (a *App) initSources() {
	firstSource := model.SourceConfig{
		ID:       "1",
		Port:     "9001",
		Protocol: "udp",
		Parser:   "syslog",
		Name:     "Default Syslog Source",
	}
	a.AddSource(firstSource)
}
