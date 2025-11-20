import {useParams} from "react-router-dom";
import {Protocol} from "@/lib/api.ts";
import _ from "lodash";

export default function useResourceParams(): { name: string; subType?: string; protocol: Protocol, provider: string } {
    let {
        name = '',
        subType,
        protocol = 'any'
    } = useParams<{ name: string; subType?: string; protocol?: Protocol }>();

    let provider = 'http';

    if (!_.isEmpty(name) && name.includes('@')) {
        [name, provider] = name.split('@', 2);
    }

    return {name, subType, protocol, provider};
}