import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { updateNote } from '../model/noteActions'

type NoteEditorProps = {
  selectedNoteId?: string
}

type SaveStatus = 'idle' | 'waiting' | 'saving' | 'saved' | 'error'

function NoteEditor({ selectedNoteId }: NoteEditorProps) {
  const note = useLiveQuery(async () => {
    if (!selectedNoteId) {
      return undefined
    }

    return db.notes.get(selectedNoteId)
  }, [selectedNoteId])

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const loadedNoteIdRef = useRef<string>('')
  const lastSavedTitleRef = useRef('')
  const lastSavedContentRef = useRef('')
  const savedStatusTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!note) {
      setTitle('')
      setContent('')
      setSaveStatus('idle')
      loadedNoteIdRef.current = ''
      lastSavedTitleRef.current = ''
      lastSavedContentRef.current = ''
      return
    }

    if (loadedNoteIdRef.current === note.id) {
      return
    }

    loadedNoteIdRef.current = note.id
    lastSavedTitleRef.current = note.title
    lastSavedContentRef.current = note.content

    setTitle(note.title)
    setContent(note.content)
    setSaveStatus('idle')
  }, [note])

  useEffect(() => {
    if (!selectedNoteId || loadedNoteIdRef.current !== selectedNoteId) {
      return
    }

    const isSameAsSaved =
      title === lastSavedTitleRef.current &&
      content === lastSavedContentRef.current

    if (isSameAsSaved) {
      return
    }

    setSaveStatus('waiting')

    const saveTimeoutId = window.setTimeout(async () => {
      setSaveStatus('saving')

      try {
        await updateNote(selectedNoteId, {
          title,
          content,
        })

        lastSavedTitleRef.current = title
        lastSavedContentRef.current = content

        setSaveStatus('saved')

        if (savedStatusTimeoutRef.current) {
          window.clearTimeout(savedStatusTimeoutRef.current)
        }

        savedStatusTimeoutRef.current = window.setTimeout(() => {
          setSaveStatus('idle')
        }, 1200)
      } catch (error) {
        console.error('Failed to save note', error)
        setSaveStatus('error')
      }
    }, 700)

    return () => {
      window.clearTimeout(saveTimeoutId)
    }
  }, [title, content, selectedNoteId])

  useEffect(() => {
    return () => {
      if (savedStatusTimeoutRef.current) {
        window.clearTimeout(savedStatusTimeoutRef.current)
      }
    }
  }, [])

  function getSaveStatusText() {
    if (saveStatus === 'waiting') {
      return 'Ожидаем паузу...'
    }

    if (saveStatus === 'saving') {
      return 'Сохраняем...'
    }

    if (saveStatus === 'saved') {
      return 'Сохранено'
    }

    if (saveStatus === 'error') {
      return 'Ошибка сохранения'
    }

    return 'Автосохранение'
  }

  function getSaveStatusClassName() {
    if (saveStatus === 'error') {
      return 'border-red-400/20 bg-red-500/10 text-red-200'
    }

    if (saveStatus === 'saved') {
      return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
    }

    if (saveStatus === 'saving' || saveStatus === 'waiting') {
      return 'border-violet-400/20 bg-violet-500/10 text-violet-200'
    }

    return 'border-white/10 bg-black/20 text-slate-400'
  }

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
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm text-slate-400">Открытый блокнотик</p>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-slate-500"
            placeholder="Название заметки"
          />
        </div>

        <div
          className={[
            'shrink-0 rounded-full border px-3 py-1 text-xs',
            getSaveStatusClassName(),
          ].join(' ')}
        >
          {getSaveStatusText()}
        </div>
      </div>

      {saveStatus === 'error' ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          Не удалось сохранить заметку. Проверь, что в браузере не очищено
          хранилище сайта, и попробуй обновить страницу.
        </div>
      ) : null}

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