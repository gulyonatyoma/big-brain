import { useEffect, useRef } from 'react'
import { db } from '../../../shared/db/db'
import { getTodayDateString } from '../../../shared/lib/dateTime'
import { doesEventOccurOnDate } from '../../events/model/eventDateUtils'
import { showBrowserNotification } from '../model/notificationActions'

function getEventDateTime(date: string, time?: string) {
  if (!time) {
    return null
  }

  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)

  return new Date(year, month - 1, day, hours, minutes)
}

function formatReminderText(minutesBefore: number) {
  if (minutesBefore === 0) {
    return 'Событие начинается сейчас'
  }

  if (minutesBefore === 1) {
    return 'Событие начнётся через 1 минуту'
  }

  if (minutesBefore === 60) {
    return 'Событие начнётся через 1 час'
  }

  return `Событие начнётся через ${minutesBefore} мин.`
}

function EventReminderWatcher() {
  const notifiedReminderKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    async function checkReminders() {
      const now = new Date()
      const nowMs = now.getTime()
      const today = getTodayDateString()

      const events = await db.events.toArray()

      events.forEach((event) => {
        if (!doesEventOccurOnDate(event, today)) {
          return
        }

        if (!event.startTime) {
          return
        }

        if (typeof event.reminderMinutesBefore !== 'number') {
          return
        }

        const eventDateTime = getEventDateTime(today, event.startTime)

        if (!eventDateTime) {
          return
        }

        const eventTimeMs = eventDateTime.getTime()

        const reminderTimeMs =
          eventTimeMs - event.reminderMinutesBefore * 60 * 1000

        /**
         * Логика уведомления:
         *
         * 1. Момент напоминания уже наступил.
         * 2. Событие ещё не слишком далеко в прошлом.
         *
         * Окно после начала события = 60 секунд.
         * Это нужно, чтобы уведомление не терялось, если событие создали
         * слишком близко ко времени старта или браузер проверил чуть позже.
         */
        const reminderMomentHasCome = reminderTimeMs <= nowMs
        const eventIsStillRelevant = nowMs <= eventTimeMs + 60 * 1000

        if (!reminderMomentHasCome || !eventIsStillRelevant) {
          return
        }

        const reminderKey = [
          event.id,
          today,
          event.startTime,
          event.reminderMinutesBefore,
        ].join('-')

        if (notifiedReminderKeysRef.current.has(reminderKey)) {
          return
        }

        const wasShown = showBrowserNotification({
          title: event.title,
          body: `${formatReminderText(event.reminderMinutesBefore)} · ${event.startTime}`,
        })

        if (wasShown) {
          notifiedReminderKeysRef.current.add(reminderKey)
        }
      })
    }

    checkReminders()

    const intervalId = window.setInterval(() => {
      checkReminders()
    }, 5 * 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return null
}

export default EventReminderWatcher