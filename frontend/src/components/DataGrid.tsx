import {useMemo, useState} from 'react'
import {
    Group,
    Loader,
    ScrollArea,
    Select,
    SimpleGrid,
    SimpleGridProps,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
} from '@mantine/core'
import {IconSearch, IconShield} from '@tabler/icons-react'
import _ from "lodash";

export interface Card<T = any> {
    key: string
    render: (item: T) => React.ReactNode
}

export interface Filter<T = any> {
    key: string
    label: string
    type: 'text' | 'select' | 'number' | 'boolean'
    test: (value: any, row: T) => boolean
}

export interface SortKey {
    value: string
    label: string
}

export interface DataGridProps<T = any> {
    cards: Card<T>[]
    cardKey: string
    sortKeys?: SortKey[]
    data: T[]
    // filters?: Filter<T>[]
    isLoading?: boolean
    onCardClick?: (row: T) => void
    searchPlaceholder?: string
    emptyMessage?: string
    defaultSort?: {
        key: string
        direction: 'asc' | 'desc'
    }
}

export function DataGrid<T extends Record<string, any>>(
    {
        cards,
        cardKey,
        data = [],
        // filters = [],
        isLoading = false,
        onCardClick,
        searchPlaceholder = 'Search...',
        emptyMessage = 'No data found',
        sortKeys = [],
        defaultSort,
        ...props
    }: DataGridProps<T> & SimpleGridProps
) {
    const [search, setSearch] = useState('')
    const [sortConfig, setSortConfig] = useState<{
        key?: string
        direction: 'asc' | 'desc'
    } | null>(defaultSort || null)

    const cardMap = useMemo(() => {
        return _.keyBy(cards, 'key')
    }, [cards])

    // const [enabledFilters, setEnabledFilters] = useState(
    //     _.reduce(
    //         filters,
    //         (result: Record<string, boolean>, filter: Filter) => {
    //             result[filter.key] = false; return result
    //         },
    //         {} as Record<string, boolean>
    //     )
    // )

    // Filter data
    const filteredData = useMemo(() => {
        let filtered = [...data]

        // Text search across all columns
        if (search) {
            const searchLower = search.toLowerCase()
            filtered = _.filter(filtered, t => JSON.stringify(t).toLowerCase().includes(searchLower));
        }

        // TODO: incorporate filters

        return filtered
    }, [data, search, cards])

    // Sort data
    const sortedData = useMemo(() => {
        return (!sortConfig) ? filteredData : _.orderBy(filteredData, [sortConfig.key], [sortConfig.direction])
    }, [filteredData, sortConfig])

    const handleSort = (key: string) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return current.direction === 'asc'
                    ? {key, direction: 'desc'}
                    : null
            }
            return {key, direction: 'asc'}
        })
    }


    return (
        <div>
            <Group mb="md" justify="space-between">
                <TextInput
                    placeholder={searchPlaceholder}
                    leftSection={<IconSearch size={16}/>}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    style={{flex: 1, maxWidth: 400}}
                />
                <Select
                    data={sortKeys}
                    value={sortConfig ? sortConfig.key : ''}
                    onChange={(value) => setSortConfig({key: value, ...sortConfig})}
                />
                <Select
                    data={[{value: 'asc', label: 'Ascending'}, {value: 'desc', label: 'Descending'}]}
                    value={value ? value.value : ''}
                    onChange={() => setSortConfig(null)}
                />


                {/*<Group gap="xs">*/}
                {/*    {(false) && (*/}
                {/*        <Menu position="bottom-end" shadow="md">*/}
                {/*            <Menu.Target>*/}
                {/*                <Button*/}
                {/*                    variant={hasActiveFilters ? 'filled' : 'light'}*/}
                {/*                    leftSection={<IconFilter size={16}/>}*/}
                {/*                    size="sm"*/}
                {/*                >*/}
                {/*                    Filters {hasActiveFilters && `(${[showDatabaseOnly, showEnabledOnly].filter(Boolean).length})`}*/}
                {/*                </Button>*/}
                {/*            </Menu.Target>*/}
                {/*            <Menu.Dropdown>*/}
                {/*                {enableSourceFilter && (*/}
                {/*                    <Menu.Item closeMenuOnClick={false}>*/}
                {/*                        <Checkbox*/}
                {/*                            label="Database resources only"*/}
                {/*                            checked={showDatabaseOnly}*/}
                {/*                            onChange={(e) => setShowDatabaseOnly(e.currentTarget.checked)}*/}
                {/*                        />*/}
                {/*                    </Menu.Item>*/}
                {/*                )}*/}
                {/*                {enableStatusFilter && (*/}
                {/*                    <Menu.Item closeMenuOnClick={false}>*/}
                {/*                        <Checkbox*/}
                {/*                            label="Enabled resources only"*/}
                {/*                            checked={showEnabledOnly}*/}
                {/*                            onChange={(e) => setShowEnabledOnly(e.currentTarget.checked)}*/}
                {/*                        />*/}
                {/*                    </Menu.Item>*/}
                {/*                )}*/}
                {/*                {hasActiveFilters && (*/}
                {/*                    <>*/}
                {/*                        <Menu.Divider/>*/}
                {/*                        <Menu.Item*/}
                {/*                            onClick={() => {*/}
                {/*                                setShowDatabaseOnly(false)*/}
                {/*                                setShowEnabledOnly(false)*/}
                {/*                            }}*/}
                {/*                        >*/}
                {/*                            Clear filters*/}
                {/*                        </Menu.Item>*/}
                {/*                    </>*/}
                {/*                )}*/}
                {/*            </Menu.Dropdown>*/}
                {/*        </Menu>*/}
                {/*    )}*/}
                {/*</Group>*/}
            </Group>

            <ScrollArea>

                {isLoading ? (
                    <Stack align="center" justify="center" style={{minHeight: '200px'}}>
                        <Loader size="lg"/>
                        <Text>Loading...</Text>
                    </Stack>
                ) : sortedData.length === 0 ? (
                    <Stack align="center" py="xl">
                        <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                            <IconShield size={28}/>
                        </ThemeIcon>
                        <Text c="dimmed" fw={500}>
                            {emptyMessage}
                        </Text>
                    </Stack>
                ) : (
                    <SimpleGrid {...props}>
                        {sortedData.map((item) => {
                            const card = _.get(cardMap, item[cardKey], cards[0])
                            return card.render(item);
                        })}
                    </SimpleGrid>
                )}

            </ScrollArea>

            {sortedData.length > 0 && (
                <Group mt="sm" justify="space-between">
                    <div style={{fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)'}}>
                        Showing {sortedData.length} of {data.length} items
                    </div>
                </Group>
            )}
        </div>
    )
}
