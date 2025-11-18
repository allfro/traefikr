import {Card, Group, SimpleGrid, Stack, Text, ThemeIcon, SimpleGridProps} from "@mantine/core";
import {Icon} from "@tabler/icons-react";
import {MantineColor} from "@mantine/core";

type StaticticPredicateFunction<T> = (item: T) => boolean
type StaticticAggregatorFunction<T> = (items: T[]) => number

export interface Statistic<T> {
    key: string
    label: string
    aggregator?: StaticticAggregatorFunction<T>
    predicate?: StaticticPredicateFunction<T>
    icon: React.FC | Icon
    iconColor: MantineColor
}


interface StatisticsCardProps<T> {
    statistics: Statistic<T>[]
    items: T[]
}


function calculateStatistic<T>(
    items: T[], aggregator?: StaticticAggregatorFunction<T>, predicate?: StaticticPredicateFunction<T>
): number {
    const filteredItems = items.filter(predicate || (() => true));
    return aggregator ? aggregator(filteredItems) : filteredItems.length;
}

//cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg"
export default function StatisticsCards<T>({statistics, items, ...props}: StatisticsCardProps<T> & SimpleGridProps) {

    return (
        <SimpleGrid {...props}>
            {statistics.map((statistic) => {
                return (
                    <Card withBorder p="lg" key={statistic.key}>
                        <Group>
                            <ThemeIcon size={60} color={statistic.iconColor} variant="light">
                                <statistic.icon size={30} />
                            </ThemeIcon>
                            <Stack gap="xs">
                                <Text size="sm" fw={500} c="dimmed">{statistic.label}</Text>
                                <Text size="xl" fw={700}>{calculateStatistic(items, statistic.aggregator, statistic.predicate)}</Text>
                            </Stack>
                        </Group>
                    </Card>
                )
            })}
        </SimpleGrid>
    )
}