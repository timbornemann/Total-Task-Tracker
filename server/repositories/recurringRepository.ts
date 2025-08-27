import type { Task } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadRecurring(): Task[] {
  try {
    const rows = db.prepare("SELECT * FROM recurring").all();
    const byId: Record<string, Task & { subtasks: Task[] }> = {};
    for (const r of rows) {
      byId[r.id] = {
        id: r.id,
        title: r.title || "",
        description: r.description || "",
        priority: r.priority || "low",
        color: typeof r.color === "number" ? r.color : 0,
        completed: !!r.completed,
        status: r.status || "todo",
        categoryId: r.categoryId || "default",
        parentId: r.parentId || undefined,
        subtasks: [],
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        dueDate: r.dueDate ? new Date(r.dueDate) : undefined,
        isRecurring: !!r.isRecurring,
        recurrencePattern: r.recurrencePattern || undefined,
        lastCompleted: r.lastCompleted ? new Date(r.lastCompleted) : undefined,
        nextDue: r.nextDue ? new Date(r.nextDue) : undefined,
        dueOption: r.dueOption || undefined,
        dueAfterDays: r.dueAfterDays ?? undefined,
        startOption: r.startOption || undefined,
        startWeekday: r.startWeekday ?? undefined,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        startTime: r.startTime || undefined,
        endTime: r.endTime || undefined,
        order: r.orderIndex ?? 0,
        pinned: !!r.pinned,
        recurringId: r.recurringId || undefined,
        template: !!r.template,
        titleTemplate: r.titleTemplate || undefined,
        customIntervalDays: r.customIntervalDays ?? undefined,
        visible: r.visible === 0 ? false : true,
      };
    }
    const roots: Task[] = [];
    for (const r of Object.values(byId)) {
      if (r.parentId && byId[r.parentId]) {
        byId[r.parentId].subtasks.push(r);
      } else {
        roots.push(r);
      }
    }
    const sortTasks = (list: Task[]) => {
      list.sort((a: Task, b: Task) => (a.order || 0) - (b.order || 0));
      for (const t of list) sortTasks(t.subtasks);
    };
    sortTasks(roots);
    return roots;
  } catch {
    return [];
  }
}

export function saveRecurring(list: Task[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM recurring");
    const insert = db.prepare(
      `INSERT INTO recurring (
        id, title, description, priority, color, completed, status, categoryId, parentId,
        createdAt, updatedAt, dueDate, isRecurring, recurrencePattern, lastCompleted, nextDue,
        dueOption, dueAfterDays, startOption, startWeekday, startDate, startTime, endTime,
        orderIndex, pinned, recurringId, template, titleTemplate, customIntervalDays, visible
      ) VALUES (
        @id, @title, @description, @priority, @color, @completed, @status, @categoryId, @parentId,
        @createdAt, @updatedAt, @dueDate, @isRecurring, @recurrencePattern, @lastCompleted, @nextDue,
        @dueOption, @dueAfterDays, @startOption, @startWeekday, @startDate, @startTime, @endTime,
        @orderIndex, @pinned, @recurringId, @template, @titleTemplate, @customIntervalDays, @visible
      )`,
    );
    interface RecurringRow {
      id: string;
      title: string;
      description: string;
      priority: string;
      color: number;
      completed: number;
      status: string;
      categoryId: string;
      parentId: string | null;
      createdAt: string | null;
      updatedAt: string | null;
      dueDate: string | null;
      isRecurring: number;
      recurrencePattern: string | null;
      lastCompleted: string | null;
      nextDue: string | null;
      dueOption: string | null;
      dueAfterDays: number | null;
      startOption: string | null;
      startWeekday: number | null;
      startDate: string | null;
      startTime: string | null;
      endTime: string | null;
      orderIndex: number;
      pinned: number;
      recurringId: string | null;
      template: number;
      titleTemplate: string | null;
      customIntervalDays: number | null;
      visible: number;
    }
    const toRow = (
      t: Task,
      parentId: string | null,
      orderIndex: number,
    ): RecurringRow => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      color: t.color,
      completed: t.completed ? 1 : 0,
      status: t.status,
      categoryId: t.categoryId,
      parentId,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      isRecurring: t.isRecurring ? 1 : 0,
      recurrencePattern: t.recurrencePattern ?? null,
      lastCompleted: t.lastCompleted
        ? new Date(t.lastCompleted).toISOString()
        : null,
      nextDue: t.nextDue ? new Date(t.nextDue).toISOString() : null,
      dueOption: t.dueOption ?? null,
      dueAfterDays: t.dueAfterDays ?? null,
      startOption: t.startOption ?? null,
      startWeekday: t.startWeekday ?? null,
      startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
      startTime: t.startTime ?? null,
      endTime: t.endTime ?? null,
      orderIndex: typeof t.order === "number" ? t.order : orderIndex,
      pinned: t.pinned ? 1 : 0,
      recurringId: t.recurringId ?? null,
      template: t.template ? 1 : 0,
      titleTemplate: t.titleTemplate ?? null,
      customIntervalDays: t.customIntervalDays ?? null,
      visible: t.visible === false ? 0 : 1,
    });
    const walk = (list: Task[], parent: string | null) => {
      list.forEach((t, idx) => {
        insert.run(toRow(t, parent, idx));
        if (t.subtasks && t.subtasks.length) walk(t.subtasks, t.id);
      });
    };
    walk(list || [], null);
  });
  tx();
}
