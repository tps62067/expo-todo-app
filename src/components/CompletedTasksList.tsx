import { COLORS } from '@/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TaskDTO } from '../../lib/models/types';

interface CompletedTasksListProps {
  tasks: TaskDTO[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  isSelectionMode: boolean;
  selectedTaskIds: string[];
  onToggleSelect: (taskId: string) => void;
  onTaskPress: (taskId: string) => void;
}

const CompletedTasksList: React.FC<CompletedTasksListProps> = ({
  tasks,
  hasMore,
  isLoading,
  onLoadMore,
  isSelectionMode,
  selectedTaskIds,
  onToggleSelect,
  onTaskPress,
}) => {
  
  // 根据优先级获取颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return COLORS.highPriority;
      case 'medium':
        return COLORS.mediumPriority;
      case 'low':
        return COLORS.lowPriority;
      default:
        return COLORS.gray500;
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      case 'low':
        return '低优先级';
      default:
        return '普通';
    }
  };

  // 获取任务状态配置
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not_started':
        return { label: '未开始', color: COLORS.gray500, icon: 'clock-outline' };
      case 'in_progress':
        return { label: '进行中', color: COLORS.primary, icon: 'play-circle-outline' };
      case 'completed':
        return { label: '已完成', color: COLORS.lowPriority, icon: 'check-circle-outline' };
      case 'cancelled':
        return { label: '已取消', color: COLORS.gray500, icon: 'close-circle-outline' };
      case 'postponed':
        return { label: '已延期', color: COLORS.mediumPriority, icon: 'pause-circle-outline' };
      case 'paused':
        return { label: '暂停', color: COLORS.mediumPriority, icon: 'pause-circle-outline' };
      case 'waiting':
        return { label: '等待中', color: COLORS.gray500, icon: 'clock-alert-outline' };
      default:
        return { label: '未知', color: COLORS.gray500, icon: 'help-circle-outline' };
    }
  };

  // 渲染单个任务项
  const renderTaskItem = ({ item }: { item: TaskDTO }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => {
        if (isSelectionMode) {
          onToggleSelect(item.id);
        } else {
          onTaskPress(item.id);
        }
      }}
      onLongPress={() => {
        if (!isSelectionMode) {
          onToggleSelect(item.id);
        }
      }}
    >
      <TouchableOpacity
        style={[
          styles.checkbox,
          isSelectionMode ? 
            (selectedTaskIds.includes(item.id) ? styles.selectedCheckbox : styles.unselectedCheckbox) : 
            styles.completedCheckbox
        ]}
        onPress={() => onToggleSelect(item.id)}
      >
        {(isSelectionMode && selectedTaskIds.includes(item.id)) || (!isSelectionMode) ? (
          <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
        ) : null}
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, styles.completedTask]}>
            {item.title}
          </Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusConfig(item.status).color }
          ]}>
            <Text style={styles.statusText}>
              {getStatusConfig(item.status).label}
            </Text>
          </View>
        </View>
        
        <View style={styles.taskMeta}>
          {item.completed_at && (
            <>
              <MaterialCommunityIcons name="clock-check-outline" size={14} color={COLORS.gray500} />
              <Text style={styles.taskTime}>
                {new Date(item.completed_at).toLocaleDateString()} {new Date(item.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
              <Text style={styles.separator}>·</Text>
            </>
          )}
          
          <View style={[
            styles.priorityDot, 
            { backgroundColor: getPriorityColor(item.priority) }
          ]} />
          <Text style={styles.priorityText}>
            {getPriorityText(item.priority)}
          </Text>
          
          {item.project && (
            <>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.projectText}>{item.project.name}</Text>
            </>
          )}
        </View>
        
        {item.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // 渲染底部加载更多组件
  const renderFooter = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingMoreText}>加载更多...</Text>
        </View>
      );
    }
    
    if (!hasMore && tasks.length > 0) {
      return (
        <Text style={styles.noMoreText}>— 没有更多数据了 —</Text>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={tasks}
        renderItem={renderTaskItem}
        estimatedItemSize={100}
        keyExtractor={(item) => item.id}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  completedCheckbox: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectedCheckbox: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unselectedCheckbox: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginRight: 8,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: COLORS.gray500,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  taskTime: {
    fontSize: 12,
    color: COLORS.gray500,
    marginLeft: 4,
  },
  separator: {
    fontSize: 12,
    color: COLORS.gray500,
    marginHorizontal: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginLeft: 4,
  },
  projectText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.gray600,
    lineHeight: 20,
    marginTop: 4,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray500,
  },
  noMoreText: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    padding: 16,
  },
});

export default CompletedTasksList; 