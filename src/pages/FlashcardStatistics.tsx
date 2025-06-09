import React from 'react';
import Navbar from '@/components/Navbar';
import { useFlashcardStatistics } from '@/hooks/useFlashcardStatistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BookOpen, Clock, TrendingUp } from 'lucide-react';

const FlashcardStatisticsPage: React.FC = () => {
  const stats = useFlashcardStatistics();

  const difficultyData = [
    { name: 'Leicht', value: stats.difficultyCounts.easy, color: '#10B981' },
    { name: 'Mittel', value: stats.difficultyCounts.medium, color: '#F59E0B' },
    { name: 'Schwer', value: stats.difficultyCounts.hard, color: '#EF4444' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Karten Statistiken" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Gesamt Karten</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalCards}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Fällig</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.dueCards}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Ø Intervall</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {Math.round(stats.averageInterval * 10) / 10} Tage
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Schwierigkeiten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={5} dataKey="value">
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                {difficultyData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                    <span className="text-xs sm:text-sm">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Fälligkeit nächste 7 Tage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.upcomingDue} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" name="Karten" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlashcardStatisticsPage;
