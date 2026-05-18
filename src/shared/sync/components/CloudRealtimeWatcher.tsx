import { useEffect, useRef } from 'react'
import { supabase } from '../../api/supabaseClient'
import { useAuthStore } from '../../../features/auth/model/authStore'
import { syncCloudDataToLocal } from '../cloudSyncActions'

function CloudRealtimeWatcher() {
  const user = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading)

  const syncTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (isAuthLoading || !user) {
      return
    }

    const userId = user.id

    function scheduleSync() {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current)
      }

      syncTimeoutRef.current = window.setTimeout(async () => {
        try {
          await syncCloudDataToLocal()
        } catch (error) {
          console.warn('Failed to sync realtime cloud changes', error)
        }
      }, 500)
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
        scheduleSync,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        scheduleSync,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`,
        },
        scheduleSync,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'note_contents',
          filter: `user_id=eq.${userId}`,
        },
        scheduleSync,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'focus_sessions',
          filter: `user_id=eq.${userId}`,
        },
        scheduleSync,
      )
      .subscribe()

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current)
      }

      supabase.removeChannel(channel)
    }
  }, [isAuthLoading, user])

  return null
}

export default CloudRealtimeWatcher