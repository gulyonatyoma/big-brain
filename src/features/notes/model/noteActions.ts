import { db } from '../../../shared/db/db'
import type { Note, NoteContent } from '../types'

type CreateNoteInput = {
  title: string
  content?: string
}

type UpdateNoteInput = {
  title?: string
  content?: string
}

export async function createNote(input: CreateNoteInput) {
  const now = new Date().toISOString()
  const noteId = crypto.randomUUID()

  const note: Note = {
    id: noteId,
    title: input.title.trim(),
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

export async function updateNote(noteId: string, input: UpdateNoteInput) {
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

export async function deleteNote(noteId: string) {
  await db.transaction('rw', db.notes, db.noteContents, async () => {
    await db.noteContents.where('noteId').equals(noteId).delete()
    await db.notes.delete(noteId)
  })
}