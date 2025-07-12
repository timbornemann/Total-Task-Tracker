import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorklog } from "@/hooks/useWorklog";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

const WorklogPage: React.FC = () => {
  const { t } = useTranslation();
  const { trips, workDays, addTrip, addWorkDay } = useWorklog();
  const [tripName, setTripName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [tripId, setTripId] = useState("");

  const handleAddTrip = () => {
    if (!tripName) return;
    addTrip(tripName);
    setTripName("");
  };

  const handleAddDay = () => {
    if (!start || !end) return;
    addWorkDay({ start, end, tripId: tripId || undefined });
    setStart("");
    setEnd("");
    setTripId("");
  };

  const duration = (s: string, e: string) =>
    (new Date(e).getTime() - new Date(s).getTime()) / 3600000;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t("navbar.worklog") as string} />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-4 space-y-6">
        <div>
          <h2 className="font-semibold mb-2">{t("worklog.addTrip")}</h2>
          <div className="flex gap-2">
            <Input
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder={t("worklog.tripName") || ""}
            />
            <Button onClick={handleAddTrip}>{t("worklog.addTrip")}</Button>
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">{t("worklog.addDay")}</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <Input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
            <select
              className="border rounded px-2 py-1"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
            >
              <option value="">{t("worklog.noTrip")}</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button onClick={handleAddDay}>{t("worklog.addDay")}</Button>
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">{t("worklog.title")}</h2>
          {trips.map((trip) => (
            <div key={trip.id} className="mb-4">
              <h3 className="font-medium">{trip.name}</h3>
              <ul className="ml-4 list-disc">
                {workDays
                  .filter((d) => d.tripId === trip.id)
                  .map((d) => (
                    <li key={d.id}>
                      {format(new Date(d.start), "yyyy-MM-dd HH:mm")} - {" "}
                      {format(new Date(d.end), "yyyy-MM-dd HH:mm")} ({" "}
                      {duration(d.start, d.end).toFixed(2)} h)
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {workDays.filter((d) => !d.tripId).length > 0 && (
            <div>
              <h3 className="font-medium">{t("worklog.noTrip")}</h3>
              <ul className="ml-4 list-disc">
                {workDays
                  .filter((d) => !d.tripId)
                  .map((d) => (
                    <li key={d.id}>
                      {format(new Date(d.start), "yyyy-MM-dd HH:mm")} - {" "}
                      {format(new Date(d.end), "yyyy-MM-dd HH:mm")} ({" "}
                      {duration(d.start, d.end).toFixed(2)} h)
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorklogPage;

