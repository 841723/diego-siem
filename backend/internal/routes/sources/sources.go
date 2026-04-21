package sources

import (
	// "fmt"
	"net/http"

	"backend/internal/logic"
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

		logic.AddSource(newSource)

		c.JSON(http.StatusOK, gin.H{"message": "Source added successfully"})
	})

	sourcesGroup.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, logic.GetSources())
	})

	sourcesGroup.DELETE("/", func(c *gin.Context) {
		logic.ClearSources()
		c.JSON(http.StatusOK, gin.H{"message": "All sources deleted"})
	})
}
