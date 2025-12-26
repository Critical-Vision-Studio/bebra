import type { Interaction, User } from '../types'

interface BotherListProps {
  friend: User
  interactions: Interaction[]
  onClose: () => void
}

export default function BotherList({ friend, interactions, onClose }: BotherListProps) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Interactions with {friend.username}</h2>
          <button
            onClick={onClose}
            style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
        
        {interactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
            No interactions with this friend yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {interactions.map(interaction => (
              <div key={interaction.id} style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Direction:</strong> {interaction.direction}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Description:</strong> {interaction.options.description}
                </div>
                <div>
                  <strong>Options:</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                    {interaction.options.options.map((opt, idx) => (
                      <li key={idx}>{opt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

