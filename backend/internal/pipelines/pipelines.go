package pipelines

import (
	"fmt"

	"backend/internal/model"
	"backend/internal/pipelines/processors"
)

func ProcessLog(log model.Log, pipeline_id model.ID) (model.Log, error) {	
	pipeline_processors, err := getPipelineProcessors(pipeline_id)
	if err != nil {
		return log, err
	}

	for _, processor := range pipeline_processors {
		err := processors.Process(processor, &log.Data)
		if err != nil {
			fmt.Printf("Error processing log with processor %s: %v\n", processor.ProcessorID, err)
			return log, err
		}
	}

	return log, nil
}

func getPipelineProcessors(pipeline_id model.ID) ([]model.PipelineProcessor, error) {	
	return []model.PipelineProcessor{
		// {
		// 	ID:         model.GenerateUUID(),
		// 	PipelineID: pipeline_id,
		// 	ProcessorID: ,
		// 	Config:     json.RawMessage(`{"destination_field": "processed", "value": "false"}`),
		// },
		// {
		// 	ID:         model.GenerateUUID(),
		// 	PipelineID: pipeline_id,
		// 	ProcessorID: "copy",
		// 	Config:     json.RawMessage(`{"source_field": "processed", "destination_field": "processed_copy"}`),
		// },
		// {
		// 	ID:         model.GenerateUUID(),
		// 	PipelineID: pipeline_id,
		// 	ProcessorID: "rename",
		// 	Config:     json.RawMessage(`{"source_field": "processed_copy", "destination_field": "renamed_field"}`),
		// },
		// {
		// 	ID:         model.GenerateUUID(),
		// 	PipelineID: pipeline_id,
		// 	ProcessorID: "rename",
		// 	Config:     json.RawMessage(`{"source_field": "numseq", "destination_field": "sequence_number"}`),
		// },

	}, nil
}
