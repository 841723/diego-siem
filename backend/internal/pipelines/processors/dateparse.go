package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
{"field": "string", "input_format": "string", "output_format": "string", "destination_field": "string"}
*/
type DateParse struct {
	ProcessorMeta

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
	var cfg DateParse
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Date Parse", "Parses a date from a string field and formats it to a new field", "{\"field\": \"string\", \"input_format\": \"string\", \"output_format\": \"string\", \"destination_field\": \"string\"}")
	return &cfg, nil
}

func init() {
	Register("Date Parse", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewDateParseProcessor(config)
	})
}
