import TodayEventList from '../features/events/components/TodayEventList'
import TodayTaskList from '../features/tasks/components/TodayTaskList'
import TodayStatsCards from '../features/tasks/components/TodayStatsCards'

function TodayPage() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Большой мозг
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Сегодня
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Здесь собраны задачи и события на текущий день. Позже добавим сюда
            быстрые заметки и запуск фокус-таймера.
          </p>
        </div>

        <TodayStatsCards />

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">План на сегодня</h2>

              <p className="mt-1 text-sm text-slate-400">
                Здесь отображаются активные задачи, у которых дата выполнения —
                сегодня.
              </p>
            </div>

            <TodayTaskList />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">События на сегодня</h2>

              <p className="mt-1 text-sm text-slate-400">
                Здесь отображаются события календаря, назначенные на сегодня.
              </p>
            </div>

            <TodayEventList />
          </div>
        </div>
      </section>
    </main>
  )
}

export default TodayPage