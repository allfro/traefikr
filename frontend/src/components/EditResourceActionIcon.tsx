import {IconEdit} from "@tabler/icons-react";
import {ActionIcon} from "@mantine/core";
import {Resource} from "@/lib/api.ts";
import {useNavigate} from "react-router-dom";


interface EditResourceActionIconProps {
    resource: Resource;
    size: number;
}


export default function EditResourceActionIcon({resource, size = 16}: EditResourceActionIconProps) {
    const navigate = useNavigate();

    return <ActionIcon
        variant="subtle"
        onClick={() => navigate(`/${resource.type}/${resource.protocol}/${resource.name}@${resource.provider}/edit`)}
        disabled={resource.source === 'traefik'}
        title="Edit transport"
    >
        <IconEdit size={size}/>
    </ActionIcon>
}