import {
  ClipboardList,
  Columns,
  Calendar as CalendarIcon,
  BarChart3,
  BookOpen,
  Pencil,
  Package,
  Timer,
  Clock,
  List,
  Flame,
  Cog,
  LucideIcon,
} from "lucide-react";

export interface HomeSection {
  key: string;
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export const allHomeSections: HomeSection[] = [
  {
    key: "tasks",
    labelKey: "homeSections.tasks",
    path: "/tasks",
    icon: ClipboardList,
  },
  {
    key: "kanban",
    labelKey: "homeSections.kanban",
    path: "/kanban",
    icon: Columns,
  },
  {
    key: "timeblocks",
    labelKey: "homeSections.schedule",
    path: "/timeblocks",
    icon: CalendarIcon,
  },
  {
    key: "statistics",
    labelKey: "homeSections.statistics",
    path: "/statistics",
    icon: BarChart3,
  },
  {
    key: "flashcards",
    labelKey: "homeSections.cards",
    path: "/flashcards",
    icon: BookOpen,
  },
  {
    key: "decks",
    labelKey: "homeSections.decks",
    path: "/flashcards/manage",
    icon: Pencil,
  },
  {
    key: "flashcard-stats",
    labelKey: "homeSections.cardStats",
    path: "/flashcards/stats",
    icon: BarChart3,
  },
  {
    key: "pomodoro",
    labelKey: "homeSections.pomodoro",
    path: "/pomodoro",
    icon: Timer,
  },
  {
    key: "timers",
    labelKey: "homeSections.timers",
    path: "/timers",
    icon: Timer,
  },
  {
    key: "clock",
    labelKey: "homeSections.clock",
    path: "/clock",
    icon: Clock,
  },
  { key: "notes", labelKey: "homeSections.notes", path: "/notes", icon: List },
  {
    key: "inventory",
    labelKey: "homeSections.inventory",
    path: "/inventory",
    icon: Package,
  },
  {
    key: "recurring",
    labelKey: "homeSections.recurring",
    path: "/recurring",
    icon: List,
  },
  {
    key: "habits",
    labelKey: "homeSections.habits",
    path: "/habits",
    icon: Flame,
  },
  {
    key: "settings",
    labelKey: "homeSections.settings",
    path: "/settings",
    icon: Cog,
  },
];
