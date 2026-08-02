package parsing

import (
	"backend/internal/model"
	"fmt"
)

type LogParser interface {
	Parse(raw string) (*model.LogData, error)
}

func Parse(raw string) (*model.LogData, error) {
	for _, factory := range registry {
		factoryInstance, err := factory()
		if err != nil {
			return nil, fmt.Errorf("failed to create parser instance: %w", err)
		}
		log, err := factoryInstance.Parse(raw)
		if err == nil {
			return log, nil
		}
	}
	return nil, fmt.Errorf("no parser registered for syslog")
}


type ParserFactory func() (LogParser, error)

var registry = map[string]ParserFactory{}

func Register(name string, factory ParserFactory) {
	registry[name] = factory
}
