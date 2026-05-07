package routes

import (
	"net/http"

	"backend/internal/model"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type PipelineProcessorsHandler struct {
	storage *storage.Storage
}

func NewPipelineProcessorsHandler(storage *storage.Storage) *PipelineProcessorsHandler {
	return &PipelineProcessorsHandler{storage: storage}
}

func (h *PipelineProcessorsHandler) ProcessorMiddleware(c *gin.Context) {
	strId := c.Param("id")
	pipelineId, err := model.ParseAndCheckUUID(strId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pipeline ID"})
		c.Abort()
		return
	}

	pipeline, err := h.storage.GetPipelineByID(pipelineId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		c.Abort()
		return
	}
	if pipeline == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pipeline not found"})
		c.Abort()
		return
	}

	c.Set("pipelineId", pipelineId)
	c.Next()
}

func (h *PipelineProcessorsHandler) AddProcessorToPipeline(c *gin.Context) {
	var processor model.PipelineProcessor
	if err := c.BindJSON(&processor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pipelineId, exists := c.Get("pipelineId")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve pipeline ID"})
		return
	}
	processor.PipelineID = pipelineId.(model.ID)

	_, err := h.storage.AddProcessorToPipeline(processor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, processor)
}

func (h *PipelineProcessorsHandler) GetProcessorsFromPipeline(c *gin.Context) {
	strId := c.Param("id")
	pipelineId, err := model.ParseAndCheckUUID(strId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pipeline ID"})
		return
	}

	processors, err := h.storage.GetProcessorsFromPipeline(pipelineId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, processors)
}

func (h *PipelineProcessorsHandler) UpdateProcessorInPipeline(c *gin.Context) {
	var processor model.PipelineProcessor
	if err := c.BindJSON(&processor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pipelineId, exists := c.Get("pipelineId")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve pipeline ID"})
		return
	}
	processor.PipelineID = pipelineId.(model.ID)

	strProcessorId := c.Param("processor_id")
	processorId, err := model.ParseAndCheckUUID(strProcessorId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid processor ID"})
		return
	}

	processor.ID = processorId
	processor.PipelineID = pipelineId.(model.ID)

	err = h.storage.UpdateProcessorInPipeline(processor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, processor)
}

func (h *PipelineProcessorsHandler) DeleteProcessorFromPipeline(c *gin.Context) {
	strProcessorId := c.Param("processor_id")
	processorId, err := model.ParseAndCheckUUID(strProcessorId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid processor ID"})
		return
	}
	
	_, exists := c.Get("pipelineId")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve pipeline ID"})
		return
	}
	

	err = h.storage.DeleteProcessorFromPipeline(processorId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Processor deleted successfully"})
}

func PipelineProcessorsRegisterRoutes(r *gin.Engine, processorsGroup *gin.RouterGroup, storage *storage.Storage) {
	handler := NewPipelineProcessorsHandler(storage)
	processorsGroup.Use(handler.ProcessorMiddleware)

	processorsGroup.POST("", handler.AddProcessorToPipeline)
	processorsGroup.GET("", handler.GetProcessorsFromPipeline)
	processorsGroup.PUT("/:processor_id", handler.UpdateProcessorInPipeline)
	processorsGroup.DELETE("/:processor_id", handler.DeleteProcessorFromPipeline)
}
