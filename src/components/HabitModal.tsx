import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Habit, HabitFormData } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HabitFormData) => void;
  habit?: Habit;
}

const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  habit,
}) => {
  const { t } = useTranslation();
  const { colorPalette } = useSettings();
  const [formData, setFormData] = useState<HabitFormData>({
    title: "",
    color: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (habit) {
      setFormData({
        title: habit.title,
        color: habit.color,
        recurrencePattern: habit.recurrencePattern,
        customIntervalDays: habit.customIntervalDays,
        startWeekday: habit.startWeekday,
        startDate: habit.startDate ? new Date(habit.startDate) : undefined,
      });
    } else {
      setFormData({ title: "", color: 0 });
    }
  }, [isOpen, habit]);

  const handleChange = <K extends keyof HabitFormData>(
    field: K,
    val: HabitFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {habit ? t("habitModal.editTitle") : t("habitModal.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("habitModal.title")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label>{t("habitModal.color")}</Label>
            <div className="flex space-x-2 mt-2">
              {colorPalette.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === idx ? "border-gray-800 scale-110" : "border-gray-300 hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => handleChange("color", idx)}
                />
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="recurrence">{t("habitModal.recurrence")}</Label>
            <Select
              value={formData.recurrencePattern}
              onValueChange={(v: HabitFormData["recurrencePattern"]) =>
                handleChange("recurrencePattern", v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("habitModal.daily")}</SelectItem>
                <SelectItem value="weekly">{t("habitModal.weekly")}</SelectItem>
                <SelectItem value="monthly">
                  {t("habitModal.monthly")}
                </SelectItem>
                <SelectItem value="yearly">{t("habitModal.yearly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.recurrencePattern === "weekly" && (
            <div>
              <Label htmlFor="weekday">{t("taskModal.weekday")}</Label>
              <Input
                id="weekday"
                type="number"
                value={formData.startWeekday ?? ""}
                onChange={(e) =>
                  handleChange(
                    "startWeekday",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>
          )}
          {formData.recurrencePattern === "daily" && (
            <div>
              <Label htmlFor="custom">{t("habitModal.customInterval")}</Label>
              <Input
                id="custom"
                type="number"
                value={formData.customIntervalDays ?? ""}
                onChange={(e) =>
                  handleChange(
                    "customIntervalDays",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {habit ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HabitModal;
