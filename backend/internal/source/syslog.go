package source

import (
	"fmt"
	"log"
	"net"
	"time"

	"backend/internal/lib/parsing"
	"backend/internal/model"
	// "github.com/influxdata/go-syslog/v3/rfc5424"
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
			ts := time.Now()
			parsedLogData, err := parseSyslog(raw)
			if err != nil {
				log.Printf("Error parsing syslog message: %v\n", err)
				return
			}
			parsedLog := &model.Log{
				Raw:       raw,
				ID:        model.GenerateUUID(),
				Timestamp: ts,
				SourceID:  s.cfg.ID,
				Data:      *parsedLogData,
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

func parseSyslog(raw string) (*model.LogData, error) {
	logdata, err := parsing.Parse(raw)
	if err != nil {
		return nil, err
	}
	return logdata, nil
}
