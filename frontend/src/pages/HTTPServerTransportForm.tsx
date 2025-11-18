import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  TextInput,
  Switch,
  Card,
  Text,
  Loader,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconPlugConnected, IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react'
import { resourcesApi } from '@/lib/api'
import { SchemaForm } from '@/components/SchemaForm'

export default function HTTPServerTransportForm() {
  const navigate = useNavigate()
  const { name } = useParams<{ name: string }>()
  const queryClient = useQueryClient()
  const isEditMode = !!name

  const [formData, setFormData] = useState({
    name: '',
    provider: 'http',
    enabled: true,
    config: {},
  })

  // Fetch existing transport in edit mode
  const { data: existingTransport, isLoading: isLoadingTransport } = useQuery({
    queryKey: ['resources', 'http', 'serversTransports', name],
    queryFn: async () => {
      if (!name) return null
      const response = await resourcesApi.get('http', 'serversTransports', name)
      return response.data
    },
    enabled: isEditMode,
  })

  // Populate form when editing
  useEffect(() => {
    if (existingTransport) {
      setFormData({
        name: existingTransport.name.split('@')[0], // Remove @provider suffix
        provider: existingTransport.provider,
        enabled: existingTransport.enabled,
        config: existingTransport.config || {},
      })
    }
  }, [existingTransport])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await resourcesApi.create('http', 'serversTransports', formData)
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'HTTP server transport created successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['tcp-server-transports'] })
      navigate('/serversTransports')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create transport',
        color: 'red',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error('No transport name provided')
      const response = await resourcesApi.update('http', 'serversTransports', `${name}`, {
        enabled: formData.enabled,
        config: formData.config,
      })
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'HTTP server transport updated successfully',
        color: 'green',
      })
      queryClient.invalidateQueries({ queryKey: ['tcp-server-transports'] })
      navigate('/serversTransports')
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update transport',
        color: 'red',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Transport name is required',
        color: 'red',
      })
      return
    }

    if (isEditMode) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  if (isEditMode && isLoadingTransport) {
    return (
      <Container size="md">
        <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
          <Loader size="lg" />
          <Text>Loading transport...</Text>
        </Stack>
      </Container>
    )
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Container size="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconPlugConnected size={32} stroke={1.5} color="#00aec1" />
            <div>
              <Title order={2}>{isEditMode ? 'Edit' : 'Create'} HTTP ServersTransport</Title>
              <Text c="dimmed" size="sm">
                {isEditMode ? `Update transport: ${formData.name}` : 'Create a new HTTP server transport'}
              </Text>
            </div>
          </Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/serversTransports')}
          >
            Back
          </Button>
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            {/* Basic Info Card */}
            <Card shadow="sm" radius="md" withBorder>
              <Stack gap="md">
                <TextInput
                  label="Transport Name"
                  placeholder="my-http-transport"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                  disabled={isEditMode} // Can't change name in edit mode
                  description={isEditMode ? 'Transport name cannot be changed' : 'Unique identifier for this transport'}
                />

                <TextInput
                  label="Provider"
                  value={formData.provider}
                  disabled
                  description="HTTP provider (managed by database)"
                />

                <Switch
                  label="Enabled"
                  description="Enable or disable this transport"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.currentTarget.checked })}
                />
              </Stack>
            </Card>

            {/* Configuration Card */}
            <Card shadow="sm" radius="md" withBorder>
              <SchemaForm
                protocol="http"
                type="serversTransports"
                value={formData.config}
                onChange={(newConfig) => setFormData({ ...formData, config: newConfig })}
                disabled={isSubmitting}
              />
            </Card>

            {/* Actions */}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => navigate('/serversTransports')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSubmitting}
              >
                {isEditMode ? 'Update Transport' : 'Create Transport'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
