import {useMemo} from 'react'
import {Modal} from '@mantine/core'
import {Resource} from '../lib/api'
import {SchemaForm} from './SchemaForm'
import {ServiceSchemaForm} from './ServiceSchemaForm'
import {MiddlewareSchemaForm} from './MiddlewareSchemaForm'
import _ from 'lodash'

export interface ResourceViewModalProps {
    opened: boolean
    onClose: () => void
    resource: Resource
    resolvedSchema?: any
}

export function ResourceViewModal(
    {
        opened,
        onClose,
        resource: {config, protocol, type, name: resourceName},
        resolvedSchema,
    }: ResourceViewModalProps
) {
    // Detect service subtype or middleware type and unwrap config if needed
    const {isService, isMiddleware, subtype, middlewareType, unwrappedConfig} = useMemo(() => {
        // Handle services
        if (type === 'services') {
            // Detect subtype from config
            if (config?.weighted) {
                return {
                    isService: true,
                    isMiddleware: false,
                    subtype: 'weighted',
                    middlewareType: null,
                    unwrappedConfig: config.weighted
                }
            } else if (config?.mirroring) {
                return {
                    isService: true,
                    isMiddleware: false,
                    subtype: 'mirroring',
                    middlewareType: null,
                    unwrappedConfig: config.mirroring
                }
            } else if (config?.failover) {
                return {
                    isService: true,
                    isMiddleware: false,
                    subtype: 'failover',
                    middlewareType: null,
                    unwrappedConfig: config.failover
                }
            } else if (config?.loadBalancer) {
                return {
                    isService: true,
                    isMiddleware: false,
                    subtype: 'loadBalancer',
                    middlewareType: null,
                    unwrappedConfig: config.loadBalancer
                }
            }
            // Default to loadBalancer if no subtype detected
            return {
                isService: true,
                isMiddleware: false,
                subtype: 'loadBalancer',
                middlewareType: null,
                unwrappedConfig: config
            }
        }

        // Handle middlewares
        if (type === 'middlewares') {
            // Middleware type is the first key in config object
            if (config && Object.keys(config).length > 0) {
                const keys = Object.keys(config)
                const detectedType = keys[0]
                return {
                    isService: false,
                    isMiddleware: true,
                    subtype: null,
                    middlewareType: detectedType,
                    unwrappedConfig: config[detectedType] || {}
                }
            }
            return {
                isService: false,
                isMiddleware: true,
                subtype: null,
                middlewareType: 'unknown',
                unwrappedConfig: config
            }
        }

        // Default for other resource types
        return {isService: false, isMiddleware: false, subtype: null, middlewareType: null, unwrappedConfig: config}
    }, [type, config])

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<><strong>{_.capitalize(type.slice(0, -1))}</strong>: {resourceName}</>}
            size="80%"
        >
            {isService && subtype ? (
                <ServiceSchemaForm
                    protocol={protocol}
                    subtype={subtype as 'loadBalancer' | 'weighted' | 'mirroring' | 'failover'}
                    value={unwrappedConfig}
                    onChange={() => {
                    }} // No-op since readonly
                    readonly={true}
                />
            ) : isMiddleware && middlewareType ? (
                <MiddlewareSchemaForm
                    protocol={protocol}
                    middlewareType={middlewareType}
                    value={unwrappedConfig}
                    onChange={() => {
                    }} // No-op since readonly
                    readonly={true}
                />
            ) : (
                <SchemaForm
                    protocol={protocol}
                    type={type}
                    value={config}
                    onChange={() => {
                    }} // No-op since readonly
                    readonly={true}
                    resolvedSchema={resolvedSchema}
                />
            )}
        </Modal>
    )
}
