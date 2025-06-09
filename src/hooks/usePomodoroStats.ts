import { useMemo } from 'react';
import { usePomodoroHistory } from './usePomodoroHistory';
import { PomodoroStats } from '@/types';

export const usePomodoroStats = (): PomodoroStats => {
  const { sessions } = usePomodoroHistory();

  return useMemo(() => {
    const minutes = (start: number, end: number) => Math.round((end - start) / 60000);
    const totalMinutes = sessions.reduce((sum, s) => sum + minutes(s.start, s.end), 0);
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
      time: new Date(s.start).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      duration: minutes(s.start, s.end)
    }));

    const aggregateBy = (arr: typeof sessions, fmt: (d: Date) => string, range: number, unit: 'day' | 'month') => {
      const data: Record<string, number> = {};
      for (let i = 0; i < range; i++) {
        const d = new Date();
        if (unit === 'day') d.setDate(d.getDate() - (range - 1 - i));
        if (unit === 'month') d.setMonth(d.getMonth() - (range - 1 - i), 1);
        const key = fmt(d);
        data[key] = 0;
      }
      arr.forEach(s => {
        const d = new Date(s.start);
        const key = fmt(d);
        if (key in data) data[key] += minutes(s.start, s.end);
      });
      return Object.keys(data).map(key => ({ date: key, duration: data[key] }));
    };

    const weekData = aggregateBy(week, d => d.toLocaleDateString('de-DE', { weekday: 'short' }), 7, 'day');
    const daysInMonth = new Date().getDate();
    const monthData = aggregateBy(month, d => d.getDate().toString(), daysInMonth, 'day');
    const yearData = aggregateBy(year, d => d.toLocaleDateString('de-DE', { month: 'short' }), 12, 'month');

    return {
      totalMinutes,
      totalCycles,
      today: todayData,
      week: weekData,
      month: monthData,
      year: yearData
    };
  }, [sessions]);
};
