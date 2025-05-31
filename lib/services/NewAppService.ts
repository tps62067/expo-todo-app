import { Container } from '../container/Container';
import { createContainer } from '../container/ServiceRegistry';
import { EventBus } from '../events/EventBus';
import { INoteRepository } from '../repositories/interfaces/INoteRepository';
import { ITaskRepository } from '../repositories/interfaces/ITaskRepository';
import { DatabaseService } from './database-service';
import { NewNoteService } from './NewNoteService';
import { NewTaskService } from './NewTaskService';

/**
 * 新架构的应用服务类
 * 使用依赖注入容器和事件驱动架构
 */
export class NewAppService {
  private static instance: NewAppService;
  private _initialized = false;
  private container: Container;

  private constructor() {
    this.container = createContainer();
  }

  public static getInstance(): NewAppService {
    if (!NewAppService.instance) {
      NewAppService.instance = new NewAppService();
    }
    return NewAppService.instance;
  }

  /**
   * 初始化应用
   */
  public async initializeApp(): Promise<void> {
    if (this._initialized) {
      console.log('新架构应用已初始化');
      return;
    }

    try {
      console.log('开始初始化新架构应用...');

      // 初始化数据库服务
      const databaseService = this.container.resolve<DatabaseService>('databaseService');
      await databaseService.init();
      console.log('✓ 数据库服务初始化完成');

      this._initialized = true;
      console.log('✓ 新架构应用初始化完成');

      // 输出一些统计信息
      await this.logStatistics();
    } catch (error) {
      console.error('❌ 新架构应用初始化失败:', error);
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
  public get tasks(): NewTaskService {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.container.resolve<NewTaskService>('taskService');
  }

  /**
   * 获取笔记服务
   */
  public get notes(): NewNoteService {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.container.resolve<NewNoteService>('noteService');
  }

  /**
   * 获取事件总线
   */
  public get eventBus(): EventBus {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.container.resolve<EventBus>('eventBus');
  }

  /**
   * 获取任务Repository
   */
  public get taskRepository(): ITaskRepository {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.container.resolve<ITaskRepository>('taskRepository');
  }

  /**
   * 获取笔记Repository
   */
  public get noteRepository(): INoteRepository {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.container.resolve<INoteRepository>('noteRepository');
  }

  /**
   * 获取数据库服务
   */
  public get database(): DatabaseService {
    if (!this._initialized) {
      throw new Error('应用未初始化，请先调用 initializeApp()');
    }
    return this.container.resolve<DatabaseService>('databaseService');
  }

  /**
   * 获取容器（用于高级操作）
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * 输出统计信息
   */
  private async logStatistics(): Promise<void> {
    try {
      const databaseService = this.container.resolve<DatabaseService>('databaseService');
      const stats = await databaseService.getStatistics();
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
    const databaseService = this.container.resolve<DatabaseService>('databaseService');
    await databaseService.resetDatabase();
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
    const databaseService = this.container.resolve<DatabaseService>('databaseService');
    const result = await databaseService.cleanup();
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
    const databaseService = this.container.resolve<DatabaseService>('databaseService');
    const data = await databaseService.exportData();
    console.log('✓ 数据导出完成');
    return data;
  }

  /**
   * 关闭应用服务
   */
  public async shutdown(): Promise<void> {
    if (this._initialized) {
      console.log('关闭新架构应用服务...');
      const databaseService = this.container.resolve<DatabaseService>('databaseService');
      await databaseService.close();
      this.container.clear();
      this._initialized = false;
      console.log('✓ 新架构应用服务已关闭');
    }
  }
}

// 全局新架构应用服务实例
export const newAppService = NewAppService.getInstance(); 