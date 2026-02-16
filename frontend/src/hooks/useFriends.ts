import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFriends, getFriendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '../api/mainAPI'

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  })
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ['friendRequests'],
    queryFn: getFriendRequests,
  })
}

export function useSendFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ receiverId, requestType, attachedMessageId }: {
      receiverId: number
      requestType?: 'normal' | 'tinder'
      attachedMessageId?: string
    }) => sendFriendRequest(receiverId, requestType, attachedMessageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friendRequests'] })
    },
  })
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friendRequests'] })
      qc.invalidateQueries({ queryKey: ['friends'] })
    },
  })
}

export function useRejectFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friendRequests'] })
    },
  })
}
