import * as SQLite from 'expo-sqlite';
import {
  CREATE_INDEXES,
  CREATE_TABLES,
  CREATE_TASK_TIME_LOGS_TABLE,
  DATABASE_NAME,
  DATABASE_VERSION,
  INSERT_DEFAULT_DATA
} from './schema';

class DatabaseManager {
  private static instance: DatabaseManager;
  private database: SQLite.SQLiteDatabase | null = null;
  private _initialized = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库
   */
  public async init(): Promise<void> {
    if (this._initialized) {
      console.log('数据库管理器已初始化');
      return;
    }

    try {
      console.log('初始化数据库管理器...');
      
      // 打开或创建数据库
      this.database = await SQLite.openDatabaseAsync(DATABASE_NAME);
      
      console.log('数据库连接成功');

      // 检查并迁移数据库
      await this.checkAndMigrateDatabase();

      // 修复task_time_logs表结构
      await this.fixTaskTimeLogsTable();

      // 修复notes表结构
      await this.fixNotesTable();

      this._initialized = true;
      console.log('数据库管理器初始化完成');
    } catch (error) {
      console.error('数据库管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据库实例
   */
  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.database) {
      throw new Error('数据库未初始化，请先调用 init() 方法');
    }
    return this.database;
  }

  /**
   * 获取数据库实例（别名）
   */
  public get db(): SQLite.SQLiteDatabase {
    return this.getDatabase();
  }

  /**
   * 检查是否已初始化
   */
  public isInitialized(): boolean {
    return this._initialized && this.database !== null;
  }

  /**
   * 检查并迁移数据库
   */
  private async checkAndMigrateDatabase(): Promise<void> {
    if (!this.database) return;

    try {
      // 获取当前数据库版本
      const result = await this.database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
      const currentVersion = result?.user_version || 0;

      console.log(`当前数据库版本: ${currentVersion}, 目标版本: ${DATABASE_VERSION}`);

      if (currentVersion < DATABASE_VERSION) {
        await this.migrateDatabase(currentVersion, DATABASE_VERSION);
      }
    } catch (error) {
      console.error('数据库版本检查失败:', error);
      throw error;
    }
  }

  /**
   * 数据库迁移
   */
  private async migrateDatabase(fromVersion: number, toVersion: number): Promise<void> {
    if (!this.database) return;

    console.log(`开始数据库迁移: ${fromVersion} -> ${toVersion}`);

    try {
      await this.database.withTransactionAsync(async () => {
        if (fromVersion === 0) {
          // 首次创建数据库
          await this.createTables();
          await this.createIndexes();
          await this.insertDefaultData();
        }

        // 这里可以添加更多版本的迁移逻辑
        // if (fromVersion === 1 && toVersion >= 2) {
        //   await this.migrateFromV1ToV2();
        // }

        // 更新数据库版本
        await this.database!.runAsync(`PRAGMA user_version = ${toVersion};`);
      });

      console.log('数据库迁移完成');
    } catch (error) {
      console.error('数据库迁移失败:', error);
      throw error;
    }
  }

  /**
   * 创建所有表
   */
  private async createTables(): Promise<void> {
    if (!this.database) return;

    console.log('创建数据库表...');
    
    for (const createTableSQL of CREATE_TABLES) {
      await this.database.runAsync(createTableSQL);
    }
  }

  /**
   * 创建索引
   */
  private async createIndexes(): Promise<void> {
    if (!this.database) return;

    console.log('创建数据库索引...');
    
    for (const createIndexSQL of CREATE_INDEXES) {
      await this.database.runAsync(createIndexSQL);
    }
  }

  /**
   * 插入默认数据
   */
  private async insertDefaultData(): Promise<void> {
    if (!this.database) return;

    console.log('插入默认数据...');
    
    for (const insertSQL of INSERT_DEFAULT_DATA) {
      await this.database.runAsync(insertSQL);
    }
  }

  /**
   * 执行事务
   */
  public async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    let result: T;
    await this.database.withTransactionAsync(async () => {
      result = await callback();
    });
    return result!;
  }

  /**
   * 执行SQL查询（返回多行）
   */
  public async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    return await this.database.getAllAsync<T>(sql, params);
  }

  /**
   * 执行SQL查询（返回单行）
   */
  public async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    return await this.database.getFirstAsync<T>(sql, params);
  }

  /**
   * 执行SQL语句（插入、更新、删除）
   */
  public async runAsync(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    return await this.database.runAsync(sql, params);
  }

  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
    if (this.database) {
      await this.database.closeAsync();
      this.database = null;
      console.log('数据库连接已关闭');
    }
  }

  /**
   * 删除数据库
   */
  public async deleteDatabase(): Promise<void> {
    try {
      await this.close();
      await SQLite.deleteDatabaseAsync(DATABASE_NAME);
      console.log('数据库已删除');
    } catch (error) {
      console.error('删除数据库失败:', error);
      throw error;
    }
  }

  /**
   * 导出数据库数据为JSON
   */
  public async exportData(): Promise<string> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    try {
      const exportData: any = {};

      // 导出各个表的数据
      const tables = ['tasks', 'projects', 'notes', 'notebooks', 'tags', 'note_tags'];
      
      for (const table of tables) {
        const data = await this.getAllAsync(`SELECT * FROM ${table} WHERE is_deleted_locally = 0`);
        exportData[table] = data;
      }

      exportData.export_time = new Date().toISOString();
      exportData.version = DATABASE_VERSION;

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出数据失败:', error);
      throw error;
    }
  }

  /**
   * 修复task_time_logs表结构
   */
  private async fixTaskTimeLogsTable(): Promise<void> {
    try {
      console.log('检查task_time_logs表结构...');
      
      // 检查表是否存在以及字段是否正确
      const tableInfo = await this.getAllAsync<any>(`PRAGMA table_info(task_time_logs)`);
      
      if (tableInfo.length === 0) {
        console.log('task_time_logs表不存在，将在创建表时自动创建');
        return;
      }
      
      // 检查必要字段是否存在
      const columns = tableInfo.map((col: any) => col.name);
      const requiredColumns = [
        'id', 'task_id', 'start_time', 'end_time', 'description',
        'created_at', 'updated_at', 'sync_status', 'last_synced_at',
        'local_version', 'remote_version_token', 'is_deleted_locally'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('task_time_logs表缺少字段:', missingColumns);
        
        // 备份现有数据
        const existingData = await this.getAllAsync<any>(`SELECT * FROM task_time_logs`);
        
        // 删除旧表
        await this.runAsync(`DROP TABLE IF EXISTS task_time_logs`);
        
        // 创建新表
        await this.runAsync(CREATE_TASK_TIME_LOGS_TABLE);
        
        // 恢复数据（如果有的话）
        for (const row of existingData) {
          const now = new Date().toISOString();
          await this.runAsync(`
            INSERT INTO task_time_logs (
              id, task_id, start_time, end_time, description,
              created_at, updated_at, sync_status, local_version, is_deleted_locally
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, 0)
          `, [
            row.id || this.generateId(),
            row.task_id,
            row.start_time,
            row.end_time,
            row.description,
            row.created_at || now,
            now
          ]);
        }
        
        console.log('task_time_logs表结构修复完成');
      } else {
        console.log('task_time_logs表结构正常');
      }
    } catch (error) {
      console.error('修复task_time_logs表失败:', error);
      // 不抛出错误，继续执行
    }
  }

  /**
   * 修复notes表结构
   */
  private async fixNotesTable(): Promise<void> {
    try {
      console.log('检查notes表结构...');
      
      // 检查表是否存在以及字段是否正确
      const tableInfo = await this.getAllAsync<any>(`PRAGMA table_info(notes)`);
      
      if (tableInfo.length === 0) {
        console.log('notes表不存在，将在创建表时自动创建');
        return;
      }
      
      // 检查必要字段是否存在
      const columns = tableInfo.map((col: any) => col.name);
      const requiredColumns = ['category', 'color', 'is_pinned', 'is_archived'];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('notes表缺少字段:', missingColumns);
        
        // 添加缺失的字段
        for (const column of missingColumns) {
          let sql = '';
          switch (column) {
            case 'category':
              sql = 'ALTER TABLE notes ADD COLUMN category TEXT';
              break;
            case 'color':
              sql = 'ALTER TABLE notes ADD COLUMN color TEXT';
              break;
            case 'is_pinned':
              sql = 'ALTER TABLE notes ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0';
              break;
            case 'is_archived':
              sql = 'ALTER TABLE notes ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0';
              break;
          }
          
          if (sql) {
            await this.runAsync(sql);
            console.log(`已添加字段 ${column} 到notes表`);
          }
        }
        
        // 创建新索引
        const newIndexes = [
          'CREATE INDEX IF NOT EXISTS idx_note_category ON notes(category);',
          'CREATE INDEX IF NOT EXISTS idx_note_is_pinned ON notes(is_pinned);',
          'CREATE INDEX IF NOT EXISTS idx_note_is_archived ON notes(is_archived);'
        ];
        
        for (const indexSQL of newIndexes) {
          try {
            await this.runAsync(indexSQL);
          } catch (error) {
            console.warn('创建索引失败:', indexSQL, error);
          }
        }
        
        console.log('notes表结构修复完成');
      } else {
        console.log('notes表结构正常');
      }
    } catch (error) {
      console.error('修复notes表失败:', error);
      // 不抛出错误，继续执行
    }
  }

  /**
   * 生成UUID
   */
  private generateId(): string {
    return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export default DatabaseManager; 