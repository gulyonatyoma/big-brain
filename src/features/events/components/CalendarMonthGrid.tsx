import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { deleteCalendarEvent } from '../model/eventActions'
import { doesEventOccurOnDate } from '../model/eventDateUtils'
import type { CalendarEvent } from '../types'

function toDateString(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function getMonthTitle(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDayTitle(dateString: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date(dateString))
}

function getCalendarDays(currentDate: Date) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const firstWeekday = firstDayOfMonth.getDay()
  const mondayBasedFirstWeekday = firstWeekday === 0 ? 7 : firstWeekday

  const daysBeforeMonth = mondayBasedFirstWeekday - 1
  const totalDaysInMonth = lastDayOfMonth.getDate()

  const days: Array<{
    date: string
    dayNumber: number
    isCurrentMonth: boolean
  }> = []

  for (let i = daysBeforeMonth; i > 0; i -= 1) {
    const date = new Date(year, month, 1 - i)

    days.push({
      date: toDateString(date),
      dayNumber: date.getDate(),
      isCurrentMonth: false,
    })
  }

  for (let day = 1; day <= totalDaysInMonth; day += 1) {
    const date = new Date(year, month, day)

    days.push({
      date: toDateString(date),
      dayNumber: day,
      isCurrentMonth: true,
    })
  }

  while (days.length % 7 !== 0) {
    const nextDayIndex = days.length - daysBeforeMonth - totalDaysInMonth + 1
    const date = new Date(year, month + 1, nextDayIndex)

    days.push({
      date: toDateString(date),
      dayNumber: date.getDate(),
      isCurrentMonth: false,
    })
  }

  return days
}

function formatRepeatLabel(event: CalendarEvent) {
  if (event.repeatType === 'none') {
    return ''
  }

  const interval = event.repeatInterval ?? 1

  if (event.repeatType === 'daily') {
    return interval === 1 ? 'каждый день' : `раз в ${interval} дн.`
  }

  if (event.repeatType === 'weekly') {
    return interval === 1 ? 'каждую неделю' : `раз в ${interval} нед.`
  }

  if (event.repeatType === 'monthly') {
    return interval === 1 ? 'каждый месяц' : `раз в ${interval} мес.`
  }

  return ''
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

function CalendarMonthGrid() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<string>('')

  const currentDate = new Date()
  const days = getCalendarDays(currentDate)
  const monthTitle = getMonthTitle(currentDate)

  const firstDate = days[0]?.date
  const lastDate = days[days.length - 1]?.date

  const events = useLiveQuery(async () => {
    if (!firstDate || !lastDate) {
      return []
    }

    const calendarEvents = await db.events.toArray()

    return calendarEvents.filter((event) => {
      return event.date <= lastDate
    })
  }, [firstDate, lastDate])

  const eventsByDate = new Map<string, CalendarEvent[]>()

  days.forEach((day) => {
    const dayEvents = (events ?? [])
      .filter((event) => doesEventOccurOnDate(event, day.date))
      .sort((a, b) => {
        return (a.startTime ?? '').localeCompare(b.startTime ?? '')
      })

    eventsByDate.set(day.date, dayEvents)
  })

  const today = toDateString(new Date())

  const selectedDayEvents = selectedDate
    ? eventsByDate.get(selectedDate) ?? []
    : []

  async function handleDeleteEvent(event: CalendarEvent) {
    const repeatLabel = formatRepeatLabel(event)

    const message = repeatLabel
      ? `Удалить регулярное событие “${event.title}”? Будет удалена вся серия: ${repeatLabel}.`
      : `Удалить событие “${event.title}”?`

    const confirmed = window.confirm(message)

    if (!confirmed) {
      return
    }

    setDeletingEventId(event.id)

    try {
      await deleteCalendarEvent(event.id)
    } finally {
      setDeletingEventId('')
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Текущий месяц</p>
            <h2 className="text-2xl font-semibold capitalize">
              {monthTitle}
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[760px] grid-cols-7 gap-3 text-center text-sm">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
              <div key={day} className="text-slate-400">
                {day}
              </div>
            ))}

            {days.map((day) => {
              const dayEvents = eventsByDate.get(day.date) ?? []
              const isToday = day.date === today

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={[
                    'min-h-28 rounded-2xl border p-3 text-left transition hover:border-violet-400/50 hover:bg-white/10',
                    isToday
                      ? 'border-violet-400/60 bg-violet-500/10'
                      : 'border-white/10 bg-black/20',
                    day.isCurrentMonth ? 'opacity-100' : 'opacity-40',
                  ].join(' ')}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-300">
                      {day.dayNumber}
                    </span>

                    {dayEvents.length > 0 ? (
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                        {dayEvents.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => {
                      const repeatLabel = formatRepeatLabel(event)

                      return (
                        <div
                          key={`${day.date}-${event.id}`}
                          className="truncate rounded-lg bg-sky-500/10 px-2 py-1 text-xs text-sky-100"
                          title={event.title}
                        >
                          {event.startTime ? `${event.startTime} · ` : ''}
                          {event.title}
                          {repeatLabel ? ` · ${repeatLabel}` : ''}
                        </div>
                      )
                    })}

                    {dayEvents.length > 2 ? (
                      <div className="px-2 text-xs text-slate-500">
                        ещё {dayEvents.length - 2}
                      </div>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {selectedDate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedDate(null)}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/50">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-violet-300">События дня</p>

                <h2 className="mt-1 text-2xl font-semibold capitalize text-white">
                  {formatDayTitle(selectedDate)}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Всего событий: {selectedDayEvents.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Закрыть
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                На этот день событий нет
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => {
                  const repeatLabel = formatRepeatLabel(event)
                  const reminderLabel = formatReminderLabel(event)
                  const isDeleting = deletingEventId === event.id

                  return (
                    <article
                      key={`${selectedDate}-${event.id}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200">
                          {formatTimeRange(event)}
                        </span>

                        {repeatLabel ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                            {repeatLabel}
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                            Без повтора
                          </span>
                        )}

                        {reminderLabel ? (
                          <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                            Напоминание: {reminderLabel}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-white">
                            {event.title}
                          </h3>

                          {event.description ? (
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {event.description}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event)}
                          disabled={isDeleting}
                          className="shrink-0 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>
      ) : null}
    </>
  )
}

export default CalendarMonthGrid