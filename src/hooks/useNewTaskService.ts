import { useCallback } from 'react';
import { Alert } from 'react-native';
import { newAppService } from '../../lib';
import { CompletedTaskFilters } from '../../lib/database/task-dao';
import { CreateTaskForm, TaskDTO, TaskStatus, UpdateTaskForm } from '../../lib/models/types';
import { useNewApp } from '../contexts/NewAppContext';

export function useNewTaskService() {
  const { isInitialized } = useNewApp();

  const ensureInitialized = useCallback(() => {
    if (!isInitialized) {
      throw new Error('新架构应用未初始化');
    }
  }, [isInitialized]);

  const createTask = useCallback(async (formData: CreateTaskForm): Promise<TaskDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.createTask(formData);
    } catch (error) {
      console.error('创建任务失败:', error);
      Alert.alert('错误', '创建任务失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const updateTask = useCallback(async (id: string, formData: UpdateTaskForm): Promise<TaskDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.updateTask(id, formData);
    } catch (error) {
      console.error('更新任务失败:', error);
      Alert.alert('错误', '更新任务失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.deleteTask(id);
    } catch (error) {
      console.error('删除任务失败:', error);
      Alert.alert('错误', '删除任务失败，请重试');
      return false;
    }
  }, [ensureInitialized]);

  const getTaskById = useCallback(async (id: string): Promise<TaskDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getTaskById(id);
    } catch (error) {
      console.error('获取任务失败:', error);
      return null;
    }
  }, [ensureInitialized]);

  const getAllTasks = useCallback(async (): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getAllTasks();
    } catch (error) {
      console.error('获取所有任务失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const getTasksByStatus = useCallback(async (status: TaskStatus): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getTasksByStatus(status);
    } catch (error) {
      console.error('按状态获取任务失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const getTodayTasks = useCallback(async (): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getTodayTasks();
    } catch (error) {
      console.error('获取今日任务失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const getActiveTasks = useCallback(async (): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getActiveTasks();
    } catch (error) {
      console.error('获取活跃任务失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const getCompletedTasks = useCallback(async (limit?: number): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getCompletedTasks(limit);
    } catch (error) {
      console.error('获取已完成任务失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const completeTask = useCallback(async (id: string): Promise<TaskDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.completeTask(id);
    } catch (error) {
      console.error('完成任务失败:', error);
      Alert.alert('错误', '完成任务失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus): Promise<TaskDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.updateTaskStatus(id, status);
    } catch (error) {
      console.error('更新任务状态失败:', error);
      Alert.alert('错误', '更新任务状态失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const searchTasks = useCallback(async (query: string): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.searchTasks(query);
    } catch (error) {
      console.error('搜索任务失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const batchDelete = useCallback(async (taskIds: string[]): Promise<boolean> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.batchDelete(taskIds);
    } catch (error) {
      console.error('批量删除任务失败:', error);
      Alert.alert('错误', '批量删除任务失败，请重试');
      return false;
    }
  }, [ensureInitialized]);

  const batchRestoreCompletedTasks = useCallback(async (taskIds: string[]): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.batchRestoreCompletedTasks(taskIds);
    } catch (error) {
      console.error('批量恢复任务失败:', error);
      Alert.alert('错误', '批量恢复任务失败，请重试');
      return [];
    }
  }, [ensureInitialized]);

  const exportTasks = useCallback(async (filters?: CompletedTaskFilters): Promise<string> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.exportTasks(filters);
    } catch (error) {
      console.error('导出任务失败:', error);
      Alert.alert('错误', '导出任务失败，请重试');
      return '';
    }
  }, [ensureInitialized]);

  const getSubtasks = useCallback(async (taskId: string): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getSubtasks(taskId);
    } catch (error) {
      console.error('获取子任务失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const getTaskDependencies = useCallback(async (taskId: string): Promise<TaskDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getTaskDependencies(taskId);
    } catch (error) {
      console.error('获取任务依赖失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const addSubtask = useCallback(async (parentId: string, subtaskData: CreateTaskForm): Promise<TaskDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.addSubtask(parentId, subtaskData);
    } catch (error) {
      console.error('添加子任务失败:', error);
      Alert.alert('错误', '添加子任务失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const addDependency = useCallback(async (taskId: string, dependsOnId: string): Promise<boolean> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.addDependency(taskId, dependsOnId);
    } catch (error) {
      console.error('添加任务依赖失败:', error);
      Alert.alert('错误', '添加任务依赖失败，请重试');
      return false;
    }
  }, [ensureInitialized]);

  // 工作日志相关方法
  const getTaskWorkLogs = useCallback(async (taskId: string): Promise<any[]> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getTaskWorkLogs(taskId);
    } catch (error) {
      console.error('获取工作日志失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const addWorkLog = useCallback(async (data: {
    task_id: string;
    description?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<any> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.addWorkLog(data);
    } catch (error) {
      console.error('添加工作日志失败:', error);
      Alert.alert('错误', '添加工作日志失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const startWorkTimer = useCallback(async (taskId: string, description?: string): Promise<any> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.startWorkTimer(taskId, description);
    } catch (error) {
      console.error('开始工作计时失败:', error);
      Alert.alert('错误', '开始工作计时失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const stopWorkTimer = useCallback(async (taskId: string): Promise<any> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.stopWorkTimer(taskId);
    } catch (error) {
      console.error('停止工作计时失败:', error);
      Alert.alert('错误', '停止工作计时失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const getActiveTimer = useCallback(async (taskId: string): Promise<any> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getActiveTimer(taskId);
    } catch (error) {
      console.error('获取活动计时器失败:', error);
      return null;
    }
  }, [ensureInitialized]);

  const getWorkLogSummary = useCallback(async (taskId: string): Promise<{
    totalLogs: number;
    totalWorkTime: number;
    averageSessionTime: number;
    todayWorkTime: number;
    weekWorkTime: number;
  }> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.getWorkLogSummary(taskId);
    } catch (error) {
      console.error('获取工作日志摘要失败:', error);
      return {
        totalLogs: 0,
        totalWorkTime: 0,
        averageSessionTime: 0,
        todayWorkTime: 0,
        weekWorkTime: 0,
      };
    }
  }, [ensureInitialized]);

  const deleteWorkLog = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      ensureInitialized();
      return await newAppService.tasks.deleteWorkLog(taskId);
    } catch (error) {
      console.error('删除工作日志失败:', error);
      Alert.alert('错误', '删除工作日志失败，请重试');
      return false;
    }
  }, [ensureInitialized]);

  return {
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    getAllTasks,
    getTasksByStatus,
    getTodayTasks,
    getActiveTasks,
    getCompletedTasks,
    completeTask,
    updateTaskStatus,
    searchTasks,
    batchDelete,
    batchRestoreCompletedTasks,
    exportTasks,
    getSubtasks,
    getTaskDependencies,
    addSubtask,
    addDependency,
    getTaskWorkLogs,
    addWorkLog,
    startWorkTimer,
    stopWorkTimer,
    getActiveTimer,
    getWorkLogSummary,
    deleteWorkLog,
    isInitialized,
  };
} 