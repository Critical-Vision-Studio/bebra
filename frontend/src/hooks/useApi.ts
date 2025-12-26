import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../api'

// Custom hook for health check
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.healthCheck(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Custom hook for database test
export function useDatabaseTest() {
  return useQuery({
    queryKey: ['db-test'],
    queryFn: () => apiService.testDatabase(),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Generic hooks for CRUD operations
export function useItems(endpoint: string) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: () => apiService.getItems(endpoint),
  })
}

export function useItem(endpoint: string, id: number | string) {
  return useQuery({
    queryKey: [endpoint, id],
    queryFn: () => apiService.getItem(endpoint, id),
    enabled: !!id, // Only run if id is provided
  })
}

export function useCreateItem(endpoint: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiService.createItem(endpoint, data),
    onSuccess: () => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: [endpoint] })
    },
  })
}

export function useUpdateItem(endpoint: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => 
      apiService.updateItem(endpoint, id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific item and items list
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      queryClient.invalidateQueries({ queryKey: [endpoint, variables.id] })
    },
  })
}

export function useDeleteItem(endpoint: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number | string) => apiService.deleteItem(endpoint, id),
    onSuccess: () => {
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: [endpoint] })
    },
  })
}
