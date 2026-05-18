import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { getTodayDateString } from '../../../shared/lib/dateTime'
import { completeTask, deleteTask } from '../model/taskActions'
import type { Task, TaskPriority } from '../types'
import EditTaskForm from './EditTaskForm'

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

type TaskSectionProps = {
  title: string
  description: string
  emptyText: string
  tasks: Task[]
  variant?: 'default' | 'danger'
  editingTaskId: string
  deletingTaskId: string
  completingTaskId: string
  onEditTask: (taskId: string) => void
  onCancelEdit: () => void
  onCompleteTask: (taskId: string) => void
  onDeleteTask: (task: Task) => void
  onOpenFocusPicker: (task: Task) => void
}

function TaskSection({
  title,
  description,
  emptyText,
  tasks,
  variant = 'default',
  editingTaskId,
  deletingTaskId,
  completingTaskId,
  onEditTask,
  onCancelEdit,
  onCompleteTask,
  onDeleteTask,
  onOpenFocusPicker,
}: TaskSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3
          className={[
            'text-lg font-semibold',
            variant === 'danger' ? 'text-red-100' : 'text-white',
          ].join(' ')}
        >
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isEditing = editingTaskId === task.id
            const isDeleting = deletingTaskId === task.id
            const isCompleting = completingTaskId === task.id

            if (isEditing) {
              return (
                <div key={task.id}>
                  <EditTaskForm
                    task={task}
                    onSaved={onCancelEdit}
                    onCancel={onCancelEdit}
                  />
                </div>
              )
            }

            return (
              <article
                key={task.id}
                className={[
                  'rounded-2xl border p-5',
                  variant === 'danger'
                    ? 'border-red-400/20 bg-red-500/10'
                    : 'border-white/10 bg-black/20',
                ].join(' ')}
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
                          variant === 'danger'
                            ? 'text-red-100/70'
                            : 'text-slate-500',
                        ].join(' ')}
                      >
                        {variant === 'danger'
                          ? `Просрочено: ${formatDate(task.dueDate)}`
                          : 'Сегодня'}
                      </span>
                    </div>

                    <h4 className="text-lg font-semibold text-white">
                      {task.title}
                    </h4>

                    {task.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {task.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFocusPicker(task)}
                      className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                    >
                      Фокус
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditTask(task.id)}
                      className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
                    >
                      Изменить
                    </button>

                    <button
                      type="button"
                      onClick={() => onCompleteTask(task.id)}
                      disabled={isCompleting}
                      className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCompleting ? 'Готовим...' : 'Готово'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task)}
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
    </section>
  )
}

function TodayTaskList() {
  const navigate = useNavigate()

  const [editingTaskId, setEditingTaskId] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState('')
  const [completingTaskId, setCompletingTaskId] = useState('')
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [customFocusMinutes, setCustomFocusMinutes] = useState('25')

  const customFocusSeconds = getCustomFocusSeconds(customFocusMinutes)

  const tasksData = useLiveQuery(async () => {
    const today = getTodayDateString()

    const activeTasks = await db.tasks.where('status').equals('active').toArray()

    const overdueTasks = activeTasks.filter((task) => {
      return Boolean(task.dueDate && task.dueDate < today)
    })

    const todayTasks = activeTasks.filter((task) => {
      return task.dueDate === today
    })

    return {
      overdueTasks: sortTasks(overdueTasks),
      todayTasks: sortTasks(todayTasks),
    }
  }, [])

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

  const focusDurationModal = focusTask ? (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-950/95 px-4 py-10 backdrop-blur-2xl">
      <button
        type="button"
        aria-label="Закрыть выбор длительности фокуса"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={handleCloseFocusPicker}
      />

      <div className="relative z-[1000] w-full max-w-lg rounded-[2rem] border border-emerald-400/30 bg-slate-950 p-6 shadow-[0_32px_120px_rgba(0,0,0,0.95)] ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-300">
              Фокус по задаче
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-white">
              Выбери длительность
            </h2>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Задача
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                {focusTask.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseFocusPicker}
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
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

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
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
              onChange={(event) => setCustomFocusMinutes(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
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
  ) : null

  if (!tasksData) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
        Загружаем задачи на сегодня...
      </div>
    )
  }

  const hasNoTasks =
    tasksData.overdueTasks.length === 0 && tasksData.todayTasks.length === 0

  if (hasNoTasks) {
    return (
      <>
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
          На сегодня задач нет, и просроченных задач тоже нет
        </div>

        {focusDurationModal ? createPortal(focusDurationModal, document.body) : null}
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <TaskSection
          title="Просроченные"
          description="Эти задачи уже должны были быть закрыты. Лучше разобрать их первыми."
          emptyText="Просроченных задач нет"
          tasks={tasksData.overdueTasks}
          variant="danger"
          editingTaskId={editingTaskId}
          deletingTaskId={deletingTaskId}
          completingTaskId={completingTaskId}
          onEditTask={setEditingTaskId}
          onCancelEdit={() => setEditingTaskId('')}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onOpenFocusPicker={handleOpenFocusPicker}
        />

        <TaskSection
          title="На сегодня"
          description="Основной список задач, которые запланированы на текущий день."
          emptyText="Задач на сегодня нет"
          tasks={tasksData.todayTasks}
          editingTaskId={editingTaskId}
          deletingTaskId={deletingTaskId}
          completingTaskId={completingTaskId}
          onEditTask={setEditingTaskId}
          onCancelEdit={() => setEditingTaskId('')}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onOpenFocusPicker={handleOpenFocusPicker}
        />
      </div>

      {focusDurationModal ? createPortal(focusDurationModal, document.body) : null}
    </>
  )
}

export default TodayTaskList