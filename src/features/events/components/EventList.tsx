import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { deleteCalendarEvent } from '../model/eventActions'
import type { CalendarEvent } from '../types'
import EditEventForm from './EditEventForm'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function formatTimeRange(event: CalendarEvent) {
  if (event.startTime && event.endTime) {
    return `${event.startTime}–${event.endTime}`
  }

  if (event.startTime) {
    return `с ${event.startTime}`
  }

  if (event.endTime) {
    return `до ${event.endTime}`
  }

  return 'Время не указано'
}

function formatRepeatLabel(event: CalendarEvent) {
  const interval = event.repeatInterval ?? 1

  if (event.repeatType === 'none') {
    return 'Без повтора'
  }

  if (event.repeatType === 'daily') {
    return interval === 1 ? 'Каждый день' : `Каждые ${interval} дн.`
  }

  if (event.repeatType === 'weekly') {
    return interval === 1 ? 'Каждую неделю' : `Каждые ${interval} нед.`
  }

  if (event.repeatType === 'monthly') {
    return interval === 1 ? 'Каждый месяц' : `Каждые ${interval} мес.`
  }

  return 'Без повтора'
}

function formatReminderLabel(event: CalendarEvent) {
  if (typeof event.reminderMinutesBefore !== 'number') {
    return ''
  }

  if (event.reminderMinutesBefore === 0) {
    return 'В момент события'
  }

  if (event.reminderMinutesBefore === 1) {
    return 'За 1 минуту'
  }

  if (event.reminderMinutesBefore === 60) {
    return 'За 1 час'
  }

  return `За ${event.reminderMinutesBefore} мин.`
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

function matchesSearch(event: CalendarEvent, searchQuery: string) {
  const normalizedQuery = normalizeText(searchQuery)
  const tokens = getSearchTokens(searchQuery)

  if (!normalizedQuery || tokens.length === 0) {
    return true
  }

  const searchableText = normalizeText(
    [
      event.title,
      event.description ?? '',
      event.date,
      formatDate(event.date),
      event.startTime ?? '',
      event.endTime ?? '',
      formatTimeRange(event),
      formatRepeatLabel(event),
      formatReminderLabel(event),
    ].join(' '),
  )

  return tokens.every((token) => searchableText.includes(token))
}

function getMatchLabel(event: CalendarEvent, searchQuery: string) {
  const tokens = getSearchTokens(searchQuery)

  if (tokens.length === 0) {
    return ''
  }

  const title = normalizeText(event.title)
  const description = normalizeText(event.description ?? '')
  const date = normalizeText(`${event.date} ${formatDate(event.date)}`)
  const time = normalizeText(formatTimeRange(event))
  const repeat = normalizeText(formatRepeatLabel(event))

  const hasTitleMatch = tokens.some((token) => title.includes(token))
  const hasDescriptionMatch = tokens.some((token) =>
    description.includes(token),
  )
  const hasDateMatch = tokens.some((token) => date.includes(token))
  const hasTimeMatch = tokens.some((token) => time.includes(token))
  const hasRepeatMatch = tokens.some((token) => repeat.includes(token))

  if (hasTitleMatch) {
    return 'В названии'
  }

  if (hasDescriptionMatch) {
    return 'В описании'
  }

  if (hasDateMatch) {
    return 'В дате'
  }

  if (hasTimeMatch) {
    return 'Во времени'
  }

  if (hasRepeatMatch) {
    return 'В повторении'
  }

  return 'Совпадение'
}

function EventList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingEventId, setEditingEventId] = useState('')
  const [deletingEventId, setDeletingEventId] = useState('')

  const events = useLiveQuery(async () => {
    const calendarEvents = await db.events.toArray()

    return calendarEvents.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)

      if (dateCompare !== 0) {
        return dateCompare
      }

      return (a.startTime ?? '').localeCompare(b.startTime ?? '')
    })
  }, [])

  const visibleEvents = useMemo(() => {
    return (events ?? []).filter((event) => {
      return matchesSearch(event, searchQuery)
    })
  }, [events, searchQuery])

  async function handleDeleteEvent(event: CalendarEvent) {
    const repeatLabel = formatRepeatLabel(event)

    const message =
      event.repeatType === 'none'
        ? `Удалить событие “${event.title}”?`
        : `Удалить регулярное событие “${event.title}”? Будет удалена вся серия: ${repeatLabel}.`

    const confirmed = window.confirm(message)

    if (!confirmed) {
      return
    }

    setDeletingEventId(event.id)

    try {
      await deleteCalendarEvent(event.id)

      if (editingEventId === event.id) {
        setEditingEventId('')
      }
    } finally {
      setDeletingEventId('')
    }
  }

  function handleClearSearch() {
    setSearchQuery('')
    setEditingEventId('')
  }

  if (!events) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
        Загружаем события...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="mb-2 block text-sm text-slate-400">
          Поиск по событиям
        </label>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setEditingEventId('')
            }}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Например: созвон, тренировка, 15:30, каждую неделю..."
          />

          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Очистить
            </button>
          ) : null}
        </div>

        {searchQuery.trim() ? (
          <p className="mt-3 text-sm text-slate-500">
            Найдено событий: {visibleEvents.length}
          </p>
        ) : null}
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
          Пока событий нет
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
          По этому запросу событий нет
        </div>
      ) : (
        <div className="space-y-3">
          {visibleEvents.map((event: CalendarEvent) => {
            const isEditing = editingEventId === event.id
            const isDeleting = deletingEventId === event.id
            const matchLabel = getMatchLabel(event, searchQuery)

            if (isEditing) {
              return (
                <div key={event.id}>
                  <EditEventForm
                    event={event}
                    onSaved={() => setEditingEventId('')}
                    onCancel={() => setEditingEventId('')}
                  />
                </div>
              )
            }

            return (
              <article
                key={event.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                        {formatDate(event.date)}
                      </span>

                      <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200">
                        {formatTimeRange(event)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                        {formatRepeatLabel(event)}
                      </span>

                      {searchQuery.trim() && matchLabel ? (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                          {matchLabel}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-lg font-semibold text-white">
                      {event.title}
                    </h3>

                    {event.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {event.description}
                      </p>
                    ) : null}

                    {formatReminderLabel(event) ? (
                      <p className="mt-3 text-xs text-slate-500">
                        Напоминание: {formatReminderLabel(event)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingEventId(event.id)}
                      className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
                    >
                      Изменить
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(event)}
                      disabled={isDeleting}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? 'Удаляем...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EventList