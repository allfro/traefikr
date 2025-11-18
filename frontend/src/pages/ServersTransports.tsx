import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {
    Container,
    Title,
    Button,
    Table,
    Group,
    Text,
    Badge,
    Card,
    Stack,
    TextInput,
    Loader,
    Alert,
    SimpleGrid,
    ThemeIcon,
    Tabs
} from '@mantine/core'
import {Resource} from '@/lib/api'
import {ProviderIcon} from '@/components/ProviderIcon'
import {
    IconPlus,
    IconSearch,
    IconPlugConnected,
    IconAlertCircle,
    IconShield,
    IconRouter,
    IconNetwork
} from '@tabler/icons-react'
import {useFetchResourcesQuery} from "@/hooks/useFetchResourcesQuery.tsx";
import ResourceActionIconGroup from "@/components/ResourceActionIconGroup.tsx";
import _ from "lodash";


export default function ServersTransports() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState<string>('http')

    // Fetch both HTTP and TCP transports
    const {
        data: httpTransports,
        isLoading: isLoadingHttp,
        error: errorHttp
    } = useFetchResourcesQuery('http', 'serversTransports', true)
    const {
        data: tcpTransports,
        isLoading: isLoadingTcp,
        error: errorTcp
    } = useFetchResourcesQuery('tcp', 'serversTransports', true)


    const hasTLS = (transport: any) => {
        return _.has(transport?.config, 'tls') || _.some(_.pick(transport?.config, ['serverName', 'insecureSkipVerify']))
    }

    const hasProxyProtocol = (transport: any) => {
        return _.has(transport?.config, 'proxyProtocol')
    }

    const hasSPIFFE = (transport: any) => {
        return _.has(transport?.config, 'spiffe')
    }

    const filterTransports = (transports: Resource[]) => {
        return _.filter(transports, t => JSON.stringify(t).toLowerCase().includes(searchTerm.toLowerCase()));
    }

    let [httpCount, tcpCount] = [_.size(httpTransports), _.size(tcpTransports)];
    let withTLS = _.sumBy(httpTransports, (transport: any) => hasTLS(transport) ? 1 : 0);
    withTLS += _.sumBy(tcpTransports, (transport: any) => hasTLS(transport) ? 1 : 0);

    // Calculate stats
    const stats = {
        total: httpCount + tcpCount,
        httpCount,
        tcpCount,
        withTLS,
    }


    const renderTransportTable = (protocol: string, transports: any[], isLoading: boolean, error: Error | null) => {
        const filteredData = filterTransports(transports)

        if (isLoading) {
            return (
                <Group justify="center" p="xl">
                    <Loader size="lg"/>
                </Group>
            )
        }

        if (filteredData.length === 0) {
            return (
                <Alert icon={<IconAlertCircle size={16}/>} color="blue">
                    {searchTerm
                        ? 'No transports found matching your search'
                        : `No ${protocol.toUpperCase()} server transports configured. Click "New Transport" to create one.`}
                </Alert>
            )
        }

        if (error) {
            return (
                <Container size="xl">
                    <Alert icon={<IconAlertCircle size={16}/>} color="red" title="Error">
                        Failed to load {protocol} server transports. Please try again.
                    </Alert>
                </Container>
            )
        }

        return (
            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Protocol</Table.Th>
                        <Table.Th>Provider</Table.Th>
                        <Table.Th>Timeouts</Table.Th>
                        <Table.Th>Features</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {filteredData.map((transport: any) => (
                        <Table.Tr key={transport.name}>
                            <Table.Td>
                                <Text fw={500}>{transport.name}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Badge color={protocol === 'http' ? 'blue' : 'green'} variant="light">
                                    {protocol.toUpperCase()}
                                </Badge>
                            </Table.Td>
                            <Table.Td>
                                <ProviderIcon provider={transport.provider || 'unknown'}/>
                            </Table.Td>
                            <Table.Td>
                                <Stack gap={2}>
                                    {transport.config?.dialTimeout && (
                                        <Text size="xs">Dial: {transport.config.dialTimeout}</Text>
                                    )}
                                    {transport.config?.dialKeepAlive && (
                                        <Text size="xs">Keep-Alive: {transport.config.dialKeepAlive}</Text>
                                    )}
                                </Stack>
                            </Table.Td>
                            <Table.Td>
                                <Group gap="xs">
                                    {hasTLS(transport) && (
                                        <Badge color="green" variant="light" size="sm">TLS</Badge>
                                    )}
                                    {hasProxyProtocol(transport) && (
                                        <Badge color="blue" variant="light" size="sm">Proxy</Badge>
                                    )}
                                    {hasSPIFFE(transport) && (
                                        <Badge color="violet" variant="light" size="sm">SPIFFE</Badge>
                                    )}
                                </Group>
                            </Table.Td>
                            <Table.Td>
                                <Badge color={transport.enabled ? 'green' : 'gray'} variant="light">
                                    {transport.enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </Table.Td>
                            <Table.Td>
                                <ResourceActionIconGroup resource={transport}/>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        )
    }

    return (
        <Container size="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Group>
                        <IconPlugConnected size={32} stroke={1.5} color="#00aec1"/>
                        <Title order={2}>Server Transports</Title>
                    </Group>
                    <Button
                        leftSection={<IconPlus size={16}/>}
                        onClick={() => navigate('/serversTransports/new')}
                    >
                        New Transport
                    </Button>
                </Group>

                <SimpleGrid cols={{base: 1, sm: 2, lg: 4}} spacing="lg">
                    <Card withBorder p="lg">
                        <Group>
                            <ThemeIcon size={60} color="blue" variant="light">
                                <IconPlugConnected size={30}/>
                            </ThemeIcon>
                            <Stack gap="xs">
                                <Text size="sm" fw={500} c="dimmed">Total Transports</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </Stack>
                        </Group>
                    </Card>

                    <Card withBorder p="lg">
                        <Group>
                            <ThemeIcon size={60} color="blue" variant="light">
                                <IconPlugConnected size={30}/>
                            </ThemeIcon>
                            <Stack gap="xs">
                                <Text size="sm" fw={500} c="dimmed">HTTP Transports</Text>
                                <Text size="xl" fw={700}>{stats.httpCount}</Text>
                            </Stack>
                        </Group>
                    </Card>

                    <Card withBorder p="lg">
                        <Group>
                            <ThemeIcon size={60} color="green" variant="light">
                                <IconPlugConnected size={30}/>
                            </ThemeIcon>
                            <Stack gap="xs">
                                <Text size="sm" fw={500} c="dimmed">TCP Transports</Text>
                                <Text size="xl" fw={700}>{stats.tcpCount}</Text>
                            </Stack>
                        </Group>
                    </Card>

                    <Card withBorder p="lg">
                        <Group>
                            <ThemeIcon size={60} color="violet" variant="light">
                                <IconShield size={30}/>
                            </ThemeIcon>
                            <Stack gap="xs">
                                <Text size="sm" fw={500} c="dimmed">With TLS</Text>
                                <Text size="xl" fw={700}>{stats.withTLS}</Text>
                            </Stack>
                        </Group>
                    </Card>
                </SimpleGrid>

                <Card shadow="sm" radius="md" withBorder>
                    <Stack gap="md">
                        <TextInput
                            placeholder="Search by name or provider..."
                            leftSection={<IconSearch size={16}/>}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'http')}>
                            <Tabs.List>
                                <Tabs.Tab value="http" leftSection={<IconRouter size={16}/>}>
                                    HTTP ({httpTransports?.length || 0})
                                </Tabs.Tab>
                                <Tabs.Tab value="tcp" leftSection={<IconNetwork size={16}/>}>
                                    TCP ({tcpTransports?.length || 0})
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="http" pt="md">
                                {renderTransportTable('http', httpTransports || [], isLoadingHttp, errorHttp)}
                            </Tabs.Panel>

                            <Tabs.Panel value="tcp" pt="md">
                                {renderTransportTable('tcp', tcpTransports || [], isLoadingTcp, errorTcp)}
                            </Tabs.Panel>
                        </Tabs>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    )
}