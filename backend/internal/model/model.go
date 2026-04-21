package model

type Log struct {
	Timestamp int64                  `json:"timestamp"`
	Source    string                 `json:"source"`
	Data      map[string]interface{} `json:"data"`
}

type SourceConfig struct {
	ID       string `json:"id"`
	Port     string `json:"port"`
	Protocol string `json:"protocol"` // udp, tcp
	Parser   string `json:"parser"`   // syslog, json, etc.
	Name     string `json:"name"`
}
