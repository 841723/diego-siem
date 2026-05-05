package processors

import (
	"backend/internal/model"
)

type Processor interface {
	Process(logData model.LogData) error
}

func Process(p model.PipelineProcessor, logData *model.LogData) error {
	var processor Processor
	var err error

	switch p.Type {
	case "set":
		processor, err = NewSetProcessor(p.Config)
	case "delete":
		processor, err = NewDeleteProcessor(p.Config)
	case "rename":
		processor, err = NewRenameProcessor(p.Config)
	case "copy":
		processor, err = NewCopyProcessor(p.Config)
	case "uppercase":
		processor, err = NewUppercaseProcessor(p.Config)
	case "lowercase":
		processor, err = NewLowercaseProcessor(p.Config)
	case "drop":
		processor, err = NewDropProcessor(p.Config)
	case "regexextract":
		processor, err = NewRegexExtractProcessor(p.Config)
	case "callpipeline":
		processor, err = NewCallPipelineProcessor(p.Config)
	case "geoipenrich":
		processor, err = NewGeoIpEnrichProcessor(p.Config)
	case "dateparse":
		processor, err = NewDateParseProcessor(p.Config)
	case "concat":
		processor, err = NewConcatProcessor(p.Config)
	default:
		return nil
	}

	if err != nil {
		return err
	}

	return processor.Process(*logData)
}
