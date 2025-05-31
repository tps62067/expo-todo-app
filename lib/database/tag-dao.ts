import { Tag } from '../models/types';
import { BaseDAO } from './base-dao';

export class TagDAO extends BaseDAO<Tag> {
  constructor() {
    super('tags');
  }

  // 创建新标签
  async createTag(tagData: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'last_synced_at' | 'local_version' | 'is_deleted_locally'>): Promise<Tag> {
    const tag: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'last_synced_at' | 'local_version' | 'is_deleted_locally'> = {
      ...tagData
    };

    return await this.create(tag);
  }

  // 更新标签
  async updateTag(id: string, updates: Partial<Omit<Tag, 'id' | 'created_at'>>): Promise<Tag | null> {
    return await this.update(id, updates);
  }

  // 获取所有标签，按名称排序
  async findAllTags(): Promise<Tag[]> {
    return await this.findAll('name ASC');
  }

  // 按名称搜索标签
  async searchByName(name: string): Promise<Tag[]> {
    const result = await this.dbManager.getAllAsync<Tag>(
      `SELECT * FROM tags 
       WHERE name LIKE ? AND is_deleted_locally = 0 
       ORDER BY name ASC`,
      [`%${name}%`]
    );
    return result;
  }

  // 按确切名称查找标签（大小写不敏感）
  async findByExactName(name: string): Promise<Tag | null> {
    const result = await this.dbManager.getFirstAsync<Tag>(
      `SELECT * FROM tags 
       WHERE LOWER(name) = LOWER(?) AND is_deleted_locally = 0`,
      [name]
    );
    return result;
  }

  // 检查标签名称是否已存在
  async isNameExists(name: string, excludeId?: string): Promise<boolean> {
    let sql = `SELECT 1 FROM tags WHERE LOWER(name) = LOWER(?) AND is_deleted_locally = 0`;
    const params = [name];
    
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const result = await this.dbManager.getFirstAsync(sql, params);
    return result !== null;
  }

  // 获取最常用的标签
  async getMostUsedTags(limit = 10): Promise<Array<Tag & { usage_count: number }>> {
    const result = await this.dbManager.getAllAsync<Tag & { usage_count: number }>(
      `SELECT t.*, COUNT(nt.note_id) as usage_count
       FROM tags t
       LEFT JOIN note_tags nt ON t.id = nt.tag_id
       WHERE t.is_deleted_locally = 0
       GROUP BY t.id
       ORDER BY usage_count DESC, t.name ASC
       LIMIT ?`,
      [limit]
    );
    return result;
  }

  // 获取未使用的标签
  async getUnusedTags(): Promise<Tag[]> {
    const result = await this.dbManager.getAllAsync<Tag>(
      `SELECT t.*
       FROM tags t
       LEFT JOIN note_tags nt ON t.id = nt.tag_id
       WHERE t.is_deleted_locally = 0 AND nt.tag_id IS NULL
       ORDER BY t.name ASC`,
      []
    );
    return result;
  }

  // 获取标签的使用次数
  async getTagUsageCount(tagId: string): Promise<number> {
    const result = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM note_tags WHERE tag_id = ?',
      [tagId]
    );
    return result?.count || 0;
  }

  // 批量创建或获取标签（按名称）
  async createOrGetTagsByNames(tagNames: string[]): Promise<Tag[]> {
    return await this.dbManager.withTransaction(async () => {
      const tags: Tag[] = [];
      
      for (const name of tagNames) {
        if (!name.trim()) continue;
        
        // 先尝试查找现有标签
        let tag = await this.findByExactName(name.trim());
        
        // 如果不存在则创建新标签
        if (!tag) {
          tag = await this.createTag({
            name: name.trim(),
            color: this.getRandomColor()
          });
        }
        
        tags.push(tag);
      }
      
      return tags;
    });
  }

  // 删除未使用的标签
  async deleteUnusedTags(): Promise<number> {
    const unusedTags = await this.getUnusedTags();
    let deletedCount = 0;
    
    await this.dbManager.withTransaction(async () => {
      for (const tag of unusedTags) {
        const success = await this.softDelete(tag.id);
        if (success) deletedCount++;
      }
    });
    
    return deletedCount;
  }

  // 合并标签（将source标签的所有关联移动到target标签）
  async mergeTags(sourceTagId: string, targetTagId: string): Promise<boolean> {
    try {
      return await this.dbManager.withTransaction(async () => {
        // 更新所有使用source标签的笔记，改为使用target标签
        await this.dbManager.runAsync(
          `UPDATE note_tags 
           SET tag_id = ? 
           WHERE tag_id = ? 
           AND note_id NOT IN (
             SELECT note_id FROM note_tags WHERE tag_id = ?
           )`,
          [targetTagId, sourceTagId, targetTagId]
        );
        
        // 删除重复的关联（source标签和target标签都关联的笔记）
        await this.dbManager.runAsync(
          `DELETE FROM note_tags 
           WHERE tag_id = ?`,
          [sourceTagId]
        );
        
        // 软删除source标签
        await this.softDelete(sourceTagId);
        
        return true;
      });
    } catch (error) {
      console.error('Error merging tags:', error);
      return false;
    }
  }

  // 获取标签统计信息
  async getStatistics(): Promise<{
    total: number;
    used: number;
    unused: number;
    mostUsed: Array<{ name: string; count: number }>;
  }> {
    const totalResult = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM tags WHERE is_deleted_locally = 0',
      []
    );
    const total = totalResult?.count || 0;

    const usedResult = await this.dbManager.getFirstAsync<{ count: number }>(
      `SELECT COUNT(DISTINCT t.id) as count 
       FROM tags t 
       INNER JOIN note_tags nt ON t.id = nt.tag_id 
       WHERE t.is_deleted_locally = 0`,
      []
    );
    const used = usedResult?.count || 0;
    const unused = total - used;

    const mostUsedResult = await this.dbManager.getAllAsync<{ name: string; count: number }>(
      `SELECT t.name, COUNT(nt.note_id) as count
       FROM tags t
       INNER JOIN note_tags nt ON t.id = nt.tag_id
       WHERE t.is_deleted_locally = 0
       GROUP BY t.id, t.name
       ORDER BY count DESC, t.name ASC
       LIMIT 5`,
      []
    );

    return {
      total,
      used,
      unused,
      mostUsed: mostUsedResult
    };
  }

  // 生成随机颜色
  private getRandomColor(): string {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7',
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
} 