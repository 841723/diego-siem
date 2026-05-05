package processors

import (
	"encoding/json"
	"regexp"

	"backend/internal/model"
)

/*
{"field": "string", "regex": "string", "destination_field": "string"}
*/
type RegexExtract struct {
	Processor
	Field            string `json:"field"`
	Regex            string `json:"regex"`
	DestinationField string `json:"destination_field"`
}

func (p *RegexExtract) Process(logData model.LogData) error {
	re, err := regexp.Compile(p.Regex)
	if err != nil {
		return err
	}

	matches := re.FindStringSubmatch(logData[p.Field].(string))
	if len(matches) > 1 {
		logData[p.DestinationField] = matches[1]
	} else {
		logData[p.DestinationField] = ""
	}

	return nil
}

func NewRegexExtractProcessor(config model.PipelineProcessorConfig) (*RegexExtract, error) {
	var RegexExtractConfig RegexExtract
	err := json.Unmarshal(config, &RegexExtractConfig)
	if err != nil {
		return nil, err
	}

	return &RegexExtractConfig, nil
}
