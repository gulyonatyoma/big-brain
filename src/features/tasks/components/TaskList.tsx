import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { getTodayDateString } from '../../../shared/lib/dateTime'
import { completeTask, deleteTask } from '../model/taskActions'
import type { Task, TaskPriority } from '../types'
import EditTaskForm from './EditTaskForm'

type TaskFilter = 'all' | 'today' | 'overdue' | 'upcoming' | 'without-date'

type FocusDurationOption = {
  label: string
  seconds: number
}

const focusDurationOptions: FocusDurationOption[] = [
  {
    label: '10 сек',
    seconds: 10,
  },
  {
    label: '25 мин',
    seconds: 25 * 60,
  },
  {
    label: '45 мин',
    seconds: 45 * 60,
  },
  {
    label: '60 мин',
    seconds: 60 * 60,
  },
]

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

const filterLabels: Record<TaskFilter, string> = {
  all: 'Все',
  today: 'Сегодня',
  overdue: 'Просроченные',
  upcoming: 'Ближайшие',
  'without-date': 'Без даты',
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

function getDateStringWithOffset(daysOffset: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)

  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function getTaskFilterLabel(task: Task) {
  const today = getTodayDateString()

  if (!task.dueDate) {
    return 'Без даты'
  }

  if (task.dueDate < today) {
    return 'Просрочено'
  }

  if (task.dueDate === today) {
    return 'Сегодня'
  }

  return formatDate(task.dueDate)
}

function matchesFilter(task: Task, filter: TaskFilter) {
  const today = getTodayDateString()
  const nextSevenDays = getDateStringWithOffset(7)

  if (filter === 'all') {
    return true
  }

  if (filter === 'today') {
    return task.dueDate === today
  }

  if (filter === 'overdue') {
    return Boolean(task.dueDate && task.dueDate < today)
  }

  if (filter === 'upcoming') {
    return Boolean(
      task.dueDate && task.dueDate > today && task.dueDate <= nextSevenDays,
    )
  }

  if (filter === 'without-date') {
    return !task.dueDate
  }

  return true
}

function matchesSearch(task: Task, searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const searchableText = [
    task.title,
    task.description ?? '',
    task.dueDate ?? '',
    priorityLabels[task.priority],
  ]
    .join(' ')
    .toLowerCase()

  return searchableText.includes(normalizedQuery)
}

function sortTasks(tasks: Task[]) {
  const priorityWeight: Record<TaskPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  }

  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate)
    }

    if (a.dueDate && !b.dueDate) {
      return -1
    }

    if (!a.dueDate && b.dueDate) {
      return 1
    }

    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority]
    }

    return b.createdAt.localeCompare(a.createdAt)
  })
}

function getQuickFocusUrl(task: Task, durationSeconds: number) {
  const params = new URLSearchParams({
    quickFocus: '1',
    quick: String(Date.now()),
    taskId: task.id,
    taskTitle: task.title,
    durationSeconds: String(durationSeconds),
  })

  return `/focus?${params.toString()}`
}

function getCustomFocusSeconds(customFocusMinutes: string) {
  const normalizedValue = customFocusMinutes.replace(',', '.')
  const minutes = Number(normalizedValue)

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null
  }

  const limitedMinutes = Math.min(minutes, 240)

  return Math.round(limitedMinutes * 60)
}

function TaskList() {
  const navigate = useNavigate()

  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTaskId, setEditingTaskId] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState('')
  const [completingTaskId, setCompletingTaskId] = useState('')
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [customFocusMinutes, setCustomFocusMinutes] = useState('25')

  const tasks = useLiveQuery(async () => {
    const activeTasks = await db.tasks.where('status').equals('active').toArray()

    return sortTasks(activeTasks)
  }, [])

  const safeTasks = tasks ?? []

  const visibleTasks = useMemo(() => {
    return safeTasks.filter((task) => {
      return matchesFilter(task, activeFilter) && matchesSearch(task, searchQuery)
    })
  }, [activeFilter, safeTasks, searchQuery])

  const filterCounts: Record<TaskFilter, number> = {
    all: safeTasks.filter((task) => matchesSearch(task, searchQuery)).length,
    today: safeTasks.filter((task) => {
      return matchesFilter(task, 'today') && matchesSearch(task, searchQuery)
    }).length,
    overdue: safeTasks.filter((task) => {
      return matchesFilter(task, 'overdue') && matchesSearch(task, searchQuery)
    }).length,
    upcoming: safeTasks.filter((task) => {
      return matchesFilter(task, 'upcoming') && matchesSearch(task, searchQuery)
    }).length,
    'without-date': safeTasks.filter((task) => {
      return (
        matchesFilter(task, 'without-date') && matchesSearch(task, searchQuery)
      )
    }).length,
  }

  const customFocusSeconds = getCustomFocusSeconds(customFocusMinutes)

  async function handleCompleteTask(taskId: string) {
    setCompletingTaskId(taskId)

    try {
      await completeTask(taskId)

      if (editingTaskId === taskId) {
        setEditingTaskId('')
      }
    } finally {
      setCompletingTaskId('')
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

      if (focusTask?.id === task.id) {
        setFocusTask(null)
      }
    } finally {
      setDeletingTaskId('')
    }
  }

  function handleOpenFocusPicker(task: Task) {
    setEditingTaskId('')
    setCustomFocusMinutes('25')
    setFocusTask(task)
  }

  function handleCloseFocusPicker() {
    setFocusTask(null)
    setCustomFocusMinutes('25')
  }

  function handleStartFocus(durationSeconds: number) {
    if (!focusTask) {
      return
    }

    navigate(getQuickFocusUrl(focusTask, durationSeconds))
    handleCloseFocusPicker()
  }

  function handleStartCustomFocus() {
    if (!customFocusSeconds) {
      return
    }

    handleStartFocus(customFocusSeconds)
  }

  function handleClearSearch() {
    setSearchQuery('')
    setEditingTaskId('')
  }

  if (!tasks) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
        Загружаем задачи...
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <label className="mb-2 block text-sm text-slate-400">
            Поиск по задачам
          </label>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setEditingTaskId('')
              }}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/60"
              placeholder="Например: созвон, купить, проект, high..."
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
              Найдено задач: {visibleTasks.length}
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {(Object.keys(filterLabels) as TaskFilter[]).map((filter) => {
              const isActive = activeFilter === filter

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setActiveFilter(filter)
                    setEditingTaskId('')
                  }}
                  className={[
                    'rounded-2xl border px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'border-violet-400/40 bg-violet-500 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
                  ].join(' ')}
                >
                  {filterLabels[filter]}
                  <span className="ml-2 text-xs opacity-75">
                    {filterCounts[filter]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {safeTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
            Пока задач нет
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
            По этому запросу задач нет
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task: Task) => {
              const isEditing = editingTaskId === task.id
              const isDeleting = deletingTaskId === task.id
              const isCompleting = completingTaskId === task.id
              const dateLabel = getTaskFilterLabel(task)
              const isOverdue = Boolean(
                task.dueDate && task.dueDate < getTodayDateString(),
              )

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

                        <span
                          className={[
                            'text-xs',
                            isOverdue ? 'text-red-200' : 'text-slate-500',
                          ].join(' ')}
                        >
                          {dateLabel}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white">
                        {task.title}
                      </h3>

                      {task.description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {task.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenFocusPicker(task)}
                        className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                      >
                        Фокус
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingTaskId(task.id)}
                        className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
                      >
                        Изменить
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={isCompleting}
                        className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCompleting ? 'Готовим...' : 'Готово'}
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

      {focusTask ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-950/85 px-4 py-12 backdrop-blur-xl sm:items-center sm:py-8">
          <div
            className="absolute inset-0"
            onClick={handleCloseFocusPicker}
          />

          <div className="relative z-[91] mt-6 w-full max-w-md rounded-[2rem] border border-emerald-400/20 bg-slate-950 p-6 shadow-2xl shadow-black/70 ring-1 ring-white/10 sm:mt-0">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-300">Фокус по задаче</p>

                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Выбери длительность
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Задача: {focusTask.title}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseFocusPicker}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Закрыть
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {focusDurationOptions.map((option) => (
                <button
                  key={option.seconds}
                  type="button"
                  onClick={() => handleStartFocus(option.seconds)}
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <label className="mb-2 block text-sm text-slate-400">
                Своя длительность, минут
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="number"
                  min="1"
                  max="240"
                  step="1"
                  value={customFocusMinutes}
                  onChange={(event) =>
                    setCustomFocusMinutes(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
                  placeholder="Например: 30"
                />

                <button
                  type="button"
                  onClick={handleStartCustomFocus}
                  disabled={!customFocusSeconds}
                  className="shrink-0 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Запустить
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Можно указать от 1 до 240 минут.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default TaskList