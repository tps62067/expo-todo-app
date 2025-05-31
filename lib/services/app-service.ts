import { DatabaseService } from './database-service';
import { NoteService } from './note-service';
import { TaskService } from './task-service';

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
export class AppService {
  private static instance: AppService;
  private _initialized = false;
  private databaseService: DatabaseService;
  private taskService: TaskService;
  private noteService: NoteService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.taskService = TaskService.getInstance();
    this.noteService = NoteService.getInstance();
  }

  public static getInstance(): AppService {
    if (!AppService.instance) {
      AppService.instance = new AppService();
    }
    return AppService.instance;
  }

  /**
   * 初始化应用
   */
  public async initializeApp(): Promise<void> {
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
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否已初始化
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 获取任务服务
   */
  public get tasks(): TaskService {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.taskService;
  }

  /**
   * 获取笔记服务
   */
  public get notes(): NoteService {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.noteService;
  }

  /**
   * 获取数据库服务
   */
  public get database(): DatabaseService {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.databaseService;
  }

  /**
   * 输出统计信息
   */
  private async logStatistics(): Promise<void> {
    try {
      const stats = await this.databaseService.getStatistics();
      console.log('📊 数据库统计信息:');
      console.log(`  任务: ${stats.tasks.total} (活跃: ${stats.tasks.active}, 已完成: ${stats.tasks.completed})`);
      console.log(`  笔记: ${stats.notes.total} (草稿: ${stats.notes.drafts})`);
      console.log(`  项目: ${stats.projects.total}`);
      console.log(`  笔记本: ${stats.notebooks.total}`);
      console.log(`  标签: ${stats.tags.total} (使用中: ${stats.tags.used})`);
    } catch (error) {
      console.warn('获取统计信息失败:', error);
    }
  }

  /**
   * 重置应用数据
   */
  public async resetApp(): Promise<void> {
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
  public async cleanupApp(): Promise<void> {
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
  public async exportAppData(): Promise<string> {
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
  public async shutdown(): Promise<void> {
    if (this._initialized) {
      console.log('关闭应用服务...');
      await this.databaseService.close();
      this._initialized = false;
      console.log('✓ 应用服务已关闭');
    }
  }
}

// 全局应用服务实例
export const appService = AppService.getInstance(); 