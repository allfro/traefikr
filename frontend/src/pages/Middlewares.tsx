import {useState} from 'react'
import {
  Badge,
  Button,
  Card,
  Code,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import {IconCloud, IconLock, IconNetwork, IconPlus, IconRouter, IconSearch, IconShield,} from '@tabler/icons-react'
import {Resource} from '@/lib/api'
import {ProviderIcon} from '@/components/ProviderIcon'
import {StatusIcon} from '@/components/StatusIcon'
import ResourceActionIconGroup from "@/components/ResourceActionIconGroup.tsx";
import {useFetchResourcesQuery} from "@/hooks/useFetchResourcesQuery.tsx";
import {useNavigate} from "react-router-dom";

// Get middleware type - either from 'type' field (Traefik) or detect from config keys (database)
function getMiddlewareType(middleware: Resource): string {
  // Database middlewares have type as key in config object
  if (middleware.config && Object.keys(middleware.config).length > 0) {
    const keys = Object.keys(middleware.config)
    return keys[0] || 'unknown'
  }

  // Traefik-sourced middlewares have a 'type' field (lowercase)
  // We need to find the actual property key that matches this type (case-insensitive)
  if ((middleware as any).type) {
    const typeValue = (middleware as any).type as string
    const middlewareObj = middleware as any

    // Find the property key that matches the type (case-insensitive)
    const matchingKey = Object.keys(middlewareObj).find(
      key => key.toLowerCase() === typeValue.toLowerCase() && key !== 'type'
    )

    return matchingKey || typeValue
  }

  return 'unknown'
}

// Get middleware config body
function getMiddlewareConfig(middleware: Resource): Record<string, any> {
  const middlewareType = getMiddlewareType(middleware)

  // For database middlewares, the config is nested under config property
  if (middleware.config && Object.keys(middleware.config).length > 0) {
    return middleware.config[middlewareType] || {}
  }

  // For Traefik-sourced middlewares, the config is directly on the resource
  return (middleware as any)[middlewareType] || {}
}

export default function Middlewares() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('http')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch HTTP middlewares
  const { data: httpMiddlewares = [], isLoading: httpLoading } = useFetchResourcesQuery('http', 'middlewares', true);

  // Fetch TCP middlewares
  const { data: tcpMiddlewares = [], isLoading: tcpLoading } = useFetchResourcesQuery('tcp', 'middlewares', true);

  const filterMiddlewares = (middlewares: Resource[]) => {
    let filtered = middlewares
    if (searchQuery) {
      filtered = filtered.filter((middleware) =>
        middleware.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    // Sort by name ascending
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }

  const handleCreate = () => {
    navigate('/middlewares/new')
  }

  const renderMiddlewareCard = (middleware: Resource) => {
    const isInternal = middleware.provider === 'internal'
    const isExternal = middleware.source !== 'database' && !isInternal
    const middlewareType = getMiddlewareType(middleware)
    const middlewareConfig = getMiddlewareConfig(middleware)

    return (
      <Card key={middleware.name} withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconShield size={20} color="gray" />
              <Text fw={600}>{middleware.name.split('@')[0]}</Text>
              {/* Provider type indicators */}
              {isInternal && (
                <Tooltip label="Internal resource managed automatically by Traefik. Cannot be modified or deleted." multiline w={250}>
                  <IconLock size={16} color="var(--mantine-color-blue-6)" style={{ cursor: 'help' }} />
                </Tooltip>
              )}
              {isExternal && (
                <Tooltip label={`Managed by the ${middleware.provider} provider. Modifications must be made through the provider's configuration.`} multiline w={250}>
                  <IconCloud size={16} color="var(--mantine-color-gray-6)" style={{ cursor: 'help' }} />
                </Tooltip>
              )}
            </Group>
            <ProviderIcon provider={middleware.provider} />
          </Group>
        </Card.Section>

        {/* Content - grows to fill space */}
        <Card.Section inheritPadding py="md" style={{ flex: 1 }}>
          <Stack gap="xs">
            {/* Type */}
            <Stack gap={4}>
              <Text size="xs" fw={500} c="dimmed">
                Type
              </Text>
              <Badge variant="light" size="sm" color="cyan">
                {middlewareType}
              </Badge>
            </Stack>

            {/* Configuration */}
            <Stack gap={4}>
              <Text size="xs" fw={500} c="dimmed">
                Configuration
              </Text>
              <Paper p="sm" radius="sm" bg="gray.0">
                <Code block style={{ maxHeight: '150px', overflow: 'auto' }}>
                  {JSON.stringify(middlewareConfig, null, 2)}
                </Code>
              </Paper>
            </Stack>
          </Stack>
        </Card.Section>

        {/* Actions - fixed at bottom */}
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between">
            <StatusIcon
              enabled={middleware.enabled}
              enabledLabel="Enabled"
              disabledLabel="Disabled"
            />
            <ResourceActionIconGroup resource={middleware}/>
          </Group>
        </Card.Section>
      </Card>
    )
  }

  const totalMiddlewares = httpMiddlewares.length + tcpMiddlewares.length

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Middlewares</Title>
            <Text c="dimmed" size="sm">
              Total: {totalMiddlewares} middlewares ({httpMiddlewares.length} HTTP, {tcpMiddlewares.length} TCP)
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            Add Middleware
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Stack gap="md">
            <TextInput
              placeholder="Search middlewares..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'http')}>
              <Tabs.List>
                <Tabs.Tab value="http" leftSection={<IconRouter size={16} />}>
                  HTTP ({httpMiddlewares.length})
                </Tabs.Tab>
                <Tabs.Tab value="tcp" leftSection={<IconNetwork size={16} />}>
                  TCP ({tcpMiddlewares.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="http" pt="md">
                {httpLoading ? (
                  <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
                    <Loader size="lg" />
                    <Text>Loading HTTP middlewares...</Text>
                  </Stack>
                ) : filterMiddlewares(httpMiddlewares).length > 0 ? (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filterMiddlewares(httpMiddlewares).map((middleware) =>
                      renderMiddlewareCard(middleware)
                    )}
                  </SimpleGrid>
                ) : (
                  <Stack align="center" py="xl">
                    <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                      <IconShield size={28} />
                    </ThemeIcon>
                    <Text c="dimmed" fw={500}>
                      No HTTP middlewares found
                    </Text>
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="tcp" pt="md">
                {tcpLoading ? (
                  <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
                    <Loader size="lg" />
                    <Text>Loading TCP middlewares...</Text>
                  </Stack>
                ) : filterMiddlewares(tcpMiddlewares).length > 0 ? (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filterMiddlewares(tcpMiddlewares).map((middleware) =>
                      renderMiddlewareCard(middleware)
                    )}
                  </SimpleGrid>
                ) : (
                  <Stack align="center" py="xl">
                    <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                      <IconShield size={28} />
                    </ThemeIcon>
                    <Text c="dimmed" fw={500}>
                      No TCP middlewares found
                    </Text>
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
