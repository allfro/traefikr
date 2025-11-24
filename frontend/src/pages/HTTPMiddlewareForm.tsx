import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Badge, Button, Card, Code, Container, Group, Loader, Stack, Text, TextInput, Title,} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import {IconArrowLeft, IconDeviceFloppy, IconGitBranch} from '@tabler/icons-react'
import {Resource} from '@/lib/api'
import {MiddlewareSchemaForm} from '@/components/MiddlewareSchemaForm'
import {useFetchResourceQuery} from "@/hooks/useFetchResourcesQuery.tsx";
import useResourceParams from "@/hooks/useResourceParams.tsx";
import _ from "lodash";
import useCreateResourceMutation from "@/hooks/useCreateResourceMutation.tsx";
import useUpdateResourceMutation from "@/hooks/useUpdateResourceMutation.tsx";


export default function HTTPMiddlewareForm() {
    const navigate = useNavigate()
    const type = 'middlewares';
    const {name, subType = 'unknown', protocol, provider} = useResourceParams();
    const {
        data: existingMiddleware,
        isLoading: isLoadingMiddleware
    } = useFetchResourceQuery(protocol, 'middlewares', name, provider ?? 'http', !!name);
    const isEditMode = !!name

    const [formData, setFormData] = useState({
        name,
        provider,
        protocol,
        type,
        subType,
        config: {},
    });

    // Populate form when editing
    useEffect(() => {
        if (existingMiddleware) {
            setFormData({
                ...formData,
                subType: existingMiddleware.config?.type,
                name: existingMiddleware.name, // Remove @provider suffix
                provider: existingMiddleware.provider,
                config: existingMiddleware.config,
            })
        } else if (subType !== 'unknown') {
            setFormData({
                ...formData,
                config: {
                    type: subType,
                    [subType]: {}
                }
            })
        }
    }, [existingMiddleware, type])

    // Create mutation
    const createMutation = useCreateResourceMutation(() => navigate('/middlewares'));

    // Update mutation
    const updateMutation = useUpdateResourceMutation(() => navigate('/middlewares'));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.name.trim()) {
            notifications.show({
                title: 'Validation Error',
                message: 'Middleware name is required',
                color: 'red',
            })
            return
        }

        const resource = _.omit(formData, ['subType', 'config.type']) as Resource;

        if (isEditMode) {
            updateMutation.mutate(resource)
        } else {
            createMutation.mutate(resource)
        }
    }

    if (isEditMode && isLoadingMiddleware || formData.subType === 'unknown') {
        return (
            <Container size="md">
                <Stack align="center" justify="center" style={{minHeight: '400px'}}>
                    <Loader size="lg"/>
                    <Text>Loading middleware...</Text>
                </Stack>
            </Container>
        )
    }

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    // Format type label
    const typeLabel = formData.subType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()

    return (
        <Container size="md">
            <Stack gap="lg">
                {/* Header */}
                <Group justify="space-between">
                    <Group>
                        <IconGitBranch size={32} stroke={1.5} color="#00aec1"/>
                        <div>
                            <Title order={2}>{isEditMode ? 'Edit' : 'Create'} Middleware</Title>
                            <Group gap="xs">
                                {isEditMode &&
                                    <>
                                    <Text c="dimmed" size="sm">
                                        Update {formData.protocol} middleware:
                                    </Text>
                                    <Badge size={'xs'}>{formData.name}@{formData.provider}</Badge>
                                    </>
                                    ||
                                    <Text c="dimmed" size="sm">
                                        Create a new {typeLabel.toLowerCase()} middleware
                                    </Text>
                                }
                                <Badge color="cyan" variant="light" size="xs">
                                    {typeLabel}
                                </Badge>
                            </Group>
                        </div>
                    </Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16}/>}
                        onClick={() => navigate('/middlewares')}
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
                                    label="Middleware Name"
                                    placeholder="my-middleware"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.currentTarget.value})}
                                    disabled={isEditMode} // Can't change name in edit mode
                                    description={isEditMode ? 'Middleware name cannot be changed' : 'Unique identifier for this middleware'}
                                />

                                <TextInput
                                    label="Provider"
                                    value={formData.provider}
                                    disabled
                                    description="HTTP provider (managed by database)"
                                />
                            </Stack>
                        </Card>

                        {/* Configuration Card */}
                        <Card shadow="sm" radius="md" withBorder>
                            <MiddlewareSchemaForm
                                protocol={protocol}
                                middlewareType={formData.subType}
                                value={formData.config}
                                onChange={(newConfig) => setFormData({
                                    ...formData,
                                    config: {...formData.config, [formData.subType]: newConfig}
                                })}
                                disabled={isSubmitting}
                            />
                        </Card>

                        {/* Actions */}
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => navigate('/middlewares')} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                leftSection={<IconDeviceFloppy size={16}/>}
                                loading={isSubmitting}
                            >
                                {isEditMode ? 'Update Middleware' : 'Create Middleware'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </Container>
    )
}
