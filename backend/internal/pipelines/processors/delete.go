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
	Processor
	Field string `json:"field"`
}

func (p *Delete) Process(logData model.LogData) error {
	delete(logData, p.Field)
	return nil
}

func NewDeleteProcessor(config model.PipelineProcessorConfig) (*Delete, error) {
	var DeleteConfig Delete
	err := json.Unmarshal(config, &DeleteConfig)
	if err != nil {
		return nil, err
	}

	return &DeleteConfig, nil
}
