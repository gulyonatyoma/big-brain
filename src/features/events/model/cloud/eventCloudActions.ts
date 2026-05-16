import { supabase } from '../../../../shared/api/supabaseClient'
import type { CalendarEvent, EventRepeatType } from '../../types'

type SupabaseEventRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string
  start_time: string | null
  end_time: string | null
  repeat_type: EventRepeatType
  repeat_interval: number
  reminder_minutes_before: number | null
  created_at: string
}

type CreateCloudEventInput = {
  title: string
  description?: string
  date: string
  startTime?: string
  endTime?: string
  repeatType: EventRepeatType
  repeatInterval: number
  reminderMinutesBefore?: number
}

function normalizeTime(time: string | null) {
  if (!time) {
    return undefined
  }

  return time.slice(0, 5)
}

function mapSupabaseEventToCalendarEvent(
  row: SupabaseEventRow,
): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date,
    startTime: normalizeTime(row.start_time),
    endTime: normalizeTime(row.end_time),
    repeatType: row.repeat_type,
    repeatInterval: row.repeat_interval,
    reminderMinutesBefore: row.reminder_minutes_before ?? undefined,
    createdAt: row.created_at,
  }
}

export async function getCloudEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapSupabaseEventToCalendarEvent(row as SupabaseEventRow),
  )
}

export async function createCloudEvent(input: CreateCloudEventInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('User is not authenticated')
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      date: input.date,
      start_time: input.startTime || null,
      end_time: input.endTime || null,
      repeat_type: input.repeatType,
      repeat_interval: input.repeatInterval,
      reminder_minutes_before:
        typeof input.reminderMinutesBefore === 'number'
          ? input.reminderMinutesBefore
          : null,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseEventToCalendarEvent(data as SupabaseEventRow)
}

export async function deleteCloudEvent(eventId: string) {
  const { error } = await supabase.from('events').delete().eq('id', eventId)

  if (error) {
    throw error
  }
}