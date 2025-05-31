import { Priority, Task, TaskStatus } from '../../models/types';
import { IBaseRepository, QueryOptions } from './IBaseRepository';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  projectId?: string;
  dueDateBefore?: Date;
  dueDateAfter?: Date;
  isCompleted?: boolean;
  searchQuery?: string;
}

export interface TaskQueryOptions extends QueryOptions {
  filters?: TaskFilters;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  due_date?: string;
  project_id?: string;
  parent_task_id?: string;
  depends_on_task_id?: string;
  estimated_duration_minutes?: number;
  is_recurring: number;
  recurrence_rule?: string;
  sort_order: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  due_date?: string;
  completed_at?: string;
  project_id?: string;
  parent_task_id?: string;
  depends_on_task_id?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  is_recurring?: number;
  recurrence_rule?: string;
  sort_order?: number;
}

export interface ITaskRepository extends IBaseRepository<Task, CreateTaskData> {
  findByStatus(status: TaskStatus): Promise<Task[]>;
  findByPriority(priority: Priority): Promise<Task[]>;
  findByProject(projectId: string): Promise<Task[]>;
  findCompleted(limit?: number): Promise<Task[]>;
  findOverdue(): Promise<Task[]>;
  findToday(): Promise<Task[]>;
  findActive(): Promise<Task[]>;
  findSubTasks(parentTaskId: string): Promise<Task[]>;
  findDependentTasks(taskId: string): Promise<Task[]>;
  findRecurring(): Promise<Task[]>;
  search(query: string, options?: TaskQueryOptions): Promise<Task[]>;
  markCompleted(id: string): Promise<Task | null>;
  markIncomplete(id: string): Promise<Task | null>;
  updatePriority(id: string, priority: Priority): Promise<Task | null>;
  updateStatus(id: string, status: TaskStatus): Promise<Task | null>;
  getStatsByStatus(): Promise<Array<{ status: string; count: number }>>;
  getStatsByProject(): Promise<Array<{ project_id: string; count: number }>>;
} 