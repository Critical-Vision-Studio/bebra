import { Modal, Stack, Text, Switch, NumberInput, Paper, Group, Button, Loader, Center, Avatar, FileButton } from '@mantine/core'
import { IconTrash, IconCheck, IconPhoto, IconUser } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings, getUnwantedUsers, removeUnwantedUser } from '../api/settings'
import { useShaderScenes, useUpdateAvatar } from '../hooks/useShaderScenes'
import { useCurrentUser } from '../hooks/useAuth'
import ShaderAvatar from './ShaderAvatar'
import imageCompression from 'browser-image-compression'

interface SettingsModalProps {
  opened: boolean
  onClose: () => void
}

export default function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const qc = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings, enabled: opened })
  const { data: unwanted = [] } = useQuery({ queryKey: ['unwantedUsers'], queryFn: getUnwantedUsers, enabled: opened })
  const { data: scenesRaw } = useShaderScenes(opened)
  const scenes = Array.isArray(scenesRaw) ? scenesRaw : []
  const avatarMutation = useUpdateAvatar()

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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Settings"
      size="lg"
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      {isLoading ? (
        <Center py="xl"><Loader size="md" /></Center>
      ) : (
        <Stack gap="lg">
          <Stack gap="sm">
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
              size="sm"
            />
          </Stack>

          <Stack gap="sm">
            <Text size="sm" fw={600}>Avatar</Text>
            <Text size="xs" c="dimmed">Upload a photo or pick a live shader scene.</Text>

            <Group gap="sm" align="flex-start">
              {/* Current avatar preview */}
              <AvatarOption
                active={!currentUser?.avatar_url && !currentUser?.shader_scene_id}
                onClick={() => avatarMutation.mutate({ avatar_url: null, shader_scene_id: null })}
                label="Default"
              >
                <Avatar size={48} radius="xl" color="gray">
                  <IconUser size={26} />
                </Avatar>
              </AvatarOption>

              {/* Upload photo */}
              <FileButton
                onChange={async (file) => {
                  if (!file) return
                  try {
                    const compressed = await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 256 })
                    const reader = new FileReader()
                    reader.onload = () => {
                      const dataUrl = reader.result as string
                      avatarMutation.mutate({ avatar_url: dataUrl, shader_scene_id: null })
                    }
                    reader.readAsDataURL(compressed)
                  } catch {
                    notifications.show({ title: 'Error', message: 'Failed to process image', color: 'red' })
                  }
                }}
                accept="image/png,image/jpeg,image/webp"
              >
                {(props) => (
                  <AvatarOption
                    active={!!currentUser?.avatar_url}
                    onClick={props.onClick}
                    label="Photo"
                  >
                    {currentUser?.avatar_url ? (
                      <Avatar size={48} radius="xl" src={currentUser.avatar_url} />
                    ) : (
                      <Avatar size={48} radius="xl" color="gray" variant="light">
                        <IconPhoto size={24} />
                      </Avatar>
                    )}
                  </AvatarOption>
                )}
              </FileButton>

              {/* Shader scenes */}
              {scenes.map((scene) => (
                <AvatarOption
                  key={scene.id}
                  active={currentUser?.shader_scene_id === scene.id}
                  onClick={() => avatarMutation.mutate({ avatar_url: null, shader_scene_id: scene.id })}
                  label={scene.name}
                >
                  <ShaderAvatar fragmentShader={scene.fragment_shader} size={48} />
                </AvatarOption>
              ))}
            </Group>
          </Stack>

          <Stack gap="sm">
            <Text size="sm" fw={600}>Unwanted Users</Text>
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
        </Stack>
      )}
    </Modal>
  )
}

function AvatarOption({ active, onClick, label, children }: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', textAlign: 'center', position: 'relative' }}
    >
      <div style={{
        borderRadius: '50%',
        boxShadow: active ? '0 0 0 3px var(--mantine-color-blue-5)' : '0 0 0 1px var(--mantine-color-gray-3)',
        transition: 'box-shadow 0.15s',
        lineHeight: 0,
      }}>
        {children}
      </div>
      {active && (
        <IconCheck
          size={16}
          style={{
            position: 'absolute',
            bottom: 10,
            right: -2,
            background: 'var(--mantine-color-blue-5)',
            borderRadius: '50%',
            color: 'white',
            padding: 1,
          }}
        />
      )}
      <Text size={10} ta="center" mt={4} truncate style={{ maxWidth: 52 }}>{label}</Text>
    </div>
  )
}
