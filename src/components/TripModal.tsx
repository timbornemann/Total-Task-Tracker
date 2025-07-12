import React, { useEffect, useState } from "react";
import { Trip } from "@/types";
import { useSettings } from "@/hooks/useSettings";
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
  location: string;
  color: number;
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
  const { colorPalette, defaultTripColor } = useSettings();
  const [form, setForm] = useState<TripFormData>({
    name: "",
    location: "",
    color: defaultTripColor,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (trip) {
      setForm({
        name: trip.name,
        location: trip.location || "",
        color: trip.color ?? defaultTripColor,
      });
    } else {
      setForm({ name: "", location: "", color: defaultTripColor });
    }
  }, [isOpen, trip, defaultTripColor]);

  const handleChange = (field: keyof TripFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim()) {
      onSave({
        name: form.name,
        location: form.location.trim(),
        color: form.color,
      });
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
          <Label htmlFor="trip-location">{t("tripModal.location")}</Label>
          <Input
            id="trip-location"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>
        <div>
          <Label>{t("tripModal.color")}</Label>
          <div className="flex space-x-2 mt-2">
            {colorPalette.map((c, idx) => (
              <button
                key={idx}
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  form.color === idx
                    ? "border-gray-800 scale-110"
                    : "border-gray-300 hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => handleChange("color", idx)}
              />
            ))}
          </div>
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
