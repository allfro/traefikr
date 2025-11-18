import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Resource, resourcesApi} from "@/lib/api.ts";
import {notifications} from "@mantine/notifications";

export default function useDeleteResourceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resource: Resource) => {
            await resourcesApi.delete(resource.protocol, resource.type, resource.provider, resource.name)
        },

        onSuccess: async (_, resource) => {
            await queryClient.invalidateQueries({ queryKey: [resource.protocol, resource.type] });

            notifications.show({
                title: 'Success',
                message: <><b>{resource.name}</b> deleted successfully</>,
                color: 'green',
            })
        },
        
        onError: (error, resource) => {
            notifications.show({
                title: 'Error',
                message: <>Failed to delete <b>{resource.name}</b> ({error.message})</>,
                color: 'red',
            })
        },
    });
}