import { useState } from 'react'
import {
  Stack, Text, TextInput, Textarea, SegmentedControl, Paper, Group, Badge,
  ActionIcon, Loader, Center, Button, Switch, Collapse, Divider,
} from '@mantine/core'
import { IconSearch, IconCopy, IconPlus, IconTrash, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import {
  useMyMessageSets, usePublicMessageSets, useCopyMessageSet,
  useCreateMessageSet, useDeleteMessageSet,
  useMessages, useCreateMessage, useDeleteMessage,
} from '../hooks/useMessageSets'
import type { MessageSet } from '../types'

type Tab = 'mine' | 'discover'

export default function SidebarMessageSets() {
  const [tab, setTab] = useState<Tab>('mine')
  const [search, setSearch] = useState('')
  const [mediaFilter, setMediaFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null)

  const { data: mySets = [], isLoading: myLoading } = useMyMessageSets()
  const { data: publicSets = [], isLoading: pubLoading } = usePublicMessageSets({
    tags: search || undefined,
    media_type: mediaFilter === 'all' ? undefined : mediaFilter as 'text' | 'image' | 'gif',
  })
  const copyMutation = useCopyMessageSet()
  const deleteMutation = useDeleteMessageSet()

  const handleCopy = (setId: number) => {
    copyMutation.mutate(setId, {
      onSuccess: () => notifications.show({ title: 'Copied', message: 'Set added to your collection', color: 'green' }),
      onError: () => notifications.show({ title: 'Error', message: 'Failed to copy', color: 'red' }),
    })
  }

  const handleDelete = (setId: number) => {
    deleteMutation.mutate(setId, {
      onSuccess: () => {
        notifications.show({ title: 'Deleted', message: 'Message set removed', color: 'green' })
        if (expandedSetId === setId) setExpandedSetId(null)
      },
      onError: () => notifications.show({ title: 'Error', message: 'Failed to delete', color: 'red' }),
    })
  }

  const toggleExpand = (setId: number) => {
    setExpandedSetId(expandedSetId === setId ? null : setId)
  }

  const loading = tab === 'mine' ? myLoading : pubLoading
  const sets = tab === 'mine' ? mySets : publicSets

  return (
    <Stack gap="sm">
      <SegmentedControl
        size="xs"
        fullWidth
        value={tab}
        onChange={(v) => { setTab(v as Tab); setExpandedSetId(null) }}
        data={[
          { label: 'My Sets', value: 'mine' },
          { label: 'Discover', value: 'discover' },
        ]}
      />

      {tab === 'mine' && (
        <>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
            onClick={() => setShowCreateForm(!showCreateForm)}
            fullWidth
          >
            {showCreateForm ? 'Cancel' : 'New Message Set'}
          </Button>
          <Collapse in={showCreateForm}>
            <CreateSetForm
              onCreated={() => setShowCreateForm(false)}
            />
          </Collapse>
        </>
      )}

      {tab === 'discover' && (
        <>
          <TextInput
            size="xs"
            placeholder="Search by tags..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={14} />}
          />
          <SegmentedControl
            size="xs"
            fullWidth
            value={mediaFilter}
            onChange={setMediaFilter}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Text', value: 'text' },
              { label: 'Image', value: 'image' },
              { label: 'GIF', value: 'gif' },
            ]}
          />
        </>
      )}

      {loading ? (
        <Center py="md"><Loader size="sm" /></Center>
      ) : sets.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          {tab === 'mine' ? 'No sets yet. Create one!' : 'No public sets found.'}
        </Text>
      ) : (
        sets.map((ms) => (
          <div key={ms.id}>
            <SetCard
              set={ms}
              isMine={tab === 'mine'}
              showCopy={tab === 'discover'}
              isExpanded={expandedSetId === ms.id}
              onCopy={() => handleCopy(ms.id)}
              onDelete={() => handleDelete(ms.id)}
              onToggle={() => toggleExpand(ms.id)}
            />
            {tab === 'mine' && (
              <Collapse in={expandedSetId === ms.id}>
                <SetMessages setId={ms.id} />
              </Collapse>
            )}
          </div>
        ))
      )}
    </Stack>
  )
}

// --- Create Message Set Form ---

function CreateSetForm({ onCreated }: { onCreated: () => void }) {
  const createMutation = useCreateMessageSet()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [tagsStr, setTagsStr] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) {
      notifications.show({ title: 'Error', message: 'Name is required', color: 'red' })
      return
    }
    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
    if (tags.length > 5) {
      notifications.show({ title: 'Error', message: 'Maximum 5 tags', color: 'red' })
      return
    }
    createMutation.mutate(
      { name: name.trim(), description: description.trim() || undefined, is_public: isPublic, tags },
      {
        onSuccess: () => {
          notifications.show({ title: 'Created', message: `"${name}" created`, color: 'green' })
          setName(''); setDescription(''); setTagsStr(''); setIsPublic(true)
          onCreated()
        },
        onError: () => notifications.show({ title: 'Error', message: 'Failed to create', color: 'red' }),
      }
    )
  }

  return (
    <Paper p="xs" withBorder>
      <Stack gap="xs">
        <TextInput size="xs" label="Name" placeholder="e.g. Greetings" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
        <Textarea size="xs" label="Description" placeholder="Optional description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} autosize minRows={1} maxRows={3} />
        <TextInput size="xs" label="Tags" placeholder="comma, separated, tags" value={tagsStr} onChange={(e) => setTagsStr(e.currentTarget.value)} />
        <Switch size="xs" label="Public" checked={isPublic} onChange={(e) => setIsPublic(e.currentTarget.checked)} />
        <Button size="xs" onClick={handleSubmit} loading={createMutation.isPending} fullWidth>
          Create Set
        </Button>
      </Stack>
    </Paper>
  )
}

// --- Messages inside a set (expanded view) ---

function SetMessages({ setId }: { setId: number }) {
  const { data: messages = [], isLoading } = useMessages(setId)
  const createMsg = useCreateMessage()
  const deleteMsg = useDeleteMessage()
  const [newContent, setNewContent] = useState('')

  const activeMessages = messages.filter((m) => m.status === 'active')
  const nextOrder = activeMessages.length > 0
    ? Math.max(...activeMessages.map((m) => m.display_order)) + 1
    : 1

  const handleAdd = () => {
    if (!newContent.trim()) return
    createMsg.mutate(
      { setId, content_type: 'text', storage_type: 'inline', content: newContent.trim(), display_order: nextOrder },
      {
        onSuccess: () => {
          setNewContent('')
          notifications.show({ title: 'Added', message: 'Message added', color: 'green' })
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail || 'Failed to add message'
          notifications.show({ title: 'Error', message: detail, color: 'red' })
        },
      }
    )
  }

  if (isLoading) return <Center py="xs"><Loader size="xs" /></Center>

  return (
    <Paper p="xs" ml="xs" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <Stack gap={4}>
        {activeMessages.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center">No messages yet</Text>
        ) : (
          activeMessages.map((m) => (
            <Group key={m.id} gap="xs" wrap="nowrap" justify="space-between">
              <Text size="xs" lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
                {m.display_order}. {m.content}
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => deleteMsg.mutate(m.id)}
              >
                <IconTrash size={12} />
              </ActionIcon>
            </Group>
          ))
        )}
        <Divider my={4} />
        <Group gap="xs" wrap="nowrap">
          <TextInput
            size="xs"
            placeholder="New text message..."
            value={newContent}
            onChange={(e) => setNewContent(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            style={{ flex: 1 }}
          />
          <ActionIcon
            size="sm"
            variant="light"
            onClick={handleAdd}
            loading={createMsg.isPending}
            disabled={!newContent.trim()}
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Group>
        <Text size="xs" c="dimmed">{activeMessages.length}/20 messages</Text>
      </Stack>
    </Paper>
  )
}

// --- Set Card ---

function SetCard({ set, isMine, showCopy, isExpanded, onCopy, onDelete, onToggle }: {
  set: MessageSet
  isMine: boolean
  showCopy: boolean
  isExpanded: boolean
  onCopy: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  return (
    <Paper p="xs" withBorder style={isMine && isExpanded ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : undefined}>
      <Group justify="space-between" wrap="nowrap">
        <div style={{ minWidth: 0, flex: 1, cursor: isMine ? 'pointer' : undefined }} onClick={isMine ? onToggle : undefined}>
          <Group gap={4} wrap="nowrap">
            <Text size="sm" fw={500} truncate style={{ flex: 1 }}>{set.name}</Text>
            {isMine && (
              isExpanded
                ? <IconChevronUp size={14} color="var(--mantine-color-gray-5)" />
                : <IconChevronDown size={14} color="var(--mantine-color-gray-5)" />
            )}
          </Group>
          {set.description && <Text size="xs" c="dimmed" lineClamp={1}>{set.description}</Text>}
          <Group gap={4} mt={2}>
            {set.tags.map((tag) => <Badge key={tag} size="xs" variant="light">{tag}</Badge>)}
            <Badge size="xs" color="gray">{set.message_count ?? 0} msgs</Badge>
          </Group>
        </div>
        <Group gap={4} wrap="nowrap">
          {showCopy && (
            <ActionIcon variant="light" size="sm" onClick={onCopy}>
              <IconCopy size={14} />
            </ActionIcon>
          )}
          {isMine && (
            <ActionIcon variant="light" size="sm" color="red" onClick={onDelete}>
              <IconTrash size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>
    </Paper>
  )
}
