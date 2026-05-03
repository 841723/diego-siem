package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
{"ip_field": "string", "destination_field": "string"}
*/
type GeoIpEnrich struct {
	Processor
	IpField          string `json:"ip_field"`
	DestinationField string `json:"destination_field"`
}

func (p *GeoIpEnrich) Process(logData model.LogData) error {
	// Implementa la lógica de procesamiento aquí
	return nil
}

func NewGeoIpEnrichProcessor(config model.PipelineProcessorConfig) (*GeoIpEnrich, error) {
	var GeoIpEnrichConfig GeoIpEnrich
	err := json.Unmarshal(config, &GeoIpEnrichConfig)
	if err != nil {
		return nil, err
	}

	return &GeoIpEnrichConfig, nil
}
