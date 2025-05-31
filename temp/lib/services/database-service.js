"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const manager_1 = __importDefault(require("../database/manager"));
const note_dao_1 = require("../database/note-dao");
const notebook_dao_1 = require("../database/notebook-dao");
const project_dao_1 = require("../database/project-dao");
const tag_dao_1 = require("../database/tag-dao");
const task_dao_1 = require("../database/task-dao");
const task_time_log_dao_1 = require("../database/task-time-log-dao");
/**
 * 数据库服务类
 * 统一管理所有DAO实例，提供数据库初始化和数据操作接口
 */
class DatabaseService {
    constructor() {
        this._initialized = false;
        this.dbManager = manager_1.default.getInstance();
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    /**
     * 初始化数据库服务
     */
    async init() {
        if (this._initialized) {
            console.log('数据库服务已初始化');
            return;
        }
        try {
            // 初始化数据库管理器
            await this.dbManager.init();
            // 初始化所有DAO实例
            this._taskDAO = new task_dao_1.TaskDAO();
            this._projectDAO = new project_dao_1.ProjectDAO();
            this._noteDAO = new note_dao_1.NoteDAO();
            this._notebookDAO = new notebook_dao_1.NotebookDAO();
            this._tagDAO = new tag_dao_1.TagDAO();
            this._taskTimeLogDAO = new task_time_log_dao_1.TaskTimeLogDAO();
            this._initialized = true;
            console.log('数据库服务初始化完成');
        }
        catch (error) {
            console.error('数据库服务初始化失败:', error);
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
     * 确保服务已初始化
     */
    ensureInitialized() {
        if (!this._initialized) {
            throw new Error('数据库服务未初始化，请先调用 init() 方法');
        }
    }
    /**
     * 获取任务DAO
     */
    get taskDAO() {
        this.ensureInitialized();
        return this._taskDAO;
    }
    /**
     * 获取项目DAO
     */
    get projectDAO() {
        this.ensureInitialized();
        return this._projectDAO;
    }
    /**
     * 获取笔记DAO
     */
    get noteDAO() {
        this.ensureInitialized();
        return this._noteDAO;
    }
    /**
     * 获取笔记本DAO
     */
    get notebookDAO() {
        this.ensureInitialized();
        return this._notebookDAO;
    }
    /**
     * 获取标签DAO
     */
    get tagDAO() {
        this.ensureInitialized();
        return this._tagDAO;
    }
    /**
     * 获取任务时间日志DAO
     */
    get taskTimeLogDAO() {
        this.ensureInitialized();
        return this._taskTimeLogDAO;
    }
    /**
     * 获取数据库管理器
     */
    get databaseManager() {
        this.ensureInitialized();
        return this.dbManager;
    }
    /**
     * 执行事务
     */
    async withTransaction(callback) {
        this.ensureInitialized();
        return await this.dbManager.withTransaction(callback);
    }
    /**
     * 导出所有数据
     */
    async exportData() {
        this.ensureInitialized();
        return await this.dbManager.exportData();
    }
    /**
     * 获取数据库统计信息
     */
    async getStatistics() {
        this.ensureInitialized();
        // 任务统计
        const totalTasks = await this.taskDAO.count();
        const completedTasks = await this.taskDAO.count({ status: 'completed' });
        const activeTasks = await this.taskDAO.findActiveTasks();
        const overdueTasks = await this.taskDAO.findOverdueTasks();
        // 笔记统计
        const noteStats = await this.noteDAO.getStatistics();
        const draftNotes = await this.noteDAO.count({ is_draft: 1 });
        // 项目统计
        const projectStats = await this.projectDAO.getStatistics();
        // 笔记本统计
        const notebookStats = await this.notebookDAO.getStatistics();
        // 标签统计
        const tagStats = await this.tagDAO.getStatistics();
        return {
            tasks: {
                total: totalTasks,
                completed: completedTasks,
                active: activeTasks.length,
                overdue: overdueTasks.length
            },
            notes: {
                total: noteStats.total,
                drafts: draftNotes,
                byNotebook: noteStats.byNotebook
            },
            projects: projectStats,
            notebooks: notebookStats,
            tags: {
                total: tagStats.total,
                used: tagStats.used,
                unused: tagStats.unused
            }
        };
    }
    /**
     * 清理数据库（删除软删除的记录）
     */
    async cleanup() {
        this.ensureInitialized();
        let deletedTasks = 0;
        let deletedNotes = 0;
        let deletedProjects = 0;
        let deletedNotebooks = 0;
        let deletedTags = 0;
        await this.dbManager.withTransaction(async () => {
            // 硬删除所有软删除的记录
            const tables = ['tasks', 'notes', 'projects', 'notebooks', 'tags'];
            for (const table of tables) {
                const result = await this.dbManager.runAsync(`DELETE FROM ${table} WHERE is_deleted_locally = 1`);
                switch (table) {
                    case 'tasks':
                        deletedTasks = result.changes;
                        break;
                    case 'notes':
                        deletedNotes = result.changes;
                        break;
                    case 'projects':
                        deletedProjects = result.changes;
                        break;
                    case 'notebooks':
                        deletedNotebooks = result.changes;
                        break;
                    case 'tags':
                        deletedTags = result.changes;
                        break;
                }
            }
        });
        return {
            deletedTasks,
            deletedNotes,
            deletedProjects,
            deletedNotebooks,
            deletedTags
        };
    }
    /**
     * 重置数据库
     */
    async resetDatabase() {
        this.ensureInitialized();
        await this.dbManager.deleteDatabase();
        this._initialized = false;
        // 重新初始化
        await this.init();
    }
    /**
     * 关闭数据库连接
     */
    async close() {
        if (this._initialized) {
            await this.dbManager.close();
            this._initialized = false;
            this._taskDAO = undefined;
            this._projectDAO = undefined;
            this._noteDAO = undefined;
            this._notebookDAO = undefined;
            this._tagDAO = undefined;
            this._taskTimeLogDAO = undefined;
        }
    }
}
exports.DatabaseService = DatabaseService;
