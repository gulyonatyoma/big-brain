import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { deleteCalendarEvent } from '../model/eventActions'
import type { CalendarEvent } from '../types'

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

function EventList() {
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

  if (!events) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
        Загружаем события...
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
        Пока событий нет
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event: CalendarEvent) => (
        <article
          key={event.id}
          className="rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <div className="flex items-start justify-between gap-4">
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
              </div>

              <h3 className="text-lg font-semibold text-white">
                {event.title}
              </h3>

              {event.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {event.description}
                </p>
              ) : null}

              {typeof event.reminderMinutesBefore === 'number' ? (
                <p className="mt-3 text-xs text-slate-500">
                  Напоминание: за {event.reminderMinutesBefore} мин.
                </p>
              ) : null}
            </div>

            <button
              onClick={() => deleteCalendarEvent(event.id)}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Удалить
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

export default EventList