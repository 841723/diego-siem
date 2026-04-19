package logs

type Log struct {
	Service   string `json:"service"`
	Message   string `json:"message"`
	Level     string `json:"level"`
	Timestamp int64  `json:"timestamp"`
}