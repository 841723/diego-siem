package routes

import (
	"net/http"

	"backend/internal/model"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type SchemaHandler struct {
	storage *storage.Storage
}

func NewSchemaHandler(storage *storage.Storage) *SchemaHandler {
	return &SchemaHandler{storage: storage}
}

func (h *SchemaHandler) AddColumn(c *gin.Context) {
	var req model.ColumnRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.storage.AddColumnToLogs(req.ColumnName, req.DataType); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Column added to logs"})
}

func (h *SchemaHandler) RemoveColumn(c *gin.Context) {
	var req model.ColumnRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.storage.RemoveColumnFromLogs(req.ColumnName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Column removed from logs"})
}

func SchemaRegisterRoutes(r *gin.Engine, storage *storage.Storage) {
	handler := NewSchemaHandler(storage)
	schemaGroup := r.Group("/schema")
	
	schemaGroup.POST("/add-column", handler.AddColumn)
	schemaGroup.POST("/remove-column", handler.RemoveColumn)
}