import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import NoteEditor from '../features/notes/components/NoteEditor'
import NotesList from '../features/notes/components/NotesList'
import { createNote } from '../features/notes/model/noteActions'

const PROCESSED_NOTE_CREATE_KEY_PREFIX =
  'big-brain-processed-note-create-request'

function NotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('')
  const [isCreatingNote, setIsCreatingNote] = useState(false)

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const noteIdFromUrl = searchParams.get('noteId')

    if (!noteIdFromUrl) {
      return
    }

    setSelectedNoteId(noteIdFromUrl)
    navigate('/notes', { replace: true })
  }, [navigate, searchParams])

  useEffect(() => {
    if (searchParams.get('create') !== '1') {
      return
    }

    const quickRequestId = searchParams.get('quick') ?? 'default'
    const processedKey = `${PROCESSED_NOTE_CREATE_KEY_PREFIX}-${quickRequestId}`

    if (window.sessionStorage.getItem(processedKey)) {
      navigate('/notes', { replace: true })
      return
    }

    window.sessionStorage.setItem(processedKey, '1')
    navigate('/notes', { replace: true })

    async function createQuickNote() {
      setIsCreatingNote(true)

      try {
        const note = await createNote({
          title: 'Новая заметка',
          content: '',
        })

        setSelectedNoteId(note.id)
      } finally {
        setIsCreatingNote(false)
      }
    }

    createQuickNote()
  }, [navigate, searchParams])

  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Блокнотики и идеи
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Заметки
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Здесь можно создавать отдельные блокнотики для мыслей, идей,
            планов, черновиков и быстрых заметок. Все изменения сохраняются
            автоматически.
          </p>

          {isCreatingNote ? (
            <p className="mt-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
              Создаём новую заметку...
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <NotesList
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
          />

          <NoteEditor selectedNoteId={selectedNoteId} />
        </div>
      </section>
    </main>
  )
}

export default NotesPage