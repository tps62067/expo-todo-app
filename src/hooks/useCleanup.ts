import { useEffect, useRef } from 'react';

/**
 * 组件清理Hook - 自动管理组件卸载时的资源清理
 * @param cleanup 清理函数
 */
export function useCleanup(cleanup: () => void) {
  const cleanupRef = useRef(cleanup);
  
  // 更新清理函数引用
  cleanupRef.current = cleanup;
  
  useEffect(() => {
    return () => {
      try {
        cleanupRef.current();
      } catch (error) {
        console.warn('Cleanup function error:', error);
      }
    };
  }, []);
}

/**
 * 定时器清理Hook
 * @param timers 定时器ID数组
 */
export function useTimerCleanup(timers: (NodeJS.Timeout | number | null)[]) {
  useCleanup(() => {
    timers.forEach(timer => {
      if (timer) {
        clearTimeout(timer as any);
        clearInterval(timer as any);
      }
    });
  });
}

/**
 * 监听器清理Hook
 * @param listeners 监听器清理函数数组
 */
export function useListenerCleanup(listeners: Array<() => void>) {
  useCleanup(() => {
    listeners.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Listener cleanup error:', error);
      }
    });
  });
}

/**
 * 通用资源清理Hook
 * @param resources 资源清理配置对象
 */
export function useResourceCleanup(resources: {
  timers?: (NodeJS.Timeout | number | null)[];
  listeners?: Array<() => void>;
  subscriptions?: Array<{ unsubscribe: () => void }>;
  custom?: Array<() => void>;
}) {
  useCleanup(() => {
    // 清理定时器
    if (resources.timers) {
      resources.timers.forEach(timer => {
        if (timer) {
          clearTimeout(timer as any);
          clearInterval(timer as any);
        }
      });
    }
    
    // 清理监听器
    if (resources.listeners) {
      resources.listeners.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Listener cleanup error:', error);
        }
      });
    }
    
    // 清理订阅
    if (resources.subscriptions) {
      resources.subscriptions.forEach(subscription => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Subscription cleanup error:', error);
        }
      });
    }
    
    // 清理自定义资源
    if (resources.custom) {
      resources.custom.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Custom cleanup error:', error);
        }
      });
    }
  });
} 