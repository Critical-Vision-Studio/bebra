import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFriendshipMessageSets, addFriendshipMessageSet, removeFriendshipMessageSet, getConversationHistory, sendMessage, markAsRead } from '../api/friendships'

export function useFriendshipMessageSets(friendshipId: number | null) {
  return useQuery({
    queryKey: ['friendshipMessageSets', friendshipId],
    queryFn: () => getFriendshipMessageSets(friendshipId!),
    enabled: friendshipId !== null,
  })
}

export function useAddFriendshipMessageSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ friendshipId, messageSetId }: { friendshipId: number; messageSetId: number }) =>
      addFriendshipMessageSet(friendshipId, messageSetId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['friendshipMessageSets', variables.friendshipId] })
    },
  })
}

export function useRemoveFriendshipMessageSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ friendshipId, fmsId }: { friendshipId: number; fmsId: number }) =>
      removeFriendshipMessageSet(friendshipId, fmsId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['friendshipMessageSets', variables.friendshipId] })
    },
  })
}

export function useConversationHistory(friendshipId: number | null) {
  return useQuery({
    queryKey: ['conversationHistory', friendshipId],
    queryFn: () => getConversationHistory(friendshipId!),
    enabled: friendshipId !== null,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ friendshipId, messageId }: { friendshipId: number; messageId: string }) =>
      sendMessage(friendshipId, messageId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['conversationHistory', variables.friendshipId] })
    },
  })
}

export function useMarkAsRead(friendshipId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markAsRead(friendshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] })
    },
  })
}
