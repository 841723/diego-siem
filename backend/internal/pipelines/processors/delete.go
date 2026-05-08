package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
	{
		"field": "string"
	}
*/
type Delete struct {
	ProcessorMeta

	Field string `json:"field"`
}

func (p *Delete) Process(logData model.LogData) error {
	delete(logData, p.Field)
	return nil
}

func NewDeleteProcessor(config model.PipelineProcessorConfig) (*Delete, error) {
	var cfg Delete
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Delete", "Elimina un campo de los datos del log", "{\"field\": \"string\"}")
	return &cfg, nil
}

func init() {
	Register("Delete", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewDeleteProcessor(config)
	})
}