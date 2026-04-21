package sources

import (
	"net/http"

	"backend/internal/app"
	"backend/internal/model"

	"github.com/gin-gonic/gin"
)


func RegisterRoutes(r *gin.Engine) {
	sourcesGroup := r.Group("/sources")
	sourcesGroup.POST("/", func(c *gin.Context) {
		var newSource model.SourceConfig
		if err := c.ShouldBindJSON(&newSource); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		app.AddSource(newSource)

		c.JSON(http.StatusOK, gin.H{"status": "ok", "message": "Source added successfully"})
	})

	sourcesGroup.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, app.GetSources())
	})

	sourcesGroup.DELETE("/", func(c *gin.Context) {
		app.ClearSources()
		c.JSON(http.StatusOK, gin.H{"status": "ok", "message": "All sources deleted"})
	})
}
