
import { useMemo } from 'react';
import { useTaskStore } from './useTaskStore';
import { TaskStats, Task } from '@/types';
import i18n from '@/lib/i18n';

export const useStatistics = (): TaskStats => {
  const { tasks, categories } = useTaskStore();

  return useMemo(() => {
    const allTasks: Task[] = [];

    // Flatten all tasks including subtasks
    const flattenTasks = (taskList: Task[]) => {
      taskList.forEach(task => {
        allTasks.push(task);
        if (task.subtasks && task.subtasks.length > 0) {
          flattenTasks(task.subtasks);
        }
      });
    };
    
    flattenTasks(tasks);

    const statsTasks = allTasks.filter(
      task => !(task.recurringId && task.visible === false)
    );

    const totalTasks = statsTasks.length;
    const completedTasks = statsTasks.filter(task => task.completed).length;
    const pendingTasks = statsTasks.filter(task => !task.completed).length;
    const recurringTasks = statsTasks.filter(task => task.isRecurring).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const tasksCompletedLast7Days = statsTasks.filter(task => {
      if (!task.completed) return false;
      const updated = task.lastCompleted || task.updatedAt;
      return new Date(updated) >= weekAgo;
    }).length;
    const tasksCreatedLast7Days = statsTasks.filter(task => new Date(task.createdAt) >= weekAgo).length;
    

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = statsTasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < today;

    }).length;

    // Tasks by priority
    const tasksByPriority = {
      high: statsTasks.filter(task => task.priority === 'high').length,
      medium: statsTasks.filter(task => task.priority === 'medium').length,
      low: statsTasks.filter(task => task.priority === 'low').length,
    };

    // Tasks by category
    const tasksByCategory = categories.map(category => {
      const categoryTasks = statsTasks.filter(task => task.categoryId === category.id);
      return {
        categoryId: category.id,
        categoryName: category.name,
        count: categoryTasks.length,
        completed: categoryTasks.filter(task => task.completed).length,
      };
    });

    // Completion trend (last 7 days)
    const completionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // For now, simulate data - in a real app you'd track actual completion dates
      const dayTasks = statsTasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      });
      
      const locale = i18n.language === 'de' ? 'de-DE' : 'en-US'
      completionTrend.push({
        date: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        completed: dayTasks.filter(task => task.completed).length,
        created: dayTasks.length,
      });
    }

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      tasksCompletedLast7Days,
      tasksCreatedLast7Days,
      overdueTasks,
      tasksByPriority,
      tasksByCategory,
      completionTrend,
      recurringTasks,
    };
  }, [tasks, categories]);
};
