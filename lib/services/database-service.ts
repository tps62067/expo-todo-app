import DatabaseManager from '../database/manager';
import { NoteDAO } from '../database/note-dao';
import { NotebookDAO } from '../database/notebook-dao';
import { ProjectDAO } from '../database/project-dao';
import { TagDAO } from '../database/tag-dao';
import { TaskDAO } from '../database/task-dao';
import { TaskTimeLogDAO } from '../database/task-time-log-dao';

/**
 * 数据库服务类
 * 统一管理所有DAO实例，提供数据库初始化和数据操作接口
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private dbManager: DatabaseManager;
  private _taskDAO?: TaskDAO;
  private _projectDAO?: ProjectDAO;
  private _noteDAO?: NoteDAO;
  private _notebookDAO?: NotebookDAO;
  private _tagDAO?: TagDAO;
  private _taskTimeLogDAO?: TaskTimeLogDAO;
  private _initialized = false;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 初始化数据库服务
   */
  public async init(): Promise<void> {
    if (this._initialized) {
      console.log('数据库服务已初始化');
      return;
    }

    try {
      console.log('开始初始化数据库服务...');
      
      // 初始化数据库管理器
      await this.dbManager.init();
      console.log('✓ 数据库管理器初始化完成');

      // 初始化所有DAO实例
      this._taskDAO = new TaskDAO();
      this._projectDAO = new ProjectDAO();
      this._noteDAO = new NoteDAO();
      this._notebookDAO = new NotebookDAO();
      this._tagDAO = new TagDAO();
      this._taskTimeLogDAO = new TaskTimeLogDAO();
      console.log('✓ DAO实例创建完成');

      this._initialized = true;
      console.log('✅ 数据库服务初始化完成');
    } catch (error) {
      console.error('❌ 数据库服务初始化失败:', error);
      
      // 尝试降级处理 - 创建基本的DAO实例但不依赖数据库连接
      try {
        console.log('尝试降级模式初始化...');
        this._taskDAO = new TaskDAO();
        this._projectDAO = new ProjectDAO();
        this._noteDAO = new NoteDAO();
        this._notebookDAO = new NotebookDAO();
        this._tagDAO = new TagDAO();
        this._taskTimeLogDAO = new TaskTimeLogDAO();
        
        // 标记为部分初始化
        this._initialized = true;
        console.log('⚠️ 数据库服务以降级模式初始化（某些功能可能不可用）');
      } catch (fallbackError) {
        console.error('❌ 降级模式初始化也失败:', fallbackError);
        throw new Error(`数据库初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }

  /**
   * 检查是否已初始化
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 确保服务已初始化
   */
  private ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error('数据库服务未初始化，请先调用 init() 方法');
    }
  }

  /**
   * 获取任务DAO
   */
  public get taskDAO(): TaskDAO {
    this.ensureInitialized();
    return this._taskDAO!;
  }

  /**
   * 获取项目DAO
   */
  public get projectDAO(): ProjectDAO {
    this.ensureInitialized();
    return this._projectDAO!;
  }

  /**
   * 获取笔记DAO
   */
  public get noteDAO(): NoteDAO {
    this.ensureInitialized();
    return this._noteDAO!;
  }

  /**
   * 获取笔记本DAO
   */
  public get notebookDAO(): NotebookDAO {
    this.ensureInitialized();
    return this._notebookDAO!;
  }

  /**
   * 获取标签DAO
   */
  public get tagDAO(): TagDAO {
    this.ensureInitialized();
    return this._tagDAO!;
  }

  /**
   * 获取任务时间日志DAO
   */
  public get taskTimeLogDAO(): TaskTimeLogDAO {
    this.ensureInitialized();
    return this._taskTimeLogDAO!;
  }

  /**
   * 获取数据库管理器
   */
  public get databaseManager(): DatabaseManager {
    this.ensureInitialized();
    return this.dbManager;
  }

  /**
   * 执行事务
   */
  public async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    this.ensureInitialized();
    return await this.dbManager.withTransaction(callback);
  }

  /**
   * 导出所有数据
   */
  public async exportData(): Promise<string> {
    this.ensureInitialized();
    return await this.dbManager.exportData();
  }

  /**
   * 获取数据库统计信息
   */
  public async getStatistics(): Promise<{
    tasks: {
      total: number;
      completed: number;
      active: number;
      overdue: number;
    };
    notes: {
      total: number;
      drafts: number;
      byNotebook: Array<{ notebookId: string; count: number }>;
    };
    projects: {
      total: number;
      shared: number;
      withTasks: number;
    };
    notebooks: {
      total: number;
      rootLevel: number;
      shared: number;
      withNotes: number;
    };
    tags: {
      total: number;
      used: number;
      unused: number;
    };
  }> {
    this.ensureInitialized();

    // 任务统计
    const totalTasks = await this.taskDAO.count();
    const completedTasks = await this.taskDAO.count({ status: 'completed' } as any);
    const activeTasks = await this.taskDAO.findActiveTasks();
    const overdueTasks = await this.taskDAO.findOverdueTasks();

    // 笔记统计
    const noteStats = await this.noteDAO.getStatistics();
    const draftNotes = await this.noteDAO.count({ is_draft: 1 } as any);

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
  public async cleanup(): Promise<{
    deletedTasks: number;
    deletedNotes: number;
    deletedProjects: number;
    deletedNotebooks: number;
    deletedTags: number;
  }> {
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
        const result = await this.dbManager.runAsync(
          `DELETE FROM ${table} WHERE is_deleted_locally = 1`
        );
        
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
  public async resetDatabase(): Promise<void> {
    this.ensureInitialized();
    await this.dbManager.deleteDatabase();
    this._initialized = false;
    // 重新初始化
    await this.init();
  }

  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
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