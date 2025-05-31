import DatabaseManager from '../database/manager';
import { CompletedTaskFilters } from '../database/task-dao';
import { CreateTaskForm, Priority, Task, TaskDTO, TaskStatus } from '../models/types';
import { formatDisplayTime } from '../utils/date';
import { DatabaseService } from './database-service';

// 数据同步回调类型
type DataSyncCallback = () => void;

// 任务筛选条件接口
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  projectId?: string;
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
  hasDeadline?: boolean;
  isOverdue?: boolean;
}

// 已完成任务分页查询结果接口
export interface PaginatedCompletedTasksResult {
  tasks: TaskDTO[];
  hasMore: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
}

// 已完成任务统计信息接口
export interface CompletedTasksStatistics {
  totalCompleted: number;
  todayCompleted: number;
  weekCompleted: number;
  monthCompleted: number;
  completionTrend: Array<{ date: string; count: number }>;
  topProjects: Array<{ projectName: string; count: number }>;
  averageCompletionTime?: number; // 平均完成用时（分钟）
}

// 任务统计接口
export interface TaskStatistics {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byProject: Array<{
    projectId: string;
    projectName: string;
    count: number;
  }>;
}

// 生产力报告接口
export interface ProductivityReport {
  dateRange: {
    start: Date;
    end: Date;
  };
  completedTasks: number;
  averageCompletionTime: number; // 小时
  productivityTrend: Array<{
    date: string;
    completed: number;
  }>;
  topProjects: Array<{
    projectName: string;
    completedTasks: number;
  }>;
}

/**
 * 任务服务类
 * 提供任务相关的业务逻辑和数据操作
 */
export class TaskService {
  private static instance: TaskService;
  private dbService: DatabaseService;
  // 数据同步回调函数
  private dataSyncCallback: DataSyncCallback | null = null;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  /**
   * 设置数据同步回调
   */
  public setDataSyncCallback(callback: DataSyncCallback | null): void {
    this.dataSyncCallback = callback;
  }

  /**
   * 触发数据同步通知
   */
  private notifyDataChange(): void {
    if (this.dataSyncCallback) {
      console.log('[TaskService] 通知数据变更');
      this.dataSyncCallback();
    }
  }

  /**
   * 初始化服务
   */
  public async init(): Promise<void> {
    await this.dbService.init();
  }

  /**
   * 创建新任务
   */
  public async createTask(formData: CreateTaskForm): Promise<TaskDTO> {
    // 查找或创建项目
    let projectId: string | undefined;
    if (formData.category && formData.category !== '默认清单') {
      // 首先尝试按ID查找项目
      const projectById = await this.dbService.projectDAO.findById(formData.category);
      if (projectById) {
        projectId = projectById.id;
      } else {
        // 如果不是有效ID，则按名称搜索
        const projects = await this.dbService.projectDAO.searchByName(formData.category);
        if (projects.length > 0) {
          projectId = projects[0].id;
        } else {
          // 创建新项目
          const newProject = await this.dbService.projectDAO.createProject({
            name: formData.category,
            sort_order: 0,
            is_shared: 0
          });
          projectId = newProject.id;
        }
      }
    }

    const task = await this.dbService.taskDAO.create({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      due_date: formData.due_date?.toISOString(),
      project_id: projectId,
      is_recurring: 0,
      sort_order: 0
    });

    this.notifyDataChange();
    return await this.convertToDTO(task);
  }

  /**
   * 获取今天的任务
   */
  public async getTodayTasks(): Promise<TaskDTO[]> {
    const tasks = await this.dbService.taskDAO.findTodayTasks();
    return await Promise.all(tasks.map(task => this.convertToDTO(task)));
  }

  /**
   * 获取活跃的任务（未完成）
   */
  public async getActiveTasks(): Promise<TaskDTO[]> {
    const tasks = await this.dbService.taskDAO.findActiveTasks();
    return await Promise.all(tasks.map(task => this.convertToDTO(task)));
  }

  /**
   * 获取已完成的任务
   */
  public async getCompletedTasks(limit?: number): Promise<TaskDTO[]> {
    const tasks = await this.dbService.taskDAO.findCompletedTasks(limit);
    return await Promise.all(tasks.map(task => this.convertToDTO(task)));
  }

  /**
   * 获取逾期任务
   */
  public async getOverdueTasks(): Promise<TaskDTO[]> {
    const tasks = await this.dbService.taskDAO.findOverdueTasks();
    return await Promise.all(tasks.map(task => this.convertToDTO(task)));
  }

  /**
   * 根据ID获取任务
   */
  public async getTaskById(id: string): Promise<TaskDTO | null> {
    const task = await this.dbService.taskDAO.findById(id);
    if (!task) return null;
    return await this.convertToDTO(task);
  }

  /**
   * 更新任务
   */
  public async updateTask(id: string, updates: Partial<Task>): Promise<TaskDTO | null> {
    const task = await this.dbService.taskDAO.update(id, updates);
    if (!task) return null;
    this.notifyDataChange();
    return await this.convertToDTO(task);
  }

  /**
   * 切换任务完成状态
   */
  public async toggleTaskCompletion(id: string): Promise<TaskDTO | null> {
    const currentTask = await this.dbService.taskDAO.findById(id);
    if (!currentTask) return null;

    const isCompleted = currentTask.status === 'completed';
    const task = isCompleted 
      ? await this.dbService.taskDAO.markIncomplete(id)
      : await this.dbService.taskDAO.markCompleted(id);

    if (!task) return null;
    this.notifyDataChange();
    return await this.convertToDTO(task);
  }

  /**
   * 更新任务状态
   */
  public async updateTaskStatus(id: string, status: TaskStatus): Promise<TaskDTO | null> {
    const task = await this.dbService.taskDAO.updateStatus(id, status);
    if (!task) return null;
    this.notifyDataChange();
    return await this.convertToDTO(task);
  }

  /**
   * 更新任务优先级
   */
  public async updateTaskPriority(id: string, priority: Priority): Promise<TaskDTO | null> {
    const task = await this.dbService.taskDAO.updatePriority(id, priority);
    if (!task) return null;
    this.notifyDataChange();
    return await this.convertToDTO(task);
  }

  /**
   * 删除任务
   */
  public async deleteTask(id: string): Promise<boolean> {
    const result = await this.dbService.taskDAO.softDelete(id);
    this.notifyDataChange();
    return result;
  }

  /**
   * 根据项目获取任务
   */
  public async getTasksByProject(projectId: string): Promise<TaskDTO[]> {
    const tasks = await this.dbService.taskDAO.findByProjectId(projectId);
    return await Promise.all(tasks.map(task => this.convertToDTO(task)));
  }

  /**
   * 搜索任务
   */
  public async searchTasks(query: string, filters?: TaskFilters): Promise<TaskDTO[]> {
    try {
      const dbManager = DatabaseManager.getInstance();
      let sql = `
        SELECT t.* FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.is_deleted_locally = 0
      `;
      const params: any[] = [];

      // 添加搜索条件
      if (query.trim()) {
        sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
        const searchPattern = `%${query.trim()}%`;
        params.push(searchPattern, searchPattern);
      }

      // 添加筛选条件
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          const placeholders = filters.status.map(() => '?').join(',');
          sql += ` AND t.status IN (${placeholders})`;
          params.push(...filters.status);
        }

        if (filters.priority && filters.priority.length > 0) {
          const priorityNumbers = filters.priority.map(p => 
            p === 'low' ? 0 : p === 'medium' ? 1 : 2
          );
          const placeholders = priorityNumbers.map(() => '?').join(',');
          sql += ` AND t.priority IN (${placeholders})`;
          params.push(...priorityNumbers);
        }

        if (filters.projectId) {
          sql += ` AND t.project_id = ?`;
          params.push(filters.projectId);
        }

        if (filters.dueDateRange) {
          if (filters.dueDateRange.start) {
            sql += ` AND t.due_date >= ?`;
            params.push(filters.dueDateRange.start.toISOString());
          }
          if (filters.dueDateRange.end) {
            sql += ` AND t.due_date <= ?`;
            params.push(filters.dueDateRange.end.toISOString());
          }
        }

        if (filters.hasDeadline !== undefined) {
          if (filters.hasDeadline) {
            sql += ` AND t.due_date IS NOT NULL`;
          } else {
            sql += ` AND t.due_date IS NULL`;
          }
        }

        if (filters.isOverdue) {
          const now = new Date().toISOString();
          sql += ` AND t.due_date < ? AND t.status NOT IN ('completed', 'cancelled')`;
          params.push(now);
        }
      }

      sql += ` ORDER BY t.priority DESC, t.due_date ASC, t.created_at DESC`;

      const tasks = await dbManager.getAllAsync<Task>(sql, params);
      return Promise.all(tasks.map((task: Task) => this.convertToDTO(task)));
    } catch (error) {
      console.error('搜索任务失败:', error);
      throw new Error('搜索任务失败');
    }
  }

  /**
   * 按筛选条件获取任务
   */
  public async getTasksByFilters(filters: TaskFilters): Promise<TaskDTO[]> {
    return this.searchTasks('', filters);
  }

  /**
   * 获取任务统计信息
   */
  public async getTaskStatistics(): Promise<TaskStatistics> {
    try {
      const dbManager = DatabaseManager.getInstance();
      
      // 基本统计
      const totalResult = await dbManager.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0'
      );

      const completedResult = await dbManager.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 AND status = \'completed\''
      );

      const inProgressResult = await dbManager.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 AND status = \'in_progress\''
      );

      const now = new Date().toISOString();
      const overdueResult = await dbManager.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 AND due_date < ? AND status NOT IN (\'completed\', \'cancelled\')',
        [now]
      );

      // 按优先级统计
      const priorityStats = await dbManager.getAllAsync<{ priority: number; count: number }>(
        'SELECT priority, COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 GROUP BY priority'
      );

      const byPriority = { high: 0, medium: 0, low: 0 };
      priorityStats.forEach((stat: { priority: number; count: number }) => {
        if (stat.priority === 2) byPriority.high = stat.count;
        else if (stat.priority === 1) byPriority.medium = stat.count;
        else byPriority.low = stat.count;
      });

      // 按项目统计
      const projectStats = await dbManager.getAllAsync<{ 
        project_id: string; 
        project_name: string; 
        count: number 
      }>(
        `SELECT 
          t.project_id, 
          COALESCE(p.name, '默认项目') as project_name,
          COUNT(*) as count 
         FROM tasks t 
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.is_deleted_locally = 0 
         GROUP BY t.project_id, p.name`
      );

      const byProject = projectStats.map((stat: { project_id: string; project_name: string; count: number }) => ({
        projectId: stat.project_id || 'default',
        projectName: stat.project_name,
        count: stat.count
      }));

      return {
        total: totalResult?.count || 0,
        completed: completedResult?.count || 0,
        inProgress: inProgressResult?.count || 0,
        overdue: overdueResult?.count || 0,
        byPriority,
        byProject
      };
    } catch (error) {
      console.error('获取任务统计失败:', error);
      throw new Error('获取任务统计失败');
    }
  }

  /**
   * 批量更新任务排序
   */
  public async updateTasksOrder(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await this.dbService.taskDAO.updateBatchSortOrder(updates);
    this.notifyDataChange();
  }

  /**
   * 将Task实体转换为TaskDTO
   */
  private async convertToDTO(task: Task): Promise<TaskDTO> {
    let project = undefined;
    let parentTask = undefined;
    
    if (task.project_id) {
      project = await this.dbService.projectDAO.findById(task.project_id) || undefined;
    }

    if (task.parent_task_id) {
      parentTask = await this.dbService.taskDAO.findById(task.parent_task_id) || undefined;
    }
    
    return {
      ...task,
      due_date: task.due_date ? new Date(task.due_date) : undefined,
      completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
      time: task.due_date ? formatDisplayTime(task.due_date) : undefined,
      completed: task.status === 'completed',
      project: project,
      parent_task: parentTask,
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  }

  /**
   * 获取数据库服务实例（用于高级操作）
   */
  public getDatabaseService(): DatabaseService {
    return this.dbService;
  }

  /**
   * 批量更新任务状态
   */
  public async batchUpdateStatus(taskIds: string[], status: TaskStatus): Promise<void> {
    if (taskIds.length === 0) return;

    try {
      const dbManager = DatabaseManager.getInstance();
      await dbManager.withTransaction(async () => {
        for (const taskId of taskIds) {
          await this.dbService.taskDAO.updateStatus(taskId, status);
        }
      });
      this.notifyDataChange();
    } catch (error) {
      console.error('批量更新任务状态失败:', error);
      throw new Error('批量更新任务状态失败');
    }
  }

  /**
   * 批量删除任务
   */
  public async batchDelete(taskIds: string[]): Promise<void> {
    if (taskIds.length === 0) return;

    try {
      const dbManager = DatabaseManager.getInstance();
      await dbManager.withTransaction(async () => {
        for (const taskId of taskIds) {
          await this.dbService.taskDAO.softDelete(taskId);
        }
      });
      this.notifyDataChange();
    } catch (error) {
      console.error('批量删除任务失败:', error);
      throw new Error('批量删除任务失败');
    }
  }

  /**
   * 批量更新项目
   */
  public async batchUpdateProject(taskIds: string[], projectId: string): Promise<void> {
    if (taskIds.length === 0) return;

    try {
      const dbManager = DatabaseManager.getInstance();
      await dbManager.withTransaction(async () => {
        for (const taskId of taskIds) {
          await this.dbService.taskDAO.update(taskId, { project_id: projectId } as Partial<Task>);
        }
      });
      this.notifyDataChange();
    } catch (error) {
      console.error('批量更新任务项目失败:', error);
      throw new Error('批量更新任务项目失败');
    }
  }

  /**
   * 生成生产力报告
   */
  public async getProductivityReport(dateRange: { start: Date; end: Date }): Promise<ProductivityReport> {
    try {
      const dbManager = DatabaseManager.getInstance();
      const startDate = dateRange.start.toISOString();
      const endDate = dateRange.end.toISOString();

      // 完成任务数
      const completedResult = await dbManager.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 AND status = \'completed\' AND completed_at >= ? AND completed_at <= ?',
        [startDate, endDate]
      );

      // 平均完成时间（如果有记录的话）
      const avgTimeResult = await dbManager.getFirstAsync<{ avg_time: number }>(
        'SELECT AVG(actual_duration_minutes) as avg_time FROM tasks WHERE is_deleted_locally = 0 AND status = \'completed\' AND completed_at >= ? AND completed_at <= ? AND actual_duration_minutes IS NOT NULL',
        [startDate, endDate]
      );

      // 每日完成趋势
      const dailyTrend = await dbManager.getAllAsync<{ 
        date: string; 
        completed: number 
      }>(
        `SELECT 
          DATE(completed_at) as date,
          COUNT(*) as completed
         FROM tasks 
         WHERE is_deleted_locally = 0 
           AND status = 'completed' 
           AND completed_at >= ? 
           AND completed_at <= ?
         GROUP BY DATE(completed_at)
         ORDER BY date`,
        [startDate, endDate]
      );

      // 项目完成排行
      const topProjects = await dbManager.getAllAsync<{
        project_name: string;
        completed_tasks: number;
      }>(
        `SELECT 
          COALESCE(p.name, '默认项目') as project_name,
          COUNT(*) as completed_tasks
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.is_deleted_locally = 0 
           AND t.status = 'completed' 
           AND t.completed_at >= ? 
           AND t.completed_at <= ?
         GROUP BY t.project_id, p.name
         ORDER BY completed_tasks DESC
         LIMIT 5`,
        [startDate, endDate]
      );

      this.notifyDataChange();
      return {
        dateRange,
        completedTasks: completedResult?.count || 0,
        averageCompletionTime: (avgTimeResult?.avg_time || 0) / 60, // 转换为小时
        productivityTrend: dailyTrend.map((item: { date: string; completed: number }) => ({
          date: item.date,
          completed: item.completed
        })),
        topProjects: topProjects.map((item: { project_name: string; completed_tasks: number }) => ({
          projectName: item.project_name,
          completedTasks: item.completed_tasks
        }))
      };
    } catch (error) {
      console.error('生成生产力报告失败:', error);
      throw new Error('生成生产力报告失败');
    }
  }

  /**
   * 验证任务数据
   */
  private validateTaskData(data: any): void {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new Error('任务标题不能为空');
    }
    
    if (data.priority && !['high', 'medium', 'low'].includes(data.priority)) {
      throw new Error('无效的优先级');
    }
    
    if (data.status && !['not_started', 'in_progress', 'completed', 'cancelled', 'postponed', 'paused', 'waiting'].includes(data.status)) {
      throw new Error('无效的任务状态');
    }
  }

  /**
   * 获取子任务
   */
  public async getSubtasks(parentTaskId: string): Promise<TaskDTO[]> {
    try {
      const tasks = await this.dbService.taskDAO.findSubTasks(parentTaskId);
      return await Promise.all(tasks.map((task: Task) => this.convertToDTO(task)));
    } catch (error) {
      console.error('获取子任务失败:', error);
      throw new Error('获取子任务失败');
    }
  }

  /**
   * 获取任务依赖关系
   */
  public async getTaskDependencies(taskId: string): Promise<TaskDTO[]> {
    try {
      // 查找依赖当前任务的其他任务
      const dependencies = await this.dbService.taskDAO.findDependentTasks(taskId);
      return await Promise.all(dependencies.map((task: Task) => this.convertToDTO(task)));
    } catch (error) {
      console.error('获取任务依赖失败:', error);
      throw new Error('获取任务依赖失败');
    }
  }

  /**
   * 分页获取已完成任务
   */
  public async getCompletedTasksPaginated(
    page: number,
    pageSize: number = 20,
    filters?: CompletedTaskFilters
  ): Promise<PaginatedCompletedTasksResult> {
    try {
      const offset = (page - 1) * pageSize;
      const result = await this.dbService.taskDAO.findCompletedTasksPaginated(offset, pageSize, filters);
      
      const tasks = await Promise.all(result.tasks.map(task => this.convertToDTO(task)));
      
      return {
        tasks,
        hasMore: result.hasMore,
        total: result.total,
        currentPage: page,
        pageSize
      };
    } catch (error) {
      console.error('分页获取已完成任务失败:', error);
      throw new Error('分页获取已完成任务失败');
    }
  }

  /**
   * 获取已完成任务统计信息
   */
  public async getCompletedTasksStatistics(): Promise<CompletedTasksStatistics> {
    try {
      console.log('[TaskService] Fetching completed tasks statistics (simplified)...');
      const daoStatistics = await this.dbService.taskDAO.getCompletedTasksStatistics();
      
      // Temporarily simplify topProjects to use IDs directly
      const simplifiedTopProjects = daoStatistics.topProjects.map(projStat => ({
        projectName: projStat.projectId || '无项目', // Use ID or a placeholder
        count: projStat.count,
      }));

      // Temporarily disable trend and average time
      // const thirtyDaysAgo = new Date();
      // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      // const completionTrend = await this.dbService.taskDAO.getCompletionTrend(
      //   thirtyDaysAgo, 
      //   new Date()
      // );
      // const averageCompletionTime = await this.dbService.taskDAO.getAverageCompletionTimeForCompletedTasks();

      const statistics: CompletedTasksStatistics = {
        totalCompleted: daoStatistics.totalCompleted,
        todayCompleted: daoStatistics.todayCompleted,
        weekCompleted: daoStatistics.weekCompleted,
        monthCompleted: daoStatistics.monthCompleted,
        topProjects: simplifiedTopProjects, // Use simplified version
        completionTrend: [], // Return empty array for now
        averageCompletionTime: undefined, // Return undefined for now
      };
      console.log('[TaskService] Completed tasks statistics (simplified) fetched successfully:', statistics);
      return statistics;
    } catch (error) {
      console.error('[TaskService] Error fetching completed tasks statistics (simplified): ', error);
      throw new Error(`获取已完成任务统计失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 恢复单个已完成任务为未完成状态
   */
  public async restoreCompletedTask(taskId: string): Promise<TaskDTO | null> {
    try {
      const task = await this.dbService.taskDAO.markIncomplete(taskId);
      if (!task) return null;
      this.notifyDataChange();
      return await this.convertToDTO(task);
    } catch (error) {
      console.error('恢复已完成任务失败:', error);
      throw new Error('恢复已完成任务失败');
    }
  }

  /**
   * 批量恢复已完成任务为未完成状态
   */
  public async batchRestoreCompletedTasks(taskIds: string[]): Promise<void> {
    try {
      await this.dbService.taskDAO.batchRestoreCompletedTasks(taskIds);
      this.notifyDataChange();
    } catch (error) {
      console.error('批量恢复已完成任务失败:', error);
      throw new Error('批量恢复已完成任务失败');
    }
  }

  /**
   * 导出已完成任务数据
   */
  public async exportCompletedTasks(
    filters?: CompletedTaskFilters,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      // 查询符合条件的任务
      const offset = 0;
      const limit = 1000; // 设置一个较大的限制以导出更多数据
      
      const result = await this.dbService.taskDAO.findCompletedTasksPaginated(offset, limit, filters);
      const tasks = result.tasks;
      
      // 将任务转换为DTO格式
      const taskDTOs: TaskDTO[] = [];
      for (const task of tasks) {
        const dto = await this.convertToDTO(task);
        taskDTOs.push(dto);
      }
      
      // 根据格式导出
      if (format === 'json') {
        return JSON.stringify(taskDTOs, null, 2);
      } else if (format === 'csv') {
        // 简单的CSV实现
        const headers = ['id', 'title', 'description', 'status', 'priority', 'completed_at', 'project', 'created_at'];
        const rows = taskDTOs.map(task => [
          task.id,
          task.title,
          task.description || '',
          task.status,
          task.priority,
          task.completed_at ? new Date(task.completed_at).toISOString() : '',
          task.project ? task.project.name : '',
          new Date(task.created_at).toISOString()
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => 
            typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
          ).join(','))
        ].join('\n');
        
        return csvContent;
      }
      
      throw new Error('不支持的导出格式');
    } catch (error) {
      console.error('导出任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有已完成任务的ID列表（用于真正的全选功能）
   */
  public async getAllCompletedTaskIds(filters?: CompletedTaskFilters): Promise<string[]> {
    try {
      // 使用一个大的限制来获取所有任务ID，但只查询ID字段以提高性能
      const offset = 0;
      const limit = 10000; // 设置一个很大的限制以获取所有数据
      
      const result = await this.dbService.taskDAO.findCompletedTasksPaginated(offset, limit, filters);
      return result.tasks.map(task => task.id);
    } catch (error) {
      console.error('获取所有已完成任务ID失败:', error);
      throw new Error('获取所有已完成任务ID失败');
    }
  }
} 