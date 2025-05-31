"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRepository = void 0;
class TaskRepository {
    constructor(taskDAO) {
        this.taskDAO = taskDAO;
    }
    async findById(id) {
        return await this.taskDAO.findById(id);
    }
    async findAll(options) {
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
    async create(data) {
        return await this.taskDAO.create(data);
    }
    async update(id, data) {
        return await this.taskDAO.update(id, data);
    }
    async delete(id) {
        return await this.taskDAO.softDelete(id);
    }
    async exists(id) {
        return await this.taskDAO.exists(id);
    }
    async count(filters) {
        return await this.taskDAO.count(filters);
    }
    async findByStatus(status) {
        return await this.taskDAO.findByStatus(status);
    }
    async findByPriority(priority) {
        return await this.taskDAO.findByPriority(priority);
    }
    async findByProject(projectId) {
        return await this.taskDAO.findByProjectId(projectId);
    }
    async findCompleted(limit) {
        return await this.taskDAO.findCompletedTasks(limit);
    }
    async findOverdue() {
        return await this.taskDAO.findOverdueTasks();
    }
    async findToday() {
        return await this.taskDAO.findTodayTasks();
    }
    async findActive() {
        return await this.taskDAO.findActiveTasks();
    }
    async findSubTasks(parentTaskId) {
        return await this.taskDAO.findSubTasks(parentTaskId);
    }
    async findDependentTasks(taskId) {
        return await this.taskDAO.findDependentTasks(taskId);
    }
    async findRecurring() {
        return await this.taskDAO.findRecurringTasks();
    }
    async search(query, options) {
        return await this.taskDAO.searchTasks(query);
    }
    async markCompleted(id) {
        return await this.taskDAO.markCompleted(id);
    }
    async markIncomplete(id) {
        return await this.taskDAO.markIncomplete(id);
    }
    async updatePriority(id, priority) {
        return await this.taskDAO.updatePriority(id, priority);
    }
    async updateStatus(id, status) {
        return await this.taskDAO.updateStatus(id, status);
    }
    async getStatsByStatus() {
        return await this.taskDAO.getTaskCountByStatus();
    }
    async getStatsByProject() {
        return await this.taskDAO.getTaskCountByProject();
    }
}
exports.TaskRepository = TaskRepository;
