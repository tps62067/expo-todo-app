import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

// 数据同步状态接口
interface DataSyncState {
  // 任务数据脏标记
  tasksDataDirty: boolean;
  // 项目数据脏标记  
  projectsDataDirty: boolean;
  // 笔记数据脏标记
  notesDataDirty: boolean;
  // 统计数据脏标记
  statisticsDataDirty: boolean;
}

// 数据同步方法接口
interface DataSyncContextType {
  syncState: DataSyncState;
  // 标记任务数据为脏
  markTasksDataDirty: () => void;
  // 标记项目数据为脏
  markProjectsDataDirty: () => void;
  // 标记笔记数据为脏
  markNotesDataDirty: () => void;
  // 标记统计数据为脏
  markStatisticsDataDirty: () => void;
  // 清除任务数据脏标记
  clearTasksDataDirty: () => void;
  // 清除项目数据脏标记
  clearProjectsDataDirty: () => void;
  // 清除笔记数据脏标记
  clearNotesDataDirty: () => void;
  // 清除统计数据脏标记
  clearStatisticsDataDirty: () => void;
  // 清除所有脏标记
  clearAllDataDirty: () => void;
  // 检查是否有任何数据为脏
  hasAnyDataDirty: () => boolean;
}

const initialState: DataSyncState = {
  tasksDataDirty: false,
  projectsDataDirty: false,
  notesDataDirty: false,
  statisticsDataDirty: false,
};

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

interface DataSyncProviderProps {
  children: ReactNode;
}

export const DataSyncProvider: React.FC<DataSyncProviderProps> = ({ children }) => {
  const [syncState, setSyncState] = useState<DataSyncState>(initialState);

  const markTasksDataDirty = useCallback(() => {
    console.log('[DataSync] 标记任务数据为脏');
    setSyncState(prev => ({ ...prev, tasksDataDirty: true, statisticsDataDirty: true }));
  }, []);

  const markProjectsDataDirty = useCallback(() => {
    console.log('[DataSync] 标记项目数据为脏');
    setSyncState(prev => ({ ...prev, projectsDataDirty: true }));
  }, []);

  const markNotesDataDirty = useCallback(() => {
    console.log('[DataSync] 标记笔记数据为脏');
    setSyncState(prev => ({ ...prev, notesDataDirty: true }));
  }, []);

  const markStatisticsDataDirty = useCallback(() => {
    console.log('[DataSync] 标记统计数据为脏');
    setSyncState(prev => ({ ...prev, statisticsDataDirty: true }));
  }, []);

  const clearTasksDataDirty = useCallback(() => {
    console.log('[DataSync] 清除任务数据脏标记');
    setSyncState(prev => ({ ...prev, tasksDataDirty: false }));
  }, []);

  const clearProjectsDataDirty = useCallback(() => {
    console.log('[DataSync] 清除项目数据脏标记');
    setSyncState(prev => ({ ...prev, projectsDataDirty: false }));
  }, []);

  const clearNotesDataDirty = useCallback(() => {
    console.log('[DataSync] 清除笔记数据脏标记');
    setSyncState(prev => ({ ...prev, notesDataDirty: false }));
  }, []);

  const clearStatisticsDataDirty = useCallback(() => {
    console.log('[DataSync] 清除统计数据脏标记');
    setSyncState(prev => ({ ...prev, statisticsDataDirty: false }));
  }, []);

  const clearAllDataDirty = useCallback(() => {
    console.log('[DataSync] 清除所有数据脏标记');
    setSyncState(initialState);
  }, []);

  const hasAnyDataDirty = useCallback((): boolean => {
    return Object.values(syncState).some(isDirty => isDirty);
  }, [syncState]);

  const value: DataSyncContextType = {
    syncState,
    markTasksDataDirty,
    markProjectsDataDirty,
    markNotesDataDirty,
    markStatisticsDataDirty,
    clearTasksDataDirty,
    clearProjectsDataDirty,
    clearNotesDataDirty,
    clearStatisticsDataDirty,
    clearAllDataDirty,
    hasAnyDataDirty,
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = (): DataSyncContextType => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};

// 便捷Hook：专门用于任务数据同步
export const useTaskDataSync = () => {
  const { syncState, markTasksDataDirty, clearTasksDataDirty } = useDataSync();
  
  return {
    isTasksDataDirty: syncState.tasksDataDirty,
    markTasksDataDirty,
    clearTasksDataDirty,
  };
}; 