import React, { useEffect, useState } from "react";
import { Trip } from "@/types";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TripFormData {
  name: string;
  lat?: number;
  lng?: number;
}

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TripFormData) => void;
  trip?: Trip;
}

const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  onSave,
  trip,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<TripFormData>({ name: "" });

  useEffect(() => {
    if (!isOpen) return;
    if (trip) {
      setForm({ name: trip.name, lat: trip.lat, lng: trip.lng });
    } else {
      setForm({ name: "", lat: undefined, lng: undefined });
    }
  }, [isOpen, trip]);

  const handleChange = (field: keyof TripFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim()) {
      const data: TripFormData = {
        name: form.name,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
      };
      onSave(data);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {trip ? t("tripModal.editTitle") : t("tripModal.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="trip-name">{t("tripModal.name")}</Label>
            <Input
              id="trip-name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="trip-lat">{t("tripModal.latitude")}</Label>
            <Input
              id="trip-lat"
              type="number"
              step="any"
              value={form.lat ?? ""}
              onChange={(e) => handleChange("lat", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="trip-lng">{t("tripModal.longitude")}</Label>
            <Input
              id="trip-lng"
              type="number"
              step="any"
              value={form.lng ?? ""}
              onChange={(e) => handleChange("lng", e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {trip ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TripModal;
