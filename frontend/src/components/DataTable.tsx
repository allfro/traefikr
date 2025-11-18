import {useState, useMemo} from 'react'
import {
    Table,
    TextInput,
    Group,
    // Checkbox,
    // Menu,
    // Button,
    ScrollArea,
} from '@mantine/core'
import {
    IconSearch,
    // IconFilter,
    IconSortAscending,
    IconSortDescending
} from '@tabler/icons-react'
import _ from "lodash";

export interface Column<T = any> {
    key: string
    label: string
    sortable?: boolean
    render?: (value: any, row: T) => React.ReactNode
    width?: string | number
}

export interface Filter<T = any> {
    key: string
    label: string
    type: 'text' | 'select' | 'number' | 'boolean'
    test: (value: any, row: T) => boolean
}

export interface DataTableProps<T = any> {
    columns: Column<T>[]
    data: T[]
    // filters?: Filter<T>[]
    isLoading?: boolean
    onRowClick?: (row: T) => void
    onEdit?: (row: T) => void
    onDelete?: (row: T) => void
    onView?: (row: T) => void
    getRowKey: (row: T) => string
    canEdit?: (row: T) => boolean
    canDelete?: (row: T) => boolean
    searchPlaceholder?: string
    emptyMessage?: string
    defaultSort?: {
        key: string
        direction: 'asc' | 'desc'
    }
}

export function DataTable<T extends Record<string, any>>({
                                                             columns,
                                                             data = [],
                                                             // filters = [],
                                                             isLoading = false,
                                                             onRowClick,
                                                             getRowKey,
                                                             searchPlaceholder = 'Search...',
                                                             emptyMessage = 'No data found',
                                                             defaultSort,
                                                         }: DataTableProps<T>) {
    const [search, setSearch] = useState('')
    const [sortConfig, setSortConfig] = useState<{
        key: string
        direction: 'asc' | 'desc'
    } | null>(defaultSort || null)


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
    }, [data, search, columns])

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
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            {columns.map((col) => (
                                <Table.Th
                                    key={col.key}
                                    style={{
                                        width: col.width,
                                        cursor: col.sortable ? 'pointer' : 'default',
                                        userSelect: 'none',
                                    }}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <Group gap="xs" wrap="nowrap">
                                        {col.label}
                                        {col.sortable && sortConfig?.key === col.key && (
                                            sortConfig.direction === 'asc' ? (
                                                <IconSortAscending size={14}/>
                                            ) : (
                                                <IconSortDescending size={14}/>
                                            )
                                        )}
                                    </Group>
                                </Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {isLoading ? (
                            <Table.Tr>
                                <Table.Td colSpan={columns.length + 1} style={{textAlign: 'center'}}>
                                    Loading...
                                </Table.Td>
                            </Table.Tr>
                        ) : sortedData.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={columns.length + 1} style={{textAlign: 'center'}}>
                                    <div style={{padding: '2rem', color: 'var(--mantine-color-dimmed)'}}>
                                        {emptyMessage}
                                    </div>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            sortedData.map((row) => {
                                const rowKey = getRowKey(row)
                                return (
                                    <Table.Tr
                                        key={rowKey}
                                        style={{cursor: onRowClick ? 'pointer' : 'default'}}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {columns.map((col) => (
                                            <Table.Td key={`${rowKey}-${col.key}`}>
                                                {col.render ? col.render(_.get(row, col.key), row) : _.get(row, col.key)}
                                            </Table.Td>
                                        ))}
                                    </Table.Tr>
                                )
                            })
                        )}
                    </Table.Tbody>
                </Table>
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
