import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import TripModal from "@/components/TripModal";
import WorkDayModal from "@/components/WorkDayModal";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useWorklog } from "@/hooks/useWorklog";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";

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
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [tripIdForNewDay, setTripIdForNewDay] = useState<string | undefined>(
    undefined,
  );

  const currentTrip = trips.find((t) => t.id === editingTrip);
  const currentDay = workDays.find((d) => d.id === editingDay);

  const handleSaveTrip = (data: {
    name: string;
    lat?: number;
    lng?: number;
  }) => {
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
        <div className="flex justify-between">
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
          <div key={trip.id} className="mb-6 border rounded p-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{trip.name}</h3>
              <div className="space-x-2">
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
              </div>
            </div>
            {trip.lat !== undefined && trip.lng !== undefined && (
              <MapContainer
                center={[trip.lat, trip.lng]}
                zoom={6}
                className="h-40 w-full rounded mb-2"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[trip.lat, trip.lng]} />
              </MapContainer>
            )}
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
          </div>
        ))}
        {workDays.filter((d) => !d.tripId).length > 0 && (
          <div className="border rounded p-2">
            <h3 className="font-medium mb-2">{t("worklog.noTrip")}</h3>
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
          </div>
        )}
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
      />
    </div>
  );
};

export default WorklogPage;
