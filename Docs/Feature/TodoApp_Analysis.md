# 待办记事页面功能分析报告

## 概述
待办记事页面是应用的核心功能模块，位于 `app/(tabs)/index.tsx`，提供三个主要标签页：**今天**、**全部**、**已完成**。该页面采用现代化的React Native设计，集成了完整的任务管理功能。

## 三个标签页功能详解

### 1. "今天" 标签页 (today)
**功能目的**: 显示当日需要处理的任务，帮助用户专注于今日要务

**数据源**:
- 调用 `TaskService.getTodayTasks()` 方法
- 对应数据库查询: `TaskDAO.findTodayTasks()`

**筛选逻辑**:
```sql
SELECT * FROM tasks 
WHERE is_deleted_locally = 0 
AND (
  (due_date >= startOfDay AND due_date < endOfDay) 
  OR status = 'in_progress'
)
ORDER BY priority DESC, due_date ASC, sort_order ASC
```

**包含任务类型**:
- 截止日期为今天的任务
- 状态为"进行中"的任务（无论截止日期）

### 2. "全部" 标签页 (all)
**功能目的**: 显示所有未完成的活跃任务，提供完整的任务列表视图

**数据源**:
- 调用 `TaskService.getActiveTasks()` 方法
- 对应数据库查询: `TaskDAO.findActiveTasks()`

**筛选逻辑**:
```sql
SELECT * FROM tasks 
WHERE is_deleted_locally = 0 
AND status NOT IN ('completed', 'cancelled')
ORDER BY priority DESC, due_date ASC, sort_order ASC
```

**包含任务类型**:
- 所有未删除的任务
- 排除状态为"已完成"和"已取消"的任务
- 包含状态：未开始、进行中、延期、暂停、等待中

### 3. "已完成" 标签页 (completed)
**功能目的**: 显示已完成的任务历史，提供成就感和历史记录查看

**数据源**:
- 调用 `TaskService.getCompletedTasks(50)` 方法
- 对应数据库查询: `TaskDAO.findCompletedTasks(limit)`

**筛选逻辑**:
```sql
SELECT * FROM tasks 
WHERE is_deleted_locally = 0 
AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 50
```

**特点**:
- 最多显示最近50个已完成任务
- 按完成时间倒序排列（最新完成的在前）

## 核心功能组件

### 1. 状态管理
```typescript
const [activeTab, setActiveTab] = useState<'today' | 'all' | 'completed'>('today');
const [tasks, setTasks] = useState<TaskDTO[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
```

### 2. 数据加载机制
- **useFocusEffect**: 页面获得焦点时自动刷新数据
- **useEffect**: 标签页切换时重新加载对应数据
- **handleRefresh**: 手动下拉刷新功能

### 3. 任务交互功能
- **toggleTask**: 切换任务完成状态（复选框点击）
- **任务详情导航**: 点击任务卡片跳转到详情页面
- **创建新任务**: 右下角浮动按钮

## 任务卡片显示信息

每个任务卡片包含以下信息：
- **复选框**: 可点击切换完成状态
- **任务标题**: 支持删除线样式（已完成任务）
- **状态徽章**: 彩色标识当前任务状态
- **时间信息**: 显示截止时间或"无时间限制"
- **优先级指示**: 彩色圆点表示优先级（高/中/低）
- **项目归属**: 显示所属项目名称
- **任务描述**: 最多显示两行描述内容

## 任务状态枚举
```typescript
type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 
                  'cancelled' | 'postponed' | 'paused' | 'waiting';
```

每种状态都有对应的：
- 中文标签（未开始、进行中、已完成等）
- 主题色彩
- 图标标识

## 优先级系统
```typescript
type Priority = 'high' | 'medium' | 'low';
```
- **高优先级**: 红色标识
- **中优先级**: 橙色标识  
- **低优先级**: 绿色标识

## 统计信息功能
页面支持显示任务统计信息（可选开启）：
- 总任务数、已完成数、进行中数、逾期数
- 优先级分布图表
- 统计卡片可点击跳转到对应筛选视图

## 技术架构

### 数据流向
1. **UI层**: `TodoScreen` 组件
2. **服务层**: `TaskService` 业务逻辑
3. **数据访问层**: `TaskDAO` 数据库操作
4. **数据库**: SQLite 存储

### 关键文件位置
- 主组件: `app/(tabs)/index.tsx`
- 服务层: `lib/services/task-service.ts`
- 数据访问: `lib/database/task-dao.ts`
- 类型定义: `lib/models/types.ts`

## 性能优化策略
- 分页加载已完成任务（限制50条）
- 按优先级和时间排序减少查询负担
- 使用事务保证数据一致性
- 焦点刷新机制确保数据实时性

## 用户体验设计
- 直观的标签页切换
- 空状态提示和引导
- 加载状态指示
- 下拉刷新支持
- 浮动操作按钮便于快速创建任务
- 卡片式设计提供良好的视觉层次

该功能设计完整、架构清晰，很好地平衡了功能性和用户体验。 