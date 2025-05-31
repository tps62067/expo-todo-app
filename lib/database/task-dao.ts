import { Priority, Task, TaskStatus } from '../models/types';
import { BaseDAO } from './base-dao';

// 已完成任务筛选条件接口
export interface CompletedTaskFilters {
  dateRange?: { start: Date; end: Date };
  projectIds?: string[];
  searchQuery?: string;
  priorityFilter?: Priority[];
  taskIds?: string[];
}

// 分页查询结果接口
export interface PaginatedTasksResult {
  tasks: Task[];
  hasMore: boolean;
  total: number;
}

export class TaskDAO extends BaseDAO<Task> {
  constructor() {
    super('tasks');
  }

  /**
   * 根据状态查找任务
   */
  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.findWhere({ status, is_deleted_locally: 0 });
  }

  /**
   * 根据优先级查找任务
   */
  async findByPriority(priority: Priority): Promise<Task[]> {
    const priorityMap = { low: 0, medium: 1, high: 2 };
    const sql = `SELECT * FROM ${this.tableName} WHERE priority = ? AND is_deleted_locally = 0 ORDER BY sort_order ASC, created_at DESC`;
    return await this.dbManager.getAllAsync<Task>(sql, [priorityMap[priority]]);
  }

  /**
   * 根据项目ID查找任务
   */
  async findByProjectId(projectId: string): Promise<Task[]> {
    return await this.findWhere({ project_id: projectId } as Partial<Task>, 'sort_order ASC, created_at DESC');
  }

  /**
   * 查找今天的任务
   */
  async findTodayTasks(): Promise<Task[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE is_deleted_locally = 0 
      AND (
        (due_date >= ? AND due_date < ?) 
        OR status = 'in_progress'
      )
      ORDER BY priority DESC, due_date ASC, sort_order ASC
    `;
    
    return await this.dbManager.getAllAsync<Task>(sql, [startOfDay, endOfDay]);
  }

  /**
   * 查找未完成的任务
   */
  async findActiveTasks(): Promise<Task[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE is_deleted_locally = 0 
      AND status NOT IN ('completed', 'cancelled')
      ORDER BY priority DESC, due_date ASC, sort_order ASC
    `;
    
    return await this.dbManager.getAllAsync<Task>(sql);
  }

  /**
   * 查找已完成的任务
   */
  async findCompletedTasks(limit?: number): Promise<Task[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE is_deleted_locally = 0
      AND status = 'completed'
      ORDER BY completed_at DESC
      ${limit ? 'LIMIT ?' : ''}
    `;
    
    const params = limit ? [limit] : [];
    return this.dbManager.getAllAsync<Task>(query, params);
  }

  /**
   * 查找逾期的任务
   */
  async findOverdueTasks(): Promise<Task[]> {
    const now = new Date().toISOString();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE is_deleted_locally = 0 
      AND status NOT IN ('completed', 'cancelled')
      AND due_date < ?
      ORDER BY due_date ASC
    `;
    
    return await this.dbManager.getAllAsync<Task>(sql, [now]);
  }

  /**
   * 查找子任务
   */
  async findSubTasks(parentTaskId: string): Promise<Task[]> {
    return await this.findWhere({ parent_task_id: parentTaskId } as Partial<Task>, 'sort_order ASC, created_at ASC');
  }

  /**
   * 查找依赖的任务
   */
  async findDependentTasks(taskId: string): Promise<Task[]> {
    return await this.findWhere({ depends_on_task_id: taskId } as Partial<Task>, 'sort_order ASC, created_at ASC');
  }

  /**
   * 查找重复任务
   */
  async findRecurringTasks(): Promise<Task[]> {
    return await this.findWhere({ is_recurring: 1 } as Partial<Task>, 'created_at DESC');
  }

  /**
   * 标记任务为完成
   */
  async markCompleted(id: string): Promise<Task | null> {
    const now = new Date().toISOString();
    return await this.update(id, {
      status: 'completed',
      completed_at: now,
    } as Partial<Task>);
  }

  /**
   * 标记任务为未完成
   */
  async markIncomplete(id: string): Promise<Task | null> {
    return await this.update(id, {
      status: 'not_started',
      completed_at: undefined,
    } as Partial<Task>);
  }

  /**
   * 更新任务优先级
   */
  async updatePriority(id: string, priority: Priority): Promise<Task | null> {
    const priorityMap = { low: 0, medium: 1, high: 2 };
    return await this.update(id, {
      priority: priorityMap[priority],
    } as any);
  }

  /**
   * 更新任务状态
   */
  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    const updateData: Partial<Task> = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = undefined;
    }
    
    return await this.update(id, updateData);
  }

  /**
   * 按项目统计任务数量
   */
  async getTaskCountByProject(): Promise<Array<{ project_id: string; count: number }>> {
    const sql = `
      SELECT project_id, COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE is_deleted_locally = 0 
      AND status NOT IN ('completed', 'cancelled')
      GROUP BY project_id
    `;
    
    return await this.dbManager.getAllAsync<{ project_id: string; count: number }>(sql);
  }

  /**
   * 按状态统计任务数量
   */
  async getTaskCountByStatus(): Promise<Array<{ status: string; count: number }>> {
    const sql = `
      SELECT status, COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE is_deleted_locally = 0 
      GROUP BY status
    `;
    
    return await this.dbManager.getAllAsync<{ status: string; count: number }>(sql);
  }

  /**
   * 搜索任务
   */
  async searchTasks(query: string): Promise<Task[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE is_deleted_locally = 0 
      AND (title LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE WHEN title LIKE ? THEN 1 ELSE 2 END,
        priority DESC, 
        due_date ASC
    `;
    
    const searchPattern = `%${query}%`;
    const titlePattern = `%${query}%`;
    
    return await this.dbManager.getAllAsync<Task>(sql, [searchPattern, searchPattern, titlePattern]);
  }

  /**
   * 更新任务排序
   */
  async updateSortOrder(id: string, sortOrder: number): Promise<Task | null> {
    return await this.update(id, { sort_order: sortOrder } as Partial<Task>);
  }

  /**
   * 批量更新任务排序
   */
  async updateBatchSortOrder(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await this.dbManager.withTransaction(async () => {
      for (const { id, sortOrder } of updates) {
        await this.updateSortOrder(id, sortOrder);
      }
    });
  }

  /**
   * 分页查询已完成任务
   */
  async findCompletedTasksPaginated(
    offset: number, 
    limit: number, 
    filters?: CompletedTaskFilters
  ): Promise<PaginatedTasksResult> {
    let whereClause = 'WHERE is_deleted_locally = 0 AND status = \'completed\'';
    const params: any[] = [];

    // 应用筛选条件
    if (filters) {
      // 时间范围筛选
      if (filters.dateRange) {
        whereClause += ' AND completed_at >= ? AND completed_at <= ?';
        params.push(filters.dateRange.start.toISOString(), filters.dateRange.end.toISOString());
      }

      // 项目筛选
      if (filters.projectIds && filters.projectIds.length > 0) {
        const placeholders = filters.projectIds.map(() => '?').join(',');
        whereClause += ` AND project_id IN (${placeholders})`;
        params.push(...filters.projectIds);
      }

      // 搜索关键词筛选
      if (filters.searchQuery && filters.searchQuery.trim()) {
        whereClause += ' AND (title LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filters.searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern);
      }

      // 优先级筛选
      if (filters.priorityFilter && filters.priorityFilter.length > 0) {
        const priorityMap = { low: 0, medium: 1, high: 2 };
        const priorityValues = filters.priorityFilter.map(p => priorityMap[p]);
        const placeholders = priorityValues.map(() => '?').join(',');
        whereClause += ` AND priority IN (${placeholders})`;
        params.push(...priorityValues);
      }
    }

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.dbManager.getFirstAsync<{ total: number }>(countSql, params);
    const total = countResult?.total || 0;

    // 查询分页数据
    const dataSql = `
      SELECT * FROM ${this.tableName} 
      ${whereClause}
      ORDER BY completed_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const tasks = await this.dbManager.getAllAsync<Task>(dataSql, [...params, limit, offset]);
    const hasMore = offset + tasks.length < total;

    return {
      tasks,
      hasMore,
      total
    };
  }

  /**
   * 获取已完成任务总数
   */
  async getCompletedTasksCount(filters?: CompletedTaskFilters): Promise<number> {
    let whereClause = 'WHERE is_deleted_locally = 0 AND status = \'completed\'';
    const params: any[] = [];

    // 应用筛选条件
    if (filters) {
      // 时间范围筛选
      if (filters.dateRange) {
        whereClause += ' AND completed_at >= ? AND completed_at <= ?';
        params.push(filters.dateRange.start.toISOString(), filters.dateRange.end.toISOString());
      }

      // 项目筛选
      if (filters.projectIds && filters.projectIds.length > 0) {
        const placeholders = filters.projectIds.map(() => '?').join(',');
        whereClause += ` AND project_id IN (${placeholders})`;
        params.push(...filters.projectIds);
      }

      // 搜索关键词筛选
      if (filters.searchQuery && filters.searchQuery.trim()) {
        whereClause += ' AND (title LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filters.searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern);
      }

      // 优先级筛选
      if (filters.priorityFilter && filters.priorityFilter.length > 0) {
        const priorityMap = { low: 0, medium: 1, high: 2 };
        const priorityValues = filters.priorityFilter.map(p => priorityMap[p]);
        const placeholders = priorityValues.map(() => '?').join(',');
        whereClause += ` AND priority IN (${placeholders})`;
        params.push(...priorityValues);
      }
    }

    const sql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const result = await this.dbManager.getFirstAsync<{ total: number }>(sql, params);
    return result?.total || 0;
  }

  /**
   * 批量恢复已完成任务为未完成状态
   */
  async batchRestoreCompletedTasks(taskIds: string[]): Promise<void> {
    if (taskIds.length === 0) return;

    await this.dbManager.withTransaction(async () => {
      const placeholders = taskIds.map(() => '?').join(',');
      const sql = `
        UPDATE ${this.tableName} 
        SET status = 'not_started', completed_at = NULL, updated_at = ?
        WHERE id IN (${placeholders}) AND status = 'completed' AND is_deleted_locally = 0
      `;
      
      await this.dbManager.runAsync(sql, [new Date().toISOString(), ...taskIds]);
    });
  }

  /**
   * 获取已完成任务的统计信息
   */
  async getCompletedTasksStatistics(): Promise<{
    totalCompleted: number;
    todayCompleted: number;
    weekCompleted: number;
    monthCompleted: number;
    topProjects: Array<{ projectId: string | null; count: number }>;
  }> {
    console.log('[TaskDAO] Returning MOCK completed tasks statistics.');
    // 返回虚拟数据进行测试
    return {
      totalCompleted: 100,
      todayCompleted: 5,
      weekCompleted: 25,
      monthCompleted: 80,
      topProjects: [
        { projectId: 'project1', count: 50 },
        { projectId: 'project2', count: 30 },
        { projectId: null, count: 20 }, // 测试 null projectId
      ],
    };

    /* 原有代码暂时注释掉
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 总完成数
    const totalResult = await this.dbManager.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = 'completed' AND is_deleted_locally = 0`
    );
    const totalCompleted = totalResult?.count || 0;

    // 今日完成数
    const todayResult = await this.dbManager.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} 
       WHERE status = 'completed' AND is_deleted_locally = 0 
       AND completed_at >= ?`,
      [today.toISOString()]
    );
    const todayCompleted = todayResult?.count || 0;

    // 本周完成数
    const weekResult = await this.dbManager.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} 
       WHERE status = 'completed' AND is_deleted_locally = 0 
       AND completed_at >= ?`,
      [weekStart.toISOString()]
    );
    const weekCompleted = weekResult?.count || 0;

    // 本月完成数
    const monthResult = await this.dbManager.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} 
       WHERE status = 'completed' AND is_deleted_locally = 0 
       AND completed_at >= ?`,
      [monthStart.toISOString()]
    );
    const monthCompleted = monthResult?.count || 0;

    // 热门项目排行
    const topProjects = await this.dbManager.getAllAsync<{ projectId: string; count: number }>(
      `SELECT project_id as projectId, COUNT(*) as count 
       FROM ${this.tableName} 
       WHERE status = 'completed' AND is_deleted_locally = 0 
       GROUP BY project_id 
       ORDER BY count DESC 
       LIMIT 5`
    );

    return {
      totalCompleted,
      todayCompleted,
      weekCompleted,
      monthCompleted,
      topProjects: topProjects || []
    };
    */
  }
} 