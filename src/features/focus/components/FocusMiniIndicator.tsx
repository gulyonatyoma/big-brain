import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { createFocusSession } from '../model/focusActions'
import { useFocusTimerStore } from '../model/focusTimerStore'

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function FocusMiniIndicator() {
  const location = useLocation()
  const isFocusPage = location.pathname === '/focus'

  const {
    selectedTaskId,
    selectedTaskTitle,
    durationSeconds,
    secondsLeft,
    elapsedSeconds,
    status,
    startedAt,
    wasSessionSaved,

    pause,
    start,
    finishEarly,
    tick,
    markSessionSaved,
    reset,
  } = useFocusTimerStore()

  useEffect(() => {
    if (isFocusPage || status !== 'running') {
      return
    }

    tick()

    const intervalId = window.setInterval(() => {
      tick()
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isFocusPage, status, tick])

  useEffect(() => {
    if (
      isFocusPage ||
      status !== 'finished' ||
      !startedAt ||
      wasSessionSaved
    ) {
      return
    }

    async function saveSessionAndCloseIndicator() {
      const durationToSaveSeconds =
        elapsedSeconds > 0 ? elapsedSeconds : durationSeconds

      await createFocusSession({
        taskId: selectedTaskId || undefined,
        taskTitle: selectedTaskTitle || undefined,
        durationMinutes: durationToSaveSeconds / 60,
        startedAt,
      })

      markSessionSaved(durationToSaveSeconds)
      reset()
    }

    saveSessionAndCloseIndicator()
  }, [
    isFocusPage,
    status,
    startedAt,
    wasSessionSaved,
    elapsedSeconds,
    durationSeconds,
    selectedTaskId,
    selectedTaskTitle,
    markSessionSaved,
    reset,
  ])

  if (isFocusPage || status === 'idle' || status === 'finished') {
    return null
  }

  const statusLabel =
    status === 'running'
      ? 'Фокус идёт'
      : status === 'paused'
        ? 'Пауза'
        : 'Сессия завершена'

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[340px] max-w-[calc(100vw-2.5rem)] rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
            {statusLabel}
          </p>

          <p className="mt-1 truncate text-sm text-slate-400">
            {selectedTaskTitle || 'Без задачи'}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-lg font-bold text-white">
          {formatTime(secondsLeft)}
        </div>
      </div>

      <div className="grid gap-2">
        <Link
          to="/focus"
          className="rounded-2xl bg-violet-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          Открыть таймер
        </Link>

        <div className="grid grid-cols-2 gap-2">
          {status === 'running' ? (
            <button
              type="button"
              onClick={pause}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Пауза
            </button>
          ) : null}

          {status === 'paused' ? (
            <button
              type="button"
              onClick={start}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Старт
            </button>
          ) : null}

          <button
            type="button"
            onClick={finishEarly}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Завершить
          </button>
        </div>
      </div>
    </div>
  )
}

export default FocusMiniIndicator