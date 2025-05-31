import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 导入设计系统常量
import { COLORS } from '@/constants';
// 导入类型定义和服务
import { TaskDTO } from '../../lib/models/types';
import {
  CompletedTasksStatistics
} from '../../lib/services/task-service';
// 导入筛选器组件
import { TestDataGenerator } from '@/components/TestDataGenerator';
import { CompletedTaskFilters } from '../../lib/database/task-dao';
// 导入已完成任务相关组件
import { CompletedTasksFiltersComponent } from '@/components/CompletedTasksFilters';
import CompletedTasksList from '@/components/CompletedTasksList';
import { CompletedTasksStatsComponent } from '@/components/CompletedTasksStats';
// 导入优化的组件和Hooks
import { BatchOperationToolbar } from '@/components/BatchOperationToolbar';
import { OptimizedTaskList } from '@/components/OptimizedTaskList';
import { useTaskDataSync } from '@/contexts/DataSyncContext';
import { useResourceCleanup } from '@/hooks/useCleanup';
import { useTaskServiceSync } from '@/hooks/useTaskServiceSync';
import { TaskStatistics, useTaskStatistics } from '@/hooks/useTaskStatistics';
// 新架构相关导入
import { useNewApp } from '@/contexts/NewAppContext';
import { useNewTaskService } from '@/hooks/useNewTaskService';
import { newAppService } from '../../lib/services/NewAppService';

// 添加统计卡片组件 - 使用memo优化
const StatCard = React.memo<{
  title: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress?: () => void;
}>(({ title, value, icon, color, onPress }) => (
  <TouchableOpacity 
    style={[styles.statCard, { borderLeftColor: color }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.statCardContent}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <View style={styles.statCardText}>
        <Text style={styles.statCardValue}>{value}</Text>
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

// 优先级分布组件 - 使用memo优化
const PriorityDistribution = React.memo<{ stats: TaskStatistics }>(({ stats }) => (
  <View style={styles.prioritySection}>
    <Text style={styles.sectionTitle}>优先级分布</Text>
    <View style={styles.priorityRow}>
      <View style={[styles.priorityItem, { backgroundColor: COLORS.highPriority + '20' }]}>
        <Text style={[styles.priorityLabel, { color: COLORS.highPriority }]}>高</Text>
        <Text style={[styles.priorityValue, { color: COLORS.highPriority }]}>{stats.byPriority.high}</Text>
      </View>
      <View style={[styles.priorityItem, { backgroundColor: COLORS.mediumPriority + '20' }]}>
        <Text style={[styles.priorityLabel, { color: COLORS.mediumPriority }]}>中</Text>
        <Text style={[styles.priorityValue, { color: COLORS.mediumPriority }]}>{stats.byPriority.medium}</Text>
      </View>
      <View style={[styles.priorityItem, { backgroundColor: COLORS.lowPriority + '20' }]}>
        <Text style={[styles.priorityLabel, { color: COLORS.lowPriority }]}>低</Text>
        <Text style={[styles.priorityValue, { color: COLORS.lowPriority }]}>{stats.byPriority.low}</Text>
      </View>
    </View>
  </View>
));

// 空状态组件 - 使用memo优化
const EmptyStateComponent = React.memo<{ activeTab: string }>(({ activeTab }) => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons 
      name="clipboard-check-outline" 
      size={64} 
      color={COLORS.gray300} 
    />
    <Text style={styles.emptyText}>
      {activeTab === 'completed' ? '暂无已完成的任务' : '暂无任务'}
    </Text>
    <Text style={styles.emptySubtext}>
      点击右下角按钮创建新任务
    </Text>
  </View>
));

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'completed'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // 新架构Hooks
  const { isInitialized: newArchInitialized, initError: newArchError, isLoading: newArchLoading } = useNewApp();
  const newTaskService = useNewTaskService();

  // 数据同步Hook
  const { isTasksDataDirty, clearTasksDataDirty } = useTaskDataSync();
  
  // 初始化TaskService数据同步
  useTaskServiceSync();

  // 添加数据缓存和加载状态优化
  const [dataCache, setDataCache] = useState<{
    today?: TaskDTO[];
    all?: TaskDTO[];
    completed?: TaskDTO[];
  }>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState<{
    today?: boolean;
    all?: boolean;
    completed?: boolean;
  }>({});
  const [showTestDataGenerator, setShowTestDataGenerator] = useState(false);
  
  // 定时器和监听器引用
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 第四阶段主页面改造：已完成任务相关状态
  // 分页相关状态
  const [completedTasksPage, setCompletedTasksPage] = useState(1);
  const [completedTasksHasMore, setCompletedTasksHasMore] = useState(true);
  const [completedTasksTotal, setCompletedTasksTotal] = useState(0);
  const [completedTasksPageSize] = useState(50); // 增加分页大小到50
  const [loadingMoreCompletedTasks, setLoadingMoreCompletedTasks] = useState(false);
  
  // 筛选相关状态
  const [completedTasksFilters, setCompletedTasksFilters] = useState<CompletedTaskFilters>({});
  const [showCompletedTasksFilters, setShowCompletedTasksFilters] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<Array<{id: string; name: string}>>([]);
  
  // 批量选择相关状态
  const [selectedCompletedTaskIds, setSelectedCompletedTaskIds] = useState<string[]>([]);
  const [isCompletedTasksSelectionMode, setIsCompletedTasksSelectionMode] = useState(false);
  // 添加全部已完成任务ID列表用于真正的全选功能
  const [allCompletedTaskIds, setAllCompletedTaskIds] = useState<string[]>([]);
  
  // 统计信息状态
  const [completedTasksStatistics, setCompletedTasksStatistics] = useState<CompletedTasksStatistics | null>(null);
  const [showCompletedTasksStats, setShowCompletedTasksStats] = useState(false);
  const [loadingCompletedTasksStats, setLoadingCompletedTasksStats] = useState(false);

  // 使用优化的统计Hook
  const statistics = useTaskStatistics(tasks);

  // 使用内存清理Hook
  useResourceCleanup({
    timers: [refreshTimer, debounceTimer],
    custom: [
      () => {
        // 清理任何其他资源
        setDataCache({});
      }
    ]
  });

  // 加载任务数据 - 优化版本，支持缓存和新架构
  const loadTasks = useCallback(async (forceRefresh = false) => {
    try {
      console.log(`[TaskList] 开始加载任务数据, activeTab: ${activeTab}, forceRefresh: ${forceRefresh}`);
      
      // 确保新架构已初始化
      if (!newArchInitialized) {
        console.log('[TaskList] 新架构未初始化，跳过数据加载');
        return;
      }
      
      // 如果有缓存且不是强制刷新，直接使用缓存
      if (!forceRefresh && dataCache[activeTab] && isInitialized) {
        console.log(`[TaskList] 使用缓存数据, activeTab: ${activeTab}, 数量: ${dataCache[activeTab]!.length}`);
        setTasks(dataCache[activeTab]!);
        setLoading(false);
        return;
      }

      // 标记当前标签页正在加载
      setIsDataLoading(prev => ({ ...prev, [activeTab]: true }));

      let taskList: TaskDTO[] = [];

      console.log('🚀 使用新架构加载任务数据');
      switch (activeTab) {
        case 'today':
          taskList = await newTaskService.getTodayTasks();
          console.log(`[TaskList] 新架构-今天任务加载完成, 数量: ${taskList.length}`);
          break;
        case 'all':
          taskList = await newTaskService.getActiveTasks();
          console.log(`[TaskList] 新架构-全部任务加载完成, 数量: ${taskList.length}`);
          break;
        case 'completed':
          taskList = await newTaskService.getCompletedTasks(50); // 限制最近50个已完成任务
          console.log(`[TaskList] 新架构-已完成任务加载完成, 数量: ${taskList.length}`);
          break;
      }

      setTasks(taskList);
      // 更新缓存
      setDataCache(prev => ({ ...prev, [activeTab]: taskList }));
      console.log(`[TaskList] 任务数据设置完成, 当前tasks.length: ${taskList.length}`);
    } catch (error) {
      console.error('[TaskList] 加载任务失败:', error);
      Alert.alert('错误', '加载任务数据失败，请重试');
      // 确保在错误情况下也清空任务列表
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsDataLoading(prev => ({ ...prev, [activeTab]: false }));
      console.log(`[TaskList] 加载完成, loading: false, refreshing: false`);
    }
  }, [activeTab, dataCache, isInitialized, newTaskService, newArchInitialized]);

  // 使用useMemo缓存事件处理器
  const handleTaskToggle = useCallback(async (taskId: string) => {
    try {
      console.log('🔄 使用新架构切换任务状态:', taskId);
      const task = await newTaskService.getTaskById(taskId);
      if (task) {
        const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
        const updatedTask = await newTaskService.updateTaskStatus(taskId, newStatus);
        
        if (updatedTask) {
          // 清除相关缓存，因为任务状态变化会影响多个标签页
          setDataCache({});
          // 重新加载当前标签页的数据
          await loadTasks(true);
        }
      }
    } catch (error) {
      console.error('更新任务状态失败:', error);
      Alert.alert('错误', '更新任务状态失败，请重试');
    }
  }, [newTaskService, loadTasks]);

  const handleTaskEdit = useCallback((task: TaskDTO) => {
    router.push(`/task/${task.id}`);
  }, []);

  const handleTaskPress = useCallback((taskId: string) => {
    router.push(`/task/${taskId}`);
  }, []);

  // 加载已完成任务
  const loadCompletedTasks = useCallback(async (forceRefresh = false, page = 1) => {
    try {
      console.log(`[TaskList] 开始加载已完成任务, page: ${page}, forceRefresh: ${forceRefresh}`);
      
      // 确保新架构已初始化
      if (!newArchInitialized) {
        console.log('[TaskList] 新架构未初始化，跳过已完成任务加载');
        return;
      }
      
      // 如果是第一页且有缓存且不是强制刷新，直接使用缓存
      if (page === 1 && !forceRefresh && dataCache.completed && isInitialized) {
        console.log(`[TaskList] 使用缓存数据, 数量: ${dataCache.completed!.length}`);
        setTasks(dataCache.completed!);
        setLoading(false);
        return;
      }

      // 标记正在加载
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMoreCompletedTasks(true);
      }
      
      setIsDataLoading(prev => ({ ...prev, completed: true }));

      console.log('🚀 使用新架构加载已完成任务数据');
      
      // 使用新架构获取已完成任务
      const tasks = await newTaskService.getCompletedTasks(completedTasksPageSize * page);
      
      // 模拟分页效果 - 根据页码计算起始位置
      const startIndex = (page - 1) * completedTasksPageSize;
      const endIndex = startIndex + completedTasksPageSize;
      const paginatedTasks = tasks.slice(startIndex, endIndex);
      
      const result = {
        tasks: paginatedTasks,
        total: tasks.length,
        hasMore: endIndex < tasks.length
      };
      
      // 如果是第一页，同时获取所有已完成任务的ID用于真正的全选功能
      if (page === 1) {
        const allCompletedTasks = tasks.map(task => task.id);
        setAllCompletedTaskIds(allCompletedTasks);
        console.log(`[TaskList] 获取所有已完成任务ID, 数量: ${allCompletedTasks.length}`);
      }
      
      console.log(`[TaskList] 已完成任务加载完成, 页码: ${page}, 数量: ${result.tasks.length}, 总数: ${result.total}`);
      
      // 更新分页相关状态
      setCompletedTasksHasMore(result.hasMore);
      setCompletedTasksTotal(result.total);
      
      if (page === 1) {
        // 如果是第一页，替换全部数据
        setTasks(result.tasks);
        // 更新缓存
        setDataCache(prev => ({ ...prev, completed: result.tasks }));
      } else {
        // 如果是加载更多，追加数据
        setTasks(prev => [...prev, ...result.tasks]);
      }
      
      setCompletedTasksPage(page);
    } catch (error) {
      console.error('[TaskList] 加载已完成任务失败:', error);
      Alert.alert('错误', '加载已完成任务数据失败，请重试');
      if (page === 1) {
        setTasks([]);
        setAllCompletedTaskIds([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMoreCompletedTasks(false);
      setIsDataLoading(prev => ({ ...prev, completed: false }));
    }
  }, [dataCache, isInitialized, completedTasksPageSize, completedTasksFilters, newTaskService, newArchInitialized]);

  // 其余方法保持不变，但使用useCallback优化
  const loadCompletedTasksStatistics = useCallback(async () => {
    try {
      setLoadingCompletedTasksStats(true);
      
      // 确保新架构已初始化
      if (!newArchInitialized) {
        console.log('[TaskList] 新架构未初始化，跳过统计加载');
        return;
      }
      
      console.log('🚀 使用新架构加载已完成任务统计');
      
      // 使用新架构获取统计信息
      const allCompletedTasks = await newTaskService.getCompletedTasks();
      
      // 手动计算统计信息
      const today = new Date();
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const stats = {
        totalCompleted: allCompletedTasks.length,
        todayCompleted: allCompletedTasks.filter(task => {
          if (!task.completed_at) return false;
          const completedDate = new Date(task.completed_at);
          const today = new Date();
          return completedDate.toDateString() === today.toDateString();
        }).length,
        weekCompleted: allCompletedTasks.filter(task => 
          task.completed_at && new Date(task.completed_at) >= thisWeek
        ).length,
        monthCompleted: allCompletedTasks.filter(task => 
          task.completed_at && new Date(task.completed_at) >= thisMonth
        ).length,
        completionTrend: [],
        topProjects: [],
        averageCompletionTime: 0
      };
      
      setCompletedTasksStatistics(stats);
    } catch (error) {
      console.error('[TaskList] 加载已完成任务统计失败:', error);
    } finally {
      setLoadingCompletedTasksStats(false);
    }
  }, [newTaskService, newArchInitialized]);

  const loadProjects = useCallback(async () => {
    try {
      // 确保新架构已初始化
      if (!newArchInitialized) {
        console.log('[TaskList] 新架构未初始化，跳过项目加载');
        return;
      }
      
      console.log('🚀 使用新架构加载项目列表');
      
      const projectRepository = newAppService.getContainer().resolve('projectRepository') as any;
      const projects = await projectRepository.findAll();
      setAvailableProjects(projects.map((p: any) => ({ id: p.id, name: p.name })));
    } catch (error) {
      console.error('[TaskList] 加载项目列表失败:', error);
    }
  }, [newArchInitialized]);

  // 刷新数据 - 强制刷新并清除缓存
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 清除所有缓存
      setDataCache({});
      await Promise.all([loadTasks(true)]);
    } catch (error) {
      console.error('刷新数据失败:', error);
      Alert.alert('错误', '刷新数据失败，请重试');
    } finally {
      setRefreshing(false);
    }
  }, [loadTasks]);

  // 获取标签页标题
  const getTabTitle = useCallback(() => {
    switch (activeTab) {
      case 'today':
        return '今天';
      case 'all':
        return '全部任务';
      case 'completed':
        return '已完成';
      default:
        return '任务';
    }
  }, [activeTab]);

  // 处理统计卡片点击
  const handleStatCardPress = useCallback((type: string) => {
    switch (type) {
      case 'overdue':
        setActiveTab('all');
        break;
      case 'completed':
        setActiveTab('completed');
        break;
      case 'inProgress':
        setActiveTab('all');
        break;
    }
  }, []);

  // 处理测试数据生成后的刷新
  const handleTestDataCreated = useCallback(() => {
    setDataCache({});
    handleRefresh();
  }, [handleRefresh]);

  // 页面焦点时重新加载数据 - 优化版本
  useFocusEffect(
    useCallback(() => {
      console.log('[WebRefreshDebug] Focus effect triggered in TodoScreen, activeTab:', activeTab);
      console.log('[DataSync] isTasksDataDirty:', isTasksDataDirty);
      console.log('[NewArch] newArchInitialized:', newArchInitialized);
      
      const loadData = async () => {
        // 等待新架构初始化完成
        if (!newArchInitialized) {
          console.log('[TodoScreen] 等待新架构初始化完成...');
          return;
        }
        
        // 如果数据为脏或未初始化，则强制刷新
        const shouldForceRefresh = !isInitialized || isTasksDataDirty;
        
        if (shouldForceRefresh && loading === false) {
          setLoading(true);
          // 清除所有缓存，确保数据一致性
          setDataCache({});
        }
        
        try {
          if (activeTab === 'completed') {
            await loadCompletedTasks(shouldForceRefresh);
            if (!isInitialized) {
              await loadCompletedTasksStatistics();
              await loadProjects();
            }
          } else {
            await loadTasks(shouldForceRefresh);
          }
          
          // 如果数据被刷新了，清除脏标记
          if (isTasksDataDirty) {
            console.log('[DataSync] 清除任务数据脏标记');
            clearTasksDataDirty();
          }
          
          if (!isInitialized) {
            setIsInitialized(true);
          }
        } catch (error) {
          console.error('[TodoScreen] 数据加载失败:', error);
        }
      };
      
      loadData();
    }, [activeTab, isInitialized, isTasksDataDirty, newArchInitialized])
  );

  // 标签页切换时的数据加载 - 优化版本  
  useEffect(() => {
    console.log(`[WebRefreshDebug] useEffect for activeTab: ${activeTab} triggered`);
    
    // 确保新架构已初始化
    if (isInitialized && newArchInitialized) {
      if (activeTab === 'completed') {
        if (dataCache[activeTab]) {
          setTasks(dataCache[activeTab]!);
        } else if (!isDataLoading[activeTab]) {
          loadCompletedTasks(false);
        }
        
        if (!completedTasksStatistics && !loadingCompletedTasksStats) {
          loadCompletedTasksStatistics();
        }
      } else {
        if (dataCache[activeTab]) {
          setTasks(dataCache[activeTab]!);
        } else if (!isDataLoading[activeTab]) {
          loadTasks(false);
        }
      }
    }
  }, [activeTab, isInitialized, newArchInitialized]);

  // 新架构初始化完成后的数据加载
  useEffect(() => {
    if (newArchInitialized && !isInitialized) {
      console.log('[TodoScreen] 新架构初始化完成，开始加载数据...');
      const initializeData = async () => {
        try {
          setLoading(true);
          if (activeTab === 'completed') {
            await loadCompletedTasks(true);
            await loadCompletedTasksStatistics();
            await loadProjects();
          } else {
            await loadTasks(true);
          }
          setIsInitialized(true);
        } catch (error) {
          console.error('[TodoScreen] 初始化数据加载失败:', error);
        } finally {
          setLoading(false);
        }
      };
      initializeData();
    }
  }, [newArchInitialized]);

  // 其余的渲染逻辑保持不变，但使用优化的组件
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>待办事项</Text>
        <View style={styles.headerActions}>
          {activeTab === 'completed' && (
            <>
              <TouchableOpacity onPress={async () => {
                console.log('[TodoScreen DEBUG] Stats icon clicked. Current showCompletedTasksStats:', showCompletedTasksStats);
                const newShowStats = !showCompletedTasksStats;
                setShowCompletedTasksStats(newShowStats);
                
                if (newShowStats && !completedTasksStatistics) {
                  console.log('[TodoScreen DEBUG] Loading completed tasks statistics...');
                  await loadCompletedTasksStatistics();
                }
              }}>
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={24}
                  color={showCompletedTasksStats ? COLORS.primary : COLORS.gray500}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction} onPress={() => setShowCompletedTasksFilters(!showCompletedTasksFilters)}>
                <MaterialCommunityIcons
                  name="filter"
                  size={24}
                  color={Object.keys(completedTasksFilters).length > 0 ? COLORS.primary : COLORS.gray500}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction} onPress={() => setIsCompletedTasksSelectionMode(!isCompletedTasksSelectionMode)}>
                <MaterialCommunityIcons
                  name="checkbox-multiple-marked-outline"
                  size={24}
                  color={isCompletedTasksSelectionMode ? COLORS.primary : COLORS.gray500}
                />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={() => router.push('/search')}>
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.gray500} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerAction} 
            onPress={() => setShowTestDataGenerator(!showTestDataGenerator)}
          >
            <MaterialCommunityIcons 
              name="flask" 
              size={24} 
              color={showTestDataGenerator ? COLORS.primary : COLORS.gray500} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={handleRefresh}>
            <MaterialCommunityIcons 
              name="refresh" 
              size={24} 
              color={refreshing ? COLORS.primary : COLORS.gray500} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 已完成任务统计组件 */}
      {activeTab === 'completed' && showCompletedTasksStats && (
        <CompletedTasksStatsComponent
          statistics={completedTasksStatistics}
          isExpanded={showCompletedTasksStats}
          onToggleExpanded={() => setShowCompletedTasksStats(!showCompletedTasksStats)}
          onRefresh={loadCompletedTasksStatistics}
          isLoading={loadingCompletedTasksStats}
        />
      )}

      {/* 已完成任务筛选组件 */}
      {activeTab === 'completed' && showCompletedTasksFilters && (
        <CompletedTasksFiltersComponent
          filters={completedTasksFilters}
          onFiltersChange={(newFilters) => {
            setCompletedTasksFilters(newFilters);
            setCompletedTasksPage(1);
            // 重置选择状态
            setSelectedCompletedTaskIds([]);
            setIsCompletedTasksSelectionMode(false);
            loadCompletedTasks(true, 1);
          }}
          projects={availableProjects}
          isExpanded={showCompletedTasksFilters}
          onToggleExpanded={() => setShowCompletedTasksFilters(!showCompletedTasksFilters)}
        />
      )}

      {/* 测试数据生成器 */}
      {showTestDataGenerator && (
        <TestDataGenerator 
          onTasksCreated={handleTestDataCreated}
          onTasksCleared={handleTestDataCreated}
        />
      )}

      {/* 统计信息区域 */}
      {showStats && statistics && activeTab !== 'completed' && (
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <StatCard
              title="总任务"
              value={statistics.total}
              icon="format-list-checks"
              color={COLORS.primary}
              onPress={() => setActiveTab('all')}
            />
            <StatCard
              title="已完成"
              value={statistics.completed}
              icon="check-circle"
              color={COLORS.success}
              onPress={() => handleStatCardPress('completed')}
            />
            <StatCard
              title="进行中"
              value={statistics.inProgress}
              icon="clock-outline"
              color={COLORS.warning}
              onPress={() => handleStatCardPress('inProgress')}
            />
            <StatCard
              title="逾期"
              value={statistics.overdue}
              icon="alert-circle"
              color={COLORS.danger}
              onPress={() => handleStatCardPress('overdue')}
            />
          </View>
          
          <PriorityDistribution stats={statistics} />
        </View>
      )}

      {/* 分类选项卡 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            今天
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            全部
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            已完成
          </Text>
        </TouchableOpacity>
      </View>

      {/* 任务列表 */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{getTabTitle()}</Text>
          <View style={styles.taskCount}>
            <Text style={styles.taskCountText}>
              {activeTab === 'completed' ? `${tasks.length}/${completedTasksTotal}项` : `${tasks.length}项`}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : activeTab === 'completed' ? (
          <CompletedTasksList
            tasks={tasks}
            hasMore={completedTasksHasMore}
            isLoading={loadingMoreCompletedTasks}
            onLoadMore={() => {
              if (!loadingMoreCompletedTasks && completedTasksHasMore) {
                const nextPage = completedTasksPage + 1;
                loadCompletedTasks(false, nextPage);
              }
            }}
            isSelectionMode={isCompletedTasksSelectionMode}
            selectedTaskIds={selectedCompletedTaskIds}
            onToggleSelect={(taskId) => {
              if (isCompletedTasksSelectionMode) {
                setSelectedCompletedTaskIds(prev => {
                  if (prev.includes(taskId)) {
                    return prev.filter(id => id !== taskId);
                  } else {
                    return [...prev, taskId];
                  }
                });
              } else {
                setIsCompletedTasksSelectionMode(true);
                setSelectedCompletedTaskIds([taskId]);
              }
            }}
            onTaskPress={handleTaskPress}
          />
        ) : (
          <OptimizedTaskList
            tasks={tasks}
            onTaskToggle={handleTaskToggle}
            onTaskEdit={handleTaskEdit}
            onTaskPress={handleTaskPress}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={<EmptyStateComponent activeTab={activeTab} />}
          />
        )}
      </View>

      {/* 批量操作工具栏 */}
      {activeTab === 'completed' && isCompletedTasksSelectionMode && (
        <BatchOperationToolbar 
          selectedCount={selectedCompletedTaskIds.length}
          totalCount={tasks.length}
          onDeleteAll={async () => {
            try {
              setLoading(true);
              console.log('🚀 使用新架构批量删除任务');
              await newTaskService.batchDelete(selectedCompletedTaskIds);
              
              setSelectedCompletedTaskIds([]);
              setIsCompletedTasksSelectionMode(false);
              
              await loadCompletedTasks(true);
              await loadCompletedTasksStatistics();
              
              Alert.alert('成功', '已删除选中的任务');
            } catch (error) {
              console.error('[TaskList] 批量删除任务失败:', error);
              Alert.alert('错误', '批量删除任务失败，请重试');
            } finally {
              setLoading(false);
            }
          }}
          onRestoreAll={async () => {
            try {
              setLoading(true);
              console.log('🚀 使用新架构批量恢复任务');
              await newTaskService.batchRestoreCompletedTasks(selectedCompletedTaskIds);
              
              setSelectedCompletedTaskIds([]);
              setIsCompletedTasksSelectionMode(false);
              
              await loadCompletedTasks(true);
              await loadCompletedTasksStatistics();
              
              Alert.alert('成功', '已将选中的任务恢复为未完成状态');
            } catch (error) {
              console.error('[TaskList] 批量恢复任务失败:', error);
              Alert.alert('错误', '批量恢复任务失败，请重试');
            } finally {
              setLoading(false);
            }
          }}
          onExportAll={async () => {
            try {
              console.log('🚀 使用新架构导出任务');
              
              const exportFilters: CompletedTaskFilters = selectedCompletedTaskIds.length > 0
                ? { taskIds: selectedCompletedTaskIds }
                : completedTasksFilters;
                
              const exportData = await newTaskService.exportTasks(exportFilters);
              
              console.log('[TaskList] 导出数据:', exportData);
              Alert.alert('导出成功', '已导出任务数据');
              
              return exportData;
            } catch (error) {
              console.error('[TaskList] 导出任务失败:', error);
              Alert.alert('错误', '导出任务失败，请重试');
              throw error;
            }
          }}
          onSelectAll={() => setSelectedCompletedTaskIds(allCompletedTaskIds)}
          onDeselectAll={() => setSelectedCompletedTaskIds([])}
          onClearSelection={() => {
            setSelectedCompletedTaskIds([]);
            setIsCompletedTasksSelectionMode(false);
          }}
          isAllSelected={selectedCompletedTaskIds.length === allCompletedTaskIds.length && allCompletedTaskIds.length > 0}
        />
      )}

      {/* 浮动操作按钮 */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/task/create')}
      >
        <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textColor,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.gray500,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray500,
  },
  taskCount: {
    marginLeft: 8,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  taskCountText: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.gray500,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 8,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: COLORS.white,
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
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardText: {
    marginLeft: 12,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textColor,
  },
  statCardTitle: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  prioritySection: {
    marginBottom: 24,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityItem: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.gray100,
    borderRadius: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textColor,
    marginBottom: 4,
  },
  priorityValue: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  statsContainer: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
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
    padding: 12,
  },
  scrollContent: {
    flex: 1,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
});