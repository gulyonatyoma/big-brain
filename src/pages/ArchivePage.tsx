import CompletedTaskList from '../features/tasks/components/CompletedTaskList'
import ArchiveStatsCards from '../features/tasks/components/ArchiveStatsCards'

function ArchivePage() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Выполненные задачи
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Архив
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Здесь будет история всех завершённых задач. Позже добавим фильтры
            по дате, категории, проекту и типу активности.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">История выполнения</h2>
              <p className="mt-1 text-sm text-slate-400">
                Здесь отображаются выполненные задачи.
              </p>
            </div>
          </div>

          <ArchiveStatsCards />

          <div className="mt-6">
            <CompletedTaskList />
          </div>
        </div>
      </section>
    </main>
  )
}

export default ArchivePage