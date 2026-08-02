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
		"raw":       log.Raw,
		"timestamp": log.Timestamp,
		"sourceid":  log.SourceID,
		"logid":     log.ID,
		"data":      log.Data,
	}

	return s.clickhouse.LogToDB(logToStore)
}

func (s *Storage) GetLogs(params model.GetLogsRequest) ([]model.Log, error) {
	return s.clickhouse.GetLogsFromDB(params)
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

/**********************************************************

	Pipelines

**********************************************************/
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
