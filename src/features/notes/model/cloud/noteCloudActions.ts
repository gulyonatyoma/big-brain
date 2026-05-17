import { supabase } from '../../../../shared/api/supabaseClient'
import type { Note, NoteContent } from '../../types'

type SupabaseNoteRow = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

type SupabaseNoteContentRow = {
  id: string
  user_id: string
  note_id: string
  content: string
  updated_at: string
}

type CreateCloudNoteInput = {
  title: string
  content?: string
}

type UpdateCloudNoteInput = {
  title?: string
  content?: string
}

function mapSupabaseNoteToNote(row: SupabaseNoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSupabaseNoteContentToNoteContent(
  row: SupabaseNoteContentRow,
): NoteContent {
  return {
    id: row.id,
    noteId: row.note_id,
    content: row.content,
    updatedAt: row.updated_at,
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

export async function getCloudNotesData() {
  const { data: notesData, error: notesError } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  if (notesError) {
    throw notesError
  }

  const { data: contentsData, error: contentsError } = await supabase
    .from('note_contents')
    .select('*')
    .order('updated_at', { ascending: false })

  if (contentsError) {
    throw contentsError
  }

  return {
    notes: (notesData ?? []).map((row) =>
      mapSupabaseNoteToNote(row as SupabaseNoteRow),
    ),
    noteContents: (contentsData ?? []).map((row) =>
      mapSupabaseNoteContentToNoteContent(row as SupabaseNoteContentRow),
    ),
  }
}

export async function createCloudNote(input: CreateCloudNoteInput) {
  const user = await getAuthenticatedUser()
  const now = new Date().toISOString()

  const { data: noteData, error: noteError } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: input.title.trim() || 'Новая заметка',
      updated_at: now,
    })
    .select('*')
    .single()

  if (noteError) {
    throw noteError
  }

  const note = mapSupabaseNoteToNote(noteData as SupabaseNoteRow)

  const { data: contentData, error: contentError } = await supabase
    .from('note_contents')
    .insert({
      user_id: user.id,
      note_id: note.id,
      content: input.content ?? '',
      updated_at: now,
    })
    .select('*')
    .single()

  if (contentError) {
    await supabase.from('notes').delete().eq('id', note.id)
    throw contentError
  }

  return {
    note,
    noteContent: mapSupabaseNoteContentToNoteContent(
      contentData as SupabaseNoteContentRow,
    ),
  }
}

export async function updateCloudNote(
  noteId: string,
  input: UpdateCloudNoteInput,
) {
  const user = await getAuthenticatedUser()
  const now = new Date().toISOString()

  let updatedNote: Note | null = null
  let updatedNoteContent: NoteContent | null = null

  if (typeof input.title === 'string') {
    const { data, error } = await supabase
      .from('notes')
      .update({
        title: input.title,
        updated_at: now,
      })
      .eq('id', noteId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    updatedNote = mapSupabaseNoteToNote(data as SupabaseNoteRow)
  }

  if (typeof input.content === 'string') {
    const { data, error } = await supabase
      .from('note_contents')
      .upsert(
        {
          user_id: user.id,
          note_id: noteId,
          content: input.content,
          updated_at: now,
        },
        {
          onConflict: 'note_id',
        },
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    updatedNoteContent = mapSupabaseNoteContentToNoteContent(
      data as SupabaseNoteContentRow,
    )

    if (!updatedNote) {
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .update({
          updated_at: now,
        })
        .eq('id', noteId)
        .select('*')
        .single()

      if (noteError) {
        throw noteError
      }

      updatedNote = mapSupabaseNoteToNote(noteData as SupabaseNoteRow)
    }
  }

  return {
    note: updatedNote,
    noteContent: updatedNoteContent,
  }
}

export async function deleteCloudNote(noteId: string) {
  const { error } = await supabase.from('notes').delete().eq('id', noteId)

  if (error) {
    throw error
  }
}