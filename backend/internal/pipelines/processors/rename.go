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

type Rename struct {
	ProcessorMeta

	DestinationField string `json:"destination_field"`
	SourceField      string `json:"source_field"`
}

func (p *Rename) Process(logData model.LogData) error {
	logData[p.DestinationField] = logData[p.SourceField]
	delete(logData, p.SourceField)
	return nil
}

func NewRenameProcessor(config model.PipelineProcessorConfig) (*Rename, error) {
	var cfg Rename
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Rename", "Renombra un campo a otro nombre", "{\"source_field\": \"string\", \"destination_field\": \"string\"}")
	 
	return &cfg, nil
}

func init() {
	Register("Rename", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewRenameProcessor(config)
	})
}