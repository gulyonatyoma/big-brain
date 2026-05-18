import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { deleteCalendarEvent } from '../model/eventActions'
import { doesEventOccurOnDate } from '../model/eventDateUtils'
import type { CalendarEvent } from '../types'
import EditEventForm from './EditEventForm'

function getTodayDateString() {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10)
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

function TodayEventList() {
  const [editingEventId, setEditingEventId] = useState('')
  const [deletingEventId, setDeletingEventId] = useState('')

  const events = useLiveQuery(async () => {
    const today = getTodayDateString()

    const calendarEvents = await db.events.toArray()

    return calendarEvents
      .filter((event) => doesEventOccurOnDate(event, today))
      .sort((a, b) => {
        return (a.startTime ?? '').localeCompare(b.startTime ?? '')
      })
  }, [])

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

  if (!events) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
        Загружаем события на сегодня...
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
        На сегодня событий нет
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event: CalendarEvent) => {
        const isEditing = editingEventId === event.id
        const isDeleting = deletingEventId === event.id
        const reminderLabel = formatReminderLabel(event)

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
                  <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200">
                    {formatTimeRange(event)}
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                    {formatRepeatLabel(event)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white">
                  {event.title}
                </h3>

                {event.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {event.description}
                  </p>
                ) : null}

                {reminderLabel ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Напоминание: {reminderLabel}
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
  )
}

export default TodayEventList