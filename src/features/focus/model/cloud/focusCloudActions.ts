import { supabase } from '../../../../shared/api/supabaseClient'
import type { FocusSession } from '../../types'

type SupabaseFocusSessionRow = {
  id: string
  user_id: string
  task_id: string | null
  task_title: string | null
  duration_minutes: number
  started_at: string
  completed_at: string
}

type CreateCloudFocusSessionInput = {
  taskId?: string
  taskTitle?: string
  durationMinutes: number
  startedAt: string
}

function mapSupabaseFocusSessionToFocusSession(
  row: SupabaseFocusSessionRow,
): FocusSession {
  return {
    id: row.id,
    taskId: row.task_id ?? undefined,
    taskTitle: row.task_title ?? undefined,
    durationMinutes: Number(row.duration_minutes),
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user) {
    throw new Error('User is not authenticated')
  }

  return user
}

export async function getCloudFocusSessions() {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .order('completed_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapSupabaseFocusSessionToFocusSession(row as SupabaseFocusSessionRow),
  )
}

export async function createCloudFocusSession(
  input: CreateCloudFocusSessionInput,
) {
  const user = await getAuthenticatedUser()

  const basePayload = {
    user_id: user.id,
    task_title: input.taskTitle || null,
    duration_minutes: input.durationMinutes,
    started_at: input.startedAt,
    completed_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      ...basePayload,
      task_id: input.taskId || null,
    })
    .select('*')
    .single()

  if (!error) {
    return mapSupabaseFocusSessionToFocusSession(
      data as SupabaseFocusSessionRow,
    )
  }

  /**
   * Если фокус-сессия была привязана к старой локальной задаче,
   * которой нет в облачной таблице tasks, Supabase может отклонить task_id
   * из-за foreign key. В таком случае сохраняем сессию без task_id,
   * но оставляем task_title.
   */
  if (input.taskId) {
    const { data: retryData, error: retryError } = await supabase
      .from('focus_sessions')
      .insert({
        ...basePayload,
        task_id: null,
      })
      .select('*')
      .single()

    if (retryError) {
      throw retryError
    }

    return mapSupabaseFocusSessionToFocusSession(
      retryData as SupabaseFocusSessionRow,
    )
  }

  throw error
}

export async function deleteCloudFocusSession(focusSessionId: string) {
  const { error } = await supabase
    .from('focus_sessions')
    .delete()
    .eq('id', focusSessionId)

  if (error) {
    throw error
  }
}