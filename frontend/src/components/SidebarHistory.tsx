import { useEffect, useRef } from 'react'
import { Text, Stack, Paper, Group, Center, Loader } from '@mantine/core'
import { useConversationHistory } from '../hooks/useFriendship'

interface SidebarHistoryProps {
  friendshipId: number | null
  friendName: string | null
  highlightMessageIds?: Set<number>
  onHighlightsDone?: () => void
}

export default function SidebarHistory({ friendshipId, friendName, highlightMessageIds, onHighlightsDone }: SidebarHistoryProps) {
  const { data: messages = [], isLoading } = useConversationHistory(friendshipId)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasHighlights = highlightMessageIds && highlightMessageIds.size > 0

  // Auto-clear highlights after the animation finishes
  useEffect(() => {
    if (!hasHighlights) return
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => {
      onHighlightsDone?.()
    }, 3500)
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
    }
  }, [hasHighlights, onHighlightsDone])

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
      <style>{`
        @keyframes msgHighlight {
          0%   { background-color: var(--mantine-color-blue-1); }
          70%  { background-color: var(--mantine-color-blue-1); }
          100% { background-color: transparent; }
        }
      `}</style>
      <Text size="sm" fw={600}>History with {friendName}</Text>
      {[...grouped.entries()].map(([date, msgs]) => (
        <Stack key={date} gap={4}>
          <Text size="xs" c="dimmed" fw={600}>{date}</Text>
          {msgs.map((msg) => {
            const isHighlighted = highlightMessageIds?.has(msg.id) ?? false
            return (
              <Paper
                key={msg.id}
                p="xs"
                withBorder
                style={isHighlighted ? {
                  animation: 'msgHighlight 3s ease-out forwards',
                  borderColor: 'var(--mantine-color-blue-3)',
                } : undefined}
              >
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
            )
          })}
        </Stack>
      ))}
    </Stack>
  )
}
