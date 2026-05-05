package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
	{
		"pipeline_id": "uuid"
	}
*/
type CallPipeline struct {
	Processor
	PipelineID string `json:"pipeline_id"`
}

func (p *CallPipeline) Process(logData model.LogData) error {
	// Implementa la lógica de procesamiento aquí
	return nil
}

func NewCallPipelineProcessor(config model.PipelineProcessorConfig) (*CallPipeline, error) {
	var CallPipelineConfig CallPipeline
	err := json.Unmarshal(config, &CallPipelineConfig)
	if err != nil {
		return nil, err
	}

	return &CallPipelineConfig, nil
}
