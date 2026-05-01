package routes

import (
	"net/http"
	"strconv"

	"backend/internal/lib"
	"backend/internal/model"
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
	body := model.GetLogsParams{}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	body.SourceID = sourceID
	body.TimestampFrom, body.TimestampTo, err = lib.FormatTimeWindowToUnix(body.TimeWindow)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sources, err := h.storage.GetLogs(body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	count, err := h.storage.CountLogs(body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logs": sources, "total": count})
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

	logsGroup.POST("/:id", handler.GetLogs)

	logsGroup.DELETE("/all", handler.DeleteLogs)
}
