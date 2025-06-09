import React from 'react';
import Navbar from '@/components/Navbar';
import PomodoroTimer from '@/components/PomodoroTimer';
import PomodoroStats from '@/components/PomodoroStats';

const PomodoroPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar title="Pomodoro" />
      <div className="flex-grow p-4 space-y-6 flex flex-col items-center">
        <PomodoroTimer size={150} />
        <PomodoroStats />
      </div>
    </div>
  );
};

export default PomodoroPage;
