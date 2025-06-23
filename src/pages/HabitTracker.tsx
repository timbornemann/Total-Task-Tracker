import React from 'react';
import Navbar from '@/components/Navbar';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useTranslation } from 'react-i18next';
import { eachDayOfInterval, subDays, startOfDay, format } from 'date-fns';

const HabitTrackerPage: React.FC = () => {
  const { recurring, toggleHabitCompletion } = useTaskStore();
  const { t } = useTranslation();

  const today = startOfDay(new Date());
  const days = eachDayOfInterval({ start: subDays(today, 83), end: today });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t('habits.title')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('habits.none')}</p>
        ) : (
          <div className="space-y-6 overflow-x-auto">
            {recurring.map(habit => (
              <div key={habit.id} className="flex items-center space-x-2">
                <span className="w-32 truncate text-sm text-foreground">
                  {habit.title}
                </span>
                <div className="flex">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col">
                      {week.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const done = habit.habitHistory?.includes(dateStr);
                        return (
                          <div
                            key={dateStr}
                            title={format(day, 'MMM d')}
                            onClick={() => toggleHabitCompletion(habit.id, dateStr)}
                            className={`w-3 h-3 m-0.5 rounded cursor-pointer hover:opacity-75 ${done ? 'bg-green-500' : 'bg-muted'}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitTrackerPage;
