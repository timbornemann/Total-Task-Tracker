import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useSettings } from '@/hooks/useSettings';
import { Task } from '@/types';
import {
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  Timer,
  Star,
  StarOff
} from 'lucide-react';
import {
  calculateTaskCompletion,
  getTaskProgress,
  getPriorityColor,
  getPriorityIcon
} from '@/utils/taskUtils';
import { complementaryColor, adjustColor, isColorDark, hslToHex } from '@/utils/color';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    tasks,
    categories,
    updateTask,
    deleteTask,
    addTask
  } = useTaskStore();
  const { colorPalette, theme } = useSettings();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const task = tasks.find(t => t.id === taskId) || null;
  const category = task ? categories.find(c => c.id === task.categoryId) || null : null;

  if (!task) return <div className="p-4">{t('taskDetail.notFound')}</div>;

  const isCompleted = calculateTaskCompletion(task);
  const progress = getTaskProgress(task);
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const priorityClasses = getPriorityColor(task.priority);
  const priorityIcon = getPriorityIcon(task.priority);
  const cardHex = hslToHex(theme.card);
  const progressBg = isColorDark(cardHex) ? adjustColor(cardHex, 50) : adjustColor(cardHex, -20);
  const progressColor = complementaryColor(cardHex);

  const handleTogglePinned = () => {
    updateTask(task.id, { pinned: !task.pinned });
  };

  const handleToggleComplete = () => {
    if (task.subtasks.length === 0) {
      updateTask(task.id, { completed: !task.completed });
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('task.deleteConfirm', { title: task.title }))) {
      deleteTask(task.id);
      navigate(-1);
    }
  };

  const handleAddSubtask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEdit = () => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleStartPomodoro = () => {
    navigate(`/pomodoro?taskId=${task.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={task.title} onHomeClick={() => navigate('/tasks')} />
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('common.back')}
        </Button>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {task.subtasks.length === 0 && (
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={handleToggleComplete}
                  className="mt-1 h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
              )}
              <div className="flex-1">
                <h1 className={`text-xl font-bold ${isCompleted ? 'line-through text-gray-500' : ''}`}>{task.title}</h1>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge className={`text-sm px-3 py-1 border ${priorityClasses}`}>{priorityIcon} {task.priority.toUpperCase()}</Badge>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" style={{ backgroundColor: colorPalette[task.color] }} />
                    <span className="text-sm text-gray-600">{category?.name || t('taskDetail.unknownCategory')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleTogglePinned}>
                {task.pinned ? <Star className="h-4 w-4 mr-2" /> : <StarOff className="h-4 w-4 mr-2" />}
                {task.pinned ? t('taskDetail.unpin') : t('taskDetail.pin')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddSubtask}>
                <Plus className="h-4 w-4 mr-2" />
                {t('taskDetail.addSubtask')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleStartPomodoro}>
                <Timer className="h-4 w-4 mr-2" />
                {t('navbar.pomodoro')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive/80">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {task.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('taskDetail.description')}</h3>
                  <p className="text-gray-700 leading-relaxed">{task.description}</p>
                </div>
              )}

              {task.subtasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {t('taskDetail.subtasks', { count: task.subtasks.length })}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {t('taskDetail.progressInfo', { completed: progress.completed, total: progress.total })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{t('taskDetail.totalProgress')}</span>
                      <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" backgroundColor={progressBg} indicatorColor={progressColor} />
                  </div>

                  <div className="space-y-3">
                    {task.subtasks.map(subtask => (
                      <TaskCard
                        key={subtask.id}
                        task={subtask}
                        onEdit={() => navigate(`/tasks/${subtask.id}`)}
                        onDelete={deleteTask}
                        onAddSubtask={() => {
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                        }}
                        onToggleComplete={(id, completed) => updateTask(id, { completed })}
                        onViewDetails={st => navigate(`/tasks/${st.id}`)}
                        depth={0}
                      />
                    ))}
                  </div>
                </div>
              )}

              {task.subtasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('taskDetail.noSubtasks')}</p>
                  <Button variant="outline" size="sm" onClick={handleAddSubtask} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('taskDetail.addFirst')}
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">{t('taskDetail.created')}</span>{' '}
                    {new Date(task.createdAt).toLocaleDateString(i18n.language)}
                  </div>
                  <div>
                    <span className="font-medium">{t('taskDetail.updated')}</span>{' '}
                    {new Date(task.updatedAt).toLocaleDateString(i18n.language)}
                  </div>
                  {task.dueDate && (
                    <div>
                      <span className="font-medium">{t('taskDetail.due')}</span>{' '}
                      {new Date(task.dueDate).toLocaleDateString(i18n.language)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={data => {
          if (editingTask) {
            updateTask(editingTask.id, data);
          } else {
            addTask({ ...data, parentId: task.id });
          }
        }}
        task={editingTask || undefined}
        categories={categories}
        parentTask={editingTask ? undefined : task}
        defaultDueDate={undefined}
        allowRecurring={false}
      />
    </div>
  );
};

export default TaskDetailPage;
