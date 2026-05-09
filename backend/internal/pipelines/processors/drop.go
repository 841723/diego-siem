package processors

import (
	"encoding/json"
	"errors"

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
	return GetDropProcessorError() 
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

// dropProcessorError.Error()
var errDropProcessor = errors.New("Log dropped by Drop processor")
func GetDropProcessorError() error {
	return errDropProcessor
}

func init() {
	Register("Drop", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewDropProcessor(config)
	})
}
