import { useState, useCallback, useRef } from 'react'
import { LoadingOverlay, Text, Stack, Button, Paper, Group, Badge, ActionIcon, Collapse, Overlay, Box, Transition } from '@mantine/core'
import { IconPlus, IconTrash, IconArrowLeft } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { logoutUser } from '../api/auth'
import { markAsRead } from '../api/friendships'
import { useCurrentUser } from '../hooks/useAuth'
import { useFriends, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest } from '../hooks/useFriends'
import { useFriendshipMessageSets, useAddFriendshipMessageSet, useRemoveFriendshipMessageSet, useSendMessage, useUnreadFriendships } from '../hooks/useFriendship'
import { useMyMessageSets, useMessages } from '../hooks/useMessageSets'
import { useWebSocket } from '../hooks/useWebSocket'
import type { WsNewMessage } from '../hooks/useWebSocket'
import TopBar from '../components/TopBar'
import LeftSidebar, { type SidebarView } from '../components/LeftSidebar'
import FriendRequests from '../components/FriendRequests'
import UserSearch from '../components/UserSearch'
import FriendGrid from '../components/FriendGrid'
import { CircularMessageSets } from '../components/CircularMessageSets'
import { CircularMessages } from '../components/CircularMessages'
import SidebarMessageSets from '../components/SidebarMessageSets'
import SidebarHistory from '../components/SidebarHistory'
import SettingsModal from '../components/SettingsModal'
import type { FriendUser, MessageSet, Message, ConversationMessage } from '../types'

type FriendsOverlayLevel = 'none' | 'friend' | 'messages'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser()
  const { data: friends = [] } = useFriends()
  const { data: requests = [] } = useFriendRequests()
  const { data: unreadFriendshipIds = [] } = useUnreadFriendships()
  const queryClient = useQueryClient()

  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const rejectRequest = useRejectFriendRequest()

  const [sidebarView, setSidebarView] = useState<SidebarView>('friends')
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null)
  const [selectedFriendshipId, setSelectedFriendshipId] = useState<number | null>(null)
  const [selectedSet, setSelectedSet] = useState<MessageSet | null>(null)
  const [showAddSet, setShowAddSet] = useState(false)
  const [settingsOpened, setSettingsOpened] = useState(false)

  // Tracks the last unread message preview per friendship (shown on friend icons)
  const [unreadPreviews, setUnreadPreviews] = useState<Record<number, string>>({})
  // Tracks message IDs received via WS that should flash-highlight in history
  const [highlightMessageIds, setHighlightMessageIds] = useState<Set<number>>(new Set())

  // Keep refs so the WS callback always sees latest state without re-creating
  const friendsRef = useRef(friends)
  friendsRef.current = friends

  // Real-time WebSocket connection
  useWebSocket({
    onMessage: (event) => {
      if (event.type === 'new_message') {
        const msg = (event as WsNewMessage).data
        const friendshipId = msg.friendship_id

        // Fix 1: Directly inject message into the conversation history cache
        queryClient.setQueryData<ConversationMessage[]>(
          ['conversationHistory', friendshipId],
          (old) => {
            if (!old) return old
            if (old.some((m) => m.id === msg.id)) return old
            return [msg, ...old]
          }
        )
        // Also invalidate so any stale/missing caches refresh on next mount
        queryClient.invalidateQueries({ queryKey: ['conversationHistory', friendshipId] })
        // Refresh unread badge data
        queryClient.invalidateQueries({ queryKey: ['unreadFriendships'] })

        // Fix 2: Store message preview for the friend icon
        const preview = msg.message?.content_type === 'text'
          ? msg.message.content.slice(0, 30)
          : msg.message?.content_type ?? 'message'
        setUnreadPreviews((prev) => ({ ...prev, [friendshipId]: preview }))

        // Fix 3: Track this message ID for highlight animation in history
        setHighlightMessageIds((prev) => new Set(prev).add(msg.id))

        // Find sender username for the toast
        const senderFriend = friendsRef.current.find(
          (f) => f.friendship_id === friendshipId
        )
        const senderName = senderFriend?.username ?? `User #${msg.sender_id}`

        notifications.show({
          title: `New message from ${senderName}`,
          message: preview,
          color: 'blue',
          autoClose: 4000,
        })
      }
    },
  })

  const overlayLevel: FriendsOverlayLevel = selectedFriend
    ? selectedSet ? 'messages' : 'friend'
    : 'none'

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

    // Clear the preview badge for this friend
    setUnreadPreviews((prev) => {
      const next = { ...prev }
      delete next[friend.friendship_id]
      return next
    })

    // Mark conversation as read if it had unread messages
    if (unreadFriendshipIds.includes(friend.friendship_id)) {
      markAsRead(friend.friendship_id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['unreadFriendships'] })
      }).catch(() => { /* ignore */ })
    }
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

  const handleGoBack = useCallback(() => {
    if (selectedSet) {
      setSelectedSet(null)
    } else if (selectedFriend) {
      setSelectedFriend(null)
      setSelectedSet(null)
      setShowAddSet(false)
      setSelectedFriendshipId(null)
    }
  }, [selectedSet, selectedFriend])

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
        return <SidebarHistory friendshipId={selectedFriendshipId} friendName={selectedFriend?.username ?? null} highlightMessageIds={highlightMessageIds} onHighlightsDone={() => setHighlightMessageIds(new Set())} />
      default:
        return null
    }
  }

  const renderOverlayContent = () => {
    if (!selectedFriend) return null

    if (selectedSet) {
      return (
        <Stack align="center" gap="sm">
          <Text size="lg" fw={600} c="white">{selectedFriend.username}</Text>
          <Text size="md" fw={500} c="white">{selectedSet.name}</Text>
          <CircularMessages
            messages={messages.filter((m) => m.status === 'active')}
            onSelectMessage={handleSelectMessage}
            radius={220}
          />
        </Stack>
      )
    }

    return (
      <Stack align="center" gap="sm" style={{ width: '100%', maxWidth: 600 }}>
        <Text size="lg" fw={600} c="white">{selectedFriend.username}</Text>

        {messageSetsForCircle.length > 0 ? (
          <>
            <CircularMessageSets
              messageSets={messageSetsForCircle}
              onSelectSet={handleSelectSet}
              radius={180}
            />

            <Paper p="sm" withBorder style={{ width: '100%', maxWidth: 400 }} radius="md">
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
          </>
        ) : (
          <Stack align="center" gap="sm" style={{ width: '100%', maxWidth: 400 }}>
            <Text size="sm" c="dimmed">No message sets assigned to this friendship yet.</Text>
            {mySets.length > 0 ? (
              <Paper p="sm" withBorder style={{ width: '100%' }} radius="md">
                <Text size="sm" fw={500} mb="xs">Add a message set:</Text>
                <SetPicker sets={availableSets} onPick={handleAddSetToFriendship} loading={addFms.isPending} />
              </Paper>
            ) : (
              <Text size="sm" c="white">
                You have no message sets. Go to the <strong>Sets</strong> tab to create one first.
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        username={currentUser?.username ?? ''}
        onLogout={handleLogout}
        onSettingsClick={() => setSettingsOpened(true)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftSidebar activeView={sidebarView} onViewChange={setSidebarView}>
          {renderSidebarContent()}
        </LeftSidebar>

        {/* Main content area: FriendGrid always visible */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--mantine-color-gray-0)', position: 'relative' }}>
          <Stack gap="md" p="md">
            <Text size="lg" fw={600}>Friends</Text>
            <FriendGrid friends={friends} selectedFriend={selectedFriend} onFriendClick={handleFriendClick} unreadFriendshipIds={unreadFriendshipIds} unreadPreviews={unreadPreviews} />
          </Stack>

          {/* Overlay: blurred/shadowed backdrop + centered content */}
          <Transition mounted={overlayLevel !== 'none'} transition="fade" duration={200}>
            {(transitionStyles) => (
              <Box
                style={{
                  ...transitionStyles,
                  position: 'absolute',
                  inset: 0,
                  zIndex: 100,
                }}
              >
                {/* Clickable backdrop: blur + shadow */}
                <Overlay
                  backgroundOpacity={0.45}
                  blur={4}
                  onClick={handleGoBack}
                  zIndex={100}
                />

                {/* Back arrow on the left side */}
                <ActionIcon
                  variant="filled"
                  color="white"
                  size={56}
                  radius="xl"
                  onClick={handleGoBack}
                  style={{
                    position: 'absolute',
                    left: 24,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 102,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    color: '#333',
                  }}
                  aria-label="Go back"
                >
                  <IconArrowLeft size={28} />
                </ActionIcon>

                {/* Centered overlay content */}
                <Box
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 101,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {renderOverlayContent()}
                  </Box>
                </Box>
              </Box>
            )}
          </Transition>
        </div>
      </div>
      <SettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} />
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
