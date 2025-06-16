import React from "react";
import Navbar from "@/components/Navbar";
import { useFlashcardStatistics } from "@/hooks/useFlashcardStatistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BookOpen, Clock, TrendingUp } from "lucide-react";

const FlashcardStatisticsPage: React.FC = () => {
  const stats = useFlashcardStatistics();
  const { t } = useTranslation();

  const difficultyData = [
    {
      name: t('flashcardStats.easy'),
      value: stats.difficultyCounts.easy,
      color: 'hsl(var(--accent))',
    },
    {
      name: t('flashcardStats.medium'),
      value: stats.difficultyCounts.medium,
      color: 'hsl(var(--primary))',
    },
    {
      name: t('flashcardStats.hard'),
      value: stats.difficultyCounts.hard,
      color: 'hsl(var(--destructive))',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t('flashcardStats.title')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {t('flashcardStats.totalCards')}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                {stats.totalCards}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {t('flashcardStats.due')}
              </CardTitle>
              <Clock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-destructive">
                {stats.dueCards}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {t('flashcardStats.avgInterval')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {Math.round(stats.averageInterval * 10) / 10}{' '}
                {t('flashcardStats.days')}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                {t('flashcardStats.difficulty')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
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
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs sm:text-sm">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                {t('flashcardStats.upcoming')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.upcomingDue}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--stat-bar-primary))"
                      name={t('flashcardStats.cards')}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        {stats.deckStats.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                {t('flashcardStats.deckDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">{t('flashcardStats.deck')}</th>
                      <th className="text-right py-2 font-medium">{t('flashcardStats.total')}</th>
                      <th className="text-right py-2 font-medium">{t('flashcardStats.due')}</th>
                      <th className="text-right py-2 font-medium">
                        {t('flashcardStats.dueShare')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.deckStats.map((deck, idx) => {
                      const percent =
                        deck.total > 0 ? (deck.due / deck.total) * 100 : 0;
                      return (
                        <tr key={idx} className="border-b">
                          <td className="py-2 font-medium">{deck.deckName}</td>
                          <td className="text-right py-2">{deck.total}</td>
                          <td className="text-right py-2 text-accent">
                            {deck.due}
                          </td>
                          <td className="text-right py-2">
                            <div className="flex items-center justify-end">
                              <div className="w-16 sm:w-20 bg-muted rounded-full h-2 mr-2">
                                <div
                                  className="bg-accent h-2 rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-xs">
                                {Math.round(percent)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FlashcardStatisticsPage;
