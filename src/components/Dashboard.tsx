
import React, { useState } from 'react';
import { Task, Category, TaskFormData, CategoryFormData } from '@/types';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, LayoutGrid, List, BarChart3, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import CategoryCard from './CategoryCard';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import CategoryModal from './CategoryModal';
import TaskDetailModal from './TaskDetailModal';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    addCategory,
    updateCategory,
    deleteCategory,
    getTasksByCategory,
    findTaskById
  } = useTaskStore();

  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'tasks'>('categories');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);

  // Filter categories and tasks based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = selectedCategory 
    ? getTasksByCategory(selectedCategory.id).filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Statistics
  const totalTasks = tasks.length;
  const totalCategories = categories.length;
  const completedTasks = tasks.filter(task => {
    const hasSubtasks = task.subtasks.length > 0;
    if (hasSubtasks) {
      return task.subtasks.every(subtask => subtask.completed);
    }
    return task.completed;
  }).length;

  // Handlers
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

  const handleCreateCategory = (categoryData: CategoryFormData) => {
    addCategory(categoryData);
    toast({
      title: 'Kategorie erstellt',
      description: `"${categoryData.name}" wurde erfolgreich erstellt.`
    });
  };

  const handleUpdateCategory = (categoryData: CategoryFormData) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
      toast({
        title: 'Kategorie aktualisiert',
        description: `"${categoryData.name}" wurde erfolgreich aktualisiert.`
      });
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && window.confirm(`Sind Sie sicher, dass Sie "${category.name}" löschen möchten?`)) {
      deleteCategory(categoryId);
      toast({
        title: 'Kategorie gelöscht',
        description: 'Die Kategorie wurde erfolgreich gelöscht.'
      });
    }
  };

  const handleViewCategoryTasks = (category: Category) => {
    setSelectedCategory(category);
    setViewMode('tasks');
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
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setViewMode('categories');
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Task Tracker</h1>
              {selectedCategory && (
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-gray-500">/</span>
                  <div className="flex items-center space-x-2 min-w-0">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: selectedCategory.color }}
                    />
                    <span className="font-medium text-gray-700 truncate">{selectedCategory.name}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={viewMode === 'categories' ? 'Kategorien suchen...' : 'Tasks suchen...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-48 lg:w-64"
                />
              </div>

              {/* Statistics Button */}
              <Link to="/statistics">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Statistiken
                </Button>
              </Link>

              {/* Action Buttons */}
              {viewMode === 'categories' ? (
                <Button onClick={() => setIsCategoryModalOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Kategorie
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleBackToCategories} size="sm">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Kategorien
                  </Button>
                  <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Task
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="sm:hidden pb-4 space-y-3">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={viewMode === 'categories' ? 'Kategorien suchen...' : 'Tasks suchen...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Mobile Actions */}
              <div className="flex flex-wrap gap-2">
                <Link to="/statistics" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistiken
                  </Button>
                </Link>

                {viewMode === 'categories' ? (
                  <Button onClick={() => setIsCategoryModalOpen(true)} size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Kategorie
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleBackToCategories} size="sm" className="flex-1">
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Kategorien
                    </Button>
                    <Button onClick={() => setIsTaskModalOpen(true)} size="sm" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Task
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Category Breadcrumb */}
              {selectedCategory && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">In:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedCategory.color }}
                    />
                    <span className="font-medium text-gray-700">{selectedCategory.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gesamt Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Abgeschlossen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-xs sm:text-sm text-gray-500">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% erledigt
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Kategorien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalCategories}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {viewMode === 'categories' ? (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Kategorien</h2>
              <Badge variant="secondary">{filteredCategories.length} Kategorien</Badge>
            </div>
            
            {filteredCategories.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <LayoutGrid className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Keine Kategorien gefunden' : 'Keine Kategorien vorhanden'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Versuchen Sie einen anderen Suchbegriff.'
                      : 'Erstellen Sie Ihre erste Kategorie, um mit der Organisation Ihrer Tasks zu beginnen.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsCategoryModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Kategorie erstellen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredCategories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    tasks={getTasksByCategory(category.id)}
                    onEdit={category => {
                      setEditingCategory(category);
                      setIsCategoryModalOpen(true);
                    }}
                    onDelete={handleDeleteCategory}
                    onViewTasks={handleViewCategoryTasks}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tasks</h2>
              <Badge variant="secondary">{filteredTasks.length} Tasks</Badge>
            </div>
            
            {filteredTasks.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <List className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Keine Tasks gefunden' : 'Keine Tasks vorhanden'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Versuchen Sie einen anderen Suchbegriff.'
                      : `Erstellen Sie Ihre erste Task in der Kategorie "${selectedCategory?.name}".`
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Task erstellen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    onToggleComplete={handleToggleTaskComplete}
                    onViewDetails={handleViewTaskDetails}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        category={editingCategory || undefined}
      />

      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        category={selectedTask ? categories.find(c => c.id === selectedTask.categoryId) || null : null}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onAddSubtask={handleAddSubtask}
        onToggleComplete={handleToggleTaskComplete}
        onViewDetails={handleViewTaskDetails}
      />
    </div>
  );
};

export default Dashboard;
