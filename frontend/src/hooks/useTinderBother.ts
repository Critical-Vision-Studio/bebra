import { useQuery } from '@tanstack/react-query'
import { getTinderMatch } from '../api/tinderBother'
import { getSettings } from '../api/settings'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })
}

export function useTinderMatch() {
  const { data: settings } = useSettings()

  return useQuery({
    queryKey: ['tinderMatch'],
    queryFn: getTinderMatch,
    enabled: !!settings?.tinder_enabled,
    refetchInterval: settings?.tinder_enabled
      ? (settings.tinder_interval_minutes ?? 5) * 60 * 1000
      : false,
    retry: false,
  })
}
