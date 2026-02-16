import { useState } from 'react'
import { TextInput, Group, Button, Paper, Text, Stack } from '@mantine/core'
import { IconSearch, IconUserPlus } from '@tabler/icons-react'
import { getUsers } from '../api/mainAPI'
import type { User } from '../types'

interface UserSearchProps {
  onSendRequest: (userId: number) => void
}

export default function UserSearch({ onSendRequest }: UserSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      setResults(await getUsers(query))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <TextInput
          flex={1}
          size="xs"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          leftSection={<IconSearch size={14} />}
        />
        <Button size="xs" onClick={handleSearch} loading={loading}>Search</Button>
      </Group>

      {results.length > 0 && (
        <Paper withBorder p={0} mah={200} style={{ overflow: 'auto' }}>
          {results.map((user) => (
            <Group key={user.id} justify="space-between" px="xs" py={4} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <Text size="sm">{user.username}</Text>
              <Button size="compact-xs" variant="light" color="green" leftSection={<IconUserPlus size={14} />} onClick={() => onSendRequest(user.id)}>
                Add
              </Button>
            </Group>
          ))}
        </Paper>
      )}
    </Stack>
  )
}
