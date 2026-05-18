import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import {
  formatDurationFromMinutes,
  getTodayDateString,
} from '../../../shared/lib/dateTime'
import { doesEventOccurOnDate } from '../../events/model/eventDateUtils'

function TodayStatsCards() {
  const stats = useLiveQuery(async () => {
    const today = getTodayDateString()

    const activeTasks = await db.tasks.where('status').equals('active').toArray()
    const events = await db.events.toArray()
    const focusSessions = await db.focusSessions.toArray()

    const todayFocusMinutes = focusSessions
      .filter((session) => session.completedAt.slice(0, 10) === today)
      .reduce((sum, session) => {
        return sum + session.durationMinutes
      }, 0)

    return {
      overdueTasks: activeTasks.filter((task) => {
        return Boolean(task.dueDate && task.dueDate < today)
      }).length,

      todayTasks: activeTasks.filter((task) => {
        return task.dueDate === today
      }).length,

      todayEvents: events.filter((event) => {
        return doesEventOccurOnDate(event, today)
      }).length,

      todayFocusMinutes,
    }
  }, [])

  const overdueTasksCount = stats?.overdueTasks ?? 0
  const todayTasksCount = stats?.todayTasks ?? 0
  const todayEventsCount = stats?.todayEvents ?? 0
  const todayFocusMinutes = stats?.todayFocusMinutes ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
        <p className="text-sm text-red-100/70">Просрочено</p>

        <p className="mt-2 text-2xl font-semibold text-red-100">
          {overdueTasksCount} задач
        </p>

        <p className="mt-1 text-xs text-red-100/60">
          Нужно разобрать в первую очередь
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Задачи на сегодня</p>

        <p className="mt-2 text-2xl font-semibold">
          {todayTasksCount} задач
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Основной план текущего дня
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">События</p>

        <p className="mt-2 text-2xl font-semibold">
          {todayEventsCount} событий
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Встречи, напоминания и расписание
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Фокус</p>

        <p className="mt-2 text-2xl font-semibold">
          {formatDurationFromMinutes(todayFocusMinutes)}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Сколько уже сфокусировался сегодня
        </p>
      </div>
    </div>
  )
}

export default TodayStatsCards