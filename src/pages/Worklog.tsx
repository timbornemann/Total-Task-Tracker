import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { worklogCardShadow } = useSettings();
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [tripIdForNewDay, setTripIdForNewDay] = useState<string | undefined>(
    undefined,
  );

  const currentTrip = trips.find((t) => t.id === editingTrip);
  const currentDay = workDays.find((d) => d.id === editingDay);

  const handleSaveTrip = (data: { name: string; location: string }) => {
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
        {trips.map((trip) => (
          <Card
            key={trip.id}
            className={`mb-6 p-2 ${worklogCardShadow ? "shadow" : ""}`}
          >
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-base flex justify-between items-center">
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
                <span className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTrip(trip.id);
                      setShowTripModal(true);
                    }}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteTrip(trip.id)}
                  >
                    {t("common.delete")}
                  </Button>
                </span>
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
                        {format(new Date(d.start), "yyyy-MM-dd HH:mm")} -{" "}
                        {format(new Date(d.end), "yyyy-MM-dd HH:mm")} ({" "}
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
        <Card className={`p-2 ${worklogCardShadow ? "shadow" : ""}`}>
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-base">
              <Link to="/worklog/default" className="hover:underline">
                {t("worklog.noTrip")}
              </Link>
            </CardTitle>
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
                      {format(new Date(d.start), "yyyy-MM-dd HH:mm")} -{" "}
                      {format(new Date(d.end), "yyyy-MM-dd HH:mm")} ({" "}
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
