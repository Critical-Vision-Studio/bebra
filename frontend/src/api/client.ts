import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
})

/*
Interceptors control the auth of the request and response of the apiClient

The request interceptor adds the token to the request headers if the user is logged in
If the user is not logged in, the request will inevitably fail with a 401 error.

The response interceptor handles unauthorized responses (401) 
and redirects to the login page.

*/ 

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    fullURL: (config.baseURL || '') + (config.url || ''),
    headers: config.headers
  })
  return config
})

// Handle unauthorized responses and redirect to login
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    return response
  },
  (error) => {
    console.log(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message)
    if (error?.response?.status === 401) {
      // Purge token and redirect to login on unauthorized
      localStorage.removeItem('access_token')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  }
)

// Serialize arrays as repeated keys: tags=a&tags=b
export function toQueryString(params: Record<string, unknown>): string {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((v) => usp.append(key, String(v)))
    } else {
      usp.append(key, String(value))
    }
  })
  return usp.toString()
}





