import { useState, useEffect } from 'react'
import { getMe, logoutUser } from '../api/auth'
import { getFriends, getFriendRequests, getInteractions, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '../api/mainAPI'
import type { User, FriendshipRequest, Interaction } from '../types'
import UserSearch from '../components/UserSearch'
import FriendGrid from '../components/FriendGrid'
import FriendRequests from '../components/FriendRequests'
import BotherList from '../components/BotherList'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [friends, setFriends] = useState<User[]>([])
  const [requests, setRequests] = useState<FriendshipRequest[]>([])
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [user, friendsList, requestsList] = await Promise.all([
        getMe(),
        getFriends(),
        getFriendRequests()
      ])
      setCurrentUser(user)
      setFriends(friendsList)
      setRequests(requestsList)
    } catch (err) {
      console.error('Failed to load data:', err)
      onLogout()
    } finally {
      setLoading(false)
    }
  }

  const handleFriendClick = async (friend: User) => {
    setSelectedFriend(friend)
    try {
      const interactionsList = await getInteractions(friend.id)
      setInteractions(interactionsList)
    } catch (err) {
      console.error('Failed to load interactions:', err)
      setInteractions([])
    }
  }

  const handleSendRequest = async (userId: number) => {
    try {
      await sendFriendRequest(userId)
      await loadData()
    } catch (err) {
      console.error('Failed to send friend request:', err)
      alert('Failed to send friend request')
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId)
      await loadData()
    } catch (err) {
      console.error('Failed to accept request:', err)
      alert('Failed to accept request')
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId)
      await loadData()
    } catch (err) {
      console.error('Failed to reject request:', err)
      alert('Failed to reject request')
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      onLogout()
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '1rem' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Bother App - {currentUser?.username}</h1>
        <button
          onClick={handleLogout}
          style={{ padding: '0.5rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {/* User Search */}
      <div style={{ background: 'white', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
        <UserSearch onSendRequest={handleSendRequest} />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem' }}>
        {/* Friends Grid */}
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem', marginBottom: '1rem' }}>Friends</h2>
          <FriendGrid
            friends={friends}
            onFriendClick={handleFriendClick}
            selectedFriend={selectedFriend}
          />
        </div>

        {/* Friend Requests */}
        <FriendRequests
          requests={requests}
          currentUserId={currentUser?.id || 0}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
        />
      </div>

      {/* Interactions Modal */}
      {selectedFriend && (
        <BotherList
          friend={selectedFriend}
          interactions={interactions}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </div>
  )
}

