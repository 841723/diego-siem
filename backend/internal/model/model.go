package model

import (
	"encoding/json"
	"time"
)

/*
**************************************************************

	Data Models

**************************************************************
*/

// type ID defined in id.go

type LogData = map[string]interface{}

type Log struct {
	Raw       string    `json:"raw"`
	ID        ID        `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	SourceID  ID        `json:"sourceid"`
	Data      LogData   `json:"data"`
}

type SourceConfig struct {
	ID         ID     `json:"id"`
	Port       int    `json:"port"`
	Protocol   string `json:"protocol"` // udp, tcp
	Parser     string `json:"parser"`   // syslog, json, etc.
	Name       string `json:"name"`
	PipelineID ID     `json:"pipelineid"` // pipeline to process the log
}

type Pipeline struct {
	ID          ID     `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type ProcessorSchema = json.RawMessage

type Processor struct {
	ID          ID              `json:"id"`
	Description string          `json:"description"`
	Name        string          `json:"name"`   // e.g., "filter", "enrich", "transform"
	Schema      ProcessorSchema `json:"schema"` // JSON or other format for processor configuration
}

type PipelineProcessorConfig = json.RawMessage

type PipelineProcessor struct {
	ID              ID                      `json:"id"`
	PipelineID      ID                      `json:"pipelineid"`
	ProcessorID     ID                      `json:"processorid"`
	Config          PipelineProcessorConfig `json:"config"` // JSON configuration specific to this processor in the pipeline
	OrderInPipeline int                     `json:"order"`  // Order of execution in the pipeline
	Pipeline        Pipeline
	Processor       Processor
}

type MappingType struct {
	ID          ID     `json:"id"`
	TypeName    string `json:"typename"`    // e.g., "string", "integer", "timestamp"
	DisplayName string `json:"displayname"` // e.g., "String", "Integer", "Timestamp"
}

type Mapping struct {
	FieldName    string `json:"fieldname"`
	FieldTypeID  ID     `json:"fieldtypeid"`
	DefaultValue string `json:"defaultvalue"`
	FieldType    MappingType
}

/*
**************************************************************

	API Body Arguments

**************************************************************
*/

type QueryParams struct {
	// Define your query parameters here, e.g.:
	Match map[string]interface{} `json:"match,omitempty"`
	Range map[string]interface{} `json:"range,omitempty"`
	// Add more query types as needed
}
type AggsParam struct {
	Type     string `json:"type"` // e.g., "terms", "histogram", "avg"
	Name     string `json:"name"`
	Field    string `json:"field"`
	Interval string `json:"interval,omitempty"` // Only for histogram
}

type GetLogsRequest struct {
	TimeWindow    string      `json:"timeWindow"`
	From          int         `json:"from"`
	Size          int         `json:"size"`
	Query         QueryParams `json:"query"`
	Aggs          []AggsParam `json:"aggs"`
	SourceID      ID
	TimestampFrom string
	TimestampTo   string
}

type ColumnRequest struct {
	ColumnName string `json:"column_name"`
	DataType   string `json:"data_type"`
}

type FullPipelineResponse struct {
	Pipeline   Pipeline            `json:"pipeline"`
	Processors []PipelineProcessor `json:"processors"`
}

type GetLogsResponse struct {
	Logs  []Log                   `json:"logs"`
	Total int                     `json:"total"`
	Aggs  map[string][]AggsBucket `json:"aggs,omitempty"`
}

type AggsBucket struct {
	Key      interface{} `json:"key"`
	Value    interface{} `json:"value,omitempty"`
	DocCount int         `json:"doc_count,omitempty"`
}

/*
**************************************************************

	Utility Functions

**************************************************************
*/
type StatsAggResult struct {
	Field      string   `json:"field"`
	Count      uint64   `json:"count"`
	Avg        *float64 `json:"avg"`
	Min        *float64 `json:"min"`
	Max        *float64 `json:"max"`
	Sum        *float64 `json:"sum"`
	IsDatetime bool     `json:"is_datetime"` // útil para que el frontend formatee los valores
}
