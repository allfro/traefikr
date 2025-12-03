package handlers

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"traefikr/dal"
	"traefikr/models"
	"traefikr/schemas"
	"traefikr/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ResourceHandler struct {
	repo          *dal.TraefikConfigRepository
	traefikClient *utils.TraefikClient
	tomlWriter    *utils.TomlWriter
}

func NewResourceHandler(repo *dal.TraefikConfigRepository) *ResourceHandler {
	return &ResourceHandler{
		repo:          repo,
		traefikClient: utils.NewTraefikClient(),
		tomlWriter:    utils.NewTomlWriter(),
	}
}

// ListResources handles GET /api/{protocol}/{type}
// Query param: traefik=true|false (default: false)
// - false: returns only resources from database
// - true: returns resources from both database and Traefik
func (h *ResourceHandler) ListResources(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")

	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol or resource type"})
		return
	}

	// Check traefik query parameter (default: false)
	includeTraefik := c.DefaultQuery("traefik", "false") == "true"

	// Fetch from database using repository
	dbConfigs, err := h.repo.FindByProtocolAndType(protocol, resourceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch resources"})
		return
	}

	// Create a map to track resources by name@provider
	resourceMap := make(map[string]interface{})

	// Only fetch from Traefik if traefik=true
	if includeTraefik {
		traefikResources, err := h.traefikClient.GetResources(protocol, resourceType)
		if err != nil {
			// Log error but continue - Traefik might not be available
			traefikResources = make([]interface{}, 0)
		}

		// Add Traefik resources first (normalized to match database schema)
		for _, res := range traefikResources {
			if resMap, ok := res.(map[string]interface{}); ok {
				if name, nameExists := resMap["name"].(string); nameExists {
					resourceMap[name] = normalizeTraefikResource(protocol, resourceType, resMap)
				}
			}
		}

		if resourceType == "serversTransports" {
			resourceMap["default@internal"] = defaultTraefikResource(protocol, resourceType)
		}
	}

	// Override with database resources (database is source of truth)
	for _, config := range dbConfigs {
		key := config.Name + "@" + config.Provider
		// Merge the database config with metadata
		resourceMap[key] = map[string]interface{}{
			"name":     config.Name,
			"provider": config.Provider,
			"protocol": config.Protocol,
			"config":   config.Config,
			"enabled":  config.Enabled,
			"type":     config.Type,
			"source":   "database",
		}
	}

	// Convert map to array for response
	result := make([]interface{}, 0, len(resourceMap))
	for _, v := range resourceMap {
		result = append(result, v)
	}

	c.JSON(http.StatusOK, result)
}

// GetResource handles GET /api/{protocol}/{type}/{name@provider}
func (h *ResourceHandler) GetResource(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")
	nameProvider := c.Param("nameProvider")

	// Validate protocol and type
	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol or resource type"})
		return
	}

	// Parse name@provider
	name, provider := parseNameProvider(nameProvider)

	// First, try to fetch from database (database is source of truth)
	config, err := h.repo.FindByKey(name, provider, protocol, resourceType)

	if err == nil {
		c.JSON(http.StatusOK, map[string]interface{}{
			"name":     config.Name,
			"provider": config.Provider,
			"protocol": config.Protocol,
			"type":     config.Type,
			"config":   config.Config,
			"enabled":  config.Enabled,
			"source":   "database",
		})
		return
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	// Not found in database, try Traefik
	traefikResource, err := h.traefikClient.GetResource(protocol, resourceType, name, provider)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	// Normalize and return resource from Traefik
	c.JSON(http.StatusOK, normalizeTraefikResource(protocol, resourceType, traefikResource))
}

// CreateResource handles POST /api/{protocol}/{type}
func (h *ResourceHandler) CreateResource(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")

	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol or resource type"})
		return
	}

	var req struct {
		Name     string                 `json:"name" binding:"required"`
		Provider string                 `json:"provider"`
		Config   map[string]interface{} `json:"config" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set provider based on resource type
	if resourceType == "serversTransports" {
		req.Provider = "file"
	} else {
		req.Provider = "http"
	}

	// Validate against JSON schema
	if err := schemas.Validate(protocol, resourceType, req.Config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed", "details": err.Error()})
		return
	}

	//if slices.Contains([]string{"services", "middlewares"}, resourceType) {
	//	for k, _ := range req.Config {
	//		req.Config["type"] = strings.ToLower(k)
	//		break
	//	}
	//}

	// Create database entry
	config := &models.TraefikConfig{
		Name:     req.Name,
		Provider: req.Provider,
		Protocol: protocol,
		Type:     resourceType,
		Enabled:  true,
		Config:   req.Config,
	}

	if err := h.repo.Create(config); err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, gin.H{"error": "resource already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create resource"})
		return
	}

	// Write TOML file for serverTransport resources
	if resourceType == "serversTransports" {
		if err := h.tomlWriter.WriteServerTransport(protocol, resourceType, req.Name, req.Config); err != nil {
			log.Printf("WARNING: Failed to write TOML file for serverTransport %s@%s (protocol=%s): %v",
				req.Name, req.Provider, protocol, err)
		}
	}

	c.JSON(http.StatusCreated, config)
}

// UpdateResource handles PUT /api/{protocol}/{type}/{name@provider}
func (h *ResourceHandler) UpdateResource(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")
	nameProvider := c.Param("nameProvider")

	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol or resource type"})
		return
	}

	name, provider := parseNameProvider(nameProvider)

	var req struct {
		Config map[string]interface{} `json:"config" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate against JSON schema
	if err := schemas.Validate(protocol, resourceType, req.Config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed", "details": err.Error()})
		return
	}

	// Fetch existing resource
	config, err := h.repo.FindByKey(name, provider, protocol, resourceType)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	// Update config and save
	config.Config = req.Config

	//if slices.Contains([]string{"services", "middlewares"}, resourceType) {
	//	for k, _ := range req.Config {
	//		req.Config["type"] = strings.ToLower(k)
	//		break
	//	}
	//}

	if err := h.repo.Update(config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update resource"})
		return
	}

	// Write TOML file for serverTransport resources
	if resourceType == "serversTransports" {
		if err := h.tomlWriter.WriteServerTransport(protocol, resourceType, name, req.Config); err != nil {
			log.Printf("WARNING: Failed to update TOML file for serverTransport %s@%s (protocol=%s): %v",
				name, provider, protocol, err)
		}
	}

	c.JSON(http.StatusOK, config)
}

// DeleteResource handles DELETE /api/{protocol}/{type}/{name@provider}
func (h *ResourceHandler) DeleteResource(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")
	nameProvider := c.Param("nameProvider")

	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol or resource type"})
		return
	}

	name, provider := parseNameProvider(nameProvider)

	rowsAffected, err := h.repo.Delete(name, provider, protocol, resourceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete resource"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	// Delete TOML file for serverTransport resources
	if resourceType == "serversTransports" {
		if err := h.tomlWriter.DeleteServerTransport(protocol, resourceType, name); err != nil {
			log.Printf("WARNING: Failed to delete TOML file for serverTransport %s@%s (protocol=%s): %v",
				name, provider, protocol, err)
		}
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetSchema handles GET /api/{protocol}/{type}/schema.json
func (h *ResourceHandler) GetSchema(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")

	schema, err := schemas.GetSchema(protocol, resourceType)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "application/json")
	c.String(http.StatusOK, schema)
}

// Helper functions
var validTypes = map[string][]string{
	"any":  {"entrypoints"},
	"http": {"routers", "services", "middlewares", "serversTransports", "tls"},
	"tcp":  {"routers", "services", "middlewares", "serversTransports", "tls"},
	"udp":  {"routers", "services", "middlewares"},
}

func isValidType(protocol, resourceType string) bool {
	types, ok := validTypes[protocol]
	if !ok {
		return false
	}

	for _, t := range types {
		if t == resourceType {
			return true
		}
	}
	return false
}

func parseNameProvider(nameProvider string) (string, string) {
	parts := strings.Split(nameProvider, "@")
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return parts[0], "http" // default provider
}

// normalizeTraefikResource transforms a Traefik API resource to match our database schema
func normalizeTraefikResource(protocol, resourceType string, traefikRes map[string]interface{}) map[string]interface{} {
	// Extract metadata fields
	name, _ := traefikRes["name"].(string)
	provider, _ := traefikRes["provider"].(string)
	status, _ := traefikRes["status"].(string)

	if len(provider) == 0 {
		provider = "internal"
	}

	// Create config object with all fields except metadata
	config := make(map[string]interface{})
	for key, value := range traefikRes {
		// Skip metadata fields that belong at the top level
		if key != "name" && key != "provider" && key != "status" {
			config[key] = value
		}
	}

	delete(config, "usedBy")
	delete(config, "type")

	// Return normalized structure
	return map[string]interface{}{
		"name":     name,
		"provider": provider,
		"protocol": protocol,
		"config":   config,
		"type":     resourceType,
		"enabled":  status == "enabled" || resourceType == "entrypoints",
		"source":   "traefik",
	}
}

func defaultTraefikResource(protocol, resourceType string) map[string]interface{} {
	return map[string]interface{}{
		"name":     "default@internal",
		"provider": "internal",
		"protocol": protocol,
		"config":   map[string]interface{}{},
		"type":     resourceType,
		"enabled":  true,
		"source":   "traefik",
	}
}
