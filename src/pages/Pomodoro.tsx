import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PomodoroTimer from '@/components/PomodoroTimer';
import PomodoroStats from '@/components/PomodoroStats';
import { Button } from '@/components/ui/button';

const PomodoroPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t('navbar.pomodoro')} />
      <div className="flex-grow p-4 space-y-6 flex flex-col items-center">
        <PomodoroTimer size={150} />
        <Link to="/pomodoro/history">
          <Button variant="outline" size="sm">
            {t('pomodoroPage.viewSessions')}
          </Button>
        </Link>
        <div className="w-full max-w-4xl"><PomodoroStats /></div>
      </div>
    </div>
  );
};

export default PomodoroPage;
