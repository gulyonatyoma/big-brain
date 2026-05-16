import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { completeTask, deleteTask } from '../model/taskActions'
import type { Task, TaskPriority } from '../types'

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

function getTodayDateString() {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function TodayTaskList() {
  const tasks = useLiveQuery(async () => {
    const today = getTodayDateString()

    const activeTasks = await db.tasks.where('status').equals('active').toArray()

    return activeTasks
      .filter((task) => task.dueDate === today)
      .sort((a, b) => {
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [])

  if (!tasks) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-400">
        Загружаем задачи на сегодня...
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
        На сегодня задач нет
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task: Task) => (
        <article
          key={task.id}
          className="rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <div className="flex items-start justify-between gap-4">
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
                  Сегодня
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

            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => completeTask(task.id)}
                className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                Готово
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Удалить
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default TodayTaskList