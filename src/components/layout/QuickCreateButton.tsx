import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type QuickAction = {
  title: string
  description: string
  getHref: () => string
  icon: string
}

const quickActions: QuickAction[] = [
  {
    title: 'Задача',
    description: 'Добавить новое дело',
    getHref: () => `/tasks?create=1&quick=${Date.now()}`,
    icon: '✓',
  },
  {
    title: 'Событие',
    description: 'Добавить в календарь',
    getHref: () => `/calendar?create=1&quick=${Date.now()}`,
    icon: '◷',
  },
  {
    title: 'Заметка',
    description: 'Записать мысль или идею',
    getHref: () => `/notes?create=1&quick=${Date.now()}`,
    icon: '✎',
  },
  {
    title: 'Фокус 25 мин',
    description: 'Сразу запустить таймер',
    getHref: () => `/focus?quickFocus=1&quick=${Date.now()}`,
    icon: '◉',
  },
]

function QuickCreateButton() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

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
    setIsOpen(false)
    navigate(action.getHref())
  }

  return (
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
  )
}

export default QuickCreateButton