import { useState } from 'react'
import { getUsers } from '../api/mainAPI'
import type { User } from '../types'

interface UserSearchProps {
  onSendRequest: (userId: number) => void
}

export default function UserSearch({ onSendRequest }: UserSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const users = await getUsers(query)
      setResults(users)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Search
        </button>
      </div>
      
      {results.length > 0 && (
        <div style={{ marginTop: '0.5rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {results.map(user => (
            <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
              <span>{user.username}</span>
              <button
                onClick={() => onSendRequest(user.id)}
                style={{ padding: '0.25rem 0.75rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

