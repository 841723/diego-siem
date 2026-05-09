package app

import (
	"time"

	"backend/internal/model"
	"backend/internal/routes"
	"backend/internal/service"
	"backend/internal/storage"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type App struct {
	// Array with all sources in memory
	sources  service.SourceManager
	storages storage.Storage
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
	routes.LogRegisterRoutes(r, &a.storages)

	// 	/sources
	routes.SourcesRegisterRoutes(r, &a.sources, &a.storages)

	// 	/schema
	routes.SchemaRegisterRoutes(r, &a.storages)

	// 	/pipelines and /pipelines/:id/processors
	routes.PipelinesRegisterRoutes(r, &a.sources, &a.storages)

	// 	/mappings
	routes.MappingRegisterRoutes(r, &a.storages)

	// 	/processors
	routes.ProcessorsRegisterRoutes(r, &a.storages)

	r.Run(":8080")
}

func (a *App) initSources() {
	initialSource := model.SourceConfig{
		Protocol:   "udp",
		Port:       9001,
		Parser:     "syslog",
		Name:       "My Syslog Source",
		PipelineID: model.ParseUUID("13acfea5-a7ec-4f51-aa4a-fd6949a9f42d"),
	}
	a.sources.AddSource(initialSource)

	initialSource2 := model.SourceConfig{
		Protocol:   "udp",
		Port:       9002,
		Parser:     "syslog",
		Name:       "My Syslog Source 2",
		PipelineID: model.ParseUUID("13acfea5-a7ec-4f51-aa4a-fd6949a9f42d"),
	}
	a.sources.AddSource(initialSource2)

	initialSource3 := model.SourceConfig{
		Protocol:   "udp",
		Port:       9003,
		Parser:     "syslog",
		Name:       "My Syslog Source 3",
		PipelineID: model.ParseUUID("13acfea5-a7ec-4f51-aa4a-fd6949a9f42d"),
	}
	a.sources.AddSource(initialSource3)
}

func New() *App {
	storages := storage.NewStorage()
	return &App{
		storages: *storages,
		sources:  *service.NewSourceManager(storages),
	}
}

func Run() {
	app := New()

	app.initSources()
	app.initAPI()
}
