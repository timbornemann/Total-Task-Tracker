import React from 'react';
import Navbar from '@/components/Navbar';
import PomodoroTimer from '@/components/PomodoroTimer';

const PomodoroPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Pomodoro" />
      <div className="max-w-md mx-auto py-8 px-4">
        <PomodoroTimer />
      </div>
    </div>
  );
};

export default PomodoroPage;
