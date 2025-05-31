"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteService = void 0;
const database_service_1 = require("./database-service");
/**
 * 笔记服务类
 * 提供笔记相关的业务逻辑和数据操作
 */
class NoteService {
    constructor() {
        this.dbService = database_service_1.DatabaseService.getInstance();
    }
    static getInstance() {
        if (!NoteService.instance) {
            NoteService.instance = new NoteService();
        }
        return NoteService.instance;
    }
    /**
     * 初始化服务
     */
    async init() {
        await this.dbService.init();
    }
    /**
     * 创建新笔记
     */
    async createNote(formData) {
        // 查找或创建笔记本
        let notebookId;
        if (formData.category && formData.category !== '默认笔记本') {
            const notebooks = await this.dbService.notebookDAO.searchByName(formData.category);
            if (notebooks.length > 0) {
                notebookId = notebooks[0].id;
            }
            else {
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
            content_type: 'plain',
            is_draft: 0,
            notebook_id: notebookId,
            is_pinned: formData.is_pinned !== undefined ? (formData.is_pinned ? 1 : 0) : 0,
            is_archived: formData.is_archived !== undefined ? (formData.is_archived ? 1 : 0) : 0
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
    async getAllNotes() {
        const notes = await this.dbService.noteDAO.findAll('updated_at DESC');
        return await this.dbService.noteDAO.toDTOs(notes);
    }
    /**
     * 获取最近更新的笔记
     */
    async getRecentNotes(limit = 10) {
        const notes = await this.dbService.noteDAO.findRecentlyUpdated(limit);
        return await this.dbService.noteDAO.toDTOs(notes);
    }
    /**
     * 根据ID获取笔记
     */
    async getNoteById(id) {
        const note = await this.dbService.noteDAO.findById(id);
        if (!note)
            return null;
        return await this.dbService.noteDAO.toDTO(note);
    }
    /**
     * 更新笔记
     */
    async updateNote(id, updates) {
        const note = await this.dbService.noteDAO.updateNote(id, updates);
        if (!note)
            return null;
        return await this.dbService.noteDAO.toDTO(note);
    }
    /**
     * 删除笔记
     */
    async deleteNote(id) {
        return await this.dbService.noteDAO.softDelete(id);
    }
    /**
     * 根据笔记本获取笔记
     */
    async getNotesByNotebook(notebookId) {
        const notes = await this.dbService.noteDAO.findByNotebook(notebookId);
        return await this.dbService.noteDAO.toDTOs(notes);
    }
    /**
     * 根据标签获取笔记
     */
    async getNotesByTag(tagId) {
        const notes = await this.dbService.noteDAO.findByTag(tagId);
        return await this.dbService.noteDAO.toDTOs(notes);
    }
    /**
     * 搜索笔记
     */
    async searchNotes(query, notebookId) {
        const notes = await this.dbService.noteDAO.search(query, notebookId);
        return await this.dbService.noteDAO.toDTOs(notes);
    }
    /**
     * 为笔记添加标签
     */
    async addTagToNote(noteId, tagName) {
        const tags = await this.dbService.tagDAO.createOrGetTagsByNames([tagName]);
        if (tags.length === 0)
            return false;
        return await this.dbService.noteDAO.addTag(noteId, tags[0].id);
    }
    /**
     * 从笔记移除标签
     */
    async removeTagFromNote(noteId, tagId) {
        return await this.dbService.noteDAO.removeTag(noteId, tagId);
    }
    /**
     * 获取笔记的标签
     */
    async getNoteTags(noteId) {
        return await this.dbService.noteDAO.getTags(noteId);
    }
    /**
     * 获取所有标签
     */
    async getAllTags() {
        return await this.dbService.tagDAO.findAllTags();
    }
    /**
     * 获取最常用的标签
     */
    async getMostUsedTags(limit = 10) {
        return await this.dbService.tagDAO.getMostUsedTags(limit);
    }
    /**
     * 获取所有笔记本
     */
    async getAllNotebooks() {
        return await this.dbService.notebookDAO.findAllNotebooks();
    }
    /**
     * 获取根级笔记本
     */
    async getRootNotebooks() {
        return await this.dbService.notebookDAO.findRootNotebooks();
    }
    /**
     * 根据内容类型获取笔记
     */
    async getNotesByContentType(contentType) {
        const notes = await this.dbService.noteDAO.findByContentType(contentType);
        return await this.dbService.noteDAO.toDTOs(notes);
    }
    /**
     * 获取笔记统计信息
     */
    async getNoteStatistics() {
        const noteStats = await this.dbService.noteDAO.getStatistics();
        const tagStats = await this.dbService.tagDAO.getStatistics();
        const drafts = await this.dbService.noteDAO.count({ is_draft: 1 });
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
    async createTag(name, color) {
        return await this.dbService.tagDAO.createTag({
            name,
            color: color || this.getRandomColor()
        });
    }
    /**
     * 创建新笔记本
     */
    async createNotebook(name, color, parentId) {
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
    async deleteUnusedTags() {
        return await this.dbService.tagDAO.deleteUnusedTags();
    }
    /**
     * 获取数据库服务实例（用于高级操作）
     */
    getDatabaseService() {
        return this.dbService;
    }
    /**
     * 生成随机颜色
     */
    getRandomColor() {
        const colors = [
            '#F44336', '#E91E63', '#9C27B0', '#673AB7',
            '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
            '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
            '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
exports.NoteService = NoteService;
