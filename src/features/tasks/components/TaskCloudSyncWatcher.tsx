import { useEffect, useState } from 'react'
import { db } from '../../../shared/db/db'
import { useAuthStore } from '../../auth/model/authStore'
import { getCloudTasks } from '../model/cloud/taskCloudActions'

function TaskCloudSyncWatcher() {
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

    async function syncTasksFromCloud() {
      try {
        const cloudTasks = await getCloudTasks()

        if (isCancelled) {
          return
        }

        await db.transaction('rw', db.tasks, async () => {
          await Promise.all(
            cloudTasks.map((task) => {
              return db.tasks.put(task)
            }),
          )
        })

        setLastSyncedUserId(userId)
      } catch (error) {
        console.warn('Failed to sync tasks from cloud', error)
      }
    }

    syncTasksFromCloud()

    return () => {
      isCancelled = true
    }
  }, [isAuthLoading, lastSyncedUserId, user])

  return null
}

export default TaskCloudSyncWatcher