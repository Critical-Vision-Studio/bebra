import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyMessageSets, getMessageSets, getMessages,
  copyMessageSet, createMessageSet, createMessage, deleteMessageSet, deleteMessage,
  type MessageSetFilters,
} from '../api/messageSets'

export function useMyMessageSets() {
  return useQuery({
    queryKey: ['myMessageSets'],
    queryFn: getMyMessageSets,
  })
}

export function usePublicMessageSets(filters?: MessageSetFilters) {
  return useQuery({
    queryKey: ['publicMessageSets', filters],
    queryFn: () => getMessageSets({ public: true, ...filters }),
  })
}

export function useMessages(setId: number | null) {
  return useQuery({
    queryKey: ['messages', setId],
    queryFn: () => getMessages(setId!),
    enabled: setId !== null,
  })
}

export function useCopyMessageSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: copyMessageSet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myMessageSets'] })
    },
  })
}

export function useCreateMessageSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; description?: string; is_public: boolean; tags: string[] }) =>
      createMessageSet(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myMessageSets'] })
      qc.invalidateQueries({ queryKey: ['publicMessageSets'] })
    },
  })
}

export function useDeleteMessageSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMessageSet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myMessageSets'] })
      qc.invalidateQueries({ queryKey: ['publicMessageSets'] })
    },
  })
}

export function useCreateMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ setId, ...payload }: { setId: number; content_type: string; storage_type: string; content: string; display_order: number }) =>
      createMessage(setId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', variables.setId] })
      qc.invalidateQueries({ queryKey: ['myMessageSets'] })
    },
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['myMessageSets'] })
    },
  })
}
