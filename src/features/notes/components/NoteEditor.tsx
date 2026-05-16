import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { updateNote } from '../model/noteActions'

type NoteEditorProps = {
  selectedNoteId?: string
}

function NoteEditor({ selectedNoteId }: NoteEditorProps) {
  const note = useLiveQuery(async () => {
    if (!selectedNoteId) {
      return undefined
    }

    return db.notes.get(selectedNoteId)
  }, [selectedNoteId])

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  )

  useEffect(() => {
    if (!note) {
      setTitle('')
      setContent('')
      return
    }

    setTitle(note.title)
    setContent(note.content)
  }, [note])

  useEffect(() => {
    if (!note || !selectedNoteId) {
      return
    }

    if (title === note.title && content === note.content) {
      return
    }

    setSaveStatus('saving')

    const timeoutId = window.setTimeout(async () => {
      await updateNote(selectedNoteId, {
        title,
        content,
      })

      setSaveStatus('saved')

      window.setTimeout(() => {
        setSaveStatus('idle')
      }, 1200)
    }, 500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [title, content, note, selectedNoteId])

  if (!selectedNoteId) {
    return (
      <div className="flex min-h-[540px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-400">
        Выбери заметку слева или создай новую.
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex min-h-[540px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
        Загружаем заметку...
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm text-slate-400">Открытый блокнотик</p>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-slate-500"
            placeholder="Название заметки"
          />
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-400">
          {saveStatus === 'saving'
            ? 'Сохраняем...'
            : saveStatus === 'saved'
              ? 'Сохранено'
              : 'Автосохранение'}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="min-h-[460px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-5 text-base leading-7 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
        placeholder="Пиши сюда мысли, идеи, планы, заметки..."
      />
    </div>
  )
}

export default NoteEditor