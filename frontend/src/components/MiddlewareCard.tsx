import {Badge, Card, CardProps, Code, Group, Paper, Stack, Text, ThemeIcon, Tooltip} from "@mantine/core";
import {
    IconChevronRightPipe,
    IconCloud,
    IconForms,
    IconKey,
    IconLock, IconLogicBuffer,
    IconPassword, IconPencilOff,
    IconShield
} from "@tabler/icons-react";
import {ProviderIcon} from "@/components/ProviderIcon.tsx";
import {StatusIcon} from "@/components/StatusIcon.tsx";
import ResourceActionIconGroup from "@/components/ResourceActionIconGroup.tsx";
import {Resource} from "@/lib/api.ts";
import _ from "lodash";
import iget from "@/lib/iget.ts";


interface MiddlewareCardProps {
    resource: Resource
}

interface MiddlewareIconProps {
    type: string
}

const MiddlewareIcon = ({type = 'unknown'}: MiddlewareIconProps) => {
    let Icon = IconShield;
    let color = 'cyan';

    switch (type.toLowerCase()) {
        case 'addprefix':
            Icon = IconForms;
            // color = 'cyan';
            break;
        case 'basicauth':
            Icon = IconKey;
            // color = 'black';
            break;
        case 'buffering':
            Icon = IconLogicBuffer;
            break;
    }

    return (
        <ThemeIcon color={color} variant="light">
            <Icon size={20}  />
        </ThemeIcon>
    )
}

export default function MiddlewareCard({resource: middleware, ...props}: MiddlewareCardProps & CardProps) {
    const isInternal = middleware.provider === 'internal'
    const isExternal = middleware.source !== 'database' && !isInternal
    const middlewareType = middleware.config?.type
    const middlewareConfig = iget(middleware.config, middlewareType, {})

    return (
        <Card key={middleware.name} {...props}>
            {/* Header */}
            <Card.Section withBorder inheritPadding py="md">
                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <MiddlewareIcon type={middlewareType}/>
                        <Text fw={600}>{middleware.name.split('@')[0]}</Text>
                        {/* Provider type indicators */}
                        {isInternal && (
                            <Tooltip label="Internal resource managed automatically by Traefik. Cannot be modified or deleted." multiline w={250}>
                                <IconLock size={16} color="var(--mantine-color-blue-6)" style={{ cursor: 'help' }} />
                            </Tooltip>
                        )}
                        {isExternal && (
                            <Tooltip label={`This resource is managed by ${middleware.provider}. Modifications must be made through the provider's configuration.`} multiline w={250}>
                                <IconPencilOff size={16} color="var(--mantine-color-gray-6)" style={{ cursor: 'help' }} />
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