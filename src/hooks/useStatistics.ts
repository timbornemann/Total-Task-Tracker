
import { useMemo } from 'react';
import { useTaskStore } from './useTaskStore';
import { TaskStats } from '@/types';

export const useStatistics = (): TaskStats => {
  const { tasks, categories } = useTaskStore();

  return useMemo(() => {
    const allTasks: any[] = [];
    
    // Flatten all tasks including subtasks
    const flattenTasks = (taskList: any[]) => {
      taskList.forEach(task => {
        allTasks.push(task);
        if (task.subtasks && task.subtasks.length > 0) {
          flattenTasks(task.subtasks);
        }
      });
    };
    
    flattenTasks(tasks);

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.completed).length;
    const recurringTasks = allTasks.filter(task => task.isRecurring).length;
    
    // Calculate overdue tasks (for now, just incomplete tasks)
    const overdueTasks = allTasks.filter(task => !task.completed).length;

    // Tasks by priority
    const tasksByPriority = {
      high: allTasks.filter(task => task.priority === 'high').length,
      medium: allTasks.filter(task => task.priority === 'medium').length,
      low: allTasks.filter(task => task.priority === 'low').length,
    };

    // Tasks by category
    const tasksByCategory = categories.map(category => {
      const categoryTasks = allTasks.filter(task => task.categoryId === category.id);
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
      const dayTasks = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      });
      
      completionTrend.push({
        date: date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
        completed: dayTasks.filter(task => task.completed).length,
        created: dayTasks.length,
      });
    }

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByPriority,
      tasksByCategory,
      completionTrend,
      recurringTasks,
    };
  }, [tasks, categories]);
};
