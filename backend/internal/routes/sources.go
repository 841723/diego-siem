package routes

import (
	"net/http"

	"backend/internal/model"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type SourceHandler struct {
	svc *service.SourceManager
}

func NewSourceHandler(svc *service.SourceManager) *SourceHandler {
	return &SourceHandler{svc: svc}
}

func (h *SourceHandler) AddSource(c *gin.Context) {
	var cfg model.SourceConfig

	if err := c.BindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.svc.AddSource(cfg)

	c.Status(http.StatusOK)
}

func (h *SourceHandler) GetSources(c *gin.Context) {
	sources := h.svc.GetSources()
	c.JSON(http.StatusOK, sources)
}

func (h *SourceHandler) ClearSources(c *gin.Context) {
	h.svc.ClearSources()
	c.Status(http.StatusOK)
}

func SourcesRegisterRoutes(r *gin.Engine, svc *service.SourceManager) {
	handler := NewSourceHandler(svc)
	sourcesGroup := r.Group("/sources")

	sourcesGroup.POST("/", handler.AddSource)
	sourcesGroup.GET("/", handler.GetSources)
	sourcesGroup.DELETE("/", handler.ClearSources)
}
