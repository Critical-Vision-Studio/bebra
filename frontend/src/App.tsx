import { useState, useEffect } from 'react'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'

function App() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token')
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
  }

  if (!token) {
    return <AuthPage onLogin={handleLogin} />
  }

  return <Dashboard onLogout={handleLogout} />
}

export default App
