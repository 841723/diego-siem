package storage

import (
	"fmt"

	"backend/internal/model"
	"backend/internal/storage/db"
)

type Storage struct {
	clickhouse *db.ClickHouseDB
	postgres   *db.PostgreSQLDB
}

func NewStorage() *Storage {
	return &Storage{
		clickhouse: db.NewClickHouseDB(),
		postgres:   db.NewPostgreSQLDB(),
	}
}

/**********************************************************

						Logs

**********************************************************/

func (s *Storage) StoreLog(log model.Log) error {
	return s.clickhouse.LogToDB(log)
}

func (s *Storage) GetLogs(params model.GetLogsParams) ([]model.Log, error) {
	var err error
	// params.TimestampFrom, params.TimestampTo, err = lib.ClickHouse_FormatTimeWindow(params.TimeWindow)
	fmt.Printf("Received GetLogs request with TimeWindow: %s\n", params.TimeWindow)
	if err != nil {
		return nil, fmt.Errorf("failed to format time window: %w", err)
	}
	return s.clickhouse.GetLogsFromDB(params)
}

func (s *Storage) CountLogs(params model.GetLogsParams) (int, error) {
	return s.clickhouse.CountLogsFromDB(params)
}

func (s *Storage) DeleteLogs() error {
	return s.clickhouse.DeleteLogsFromDB()
}

/**********************************************************

						Sources

**********************************************************/

func (s *Storage) GetSources() ([]model.SourceConfig, error) {
	return s.postgres.GetSourcesFromDB()
}

func (s *Storage) GetSourceByID(id model.ID) (*model.SourceConfig, error) {
	return s.postgres.GetSourceByIDFromDB(id)
}

func (s *Storage) GetSourceByPortAndProtocol(port int, protocol string) (*model.SourceConfig, error) {
	return s.postgres.GetSourceByPortAndProtocolFromDB(port, protocol)
}

func (s *Storage) AddSource(source model.SourceConfig) (model.ID, error) {
	return s.postgres.AddSourceToDB(source)
}

func (s *Storage) UpdateSource(source model.SourceConfig) error {
	return s.postgres.UpdateSourceInDB(source)
}

func (s *Storage) DeleteSource(sourceID model.ID) error {
	return s.postgres.DeleteSourceFromDB(sourceID)
}

func (s *Storage) ClearSources() error {
	return s.postgres.ClearSourcesFromDB()
}

func (s *Storage) DeleteSourceByID(sourceID model.ID) error {
	return s.postgres.DeleteSourceByIDFromDB(sourceID)
}

func (s *Storage) AddColumnToLogs(columnName, dataType string) error {
	if ok, err := s.postgres.IsValidMappingType(dataType); !ok {
		return fmt.Errorf("invalid mapping type: %w", err)
	}
	return s.clickhouse.AddColumnToLogsInDB(columnName, dataType)
}

func (s *Storage) RemoveColumnFromLogs(columnName string) error {
	return s.clickhouse.RemoveColumnFromLogsInDB(columnName)
}

/*
*********************************************************

	Pipelines

*********************************************************
*/
func (s *Storage) AddPipeline(pipeline model.Pipeline) (model.ID, error) {
	return s.postgres.AddPipelineToDB(pipeline)
}

func (s *Storage) GetPipelines() ([]model.Pipeline, error) {
	return s.postgres.GetPipelinesFromDB()
}

func (s *Storage) GetPipelineByID(id model.ID) (*model.Pipeline, error) {
	return s.postgres.GetPipelineByIDFromDB(id)
}

func (s *Storage) UpdatePipeline(pipeline model.Pipeline) error {
	return s.postgres.UpdatePipelineInDB(pipeline)
}

func (s *Storage) DeletePipeline(pipelineID model.ID) error {
	return s.postgres.DeletePipelineFromDB(pipelineID)
}

func (s *Storage) ClearPipelines() error {
	return s.postgres.ClearPipelinesFromDB()
}

func (s *Storage) DeletePipelineByID(pipelineID model.ID) error {
	return s.postgres.DeletePipelineByIDFromDB(pipelineID)
}

/*********************************************************

	Processors

*********************************************************
*/

func (s *Storage) AddProcessorToPipeline(processor model.PipelineProcessor) (model.ID, error) {
	return s.postgres.AddProcessorToPipelineInDB(processor)
}

func (s *Storage) GetProcessorsFromPipeline(pipelineID model.ID) ([]model.PipelineProcessor, error) {
	return s.postgres.GetProcessorsFromPipelineInDB(pipelineID)
}

func (s *Storage) UpdateProcessorInPipeline(processor model.PipelineProcessor) error {
	return s.postgres.UpdateProcessorInPipelineInDB(processor)
}

func (s *Storage) DeleteProcessorFromPipeline(processorID model.ID) error {
	return s.postgres.DeleteProcessorFromPipelineInDB(processorID)
}


/**********************************************************

	Mappings

*********************************************************
*/
func (s *Storage) AddMapping(mapping model.Mapping) error {
	return s.postgres.AddMappingToDB(mapping)
}

func (s *Storage) GetMappings() ([]model.Mapping, error) {
	return s.postgres.GetMappingsFromDB()
}

func (s *Storage) DeleteMappings() error {
	return s.postgres.DeleteMappingsFromDB()
}

/*
**********************************************************

	Mapping Types

*********************************************************
*/

func (s *Storage) GetMappingTypes() ([]model.MappingType, error) {
	return s.postgres.GetMappingTypesFromDB()
}

