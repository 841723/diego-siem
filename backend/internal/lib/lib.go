package lib

import (
	// "fmt"
	"encoding/json"
	"time"

	// syslog "github.com/influxdata/go-syslog/v3/"
	"backend/internal/model"

	rfc5424 "github.com/influxdata/go-syslog/v3/rfc5424"
)

func ParseSyslog(raw string, source string) (*model.Log, error) {

	p := rfc5424.NewParser(rfc5424.WithBestEffort())

	m, err := p.Parse([]byte(raw))
	if err != nil {
		return nil, err
	}

	sm := m.(*rfc5424.SyslogMessage)

	// 1. timestamp
	ts := time.Now().Unix()
	if sm.Timestamp != nil {
		ts = sm.Timestamp.Unix()
	}

	// 2. payload base
	var payload map[string]interface{}

	if sm.Message != nil {
		msg := *sm.Message

		// 3. intentar JSON
		if json.Valid([]byte(msg)) {
			json.Unmarshal([]byte(msg), &payload)
		} else {
			payload = map[string]interface{}{
				"message": msg,
			}
		}
	} else {
		payload = map[string]interface{}{}
	}

	// 4. construir Log final
	return &model.Log{
		Timestamp: ts,
		Source:    source,
		Data:      payload,
	}, nil
}
