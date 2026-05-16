import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import {
  formatDurationFromMinutes,
  getDateStringFromIso,
  getDateStringWithOffset,
  getTodayDateString,
} from '../../../shared/lib/dateTime'

function calculateActivityStreak(activityDates: Set<string>) {
  let streak = 0

  while (true) {
    const dateString = getDateStringWithOffset(-streak)

    if (!activityDates.has(dateString)) {
      break
    }

    streak += 1
  }

  return streak
}

function ActivitySummaryCards() {
  const stats = useLiveQuery(async () => {
    const today = getTodayDateString()

    const completedTasks = await db.tasks
      .where('status')
      .equals('completed')
      .toArray()

    const focusSessions = await db.focusSessions.toArray()

    const completedToday = completedTasks.filter((task) => {
      return task.completedAt?.slice(0, 10) === today
    }).length

    const focusTodayMinutes = focusSessions
      .filter((session) => getDateStringFromIso(session.completedAt) === today)
      .reduce((sum, session) => {
        return sum + session.durationMinutes
      }, 0)

    const totalFocusMinutes = focusSessions.reduce((sum, session) => {
      return sum + session.durationMinutes
    }, 0)

    const activityDates = new Set<string>()

    completedTasks.forEach((task) => {
      if (task.completedAt) {
        activityDates.add(getDateStringFromIso(task.completedAt))
      }
    })

    focusSessions.forEach((session) => {
      activityDates.add(getDateStringFromIso(session.completedAt))
    })

    return {
      completedToday,
      totalCompletedTasks: completedTasks.length,
      focusTodayMinutes,
      totalFocusMinutes,
      activityStreak: calculateActivityStreak(activityDates),
    }
  }, [])

  const completedToday = stats?.completedToday ?? 0
  const totalCompletedTasks = stats?.totalCompletedTasks ?? 0
  const focusTodayMinutes = stats?.focusTodayMinutes ?? 0
  const totalFocusMinutes = stats?.totalFocusMinutes ?? 0
  const activityStreak = stats?.activityStreak ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Выполнено сегодня</p>
        <p className="mt-2 text-3xl font-semibold">{completedToday}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Фокус сегодня</p>
        <p className="mt-2 text-3xl font-semibold">
          {formatDurationFromMinutes(focusTodayMinutes)}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Серия активности</p>
        <p className="mt-2 text-3xl font-semibold">{activityStreak} дней</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Всего выполнено</p>
        <p className="mt-2 text-3xl font-semibold">{totalCompletedTasks}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-400">Всего фокуса</p>
        <p className="mt-2 text-3xl font-semibold">
          {formatDurationFromMinutes(totalFocusMinutes)}
        </p>
      </div>
    </div>
  )
}

export default ActivitySummaryCards