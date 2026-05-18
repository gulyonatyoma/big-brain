import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FocusTimer from '../features/focus/components/FocusTimer'
import { useFocusTimerStore } from '../features/focus/model/focusTimerStore'

const QUICK_FOCUS_DURATION_SECONDS = 25 * 60

function FocusPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const processedQuickFocusRef = useRef('')

  const status = useFocusTimerStore((state) => state.status)
  const setDurationSeconds = useFocusTimerStore(
    (state) => state.setDurationSeconds,
  )
  const start = useFocusTimerStore((state) => state.start)

  useEffect(() => {
    if (searchParams.get('quickFocus') !== '1') {
      return
    }

    const quickRequestId = searchParams.get('quick') ?? 'default'

    if (processedQuickFocusRef.current === quickRequestId) {
      return
    }

    processedQuickFocusRef.current = quickRequestId

    if (status === 'idle') {
      setDurationSeconds(QUICK_FOCUS_DURATION_SECONDS)
      start()
    }

    navigate('/focus', { replace: true })
  }, [navigate, searchParams, setDurationSeconds, start, status])

  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Фокусировка
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Фокус-таймер
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Здесь можно выбрать задачу, запустить фокус-сессию и сохранить
            результат в статистику активности.
          </p>
        </div>

        <FocusTimer />
      </section>
    </main>
  )
}

export default FocusPage