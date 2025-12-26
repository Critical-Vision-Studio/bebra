// Common TypeScript type definitions

// API Response wrapper
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: 'success' | 'error' | 'warning'
}

// Database record with common fields
export interface BaseRecord {
  id: number
  created_at: string
  updated_at?: string
}

// Sample table type (matching the backend schema)
export interface SampleRecord extends BaseRecord {
  name: string
}

// API Error type
export interface ApiError {
  message: string
  detail?: string
  status?: number
}

// Query key types for React Query
export type QueryKey = readonly unknown[]

// Generic list response
export interface ListResponse<T> {
  items: T[]
  total?: number
  page?: number
  limit?: number
}

// Common form field props
export interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

// Loading states
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Environment types
export interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_APP_TITLE?: string
  readonly DEV: boolean
  readonly PROD: boolean
}

export interface ImportMeta {
  readonly env: ImportMetaEnv
}
