package logs

import (
	"net/http"

	"backend/internal/app"
	"backend/internal/model"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, app *app.App) {
	logsGroup := r.Group("/logs")
	logsGroup.POST("/", func(c *gin.Context) {
		var l model.Log

		if err := c.ShouldBindJSON(&l); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		app.AddLog(l)
		c.JSON(http.StatusOK, gin.H{"status": "ok", "message": "Log added successfully"})
	})

	logsGroup.GET("/all", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"logs": app.GetLogs(),
		})
	})
}
