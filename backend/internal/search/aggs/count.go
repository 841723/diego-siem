// avg.go
package aggs

import (
	"encoding/json"
	"fmt"

	"backend/internal/model"
	"backend/internal/storage"
)

type CountAgg struct {
	AggMeta

	Field string `json:"field"`
}

func NewCountAgg(config model.AggsParam) (Agg, error) {
	data, err := json.Marshal(config)
	if err != nil {
		fmt.Printf("Error marshaling config for count agg: %v\n", err)
		return nil, err
	}

	var cfg CountAgg
	err = json.Unmarshal(data, &cfg)
	if err != nil {
		fmt.Printf("Error unmarshaling config for count agg: %v\n", err)
		return nil, err
	}

	cfg.AggMeta = AggMeta{Name: "count"}
	return &cfg, nil
}

func (a *CountAgg) Aggregate(storage *storage.Storage, req model.GetLogsRequest) ([]model.AggsBucket, error) {
	count, err := storage.CountLogs(req)
	if err != nil {
		fmt.Printf("Error getting count of logs from storage: %v\n", err)
		return nil, err
	}

	return []model.AggsBucket{
		{
			Key:   "count",
			Value: count,
		},
	}, nil
}

func init() {
	Register("count", NewCountAgg)
}
