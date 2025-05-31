import { useEffect } from 'react';
import { newAppService } from '../../lib';
import { useTaskDataSync } from '../contexts/DataSyncContext';
import { useNewApp } from '../contexts/NewAppContext';

/**
 * 用于初始化新架构事件监听和DataSync的连接
 * 需要在应用启动时调用一次
 */
export const useTaskServiceSync = () => {
  const { markTasksDataDirty } = useTaskDataSync();
  const { isInitialized } = useNewApp();

  useEffect(() => {
    if (!isInitialized) {
      console.log('[TaskServiceSync] 新架构未初始化，跳过事件监听设置');
      return;
    }

    console.log('[TaskServiceSync] 🚀 初始化新架构事件监听');
    
    try {
      const eventBus = newAppService.eventBus;
      
      // 创建事件处理器
      const taskEventHandler = {
        handle: async (event: any) => {
          console.log(`[TaskServiceSync] 🎯 收到任务事件: ${event.eventType}，标记任务数据为脏`);
          markTasksDataDirty();
        }
      };

      // 订阅任务相关事件
      eventBus.subscribe('task.created', taskEventHandler);
      eventBus.subscribe('task.updated', taskEventHandler);
      eventBus.subscribe('task.completed', taskEventHandler);
      eventBus.subscribe('task.deleted', taskEventHandler);

      console.log('[TaskServiceSync] ✅ 新架构事件监听设置完成');

      // 清理函数
      return () => {
        console.log('[TaskServiceSync] 🧹 清理新架构事件监听');
        try {
          eventBus.unsubscribe('task.created', taskEventHandler);
          eventBus.unsubscribe('task.updated', taskEventHandler);
          eventBus.unsubscribe('task.completed', taskEventHandler);
          eventBus.unsubscribe('task.deleted', taskEventHandler);
        } catch (error) {
          console.warn('[TaskServiceSync] 清理事件监听时出错:', error);
        }
      };
    } catch (error) {
      console.error('[TaskServiceSync] 设置新架构事件监听失败:', error);
    }
  }, [markTasksDataDirty, isInitialized]);
}; 