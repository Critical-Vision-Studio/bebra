import { SimpleGrid, Paper, Text, Center, Indicator } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import type { FriendUser } from '../types'

interface FriendGridProps {
  friends: FriendUser[]
  selectedFriend: FriendUser | null
  onFriendClick: (friend: FriendUser) => void
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
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
      {friends.map((friend) => {
        const selected = selectedFriend?.id === friend.id
        const hasUnread = unreadSet.has(friend.friendship_id)
        const preview = unreadPreviews[friend.friendship_id]
        return (
          <Paper
            key={friend.id}
            p="md"
            withBorder
            shadow={selected ? 'md' : undefined}
            onClick={() => onFriendClick(friend)}
            style={{
              cursor: 'pointer',
              borderColor: selected
                ? 'var(--mantine-color-blue-5)'
                : hasUnread
                  ? 'var(--mantine-color-blue-3)'
                  : undefined,
              textAlign: 'center',
              transition: 'border-color 0.15s',
            }}
          >
            <Center mb={4}>
              <Indicator
                color="red"
                size={12}
                offset={2}
                processing
                disabled={!hasUnread}
              >
                <IconUser size={32} color={hasUnread ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-gray-5)'} />
              </Indicator>
            </Center>
            <Text size="sm" fw={500} truncate>{friend.username}</Text>
            {preview && (
              <Text
                size="xs"
                c="blue"
                truncate
                mt={4}
                style={{
                  fontStyle: 'italic',
                  lineHeight: 1.3,
                }}
              >
                &ldquo;{preview}&rdquo;
              </Text>
            )}
          </Paper>
        )
      })}
    </SimpleGrid>
  )
}
