import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Task, TaskFormData, Category } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getPriorityColor } from "@/utils/taskUtils";
import { useSettings } from "@/hooks/useSettings";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
  task?: Task;
  categories: Category[];
  parentTask?: Task;
  /**
   * Default category to use when creating a new task. This will be ignored when
   * editing an existing task where the category comes from the task itself.
   */
  defaultCategoryId?: string;
  /**
   * Default due date when creating a new task. Ignored when editing.
   */
  defaultDueDate?: Date;

  /**
   * Default value for the recurring toggle when creating a new task.
   */
  defaultIsRecurring?: boolean;

  /**
   * Whether recurring options should be available.
   */
  allowRecurring?: boolean;

  /**
   * Default start time when creating a new task.
   */
  defaultStartTime?: string;

  /**
   * Default end time when creating a new task.
   */
  defaultEndTime?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  categories,
  parentTask,
  defaultCategoryId,
  defaultDueDate,
  defaultIsRecurring = false,
  allowRecurring = true,
  defaultStartTime,
  defaultEndTime,
}) => {
  const { t } = useTranslation();
  const { defaultTaskPriority, defaultTaskColor, colorPalette } = useSettings();
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: defaultTaskPriority,
    color: defaultTaskColor,
    categoryId: "",
    parentId: parentTask?.id,
    dueDate: undefined,
    isRecurring: allowRecurring ? defaultIsRecurring : false,
    recurrencePattern: undefined,
    customIntervalDays: undefined,
    dueOption: undefined,
    dueAfterDays: undefined,
    startOption: "today",
    startWeekday: undefined,
    startDate: undefined,
    startTime: undefined,
    endTime: undefined,
    visible: true,
    titleTemplate: undefined,
    template: false,
  });

  const colorOptions = colorPalette;

  const defaultCategory = React.useMemo(
    () =>
      defaultCategoryId || parentTask?.categoryId || categories[0]?.id || "",
    [defaultCategoryId, parentTask?.categoryId, categories],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        color: task.color,
        categoryId: task.categoryId,
        parentId: task.parentId,
        dueDate: task.dueDate,
        isRecurring: allowRecurring ? task.isRecurring : false,
        recurrencePattern: task.recurrencePattern,
        customIntervalDays: task.customIntervalDays,
        dueOption: task.dueOption,
        dueAfterDays: task.dueAfterDays,
        startOption: task.startOption || "today",
        startWeekday: task.startWeekday,
        startDate: task.startDate,
        startTime: task.startTime,
        endTime: task.endTime,
        titleTemplate: task.titleTemplate,
        template: task.template,
        visible: task.visible !== false,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        priority: defaultTaskPriority,
        color: defaultTaskColor,
        categoryId: defaultCategory,
        parentId: parentTask?.id,
        dueDate: defaultDueDate,
        isRecurring: allowRecurring ? defaultIsRecurring : false,
        recurrencePattern: undefined,
        customIntervalDays: undefined,
        dueOption: undefined,
        dueAfterDays: undefined,
        startOption: "today",
        startWeekday: undefined,
        startDate: undefined,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        titleTemplate: undefined,
        template: false,
        visible: true,
      });
    }
  }, [
    isOpen,
    task,
    parentTask?.id,
    defaultCategory,
    defaultDueDate,
    defaultTaskPriority,
    defaultTaskColor,
    defaultIsRecurring,
    allowRecurring,
    defaultStartTime,
    defaultEndTime,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.categoryId) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = <K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K],
  ) => {
    setFormData((prev) => {
      const updated: TaskFormData = { ...prev, [field]: value };
      if (field === "recurrencePattern" && value) {
        updated.customIntervalDays = undefined;
      }
      if (field === "customIntervalDays" && value) {
        updated.recurrencePattern = undefined;
      }
      if (field === "isRecurring") {
        if (value) {
          updated.dueDate = undefined;
        } else {
          updated.dueOption = undefined;
          updated.dueAfterDays = undefined;
          updated.startOption = "today";
          updated.startWeekday = undefined;
          updated.startDate = undefined;
        }
      }
      return updated;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task
              ? t("taskModal.editTitle")
              : parentTask
                ? t("taskModal.newSubtaskTitle")
                : t("taskModal.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("taskModal.title")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder={t("taskModal.title")}
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">{t("taskModal.description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={t("taskModal.description")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">{t("taskModal.priority")}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span
                      className={`px-2 py-1 rounded text-sm ${getPriorityColor("low")}`}
                    >
                      🟢 {t("taskModal.low")}
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span
                      className={`px-2 py-1 rounded text-sm ${getPriorityColor("medium")}`}
                    >
                      🟡 {t("taskModal.medium")}
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span
                      className={`px-2 py-1 rounded text-sm ${getPriorityColor("high")}`}
                    >
                      🔴 {t("taskModal.high")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">{t("taskModal.category")}</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleChange("categoryId", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: colorPalette[category.color],
                          }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!formData.isRecurring && (
            <div>
              <Label htmlFor="dueDate">{t("taskModal.dueDate")}</Label>
              <Input
                id="dueDate"
                type="date"
                value={
                  formData.dueDate
                    ? new Date(formData.dueDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  handleChange(
                    "dueDate",
                    e.target.value ? new Date(e.target.value) : undefined,
                  )
                }
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startTime">{t("taskModal.startTime")}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime || ""}
                    onChange={(e) =>
                      handleChange("startTime", e.target.value || undefined)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">{t("taskModal.endTime")}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime || ""}
                    onChange={(e) =>
                      handleChange("endTime", e.target.value || undefined)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {formData.isRecurring && (
            <div>
              <Label>{t("taskModal.recurrence")}</Label>
              <Select
                value={formData.dueOption}
                onValueChange={(v: "days" | "weekEnd" | "monthEnd") =>
                  handleChange("dueOption", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">
                    {t("taskModal.customDays")}
                  </SelectItem>
                  <SelectItem value="weekEnd">
                    {t("taskModal.weekEnd")}
                  </SelectItem>
                  <SelectItem value="monthEnd">
                    {t("taskModal.monthEnd")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {formData.dueOption === "days" && (
                <Input
                  className="mt-2"
                  id="dueAfterDays"
                  type="number"
                  value={formData.dueAfterDays ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "dueAfterDays",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder={t("taskModal.placeholderExample")}
                />
              )}
            </div>
          )}

          <div>
            <Label>{t("taskModal.color")}</Label>
            <div className="flex space-x-2 mt-2">
              {colorOptions.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === idx
                      ? "border-gray-800 scale-110"
                      : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange("color", idx)}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <Label htmlFor="visible">{t("taskModal.hidden")}</Label>
              <Switch
                id="visible"
                checked={formData.visible !== false}
                onCheckedChange={(checked) => handleChange("visible", checked)}
              />
            </div>
          </div>

          {allowRecurring && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">{t("taskModal.recurring")}</Label>
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    handleChange("isRecurring", checked)
                  }
                />
              </div>

              {formData.isRecurring && (
                <div>
                  <Label htmlFor="recurrence">
                    {t("taskModal.recurrence")}
                  </Label>
                  <Select
                    value={formData.recurrencePattern}
                    onValueChange={(value) =>
                      handleChange("recurrencePattern", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">
                        {t("taskModal.daily")}
                      </SelectItem>
                      <SelectItem value="weekly">
                        {t("taskModal.weekly")}
                      </SelectItem>
                      <SelectItem value="monthly">
                        {t("taskModal.monthly")}
                      </SelectItem>
                      <SelectItem value="yearly">
                        {t("taskModal.yearly")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <Label htmlFor="customDays">
                      {t("taskModal.customDays")}
                    </Label>
                    <Input
                      id="customDays"
                      type="number"
                      value={formData.customIntervalDays ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "customIntervalDays",
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder={t("taskModal.placeholderExample")}
                    />
                  </div>
                  <div className="mt-2">
                    <Label>{t("taskModal.start")}</Label>
                    <Select
                      value={formData.startOption}
                      onValueChange={(v: "today" | "weekday" | "date") =>
                        handleChange("startOption", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">
                          {t("taskModal.today")}
                        </SelectItem>
                        <SelectItem value="weekday">
                          {t("taskModal.weekday")}
                        </SelectItem>
                        <SelectItem value="date">
                          {t("taskModal.date")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.startOption === "weekday" && (
                      <Select
                        value={
                          formData.startWeekday !== undefined
                            ? String(formData.startWeekday)
                            : ""
                        }
                        onValueChange={(val) =>
                          handleChange("startWeekday", Number(val))
                        }
                        className="mt-2"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("taskModal.weekday")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">
                            {t("weekdays.sunday")}
                          </SelectItem>
                          <SelectItem value="1">
                            {t("weekdays.monday")}
                          </SelectItem>
                          <SelectItem value="2">
                            {t("weekdays.tuesday")}
                          </SelectItem>
                          <SelectItem value="3">
                            {t("weekdays.wednesday")}
                          </SelectItem>
                          <SelectItem value="4">
                            {t("weekdays.thursday")}
                          </SelectItem>
                          <SelectItem value="5">
                            {t("weekdays.friday")}
                          </SelectItem>
                          <SelectItem value="6">
                            {t("weekdays.saturday")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {formData.startOption === "date" && (
                      <Input
                        type="date"
                        className="mt-2"
                        value={
                          formData.startDate
                            ? new Date(formData.startDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleChange(
                            "startDate",
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    )}
                  </div>
                  <div className="mt-2">
                    <Label htmlFor="titleTemplate">
                      {t("taskModal.titleTemplate")}
                    </Label>
                    <Input
                      id="titleTemplate"
                      value={formData.titleTemplate || ""}
                      onChange={(e) =>
                        handleChange("titleTemplate", e.target.value)
                      }
                      placeholder={t("taskModal.titleTemplatePlaceholder")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {task ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
