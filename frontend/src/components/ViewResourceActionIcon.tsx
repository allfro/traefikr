import {useState} from "react";
import {Resource} from "@/lib/api.ts";
import {ActionIcon} from "@mantine/core";
import {IconEye} from "@tabler/icons-react";
import {ResourceViewModal} from "@/components/ResourceViewModal.tsx";


interface ViewResourceActionIconProps {
    resource: Resource;
    size?: number;
}

export default function ViewResourceActionIcon({resource, size = 16}: ViewResourceActionIconProps) {
    const [viewModalOpened, setViewModalOpened] = useState(false)
    const [viewResource, setViewResource] = useState<Resource | null>(null)

    const handleView = (resource: Resource) => {
        setViewResource(resource)
        setViewModalOpened(true)
    }

    return (
        <>
            <ActionIcon
                variant="subtle"
                color="blue"
                onClick={handleView.bind(null, resource)}
            >
                <IconEye size={size}/>
            </ActionIcon>
            {viewResource && (
                <ResourceViewModal
                    opened={viewModalOpened}
                    onClose={() => setViewModalOpened(false)}
                    resource={viewResource}
                />
            )}
        </>
    )
}