import React, { createContext, useContext, useEffect, useState } from 'react';
import { newAppService } from '../../lib';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingScreen } from '../components/LoadingScreen';

interface NewAppContextType {
  isInitialized: boolean;
  initError: string | null;
  isLoading: boolean;
  retry: () => void;
}

const NewAppContext = createContext<NewAppContextType | undefined>(undefined);

export function NewAppProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeNewApp = async () => {
    try {
      console.log('🚀 开始初始化新架构应用...');
      setIsLoading(true);
      setInitError(null);
      
      await newAppService.initializeApp();
      
      setIsInitialized(true);
      console.log('✅ 新架构应用初始化完成');
    } catch (error) {
      console.error('❌ 新架构应用初始化失败:', error);
      setInitError(error instanceof Error ? error.message : '新架构应用初始化失败');
      // 即使初始化失败，也允许应用继续运行（降级模式）
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    initializeNewApp();
  };

  useEffect(() => {
    initializeNewApp();
  }, []);

  const contextValue: NewAppContextType = {
    isInitialized,
    initError,
    isLoading,
    retry,
  };

  // 如果正在加载，显示加载屏幕
  if (isLoading) {
    return <LoadingScreen message="正在初始化应用..." />;
  }

  // 如果初始化失败，显示错误屏幕但仍然允许应用运行
  if (initError && !isInitialized) {
    return (
      <ErrorBoundary>
        <NewAppContext.Provider value={contextValue}>
          {children}
        </NewAppContext.Provider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <NewAppContext.Provider value={contextValue}>
        {children}
      </NewAppContext.Provider>
    </ErrorBoundary>
  );
}

export function useNewApp(): NewAppContextType {
  const context = useContext(NewAppContext);
  if (context === undefined) {
    throw new Error('useNewApp must be used within a NewAppProvider');
  }
  return context;
} 