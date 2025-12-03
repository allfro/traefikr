import {useMemo} from 'react'
import {Badge, Group, Loader, Select} from '@mantine/core'
import {Protocol, Resource, ResourceType} from '../lib/api'
import {ProviderIcon} from './ProviderIcon'
import {useFetchResourcesQuery} from "@/hooks/useFetchResourcesQuery.tsx";
import _ from "lodash";

export interface ResourceSelectorProps {
    protocol: Protocol
    type: ResourceType
    value: string | null
    onChange: (value: string | null) => void
    label?: string
    description?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    error?: string
    unselectable?: "on" | "off" | undefined
    clearable?: boolean
}

export function ResourceSelector(
    {
        protocol,
        type,
        value,
        onChange,
        label,
        description,
        placeholder = 'Select a resource',
        required = false,
        disabled = false,
        readonly = false,
        unselectable = undefined,
        error,
        clearable = true,
    }: ResourceSelectorProps
) {
    const {data: resources, isLoading} = useFetchResourcesQuery(protocol, type)

    // Memoize options array to prevent recreation on every render
    const options = useMemo(
        () =>
            _.map(resources, (resource: Resource) => ({
                value: (resource.source === 'database' && `${resource.name}@${resource.provider}` || resource.name),
                label: (resource.source === 'database' && `${resource.name}@${resource.provider}` || resource.name),
                provider: resource.provider,
                source: resource.source,
                enabled: resource.enabled,
            })),
        [resources]
    )

    return (
        <Select
            label={label}
            description={description}
            placeholder={isLoading ? 'Loading...' : placeholder}
            value={value}
            onChange={onChange}
            data={options}
            searchable
            clearable={clearable}
            unselectable={unselectable}
            required={required}
            disabled={disabled}
            readOnly={readonly}
            error={error}
            rightSection={isLoading ? <Loader size="xs"/> : null}
            renderOption={({option}) => {
                const opt = option as typeof options[0]
                return (
                    <Group gap="xs" wrap="nowrap">
                        <ProviderIcon provider={opt.provider} source={opt.source}/>
                        <span style={{flex: 1}}>{opt.label}</span>
                        {opt.enabled === false && (
                            <Badge size="xs" color="gray" variant="light">
                                Disabled
                            </Badge>
                        )}
                    </Group>
                )
            }}
        />
    )
}
