import { COLORS } from '@/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TaskDTO } from '../../lib/models/types';

interface TaskItemProps {
  task: TaskDTO;
  onToggle: (id: string) => void;
  onEdit: (task: TaskDTO) => void;
  onPress?: (id: string) => void;
}

// 优先级配置缓存
const priorityConfig = {
  high: { label: '高优先级', color: COLORS.highPriority },
  medium: { label: '中优先级', color: COLORS.mediumPriority },
  low: { label: '低优先级', color: COLORS.lowPriority },
} as const;

// 状态配置缓存
const statusConfig = {
  not_started: { label: '未开始', color: COLORS.gray500, icon: 'clock-outline' },
  in_progress: { label: '进行中', color: COLORS.primary, icon: 'play-circle-outline' },
  completed: { label: '已完成', color: COLORS.success, icon: 'check-circle-outline' },
  cancelled: { label: '已取消', color: COLORS.danger, icon: 'close-circle-outline' },
  postponed: { label: '已延期', color: COLORS.warning, icon: 'pause-circle-outline' },
  paused: { label: '暂停', color: COLORS.mediumPriority, icon: 'pause-circle-outline' },
  waiting: { label: '等待中', color: COLORS.gray500, icon: 'clock-alert-outline' },
} as const;

// 格式化日期的缓存函数
const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TaskItem = memo<TaskItemProps>(({ task, onToggle, onEdit, onPress }) => {
  // 使用useMemo缓存格式化日期
  const formattedDate = useMemo(() => {
    return formatDate(task.created_at);
  }, [task.created_at]);
  
  // 使用useMemo缓存完成时间
  const formattedCompletedDate = useMemo(() => {
    return task.completed_at ? formatDate(task.completed_at) : null;
  }, [task.completed_at]);
  
  // 使用useMemo缓存样式计算
  const containerStyle = useMemo(() => ({
    backgroundColor: task.status === 'completed' ? '#f0f8f0' : COLORS.white,
    opacity: task.status === 'completed' ? 0.8 : 1,
  }), [task.status]);
  
  // 使用useMemo缓存优先级配置
  const priorityInfo = useMemo(() => {
    return priorityConfig[task.priority] || { label: '普通', color: COLORS.gray500 };
  }, [task.priority]);
  
  // 使用useMemo缓存状态配置
  const statusInfo = useMemo(() => {
    return statusConfig[task.status] || { label: '未知', color: COLORS.gray500, icon: 'help-circle-outline' };
  }, [task.status]);
  
  // 使用useCallback缓存事件处理器
  const handleToggle = useCallback(() => {
    onToggle(task.id);
  }, [task.id, onToggle]);
  
  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [task, onEdit]);
  
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(task.id);
    } else {
      onEdit(task);
    }
  }, [task.id, onPress, onEdit]);
  
  return (
    <TouchableOpacity 
      style={[styles.taskCard, containerStyle]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={[styles.checkbox, task.status === 'completed' && styles.checkedBox]}
        onPress={handleToggle}
      >
        {task.status === 'completed' && (
          <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
        )}
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={[
            styles.taskTitle, 
            task.status === 'completed' && styles.completedTask
          ]}>
            {task.title}
          </Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: statusInfo.color }
          ]}>
            <Text style={styles.statusText}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        
        <View style={styles.taskMeta}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.gray500} />
          <Text style={styles.taskTime}>
            {formattedCompletedDate || formattedDate}
          </Text>
          <Text style={styles.separator}>·</Text>
          <View style={[
            styles.priorityDot, 
            { backgroundColor: priorityInfo.color }
          ]} />
          <Text style={styles.priorityText}>
            {priorityInfo.label}
          </Text>
          {task.project && (
            <>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.projectText}>{task.project.name}</Text>
            </>
          )}
        </View>
        
        {task.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数 - 只有关键属性变化时才重新渲染
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.updated_at === nextProps.task.updated_at &&
    prevProps.task.completed_at === nextProps.task.completed_at &&
    prevProps.task.project?.id === nextProps.task.project?.id &&
    prevProps.task.project?.name === nextProps.task.project?.name &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onPress === nextProps.onPress
  );
});

TaskItem.displayName = 'TaskItem';

const styles = StyleSheet.create({
  taskCard: {
    borderRadius: 12,
    padding: 16,
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
    borderColor: COLORS.gray300,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: COLORS.primary,
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
}); 