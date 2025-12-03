import {useEffect, useState} from 'react'
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Checkbox,
  Code,
  Divider,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput
} from '@mantine/core'
import {IconAlertCircle, IconCheck, IconCode, IconPlus, IconTrash} from '@tabler/icons-react'
import {Protocol} from "@/lib/api.ts"
import {parseTraefikRule} from "@/lib/ruleParser.ts"

// HTTP condition types
type HTTPConditionType = 'Host' | 'HostRegexp' | 'Path' | 'PathPrefix' | 'PathRegexp' |
  'Header' | 'HeaderRegexp' | 'Query' | 'QueryRegexp' | 'Method' | 'ClientIP'

// TCP condition types
type TCPConditionType = 'HostSNI' | 'HostSNIRegexp' | 'ClientIP' | 'ALPN'

// UDP condition types (same as TCP for now)
type UDPConditionType = TCPConditionType

type ConditionType = HTTPConditionType | TCPConditionType | UDPConditionType

// Condition type metadata
interface ConditionTypeMetadata {
  placeholder: string
  keyPlaceholder?: string
  description: string
  needsKeyValue: boolean
}

const CONDITION_METADATA: Record<ConditionType, ConditionTypeMetadata> = {
  // HTTP Host Matchers
  Host: {
    placeholder: 'example.com or *.example.com',
    description: 'Match exact hostname (case-insensitive)',
    needsKeyValue: false
  },
  HostRegexp: {
    placeholder: '^.+\\.example\\.com$',
    description: 'Match hostname using Go regular expression',
    needsKeyValue: false
  },
  // HTTP Path Matchers
  Path: {
    placeholder: '/api/users',
    description: 'Match exact request path',
    needsKeyValue: false
  },
  PathPrefix: {
    placeholder: '/api',
    description: 'Match request path prefix',
    needsKeyValue: false
  },
  PathRegexp: {
    placeholder: '^/api/.*',
    description: 'Match path using Go regular expression',
    needsKeyValue: false
  },
  // HTTP Header Matchers
  Header: {
    placeholder: 'Header value (e.g., application/json)',
    keyPlaceholder: 'Header name (e.g., Content-Type)',
    description: 'Match exact header key-value pair',
    needsKeyValue: true
  },
  HeaderRegexp: {
    placeholder: 'Header value pattern',
    keyPlaceholder: 'Header name (e.g., Content-Type)',
    description: 'Match header using regular expression',
    needsKeyValue: true
  },
  // HTTP Query Matchers
  Query: {
    placeholder: 'Parameter value (e.g., 10)',
    keyPlaceholder: 'Parameter name (e.g., page)',
    description: 'Match exact query parameter key-value pair',
    needsKeyValue: true
  },
  QueryRegexp: {
    placeholder: 'Parameter value pattern',
    keyPlaceholder: 'Parameter name (e.g., page)',
    description: 'Match query parameter using regular expression',
    needsKeyValue: true
  },
  // HTTP Other
  Method: {
    placeholder: 'GET, POST, PUT, DELETE',
    description: 'Match HTTP request methods (comma-separated)',
    needsKeyValue: false
  },
  ClientIP: {
    placeholder: '192.168.1.0/24 or 10.0.0.1',
    description: 'Match client IP address or CIDR range',
    needsKeyValue: false
  },
  // TCP/UDP Matchers
  HostSNI: {
    placeholder: 'example.com or * for all',
    description: 'Match exact Server Name Indication (TLS hostname)',
    needsKeyValue: false
  },
  HostSNIRegexp: {
    placeholder: '^.+\\.example\\.com$',
    description: 'Match SNI using Go regular expression',
    needsKeyValue: false
  },
  ALPN: {
    placeholder: 'h2, http/1.1, etc.',
    description: 'Match Application-Layer Protocol Negotiation',
    needsKeyValue: false
  }
}

// Select options for condition types
const HTTP_CONDITION_TYPES = [
  { group: 'Host Matchers', items: [
    { value: 'Host', label: 'Host' },
    { value: 'HostRegexp', label: 'HostRegexp' }
  ]},
  { group: 'Path Matchers', items: [
    { value: 'Path', label: 'Path' },
    { value: 'PathPrefix', label: 'PathPrefix' },
    { value: 'PathRegexp', label: 'PathRegexp' }
  ]},
  { group: 'Header Matchers', items: [
    { value: 'Header', label: 'Header' },
    { value: 'HeaderRegexp', label: 'HeaderRegexp' }
  ]},
  { group: 'Query Matchers', items: [
    { value: 'Query', label: 'Query' },
    { value: 'QueryRegexp', label: 'QueryRegexp' }
  ]},
  { group: 'Other', items: [
    { value: 'Method', label: 'Method' },
    { value: 'ClientIP', label: 'ClientIP' }
  ]}
]

const TCP_UDP_CONDITION_TYPES = [
  { value: 'HostSNI', label: 'HostSNI' },
  { value: 'HostSNIRegexp', label: 'HostSNIRegexp' },
  { value: 'ClientIP', label: 'ClientIP' },
  { value: 'ALPN', label: 'ALPN' }
]

// Protocol-specific configuration
type RuleBuilderProtocol = 'http' | 'tcp' | 'udp'

const PROTOCOL_CONFIG: Record<RuleBuilderProtocol, {
  title: string
  alertMessage: string
  defaultConditionType: ConditionType
  conditionTypes: any[]
}> = {
  http: {
    title: 'HTTP Rule Builder',
    alertMessage: 'Build complex HTTP routing rules using visual conditions. Rules can match on hostnames, paths, headers, query parameters, methods, or client IPs.',
    defaultConditionType: 'Host' as ConditionType,
    conditionTypes: HTTP_CONDITION_TYPES
  },
  tcp: {
    title: 'TCP Rule Builder',
    alertMessage: 'Build complex TCP routing rules using visual conditions. Rules can match on Server Name Indication (SNI), client IP addresses, or ALPN protocols.',
    defaultConditionType: 'HostSNI' as ConditionType,
    conditionTypes: TCP_UDP_CONDITION_TYPES
  },
  udp: {
    title: 'UDP Rule Builder',
    alertMessage: 'Build complex UDP routing rules using visual conditions. Rules can match on Server Name Indication (SNI), client IP addresses, or ALPN protocols.',
    defaultConditionType: 'HostSNI' as ConditionType,
    conditionTypes: TCP_UDP_CONDITION_TYPES
  }
}

interface RuleCondition {
  id: string
  type: ConditionType
  value: string
  value2?: string // For Header and Query matchers that need key-value pairs
  negate: boolean
}

interface RuleGroup {
  id: string
  operator: 'AND' | 'OR'
  conditions: RuleCondition[]
}

interface RuleBuilderProps {
  opened: boolean
  onClose: () => void
  initialRule?: string
  onSave: (rule: string) => void
  protocol: Protocol
}

export function RuleBuilder({ opened, onClose, initialRule, onSave, protocol }: RuleBuilderProps) {
  const [groups, setGroups] = useState<RuleGroup[]>([
    { id: '1', operator: 'OR', conditions: [] }
  ])
  const [groupOperator, setGroupOperator] = useState<'AND' | 'OR'>('AND')

  // Parse initialRule and populate the form when modal opens
  useEffect(() => {
    if (opened && initialRule) {
      const parsed = parseTraefikRule(initialRule, protocol as 'http' | 'tcp' | 'udp')
      if (parsed) {
        setGroups(parsed.groups as RuleGroup[])
        setGroupOperator(parsed.groupOperator)
      }
    } else if (opened && !initialRule) {
      // Reset to default state when no initial rule
      setGroups([{ id: '1', operator: 'OR', conditions: [] }])
      setGroupOperator('AND')
    }
  }, [opened, initialRule, protocol])

  const protocolConfig = PROTOCOL_CONFIG[protocol as keyof typeof PROTOCOL_CONFIG]

  const addCondition = (groupId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [
            ...group.conditions,
            {
              id: Date.now().toString(),
              type: protocolConfig.defaultConditionType,
              value: '',
              negate: false
            }
          ]
        }
      }
      return group
    }))
  }

  const updateCondition = (groupId: string, conditionId: string, field: keyof RuleCondition, value: any) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map(cond => {
            if (cond.id === conditionId) {
              return { ...cond, [field]: value }
            }
            return cond
          })
        }
      }
      return group
    }))
  }

  const removeCondition = (groupId: string, conditionId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.filter(cond => cond.id !== conditionId)
        }
      }
      return group
    }))
  }

  const addGroup = () => {
    setGroups([
      ...groups,
      {
        id: Date.now().toString(),
        operator: 'OR',
        conditions: []
      }
    ])
  }

  const removeGroup = (groupId: string) => {
    if (groups.length > 1) {
      setGroups(groups.filter(g => g.id !== groupId))
    }
  }

  const updateGroupOperator = (groupId: string, operator: 'AND' | 'OR') => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return { ...group, operator }
      }
      return group
    }))
  }

  const buildRule = (): string => {
    const groupRules = groups
      .filter(group => group.conditions.length > 0)
      .map(group => {
        const conditions = group.conditions
          .filter(cond => cond.value || (cond.type === 'Method' && cond.value))
          .map(cond => {
            let rule = ''

            // Add negation if needed
            if (cond.negate) {
              rule += '!'
            }

            // Build the function call based on type
            switch (cond.type) {
              case 'Host':
                rule += `Host(\`${cond.value}\`)`
                break
              case 'HostRegexp':
                rule += `HostRegexp(\`${cond.value}\`)`
                break
              case 'Path':
                rule += `Path(\`${cond.value}\`)`
                break
              case 'PathPrefix':
                rule += `PathPrefix(\`${cond.value}\`)`
                break
              case 'PathRegexp':
                rule += `PathRegexp(\`${cond.value}\`)`
                break
              case 'Header':
                rule += `Header(\`${cond.value2}\`, \`${cond.value}\`)`
                break
              case 'HeaderRegexp':
                rule += `HeaderRegexp(\`${cond.value2}\`, \`${cond.value}\`)`
                break
              case 'Query':
                rule += `Query(\`${cond.value2}\`, \`${cond.value}\`)`
                break
              case 'QueryRegexp':
                rule += `QueryRegexp(\`${cond.value2}\`, \`${cond.value}\`)`
                break
              case 'Method':
                // Method can accept multiple values
                const methods = cond.value.split(',').map(m => m.trim()).filter(m => m)
                if (methods.length > 0) {
                  rule += `Method(${methods.map(m => `\`${m}\``).join(', ')})`
                }
                break
              case 'ClientIP':
                rule += `ClientIP(\`${cond.value}\`)`
                break
              case 'HostSNI':
                rule += `HostSNI(\`${cond.value}\`)`
                break
              case 'HostSNIRegexp':
                rule += `HostSNIRegexp(\`${cond.value}\`)`
                break
              case 'ALPN':
                rule += `ALPN(\`${cond.value}\`)`
                break
            }

            return rule
          })

        if (conditions.length === 0) return ''
        if (conditions.length === 1) return conditions[0]

        // Join conditions within group with the group's operator
        return `(${conditions.join(` ${group.operator === 'AND' ? '&&' : '||'} `)})`
      })
      .filter(rule => rule)

    if (groupRules.length === 0) return ''
    if (groupRules.length === 1) return groupRules[0]

    // Join groups with the main operator
    return groupRules.join(` ${groupOperator === 'AND' ? '&&' : '||'} `)
  }

  const handleSave = () => {
    const rule = buildRule()
    if (rule) {
      onSave(rule)
      onClose()
    }
  }

  const currentRule = buildRule()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconCode size={20} />
          <Text fw={500}>{protocolConfig.title}</Text>
        </Group>
      }
      size="xl"
    >
      <Stack>
        <Alert icon={<IconAlertCircle size={16} />} color="blue">
          {protocolConfig.alertMessage}
        </Alert>

        {groups.length > 1 && (
          <Group>
            <Text size="sm" fw={500}>Join groups with:</Text>
            <SegmentedControl
              value={groupOperator}
              onChange={(value) => setGroupOperator(value as 'AND' | 'OR')}
              data={[
                { label: 'AND (&&)', value: 'AND' },
                { label: 'OR (||)', value: 'OR' }
              ]}
              size="xs"
            />
          </Group>
        )}

        {groups.map((group, groupIndex) => (
          <Card key={group.id} shadow="xs" p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Group>
                  <Text size="sm" fw={500}>Group {groupIndex + 1}</Text>
                  {group.conditions.length > 1 && (
                    <>
                      <Text size="xs" c="dimmed">Join with:</Text>
                      <SegmentedControl
                        value={group.operator}
                        onChange={(value) => updateGroupOperator(group.id, value as 'AND' | 'OR')}
                        data={[
                          { label: 'AND', value: 'AND' },
                          { label: 'OR', value: 'OR' }
                        ]}
                        size="xs"
                      />
                    </>
                  )}
                </Group>
                {groups.length > 1 && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeGroup(group.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                )}
              </Group>

              {group.conditions.map((condition) => (
                <Card key={condition.id} shadow="xs" p="xs" withBorder>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <Checkbox
                        label="NOT (!)"
                        checked={condition.negate}
                        onChange={(e) => updateCondition(group.id, condition.id, 'negate', e.currentTarget.checked)}
                        size="xs"
                      />
                      <Select
                        value={condition.type}
                        onChange={(value) => updateCondition(group.id, condition.id, 'type', value)}
                        data={protocolConfig.conditionTypes}
                        style={{ width: 150 }}
                      />
                      {CONDITION_METADATA[condition.type as ConditionType]?.needsKeyValue && (
                        <TextInput
                          value={condition.value2 || ''}
                          onChange={(e) => updateCondition(group.id, condition.id, 'value2', e.target.value)}
                          placeholder={CONDITION_METADATA[condition.type as ConditionType]?.keyPlaceholder}
                          style={{ width: 150 }}
                        />
                      )}
                      <TextInput
                        value={condition.value}
                        onChange={(e) => updateCondition(group.id, condition.id, 'value', e.target.value)}
                        placeholder={CONDITION_METADATA[condition.type as ConditionType]?.placeholder}
                        style={{ flex: 1 }}
                      />
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeCondition(group.id, condition.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                    <Text size="xs" c="dimmed">{CONDITION_METADATA[condition.type as ConditionType]?.description}</Text>
                  </Stack>
                </Card>
              ))}

              <Button
                variant="light"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => addCondition(group.id)}
              >
                Add Condition
              </Button>
            </Stack>
          </Card>
        ))}

        <Button
          variant="outline"
          size="sm"
          leftSection={<IconPlus size={16} />}
          onClick={addGroup}
        >
          Add Group
        </Button>

        <Divider />

        <Stack gap="xs">
          <Text size="sm" fw={500}>Generated Rule:</Text>
          <Code block>
            {currentRule || 'No conditions defined yet'}
          </Code>
        </Stack>

        <Group justify="space-between">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            disabled={!currentRule}
          >
            Apply Rule
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}