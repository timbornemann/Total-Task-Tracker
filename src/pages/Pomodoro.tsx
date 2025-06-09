import React from 'react';
import Navbar from '@/components/Navbar';
import PomodoroTimer from '@/components/PomodoroTimer';

const PomodoroPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar title="Pomodoro" />
      <div className="flex-grow flex items-center justify-center p-4">
        <PomodoroTimer size={150} />
      </div>
    </div>
  );
};

export default PomodoroPage;
