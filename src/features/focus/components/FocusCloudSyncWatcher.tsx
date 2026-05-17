import { useEffect, useState } from 'react'
import { db } from '../../../shared/db/db'
import { useAuthStore } from '../../auth/model/authStore'
import { getCloudFocusSessions } from '../model/cloud/focusCloudActions'

function FocusCloudSyncWatcher() {
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

    async function syncFocusSessionsFromCloud() {
      try {
        const cloudFocusSessions = await getCloudFocusSessions()

        if (isCancelled) {
          return
        }

        await db.transaction('rw', db.focusSessions, async () => {
          await Promise.all(
            cloudFocusSessions.map((focusSession) => {
              return db.focusSessions.put(focusSession)
            }),
          )
        })

        setLastSyncedUserId(userId)
      } catch (error) {
        console.warn('Failed to sync focus sessions from cloud', error)
      }
    }

    syncFocusSessionsFromCloud()

    return () => {
      isCancelled = true
    }
  }, [isAuthLoading, lastSyncedUserId, user])

  return null
}

export default FocusCloudSyncWatcher