package app

import (
	"fmt"
	"time"

	"backend/internal/model"
	"backend/internal/routes"
	"backend/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type App struct {
	// Array with all logs in memory
	logs service.LogService

	// Array with all sources in memory
	sources service.SourceManager
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
	routes.LogRegisterRoutes(r, &a.logs)

	// 	/sources
	routes.SourcesRegisterRoutes(r, &a.sources)

	r.Run(":8080")
}

func (a *App) initSources() {
	initialSource := model.SourceConfig{
		ID:       "1",
		Protocol: "udp",
		Port:     9001,
		Parser:   "syslog",
		Name:     "My Syslog Source",
	}
	a.sources.AddSource(initialSource)
}

func New() *App {
	return &App{
		logs:    *service.NewLogService(),
		sources: *service.NewSourceManager(),
	}
}

func Run() {
	app := New()

	app.initAPI()
	fmt.Println("API initialized")

	go app.initSources()
	fmt.Println("Sources initialized")

	fmt.Println("Waiting for logs from sources...")

	for {
	}
}
