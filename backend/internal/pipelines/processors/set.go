package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
{
	"destination_field": "string", 
	"value": "string"
}
*/
type Set struct {
	Processor
	DestinationField string `json:"destination_field"`
	Value            string `json:"value"`
}

func (p *Set) Process(logData model.LogData) error {
	logData[p.DestinationField] = p.Value
	return nil
}

func NewSetProcessor(config model.PipelineProcessorConfig) (*Set, error) {
	var SetConfig Set
	err := json.Unmarshal(config, &SetConfig)
	if err != nil {
		return nil, err
	}

	return &SetConfig, nil
}
