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
	ProcessorMeta

	DestinationField string `json:"destination_field"`
	Value            string `json:"value"`
}

func (p *Set) Process(logData model.LogData) error {
	logData[p.DestinationField] = p.Value
	return nil
}

func NewSetProcessor(config model.PipelineProcessorConfig) (*Set, error) {
	var cfg Set
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Set", "Asigna un valor fijo a un campo", "{\"destination_field\": \"string\", \"value\": \"string\"}")
	return &cfg, nil
}

func init() {
	Register("Set", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewSetProcessor(config)
	})
}
