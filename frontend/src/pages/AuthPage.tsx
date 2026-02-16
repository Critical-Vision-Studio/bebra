import { useState } from 'react'
import { TextInput, PasswordInput, Button, Paper, Title, Text, Stack, Anchor, Center } from '@mantine/core'
import { registerUser, loginUser } from '../api/auth'

interface AuthProps {
  onLogin: (token: string) => void
}

export default function AuthPage({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!isLogin) {
        await registerUser({ username, password })
      }
      const result = await loginUser(username, password)
      localStorage.setItem('access_token', result.access_token)
      onLogin(result.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Center h="100vh" bg="gray.0">
      <Paper shadow="md" p="xl" w={400} radius="md">
        <Title order={2} ta="center" mb="lg">
          {isLogin ? 'Login' : 'Register'}
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
            {error && <Text c="red" size="sm">{error}</Text>}
            <Button type="submit" loading={loading} fullWidth>
              {isLogin ? 'Login' : 'Register'}
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md" size="sm">
          <Anchor component="button" type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          </Anchor>
        </Text>
      </Paper>
    </Center>
  )
}
