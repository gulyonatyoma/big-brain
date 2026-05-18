import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { getTodayDateString } from '../../../shared/lib/dateTime'
import { completeTask, deleteTask } from '../model/taskActions'
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

        <p className="mt-1 text-sm text-slate-400">
          {description}
        </p>
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
                          variant === 'danger' ? 'text-red-100/70' : 'text-slate-500',
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
  const [editingTaskId, setEditingTaskId] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState('')
  const [completingTaskId, setCompletingTaskId] = useState('')

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
    } finally {
      setDeletingTaskId('')
    }
  }

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
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
        На сегодня задач нет, и просроченных задач тоже нет
      </div>
    )
  }

  return (
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
      />
    </div>
  )
}

export default TodayTaskList