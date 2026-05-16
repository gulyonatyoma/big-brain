import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'

function formatFocusDuration(minutes: number) {
  const totalSeconds = Math.round(minutes * 60)

  if (totalSeconds <= 0) {
    return '0 сек'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutesPart = Math.floor((totalSeconds % 3600) / 60)
  const secondsPart = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} ч`)
  }

  if (minutesPart > 0) {
    parts.push(`${minutesPart} мин`)
  }

  if (secondsPart > 0) {
    parts.push(`${secondsPart} сек`)
  }

  return parts.join(' ')
}

function ProfileStatsCard() {
  const stats = useLiveQuery(async () => {
    const completedTasks = await db.tasks
      .where('status')
      .equals('completed')
      .toArray()

    const activeTasks = await db.tasks.where('status').equals('active').toArray()
    const notes = await db.notes.toArray()
    const events = await db.events.toArray()
    const focusSessions = await db.focusSessions.toArray()

    const totalFocusMinutes = focusSessions.reduce((sum, session) => {
      return sum + session.durationMinutes
    }, 0)

    return {
      completedTasks: completedTasks.length,
      activeTasks: activeTasks.length,
      notes: notes.length,
      events: events.length,
      totalFocusMinutes,
    }
  }, [])

  const completedTasks = stats?.completedTasks ?? 0
  const activeTasks = stats?.activeTasks ?? 0
  const notes = stats?.notes ?? 0
  const events = stats?.events ?? 0
  const totalFocusMinutes = stats?.totalFocusMinutes ?? 0

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm text-slate-400">Активных задач</p>
        <p className="mt-2 text-2xl font-semibold">{activeTasks}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm text-slate-400">Задач выполнено</p>
        <p className="mt-2 text-2xl font-semibold">{completedTasks}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm text-slate-400">Фокус-время</p>
        <p className="mt-2 text-2xl font-semibold">
          {formatFocusDuration(totalFocusMinutes)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-slate-400">Событий</p>
          <p className="mt-2 text-2xl font-semibold">{events}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-slate-400">Заметок</p>
          <p className="mt-2 text-2xl font-semibold">{notes}</p>
        </div>
      </div>
    </div>
  )
}

export default ProfileStatsCard