import { supabase } from '../api/supabaseClient'
import { db } from '../db/db'
import { getCloudEvents } from '../../features/events/model/cloud/eventCloudActions'
import { getCloudFocusSessions } from '../../features/focus/model/cloud/focusCloudActions'
import { getCloudNotesData } from '../../features/notes/model/cloud/noteCloudActions'
import { getCloudTasks } from '../../features/tasks/model/cloud/taskCloudActions'

export type CloudSyncResult = {
  syncedAt: string
  tasksCount: number
  eventsCount: number
  notesCount: number
  focusSessionsCount: number
}

export async function syncCloudDataToLocal(): Promise<CloudSyncResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('Пользователь не авторизован')
  }

  const [tasks, events, notesData, focusSessions] = await Promise.all([
    getCloudTasks(),
    getCloudEvents(),
    getCloudNotesData(),
    getCloudFocusSessions(),
  ])

  await Promise.all([
    db.tasks.clear(),
    db.events.clear(),
    db.notes.clear(),
    db.noteContents.clear(),
    db.focusSessions.clear(),
  ])

  await Promise.all([
    ...tasks.map((task) => db.tasks.put(task)),
    ...events.map((event) => db.events.put(event)),
    ...notesData.notes.map((note) => db.notes.put(note)),
    ...notesData.noteContents.map((noteContent) =>
      db.noteContents.put(noteContent),
    ),
    ...focusSessions.map((focusSession) =>
      db.focusSessions.put(focusSession),
    ),
  ])

  return {
    syncedAt: new Date().toISOString(),
    tasksCount: tasks.length,
    eventsCount: events.length,
    notesCount: notesData.notes.length,
    focusSessionsCount: focusSessions.length,
  }
}