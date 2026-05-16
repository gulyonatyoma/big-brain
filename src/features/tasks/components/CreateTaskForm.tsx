import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createTask } from '../model/taskActions'
import type { TaskPriority } from '../types'

type CreateTaskFormProps = {
  onCreated?: () => void
  onCancel?: () => void
}

const priorityOptions: Array<{
  value: TaskPriority
  label: string
  description: string
  className: string
}> = [
  {
    value: 'low',
    label: 'Низкий',
    description: 'Можно сделать позже',
    className: 'bg-slate-500/15 text-slate-200 border-slate-400/20',
  },
  {
    value: 'medium',
    label: 'Средний',
    description: 'Обычная задача',
    className: 'bg-sky-500/15 text-sky-200 border-sky-400/20',
  },
  {
    value: 'high',
    label: 'Высокий',
    description: 'Важно сделать скорее',
    className: 'bg-red-500/15 text-red-200 border-red-400/20',
  },
]

function CreateTaskForm({ onCreated, onCancel }: CreateTaskFormProps) {
  const priorityDropdownRef = useRef<HTMLDivElement | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedPriority = priorityOptions.find((option) => option.value === priority)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!priorityDropdownRef.current) {
        return
      }

      if (!priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      await createTask({
        title,
        description,
        dueDate: dueDate || undefined,
        priority,
      })

      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
      setIsPriorityOpen(false)

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
            Создать задачу
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Добавь дело, которое нужно выполнить.
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
            Название задачи
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Например: разобрать проект"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-400">
            Описание
          </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Дополнительные детали задачи..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Дата
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60"
            />
          </div>

          <div ref={priorityDropdownRef} className="relative">
            <label className="mb-2 block text-sm text-slate-400">
              Приоритет
            </label>

            <button
              type="button"
              onClick={() => setIsPriorityOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left outline-none transition hover:border-violet-400/50"
            >
              <span>
                <span className="block text-sm font-semibold text-white">
                  {selectedPriority?.label}
                </span>

                <span className="mt-0.5 block text-xs text-slate-500">
                  {selectedPriority?.description}
                </span>
              </span>

              <span
                className={[
                  'text-sm text-slate-400 transition',
                  isPriorityOpen ? 'rotate-180' : '',
                ].join(' ')}
              >
                ▼
              </span>
            </button>

            {isPriorityOpen ? (
              <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPriority(option.value)
                      setIsPriorityOpen(false)
                    }}
                    className={[
                      'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/10',
                      priority === option.value ? 'bg-white/10' : '',
                    ].join(' ')}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-white">
                        {option.label}
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        {option.description}
                      </span>
                    </span>

                    <span
                      className={[
                        'rounded-full border px-3 py-1 text-xs font-medium',
                        option.className,
                      ].join(' ')}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
            disabled={isSubmitting || !title.trim()}
            className="flex-1 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Создаём...' : 'Создать задачу'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default CreateTaskForm