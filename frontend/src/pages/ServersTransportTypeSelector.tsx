import { useState } from 'react'
import {
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  SegmentedControl,
  Button,
  Badge,
  Box
} from '@mantine/core'
import { IconPlugConnected, IconNetwork, IconArrowRight } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type TransportType = 'http' | 'tcp'

export default function ServersTransportTypeSelector() {
  const navigate = useNavigate()
  const [transportType, setTransportType] = useState<TransportType>('http')

  const transportInfo = {
    http: {
      icon: <IconPlugConnected size={20} />,
      title: 'HTTP ServersTransport',
      description: 'Configure HTTP connection settings for backend servers',
      color: 'blue',
      features: ['TLS configuration', 'Server name', 'Root CAs', 'Client certificates', 'Response headers', 'Timeouts']
    },
    tcp: {
      icon: <IconNetwork size={20} />,
      title: 'TCP ServersTransport',
      description: 'Configure TCP connection settings for backend servers',
      color: 'green',
      features: ['Dial timeout', 'Keep-alive settings', 'TLS configuration', 'Proxy protocol', 'SPIFFE support']
    }
  }

  const info = transportInfo[transportType]

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Create New Transport</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Choose the type of server transport you want to create
            </Text>
          </div>
          <Button variant="subtle" onClick={() => navigate('/serversTransports')}>
            Back to Transports
          </Button>
        </Group>

        <Card shadow="sm" radius="md" withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Group justify="space-between">
              <Text fw={500}>Transport Type</Text>
              <SegmentedControl
                value={transportType}
                onChange={(value) => setTransportType(value as TransportType)}
                data={[
                  { label: 'HTTP', value: 'http' },
                  { label: 'TCP', value: 'tcp' }
                ]}
              />
            </Group>
          </Card.Section>

          <Card.Section inheritPadding py="md">
            <Group mb="md">
              <Box c={info.color}>{info.icon}</Box>
              <div>
                <Text fw={600}>{info.title}</Text>
                <Text size="sm" c="dimmed">{info.description}</Text>
              </div>
            </Group>

            <Group gap="xs">
              {info.features.map((feature, idx) => (
                <Badge key={idx} variant="light" color={info.color} size="sm">
                  {feature}
                </Badge>
              ))}
            </Group>
          </Card.Section>
        </Card>

        <Group justify="flex-end">
          <Button
            size="md"
            rightSection={<IconArrowRight size={16} />}
            onClick={() => navigate(`/serversTransports/new/${transportType}`)}
          >
            Continue
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
