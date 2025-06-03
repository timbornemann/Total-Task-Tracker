
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  completed: boolean;
  categoryId: string;
  parentId?: string;
  subtasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  categoryId: string;
  parentId?: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}
