package model

import (
	"time"
)

type Log struct {
	ID        ID                     `json:"id"`
	Timestamp time.Time              `json:"timestamp"`
	SourceID  ID                     `json:"sourceid"`
	Data      map[string]interface{} `json:"data"`
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

type PipelineProcessor struct {
	ID         ID     `json:"id"`
	PipelineID ID     `json:"pipelineid"`
	Type       string `json:"type"`   // e.g., "filter", "enrich", "transform"
	Config     string `json:"config"` // JSON or other format for processor configuration
}

type MappingType struct {
	ID       ID     `json:"id"`
	TypeName string `json:"type_name"` // e.g., "string", "integer", "timestamp"
}

type Mapping struct {
	FieldName    string `json:"field_name"`
	FieldTypeID  ID     `json:"field_type_id"`
	DefaultValue string `json:"default_value"`
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
