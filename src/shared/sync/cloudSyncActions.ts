import { getCloudEvents } from '../../features/events/model/cloud/eventCloudActions'
import { getCloudFocusSessions } from '../../features/focus/model/cloud/focusCloudActions'
import { getCloudNotesData } from '../../features/notes/model/cloud/noteCloudActions'
import { getCloudTasks } from '../../features/tasks/model/cloud/taskCloudActions'
import { supabase } from '../api/supabaseClient'
import { db } from '../db/db'

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

  const [cloudTasks, cloudEvents, cloudNotesData, cloudFocusSessions] =
    await Promise.all([
      getCloudTasks(),
      getCloudEvents(),
      getCloudNotesData(),
      getCloudFocusSessions(),
    ])

  const cloudTaskIds = new Set(cloudTasks.map((task) => task.id))
  const cloudEventIds = new Set(cloudEvents.map((event) => event.id))
  const cloudNoteIds = new Set(cloudNotesData.notes.map((note) => note.id))
  const cloudNoteContentIds = new Set(
    cloudNotesData.noteContents.map((noteContent) => noteContent.id),
  )
  const cloudFocusSessionIds = new Set(
    cloudFocusSessions.map((focusSession) => focusSession.id),
  )

  const [
    localTasks,
    localEvents,
    localNotes,
    localNoteContents,
    localFocusSessions,
  ] = await Promise.all([
    db.tasks.toArray(),
    db.events.toArray(),
    db.notes.toArray(),
    db.noteContents.toArray(),
    db.focusSessions.toArray(),
  ])

  /**
   * Важно:
   * Не делаем db.clear() для всех таблиц.
   * Иначе во время фоновой синхронизации React на мгновение видит пустые списки,
   * размонтирует формы редактирования и страница прыгает вверх.
   *
   * Вместо этого:
   * 1. Обновляем/добавляем записи из облака.
   * 2. Удаляем только те локальные записи, которых больше нет в облаке.
   */
  await Promise.all([
    ...cloudTasks.map((task) => db.tasks.put(task)),
    ...cloudEvents.map((event) => db.events.put(event)),
    ...cloudNotesData.notes.map((note) => db.notes.put(note)),
    ...cloudNotesData.noteContents.map((noteContent) =>
      db.noteContents.put(noteContent),
    ),
    ...cloudFocusSessions.map((focusSession) =>
      db.focusSessions.put(focusSession),
    ),
  ])

  await Promise.all([
    ...localTasks
      .filter((task) => !cloudTaskIds.has(task.id))
      .map((task) => db.tasks.delete(task.id)),

    ...localEvents
      .filter((event) => !cloudEventIds.has(event.id))
      .map((event) => db.events.delete(event.id)),

    ...localNotes
      .filter((note) => !cloudNoteIds.has(note.id))
      .map((note) => db.notes.delete(note.id)),

    ...localNoteContents
      .filter((noteContent) => !cloudNoteContentIds.has(noteContent.id))
      .map((noteContent) => db.noteContents.delete(noteContent.id)),

    ...localFocusSessions
      .filter((focusSession) => !cloudFocusSessionIds.has(focusSession.id))
      .map((focusSession) => db.focusSessions.delete(focusSession.id)),
  ])

  return {
    syncedAt: new Date().toISOString(),
    tasksCount: cloudTasks.length,
    eventsCount: cloudEvents.length,
    notesCount: cloudNotesData.notes.length,
    focusSessionsCount: cloudFocusSessions.length,
  }
}