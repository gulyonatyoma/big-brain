import ActivityScoreChart from '../features/stats/components/ActivityScoreChart'
import ActivitySummaryCards from '../features/stats/components/ActivitySummaryCards'
import CompletedTasksChart from '../features/stats/components/CompletedTasksChart'
import FocusTimeChart from '../features/stats/components/FocusTimeChart'

function StatsPage() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Статистика
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Активность
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Здесь отображается реальная статистика по выполненным задачам,
            фокус-сессиям и общей активности.
          </p>
        </div>

        <ActivitySummaryCards />

        <div className="grid gap-6 lg:grid-cols-2">
          <CompletedTasksChart />

          <FocusTimeChart />
        </div>

        <ActivityScoreChart />
      </section>
    </main>
  )
}

export default StatsPage