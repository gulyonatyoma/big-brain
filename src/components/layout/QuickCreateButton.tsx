import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

type QuickAction = {
  title: string
  description: string
  icon: string
  type: 'link' | 'focus'
  getHref?: () => string
}

type FocusDurationOption = {
  label: string
  seconds: number
}

const quickActions: QuickAction[] = [
  {
    title: 'Задача',
    description: 'Добавить новое дело',
    type: 'link',
    getHref: () => `/tasks?create=1&quick=${Date.now()}`,
    icon: '✓',
  },
  {
    title: 'Событие',
    description: 'Добавить в календарь',
    type: 'link',
    getHref: () => `/calendar?create=1&quick=${Date.now()}`,
    icon: '◷',
  },
  {
    title: 'Заметка',
    description: 'Записать мысль или идею',
    type: 'link',
    getHref: () => `/notes?create=1&quick=${Date.now()}`,
    icon: '✎',
  },
  {
    title: 'Фокус',
    description: 'Выбрать длительность',
    type: 'focus',
    icon: '◉',
  },
]

const focusDurationOptions: FocusDurationOption[] = [
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

function getQuickFocusUrl(durationSeconds: number) {
  const params = new URLSearchParams({
    quickFocus: '1',
    quick: String(Date.now()),
    durationSeconds: String(durationSeconds),
  })

  return `/focus?${params.toString()}`
}

function getCustomFocusSeconds(customFocusMinutes: string) {
  const normalizedValue = customFocusMinutes.replace(',', '.')
  const minutes = Number(normalizedValue)

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null
  }

  const limitedMinutes = Math.min(minutes, 240)

  return Math.round(limitedMinutes * 60)
}

function QuickCreateButton() {
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [isFocusDurationOpen, setIsFocusDurationOpen] = useState(false)
  const [customFocusMinutes, setCustomFocusMinutes] = useState('25')

  const containerRef = useRef<HTMLDivElement | null>(null)

  const customFocusSeconds = getCustomFocusSeconds(customFocusMinutes)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current) {
        return
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setIsFocusDurationOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleActionClick(action: QuickAction) {
    if (action.type === 'focus') {
      setIsOpen(false)
      setCustomFocusMinutes('25')
      setIsFocusDurationOpen(true)
      return
    }

    if (!action.getHref) {
      return
    }

    setIsOpen(false)
    navigate(action.getHref())
  }

  function handleCloseFocusDuration() {
    setIsFocusDurationOpen(false)
    setCustomFocusMinutes('25')
  }

  function handleStartFocus(durationSeconds: number) {
    navigate(getQuickFocusUrl(durationSeconds))
    handleCloseFocusDuration()
  }

  function handleStartCustomFocus() {
    if (!customFocusSeconds) {
      return
    }

    handleStartFocus(customFocusSeconds)
  }

  const focusDurationModal = isFocusDurationOpen ? (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-950/95 px-4 py-10 backdrop-blur-2xl">
      <button
        type="button"
        aria-label="Закрыть выбор длительности фокуса"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={handleCloseFocusDuration}
      />

      <div className="relative z-[1000] w-full max-w-lg rounded-[2rem] border border-emerald-400/30 bg-slate-950 p-6 shadow-[0_32px_120px_rgba(0,0,0,0.95)] ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-300">
              Быстрый фокус
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-white">
              Выбери длительность
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Фокус-сессия запустится без привязки к конкретной задаче.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCloseFocusDuration}
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Закрыть
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {focusDurationOptions.map((option) => (
            <button
              key={option.seconds}
              type="button"
              onClick={() => handleStartFocus(option.seconds)}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
          <label className="mb-2 block text-sm text-slate-400">
            Своя длительность, минут
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="number"
              min="1"
              max="240"
              step="1"
              value={customFocusMinutes}
              onChange={(event) => setCustomFocusMinutes(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
              placeholder="Например: 30"
            />

            <button
              type="button"
              onClick={handleStartCustomFocus}
              disabled={!customFocusSeconds}
              className="shrink-0 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Запустить
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Можно указать от 1 до 240 минут.
          </p>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <div
        ref={containerRef}
        className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8"
      >
        {isOpen ? (
          <div className="mb-4 w-72 rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="mb-2 px-2 py-1">
              <p className="text-sm font-medium text-white">Быстро создать</p>

              <p className="mt-1 text-xs text-slate-400">
                Выбери, что хочешь добавить
              </p>
            </div>

            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => handleActionClick(action)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-violet-400/40 hover:bg-white/10"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500 text-lg font-bold text-white">
                    {action.icon}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">
                      {action.title}
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-400">
                      {action.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          aria-label={isOpen ? 'Закрыть быстрое создание' : 'Быстро создать'}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500 text-4xl font-light leading-none text-white shadow-2xl shadow-violet-500/40 transition hover:scale-105 hover:bg-violet-400 active:scale-95"
        >
          <span
            className={[
              'mb-1 transition-transform',
              isOpen ? 'rotate-45' : 'rotate-0',
            ].join(' ')}
          >
            +
          </span>
        </button>
      </div>

      {focusDurationModal
        ? createPortal(focusDurationModal, document.body)
        : null}
    </>
  )
}

export default QuickCreateButton