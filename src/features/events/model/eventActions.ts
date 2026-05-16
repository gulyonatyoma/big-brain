import { db } from '../../../shared/db/db'
import type { CalendarEvent, EventRepeatType } from '../types'

type CreateEventInput = {
  title: string
  description?: string
  date: string
  startTime?: string
  endTime?: string
  repeatType?: EventRepeatType
  repeatInterval?: number
  reminderMinutesBefore?: number
}

export async function createCalendarEvent(input: CreateEventInput) {
  const now = new Date().toISOString()

  const event: CalendarEvent = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim(),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    repeatType: input.repeatType ?? 'none',
    repeatInterval: input.repeatInterval ?? 1,
    reminderMinutesBefore: input.reminderMinutesBefore,
    createdAt: now,
  }

  await db.events.add(event)

  return event
}

export async function deleteCalendarEvent(eventId: string) {
  await db.events.delete(eventId)
}