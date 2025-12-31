import { useMemo } from "react";
import { usePomodoroHistory } from "./usePomodoroHistory.tsx";
import { PomodoroStats } from "@/types";
import i18n from "@/lib/i18n";

export const usePomodoroStats = (): PomodoroStats => {
  const { sessions } = usePomodoroHistory();

  return useMemo(() => {
    const minutes = (start: number, end: number) =>
      Math.round((end - start) / 60000);
    const locale = i18n.language === "de" ? "de-DE" : "en-US";

    const workSessions = sessions.filter((s) => s.type === "work");
    const breakSessions = sessions.filter((s) => s.type === "break");

    const totalWorkMinutes = workSessions.reduce(
      (sum, s) => sum + minutes(s.start, s.end),
      0,
    );
    const totalBreakMinutes = breakSessions.reduce(
      (sum, s) => sum + minutes(s.start, s.end),
      0,
    );
    const totalCycles = workSessions.length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const yearStart = new Date();
    yearStart.setMonth(0, 1);
    yearStart.setHours(0, 0, 0, 0);

    const filterByDate = (arr: typeof sessions, date: Date) =>
      arr.filter((s) => s.start >= date.getTime());

    const todayWork = filterByDate(workSessions, todayStart);
    const todayBreak = filterByDate(breakSessions, todayStart);

    // For lists, we just use all sessions but formatted
    const todayAll = filterByDate(sessions, todayStart);
    const weekAll = filterByDate(sessions, weekStart);
    const monthAll = filterByDate(sessions, monthStart);
    const yearAll = filterByDate(sessions, yearStart);

    const fmt = (t: number) =>
      new Date(t).toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });

    const todayData = todayAll.map((s) => ({
      time: `${fmt(s.start)}-${fmt(s.end)}`,
      work: s.type === "work" ? minutes(s.start, s.end) : 0,
      break: s.type === "break" ? minutes(s.start, s.end) : 0,
    }));

    const aggregateBy = (
      arr: typeof sessions,
      fmt: (d: Date) => string,
      range: number,
      unit: "day" | "month",
    ) => {
      const data: Record<string, { work: number; break: number }> = {};
      for (let i = 0; i < range; i++) {
        const d = new Date();
        if (unit === "day") d.setDate(d.getDate() - (range - 1 - i));
        if (unit === "month") d.setMonth(d.getMonth() - (range - 1 - i), 1);
        const key = fmt(d);
        data[key] = { work: 0, break: 0 };
      }
      arr.forEach((s) => {
        const d = new Date(s.start);
        const key = fmt(d);
        if (key in data) {
          const m = minutes(s.start, s.end);
          if (s.type === "work") data[key].work += m;
          else data[key].break += m;
        }
      });
      return Object.keys(data).map((key) => ({ date: key, ...data[key] }));
    };

    const weekData = aggregateBy(
      weekAll,
      (d) => d.toLocaleDateString(locale, { weekday: "short" }),
      7,
      "day",
    );
    const daysInMonth = new Date().getDate();
    const monthData = aggregateBy(
      monthAll,
      (d) => d.getDate().toString(),
      daysInMonth,
      "day",
    );
    const yearData = aggregateBy(
      yearAll,
      (d) => d.toLocaleDateString(locale, { month: "short" }),
      12,
      "month",
    ).map((d) => ({ month: d.date, work: d.work, break: d.break }));

    const todayTotals = {
      workMinutes: todayWork.reduce(
        (sum, s) => sum + minutes(s.start, s.end),
        0,
      ),
      breakMinutes: todayBreak.reduce(
        (sum, s) => sum + minutes(s.start, s.end),
        0,
      ),
      cycles: todayWork.length,
    };

    const timeOfDay = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };
    sessions.forEach((s) => {
      // Only count work for time of day distribution? Or both? Usually focus is on work.
      // Let's count both for "activity"
      const start = new Date(s.start);
      const h = start.getHours();
      const m = minutes(s.start, s.end);
      if (h >= 6 && h < 12) timeOfDay.morning += m;
      else if (h >= 12 && h < 18) timeOfDay.afternoon += m;
      else if (h >= 18 && h < 24) timeOfDay.evening += m;
      else timeOfDay.night += m;
    });

    return {
      totalWorkMinutes,
      totalBreakMinutes,
      totalCycles,
      todayTotals,
      today: todayData,
      timeOfDay,
      week: weekData,
      month: monthData,
      year: yearData,
    };
  }, [sessions]);
};
