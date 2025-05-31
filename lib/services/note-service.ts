import { ContentType, CreateNoteForm, Note, NoteDTO, Tag } from '../models/types';
import { DatabaseService } from './database-service';

/**
 * 笔记服务类
 * 提供笔记相关的业务逻辑和数据操作
 */
export class NoteService {
  private static instance: NoteService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): NoteService {
    if (!NoteService.instance) {
      NoteService.instance = new NoteService();
    }
    return NoteService.instance;
  }

  /**
   * 初始化服务
   */
  public async init(): Promise<void> {
    await this.dbService.init();
  }

  /**
   * 创建新笔记
   */
  public async createNote(formData: CreateNoteForm): Promise<NoteDTO> {
    // 查找或创建笔记本
    let notebookId: string | undefined;
    if (formData.category && formData.category !== '默认笔记本') {
      const notebooks = await this.dbService.notebookDAO.searchByName(formData.category);
      if (notebooks.length > 0) {
        notebookId = notebooks[0].id;
      } else {
        // 创建新笔记本
        const newNotebook = await this.dbService.notebookDAO.createNotebook({
          name: formData.category,
          color: formData.color,
          sort_order: 0,
          is_shared: 0
        });
        notebookId = newNotebook.id;
      }
    }

    // 创建笔记
    const note = await this.dbService.noteDAO.createNote({
      title: formData.title,
      content: formData.content,
      content_type: 'plain' as ContentType,
      is_draft: 0,
      notebook_id: notebookId
    });

    // 添加标签
    if (formData.tags && formData.tags.length > 0) {
      const tags = await this.dbService.tagDAO.createOrGetTagsByNames(formData.tags);
      for (const tag of tags) {
        await this.dbService.noteDAO.addTag(note.id, tag.id);
      }
    }

    return await this.dbService.noteDAO.toDTO(note);
  }

  /**
   * 获取所有笔记
   */
  public async getAllNotes(): Promise<NoteDTO[]> {
    const notes = await this.dbService.noteDAO.findAll('updated_at DESC');
    return await this.dbService.noteDAO.toDTOs(notes);
  }

  /**
   * 获取最近更新的笔记
   */
  public async getRecentNotes(limit = 10): Promise<NoteDTO[]> {
    const notes = await this.dbService.noteDAO.findRecentlyUpdated(limit);
    return await this.dbService.noteDAO.toDTOs(notes);
  }

  /**
   * 根据ID获取笔记
   */
  public async getNoteById(id: string): Promise<NoteDTO | null> {
    const note = await this.dbService.noteDAO.findById(id);
    if (!note) return null;
    return await this.dbService.noteDAO.toDTO(note);
  }

  /**
   * 更新笔记
   */
  public async updateNote(id: string, updates: Partial<Note>): Promise<NoteDTO | null> {
    const note = await this.dbService.noteDAO.updateNote(id, updates);
    if (!note) return null;
    return await this.dbService.noteDAO.toDTO(note);
  }

  /**
   * 删除笔记
   */
  public async deleteNote(id: string): Promise<boolean> {
    return await this.dbService.noteDAO.softDelete(id);
  }

  /**
   * 根据笔记本获取笔记
   */
  public async getNotesByNotebook(notebookId: string): Promise<NoteDTO[]> {
    const notes = await this.dbService.noteDAO.findByNotebook(notebookId);
    return await this.dbService.noteDAO.toDTOs(notes);
  }

  /**
   * 根据标签获取笔记
   */
  public async getNotesByTag(tagId: string): Promise<NoteDTO[]> {
    const notes = await this.dbService.noteDAO.findByTag(tagId);
    return await this.dbService.noteDAO.toDTOs(notes);
  }

  /**
   * 搜索笔记
   */
  public async searchNotes(query: string, notebookId?: string): Promise<NoteDTO[]> {
    const notes = await this.dbService.noteDAO.search(query, notebookId);
    return await this.dbService.noteDAO.toDTOs(notes);
  }

  /**
   * 为笔记添加标签
   */
  public async addTagToNote(noteId: string, tagName: string): Promise<boolean> {
    const tags = await this.dbService.tagDAO.createOrGetTagsByNames([tagName]);
    if (tags.length === 0) return false;
    
    return await this.dbService.noteDAO.addTag(noteId, tags[0].id);
  }

  /**
   * 从笔记移除标签
   */
  public async removeTagFromNote(noteId: string, tagId: string): Promise<boolean> {
    return await this.dbService.noteDAO.removeTag(noteId, tagId);
  }

  /**
   * 获取笔记的标签
   */
  public async getNoteTags(noteId: string): Promise<Tag[]> {
    return await this.dbService.noteDAO.getTags(noteId);
  }

  /**
   * 获取所有标签
   */
  public async getAllTags(): Promise<Tag[]> {
    return await this.dbService.tagDAO.findAllTags();
  }

  /**
   * 获取最常用的标签
   */
  public async getMostUsedTags(limit = 10): Promise<Array<Tag & { usage_count: number }>> {
    return await this.dbService.tagDAO.getMostUsedTags(limit);
  }

  /**
   * 获取所有笔记本
   */
  public async getAllNotebooks(): Promise<any[]> {
    return await this.dbService.notebookDAO.findAllNotebooks();
  }

  /**
   * 获取根级笔记本
   */
  public async getRootNotebooks(): Promise<any[]> {
    return await this.dbService.notebookDAO.findRootNotebooks();
  }

  /**
   * 根据内容类型获取笔记
   */
  public async getNotesByContentType(contentType: ContentType): Promise<NoteDTO[]> {
    const notes = await this.dbService.noteDAO.findByContentType(contentType);
    return await this.dbService.noteDAO.toDTOs(notes);
  }

  /**
   * 获取笔记统计信息
   */
  public async getNoteStatistics(): Promise<{
    total: number;
    drafts: number;
    byNotebook: Array<{ notebookId: string; count: number }>;
    byContentType: Array<{ contentType: ContentType; count: number }>;
    recentlyModified: number;
    tags: {
      total: number;
      used: number;
      mostUsed: Array<{ name: string; count: number }>;
    };
  }> {
    const noteStats = await this.dbService.noteDAO.getStatistics();
    const tagStats = await this.dbService.tagDAO.getStatistics();
    const drafts = await this.dbService.noteDAO.count({ is_draft: 1 } as any);

    return {
      total: noteStats.total,
      drafts,
      byNotebook: noteStats.byNotebook,
      byContentType: noteStats.byContentType,
      recentlyModified: noteStats.recentlyModified,
      tags: {
        total: tagStats.total,
        used: tagStats.used,
        mostUsed: tagStats.mostUsed
      }
    };
  }

  /**
   * 创建新标签
   */
  public async createTag(name: string, color?: string): Promise<Tag> {
    return await this.dbService.tagDAO.createTag({
      name,
      color: color || this.getRandomColor()
    });
  }

  /**
   * 创建新笔记本
   */
  public async createNotebook(name: string, color?: string, parentId?: string): Promise<any> {
    return await this.dbService.notebookDAO.createNotebook({
      name,
      color: color || this.getRandomColor(),
      parent_id: parentId,
      sort_order: 0,
      is_shared: 0
    });
  }

  /**
   * 删除未使用的标签
   */
  public async deleteUnusedTags(): Promise<number> {
    return await this.dbService.tagDAO.deleteUnusedTags();
  }

  /**
   * 获取数据库服务实例（用于高级操作）
   */
  public getDatabaseService(): DatabaseService {
    return this.dbService;
  }

  /**
   * 生成随机颜色
   */
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