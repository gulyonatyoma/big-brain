import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FocusTimer from '../features/focus/components/FocusTimer'
import { useFocusTimerStore } from '../features/focus/model/focusTimerStore'

const DEFAULT_QUICK_FOCUS_DURATION_SECONDS = 25 * 60
const QUICK_FOCUS_MESSAGE_STORAGE_KEY = 'big-brain-quick-focus-message'

function getQuickFocusDuration(searchParams: URLSearchParams) {
  const rawDurationSeconds = Number(searchParams.get('durationSeconds'))

  if (!Number.isFinite(rawDurationSeconds) || rawDurationSeconds <= 0) {
    return DEFAULT_QUICK_FOCUS_DURATION_SECONDS
  }

  return Math.min(rawDurationSeconds, 4 * 60 * 60)
}

function getBlockedFocusMessage(status: string) {
  if (status === 'running') {
    return 'Фокус уже идёт. Я открыл текущую сессию и не стал запускать новую, чтобы не потерять прогресс.'
  }

  if (status === 'paused') {
    return 'Фокус сейчас на паузе. Я открыл текущую сессию и не стал запускать новую, чтобы не сбросить уже начатую работу.'
  }

  if (status === 'finished') {
    return 'Предыдущая фокус-сессия уже завершена. Нажми “Новая сессия”, если хочешь запустить следующий фокус.'
  }

  return ''
}

function FocusPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const processedQuickFocusRef = useRef('')
  const [quickFocusMessage, setQuickFocusMessage] = useState('')

  const status = useFocusTimerStore((state) => state.status)
  const setSelectedTask = useFocusTimerStore((state) => state.setSelectedTask)
  const setDurationSeconds = useFocusTimerStore(
    (state) => state.setDurationSeconds,
  )
  const start = useFocusTimerStore((state) => state.start)

  useEffect(() => {
    const savedMessage = window.sessionStorage.getItem(
      QUICK_FOCUS_MESSAGE_STORAGE_KEY,
    )

    if (savedMessage) {
      setQuickFocusMessage(savedMessage)
    }
  }, [])

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
      const taskId = searchParams.get('taskId') ?? ''
      const taskTitle = searchParams.get('taskTitle') ?? ''
      const durationSeconds = getQuickFocusDuration(searchParams)

      window.sessionStorage.removeItem(QUICK_FOCUS_MESSAGE_STORAGE_KEY)
      setQuickFocusMessage('')

      if (taskId || taskTitle) {
        setSelectedTask(taskId, taskTitle)
      }

      setDurationSeconds(durationSeconds)
      start()
    } else {
      const blockedMessage = getBlockedFocusMessage(status)

      if (blockedMessage) {
        window.sessionStorage.setItem(
          QUICK_FOCUS_MESSAGE_STORAGE_KEY,
          blockedMessage,
        )

        setQuickFocusMessage(blockedMessage)
      }
    }

    navigate('/focus', { replace: true })
  }, [
    navigate,
    searchParams,
    setDurationSeconds,
    setSelectedTask,
    start,
    status,
  ])

  function handleCloseQuickFocusMessage() {
    window.sessionStorage.removeItem(QUICK_FOCUS_MESSAGE_STORAGE_KEY)
    setQuickFocusMessage('')
  }

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

          {quickFocusMessage ? (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/15 p-4 text-amber-100 shadow-lg shadow-amber-950/20 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-100">
                  Уже есть активная фокус-сессия
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-100/80">
                  {quickFocusMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseQuickFocusMessage}
                className="shrink-0 rounded-xl border border-amber-300/20 bg-black/20 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-black/30"
              >
                Понятно
              </button>
            </div>
          ) : null}
        </div>

        <FocusTimer />
      </section>
    </main>
  )
}

export default FocusPage