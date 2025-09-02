import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import TimerCard from "@/components/TimerCard";
import TimerModal from "@/components/TimerModal";
import { Button } from "@/components/ui/button";
import { useTimers } from "@/stores/timers";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableTimerProps {
  id: string;
}

const SortableTimer: React.FC<SortableTimerProps> = ({ id }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TimerCard id={id} />
    </div>
  );
};

const TimersPage: React.FC = () => {
  const { t } = useTranslation();
  const timers = useTimers((state) => state.timers);
  const addTimer = useTimers((state) => state.addTimer);
  const reorderTimers = useTimers((state) => state.reorderTimers);
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = timers.findIndex((t) => t.id === active.id);
    const newIndex = timers.findIndex((t) => t.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTimers(oldIndex, newIndex);
    }
  };

  const handleSave = (data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
    color: number;
  }) => {
    const duration = data.hours * 3600 + data.minutes * 60 + data.seconds;
    addTimer({ title: data.title, color: data.color, duration });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t("navbar.timers")} />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4 flex justify-center">
          <Button onClick={() => setOpen(true)}>{t("timers.new")}</Button>
        </div>
        {timers.length === 0 && (
          <p className="text-center text-muted-foreground">
            {t("timers.none")}
          </p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={timers.map((t) => t.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-fr">
              {timers.map((t) => (
                <SortableTimer key={t.id} id={t.id} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <TimerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default TimersPage;
