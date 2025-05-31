import { ProjectDAO } from '../database/project-dao';
import { Project } from '../models/types';
import {
    CreateProjectData,
    IProjectRepository,
    ProjectQueryOptions,
    UpdateProjectData
} from './interfaces/IProjectRepository';

export class ProjectRepository implements IProjectRepository {
  constructor(private projectDAO: ProjectDAO) {}

  async findById(id: string): Promise<Project | null> {
    return await this.projectDAO.findById(id);
  }

  async findAll(options?: ProjectQueryOptions): Promise<Project[]> {
    if (options?.filters) {
      // 可以根据需要扩展过滤逻辑
      return await this.projectDAO.findAllProjects();
    }
    return await this.projectDAO.findAllProjects();
  }

  async create(data: CreateProjectData): Promise<Project> {
    return await this.projectDAO.createProject(data);
  }

  async update(id: string, data: UpdateProjectData): Promise<Project | null> {
    return await this.projectDAO.updateProject(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return await this.projectDAO.softDelete(id);
  }

  async count(filters?: Record<string, any>): Promise<number> {
    return await this.projectDAO.count(filters);
  }

  async exists(id: string): Promise<boolean> {
    const project = await this.projectDAO.findById(id);
    return project !== null;
  }

  async findShared(): Promise<Project[]> {
    return await this.projectDAO.findSharedProjects();
  }

  async findByName(name: string): Promise<Project[]> {
    return await this.projectDAO.searchByName(name);
  }

  async search(query: string): Promise<Project[]> {
    return await this.projectDAO.searchByName(query);
  }

  async getTaskCount(projectId: string): Promise<number> {
    return await this.projectDAO.getTaskCount(projectId);
  }

  async reorder(orderedIds: string[]): Promise<boolean> {
    // 实现项目重新排序逻辑
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await this.projectDAO.updateProject(orderedIds[i], { sort_order: i });
      }
      return true;
    } catch (error) {
      console.error('Reorder projects failed:', error);
      return false;
    }
  }
} 