package routes

import (
	"net/http"

	"backend/internal/model"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type PipelinesHandler struct {
	storage *storage.Storage
}

func NewPipelinesHandler(storage *storage.Storage) *PipelinesHandler {
	return &PipelinesHandler{storage: storage}
}

func (h *PipelinesHandler) AddPipeline(c *gin.Context) {
	var pipeline model.Pipeline
	if err := c.BindJSON(&pipeline); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.storage.AddPipeline(pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, pipeline)
}

func (h *PipelinesHandler) GetPipelines(c *gin.Context) {
	pipelines, err := h.storage.GetPipelines()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, pipelines)
}

func (h *PipelinesHandler) GetPipelineByID(c *gin.Context) {
	strId := c.Param("id")
	id, err := model.ParseAndCheckUUID(strId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pipeline ID"})
		return
	}
	pipeline, err := h.storage.GetPipelineByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if pipeline == nil {
		c.JSON(http.StatusNoContent, gin.H{"error": "Pipeline not found"})
		return
	}
	c.JSON(200, pipeline)
}

func (h *PipelinesHandler) UpdatePipeline(c *gin.Context) {
	strId := c.Param("id")
	id, err := model.ParseAndCheckUUID(strId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pipeline ID"})
		return
	}

	var pipeline model.Pipeline
	if err := c.BindJSON(&pipeline); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pipeline.ID = id

	err = h.storage.UpdatePipeline(pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, pipeline)
}

func (h *PipelinesHandler) ClearPipelines(c *gin.Context) {
	err := h.storage.ClearPipelines()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "All pipelines cleared successfully"})
}

func (h *PipelinesHandler) ClearPipelineByID(c *gin.Context) {
	strId := c.Param("id")
	id, err := model.ParseAndCheckUUID(strId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pipeline ID"})
		return
	}

	err = h.storage.DeletePipelineByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Pipeline cleared successfully"})
}

func PipelinesRegisterRoutes(r *gin.Engine, storage *storage.Storage) {
	handler := NewPipelinesHandler(storage)
	pipelinesGroup := r.Group("/pipelines")

	pipelinesGroup.POST("", handler.AddPipeline)
	pipelinesGroup.GET("", handler.GetPipelines)
	pipelinesGroup.GET("/:id", handler.GetPipelineByID)
	pipelinesGroup.PUT("/:id", handler.UpdatePipeline)
	pipelinesGroup.DELETE("", handler.ClearPipelines)
	pipelinesGroup.DELETE("/:id", handler.ClearPipelineByID)

	processorsGroup := pipelinesGroup.Group("/:id/processors")
	ProcessorsRegisterRoutes(r, processorsGroup, storage)
}
