import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'

function App() {
  const [token, setToken] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const saved = localStorage.getItem('access_token')
    if (saved) setToken(saved)
  }, [])

  const handleLogin = (newToken: string) => {
    queryClient.clear()
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    queryClient.clear()
    setToken(null)
  }

  if (!token) return <AuthPage onLogin={handleLogin} />
  return <Dashboard onLogout={handleLogout} />
}

export default App
