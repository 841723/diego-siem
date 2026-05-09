package processors

import (
	"encoding/json"
	"errors"

	"backend/internal/model"
)

/*
	{
		"pipeline_id": "uuid"
	}
*/
type CallPipeline struct {
	ProcessorMeta

	PipelineID string `json:"pipeline_id"`
}

func (p *CallPipeline) Process(logData model.LogData) error {
	// La logica de llamada a otra pipeline se resuelve en el storage:
	// storage.GetProcessorsByPipelineID() devuelve los procesadores completos
	//  de la pipeline hasta X niveles de profundidad. Se sustituye el
	//  procesador "Call Pipeline" por los procesadores de la pipeline llamada.

	// Si ha llegado un "Call Pipeline" sin que se haya resuelto (porque se ha
	//  llegado al maxDepth), se devuelve un error para evitar procesar la log
	//  con un "Call Pipeline" sin resolver.

	return errors.New("Call Pipeline processor not resolved in storage layer")
}

func NewCallPipelineProcessor(config model.PipelineProcessorConfig) (*CallPipeline, error) {
	var cfg CallPipeline
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Call Pipeline", "Calls another pipeline and processes the results", "{\"pipeline_id\": \"uuid\"}")
	return &cfg, nil
}

func GetCallPipelineProcessorName() string {
	return "Call Pipeline"
}

func init() {
	Register("Call Pipeline", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewCallPipelineProcessor(config)
	})
}
