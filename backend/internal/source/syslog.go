package source

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"time"

	"backend/internal/model"

	"github.com/influxdata/go-syslog/v3/rfc5424"
)

type SyslogServer struct {
	cfg        model.SourceConfig
	outChannel chan<- model.Log
}

func (s *SyslogServer) Start() {
	addr := fmt.Sprintf(":%d", s.cfg.Port)
	fmt.Printf("Starting syslog server on addr %s with protocol %s\n", addr, s.cfg.Protocol)

	conn, err := net.ListenPacket(s.cfg.Protocol, addr)
	if err != nil {
		log.Println("error:", err)
		return
	}

	defer conn.Close()

	buf := make([]byte, 65535)

	for {
		n, _, err := conn.ReadFrom(buf)
		if err != nil {
			continue
		}

		raw := string(buf[:n])
		// fmt.Printf("Received raw syslog message: %s\n", raw)
		go func() {
			parsedLog, err := parseSyslog(raw, s.cfg.ID)
			if err != nil {
				log.Printf("Error parsing syslog message: %v\n", err)
				return
			}

			s.outChannel <- *parsedLog
		}()
	}
}

func (s *SyslogServer) Stop() {
	// Implementar lógica para detener el servidor si es necesario
}

func StartSyslogServer(cfg model.SourceConfig, outChannel chan<- model.Log) {
	syslogServer := &SyslogServer{
		cfg:        cfg,
		outChannel: outChannel,
	}
	go syslogServer.Start()
}

func parseSyslog(raw string, source string) (*model.Log, error) {
	p := rfc5424.NewParser(rfc5424.WithBestEffort())

	m, err := p.Parse([]byte(raw))
	if err != nil {
		return nil, err
	}

	sm := m.(*rfc5424.SyslogMessage)

	ts := time.Now().Unix()
	if sm.Timestamp != nil {
		ts = sm.Timestamp.Unix()
	}

	var payload map[string]interface{}

	if sm.Message != nil {
		msg := *sm.Message

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

	return &model.Log{
		Timestamp: ts,
		SourceID:  source,
		Data:      payload,
	}, nil
}
