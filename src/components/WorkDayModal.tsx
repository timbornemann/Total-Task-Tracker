import React, { useEffect, useState } from "react";
import { Trip, WorkDay, Commute } from "@/types";
import { normalizeDateTime } from "@/utils/time";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface WorkDayFormData {
  start: string;
  end: string;
  category: string;
  tripId?: string;
}

interface WorkDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkDayFormData & { commuteId?: string; commuteKm?: number }) => void;
  workDay?: WorkDay;
  trips: Trip[];
  commutes: Commute[];
  addCommute: (data: { name: string; kilometers: number }) => string;
  defaultTripId?: string;
  categories: string[];
}

const WorkDayModal: React.FC<WorkDayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workDay,
  trips,
  commutes,
  addCommute,
  defaultTripId,
  categories,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<WorkDayFormData>({
    start: "",
    end: "",
    category: "work",
    tripId: "",
  });
  const [categorySelection, setCategorySelection] = useState<string>("work");
  const [newCategory, setNewCategory] = useState<string>("");
  const [commuteSelection, setCommuteSelection] = useState<string>("");
  const [commuteKm, setCommuteKm] = useState<string>("");
  const [newCommute, setNewCommute] = useState<{ name: string; km: string }>({
    name: "",
    km: "",
  });

  const toInput = (v: string) => v.replace(" ", "T");
  const fromInput = (v: string) => v.replace("T", " ");

  useEffect(() => {
    if (!isOpen) return;
    if (workDay) {
      setForm({
        start: toInput(normalizeDateTime(workDay.start)),
        end: toInput(normalizeDateTime(workDay.end)),
        category: workDay.category || "work",
        tripId: workDay.tripId,
      });
      setCategorySelection(workDay.category || "work");
      setNewCategory("");
      if (workDay.commuteId) {
        setCommuteSelection(workDay.commuteId);
      } else if (workDay.commuteKm) {
        setCommuteSelection("custom");
        setCommuteKm(String(workDay.commuteKm));
      } else {
        setCommuteSelection("");
      }
    } else {
      setForm({
        start: "",
        end: "",
        category: "work",
        tripId: defaultTripId || "",
      });
      setCategorySelection("work");
      setNewCategory("");
      setCommuteSelection("");
      setCommuteKm("");
      setNewCommute({ name: "", km: "" });
    }
  }, [isOpen, workDay, defaultTripId]);

  const handleChange = (field: keyof WorkDayFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (value: string) => {
    setCategorySelection(value);
    if (value === "new") {
      setForm((prev) => ({ ...prev, category: "" }));
    } else {
      setForm((prev) => ({ ...prev, category: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.start && form.end && (categorySelection !== "new" || newCategory)) {
      let commuteId: string | undefined;
      let commuteKmNum: number | undefined;
      if (commuteSelection === "new" && newCommute.name && newCommute.km) {
        commuteId = addCommute({
          name: newCommute.name,
          kilometers: Number(newCommute.km),
        });
      } else if (commuteSelection === "custom" && commuteKm) {
        commuteKmNum = Number(commuteKm);
      } else if (commuteSelection) {
        commuteId = commuteSelection;
      }
      const finalCategory =
        categorySelection === "new" ? newCategory : categorySelection;
      onSave({
        start: normalizeDateTime(fromInput(form.start)),
        end: normalizeDateTime(fromInput(form.end)),
        category: finalCategory,
        tripId: form.tripId || undefined,
        commuteId,
        commuteKm: commuteKmNum,
      });
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
            <Label htmlFor="wd-category">{t("workDayModal.category")}</Label>
            <Select
              value={categorySelection}
              onValueChange={handleCategorySelect}
            >
              <SelectTrigger id="wd-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`worklog.category.${c}`, { defaultValue: c })}
                  </SelectItem>
                ))}
                <SelectItem value="new">
                  {t("workDayModal.newCategory")}
                </SelectItem>
              </SelectContent>
            </Select>
            {categorySelection === "new" && (
              <Input
                className="mt-2"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={t("workDayModal.newCategory") as string}
              />
            )}
          </div>
          <div>
            <Label htmlFor="wd-trip">{t("workDayModal.trip")}</Label>
            <select
              id="wd-trip"
              className="border rounded px-2 py-1 w-full"
              value={form.tripId || ""}
              onChange={(e) => handleChange("tripId", e.target.value)}
            >
              <option value="">{t("worklog.workTime")}</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="wd-commute">{t("workDayModal.commute")}</Label>
            <select
              id="wd-commute"
              className="border rounded px-2 py-1 w-full"
              value={commuteSelection}
              onChange={(e) => setCommuteSelection(e.target.value)}
            >
              <option value="">{t("workDayModal.noCommute")}</option>
              {commutes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kilometers} km)
                </option>
              ))}
              <option value="custom">{t("workDayModal.enterKm")}</option>
              <option value="new">{t("workDayModal.newCommute")}</option>
            </select>
            {commuteSelection === "custom" && (
              <Input
                type="number"
                className="mt-2"
                value={commuteKm}
                onChange={(e) => setCommuteKm(e.target.value)}
                placeholder={t("workDayModal.kilometers") as string}
              />
            )}
            {commuteSelection === "new" && (
              <div className="mt-2 space-y-2">
                <Input
                  value={newCommute.name}
                  onChange={(e) =>
                    setNewCommute({ ...newCommute, name: e.target.value })
                  }
                  placeholder={t("workDayModal.newCommuteName") as string}
                />
                <Input
                  type="number"
                  value={newCommute.km}
                  onChange={(e) =>
                    setNewCommute({ ...newCommute, km: e.target.value })
                  }
                  placeholder={t("workDayModal.kilometers") as string}
                />
              </div>
            )}
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
