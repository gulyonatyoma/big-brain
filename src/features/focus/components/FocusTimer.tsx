import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../shared/db/db'
import { createFocusSession } from '../model/focusActions'
import { useFocusTimerStore } from '../model/focusTimerStore'

type DurationOption = {
  label: string
  seconds: number
}

const durationOptions: DurationOption[] = [
  {
    label: '10 сек',
    seconds: 10,
  },
  {
    label: '25 мин',
    seconds: 25 * 60,
  },
  {
    label: '45 мин',
    seconds: 45 * 60,
  },
  {
    label: '60 мин',
    seconds: 60 * 60,
  },
]

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return '0 сек'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} ч`)
  }

  if (minutes > 0) {
    parts.push(`${minutes} мин`)
  }

  if (seconds > 0) {
    parts.push(`${seconds} сек`)
  }

  return parts.join(' ')
}

function FocusTimer() {
  const activeTasks = useLiveQuery(async () => {
    const tasks = await db.tasks.where('status').equals('active').toArray()

    return tasks.sort((a, b) => {
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [])

  const {
    selectedTaskId,
    selectedTaskTitle,
    durationSeconds,
    secondsLeft,
    elapsedSeconds,
    status,
    startedAt,
    wasSessionSaved,
    savedDurationSeconds,

    setSelectedTask,
    setDurationSeconds,
    start,
    pause,
    reset,
    finishEarly,
    markSessionSaved,
    tick,
  } = useFocusTimerStore()

  const selectedTask = useMemo(() => {
    return activeTasks?.find((task) => task.id === selectedTaskId)
  }, [activeTasks, selectedTaskId])

  const shownTaskTitle = selectedTask?.title || selectedTaskTitle || 'Без задачи'

  const progressPercent = Math.min(
    100,
    Math.round((elapsedSeconds / durationSeconds) * 100),
  )

  useEffect(() => {
    if (status !== 'running') {
      return
    }

    tick()

    const intervalId = window.setInterval(() => {
      tick()
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [status, tick])

  useEffect(() => {
    if (status !== 'finished' || !startedAt || wasSessionSaved) {
      return
    }

    async function saveSession() {
      const durationToSaveSeconds =
        elapsedSeconds > 0 ? elapsedSeconds : durationSeconds

      await createFocusSession({
        taskId: selectedTaskId || undefined,
        taskTitle: shownTaskTitle === 'Без задачи' ? undefined : shownTaskTitle,
        durationMinutes: durationToSaveSeconds / 60,
        startedAt,
      })

      markSessionSaved(durationToSaveSeconds)
    }

    saveSession()
  }, [
    status,
    startedAt,
    wasSessionSaved,
    elapsedSeconds,
    durationSeconds,
    selectedTaskId,
    shownTaskTitle,
    markSessionSaved,
  ])

  function handleSelectTask(taskId: string) {
    const task = activeTasks?.find((currentTask) => currentTask.id === taskId)

    setSelectedTask(taskId, task?.title ?? '')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="mb-4 text-sm font-medium text-slate-400">
          Текущая сессия
        </p>

        <div className="mx-auto mb-8 flex h-72 w-72 flex-col items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 shadow-2xl shadow-violet-500/10">
          <span className="text-6xl font-bold tracking-tight">
            {formatTime(secondsLeft)}
          </span>

          <span className="mt-3 text-sm text-slate-400">
            {status === 'idle'
              ? 'Готов к старту'
              : status === 'running'
                ? 'Фокус идёт'
                : status === 'paused'
                  ? 'Пауза'
                  : 'Сессия завершена'}
          </span>
        </div>

        <div className="mb-8 h-3 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {status === 'finished' ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <p className="font-semibold text-emerald-100">
              Фокус-сессия сохранена
            </p>

            <p className="mt-1 text-sm text-emerald-200/80">
              {formatDuration(savedDurationSeconds || elapsedSeconds)} добавлено
              в статистику активности.
            </p>

            <button
              type="button"
              onClick={reset}
              className="mt-4 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Новая сессия
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={start}
              disabled={status === 'running'}
              className="rounded-2xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Старт
            </button>

            <button
              type="button"
              onClick={pause}
              disabled={status !== 'running'}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Пауза
            </button>

            <button
              type="button"
              onClick={finishEarly}
              disabled={
                status === 'idle' ||
                wasSessionSaved ||
                elapsedSeconds <= 0
              }
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Завершить
            </button>

            <button
              type="button"
              onClick={reset}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Сброс
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-semibold">Настройки</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Дело для фокуса
            </label>

            <select
              value={selectedTaskId}
              onChange={(event) => handleSelectTask(event.target.value)}
              disabled={status === 'running'}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Без задачи</option>

              {(activeTasks ?? []).map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Длительность
            </label>

            <div className="grid grid-cols-2 gap-3">
              {durationOptions.map((option) => (
                <button
                  key={option.seconds}
                  type="button"
                  onClick={() => setDurationSeconds(option.seconds)}
                  disabled={status === 'running'}
                  className={[
                    'rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                    durationSeconds === option.seconds
                      ? 'border-violet-400/30 bg-violet-500/15 text-white'
                      : 'border-white/10 bg-black/20 text-slate-300 hover:bg-white/10',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-slate-400">Выбранная задача</p>

            <p className="mt-2 text-lg font-semibold text-white">
              {shownTaskTitle}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-slate-400">Отработано</p>

            <p className="mt-2 text-3xl font-semibold">
              {formatDuration(elapsedSeconds)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FocusTimer