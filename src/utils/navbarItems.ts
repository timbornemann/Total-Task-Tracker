export interface NavbarItem {
  key: string;
  group: string;
  labelKey: string;
  path: string;
}

export const allNavbarItems: NavbarItem[] = [
  { key: "overview", group: "tasks", labelKey: "navbar.overview", path: "/tasks" },
  { key: "kanban", group: "tasks", labelKey: "navbar.kanban", path: "/kanban" },
  { key: "schedule", group: "tasks", labelKey: "navbar.schedule", path: "/timeblocks" },
  { key: "recurring", group: "tasks", labelKey: "navbar.recurring", path: "/recurring" },
  { key: "habits", group: "tasks", labelKey: "navbar.habits", path: "/habits" },
  { key: "statistics", group: "tasks", labelKey: "navbar.statistics", path: "/statistics" },
  { key: "cards", group: "learning", labelKey: "navbar.cards", path: "/flashcards" },
  { key: "decks", group: "learning", labelKey: "navbar.decks", path: "/flashcards/manage" },
  { key: "pomodoro", group: "learning", labelKey: "navbar.pomodoro", path: "/pomodoro" },
  { key: "timers", group: "learning", labelKey: "navbar.timers", path: "/timers" },
  { key: "clock", group: "learning", labelKey: "navbar.clock", path: "/clock" },
  { key: "worklog", group: "learning", labelKey: "navbar.worklog", path: "/worklog" },
  { key: "cardStatistics", group: "learning", labelKey: "navbar.cardStatistics", path: "/flashcards/stats" },
  { key: "notes", group: "other", labelKey: "navbar.notes", path: "/notes" },
  { key: "inventory", group: "other", labelKey: "navbar.inventory", path: "/inventory" },
  { key: "settings", group: "other", labelKey: "navbar.settings", path: "/settings" },
];
