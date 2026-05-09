package service

import (
	"backend/internal/model"
	"backend/internal/search/aggs"
	"backend/internal/storage"
)

type AggsService struct {
	storage *storage.Storage
}

func NewAggsService(storage *storage.Storage) *AggsService {
	return &AggsService{storage: storage}
}

func (s *AggsService) GetAggs(params model.GetLogsRequest) (map[string][]model.AggsBucket, error) {
	response := make(map[string][]model.AggsBucket)
	for _, agg := range params.Aggs {
		aggsResult, err := aggs.Aggregate(s.storage, agg, params)
		if err != nil {
			return nil, err
		}
		response[agg.Name] = aggsResult
	}
	return response, nil
}


/*
{
	"logs" : [...],
	"total": 100,
	"aggs": {
		"nombre_agg": [
			{
				"key": "",
				"value": "valor_agg",
				"doc_count": 100
			}
		],
		"nombre_agg2": [
			{
				"key": "",
				"doc_count": 20,
				"value": "valor_agg2"
			},
			{
				"key": "",
				"doc_count": 80,
				"value": "valor_agg3"
			}
		]
	}
}
*/