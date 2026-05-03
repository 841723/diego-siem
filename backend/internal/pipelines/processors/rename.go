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
	Processor
	DestinationField string `json:"destination_field"`
	SourceField      string `json:"source_field"`
}

func (p *Rename) Process(logData model.LogData) error {
	logData[p.DestinationField] = logData[p.SourceField]
	delete(logData, p.SourceField)
	return nil
}

func NewRenameProcessor(config model.PipelineProcessorConfig) (*Rename, error) {
	var RenameConfig Rename
	err := json.Unmarshal(config, &RenameConfig)
	if err != nil {
		return nil, err
	}

	return &RenameConfig, nil
}
