import {useMemo} from 'react'
import {Alert, Loader, Stack, Text} from '@mantine/core'
import {IconAlertCircle} from '@tabler/icons-react'
import {resolveSchema} from '@/lib/schemaResolver'
import {SchemaForm} from './SchemaForm'
import _ from "lodash";
import useSchemaQuery from "@/hooks/useSchemaQuery.tsx";
import {Protocol} from "@/lib/api.ts";

interface MiddlewareSchemaFormProps {
  protocol: Protocol
  middlewareType: string
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
  disabled?: boolean
  readonly?: boolean
}

/**
 * Wrapper around SchemaForm that handles middleware type schema extraction
 * Resolves $defs and extracts only the relevant middleware type schema
 */
export function MiddlewareSchemaForm({
  protocol,
  middlewareType,
  value,
  onChange,
  disabled = false,
  readonly = false,
}: MiddlewareSchemaFormProps) {
  const { data: fullSchema, isLoading, error } = useSchemaQuery(protocol, 'middlewares');

  // Extract and resolve the specific middleware type schema
  const middlewareSchema = useMemo(() => {
    if (!fullSchema || !fullSchema.properties) return null

    try {
      // Get the specific middleware type schema
      const typeSchema = fullSchema.properties[middlewareType]
      if (!typeSchema) {
        console.error(`Middleware type "${middlewareType}" not found in schema`)
        return null
      }

      // Resolve all $ref pointers
      const resolved = resolveSchema(typeSchema, fullSchema)
      console.log(`Resolved ${middlewareType} middleware schema:`, resolved)
      return resolved
    } catch (err) {
      console.error('Failed to extract middleware schema:', err)
      return null
    }
  }, [fullSchema, middlewareType])

  if (isLoading) {
    return (
      <Stack align="center" p="xl">
        <Loader />
        <Text c="dimmed" size="sm">Loading schema...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle />} title="Error loading schema" color="red">
        Failed to load schema for middleware. Please try again.
      </Alert>
    )
  }

  if (!middlewareSchema) {
    return (
      <Alert icon={<IconAlertCircle />} title="Invalid schema" color="yellow">
        Could not extract schema for {middlewareType} middleware type.
      </Alert>
    )
  }

  // Pass the resolved middleware schema to SchemaForm
  return (
    <SchemaForm
      protocol={protocol as any}
      type="middlewares"
      value={_.get(value, middlewareType, {})}
      onChange={onChange}
      disabled={disabled}
      readonly={readonly}
      resolvedSchema={middlewareSchema}
    />
  )
}
