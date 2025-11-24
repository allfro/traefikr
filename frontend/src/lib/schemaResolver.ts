/**
 * Resolves $ref pointers in a JSON schema by expanding $defs
 */

interface JsonSchema {
  [key: string]: any
  $ref?: string
  $defs?: Record<string, any>
  definitions?: Record<string, any>
}
/**
 * Resolve a single $ref pointer
 */
function resolveRef(ref: string, rootSchema: JsonSchema): any {
  // Remove leading #/ if present
  const path = ref.replace(/^#\//, '').split('/')

  let current: any = rootSchema
  for (const segment of path) {
    if (!current || typeof current !== 'object') {
      throw new Error(`Cannot resolve $ref: ${ref}`)
    }
    current = current[segment]
  }

  return current
}

/**
 * Recursively resolve all $ref pointers in a schema
 */
export function resolveSchema(schema: any, rootSchema?: any): any {
  const root = rootSchema || schema

  // Handle null/undefined
  if (schema == null) {
    return schema
  }

  // Handle primitives
  if (typeof schema !== 'object') {
    return schema
  }

  // Handle arrays
  if (Array.isArray(schema)) {
    return schema.map(item => resolveSchema(item, root))
  }

  // Handle $ref
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, root)
    // Recursively resolve the referenced schema
    return resolveSchema(resolved, root)
  }

  // Handle objects - recursively resolve all properties
  const result: any = {}
  for (const [key, value] of Object.entries(schema)) {
    // Skip $defs and definitions as they're just definitions, not actual schema
    if (key === '$defs' || key === 'definitions') {
      continue
    }
    result[key] = resolveSchema(value, root)
  }

  return result
}

/**
 * Extract a specific subtype schema from a oneOf service schema
 * For example, extract just the loadBalancer schema from an HTTP service schema
 */
export function extractSubtypeSchema(
  fullSchema: JsonSchema,
  subtype: 'loadBalancer' | 'weighted' | 'mirroring' | 'failover'
): JsonSchema {
  // First, fully resolve the schema
  const resolved = resolveSchema(fullSchema)

  // If the schema has a oneOf at the root, find the matching subtype
  if (resolved.oneOf && Array.isArray(resolved.oneOf)) {
    // Each oneOf option should have a single property matching the subtype
    const subtypeOption = resolved.oneOf.find((option: any) => {
      return option.properties && option.properties[subtype]
    })

    if (subtypeOption && subtypeOption.properties && subtypeOption.properties[subtype]) {
      // Return just the subtype schema
      return subtypeOption.properties[subtype]
    }
  }

  // If we have properties at the root level, check if the subtype exists there
  if (resolved.properties && resolved.properties[subtype]) {
    return resolved.properties[subtype]
  }

  // Fallback: return the resolved schema as-is
  return resolved
}

/**
 * Get the configuration key path for a service subtype
 * For example: loadBalancer config should be stored under config.loadBalancer
 */
export function getSubtypeConfigPath(
  subtype: 'loadBalancer' | 'weighted' | 'mirroring' | 'failover'
): string {
  return subtype
}
