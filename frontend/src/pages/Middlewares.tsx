import {useState} from 'react'
import {Button, Card, Container, Stack, Tabs,} from '@mantine/core'
import {IconNetwork, IconPlus, IconRouter, IconShield, IconTransferVertical, IconWorldWww,} from '@tabler/icons-react'
import {useFetchResourcesQuery} from "@/hooks/useFetchResourcesQuery.tsx";
import {useNavigate} from "react-router-dom";
import {DataGrid} from "@/components/DataGrid.tsx";
import MiddlewareCard from "@/components/MiddlewareCard.tsx";
import {Resource} from "@/lib/api.ts";
import StatisticsCards from "@/components/StatisticsCards.tsx";
import PageHeader from "@/components/PageHeader.tsx";

export default function Middlewares() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<string>('http')

    // Fetch HTTP middlewares
    const {data: httpMiddlewares = [], isLoading: httpLoading} = useFetchResourcesQuery('http', 'middlewares', true);

    // Fetch TCP middlewares
    const {data: tcpMiddlewares = [], isLoading: tcpLoading} = useFetchResourcesQuery('tcp', 'middlewares', true);

    const handleCreate = () => {
        navigate('/middlewares/new')
    }

    const defaultSort = {key: "name", direction: "asc"} as { key: string, direction: 'asc' | 'desc' }

    const renderCard = ({resource, ...props}: { resource: Resource }) => <MiddlewareCard resource={resource} withBorder
                                                                                         style={{
                                                                                             display: 'flex',
                                                                                             flexDirection: 'column',
                                                                                             height: '100%'
                                                                                         }} {...props}/>

    return (
        <Container size="xl">
            <Stack gap="xl">
                <PageHeader
                    title={'Middlewares'}
                    subTitle={
                        'Add authentication, rate limiting, compression, and more.'
                    }
                    icon={IconShield}
                    iconColor={"#00aec1"}
                >
                    <Button leftSection={<IconPlus size={16}/>} onClick={handleCreate}>
                        Add Middleware
                    </Button>
                </PageHeader>

                <StatisticsCards statistics={[
                    {
                        key: "total",
                        icon: IconShield,
                        iconColor: "blue",
                        label: "Total Middlewares"
                    }, {
                        key: "httpEnabled",
                        icon: IconWorldWww,
                        iconColor: "green",
                        predicate: (i) => i.protocol == 'http',
                        aggregator: undefined,
                        label: "HTTP Enabled"
                    }, {
                        key: "tcpEnabled",
                        icon: IconTransferVertical,
                        iconColor: "violet",
                        predicate: (i) => i.protocol == 'tcp',
                        aggregator: undefined,
                        label: "TCP Enabled"
                    }
                ]} items={tcpMiddlewares.concat(httpMiddlewares)} cols={{base: 1, sm: 2, lg: 3}} spacing="lg"/>

                <Card shadow="sm" radius="md" withBorder>
                    <Stack gap="md">
                        <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'http')}>
                            <Tabs.List>
                                <Tabs.Tab value="http" leftSection={<IconRouter size={16}/>}>
                                    HTTP ({httpMiddlewares.length})
                                </Tabs.Tab>
                                <Tabs.Tab value="tcp" leftSection={<IconNetwork size={16}/>}>
                                    TCP ({tcpMiddlewares.length})
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="http" pt="md">
                                <DataGrid
                                    cards={[{
                                        key: "middleware",
                                        render: renderCard
                                    }]}
                                    cardKey={"config.type"}
                                    sortKeys={[
                                        {
                                            value: "name",
                                            label: "Name"
                                        },
                                        {
                                            value: "config.type",
                                            label: "Type"
                                        }
                                    ]}
                                    defaultSort={defaultSort}
                                    data={httpMiddlewares}
                                    cols={{base: 1, md: 2, lg: 3}}
                                    spacing="lg"
                                    emptyMessage={"No HTTP middlewares found."}
                                    isLoading={httpLoading}
                                />
                            </Tabs.Panel>

                            <Tabs.Panel value="tcp" pt="md">
                                <DataGrid
                                    cards={[{
                                        key: "middleware",
                                        render: renderCard
                                    }]}
                                    cardKey={"config.type"}
                                    sortKeys={[
                                        {
                                            value: "name",
                                            label: "Name"
                                        }
                                    ]}
                                    defaultSort={defaultSort}
                                    data={tcpMiddlewares}
                                    cols={{base: 1, md: 2, lg: 3}}
                                    spacing="lg"
                                    emptyMessage={"No TCP middlewares found."}
                                    isLoading={tcpLoading}
                                />
                            </Tabs.Panel>
                        </Tabs>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    )
}
