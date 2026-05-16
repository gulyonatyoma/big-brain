import { useState } from 'react'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from '../model/notificationActions'

function getPermissionText(permission: string) {
  if (permission === 'granted') {
    return 'Уведомления разрешены'
  }

  if (permission === 'denied') {
    return 'Уведомления запрещены'
  }

  if (permission === 'default') {
    return 'Разрешение ещё не запрошено'
  }

  return 'Браузер не поддерживает уведомления'
}

function NotificationPermissionCard() {
  const [permission, setPermission] = useState(() => {
    return getNotificationPermission()
  })

  async function handleRequestPermission() {
    const nextPermission = await requestNotificationPermission()
    setPermission(nextPermission)
  }

  function handleTestNotification() {
    showBrowserNotification({
      title: 'Большой мозг',
      body: 'Тестовое уведомление работает.',
    })
  }

  const isGranted = permission === 'granted'
  const isDenied = permission === 'denied'
  const isUnsupported = permission === 'unsupported'

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="font-medium text-white">Уведомления</p>

          <p className="mt-1 text-sm text-slate-400">
            {getPermissionText(permission)}
          </p>

          {isDenied ? (
            <p className="mt-2 text-sm text-red-200">
              Браузер запретил уведомления. Разрешение нужно включить вручную в
              настройках сайта.
            </p>
          ) : null}

          {isUnsupported ? (
            <p className="mt-2 text-sm text-red-200">
              Этот браузер не поддерживает системные уведомления.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {!isGranted && !isDenied && !isUnsupported ? (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Разрешить
            </button>
          ) : null}

          {isGranted ? (
            <button
              type="button"
              onClick={handleTestNotification}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Тест
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default NotificationPermissionCard