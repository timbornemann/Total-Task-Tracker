import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import TaskModal from "@/components/TaskModal";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/hooks/useTaskStore";
import { Task, TaskFormData } from "@/types";

const RecurringTasksPage = () => {
  const {
    recurring,
    categories,
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
  } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleSave = (data: TaskFormData) => {
    if (editingTask) {
      updateRecurringTask(editingTask.id, data);
    } else {
      addRecurringTask({ ...data, isRecurring: true, template: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("navbar.recurring")} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t("recurring.template")}
          </Button>
        </div>
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("recurring.none")}</p>
        ) : (
          <div className="space-y-2">
            {recurring.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                parentPathTitles={[]}
                showSubtasks={false}
                onEdit={() => {
                  setEditingTask(t);
                  setIsModalOpen(true);
                }}
                onDelete={() => deleteRecurringTask(t.id)}
                onAddSubtask={() => {}}
                onToggleComplete={() => {}}
                onViewDetails={() => {}}
              />
            ))}
          </div>
        )}
      </div>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
        task={editingTask || undefined}
        categories={categories}
        defaultIsRecurring
      />
    </div>
  );
};

export default RecurringTasksPage;
