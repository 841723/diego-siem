package main

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"backend/internal/logic"
	"backend/internal/routes/logs"
	"backend/internal/routes/sources"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"*"},
		AllowHeaders: []string{"Content-Type"},
		MaxAge:       12 * time.Hour,
	}))

	logs.RegisterRoutes(r)
	sources.RegisterRoutes(r)

	go logic.Logic()

	r.Run(":8080")
}
