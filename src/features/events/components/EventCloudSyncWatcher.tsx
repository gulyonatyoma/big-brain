import { useEffect, useState } from 'react'
import { db } from '../../../shared/db/db'
import { useAuthStore } from '../../auth/model/authStore'
import { getCloudEvents } from '../model/cloud/eventCloudActions'

function EventCloudSyncWatcher() {
  const user = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading)

  const [lastSyncedUserId, setLastSyncedUserId] = useState('')

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!user) {
      setLastSyncedUserId('')
      return
    }

    const userId = user.id

    if (lastSyncedUserId === userId) {
      return
    }

    let isCancelled = false

    async function syncEventsFromCloud() {
      try {
        const cloudEvents = await getCloudEvents()

        if (isCancelled) {
          return
        }

        await db.transaction('rw', db.events, async () => {
          await Promise.all(
            cloudEvents.map((event) => {
              return db.events.put(event)
            }),
          )
        })

        setLastSyncedUserId(userId)
      } catch (error) {
        console.warn('Failed to sync events from cloud', error)
      }
    }

    syncEventsFromCloud()

    return () => {
      isCancelled = true
    }
  }, [isAuthLoading, lastSyncedUserId, user])

  return null
}

export default EventCloudSyncWatcher