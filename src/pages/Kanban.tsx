import React, { useState } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import TaskCard from '@/components/TaskCard';
import Navbar from '@/components/Navbar';
import TaskModal from '@/components/TaskModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import { usePomodoroStore } from '@/components/PomodoroTimer';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskFormData } from '@/types';
import { flattenTasks, FlattenedTask } from '@/utils/taskUtils';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';

const Kanban: React.FC = () => {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    findTaskById
  } = useTaskStore();
  const { toast } = useToast();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [taskDetailStack, setTaskDetailStack] = useState<Task[]>([]);
  const { start: startPomodoro } = usePomodoroStore();

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination, source } = result;
    const newStatus = destination.droppableId as 'todo' | 'inprogress' | 'done';
    if (destination.droppableId !== source.droppableId) {
      updateTask(draggableId, {
        status: newStatus,
        completed: newStatus === 'done'
      });
    }
  };

  const handleCreateTask = (taskData: TaskFormData) => {
    addTask({
      ...taskData,
      completed: false
    });
    toast({
      title: 'Task erstellt',
      description: `"${taskData.title}" wurde erfolgreich erstellt.`
    });
    setParentTask(null);
  };

  const handleUpdateTask = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        ...taskData,
        completed: editingTask.completed
      });
      toast({
        title: 'Task aktualisiert',
        description: `"${taskData.title}" wurde erfolgreich aktualisiert.`
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = findTaskById(taskId);
    if (task && window.confirm(`Sind Sie sicher, dass Sie "${task.title}" löschen möchten?`)) {
      deleteTask(taskId);
      toast({
        title: 'Task gelöscht',
        description: 'Die Task wurde erfolgreich gelöscht.'
      });
    }
  };

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
    const task = findTaskById(taskId);
    toast({
      title: completed ? 'Task abgeschlossen' : 'Task reaktiviert',
      description: `"${task?.title}" wurde ${completed ? 'als erledigt markiert' : 'reaktiviert'}.`
    });
  };

  const handleAddSubtask = (parent: Task) => {
    setParentTask(parent);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setParentTask(null);
    setIsTaskModalOpen(true);
  };

  const handleViewTaskDetails = (task: Task) => {
    setTaskDetailStack(prev => (selectedTask ? [...prev, selectedTask] : prev));
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const handleTaskDetailBack = () => {
    setTaskDetailStack(prev => {
      const stack = [...prev];
      const parent = stack.pop();
      if (parent) {
        setSelectedTask(parent);
      } else {
        setIsTaskDetailModalOpen(false);
        setSelectedTask(null);
      }
      return stack;
    });
  };

  const flattened = flattenTasks(tasks);

  const tasksByStatus: Record<'todo' | 'inprogress' | 'done', FlattenedTask[]> = {
    todo: [],
    inprogress: [],
    done: []
  };

  flattened.forEach(item => {
    const status = item.task.status as 'todo' | 'inprogress' | 'done';
    tasksByStatus[status].push(item);
  });

  const statuses: Array<'todo' | 'inprogress' | 'done'> = [
    'todo',
    'inprogress',
    'done'
  ];

  const labels: Record<'todo' | 'inprogress' | 'done', string> = {
    todo: 'To Do',
    inprogress: 'In Bearbeitung',
    done: 'Erledigt'
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Kanban" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statuses.map(status => (
              <Droppable droppableId={status} key={status}>
                {provided => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-100 rounded-md p-2 space-y-2 min-h-[200px]"
                  >
                    <h2 className="text-base font-semibold mb-2">
                      {labels[status]}
                    </h2>
                    {tasksByStatus[status].map((item, index) => (
                      <Draggable
                        key={item.task.id}
                        draggableId={item.task.id}
                        index={index}
                      >
                        {prov => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                          >
                            <TaskCard
                              task={item.task}
                              parentPathTitles={item.path.map(p => p.title)}
                              showSubtasks={false}
                              onEdit={handleEditTask}
                              onDelete={handleDeleteTask}
                              onAddSubtask={handleAddSubtask}
                              onToggleComplete={handleToggleTaskComplete}
                              onViewDetails={handleViewTaskDetails}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setParentTask(null);
        }}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask || undefined}
        categories={categories}
        parentTask={parentTask || undefined}
        defaultDueDate={undefined}
      />

      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setSelectedTask(null);
          setTaskDetailStack([]);
        }}
        task={selectedTask}
        category={selectedTask ? categories.find(c => c.id === selectedTask.categoryId) || null : null}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onAddSubtask={handleAddSubtask}
        onToggleComplete={handleToggleTaskComplete}
        onViewDetails={handleViewTaskDetails}
        onStartPomodoro={task => startPomodoro(task.id)}
        canGoBack={taskDetailStack.length > 0}
        onBack={handleTaskDetailBack}
      />
    </div>
  );
};

export default Kanban;

