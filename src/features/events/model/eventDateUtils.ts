import type { CalendarEvent } from '../types'

const MS_IN_DAY = 24 * 60 * 60 * 1000

function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)

  return new Date(year, month - 1, day)
}

function getDaysDiff(fromDateString: string, toDateString: string) {
  const fromDate = parseDateString(fromDateString)
  const toDate = parseDateString(toDateString)

  return Math.floor((toDate.getTime() - fromDate.getTime()) / MS_IN_DAY)
}

function getMonthsDiff(fromDateString: string, toDateString: string) {
  const fromDate = parseDateString(fromDateString)
  const toDate = parseDateString(toDateString)

  return (
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
    (toDate.getMonth() - fromDate.getMonth())
  )
}

export function doesEventOccurOnDate(
  event: CalendarEvent,
  dateString: string,
) {
  const repeatInterval = Math.max(1, event.repeatInterval ?? 1)
  const daysDiff = getDaysDiff(event.date, dateString)

  if (daysDiff < 0) {
    return false
  }

  if (event.repeatType === 'none') {
    return event.date === dateString
  }

  if (event.repeatType === 'daily') {
    return daysDiff % repeatInterval === 0
  }

  if (event.repeatType === 'weekly') {
    return daysDiff % (7 * repeatInterval) === 0
  }

  if (event.repeatType === 'monthly') {
    const eventDate = parseDateString(event.date)
    const targetDate = parseDateString(dateString)
    const monthsDiff = getMonthsDiff(event.date, dateString)

    if (monthsDiff < 0) {
      return false
    }

    return (
      eventDate.getDate() === targetDate.getDate() &&
      monthsDiff % repeatInterval === 0
    )
  }

  return false
}