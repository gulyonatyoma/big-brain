import { useState, type FormEvent } from 'react'
import { updateTask } from '../model/taskActions'
import type { Task, TaskPriority } from '../types'

type EditTaskFormProps = {
  task: Task
  onSaved?: () => void
  onCancel?: () => void
}

const priorityOptions: Array<{
  value: TaskPriority
  label: string
}> = [
  {
    value: 'low',
    label: 'Низкий',
  },
  {
    value: 'medium',
    label: 'Средний',
  },
  {
    value: 'high',
    label: 'Высокий',
  },
]

function EditTaskForm({ task, onSaved, onCancel }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await updateTask(task.id, {
        title,
        description,
        dueDate,
        priority,
      })

      onSaved?.()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось сохранить задачу'

      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-black/20 p-5"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Редактировать задачу
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Измени название, описание, дату или приоритет.
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

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-slate-400">
            Название задачи
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Например: подготовить план, купить продукты"
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

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Приоритет
            </label>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TaskPriority)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default EditTaskForm