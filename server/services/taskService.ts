/**
 * Task Service Layer - Business logic for task management
 * Implements proper separation of concerns with validation, error handling, and business rules
 */

import {
  Task,
  CreateTask,
  UpdateTask,
  TaskQuery,
  TaskSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  validateSchema,
} from '../schemas/index.js';
import { loadTasks, saveTasks } from '../repositories/dataRepository.js';
import { notifyClients } from '../lib/sse.js';

// Service error classes
export class TaskServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

export class TaskNotFoundError extends TaskServiceError {
  constructor(taskId: string) {
    super(`Task with ID ${taskId} not found`, 'TASK_NOT_FOUND', 404, { taskId });
  }
}

export class TaskValidationError extends TaskServiceError {
  constructor(message: string, details: any) {
    super(message, 'TASK_VALIDATION_ERROR', 400, details);
  }
}

export class CircularDependencyError extends TaskServiceError {
  constructor(taskId: string, parentId: string) {
    super(
      `Cannot create circular dependency: task ${taskId} cannot be a subtask of ${parentId}`,
      'CIRCULAR_DEPENDENCY',
      400,
      { taskId, parentId }
    );
  }
}

// Task Service class
export class TaskService {
  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all tasks with optional filtering, sorting, and pagination
  async getTasks(query?: Partial<TaskQuery>): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const allTasks = loadTasks();
      let filteredTasks = allTasks;

      // Apply filters
      if (query?.categoryId) {
        filteredTasks = filteredTasks.filter(task => 
          task.categoryId === query.categoryId
        );
      }

      if (query?.status) {
        filteredTasks = filteredTasks.filter(task => 
          task.status === query.status
        );
      }

      if (query?.priority) {
        filteredTasks = filteredTasks.filter(task => 
          task.priority === query.priority
        );
      }

      if (query?.completed !== undefined) {
        filteredTasks = filteredTasks.filter(task => 
          task.completed === query.completed
        );
      }

      if (query?.search) {
        const searchLower = query.search.toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      if (query?.sortBy) {
        const sortField = query.sortBy as keyof Task;
        const sortOrder = query.sortOrder || 'asc';
        
        filteredTasks.sort((a, b) => {
          const aValue = a[sortField];
          const bValue = b[sortField];
          
          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      } else {
        // Default sorting: pinned first, then by order
        filteredTasks.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return a.order - b.order;
        });
      }

      // Apply pagination
      const page = query?.page || 1;
      const limit = query?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
      const total = filteredTasks.length;
      
      return {
        tasks: paginatedTasks,
        total,
        page,
        limit,
        hasNext: endIndex < total,
        hasPrev: page > 1,
      };
    } catch (error) {
      throw new TaskServiceError(
        'Failed to retrieve tasks',
        'TASK_RETRIEVAL_ERROR',
        500,
        { originalError: error }
      );
    }
  }

  // Get task by ID
  async getTaskById(taskId: string): Promise<Task> {
    try {
      const tasks = loadTasks();
      const task = this.findTaskRecursive(tasks, taskId);
      
      if (!task) {
        throw new TaskNotFoundError(taskId);
      }
      
      return task;
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        throw error;
      }
      throw new TaskServiceError(
        'Failed to retrieve task',
        'TASK_RETRIEVAL_ERROR',
        500,
        { taskId, originalError: error }
      );
    }
  }

  // Create new task
  async createTask(taskData: CreateTask): Promise<Task> {
    try {
      // Validate input
      const validatedData = validateSchema(CreateTaskSchema, taskData);
      
      // Generate ID and timestamps
      const now = new Date();
      const newTask: Task = {
        ...validatedData,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
        completed: validatedData.completed ?? false,
        status: validatedData.status ?? 'todo',
        priority: validatedData.priority ?? 'medium',
        pinned: validatedData.pinned ?? false,
        visible: validatedData.visible ?? true,
        subtasks: validatedData.subtasks ?? [],
        order: validatedData.order ?? 0,
      };

      // Business logic validations
      if (newTask.parentId) {
        await this.validateParentChild(newTask.parentId, newTask.id);
      }

      // Auto-adjust order if not specified
      if (validatedData.order === undefined) {
        newTask.order = await this.getNextOrderForCategory(newTask.categoryId);
      }

      // Save to storage
      const tasks = loadTasks();
      
      if (newTask.parentId) {
        // Add as subtask
        this.addSubtaskRecursive(tasks, newTask.parentId, newTask);
      } else {
        // Add as root task
        tasks.push(newTask);
      }
      
      saveTasks(tasks);
      
      // Notify clients
      notifyClients();
      
      return newTask;
    } catch (error) {
      if (error instanceof TaskServiceError) {
        throw error;
      }
      throw new TaskServiceError(
        'Failed to create task',
        'TASK_CREATION_ERROR',
        500,
        { taskData, originalError: error }
      );
    }
  }

  // Update task
  async updateTask(taskId: string, updates: UpdateTask): Promise<Task> {
    try {
      // Validate input
      const validatedUpdates = validateSchema(UpdateTaskSchema, updates);
      
      // Get existing task
      const existingTask = await this.getTaskById(taskId);
      
      // Business logic validations
      if (validatedUpdates.parentId && validatedUpdates.parentId !== existingTask.parentId) {
        await this.validateParentChild(validatedUpdates.parentId, taskId);
      }

      // Merge updates
      const updatedTask: Task = {
        ...existingTask,
        ...validatedUpdates,
        updatedAt: new Date(),
      };

      // Handle status/completion consistency
      if (validatedUpdates.completed !== undefined) {
        updatedTask.status = validatedUpdates.completed ? 'completed' : 'todo';
      }
      if (validatedUpdates.status === 'completed') {
        updatedTask.completed = true;
      } else if (validatedUpdates.status && validatedUpdates.status !== 'completed') {
        updatedTask.completed = false;
      }

      // Update subtasks if completion status changed
      if (validatedUpdates.completed !== undefined && 
          validatedUpdates.completed !== existingTask.completed) {
        this.updateSubtasksCompletion(updatedTask.subtasks, validatedUpdates.completed);
      }

      // Save to storage
      const tasks = loadTasks();
      this.updateTaskRecursive(tasks, taskId, updatedTask);
      saveTasks(tasks);
      
      // Notify clients
      notifyClients();
      
      return updatedTask;
    } catch (error) {
      if (error instanceof TaskServiceError) {
        throw error;
      }
      throw new TaskServiceError(
        'Failed to update task',
        'TASK_UPDATE_ERROR',
        500,
        { taskId, updates, originalError: error }
      );
    }
  }

  // Delete task
  async deleteTask(taskId: string): Promise<void> {
    try {
      // Verify task exists
      await this.getTaskById(taskId);
      
      // Remove from storage
      const tasks = loadTasks();
      const filtered = this.removeTaskRecursive(tasks, taskId);
      saveTasks(filtered);
      
      // Notify clients
      notifyClients();
    } catch (error) {
      if (error instanceof TaskServiceError) {
        throw error;
      }
      throw new TaskServiceError(
        'Failed to delete task',
        'TASK_DELETION_ERROR',
        500,
        { taskId, originalError: error }
      );
    }
  }

  // Bulk operations
  async bulkUpdateTasks(taskIds: string[], updates: Partial<UpdateTask>): Promise<Task[]> {
    try {
      const validatedUpdates = validateSchema(UpdateTaskSchema.partial(), updates);
      const updatedTasks: Task[] = [];
      
      for (const taskId of taskIds) {
        const updatedTask = await this.updateTask(taskId, validatedUpdates);
        updatedTasks.push(updatedTask);
      }
      
      return updatedTasks;
    } catch (error) {
      throw new TaskServiceError(
        'Failed to bulk update tasks',
        'BULK_UPDATE_ERROR',
        500,
        { taskIds, updates, originalError: error }
      );
    }
  }

  async bulkDeleteTasks(taskIds: string[]): Promise<void> {
    try {
      for (const taskId of taskIds) {
        await this.deleteTask(taskId);
      }
    } catch (error) {
      throw new TaskServiceError(
        'Failed to bulk delete tasks',
        'BULK_DELETE_ERROR',
        500,
        { taskIds, originalError: error }
      );
    }
  }

  // Utility methods
  private findTaskRecursive(tasks: Task[], taskId: string): Task | null {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }
      const found = this.findTaskRecursive(task.subtasks, taskId);
      if (found) return found;
    }
    return null;
  }

  private updateTaskRecursive(tasks: Task[], taskId: string, updatedTask: Task): boolean {
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) {
        tasks[i] = updatedTask;
        return true;
      }
      if (this.updateTaskRecursive(tasks[i].subtasks, taskId, updatedTask)) {
        return true;
      }
    }
    return false;
  }

  private removeTaskRecursive(tasks: Task[], taskId: string): Task[] {
    return tasks
      .filter(task => task.id !== taskId)
      .map(task => ({
        ...task,
        subtasks: this.removeTaskRecursive(task.subtasks, taskId),
      }));
  }

  private addSubtaskRecursive(tasks: Task[], parentId: string, subtask: Task): boolean {
    for (const task of tasks) {
      if (task.id === parentId) {
        task.subtasks.push(subtask);
        return true;
      }
      if (this.addSubtaskRecursive(task.subtasks, parentId, subtask)) {
        return true;
      }
    }
    return false;
  }

  private async validateParentChild(parentId: string, childId: string): Promise<void> {
    // Check if parent exists
    await this.getTaskById(parentId);
    
    // Check for circular dependency
    const tasks = loadTasks();
    if (this.wouldCreateCycle(tasks, parentId, childId)) {
      throw new CircularDependencyError(childId, parentId);
    }
  }

  private wouldCreateCycle(tasks: Task[], parentId: string, childId: string): boolean {
    const parent = this.findTaskRecursive(tasks, parentId);
    if (!parent) return false;
    
    // Check if childId is an ancestor of parentId
    return this.isAncestor(tasks, childId, parentId);
  }

  private isAncestor(tasks: Task[], ancestorId: string, descendantId: string): boolean {
    const descendant = this.findTaskRecursive(tasks, descendantId);
    if (!descendant?.parentId) return false;
    
    if (descendant.parentId === ancestorId) return true;
    return this.isAncestor(tasks, ancestorId, descendant.parentId);
  }

  private async getNextOrderForCategory(categoryId?: string): Promise<number> {
    const { tasks } = await this.getTasks({ categoryId });
    const rootTasks = tasks.filter(task => !task.parentId);
    return rootTasks.length > 0 ? Math.max(...rootTasks.map(t => t.order)) + 1 : 0;
  }

  private updateSubtasksCompletion(subtasks: Task[], completed: boolean): void {
    subtasks.forEach(subtask => {
      subtask.completed = completed;
      subtask.status = completed ? 'completed' : 'todo';
      subtask.updatedAt = new Date();
      this.updateSubtasksCompletion(subtask.subtasks, completed);
    });
  }
}

// Export singleton instance
export const taskService = new TaskService();
