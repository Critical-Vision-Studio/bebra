import type { FriendshipRequest } from '../types'

interface FriendRequestsProps {
  requests: FriendshipRequest[]
  currentUserId: number
  onAccept: (requestId: number) => void
  onReject: (requestId: number) => void
}

export default function FriendRequests({ requests, currentUserId, onAccept, onReject }: FriendRequestsProps) {
  const received = requests.filter(r => r.receiver_id === currentUserId && r.status === 'pending')
  const sent = requests.filter(r => r.sender_id === currentUserId && r.status === 'pending')

  return (
    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '1rem' }}>Friend Requests</h3>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Received ({received.length})</h4>
        {received.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: '#999' }}>No pending requests</div>
        ) : (
          received.map(req => (
            <div key={req.id} style={{ padding: '0.5rem', background: '#f9f9f9', borderRadius: '4px', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>User #{req.sender_id}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => onAccept(req.id)}
                  style={{ flex: 1, padding: '0.25rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Accept
                </button>
                <button
                  onClick={() => onReject(req.id)}
                  style={{ flex: 1, padding: '0.25rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div>
        <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Sent ({sent.length})</h4>
        {sent.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: '#999' }}>No pending requests</div>
        ) : (
          sent.map(req => (
            <div key={req.id} style={{ padding: '0.5rem', background: '#f9f9f9', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              To User #{req.receiver_id} - Pending
            </div>
          ))
        )}
      </div>
    </div>
  )
}

