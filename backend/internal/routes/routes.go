package routes

import (

	"backend/internal/routes/logs"
	"backend/internal/routes/sources"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	// /logs
	logs.RegisterRoutes(r)

	// sources
	sources.RegisterRoutes(r)
}
