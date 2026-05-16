export type EventRepeatType = 'none' | 'daily' | 'weekly' | 'monthly'

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  date: string
  startTime?: string
  endTime?: string

  /**
   * none    — не повторять
   * daily   — повторять по дням
   * weekly  — повторять по неделям
   * monthly — повторять по месяцам
   */
  repeatType: EventRepeatType

  /**
   * Интервал повторения.
   *
   * repeatType = 'daily', repeatInterval = 2   → каждые 2 дня
   * repeatType = 'weekly', repeatInterval = 2  → каждые 2 недели
   * repeatType = 'monthly', repeatInterval = 3 → каждые 3 месяца
   */
  repeatInterval: number

  reminderMinutesBefore?: number
  createdAt: string
}