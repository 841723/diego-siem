package aggs

import (
	"fmt"

	"backend/internal/model"
	"backend/internal/storage"
)

type AggMeta struct {
	Name string `json:"name"`
}

type Agg interface {
	Aggregate(storage *storage.Storage, req model.GetLogsRequest) ([]model.AggsBucket, error)
}

type AggsFactory func(aggsParam model.AggsParam) (Agg, error)

var registry = map[string]AggsFactory{}

func Register(_type string, factory AggsFactory) {
	registry[_type] = factory
}

func New(aggsParam model.AggsParam) (Agg, error) {
	factory, ok := registry[aggsParam.Type]
	if !ok {
		return nil, fmt.Errorf("unknown aggs: %s", aggsParam.Name)
	}
	return factory(aggsParam)
}

func Aggregate(storage *storage.Storage, aggsConfig model.AggsParam, req model.GetLogsRequest) ([]model.AggsBucket, error) {
	aggs, err := New(aggsConfig)
	if err != nil {
		return nil, err
	}
	return aggs.Aggregate(storage, req)
}
