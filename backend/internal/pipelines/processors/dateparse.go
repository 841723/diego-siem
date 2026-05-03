package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
{"field": "string", "input_format": "string", "output_format": "string", "destination_field": "string"}
*/
type DateParse struct {
	Processor
	Field            string `json:"field"`
	InputFormat      string `json:"input_format"`
	OutputFormat     string `json:"output_format"`
	DestinationField string `json:"destination_field"`
}

func (p *DateParse) Process(logData model.LogData) error {
	// Implementa la lógica de procesamiento aquí
	return nil
}

func NewDateParseProcessor(config model.PipelineProcessorConfig) (*DateParse, error) {
	var DateParseConfig DateParse
	err := json.Unmarshal(config, &DateParseConfig)
	if err != nil {
		return nil, err
	}

	return &DateParseConfig, nil
}
