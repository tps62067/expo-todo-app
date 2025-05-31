"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appService = exports.AppService = void 0;
const database_service_1 = require("./database-service");
const note_service_1 = require("./note-service");
const task_service_1 = require("./task-service");
/**
 * 应用服务类 (旧架构)
 * 负责应用初始化和全局服务管理
 *
 * @deprecated 此类属于旧架构，建议使用新架构的 NewAppService
 * 新架构提供更好的依赖注入、事件系统和类型安全
 *
 * 迁移指南:
 * - 使用 newAppService 替代 appService
 * - 使用 useNewTaskService() 替代 taskService
 * - 使用 useNewNoteService() 替代 noteService
 */
class AppService {
    constructor() {
        this._initialized = false;
        this.databaseService = database_service_1.DatabaseService.getInstance();
        this.taskService = task_service_1.TaskService.getInstance();
        this.noteService = note_service_1.NoteService.getInstance();
    }
    static getInstance() {
        if (!AppService.instance) {
            AppService.instance = new AppService();
        }
        return AppService.instance;
    }
    /**
     * 初始化应用
     */
    async initializeApp() {
        if (this._initialized) {
            console.log('应用已初始化');
            return;
        }
        try {
            console.log('开始初始化应用...');
            // 初始化数据库服务
            await this.databaseService.init();
            console.log('✓ 数据库服务初始化完成');
            // 初始化任务服务
            await this.taskService.init();
            console.log('✓ 任务服务初始化完成');
            // 初始化笔记服务
            await this.noteService.init();
            console.log('✓ 笔记服务初始化完成');
            this._initialized = true;
            console.log('✓ 应用初始化完成');
            // 输出一些统计信息
            await this.logStatistics();
        }
        catch (error) {
            console.error('❌ 应用初始化失败:', error);
            throw error;
        }
    }
    /**
     * 检查是否已初始化
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * 获取任务服务
     */
    get tasks() {
        if (!this._initialized) {
            throw new Error('应用未初始化，请先调用 initializeApp()');
        }
        return this.taskService;
    }
    /**
     * 获取笔记服务
     */
    get notes() {
        if (!this._initialized) {
            throw new Error('应用未初始化，请先调用 initializeApp()');
        }
        return this.noteService;
    }
    /**
     * 获取数据库服务
     */
    get database() {
        if (!this._initialized) {
            throw new Error('应用未初始化，请先调用 initializeApp()');
        }
        return this.databaseService;
    }
    /**
     * 输出统计信息
     */
    async logStatistics() {
        try {
            const stats = await this.databaseService.getStatistics();
            console.log('📊 数据库统计信息:');
            console.log(`  任务: ${stats.tasks.total} (活跃: ${stats.tasks.active}, 已完成: ${stats.tasks.completed})`);
            console.log(`  笔记: ${stats.notes.total} (草稿: ${stats.notes.drafts})`);
            console.log(`  项目: ${stats.projects.total}`);
            console.log(`  笔记本: ${stats.notebooks.total}`);
            console.log(`  标签: ${stats.tags.total} (使用中: ${stats.tags.used})`);
        }
        catch (error) {
            console.warn('获取统计信息失败:', error);
        }
    }
    /**
     * 重置应用数据
     */
    async resetApp() {
        if (!this._initialized) {
            throw new Error('应用未初始化');
        }
        console.log('重置应用数据...');
        await this.databaseService.resetDatabase();
        this._initialized = false;
        // 重新初始化
        await this.initializeApp();
        console.log('✓ 应用数据重置完成');
    }
    /**
     * 清理应用数据
     */
    async cleanupApp() {
        if (!this._initialized) {
            throw new Error('应用未初始化');
        }
        console.log('清理应用数据...');
        const result = await this.databaseService.cleanup();
        console.log('✓ 清理完成:', result);
    }
    /**
     * 导出应用数据
     */
    async exportAppData() {
        if (!this._initialized) {
            throw new Error('应用未初始化');
        }
        console.log('导出应用数据...');
        const data = await this.databaseService.exportData();
        console.log('✓ 数据导出完成');
        return data;
    }
    /**
     * 关闭应用服务
     */
    async shutdown() {
        if (this._initialized) {
            console.log('关闭应用服务...');
            await this.databaseService.close();
            this._initialized = false;
            console.log('✓ 应用服务已关闭');
        }
    }
}
exports.AppService = AppService;
// 全局应用服务实例
exports.appService = AppService.getInstance();
