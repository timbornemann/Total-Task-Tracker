import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Edit, Trash2, FileDown } from "lucide-react";
import { isColorDark } from "@/utils/color";
import TripModal from "@/components/TripModal";
import WorkDayModal from "@/components/WorkDayModal";
import { useWorklog } from "@/hooks/useWorklog";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

const WorklogPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    trips,
    workDays,
    addTrip,
    updateTrip,
    deleteTrip,
    addWorkDay,
    updateWorkDay,
    deleteWorkDay,
  } = useWorklog();
  const { worklogCardShadow, defaultTripColor, colorPalette } = useSettings();
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [tripIdForNewDay, setTripIdForNewDay] = useState<string | undefined>(
    undefined,
  );

  const currentTrip = trips.find((t) => t.id === editingTrip);
  const currentDay = workDays.find((d) => d.id === editingDay);

  const handleSaveTrip = (data: { name: string; location: string; color: number }) => {
    if (editingTrip) {
      updateTrip(editingTrip, data);
    } else {
      addTrip(data);
    }
  };

  const handleSaveDay = (data: {
    start: string;
    end: string;
    tripId?: string;
  }) => {
    if (editingDay) {
      updateWorkDay(editingDay, data);
    } else {
      addWorkDay(data);
    }
  };

  const duration = (s: string, e: string) =>
    (new Date(e).getTime() - new Date(s).getTime()) / 3600000;

  const exportCsv = (tripId?: string) => {
    const days = workDays.filter((d) =>
      tripId ? d.tripId === tripId : !d.tripId,
    );
    const rows = ["Start,End,Hours"];
    days.forEach((d) => {
      const hrs = duration(d.start, d.end).toFixed(2);
      rows.push(`${d.start},${d.end},${hrs}`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "worklog.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t("navbar.worklog") as string} />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-4 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-semibold mb-2">{t("worklog.title")}</h2>
          <Button
            onClick={() => {
              setEditingTrip(null);
              setShowTripModal(true);
            }}
          >
            {t("worklog.addTrip")}
          </Button>
        </div>
        {trips.map((trip) => {
          const baseColor = colorPalette[trip.color ?? defaultTripColor] || colorPalette[0];
          const textColor = isColorDark(baseColor) ? "#fff" : "#000";
          const totalMinutes = workDays
            .filter((d) => d.tripId === trip.id)
            .reduce(
              (sum, d) =>
                sum +
                (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
              0,
            );
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.round(totalMinutes % 60);
          return (
            <Card
              key={trip.id}
              className={`mb-6 p-2 ${worklogCardShadow ? "shadow" : ""}`}
              style={{ backgroundColor: baseColor, color: textColor }}
            >
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-base flex justify-between items-center">
                <div className="flex flex-col">
                  <span>
                    <Link to={`/worklog/${trip.id}`} className="hover:underline">
                      {trip.name}
                    </Link>
                    {trip.location && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({trip.location})
                      </span>
                    )}
                  </span>
                  <span className="text-xs">
                    {t("worklog.totalTime", { hours, minutes })}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background z-50">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingTrip(trip.id);
                        setShowTripModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t("common.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteTrip(trip.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportCsv(trip.id)}>
                      <FileDown className="h-4 w-4 mr-2" />
                      {t("worklog.exportCsv")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                size="sm"
                className="mb-2"
                onClick={() => {
                  setTripIdForNewDay(trip.id);
                  setEditingDay(null);
                  setShowDayModal(true);
                }}
              >
                {t("worklog.addDay")}
              </Button>
              <ul className="ml-4 list-disc">
                {workDays
                  .filter((d) => d.tripId === trip.id)
                  .map((d) => (
                    <li
                      key={d.id}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {format(new Date(d.start), "dd.MM.yyyy HH:mm")} -{" "}
                        {format(new Date(d.end), "dd.MM.yyyy HH:mm")} ({" "}
                        {duration(d.start, d.end).toFixed(2)} h)
                      </span>
                      <span className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDay(d.id);
                            setShowDayModal(true);
                          }}
                        >
                          {t("common.edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWorkDay(d.id)}
                        >
                          {t("common.delete")}
                        </Button>
                      </span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ))}
        <Card
          className={`p-2 ${worklogCardShadow ? "shadow" : ""}`}
          style={{ backgroundColor: colorPalette[defaultTripColor], color: isColorDark(colorPalette[defaultTripColor]) ? "#fff" : "#000" }}
        >
          <CardHeader className="p-2 pb-0 flex justify-between items-center">
            <CardTitle className="text-base">
              <Link to="/worklog/default" className="hover:underline">
                {t("worklog.workTime")}
              </Link>
            </CardTitle>
            <span className="text-xs">
              {t("worklog.totalTime", {
                hours: Math.floor(
                  workDays
                    .filter((d) => !d.tripId)
                    .reduce(
                      (s, d) =>
                        s +
                        (new Date(d.end).getTime() - new Date(d.start).getTime()) /
                          60000,
                      0,
                    ) / 60,
                ),
                minutes: Math.round(
                  workDays
                    .filter((d) => !d.tripId)
                    .reduce(
                      (s, d) =>
                        s +
                        (new Date(d.end).getTime() - new Date(d.start).getTime()) /
                          60000,
                      0,
                    ) % 60,
                ),
              })}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                <DropdownMenuItem onClick={() => exportCsv(undefined)}>
                  <FileDown className="h-4 w-4 mr-2" />
                  {t("worklog.exportCsv")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="pt-2">
            <Button
              size="sm"
              className="mb-2"
              onClick={() => {
                setTripIdForNewDay(undefined);
                setEditingDay(null);
                setShowDayModal(true);
              }}
            >
              {t("worklog.addDay")}
            </Button>
            <ul className="ml-4 list-disc">
              {workDays
                .filter((d) => !d.tripId)
                .map((d) => (
                  <li key={d.id} className="flex justify-between items-center">
                    <span>
                      {format(new Date(d.start), "dd.MM.yyyy HH:mm")} -{" "}
                      {format(new Date(d.end), "dd.MM.yyyy HH:mm")} ({" "}
                      {duration(d.start, d.end).toFixed(2)} h)
                    </span>
                    <span className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDay(d.id);
                          setShowDayModal(true);
                        }}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteWorkDay(d.id)}
                      >
                        {t("common.delete")}
                      </Button>
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <TripModal
        isOpen={showTripModal}
        onClose={() => setShowTripModal(false)}
        onSave={handleSaveTrip}
        trip={currentTrip}
      />
      <WorkDayModal
        isOpen={showDayModal}
        onClose={() => {
          setShowDayModal(false);
          setTripIdForNewDay(undefined);
        }}
        onSave={(data) =>
          handleSaveDay({ ...data, tripId: data.tripId || tripIdForNewDay })
        }
        workDay={currentDay}
        trips={trips}
        defaultTripId={tripIdForNewDay}
      />
    </div>
  );
};

export default WorklogPage;
