import { useEffect, useRef } from 'react'
import { useAuthStore } from '../../../features/auth/model/authStore'
import { supabase } from '../../api/supabaseClient'
import { syncCloudDataToLocal } from '../cloudSyncActions'

const REALTIME_SYNC_DELAY_MS = 500
const FALLBACK_SYNC_INTERVAL_MS = 7000

function CloudRealtimeWatcher() {
  const user = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading)

  const syncTimeoutRef = useRef<number | null>(null)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    if (isAuthLoading || !user) {
      return
    }

    const userId = user.id

    async function syncNow(reason: string) {
      if (isSyncingRef.current) {
        return
      }

      isSyncingRef.current = true

      try {
        await syncCloudDataToLocal()
        console.info(`[cloud-sync] synced after ${reason}`)
      } catch (error) {
        console.warn(`[cloud-sync] failed after ${reason}`, error)
      } finally {
        isSyncingRef.current = false
      }
    }

    function scheduleSync(reason: string) {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current)
      }

      syncTimeoutRef.current = window.setTimeout(() => {
        syncNow(reason)
      }, REALTIME_SYNC_DELAY_MS)
    }

    const channel = supabase
      .channel(`cloud-data-sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        () => scheduleSync('tasks realtime change'),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        () => scheduleSync('events realtime change'),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`,
        },
        () => scheduleSync('notes realtime change'),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'note_contents',
          filter: `user_id=eq.${userId}`,
        },
        () => scheduleSync('note_contents realtime change'),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'focus_sessions',
          filter: `user_id=eq.${userId}`,
        },
        () => scheduleSync('focus_sessions realtime change'),
      )
      .subscribe((status) => {
        console.info(`[cloud-sync] realtime status: ${status}`)
      })

    const fallbackIntervalId = window.setInterval(() => {
      syncNow('fallback interval')
    }, FALLBACK_SYNC_INTERVAL_MS)

    function handleWindowFocus() {
      syncNow('window focus')
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        syncNow('tab visible')
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    syncNow('watcher start')

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current)
      }

      window.clearInterval(fallbackIntervalId)

      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      supabase.removeChannel(channel)
    }
  }, [isAuthLoading, user])

  return null
}

export default CloudRealtimeWatcher