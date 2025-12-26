// Common utility functions for the frontend

/**
 * Format date to a readable string
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Simple localStorage wrapper with error handling
 */
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue || null
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error writing to localStorage:', error)
      return false
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  }
}

/**
 * Format error messages for display
 */
export function formatError(error: any): string {
  if (typeof error === 'string') return error
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.response?.data?.detail) return error.response.data.detail
  if (error?.message) return error.message
  return 'An unexpected error occurred'
}

/**
 * Generate a random ID for temporary use
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}
