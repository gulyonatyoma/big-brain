import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'

function getTodayDateString() {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function getWeekStartDateString() {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)

  const timezoneOffset = monday.getTimezoneOffset() * 60 * 1000

  return new Date(monday.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function ArchiveStatsCards() {
  const stats = useLiveQuery(async () => {
    const completedTasks = await db.tasks
      .where('status')
      .equals('completed')
      .toArray()

    const today = getTodayDateString()
    const weekStart = getWeekStartDateString()

    return {
      today: completedTasks.filter((task) => {
        return task.completedAt?.slice(0, 10) === today
      }).length,

      week: completedTasks.filter((task) => {
        return task.completedAt && task.completedAt.slice(0, 10) >= weekStart
      }).length,

      total: completedTasks.length,
    }
  }, [])

  const todayCount = stats?.today ?? 0
  const weekCount = stats?.week ?? 0
  const totalCount = stats?.total ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm text-slate-400">Сегодня выполнено</p>
        <p className="mt-2 text-2xl font-semibold">{todayCount}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm text-slate-400">За неделю</p>
        <p className="mt-2 text-2xl font-semibold">{weekCount}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm text-slate-400">Всего в архиве</p>
        <p className="mt-2 text-2xl font-semibold">{totalCount}</p>
      </div>
    </div>
  )
}

export default ArchiveStatsCards