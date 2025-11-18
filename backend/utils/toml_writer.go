package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"

	"github.com/pelletier/go-toml/v2"
)

// TomlWriter handles writing serverTransport configurations to TOML files
type TomlWriter struct {
	configPath string
}

// NewTomlWriter creates a new TomlWriter instance
func NewTomlWriter() *TomlWriter {
	configPath := os.Getenv("TRAEFIK_CONFIG_PATH")
	return &TomlWriter{
		configPath: configPath,
	}
}

// IsEnabled returns true if TRAEFIK_CONFIG_PATH is configured
func (w *TomlWriter) IsEnabled() bool {
	return w.configPath != ""
}

// generateFilename creates a filename using protocol, type, and SHA256 hash of the transport name
func (w *TomlWriter) generateFilename(protocol, resourceType, name string) string {
	hash := sha256.Sum256([]byte(name))
	hashStr := hex.EncodeToString(hash[:])
	return fmt.Sprintf("traefikr_%s_%s_%s.toml", protocol, resourceType, hashStr)
}

// WriteServerTransport writes a serverTransport configuration to a TOML file
func (w *TomlWriter) WriteServerTransport(protocol, resourceType, name string, config map[string]interface{}) error {
	if !w.IsEnabled() {
		return nil // Skip if not configured
	}

	// Create the directory if it doesn't exist
	if err := os.MkdirAll(w.configPath, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Build the full Traefik configuration structure
	// Format: [protocol.serversTransports.name]
	traefikConfig := map[string]interface{}{
		protocol: map[string]interface{}{
			"serversTransports": map[string]interface{}{
				name: config,
			},
		},
	}

	// Marshal to TOML
	data, err := toml.Marshal(traefikConfig)
	if err != nil {
		return fmt.Errorf("failed to marshal TOML: %w", err)
	}

	// Write to file
	filename := w.generateFilename(protocol, resourceType, name)
	filePath := filepath.Join(w.configPath, filename)

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write TOML file: %w", err)
	}

	return nil
}

// DeleteServerTransport removes the TOML file for a serverTransport
func (w *TomlWriter) DeleteServerTransport(protocol, resourceType, name string) error {
	if !w.IsEnabled() {
		return nil // Skip if not configured
	}

	filename := w.generateFilename(protocol, resourceType, name)
	filePath := filepath.Join(w.configPath, filename)

	// Remove file (ignore if it doesn't exist)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete TOML file: %w", err)
	}

	return nil
}
