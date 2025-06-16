
import React from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/lib/i18n'
import { useStatistics } from '@/hooks/useStatistics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { TrendingUp, CheckCircle, Clock, Target } from 'lucide-react'
import Navbar from '@/components/Navbar'

const Statistics = () => {
  const { t } = useTranslation()
  const stats = useStatistics()

  const priorityData = [
    {
      name: t('statistics.priority.high'),
      value: stats.tasksByPriority.high,
      color: 'hsl(var(--destructive))'
    },
    {
      name: t('statistics.priority.medium'),
      value: stats.tasksByPriority.medium,
      color: 'hsl(var(--primary))'
    },
    {
      name: t('statistics.priority.low'),
      value: stats.tasksByPriority.low,
      color: 'hsl(var(--accent))'
    }
  ];

  const categoryData = stats.tasksByCategory.map(cat => ({
    name: cat.categoryName,
    total: cat.count,
    completed: cat.completed,
    percentage: cat.count > 0 ? Math.round((cat.completed / cat.count) * 100) : 0
  }));

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar title={t('statistics.title')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('statistics.totalTasks')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('statistics.completed')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-accent">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {completionRate}% {t('statistics.ofTasks')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('statistics.open')}</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-accent">{stats.pendingTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('statistics.overdue')}</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-accent">{stats.overdueTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('statistics.completed7Days')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.tasksCompletedLast7Days}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('statistics.recurring')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-accent">{stats.recurringTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('statistics.created7Days')}</CardTitle>
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
              <CardTitle className="text-base sm:text-lg">{t('statistics.priorityDistribution')}</CardTitle>
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
              <CardTitle className="text-base sm:text-lg">{t('statistics.categoryProgress')}</CardTitle>
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
                    <Bar
                      dataKey="completed"
                      fill="hsl(var(--stat-bar-primary))"
                      name={t('statistics.completed')}
                    />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--stat-bar-secondary))"
                      name={t('statistics.total')}
                    />
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
              <CardTitle className="text-base sm:text-lg">{t('statistics.activityTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickFormatter={value =>
                        new Date(value).toLocaleDateString(
                          i18n.language === 'de' ? 'de-DE' : 'en-US',
                          { month: 'short', day: 'numeric' }
                        )
                      }
                    />
                    <YAxis fontSize={12} />
                    <Tooltip
                      labelFormatter={value =>
                        new Date(value).toLocaleDateString(
                          i18n.language === 'de' ? 'de-DE' : 'en-US'
                        )
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      name={t('statistics.completed')}
                    />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="hsl(var(--primary))"
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
            <CardTitle className="text-base sm:text-lg">{t('statistics.categoryDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">{t('statistics.category')}</th>
                    <th className="text-right py-2 font-medium">{t('statistics.total')}</th>
                    <th className="text-right py-2 font-medium">{t('statistics.completed')}</th>
                    <th className="text-right py-2 font-medium">{t('statistics.progress')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tasksByCategory.map((category, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{category.categoryName}</td>
                      <td className="text-right py-2">{category.count}</td>
                      <td className="text-right py-2 text-accent">{category.completed}</td>
                      <td className="text-right py-2">
                        <div className="flex items-center justify-end">
                          <div className="w-16 sm:w-20 bg-muted rounded-full h-2 mr-2">
                            <div
                              className="bg-accent h-2 rounded-full"
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
