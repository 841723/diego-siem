package service

import (
	"sync"

	"backend/internal/model"
	"backend/internal/pipelines"
	"backend/internal/source"
)

/*
 *
 * syslog/api -> parse -> (parsedCh) -> pipeline -> (storageCh) -> storage
 *
 */

type SourceConfigRuntime struct {
	Config model.SourceConfig

	ParsedCh  chan model.Log
	StorageCh chan model.Log

	StopChan chan struct{}
}

type SourceManager struct {
	sources map[string]*SourceConfigRuntime
	mu      sync.Mutex
}

func NewSourceManager() *SourceManager {
	return &SourceManager{
		sources: make(map[string]*SourceConfigRuntime),
	}
}

func (s *SourceManager) AddSource(cfg model.SourceConfig) {
	if cfg.ID == "" || cfg.Port == 0 || cfg.Protocol == "" || cfg.Parser == "" {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if s.sources[cfg.ID] != nil {
		return
	}

	max_items_channels := 100
	parsed_ch := make(chan model.Log, max_items_channels)
	storage_ch := make(chan model.Log, max_items_channels)
	stop_ch := make(chan struct{})

	s.sources[cfg.ID] = &SourceConfigRuntime{
		Config:    cfg,
		ParsedCh:  parsed_ch,
		StorageCh: storage_ch,
		StopChan:  stop_ch,
	}

	s.StartSource(cfg.ID)
}

func (s *SourceManager) GetSources() []model.SourceConfig {
	s.mu.Lock()
	defer s.mu.Unlock()

	var sources []model.SourceConfig
	for _, src := range s.sources {
		sources = append(sources, src.Config)
	}
	return sources
}

func (s *SourceManager) ClearSources() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sources = make(map[string]*SourceConfigRuntime)
}

func (s *SourceManager) StartSource(id string) {
	src := s.sources[id]
	if src == nil {
		return
	}

	switch src.Config.Parser {
	case "syslog":
		source.StartSyslogServer(src.Config, src.ParsedCh)
	}

	go waitAndProcessLogs(src.ParsedCh, src.Config.Pipeline, src.StorageCh, src.StopChan)
	go waitAndStoreLogs(src.StorageCh, src.Config.Index, src.StopChan)
}

func (s *SourceManager) StopSource(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	src := s.sources[id]
	if src == nil {
		return
	}

	close(src.StopChan)
	delete(s.sources, id)
}

func waitAndProcessLogs(inCh <-chan model.Log, pipeline_id string, outCh chan<- model.Log, stopCh <-chan struct{}) {
	for {
		select {
		case log := <-inCh:
			log, err := pipelines.ProcessLog(log, pipeline_id)
			if err != nil {
				// Handle error
				continue
			}
			outCh <- log
		case <-stopCh:
			return
		}
	}
}

func waitAndStoreLogs(inCh <-chan model.Log, index_id string, stopCh <-chan struct{}) {
	for {
		select {
		case log := <-inCh:
			err := pipelines.StorageLog(log, index_id)
			if err != nil {
				// Handle error
				continue
			}
		case <-stopCh:
			return
		}
	}
}
