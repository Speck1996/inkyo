import { useCallback, useEffect, useState } from 'react'
import { listPlaces, listReels } from '@/data/repository'
import { useAppStore } from '@/app/store'
import { publishNow } from '@/sync/engine'
import { isSyncConfigured } from '@/sync/client'

export function useInkyoData() {
  const { setPlaces, setReels } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [places, reels] = await Promise.all([listPlaces(), listReels()])
        if (!active) return
        setPlaces(places)
        setReels(reels)
        setError(null)
        setLoading(false)

        if (!isSyncConfigured) return
        await publishNow()
        if (!active) return
        const [mergedPlaces, mergedReels] = await Promise.all([listPlaces(), listReels()])
        if (!active) return
        setPlaces(mergedPlaces)
        setReels(mergedReels)
      } catch (err: unknown) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Could not load the map')
        setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [refreshKey, setPlaces, setReels])

  useEffect(() => {
    if (!isSyncConfigured) return
    const onFocus = () => {
      publishNow()
        .then(async (result) => {
          if (result.skipped || (result.pulled === 0 && result.pushed === 0)) return
          setPlaces(await listPlaces())
          setReels(await listReels())
        })
        .catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [setPlaces, setReels])

  return { loading, error, refresh }
}
