import {IconTrash} from "@tabler/icons-react";
import {ActionIcon, Code, Text} from "@mantine/core";
import {Resource} from "@/lib/api.ts";
import useDeleteResourceMutation from "@/hooks/useDeleteResourceMutation.tsx";
import {UseMutationResult} from "@tanstack/react-query";
import {modals} from "@mantine/modals";
import {getProtocolLabel, getResourceTypeLabel} from "@/lib/utils.ts";


interface DeleteActionIconProps {
    resource: Resource;
    size: number;
}


const handleConfirmDeleteResource = (
    resource: Resource, deleteMutation: UseMutationResult<void, Error, Resource>
): void => {
    const singularType = getResourceTypeLabel(resource.type, false, false);

    modals.openConfirmModal({
        title: <b>Delete {singularType}</b>,
        children: (
            <Text size="sm">
                Are you sure you want to delete the {getProtocolLabel(resource.protocol)} {singularType} <Code color="red.9" c="white">{resource.name}@{resource.provider}</Code>? This action cannot be undone.
            </Text>
        ),
        labels: {confirm: 'Delete', cancel: 'Cancel'},
        confirmProps: {color: 'red'},
        onConfirm: () => deleteMutation.mutate(resource),
    });
}

export default function DeleteResourceActionIcon({resource, size = 16}: DeleteActionIconProps) {

    const deleteMutation = useDeleteResourceMutation();

    return <ActionIcon
        variant="subtle"
        color="red"
        onClick={handleConfirmDeleteResource.bind(null, resource, deleteMutation)}
        disabled={resource.source === 'traefik'}
        title={`Delete ${getProtocolLabel(resource.protocol)} ${getResourceTypeLabel(resource.type, false, false)} ${resource.name}@${resource.provider}`}
    >
        <IconTrash size={size} />
    </ActionIcon>

}