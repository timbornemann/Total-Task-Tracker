import React from 'react';
import { usePomodoroStats } from '@/hooks/usePomodoroStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const PomodoroStats: React.FC = () => {
  const stats = usePomodoroStats();
  return (
    <div className="w-full grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gesamt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Arbeit: {stats.totalWorkMinutes} min</p>
          <p className="text-sm">Pause: {stats.totalBreakMinutes} min</p>
          <p className="text-sm mb-2">Zyklen: {stats.totalCycles}</p>
          <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${
                stats.totalWorkMinutes + stats.totalBreakMinutes === 0
                  ? 0
                  : (stats.totalWorkMinutes /
                      (stats.totalWorkMinutes + stats.totalBreakMinutes)) * 100
              }%` }}
            />
            <div
              className="h-full bg-green-500"
              style={{ width: `${
                stats.totalWorkMinutes + stats.totalBreakMinutes === 0
                  ? 0
                  : (stats.totalBreakMinutes /
                      (stats.totalWorkMinutes + stats.totalBreakMinutes)) * 100
              }%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Heute</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Arbeit: {stats.todayTotals.workMinutes} min</p>
          <p className="text-sm">Pause: {stats.todayTotals.breakMinutes} min</p>
          <p className="text-sm mb-2">Zyklen: {stats.todayTotals.cycles}</p>
          <div className="w-full h-3 bg-gray-200 rounded overflow-hidden mb-4">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${
                stats.todayTotals.workMinutes + stats.todayTotals.breakMinutes === 0
                  ? 0
                  : (stats.todayTotals.workMinutes /
                      (stats.todayTotals.workMinutes + stats.todayTotals.breakMinutes)) * 100
              }%` }}
            />
            <div
              className="h-full bg-green-500"
              style={{ width: `${
                stats.todayTotals.workMinutes + stats.todayTotals.breakMinutes === 0
                  ? 0
                  : (stats.todayTotals.breakMinutes /
                      (stats.todayTotals.workMinutes + stats.todayTotals.breakMinutes)) * 100
              }%` }}
            />
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.today} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="#4f46e5" />
                <Bar dataKey="break" stackId="a" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tageszeiten (Gesamt)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                  { time: 'Morgen', value: stats.timeOfDay.morning },
                  { time: 'Mittag', value: stats.timeOfDay.afternoon },
                  { time: 'Abend', value: stats.timeOfDay.evening },
                  { time: 'Nacht', value: stats.timeOfDay.night }
                ]}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diese Woche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.week} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="#4f46e5" />
                <Bar dataKey="break" stackId="a" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dieser Monat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.month} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="#4f46e5" />
                <Bar dataKey="break" stackId="a" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dieses Jahr</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.year} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="#4f46e5" />
                <Bar dataKey="break" stackId="a" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PomodoroStats;
