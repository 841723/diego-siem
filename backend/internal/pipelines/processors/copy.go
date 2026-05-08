package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
	{
		"source_field": "string",
		"destination_field": "string"
	}
*/
type Copy struct {
	ProcessorMeta

	SourceField      string `json:"source_field"`
	DestinationField string `json:"destination_field"`
}

func (p *Copy) Process(logData model.LogData) error {
	value, exists := logData[p.SourceField]
	if !exists {
		return nil
	}

	logData[p.DestinationField] = value

	return nil
}

func NewCopyProcessor(config model.PipelineProcessorConfig) (*Copy, error) {
	var cfg Copy
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Copy", "Copies a field from one location to another in the log data", "{\"source_field\": \"string\", \"destination_field\": \"string\"}")
	return &cfg, nil
}

func init() {
	Register("Copy", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewCopyProcessor(config)
	})
}