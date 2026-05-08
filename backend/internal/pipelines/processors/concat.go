package processors

import (
	"encoding/json"
	"strings"

	"backend/internal/model"
)

/*
{
	"fields": ["string"],
	"destination_field": "string",
	"delimiter": "string"
}
*/
type Concat struct {
	ProcessorMeta

	Fields           []string `json:"fields"`
	DestinationField string   `json:"destination_field"`
	Delimiter        string   `json:"delimiter"`
}

func (p *Concat) Process(logData model.LogData) error {
	var values []string
	for _, field := range p.Fields {
		if value, ok := logData[field].(string); ok {
			values = append(values, value)
		}
	}

	logData[p.DestinationField] = strings.Join(values, p.Delimiter)
	return nil
}

func NewConcatProcessor(config model.PipelineProcessorConfig) (*Concat, error) {
	var cfg Concat
	err := json.Unmarshal(config, &cfg)
	if err != nil {
		return nil, err
	}

	cfg.ProcessorMeta = WithMeta("Concat", "Concatenates multiple string fields into a single field with a specified delimiter", "{\"fields\": [\"string\"], \"destination_field\": \"string\", \"delimiter\": \"string\"}")
	return &cfg, nil
}

func init() {
	Register("Concat", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewConcatProcessor(config)
	})
}