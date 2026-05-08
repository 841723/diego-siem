package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
	{
	}
*/
type Drop struct {
	ProcessorMeta
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

	DropConfig.ProcessorMeta = WithMeta("Drop", "Drops the log entry if a field matches a certain value", "{}")
	return &DropConfig, nil
}

func init() {
	Register("Drop", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewDropProcessor(config)
	})
}