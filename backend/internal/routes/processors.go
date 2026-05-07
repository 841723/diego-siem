package routes

import (
	"net/http"

	"backend/internal/model"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type ProcessorsHandler struct {
	storage *storage.Storage
}

func NewProcessorsHandler(storage *storage.Storage) *ProcessorsHandler {
	return &ProcessorsHandler{storage: storage}
}

func (h *ProcessorsHandler) GetProcessorsID(c *gin.Context) {
	strId := c.Param("id")
	pipelineId, err := model.ParseAndCheckUUID(strId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pipeline ID"})
		return
	}

	processors, err := h.storage.GetProcessorsByID(pipelineId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, processors)
}

func (h *ProcessorsHandler) GetProcessors(c *gin.Context) {
	processors, err := h.storage.GetAllProcessors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, processors)
}


func ProcessorsRegisterRoutes(r *gin.Engine, storage *storage.Storage) {
	handler := NewProcessorsHandler(storage)
	ProcessorsGroup := r.Group("/processors")

	ProcessorsGroup.GET("/:id", handler.GetProcessorsID)
	ProcessorsGroup.GET("", handler.GetProcessors)
}
