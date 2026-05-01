package routes

import (
	"fmt"
	"net/http"
	"strconv"

	"backend/internal/model"
	"backend/internal/service"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type SourceHandler struct {
	svc     *service.SourceManager
	storage *storage.Storage
}

func NewSourceHandler(svc *service.SourceManager, storage *storage.Storage) *SourceHandler {
	return &SourceHandler{svc: svc, storage: storage}
}

func (h *SourceHandler) AddSource(c *gin.Context) {
	var cfg model.SourceConfig

	if err := c.BindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.svc.AddSource(cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, cfg)
}

func (h *SourceHandler) GetSources(c *gin.Context) {
	sources, err := h.svc.GetSources()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sources)
}

func (h *SourceHandler) GetSourceByID(c *gin.Context) {
	id := c.Param("id")
	idInt, err := strconv.Atoi(id)
	fmt.Printf("Received GetSourceByID request with ID: %s\n", id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid source ID"})
		return
	}

	source, err := h.svc.GetSourceByID(idInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, source)
}

func (h *SourceHandler) UpdateSource(c *gin.Context) {
	id := c.Param("id")
	idInt, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid source ID"})
		return
	}

	var cfg model.SourceConfig
	if err := c.BindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cfg.ID = idInt

	_, err = h.svc.UpdateSource(cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, cfg)
}

func (h *SourceHandler) ClearSources(c *gin.Context) {
	h.svc.ClearSources()
	c.JSON(http.StatusOK, gin.H{"message": "All sources cleared successfully"})
}

func (h *SourceHandler) ClearSourceByID(c *gin.Context) {
	id := c.Param("id")
	idInt, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid source ID"})
		return
	}

	err = h.svc.ClearSourceByID(idInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Source cleared successfully"})
}

func SourcesRegisterRoutes(r *gin.Engine, svc *service.SourceManager, storage *storage.Storage) {
	handler := NewSourceHandler(svc, storage)
	sourcesGroup := r.Group("/sources")

	sourcesGroup.POST("", handler.AddSource)
	sourcesGroup.GET("", handler.GetSources)
	sourcesGroup.GET("/:id", handler.GetSourceByID)
	sourcesGroup.PUT("/:id", handler.UpdateSource)
	sourcesGroup.DELETE("", handler.ClearSources)
	sourcesGroup.DELETE("/:id", handler.ClearSourceByID)
}
