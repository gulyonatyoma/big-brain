import { useEffect, useState } from 'react'
import { db } from '../../../shared/db/db'
import { useAuthStore } from '../../auth/model/authStore'
import { getCloudNotesData } from '../model/cloud/noteCloudActions'

function NoteCloudSyncWatcher() {
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

    async function syncNotesFromCloud() {
      try {
        const { notes, noteContents } = await getCloudNotesData()

        if (isCancelled) {
          return
        }

        await db.transaction('rw', db.notes, db.noteContents, async () => {
          await Promise.all([
            ...notes.map((note) => {
              return db.notes.put(note)
            }),

            ...noteContents.map((noteContent) => {
              return db.noteContents.put(noteContent)
            }),
          ])
        })

        setLastSyncedUserId(userId)
      } catch (error) {
        console.warn('Failed to sync notes from cloud', error)
      }
    }

    syncNotesFromCloud()

    return () => {
      isCancelled = true
    }
  }, [isAuthLoading, lastSyncedUserId, user])

  return null
}

export default NoteCloudSyncWatcher