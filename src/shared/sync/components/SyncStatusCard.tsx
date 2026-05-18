import { useLiveQuery } from 'dexie-react-hooks'
import { useAuthStore } from '../../../features/auth/model/authStore'
import { db } from '../../db/db'

function SyncStatusCard() {
  const user = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading)

  const localStats = useLiveQuery(async () => {
    const [tasksCount, eventsCount, notesCount, focusSessionsCount] =
      await Promise.all([
        db.tasks.count(),
        db.events.count(),
        db.notes.count(),
        db.focusSessions.count(),
      ])

    return {
      tasksCount,
      eventsCount,
      notesCount,
      focusSessionsCount,
    }
  }, [])

  const tasksCount = localStats?.tasksCount ?? 0
  const eventsCount = localStats?.eventsCount ?? 0
  const notesCount = localStats?.notesCount ?? 0
  const focusSessionsCount = localStats?.focusSessionsCount ?? 0

  if (isAuthLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="font-medium text-white">Статус синхронизации</p>

        <p className="mt-1 text-sm text-slate-400">
          Проверяем аккаунт и облачную синхронизацию...
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-medium text-amber-100">
              Синхронизация выключена
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-100/80">
              Сейчас данные хранятся только на этом устройстве. Чтобы задачи,
              события, заметки и фокус-сессии были одинаковыми на телефоне и
              ноутбуке, войди в аккаунт.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-amber-300/20 px-4 py-2 text-sm text-amber-100">
            Локальный режим
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="font-medium text-emerald-100">
            Облачная синхронизация включена
          </p>

          <p className="mt-1 text-sm leading-6 text-emerald-100/80">
            Ты вошёл в аккаунт. Данные сохраняются в Supabase и подтягиваются
            на другие устройства после входа в тот же аккаунт.
          </p>

          <p className="mt-2 break-all text-xs text-emerald-100/70">
            Аккаунт: {user.email}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-emerald-300/20 px-4 py-2 text-sm text-emerald-100">
          Cloud sync
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-emerald-100/60">Задачи</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {tasksCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-emerald-100/60">События</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {eventsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-emerald-100/60">Заметки</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {notesCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-emerald-100/60">Фокус</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {focusSessionsCount}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SyncStatusCard