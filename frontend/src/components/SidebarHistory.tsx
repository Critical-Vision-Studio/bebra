import { Text, Stack, Paper, Group, Center, Loader } from '@mantine/core'
import { useConversationHistory } from '../hooks/useFriendship'

interface SidebarHistoryProps {
  friendshipId: number | null
  friendName: string | null
}

export default function SidebarHistory({ friendshipId, friendName }: SidebarHistoryProps) {
  const { data: messages = [], isLoading } = useConversationHistory(friendshipId)

  if (!friendshipId) {
    return <Text size="sm" c="dimmed" ta="center" py="md">Select a friend to view chat history.</Text>
  }

  if (isLoading) {
    return <Center py="md"><Loader size="sm" /></Center>
  }

  if (messages.length === 0) {
    return <Text size="sm" c="dimmed" ta="center" py="md">No messages yet with {friendName}.</Text>
  }

  // Group by date
  const grouped = new Map<string, typeof messages>()
  for (const msg of messages) {
    const day = new Date(msg.sent_at).toLocaleDateString()
    if (!grouped.has(day)) grouped.set(day, [])
    grouped.get(day)!.push(msg)
  }

  return (
    <Stack gap="sm">
      <Text size="sm" fw={600}>History with {friendName}</Text>
      {[...grouped.entries()].map(([date, msgs]) => (
        <Stack key={date} gap={4}>
          <Text size="xs" c="dimmed" fw={600}>{date}</Text>
          {msgs.map((msg) => (
            <Paper key={msg.id} p="xs" withBorder>
              <Group justify="space-between">
                <Text size="xs" fw={500}>
                  {msg.sender_id === msg.receiver_id ? 'You' : `#${msg.sender_id}`}
                </Text>
                <Text size="xs" c="dimmed">{new Date(msg.sent_at).toLocaleTimeString()}</Text>
              </Group>
              {msg.message && (
                <Text size="xs" mt={2}>
                  {msg.message.content_type === 'text'
                    ? msg.message.content
                    : `[${msg.message.content_type}]`}
                </Text>
              )}
            </Paper>
          ))}
        </Stack>
      ))}
    </Stack>
  )
}
