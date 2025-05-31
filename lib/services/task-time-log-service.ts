import { TaskTimeLog } from '../models/types';
import { DatabaseService } from './database-service';

export interface CreateWorkLogForm {
  task_id: string;
  description?: string;
  start_time?: string;
  end_time?: string;
}

export interface WorkLogSummary {
  totalLogs: number;
  totalWorkTime: number;
  averageSessionTime: number;
  todayWorkTime: number;
  weekWorkTime: number;
}

export class TaskTimeLogService {
  private static instance: TaskTimeLogService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): TaskTimeLogService {
    if (!TaskTimeLogService.instance) {
      TaskTimeLogService.instance = new TaskTimeLogService();
    }
    return TaskTimeLogService.instance;
  }

  /**
   * 确保数据库服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    try {
      if (!this.dbService.isInitialized()) {
        console.log('[TaskTimeLogService] 数据库服务未初始化，正在初始化...');
        await this.dbService.init();
        console.log('[TaskTimeLogService] 数据库服务初始化完成');
      }
    } catch (error) {
      console.error('[TaskTimeLogService] 数据库服务初始化失败:', error);
      throw new Error('数据库服务初始化失败');
    }
  }

  /**
   * 开始工作计时
   */
  async startWorkTimer(taskId: string, description?: string): Promise<TaskTimeLog> {
    try {
      console.log('[TaskTimeLogService] 开始工作计时, taskId:', taskId);
      await this.ensureInitialized();
      
      // 检查是否已有正在进行的计时
      const activeLog = await this.dbService.taskTimeLogDAO.findActiveLog(taskId);
      if (activeLog) {
        console.log('[TaskTimeLogService] 发现正在进行的计时:', activeLog);
        throw new Error('该任务已有正在进行的计时');
      }

      const now = new Date().toISOString();
      const logData = {
        task_id: taskId,
        start_time: now,
        description: description || '开始工作',
      };

      console.log('[TaskTimeLogService] 创建工作日志数据:', logData);
      const result = await this.dbService.taskTimeLogDAO.create(logData);
      console.log('[TaskTimeLogService] 工作日志创建成功:', result);
      return result;
    } catch (error) {
      console.error('[TaskTimeLogService] 开始计时失败:', error);
      throw error instanceof Error ? error : new Error('开始计时失败');
    }
  }

  /**
   * 停止工作计时
   */
  async stopWorkTimer(taskId: string): Promise<TaskTimeLog | null> {
    try {
      console.log('[TaskTimeLogService] 停止工作计时, taskId:', taskId);
      await this.ensureInitialized();
      const now = new Date().toISOString();
      const result = await this.dbService.taskTimeLogDAO.endActiveLog(taskId, now);
      console.log('[TaskTimeLogService] 停止计时结果:', result);
      return result;
    } catch (error) {
      console.error('[TaskTimeLogService] 停止计时失败:', error);
      throw error instanceof Error ? error : new Error('停止计时失败');
    }
  }

  /**
   * 添加工作日志
   */
  async addWorkLog(data: CreateWorkLogForm): Promise<TaskTimeLog> {
    try {
      console.log('[TaskTimeLogService] 添加工作日志, data:', data);
      await this.ensureInitialized();
      const now = new Date().toISOString();
      const logData = {
        ...data,
        start_time: data.start_time || now,
        end_time: data.end_time || now,
      };

      console.log('[TaskTimeLogService] 准备创建的日志数据:', logData);
      const result = await this.dbService.taskTimeLogDAO.create(logData);
      console.log('[TaskTimeLogService] 工作日志创建成功:', result);
      return result;
    } catch (error) {
      console.error('[TaskTimeLogService] 添加工作日志失败:', error);
      throw error instanceof Error ? error : new Error('添加工作日志失败');
    }
  }

  /**
   * 获取任务的所有工作日志
   */
  async getTaskWorkLogs(taskId: string): Promise<TaskTimeLog[]> {
    try {
      console.log('[TaskTimeLogService] 获取任务工作日志, taskId:', taskId);
      await this.ensureInitialized();
      const result = await this.dbService.taskTimeLogDAO.findByTaskId(taskId);
      console.log('[TaskTimeLogService] 获取到的工作日志数量:', result.length);
      return result;
    } catch (error) {
      console.error('[TaskTimeLogService] 获取工作日志失败:', error);
      throw error instanceof Error ? error : new Error('获取工作日志失败');
    }
  }

  /**
   * 获取正在进行的计时
   */
  async getActiveTimer(taskId: string): Promise<TaskTimeLog | null> {
    try {
      console.log('[TaskTimeLogService] 获取活动计时器, taskId:', taskId);
      await this.ensureInitialized();
      const result = await this.dbService.taskTimeLogDAO.findActiveLog(taskId);
      console.log('[TaskTimeLogService] 活动计时器结果:', result ? '有活动计时' : '无活动计时');
      return result;
    } catch (error) {
      console.error('[TaskTimeLogService] 获取活动计时失败:', error);
      throw error instanceof Error ? error : new Error('获取活动计时失败');
    }
  }

  /**
   * 更新工作日志
   */
  async updateWorkLog(logId: string, data: Partial<CreateWorkLogForm>): Promise<TaskTimeLog | null> {
    try {
      await this.ensureInitialized();
      return await this.dbService.taskTimeLogDAO.update(logId, data);
    } catch (error) {
      console.error('更新工作日志失败:', error);
      throw new Error('更新工作日志失败');
    }
  }

  /**
   * 删除工作日志
   */
  async deleteWorkLog(logId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      return await this.dbService.taskTimeLogDAO.softDelete(logId);
    } catch (error) {
      console.error('删除工作日志失败:', error);
      throw new Error('删除工作日志失败');
    }
  }

  /**
   * 计算任务总工作时间
   */
  async getTaskTotalWorkTime(taskId: string): Promise<number> {
    try {
      console.log('[TaskTimeLogService] 计算任务总工作时间, taskId:', taskId);
      await this.ensureInitialized();
      const result = await this.dbService.taskTimeLogDAO.getTotalWorkTime(taskId);
      console.log('[TaskTimeLogService] 任务总工作时间:', result, '分钟');
      return result;
    } catch (error) {
      console.error('[TaskTimeLogService] 计算工作时间失败:', error);
      return 0;
    }
  }

  /**
   * 获取工作统计摘要
   */
  async getWorkLogSummary(taskId: string): Promise<WorkLogSummary> {
    try {
      console.log('[TaskTimeLogService] 获取工作统计摘要, taskId:', taskId);
      await this.ensureInitialized();
      const logs = await this.getTaskWorkLogs(taskId);
      const completedLogs = logs.filter(log => log.end_time);
      
      let totalWorkTime = 0;
      let todayWorkTime = 0;
      let weekWorkTime = 0;

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      for (const log of completedLogs) {
        if (log.start_time && log.end_time) {
          const startTime = new Date(log.start_time);
          const endTime = new Date(log.end_time);
          const duration = endTime.getTime() - startTime.getTime();
          const minutes = Math.floor(duration / (1000 * 60));

          totalWorkTime += minutes;

          // 今天的工作时间
          if (startTime >= todayStart) {
            todayWorkTime += minutes;
          }

          // 本周的工作时间
          if (startTime >= weekStart) {
            weekWorkTime += minutes;
          }
        }
      }

      const averageSessionTime = completedLogs.length > 0 ? 
        Math.floor(totalWorkTime / completedLogs.length) : 0;

      const summary = {
        totalLogs: logs.length,
        totalWorkTime,
        averageSessionTime,
        todayWorkTime,
        weekWorkTime,
      };

      console.log('[TaskTimeLogService] 工作统计摘要:', summary);
      return summary;
    } catch (error) {
      console.error('[TaskTimeLogService] 获取工作统计失败:', error);
      return {
        totalLogs: 0,
        totalWorkTime: 0,
        averageSessionTime: 0,
        todayWorkTime: 0,
        weekWorkTime: 0,
      };
    }
  }

  /**
   * 格式化工作时间显示
   */
  formatWorkTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours}小时`;
    }

    return `${hours}小时${mins}分钟`;
  }

  /**
   * 格式化日期时间显示
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= yesterday) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
} 