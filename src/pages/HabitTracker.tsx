import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import {
  startOfDay,
  addWeeks,
  addDays,
  getISOWeek,
  getISODay,
  format,
  startOfISOWeekYear,
  getISOWeeksInYear,
  isSameISOWeek,
  isToday,
} from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TaskModal from "@/components/TaskModal";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  complementaryColor,
  adjustColor,
  isColorDark,
  hslToHex,
} from "@/utils/color";
import { Task, TaskFormData } from "@/types";

const today = startOfDay(new Date());

const getFrequencyDays = (habit: Task): number[] => {
  if (
    habit.recurrencePattern === "weekly" &&
    typeof habit.startWeekday === "number"
  ) {
    return [habit.startWeekday];
  }
  return [0, 1, 2, 3, 4, 5, 6];
};

const HabitCard: React.FC<{ habit: Task }> = ({ habit }) => {
  const { tasks, toggleHabitCompletion } = useTaskStore();
  const { colorPalette, theme } = useSettings();
  const { t } = useTranslation();
  const locale = i18n.language === "de" ? deLocale : enUS;
  const [year, setYear] = useState(today.getFullYear());

  const yearStart = startOfISOWeekYear(new Date(year, 0, 4));
  const weekCount = getISOWeeksInYear(new Date(year, 0, 4));
  const weeks = React.useMemo(
    () => Array.from({ length: weekCount }, (_, i) => addWeeks(yearStart, i)),
    [yearStart, weekCount],
  );

  const habitTasks = tasks.filter((t) => t.recurringId === habit.id);
  const taskMap = habitTasks.reduce<Record<string, Task>>((m, t) => {
    const key = format(t.createdAt, "yyyy-MM-dd");
    m[key] = t;
    return m;
  }, {});

  const freqDays = getFrequencyDays(habit);

  const calculateStreak = (): number => {
    let streak = 0;
    let day = today;
    while (day >= yearStart) {
      if (freqDays.includes(day.getDay())) {
        const key = format(day, "yyyy-MM-dd");
        if (taskMap[key]?.completed) streak++;
        else break;
      }
      day = addDays(day, -1);
    }
    return streak;
  };

  const countTotals = (): { total: number; completed: number } => {
    let total = 0;
    let completed = 0;
    weeks.forEach((w) => {
      freqDays.forEach((d) => {
        const date = addDays(w, d);
        if (date > today || date < yearStart) return;
        total++;
        const key = format(date, "yyyy-MM-dd");
        if (taskMap[key]?.completed) completed++;
      });
    });
    return { total, completed };
  };

  const { total, completed } = countTotals();
  const streak = calculateStreak();
  const baseColor = colorPalette[habit.color] ?? colorPalette[0];
  const textColor = complementaryColor(baseColor);
  const doneColor = adjustColor(baseColor, isColorDark(baseColor) ? 20 : -20);
  const emptyColor = hslToHex(theme.muted);
  const rows = [...freqDays].sort((a, b) => a - b);
  const firstTaskDate = habitTasks.length
    ? startOfDay(
        habitTasks.reduce(
          (min, t) => (t.createdAt < min ? t.createdAt : min),
          habitTasks[0].createdAt,
        ),
      )
    : habit.startDate
      ? startOfDay(new Date(habit.startDate))
      : startOfDay(habit.createdAt);

  return (
    <Card style={{ backgroundColor: baseColor, color: textColor }}>
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-base">{habit.title}</CardTitle>
        <div className="flex items-center justify-between text-xs">
          <button
            className="p-1 rounded hover:bg-muted"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span>{year}</span>
          <button
            className="p-1 rounded hover:bg-muted"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <p className="text-xs">
          {t("habits.streak", { count: streak })} •{" "}
          {t("habits.progress", { completed, total })}
        </p>
      </CardHeader>
      <CardContent>
        <table className="table-fixed border-collapse w-full">
          <thead>
            <tr>
              <th className="w-8 text-xs" />
              {weeks.map((w) => {
                const current = isSameISOWeek(w, today);
                return (
                  <th
                    key={w.toISOString()}
                    className="text-center text-[10px]"
                    style={{
                      width: `${100 / weekCount}%`,
                      backgroundColor: current ? textColor : undefined,
                      color: current ? baseColor : undefined,
                    }}
                  >
                    {getISOWeek(w)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r} className="h-6">
                <td
                  className="text-xs pr-1"
                  style={{
                    backgroundColor:
                      r === getISODay(today) - 1 ? textColor : undefined,
                    color: r === getISODay(today) - 1 ? baseColor : undefined,
                  }}
                >
                  {format(addDays(yearStart, r), "EEE", { locale })}
                </td>
                {weeks.map((w) => {
                  const date = addDays(w, r);
                  const dateStr = format(date, "yyyy-MM-dd");
                  const done = taskMap[dateStr]?.completed;
                  const future = date > today;
                  const beforeStart = date < firstTaskDate;
                  const inactive = future || beforeStart || !taskMap[dateStr];
                  const currentDay = isToday(date);
                  return (
                    <td key={dateStr} className="p-0.5">
                      <div
                        className={`h-6 aspect-square w-full rounded hover:opacity-80 ${
                          inactive
                            ? "cursor-default opacity-50"
                            : "cursor-pointer"
                        }`}
                        style={{
                          backgroundColor: done ? doneColor : emptyColor,
                          outline: currentDay
                            ? `2px solid ${textColor}`
                            : undefined,
                        }}
                        onClick={() =>
                          !inactive && toggleHabitCompletion(habit.id, dateStr)
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

const HabitTrackerPage: React.FC = () => {
  const { recurring, categories, addRecurringTask } = useTaskStore();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (data: TaskFormData) => {
    addRecurringTask({ ...data, isRecurring: true, template: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("habits.title")} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("habits.none")}</p>
        ) : (
          <div className="space-y-6">
            {recurring.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        )}
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> {t("recurring.template")}
          </Button>
        </div>
      </div>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        categories={categories}
        defaultIsRecurring
      />
    </div>
  );
};

export default HabitTrackerPage;
