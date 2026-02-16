import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/auth'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getMe,
    retry: false,
  })
}
