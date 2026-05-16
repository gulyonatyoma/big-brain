import { db } from '../../../shared/db/db'
import type { Note } from '../types'

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

  const note: Note = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    content: input.content ?? '',
    createdAt: now,
    updatedAt: now,
  }

  await db.notes.add(note)

  return note
}

export async function updateNote(noteId: string, input: UpdateNoteInput) {
  await db.notes.update(noteId, {
    ...input,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteNote(noteId: string) {
  await db.notes.delete(noteId)
}