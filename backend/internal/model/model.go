package model

import (
	"encoding/json"
	"time"
)

type LogData = map[string]interface{}

type Log struct {
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
	ID          ID                      `json:"id"`
	PipelineID  ID                      `json:"pipelineid"`
	ProcessorID ID                      `json:"processorid"`
	Config      PipelineProcessorConfig `json:"config"` // JSON configuration specific to this processor in the pipeline
	Pipeline    Pipeline
	Processor   Processor
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
}

/*
**************************************************************

	API Body Arguments

**************************************************************
*/
type GetLogsParams struct {
	TimeWindow    string `json:"timeWindow"`
	From          int    `json:"from"`
	Size          int    `json:"size"`
	SourceID      ID     `json:"sourceid"`
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
