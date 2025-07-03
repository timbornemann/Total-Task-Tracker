import React, { useState, useEffect } from "react";
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
import { useSettings } from "@/hooks/useSettings";

interface TimerFormData {
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
  color: number;
}

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TimerFormData) => void;
  initialData?: TimerFormData;
}

const TimerModal: React.FC<TimerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { t } = useTranslation();
  const { colorPalette, defaultTimerColor } = useSettings();
  const [data, setData] = useState<TimerFormData>(
    initialData ?? {
      title: "",
      hours: 0,
      minutes: 0,
      seconds: 0,
      color: defaultTimerColor,
    },
  );

  useEffect(() => {
    if (!isOpen) return;
    setData(
      initialData ?? {
        title: "",
        hours: 0,
        minutes: 0,
        seconds: 0,
        color: defaultTimerColor,
      },
    );
  }, [isOpen, defaultTimerColor, initialData]);

  const handleChange = (field: keyof TimerFormData, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(initialData ? "timerModal.editTitle" : "timerModal.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("timers.title")}</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="h">{t("timers.hours")}</Label>
              <Input
                id="h"
                type="number"
                min="0"
                value={data.hours}
                onChange={(e) => handleChange("hours", Number(e.target.value))}
                required
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="m">{t("timers.minutes")}</Label>
              <Input
                id="m"
                type="number"
                min="0"
                value={data.minutes}
                onChange={(e) =>
                  handleChange("minutes", Number(e.target.value))
                }
                required
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="s">{t("timers.seconds")}</Label>
              <Input
                id="s"
                type="number"
                min="0"
                value={data.seconds}
                onChange={(e) =>
                  handleChange("seconds", Number(e.target.value))
                }
                required
              />
            </div>
          </div>
          <div>
            <Label>{t("timers.color")}</Label>
            <div className="flex space-x-2 mt-2">
              {colorPalette.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    data.color === i
                      ? "border-gray-800 scale-110"
                      : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => handleChange("color", i)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("common.save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TimerModal;
