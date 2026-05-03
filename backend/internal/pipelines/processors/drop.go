package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
	{
		"field": "string",
		"value": "string"
	}
*/
type Drop struct {
	Processor
	Field string `json:"field"`
	Value string `json:"value"`
}

func (p *Drop) Process(logData model.LogData) error {
	// Implementa la lógica de procesamiento aquí
	return nil
}

func NewDropProcessor(config model.PipelineProcessorConfig) (*Drop, error) {
	var DropConfig Drop
	err := json.Unmarshal(config, &DropConfig)
	if err != nil {
		return nil, err
	}

	return &DropConfig, nil
}
