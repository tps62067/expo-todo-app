import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 导入设计系统常量
import { COLORS } from '@/constants';
// 导入类型定义和服务
import { Priority, TaskStatus, TaskTimeLog } from '../../lib/models/types';
// 新架构导入
import { useNewApp } from '@/contexts/NewAppContext';
import { useNewTaskService } from '@/hooks/useNewTaskService';

interface WorkLog {
  id: string;
  taskId: string;
  content: string;
  logDate: Date;
  duration?: number;
  createdAt: Date;
}

interface WorkLogSummary {
  totalLogs: number;
  totalWorkTime: number;
  averageSessionTime: number;
  todayWorkTime: number;
  weekWorkTime: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  due_date?: Date;
  completed_at?: Date;
  time?: string;
  completed: boolean;
  project?: any;
  parent_task?: any;
  depends_on_task_id?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  subtasks?: Task[];
  dependencies?: Task[];
  actual_duration_minutes?: number;
  estimated_duration_minutes?: number;
  created_at: string | Date;
  updated_at: string | Date;
}

const statusConfig = {
  not_started: { label: '未开始', color: COLORS.gray500, icon: 'clock-outline' },
  in_progress: { label: '进行中', color: COLORS.primary, icon: 'play-circle-outline' },
  completed: { label: '已完成', color: COLORS.success, icon: 'check-circle-outline' },
  cancelled: { label: '已取消', color: COLORS.danger, icon: 'close-circle-outline' },
  postponed: { label: '已延期', color: COLORS.warning, icon: 'pause-circle-outline' },
  paused: { label: '暂停', color: COLORS.mediumPriority, icon: 'pause-circle-outline' },
  waiting: { label: '等待中', color: COLORS.gray500, icon: 'clock-alert-outline' },
};

const statusTransitions: Record<TaskStatus, TaskStatus[]> = {
  not_started: ['in_progress', 'cancelled', 'postponed'],
  in_progress: ['completed', 'cancelled', 'postponed', 'paused'],
  completed: ['in_progress'], // 允许重新激活
  cancelled: ['not_started'],
  postponed: ['not_started', 'in_progress'],
  paused: ['in_progress', 'cancelled'],
  waiting: ['in_progress', 'cancelled'],
};

const priorityConfig = {
  high: { label: '高优先级', color: COLORS.highPriority },
  medium: { label: '中优先级', color: COLORS.mediumPriority },
  low: { label: '低优先级', color: COLORS.lowPriority },
};

// 优先级标签组件
const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const getColor = () => {
    switch (priority) {
      case 'high': return COLORS.highPriority;
      case 'medium': return COLORS.mediumPriority;
      case 'low': return COLORS.lowPriority;
      default: return COLORS.gray400;
    }
  };

  const getLabel = () => {
    switch (priority) {
      case 'high': return '高优先级';
      case 'medium': return '中优先级';
      case 'low': return '低优先级';
      default: return '无优先级';
    }
  };

  return (
    <View style={[styles.priorityBadge, { backgroundColor: getColor() + '20' }]}>
      <Text style={[styles.priorityText, { color: getColor() }]}>
        {getLabel()}
      </Text>
    </View>
  );
};

// 状态标签组件
const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'in_progress': return COLORS.warning;
      case 'not_started': return COLORS.gray400;
      case 'waiting': return COLORS.gray500;
      case 'paused': return COLORS.gray600;
      case 'cancelled': return COLORS.danger;
      case 'postponed': return COLORS.warning;
      default: return COLORS.gray400;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'not_started': return '未开始';
      case 'waiting': return '等待中';
      case 'paused': return '已暂停';
      case 'cancelled': return '已取消';
      case 'postponed': return '已延期';
      default: return '未知状态';
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getColor() + '20' }]}>
      <Text style={[styles.statusText, { color: getColor() }]}>
        {getLabel()}
      </Text>
    </View>
  );
};

// 子任务项组件
const SubtaskItem: React.FC<{ 
  subtask: Task; 
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
}> = ({ subtask, onToggle, onPress }) => (
  <TouchableOpacity 
    style={styles.subtaskItem}
    onPress={() => onPress(subtask.id)}
  >
    <TouchableOpacity 
      style={styles.subtaskCheckbox}
      onPress={() => onToggle(subtask.id)}
    >
      <MaterialCommunityIcons 
        name={subtask.completed ? "checkbox-marked" : "checkbox-blank-outline"} 
        size={20} 
        color={subtask.completed ? COLORS.success : COLORS.gray400} 
      />
    </TouchableOpacity>
    <View style={styles.subtaskContent}>
      <Text style={[
        styles.subtaskTitle, 
        subtask.completed && styles.completedText
      ]}>
        {subtask.title}
      </Text>
      <PriorityBadge priority={subtask.priority} />
    </View>
  </TouchableOpacity>
);

// 依赖项组件
const DependencyItem: React.FC<{ dependency: Task }> = ({ dependency }) => (
  <TouchableOpacity 
    style={styles.dependencyItem}
    onPress={() => router.push(`/task/${dependency.id}`)}
  >
    <View style={styles.dependencyContent}>
      <Text style={styles.dependencyTitle}>{dependency.title}</Text>
      <StatusBadge status={dependency.status} />
    </View>
    <MaterialCommunityIcons 
      name="chevron-right" 
      size={20} 
      color={COLORS.gray400} 
    />
  </TouchableOpacity>
);

// 时间跟踪组件
const TimeTracker: React.FC<{ 
  estimatedMinutes?: number;
  actualMinutes?: number;
  isRunning: boolean;
  onToggleTimer: () => void;
}> = ({ estimatedMinutes, actualMinutes, isRunning, onToggleTimer }) => (
  <View style={styles.timeTracker}>
    <Text style={styles.sectionTitle}>时间跟踪</Text>
    
    <View style={styles.timeRow}>
      <View style={styles.timeItem}>
        <Text style={styles.timeLabel}>预估时间</Text>
        <Text style={styles.timeValue}>
          {estimatedMinutes ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m` : '未设置'}
        </Text>
      </View>
      
      <View style={styles.timeItem}>
        <Text style={styles.timeLabel}>实际时间</Text>
        <Text style={styles.timeValue}>
          {actualMinutes ? `${Math.floor(actualMinutes / 60)}h ${actualMinutes % 60}m` : '0h 0m'}
        </Text>
      </View>
    </View>

    <TouchableOpacity 
      style={[styles.timerButton, isRunning && styles.timerButtonActive]}
      onPress={onToggleTimer}
    >
      <MaterialCommunityIcons 
        name={isRunning ? "pause" : "play"} 
        size={20} 
        color={isRunning ? COLORS.white : COLORS.primary} 
      />
      <Text style={[
        styles.timerButtonText, 
        isRunning && styles.timerButtonTextActive
      ]}>
        {isRunning ? '暂停计时' : '开始计时'}
      </Text>
    </TouchableOpacity>
  </View>
);

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const taskId = typeof id === 'string' ? id : id?.[0];

  // 新架构Hooks
  const { isInitialized: newArchInitialized } = useNewApp();
  const newTaskService = useNewTaskService();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [newLogContent, setNewLogContent] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);

  // 工作日志相关状态
  const [workLogs, setWorkLogs] = useState<TaskTimeLog[]>([]);
  const [workLogSummary, setWorkLogSummary] = useState<WorkLogSummary>({
    totalLogs: 0,
    totalWorkTime: 0,
    averageSessionTime: 0,
    todayWorkTime: 0,
    weekWorkTime: 0,
  });
  const [currentTimer, setCurrentTimer] = useState<TaskTimeLog | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  // 新增 useEffect 用于处理删除后的返回操作
  useEffect(() => {
    if (shouldNavigateBack) {
      console.log('[WebDeleteDebug] useEffect: Navigating back due to shouldNavigateBack');
      router.back();
      setShouldNavigateBack(false); // 重置状态，避免重复导航
    }
  }, [shouldNavigateBack]);

  // 加载任务数据
  const loadTask = async () => {
    if (!taskId) {
      Alert.alert('错误', '任务ID无效');
      router.back();
      return;
    }

    // 确保新架构已初始化
    if (!newArchInitialized) {
      console.log('[TaskDetail] 新架构未初始化，跳过任务加载');
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 使用新架构加载任务详情');
      
      const taskData = await newTaskService.getTaskById(taskId);
      
      if (!taskData) {
        Alert.alert('错误', '任务不存在', [
          { text: '确定', onPress: () => router.back() }
        ]);
        return;
      }

      // 加载子任务和依赖关系
      console.log('🚀 使用新架构加载子任务和依赖关系');
      const subtasks = await newTaskService.getSubtasks(taskId);
      const dependencies = await newTaskService.getTaskDependencies(taskId);
      
      setTask({
        ...taskData,
        subtasks: subtasks.map(st => ({
          ...st,
          completed: st.status === 'completed'
        })), // 转换为兼容格式
        dependencies: dependencies.map(dep => ({
          ...dep,
          completed: dep.status === 'completed'
        })) // 转换为兼容格式
      });
      setEditForm({
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority,
      });

      // 加载工作日志
      loadWorkLogs();
    } catch (error) {
      console.error('加载任务失败:', error);
      Alert.alert('错误', '加载任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载工作日志数据
  const loadWorkLogs = async () => {
    if (!taskId) return;

    try {
      console.log('🚀 使用新架构加载工作日志');
      const [logs, summary, activeTimer] = await Promise.all([
        newTaskService.getTaskWorkLogs(taskId),
        newTaskService.getWorkLogSummary(taskId),
        newTaskService.getActiveTimer(taskId)
      ]);

      setWorkLogs(logs);
      setWorkLogSummary(summary);
      setCurrentTimer(activeTimer);
      setIsTimerRunning(!!activeTimer);

      // 如果有活动计时器，计算已经过的时间
      if (activeTimer) {
        const elapsed = Math.floor((new Date().getTime() - new Date(activeTimer.start_time).getTime()) / 1000);
        setTimerElapsed(elapsed);
      }
    } catch (error) {
      console.error('加载工作日志失败:', error);
    }
  };

  // 页面焦点时重新加载数据
  useFocusEffect(
    useCallback(() => {
      loadTask();
      loadWorkLogs();
    }, [taskId])
  );

  // 计时器更新
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isTimerRunning && currentTimer) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - new Date(currentTimer.start_time).getTime()) / 1000);
        setTimerElapsed(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentTimer]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;

    // 确保新架构已初始化
    if (!newArchInitialized) {
      Alert.alert('错误', '系统未就绪，请稍后再试');
      return;
    }

    try {
      setUpdating(true);
      console.log('🚀 使用新架构更新任务状态');
      
      const updatedTask = await newTaskService.updateTaskStatus(task.id, newStatus);
      if (updatedTask) {
        setTask({
          ...updatedTask,
          subtasks: task.subtasks || [],
          dependencies: task.dependencies || []
        });
      }
      setShowStatusModal(false);
    } catch (error) {
      console.error('更新任务状态失败:', error);
      Alert.alert('错误', '更新任务状态失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!task) return;
    
    if (!editForm.title.trim()) {
      Alert.alert('提示', '任务标题不能为空');
      return;
    }

    // 确保新架构已初始化
    if (!newArchInitialized) {
      Alert.alert('错误', '系统未就绪，请稍后再试');
      return;
    }

    try {
      setUpdating(true);
      console.log('🚀 使用新架构更新任务');
      
      const updateData = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        priority: editForm.priority,
      };

      const updatedTask = await newTaskService.updateTask(task.id, updateData);
      if (updatedTask) {
        setTask({
          ...updatedTask,
          subtasks: task.subtasks || [],
          dependencies: task.dependencies || []
        });
      }
      setShowEditModal(false);
    } catch (error) {
      console.error('更新任务失败:', error);
      Alert.alert('错误', '更新任务失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) {
      console.log('[WebDeleteDebug] handleDeleteTask: Task object is null');
      return;
    }
    console.log(`[WebDeleteDebug] handleDeleteTask: Attempting to delete task with ID: ${task.id}`);

    // 确保新架构已初始化
    if (!newArchInitialized) {
      Alert.alert('错误', '系统未就绪，请稍后再试');
      return;
    }

    try {
      setUpdating(true);
      console.log('[WebDeleteDebug] handleDeleteTask: setUpdating(true)');
      
      console.log('[WebDeleteDebug] handleDeleteTask: 使用新架构删除任务...');
      const success = await newTaskService.deleteTask(task.id);
      console.log(`[WebDeleteDebug] handleDeleteTask: newTaskService.deleteTask returned: ${success}`);
      
      if (success) {
        console.log('[WebDeleteDebug] handleDeleteTask: Deletion successful');
        setShowDeleteModal(false);
        
        Alert.alert('成功', '任务已删除'); // Alert只显示消息
        
        // 设置状态以触发导航
        setShouldNavigateBack(true);
        console.log('[WebDeleteDebug] handleDeleteTask: setShouldNavigateBack(true)');

      } else {
        console.warn('[WebDeleteDebug] handleDeleteTask: Deletion reported as failed by service (success is false).');
        Alert.alert('提示', '删除任务操作未成功，请重试');
      }
    } catch (error) {
      console.error('[WebDeleteDebug] handleDeleteTask: Error caught:', error);
      Alert.alert('错误', '删除任务失败，请重试');
    } finally {
      console.log('[WebDeleteDebug] handleDeleteTask: setUpdating(false) in finally block');
      setUpdating(false);
    }
  };

  const handleAddWorkLog = async () => {
    if (!newLogContent.trim()) {
      Alert.alert('提示', '请输入工作内容');
      return;
    }

    if (!taskId) return;

    try {
      console.log('🚀 使用新架构添加工作日志');
      await newTaskService.addWorkLog({
        task_id: taskId,
        description: newLogContent.trim(),
      });

      setNewLogContent('');
      await loadWorkLogs();
      Alert.alert('成功', '工作日志添加成功');
    } catch (error) {
      console.error('添加工作日志失败:', error);
      Alert.alert('错误', '添加工作日志失败');
    }
  };

  const handleTimerToggle = async () => {
    if (!taskId) return;

    try {
      console.log('🚀 使用新架构切换计时器状态');

      if (isTimerRunning && currentTimer) {
        // 停止计时
        await newTaskService.stopWorkTimer(taskId);
        setIsTimerRunning(false);
        setCurrentTimer(null);
        setTimerElapsed(0);
      } else {
        // 开始计时
        const newTimer = await newTaskService.startWorkTimer(taskId, '开始工作');
        setCurrentTimer(newTimer);
        setIsTimerRunning(true);
        setTimerElapsed(0);
      }

      await loadWorkLogs();
    } catch (error) {
      console.error('计时器操作失败:', error);
      Alert.alert('错误', error instanceof Error ? error.message : '计时器操作失败');
    }
  };

  const handleDeleteWorkLog = async (logId: string) => {
    try {
      console.log('🚀 使用新架构删除工作日志');
      await newTaskService.deleteWorkLog(logId);
      await loadWorkLogs();
      Alert.alert('成功', '工作日志删除成功');
    } catch (error) {
      console.error('删除工作日志失败:', error);
      Alert.alert('错误', '删除工作日志失败');
    }
  };

  // 添加本地格式化函数
  const formatWorkTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const formatDateTime = (dateTimeString: string | Date | undefined): string => {
    if (!dateTimeString) return '未设置';
    try {
      const date = typeof dateTimeString === 'string' ? new Date(dateTimeString) : dateTimeString;
      if (isNaN(date.getTime())) return '日期格式错误';
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '日期格式错误';
    }
  };

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={COLORS.danger} />
          <Text style={styles.errorText}>任务不存在</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const availableStatuses = statusTransitions[task.status] || [];

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>任务详情</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setShowEditModal(true)} 
            style={styles.headerActionButton}
            disabled={updating}
          >
            <MaterialCommunityIcons name="pencil-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowDeleteModal(true)} 
            style={styles.headerActionButton}
            disabled={updating}
          >
            <MaterialCommunityIcons name="delete-outline" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Task Status */}
        <View style={styles.statusSection}>
          <TouchableOpacity 
            style={[styles.statusBadge, { backgroundColor: statusConfig[task.status].color }]}
            onPress={() => setShowStatusModal(true)}
            disabled={availableStatuses.length === 0 || updating}
          >
            <MaterialCommunityIcons 
              name={statusConfig[task.status].icon as any} 
              size={16} 
              color={COLORS.white} 
            />
            <Text style={styles.statusText}>{statusConfig[task.status].label}</Text>
            {availableStatuses.length > 0 && !updating && (
              <MaterialCommunityIcons name="chevron-down" size={16} color={COLORS.white} />
            )}
            {updating && (
              <ActivityIndicator size="small" color={COLORS.white} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        </View>

        {/* Task Info */}
        <View style={styles.section}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.description && (
            <Text style={styles.taskDescription}>{task.description}</Text>
          )}
          
          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="flag-outline" size={16} color={priorityConfig[task.priority].color} />
              <Text style={[styles.metaText, { color: priorityConfig[task.priority].color }]}>
                {priorityConfig[task.priority].label}
              </Text>
            </View>
            
            {task.due_date && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.gray500} />
                <Text style={styles.metaText}>
                  截止: {formatDateTime(task.due_date)}
                </Text>
              </View>
            )}
            
            {task.project && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="folder-outline" size={16} color={COLORS.primary} />
                <Text style={[styles.metaText, { color: COLORS.primary }]}>
                  {task.project.name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.timestamps}>
            <Text style={styles.timestampText}>
              创建于: {formatDateTime(task.created_at)}
            </Text>
            <Text style={styles.timestampText}>
              更新于: {formatDateTime(task.updated_at)}
            </Text>
          </View>
        </View>

        {/* Work Logs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>工作记录</Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowAddLogModal(true)}
            >
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* 时间跟踪 */}
          <View style={styles.timeTracker}>
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.gray500} />
                <Text style={styles.timeLabel}>今日工作</Text>
                <Text style={styles.timeValue}>
                  {formatWorkTime(workLogSummary.todayWorkTime)}
                </Text>
              </View>
              
              <View style={styles.timeItem}>
                <MaterialCommunityIcons name="chart-line" size={16} color={COLORS.gray500} />
                <Text style={styles.timeLabel}>总工作时间</Text>
                <Text style={styles.timeValue}>
                  {formatWorkTime(workLogSummary.totalWorkTime)}
                </Text>
              </View>
            </View>

            {/* 计时器 */}
            <TouchableOpacity 
              style={[styles.timerButton, isTimerRunning && styles.timerButtonActive]}
              onPress={handleTimerToggle}
            >
              <MaterialCommunityIcons 
                name={isTimerRunning ? "pause" : "play"} 
                size={20} 
                color={isTimerRunning ? COLORS.white : COLORS.primary} 
              />
              <Text style={[
                styles.timerButtonText, 
                isTimerRunning && styles.timerButtonTextActive
              ]}>
                {isTimerRunning ? `暂停计时 ${formatElapsedTime(timerElapsed)}` : '开始计时'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 工作日志列表 */}
          {workLogs.length > 0 ? (
            <View style={styles.workLogsList}>
              {workLogs.map((log) => (
                <View key={log.id} style={styles.workLogItem}>
                  <View style={styles.workLogHeader}>
                    <Text style={styles.workLogTime}>
                      {formatDateTime(log.start_time)}
                    </Text>
                    {log.end_time && (
                      <Text style={styles.workLogDuration}>
                        {formatWorkTime(Math.floor((new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / (1000 * 60)))}
                      </Text>
                    )}
                    {!log.end_time && (
                      <View style={styles.activeLogBadge}>
                        <Text style={styles.activeLogText}>进行中</Text>
                      </View>
                    )}
                  </View>
                  {log.description && (
                    <Text style={styles.workLogContent}>{log.description}</Text>
                  )}
                  <TouchableOpacity 
                    style={styles.deleteLogButton}
                    onPress={() => Alert.alert(
                      '确认删除',
                      '确定要删除这条工作日志吗？',
                      [
                        { text: '取消', style: 'cancel' },
                        { text: '删除', style: 'destructive', onPress: () => handleDeleteWorkLog(log.id) }
                      ]
                    )}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={COLORS.gray400} />
              <Text style={styles.emptyStateText}>还没有工作记录</Text>
              <Text style={styles.emptyStateSubtext}>点击右上角 + 号添加工作日志</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Status Change Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>更改状态</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statusList}>
              {availableStatuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.statusOption}
                  onPress={() => handleStatusChange(status)}
                  disabled={updating}
                >
                  <MaterialCommunityIcons 
                    name={statusConfig[status].icon as any} 
                    size={20} 
                    color={statusConfig[status].color} 
                  />
                  <Text style={styles.statusOptionText}>{statusConfig[status].label}</Text>
                  {updating && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑任务</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>标题</Text>
                <TextInput
                  style={styles.titleInput}
                  value={editForm.title}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
                  placeholder="任务标题"
                  placeholderTextColor={COLORS.gray500}
                  multiline
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>描述</Text>
                <TextInput
                  style={styles.descriptionInput}
                  value={editForm.description}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                  placeholder="任务描述"
                  placeholderTextColor={COLORS.gray500}
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>优先级</Text>
                <View style={styles.priorityOptions}>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.priorityOption,
                        editForm.priority === key && { 
                          backgroundColor: config.color,
                          borderColor: config.color 
                        }
                      ]}
                      onPress={() => setEditForm(prev => ({ ...prev, priority: key as Priority }))}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        editForm.priority === key && { color: COLORS.white }
                      ]}>
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowEditModal(false)}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveEdit}
                disabled={updating || !editForm.title.trim()}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <MaterialCommunityIcons 
              name="alert-circle-outline" 
              size={48} 
              color={COLORS.danger}
              style={styles.deleteIcon}
            />
            <Text style={styles.deleteTitle}>删除任务</Text>
            <Text style={styles.deleteMessage}>
              确定要删除任务"{task.title}"吗？此操作无法撤销。
            </Text>
            
            <View style={styles.deleteActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowDeleteModal(false)}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDeleteTask}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.deleteButtonText}>删除</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Work Log Modal */}
      <Modal
        visible={showAddLogModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddLogModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddLogModal(false)}
          >
            <TouchableOpacity 
              style={styles.addLogModalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>添加工作记录</Text>
                <TouchableOpacity onPress={() => setShowAddLogModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.gray500} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <TextInput
                  style={styles.logTextArea}
                  placeholder="记录工作内容、进展或遇到的问题..."
                  value={newLogContent}
                  onChangeText={setNewLogContent}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={COLORS.gray500}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton} 
                  onPress={() => setShowAddLogModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalSaveButton} 
                  onPress={async () => {
                    await handleAddWorkLog();
                    setShowAddLogModal(false);
                  }}
                  disabled={!newLogContent.trim()}
                >
                  <Text style={styles.modalSaveButtonText}>保存</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray500,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.danger,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textColor,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textColor,
  },
  addButton: {
    padding: 4,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: COLORS.gray600,
    lineHeight: 24,
    marginBottom: 16,
  },
  taskMeta: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: 8,
  },
  timestamps: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: 12,
  },
  timestampText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  timeTracker: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    gap: 8,
  },
  timerButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timerButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  timerButtonTextActive: {
    color: COLORS.white,
  },
  workLogsList: {
    padding: 16,
  },
  workLogItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  workLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workLogTime: {
    fontSize: 14,
    color: COLORS.textColor,
  },
  workLogDuration: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  activeLogBadge: {
    backgroundColor: COLORS.warning,
    padding: 4,
    borderRadius: 8,
  },
  activeLogText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  workLogContent: {
    fontSize: 16,
    color: COLORS.textColor,
    marginBottom: 8,
  },
  deleteLogButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.gray600,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
  },
  subtaskCheckbox: {
    marginRight: 16,
  },
  subtaskContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtaskTitle: {
    fontSize: 16,
    color: COLORS.textColor,
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.gray500,
  },
  dependencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
  },
  dependencyContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dependencyTitle: {
    fontSize: 16,
    color: COLORS.textColor,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  editModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  deleteModalContent: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textColor,
  },
  statusList: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  statusOptionText: {
    fontSize: 16,
    color: COLORS.textColor,
    marginLeft: 12,
    flex: 1,
  },
  editForm: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textColor,
    minHeight: 48,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textColor,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textColor,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  addLogModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    minHeight: 280,
    maxHeight: '60%',
  },
  logTextArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.textColor,
    padding: 16,
    textAlignVertical: 'top',
    backgroundColor: COLORS.white,
    minHeight: 120,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray600,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
  },
  deleteIcon: {
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 16,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray600,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});