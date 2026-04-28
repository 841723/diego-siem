package routes

import (
	"net/http"
	"strconv"

	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type LogsHandler struct {
	storage *storage.Storage
}

func NewLogsHandler(storage *storage.Storage) *LogsHandler {
	return &LogsHandler{storage: storage}
}

func (h *LogsHandler) GetLogs(c *gin.Context) {
	strSourceID := c.Param("id")
	sourceID, err := strconv.Atoi(strSourceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid source ID"})
		return
	}

	sources, err := h.storage.GetLogs(sourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sources)
}

func (h *LogsHandler) DeleteLogs(c *gin.Context) {
	err := h.storage.DeleteLogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "All logs deleted"})
}

func LogRegisterRoutes(r *gin.Engine, storage *storage.Storage) {
	handler := NewLogsHandler(storage)
	logsGroup := r.Group("/logs")

	logsGroup.GET("/:id", handler.GetLogs)

	logsGroup.DELETE("/all", handler.DeleteLogs)
}
