import {Container, Title, Table, Badge, Group, Text, Loader, Alert, Card, Stack, TextInput} from '@mantine/core'
import {IconInfoCircle, IconSearch, IconDoorEnter, IconShield, IconPlugConnected, IconRocket} from '@tabler/icons-react'
import {useState} from 'react'
import StatisticsCards from "@/components/StatisticsCards.tsx";
import {DataTable} from "@/components/DataTable.tsx";
import {useFetchResourcesQuery} from "@/hooks/useFetchResourcesQuery.tsx";
import ResourceActionIconGroup from "@/components/ResourceActionIconGroup.tsx";

export default function Entrypoints() {

    const {data: entrypoints, isLoading, error} = useFetchResourcesQuery("any", "entrypoints", true);


    if (isLoading) {
        return (
            <Container>
                <Group justify="center" mt="xl">
                    <Loader/>
                </Group>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <Alert icon={<IconInfoCircle size={16}/>} color="red" mt="xl">
                    Failed to load entrypoints. Please make sure Traefik is running and accessible.
                </Alert>
            </Container>
        )
    }

    return (
        <Container size="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Group>
                        <IconDoorEnter size={32} stroke={1.5} color="#00aec1"/>
                        <div>
                            <Title order={2}>Entrypoints</Title>
                            <Text size="sm" c="dimmed">
                                Entrypoints are configured in Traefik's static configuration
                            </Text>
                        </div>
                    </Group>
                </Group>

                <StatisticsCards statistics={[
                    {
                        key: "total",
                        icon: IconDoorEnter,
                        iconColor: "blue",
                        label: "Total Entrypoints"
                    }, {
                        key: "httpEnabled",
                        icon: IconRocket,
                        iconColor: "green",
                        predicate: (i) => i.config?.http && true || false,
                        aggregator: undefined,
                        label: "HTTP Enabled"
                    }, {
                        key: "http2Enabled",
                        icon: IconRocket,
                        iconColor: "green",
                        predicate: (i) => i.config?.http2 && true || false,
                        aggregator: undefined,
                        label: "HTTP/2 Enabled"
                    }, {
                        key: "http3Enabled",
                        icon: IconPlugConnected,
                        iconColor: "violet",
                        predicate: (i) => i.config?.http3 && true || false,
                        aggregator: undefined,
                        label: "HTTP/3 Enabled"
                    }, {
                        key: "udpEnabled",
                        icon: IconShield,
                        iconColor: "orange",
                        predicate: (i) => i.config?.udp && true || false,
                        aggregator: undefined,
                        label: "UDP Enabled"
                    }
                ]} items={entrypoints || []} cols={{base: 1, sm: 2, lg: 5}} spacing="lg"/>

                <Card shadow="sm" radius="md" withBorder>
                    <Stack>
                        <DataTable
                            columns={[
                                {
                                    key: "name",
                                    sortable: true,
                                    label: "Name",
                                    render: (value) => <Text fw={600}>{value}</Text>
                                },
                                {
                                    key: "config.address",
                                    sortable: true,
                                    label: "Address",
                                    render: (value, _) => (<Badge variant="light">{value || '-'}</Badge>)
                                },
                                {
                                    key: "config.protocol",
                                    sortable: true,
                                    label: "Protocols",
                                    render: (_, row) => (
                                        <>
                                            {row.config?.http && <Badge variant="dot" color={"green"}>HTTP/1.1</Badge>}
                                            {row.config?.http2 && <Badge variant="dot" color={"green"}>HTTP/2</Badge>}
                                            {row.config?.http3 && <Badge variant="dot" color={"green"}>HTTP/3</Badge>}
                                            {row.config?.udp && <Badge variant="dot" color={"green"}>UDP</Badge>}
                                        </>
                                    )
                                },
                                {
                                    key: "config.transport.respondingTimeouts.readTimeout",
                                    sortable: true,
                                    label: "Read Timeout",
                                    render: (value) => (<Text size="sm">{value || '-'}</Text>),
                                },
                                {
                                    key: "config.transport.respondingTimeouts.idleTimeout",
                                    sortable: true,
                                    label: "Idle Timeout",
                                    render: (value) => (<Text size="sm">{value || '-'}</Text>),
                                },
                                {
                                    key: "config.udp.timeout",
                                    sortable: true,
                                    label: "UDP Timeout",
                                    render: (value) => (<Text size="sm">{value || '-'}</Text>),
                                },
                                {
                                    key: "config.udp.timeout",
                                    sortable: true,
                                    label: "Actions",
                                    render: (_, row) => (<ResourceActionIconGroup resource={row}/>),
                                }
                            ]}
                            data={entrypoints || []}
                            isLoading={isLoading}
                            getRowKey={(row) => `${row.protocol}.${row.name}@${row.provider}`}
                            searchPlaceholder="Search HTTP routers..."
                            emptyMessage="No entrypoints found"
                            defaultSort={{key: 'name', direction: 'asc'}}
                        />
                    </Stack>
                </Card>
            </Stack>
        </Container>
    )
}