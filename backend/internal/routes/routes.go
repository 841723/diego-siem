package routes

import (

	"backend/internal/routes/logs"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	logs.RegisterRoutes(r)
}
