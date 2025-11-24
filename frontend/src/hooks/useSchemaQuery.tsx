import {useQuery} from "@tanstack/react-query";
import {Protocol, resourcesApi, ResourceType} from "@/lib/api.ts";

export default function useSchemaQuery(protocol: Protocol, type: ResourceType) {
    return useQuery({
        queryKey: ['schema', protocol, type],
        queryFn: async () => {
            const response = await resourcesApi.getSchema(protocol, type)
            return response.data
        },
    })
}