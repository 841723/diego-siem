package model

type Log struct {
	Service   string `json:"service"`
	Message   string `json:"message"`
	Level     string `json:"level"`
	Timestamp int64  `json:"timestamp"`
}

type SourceConfig struct {
	ID   	 string `json:"id"`
	Port 	 int   	`json:"port"`
	Protocol string `json:"protocol"` // udp, tcp
	Parser   string `json:"parser"` // syslog, json, etc.
	Name     string `json:"name"`
}

type SyslogServer struct {
    cfg SourceConfig
}