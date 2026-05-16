import { supabase } from '../../../shared/api/supabaseClient'
import { db } from '../../../shared/db/db'
import type { CalendarEvent, EventRepeatType } from '../types'
import { createCloudEvent, deleteCloudEvent } from './cloud/eventCloudActions'

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

async function getAuthenticatedUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

export async function createCalendarEvent(input: CreateEventInput) {
  const userId = await getAuthenticatedUserId()

  const repeatType = input.repeatType ?? 'none'
  const repeatInterval = input.repeatInterval ?? 1

  if (userId) {
    const cloudEvent = await createCloudEvent({
      title: input.title,
      description: input.description,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      repeatType,
      repeatInterval,
      reminderMinutesBefore: input.reminderMinutesBefore,
    })

    await db.events.put(cloudEvent)

    return cloudEvent
  }

  const now = new Date().toISOString()

  const event: CalendarEvent = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim(),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    repeatType,
    repeatInterval,
    reminderMinutesBefore: input.reminderMinutesBefore,
    createdAt: now,
  }

  await db.events.add(event)

  return event
}

export async function deleteCalendarEvent(eventId: string) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      await deleteCloudEvent(eventId)
    } catch (error) {
      console.warn('Failed to delete cloud event, deleting local event only', error)
    }
  }

  await db.events.delete(eventId)
}