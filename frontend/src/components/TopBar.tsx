import { Group, Text, Button, ActionIcon } from '@mantine/core'
import { IconSettings, IconLogout } from '@tabler/icons-react'

interface TopBarProps {
  username: string
  onLogout: () => void
  onSettingsClick: () => void
}

export default function TopBar({ username, onLogout, onSettingsClick }: TopBarProps) {
  return (
    <Group
      h={56}
      px="md"
      justify="space-between"
      style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', background: 'white' }}
    >
      <Text size="xl" fw={700}>BotherApp</Text>
      <Group gap="sm">
        <Text size="sm" fw={500}>{username}</Text>
        <ActionIcon variant="subtle" color="gray" onClick={onSettingsClick}>
          <IconSettings size={20} />
        </ActionIcon>
        <Button variant="subtle" color="gray" size="xs" leftSection={<IconLogout size={16} />} onClick={onLogout}>
          Logout
        </Button>
      </Group>
    </Group>
  )
}
