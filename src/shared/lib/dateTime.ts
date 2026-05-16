export function toDateString(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export function getTodayDateString() {
  return toDateString(new Date())
}

export function getDateStringFromIso(isoDate: string) {
  return isoDate.slice(0, 10)
}

export function getDateStringWithOffset(daysOffset: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)

  return toDateString(date)
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function formatLongDate(dateString: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

export function formatDurationFromMinutes(minutes: number) {
  const totalSeconds = Math.round(minutes * 60)

  return formatDurationFromSeconds(totalSeconds)
}

export function formatDurationFromSeconds(totalSeconds: number) {
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

export function formatTimerTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}