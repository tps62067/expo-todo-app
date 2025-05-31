"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRepository = void 0;
class ProjectRepository {
    constructor(projectDAO) {
        this.projectDAO = projectDAO;
    }
    async findById(id) {
        return await this.projectDAO.findById(id);
    }
    async findAll(options) {
        if (options?.filters) {
            // 可以根据需要扩展过滤逻辑
            return await this.projectDAO.findAllProjects();
        }
        return await this.projectDAO.findAllProjects();
    }
    async create(data) {
        return await this.projectDAO.createProject(data);
    }
    async update(id, data) {
        return await this.projectDAO.updateProject(id, data);
    }
    async delete(id) {
        return await this.projectDAO.softDelete(id);
    }
    async count(filters) {
        return await this.projectDAO.count(filters);
    }
    async exists(id) {
        const project = await this.projectDAO.findById(id);
        return project !== null;
    }
    async findShared() {
        return await this.projectDAO.findSharedProjects();
    }
    async findByName(name) {
        return await this.projectDAO.searchByName(name);
    }
    async search(query) {
        return await this.projectDAO.searchByName(query);
    }
    async getTaskCount(projectId) {
        return await this.projectDAO.getTaskCount(projectId);
    }
    async reorder(orderedIds) {
        // 实现项目重新排序逻辑
        try {
            for (let i = 0; i < orderedIds.length; i++) {
                await this.projectDAO.updateProject(orderedIds[i], { sort_order: i });
            }
            return true;
        }
        catch (error) {
            console.error('Reorder projects failed:', error);
            return false;
        }
    }
}
exports.ProjectRepository = ProjectRepository;
