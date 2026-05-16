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
      todayTasks: activeTasks.filter((task) => task.dueDate === today).length,
      todayEvents: events.filter((event) => doesEventOccurOnDate(event, today))
        .length,
      todayFocusMinutes,
    }
  }, [])

  const todayTasksCount = stats?.todayTasks ?? 0
  const todayEventsCount = stats?.todayEvents ?? 0
  const todayFocusMinutes = stats?.todayFocusMinutes ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Задачи на сегодня</p>
        <p className="mt-2 text-2xl font-semibold">
          {todayTasksCount} задач
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">События</p>
        <p className="mt-2 text-2xl font-semibold">
          {todayEventsCount} событий
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Фокус</p>
        <p className="mt-2 text-2xl font-semibold">
          {formatDurationFromMinutes(todayFocusMinutes)}
        </p>
      </div>
    </div>
  )
}

export default TodayStatsCards