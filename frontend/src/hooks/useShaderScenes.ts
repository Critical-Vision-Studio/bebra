import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getShaderScenes, updateAvatar } from '../api/shaderScenes'

export function useShaderScenes(enabled = true) {
  return useQuery({
    queryKey: ['shaderScenes'],
    queryFn: getShaderScenes,
    staleTime: Infinity,
    enabled,
  })
}

export function useUpdateAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateAvatar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentUser'] })
      qc.invalidateQueries({ queryKey: ['friends'] })
    },
  })
}
