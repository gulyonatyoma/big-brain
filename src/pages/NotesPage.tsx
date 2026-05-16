import { useState } from 'react'
import NoteEditor from '../features/notes/components/NoteEditor'
import NotesList from '../features/notes/components/NotesList'

function NotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('')

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