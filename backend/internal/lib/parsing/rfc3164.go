package parsing

import (
	"encoding/json"

	"backend/internal/model"

	"github.com/influxdata/go-syslog/v3/rfc3164"
)

type LogParser_RFC3164 struct{}

func (_ *LogParser_RFC3164) Parse(raw string) (*model.LogData, error) {
	p := rfc3164.NewParser(
		rfc3164.WithYear(rfc3164.CurrentYear{}),
	)
	m, err := p.Parse([]byte(raw))
	if err != nil {
		return nil, err
	}
	sm := m.(*rfc3164.SyslogMessage)

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
	Register("rfc3164", func() (LogParser, error) {
		return &LogParser_RFC3164{}, nil
	})
}
