import axios from 'axios'

// Configure axios defaults
const api = axios.create({
  baseURL: '/api', // Proxied to backend through Vite
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authentication, logging, etc.
api.interceptors.request.use(
  (config) => {
    // Add auth headers here if needed
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle global errors here
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// API service functions
export const apiService = {
  // Health check
  healthCheck: () => api.get('/health'),
  
  // Database test
  testDatabase: () => api.get('/db-test'),
  
  // Generic CRUD operations - customize these for your needs
  getItems: (endpoint: string) => api.get(endpoint),
  getItem: (endpoint: string, id: number | string) => api.get(`${endpoint}/${id}`),
  createItem: (endpoint: string, data: any) => api.post(endpoint, data),
  updateItem: (endpoint: string, id: number | string, data: any) => api.put(`${endpoint}/${id}`, data),
  deleteItem: (endpoint: string, id: number | string) => api.delete(`${endpoint}/${id}`),
}

export default api
