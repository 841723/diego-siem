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
	ProcessorMeta

	PipelineID string `json:"pipeline_id"`
}

func (p *CallPipeline) Process(logData model.LogData) error {
	// Implementa la lógica de procesamiento aquí
	return nil
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

func init() {
	Register("Call Pipeline", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewCallPipelineProcessor(config)
	})
}
