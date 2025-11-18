import {Outlet, NavLink as RouterNavLink, useNavigate} from 'react-router-dom'
import {AppShell, Burger, Group, Title, Text, NavLink, Button, Avatar, Menu, Box, Divider} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {
    IconHome,
    IconRouter,
    IconServer,
    IconSettings2,
    IconSettings,
    IconLogout,
    IconNetwork,
    IconLock,
    IconPlugConnected,
    IconKey
} from '@tabler/icons-react'
import {useAuth} from '@/contexts/AuthContext'
import ChangePasswordModal from '@/components/ChangePasswordModal'
import {useState} from 'react'

export default function Layout() {
    const [opened, {toggle}] = useDisclosure()
    const {user, logout} = useAuth()
    const navigate = useNavigate()
    const [changePasswordOpened, setChangePasswordOpened] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const navItems = [
        {path: '/', label: 'Dashboard', icon: IconHome},
        {path: '-', label: 'service connectivity', icon: null},
        {path: '/routers', label: 'Routers', icon: IconRouter},
        {path: '/services', label: 'Services', icon: IconServer},
        {path: '/middlewares', label: 'Middlewares', icon: IconSettings2},
        {path: '-', label: 'transport settings', icon: null},
        {path: '/entrypoints', label: 'Entrypoints', icon: IconNetwork},
        {path: '/serversTransports', label: 'Servers Transport', icon: IconPlugConnected},
        {path: '/tls', label: 'TLS', icon: IconLock},
        {path: '-', label: 'traefikr administration', icon: null},
        {path: '/settings', label: 'Settings', icon: IconSettings},
    ]

    return (
        <AppShell
            header={{height: 60}}
            navbar={{
                width: 250,
                breakpoint: 'sm',
                collapsed: {mobile: !opened}
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger
                            opened={opened}
                            onClick={toggle}
                            hiddenFrom="sm"
                            size="sm"
                        />
                        <Group gap="xs">
                            <img
                                src="/traefikr_logo.svg"
                                alt="Traefikr Logo"
                                style={{
                                    width: 32,
                                    height: 32
                                }}
                            />
                            <Title order={3} c="white">traefikr</Title>
                        </Group>
                    </Group>

                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <Button variant="subtle" p="xs">
                                <Group gap="sm">
                                    <Avatar size="sm" color="traefikBlue">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Text size="sm" c="white">{user?.username}</Text>
                                </Group>
                            </Button>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Label>Account</Menu.Label>
                            <Menu.Item
                                leftSection={<IconKey size={16}/>}
                                onClick={() => setChangePasswordOpened(true)}
                            >
                                Change Password
                            </Menu.Item>
                            <Menu.Divider/>
                            <Menu.Item
                                color="red"
                                leftSection={<IconLogout size={16}/>}
                                onClick={handleLogout}
                            >
                                Logout
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <AppShell.Section>
                    <Text size="xs" fw={500} c="gray.4" mb="sm" tt="uppercase">Navigation</Text>
                    {navItems.map((item, index) => {
                        if (item.path === '-') {
                            return <Divider key={`nav-divider-${index}`} my={'xs'} color={'gray.7'} label={item.label}/>
                        }

                        return (
                            <NavLink
                                key={item.path}
                                component={RouterNavLink}
                                to={item.path}
                                label={item.label}
                                // @ts-ignore
                                leftSection={<item.icon size={20} stroke={1.5}/>}
                                styles={(_, params) => ({
                                    root: {
                                        backgroundColor: params.active ? 'rgba(0, 174, 193, 0.15)' : undefined,
                                        borderRadius: 'var(--mantine-radius-sm)',
                                        borderLeft: params.active ? '3px solid #00aec1' : '3px solid transparent',
                                        color: params.active ? '#4dd2de' : 'rgba(255, 255, 255, 0.8)',
                                        marginBottom: 4
                                    }
                                })}
                                mb={4}
                            />
                        )
                    })}
                </AppShell.Section>

                <AppShell.Section mt="auto">
                    <Box style={{padding: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}>
                        <Text size="xs" c="gray.5" ta="center">traefikr v0.1.0</Text>
                    </Box>
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet/>
            </AppShell.Main>

            <ChangePasswordModal
                opened={changePasswordOpened}
                onClose={() => setChangePasswordOpened(false)}
            />
        </AppShell>
    )
}