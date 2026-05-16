import NotificationPermissionCard from '../features/notifications/components/NotificationPermissionCard'
import ProfileStatsCard from '../features/stats/components/ProfileStatsCard'

function ProfilePage() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Личный кабинет
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Профиль
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Здесь находятся настройки пользователя, уведомления, цели на день,
            тема оформления и будущие интеграции с Telegram и календарями.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500 text-2xl font-bold text-white">
                А
              </div>

              <div>
                <h2 className="text-2xl font-semibold">Артём</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Пользователь приложения
                </p>
              </div>
            </div>

            <ProfileStatsCard />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">Настройки</h2>

            <div className="mt-6 space-y-5">
              <NotificationPermissionCard />

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">Цель на день</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Сколько задач хочется закрывать ежедневно
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
                    5 задач
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">Тема оформления</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Сейчас используется тёмная тема приложения
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
                    Dark
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">Интеграции</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Telegram, Google Calendar, Яндекс Календарь
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
                    Позже
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">Экспорт данных</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Позже добавим выгрузку задач, событий, заметок и фокус-сессий
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
                    В планах
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProfilePage