# 山记事 App - UI设计系统文档

**版本:** 1.0  
**日期:** 2025-01-27  
**技术栈:** Expo + React Native + TypeScript + Tailwind CSS  
**目标平台:** Android (主要), iOS (扩展), Web (未来)

## 目录
1. [设计原则](#1-设计原则)
2. [色彩系统](#2-色彩系统)
3. [字体系统](#3-字体系统)
4. [图标系统](#4-图标系统)
5. [组件库](#5-组件库)
6. [布局系统](#6-布局系统)
7. [动效与交互](#7-动效与交互)
8. [页面架构](#8-页面架构)
9. [响应式设计](#9-响应式设计)
10. [技术实现指南](#10-技术实现指南)

---

## 1. 设计原则

### 1.1 核心设计理念
- **简洁高效:** 界面干净整洁，操作简单直观
- **现代美观:** 采用 Material Design 3 (Android) 和 iOS Human Interface Guidelines (iOS) 设计规范
- **平台优先:** 优先考虑 Android 平台的设计和用户体验，再进行 iOS 适配。
- **一致性:** 跨页面的视觉和交互统一，同时尊重平台原生体验。
- **可访问性:** 考虑不同用户的使用需求。
- **本地优先:** 强调数据隐私和本地存储的价值。

### 1.2 设计价值观
- **用户至上:** 以用户体验为中心的设计决策
- **数据安全:** 视觉传达数据隐私保护的重要性
- **灵活自由:** 提供个性化定制选项
- **跨平台一致:** 确保不同设备上的体验统一

---

## 2. 色彩系统

### 2.1 主色调配置
```css
/* 以下为设计文档中的CSS变量，实际项目中在 constants/theme.ts (或类似文件) 中通过JavaScript对象管理 */
:root {
  /* 主色系 */
  --primary-color: #5271FF;        /* 主蓝色 - 品牌色 (对应代码中 COLORS.primary) */
  --primary-50: #EEF2FF;           /* 最浅蓝 */
  --primary-100: #E0E7FF;          /* 很浅蓝 */
  --primary-500: #5271FF;          /* 标准蓝 (对应代码中 COLORS.primary) */
  --primary-600: #4663E6;          /* 深蓝 */
  --primary-700: #3B54CC;          /* 更深蓝 */
  
  /* 辅助色系 */
  --accent-color: #FF7052;         /* 橙红色 - 强调色 (对应代码中 COLORS.accent) */
  --accent-50: #FFF7F5;            /* 最浅橙 */
  --accent-500: #FF7052;           /* 标准橙 (对应代码中 COLORS.accent) */
  --accent-600: #E6633F;           /* 深橙 */
  
  /* 中性色系 */
  --bg-color: #F5F7FA;             /* 页面背景色 (对应代码中 COLORS.bgColor 或 COLORS.background) */
  --text-color: #333333;           /* 主文本色 (对应代码中 COLORS.textColor 或 COLORS.text) */
  --text-secondary: #6B7280;       /* 次要文本色 (对应代码中 COLORS.textSecondary 或 COLORS.gray700) */
  --text-disabled: #9CA3AF;        /* 禁用文本色 (对应代码中 COLORS.textDisabled 或 COLORS.gray400) */
  --border-color: #E5E7EB;         /* 边框色 (对应代码中 COLORS.border 或 COLORS.gray200) */
  --card-bg: #FFFFFF;              /* 卡片背景色 (对应代码中 COLORS.cardBg 或 COLORS.white) */
  
  /* 功能色系 */
  --success: #10B981;              /* 成功绿 (对应代码中 COLORS.success 或 COLORS.green500) */
  --warning: #F59E0B;              /* 警告黄 (对应代码中 COLORS.warning 或 COLORS.yellow500) */
  --error: #EF4444;                /* 错误红 (对应代码中 COLORS.error 或 COLORS.danger 或 COLORS.red500) */
  --info: #3B82F6;                 /* 信息蓝 (对应代码中 COLORS.info 或 COLORS.blue500) */
  
  /* 优先级色系 (代码中已使用) */
  --high-priority: #E53935;        /* 高优先级红 (对应代码中 COLORS.highPriority) */
  --medium-priority: #FB8C00;      /* 中优先级橙 (对应代码中 COLORS.mediumPriority) */
  --low-priority: #43A047;         /* 低优先级绿 (对应代码中 COLORS.lowPriority) */
}
```
*注: 代码中实际使用的颜色常量名可能与上述CSS变量名有所不同，如 `COLORS.primary` 对应 `--primary-color`。具体映射见 `constants/theme.ts`。*

### 2.2 色彩应用规则
- **主色调:** 用于主要操作按钮、链接、选中状态
- **辅助色:** 用于次要操作、提示信息、装饰元素
- **中性色:** 用于文本、背景、边框等基础元素
- **功能色:** 用于状态提示、反馈信息
- **优先级色:** 用于任务优先级标识

---

## 3. 字体系统

### 3.1 字体族配置
```css
font-family: 'Roboto', 'San Francisco', 'PingFang SC', sans-serif;
```

### 3.2 字体规格
| 用途 | 大小 | 行高 | 字重 | Tailwind Class (参考) | React Native Style (示例) |
|------|------|------|------|-----------------------|---------------------------|
| 大标题 | 32px | 40px | 700 | `text-3xl font-bold`  | `{ fontSize: 32, fontWeight: 'bold' }` |
| 页面标题 | 24px | 32px | 700 | `text-xl font-bold`   | `{ fontSize: 24, fontWeight: 'bold' }` (e.g. `styles.headerTitle` in `app/(tabs)/index.tsx`) |
| 副标题 | 20px | 28px | 600 | `text-lg font-semibold` | `{ fontSize: 20, fontWeight: '600' }` (e.g. `styles.sectionTitle` in `app/(tabs)/index.tsx`) |
| 正文 | 16px | 24px | 400 | `text-base`           | `{ fontSize: 16 }` (e.g. `styles.taskTitle` in `app/(tabs)/index.tsx`) |
| 小标题 | 14px | 20px | 500 | `text-sm font-medium` | `{ fontSize: 14, fontWeight: '500' }` (e.g. `styles.statCardTitle` in `app/(tabs)/index.tsx`) |
| 说明文字 | 12px | 16px | 400 | `text-xs`             | `{ fontSize: 12 }` (e.g. `styles.statusText` in `app/(tabs)/index.tsx`) |
| 按钮文字 | 16px | 24px | 500 | `text-base font-medium` | `{ fontSize: 16, fontWeight: '500' }` |

*注: Tailwind CSS类名主要用于Web端或特定转换库。React Native中直接使用StyleSheet定义样式。*

### 3.3 文字色彩层级
- **主要文本:** `text-gray-900` (#111827)
- **次要文本:** `text-gray-700` (#374151)
- **辅助文本:** `text-gray-500` (#6B7280)
- **禁用文本:** `text-gray-400` (#9CA3AF)
- **品牌文本:** `text-primary` (#5271FF)

---

## 4. 图标系统

### 4.1 图标库选择
- **主要图标库:** @expo/vector-icons (推荐使用 MaterialCommunityIcons 或 Ionicons)
- **图标风格:** 优先采用 Material Design 风格，兼顾 iOS Human Interface Guidelines

### 4.2 平台适配
- **Android:** 优先使用 MaterialCommunityIcons 或 MaterialIcons，遵循 Material Design 3 图标规范。
- **iOS:** 优先使用 Ionicons 或 AntDesign，遵循 Apple Human Interface Guidelines。
- **跨平台:** 对于通用图标，选择在两个平台视觉效果一致的图标。

### 4.3 图标规格
| 用途 | 大小 (px) | React Native Size Prop | Icon Library Example (MaterialCommunityIcons) |
|------|-----------|------------------------|-----------------------------------------------|
| 导航图标 | 24        | `size={24}`            | `name="checkbox-marked-outline"` (tab icon) |
| 操作图标 | 20-24     | `size={20}` or `size={24}` | `name="plus"` (FAB), `name="pencil"` (edit)   |
| 内容图标 | 16-20     | `size={16}` or `size={20}` | `name="check"` (checkbox in task item)        |
| 状态图标 | 18-24     | `size={18}` or `size={24}` | `name="clock-outline"` (status badge icon)    |
| 装饰图标 | 12-16     | `size={12}` or `size={16}` |                                               |

### 4.4 核心图标映射
```typescript
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// 实际使用中，可以直接在组件中引用 MaterialCommunityIcons 等
// 以下为基于 app/(tabs)/index.tsx 和 app/task/[id].tsx 的示例
const ICONS_IN_USE = {
  // 导航类 (Bottom Tab Navigator in (tabs)/_layout.tsx)
  tasks: { android: 'checkbox-marked-circle-outline', ios: 'checkbox-marked-circle-outline' }, // 示例，实际可能是其他
  notes: { android: 'notebook-outline', ios: 'book-outline' }, // 示例
  settings: { android: 'cog-outline', ios: 'options-outline' }, // 示例
  search: { android: 'magnify', ios: 'search' }, // 示例
  
  // 操作类
  add: { default: 'plus' }, // FAB in app/(tabs)/index.tsx
  edit: { default: 'pencil' }, // Edit button in app/task/[id].tsx
  delete: { default: 'trash-can-outline' }, // Delete button in app/task/[id].tsx
  back: { default: 'arrow-left' }, // Back button in app/task/[id].tsx header
  close: { default: 'close' }, // Close modal button
  send: { default: 'send' }, // Send/Save button
  
  // 状态与交互 (app/(tabs)/index.tsx, app/task/[id].tsx)
  check: { default: 'check' }, // Inside completed checkbox
  checkboxMarked: { default: 'checkbox-marked' },
  checkboxBlankOutline: { default: 'checkbox-blank-outline' },
  chevronRight: { default: 'chevron-right' }, // For navigation in items
  chevronDown: { default: 'chevron-down' }, // For dropdowns
  chevronUp: { default: 'chevron-up' },
  filter: { default: 'filter-variant' }, // Filter button in header
  moreVertical: { default: 'dots-vertical' }, // More options menu
  playCircleOutline: { default: 'play-circle-outline' }, // Status: in_progress
  checkCircleOutline: { default: 'check-circle-outline' }, // Status: completed
  closeCircleOutline: { default: 'close-circle-outline' }, // Status: cancelled
  pauseCircleOutline: { default: 'pause-circle-outline' }, // Status: postponed/paused
  clockOutline: { default: 'clock-outline' }, // Status: not_started
  clockAlertOutline: { default: 'clock-alert-outline' }, // Status: waiting
  helpCircleOutline: { default: 'help-circle-outline' }, // Status: unknown
  play: { default: 'play' }, // Timer start
  pause: { default: 'pause' }, // Timer pause
  calendar: { default: 'calendar-month-outline' }, // Date picker icon
  bellOutline: { default: 'bell-outline' }, // Reminder icon

  // 统计卡片图标 (app/(tabs)/index.tsx)
  chartLine: { default: 'chart-line' }, // Total tasks
  checkAll: { default: 'check-all' }, // Completed tasks
  progressWrench: { default: 'progress-wrench' }, // In-progress tasks
  alertOctagon: { default: 'alert-octagon-outline' }, // Overdue tasks
  
  // 其他常用
  arrowLeftThin: { default: 'arrow-left-thin' },
  magnify: { default: 'magnify'},
  cog: { default: 'cog' },
  // ... more icons as identified in code
}
```

---

## 5. 组件库

### 5.1 按钮组件 (Button)

#### 主要按钮 (Primary Button)
*   **React Native 实现示例:** `TouchableOpacity` 结合自定义样式。
    ```tsx
    // Example: FAB in app/(tabs)/index.tsx
    <TouchableOpacity style={styles.fab} onPress={() => router.push('/task/create')}>
      <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
    </TouchableOpacity>
    ```
    ```javascript
    // styles.fab
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4, // Android shadow
      shadowColor: COLORS.black, // iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    }
    ```

#### 次要按钮 (Secondary Button)
*   **React Native 实现示例:** `TouchableOpacity` 结合边框和文本颜色。
    ```tsx
    // Example: Filter button in app/(tabs)/index.tsx header
    <TouchableOpacity style={styles.headerButton} onPress={() => { /* Toggle filter */ }}>
      <MaterialCommunityIcons name="filter-variant" size={24} color={COLORS.primary} />
    </TouchableOpacity>
    ```
    ```javascript
    // styles.headerButton
    headerButton: {
      padding: 8,
    }
    ```

#### 文本按钮 (Text Button)
*   **React Native 实现示例:** `TouchableOpacity` 内含 `Text` 组件。
    ```tsx
    // Example: Status change option in app/task/[id].tsx modal
    <TouchableOpacity onPress={() => handleStatusChange(newStatus)} style={styles.modalOption}>
      <Text style={styles.modalOptionText}>{statusConfig[newStatus].label}</Text>
    </TouchableOpacity>
    ```
    ```javascript
    // styles.modalOption & styles.modalOptionText
    modalOption: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.gray200,
    },
    modalOptionText: {
      fontSize: 16,
      color: COLORS.primary,
      textAlign: 'center',
    }
    ```

### 5.2 卡片组件 (Card)

#### 基础卡片
*   **React Native 实现示例:** `View` 结合背景色、边框、圆角、阴影。

#### 任务卡片 (Task Card)
*   **React Native 实现示例:** `app/(tabs)/index.tsx` 中的 `styles.taskCard`。
    ```tsx
    <TouchableOpacity
      key={task.id}
      style={styles.taskCard}
      onPress={() => router.push(`/task/${task.id}`)}
    >
      {/* ... content ... */}
    </TouchableOpacity>
    ```
    ```javascript
    // styles.taskCard
    taskCard: {
      backgroundColor: COLORS.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.gray200,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    ```

### 5.3 导航组件 (Navigation)

#### 底部导航栏
```css
.bottom-nav {
  @apply h-16 flex justify-around items-center px-6;
  @apply bg-white border-t border-gray-200;
}

.nav-item {
  @apply flex flex-col items-center;
  @apply text-gray-500 text-xs;
}

.nav-item.active {
  @apply text-primary;
}
```

#### 顶部导航栏
```css
.top-nav {
  @apply px-6 pt-12 pb-4 flex items-center justify-between;
  @apply bg-white;
}
```

### 5.4 输入组件 (Input)

#### 文本输入框
*   **React Native 实现示例:** `TextInput` 组件。
    ```tsx
    // Example: Edit task title in app/task/[id].tsx modal
    <TextInput
      style={styles.input}
      value={editableTitle}
      onChangeText={setEditableTitle}
      placeholder="任务标题"
    />
    ```
    ```javascript
    // styles.input (from app/task/[id].tsx)
    input: {
      borderWidth: 1,
      borderColor: COLORS.gray300,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 12,
      backgroundColor: COLORS.white,
    },
    ```

### 5.5 状态组件

#### 优先级标识
*   **React Native 实现示例:** `app/task/[id].tsx` 中的 `PriorityBadge` 组件。
    `app/(tabs)/index.tsx` 中的 `getPriorityColor`, `getPriorityText` 和 `styles.priorityIndicator`。
    ```tsx
    // In app/task/[id].tsx
    <PriorityBadge priority={task.priority} />
    ```
    ```javascript
    // styles.priorityBadge & styles.priorityText (from app/task/[id].tsx)
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    priorityText: {
      fontSize: 10,
      fontWeight: 'bold',
    },
    // styles.priorityIndicator (from app/(tabs)/index.tsx - a simpler version)
    priorityIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    ```

#### 同步状态 (Conceptual - UI implementation may vary)

#### 状态标签 (Task Status Badge)
*   **React Native 实现示例:** `app/(tabs)/index.tsx` 中的 `styles.statusBadge` 和 `getStatusConfig` 函数。
    `app/task/[id].tsx` 中的 `StatusBadge` 组件。
    ```tsx
    // In app/(tabs)/index.tsx
    <View style={[
      styles.statusBadge, 
      { backgroundColor: getStatusConfig(task.status).color + '30' } // Added opacity
    ]}>
      <MaterialCommunityIcons name={getStatusConfig(task.status).icon as any} size={12} color={getStatusConfig(task.status).color} />
      <Text style={[styles.statusTextSmall, { color: getStatusConfig(task.status).color }]}>
        {getStatusConfig(task.status).label}
      </Text>
    </View>
    ```
    ```javascript
    // styles.statusBadge & styles.statusTextSmall (from app/(tabs)/index.tsx)
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      // backgroundColor set dynamically
    },
    statusTextSmall: {
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
      // color set dynamically
    },
    ```
    ```tsx
    // In app/task/[id].tsx
    <StatusBadge status={task.status} />
    ```
    ```javascript
    // styles.statusBadge & styles.statusText (from app/task/[id].tsx)
    statusBadge: { // This is for the StatusBadge component
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusText: { // This is for the StatusBadge component text
      fontSize: 12,
      fontWeight: 'bold',
    },
    ```

### 5.6 浮动操作按钮 (FAB)
```css
.fab {
  @apply fixed bottom-20 right-5 w-14 h-14;
  @apply bg-primary rounded-full;
  @apply flex items-center justify-center;
  @apply text-white shadow-lg;
  @apply hover:bg-primary-600 active:bg-primary-700;
}
```

---

## 6. 布局系统

### 6.1 设备适配框架
```css
/* iPhone 16 Pro 规格 */
.device-frame {
  width: 375px;
  height: 812px;
  border-radius: 44px;
  padding: 18px;
}

.screen-content {
  @apply w-full h-full rounded-3xl overflow-hidden;
  @apply flex flex-col relative;
}
```

### 6.2 安全区域处理
```css
.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 6.3 状态栏设计
```css
.status-bar {
  @apply h-11 flex justify-between items-center px-5;
  @apply absolute top-0 left-0 right-0 z-50;
}

.dynamic-island {
  @apply absolute top-2.5 left-1/2 transform -translate-x-1/2;
  @apply w-30 h-7.5 bg-black rounded-2xl z-50;
}
```

### 6.4 页面布局模板
```css
.page-layout {
  @apply h-full flex flex-col;
}

.page-header {
  @apply pt-11 px-6 pb-4 bg-white;
}

.page-content {
  @apply flex-1 overflow-y-auto;
}

.page-footer {
  @apply bg-white border-t border-gray-200;
}
```

---

## 7. 动效与交互

### 7.1 过渡动画
```css
/* 基础过渡 */
.transition-base {
  @apply transition-all duration-200 ease-in-out;
}

/* 按钮点击效果 */
.btn-press {
  @apply transform active:scale-95 transition-transform duration-100;
}

/* 卡片悬停效果 */
.card-hover {
  @apply transition-shadow duration-200 hover:shadow-md;
}
```

### 7.2 加载状态
```css
.loading-spinner {
  @apply animate-spin rounded-full h-6 w-6;
  @apply border-2 border-gray-300 border-t-primary;
}

.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}
```

### 7.3 手势交互
- **点击反馈:** 按钮缩放效果
- **长按操作:** 上下文菜单
- **滑动删除:** 任务列表项
- **下拉刷新:** 数据同步

---

## 8. 页面架构

### 8.1 页面层级结构
```
App
├── 启动页 (SplashScreen)
├── 引导页 (OnboardingScreen)
├── 主页面 (MainTabs)
│   ├── 待办事项 (TodoScreen)
│   ├── 笔记 (NotesScreen)
│   └── 设置 (SettingsScreen)
├── 任务相关
│   ├── 任务创建/编辑 (TaskFormScreen)
│   ├── 任务详情 (TaskDetailScreen)
│   └── 清单管理 (ProjectsScreen)
├── 笔记相关
│   ├── 笔记编辑 (NoteEditorScreen)
│   └── 笔记本管理 (NotebooksScreen)
├── 搜索 (SearchScreen)
└── 同步设置 (SyncSettingsScreen)
```

### 8.2 导航结构
```typescript
// Expo Router 文件结构
app/
├── _layout.tsx              // 根布局
├── (onboarding)/
│   ├── _layout.tsx
│   ├── splash.tsx
│   └── welcome.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx           // 待办事项
│   ├── notes.tsx
│   └── settings.tsx
├── task/
│   ├── create.tsx
│   ├── [id].tsx           // 任务详情
│   └── edit/[id].tsx
├── note/
│   ├── create.tsx
│   ├── [id].tsx
│   └── edit/[id].tsx
└── search.tsx
```

### 8.3 页面状态管理
```typescript
// 页面状态类型
interface PageState {
  loading: boolean;
  error: string | null;
  data: any;
  refreshing: boolean;
}

// 通用页面Hook
const usePageState = () => {
  // 状态管理逻辑
}
```

---

## 9. 响应式设计

### 9.1 断点系统
```css
/* Tailwind 断点 */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */
```

### 9.2 平台优先与响应式设计
- **Android 优先:** 设计和开发流程优先考虑 Android 设备的特点和 Material Design 3 规范。
- **基础尺寸:** 针对主流 Android 手机尺寸进行设计。
- **最小支持:** 确保在最小支持的 Android 设备上可用。
- **平板适配:** 考虑 Android 平板电脑的布局和交互。
- **iOS 适配:** 在完成 Android 设计后，根据 iOS Human Interface Guidelines 进行适配和调整。
- **桌面扩展:** 1024px+

### 9.3 组件响应式规则
```css
.responsive-container {
  @apply px-4 sm:px-6 md:px-8;
  @apply max-w-sm mx-auto md:max-w-2xl;
}

.responsive-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
  @apply gap-4 md:gap-6;
}
```

---

## 10. 技术实现指南

### 10.1 设计系统常量统一管理

项目确实在 `constants/` 目录下管理颜色等常量，如 `app/(tabs)/index.tsx` 中导入 `import { COLORS } from '../../constants';`。
具体的文件名可能是 `theme.ts` 或 `index.ts` 内直接定义。

#### 主题常量定义 (示例，具体路径和结构需核实 constants/index.ts 或 constants/theme.ts)
```typescript
// constants/theme.ts (or similar)
export const COLORS = {
  primary: '#5271FF', // 主蓝色
  accent: '#FF7052',  // 橙红色
  
  bgColor: '#F5F7FA', // 页面背景色
  // ... other colors used in app/(tabs)/index.tsx & app/task/[id].tsx
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  // ... and so on for all grays, success, warning, danger, info
  highPriority: '#E53935', // 实际使用，例如 styles.priorityHigh
  mediumPriority: '#FB8C00', // 实际使用，例如 styles.priorityMedium
  lowPriority: '#43A047', // 实际使用，例如 styles.priorityLow
  success: '#10B981', // 实际使用，例如 statusConfig.completed.color
  warning: '#F59E0B', // 实际使用，例如 statusConfig.postponed.color
  danger: '#EF4444',  // 实际使用，例如 statusConfig.cancelled.color
  // ... etc.
};

// FONT_SIZE, SPACING, etc., would also be defined here if used consistently
// For example, if styles.title uses a constant FONT_SIZE.xl

const theme = {
  COLORS,
  // FONT_SIZE,
  // SPACING,
  // ...
};

export default theme;
```

### 10.2 Expo + React Native 实现

#### Tailwind CSS 配置
```typescript
// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          500: '#5271FF',
          600: '#4663E6',
          700: '#3B54CC',
        },
        accent: {
          500: '#FF7052',
          600: '#E6633F',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
```

#### 组件实现策略
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'text';
  size: 'sm' | 'md' | 'lg';
  onPress: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, size, onPress, children }) => {
  // 组件实现
}
```

### 10.2 样式优化策略

#### 性能优化
- 使用 StyleSheet.create() 预编译样式
- 避免内联样式频繁重计算
- 合理使用 memo 和 useMemo

#### 主题切换
```typescript
// hooks/useTheme.ts
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return { theme, toggleTheme };
}
```

### 10.3 图标实现
代码中直接使用 `@expo/vector-icons` 中的 `MaterialCommunityIcons`，而不是通过一个统一的 `Icon` 组件。

```typescript
// Example from app/(tabs)/index.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Direct usage:
<MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />

// Example from app/task/[id].tsx (StatusBadge component)
// const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
//   const config = statusConfig[status];
//   return (
//     <View style={[styles.statusDisplayBadge, { backgroundColor: config.color + '20' }]}>
//       <MaterialCommunityIcons name={config.icon as any} size={14} color={config.color} />
//       <Text style={[styles.statusDisplayText, { color: config.color }]}>{config.label}</Text>
//     </View>
//   );
// };
```
如果未来需要更统一的图标管理或自定义图标，可以引入文档中建议的 `Icon.tsx` 组件。

### 10.4 状态管理集成
```typescript
// store/ui.ts (使用 Zustand)
interface UIState {
  theme: 'light' | 'dark';
  loading: boolean;
  activeTab: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: string) => void;
}

const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  loading: false,
  activeTab: 'todos',
  setTheme: (theme) => set({ theme }),
  setLoading: (loading) => set({ loading }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
```

### 10.5 数据同步系统架构

#### 10.5.1 全局数据同步Context
```typescript
// app/contexts/DataSyncContext.tsx
interface DataSyncState {
  tasksDataDirty: boolean;
  projectsDataDirty: boolean; 
  notesDataDirty: boolean;
  statisticsDataDirty: boolean;
}

interface DataSyncContextType {
  syncState: DataSyncState;
  markTasksDataDirty: () => void;
  clearTasksDataDirty: () => void;
  // ... 其他方法
}

export const DataSyncProvider: React.FC = ({ children }) => {
  // 实现数据同步状态管理
  // 使用"脏数据"标记策略避免不必要的数据库访问
};

export const useTaskDataSync = () => {
  // 专门用于任务数据同步的便捷Hook
};
```

#### 10.5.2 服务层数据同步集成
```typescript
// lib/services/task-service.ts
export class TaskService {
  private dataSyncCallback: DataSyncCallback | null = null;
  
  public setDataSyncCallback(callback: DataSyncCallback | null): void {
    this.dataSyncCallback = callback;
  }
  
  private notifyDataChange(): void {
    // 在数据修改操作后调用，通知UI层数据已变更
    if (this.dataSyncCallback) {
      this.dataSyncCallback();
    }
  }
  
  public async updateTask(id: string, updates: Partial<Task>): Promise<TaskDTO | null> {
    const task = await this.dbService.taskDAO.update(id, updates);
    if (!task) return null;
    this.notifyDataChange(); // 关键：通知数据变更
    return await this.convertToDTO(task);
  }
}
```

#### 10.5.3 UI层数据同步Hook
```typescript
// app/hooks/useTaskServiceSync.ts
export const useTaskServiceSync = () => {
  const { markTasksDataDirty } = useTaskDataSync();

  useEffect(() => {
    const taskService = TaskService.getInstance();
    
    // 设置数据同步回调
    taskService.setDataSyncCallback(() => {
      markTasksDataDirty();
    });

    return () => {
      taskService.setDataSyncCallback(null);
    };
  }, [markTasksDataDirty]);
};
```

#### 10.5.4 智能刷新策略
```typescript
// app/(tabs)/index.tsx
useFocusEffect(
  useCallback(() => {
    const loadData = async () => {
      // 智能刷新：只有在数据为脏或未初始化时才刷新
      const shouldForceRefresh = !isInitialized || isTasksDataDirty;
      
      if (activeTab === 'completed') {
        await loadCompletedTasks(shouldForceRefresh);
      } else {
        await loadTasks(shouldForceRefresh);
      }
      
      // 刷新后清除脏标记
      if (isTasksDataDirty) {
        clearTasksDataDirty();
      }
    };
    
    loadData();
  }, [activeTab, isInitialized, isTasksDataDirty, clearTasksDataDirty])
);
```

#### 10.5.5 数据同步优势
- **性能优化**：避免不必要的数据库查询和UI刷新
- **用户体验**：任务详情页修改后，返回主列表能看到即时更新
- **资源节省**：减少频繁的数据库访问和网络请求
- **状态一致性**：确保不同页面间的数据同步
- **可扩展性**：支持多种数据类型的同步管理（任务、项目、笔记、统计）

---

## 总结

本设计系统文档为山记事App提供了完整的UI/UX设计指南，基于Expo + React Native + TypeScript + Tailwind CSS技术栈，确保：

1. **一致性:** 统一的视觉语言和交互模式
2. **可维护性:** 结构化的组件库和样式系统
3. **可扩展性:** 灵活的主题系统和响应式设计
4. **性能优化:** 高效的样式管理和渲染策略
5. **跨平台兼容:** Android优先，iOS和Web可扩展

此文档将作为开发团队的设计指南，确保产品在视觉和交互上的高质量交付。