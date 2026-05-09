package routes

import (
	"net/http"

	"backend/internal/lib"
	"backend/internal/model"
	"backend/internal/service"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type LogsHandler struct {
	storage *storage.Storage
	aggs    *service.AggsService
}

func NewLogsHandler(storage *storage.Storage, aggs *service.AggsService) *LogsHandler {
	return &LogsHandler{storage: storage, aggs: aggs}
}

func (h *LogsHandler) GetLogs(c *gin.Context) {
	strSourceID := c.Param("id")
	sourceID, err := model.ParseAndCheckUUID(strSourceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid source ID"})
		return
	}

	body := model.GetLogsRequest{}
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

	aggs, err := h.aggs.GetAggs(body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := model.GetLogsResponse{
		Logs:  sources,
		Total: count,
		Aggs:  aggs, // Placeholder for actual aggs
	}

	c.JSON(http.StatusOK, response)
}

func (h *LogsHandler) DeleteLogs(c *gin.Context) {
	err := h.storage.DeleteLogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "All logs deleted"})
}

func LogRegisterRoutes(r *gin.Engine, storage *storage.Storage, aggs *service.AggsService) {
	handler := NewLogsHandler(storage, aggs)
	logsGroup := r.Group("/logs")

	logsGroup.POST("/:id", handler.GetLogs)

	logsGroup.DELETE("/all", handler.DeleteLogs)
}
