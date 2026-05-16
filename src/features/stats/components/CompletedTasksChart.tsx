import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { formatShortDate, toDateString } from '../../../shared/lib/dateTime'

type ChartDay = {
  date: string
  label: string
  count: number
}

function getLastSevenDays(): ChartDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))

    return {
      date: toDateString(date),
      label: formatShortDate(date),
      count: 0,
    }
  })
}

function CompletedTasksChart() {
  const data = useLiveQuery(async () => {
    const days = getLastSevenDays()

    const completedTasks = await db.tasks
      .where('status')
      .equals('completed')
      .toArray()

    return days.map((day) => {
      const count = completedTasks.filter((task) => {
        return task.completedAt?.slice(0, 10) === day.date
      }).length

      return {
        ...day,
        count,
      }
    })
  }, [])

  const chartData = data ?? getLastSevenDays()

  /**
   * Минимальная шкала = 5 задач.
   * Иначе 1 задача сразу занимала бы 100% высоты графика.
   */
  const maxCount = Math.max(...chartData.map((day) => day.count), 5)

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Дела по дням</h2>

        <p className="mt-1 text-sm text-slate-400">
          Количество выполненных задач за последние 7 дней.
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[560px] rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="grid h-72 grid-cols-7 gap-3">
            {chartData.map((day) => {
              const heightPercent =
                day.count === 0 ? 4 : Math.max(8, (day.count / maxCount) * 100)

              return (
                <div key={day.date} className="flex min-w-0 flex-col">
                  <div className="flex min-h-0 flex-1 items-end">
                    <div
                      className="w-full rounded-t-xl bg-violet-500/70 transition-all"
                      style={{ height: `${heightPercent}%` }}
                      title={`${day.count} задач`}
                    />
                  </div>

                  <div className="mt-3 h-10 text-center">
                    <p className="truncate whitespace-nowrap text-xs font-medium text-slate-300">
                      {day.count}
                    </p>

                    <p className="mt-1 truncate whitespace-nowrap text-[11px] text-slate-500">
                      {day.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompletedTasksChart