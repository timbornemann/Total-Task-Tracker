import React from "react";
import Navbar from "@/components/Navbar";
import { useParams } from "react-router-dom";
import { useWorklog } from "@/hooks/useWorklog";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const WorklogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { trips, workDays } = useWorklog();
  const { t } = useTranslation();

  const trip = id === "default" ? null : trips.find((tr) => tr.id === id);
  if (id !== "default" && !trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title={t("worklogDetail.title") as string} />
        <div className="p-4">Not found</div>
      </div>
    );
  }

  const days = workDays.filter((d) =>
    id === "default" ? !d.tripId : d.tripId === id,
  );
  const totalMinutes = days.reduce(
    (sum, d) =>
      sum +
      (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
    0,
  );

  const lastWeek: { date: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().slice(0, 10);
    const minutes = days
      .filter((d) => d.start.slice(0, 10) === dateStr)
      .reduce(
        (sum, d) =>
          sum +
          (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
        0,
      );
    lastWeek.push({ date: dateStr, minutes });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("worklogDetail.title") as string} />
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        <h2 className="font-semibold">
          {id === "default" ? t("worklog.noTrip") : trip?.name}
        </h2>
        <p>{(totalMinutes / 60).toFixed(2)} h</p>
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
      </div>
    </div>
  );
};

export default WorklogDetailPage;
