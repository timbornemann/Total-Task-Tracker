
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  completed: boolean;
  /** Status for kanban workflow */
  status: 'todo' | 'inprogress' | 'done';
  categoryId: string;
  parentId?: string;
  subtasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  /** Optional due date for one-time tasks */
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastCompleted?: Date;
  nextDue?: Date;
  dueDate?: Date;
  /** Sort order within its list */
  order: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  /** Sort order within the category list */
  order: number;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  categoryId: string;
  parentId?: string;

  /** Optional due date when creating/editing a task */

  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  text: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  /** Sort order within the notes list */
  order: number;
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

export interface Deck {
  id: string;
  name: string;
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
