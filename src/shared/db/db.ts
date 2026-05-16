import Dexie, { type Table } from 'dexie'
import type { Task } from '../../features/tasks/types'
import type { CalendarEvent } from '../../features/events/types'
import type { Note } from '../../features/notes/types'
import type { FocusSession } from '../../features/focus/types'

class BigBrainDatabase extends Dexie {
  tasks!: Table<Task, string>
  events!: Table<CalendarEvent, string>
  notes!: Table<Note, string>
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
  }
}

export const db = new BigBrainDatabase()