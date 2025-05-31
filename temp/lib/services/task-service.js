"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const manager_1 = __importDefault(require("../database/manager"));
const date_1 = require("../utils/date");
const database_service_1 = require("./database-service");
/**
 * 任务服务类
 * 提供任务相关的业务逻辑和数据操作
 */
class TaskService {
    constructor() {
        // 数据同步回调函数
        this.dataSyncCallback = null;
        this.dbService = database_service_1.DatabaseService.getInstance();
    }
    static getInstance() {
        if (!TaskService.instance) {
            TaskService.instance = new TaskService();
        }
        return TaskService.instance;
    }
    /**
     * 设置数据同步回调
     */
    setDataSyncCallback(callback) {
        this.dataSyncCallback = callback;
    }
    /**
     * 触发数据同步通知
     */
    notifyDataChange() {
        if (this.dataSyncCallback) {
            console.log('[TaskService] 通知数据变更');
            this.dataSyncCallback();
        }
    }
    /**
     * 初始化服务
     */
    async init() {
        await this.dbService.init();
    }
    /**
     * 创建新任务
     */
    async createTask(formData) {
        // 查找或创建项目
        let projectId;
        if (formData.category && formData.category !== '默认清单') {
            // 首先尝试按ID查找项目
            const projectById = await this.dbService.projectDAO.findById(formData.category);
            if (projectById) {
                projectId = projectById.id;
            }
            else {
                // 如果不是有效ID，则按名称搜索
                const projects = await this.dbService.projectDAO.searchByName(formData.category);
                if (projects.length > 0) {
                    projectId = projects[0].id;
                }
                else {
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
    async getTodayTasks() {
        const tasks = await this.dbService.taskDAO.findTodayTasks();
        return await Promise.all(tasks.map(task => this.convertToDTO(task)));
    }
    /**
     * 获取活跃的任务（未完成）
     */
    async getActiveTasks() {
        const tasks = await this.dbService.taskDAO.findActiveTasks();
        return await Promise.all(tasks.map(task => this.convertToDTO(task)));
    }
    /**
     * 获取已完成的任务
     */
    async getCompletedTasks(limit) {
        const tasks = await this.dbService.taskDAO.findCompletedTasks(limit);
        return await Promise.all(tasks.map(task => this.convertToDTO(task)));
    }
    /**
     * 获取逾期任务
     */
    async getOverdueTasks() {
        const tasks = await this.dbService.taskDAO.findOverdueTasks();
        return await Promise.all(tasks.map(task => this.convertToDTO(task)));
    }
    /**
     * 根据ID获取任务
     */
    async getTaskById(id) {
        const task = await this.dbService.taskDAO.findById(id);
        if (!task)
            return null;
        return await this.convertToDTO(task);
    }
    /**
     * 更新任务
     */
    async updateTask(id, updates) {
        const task = await this.dbService.taskDAO.update(id, updates);
        if (!task)
            return null;
        this.notifyDataChange();
        return await this.convertToDTO(task);
    }
    /**
     * 切换任务完成状态
     */
    async toggleTaskCompletion(id) {
        const currentTask = await this.dbService.taskDAO.findById(id);
        if (!currentTask)
            return null;
        const isCompleted = currentTask.status === 'completed';
        const task = isCompleted
            ? await this.dbService.taskDAO.markIncomplete(id)
            : await this.dbService.taskDAO.markCompleted(id);
        if (!task)
            return null;
        this.notifyDataChange();
        return await this.convertToDTO(task);
    }
    /**
     * 更新任务状态
     */
    async updateTaskStatus(id, status) {
        const task = await this.dbService.taskDAO.updateStatus(id, status);
        if (!task)
            return null;
        this.notifyDataChange();
        return await this.convertToDTO(task);
    }
    /**
     * 更新任务优先级
     */
    async updateTaskPriority(id, priority) {
        const task = await this.dbService.taskDAO.updatePriority(id, priority);
        if (!task)
            return null;
        this.notifyDataChange();
        return await this.convertToDTO(task);
    }
    /**
     * 删除任务
     */
    async deleteTask(id) {
        const result = await this.dbService.taskDAO.softDelete(id);
        this.notifyDataChange();
        return result;
    }
    /**
     * 根据项目获取任务
     */
    async getTasksByProject(projectId) {
        const tasks = await this.dbService.taskDAO.findByProjectId(projectId);
        return await Promise.all(tasks.map(task => this.convertToDTO(task)));
    }
    /**
     * 搜索任务
     */
    async searchTasks(query, filters) {
        try {
            const dbManager = manager_1.default.getInstance();
            let sql = `
        SELECT t.* FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.is_deleted_locally = 0
      `;
            const params = [];
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
                    const priorityNumbers = filters.priority.map(p => p === 'low' ? 0 : p === 'medium' ? 1 : 2);
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
                    }
                    else {
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
            const tasks = await dbManager.getAllAsync(sql, params);
            return Promise.all(tasks.map((task) => this.convertToDTO(task)));
        }
        catch (error) {
            console.error('搜索任务失败:', error);
            throw new Error('搜索任务失败');
        }
    }
    /**
     * 按筛选条件获取任务
     */
    async getTasksByFilters(filters) {
        return this.searchTasks('', filters);
    }
    /**
     * 获取任务统计信息
     */
    async getTaskStatistics() {
        try {
            const dbManager = manager_1.default.getInstance();
            // 基本统计
            const totalResult = await dbManager.getFirstAsync('SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0');
            const completedResult = await dbManager.getFirstAsync('SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 AND status = \'completed\'');
            const inProgressResult = await dbManager.getFirstAsync('SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 AND status = \'in_progress\'');
            const now = new Date().toISOString();
            const overdueResult = await dbManager.getFirstAsync('SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 AND due_date < ? AND status NOT IN (\'completed\', \'cancelled\')', [now]);
            // 按优先级统计
            const priorityStats = await dbManager.getAllAsync('SELECT priority, COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 GROUP BY priority');
            const byPriority = { high: 0, medium: 0, low: 0 };
            priorityStats.forEach((stat) => {
                if (stat.priority === 2)
                    byPriority.high = stat.count;
                else if (stat.priority === 1)
                    byPriority.medium = stat.count;
                else
                    byPriority.low = stat.count;
            });
            // 按项目统计
            const projectStats = await dbManager.getAllAsync(`SELECT 
          t.project_id, 
          COALESCE(p.name, '默认项目') as project_name,
          COUNT(*) as count 
         FROM tasks t 
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.is_deleted_locally = 0 
         GROUP BY t.project_id, p.name`);
            const byProject = projectStats.map((stat) => ({
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
        }
        catch (error) {
            console.error('获取任务统计失败:', error);
            throw new Error('获取任务统计失败');
        }
    }
    /**
     * 批量更新任务排序
     */
    async updateTasksOrder(updates) {
        await this.dbService.taskDAO.updateBatchSortOrder(updates);
        this.notifyDataChange();
    }
    /**
     * 将Task实体转换为TaskDTO
     */
    async convertToDTO(task) {
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
            time: task.due_date ? (0, date_1.formatDisplayTime)(task.due_date) : undefined,
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
    getDatabaseService() {
        return this.dbService;
    }
    /**
     * 批量更新任务状态
     */
    async batchUpdateStatus(taskIds, status) {
        if (taskIds.length === 0)
            return;
        try {
            const dbManager = manager_1.default.getInstance();
            await dbManager.withTransaction(async () => {
                for (const taskId of taskIds) {
                    await this.dbService.taskDAO.updateStatus(taskId, status);
                }
            });
            this.notifyDataChange();
        }
        catch (error) {
            console.error('批量更新任务状态失败:', error);
            throw new Error('批量更新任务状态失败');
        }
    }
    /**
     * 批量删除任务
     */
    async batchDelete(taskIds) {
        if (taskIds.length === 0)
            return;
        try {
            const dbManager = manager_1.default.getInstance();
            await dbManager.withTransaction(async () => {
                for (const taskId of taskIds) {
                    await this.dbService.taskDAO.softDelete(taskId);
                }
            });
            this.notifyDataChange();
        }
        catch (error) {
            console.error('批量删除任务失败:', error);
            throw new Error('批量删除任务失败');
        }
    }
    /**
     * 批量更新项目
     */
    async batchUpdateProject(taskIds, projectId) {
        if (taskIds.length === 0)
            return;
        try {
            const dbManager = manager_1.default.getInstance();
            await dbManager.withTransaction(async () => {
                for (const taskId of taskIds) {
                    await this.dbService.taskDAO.update(taskId, { project_id: projectId });
                }
            });
            this.notifyDataChange();
        }
        catch (error) {
            console.error('批量更新任务项目失败:', error);
            throw new Error('批量更新任务项目失败');
        }
    }
    /**
     * 生成生产力报告
     */
    async getProductivityReport(dateRange) {
        try {
            const dbManager = manager_1.default.getInstance();
            const startDate = dateRange.start.toISOString();
            const endDate = dateRange.end.toISOString();
            // 完成任务数
            const completedResult = await dbManager.getFirstAsync('SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0 AND status = \'completed\' AND completed_at >= ? AND completed_at <= ?', [startDate, endDate]);
            // 平均完成时间（如果有记录的话）
            const avgTimeResult = await dbManager.getFirstAsync('SELECT AVG(actual_duration_minutes) as avg_time FROM tasks WHERE is_deleted_locally = 0 AND status = \'completed\' AND completed_at >= ? AND completed_at <= ? AND actual_duration_minutes IS NOT NULL', [startDate, endDate]);
            // 每日完成趋势
            const dailyTrend = await dbManager.getAllAsync(`SELECT 
          DATE(completed_at) as date,
          COUNT(*) as completed
         FROM tasks 
         WHERE is_deleted_locally = 0 
           AND status = 'completed' 
           AND completed_at >= ? 
           AND completed_at <= ?
         GROUP BY DATE(completed_at)
         ORDER BY date`, [startDate, endDate]);
            // 项目完成排行
            const topProjects = await dbManager.getAllAsync(`SELECT 
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
         LIMIT 5`, [startDate, endDate]);
            this.notifyDataChange();
            return {
                dateRange,
                completedTasks: completedResult?.count || 0,
                averageCompletionTime: (avgTimeResult?.avg_time || 0) / 60, // 转换为小时
                productivityTrend: dailyTrend.map((item) => ({
                    date: item.date,
                    completed: item.completed
                })),
                topProjects: topProjects.map((item) => ({
                    projectName: item.project_name,
                    completedTasks: item.completed_tasks
                }))
            };
        }
        catch (error) {
            console.error('生成生产力报告失败:', error);
            throw new Error('生成生产力报告失败');
        }
    }
    /**
     * 验证任务数据
     */
    validateTaskData(data) {
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
    async getSubtasks(parentTaskId) {
        try {
            const tasks = await this.dbService.taskDAO.findSubTasks(parentTaskId);
            return await Promise.all(tasks.map((task) => this.convertToDTO(task)));
        }
        catch (error) {
            console.error('获取子任务失败:', error);
            throw new Error('获取子任务失败');
        }
    }
    /**
     * 获取任务依赖关系
     */
    async getTaskDependencies(taskId) {
        try {
            // 查找依赖当前任务的其他任务
            const dependencies = await this.dbService.taskDAO.findDependentTasks(taskId);
            return await Promise.all(dependencies.map((task) => this.convertToDTO(task)));
        }
        catch (error) {
            console.error('获取任务依赖失败:', error);
            throw new Error('获取任务依赖失败');
        }
    }
    /**
     * 分页获取已完成任务
     */
    async getCompletedTasksPaginated(page, pageSize = 20, filters) {
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
        }
        catch (error) {
            console.error('分页获取已完成任务失败:', error);
            throw new Error('分页获取已完成任务失败');
        }
    }
    /**
     * 获取已完成任务统计信息
     */
    async getCompletedTasksStatistics() {
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
            const statistics = {
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
        }
        catch (error) {
            console.error('[TaskService] Error fetching completed tasks statistics (simplified): ', error);
            throw new Error(`获取已完成任务统计失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 恢复单个已完成任务为未完成状态
     */
    async restoreCompletedTask(taskId) {
        try {
            const task = await this.dbService.taskDAO.markIncomplete(taskId);
            if (!task)
                return null;
            this.notifyDataChange();
            return await this.convertToDTO(task);
        }
        catch (error) {
            console.error('恢复已完成任务失败:', error);
            throw new Error('恢复已完成任务失败');
        }
    }
    /**
     * 批量恢复已完成任务为未完成状态
     */
    async batchRestoreCompletedTasks(taskIds) {
        try {
            await this.dbService.taskDAO.batchRestoreCompletedTasks(taskIds);
            this.notifyDataChange();
        }
        catch (error) {
            console.error('批量恢复已完成任务失败:', error);
            throw new Error('批量恢复已完成任务失败');
        }
    }
    /**
     * 导出已完成任务数据
     */
    async exportCompletedTasks(filters, format = 'json') {
        try {
            // 查询符合条件的任务
            const offset = 0;
            const limit = 1000; // 设置一个较大的限制以导出更多数据
            const result = await this.dbService.taskDAO.findCompletedTasksPaginated(offset, limit, filters);
            const tasks = result.tasks;
            // 将任务转换为DTO格式
            const taskDTOs = [];
            for (const task of tasks) {
                const dto = await this.convertToDTO(task);
                taskDTOs.push(dto);
            }
            // 根据格式导出
            if (format === 'json') {
                return JSON.stringify(taskDTOs, null, 2);
            }
            else if (format === 'csv') {
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
                    ...rows.map(row => row.map(cell => typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell).join(','))
                ].join('\n');
                return csvContent;
            }
            throw new Error('不支持的导出格式');
        }
        catch (error) {
            console.error('导出任务失败:', error);
            throw error;
        }
    }
    /**
     * 获取所有已完成任务的ID列表（用于真正的全选功能）
     */
    async getAllCompletedTaskIds(filters) {
        try {
            // 使用一个大的限制来获取所有任务ID，但只查询ID字段以提高性能
            const offset = 0;
            const limit = 10000; // 设置一个很大的限制以获取所有数据
            const result = await this.dbService.taskDAO.findCompletedTasksPaginated(offset, limit, filters);
            return result.tasks.map(task => task.id);
        }
        catch (error) {
            console.error('获取所有已完成任务ID失败:', error);
            throw new Error('获取所有已完成任务ID失败');
        }
    }
}
exports.TaskService = TaskService;
