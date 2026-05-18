import { supabase } from '../../../../shared/api/supabaseClient'
import type { Task, TaskPriority } from '../../types'

type SupabaseTaskRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  priority: TaskPriority
  status: 'active' | 'completed'
  created_at: string
  completed_at: string | null
}

type CreateCloudTaskInput = {
  title: string
  description?: string
  dueDate?: string
  priority: TaskPriority
}

type UpdateCloudTaskInput = {
  title?: string
  description?: string
  dueDate?: string
  priority?: TaskPriority
}

function mapSupabaseTaskToTask(row: SupabaseTaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    dueDate: row.due_date ?? undefined,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  }
}

export async function getCloudTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapSupabaseTaskToTask(row as SupabaseTaskRow))
}

export async function createCloudTask(input: CreateCloudTaskInput) {
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
    .from('tasks')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_date: input.dueDate || null,
      priority: input.priority,
      status: 'active',
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseTaskToTask(data as SupabaseTaskRow)
}

export async function updateCloudTask(
  taskId: string,
  input: UpdateCloudTaskInput,
) {
  const payload: Record<string, unknown> = {}

  if (typeof input.title === 'string') {
    payload.title = input.title.trim()
  }

  if (typeof input.description === 'string') {
    payload.description = input.description.trim() || null
  }

  if (typeof input.dueDate === 'string') {
    payload.due_date = input.dueDate || null
  }

  if (input.priority) {
    payload.priority = input.priority
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseTaskToTask(data as SupabaseTaskRow)
}

export async function completeCloudTask(taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseTaskToTask(data as SupabaseTaskRow)
}

export async function restoreCloudTask(taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'active',
      completed_at: null,
    })
    .eq('id', taskId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseTaskToTask(data as SupabaseTaskRow)
}

export async function deleteCloudTask(taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    throw error
  }
}