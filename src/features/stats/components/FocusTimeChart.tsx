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
  minutes: number
}

function getLastSevenDays(): ChartDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))

    return {
      date: toDateString(date),
      label: formatShortDate(date),
      minutes: 0,
    }
  })
}

function formatCompactDuration(minutes: number) {
  const totalSeconds = Math.round(minutes * 60)

  if (totalSeconds <= 0) {
    return '0с'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutesPart = Math.floor((totalSeconds % 3600) / 60)
  const secondsPart = totalSeconds % 60

  if (hours > 0) {
    return minutesPart > 0 ? `${hours}ч ${minutesPart}м` : `${hours}ч`
  }

  if (minutesPart > 0) {
    return secondsPart > 0
      ? `${minutesPart}м ${secondsPart}с`
      : `${minutesPart}м`
  }

  return `${secondsPart}с`
}

function FocusTimeChart() {
  const data = useLiveQuery(async () => {
    const days = getLastSevenDays()
    const focusSessions = await db.focusSessions.toArray()

    return days.map((day) => {
      const minutes = focusSessions
        .filter((session) => {
          return session.completedAt.slice(0, 10) === day.date
        })
        .reduce((sum, session) => {
          return sum + session.durationMinutes
        }, 0)

      return {
        ...day,
        minutes,
      }
    })
  }, [])

  const chartData = data ?? getLastSevenDays()

  /**
   * Минимальная шкала = 60 минут.
   * Так 10 секунд или 5 минут не будут занимать весь график.
   * Если фокуса больше часа — график автоматически масштабируется выше.
   */
  const maxMinutes = Math.max(...chartData.map((day) => day.minutes), 60)

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Фокус-время</h2>

        <p className="mt-1 text-sm text-slate-400">
          Время концентрации за последние 7 дней.
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[560px] rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="grid h-72 grid-cols-7 gap-3">
            {chartData.map((day) => {
              const heightPercent =
                day.minutes === 0
                  ? 4
                  : Math.max(8, (day.minutes / maxMinutes) * 100)

              return (
                <div key={day.date} className="flex min-w-0 flex-col">
                  <div className="flex min-h-0 flex-1 items-end">
                    <div
                      className="w-full rounded-t-xl bg-sky-500/70 transition-all"
                      style={{ height: `${heightPercent}%` }}
                      title={formatDurationFromMinutes(day.minutes)}
                    />
                  </div>

                  <div className="mt-3 h-10 text-center">
                    <p
                      className="truncate whitespace-nowrap text-xs font-medium text-slate-300"
                      title={formatDurationFromMinutes(day.minutes)}
                    >
                      {formatCompactDuration(day.minutes)}
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

export default FocusTimeChart