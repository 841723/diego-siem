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
	Processor
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
	var ConcatConfig Concat
	err := json.Unmarshal(config, &ConcatConfig)
	if err != nil {
		return nil, err
	}

	return &ConcatConfig, nil
}
