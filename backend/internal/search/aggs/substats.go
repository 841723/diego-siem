package aggs

import (
	"encoding/json"
	"fmt"

	"backend/internal/model"
	"backend/internal/storage"
)

type SubStatsAgg struct {
	AggMeta

	Field string `json:"field"`
}

func NewSubStatsAgg(config model.AggsParam) (Agg, error) {
	data, err := json.Marshal(config)
	if err != nil {
		fmt.Printf("Error marshaling config for %s agg: %v\n", config.Name, err)
		return nil, err
	}

	var cfg SubStatsAgg
	err = json.Unmarshal(data, &cfg)
	if err != nil {
		fmt.Printf("Error unmarshaling config for %s agg: %v\n", config.Name, err)
		return nil, err
	}

	cfg.AggMeta = WithAggMeta(config.Name, config)
	return &cfg, nil
}

func (a *SubStatsAgg) Aggregate(storage *storage.Storage, req model.GetLogsRequest) ([]model.AggsBucket, error) {
	statsAgg, err := NewStatsAgg(a.AggMeta.AggsParam)
	if err != nil {
		return nil, err
	}
	buckets, err := statsAgg.Aggregate(storage, req)
	if err != nil {
		return nil, err
	}
	newBuckets := filterBucketsByKey(buckets, a.AggsParam.Type)
	return newBuckets, nil
}

func init() {
	Register("count", NewSubStatsAgg)
	Register("max", NewSubStatsAgg)
	Register("min", NewSubStatsAgg)
	Register("avg", NewSubStatsAgg)
	Register("sum", NewSubStatsAgg)
}
