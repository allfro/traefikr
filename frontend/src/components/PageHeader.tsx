import {Group, Text, Title} from "@mantine/core";
import {Icon} from "@tabler/icons-react";
import React from "react";

interface PageHeaderProps {
    icon: React.FC | Icon,
    iconColor: string,
    title: string,
    subTitle: string
}

export default function PageHeader({icon:Icon, iconColor, title, subTitle, children}: React.PropsWithChildren<PageHeaderProps>) {
    return (
        <Group justify="space-between">
            <Group justify="space-between" align="center">
                <Group>
                    <Icon size={32} stroke={1.5} color={iconColor}/>
                    <div>
                        <Title order={2}>{title}</Title>
                        <Text size="sm" c="dimmed">
                            {subTitle}
                        </Text>
                    </div>
                </Group>
            </Group>
            {children}
        </Group>
    )
}