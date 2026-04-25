package service

import (
	"sync"

	"backend/internal/model"
	"backend/internal/pipelines"
	"backend/internal/source"
	"backend/internal/storage"
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

func (src *SourceConfigRuntime) waitAndProcessLogs(s *storage.Storage) {
	for {
		select {
		case log := <-src.ParsedCh:
			log, err := pipelines.ProcessLog(log, src.Config.Pipeline)
			if err != nil {
				// Handle error
				continue
			}
			src.StorageCh <- log
		case <-src.StopChan:
			return
		}
	}
}

func (src *SourceConfigRuntime) waitAndStoreLogs(s *storage.Storage) {
	for {
		select {
		case log := <-src.StorageCh:
			s.StoreLog(log)
		case <-src.StopChan:
			return
		}
	}
}

type SourceManager struct {
	sources map[string]*SourceConfigRuntime
	storage *storage.Storage
	mu      sync.Mutex
}

func NewSourceManager(s *storage.Storage) *SourceManager {
	return &SourceManager{
		sources: make(map[string]*SourceConfigRuntime),
		storage: s,
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

	go src.waitAndProcessLogs(s.storage)
	go src.waitAndStoreLogs(s.storage)
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
