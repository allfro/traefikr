import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Resource, resourcesApi} from "@/lib/api.ts";
import {notifications} from "@mantine/notifications";
import {Code} from "@mantine/core";

export default function useUpdateResourceMutation(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resource: Resource) => {
            await resourcesApi.update(resource.protocol, resource.type, resource.name, resource.provider, resource)
        },

        onSuccess: async (_, resource) => {
            await queryClient.invalidateQueries({ queryKey: [resource.protocol, resource.type] });

            notifications.show({
                title: 'Success',
                message: <><Code>{resource.name}</Code> updated successfully</>,
                color: 'green',
            })

            if (onSuccess)
                onSuccess();
        },

        onError: (error, resource) => {
            notifications.show({
                title: 'Error',
                message: <>Failed to updated <Code>{resource.name}</Code> ({error.message})</>,
                color: 'red',
            })
        },
    });
}
