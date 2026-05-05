package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
{"source_field": "string", "destination_field": "string"
*/
type Copy struct {
	Processor
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
	var CopyConfig Copy
	err := json.Unmarshal(config, &CopyConfig)
	if err != nil {
		return nil, err
	}

	return &CopyConfig, nil
}
