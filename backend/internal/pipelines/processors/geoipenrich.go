package processors

import (
	"encoding/json"

	"backend/internal/model"
)

/*
{"ip_field": "string", "destination_field": "string"}
*/
type GeoIpEnrich struct {
	ProcessorMeta

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

	GeoIpEnrichConfig.ProcessorMeta = WithMeta("GeoIP Enrich", "Enriquece los datos de una dirección IP con información geográfica", "{\"ip_field\": \"string\", \"destination_field\": \"string\"}")
	return &GeoIpEnrichConfig, nil
}

func init() {
	Register("GeoIP Enrich", func(config model.PipelineProcessorConfig) (Processor, error) {
		return NewGeoIpEnrichProcessor(config)
	})
}