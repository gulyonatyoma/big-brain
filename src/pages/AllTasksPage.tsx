import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CreateTaskForm from '../features/tasks/components/CreateTaskForm'
import TaskList from '../features/tasks/components/TaskList'
import TaskStatsCards from '../features/tasks/components/TaskStatsCards'

function AllTasksPage() {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (searchParams.get('create') !== '1') {
      return
    }

    setIsCreateTaskOpen(true)
    navigate('/tasks', { replace: true })
  }, [navigate, searchParams])

  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Дамоклов меч
          </p>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight">
                Все дела
              </h1>

              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Здесь будет полный список всех незавершённых задач:
                просроченные, задачи на сегодня, задачи на неделю и дела без
                конкретной даты.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateTaskOpen(true)}
              className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Создать задачу
            </button>
          </div>
        </div>

        <TaskStatsCards />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">Список задач</h2>

            <p className="mt-1 text-sm text-slate-400">
              Здесь отображаются все активные задачи.
            </p>
          </div>

          <TaskList />
        </div>
      </section>

      {isCreateTaskOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsCreateTaskOpen(false)}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CreateTaskForm
              onCreated={() => setIsCreateTaskOpen(false)}
              onCancel={() => setIsCreateTaskOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default AllTasksPage