package model

type Log struct {
	Timestamp int64                  `json:"timestamp"`
	SourceID  string                 `json:"source_id"`
	Data      map[string]interface{} `json:"data"`
}

type SourceConfig struct {
	ID         int    `json:"id"`
	Port       int    `json:"port"`
	Protocol   string `json:"protocol"` // udp, tcp
	Parser     string `json:"parser"`   // syslog, json, etc.
	Name       string `json:"name"`
	PipelineID int    `json:"pipelineid"` // pipeline to process the log
}
