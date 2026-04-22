package service

import (
	"sync"

	"backend/internal/model"
)

/*
 *
 *	source (-> parser) -> pipeline -> storage
 *
 */
type LogService struct {
	logs     []model.Log
	Mu       sync.Mutex
	max_size int
}

func NewLogService() *LogService {
	return &LogService{
		logs:     []model.Log{},
		max_size: 3,
	}
}

func (s *LogService) AddLog(cfg model.Log) {
	s.Mu.Lock()
	defer s.Mu.Unlock()

	s.logs = append(s.logs, cfg)
	if len(s.logs) > s.max_size {
		s.logs = s.logs[1:]
	}
}

func (s *LogService) GetLogs() []model.Log {
	return s.logs
}

func (s *LogService) ClearLogs() {
	s.Mu.Lock()
	defer s.Mu.Unlock()

	s.logs = []model.Log{}
}
