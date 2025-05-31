import { ContentType, Note, NoteDTO, Tag } from '../models/types';
import { BaseDAO } from './base-dao';

export class NoteDAO extends BaseDAO<Note> {
  constructor() {
    super('notes');
  }

  // 创建新笔记
  async createNote(noteData: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'last_synced_at' | 'local_version' | 'is_deleted_locally'>): Promise<Note> {
    const note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'last_synced_at' | 'local_version' | 'is_deleted_locally'> = {
      ...noteData
    };

    return await this.create(note);
  }

  // 更新笔记
  async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'created_at'>>): Promise<Note | null> {
    return await this.update(id, updates);
  }

  // 按笔记本查询笔记
  async findByNotebook(notebookId: string, includeDeleted = false): Promise<Note[]> {
    const deletedCondition = includeDeleted ? '' : 'AND is_deleted_locally = 0';
    
    const result = await this.dbManager.getAllAsync<Note>(
      `SELECT * FROM notes 
       WHERE notebook_id = ? ${deletedCondition}
       ORDER BY updated_at DESC`,
      [notebookId]
    );
    
    return result;
  }

  // 按内容类型查询笔记
  async findByContentType(contentType: ContentType, includeDeleted = false): Promise<Note[]> {
    const deletedCondition = includeDeleted ? '' : 'AND is_deleted_locally = 0';
    
    const result = await this.dbManager.getAllAsync<Note>(
      `SELECT * FROM notes 
       WHERE content_type = ? ${deletedCondition}
       ORDER BY updated_at DESC`,
      [contentType]
    );
    
    return result;
  }

  // 全文搜索笔记
  async search(query: string, notebookId?: string, includeDeleted = false): Promise<Note[]> {
    const notebookCondition = notebookId ? 'AND notebook_id = ?' : '';
    const deletedCondition = includeDeleted ? '' : 'AND is_deleted_locally = 0';
    const searchPattern = `%${query}%`;
    
    const params = [searchPattern, searchPattern];
    if (notebookId) params.push(notebookId);
    
    const result = await this.dbManager.getAllAsync<Note>(
      `SELECT * FROM notes 
       WHERE (title LIKE ? OR content LIKE ?) 
       ${notebookCondition} ${deletedCondition}
       ORDER BY updated_at DESC`,
      params
    );
    
    return result;
  }

  // 获取最近更新的笔记
  async findRecentlyUpdated(limit = 10, includeDeleted = false): Promise<Note[]> {
    const deletedCondition = includeDeleted ? '' : 'WHERE is_deleted_locally = 0';
    
    const result = await this.dbManager.getAllAsync<Note>(
      `SELECT * FROM notes 
       ${deletedCondition}
       ORDER BY updated_at DESC 
       LIMIT ?`,
      [limit]
    );
    
    return result;
  }

  // 为笔记添加标签
  async addTag(noteId: string, tagId: string): Promise<boolean> {
    try {
      await this.dbManager.runAsync(
        `INSERT INTO note_tags (note_id, tag_id)
         VALUES (?, ?)`,
        [noteId, tagId]
      );

      // 更新笔记的修改时间
      await this.update(noteId, {
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error adding tag to note:', error);
      return false;
    }
  }

  // 移除笔记的标签
  async removeTag(noteId: string, tagId: string): Promise<boolean> {
    try {
      await this.dbManager.runAsync(
        `DELETE FROM note_tags 
         WHERE note_id = ? AND tag_id = ?`,
        [noteId, tagId]
      );

      // 更新笔记的修改时间
      await this.update(noteId, {
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error removing tag from note:', error);
      return false;
    }
  }

  // 获取笔记的所有标签
  async getTags(noteId: string): Promise<Tag[]> {
    const result = await this.dbManager.getAllAsync<Tag>(
      `SELECT t.* FROM tags t
       INNER JOIN note_tags nt ON t.id = nt.tag_id
       WHERE nt.note_id = ? AND t.is_deleted_locally = 0
       ORDER BY t.name`,
      [noteId]
    );
    
    return result;
  }

  // 按标签查询笔记
  async findByTag(tagId: string, includeDeleted = false): Promise<Note[]> {
    const deletedCondition = includeDeleted ? '' : 'AND n.is_deleted_locally = 0';
    
    const result = await this.dbManager.getAllAsync<Note>(
      `SELECT n.* FROM notes n
       INNER JOIN note_tags nt ON n.id = nt.note_id
       WHERE nt.tag_id = ? ${deletedCondition}
       ORDER BY n.updated_at DESC`,
      [tagId]
    );
    
    return result;
  }

  // 获取笔记统计信息
  async getStatistics(): Promise<{
    total: number;
    byNotebook: { notebookId: string; count: number }[];
    byContentType: { contentType: ContentType; count: number }[];
    recentlyModified: number; // 最近7天修改的笔记数
  }> {
    // 总数
    const totalResult = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes WHERE is_deleted_locally = 0',
      []
    );
    const total = totalResult?.count || 0;

    // 按笔记本分组
    const notebookResult = await this.dbManager.getAllAsync<{ notebookId: string; count: number }>(
      `SELECT notebook_id as notebookId, COUNT(*) as count 
       FROM notes 
       WHERE is_deleted_locally = 0 
       GROUP BY notebook_id`,
      []
    );
    const byNotebook = notebookResult;

    // 按内容类型分组
    const contentTypeResult = await this.dbManager.getAllAsync<{ contentType: ContentType; count: number }>(
      `SELECT content_type as contentType, COUNT(*) as count 
       FROM notes 
       WHERE is_deleted_locally = 0 
       GROUP BY content_type`,
      []
    );
    const byContentType = contentTypeResult;

    // 最近修改数（7天内）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentResult = await this.dbManager.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes WHERE updated_at >= ? AND is_deleted_locally = 0',
      [sevenDaysAgo.toISOString()]
    );
    const recentlyModified = recentResult?.count || 0;

    return {
      total,
      byNotebook,
      byContentType,
      recentlyModified
    };
  }

  // 转换为DTO
  async toDTO(note: Note): Promise<NoteDTO> {
    const tags = await this.getTags(note.id);
    
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: tags.map(tag => tag.name), // 返回标签名称数组
      color: note.color,
      is_pinned: note.is_pinned === 1,
      is_archived: note.is_archived === 1,
      created_at: note.created_at,
      updated_at: note.updated_at,
    };
  }

  // 批量转换为DTO
  async toDTOs(notes: Note[]): Promise<NoteDTO[]> {
    return Promise.all(notes.map(note => this.toDTO(note)));
  }
} 