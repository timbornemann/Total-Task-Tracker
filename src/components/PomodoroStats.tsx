import React from "react";
import { usePomodoroStats } from "@/hooks/usePomodoroStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";

const PomodoroStats: React.FC = () => {
  const stats = usePomodoroStats();
  const { t } = useTranslation();
  return (
    <div className="w-full grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("pomodoroStats.total")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {t("pomodoroStats.work")}: {stats.totalWorkMinutes} min
          </p>
          <p className="text-sm">
            {t("pomodoroStats.break")}: {stats.totalBreakMinutes} min
          </p>
          <p className="text-sm mb-2">
            {t("pomodoroStats.cycles")}: {stats.totalCycles}
          </p>
          <div className="w-full h-3 bg-muted rounded overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{
                width: `${
                  stats.totalWorkMinutes + stats.totalBreakMinutes === 0
                    ? 0
                    : (stats.totalWorkMinutes /
                        (stats.totalWorkMinutes + stats.totalBreakMinutes)) *
                      100
                }%`,
              }}
            />
            <div
              className="h-full bg-accent"
              style={{
                width: `${
                  stats.totalWorkMinutes + stats.totalBreakMinutes === 0
                    ? 0
                    : (stats.totalBreakMinutes /
                        (stats.totalWorkMinutes + stats.totalBreakMinutes)) *
                      100
                }%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("pomodoroStats.today")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {t("pomodoroStats.work")}: {stats.todayTotals.workMinutes} min
          </p>
          <p className="text-sm">
            {t("pomodoroStats.break")}: {stats.todayTotals.breakMinutes} min
          </p>
          <p className="text-sm mb-2">
            {t("pomodoroStats.cycles")}: {stats.todayTotals.cycles}
          </p>
          <div className="w-full h-3 bg-muted rounded overflow-hidden mb-4">
            <div
              className="h-full bg-primary"
              style={{
                width: `${
                  stats.todayTotals.workMinutes +
                    stats.todayTotals.breakMinutes ===
                  0
                    ? 0
                    : (stats.todayTotals.workMinutes /
                        (stats.todayTotals.workMinutes +
                          stats.todayTotals.breakMinutes)) *
                      100
                }%`,
              }}
            />
            <div
              className="h-full bg-accent"
              style={{
                width: `${
                  stats.todayTotals.workMinutes +
                    stats.todayTotals.breakMinutes ===
                  0
                    ? 0
                    : (stats.todayTotals.breakMinutes /
                        (stats.todayTotals.workMinutes +
                          stats.todayTotals.breakMinutes)) *
                      100
                }%`,
              }}
            />
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.today}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="break" stackId="a" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("pomodoroStats.timesOfDayTotal")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    time: t("pomodoroStats.morning"),
                    value: stats.timeOfDay.morning,
                  },
                  {
                    time: t("pomodoroStats.afternoon"),
                    value: stats.timeOfDay.afternoon,
                  },
                  {
                    time: t("pomodoroStats.evening"),
                    value: stats.timeOfDay.evening,
                  },
                  {
                    time: t("pomodoroStats.night"),
                    value: stats.timeOfDay.night,
                  },
                ]}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("pomodoroStats.thisWeek")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.week}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="break" stackId="a" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("pomodoroStats.thisMonth")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.month}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="break" stackId="a" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("pomodoroStats.thisYear")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.year}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="work" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="break" stackId="a" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PomodoroStats;
