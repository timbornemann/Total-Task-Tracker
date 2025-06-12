import {
  ClipboardList,
  Columns,
  Calendar as CalendarIcon,
  BarChart3,
  BookOpen,
  Pencil,
  Timer,
  List,
  LucideIcon
} from 'lucide-react'

export interface HomeSection {
  key: string
  label: string
  path: string
  icon: LucideIcon
}

export const allHomeSections: HomeSection[] = [
  { key: 'tasks', label: 'Tasks', path: '/tasks', icon: ClipboardList },
  { key: 'kanban', label: 'Kanban', path: '/kanban', icon: Columns },
  { key: 'calendar', label: 'Kalender', path: '/calendar', icon: CalendarIcon },
  { key: 'statistics', label: 'Statistiken', path: '/statistics', icon: BarChart3 },
  { key: 'flashcards', label: 'Karten', path: '/flashcards', icon: BookOpen },
  { key: 'decks', label: 'Decks', path: '/flashcards/manage', icon: Pencil },
  { key: 'flashcard-stats', label: 'Karten-Statistik', path: '/flashcards/stats', icon: BarChart3 },
  { key: 'pomodoro', label: 'Pomodoro', path: '/pomodoro', icon: Timer },
  { key: 'notes', label: 'Notizen', path: '/notes', icon: List }
]
