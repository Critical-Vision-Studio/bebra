import { Avatar } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import ShaderAvatar from './ShaderAvatar'

interface UserAvatarProps {
  avatarUrl?: string | null
  shaderFragment?: string | null
  size?: number
  username?: string
  color?: string
}

export default function UserAvatar({ avatarUrl, shaderFragment, size = 48, username, color }: UserAvatarProps) {
  if (shaderFragment) {
    return <ShaderAvatar fragmentShader={shaderFragment} size={size} />
  }

  if (avatarUrl) {
    return (
      <Avatar
        src={avatarUrl}
        alt={username}
        size={size}
        radius="xl"
      />
    )
  }

  return (
    <Avatar size={size} radius="xl" color="gray">
      <IconUser size={size * 0.55} color={color ?? 'var(--mantine-color-gray-5)'} />
    </Avatar>
  )
}
