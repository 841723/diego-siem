// avg.go
package aggs

import (
	"encoding/json"
	"fmt"

	"backend/internal/model"
	"backend/internal/storage"
)

type StatsAgg struct {
	AggMeta

	Field string `json:"field"`
}

func NewStatsAgg(config model.AggsParam) (Agg, error) {
	data, err := json.Marshal(config)
	if err != nil {
		fmt.Printf("Error marshaling config for stats agg: %v\n", err)
		return nil, err
	}

	var cfg StatsAgg
	err = json.Unmarshal(data, &cfg)
	if err != nil {
		fmt.Printf("Error unmarshaling config for stats agg: %v\n", err)
		return nil, err
	}

	cfg.AggMeta = WithAggMeta("stats", config)
	return &cfg, nil
}

func (a *StatsAgg) Aggregate(storage *storage.Storage, req model.GetLogsRequest) ([]model.AggsBucket, error) {
	data, err := storage.StatsLogs(req, a.AggMeta.AggsParam)
	if err != nil {
		fmt.Printf("Error getting stats of logs from storage: %v\n", err)
		return nil, err
	}

	buckets := []model.AggsBucket{
		{Key: "count", Value: data.Count},
		{Key: "avg", Value: data.Avg},
		{Key: "min", Value: data.Min},
		{Key: "max", Value: data.Max},
		{Key: "sum", Value: data.Sum},
	}

	return buckets, nil
}

func init() {
	Register("stats", NewStatsAgg)
}
