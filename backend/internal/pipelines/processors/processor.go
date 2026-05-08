package processors

import (
	"fmt"

	"backend/internal/model"
)

type (
	ProcessorMeta       = model.Processor
	ProcessorMetaSchema = model.ProcessorSchema
)

func WithMeta(name, description, schema string) ProcessorMeta {
	return ProcessorMeta{
		Name:        name,
		Description: description,
		Schema:      ProcessorMetaSchema(schema), // Aquí podrías agregar un esquema JSON si lo deseas
	}
}

type Processor interface {
	Process(logData model.LogData) error
}

func Process(p model.PipelineProcessor, logData *model.LogData) error {
	processor, err := New(p.Processor.Name, p.Config)
	if err != nil {
		return err
	}
	return processor.Process(*logData)
}

type ProcessorFactory func(config model.PipelineProcessorConfig) (Processor, error)

var registry = map[string]ProcessorFactory{}

func Register(name string, factory ProcessorFactory) {
	registry[name] = factory
}

func New(name string, config model.PipelineProcessorConfig) (Processor, error) {
	factory, ok := registry[name]
	if !ok {
		return nil, fmt.Errorf("unknown processor: %s", name)
	}
	return factory(config)
}
