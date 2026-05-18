import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CalendarMonthGrid from '../features/events/components/CalendarMonthGrid'
import CreateEventForm from '../features/events/components/CreateEventForm'
import EventList from '../features/events/components/EventList'

function CalendarPage() {
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (searchParams.get('create') !== '1') {
      return
    }

    setIsCreateEventOpen(true)
    navigate('/calendar', { replace: true })
  }, [navigate, searchParams])

  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Календарь
          </p>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight">
                События и расписание
              </h1>

              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Здесь отображаются события календаря, регулярные события и
                напоминания. События уже сохраняются в локальной базе браузера.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateEventOpen(true)}
              className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Создать событие
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <CalendarMonthGrid />

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">Список событий</h2>

              <p className="mt-1 text-sm text-slate-400">
                Здесь отображаются созданные события календаря.
              </p>
            </div>

            <EventList />
          </div>
        </div>
      </section>

      {isCreateEventOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsCreateEventOpen(false)}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <CreateEventForm
              onCreated={() => setIsCreateEventOpen(false)}
              onCancel={() => setIsCreateEventOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default CalendarPage