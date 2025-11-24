import {Alert, Badge, Card, Container, Group, Loader, Stack, Text} from '@mantine/core'
import {IconDoorEnter, IconInfoCircle, IconMenu3, IconTransferVertical, IconWorldWww} from '@tabler/icons-react'
import StatisticsCards from "@/components/StatisticsCards.tsx";
import {DataTable} from "@/components/DataTable.tsx";
import {useFetchResourcesQuery} from "@/hooks/useFetchResourcesQuery.tsx";
import ResourceActionIconGroup from "@/components/ResourceActionIconGroup.tsx";
import PageHeader from "@/components/PageHeader.tsx";

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
                <PageHeader
                    title={'Entrypoints'}
                    subTitle={
                        'Define the network addresses and protocols that Traefik will listen on.'
                    }
                    icon={IconDoorEnter}
                    iconColor={"#00aec1"}
                />

                <StatisticsCards statistics={[
                    {
                        key: "total",
                        icon: IconDoorEnter,
                        iconColor: "blue",
                        label: "Total Entrypoints"
                    }, {
                        key: "httpEnabled",
                        icon: IconWorldWww,
                        iconColor: "green",
                        predicate: (i) => i.config?.http && true || false,
                        aggregator: undefined,
                        label: "HTTP Enabled"
                    }, {
                        key: "tcpEnabled",
                        icon: IconTransferVertical,
                        iconColor: "violet",
                        predicate: (i) => !i.config?.address?.toLowerCase().endsWith('/udp') && true || false,
                        aggregator: undefined,
                        label: "TCP Enabled"
                    }, {
                        key: "udpEnabled",
                        icon: IconMenu3,
                        iconColor: "brown",
                        predicate: (i) => i.config?.address?.toLowerCase().endsWith('/udp') || false,
                        aggregator: undefined,
                        label: "UDP Enabled"
                    }
                ]} items={entrypoints || []} cols={{base: 1, sm: 2, lg: 4}} spacing="lg"/>

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
                                    label: "Protocol",
                                    render: (_, row) => (<Badge variant="light">{ row?.config?.address?.endsWith('/udp') && 'UDP' || 'TCP'}</Badge>)
                                },
                                {
                                    key: "config.protocols",
                                    sortable: true,
                                    label: "Protocols",
                                    render: (_, row) => (
                                        <>
                                            {row.config?.http && <Badge variant="dot" color={"green"}>HTTP/1.1</Badge>}
                                            {row.config?.http2 && <Badge variant="dot" color={"green"}>HTTP/2</Badge>}
                                            {row.config?.http3 && <Badge variant="dot" color={"green"}>HTTP/3</Badge>}
                                            {row.config?.address?.endsWith('/udp') && <Text>'-'</Text>}
                                        </>
                                    )
                                },
                                {
                                    key: "config.transport.respondingTimeouts.readTimeout",
                                    sortable: true,
                                    label: "Read Timeout",
                                    render: (value, row) => (<Text size="sm">{(!row.config?.address?.endsWith('/udp') && value) && value || '-'}</Text>),
                                },
                                {
                                    key: "config.transport.respondingTimeouts.idleTimeout",
                                    sortable: true,
                                    label: "Idle Timeout",
                                    render: (value, row) => (<Text size="sm">{(!row.config?.address?.endsWith('/udp') && value) && value || '-'}</Text>),
                                },
                                {
                                    key: "config.udp.timeout",
                                    sortable: true,
                                    label: "UDP Timeout",
                                    render: (value, row) => (<Text size="sm">{(row.config?.address?.endsWith('/udp') && value) && value || '-'}</Text>),
                                },
                                {
                                    key: "actions",
                                    sortable: false,
                                    label: "Actions",
                                    render: (_, row) => (<ResourceActionIconGroup resource={row}/>),
                                }
                            ]}
                            data={entrypoints || []}
                            isLoading={isLoading}
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