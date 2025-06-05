import React from 'react';
import { Link } from 'react-router-dom';
import { useTaskStore } from '@/hooks/useTaskStore';
import TaskCard from '@/components/TaskCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';

const Kanban: React.FC = () => {
  const { tasks, updateTask } = useTaskStore();

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

  const tasksByStatus: Record<'todo' | 'inprogress' | 'done', typeof tasks> = {
    todo: [],
    inprogress: [],
    done: []
  };

  tasks
    .filter(t => !t.parentId)
    .forEach(t => {
      const status = t.status as 'todo' | 'inprogress' | 'done';
      tasksByStatus[status].push(t);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Zurück</span>
                </Button>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Kanban</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

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
                    {tasksByStatus[status].map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {prov => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              onEdit={() => {}}
                              onDelete={() => {}}
                              onAddSubtask={() => {}}
                              onToggleComplete={() => {}}
                              onViewDetails={() => {}}
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
    </div>
  );
};

export default Kanban;

