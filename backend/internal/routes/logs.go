package routes

import (
	"net/http"

	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)
func GetLogs(c *gin.Context) {
	logID := c.Param("id")
	if logID == "" {
		logID = "1"
	}

	sources, err := storage.GetLogs(logID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sources)
}

func DeleteLogs(c *gin.Context) {
	err := storage.DeleteLogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "All logs deleted"})
}

func LogRegisterRoutes(r *gin.Engine) {
	logsGroup := r.Group("/logs")

	logsGroup.GET("", GetLogs)
	logsGroup.GET("/:id", GetLogs)

	logsGroup.DELETE("/all", 
}
