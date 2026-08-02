package parsing

import (
	"encoding/json"

	"backend/internal/model"

	"github.com/influxdata/go-syslog/v3/rfc5424"
)

type LogParser_RFC5424 struct{}

func (_ *LogParser_RFC5424) Parse(raw string) (*model.LogData, error) {
	p := rfc5424.NewParser(rfc5424.WithBestEffort())
	m, err := p.Parse([]byte(raw))
	if err != nil {
		return nil, err
	}
	sm := m.(*rfc5424.SyslogMessage)

	payload := make(map[string]interface{})

	if sm.Message != nil {
		msg := *sm.Message

		if json.Valid([]byte(msg)) {
			if err := json.Unmarshal([]byte(msg), &payload); err != nil {
				payload["message"] = msg
			}
		} else {
			payload["message"] = msg
		}
	} else {
		payload = map[string]interface{}{}
	}

	return &payload, nil
}

func init() {
	Register("rfc5424", func() (LogParser, error) {
		return &LogParser_RFC5424{}, nil
	})
}
