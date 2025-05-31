import { NoteDAO } from '../database/note-dao';
import { ContentType, Note, Tag } from '../models/types';
import { QueryOptions } from './interfaces/IBaseRepository';
import { CreateNoteData, INoteRepository, NoteQueryOptions, UpdateNoteData } from './interfaces/INoteRepository';

export class NoteRepository implements INoteRepository {
  constructor(private noteDAO: NoteDAO) {}

  async findById(id: string): Promise<Note | null> {
    return await this.noteDAO.findById(id);
  }

  async findAll(options?: QueryOptions): Promise<Note[]> {
    if (!options) {
      return await this.noteDAO.findAll();
    }

    const { sortBy = 'updated_at', sortOrder = 'desc' } = options;
    const orderBy = `${sortBy} ${sortOrder.toUpperCase()}`;
    
    return await this.noteDAO.findAll(orderBy);
  }

  async create(data: CreateNoteData): Promise<Note> {
    console.log('[NoteRepository] 开始创建笔记，输入数据:', data);
    
    // 设置默认值以确保类型安全和数据完整性
    const noteData = {
      title: data.title,
      content: data.content || '',
      content_type: data.content_type || 'plain' as ContentType,
      is_draft: data.is_draft !== undefined ? data.is_draft : 0,
      notebook_id: data.notebook_id,
      category: data.category,
      color: data.color,
      is_pinned: data.is_pinned ? 1 : 0,
      is_archived: data.is_archived ? 1 : 0,
    };
    
    console.log('[NoteRepository] 准备调用DAO创建笔记，处理后的数据:', noteData);
    
    try {
      const result = await this.noteDAO.createNote(noteData);
      console.log('[NoteRepository] 笔记创建成功:', result);
      return result;
    } catch (error) {
      console.error('[NoteRepository] 创建笔记失败:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<UpdateNoteData>): Promise<Note | null> {
    // 转换布尔值为数字，以匹配数据库字段类型
    const updateData: any = { ...data };
    if (data.is_pinned !== undefined) {
      updateData.is_pinned = data.is_pinned ? 1 : 0;
    }
    if (data.is_archived !== undefined) {
      updateData.is_archived = data.is_archived ? 1 : 0;
    }
    if (data.is_draft !== undefined) {
      updateData.is_draft = data.is_draft ? 1 : 0;
    }
    return await this.noteDAO.updateNote(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    return await this.noteDAO.softDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.noteDAO.exists(id);
  }

  async count(filters?: Record<string, any>): Promise<number> {
    return await this.noteDAO.count(filters);
  }

  async findByNotebook(notebookId: string): Promise<Note[]> {
    return await this.noteDAO.findByNotebook(notebookId);
  }

  async findByContentType(contentType: ContentType): Promise<Note[]> {
    return await this.noteDAO.findByContentType(contentType);
  }

  async findDrafts(): Promise<Note[]> {
    return await this.noteDAO.findWhere({ is_draft: 1 });
  }

  async findByTag(tagId: string): Promise<Note[]> {
    return await this.noteDAO.findByTag(tagId);
  }

  async findByTags(tagIds: string[]): Promise<Note[]> {
    // 需要实现多标签查询，这里简化处理
    const notes: Note[] = [];
    for (const tagId of tagIds) {
      const tagNotes = await this.noteDAO.findByTag(tagId);
      notes.push(...tagNotes);
    }
    // 去重
    const uniqueNotes = notes.filter((note, index, self) => 
      index === self.findIndex(n => n.id === note.id)
    );
    return uniqueNotes;
  }

  async search(query: string, options?: NoteQueryOptions): Promise<Note[]> {
    return await this.noteDAO.search(query);
  }

  async findRecent(limit = 10): Promise<Note[]> {
    return await this.noteDAO.findRecentlyUpdated(limit);
  }

  async addTag(noteId: string, tagId: string): Promise<boolean> {
    return await this.noteDAO.addTag(noteId, tagId);
  }

  async removeTag(noteId: string, tagId: string): Promise<boolean> {
    return await this.noteDAO.removeTag(noteId, tagId);
  }

  async getTags(noteId: string): Promise<Tag[]> {
    return await this.noteDAO.getTags(noteId);
  }

  async getStatsByNotebook(): Promise<Array<{ notebookId: string; count: number }>> {
    const stats = await this.noteDAO.getStatistics();
    return stats.byNotebook;
  }

  async getStatsByContentType(): Promise<Array<{ contentType: ContentType; count: number }>> {
    const stats = await this.noteDAO.getStatistics();
    return stats.byContentType;
  }

  // 新增方法 - 支持新架构功能
  async findByCategory(category: string): Promise<Note[]> {
    // 简化实现：按分类查找笔记
    return await this.noteDAO.findWhere({ category });
  }

  async searchByContent(query: string): Promise<Note[]> {
    // 使用现有搜索方法
    return await this.noteDAO.search(query);
  }

  async findPinned(): Promise<Note[]> {
    return await this.noteDAO.findWhere({ is_pinned: 1 });
  }

  async findArchived(): Promise<Note[]> {
    return await this.noteDAO.findWhere({ is_archived: 1 });
  }

  async findByTagName(tagName: string): Promise<Note[]> {
    // 简化实现：使用搜索功能查找包含特定标签的笔记
    return await this.noteDAO.search(tagName);
  }
} 