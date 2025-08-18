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
} from "recharts";

const WorklogStatsPage: React.FC = () => {
  const { trips, workDays, commutes } = useWorklog();
  const { t } = useTranslation();

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("navbar.worklogStats")} />
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("worklogStats.perTrip")}
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
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
