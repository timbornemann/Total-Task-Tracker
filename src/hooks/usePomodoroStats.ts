import { useMemo } from 'react';
import { usePomodoroHistory } from './usePomodoroHistory.tsx';
import { PomodoroStats } from '@/types';
import i18n from '@/lib/i18n';

export const usePomodoroStats = (): PomodoroStats => {
  const { sessions } = usePomodoroHistory();

  return useMemo(() => {
    const minutes = (start: number, end: number) => Math.round((end - start) / 60000);
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US'
    const totalWorkMinutes = sessions.reduce(
      (sum, s) => sum + minutes(s.start, s.end),
      0
    );
    const totalBreakMinutes = sessions.reduce(
      (sum, s) => sum + minutes(s.end, s.breakEnd ?? s.end),
      0
    );
    const totalCycles = sessions.length;

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

    const today = sessions.filter(s => s.start >= todayStart.getTime());
    const week = sessions.filter(s => s.start >= weekStart.getTime());
    const month = sessions.filter(s => s.start >= monthStart.getTime());
    const year = sessions.filter(s => s.start >= yearStart.getTime());

    const todayData = today.map(s => ({
      time: new Date(s.start).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      }),
      work: minutes(s.start, s.end),
      break: minutes(s.end, s.breakEnd ?? s.end)
    }));

    const aggregateBy = (
      arr: typeof sessions,
      fmt: (d: Date) => string,
      range: number,
      unit: 'day' | 'month'
    ) => {
      const data: Record<string, { work: number; break: number }> = {};
      for (let i = 0; i < range; i++) {
        const d = new Date();
        if (unit === 'day') d.setDate(d.getDate() - (range - 1 - i));
        if (unit === 'month') d.setMonth(d.getMonth() - (range - 1 - i), 1);
        const key = fmt(d);
        data[key] = { work: 0, break: 0 };
      }
      arr.forEach(s => {
        const d = new Date(s.start);
        const key = fmt(d);
        if (key in data) {
          data[key].work += minutes(s.start, s.end);
          data[key].break += minutes(s.end, s.breakEnd ?? s.end);
        }
      });
      return Object.keys(data).map(key => ({ date: key, ...data[key] }));
    };

    const weekData = aggregateBy(
      week,
      d => d.toLocaleDateString(locale, { weekday: 'short' }),
      7,
      'day'
    );
    const daysInMonth = new Date().getDate();
    const monthData = aggregateBy(
      month,
      d => d.getDate().toString(),
      daysInMonth,
      'day'
    );
    const yearData = aggregateBy(
      year,
      d => d.toLocaleDateString(locale, { month: 'short' }),
      12,
      'month'
    );

    const todayTotals = {
      workMinutes: today.reduce(
        (sum, s) => sum + minutes(s.start, s.end),
        0
      ),
      breakMinutes: today.reduce(
        (sum, s) => sum + minutes(s.end, s.breakEnd ?? s.end),
        0
      ),
      cycles: today.length
    };

    const timeOfDay = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    };
    sessions.forEach(s => {
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
      year: yearData
    };
  }, [sessions]);
};
