import React, { createContext, useContext, useEffect, useState } from "react";
import { allHomeSections } from "@/utils/homeSections";
import i18n from "@/lib/i18n";

export type ShortcutKeys = {
  openCommand: string;
  newTask: string;
  newNote: string;
  newFlashcard: string;
};

const defaultShortcuts: ShortcutKeys = {
  openCommand: "ctrl+k",
  newTask: "ctrl+alt+t",
  newNote: "ctrl+alt+n",
  newFlashcard: "ctrl+alt+f",
};

const defaultPomodoro = {
  workMinutes: 25,
  breakMinutes: 5,
  workSound: "",
  breakSound: "",
  customSounds: [] as string[],
};
const defaultFlashcardSettings = {
  timerSeconds: 10,
  sessionSize: 5,
  defaultMode: "spaced" as
    | "spaced"
    | "training"
    | "random"
    | "typing"
    | "timed",
};
const defaultSyncInterval = 5;
const defaultSyncEnabled = true;
const defaultTaskPriority: "low" | "medium" | "high" = "medium";
const defaultTaskLayoutSetting: "list" | "grid" = "list";
const defaultShowCompletedTasksSetting = true;
const defaultTaskColorSetting = 0;
const defaultTimerColorSetting = 0;
const defaultTimerExtendSetting = 60;
const defaultLanguage = "de";
const defaultLlmUrl = "";
const defaultLlmToken = "";
const defaultLlmModel = "gpt-3.5-turbo";
const defaultOfflineCache = true;
const defaultTheme = {
  background: "0 0% 100%",
  foreground: "222.2 84% 4.9%",
  primary: "222.2 47.4% 11.2%",
  "primary-foreground": "210 40% 98%",
  destructive: "0 84.2% 60.2%",
  "destructive-foreground": "210 40% 98%",
  secondary: "210 40% 96.1%",
  "secondary-foreground": "222.2 47.4% 11.2%",
  accent: "212 100% 47%",
  "accent-foreground": "222.2 47.4% 11.2%",
  muted: "210 40% 96.1%",
  "muted-foreground": "215.4 16.3% 46.9%",
  card: "0 0% 98%",
  popover: "0 0% 98%",
  "card-foreground": "222.2 84% 4.9%",
  "stat-bar-primary": "212 100% 47%",
  "stat-bar-secondary": "215 28% 80%",
  "kanban-todo": "210 40% 96.1%",
  "kanban-inprogress": "215 28% 80%",
  "kanban-done": "158 55% 52%",
  "pomodoro-work-ring": "222.2 47.4% 11.2%",
  "pomodoro-break-ring": "212 100% 47%",
  "task-overdue": "0 84.2% 60.2%",
};

export const defaultColorPalette = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#F97316",
  "#06B6D4",
  "#84CC16",
];

export const themePresets: Record<
  string,
  { theme: typeof defaultTheme; colorPalette: string[] }
> = {
  light: { theme: { ...defaultTheme }, colorPalette: [...defaultColorPalette] },
  dark: {
    theme: {
      background: "222 47% 11%",
      foreground: "210 40% 98%",
      primary: "210 40% 98%",
      "primary-foreground": "222.2 47.4% 11.2%",
      destructive: "0 62.8% 30.6%",
      "destructive-foreground": "210 40% 98%",
      secondary: "217.2 32.6% 17.5%",
      "secondary-foreground": "210 40% 98%",
      accent: "217 91% 60%",
      "accent-foreground": "210 40% 98%",
      muted: "217.2 32.6% 17.5%",
      "muted-foreground": "215 20.2% 65.1%",
      card: "218 28% 17%",
      popover: "218 28% 17%",
      "card-foreground": "210 40% 98%",
      "stat-bar-primary": "217 91% 60%",
      "stat-bar-secondary": "218 14% 30%",
      "kanban-todo": "218 14% 30%",
      "kanban-inprogress": "217 91% 60%",
      "kanban-done": "158 64% 52%",
      "pomodoro-work-ring": "210 40% 98%",
      "pomodoro-break-ring": "217 91% 60%",
      "task-overdue": "0 62.8% 30.6%",
    },
    colorPalette: [
      "#60A5FA",
      "#F87171",
      "#34D399",
      "#FBBF24",
      "#A78BFA",
      "#FB923C",
      "#22D3EE",
      "#A3E635",
    ],
  },
  ocean: {
    theme: {
      background: "210 60% 98%",
      foreground: "222.2 47.4% 11.2%",
      primary: "222.2 47.4% 11.2%",
      "primary-foreground": "210 40% 98%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "210 40% 98%",
      secondary: "210 40% 96.1%",
      "secondary-foreground": "222.2 47.4% 11.2%",
      accent: "199 94% 48%",
      "accent-foreground": "222.2 47.4% 11.2%",
      muted: "210 40% 96.1%",
      "muted-foreground": "215.4 16.3% 46.9%",
      card: "210 60% 96%",
      popover: "210 60% 96%",
      "card-foreground": "222.2 47.4% 11.2%",
      "stat-bar-primary": "199 94% 48%",
      "stat-bar-secondary": "214.3 31.8% 91.4%",
      "kanban-todo": "210 40% 96.1%",
      "kanban-inprogress": "210 80% 85%",
      "kanban-done": "199 94% 48%",
      "pomodoro-work-ring": "199 94% 48%",
      "pomodoro-break-ring": "210 40% 96.1%",
      "task-overdue": "0 84.2% 60.2%",
    },
    colorPalette: [
      "#0EA5E9",
      "#06B6D4",
      "#14B8A6",
      "#3B82F6",
      "#6366F1",
      "#8B5CF6",
      "#F59E0B",
      "#84CC16",
    ],
  },
  "dark-red": {
    theme: {
      background: "0 0% 9%",
      foreground: "0 0% 98%",
      primary: "210 40% 98%",
      "primary-foreground": "222.2 47.4% 11.2%",
      destructive: "0 72% 51%",
      "destructive-foreground": "210 40% 98%",
      secondary: "217.2 32.6% 17.5%",
      "secondary-foreground": "210 40% 98%",
      accent: "0 72% 51%",
      "accent-foreground": "210 40% 98%",
      muted: "217.2 32.6% 17.5%",
      "muted-foreground": "215 20.2% 65.1%",
      card: "0 0% 15%",
      popover: "0 0% 15%",
      "card-foreground": "0 0% 98%",
      "stat-bar-primary": "0 72% 51%",
      "stat-bar-secondary": "0 0% 25%",
      "kanban-todo": "0 0% 25%",
      "kanban-inprogress": "0 72% 51%",
      "kanban-done": "0 72% 51%",
      "pomodoro-work-ring": "0 0% 98%",
      "pomodoro-break-ring": "0 72% 51%",
      "task-overdue": "0 72% 51%",
    },
    colorPalette: [
      "#F87171",
      "#FB923C",
      "#FBBF24",
      "#F472B6",
      "#C084FC",
      "#F43F5E",
      "#E11D48",
      "#991B1B",
    ],
  },
  hacker: {
    theme: {
      background: "120 12% 8%",
      foreground: "120 100% 80%",
      primary: "210 40% 98%",
      "primary-foreground": "222.2 47.4% 11.2%",
      destructive: "0 62.8% 30.6%",
      "destructive-foreground": "210 40% 98%",
      secondary: "217.2 32.6% 17.5%",
      "secondary-foreground": "210 40% 98%",
      accent: "120 70% 40%",
      "accent-foreground": "120 100% 80%",
      muted: "217.2 32.6% 17.5%",
      "muted-foreground": "215 20.2% 65.1%",
      card: "120 10% 12%",
      popover: "120 10% 12%",
      "card-foreground": "120 100% 80%",
      "stat-bar-primary": "120 70% 40%",
      "stat-bar-secondary": "120 10% 20%",
      "kanban-todo": "120 20% 20%",
      "kanban-inprogress": "120 40% 30%",
      "kanban-done": "120 70% 40%",
      "pomodoro-work-ring": "120 100% 80%",
      "pomodoro-break-ring": "120 70% 40%",
      "task-overdue": "0 62.8% 30.6%",
    },
    colorPalette: [
      "#22C55E",
      "#84CC16",
      "#A3E635",
      "#34D399",
      "#06B6D4",
      "#F59E0B",
      "#EF4444",
      "#3B82F6",
    ],
  },
  motivation: {
    theme: {
      background: "40 100% 98%",
      foreground: "20 90% 10%",
      primary: "222.2 47.4% 11.2%",
      "primary-foreground": "210 40% 98%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "210 40% 98%",
      secondary: "210 40% 96.1%",
      "secondary-foreground": "222.2 47.4% 11.2%",
      accent: "30 100% 50%",
      "accent-foreground": "222.2 47.4% 11.2%",
      muted: "210 40% 96.1%",
      "muted-foreground": "215.4 16.3% 46.9%",
      card: "0 0% 100%",
      popover: "0 0% 100%",
      "card-foreground": "20 90% 10%",
      "stat-bar-primary": "30 100% 50%",
      "stat-bar-secondary": "38 88% 80%",
      "kanban-todo": "38 88% 80%",
      "kanban-inprogress": "30 100% 50%",
      "kanban-done": "88 50% 50%",
      "pomodoro-work-ring": "20 90% 10%",
      "pomodoro-break-ring": "30 100% 50%",
      "task-overdue": "0 84.2% 60.2%",
    },
    colorPalette: [
      "#F97316",
      "#F59E0B",
      "#EF4444",
      "#10B981",
      "#8B5CF6",
      "#EC4899",
      "#FBBF24",
      "#3B82F6",
    ],
  },
  nord: {
    theme: {
      background: "220 16% 96%",
      foreground: "220 16% 22%",
      primary: "220 16% 22%",
      "primary-foreground": "220 16% 96%",
      destructive: "354 42% 56%",
      "destructive-foreground": "220 16% 96%",
      secondary: "220 16% 92%",
      "secondary-foreground": "220 16% 22%",
      accent: "210 34% 63%",
      "accent-foreground": "220 16% 22%",
      muted: "220 16% 92%",
      "muted-foreground": "220 16% 45%",
      card: "220 16% 98%",
      popover: "220 16% 98%",
      "card-foreground": "220 16% 22%",
      "stat-bar-primary": "210 34% 63%",
      "stat-bar-secondary": "179 25% 65%",
      "kanban-todo": "220 16% 92%",
      "kanban-inprogress": "210 34% 63%",
      "kanban-done": "179 25% 65%",
      "pomodoro-work-ring": "220 16% 22%",
      "pomodoro-break-ring": "210 34% 63%",
      "task-overdue": "354 42% 56%",
    },
    colorPalette: [
      "#5E81AC",
      "#81A1C1",
      "#88C0D0",
      "#8FBCBB",
      "#D08770",
      "#BF616A",
      "#B48EAD",
      "#A3BE8C",
    ],
  },
  "nord-dark": {
    theme: {
      background: "220 16% 18%",
      foreground: "218 27% 92%",
      primary: "218 27% 92%",
      "primary-foreground": "220 16% 18%",
      destructive: "354 42% 56%",
      "destructive-foreground": "218 27% 92%",
      secondary: "220 16% 24%",
      "secondary-foreground": "218 27% 92%",
      accent: "210 34% 63%",
      "accent-foreground": "218 27% 92%",
      muted: "220 16% 24%",
      "muted-foreground": "220 14% 71%",
      card: "220 16% 22%",
      popover: "220 16% 22%",
      "card-foreground": "218 27% 92%",
      "stat-bar-primary": "210 34% 63%",
      "stat-bar-secondary": "179 25% 65%",
      "kanban-todo": "220 16% 26%",
      "kanban-inprogress": "210 34% 63%",
      "kanban-done": "179 25% 65%",
      "pomodoro-work-ring": "218 27% 92%",
      "pomodoro-break-ring": "210 34% 63%",
      "task-overdue": "354 42% 56%",
    },
    colorPalette: [
      "#81A1C1",
      "#88C0D0",
      "#8FBCBB",
      "#A3BE8C",
      "#D08770",
      "#BF616A",
      "#B48EAD",
      "#5E81AC",
    ],
  },
  forest: {
    theme: {
      background: "115 12% 97%",
      foreground: "140 10% 15%",
      primary: "140 10% 15%",
      "primary-foreground": "115 12% 97%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "115 12% 97%",
      secondary: "115 12% 92%",
      "secondary-foreground": "140 10% 15%",
      accent: "150 60% 40%",
      "accent-foreground": "140 10% 15%",
      muted: "115 12% 92%",
      "muted-foreground": "140 5% 45%",
      card: "115 12% 99%",
      popover: "115 12% 99%",
      "card-foreground": "140 10% 15%",
      "stat-bar-primary": "150 60% 40%",
      "stat-bar-secondary": "80 36% 75%",
      "kanban-todo": "115 12% 92%",
      "kanban-inprogress": "150 40% 70%",
      "kanban-done": "150 60% 40%",
      "pomodoro-work-ring": "140 10% 15%",
      "pomodoro-break-ring": "150 60% 40%",
      "task-overdue": "0 84.2% 60.2%",
    },
    colorPalette: [
      "#22C55E",
      "#4ADE80",
      "#84CC16",
      "#10B981",
      "#047857",
      "#A3E635",
      "#65A30D",
      "#15803D",
    ],
  },
  violet: {
    theme: {
      background: "260 25% 98%",
      foreground: "260 25% 18%",
      primary: "260 25% 18%",
      "primary-foreground": "260 25% 98%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "260 25% 98%",
      secondary: "260 25% 94%",
      "secondary-foreground": "260 25% 18%",
      accent: "270 76% 60%",
      "accent-foreground": "260 25% 18%",
      muted: "260 25% 94%",
      "muted-foreground": "260 15% 45%",
      card: "260 25% 99%",
      popover: "260 25% 99%",
      "card-foreground": "260 25% 18%",
      "stat-bar-primary": "270 76% 60%",
      "stat-bar-secondary": "246 60% 85%",
      "kanban-todo": "260 25% 94%",
      "kanban-inprogress": "270 50% 75%",
      "kanban-done": "270 76% 60%",
      "pomodoro-work-ring": "260 25% 18%",
      "pomodoro-break-ring": "270 76% 60%",
      "task-overdue": "0 84.2% 60.2%",
    },
    colorPalette: [
      "#8B5CF6",
      "#A78BFA",
      "#C084FC",
      "#6366F1",
      "#4F46E5",
      "#F472B6",
      "#E879F9",
      "#D946EF",
    ],
  },
  coffee: {
    theme: {
      background: "30 25% 97%",
      foreground: "30 25% 15%",
      primary: "30 25% 15%",
      "primary-foreground": "30 25% 97%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "30 25% 97%",
      secondary: "30 20% 92%",
      "secondary-foreground": "30 25% 15%",
      accent: "25 60% 45%",
      "accent-foreground": "30 25% 97%",
      muted: "30 20% 92%",
      "muted-foreground": "30 15% 45%",
      card: "30 20% 99%",
      popover: "30 20% 99%",
      "card-foreground": "30 25% 15%",
      "stat-bar-primary": "25 60% 45%",
      "stat-bar-secondary": "34 30% 80%",
      "kanban-todo": "30 20% 92%",
      "kanban-inprogress": "34 30% 80%",
      "kanban-done": "25 60% 45%",
      "pomodoro-work-ring": "30 25% 15%",
      "pomodoro-break-ring": "25 60% 45%",
      "task-overdue": "0 84.2% 60.2%",
    },
    colorPalette: [
      "#78350F",
      "#92400E",
      "#B45309",
      "#D97706",
      "#F59E0B",
      "#FBBF24",
      "#A16207",
      "#A3E635",
    ],
  },
  midnight: {
    theme: {
      background: "234 32% 12%",
      foreground: "210 40% 98%",
      primary: "210 40% 98%",
      "primary-foreground": "234 32% 12%",
      destructive: "0 62.8% 30.6%",
      "destructive-foreground": "210 40% 98%",
      secondary: "234 30% 18%",
      "secondary-foreground": "210 40% 98%",
      accent: "228 96% 75%",
      "accent-foreground": "210 40% 98%",
      muted: "234 30% 18%",
      "muted-foreground": "215 20.2% 65.1%",
      card: "234 32% 16%",
      popover: "234 32% 16%",
      "card-foreground": "210 40% 98%",
      "stat-bar-primary": "228 96% 75%",
      "stat-bar-secondary": "234 24% 26%",
      "kanban-todo": "234 24% 26%",
      "kanban-inprogress": "228 96% 75%",
      "kanban-done": "195 85% 65%",
      "pomodoro-work-ring": "210 40% 98%",
      "pomodoro-break-ring": "228 96% 75%",
      "task-overdue": "0 62.8% 30.6%",
    },
    colorPalette: [
      "#818CF8",
      "#4F46E5",
      "#38BDF8",
      "#22D3EE",
      "#A78BFA",
      "#F472B6",
      "#E879F9",
      "#2DD4BF",
    ],
  },
  pastel: {
    theme: {
      background: "0 0% 100%",
      foreground: "240 10% 25%",
      primary: "240 10% 25%",
      "primary-foreground": "0 0% 100%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "0 0% 100%",
      secondary: "240 10% 95%",
      "secondary-foreground": "240 10% 25%",
      accent: "340 82% 85%",
      "accent-foreground": "240 10% 25%",
      muted: "240 10% 95%",
      "muted-foreground": "240 10% 45%",
      card: "0 0% 100%",
      popover: "0 0% 100%",
      "card-foreground": "240 10% 25%",
      "stat-bar-primary": "340 82% 85%",
      "stat-bar-secondary": "190 85% 85%",
      "kanban-todo": "240 10% 95%",
      "kanban-inprogress": "190 85% 85%",
      "kanban-done": "130 77% 85%",
      "pomodoro-work-ring": "240 10% 25%",
      "pomodoro-break-ring": "340 82% 85%",
      "task-overdue": "0 84.2% 60.2%",
    },
    colorPalette: [
      "#FDA4AF",
      "#FCD34D",
      "#86EFAC",
      "#A5B4FC",
      "#FBCFE8",
      "#BAE6FD",
      "#C4B5FD",
      "#FED7AA",
    ],
  },
  // Serious business themes
  corporate: {
    theme: {
      background: "210 20% 98%",
      foreground: "224 71% 4%",
      primary: "224 71% 4%",
      "primary-foreground": "210 20% 98%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "210 20% 98%",
      secondary: "210 20% 94%",
      "secondary-foreground": "224 71% 4%",
      accent: "217 91% 60%",
      "accent-foreground": "210 20% 98%",
      muted: "210 20% 94%",
      "muted-foreground": "217 5% 50%",
      card: "0 0% 100%",
      popover: "0 0% 100%",
      "card-foreground": "224 71% 4%",
      "stat-bar-primary": "217 91% 60%",
      "stat-bar-secondary": "214 100% 95%",
      "kanban-todo": "210 20% 94%",
      "kanban-inprogress": "215 100% 80%",
      "kanban-done": "217 91% 60%",
      "pomodoro-work-ring": "224 71% 4%",
      "pomodoro-break-ring": "217 91% 60%",
      "task-overdue": "0 84.2% 60.2%",
    },
    colorPalette: [
      "#1E40AF",
      "#2563EB",
      "#3B82F6",
      "#075985",
      "#0369A1",
      "#0284C7",
      "#64748B",
      "#94A3B8",
    ],
  },
  professional: {
    theme: {
      background: "0 0% 100%",
      foreground: "240 10% 20%",
      primary: "240 10% 20%",
      "primary-foreground": "0 0% 100%",
      destructive: "0 70% 50%",
      "destructive-foreground": "0 0% 100%",
      secondary: "240 5% 95%",
      "secondary-foreground": "240 10% 20%",
      accent: "240 35% 40%",
      "accent-foreground": "0 0% 100%",
      muted: "240 5% 95%",
      "muted-foreground": "240 5% 45%",
      card: "0 0% 100%",
      popover: "0 0% 100%",
      "card-foreground": "240 10% 20%",
      "stat-bar-primary": "240 35% 40%",
      "stat-bar-secondary": "240 20% 92%",
      "kanban-todo": "240 5% 95%",
      "kanban-inprogress": "240 20% 92%",
      "kanban-done": "240 35% 40%",
      "pomodoro-work-ring": "240 10% 20%",
      "pomodoro-break-ring": "240 35% 40%",
      "task-overdue": "0 70% 50%",
    },
    colorPalette: [
      "#374151",
      "#4B5563",
      "#6B7280",
      "#9CA3AF",
      "#1F2937",
      "#111827",
      "#6D28D9",
      "#BE185D",
    ],
  },
  slate: {
    theme: {
      background: "210 40% 96%",
      foreground: "215 25% 20%",
      primary: "215 25% 20%",
      "primary-foreground": "210 40% 96%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "210 40% 96%",
      secondary: "215 15% 90%",
      "secondary-foreground": "215 25% 20%",
      accent: "215 25% 30%",
      "accent-foreground": "210 40% 96%",
      muted: "215 15% 90%",
      "muted-foreground": "215 15% 40%",
      card: "210 40% 98%",
      popover: "210 40% 98%",
      "card-foreground": "215 25% 20%",
      "stat-bar-primary": "215 25% 30%",
      "stat-bar-secondary": "215 25% 90%",
      "kanban-todo": "215 15% 90%",
      "kanban-inprogress": "215 25% 75%",
      "kanban-done": "215 25% 30%",
      "pomodoro-work-ring": "215 25% 20%",
      "pomodoro-break-ring": "215 25% 30%",
      "task-overdue": "0 84.2% 60.2%",
    },
    colorPalette: [
      "#475569",
      "#64748B",
      "#94A3B8",
      "#CBD5E1",
      "#334155",
      "#1E293B",
      "#0F172A",
      "#0EA5E9",
    ],
  },
  // Relaxed themes
  calm: {
    theme: {
      background: "180 5% 98%",
      foreground: "180 20% 20%",
      primary: "180 20% 20%",
      "primary-foreground": "180 5% 98%",
      destructive: "0 70% 60%",
      "destructive-foreground": "180 5% 98%",
      secondary: "180 10% 92%",
      "secondary-foreground": "180 20% 20%",
      accent: "194 80% 40%",
      "accent-foreground": "180 5% 98%",
      muted: "180 10% 92%",
      "muted-foreground": "180 20% 50%",
      card: "180 5% 100%",
      popover: "180 5% 100%",
      "card-foreground": "180 20% 20%",
      "stat-bar-primary": "194 80% 40%",
      "stat-bar-secondary": "194 80% 85%",
      "kanban-todo": "180 10% 92%",
      "kanban-inprogress": "194 80% 75%",
      "kanban-done": "194 80% 40%",
      "pomodoro-work-ring": "180 20% 20%",
      "pomodoro-break-ring": "194 80% 40%",
      "task-overdue": "0 70% 60%",
    },
    colorPalette: [
      "#0891B2",
      "#06B6D4",
      "#22D3EE",
      "#67E8F9",
      "#155E75",
      "#164E63",
      "#0E7490",
      "#14B8A6",
    ],
  },
  serene: {
    theme: {
      background: "200 30% 98%",
      foreground: "200 30% 15%",
      primary: "200 30% 15%",
      "primary-foreground": "200 30% 98%",
      destructive: "0 70% 60%",
      "destructive-foreground": "200 30% 98%",
      secondary: "200 15% 93%",
      "secondary-foreground": "200 30% 15%",
      accent: "175 70% 35%",
      "accent-foreground": "200 30% 98%",
      muted: "200 15% 93%",
      "muted-foreground": "200 15% 45%",
      card: "200 30% 99%",
      popover: "200 30% 99%",
      "card-foreground": "200 30% 15%",
      "stat-bar-primary": "175 70% 35%",
      "stat-bar-secondary": "175 70% 85%",
      "kanban-todo": "200 15% 93%",
      "kanban-inprogress": "175 70% 70%",
      "kanban-done": "175 70% 35%",
      "pomodoro-work-ring": "200 30% 15%",
      "pomodoro-break-ring": "175 70% 35%",
      "task-overdue": "0 70% 60%",
    },
    colorPalette: [
      "#0F766E",
      "#14B8A6",
      "#2DD4BF",
      "#5EEAD4",
      "#0D9488",
      "#064E3B",
      "#047857",
      "#4338CA",
    ],
  },
  zen: {
    theme: {
      background: "35 20% 98%",
      foreground: "35 20% 20%",
      primary: "35 20% 20%",
      "primary-foreground": "35 20% 98%",
      destructive: "0 70% 60%",
      "destructive-foreground": "35 20% 98%",
      secondary: "35 10% 93%",
      "secondary-foreground": "35 20% 20%",
      accent: "35 70% 55%",
      "accent-foreground": "35 20% 98%",
      muted: "35 10% 93%",
      "muted-foreground": "35 20% 45%",
      card: "35 20% 99%",
      popover: "35 20% 99%",
      "card-foreground": "35 20% 20%",
      "stat-bar-primary": "35 70% 55%",
      "stat-bar-secondary": "35 40% 90%",
      "kanban-todo": "35 10% 93%",
      "kanban-inprogress": "35 40% 80%",
      "kanban-done": "35 70% 55%",
      "pomodoro-work-ring": "35 20% 20%",
      "pomodoro-break-ring": "35 70% 55%",
      "task-overdue": "0 70% 60%",
    },
    colorPalette: [
      "#D97706",
      "#F59E0B",
      "#FBBF24",
      "#FCD34D",
      "#B45309",
      "#92400E",
      "#78350F",
      "#A16207",
    ],
  },
  // Fun themes
  candy: {
    theme: {
      background: "300 100% 98%",
      foreground: "300 60% 30%",
      primary: "300 60% 30%",
      "primary-foreground": "300 100% 98%",
      destructive: "0 100% 65%",
      "destructive-foreground": "300 100% 98%",
      secondary: "325 100% 96%",
      "secondary-foreground": "300 60% 30%",
      accent: "325 90% 70%",
      "accent-foreground": "300 100% 98%",
      muted: "325 100% 96%",
      "muted-foreground": "300 50% 50%",
      card: "300 100% 99%",
      popover: "300 100% 99%",
      "card-foreground": "300 60% 30%",
      "stat-bar-primary": "325 90% 70%",
      "stat-bar-secondary": "290 100% 90%",
      "kanban-todo": "325 100% 96%",
      "kanban-inprogress": "290 100% 90%",
      "kanban-done": "325 90% 70%",
      "pomodoro-work-ring": "300 60% 30%",
      "pomodoro-break-ring": "325 90% 70%",
      "task-overdue": "0 100% 65%",
    },
    colorPalette: [
      "#DB2777",
      "#EC4899",
      "#F472B6",
      "#FBCFE8",
      "#C026D3",
      "#E879F9",
      "#F0ABFC",
      "#F9A8D4",
    ],
  },
  love: {
    theme: {
      background: "340 100% 99%",
      foreground: "340 60% 25%",
      primary: "340 60% 25%",
      "primary-foreground": "340 100% 99%",
      destructive: "0 100% 60%",
      "destructive-foreground": "340 100% 99%",
      secondary: "350 100% 96%",
      "secondary-foreground": "340 60% 25%",
      accent: "350 90% 65%",
      "accent-foreground": "340 100% 99%",
      muted: "350 100% 96%",
      "muted-foreground": "340 60% 45%",
      card: "340 100% 100%",
      popover: "340 100% 100%",
      "card-foreground": "340 60% 25%",
      "stat-bar-primary": "350 90% 65%",
      "stat-bar-secondary": "350 90% 85%",
      "kanban-todo": "350 100% 96%",
      "kanban-inprogress": "350 90% 85%",
      "kanban-done": "350 90% 65%",
      "pomodoro-work-ring": "340 60% 25%",
      "pomodoro-break-ring": "350 90% 65%",
      "task-overdue": "0 100% 60%",
    },
    colorPalette: [
      "#E11D48",
      "#F43F5E",
      "#FB7185",
      "#FDA4AF",
      "#BE123C",
      "#9F1239",
      "#881337",
      "#DB2777",
    ],
  },
  galaxy: {
    theme: {
      background: "240 50% 3%",
      foreground: "240 50% 95%",
      primary: "240 50% 95%",
      "primary-foreground": "240 50% 3%",
      destructive: "0 80% 50%",
      "destructive-foreground": "240 50% 95%",
      secondary: "240 30% 10%",
      "secondary-foreground": "240 50% 95%",
      accent: "270 100% 65%",
      "accent-foreground": "240 50% 95%",
      muted: "240 30% 10%",
      "muted-foreground": "240 30% 60%",
      card: "240 50% 6%",
      popover: "240 50% 6%",
      "card-foreground": "240 50% 95%",
      "stat-bar-primary": "270 100% 65%",
      "stat-bar-secondary": "170 100% 60%",
      "kanban-todo": "240 30% 15%",
      "kanban-inprogress": "270 100% 35%",
      "kanban-done": "170 100% 30%",
      "pomodoro-work-ring": "240 50% 95%",
      "pomodoro-break-ring": "270 100% 65%",
      "task-overdue": "0 80% 50%",
    },
    colorPalette: [
      "#C026D3",
      "#7C3AED",
      "#4F46E5",
      "#2563EB",
      "#D946EF",
      "#8B5CF6",
      "#6366F1",
      "#3B82F6",
    ],
  },
  cyber: {
    theme: {
      background: "220 60% 5%",
      foreground: "180 100% 70%",
      primary: "180 100% 70%",
      "primary-foreground": "220 60% 5%",
      destructive: "0 100% 65%",
      "destructive-foreground": "180 100% 70%",
      secondary: "220 60% 12%",
      "secondary-foreground": "180 100% 70%",
      accent: "300 100% 65%",
      "accent-foreground": "180 100% 70%",
      muted: "220 60% 12%",
      "muted-foreground": "220 60% 40%",
      card: "220 60% 8%",
      popover: "220 60% 8%",
      "card-foreground": "180 100% 70%",
      "stat-bar-primary": "300 100% 65%",
      "stat-bar-secondary": "195 100% 55%",
      "kanban-todo": "220 60% 12%",
      "kanban-inprogress": "220 100% 40%",
      "kanban-done": "300 100% 45%",
      "pomodoro-work-ring": "180 100% 70%",
      "pomodoro-break-ring": "300 100% 65%",
      "task-overdue": "0 100% 65%",
    },
    colorPalette: [
      "#F0ABFC",
      "#C084FC",
      "#2DD4BF",
      "#22D3EE",
      "#38BDF8",
      "#818CF8",
      "#FB7185",
      "#34D399",
    ],
  },
  lemonade: {
    theme: {
      background: "55 100% 95%",
      foreground: "30 90% 20%",
      primary: "30 90% 20%",
      "primary-foreground": "55 100% 95%",
      destructive: "0 90% 60%",
      "destructive-foreground": "55 100% 95%",
      secondary: "55 100% 90%",
      "secondary-foreground": "30 90% 20%",
      accent: "30 90% 50%",
      "accent-foreground": "55 100% 95%",
      muted: "55 100% 90%",
      "muted-foreground": "30 90% 40%",
      card: "55 100% 98%",
      popover: "55 100% 98%",
      "card-foreground": "30 90% 20%",
      "stat-bar-primary": "30 90% 50%",
      "stat-bar-secondary": "55 90% 75%",
      "kanban-todo": "55 100% 90%",
      "kanban-inprogress": "45 90% 75%",
      "kanban-done": "30 90% 50%",
      "pomodoro-work-ring": "30 90% 20%",
      "pomodoro-break-ring": "30 90% 50%",
      "task-overdue": "0 90% 60%",
    },
    colorPalette: [
      "#CA8A04",
      "#EAB308",
      "#FACC15",
      "#FDE047",
      "#FEF08A",
      "#F59E0B",
      "#D97706",
      "#EA580C",
    ],
  },
};

export const defaultHomeSectionColors: Record<string, number> =
  allHomeSections.reduce(
    (acc, sec, idx) => {
      acc[sec.key] = idx % defaultColorPalette.length;
      return acc;
    },
    {} as Record<string, number>,
  );

interface SettingsContextValue {
  shortcuts: ShortcutKeys;
  updateShortcut: (key: keyof ShortcutKeys, value: string) => void;
  pomodoro: {
    workMinutes: number;
    breakMinutes: number;
    workSound: string;
    breakSound: string;
    customSounds: string[];
  };
  updatePomodoro: (
    key: "workMinutes" | "breakMinutes" | "workSound" | "breakSound",
    value: number | string,
  ) => void;
  addPomodoroSound: (url: string) => void;
  deletePomodoroSound: (url: string) => void;
  defaultTaskPriority: "low" | "medium" | "high";
  updateDefaultTaskPriority: (value: "low" | "medium" | "high") => void;
  theme: typeof defaultTheme;
  updateTheme: (key: keyof typeof defaultTheme, value: string) => void;
  themeName: string;
  updateThemeName: (name: string) => void;
  customThemes: {
    name: string;
    theme: typeof defaultTheme;
    colorPalette: string[];
  }[];
  addCustomTheme: (name: string) => void;
  deleteCustomTheme: (name: string) => void;
  colorPalette: string[];
  updatePaletteColor: (index: number, value: string) => void;
  homeSectionColors: Record<string, number>;
  updateHomeSectionColor: (section: string, color: number) => void;
  homeSections: string[];
  homeSectionOrder: string[];
  toggleHomeSection: (section: string) => void;
  reorderHomeSections: (start: number, end: number) => void;
  showPinnedTasks: boolean;
  toggleShowPinnedTasks: () => void;
  showPinnedNotes: boolean;
  toggleShowPinnedNotes: () => void;
  showPinnedCategories: boolean;
  toggleShowPinnedCategories: () => void;
  showPinnedHabits: boolean;
  toggleShowPinnedHabits: () => void;
  collapseSubtasksByDefault: boolean;
  toggleCollapseSubtasksByDefault: () => void;
  defaultTaskLayout: "list" | "grid";
  updateDefaultTaskLayout: (val: "list" | "grid") => void;
  showCompletedByDefault: boolean;
  toggleShowCompletedByDefault: () => void;
  defaultTaskColor: number;
  updateDefaultTaskColor: (val: number) => void;
  defaultTimerColor: number;
  updateDefaultTimerColor: (val: number) => void;
  timerExtendSeconds: number;
  updateTimerExtendSeconds: (val: number) => void;
  flashcardTimer: number;
  updateFlashcardTimer: (value: number) => void;
  flashcardSessionSize: number;
  updateFlashcardSessionSize: (value: number) => void;
  flashcardDefaultMode: "spaced" | "training" | "random" | "typing" | "timed";
  updateFlashcardDefaultMode: (
    value: "spaced" | "training" | "random" | "typing" | "timed",
  ) => void;
  syncRole: "server" | "client";
  updateSyncRole: (role: "server" | "client") => void;
  syncServerUrl: string;
  updateSyncServerUrl: (url: string) => void;
  syncInterval: number;
  updateSyncInterval: (value: number) => void;
  syncEnabled: boolean;
  updateSyncEnabled: (value: boolean) => void;
  language: string;
  updateLanguage: (lang: string) => void;
  llmUrl: string;
  updateLlmUrl: (url: string) => void;
  llmToken: string;
  updateLlmToken: (token: string) => void;
  llmModel: string;
  updateLlmModel: (model: string) => void;
  offlineCache: boolean;
  toggleOfflineCache: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [shortcuts, setShortcuts] = useState<ShortcutKeys>(defaultShortcuts);
  const [pomodoro, setPomodoro] = useState(defaultPomodoro);
  const [flashcardTimer, setFlashcardTimer] = useState(
    defaultFlashcardSettings.timerSeconds,
  );
  const [flashcardSessionSize, setFlashcardSessionSize] = useState(
    defaultFlashcardSettings.sessionSize,
  );
  const [flashcardDefaultMode, setFlashcardDefaultMode] = useState(
    defaultFlashcardSettings.defaultMode,
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    defaultTaskPriority,
  );
  const [theme, setTheme] = useState(defaultTheme);
  const [themeName, setThemeName] = useState("light");
  const [customThemes, setCustomThemes] = useState<
    {
      name: string;
      theme: typeof defaultTheme;
      colorPalette: string[];
    }[]
  >([]);
  const [colorPalette, setColorPalette] =
    useState<string[]>(defaultColorPalette);
  const [homeSectionColors, setHomeSectionColors] = useState<
    Record<string, number>
  >({ ...defaultHomeSectionColors });
  const [homeSectionOrder, setHomeSectionOrder] = useState<string[]>(
    allHomeSections.map((s) => s.key),
  );
  const [homeSections, setHomeSections] = useState<string[]>([
    "tasks",
    "flashcards",
    "notes",
  ]);
  const [showPinnedTasks, setShowPinnedTasks] = useState(true);
  const [showPinnedNotes, setShowPinnedNotes] = useState(true);
  const [showPinnedCategories, setShowPinnedCategories] = useState(true);
  const [showPinnedHabits, setShowPinnedHabits] = useState(true);
  const [collapseSubtasksByDefault, setCollapseSubtasksByDefault] =
    useState(false);
  const [defaultTaskLayout, setDefaultTaskLayout] = useState<"list" | "grid">(
    defaultTaskLayoutSetting,
  );
  const [showCompletedByDefault, setShowCompletedByDefault] = useState(
    defaultShowCompletedTasksSetting,
  );
  const [defaultTaskColor, setDefaultTaskColor] = useState(
    defaultTaskColorSetting,
  );
  const [defaultTimerColor, setDefaultTimerColor] = useState(
    defaultTimerColorSetting,
  );
  const [timerExtendSeconds, setTimerExtendSeconds] = useState(
    defaultTimerExtendSetting,
  );
  const [syncRole, setSyncRole] = useState<"server" | "client">("client");
  const [syncServerUrl, setSyncServerUrl] = useState("");
  const [syncInterval, setSyncInterval] = useState(defaultSyncInterval);
  const [syncEnabled, setSyncEnabled] = useState(defaultSyncEnabled);
  const [language, setLanguage] = useState(defaultLanguage);
  const [llmUrl, setLlmUrl] = useState(defaultLlmUrl);
  const [llmToken, setLlmToken] = useState(defaultLlmToken);
  const [llmModel, setLlmModel] = useState(defaultLlmModel);
  const [offlineCache, setOfflineCache] = useState(defaultOfflineCache);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.shortcuts) {
            setShortcuts({ ...defaultShortcuts, ...data.shortcuts });
          }
          if (data.pomodoro) {
            setPomodoro({
              ...defaultPomodoro,
              ...data.pomodoro,
              customSounds: Array.isArray(data.pomodoro.customSounds)
                ? data.pomodoro.customSounds
                : defaultPomodoro.customSounds,
            });
          }
          if (data.defaultTaskPriority) {
            setPriority(data.defaultTaskPriority);
          }
          if (data.themeName) {
            setThemeName(data.themeName);
            const preset = themePresets[data.themeName];
            if (preset) {
              setTheme(preset.theme);
              setColorPalette(preset.colorPalette);
            } else if (data.theme) {
              setTheme({ ...defaultTheme, ...data.theme });
            }
            if (!preset && Array.isArray(data.colorPalette)) {
              setColorPalette(data.colorPalette);
            }
            if (Array.isArray(data.customThemes)) {
              setCustomThemes(data.customThemes);
            }
          } else {
            if (data.theme) {
              setTheme({ ...defaultTheme, ...data.theme });
            }
            if (Array.isArray(data.colorPalette)) {
              setColorPalette(data.colorPalette);
            }
            if (Array.isArray(data.customThemes)) {
              setCustomThemes(data.customThemes);
            }
          }
          if (Array.isArray(data.homeSectionOrder)) {
            const order = data.homeSectionOrder as string[];
            setHomeSectionOrder(
              order.concat(
                allHomeSections
                  .filter((s) => !order.includes(s.key))
                  .map((s) => s.key),
              ),
            );
          } else if (Array.isArray(data.homeSections)) {
            setHomeSectionOrder(
              data.homeSections.concat(
                allHomeSections
                  .filter((s) => !data.homeSections.includes(s.key))
                  .map((s) => s.key),
              ),
            );
            setHomeSections(data.homeSections);
          }
          if (
            data.homeSectionColors &&
            typeof data.homeSectionColors === "object"
          ) {
            setHomeSectionColors({
              ...defaultHomeSectionColors,
              ...data.homeSectionColors,
            });
          }
          if (Array.isArray(data.homeSections)) {
            setHomeSections(data.homeSections);
          }
          if (typeof data.showPinnedTasks === "boolean") {
            setShowPinnedTasks(data.showPinnedTasks);
          }
          if (typeof data.showPinnedNotes === "boolean") {
            setShowPinnedNotes(data.showPinnedNotes);
          }
          if (typeof data.showPinnedCategories === "boolean") {
            setShowPinnedCategories(data.showPinnedCategories);
          }
          if (typeof data.showPinnedHabits === "boolean") {
            setShowPinnedHabits(data.showPinnedHabits);
          }
          if (typeof data.collapseSubtasksByDefault === "boolean") {
            setCollapseSubtasksByDefault(data.collapseSubtasksByDefault);
          }
          if (typeof data.defaultTaskLayout === "string") {
            setDefaultTaskLayout(data.defaultTaskLayout);
          }
          if (typeof data.showCompletedByDefault === "boolean") {
            setShowCompletedByDefault(data.showCompletedByDefault);
          }
          if (typeof data.defaultTaskColor === "number") {
            setDefaultTaskColor(data.defaultTaskColor);
          }
          if (typeof data.defaultTimerColor === "number") {
            setDefaultTimerColor(data.defaultTimerColor);
          }
          if (typeof data.timerExtendSeconds === "number") {
            setTimerExtendSeconds(data.timerExtendSeconds);
          }
          if (typeof data.flashcardTimer === "number") {
            setFlashcardTimer(data.flashcardTimer);
          }
          if (typeof data.flashcardSessionSize === "number") {
            setFlashcardSessionSize(data.flashcardSessionSize);
          }
          if (typeof data.flashcardDefaultMode === "string") {
            setFlashcardDefaultMode(data.flashcardDefaultMode);
          }
          if (typeof data.syncRole === "string") {
            setSyncRole(data.syncRole);
          }
          if (typeof data.syncServerUrl === "string") {
            setSyncServerUrl(data.syncServerUrl);
          }
          if (typeof data.syncInterval === "number") {
            setSyncInterval(data.syncInterval);
          }
          if (typeof data.syncEnabled === "boolean") {
            setSyncEnabled(data.syncEnabled);
          }
          if (typeof data.language === "string") {
            setLanguage(data.language);
            i18n.changeLanguage(data.language);
          }
          if (typeof data.llmUrl === "string") {
            setLlmUrl(data.llmUrl);
          }
          if (typeof data.llmToken === "string") {
            setLlmToken(data.llmToken);
          }
          if (typeof data.llmModel === "string") {
            setLlmModel(data.llmModel);
          }
          if (typeof data.offlineCache === "boolean") {
            setOfflineCache(data.offlineCache);
          }
        }
      } catch (err) {
        console.error("Error loading settings", err);
      }
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const save = async () => {
      try {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shortcuts,
            pomodoro,
            defaultTaskPriority: priority,
            theme,
            themeName,
            customThemes,
            colorPalette,
            homeSectionColors,
            homeSections,
            homeSectionOrder,
            showPinnedTasks,
            showPinnedNotes,
            showPinnedCategories,
            showPinnedHabits,
            collapseSubtasksByDefault,
            defaultTaskLayout,
            showCompletedByDefault,
            defaultTaskColor,
            defaultTimerColor,
            timerExtendSeconds,
            flashcardTimer,
            flashcardSessionSize,
            flashcardDefaultMode,
            syncRole,
            syncServerUrl,
            syncInterval,
            syncEnabled,
            language,
            llmUrl,
            llmToken,
            llmModel,
            offlineCache,
          }),
        });
      } catch (err) {
        console.error("Error saving settings", err);
      }
    };

    save();
  }, [
    loaded,
    shortcuts,
    pomodoro,
    priority,
    theme,
    themeName,
    customThemes,
    colorPalette,
    homeSectionColors,
    homeSections,
    homeSectionOrder,
    showPinnedTasks,
    showPinnedNotes,
    showPinnedCategories,
    showPinnedHabits,
    collapseSubtasksByDefault,
    defaultTaskLayout,
    showCompletedByDefault,
    defaultTaskColor,
    defaultTimerColor,
    timerExtendSeconds,
    flashcardTimer,
    flashcardSessionSize,
    flashcardDefaultMode,
    syncRole,
    syncServerUrl,
    syncInterval,
    syncEnabled,
    language,
    llmUrl,
    llmToken,
    llmModel,
    offlineCache,
  ]);

  useEffect(() => {
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    if (["dark", "dark-red", "hacker"].includes(themeName)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, themeName]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const updateShortcut = (key: keyof ShortcutKeys, value: string) => {
    setShortcuts((prev) => ({ ...prev, [key]: value.toLowerCase() }));
  };

  const updatePomodoro = (
    key: "workMinutes" | "breakMinutes" | "workSound" | "breakSound",
    value: number | string,
  ) => {
    setPomodoro((prev) => ({ ...prev, [key]: value }));
  };

  const addPomodoroSound = (url: string) => {
    setPomodoro((prev) => {
      if (prev.customSounds.includes(url)) return prev;
      return { ...prev, customSounds: [url, ...prev.customSounds] };
    });
  };

  const deletePomodoroSound = (url: string) => {
    setPomodoro((prev) => ({
      ...prev,
      customSounds: prev.customSounds.filter((s) => s !== url),
    }));
  };

  const updateDefaultTaskPriority = (value: "low" | "medium" | "high") => {
    setPriority(value);
  };

  const updateTheme = (key: keyof typeof defaultTheme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setThemeName("custom");
  };

  const updateThemeName = (name: string) => {
    setThemeName(name);
    const preset = themePresets[name];
    const custom = customThemes.find((t) => t.name === name);
    if (preset) {
      setTheme(preset.theme);
      setColorPalette(preset.colorPalette);
    } else if (custom) {
      setTheme(custom.theme);
      setColorPalette(custom.colorPalette);
    }
  };

  const updatePaletteColor = (index: number, value: string) => {
    setColorPalette((prev) => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
    setThemeName("custom");
  };

  const addCustomTheme = (name: string) => {
    setCustomThemes((prev) => [
      { name, theme: { ...theme }, colorPalette: [...colorPalette] },
      ...prev.filter((t) => t.name !== name),
    ]);
    setThemeName(name);
  };

  const deleteCustomTheme = (name: string) => {
    setCustomThemes((prev) => prev.filter((t) => t.name !== name));
    if (themeName === name) {
      setThemeName("light");
      const preset = themePresets["light"];
      setTheme(preset.theme);
      setColorPalette(preset.colorPalette);
    }
  };

  const updateHomeSectionColor = (section: string, color: number) => {
    setHomeSectionColors((prev) => ({ ...prev, [section]: color }));
  };

  const updateFlashcardTimer = (value: number) => {
    setFlashcardTimer(value);
  };

  const updateFlashcardSessionSize = (value: number) => {
    setFlashcardSessionSize(value);
  };

  const updateFlashcardDefaultMode = (
    value: "spaced" | "training" | "random" | "typing" | "timed",
  ) => {
    setFlashcardDefaultMode(value);
  };

  const updateSyncRole = (role: "server" | "client") => {
    setSyncRole(role);
  };

  const updateSyncServerUrl = (url: string) => {
    setSyncServerUrl(url);
  };

  const updateSyncInterval = (value: number) => {
    setSyncInterval(value);
  };

  const updateSyncEnabled = (value: boolean) => {
    setSyncEnabled(value);
  };

  const toggleOfflineCache = () => {
    setOfflineCache((prev) => !prev);
  };

  const updateLanguage = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const updateLlmUrl = (url: string) => {
    setLlmUrl(url);
  };

  const updateLlmToken = (token: string) => {
    setLlmToken(token);
  };

  const updateLlmModel = (model: string) => {
    setLlmModel(model);
  };

  const updateDefaultTaskLayout = (val: "list" | "grid") => {
    setDefaultTaskLayout(val);
  };

  const toggleShowCompletedByDefault = () => {
    setShowCompletedByDefault((prev) => !prev);
  };

  const updateDefaultTaskColor = (val: number) => {
    setDefaultTaskColor(val);
  };

  const updateDefaultTimerColor = (val: number) => {
    setDefaultTimerColor(val);
  };

  const updateTimerExtendSeconds = (val: number) => {
    setTimerExtendSeconds(val);
  };

  const toggleHomeSection = (section: string) => {
    setHomeSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const reorderHomeSections = (start: number, end: number) => {
    setHomeSectionOrder((prev) => {
      const updated = Array.from(prev);
      const [removed] = updated.splice(start, 1);
      updated.splice(end, 0, removed);
      return updated;
    });
  };

  const toggleShowPinnedTasks = () => {
    setShowPinnedTasks((prev) => !prev);
  };

  const toggleShowPinnedNotes = () => {
    setShowPinnedNotes((prev) => !prev);
  };

  const toggleShowPinnedCategories = () => {
    setShowPinnedCategories((prev) => !prev);
  };

  const toggleShowPinnedHabits = () => {
    setShowPinnedHabits((prev) => !prev);
  };

  const toggleCollapseSubtasksByDefault = () => {
    setCollapseSubtasksByDefault((prev) => !prev);
  };

  return (
    <SettingsContext.Provider
      value={{
        shortcuts,
        updateShortcut,
        pomodoro,
        updatePomodoro,
        addPomodoroSound,
        deletePomodoroSound,
        defaultTaskPriority: priority,
        updateDefaultTaskPriority,
        theme,
        updateTheme,
        themeName,
        updateThemeName,
        customThemes,
        addCustomTheme,
        deleteCustomTheme,
        colorPalette,
        updatePaletteColor,
        homeSectionColors,
        updateHomeSectionColor,
        homeSections,
        homeSectionOrder,
        toggleHomeSection,
        reorderHomeSections,
        showPinnedTasks,
        toggleShowPinnedTasks,
        showPinnedNotes,
        toggleShowPinnedNotes,
        showPinnedCategories,
        toggleShowPinnedCategories,
        showPinnedHabits,
        toggleShowPinnedHabits,
        collapseSubtasksByDefault,
        toggleCollapseSubtasksByDefault,
        defaultTaskLayout,
        updateDefaultTaskLayout,
        showCompletedByDefault,
        toggleShowCompletedByDefault,
        defaultTaskColor,
        updateDefaultTaskColor,
        defaultTimerColor,
        updateDefaultTimerColor,
        timerExtendSeconds,
        updateTimerExtendSeconds,
        flashcardTimer,
        updateFlashcardTimer,
        flashcardSessionSize,
        updateFlashcardSessionSize,
        flashcardDefaultMode,
        updateFlashcardDefaultMode,
        syncRole,
        updateSyncRole,
        syncServerUrl,
        updateSyncServerUrl,
        syncInterval,
        updateSyncInterval,
        syncEnabled,
        updateSyncEnabled,
        language,
        updateLanguage,
        llmUrl,
        updateLlmUrl,
        llmToken,
        updateLlmToken,
        llmModel,
        updateLlmModel,
        offlineCache,
        toggleOfflineCache,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
