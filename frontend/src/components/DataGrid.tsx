import {ReactElement, useMemo, useState} from 'react'
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
import {IconSearch} from '@tabler/icons-react'
import _ from "lodash";

export interface Card<T = any> {
    key: string
    render: React.FC<{resource: T}>
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
    placeholderIcon?: () => ReactElement
    defaultSort: {
        key: string | null
        direction: 'asc' | 'desc' | null
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
        placeholderIcon = () => (<IconSearch size={24}/>),
        searchPlaceholder = 'Search...',
        emptyMessage = 'No data found',
        sortKeys = [],
        defaultSort,
        ...props
    }: DataGridProps<T> & SimpleGridProps
) {

    const [search, setSearch] = useState('')
    const [sortConfig, setSortConfig] = useState<{
        key: string | null
        direction: 'asc' | 'desc' | null
    }>(defaultSort)

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
        return _.orderBy(filteredData, [sortConfig.key], [sortConfig.direction ?? 'asc'])
    }, [filteredData, sortConfig]) as T[]

    return (
        <Stack>
            {data.length > 0 &&
                <Group gap={'xs'}>
                    <TextInput
                        placeholder={searchPlaceholder}
                        leftSection={<IconSearch size={16}/>}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{flex: 1}}
                        label={"Filter"}
                    />
                    <Select
                        data={sortKeys}
                        value={sortConfig.key}
                        onChange={(key) => setSortConfig({...sortConfig, key})}
                        placeholder="Sort by"
                        label="Sort by"
                    />
                    <Select
                        data={[{value: 'asc', label: 'Ascending'}, {value: 'desc', label: 'Descending'}]}
                        value={sortConfig.direction}
                        onChange={(direction) => setSortConfig({...sortConfig, direction: direction as any})}
                        placeholder="Sort direction"
                        label={"Sort direction"}
                    />
                </Group>
            }

            <ScrollArea>

                {isLoading ? (
                    <Stack align="center" justify="center" style={{minHeight: '200px'}}>
                        <Loader size="lg"/>
                        <Text>Loading...</Text>
                    </Stack>
                ) : sortedData.length === 0 ? (
                    <Stack align="center" py="xl">
                        <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                            {placeholderIcon()}
                        </ThemeIcon>
                        <Text c="dimmed" fw={500}>
                            {emptyMessage}
                        </Text>
                    </Stack>
                ) : (
                    <SimpleGrid {...props}>
                        {sortedData.map((item, i) => {
                            const card = _.get(cardMap, item[cardKey], cards[0])
                            return <card.render key={i} resource={item}/>;
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
        </Stack>
    )
}
