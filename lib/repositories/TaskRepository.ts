import { TaskDAO } from '../database/task-dao';
import { Priority, Task, TaskStatus } from '../models/types';
import { QueryOptions } from './interfaces/IBaseRepository';
import { CreateTaskData, ITaskRepository, TaskQueryOptions, UpdateTaskData } from './interfaces/ITaskRepository';

export class TaskRepository implements ITaskRepository {
  constructor(private taskDAO: TaskDAO) {}

  async findById(id: string): Promise<Task | null> {
    return await this.taskDAO.findById(id);
  }

  async findAll(options?: QueryOptions): Promise<Task[]> {
    if (!options) {
      return await this.taskDAO.findAll();
    }

    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = options;
    
    // 构建排序字符串
    const orderBy = `${sortBy} ${sortOrder.toUpperCase()}`;
    
    // 如果需要分页，使用offset
    if (page && limit) {
      const offset = (page - 1) * limit;
      // 注意：这里需要TaskDAO支持分页查询，可能需要扩展现有方法
      return await this.taskDAO.findAll(orderBy);
    }
    
    return await this.taskDAO.findAll(orderBy);
  }

  async create(data: CreateTaskData): Promise<Task> {
    return await this.taskDAO.create(data);
  }

  async update(id: string, data: Partial<UpdateTaskData>): Promise<Task | null> {
    return await this.taskDAO.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return await this.taskDAO.softDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.taskDAO.exists(id);
  }

  async count(filters?: Record<string, any>): Promise<number> {
    return await this.taskDAO.count(filters);
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return await this.taskDAO.findByStatus(status);
  }

  async findByPriority(priority: Priority): Promise<Task[]> {
    return await this.taskDAO.findByPriority(priority);
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return await this.taskDAO.findByProjectId(projectId);
  }

  async findCompleted(limit?: number): Promise<Task[]> {
    return await this.taskDAO.findCompletedTasks(limit);
  }

  async findOverdue(): Promise<Task[]> {
    return await this.taskDAO.findOverdueTasks();
  }

  async findToday(): Promise<Task[]> {
    return await this.taskDAO.findTodayTasks();
  }

  async findActive(): Promise<Task[]> {
    return await this.taskDAO.findActiveTasks();
  }

  async findSubTasks(parentTaskId: string): Promise<Task[]> {
    return await this.taskDAO.findSubTasks(parentTaskId);
  }

  async findDependentTasks(taskId: string): Promise<Task[]> {
    return await this.taskDAO.findDependentTasks(taskId);
  }

  async findRecurring(): Promise<Task[]> {
    return await this.taskDAO.findRecurringTasks();
  }

  async search(query: string, options?: TaskQueryOptions): Promise<Task[]> {
    return await this.taskDAO.searchTasks(query);
  }

  async markCompleted(id: string): Promise<Task | null> {
    return await this.taskDAO.markCompleted(id);
  }

  async markIncomplete(id: string): Promise<Task | null> {
    return await this.taskDAO.markIncomplete(id);
  }

  async updatePriority(id: string, priority: Priority): Promise<Task | null> {
    return await this.taskDAO.updatePriority(id, priority);
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    return await this.taskDAO.updateStatus(id, status);
  }

  async getStatsByStatus(): Promise<Array<{ status: string; count: number }>> {
    return await this.taskDAO.getTaskCountByStatus();
  }

  async getStatsByProject(): Promise<Array<{ project_id: string; count: number }>> {
    return await this.taskDAO.getTaskCountByProject();
  }
} 