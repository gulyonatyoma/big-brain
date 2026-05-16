import { db } from '../../../shared/db/db'
import type { FocusSession } from '../types'

type CreateFocusSessionInput = {
  taskId?: string
  taskTitle?: string
  durationMinutes: number
  startedAt: string
}

export async function createFocusSession(input: CreateFocusSessionInput) {
  const now = new Date().toISOString()

  const focusSession: FocusSession = {
    id: crypto.randomUUID(),
    taskId: input.taskId,
    taskTitle: input.taskTitle,
    durationMinutes: input.durationMinutes,
    startedAt: input.startedAt,
    completedAt: now,
  }

  await db.focusSessions.add(focusSession)

  return focusSession
}

export async function deleteFocusSession(focusSessionId: string) {
  await db.focusSessions.delete(focusSessionId)
}