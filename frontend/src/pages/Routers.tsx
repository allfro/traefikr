import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {Container, Title, Button, Group, Text, Badge, Tabs, Card, Stack} from '@mantine/core'
import {IconPlus, IconRouter, IconNetwork, IconWifi,} from '@tabler/icons-react'
import { Resource } from '@/lib/api'
import { DataTable, Column } from '@/components/DataTable'
import { ProviderIcon } from '@/components/ProviderIcon'
import { StatusIcon } from '@/components/StatusIcon'
import ResourceActionIconGroup from "@/components/ResourceActionIconGroup.tsx";
import {useFetchResourcesQuery} from "@/hooks/useFetchResourcesQuery.tsx";

export default function Routers() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('http')

  // Fetch HTTP routers
  const { data: httpRouters = [], isLoading: httpLoading } = useFetchResourcesQuery('http', 'routers', true)

  // Fetch TCP routers
  const { data: tcpRouters = [], isLoading: tcpLoading } = useFetchResourcesQuery('tcp', 'routers', true)

  // Fetch UDP routers
  const { data: udpRouters = [], isLoading: udpLoading } = useFetchResourcesQuery('udp', 'routers', true)

  // HTTP Router columns
  const httpColumns: Column<Resource>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <Text fw={600}>{value}</Text>,
    },
    {
      key: 'config.rule',
      label: 'Rule',
      sortable: true,
      render: (_, row) => (
        <Text size="sm" style={{ fontFamily: 'monospace' }}>
          {row.config?.rule || '-'}
        </Text>
      ),
    },
    {
      key: 'config.service',
      label: 'Service',
      sortable: true,
      render: (_, row) => row.config?.service || '-',
    },
    {
      key: 'config.entryPoints',
      label: 'Entry Points',
      render: (_, row) => (
        <Group gap={4}>
          {row.config?.entryPoints?.map((ep: string) => (
            <Badge key={ep} size="sm" variant="light">
              {ep}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      key: 'config.middlewares',
      label: 'Middlewares',
      render: (_, row) =>
        row.config?.middlewares?.length > 0 ? (
          <Badge size="sm">{row.config.middlewares.length}</Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'config.tls',
      label: 'TLS',
      render: (_, row) => (
        <StatusIcon enabled={!!row.config?.tls} enabledLabel="Enabled" disabledLabel="Disabled" />
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
      render: (value) => <ProviderIcon provider={value} />,
    },
    {
      key: 'enabled',
      label: 'Status',
      sortable: true,
      render: (value, _) => (
        <StatusIcon enabled={value} enabledLabel="Enabled" disabledLabel="Disabled" />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, resource) => (<ResourceActionIconGroup resource={resource}/>)
    }
  ]

  // TCP Router columns
  const tcpColumns: Column<Resource>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <Text fw={600}>{value}</Text>,
    },
    {
      key: 'config.rule',
      label: 'Rule',
      sortable: true,
      render: (_, row) => (
        <Text size="sm" style={{ fontFamily: 'monospace' }}>
          {row.config?.rule || '-'}
        </Text>
      ),
    },
    {
      key: 'config.service',
      label: 'Service',
      sortable: true,
      render: (_, row) => row.config?.service || '-',
    },
    {
      key: 'config.entryPoints',
      label: 'Entry Points',
      render: (_, row) => (
        <Group gap={4}>
          {row.config?.entryPoints?.map((ep: string) => (
            <Badge key={ep} size="sm" variant="light">
              {ep}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      key: 'config.middlewares',
      label: 'Middlewares',
      render: (_, row) =>
        row.config?.middlewares?.length > 0 ? (
          <Badge size="sm">{row.config.middlewares.length}</Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'config.tls',
      label: 'TLS',
      render: (_, row) => {
        if (row.config?.tls) {
          return (
            <Group gap="xs">
              <StatusIcon enabled={true} enabledLabel={row.config.tls.passthrough ? 'Passthrough' : 'Termination'} />
              <Text size="xs" c="dimmed">
                {row.config.tls.passthrough ? 'Passthrough' : 'Termination'}
              </Text>
            </Group>
          )
        }
        return <StatusIcon enabled={false} disabledLabel="No TLS" />
      },
    },
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
      render: (value) => <ProviderIcon provider={value} />,
    },
    {
      key: 'enabled',
      label: 'Status',
      sortable: true,
      render: (value, _) => (
        <StatusIcon enabled={value} enabledLabel="Enabled" disabledLabel="Disabled" />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, resource) => (<ResourceActionIconGroup resource={resource}/>)
    }
  ]

  // UDP Router columns
  const udpColumns: Column<Resource>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <Text fw={600}>{value}</Text>,
    },
    {
      key: 'config.service',
      label: 'Service',
      sortable: true,
      render: (_, row) => row.config?.service || '-',
    },
    {
      key: 'config.entryPoints',
      label: 'Entry Points',
      render: (_, row) => (
        <Group gap={4}>
          {row.config?.entryPoints?.map((ep: string) => (
            <Badge key={ep} size="sm" variant="light">
              {ep}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
      render: (value) => <ProviderIcon provider={value} />,
    },
    {
      key: 'enabled',
      label: 'Status',
      sortable: true,
      render: (value, _) => (
        <StatusIcon enabled={value} enabledLabel="Enabled" disabledLabel="Disabled" />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, resource) => (<ResourceActionIconGroup resource={resource}/>)
    }
  ]

  const totalRouters = httpRouters.length + tcpRouters.length + udpRouters.length

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group>
            <IconRouter size={32} stroke={1.5} color="#00aec1" />
            <div>
              <Title order={2}>Routers</Title>
              <Text c="dimmed" size="sm">
                Total: {totalRouters} routers ({httpRouters.length} HTTP, {tcpRouters.length} TCP,{' '}
                {udpRouters.length} UDP)
              </Text>
            </div>
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/routers/new')}>
            Add Router
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'http')}>
            <Tabs.List>
              <Tabs.Tab value="http" leftSection={<IconRouter size={16} />}>
                HTTP ({httpRouters.length})
              </Tabs.Tab>
              <Tabs.Tab value="tcp" leftSection={<IconNetwork size={16} />}>
                TCP ({tcpRouters.length})
              </Tabs.Tab>
              <Tabs.Tab value="udp" leftSection={<IconWifi size={16} />}>
                UDP ({udpRouters.length})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="http" pt="md">
              <DataTable
                columns={httpColumns}
                data={httpRouters}
                isLoading={httpLoading}
                getRowKey={(router) => `${router.protocol}.${router.name}@${router.provider}`}
                searchPlaceholder="Search HTTP routers..."
                emptyMessage="No HTTP routers found"
                defaultSort={{ key: 'name', direction: 'asc' }}
              />
            </Tabs.Panel>

            <Tabs.Panel value="tcp" pt="md">
              <DataTable
                columns={tcpColumns}
                data={tcpRouters}
                isLoading={tcpLoading}
                getRowKey={(router) => router.name}
                searchPlaceholder="Search TCP routers..."
                emptyMessage="No TCP routers found"
                defaultSort={{ key: 'name', direction: 'asc' }}
              />
            </Tabs.Panel>

            <Tabs.Panel value="udp" pt="md">
              <DataTable
                columns={udpColumns}
                data={udpRouters}
                isLoading={udpLoading}
                getRowKey={(router) => router.name}
                searchPlaceholder="Search UDP routers..."
                emptyMessage="No UDP routers found"
                defaultSort={{ key: 'name', direction: 'asc' }}
              />
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </Container>
  )
}
