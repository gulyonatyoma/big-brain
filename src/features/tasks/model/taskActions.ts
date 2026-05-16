import { supabase } from '../../../shared/api/supabaseClient'
import { db } from '../../../shared/db/db'
import type { Task, TaskPriority } from '../types'
import {
  completeCloudTask,
  createCloudTask,
  deleteCloudTask,
  restoreCloudTask,
} from './cloud/taskCloudActions'

type CreateTaskInput = {
  title: string
  description?: string
  dueDate?: string
  priority: TaskPriority
}

async function getAuthenticatedUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

export async function createTask(input: CreateTaskInput) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    const cloudTask = await createCloudTask(input)

    await db.tasks.put(cloudTask)

    return cloudTask
  }

  const now = new Date().toISOString()

  const task: Task = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim(),
    dueDate: input.dueDate,
    priority: input.priority,
    status: 'active',
    createdAt: now,
  }

  await db.tasks.add(task)

  return task
}

export async function completeTask(taskId: string) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      const cloudTask = await completeCloudTask(taskId)

      await db.tasks.put(cloudTask)

      return cloudTask
    } catch (error) {
      console.warn('Failed to complete cloud task, falling back to local task', error)
    }
  }

  const completedAt = new Date().toISOString()

  await db.tasks.update(taskId, {
    status: 'completed',
    completedAt,
  })

  return db.tasks.get(taskId)
}

export async function restoreTask(taskId: string) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      const cloudTask = await restoreCloudTask(taskId)

      await db.tasks.put(cloudTask)

      return cloudTask
    } catch (error) {
      console.warn('Failed to restore cloud task, falling back to local task', error)
    }
  }

  await db.tasks.update(taskId, {
    status: 'active',
    completedAt: undefined,
  })

  return db.tasks.get(taskId)
}

export async function deleteTask(taskId: string) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      await deleteCloudTask(taskId)
    } catch (error) {
      console.warn('Failed to delete cloud task, deleting local task only', error)
    }
  }

  await db.tasks.delete(taskId)
}