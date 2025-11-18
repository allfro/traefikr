import {Group} from "@mantine/core";
import DownloadConfigActionIcon from "@/components/DownloadConfigActionIcon.tsx";
import EditResourceActionIcon from "@/components/EditResourceActionIcon.tsx";
import DeleteResourceActionIcon from "@/components/DeleteResourceActionIcon.tsx";
import ViewResourceActionIcon from "@/components/ViewResourceActionIcon.tsx";

interface ResourceActionIconGroupProps {
    resource: any
    readonly?: boolean
    canDelete?: boolean
    canEdit?: boolean
    canDownload?: boolean
    canView?: boolean
}

export default function ResourceActionIconGroup(
    {
        resource,
        readonly = false,
        canDownload = true,
        canEdit=true,
        canDelete=true,
        canView=true
    }: ResourceActionIconGroupProps
) {

    return (
        <Group gap="xs"  wrap="nowrap">
            {canView && <ViewResourceActionIcon resource={resource} size={16}/>}
            {canDownload && <DownloadConfigActionIcon resource={resource} size={16}/>}
            {(!readonly && canEdit && resource.source === 'database') && <EditResourceActionIcon resource={resource} size={16}/>}
            {(!readonly && canDelete && resource.source === 'database') && <DeleteResourceActionIcon resource={resource} size={16}/>}
        </Group>
    );
}