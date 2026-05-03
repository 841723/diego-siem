package routes

import (
	"net/http"

	"backend/internal/model"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type MappingHandler struct {
	storage *storage.Storage
}

func NewMappingHandler(storage *storage.Storage) *MappingHandler {
	return &MappingHandler{storage: storage}
}

func (h *MappingHandler) SetMapping(c *gin.Context) {
	var req []model.Mapping

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.storage.DeleteMappings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, m := range req {
		err := h.storage.AddMapping(m)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mapping updated successfully"})
}

func (h *MappingHandler) GetMappings(c *gin.Context) {
	mappings, err := h.storage.GetMappings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(mappings) == 0 {
		mappings = []model.Mapping{}
	}
	c.JSON(http.StatusOK, mappings)
}

func (h *MappingHandler) GetMappingTypes(c *gin.Context) {
	types, err := h.storage.GetMappingTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(types) == 0 {
		types = []model.MappingType{}
	}
	c.JSON(http.StatusOK, types)
}

func MappingRegisterRoutes(r *gin.Engine, storage *storage.Storage) {
	handler := NewMappingHandler(storage)
	mappingGroup := r.Group("/mappings")

	mappingGroup.POST("", handler.SetMapping)
	mappingGroup.GET("", handler.GetMappings)

	mappingGroup.GET("/types", handler.GetMappingTypes)
}
