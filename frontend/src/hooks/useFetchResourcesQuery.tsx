import {useQuery} from "@tanstack/react-query";
import {Protocol, resourcesApi, ResourceType} from "@/lib/api.ts";


export function useFetchResourcesQuery(protocol: Protocol, type: ResourceType, includeTraefik = true) {
    return useQuery({
        queryKey: [protocol, type],
        queryFn: async () => {
            const response = await resourcesApi.list(protocol, type, includeTraefik)
            return response.data
        }
    })
}

export function useFetchResourceQuery(protocol: Protocol, type: ResourceType, name: string, provider: string, enabled: boolean) {
    return useQuery({
        queryKey: [protocol, type, name, provider],
        queryFn: async () => {
            const response = await resourcesApi.get(protocol, type, name, provider)
            return response.data
        },
        enabled
    })
}