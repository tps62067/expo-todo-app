# 已完成任务功能增强技术规划文档

## 1. 概述

本文档提供了对「已完成」标签页功能增强的详细技术规划，包括分页加载机制、筛选与搜索功能、信息展示优化以及交互体验改进。这些增强功能旨在提升用户查看和管理已完成任务的体验，特别是在任务数量较多的情况下。

## 2. 当前实现分析

### 2.1 现有功能

目前「已完成」标签页的实现存在以下特点和限制：

- 数据获取：通过 `TaskService.getCompletedTasks(50)` 方法获取最多50条已完成任务
- 数据库查询：使用 `TaskDAO.findCompletedTasks(limit)` 方法，按完成时间倒序排列
- 展示方式：一次性加载所有结果，无分页或虚拟列表机制
- 筛选功能：无时间范围或项目类别筛选
- 搜索功能：无针对已完成任务的搜索功能
- 信息展示：显示基本任务信息，但缺少完成时间等详细信息
- 批量操作：不支持批量操作

### 2.2 现有代码结构

- UI层：`app/(tabs)/index.tsx` 中的 `TodoScreen` 组件
- 服务层：`lib/services/task-service.ts` 中的 `TaskService` 类
- 数据访问层：`lib/database/task-dao.ts` 中的 `TaskDAO` 类
- 数据模型：`lib/models/types.ts` 中的 `Task` 和 `TaskDTO` 类型

## 3. 功能增强详细规划

### 3.1 分页加载机制

#### 3.1.1 数据库层修改

在 `task-dao.ts` 中增强 `findCompletedTasks` 方法，支持分页参数：

```typescript
async findCompletedTasks(options?: { 
  limit?: number; 
  offset?: number; 
  timeRange?: { start?: string; end?: string }; 
  projectId?: string;
  searchQuery?: string;
}): Promise<Task[]> {
  let sql = `
    SELECT * FROM ${this.tableName} 
    WHERE is_deleted_locally = 0 
    AND status = 'completed'
  `;
  const params: any[] = [];
  
  // 添加时间范围筛选
  if (options?.timeRange) {
    if (options.timeRange.start) {
      sql += ` AND completed_at >= ?`;
      params.push(options.timeRange.start);
    }
    if (options.timeRange.end) {
      sql += ` AND completed_at <= ?`;
      params.push(options.timeRange.end);
    }
  }
  
  // 添加项目筛选
  if (options?.projectId) {
    sql += ` AND project_id = ?`;
    params.push(options.projectId);
  }
  
  // 添加搜索条件
  if (options?.searchQuery) {
    sql += ` AND (title LIKE ? OR description LIKE ?)`;
    const searchPattern = `%${options.searchQuery}%`;
    params.push(searchPattern, searchPattern);
  }
  
  // 排序
  sql += ` ORDER BY completed_at DESC`;
  
  // 分页
  if (options?.limit) {
    sql += ` LIMIT ?`;
    params.push(options.limit);
    
    if (options?.offset) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }
  }
  
  return await this.dbManager.getAllAsync<Task>(sql, params);
}
```

#### 3.1.2 服务层修改

在 `task-service.ts` 中增强 `getCompletedTasks` 方法：

```typescript
public async getCompletedTasks(options?: {
  limit?: number;
  offset?: number;
  timeRange?: { start?: Date; end?: Date };
  projectId?: string;
  searchQuery?: string;
}): Promise<{ tasks: TaskDTO[]; hasMore: boolean }> {
  // 转换日期格式
  let timeRangeISO;
  if (options?.timeRange) {
    timeRangeISO = {
      start: options.timeRange.start?.toISOString(),
      end: options.timeRange.end?.toISOString()
    };
  }
  
  // 查询当前页数据
  const tasks = await this.dbService.taskDAO.findCompletedTasks({
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    timeRange: timeRangeISO,
    projectId: options?.projectId,
    searchQuery: options?.searchQuery
  });
  
  // 查询是否还有更多数据
  const nextPageTasks = await this.dbService.taskDAO.findCompletedTasks({
    limit: 1,
    offset: (options?.offset || 0) + (options?.limit || 20),
    timeRange: timeRangeISO,
    projectId: options?.projectId,
    searchQuery: options?.searchQuery
  });
  
  const hasMore = nextPageTasks.length > 0;
  
  return {
    tasks: await Promise.all(tasks.map(task => this.convertToDTO(task))),
    hasMore
  };
}
```

#### 3.1.3 UI层修改

在 `app/(tabs)/index.tsx` 中修改 `TodoScreen` 组件，添加分页加载逻辑：

```typescript
// 添加分页状态
const [completedTasksPage, setCompletedTasksPage] = useState(0);
const [hasMoreCompletedTasks, setHasMoreCompletedTasks] = useState(true);

// 修改加载任务数据的方法
const loadTasks = async (loadMore = false) => {
  try {
    console.log(`[TaskList] 开始加载任务数据, activeTab: ${activeTab}, loadMore: ${loadMore}`);
    const taskService = appService.tasks;
    let taskList: TaskDTO[] = [];

    switch (activeTab) {
      case 'today':
        taskList = await taskService.getTodayTasks();
        console.log(`[TaskList] 今天任务加载完成, 数量: ${taskList.length}`);
        break;
      case 'all':
        taskList = await taskService.getActiveTasks();
        console.log(`[TaskList] 全部任务加载完成, 数量: ${taskList.length}`);
        break;
      case 'completed':
        const pageSize = 20;
        const currentPage = loadMore ? completedTasksPage + 1 : 0;
        
        // 获取筛选条件
        const { tasks, hasMore } = await taskService.getCompletedTasks({
          limit: pageSize,
          offset: currentPage * pageSize,
          timeRange: completedTasksTimeRange,
          projectId: selectedProjectId,
          searchQuery: searchQuery
        });
        
        if (loadMore) {
          taskList = [...tasks, ...tasks];
        } else {
          taskList = tasks;
        }
        
        setCompletedTasksPage(currentPage);
        setHasMoreCompletedTasks(hasMore);
        console.log(`[TaskList] 已完成任务加载完成, 数量: ${taskList.length}, 还有更多: ${hasMore}`);
        break;
    }

    setTasks(prevTasks => loadMore ? [...prevTasks, ...taskList] : taskList);
    console.log(`[TaskList] 任务数据设置完成, 当前tasks.length: ${loadMore ? tasks.length + taskList.length : taskList.length}`);
  } catch (error) {
    console.error('[TaskList] 加载任务失败:', error);
    Alert.alert('错误', '加载任务数据失败，请重试');
  } finally {
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
    console.log(`[TaskList] 加载完成, loading: false, refreshing: false`);
  }
};

// 添加加载更多方法
const [loadingMore, setLoadingMore] = useState(false);

const handleLoadMore = () => {
  if (activeTab === 'completed' && hasMoreCompletedTasks && !loadingMore) {
    setLoadingMore(true);
    loadTasks(true);
  }
};

// 在ScrollView中添加加载更多功能
<FlatList
  data={tasks}
  keyExtractor={item => item.id}
  renderItem={({ item }) => (
    <TaskCard task={item} onToggle={toggleTask} />
  )}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={
    loadingMore ? (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>加载更多...</Text>
      </View>
    ) : null
  }
/>
```

### 3.2 筛选与搜索功能

#### 3.2.1 时间范围筛选

在 `app/(tabs)/index.tsx` 中添加时间范围筛选组件：

```typescript
// 添加时间范围状态
const [completedTasksTimeRange, setCompletedTasksTimeRange] = useState<{
  start?: Date;
  end?: Date;
  preset?: 'today' | 'thisWeek' | 'thisMonth' | 'custom';
}>();

// 添加时间范围选择器组件
const TimeRangeSelector = () => {
  const presets = [
    { label: '今天', value: 'today' },
    { label: '本周', value: 'thisWeek' },
    { label: '本月', value: 'thisMonth' },
    { label: '自定义', value: 'custom' }
  ];
  
  const handlePresetChange = (preset: 'today' | 'thisWeek' | 'thisMonth' | 'custom') => {
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined = new Date(now);
    
    switch (preset) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'thisWeek':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // 本周日
        start.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        // 打开日期选择器
        return;
    }
    
    setCompletedTasksTimeRange({ start, end, preset });
    setCompletedTasksPage(0); // 重置分页
    loadTasks();
  };
  
  return (
    <View style={styles.timeRangeSelector}>
      {presets.map(preset => (
        <TouchableOpacity
          key={preset.value}
          style={[
            styles.timeRangeOption,
            completedTasksTimeRange?.preset === preset.value && styles.timeRangeOptionActive
          ]}
          onPress={() => handlePresetChange(preset.value as any)}
        >
          <Text
            style={[
              styles.timeRangeOptionText,
              completedTasksTimeRange?.preset === preset.value && styles.timeRangeOptionTextActive
            ]}
          >
            {preset.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// 在已完成标签页中添加时间范围选择器
{activeTab === 'completed' && (
  <TimeRangeSelector />
)}
```

#### 3.2.2 项目类别筛选

在 `app/(tabs)/index.tsx` 中添加项目筛选组件：

```typescript
// 添加项目筛选状态
const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
const [selectedProjectId, setSelectedProjectId] = useState<string>();

// 加载项目列表
const loadProjects = async () => {
  try {
    const projectService = appService.projects;
    const projectList = await projectService.getAllProjects();
    setProjects(projectList);
  } catch (error) {
    console.error('加载项目列表失败:', error);
  }
};

// 在组件初始化时加载项目列表
useEffect(() => {
  loadProjects();
}, []);

// 添加项目选择器组件
const ProjectSelector = () => {
  return (
    <View style={styles.projectSelector}>
      <Text style={styles.sectionTitle}>按项目筛选</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectList}>
        <TouchableOpacity
          style={[
            styles.projectItem,
            !selectedProjectId && styles.projectItemActive
          ]}
          onPress={() => {
            setSelectedProjectId(undefined);
            setCompletedTasksPage(0); // 重置分页
            loadTasks();
          }}
        >
          <Text
            style={[
              styles.projectItemText,
              !selectedProjectId && styles.projectItemTextActive
            ]}
          >
            全部
          </Text>
        </TouchableOpacity>
        
        {projects.map(project => (
          <TouchableOpacity
            key={project.id}
            style={[
              styles.projectItem,
              selectedProjectId === project.id && styles.projectItemActive
            ]}
            onPress={() => {
              setSelectedProjectId(project.id);
              setCompletedTasksPage(0); // 重置分页
              loadTasks();
            }}
          >
            <Text
              style={[
                styles.projectItemText,
                selectedProjectId === project.id && styles.projectItemTextActive
              ]}
            >
              {project.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// 在已完成标签页中添加项目选择器
{activeTab === 'completed' && (
  <>
    <TimeRangeSelector />
    <ProjectSelector />
  </>
)}
```

#### 3.2.3 搜索功能

在 `app/(tabs)/index.tsx` 中添加搜索功能：

```typescript
// 添加搜索状态
const [searchQuery, setSearchQuery] = useState('');
const [showSearch, setShowSearch] = useState(false);

// 添加搜索组件
const SearchBar = () => {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="搜索已完成任务..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
        onSubmitEditing={() => {
          setCompletedTasksPage(0); // 重置分页
          loadTasks();
        }}
      />
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => {
          setCompletedTasksPage(0); // 重置分页
          loadTasks();
        }}
      >
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

// 修改顶部栏，添加搜索切换按钮
<View style={styles.headerActions}>
  {activeTab === 'completed' && (
    <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
      <MaterialCommunityIcons 
        name={showSearch ? "close" : "magnify"} 
        size={24} 
        color={COLORS.gray500} 
      />
    </TouchableOpacity>
  )}
  <TouchableOpacity style={styles.headerAction} onPress={handleRefresh}>
    <MaterialCommunityIcons 
      name="refresh" 
      size={24} 
      color={refreshing ? COLORS.primary : COLORS.gray500} 
    />
  </TouchableOpacity>
</View>

// 在已完成标签页中添加搜索栏
{activeTab === 'completed' && showSearch && (
  <SearchBar />
)}
```

### 3.3 丰富信息展示

#### 3.3.1 显示完成时间

修改任务卡片组件，添加完成时间显示：

```typescript
// 在TaskCard组件中添加完成时间显示
{task.status === 'completed' && task.completed_at && (
  <View style={styles.completedTimeContainer}>
    <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} />
    <Text style={styles.completedTimeText}>
      完成于 {formatDisplayTime(task.completed_at)}
    </Text>
  </View>
)}
```

#### 3.3.2 添加统计信息

在已完成标签页添加统计信息组件：

```typescript
// 添加统计信息状态
const [completedStats, setCompletedStats] = useState<{
  total: number;
  thisWeek: number;
  thisMonth: number;
  byProject: { [key: string]: number };
}>();

// 加载统计信息
const loadCompletedStats = async () => {
  try {
    const taskService = appService.tasks;
    const stats = await taskService.getCompletedTasksStatistics();
    setCompletedStats(stats);
  } catch (error) {
    console.error('加载统计信息失败:', error);
  }
};

// 在服务层添加获取已完成任务统计信息的方法
public async getCompletedTasksStatistics(): Promise<{
  total: number;
  thisWeek: number;
  thisMonth: number;
  byProject: { [key: string]: number };
}> {
  const now = new Date();
  
  // 本周开始时间
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  
  // 本月开始时间
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // 查询总数
  const total = await this.dbService.taskDAO.countCompletedTasks();
  
  // 查询本周完成数
  const thisWeek = await this.dbService.taskDAO.countCompletedTasksInTimeRange({
    start: thisWeekStart.toISOString()
  });
  
  // 查询本月完成数
  const thisMonth = await this.dbService.taskDAO.countCompletedTasksInTimeRange({
    start: thisMonthStart.toISOString()
  });
  
  // 查询按项目分组的统计
  const byProject = await this.dbService.taskDAO.countCompletedTasksByProject();
  
  return { total, thisWeek, thisMonth, byProject };
}

// 在DAO层添加相应的方法
async countCompletedTasks(): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count FROM ${this.tableName} 
    WHERE is_deleted_locally = 0 
    AND status = 'completed'
  `;
  
  const result = await this.dbManager.getFirstAsync<{ count: number }>(sql);
  return result?.count || 0;
}

async countCompletedTasksInTimeRange(timeRange: { start?: string; end?: string }): Promise<number> {
  let sql = `
    SELECT COUNT(*) as count FROM ${this.tableName} 
    WHERE is_deleted_locally = 0 
    AND status = 'completed'
  `;
  const params: any[] = [];
  
  if (timeRange.start) {
    sql += ` AND completed_at >= ?`;
    params.push(timeRange.start);
  }
  
  if (timeRange.end) {
    sql += ` AND completed_at <= ?`;
    params.push(timeRange.end);
  }
  
  const result = await this.dbManager.getFirstAsync<{ count: number }>(sql, params);
  return result?.count || 0;
}

async countCompletedTasksByProject(): Promise<{ [key: string]: number }> {
  const sql = `
    SELECT p.id, p.name, COUNT(*) as count 
    FROM ${this.tableName} t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.is_deleted_locally = 0 
    AND t.status = 'completed'
    GROUP BY t.project_id
  `;
  
  const results = await this.dbManager.getAllAsync<{ id: string; name: string; count: number }>(sql);
  
  const byProject: { [key: string]: number } = {};
  results.forEach(result => {
    byProject[result.id] = result.count;
  });
  
  return byProject;
}

// 添加统计信息组件
const CompletedStatsCard = () => {
  if (!completedStats) return null;
  
  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>完成统计</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedStats.total}</Text>
          <Text style={styles.statLabel}>总计</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedStats.thisWeek}</Text>
          <Text style={styles.statLabel}>本周</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedStats.thisMonth}</Text>
          <Text style={styles.statLabel}>本月</Text>
        </View>
      </View>
    </View>
  );
};

// 在已完成标签页中添加统计信息
{activeTab === 'completed' && (
  <>
    <TimeRangeSelector />
    <ProjectSelector />
    <CompletedStatsCard />
  </>
)}
```

### 3.4 优化交互体验

#### 3.4.1 批量操作功能

在已完成标签页添加批量操作功能：

```typescript
// 添加批量操作状态
const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
const [batchMode, setBatchMode] = useState(false);

// 添加批量操作方法
const toggleTaskSelection = (taskId: string) => {
  setSelectedTasks(prev => {
    if (prev.includes(taskId)) {
      return prev.filter(id => id !== taskId);
    } else {
      return [...prev, taskId];
    }
  });
};

const handleBatchDelete = async () => {
  if (selectedTasks.length === 0) return;
  
  Alert.alert(
    '批量删除',
    `确定要删除选中的 ${selectedTasks.length} 个任务吗？`,
    [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const taskService = appService.tasks;
            await taskService.batchDelete(selectedTasks);
            setSelectedTasks([]);
            setBatchMode(false);
            loadTasks();
            Alert.alert('成功', `已删除 ${selectedTasks.length} 个任务`);
          } catch (error) {
            console.error('批量删除失败:', error);
            Alert.alert('错误', '批量删除失败，请重试');
          }
        }
      }
    ]
  );
};

// 修改任务卡片组件，支持批量选择
const TaskCard = ({ task, onToggle }) => (
  <TouchableOpacity
    key={task.id}
    style={styles.taskCard}
    onPress={() => batchMode ? toggleTaskSelection(task.id) : router.push(`/task/${task.id}`)}
    onLongPress={() => {
      if (!batchMode) {
        setBatchMode(true);
        toggleTaskSelection(task.id);
      }
    }}
  >
    {batchMode ? (
      <TouchableOpacity
        style={[
          styles.checkbox,
          selectedTasks.includes(task.id) && styles.checkedBox
        ]}
        onPress={() => toggleTaskSelection(task.id)}
      >
        {selectedTasks.includes(task.id) && (
          <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
        )}
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        style={[styles.checkbox, task.completed && styles.checkedBox]}
        onPress={() => onToggle(task.id)}
      >
        {task.completed && (
          <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
        )}
      </TouchableOpacity>
    )}
    
    {/* 任务内容 */}
    <View style={styles.taskContent}>
      {/* ... 其他任务内容 ... */}
    </View>
  </TouchableOpacity>
);

// 添加批量操作工具栏
const BatchActionBar = () => {
  if (!batchMode) return null;
  
  return (
    <View style={styles.batchActionBar}>
      <View style={styles.batchActionInfo}>
        <Text style={styles.batchActionText}>
          已选择 {selectedTasks.length} 项
        </Text>
      </View>
      <View style={styles.batchActions}>
        <TouchableOpacity
          style={styles.batchAction}
          onPress={() => {
            setBatchMode(false);
            setSelectedTasks([]);
          }}
        >
          <MaterialCommunityIcons name="close" size={20} color={COLORS.gray500} />
          <Text style={styles.batchActionButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.batchAction}
          onPress={handleBatchDelete}
          disabled={selectedTasks.length === 0}
        >
          <MaterialCommunityIcons name="delete" size={20} color={COLORS.danger} />
          <Text style={[styles.batchActionButtonText, { color: COLORS.danger }]}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 在UI中添加批量操作工具栏
{batchMode && <BatchActionBar />}
```

## 4. 实施检查清单

### 4.1 数据库层修改

1. [修改 `task-dao.ts` 中的 `findCompletedTasks` 方法，支持分页、时间范围筛选、项目筛选和搜索功能]
2. [添加 `countCompletedTasks`、`countCompletedTasksInTimeRange` 和 `countCompletedTasksByProject` 方法，用于统计信息]

### 4.2 服务层修改

1. [修改 `task-service.ts` 中的 `getCompletedTasks` 方法，支持分页、筛选和搜索功能]
2. [添加 `getCompletedTasksStatistics` 方法，获取已完成任务的统计信息]
3. [添加或修改 `batchDelete` 方法，支持批量删除功能]

### 4.3 UI层修改

1. [修改 `app/(tabs)/index.tsx` 中的 `TodoScreen` 组件，添加分页加载逻辑]
2. [添加时间范围筛选组件 `TimeRangeSelector`]
3. [添加项目筛选组件 `ProjectSelector`]
4. [添加搜索组件 `SearchBar`]
5. [修改任务卡片组件，显示完成时间]
6. [添加统计信息组件 `CompletedStatsCard`]
7. [添加批量操作功能，包括批量选择和批量删除]
8. [添加相应的样式定义]

### 4.4 性能优化

1. [使用 `FlatList` 替代 `ScrollView`，优化大量数据的渲染性能]
2. [实现虚拟列表，只渲染可见区域的任务卡片]
3. [优化数据库查询，添加适当的索引]

### 4.5 测试与验证

1. [测试分页加载功能，验证「加载更多」按钮的正确性]
2. [测试时间范围筛选功能，验证不同时间范围的筛选结果]
3. [测试项目筛选功能，验证按项目分组显示的正确性]
4. [测试搜索功能，验证按标题和描述搜索的正确性]
5. [测试统计信息的准确性]
6. [测试批量操作功能，验证批量选择和批量删除的正确性]
7. [测试性能，验证在大量数据情况下的响应速度]

## 5. 优先级建议

根据用户需求和实现复杂度，建议按以下优先级实施：

1. **高优先级**：分页加载机制和时间范围筛选（基础功能，提升用户体验）
2. **中优先级**：项目类别筛选和搜索功能（增强用户体验）
3. **中优先级**：丰富信息展示（完成时间和统计信息）
4. **低优先级**：批量操作功能（高级功能，可后期实现）
5. **低优先级**：虚拟列表优化（性能优化，可根据实际使用情况决定是否实现）