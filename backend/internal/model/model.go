package model

type Log struct {
	Timestamp int64                  `json:"timestamp"`
	SourceID  string                 `json:"source_id"`
	Data      map[string]interface{} `json:"data"`
}

type SourceConfig struct {
	ID       string `json:"id"`
	Port     int    `json:"port"`
	Protocol string `json:"protocol"` // udp, tcp
	Parser   string `json:"parser"`   // syslog, json, etc.
	Name     string `json:"name"`
	Pipeline string `json:"pipeline_id"` // pipeline to process the log
	Index    string `json:"index_id"`       // index to store the log
}
