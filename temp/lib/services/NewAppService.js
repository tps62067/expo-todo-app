"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newAppService = exports.NewAppService = void 0;
const ServiceRegistry_1 = require("../container/ServiceRegistry");
/**
 * 新架构的应用服务类
 * 使用依赖注入容器和事件驱动架构
 */
class NewAppService {
    constructor() {
        this._initialized = false;
        this.container = (0, ServiceRegistry_1.createContainer)();
    }
    static getInstance() {
        if (!NewAppService.instance) {
            NewAppService.instance = new NewAppService();
        }
        return NewAppService.instance;
    }
    /**
     * 初始化应用
     */
    async initializeApp() {
        if (this._initialized) {
            console.log('新架构应用已初始化');
            return;
        }
        try {
            console.log('开始初始化新架构应用...');
            // 初始化数据库服务
            const databaseService = this.container.resolve('databaseService');
            await databaseService.init();
            console.log('✓ 数据库服务初始化完成');
            this._initialized = true;
            console.log('✓ 新架构应用初始化完成');
            // 输出一些统计信息
            await this.logStatistics();
        }
        catch (error) {
            console.error('❌ 新架构应用初始化失败:', error);
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
        return this.container.resolve('taskService');
    }
    /**
     * 获取笔记服务
     */
    get notes() {
        if (!this._initialized) {
            throw new Error('应用未初始化，请先调用 initializeApp()');
        }
        return this.container.resolve('noteService');
    }
    /**
     * 获取事件总线
     */
    get eventBus() {
        if (!this._initialized) {
            throw new Error('应用未初始化，请先调用 initializeApp()');
        }
        return this.container.resolve('eventBus');
    }
    /**
     * 获取任务Repository
     */
    get taskRepository() {
        if (!this._initialized) {
            throw new Error('应用未初始化，请先调用 initializeApp()');
        }
        return this.container.resolve('taskRepository');
    }
    /**
     * 获取笔记Repository
     */
    get noteRepository() {
        if (!this._initialized) {
            throw new Error('应用未初始化，请先调用 initializeApp()');
        }
        return this.container.resolve('noteRepository');
    }
    /**
     * 获取数据库服务
     */
    get database() {
        if (!this._initialized) {
            throw new Error('应用未初始化，请先调用 initializeApp()');
        }
        return this.container.resolve('databaseService');
    }
    /**
     * 获取容器（用于高级操作）
     */
    getContainer() {
        return this.container;
    }
    /**
     * 输出统计信息
     */
    async logStatistics() {
        try {
            const databaseService = this.container.resolve('databaseService');
            const stats = await databaseService.getStatistics();
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
        const databaseService = this.container.resolve('databaseService');
        await databaseService.resetDatabase();
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
        const databaseService = this.container.resolve('databaseService');
        const result = await databaseService.cleanup();
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
        const databaseService = this.container.resolve('databaseService');
        const data = await databaseService.exportData();
        console.log('✓ 数据导出完成');
        return data;
    }
    /**
     * 关闭应用服务
     */
    async shutdown() {
        if (this._initialized) {
            console.log('关闭新架构应用服务...');
            const databaseService = this.container.resolve('databaseService');
            await databaseService.close();
            this.container.clear();
            this._initialized = false;
            console.log('✓ 新架构应用服务已关闭');
        }
    }
}
exports.NewAppService = NewAppService;
// 全局新架构应用服务实例
exports.newAppService = NewAppService.getInstance();
