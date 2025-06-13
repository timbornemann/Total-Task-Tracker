import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TaskModal from '@/components/TaskModal';
import TaskCard from '@/components/TaskCard';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/hooks/useTaskStore';

const RecurringTasksPage = () => {
  const {
    recurring,
    categories,
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask
  } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const handleSave = (data: any) => {
    if (editingTask) {
      updateRecurringTask(editingTask.id, data);
    } else {
      addRecurringTask({ ...data, isRecurring: true, template: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Wiederkehrend" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Vorlage
          </Button>
        </div>
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Vorlagen vorhanden.</p>
        ) : (
          <div className="space-y-2">
            {recurring.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                parentPathTitles={[]}
                showSubtasks={false}
                onEdit={() => { setEditingTask(t); setIsModalOpen(true); }}
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
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        task={editingTask || undefined}
        categories={categories}
      />
    </div>
  );
};

export default RecurringTasksPage;
