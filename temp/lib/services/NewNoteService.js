"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewNoteService = void 0;
const NoteEvents_1 = require("../events/NoteEvents");
const BaseService_1 = require("./BaseService");
/**
 * 新架构的笔记服务
 * 实现笔记的业务逻辑、验证和事件发布
 */
class NewNoteService extends BaseService_1.BaseService {
    constructor(noteRepository, tagDAO, eventBus) {
        super(eventBus);
        this.noteRepository = noteRepository;
        this.tagDAO = tagDAO;
    }
    /**
     * 创建笔记
     */
    async createNote(formData) {
        console.log('[NewNoteService] 开始创建笔记，输入数据:', formData);
        // 验证数据
        this.validateNoteData(formData);
        try {
            // 处理标签：创建或获取标签
            let tagIds = [];
            if (formData.tags && formData.tags.length > 0) {
                console.log('[NewNoteService] 处理标签:', formData.tags);
                const tags = await this.tagDAO.createOrGetTagsByNames(formData.tags);
                tagIds = tags.map(tag => tag.id);
                console.log('[NewNoteService] 标签处理完成，tagIds:', tagIds);
            }
            // 创建笔记数据
            const noteData = {
                title: formData.title,
                content: formData.content,
                category: formData.category,
                color: formData.color,
                is_pinned: formData.is_pinned,
                is_archived: formData.is_archived,
            };
            console.log('[NewNoteService] 准备创建笔记，数据:', noteData);
            // 创建笔记
            const note = await this.noteRepository.create(noteData);
            console.log('[NewNoteService] 笔记创建成功:', note.id);
            // 关联标签
            if (tagIds.length > 0) {
                console.log('[NewNoteService] 开始关联标签...');
                for (const tagId of tagIds) {
                    await this.noteRepository.addTag(note.id, tagId);
                }
                console.log('[NewNoteService] 标签关联完成');
            }
            // 发布创建事件
            await this.publishEvent(new NoteEvents_1.NoteCreatedEvent(note.id, { note }));
            const result = this.toDTO(note, formData.tags || []);
            console.log('[NewNoteService] 笔记创建流程完成，返回结果:', result);
            return result;
        }
        catch (error) {
            console.error('[NewNoteService] 创建笔记失败，错误详情:', error);
            throw new BaseService_1.BusinessError('创建笔记失败');
        }
    }
    /**
     * 更新笔记
     */
    async updateNote(id, formData) {
        // 验证笔记存在
        const existingNote = await this.noteRepository.findById(id);
        if (!existingNote) {
            throw new BaseService_1.BusinessError('笔记不存在');
        }
        // 验证数据（仅验证提供的字段）
        this.validateNoteData(formData);
        try {
            // 处理标签更新
            if (formData.tags !== undefined) {
                // 获取当前标签
                const currentTags = await this.noteRepository.getTags(id);
                // 创建或获取新标签
                const newTags = formData.tags.length > 0
                    ? await this.tagDAO.createOrGetTagsByNames(formData.tags)
                    : [];
                // 移除不在新标签列表中的旧标签
                for (const currentTag of currentTags) {
                    if (!newTags.find(tag => tag.id === currentTag.id)) {
                        await this.noteRepository.removeTag(id, currentTag.id);
                    }
                }
                // 添加不在当前标签列表中的新标签
                for (const newTag of newTags) {
                    if (!currentTags.find(tag => tag.id === newTag.id)) {
                        await this.noteRepository.addTag(id, newTag.id);
                    }
                }
            }
            // 更新笔记数据
            const updateData = { ...formData };
            delete updateData.tags; // 移除tags字段，因为已经单独处理
            const updatedNote = await this.noteRepository.update(id, updateData);
            if (updatedNote) {
                // 发布更新事件
                const changes = {};
                if (formData.title !== undefined)
                    changes.title = formData.title;
                if (formData.content !== undefined)
                    changes.content = formData.content;
                if (formData.category !== undefined)
                    changes.category = formData.category;
                if (formData.tags !== undefined)
                    changes.tags = formData.tags;
                if (formData.color !== undefined)
                    changes.color = formData.color;
                if (formData.is_pinned !== undefined)
                    changes.is_pinned = formData.is_pinned ? 1 : 0;
                if (formData.is_archived !== undefined)
                    changes.is_archived = formData.is_archived ? 1 : 0;
                await this.publishEvent(new NoteEvents_1.NoteUpdatedEvent(id, {
                    note: updatedNote,
                    changes
                }));
                // 获取更新后的标签信息
                const updatedTags = await this.noteRepository.getTags(id);
                const updatedTagNames = updatedTags.map(tag => tag.name);
                return this.toDTO(updatedNote, updatedTagNames);
            }
            return null;
        }
        catch (error) {
            console.error('更新笔记失败:', error);
            throw new BaseService_1.BusinessError('更新笔记失败');
        }
    }
    /**
     * 删除笔记
     */
    async deleteNote(id) {
        // 验证笔记存在
        const existingNote = await this.noteRepository.findById(id);
        if (!existingNote) {
            throw new BaseService_1.BusinessError('笔记不存在');
        }
        try {
            const success = await this.noteRepository.delete(id);
            if (success) {
                // 发布删除事件
                await this.publishEvent(new NoteEvents_1.NoteDeletedEvent(id, { noteId: id }));
            }
            return success;
        }
        catch (error) {
            console.error('删除笔记失败:', error);
            throw new BaseService_1.BusinessError('删除笔记失败');
        }
    }
    /**
     * 获取笔记详情
     */
    async getNoteById(id) {
        const note = await this.noteRepository.findById(id);
        if (!note)
            return null;
        // 获取标签信息
        const tags = await this.noteRepository.getTags(id);
        const tagNames = tags.map(tag => tag.name);
        return this.toDTO(note, tagNames);
    }
    /**
     * 获取所有笔记
     */
    async getAllNotes() {
        const notes = await this.noteRepository.findAll();
        const notesWithTags = [];
        for (const note of notes) {
            const tags = await this.noteRepository.getTags(note.id);
            const tagNames = tags.map(tag => tag.name);
            notesWithTags.push(this.toDTO(note, tagNames));
        }
        return notesWithTags;
    }
    /**
     * 按分类获取笔记
     */
    async getNotesByCategory(category) {
        const notes = await this.noteRepository.findByCategory(category);
        const notesWithTags = [];
        for (const note of notes) {
            const tags = await this.noteRepository.getTags(note.id);
            const tagNames = tags.map(tag => tag.name);
            notesWithTags.push(this.toDTO(note, tagNames));
        }
        return notesWithTags;
    }
    /**
     * 搜索笔记
     */
    async searchNotes(query) {
        if (!query.trim()) {
            return [];
        }
        const notes = await this.noteRepository.searchByContent(query);
        const notesWithTags = [];
        for (const note of notes) {
            const tags = await this.noteRepository.getTags(note.id);
            const tagNames = tags.map(tag => tag.name);
            notesWithTags.push(this.toDTO(note, tagNames));
        }
        return notesWithTags;
    }
    /**
     * 按标签获取笔记
     */
    async getNotesByTag(tag) {
        const notes = await this.noteRepository.findByTagName(tag);
        const notesWithTags = [];
        for (const note of notes) {
            const tags = await this.noteRepository.getTags(note.id);
            const tagNames = tags.map(tag => tag.name);
            notesWithTags.push(this.toDTO(note, tagNames));
        }
        return notesWithTags;
    }
    /**
     * 获取置顶笔记
     */
    async getPinnedNotes() {
        const notes = await this.noteRepository.findPinned();
        const notesWithTags = [];
        for (const note of notes) {
            const tags = await this.noteRepository.getTags(note.id);
            const tagNames = tags.map(tag => tag.name);
            notesWithTags.push(this.toDTO(note, tagNames));
        }
        return notesWithTags;
    }
    /**
     * 获取已归档笔记
     */
    async getArchivedNotes() {
        const notes = await this.noteRepository.findArchived();
        const notesWithTags = [];
        for (const note of notes) {
            const tags = await this.noteRepository.getTags(note.id);
            const tagNames = tags.map(tag => tag.name);
            notesWithTags.push(this.toDTO(note, tagNames));
        }
        return notesWithTags;
    }
    /**
     * 置顶/取消置顶笔记
     */
    async togglePin(id) {
        const note = await this.noteRepository.findById(id);
        if (!note) {
            throw new BaseService_1.BusinessError('笔记不存在');
        }
        const updatedNote = await this.noteRepository.update(id, {
            is_pinned: !note.is_pinned,
        });
        if (!updatedNote)
            return null;
        const tags = await this.noteRepository.getTags(id);
        const tagNames = tags.map(tag => tag.name);
        return this.toDTO(updatedNote, tagNames);
    }
    /**
     * 归档/取消归档笔记
     */
    async toggleArchive(id) {
        const note = await this.noteRepository.findById(id);
        if (!note) {
            throw new BaseService_1.BusinessError('笔记不存在');
        }
        const updatedNote = await this.noteRepository.update(id, {
            is_archived: !note.is_archived,
        });
        if (!updatedNote)
            return null;
        const tags = await this.noteRepository.getTags(id);
        const tagNames = tags.map(tag => tag.name);
        return this.toDTO(updatedNote, tagNames);
    }
    /**
     * 验证笔记数据
     */
    validateNoteData(data) {
        if (!data.title?.trim()) {
            throw new BaseService_1.ValidationError('笔记标题不能为空');
        }
        if (data.title.length > 200) {
            throw new BaseService_1.ValidationError('笔记标题不能超过200个字符');
        }
        if (data.content && data.content.length > 50000) {
            throw new BaseService_1.ValidationError('笔记内容不能超过50000个字符');
        }
        if (data.category && data.category.length > 50) {
            throw new BaseService_1.ValidationError('分类名称不能超过50个字符');
        }
        if (data.tags && data.tags.length > 20) {
            throw new BaseService_1.ValidationError('标签数量不能超过20个');
        }
    }
    /**
     * 转换为DTO
     */
    toDTO(note, tags) {
        return {
            id: note.id,
            title: note.title,
            content: note.content,
            category: note.category,
            tags: tags,
            color: note.color,
            is_pinned: note.is_pinned || false,
            is_archived: note.is_archived || false,
            created_at: note.created_at,
            updated_at: note.updated_at,
        };
    }
}
exports.NewNoteService = NewNoteService;
