import React, { useEffect, useState } from "react";
import { Trip, WorkDay } from "@/types";
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

interface WorkDayFormData {
  start: string;
  end: string;
  tripId?: string;
}

interface WorkDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkDayFormData) => void;
  workDay?: WorkDay;
  trips: Trip[];
}

const WorkDayModal: React.FC<WorkDayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workDay,
  trips,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<WorkDayFormData>({
    start: "",
    end: "",
    tripId: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    if (workDay) {
      setForm({
        start: workDay.start,
        end: workDay.end,
        tripId: workDay.tripId,
      });
    } else {
      setForm({ start: "", end: "", tripId: "" });
    }
  }, [isOpen, workDay]);

  const handleChange = (field: keyof WorkDayFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.start && form.end) {
      onSave({ ...form, tripId: form.tripId || undefined });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {workDay ? t("workDayModal.editTitle") : t("workDayModal.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="wd-start">{t("workDayModal.start")}</Label>
            <Input
              id="wd-start"
              type="datetime-local"
              value={form.start}
              onChange={(e) => handleChange("start", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="wd-end">{t("workDayModal.end")}</Label>
            <Input
              id="wd-end"
              type="datetime-local"
              value={form.end}
              onChange={(e) => handleChange("end", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="wd-trip">{t("workDayModal.trip")}</Label>
            <select
              id="wd-trip"
              className="border rounded px-2 py-1 w-full"
              value={form.tripId || ""}
              onChange={(e) => handleChange("tripId", e.target.value)}
            >
              <option value="">{t("worklog.noTrip")}</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {workDay ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkDayModal;
