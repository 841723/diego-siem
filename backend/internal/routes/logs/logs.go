package logs

import (
	"backend/internal/logic"
	"backend/internal/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {

	logsGroup := r.Group("/logs")
	logsGroup.POST("/", func(c *gin.Context) {
		var l model.Log

		if err := c.ShouldBindJSON(&l); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		logic.AddLog(l)
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	logsGroup.GET("/all", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"logs": logic.GetLogs(),
		})
	})
}
