import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { getTodayDateString } from '../../../shared/lib/dateTime'
import { completeTask, deleteTask } from '../model/taskActions'
import type { Task, TaskPriority } from '../types'
import EditTaskForm from './EditTaskForm'

type TaskFilter = 'all' | 'today' | 'overdue' | 'upcoming' | 'without-date'

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

function TaskList() {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all')
  const [editingTaskId, setEditingTaskId] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState('')
  const [completingTaskId, setCompletingTaskId] = useState('')

  const tasks = useLiveQuery(async () => {
    const activeTasks = await db.tasks.where('status').equals('active').toArray()

    return sortTasks(activeTasks)
  }, [])

  const safeTasks = tasks ?? []

  const visibleTasks = safeTasks.filter((task) => {
    return matchesFilter(task, activeFilter)
  })

  const filterCounts: Record<TaskFilter, number> = {
    all: safeTasks.length,
    today: safeTasks.filter((task) => matchesFilter(task, 'today')).length,
    overdue: safeTasks.filter((task) => matchesFilter(task, 'overdue')).length,
    upcoming: safeTasks.filter((task) => matchesFilter(task, 'upcoming')).length,
    'without-date': safeTasks.filter((task) =>
      matchesFilter(task, 'without-date'),
    ).length,
  }

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
    } finally {
      setDeletingTaskId('')
    }
  }

  if (!tasks) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
        Загружаем задачи...
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          В этом фильтре задач нет
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
  )
}

export default TaskList