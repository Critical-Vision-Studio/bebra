import { Stack, Text, Switch, NumberInput, Paper, Group, Button, Loader, Center } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings, getUnwantedUsers, removeUnwantedUser } from '../api/settings'

export default function SidebarSettings() {
  const qc = useQueryClient()
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: unwanted = [] } = useQuery({ queryKey: ['unwantedUsers'], queryFn: getUnwantedUsers })

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  const removeMutation = useMutation({
    mutationFn: removeUnwantedUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unwantedUsers'] })
      notifications.show({ title: 'Removed', message: 'User removed from unwanted list', color: 'green' })
    },
  })

  if (isLoading) return <Center py="md"><Loader size="sm" /></Center>

  return (
    <Stack gap="md">
      <Text size="sm" fw={600}>Tinder-Bother</Text>
      <Switch
        label="Enable Tinder-Bother"
        checked={settings?.tinder_enabled ?? false}
        onChange={(e) => updateMutation.mutate({ tinder_enabled: e.currentTarget.checked })}
      />
      <NumberInput
        label="Match interval (minutes)"
        min={5}
        max={60}
        value={settings?.tinder_interval_minutes ?? 5}
        onChange={(val) => typeof val === 'number' && updateMutation.mutate({ tinder_interval_minutes: val })}
        disabled={!settings?.tinder_enabled}
        size="xs"
      />

      <Text size="sm" fw={600} mt="sm">Unwanted Users</Text>
      {unwanted.length === 0 ? (
        <Text size="xs" c="dimmed">No blocked users.</Text>
      ) : (
        unwanted.map((user) => (
          <Paper key={user.id} p="xs" withBorder>
            <Group justify="space-between">
              <Text size="sm">{user.username}</Text>
              <Button
                size="compact-xs"
                variant="light"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => removeMutation.mutate(user.id)}
              >
                Remove
              </Button>
            </Group>
          </Paper>
        ))
      )}
    </Stack>
  )
}
