package sources

import (
	"backend/internal/lib"
	"backend/internal/lib/logic"
	"backend/internal/model"
	"fmt"
	"log"
	"net"
)

type SyslogServer struct {
	cfg model.SourceConfig
}

func NewSyslogServer(cfg model.SourceConfig) {
	syslogServer := &SyslogServer{
		cfg: cfg,
	}
	go syslogServer.Start()
}

func (s *SyslogServer) Start() {
	addr := fmt.Sprintf(":%s", s.cfg.Port)
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

		go func() {
			fmt.Printf("Received syslog message: %s\n", raw)
			parsed, err := lib.ParseSyslog(raw, s.cfg.Name)
			if err != nil {
				log.Println("error parsing syslog message:", err)
				return
			}
			fmt.Printf("Parsed syslog message: %s\n", parsed)
			logic.LogsChan <- *parsed
		}()

	}
}
