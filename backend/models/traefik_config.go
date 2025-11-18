package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type TraefikConfig struct {
	Name     string `gorm:"primaryKey" json:"name"`
	Provider string `gorm:"primaryKey;default:http" json:"provider"`
	Protocol string `gorm:"primaryKey" json:"protocol"` // http, tcp, udp
	Type     string `gorm:"primaryKey" json:"type"`     // routers, middlewares, services, serversTransports, tls
	Enabled  bool   `gorm:"default:true" json:"enabled"`
	Config   JSON   `gorm:"type:text" json:"config"` // JSON blob
}

// JSON is a custom type for GORM to handle JSON fields
type JSON map[string]interface{}

// Scan implements the sql.Scanner interface
func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = make(JSON)
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal JSON value")
	}

	result := make(JSON)
	err := json.Unmarshal(bytes, &result)
	*j = result
	return err
}

// Value implements the driver.Valuer interface
func (j JSON) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}
