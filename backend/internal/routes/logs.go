package routes

import (
	"net/http"

	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)
func GetLogs(c *gin.Context) {
	sources, err := storage.GetLogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sources)
}

func LogRegisterRoutes(r *gin.Engine) {
	logsGroup := r.Group("/logs")

	logsGroup.GET("", GetLogs)
}
