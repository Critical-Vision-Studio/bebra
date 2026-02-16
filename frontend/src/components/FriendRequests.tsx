import { Stack, Text, Group, Button, Paper, Badge } from '@mantine/core'
import type { FriendshipRequest } from '../types'

interface FriendRequestsProps {
  requests: FriendshipRequest[]
  currentUserId: number
  onAccept: (requestId: number) => void
  onReject: (requestId: number) => void
}

export default function FriendRequests({ requests, currentUserId, onAccept, onReject }: FriendRequestsProps) {
  const pending = requests.filter((r) => r.status === 'pending')
  const incoming = pending.filter((r) => r.receiver_id === currentUserId && r.request_type === 'normal')
  const outgoing = pending.filter((r) => r.sender_id === currentUserId && r.request_type === 'normal')
  const tinder = pending.filter((r) => r.receiver_id === currentUserId && r.request_type === 'tinder')

  return (
    <Stack gap="md">
      <Section title="Incoming" count={incoming.length}>
        {incoming.map((req) => (
          <RequestCard key={req.id} label={`User #${req.sender_id}`} date={req.created_at} onAccept={() => onAccept(req.id)} onReject={() => onReject(req.id)} />
        ))}
      </Section>

      <Section title="Outgoing" count={outgoing.length}>
        {outgoing.map((req) => (
          <Paper key={req.id} p="xs" withBorder>
            <Text size="sm">To User #{req.receiver_id} — <Text span c="dimmed">pending</Text></Text>
          </Paper>
        ))}
      </Section>

      <Section title="Tinder-Bother" count={tinder.length}>
        {tinder.map((req) => (
          <RequestCard key={req.id} label={`User #${req.sender_id}`} date={req.created_at} badge="tinder" onAccept={() => onAccept(req.id)} onReject={() => onReject(req.id)} />
        ))}
      </Section>
    </Stack>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" fw={600}>{title}</Text>
        <Badge size="sm" variant="light">{count}</Badge>
      </Group>
      {count === 0 ? <Text size="xs" c="dimmed">None</Text> : children}
    </Stack>
  )
}

function RequestCard({ label, date, badge, onAccept, onReject }: {
  label: string
  date: string
  badge?: string
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <Paper p="xs" withBorder>
      <Group justify="space-between" mb={4}>
        <Group gap="xs">
          <Text size="sm" fw={500}>{label}</Text>
          {badge && <Badge size="xs" color="pink">{badge}</Badge>}
        </Group>
        <Text size="xs" c="dimmed">{new Date(date).toLocaleDateString()}</Text>
      </Group>
      <Group gap="xs">
        <Button size="compact-xs" color="green" onClick={onAccept}>Accept</Button>
        <Button size="compact-xs" color="red" variant="light" onClick={onReject}>Reject</Button>
      </Group>
    </Paper>
  )
}
