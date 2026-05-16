export function canUseBrowserNotifications() {
  return 'Notification' in window
}

export function getNotificationPermission() {
  if (!canUseBrowserNotifications()) {
    return 'unsupported'
  }

  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!canUseBrowserNotifications()) {
    return 'unsupported'
  }

  const permission = await Notification.requestPermission()

  return permission
}

type ShowNotificationInput = {
  title: string
  body: string
}

export function showBrowserNotification(input: ShowNotificationInput) {
  if (!canUseBrowserNotifications()) {
    return false
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  new Notification(input.title, {
    body: input.body,
  })

  return true
}