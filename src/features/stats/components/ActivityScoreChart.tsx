import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import {
  formatDurationFromMinutes,
  formatShortDate,
  toDateString,
} from '../../../shared/lib/dateTime'

type ChartDay = {
  date: string
  label: string
  completedTasks: number
  focusMinutes: number
  score: number
}

function getLastSevenDays(): ChartDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))

    return {
      date: toDateString(date),
      label: formatShortDate(date),
      completedTasks: 0,
      focusMinutes: 0,
      score: 0,
    }
  })
}

function ActivityScoreChart() {
  const data = useLiveQuery(async () => {
    const days = getLastSevenDays()

    const completedTasks = await db.tasks
      .where('status')
      .equals('completed')
      .toArray()

    const focusSessions = await db.focusSessions.toArray()

    return days.map((day) => {
      const tasksCount = completedTasks.filter((task) => {
        return task.completedAt?.slice(0, 10) === day.date
      }).length

      const focusMinutes = focusSessions
        .filter((session) => {
          return session.completedAt.slice(0, 10) === day.date
        })
        .reduce((sum, session) => {
          return sum + session.durationMinutes
        }, 0)

      const focusScore = focusMinutes / 25
      const score = tasksCount + focusScore

      return {
        ...day,
        completedTasks: tasksCount,
        focusMinutes,
        score,
      }
    })
  }, [])

  const chartData = data ?? getLastSevenDays()

  /**
   * Минимальная шкала = 5 баллов активности.
   * 1 задача = 1 балл.
   * 25 минут фокуса = 1 балл.
   */
  const maxScore = Math.max(...chartData.map((day) => day.score), 5)

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Общая активность</h2>

        <p className="mt-1 text-sm text-slate-400">
          Суммарный показатель за последние 7 дней: задачи + фокус-время.
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[560px] rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="grid h-72 grid-cols-7 gap-3">
            {chartData.map((day) => {
              const heightPercent =
                day.score === 0 ? 4 : Math.max(8, (day.score / maxScore) * 100)

              return (
                <div key={day.date} className="flex min-w-0 flex-col">
                  <div className="flex min-h-0 flex-1 items-end">
                    <div
                      className="w-full rounded-t-xl bg-emerald-500/70 transition-all"
                      style={{ height: `${heightPercent}%` }}
                      title={`${day.score.toFixed(1)} баллов активности`}
                    />
                  </div>

                  <div className="mt-3 h-10 text-center">
                    <p className="truncate whitespace-nowrap text-xs font-medium text-slate-300">
                      {day.score.toFixed(1)}
                    </p>

                    <p className="mt-1 truncate whitespace-nowrap text-[11px] text-slate-500">
                      {day.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            <p>
              Формула: <span className="text-slate-200">1 задача = 1 балл</span>,{' '}
              <span className="text-slate-200">25 минут фокуса = 1 балл</span>.
            </p>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {chartData.map((day) => (
                <div key={day.date} className="rounded-xl bg-black/20 p-3">
                  <p className="font-medium text-slate-300">{day.label}</p>

                  <p className="mt-1 text-xs">
                    Задачи: {day.completedTasks}, фокус:{' '}
                    {formatDurationFromMinutes(day.focusMinutes)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityScoreChart