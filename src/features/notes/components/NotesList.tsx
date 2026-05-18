import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { createNote, deleteNote } from '../model/noteActions'
import type { Note } from '../types'

type NotesListProps = {
  selectedNoteId?: string
  onSelectNote: (noteId: string) => void
}

type NoteSearchResult = {
  note: Note
  score: number
  matchedInTitle: boolean
  matchedInContent: boolean
  contentSnippet: string
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function normalizeText(value: string) {
  return value.toLowerCase().replaceAll('ё', 'е').trim()
}

function getSearchTokens(searchQuery: string) {
  return normalizeText(searchQuery)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [delayMs, value])

  return debouncedValue
}

function getContentSnippet(content: string, tokens: string[]) {
  if (!content.trim() || tokens.length === 0) {
    return ''
  }

  const normalizedContent = normalizeText(content)

  const firstMatchedToken = tokens.find((token) => {
    return normalizedContent.includes(token)
  })

  if (!firstMatchedToken) {
    return ''
  }

  const matchIndex = normalizedContent.indexOf(firstMatchedToken)
  const snippetStart = Math.max(0, matchIndex - 45)
  const snippetEnd = Math.min(content.length, matchIndex + 120)

  const prefix = snippetStart > 0 ? '...' : ''
  const suffix = snippetEnd < content.length ? '...' : ''

  return `${prefix}${content.slice(snippetStart, snippetEnd).trim()}${suffix}`
}

function getNoteSearchResult(
  note: Note,
  content: string,
  searchQuery: string,
): NoteSearchResult | null {
  const normalizedQuery = normalizeText(searchQuery)
  const tokens = getSearchTokens(searchQuery)

  if (!normalizedQuery || tokens.length === 0) {
    return {
      note,
      score: 1,
      matchedInTitle: false,
      matchedInContent: false,
      contentSnippet: '',
    }
  }

  const normalizedTitle = normalizeText(note.title)
  const normalizedContent = normalizeText(content)

  let score = 0

  const matchedInTitle =
    normalizedTitle.includes(normalizedQuery) ||
    tokens.some((token) => normalizedTitle.includes(token))

  const matchedInContent =
    normalizedContent.includes(normalizedQuery) ||
    tokens.some((token) => normalizedContent.includes(token))

  if (normalizedTitle.includes(normalizedQuery)) {
    score += 100
  }

  if (normalizedContent.includes(normalizedQuery)) {
    score += 45
  }

  tokens.forEach((token) => {
    if (normalizedTitle.includes(token)) {
      score += 20
    }

    if (normalizedContent.includes(token)) {
      score += 6
    }
  })

  const allTokensMatchedInTitle = tokens.every((token) => {
    return normalizedTitle.includes(token)
  })

  const allTokensMatchedSomewhere = tokens.every((token) => {
    return normalizedTitle.includes(token) || normalizedContent.includes(token)
  })

  if (allTokensMatchedInTitle) {
    score += 35
  }

  if (allTokensMatchedSomewhere) {
    score += 20
  }

  if (score <= 0) {
    return null
  }

  return {
    note,
    score,
    matchedInTitle,
    matchedInContent,
    contentSnippet: getContentSnippet(content, tokens),
  }
}

function NotesList({ selectedNoteId, onSelectNote }: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingNoteId, setDeletingNoteId] = useState('')

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250)
  const hasSearchQuery = debouncedSearchQuery.trim().length > 0

  const notesData = useLiveQuery(async () => {
    const savedNotes = await db.notes.toArray()

    const sortedNotes = savedNotes.sort((a, b) => {
      return b.updatedAt.localeCompare(a.updatedAt)
    })

    if (!hasSearchQuery) {
      return {
        notes: sortedNotes,
        noteContentsByNoteId: new Map<string, string>(),
      }
    }

    const savedNoteContents = await db.noteContents.toArray()
    const noteContentsByNoteId = new Map<string, string>()

    savedNoteContents.forEach((noteContent) => {
      noteContentsByNoteId.set(noteContent.noteId, noteContent.content)
    })

    return {
      notes: sortedNotes,
      noteContentsByNoteId,
    }
  }, [hasSearchQuery])

  const safeNotes = notesData?.notes ?? []
  const noteContentsByNoteId =
    notesData?.noteContentsByNoteId ?? new Map<string, string>()

  const searchResults = useMemo(() => {
    if (!hasSearchQuery) {
      return safeNotes.map((note) => {
        return {
          note,
          score: 1,
          matchedInTitle: false,
          matchedInContent: false,
          contentSnippet: '',
        }
      })
    }

    return safeNotes
      .map((note) => {
        const content = noteContentsByNoteId.get(note.id) ?? ''

        return getNoteSearchResult(note, content, debouncedSearchQuery)
      })
      .filter((result): result is NoteSearchResult => {
        return result !== null
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }

        return b.note.updatedAt.localeCompare(a.note.updatedAt)
      })
  }, [debouncedSearchQuery, hasSearchQuery, noteContentsByNoteId, safeNotes])

  async function handleCreateNote() {
    const note = await createNote({
      title: 'Новая заметка',
      content: '',
    })

    onSelectNote(note.id)
    setSearchQuery('')
  }

  async function handleDeleteNote(noteId: string) {
    const note = await db.notes.get(noteId)
    const noteTitle = note?.title || 'Без названия'

    const confirmed = window.confirm(`Удалить заметку “${noteTitle}”?`)

    if (!confirmed) {
      return
    }

    setDeletingNoteId(noteId)

    try {
      await deleteNote(noteId)

      if (selectedNoteId === noteId) {
        const remainingNotes = await db.notes.toArray()

        const nextNote = remainingNotes
          .filter((remainingNote) => remainingNote.id !== noteId)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

        if (nextNote) {
          onSelectNote(nextNote.id)
        } else {
          onSelectNote('')
        }
      }
    } finally {
      setDeletingNoteId('')
    }
  }

  function handleClearSearch() {
    setSearchQuery('')
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

      <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <label className="mb-2 block text-sm text-slate-400">
          Поиск по заметкам
        </label>

        <div className="flex flex-col gap-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Название или текст заметки..."
          />

          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Очистить поиск
            </button>
          ) : null}
        </div>

        {searchQuery.trim() ? (
          <p className="mt-3 text-xs text-slate-500">
            Найдено заметок: {searchResults.length}
          </p>
        ) : null}

        {searchQuery.trim() ? (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Сейчас поиск ищет по названию и тексту заметки. Смысловой поиск
            через embeddings добавим отдельным этапом.
          </p>
        ) : null}
      </div>

      {!notesData ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
          Загружаем заметки...
        </div>
      ) : safeNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
          Заметок пока нет. Нажми +, чтобы создать первую.
        </div>
      ) : searchResults.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
          По этому запросу заметок нет
        </div>
      ) : (
        <div className="space-y-3">
          {searchResults.map((result) => {
            const note = result.note
            const isSelected = note.id === selectedNoteId
            const isDeleting = deletingNoteId === note.id

            return (
              <article
                key={note.id}
                className={[
                  'rounded-2xl border p-4 transition',
                  isSelected
                    ? 'border-violet-400/30 bg-violet-500/15'
                    : 'border-white/10 bg-black/20 hover:bg-white/10',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectNote(note.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-medium text-white">
                      {note.title || 'Без названия'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Изменено: {formatDate(note.updatedAt)}
                    </p>

                    {hasSearchQuery ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.matchedInTitle ? (
                          <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-200">
                            В названии
                          </span>
                        ) : null}

                        {result.matchedInContent ? (
                          <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-200">
                            В тексте
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {hasSearchQuery && result.contentSnippet ? (
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                        {result.contentSnippet}
                      </p>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={isDeleting}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? 'Удаляем...' : 'Удалить'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotesList