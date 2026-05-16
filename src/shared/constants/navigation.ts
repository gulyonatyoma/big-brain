export type NavigationItem = {
  title: string
  href: string
}

export const navigationItems: NavigationItem[] = [
  {
    title: 'Сегодня',
    href: '/today',
  },
  {
    title: 'Календарь',
    href: '/calendar',
  },
  {
    title: 'Все дела',
    href: '/tasks',
  },
  {
    title: 'Архив',
    href: '/archive',
  },
  {
    title: 'Заметки',
    href: '/notes',
  },
  {
    title: 'Фокус',
    href: '/focus',
  },
  {
    title: 'Активность',
    href: '/stats',
  },
  {
    title: 'Профиль',
    href: '/profile',
  },
]