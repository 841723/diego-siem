package app

import (
	"fmt"
	"sync"
	"time"

	"backend/internal/model"
	"backend/internal/routes/logs"
	"backend/internal/routes/sources"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type App struct {
	// Array with all logs in memory
	Logs    []model.Log
	maxLogs int

	// Mutex to protect access to Logs
	Mu sync.Mutex

	// Channel to receive logs from sources
	LogsChan chan model.Log

	// Array with all sources in memory
	sourcesList []model.SourceConfig
}

func (a *App) waitLogsFromChallenge() {
	for {
		log := <-a.LogsChan
		fmt.Printf("Received log from channel: %v\n", log)
		a.AddLog(log)
	}
}

func (a *App) initAPI() {
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"*"},
		AllowHeaders: []string{"Content-Type"},
		MaxAge:       12 * time.Hour,
	}))

	// 	/logs
	logs.RegisterRoutes(r)

	// 	/sources
	sources.RegisterRoutes(r)

	r.Run(":8080")
}

func NewApp() *App {
	return &App{
		Logs:       []model.Log{},
		maxLogs:    1000,
		LogsChan:   make(chan model.Log, 100),
		sourcesList: []model.SourceConfig{},
	}
}

func Run() {
	app := NewApp()

	app.initAPI()
	fmt.Println("API initialized")

	go app.initSources()
	fmt.Println("Sources initialized")

	fmt.Println("Waiting for logs from sources...")
	app.waitLogsFromChallenge()
}
