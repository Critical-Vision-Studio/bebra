import { useState, useCallback, useRef } from 'react'
import { LoadingOverlay, Text, Stack, Paper, Group, Badge, ActionIcon, SegmentedControl, TextInput, Loader, Center } from '@mantine/core'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { logoutUser } from '../api/auth'
import { markAsRead } from '../api/friendships'
import { useCurrentUser } from '../hooks/useAuth'
import { useFriends, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest } from '../hooks/useFriends'
import { useFriendshipUsedSets, useSendMessage, useUnreadFriendships } from '../hooks/useFriendship'
import { useMyMessageSets, usePublicMessageSets, useMessages } from '../hooks/useMessageSets'
import { useWebSocket } from '../hooks/useWebSocket'
import type { WsNewMessage } from '../hooks/useWebSocket'
import TopBar from '../components/TopBar'
import LeftSidebar, { type SidebarView } from '../components/LeftSidebar'
import FriendRequests from '../components/FriendRequests'
import UserSearch from '../components/UserSearch'
import FriendGrid from '../components/FriendGrid'
import FriendOverlay from '../components/FriendOverlay'
import { CircularMessageSets } from '../components/CircularMessageSets'
import { CircularMessages } from '../components/CircularMessages'
import SidebarMessageSets from '../components/SidebarMessageSets'
import SidebarHistory from '../components/SidebarHistory'
import SettingsModal from '../components/SettingsModal'
import type { FriendUser, MessageSet, Message, ConversationMessage } from '../types'

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
  const [browsing, setBrowsing] = useState(false)
  const [settingsOpened, setSettingsOpened] = useState(false)

  const [avatarOrigin, setAvatarOrigin] = useState<DOMRect | null>(null)
  const [overlayAnimKey, setOverlayAnimKey] = useState(0)

  const [unreadPreviews, setUnreadPreviews] = useState<Record<number, string>>({})
  const [highlightMessageIds, setHighlightMessageIds] = useState<Set<number>>(new Set())

  const friendsRef = useRef(friends)
  friendsRef.current = friends

  // --- WebSocket ---
  useWebSocket({
    onMessage: (event) => {
      if (event.type !== 'new_message') return
      const msg = (event as WsNewMessage).data
      const friendshipId = msg.friendship_id

      queryClient.setQueryData<ConversationMessage[]>(
        ['conversationHistory', friendshipId],
        (old) => {
          if (!old) return old
          if (old.some((m) => m.id === msg.id)) return old
          return [msg, ...old]
        }
      )
      queryClient.invalidateQueries({ queryKey: ['conversationHistory', friendshipId] })
      queryClient.invalidateQueries({ queryKey: ['unreadFriendships'] })
      queryClient.invalidateQueries({ queryKey: ['friendshipUsedSets', friendshipId] })

      const preview = msg.message?.content_type === 'text'
        ? msg.message.content.slice(0, 30)
        : msg.message?.content_type ?? 'message'
      setUnreadPreviews((prev) => ({ ...prev, [friendshipId]: preview }))
      setHighlightMessageIds((prev) => new Set(prev).add(msg.id))

      const senderName = friendsRef.current.find((f) => f.friendship_id === friendshipId)?.username ?? 'Someone'
      notifications.show({ title: `New message from ${senderName}`, message: preview, color: 'blue', autoClose: 4000 })
    },
  })

  // --- Data for selected friendship ---
  const { data: usedSets = [] } = useFriendshipUsedSets(selectedFriendshipId)
  const { data: messages = [] } = useMessages(selectedSet?.id ?? null)
  const { data: mySets = [] } = useMyMessageSets()
  const sendMsg = useSendMessage()

  // --- Handlers ---
  const handleLogout = async () => {
    try { await logoutUser() } catch { /* ignore */ }
    onLogout()
  }

  const handleFriendClick = (friend: FriendUser, avatarRect: DOMRect) => {
    setAvatarOrigin(avatarRect)
    setOverlayAnimKey((k) => k + 1)
    setSelectedFriend(friend)
    setSelectedSet(null)
    setBrowsing(false)
    setSelectedFriendshipId(friend.friendship_id)

    setUnreadPreviews((prev) => {
      const next = { ...prev }
      delete next[friend.friendship_id]
      return next
    })

    if (unreadFriendshipIds.includes(friend.friendship_id)) {
      markAsRead(friend.friendship_id)
        .then(() => queryClient.invalidateQueries({ queryKey: ['unreadFriendships'] }))
        .catch(() => {})
    }
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
          notifications.show({ title: 'Error', message: err?.response?.data?.detail || 'Failed to send message', color: 'red' })
        },
      }
    )
  }

  const handleGoBack = useCallback(() => {
    if (selectedSet) {
      setSelectedSet(null)
    } else if (browsing) {
      setBrowsing(false)
    } else if (selectedFriend) {
      setSelectedFriend(null)
      setSelectedSet(null)
      setBrowsing(false)
      setSelectedFriendshipId(null)
    }
  }, [selectedSet, browsing, selectedFriend])

  // --- Sidebar ---
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
        return (
          <SidebarHistory
            friendshipId={selectedFriendshipId}
            friendName={selectedFriend?.username ?? null}
            currentUserId={currentUser?.id ?? 0}
            highlightMessageIds={highlightMessageIds}
            onHighlightsDone={() => setHighlightMessageIds(new Set())}
          />
        )
      default:
        return null
    }
  }

  const renderOverlayBody = () => {
    if (!selectedFriend) return null

    // Level 3: viewing messages inside a selected set
    if (selectedSet) {
      return (
        <CircularMessages
          messages={messages.filter((m) => m.status === 'active')}
          onSelectMessage={handleSelectMessage}
          radius={260}
        />
      )
    }

    // Level 2: browsing for new sets
    if (browsing) {
      return (
        <Paper p="sm" withBorder style={{ width: '100%', maxWidth: 400 }} radius="md">
          <Text size="sm" fw={500} mb="xs">Pick a set to use</Text>
          <SetPicker
            mySets={mySets}
            currentUserId={currentUser?.id ?? 0}
            onPick={(set) => { setSelectedSet(set); setBrowsing(false) }}
          />
        </Paper>
      )
    }

    // Level 1: show used-sets circle
    if (usedSets.length > 0) {
      return (
        <CircularMessageSets
          messageSets={usedSets}
          onSelectSet={(set) => setSelectedSet(set)}
          onBrowse={() => setBrowsing(true)}
          radius={180}
        />
      )
    }

    // Empty state: no used sets yet — show browser directly
    return (
      <Stack align="center" gap="sm" style={{ width: '100%', maxWidth: 400 }}>
        <Text size="sm" c="white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          Pick a message set to start chatting!
        </Text>
        <Paper p="sm" withBorder style={{ width: '100%' }} radius="md">
          <SetPicker
            mySets={mySets}
            currentUserId={currentUser?.id ?? 0}
            onPick={(set) => setSelectedSet(set)}
          />
        </Paper>
      </Stack>
    )
  }

  if (userLoading) return <LoadingOverlay visible />

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

        <div style={{ flex: 1, overflow: 'auto', background: 'var(--mantine-color-gray-0)', position: 'relative' }}>
          <Stack gap="md" p="md">
            <Text size="lg" fw={600}>Friends</Text>
            <FriendGrid
              friends={friends}
              selectedFriend={selectedFriend}
              onFriendClick={handleFriendClick}
              unreadFriendshipIds={unreadFriendshipIds}
              unreadPreviews={unreadPreviews}
            />
          </Stack>

          <FriendOverlay
            friend={selectedFriend}
            originRect={avatarOrigin}
            animKey={overlayAnimKey}
            subtitle={selectedSet?.name ?? (browsing ? 'Browse sets' : undefined)}
            stackContent={!selectedSet && (browsing || usedSets.length === 0)}
            onGoBack={handleGoBack}
          >
            {renderOverlayBody()}
          </FriendOverlay>
        </div>
      </div>
      <SettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} />
    </div>
  )
}

function SetPicker({ mySets, currentUserId, onPick }: {
  mySets: MessageSet[]
  currentUserId: number
  onPick: (set: MessageSet) => void
}) {
  const [source, setSource] = useState<'public' | 'mine'>('public')
  const [search, setSearch] = useState('')

  const { data: publicSets = [], isLoading: pubLoading } = usePublicMessageSets({
    tags: search || undefined,
  })

  const isPublic = source === 'public'
  const mySetIds = new Set(mySets.map((s) => s.id))
  const sets = isPublic
    ? publicSets.filter((s) => !mySetIds.has(s.id))
    : mySets

  return (
    <Stack gap={4} mt="xs">
      <SegmentedControl
        size="xs"
        fullWidth
        value={source}
        onChange={(v) => setSource(v as 'public' | 'mine')}
        data={[
          { label: 'Public Sets', value: 'public' },
          { label: 'My Sets', value: 'mine' },
        ]}
      />

      {isPublic && (
        <TextInput
          size="xs"
          placeholder="Search by tags..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IconSearch size={14} />}
        />
      )}

      {isPublic && pubLoading ? (
        <Center py="xs"><Loader size="xs" /></Center>
      ) : sets.length === 0 ? (
        <Text size="xs" c="dimmed">
          {isPublic ? 'No public sets found.' : 'No sets yet. Create one in the Sets tab.'}
        </Text>
      ) : (
        sets.map((s) => (
          <Paper key={s.id} p="xs" withBorder style={{ cursor: 'pointer' }} onClick={() => onPick(s)}>
            <Group justify="space-between" wrap="nowrap">
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text size="xs" fw={500} truncate>{s.name}</Text>
                <Group gap={4}>
                  {s.tags.map((tag) => <Badge key={tag} size="xs" variant="light">{tag}</Badge>)}
                  <Badge size="xs" color="gray">{s.message_count ?? 0} msgs</Badge>
                </Group>
              </div>
              <ActionIcon size="sm" variant="light" color="green">
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          </Paper>
        ))
      )}
    </Stack>
  )
}
