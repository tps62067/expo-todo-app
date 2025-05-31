import { TaskTimeLog } from '../models/types';
import { BaseDAO } from './base-dao';

export class TaskTimeLogDAO extends BaseDAO<TaskTimeLog> {
  constructor() {
    super('task_time_logs');
    console.log('[TaskTimeLogDAO] 初始化完成，表名:', this.tableName);
  }

  /**
   * 根据任务ID查找所有时间日志
   */
  async findByTaskId(taskId: string): Promise<TaskTimeLog[]> {
    console.log('[TaskTimeLogDAO] 查找任务时间日志, taskId:', taskId);
    try {
      const result = await this.findWhere({ task_id: taskId } as Partial<TaskTimeLog>, 'created_at DESC');
      console.log('[TaskTimeLogDAO] 找到时间日志数量:', result.length);
      return result;
    } catch (error) {
      console.error('[TaskTimeLogDAO] 查找时间日志失败:', error);
      throw error;
    }
  }

  /**
   * 查找正在进行中的时间日志（end_time为空）
   */
  async findActiveLog(taskId: string): Promise<TaskTimeLog | null> {
    console.log('[TaskTimeLogDAO] 查找活动时间日志, taskId:', taskId);
    try {
      const sql = `
        SELECT * FROM ${this.tableName} 
        WHERE task_id = ? AND end_time IS NULL AND is_deleted_locally = 0 
        ORDER BY start_time DESC 
        LIMIT 1
      `;
      const result = await this.dbManager.getFirstAsync<TaskTimeLog>(sql, [taskId]);
      console.log('[TaskTimeLogDAO] 活动时间日志查找结果:', result ? '找到' : '未找到');
      return result;
    } catch (error) {
      console.error('[TaskTimeLogDAO] 查找活动时间日志失败:', error);
      throw error;
    }
  }

  /**
   * 查找已完成的时间日志
   */
  async findCompletedLogs(taskId: string): Promise<TaskTimeLog[]> {
    console.log('[TaskTimeLogDAO] 查找已完成时间日志, taskId:', taskId);
    try {
      const sql = `
        SELECT * FROM ${this.tableName} 
        WHERE task_id = ? AND end_time IS NOT NULL AND is_deleted_locally = 0 
        ORDER BY start_time DESC
      `;
      const result = await this.dbManager.getAllAsync<TaskTimeLog>(sql, [taskId]);
      console.log('[TaskTimeLogDAO] 找到已完成时间日志数量:', result.length);
      return result;
    } catch (error) {
      console.error('[TaskTimeLogDAO] 查找已完成时间日志失败:', error);
      throw error;
    }
  }

  /**
   * 结束正在进行的时间日志
   */
  async endActiveLog(taskId: string, endTime?: string): Promise<TaskTimeLog | null> {
    console.log('[TaskTimeLogDAO] 结束活动时间日志, taskId:', taskId, 'endTime:', endTime);
    try {
      const activeLog = await this.findActiveLog(taskId);
      if (!activeLog) {
        console.log('[TaskTimeLogDAO] 没有找到活动时间日志');
        return null;
      }

      const now = endTime || new Date().toISOString();
      const result = await this.update(activeLog.id, { end_time: now });
      console.log('[TaskTimeLogDAO] 时间日志结束成功:', result ? '成功' : '失败');
      return result;
    } catch (error) {
      console.error('[TaskTimeLogDAO] 结束时间日志失败:', error);
      throw error;
    }
  }

  /**
   * 计算任务的总工作时间（分钟）
   */
  async getTotalWorkTime(taskId: string): Promise<number> {
    console.log('[TaskTimeLogDAO] 计算总工作时间, taskId:', taskId);
    try {
      const completedLogs = await this.findCompletedLogs(taskId);
      let totalMinutes = 0;

      for (const log of completedLogs) {
        if (log.start_time && log.end_time) {
          const startTime = new Date(log.start_time);
          const endTime = new Date(log.end_time);
          const diffMs = endTime.getTime() - startTime.getTime();
          const minutes = Math.floor(diffMs / (1000 * 60));
          totalMinutes += minutes;
          console.log('[TaskTimeLogDAO] 日志时长:', minutes, '分钟');
        }
      }

      console.log('[TaskTimeLogDAO] 总工作时间:', totalMinutes, '分钟');
      return totalMinutes;
    } catch (error) {
      console.error('[TaskTimeLogDAO] 计算总工作时间失败:', error);
      return 0;
    }
  }

  /**
   * 获取某个日期范围内的工作日志
   */
  async findLogsByDateRange(taskId: string, startDate: string, endDate: string): Promise<TaskTimeLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE task_id = ? 
        AND start_time >= ? 
        AND start_time <= ? 
        AND is_deleted_locally = 0 
      ORDER BY start_time DESC
    `;
    return await this.dbManager.getAllAsync<TaskTimeLog>(sql, [taskId, startDate, endDate]);
  }

  /**
   * 删除任务的所有时间日志（级联删除）
   */
  async deleteByTaskId(taskId: string): Promise<boolean> {
    const sql = `UPDATE ${this.tableName} SET is_deleted_locally = 1, updated_at = ? WHERE task_id = ?`;
    const result = await this.dbManager.runAsync(sql, [new Date().toISOString(), taskId]);
    return result.changes > 0;
  }
} 