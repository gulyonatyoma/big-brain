import { supabase } from '../../../shared/api/supabaseClient'
import { db } from '../../../shared/db/db'
import type { Note, NoteContent } from '../types'
import {
  createCloudNote,
  deleteCloudNote,
  updateCloudNote,
} from './cloud/noteCloudActions'

type CreateNoteInput = {
  title: string
  content?: string
}

type UpdateNoteInput = {
  title?: string
  content?: string
}

async function getAuthenticatedUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

async function createLocalNote(input: CreateNoteInput) {
  const now = new Date().toISOString()
  const noteId = crypto.randomUUID()

  const note: Note = {
    id: noteId,
    title: input.title.trim() || 'Новая заметка',
    createdAt: now,
    updatedAt: now,
  }

  const noteContent: NoteContent = {
    id: noteId,
    noteId,
    content: input.content ?? '',
    updatedAt: now,
  }

  await db.transaction('rw', db.notes, db.noteContents, async () => {
    await db.notes.add(note)
    await db.noteContents.add(noteContent)
  })

  return note
}

async function updateLocalNote(noteId: string, input: UpdateNoteInput) {
  const now = new Date().toISOString()

  await db.transaction('rw', db.notes, db.noteContents, async () => {
    if (typeof input.title === 'string') {
      await db.notes.update(noteId, {
        title: input.title,
        updatedAt: now,
      })
    }

    if (typeof input.content === 'string') {
      const existingContent = await db.noteContents
        .where('noteId')
        .equals(noteId)
        .first()

      if (existingContent) {
        await db.noteContents.update(existingContent.id, {
          content: input.content,
          updatedAt: now,
        })
      } else {
        await db.noteContents.add({
          id: noteId,
          noteId,
          content: input.content,
          updatedAt: now,
        })
      }

      await db.notes.update(noteId, {
        updatedAt: now,
      })
    }
  })
}

async function deleteLocalNote(noteId: string) {
  await db.transaction('rw', db.notes, db.noteContents, async () => {
    await db.noteContents.where('noteId').equals(noteId).delete()
    await db.notes.delete(noteId)
  })
}

export async function createNote(input: CreateNoteInput) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      const { note, noteContent } = await createCloudNote(input)

      await db.transaction('rw', db.notes, db.noteContents, async () => {
        await db.notes.put(note)
        await db.noteContents.put(noteContent)
      })

      return note
    } catch (error) {
      console.warn('Failed to create cloud note, creating local note only', error)
    }
  }

  return createLocalNote(input)
}

export async function updateNote(noteId: string, input: UpdateNoteInput) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      const { note, noteContent } = await updateCloudNote(noteId, input)

      await db.transaction('rw', db.notes, db.noteContents, async () => {
        if (note) {
          await db.notes.put(note)
        }

        if (noteContent) {
          await db.noteContents.put(noteContent)
        }
      })

      return
    } catch (error) {
      console.warn('Failed to update cloud note, updating local note only', error)
    }
  }

  await updateLocalNote(noteId, input)
}

export async function deleteNote(noteId: string) {
  const userId = await getAuthenticatedUserId()

  if (userId) {
    try {
      await deleteCloudNote(noteId)
    } catch (error) {
      console.warn('Failed to delete cloud note, deleting local note only', error)
    }
  }

  await deleteLocalNote(noteId)
}