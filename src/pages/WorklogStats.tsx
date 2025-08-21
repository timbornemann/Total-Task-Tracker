import React from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorklog } from "@/hooks/useWorklog";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WorklogStatsPage: React.FC = () => {
  const { trips, workDays, commutes } = useWorklog();
  const { t } = useTranslation();
  const [range, setRange] = React.useState<"week" | "month">("week");

  const startDate = React.useMemo(() => {
    const date = new Date();
    if (range === "week") {
      date.setDate(date.getDate() - 6);
    } else {
      date.setDate(date.getDate() - 29);
    }
    return date;
  }, [range]);

  const categoryData = React.useMemo(() => {
    const result: { date: string; work: number; hobby: number }[] = [];
    const now = new Date();
    const cur = new Date(startDate);
    while (cur <= now) {
      const dateStr = cur.toISOString().slice(0, 10);
      const dayEntries = workDays.filter(
        (d) =>
          (typeof d.start === "string"
            ? d.start.slice(0, 10)
            : d.start.toISOString().slice(0, 10)) === dateStr,
      );
      const workMinutes = dayEntries
        .filter((d) => d.category === "work")
        .reduce(
          (sum, d) =>
            sum +
            (new Date(d.end).getTime() - new Date(d.start).getTime()) /
              60000,
          0,
        );
      const hobbyMinutes = dayEntries
        .filter((d) => d.category === "hobby")
        .reduce(
          (sum, d) =>
            sum +
            (new Date(d.end).getTime() - new Date(d.start).getTime()) /
              60000,
          0,
        );
      result.push({
        date: range === "week" ? dateStr.slice(5) : dateStr,
        work: +(workMinutes / 60).toFixed(2),
        hobby: +(hobbyMinutes / 60).toFixed(2),
      });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [workDays, startDate, range]);

  const chartConfig = React.useMemo(
    () => ({
      work: {
        label: t("worklog.stats.work"),
        color: "hsl(var(--stat-bar-primary))",
      },
      hobby: {
        label: t("worklog.stats.hobby"),
        color: "hsl(var(--stat-bar-secondary))",
      },
    }),
    [t],
  );

  const tripTotals = trips.map((trip) => {
    const minutes = workDays
      .filter((d) => d.tripId === trip.id)
      .reduce(
        (sum, d) =>
          sum +
          (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
        0,
      );
    const km = workDays
      .filter((d) => d.tripId === trip.id)
      .reduce((s, d) => {
        if (d.commuteId) {
          const c = commutes.find((c) => c.id === d.commuteId);
          return s + (c?.kilometers ?? 0);
        }
        return s + (d.commuteKm || 0);
      }, 0);
    return { name: trip.name, minutes, km };
  });

  const lastWeek: { date: string; minutes: number; km: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().slice(0, 10);
    const days = workDays.filter(
      (d) =>
        (typeof d.start === "string"
          ? d.start.slice(0, 10)
          : d.start.toISOString().slice(0, 10)) === dateStr,
    );
    const minutes = days.reduce(
      (sum, d) =>
        sum +
        (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
      0,
    );
    const km = days.reduce((s, d) => {
      if (d.commuteId) {
        const c = commutes.find((c) => c.id === d.commuteId);
        return s + (c?.kilometers ?? 0);
      }
      return s + (d.commuteKm || 0);
    }, 0);
    lastWeek.push({ date: dateStr, minutes, km });
  }

  const totalMinutes = workDays.reduce(
    (sum, d) =>
      sum + (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
    0,
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = Math.round(totalMinutes % 60);

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("navbar.worklogStats")} />
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("worklogStats.totalTime", { hours: totalHours, minutes: totalMins })}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t("worklogStats.perTrip")}
            </CardTitle>
            <Select value={range} onValueChange={(v) => setRange(v as "week" | "month")}> 
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-60 w-full">
              <LineChart data={categoryData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="work"
                  stroke="var(--color-work)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="hobby"
                  stroke="var(--color-hobby)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("worklogStats.lastWeek")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lastWeek}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("worklogStats.perTripCommute")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tripTotals}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="km" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("worklogStats.lastWeekCommute")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lastWeek}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="km" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorklogStatsPage;
