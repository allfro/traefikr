package schemas

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"github.com/santhosh-tekuri/jsonschema/v6"
)

// Embedded JSON schemas for validation
// These will need to be populated with actual Traefik schemas

//go:embed http_routers.json
var httpRoutersSchema string

//go:embed http_services.json
var httpServicesSchema string

//go:embed http_middlewares.json
var httpMiddlewaresSchema string

//go:embed http_serversTransport.json
var httpServersTransportSchema string

//go:embed http_tls.json
var httpTLSSchema string

//go:embed tcp_routers.json
var tcpRoutersSchema string

//go:embed tcp_services.json
var tcpServicesSchema string

//go:embed tcp_middlewares.json
var tcpMiddlewaresSchema string

//go:embed tcp_serversTransports.json
var tcpServersTransportsSchema string

//go:embed tcp_tls.json
var tcpTLSSchema string

//go:embed udp_routers.json
var udpRoutersSchema string

//go:embed udp_services.json
var udpServicesSchema string

//go:embed udp_middlewares.json
var udpMiddlewaresSchema string

//go:embed any_entrypoints.json
var entrypointsSchema string

var schemaMap = map[string]map[string]string{
	"http": {
		"routers":           httpRoutersSchema,
		"services":          httpServicesSchema,
		"middlewares":       httpMiddlewaresSchema,
		"serversTransports": httpServersTransportSchema,
		"tls":               httpTLSSchema,
	},
	"tcp": {
		"routers":           tcpRoutersSchema,
		"services":          tcpServicesSchema,
		"middlewares":       tcpMiddlewaresSchema,
		"serversTransports": tcpServersTransportsSchema,
		"tls":               tcpTLSSchema,
	},
	"udp": {
		"routers":     udpRoutersSchema,
		"services":    udpServicesSchema,
		"middlewares": udpMiddlewaresSchema,
	},
	"any": {
		"entrypoints": entrypointsSchema,
	},
}

// GetSchema returns the schema for a given protocol and type
func GetSchema(protocol, resourceType string) (string, error) {
	protocolSchemas, ok := schemaMap[protocol]
	if !ok {
		return "", fmt.Errorf("unknown protocol: %s", protocol)
	}

	schema, ok := protocolSchemas[resourceType]
	if !ok {
		return "", fmt.Errorf("unknown type: %s for protocol: %s", resourceType, protocol)
	}

	return schema, nil
}

// Validate validates a JSON document against a schema
func Validate(protocol, resourceType string, document interface{}) error {
	schemaStr, err := GetSchema(protocol, resourceType)
	if err != nil {
		return err
	}

	// Parse schema JSON
	var schemaDoc interface{}
	if err := json.Unmarshal([]byte(schemaStr), &schemaDoc); err != nil {
		return fmt.Errorf("failed to parse schema: %w", err)
	}

	// Compile the schema
	compiler := jsonschema.NewCompiler()
	schemaURL := fmt.Sprintf("schema://%s/%s.json", protocol, resourceType)

	if err := compiler.AddResource(schemaURL, schemaDoc); err != nil {
		return fmt.Errorf("failed to add schema resource: %w", err)
	}

	schema, err := compiler.Compile(schemaURL)
	if err != nil {
		return fmt.Errorf("failed to compile schema: %w", err)
	}

	// Validate the document
	if err := schema.Validate(document); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	return nil
}
