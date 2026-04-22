package routes

import (
	"net/http"

	"backend/internal/model"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type LogHandler struct {
	svc *service.LogService
}

func NewLogHandler(svc *service.LogService) *LogHandler {
	return &LogHandler{svc: svc}
}

func (h *LogHandler) AddLog(c *gin.Context) {
	var cfg model.Log

	if err := c.BindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.svc.AddLog(cfg)

	c.Status(http.StatusOK)
}

func (h *LogHandler) GetLogs(c *gin.Context) {
	sources := h.svc.GetLogs()
	c.JSON(http.StatusOK, sources)
}

func LogRegisterRoutes(r *gin.Engine, svc *service.LogService) {
	handler := NewLogHandler(svc)
	logsGroup := r.Group("/logs")

	logsGroup.POST("", handler.AddLog)
	logsGroup.GET("", handler.GetLogs)
}
