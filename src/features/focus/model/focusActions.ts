import { supabase } from '../../../shared/api/supabaseClient'
import { db } from '../../../shared/db/db'
import type { FocusSession } from '../types'
import {
  createCloudFocusSession,
  deleteCloudFocusSession,
} from './cloud/focusCloudActions'

type CreateFocusSessionInput = {
  taskId?: string
  taskTitle?: string
  durationMinutes: number
  startedAt: string
}

async function getAuthenticatedUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

async function createLocalFocusSession(input: CreateFocusSessionInput) {
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

export async function createFocusSession(input: CreateFocusSessionInput) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      const cloudFocusSession = await createCloudFocusSession(input)

      await db.focusSessions.put(cloudFocusSession)

      return cloudFocusSession
    } catch (error) {
      console.warn(
        'Failed to create cloud focus session, creating local focus session only',
        error,
      )
    }
  }

  return createLocalFocusSession(input)
}

export async function deleteFocusSession(focusSessionId: string) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      await deleteCloudFocusSession(focusSessionId)
    } catch (error) {
      console.warn(
        'Failed to delete cloud focus session, deleting local focus session only',
        error,
      )
    }
  }

  await db.focusSessions.delete(focusSessionId)
}