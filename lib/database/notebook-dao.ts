import { Notebook } from '../models/types';
import { BaseDAO } from './base-dao';

export class NotebookDAO extends BaseDAO<Notebook> {
  constructor() {
    super('notebooks');
  }

  // 创建新笔记本
  async createNotebook(notebookData: Omit<Notebook, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'last_synced_at' | 'local_version' | 'is_deleted_locally'>): Promise<Notebook> {
    const notebook: Omit<Notebook, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'last_synced_at' | 'local_version' | 'is_deleted_locally'> = {
      ...notebookData
    };

    return await this.create(notebook);
  }

  // 更新笔记本
  async updateNotebook(id: string, updates: Partial<Omit<Notebook, 'id' | 'created_at'>>): Promise<Notebook | null> {
    return await this.update(id, updates);
  }

  // 获取所有笔记本，按sort_order排序
  async findAllNotebooks(): Promise<Notebook[]> {
    return await this.findAll('sort_order ASC');
  }

  // 获取根级笔记本（无父级）
  async findRootNotebooks(): Promise<Notebook[]> {
    const result = await this.dbManager.getAllAsync<Notebook>(
      `SELECT * FROM notebooks 
       WHERE parent_id IS NULL AND is_deleted_locally = 0 
       ORDER BY sort_order ASC`,
      []
    );
    return result;
  }

  // 获取子笔记本
  async findChildNotebooks(parentId: string): Promise<Notebook[]> {
    return await this.findWhere({ parent_id: parentId }, 'sort_order ASC');
  }

  // 按名称搜索笔记本
  async searchByName(name: string): Promise<Notebook[]> {
    const result = await this.dbManager.getAllAsync<Notebook>(
      `SELECT * FROM notebooks 
       WHERE name LIKE ? AND is_deleted_locally = 0 
       ORDER BY name ASC`,
      [`%${name}%`]
    );
    return result;
  }

  // 获取共享笔记本
  async findSharedNotebooks(): Promise<Notebook[]> {
    return await this.findWhere({ is_shared: 1 }, 'sort_order ASC');
  }

  // 重新排序笔记本
  async reorderNotebooks(orderedIds: string[]): Promise<boolean> {
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
      console.error('Error reordering notebooks:', error);
      return false;
    }
  }

  // 获取笔记本的笔记数量
  async getNoteCount(notebookId: string): Promise<number> {
    const result = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes WHERE notebook_id = ? AND is_deleted_locally = 0',
      [notebookId]
    );
    return result?.count || 0;
  }

  // 获取笔记本层次结构
  async getNotebookHierarchy(): Promise<Notebook[]> {
    const result = await this.dbManager.getAllAsync<Notebook>(
      `WITH RECURSIVE notebook_tree AS (
        -- 根节点
        SELECT *, 0 as level
        FROM notebooks 
        WHERE parent_id IS NULL AND is_deleted_locally = 0
        
        UNION ALL
        
        -- 递归查找子节点
        SELECT n.*, nt.level + 1
        FROM notebooks n
        INNER JOIN notebook_tree nt ON n.parent_id = nt.id
        WHERE n.is_deleted_locally = 0
      )
      SELECT * FROM notebook_tree 
      ORDER BY level, sort_order`,
      []
    );
    return result;
  }

  // 移动笔记本到新父级
  async moveNotebook(notebookId: string, newParentId: string | null): Promise<boolean> {
    try {
      return await this.update(notebookId, {
        parent_id: newParentId
      }) !== null;
    } catch (error) {
      console.error('Error moving notebook:', error);
      return false;
    }
  }

  // 获取笔记本统计信息
  async getStatistics(): Promise<{
    total: number;
    rootLevel: number;
    shared: number;
    withNotes: number;
  }> {
    const totalResult = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notebooks WHERE is_deleted_locally = 0',
      []
    );
    const total = totalResult?.count || 0;

    const rootLevelResult = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notebooks WHERE parent_id IS NULL AND is_deleted_locally = 0',
      []
    );
    const rootLevel = rootLevelResult?.count || 0;

    const sharedResult = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notebooks WHERE is_shared = 1 AND is_deleted_locally = 0',
      []
    );
    const shared = sharedResult?.count || 0;

    const withNotesResult = await this.dbManager.getFirstAsync<{ count: number }>(
      `SELECT COUNT(DISTINCT nb.id) as count 
       FROM notebooks nb 
       INNER JOIN notes n ON nb.id = n.notebook_id 
       WHERE nb.is_deleted_locally = 0 AND n.is_deleted_locally = 0`,
      []
    );
    const withNotes = withNotesResult?.count || 0;

    return {
      total,
      rootLevel,
      shared,
      withNotes
    };
  }
} 