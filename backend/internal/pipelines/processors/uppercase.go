package processors

import (
	"encoding/json"
	"strings"

	"backend/internal/model"
)

/*
{"field": "string"}
*/
type Uppercase struct {
	Processor
	Field string `json:"field"`
}

func (p *Uppercase) Process(logData model.LogData) error {
	logData[p.Field] = strings.ToUpper(logData[p.Field].(string))
	return nil
}

func NewUppercaseProcessor(config model.PipelineProcessorConfig) (*Uppercase, error) {
	var UppercaseConfig Uppercase
	err := json.Unmarshal(config, &UppercaseConfig)
	if err != nil {
		return nil, err
	}

	return &UppercaseConfig, nil
}
