package sources

import (
	// "fmt"
	"net/http"

	"backend/internal/model"
	"backend/internal/lib/sources"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {

	sourcesList := []model.SourceConfig{}
	firstSource := model.SourceConfig{
		ID: "1",
		Port: "9001",
		Protocol: "udp",
		Parser: "syslog",
		Name: "Default Syslog Source",
	}
	sourcesList = append(sourcesList, firstSource)
	for _, source := range sourcesList {
		sources.NewSyslogServer(source)
	}

	sourcesGroup := r.Group("/sources")
	sourcesGroup.POST("/", func(c *gin.Context) {
		var newSource model.SourceConfig
		if err := c.ShouldBindJSON(&newSource); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		sourcesList = append(sourcesList, newSource)

		sources.NewSyslogServer(newSource)

		c.JSON(http.StatusOK, gin.H{"message": "Source added successfully"})
	})

	sourcesGroup.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, sourcesList)
	})

	sourcesGroup.DELETE("/", func(c *gin.Context) {
		sourcesList = []model.SourceConfig{}
		c.JSON(http.StatusOK, gin.H{"message": "All sources deleted"})
	})
}