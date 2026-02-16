import { useState } from 'react'
import { LoadingOverlay, Text, Stack, Button, Paper, Group, Badge, ActionIcon, Collapse } from '@mantine/core'
import { IconPlus, IconTrash, IconArrowLeft } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { logoutUser } from '../api/auth'
import { useCurrentUser } from '../hooks/useAuth'
import { useFriends, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest } from '../hooks/useFriends'
import { useFriendshipMessageSets, useAddFriendshipMessageSet, useRemoveFriendshipMessageSet, useSendMessage } from '../hooks/useFriendship'
import { useMyMessageSets, useMessages } from '../hooks/useMessageSets'
import TopBar from '../components/TopBar'
import LeftSidebar, { type SidebarView } from '../components/LeftSidebar'
import FriendRequests from '../components/FriendRequests'
import UserSearch from '../components/UserSearch'
import FriendGrid from '../components/FriendGrid'
import { CircularMessageSets } from '../components/CircularMessageSets'
import { CircularMessages } from '../components/CircularMessages'
import SidebarMessageSets from '../components/SidebarMessageSets'
import SidebarHistory from '../components/SidebarHistory'
import SidebarSettings from '../components/SidebarSettings'
import type { FriendUser, MessageSet, Message } from '../types'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser()
  const { data: friends = [] } = useFriends()
  const { data: requests = [] } = useFriendRequests()

  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const rejectRequest = useRejectFriendRequest()

  const [sidebarView, setSidebarView] = useState<SidebarView>('friends')
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null)
  const [selectedFriendshipId, setSelectedFriendshipId] = useState<number | null>(null)
  const [selectedSet, setSelectedSet] = useState<MessageSet | null>(null)
  const [showAddSet, setShowAddSet] = useState(false)

  // Fetch message sets for selected friendship
  const { data: friendshipSets = [] } = useFriendshipMessageSets(selectedFriendshipId)
  // Fetch messages for selected set
  const { data: messages = [] } = useMessages(selectedSet?.id ?? null)
  // Fetch user's own sets for the picker
  const { data: mySets = [] } = useMyMessageSets()

  const addFms = useAddFriendshipMessageSet()
  const removeFms = useRemoveFriendshipMessageSet()
  const sendMsg = useSendMessage()

  const handleLogout = async () => {
    try { await logoutUser() } catch { /* ignore */ }
    onLogout()
  }

  const handleFriendClick = (friend: FriendUser) => {
    setSelectedFriend(friend)
    setSelectedSet(null)
    setShowAddSet(false)
    setSelectedFriendshipId(friend.friendship_id)
  }

  const handleSelectSet = (set: MessageSet) => {
    setSelectedSet(set)
  }

  const handleSelectMessage = (message: Message) => {
    if (!selectedFriendshipId) {
      notifications.show({ title: 'Cannot send', message: 'Friendship not resolved yet', color: 'yellow' })
      return
    }
    sendMsg.mutate(
      { friendshipId: selectedFriendshipId, messageId: message.id },
      {
        onSuccess: () => {
          const preview = message.content_type === 'text' ? message.content.slice(0, 30) : message.content_type
          notifications.show({ title: 'Sent!', message: `"${preview}" sent to ${selectedFriend?.username}`, color: 'green' })
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail || 'Failed to send message'
          notifications.show({ title: 'Error', message: detail, color: 'red' })
        },
      }
    )
  }

  const handleBackToSets = () => {
    setSelectedSet(null)
  }

  const handleAddSetToFriendship = (messageSetId: number) => {
    if (!selectedFriendshipId) return
    addFms.mutate(
      { friendshipId: selectedFriendshipId, messageSetId },
      {
        onSuccess: () => {
          notifications.show({ title: 'Added', message: 'Message set assigned to friendship', color: 'green' })
          setShowAddSet(false)
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail || 'Failed to add'
          notifications.show({ title: 'Error', message: detail, color: 'red' })
        },
      }
    )
  }

  const handleRemoveSetFromFriendship = (fmsId: number) => {
    if (!selectedFriendshipId) return
    removeFms.mutate(
      { friendshipId: selectedFriendshipId, fmsId },
      {
        onSuccess: () => notifications.show({ title: 'Removed', message: 'Message set removed from friendship', color: 'green' }),
        onError: () => notifications.show({ title: 'Error', message: 'Failed to remove', color: 'red' }),
      }
    )
  }

  if (userLoading) {
    return <LoadingOverlay visible />
  }

  const messageSetsForCircle = friendshipSets.map((fms) => fms.message_set).filter(Boolean) as MessageSet[]
  const assignedSetIds = new Set(friendshipSets.map((fms) => fms.message_set_id))
  const availableSets = mySets.filter((s) => !assignedSetIds.has(s.id))
  const canAddMore = friendshipSets.length < 8

  const renderSidebarContent = () => {
    switch (sidebarView) {
      case 'friends':
        return (
          <Stack gap="md">
            <UserSearch onSendRequest={(id) => sendRequest.mutate({ receiverId: id })} />
            <FriendRequests
              requests={requests}
              currentUserId={currentUser?.id ?? 0}
              onAccept={(id) => acceptRequest.mutate(id)}
              onReject={(id) => rejectRequest.mutate(id)}
            />
          </Stack>
        )
      case 'message-sets':
        return <SidebarMessageSets />
      case 'history':
        return <SidebarHistory friendshipId={selectedFriendshipId} friendName={selectedFriend?.username ?? null} />
      case 'settings':
        return <SidebarSettings />
      default:
        return null
    }
  }

  const renderMainContent = () => {
    if (!selectedFriend) {
      return (
        <Stack gap="md" p="md">
          <Text size="lg" fw={600}>Friends</Text>
          <FriendGrid friends={friends} selectedFriend={selectedFriend} onFriendClick={handleFriendClick} />
        </Stack>
      )
    }

    // Friend is selected
    return (
      <Stack gap="md" p="md" align="center">
        <Text size="lg" fw={600}>{selectedFriend.username}</Text>

        {selectedSet ? (
          // Viewing messages in a set
          <Stack align="center" gap="sm">
            <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={handleBackToSets}>
              <IconArrowLeft size={12} style={{ verticalAlign: 'middle' }} /> Back to sets
            </Text>
            <Text size="sm" fw={500}>{selectedSet.name}</Text>
            <CircularMessages
              messages={messages.filter((m) => m.status === 'active')}
              onSelectMessage={handleSelectMessage}
              radius={220}
            />
          </Stack>
        ) : messageSetsForCircle.length > 0 ? (
          // Showing assigned sets in circle + management
          <Stack align="center" gap="sm" style={{ width: '100%', maxWidth: 600 }}>
            <CircularMessageSets
              messageSets={messageSetsForCircle}
              onSelectSet={handleSelectSet}
              radius={180}
            />

            {/* Assigned sets list with remove buttons */}
            <Paper p="sm" withBorder style={{ width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Assigned sets ({friendshipSets.length}/8)</Text>
                {canAddMore && (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => setShowAddSet(!showAddSet)}
                  >
                    Add
                  </Button>
                )}
              </Group>
              {friendshipSets.map((fms) => (
                <Group key={fms.id} justify="space-between" wrap="nowrap" mb={4}>
                  <Text size="xs" truncate style={{ flex: 1 }}>
                    {fms.position}. {fms.message_set?.name ?? `Set #${fms.message_set_id}`}
                    <Badge size="xs" ml={4} color="gray">{fms.message_set?.message_count ?? 0} msgs</Badge>
                  </Text>
                  <ActionIcon size="xs" variant="subtle" color="red" onClick={() => handleRemoveSetFromFriendship(fms.id)}>
                    <IconTrash size={12} />
                  </ActionIcon>
                </Group>
              ))}
              <Collapse in={showAddSet}>
                <SetPicker sets={availableSets} onPick={handleAddSetToFriendship} loading={addFms.isPending} />
              </Collapse>
            </Paper>
          </Stack>
        ) : (
          // No sets assigned yet
          <Stack align="center" gap="sm" style={{ width: '100%', maxWidth: 400 }}>
            <Text size="sm" c="dimmed">No message sets assigned to this friendship yet.</Text>
            {mySets.length > 0 ? (
              <Paper p="sm" withBorder style={{ width: '100%' }}>
                <Text size="sm" fw={500} mb="xs">Add a message set:</Text>
                <SetPicker sets={availableSets} onPick={handleAddSetToFriendship} loading={addFms.isPending} />
              </Paper>
            ) : (
              <Text size="sm" c="dimmed">
                You have no message sets. Go to the <strong>Sets</strong> tab to create one first.
              </Text>
            )}
          </Stack>
        )}

        <Text
          size="xs"
          c="blue"
          style={{ cursor: 'pointer' }}
          onClick={() => { setSelectedFriend(null); setSelectedSet(null); setShowAddSet(false) }}
        >
          Back to all friends
        </Text>
      </Stack>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        username={currentUser?.username ?? ''}
        onLogout={handleLogout}
        onSettingsClick={() => setSidebarView('settings')}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftSidebar activeView={sidebarView} onViewChange={setSidebarView}>
          {renderSidebarContent()}
        </LeftSidebar>
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--mantine-color-gray-0)' }}>
          {renderMainContent()}
        </div>
      </div>
    </div>
  )
}

// --- Picker for choosing a message set to assign ---

function SetPicker({ sets, onPick, loading }: { sets: MessageSet[]; onPick: (id: number) => void; loading: boolean }) {
  if (sets.length === 0) {
    return <Text size="xs" c="dimmed">No more sets available. Create more in the Sets tab.</Text>
  }

  return (
    <Stack gap={4} mt="xs">
      {sets.map((s) => (
        <Paper key={s.id} p="xs" withBorder style={{ cursor: 'pointer' }} onClick={() => !loading && onPick(s.id)}>
          <Group justify="space-between" wrap="nowrap">
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text size="xs" fw={500} truncate>{s.name}</Text>
              <Group gap={4}>
                {s.tags.map((tag) => <Badge key={tag} size="xs" variant="light">{tag}</Badge>)}
                <Badge size="xs" color="gray">{s.message_count ?? 0} msgs</Badge>
              </Group>
            </div>
            <ActionIcon size="sm" variant="light" color="green" loading={loading}>
              <IconPlus size={14} />
            </ActionIcon>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}
