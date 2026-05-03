package processors

import (
	"encoding/json"
	"strings"

	"backend/internal/model"
)

/*
{"field": "string"}
*/
type Lowercase struct {
	Processor
	Field string `json:"field"`
}

func (p *Lowercase) Process(logData model.LogData) error {
	logData[p.Field] = strings.ToLower(logData[p.Field].(string))
	return nil
}

func NewLowercaseProcessor(config model.PipelineProcessorConfig) (*Lowercase, error) {
	var LowercaseConfig Lowercase
	err := json.Unmarshal(config, &LowercaseConfig)
	if err != nil {
		return nil, err
	}

	return &LowercaseConfig, nil
}
