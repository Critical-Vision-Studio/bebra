import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/',
})

// Add auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Handle 401 → clear token and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.assign('/')
    }
    return Promise.reject(error)
  }
)
