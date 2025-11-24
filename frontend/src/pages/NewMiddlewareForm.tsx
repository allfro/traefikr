import Form from '@rjsf/mantine';
import {
    ArrayFieldItemButtonsTemplateProps,
    ArrayFieldTemplateProps,
    ErrorTransformer,
    FieldProps,
    ObjectFieldTemplateProps,
    RJSFSchema,
    RJSFValidationError
} from '@rjsf/utils';
import {getDefaultRegistry} from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import {Button, Card, Fieldset, Group, Paper, Space, Stack, Switch, Tabs, Text, TextInput} from "@mantine/core";
import _ from "lodash";
import React, {useState} from "react";
import {IconPlus} from "@tabler/icons-react";
import {ResourceSelector} from "@/components/ResourceSelector.tsx";
import {useForm} from "@mantine/form";


export function NewMiddlewareForm() {
    const form = useForm({
        initialValues: {
            name: '',
            protocol: "http",
            type: "type",
            config: {}
        },
        validate: {
            name: (value) => {
                if (_.isEmpty(value))
                    return 'A service name is required';
                else if (!/^[a-zA-Z0-9_-]+$/.test(value))
                    return 'Service names can only contain alphanumeric characters, underscores, and dashes';
                return null
            },
        }
    });

    const schema: RJSFSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$defs": {
            "service": {
                "title": "Service",
                "type": "string",
                "$comment": "type=service",
                "description": "The service identifier"
            },
            "stickyConfig": {
                "title": "Sticky Sessions",
                "type": "object",
                "properties": {
                    "cookie": {
                        "title": "Cookie",
                        "type": "object",
                        "properties": {
                            "name": {
                                "title": "Name",
                                "type": "string",
                                "description": "Custom cookie identifier"
                            },
                            "secure": {
                                "title": "Secure",
                                "type": "boolean",
                                "description": "HTTPS-only flag"
                            },
                            "httpOnly": {
                                "title": "HTTP Only",
                                "type": "boolean",
                                "description": "JavaScript access prevention"
                            },
                            "sameSite": {
                                "title": "Same Site",
                                "type": "string",
                                "enum": ["none", "lax", "strict", ""],
                                "description": "SameSite attribute for the cookie"
                            },
                            "maxAge": {
                                "title": "Max Age",
                                "type": "integer",
                                "description": "Expiration duration in seconds"
                            },
                            "domain": {
                                "title": "Domain",
                                "type": "string",
                                "description": "Cookie validity scope across subdomains"
                            }
                        }
                    }
                },
                "description": "Enables sticky sessions with cookie-based affinity"
            },
            "loadBalancerHealthCheck": {
                "title": "Health Check",
                "type": "object",
                "properties": {
                    "path": {
                        "title": "Path",
                        "default": "",
                        "type": "string",
                        "description": "Endpoint for health verification"
                    },
                    "scheme": {
                        "title": "Scheme",
                        "type": "string",
                        "description": "Protocol override"
                    },
                    "mode": {
                        "title": "Mode",
                        "type": "string",
                        "default": "http",
                        "enum": ["grpc", "http"],
                        "description": "Health check mode"
                    },
                    "hostname": {
                        "title": "Hostname",
                        "type": "string",
                        "default": "",
                        "description": "Custom Host header value"
                    },
                    "port": {
                        "title": "Port",
                        "type": "integer",
                        "description": "Endpoint port override"
                    },
                    "interval": {
                        "title": "Interval",
                        "type": "string",
                        "default": "30s",
                        "description": "Check frequency (default: 30s)"
                    },
                    "unhealthyInterval": {
                        "title": "Unhealthy Interval",
                        "type": "string",
                        "default": "30s",
                        "description": "Failed server check rate"
                    },
                    "timeout": {
                        "title": "Timeout",
                        "type": "string",
                        "default": "5s",
                        "description": "Maximum wait duration (default: 5s)"
                    },
                    "headers": {
                        "title": "Headers",
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Custom request headers"
                    },
                    "followRedirects": {
                        "title": "Follow Redirects",
                        "type": "boolean",
                        "default": true,
                        "description": "Follow redirects (default: true)"
                    },
                    "method": {
                        "title": "Method",
                        "type": "string",
                        "default": "GET",
                        "description": "HTTP verb (default: GET)"
                    },
                    "status": {
                        "title": "Status",
                        "type": "integer",
                        "description": "Expected response code"
                    }
                },
                "description": "Configures health check to remove unhealthy servers from the load balancing rotation"
            },
            "weightedHealthCheck": {
                "title": "Health Check",
                "type": "object",
                "$id": "/services/parentHealthCheck",
                "description": "Activates health monitoring for child services"
            },
            "passiveHealthCheck": {
                "title": "Passive Health Check",
                "type": "object",
                "properties": {
                    "failureWindow": {
                        "title": "Failure Window",
                        "type": "string",
                        "default": "10s",
                        "description": "Time window for failure assessment (default: 10s)"
                    },
                    "maxFailedAttempts": {
                        "title": "Max Failed Attempts",
                        "type": "integer",
                        "default": 1,
                        "description": "Consecutive failures threshold (default: 1)"
                    }
                },
                "description": "Configures the passive health check to remove unhealthy servers from the load balancing rotation"
            }
        },
        "oneOf": [
            {
                "type": "object",
                "title": "Load Balancer",
                "properties": {
                    "loadBalancer": {
                        "title": "Load Balancer",
                        "type": "object",
                        "properties": {
                            "strategy": {
                                "title": "Strategy",
                                "type": "string",
                                "enum": ["p2c", "leasttime"],
                                "description": "Load balancing algorithm: p2c (power of two choices) or leasttime (lowest average response time)"
                            },
                            "servers": {
                                "title": "Servers",
                                "minItems": 1,
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "title": "Server",
                                    "properties": {
                                        "url": {
                                            "title": "URL",
                                            "type": "string",
                                            "description": "Backend instance endpoint"
                                        },
                                        "weight": {
                                            "title": "Weight",
                                            "type": "integer",
                                            "description": "Load distribution ratio"
                                        },
                                        "preservePath": {
                                            "title": "Preserve Path",
                                            "type": "boolean",
                                            "description": "Maintain URL path"
                                        }
                                    },
                                    "required": ["url"]
                                },
                                "description": "Represents individual backend instances for your service"
                            },
                            "sticky": {
                                "$ref": "#/$defs/stickyConfig"
                            },
                            "healthCheck": {
                                "$ref": "#/$defs/loadBalancerHealthCheck"
                            },
                            "passiveHealthCheck": {
                                "$ref": "#/$defs/passiveHealthCheck"
                            },
                            "passHostHeader": {
                                "title": "Pass Host Header",
                                "type": "boolean",
                                "default": true,
                                "description": "Allows forwarding of the client Host header to server"
                            },
                            "serversTransport": {
                                "title": "Servers Transport",
                                "type": "string",
                                "default": "default@internal",
                                "description": "Reference to an HTTP ServersTransport configuration for the communication between Traefik and your servers"
                            },
                            "responseForwarding": {
                                "title": "Response Forwarding",
                                "type": "object",
                                "properties": {
                                    "flushInterval": {
                                        "title": "Flush Interval",
                                        "type": "string",
                                        "description": "Specifies the interval in between flushes to the client while copying the response body (in milliseconds, default: 100ms)",
                                        "default": "100ms"
                                    }
                                },
                                "description": "Configures how Traefik forwards the response from the backend server to the client"
                            }
                        },
                        "required": ["servers"],
                        "additionalProperties": false
                    }
                },
                "required": ["loadBalancer"],
                "additionalProperties": false
            },
            {
                "type": "object",
                "title": "Weighted Round Robin",
                "properties": {
                    "weighted": {
                        "title": "Weighted Round Robin",
                        "type": "object",
                        "properties": {
                            "services": {
                                "title": "Services",
                                "type": "array",
                                "minItems": 1,
                                "items": {
                                    "type": "object",
                                    "title": "Service",
                                    "properties": {
                                        "name": {
                                            "title": "Name",
                                            "$ref": "#/$defs/service",
                                            "description": "The referenced service identifier"
                                        },
                                        "weight": {
                                            "title": "Weight",
                                            "type": "integer",
                                            "description": "Numeric value determining traffic distribution ratio"
                                        }
                                    },
                                    "required": ["name", "weight"]
                                },
                                "description": "Array of services with their traffic distribution weights"
                            },
                            "sticky": {
                                "$ref": "#/$defs/stickyConfig"
                            },
                            "healthCheck": {
                                "$ref": "#/$defs/weightedHealthCheck"
                            },
                            "passiveHealthCheck": {
                                "$ref": "#/$defs/passiveHealthCheck"
                            }
                        },
                        "required": ["services"],
                        "additionalProperties": false,
                        "description": "Weighted round robin service for load balancing between services"
                    }
                },
                "required": ["weighted"],
                "additionalProperties": false
            },
            {
                "type": "object",
                "title": "Mirroring",
                "properties": {
                    "mirroring": {
                        "title": "Mirroring",
                        "type": "object",
                        "properties": {
                            "service": {
                                "title": "Service",
                                "$ref": "#/$defs/service",
                                "description": "The primary service receiving traffic"
                            },
                            "mirrorBody": {
                                "title": "Mirror Body",
                                "type": "boolean",
                                "default": true,
                                "description": "Controls whether request body is mirrored"
                            },
                            "maxBodySize": {
                                "title": "Max Body Size",
                                "type": "integer",
                                "default": -1,
                                "description": "Maximum body size for mirroring in bytes (default: -1 for unlimited)"
                            },
                            "mirrors": {
                                "title": "Mirrors",
                                "type": "array",
                                "minItems": 1,
                                "items": {
                                    "title": "Service",
                                    "type": "object",
                                    "properties": {
                                        "name": {
                                            "title": "Name",
                                            "$ref": "#/$defs/service",
                                            "description": "Service identifier to mirror traffic to"
                                        },
                                        "percent": {
                                            "title": "Percent",
                                            "type": "integer",
                                            "default": 0,
                                            "description": "Integer percentage of requests to mirror (default: 0, meaning no traffic)"
                                        }
                                    },
                                    "required": ["name"]
                                },
                                "description": "Array of mirror service definitions"
                            },
                            "sticky": {
                                "$ref": "#/$defs/stickyConfig"
                            },
                            "healthCheck": {
                                "$ref": "#/$defs/weightedHealthCheck"
                            },
                            "passiveHealthCheck": {
                                "$ref": "#/$defs/passiveHealthCheck"
                            }
                        },
                        "required": ["service"],
                        "additionalProperties": false,
                        "description": "Mirroring service for duplicating traffic to multiple services"
                    }
                },
                "required": ["mirroring"],
                "additionalProperties": false
            },
            {
                "type": "object",
                "title": "Failover",
                "properties": {
                    "failover": {
                        "title": "Failover",
                        "type": "object",
                        "properties": {
                            "service": {
                                "title": "Service",
                                "$ref": "#/$defs/service",
                                "description": "The primary service that receives traffic initially"
                            },
                            "fallback": {
                                "title": "Fallback",
                                "$ref": "#/$defs/service",
                                "description": "The backup service activated when the main service becomes unreachable"
                            },
                            "sticky": {
                                "$ref": "#/$defs/stickyConfig"
                            },
                            "healthCheck": {
                                "$ref": "#/$defs/weightedHealthCheck"
                            },
                            "passiveHealthCheck": {
                                "$ref": "#/$defs/passiveHealthCheck"
                            }
                        },
                        "required": ["service", "fallback"],
                        "additionalProperties": false,
                        "description": "Failover service for automatic failover to backup service"
                    }
                },
                "required": ["failover"],
                "additionalProperties": false
            }
        ]
    };


    const TabbedObjectFieldTemplate = (
        {
            fieldPathId,
            properties,
            schema
        }: ObjectFieldTemplateProps
    ) => {

        if (fieldPathId.$id === 'root') {
            return (
                <Stack gap={'md'}>
                    {properties.map(prop => (
                        <div key={prop.content.key}>{prop.content}</div>
                    ))}
                </Stack>
            )
        }

        if (fieldPathId.path.length === 1) {
            const objectProperties = properties.filter(prop => _.get(prop, 'content.props.schema.type', 'object') === 'object' && _.get(prop, 'content.props.schema.properties', []).length !== 0);
            const simpleProperties = properties.filter(prop => _.get(prop, 'content.props.schema.type', 'object') !== 'object' || _.get(prop, 'content.props.schema.properties', []).length === 0);

            return (
                <Tabs defaultValue={'general'} keepMounted={false}>
                    <Tabs.List>
                        <Tabs.Tab value={'general'}>General</Tabs.Tab>
                        {objectProperties.map(prop => {
                            return (
                                <Tabs.Tab key={prop.content.key} value={prop.name}>
                                    {_.get(prop, 'content.props.schema.title', prop?.name)}
                                </Tabs.Tab>
                            );
                        })}
                    </Tabs.List>
                    <Tabs.Panel value={'general'}>
                        <Space h="sm"/>
                        <Stack gap={'md'}>
                            {simpleProperties.map(prop => {
                                return (
                                    <div key={prop.content.key}>{prop.content}</div>
                                );
                            })}
                        </Stack>
                        <Space h="sm"/>
                    </Tabs.Panel>
                    {objectProperties.map(prop => (
                        <Tabs.Panel value={prop.name} key={prop.content.key}>
                            <Space h="sm"/>
                            {prop.content}
                            <Space h="sm"/>
                        </Tabs.Panel>
                    ))}
                </Tabs>
            );
        }

        if (fieldPathId.path.length === 2) {
            return (
                <Stack gap={'md'}>
                    {properties.map(prop => (
                        <div key={prop.content.key}>{prop.content}</div>
                    ))}
                </Stack>
            )
        }

        if (fieldPathId.path.length > 2) {

            return (
                <Fieldset legend={<Text size={'sm'} fw={500}>{schema.title}</Text>}>
                    <Stack gap={'md'}>
                        {properties.map(prop => (
                            <div key={prop.content.key}>{prop.content}</div>
                        ))}
                    </Stack>
                </Fieldset>
            );
        }


    };


    const transformErrors: ErrorTransformer = (errors) => {
        return _.filter(errors, (e: RJSFValidationError) => e?.property?.startsWith('.')) as RJSFValidationError[]
    }


    const CustomBooleanField = ({formData, defaultChecked, schema, onChange, fieldPathId, errorSchema}: FieldProps) => {
        const [enabled, setEnabled] = React.useState(formData);

        return (
            <Switch
                defaultChecked={defaultChecked}
                checked={enabled}
                color="cyan"
                label={schema.title}
                description={schema.description}
                size="sm"
                onChange={(e) => {
                    setEnabled(e.target.checked);
                    onChange(e.target.checked, fieldPathId.path, errorSchema);
                }}
            />
        )
    }

    const CustomBooleanField2 = ({formData, schema, onChange, fieldPathId, errorSchema}: FieldProps) => {
        const [enabled, setEnabled] = React.useState(!_.isEmpty(formData));

        return (
            <Switch
                checked={enabled}
                color="cyan"
                label={schema.title}
                description={schema.description}
                size="sm"
                onChange={(e) => {
                    const newValue = e.target.checked && {} || undefined;
                    setEnabled(e.target.checked);
                    onChange(newValue, fieldPathId.path, errorSchema);
                }}
            />
        )
    }

    const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
        const {schema, items, canAdd, onAddClick, readonly} = props;
        return (
            <Fieldset>
                <Stack gap={'sm'}>

                    <Group justify={'space-between'}>
                        <div>
                            <Text size={'sm'} fw={500}>{schema.title}</Text>
                            <Text size={'xs'} c={'dimmed'}>{schema.description}</Text>
                        </div>
                        {canAdd && !readonly && (
                            <Button variant="filled" color="cyan" size="xs" onClick={onAddClick}
                                    leftSection={<IconPlus size={14}/>}>Add</Button>
                        )}
                    </Group>
                    {items.length === 0 && (
                        <Paper p="sm" shadow={'none'} withBorder style={{textAlign: 'center'}}>
                            <Text size="sm" c="dimmed">
                                No items. {!readonly && 'Click "Add" to add an item'}
                            </Text>
                        </Paper>
                    ) || items}
                </Stack>
            </Fieldset>
        );
    };

    function ArrayFieldItemButtonsTemplate(props: ArrayFieldItemButtonsTemplateProps) {
        const {hasMoveDown, hasMoveUp, onMoveDownItem, onMoveUpItem, onRemoveItem} = props;
        return (
            <>
                {hasMoveDown && <button onClick={onMoveDownItem}>Down</button>}
                {hasMoveUp && <button onClick={onMoveUpItem}>Up</button>}
                <button onClick={onRemoveItem}>Delete</button>
                <hr/>
            </>
        );
    }

    const {
        fields: {StringField},
    } = getDefaultRegistry();

    const ServiceStringField = (props: FieldProps) => {
        const {schema} = props;

        if (schema.$comment === 'type=service') {
            return <ServiceSelectField {...props}/>;
        }
        return <StringField {...props}/>
    }

    const ServiceSelectField = (
        {
            formData,
            schema,
            onChange,
            fieldPathId,
            errorSchema,
            registry,
            readonly,
            disabled,
            required
        }: FieldProps
    ) => {
        const [name, setName] = useState(formData)
        return (
            <ResourceSelector
                label={schema.title}
                description={schema.description}
                protocol={registry.formContext.traefikProtocol}
                type={registry.formContext.traefikType}
                readonly={readonly}
                required={required}
                disabled={disabled}
                value={name}
                onChange={(value) => {
                    setName(value)
                    onChange(value, fieldPathId.path, errorSchema)
                }}
            />
        )
    }

    return (
        <Card>
            <form onSubmit={form.onSubmit(console.log)}>
                <TextInput
                    label={"Service Name"}
                    required
                    description={"The name of the service"}
                    {...form.getInputProps('name')}
                    autoFocus
                />
            </form>
            <Space h={'sm'}/>
            <div>
                <Text size={'sm'} fw={500}>Service Type</Text>
                <Text size={'xs'} c={'dimmed'}>The way in which backend servers/services are connected to the
                    router</Text>
            </div>
            <Space h={5}/>
            <Form schema={schema}
                  formData={{}}
                  validator={validator}
                  onSubmit={({formData}) => {
                      // Validate Mantine form first
                      const validation = form.validate();

                      if (validation.hasErrors) {
                          console.log('Mantine validation failed:', validation.errors);
                          return; // Stop submission
                      }

                      // Both forms are valid
                      console.log('All valid!', {
                          ...form.values,
                          config: formData
                      });

                      // Submit to API or do whatever you need
                  }}
                  onFocus={console.log.bind(null, 'focus')}
                  showErrorList={'bottom'}
                  transformErrors={transformErrors}
                  focusOnFirstError={false}
                  onError={console.error.bind(null, 'errors')}
                  formContext={{traefikProtocol: 'http', traefikType: 'services'}}
                  templates={{
                      ObjectFieldTemplate: TabbedObjectFieldTemplate,
                      ArrayFieldTemplate,
                      // ArrayFieldItemButtonsTemplate
                  }}
                  fields={{
                      BooleanField: CustomBooleanField,
                      StringField: ServiceStringField,
                      "/services/parentHealthCheck": CustomBooleanField2,
                      // "/services/serviceName": ServiceSelectField
                  }}
                // readonly
                  omitExtraData
            />
        </Card>
    )
}