import { Project } from '../models/types';
import { BaseDAO } from './base-dao';

export class ProjectDAO extends BaseDAO<Project> {
  constructor() {
    super('projects');
  }

  // 创建新项目
  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'last_synced_at' | 'local_version' | 'is_deleted_locally'>): Promise<Project> {
    const project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'last_synced_at' | 'local_version' | 'is_deleted_locally'> = {
      ...projectData
    };

    return await this.create(project);
  }

  // 更新项目
  async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project | null> {
    return await this.update(id, updates);
  }

  // 获取所有项目，按sort_order排序
  async findAllProjects(): Promise<Project[]> {
    return await this.findAll('sort_order ASC');
  }

  // 按名称搜索项目
  async searchByName(name: string): Promise<Project[]> {
    const result = await this.dbManager.getAllAsync<Project>(
      `SELECT * FROM projects 
       WHERE name LIKE ? AND is_deleted_locally = 0 
       ORDER BY name ASC`,
      [`%${name}%`]
    );
    return result;
  }

  // 获取共享项目
  async findSharedProjects(): Promise<Project[]> {
    return await this.findWhere({ is_shared: 1 }, 'sort_order ASC');
  }

  // 重新排序项目
  async reorderProjects(orderedIds: string[]): Promise<boolean> {
    try {
      await this.dbManager.withTransaction(async () => {
        for (let i = 0; i < orderedIds.length; i++) {
          await this.update(orderedIds[i], {
            sort_order: i + 1
          });
        }
      });
      return true;
    } catch (error) {
      console.error('Error reordering projects:', error);
      return false;
    }
  }

  // 获取项目的任务数量
  async getTaskCount(projectId: string): Promise<number> {
    const result = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND is_deleted_locally = 0',
      [projectId]
    );
    return result?.count || 0;
  }

  // 获取项目统计信息
  async getStatistics(): Promise<{
    total: number;
    shared: number;
    withTasks: number;
  }> {
    const totalResult = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM projects WHERE is_deleted_locally = 0',
      []
    );
    const total = totalResult?.count || 0;

    const sharedResult = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM projects WHERE is_shared = 1 AND is_deleted_locally = 0',
      []
    );
    const shared = sharedResult?.count || 0;

    const withTasksResult = await this.dbManager.getFirstAsync<{ count: number }>(
      `SELECT COUNT(DISTINCT p.id) as count 
       FROM projects p 
       INNER JOIN tasks t ON p.id = t.project_id 
       WHERE p.is_deleted_locally = 0 AND t.is_deleted_locally = 0`,
      []
    );
    const withTasks = withTasksResult?.count || 0;

    return {
      total,
      shared,
      withTasks
    };
  }
} 