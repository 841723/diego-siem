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
	// Array with all sources in memory
	sources service.SourceManager
}

func (a *App) initAPI() {
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	// 	/logs
	routes.LogRegisterRoutes(r)

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
		sources: *service.NewSourceManager(),
	}
}

func Run() {
	app := New()

	fmt.Println("Sources initialized")
	go app.initSources()

	fmt.Println("Waiting for logs from sources...")

	fmt.Println("API initialized")
	app.initAPI()
}
