import type { User } from '../types'

interface FriendGridProps {
  friends: User[]
  onFriendClick: (friend: User) => void
  selectedFriend: User | null
}

export default function FriendGrid({ friends, onFriendClick, selectedFriend }: FriendGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
      {friends.map(friend => (
        <div
          key={friend.id}
          onClick={() => onFriendClick(friend)}
          style={{
            padding: '1rem',
            background: selectedFriend?.id === friend.id ? '#007bff' : 'white',
            color: selectedFriend?.id === friend.id ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{friend.username}</div>
        </div>
      ))}
      {friends.length === 0 && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: '2rem' }}>
          No friends yet. Search and add some!
        </div>
      )}
    </div>
  )
}

