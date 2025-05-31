import { CompletedTaskFilters } from '../database/task-dao';
import { TaskTimeLogDAO } from '../database/task-time-log-dao';
import { EventBus } from '../events/EventBus';
import { TaskCompletedEvent, TaskCreatedEvent, TaskDeletedEvent, TaskUpdatedEvent } from '../events/TaskEvents';
import { CreateTaskForm, Priority, Project, Task, TaskDTO, TaskStatus, UpdateTaskForm } from '../models/types';
import { IProjectRepository } from '../repositories/interfaces/IProjectRepository';
import { CreateTaskData, ITaskRepository, UpdateTaskData } from '../repositories/interfaces/ITaskRepository';
import { formatDisplayTime } from '../utils/date';
import { BaseService, BusinessError, ValidationError } from './BaseService';

export class NewTaskService extends BaseService {
  constructor(
    private taskRepository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private taskTimeLogDAO: TaskTimeLogDAO,
    protected eventBus: EventBus
  ) {
    super(eventBus);
  }

  async createTask(formData: CreateTaskForm): Promise<TaskDTO> {
    // 业务验证
    this.validateTaskData(formData);
    
    // 转换表单数据为创建数据
    const createData: CreateTaskData = {
      title: formData.title.trim(),
      description: formData.description?.trim(),
      priority: formData.priority,
      status: formData.status,
      due_date: formData.due_date?.toISOString(),
      project_id: formData.category !== '默认清单' ? formData.category : undefined,
      is_recurring: 0,
      sort_order: 0
    };

    // 创建任务
    const task = await this.taskRepository.create(createData);
    
    // 发布事件
    await this.publishEvent(new TaskCreatedEvent(task.id, { task }));
    
    return await this.toDTO(task);
  }

  async updateTask(id: string, formData: UpdateTaskForm): Promise<TaskDTO | null> {
    const existingTask = await this.taskRepository.findById(id);
    if (!existingTask) {
      throw new BusinessError('任务不存在');
    }

    // 验证更新数据
    if (formData.title !== undefined) {
      this.validateRequired(formData.title, '任务标题');
      this.validateLength(formData.title, 200, '任务标题');
    }

    // 转换表单数据为更新数据
    const updateData: Partial<UpdateTaskData> = {};
    if (formData.title !== undefined) updateData.title = formData.title.trim();
    if (formData.description !== undefined) updateData.description = formData.description?.trim();
    if (formData.priority !== undefined) updateData.priority = formData.priority;
    if (formData.status !== undefined) updateData.status = formData.status;
    if (formData.due_date !== undefined) updateData.due_date = formData.due_date?.toISOString();
    if (formData.category !== undefined) {
      updateData.project_id = formData.category !== '默认清单' ? formData.category : undefined;
    }

    // 更新任务
    const updatedTask = await this.taskRepository.update(id, updateData);
    if (!updatedTask) return null;

    // 发布事件
    await this.publishEvent(new TaskUpdatedEvent(id, { task: updatedTask, changes: updateData }));

    return await this.toDTO(updatedTask);
  }

  async completeTask(id: string): Promise<TaskDTO | null> {
    const task = await this.taskRepository.findById(id);
    if (!task) return null;

    // 验证状态转换
    this.validateStatusTransition(task.status, 'completed');

    // 更新任务
    const updatedTask = await this.taskRepository.markCompleted(id);
    if (!updatedTask) return null;

    // 发布完成事件
    await this.publishEvent(
      new TaskCompletedEvent(id, { 
        task: updatedTask, 
        completedAt: new Date(updatedTask.completed_at!) 
      })
    );

    return await this.toDTO(updatedTask);
  }

  async deleteTask(id: string): Promise<boolean> {
    const success = await this.taskRepository.delete(id);
    
    if (success) {
      await this.publishEvent(new TaskDeletedEvent(id, { taskId: id }));
    }
    
    return success;
  }

  async getTaskById(id: string): Promise<TaskDTO | null> {
    const task = await this.taskRepository.findById(id);
    return task ? await this.toDTO(task) : null;
  }

  async getAllTasks(): Promise<TaskDTO[]> {
    const tasks = await this.taskRepository.findAll({ sortBy: 'updated_at', sortOrder: 'desc' });
    return await Promise.all(tasks.map(task => this.toDTO(task)));
  }

  async getTasksByStatus(status: TaskStatus): Promise<TaskDTO[]> {
    const tasks = await this.taskRepository.findByStatus(status);
    return await Promise.all(tasks.map(task => this.toDTO(task)));
  }

  async getTasksByProject(projectId: string): Promise<TaskDTO[]> {
    const tasks = await this.taskRepository.findByProject(projectId);
    return await Promise.all(tasks.map(task => this.toDTO(task)));
  }

  async getTodayTasks(): Promise<TaskDTO[]> {
    const tasks = await this.taskRepository.findToday();
    return await Promise.all(tasks.map(task => this.toDTO(task)));
  }

  async getActiveTasks(): Promise<TaskDTO[]> {
    const tasks = await this.taskRepository.findActive();
    return await Promise.all(tasks.map(task => this.toDTO(task)));
  }

  async getCompletedTasks(limit?: number): Promise<TaskDTO[]> {
    const tasks = await this.taskRepository.findCompleted(limit);
    return await Promise.all(tasks.map(task => this.toDTO(task)));
  }

  async searchTasks(query: string): Promise<TaskDTO[]> {
    const tasks = await this.taskRepository.search(query);
    return await Promise.all(tasks.map(task => this.toDTO(task)));
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<TaskDTO | null> {
    const task = await this.taskRepository.findById(id);
    if (!task) return null;

    this.validateStatusTransition(task.status, status);

    const updatedTask = await this.taskRepository.updateStatus(id, status);
    if (!updatedTask) return null;

    await this.publishEvent(new TaskUpdatedEvent(id, { 
      task: updatedTask, 
      changes: { status } 
    }));

    return await this.toDTO(updatedTask);
  }

  async updateTaskPriority(id: string, priority: Priority): Promise<TaskDTO | null> {
    const updatedTask = await this.taskRepository.updatePriority(id, priority);
    if (!updatedTask) return null;

    await this.publishEvent(new TaskUpdatedEvent(id, { 
      task: updatedTask, 
      changes: { priority } 
    }));

    return await this.toDTO(updatedTask);
  }

  private validateTaskData(data: CreateTaskForm): void {
    this.validateRequired(data.title, '任务标题');
    this.validateLength(data.title, 200, '任务标题');
    
    if (data.description) {
      this.validateLength(data.description, 1000, '任务描述');
    }
  }

  private validateStatusTransition(from: TaskStatus, to: TaskStatus): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      'not_started': ['in_progress', 'completed', 'cancelled'],
      'in_progress': ['not_started', 'completed', 'paused'],
      'completed': ['not_started', 'in_progress'],
      'cancelled': ['not_started', 'in_progress'],
      'paused': ['in_progress', 'cancelled'],
      'postponed': ['not_started', 'in_progress'],
      'waiting': ['not_started', 'in_progress']
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new BusinessError(`无效的状态转换: ${from} -> ${to}`);
    }
  }

  /**
   * 转换为DTO格式
   */
  private async toDTO(task: Task): Promise<TaskDTO> {
    let project: Project | undefined;
    
    if (task.project_id) {
      const foundProject = await this.projectRepository.findById(task.project_id);
      project = foundProject || undefined;
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? new Date(task.due_date) : undefined,
      completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
      time: task.due_date ? formatDisplayTime(task.due_date) : undefined,
      completed: task.status === 'completed',
      project: project,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  }

  /**
   * 批量删除任务
   */
  async batchDelete(taskIds: string[]): Promise<boolean> {
    if (!taskIds.length) {
      throw new ValidationError('任务ID列表不能为空');
    }

    try {
      let deletedCount = 0;
      
      for (const taskId of taskIds) {
        const success = await this.taskRepository.delete(taskId);
        if (success) {
          deletedCount++;
          // 发布删除事件
          await this.publishEvent(new TaskDeletedEvent(taskId, { taskId }));
        }
      }

      return deletedCount === taskIds.length;
    } catch (error) {
      console.error('批量删除任务失败:', error);
      throw new BusinessError('批量删除任务失败');
    }
  }

  /**
   * 批量更新任务状态
   */
  async batchUpdateStatus(taskIds: string[], status: TaskStatus): Promise<TaskDTO[]> {
    if (!taskIds.length) {
      throw new ValidationError('任务ID列表不能为空');
    }

    this.validateStatusTransition('not_started', status); // 基本验证

    try {
      const updatedTasks: TaskDTO[] = [];
      
      for (const taskId of taskIds) {
        const updatedTask = await this.updateTaskStatus(taskId, status);
        if (updatedTask) {
          updatedTasks.push(updatedTask);
        }
      }

      return updatedTasks;
    } catch (error) {
      console.error('批量更新任务状态失败:', error);
      throw new BusinessError('批量更新任务状态失败');
    }
  }

  /**
   * 批量恢复已完成任务
   */
  async batchRestoreCompletedTasks(taskIds: string[]): Promise<TaskDTO[]> {
    return await this.batchUpdateStatus(taskIds, 'not_started');
  }

  /**
   * 导出任务
   */
  async exportTasks(filters?: CompletedTaskFilters): Promise<string> {
    try {
      let tasks: TaskDTO[];
      
      if (filters?.taskIds && filters.taskIds.length > 0) {
        // 按指定ID导出
        tasks = [];
        for (const id of filters.taskIds) {
          const task = await this.getTaskById(id);
          if (task) {
            tasks.push(task);
          }
        }
      } else {
        // 导出所有已完成任务
        tasks = await this.getCompletedTasks();
      }

      // 如果有其他筛选条件，进一步过滤
      if (filters) {
        if (filters.dateRange) {
          tasks = tasks.filter(task => {
            if (!task.completed_at) return false;
            const completedDate = new Date(task.completed_at);
            return completedDate >= filters.dateRange!.start && 
                   completedDate <= filters.dateRange!.end;
          });
        }

        if (filters.projectIds && filters.projectIds.length > 0) {
          tasks = tasks.filter(task => 
            task.project && filters.projectIds!.includes(task.project.id)
          );
        }

        if (filters.priorityFilter && filters.priorityFilter.length > 0) {
          tasks = tasks.filter(task => 
            filters.priorityFilter!.includes(task.priority)
          );
        }

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          tasks = tasks.filter(task => 
            task.title.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
          );
        }
      }

      // 导出为JSON格式
      const exportData = {
        exportTime: new Date().toISOString(),
        totalTasks: tasks.length,
        filters: filters || {},
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          dueDate: task.due_date,
          completedAt: task.completed_at,
          project: task.project?.name,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        }))
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出任务失败:', error);
      throw new BusinessError('导出任务失败');
    }
  }

  /**
   * 获取子任务
   */
  async getSubtasks(taskId: string): Promise<TaskDTO[]> {
    try {
      const subtasks = await this.taskRepository.findSubTasks(taskId);
      return await Promise.all(subtasks.map(task => this.toDTO(task)));
    } catch (error) {
      console.error('获取子任务失败:', error);
      throw new BusinessError('获取子任务失败');
    }
  }

  /**
   * 获取任务依赖
   */
  async getTaskDependencies(taskId: string): Promise<TaskDTO[]> {
    try {
      const dependencies = await this.taskRepository.findDependentTasks(taskId);
      return await Promise.all(dependencies.map(task => this.toDTO(task)));
    } catch (error) {
      console.error('获取任务依赖失败:', error);
      throw new BusinessError('获取任务依赖失败');
    }
  }

  /**
   * 添加子任务
   */
  async addSubtask(parentId: string, subtaskData: CreateTaskForm): Promise<TaskDTO> {
    // 验证父任务存在
    const parentTask = await this.taskRepository.findById(parentId);
    if (!parentTask) {
      throw new BusinessError('父任务不存在');
    }

    try {
      // 创建子任务，设置父任务ID
      const createData = {
        title: subtaskData.title,
        description: subtaskData.description,
        priority: subtaskData.priority,
        status: subtaskData.status,
        due_date: subtaskData.due_date?.toISOString(),
        project_id: subtaskData.category === 'default-project' ? undefined : subtaskData.category,
        parent_task_id: parentId, // 设置父任务ID
        estimated_duration_minutes: undefined,
        is_recurring: 0,
        recurrence_rule: undefined,
        sort_order: 0,
      };

      const task = await this.taskRepository.create(createData);
      
      // 发布创建事件
      await this.publishEvent(new TaskCreatedEvent(task.id, { task }));

      return await this.toDTO(task);
    } catch (error) {
      console.error('添加子任务失败:', error);
      throw new BusinessError('添加子任务失败');
    }
  }

  /**
   * 添加任务依赖
   */
  async addDependency(taskId: string, dependsOnId: string): Promise<boolean> {
    // 验证两个任务都存在
    const task = await this.taskRepository.findById(taskId);
    const dependsOnTask = await this.taskRepository.findById(dependsOnId);
    
    if (!task || !dependsOnTask) {
      throw new BusinessError('任务不存在');
    }

    if (taskId === dependsOnId) {
      throw new ValidationError('任务不能依赖自己');
    }

    try {
      const updatedTask = await this.taskRepository.update(taskId, {
        depends_on_task_id: dependsOnId
      });

      if (updatedTask) {
        // 发布更新事件
        await this.publishEvent(new TaskUpdatedEvent(taskId, { 
          task: updatedTask, 
          changes: { depends_on_task_id: dependsOnId } 
        }));
      }

      return updatedTask !== null;
    } catch (error) {
      console.error('添加任务依赖失败:', error);
      throw new BusinessError('添加任务依赖失败');
    }
  }

  /**
   * 工作日志相关方法
   */
  
  /**
   * 获取任务工作日志
   */
  async getTaskWorkLogs(taskId: string): Promise<any[]> {
    try {
      return await this.taskTimeLogDAO.findByTaskId(taskId);
    } catch (error) {
      console.error('获取工作日志失败:', error);
      throw new BusinessError('获取工作日志失败');
    }
  }

  /**
   * 添加工作日志
   */
  async addWorkLog(data: {
    task_id: string;
    description?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<any> {
    try {
      const now = new Date().toISOString();

      const logData = {
        task_id: data.task_id,
        start_time: data.start_time || now,
        end_time: data.end_time,
        description: data.description,
      };

      return await this.taskTimeLogDAO.create(logData);
    } catch (error) {
      console.error('添加工作日志失败:', error);
      throw new BusinessError('添加工作日志失败');
    }
  }

  /**
   * 开始工作计时
   */
  async startWorkTimer(taskId: string, description?: string): Promise<any> {
    try {
      // 检查是否已有活动计时器
      const activeTimer = await this.taskTimeLogDAO.findActiveLog(taskId);
      if (activeTimer) {
        throw new ValidationError('该任务已有活动的计时器');
      }

      const now = new Date().toISOString();
      return await this.taskTimeLogDAO.create({
        task_id: taskId,
        start_time: now,
        description: description || '工作时间记录',
      });
    } catch (error) {
      console.error('开始工作计时失败:', error);
      throw new BusinessError('开始工作计时失败');
    }
  }

  /**
   * 停止工作计时
   */
  async stopWorkTimer(taskId: string): Promise<any> {
    try {
      return await this.taskTimeLogDAO.endActiveLog(taskId);
    } catch (error) {
      console.error('停止工作计时失败:', error);
      throw new BusinessError('停止工作计时失败');
    }
  }

  /**
   * 获取活动计时器
   */
  async getActiveTimer(taskId: string): Promise<any> {
    try {
      return await this.taskTimeLogDAO.findActiveLog(taskId);
    } catch (error) {
      console.error('获取活动计时器失败:', error);
      throw new BusinessError('获取活动计时器失败');
    }
  }

  /**
   * 获取工作日志摘要
   */
  async getWorkLogSummary(taskId: string): Promise<{
    totalLogs: number;
    totalWorkTime: number;
    averageSessionTime: number;
    todayWorkTime: number;
    weekWorkTime: number;
  }> {
    try {
      const logs = await this.getTaskWorkLogs(taskId);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      let totalWorkTime = 0;
      let todayWorkTime = 0;
      let weekWorkTime = 0;

      for (const log of logs) {
        if (!log.start_time) continue;
        
        const startTime = new Date(log.start_time);
        const endTime = log.end_time ? new Date(log.end_time) : now;
        const duration = endTime.getTime() - startTime.getTime();
        
        if (duration > 0) {
          const minutes = Math.floor(duration / (1000 * 60));
          totalWorkTime += minutes;

          if (startTime >= today) {
            todayWorkTime += minutes;
          }
          
          if (startTime >= weekStart) {
            weekWorkTime += minutes;
          }
        }
      }

      return {
        totalLogs: logs.length,
        totalWorkTime,
        averageSessionTime: logs.length > 0 ? totalWorkTime / logs.length : 0,
        todayWorkTime,
        weekWorkTime,
      };
    } catch (error) {
      console.error('获取工作日志摘要失败:', error);
      throw new BusinessError('获取工作日志摘要失败');
    }
  }

  /**
   * 删除工作日志
   */
  async deleteWorkLog(logId: string): Promise<boolean> {
    try {
      return await this.taskTimeLogDAO.softDelete(logId);
    } catch (error) {
      console.error('删除工作日志失败:', error);
      throw new BusinessError('删除工作日志失败');
    }
  }
} 