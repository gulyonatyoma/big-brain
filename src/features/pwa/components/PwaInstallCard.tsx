import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function PwaInstallCard() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    setIsInstalled(isStandaloneMode())
    setIsIos(isIosDevice())

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function handleInstallClick() {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()

    const choice = await installPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="font-medium text-white">Установка на телефон</p>

          {isInstalled ? (
            <p className="mt-1 text-sm text-emerald-200">
              Приложение уже открыто в режиме установленного приложения.
            </p>
          ) : isIos ? (
            <p className="mt-1 text-sm leading-6 text-slate-400">
              На iPhone открой сайт в Safari, нажми кнопку “Поделиться” и выбери
              “На экран Домой”.
            </p>
          ) : installPrompt ? (
            <p className="mt-1 text-sm text-slate-400">
              Браузер готов установить “Большой мозг” как приложение.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-6 text-slate-400">
              После открытия production-версии сайта браузер сможет предложить
              установку приложения. На локальном preview кнопка может появиться
              не сразу.
            </p>
          )}
        </div>

        {installPrompt && !isInstalled ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="shrink-0 rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            Установить
          </button>
        ) : (
          <span className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
            PWA
          </span>
        )}
      </div>
    </div>
  )
}

export default PwaInstallCard