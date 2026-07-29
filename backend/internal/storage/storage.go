package storage

import (
	"fmt"
	"strconv"

	"backend/internal/model"
	"backend/internal/pipelines/processors"
	"backend/internal/storage/db"
)

type Storage struct {
	clickhouse *db.ClickHouseDB
	postgres   *db.PostgreSQLDB

	maxDepth int
}

func NewStorage() *Storage {
	return &Storage{
		clickhouse: db.NewClickHouseDB(),
		postgres:   db.NewPostgreSQLDB(),
		maxDepth:   2,
	}
}

/*
*********************************************************

	Logs

*********************************************************
*/
func formatLogForStorage(value interface{}, fieldType string) (interface{}, error) {
	switch fieldType {
	case "text":
		strValue, ok := value.(string)
		if !ok {
			return nil, fmt.Errorf("expected string value for field, got %T", value)
		}
		return strValue, nil
	case "int":
		var intVal int64
		var err error
		switch v := value.(type) {
		case float64:
			intVal = int64(v)
		case string:
			intVal, err = strconv.ParseInt(v, 10, 32)
			if err != nil {
				return nil, fmt.Errorf("cannot parse string '%s' as int32: %w", v, err)
			}
		default:
			return nil, fmt.Errorf("expected numeric or string value for int field, got %T", value)
		}
		return int32(intVal), nil
	case "float":
		floatValue, ok := value.(float64)
		if !ok {
			return nil, fmt.Errorf("expected numeric value for field, got %T", value)
		}
		return floatValue, nil
	case "bool":
		boolValue, ok := value.(bool)
		if !ok {
			return nil, fmt.Errorf("expected boolean value for field, got %T", value)
		}
		return boolValue, nil

	case "uuid":
		strValue, ok := value.(model.ID)
		if !ok {
			return nil, fmt.Errorf("expected string value for uuid field, got %T", value)
		}
		return strValue, nil
	default:
		return nil, fmt.Errorf("unsupported field type: %s", fieldType)
	}
}

func (s *Storage) StoreLog(log model.Log) error {
	logToStore := map[string]interface{}{
		"timestamp": log.Timestamp,
		"sourceid":  log.SourceID,
		"logid":     log.ID,
	}

	mappings, err := s.GetMappings()
	if err != nil {
		return fmt.Errorf("failed to get mappings: %w", err)
	}

	for _, mapping := range mappings {
		var valueToFormat interface{}
		if value, ok := log.Data[mapping.FieldName]; ok {
			valueToFormat = value
		} else if mapping.DefaultValue != "" {
			valueToFormat = mapping.DefaultValue
		} else {
			valueToFormat = nil
		}
		formattedValue, err := formatLogForStorage(valueToFormat, mapping.FieldType.TypeName)
		if err == nil {
			logToStore[mapping.FieldName] = formattedValue
			delete(log.Data, mapping.FieldName)
		}
	}

	logToStore["data"] = log.Data

	return s.clickhouse.LogToDB(logToStore)
}

func (s *Storage) GetLogs(params model.GetLogsRequest) ([]model.Log, error) {
	dynamicColumns, err := s.GetMappings()
	if err != nil {
		return nil, fmt.Errorf("failed to get mappings: %w", err)
	}
	return s.clickhouse.GetLogsFromDB(params, dynamicColumns)
}

func (s *Storage) CountLogs(params model.GetLogsRequest) (int, error) {
	return s.clickhouse.CountLogsFromDB(params)
}

func (s *Storage) DeleteLogs() error {
	return s.clickhouse.DeleteLogsFromDB()
}

/*
*********************************************************

	Aggs

*********************************************************
*/
func (s *Storage) GetMeanOfField(req model.GetLogsRequest, fieldName string) (float64, error) {
	return s.clickhouse.GetMeanOfFieldFromDB(req, fieldName)
}

func (s *Storage) StatsLogs(req model.GetLogsRequest, aggs model.AggsParam) (model.StatsAggResult, error) {
	return s.clickhouse.StatsLogsFromDB(req, aggs)
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

func (s *Storage) ClearSources() error {
	return s.postgres.ClearSourcesFromDB()
}

func (s *Storage) DeleteSourceByID(sourceID model.ID) error {
	return s.postgres.DeleteSourceByIDFromDB(sourceID)
}

/*******************************************************

						Columns

**********************************************************/

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

func (s *Storage) SourceUsesPipeline(sourcePipelineID, updatedPipelineID model.ID) bool {
	// true if sourcePipelineID == updatedPipelineID or if sourcePipelineID uses updatedPipelineID as a sub-pipeline
	pipelinesAlreadyChecked := make(map[model.ID]struct{})

	pipelinesToCheck := make(map[model.ID]struct{})
	pipelinesToCheck[sourcePipelineID] = struct{}{}

	for depth := 0; depth < s.maxDepth; depth++ {
		for pipelineID := range pipelinesToCheck {
			pipelinesAlreadyChecked[pipelineID] = struct{}{}

			if pipelineID == updatedPipelineID {
				fmt.Printf("Pipeline %s uses updated pipeline %s\n", sourcePipelineID, updatedPipelineID)
				return true
			}
			subPipelines, err := s.postgres.GetSubPipelinesFromDB(pipelineID)
			if err != nil {
				return false
			}

			for _, subPipelineID := range subPipelines {
				if _, checked := pipelinesAlreadyChecked[subPipelineID]; !checked {
					pipelinesToCheck[subPipelineID] = struct{}{}
				}
			}
		}
	}

	return false
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

// func (s *Storage) UpdateProcessorInPipeline(processor model.PipelineProcessor) error {
// 	return s.postgres.UpdateProcessorInPipelineInDB(processor)
// }

func (s *Storage) UpdateProcessorsInPipeline(pipelineID model.ID, processors []model.PipelineProcessor) error {
	// Clear existing processors
	err := s.postgres.ClearProcessorsFromPipelineInDB(pipelineID)
	if err != nil {
		return err
	}

	for index, processor := range processors {
		processor.PipelineID = pipelineID
		processor.OrderInPipeline = index
		_, err := s.AddProcessorToPipeline(processor)
		if err != nil {
			fmt.Printf("Failed to add processor %s to pipeline %s: %v\n", processor.ProcessorID, pipelineID, err)
			return err
		}
	}

	return nil
}

func (s *Storage) DeleteProcessorFromPipeline(processorID model.ID) error {
	return s.postgres.DeleteProcessorFromPipelineInDB(processorID)
}

func appendAndUpdate(existing []model.PipelineProcessor, toAdd ...model.PipelineProcessor) []model.PipelineProcessor {
	maxOrder := -1
	if len(existing) > 0 {
		maxOrder = existing[len(existing)-1].OrderInPipeline
	}

	for _, newProcessor := range toAdd {
		newProcessor.OrderInPipeline = maxOrder + 1
		existing = append(existing, newProcessor)
		maxOrder++
	}

	return existing
}

func (s *Storage) GetCompiledPipelineByPipelineID(pipelineID model.ID) ([]model.PipelineProcessor, error) {
	response, err := s.postgres.GetProcessorsFromPipelineInDB(pipelineID)
	if err != nil {
		return nil, err
	}
	newResponse := []model.PipelineProcessor{}

	for depth := 1; depth < s.maxDepth; depth++ {

		for _, processor := range response {
			processorsToAdd := []model.PipelineProcessor{}

			if processor.Processor.Name == processors.GetCallPipelineProcessorName() {
				// processor is a call pipeline processor
				parsedConfig, err := processors.NewCallPipelineProcessor(processor.Config)
				if err != nil {
					return nil, err
				}
				parsedPipelineID, err := model.ParseAndCheckUUID(parsedConfig.PipelineID)
				if err != nil {
					return nil, err
				}
				processorsToAdd, err = s.postgres.GetProcessorsFromPipelineInDB(parsedPipelineID)
				if err != nil {
					return nil, err
				}
				newResponse = appendAndUpdate(newResponse, processorsToAdd...)
			} else {
				// processor is a normal processor, just add it to the list
				newResponse = appendAndUpdate(newResponse, processor)
			}
		}
		response = make([]model.PipelineProcessor, len(newResponse))
		copy(response, newResponse)
	}

	return response, nil
}

func (s *Storage) GetAllProcessors() ([]model.Processor, error) {
	return s.postgres.GetProcessorsFromDB()
}

func (s *Storage) GetProcessorsByID(pipelineID model.ID) ([]model.Processor, error) {
	return s.postgres.GetProcessorsByIDFromDB(pipelineID)
}

/*
*********************************************************

	Mappings

*********************************************************
*/
func (s *Storage) SetMappings(mappings []model.Mapping) error {
	existingMappings, err := s.GetMappings()
	if err != nil {
		return fmt.Errorf("failed to get existing mappings: %w", err)
	}

	existingMappingMap := make(map[string]model.Mapping)
	for _, mapping := range existingMappings {
		existingMappingMap[mapping.FieldName] = mapping
	}

	for _, mapping := range mappings {
		if existing, exists := existingMappingMap[mapping.FieldName]; exists {
			if existing.FieldTypeID != mapping.FieldTypeID || existing.DefaultValue != mapping.DefaultValue {
				// Mapping has changed, update it
				err := s.DeleteMapping(mapping.FieldName)
				if err != nil {
					return fmt.Errorf("failed to delete existing mapping for field %s: %w", mapping.FieldName, err)
				}
				err = s.AddMapping(mapping)
				if err != nil {
					return fmt.Errorf("failed to add updated mapping for field %s: %w", mapping.FieldName, err)
				}
			}
			delete(existingMappingMap, mapping.FieldName)
		} else {
			// New mapping, add it
			err := s.AddMapping(mapping)
			if err != nil {
				return fmt.Errorf("failed to add new mapping for field %s: %w", mapping.FieldName, err)
			}
		}
	}

	for fieldName := range existingMappingMap {
		// Mapping was removed, delete it
		err := s.DeleteMapping(fieldName)
		if err != nil {
			return fmt.Errorf("failed to delete old mapping for field %s: %w", fieldName, err)
		}
	}
	return nil
}

func (s *Storage) AddMapping(mapping model.Mapping) error {
	var err error
	var mappingExists bool
	_, mappingExists, err = s.postgres.GetMappingByFieldNameFromDB(mapping.FieldName)
	if err != nil {
		return fmt.Errorf("failed to check if mapping exists: %w", err)
	}
	if mappingExists {
		return nil
	}

	err = s.postgres.AddMappingToDB(mapping)
	if err != nil {
		return err
	}

	mapping.FieldType, err = s.GetMappingTypesByID(mapping.FieldTypeID)
	if err != nil {
		return fmt.Errorf("failed to get mapping type: %w", err)
	}

	err = s.AddColumnToLogs(mapping.FieldName, mapping.FieldType.TypeName)
	if err != nil {
		// Rollback mapping addition if adding column fails
		rollbackErr := s.postgres.DeleteMappingFromDB(mapping.FieldName)
		if rollbackErr != nil {
			fmt.Printf("Failed to rollback mapping addition for field %s: %v\n", mapping.FieldName, rollbackErr)
		}
		return fmt.Errorf("failed to add column for mapping: %w", err)
	}
	return nil
}

func (s *Storage) GetMappings() ([]model.Mapping, error) {
	return s.postgres.GetMappingsFromDB()
}

func (s *Storage) DeleteMapping(mappingID string) error {
	err := s.RemoveColumnFromLogs(mappingID)
	if err != nil {
		fmt.Printf("Failed to remove column for mapping %s: %v\n", mappingID, err)
		// Proceed with deleting the mapping even if column removal fails
	}

	err = s.postgres.DeleteMappingFromDB(mappingID)
	if err != nil {
		return fmt.Errorf("failed to delete mapping from DB: %w", err)
	}
	return nil
}

func (s *Storage) DeleteAllMappings() error {
	mappings, err := s.postgres.GetMappingsFromDB()
	if err != nil {
		return fmt.Errorf("failed to get mappings: %w", err)
	}

	for _, mapping := range mappings {
		err = s.DeleteMapping(mapping.FieldName)
		if err != nil {
			return fmt.Errorf("failed to delete mapping %s: %w", mapping.FieldName, err)
		}
	}
	return nil
}

/*
**********************************************************

	Mapping Types

*********************************************************
*/

func (s *Storage) GetMappingTypes() ([]model.MappingType, error) {
	return s.postgres.GetMappingTypesFromDB()
}

func (s *Storage) GetMappingTypesByID(typeID model.ID) (model.MappingType, error) {
	return s.postgres.GetMappingTypeByIDFromDB(typeID)
}
