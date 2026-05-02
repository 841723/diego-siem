package pipelines

import (
	"backend/internal/model"
)

func ProcessLog(log model.Log, pipeline_id model.ID) (model.Log, error) {
	log.Data["processed"] = true
	return log, nil
}
