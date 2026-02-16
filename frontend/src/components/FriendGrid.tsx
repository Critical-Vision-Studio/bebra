import { SimpleGrid, Paper, Text, Center } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import type { FriendUser } from '../types'

interface FriendGridProps {
  friends: FriendUser[]
  selectedFriend: FriendUser | null
  onFriendClick: (friend: FriendUser) => void
}

export default function FriendGrid({ friends, selectedFriend, onFriendClick }: FriendGridProps) {
  if (friends.length === 0) {
    return (
      <Center h={200}>
        <Text c="dimmed">No friends yet. Search and add some!</Text>
      </Center>
    )
  }

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
      {friends.map((friend) => {
        const selected = selectedFriend?.id === friend.id
        return (
          <Paper
            key={friend.id}
            p="md"
            withBorder
            shadow={selected ? 'md' : undefined}
            onClick={() => onFriendClick(friend)}
            style={{
              cursor: 'pointer',
              borderColor: selected ? 'var(--mantine-color-blue-5)' : undefined,
              textAlign: 'center',
              transition: 'border-color 0.15s',
            }}
          >
            <Center mb={4}>
              <IconUser size={32} color="var(--mantine-color-gray-5)" />
            </Center>
            <Text size="sm" fw={500} truncate>{friend.username}</Text>
          </Paper>
        )
      })}
    </SimpleGrid>
  )
}
