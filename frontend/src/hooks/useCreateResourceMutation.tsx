import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Resource, resourcesApi} from "@/lib/api.ts";
import {notifications} from "@mantine/notifications";
import {Code} from "@mantine/core";
import _ from "lodash";

export default function useCreateResourceMutation(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resource: Resource) => {
            await resourcesApi.create(resource.protocol, resource.type, resource)
        },

        onSuccess: async (_, resource) => {
            await queryClient.invalidateQueries({ queryKey: [resource.protocol, resource.type] });

            notifications.show({
                title: 'Success',
                message: <><Code>{resource.name}</Code> created successfully</>,
                color: 'green',
            })

            if (onSuccess)
                onSuccess();
        },

        onError: (error, resource) => {
            notifications.show({
                title: 'Error',
                message: <>Failed to create <Code>{resource.name}</Code> ({error.message})</>,
                color: 'red',
            })
        },
    });
}