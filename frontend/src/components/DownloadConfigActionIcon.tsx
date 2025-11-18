import {IconDownload} from "@tabler/icons-react";
import {ActionIcon} from "@mantine/core";
import {Resource} from "@/lib/api";
import {stringify} from "smol-toml";
import {notifications} from "@mantine/notifications";

interface DownloadConfigActionIconProps {
    resource: Resource;
    size: number;
}


const handleDownloadResourceConfiguration = (resource: Resource): void => {

    // Build Traefik config format
    if (resource.name.includes('@')) {
        [resource.name, resource.provider as string] = resource.name.split('@')
    }

    delete resource.config.using;

    const jsonConfig = (resource.protocol === 'any') ?
        {
            [resource.type]: {
                [resource.name]: resource.config
            }
        }
        :
        {
            [resource.protocol]: {
                [resource.type]: {
                    [resource.name]: resource.config
                }
            }
        }

    // Convert to JSON string with pretty formatting
    const jsonContent = stringify(jsonConfig)

    // Create blob and download
    const blob = new Blob([jsonContent], {type: 'application/toml'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = `${resource.protocol}-${resource.type}-${resource.name}.toml`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    notifications.show({
        title: 'Success',
        message: `Downloaded ${filename}`,
        color: 'green'
    })
}

export default function DownloadConfigActionIcon({resource, size = 16}: DownloadConfigActionIconProps) {
    return <ActionIcon
        variant="subtle"
        color="blue"
        onClick={handleDownloadResourceConfiguration.bind(null, resource)}
        title="Download Traefik config"
    >
        <IconDownload size={size}/>
    </ActionIcon>
}