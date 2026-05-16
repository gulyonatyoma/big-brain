import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'

function getTodayDateString() {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function TaskStatsCards() {
  const stats = useLiveQuery(async () => {
    const activeTasks = await db.tasks.where('status').equals('active').toArray()

    const today = getTodayDateString()

    return {
      overdue: activeTasks.filter((task) => task.dueDate && task.dueDate < today)
        .length,
      today: activeTasks.filter((task) => task.dueDate === today).length,
      noDate: activeTasks.filter((task) => !task.dueDate).length,
    }
  }, [])

  const overdueCount = stats?.overdue ?? 0
  const todayCount = stats?.today ?? 0
  const noDateCount = stats?.noDate ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
        <p className="text-sm text-red-200">Просрочено</p>
        <p className="mt-2 text-2xl font-semibold">{overdueCount} задач</p>
      </div>

      <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5">
        <p className="text-sm text-violet-200">Сегодня</p>
        <p className="mt-2 text-2xl font-semibold">{todayCount} задач</p>
      </div>

      <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5">
        <p className="text-sm text-sky-200">Без даты</p>
        <p className="mt-2 text-2xl font-semibold">{noDateCount} задач</p>
      </div>
    </div>
  )
}

export default TaskStatsCards