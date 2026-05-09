// avg.go
package aggs

import (
	"encoding/json"
	"fmt"

	"backend/internal/model"
	"backend/internal/storage"
)

type AvgAgg struct {
	AggMeta

	Field string `json:"field"`
}

func NewAvgAgg(config model.AggsParam) (Agg, error) {
	data, err := json.Marshal(config)
	if err != nil {
		fmt.Printf("Error marshaling config for avg agg: %v\n", err)
		return nil, err
	}

	var cfg AvgAgg
	err = json.Unmarshal(data, &cfg)
	if err != nil {
		fmt.Printf("Error unmarshaling config for avg agg: %v\n", err)
		return nil, err
	}

	cfg.AggMeta = AggMeta{Name: "avg"}
	return &cfg, nil
}

func (a *AvgAgg) Aggregate(storage *storage.Storage, req model.GetLogsRequest) ([]model.AggsBucket, error) {
	mean, err := storage.GetMeanOfField(req, a.Field)
	if err != nil {
		fmt.Printf("Error getting mean of field from storage: %v\n", err)
		return nil, err
	}

	return []model.AggsBucket{
		{
			Key:   "avg",
			Value: mean,
		},
	}, nil
}

func init() {
	Register("avg", NewAvgAgg)
}
