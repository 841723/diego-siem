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
	ProcessorMeta

	Field string `json:"field"`
}

func (p *Lowercase) Process(logData model.LogData) error {
	logData[p.Field] = strings.ToLower(logData[p.Field].(string))
	return nil
}

func NewLowercaseProcessor(config model.PipelineProcessorConfig) (*Lowercase, error) {
	var cfg Lowercase
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Lowercase", "Convierte el valor de un campo a minúsculas", "{\"field\": \"string\"}")
	return &cfg, nil
}

func init() {
	Register("Lowercase", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewLowercaseProcessor(config)
	})
}