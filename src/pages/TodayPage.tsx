import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CreateEventForm from '../features/events/components/CreateEventForm'
import TodayEventList from '../features/events/components/TodayEventList'
import { createNote } from '../features/notes/model/noteActions'
import CreateTaskForm from '../features/tasks/components/CreateTaskForm'
import TodayTaskList from '../features/tasks/components/TodayTaskList'
import TodayStatsCards from '../features/tasks/components/TodayStatsCards'
import { getTodayDateString } from '../shared/lib/dateTime'

function getTodayNoteTitle() {
  const dateTitle = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return `Заметка от ${dateTitle}`
}

function TodayPage() {
  const navigate = useNavigate()

  const [isCreateTodayTaskOpen, setIsCreateTodayTaskOpen] = useState(false)
  const [isCreateTodayEventOpen, setIsCreateTodayEventOpen] = useState(false)
  const [isCreatingTodayNote, setIsCreatingTodayNote] = useState(false)

  const today = getTodayDateString()

  async function handleCreateTodayNote() {
    setIsCreatingTodayNote(true)

    try {
      const note = await createNote({
        title: getTodayNoteTitle(),
        content: '',
      })

      navigate(`/notes?noteId=${encodeURIComponent(note.id)}`)
    } finally {
      setIsCreatingTodayNote(false)
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Большой мозг
          </p>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight">
                Сегодня
              </h1>

              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Главный дневной экран: просроченные задачи, план на сегодня,
                события дня и фокус-время. Сюда стоит заходить утром, чтобы
                быстро понять, что требует внимания в первую очередь.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateTodayTaskOpen(true)}
                className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                + Задача на сегодня
              </button>

              <button
                type="button"
                onClick={() => setIsCreateTodayEventOpen(true)}
                className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
              >
                + Событие на сегодня
              </button>

              <button
                type="button"
                onClick={handleCreateTodayNote}
                disabled={isCreatingTodayNote}
                className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingTodayNote ? 'Создаём...' : '+ Быстрая заметка'}
              </button>
            </div>
          </div>
        </div>

        <TodayStatsCards />

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <h2 className="text-2xl font-semibold">План на сегодня</h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Здесь отображаются просроченные задачи и активные задачи, у
                    которых дата выполнения — сегодня.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateTodayTaskOpen(true)}
                  className="shrink-0 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
                >
                  Добавить
                </button>
              </div>
            </div>

            <TodayTaskList />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <h2 className="text-2xl font-semibold">События на сегодня</h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Здесь отображаются события календаря, назначенные на
                    сегодня, включая регулярные события.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateTodayEventOpen(true)}
                  className="shrink-0 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
                >
                  Добавить
                </button>
              </div>
            </div>

            <TodayEventList />
          </div>
        </div>
      </section>

      {isCreateTodayTaskOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsCreateTodayTaskOpen(false)}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CreateTaskForm
              defaultDueDate={today}
              onCreated={() => setIsCreateTodayTaskOpen(false)}
              onCancel={() => setIsCreateTodayTaskOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {isCreateTodayEventOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsCreateTodayEventOpen(false)}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <CreateEventForm
              defaultDate={today}
              onCreated={() => setIsCreateTodayEventOpen(false)}
              onCancel={() => setIsCreateTodayEventOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default TodayPage