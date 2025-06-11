import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/hooks/useSettings';
import { allHomeSections, HomeSection } from '@/utils/homeSections';
import TaskCard from '@/components/TaskCard';
import { useTaskStore } from '@/hooks/useTaskStore';
import NoteCard from '@/components/NoteCard';
import { flattenTasks } from '@/utils/taskUtils';

const Home: React.FC = () => {
  const { notes, tasks } = useTaskStore();
  const {
    homeSections,
    homeSectionOrder,
    showPinnedTasks,
    showPinnedNotes
  } = useSettings();

  const orderedSections: HomeSection[] = homeSectionOrder
    .map(key => allHomeSections.find(s => s.key === key))
    .filter((s): s is HomeSection => Boolean(s && homeSections.includes(s.key)));

  const pinnedNotes = useMemo(
    () => notes.filter(n => n.pinned).sort((a, b) => a.order - b.order).slice(0, 3),
    [notes]
  );
  const pinnedTasks = useMemo(
    () =>
      flattenTasks(tasks)
        .filter(item => item.task.pinned)
        .sort((a, b) => a.task.order - b.task.order)
        .slice(0, 3),
    [tasks]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {orderedSections.map(sec => (
            <div key={sec.key}>
              <Link to={sec.path}>
                <Card className="hover:shadow-md transition-all text-center">
                  <CardContent className="py-8">
                    <sec.icon className="h-8 w-8 mx-auto mb-2" />
                    <CardTitle>{sec.label}</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
        {showPinnedTasks && pinnedTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              Gepinnte Tasks
            </h2>
            <div className="space-y-3">
              {pinnedTasks.map(item => (
                <Link
                  key={item.task.id}
                  to={`/tasks?taskId=${item.task.id}`}
                  className="block"
                >
                  <TaskCard
                    task={item.task}
                    parentPathTitles={item.path.map(p => p.title)}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onAddSubtask={() => {}}
                    onToggleComplete={() => {}}
                    onViewDetails={() => {}}
                    showSubtasks={false}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {showPinnedNotes && pinnedNotes.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              Gepinnte Notizen
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pinnedNotes.map(note => (
                <Link
                  key={note.id}
                  to={`/notes?noteId=${note.id}`}
                  className="block"
                >
                  <NoteCard note={note} onClick={() => {}} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
