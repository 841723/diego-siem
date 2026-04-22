package pipelines

import "backend/internal/model"

func ProcessLog(log model.Log, pipeline_id string) (model.Log, error) {
	return log, nil
}

func StorageLog(log model.Log, index_id string) error {
	return nil
}