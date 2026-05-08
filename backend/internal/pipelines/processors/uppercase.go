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
	ProcessorMeta

	Field string `json:"field"`
}

func (p *Uppercase) Process(logData model.LogData) error {
	logData[p.Field] = strings.ToUpper(logData[p.Field].(string))
	return nil
}

func NewUppercaseProcessor(config model.PipelineProcessorConfig) (*Uppercase, error) {
	var cfg Uppercase
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Uppercase", "Convierte el valor de un campo a mayúsculas", "{\"field\": \"string\"}")
	return &cfg, nil
}

func init() {
	Register("Uppercase", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewUppercaseProcessor(config)
	})
}
