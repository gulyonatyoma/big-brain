import Dexie, { type Table } from 'dexie'
import type { CalendarEvent } from '../../features/events/types'
import type { FocusSession } from '../../features/focus/types'
import type { Note, NoteContent } from '../../features/notes/types'
import type { Task } from '../../features/tasks/types'

class BigBrainDatabase extends Dexie {
  tasks!: Table<Task, string>
  events!: Table<CalendarEvent, string>
  notes!: Table<Note, string>
  noteContents!: Table<NoteContent, string>
  focusSessions!: Table<FocusSession, string>

  constructor() {
    super('bigBrainDatabase')

    this.version(1).stores({
      tasks: 'id, status, dueDate, createdAt, completedAt, priority',
    })

    this.version(2).stores({
      tasks: 'id, status, dueDate, createdAt, completedAt, priority',
      events: 'id, date, repeatType, createdAt',
    })

    this.version(3).stores({
      tasks: 'id, status, dueDate, createdAt, completedAt, priority',
      events: 'id, date, repeatType, createdAt',
      notes: 'id, title, createdAt, updatedAt',
    })

    this.version(4).stores({
      tasks: 'id, status, dueDate, createdAt, completedAt, priority',
      events: 'id, date, repeatType, createdAt',
      notes: 'id, title, createdAt, updatedAt',
      focusSessions: 'id, taskId, startedAt, completedAt, durationMinutes',
    })

    this.version(5)
      .stores({
        tasks: 'id, status, dueDate, createdAt, completedAt, priority',
        events: 'id, date, repeatType, createdAt',
        notes: 'id, title, createdAt, updatedAt',
        noteContents: 'id, noteId, updatedAt',
        focusSessions: 'id, taskId, startedAt, completedAt, durationMinutes',
      })
      .upgrade(async (transaction) => {
        const notesTable = transaction.table('notes')
        const noteContentsTable = transaction.table('noteContents')

        const oldNotes = await notesTable.toArray()

        await Promise.all(
          oldNotes.map(async (oldNote) => {
            const noteWithOldContent = oldNote as Note & {
              content?: string
            }

            const content = noteWithOldContent.content ?? ''
            const updatedAt = noteWithOldContent.updatedAt ?? new Date().toISOString()

            await noteContentsTable.put({
              id: noteWithOldContent.id,
              noteId: noteWithOldContent.id,
              content,
              updatedAt,
            })

            await notesTable.put({
              id: noteWithOldContent.id,
              title: noteWithOldContent.title,
              createdAt: noteWithOldContent.createdAt,
              updatedAt,
            })
          }),
        )
      })
  }
}

export const db = new BigBrainDatabase()