package service

import (
	"errors"
	"fmt"
	"sync"

	"backend/internal/model"
	"backend/internal/pipelines"
	"backend/internal/pipelines/processors"
	"backend/internal/source"
	"backend/internal/storage"
)

/*
 *
 * syslog/api -> parse -> (parsedCh) -> pipeline -> (storageCh) -> storage
 *
 */
type SourceConfigRuntime struct {
	Config             model.SourceConfig
	PipelineProcessors []model.PipelineProcessor

	ParsedCh  chan model.Log
	StorageCh chan model.Log

	StopChan chan struct{}
}

func (s *SourceManager) NewSourceConfigRuntime(cfg model.SourceConfig) model.ID {
	max_items_channels := 100
	parsed_ch := make(chan model.Log, max_items_channels)
	storage_ch := make(chan model.Log, max_items_channels)
	stop_ch := make(chan struct{})

	pipeline, err := s.storage.GetCompiledPipelineByPipelineID(cfg.PipelineID)
	if err != nil || pipeline == nil {
		// Handle error, for now we just return an empty pipeline
		pipeline = []model.PipelineProcessor{}
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.sources[cfg.ID.String()] = &SourceConfigRuntime{
		Config:             cfg,
		PipelineProcessors: pipeline,
		ParsedCh:           parsed_ch,
		StorageCh:          storage_ch,
		StopChan:           stop_ch,
	}
	return cfg.ID
}

func (src *SourceConfigRuntime) waitAndProcessLogs(s *storage.Storage) {
	for {
		select {
		case log := <-src.ParsedCh:
			log, err := pipelines.ProcessLog(log, src.PipelineProcessors)
			if err != nil {
				if !errors.Is(err, processors.GetDropProcessorError()) {
					fmt.Printf("Error processing log in source %s: %v\n", src.Config.Name, err)
				}
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
	existingSources, err := sm.GetSources()
	if err != nil {
		// Handle error
		return sm
	}
	for _, src := range existingSources {
		id := sm.NewSourceConfigRuntime(src)
		sm.StartSource(id)
	}
	return sm
}

func (s *SourceManager) AddSource(cfg model.SourceConfig) (*model.SourceConfig, error) {
	if !sourceConfigIsFullToUpsert(cfg) {
		return nil, errors.New("source config is missing required fields")
	}
	cfgInDB, err := s.storage.GetSourceByPortAndProtocol(cfg.Port, cfg.Protocol)
	if err != nil || (cfgInDB != nil && cfgInDB.ID != cfg.ID) {
		// source with same port and protocol already exists, do not add to DB
		return nil, errors.New("source with same port and protocol already exists")
	}

	IDToAdd := model.GenerateUUID()

	cfg.ID = IDToAdd
	ID, err := s.storage.AddSource(cfg)
	if err != nil {
		return nil, errors.New("error adding source to DB")
	}
	cfg.ID = ID

	id := s.NewSourceConfigRuntime(cfg)
	s.StartSource(id)

	return &cfg, nil
}

func (s *SourceManager) UpdateSource(cfg model.SourceConfig) (*model.SourceConfig, error) {
	if !sourceConfigIsFullToUpsert(cfg) {
		return nil, errors.New("source config is missing required fields")
	}

	existingSource, err := s.storage.GetSourceByID(cfg.ID)
	if err != nil || existingSource == nil {
		fmt.Printf("Source with ID %s does not exist\n", cfg.ID)
		return nil, errors.New("source with given ID does not exist")
	}

	if s.sources[cfg.ID.String()] != nil {
		s.StopSource(cfg.ID)
		delete(s.sources, cfg.ID.String())
	}

	cfgInDB, err := s.storage.GetSourceByPortAndProtocol(cfg.Port, cfg.Protocol)
	if err != nil || cfgInDB.ID != cfg.ID {
		// source with same port and protocol already exists, do not add to DB
		return nil, errors.New("source with same port and protocol already exists")
	}

	err = s.storage.UpdateSource(cfg)
	if err != nil {
		return nil, errors.New("error updating source in DB")
	}

	err = s.UpdatePipelineInSourceConfig(cfg.PipelineID)
	if err != nil {
		return nil, errors.New("error updating pipeline in source config")
	}

	id := s.NewSourceConfigRuntime(cfg)
	s.StartSource(id)

	return &cfg, nil
}

func (s *SourceManager) UpdatePipelineInSourceConfig(updatedPipelineID model.ID) error {
	for _, sourceRuntime := range s.sources {
		if s.storage.SourceUsesPipeline(sourceRuntime.Config.PipelineID, updatedPipelineID) {
			newPipeline, err := s.storage.GetCompiledPipelineByPipelineID(sourceRuntime.Config.PipelineID)
			if err != nil {
				return err
			}
			sourceRuntime.PipelineProcessors = newPipeline
		}
	}
	return nil
}

func (s *SourceManager) GetSources() ([]model.SourceConfig, error) {
	sources, err := s.storage.GetSources()
	if err != nil {
		// Handle error
		return nil, err
	}
	return sources, nil
}

func (s *SourceManager) GetSourceByID(id model.ID) (*model.SourceConfig, error) {
	source, err := s.storage.GetSourceByID(id)
	if err != nil {
		// Handle error
		return nil, err
	}
	return source, nil
}

func (s *SourceManager) ClearSources() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return errors.New("not implemented")
}

func (s *SourceManager) ClearSourceByID(id model.ID) error {
	return s.storage.DeleteSourceByID(id)
}

func (s *SourceManager) StartSource(id model.ID) {
	src := s.sources[id.String()]
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

func (s *SourceManager) StopSource(id model.ID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	src := s.sources[id.String()]
	if src == nil {
		return
	}

	close(src.StopChan)
	delete(s.sources, id.String())
}

func sourceConfigIsFullToUpsert(cfg model.SourceConfig) bool {
	return cfg.Name != "" && cfg.Port != 0 && cfg.Protocol != "" && cfg.Parser != "" && cfg.PipelineID != model.GenerateErrorUUID()
}
