import { COLORS } from '@/constants';
import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem, RefreshControl, StyleSheet, View } from 'react-native';
import { TaskDTO } from '../../lib/models/types';
import { TaskItem } from './TaskItem';

interface OptimizedTaskListProps {
  tasks: TaskDTO[];
  onTaskToggle: (taskId: string) => void;
  onTaskEdit: (task: TaskDTO) => void;
  onTaskPress?: (taskId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

// 任务项高度常量 - 用于性能优化
const ITEM_HEIGHT = 100;

export const OptimizedTaskList: React.FC<OptimizedTaskListProps> = ({
  tasks,
  onTaskToggle,
  onTaskEdit,
  onTaskPress,
  refreshing = false,
  onRefresh,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
}) => {
  // 使用useCallback缓存渲染函数
  const renderItem: ListRenderItem<TaskDTO> = useCallback(({ item }) => {
    return (
      <TaskItem
        task={item}
        onToggle={onTaskToggle}
        onEdit={onTaskEdit}
        onPress={onTaskPress}
      />
    );
  }, [onTaskToggle, onTaskEdit, onTaskPress]);

  // 使用useCallback缓存key提取器
  const keyExtractor = useCallback((item: TaskDTO) => item.id, []);

  // 优化FlatList性能配置
  const flatListConfig = useMemo(() => ({
    // 启用虚拟化
    removeClippedSubviews: true,
    // 初始渲染数量
    initialNumToRender: 10,
    // 最大渲染数量
    maxToRenderPerBatch: 5,
    // 更新间隔
    updateCellsBatchingPeriod: 100,
    // 窗口大小
    windowSize: 10,
    // 获取布局优化 - 如果所有项目高度一致，可以启用此优化
    getItemLayout: (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
  }), []);

  // 刷新控制组件
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[COLORS.primary]}
        tintColor={COLORS.primary}
      />
    );
  }, [refreshing, onRefresh]);

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={refreshControl}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tasks.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
        {...flatListConfig}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // 为FAB留出空间
  },
  emptyContentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
}); 