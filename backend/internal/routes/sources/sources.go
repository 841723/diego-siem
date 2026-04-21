package sources

import (
	"net/http"

	"backend/internal/model"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {

	sourcesGroup := r.Group("/sources")
	sourcesGroup.POST("/", func(c *gin.Context) {
		c.JSON(
			http.StatusCreated,
			gin.H{
				"status": "ok",
			}
		)
	})

	sourcesGroup.GET("/", func(c *gin.Context) {
		c.JSON(
			http.StatusOK,
			gin.H{
				"sources": []model.Source{
					{
						ID:   "1",
						Name: "Source 1",
					},
					{
						ID:   "2",
						Name: "Source 2",
					},
				},
			},
		)
	})
}