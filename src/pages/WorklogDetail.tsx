import React from "react";
import Navbar from "@/components/Navbar";
import { useParams, useNavigate } from "react-router-dom";
import { useWorklog } from "@/hooks/useWorklog";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const WorklogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trips, workDays } = useWorklog();
  const { t } = useTranslation();
  const { colorPalette } = useSettings();

  const trip = id === "default" ? null : trips.find((tr) => tr.id === id);
  const notFound = id !== "default" && !trip;

  const days = workDays
    .filter((d) => (id === "default" ? !d.tripId : d.tripId === id))
    .sort(
      (a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  const totalMinutes = days.reduce(
    (sum, d) =>
      sum + (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
    0,
  );
  const avgHours = days.length ? totalMinutes / 60 / days.length : 0;

  const [weekOffset, setWeekOffset] = React.useState(0);

  const weekData = React.useMemo(() => {
    const result: { date: string; minutes: number }[] = [];
    const base = new Date();
    base.setDate(base.getDate() - ((base.getDay() + 6) % 7) - weekOffset * 7);
    for (let i = 0; i < 7; i++) {
      const day = new Date(base);
      day.setDate(base.getDate() + i);
      const dateStr = day.toISOString().slice(0, 10);
      const minutes = days
        .filter((d) =>
          (typeof d.start === "string"
            ? d.start.slice(0, 10)
            : d.start.toISOString().slice(0, 10)) === dateStr,
        )
        .reduce(
          (sum, d) =>
            sum + (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
          0,
        );
      result.push({ date: dateStr, minutes });
    }
    return result;
  }, [weekOffset, days]);

  const allDays = React.useMemo(() => {
    const map: Record<string, number> = {};
    days.forEach((d) => {
      const key =
        typeof d.start === "string"
          ? d.start.slice(0, 10)
          : d.start.toISOString().slice(0, 10);
      map[key] =
        (map[key] || 0) +
        (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000;
    });
    return Object.entries(map)
      .sort()
      .map(([date, minutes]) => ({ date, minutes }));
  }, [days]);

  const pieData = React.useMemo(
    () =>
      weekData.map((d, i) => ({
        name: d.date,
        value: d.minutes,
        color: colorPalette[i % colorPalette.length],
      })),
    [weekData, colorPalette],
  );

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          title={t("worklogDetail.title") as string}
          onHomeClick={() => navigate("/worklog")}
        />
        <div className="p-4">Not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        title={t("worklogDetail.title") as string}
        onHomeClick={() => navigate("/worklog")}
      />
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/worklog")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.back")}
          </Button>
        <h2 className="font-semibold">
          {id === "default" ? t("worklog.workTime") : trip?.name}
        </h2>
        <p>
          {t("worklogDetail.totalHours")}: {(totalMinutes / 60).toFixed(2)} h
        </p>
        <p>
          {t("worklogDetail.averageHours")}: {avgHours.toFixed(2)} h
        </p>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-base">
              {t("worklogStats.lastWeek")}
            </CardTitle>
            <div className="space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWeekOffset((w) => w + 1)}
              >
                {t("ui.previous")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              >
                {t("ui.next")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weekData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-60 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("worklogDetail.allDays")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={allDays}
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
        <div>
          <h3 className="font-semibold">{t("worklogDetail.daysList")}</h3>
          <ul className="ml-4 list-disc">
            {days.map((d) => (
              <li key={d.id}>
                {format(new Date(d.start), "dd.MM.yyyy HH:mm")} - {format(
                  new Date(d.end),
                  "dd.MM.yyyy HH:mm",
                )} ({" "}
                {(
                  (new Date(d.end).getTime() - new Date(d.start).getTime()) /
                  3600000
                ).toFixed(2)}
                h)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorklogDetailPage;
