package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type TraefikClient struct {
	baseURL           string
	client            *http.Client
	basicAuthUsername string
	basicAuthPassword string
	apiKeyHeader      string
	apiKeySecret      string
}

func NewTraefikClient() *TraefikClient {
	baseURL := os.Getenv("TRAEFIK_API_URL")
	if baseURL == "" {
		baseURL = "http://traefik:8080" // Default for docker-compose
	}

	return &TraefikClient{
		baseURL:           baseURL,
		client:            &http.Client{Timeout: 10 * time.Second},
		basicAuthUsername: os.Getenv("TRAEFIK_BASIC_AUTH_USERNAME"),
		basicAuthPassword: os.Getenv("TRAEFIK_BASIC_AUTH_PASSWORD"),
		apiKeyHeader:      os.Getenv("TRAEFIK_API_KEY_HEADER"),
		apiKeySecret:      os.Getenv("TRAEFIK_API_KEY_SECRET"),
	}
}

// doRequest performs an HTTP GET request with authentication headers if configured
func (tc *TraefikClient) doRequest(url string) (*http.Response, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add Basic Auth if username is configured
	if tc.basicAuthUsername != "" {
		req.SetBasicAuth(tc.basicAuthUsername, tc.basicAuthPassword)
	} else if tc.apiKeyHeader != "" {
		req.Header.Set(tc.apiKeyHeader, tc.apiKeySecret)
	}

	return tc.client.Do(req)
}

// GetResources fetches resources of a specific type from Traefik
func (tc *TraefikClient) GetResources(protocol, resourceType string) ([]interface{}, error) {

	var url string

	if protocol == "any" {
		url = fmt.Sprintf("%s/api/%s", tc.baseURL, resourceType)
	} else {
		url = fmt.Sprintf("%s/api/%s/%s", tc.baseURL, protocol, resourceType)
	}

	resp, err := tc.doRequest(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch resources: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Return empty array if endpoint doesn't exist (not an error)
		if resp.StatusCode == http.StatusNotFound {
			return make([]interface{}, 0), nil
		}
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var result []interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return result, nil
}

// GetResource fetches a specific resource by name and provider from Traefik
func (tc *TraefikClient) GetResource(protocol, resourceType, name, provider string) (map[string]interface{}, error) {
	var url string

	if protocol == "any" {
		url = fmt.Sprintf("%s/api/%s/%s@%s", tc.baseURL, resourceType, name, provider)
	} else {
		url = fmt.Sprintf("%s/api/%s/%s/%s@%s", tc.baseURL, protocol, resourceType, name, provider)
	}

	resp, err := tc.doRequest(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch resource: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Return an empty map if the endpoint doesn't exist (not an error)
		if resp.StatusCode == http.StatusNotFound {
			return make(map[string]interface{}), nil
		}
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return result, nil
}
