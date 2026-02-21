import { Text, Center, Indicator, Stack } from '@mantine/core'
import UserAvatar from './UserAvatar'
import type { FriendUser } from '../types'

const CARD_SIZE = 100

interface FriendGridProps {
  friends: FriendUser[]
  selectedFriend: FriendUser | null
  onFriendClick: (friend: FriendUser, avatarRect: DOMRect) => void
  unreadFriendshipIds?: number[]
  unreadPreviews?: Record<number, string>
}

export default function FriendGrid({ friends, selectedFriend, onFriendClick, unreadFriendshipIds = [], unreadPreviews = {} }: FriendGridProps) {
  if (friends.length === 0) {
    return (
      <Center h={200}>
        <Text c="dimmed">No friends yet. Search and add some!</Text>
      </Center>
    )
  }

  const unreadSet = new Set(unreadFriendshipIds)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {friends.map((friend) => {
        const selected = selectedFriend?.id === friend.id
        const hasUnread = unreadSet.has(friend.friendship_id)
        const preview = unreadPreviews[friend.friendship_id]
        return (
          <div
            key={friend.id}
            onClick={(e) => {
              const avatarEl = e.currentTarget.querySelector('[data-avatar]')
              const rect = avatarEl?.getBoundingClientRect() ?? e.currentTarget.getBoundingClientRect()
              onFriendClick(friend, rect)
            }}
            style={{
              width: CARD_SIZE,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <Stack align="center" gap={4}>
              <Indicator
                color="red"
                size={12}
                offset={4}
                processing
                disabled={!hasUnread}
              >
                <div
                  data-avatar
                  style={{
                    borderRadius: '50%',
                    boxShadow: selected
                      ? '0 0 0 3px var(--mantine-color-blue-5)'
                      : hasUnread
                        ? '0 0 0 2px var(--mantine-color-blue-3)'
                        : '0 0 0 1px var(--mantine-color-gray-3)',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <UserAvatar
                    avatarUrl={friend.avatar_url}
                    shaderFragment={friend.shader_fragment}
                    size={56}
                    username={friend.username}
                    color={hasUnread ? 'var(--mantine-color-blue-5)' : undefined}
                  />
                </div>
              </Indicator>
              <Text size="xs" fw={500} truncate style={{ maxWidth: CARD_SIZE }}>
                {friend.username}
              </Text>
              {preview && (
                <Text
                  size="xs"
                  c="blue"
                  truncate
                  style={{
                    fontStyle: 'italic',
                    lineHeight: 1.3,
                    maxWidth: CARD_SIZE,
                  }}
                >
                  &ldquo;{preview}&rdquo;
                </Text>
              )}
            </Stack>
          </div>
        )
      })}
    </div>
  )
}
