package service

import (
	"errors"
	"fmt"
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
			log, err := pipelines.ProcessLog(log, src.Config.PipelineID)
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
	sm := &SourceManager{
		sources: make(map[string]*SourceConfigRuntime),
		storage: s,
	}
	// Load existing sources from storage
	existingSources := sm.GetSources()
	for _, src := range existingSources {
		sm.AddSource(src)
	}
	return sm
}

func (s *SourceManager) AddSource(cfg model.SourceConfig) {
	if cfg.Port == 0 || cfg.Protocol == "" || cfg.Parser == "" {
		return
	}

	// if is not in DB, add it
	if s.validAddToDBSource(cfg) {
		ID, err := s.storage.AddSource(cfg)
		if err != nil {
			fmt.Printf("Error adding source: %v\n", err)
			return
		}
		cfg.ID = ID
	}

	max_items_channels := 100
	parsed_ch := make(chan model.Log, max_items_channels)
	storage_ch := make(chan model.Log, max_items_channels)
	stop_ch := make(chan struct{})

	s.mu.Lock()
	defer s.mu.Unlock()
	s.sources[string(cfg.ID)] = &SourceConfigRuntime{
		Config:    cfg,
		ParsedCh:  parsed_ch,
		StorageCh: storage_ch,
		StopChan:  stop_ch,
	}

	s.StartSource(cfg.ID)
}

func (s *SourceManager) GetSources() []model.SourceConfig {
	sources, err := s.storage.GetSources()
	if err != nil {
		// Handle error
		return nil
	}
	return sources
}

func (s *SourceManager) ClearSources() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return errors.New("not implemented")
}

func (s *SourceManager) StartSource(id int) {
	src := s.sources[string(id)]
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

func (s *SourceManager) StopSource(id int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	src := s.sources[string(id)]
	if src == nil {
		return
	}

	close(src.StopChan)
	// delete(s.sources, id)
}

func (s *SourceManager) validAddToDBSource(cfg model.SourceConfig) bool {
	if cfg.Port == 0 || cfg.Protocol == "" || cfg.Parser == "" {
		return false
	}

	sources := s.GetSources()
	for _, src := range sources {
		if src.Port == cfg.Port && src.Protocol == cfg.Protocol {
			return false
		}
	}

	return true
}
