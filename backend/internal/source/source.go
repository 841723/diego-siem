package source

import "backend/internal/model"

type SourceConfig struct {
	ID       string `json:"id"`
	Port     string `json:"port"`
	Protocol string `json:"protocol"` // udp, tcp
	Parser   string `json:"parser"`   // syslog, json, etc.
	Name     string `json:"name"`

	logsChannel chan model.Log
}
