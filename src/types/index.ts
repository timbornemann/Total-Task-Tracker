export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  color: number;
  completed: boolean;
  /** Status for kanban workflow */
  status: "todo" | "inprogress" | "done";
  categoryId: string;
  parentId?: string;
  subtasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  /** Optional due date for one-time tasks */
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  lastCompleted?: Date;
  nextDue?: Date;
  /** How to calculate due date for recurring tasks */
  dueOption?: "days" | "weekEnd" | "monthEnd";
  /** Number of days after creation when dueOption is 'days' */
  dueAfterDays?: number;
  /** Start configuration for recurring task */
  startOption?: "today" | "weekday" | "date";
  /** Weekday number if startOption is 'weekday' (0=Sunday) */
  startWeekday?: number;
  /** Fixed start date if startOption is 'date' */
  startDate?: Date;
  /** Optional start time in HH:mm */
  startTime?: string;
  /** Optional end time in HH:mm */
  endTime?: string;
  /** Sort order within its list */
  order: number;
  /** Whether the task is pinned */
  pinned: boolean;
  /** ID of originating recurring template */
  recurringId?: string;
  template?: boolean;
  titleTemplate?: string;
  customIntervalDays?: number;
  /** Whether the task is visible to the user */
  visible?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: number;
  createdAt: Date;
  updatedAt: Date;
  /** Sort order within the category list */
  order: number;
  /** Whether the category is pinned */
  pinned: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  color: number;
  categoryId: string;
  parentId?: string;

  /** Optional due date when creating/editing a task */

  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  customIntervalDays?: number;
  dueOption?: "days" | "weekEnd" | "monthEnd";
  dueAfterDays?: number;
  startOption?: "today" | "weekday" | "date";
  startWeekday?: number;
  startDate?: Date;
  /** Optional start time in HH:mm */
  startTime?: string;
  /** Optional end time in HH:mm */
  endTime?: string;
  titleTemplate?: string;
  template?: boolean;
  visible?: boolean;
}

export interface CategoryFormData {
  name: string;
  description: string;
  color: number;
}

export interface Note {
  id: string;
  title: string;
  text: string;
  color: number;
  createdAt: Date;
  updatedAt: Date;
  /** Sort order within the notes list */
  order: number;
  /** Whether the note is pinned */
  pinned: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  interval: number;
  dueDate: Date;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  typedCorrect?: number;
  typedTotal?: number;
}

export interface Habit {
  id: string;
  title: string;
  color: number;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  customIntervalDays?: number;
  startWeekday?: number;
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  order: number;
  pinned: boolean;
  completions: string[];
}

export interface HabitFormData {
  title: string;
  color: number;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  customIntervalDays?: number;
  startWeekday?: number;
  startDate?: Date;
}

export interface Deck {
  id: string;
  name: string;
}

export interface Deletion {
  id: string;
  type:
    | "task"
    | "category"
    | "note"
    | "recurring"
    | "flashcard"
    | "deck"
    | "timer"
    | "pomodoro"
    | "workday"
    | "trip"
    | "inventoryItem"
    | "inventoryCategory"
    | "inventoryTag";
  deletedAt: Date;
}

export interface Timer {
  id: string;
  title: string;
  color: number;
  baseDuration: number;
  duration: number;
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
  startTime?: number;
  lastTick?: number;
  pauseStart?: number;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  tasksCompletedLast7Days: number;
  tasksCreatedLast7Days: number;
  overdueTasks: number;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  tasksByCategory: {
    categoryId: string;
    categoryName: string;
    count: number;
    completed: number;
  }[];
  completionTrend: {
    date: string;
    completed: number;
    created: number;
  }[];
  recurringTasks: number;
}

export interface PomodoroSession {
  start: number;
  end: number;
  breakEnd?: number;
}

export interface PomodoroStats {
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  totalCycles: number;
  todayTotals: {
    workMinutes: number;
    breakMinutes: number;
    cycles: number;
  };
  today: { time: string; work: number; break: number }[];
  timeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  week: { date: string; work: number; break: number }[];
  month: { date: string; work: number; break: number }[];
  year: { month: string; work: number; break: number }[];
}

export interface WorkDay {
  id: string;
  start: string;
  end: string;
  tripId?: string;
}

export interface Trip {
  id: string;
  name: string;
  location?: string;
  color?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  categoryId?: string;
  tagIds: string[];
  buyAgain: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemCategory {
  id: string;
  name: string;
}

export interface ItemTag {
  id: string;
  name: string;
}

export interface InventoryItemFormData {
  name: string;
  description: string;
  quantity: number;
  categoryId?: string;
  tags: string[];
  buyAgain: boolean;
}
