import React from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorklog } from "@/hooks/useWorklog";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "react-i18next";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const WorklogOverviewPage: React.FC = () => {
  const { trips, workDays } = useWorklog();
  const { colorPalette, defaultTripColor } = useSettings();
  const { t } = useTranslation();

  const data = trips.map((trip) => {
    const minutes = workDays
      .filter((d) => d.tripId === trip.id)
      .reduce(
        (sum, d) =>
          sum +
          (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
        0,
      );
    return {
      name: trip.name,
      value: minutes,
      color: colorPalette[trip.color ?? defaultTripColor] || colorPalette[0],
    };
  });

  const uncategorized = workDays
    .filter((d) => !d.tripId)
    .reduce(
      (sum, d) =>
        sum +
        (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
      0,
    );
  if (uncategorized > 0) {
    data.push({
      name: t("worklogOverview.uncategorized"),
      value: uncategorized,
      color: colorPalette[defaultTripColor] || colorPalette[0],
    });
  }

  const totalMinutes = data.reduce((s, d) => s + d.value, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = Math.round(totalMinutes % 60);

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("navbar.worklogOverview")} />
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("worklogStats.totalTime", { hours: totalHours, minutes: totalMins })}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("worklogOverview.timeDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" outerRadius="80%" labelLine={false}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {data.map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">
                      {item.name} ({Math.floor(item.value / 60)}h {Math.round(item.value % 60)}m)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorklogOverviewPage;

