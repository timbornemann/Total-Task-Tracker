
import React from 'react';
import { Link } from 'react-router-dom';
import { useStatistics } from '@/hooks/useStatistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowLeft, TrendingUp, CheckCircle, Clock, Target } from 'lucide-react';

const Statistics = () => {
  const stats = useStatistics();

  const priorityData = [
    { name: 'Hoch', value: stats.tasksByPriority.high, color: '#EF4444' },
    { name: 'Mittel', value: stats.tasksByPriority.medium, color: '#F59E0B' },
    { name: 'Niedrig', value: stats.tasksByPriority.low, color: '#10B981' }
  ];

  const categoryData = stats.tasksByCategory.map(cat => ({
    name: cat.categoryName,
    total: cat.count,
    completed: cat.completed,
    percentage: cat.count > 0 ? Math.round((cat.completed / cat.count) * 100) : 0
  }));

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Zurück</span>
                </Button>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Statistiken</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Gesamt Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Abgeschlossen</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">{completionRate}% der Tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Offen</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Überfällig</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Erledigt 7 Tage</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.tasksCompletedLast7Days}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Wiederkehrend</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.recurringTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Erstellt 7 Tage</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.tasksCreatedLast7Days}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Tasks nach Priorität</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center space-x-2 sm:space-x-4 mt-4">
                {priorityData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs sm:text-sm">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Fortschritt nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#10B981" name="Abgeschlossen" />
                    <Bar dataKey="total" fill="#E5E7EB" name="Gesamt" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Trend */}
        {stats.completionTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Aktivitätstrend (Letzte 7 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('de-DE')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Abgeschlossen"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="created" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Erstellt"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Kategorien im Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Kategorie</th>
                    <th className="text-right py-2 font-medium">Gesamt</th>
                    <th className="text-right py-2 font-medium">Abgeschlossen</th>
                    <th className="text-right py-2 font-medium">Fortschritt</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tasksByCategory.map((category, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{category.categoryName}</td>
                      <td className="text-right py-2">{category.count}</td>
                      <td className="text-right py-2 text-green-600">{category.completed}</td>
                      <td className="text-right py-2">
                        <div className="flex items-center justify-end">
                          <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${category.count > 0 ? (category.completed / category.count) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs">
                            {category.count > 0 ? Math.round((category.completed / category.count) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
