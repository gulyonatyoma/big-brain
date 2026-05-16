import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { createNote, deleteNote } from '../model/noteActions'
import type { Note } from '../types'

type NotesListProps = {
  selectedNoteId?: string
  onSelectNote: (noteId: string) => void
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function NotesList({ selectedNoteId, onSelectNote }: NotesListProps) {
  const notes = useLiveQuery(async () => {
    const savedNotes = await db.notes.toArray()

    return savedNotes.sort((a, b) => {
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [])

  async function handleCreateNote() {
    const note = await createNote({
      title: 'Новая заметка',
      content: '',
    })

    onSelectNote(note.id)
  }

  async function handleDeleteNote(noteId: string) {
    await deleteNote(noteId)

    if (selectedNoteId === noteId) {
      const remainingNotes = await db.notes.toArray()
      const nextNote = remainingNotes
        .filter((note) => note.id !== noteId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

      if (nextNote) {
        onSelectNote(nextNote.id)
      } else {
        onSelectNote('')
      }
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Блокнотики</h2>

          <p className="mt-1 text-sm text-slate-400">
            Список твоих заметок
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNote}
          className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          +
        </button>
      </div>

      {!notes ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
          Загружаем заметки...
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
          Заметок пока нет. Нажми +, чтобы создать первую.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note: Note) => {
            const isSelected = note.id === selectedNoteId

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note.id)}
                className={[
                  'w-full rounded-2xl border p-4 text-left transition',
                  isSelected
                    ? 'border-violet-400/30 bg-violet-500/15'
                    : 'border-white/10 bg-black/20 hover:bg-white/10',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {note.title || 'Без названия'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Изменено: {formatDate(note.updatedAt)}
                    </p>
                  </div>

                  <span
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDeleteNote(note.id)
                    }}
                    className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-red-500/10 hover:text-red-200"
                  >
                    Удалить
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotesList