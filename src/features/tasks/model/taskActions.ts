import { db } from '../../../shared/db/db'
import type { Task, TaskPriority } from '../types'

type CreateTaskInput = {
  title: string
  description?: string
  dueDate?: string
  priority?: TaskPriority
}

export async function createTask(input: CreateTaskInput) {
  const now = new Date().toISOString()

  const task: Task = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim(),
    dueDate: input.dueDate,
    priority: input.priority ?? 'medium',
    status: 'active',
    createdAt: now,
  }

  await db.tasks.add(task)

  return task
}

export async function completeTask(taskId: string) {
  await db.tasks.update(taskId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  })
}

export async function restoreTask(taskId: string) {
  await db.tasks.update(taskId, {
    status: 'active',
    completedAt: undefined,
  })
}

export async function deleteTask(taskId: string) {
  await db.tasks.delete(taskId)
}