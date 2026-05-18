import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { deleteTask, restoreTask } from '../model/taskActions'
import type { Task, TaskPriority } from '../types'
import EditTaskForm from './EditTaskForm'

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

const priorityClasses: Record<TaskPriority, string> = {
  low: 'border-slate-400/20 bg-slate-500/10 text-slate-300',
  medium: 'border-sky-400/20 bg-sky-500/10 text-sky-200',
  high: 'border-red-400/20 bg-red-500/10 text-red-200',
}

function formatDate(date?: string) {
  if (!date) {
    return 'Без даты'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
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

function matchesSearch(task: Task, searchQuery: string) {
  const normalizedQuery = normalizeText(searchQuery)
  const tokens = getSearchTokens(searchQuery)

  if (!normalizedQuery || tokens.length === 0) {
    return true
  }

  const searchableText = normalizeText(
    [
      task.title,
      task.description ?? '',
      task.dueDate ?? '',
      task.completedAt ?? '',
      formatDate(task.dueDate),
      formatDate(task.completedAt),
      priorityLabels[task.priority],
    ].join(' '),
  )

  return tokens.every((token) => searchableText.includes(token))
}

function getMatchLabel(task: Task, searchQuery: string) {
  const tokens = getSearchTokens(searchQuery)

  if (tokens.length === 0) {
    return ''
  }

  const title = normalizeText(task.title)
  const description = normalizeText(task.description ?? '')
  const dueDate = normalizeText(`${task.dueDate ?? ''} ${formatDate(task.dueDate)}`)
  const completedAt = normalizeText(
    `${task.completedAt ?? ''} ${formatDate(task.completedAt)}`,
  )
  const priority = normalizeText(priorityLabels[task.priority])

  const hasTitleMatch = tokens.some((token) => title.includes(token))
  const hasDescriptionMatch = tokens.some((token) =>
    description.includes(token),
  )
  const hasDueDateMatch = tokens.some((token) => dueDate.includes(token))
  const hasCompletedAtMatch = tokens.some((token) =>
    completedAt.includes(token),
  )
  const hasPriorityMatch = tokens.some((token) => priority.includes(token))

  if (hasTitleMatch) {
    return 'В названии'
  }

  if (hasDescriptionMatch) {
    return 'В описании'
  }

  if (hasDueDateMatch) {
    return 'В дате задачи'
  }

  if (hasCompletedAtMatch) {
    return 'В дате выполнения'
  }

  if (hasPriorityMatch) {
    return 'В приоритете'
  }

  return 'Совпадение'
}

function CompletedTaskList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTaskId, setEditingTaskId] = useState('')
  const [restoringTaskId, setRestoringTaskId] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState('')

  const tasks = useLiveQuery(async () => {
    const completedTasks = await db.tasks
      .where('status')
      .equals('completed')
      .toArray()

    return completedTasks.sort((a, b) => {
      return (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
    })
  }, [])

  const visibleTasks = useMemo(() => {
    return (tasks ?? []).filter((task) => {
      return matchesSearch(task, searchQuery)
    })
  }, [searchQuery, tasks])

  async function handleRestoreTask(taskId: string) {
    setRestoringTaskId(taskId)

    try {
      await restoreTask(taskId)

      if (editingTaskId === taskId) {
        setEditingTaskId('')
      }
    } finally {
      setRestoringTaskId('')
    }
  }

  async function handleDeleteTask(task: Task) {
    const confirmed = window.confirm(`Удалить задачу “${task.title}”?`)

    if (!confirmed) {
      return
    }

    setDeletingTaskId(task.id)

    try {
      await deleteTask(task.id)

      if (editingTaskId === task.id) {
        setEditingTaskId('')
      }
    } finally {
      setDeletingTaskId('')
    }
  }

  function handleClearSearch() {
    setSearchQuery('')
    setEditingTaskId('')
  }

  if (!tasks) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
        Загружаем архив...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="mb-2 block text-sm text-slate-400">
          Поиск по архиву
        </label>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setEditingTaskId('')
            }}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
            placeholder="Название, описание, дата, приоритет..."
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
            Найдено выполненных задач: {visibleTasks.length}
          </p>
        ) : null}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
          Выполненные задачи появятся здесь
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
          По этому запросу выполненных задач нет
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task: Task) => {
            const isEditing = editingTaskId === task.id
            const isRestoring = restoringTaskId === task.id
            const isDeleting = deletingTaskId === task.id
            const matchLabel = getMatchLabel(task, searchQuery)

            if (isEditing) {
              return (
                <div key={task.id}>
                  <EditTaskForm
                    task={task}
                    onSaved={() => setEditingTaskId('')}
                    onCancel={() => setEditingTaskId('')}
                  />
                </div>
              )
            }

            return (
              <article
                key={task.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-medium',
                          priorityClasses[task.priority],
                        ].join(' ')}
                      >
                        {priorityLabels[task.priority]}
                      </span>

                      <span className="text-xs text-slate-500">
                        Дата задачи: {formatDate(task.dueDate)}
                      </span>

                      {searchQuery.trim() && matchLabel ? (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                          {matchLabel}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-lg font-semibold text-white">
                      {task.title}
                    </h3>

                    {task.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {task.description}
                      </p>
                    ) : null}

                    {task.completedAt ? (
                      <p className="mt-3 text-xs text-slate-500">
                        Выполнено: {formatDate(task.completedAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(task.id)}
                      className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
                    >
                      Изменить
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRestoreTask(task.id)}
                      disabled={isRestoring}
                      className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRestoring ? 'Возвращаем...' : 'Вернуть'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
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

export default CompletedTaskList