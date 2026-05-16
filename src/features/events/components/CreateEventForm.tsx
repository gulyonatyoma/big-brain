import { useState, type FormEvent } from 'react'
import { createCalendarEvent } from '../model/eventActions'
import type { EventRepeatType } from '../types'

type CreateEventFormProps = {
  onCreated?: () => void
  onCancel?: () => void
}

const repeatOptions: Array<{
  value: EventRepeatType
  label: string
}> = [
  {
    value: 'none',
    label: 'Не повторять',
  },
  {
    value: 'daily',
    label: 'По дням',
  },
  {
    value: 'weekly',
    label: 'По неделям',
  },
  {
    value: 'monthly',
    label: 'По месяцам',
  },
]

const repeatUnitLabels: Record<EventRepeatType, string> = {
  none: '',
  daily: 'дн.',
  weekly: 'нед.',
  monthly: 'мес.',
}

function CreateEventForm({ onCreated, onCancel }: CreateEventFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [repeatType, setRepeatType] = useState<EventRepeatType>('none')
  const [repeatInterval, setRepeatInterval] = useState('1')
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState('15')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRepeating = repeatType !== 'none'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim() || !date) {
      return
    }

    const normalizedRepeatInterval = Math.max(1, Number(repeatInterval) || 1)

    setIsSubmitting(true)

    try {
      await createCalendarEvent({
        title,
        description,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        repeatType,
        repeatInterval: isRepeating ? normalizedRepeatInterval : 1,
        reminderMinutesBefore: Number(reminderMinutesBefore),
      })

      setTitle('')
      setDescription('')
      setDate('')
      setStartTime('')
      setEndTime('')
      setRepeatType('none')
      setRepeatInterval('1')
      setReminderMinutesBefore('15')

      onCreated?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-white/5 p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Создать событие
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Добавь событие в календарь и настрой регулярность.
          </p>
        </div>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Закрыть
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-slate-400">
            Название события
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Например: созвон, тренировка, встреча"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-400">
            Описание
          </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Дополнительные детали события..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Дата
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Начало
            </label>

            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Конец
            </label>

            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">Регулярность</p>
              <p className="mt-1 text-sm text-slate-400">
                Можно настроить событие раз в 2 недели, раз в 3 дня и так далее.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_160px]">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Тип повторения
              </label>

              <select
                value={repeatType}
                onChange={(event) => {
                  setRepeatType(event.target.value as EventRepeatType)
                  setRepeatInterval('1')
                }}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60"
              >
                {repeatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Интервал
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={repeatInterval}
                  disabled={!isRepeating}
                  onChange={(event) => setRepeatInterval(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60 disabled:cursor-not-allowed disabled:opacity-40"
                />

                {isRepeating ? (
                  <span className="min-w-10 text-sm text-slate-400">
                    {repeatUnitLabels[repeatType]}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {isRepeating ? (
            <p className="mt-3 text-sm text-violet-200">
              Событие будет повторяться каждые {repeatInterval || 1}{' '}
              {repeatUnitLabels[repeatType]}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Событие будет создано только на выбранную дату.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-400">
            Напомнить за
          </label>

          <select
            value={reminderMinutesBefore}
            onChange={(event) => setReminderMinutesBefore(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60"
          >
            <option value="0">В момент события</option>
            <option value="1">За 1 минуту</option>
            <option value="5">За 5 минут</option>
            <option value="15">За 15 минут</option>
            <option value="30">За 30 минут</option>
            <option value="60">За 1 час</option>
          </select>
        </div>

        <div className="flex gap-3">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Отмена
            </button>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !date}
            className="flex-1 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Создаём...' : 'Создать событие'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default CreateEventForm