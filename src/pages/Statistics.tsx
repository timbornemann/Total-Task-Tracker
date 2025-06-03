
import React from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { useStatistics } from '@/hooks/useStatistics';

const Statistics: React.FC = () => {
  const { categories } = useTaskStore();
  const stats = useStatistics();

  const priorityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };

  const priorityData = [
    { name: 'Hoch', value: stats.tasksByPriority.high, color: priorityColors.high },
    { name: 'Mittel', value: stats.tasksByPriority.medium, color: priorityColors.medium },
    { name: 'Niedrig', value: stats.tasksByPriority.low, color: priorityColors.low },
  ];

  const categoryData = stats.tasksByCategory.map(cat => ({
    name: cat.categoryName,
    total: cat.count,
    completed: cat.completed,
    remaining: cat.count - cat.completed,
  }));

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Statistiken</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Gesamt Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Abgeschlossen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
              <div className="text-sm text-gray-500">{completionRate}% erledigt</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Überfällig
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Wiederkehrend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.recurringTasks}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Verteilung nach Priorität</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  high: { label: "Hoch", color: priorityColors.high },
                  medium: { label: "Mittel", color: priorityColors.medium },
                  low: { label: "Niedrig", color: priorityColors.low },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Category Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Fortschritt nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  completed: { label: "Abgeschlossen", color: "#10B981" },
                  remaining: { label: "Verbleibend", color: "#6B7280" },
                }}
                className="h-[300px]"
              >
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" stackId="a" fill="#10B981" />
                  <Bar dataKey="remaining" stackId="a" fill="#6B7280" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Abschluss-Trend (letzte 7 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: { label: "Abgeschlossen", color: "#3B82F6" },
                created: { label: "Erstellt", color: "#10B981" },
              }}
              className="h-[300px]"
            >
              <LineChart data={stats.completionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="completed" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="created" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Categories Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Kategorien Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.tasksByCategory.map(category => {
                const progress = category.count > 0 
                  ? Math.round((category.completed / category.count) * 100) 
                  : 0;
                
                return (
                  <div key={category.categoryId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ 
                          backgroundColor: categories.find(c => c.id === category.categoryId)?.color || '#6B7280' 
                        }}
                      />
                      <span className="font-medium">{category.categoryName}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        {category.completed}/{category.count} Tasks
                      </div>
                      <Badge variant={progress === 100 ? "default" : "secondary"}>
                        {progress}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
