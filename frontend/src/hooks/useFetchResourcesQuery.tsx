import {useQuery} from "@tanstack/react-query";
import {entrypointsApi, Protocol, resourcesApi, ResourceType} from "@/lib/api.ts";


export function useFetchResourcesQuery(protocol: Protocol, type: ResourceType, includeTraefik = true) {
    return useQuery({
        queryKey: [protocol, type],
        queryFn: async () => {
            const response = await resourcesApi.list(protocol, type, includeTraefik)
            return response.data
        }
    })
}

export function useFetchEntryPointsQuery() {
    return useQuery({
        queryKey: ["entrypoints"],
        queryFn: async () => {
            const response = await entrypointsApi.list()
            return response.data
        }
    })
}