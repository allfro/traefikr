package dal

import (
	"traefikr/models"

	"gorm.io/gorm"
)

// TraefikConfigRepository handles all database operations for TraefikConfig
type TraefikConfigRepository struct {
	db *gorm.DB
}

// NewTraefikConfigRepository creates a new repository instance
func NewTraefikConfigRepository(db *gorm.DB) *TraefikConfigRepository {
	return &TraefikConfigRepository{db: db}
}

// Create inserts a new TraefikConfig into the database
func (r *TraefikConfigRepository) Create(config *models.TraefikConfig) error {
	return r.db.Create(config).Error
}

// FindByKey finds a TraefikConfig by its composite primary key
func (r *TraefikConfigRepository) FindByKey(name, provider, protocol, resourceType string) (*models.TraefikConfig, error) {
	var config models.TraefikConfig
	err := r.db.Where("name = ? AND provider = ? AND protocol = ? AND type = ?",
		name, provider, protocol, resourceType).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// FindByProtocolAndType finds all enabled configs for a specific protocol and type
func (r *TraefikConfigRepository) FindByProtocolAndType(protocol, resourceType string) ([]models.TraefikConfig, error) {
	var configs []models.TraefikConfig
	err := r.db.Where("protocol = ? AND type = ? AND enabled = ?", protocol, resourceType, true).
		Find(&configs).Error
	return configs, err
}

// FindAllEnabled finds all enabled TraefikConfigs
func (r *TraefikConfigRepository) FindAllEnabled() ([]models.TraefikConfig, error) {
	var configs []models.TraefikConfig
	err := r.db.Where("enabled = ?", true).Find(&configs).Error
	return configs, err
}

// FindServerTransports finds all enabled serverTransport configs
func (r *TraefikConfigRepository) FindServerTransports() ([]models.TraefikConfig, error) {
	var configs []models.TraefikConfig
	err := r.db.Where("type = ? AND enabled = ?", "serversTransports", true).Find(&configs).Error
	return configs, err
}

// Update updates an existing TraefikConfig
func (r *TraefikConfigRepository) Update(config *models.TraefikConfig) error {
	return r.db.Save(config).Error
}

// Delete removes a TraefikConfig by its composite primary key
func (r *TraefikConfigRepository) Delete(name, provider, protocol, resourceType string) (int64, error) {
	result := r.db.Where("name = ? AND provider = ? AND protocol = ? AND type = ?",
		name, provider, protocol, resourceType).Delete(&models.TraefikConfig{})
	return result.RowsAffected, result.Error
}

// Count returns the total number of TraefikConfigs
func (r *TraefikConfigRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.TraefikConfig{}).Count(&count).Error
	return count, err
}
