export type Note = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export type NoteContent = {
  id: string
  noteId: string
  content: string
  updatedAt: string
}