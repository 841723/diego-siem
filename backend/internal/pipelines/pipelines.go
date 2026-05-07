package pipelines

import (
	"fmt"

	"backend/internal/model"
	"backend/internal/pipelines/processors"
)

func ProcessLog(log model.Log, pipeline_processors []model.PipelineProcessor) (model.Log, error) {
	for _, processor := range pipeline_processors {
		err := processors.Process(processor, &log.Data)
		if err != nil {
			fmt.Printf("Error processing log with processor %s: %v\n", processor.ProcessorID, err)
			return log, err
		}
	}

	return log, nil
}
